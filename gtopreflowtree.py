"""
把「翻前對戰樹」從 push/fold 擴充到深計分牌開池/3bet/面對3bet/面對4bet，補齊所有位置兩兩配對
（現在 gtodata.js 裡 3BET 只有 6 組對位、VS3BET 只有 4 組、VS4BET 只有 4 組，其餘位置對位缺資料）。

★這仍然是「參考範圍」，不是逐對 solver 精算★——用 gtoeqmatrix.json（既有的 169x169 全下勝率矩陣）
當作牌力排序基準，再依位置寬窄規則切出 raise/call 區間。跟之前幫 flop 補齊位置對位時「用開池
range 當跟注 range 近似」是同一種等級的簡化，老實標註，不宣稱等同 solver 解。

輸出：一段可以貼進 frontend/gtodata.js 的 JS 區塊（取代 GTO3BET/GTOVS3BET/GTOVS4BET 三個資料表
與對應的 MATCHUPS 清單）。
"""
import json
import os

RANKS = "AKQJT98765432"
RVAL = {r: i for i, r in enumerate(RANKS)}
BASEDIR = os.path.dirname(os.path.abspath(__file__))
EQCACHE = os.path.join(BASEDIR, "gtoeqmatrix.json")


def canon_hands():
    seen, out = set(), []
    for i, hi in enumerate(RANKS):
        for j, lo in enumerate(RANKS):
            lab = hi + hi if i == j else (hi + lo + "s" if i < j else RANKS[j] + RANKS[i] + "o")
            if lab not in seen:
                seen.add(lab)
                out.append(lab)
    return out


HANDS = canon_hands()
HANDIDX = {h: i for i, h in enumerate(HANDS)}


def combos(h):
    return 6 if len(h) == 2 else (4 if h.endswith("s") else 12)


def expand_token(token):
    """跟 frontend/gto.js 的 gtoexpand() 同一套規則：22+ / A9s+ / ATo+ / KQo / 98s。"""
    plus = token.endswith("+")
    body = token[:-1] if plus else token
    out = []
    if len(body) == 2 and body[0] == body[1]:
        vi = RANKS.index(body[0])
        if plus:
            out.extend(RANKS[i] + RANKS[i] for i in range(vi + 1))
        else:
            out.append(body)
        return out
    if len(body) == 3:
        hi, lo, suit = body[0], body[1], body[2]
        hii, loi = RANKS.index(hi), RANKS.index(lo)
        if plus:
            out.extend(hi + RANKS[i] + suit for i in range(loi, hii, -1))
        else:
            out.append(body)
    return out


def expand_range(tokens):
    out = []
    for t in tokens:
        out.extend(expand_token(t))
    return out


# ---- 用既有的全下勝率矩陣當牌力排序基準（平均勝率越高排越前面） ----
STRENGTHORDER = []


def strength_order():
    """gtoeqmatrix.json（gtoopen.py 產生的快取）lazy load：不要在 import 時讀，
    不然從別的目錄 import 這個模組會直接失敗；缺檔時給友善訊息（比照 gtoworker.load_flops）。"""
    if not STRENGTHORDER:
        if not os.path.exists(EQCACHE):
            raise SystemExit("找不到 %s，請先執行 python gtoopen.py 產生全下勝率矩陣快取" % EQCACHE)
        eq = json.load(open(EQCACHE, encoding="utf-8"))
        avgeq = {HANDS[i]: sum(eq[i]) / len(eq[i]) for i in range(169)}
        STRENGTHORDER.extend(sorted(HANDS, key=lambda h: -avgeq[h]))
    return STRENGTHORDER


def top_pct_by_combos(pctstart, pctend):
    """依牌力排序，挑出「combo 佔比落在 [pctstart, pctend) 區間」的手牌清單。
    用起點位置判斷分桶（不是重疊區間），確保同一手牌只會落進一個桶，不會 raise/call 重複。"""
    total = 1326.0
    acc = 0.0
    out = []
    for h in strength_order():
        lo = acc
        acc += combos(h)
        if pctstart <= lo / total < pctend:
            out.append(h)
    return out


# ---- 位置順序（決定誰在後面、可以對誰 3bet/4bet） ----
ORDER = ["UTG", "UTG1", "MP", "LJ", "HJ", "CO", "BTN", "SB", "BB"]


