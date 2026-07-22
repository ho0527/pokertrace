# backend

## 用途

Django REST API、Channels WebSocket、資料庫 helper 與專案設定。

## 主要檔案

- `.gitignore`
- `check-service.ps1`：一鍵檢查 `PokerTrace` 服務、Redis、backend port 與 worker 狀態的 PowerShell 腳本
- `dbinitialize.py`
- `defulttoken.py`：重新產生所有預設(測試)使用者的 API token
- `defultuser.py`
- `install-service.cmd`：Windows NSSM 服務安裝腳本，會呼叫 `runserver.cmd`
- `localenv.cmd`：本機或部署機器私有設定，已被 `.gitignore` 忽略
- `localenv.cmd.example`：可提交的本機環境範例
- `localtoken.md`：本機測試用 token（機密、用完即刪，已被 `.gitignore` 忽略）
- `manage.py`
- `nssmrestart.cmd`：重啟 NSSM `PokerTrace` 服務的快捷腳本
- `pokertrace-firebase-adminsdk-fbsvc-bdb33658a6.json`
- `requirements.txt`
- `runserver.cmd`：正式啟動入口，會先跑 `dbinitialize.py` 再啟動 Uvicorn 多 worker
- `test.py`

## 子資料夾

- `!SQL/`：資料庫匯出封存（目前僅兩份 2026-05-13 的 pg_dump 二進位檔，已過時，見該目錄 readme）
- `api/`
- `backup/`：資料庫備份與還原腳本（`backup_db.py`／`backup_db.cmd`／`restore_db.py`），預設輸出到 `backup/dumps/`
- `function/`
- `pokertrace/`
- `upload/`

## 啟動方式

### 1. 本機啟動

在 `backend/` 目錄執行：

```powershell
runserver.cmd
```

`runserver.cmd` 會做這幾件事：

1. 載入 `localenv.cmd`（如果存在）
2. 執行 `dbinitialize.py`
3. 用 Uvicorn 在 `127.0.0.1:8061` 啟動 ASGI app
4. 將 server 輸出寫到 `backend/log/server.log`

預設值：

- `WORKERS=6`
- `DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,pokertrace.net,pokertrace.chrisho.ggff.net`
- `STRUCTURE_AI_PROVIDER=gemini`
- `STRUCTURE_AI_MODEL=gemini-2.5-flash`

### 2. 本機環境設定檔

第一次設定時，先複製：

```powershell
cd backend
copy localenv.cmd.example localenv.cmd
```

`localenv.cmd` 適合放這類不想直接寫死在 repo 的值：

- `STRUCTURE_AI_KEY`
- `WORKERS`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `FIREBASE_CREDENTIAL_PATH`

真實的 `localenv.cmd` 不要提交到版本控制。

## install-service.cmd

`install-service.cmd` 是給 Windows 主機把後端安裝成常駐服務用的。它透過 NSSM 建立 `PokerTrace` 服務，服務本體實際上仍然是呼叫既有的 `runserver.cmd`，所以：

- `localenv.cmd` 會照常載入
- `dbinitialize.py` 會照常執行
- Uvicorn 還是跑在 `127.0.0.1:8061`
- Django log / NSSM log 位置固定

### 安裝前要先準備

1. 先確認 Redis 已啟動在 `127.0.0.1:6379`
2. 先確認 Python 與套件都已安裝
3. 先確認 `backend/localenv.cmd` 已依機器設定完成
4. 先安裝 NSSM，並知道 `nssm.exe` 的實際路徑
5. 用系統管理員身分開啟 `cmd` 或 PowerShell

### 安裝前要調整的變數

打開 `install-service.cmd` 後，至少檢查這四個值：

- `NSSM`：`nssm.exe` 位置，預設是 `C:\nssm-2.24\win64\nssm.exe`
- `SVC`：Windows 服務名稱，預設是 `PokerTrace`
- `BACKEND`：本專案 `backend` 絕對路徑
- `PYDIR`：Python 安裝目錄
- `USERSITE`：目前使用的 user site-packages 路徑

### 安裝指令

```powershell
cd backend
install-service.cmd
```

安裝完成後可用：

