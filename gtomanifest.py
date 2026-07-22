"""
掃 gtoresults/*.json，產生一份給前端用的清單 gtoresults/manifest.json
（只列 id/board/pot/stack/betsizes 這些輕量欄位，不含完整策略樹，前端先讀清單再依需要抓單筆）。
"""
import json
import os

from gtoscenarios import SCENARIOS

RESULTS_DIR = "gtoresults"
SCENARIO_NAMES = [sc["name"] for sc in SCENARIOS]


def scenario_of(fname):
    for name in SCENARIO_NAMES:
        if fname.startswith(name + "_"):
            return name
    return "unknown"


def main():
    items = []
    for fn in sorted(os.listdir(RESULTS_DIR)):
        if not fn.endswith(".json") or fn == "manifest.json":
            continue
        path = os.path.join(RESULTS_DIR, fn)
        d = json.load(open(path, encoding="utf-8"))
        jid = fn[:-5]
        items.append({
            "id": jid,
            "scenario": scenario_of(jid),
            "board": d.get("board"),
            "pot": d.get("pot"),
            "stack": d.get("stack"),
            "betsizes": d.get("betsizes"),
        })
    out = os.path.join(RESULTS_DIR, "manifest.json")
    json.dump(items, open(out, "w", encoding="utf-8"), ensure_ascii=False)
    print("manifest: %d 筆 -> %s" % (len(items), out))


if __name__ == "__main__":
    main()
