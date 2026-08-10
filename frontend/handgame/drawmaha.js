/*
	坐馬哈（Drawmaha）：五張抽牌 + 奧馬哈的混合牌型。

	流程：發 5 張底牌 → 下注 → **換一次牌** → 下注 → 發 5 張公共牌（翻牌 / 轉牌 / 河牌，各一輪下注）。

	攤牌時**底池拆成兩半**：
	- 一半給最好的**五張抽牌牌型**：只看自己手上那 5 張，完全不用公共牌
	- 一半給最好的**奧馬哈牌型**：恰好 2 張底牌 + 恰好 3 張公共牌（與 OM / O8 同一套限制）

	所以同一手裡，兩半可能是不同人贏，也可能同一人通吃。

	## 這是目前唯一「換牌與公共牌混在同一手」的牌型

	街別因此是 predraw / draw1 / flop / turn / river 五條，不是 handgamedrawstreets()
	產生的純換牌街，也不是 BOARDSTREETS 的四條。要自己列。

	`family` 仍標 **board** 而不是 draw：記錄手牌那一頁對 family 有很密的分支
	（公共牌編輯器、發牌 / 換牌編輯器、攤牌流程），標成 draw 會讓公共牌沒地方記。
	換牌回合的丟補牌走 familydata 的 `draws`，與換牌家族同一個形狀。

	`autosolve: false`：後端 solvehandwinner 只算**一種**牌型取最大，
	切不出「抽牌一半 + 奧馬哈一半」，硬要它判會把整個底池給錯人。贏家人工指定。

	名稱沿用資料庫 gametype 表 code='DM' 那一列（「坐馬哈」）。
*/
handgameregister({
	code: "DM",
	name: "坐馬哈",
	holecount: 5,
	ranklist: HANDGAMEFULLRANK,
	omaha: true,
	enabled: true,
	family: "board",
	autosolve: false,
	drawcount: 1,
	streets: [
		{ key: "predraw",name: "換牌前" },
		{ key: "draw1",name: "換牌",draw: true },
		{ key: "flop",name: "翻牌圈",board: "flop" },
		{ key: "turn",name: "轉牌圈",board: "turn" },
		{ key: "river",name: "河牌圈",board: "river" }
	]
})
