/*
	Big O（5 張奧馬哈高低）：5 張底牌、全 52 張牌，底池拆成高牌與低牌兩半。

	等於 O5 與 O8 的組合：
	- 底牌張數與 O5 相同（5 張）
	- 高低分池與低牌規則與 O8 完全相同（8-or-better、A 算 1、五張點數不可重複）
	- 攤牌一律「底牌剛好 2 張 + 公共牌剛好 3 張」，高低兩邊可以各挑不同的組合

	所以 handdetail.js 的 besthandomahalow() 不用改 —— 它本來就是「從底牌任選 2 張」，
	底牌是 4 張還是 5 張只影響組合數（C(4,2)=6 → C(5,2)=10）。

	名稱沿用 translate.js 的 gametype 對照表（`"BO": "5張奧馬哈高低"`），
	不另取「Big O」之類的說法，避免同一個牌型在下拉與其他地方叫不同名字。
	資料庫 gametype 表 id=5 的 description 是「5張奧馬哈高低(Big O)」，code 就是 BO。

	low 標成 "a5" 與 Razz、O8 一致（同樣是 A-5 低牌的比法）。

	後端 equity 端點已支援（TASK-075）：equityomahaed / equityhiloed 都含 BO、
	equityholecount 回 5，蒙地卡羅次數降到 2000（BO 每副牌每家要算 100 組高牌加 100 組低牌）。

	**贏家仍由人工指定**，與 O8 完全相同的限制：handgameautosolvable() 只看
	family=="board" 就回 true，但後端 solvehandwinner 沒有任何低牌邏輯
	（低牌只實作在 equity 端點），所以自動判贏對 hi-lo 只會給高牌那一半的答案。
	低池分給誰要操作者自己在攤牌畫面決定。handdetail 會把低牌用到的五張標黃光輔助判讀。
	要真正自動分低池是 TASK-072 的範圍。
*/
handgameregister({
	code: "BO",
	name: "5張奧馬哈高低",
	holecount: 5,
	ranklist: HANDGAMEFULLRANK,
	omaha: true,
	enabled: true,
	family: "board",
	low: "a5"
})
