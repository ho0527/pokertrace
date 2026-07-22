function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function astext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["avgstackpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["avgstackpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcavg(){
	let total=num(getvalue("astotal"))
	let players=num(getvalue("asplayers"))
	let bb=num(getvalue("asbb"))
	if(players<1){
		players=1
	}
	let avg=total/players
	innertext("#asavg",moneyfmt(avg),false)
	innertext("#asavgbb",(function(){if(bb>0){return (Math.round(avg/bb*10)/10)+" BB"}return "-"})(),false)
}

function applyaslanguage(){
	document.title=astext("title")+" - PokerTrace"
	innertext("#astitle",astext("title"),false)
	innertext("#back",astext("back"),false)
	innertext("#astotallabel",astext("total"),false)
	innertext("#asplayerslabel",astext("players"),false)
	innertext("#asbblabel",astext("bb"),false)
	innertext("#asavglabel",astext("avg"),false)
	innertext("#asavgbblabel",astext("avgbb"),false)
	innertext("#asnote",astext("note"),false)
}

oninput("#astotal",calcavg)
oninput("#asplayers",calcavg)
oninput("#asbb",calcavg)

applyaslanguage()
calcavg()
