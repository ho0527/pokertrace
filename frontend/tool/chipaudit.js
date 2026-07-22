function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function catext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["chipauditpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["chipauditpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcca(){
	let entries=num(getvalue("caentries"))
	let start=num(getvalue("castart"))
	let rebuycount=num(getvalue("carebuycount"))
	let rebuychip=num(getvalue("carebuychip"))
	let addoncount=num(getvalue("caaddoncount"))
	let addonchip=num(getvalue("caaddonchip"))
	let actual=num(getvalue("caactual"))
	let expected=entries*start+rebuycount*rebuychip+addoncount*addonchip
	let diff=actual-expected
	innertext("#caexpected",moneyfmt(expected),false)
	innertext("#cacounted",moneyfmt(actual),false)
	innertext("#cadiff",((function(){if(diff>0){return "+"}return (function(){if(diff<0){return "-"}return ""})()})())+moneyfmt(Math.abs(diff)),false)
	removeclass("#cadiff",["text-emerald-400","text-red-400","text-amber-400"])
	addclass("#cadiff",[(diff==0?"text-emerald-400":(diff<0?"text-red-400":"text-amber-400"))])
}

function applycalanguage(){
	document.title=catext("title")+" - PokerTrace"
	innertext("#catitle",catext("title"),false)
	innertext("#back",catext("back"),false)
	innertext("#caentrieslabel",catext("entries"),false)
	innertext("#castartlabel",catext("start"),false)
	innertext("#carebuycountlabel",catext("rebuycount"),false)
	innertext("#carebuychiplabel",catext("rebuychip"),false)
	innertext("#caaddoncountlabel",catext("addoncount"),false)
	innertext("#caaddonchiplabel",catext("addonchip"),false)
	innertext("#caactuallabel",catext("actual"),false)
	innertext("#caexpectedlabel",catext("expected"),false)
	innertext("#cacountedlabel",catext("counted"),false)
	innertext("#cadifflabel",catext("diff"),false)
	innertext("#canote",catext("note"),false)
}

oninput("#caentries",calcca)
oninput("#castart",calcca)
oninput("#carebuycount",calcca)
oninput("#carebuychip",calcca)
oninput("#caaddoncount",calcca)
oninput("#caaddonchip",calcca)
oninput("#caactual",calcca)

applycalanguage()
calcca()
