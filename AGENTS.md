# AGENTS.md

這份文件是給 Codex / AI agent 看的專案操作指南。進入此專案後，先讀這份，再依照任務需要讀 `backend/AGENTS.md` 或 `frontend/AGENTS.md`。

本專案同時採用 Monstrare 治理流程（`ai/process/`），流程規則見文末「Monstrare 治理流程」一節。**本檔案上半部的 coding style、備份規則、權限慣例優先於 Monstrare 的任何通則**；兩者衝突時以本專案規則為準。

## 「所有 / 全部 / 全站 / 每一個」的定義（重要，不可誤解）

當使用者說「所有」「全部」「全站」「每一頁」「每個」「逐一」時，指的是**字面意義的每一個有效檔案／頁面／端點／工具**，而**不是抽樣、代表性樣本或「先做一部分」**。

唯一可排除的，只有以下兩類「非有效目標」：

1. **系統 / 自動產生檔**：`log/`、`*.log`、`__pycache__/`、`*.pyc`、`db.sqlite3`、其他建置或執行期自動產物。
2. **暫存 / 備份檔**：`*_old_t*.*`（本專案備份命名）、`* copy.*` / `*copy*`（此類命名的檔案；`backend/api/timer copy.py` 已於 2026-07-29 依 TASK-051 改名為 `timer_old_t2.py`）、其他明顯為暫存或草稿的檔案。

除此之外的每一個都要納入。具體要求：

- 做「全站檢查表」「測試每一頁」「列出所有端點」「涵蓋所有工具」這類任務時，**先用 `ls` / Glob 把實際清單列出來**（例如 `frontend/tool/` 下的每個 `*.html`、`backend/api/url.py` 的每條路由），再**逐一**處理，數量多也要全部做完。
- **嚴禁**用「依此類推」「其餘比照」「列出代表頁」來取代逐一列出。真的同質的項目也要把每個名稱各自列出來，可共用說明但不可省略項目。
- 若因量大需分批，分批是執行手段，**不是只做一批就交差**；沒做完就要說清楚還剩哪些，不可給人「已涵蓋全部」的錯覺。
- 不確定範圍邊界時，先確認，不要自行縮小範圍。

## 專案概況

這是 PokerTrace 類型的撲克場次管理系統，主要功能包含：

- 選手帳號、登入、個人檔案與盈虧統計。
- 場次建立、編輯、複製、刪除、列表與報名。
- 主辦者聘用人員，角色包含計分員、裁判、助理。
- 場次牌桌、座位、手牌紀錄。
- 比賽計時器，包含 `control.html` 控制端、`display.html` 顯示端、REST API 與 WebSocket 同步。

主要目錄：

- `frontend/`：靜態 HTML/CSS/JS 頁面。
- `backend/`：Django API、Channels WebSocket、SQL helper。
- `backend/api/`：各功能 API。
- `backend/pokertrace/`：Django 設定、URL、ASGI/WSGI、WebSocket routing。
- `backend/!SQL/`：資料庫匯出封存（目前只有兩份 2026-05-13 的 pg_dump custom-format 二進位檔，已過時，見該目錄 readme）。
- `!SQL/`：目前只有說明文件，**沒有任何 SQL 檔**；要找 dump 請看 `backend/!SQL/`。

## 使用者指定 Coding Style

產生或修改程式碼時要盡量遵守：

