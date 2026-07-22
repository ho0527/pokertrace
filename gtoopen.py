"""
開蓋全下 Nash（阻尼 fictitious play）— eval7 自算，穩定收斂。

做法：
  1. 用 eval7.py_all_hands_vs_range 建 169x169 all-in equity 矩陣 E（169 次呼叫，快）。
  2. 之後所有均衡迭代都在矩陣上做純算術，用阻尼 fictitious play（頻率平滑），不震盪。
     - SB 開蓋：SB vs BB 是 heads-up，算精確 Nash（SB 全下 + BB 跟注互為最佳反應）。
     - UTG..BTN 開蓋：多人桌 chip-EV 模型（後面每人用「面對全下跟注門檻」跟注，獨立近似），
       逐位置解固定點。位置越早、後面人越多 → 偷盲機率越低 → 開蓋越緊（自然單調）。
  3. 對輸出做單調性整理（對子遞增、同高張踢腳遞增）消除 MC 雜訊。

輸出：可貼進 gtodata.js 的開蓋範圍（8 位置 x 3 計分牌）+ SB/BB HU Nash。
"""
import eval7, json, sys

RANKS = "AKQJT98765432"
RVAL = {r: i for i, r in enumerate(RANKS)}  # 0=A(最強)
MC = 12000  # 建矩陣用；越高越穩（邊際手牌不亂跳）。矩陣會快取，只算一次。

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

def combo_label(c1, c2):
    s1, s2 = str(c1), str(c2)
    r1, su1 = s1[0], s1[1]
    r2, su2 = s2[0], s2[1]
    if RVAL[r1] > RVAL[r2]:      # 讓 r1 是較強張（RVAL 小=強）
        r1, r2, su1, su2 = r2, r1, su2, su1
    if r1 == r2:
        return r1 + r2
    return r1 + r2 + ("s" if su1 == su2 else "o")

# ---------- 1. 建 equity 矩陣（有快取就讀） ----------
def build_matrix():
    import os
    if os.path.exists("gtoeqmatrix.json"):
        print("  loading cached equity matrix...", flush=True)
        return json.load(open("gtoeqmatrix.json"))
    full = eval7.HandRange(",".join(HANDS))
    E = [[0.0]*169 for _ in range(169)]
    for j, hj in enumerate(HANDS):
        vil = eval7.HandRange(hj)
        res = eval7.py_all_hands_vs_range(full, vil, [], MC)  # {herocombo: eq}
        acc = [0.0]*169; cnt = [0]*169
        for (c1, c2), eq in res.items():
            ci = IDX[combo_label(c1, c2)]
            acc[ci] += eq; cnt[ci] += 1
        for i in range(169):
            E[i][j] = acc[i]/cnt[i] if cnt[i] else 0.0
        if j % 30 == 0:
            print("  matrix col %d/169" % j, flush=True)
    return E

# equity of class i vs 一個加權範圍 freq[](每類 0..1)
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

def to_freq(freq):
    # 回每手全下頻率 %（給混合策略；只留 >0.5% 的，避免雜訊）
    return {HANDS[i]: round(freq[i]*100, 1) for i in range(169) if freq[i] > 0.005}

# ---------- 2a. HU Nash SB/BB ----------
def hu_nash(E, S, iters=60, alpha=0.25):
    S = float(S)
    sb = [0.5]*169; bb = [0.5]*169
    thr_bb = (S-1.0)/(2.0*S)
    for _ in range(iters):
        pc = freq_pct(bb)
        sb_br = [0.0]*169
        for i in range(169):
            eq = eq_vs(E, i, bb)
            ev = (1.0-pc)*1.0 + pc*((2*eq-1)*S)
            sb_br[i] = 1.0 if ev > -0.5 else 0.0
        sb = [(1-alpha)*sb[i] + alpha*sb_br[i] for i in range(169)]
        bb_br = [0.0]*169
        for j in range(169):
            eq = eq_vs(E, j, sb)
            bb_br[j] = 1.0 if eq > thr_bb else 0.0
        bb = [(1-alpha)*bb[j] + alpha*bb_br[j] for j in range(169)]
    # SB 全下相對棄牌 EV(bb)：EV_shove - EV_fold(-0.5)
    pc = freq_pct(bb); pf = 1.0 - pc
    sbev = {}
    for i in range(169):
        eq = eq_vs(E, i, bb)
        sbev[HANDS[i]] = round((pf*1.0 + pc*((2*eq-1)*S)) + 0.5, 2)
    return to_labels(sb), to_labels(bb), round(freq_pct(sb)*100,1), round(freq_pct(bb)*100,1), to_freq(sb), to_freq(bb), sbev

