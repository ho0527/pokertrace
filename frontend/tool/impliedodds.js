function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function iotext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["impliedoddspage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["impliedoddspage"][key]||key
}

function calcio(){
	let pot=num(getvalue("iopot"))
	let call=num(getvalue("iocall"))
	let future=num(getvalue("iofuture"))
	let eq=num(getvalue("ioeq"))
	if(call<=0){
		innertext("#iodirect","-",false)
		innertext("#ioimplied","-",false)
		innertext("#ioverdict","-",false)
		return
	}
	let direct=call/(pot+call)*100
	let implied=call/(pot+call+future)*100
	innertext("#iodirect",(Math.round(direct*10)/10)+"%",false)
	innertext("#ioimplied",(Math.round(implied*10)/10)+"%",false)
	let ok=eq>=implied
	innertext("#ioverdict",(function(){if(ok){return iotext("callit")}return iotext("foldit")})(),false)
	removeclass("#ioverdict",["text-emerald-400","text-red-400"])
	addclass("#ioverdict",[(function(){if(ok){return "text-emerald-400"}return "text-red-400"})()])
}

function applyiolanguage(){
	document.title=iotext("title")+" - PokerTrace"
	innertext("#iotitle",iotext("title"),false)
	innertext("#back",iotext("back"),false)
	innertext("#iopotlabel",iotext("pot"),false)
	innertext("#iocalllabel",iotext("call"),false)
	innertext("#iofuturelabel",iotext("future"),false)
	innertext("#ioeqlabel",iotext("eq"),false)
	innertext("#iodirectlabel",iotext("direct"),false)
	innertext("#ioimpliedlabel",iotext("implied"),false)
	innertext("#ioverdictlabel",iotext("verdict"),false)
	innertext("#ionote",iotext("note"),false)
}

oninput("#iopot",calcio)
oninput("#iocall",calcio)
oninput("#iofuture",calcio)
oninput("#ioeq",calcio)

applyiolanguage()
calcio()
