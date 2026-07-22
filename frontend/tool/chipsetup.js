function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

let csdenoms=[
	{denom:25,count:8},
	{denom:100,count:8},
	{denom:500,count:6},
	{denom:1000,count:6},
	{denom:5000,count:2}
]

function cstext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["chipsetuppage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["chipsetuppage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function csautofill(){
	let stack=num(getvalue("csstack"))
	let denoms=[]
	for(let i=0;i<csdenoms.length;i=i+1){
		if(csdenoms[i].denom>0){
			denoms.push(csdenoms[i].denom)
		}
	}
	denoms.sort(function(a,b){return a-b})
	let n=denoms.length
	if(n==0||stack<=0){
		return
	}
	let counts=[]
	for(let i=0;i<n;i=i+1){
		counts.push(0)
	}
	let baseline=[8,8,6,4]
	let remaining=stack
	for(let i=0;i<n-1;i=i+1){
		let b=2
		if(baseline[i]!=undefined){
			b=baseline[i]
		}
		let cost=b*denoms[i]
		if(cost<=remaining){
			counts[i]=b
			remaining=remaining-cost
		}
	}
	for(let i=n-1;i>=0;i=i-1){
		if(denoms[i]<=remaining){
			let add=Math.floor(remaining/denoms[i])
			counts[i]=counts[i]+add
			remaining=remaining-add*denoms[i]
		}
	}
	let newset=[]
	for(let i=0;i<n;i=i+1){
		newset.push({denom:denoms[i],count:counts[i]})
	}
	csdenoms=newset
	rendercsrows()
	rendercstotals()
}

function rendercsrows(){
	let host=domgetid("csrows")
	host.innerHTML=""
	for(let i=0;i<csdenoms.length;i=i+1){
		let row=document.createElement("div")
		row.className="flex items-center gap-2"
		let sub=csdenoms[i].denom*csdenoms[i].count
		row.innerHTML=`
			<input type="number" min="0" inputmode="numeric" value="${csdenoms[i].denom}" data-csdenom="${i}" class="min-h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400">
			<input type="number" min="0" inputmode="numeric" value="${csdenoms[i].count}" data-cscount="${i}" class="min-h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400">
			<span class="flex-1 text-right font-mono text-zinc-300" data-cssub="${i}">$${moneyfmt(sub)}</span>
			<input type="button" class="handrow-remove w-12" data-csremove="${i}" value="${cstext("remove")}">
		`
		host.appendChild(row)
	}
	let denomlist=host.querySelectorAll("[data-csdenom]")
	for(let i=0;i<denomlist.length;i=i+1){
		denomlist[i].addEventListener("input",function(){
			csdenoms[parseInt(this.getAttribute("data-csdenom"),10)].denom=num(this.value)
			rendercstotals()
		})
	}
	let countlist=host.querySelectorAll("[data-cscount]")
	for(let i=0;i<countlist.length;i=i+1){
		countlist[i].addEventListener("input",function(){
			csdenoms[parseInt(this.getAttribute("data-cscount"),10)].count=num(this.value)
			rendercstotals()
		})
	}
	let removelist=host.querySelectorAll("[data-csremove]")
	for(let i=0;i<removelist.length;i=i+1){
		removelist[i].addEventListener("click",function(){
			if(csdenoms.length<=1){
				pttoast(cstext("minrow"),"warning")
				return
			}
			csdenoms.splice(parseInt(this.getAttribute("data-csremove"),10),1)
			rendercsrows()
			rendercstotals()
		})
	}
}

function rendercstotals(){
	let stack=num(getvalue("csstack"))
	let total=0
	let chips=0
	for(let i=0;i<csdenoms.length;i=i+1){
		let sub=csdenoms[i].denom*csdenoms[i].count
		total=total+sub
		chips=chips+csdenoms[i].count
		let span=domgetid("csrows").querySelector("[data-cssub=\""+i+"\"]")
		if(span){
			span.textContent="$"+moneyfmt(sub)
		}
	}
	let diff=total-stack
	innertext("#cstotal","$"+moneyfmt(total),false)
	innertext("#cschips",String(chips),false)
	innertext("#csdiff",((function(){if(diff>0){return "+$"}return (function(){if(diff<0){return "-$"}return "$"})()})())+moneyfmt(Math.abs(diff)),false)
	removeclass("#cstotal",["text-emerald-400","text-red-400","text-amber-400"])
	removeclass("#csdiff",["text-emerald-400","text-red-400","text-amber-400"])
	let color=(diff==0?"text-emerald-400":(diff>0?"text-red-400":"text-amber-400"))
	addclass("#cstotal",[color])
	addclass("#csdiff",[color])
}

function loadcsprofilechips(){
	ptloadprofilechipdenoms(function(denoms){
		if(!denoms||denoms.length<1){
			return
		}
		let newlist=[]
		for(let i=0;i<denoms.length;i=i+1){
			newlist.push({denom:denoms[i],count:0})
		}
		csdenoms=newlist
		csautofill()
	})
}

function applycslanguage(){
	document.title=cstext("title")+" - PokerTrace"
	innertext("#cstitle",cstext("title"),false)
	innertext("#back",cstext("back"),false)
	innertext("#csstacklabel",cstext("stack"),false)
	value("#csauto",cstext("auto"))
	innertext("#csdenomtitle",cstext("denomtitle"),false)
	value("#csprofilechips",pttoolchiptext("load"))
	value("#csadd","+ "+cstext("denom"))
	innertext("#cshdenom",cstext("denom"),false)
	innertext("#cshcount",cstext("count"),false)
	innertext("#cshsub",cstext("sub"),false)
	innertext("#cstotallabel",cstext("total"),false)
	innertext("#cschipslabel",cstext("chips"),false)
	innertext("#csdifflabel",cstext("diff"),false)
	innertext("#csnote",cstext("note"),false)
}

onclick("#csauto",csautofill)
onenterclick("#csstack",function(){click("#csauto")})
onclick("#csprofilechips",loadcsprofilechips)
onclick("#csadd",function(){
	if(csdenoms.length>=8){
		return
	}
	csdenoms.push({denom:0,count:0})
	rendercsrows()
	rendercstotals()
})
oninput("#csstack",rendercstotals)

applycslanguage()
rendercsrows()
rendercstotals()
