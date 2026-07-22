function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function lctext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["levelclockpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["levelclockpage"][key]||key
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

function calclc(){
	let start=parsetime(getvalue("lcstart"))
	let levelmin=num(getvalue("lclevelmin"))
	let total=Math.floor(num(getvalue("lctotal")))
	let every=Math.floor(num(getvalue("lcevery")))
	let breakmin=num(getvalue("lcbreakmin"))
	if(start==null||levelmin<=0||total<1){
		innerhtml("#lcrows",`<div class="px-4 py-3 text-sm text-zinc-500">-</div>`,false)
		return
	}
	if(total>60){
		total=60
	}
	let t=start
	let html=""
	for(let level=1;level<=total;level=level+1){
		let s=t
		let e=t+levelmin
		html=html+`
			<div class="grid grid-cols-3 gap-px bg-zinc-800">
				<div class="bg-zinc-950/60 px-4 py-3 font-bold text-white">L${level}</div>
				<div class="bg-zinc-950/60 px-4 py-3 text-right font-mono text-emerald-400">${fmtclock(s)}</div>
				<div class="bg-zinc-950/60 px-4 py-3 text-right font-mono text-zinc-400">${fmtclock(e)}</div>
			</div>
		`
		t=e
		if(every>0&&level%every==0&&level!=total){
			let bs=t
			let be=t+breakmin
			html=html+`
				<div class="grid grid-cols-3 gap-px bg-zinc-800">
					<div class="bg-amber-500/10 px-4 py-3 font-bold text-amber-400">${lctext("breaklabel")}</div>
					<div class="bg-amber-500/10 px-4 py-3 text-right font-mono text-amber-300">${fmtclock(bs)}</div>
					<div class="bg-amber-500/10 px-4 py-3 text-right font-mono text-amber-300/70">${fmtclock(be)}</div>
				</div>
			`
			t=be
		}
	}
	innerhtml("#lcrows",html,false)
}

function applylclanguage(){
	document.title=lctext("title")+" - PokerTrace"
	innertext("#lctitle",lctext("title"),false)
	innertext("#back",lctext("back"),false)
	innertext("#lcstartlabel",lctext("start"),false)
	innertext("#lclevelminlabel",lctext("levelmin"),false)
	innertext("#lctotallabel",lctext("total"),false)
	innertext("#lceverylabel",lctext("every"),false)
	innertext("#lcbreakminlabel",lctext("breakmin"),false)
	innertext("#lchitem",lctext("hitem"),false)
	innertext("#lchstart",lctext("hstart"),false)
	innertext("#lchend",lctext("hend"),false)
	innertext("#lcnote",lctext("note"),false)
	calclc()
}

oninput("#lcstart",calclc)
oninput("#lclevelmin",calclc)
oninput("#lctotal",calclc)
oninput("#lcevery",calclc)
oninput("#lcbreakmin",calclc)

applylclanguage()
calclc()
