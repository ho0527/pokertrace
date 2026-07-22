function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function rctext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["cashreconcilepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["cashreconcilepage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcrc(){
	let entries=num(getvalue("rcentries"))
	let entryfee=num(getvalue("rcentryfee"))
	let rebuycount=num(getvalue("rcrebuycount"))
	let rebuyamt=num(getvalue("rcrebuyamt"))
	let addoncount=num(getvalue("rcaddoncount"))
	let addonamt=num(getvalue("rcaddonamt"))
	let refund=num(getvalue("rcrefund"))
	let actual=num(getvalue("rcactual"))
	let due=entries*entryfee+rebuycount*rebuyamt+addoncount*addonamt-refund
	let diff=actual-due
	innertext("#rcdue","$"+moneyfmt(due),false)
	innertext("#rcgot","$"+moneyfmt(actual),false)
	innertext("#rcdiff",((function(){if(diff>0){return "+$"}return (function(){if(diff<0){return "-$"}return "$"})()})())+moneyfmt(Math.abs(diff)),false)
	removeclass("#rcdiff",["text-emerald-400","text-red-400","text-amber-400"])
	addclass("#rcdiff",[(diff==0?"text-emerald-400":(diff<0?"text-red-400":"text-amber-400"))])
}

function applyrclanguage(){
	document.title=rctext("title")+" - PokerTrace"
	innertext("#rctitle",rctext("title"),false)
	innertext("#back",rctext("back"),false)
	innertext("#rcentrieslabel",rctext("entries"),false)
	innertext("#rcentryfeelabel",rctext("entryfee"),false)
	innertext("#rcrebuycountlabel",rctext("rebuycount"),false)
	innertext("#rcrebuyamtlabel",rctext("rebuyamt"),false)
	innertext("#rcaddoncountlabel",rctext("addoncount"),false)
	innertext("#rcaddonamtlabel",rctext("addonamt"),false)
	innertext("#rcrefundlabel",rctext("refund"),false)
	innertext("#rcactuallabel",rctext("actual"),false)
	innertext("#rcduelabel",rctext("due"),false)
	innertext("#rcgotlabel",rctext("got"),false)
	innertext("#rcdifflabel",rctext("diff"),false)
	innertext("#rcnote",rctext("note"),false)
}

oninput("#rcentries",calcrc)
oninput("#rcentryfee",calcrc)
oninput("#rcrebuycount",calcrc)
oninput("#rcrebuyamt",calcrc)
oninput("#rcaddoncount",calcrc)
oninput("#rcaddonamt",calcrc)
oninput("#rcrefund",calcrc)
oninput("#rcactual",calcrc)

applyrclanguage()
calcrc()
