"""
翻後 CFR 求解器（自製、eval7 + numpy）。
v1：flop 子局面，turn+river 用「全跑完」的精確 showdown equity（枚舉 C(49,2) 個 runout）。
這是真 CFR：在 flop 下注樹上跑 regret matching 到均衡。下注尺寸可設定。

本檔先驗證最吃效能的「combo×combo equity 矩陣」建得多快、CFR 收不收斂。
"""
import eval7, numpy as np, time, itertools

RANKS = "23456789TJQKA"
SUITS = "cdhs"
ALLCARDS = [r+s for r in RANKS for s in SUITS]           # 52
CARDOBJ = {c: eval7.Card(c) for c in ALLCARDS}
CIDX = {c: i for i, c in enumerate(ALLCARDS)}            # 0..51

def expand_range(rangestr, board):
    """HandRange 字串 -> [(c1,c2)...]，排除與 board 衝突的 combo。"""
    boardset = set(board)
    hr = eval7.HandRange(rangestr)
    out = []
    for hand in hr.hands:
        (a, b), w = hand
        ca, cb = str(a), str(b)
        if ca in boardset or cb in boardset:
            continue
        out.append((ca, cb))
    return out

def build_equity(oop, ip, board):
    """回傳 E[No,Ni] = oop combo i 對 ip combo j 的 showdown equity（枚舉所有 turn+river）。"""
    No, Ni = len(oop), len(ip)
    # 每個 combo 的卡 index（拿來做 runout 衝突遮罩）
    oop_idx = np.array([[CIDX[a], CIDX[b]] for a, b in oop])
    ip_idx = np.array([[CIDX[a], CIDX[b]] for a, b in ip])
    boardidx = set(CIDX[c] for c in board)
    boardobj = [CARDOBJ[c] for c in board]
    oop_obj = [(CARDOBJ[a], CARDOBJ[b]) for a, b in oop]
    ip_obj = [(CARDOBJ[a], CARDOBJ[b]) for a, b in ip]

    # i,j 共用牌 -> 不可能同時存在
    conflict = np.zeros((No, Ni), dtype=bool)
    for i in range(No):
        si = set(oop_idx[i])
        for j in range(Ni):
            if si & set(ip_idx[j]):
                conflict[i, j] = True

    wins = np.zeros((No, Ni))
    counts = np.zeros((No, Ni))
    remaining = [CIDX[c] for c in ALLCARDS if CIDX[c] not in boardidx]
    runouts = list(itertools.combinations(remaining, 2))
    for (t, r) in runouts:
        extra = [CARDOBJ[ALLCARDS[t]], CARDOBJ[ALLCARDS[r]]]
        b5 = boardobj + extra
        so = np.empty(No); vo = np.ones(No, dtype=bool)
        for i in range(No):
            if oop_idx[i][0] in (t, r) or oop_idx[i][1] in (t, r):
                vo[i] = False; so[i] = -1
            else:
                so[i] = eval7.evaluate([oop_obj[i][0], oop_obj[i][1]] + b5)
        si = np.empty(Ni); vi = np.ones(Ni, dtype=bool)
        for j in range(Ni):
            if ip_idx[j][0] in (t, r) or ip_idx[j][1] in (t, r):
                vi[j] = False; si[j] = -1
            else:
                si[j] = eval7.evaluate([ip_obj[j][0], ip_obj[j][1]] + b5)
        valid = vo[:, None] & vi[None, :] & ~conflict
        w = (so[:, None] > si[None, :]).astype(float) + 0.5*(so[:, None] == si[None, :])
        wins += np.where(valid, w, 0.0)
        counts += valid
    E = np.divide(wins, counts, out=np.full((No, Ni), 0.5), where=counts > 0)
    return E, conflict

# ===================== CFR（flop 下注樹） =====================
# 節點：('D', player, [(action, child)...]) 決策；('T', U_oop 矩陣) 終局（OOP 視角效用）
OOP, IP = 0, 1

def build_tree(E, pot, b0, b1):
    No, Ni = E.shape
    full = lambda v: np.full((No, Ni), float(v))
    T_sd_check = ('T', E*pot)
    T_oopbet_call = ('T', E*(pot+2*b0) - b0)
    T_check_ipbet_call = ('T', E*(pot+2*b1) - b1)
    T_ip_fold = ('T', full(pot))    # OOP 下注、IP 棄 → OOP 贏底池
    T_oop_fold = ('T', full(0.0))   # OOP 過、IP 下注、OOP 棄 → IP 贏
    n_oop_face = ('D', OOP, [('fold', T_oop_fold), ('call', T_check_ipbet_call)])
    n_ip_aftercheck = ('D', IP, [('check', T_sd_check), ('bet', n_oop_face)])
    n_ip_face = ('D', IP, [('fold', T_ip_fold), ('call', T_oopbet_call)])
    root = ('D', OOP, [('check', n_ip_aftercheck), ('bet', n_ip_face)])
    return root

