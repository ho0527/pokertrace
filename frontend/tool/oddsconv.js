function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function octext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["oddsconvpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["oddsconvpage"][key]||key
}

function calcpcttoodds(){
	let pct=num(getvalue("ocpct"))
	if(pct<=0||pct>=100){
		innertext("#ocagainst",(pct>=100?"0 : 1":"-"),false)
		innertext("#ocdecimal",(pct>=100?"1.00":"-"),false)
		return
	}
	let p=pct/100
	let against=(1-p)/p
	let decimal=1/p
	innertext("#ocagainst",(Math.round(against*100)/100)+" : 1",false)
	innertext("#ocdecimal",(Math.round(decimal*100)/100).toFixed(2),false)
}

function calcoddstopct(){
	let a=num(getvalue("oca"))
	let b=num(getvalue("ocb"))
	if(a+b<=0){
		innertext("#ocimplied","-",false)
		return
	}
	let implied=b/(a+b)*100
	innertext("#ocimplied",(Math.round(implied*10)/10)+"%",false)
}

function applyoclanguage(){
	document.title=octext("title")+" - PokerTrace"
	innertext("#octitle",octext("title"),false)
	innertext("#back",octext("back"),false)
	innertext("#ocsec1",octext("sec1"),false)
	innertext("#ocpctlabel",octext("pct"),false)
	innertext("#ocagainstlabel",octext("against"),false)
	innertext("#ocdecimallabel",octext("decimal"),false)
	innertext("#ocsec2",octext("sec2"),false)
	innertext("#ocalabel",octext("oddsa"),false)
	innertext("#ocblabel",octext("oddsb"),false)
	innertext("#ocimpliedlabel",octext("implied"),false)
	innertext("#ocnote",octext("note"),false)
}

oninput("#ocpct",calcpcttoodds)
oninput("#oca",calcoddstopct)
oninput("#ocb",calcoddstopct)

applyoclanguage()
calcpcttoodds()
calcoddstopct()
