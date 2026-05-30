# project00061

## 用途

PokerTrace 撲克場次管理系統根目錄，串接前端靜態頁、Django API、SQL 結構、素材與維護文件。

## 主要檔案

- `.gitignore`
- `1.md`
- `2 copy.md`
- `2.md`
- `history.md`
- `index.html`
- `pokertraceintro.docx`

## 子資料夾

- `!errorpage/`
- `!SQL/`
- `.copilot/`
- `.github/`
- `backend/`
- `frontend/`
- `material/`
- `plugin/`
- `test/`

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。


frontend/initialize.js:14 需要輸入您的後端連接埠
```js
const AJAXURL="// 輸入您的後端連接埠"
```

backend/dbinitialize.py、backend/defultuser.py、backend/api/initialize.py 需要輸入資料庫資料
```py
DBNAME="// 輸入你的資料庫名稱"
DBHOST="localhost"
DBUSER="// 輸入你的資料庫使用者名稱"
DBPASSWORD="// 輸入你的資料庫使用者密碼"
DBPORT=5432
```

backend/project00058/setting.py:141 需要輸入您的電子郵件
```py
EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_HOST_USER="// 輸入你要用來送信的電子郵件"
EMAIL_HOST_PASSWORD="// 16位應用程式密碼"
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=EMAIL_HOST_USER
```

backend/contact.py:15、backend/defultuser.py:32 需要輸入您的電子郵件