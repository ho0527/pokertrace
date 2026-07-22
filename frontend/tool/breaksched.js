function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function bktext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["breakschedpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["breakschedpage"][key]||key
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

function calcbreaks(){
	let start=parsetime(getvalue("bkstart"))
	let levelmin=num(getvalue("bklevelmin"))
	let total=Math.floor(num(getvalue("bktotal")))
	let every=Math.floor(num(getvalue("bkevery")))
	let dur=num(getvalue("bkdur"))
	if(start==null||levelmin<=0||every<1||total<1){
		innerhtml("#bkrows",`<div class="px-4 py-3 text-sm text-zinc-500">-</div>`,false)
		return
	}
	let html=""
	let bn=0
	for(let after=every;after<total;after=after+every){
		bn=bn+1
		let clock=start+after*levelmin+(bn-1)*dur
		html=html+`
			<div class="grid grid-cols-3 gap-px bg-zinc-800">
				<div class="bg-zinc-950/60 px-4 py-3 font-bold text-white">#${bn}</div>
				<div class="bg-zinc-950/60 px-4 py-3 text-zinc-300">L${after} ${bktext("after")}</div>
				<div class="bg-zinc-950/60 px-4 py-3 text-right font-mono text-emerald-400">${fmtclock(clock)}</div>
			</div>
		`
	}
	if(html==""){
		html=`<div class="px-4 py-3 text-sm text-zinc-500">${bktext("none")}</div>`
	}
	innerhtml("#bkrows",html,false)
}

function applybklanguage(){
	document.title=bktext("title")+" - PokerTrace"
	innertext("#bktitle",bktext("title"),false)
	innertext("#back",bktext("back"),false)
	innertext("#bkstartlabel",bktext("start"),false)
	innertext("#bklevelminlabel",bktext("levelmin"),false)
	innertext("#bktotallabel",bktext("total"),false)
	innertext("#bkeverylabel",bktext("every"),false)
	innertext("#bkdurlabel",bktext("dur"),false)
	innertext("#bkhno",bktext("hno"),false)
	innertext("#bkhafter",bktext("hafter"),false)
	innertext("#bkhtime",bktext("htime"),false)
	innertext("#bknote",bktext("note"),false)
	calcbreaks()
}

oninput("#bkstart",calcbreaks)
oninput("#bklevelmin",calcbreaks)
oninput("#bktotal",calcbreaks)
oninput("#bkevery",calcbreaks)
oninput("#bkdur",calcbreaks)

applybklanguage()
calcbreaks()
