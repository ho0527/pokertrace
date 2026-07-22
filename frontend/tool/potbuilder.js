function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function pbtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["potbuilderpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["potbuilderpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function street(pot,pct){
	let bet=pot*pct/100
	return pot+2*bet
}

function calcpb(){
	let start=num(getvalue("pbstart"))
	let flop=num(getvalue("pbflop"))
	let turn=num(getvalue("pbturn"))
	let river=num(getvalue("pbriver"))
	let pflop=street(start,flop)
	let pturn=street(pflop,turn)
	let priver=street(pturn,river)
	let growth=(function(){if(start>0){return priver/start}return 0})()
	innertext("#pbpflop","$"+moneyfmt(pflop),false)
	innertext("#pbpturn","$"+moneyfmt(pturn),false)
	innertext("#pbpriver","$"+moneyfmt(priver),false)
	innertext("#pbgrowth",(function(){if(start>0){return (Math.round(growth*100)/100)+"×"}return "-"})(),false)
}

function applypblanguage(){
	document.title=pbtext("title")+" - PokerTrace"
	innertext("#pbtitle",pbtext("title"),false)
	innertext("#back",pbtext("back"),false)
	innertext("#pbstartlabel",pbtext("start"),false)
	innertext("#pbfloplabel",pbtext("flop"),false)
	innertext("#pbturnlabel",pbtext("turn"),false)
	innertext("#pbriverlabel",pbtext("river"),false)
	innertext("#pbpfloplabel",pbtext("pflop"),false)
	innertext("#pbpturnlabel",pbtext("pturn"),false)
	innertext("#pbpriverlabel",pbtext("priver"),false)
	innertext("#pbgrowthlabel",pbtext("growth"),false)
	innertext("#pbnote",pbtext("note"),false)
}

oninput("#pbstart",calcpb)
oninput("#pbflop",calcpb)
oninput("#pbturn",calcpb)
oninput("#pbriver",calcpb)

applypblanguage()
calcpb()
