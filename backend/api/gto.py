"""
GTO 翻後 CFR 求解器端點（自製、eval7 + numpy，免費零授權）。

v1：flop 子局面，turn+river 用枚舉全跑完的精確 showdown equity。
真 CFR：在 flop 下注樹（check / bet 一檔 / 面對下注 fold-call）上 regret matching 到均衡。
回傳 OOP 與 IP 各節點、每手起手牌（169 格）的策略頻率與 EV。

注意：單檔自含（不依賴專案其他 GTO 程式）。下注樹刻意精簡以求純 Python 即時可解（~2 秒）；
不含加注/多街下注，屬「flop 子局面近似」，非完整 multi-street solver。
"""
import json
import itertools
import threading
import time
import eval7
import numpy as np

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from function.function import errorresponse

# ================= 每 IP 求解速率限制 =================
# solveflop / solvenextstreet 是公開 GTO 工具頁（tool/range.html）用的高耗費 CFR 求解端點，
# 不加登入限制以免破壞公開功能，改用模組層 in-memory 每 IP 速率限制防止未授權 CPU DoS。
# 兩個端點共用同一份額度：每 IP 每 RATELIMITWINDOW 秒最多 RATELIMITMAX 次求解，超限回 429。
# 注意：ratelimitrecord 是模組層 in-memory dict，每個行程（uvicorn 各 worker）各持一份、不共享，
# 所以額度是「每行程獨立」，實際整站上限≈worker 數×RATELIMITMAX，而非全站單一 RATELIMITMAX。
RATELIMITWINDOW=60
RATELIMITMAX=6
RATELIMITLOCK=threading.Lock()
ratelimitrecord={}


def solveratelimited(request):
    """回傳該請求來源 IP 是否已超過求解速率限制；未超過時記下這一次。"""
    # 優先取 nginx 設的 X-Real-IP，沒有才退回 REMOTE_ADDR；
    # 本部署 uvicorn 的 proxy_headers 預設開啟、已從 X-Forwarded-For 還原真實 client IP，
    # 所以兩者在這裡都是真實來源 IP（apilog 實測無 127.0.0.1），X-Real-IP 只是更明確的來源
    ip=request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR","")
    now=time.time()
    limited=False
    with RATELIMITLOCK:
        # 順手清掉已全部過期的 IP 紀錄，避免 dict 無限成長
        for key in list(ratelimitrecord.keys()):
            recentlist=[t for t in ratelimitrecord[key] if now-t<RATELIMITWINDOW]
            if recentlist:
                ratelimitrecord[key]=recentlist
            else:
                del ratelimitrecord[key]
        recentlist=ratelimitrecord.get(ip,[])
        if len(recentlist)>=RATELIMITMAX:
            limited=True
        else:
            recentlist.append(now)
            ratelimitrecord[ip]=recentlist
    return limited


RANKS = "23456789TJQKA"
SUITS = "cdhs"
ALLCARDS = [r+s for r in RANKS for s in SUITS]
CARDOBJ = {c: eval7.Card(c) for c in ALLCARDS}
CIDX = {c: i for i, c in enumerate(ALLCARDS)}
RANKORDER = "AKQJT98765432"  # 顯示用（強到弱）
OOP, IP = 0, 1


def canon_label(c1, c2):
    r1, s1 = c1[0], c1[1]
    r2, s2 = c2[0], c2[1]
    if RANKORDER.index(r1) > RANKORDER.index(r2):
        r1, r2, s1, s2 = r2, r1, s2, s1   # r1 = 強張
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


# ================= 短牌（Short Deck / 6+）支援 =================
# backend/api/gto.py 刻意單檔自含（不 import 專案根目錄的 shortdeckgto.py），
# 所以把短牌牌力判斷 inline 在這裡。差別：牌組 36 張（拿掉 2~5）、同花>葫蘆、
# 有 A-6-7-8-9 這種最小順子（eval7 用標準規則不認得，要自己補）；
# A6789 同花時是最小的同花順（steel wheel），要排在四條之上、6789T 同花順之下。
SD_RANKS = "6789TJQKA"
SD_ALLCARDS = [r + s for r in SD_RANKS for s in SUITS]
SD_CARDOBJ = {c: eval7.Card(c) for c in SD_ALLCARDS}
SD_CIDX = {c: i for i, c in enumerate(SD_ALLCARDS)}
SD_RANKORDER = "AKQJT9876"   # 短牌 9 個點數（強到弱）
_SD_TYPE_ORDER = ["High Card", "Pair", "Two Pair", "Trips", "LowStraight",
                  "Straight", "Full House", "Flush", "Quads",
                  "LowStraightFlush", "Straight Flush"]
_SD_TYPE_RANK = {name: i for i, name in enumerate(_SD_TYPE_ORDER)}
_SD_LOW_STRAIGHT = set("A6789")
# A,6,7,8,9 對應的 eval7.Card.rank 編號（2=0 起算，所以 6=4、9=7、A=12）
_SD_LOW_STRAIGHT_CARDRANK = frozenset([12, 4, 5, 6, 7])


def sd_lowstraightflushed(cardobjs):
    """這 5~7 張裡是否有某一個花色同時涵蓋 A,6,7,8,9（短牌最小同花順）。"""
    suitranks = {}
    for card in cardobjs:
        if card.suit not in suitranks:
            suitranks[card.suit] = set()
        suitranks[card.suit].add(card.rank)
    lowed = False
    for suit in suitranks:
        if _SD_LOW_STRAIGHT_CARDRANK.issubset(suitranks[suit]):
            lowed = True
    return lowed


def sd_value(cardobjs, rankchars):
    """短牌單一可比較分數。cardobjs：5~7 張 eval7.Card；rankchars：對應點數集合。
    同花跟葫蘆對調，並補 A6789 最小順子與 A6789 同花＝最小同花順。"""
    v = eval7.evaluate(cardobjs)
    cat = eval7.handtype(v)
    score = _SD_TYPE_RANK[cat] * 200000000 + v
    # eval7 是標準 52 張規則，不認得 A-6-7-8-9 這個短牌最小順子，會判成散牌／同花之類，
    # 所以只要點數湊齊 A,6,7,8,9 就自己再判一次。cat 已經是 Straight Flush 的話，
    # 代表同花色裡有 6789T 以上、比 A6789 更大的同花順，直接沿用 eval7 的判定。
    if cat != "Straight Flush" and _SD_LOW_STRAIGHT.issubset(rankchars):
        if sd_lowstraightflushed(cardobjs):
            score = _SD_TYPE_RANK["LowStraightFlush"] * 200000000
        elif cat in ("High Card", "Pair", "Two Pair", "Trips"):
            score = _SD_TYPE_RANK["LowStraight"] * 200000000
    return score


def sd_canon_label(c1, c2):
    r1, s1 = c1[0], c1[1]
    r2, s2 = c2[0], c2[1]
    if SD_RANKORDER.index(r1) > SD_RANKORDER.index(r2):
        r1, r2, s1, s2 = r2, r1, s2, s1
    if r1 == r2:
        return r1 + r2
    return r1 + r2 + ("s" if s1 == s2 else "o")


