"""
Ante-adjusted push/fold 範圍（open jam + call-vs-jam），依「總 ante（以 BB 計）」重算。

原理：ante 只是把死錢加進底池。開蓋全下模型（見 gtoopen.py multiway_open）的死錢 1.5(SB+BB)
變成 1.5+A；面對全下跟注的底池賠率門檻是 (S-1)/(2S+0.5+A)（跟注方是 BB，已貼的 1bb 是沉沒成本，
只需再投 S-1，底池含自己的 S、對方的 S、SB 的 0.5 與 ante A）。equity 矩陣/快取與 ante
無關（只跟牌與對手範圍有關），所以重算幾乎免費。

輸出 frontend/gtoante.js：
  GTOANTE_LEVELS      = [總 ante(BB) 檔位]
  GTOANTEOPEN["A_S_k"]     = { jam:[壓縮 token], pct }   （k=2..9；HU 用 "A_S_SB"）
  GTOANTECALL["A_S_BUCKET"]= { call:[壓縮 token], pct }  （BUCKET=EARLY/MID/LATE）
token 用壓縮寫法（22+/A9s+/KQo…），前端 gtoexpand 會展開，檔案較小。
"""
import eval7, json, os, sys
from eval7.xorshift_rand import seed as eval7seed

from gtobackup import backup_existing

RANKS = "AKQJT98765432"
RVAL = {r: i for i, r in enumerate(RANKS)}
MC = 15000
MCSEED = 20260709        # 固定種子 → MC 抽樣可重現（同 gtomultiwaycall.py 的 Random(20260709) 做法）
BASEDIR = os.path.dirname(os.path.abspath(__file__))
EQCACHE = os.path.join(BASEDIR, "gtoeqmatrix.json")

def canon():
    seen, u = set(), []
    for i, hi in enumerate(RANKS):
        for j, lo in enumerate(RANKS):
            lab = hi+hi if i == j else (hi+lo+"s" if i < j else RANKS[j]+RANKS[i]+"o")
            if lab not in seen:
                seen.add(lab); u.append(lab)
    return u
HANDS = canon()
IDX = {h: i for i, h in enumerate(HANDS)}
def combos(l): return 6 if len(l) == 2 else (4 if l.endswith("s") else 12)
COMBOS = [combos(h) for h in HANDS]
def pct(ls): return round(sum(combos(x) for x in ls)/1326.0*100, 1)

# 總 ante 檔位（以 BB 計）。前端把「每人 ante% × 人數」貼到最近檔。
ANTES = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0]
STACKS = list(range(1, 31))
KS = [2, 3, 4, 5, 6, 7, 8, 9]   # 後面人數（開蓋）

# ---------- equity 矩陣（open 用，讀快取） ----------
def combo_label(c1, c2):
    s1, s2 = str(c1), str(c2)
    r1, su1 = s1[0], s1[1]
    r2, su2 = s2[0], s2[1]
    if RVAL[r1] > RVAL[r2]:
        r1, r2, su1, su2 = r2, r1, su2, su1
    return r1 + r2 if r1 == r2 else r1 + r2 + ("s" if su1 == su2 else "o")

def build_matrix():
    if os.path.exists(EQCACHE):
        print("  loading cached equity matrix...", flush=True)
        return json.load(open(EQCACHE, encoding="utf-8"))
    full = eval7.HandRange(",".join(HANDS))
    E = [[0.0]*169 for _ in range(169)]
    for j, hj in enumerate(HANDS):
        vil = eval7.HandRange(hj)
        res = eval7.py_all_hands_vs_range(full, vil, [], MC)
        acc = [0.0]*169; cnt = [0]*169
        for (c1, c2), eq in res.items():
            ci = IDX[combo_label(c1, c2)]
            acc[ci] += eq; cnt[ci] += 1
        for i in range(169):
            E[i][j] = acc[i]/cnt[i] if cnt[i] else 0.0
    # 算完寫回快取（169 次 MC 很貴），不然快取遺失時每跑一次就重算一遍
    json.dump(E, open(EQCACHE, "w", encoding="utf-8"))
    print("  equity matrix cached -> %s" % EQCACHE, flush=True)
    return E

def eq_vs(E, i, freq):
    num = 0.0; den = 0.0
    for j in range(169):
        w = freq[j]*COMBOS[j]
        if w > 0:
            num += w*E[i][j]; den += w
    return num/den if den > 0 else 0.0

def freq_pct(freq):
    return sum(freq[j]*COMBOS[j] for j in range(169))/1326.0

