# 資料庫備份與還原（檢查表 2.3）

PostgreSQL（`pokertrace`）的自動備份、保留與還原演練工具。

## 檔案
- `backup_db.py`：用 `pg_dump -Fc` 產生帶時間戳的備份，並自動清除超過保留天數的舊檔。
- `restore_db.py`：用 `pg_restore` 把備份還原到「演練庫」或指定庫，附還原後驗證。
- `backup_db.cmd`：Windows 工作排程器用的包裝檔。
- `dumps/`：備份輸出目錄（執行後自動建立）。

## 前置需求
- 已安裝 PostgreSQL 用戶端工具（`pg_dump` / `pg_restore` / `psql`）。
- 若這些工具不在 PATH，設定 `PT_PG_BIN` 指向其 bin 目錄，例如：
  `C:\Program Files\PostgreSQL\16\bin`

## 連線設定（環境變數優先，建議正式機只用環境變數）
| 變數 | 預設 | 說明 |
|---|---|---|
| `PT_DB_HOST` | localhost | 資料庫主機 |
| `PT_DB_PORT` | 5432 | 連接埠 |
| `PT_DB_NAME` | pokertrace | 來源資料庫 |
| `PT_DB_USER` | chris0527 | 帳號 |
| `PT_DB_PASSWORD` | （無預設，**必填**） | 密碼。程式碼內已無預設值，不設定會直接認證失敗；排程執行時由 `backup_db.cmd` 載入 `backend/localenv.cmd` 取得 |
| `PT_BACKUP_DIR` | `./dumps` | 備份輸出目錄 |
| `PT_BACKUP_KEEP_DAYS` | 14 | 保留天數，超過自動刪除 |
| `PT_RESTORE_DB` | pokertrace_restoretest | 還原演練的目標庫 |
| `PT_PG_BIN` | （空） | PostgreSQL bin 目錄 |

## 2.3.1 每日備份與保留
手動測試：
```
python backup_db.py
```
排程（Windows 工作排程器）：
1. 建立基本工作 → 觸發程序「每天」（例如凌晨 3:00）。
2. 動作「啟動程式」→ 選 `backup_db.cmd`。
3. 「開始位置」填本資料夾路徑。

排程（Linux cron，每日 03:00）：
```
0 3 * * * cd /path/to/backend/backup && PT_DB_PASSWORD=*** python3 backup_db.py >> backup.log 2>&1
```

## 2.3.2 / 2.3.3 還原演練與驗證
```
# 查看有哪些備份
python restore_db.py --list

# 把最新備份還原到演練庫（不碰正式資料），完成後會印出資料表數量做驗證
python restore_db.py --latest

# （危險）還原到正式庫，需明確確認
python restore_db.py --latest --target pokertrace --yes
```
還原完成後腳本會印出目標庫 `public` schema 的資料表數量，作為「實際還原一次並驗證」的最小證據。建議定期（例如每月）做一次演練還原。
