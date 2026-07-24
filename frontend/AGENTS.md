# Agent Notes: frontend

這份文件補充前端工作注意事項。根目錄 `AGENTS.md` 的規則仍然適用。

## 架構

前端是靜態 HTML/CSS/JS，常見模式是：

- `xxx.html`：頁面結構與 script/link 引入。
- `xxx.js`：頁面資料流與事件。
- `xxx.css`：頁面樣式。新功能請盡量維持 CSS/JS 分離。

共用檔：

- `initialize.js`：語言、共用狀態、環境設定等。
- `translate.js`：翻譯資料；`display.html` 仍會載入此檔滿足共用初始化相依，但不套用自動中譯。
- `main.js` / `main.html`：共用外框或主要入口。
- `newedithand.js`：手牌與牌局相關。
- `register.html` / `register.js`：報名工作台；舊 `registrations.html` / `registrations.js` 已不存在。
- `gto.js`：GTO 求解器邏輯與範圍資料。頁面入口是 `tool/range.html`（帶 `<base href="../">`，所以直接寫 `href="gto.js"` 載入本目錄頂層的檔案）。沒有 `gto.html`、也沒有 `flopsolver.*`，不要去找或新建。
- `tool/`：工具頁集合，例如 equity、ICM、pot odds、stack calculator、win probability、timebank drill。
- `initialize.js` 也負責計時器頁共用常數與 loading helper。`display.html` 是唯一維持全裸的頁面（跳過站台導覽頁籤與返回上頁，由 `DISPLAYONLYPAGEED` 判斷）；`control.html` / `structure.html` / `structureedit.html` / `payoutedit.html` 會注入站台導覽頁籤（`#navigationbar`）與「返回上頁」，但所有計時器頁一律不注入站台 footer（由 `TIMERPAGEED` 擋掉）。這幾頁已把 `initialize.js` 改到 `</body>` 前載入（在各自頁面 script 之前），導覽頁籤 / 返回上頁的注入才吃得到 DOM，並在 body 最上方加了空的 `<div id="navigationbar">` 當注入點。

常見頁面：

- `profile.html` / `profile.js`：個人檔案、盈虧報表、聘用人員。
- `sessionlist.html` / `sessionlist.js`：場次列表。
- `session.html` / `session.js`：場次詳情。
- `newsession.html` / `newsession.js`：新增場次。
- `control.html` / `control.js` / `control.css`：計時器控制端。
- `display.html` / `display.js` / `display.css`：計時器顯示端。

## Tailwind 是建置產物（改 class 後一定要重跑）

`frontend/tailwind.css` 不是 CDN、也不是手寫檔，是**建置產物**：根目錄 `tailwind.config.js` 掃描 `frontend/**/*.html` 與 `frontend/**/*.js` 產生。

- 只要**新增或修改 HTML / JS 裡的 Tailwind class**（包含 JS 字串、template literal 裡動態組出來的 class），就必須重跑：

```powershell
npm run build:css     # 產生 frontend/tailwind.css（約 100 秒）
npm run verify:css    # 驗證沒有靜默漏產出
```

- **沒重跑 = 新 class 完全沒有樣式，而且不會有任何錯誤訊息**（Tailwind 掃不到 class 只是安靜地不產出）。這是本專案最容易踩、又最難察覺的坑，`verify:css` 就是為此存在。
- `frontend/tailwind.css` **必須進版控**：部署是 nginx 直接吃磁碟檔，沒有建置步驟，產物沒 commit 等於線上沒樣式。
- 頁面一律寫 `<link rel="stylesheet" href="tailwind.css">`；因為 `<base href="../">`，`tool/` 底下與頂層頁面寫法相同。
- 不要再寫 `<script src="https://cdn.tailwindcss.com"></script>`（2026-07 已淘汰）。

細節見 `frontend/readme.md` 的「新增小工具流程」與根目錄 `tailwind.config.js` 的註解。

