function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function smtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["stakingmarkuppage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["stakingmarkuppage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcsm(){
	let buyin=num(getvalue("smbuyin"))
	let sold=num(getvalue("smsold"))/100
	let markup=num(getvalue("smmarkup"))
	if(sold<0){sold=0}
	if(sold>1){sold=1}
	if(markup<1){markup=1}
	let paid=buyin*sold*markup
	let cost=buyin-paid
	let keep=(1-sold)*100
	let locked=buyin*sold*(markup-1)
	innertext("#smpaid","$"+moneyfmt(paid),false)
	innertext("#smcost","$"+moneyfmt(cost),false)
	innertext("#smkeep",(Math.round(keep*10)/10)+"%",false)
	innertext("#smlocked","$"+moneyfmt(locked),false)
	// cost=buyin-paid 且 paid=buyin*sold*markup 在 sold>=0、markup>=1 下恆 >=0，所以 cost 恆 <=buyin，不會有 cost>buyin 的情況
	removeclass("#smcost",["text-emerald-400","text-zinc-200"])
	addclass("#smcost",[(function(){if(cost<0){return "text-emerald-400"}return "text-zinc-200"})()])
}

function applysmlanguage(){
	document.title=smtext("title")+" - PokerTrace"
	innertext("#smtitle",smtext("title"),false)
	innertext("#back",smtext("back"),false)
	innertext("#smbuyinlabel",smtext("buyin"),false)
	innertext("#smsoldlabel",smtext("sold"),false)
	innertext("#smmarkuplabel",smtext("markup"),false)
	innertext("#smpaidlabel",smtext("paid"),false)
	innertext("#smcostlabel",smtext("cost"),false)
	innertext("#smkeeplabel",smtext("keep"),false)
	innertext("#smlockedlabel",smtext("locked"),false)
	innertext("#smnote",smtext("note"),false)
}

oninput("#smbuyin",calcsm)
oninput("#smsold",calcsm)
oninput("#smmarkup",calcsm)

applysmlanguage()
calcsm()
