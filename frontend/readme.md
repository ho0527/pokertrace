# frontend

## 用途

前端靜態 HTML/CSS/JS，負責登入、個人檔案、場次、牌桌、手牌、計時器控制端與顯示端。

## 主要檔案

- `benefit.html`
- `benefit.js`
- `benefit12.js`
- `cloudsync.js`
- `clublist.html`
- `clublist.js`
- `control.css`
- `control.html`
- `control.js`
- `display-synced copy.html`
- `display-synced.html`
- `display.css`

## 子資料夾

- `htmlblock/`

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
