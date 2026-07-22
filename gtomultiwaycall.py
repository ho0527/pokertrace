"""
3 人全下池的「第三家 overcall」精算範圍（eval7 實算，取代前端的啟發式收緊）。

情境固定：有人先全下(jammer)，接著一位先跟注(caller1)，現在第三家要不要 overcall。
給定 jammer / caller1 的範圍固定，這是「精確的最佳跟注門檻」（非啟發式）：
  - jammer 範圍 = 固定分桶代表範圍 JAMMER[bucket]（同 gtocall.py）。
  - caller1 範圍 = 面對該 jammer 的單挑跟注範圍（equity vs jammer >= 單挑底池賠率門檻）。
  - 第三家對每一手，實算它在三人全下攤牌對 (jammer, caller1) 的勝率(share)，
    >= 三人底池賠率門檻 S/(3S+1.5+A) 就 overcall。
底池賠率：三人各投入有效計分牌 S，死錢＝盲注 1.5 + 總 ante A（以 BB 計）。equity 與 S/A 無關，
只跟兩邊範圍有關，所以依 (bucket, caller1 範圍內容) 快取，各 (S,A) 只換門檻。

輸出 frontend/gtomultiwaycall.js：
  GTOMULTIWAYCALL["<anteCents>_<S>_<BUCKET>"] = { call:[壓縮 token], pct }
  anteCents = 總 ante × 100（對齊 gtoante.js / 前端 gtoantecents）。
"""
import eval7, json, os, sys
from random import Random
from eval7.xorshift_rand import seed as eval7seed

from gtobackup import backup_existing

RANKS = "AKQJT98765432"
SUITS = "shdc"
MC_HU = 15000       # 單挑 equity（建 caller1 範圍用）
MC_3WAY = 2500      # 三人 share 每手取樣數
MCSEED = 20260709   # 固定種子：eq_3way 的 Random 與 eval7 內建 MC（build_hu_eq）都要種，才真的可重現
BASEDIR = os.path.dirname(os.path.abspath(__file__))

# 總 ante 檔位（以 BB 計，含 0）；cents = A×100，對齊前端
ANTES = [0.0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0]
STACKS = list(range(1, 31))
BUCKETS = ["EARLY", "MID", "LATE"]

# jammer 三桶固定代表範圍（同 gtocall.py 的 JAMMER）
JAMMER = {
 "EARLY": "66+,A9s+,ATo+,KTs+,KQo,QJs",
 "MID":   "44+,A2s+,A8o+,K9s+,KTo+,Q9s+,QJo,J9s+,JTo,T9s",
 "LATE":  "22+,A2s+,A2o+,K2s+,K7o+,Q6s+,Q9o+,J7s+,J9o+,T7s+,T9o,96s+,86s+,75s+,65s,54s",
}

def canon():
    seen, u = set(), []
    for i, hi in enumerate(RANKS):
        for j, lo in enumerate(RANKS):
            lab = hi+hi if i == j else (hi+lo+"s" if i < j else RANKS[j]+RANKS[i]+"o")
            if lab not in seen:
                seen.add(lab); u.append(lab)
    return u
HANDS = canon()
def combos(l): return 6 if len(l) == 2 else (4 if l.endswith("s") else 12)
def pct(ls): return round(sum(combos(x) for x in ls)/1326.0*100, 1)

# ---- 卡牌 / combo 展開 ----
DECK = [r+s for r in RANKS for s in SUITS]
CARDID = {c: i for i, c in enumerate(DECK)}
CARDOBJ = [eval7.Card(c) for c in DECK]

def expand_class(label):
    out = []
    if len(label) == 2:
        r = label[0]
        for i in range(4):
            for j in range(i+1, 4):
                out.append((CARDID[r+SUITS[i]], CARDID[r+SUITS[j]]))
    else:
        hi, lo, su = label[0], label[1], label[2]
        if su == "s":
            for s in range(4):
                out.append((CARDID[hi+SUITS[s]], CARDID[lo+SUITS[s]]))
        else:
            for a in range(4):
                for b in range(4):
                    if a != b:
                        out.append((CARDID[hi+SUITS[a]], CARDID[lo+SUITS[b]]))
    return out

