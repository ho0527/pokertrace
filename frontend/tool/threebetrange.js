let THREEBET=[
	{zh:"3-bet 價值（vs 前位開池）",en:"3-bet value (vs early open)","rangezh":"QQ+, AK","rangeen":"QQ+, AK"},
	{zh:"3-bet 價值（vs 後位開池）",en:"3-bet value (vs late open)","rangezh":"99+, AQ+, KQs","rangeen":"99+, AQ+, KQs"},
	{zh:"3-bet 詐唬（含阻擋牌）",en:"3-bet bluff (with blockers)","rangezh":"A5s–A2s, KQs, K9s, suited 連張","rangeen":"A5s–A2s, KQs, K9s, suited connectors"},
	{zh:"冷 3-bet（vs 開池＋跟注）",en:"Cold 3-bet (vs open + caller)","rangezh":"偏價值：TT+, AQ+","rangeen":"value-heavy: TT+, AQ+"},
	{zh:"4-bet 價值",en:"4-bet value","rangezh":"KK+, AKs（依深度可含 QQ/AK）","rangeen":"KK+, AKs (may include QQ/AK by depth)"},
	{zh:"4-bet 詐唬（含 A 阻擋）",en:"4-bet bluff (with ace blocker)","rangezh":"A5s, A4s 等","rangeen":"A5s, A4s etc."},
	{zh:"面對 4-bet 跟注",en:"Calling a 4-bet","rangezh":"視底池賠率與深度，常見 JJ–QQ、AK","rangeen":"depends on pot odds and depth; commonly JJ–QQ, AK"},
	{zh:"短碼（< 25 BB）3-bet",en:"Short-stack (< 25 BB) 3-bet","rangezh":"多以全下取代，少用小 3-bet","rangeen":"mostly replaced by jams; small 3-bets rare"}
]

function trtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["threebetrangepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["threebetrangepage"][key]||key
}

function rendertr(){
	let html=""
	for(let i=0;i<THREEBET.length;i=i+1){
		let t=THREEBET[i]
		let name=(function(){if(LANGUAGE=="en"){return t.en}return t.zh})()
		let range=(function(){if(LANGUAGE=="en"){return t.rangeen}return t.rangezh})()
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<div class="font-bold text-white">${name}</div>
				<div class="mt-1 font-mono text-sm text-emerald-400">${range}</div>
			</div>
		`
	}
	innerhtml("#trrows",html,false)
}

function applytrlanguage(){
	document.title=trtext("title")+" - PokerTrace"
	innertext("#trtitle",trtext("title"),false)
	innertext("#back",trtext("back"),false)
	innertext("#trnote",trtext("note"),false)
	rendertr()
}

applytrlanguage()
