function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function rgtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["regprogresspage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["regprogresspage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcrg(){
	let current=num(getvalue("rgcurrent"))
	let target=num(getvalue("rgtarget"))
	let per=num(getvalue("rgper"))
	let guarantee=num(getvalue("rgguarantee"))
	let pct=(function(){if(target>0){return current/target*100}return 0})()
	let shown=(function(){if(pct>100){return 100}return pct})()
	let pool=current*per
	let gap=guarantee-pool
	let need=(function(){if(per>0&&gap>0){return Math.ceil(gap/per)}return 0})()
	domgetid("rgbar").style.width=shown+"%"
	innertext("#rgpct",(Math.round(pct*10)/10)+"%",false)
	innertext("#rgpool","$"+moneyfmt(pool),false)
	innertext("#rggap",((function(){if(gap>0){return "$"+moneyfmt(gap)}return "$0"})()),false)
	innertext("#rgneed",(function(){if(gap>0){return String(need)}return "0"})(),false)
	removeclass("#rggap",["text-red-400","text-emerald-400"])
	addclass("#rggap",[(function(){if(gap>0){return "text-red-400"}return "text-emerald-400"})()])
}

function applyrglanguage(){
	document.title=rgtext("title")+" - PokerTrace"
	innertext("#rgtitle",rgtext("title"),false)
	innertext("#back",rgtext("back"),false)
	innertext("#rgcurrentlabel",rgtext("current"),false)
	innertext("#rgtargetlabel",rgtext("target"),false)
	innertext("#rgperlabel",rgtext("per"),false)
	innertext("#rgguaranteelabel",rgtext("guarantee"),false)
	innertext("#rgbarlabel",rgtext("bar"),false)
	innertext("#rgpoollabel",rgtext("pool"),false)
	innertext("#rggaplabel",rgtext("gap"),false)
	innertext("#rgneedlabel",rgtext("need"),false)
	innertext("#rgnote",rgtext("note"),false)
}

oninput("#rgcurrent",calcrg)
oninput("#rgtarget",calcrg)
oninput("#rgper",calcrg)
oninput("#rgguarantee",calcrg)

applyrglanguage()
calcrg()
