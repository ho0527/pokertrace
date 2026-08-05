let RULES=[
	{tzh:"口頭宣告",ten:"Verbal Declarations",zh:"輪到你時的口頭宣告（如 call、raise、fold）具約束力，須照宣告執行。",en:"A verbal declaration in turn (call, raise, fold) is binding and must be honored."},
	{tzh:"輪內動作",ten:"Action In Turn",zh:"輪到你才行動；提前亮牌或下注可能受罰，並可能洩漏資訊。",en:"Act only in turn; acting out of turn may be penalized and can give away information."},
	{tzh:"亮牌定輸贏",ten:"Cards Speak",zh:"攤牌時以實際牌面決定大小（cards speak），即使選手報錯牌型。",en:"At showdown the actual cards determine the winner (cards speak), even if a hand is misread aloud."},
	{tzh:"分段下注 String Bet",ten:"String Bet",zh:"未先宣告金額而分次把計分牌推入，通常只算跟注，不算加注。",en:"Moving chips in multiple motions without first declaring the amount is usually ruled a call, not a raise."},
	{tzh:"最小加注",ten:"Minimum Raise",zh:"加注額至少需等於前一個下注或加注的幅度。",en:"A raise must be at least the size of the previous bet or raise."},
	{tzh:"全下不足額",ten:"All-in Under Min-raise",zh:"全下金額不足一個完整加注時，通常不重新開啟先前已行動選手的加注權。",en:"An all-in for less than a full raise generally does not reopen betting for players who already acted."},
	{tzh:"最後侵略者先亮",ten:"Last Aggressor Shows First",zh:"河牌有下注時由最後下注／加注者先亮牌；無人下注則由莊位左手起順時針先亮。",en:"If there was river betting, the last aggressor shows first; if checked, the first active player left of the button shows first."},
	{tzh:"保護你的牌",ten:"Protect Your Hand",zh:"選手有責任保護手牌；未受保護而被收走或與棄牌混到，通常判死牌。",en:"Players must protect their hand; an unprotected hand that gets mucked or fouled is usually dead."},
	{tzh:"死牌",ten:"Dead Hand",zh:"觸碰棄牌堆、亮給他人看到、或牌張掉落離桌等情況可能被判死牌。",en:"Touching the muck, exposing to others, or cards leaving the table can render a hand dead."},
	{tzh:"一人一手",ten:"One Player Per Hand",zh:"一手牌只能由本人決策，不得與他人討論尚在進行中的牌。",en:"Only the player may decide their hand; discussing a live hand with others is not allowed."},
	{tzh:"計分牌可見",ten:"Chips Visible",zh:"高面額計分牌須清楚可見，不可藏匿；要求時須公開計分牌量。",en:"Higher-denomination chips must be visible and not hidden; stacks must be countable on request."},
	{tzh:"換色 / 競賽",ten:"Color-Up & Race",zh:"移除小面額時由賽方安排換色與 chip race，餘額以高牌決定進位。",en:"When removing small chips, the room runs a color-up and chip race; odd amounts are decided by high card."},
	{tzh:"延遲報名",ten:"Late Registration",zh:"延遲報名於公告級數結束時截止；截止前淘汰通常可 re-entry（依規則）。",en:"Late registration closes at the announced level; busting before close usually allows re-entry per the rules."},
	{tzh:"離桌處罰",ten:"Penalty",zh:"嚴重違規可處離桌一級或多級，期間照常被收盲注前注。",en:"Serious infractions can incur one or more rounds away from the table; blinds and antes are still posted."},
	{tzh:"電子裝置",ten:"Electronic Devices",zh:"進行中的牌局通常禁止在桌上使用手機或即時對局輔助。",en:"Phones and real-time assistance are generally not allowed at the table during a live hand."},
	{tzh:"裁決為準",ten:"Floor Decisions",zh:"規則有爭議時由 floor 裁定；以維護賽事公正為最高原則，裁決為最終。",en:"Disputes are settled by the floor; fairness to the game is paramount and the floor's ruling is final."}
]

function rutext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["rulespage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["rulespage"][key]||key
}

function renderrules(){
	let q=String(getvalue("rusearch")||"").trim().toLowerCase()
	let html=""
	let count=0
	for(let i=0;i<RULES.length;i=i+1){
		let r=RULES[i]
		let topic=(function(){if(LANGUAGE=="en"){return r.ten}return r.tzh})()
		let body=(function(){if(LANGUAGE=="en"){return r.en}return r.zh})()
		let hay=(r.tzh+" "+r.ten+" "+r.zh+" "+r.en).toLowerCase()
		if(q!=""&&hay.indexOf(q)==-1){
			continue
		}
		count=count+1
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<div class="font-bold text-emerald-400">${topic}</div>
				<div class="mt-1 text-sm leading-7 text-zinc-300">${body}</div>
			</div>
		`
	}
	if(count==0){
		html=`<div class="text-sm text-zinc-500">${rutext("noresult")}</div>`
	}
	innerhtml("#rurows",html,false)
}

function applyrulanguage(){
	document.title=rutext("title")+" - PokerTrace"
	innertext("#rutitle",rutext("title"),false)
	innertext("#back",rutext("back"),false)
	domgetid("rusearch").setAttribute("placeholder",rutext("search"))
	innertext("#runote",rutext("note"),false)
	renderrules()
}

oninput("#rusearch",renderrules)

applyrulanguage()
