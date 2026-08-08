"""
短牌版可暫停續跑的 flop 批次 worker。跟 gtoworker.py 同一套機制（原子寫入、鎖檔、
checkpoint 續跑、SCENARIOS 增量合併），只是換成短牌的核心/情境/flop，寫到獨立的檔案/目錄，
不跟標準版互相干擾。

用法：
    python shortdeckworker.py     # 開始/接續處理 shortdeckjobs.json
    （Ctrl+C 可安全中斷，進度存 shortdeckcheckpoint/，下次執行接續）

原子寫入：jobs 清單、checkpoint（.npz）、結果 json 一律先寫 .tmp 再 os.replace，
所以任何時刻被中斷都不會留下寫到一半的檔案。萬一還是讀到壞掉的 checkpoint，
load_checkpoint() 會回 None 讓該筆工作從頭重算，而不是讓整個 worker 掛掉。
"""
import json
import os
import time

import numpy as np

import shortdecksolvecore as core
from shortdeckscenarios import SCENARIOS
from gtomanifestbuild import writemanifest

BASEDIR=os.path.dirname(os.path.abspath(__file__))
JOBS_FILE=os.path.join(BASEDIR, "shortdeckjobs.json")
RESULTS_DIR=os.path.join(BASEDIR, "shortdeckresults")
CKPT_DIR=os.path.join(BASEDIR, "shortdeckcheckpoint")
FLOPS_FILE=os.path.join(BASEDIR, "shortdeckflops_canonical.json")
LOCK_FILE=os.path.join(BASEDIR, "shortdeckworker.lock")
CHUNK = 100
FLOP_LIMIT = None   # 短牌只有 573 個 flop，先全開；要漸進試跑可設數字


def load_flops():
    if not os.path.exists(FLOPS_FILE):
        raise SystemExit("找不到 %s，請先執行 python shortdeckflops.py" % FLOPS_FILE)
    flops = json.load(open(FLOPS_FILE, encoding="utf-8"))
    if FLOP_LIMIT is not None:
        flops = flops[:FLOP_LIMIT]
    return flops


def gen_jobs():
    jobs = []
    flops = load_flops()
    for sc in SCENARIOS:
        for board in flops:
            jobs.append({
                "id": "%s_%s" % (sc["name"], "".join(board)),
                "board": board, "ooprange": sc["ooprange"], "iprange": sc["iprange"],
                "pot": sc["pot"], "stack": sc["stack"], "betsizes": sc["betsizes"],
                "raise": sc["raise"], "iters": 600, "status": "pending",
            })
    return jobs


