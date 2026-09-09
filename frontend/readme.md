# frontend

## 用途

前端靜態 HTML/CSS/JS，負責登入、個人檔案、場次、報名工作台、牌桌、手牌、計時器控制端、顯示端、GTO / 翻牌解算入口與工具頁。

## 主要檔案

頁面與共用模組（本目錄頂層；工具頁另在 `tool/` 子資料夾，GTO 求解器頁為 `tool/range.html`，載入頂層 `gto.js`）：

- `admin.html`
- `admin.js`
- `batchcreate.html`
- `batchcreate.js`
- `benefit.html`
- `benefit.js`
- `carddisplay.css`
- `checkin.html`
- `checkin.js`
- `clublist.html`
- `clublist.js`
- `contact.html`
- `contact.js`
- `contactadmin.html`
- `contactadmin.js`
- `control.css`
- `control.html`
- `control.js`
- `display.css`
- `display.html`
- `display.js`
- `edittable.html`
- `edittable.js`
- `follow.js`
- `gto.js`
- `gtoante.js`
- `gtodata.js`
- `gtomultiwaycall.js`
- `guide.html`
- `guide.js`
- `handdetail.css`
- `handdetail.html`
- `handdetail.js`
- `handreplay.js`
- `index.css`
- `index.html`
- `index.js`
- `initialize.js`
- `main.html`
- `main.js`
- `newedithand.css`
- `newedithand.html`
- `newedithand.js`
- `newsession.html`
- `newsession.js`
- `newtable.html`
- `newtable.js`
- `notification.html`
- `notification.js`
- `offline.html`
- `payoutedit.html`
- `payoutedit.js`
- `pokertable.css`
- `print.css`
- `print.js`
- `privacy.html`
- `profile.html`
- `profile.js`
- `qrcode.js`
- `quickhand.html`
- `receipt.css`
- `receipt.html`
- `receipt.js`
- `register.html`
- `register.js`
- `scan.html`
- `scan.js`
- `series.html`
- `series.js`
- `serieslist.html`
- `serieslist.js`
- `session.html`
- `session.js`
- `sessionlist.html`
- `sessionlist.js`
- `sessionseries.js`
- `shortdeckdata.js`
- `signin.html`
- `signin.js`
- `signup.html`
- `signup.js`
- `stackadjust.html`
- `stackadjust.js`
- `staffverify.html`
- `staffverify.js`
- `structure.html`
- `structure.js`
- `structureedit.html`
- `structureedit.js`
- `sw.js`
- `table.html`
- `table.js`
- `tableboard.html`
- `tableboard.js`
- `tailwind.css`（Tailwind 建置產物，由 `npm run build:css` 產生，必須進版控；不要手改）
- `terms.html`
- `tool.css`
- `tooldata.js`（`TOOLITEMLIST` 工具總覽資料來源）
- `toollist.html`
- `toollist.js`
- `translate.js`

## 子資料夾

- `handgame/`：各牌型的**中繼資料註冊表**（`holdem`、`omaha`、`omaha5`、`shortdeck`、`stud`、`razz`、`a5draw`、`deuce7draw`），共登錄 12 種牌型 code。每個檔只呼叫 `handgame.js` 的 `handgameregister()` 登錄 holecount / ranklist / 街別 / 下注制 / 明暗牌對照等資料，**本目錄不含任何評牌或比大小的程式碼**；實際評牌在後端 `backend/api/hand.py` 的 equity 端點。供新增／編輯手牌頁依牌型切換街別與流程。
- `htmlblock/`
- `tool/`：工具頁集合，例如 equity、ICM、pot odds、stack calculator、win probability、timebank drill。`profile.html` 的六格小工具入口固定包含 GTO 與 API 文件；完整清單在 `toollist.html`（工具總覽，可依分類與關鍵字搜尋）。

## 新增小工具流程

小工具集中放在 `frontend/tool/`，每個正式工具原則上使用同名 HTML / JS：

```text
frontend/tool/example.html
frontend/tool/example.js
```

新增或大改工具前，先依根目錄 `AGENTS.md` 建立 `_old_tN` 備份；全新檔案不用備份。

### 1. 建立頁面

- HTML 放在 `frontend/tool/{toolname}.html`。
- JS 放在 `frontend/tool/{toolname}.js`。
- HTML 必須載入：

```html
<base href="../">
<link rel="stylesheet" href="index.css">
<link rel="stylesheet" href="https://chrisplugin.pages.dev/css/chrisplugin.css">
<script src="https://chrisplugin.pages.dev/js/chrisplugin.js"></script>
<link rel="stylesheet" href="tailwind.css">
<link rel="stylesheet" href="tool.css">
```

