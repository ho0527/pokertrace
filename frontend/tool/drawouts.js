let DRAWS=[
	{zh:"同花聽牌",en:"Flush draw",outs:9},
	{zh:"兩頭順",en:"Open-ended straight",outs:8},
	{zh:"卡順（內聽）",en:"Gutshot straight",outs:4},
	{zh:"兩張高張",en:"Two overcards",outs:6},
	{zh:"同花 + 兩頭順",en:"Flush + open-ender",outs:15},
	{zh:"同花 + 卡順",en:"Flush + gutshot",outs:12},
	{zh:"一對補三條",en:"Pair to set/trips",outs:2},
	{zh:"三條補葫蘆或四條",en:"Set to full house / quads",outs:7},
	{zh:"兩對補葫蘆",en:"Two pair to full house",outs:4},
	{zh:"一對 + 卡順",en:"Pair + gutshot",outs:6}
]

function dotext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["drawoutspage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["drawoutspage"][key]||key
}

function pct(value){
	if(value>100){
		value=100
	}
	return value+"%"
}

function renderdo(){
	let html=""
	for(let i=0;i<DRAWS.length;i=i+1){
		let d=DRAWS[i]
		let name=(function(){if(LANGUAGE=="en"){return d.en}return d.zh})()
		let turn=d.outs*2
		let river=d.outs*4
		html=html+`
			<div class="grid grid-cols-12 gap-px bg-zinc-800">
				<div class="col-span-6 bg-zinc-950/60 px-4 py-3 text-zinc-200">${name}</div>
				<div class="col-span-2 bg-zinc-950/60 px-4 py-3 text-right font-mono text-zinc-400">${d.outs}</div>
				<div class="col-span-2 bg-zinc-950/60 px-4 py-3 text-right font-mono text-zinc-300">${pct(turn)}</div>
				<div class="col-span-2 bg-zinc-950/60 px-4 py-3 text-right font-mono font-bold text-emerald-400">${pct(river)}</div>
			</div>
		`
	}
	innerhtml("#dorows",html,false)
}

function applydolanguage(){
	document.title=dotext("title")+" - PokerTrace"
	innertext("#dotitle",dotext("title"),false)
	innertext("#back",dotext("back"),false)
	innertext("#dohdraw",dotext("hdraw"),false)
	innertext("#dohouts",dotext("houts"),false)
	innertext("#dohturn",dotext("hturn"),false)
	innertext("#dohriver",dotext("hriver"),false)
	innertext("#donote",dotext("note"),false)
	renderdo()
}

applydolanguage()
