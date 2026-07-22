function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function sttext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["staffpaypage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["staffpaypage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcst(){
	let hourly=num(getvalue("sthourly"))
	let hours=num(getvalue("sthours"))
	let bonus=num(getvalue("stbonus"))
	let transport=num(getvalue("sttransport"))
	let count=num(getvalue("stcount"))
	if(count<1){
		count=1
	}
	let base=hourly*hours
	let per=base+bonus+transport
	let total=per*count
	innertext("#stper","$"+moneyfmt(per),false)
	innertext("#stbase","$"+moneyfmt(base),false)
	innertext("#sttotal","$"+moneyfmt(total),false)
}

function applystlanguage(){
	document.title=sttext("title")+" - PokerTrace"
	innertext("#sttitle",sttext("title"),false)
	innertext("#back",sttext("back"),false)
	innertext("#sthourlylabel",sttext("hourly"),false)
	innertext("#sthourslabel",sttext("hours"),false)
	innertext("#stbonuslabel",sttext("bonus"),false)
	innertext("#sttransportlabel",sttext("transport"),false)
	innertext("#stcountlabel",sttext("count"),false)
	innertext("#stperlabel",sttext("per"),false)
	innertext("#stbaselabel",sttext("base"),false)
	innertext("#sttotallabel",sttext("total"),false)
	innertext("#stnote",sttext("note"),false)
}

oninput("#sthourly",calcst)
oninput("#sthours",calcst)
oninput("#stbonus",calcst)
oninput("#sttransport",calcst)
oninput("#stcount",calcst)

applystlanguage()
calcst()
