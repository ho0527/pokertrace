"""
算短牌（36 張）的起手牌全下勝率矩陣（81x81：9 個對子 + 36 個同花 + 36 個不同花）。

★關鍵★：eval7 內建的 py_all_hands_vs_range / py_hand_vs_range_monte_carlo 是用標準
52 張規則判斷誰贏（葫蘆>同花），不能直接拿來用在短牌，會算錯。這裡自己寫蒙地卡羅，
每次比大小都呼叫 shortdeckgto.shortdeck_key()。

用法：
    python shortdeckequity.py          # 算完存成 shortdeckeqmatrix.json

★精度★：這個矩陣是 shortdeckpreflow.py 與 shortdeckpushfold.py「全部牌力排序」的唯一依據，
每格的蒙地卡羅標準誤 ≈ 0.5/sqrt(SAMPLES_PER_PAIR)。原本 1500 樣本 ≈ 1.3% 標準誤，足以把
相鄰手牌的順序翻掉（shortdeckpushfold.monotonic() 事後硬壓平就是在補這個精度不足），
所以改成 20000 樣本 ≈ 0.35% 標準誤。窮舉評估過不可行：3321 組手牌對位 × C(32,5)=201376 個
board ≈ 6.7 億個局面、每個要跑兩次 shortdeck_key()，純 Python 跑不完，蒙地卡羅加樣本才實際。
提高樣本數大約是原本的 13 倍運算量，而且★要重跑 shortdeckequity.py 才會生效★
（重跑後也要依序重跑 shortdeckpreflow.py → shortdeckpushfold.py）。
"""
import itertools
import json
import os
import time

import numpy as np

import shortdeckgto as sd

BASEDIR=os.path.dirname(os.path.abspath(__file__))
RANKS = sd.RANKS         # "6789TJQKA"：牌組本身的順序，跟起手牌命名順序無關
RANKS_DESC = "AKQJT9876"  # 命名用：高張在前（跟 "AKs"/"76o" 這種慣例一致），9 個字元
SAMPLES_PER_PAIR=20000  # 每格樣本數；標準誤 ≈ 0.5/sqrt(N) ≈ 0.35%


def canon_hands():
    seen, out = set(), []
    for i, hi in enumerate(RANKS_DESC):
        for j, lo in enumerate(RANKS_DESC):
            lab = hi + hi if i == j else (hi + lo + "s" if i < j else RANKS_DESC[j] + RANKS_DESC[i] + "o")
            if lab not in seen:
                seen.add(lab)
                out.append(lab)
    return out


HANDS = canon_hands()
assert len(HANDS) == 81, "短牌應該是 81 種起手牌，實際 %d" % len(HANDS)
HANDIDX = {h: i for i, h in enumerate(HANDS)}


def combos_of(label):
    """展開一個 label（如 "AKs"）成所有實際 combo（用短牌 4 種花色）。"""
    if len(label) == 2:
        r = label[0]
        return [(r + a, r + b) for a, b in itertools.combinations(sd.SUITS, 2)]
    hi, lo, suited = label[0], label[1], label[2] == "s"
    if suited:
        return [(hi + s, lo + s) for s in sd.SUITS]
    return [(hi + s1, lo + s2) for s1 in sd.SUITS for s2 in sd.SUITS if s1 != s2]


COMBO_CACHE = {h: combos_of(h) for h in HANDS}


def build_matrix(samples_per_pair=SAMPLES_PER_PAIR, seed=0):
    n = len(HANDS)
    wins = np.zeros((n, n))
    counts = np.zeros((n, n))
    rng = np.random.default_rng(seed)
    remaining_all = sd.ALLCARDS

    t0 = time.time()
    for i in range(n):
        combos_i = COMBO_CACHE[HANDS[i]]
        for j in range(i, n):
            combos_j = COMBO_CACHE[HANDS[j]]
            w = 0.0
            c = 0
            tries = 0
            target = samples_per_pair
            while c < target and tries < target * 4:
                tries += 1
                ci = combos_i[rng.integers(0, len(combos_i))]
                cj = combos_j[rng.integers(0, len(combos_j))]
                used = set(ci) | set(cj)
                if len(used) != 4:
                    continue  # 同一 combo 撞牌（i==j 時常見），跳過重抽
                pool = [x for x in remaining_all if x not in used]
                idx = rng.choice(len(pool), size=5, replace=False)
                board = [pool[k] for k in idx]
                si = sd.shortdeck_key(list(ci) + board)
                sj = sd.shortdeck_key(list(cj) + board)
                if si > sj:
                    w += 1.0
                elif si == sj:
                    w += 0.5
                c += 1
            wins[i, j] = w
            counts[i, j] = c
            if i != j:
                wins[j, i] = c - w
                counts[j, i] = c
        if i % 10 == 0:
            print("  %d/%d hands done (%.1fs elapsed)" % (i, n, time.time() - t0), flush=True)

    eq = np.divide(wins, counts, out=np.full((n, n), 0.5), where=counts > 0)
    return eq


def main():
    eq = build_matrix()
    out = eq.tolist()
    outfile=os.path.join(BASEDIR, "shortdeckeqmatrix.json")
    json.dump(out, open(outfile, "w", encoding="utf-8"))
    print("done ->", outfile)
    print("重跑順序提醒：接著要跑 python shortdeckpreflow.py，再跑 python shortdeckpushfold.py")
    # 抽幾個檢查：AA 應該遠大於 76o（短牌沒有 2~5，最小的手是 76o）
    print("AA avg equity:", round(sum(eq[HANDIDX["AA"]]) / len(HANDS), 3))
    print("76o avg equity:", round(sum(eq[HANDIDX["76o"]]) / len(HANDS), 3))
    print("KK vs AA:", round(eq[HANDIDX["KK"]][HANDIDX["AA"]], 3))


if __name__ == "__main__":
    main()
