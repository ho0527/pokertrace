"""產生 2-max（單挑）push/fold 的 GTORANGELIST 條目並插進 gtodata.js。
SB 開蓋 = HU Nash shove；BB 防守 = HU Nash call（都已在 gtoopenout.json 算好）。"""
import json

d = json.load(open("gtoopenout.json"))
RANKS = "AKQJT98765432"
ORDER = {}
k = 0
for i, hi in enumerate(RANKS):
    for j, lo in enumerate(RANKS):
        lab = hi+hi if i == j else (hi+lo+"s" if i < j else RANKS[j]+RANKS[i]+"o")
        if lab not in ORDER:
            ORDER[lab] = k; k += 1
srt = lambda L: sorted(L, key=lambda h: ORDER[h])

lines = []
for S in (10, 15, 20, 25, 30):
    sbjam = srt(d["9MAX"]["open"]["%d_SB" % S]["jam"])
    bbcall = srt(d["9MAX"]["hu"][str(S)]["bb_call"])
    lines.append("\t// ===== 2MAX %dbb（單挑：SB=HU Nash shove，BB=HU Nash call） =====" % S)
    lines.append('\t"HE_2MAX_PUSHFOLD_%dBB_SB": { spot:"PUSHFOLD", stackbb:%d, position:"SB",' % (S, S))
    lines.append('\t\tjam:[%s] },' % ",".join('"%s"' % h for h in sbjam))
    lines.append('\t"HE_2MAX_PUSHFOLD_%dBB_BB": { spot:"PUSHFOLD", stackbb:%d, position:"BB",' % (S, S))
    lines.append('\t\tcall:[%s] },' % ",".join('"%s"' % h for h in bbcall))
block = "\n".join(lines)

path = "frontend/gtodata.js"
src = open(path, encoding="utf-8").read()
if "HE_2MAX_PUSHFOLD" in src:
    print("ALREADY HAS 2MAX — abort"); raise SystemExit(1)
idx = src.index("動作樹（Phase 1")
close = src.rindex("\n}\n", 0, idx)
before, after = src[:close], src[close:]
b = before.rstrip()
if b.endswith("}"):
    b = b + ","          # 上一條目沒逗號 → 補上
assert b.endswith(",")
open(path, "w", encoding="utf-8").write(b + "\n" + block + after)
print("inserted 2MAX block (SB jam + BB call) for 10/15/20bb")