def sd_expand_range(rangestr, boardset):
    hr = eval7.HandRange(rangestr)
    out = []
    for hand in hr.hands:
        (a, b), w = hand
        ca, cb = str(a), str(b)
        if ca[0] not in SD_RANKS or cb[0] not in SD_RANKS:
            continue
        if ca in boardset or cb in boardset:
            continue
        out.append((ca, cb))
    return out


def sd_build_equity(oop, ip, board):
    """短牌版 build_equity：同結構，但比大小用 sd_value（短牌規則）。"""
    No, Ni = len(oop), len(ip)
    oop_idx = [(SD_CIDX[a], SD_CIDX[b]) for a, b in oop]
    ip_idx = [(SD_CIDX[a], SD_CIDX[b]) for a, b in ip]
    boardidx = set(SD_CIDX[c] for c in board)
    boardobj = [SD_CARDOBJ[c] for c in board]
    board_ranks = [c[0] for c in board]
    oop_obj = [(SD_CARDOBJ[a], SD_CARDOBJ[b]) for a, b in oop]
    ip_obj = [(SD_CARDOBJ[a], SD_CARDOBJ[b]) for a, b in ip]
    oop_r = [(a[0], b[0]) for a, b in oop]
    ip_r = [(a[0], b[0]) for a, b in ip]
    conflict = np.zeros((No, Ni), dtype=bool)
    for i in range(No):
        si = {oop_idx[i][0], oop_idx[i][1]}
        for j in range(Ni):
            if si & {ip_idx[j][0], ip_idx[j][1]}:
                conflict[i, j] = True
    wins = np.zeros((No, Ni))
    counts = np.zeros((No, Ni))
    remaining = [SD_CIDX[c] for c in SD_ALLCARDS if SD_CIDX[c] not in boardidx]
    for (t, r) in itertools.combinations(remaining, 2):
        tr_ranks = (SD_ALLCARDS[t][0], SD_ALLCARDS[r][0])
        extra = [SD_CARDOBJ[SD_ALLCARDS[t]], SD_CARDOBJ[SD_ALLCARDS[r]]]
        b5 = boardobj + extra
        b5r = board_ranks + [tr_ranks[0], tr_ranks[1]]
        so = np.empty(No); vo = np.ones(No, dtype=bool)
        for i in range(No):
            a0, a1 = oop_idx[i]
            if a0 in (t, r) or a1 in (t, r):
                vo[i] = False; so[i] = -1.0
            else:
                so[i] = sd_value([oop_obj[i][0], oop_obj[i][1]] + b5, set(b5r) | {oop_r[i][0], oop_r[i][1]})
        si = np.empty(Ni); vi = np.ones(Ni, dtype=bool)
        for j in range(Ni):
            b0, b1 = ip_idx[j]
            if b0 in (t, r) or b1 in (t, r):
                vi[j] = False; si[j] = -1.0
            else:
                si[j] = sd_value([ip_obj[j][0], ip_obj[j][1]] + b5, set(b5r) | {ip_r[j][0], ip_r[j][1]})
        valid = vo[:, None] & vi[None, :] & ~conflict
        w = (so[:, None] > si[None, :]).astype(float) + 0.5 * (so[:, None] == si[None, :])
        wins += np.where(valid, w, 0.0)
        counts += valid
    E = np.divide(wins, counts, out=np.full((No, Ni), 0.5), where=counts > 0)
    return E, conflict


def sd_aggregate_cells(combos, strat, actions):
    acc = {}
    for k, (a, b) in enumerate(combos):
        lab = sd_canon_label(a, b)
        if lab not in acc:
            acc[lab] = [np.zeros(len(actions)), 0]
        acc[lab][0] += strat[k]; acc[lab][1] += 1
    return {lab: [round(float(x / n) * 100, 1) for x in s] for lab, (s, n) in acc.items()}


def sd_aggregate_ev(combos, evarr, actions):
    acc = {}
    for k, (a, b) in enumerate(combos):
        lab = sd_canon_label(a, b)
        if lab not in acc:
            acc[lab] = [np.zeros(len(actions)), 0]
        acc[lab][0] += evarr[k]; acc[lab][1] += 1
    return {lab: [round(float(x / n), 3) for x in s] for lab, (s, n) in acc.items()}


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
        w = (so[:, None] > si[None, :]).astype(float) + 0.5*(so[:, None] == si[None, :])
        wins += np.where(valid, w, 0.0)
        counts += valid
    E = np.divide(wins, counts, out=np.full((No, Ni), 0.5), where=counts > 0)
    return E, conflict


def build_tree(E, pot, stack, betfracs, raisemult=3.0):
    """flop 下注樹：OOP 先行動。支援多檔下注尺寸 + 一次加注（之後只能 fold/call）。
    終局以 (io,ii)＝雙方本街投入 算 OOP 視角效用；showdown 用 equity 矩陣 E。"""
    No, Ni = E.shape
    full = lambda v: np.full((No, Ni), float(v))
    SD = lambda io, ii: ('T', E*(pot+io+ii) - io)   # 攤牌
    OOPW = lambda ii: ('T', full(pot+ii))            # IP 棄，OOP 贏
    IPW = lambda io: ('T', full(-io))                # OOP 棄，IP 贏

    def caps(x):
        return min(x, stack)

    allin = caps(stack)

    def ip_faces_oop_bet(b, pct):
        r = caps(raisemult*b)
        acts = [('fold', OOPW(0)), ('call', SD(b, b))]
        if r > b + 1e-9:
            # OOP 面對 IP 的加注：可棄牌 / 跟注 / 再加注全下
            oop_r_acts = [('fold', IPW(b)), ('call', SD(r, r))]
            if allin > r + 1e-9:
                ip_vs_allin = ('D', IP, 'ip_vs_allin%d' % pct,
                               [('fold', OOPW(r)), ('call', SD(allin, allin))])
                oop_r_acts.append(('raise', ip_vs_allin))
            oop_vs_raise = ('D', OOP, 'oop_vs_raise%d' % pct, oop_r_acts)
            acts.append(('raise', oop_vs_raise))
        return ('D', IP, 'ip_vs_bet%d' % pct, acts)

    def oop_faces_ip_bet(b, pct):
        r = caps(raisemult*b)
        acts = [('fold', IPW(0)), ('call', SD(b, b))]
        if r > b + 1e-9:
            # IP 面對 OOP 的加注：可棄牌 / 跟注 / 再加注全下
            ip_r_acts = [('fold', OOPW(b)), ('call', SD(r, r))]
            if allin > r + 1e-9:
                oop_vs_allin = ('D', OOP, 'oop_vs_allin%d' % pct,
                                [('fold', IPW(r)), ('call', SD(allin, allin))])
                ip_r_acts.append(('raise', oop_vs_allin))
            ip_vs_raise = ('D', IP, 'ip_vs_raise%d' % pct, ip_r_acts)
            acts.append(('raise', ip_vs_raise))
        return ('D', OOP, 'oop_vs_bet%d' % pct, acts)

    ip_check_acts = [('check', SD(0, 0))]
    root_acts = [('check', None)]   # 之後補
    for frac in betfracs:
        b = caps(frac*pot); pct = int(round(frac*100))
        ip_check_acts.append(('bet%d' % pct, oop_faces_ip_bet(b, pct)))
        root_acts.append(('bet%d' % pct, ip_faces_oop_bet(b, pct)))
    ip_after_check = ('D', IP, 'ip_vs_check', ip_check_acts)
    root_acts[0] = ('check', ip_after_check)
    return ('D', OOP, 'oop_root', root_acts)


