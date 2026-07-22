let RAISESIZE=[
	{zh:"開池加注（線上）",en:"Open raise (online)",size:"2 – 2.5 BB"},
	{zh:"開池加注（實體）",en:"Open raise (live)",size:"2.5 – 3 BB +1/limper"},
	{zh:"隔離 limper",en:"Isolate limpers",size:"3 BB + 1 BB / limper"},
	{zh:"3-bet（有位置 IP）",en:"3-bet in position",size:"3× 開池"},
	{zh:"3-bet（無位置 OOP）",en:"3-bet out of position",size:"4× 開池"},
	{zh:"冷 3-bet",en:"Cold 3-bet",size:"略大於一般 3-bet"},
	{zh:"4-bet（IP）",en:"4-bet in position",size:"2.2 – 2.5× 該 3-bet"},
	{zh:"4-bet（OOP）",en:"4-bet out of position",size:"2.5 – 3× 該 3-bet"},
	{zh:"5-bet",en:"5-bet",size:"通常直接全下"},
	{zh:"短碼（< 25 BB）",en:"Short stack (< 25 BB)",size:"縮小至 2 – 2.2 BB 或直接全下"}
]

function rstext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["preflopsizepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["preflopsizepage"][key]||key
}

function renderrs(){
	let html=""
	for(let i=0;i<RAISESIZE.length;i=i+1){
		let r=RAISESIZE[i]
		let name=(function(){if(LANGUAGE=="en"){return r.en}return r.zh})()
		let size=r.size
		if(LANGUAGE=="en"){
			size=size.replace("開池","open").replace("該 3-bet","the 3-bet").replace("略大於一般 3-bet","Slightly above a normal 3-bet").replace("通常直接全下","Usually all-in").replace("縮小至","Shrink to").replace("或直接全下","or jam")
		}
		html=html+`
			<div class="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<span class="text-zinc-200">${name}</span>
				<span class="font-mono font-bold text-emerald-400">${size}</span>
			</div>
		`
	}
	innerhtml("#rsrows",html,false)
}

function applyrslanguage(){
	document.title=rstext("title")+" - PokerTrace"
	innertext("#rstitle",rstext("title"),false)
	innertext("#back",rstext("back"),false)
	innertext("#rsnote",rstext("note"),false)
	renderrs()
}

applyrslanguage()
