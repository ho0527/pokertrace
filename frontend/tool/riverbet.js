let RIVERBET=[
	{zh:"厚價值（堅果級）",en:"Thick value (near-nuts)",freqZh:"高頻下注",freqEn:"Bet often",sizeZh:"大尺寸 2/3–滿池或 overbet",sizeEn:"Large 2/3-pot to overbet"},
	{zh:"中等價值",en:"Medium value",freqZh:"看對手",freqEn:"Opponent-dependent",sizeZh:"中尺寸 1/2 底池",sizeEn:"Medium ~1/2 pot"},
	{zh:"薄價值",en:"Thin value",freqZh:"選擇性下注",freqEn:"Selective",sizeZh:"小尺寸 1/4–1/3",sizeEn:"Small 1/4-1/3"},
	{zh:"純詐唬（無攤牌價值）",en:"Pure bluff (no showdown value)",freqZh:"配合下注尺寸的比例",freqEn:"Balanced to bet size",sizeZh:"與價值同尺寸保持平衡",sizeEn:"Match value size for balance"},
	{zh:"邊緣攤牌牌力",en:"Marginal showdown value",freqZh:"多過牌看牌",freqEn:"Mostly check",sizeZh:"避免下注被更好牌跟",sizeEn:"Avoid betting into better"}
]

function rvtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["riverbetpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["riverbetpage"][key]||key
}

function renderrv(){
	let html=""
	for(let i=0;i<RIVERBET.length;i=i+1){
		let r=RIVERBET[i]
		let name=(function(){if(LANGUAGE=="en"){return r.en}return r.zh})()
		let freq=(function(){if(LANGUAGE=="en"){return r.freqEn}return r.freqZh})()
		let size=(function(){if(LANGUAGE=="en"){return r.sizeEn}return r.sizeZh})()
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<div class="font-bold text-white">${name}</div>
				<div class="mt-1 flex flex-wrap gap-x-6 text-sm">
					<span class="text-emerald-400">${freq}</span>
					<span class="text-zinc-400">${size}</span>
				</div>
			</div>
		`
	}
	innerhtml("#rvrows",html,false)
}

function applyrvlanguage(){
	document.title=rvtext("title")+" - PokerTrace"
	innertext("#rvtitle",rvtext("title"),false)
	innertext("#back",rvtext("back"),false)
	innertext("#rvnote",rvtext("note"),false)
	renderrv()
}

applyrvlanguage()