def cfr_solve(root, No, Ni, pot, conflict, iters=600, r_oop0=None, r_ip0=None):
    """r_oop0 / r_ip0：起始到達機率（不給就當作雙方所有 combo 都均等到達，跟原本一樣）。
    轉牌/河牌現場求解時，這裡會帶入「前一條街走到這裡的機率」，而不是從頭均等開始。"""
    REG, STRAT, META = {}, {}, {}
    # conflict[i,j]=True 代表 OOP combo i 與 IP combo j 共用同一張牌、不可能同時發生。
    # 訓練 pass 算 counterfactual value 時一定要跟下面的 eval pass 一樣把這些 (i,j) 遮掉，
    # 否則訓練的賽局與評估 EV 的賽局不是同一個，策略在對阻斷牌敏感的 spot 會系統性偏掉。
    notc = (~conflict).astype(float)

    def setup(node):
        if node[0] == 'T':
            return
        _, p, name, acts = node
        nid = id(node)
        n = No if p == OOP else Ni
        REG[nid] = np.zeros((n, len(acts)))
        STRAT[nid] = np.zeros((n, len(acts)))
        META[nid] = (name, p, [a for a, _ in acts])
        for _, ch in acts:
            setup(ch)
    setup(root)

    def regret_match(nid, na):
        pos = np.maximum(REG[nid], 0.0)
        s = pos.sum(axis=1, keepdims=True)
        with np.errstate(invalid='ignore', divide='ignore'):
            return np.where(s > 0, pos/np.where(s > 0, s, 1.0), 1.0/na)

    def cfr(node, r_oop, r_ip):
        if node[0] == 'T':
            return node[1]
        _, p, name, acts = node
        nid = id(node); na = len(acts)
        sigma = regret_match(nid, na)
        U_a = []
        for a in range(na):
            if p == OOP:
                U_a.append(cfr(acts[a][1], r_oop*sigma[:, a], r_ip))
            else:
                U_a.append(cfr(acts[a][1], r_oop, r_ip*sigma[:, a]))
        if p == OOP:
            U_node = sum(sigma[:, a][:, None]*U_a[a] for a in range(na))
            u_a = np.stack([(U_a[a]*r_ip[None, :]*notc).sum(axis=1) for a in range(na)], axis=1)
            u_node = (sigma*u_a).sum(axis=1, keepdims=True)
            REG[nid] += u_a - u_node
            STRAT[nid] += r_oop[:, None]*sigma
        else:
            U_node = sum(sigma[:, a][None, :]*U_a[a] for a in range(na))
            u_a = np.stack([((pot - U_a[a])*r_oop[:, None]*notc).sum(axis=0) for a in range(na)], axis=1)
            u_node = (sigma*u_a).sum(axis=1, keepdims=True)
            REG[nid] += u_a - u_node
            STRAT[nid] += r_ip[:, None]*sigma
        return U_node

    r_oop = np.ones(No) if r_oop0 is None else np.array(r_oop0, dtype=float)
    r_ip = np.ones(Ni) if r_ip0 is None else np.array(r_ip0, dtype=float)
    for _ in range(iters):
        cfr(root, r_oop, r_ip)

    avg = {}
    for nid, st in STRAT.items():
        ssum = st.sum(axis=1, keepdims=True)
        avg[nid] = np.divide(st, ssum, out=np.full_like(st, 1.0/st.shape[1]), where=ssum > 0)

    # 評估 pass：用平均策略算 U，並記錄每節點「每手牌、每動作」的 EV（含對手到達率與擋牌）
    # notc 與訓練 pass 共用同一個（見函式開頭），確保兩邊遮的是同一組 (i,j)
    EVNODE = {}

    def eval_ev(node, r_oop, r_ip):
        if node[0] == 'T':
            return node[1]
        _, p, name, acts = node
        nid = id(node); na = len(acts)
        sig = avg[nid]
        V = []
        for a in range(na):
            if p == OOP:
                V.append(eval_ev(acts[a][1], r_oop*sig[:, a], r_ip))
            else:
                V.append(eval_ev(acts[a][1], r_oop, r_ip*sig[:, a]))
        if p == OOP:
            U_node = sum(sig[:, a][:, None]*V[a] for a in range(na))
            denom = (r_ip[None, :]*notc).sum(axis=1)             # (No,)
            safed = np.where(denom > 0, denom, 1.0)
            ev = np.stack([(V[a]*r_ip[None, :]*notc).sum(axis=1)/safed for a in range(na)], axis=1)
        else:
            U_node = sum(sig[:, a][None, :]*V[a] for a in range(na))
            denom = (r_oop[:, None]*notc).sum(axis=0)            # (Ni,)
            safed = np.where(denom > 0, denom, 1.0)
            ev = np.stack([((pot - V[a])*r_oop[:, None]*notc).sum(axis=0)/safed for a in range(na)], axis=1)
        EVNODE[nid] = ev
        return U_node

    U_root = eval_ev(root, r_oop, r_ip)
    return root, avg, META, U_root, EVNODE


def aggregate_cells(combos, strat, actions):
    """把每 combo 的策略平均到 169 格（label -> 每動作頻率 %）。"""
    acc = {}
    for k, (a, b) in enumerate(combos):
        lab = canon_label(a, b)
        if lab not in acc:
            acc[lab] = [np.zeros(len(actions)), 0]
        acc[lab][0] += strat[k]
        acc[lab][1] += 1
    cells = {}
    for lab, (s, n) in acc.items():
        cells[lab] = [round(float(x/n)*100, 1) for x in s]
    return cells


def aggregate_ev(combos, evarr, actions):
    """把每 combo 的 per-action EV 平均到 169 格（label -> 每動作 EV）。"""
    acc = {}
    for k, (a, b) in enumerate(combos):
        lab = canon_label(a, b)
        if lab not in acc:
            acc[lab] = [np.zeros(len(actions)), 0]
        acc[lab][0] += evarr[k]
        acc[lab][1] += 1
    cells = {}
    for lab, (s, n) in acc.items():
        cells[lab] = [round(float(x/n), 3) for x in s]
    return cells


def build_pair_conflict(oop, ip):
    No, Ni = len(oop), len(ip)
    conflict = np.zeros((No, Ni), dtype=bool)
    for i in range(No):
        si = {CIDX[oop[i][0]], CIDX[oop[i][1]]}
        for j in range(Ni):
            if si & {CIDX[ip[j][0]], CIDX[ip[j][1]]}:
                conflict[i, j] = True
    return conflict


def vs_third_equity(combos, thirdrangestr, board, iters=6000):
    """簡化多人模型：每個 combo 單獨對第三人 range 的勝率（另一方蓋牌、第三人還在時用）。"""
    boardset = set(board)
    third = eval7.HandRange(thirdrangestr)
    boardobj = [CARDOBJ[c] for c in board]
    out = np.zeros(len(combos))
    for i, (a, b) in enumerate(combos):
        if a in boardset or b in boardset:
            out[i] = 0.5
            continue
        hand = (CARDOBJ[a], CARDOBJ[b])
        out[i] = eval7.py_hand_vs_range_monte_carlo(hand, third, boardobj, iters)
    return out


