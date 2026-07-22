"""
簡化版多人池（3 人）flop CFR solver。獨立模組，不動 gtosolvecore.py / gtoworker.py 既有的雙人管線。

模型（這是簡化，不是嚴謹的多人 Nash 均衡——多人賽局本來就沒有那種乾淨保證）：
    - OOP、IP 兩個人是真正的決策者，互相 regret matching 到均衡，跟雙人版一樣。
    - 第三人（THIRD）是固定 range、不做決策的背景玩家：一般下注（check/bet/call）都跟得住，
      但「只要 OOP/IP 之間有人加注，就當作 THIRD 已經蓋牌」——這是簡化的關鍵，讓加注之後
      的子樹可以直接沿用雙人版算法（乾淨的零和），不用同時追蹤三方終局。
    - 因為 THIRD 在一般下注線上不會蓋牌，OOP/IP 誰蓋牌時，剩下那個人不是自動贏，
      要看他 vs THIRD range 的勝率；真的走到攤牌（check-check 或 bet-call、未加注）時，
      要看 OOP/IP/THIRD 三方比大小的份額。
    - THIRD 跟注時會多投入一份計分牌，所以這些終局的底池要多算一份。

跟雙人版最大的差異：這裡的 CFR 同時追蹤 OOP 跟 IP 各自的 payoff（不是像雙人版那樣
用「pot 減對方拿到多少」反推，因為三人局不是純零和，不能這樣反推）。
"""
import eval7
import numpy as np

import gtosolvecore as core

OOP, IP = 0, 1


def build_pair_conflict(oop, ip):
    No, Ni = len(oop), len(ip)
    conflict = np.zeros((No, Ni), dtype=bool)
    for i in range(No):
        si = {oop[i][0], oop[i][1]}
        for j in range(Ni):
            if si & {ip[j][0], ip[j][1]}:
                conflict[i, j] = True
    return conflict


def vs_third_equity(combos, thirdrangestr, board, iters=8000):
    """每個 combo 單獨對 THIRD range 的勝率（另一方蓋牌、但 THIRD 還在時用得到）。"""
    boardset = set(board)
    third = eval7.HandRange(thirdrangestr)
    boardobj = [eval7.Card(c) for c in board]
    out = np.zeros(len(combos))
    for i, (a, b) in enumerate(combos):
        if a in boardset or b in boardset:
            out[i] = 0.5
            continue
        hand = (eval7.Card(a), eval7.Card(b))
        out[i] = eval7.py_hand_vs_range_monte_carlo(hand, third, boardobj, iters)
    return out


def build_multiway_share(oop, ip, thirdrangestr, board, samples=400, seed=0):
    """genuine 3-way 攤牌時，OOP / IP 各自贏得底池的份額（蒙地卡羅，固定種子可重現）。"""
    No, Ni = len(oop), len(ip)
    thirdcombos = core.expand_range(thirdrangestr, set(board))
    if not thirdcombos:
        raise ValueError("第三人 range 在這個 board 上沒有合法 combo")

    ALLCARDS, CIDX, CARDOBJ = core.ALLCARDS, core.CIDX, core.CARDOBJ
    boardobj = [CARDOBJ[c] for c in board]
    boardidx = set(CIDX[c] for c in board)
    remaining = [c for c in ALLCARDS if CIDX[c] not in boardidx]

    oop_idx = [(CIDX[a], CIDX[b]) for a, b in oop]
    ip_idx = [(CIDX[a], CIDX[b]) for a, b in ip]
    oop_obj = [(CARDOBJ[a], CARDOBJ[b]) for a, b in oop]
    ip_obj = [(CARDOBJ[a], CARDOBJ[b]) for a, b in ip]

    oop_win = np.zeros((No, Ni))
    ip_win = np.zeros((No, Ni))
    counts = np.zeros((No, Ni))
    rng = np.random.default_rng(seed)

    for _ in range(samples):
        tk = thirdcombos[rng.integers(0, len(thirdcombos))]
        tk_idx = {CIDX[tk[0]], CIDX[tk[1]]}
        pool = [c for c in remaining if CIDX[c] not in tk_idx]
        if len(pool) < 2:
            continue
        pick = rng.choice(len(pool), size=2, replace=False)
        turn, river = pool[pick[0]], pool[pick[1]]
        extra_idx = tk_idx | {CIDX[turn], CIDX[river]}
        b5 = boardobj + [CARDOBJ[turn], CARDOBJ[river]]
        sk = eval7.evaluate([eval7.Card(tk[0]), eval7.Card(tk[1])] + b5)

        so = np.zeros(No)
        vo = np.ones(No, dtype=bool)
        for i in range(No):
            if oop_idx[i][0] in extra_idx or oop_idx[i][1] in extra_idx:
                vo[i] = False
            else:
                so[i] = eval7.evaluate([oop_obj[i][0], oop_obj[i][1]] + b5)
        si = np.zeros(Ni)
        vi = np.ones(Ni, dtype=bool)
        for j in range(Ni):
            if ip_idx[j][0] in extra_idx or ip_idx[j][1] in extra_idx:
                vi[j] = False
            else:
                si[j] = eval7.evaluate([ip_obj[j][0], ip_obj[j][1]] + b5)

        valid = vo[:, None] & vi[None, :]
        so_col, si_row = so[:, None], si[None, :]
        # 三方一起比大小：最大的那個分數贏，打平的家數平分（含跟 THIRD 平分）。
        # 只算「OOP/IP 互相平手且都贏 THIRD」會漏掉 so==sk>si 之類的情形，
        # 那時 OOP 明明跟 THIRD 平分卻拿 0 → oop_share+ip_share+third_share<1、底池憑空蒸發。
        # 寫法對齊 gtomultiwaycall.py 的 eq_3way。
        best = np.maximum(np.maximum(so_col, si_row), sk)
        oop_best = (so_col == best)
        ip_best = (si_row == best)
        winners = oop_best.astype(float) + ip_best.astype(float) + (sk == best).astype(float)
        counts += valid
        oop_win += np.where(valid, oop_best / winners, 0.0)
        ip_win += np.where(valid, ip_best / winners, 0.0)

    oop_share = np.divide(oop_win, counts, out=np.full((No, Ni), 1.0 / 3), where=counts > 0)
    ip_share = np.divide(ip_win, counts, out=np.full((No, Ni), 1.0 / 3), where=counts > 0)
    return oop_share, ip_share