- 不使用 `foreach`。
- 不使用 `switch-case`。
- 不使用 `===`、`!==`，一律使用 `==`、`!=`。
- 不為了風格規則修改註解；註解中的 `===`、`=` 或分隔線不需要改。
- 盡量不使用三元運算式，除非是在 HTML template literal 中能明顯讓畫面組裝更短、更清楚。
- 盡量不要使用 early return；優先寫成正向條件把主要流程整段包住，只有在明顯更清楚或必要的防呆情況才例外。
- 不使用簡化表示法，例如 arrow function、`i++`。迴圈請寫 `i=i+1`。
- 不要保留未使用的常數或變數；先確認真的有用途，沒用就移除。
- 不會重新指定的值要用 `const`，且 `const` 命名一律全大寫、不使用底線，例如 `SESSIONID`、`RESYNCMS`。
- 語言不需要分號時省略分號。
- 盡量不使用 `while`、`do-while`、外掛插件、額外 function；如果真的能讓程式更清楚，可以使用。
- 優先使用雙引號，再使用單引號。
- 不做無意義空格，例如 `if($hi==$hi){}`、`let x=1`。
- 保持縮排，遇到 `[ { < > \`` 這類區塊要換行並縮排 4 格。
- CSS 使用標準排版方式，`selector {` 中間保留一個空格，`{` 後換行，`}` 獨立一行。
- CSS 屬性每行一個，格式固定為 `key: value;`，冒號後保留一個空格。
- 盡量不要使用 inline style，優先把樣式寫在 CSS 檔案中。
- 前端 HTML 屬性順序要固定，優先套用在 `input`、`select`、`textarea`；目前全站按鈕以 `<input type="button|submit|reset">` 為主，只有需要子元素的互動區塊才使用 `role="button"`。
- 屬性順序原則：先放元素必要屬性，再放帶值屬性，再放不帶值屬性。
- 常用排序：`src`、`for`、`type`、`href` 放前面；`class` 放在前段；`data-*` 在 `class` 後；`id`、`name` 再後面；`required`、`readonly`、`disabled` 這類不帶值屬性放最後。
- `min`、`max`、`value`、`placeholder`、`title`、`alt` 這些視為非必填帶值屬性，不要放在 `class`、`data-*`、`id` 前面。
- 例如 `input` 優先寫成：`<input type="number" class="..." id="reentrycount" min="0" value="0">`，不要寫成 `<input type="number" value="0" min="0" class="..." id="reentrycount">`。
- `let`／`var` 變數全小寫，不用底線或其他符號，例如 `playername`、`tablelist`；只有 `const` 常數才全大寫（見下方常數規則）。
- JavaScript 的 object / JSON key 新增時要加雙引號，例如 `{ "success": true }`，不要寫 `{ success: true }`。
- 匿名 function 不要在 `function` 和 `()` 中間加空格，請寫 `function()`、`function(event)`。
- 如果一段邏輯不會重複用到，就盡量不要另外定義成 function，優先直接寫在當下流程裡。
- 不要把函式指派給變數，例如 `const fn=function(){}`、`let fn=function(){}`，一律改寫成函式宣告 `function fn(){}`；只有覆寫既有函式的 decorator 寫法 `fn=function(){}` 例外。
- 指派與宣告不要在 `=` 前後加空格，例如 `let x=1`、`const SESSIONID=...`。
- Python 指派與參數預設值也不要在 `=` 前後加空格，例如 `x=1`、`def run(value=0):`。
- 後端、API、WebSocket、localStorage 已存在的資料欄位名稱不可單邊改名；若既有協定是 `currentIndex`，前端可用 `state["currentIndex"]` 存取，但不能只在單一檔案改成 `currentindex`。
- 命名不要使用縮寫，請寫完整單字，例如 `buttonparsestruct`，不要寫 `btnParseStruct`，其中 `btn` 一律改寫成 `button`，並維持全小寫。
- 命名不要直接用英文複數加 `s`，尤其是陣列、清單型資料請改用 `list` 結尾，例如 `handlist`、`playerlist`，不要寫 `hands`、`players`。
- 資料夾命名也盡量不要直接用英文複數加 `s`，尤其是結果集、輸出集、資料集這類目錄；新增時優先用單數或其他更明確名稱。現有 `gtoresults`、`shortdeckresults` 屬歷史命名，先不要只改單邊名稱，若未來要改必須連同前端載入路徑、worker 腳本與相關文件一起完整調整。
- 常數js要用const，而且任何語言全大寫，不用底線或其他符號，例如 `CREATETIME`、`CHECKVISIBILITY`。
- 布林值用ed做結尾，例如`owend`(是否擁有者)、`preved`(是否有前項(一頁))、`nexted`(是否有後項(下一頁))
- Python 迴圈可以寫 `for item in row`，不要為了避開 `foreach` 寫成較難讀的索引迴圈。

既有檔案有不少歷史寫法不符合規範。修改時以「新改的區塊」優先遵守，不要為了格式做大範圍無關重構。

## SQL 組法（不可破壞的兩條）

本專案沒有 ORM，SQL 都是手寫字串。2026-07-30 把全專案 41 處字串插值逐一追過
（`backend/tool/scansqlinjection.py` 列出、`npm run verify:sql` 追完），**結論是沒有 SQL 注入**。
但那個結論不是因為底層安全，而是因為下面兩條慣例一直被遵守。**破壞其中任何一條就會產生注入**。

### 一、where 條件字串裡只准放字面值與 `%s`

值一律 append 到參數清單，絕不串進字串。

