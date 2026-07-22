/*
	7 張梭哈（7 Card Stud）：無社區牌、7 張各自底牌，前注 + 帶入注（bring-in）。
	五條街 3rd~7th：3rd 發 2 暗 1 明、4th~6th 各發 1 明、7th 發 1 暗。
	贏家目前手動指定（未接後端解算）。
*/
handgameregister({
	code: "ST",
	name: "7張梭哈",
	holecount: 7,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "stud",
	blindtype: "ante-bringin",
	low: false,
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
