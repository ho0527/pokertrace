function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function batext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["bbantepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["bbantepage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcba(){
	let bb=num(getvalue("babb"))
	let players=num(getvalue("baplayers"))
	let ante=num(getvalue("baante"))
	if(players<1){
		players=1
	}
	if(players>10){
		players=10
	}
	let tradtotal=ante*players
	let bbante=bb
	let equiv=bb/players
	innertext("#batradtotal","$"+moneyfmt(tradtotal),false)
	innertext("#babbante","$"+moneyfmt(bbante),false)
	innertext("#baequiv","$"+moneyfmt(equiv),false)
}

function applybalanguage(){
	document.title=batext("title")+" - PokerTrace"
	innertext("#batitle",batext("title"),false)
	innertext("#back",batext("back"),false)
	innertext("#babblabel",batext("bb"),false)
	innertext("#baplayerslabel",batext("players"),false)
	innertext("#baantelabel",batext("ante"),false)
	innertext("#batradtotallabel",batext("tradtotal"),false)
	innertext("#babbantelabel",batext("bbante"),false)
	innertext("#baequivlabel",batext("equiv"),false)
	innertext("#banote",batext("note"),false)
}

oninput("#babb",calcba)
oninput("#baplayers",calcba)
oninput("#baante",calcba)

applybalanguage()
calcba()
