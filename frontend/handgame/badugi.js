/*
	巴杜基（Badugi）：無社區牌、**4 張**底牌、盲注制，換牌前 + 三次換牌。

	比大小用 badugi 自己的一套，與 A-5 / 2-7 都不一樣：
	- 只算**花色與點數都不重複**的那幾張，張數愈多愈好（四張 badugi > 三張 > 兩張）
	- 同張數再比點數，愈小愈好；A 一律算 1
	- 花色或點數重複的牌直接不計入

	所以 low 標成 "badugi" 而不是 "a5" / "27" —— 那兩個值代表五張的低牌比法，
	badugi 是「不重複張數優先」的四張比法，混用會讓日後接自動解算時挑錯規則。
	`low` 目前只被 buildFamilyData()（newedithand.js）原樣存進 familydatajson，
	沒有任何分支拿它做判斷，所以新增這個值不影響既有牌型。

	holecount 是 4，是本目錄唯一 4 張底牌的**換牌**家族牌型（O8 也是 4 張但屬 board）。

	名稱沿用資料庫 gametype 表 code='BU' 那一列與 translate.js 的對照（「巴杜基」）。

	**贏家由人工指定**：family 是 draw，handgameautosolvable() 回 false，
	與六種換牌牌型相同。後端沒有任何 badugi 評牌實作，也不要在本目錄自造。
*/
handgameregister({
	code: "BU",
	name: "巴杜基",
	holecount: 4,
	ranklist: HANDGAMEFULLRANK,
	omaha: false,
	enabled: true,
	family: "draw",
	blindtype: "blind",
	low: "badugi",
	drawcount: 3,
	streets: handgamedrawstreets(3)
})
