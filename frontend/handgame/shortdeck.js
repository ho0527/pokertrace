/* 短牌（6+）：2 張底牌、移除 2-5，只用 6-A 共 36 張牌。 */
handgameregister({
	code: "SD",
	name: "短牌",
	holecount: 2,
	ranklist: HANDGAMESHORTRANK,
	omaha: false,
	enabled: true,
	family: "board"
})