def save_jobs(jobs):
    tmp = JOBS_FILE + ".tmp"
    json.dump(jobs, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(tmp, JOBS_FILE)


def load_jobs():
    if not os.path.exists(JOBS_FILE):
        jobs = gen_jobs()
        save_jobs(jobs)
        print("已產生工作清單 %s（%d 筆）" % (JOBS_FILE, len(jobs)))
        return jobs
    jobs = json.load(open(JOBS_FILE, encoding="utf-8"))
    existing = set(j["id"] for j in jobs)
    added = 0
    for j in gen_jobs():
        if j["id"] not in existing:
            jobs.append(j); added += 1
    if added:
        save_jobs(jobs)
        print("SCENARIOS 有新增，補了 %d 筆新工作" % added)
    return jobs


def ckpt_path(jid):
    return os.path.join(CKPT_DIR, jid + ".npz")


def save_checkpoint(jid, REG, STRAT, done_iters, E, conflict):
    os.makedirs(CKPT_DIR, exist_ok=True)
    payload = {"done_iters": np.array(done_iters), "E": E, "conflict": conflict}
    for name, arr in REG.items():
        payload["REG__" + name] = arr
    for name, arr in STRAT.items():
        payload["STRAT__" + name] = arr
    # 原子寫入：Ctrl+C 打在 savez 中間也不會留下半個壞掉的 .npz
    tmp=os.path.join(CKPT_DIR, jid + ".tmp.npz")
    np.savez(tmp, **payload)
    os.replace(tmp, ckpt_path(jid))


def load_checkpoint(jid):
    p = ckpt_path(jid)
    if not os.path.exists(p):
        return None
    out=None
    try:
        with np.load(p) as d:
            REG, STRAT={}, {}
            for k in d.files:
                if k.startswith("REG__"):
                    REG[k[5:]] = d[k]
                elif k.startswith("STRAT__"):
                    STRAT[k[7:]] = d[k]
            out={"done_iters": int(d["done_iters"]), "E": d["E"], "conflict": d["conflict"], "REG": REG, "STRAT": STRAT}
    except Exception as error:
        # 壞掉的 checkpoint 不該弄死整個 worker：丟掉它、這筆從頭重算
        print("  checkpoint %s 讀取失敗（%s），刪除後從頭重算" % (p, error))
        os.remove(p)
    return out


def solve_job(job):
    board = job["board"]
    boardset = set(board)
    oop = core.expand_range(job["ooprange"], boardset)
    ip = core.expand_range(job["iprange"], boardset)
    ck = load_checkpoint(job["id"])
    if ck is None:
        E, conflict = core.build_equity(oop, ip, board)
        root = core.build_tree(E, job["pot"], job["stack"], job["betsizes"], raisemult=3.0 if job["raise"] else 1.0)
        REG, STRAT, META = core.setup_state(root, len(oop), len(ip))
        done_iters = 0
    else:
        E, conflict = ck["E"], ck["conflict"]
        root = core.build_tree(E, job["pot"], job["stack"], job["betsizes"], raisemult=3.0 if job["raise"] else 1.0)
        _, _, META = core.setup_state(root, len(oop), len(ip))
        REG, STRAT = ck["REG"], ck["STRAT"]
        done_iters = ck["done_iters"]
        print("  從 checkpoint 接續：%d/%d" % (done_iters, job["iters"]))

    No, Ni = len(oop), len(ip)
    while done_iters < job["iters"]:
        step = min(CHUNK, job["iters"] - done_iters)
        core.solve_chunk(root, REG, STRAT, job["pot"], No, Ni, step, conflict)
        done_iters += step
        save_checkpoint(job["id"], REG, STRAT, done_iters, E, conflict)

    avg, EVNODE, U_root = core.finalize(root, REG, STRAT, META, job["pot"], No, Ni, conflict)
    valid = ~conflict
    ev_oop = float((U_root * valid).sum() / valid.sum()) if valid.sum() > 0 else 0.0
    nodes = {}
    for name, sig in avg.items():
        p, actions = META[name]
        combos = oop if p == core.OOP else ip
        nodes[name] = {
            "player": "OOP" if p == core.OOP else "IP",
            "actions": actions,
            "cells": core.aggregate_cells(combos, sig, actions),
            "ev": core.aggregate_ev(combos, EVNODE[name], actions),
        }
    os.makedirs(RESULTS_DIR, exist_ok=True)
    result = {
        "id": job["id"], "board": board, "pot": job["pot"], "stack": job["stack"],
        "betsizes": job["betsizes"], "iters": job["iters"],
        "oopcombos": No, "ipcombos": Ni,
        "evoop": round(ev_oop, 3), "evip": round(job["pot"] - ev_oop, 3),
        "ooprange": job["ooprange"], "iprange": job["iprange"],
        "nodes": nodes,
    }
    # 原子寫入：避免留下截斷的結果 json（build_manifest 會讀它）
    resultfile=os.path.join(RESULTS_DIR, job["id"] + ".json")
    tmp=resultfile + ".tmp"
    json.dump(result, open(tmp, "w", encoding="utf-8"), ensure_ascii=False)
    os.replace(tmp, resultfile)
    ckp = ckpt_path(job["id"])
    if os.path.exists(ckp):
        os.remove(ckp)


def build_manifest():
    # TASK-086：清單格式與寫檔邏輯集中在 gtomanifestbuild.py，與德州那邊
    # （gtomanifest.py）共用同一支。以前這裡自己抄了一份一模一樣的迴圈。
    if not os.path.isdir(RESULTS_DIR):
        return
    writemanifest(RESULTS_DIR, [s["name"] for s in SCENARIOS])


def pid_alive(pid):
    """該 pid 目前還活著嗎。Windows 用 OpenProcess 查（不能用 os.kill(pid,0)，
    Windows 的 os.kill 會直接終止那個行程），其他平台用 signal 0 探測。"""
    alive=False
    if pid > 0:
        if os.name == "nt":
            import ctypes
            PROCESS_QUERY_LIMITED_INFORMATION=0x1000
            handle=ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
            if handle:
                exitcode=ctypes.c_ulong()
                ok=ctypes.windll.kernel32.GetExitCodeProcess(handle, ctypes.byref(exitcode))
                ctypes.windll.kernel32.CloseHandle(handle)
                alive=bool(ok) and exitcode.value == 259   # STILL_ACTIVE
        else:
            try:
                os.kill(pid, 0)
                alive=True
            except OSError:
                alive=False
    return alive


def main():
    if os.path.exists(LOCK_FILE):
        # 被 kill -9 打死時鎖檔會殘留，所以看鎖檔裡的 pid 是不是真的還活著再決定
        try:
            oldpid=int(open(LOCK_FILE, encoding="utf-8").read().strip() or 0)
        except ValueError:
            oldpid=0
        if pid_alive(oldpid):
            raise SystemExit("偵測到 %s，pid %d 仍在執行中；請等它跑完或先結束它。" % (LOCK_FILE, oldpid))
        print("鎖檔 %s 的 pid %s 已不存在（上次可能被強制結束），自動接手。" % (LOCK_FILE, oldpid or "未知"))
        os.remove(LOCK_FILE)
    open(LOCK_FILE, "w", encoding="utf-8").write(str(os.getpid()))
    try:
        jobs = load_jobs()
        pending = [j for j in jobs if j["status"] != "done"]
        print("待處理工作：%d / %d" % (len(pending), len(jobs)))
        try:
            for job in pending:
                t0 = time.time()
                solve_job(job)
                job["status"] = "done"
                save_jobs(jobs)
                print("[%s] 完成 %.1fs" % (job["id"], time.time() - t0))
        except KeyboardInterrupt:
            print("\n中斷，進度已存，下次執行 python shortdeckworker.py 會接續。")
        finally:
            build_manifest()
    finally:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)


if __name__ == "__main__":
    main()