```python
# 對
where.append("a.\"name\" ILIKE %s")
param.append("%"+keyword+"%")

# 錯 —— 直接注入
where.append(f"a.\"name\" ILIKE '{keyword}'")
```

注意要檢查的是**被 join 的那個 list 裡 append 了什麼**，不是 `wheresql=" AND ".join(where)`
那一行。只看 join 那一行會得到「都是字面值，安全」的空結論。

### 二、`queryinsert` / `queryupdate` 的 data，key 必須來自寫死的清單

`backend/function/sql.py` 的那三個 helper 是字串拼接組 SQL：**表名**直接插進
`INSERT INTO "{tablename}"`，**欄位名來自 `data` 的 key** 也直接插進 SQL。
只有參數值走 `%s`。所以 data 的 key 等於欄位名，**不能讓外部決定**。

```python
# 對 —— 白名單迴圈，request 只決定「要不要納入這個 key」與「值是什麼」
update={}
for key in ["ps","note","blindlevel","smallblind","bigblind"]:
    if key in data:
        update[key]=data[key]
queryupdate(SETTING["dbname"],"hand",update,{"id": handid},SETTING["dbsetting"])

# 錯 —— 欄位名由攻擊者決定
data=json.loads(request.body)
queryupdate(SETTING["dbname"],"hand",data,{"id": handid},SETTING["dbsetting"])
```

表名同理：一律寫字面值，不要用變數。

改完跑 `npm run verify:sql`，兩條都會被檢查。

## 備份規則

修改既有檔案前要先備份，命名：

```text
{檔名}_old_t{流水號}.{副檔名}
```

例：

- `frontend/sessionlist.js` 第一次備份為 `frontend/sessionlist_old_t1.js`
- `backend/api/session.py` 第二次備份為 `backend/api/session_old_t2.py`

找流水號時先看同目錄是否已有同名 old 檔，使用下一個數字。新增全新檔案不需要備份。

## 權限與角色概念

帳號類型：

- `player`：選手 / 擁有者 / 主辦者。
- `dealer`：計分員。
- `floor`：裁判。
- `assistant`：助理。

**術語只有一套（2026-07-31 使用者定案，TASK-096）**：畫面文案一律寫**計分員**、**選手**、
**計分牌**，不使用發牌員 / 玩家 / 籌碼等其他說法。DB 的 `dealer`、`player` 等欄位值與
API 欄位名**不改**（既有協定不可單邊改名），改的只有顯示文案。

聘用資料：

- `userstaff`：選手全域聘用某位人員。
- `sessionstaff`：單一場次聘用某位人員。

場次權限目前慣例：

- 擁有者可完整操作自己的場次。
- 已聘用人員可看到相關場次，也可編輯。
- 已聘用人員不應計入自己的盈虧統計。
- 已聘用人員不可刪除或複製場次。
- 裁判與助理可操作計時器；計分員不可操作計時器。
- 管理員通常以 `permission>=4` 判斷。

## 外部依賴：chrisplugin（已知的單點故障，刻意維持）

全站 126 個 HTML 都從外部 CDN 載入 `https://chrisplugin.pages.dev/js/chrisplugin.js`
與同站的 css。**專案自己沒有定義**、完全靠這支腳本提供的符號有 23 個：

`domgetid`、`doccreate`、`innertext`、`innerhtml`、`value`、`href`、`style`、
`addclass`、`removeclass`、`onclick`、`onchange`、`oninput`、`onsubmit`、`onresize`、
`onkeydown`、`onenterclick`、`on`、`ajax`、`weblsget`、`weblsset`、`getget`、
`getvalue`、`int`、`json`

要注意兩件事：

- **不要把它們當成「漏了定義」去補一份實作。** 補了就會有兩份實作漂移。
  `initialize.js` 裡有一個**巢狀**的 `function onkeydown(event)`，那不是頂層定義，
  別被它誤導（`sessionlist.js` 的 `onkeydown("#name",fn)` 是 chrisplugin 的選擇器綁定 helper）。
- **遇到「整頁空白但沒有任何錯誤訊息」，先確認這支外部腳本載得到。**
  外部腳本 404 是靜默的，而 `ajax` 是全站唯一的 API 管道、`weblsget` 是 token 的讀取管道。

TASK-084 已決定**維持現狀**（不本地化、不加 SRI），把它當成已知且已接受的風險。
完整的範圍、風險清單與重新評估的訊號見
`ai/artifacts/技術債與安全/architecture-note-chrisplugin外部依賴.md`。

## HTML 靜態中文的翻譯：用 `data-i18n` 標記（TASK-069 已定案選 B）

