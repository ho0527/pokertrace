"""
短牌短碼 push/fold（全下/棄牌）Nash 求解 + call-vs-jam，附加進 frontend/shortdeckdata.js。

模型與標準版 gtoopen.py / gtocall.py 相同（阻尼 fictitious play 的全下賽局 Nash），
只是換成短牌：81 種起手牌、630 combo、短牌 81x81 全下勝率矩陣（shortdeckeqmatrix.json）。
牌力勝率已用短牌規則（同花>葫蘆、A6789 順子）算好在矩陣裡，所以這裡純算術。

輸出（前端依 gametype=="SD" 讀）：
    SDRANGELIST：SD_9MAX/6MAX/2MAX_PUSHFOLD_{stack}BB_{pos} = { jam, frequencymap, ev }
    SDCALLVSJAM：{stack}_{EARLY/MID/LATE} = { call }

★生成順序（一定要照這個順序）★
    1. python shortdeckequity.py    # 產生 shortdeckeqmatrix.json
    2. python shortdeckpreflow.py   # 「整檔覆寫」shortdeckdata.js（RFI / 3bet / vs3bet / vs4bet）
    3. python shortdeckpushfold.py  # 本檔：讀回 shortdeckdata.js，附加 push/fold 區塊
本檔是「讀回既有檔案再附加」，所以一定要先跑 shortdeckpreflow.py。找不到檔案、或檔案裡沒有
preflow 產生的區塊時會直接報錯，不會默默寫出半套資料。
"""
import json
import os

import shortdeckequity as se   # HANDS(81) + combos，跟矩陣同一套順序

BASEDIR=os.path.dirname(os.path.abspath(__file__))

HANDS = se.HANDS
RANKS = se.RANKS_DESC   # "AKQJT9876"
N = len(HANDS)
assert N == 81
IDX = {h: i for i, h in enumerate(HANDS)}


def combos(h):
    return 6 if len(h) == 2 else (4 if h.endswith("s") else 12)


COMBOS = [combos(h) for h in HANDS]
TOTAL = float(sum(COMBOS))   # 630
EQMATRIX_FILE=os.path.join(BASEDIR, "shortdeckeqmatrix.json")
if not os.path.exists(EQMATRIX_FILE):
    raise SystemExit("找不到 %s，請先執行 python shortdeckequity.py" % EQMATRIX_FILE)
E = json.load(open(EQMATRIX_FILE, encoding="utf-8"))
STACKS = list(range(1, 31))


def eq_vs(i, freq):
    num = den = 0.0
    for j in range(N):
        w = freq[j] * COMBOS[j]
        if w > 0:
            num += w * E[i][j]; den += w
    return num / den if den > 0 else 0.0


def freq_pct(freq):
    return sum(freq[j] * COMBOS[j] for j in range(N)) / TOTAL


def to_labels(freq, thr=0.5):
    return [HANDS[i] for i in range(N) if freq[i] >= thr]


def to_freq(freq):
    return {HANDS[i]: round(freq[i] * 100, 1) for i in range(N) if freq[i] > 0.005}


def hu_nash(S, iters=60, alpha=0.25):
    S = float(S)
    sb = [0.5] * N; bb = [0.5] * N
    thr_bb = (S - 1.0) / (2.0 * S)
    for _ in range(iters):
        pc = freq_pct(bb)
        sb_br = [1.0 if ((1.0 - pc) + pc * ((2 * eq_vs(i, bb) - 1) * S)) > -0.5 else 0.0 for i in range(N)]
        sb = [(1 - alpha) * sb[i] + alpha * sb_br[i] for i in range(N)]
        bb_br = [1.0 if eq_vs(j, sb) > thr_bb else 0.0 for j in range(N)]
        bb = [(1 - alpha) * bb[j] + alpha * bb_br[j] for j in range(N)]
    pc = freq_pct(bb); pf = 1.0 - pc
    sbev = {HANDS[i]: round((pf * 1.0 + pc * ((2 * eq_vs(i, bb) - 1) * S)) + 0.5, 2) for i in range(N)}
    return sb, bb, sbev


def multiway_open(S, k, iters=60, alpha=0.25):
    S = float(S)
    t_call = S / (2.0 * S + 1.5)
    hero = [0.4] * N
    for _ in range(iters):
        call_br = [1.0 if eq_vs(j, hero) > t_call else 0.0 for j in range(N)]
        pf = (1.0 - freq_pct(call_br)) ** k
        hero_br = [1.0 if (pf * 1.5 + (1.0 - pf) * (eq_vs(i, call_br) * (2 * S + 1.5) - S)) > 0.0 else 0.0 for i in range(N)]
        hero = [(1 - alpha) * hero[i] + alpha * hero_br[i] for i in range(N)]
    call_br = [1.0 if eq_vs(j, hero) > t_call else 0.0 for j in range(N)]
    pf = (1.0 - freq_pct(call_br)) ** k
    evmap = {HANDS[i]: round(pf * 1.5 + (1.0 - pf) * (eq_vs(i, call_br) * (2 * S + 1.5) - S), 2) for i in range(N)}
    return hero, evmap


