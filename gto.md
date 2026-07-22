# GTO 模組架構思考及分析

> # ⚠️ 本檔分成兩段，用途完全不同——先看這裡
>
> | 段落 | 狀態 | 怎麼用 |
> | --- | --- | --- |
> | **第 1–366 行**（本段起～「這樣可以快速產生可用成果…」為止） | 🗄️ **建置前的提案，已完成，保留供歷史參考** | **不要照做**。這是 GTO 模組還沒動工時寫的分析，裡面「目前沒有現成 gto 目錄／solver 引擎／GTO 資料檔，因此這會是新增模組」、以及「新增獨立 `gto.html` / `gto.js`」等敘述**已不符現況** |
> | **第 368 行起**（「GTO 資料生成腳本與執行方式（開發者）」） | ✅ **現行且正確的開發指南** | 這才是你要的。根目錄 `readme.md` 指來本檔當腳本權威，指的就是這一段 |
>
> **GTO 早已完整實作**，現況是：
>
> - 前端頁面入口是 **`frontend/tool/range.html`**（帶 `<base href="../">`），載入根目錄的 **`frontend/gto.js`**。**沒有 `gto.html`，也沒有 `flopsolver.*`**。
> - 資料檔 `frontend/gtodata.js`、`frontend/shortdeckdata.js` 由根目錄的離線腳本 `gto*.py` / `shortdeck*.py` 產生（見第 368 行起）。
> - 網站即時解算在後端 **`backend/api/gto.py`**（Django 端點，單檔自含）。
>
> 保留第 1–366 行只是為了追溯當初的設計取捨；要改 GTO 請直接看第 368 行起的段落與上述實際檔案。

## 目標定位

目前專案是 PokerTrace 類型的撲克場次管理系統，核心強項是場次、報名、牌桌、座位、手牌紀錄、計時器與統計。若要把「整個 GTO」搬進來，建議不要一開始定位成完整即時 solver，而是分成三層：

1. GTO 參考資料庫：提供 preflop range、push/fold、BB defense、3bet / 4bet、常見 c-bet 節點等可查詢策略。
2. GTO 工具頁：讓使用者依位置、計分牌深度、情境、牌型查詢策略矩陣。
3. 手牌紀錄串接：在 `newedithand`、`handdetail` 或報表中，依實際手牌情境提示可參考的 GTO 節點。

真正的即時 solver 需要大量算力、完整 action tree、抽象化策略與授權資料，不適合直接塞進目前 Django API 作為第一階段。

## 現有專案基礎

目前已有可以銜接 GTO 的幾個基礎：

- `frontend/preflop.html`、`frontend/preflop.js`：已有簡單 9-max RFI range 參考卡。
- `frontend/equity.html`、`frontend/equity.js`：已有勝率解算 UI。
- `backend/api/hand.py`：已有 `equity` 與 `solvehandwinner` 等計算端點，使用 `eval7`。
- `frontend/tool.css`：已有工具頁共用樣式，包含牌面、選牌、結果區等樣式基礎。
- `frontend/index.js`：首頁工具列表可接入新的 `gto.html`。
- `frontend/translate.js`：已有中英雙語架構，可加入 `gtopage` 與工具卡翻譯。
- `newedithand` / `handdetail`：已有手牌紀錄與檢視資料流，後續可從手牌情境連到 GTO 查詢。

目前沒有找到現成 `gto` 目錄、solver 引擎或 GTO 資料檔，因此這會是新增模組，不是打開既有功能。

## 建議總架構

```text
frontend/
    gto.html
    gto.js
    gtodata_preflop.js       第一階段可選：前端靜態資料
    tool.css                 沿用工具頁共用樣式
    translate.js             加入 gtopage / 工具入口文案

backend/
    api/
        gto.py               第二階段：資料量變大後改走 API
        url.py               掛 getgtospot / getgtorange 等路由

database 或 data file/
    gtorange                 第二階段：策略資料表或 JSON 檔
    gtosource                記錄資料來源、版本、授權與更新時間
```