def build_multiway_share(oop, ip, thirdrangestr, board, samples=300, seed=0):
    """genuine 3-way 攤牌（OOP、IP 都還在）時，兩人各自贏得底池的份額（蒙地卡羅）。"""
    No, Ni = len(oop), len(ip)
    thirdcombos = expand_range(thirdrangestr, set(board))
    if not thirdcombos:
        raise ValueError("third range empty on this board")
    boardobj = [CARDOBJ[c] for c in board]
    boardidx = set(CIDX[c] for c in board)
    remaining = [c for c in ALLCARDS if CIDX[c] not in boardidx]

    oop_idx = [(CIDX[a], CIDX[b]) for a, b in oop]
    ip_idx = [(CIDX[a], CIDX[b]) for a, b in ip]
    oop_obj = [(CARDOBJ[a], CARDOBJ[b]) for a, b in oop]
    ip_obj = [(CARDOBJ[a], CARDOBJ[b]) for a, b in ip]

    oop_win = np.zeros((No, Ni)); ip_win = np.zeros((No, Ni)); counts = np.zeros((No, Ni))
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
        sk = eval7.evaluate([CARDOBJ[tk[0]], CARDOBJ[tk[1]]] + b5)

        so = np.zeros(No); vo = np.ones(No, dtype=bool)
        for i in range(No):
            if oop_idx[i][0] in extra_idx or oop_idx[i][1] in extra_idx:
                vo[i] = False
            else:
                so[i] = eval7.evaluate([oop_obj[i][0], oop_obj[i][1]] + b5)
        si = np.zeros(Ni); vi = np.ones(Ni, dtype=bool)
        for j in range(Ni):
            if ip_idx[j][0] in extra_idx or ip_idx[j][1] in extra_idx:
                vi[j] = False
            else:
                si[j] = eval7.evaluate([ip_obj[j][0], ip_obj[j][1]] + b5)

        valid = vo[:, None] & vi[None, :]
        so_col, si_row = so[:, None], si[None, :]
        oop_beats_both = (so_col > si_row) & (so_col > sk)
        ip_beats_both = (si_row > so_col) & (si_row > sk)
        tie_both_beat_third = (so_col == si_row) & (so_col > sk)
        counts += valid
        oop_win += np.where(valid, oop_beats_both.astype(float) + 0.5*tie_both_beat_third, 0.0)
        ip_win += np.where(valid, ip_beats_both.astype(float) + 0.5*tie_both_beat_third, 0.0)

    oop_share = np.divide(oop_win, counts, out=np.full((No, Ni), 1.0/3), where=counts > 0)
    ip_share = np.divide(ip_win, counts, out=np.full((No, Ni), 1.0/3), where=counts > 0)
    return oop_share, ip_share


def build_multiway_k(oop, ip, ranges_list, board, samples=400, seed=0, sd=False):
    """K 個背景玩家（各自固定 range）的多人攤牌結算，K=len(ranges_list)≥1。一次蒙地卡羅同時算出：
      oop_share / ip_share (No,Ni)：OOP、IP 都在＋K 個背景玩家時，各自贏得底池的份額。
      oop_vs_multi (No,) / ip_vs_multi (Ni,)：另一名主角已蓋牌、只剩自己 vs K 個背景玩家時的份額。
    每個背景玩家獨立抽一手（彼此與牌面/主角不重複），一律走到攤牌比大小。sd=True 走短牌牌組與短牌牌力。"""
    No, Ni = len(oop), len(ip)
    K = len(ranges_list)
    CIDX_ = SD_CIDX if sd else CIDX
    CARDOBJ_ = SD_CARDOBJ if sd else CARDOBJ
    ALLCARDS_ = SD_ALLCARDS if sd else ALLCARDS
    _expand = sd_expand_range if sd else expand_range
    boardobj = [CARDOBJ_[c] for c in board]
    boardidx = set(CIDX_[c] for c in board)
    board_ranks = [c[0] for c in board]
    bg_combos = []
    for rs in ranges_list:
        cc = _expand(rs, set(board))
        if not cc:
            raise ValueError("background range empty on this board")
        bg_combos.append(cc)
    remaining_all = [c for c in ALLCARDS_ if CIDX_[c] not in boardidx]

    oop_idx = [(CIDX_[a], CIDX_[b]) for a, b in oop]
    ip_idx = [(CIDX_[a], CIDX_[b]) for a, b in ip]
    oop_obj = [(CARDOBJ_[a], CARDOBJ_[b]) for a, b in oop]
    ip_obj = [(CARDOBJ_[a], CARDOBJ_[b]) for a, b in ip]
    oop_r = [(a[0], b[0]) for a, b in oop]
    ip_r = [(a[0], b[0]) for a, b in ip]

    def score(cardobjs, ranks_set):
        # 短牌用 sd_value（同花↔葫蘆對調＋A6789 順子）；標準牌直接用 eval7 分數
        return sd_value(cardobjs, ranks_set) if sd else eval7.evaluate(cardobjs)

    oop_win = np.zeros((No, Ni)); ip_win = np.zeros((No, Ni)); counts = np.zeros((No, Ni))
    oop_vs = np.zeros(No); oop_vs_cnt = np.zeros(No)
    ip_vs = np.zeros(Ni); ip_vs_cnt = np.zeros(Ni)
    rng = np.random.default_rng(seed)

    for _ in range(samples):
        used = set(boardidx)
        bg_hands = []
        ok = True
        for cc in bg_combos:
            hand = None
            for _try in range(16):
                cand = cc[rng.integers(0, len(cc))]
                ci, cj = CIDX_[cand[0]], CIDX_[cand[1]]
                if ci in used or cj in used:
                    continue
                hand = (cand, ci, cj); break
            if hand is None:
                ok = False; break
            used.add(hand[1]); used.add(hand[2]); bg_hands.append(hand)
        if not ok:
            continue
        pool = [c for c in remaining_all if CIDX_[c] not in used]
        if len(pool) < 2:
            continue
        pick = rng.choice(len(pool), size=2, replace=False)
        turn, river = pool[pick[0]], pool[pick[1]]
        used2 = used | {CIDX_[turn], CIDX_[river]}
        b5 = boardobj + [CARDOBJ_[turn], CARDOBJ_[river]]
        b5rset = set(board_ranks) | {turn[0], river[0]}
        # 背景玩家門檻＝K 家裡最強那手（打敗它才算打敗全部背景玩家）
        sk = max(score([CARDOBJ_[h[0][0]], CARDOBJ_[h[0][1]]] + b5, b5rset | {h[0][0][0], h[0][1][0]}) for h in bg_hands)

        so = np.zeros(No); vo = np.ones(No, dtype=bool)
        for i in range(No):
            if oop_idx[i][0] in used2 or oop_idx[i][1] in used2:
                vo[i] = False
            else:
                so[i] = score([oop_obj[i][0], oop_obj[i][1]] + b5, b5rset | {oop_r[i][0], oop_r[i][1]})
        si = np.zeros(Ni); vi = np.ones(Ni, dtype=bool)
        for j in range(Ni):
            if ip_idx[j][0] in used2 or ip_idx[j][1] in used2:
                vi[j] = False
            else:
                si[j] = score([ip_obj[j][0], ip_obj[j][1]] + b5, b5rset | {ip_r[j][0], ip_r[j][1]})

        valid = vo[:, None] & vi[None, :]
        so_col, si_row = so[:, None], si[None, :]
        # 三方一起比大小：最大的那個分數贏，打平的家數平分（含跟背景玩家平分）。
        # 只算「OOP/IP 互相平手且都贏 sk」會漏掉 so==sk>si 之類的情形，
        # 那時 OOP 明明跟背景玩家平分卻拿 0 → oop_share+ip_share+bg_share<1、底池憑空蒸發。
        # 近似說明：sk 是「K 家裡最強那手」，所以 sk==best 只算「一家背景玩家平分」；
        # K>1 且有多家背景玩家同時打平時，實際分母應該更大（hero 份額會略被高估）。
        best = np.maximum(np.maximum(so_col, si_row), sk)
        oop_best = (so_col == best)
        ip_best = (si_row == best)
        winners = oop_best.astype(float) + ip_best.astype(float) + (sk == best).astype(float)
        counts += valid
        oop_win += np.where(valid, oop_best/winners, 0.0)
        ip_win += np.where(valid, ip_best/winners, 0.0)

        # 單主角 vs K 背景（另一主角蓋牌）：打敗全部背景才拿份額，平手折半
        oop_vs_cnt += vo
        oop_vs += np.where(vo, (so > sk).astype(float) + 0.5*(so == sk).astype(float), 0.0)
        ip_vs_cnt += vi
        ip_vs += np.where(vi, (si > sk).astype(float) + 0.5*(si == sk).astype(float), 0.0)

    oop_share = np.divide(oop_win, counts, out=np.full((No, Ni), 1.0/(K+2)), where=counts > 0)
    ip_share = np.divide(ip_win, counts, out=np.full((No, Ni), 1.0/(K+2)), where=counts > 0)
    oop_vs_multi = np.divide(oop_vs, oop_vs_cnt, out=np.full(No, 1.0/(K+1)), where=oop_vs_cnt > 0)
    ip_vs_multi = np.divide(ip_vs, ip_vs_cnt, out=np.full(Ni, 1.0/(K+1)), where=ip_vs_cnt > 0)
    return oop_share, ip_share, oop_vs_multi, ip_vs_multi


