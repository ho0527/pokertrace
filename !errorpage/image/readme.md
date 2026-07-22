# !errorpage/image

## 用途

自訂錯誤頁面子目錄，維護指定錯誤碼頁面或錯誤頁素材。

## 主要檔案

- `404-dark.svg`（`404/mod1.html`）
- `500-dark.svg`（`500/index.html`、`502/index.html`）
- `503-dark.svg`（`503/index.html`）
- `maintenence-dark.svg`（`423/index.html`；檔名 `maintenence` 是既有錯字，HTML 與檔名一致，要改必須兩邊一起改）

已於 2026-07-17 移除的檔案（備份保留為 `*-light_old_t1.svg`）：

- `404-light.svg`／`500-light.svg`／`503-light.svg`／`maintenence-light.svg`：共約 360KB，完全沒有頁面引用。`index.css` 沒有 `prefers-color-scheme`，錯誤頁固定深色，因此淺色版素材是死檔。若日後要補淺色模式，從備份或 git 歷史取回即可。

## 子資料夾

- 無固定子資料夾。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
