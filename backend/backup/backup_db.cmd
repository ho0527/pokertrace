@echo off
REM PokerTrace 資料庫每日備份（給 Windows 工作排程器呼叫）
REM 用法：在「工作排程器」建立每日任務，動作指向這支 .cmd
REM 可在此設定連線與保留天數（正式機建議改用系統環境變數而非寫死）

REM set PT_DB_HOST=localhost
REM set PT_DB_PORT=5432
REM set PT_DB_NAME=pokertrace
REM set PT_DB_USER=chris0527
REM set PT_DB_PASSWORD=改用環境變數
REM set PT_BACKUP_KEEP_DAYS=14
REM 若 pg_dump 不在 PATH，指定 PostgreSQL bin 目錄：
REM set PT_PG_BIN=C:\Program Files\PostgreSQL\16\bin

cd /d "%~dp0"
REM 載入 backend/localenv.cmd（PT_DB_PASSWORD 等機密放這裡，排程執行才拿得到）
if exist "%~dp0..\localenv.cmd" call "%~dp0..\localenv.cmd"
python backup_db.py
exit /b %errorlevel%
