let DEALEROP=[
	{tzh:"發牌準備",ten:"Setup",zh:"洗牌、切牌、確認牌數；burn 牌後再發公共牌（翻牌前 burn 一張，轉、河各 burn 一張）。",en:"Shuffle, cut, verify deck; burn before community cards (one before the flop, one each before turn and river)."},
	{tzh:"保護按鈕與盲注",ten:"Button & Blinds",zh:"確認按鈕位置正確，盲注與前注就位後才發牌。",en:"Confirm the button position; deal only after blinds and antes are posted."},
	{tzh:"行動順序",ten:"Action Order",zh:"翻牌前由大盲左手開始，翻牌後由按鈕左手第一個有牌選手開始。",en:"Preflop starts left of the big blind; postflop starts with the first live player left of the button."},
	{tzh:"宣告與唱注",ten:"Announce Bets",zh:"清楚唱出下注、加注與全下金額，確認計分牌數量後再繼續。",en:"Clearly announce bets, raises and all-ins; verify chip counts before proceeding."},
	{tzh:"誤發 Misdeal",ten:"Misdeal",zh:"如首張牌亮出、發牌張數錯誤或按鈕錯位等，依規則宣告誤發、重新發牌。",en:"Exposed first card, wrong number of cards, or misplaced button can be ruled a misdeal and redealt per the rules."},
	{tzh:"亮牌處理",ten:"Exposed Card",zh:"莊家誤亮的牌通常作廢、依規定補牌；選手自行亮牌不適用此規定。",en:"A card the dealer exposes is usually replaced per procedure; this does not apply to a player exposing their own card."},
	{tzh:"邊池處理",ten:"Side Pots",zh:"有全下且金額不同時，分別計算主池與邊池，確認可贏得各池的選手。",en:"With all-ins of different sizes, build separate main and side pots and confirm who is eligible for each."},
	{tzh:"攤牌順序",ten:"Showdown Order",zh:"河牌最後下注／加注者先亮牌；無下注則由按鈕左手起順時針先亮。",en:"Last river bettor/raiser shows first; if checked, first player left of the button shows first."},
	{tzh:"派彩",ten:"Awarding Pot",zh:"以實際牌力判定（cards speak），確認後再推彩，必要時請 floor 協助。",en:"Cards speak; confirm the winning hand before pushing the pot, and call the floor if needed."},
	{tzh:"換牌與換桌",ten:"Deck & Table Changes",zh:"依排程換牌；併桌、破桌時協助搬位並確認計分牌與按鈕位置。",en:"Change decks on schedule; help move players on table breaks and confirm chips and button position."}
]

function optext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["dealersoppage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["dealersoppage"][key]||key
}

function renderop(){
	let html=""
	for(let i=0;i<DEALEROP.length;i=i+1){
		let d=DEALEROP[i]
		let topic=(function(){if(LANGUAGE=="en"){return d.ten}return d.tzh})()
		let body=(function(){if(LANGUAGE=="en"){return d.en}return d.zh})()
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<div class="font-bold text-emerald-400">${i+1}. ${topic}</div>
				<div class="mt-1 text-sm leading-7 text-zinc-300">${body}</div>
			</div>
		`
	}
	innerhtml("#oprows",html,false)
}

function applyoplanguage(){
	document.title=optext("title")+" - PokerTrace"
	innertext("#optitle",optext("title"),false)
	innertext("#back",optext("back"),false)
	innertext("#opnote",optext("note"),false)
	renderop()
}

applyoplanguage()