def build_tree_multiway(E2, pot, stack, betfracs, oop_vs_multi, ip_vs_multi, oop_share, ip_share, raisemult=3.0, nbg=1):
    """跟 build_tree 同樣的樹形狀，但一般下注線（沒被加注過）改用多人份額/vs-背景 勝率算終局；
    一旦有人加注，視為所有背景玩家已蓋牌，退回乾淨雙人零和（沿用 E2）。
    nbg = 背景玩家家數（K）；K=1 時與原本三人模型完全一致。"""
    No, Ni = oop_share.shape
    K = max(1, int(nbg))

    def full(v):
        return np.full((No, Ni), float(v))

    def SD3(io, ii):
        p = pot + io + ii + K*max(io, ii)   # K 個背景玩家各跟一注
        return ('T', p*oop_share - io, p*ip_share - ii)

    def OOPW3(b):
        # IP 蓋牌、但 K 個背景玩家在一般下注線是跟注 b 的：底池＝原始 pot + hero 的 b + K 家各自的 b。
        # hero 自己投的 b 要從收益扣掉，否則會系統性高估「下注逼對手蓋牌」的價值、詐唬頻率偏高。
        p = pot + (K+1)*b
        return ('T', np.tile(oop_vs_multi[:, None]*p, (1, Ni)) - b, full(0.0))

    def IPW3(b):
        p = pot + (K+1)*b
        return ('T', full(0.0), np.tile(ip_vs_multi[None, :]*p, (No, 1)) - b)

    def SD2(io, ii, dead=0.0):
        # dead＝背景玩家跟了 b 之後才面對加注蓋牌、留在底池的死錢
        p = pot + dead + io + ii
        oop_payoff = E2*p - io
        ip_payoff = (1.0-E2)*p - ii
        return ('T', oop_payoff, ip_payoff)

    def OOPW2(ii, dead=0.0):
        return ('T', full(pot+dead+ii), full(-ii))

    def IPW2(io, dead=0.0):
        return ('T', full(-io), full(pot+dead+io))

    def caps(x):
        return min(x, stack)

    allin = caps(stack)

    def ip_faces_oop_bet(b, pct):
        # 一般下注線走多人份額；一旦有人加注就視為背景玩家全蓋，退回乾淨雙人零和。
        # 但背景玩家是「跟了 b 之後」才面對加注蓋牌，那 K 筆 b 是留在底池的死錢。
        r = caps(raisemult*b)
        dead = K*b
        acts = [('fold', OOPW3(b)), ('call', SD3(b, b))]
        if r > b + 1e-9:
            oop_r_acts = [('fold', IPW2(b, dead)), ('call', SD2(r, r, dead))]
            if allin > r + 1e-9:
                ip_vs_allin = ('D', IP, 'ip_vs_allin%d' % pct, [('fold', OOPW2(r, dead)), ('call', SD2(allin, allin, dead))])
                oop_r_acts.append(('raise', ip_vs_allin))
            oop_vs_raise = ('D', OOP, 'oop_vs_raise%d' % pct, oop_r_acts)
            acts.append(('raise', oop_vs_raise))
        return ('D', IP, 'ip_vs_bet%d' % pct, acts)

    def oop_faces_ip_bet(b, pct):
        r = caps(raisemult*b)
        dead = K*b
        acts = [('fold', IPW3(b)), ('call', SD3(b, b))]
        if r > b + 1e-9:
            ip_r_acts = [('fold', OOPW2(b, dead)), ('call', SD2(r, r, dead))]
            if allin > r + 1e-9:
                oop_vs_allin = ('D', OOP, 'oop_vs_allin%d' % pct, [('fold', IPW2(r, dead)), ('call', SD2(allin, allin, dead))])
                ip_r_acts.append(('raise', oop_vs_allin))
            ip_vs_raise = ('D', IP, 'ip_vs_raise%d' % pct, ip_r_acts)
            acts.append(('raise', ip_vs_raise))
        return ('D', OOP, 'oop_vs_bet%d' % pct, acts)

    ip_check_acts = [('check', SD3(0, 0))]
    root_acts = [('check', None)]
    for frac in betfracs:
        b = caps(frac*pot); pct = int(round(frac*100))
        ip_check_acts.append(('bet%d' % pct, oop_faces_ip_bet(b, pct)))
        root_acts.append(('bet%d' % pct, ip_faces_oop_bet(b, pct)))
    ip_after_check = ('D', IP, 'ip_vs_check', ip_check_acts)
    root_acts[0] = ('check', ip_after_check)
    return ('D', OOP, 'oop_root', root_acts)


