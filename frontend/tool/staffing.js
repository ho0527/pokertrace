function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function sftext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["staffingpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["staffingpage"][key]||key
}

function calcsf(){
	let players=num(getvalue("sfplayers"))
	let seats=num(getvalue("sfseats"))
	let relief=num(getvalue("sfrelief"))
	if(seats<2){
		seats=2
	}
	let tables=Math.ceil(players/seats)
	if(tables<0){
		tables=0
	}
	let dealers=Math.ceil(tables*(1+relief/100))
	let floor=(function(){if(tables>0){return Math.max(1,Math.ceil(tables/8))}return 0})()
	let assist=(function(){if(tables>0){return Math.max(1,Math.ceil(tables/6))}return 0})()
	innertext("#sftables",String(tables),false)
	innertext("#sfdealers",String(dealers),false)
	innertext("#sffloor",String(floor),false)
	innertext("#sfassist",String(assist),false)
}

function applysflanguage(){
	document.title=sftext("title")+" - PokerTrace"
	innertext("#sftitle",sftext("title"),false)
	innertext("#back",sftext("back"),false)
	innertext("#sfplayerslabel",sftext("players"),false)
	innertext("#sfseatslabel",sftext("seats"),false)
	innertext("#sfrelieflabel",sftext("relief"),false)
	innertext("#sftableslabel",sftext("tables"),false)
	innertext("#sfdealerslabel",sftext("dealers"),false)
	innertext("#sffloorlabel",sftext("floor"),false)
	innertext("#sfassistlabel",sftext("assist"),false)
	innertext("#sfnote",sftext("note"),false)
}

oninput("#sfplayers",calcsf)
oninput("#sfseats",calcsf)
oninput("#sfrelief",calcsf)

applysflanguage()
calcsf()
