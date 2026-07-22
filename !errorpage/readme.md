# !errorpage

## 用途

自訂錯誤頁面入口，包含共用 CSS/JS、錯誤碼頁面與插圖素材。

## 主要檔案

- `index.css`：全部錯誤頁共用的卡片式深色版型（2026-07-11 改版）。
- `errorpage.js`：共用的「回上一頁」按鈕行為（`data-error-back`，無上一頁時導回 `/frontend/`）。
- `custom.js` / `style.css`：舊版 Alpine/Tailwind 版型殘留檔，改版後已無頁面引用，保留供參考。

## 子資料夾

- `400/`
- `403/`
- `404/`（實際顯示的是 `mod1.html`；未串接的舊版特效版本 `mod2.*` 已於 2026-07-17 移除，備份為 `mod2_old_t1.*`）
- `405/`
- `410/`（**未串接**：`error_page 410` 只在 root htdocs 的 :80 server，project00061 的 server block 沒有）
- `413/`（**未串接**：project00061 未設定 413 的 error_page，且 `client_max_body_size 50G` 讓 413 幾乎不可能觸發）
- `414/`
- `423/`（工具頁長期鎖定頁：nginx 對未開放的 tool 頁 `return 423`，文案為「此頁面尚未開放」而非暫時性維護）
- `500/`
- `502/`
- `503/`
- `image/`

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 每個錯誤頁都要有「回上一頁」按鈕（`data-error-back` + `errorpage.js`）與「聯絡我們」連結（指向 `/frontend/contact.html`，公開表單頁；`/frontend/contactadmin.html` 是後台管理頁，不要用在這裡）。
- 「回上一頁」統一寫成 `<input type="button" class="btn btn-outline" value="回上一頁" data-error-back>`（依根目錄 `AGENTS.md` 全站按鈕以 `<input type="button">` 為主）。
- 錯誤頁**不要**加 `<link rel="manifest">`：`manifest.json` 只在 `frontend/` 下（scope 也是 `./`，涵蓋不到 `/!errorpage/`），以相對路徑寫在錯誤頁會解析成 `/!errorpage/{code}/manifest.json`，等於每個錯誤頁自己再打一個 404。2026-07-17 已從 11 頁全部移除。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