def build_tree(E2, pot, stack, betfracs, oop_vs_third, ip_vs_third, oop_share, ip_share, raisemult=3.0):
    """樹的形狀跟 gtosolvecore.build_tree 一樣，差別在終局：
    - 一般下注線（沒被加注過）：用三人份額/vs-third 勝率算終局，且每個終局同時回傳
      (oop_payoff, ip_payoff) 兩個陣列。
    - 一旦有人加注：視為 THIRD 已蓋牌，之後全部沿用雙人版 E2 算（乾淨零和）。
    """
    No, Ni = oop_share.shape

    def full(v):
        return np.full((No, Ni), float(v))

    def SD3(io, ii):
        # 一般下注線攤牌：io==ii（有跟注）或都是 0（check-check）。THIRD 也跟注同額。
        p = pot + io + ii + max(io, ii)
        return ('T', p * oop_share - io, p * ip_share - ii)

    def OOPW3(b):
        # IP 蓋牌（未加注過），THIRD 跟了 b 還在：OOP 要看 vs-third 勝率，不是自動贏。
        # 底池＝原始 pot + OOP 自己的 b + THIRD 跟的 b；OOP 只拿回份額，還要扣掉自己投入的 b
        # （跟 SD3 的 "- io" 同一套記法）。
        p = pot + 2.0 * b
        oop_payoff = np.tile((oop_vs_third[:, None] * p), (1, Ni)) - b
        return ('T', oop_payoff, full(0.0))

    def IPW3(b):
        p = pot + 2.0 * b
        ip_payoff = np.tile((ip_vs_third[None, :] * p), (No, 1)) - b
        return ('T', full(0.0), ip_payoff)

    # ---- 加注之後：THIRD 視為已蓋牌，沿用雙人版乾淨零和終局 ----
    # dead＝THIRD 在被加注前已經跟進去的那一注（b），蓋牌後留在底池當死錢，
    # 不算進去會讓加注線的底池少一整份 b、加注頻率系統性偏低。
    def SD2c(io, ii, dead):
        p = pot + dead + io + ii
        oop_payoff = E2 * p - io
        ip_payoff = (1.0 - E2) * p - ii
        return ('T', oop_payoff, ip_payoff)

    def OOPW2(ii, dead):
        return ('T', full(pot + dead + ii), full(-ii))

    def IPW2(io, dead):
        return ('T', full(-io), full(pot + dead + io))

    def caps(x):
        return min(x, stack)

    def ip_faces_oop_bet(b, pct):
        r = caps(raisemult * b)
        acts = [('fold', OOPW3(b)), ('call', SD3(b, b))]
        if r > b + 1e-9:
            oop_vs_raise = ('D', OOP, 'oop_vs_raise%d' % pct,
                            [('fold', IPW2(b, b)), ('call', SD2c(r, r, b))])
            acts.append(('raise', oop_vs_raise))
        return ('D', IP, 'ip_vs_bet%d' % pct, acts)

    def oop_faces_ip_bet(b, pct):
        r = caps(raisemult * b)
        acts = [('fold', IPW3(b)), ('call', SD3(b, b))]
        if r > b + 1e-9:
            ip_vs_raise = ('D', IP, 'ip_vs_raise%d' % pct,
                           [('fold', OOPW2(b, b)), ('call', SD2c(r, r, b))])
            acts.append(('raise', ip_vs_raise))
        return ('D', OOP, 'oop_vs_bet%d' % pct, acts)

    ip_check_acts = [('check', SD3(0, 0))]
    root_acts = [('check', None)]
    for frac in betfracs:
        b = caps(frac * pot)
        pct = int(round(frac * 100))
        ip_check_acts.append(('bet%d' % pct, oop_faces_ip_bet(b, pct)))
        root_acts.append(('bet%d' % pct, ip_faces_oop_bet(b, pct)))
    ip_after_check = ('D', IP, 'ip_vs_check', ip_check_acts)
    root_acts[0] = ('check', ip_after_check)
    return ('D', OOP, 'oop_root', root_acts)


