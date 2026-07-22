"""
面對單一全下的跟注範圍（call-vs-jam）— eval7 精確自算，無迭代、穩定。

對每手起手牌算 all-in equity vs「全下者的已知範圍」，>= 底池賠率門檻就跟注。
給定全下者範圍下這是精確解（蒙地卡羅誤差極小）。全下者範圍依位置分三桶（緊/中/寬）。
計分牌越深 → 底池賠率越差 → 門檻越高 → 跟注越緊；對手越寬(LATE) → 同手 equity 越高 → 跟越寬。
"""
import eval7, json
from eval7.xorshift_rand import seed as eval7seed
RANKS="AKQJT98765432"
MC=15000
MCSEED=20260709   # 固定種子 → MC 抽樣可重現（同 gtomultiwaycall.py 的 Random(20260709) 做法）
eval7seed(MCSEED)

def hands():
    seen=set(); u=[]
    for i,hi in enumerate(RANKS):
        for j,lo in enumerate(RANKS):
            lab = hi+hi if i==j else (hi+lo+"s" if i<j else RANKS[j]+RANKS[i]+"o")
            if lab not in seen: seen.add(lab); u.append(lab)
    return u
HANDS=hands()
def combos(l): return 6 if len(l)==2 else (4 if l.endswith("s") else 12)
def rep(l):
    if len(l)==2: return (eval7.Card(l[0]+"s"),eval7.Card(l[0]+"h"))
    return (eval7.Card(l[0]+"s"),eval7.Card(l[1]+("s" if l[2]=="s" else "h")))
def pct(ls): return round(sum(combos(x) for x in ls)/1326.0*100,1)
def eq(l,rng): return eval7.py_hand_vs_range_monte_carlo(rep(l),rng,[],MC)

# 全下者三桶代表範圍（固定、可重現）
JAMMER={
 "EARLY":"66+,A9s+,ATo+,KTs+,KQo,QJs",                                   # ~12% 緊（早位）
 "MID":"44+,A2s+,A8o+,K9s+,KTo+,Q9s+,QJo,J9s+,JTo,T9s",                   # ~25% 中位
 "LATE":"22+,A2s+,A2o+,K2s+,K7o+,Q6s+,Q9o+,J7s+,J9o+,T7s+,T9o,96s+,86s+,75s+,65s,54s", # ~48% 寬（晚位）
}

def threshold(S):
    S=float(S)
    # 跟注方（絕大多數情境就是 BB）已貼的 1bb 是沉沒成本，實際只要再投 S-1；
    # 底池 = 全下方 S + 自己 S + SB 的 0.5。eq*(2S+0.5) - S > -1 → eq > (S-1)/(2S+0.5)。
    # 舊寫法 S/(2S+1.5) 沒扣掉已投的盲注 → 跟注範圍系統性偏緊（S=10：0.465 vs 0.439）。
    return (S-1.0)/(2.0*S+0.5)

STACKS=list(range(1,31))
# eq(手牌, 對手範圍) 跟計分牌無關 → 每手每桶只算一次 MC，各計分牌只套不同門檻（30 檔幾乎免費）
eqcache={}
for bk,jr in JAMMER.items():
    rng=eval7.HandRange(jr)
    eqcache[bk]={l:eq(l,rng) for l in HANDS}
    print("cached eq for bucket %s"%bk,flush=True)
out={}
for S in STACKS:
    thr=threshold(S)
    for bk in JAMMER:
        calls=[l for l in HANDS if eqcache[bk][l]>=thr]
        out["%d_%s"%(S,bk)]={"call":calls,"pct":pct(calls)}
print(json.dumps(out))