新寫或修改 HTML 的靜態文字時，**標記寫在元素身上**，不要再往 `translate.js` 的
`pageauto` 加 CSS selector：

```html
<h1 data-i18n="sessionlist.title">場次管理</h1>
<input type="text" class="…" data-i18n-placeholder="sessionlist.name" id="name" placeholder="名稱">
<select class="…" data-i18n-aria-label="sessionlist.gametypefilter" id="gametype" aria-label="遊戲類型">
<option data-i18n="gametype.cash" value="cash">現金局</option>
```

- 鍵是**「區段.鍵名」**，對應 `TRANSLATE[語言][區段][鍵名]`。沿用各頁既有的區段
  （`sessionlist`、`gametype`…），不要另立命名空間。點記法讓跨區段引用很自然 ——
  遊戲類型的選項屬於共用的 `gametype` 區段，不屬於 `sessionlist`。
- 屬性用 `data-i18n-<屬性名>`。可用的屬性名由 `initialize.js` 的 `I18NATTRLIST` 決定
  （目前 `placeholder`、`value`、`title`、`alt`、`aria-label`）。要新增就改那個常數，
  檢查工具會自動跟上。
- `data-i18n-*` 依屬性順序規則放在 `class` 之後、`id` 之前。
- **HTML 裡原本的中文要留著**，不要清空。找不到鍵時執行期**不覆寫**，
  那些中文就是退路 —— 這比顯示鍵名好（TASK-085 就是畫面顯示 `indextoollistlink` 那次）。

**已經被該頁 JS 翻譯的節點不要再加標記**（例如 `sessionlist.js` 的
`applysessionlanguage()` 已經處理的那些），兩套機制寫同一個節點只是多餘。

改完跑：

```powershell
npm run verify:i18n
```

它查三件事：鍵在中英兩棵樹都要有、屬性名要在白名單內、以及**模擬切成英文後那一頁
還剩多少中文**（第三項是報告不是關卡，全站遷移是漸進的）。

背景數字與為什麼不選 selector 方案，見
`ai/artifacts/分析與國際化擴充/measurement-HTML靜態中文與pageauto.md`。
既有的 `pageauto` 不會拆掉，但**不要再往裡面加東西**（`npm run verify:pageauto` 顧著它）。

### 第三節的數字是「待驗證的宣稱」，不是事實

2026-07-31 做 TASK-093 時，那個數字一路從 1,139 降到 5，**降下來的絕大部分不是做完了，
是偵測器本來就在高報**。抓到三個各自獨立的 bug，每一個都讓已經翻譯好的節點被算成沒翻譯：

1. 語言樹解析器**照縮排數 tab**、不是照大括號（docstring 卻寫「大括號深度解析」）。
   `stackcalcpage` 裡四個縮排多一層的鍵對稽核完全隱形 —— 於是我重複新增了同義鍵，
   被 `verify:dupkey` 攔下來才發現。
2. 屬性型標記的模擬替換**依賴屬性順序**，要求標記寫在真屬性前面。
   `newsession.html` 是反過來寫的，整頁被誤報。屬性順序在 HTML 沒有語意，工具不可以依賴它。
3. 兩種 JS 寫入形狀認不出來：`let setid=function(id,text){…}`（指派給變數的函式）
   與「選擇器→文字的 map 物件 + `for...in` 迴圈」（`handdetail.js` 的 `applyhanddetailstatic()`）。

所以**照著第三節的清單去補鍵之前，先確認那一頁真的沒被翻譯**：
開頁面切成英文看，或去看該頁 JS 有沒有在寫那個節點。
解析器改成真的括號深度掃描了，有負向測試顧著：

```powershell
python tools/audit/checkdatai18n.py --selftest
```

`pageauto` 涵蓋的頁面（例如 `privacy.html`）數字一定高報，因為 CSS selector 沒有 DOM
對不到具體節點。第三節會在頁名後面標出「這一頁有 N 個 pageauto selector」，不要當成沒翻譯。

## 同步正式機：`backend/` 不可以整包推

正式機 `C:/nginx/web/pokertrace` 有**機器專屬設定檔**，內容本來就該和測試機不同：