# ---------- 2b. 多人桌開蓋（chip-EV 獨立近似） ----------
def multiway_open(E, S, k, iters=60, alpha=0.25):
    S = float(S)
    t_call = S/(2.0*S+1.5)
    hero = [0.4]*169
    for _ in range(iters):
        # 後面每人對 hero 全下範圍的跟注 BR
        call_br = [1.0 if eq_vs(E, j, hero) > t_call else 0.0 for j in range(169)]
        cf = freq_pct(call_br)
        pf = (1.0-cf)**k
        hero_br = [0.0]*169
        for i in range(169):
            eqc = eq_vs(E, i, call_br)
            ev = pf*1.5 + (1.0-pf)*(eqc*(2*S+1.5) - S)
            hero_br[i] = 1.0 if ev > 0.0 else 0.0
        hero = [(1-alpha)*hero[i] + alpha*hero_br[i] for i in range(169)]
    # 每手「全下相對棄牌」EV(bb)：>0 該全下、≈0 無差異(混合)、<0 該棄。EV(fold)=0。
    call_br = [1.0 if eq_vs(E, j, hero) > t_call else 0.0 for j in range(169)]
    pf = (1.0-freq_pct(call_br))**k
    evmap = {}
    for i in range(169):
        eqc = eq_vs(E, i, call_br)
        evmap[HANDS[i]] = round(pf*1.5 + (1.0-pf)*(eqc*(2*S+1.5) - S), 2)
    return to_labels(hero), round(freq_pct(hero)*100,1), to_freq(hero), evmap

# ---------- 3. 單調性整理 ----------
def monotonic(labels):
    s = set(labels)
    # 對子遞增：低對在 → 高對在
    pr = [r+r for r in RANKS]
    for a in range(len(pr)-1, 0, -1):
        if pr[a] in s: s.add(pr[a-1])
    # 同高張踢腳遞增（s/o 各自）
    for suit in ("s", "o"):
        for hi in range(13):
            present = [lo for lo in range(hi+1, 13) if RANKS[hi]+RANKS[lo]+suit in s]
            if present:
                weakest = max(present)   # 最弱踢腳的 index（index 越大越弱）；比它強的踢腳全補上
                for lo in range(hi+1, weakest+1):
                    s.add(RANKS[hi]+RANKS[lo]+suit)
    # 依標準順序輸出
    return [h for h in HANDS if h in s]

def main():
    print("building equity matrix...", flush=True)
    E = build_matrix()
    json.dump(E, open("gtoeqmatrix.json", "w"))
    print("matrix done.", flush=True)
    # 每個桌型「開蓋位置 -> 後面人數」（SB 一律用精確 HU Nash）
    TABLES = {
        "9MAX": {"UTG":8,"UTG1":7,"MP":6,"LJ":5,"HJ":4,"CO":3,"BTN":2},
        "6MAX": {"UTG":5,"MP":4,"CO":3,"BTN":2},
    }
    out = {}
    hu_cache = {}
    for tbl, behind in TABLES.items():
        out[tbl] = {"open": {}, "hu": {}}
        for S in range(1, 31):
            for pos, k in behind.items():
                labels, pct, freq, evmap = multiway_open(E, S, k)
                labels = monotonic(labels)
                out[tbl]["open"]["%d_%s" % (S, pos)] = {"jam": labels, "pct": pct, "freq": freq, "ev": evmap}
                print("%s OPEN S=%d %-4s -> %.1f%% (%d)" % (tbl, S, pos, pct, len(labels)), flush=True)
            if S not in hu_cache:
                sb, bb, sbp, bbp, sbfreq, bbfreq, sbev = hu_nash(E, S)
                hu_cache[S] = (monotonic(sb), monotonic(bb), sbp, bbp, sbfreq, bbfreq, sbev)
            sb, bb, sbp, bbp, sbfreq, bbfreq, sbev = hu_cache[S]
            out[tbl]["open"]["%d_SB" % S] = {"jam": sb, "pct": sbp, "freq": sbfreq, "ev": sbev}
            out[tbl]["hu"]["%d" % S] = {"sb_pct": sbp, "bb_call": bb, "bb_pct": bbp, "bb_freq": bbfreq}
            print("%s OPEN S=%d SB   -> %.1f%% (HU Nash);  BB call %.1f%%" % (tbl, S, sbp, bbp), flush=True)
    json.dump(out, open("gtoopenout.json", "w"))
    print("DONE", flush=True)

if __name__ == "__main__":
    main()
