@echo off
REM ===================================================================
REM startserver.cmd - 啟動專案的標準腳本
REM   1. 先跑 dbinitialize.py 確保 schema / 字典預設資料就緒
REM   2. 再跑 manage.py runserver 啟動 Django
REM ===================================================================

set DJANGO_ASPROX_MAX_REQUESTS=0

echo [startserver] 執行 dbinitialize.py ...
python dbinitialize.py
if errorlevel 1 (
	echo [startserver] dbinitialize.py 失敗, 中止啟動
	exit /b 1
)

echo [startserver] 啟動 Django ...
python manage.py runserver 8061