第一階段建議先走前端靜態資料，快速驗證使用體驗。第二階段資料量變大、需要版本管理或後台維護時，再搬到後端 API 與資料表。

## 第一階段：GTO 工具頁

第一階段新增 `gto.html` / `gto.js`，作為公開小工具，不需要登入。

建議功能：

- 遊戲類型：先支援 Hold'em。
- 街道：先支援 preflop。
- 情境：
    - RFI
    - Facing open
    - 3bet
    - Facing 3bet
    - Push / Fold
    - BB defend
- 人數：先做 9-max，之後再加 6-max。
- 位置：UTG、MP、HJ、CO、BTN、SB、BB。
- 有效計分牌：10bb、15bb、20bb、25bb、30bb、40bb、60bb、100bb。
- 結果顯示：13x13 起手牌矩陣。
- 動作顏色：
    - Fold
    - Call
    - Raise
    - 3bet
    - Jam
    - Mix
- 額外資訊：
    - range 佔比
    - combo 數
    - 當前情境文字摘要
    - 資料版本與免責聲明

資料格式可以先設計成：

```javascript
let GTORANGELIST={
    "HE_9MAX_RFI_100BB_UTG": {
        gametype: "HE",
        tabletype: "9MAX",
        spot: "RFI",
        stackbb: 100,
        position: "UTG",
        version: "manual-v1",
        source: "internal-reference",
        actionmap: {
            "AA": "raise",
            "AKs": "raise",
            "A5s": "mix",
            "72o": "fold"
        },
        frequencymap: {
            "A5s": {
                raise: 50,
                fold: 50
            }
        }
    }
}
```

這種 key-value 結構好處是前端查詢簡單，也容易之後搬到後端資料表。

## 第二階段：後端 GTO API

當資料量變大後，不建議把全部策略都塞在 `gto.js`。可以新增 `backend/api/gto.py`。

建議 API：

```text
GET /getgtospotlist
GET /getgtorange?gametype=HE&tabletype=9MAX&spot=RFI&stackbb=100&position=UTG
GET /getgtohand?gametype=HE&tabletype=9MAX&spot=RFI&stackbb=100&position=UTG&hand=AKs
```

回傳格式維持專案慣例：

```json
{
    "success": true,
    "data": {
        "spot": "RFI",
        "position": "UTG",
        "stackbb": 100,
        "actionmap": {},
        "frequencymap": {},
        "version": "manual-v1",
        "source": "internal-reference"
    }
}
```

若走資料庫，建議表結構概念：

```text
gtospot
    id
    gametype
    tabletype
    spot
    stackbb
    position
    opponentposition
    potbb
    rakeprofile
    version
    source
    note
    createtime
    updatetime
    deletetime

gtorange
    id
    spotid
    handcode
    action
    frequency
    ev
    note
    createtime
    updatetime
    deletetime
```

如果只做 preflop，`handcode` 使用 `AA`、`AKs`、`AKo` 這種 169 格格式即可。若未來做 postflop，資料模型要擴充 board texture、line、pot size、bet size、node id，不建議和 preflop 混在同一個簡單表裡。

## 第三階段：串接手牌紀錄

等工具頁穩定後，可以在手牌紀錄流程加入「查看 GTO 參考」。

串接點：

- `newedithand.html` / `newedithand.js`
    - 記錄手牌時依 hero 位置、有效計分牌、盲注、動作線，提供 GTO 查詢入口。
- `handdetail.html` / `handdetail.js`
    - 檢視已完成手牌時，顯示「Preflop 參考」或「相近節點」。
- `table.html` / `table.js`
    - 在牌桌手牌列表中標示可分析手牌。
- `session.html` / `session.js`
    - 後續可做整場統計，例如 VPIP / PFR / 3bet 與參考 range 差異。

第一個可落地的串接方式：

```text
handdetail.html
    使用者點「GTO 參考」
        帶 query string 到 gto.html
            ?gametype=HE
            &spot=RFI
            &position=BTN
            &stackbb=40
            &hand=AQs
```

