function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function pstext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["playerstatspage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["playerstatspage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function signed(value){
	return (value>=0?"+$":"-$")+moneyfmt(Math.abs(value))
}

function colorize(selector,positive){
	removeclass(selector,["text-emerald-400","text-red-400"])
	addclass(selector,[(function(){if(positive){return "text-emerald-400"}return "text-red-400"})()])
}

function calcps(){
	let sessions=num(getvalue("pssessions"))
	let itm=num(getvalue("psitm"))
	let buyin=num(getvalue("psbuyin"))
	let win=num(getvalue("pswin"))
	let profit=win-buyin
	let roi=(function(){if(buyin>0){return profit/buyin*100}return 0})()
	let itmrate=(function(){if(sessions>0){return itm/sessions*100}return 0})()
	let avg=(function(){if(sessions>0){return profit/sessions}return 0})()
	innertext("#psprofit",signed(profit),false)
	innertext("#psroi",(function(){if(buyin>0){return (roi>=0?"+":"")+(Math.round(roi*10)/10)+"%"}return "-"})(),false)
	innertext("#psitmrate",(Math.round(itmrate*10)/10)+"%",false)
	innertext("#psavg",signed(avg),false)
	colorize("#psprofit",profit>=0)
	if(buyin>0){
		colorize("#psroi",roi>=0)
	}else{
		removeclass("#psroi",["text-emerald-400","text-red-400"])
	}
	colorize("#psavg",avg>=0)
}

function applypslanguage(){
	document.title=pstext("title")+" - PokerTrace"
	innertext("#pstitle",pstext("title"),false)
	innertext("#back",pstext("back"),false)
	innertext("#pssessionslabel",pstext("sessions"),false)
	innertext("#psitmlabel",pstext("itm"),false)
	innertext("#psbuyinlabel",pstext("buyin"),false)
	innertext("#pswinlabel",pstext("win"),false)
	innertext("#psprofitlabel",pstext("profit"),false)
	innertext("#psroilabel",pstext("roi"),false)
	innertext("#psitmratelabel",pstext("itmrate"),false)
	innertext("#psavglabel",pstext("avg"),false)
	innertext("#psnote",pstext("note"),false)
}

oninput("#pssessions",calcps)
oninput("#psitm",calcps)
oninput("#psbuyin",calcps)
oninput("#pswin",calcps)

applypslanguage()
calcps()
