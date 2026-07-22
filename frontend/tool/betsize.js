function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function bstext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["betsizepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["betsizepage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcbetsize(){
	let pot=num(getvalue("bspot"))
	let overbet=num(getvalue("bsoverbet"))
	if(overbet<1){
		overbet=1
	}
	let fractions=[
		{label:"1/3",f:1/3},
		{label:"1/2",f:1/2},
		{label:"2/3",f:2/3},
		{label:"3/4",f:3/4},
		{label:bstext("potlabel"),f:1},
		{label:"Overbet "+overbet+"x",f:overbet}
	]
	let html=""
	for(let i=0;i<fractions.length;i=i+1){
		let bet=pot*fractions[i].f
		let need=(function(){if(bet>0){return bet/(pot+2*bet)*100}return 0})()
		html=html+`
			<div class="grid grid-cols-3 gap-px bg-zinc-800">
				<div class="bg-zinc-950/60 px-4 py-3 font-bold text-white">${fractions[i].label}</div>
				<div class="bg-zinc-950/60 px-4 py-3 text-right font-mono text-emerald-400">$${moneyfmt(bet)}</div>
				<div class="bg-zinc-950/60 px-4 py-3 text-right font-mono text-zinc-300">${Math.round(need*10)/10}%</div>
			</div>
		`
	}
	innerhtml("#bsrows",html,false)
}

function applybslanguage(){
	document.title=bstext("title")+" - PokerTrace"
	innertext("#bstitle",bstext("title"),false)
	innertext("#back",bstext("back"),false)
	innertext("#bspotlabel",bstext("pot"),false)
	innertext("#bsoverbetlabel",bstext("overbet"),false)
	innertext("#bshfraction",bstext("hfraction"),false)
	innertext("#bshamount",bstext("hamount"),false)
	innertext("#bshneed",bstext("hneed"),false)
	innertext("#bsnote",bstext("note"),false)
	calcbetsize()
}

oninput("#bspot",calcbetsize)
oninput("#bsoverbet",calcbetsize)

applybslanguage()
calcbetsize()