`gto.html` 收到參數後自動選好情境並高亮該手牌。這個方式簡單、低風險，也不會影響既有手牌儲存。

## 不建議第一階段做的事

以下項目不適合一開始就做：

- 直接導入完整商業 solver 策略庫。
- 在後端即時計算完整 GTO solution。
- 把 postflop 全節點策略硬塞進前端 JS。
- 在手牌提交時強制判斷是否符合 GTO。
- 把 GTO 結果寫入玩家盈虧或正式統計。

原因是資料授權、計算成本、情境建模與誤判風險都很高。

## 授權與資料來源風險

GTO 最大風險不是程式，而是資料來源。

如果資料來自以下來源，通常不能直接搬進公開專案：

- GTO Wizard
- PioSOLVER 商業解
- MonkerSolver 商業解
- DTO / Lucid / Run It Once 類課程資料
- 付費 range chart
- 未明確授權的網路截圖或表格

建議資料來源只使用：

- 自己人工整理的參考 range。
- 明確可商用 / 可再散布授權的資料。
- 使用專案自己產生的簡化策略資料。
- 只存「通用教學參考」，不宣稱等同 solver 精準結果。

UI 上應加免責聲明：

```text
本工具提供策略參考，不代表唯一最佳打法。實戰需依 rake、ante、計分牌深度、對手傾向、賽制與獎金結構調整。
```

## 前端 UI 建議

GTO 工具頁不應做成文章頁，應直接是一個可操作工具。

建議畫面結構：

- 上方：標題、返回、資料版本。
- 控制列：
    - 遊戲類型
    - 人數
    - 情境
    - 有效計分牌
    - Hero 位置
    - 對手位置
- 中間：13x13 range matrix。
- 右側或下方：
    - 動作圖例
    - range 百分比
    - combo 數
    - 被選手牌的混合頻率
- 手機版：
    - 控制列改單欄或兩欄
    - 矩陣維持 13 欄，但格子縮小
    - 點選格子後在下方顯示詳情

現有 `preflop.html` 已有 13x13 矩陣雛形，可以沿用概念，但建議新頁不要直接塞更多邏輯到 `preflop.js`，避免原本簡單參考卡變得太重。

## 後端效能考量

如果只是查 range，後端 API 成本很低，可以用一般 Django API 回 JSON。

如果未來要做 solver 類功能，需另外設計：

- 非同步 job queue。
- 結果快取。
- solver worker。
- 計算時間限制。
- 使用者權限與配額。
- 大型資料檔分層讀取。

這與目前 `backend/api/hand.py` 的 `equity` 解算不同。`equity` 是有限牌組枚舉或 Monte Carlo，GTO solver 則需要 game tree、策略迭代與大量記憶體，不能混為一談。

## 與現有 equity 的關係

`equity` 是勝率工具，回答「這手牌攤到最後大概贏多少」。

GTO 是策略工具，回答「在這個情境下應該 fold / call / raise / jam 的頻率」。

兩者可以互補，但不應合併成同一個 API：

- `equity` 保持牌力與勝率計算。
- `gto` 負責策略資料查詢。
- 前端可以在 GTO 詳情中提供「送到 equity solver」的快捷入口。

## 實作順序建議

### Phase 1：新增靜態 GTO 工具頁

- 新增 `frontend/gto.html`
- 新增 `frontend/gto.js`
- 新增 `gtopage` 翻譯
- `index.js` 工具列表加入 `gto.html`
- 先放少量可授權的內建 range
- 用 `node --check frontend\gto.js` 驗證

### Phase 2：資料格式穩定

- 把 range 資料拆到 `frontend/gtodata_preflop.js`
- 設計資料版本欄位
- 設計 source / note / disclaimer
- 支援 query string 開啟特定 spot

### Phase 3：後端 API

- 新增 `backend/api/gto.py`
- `backend/api/url.py` 掛路由
- 若需要資料庫，更新 `backend/dbinitialize.py`
- API 文件同步更新 `frontend/apidoc.js`
- README 補上 GTO 模組說明

### Phase 4：手牌串接

