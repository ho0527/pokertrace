"""
產生前端翻後結果庫的清單檔（manifest.json）。

德州（`gtomanifest.py`）與短牌（`shortdeckworker.py`）共用這一支 ——
以前兩邊各寫一份一模一樣的迴圈，那種寫法遲早會漂移。

## 為什麼改格式（TASK-086）

舊格式是一列一筆的陣列，每筆帶 `id / scenario / board / pot / stack / betsizes`：

    {"id":"BBvsBTN_3betpot_2c2d2h","scenario":"BBvsBTN_3betpot",
     "board":["2c","2d","2h"],"pot":20.0,"stack":50.0,"betsizes":[0.5,1.0]}

實測 `gtoresults/manifest.json` **7.3 MB / 56,160 筆**、
`shortdeckresults/manifest.json` **2.0 MB / 16,044 筆**，
而 `frontend/gto.js` 對這份清單帶 `cache:"no-store"`，
所以進入翻後分頁、切換遊戲類型都是完整重新下載。

逐筆檢查全部 56,160 + 16,044 列（不是抽樣）後確認三件事：

1. `id` 恆等於 `scenario + "_" + 三張翻牌`，所以 **`scenario` 與 `board` 都是冗餘的**
2. `pot` / `stack` / `betsizes` 在同一個對位內**完全固定**（32 個與 28 個對位都是）
3. 更關鍵的是，**前端根本沒有用到那三個欄位** ——
   `fslibtryload()` 只取 `match.id`，畫面上的 pot / stack / betsizes
   是從各翻牌自己的結果 JSON（`fsstate.data`）讀的

而且全部對位共用**同一份** 1755（德州）／573（短牌）個翻牌的清單。
所以整份清單能收成「一份共用翻牌清單 + 對位名稱」：**7.3 MB → 約 17 KB（451 倍）**。

`cache:"no-store"` 刻意**保留**：17 KB 每次重抓的成本可以忽略，
而保留它就完全沒有「為了快取而讓資料更新失效」的風險。

## 新格式

    {
        "version": 2,
        "flop": ["2c2d2h", "2c2d2s", ...],       // 所有對位的聯集，字串是三張牌直接相接
        "scenario": {
            "BBvsBTN_3betpot": None,             // None = 擁有 flop 清單的全部
            "SBvsBTN_SRP": [0, 3, 17]            // 索引清單 = 只有這幾個（批次還沒跑完時）
        }
    }

正常跑完的批次每個對位都是 `None`。索引清單那條路徑是為了**批次只跑了一半**時
清單仍然正確 —— 前端才不會把還沒算出來的翻牌顯示成可查詢。

## 順帶的好處

舊版產生器會**開啟全部 56,160 個結果檔**，只為了讀 board/pot/stack/betsizes 四個值。
新格式從檔名就能得到全部資訊，一個檔案都不用開。
"""
import json
import os
import sys

# Windows 的預設主控台編碼是 cp1252，印中文會直接 UnicodeEncodeError 把整支弄掉 ——
# 而且是**寫完檔案之後**才炸，看起來像失敗其實已經寫好了，最容易誤判。
# 專案裡 tools/audit 與 backend/tool 的每一支都有這一行。
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


MANIFESTVERSION=2


def buildmanifestdata(resultsdir,scenarionamelist):
    """掃 resultsdir 的檔名，回傳新格式的 manifest 資料（dict）。

    不開啟任何結果檔 —— 檔名 `<對位>_<三張翻牌>.json` 已經含有需要的全部資訊。
    認不出對位的檔案會被跳過（不會歸到 "unknown" 讓前端看到一個假對位）。
    """
    flopof={}
    for filename in sorted(os.listdir(resultsdir)):
        if not filename.endswith(".json") or filename=="manifest.json":
            continue
        jid=filename[:-5]
        matched=None
        for name in scenarionamelist:
            if jid.startswith(name+"_"):
                # 取最長的匹配：對位名稱可能互為前綴（例如 BTNvsBB_SRP 與 BTNvsBB_SRP_deep）
                if matched is None or len(name)>len(matched):
                    matched=name
        if matched is None:
            continue
        flop=jid[len(matched)+1:]
        if matched not in flopof:
            flopof[matched]=[]
        flopof[matched].append(flop)

    # 聯集當共用清單；排序讓輸出可重現（同樣的輸入一定得到同樣的檔案）
    union=set()
    for name in flopof:
        for flop in flopof[name]:
            union.add(flop)
    floplist=sorted(union)
    indexof={}
    for i in range(len(floplist)):
        indexof[floplist[i]]=i

    scenario={}
    for name in sorted(flopof.keys()):
        own=set(flopof[name])
        if len(own)==len(floplist):
            # 擁有全部，不必列索引
            scenario[name]=None
        else:
            scenario[name]=sorted(indexof[flop] for flop in own)

    return {
        "version": MANIFESTVERSION,
        "flop": floplist,
        "scenario": scenario
    }


def writemanifest(resultsdir,scenarionamelist):
    """算出清單並寫進 <resultsdir>/manifest.json（先寫 .tmp 再 os.replace，避免寫壞）。"""
    data=buildmanifestdata(resultsdir,scenarionamelist)
    target=os.path.join(resultsdir,"manifest.json")
    tmp=target+".tmp"
    # separators 去掉多餘空白 —— 這份檔案是要下載的，不是給人讀的
    json.dump(data,open(tmp,"w",encoding="utf-8"),ensure_ascii=False,separators=(",",":"))
    os.replace(tmp,target)

    partial=[name for name in data["scenario"] if data["scenario"][name] is not None]
    size=os.path.getsize(target)
    print("manifest: %d 個對位、%d 個翻牌 -> %s（%d 位元組）"%(
        len(data["scenario"]),len(data["flop"]),target,size))
    if partial:
        print("  注意：這 %d 個對位的翻牌不齊全（批次還沒跑完？）：%s"%(len(partial),", ".join(partial)))
    return data
