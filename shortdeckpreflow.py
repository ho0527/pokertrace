"""
短牌版 preflop range 生成器：開池(RFI) / 3bet / 面對3bet(4bet) / 面對4bet(5bet)，全位置兩兩配對。

跟標準版 gtopreflowtree.py 的差別：
    1. 用 shortdeckeqmatrix.json（短牌 81 格全下勝率矩陣）當牌力排序基準，不是標準 169 格。
    2. 短牌沒有可靠的手刻開池範圍，所以連 RFI 開池也用「強度排序取 top-X%」生成，
       全部自我一致，不摻入不確定的手感。
    3. 短牌只有 9 個點數（6789TJQKA），81 種起手牌、共 630 個 combo。

★這是「參考範圍」，不是逐對 solver 精算★，跟標準版同樣的定位，老實標註。

輸出：shortdeckdata.js（SD 前綴的變數，跟標準版 GTO* 不衝突，之後前端依遊戲類型切換）。

★生成順序（一定要照這個順序，不然資料會不完整）★
    1. python shortdeckequity.py    # 產生 shortdeckeqmatrix.json（本檔的強度基準）
    2. python shortdeckpreflow.py   # 「整檔覆寫」shortdeckdata.js（RFI / 3bet / vs3bet / vs4bet）
    3. python shortdeckpushfold.py  # 讀回 shortdeckdata.js，附加 push/fold 區塊
本檔是整檔覆寫，單獨重跑會清掉 shortdeckpushfold.py 產生的 SDRANGELIST / SDCALLVSJAM /
SDJAMBUCKET，所以重跑本檔之後一定要接著跑 shortdeckpushfold.py。覆寫前會先把既有檔案
另存成 {檔名}.bak 以便救回。

★已知近似★
    build_trees() 的 vs3bet / vs4bet 目前是「位置無關的近似值」：每個位置對位算出來的
    range 內容完全相同（只有 3bet 的 gap_width 會隨位置變），key 命名雖然帶位置但並不代表
    有位置差異。維持 36 個 key 是為了前端契約（gto.js 用 opener+"v"+threebettor 查表）。
"""
import json
import os

BASEDIR=os.path.dirname(os.path.abspath(__file__))
RANKS = "AKQJT9876"          # 短牌 9 個點數，命名用高張在前
TOTAL_COMBOS = 630.0          # 9*6 + 36*4 + 36*12


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
assert len(HANDS) == 81
HANDIDX = {h: i for i, h in enumerate(HANDS)}


def combos(h):
    return 6 if len(h) == 2 else (4 if h.endswith("s") else 12)


# ---- 短牌 81 格勝率矩陣當強度基準（延後載入，缺檔時給友善訊息而不是裸 FileNotFoundError）----
EQMATRIX_FILE=os.path.join(BASEDIR, "shortdeckeqmatrix.json")
STRENGTH_ORDER=None


def load_strength_order():
    """第一次用到時才載入勝率矩陣，並排出強度順序。缺檔給明確的下一步指示。"""
    global STRENGTH_ORDER
    if STRENGTH_ORDER is None:
        if not os.path.exists(EQMATRIX_FILE):
            raise SystemExit("找不到 %s，請先執行 python shortdeckequity.py" % EQMATRIX_FILE)
        eq=json.load(open(EQMATRIX_FILE, encoding="utf-8"))
        avgeq={HANDS[i]: sum(eq[i]) / len(eq[i]) for i in range(81)}
        STRENGTH_ORDER=sorted(HANDS, key=lambda h: -avgeq[h])
    return STRENGTH_ORDER


def top_pct_by_combos(pctstart, pctend):
    acc = 0.0
    out = []
    for h in load_strength_order():
        lo = acc
        acc += combos(h)
        if pctstart <= lo / TOTAL_COMBOS < pctend:
            out.append(h)
    return out


# ---- 位置順序 ----
ORDER = ["UTG", "UTG1", "MP", "LJ", "HJ", "CO", "BTN", "SB", "BB"]

# 短牌開池普遍比標準寬（牌組小、行動導向），依位置由緊到寬
RFI_WIDTH = {
    "UTG": 0.16, "UTG1": 0.18, "MP": 0.21, "LJ": 0.25,
    "HJ": 0.30, "CO": 0.38, "BTN": 0.50, "SB": 0.45,
}


def gap_width(opener, threebettor):
    gi, gj = ORDER.index(opener), ORDER.index(threebettor)
    gap = gj - gi
    base = 0.08  # 短牌 3bet 起跳略寬於標準
    return min(base + gap * 0.013, 0.16)


def gen_pairs():
    pairs = []
    for i in range(len(ORDER)):
        for j in range(i + 1, len(ORDER)):
            pairs.append((ORDER[i], ORDER[j]))
    return pairs


def build_rfi():
    rfi = {}
    for pos, width in RFI_WIDTH.items():
        rfi[pos] = top_pct_by_combos(0, width)
    return rfi


