# AGENTS.md

這份文件是給 Codex / AI agent 看的專案操作指南。進入此專案後，先讀這份，再依照任務需要讀 `backend/AGENTS.md` 或 `frontend/AGENTS.md`。

## 「所有 / 全部 / 全站 / 每一個」的定義（重要，不可誤解）

當使用者說「所有」「全部」「全站」「每一頁」「每個」「逐一」時，指的是**字面意義的每一個有效檔案／頁面／端點／工具**，而**不是抽樣、代表性樣本或「先做一部分」**。

唯一可排除的，只有以下兩類「非有效目標」：

1. **系統 / 自動產生檔**：`log/`、`*.log`、`__pycache__/`、`*.pyc`、`db.sqlite3`、其他建置或執行期自動產物。
2. **暫存 / 備份檔**：`*_old_t*.*`（本專案備份命名）、`* copy.*` / `*copy*`（如 `backend/api/timer copy.py`）、其他明顯為暫存或草稿的檔案。

除此之外的每一個都要納入。具體要求：

- 做「全站檢查表」「測試每一頁」「列出所有端點」「涵蓋所有工具」這類任務時，**先用 `ls` / Glob 把實際清單列出來**（例如 `frontend/tool/` 下的每個 `*.html`、`backend/api/url.py` 的每條路由），再**逐一**處理，數量多也要全部做完。
- **嚴禁**用「依此類推」「其餘比照」「列出代表頁」來取代逐一列出。真的同質的項目也要把每個名稱各自列出來，可共用說明但不可省略項目。
- 若因量大需分批，分批是執行手段，**不是只做一批就交差**；沒做完就要說清楚還剩哪些，不可給人「已涵蓋全部」的錯覺。
- 不確定範圍邊界時，先確認，不要自行縮小範圍。

## 專案概況

這是 PokerTrace 類型的撲克場次管理系統，主要功能包含：

- 玩家帳號、登入、個人檔案與盈虧統計。
- 場次建立、編輯、複製、刪除、列表與報名。
- 主辦者聘用人員，角色包含發牌員、裁判、助理。
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

- `player`：玩家 / 擁有者 / 主辦者。
- `dealer`：發牌員。
- `floor`：裁判。
- `assistant`：助理。

聘用資料：

- `userstaff`：玩家全域聘用某位人員。
- `sessionstaff`：單一場次聘用某位人員。

場次權限目前慣例：

- 擁有者可完整操作自己的場次。
- 已聘用人員可看到相關場次，也可編輯。
- 已聘用人員不應計入自己的盈虧統計。
- 已聘用人員不可刪除或複製場次。
- 裁判與助理可操作計時器；發牌員不可操作計時器。
- 管理員通常以 `permission>=4` 判斷。

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
- 個人檔案已支援非玩家顯示「已聘用」清單。
- 場次列表已支援聘用人員看到相關場次但不計入自己的盈虧。
- 舊 `registrations.html` / `registrations.js` 已由 `register.html` / `register.js` 取代。
- 前端大量 `<button>` 已轉為 `<input type="button|submit|reset">`，寫新互動控制時先沿用這個方向。