def cfr_solve_multiway(root, No, Ni, conflict, iters=600):
    """跟 cfr_solve 的差別：三人局不是純零和，IP 的效用不能用「pot 減 OOP 效用」反推，
    要各自獨立追蹤 OOP、IP 兩條效用陣列。
    conflict 的意義與遮罩理由同 cfr_solve：訓練與評估兩個 pass 都要遮掉共用牌的 (i,j)。"""
    REG, STRAT, META = {}, {}, {}
    notc = (~conflict).astype(float)

    def setup(node):
        if node[0] == 'T':
            return
        _, p, name, acts = node
        nid = id(node)
        n = No if p == OOP else Ni
        REG[nid] = np.zeros((n, len(acts)))
        STRAT[nid] = np.zeros((n, len(acts)))
        META[nid] = (name, p, [a for a, _ in acts])
        for _, ch in acts:
            setup(ch)
    setup(root)

    def regret_match(nid, na):
        pos = np.maximum(REG[nid], 0.0)
        s = pos.sum(axis=1, keepdims=True)
        with np.errstate(invalid='ignore', divide='ignore'):
            return np.where(s > 0, pos/np.where(s > 0, s, 1.0), 1.0/na)

    def cfr(node, r_oop, r_ip):
        if node[0] == 'T':
            return node[1], node[2]
        _, p, name, acts = node
        nid = id(node); na = len(acts)
        sigma = regret_match(nid, na)
        UO_a, UI_a = [], []
        for a in range(na):
            if p == OOP:
                uo, ui = cfr(acts[a][1], r_oop*sigma[:, a], r_ip)
            else:
                uo, ui = cfr(acts[a][1], r_oop, r_ip*sigma[:, a])
            UO_a.append(uo); UI_a.append(ui)
        if p == OOP:
            u_a = np.stack([(UO_a[a]*r_ip[None, :]*notc).sum(axis=1) for a in range(na)], axis=1)
            u_node = (sigma*u_a).sum(axis=1, keepdims=True)
            REG[nid] += u_a - u_node
            STRAT[nid] += r_oop[:, None]*sigma
            UO_node = sum(sigma[:, a][:, None]*UO_a[a] for a in range(na))
            UI_node = sum(sigma[:, a][:, None]*UI_a[a] for a in range(na))
        else:
            u_a = np.stack([(UI_a[a]*r_oop[:, None]*notc).sum(axis=0) for a in range(na)], axis=1)
            u_node = (sigma*u_a).sum(axis=1, keepdims=True)
            REG[nid] += u_a - u_node
            STRAT[nid] += r_ip[:, None]*sigma
            UO_node = sum(sigma[:, a][None, :]*UO_a[a] for a in range(na))
            UI_node = sum(sigma[:, a][None, :]*UI_a[a] for a in range(na))
        return UO_node, UI_node

    r_oop = np.ones(No); r_ip = np.ones(Ni)
    for _ in range(iters):
        cfr(root, r_oop, r_ip)

    avg = {}
    for nid, st in STRAT.items():
        ssum = st.sum(axis=1, keepdims=True)
        avg[nid] = np.divide(st, ssum, out=np.full_like(st, 1.0/st.shape[1]), where=ssum > 0)

    EVOOP, EVIP = {}, {}

    def eval_ev(node, r_oop, r_ip):
        if node[0] == 'T':
            return node[1], node[2]
        _, p, name, acts = node
        nid = id(node); na = len(acts)
        sig = avg[nid]
        VO, VI = [], []
        for a in range(na):
            if p == OOP:
                vo, vi = eval_ev(acts[a][1], r_oop*sig[:, a], r_ip)
            else:
                vo, vi = eval_ev(acts[a][1], r_oop, r_ip*sig[:, a])
            VO.append(vo); VI.append(vi)
        if p == OOP:
            UO_node = sum(sig[:, a][:, None]*VO[a] for a in range(na))
            UI_node = sum(sig[:, a][:, None]*VI[a] for a in range(na))
            # 逐手牌算分母（跟 cfr_solve 的 eval pass 一致）：只計不與自己共用牌的對手 combo
            denom = (r_ip[None, :]*notc).sum(axis=1)             # (No,)
            safed = np.where(denom > 0, denom, 1.0)
            evo = np.stack([(VO[a]*r_ip[None, :]*notc).sum(axis=1)/safed for a in range(na)], axis=1)
            evi = np.stack([(VI[a]*r_ip[None, :]*notc).sum(axis=1)/safed for a in range(na)], axis=1)
        else:
            UO_node = sum(sig[:, a][None, :]*VO[a] for a in range(na))
            UI_node = sum(sig[:, a][None, :]*VI[a] for a in range(na))
            denom = (r_oop[:, None]*notc).sum(axis=0)            # (Ni,)
            safed = np.where(denom > 0, denom, 1.0)
            evo = np.stack([(VO[a]*r_oop[:, None]*notc).sum(axis=0)/safed for a in range(na)], axis=1)
            evi = np.stack([(VI[a]*r_oop[:, None]*notc).sum(axis=0)/safed for a in range(na)], axis=1)
        EVOOP[nid] = evo; EVIP[nid] = evi
        return UO_node, UI_node

    U_root_oop, U_root_ip = eval_ev(root, np.ones(No), np.ones(Ni))
    return avg, META, EVOOP, EVIP, U_root_oop, U_root_ip


def replay_amounts(pot, stack, betfracs, raisemult, path):
    """回放一串動作字串（跟 build_tree 用的名字一樣：check/betXX/call/raise/fold），
    算出這條街雙方各自投入多少 (io, ii)。回傳 None 表示路徑不合法／沒走完；
    showdown=False 表示中途蓋牌了（蓋牌不能再往下一街，直接結束）。"""
    def capval(x):
        return min(x, stack)

    node = "oop_root"
    io = 0.0
    ii = 0.0
    for act in path:
        if node == "oop_root":
            if act == "check":
                node = "ip_vs_check"
            elif act.startswith("bet"):
                pct = int(act[3:])
                io = capval(pct / 100.0 * pot)
                node = "ip_vs_bet%d" % pct
            else:
                return None
        elif node == "ip_vs_check":
            if act == "check":
                return (0.0, 0.0, True)
            elif act.startswith("bet"):
                pct = int(act[3:])
                ii = capval(pct / 100.0 * pot)
                node = "oop_vs_bet%d" % pct
            else:
                return None
        elif node.startswith("ip_vs_bet"):
            pct = int(node[len("ip_vs_bet"):])
            b = capval(pct / 100.0 * pot)
            if act == "fold":
                return (io, 0.0, False)
            elif act == "call":
                return (io, io, True)
            elif act == "raise":
                ii = capval(raisemult * b)
                node = "oop_vs_raise%d" % pct
            else:
                return None
        elif node.startswith("oop_vs_bet"):
            pct = int(node[len("oop_vs_bet"):])
            b = capval(pct / 100.0 * pot)
            if act == "fold":
                return (0.0, ii, False)
            elif act == "call":
                return (ii, ii, True)
            elif act == "raise":
                io = capval(raisemult * b)
                node = "ip_vs_raise%d" % pct
            else:
                return None
        elif node.startswith("oop_vs_raise"):
            pct = int(node[len("oop_vs_raise"):])
            if act == "fold":
                return (0.0, ii, False)
            elif act == "call":
                return (ii, ii, True)
            elif act == "raise":
                io = capval(stack)                 # OOP 再加注全下
                node = "ip_vs_allin%d" % pct
            else:
                return None
        elif node.startswith("ip_vs_raise"):
            pct = int(node[len("ip_vs_raise"):])
            if act == "fold":
                return (io, 0.0, False)
            elif act == "call":
                return (io, io, True)
            elif act == "raise":
                ii = capval(stack)                 # IP 再加注全下
                node = "oop_vs_allin%d" % pct
            else:
                return None
        elif node.startswith("ip_vs_allin"):
            if act == "fold":
                return (io, ii, False)             # IP 棄，OOP 全下贏 IP 已投入的 ii
            elif act == "call":
                return (io, io, True)
            else:
                return None
        elif node.startswith("oop_vs_allin"):
            if act == "fold":
                return (io, ii, False)             # OOP 棄，IP 全下贏 OOP 已投入的 io
            elif act == "call":
                return (ii, ii, True)
            else:
                return None
        else:
            return None
    return None  # 路徑沒走到終局（給的動作序列不完整）


