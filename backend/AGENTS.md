# Agent Notes: backend

## 範圍

Django REST API、Channels WebSocket、資料庫 helper 與專案設定。

## 工作規則

- 先讀根目錄 `AGENTS.md`，本檔只補充此資料夾的維護重點。
- 修改既有檔案前先備份成 `{檔名}_old_t{流水號}.{副檔名}`。
- 不移除使用者或其他 agent 已做的修改；遇到既有變更要先理解再接續。
- 新增或調整功能時，同步更新相關 README，讓下一次維護能快速接手。

## 檢查建議

修改 Python 後執行 `python -m py_compile backend\api\相關檔案.py`；routing 或 settings 變更時也檢查 `backend\pokertrace`。

## 目錄提示

- README 說明使用者或維護者應知道的用途。
- AGENTS 說明 AI agent 在此目錄工作時要注意的規則。
