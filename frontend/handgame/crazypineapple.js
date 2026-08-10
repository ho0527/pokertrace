/*
	瘋狂菠蘿（Crazy Pineapple）：發 **3 張**底牌，社區牌與四條街和德州相同，
	但**看完翻牌後要棄掉一張**，之後就是一般德州（2 張底牌任意組合取最佳五張）。

	## 棄掉的那張怎麼記

	底牌欄位仍然是 3 張（card1..card3），**棄掉的那張另外記在 familydata 的
	`discard` 裡**：`{"family":"board","discardcount":1,"discard":{"座位":["3h"]}}`。
	手牌詳情會把 discard 裡的牌畫上 X，一眼看得出哪張沒打完。

	- **自動判贏必須關掉**（`autosolve: false`）。不關的話 family 是 board，
	  `handgameautosolvable()` 會回 true，後端就會拿 3 張全部去湊最佳五張，
	  **算出比實際更好的牌** —— 而且不會報任何錯，只是安靜地判錯贏家。
	  同樣 3 張底牌的超級德州（SH）沒有棄牌，所以它可以自動判贏。
	- `discardcount` 只是宣告「這個牌型會棄幾張」，供顯示端判斷要不要找 discard。

	記錄手牌那一頁**還沒有選棄牌的介面**（街別流程只支援發公共牌 / 梭哈發牌 / 換牌），
	所以目前 discard 只有程式產生的資料會帶。要在畫面上選，得動 `newedithand.js` 的街別流程。

	名稱沿用資料庫 gametype 表 code='CP' 那一列與 translate.js 的對照（「瘋狂菠蘿」）。
*/
handgameregister({
	code: "CP",
	name: "瘋狂菠蘿",
	holecount: 3,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "board",
	autosolve: false,
	discardcount: 1
})