- `handdetail` 加「GTO 參考」入口
- `newedithand` 在 preflop 區提供快速跳轉
- 從實際手牌推導：
    - hero position
    - effective stack
    - preflop spot
    - hand code

### Phase 5：分析報表

- 玩家長期統計與參考 range 做比較。
- 場次或牌桌層級顯示常見偏差。
- 僅作練習與回顧，不建議當成正式評分。

## 需要先決定的問題

在真正開工前，要先決定：

1. GTO 資料來源是什麼？
2. 第一版只做 preflop，還是要包含簡化 postflop？
3. 資料是否可公開散布？
4. 是否需要登入才能使用？
5. 是否要和現有手牌紀錄串接，還是先獨立工具？
6. 支援 9-max、6-max，還是兩者都做？
7. 計分牌深度要支援哪些檔位？
8. 顯示策略要用單一動作，還是支援混合頻率？

## 建議結論

可以把 GTO 搬進來，但應該先做「GTO 策略查詢與參考工具」，不要第一步做完整 solver。

最穩的落地方式：

1. 新增獨立 `gto.html` / `gto.js`。
2. 使用可授權、可維護的小型 preflop range 資料。
3. 延續現有工具頁風格與 `translate.js`。
4. 第二階段再把資料搬到後端 API。
5. 第三階段才串接手牌紀錄與報表。

這樣可以快速產生可用成果，同時避免授權、效能與資料模型一次爆開。

---

# GTO 資料生成腳本與執行方式（開發者）

上面是設計思路；這一節說明 repo 根目錄那批 `gto*.py` / `shortdeck*.py` 實際腳本各自做什麼、怎麼跑、
吃什麼、吐什麼。這些腳本是「離線資料生成工具」，不是網站執行時的一部分：跑完會產生
`frontend/gtodata.js`、`frontend/shortdeckdata.js`、`gtoresults/`、`shortdeckresults/` 等前端會讀的資料檔。
網站即時解算另有 `backend/api/gto.py`（Django 端點，單檔自含，不依賴這些離線腳本）。

## 執行環境與共同規則

- 一律在 **repo 根目錄**執行（腳本用相對路徑讀寫，例如 `gtoflops_canonical.json`、`frontend/gtodata.js`）。
- 需要 Python 3.10+，套件：`eval7`、`numpy`（後端環境已裝）。

```powershell
cd C:\nginx\htdocs\website\externalcase\project00061
python gtoflops.py
```

- `_canonical.json`、`gtoeqmatrix.json`、`gtoopenout.json` 是**中間快取**，算過就會留著重複利用；砍掉會自動重算（慢）。
- **不要**用 PowerShell `Get-Content -Raw` / `Set-Content -Encoding utf8` 去改 `frontend/*.js`（會弄壞中文、加 BOM）；
  腳本自己用 `encoding="utf-8"` 寫檔沒問題，手動編輯請用一般編輯器。

## 模組 vs 可執行腳本

有些檔案是被 `import` 的**共用模組**，直接 `python xxx.py` 不會產生東西：

| 檔案 | 性質 | 說明 |
| --- | --- | --- |
| `gtosolvecore.py` | 模組 | flop CFR 純運算核心，被 worker / multiway import |
| `gtoscenarios.py` | 模組 | 標準情境清單（雙方 range/計分牌/下注尺寸），被 worker / manifest import |
| `shortdeckgto.py` | 模組 | 短牌牌型規則（同花>葫蘆、A6789 順子），被短牌各腳本 import |
| `shortdecksolvecore.py` | 模組 | 短牌 CFR 核心（數學部分重用 `gtosolvecore`） |
| `shortdeckscenarios.py` | 模組 | 短牌情境（range 來自 `shortdeckpreflow`） |

其餘 `gto*.py` / `shortdeck*.py` 都可直接執行。

## A. 標準德州（52 張）— preflop 範圍生成

輸出目標是 `frontend/gtodata.js`（前端 `gto.js` 讀 `GTORANGELIST` / `GTO3BET` 等）。**執行順序有相依**：