def monotonic(freq):
    """牌力單調整理：對子遞增、同高張踢腳遞增，消 MC 雜訊。回 label 集合。"""
    s = set(to_labels(freq))
    pr = [r + r for r in RANKS]
    for a in range(len(pr) - 1, 0, -1):
        if pr[a] in s:
            s.add(pr[a - 1])
    for suit in ("s", "o"):
        for hi in range(len(RANKS)):
            present = [lo for lo in range(hi + 1, len(RANKS)) if RANKS[hi] + RANKS[lo] + suit in s]
            if present:
                weakest = max(present)
                for lo in range(hi + 1, weakest + 1):
                    s.add(RANKS[hi] + RANKS[lo] + suit)
    return [h for h in HANDS if h in s]


# 面對全下的三桶代表範圍（短牌，跟 gtocall 概念一樣，用短牌手牌）
JAMMER = {
    "EARLY": "88+,A9s+,ATo+,KTs+,KQo,QJs",
    "MID": "77+,A6s+,A9o+,K9s+,KTo+,Q9s+,QJo,J9s+,JTo,T9s",
    "LATE": "66+,A6s+,A6o+,K6s+,K8o+,Q7s+,Q9o+,J7s+,J9o+,T7s+,T9o,96s+,86s+,76s",
}
POS_BUCKET = {"UTG": "EARLY", "UTG1": "EARLY", "MP": "MID", "LJ": "MID", "HJ": "MID", "CO": "LATE", "BTN": "LATE"}


def expand_token(token):
    """展開單一 token（88+ / A9s+ / ATo+ / KQo / 98s），用短牌 9 點數。
    展不出東西時印警告：短牌沒有 2~5，寫成 "65s" 這種標準德州的手會整個消失，
    以前是靜默吞掉，桶子會少手還不會有人發現。"""
    plus = token.endswith("+")
    body = token[:-1] if plus else token
    out = []
    if len(body) == 2 and body[0] == body[1]:
        if body[0] in RANKS:
            vi = RANKS.index(body[0])
            if plus:
                out.extend(RANKS[i] + RANKS[i] for i in range(vi + 1))
            else:
                out.append(body)
    if len(body) == 3:
        hi, lo, suit = body[0], body[1], body[2]
        if hi in RANKS and lo in RANKS and suit in ("s", "o"):
            loi = RANKS.index(lo); hii = RANKS.index(hi)
            if plus:
                out.extend(hi + RANKS[i] + suit for i in range(loi, hii, -1))
            else:
                out.append(body)
    if not out:
        print("警告：token %r 在短牌（點數 %s）展不出任何手牌，已忽略" % (token, RANKS))
    return out


def range_str_to_freq(rangestr):
    """把 "88+,A9s+" 這種 token 字串展開成 freq 陣列（在範圍內=1）。用短牌點數。"""
    f = [0.0] * N
    for tok in rangestr.split(","):
        for h in expand_token(tok.strip()):
            if h in IDX:
                f[IDX[h]] = 1.0
    return f


def threshold(S):
    S = float(S)
    return S / (2.0 * S + 1.5)


# 本檔在 shortdeckdata.js 裡的區塊界線（重跑時靠這兩行精準切掉舊區塊，不用 regex 猜）
BEGINMARK="// ===== 短牌 push/fold（shortdeckpushfold.py 生成）====="
ENDMARK="// ===== 短牌 push/fold 區塊結束（shortdeckpushfold.py 生成）====="

OPENPOS = {
    "9MAX": ["UTG", "UTG1", "MP", "LJ", "HJ", "CO", "BTN"],
    "6MAX": ["UTG", "MP", "CO", "BTN"],
}
BEHIND = {
    "9MAX": {"UTG": 8, "UTG1": 7, "MP": 6, "LJ": 5, "HJ": 4, "CO": 3, "BTN": 2},
    "6MAX": {"UTG": 5, "MP": 4, "CO": 3, "BTN": 2},
}


def entry_js(key, S, pos, jam_labels, freqmap, evmap, action="jam"):
    pure = [h for h in jam_labels]
    mix = {h: round(freqmap[h]) for h in HANDS if h in freqmap and 5 <= freqmap[h] <= 95}
    # monotonic() 為了消 MC 雜訊補進 jam_labels、但求解頻率其實 <5%（甚至 0）的手，
    # 也要寫進 frequencymap；否則前端 gtohandfrequency() 查不到就當作純 100% 全下，
    # 跟求解器算出來的 0% 完全相反（EV 也對不起來）。
    for h in jam_labels:
        if h not in mix and freqmap.get(h, 0.0) < 5:
            mix[h]=round(freqmap.get(h, 0.0))
    parts = ['%s:[%s]' % (action, ",".join('"%s"' % h for h in pure))]
    if mix:
        fm = ",".join('"%s":{%s:%d,fold:%d}' % (h, action, mix[h], 100 - mix[h]) for h in HANDS if h in mix)
        parts.append('frequencymap:{%s}' % fm)
    if evmap:
        evs = [h for h in HANDS if h in evmap and evmap[h] >= -1.5]
        if evs:
            parts.append('ev:{%s}' % ",".join('"%s":%s' % (h, evmap[h]) for h in evs))
    return '\t"%s": { spot:"PUSHFOLD", stackbb:%d, position:"%s",\n\t\t%s },' % (key, S, pos, ", ".join(parts))


