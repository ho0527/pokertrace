function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function hctext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["hostcostpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["hostcostpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function signed(value){
	return (value>=0?"+$":"-$")+moneyfmt(Math.abs(value))
}

function calchost(){
	let entries=num(getvalue("hcentries"))
	let buyin=num(getvalue("hcbuyin"))
	let fee=num(getvalue("hcfee"))
	let rebuycount=num(getvalue("hcrebuycount"))
	let rebuyamt=num(getvalue("hcrebuyamt"))
	let reentrycount=num(getvalue("hcreentrycount"))
	let addoncount=num(getvalue("hcaddoncount"))
	let addonamt=num(getvalue("hcaddonamt"))
	let guarantee=num(getvalue("hcguarantee"))
	let cost=num(getvalue("hccost"))

	// re-entry 視同重新買入：金額進獎池，並與 rebuy 同樣收手續費
	let pool=entries*buyin+rebuycount*rebuyamt+reentrycount*buyin+addoncount*addonamt
	let payout=Math.max(pool,guarantee)
	let overlay=Math.max(0,guarantee-pool)
	let revenue=(entries+rebuycount+reentrycount)*fee
	let profit=revenue-cost-overlay

	innertext("#hcpool","$"+moneyfmt(pool),false)
	innertext("#hcpayout","$"+moneyfmt(payout),false)
	innertext("#hcoverlay","$"+moneyfmt(overlay),false)
	innertext("#hcrevenue","$"+moneyfmt(revenue),false)
	innertext("#hccosttotal","$"+moneyfmt(cost),false)
	innertext("#hcprofit",signed(profit),false)

	removeclass("#hcprofit",["text-emerald-400","text-red-400"])
	addclass("#hcprofit",[(profit>=0?"text-emerald-400":"text-red-400")])

	removeclass("#hcoverlay",["text-red-400","text-zinc-300"])
	addclass("#hcoverlay",[(function(){if(overlay>0){return "text-red-400"}return "text-zinc-300"})()])

	let banner=domgetid("hcoverlaybanner")
	banner.classList.remove("hidden")
	if(overlay>0){
		banner.className="mb-5 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300"
		banner.textContent=hctext("overlaywarn").replace("{amount}","$"+moneyfmt(overlay))
	}else{
		let surplus=pool-guarantee
		banner.className="mb-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300"
		banner.textContent=hctext("overlayok").replace("{amount}","$"+moneyfmt(surplus))
	}
}

function applyhclanguage(){
	document.title=hctext("title")+" - PokerTrace"
	innertext("#hctitle",hctext("title"),false)
	innertext("#back",hctext("back"),false)
	innertext("#hcinputtitle",hctext("inputtitle"),false)
	innertext("#hcentrieslabel",hctext("entries"),false)
	innertext("#hcbuyinlabel",hctext("buyin"),false)
	innertext("#hcfeelabel",hctext("fee"),false)
	innertext("#hcrebuycountlabel",hctext("rebuycount"),false)
	innertext("#hcrebuyamtlabel",hctext("rebuyamt"),false)
	innertext("#hcreentrycountlabel",hctext("reentrycount"),false)
	innertext("#hcaddoncountlabel",hctext("addoncount"),false)
	innertext("#hcaddonamtlabel",hctext("addonamt"),false)
	innertext("#hcguaranteelabel",hctext("guarantee"),false)
	innertext("#hccostlabel",hctext("cost"),false)
	innertext("#hcnote",hctext("note"),false)
	innertext("#hcpoollabel",hctext("pool"),false)
	innertext("#hcpayoutlabel",hctext("payout"),false)
	innertext("#hcoverlaylabel",hctext("overlay"),false)
	innertext("#hcrevenuelabel",hctext("revenue"),false)
	innertext("#hccosttotallabel",hctext("costtotal"),false)
	innertext("#hcprofitlabel",hctext("profit"),false)
}

oninput("#hcentries",calchost)
oninput("#hcbuyin",calchost)
oninput("#hcfee",calchost)
oninput("#hcrebuycount",calchost)
oninput("#hcrebuyamt",calchost)
oninput("#hcreentrycount",calchost)
oninput("#hcaddoncount",calchost)
oninput("#hcaddonamt",calchost)
oninput("#hcguarantee",calchost)
oninput("#hccost",calchost)

applyhclanguage()
calchost()
