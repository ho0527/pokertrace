function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function wptext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["winprobpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["winprobpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcwp(){
	let raw=String(getvalue("wpstacks")||"").split(",")
	let stacks=[]
	let seat=0
	for(let i=0;i<raw.length;i=i+1){
		let v=raw[i].trim()
		if(v!=""){
			seat=seat+1
			if(num(v)>0){
				stacks.push({stack:num(v),idx:seat-1})
			}
		}
	}
	let total=0
	for(let i=0;i<stacks.length;i=i+1){
		total=total+stacks[i].stack
	}
	innertext("#wptotal",(function(){if(total>0){return moneyfmt(total)+"（"+stacks.length+" "+wptext("players")+"）"}return "-"})(),false)
	let order=[]
	for(let i=0;i<stacks.length;i=i+1){
		order.push({stack:stacks[i].stack,idx:stacks[i].idx})
	}
	order.sort(function(a,b){return b.stack-a.stack})
	let html=""
	for(let i=0;i<order.length;i=i+1){
		let p=order[i]
		let prob=(function(){if(total>0){return p.stack/total*100}return 0})()
		let width=(function(){if(prob>100){return 100}return prob})()
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
				<div class="flex items-center justify-between text-sm">
					<span class="text-zinc-300">${wptext("seat")} ${p.idx+1} · <span class="font-mono text-zinc-400">${moneyfmt(p.stack)}</span></span>
					<span class="font-mono font-bold text-emerald-400">${Math.round(prob*10)/10}%</span>
				</div>
				<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800"><div class="h-full rounded-full bg-emerald-500" data-wpwidth="${width}"></div></div>
			</div>
		`
	}
	if(html==""){
		html=`<div class="text-sm text-zinc-500">${wptext("empty")}</div>`
	}
	innerhtml("#wprows",html,false)
	let barlist=document.querySelectorAll("[data-wpwidth]")
	for(let i=0;i<barlist.length;i=i+1){
		barlist[i].style.width=barlist[i].getAttribute("data-wpwidth")+"%"
	}
}

function applywplanguage(){
	document.title=wptext("title")+" - PokerTrace"
	innertext("#wptitle",wptext("title"),false)
	innertext("#back",wptext("back"),false)
	innertext("#wpstackslabel",wptext("stacks"),false)
	innertext("#wptotallabel",wptext("total"),false)
	innertext("#wpnote",wptext("note"),false)
	calcwp()
}

oninput("#wpstacks",calcwp)

applywplanguage()
calcwp()
