"""
生成「每檔有效計分牌各自的深碼 RFI 開池範圍」，整塊改寫 frontend/gtodata.js 的 GTORFI。

背景：原本 GTORFI 只有 50/100bb 兩份，而且 50bb 是 100bb 的原樣複製，
前端 25~300bb 共 20 檔全部貼到同一份表 → 換計分牌開池範圍完全不動。

做法（★教學參考外插，非 solver 精算★）：
  1. 錨點 = 本檔手寫的 100bb 標準參考開池表 BASE100（★這份是實際出貨 GTORFI 的唯一來源★）。
     gtoscenarios.py 另有一份自己的 RFIOPEN（給 flop 批次情境用），兩份是各自獨立維護、
     內容不保證一致（例：SB 的雜色踢腳曾經分歧過），要改開池錨點時記得兩邊都看。
  2. 範圍一律表示成「連續 run」：對子下限 + 各高張的同花/雜色最低踢腳，
     所有調整都只動 run 的底端 → 輸出永遠是乾淨的 77+/A9s+/KQo 記號。
  3. 變淺（<100bb）：逐步移除投機牌（低同花連張/隙張，窄位置再含小對子），
     同時把高張 run 往下延伸（用 gtoeqmatrix.json 的 all-in equity 排序——
     淺碼價值趨近攤牌權益）。
  4. 變深（>100bb）：把同花踢腳與小對子往下延伸（隱含賠率變好），
     很深（>170bb）再逐步砍最弱的雜色 Ax（反向隱含賠率差）。
  5. 每檔計分牌取同一條貪婪調整序列的前綴 → 範圍隨深度單調變化、不會來回跳。

100bb 輸出 == 錨點原文（一手不動）。重跑冪等：整塊 GTORFI 重寫。
執行順序：gtodeep50.py 之後跑本檔（gtodeep50 的 50bb RFI 複製看到 key 已存在會自動跳過）。
"""
import json
import os
import re

from gtobackup import backup_existing

RANKS = "AKQJT98765432"          # 顯示順序（強到弱）
BASEDIR = os.path.dirname(os.path.abspath(__file__))
EQCACHE = os.path.join(BASEDIR, "gtoeqmatrix.json")
VAL = {r: 14 - i for i, r in enumerate(RANKS)}   # A=14 .. 2=2
CHR = {v: r for r, v in VAL.items()}

# 前端 GTOSTACKS.RFI / DEEPTREE 的檔位。
# 淺碼 10–40bb 每 1bb 一檔（短碼時每 1bb 都會影響決策），40bb 以上維持較粗的間距。
STACKS = ([300, 250, 200, 175, 150, 125, 100, 90, 80, 75, 70, 65, 60, 55, 50, 45]
          + list(range(40, 9, -1)))

# ---- 錨點：手寫 100bb 標準參考開池表（與 gtodata.js 原 100BB 條目一致，勿隨意改） ----
BASE100 = {
    "9MAX": {
        "UTG":  "77+,ATs+,KTs+,QTs+,JTs,AJo+,KQo",
        "UTG1": "66+,A9s+,KTs+,QTs+,JTs,T9s,AJo+,KQo",
        "MP":   "55+,A8s+,K9s+,QTs+,JTs,T9s,98s,ATo+,KJo+,QJo",
        "LJ":   "44+,A7s+,K9s+,Q9s+,J9s+,T9s,98s,87s,ATo+,KJo+,QJo",
        "HJ":   "33+,A5s+,K8s+,Q9s+,J9s+,T8s+,98s,87s,76s,A9o+,KTo+,QTo+,JTo",
        "CO":   "22+,A2s+,K8s+,Q9s+,J9s+,T8s+,97s+,87s,76s,65s,A8o+,KTo+,QTo+,JTo",
        "BTN":  "22+,A2s+,K5s+,Q7s+,J8s+,T8s+,97s+,86s+,75s+,65s,54s,A5o+,K9o+,Q9o+,J9o+,T9o",
        "SB":   "22+,A2s+,K7s+,Q8s+,J8s+,T8s+,97s+,86s+,76s,65s,54s,A7o+,K9o+,Q9o+,JTo",
    },
    "6MAX": {
        "UTG":  "44+,A7s+,K9s+,Q9s+,J9s+,T9s,98s,87s,ATo+,KJo+,QJo",
        "MP":   "33+,A5s+,K9s+,Q9s+,J9s+,T8s+,98s,87s,76s,A9o+,KTo+,QTo+,JTo",
        "CO":   "22+,A2s+,K8s+,Q9s+,J9s+,T8s+,97s+,87s,76s,65s,A8o+,KTo+,QTo+,JTo",
        "BTN":  "22+,A2s+,K5s+,Q7s+,J8s+,T8s+,97s+,86s+,75s+,65s,54s,A5o+,K9o+,Q9o+,J9o+,T9o",
        "SB":   "22+,A2s+,K7s+,Q8s+,J8s+,T8s+,97s+,86s+,76s,65s,54s,A7o+,K9o+,Q9o+,JTo",
    },
}