> **Tailwind 已經不是 CDN 了**（2026-07 改的）。不要再寫
> `<script src="https://cdn.tailwindcss.com"></script>`，要用上面那行 `tailwind.css`。
> 因為 `<base href="../">` 的關係，`tool/` 底下和根目錄的頁面都是寫 `href="tailwind.css"`。
>
> `frontend/tailwind.css` 是**建置產物**，由根目錄的 `tailwind.config.js` 掃描
> `frontend/**/*.html` 與 `frontend/**/*.js` 產生。**新增/修改任何 class 後要重跑**：
>
> ```
> npm run build:css     # 產生 frontend/tailwind.css（約 100 秒）
> npm run verify:css    # 驗證沒有靜默漏產出
> ```
>
> 沒重跑的話新 class 不會有樣式，而且**不會有任何錯誤訊息**（Tailwind 掃不到 class 只是
> 安靜地不產出）——這就是 `verify:css` 存在的原因。產物要進版控（部署是 nginx 直接吃
> 磁碟檔、沒有建置步驟）。詳見根目錄 `tailwind.config.js` 的註解。

頁尾腳本順序固定：

```html
<script src="translate.js"></script>
<script src="initialize.js"></script>
<script src="tool/{toolname}.js"></script>
```

工具頁 `<body>` 要加：

```html
data-backfallback="toollist.html"
```

右上返回按鈕建議使用：

```html
<a href="toollist.html" id="back">回上一頁</a>
```

`initialize.js` 會自動幫工具頁加「加入最愛 / 已收藏」按鈕，並同步後端 `toolfavorites`。

### 2. 寫 JS

- 只放此工具自己的狀態、計算與 render。
- 文字不要直接寫死在 render 裡，先寫 `{toolname}text(key)` 從 `TRANSLATE[LANGUAGE]["{toolname}page"]` 讀取。
- 新互動控制優先使用 `<input type="button">`，符合全站慣例。
- 依專案規範避免 `foreach`、`switch-case`、arrow function、`i++`。
- 計算器要在載入後先跑一次計算，避免畫面初始顯示空結果。
- 會動態產生 HTML 時，使用 `innerhtml(...,false)` 或 DOM API；若內容可能來自使用者輸入，要用 `escapehtml()`。

### 3. 補翻譯

在 `frontend/translate.js` 的 `zhtw` 與 `en` 都補一份：

```javascript
"{toolname}page": {
    "title": "工具名稱",
    "back": "回上一頁"
}
```

至少要包含頁名、返回、欄位 label、按鈕、結果、note、錯誤或空狀態。若工具是資料表或參考卡，可以在 JS 資料中放 `zh/en` 欄位，但頁面固定文案仍建議放 `translate.js`。

目前 `LANGUAGE` 主要為 `zhtw` / `en`；舊工具可能仍有 `e` 判斷，新增工具請優先用 `en`。

### 4. 加入工具總覽

在 `frontend/tooldata.js` 的 `TOOLITEMLIST` 加一筆：

```javascript
{href:"tool/{toolname}.html",category:"chip live",ztitle:"中文名稱",etitle:"English Name",zdesc:"中文描述",edesc:"English description"}
```

> `TOOLITEMLIST` 定義在 **`frontend/tooldata.js`（第 1 行）**，不是 `toollist.js`。`toollist.js` 只是讀這份資料來 render 工具總覽頁，改它不會讓新工具出現在清單裡。

分類可用：

```text
featured / live / chip / payout / strategy / operation / learn / develop
```

一個工具可放多個分類，例如 `category:"chip live"`。

#### 維護中 / 正式區隱藏

`tooldata.js` 另外有兩層控制，兩台機器共用同一份程式碼、靠 hostname 分流：

- `TOOLMAINTENANCEOFFLIST`：**已通過驗收**的工具白名單。不在名單內且 `href` 以 `tool/` 開頭者，`pttoolitemmaintenanced()` 回 `true`，標題會加上「（維護中）／(Maintenance)」。工具驗收完成就把路徑加進這份清單。
- `pttoolproductioned()`：`location.hostname` 為 `pokertrace.net` / `www.pokertrace.net` 時回 `true`（正式區）；`test.pokertrace.net`、`localhost`、IP 等一律回 `false`。
- `pttoolitemvisible(item)`：正式區 + 維護中 → `false`（整個隱藏）；其餘 `true`。可傳工具物件或 `href` 字串。
- `pttoolvisiblelist()`：`TOOLITEMLIST` 過濾後的可見清單。

