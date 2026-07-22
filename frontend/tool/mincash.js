function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function mctext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["mincashpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["mincashpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcmc(){
	let buyin=num(getvalue("mcbuyin"))
	let pay=num(getvalue("mcpay"))
	let mult=(function(){if(buyin>0){return pay/buyin}return 0})()
	let breakeven=(function(){if(pay>0){return buyin/pay*100}return 0})()
	let net=pay-buyin
	innertext("#mcmult",(function(){if(buyin>0){return (Math.round(mult*100)/100)+"x"}return "-"})(),false)
	innertext("#mcbreak",(function(){if(pay>0){return (Math.round(breakeven*10)/10)+"%"}return "-"})(),false)
	innertext("#mcnet",(function(){if(buyin>0||pay>0){return (net>=0?"+$":"-$")+moneyfmt(Math.abs(net))}return "-"})(),false)
	removeclass("#mcnet",["text-emerald-400","text-red-400","text-zinc-200"])
	addclass("#mcnet",[(function(){if(buyin<=0&&pay<=0){return "text-zinc-200"}if(net>0){return "text-emerald-400"}return ((function(){if(net<0){return "text-red-400"}return "text-zinc-200"})())})()])
}

function applymclanguage(){
	document.title=mctext("title")+" - PokerTrace"
	innertext("#mctitle",mctext("title"),false)
	innertext("#back",mctext("back"),false)
	innertext("#mcbuyinlabel",mctext("buyin"),false)
	innertext("#mcpaylabel",mctext("pay"),false)
	innertext("#mcmultlabel",mctext("mult"),false)
	innertext("#mcbreaklabel",mctext("breakeven"),false)
	innertext("#mcnetlabel",mctext("net"),false)
	innertext("#mcnote",mctext("note"),false)
}

oninput("#mcbuyin",calcmc)
oninput("#mcpay",calcmc)

applymclanguage()
calcmc()