def cfr_solve(E, pot, b0, b1, iters=600):
    No, Ni = E.shape
    root = build_tree(E, pot, b0, b1)
    REG, STRAT, NP = {}, {}, {}
    def setup(node):
        if node[0] == 'T':
            return
        nid = id(node); p = node[1]; na = len(node[2])
        n = No if p == OOP else Ni
        REG[nid] = np.zeros((n, na)); STRAT[nid] = np.zeros((n, na)); NP[nid] = na
        for _, ch in node[2]:
            setup(ch)
    setup(root)

    def cfr(node, r_oop, r_ip):
        if node[0] == 'T':
            return node[1]
        p = node[1]; nid = id(node); acts = node[2]; na = len(acts)
        reg = REG[nid]; pos = np.maximum(reg, 0.0)
        s = pos.sum(axis=1, keepdims=True)
        with np.errstate(invalid='ignore', divide='ignore'):
            sigma = np.where(s > 0, pos/np.where(s > 0, s, 1.0), 1.0/na)
        U_a = []
        for a in range(na):
            if p == OOP:
                U_a.append(cfr(acts[a][1], r_oop*sigma[:, a], r_ip))
            else:
                U_a.append(cfr(acts[a][1], r_oop, r_ip*sigma[:, a]))
        if p == OOP:
            U_node = sum(sigma[:, a][:, None]*U_a[a] for a in range(na))
            u_a = np.stack([(U_a[a]*r_ip[None, :]).sum(axis=1) for a in range(na)], axis=1)
            u_node = (sigma*u_a).sum(axis=1, keepdims=True)
            REG[nid] += u_a - u_node
            STRAT[nid] += r_oop[:, None]*sigma
        else:
            U_node = sum(sigma[:, a][None, :]*U_a[a] for a in range(na))
            u_a = np.stack([((pot - U_a[a])*r_oop[:, None]).sum(axis=0) for a in range(na)], axis=1)
            u_node = (sigma*u_a).sum(axis=1, keepdims=True)
            REG[nid] += u_a - u_node
            STRAT[nid] += r_ip[:, None]*sigma
        return U_node

    r_oop = np.ones(No); r_ip = np.ones(Ni)
    for _ in range(iters):
        U = cfr(root, r_oop, r_ip)
    avg = {}
    for nid, st in STRAT.items():
        ssum = st.sum(axis=1, keepdims=True)
        avg[nid] = np.where(ssum > 0, st/ssum, 1.0/NP[nid])
    ev_oop = (cfr(root, r_oop, r_ip).sum()) / (No*Ni)  # 粗略平均（含衝突對，僅供收斂觀察）
    return root, avg


if __name__ == "__main__":
    board = ["As", "Kh", "7c"]
    # 範例：IP（按鈕 c-bet 方）較強, OOP（大盲防守方）較寬
    oop = expand_range("22+,A2s+,K9s+,QTs+,JTs,T9s,98s,AJo+,KQo", board)
    ip = expand_range("22+,A2s+,K9s+,Q9s+,J9s+,T8s+,A9o+,KTo+,QJo", board)
    print("OOP combos", len(oop), " IP combos", len(ip))
    t = time.time()
    E, conflict = build_equity(oop, ip, board)
    print("equity matrix built in %.1fs" % (time.time()-t))
    pot, b0, b1 = 10.0, 7.0, 7.0   # 底池 10、雙方下注 0.7 pot
    t = time.time()
    root, avg = cfr_solve(E, pot, b0, b1, iters=600)
    print("CFR solved in %.1fs" % (time.time()-t))
    rootavg = avg[id(root)]   # OOP root: [check, bet]
    def cat(c1, c2):
        for k, (a, b) in enumerate(oop):
            if {a, b} == {c1, c2}:
                return k
        return None
    print("\nOOP root bet frequency (bet 0.7pot):")
    for label, cc in [("set 77", ("7d","7h")), ("two pair A7", ("Ad","7s")),
                      ("top pair AQ", ("Ad","Qd")), ("2nd pair K9s", ("Kd","9d")),
                      ("flush draw QJs", ("Qs","Js")), ("air 65s", ("6s","5s")), ("air T9s", ("Td","9d"))]:
        k = cat(*cc)
        if k is not None:
            print("  %-16s bet=%.0f%%  check=%.0f%%" % (label, rootavg[k,1]*100, rootavg[k,0]*100))
    betfreq = (rootavg[:,1]).mean()
    print("\nOOP overall bet frequency: %.0f%%" % (betfreq*100))
