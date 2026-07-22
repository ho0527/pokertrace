function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function ittext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["investtrackerpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["investtrackerpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function signed(value){
	return (value>=0?"+$":"-$")+moneyfmt(Math.abs(value))
}

function calcit(){
	let buyin=num(getvalue("itbuyin"))
	let rebuycount=num(getvalue("itrebuycount"))
	let rebuyamt=num(getvalue("itrebuyamt"))
	let addon=num(getvalue("itaddon"))
	let fee=num(getvalue("itfee"))
	let win=num(getvalue("itwin"))
	let total=buyin+rebuycount*rebuyamt+addon+fee
	let profit=win-total
	let roi=(function(){if(total>0){return profit/total*100}return 0})()
	innertext("#ittotal","$"+moneyfmt(total),false)
	innertext("#itprofit",signed(profit),false)
	innertext("#itroi",(roi>=0?"+":"")+(Math.round(roi*10)/10)+"%",false)
	removeclass("#itprofit",["text-emerald-400","text-red-400"])
	addclass("#itprofit",[(profit>=0?"text-emerald-400":"text-red-400")])
	removeclass("#itroi",["text-emerald-400","text-red-400"])
	addclass("#itroi",[(profit>=0?"text-emerald-400":"text-red-400")])
}

function applyitlanguage(){
	document.title=ittext("title")+" - PokerTrace"
	innertext("#ittitle",ittext("title"),false)
	innertext("#back",ittext("back"),false)
	innertext("#itbuyinlabel",ittext("buyin"),false)
	innertext("#itrebuycountlabel",ittext("rebuycount"),false)
	innertext("#itrebuyamtlabel",ittext("rebuyamt"),false)
	innertext("#itaddonlabel",ittext("addon"),false)
	innertext("#itfeelabel",ittext("fee"),false)
	innertext("#itwinlabel",ittext("win"),false)
	innertext("#ittotallabel",ittext("total"),false)
	innertext("#itprofitlabel",ittext("profit"),false)
	innertext("#itroilabel",ittext("roi"),false)
	innertext("#itnote",ittext("note"),false)
}

oninput("#itbuyin",calcit)
oninput("#itrebuycount",calcit)
oninput("#itrebuyamt",calcit)
oninput("#itaddon",calcit)
oninput("#itfee",calcit)
oninput("#itwin",calcit)

applyitlanguage()
calcit()