def range_combos(labels):
    out = []
    for lab in labels:
        out.extend(expand_class(lab))
    return out

# 一手牌的代表 combo（card id）：對子 s+h、同花 s+s、雜色 s+h。equity 按手型對稱，取一個代表即可。
def rep_ids(l):
    if len(l) == 2:
        return (CARDID[l[0]+"s"], CARDID[l[0]+"h"])
    if l[2] == "s":
        return (CARDID[l[0]+"s"], CARDID[l[1]+"s"])
    return (CARDID[l[0]+"s"], CARDID[l[1]+"h"])

# rep combo（單挑 equity 用一個代表花色即可，跟 gtocall.py 一致）
def rep(l):
    if len(l) == 2:
        return (eval7.Card(l[0]+"s"), eval7.Card(l[0]+"h"))
    return (eval7.Card(l[0]+"s"), eval7.Card(l[1]+("s" if l[2] == "s" else "h")))

# ---- 單挑 equity 快取（每桶：每手 vs jammer 範圍）----
def build_hu_eq():
    out = {}
    for bk, jr in JAMMER.items():
        rng = eval7.HandRange(jr)
        out[bk] = {l: eval7.py_hand_vs_range_monte_carlo(rep(l), rng, [], MC_HU) for l in HANDS}
        print("  hu-eq cached: %s" % bk, flush=True)
    return out

# ---- 三人 share：一手 h vs (jammer combos, caller1 combos) ----
def eq_3way(hpair, jam, call, iters, rng):
    h0, h1 = hpair
    ho = [CARDOBJ[h0], CARDOBJ[h1]]
    njam, ncall = len(jam), len(call)
    win = 0.0
    done = 0
    tries = 0
    lim = iters*40
    while done < iters and tries < lim:
        tries += 1
        j0, j1 = jam[rng.randrange(njam)]
        if j0 == h0 or j0 == h1 or j1 == h0 or j1 == h1:
            continue
        c0, c1 = call[rng.randrange(ncall)]
        if c0 in (h0, h1, j0, j1) or c1 in (h0, h1, j0, j1):
            continue
        used = (h0, h1, j0, j1, c0, c1)
        board = []
        while len(board) < 5:
            card = rng.randrange(52)
            if card in used or card in board:
                continue
            board.append(card)
        bd = [CARDOBJ[x] for x in board]
        sh = eval7.evaluate(ho + bd)
        sj = eval7.evaluate([CARDOBJ[j0], CARDOBJ[j1]] + bd)
        sc = eval7.evaluate([CARDOBJ[c0], CARDOBJ[c1]] + bd)
        best = sh
        if sj > best: best = sj
        if sc > best: best = sc
        if sh == best:
            k = 1
            if sj == best: k += 1
            if sc == best: k += 1
            win += 1.0/k
        done += 1
    return win/done if done else 0.0

# ---- 單調性整理（保證可壓縮）----
def monotonic(labels):
    s = set(labels)
    pr = [r+r for r in RANKS]
    for a in range(len(pr)-1, 0, -1):
        if pr[a] in s: s.add(pr[a-1])
    for suit in ("s", "o"):
        for hi in range(13):
            present = [lo for lo in range(hi+1, 13) if RANKS[hi]+RANKS[lo]+suit in s]
            if present:
                weakest = max(present)
                for lo in range(hi+1, weakest+1):
                    s.add(RANKS[hi]+RANKS[lo]+suit)
    return [h for h in HANDS if h in s]

# ---- 壓縮成 token ----
def compress(labels):
    s = set(labels)
    toks = []
    pairs_idx = sorted("AKQJT98765432".index(l[0]) for l in labels if len(l) == 2)
    if pairs_idx:
        weakest = max(pairs_idx)
        contiguous = all(x in pairs_idx for x in range(0, weakest+1))
        if contiguous:
            toks.append(RANKS[weakest]+RANKS[weakest] + ("+" if weakest > 0 else ""))
        else:
            for i in sorted(set(pairs_idx)):
                toks.append(RANKS[i]+RANKS[i])
    for suit in ("s", "o"):
        for hi in range(13):
            kick = sorted(lo for lo in range(hi+1, 13) if RANKS[hi]+RANKS[lo]+suit in s)
            if not kick:
                continue
            weakest = max(kick)
            top = min(kick)
            if all(x in kick for x in range(top, weakest+1)) and top == hi+1:
                toks.append(RANKS[hi]+RANKS[weakest]+suit+"+")
            else:
                for lo in kick:
                    toks.append(RANKS[hi]+RANKS[lo]+suit)
    return toks

