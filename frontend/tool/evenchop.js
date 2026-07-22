const ECMAXPLAYER=10

function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function ectext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["evenchoppage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["evenchoppage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcec(){
	let prize=num(getvalue("ecprize"))
	let players=Math.floor(num(getvalue("ecplayers")))
	let reserve=num(getvalue("ecreserve"))
	if(players<2){
		players=2
	}
	// HTML 的 max 對手動輸入沒有強制力，這裡跟著 max="10" 夾住上限
	if(players>ECMAXPLAYER){
		players=ECMAXPLAYER
	}
	if(reserve>prize){
		reserve=prize
	}
	let pool=prize-reserve
	let each=pool/players
	let winner=each+reserve
	innertext("#eceach","$"+moneyfmt(each),false)
	innertext("#ecwinner","$"+moneyfmt(winner),false)
}

function applyeclanguage(){
	document.title=ectext("title")+" - PokerTrace"
	innertext("#ectitle",ectext("title"),false)
	innertext("#back",ectext("back"),false)
	innertext("#ecprizelabel",ectext("prize"),false)
	innertext("#ecplayerslabel",ectext("players"),false)
	innertext("#ecreservelabel",ectext("reserve"),false)
	innertext("#eceachlabel",ectext("each"),false)
	innertext("#ecwinnerlabel",ectext("winner"),false)
	innertext("#ecnote",ectext("note"),false)
}

oninput("#ecprize",calcec)
oninput("#ecplayers",calcec)
oninput("#ecreserve",calcec)

applyeclanguage()
calcec()