| 檔案 | 測試機 | 正式機 |
|---|---|---|
| `backend/api/initialize.py` | `dbname="pokertrace_test"`、`BASERUL` 指 test 網域 | `dbname="pokertrace"`、`https://pokertrace.net/frontend/` |
| `backend/dbinitialize.py` | `DBNAME="pokertrace_test"` | `DBNAME="pokertrace"` |
| `backend/runserver.cmd` | 埠 8161、`test.pokertrace.net` | 埠 8061、`pokertrace.net` |
| `backend/install-service.cmd` | `SVC=PokerTraceTest` | `SVC=PokerTrace` |
| `backend/nssmrestart.cmd` | `nssm restart PokerTraceTest` | `nssm restart PokerTrace` |
| `backend/localenv.cmd` | 各機器自己的密鑰 | 同左 |

**前端靜態檔可以整批推，`backend/` 一律逐檔指定。**

2026-07-29 同步時把 `backend/` 整包複製過去，蓋掉了前兩個檔。後果不只是讀錯庫：
`dbinitialize.py` 是 `runserver.cmd` 每次啟動都會跑的 schema 同步腳本，所以**每次重啟
都把 schema 套到測試庫**，正式庫因此少了 8 個欄位、排程器每分鐘噴一次
`column "startnotifiedtime" does not exist`。這狀況持續兩天，
**是使用者自己從 playerid 變了發現的，沒有任何檢查抓到。**

`npm run audit:machine` 其實看得到 —— 那幾個檔會從「兩邊都有但內容不同」的清單裡**消失**。
但那是三百多行的清單，沒有人會注意某一項不見了。**消失是很難看見的訊號**，所以另外做了：

```powershell
npm run verify:machineconfig
python tools/audit/checkmachineconfig.py --selftest
```

它查三件事：這台機器有沒有自己該有的值、有沒有混到另一台的值、兩邊的檔案是不是
變成完全相同。找不到正式機路徑時是 **exit 2（查不了）而不是 exit 0**。
負向測試用的是**那次真實壞掉的檔案**，不是只有合成案例。

### 改完設定要重啟，而重啟會跑 schema 遷移

`dbinitialize.py` **不是純新增**：除了 105 條 `ADD COLUMN IF NOT EXISTS`，還有兩段
會 `DROP COLUMN` 的遷移（`user.chipsets`、`user.toolfavorites`），而且包了
`EXCEPTION WHEN OTHERS THEN RAISE WARNING` —— 某列的舊 JSON 壞掉會被跳過，
**然後欄位照樣被 DROP**，那就是靜默資料遺失。

所以順序是：**備份 → 量化 → 改 → 重啟 → 驗證**。

```powershell
cd backend
call .\localenv.cmd && python tool\dumpdatabase.py pokertrace_before_XXX.dump
python tool\premigratecheck.py     # 量化那兩段遷移實際會動到幾列，不要靠猜
python tool\comparedb.py           # 兩庫逐項比對（含 schema 差異），唯讀
```

**備份不能用 `backend/backup/backup_db.py`** —— 它是 `env("PT_DB_NAME","pokertrace_test")`，
而正式機的 `localenv.cmd` 沒有設 `PT_DB_NAME`，所以會備到測試庫。
`restore_db.py` 同樣的問題，而且更危險。修好之前不要碰它。

## Tailwind 是建置產物（改 class 後一定要重跑）

`frontend/tailwind.css` 是**建置產物**，由根目錄 `tailwind.config.js` 掃描 `frontend/**/*.html` 與 `frontend/**/*.js` 產生（2026-07 從 Play CDN 改成建置版）。

- 只要改動 HTML / JS 裡的 Tailwind class，就必須重跑 `npm run build:css`，並用 `npm run verify:css` 驗證。
- **沒重跑 = 新 class 靜默沒有樣式，不會報任何錯**。Tailwind 掃不到 class 只是安靜地不產出，這點務必記住。
- 產物 `frontend/tailwind.css` **必須進版控**：部署是 nginx 直接吃磁碟檔、沒有建置步驟。
- 不要再使用 `https://cdn.tailwindcss.com`。

詳見 `frontend/AGENTS.md` 與 `frontend/readme.md`。

## 常用檢查指令

Tailwind（有改 HTML/JS class 時）：

```powershell
npm run build:css
npm run verify:css
```

前端 JS 語法：

```powershell
node --check frontend\profile.js
node --check frontend\sessionlist.js
node --check frontend\register.js
node --check frontend\control.js
node --check frontend\display.js
```

後端 Python 語法：

```powershell
python -m py_compile backend\api\user.py backend\api\session.py backend\api\timer.py
```

Diff 空白檢查：

```powershell
git -c safe.directory=C:/nginx/htdocs/website diff --check -- backend\api\session.py frontend\sessionlist.js
```