```powershell
sc query PokerTrace
```

若 NSSM 有在 PATH，也可以用：

```powershell
nssm start PokerTrace
nssm stop PokerTrace
nssm restart PokerTrace
```

### 服務 log

主要 log 位置：

```text
backend/log/server.log
backend/log/nssm.out.log
backend/log/nssm.err.log
backend/log/error.log
```

用途大致上是：

- `server.log`：Uvicorn / Django 主輸出
- `nssm.out.log`：NSSM 接到的 stdout
- `nssm.err.log`：NSSM 接到的 stderr
- `error.log`：Django warning / request / security 類 log

### 一鍵檢查服務

如果要在重開機後快速確認 `PokerTrace`、Redis、backend port 與基本 worker 狀態，可直接在 PowerShell 執行：

```powershell
powershell -ExecutionPolicy Bypass -File backend\check-service.ps1
```

這支腳本目前會檢查：

- `PokerTrace` 服務是否為 `Running`
- `127.0.0.1:6379` Redis port 是否可連
- `127.0.0.1:8061` backend port 是否可連
- `backend/log/server.log` 是否存在，且最近 80 行內是否看得到啟動或請求 / WebSocket 活動
- `server.log` 內是否看得到 worker 啟動紀錄，並檢查數量是否接近預期值

最後會輸出 `RESULT: PASS` 或 `RESULT: FAIL`，方便部署後快速判斷。

### 重新安裝

`install-service.cmd` 內建會先 stop 舊服務、remove 舊服務，再重新 install，所以可重複執行來更新服務設定。

如果你改了 `localenv.cmd`，通常只要重新啟動服務就會套用；如果你改的是 `install-service.cmd` 內的 NSSM 參數，重新執行一次 `install-service.cmd` 會比較乾淨。

## defulttoken.py

`defulttoken.py` 用來重新產生所有預設(測試)使用者的 API token。

它會做這幾件事：

1. 找出 `playerid` 以 `0` 開頭且未刪除的預設使用者（由 `defultuser.py` 產生）
2. 刪除這些使用者在 `token` 資料表的所有舊 token（包含舊版固定的 `testtoken{playerid}`）
3. 為每位使用者重新產生一組新的隨機 token，格式與登入相同（35 碼英數亂碼）
4. 把「playerid / name / type / token」清單寫入 `backend/localtoken.md`（已被 `.gitignore` 忽略），並在終端機列出統計與所有使用者的 token 列表

### 使用方式

先確認環境變數 `PT_DB_PASSWORD` 已設定（或先執行 `localenv.cmd`），再執行：

```powershell
cd backend
python defulttoken.py
```

若還沒有預設使用者，先執行 `python defultuser.py` 再執行本程式。

### 注意事項

- 可重複執行；每次執行都會把預設使用者的 token **全部換新**，舊 token 立即失效，測試腳本或文件裡引用的 token 要改用 `localtoken.md` 的新值。
- `localtoken.md` 內容是機密，用完即刪，不要提交到版本控制（`.gitignore` 已忽略）。
- 只影響 `playerid` 以 `0` 開頭的預設使用者，不會動到正式使用者的 token。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- `defultuser.py` 用來產生測試使用者，`playerid` 以 `01/03/05/07` 開頭分別代表 player/dealer/floor/assistant；使用者本身可重複執行更新，但不再建立 API token。
- 測試用 API token 改由 `defulttoken.py` 產生（見下方「defulttoken.py」章節）；舊版固定 `testtoken{playerid}` 已停用，重跑一次 `defulttoken.py` 就會被刪除換新。
- WebSocket 由 `pokertrace/routing.py` 提供 `ws/timer/{sessionid}` 與 `ws/hand/{sessionid}`，目前正式啟動走 `runserver.cmd` 的 Uvicorn/Redis 設定。
- `localenv.cmd.example` 是給之後維護者複製成 `localenv.cmd` 的起點；真實機密請只放在 `localenv.cmd`。
- `install-service.cmd` 需用系統管理員身分執行，並在執行前確認 `NSSM`、`BACKEND`、`PYDIR`、`USERSITE` 四個路徑符合部署機器。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