def build_trees():
    """3bet 隨位置 gap 變寬；vs3bet / vs4bet 目前是位置無關的近似值（每個 key 內容相同），
    key 帶位置只是為了對上前端查表格式，並不代表有位置差異。"""
    gto3bet, gtovs3bet, gtovs4bet = {}, {}, {}
    m3, mv3, mv4 = [], [], []
    for opener, threebettor in gen_pairs():
        width = gap_width(opener, threebettor)
        key3 = "%sv%s" % (threebettor, opener)
        gto3bet[key3] = {
            "raise": top_pct_by_combos(0, width * 0.6),
            "call": top_pct_by_combos(width * 0.6, width * 1.8),
        }
        m3.append(key3)

        keyv3 = "%sv%s" % (opener, threebettor)
        # 位置無關的近似值：每個 key 的 raise/call 內容都一樣
        gtovs3bet[keyv3] = {
            "raise": top_pct_by_combos(0, 0.03),
            "call": top_pct_by_combos(0.03, 0.12),
        }
        mv3.append(keyv3)

        # 同上：位置無關的近似值
        gtovs4bet[key3] = {
            "raise": top_pct_by_combos(0, 0.015),
            "call": top_pct_by_combos(0.015, 0.025),
        }
        mv4.append(key3)
    return gto3bet, gtovs3bet, gtovs4bet, m3, mv3, mv4


def js_list(hands):
    return "[" + ",".join('"%s"' % h for h in hands) + "]"


def main():
    rfi = build_rfi()
    gto3bet, gtovs3bet, gtovs4bet, m3, mv3, mv4 = build_trees()

    lines = []
    lines.append("// 短牌 preflop 參考範圍（shortdeckpreflow.py 生成，非 solver 精算）")
    lines.append("// 生成順序：shortdeckequity.py -> shortdeckpreflow.py（整檔覆寫本檔）-> shortdeckpushfold.py（附加 push/fold 區塊）")
    lines.append("// 只重跑 shortdeckpreflow.py 會清掉下方的 push/fold 區塊，記得接著跑 shortdeckpushfold.py")
    lines.append("// vs3bet / vs4bet 目前是位置無關的近似值：每個位置對位的內容相同，key 帶位置只是對齊前端查表格式")
    lines.append("let SDRFI={")
    for pos in ORDER:
        if pos in rfi:
            lines.append('\t"%s": { "spot":"RFI", "position":"%s", "raise":%s },' % (pos, pos, js_list(rfi[pos])))
    lines.append("}")
    lines.append("")
    lines.append("let SD3BETMATCHUPS=%s" % json.dumps(m3))
    lines.append("let SD3BETLABEL={")
    for k in m3:
        b, a = k.split("v", 1)
        lines.append('\t"%s": "%s vs %s",' % (k, b, a))
    lines.append("}")
    lines.append("let SD3BET={")
    for k, v in gto3bet.items():
        lines.append('\t"%s": { "spot":"3BET", "matchup":"%s", "raise":%s, "call":%s },' % (
            k, k, js_list(v["raise"]), js_list(v["call"])))
    lines.append("}")
    lines.append("")
    lines.append("let SDVS3BETMATCHUPS=%s" % json.dumps(mv3))
    lines.append("let SDVS3BETLABEL={")
    for k in mv3:
        a, b = k.split("v", 1)
        lines.append('\t"%s": "%s vs %s 3bet",' % (k, a, b))
    lines.append("}")
    lines.append("let SDVS3BET={")
    for k, v in gtovs3bet.items():
        lines.append('\t"%s": { "spot":"VS3BET", "matchup":"%s", "raise":%s, "call":%s },' % (
            k, k, js_list(v["raise"]), js_list(v["call"])))
    lines.append("}")
    lines.append("")
    lines.append("let SDVS4BETMATCHUPS=%s" % json.dumps(mv4))
    lines.append("let SDVS4BETLABEL={")
    for k in mv4:
        b, a = k.split("v", 1)
        lines.append('\t"%s": "%s vs %s 4bet",' % (k, b, a))
    lines.append("}")
    lines.append("let SDVS4BET={")
    for k, v in gtovs4bet.items():
        lines.append('\t"%s": { "spot":"VS4BET", "matchup":"%s", "raise":%s, "call":%s },' % (
            k, k, js_list(v["raise"]), js_list(v["call"])))
    lines.append("}")

    content = "\n".join(lines) + "\n"
    targets=[os.path.join(BASEDIR, "shortdeckdata.js")]                          # 根目錄留一份
    if os.path.isdir(os.path.join(BASEDIR, "frontend")):
        targets.append(os.path.join(BASEDIR, "frontend", "shortdeckdata.js"))    # 前端實際載入的一份
    for path in targets:
        # 本檔是整檔覆寫：先備份既有檔案，萬一忘了接著跑 shortdeckpushfold.py 還救得回來
        if os.path.exists(path):
            with open(path, encoding="utf-8", newline="") as f:
                old=f.read()
            with open(path + ".bak", "w", encoding="utf-8", newline="") as f:
                f.write(old)
            print("  已備份既有檔案 -> %s.bak" % path)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
    print("done -> shortdeckdata.js (root + frontend)")
    print("  ★整檔覆寫，push/fold 區塊已被清掉：請接著執行 python shortdeckpushfold.py")
    print("  RFI positions:", list(rfi.keys()))
    print("  UTG open:", rfi["UTG"])
    print("  BTN open combos:", sum(combos(h) for h in rfi["BTN"]), "/ 630")
    print("  3bet/vs3bet/vs4bet pairs:", len(m3), len(mv3), len(mv4))


if __name__ == "__main__":
    main()