查狀態：

```powershell
git -c safe.directory=C:/nginx/htdocs/website status --short
```

靜默失效檢查（`tools/audit/`，每一支都做過負向測試 —— 先證明它抓得到，才拿它當綠燈。
這裡不寫數量，寫了就會跟實際清單漂移）：

```powershell
npm run verify:css         # Tailwind 產物有沒有漏掃 class
npm run verify:load        # 頂層 TDZ 與 initialize.js 載入順序
npm run verify:defaults    # 前後端各自維護的預設值有沒有不一致
npm run verify:translate   # 翻譯鍵缺漏（缺鍵時畫面會靜默顯示鍵名）＋ 使用者可見文案有沒有洩漏內部資訊
                           #（腳本檔名 / localhost / 磁碟機路徑 / 指令列 —— 曾經把
                           # 「請先在本地執行 gtoworker.py」顯示給正式站訪客好幾週）
npm run verify:reference   # HTML 指向不存在的檔案、JS 操作不存在的 id
npm run verify:apidoc      # url.py 的路由與 apidoc.js 的漂移
npm run verify:runtime     # 依頁面照 <script> 順序沙箱執行，抓 node --check 抓不到的錯
npm run verify:apiview     # @api_view 結構、路由指向、重複路徑
npm run verify:sql         # 上面「SQL 組法」那兩條
npm run verify:cssvar      # 用了 var(--x) 但 --x 從來沒定義過（靜默失效）
npm run verify:dupkey      # 物件字面值同層重複 key（後面的會靜默覆蓋前面的）
npm run verify:potsplit    # O8 / BO 高低分池的獎池金額（影響選手實拿，錯了不會報錯）
npm run verify:email       # email 模板的中文有沒有被動到（逐字比對改動前的 _old_t 備份）
npm run verify:gtomanifest # 翻後結果庫的每個結果檔是否還查得到（以磁碟檔名為基準，不抽樣）
npm run verify:toolgate    # 「哪些工具已解禁」的兩份清單（tooldata.js 與 nginx.conf）是否一致
npm run verify:pageauto    # translate.js 的 pageauto selector 還對不對得到東西（對不到就靜默留著中文）
npm run verify:i18n        # data-i18n 標記的鍵在兩棵語言樹都有嗎、屬性名在白名單內嗎
npm run verify:i18norder   # data-i18n 標記有沒有插在 class 前面（屬性順序，TASK-097 已全部正規化）
npm run verify:tablesort   # 表格排序的三個零件（ptsortth / ptsortarrow / ptbindsort）對得起來嗎
npm run verify:auth        # 每個 token 驗證 helper 都有擋掉被封禁的使用者嗎
npm run verify:resourceauth # 吃 sessionid / handid 這類資源 id 的端點，有沒有驗「這個人能不能碰這筆」（IDOR）
npm run verify:tablename   # API 引用的資料表 schema 建得出來嗎（query() 對不存在的表只回 None，看起來像 404）
npm run verify:columnname  # INSERT / UPDATE 的欄位 dbinitialize 建得出來嗎（欄位只活在手動遷移腳本裡＝沒跑過的機器就是少一塊）
npm run verify:apicall     # 前端打的 API 路徑後端真的有註冊嗎（打不到只會變成泛用「載入失敗」）
npm run verify:bearertoken # getbearertoken() 對各種 Authorization 標頭的放行/擋掉（期望值來自正式機實測）
npm run verify:machineconfig # 正式機的機器專屬設定有沒有被同步蓋掉（見下節）
```

### 端點驗證一律走 `authhelper.gettokenuser`

`backend/api/` 曾經有 35 個端點自己抄了一份 token 驗證。和共用版本比，它們少了**三件事**
（不是一件）：封禁複查 `getuserbanned()`（35 個都少）、查 `"user"` 表的
`deletetime IS NULL`（27 個都少 —— 後果是**已軟刪的帳號 token 還能用**）、
以及 Bearer scheme 驗證（`header.split("Bearer ")[1]` 會把 `"XBearer abc"` 當成合法）。
`user.py` 那一組甚至完全沒檢查使用者列是否為空，直接 `tokenuserrow[0]["permission"]` ——
列不存在時是 IndexError → 500。

新端點一律寫：

```python
from .authhelper import gettokenuser as commonauthuser

tokenuserrow,autherror=commonauthuser(request)
if autherror:
    return autherror
```

`tokenuserrow` 是 **dict**（`userrow[0]`），不是 list。

