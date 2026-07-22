function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function sdtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["seatdrawpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["seatdrawpage"][key]||key
}

// 括號：中文用全形，英文不能硬串全形標點
const SDPARENOPEN=(function(){if(LANGUAGE=="en"){return " ("}return "（"})()
const SDPARENCLOSE=(function(){if(LANGUAGE=="en"){return ")"}return "）"})()

function shuffle(list){
	for(let i=list.length-1;i>0;i=i-1){
		let j=Math.floor(Math.random()*(i+1))
		let t=list[i]
		list[i]=list[j]
		list[j]=t
	}
	return list
}

function drawseats(){
	let players=Math.floor(num(getvalue("sdplayers")))
	let seats=Math.floor(num(getvalue("sdseats")))
	if(players<1){
		players=1
	}
	if(seats<2){
		seats=2
	}
	let tables=Math.ceil(players/seats)
	let order=[]
	for(let i=1;i<=players;i=i+1){
		order.push(i)
	}
	shuffle(order)
	let tabledata=[]
	for(let t=0;t<tables;t=t+1){
		tabledata.push([])
	}
	for(let i=0;i<order.length;i=i+1){
		tabledata[i%tables].push(order[i])
	}
	innertext("#sdsummary",tables+" "+sdtext("tablesunit")+SDPARENOPEN+players+" "+sdtext("playersunit")+SDPARENCLOSE,false)
	let html=""
	for(let t=0;t<tables;t=t+1){
		let seatshtml=""
		for(let s=0;s<tabledata[t].length;s=s+1){
			seatshtml=seatshtml+`
				<div class="flex items-center justify-between border-b border-zinc-800/70 px-4 py-2 last:border-0">
					<span class="text-xs text-zinc-500">${sdtext("seat")} ${s+1}</span>
					<span class="font-mono font-bold text-white">#${tabledata[t][s]}</span>
				</div>
			`
		}
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70">
				<div class="border-b border-zinc-800 px-4 py-3 text-sm font-extrabold text-emerald-400">${sdtext("table")} ${t+1} · ${tabledata[t].length} ${sdtext("playersunit")}</div>
				<div>${seatshtml}</div>
			</div>
		`
	}
	innerhtml("#sdtables",html,false)
}

function applysdlanguage(){
	document.title=sdtext("title")+" - PokerTrace"
	innertext("#sdtitle",sdtext("title"),false)
	innertext("#back",sdtext("back"),false)
	innertext("#sdplayerslabel",sdtext("players"),false)
	innertext("#sdseatslabel",sdtext("seats"),false)
	value("#sddraw",sdtext("draw"))
	innertext("#sdsummarylabel",sdtext("summary"),false)
	innertext("#sdnote",sdtext("note"),false)
}

onclick("#sddraw",drawseats)
oninput("#sdplayers",drawseats)
oninput("#sdseats",drawseats)
onenterclick("#sdplayers,#sdseats",function(){click("#sddraw")})

applysdlanguage()
drawseats()