# ---- all-in equity（169 平均，淺碼加牌排序用）----
def canon_hands():
    seen, out = set(), []
    for i, hi in enumerate(RANKS):
        for j, lo in enumerate(RANKS):
            lab = hi + hi if i == j else (hi + lo + "s" if i < j else RANKS[j] + RANKS[i] + "o")
            if lab not in seen:
                seen.add(lab); out.append(lab)
    return out

HANDS = canon_hands()
AVGEQ = {}


def avgeq():
    """gtoeqmatrix.json（gtoopen.py 產生的快取）lazy load：不要在 import 時讀，
    不然從別的目錄 import 這個模組會直接失敗；缺檔時給友善訊息（比照 gtoworker.load_flops）。"""
    if not AVGEQ:
        if not os.path.exists(EQCACHE):
            raise SystemExit("找不到 %s，請先執行 python gtoopen.py 產生全下勝率矩陣快取" % EQCACHE)
        eq = json.load(open(EQCACHE, encoding="utf-8"))
        for i in range(169):
            AVGEQ[HANDS[i]] = sum(eq[i]) / len(eq[i])
    return AVGEQ

def label(hi, lo, suited):
    return CHR[hi] + CHR[lo] + ("s" if suited else "o")

# ---- range 的 run 表示：{"pair": 最低對子 or None, "s": {高張: 最低踢腳}, "o": 同} ----
def parse_range(txt):
    rng = {"pair": None, "s": {}, "o": {}}
    for tok in txt.split(","):
        plus = tok.endswith("+")
        body = tok[:-1] if plus else tok
        if len(body) == 2 and body[0] == body[1]:
            rng["pair"] = VAL[body[0]]
        else:
            hi, lo, su = VAL[body[0]], VAL[body[1]], body[2]
            rng[su][hi] = lo
    return rng

def emit_range(rng):
    out = []
    if rng["pair"] is not None:
        p = CHR[rng["pair"]]
        out.append(p + p + ("+" if rng["pair"] < 14 else ""))
    for su in ("s", "o"):
        for hi in sorted(rng[su], reverse=True):
            lo = rng[su][hi]
            out.append(label(hi, lo, su == "s") + ("+" if lo < hi - 1 else ""))
    return out

def clone(rng):
    return {"pair": rng["pair"], "s": dict(rng["s"]), "o": dict(rng["o"])}

def width_frac(rng):
    n = 0
    if rng["pair"] is not None:
        n += (14 - rng["pair"] + 1) * 6
    for su, per in (("s", 4), ("o", 12)):
        for hi, lo in rng[su].items():
            n += (hi - 1 - lo + 1) * per
    return n / 1326.0

# ---- 調整動作（都只動 run 底端，保持記號乾淨） ----
def apply_move(rng, mv):
    kind = mv[0]
    if kind == "pair_trim":
        rng["pair"] += 1
        if rng["pair"] > 14:
            rng["pair"] = None
    elif kind == "pair_ext":
        rng["pair"] -= 1
    elif kind in ("s_trim", "o_trim"):
        su, hi = kind[0], mv[1]
        rng[su][hi] += 1
        if rng[su][hi] > hi - 1:
            del rng[su][hi]
    elif kind in ("s_ext", "o_ext"):
        su, hi = kind[0], mv[1]
        rng[su][hi] -= 1
    elif kind in ("s_new", "o_new"):
        su, hi = kind[0], mv[1]
        rng[su][hi] = hi - 1

# ---- 候選池 ----
def shallow_rm_pool(rng, narrow):
    """變淺要砍的投機牌：低同花連張/隙張（高張<=9），窄位置再含 22-66 小對子。分數大先砍。"""
    cands = []
    for hi, lo in rng["s"].items():
        if hi <= 9:
            gap = hi - lo - 1
            cands.append((4.0 + (9 - hi) * 0.3 + gap * 0.9, ("s_trim", hi)))
    if narrow and rng["pair"] is not None and rng["pair"] <= 6:
        cands.append((3.0 + (6 - rng["pair"]) * 0.35, ("pair_trim",)))
    return cands

def shallow_ad_pool(rng):
    """變淺要加的高張牌：同花/雜色 run（高張>=T）往下延伸＋相鄰的新雜色連張，用 all-in equity 排序。"""
    cands = []
    for su in ("s", "o"):
        for hi, lo in rng[su].items():
            if hi >= 10 and lo - 1 >= 2:
                cands.append((avgeq()[label(hi, lo - 1, su == "s")], (su + "_ext", hi)))
        for hi in (10, 9):
            if hi not in rng[su] and rng[su].get(hi + 1) == hi:
                if su == "o":   # 淺碼只加雜色新 run（T9o/98o）；同花低連張歸深碼池
                    cands.append((avgeq()[label(hi, hi - 1, False)], ("o_new", hi)))
    return cands

