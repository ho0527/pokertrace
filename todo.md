# PokerTrace Todo

## 待辦

依優先序排列，每項含「動機」與「初步範圍」。

### 1. 自訂計分牌樣式

- 動機：不同協會／賽事使用的計分牌面額與配色不同，現場辨識度影響發牌與 color up 效率。
- 初步範圍：在個人檔案或場次設定中，讓使用者自訂每個面額的顏色與標籤，並套用到計分牌相關工具（chipsetup、colorup、chipcount 等）。

### 2. 更新撲克牌樣式

- 動機：目前牌面樣式較陽春，手牌紀錄（handdetail）與 GTO／flop solver 的視覺一致性可再提升。
- 初步範圍：重畫花色／點數 SVG，提供至少一套替代牌面，集中於 `carddisplay.css` 管理。

### 3. 自訂計時器顯示畫面

- 動機：`display.html` 為現場大螢幕，主辦者常希望放上自家 logo、調整版位與配色。
- 初步範圍：可設定品牌名稱／logo、主色、要顯示的欄位（盲注、ante、平均計分牌、報名數、payout 等）與排版。

### 4. 多 board 紀錄支援

- 動機：run it twice 或多 board 是現場常見需求，若系統只能記單一 board，手牌紀錄與後續分析都會失真。
- 初步範圍：在手牌流程、顯示結構與資料儲存中支援 turn／river 分支 board，並確認 pot 分配、showdown 與匯出格式可對應。

## 未來展望（發布後規劃）

對應「全站發布前檢查」五面向中的**應新增內容**，即 `checklist_new_features_20260626.md`（原本這裡寫的 `release_checklist_20260626.md` 並不存在）。以下屬於發布後再評估的擴充方向。

### 5. 多語系擴充

- 動機：`translate.js` 目前以繁體中文為主，英文僅作 fallback，部分動態 hint／驗證訊息為硬寫，不利對外推廣。
- 初步範圍：補齊硬寫文案進 `TRANSLATE`，新增英文語系並評估其他語言；`display.html` 維持可切換英文。

### 6. 進階分析與行動端

- 動機：玩家端的盈虧分析與 GTO 工具是長期黏著點；現場人員更需要行動裝置與即時通知。
- 初步範圍：盈虧趨勢圖表與分組統計、GTO／range 工具深化、評估行動 App 或 PWA 原生通知。

### 候選技術債（來自發布前檢查）

- ~~後端統一錯誤處理 middleware，集中擋下 stack trace 外洩並標準化錯誤碼。~~ **已完成**：`pokertrace/middleware.py` 的 `ExceptionMiddleware` 已掛在 `settings.py` 的 `MIDDLEWARE`。
- 機密設定全面遷移至環境變數（**程式面已完成**：DB 密碼讀 `PT_DB_PASSWORD`、`DJANGO_SECRET_KEY` 非 DEBUG 必填；`db.sqlite3` 已刪除）。**仍待辦**：git 歷史中的機密清除與憑證輪替（見 `checklist_server_security_20260626.md` 18.1／18.2）。
- 工具頁輸入狀態保存（localStorage）與「複製結果／重設」按鈕。
