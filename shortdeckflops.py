"""
短牌版「不同構 flop」生成器。演算法跟 gtoflops.py 完全一樣（花色只是標籤，重新標號消除
花色置換造成的重複），差別只在牌組換成短牌的 36 張（9 個點數 6789TJQKA）。

用法：
    python shortdeckflops.py   # 產生並存成 shortdeckflops_canonical.json
"""
import itertools
import json
import os

import shortdeckgto as sd

BASEDIR=os.path.dirname(os.path.abspath(__file__))
RANKS = sd.RANKS          # "6789TJQKA"
ALLCARDS = sd.ALLCARDS     # 36 張
RVAL = {r: i for i, r in enumerate(RANKS)}


def canon_key(board):
    used = sorted(set(c[1] for c in board))
    best = None
    for perm in itertools.permutations(range(len(used)), len(used)):
        remap = {s: perm[i] for i, s in enumerate(used)}
        labeled = tuple(sorted(((RVAL[c[0]], remap[c[1]]) for c in board), reverse=True))
        if best is None or labeled < best:
            best = labeled
    return best


def generate_canonical_flops():
    seen = {}
    for combo in itertools.combinations(ALLCARDS, 3):
        key = canon_key(combo)
        if key not in seen:
            seen[key] = list(combo)
    return list(seen.values())


if __name__ == "__main__":
    flops = generate_canonical_flops()
    print("短牌不同構 flop 數量:", len(flops))
    print("範例（前 10 個）:", flops[:10])
    outfile=os.path.join(BASEDIR, "shortdeckflops_canonical.json")
    json.dump(flops, open(outfile, "w", encoding="utf-8"))
    print("已存成", outfile)