所有列出工具的地方都要先過 `pttoolitemvisible()`：`toollist.js`（工具總覽，含分類計數；某分類全隱藏時不渲染該分類按鈕）、`index.js`（首頁工具區，全隱藏時整個 `#indextoolsection` 加 `hidden`）、`profile.js` 的 `renderpromotools()`（宣傳小工具，全隱藏時 `#toolspanel` 加 `hidden`）。因此 `index.html` 也要載入 `tooldata.js`。

結果：正式區只顯示白名單內的工具，測試機 / 本機仍顯示全部並保留「維護中」標示，方便繼續測試。

### 5. 如果工具用到計分牌面額

凡是會輸入「面額清單」或需要計分牌組的工具，都要支援從個人資料快速匯入。共用 helper 已在 `initialize.js`：

```javascript
ptloadprofilechipdenoms(function(denomlist){
    if(!denomlist||denomlist.length<1){
        return
    }
    // 將 denomlist 套用到本工具
})
```

按鈕文字用：

```javascript
pttoolchiptext("load")
```

目前已串接的工具包含：

- `chipcount.html`
- `chipsetup.html`
- `colorup.html`
- `chipinventory.html`
- `chiprace.html`
- `splitpot.html`
- `structuregen.html`

如果新增計分牌工具，請沿用這套 helper，不要每頁重寫 `getuser`。

### 6. 如果工具需要後端 API

- API 放在 `backend/api/` 對應模組，路由補到 `backend/api/url.py`。
- 前端使用 `AJAXURL` 與 `ajax()`。
- 需要登入時帶：

```javascript
[
    ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
]
```

- API 回傳維持：

```json
{"success": true,"data": {}}
```

- 若是公開工具 API，記得補 `frontend/tool/apidoc.js`。

### 7. Profile 六格入口

`profile.html` 的小工具六格必須固定包含：

- GTO
- API 文件

若要把新工具放入 profile 小工具，請確認仍保留這兩個入口，並同步檢查手機版排版。

### 8. 檢查指令

至少跑新增或修改的工具：

```powershell
node --check frontend\tool\{toolname}.js
node --check frontend\tooldata.js
node --check frontend\toollist.js
node --check frontend\translate.js
```

若有改共用初始化：

```powershell
node --check frontend\initialize.js
```

有新增或修改 Tailwind class 時（新工具頁幾乎一定有），要重建樣式並驗證：

```powershell
npm run build:css
npm run verify:css
```

若要一次檢查所有工具 JS：

```powershell
Get-ChildItem frontend\tool -Filter *.js | Where-Object { $_.Name -notmatch "_old_t\d+" } | ForEach-Object { node --check $_.FullName }
```

最後跑空白檢查：

```powershell
git diff --check -- frontend\tool\{toolname}.html frontend\tool\{toolname}.js frontend\tooldata.js frontend\translate.js
```

### 9. 完成定義

一個小工具至少要符合：