def gap_width(opener, threebettor):
    """位置差距越大（3bettor 相對更晚、後面沒人擋），3bet range 越寬一點點。"""
    gi, gj = ORDER.index(opener), ORDER.index(threebettor)
    gap = gj - gi
    base = 0.07  # ~7% 起跳（早位對早位，緊）
    return min(base + gap * 0.012, 0.14)  # 最寬封頂 14%


def gen_pairs():
    pairs = []
    for i in range(len(ORDER)):
        for j in range(i + 1, len(ORDER)):
            pairs.append((ORDER[i], ORDER[j]))
    return pairs


def build():
    gto3bet, gtovs3bet, gtovs4bet = {}, {}, {}
    threebet_matchups, vs3bet_matchups, vs4bet_matchups = [], [], []

    for opener, threebettor in gen_pairs():
        # ---- 3BET：key = 3bettorvOpener ----
        width = gap_width(opener, threebettor)
        raise3 = top_pct_by_combos(0, width * 0.6)
        call3 = top_pct_by_combos(width * 0.6, width * 1.8)
        key3 = "%sv%s" % (threebettor, opener)
        gto3bet[key3] = {"raise": raise3, "call": call3}
        threebet_matchups.append(key3)

        # ---- VS3BET：key = OpenervThreebettor（開池者面對 3bet）----
        keyv3 = "%sv%s" % (opener, threebettor)
        raise4 = top_pct_by_combos(0, 0.025)   # 4bet：只留最頂端價值＋極少詐唬
        call_v3 = top_pct_by_combos(0.025, 0.10)
        gtovs3bet[keyv3] = {"raise": raise4, "call": call_v3}
        vs3bet_matchups.append(keyv3)

        # ---- VS4BET：key = 3bettorvOpener（3bettor 面對開池者的 4bet）----
        raise5 = top_pct_by_combos(0, 0.012)   # 5bet 全下：只剩最頂端
        call_v4 = top_pct_by_combos(0.012, 0.02)
        gtovs4bet[key3] = {"raise": raise5, "call": call_v4}
        vs4bet_matchups.append(key3)

    return gto3bet, gtovs3bet, gtovs4bet, threebet_matchups, vs3bet_matchups, vs4bet_matchups


def js_list(hands):
    return "[" + ",".join('"%s"' % h for h in hands) + "]"


def main():
    gto3bet, gtovs3bet, gtovs4bet, m3, mv3, mv4 = build()

    lines = []
    lines.append("let GTO3BETMATCHUPS=%s" % json.dumps(m3))
    lines.append("let GTO3BETLABEL={")
    for k in m3:
        b, a = k.split("v", 1)
        lines.append('\t%s: "%s vs %s",' % (k, b, a))
    lines.append("}")
    lines.append("let GTO3BET={")
    for k, v in gto3bet.items():
        lines.append('\t"%s": { spot:"3BET", matchup:"%s", raise:%s, call:%s },' % (
            k, k, js_list(v["raise"]), js_list(v["call"])))
    lines.append("}")
    lines.append("")
    lines.append("let GTOVS3BETMATCHUPS=%s" % json.dumps(mv3))
    lines.append("let GTOVS3BETLABEL={")
    for k in mv3:
        a, b = k.split("v", 1)
        lines.append('\t%s: "%s vs %s 3bet",' % (k, a, b))
    lines.append("}")
    lines.append("let GTOVS3BET={")
    for k, v in gtovs3bet.items():
        lines.append('\t"%s": { spot:"VS3BET", matchup:"%s", raise:%s, call:%s },' % (
            k, k, js_list(v["raise"]), js_list(v["call"])))
    lines.append("}")
    lines.append("")
    lines.append("let GTOVS4BETMATCHUPS=%s" % json.dumps(mv4))
    lines.append("let GTOVS4BETLABEL={")
    for k in mv4:
        b, a = k.split("v", 1)
        lines.append('\t%s: "%s vs %s 4bet",' % (k, b, a))
    lines.append("}")
    lines.append("let GTOVS4BET={")
    for k, v in gtovs4bet.items():
        lines.append('\t"%s": { spot:"VS4BET", matchup:"%s", raise:%s, call:%s },' % (
            k, k, js_list(v["raise"]), js_list(v["call"])))
    lines.append("}")

    out = "\n".join(lines)
    open("gtopreflowtree_out.js", "w", encoding="utf-8").write(out)
    print("done: %d 3bet pairs, %d vs3bet pairs, %d vs4bet pairs -> gtopreflowtree_out.js" % (len(m3), len(mv3), len(mv4)))


if __name__ == "__main__":
    main()
