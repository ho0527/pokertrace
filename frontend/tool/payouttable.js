function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function pttext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["payouttablepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["payouttablepage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcpt(){
	let pool=num(getvalue("ptpool"))
	let places=Math.floor(num(getvalue("ptplaces")))
	let steep=num(getvalue("ptsteep"))
	let step=Math.floor(num(getvalue("ptround")))
	if(places<1){
		places=1
	}
	if(places>50){
		places=50
	}
	if(steep<=0||steep>=1){
		steep=0.7
	}
	let weights=[]
	let total=0
	for(let i=0;i<places;i=i+1){
		let w=Math.pow(steep,i)
		weights.push(w)
		total=total+w
	}
	let cash=[]
	let sum=0
	for(let i=0;i<places;i=i+1){
		let c=pool*weights[i]/total
		if(step>0){
			c=Math.round(c/step)*step
		}else{
			c=Math.round(c)
		}
		cash.push(c)
		sum=sum+c
	}
	cash[0]=cash[0]+(pool-sum)
	if(cash[0]<0){
		cash[0]=0
	}
	let paidplaces=0
	for(let i=0;i<places;i=i+1){
		if(cash[i]>0){
			paidplaces=paidplaces+1
		}
	}
	let html=""
	for(let i=0;i<paidplaces;i=i+1){
		let pct=(function(){if(pool>0){return cash[i]/pool*100}return 0})()
		html=html+`
			<div class="grid grid-cols-3 gap-px bg-zinc-800">
				<div class="bg-zinc-950/60 px-4 py-3 font-bold text-white">${i+1}</div>
				<div class="bg-zinc-950/60 px-4 py-3 text-right font-mono text-emerald-400">$${moneyfmt(cash[i])}</div>
				<div class="bg-zinc-950/60 px-4 py-3 text-right font-mono text-zinc-400">${Math.round(pct*10)/10}%</div>
			</div>
		`
	}
	innerhtml("#ptrows",html,false)
	let note=pttext("note")
	if(paidplaces<places){
		note=note+pttext("cutoff").replace("{n}",paidplaces)
	}
	innertext("#ptnote",note,false)
}

function applyptlanguage(){
	document.title=pttext("title")+" - PokerTrace"
	innertext("#pttitle",pttext("title"),false)
	innertext("#back",pttext("back"),false)
	innertext("#ptpoollabel",pttext("pool"),false)
	innertext("#ptplaceslabel",pttext("places"),false)
	innertext("#ptsteeplabel",pttext("steep"),false)
	innertext("#ptroundlabel",pttext("round"),false)
	innertext("#pthrank",pttext("hrank"),false)
	innertext("#pthcash",pttext("hcash"),false)
	innertext("#pthpct",pttext("hpct"),false)
	innertext("#ptnote",pttext("note"),false)
	calcpt()
}

oninput("#ptpool",calcpt)
oninput("#ptplaces",calcpt)
oninput("#ptsteep",calcpt)
oninput("#ptround",calcpt)

applyptlanguage()
calcpt()
