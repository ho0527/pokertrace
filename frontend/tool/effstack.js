function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function estext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["effstackpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["effstackpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calces(){
	let you=num(getvalue("esyou"))
	let opp=num(getvalue("esopp"))
	let bb=num(getvalue("esbb"))
	let eff=Math.min(you,opp)
	innertext("#eseff",moneyfmt(eff),false)
	innertext("#esbbcount",(function(){if(bb>0){return (Math.round(eff/bb*10)/10)+" BB"}return "-"})(),false)
}

function applyeslanguage(){
	document.title=estext("title")+" - PokerTrace"
	innertext("#estitle",estext("title"),false)
	innertext("#back",estext("back"),false)
	innertext("#esyoulabel",estext("you"),false)
	innertext("#esopplabel",estext("opp"),false)
	innertext("#esbblabel",estext("bb"),false)
	innertext("#esefflabel",estext("eff"),false)
	innertext("#esbbcountlabel",estext("bbcount"),false)
	innertext("#esnote",estext("note"),false)
}

oninput("#esyou",calces)
oninput("#esopp",calces)
oninput("#esbb",calces)

applyeslanguage()
calces()
