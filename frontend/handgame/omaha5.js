/* 奧馬哈5：5 張底牌、全 52 張牌；攤牌必用 2 張底牌（由後端 equity 評估）。 */
handgameregister({
	code: "O5",
	name: "奧馬哈5",
	holecount: 5,
	ranklist: HANDGAMEFULLRANK,
	omaha: true,
	enabled: true,
	family: "board"
})
