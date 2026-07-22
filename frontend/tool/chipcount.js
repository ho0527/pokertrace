function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

let cndenoms=[25,100,500,1000,5000,25000]

function cntext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["chipcountpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["chipcountpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function rendercngrid(){
	let host=domgetid("cngrid")
	host.innerHTML=""
	for(let i=0;i<cndenoms.length;i=i+1){
		let row=document.createElement("div")
		row.className="flex items-center gap-2"
		row.innerHTML=`
			<input type="number" min="0" inputmode="numeric" value="${cndenoms[i]}" data-cndenom="${i}" class="min-h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400">
			<input type="number" min="0" inputmode="numeric" value="0" data-cncount="${i}" class="min-h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400">
			<span class="flex-1 text-right font-mono text-zinc-300" data-cnsub="${i}">$0</span>
		`
		host.appendChild(row)
	}
	let denomlist=host.querySelectorAll("[data-cndenom]")
	for(let i=0;i<denomlist.length;i=i+1){
		denomlist[i].addEventListener("input",function(){
			cndenoms[parseInt(this.getAttribute("data-cndenom"),10)]=num(this.value)
			calccn()
		})
	}
	let countlist=host.querySelectorAll("[data-cncount]")
	for(let i=0;i<countlist.length;i=i+1){
		countlist[i].addEventListener("input",calccn)
	}
}

function loadcnprofilechips(){
	ptloadprofilechipdenoms(function(denoms){
		if(!denoms||denoms.length<1){
			return
		}
		cndenoms=denoms
		rendercngrid()
		calccn()
	})
}

function calccn(){
	let host=domgetid("cngrid")
	let total=0
	let chips=0
	for(let i=0;i<cndenoms.length;i=i+1){
		let countinput=host.querySelector("[data-cncount=\""+i+"\"]")
		let count=(function(){if(countinput){return num(countinput.value)}return 0})()
		let sub=cndenoms[i]*count
		total=total+sub
		chips=chips+count
		let span=host.querySelector("[data-cnsub=\""+i+"\"]")
		if(span){
			span.textContent="$"+moneyfmt(sub)
		}
	}
	innertext("#cntotal","$"+moneyfmt(total),false)
	innertext("#cnchips",moneyfmt(chips),false)
}

function applycnlanguage(){
	document.title=cntext("title")+" - PokerTrace"
	innertext("#cntitle",cntext("title"),false)
	innertext("#back",cntext("back"),false)
	innertext("#cnhdenom",cntext("denom"),false)
	innertext("#cnhcount",cntext("count"),false)
	innertext("#cnhsub",cntext("sub"),false)
	value("#cnprofilechips",pttoolchiptext("load"))
	innertext("#cntotallabel",cntext("total"),false)
	innertext("#cnchipslabel",cntext("chips"),false)
	innertext("#cnnote",cntext("note"),false)
}

onclick("#cnprofilechips",loadcnprofilechips)

applycnlanguage()
rendercngrid()
calccn()
