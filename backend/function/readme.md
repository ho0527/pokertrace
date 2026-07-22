# backend/function

## 用途

後端共用 helper，包含 SQL 查詢、驗證與通用函式。

## 主要檔案

- `function.py`
- `sql.py`：原生 SQL helper（PostgreSQL 為主，仍保留 MySQL 分支）。主要提供 `query()` 單句查詢與 `querytransaction()` 多句交易。
- `thing.py`
- `validation.py`
- `validationtest.py`

## `querytransaction()`：多列寫入一律用它

```python
from function.sql import querytransaction

result=querytransaction(SETTING["dbname"],[
	["""INSERT INTO "hand"("sessionid","tableid")VALUES(%s,%s)""",[sessionid,tableid]],
	["""UPDATE "table" SET "handcount"="handcount"+1 WHERE "id"=%s""",[tableid]]
],SETTING["dbsetting"])
if result is None:
	return errorresponse("ERROR_database")
```

- 參數：`sqllist` 是 `[[sql,data], ...]`，`data` 可為 `None`。
- 在**單一連線、單一交易**內依序執行；全部成功才 `commit`，任一失敗整批 `rollback`。
- 回傳：全部成功回各語句結果的 list（`SELECT`／`WITH` 回 fetchall、`INSERT` 回最新 id、其他回 rowcount）；**任一失敗回 `None`**，所以呼叫端要判 `None`。
- **只要是多列／多語句的寫入就用這個**，不要連續呼叫多次 `query()`：那樣每句各自 autocommit，中途失敗會留下寫一半的資料。
- 目前已在 `api/hand.py`、`api/table.py`、`api/session.py`、`api/batch.py`、`api/timer.py`、`api/user.py` 使用（例：`user.py` 的 `deleteuser` 用它把「軟刪除使用者」與「撤銷其所有 token」包在同一交易，避免只做一半）。

## 子資料夾

- 無固定子資料夾。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