def compute_reach(root, avg, No, Ni, path):
    """沿著實際的樹物件重播 path，算出每個 OOP / IP combo「走到這裡」的機率（用來當
    下一街現場求解的起始到達機率，而不是假設所有 combo 均等到達）。"""
    node = root
    r_oop = np.ones(No)
    r_ip = np.ones(Ni)
    for act in path:
        if node[0] != 'D':
            return None
        _, p, name, acts = node
        idx = None
        child = None
        for k, (a, ch) in enumerate(acts):
            if a == act:
                idx = k
                child = ch
                break
        if idx is None:
            return None
        sigma = avg[id(node)]
        if p == OOP:
            r_oop = r_oop * sigma[:, idx]
        else:
            r_ip = r_ip * sigma[:, idx]
        node = child
    if node[0] != 'T':
        return None
    return r_oop, r_ip


@api_view(["POST"])
def solvenextstreet(request):
    """轉牌/河牌現場求解：不是把所有可能的下一張牌都算完（那量級太大），
    是使用者點了「這一張」牌，就用「前一條街走到這裡的到達機率」當起點，現場重新解一次。"""
    if solveratelimited(request):
        return Response({
            "success": False,
            "data": "ERROR_too_many_requests"
        },status.HTTP_429_TOO_MANY_REQUESTS)
    try:
        data = json.loads(request.body)
    except Exception:
        return errorresponse("ERROR_request_data_not_found")
    try:
        # 短牌 flag：切換牌組/牌力判斷/label 彙總（build_tree/cfr_solve 是純數學不用換）
        sd = data.get("shortdeck") is True
        cidx = SD_CIDX if sd else CIDX
        _expand = sd_expand_range if sd else expand_range
        _build_eq = sd_build_equity if sd else build_equity
        _agg_cells = sd_aggregate_cells if sd else aggregate_cells
        _agg_ev = sd_aggregate_ev if sd else aggregate_ev
        board = [str(c) for c in (data.get("board") or []) if c]
        if len(board) not in (3, 4) or len(set(board)) != len(board):
            return errorresponse("ERROR_request_data_type_error")
        for c in board:
            if c not in cidx:
                return errorresponse("ERROR_request_data_type_error")
        newcard = str(data.get("newcard") or "")
        if newcard not in cidx or newcard in board:
            return errorresponse("ERROR_request_data_type_error")
        boardset = set(board)
        oop_full = _expand(str(data.get("ooprange") or ""), boardset)
        ip_full = _expand(str(data.get("iprange") or ""), boardset)
        if not oop_full or not ip_full:
            return errorresponse("ERROR_request_data_type_error")
        if len(oop_full) > 400 or len(ip_full) > 400:
            return errorresponse("ERROR_request_data_type_error")
        pot = float(data.get("pot") or 10)
        stack = float(data.get("stack") or 0)
        if stack <= 0:
            stack = pot * 10
        betfracs = data.get("betsizes")
        if not betfracs:
            betfracs = [float(data.get("betsize") or 0.66)]
        betfracs = sorted(set(round(float(f), 3) for f in betfracs if 0 < float(f) <= 3))[:4]
        if not betfracs or pot <= 0:
            return errorresponse("ERROR_request_data_type_error")
        allowraise = data.get("raise") is not False
        raisemult = float(data.get("raisemult") or 3.0) if allowraise else 1.0
        iters = int(data.get("iters") or 600)
        iters = max(100, min(iters, 1500))
        path = [str(a) for a in (data.get("path") or [])]
        if not path:
            return errorresponse("ERROR_request_data_type_error")
    except Exception:
        return errorresponse("ERROR_request_data_type_error")

    amounts = replay_amounts(pot, stack, betfracs, raisemult, path)
    if not amounts or not amounts[2]:
        # 蓋牌或路徑沒走到終局：不適合繼續下一街
        return errorresponse("ERROR_request_data_type_error")
    final_io, final_ii, _ = amounts

    E, conflict = _build_eq(oop_full, ip_full, board)
    No, Ni = E.shape
    root = build_tree(E, pot, stack, betfracs, raisemult)
    _, avg, META, _, _ = cfr_solve(root, No, Ni, pot, conflict, iters)
    reach = compute_reach(root, avg, No, Ni, path)
    if reach is None:
        return errorresponse("ERROR_request_data_type_error")
    r_oop, r_ip = reach

    newboard = board + [newcard]
    newboardset = set(newboard)
    newoop, new_r_oop = [], []
    for i, (a, b) in enumerate(oop_full):
        if a in newboardset or b in newboardset:
            continue
        newoop.append((a, b))
        new_r_oop.append(r_oop[i])
    newip, new_r_ip = [], []
    for j, (a, b) in enumerate(ip_full):
        if a in newboardset or b in newboardset:
            continue
        newip.append((a, b))
        new_r_ip.append(r_ip[j])
    if not newoop or not newip:
        return errorresponse("ERROR_request_data_type_error")

    newpot = pot + final_io + final_ii
    newstack = max(stack - max(final_io, final_ii), 1.0)

    E2, conflict2 = _build_eq(newoop, newip, newboard)
    No2, Ni2 = E2.shape
    root2 = build_tree(E2, newpot, newstack, betfracs, raisemult)
    root2, avg2, META2, U_root2, EVNODE2 = cfr_solve(
        root2, No2, Ni2, newpot, conflict2, iters,
        r_oop0=np.array(new_r_oop), r_ip0=np.array(new_r_ip),
    )

    valid2 = ~conflict2
    ev_oop = float((U_root2 * valid2).sum() / valid2.sum()) if valid2.sum() > 0 else 0.0

    nodes = {}
    for nid, sig in avg2.items():
        name, p, actions = META2[nid]
        combos = newoop if p == OOP else newip
        nodes[name] = {
            "player": "OOP" if p == OOP else "IP",
            "actions": actions,
            "cells": _agg_cells(combos, sig, actions),
            "ev": _agg_ev(combos, EVNODE2[nid], actions),
        }

    return Response({
        "success": True,
        "data": {
            "board": newboard,
            "pot": newpot,
            "stack": newstack,
            "betsizes": betfracs,
            "raise": allowraise,
            "iters": iters,
            "oopcombos": len(newoop),
            "ipcombos": len(newip),
            "evoop": round(ev_oop, 3),
            "evip": round(newpot - ev_oop, 3),
            "ooprange": str(data.get("ooprange") or ""),   # 帶著 range 往下，供 river 再抽牌用
            "iprange": str(data.get("iprange") or ""),
            "nodes": nodes,
        },
    }, status.HTTP_200_OK)