批次轉換用 `python tools/audit/convertinlineauth.py <檔案> [--apply]`。
它只認完全吻合的形狀，其餘跳過並列出來 —— 這是驗證程式碼，**改壞了不會有錯誤訊息**，
只會安靜地放行或安靜地擋掉所有人。`signup` / `signin` 這類登入註冊流程在
`NEVERCONVERT` 清單裡：它們不是「拿既有 token 換使用者」，轉下去會直接弄壞註冊。

### 掃描器只認第 0 欄的 `def` 的話，會整個模組看不到

2026-07-31（TASK-099）：`verify:auth` 報「端點內嵌驗證 0 個」的同時，
`staff.py` 的 6 個端點正自己抄著一份 token 驗證，而且查 `"user"` 時連
`deletetime IS NULL` 都沒帶 —— **已軟刪的帳號還能新增/移除員工**。

原因不在判準，在切檔案的那一步：`club.py`（6 個函式）、`staff.py`（7 個）、
`sessionplayer.py`（15 個）、`timer.py`（4 個）把 def 包在**模組層的 `try:`** 裡
（檔案中的 `# main START` 就是那個區塊的開頭），所以 `def` 前面有一個 tab，
而掃描器要求行首就是 `def `。那不是少報幾個，是**那些檔案從頭到尾沒被看過**。

寫任何掃 `backend/api/` 的工具都要記得這件事：**用 `ast` 走語法樹**，
不要用「行首是不是 def」判斷。`checkauthhelper.py` 與 `checkresourceauth.py` 都已改成 ast。

Coding style 檢查（`verify:style`）分兩種模式，因為本節開頭那句「既有檔案的歷史寫法
不必為了格式大改」必須成立：

```powershell
npm run verify:stylechanged                               # **改動行關卡**（最貼合本節規則）
npm run verify:style                                      # 全站盤點，永遠 exit 0
node tools/audit/scanstyle.js --files frontend/xxx.js      # 單檔關卡
```

**改完請跑 `npm run verify:stylechanged`** —— 它用 `git diff` 只檢查你真的動過的那些行，
正是本節開頭那句「以新改的區塊優先遵守」。單檔模式是檔案層級的，
一個常改的大檔案裡只要有一行歷史寫法就永遠紅燈。不要拿全站盤點的數字當目標。
只檢查客觀規則（`===`、arrow function、`i++`、switch、forEach、`=` 空格、
`function (`、把函式指派給變數、HTML inline style、CSS 排版），
「盡量不要」那類軟規則需要判斷，機器不判。

`node --check` **只驗語法**，抓不到執行期的錯。實際踩過的例子：把 Python 的 `True`
寫進 JS（`{ ex: True }`）語法完全合法、check 一定過，瀏覽器一載入就 ReferenceError；
`render()` 與 `applycontrolruntimecopy()` 互相呼叫造成無限遞迴，check 也過。
這兩類要靠 `npm run verify:runtime`。

看板卡片的稽核（不是每次都要跑）：

```powershell
npm run audit:cards       # 卡片提到的檔案與識別字現在還在不在
npm run audit:rerun       # 重跑卡片裡可安全執行的驗證指令
npm run audit:machine     # 測試機 / 正式機逐檔比對
npm run audit:cardfield   # 卡片的 track / stage / risk / epic 是否為看板認得的值
```

資料完整性健檢（唯讀，只跑 SELECT；需要 DB 密碼，連不上會 exit 2 而不是假裝通過）：

```powershell
npm run audit:data        # 孤兒列、軟刪不一致、gametype 合法性、重複座位
npm run audit:localstorage # localStorage 寫入點清冊：哪些 key 有納入過期回收
```

## 工作方式

- 先讀相關 HTML/JS/API，確認既有資料流再改。
- 不要移除使用者或其他 agent 已做的修改。
- 不要主動 `git add`／`git commit`／`git push`；staging 與提交一律由使用者自己處理，agent 只負責改檔案。注意 `git checkout <ref> -- <path>` 會順手更新索引（staging），需要還原檔案時要留意並事後提醒使用者。
- 保持 CSS/JS 分離；新頁面或重整頁面時不要把大量 CSS/JS 塞回 HTML。
- API 回傳格式通常是 `{"success": True/False,"data": ...}`。
- 前端登入狀態與 token 通常透過 `weblsget(WEBLSNAME+"token")` 與 `Authorization: Bearer ...`。
- 若要測前端，未登入時通常會導向 `signin.html`，完整資料流需要實際登入狀態。

## 近期重要上下文

