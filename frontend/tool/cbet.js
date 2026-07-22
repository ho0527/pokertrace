let CBET=[
	{zh:"乾燥高張面",en:"Dry high board",ex:"K♠ 7♦ 2♣",freqZh:"高頻 (~70-90%)",freqEn:"High (~70-90%)",sizeZh:"小尺寸 1/4–1/3 底池",sizeEn:"Small 1/4-1/3 pot"},
	{zh:"中低乾燥面",en:"Dry low board",ex:"8♣ 5♦ 2♠",freqZh:"中高頻",freqEn:"Medium-high",sizeZh:"小尺寸 1/3 底池",sizeEn:"Small ~1/3 pot"},
	{zh:"濕潤聽牌面",en:"Wet draw-heavy board",ex:"9♠ 8♠ 6♥",freqZh:"低頻、極化",freqEn:"Low, polarized",sizeZh:"大尺寸 2/3–滿池",sizeEn:"Large 2/3-pot"},
	{zh:"雙高張面",en:"Two broadway board",ex:"A♦ Q♣ 5♥",freqZh:"中頻、看範圍",freqEn:"Medium, range-dependent",sizeZh:"中小尺寸",sizeEn:"Small-medium"},
	{zh:"對子面",en:"Paired board",ex:"7♠ 7♦ 3♣",freqZh:"高頻、可小注",freqEn:"High, small bet",sizeZh:"小尺寸",sizeEn:"Small"},
	{zh:"單色三張",en:"Monotone board",ex:"K♥ 9♥ 4♥",freqZh:"低頻、謹慎",freqEn:"Low, cautious",sizeZh:"視同花持有調整",sizeEn:"Adjust by flush holdings"}
]

function cbtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["cbetpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["cbetpage"][key]||key
}

function rendercb(){
	let html=""
	for(let i=0;i<CBET.length;i=i+1){
		let c=CBET[i]
		let name=(function(){if(LANGUAGE=="en"){return c.en}return c.zh})()
		let freq=(function(){if(LANGUAGE=="en"){return c.freqEn}return c.freqZh})()
		let size=(function(){if(LANGUAGE=="en"){return c.sizeEn}return c.sizeZh})()
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<div class="flex flex-wrap items-baseline justify-between gap-2">
					<span class="font-bold text-white">${name}</span>
					<span class="font-mono text-sm text-zinc-500">${c.ex}</span>
				</div>
				<div class="mt-1 flex flex-wrap gap-x-6 text-sm">
					<span class="text-emerald-400">${freq}</span>
					<span class="text-zinc-400">${size}</span>
				</div>
			</div>
		`
	}
	innerhtml("#cbrows",html,false)
}

function applycblanguage(){
	document.title=cbtext("title")+" - PokerTrace"
	innertext("#cbtitle",cbtext("title"),false)
	innertext("#back",cbtext("back"),false)
	innertext("#cbnote",cbtext("note"),false)
	rendercb()
}

applycblanguage()
