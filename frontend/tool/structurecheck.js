function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function sktext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["structurecheckpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["structurecheckpage"][key]||key
}

function calcsk(){
	let mult=num(getvalue("skmult"))
	let levelmin=num(getvalue("sklevelmin"))
	if(levelmin<=0||mult<1){
		innertext("#sklevelshr","-",false)
		innertext("#skgrowth","-",false)
		innertext("#skverdict","-",false)
		return
	}
	let levelsPerHour=60/levelmin
	let growth=Math.pow(mult,levelsPerHour)
	innertext("#sklevelshr",(Math.round(levelsPerHour*100)/100).toString(),false)
	innertext("#skgrowth",(Math.round(growth*100)/100)+"×",false)
	let verdict
	let color
	if(growth<2){
		verdict=sktext("slow")
		color="text-emerald-400"
	}else if(growth<=4){
		verdict=sktext("standard")
		color="text-zinc-200"
	}else{
		verdict=sktext("fast")
		color="text-red-400"
	}
	innertext("#skverdict",verdict,false)
	removeclass("#skverdict",["text-emerald-400","text-zinc-200","text-red-400"])
	addclass("#skverdict",[color])
}

function applysklanguage(){
	document.title=sktext("title")+" - PokerTrace"
	innertext("#sktitle",sktext("title"),false)
	innertext("#back",sktext("back"),false)
	innertext("#skmultlabel",sktext("mult"),false)
	innertext("#sklevelminlabel",sktext("levelmin"),false)
	innertext("#sklevelshrlabel",sktext("levelshr"),false)
	innertext("#skgrowthlabel",sktext("growth"),false)
	innertext("#skverdictlabel",sktext("verdict"),false)
	innertext("#sknote",sktext("note"),false)
}

oninput("#skmult",calcsk)
oninput("#sklevelmin",calcsk)

applysklanguage()
calcsk()
