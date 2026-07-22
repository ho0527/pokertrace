"""
本地可暫停續跑的 GTO flop 批次 worker（試跑版，先跑一小批驗證流程）。

用法：
    python gtoworker.py            # 開始/接續處理 gtojobs.json 裡的工作
    （處理中按 Ctrl+C 可安全中斷，進度存在 gtocheckpoint/ 底下，
      下次執行 python gtoworker.py 會接續未完成的工作，不會從頭重算）

流程：
    1. 若 gtojobs.json 不存在，用下面 SCENARIOS x FLOPS 自動產生一份試跑用的清單。
    2. 逐一處理狀態不是 done 的工作：
       - 若該工作有 checkpoint（曾經跑到一半），從 checkpoint 續跑。
       - 每跑 CHUNK 次疊代就存一次 checkpoint，這樣中斷損失最多 CHUNK 次疊代。
       - 疊代數跑滿 job 的 iters 後，做最終 EV 統計，寫進 gtoresults/<jobid>.json，
         並把 gtojobs.json 該筆標記 done、清掉 checkpoint 檔。
"""
import hashlib
import json
import os
import time

import numpy as np

import gtosolvecore as core
import gtomanifest
from gtoscenarios import SCENARIOS

JOBS_FILE = "gtojobs.json"
RESULTS_DIR = "gtoresults"
CKPT_DIR = "gtocheckpoint"
CHUNK = 100  # 每跑這麼多次疊代存一次 checkpoint

FLOPS_FILE = "gtoflops_canonical.json"
# 全量是 1755 個不同構 flop（跑 gtoflops.py 產生）。先設一個上限做漸進式試跑，
# 之後確認流程沒問題、時間可接受，再把 FLOP_LIMIT 設 None 跑全量。
FLOP_LIMIT = None

ITERS = 600
# gtoresults/*.json 的輸出欄位版本。輸出欄位有增減（例如後來才加上 ooprange/iprange）時
# 把這個數字加一，既有 job 的 paramhash 就會對不上而自動重設成 pending 重算。
RESULTSCHEMAVERSION = 2


def load_flops():
    if not os.path.exists(FLOPS_FILE):
        raise SystemExit("找不到 %s，請先執行 python gtoflops.py 產生不同構 flop 清單" % FLOPS_FILE)
    flops = json.load(open(FLOPS_FILE, encoding="utf-8"))
    if FLOP_LIMIT is not None:
        flops = flops[:FLOP_LIMIT]
    return flops


def job_paramhash(job):
    """情境參數（range/pot/stack/betsizes/raise/iters）＋輸出 schema 版本的指紋。

    job id 只含「情境名＋board」，情境參數或輸出欄位改掉時 id 不會變，
    光比 id 會讓既有的 done 工作永遠不重跑、留著舊參數/舊欄位的結果檔。
    所以另外存 paramhash，對不上就重設成 pending。
    """
    payload = json.dumps({
        "ooprange": job["ooprange"],
        "iprange": job["iprange"],
        "pot": job["pot"],
        "stack": job["stack"],
        "betsizes": job["betsizes"],
        "raise": job["raise"],
        "iters": job["iters"],
        "schema": RESULTSCHEMAVERSION,
    }, sort_keys=True, ensure_ascii=False)
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()[:12]


def gen_jobs():
    jobs = []
    flops = load_flops()
    for sc in SCENARIOS:
        for board in flops:
            jid = "%s_%s" % (sc["name"], "".join(board))
            job = {
                "id": jid,
                "board": board,
                "ooprange": sc["ooprange"],
                "iprange": sc["iprange"],
                "pot": sc["pot"],
                "stack": sc["stack"],
                "betsizes": sc["betsizes"],
                "raise": sc["raise"],
                "iters": ITERS,
                "status": "pending",
            }
            job["paramhash"] = job_paramhash(job)
            jobs.append(job)
    return jobs


def load_jobs():
    if not os.path.exists(JOBS_FILE):
        jobs = gen_jobs()
        save_jobs(jobs)
        print("已產生工作清單 %s（%d 筆）" % (JOBS_FILE, len(jobs)))
        return jobs
    # 已有清單：SCENARIOS 新增的情境補進去；paramhash 對不上的（情境參數或輸出 schema 改過）
    # 重設成 pending 重算，並清掉舊 checkpoint（舊 checkpoint 的 E/REG 是照舊參數建的，不能接續）
    jobs = json.load(open(JOBS_FILE, encoding="utf-8"))
    byid = {}
    for j in jobs:
        byid[j["id"]] = j
    added = 0
    reset = 0
    for j in gen_jobs():
        old = byid.get(j["id"])
        if old is None:
            jobs.append(j)
            added = added + 1
        elif old.get("paramhash") != j["paramhash"]:
            for key in j:
                old[key] = j[key]
            ckp = ckpt_path(j["id"])
            if os.path.exists(ckp):
                os.remove(ckp)
            reset = reset + 1
    if added or reset:
        save_jobs(jobs)
        print("SCENARIOS 有異動：新增 %d 筆、參數/schema 變動重設 %d 筆（%s）" % (added, reset, JOBS_FILE))
    return jobs


