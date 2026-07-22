"""離線測 backend/api/gto.py 的 solveflop（stub 掉 Django 相依，不需 DB/Redis）。

兩組案例：標準德州（52 張）＋短牌（36 張，shortdeck flag）。
"""
import sys, types, json, time, os

BASEDIR=os.path.dirname(os.path.abspath(__file__))

# stub Django-only 相依
rf = types.ModuleType("rest_framework"); rf.status = types.SimpleNamespace(HTTP_200_OK=200)
sys.modules["rest_framework"] = rf
dec = types.ModuleType("rest_framework.decorators"); dec.api_view = lambda m: (lambda f: f)
sys.modules["rest_framework.decorators"] = dec
resp = types.ModuleType("rest_framework.response"); resp.Response = lambda data, st=None: {"data": data, "status": st}
sys.modules["rest_framework.response"] = resp
fn = types.ModuleType("function"); ffn = types.ModuleType("function.function")
ffn.errorresponse = lambda key: {"error": key}
sys.modules["function"] = fn; sys.modules["function.function"] = ffn

sys.path.insert(0, os.path.join(BASEDIR, "backend", "api"))
import gto

class Req:
    # META 是 gto.solveratelimited() 讀來源 IP 用的（X-Real-IP / REMOTE_ADDR），stub 給空的就好
    def __init__(self, d):
        self.body=json.dumps(d).encode()
        self.META={}

req = Req({
    "board": ["As", "Kh", "7c"],
    "ooprange": "22+,A2s+,K9s+,QTs+,JTs,T9s,98s,AJo+,KQo",
    "iprange": "22+,A2s+,K9s+,Q9s+,J9s+,T8s+,A9o+,KTo+,QJo",
    "pot": 10, "stack": 30, "betsizes": [0.33, 1.0], "raise": True, "iters": 600,
})
t = time.time()
out = gto.solveflop(req)
dt = time.time()-t
d = out["data"]["data"]
print("solved in %.1fs  status=%s success=%s" % (dt, out["status"], out["data"]["success"]))
print("oopcombos=%d ipcombos=%d  EV(oop)=%.2f EV(ip)=%.2f  betsizes=%s" % (
    d["oopcombos"], d["ipcombos"], d["evoop"], d["evip"], d["betsizes"]))
print("nodes (%d):" % len(d["nodes"]))
for n, nd in d["nodes"].items():
    print("  %-16s [%s] actions=%s" % (n, nd["player"], nd["actions"]))
root = d["nodes"]["oop_root"]
print("oop_root actions:", root["actions"])
for lab in ["77", "A7s", "AQo", "K9s", "QJs", "T9s", "32s"]:
    if lab in root["cells"]:
        print("  %-5s %s" % (lab, root["cells"][lab]))
ipvb = d["nodes"]["ip_vs_bet100"]
print("ip_vs_bet100 actions:", ipvb["actions"])
for lab in ["AA", "AKo", "QQ", "KQo", "76s", "32s"]:
    if lab in ipvb["cells"]:
        print("  %-5s %s" % (lab, ipvb["cells"][lab]))
print("\noop_root per-action EV [check,bet] (mixed hands -> equal EV = indifference):")
for lab in ["77", "A7s", "AQo", "K9s", "T9s"]:
    if lab in root["ev"]:
        freq = root["cells"][lab]; ev = root["ev"][lab]
        best = max(ev)
        loss = [round(best-e, 3) for e in ev]
        print("  %-5s freq=%s  EV=%s  loss=%s" % (lab, freq, ev, loss))

# ===== 短牌（shortdeck flag）：36 張牌組、同花>葫蘆、A6789 順子 =====
print("\n===== shortdeck =====")
sdreq=Req({
    "shortdeck": True,
    "board": ["As", "Kh", "7c"],
    "ooprange": "88+,A9s+,ATo+,KTs+,KQo,QJs",
    "iprange": "77+,A6s+,A9o+,K9s+,KTo+,Q9s+,QJo,J9s+,JTo,T9s",
    "pot": 10, "stack": 30, "betsizes": [0.33, 1.0], "raise": True, "iters": 300,
})
t = time.time()
sdout=gto.solveflop(sdreq)
dt = time.time()-t
sdd=sdout["data"]["data"]
print("solved in %.1fs  status=%s success=%s" % (dt, sdout["status"], sdout["data"]["success"]))
print("oopcombos=%d ipcombos=%d  EV(oop)=%.2f EV(ip)=%.2f  betsizes=%s" % (
    sdd["oopcombos"], sdd["ipcombos"], sdd["evoop"], sdd["evip"], sdd["betsizes"]))
sdroot=sdd["nodes"]["oop_root"]
print("oop_root actions:", sdroot["actions"])
for lab in ["88", "A9s", "AQo", "KTs", "QJs"]:
    if lab in sdroot["cells"]:
        print("  %-5s %s" % (lab, sdroot["cells"][lab]))
# 短牌不該出現 2~5 的手牌（只有 9 個點數）。輸出維持純 ASCII，避免 cp1252 主控台編碼錯誤
bad=[lab for lab in sdroot["cells"] if lab[0] in "2345" or lab[1] in "2345"]
print("shortdeck cells=%d  hands with rank 2-5: %s" % (len(sdroot["cells"]), bad if bad else "none (ok)"))
