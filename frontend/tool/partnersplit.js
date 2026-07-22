function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function pntext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["partnersplitpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["partnersplitpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function signed(value){
	return (value>=0?"+$":"-$")+moneyfmt(Math.abs(value))
}

function calcpn(){
	let total=num(getvalue("pntotal"))
	let raw=String(getvalue("pnshares")||"").split(",")
	let shares=[]
	let negatived=false
	for(let i=0;i<raw.length;i=i+1){
		let v=raw[i].trim()
		if(v!=""){
			if(num(v)<0){
				negatived=true
			}else{
				shares.push(num(v))
			}
		}
	}
	if(negatived){
		innertext("#pnsum","-",false)
		removeclass("#pnsum",["text-emerald-400","text-amber-400"])
		addclass("#pnsum",["text-amber-400"])
		innerhtml("#pnrows",`<div class="text-sm text-zinc-500">${pntext("negative")}</div>`,false)
		innertext("#pnnote",pntext("negative"),false)
		return
	}
	innertext("#pnnote",pntext("note"),false)
	let sum=0
	for(let i=0;i<shares.length;i=i+1){
		sum=sum+shares[i]
	}
	innertext("#pnsum",(Math.round(sum*100)/100)+"%",false)
	removeclass("#pnsum",["text-emerald-400","text-amber-400"])
	addclass("#pnsum",[(function(){if(Math.abs(sum-100)<0.01){return "text-emerald-400"}return "text-amber-400"})()])
	let html=""
	for(let i=0;i<shares.length;i=i+1){
		let amount=(function(){if(sum>0){return total*shares[i]/sum}return 0})()
		let amountclass="text-red-400"
		if(total>=0){
			amountclass="text-emerald-400"
		}
		html=html+`
			<div class="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<span class="text-zinc-300">${pntext("partner")} ${i+1} · <span class="font-mono text-zinc-400">${Math.round(shares[i]*100)/100}%</span></span>
				<span class="font-mono font-bold ${amountclass}">${signed(amount)}</span>
			</div>
		`
	}
	if(html==""){
		html=`<div class="text-sm text-zinc-500">${pntext("empty")}</div>`
	}
	innerhtml("#pnrows",html,false)
}

function applypnlanguage(){
	document.title=pntext("title")+" - PokerTrace"
	innertext("#pntitle",pntext("title"),false)
	innertext("#back",pntext("back"),false)
	innertext("#pntotallabel",pntext("total"),false)
	innertext("#pnshareslabel",pntext("shares"),false)
	innertext("#pnsumlabel",pntext("sum"),false)
	innertext("#pnnote",pntext("note"),false)
	calcpn()
}

oninput("#pntotal",calcpn)
oninput("#pnshares",calcpn)

applypnlanguage()
calcpn()
