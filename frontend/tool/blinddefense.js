let BLINDDEF=[
	{pos:"UTG",defend:"~ 30-35%",zh:"對手最緊，防守也最緊，偏跟強牌與少量 3-bet。",en:"Opener tightest; defend tight, call strong hands with few 3-bets."},
	{pos:"MP",defend:"~ 35-40%",zh:"略放寬，加入更多同花連張跟注。",en:"Slightly wider; add more suited connectors to the calling range."},
	{pos:"CO",defend:"~ 40-50%",zh:"開池變寬，防守隨之放寬，3-bet 頻率提高。",en:"Opens widen, so defend wider and 3-bet more often."},
	{pos:"BTN",defend:"~ 50-60%+",zh:"對手最寬、底池賠率好，可大幅放寬跟注與 3-bet。",en:"Widest opens and best odds; defend very wide with calls and 3-bets."},
	{pos:"SB",defend:"~ 45-55%",zh:"面對小盲偷盲，憑位置與底池賠率寬防守。",en:"Vs a small-blind steal, defend wide given odds despite position."}
]

function bdtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["blinddefensepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["blinddefensepage"][key]||key
}

function renderbd(){
	let html=""
	for(let i=0;i<BLINDDEF.length;i=i+1){
		let b=BLINDDEF[i]
		let note=(function(){if(LANGUAGE=="en"){return b.en}return b.zh})()
		html=html+`
			<div class="grid grid-cols-12 gap-px bg-zinc-800">
				<div class="col-span-3 bg-zinc-950/60 px-4 py-3 font-mono font-bold text-emerald-400">${b.pos}</div>
				<div class="col-span-3 bg-zinc-950/60 px-4 py-3 text-right font-mono text-zinc-200">${b.defend}</div>
				<div class="col-span-6 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-400">${note}</div>
			</div>
		`
	}
	innerhtml("#bdrows",html,false)
}

function applybdlanguage(){
	document.title=bdtext("title")+" - PokerTrace"
	innertext("#bdtitle",bdtext("title"),false)
	innertext("#back",bdtext("back"),false)
	innertext("#bdhpos",bdtext("hpos"),false)
	innertext("#bdhdefend",bdtext("hdefend"),false)
	innertext("#bdhnote",bdtext("hnote"),false)
	innertext("#bdnote",bdtext("note"),false)
	renderbd()
}

applybdlanguage()
