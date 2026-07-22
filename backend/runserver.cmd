@echo off
rem === PokerTrace backend - Option A: uvicorn multi-worker ===
rem Requires: Redis running on 127.0.0.1:6379, and: pip install channels_redis uvicorn
rem WORKERS default 6 (this machine has 12 cores).
rem Sweet spot ~ physical cores (12). Useful up to core count; beyond that no speedup for CPU work.
rem Hard ceiling: WORKERS x 8 (pool max per worker) must stay under Postgres max_connections (default 100).

cd /d "%~dp0"
rem 讓所有 Python 子行程(dbinitialize / uvicorn)以 UTF-8 輸出, 避免中文 print 在 cp1252 主控台炸 UnicodeEncodeError
set PYTHONUTF8=1
set DJANGO_ASPROX_MAX_REQUESTS=0
set DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,pokertrace.net,pokertrace.chrisho.ggff.net
set WORKERS=6

rem === 結構解析 AI（選用）===
rem 預設供應商與模型（非機密，可留在版控）。
set STRUCTURE_AI_PROVIDER=gemini
set STRUCTURE_AI_MODEL=gemini-2.5-flash
rem 機密金鑰放在 localenv.cmd（已被 .gitignore 忽略，不會 commit）。
rem 第一次設定：複製 localenv.cmd.example 成 localenv.cmd，填入你的 Gemini key。
rem 留空也沒關係：沒有金鑰時「貼上解析」只走免費的規則解析，不會呼叫 AI。
if exist "%~dp0localenv.cmd" call "%~dp0localenv.cmd"

echo [runserver] running dbinitialize.py ...
python dbinitialize.py
if errorlevel 1 goto :dbfail

echo [runserver] starting uvicorn (%WORKERS% workers) on 127.0.0.1:8061 ...
echo [runserver] server output -^> "%~dp0log\server.log"  (this window will stay quiet; tail the log to watch)
python -m uvicorn pokertrace.asgi:application --host 127.0.0.1 --port 8061 --workers %WORKERS%  > "%~dp0log\server.log" 2>&1
goto :eof

:dbfail
echo [runserver] dbinitialize.py failed, abort
exit /b 1
