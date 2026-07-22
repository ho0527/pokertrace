function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function rttext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["roitargetpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["roitargetpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcrt(){
	let buyin=num(getvalue("rtbuyin"))
	let roi=num(getvalue("rtroi"))
	let games=num(getvalue("rtgames"))
	if(games<1){
		games=1
	}
	let avg=buyin*(1+roi/100)
	let totalbuyin=buyin*games
	let totalcash=avg*games
	innertext("#rtavg","$"+moneyfmt(avg),false)
	innertext("#rttotalbuyin","$"+moneyfmt(totalbuyin),false)
	innertext("#rttotalcash","$"+moneyfmt(totalcash),false)
}

function applyrtlanguage(){
	document.title=rttext("title")+" - PokerTrace"
	innertext("#rttitle",rttext("title"),false)
	innertext("#back",rttext("back"),false)
	innertext("#rtbuyinlabel",rttext("buyin"),false)
	innertext("#rtroilabel",rttext("roi"),false)
	innertext("#rtgameslabel",rttext("games"),false)
	innertext("#rtavglabel",rttext("avg"),false)
	innertext("#rttotalbuyinlabel",rttext("totalbuyin"),false)
	innertext("#rttotalcashlabel",rttext("totalcash"),false)
	innertext("#rtnote",rttext("note"),false)
}

oninput("#rtbuyin",calcrt)
oninput("#rtroi",calcrt)
oninput("#rtgames",calcrt)

applyrtlanguage()
calcrt()
