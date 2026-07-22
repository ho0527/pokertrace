function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function lrtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["lateregpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["lateregpage"][key]||key
}

function parsetime(text){
	let parts=String(text||"").split(":")
	let h=parseInt(parts[0],10)
	let m=parseInt(parts[1],10)
	if(isNaN(h)||isNaN(m)){
		return null
	}
	return h*60+m
}

function fmtclock(minutes){
	minutes=((minutes%1440)+1440)%1440
	let h=Math.floor(minutes/60)
	let m=minutes%60
	let hh=(function(){if(h<10){return "0"+h}return ""+h})()
	let mm=(function(){if(m<10){return "0"+m}return ""+m})()
	return hh+":"+mm
}

function fmtdur(minutes){
	let h=Math.floor(minutes/60)
	let m=Math.round(minutes%60)
	if(h<=0){
		return m+" "+lrtext("min")
	}
	return h+" "+lrtext("hour")+" "+m+" "+lrtext("min")
}

function calclatereg(){
	let start=parsetime(getvalue("lrstart"))
	let levelmin=num(getvalue("lrlevelmin"))
	let clevel=Math.floor(num(getvalue("lrclevel")))
	let breakevery=Math.floor(num(getvalue("lrbreakevery")))
	let breakmin=num(getvalue("lrbreakmin"))
	if(start==null||clevel<1||levelmin<=0){
		innertext("#lrclose","-",false)
		innertext("#lrelapsed","-",false)
		innertext("#lrbreaks","-",false)
		return
	}
	let breaks=(function(){if(breakevery>0){return Math.floor((clevel-1)/breakevery)}return 0})()
	let elapsed=clevel*levelmin+breaks*breakmin
	innertext("#lrclose",fmtclock(start+elapsed),false)
	innertext("#lrelapsed",fmtdur(elapsed),false)
	innertext("#lrbreaks",String(breaks),false)
}

function applylrlanguage(){
	document.title=lrtext("title")+" - PokerTrace"
	innertext("#lrtitle",lrtext("title"),false)
	innertext("#back",lrtext("back"),false)
	innertext("#lrstartlabel",lrtext("start"),false)
	innertext("#lrlevelminlabel",lrtext("levelmin"),false)
	innertext("#lrclevellabel",lrtext("clevel"),false)
	innertext("#lrbreakeverylabel",lrtext("breakevery"),false)
	innertext("#lrbreakminlabel",lrtext("breakmin"),false)
	innertext("#lrcloselabel",lrtext("close"),false)
	innertext("#lrelapsedlabel",lrtext("elapsed"),false)
	innertext("#lrbreakslabel",lrtext("breaks"),false)
	innertext("#lrnote",lrtext("note"),false)
}

oninput("#lrstart",calclatereg)
oninput("#lrlevelmin",calclatereg)
oninput("#lrclevel",calclatereg)
oninput("#lrbreakevery",calclatereg)
oninput("#lrbreakmin",calclatereg)

applylrlanguage()
calclatereg()
