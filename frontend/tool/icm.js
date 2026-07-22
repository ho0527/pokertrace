function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

let icmstacks=[20000,12000,8000,5000]
let icmpayouts=[5000,3000,2000]

function icmtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["icmpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["icmpage"][key]||key
}

function icmcalc(stacks,payouts){
	let n=stacks.length
	let results=[]
	for(let i=0;i<n;i=i+1){
		results.push(0)
	}
	let maxprize=Math.min(payouts.length,n)
	function recurse(remaining,prizeindex,prob){
		if(prizeindex>=maxprize||remaining.length==0){
			return
		}
		let sum=0
		for(let k=0;k<remaining.length;k=k+1){
			sum=sum+stacks[remaining[k]]
		}
		if(sum<=0){
			return
		}
		for(let k=0;k<remaining.length;k=k+1){
			let idx=remaining[k]
			let p=prob*stacks[idx]/sum
			results[idx]=results[idx]+p*payouts[prizeindex]
			if(prizeindex+1<maxprize){
				let next=[]
				for(let m=0;m<remaining.length;m=m+1){
					if(remaining[m]!=idx){
						next.push(remaining[m])
					}
				}
				recurse(next,prizeindex+1,p)
			}
		}
	}
	let all=[]
	for(let i=0;i<n;i=i+1){
		all.push(i)
	}
	recurse(all,0,1)
	return results
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function rendericmstacks(){
	let host=domgetid("icmstacks")
	host.innerHTML=""
	for(let i=0;i<icmstacks.length;i=i+1){
		let row=document.createElement("div")
		row.className="flex items-center gap-2"
		row.innerHTML=`
			<span class="handrow-label">${icmtext("player")} ${i+1}</span>
			<input type="number" min="0" inputmode="numeric" value="${icmstacks[i]}" data-stack="${i}" class="min-h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400">
			<input type="button" class="handrow-remove" data-stackremove="${i}" value="${icmtext("remove")}">
		`
		host.appendChild(row)
	}
	let inputs=host.querySelectorAll("[data-stack]")
	for(let i=0;i<inputs.length;i=i+1){
		inputs[i].addEventListener("input",function(){
			// min="0" 對手動輸入沒有強制力，負計分牌會讓 ICM 機率變成無意義的負值，這裡直接夾到 0
			let stackvalue=num(this.value)
			if(stackvalue<0){
				stackvalue=0
			}
			icmstacks[parseInt(this.getAttribute("data-stack"),10)]=stackvalue
			rendericmresults()
		})
	}
	let removes=host.querySelectorAll("[data-stackremove]")
	for(let i=0;i<removes.length;i=i+1){
		removes[i].addEventListener("click",function(){
			if(icmstacks.length<=2){
				pttoast(icmtext("minstack"),"warning")
				return
			}
			icmstacks.splice(parseInt(this.getAttribute("data-stackremove"),10),1)
			rendericmstacks()
			rendericmresults()
		})
	}
}

function rendericmpayouts(){
	let host=domgetid("icmpayouts")
	host.innerHTML=""
	for(let i=0;i<icmpayouts.length;i=i+1){
		let row=document.createElement("div")
		row.className="flex items-center gap-2"
		row.innerHTML=`
			<span class="handrow-label">#${i+1}</span>
			<input type="number" min="0" inputmode="numeric" value="${icmpayouts[i]}" data-payout="${i}" class="min-h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400">
			<input type="button" class="handrow-remove" data-payoutremove="${i}" value="${icmtext("remove")}">
		`
		host.appendChild(row)
	}
	let inputs=host.querySelectorAll("[data-payout]")
	for(let i=0;i<inputs.length;i=i+1){
		inputs[i].addEventListener("input",function(){
			let payoutvalue=num(this.value)
			if(payoutvalue<0){
				payoutvalue=0
			}
			icmpayouts[parseInt(this.getAttribute("data-payout"),10)]=payoutvalue
			rendericmresults()
		})
	}
	let removes=host.querySelectorAll("[data-payoutremove]")
	for(let i=0;i<removes.length;i=i+1){
		removes[i].addEventListener("click",function(){
			if(icmpayouts.length<=1){
				pttoast(icmtext("minpayout"),"warning")
				return
			}
			icmpayouts.splice(parseInt(this.getAttribute("data-payoutremove"),10),1)
			rendericmpayouts()
			rendericmresults()
		})
	}
}

function rendericmresults(){
	let icm=icmcalc(icmstacks,icmpayouts)
	let totalchips=0
	for(let i=0;i<icmstacks.length;i=i+1){
		totalchips=totalchips+icmstacks[i]
	}
	let totalprize=0
	for(let i=0;i<icmpayouts.length;i=i+1){
		totalprize=totalprize+icmpayouts[i]
	}
	let html=`
		<div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
			<span class="handrow-label"></span>
			<span class="flex-1">${icmtext("icmev")}</span>
			<span class="flex-1">${icmtext("chipchop")}</span>
		</div>
	`
	for(let i=0;i<icmstacks.length;i=i+1){
		let chop=(function(){if(totalchips>0){return icmstacks[i]/totalchips*totalprize}return 0})()
		html=html+`
			<div class="flex items-center gap-2">
				<span class="handrow-label">${icmtext("player")} ${i+1}</span>
				<span class="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-2 font-mono text-emerald-400">$${moneyfmt(icm[i])}</span>
				<span class="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-2 font-mono text-zinc-300">$${moneyfmt(chop)}</span>
			</div>
		`
	}
	innerhtml("#icmresults",html,false)
}

function applyicmlanguage(){
	document.title=icmtext("title")+" - PokerTrace"
	innertext("#icmtitle",icmtext("title"),false)
	innertext("#back",icmtext("back"),false)
	innertext("#icmstackstitle",icmtext("stacks"),false)
	innertext("#icmpayoutstitle",icmtext("payouts"),false)
	innertext("#icmresulttitle",icmtext("result"),false)
	value("#icmaddstack","+ "+icmtext("player"))
	value("#icmaddpayout","+ "+icmtext("rank"))
	innertext("#icmnote",icmtext("note"),false)
}

onclick("#icmaddstack",function(){
	if(icmstacks.length>=9){
		return
	}
	icmstacks.push(10000)
	rendericmstacks()
	rendericmresults()
})

onclick("#icmaddpayout",function(){
	if(icmpayouts.length>=9){
		return
	}
	icmpayouts.push(1000)
	rendericmpayouts()
	rendericmresults()
})

applyicmlanguage()
rendericmstacks()
rendericmpayouts()
rendericmresults()