def save_jobs(jobs):
    # 原子寫入：先寫暫存檔再改名，避免兩個 worker 同時跑時把檔案寫到一半、寫壞 JSON。
    tmp = JOBS_FILE + ".tmp"
    json.dump(jobs, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(tmp, JOBS_FILE)


def ckpt_path(jid):
    return os.path.join(CKPT_DIR, jid + ".npz")


def save_checkpoint(jid, REG, STRAT, done_iters, E, conflict):
    os.makedirs(CKPT_DIR, exist_ok=True)
    payload = {"done_iters": np.array(done_iters), "E": E, "conflict": conflict}
    for name, arr in REG.items():
        payload["REG__" + name] = arr
    for name, arr in STRAT.items():
        payload["STRAT__" + name] = arr
    np.savez(ckpt_path(jid), **payload)


def load_checkpoint(jid):
    p = ckpt_path(jid)
    if not os.path.exists(p):
        return None
    d = np.load(p)
    REG, STRAT = {}, {}
    for k in d.files:
        if k.startswith("REG__"):
            REG[k[5:]] = d[k]
        elif k.startswith("STRAT__"):
            STRAT[k[7:]] = d[k]
    return {
        "done_iters": int(d["done_iters"]),
        "E": d["E"], "conflict": d["conflict"],
        "REG": REG, "STRAT": STRAT,
    }


def solve_job(job):
    board = job["board"]
    boardset = set(board)
    oop = core.expand_range(job["ooprange"], boardset)
    ip = core.expand_range(job["iprange"], boardset)
    ck = load_checkpoint(job["id"])

    if ck is None:
        t0 = time.time()
        E, conflict = core.build_equity(oop, ip, board)
        print("  equity matrix built in %.1fs (No=%d Ni=%d)" % (time.time() - t0, len(oop), len(ip)))
        root = core.build_tree(E, job["pot"], job["stack"], job["betsizes"],
                                raisemult=3.0 if job["raise"] else 1.0)
        REG, STRAT, META = core.setup_state(root, len(oop), len(ip))
        done_iters = 0
    else:
        E, conflict = ck["E"], ck["conflict"]
        root = core.build_tree(E, job["pot"], job["stack"], job["betsizes"],
                                raisemult=3.0 if job["raise"] else 1.0)
        _, _, META = core.setup_state(root, len(oop), len(ip))
        REG, STRAT = ck["REG"], ck["STRAT"]
        done_iters = ck["done_iters"]
        print("  從 checkpoint 接續：已完成 %d/%d 次疊代" % (done_iters, job["iters"]))

    No, Ni = len(oop), len(ip)
    while done_iters < job["iters"]:
        step = min(CHUNK, job["iters"] - done_iters)
        core.solve_chunk(root, REG, STRAT, job["pot"], No, Ni, step, conflict)
        done_iters += step
        save_checkpoint(job["id"], REG, STRAT, done_iters, E, conflict)
        print("  ...%d/%d" % (done_iters, job["iters"]))

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
        "ooprange": job["ooprange"], "iprange": job["iprange"],   # 存 range，供翻牌後往下抽 turn/river
        "nodes": nodes,
    }
    json.dump(result, open(os.path.join(RESULTS_DIR, job["id"] + ".json"), "w", encoding="utf-8"),
               ensure_ascii=False)
    ckp = ckpt_path(job["id"])
    if os.path.exists(ckp):
        os.remove(ckp)


LOCK_FILE = "gtoworker.lock"


def main():
    # 同時只能跑一個 worker：兩個 process 搶著寫同一份 gtojobs.json 會把檔案寫壞
    # （2026-07-05 實際發生過一次）。用一個鎖檔擋掉第二個 instance。
    if os.path.exists(LOCK_FILE):
        raise SystemExit(
            "偵測到 %s，可能已經有一個 gtoworker.py 在跑。\n"
            "若確定沒有其他 instance 在跑（例如上次異常結束沒清掉鎖檔），"
            "手動刪除 %s 後再重新執行。" % (LOCK_FILE, LOCK_FILE)
        )
    open(LOCK_FILE, "w").write(str(os.getpid()))
    try:
        jobs = load_jobs()
        pending = [j for j in jobs if j["status"] != "done"]
        print("待處理工作：%d / %d" % (len(pending), len(jobs)))
        try:
            for job in pending:
                print("[%s] 開始" % job["id"])
                t0 = time.time()
                solve_job(job)
                job["status"] = "done"
                save_jobs(jobs)
                print("[%s] 完成，耗時 %.1fs" % (job["id"], time.time() - t0))
        except KeyboardInterrupt:
            print("\n收到中斷，進度已存在 %s / %s，下次執行 python gtoworker.py 會接續。" % (CKPT_DIR, JOBS_FILE))
        finally:
            gtomanifest.main()
    finally:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)


if __name__ == "__main__":
    main()
