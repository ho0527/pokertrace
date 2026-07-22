function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function tbtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["tablebalancepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["tablebalancepage"][key]||key
}

function calctb(){
	let raw=String(getvalue("tbcounts")||"").split(",")
	let counts=[]
	for(let i=0;i<raw.length;i=i+1){
		let v=raw[i].trim()
		if(v!=""&&!isNaN(parseFloat(v))){
			counts.push(Math.max(0,Math.floor(num(v))))
		}
	}
	let tables=counts.length
	let total=0
	for(let i=0;i<tables;i=i+1){
		total=total+counts[i]
	}
	innertext("#tbsummary",(function(){if(tables>0){return total+"（"+tables+" "+tbtext("tablesunit")+"）"}return "-"})(),false)
	if(tables==0){
		innerhtml("#tbrows",`<div class="text-sm text-zinc-500">${tbtext("empty")}</div>`,false)
		innertext("#tbadvice","-",false)
		return
	}
	let maxsize=Math.ceil(total/tables)
	let minsize=Math.floor(total/tables)
	let html=""
	for(let i=0;i<tables;i=i+1){
		let c=counts[i]
		let tag=""
		let color="text-zinc-300"
		if(c>maxsize){
			tag=tbtext("over")
			color="text-red-400"
		}else if(c<minsize){
			tag=tbtext("under")
			color="text-amber-400"
		}else{
			tag=tbtext("ok")
			color="text-emerald-400"
		}
		html=html+`
			<div class="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<span class="text-zinc-200">${tbtext("table")} ${i+1} · <span class="font-mono">${c}</span></span>
				<span class="font-bold ${color}">${tag}</span>
			</div>
		`
	}
	innerhtml("#tbrows",html,false)
	// build advice: move from over-tables to under-tables
	let moves=0
	for(let i=0;i<tables;i=i+1){
		if(counts[i]>maxsize){
			moves=moves+(counts[i]-maxsize)
		}
	}
	let advice
	if(maxsize-minsize<=1&&moves==0){
		advice=tbtext("balanced")
	}else{
		advice=tbtext("targetprefix")+minsize+"–"+maxsize+tbtext("targetsuffix")+((function(){if(moves>0){return ("，"+tbtext("moveprefix")+moves+tbtext("movesuffix"))}return ""})())
	}
	innertext("#tbadvice",advice,false)
}

function applytblanguage(){
	document.title=tbtext("title")+" - PokerTrace"
	innertext("#tbtitle",tbtext("title"),false)
	innertext("#back",tbtext("back"),false)
	innertext("#tbcountslabel",tbtext("counts"),false)
	innertext("#tbsummarylabel",tbtext("summary"),false)
	innertext("#tbnote",tbtext("note"),false)
	calctb()
}

oninput("#tbcounts",calctb)

applytblanguage()
calctb()
