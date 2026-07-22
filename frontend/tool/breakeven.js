function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function betext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["breakevenpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["breakevenpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcbe(){
	let cost=num(getvalue("becost"))
	let fee=num(getvalue("befee"))
	let per=num(getvalue("beper"))
	let guarantee=num(getvalue("beguarantee"))
	let guarentries=0
	if(guarantee>0){
		if(per>0){
			guarentries=Math.ceil(guarantee/per)
		}else{
			guarentries=Infinity
		}
	}
	let benooverlay=(function(){if(fee>0){return cost/fee}return Infinity})()
	let beoverlay=(function(){if((fee+per)>0){return (cost+guarantee)/(fee+per)}return Infinity})()
	let value
	if(benooverlay>=guarentries){
		value=benooverlay
	}else{
		value=beoverlay
	}
	let be=betext("never")
	if(isFinite(value)){
		be=Math.ceil(value)+" "+betext("people")
	}
	let guar=betext("never")
	if(isFinite(guarentries)){
		guar="-"
		if(guarentries>0){
			guar=guarentries+" "+betext("people")
		}
	}
	innertext("#bebe",be,false)
	innertext("#beguar",guar,false)
	innertext("#beoverlay","$"+moneyfmt(per),false)
}

function applybelanguage(){
	document.title=betext("title")+" - PokerTrace"
	innertext("#betitle",betext("title"),false)
	innertext("#back",betext("back"),false)
	innertext("#becostlabel",betext("cost"),false)
	innertext("#befeelabel",betext("fee"),false)
	innertext("#beperlabel",betext("per"),false)
	innertext("#beguaranteelabel",betext("guarantee"),false)
	innertext("#bebelabel",betext("be"),false)
	innertext("#beguarlabel",betext("guar"),false)
	innertext("#beoverlaylabel",betext("overlay"),false)
	innertext("#benote",betext("note"),false)
}

oninput("#becost",calcbe)
oninput("#befee",calcbe)
oninput("#beper",calcbe)
oninput("#beguarantee",calcbe)

applybelanguage()
calcbe()
