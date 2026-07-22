@echo off
rem ============================================================
rem  Install PokerTrace backend as a Windows service via NSSM
rem  >>> RUN THIS AS ADMINISTRATOR <<<
rem  (right-click -> Run as administrator, or run from an
rem   elevated cmd / PowerShell)
rem ============================================================
setlocal
set "NSSM=C:\nssm-2.24\win64\nssm.exe"
set "SVC=PokerTrace"
rem 正式機（production）：DB=pokertrace、後端 8061、nginx 3061、網域 pokertrace.net
set "BACKEND=C:\nginx\web\pokertrace\backend"
set "PYDIR=C:\Users\chris\AppData\Local\Programs\Python\Python312"
set "USERSITE=C:\Users\chris\AppData\Roaming\Python\Python312\site-packages"

if not exist "%NSSM%" (
  echo [error] nssm.exe not found at "%NSSM%"
  goto :end
)

rem --- remove any previous install so this script is re-runnable ---
"%NSSM%" stop   %SVC%        >nul 2>&1
"%NSSM%" remove %SVC% confirm >nul 2>&1

rem --- install: drive the existing runserver.cmd through cmd.exe so all the
rem     env setup, localenv.cmd and dbinitialize.py still run exactly as before ---
"%NSSM%" install %SVC% "%SystemRoot%\System32\cmd.exe"
"%NSSM%" set %SVC% AppParameters "/c %BACKEND%\runserver.cmd"
"%NSSM%" set %SVC% AppDirectory  "%BACKEND%"
"%NSSM%" set %SVC% DisplayName   "PokerTrace Backend (uvicorn 8061)"
"%NSSM%" set %SVC% Description    "PokerTrace Django/uvicorn backend on 127.0.0.1:8061"
"%NSSM%" set %SVC% Start          SERVICE_AUTO_START

rem --- restart on crash (3s delay); throttle so an instant-fail loop backs off ---
"%NSSM%" set %SVC% AppExit Default Restart
"%NSSM%" set %SVC% AppRestartDelay 3000
"%NSSM%" set %SVC% AppThrottle     5000

rem --- capture NSSM-level output; uvicorn itself still writes log\server.log ---
"%NSSM%" set %SVC% AppStdout      "%BACKEND%\log\nssm.out.log"
"%NSSM%" set %SVC% AppStderr      "%BACKEND%\log\nssm.err.log"
"%NSSM%" set %SVC% AppRotateFiles 1
"%NSSM%" set %SVC% AppRotateBytes 10485760

rem --- runs as LocalSystem (NSSM default, no password needed). SYSTEM has
rem     FullControl over the per-user Python, so we just put it on PATH so
rem     runserver.cmd's "python" resolves.
rem     PYTHONUTF8 = let Python print Chinese to the redirected log (no cp1252 crash).
rem     PYTHONPATH = expose the per-user (pip install --user) packages like
rem                  firebase_admin, which LocalSystem otherwise cannot see. ---
"%NSSM%" set %SVC% AppEnvironmentExtra "PATH=%PYDIR%;%PYDIR%\Scripts;%SystemRoot%\System32;%SystemRoot%" "PYTHONUTF8=1" "PYTHONIOENCODING=utf-8" "PYTHONPATH=%USERSITE%"

echo.
echo [done] Service "%SVC%" installed (runs as LocalSystem, no password).
echo   Start it:   "%NSSM%" start %SVC%
echo   Status:     sc query %SVC%
echo   Live log:   %BACKEND%\log\server.log

:end
endlocal
