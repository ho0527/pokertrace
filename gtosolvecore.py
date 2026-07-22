"""
GTO flop CFR 核心運算（純函式，不含 Django、不含佇列邏輯）。
從 backend/api/gto.py 的邏輯抽出，唯一差異：REG/STRAT 用節點的穩定字串 name 當 key
（而不是 Python id(node)），這樣才能把中途的 regret 狀態存成檔案、下次載回來接著跑。
"""
import itertools
import eval7
import numpy as np

RANKS = "23456789TJQKA"
SUITS = "cdhs"
ALLCARDS = [r + s for r in RANKS for s in SUITS]
CARDOBJ = {c: eval7.Card(c) for c in ALLCARDS}
CIDX = {c: i for i, c in enumerate(ALLCARDS)}
RANKORDER = "AKQJT98765432"
OOP, IP = 0, 1


def canon_label(c1, c2):
    r1, s1 = c1[0], c1[1]
    r2, s2 = c2[0], c2[1]
    if RANKORDER.index(r1) > RANKORDER.index(r2):
        r1, r2, s1, s2 = r2, r1, s2, s1
    if r1 == r2:
        return r1 + r2
    return r1 + r2 + ("s" if s1 == s2 else "o")


def expand_range(rangestr, boardset):
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
    No, Ni = len(oop), len(ip)
    oop_idx = [(CIDX[a], CIDX[b]) for a, b in oop]
    ip_idx = [(CIDX[a], CIDX[b]) for a, b in ip]
    boardidx = set(CIDX[c] for c in board)
    boardobj = [CARDOBJ[c] for c in board]
    oop_obj = [(CARDOBJ[a], CARDOBJ[b]) for a, b in oop]
    ip_obj = [(CARDOBJ[a], CARDOBJ[b]) for a, b in ip]
    conflict = np.zeros((No, Ni), dtype=bool)
    for i in range(No):
        si = {oop_idx[i][0], oop_idx[i][1]}
        for j in range(Ni):
            if si & {ip_idx[j][0], ip_idx[j][1]}:
                conflict[i, j] = True
    wins = np.zeros((No, Ni))
    counts = np.zeros((No, Ni))
    remaining = [CIDX[c] for c in ALLCARDS if CIDX[c] not in boardidx]
    for (t, r) in itertools.combinations(remaining, 2):
        extra = [CARDOBJ[ALLCARDS[t]], CARDOBJ[ALLCARDS[r]]]
        b5 = boardobj + extra
        so = np.empty(No); vo = np.ones(No, dtype=bool)
        for i in range(No):
            a0, a1 = oop_idx[i]
            if a0 in (t, r) or a1 in (t, r):
                vo[i] = False; so[i] = -1.0
            else:
                so[i] = eval7.evaluate([oop_obj[i][0], oop_obj[i][1]] + b5)
        si = np.empty(Ni); vi = np.ones(Ni, dtype=bool)
        for j in range(Ni):
            b0, b1 = ip_idx[j]
            if b0 in (t, r) or b1 in (t, r):
                vi[j] = False; si[j] = -1.0
            else:
                si[j] = eval7.evaluate([ip_obj[j][0], ip_obj[j][1]] + b5)
        valid = vo[:, None] & vi[None, :] & ~conflict
        w = (so[:, None] > si[None, :]).astype(float) + 0.5 * (so[:, None] == si[None, :])
        wins += np.where(valid, w, 0.0)
        counts += valid
    E = np.divide(wins, counts, out=np.full((No, Ni), 0.5), where=counts > 0)
    return E, conflict


def build_tree(E, pot, stack, betfracs, raisemult=3.0):
    """flop 下注樹：OOP 先行動。節點用字串 name 標記（可序列化 checkpoint 用）。"""
    No, Ni = E.shape
    full = lambda v: np.full((No, Ni), float(v))
    SD = lambda io, ii: ('T', E * (pot + io + ii) - io)
    OOPW = lambda ii: ('T', full(pot + ii))
    IPW = lambda io: ('T', full(-io))

    def caps(x):
        return min(x, stack)

    def ip_faces_oop_bet(b, pct):
        r = caps(raisemult * b)
        acts = [('fold', OOPW(0)), ('call', SD(b, b))]
        if r > b + 1e-9:
            oop_vs_raise = ('D', OOP, 'oop_vs_raise%d' % pct,
                             [('fold', IPW(b)), ('call', SD(r, r))])
            acts.append(('raise', oop_vs_raise))
        return ('D', IP, 'ip_vs_bet%d' % pct, acts)

    def oop_faces_ip_bet(b, pct):
        r = caps(raisemult * b)
        acts = [('fold', IPW(0)), ('call', SD(b, b))]
        if r > b + 1e-9:
            ip_vs_raise = ('D', IP, 'ip_vs_raise%d' % pct,
                            [('fold', OOPW(b)), ('call', SD(r, r))])
            acts.append(('raise', ip_vs_raise))
        return ('D', OOP, 'oop_vs_bet%d' % pct, acts)

    ip_check_acts = [('check', SD(0, 0))]
    root_acts = [('check', None)]
    for frac in betfracs:
        b = caps(frac * pot); pct = int(round(frac * 100))
        ip_check_acts.append(('bet%d' % pct, oop_faces_ip_bet(b, pct)))
        root_acts.append(('bet%d' % pct, ip_faces_oop_bet(b, pct)))
    ip_after_check = ('D', IP, 'ip_vs_check', ip_check_acts)
    root_acts[0] = ('check', ip_after_check)
    return ('D', OOP, 'oop_root', root_acts)