## 前端 API 慣例

常見 AJAX：

```javascript
ajax("GET",AJAXURL+"getsessionlist",function(event,data){
	if(data["success"]){
		let row=data["data"]
	}else{
		alert("error")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])
```

常見 DOM helper：

- `innerhtml(selector,html,false)`
- `innertext(selector,text,false)`
- `value(selector,text)`
- `getvalue(id)`
- `onclick(selector,function(element,event){})`
- `dataset(element,"id")`
- `href("page.html")`

## 權限顯示慣例

前端按鈕顯示不能取代後端權限檢查。

場次列表目前慣例：

- `row["isown"]==true`：可顯示刪除、複製、計時器。
- `row["isstaff"]==true`：顯示已聘用，不顯示個人買入與盈虧。
- `row["accessrole"]=="floor"` 或 `"assistant"`：可顯示計時器。
- 聘用人員仍可顯示編輯。

## 計時器頁面

- `control.js` 負責控制、儲存、WebSocket 發送。
- `display.js` 負責顯示、接收 WebSocket 更新。
- `initialize.js` 提供計時器頁共用常數、翻譯環境與 loading helper。
- `display.html` 是目前唯一不做中譯的前端頁面，固定維持英文顯示文案；不要把它加入頁面自動翻譯。
- `control.html` / `display.html` 不要再塞大型 inline script。
- 全站按鈕目前以 `<input type="button|submit|reset">` 為主；若需要子元素，使用 `role="button"`、`tabindex="0"` 與 Enter / Space 鍵盤事件。

## 檢查指令

```powershell
node --check frontend\profile.js
node --check frontend\sessionlist.js
node --check frontend\control.js
node --check frontend\display.js
```

若有大幅改畫面，使用本機瀏覽器打開：

```text
http://localhost/website/externalcase/project00061/frontend/{page}.html
```

沒有登入狀態時，多數頁面會導向 `signin.html`。

---

## 範圍

前端靜態 HTML/CSS/JS，負責登入、個人檔案、場次、牌桌、手牌、計時器控制端與顯示端。

## 工作規則

- 先讀根目錄 `AGENTS.md`，本檔只補充此資料夾的維護重點。
- 修改既有檔案前先備份成 `{檔名}_old_t{流水號}.{副檔名}`。
- 不移除使用者或其他 agent 已做的修改；遇到既有變更要先理解再接續。
- 新增或調整功能時，同步更新相關 README，讓下一次維護能快速接手。
- 改 HTML 時，`input`、`select`、`textarea` 的屬性順序要固定；互動按鈕優先用 `<input type="button|submit|reset">`。
- 屬性順序原則：先元素必要屬性，再 `class`，再 `data-*`，再 `id` / `name`，最後才是 `min`、`max`、`value`、`placeholder` 這些非必填帶值屬性，以及 `required`、`readonly`、`disabled` 這類不帶值屬性。
- `input` 慣例可參考：`<input type="number" class="..." id="reentrycount" min="0" inputmode="numeric" value="0">`。
- **`type="number"` 一律要同時加 `inputmode`**：iOS Safari 只看 `type="number"` 不會跳數字鍵盤，還是跳一般文字鍵盤（Android Chrome 才會跳）。整數欄位用 `inputmode="numeric"`，允許小數的欄位（`step` 帶小數或 `step="any"`）用 `inputmode="decimal"`，否則 iOS 鍵盤上沒有小數點可打。`inputmode` 放在 `min` / `max` / `step` 之後、`value` / `placeholder` 之前。

## 檢查建議

修改 JS 後優先執行 `node --check frontend\檔名.js`。計時器相關常用 `control.js`、`display.js`、`initialize.js` 一起檢查。

## 目錄提示

- README 說明使用者或維護者應知道的用途。
- AGENTS 說明 AI agent 在此目錄工作時要注意的規則。
