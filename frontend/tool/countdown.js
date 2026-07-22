function cdtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["countdownpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["countdownpage"][key]||key
}

function pad2(n){
	return (function(){if(n<10){return "0"+n}return ""+n})()
}

function tickcountdown(){
	let target=getvalue("cdtarget")
	let parts=String(target||"").split(":")
	let th=parseInt(parts[0],10)
	let tm=parseInt(parts[1],10)
	if(isNaN(th)||isNaN(tm)){
		innertext("#cdremain","--:--:--",false)
		innertext("#cdstatus","-",false)
		return
	}
	let now=new Date()
	let targetsec=th*3600+tm*60
	let nowsec=now.getHours()*3600+now.getMinutes()*60+now.getSeconds()
	let diff=targetsec-nowsec
	let past=false
	if(diff<0){
		past=true
		diff=-diff
	}
	let h=Math.floor(diff/3600)
	let m=Math.floor((diff%3600)/60)
	let s=diff%60
	innertext("#cdremain",pad2(h)+":"+pad2(m)+":"+pad2(s),false)
	removeclass("#cdremain",["text-emerald-400","text-red-400"])
	if(past){
		addclass("#cdremain",["text-red-400"])
		innertext("#cdstatus",cdtext("passed"),false)
	}else{
		addclass("#cdremain",["text-emerald-400"])
		innertext("#cdstatus",cdtext("counting"),false)
	}
}

function applycdlanguage(){
	document.title=cdtext("title")+" - PokerTrace"
	innertext("#cdtitle",cdtext("title"),false)
	innertext("#back",cdtext("back"),false)
	innertext("#cdtargetlabel",cdtext("target"),false)
	innertext("#cdremainlabel",cdtext("remain"),false)
	innertext("#cdnote",cdtext("note"),false)
	tickcountdown()
}

oninput("#cdtarget",tickcountdown)

applycdlanguage()
tickcountdown()
setInterval(tickcountdown,1000)
