/* 奧馬哈：4 張底牌、全 52 張牌；攤牌必用 2 張底牌（由後端 equity 評估）。 */
handgameregister({
	code: "OM",
	name: "奧馬哈",
	holecount: 4,
	ranklist: HANDGAMEFULLRANK,
	omaha: true,
	enabled: true,
	family: "board"
})