def to_labels(freq, thr=0.5):
    return [HANDS[i] for i in range(169) if freq[i] >= thr]

# ---------- open：多人桌 chip-EV（含 ante A） ----------
def multiway_open(E, S, k, A, iters=60, alpha=0.25):
    S = float(S); dead = 1.5 + A
    t_call = S/(2.0*S + dead)
    hero = [0.4]*169
    for _ in range(iters):
        call_br = [1.0 if eq_vs(E, j, hero) > t_call else 0.0 for j in range(169)]
        cf = freq_pct(call_br)
        pf = (1.0-cf)**k
        hero_br = [0.0]*169
        for i in range(169):
            eqc = eq_vs(E, i, call_br)
            ev = pf*dead + (1.0-pf)*(eqc*(2*S+dead) - S)
            hero_br[i] = 1.0 if ev > 0.0 else 0.0
        hero = [(1-alpha)*hero[i] + alpha*hero_br[i] for i in range(169)]
    return to_labels(hero), round(freq_pct(hero)*100, 1)

def hu_nash(E, S, A, iters=60, alpha=0.25):
    # HU：hero 就是 SB，dead 不能沿用開蓋的 1.5+A（那份含 SB 自己貼的 0.5）。
    # BB 蓋牌時 SB 淨賺 BB 的 1bb + 總 ante A（自己的 0.5 是拿回來，不是賺到）；
    # 對照 gtoopen.hu_nash 無 ante 版用的就是 1.0。
    S = float(S); dead = 1.0 + A
    sb = [0.5]*169; bb = [0.5]*169
    # BB 跟注門檻：BB 已貼 1bb（沉沒），再投 S-1 去搶 2S+A 的底池；
    # eq*(2S+A) - S > -1  →  eq > (S-1)/(2S+A)。ante 讓底池變大 → 門檻變低 → BB 跟得更寬。
    thr_bb = (S - 1.0)/(2.0*S + A)
    for _ in range(iters):
        pc = freq_pct(bb)
        sb_br = [0.0]*169
        for i in range(169):
            eq = eq_vs(E, i, bb)
            ev = (1.0-pc)*dead + pc*(eq*(2.0*S + A) - S)   # 被跟注：底池 2S+A，SB 投入 S
            sb_br[i] = 1.0 if ev > -0.5 else 0.0
        sb = [(1-alpha)*sb[i] + alpha*sb_br[i] for i in range(169)]
        bb_br = [1.0 if eq_vs(E, j, sb) > thr_bb else 0.0 for j in range(169)]
        bb = [(1-alpha)*bb[j] + alpha*bb_br[j] for j in range(169)]
    return to_labels(sb), round(freq_pct(sb)*100, 1)

# ---------- call-vs-jam（含 ante A） ----------
JAMMER = {
 "EARLY": "66+,A9s+,ATo+,KTs+,KQo,QJs",
 "MID":   "44+,A2s+,A8o+,K9s+,KTo+,Q9s+,QJo,J9s+,JTo,T9s",
 "LATE":  "22+,A2s+,A2o+,K2s+,K7o+,Q6s+,Q9o+,J7s+,J9o+,T7s+,T9o,96s+,86s+,75s+,65s,54s",
}
def rep(l):
    if len(l) == 2: return (eval7.Card(l[0]+"s"), eval7.Card(l[0]+"h"))
    return (eval7.Card(l[0]+"s"), eval7.Card(l[1]+("s" if l[2]=="s" else "h")))

# ---------- 單調性整理（保證可壓縮） ----------
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

# ---------- 壓縮成 token（22+/A9s+/…） ----------
def compress(labels):
    s = set(labels)
    toks = []
    # 對子：單調後為 AA 起連續前綴 → 取最弱對 + "+"
    pairs_idx = sorted(RVAL[l[0]] for l in labels if len(l) == 2)
    if pairs_idx:
        weakest = max(pairs_idx)
        toks.append(RANKS[weakest] + RANKS[weakest] + ("+" if weakest > 0 and 0 in pairs_idx else ""))
        # 若非從 AA 連續（理論上單調後不會），退化成逐一
        if not all(x in pairs_idx for x in range(0, weakest+1)):
            toks[-1:] = [RANKS[i]+RANKS[i] for i in sorted(set(pairs_idx))]
    for suit in ("s", "o"):
        for hi in range(13):
            kick = sorted(lo for lo in range(hi+1, 13) if RANKS[hi]+RANKS[lo]+suit in s)
            if not kick:
                continue
            weakest = max(kick)   # 較弱踢腳（index 大）
            top = min(kick)       # 較強踢腳（index 小）
            # 連續且延伸到 hi+1（最強踢腳）→ 用 "+"；否則逐一
            if all(x in kick for x in range(top, weakest+1)) and top == hi+1:
                toks.append(RANKS[hi] + RANKS[weakest] + suit + "+")
            else:
                for lo in kick:
                    toks.append(RANKS[hi] + RANKS[lo] + suit)
    return toks

