# backend/api

## 用途

後端 API 模組，包含使用者、場次、聘用人員、牌桌、座位、手牌、計時器與協會等端點。

## 主要檔案

- `admin.py`
- `club.py`
- `head.py`
- `initialize.py`
- `seating.py`
- `session.py`
- `sessionplayer.py`
- `staff.py`
- `table.py`
- `timer.py`
- `timerwebsocket.py`
- `type.py`

## 子資料夾

- 無固定子資料夾。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