def deep_ad_pool(rng):
    """變深要加的牌：同花踢腳往下延伸＋相鄰的新同花連張＋小對子補滿，equity 加連張加成排序。"""
    cands = []
    for hi, lo in rng["s"].items():
        if lo - 1 >= 2:
            gap = hi - (lo - 1) - 1
            bonus = 0.04 if gap == 0 else (0.02 if gap == 1 else 0.0)
            cands.append((avgeq()[label(hi, lo - 1, True)] + bonus, ("s_ext", hi)))
    for hi in range(4, 10):
        if hi not in rng["s"] and rng["s"].get(hi + 1) == hi:
            cands.append((avgeq()[label(hi, hi - 1, True)] + 0.04, ("s_new", hi)))
    if rng["pair"] is not None and rng["pair"] > 2:
        p = CHR[rng["pair"] - 1]
        cands.append((avgeq()[p + p] + 0.03, ("pair_ext",)))
    return cands

def deep_rm_pool(rng):
    """很深要砍的牌：最弱的雜色 Ax 先走（反向隱含賠率），次弱的雜色低踢腳；雜色連張不砍。"""
    cands = []
    for hi, lo in rng["o"].items():
        if lo >= 10:
            continue          # ATo/KTo 以上不砍
        score = (2.0 if hi == 14 else 0.0) + (10 - lo) * 0.15 - (0.5 if hi - lo == 1 else 0.0)
        if score > 0:
            cands.append((score, ("o_trim", hi)))
    return cands

def build_seq(rng0, poolfn, nmax):
    """從 rng0 出發貪婪取 nmax 步調整序列；各計分牌檔取前綴 → 隨深度單調巢狀。"""
    rng, seq = clone(rng0), []
    for _ in range(nmax):
        cands = poolfn(rng)
        if not cands:
            break
        cands.sort(key=lambda c: (-c[0], str(c[1])))
        mv = cands[0][1]
        apply_move(rng, mv)
        seq.append(mv)
    return seq

def rnd(x):
    return int(x + 0.5)

def ranges_for_position(base_txt):
    """回 {stack: token list}。強度係數依基礎範圍寬度縮放（寬位置變動多、窄位置變動少）。"""
    base = parse_range(base_txt)
    width = width_frac(base)
    narrow = width < 0.25
    sh_rm = build_seq(base, lambda r: shallow_rm_pool(r, narrow), 30)
    sh_ad = build_seq(base, shallow_ad_pool, 30)
    dp_ad = build_seq(base, deep_ad_pool, 30)
    dp_rm = build_seq(base, deep_rm_pool, 30)
    out = {}
    for S in STACKS:
        rng = clone(base)
        if S < 100:
            t = (100 - S) / 75.0
            for mv in sh_rm[:rnd(t * (2 + width * 14))]:
                apply_move(rng, mv)
            for mv in sh_ad[:rnd(t * (2 + width * 12))]:
                apply_move(rng, mv)
        elif S > 100:
            u = (S - 100) / 200.0
            for mv in dp_ad[:rnd(u * (3 + width * 9))]:
                apply_move(rng, mv)
            for mv in dp_rm[:rnd(max(0.0, u - 0.35) / 0.65 * (width * 6))]:
                apply_move(rng, mv)
        out[S] = emit_range(rng)
    return out

def js_list(tokens):
    return "[" + ",".join('"%s"' % t for t in tokens) + "]"

def build_gtorfi_js():
    lines = ["let GTORFI={"]
    for tbl in ("9MAX", "6MAX"):
        bypos = {pos: ranges_for_position(txt) for pos, txt in BASE100[tbl].items()}
        for S in STACKS:
            for pos in BASE100[tbl]:
                toks = bypos[pos][S]
                lines.append('\t"HE_%s_RFI_%dBB_%s": { spot:"RFI", stackbb:%d, position:"%s",' % (tbl, S, pos, S, pos))
                lines.append('\t\traise:%s },' % js_list(toks))
    lines.append("}")
    return "\n".join(lines)

def main():
    block = build_gtorfi_js()
    path = os.path.join(BASEDIR, "frontend", "gtodata.js")
    with open(path, encoding="utf-8", newline="") as f:
        src = f.read()
    m = re.search(r'let GTORFI=\{.*?\n\}', src, re.S)
    assert m, path + ": 找不到 GTORFI"
    src = src[:m.start()] + block + src[m.end():]
    bak = backup_existing(path)
    if bak:
        print("backup -> %s" % bak)
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(src)
    n = len(STACKS) * (len(BASE100["9MAX"]) + len(BASE100["6MAX"]))
    print("%s updated: GTORFI %d 條（%d 檔計分牌 x 9MAX 8 位置 + 6MAX 5 位置）" % (path, n, len(STACKS)))

if __name__ == "__main__":
    main()
