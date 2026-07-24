# PokerTrace

PokerTrace 是一套撲克場次管理系統，目標是讓玩家、主辦者與現場工作人員可以用同一個平台完成賽事建立、報名、排桌、座位、手牌紀錄、手牌現場轉播、計時器控制與盈虧統計。

本專案目前採用靜態前端加 Django API 架構，前端放在 `frontend/`，後端放在 `backend/`，資料庫結構與匯出資料放在 `!SQL/` 與 `backend/!SQL/`。

## 專案特色

- 玩家帳號註冊、登入、登出、個人檔案與語言設定。
- 玩家可建立、編輯、複製、刪除自己的場次。
- 場次支援買入、重購、重新進場、Addon、獎金、票券、Final Table、ITM 與多日賽關聯。
- 支援系列賽（Series）：把多個場次歸成一包做跨場次彙總（總盈虧、總買入、總獎金），並提供以盈虧／名次／積分排序的玩家排行榜；可從場次詳情頁直接加入系列賽。非私人系列賽可被其他使用者檢視（顯示「分享」標記），盈虧以檢視者本人計算。
- 支援批量建立多日賽（batchcreate.html）：五步驟精靈一次建好整棵晉級樹（如 8→2→1）的所有場次，自動以多日賽關聯串接並包成系列賽；支援盲注結構文字／JSON／AI 解析與設定 JSON 存取。
- 支援現場轉播：公開的統一手牌紀錄場次可開放場外唯讀觀看（broadcast.html，免登入），支援延遲播出、底牌遮罩與 H4H 逐手放行控制台（broadcastcontrol.html）。
- 支援快速手牌紀錄（quickhand.html，獨立手牌、自由設定座位盲注）與手牌詳情的動畫回放（handreplay.js，含速度、牌背樣式、BB 單位、全押勝率）。
- 手牌紀錄支援多遊戲類型：德州、奧馬哈、奧馬哈5、短牌、7張梭哈、梭哈低牌(Razz)、A-5 與 2-7 單／兩／三次換牌（街別、bring-in 與換牌流程自動切換）。
- 支援通知中心（notification.html）：站內通知列表、未讀徽章（桌機與手機鈴鐺）、標為已讀／全部已讀／刪除，事件可同步寄送 Email。
- 支援列印存底（print.js）：報名名單、場次列表、場次摘要一鍵列印（含簽名欄與列印時間）；另有 80mm 四聯報名收據模板（receipt.html，資料串接中）。
- GTO 參考整合翻前／翻後於同一頁（tool/range.html，載入 gto.js）：支援無限注／底池限注／限注、德州與短牌 6+、2~10 人、短碼全下與加注&抵抗對戰樹、每人／BBA ante；翻後提供預算批次結果與自訂範圍即時求解（含抽轉牌／河牌）。
- 支援 PWA 安裝（加入主畫面、冷啟動還原上次頁面）、首次使用導覽（主辦者／玩家分流）與手機搖一搖回報問題。
- 支援俱樂部、場次地點與場次列表管理。
- 支援玩家報名、取消報名、主辦確認、晉級、財務資料與座位資料調整。
- 支援牌桌建立、桌次設定、座位安排、隨機排座與平均分桌。
- 支援手牌紀錄、玩家手牌、公共牌與勝負判斷；手牌詳情頁可用「動畫回放」在橢圓牌桌上逐步重播整手（`handdetail.html` + `handreplay.js`）。
- 支援主辦者聘用工作人員，包含發牌員、裁判、助理。
- 支援比賽計時器，包含控制端 `control.html`、顯示端 `display.html`、REST API 與 WebSocket 同步。
- 支援手牌現場轉播：把公開的統一手牌紀錄場即時串流到場外，含橢圓牌桌視覺化（座位、頭像、計分牌、手牌、動作、下注計分牌配色）、可選牌面／牌背樣式、底牌遮罩、固定延遲，以及 H4H 裁判逐手推進控制台（`broadcast.html`、`broadcastcontrol.html`）。
- 支援聯絡我們訊息、管理員查看與回覆。
- 支援繁體中文為主的前端介面，部分文字透過 `frontend/translate.js` 管理；目前只有 `frontend/display.html` 維持英文顯示，不做中譯。

## 系統架構

```text
project00061/
├── index.html                 # 根目錄入口，導向 frontend/
├── readme.md                  # 本文件
├── AGENTS.md                  # AI agent 專案操作指南
├── frontend/                  # 靜態前端 HTML/CSS/JS
├── backend/                   # Django API、Channels WebSocket、SQL helper
│   ├── runserver.cmd          # 後端啟動入口
│   ├── install-service.cmd    # Windows NSSM 服務安裝腳本
│   └── localenv.cmd.example   # 本機/部署機器環境變數範例
├── !SQL/                      # 根層資料庫結構或匯出資料
├── backend/!SQL/              # 後端資料庫結構或匯出資料
├── material/                  # 圖片、icon、字型、影音與設計素材
├── plugin/                    # 外掛或共用插件資料
├── test/                      # 測試相關資料
└── !errorpage/                # 錯誤頁面
```

## 技術棧

