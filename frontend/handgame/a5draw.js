/*
	A-5 換牌（Lowball）：無社區牌、5 張底牌、盲注制，換牌前 + n 次換牌。
	比大小取 A-5 最小牌（A 可當 1、同花與順子不計），單 / 雙 / 三換三種變體。
	贏家目前手動指定（未接後端低牌解算）。
*/
handgameregister({
	code: "AS",
	name: "A-5單次換牌",
	holecount: 5,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "draw",
	blindtype: "blind",
	low: "a5",
	drawcount: 1,
	streets: handgamedrawstreets(1)
})
handgameregister({
	code: "AD",
	name: "A-5兩次換牌",
	holecount: 5,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "draw",
	blindtype: "blind",
	low: "a5",
	drawcount: 2,
	streets: handgamedrawstreets(2)
})
handgameregister({
	code: "AT",
	name: "A-5三次換牌",
	holecount: 5,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "draw",
	blindtype: "blind",
	low: "a5",
	drawcount: 3,
	streets: handgamedrawstreets(3)
})
