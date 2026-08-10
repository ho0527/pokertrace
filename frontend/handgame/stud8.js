/*
	7 張梭哈高低（Seven Card Stud Hi-Lo / Stud 8-or-Better）：牌型結構與 7 張梭哈完全相同
	（五條街、7 張底牌、前注 + 帶入注、3rd 發 2 暗 1 明、4th~6th 各 1 明、7th 1 暗），
	差別只在**底池拆成高牌與低牌兩半**。

	低牌規則與 O8 / BO 同一套（8-or-better）：
	- 從 7 張裡任選 5 張，點數都要 8 或更小（A 算 1），且不能重複
	- 湊不出合格低牌時，整個底池由高牌的贏家全拿

	low 標成 "a5"，與 Razz、O8、BO 一致（同樣是 A-5 低牌的比法）。

	名稱沿用資料庫 gametype 表 code='S8' 那一列與 translate.js 的對照（「7張梭哈高低」），
	不另取「Stud 8」之類的說法，避免同一個牌型在下拉與其他地方叫不同名字。

	**贏家由人工指定**：family 是 stud，handgameautosolvable() 回 false，
	與 ST / RA 相同。後端 equity 端點也沒有梭哈的解算，高低兩池都要操作者自己決定。
*/
handgameregister({
	code: "S8",
	name: "7張梭哈高低",
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
