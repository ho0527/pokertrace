"""
生成 50bb 深碼資料（3bet / 面對3bet / 面對4bet）+ 50bb RFI 開池，附加進 frontend/gtodata.js。

策略：不動現有 100bb 的 GTO3BET / GTOVS3BET / GTOVS4BET（避免改 key 出錯），
改成新增平行的 _50 物件。前端依計分牌挑物件（見 gto.js 的 gtodeep*spot）。
50bb 相對 100bb：4bet / 5bet-jam 範圍更寬（計分牌淺、更早被迫全下），3bet 範圍略緊。

RFI 開池 50bb 直接沿用 100bb 的範圍（開池範圍在 50~100bb 幾乎不變），只是換 50BB 的 key。
"""
import json
import os
import re

from gtobackup import backup_existing

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
                seen.add(lab); out.append(lab)
    return out


HANDS = canon_hands()


def combos(h):
    return 6 if len(h) == 2 else (4 if h.endswith("s") else 12)


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


def top_pct(pctstart, pctend):
    acc = 0.0; out = []
    for h in strength_order():
        lo = acc; acc += combos(h)
        if pctstart <= lo / 1326.0 < pctend:
            out.append(h)
    return out


ORDER = ["UTG", "UTG1", "MP", "LJ", "HJ", "CO", "BTN", "SB", "BB"]


def gap_width(opener, threebettor):
    gap = ORDER.index(threebettor) - ORDER.index(opener)
    return min(0.07 + gap * 0.012, 0.14)


def gen_pairs():
    return [(ORDER[i], ORDER[j]) for i in range(len(ORDER)) for j in range(i + 1, len(ORDER))]


def build_50():
    g3, gv3, gv4 = {}, {}, {}
    for opener, threebettor in gen_pairs():
        width = gap_width(opener, threebettor)
        key3 = "%sv%s" % (threebettor, opener)
        keyv3 = "%sv%s" % (opener, threebettor)
        # 3bet 略緊於 100bb（淺碼少玩投機 flat）
        g3[key3] = {"raise": top_pct(0, width * 0.55), "call": top_pct(width * 0.55, width * 1.5)}
        # 4bet 更寬（50bb 更快 commit）
        gv3[keyv3] = {"raise": top_pct(0, 0.04), "call": top_pct(0.04, 0.11)}
        # 5bet jam 更寬
        gv4[key3] = {"raise": top_pct(0, 0.025), "call": top_pct(0.025, 0.04)}
    return g3, gv3, gv4


def js_list(hands):
    return "[" + ",".join('"%s"' % h for h in hands) + "]"


def emit_obj(name, spot, data):
    lines = ["let %s={" % name]
    for k, v in data.items():
        lines.append('\t"%s": { spot:"%s", matchup:"%s", raise:%s, call:%s },' % (
            k, spot, k, js_list(v["raise"]), js_list(v["call"])))
    lines.append("}")
    return "\n".join(lines)


def gen_rfi50(gtodata_src):
    """把 GTORFI 裡所有 100BB 條目複製成 50BB（範圍沿用）。回傳要插進 GTORFI 的字串。"""
    # 每條 RFI 條目跨兩行：key + { spot..., \n raise:[...] },
    pat = re.compile(r'"HE_\w+_RFI_100BB_\w+":\s*\{ spot:"RFI", stackbb:100, position:"[^"]*",\s*\n\s*raise:\[[^\]]*\] \},')
    out = []
    for m in pat.finditer(gtodata_src):
        block = m.group(0)
        block50 = block.replace("_100BB_", "_50BB_").replace("stackbb:100", "stackbb:50")
        out.append("\t" + block50)
    return "\n".join(out)


def main():
    g3, gv3, gv4 = build_50()
    snippet = "\n// ===== 50bb 深碼資料（gtodeep50.py 生成，非 solver 精算）=====\n"
    snippet += emit_obj("GTO3BET_50", "3BET", g3) + "\n"
    snippet += emit_obj("GTOVS3BET_50", "VS3BET", gv3) + "\n"
    snippet += emit_obj("GTOVS4BET_50", "VS4BET", gv4) + "\n"

    # 只寫 frontend/gtodata.js 這一份（根目錄那份 gtodata.js 不存在，寫了也只是多一份沒人載入的殭屍檔）
    path = os.path.join(BASEDIR, "frontend", "gtodata.js")
    if os.path.exists(path):
        with open(path, encoding="utf-8", newline="") as f:
            src = f.read()
        if "GTO3BET_50" in src:
            print(path, "已有 _50，先移除舊的再插")
            src = re.sub(r'\n// ===== 50bb 深碼資料.*?\nlet GTOVS4BET_50=\{.*?\n\}\n', "\n", src, flags=re.S)
        # 1) 深碼 _50 物件插在 GTOVS4BET 定義之後
        m = re.search(r'(let GTOVS4BET=\{.*?\n\})', src, re.S)
        assert m, path + ": 找不到 GTOVS4BET"
        src = src[:m.end()] + "\n" + snippet + src[m.end():]
        # 2) 50bb RFI：複製 100BB 條目
        rfi50 = gen_rfi50(src)
        if rfi50 and "RFI_50BB" not in src:
            mr = re.search(r'(let GTORFI=\{\r?\n)', src)
            assert mr, path + ": 找不到 GTORFI"
            src = src[:mr.end()] + rfi50 + "\n" + src[mr.end():]
        bak = backup_existing(path)
        if bak:
            print("backup ->", bak)
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(src)
        print(path, "updated: +GTO3BET_50/VS3BET_50/VS4BET_50, +50bb RFI")
    else:
        raise SystemExit("找不到 %s" % path)


if __name__ == "__main__":
    main()
