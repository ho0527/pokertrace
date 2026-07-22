function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function hetext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["handsestpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["handsestpage"][key]||key
}

function calche(){
	let sec=num(getvalue("hesec"))
	let level=num(getvalue("helevel"))
	if(sec<=0){
		innertext("#hehour","-",false)
		innertext("#helevelhands","-",false)
		return
	}
	let perhour=3600/sec
	let perlevel=level*60/sec
	innertext("#hehour",(Math.round(perhour*10)/10).toString(),false)
	innertext("#helevelhands",(Math.round(perlevel*10)/10).toString(),false)
}

function applyhelanguage(){
	document.title=hetext("title")+" - PokerTrace"
	innertext("#hetitle",hetext("title"),false)
	innertext("#back",hetext("back"),false)
	innertext("#heseclabel",hetext("sec"),false)
	innertext("#helevellabel",hetext("level"),false)
	innertext("#hehourlabel",hetext("hour"),false)
	innertext("#helevelhandslabel",hetext("levelhands"),false)
	innertext("#henote",hetext("note"),false)
}

oninput("#hesec",calche)
oninput("#helevel",calche)

applyhelanguage()
calche()
