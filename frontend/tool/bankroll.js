function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function brtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["bankrollpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["bankrollpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

let BRTABLE={
	mtt:{cons:200,std:100,agg:50},
	pko:{cons:250,std:150,agg:75},
	sng:{cons:100,std:50,agg:30},
	cash:{cons:40,std:25,agg:15}
}

function calcbr(){
	let type=getvalue("brtype")
	let buyin=num(getvalue("brbuyin"))
	let t=BRTABLE[type]||BRTABLE.mtt
	innertext("#brcons",t.cons+" × = $"+moneyfmt(t.cons*buyin),false)
	innertext("#brstd",t.std+" × = $"+moneyfmt(t.std*buyin),false)
	innertext("#bragg",t.agg+" × = $"+moneyfmt(t.agg*buyin),false)
}

function applybrlanguage(){
	document.title=brtext("title")+" - PokerTrace"
	innertext("#brtitle",brtext("title"),false)
	innertext("#back",brtext("back"),false)
	innertext("#brtypelabel",brtext("type"),false)
	innertext("#brbuyinlabel",brtext("buyin"),false)
	innertext("#brconslabel",brtext("cons"),false)
	innertext("#brstdlabel",brtext("std"),false)
	innertext("#bragglabel",brtext("agg"),false)
	innertext("#brnote",brtext("note"),false)
	let opts=document.querySelectorAll("#brtype option")
	for(let i=0;i<opts.length;i=i+1){
		opts[i].textContent=brtext("opt_"+opts[i].value)
	}
	calcbr()
}

onchange("#brtype",calcbr)
oninput("#brbuyin",calcbr)

applybrlanguage()
calcbr()
