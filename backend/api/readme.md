# backend/api

## 用途

後端 API 模組，包含登入/使用者、聯絡訊息、場次、聘用人員、牌桌、座位、手牌、計時器、GTO/工具、協會與 Swagger/OpenAPI 等端點。

## 主要檔案

- `authhelper.py`
- `batch.py`
- `club.py`
- `contact.py`
- `gto.py`
- `hand.py`
- `initialize.py`
- `notification.py`
- `seating.py`
- `seatlock.py`
- `series.py`
- `session.py`
- `sessionplayer.py`
- `staff.py`
- `structureparse.py`
- `swagger.py`
- `table.py`
- `timer copy.py`（舊備份/參考檔，正式邏輯以 `timer.py` 為準）
- `timerwebsocket.py`
- `timer.py`
- `type.py`
- `url.py`
- `user.py`

## 子資料夾

- 無固定子資料夾。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- API 路由集中於 `url.py`，`pokertrace/urls.py` 只負責 include `api.url`。
- `user.py` 提供登入、註冊、使用者資料、後台使用者管理與語言/計分牌設定等功能。
- `user.py` 的 `deleteuseraccount`（`DELETE /deleteuseraccount`）是使用者「自行刪除帳號」端點：需 body 帶 `confirmtext`（本人玩家 ID）驗證，於單一交易內「硬刪除」本人擁有的場次資料樹、報名、聘用、通知、設定與 user 本體；別人場次中的歷史手牌/座位列保留但去識別化（`userid`/`name` 清空），`auditlog`/`apilog` 保留供稽核。與管理員軟刪除的 `deleteuser/<userid>` 不同。
- `contact.py` 提供前台聯絡訊息新增與後台查詢、回覆、狀態更新；站方通知依收件管理員的資料庫語言寄中文或英文，後台回覆依留言者帳號語言寄送，找不到語言設定時回退中文。
- `sessionplayer.py` 是目前報名工作台 `frontend/register.html` 的主要資料來源，包含報名、取消、確認、晉級、財務與座位操作。
- `registersessionplayer/<sessionid>` 接受工作人員送出的可選 `note`，作為該次 buy-in 備註；重新入場會以本次內容覆寫，空白會清除。選手自行報名仍不提供工作人員備註。
- `sessionplayer.py` 的報到核對有兩支：`getcheckininfo/<sessionplayerid>`（掃收據 QR 用，`sessionplayer.id`）與 `getcheckininfobyentry/<sessionid>/<entryno>`（工作人員照收據手動輸入用，`entryno` 是收據上的「入場編號」＝`sessionplayer.serialno`）。入場編號只在單一場次內唯一，所以第二支一定要帶 `sessionid`。兩支共用 `CHECKININFOSELECT` 與 `_checkininfodata()`，回傳結構與權限（本人／場次擁有者／管理員／該場員工）完全一致；查無資料一律回 `ERROR_registration_not_found`，不回會誤導的 `ERROR_session_not_found`。
- `sessionplayer.py` 的 `randomizesessionplayerseats/<sessionid>`（PUT）依 `mode` 分為 unseated／selected／balanced／unseatall。串接場次（`session.linkuser=true`）操作 `sessionplayer.tableid/seatno`；手動場次（`linkuser=false`）的座位存在 `seating` 表，目前只支援 `unseatall`：比照 `mergetableplayers` 非 linkuser 清桌作法，把該場次所有牌桌（含已關閉桌）的 seating rows 軟刪並回傳 `unseatedcount`（依 `tablecurrentplayers` 有選手的座位數計）；其餘 mode 在手動場次回 `ERROR_request_data_type_error`，不做只改 `sessionplayer` 欄位的假成功。
- `hand.py` 支援統一手牌協作：公共手牌可用 `selfseating=0`，玩家私有底牌與私人備註存於 `handplayercard`，只由 `editmyhandcard` 更新本人資料。
- `hand.py` 的快速手牌可帶 `quicknetchange`（座位號字串對應帶正負號的整數）；資料沿用 `adjustmentsjson` 保存並在讀取時還原，明確結果優先於牌局細節，沒有此欄位的舊快速手牌維持原計算。
- `hand.py` 另提供 `getsessionchips`（需可讀取該場手牌者），回傳場次計分牌面額與顏色，供手牌動畫回放（`handreplay.js`）的下注計分牌上色。
- `gto.py` 提供 `solveflop`，前端由 `frontend/tool/range.html`（載入 `gto.js`）使用；`hand.py` 仍提供 `equity` 與 `solvehandwinner`。
- `table.py` 的 `newtable` 支援 `rangestart` / `rangeend`，可一次建立連續編號的多個牌桌；未提供範圍時仍維持單桌新增。
- `table.lockedseatlist` 儲存該桌鎖定座位號；`seatlock.py` 統一解析與驗證。`edittablesetting` 只允許鎖定空位，`savetableplayers`、`editsessionplayerseat`、`newseating` 拒絕把選手放入鎖定位，隨機排座、移桌、併桌與刪除手牌後的自動回座也一律排除鎖定位；多桌看板的 `empty` 不含鎖定位。
- `table.py` 的 `closetable/<tableid>`（POST，body `{"closed": true|false}`）設定/清除 `table.closedtime`（NULL=開放）。已關閉的桌不可作為併桌目標（`mergetableplayers` 回 `ERROR_table_closed`）、不參與 `randomizesessionplayerseats` 的自動排座（balanced 直接排除、指定單桌回錯誤）、`seating.newseating` 拒收新的入座記錄（leave 不擋）、`hand.deletehand` 的自動回座也會略過；操作者逐一手動指定的 `editsessionplayerseat`／`savetableplayers`／`movetableplayer` 不受限。`mergetableplayers` 成功時回傳 `moves` 搬動明細（含原桌位與新桌位），供前端顯示併桌去向。
- `user.py` 的 Google 登入只以經驗證 token 的 `sub` 對應 `user.uid`；可編輯的聯絡 email 不是帳號合併依據。
- `timer.py` 管理 timer 設定、級別、payout、玩家狀態；`timerwebsocket.py` 同步計時器與手牌相關 WebSocket 更新，每次寫入與事件送出前會重查目前權限。
- `series.py` 提供系列賽（Series）功能：把多個場次歸為一包做跨場次彙總與排行榜，對應前端 `serieslist.html`／`series.html`。
- `batch.py` 提供批量建立多日賽：一次建好整棵晉級樹的所有場次並串接多日賽關聯與系列賽，對應前端 `batchcreate.html`。
- `notification.py` 提供站內通知中心與 Web Push：通知列表、未讀數、標為已讀／全部已讀、刪除、裝置訂閱管理與測試推播，對應前端 `notification.html`。VAPID 私鑰放在 `backend/vapid_private.pem` 或由 `VAPID_PRIVATE_KEY_FILE` 指定，不可進版控。
- `structureparse.py` 提供盲注結構文字解析，供結構編輯頁匯入使用。
- Swagger 文件在 `/swagger/`，OpenAPI JSON 在 `/swagger.json`。目前由 `swagger.py` 掃描 `url.py` 的路由自動產生基本文件，不需要額外 pip 套件。
- `python backend/tool/testsecurityreview.py --selftest` 會驗證 email 不會觸發帳號合併、WebSocket 每次重驗權限、遷移失敗時保留舊欄位，並確認備份腳本的預設庫名來自本機設定。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
