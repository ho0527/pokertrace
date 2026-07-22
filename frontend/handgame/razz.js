/*
	梭哈低牌（Razz）：牌型結構與 7 張梭哈相同（五條街、7 張底牌、前注 + 帶入注），
	但比大小取 A-5 最小牌（低牌）。目前贏家手動指定（未接後端低牌解算）。
*/
handgameregister({
	code: "RA",
	name: "梭哈低牌(Razz)",
	holecount: 7,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "stud",
	blindtype: "ante-bringin",
	low: "a5",
	streets: [
		{ key: "3rd",name: "三街",deal: { slots: [1,2,3],exposed: ["hole","hole","up"] } },
		{ key: "4th",name: "四街",deal: { slots: [4],exposed: ["up"] } },
		{ key: "5th",name: "五街",deal: { slots: [5],exposed: ["up"] } },
		{ key: "6th",name: "六街",deal: { slots: [6],exposed: ["up"] } },
		{ key: "7th",name: "七街",deal: { slots: [7],exposed: ["hole"] } }
	],
	exposedmap: {
		"3rd": ["hole","hole","up"],
		"4th": ["up"],
		"5th": ["up"],
		"6th": ["up"],
		"7th": ["hole"]
	}
})