def setup_state(root, No, Ni):
    REG, STRAT, META = {}, {}, {}

    def walk(node):
        if node[0] == 'T':
            return
        _, p, name, acts = node
        n = No if p == OOP else Ni
        REG[name] = np.zeros((n, len(acts)))
        STRAT[name] = np.zeros((n, len(acts)))
        META[name] = (p, [a for a, _ in acts])
        for _, ch in acts:
            walk(ch)
    walk(root)
    return REG, STRAT, META


def cfr_solve(root, REG, STRAT, No, Ni, iters=600):
    r_oop0 = np.ones(No)
    r_ip0 = np.ones(Ni)

    def regret_match(name, na):
        pos = np.maximum(REG[name], 0.0)
        s = pos.sum(axis=1, keepdims=True)
        with np.errstate(invalid='ignore', divide='ignore'):
            return np.where(s > 0, pos / np.where(s > 0, s, 1.0), 1.0 / na)

    def cfr(node, r_oop, r_ip):
        if node[0] == 'T':
            return node[1], node[2]
        _, p, name, acts = node
        na = len(acts)
        sigma = regret_match(name, na)
        UO_a, UI_a = [], []
        for a in range(na):
            if p == OOP:
                uo, ui = cfr(acts[a][1], r_oop * sigma[:, a], r_ip)
            else:
                uo, ui = cfr(acts[a][1], r_oop, r_ip * sigma[:, a])
            UO_a.append(uo)
            UI_a.append(ui)
        if p == OOP:
            u_a = np.stack([(UO_a[a] * r_ip[None, :]).sum(axis=1) for a in range(na)], axis=1)
            u_node = (sigma * u_a).sum(axis=1, keepdims=True)
            REG[name] += u_a - u_node
            STRAT[name] += r_oop[:, None] * sigma
            UO_node = sum(sigma[:, a][:, None] * UO_a[a] for a in range(na))
            UI_node = sum(sigma[:, a][:, None] * UI_a[a] for a in range(na))
        else:
            u_a = np.stack([(UI_a[a] * r_oop[:, None]).sum(axis=0) for a in range(na)], axis=1)
            u_node = (sigma * u_a).sum(axis=1, keepdims=True)
            REG[name] += u_a - u_node
            STRAT[name] += r_ip[:, None] * sigma
            UO_node = sum(sigma[:, a][None, :] * UO_a[a] for a in range(na))
            UI_node = sum(sigma[:, a][None, :] * UI_a[a] for a in range(na))
        return UO_node, UI_node

    for _ in range(iters):
        cfr(root, r_oop0, r_ip0)

    avg = {}
    for name, st in STRAT.items():
        ssum = st.sum(axis=1, keepdims=True)
        avg[name] = np.divide(st, ssum, out=np.full_like(st, 1.0 / st.shape[1]), where=ssum > 0)
    return avg


