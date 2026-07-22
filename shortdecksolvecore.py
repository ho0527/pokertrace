"""
短牌 flop CFR 核心運算。跟 gtosolvecore.py 的差別只在「跟牌有關」的部分：
    - 牌組換成 36 張（6789TJQKA）
    - build_equity 比大小用短牌規則（同花>葫蘆、A6789 特殊順子），不是標準 eval7 數值
純數學的部分（建樹 build_tree、setup_state、solve_chunk、finalize）直接重用 gtosolvecore，
因為那些只操作 E 矩陣與樹結構，不碰牌。
"""
import itertools

import eval7
import numpy as np

import gtosolvecore as core   # 重用純數學：build_tree / setup_state / solve_chunk / finalize

RANKS = "6789TJQKA"
SUITS = "cdhs"
ALLCARDS = [r + s for r in RANKS for s in SUITS]
CARDOBJ = {c: eval7.Card(c) for c in ALLCARDS}
CIDX = {c: i for i, c in enumerate(ALLCARDS)}
RANKORDER = "AKQJT9876"   # 顯示用（強到弱），短牌 9 個
OOP, IP = core.OOP, core.IP

# 短牌牌型順序：同花跟葫蘆對調，補 A6789 特殊順子，以及 A6789 同花＝最小同花順（見 shortdeckgto.py）
_SD_ORDER = ["High Card", "Pair", "Two Pair", "Trips", "LowStraight",
             "Straight", "Full House", "Flush", "Quads",
             "LowStraightFlush", "Straight Flush"]
_SD_RANK = {name: i for i, name in enumerate(_SD_ORDER)}
_LOW_STRAIGHT_RVAL = set("A6789")
# A,6,7,8,9 對應的 eval7.Card.rank 編號（2=0 起算，所以 6=4、9=7、A=12）
_LOW_STRAIGHT_CARDRANK = frozenset([12, 4, 5, 6, 7])


def sd_lowstraightflushed(cardobjs):
    """這 5~7 張裡是否有某一個花色同時涵蓋 A,6,7,8,9（短牌最小同花順）。"""
    suitranks = {}
    for card in cardobjs:
        if card.suit not in suitranks:
            suitranks[card.suit] = set()
        suitranks[card.suit].add(card.rank)
    lowed = False
    for suit in suitranks:
        if _LOW_STRAIGHT_CARDRANK.issubset(suitranks[suit]):
            lowed = True
    return lowed


def sd_value(cardobjs, rankchars):
    """短牌單一可比較分數。cardobjs：5~7 張 eval7.Card；rankchars：對應的點數字元集合。"""
    v = eval7.evaluate(cardobjs)
    cat = eval7.handtype(v)
    score = _SD_RANK[cat] * 200_000_000 + v
    # eval7 是標準 52 張規則，不認得 A-6-7-8-9 這個短牌最小順子，所以點數湊齊就自己再判一次：
    # 同花＝最小的同花順、不同花＝最小的順子。cat 已經是 Straight Flush 代表同花色裡有
    # 6789T 以上、比 A6789 更大的同花順，直接沿用 eval7 的判定。
    if cat != "Straight Flush" and _LOW_STRAIGHT_RVAL.issubset(rankchars):
        if sd_lowstraightflushed(cardobjs):
            score = _SD_RANK["LowStraightFlush"] * 200_000_000
        elif cat in ("High Card", "Pair", "Two Pair", "Trips"):
            score = _SD_RANK["LowStraight"] * 200_000_000
    return score


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
        if ca[0] not in RANKS or cb[0] not in RANKS:
            continue
        if ca in boardset or cb in boardset:
            continue
        out.append((ca, cb))
    return out


def build_equity(oop, ip, board):
    """跟 gtosolvecore.build_equity 同結構，但每張牌力用 sd_value（短牌規則）算。"""
    No, Ni = len(oop), len(ip)
    oop_idx = [(CIDX[a], CIDX[b]) for a, b in oop]
    ip_idx = [(CIDX[a], CIDX[b]) for a, b in ip]
    boardidx = set(CIDX[c] for c in board)
    boardobj = [CARDOBJ[c] for c in board]
    board_ranks = [c[0] for c in board]
    oop_obj = [(CARDOBJ[a], CARDOBJ[b]) for a, b in oop]
    ip_obj = [(CARDOBJ[a], CARDOBJ[b]) for a, b in ip]
    oop_ranks = [(a[0], b[0]) for a, b in oop]
    ip_ranks = [(a[0], b[0]) for a, b in ip]

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
        tr_ranks = (ALLCARDS[t][0], ALLCARDS[r][0])
        extra = [CARDOBJ[ALLCARDS[t]], CARDOBJ[ALLCARDS[r]]]
        b5 = boardobj + extra
        b5_ranks = board_ranks + [tr_ranks[0], tr_ranks[1]]
        so = np.empty(No); vo = np.ones(No, dtype=bool)
        for i in range(No):
            a0, a1 = oop_idx[i]
            if a0 in (t, r) or a1 in (t, r):
                vo[i] = False; so[i] = -1.0
            else:
                rankset = set(b5_ranks) | {oop_ranks[i][0], oop_ranks[i][1]}
                so[i] = sd_value([oop_obj[i][0], oop_obj[i][1]] + b5, rankset)
        si = np.empty(Ni); vi = np.ones(Ni, dtype=bool)
        for j in range(Ni):
            b0, b1 = ip_idx[j]
            if b0 in (t, r) or b1 in (t, r):
                vi[j] = False; si[j] = -1.0
            else:
                rankset = set(b5_ranks) | {ip_ranks[j][0], ip_ranks[j][1]}
                si[j] = sd_value([ip_obj[j][0], ip_obj[j][1]] + b5, rankset)
        valid = vo[:, None] & vi[None, :] & ~conflict
        w = (so[:, None] > si[None, :]).astype(float) + 0.5 * (so[:, None] == si[None, :])
        wins += np.where(valid, w, 0.0)
        counts += valid
    E = np.divide(wins, counts, out=np.full((No, Ni), 0.5), where=counts > 0)
    return E, conflict


# 純數學重用 gtosolvecore
build_tree = core.build_tree
setup_state = core.setup_state
solve_chunk = core.solve_chunk
finalize = core.finalize


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


if __name__ == "__main__":
    import time
    board = ["As", "Kh", "7c"]
    oop = expand_range("99+,AKs,AQs,AJs,KQs,AKo", set(board))
    ip = expand_range("88+,ATs+,KJs+,QJs,AJo+", set(board))
    print("oop combos", len(oop), "ip combos", len(ip))
    t = time.time()
    E, conflict = build_equity(oop, ip, board)
    print("equity built in %.1fs" % (time.time() - t))
    root = build_tree(E, 10.0, 40.0, [0.66], raisemult=3.0)
    No, Ni = len(oop), len(ip)
    REG, STRAT, META = setup_state(root, No, Ni)
    t = time.time()
    solve_chunk(root, REG, STRAT, 10.0, No, Ni, 400, conflict)
    print("CFR solved in %.1fs" % (time.time() - t))
    avg, EVNODE, U_root = finalize(root, REG, STRAT, META, 10.0, No, Ni, conflict)
    cells = aggregate_cells(oop, avg["oop_root"], META["oop_root"][1])
    print("oop_root actions:", META["oop_root"][1])
    for lab in ["AA", "KK", "AKs", "99"]:
        if lab in cells:
            print("  %-4s %s" % (lab, cells[lab]))