1. **`python gtoopen.py`** — 開蓋全下 Nash（阻尼 fictitious play）。
   - 產生 `gtoeqmatrix.json`（169×169 全下勝率矩陣，會快取，後面幾支都靠它）。
   - 產生 `gtoopenout.json`（8 位置×3 計分牌開蓋範圍 + SB/BB HU Nash）。
   - **必須先跑**，否則 bake / deep50 / preflowtree 沒有矩陣可讀。
2. **`python gtocall.py`** — 面對全下的跟注範圍（eval7 精算，把結果 `print` 成 JSON 到 stdout，供貼用）。
3. **`python gtobakeall.py`** — 重烤整個 9/6/2-max push/fold（帶混合頻率 `frequencymap`，做 2D 單調性消雜訊）。讀 `gtoopenout.json`。
4. **`python gtobake.py`** — 只產 6-max push/fold 區塊 → `gto6maxblock.txt`（人工貼進 `gtodata.js`）。
5. **`python gtobake2.py`** — 產 2-max（單挑）push/fold 並**直接寫進** `frontend/gtodata.js`（已存在會中止，避免重複插入）。
6. **`python gtodeep50.py`** — 50bb 深碼 3bet / 面對3bet / 面對4bet + 50bb RFI，附加進 `frontend/gtodata.js`。讀 `gtoeqmatrix.json`。
   （其中 50bb RFI 複製那步已被 gtodeeprfi.py 取代；GTORFI 已有 key 時會自動跳過，無害。）
7. **`python gtodeeprfi.py`** — 深碼 RFI 開池 25~300bb **每檔各自的範圍**，整塊重寫 `frontend/gtodata.js` 的 `GTORFI`。
   100bb 手寫錨點維護在本檔 `BASE100`；其餘計分牌檔以錨點平滑外插（變淺砍投機牌補高張雜色、變深補同花踢腳與小對子）。讀 `gtoeqmatrix.json`。改 RFI 範圍一律改這支再重跑，不要手改 `gtodata.js`。
8. **`python gtopreflowtree.py`** — 把翻前對戰樹補齊所有位置兩兩配對（3bet/vs3bet/vs4bet），輸出可貼進 `gtodata.js` 的區塊。讀 `gtoeqmatrix.json`。

> `gtobake*` 三支是歷史演進：`gtobakeall.py` 是最完整的重烤版，`gtobake.py` / `gtobake2.py` 是早期只做部分 max 的版本。
> 平時只需要跑 `gtoopen.py` → `gtobakeall.py` → `gtodeep50.py` → `gtodeeprfi.py` → `gtopreflowtree.py` 就能重建整份 push/fold + 深碼資料。

## B. 標準德州（52 張）— flop CFR 批次求解

輸出目標是 `gtoresults/<jobid>.json` + `gtoresults/manifest.json`（前端先讀 manifest 再依需要抓單筆）。

1. **`python gtoflops.py`** — 枚舉並去重同構 flop（花色只是標籤），產生 `gtoflops_canonical.json`（標準 1755 個不同構 flop）。
2. **`python gtoworker.py`** — 主批次 worker：
   - 第一次跑會用 `gtoscenarios.SCENARIOS × gtoflops_canonical.json` 自動產生工作清單 `gtojobs.json`。
   - 逐筆對每個 (情境, flop) 跑 CFR，寫 `gtoresults/<id>.json`，把該筆標 `done`。
   - **可暫停續跑**：處理中按 `Ctrl+C` 安全中斷，進度存在 `gtocheckpoint/`（每 100 疊代存一次），再跑一次 `python gtoworker.py` 會接續。
   - 有**鎖檔** `gtoworker.lock`：同時只能跑一個 worker（兩個 process 搶寫 `gtojobs.json` 會寫壞）。若上次異常結束沒清掉鎖檔，手動刪除後再跑。
   - 在 `gtoscenarios.py` 新增情境後再跑 worker，只會**增量補**新工作，不動已完成的舊工作。
   - 全部跑完（或中斷）時會自動呼叫 `gtomanifest.main()` 更新 manifest。