- 計時器已拆成 `display.html` + `display.css` + `display.js`、`control.html` + `control.css` + `control.js`，共用常數與 loading helper 由 `initialize.js` 提供。只有 `display.html` 全裸（跳過站台導覽頁籤與返回上頁，由 `DISPLAYONLYPAGEED` 判斷）；`control.html` / `structure.html` / `structureedit.html` / `payoutedit.html` 會注入站台導覽頁籤（`#navigationbar`）與「返回上頁」，但所有計時器頁一律不注入站台 footer（footer 仍由 `TIMERPAGEED` 擋掉）。這幾頁已把 `initialize.js` 移到 `</body>` 前載入，導覽頁籤 / 返回上頁的注入才吃得到 DOM；這四頁也加進 `canshowautobackbutton` 黑名單，避免與各頁自帶的返回鈕重複。
- `display.html` 是目前唯一不做中譯的頁面，固定維持英文顯示文案；`initialize.js` 會針對 `display.html` 跳過 `applypagelanguage()`，避免 `translate.js` 自動改回中文。
- 計時器後端在 `backend/api/timer.py`，WebSocket 在 `backend/api/timerwebsocket.py`，routing 在 `backend/pokertrace/routing.py`。
- 個人檔案已支援非選手顯示「已聘用」清單。
- 場次列表已支援聘用人員看到相關場次但不計入自己的盈虧。
- 舊 `registrations.html` / `registrations.js` 已由 `register.html` / `register.js` 取代。
- 前端大量 `<button>` 已轉為 `<input type="button|submit|reset">`，寫新互動控制時先沿用這個方向。

## Monstrare 治理流程

本專案使用 Monstrare。共用流程見 `ai/process/workflow.md`。此節為流程層規範，**不覆蓋**上方的 coding style、備份規則與既有慣例。

### 操作規則

- 不得根據模糊的需求實作非小型（non-trivial）變更。
- 從情境探索（context discovery）與任務專屬的情境包（context pack）開始。
- 實作前使用 `ai/process/definition-of-ready.md`。
- 宣告完成前使用 `ai/process/definition-of-done.md`。
- UI 變更需要畫面規格與 mockup 決策紀錄（以 `ai/templates/screen-spec.md`、`ai/templates/mockup-decision.md` 為範本，產出到 `ai/artifacts/<Epic>/`），並先對照 `ai/context/design-system.md`：重用既有 design token 與元件，缺的元件照既有風格補做並登記回元件庫 inventory。
- 範本（`ai/templates/`）唯讀；所有填寫完成的產出物依 `ai/artifacts/README.md` 的慣例存放。
- 任何 mockup 或前端視覺實作，套用 `ai/skills/design-craft.md` 的設計工藝紀律，交付前對照 `ai/checklists/design-review-checklist.md`。
- 高風險變更需要架構、安全性與測試審查關卡（review gate）。
- 優先採用既有專案模式，而非新增抽象層。
- 將變更範圍限制在已核准的任務卡（task card）內。
- 不得在未告知的情況下變更不相關的檔案。
- 提供驗證證據：指令、輸出結果、UI 的螢幕截圖，以及已知的殘留風險。

### 必要流程

本專案已在進行中，**不需要**再跑 `project-kickoff` 全新專案拆解；除非要開一條全新的產品線，否則直接對單張任務套用下列流程：

1. 若 `ai/context/project-map.md` 存在，先閱讀它。
2. 若專案情境缺失或過時，執行 project-search 工作流程。
3. 對於新功能，建立或更新功能規格書。
4. 對於 UI 工作，產出多個 mockup 變體並等待人工選擇。
5. 產出 AI-ready 的任務卡。
6. 一次實作一張已核准的任務卡。
7. 執行驗證（含本檔「常用檢查指令」的 Tailwind／`node --check`／`py_compile`）。
8. 執行審查關卡。
9. 彙整證據並在需要時請求人工驗收。

### 審查準則

審查程式碼時，優先關注：

- 功能性錯誤與回歸問題。
- 安全性與隱私風險。
- 身分驗證（auth）、權限、密鑰（secret）、檔案、網路與金流邊界。
- 資料驗證與錯誤處理。
- 可維護性、重複程式碼與架構偏移（architectural drift）。
- 缺失的測試或薄弱的驗證。

發現的問題應盡可能包含檔案與行號參照。

### 看板

```powershell
npm run kanban
```

卡片存於 `tools/kanban/cards/`，Epic 定義於 `tools/kanban/epics.json`。