def main():
    range_lines = ["let SDRANGELIST={"]
    hu_cache = {}
    for S in STACKS:
        for tbl in ("9MAX", "6MAX"):
            range_lines.append("\t// ===== SD %s %dbb =====" % (tbl, S))
            for pos in OPENPOS[tbl]:
                hero, evmap = multiway_open(S, BEHIND[tbl][pos])
                labels = monotonic(hero)
                range_lines.append(entry_js("SD_%s_PUSHFOLD_%dBB_%s" % (tbl, S, pos), S, pos, labels, to_freq(hero), evmap))
            # SB = HU Nash shove
            if S not in hu_cache:
                hu_cache[S] = hu_nash(S)
            sb, sbev=hu_cache[S][0], hu_cache[S][2]
            range_lines.append(entry_js("SD_%s_PUSHFOLD_%dBB_SB" % (tbl, S), S, "SB", monotonic(sb), to_freq(sb), sbev))
        # 2MAX（單挑）：SB jam + BB call（用 HU Nash）
        sb, bb, sbev = hu_cache[S]
        range_lines.append("\t// ===== SD 2MAX %dbb（單挑）=====" % S)
        range_lines.append(entry_js("SD_2MAX_PUSHFOLD_%dBB_SB" % S, S, "SB", monotonic(sb), to_freq(sb), sbev))
        range_lines.append(entry_js("SD_2MAX_PUSHFOLD_%dBB_BB" % S, S, "BB", monotonic(bb), to_freq(bb), {}, action="call"))
    range_block = "\n".join(range_lines) + "\n}"

    # call-vs-jam：eq 跟計分牌無關，每手每桶只算一次，各計分牌套不同門檻
    call_lines = ["let SDCALLVSJAM={"]
    eqcache = {}
    for bk, jr in JAMMER.items():
        jamfreq = range_str_to_freq(jr)
        eqcache[bk] = [eq_vs(i, jamfreq) for i in range(N)]
    for S in STACKS:
        thr = threshold(S)
        for bk in JAMMER:
            calls = [HANDS[i] for i in range(N) if eqcache[bk][i] >= thr]
            call_lines.append('\t"%d_%s": { call:[%s] },' % (S, bk, ",".join('"%s"' % h for h in calls)))
    call_lines.append("}")
    call_block = "\n".join(call_lines)

    snippet = "\n" + BEGINMARK + "\n" + range_block + "\n" + call_block + "\n"
    snippet += "let SDJAMBUCKET={ \"9MAX\":%s, \"6MAX\":%s }\n" % (
        json.dumps(POS_BUCKET), json.dumps({k: POS_BUCKET[k] for k in OPENPOS["6MAX"]}))
    snippet += ENDMARK + "\n"

    targets=[os.path.join(BASEDIR, "shortdeckdata.js")]
    if os.path.isdir(os.path.join(BASEDIR, "frontend")):
        targets.append(os.path.join(BASEDIR, "frontend", "shortdeckdata.js"))
    for path in targets:
        # 本檔只做「附加」，preflow 的產物一定要先在：缺檔或缺 preflow 區塊就報錯，不寫半套資料
        if not os.path.exists(path):
            raise SystemExit("找不到 %s，請先執行 python shortdeckpreflow.py（生成順序：preflow -> pushfold）" % path)
        with open(path, encoding="utf-8", newline="") as f:
            src=f.read()
        if "let SDRFI" not in src:
            raise SystemExit("%s 裡沒有 shortdeckpreflow.py 產生的 SDRFI 區塊，請先執行 python shortdeckpreflow.py" % path)
        # 用明確 marker 切掉舊的 push/fold 區塊（重跑用）
        start=src.find(BEGINMARK)
        if start >= 0:
            end=src.find(ENDMARK, start)
            if end >= 0:
                src=src[:start] + src[end + len(ENDMARK):]
            else:
                # 舊格式沒有結束 marker；push/fold 區塊一律附加在檔尾，所以砍到檔尾即可
                src=src[:start]
        # 切不乾淨就會變成 let SDRANGELIST 重複宣告 → 整個 shortdeckdata.js SyntaxError，寧可報錯
        for name in ("let SDRANGELIST", "let SDCALLVSJAM", "let SDJAMBUCKET"):
            if name in src:
                raise SystemExit("%s 裡還有殘留的 %s，舊區塊切不乾淨；請重跑 python shortdeckpreflow.py 產生乾淨的檔案後再執行本檔" % (path, name))
        src=src.rstrip("\n") + "\n" + snippet
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(src)
        print(path, "updated")
    print("done: SD push/fold %d stacks" % len(STACKS))


if __name__ == "__main__":
    main()
