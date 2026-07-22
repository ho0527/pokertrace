"""產生 6-max 開蓋範圍的 GTORANGELIST 條目（貼進 frontend/gtodata.js）。
9-max 已是乾淨的 v3 資料，不重算；6-max 各 k=5..2 在 EV 曲線陡段、收斂穩定。"""
import json

DATA = json.load(open("gtoopenout.json"))
RANKS = "AKQJT98765432"
ORDER = {}
k = 0
for i, hi in enumerate(RANKS):
    for j, lo in enumerate(RANKS):
        lab = hi+hi if i == j else (hi+lo+"s" if i < j else RANKS[j]+RANKS[i]+"o")
        if lab not in ORDER:
            ORDER[lab] = k; k += 1

STACKS = [10, 15, 20]
SIX = ["UTG", "MP", "CO", "BTN", "SB"]  # 由緊到寬

# 位置單調聯集（UTG ⊆ MP ⊆ CO ⊆ BTN ⊆ SB），消雜訊
JAM = {}
for S in STACKS:
    acc = set()
    for P in SIX:
        acc |= set(DATA["6MAX"]["open"]["%d_%s" % (S, P)]["jam"])
        JAM[(S, P)] = sorted(acc, key=lambda h: ORDER[h])

lines = []
for S in STACKS:
    lines.append("\t// ===== 6MAX %dbb（eval7 自算：SB=HU Nash，其餘=多人桌 chip-EV） =====" % S)
    for P in SIX:
        jam = JAM[(S, P)]
        jamjs = ",".join('"%s"' % h for h in jam)
        key = "HE_6MAX_PUSHFOLD_%dBB_%s" % (S, P)
        lines.append('\t"%s": { spot:"PUSHFOLD", stackbb:%d, position:"%s",' % (key, S, P))
        lines.append('\t\tjam:[%s] },' % jamjs)
open("gto6maxblock.txt", "w", encoding="utf-8").write("\n".join(lines))
print("wrote %d lines to gto6maxblock.txt" % len(lines))
