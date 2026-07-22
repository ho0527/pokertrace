/*
	2-7 換牌（Kansas City Lowball）：無社區牌、5 張底牌、盲注制，換牌前 + n 次換牌。
	比大小取 2-7 最小牌（A 只當高、同花與順子要計，最佳為 2-3-4-5-7），單 / 雙 / 三換三種變體。
	贏家目前手動指定（未接後端低牌解算）。
*/
handgameregister({
	code: "DS",
	name: "2-7單次換牌",
	holecount: 5,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "draw",
	blindtype: "blind",
	low: "27",
	drawcount: 1,
	streets: handgamedrawstreets(1)
})
handgameregister({
	code: "DD",
	name: "2-7兩次換牌",
	holecount: 5,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "draw",
	blindtype: "blind",
	low: "27",
	drawcount: 2,
	streets: handgamedrawstreets(2)
})
handgameregister({
	code: "DT",
	name: "2-7三次換牌",
	holecount: 5,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "draw",
	blindtype: "blind",
	low: "27",
	drawcount: 3,
	streets: handgamedrawstreets(3)
})
