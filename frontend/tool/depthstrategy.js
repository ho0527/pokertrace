function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function dstext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["depthstrategypage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["depthstrategypage"][key]||key
}

function calcds(){
	let stack=num(getvalue("dsstack"))
	let bb=num(getvalue("dsbb"))
	if(bb<=0){
		innertext("#dsbbcount","-",false)
		innertext("#dszone","-",false)
		innertext("#dsadvice",dstext("advicenone"),false)
		return
	}
	let count=stack/bb
	innertext("#dsbbcount",(Math.round(count*10)/10)+" BB",false)
	let zone
	let advice
	let color
	if(count>100){
		zone=dstext("zonedeep")
		advice=dstext("advicedeep")
		color="text-emerald-400"
	}else if(count>40){
		zone=dstext("zonenormal")
		advice=dstext("advicenormal")
		color="text-emerald-400"
	}else if(count>25){
		zone=dstext("zonemid")
		advice=dstext("advicemid")
		color="text-amber-400"
	}else if(count>15){
		zone=dstext("zoneshort")
		advice=dstext("adviceshort")
		color="text-amber-400"
	}else{
		zone=dstext("zonepush")
		advice=dstext("advicepush")
		color="text-red-400"
	}
	innertext("#dszone",zone,false)
	innertext("#dsadvice",advice,false)
	removeclass("#dszone",["text-emerald-400","text-amber-400","text-red-400"])
	addclass("#dszone",[color])
}

function applydslanguage(){
	document.title=dstext("title")+" - PokerTrace"
	innertext("#dstitle",dstext("title"),false)
	innertext("#back",dstext("back"),false)
	innertext("#dsstacklabel",dstext("stack"),false)
	innertext("#dsbblabel",dstext("bb"),false)
	innertext("#dsbbcountlabel",dstext("bbcount"),false)
	innertext("#dszonelabel",dstext("zonelabel"),false)
	innertext("#dsnote",dstext("note"),false)
	calcds()
}

oninput("#dsstack",calcds)
oninput("#dsbb",calcds)

applydslanguage()
calcds()
