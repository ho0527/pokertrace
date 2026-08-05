﻿# frontend/handgame

## 用途

各牌型的**中繼資料註冊表**，供新增／編輯手牌與手牌詳情頁依牌型自動切換街別、bring-in 與換牌流程。

**本目錄沒有任何評牌（hand evaluation）或比大小的程式碼。** 每個牌型檔只是呼叫 `handgame.js` 的 `handgameregister()` 登錄一組資料：`code`、`name`、`holecount`、`ranklist`、`family`、`streets`（街別）、`blindtype`（下注制）、`exposedmap`（梭哈明暗牌對照）、`low`、`drawcount`。`handgame.js` 本身也只有註冊表與查詢 helper（`handgamedef()`、`handgamestreets()`、`handgameholecount()` 等）＋牌物件／陣列互轉工具，沒有分派到「邏輯模組」這回事。

### 實際評牌在哪裡

- **後端 `backend/api/hand.py` 的 equity 端點**（`eval7` 套件 ＋ 自寫的短牌評分）才是唯一的評牌實作。前端要判贏家一律呼叫它，不要在本目錄另造輪子。

### 哪些牌型不會自動判贏

- `handgame.js` 的 `handgameautosolvable()` 目前只回 `true` 給 **board（社區牌）家族**：`HE`、`OM`、`O5`、`O8`、`SD` 共 5 種。
- **但 `O8` 是例外**：它是 board 家族所以 `handgameautosolvable()` 會回 `true`，可是後端 `solvehandwinner` 只算高牌那一半（`equityhiloed()` 有低牌邏輯但沒有被接進去），所以自動判贏對 hi-lo 只會給高牌的答案，**低池分給誰仍要人工決定**。`handdetail` 會把低牌用到的五張標黃光輔助判讀（TASK-050）。
- 其餘 **8 種**（stud 梭哈家族 `ST`、`RA`；draw 換牌家族 `AS`、`AD`、`AT`、`DS`、`DD`、`DT`）**沒有自動判贏，贏家由人工指定**。低牌牌型（`low: "a5"` / `"27"`）目前也只供顯示與手動判讀，未接後端解算。

## 主要檔案

- `handgame.js`：註冊表本體、查詢 helper、街別預設值與牌物件轉換工具。
- `holdem.js`：`HE` 德州撲克（board，可自動判贏）。
- `omaha.js`：`OM` 奧馬哈（board，可自動判贏）。
- `omaha5.js`：`O5` 奧馬哈5（board，可自動判贏）。
- `omaha8.js`：`O8` 奧馬哈高低（board，高牌可自動判贏，低池人工決定）。
- `shortdeck.js`：`SD` 短牌（board，可自動判贏）。
- `stud.js`：`ST` 7張梭哈（stud，人工指定贏家）。
- `razz.js`：`RA` 梭哈低牌 Razz（stud，人工指定贏家）。
- `a5draw.js`：`AS` / `AD` / `AT` A-5 單／雙／三次換牌（draw，人工指定贏家）。
- `deuce7draw.js`：`DS` / `DD` / `DT` 2-7 單／雙／三次換牌（draw，人工指定贏家）。

## 子資料夾

- 無固定子資料夾。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 新增牌型時在新檔呼叫 `handgameregister()` 登錄，並在此列出該檔與其 code。若新牌型要自動判贏，真正要動的是 `backend/api/hand.py` 的 equity 端點與 `handgame.js` 的 `handgameautosolvable()`，不是在本目錄寫評牌。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
