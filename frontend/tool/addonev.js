function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function aetext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["addonevpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["addonevpage"][key]||key
}

function calcae(){
	let buyin=num(getvalue("aebuyin"))
	let start=num(getvalue("aestart"))
	let fee=num(getvalue("aefee"))
	let chips=num(getvalue("aechips"))
	let basecost=(function(){if(start>0){return buyin/start}return 0})()
	let addoncost=(function(){if(chips>0){return fee/chips}return 0})()
	innertext("#aebasecost",(function(){if(start>0){return (Math.round(basecost*10000)/10000).toString()}return "-"})(),false)
	innertext("#aeaddoncost",(function(){if(chips>0){return (Math.round(addoncost*10000)/10000).toString()}return "-"})(),false)
	let verdict
	let color
	if(chips<=0||start<=0){
		verdict="-"
		color="text-zinc-200"
	}else if(addoncost<basecost){
		verdict=aetext("good")
		color="text-emerald-400"
	}else if(addoncost>basecost){
		verdict=aetext("bad")
		color="text-red-400"
	}else{
		verdict=aetext("equal")
		color="text-zinc-200"
	}
	innertext("#aeverdict",verdict,false)
	removeclass("#aeverdict",["text-emerald-400","text-red-400","text-zinc-200"])
	addclass("#aeverdict",[color])
	removeclass("#aeaddoncost",["text-emerald-400","text-red-400"])
	if(chips>0&&start>0){
		addclass("#aeaddoncost",[(function(){if(addoncost<basecost){return "text-emerald-400"}return "text-red-400"})()])
	}
}

function applyaelanguage(){
	document.title=aetext("title")+" - PokerTrace"
	innertext("#aetitle",aetext("title"),false)
	innertext("#back",aetext("back"),false)
	innertext("#aebuyinlabel",aetext("buyin"),false)
	innertext("#aestartlabel",aetext("start"),false)
	innertext("#aefeelabel",aetext("fee"),false)
	innertext("#aechipslabel",aetext("chips"),false)
	innertext("#aebasecostlabel",aetext("basecost"),false)
	innertext("#aeaddoncostlabel",aetext("addoncost"),false)
	innertext("#aeverdictlabel",aetext("verdict"),false)
	innertext("#aenote",aetext("note"),false)
}

oninput("#aebuyin",calcae)
oninput("#aestart",calcae)
oninput("#aefee",calcae)
oninput("#aechips",calcae)

applyaelanguage()
calcae()
