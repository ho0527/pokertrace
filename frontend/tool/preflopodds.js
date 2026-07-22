let PREFLOPODDS=[
	{zh:"拿到 AA（指定一對）",en:"Dealt AA (a specific pair)",p:"0.45%"},
	{zh:"拿到任一口袋對",en:"Dealt any pocket pair",p:"5.9%"},
	{zh:"拿到 AK（含同花）",en:"Dealt AK (any)",p:"1.2%"},
	{zh:"拿到 AKs（指定同花）",en:"Dealt AKs (suited)",p:"0.30%"},
	{zh:"拿到兩張同花",en:"Dealt two suited cards",p:"23.5%"},
	{zh:"拿到一張 A",en:"Dealt at least one ace",p:"15%"},
	{zh:"口袋對翻牌中三條（set）",en:"Pocket pair flops a set",p:"11.8%"},
	{zh:"同花起手翻牌中同花聽牌",en:"Suited hand flops a flush draw",p:"11%"},
	{zh:"同花起手翻牌直接成同花",en:"Suited hand flops a flush",p:"0.84%"},
	{zh:"未成對起手翻牌中一對",en:"Unpaired hand flops a pair",p:"32%"},
	{zh:"AKs vs 任一較小對 ≈ 翻硬幣",en:"AKs vs a smaller pair ≈ coinflip",p:"~50%"}
]

function pptext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["preflopoddspage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["preflopoddspage"][key]||key
}

function renderpp(){
	let html=""
	for(let i=0;i<PREFLOPODDS.length;i=i+1){
		let o=PREFLOPODDS[i]
		let name=(function(){if(LANGUAGE=="en"){return o.en}return o.zh})()
		html=html+`
			<div class="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<span class="text-zinc-200">${name}</span>
				<span class="font-mono font-bold text-emerald-400">${o.p}</span>
			</div>
		`
	}
	innerhtml("#pprows",html,false)
}

function applypplanguage(){
	document.title=pptext("title")+" - PokerTrace"
	innertext("#pptitle",pptext("title"),false)
	innertext("#back",pptext("back"),false)
	innertext("#ppnote",pptext("note"),false)
	renderpp()
}

applypplanguage()
