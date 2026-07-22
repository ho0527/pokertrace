function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function rktext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["rakepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["rakepage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcrake(){
	let pot=num(getvalue("rkpot"))
	let pct=num(getvalue("rkpct"))
	let cap=num(getvalue("rkcap"))
	if(pct<0){
		pct=0
	}
	let rake=pot*pct/100
	if(cap>0&&rake>cap){
		rake=cap
	}
	if(rake>pot){
		rake=pot
	}
	if(rake<0){
		rake=0
	}
	let win=pot-rake
	let eff=(function(){if(pot>0){return rake/pot*100}return 0})()
	innertext("#rkrake","$"+moneyfmt(rake),false)
	innertext("#rkwin","$"+moneyfmt(win),false)
	innertext("#rkeff",(Math.round(eff*100)/100)+"%",false)
}

function applyrklanguage(){
	document.title=rktext("title")+" - PokerTrace"
	innertext("#rktitle",rktext("title"),false)
	innertext("#back",rktext("back"),false)
	innertext("#rkpotlabel",rktext("pot"),false)
	innertext("#rkpctlabel",rktext("pct"),false)
	innertext("#rkcaplabel",rktext("cap"),false)
	innertext("#rkrakelabel",rktext("rake"),false)
	innertext("#rkwinlabel",rktext("win"),false)
	innertext("#rkefflabel",rktext("eff"),false)
	innertext("#rknote",rktext("note"),false)
}

oninput("#rkpot",calcrake)
oninput("#rkpct",calcrake)
oninput("#rkcap",calcrake)

applyrklanguage()
calcrake()
