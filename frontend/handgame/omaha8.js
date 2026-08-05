/*
	奧馬哈 hi-lo（Omaha 8-or-Better）：4 張底牌、全 52 張牌，牌型結構與奧馬哈完全相同，
	差別在**底池拆成高牌與低牌兩半**。

	低牌的規則（與 handdetail.js 的 besthandomahalow() 同一套）：
	- 同樣是「底牌剛好 2 張 + 公共牌剛好 3 張」，高低兩邊可以各挑不同的組合
	- 五張的點數都要 8 或更小（A 算 1），且不能重複
	- 湊不出合格低牌時，整個底池由高牌的贏家全拿

	low 標成 "a5" 與 Razz 一致（同樣是 A-5 低牌的比法）。

	**贏家仍由人工指定**：handgameautosolvable() 只看 family=="board" 會回 true，
	但後端 equity 端點對 O8 只算高牌那一半（equityhiloed 有低牌邏輯，
	solvehandwinner 沒有接），所以自動判贏對 hi-lo 只會給高牌的答案。
	低池分給誰要操作者自己在攤牌畫面決定。handdetail 會把低牌用到的五張標黃光輔助判讀。
*/
handgameregister({
	code: "O8",
	/* 名稱沿用 gametype 表 id=3 那一列的 description（奧馬哈高低），
	   不另取「奧馬哈hi-lo」之類的說法，避免同一個牌型在下拉與其他地方叫不同名字。 */
	name: "奧馬哈高低",
	holecount: 4,
	ranklist: HANDGAMEFULLRANK,
	omaha: true,
	enabled: true,
	family: "board",
	low: "a5"
})