| 類別 | 使用技術 |
| --- | --- |
| 前端 | HTML、CSS、JavaScript、Tailwind（建置產物 `frontend/tailwind.css`，`npm run build:css` 產生並進版控）、chrisplugin CDN |
| 後端 | Python、Django、Django REST Framework、Django Channels、Uvicorn（多 worker，ASGI） |
| 資料庫 | PostgreSQL 為主要資料庫（透過 `function/sql.py` 原生 SQL + 連線池），SQL helper 仍保留 MySQL 支援程式碼 |
| WebSocket | Django Channels + Redis Channel Layer（`channels_redis`）；多 worker 必須用 Redis 才能跨行程同步計時器/顯示端 |
| 撲克牌型 | eval7 |
| 驗證與安全 | Token、bcrypt、Google Identity Services、Firebase Admin SDK |
| Email | Django SMTP backend，目前設定 Gmail SMTP |

## 安裝需求

建議環境（實際安裝步驟見「快速開始」步驟 1）：

| 工具 | 用途 | 備註 |
| --- | --- | --- |
| **Docker Desktop** | 跑 PostgreSQL 與 Redis | 建議做法；不想用 Docker 就自行安裝 PostgreSQL 14 以上與 Redis 6 以上 |
| **Python 3.10 以上** | 後端 Django / Uvicorn | 安裝時記得勾「Add to PATH」 |
| **Nginx** | 出靜態前端 + 反向代理 API／WebSocket | |
| **Redis 6 以上** | 多 worker 的 WebSocket（計時器／顯示端）同步必須 | 由步驟 3 的 Docker 提供 |
| **Node.js 18 以上**（選配） | 用 `node --check` 檢查前端 JavaScript 語法 | 只在開發時需要 |
| **NSSM**（選配） | 把後端裝成 Windows 常駐服務 | 見「快速開始」步驟 9 |

後端套件一律由 `backend/requirements.txt` 管理，不要再手動逐個 `pip install`：

```bash
pip install -r backend/requirements.txt
```

> 註：正式啟動用 `uvicorn`（多 worker，見「快速開始」）。

## 快速開始

請依序執行，每一步都建立在前一步之上：**前置工具 → 基礎服務 → 後端 → Nginx → 驗證**。

### 1. 前置安裝

先把工具一次裝完，後面就不會中斷：

| 工具 | 下載 | 說明 |
| --- | --- | --- |
| Docker Desktop | <https://www.docker.com/products/docker-desktop/> | 步驟 3 用來跑 PostgreSQL 與 Redis |
| Python 3.10+ | <https://www.python.org/downloads/> | 安裝時勾選「Add python.exe to PATH」 |
| Nginx | <https://nginx.org/en/download.html> | Windows 版解壓到固定位置，例如 `C:\nginx\` |
| Node.js 18+（選配） | <https://nodejs.org/> | 只用於檢查前端 JS 語法 |

裝完先驗證都認得：

```powershell
docker --version
python --version
nginx -v
```

### 2. 下載專案

```bash
git clone <repo-url>
cd project00061
```

### 3. 啟動基礎服務（PostgreSQL + Redis）

這兩個都是後端的相依前提，**先一起起來**。建議用 Docker：一行就把帳號、密碼、資料庫建好，不用手動下 `CREATE USER` / `CREATE DATABASE`，也不會跟機器上其他 PostgreSQL 版本打架，成功率比原生安裝高很多。

**PostgreSQL**

```bash
docker run -d --name pokertrace-db -e POSTGRES_USER=chris0527 -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=pokertrace -p 5432:5432 --restart unless-stopped postgres:16
```

參數說明（帳號密碼都可以自己改）：

| 參數 | 說明 |
| --- | --- |
| `POSTGRES_USER=chris0527` | 資料庫帳號。這是**程式目前的預設值**（`backend/api/initialize.py`、`backend/dbinitialize.py`、`backend/backup/backup_db.py`），照這行做就不用改後端。**可自行改成你要的名稱**，但改了就要同步改後端的 `DBUSER`（見步驟 4-4），否則會 authentication failed |
| `POSTGRES_PASSWORD=yourpassword` | 資料庫密碼。**請改成你自己的**，步驟 4-4 要設進 `PT_DB_PASSWORD` |
| `POSTGRES_DB=pokertrace` | 資料庫名稱，對應後端預設值 |
| `-p 5432:5432` | 對外連接埠，對應後端預設 `5432` |
| `--restart unless-stopped` | 開機自動啟動 |

**Redis**（多 worker 的 WebSocket 同步必須）

```bash
docker run -d --name pokertrace-redis -p 6379:6379 --restart unless-stopped redis:7
```

`settings.py` 的 `CHANNEL_LAYERS` 已設定連到 `127.0.0.1:6379`，不用改。

**驗證兩個都活著**

```bash
docker exec -it pokertrace-db psql -U chris0527 -d pokertrace -c "\l"
docker exec -it pokertrace-redis redis-cli ping
```

`psql` 列得出 `pokertrace`、`redis-cli ping` 回 `PONG` 就成功。

<details>
<summary>不想用 Docker？原生安裝的做法</summary>

安裝 PostgreSQL（<https://www.postgresql.org/download/>；Windows 用官方安裝檔，安裝時記下 superuser `postgres` 的密碼），把 `psql`／`pg_dump` 所在的 `bin` 目錄加入 PATH（例如 `C:\Program Files\PostgreSQL\16\bin`），然後手動建立帳號與資料庫：

```bash
psql -U postgres -c "CREATE USER chris0527 WITH PASSWORD 'yourpassword';"
psql -U postgres -c "CREATE DATABASE pokertrace OWNER chris0527;"
```

Redis 則另外安裝，並確保跑在 `127.0.0.1:6379`。

</details>

### 4. 設定後端

#### 4-1 建立 Python 虛擬環境

