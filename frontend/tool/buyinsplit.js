function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function bptext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["buyinsplitpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["buyinsplitpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcsplit(){
	let total=num(getvalue("bptotal"))
	let fee=num(getvalue("bpfee"))
	let bounty=num(getvalue("bpbounty"))
	let entries=num(getvalue("bpentries"))
	let prize=total-fee-bounty
	let pct=(function(){if(total>0){return prize/total*100}return 0})()
	let pool=prize*entries
	let host=fee*entries
	innertext("#bpprize","$"+moneyfmt(prize),false)
	innertext("#bppct",(Math.round(pct*10)/10)+"%",false)
	innertext("#bppool","$"+moneyfmt(pool),false)
	innertext("#bphost","$"+moneyfmt(host),false)
	removeclass("#bpprize",["text-emerald-400","text-red-400"])
	addclass("#bpprize",[(prize>=0?"text-emerald-400":"text-red-400")])
	let warn=domgetid("bpwarn")
	if(prize<0){
		warn.classList.remove("hidden")
		warn.textContent=bptext("warn")
	}else{
		warn.classList.add("hidden")
	}
}

function applybplanguage(){
	document.title=bptext("title")+" - PokerTrace"
	innertext("#bptitle",bptext("title"),false)
	innertext("#back",bptext("back"),false)
	innertext("#bptotallabel",bptext("total"),false)
	innertext("#bpfeelabel",bptext("fee"),false)
	innertext("#bpbountylabel",bptext("bounty"),false)
	innertext("#bpentrieslabel",bptext("entries"),false)
	innertext("#bpprizelabel",bptext("prize"),false)
	innertext("#bppctlabel",bptext("pct"),false)
	innertext("#bppoollabel",bptext("pool"),false)
	innertext("#bphostlabel",bptext("host"),false)
	innertext("#bpnote",bptext("note"),false)
}

oninput("#bptotal",calcsplit)
oninput("#bpfee",calcsplit)
oninput("#bpbounty",calcsplit)
oninput("#bpentries",calcsplit)

applybplanguage()
calcsplit()
