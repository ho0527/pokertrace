# .github

## 用途

GitHub 相關設定、提示與專案輔助資料。

## 主要檔案

- `FUNDING.yml`：GitHub Sponsor 按鈕設定（目前先全註解，待金流就緒再填連結）。

## 子資料夾

- `appmod/`
- `prompts/`

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
