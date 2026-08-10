﻿# frontend/handgame

## 用途

各牌型的**中繼資料註冊表**，供新增／編輯手牌與手牌詳情頁依牌型自動切換街別、bring-in 與換牌流程。

**本目錄沒有任何評牌（hand evaluation）或比大小的程式碼。** 每個牌型檔只是呼叫 `handgame.js` 的 `handgameregister()` 登錄一組資料：`code`、`name`、`holecount`、`ranklist`、`family`、`streets`（街別）、`blindtype`（下注制）、`exposedmap`（梭哈明暗牌對照）、`low`、`drawcount`。`handgame.js` 本身也只有註冊表與查詢 helper（`handgamedef()`、`handgamestreets()`、`handgameholecount()` 等）＋牌物件／陣列互轉工具，沒有分派到「邏輯模組」這回事。

### 實際評牌在哪裡

- **後端 `backend/api/hand.py` 的 equity 端點**（`eval7` 套件 ＋ 自寫的短牌評分）才是唯一的評牌實作。前端要判贏家一律呼叫它，不要在本目錄另造輪子。

### 哪些牌型不會自動判贏

- `handgame.js` 的 `handgameautosolvable()` 預設只回 `true` 給 **board（社區牌）家族**：`HE`、`OM`、`O5`、`O8`、`SD`、`SH` 共 6 種。
- **但 board 家族可以用 `autosolve: false` 明確關掉**，目前是 `CP`（瘋狂菠蘿）與 `DM`（坐馬哈）。`CP` 翻牌後要棄一張，底牌欄位仍是 3 張，交給後端會拿已棄的那張去湊出比實際更好的牌，**而且不會報錯，只是安靜地判錯贏家**；`DM` 則是底池要拆成抽牌與奧馬哈兩半，而 `solvehandwinner` 只算一種牌型取最大，切不出這兩半。
- **但 `O8` 是例外**：它是 board 家族所以 `handgameautosolvable()` 會回 `true`，可是後端 `solvehandwinner` 只算高牌那一半（`equityhiloed()` 有低牌邏輯但沒有被接進去），所以自動判贏對 hi-lo 只會給高牌的答案，**低池分給誰仍要人工決定**。`handdetail` 會把低牌用到的五張標黃光輔助判讀（TASK-050）。
- 其餘 **12 種**（stud 梭哈家族 `ST`、`RA`、`S8`；draw 換牌家族 `AS`、`AD`、`AT`、`DS`、`DD`、`DT`、`BU`；board 家族但明確關掉的 `CP`、`DM`）**沒有自動判贏，贏家由人工指定**。低牌牌型（`low: "a5"` / `"27"` / `"badugi"`）目前也只供顯示與手動判讀，未接後端解算。

## 街別不是只有四條，顯示端一定要問註冊表

`streets` 是每個牌型自己定的：社區牌四條（preflop/flop/turn/river）、梭哈五條（3rd~7th）、
換牌是「換牌前 + N 次換牌」、坐馬哈則是**換牌與公共牌混在一起**（predraw/draw1/flop/turn/river）。

顯示端把街別寫死成 `["preflop","flop","turn","river"]` 的話，梭哈與換牌的下注紀錄
**一筆都對不上 type，整段下注歷程會是空的，而且不會報任何錯**。
`handdetail.html` 因此要載入本目錄各檔，並用 `handgamestreets()` 取街別。

## 明牌 / 暗牌與棄牌

- `exposedmap` 是梭哈每街的明暗對照；`handgameexposedlist()` 把它攤平成
  「第 N 張底牌是明是暗」（7 張梭哈是 2 暗 + 4 明 + 1 暗）。攤牌後每張都看得到，
  但「當時別人看不看得到」是判讀的重要資訊，顯示端要標出來。
- `discardcount` 宣告這個牌型會棄幾張（目前只有瘋狂菠蘿 `CP`）。棄掉的牌記在
  `familydata.discard`，底牌欄位仍然保留全部張數；手牌詳情會把棄掉的那張打上 X。
  **記錄手牌那一頁還沒有選棄牌的介面**，這是已知缺口。

## 主要檔案

- `handgame.js`：註冊表本體、查詢 helper、街別預設值與牌物件轉換工具。
- `holdem.js`：`HE` 德州撲克（board，可自動判贏）。
- `omaha.js`：`OM` 奧馬哈（board，可自動判贏）。
- `omaha5.js`：`O5` 奧馬哈5（board，可自動判贏）。
- `omaha8.js`：`O8` 奧馬哈高低（board，高牌可自動判贏，低池人工決定）。
- `shortdeck.js`：`SD` 短牌（board，可自動判贏）。
- `superholdem.js`：`SH` 超級德州(三卡賽)（board 3 張底牌，可自動判贏）。
- `crazypineapple.js`：`CP` 瘋狂菠蘿（board 3 張底牌，翻牌後棄一張記在 `familydata.discard`，**明確關掉自動判贏**）。
- `stud.js`：`ST` 7張梭哈（stud，人工指定贏家）。
- `razz.js`：`RA` 梭哈低牌 Razz（stud，人工指定贏家）。
- `stud8.js`：`S8` 7張梭哈高低（stud，高低分池，人工指定贏家）。
- `a5draw.js`：`AS` / `AD` / `AT` A-5 單／雙／三次換牌（draw，人工指定贏家）。
- `deuce7draw.js`：`DS` / `DD` / `DT` 2-7 單／雙／三次換牌（draw，人工指定贏家）。
- `badugi.js`：`BU` 巴杜基（draw 4 張底牌、三次換牌，人工指定贏家）。
- `drawmaha.js`：`DM` 坐馬哈（**換牌與公共牌混在同一手**：5 張底牌、換一次牌後才發公共牌。底池拆兩半，一半給五張抽牌牌型、一半給奧馬哈牌型。人工指定贏家）。

## 子資料夾

- 無固定子資料夾。

## 維護備註

- 修改既有檔案前，依根目錄 `AGENTS.md` 的規則建立 `_old_tN` 備份。
- 前端維持 HTML、CSS、JS 分離；後端 API 維持 `{"success": true/false,"data": ...}` 回傳慣例。
- 權限相關修改要同時檢查前端顯示與後端驗證，不只改按鈕。
- 新增牌型時在新檔呼叫 `handgameregister()` 登錄，並在此列出該檔與其 code。若新牌型要自動判贏，真正要動的是 `backend/api/hand.py` 的 equity 端點與 `handgame.js` 的 `handgameautosolvable()`，不是在本目錄寫評牌。
- 若本目錄用途或重要檔案改變，請同步更新本 README 與 `AGENTS.md`。