@api_view(["POST"])
def solveflop(request):
    if solveratelimited(request):
        return Response({
            "success": False,
            "data": "ERROR_too_many_requests"
        },status.HTTP_429_TOO_MANY_REQUESTS)
    try:
        data = json.loads(request.body)
    except Exception:
        return errorresponse("ERROR_request_data_not_found")
    try:
        # 短牌 flag：切換牌組/牌力判斷/label 彙總（同 solvenextstreet）
        sd = data.get("shortdeck") is True
        cidx = SD_CIDX if sd else CIDX
        _expand = sd_expand_range if sd else expand_range
        _build_eq = sd_build_equity if sd else build_equity
        _agg_cells = sd_aggregate_cells if sd else aggregate_cells
        _agg_ev = sd_aggregate_ev if sd else aggregate_ev
        board = [str(c) for c in (data.get("board") or []) if c]
        if len(board) != 3 or len(set(board)) != 3:
            return errorresponse("ERROR_request_data_type_error")
        for c in board:
            if c not in cidx:
                return errorresponse("ERROR_request_data_type_error")
        boardset = set(board)
        oop = _expand(str(data.get("ooprange") or ""), boardset)
        ip = _expand(str(data.get("iprange") or ""), boardset)
        if not oop or not ip:
            return errorresponse("ERROR_request_data_type_error")
        if len(oop) > 400 or len(ip) > 400:   # 護欄：避免單請求過大
            return errorresponse("ERROR_request_data_type_error")
        pot = float(data.get("pot") or 10)
        stack = float(data.get("stack") or 0)
        if stack <= 0:
            stack = pot * 10   # 預設 SPR 10
        # 多檔下注尺寸（pot 比例）。相容舊的單一 betsize。
        betfracs = data.get("betsizes")
        if not betfracs:
            betfracs = [float(data.get("betsize") or 0.66)]
        betfracs = sorted(set(round(float(f), 3) for f in betfracs if 0 < float(f) <= 3))[:4]  # 最多 4 檔（含 overbet）
        if not betfracs or pot <= 0:
            return errorresponse("ERROR_request_data_type_error")
        allowraise = data.get("raise") is not False   # 預設允許一次加注
        raisemult = float(data.get("raisemult") or 3.0) if allowraise else 1.0
        iters = int(data.get("iters") or 600)
        iters = max(100, min(iters, 1500))
        # 背景玩家範圍：新版收 thirdranges（list，最多 7 家＝共 9 人），相容舊的單一 thirdrange。
        bgranges = data.get("thirdranges")
        if not isinstance(bgranges, list):
            bgranges = [data.get("thirdrange")] if data.get("thirdrange") else []
        bgranges = [str(r).strip() for r in bgranges if r and str(r).strip()][:7]
        bgvalid = [r for r in bgranges if _expand(r, boardset)]   # 標準/短牌都支援多人池
        if bgranges and not bgvalid:
            return errorresponse("ERROR_request_data_type_error")
    except Exception:
        return errorresponse("ERROR_request_data_type_error")

    if bgvalid:
        # 簡化多人模型：K 個背景玩家各自固定 range、一般下注會跟、但一被加注就視為全部蓋牌。
        # 非嚴謹多人 Nash 均衡，是近似參考。K=len(bgvalid)，共 K+2 家。
        try:
            E2, conflict = _build_eq(oop, ip, board)
            oop_share, ip_share, oop_vs_multi, ip_vs_multi = build_multiway_k(oop, ip, bgvalid, board, sd=sd)
            No, Ni = len(oop), len(ip)
            root = build_tree_multiway(E2, pot, stack, betfracs, oop_vs_multi, ip_vs_multi, oop_share, ip_share, raisemult, nbg=len(bgvalid))
            avg, META, EVOOP, EVIP, U_root_oop, U_root_ip = cfr_solve_multiway(root, No, Ni, conflict, iters)
        except ValueError:
            return errorresponse("ERROR_request_data_type_error")
        except Exception as error:
            # 求解期其他例外不冒泡 500，回錯誤回應並印出錯誤供排查
            print("solveflop multiway solve error:",error)
            return errorresponse("ERROR_request_data_type_error")
        valid = ~conflict
        ev_oop = float((U_root_oop*valid).sum()/valid.sum()) if valid.sum() > 0 else 0.0
        ev_ip = float((U_root_ip*valid).sum()/valid.sum()) if valid.sum() > 0 else 0.0
        nodes = {}
        for nid, sig in avg.items():
            name, p, actions = META[nid]
            combos = oop if p == OOP else ip
            evarr = EVOOP[nid] if p == OOP else EVIP[nid]
            nodes[name] = {
                "player": "OOP" if p == OOP else "IP",
                "actions": actions,
                "cells": _agg_cells(combos, sig, actions),
                "ev": _agg_ev(combos, evarr, actions),
            }
        return Response({
            "success": True,
            "data": {
                "board": board, "pot": pot, "stack": stack, "betsizes": betfracs,
                "raise": allowraise, "iters": iters,
                "oopcombos": len(oop), "ipcombos": len(ip),
                "evoop": round(ev_oop, 3), "evip": round(ev_ip, 3),
                "multiway": True, "players": len(bgvalid) + 2, "bgcount": len(bgvalid),
                "note": "簡化多人模型：%d 個背景玩家各自固定 range、一般下注會跟、但一被加注就視為全部蓋牌；"
                        "非嚴謹多人 Nash 均衡，僅供參考。" % len(bgvalid),
                "nodes": nodes,
            },
        }, status.HTTP_200_OK)

    E, conflict = _build_eq(oop, ip, board)
    No, Ni = E.shape
    root = build_tree(E, pot, stack, betfracs, raisemult)
    root, avg, META, U_root, EVNODE = cfr_solve(root, No, Ni, pot, conflict, iters)

    valid = ~conflict
    ev_oop = float((U_root*valid).sum()/valid.sum()) if valid.sum() > 0 else 0.0

    nodes = {}
    for nid, sig in avg.items():
        name, p, actions = META[nid]
        combos = oop if p == OOP else ip
        nodes[name] = {
            "player": "OOP" if p == OOP else "IP",
            "actions": actions,
            "cells": _agg_cells(combos, sig, actions),
            "ev": _agg_ev(combos, EVNODE[nid], actions),
        }

    return Response({
        "success": True,
        "data": {
            "board": board,
            "pot": pot,
            "stack": stack,
            "betsizes": betfracs,
            "raise": allowraise,
            "iters": iters,
            "oopcombos": len(oop),
            "ipcombos": len(ip),
            "evoop": round(ev_oop, 3),
            "evip": round(pot - ev_oop, 3),
            "nodes": nodes,
        },
    }, status.HTTP_200_OK)
