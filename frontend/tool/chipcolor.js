let CHIPCOLORS=[
	{zh:"白色",en:"White",hex:"#f8fafc",val:"1"},
	{zh:"紅色",en:"Red",hex:"#ef4444",val:"5"},
	{zh:"藍色",en:"Blue",hex:"#3b82f6",val:"10"},
	{zh:"綠色",en:"Green",hex:"#22c55e",val:"25"},
	{zh:"黑色",en:"Black",hex:"#1f2937",val:"100"},
	{zh:"紫色",en:"Purple",hex:"#a855f7",val:"500"},
	{zh:"黃色",en:"Yellow",hex:"#eab308",val:"1,000"},
	{zh:"粉紅",en:"Pink",hex:"#ec4899",val:"5,000"},
	{zh:"橘色",en:"Orange",hex:"#f97316",val:"10,000"},
	{zh:"淺藍",en:"Light Blue",hex:"#38bdf8",val:"25,000"}
]

function cctext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["chipcolorpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["chipcolorpage"][key]||key
}

function rendercc(){
	let html=""
	for(let i=0;i<CHIPCOLORS.length;i=i+1){
		let c=CHIPCOLORS[i]
		let name=(function(){if(LANGUAGE=="en"){return c.en}return c.zh})()
		html=html+`
			<div class="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<span class="h-7 w-7 rounded-full border border-zinc-600" data-cccolor="${c.hex}"></span>
				<span class="flex-1 font-bold text-white">${name}</span>
				<span class="font-mono text-emerald-400">$${c.val}</span>
			</div>
		`
	}
	innerhtml("#ccrows",html,false)
	let colorlist=document.querySelectorAll("[data-cccolor]")
	for(let i=0;i<colorlist.length;i=i+1){
		colorlist[i].style.background=colorlist[i].getAttribute("data-cccolor")
	}
}

function applycclanguage(){
	document.title=cctext("title")+" - PokerTrace"
	innertext("#cctitle",cctext("title"),false)
	innertext("#back",cctext("back"),false)
	innertext("#ccnote",cctext("note"),false)
	rendercc()
}

applycclanguage()
