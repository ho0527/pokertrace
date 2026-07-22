"""
重烤整個 GTORANGELIST（9/6/2-max push/fold），帶混合頻率 frequencymap。
- 每手全下/跟注頻率取自 solver（gtoopenout.json 的 freq / bb_freq）。
- 單調性整理：同一 spot 內的牌力單調（strength_clamp）＋ jam% 隨位置變晚不減（cross-position max），
  把 9-max 深碼早位雜訊壓掉。
  ★沒有做 cross-stack（隨計分牌變深 jam% 不增）的單調性★——每個計分牌檔各自獨立處理。
  舊版註解宣稱有 cross-stack min，但實作從來沒有；先把文件改成與實作一致（補實作會改動既有出貨資料，
  要另外決定並重跑）。
- 輸出 jam:[頻率>=50 的手] + frequencymap:{手:{jam:X,fold:Y}}（只放 5~95 的混合手）。
- 2-max BB 防守為 call 動作（call:[...] + frequencymap call/fold）。
"""
import json, re

from gtobackup import backup_existing

d = json.load(open("gtoopenout.json"))
RANKS = "AKQJT98765432"
ORDER = {}
k = 0
for i, hi in enumerate(RANKS):
    for j, lo in enumerate(RANKS):
        lab = hi+hi if i == j else (hi+lo+"s" if i < j else RANKS[j]+RANKS[i]+"o")
        if lab not in ORDER:
            ORDER[lab] = k; k += 1
HANDS = sorted(ORDER, key=lambda h: ORDER[h])
STACKS = list(range(1, 31))
OPENPOS = {
    "9MAX": ["UTG", "UTG1", "MP", "LJ", "HJ", "CO", "BTN", "SB"],
    "6MAX": ["UTG", "MP", "CO", "BTN", "SB"],
    "2MAX": ["SB"],
}
SRC = {"9MAX": "9MAX", "6MAX": "6MAX", "2MAX": "9MAX"}  # 2-max 沿用 9-max 的 SB(HU Nash)/BB(HU call)

def strength_clamp(fr):
    """同一 spot 內的牌力單調：高對≥低對、同高張高踢腳≥低踢腳、同花≥不同花。消雜訊。"""
    pairs = [r+r for r in RANKS]  # AA..22（強到弱）
    for i in range(1, len(pairs)):
        fr[pairs[i]] = min(fr[pairs[i]], fr[pairs[i-1]])
    for suit in ("s", "o"):
        for hi in range(13):
            prev = 100.0
            for lo in range(hi+1, 13):
                lab = RANKS[hi]+RANKS[lo]+suit
                fr[lab] = min(fr[lab], prev); prev = fr[lab]
    for hi in range(13):
        for lo in range(hi+1, 13):
            s = RANKS[hi]+RANKS[lo]+"s"; o = RANKS[hi]+RANKS[lo]+"o"
            fr[o] = min(fr[o], fr[s])
    return fr

def monotone_open(table):
    """grid[(S,P)][hand] = jam%；牌力單調(per spot) + cross-position max(位置越晚不減)。"""
    pos = OPENPOS[table]
    src = SRC[table]
    grid = {}
    for S in STACKS:
        for P in pos:
            fr = d[src]["open"]["%d_%s" % (S, P)].get("freq", {})
            grid[(S, P)] = {h: float(fr.get(h, 0.0)) for h in HANDS}
    for _ in range(2):
        for key in grid:
            strength_clamp(grid[key])
        for S in STACKS:                       # cross-position：位置越晚 jam% 不減
            for h in HANDS:
                run = 0.0
                for P in pos:
                    run = max(run, grid[(S, P)][h]); grid[(S, P)][h] = run
    return grid

def entry(key, S, P, action, pctmap, evmap=None):
    pure = [h for h in HANDS if pctmap.get(h, 0) >= 50]
    mix = {h: round(pctmap[h]) for h in HANDS if 5 <= pctmap.get(h, 0) <= 95}
    parts = ['%s:[%s]' % (action, ",".join('"%s"' % h for h in pure))]
    if mix:
        fm = ",".join('"%s":{%s:%d,fold:%d}' % (h, action, mix[h], 100-mix[h]) for h in HANDS if h in mix)
        parts.append('frequencymap:{%s}' % fm)
    if evmap:   # 只列 ev>=-1.5 的（能玩/邊際手），深棄不列以免資料過大
        evs = [h for h in HANDS if h in evmap and evmap[h] >= -1.5]
        if evs:
            parts.append('ev:{%s}' % ",".join('"%s":%s' % (h, evmap[h]) for h in evs))
    return '\t"%s": { spot:"PUSHFOLD", stackbb:%d, position:"%s",\n\t\t%s },' % (key, S, P, ", ".join(parts))

lines = ["let GTORANGELIST={"]
for table in ("9MAX", "6MAX", "2MAX"):
    grid = monotone_open(table)
    for S in STACKS:
        lines.append("\t// ===== %s %dbb（eval7 自算；含混合頻率） =====" % (table, S))
        for P in OPENPOS[table]:
            evmap = d[SRC[table]]["open"]["%d_%s" % (S, P)].get("ev", {})
            lines.append(entry("HE_%s_PUSHFOLD_%dBB_%s" % (table, S, P), S, P, "jam", grid[(S, P)], evmap))
        if table == "2MAX":
            # BB 防守（call）：HU Nash bb_freq，只套 spot 內的牌力單調（strength_clamp），無 cross-stack
            bbfr = d["9MAX"]["hu"][str(S)].get("bb_freq", {})
            bbpct = strength_clamp({h: float(bbfr.get(h, 0.0)) for h in HANDS})
            lines.append(entry("HE_2MAX_PUSHFOLD_%dBB_BB" % S, S, "BB", "call", bbpct))
block = "\n".join(lines) + "\n}"

path = "frontend/gtodata.js"
src = open(path, encoding="utf-8").read()
# 用 lambda 當替換函式：block 裡的 \ 或 \g 不會被 re 當跳脫序列解析
new = re.sub(r"let GTORANGELIST=\{.*?\n\}", lambda m: block, src, count=1, flags=re.S)
assert new != src, "GTORANGELIST not replaced"
bak = backup_existing(path)
if bak:
    print("backup -> %s" % bak)
open(path, "w", encoding="utf-8").write(new)
print("rebaked GTORANGELIST with frequencymap (9/6/2-max)")