def expand_token(token):
    plus = token.endswith("+")
    body = token[:-1] if plus else token
    out = []
    if len(body) == 2 and body[0] == body[1]:
        vi = RANKS.index(body[0])
        out = [RANKS[i]+RANKS[i] for i in range(vi, -1, -1)] if plus else [body]
    elif len(body) == 3:
        hi, lo, su = body[0], body[1], body[2]
        hii, loi = RANKS.index(hi), RANKS.index(lo)
        if plus:
            out = [hi+RANKS[i]+su for i in range(loi, hii, -1)]
        else:
            out = [body]
    return out

def check(labels, toks):
    got = set()
    for t in toks:
        got.update(expand_token(t))
    if got != set(labels):
        print("  !! COMPRESS MISMATCH", file=sys.stderr)

def main():
    eval7seed(MCSEED)
    print("building HU equity cache...", flush=True)
    hueq = build_hu_eq()
    rng = Random(MCSEED)
    eq3cache = {}       # (bucket, tuple(callrange)) -> {hand: share}
    out = {}
    for bk in BUCKETS:
        jamclasses = [l for l in HANDS if l in _expand_rangestr(JAMMER[bk])]
        jamcombos = range_combos(jamclasses)
        for A in ANTES:
            ac = int(round(A*100))
            for S in STACKS:
                # caller1 面對全下的跟注門檻：他已貼的 1bb 是沉沒成本，只需再投 S-1，
                # 底池 = 全下方 S + 自己 S + SB 的 0.5 + 總 ante A
                # → eq*(2S+0.5+A) - S > -1 → eq > (S-1)/(2S+0.5+A)。
                # 舊寫法 S/(2S+1.5+A) 沒扣掉已投的盲注 → caller1 範圍系統性偏緊。
                hu_thr = (float(S) - 1.0)/(2.0*S + 0.5 + A)
                callrange = tuple(l for l in HANDS if hueq[bk][l] >= hu_thr)
                if not callrange:
                    callrange = ("AA",)
                ckey = (bk, callrange)
                if ckey not in eq3cache:
                    callcombos = range_combos(list(callrange))
                    shares = {l: eq_3way(rep_ids(l), jamcombos, callcombos, MC_3WAY, rng) for l in HANDS}
                    eq3cache[ckey] = shares
                    print("  eq3 field cached: %s callN=%d (total fields %d)" % (bk, len(callrange), len(eq3cache)), flush=True)
                shares = eq3cache[ckey]
                thr3 = float(S)/(3.0*S + 1.5 + A)
                over = monotonic([l for l in HANDS if shares[l] >= thr3])
                toks = compress(over)
                check(over, toks)
                out["%d_%d_%s" % (ac, S, bk)] = {"call": toks, "pct": pct(over)}
        print("bucket %s done" % bk, flush=True)
    outpath = os.path.join(BASEDIR, "frontend", "gtomultiwaycall.js")
    bak = backup_existing(outpath)
    if bak:
        print("backup -> %s" % bak, flush=True)
    with open(outpath, "w", encoding="utf-8") as f:
        f.write("/* 3 人全下池第三家 overcall 精算範圍（gtomultiwaycall.py 產生，勿手改）。key=anteCents_stack_jammerbucket。 */\n")
        f.write("let GTOMULTIWAYCALL=" + json.dumps(out, separators=(",", ":")) + "\n")
    print("WROTE %s  (%d keys)" % (outpath, len(out)), flush=True)

def _expand_rangestr(rangestr):
    # 把 "66+,A9s+,ATo+,..." 展成 HAND class 清單（給 jammer 範圍用）
    out = set()
    for tok in rangestr.split(","):
        out.update(expand_token(tok))
    return out

if __name__ == "__main__":
    main()
