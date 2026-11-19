# backend

## 用途

Django REST API、Channels WebSocket、資料庫 helper 與專案設定。

`gethand/{handid}` 在統一手牌紀錄場次回傳登入者自己的 `myseatno`、`myhandcard` 與 `myhandnote`。查詢私人底牌以登入者 ID 限定；未入座的人員／管理員及非統一紀錄場次不取得私人內容，已軟刪的底牌也不會回傳。

`handplayercard.playerid` 保留既有 API 欄位名稱，值為 `user.id`。啟動時會以 `handplayercard_userid_fkey` 取代指向舊 `player` 表的外鍵；修改前必須確認既有底牌全部對得上帳號並備份資料庫。底牌 API 寫入失敗會回傳錯誤，避免顯示未實際儲存的成功訊息。

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

## 帳號私人註記（2026-11-16）

- `POST getusernotelist`：必填 `targetuseridlist`，最多100個正整數ID；只回 token 本人寫的註記，未註記對象略過。頂層 `userid` 是目前登入者ID，供前端隱藏本人入口。
- `PUT editusernote/{targetuserid}`：必填 `color`（空或完整HEX）與 `note`（最多1,000 Unicode code point）；兩者均空即清除。註記者由token決定，不接收外來userid，管理員也不能代讀寫。
- `usernote` 以作者／對象唯一鍵跨場次保存，保存時鎖定兩個有效帳號；管理員軟刪清理與硬刪cascade避免留下筆記。
- 回應no-store，筆記值不放進場次／計時器／共用WebSocket；日誌僅保留不含筆記內容的診斷。SQL helper 的 `errorredacted` 預設False維持既有呼叫相容性，私人筆記查詢／交易傳True。
- API文件：`../frontend/tool/apidoc.js`；2026-11-16 已同步正式機，僅套用 usernote 新增表結構，保留正式庫設定。

2026-11-17：新增`GET getmyusernotelist?page=1&limit=20&keyword=`，作者固定取token本人；只列有效對象，支援名稱／玩家ID／本人筆記搜尋，頁碼1至1000000、每頁1至100、搜尋最多200字元，拒絕未知參數。回傳data.notelist／total／page／limit，筆記值的SQL診斷去識別，所有回應no-store。管理員與被註記者不能代讀，編輯／清除沿用editusernote。API文件與真實隔離／搜尋／分頁測試已同步；本次產品用語改為玩家／發牌員／籌碼，DB欄位與協定不改，邀請信亦依使用者新要求同步用語。


## 2026-11-17 參與者協會與一次性玩家 ID

- 新增 `user.playeridchangedtime` 及有效 8 位非零起首 ID 的唯一索引 `userplayeridunique`。`PUT editmyplayerid` 只作用於本人；playerid/confirmplayerid/confirmagain 必須一致，透過列鎖與 NULL 時間戳條件限制一次，成功同值重送可冪等。既有 user.id 與資料關聯不變。
- 新增 `userclub(userid,clubid,ps,sortorder,createtime,updatetime)`，每人每協會唯一。`clubhelper.getuserclublist` 自動納入自己的協會及已確認／已晉級參與場次的協會，後者持續保留且不重複；主辦者刪除的協會不再顯示。名稱與地址即時從 club 讀取，私人 ps 只從登入者的 userclub 讀取。
- `PUT editclubnote/<clubid>` 僅接收 ps（最多 1,000 Unicode 字元），只可改本人清單內由他人擁有的協會；不得指定他人 userid 或更動主辦資料。自己的協會繼續用 editclub。管理員不具讀取他人 userclub 私人註解的介面。
- editcluborder 核對本人完整原順序，寫入 userclub；僅同步自己的 club.sortorder，保留既有公開協會順序契約。
- searchusers 的既有 keyword 支援完整 `PTUSER:<userid>` 精確查詢，沿用認證、遮罩 email 與場次狀態；不完整或非法格式回空清單。
- 部署先備份正式庫，檢查正規 ID 重複群數為零，再套用此次 marker 內純新增 DDL。不可整包覆蓋 backend 或機器設定。通知觸發僅文件校正，沒有新增通知或寄信行為。


## 2026-11-18 玩家 ID 先檢查再確認

POST checkmyplayerid 僅接收 playerid，檢查格式、本人修改機會、與目前是否相同及唯一性。透過 playeridchangeerror 與最終 PUT 共用規則；預先檢查不保留 ID、不寫入、不消耗機會，全部回應 no-store。PUT 仍重新驗證與用列鎖／唯一索引防止檢查後的競爭。


## 2026-11-18 跨午夜時長與頭像註記

getsessionlist 的有效 SQL 統計把同日 endtime<starttime 視為跨午夜，endtime+interval '1 day' 後計算；不修改歷史日期。其他真正倒置或缺失區間以 NULL 排除平均分母，場次數及盈虧保持不變。正式唯讀診斷發現 15 筆倒置起訖，範例為 20:00 至同日 01:30。
