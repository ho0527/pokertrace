# Agent Notes: backend/api

## 範圍

後端 API 模組，包含使用者、場次、聘用人員、牌桌、座位、手牌、計時器與協會等端點。

## 工作規則

- 先讀根目錄 `AGENTS.md`，本檔只補充此資料夾的維護重點。
- 修改既有檔案前先備份成 `{檔名}_old_t{流水號}.{副檔名}`。
- 不移除使用者或其他 agent 已做的修改；遇到既有變更要先理解再接續。
- 新增或調整功能時，同步更新相關 README，讓下一次維護能快速接手。

## 檢查建議

修改 API 後執行 `python -m py_compile backend\api\相關檔案.py`，並確認 token、permission、staff 權限路徑。

## 目錄提示

- README 說明使用者或維護者應知道的用途。
- AGENTS 說明 AI agent 在此目錄工作時要注意的規則。
