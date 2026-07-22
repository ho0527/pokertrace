function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function sprtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["sprpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["sprpage"][key]||key
}

function calcspr(){
	let stack=num(getvalue("sprstack"))
	let pot=num(getvalue("sprpot"))
	if(pot<=0){
		innertext("#sprvalue","-",false)
		innertext("#sprzone","-",false)
		innertext("#sprguide",sprtext("guidenone"),false)
		return
	}
	let spr=stack/pot
	innertext("#sprvalue",(Math.round(spr*10)/10).toString(),false)
	let zone
	let guide
	let color
	if(spr<3){
		zone=sprtext("zonelow")
		guide=sprtext("guidelow")
		color="text-red-400"
	}else if(spr<=6){
		zone=sprtext("zonemid")
		guide=sprtext("guidemid")
		color="text-amber-400"
	}else{
		zone=sprtext("zonehigh")
		guide=sprtext("guidehigh")
		color="text-emerald-400"
	}
	innertext("#sprzone",zone,false)
	innertext("#sprguide",guide,false)
	removeclass("#sprzone",["text-red-400","text-amber-400","text-emerald-400"])
	addclass("#sprzone",[color])
}

function applysprlanguage(){
	document.title=sprtext("title")+" - PokerTrace"
	innertext("#sprtitle",sprtext("title"),false)
	innertext("#back",sprtext("back"),false)
	innertext("#sprstacklabel",sprtext("stack"),false)
	innertext("#sprpotlabel",sprtext("pot"),false)
	innertext("#sprvaluelabel",sprtext("value"),false)
	innertext("#sprzonelabel",sprtext("zone"),false)
	innertext("#sprnote",sprtext("note"),false)
	calcspr()
}

oninput("#sprstack",calcspr)
oninput("#sprpot",calcspr)

applysprlanguage()
calcspr()
