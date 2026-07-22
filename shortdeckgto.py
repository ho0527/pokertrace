"""
短牌（Short Deck / 6+ Hold'em）GTO 模組。獨立檔案，不動現有標準德州（52 張）的
gtosolvecore.py / gtoworker.py / backend/api/gto.py。

短牌跟標準德州的差異，這個檔案要處理的：
    1. 牌組只有 36 張（拿掉 2、3、4、5）。
    2. 牌型大小不同：同花 > 葫蘆（因為 36 張牌組同花機率大增，標準排序在這裡不成立）。
    3. 有一種特殊的「最小順子」A-6-7-8-9（沒有 2~5 可以組 A2345 那個輪子，
       改用 A 當最小張搭 6789，等級是所有順子裡最低的）。eval7 是照標準 52 張的
       規則寫的，不會認得這組是順子（會判成散牌），所以要自己補這個特例。
    4. 承上，A-6-7-8-9 同花時就是同花順，而且是最小的同花順（比 6789T 同花順小、
       但仍然大於四條）。eval7 只會把它判成普通同花，所以這個也要自己補。

eval7 本身沒有「短牌模式」開關（已經實測驗證：標準規則下葫蘆數值 34385920 > 同花
17528064，短牌需要相反）。這裡的做法：用 eval7.evaluate() 拿到標準牌值，
用 eval7.handtype() 拿到牌型類別名稱，再套一份「短牌牌型順序」自己排序，
同花跟葫蘆對調，並補上 A6789 特殊順子。牌型類別內部的踢腳大小順序沿用 eval7
本身算出來的數值（同類別內部的相對大小不受這個排序調整影響，可以直接沿用）。
"""
import itertools

import eval7

RANKS = "6789TJQKA"          # 短牌 9 個點數（沒有 2345）
SUITS = "cdhs"
ALLCARDS = [r + s for r in RANKS for s in SUITS]   # 36 張
CARDOBJ = {c: eval7.Card(c) for c in ALLCARDS}
CIDX = {c: i for i, c in enumerate(ALLCARDS)}

# 標準 52 張的牌型順序（eval7.handtype 用這幾個字串）：
#   High Card < Pair < Two Pair < Trips < Straight < Flush < Full House < Quads < Straight Flush
# 短牌只有同花／葫蘆對調：
SHORTDECK_ORDER = [
    "High Card", "Pair", "Two Pair", "Trips", "LowStraight",
    "Straight", "Full House", "Flush", "Quads",
    "LowStraightFlush", "Straight Flush",
]
SHORTDECK_RANK = {name: i for i, name in enumerate(SHORTDECK_ORDER)}

LOW_STRAIGHT_RANKS = set("A6789")
# 類別之間的乘數。eval7 的 v 最大到 135,004,160（TJQKA 同花順），乘數必須大於它，
# 否則相鄰類別的區間會重疊、類別順序會被 v 蓋掉（同花會被葫蘆反超）。
CATMULTIPLIER = 200_000_000


def _ranks_present(cardstrs):
    return set(c[0] for c in cardstrs)


def _lowstraightflushed(cardstrs):
    """這 5~7 張裡是否有某一個花色同時涵蓋 A,6,7,8,9（短牌最小同花順）。"""
    suitranks = {}
    for c in cardstrs:
        if c[1] not in suitranks:
            suitranks[c[1]] = set()
        suitranks[c[1]].add(c[0])
    lowed = False
    for suit in suitranks:
        if LOW_STRAIGHT_RANKS.issubset(suitranks[suit]):
            lowed = True
    return lowed


def shortdeck_key(cardstrs):
    """cardstrs：5~7 張牌的字串列表（如 ["Ah","6d","7c","8s","9h"]）。
    回傳可比較的 (類別序, 標準數值) tuple，數字越大牌越強。"""
    cardobjs = [CARDOBJ[c] for c in cardstrs]
    v = eval7.evaluate(cardobjs)
    cat = eval7.handtype(v)
    key = (SHORTDECK_RANK[cat], v)
    # eval7 不認得 A-6-7-8-9（52 張規則裡這不是連續點數），這裡補上短牌的特例：
    # 只要手上這 5~7 張牌涵蓋 A,6,7,8,9 這五個點數，就再看這五張是不是同一花色，
    # 同花色＝全短牌最低的同花順（eval7 只會判成普通同花），不同花色＝最低的順子。
    # cat 已經是 Straight Flush 代表同花色裡有 6789T 以上、比 A6789 更大的同花順，沿用 eval7。
    if cat != "Straight Flush" and LOW_STRAIGHT_RANKS.issubset(_ranks_present(cardstrs)):
        if _lowstraightflushed(cardstrs):
            key = (SHORTDECK_RANK["LowStraightFlush"], 0)
        elif cat in ("High Card", "Pair", "Two Pair", "Trips"):
            key = (SHORTDECK_RANK["LowStraight"], 0)
    return key


def shortdeck_evaluate(cardstrs):
    """回傳單一可比較數值（cat*CATMULTIPLIER + v 的合成分數），方便跟 numpy 向量化比較共用。"""
    catrank, v = shortdeck_key(cardstrs)
    return catrank * CATMULTIPLIER + v


def expand_range(rangestr, boardset):
    """跟 gtosolvecore.expand_range 一樣，但只認短牌的 9 個點數。"""
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


if __name__ == "__main__":
    # 自我測試：確認同花>葫蘆、A6789 順子被正確辨識、且排在順子裡最低。
    tests = [
        ("同花", ["Ah", "Kh", "9h", "7h", "6h"]),
        ("葫蘆", ["Ah", "Ad", "Ac", "Kh", "Kd"]),
        ("標準順子 6789T", ["6h", "7d", "8c", "9s", "Th"]),
        ("A6789 特殊順子", ["Ah", "6d", "7c", "8s", "9h"]),
        ("三條", ["Ah", "Ad", "Ac", "Kh", "Qd"]),
        ("四條", ["Ah", "Ad", "Ac", "As", "Kh"]),
        ("A6789 同花順", ["Ah", "6h", "7h", "8h", "9h"]),
        ("6789T 同花順", ["6h", "7h", "8h", "9h", "Th"]),
    ]
    results = {}
    for name, cards in tests:
        key = shortdeck_key(cards)
        results[name] = key
        print("%-16s key=%s" % (name, key))

    assert results["同花"] > results["葫蘆"], "同花應該大於葫蘆"
    assert results["葫蘆"] > results["標準順子 6789T"], "葫蘆應該大於順子"
    assert results["標準順子 6789T"] > results["A6789 特殊順子"], "A6789 應該是最低順子"
    assert results["A6789 特殊順子"] > results["三條"], "A6789 順子仍然大於三條"
    assert results["四條"] > results["同花"], "四條大於同花"
    assert results["A6789 同花順"] > results["四條"], "A6789 同花是同花順，大於四條"
    assert results["6789T 同花順"] > results["A6789 同花順"], "A6789 是最低的同花順"
    print("\n全部通過：同花>葫蘆、A6789 是最低順子、A6789 同花是最低同花順、其餘順序正確。")
