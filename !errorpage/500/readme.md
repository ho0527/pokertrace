# !errorpage/500

## 用途

自訂錯誤頁面子目錄，維護指定錯誤碼頁面或錯誤頁素材。

## 主要檔案

- `index.html`：現役的 500 頁面，只引用 `/!errorpage/index.css` 與 `/!errorpage/errorpage.js`。
- `custom.js` / `style.css`：2024-02 的舊版 Alpine/Tailwind 版型殘留檔，改版後 `index.html` 已完全沒有引用，保留供參考（與根目錄 `!errorpage/readme.md` 對同名檔案的處理一致）。建議確認不再需要後移除。

## 子資料夾

- 無固定子資料夾。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
