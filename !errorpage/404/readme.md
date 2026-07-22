# !errorpage/404

## 用途

自訂錯誤頁面子目錄，維護指定錯誤碼頁面或錯誤頁素材。

## 主要檔案

- `mod1.html`：現役的 404 頁面，nginx 的 `error_page 404` 指向這一份。

已於 2026-07-17 移除的檔案（備份保留為 `mod2_old_t1.*`）：

- `mod2.html`／`mod2.css`／`mod2.js`：未串接的舊版特效版本。移除原因為 `mod2.css` 從 `raw.githubusercontent.com` 抓背景圖（會把訪客 IP 洩漏給第三方、離線也會破圖），連結指向本專案不存在的 `/website/anther/respond`，且缺 viewport／`lang`／「回上一頁」／`/frontend/contact.html`，不符本目錄規定。

## 子資料夾

- 無固定子資料夾。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