3. **`python gtomanifest.py`** — 掃 `gtoresults/*.json` 產生輕量清單 `gtoresults/manifest.json`（只含 id/board/pot/stack/betsizes）。一般由 worker 自動觸發，需要單獨重建 manifest 時才手動跑。
4. **`python gtomultiway.py`** — 3 人池的簡化 CFR 實驗（獨立於雙人管線；直接執行會跑一個 demo 情境並印結果，非嚴謹多人 Nash）。

> `gtojobs.json` 很大（十幾 MB）、`gtojobs.json.tmp` 是原子寫入的暫存檔（寫壞時可能殘留，正常可忽略/清掉）。

## C. 短牌（Short Deck / 6+，36 張）平行家族

跟標準版同一套機制，但牌組換成 36 張、牌型規則不同（同花>葫蘆、A6789 為最小順子），寫到獨立檔案不互相干擾。
輸出目標是 `frontend/shortdeckdata.js`（前端依 `gametype=="SD"` 讀）與 `shortdeckresults/`。

1. **`python shortdeckequity.py`** — 自寫蒙地卡羅算短牌 81×81 全下勝率矩陣 → `shortdeckeqmatrix.json`（**要先跑**，後面都靠它；不能用 eval7 內建，會按 52 張規則算錯）。
2. **`python shortdeckflops.py`** — 短牌不同構 flop → `shortdeckflops_canonical.json`。
3. **`python shortdeckpreflow.py`** — 短牌 preflop 範圍（RFI/3bet/vs3bet/vs4bet，全位置對位）→ `shortdeckdata.js`（`SD` 前綴變數）。讀 `shortdeckeqmatrix.json`。
4. **`python shortdeckpushfold.py`** — 短牌短碼 push/fold Nash + call-vs-jam，附加進 `frontend/shortdeckdata.js`。讀 `shortdeckeqmatrix.json`。
5. **`python shortdeckworker.py`** — 短牌 flop 批次 worker（同 `gtoworker.py` 機制：原子寫入、鎖檔、`Ctrl+C` 續跑）。用 `shortdeckjobs.json` / `shortdeckcheckpoint/` / `shortdeckresults/`。

## D. 網站即時解算與測試

- **`backend/api/gto.py`** — Django `solveflop` 端點，前端 `tool/range.html`（載入 `gto.js`）呼叫的即時 flop CFR（~2 秒）。單檔自含，**不依賴** A/B/C 的離線資料檔；改動它請跑下面的離線測試。
- **`python testgto.py`** — 離線測 `backend/api/gto.py` 的 `solveflop`（stub 掉 Django 相依，不需 DB/Redis），改後端 solver 後用它快速驗證。

## 前端如何消費這些資料

| 前端檔案 | 讀取的資料 |
| --- | --- |
| `frontend/tool/range.html`（載入 `frontend/gto.js`） | `frontend/gtodata.js`（標準德州 preflop）、`frontend/shortdeckdata.js`（短牌） |
| `frontend/tool/range.html` 的翻後求解器（`gto.js`） | 呼叫 `backend/api/gto.py` 即時求解；也可讀 `gtoresults/manifest.json` + 單筆結果 |

## 一鍵重建參考順序

```powershell
cd C:\nginx\htdocs\website\externalcase\project00061

# 標準德州 preflop 範圍（gtodata.js）
python gtoopen.py
python gtobakeall.py
python gtodeep50.py
python gtopreflowtree.py

# 標準德州 flop 批次（gtoresults/，可長時間、可 Ctrl+C 續跑）
python gtoflops.py
python gtoworker.py

# 短牌（shortdeckdata.js + shortdeckresults/）
python shortdeckequity.py
python shortdeckflops.py
python shortdeckpreflow.py
python shortdeckpushfold.py
python shortdeckworker.py
```

`gtopreflowtree.py` / `gtobake.py` / `gtocall.py` 部分是「印出區塊供人工貼進 `gtodata.js`」，跑完請看終端輸出或產出的 `.txt`，確認要不要貼。