def finalize_ev(root, avg, No, Ni):
    """用平均策略再跑一次，取得每節點、每 combo、每動作的 (OOP EV, IP EV)。"""
    EVOOP, EVIP = {}, {}

    def eval_ev(node, r_oop, r_ip):
        if node[0] == 'T':
            return node[1], node[2]
        _, p, name, acts = node
        na = len(acts)
        sig = avg[name]
        VO, VI = [], []
        for a in range(na):
            if p == OOP:
                vo, vi = eval_ev(acts[a][1], r_oop * sig[:, a], r_ip)
            else:
                vo, vi = eval_ev(acts[a][1], r_oop, r_ip * sig[:, a])
            VO.append(vo)
            VI.append(vi)
        if p == OOP:
            UO_node = sum(sig[:, a][:, None] * VO[a] for a in range(na))
            UI_node = sum(sig[:, a][:, None] * VI[a] for a in range(na))
            denom = r_ip[None, :].sum()
            evo = np.stack([(VO[a] * r_ip[None, :]).sum(axis=1) / max(denom, 1e-9) for a in range(na)], axis=1)
            evi = np.stack([(VI[a] * r_ip[None, :]).sum(axis=1) / max(denom, 1e-9) for a in range(na)], axis=1)
        else:
            UO_node = sum(sig[:, a][None, :] * VO[a] for a in range(na))
            UI_node = sum(sig[:, a][None, :] * VI[a] for a in range(na))
            denom = r_oop[:, None].sum()
            evo = np.stack([(VO[a] * r_oop[:, None]).sum(axis=0) / max(denom, 1e-9) for a in range(na)], axis=1)
            evi = np.stack([(VI[a] * r_oop[:, None]).sum(axis=0) / max(denom, 1e-9) for a in range(na)], axis=1)
        EVOOP[name] = evo
        EVIP[name] = evi
        return UO_node, UI_node

    U_root = eval_ev(root, np.ones(No), np.ones(Ni))
    return EVOOP, EVIP, U_root


def solve(oop_rangestr, ip_rangestr, third_rangestr, board, pot=10.0, stack=40.0,
          betfracs=(0.66,), raisemult=3.0, iters=600, mc_samples=400, mc_iters=8000):
    boardset = set(board)
    oop = core.expand_range(oop_rangestr, boardset)
    ip = core.expand_range(ip_rangestr, boardset)
    conflict = build_pair_conflict(oop, ip)
    No, Ni = len(oop), len(ip)

    E2, _ = core.build_equity(oop, ip, board)  # 加注後 THIRD 蓋牌，退回乾淨雙人 equity
    oop_vs_third = vs_third_equity(oop, third_rangestr, board, mc_iters)
    ip_vs_third = vs_third_equity(ip, third_rangestr, board, mc_iters)
    oop_share, ip_share = build_multiway_share(oop, ip, third_rangestr, board, mc_samples)

    root = build_tree(E2, pot, stack, betfracs, oop_vs_third, ip_vs_third, oop_share, ip_share, raisemult)
    REG, STRAT, META = setup_state(root, No, Ni)
    avg = cfr_solve(root, REG, STRAT, No, Ni, iters)
    EVOOP, EVIP, (U_root_oop, U_root_ip) = finalize_ev(root, avg, No, Ni)

    nodes = {}
    for name, sig in avg.items():
        p, actions = META[name]
        combos = oop if p == OOP else ip
        evarr = EVOOP[name] if p == OOP else EVIP[name]
        nodes[name] = {
            "player": "OOP" if p == OOP else "IP",
            "actions": actions,
            "cells": core.aggregate_cells(combos, sig, actions),
            "ev": core.aggregate_ev(combos, evarr, actions),
        }
    valid = ~conflict
    ev_oop = float((U_root_oop * valid).sum() / valid.sum()) if valid.sum() > 0 else 0.0
    ev_ip = float((U_root_ip * valid).sum() / valid.sum()) if valid.sum() > 0 else 0.0
    return {
        "board": board, "pot": pot, "stack": stack, "betsizes": list(betfracs),
        "oopcombos": No, "ipcombos": Ni,
        "evoop": round(ev_oop, 3), "evip": round(ev_ip, 3),
        "note": "簡化多人模型：第三人固定 range、一般下注會跟、但一被加注就視為蓋牌；非嚴謹多人 Nash 均衡。",
        "nodes": nodes,
    }


if __name__ == "__main__":
    import time
    board = ["As", "Kh", "7c"]
    t0 = time.time()
    out = solve(
        oop_rangestr="22+,A2s+,K9s+,QTs+,JTs,T9s,98s,AJo+,KQo",
        ip_rangestr="22+,A2s+,K9s+,Q9s+,J9s+,T8s+,A9o+,KTo+,QJo",
        third_rangestr="55+,A8s+,K9s+,QTs+,A9o+,KJo+",
        board=board,
        pot=15.0, stack=40.0, betfracs=(0.66,), iters=400, mc_samples=300, mc_iters=4000,
    )
    print("solved in %.1fs" % (time.time() - t0))
    print("board", out["board"], "OOP EV", out["evoop"], "IP EV", out["evip"], "(pot", out["pot"], ")")
    root = out["nodes"]["oop_root"]
    print("root actions", root["actions"])
    for lab in ["AA", "AKs", "QQ", "A5s", "76s", "22"]:
        if lab in root["cells"]:
            print(" ", lab, "freq%", root["cells"][lab], " EV", root["ev"][lab])