# 展開 token 驗證（對照前端 gtoexpand 的語意）
def expand(token):
    plus = token.endswith("+")
    body = token[:-1] if plus else token
    out = []
    if len(body) == 2 and body[0] == body[1]:
        vi = RVAL[body[0]]
        out = [RANKS[i]+RANKS[i] for i in range(vi, -1, -1)] if plus else [body]
    elif len(body) == 3:
        hi, lo, su = body[0], body[1], body[2]
        hii, loi = RVAL[hi], RVAL[lo]
        if plus:
            out = [hi+RANKS[i]+su for i in range(loi, hii, -1)]
        else:
            out = [body]
    return out

def check(labels, toks):
    got = set()
    for t in toks:
        got.update(expand(t))
    want = set(labels)
    if got != want:
        print("  !! COMPRESS MISMATCH  missing=%s extra=%s" % (sorted(want-got), sorted(got-want)), file=sys.stderr)
        return False
    return True

def main():
    eval7seed(MCSEED)
    E = build_matrix()
    print("matrix ready", flush=True)
    open_out = {}
    hu_cache = {}
    for A in ANTES:
        ac = int(round(A*100))   # 以「BB 的百分之一」為 key，避免 1.0 在 JS 變 "1" 的浮點字串不一致
        for S in STACKS:
            for k in KS:
                labels = monotonic(multiway_open(E, S, k, A)[0])
                toks = compress(labels)
                check(labels, toks)
                open_out["%d_%d_%d" % (ac, S, k)] = {"jam": toks, "pct": pct(labels)}
            key = (S, A)
            if key not in hu_cache:
                sb = monotonic(hu_nash(E, S, A)[0])
                hu_cache[key] = sb
            sb = hu_cache[key]
            tk = compress(sb)
            check(sb, tk)
            open_out["%d_%d_SB" % (ac, S)] = {"jam": tk, "pct": pct(sb)}
        print("open A=%s done" % A, flush=True)
    # call
    eqcache = {}
    for bk, jr in JAMMER.items():
        rng = eval7.HandRange(jr)
        eqcache[bk] = {l: eval7.py_hand_vs_range_monte_carlo(rep(l), rng, [], MC) for l in HANDS}
        print("cached call eq %s" % bk, flush=True)
    call_out = {}
    for A in ANTES:
        ac = int(round(A*100))
        for S in STACKS:
            # 跟注方（絕大多數情境就是 BB）已經貼了 1bb，那是沉沒成本：
            # 底池 = 全下方 S + 自己 S + SB 的 0.5 + 總 ante A，實際只要再投 S-1。
            # eq*(2S+0.5+A) - S > -1  →  eq > (S-1)/(2S+0.5+A)。用 S/(2S+1.5+A) 會系統性偏緊。
            thr = (float(S) - 1.0)/(2.0*float(S) + 0.5 + A)
            for bk in JAMMER:
                calls = monotonic([l for l in HANDS if eqcache[bk][l] >= thr])
                tk = compress(calls)
                check(calls, tk)
                call_out["%d_%d_%s" % (ac, S, bk)] = {"call": tk, "pct": pct(calls)}
        print("call A=%s done" % A, flush=True)
    outpath = os.path.join(BASEDIR, "frontend", "gtoante.js")
    bak = backup_existing(outpath)
    if bak:
        print("backup -> %s" % bak, flush=True)
    with open(outpath, "w", encoding="utf-8") as f:
        f.write("/* Ante 調整後 push/fold 範圍（由 gtoante.py 產生，勿手改）。總 ante 以 BB 計。 */\n")
        f.write("let GTOANTE_LEVELS=" + json.dumps(ANTES) + "\n")
        f.write("let GTOANTEOPEN=" + json.dumps(open_out, separators=(",", ":")) + "\n")
        f.write("let GTOANTECALL=" + json.dumps(call_out, separators=(",", ":")) + "\n")
    print("WROTE %s" % outpath, flush=True)

if __name__ == "__main__":
    main()
