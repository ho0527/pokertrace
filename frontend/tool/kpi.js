function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function kptext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["kpipage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["kpipage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calckp(){
	let entries=num(getvalue("kpentries"))
	let revenue=num(getvalue("kprevenue"))
	let pool=num(getvalue("kppool"))
	let cost=num(getvalue("kpcost"))
	if(entries<1){
		entries=1
	}
	let per=revenue/entries
	let rake=(function(){if(revenue>0){return (revenue-pool)/revenue*100}return 0})()
	let share=(function(){if(revenue>0){return pool/revenue*100}return 0})()
	let profit=revenue-pool-cost
	let margin=(function(){if(revenue>0){return profit/revenue*100}return 0})()
	innertext("#kpper","$"+moneyfmt(per),false)
	innertext("#kprake",(Math.round(rake*10)/10)+"%",false)
	innertext("#kpshare",(Math.round(share*10)/10)+"%",false)
	innertext("#kpprofit",(profit>=0?"+$":"-$")+moneyfmt(Math.abs(profit)),false)
	innertext("#kpmargin",(margin>=0?"+":"")+(Math.round(margin*10)/10)+"%",false)
	removeclass("#kpprofit",["text-emerald-400","text-red-400"])
	addclass("#kpprofit",[(profit>=0?"text-emerald-400":"text-red-400")])
	removeclass("#kpmargin",["text-emerald-400","text-red-400"])
	addclass("#kpmargin",[(profit>=0?"text-emerald-400":"text-red-400")])
}

function applykplanguage(){
	document.title=kptext("title")+" - PokerTrace"
	innertext("#kptitle",kptext("title"),false)
	innertext("#back",kptext("back"),false)
	innertext("#kpentrieslabel",kptext("entries"),false)
	innertext("#kprevenuelabel",kptext("revenue"),false)
	innertext("#kppoollabel",kptext("pool"),false)
	innertext("#kpcostlabel",kptext("cost"),false)
	innertext("#kpperlabel",kptext("per"),false)
	innertext("#kprakelabel",kptext("rake"),false)
	innertext("#kpsharelabel",kptext("share"),false)
	innertext("#kpprofitlabel",kptext("profit"),false)
	innertext("#kpmarginlabel",kptext("margin"),false)
	innertext("#kpnote",kptext("note"),false)
}

oninput("#kpentries",calckp)
oninput("#kprevenue",calckp)
oninput("#kppool",calckp)
oninput("#kpcost",calckp)

applykplanguage()
calckp()
