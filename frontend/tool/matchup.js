let MATCHUPS=[
	{zh:"大對 vs 小對",en:"Bigger pair vs smaller pair",ex:"AA vs KK",eq:"82% / 18%"},
	{zh:"對子 vs 兩張低張",en:"Pair vs two undercards",ex:"TT vs 76s",eq:"79% / 21%"},
	{zh:"對子 vs 兩張高張（翻硬幣）",en:"Pair vs two overcards (coinflip)",ex:"88 vs AKo",eq:"55% / 45%"},
	{zh:"對子 vs 一高一低",en:"Pair vs one over one under",ex:"88 vs A6o",eq:"71% / 29%"},
	{zh:"優勢同點（踢腳被支配）",en:"Dominating kicker",ex:"AK vs AQ",eq:"74% / 26%"},
	{zh:"AK vs 比它小的對",en:"AK vs a lower pair",ex:"AK vs QQ",eq:"44% / 56%"},
	{zh:"AK vs 小對（接近翻硬幣）",en:"AK vs a small pair",ex:"AK vs 22",eq:"48% / 52%"},
	{zh:"兩張高張 vs 兩張低張",en:"Two high cards vs two low cards",ex:"AKo vs QJs",eq:"61% / 39%"},
	{zh:"被支配（高一張 + 活一張）",en:"Dominated (one card live)",ex:"KQ vs AK",eq:"26% / 74%"},
	{zh:"花色相連 vs 大對",en:"Suited connector vs big pair",ex:"JTs vs AA",eq:"21% / 79%"},
	{zh:"兩高張 vs 一支配一活",en:"Two overs vs one dominated",ex:"AJ vs KQ",eq:"59% / 41%"}
]

function mutext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["matchuppage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["matchuppage"][key]||key
}

function rendermatchups(){
	let html=""
	for(let i=0;i<MATCHUPS.length;i=i+1){
		let m=MATCHUPS[i]
		let label=(function(){if(LANGUAGE=="en"){return m.en}return m.zh})()
		html=html+`
			<div class="grid grid-cols-12 gap-px bg-zinc-800">
				<div class="col-span-6 bg-zinc-950/60 px-4 py-3 text-zinc-200">${label}</div>
				<div class="col-span-3 bg-zinc-950/60 px-4 py-3 font-mono text-zinc-400">${m.ex}</div>
				<div class="col-span-3 bg-zinc-950/60 px-4 py-3 text-right font-mono font-bold text-emerald-400">${m.eq}</div>
			</div>
		`
	}
	innerhtml("#murows",html,false)
}

function applymulanguage(){
	document.title=mutext("title")+" - PokerTrace"
	innertext("#mutitle",mutext("title"),false)
	innertext("#back",mutext("back"),false)
	innertext("#muhcase",mutext("hcase"),false)
	innertext("#muhexample",mutext("hexample"),false)
	innertext("#muhequity",mutext("hequity"),false)
	innertext("#munote",mutext("note"),false)
	rendermatchups()
}

applymulanguage()