def setup_state(root, No, Ni):
    """建立每個節點（用 name 當 key）的 REG/STRAT 零陣列 + meta 資訊。"""
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


def solve_chunk(root, REG, STRAT, pot, No, Ni, iters, conflict):
    """實際執行 iters 次 CFR 疊代（原地更新 REG/STRAT）。

    conflict[i,j]=True 表示 OOP combo i 與 IP combo j 共用同一張牌、不可能同時發生。
    算 counterfactual value 時一定要把這些 (i,j) 遮掉（乘 notc），否則訓練用的賽局
    會跟 finalize() 評估 EV 用的賽局不一致（finalize 有遮、訓練沒遮），
    策略在對阻斷牌敏感的 board 會系統性偏掉。
    """
    r_oop = np.ones(No); r_ip = np.ones(Ni)
    notc=(~conflict).astype(float)

    def regret_match(name, na):
        pos = np.maximum(REG[name], 0.0)
        s = pos.sum(axis=1, keepdims=True)
        with np.errstate(invalid='ignore', divide='ignore'):
            return np.where(s > 0, pos / np.where(s > 0, s, 1.0), 1.0 / na)

    def cfr(node, ro, ri):
        if node[0] == 'T':
            return node[1]
        _, p, name, acts = node
        na = len(acts)
        sigma = regret_match(name, na)
        U_a = []
        for a in range(na):
            if p == OOP:
                U_a.append(cfr(acts[a][1], ro * sigma[:, a], ri))
            else:
                U_a.append(cfr(acts[a][1], ro, ri * sigma[:, a]))
        if p == OOP:
            u_a = np.stack([(U_a[a] * ri[None, :] * notc).sum(axis=1) for a in range(na)], axis=1)
            u_node = (sigma * u_a).sum(axis=1, keepdims=True)
            REG[name] += u_a - u_node
            STRAT[name] += ro[:, None] * sigma
            return sum(sigma[:, a][:, None] * U_a[a] for a in range(na))
        else:
            u_a = np.stack([((pot - U_a[a]) * ro[:, None] * notc).sum(axis=0) for a in range(na)], axis=1)
            u_node = (sigma * u_a).sum(axis=1, keepdims=True)
            REG[name] += u_a - u_node
            STRAT[name] += ri[:, None] * sigma
            return sum(sigma[:, a][None, :] * U_a[a] for a in range(na))

    for _ in range(iters):
        cfr(root, r_oop, r_ip)


def finalize(root, REG, STRAT, META, pot, No, Ni, conflict):
    """算完後：平均策略 + 逐節點 EV（同 backend/api/gto.py 的 eval pass）。"""
    avg = {}
    for name, st in STRAT.items():
        ssum = st.sum(axis=1, keepdims=True)
        avg[name] = np.divide(st, ssum, out=np.full_like(st, 1.0 / st.shape[1]), where=ssum > 0)

    notc = (~conflict).astype(float)
    EVNODE = {}

    def eval_ev(node, r_oop, r_ip):
        if node[0] == 'T':
            return node[1]
        _, p, name, acts = node
        na = len(acts)
        sig = avg[name]
        V = []
        for a in range(na):
            if p == OOP:
                V.append(eval_ev(acts[a][1], r_oop * sig[:, a], r_ip))
            else:
                V.append(eval_ev(acts[a][1], r_oop, r_ip * sig[:, a]))
        if p == OOP:
            U_node = sum(sig[:, a][:, None] * V[a] for a in range(na))
            denom = (r_ip[None, :] * notc).sum(axis=1)
            safed = np.where(denom > 0, denom, 1.0)
            ev = np.stack([(V[a] * r_ip[None, :] * notc).sum(axis=1) / safed for a in range(na)], axis=1)
        else:
            U_node = sum(sig[:, a][None, :] * V[a] for a in range(na))
            denom = (r_oop[:, None] * notc).sum(axis=0)
            safed = np.where(denom > 0, denom, 1.0)
            ev = np.stack([((pot - V[a]) * r_oop[:, None] * notc).sum(axis=0) / safed for a in range(na)], axis=1)
        EVNODE[name] = ev
        return U_node

    U_root = eval_ev(root, np.ones(No), np.ones(Ni))
    return avg, EVNODE, U_root


def aggregate_cells(combos, strat, actions):
    acc = {}
    for k, (a, b) in enumerate(combos):
        lab = canon_label(a, b)
        if lab not in acc:
            acc[lab] = [np.zeros(len(actions)), 0]
        acc[lab][0] += strat[k]; acc[lab][1] += 1
    return {lab: [round(float(x / n) * 100, 1) for x in s] for lab, (s, n) in acc.items()}


def aggregate_ev(combos, evarr, actions):
    acc = {}
    for k, (a, b) in enumerate(combos):
        lab = canon_label(a, b)
        if lab not in acc:
            acc[lab] = [np.zeros(len(actions)), 0]
        acc[lab][0] += evarr[k]; acc[lab][1] += 1
    return {lab: [round(float(x / n), 3) for x in s] for lab, (s, n) in acc.items()}
