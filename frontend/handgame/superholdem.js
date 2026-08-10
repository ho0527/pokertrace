/*
	超級德州（Super Hold'em，三卡賽）：**3 張**底牌的德州，社區牌與四條街完全相同，
	攤牌時**任意組合**取最佳五張（不像奧馬哈規定必須剛好用 2 張底牌）。

	所以最佳五張是「3 張底牌 + 5 張公共牌共 8 張裡挑 5 張」。

	後端不用改：`besthandscore()`（hand.py）是「底牌 >=4 張走奧馬哈 2+3，
	否則 eval7.evaluate(底牌+公牌)」，3 張底牌落在第二條，剛好就是任意組合。
	丟進去的是 8 張 —— 已實測過 eval7 吃 8 張是對的（隨機 3000 組與暴力列舉
	C(8,5) 逐一比對，0 組不同），所以不必自己列舉最佳五張。

	名稱沿用資料庫 gametype 表 code='SH' 那一列與 translate.js 的對照
	（「超級德州(三卡賽)」），不另取「Super Hold'em」之類的說法。

	**可自動判贏**：family 是 board 且沒有棄牌機制，記錄下來的 3 張全部有效，
	handgameautosolvable() 回 true。這一點與同樣 3 張底牌的瘋狂菠蘿（CP）不同 ——
	CP 有翻牌後棄一張，記錄的 3 張含已棄的那張，所以 CP 明確關掉自動判贏。
*/
handgameregister({
	code: "SH",
	name: "超級德州(三卡賽)",
	holecount: 3,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "board"
})
