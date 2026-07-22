let POSITIONS=[
	{abbr:"UTG",zh:"槍口位",en:"Under the Gun",noteZh:"翻牌前最先行動，最緊，只開強牌。",noteEn:"First to act preflop; tightest, open only strong hands."},
	{abbr:"UTG+1",zh:"槍口+1",en:"UTG+1",noteZh:"前位，範圍仍偏緊。",noteEn:"Early position; still a tight range."},
	{abbr:"MP",zh:"中間位",en:"Middle Position",noteZh:"範圍可略放寬，仍需注意後位。",noteEn:"Range widens slightly; mind players behind."},
	{abbr:"LJ",zh:"前劫位",en:"Lojack",noteZh:"中後位過渡，可加入更多同花連張。",noteEn:"Transition to late position; add suited connectors."},
	{abbr:"HJ",zh:"後劫位",en:"Hijack",noteZh:"接近後位，偷盲機會增加。",noteEn:"Near late position; more steal opportunities."},
	{abbr:"CO",zh:"關煞位",en:"Cutoff",noteZh:"次佳位置，偷盲與隔離加注的好位。",noteEn:"Second-best seat; great for steals and isolation."},
	{abbr:"BTN",zh:"莊位",en:"Button",noteZh:"最有利，永遠最後行動，範圍最寬。",noteEn:"Best seat; always acts last, widest range."},
	{abbr:"SB",zh:"小盲",en:"Small Blind",noteZh:"已投入半個大盲，翻牌後位置最差。",noteEn:"Posts half a BB; worst postflop position."},
	{abbr:"BB",zh:"大盲",en:"Big Blind",noteZh:"已投入一個大盲，面對偷盲可較寬防守。",noteEn:"Posts a full BB; can defend wider vs steals."}
]

function pztext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["positionspage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["positionspage"][key]||key
}

function renderpz(){
	let html=""
	for(let i=0;i<POSITIONS.length;i=i+1){
		let p=POSITIONS[i]
		let name=(function(){if(LANGUAGE=="en"){return p.en}return p.zh})()
		let note=(function(){if(LANGUAGE=="en"){return p.noteEn}return p.noteZh})()
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<div class="flex items-baseline gap-3">
					<span class="w-16 font-mono font-extrabold text-emerald-400">${p.abbr}</span>
					<span class="font-bold text-white">${name}</span>
				</div>
				<div class="mt-1 text-sm text-zinc-400">${note}</div>
			</div>
		`
	}
	innerhtml("#pzrows",html,false)
}

function applypzlanguage(){
	document.title=pztext("title")+" - PokerTrace"
	innertext("#pztitle",pztext("title"),false)
	innertext("#back",pztext("back"),false)
	innertext("#pznote",pztext("note"),false)
	renderpz()
}

applypzlanguage()
