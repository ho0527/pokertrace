# backend/pokertrace

## 用途

Django 專案設定、URL、ASGI/WSGI 與 WebSocket routing。

## 主要檔案

- `asgi.py`
- `middleware.py`
- `routing.py`
- `settings.py`
- `urls.py`
- `wsgi.py`
- `__init__.py`

## 環境變數（`settings.py` 讀取）

| 變數 | 說明 |
| --- | --- |
| `DJANGO_SECRET_KEY` | **正式環境（`DEBUG` 關閉）必填**。未設定會直接 `raise ImproperlyConfigured` 讓服務**啟動失敗**，這是刻意的，避免正式站用到硬編金鑰。本地開發（`DJANGO_DEBUG=1`）未設定時才會退回開發用金鑰 `django-insecure-dev-only-change-me` |
| `DJANGO_DEBUG` | 預設 `0`（關閉）。本地開發設 `1` 才開啟 |
| `DJANGO_ALLOWED_HOSTS` | 逗號分隔，例如 `example.com,api.example.com`。`DEBUG` 時未設定會退回本地預設 |
| `DJANGO_CORS_ALLOWED_ORIGINS` | 逗號分隔。**正式環境務必設定**；未設定且 `DEBUG` 時才退回本地開發來源 |

> 服務起不來、log 出現 `ImproperlyConfigured: DJANGO_SECRET_KEY environment variable is required when DEBUG is off`，就是這一項沒設。部署機的環境變數放在 `backend/localenv.cmd`（已 gitignore，範例見 `localenv.cmd.example`）。

## 子資料夾

- 無固定子資料夾。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- `urls.py` 目前只 include `api.url`，實際 REST API 路由維護於 `backend/api/url.py`。
- `routing.py` 目前提供 `ws/timer/{sessionid}` 與 `ws/hand/{sessionid}`，分別用於計時器同步與手牌/牌桌協作更新。
- `settings.py` 使用 Channels 與 Redis channel layer；正式啟動請對照 `backend/runserver.cmd`。
- `middleware.py` 提供 `ExceptionMiddleware`（統一例外處理）與 `ApiLogMiddleware`（API 請求紀錄），於 `settings.py` 的 `MIDDLEWARE` 掛載。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
