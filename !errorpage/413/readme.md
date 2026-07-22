# !errorpage/413

## 用途

自訂錯誤頁面子目錄，維護指定錯誤碼頁面或錯誤頁素材。

**本頁目前未被串接**：project00061 的 nginx server block 沒有 `error_page 413` 設定；且 `client_max_body_size 50G` 讓 413 幾乎不可能觸發。頁面留著備用，要啟用需自行調整 nginx 設定（nginx.conf 不在本專案內，屬使用者的伺服器設定）。

## 主要檔案

- `index.html`

## 子資料夾

- 無固定子資料夾。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
