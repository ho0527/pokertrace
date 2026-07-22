let HANDRANKS=[
	{zh:"皇家同花順",en:"Royal Flush",ex:"A♠ K♠ Q♠ J♠ T♠"},
	{zh:"同花順",en:"Straight Flush",ex:"9♥ 8♥ 7♥ 6♥ 5♥"},
	{zh:"四條",en:"Four of a Kind",ex:"Q♣ Q♦ Q♥ Q♠ 7♦"},
	{zh:"葫蘆",en:"Full House",ex:"T♣ T♦ T♥ 4♠ 4♦"},
	{zh:"同花",en:"Flush",ex:"K♦ J♦ 8♦ 5♦ 2♦"},
	{zh:"順子",en:"Straight",ex:"8♣ 7♦ 6♥ 5♠ 4♦"},
	{zh:"三條",en:"Three of a Kind",ex:"5♣ 5♦ 5♥ K♠ 2♦"},
	{zh:"兩對",en:"Two Pair",ex:"J♣ J♦ 6♥ 6♠ A♦"},
	{zh:"一對",en:"One Pair",ex:"9♣ 9♦ A♥ 7♠ 3♦"},
	{zh:"高牌",en:"High Card",ex:"A♣ J♦ 8♥ 6♠ 2♦"}
]

function hrtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["handrankingpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["handrankingpage"][key]||key
}

function renderhr(){
	let html=""
	for(let i=0;i<HANDRANKS.length;i=i+1){
		let h=HANDRANKS[i]
		let name=(function(){if(LANGUAGE=="en"){return h.en}return h.zh})()
		html=html+`
			<div class="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<span class="w-8 text-center text-lg font-extrabold text-emerald-400">${i+1}</span>
				<span class="flex-1 font-bold text-white">${name}</span>
				<span class="font-mono text-sm text-zinc-400">${h.ex}</span>
			</div>
		`
	}
	innerhtml("#hrrows",html,false)
}

function applyhrlanguage(){
	document.title=hrtext("title")+" - PokerTrace"
	innertext("#hrtitle",hrtext("title"),false)
	innertext("#back",hrtext("back"),false)
	innertext("#hrnote",hrtext("note"),false)
	renderhr()
}

applyhrlanguage()