Windows PowerShell：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Linux／macOS：

```bash
python -m venv .venv
source .venv/bin/activate
```

#### 4-2 安裝後端套件

在**專案根目錄**執行（`requirements.txt` 在 `backend/` 底下）：

```bash
pip install -r backend/requirements.txt
```

#### 4-3 設定 Google 登入（必要）

本系統**唯一的登入方式就是 Google 登入**，沒有帳號密碼註冊。沒設定好這一步，任何人都無法登入。

登入採 Google Identity Services（GIS），前端有兩條流程：主要是自訂按鈕走 `google.accounts.oauth2` 彈窗取得 access token；GIS 尚未載入時退回官方按鈕（`google.accounts.id`，回傳 id token）。後端 `signin` 兩種都收，並會驗證 token 確實是發給「我們這個 Client ID」才放行。

**步驟一：在 Google Cloud Console 建立 OAuth 用戶端**

1. 前往 [Google Cloud Console](https://console.cloud.google.com/) → 建立專案（或選既有專案）。
2. 左側「API 和服務」→「OAuth 同意畫面」：
   - User Type 選 **外部（External）**
   - 填應用程式名稱、使用者支援電子郵件、開發人員聯絡資訊
   - 範圍（Scopes）加入 `openid`、`email`、`profile`
   - 測試階段記得把要登入的帳號加進「測試使用者」，否則會被擋
3. 左側「API 和服務」→「憑證」→「建立憑證」→ **OAuth 用戶端 ID**：
   - 應用程式類型選 **網頁應用程式**
   - **「已授權的 JavaScript 來源」** 逐一加入你會用到的來源（**這一項沒加對，登入會直接失敗**）：

     | 環境 | 要加入的來源 |
     | --- | --- |
     | 正式機 | `https://pokertrace.net` |
     | 測試機 | `https://test.pokertrace.net` |
     | 本機開發 | `http://localhost`（若不是 80 埠，要連埠號一起加，例如 `http://localhost:3061`） |

   - 「已授權的重新導向 URI」**不需要填**：本專案走彈窗（popup）流程，不做 redirect。
4. 建立後複製那串 **用戶端 ID**（形如 `xxxxxxxx-xxxx.apps.googleusercontent.com`）。

**步驟二：把 Client ID 填進程式（前後端各一處，兩邊必須完全一致）**

| 位置 | 變數 |
| --- | --- |
| `frontend/signin.js`（約第 10 行） | `const GOOGLECLIENTID="…"` |
| `backend/api/user.py`（約第 25 行） | `GOOGLE_CLIENT_ID="…"` |

後端會比對 Google 回傳 token 的 `aud`／`azp` 是否等於自己的 `GOOGLE_CLIENT_ID`（防止他站 token 冒用）。**兩邊填不一樣的話，前端看起來登入成功，後端卻一律回 `ERROR_signin_error`。**

改完後端要重啟才會生效。

**常見錯誤排查**

| 症狀 | 原因 |
| --- | --- |
| 彈窗出現 `origin_mismatch` / 直接閃退 | 「已授權的 JavaScript 來源」沒有加上目前這個網域（含 `https://`、含埠號） |
| 前端拿到 token、後端回 `ERROR_signin_error` | 前後端 Client ID 不一致，或後端沒重啟 |
| 只有特定帳號能登入 | OAuth 同意畫面還在「測試中」，只有測試使用者清單裡的帳號可登入；要對外請送出驗證／改為正式版 |
| 完全沒出現 Google 按鈕 | `https://accounts.google.com/gsi/client` 被擋（網路／擴充功能），或該頁沒載入到 GIS |

> **正式機與測試機共用同一組 Client ID 沒問題**，但兩個網域都要各自加進「已授權的 JavaScript 來源」。

#### 4-3b（選配）Firebase Admin SDK 憑證

> 登入**已改用 Google Identity Services，不再依賴 Firebase**（`backend/api/user.py` 的 `firebase_admin.auth` 已停用）。這一步只有在你要用到其他 Firebase 功能時才需要。

`backend/pokertrace/settings.py` 會嘗試讀取：

```text
backend/pokertrace-firebase-adminsdk-fbsvc-bdb33658a6.json
```

**檔案不存在也不會讓 Django 啟動失敗**（初始化包在 try/except，只會印一行警告並停用相關功能）。正式專案請不要把金鑰提交到公開倉庫，建議改用環境變數或私有部署設定。

#### 4-4 設定本機環境變數（含資料庫密碼）

```powershell
cd backend
copy localenv.cmd.example localenv.cmd
```

在 `localenv.cmd` 填入步驟 3 設定的資料庫密碼：

```powershell
set PT_DB_PASSWORD=yourpassword
```

`localenv.cmd` 會被 `runserver.cmd` 載入，也適合放 `STRUCTURE_AI_KEY`、`WORKERS`、`DJANGO_ALLOWED_HOSTS` 等本機設定。它已被 `.gitignore` 忽略，**不要把真實金鑰提交到版本控制**。

> **帳號／DB 名／主機／連接埠寫在程式裡，只有密碼讀環境變數。**
> 如果步驟 3 改了帳號、資料庫名稱或連接埠，請同步調整這三個檔的 `DBUSER` / `DBNAME` / `DBHOST` / `DBPORT`：
>
> - `backend/api/initialize.py`
> - `backend/dbinitialize.py`
> - `backend/defultuser.py`
> - `backend/defulttoken.py`

### 5. 初始化資料庫與測試使用者

要先完成步驟 3、4，否則會連不上資料庫。在 `backend/` 執行：

```bash
python dbinitialize.py
```

這會建立必要資料表與字典資料，已存在的資料表不會被刪除。

接著建立測試使用者：

```bash
python defultuser.py
```

測試使用者規則：

| 類型 | playerid 開頭 | 數量 |
| --- | --- | --- |
| player | `01` | 30 |
| dealer | `03` | 10 |
| floor | `05` | 10 |
| assistant | `07` | 10 |

測試使用者的 API token 要另外產生：

```bash
python defulttoken.py
```

`defulttoken.py` 會刪除所有預設使用者（`playerid` 以 `0` 開頭）的舊 token，再為每位重新產生一組與登入相同格式的 35 碼隨機 token，清單寫入 `backend/localtoken.md`（已被 `.gitignore` 忽略，內容機密、用完即刪）。可重複執行，每次執行舊 token 都會立即失效。詳見 `backend/readme.md` 的「defulttoken.py」章節。

### 6. 啟動後端（Uvicorn 多 worker）

Windows 在 `backend/` 直接執行：

```powershell
runserver.cmd
```

`runserver.cmd` 會先載入 `localenv.cmd`、跑 `dbinitialize.py`，再用 Uvicorn 多 worker 啟動 ASGI app（預設 6 個 worker、port 8061），輸出寫到 `backend/log/server.log`。

worker 數可在 `backend/localenv.cmd` 覆蓋，或改 `runserver.cmd` 裡的 `set WORKERS=`（建議 ≤ CPU 核心數；`WORKERS × 8` 需小於 PostgreSQL `max_connections`）。

也可以手動啟動：

```bash
cd backend
python -m uvicorn pokertrace.asgi:application --host 127.0.0.1 --port 8061 --workers 6
```

> 多 worker = 多行程，才有真正的 CPU 平行：有人在跑較重的勝率解算時，其他請求由其他 worker 處理，不會整站卡住。

### 7. 設定 Nginx

前端靜態檔由 nginx 直接出，API（`/backendapi/`）與 WebSocket（`/ws/`）反向代理到步驟 6 啟動的後端（`127.0.0.1:8061`）。

**完整可用的 server 區塊見下方「Nginx / Web Server 設定」章節**，把它加進 `nginx.conf` 後：

```powershell
nginx -t          # 驗證語法
nginx -s reload   # 套用設定
```

後端沒起來時，靜態前端仍出得來，但 API 會 502 —— 所以這步請在步驟 6 之後做。

### 8. 開站驗證

用瀏覽器開（埠號依 `listen` 設定，專案實際用 `3061`）：

```text
http://localhost:3061/
```

確認三件事：

- 頁面出得來 → 靜態前端 OK
- 能登入、看得到場次列表 → API proxy OK
- 開計時器 `control.html`／`display.html` 會同步 → WebSocket OK

前端 API 入口在 `frontend/initialize.js`，會依網址路徑自動決定前綴：

```javascript
const AJAXURL=location.pathname.indexOf("/project00061/")>=0?"/project00061/":"/backendapi/"
```

所以 nginx 的 location 前綴要跟這個對得上。也可以直接開 `frontend/index.html`，但沒有 Web Server 就沒有 API，只能看靜態版面。

### 9.（選配）把後端裝成 Windows 常駐服務

到步驟 8 為止站台已經可以正常跑；這步只是讓後端開機自動啟動、不用一直開著終端機。

#### 9-1 安裝 NSSM

NSSM（Non-Sucking Service Manager）是把任意執行檔包成 Windows 服務的小工具，`install-service.cmd` 需要它。它只是一顆免安裝的 `nssm.exe`：

1. 到官網下載：<https://nssm.cc/download>（取 `nssm 2.24`，或頁面上較新的 prerelease）。
2. 解壓縮到一個**固定不會被刪的位置**，例如 `C:\nssm-2.24\`。
3. 依系統選 exe：64 位元用 `win64\nssm.exe`，32 位元用 `win32\nssm.exe`。
4. （可選）把該資料夾加入 PATH，之後就能直接在終端機打 `nssm`。

用 Chocolatey 也可以一行裝好（會自動進 PATH）：

```powershell
choco install nssm
```

裝好後記下 `nssm.exe` 的實際路徑，下一步要填。

#### 9-2 調整 install-service.cmd

`install-service.cmd` 透過 NSSM 安裝 `PokerTrace` 服務，服務本體仍是呼叫既有的 `runserver.cmd`，所以 `localenv.cmd`、資料庫初始化與 log 行為都會沿用。

使用前請先打開 `backend/install-service.cmd` 檢查並依機器調整：

- `NSSM`：`nssm.exe` 位置，預設 `C:\nssm-2.24\win64\nssm.exe`。
- `BACKEND`：本專案 backend 絕對路徑。
- `PYDIR`：Python 安裝路徑。
- `USERSITE`：使用者 site-packages 路徑。

#### 9-3 安裝與確認

用**系統管理員身分**執行：

```powershell
cd backend
install-service.cmd
```

安裝完成後確認服務狀態：

```powershell
sc query PokerTrace
```

主要 log 位置：

```text
backend/log/server.log
backend/log/nssm.out.log
backend/log/nssm.err.log
```

也可以一鍵檢查服務、Redis、backend port 與 worker 狀態：

```powershell
powershell -ExecutionPolicy Bypass -File backend\check-service.ps1
```

## Nginx / Web Server 設定

前端是靜態檔案，由 nginx 直接出；後端 API 走 `/backendapi/`、WebSocket（計時器與手牌）走 `/ws/`，都反向代理到 Uvicorn（`127.0.0.1:8061`）；另外 `/__/auth/` 代理到 Firebase 供 Google 登入使用。

專案實際使用的 server 區塊（`C:\nginx\conf\nginx.conf`）：

```nginx
server {
    listen 3061;
    server_name localhost;
    client_max_body_size 50G;

    root   htdocs/website/externalcase/project00061/;
    index index.html index.php index.htm;
    allow all;

    location / {
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        add_header Pragma "no-cache";
        expires off;
    }

    error_page 400 /!errorpage/400/;
    error_page 403 /!errorpage/403/;
    error_page 404 /!errorpage/404/mod1.html;
    error_page 405 /!errorpage/405/;
    error_page 414 /!errorpage/414/;
    error_page 423 /!errorpage/423/;
    error_page 500 /!errorpage/500/;
    error_page 502 /!errorpage/502/;
    error_page 503 /!errorpage/503/;

    location /__/auth/ {
        proxy_pass https://pokertrace.firebaseapp.com/__/auth/;
        proxy_set_header Host pokertrace.firebaseapp.com;
        proxy_set_header X-Forwarded-Proto https;
        proxy_ssl_server_name on;
        proxy_ssl_protocols TLSv1.2 TLSv1.3;
    }

    location = /!errorpage {
        internal;
    }

    # location /frontend/tool/apidoc.html { if ($host = pokertrace.net) { return 423; } }

    location ~ \.php$ {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }

    location /backendapi/ {
        proxy_pass http://127.0.0.1:8061/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # TLS 由上游通道終結，本區塊只經 https 進入，故固定回報 https，
        # 否則 Django 的 SECURE_SSL_REDIRECT 會 301 轉址並掉 /backendapi 前綴。
        proxy_set_header X-Forwarded-Proto https;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8061;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400;
    }
}
```

重點：

- `listen 3061` 是本案對外埠；`root` 直接指到專案資料夾，所以 `/` 就出 `project00061/` 的靜態前端。
- `/backendapi/` → 後端 `127.0.0.1:8061`（要對上 `runserver.cmd` 啟動的 port）。前端 `AJAXURL` 正式站走 `/backendapi/`（見 `frontend/initialize.js`）。
- `/ws/` 專門處理 WebSocket，帶 `Upgrade`／`Connection` 升級標頭與長 `proxy_read_timeout`；計時器（`ws/timer/<sessionid>/`）與手牌（`ws/hand/<sessionid>/`）同步靠它。
- `X-Forwarded-Proto https` 是刻意固定：TLS 由上游通道終結，若回報成 http，Django 的 `SECURE_SSL_REDIRECT` 會 301 轉址並掉掉 `/backendapi` 前綴。
- `/__/auth/` 反代到 `pokertrace.firebaseapp.com`，是 Firebase／Google 登入用的 auth handler。
- 改完設定用 `nginx -t` 驗證語法，再 `nginx -s reload` 套用。

## 需要自行設定的項目

若你是在新機器啟動、搬移環境或準備正式部署，下面幾項需要先依自己的環境調整：

| 項目 | 目前位置 | 需要自行設定的內容 |
| --- | --- | --- |
| PostgreSQL 連線 | `DBNAME`／`DBUSER`／`DBHOST`／`DBPORT` 在 `backend/api/initialize.py`、`backend/dbinitialize.py`、`backend/defultuser.py`、`backend/defulttoken.py`；密碼讀環境變數 `PT_DB_PASSWORD` | 沿用程式預設（帳號 `chris0527`、DB `pokertrace`、`localhost`、`5432`）時只需設 `PT_DB_PASSWORD`；要換帳號、主機、DB 名或連接埠才改這四個檔 |
| **Google 登入 Client ID（必要）** | `frontend/signin.js`（`GOOGLECLIENTID`）與 `backend/api/user.py`（`GOOGLE_CLIENT_ID`），**兩處必須一致** | 自己的 OAuth 用戶端 ID，並在 Google Cloud Console 把每個環境的網域加進「已授權的 JavaScript 來源」。詳見「4-3 設定 Google 登入」 |
| Firebase Admin SDK 憑證（選配） | `backend/pokertrace/settings.py` | 憑證 JSON 實際路徑與檔案。登入已改用 GIS 不依賴它，缺檔不影響啟動 |
| Django 安全設定 | `backend/pokertrace/settings.py` | `SECRET_KEY`、`DEBUG`、`ALLOWED_HOSTS` |
| SMTP 郵件設定 | `backend/pokertrace/settings.py` | SMTP 帳號、密碼、寄件者資訊 |
| 前端 API 入口 | `frontend/initialize.js` | 正式站網址、API proxy 或 rewrite 路徑 |
| 啟動網址與 Web Server 對應 | Nginx / Apache / 本機站台設定 | `/project00061/` 與 Django API、WebSocket 的映射方式 |

建議做法：

1. 先把敏感資料改成環境變數或私有設定檔，不要直接寫死在 repo
2. 先確認前端呼叫的 API 路徑能正確打到 Django
3. 先確認 WebSocket 路徑 `ws/timer/<sessionid>/`、`ws/hand/<sessionid>/` 可以連通
4. 若你沿用目前內建預設值，至少要在正式上線前把帳密與 `DEBUG` 改掉

## 常用頁面

| 頁面 | 說明 |
| --- | --- |
| `frontend/index.html` | 首頁與專案介紹 |
| `frontend/signin.html` | 登入 |
| `frontend/signup.html` | 註冊 |
| `frontend/profile.html` | 個人檔案、統計與聘用資訊 |
| `frontend/sessionlist.html` | 場次列表 |
| `frontend/newsession.html` | 建立場次 |
| `frontend/session.html` | 場次詳細頁（含「加入系列賽」） |
| `frontend/serieslist.html` | 系列賽管理（列表與新增） |
| `frontend/series.html` | 系列賽詳情（場次彙總與排行榜） |
| `frontend/batchcreate.html` | 批量建立多日賽（晉級樹精靈） |
| `frontend/broadcast.html` | 現場轉播觀眾端（唯讀、免登入） |
| `frontend/broadcastcontrol.html` | 轉播控制 H4H（逐手放行） |
| `frontend/quickhand.html` | 快速手牌紀錄（獨立手牌） |
| `frontend/notification.html` | 通知中心 |
| `frontend/admin.html` | 系統 API 紀錄（管理員） |
| `frontend/receipt.html` | 報名收據四聯單模板（80mm） |
| `frontend/register.html` | 報名工作台 |
| `frontend/newtable.html` | 建立牌桌 |
| `frontend/table.html` | 牌桌與座位 |
| `frontend/newedithand.html` | 新增手牌紀錄 |
| `frontend/handdetail.html` | 手牌詳細資料 |
| `frontend/control.html` | 比賽計時器控制端 |
| `frontend/display.html` | 比賽計時器顯示端 |
| `frontend/broadcast.html` | 手牌現場轉播（場外唯讀，橢圓牌桌視覺化） |
| `frontend/broadcastcontrol.html` | H4H 裁判逐手推進控制台 |
| `frontend/structure.html` | 盲注結構檢視 |
| `frontend/structureedit.html` | 盲注結構編輯 |
| `frontend/payoutedit.html` | 名次與獎金設定 |
| `frontend/tool/range.html` | GTO 建議範圍參考（翻前矩陣＋翻後求解器，載入 `gto.js`；原 `gto.html`／`flopsolver` 已併入） |
| `frontend/toollist.html` | 工具總覽（80+ 小工具分類與搜尋） |
| `frontend/contact.html` | 聯絡我們 |
| `frontend/contactadmin.html` | 聯絡訊息管理 |
| `frontend/privacy.html` | 隱私權頁面 |
| `frontend/terms.html` | 使用條款頁面 |

工具頁集中於 `frontend/tool/`，包含 equity、ICM、pot odds、stack calculator、win probability、timebank drill 等輔助工具。

## API 與 WebSocket

Django 路由入口：

```text
backend/pokertrace/urls.py
backend/api/url.py
```

主要 API 類別：

| 類別 | 檔案 | 範例端點 |
| --- | --- | --- |
| 使用者 | `backend/api/user.py` | `signin`、`signup`、`getuser`、`getuserreport` |
| 場次 | `backend/api/session.py` | `getsessionlist`、`newsession`、`editsession`、`deletesession` |
| 系列賽 | `backend/api/series.py` | `getserieslist`、`newseries`、`editseriessessions`、`getseriesleaderboard` |
| 批量建立 | `backend/api/batch.py` | `batchcreatesessions` |
| 通知 | `backend/api/notification.py` | `getnotificationlist`、`getnotificationunreadcount`、`readallnotification`、`deletenotification` |
| 報名 | `backend/api/sessionplayer.py` | `registersession`、`getmyregistrations`、`confirmsessionplayer` |
| 聘用人員 | `backend/api/staff.py` | `getstafflist`、`newstaff`、`getsessionstafflist` |
| 俱樂部 | `backend/api/club.py` | `getclublist`、`newclub`、`editclub` |
| 牌桌 | `backend/api/table.py` | `gettablelist`、`newtable`、`edittable` |
| 座位 | `backend/api/seating.py` | `getseatinglist`、`newseating`、`editseating` |
| 手牌 | `backend/api/hand.py` | `gethandlist`、`newhand`、`solvehandwinner` |
| 現場轉播 | `backend/api/hand.py` | `getbroadcasthandlist`（免登入，唯讀）、`getbroadcastcontrol`、`broadcastrelease`（H4H 裁判逐手推進） |
| 計時器 | `backend/api/timer.py` | `gettimer`、`savetimer`、`gettimerplayers` |
| 聯絡我們 | `backend/api/contact.py` | `newcontactmessage`、`getcontactmessages`、`replycontactmessage` |
| 類型資料 | `backend/api/type.py` | `gettypelist`、`newtype`、`edittype` |

WebSocket 路由：

```text
ws/timer/<sessionid>/
ws/hand/<sessionid>/
```

`ws/hand/<sessionid>/` 除了記錄端同步外，也供現場轉播使用：公開的統一手牌紀錄場允許場外觀眾（含匿名）唯讀連線，收到手牌事件即重抓 `getbroadcasthandlist`；私人場仍需登入且具權限。

對應檔案：

```text
backend/api/timerwebsocket.py
backend/pokertrace/routing.py
```

API 回傳慣例通常為：

```json
{
    "success": true,
    "data": {}
}
```

授權通常使用：

```text
Authorization: Bearer <token>
```

前端 token 儲存在 localStorage，key 通常由 `WEBLSNAME+"token"` 組成。

## 帳號與角色

| 角色 | 說明 |
| --- | --- |
| `player` | 玩家、場次擁有者、主辦者 |
| `dealer` | 發牌員 |
| `floor` | 裁判 |
| `assistant` | 助理 |

權限慣例：

- 場次擁有者可以完整操作自己的場次。
- 已聘用人員可以看到相關場次，也可以編輯。
- 已聘用人員不應計入自己的盈虧統計。
- 已聘用人員不可刪除或複製場次。
- 裁判與助理可以操作計時器。
- 發牌員不可操作計時器。
- 管理員通常以 `permission>=4` 判斷。

## 資料庫

主要資料庫初始化檔案：

```text
backend/dbinitialize.py
```

SQL 備份與結構資料：

```text
!SQL/
backend/!SQL/
```

後端 SQL helper：

```text
backend/function/sql.py
```

目前主要連線設定在：

```text
backend/api/initialize.py
backend/dbinitialize.py
backend/defultuser.py
backend/defulttoken.py
```

正式部署前建議把資料庫帳號、密碼、Email 密碼、Django SECRET_KEY 與 Firebase 憑證改成環境變數管理。

## GTO 資料生成腳本

repo 根目錄有一批 `gto*.py` / `shortdeck*.py` 是**離線資料生成工具**（不是網站執行時的一部分）。
跑完會產生前端 GTO 工具頁要讀的資料檔：`frontend/gtodata.js`、`frontend/shortdeckdata.js`、
`gtoresults/`、`shortdeckresults/`。網站即時翻牌解算另有 `backend/api/gto.py`（Django 端點，單檔自含）。

一律在 **repo 根目錄**執行（腳本用相對路徑讀寫），需要 `eval7` 與 `numpy`。

| 分類 | 主要腳本 | 產出 |
| --- | --- | --- |
| 標準德州 preflop 範圍 | `gtoopen.py`（先跑，產生 `gtoeqmatrix.json`）→ `gtobakeall.py` / `gtodeep50.py` / `gtopreflowtree.py` | `frontend/gtodata.js` |
| 標準德州 flop 批次 | `gtoflops.py` → `gtoworker.py`（可 `Ctrl+C` 續跑）→ `gtomanifest.py` | `gtoresults/` + `manifest.json` |
| 短牌（36 張） | `shortdeckequity.py`（先跑）→ `shortdeckflops.py` / `shortdeckpreflow.py` / `shortdeckpushfold.py` / `shortdeckworker.py` | `frontend/shortdeckdata.js` + `shortdeckresults/` |
| 網站即時解算 | `backend/api/gto.py`（`testgto.py` 離線測） | 即時回傳，不落地 |

### 根目錄腳本逐檔用途

**共用模組（被 `import`，直接執行不會產生東西）**

- `gtosolvecore.py`：flop CFR 純運算核心，被 worker／multiway import。
- `gtoscenarios.py`：標準情境清單（雙方 range／計分牌／下注尺寸）。
- `shortdeckgto.py`：短牌牌型規則（同花＞葫蘆、A6789 順子）。
- `shortdecksolvecore.py`：短牌 CFR 核心（重用 `gtosolvecore` 數學）。
- `shortdeckscenarios.py`：短牌情境（range 來自 `shortdeckpreflow`）。

**標準德州 preflop 範圍 → `frontend/gtodata.js`**（有相依順序）

- `gtoopen.py`：開蓋全下 Nash，產生 `gtoeqmatrix.json`（169×169 勝率矩陣）與 `gtoopenout.json`。**必須先跑**。
- `gtocall.py`：面對全下的跟注範圍（eval7 精算，印 JSON 供貼用）。
- `gtobakeall.py`：重烤整個 9／6／2-max push/fold（含混合頻率）。
- `gtobake.py`：只產 6-max push/fold 區塊到 `gto6maxblock.txt`（人工貼）。
- `gtobake2.py`：產 2-max（單挑）push/fold，直接寫進 `gtodata.js`。
- `gtodeep50.py`：50bb 深碼 3bet／面對 3bet／面對 4bet + 50bb RFI。
- `gtodeeprfi.py`：深碼 RFI 開池 25~300bb 各檔範圍，重寫 `gtodata.js` 的 `GTORFI`（改 RFI 一律改這支）。
- `gtopreflowtree.py`：補齊所有位置兩兩配對的翻前對戰樹，輸出可貼區塊。

**Ante／多人補充範圍**

- `gtoante.py`：依總 ante 重算的 push/fold（open jam + call-vs-jam）→ `frontend/gtoante.js`。
- `gtomultiwaycall.py`：三人池面對全下的跟注範圍（含 ante）→ `frontend/gtomultiwaycall.js`。

**標準德州 flop CFR 批次 → `gtoresults/`**

- `gtoflops.py`：枚舉去重同構 flop → `gtoflops_canonical.json`（1755 個）。
- `gtoworker.py`：flop CFR 主批次 worker（鎖檔、`Ctrl+C` 續跑、checkpoint）。
- `gtomanifest.py`：掃 `gtoresults/*.json` 產生輕量 `manifest.json`（一般由 worker 自動觸發）。
- `gtomultiway.py`：3 人池簡化 CFR 實驗（demo，非嚴謹多人 Nash）。
- `gtoflop.py`：單一 flop CFR 的獨立示範（印下注頻率，不落地）。

**短牌（Short Deck／6+，36 張）→ `frontend/shortdeckdata.js` + `shortdeckresults/`**

- `shortdeckequity.py`：蒙地卡羅算短牌 81×81 全下勝率矩陣 → `shortdeckeqmatrix.json`。**要先跑**。
- `shortdeckflops.py`：短牌不同構 flop → `shortdeckflops_canonical.json`。
- `shortdeckpreflow.py`：短牌 preflop 範圍（RFI／3bet／vs3bet／vs4bet）。
- `shortdeckpushfold.py`：短牌短碼 push/fold Nash + call-vs-jam。
- `shortdeckworker.py`：短牌 flop 批次 worker（同 `gtoworker.py` 機制）。

**即時解算與測試**

- `backend/api/gto.py`：Django `solveflop` 端點，前端 `tool/range.html` 的即時 flop CFR（單檔自含，不依賴上面離線資料）。
- `testgto.py`：離線測 `backend/api/gto.py` 的 `solveflop`（stub 掉 Django 相依，不需 DB／Redis）。

> `gtoworker.py` / `shortdeckworker.py` 用鎖檔（`gtoworker.lock`）確保同時只跑一個 instance，進度存在
> `gtocheckpoint/` / `shortdeckcheckpoint/`，中斷後再執行同一指令會接續。
>
> 每支腳本的用途、相依順序、輸入／輸出與「一鍵重建參考順序」詳見 [`gto.md`](gto.md) 的
> 「GTO 資料生成腳本與執行方式（開發者）」一節。

## 開發檢查

前端 JavaScript 語法檢查：

```bash
node --check frontend/profile.js
node --check frontend/sessionlist.js
node --check frontend/control.js
node --check frontend/display.js
```

後端 Python 語法檢查：

```bash
python -m py_compile backend/api/user.py backend/api/session.py backend/api/timer.py
```

Git diff 空白檢查：

```bash
git diff --check -- backend/api/session.py frontend/sessionlist.js
```

查看工作區狀態：

```bash
git status --short
```

## 開發規範

本專案有 AI agent 與維護用規範，請先閱讀：

```text
AGENTS.md
backend/AGENTS.md
frontend/AGENTS.md
```

重點摘要：

- 修改既有檔案前需先建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離。
- 不要只靠前端按鈕隱藏處理權限，後端也要驗證。
- API 回傳格式盡量維持 `{"success": true/false,"data": ...}`。
- 修改時尊重既有程式風格，不做大範圍無關重構。
- 新增或修改程式碼時盡量不用 `foreach`、`switch-case`、三元運算式、arrow function 與 `i++`。
- 變數命名以小寫為主，不使用底線；布林值盡量以 `ed` 結尾。

## 部署提醒

正式部署前請檢查：

- `backend/pokertrace/settings.py` 的 `DEBUG` 應改為 `False`。
- `SECRET_KEY` 不應公開。
- `ALLOWED_HOSTS` 不應長期使用 `["*"]`。
- Email SMTP 密碼不應寫死在程式碼。
- Firebase Admin SDK 憑證不應公開。
- PostgreSQL 帳號密碼不應寫死在程式碼。
- Channels 生產環境建議使用 Redis channel layer。
- Web Server 需設定靜態前端路徑與 Django API proxy。
- HTTPS、CORS、CSRF、檔案上傳與備份策略需依正式環境補強。

## 開發人員表

| 姓名 / 暱稱 | 角色 | 聯絡方式 | 負責內容 |
| --- | --- | --- | --- |
| 賀皓群 / 小賀 | 製作人員、主要開發者 | Discord: `chris0527`、Line: `ho960527`、Email: `chris960527ho@gmail.com` | 系統規劃、前端、後端、資料庫、部署與維護 |

## 贊助

PokerTrace 目前以免費、無廣告、開源方向維護。如果你覺得這個專案對撲克賽事管理有幫助，歡迎用以下方式支持：
- 提供功能建議、錯誤回報與實際賽事使用回饋。
- 協助測試不同裝置、瀏覽器與現場流程。
- 協助補文件、翻譯、UI 改善。
- 聯絡主要開發者洽談贊助、合作或客製化需求。

//目前尚未公布固定贊助連結；若之後新增 OpenCollective、GitHub Sponsors、綠界、街口、LINE Pay 或其他方式，請同步更新本段落。

## 特別感謝

感謝所有協助測試、回報問題、提供現場流程建議與支持 PokerTrace 的玩家、主辦者、發牌員、裁判、助理與朋友們。

也特別感謝下列開源與服務生態：

- Python、Django、Django REST Framework、Django Channels、Daphne。
- PostgreSQL、psycopg2。
- Tailwind CSS。
- eval7 撲克牌型判斷工具。
- Firebase Admin SDK 與 Google Identity Services。
- 所有讓免費開源工具能持續被使用與改善的社群貢獻者。

## 版權宣告

Copyright (c) 2026 PokerTrace.

本專案採用 0BSD（BSD Zero Clause License）授權，完整條款見根目錄 [`LICENSE`](LICENSE)。你可以自由使用、修改、散布與商業利用本專案，完全沒有附帶條件。

本軟體以「現狀」提供，不附任何明示或默示擔保，作者不對任何損害負責。

想合作、客製化或共同開發，歡迎聯絡主要開發者。

## 維護備註

- 本 README 是根目錄總覽文件。
- 後端細節請參考 `backend/readme.md`。
- 前端細節請參考 `frontend/readme.md`。
- GTO 模組設計與資料生成腳本執行方式請參考 `gto.md`。
- `backend/readme.md` 已包含 `runserver.cmd`、`install-service.cmd` 與 `localenv.cmd.example` 的使用方式。

***a1.0.0 20260717***
***賀皓群***