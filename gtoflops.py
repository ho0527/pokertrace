"""
產生「不同構」flop 清單：花色只是標籤，AhKhQc 跟 AsKsQd 策略上等價（都是「兩張同花+一張不同花」
的 A-K-Q），所以枚舉全部 C(52,3)=22100 個 flop 後，用花色重新標號的方式去重，
只留代表花色組（每組挑第一個出現的當代表），標準結果應為 1755 個。

用法：
    python gtoflops.py            # 產生並存成 gtoflops_canonical.json，印出數量與範例
"""
import itertools
import json

RANKS = "23456789TJQKA"
SUITS = "cdhs"
ALLCARDS = [r + s for r in RANKS for s in SUITS]
RVAL = {r: i for i, r in enumerate(RANKS)}  # 數字越大越強


def canon_key(board):
    """花色重新標號消除花色置換造成的重複。
    對子/三條會讓同 rank 的牌花色可互換，單純用「出現順序」編號會漏掉這個對稱，
    所以改成：對牌面實際用到的花色做全部排列，每種排列都算一次標準化結果，取字典序最小者。"""
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
    print("不同構 flop 數量:", len(flops))
    print("範例（前 10 個）:", flops[:10])
    json.dump(flops, open("gtoflops_canonical.json", "w", encoding="utf-8"))
    print("已存成 gtoflops_canonical.json")
