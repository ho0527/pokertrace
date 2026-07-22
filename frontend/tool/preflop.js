let PFRANKS=["A","K","Q","J","T","9","8","7","6","5","4","3","2"]

let PFRANGES={
	"UTG":["22+","ATs+","KTs+","QTs+","JTs","T9s","98s","87s","76s","AJo+","KQo"],
	"MP":["22+","A9s+","KTs+","QTs+","J9s+","T9s","98s","87s","76s","65s","ATo+","KJo+","QJo"],
	"CO":["22+","A2s+","K9s+","Q9s+","J9s+","T8s+","97s+","86s+","75s+","65s","54s","A9o+","KTo+","QTo+","JTo"],
	"BTN":["22+","A2s+","K5s+","Q8s+","J8s+","T8s+","97s+","86s+","75s+","64s+","54s","A2o+","K9o+","Q9o+","J9o+","T9o","98o"],
	"SB":["22+","A2s+","K7s+","Q9s+","J9s+","T8s+","97s+","86s+","75s+","65s","54s","A8o+","K9o+","Q9o+","J9o+","T9o"]
}

let PFCURRENT="BTN"

function pftext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["prefloppage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["prefloppage"][key]||key
}

function pfexpand(token){
	let plus=token.charAt(token.length-1)=="+"
	let body=(function(){if(plus){return token.slice(0,-1)}return token})()
	let out=[]
	if(body.length==2&&body.charAt(0)==body.charAt(1)){
		let vi=PFRANKS.indexOf(body.charAt(0))
		if(vi<0){
			return out
		}
		if(plus){
			for(let i=vi;i>=0;i=i-1){
				out.push(PFRANKS[i]+PFRANKS[i])
			}
		}else{
			out.push(body)
		}
		return out
	}
	if(body.length==3){
		let hi=body.charAt(0)
		let lo=body.charAt(1)
		let suit=body.charAt(2)
		let hii=PFRANKS.indexOf(hi)
		let loi=PFRANKS.indexOf(lo)
		if(hii<0||loi<0){
			return out
		}
		if(plus){
			for(let i=loi;i>hii;i=i-1){
				out.push(hi+PFRANKS[i]+suit)
			}
		}else{
			out.push(body)
		}
	}
	return out
}

function pfbuildset(tokens){
	let set={}
	for(let i=0;i<tokens.length;i=i+1){
		let hands=pfexpand(tokens[i])
		for(let j=0;j<hands.length;j=j+1){
			set[hands[j]]=true
		}
	}
	return set
}

function pfhandlabel(r,c){
	if(r==c){
		return PFRANKS[r]+PFRANKS[r]
	}
	if(r<c){
		return PFRANKS[r]+PFRANKS[c]+"s"
	}
	return PFRANKS[c]+PFRANKS[r]+"o"
}

function pfcombos(r,c){
	if(r==c){
		return 6
	}
	if(r<c){
		return 4
	}
	return 12
}

function renderpfgrid(){
	let set=pfbuildset(PFRANGES[PFCURRENT]||[])
	let html=""
	let combosum=0
	for(let r=0;r<13;r=r+1){
		for(let c=0;c<13;c=c+1){
			let label=pfhandlabel(r,c)
			let inrange=(function(){if(set[label]){return true}return false})()
			if(inrange){
				combosum=combosum+pfcombos(r,c)
			}
			let cls=(function(){if(inrange){return "bg-emerald-500/85 text-zinc-950 font-bold"}return "bg-zinc-900 text-zinc-600"})()
			html=html+`<div class="flex items-center justify-center rounded-[3px] py-1 text-[10px] sm:text-xs ${cls}">${label}</div>`
		}
	}
	innerhtml("#pfgrid",html,false)
	let pct=Math.round(combosum/1326*1000)/10
	innertext("#pfpercent",pct+"%",false)
}

function setpfposition(pos){
	PFCURRENT=pos
	let buttons=document.querySelectorAll("[data-pfpos]")
	for(let i=0;i<buttons.length;i=i+1){
		let active=buttons[i].getAttribute("data-pfpos")==pos
		buttons[i].className="min-h-10 rounded-2xl px-4 text-sm font-bold transition "+((function(){if(active){return "bg-emerald-500 text-zinc-950"}return "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"})())
	}
	renderpfgrid()
}

function applypflanguage(){
	document.title=pftext("title")+" - PokerTrace"
	innertext("#pftitle",pftext("title"),false)
	innertext("#back",pftext("back"),false)
	innertext("#pfpostitle",pftext("postitle"),false)
	innertext("#pfgridtitle",pftext("gridtitle"),false)
	innertext("#pfpercentlabel",pftext("percentlabel"),false)
	innertext("#pfsuitednote",pftext("suitednote"),false)
	innertext("#pfsizetitle",pftext("sizetitle"),false)
	innertext("#pfsizebody",pftext("sizebody"),false)
	innertext("#pfpushtitle",pftext("pushtitle"),false)
	innertext("#pfpushbody",pftext("pushbody"),false)
	innertext("#pfdisclaimer",pftext("disclaimer"),false)
}

let pfbtns=document.querySelectorAll("[data-pfpos]")
for(let i=0;i<pfbtns.length;i=i+1){
	pfbtns[i].addEventListener("click",function(){
		setpfposition(this.getAttribute("data-pfpos"))
	})
}

applypflanguage()
setpfposition("BTN")
