# backend

## 用途

Django REST API、Channels WebSocket、資料庫 helper 與專案設定。

## 主要檔案

- `.gitignore`
- `db.sqlite3`
- `dbinitialize.py`
- `defultuser.py`
- `manage.py`
- `pokertrace-firebase-adminsdk-fbsvc-bdb33658a6.json`
- `runserver.cmd`
- `startserver.cmd`
- `test.py`

## 子資料夾

- `!SQL/`
- `api/`
- `function/`
- `project00058/`
- `upload/`

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- `defultuser.py` 用來產生測試使用者，`playerid` 以 `01/03/05/07` 開頭分別代表 player/dealer/floor/assistant，並會建立固定 `testtoken{playerid}` 方便 API 測試。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
