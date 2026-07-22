function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function tstext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["tipsharepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["tipsharepage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcts(){
	let total=num(getvalue("tstotal"))
	let dealers=num(getvalue("tsdealers"))
	let floor=num(getvalue("tsfloor"))
	if(dealers<1){
		dealers=1
	}
	if(floor<0){floor=0}
	if(floor>100){floor=100}
	let floorcut=total*floor/100
	let pool=total-floorcut
	let each=pool/dealers
	innertext("#tsfloorcut","$"+moneyfmt(floorcut),false)
	innertext("#tspool","$"+moneyfmt(pool),false)
	innertext("#tseach","$"+moneyfmt(each),false)
}

function applytslanguage(){
	document.title=tstext("title")+" - PokerTrace"
	innertext("#tstitle",tstext("title"),false)
	innertext("#back",tstext("back"),false)
	innertext("#tstotallabel",tstext("total"),false)
	innertext("#tsdealerslabel",tstext("dealers"),false)
	innertext("#tsfloorlabel",tstext("floor"),false)
	innertext("#tsfloorcutlabel",tstext("floorcut"),false)
	innertext("#tspoollabel",tstext("pool"),false)
	innertext("#tseachlabel",tstext("each"),false)
	innertext("#tsnote",tstext("note"),false)
}

oninput("#tstotal",calcts)
oninput("#tsdealers",calcts)
oninput("#tsfloor",calcts)

applytslanguage()
calcts()