- 有 `tool/{toolname}.html` 與 `tool/{toolname}.js`。
- 已加入 `tooldata.js` 的 `TOOLITEMLIST`。
- 有改 Tailwind class 的話已重跑 `npm run build:css`，且 `frontend/tailwind.css` 一起進版控。
- 有中英文翻譯或明確的 zh/en 資料欄位。
- 直接開頁時返回 fallback 是 `toollist.html`。
- JS 語法檢查通過。
- 手機版不會文字重疊或按鈕擠出。
- 用到計分牌面額時可匯入 profile 常用計分牌組。
- 若有後端 API，API 文件同步更新。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- `newedithand` 在統一紀錄模式可建立沒有 Hero 的公共手牌；`handdetail` 讓玩家只更新自己的私有底牌與私人備註。
- `handreplay.js` 是手牌動畫回放：`handdetail.html` 的「▶ 動畫回放」按鈕會用同頁覆蓋層，把該手 `bittingdata`（依 `type` 分街、`id` 順序）展開成逐步 frame，在橢圓牌桌上播放發牌→逐街下注→翻公共牌→攤牌，含播放／單步／速度／進度條與「顯示所有底牌」切換。底牌預設牌背、hero（`selfseating`）預設亮並固定置於牌桌正下方、攤牌亮未蓋牌者。下注計分牌會呼叫 `getsessionchips` 用該場實際面額顏色上色（失敗則用通用色階）。牌桌另含：座位剩餘碼隨投入即時扣減、all-in 標誌、all-in 且動作結束（未蓋牌未全押者≤1）即翻牌、all-in 勝率＋outs（呼叫 `equity` 端點，僅有人 all-in 且底牌已知時顯示）、底池計分牌疊（可關閉）、左側 side pot、右側燒牌（`boardcard.burnflop/turn/river`）、一開始空桌不放牌背、攤牌後多一格「派彩」把底池計分牌移到贏家（`winnered`）面前；長按牌桌可開皮膚燈箱、長按後左右拖曳可 scrub 時間軸。牌桌視覺樣式抽在共用的 `pokertable.css`。
- `session.html` 的「其他 → 設定」側欄除了「一般」「牌局設定」「刪除賽事」，另有「我的成績」：編輯自己在該場次的獲獎金額、名次、總買入、獲獎獎品、有進錢圈（ITM）與有進 Final Table，送 `editsessionresult`。舊的 `editsession.html` / `editsession.js` 已移除，這裡是唯一入口；`sessionlist` 的「編輯」與場次頁個人紀錄區的「編輯」都導到 `session.html?id=<id>#other-settings-result`，重新整理也會停在同一個分頁。該端點是整列覆寫，七個欄位一定要送齊，只有 `reentrycount` 本頁沒有欄位可編輯、會用 `currentsession` 目前值原樣帶回，避免被洗成 0；儲存後呼叫 `loadsessiondata()` 讓總覽盈虧同步。整個設定分頁由 `canviewsessionsettings()`（`isown` / `isadmin` / `isstaff`）控管，對應後端 `_cansessionsetting`。
- `clublist` 手機版以卡片呈現並有前端分頁；`sessionlist` 手機版搜尋區可收合，兩者搜尋都提供清空按鈕。
- `initialize.js` 會注入共用 manifest 與 `touch-action: manipulation`，也提供計時器頁共用常數與 loading helper；計時器相關頁面會載入 `initialize.js`，但依頁面類型跳過站台 nav / footer 注入。
- `display.html` 是目前唯一不做中譯的前端頁面，計時器顯示端固定維持英文顯示文案。
- `initialize.js` 提供「搖一搖聯絡我們」：手機劇烈搖晃時跳出燈箱引導到 `contact.html`；使用者可在燈箱內或個人資料偏好設定關閉（localStorage `shakecontactoff`）。iOS 未授權動作感應時會顯示一次性引導橫幅（點「允許」的手勢當下請求系統授權；「先不要」記錄在 `shakecontactiosasked` 不再打擾），也可之後在 `profile.html` 的開關點擊時再授權。計時器頁不啟用。
- `newtable` 支援用起始與結束牌桌編號一次新增多個牌桌，例如 1 到 9 會建立 9 個牌桌；名稱欄在範圍模式會當作前綴。
- 舊的 `registrations.html` 已由 `register.html` / `register.js` 取代。
- 報到有兩條路徑，用的是**不同編號**，不可混用：`scan.html` 掃收據 QR 走 `checkin.html?s=<場次id>&r=<報名id>`（`r` 是 `sessionplayer.id`，QR 由 `register.js` 產生）；手動輸入走 `checkin.html?s=<場次id>&entry=<入場編號>`（`entry` 是收據上印的「入場編號」＝ `sessionplayer.serialno`，只在單一場次內唯一，所以一定要帶 `s`）。`checkin.js` 有 `r` 就打 `getcheckininfo`，只有 `entry`+`s` 就打 `getcheckininfobyentry`，兩支回傳結構相同。
- `scan.html` 手動輸入區有場次下拉：清單取 `getsessionlist?limit=200&page=1`，前端只留「主辦場次（`owned`）＋ 自己可操作（`isown` / `isstaff`）＋ 未結束（`sessionended` 不為 true）＋ 結束未超過一天」的場次；只有一場時自動選定，帶 `?s=<場次id>` 進來（`register.html` 的「掃描 QR」會帶）則預選該場並仍可切換。文案在 `translate.js` 的 `scanpage` / `checkinpage`。
- `register.js` 加入玩家輸入框旁有「測試使用者」開關按鈕：預設關閉，查詢結果一律過濾掉測試使用者（`backend/defultuser.py` 產生、playerid `0` 開頭）；開啟後按鈕會 highlight（綠色），查詢結果才會包含測試使用者，且關鍵字為空時會自動以 `TUP_` 前綴列出測試玩家。
- 全站按鈕目前以 `<input type="button|submit|reset">` 為主；少數需要包含子元素的互動區塊使用 `role="button"`、`tabindex="0"` 與鍵盤事件。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
