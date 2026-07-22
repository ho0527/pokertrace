# PokerTrace History

這份文件記錄 PokerTrace 專案的重要歷程、文件修正與維護備註，供後續維護者快速理解目前專案狀態。

## 2026-06-18 文件修正

- 已移除先前誤放在本檔的錯誤內容。舊版 `history.md` 是一份偏向稽核報表的整理稿，且內容中包含「本檔是購物平台內容」這類明顯不符合目前專案的描述，容易誤導後續維護。
- 本檔改回專案歷程用途，聚焦記錄 PokerTrace 自身的重要變更與維護提醒。
- 原始錯誤版本當時未另存備份檔，舊內容需要追查時請查 git 歷史（本檔在 2026-06-18 之前的 commit）。

## 專案功能里程碑

- 已完成玩家帳號、登入、個人檔案與基本盈虧統計。
- 已完成場次建立、編輯、複製、刪除、列表與報名流程。
- 已完成主辦者聘用工作人員，角色包含 `dealer`、`floor`、`assistant`。
- 已完成牌桌、座位、部分手牌紀錄與牌局相關資料流。
- 已完成計時器控制端 `control.html`、顯示端 `display.html`、REST API 與 WebSocket 同步。
- 已完成前端多頁面拆分，計時器樣式與邏輯已從 HTML 內聯腳本拆到獨立 CSS/JS。
- 已確認 `frontend/display.html` 作為大螢幕計時器顯示端固定維持英文，不做中譯，並由 `initialize.js` 跳過頁面自動翻譯。

## 目前已知的維護重點

- 前端以靜態 HTML、CSS、JS 為主，後端為 Django API 與 Channels WebSocket。
- 資料庫主要流程依賴 PostgreSQL（`function/sql.py` 原生 SQL，不走 Django ORM）。`backend/db.sqlite3` 檔案已於 2026-07-16 刪除，但 **`backend/pokertrace/settings.py` 的 `DATABASES` 仍寫著 sqlite3 引擎**（指向已不存在的 `BASE_DIR/'db.sqlite3'`）。因為沒有任何流程走 ORM，目前無實害；若未來要用 ORM，要先把 `DATABASES` 改指 PostgreSQL，否則會生出一個空的 sqlite 檔。
- 權限矩陣以 `player`、`dealer`、`floor`、`assistant`、管理員為主，涉及場次、計時器、報名與手牌時要一起檢查前後端。
- 計時器相關檔案以 `frontend/control.*`、`frontend/display.*`、`backend/api/timer.py`、`backend/api/timerwebsocket.py` 為核心；共用常數與 loading helper 由 `frontend/initialize.js` 提供（`frontend/timerconfig.js` 已刪除）。
- 顯示端 `frontend/display.html` 是英文-only 例外頁，文件、測試與翻譯缺漏檢查都要排除中譯要求。

## 使用者需要自行設定的地方

實際部署或在新環境啟動時，至少要確認這些項目：

1. PostgreSQL 連線設定
2. Firebase Admin SDK 憑證檔位置
3. Django `SECRET_KEY`、`DEBUG`、`ALLOWED_HOSTS`
4. SMTP 帳號密碼
5. 前端 API 代理路徑與正式站網址

詳細設定方式與檔案位置已整理到根目錄 `readme.md` 的「需要自行設定的項目」段落。

## 維護備註

- 若之後要記錄重要修正，請直接在本檔依日期往下追加。
- 若是風險盤點、稽核報表、待辦清單，請另開像 `report.md`、`audit.md`、`todo.md` 這類用途明確的文件，不要再混回 `history.md`。
- 若變更牽涉部署、環境值或外部服務設定，請同步更新根目錄 `readme.md`。
