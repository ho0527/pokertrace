function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

let cidenoms=[
	{denom:25,per:8},
	{denom:100,per:8},
	{denom:500,per:6},
	{denom:1000,per:6},
	{denom:5000,per:2}
]

function citext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["chipinventorypage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["chipinventorypage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

// 已載入的個人牌組（[{value,color,shape,label}]）。空陣列代表沒載入過，列上就不顯示色塊。
let ciloadedchiplist=[]

function rendercigrid(){
	let host=domgetid("cigrid")
	host.innerHTML=""
	for(let i=0;i<cidenoms.length;i=i+1){
		let row=document.createElement("div")
		row.className="flex items-center gap-2"
		row.innerHTML=`
			${ptchipswatchhtml(cidenoms[i].denom)}
			<input type="number" min="0" inputmode="numeric" value="${cidenoms[i].denom}" data-cidenom="${i}" class="min-h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400">
			<input type="number" min="0" inputmode="numeric" value="${cidenoms[i].per}" data-ciper="${i}" class="min-h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400">
			<span class="flex-1 text-right font-mono text-emerald-400" data-citotal="${i}">-</span>
		`
		host.appendChild(row)
	}
	ptchipswatchapply(host,ciloadedchiplist)
	let denomlist=host.querySelectorAll("[data-cidenom]")
	for(let i=0;i<denomlist.length;i=i+1){
		denomlist[i].addEventListener("input",function(){
			cidenoms[parseInt(this.getAttribute("data-cidenom"),10)].denom=num(this.value)
			// 面額改了色塊要跟著換；改成牌組裡沒有的值時 ptchipswatchapply() 會把色塊隱藏
			let swatch=this.parentElement.querySelector("[data-chipswatch]")
			if(swatch){
				swatch.setAttribute("data-chipswatch",num(this.value))
				ptchipswatchapply(this.parentElement,ciloadedchiplist)
			}
			calcci()
		})
	}
	let perlist=host.querySelectorAll("[data-ciper]")
	for(let i=0;i<perlist.length;i=i+1){
		perlist[i].addEventListener("input",function(){
			cidenoms[parseInt(this.getAttribute("data-ciper"),10)].per=num(this.value)
			calcci()
		})
	}
}

function calcci(){
	let entries=num(getvalue("cientries"))
	let host=domgetid("cigrid")
	let totalchips=0
	let totalvalue=0
	for(let i=0;i<cidenoms.length;i=i+1){
		let chips=cidenoms[i].per*entries
		totalchips=totalchips+chips
		totalvalue=totalvalue+chips*cidenoms[i].denom
		let span=host.querySelector("[data-citotal=\""+i+"\"]")
		if(span){
			span.textContent=moneyfmt(chips)
		}
	}
	innertext("#cichips",moneyfmt(totalchips),false)
	innertext("#civalue","$"+moneyfmt(totalvalue),false)
}

function loadciprofilechips(){
	ptloadprofilechiplist(function(chiplist){
		if(!chiplist||chiplist.length<1){
			return
		}
		ciloadedchiplist=chiplist
		let oldlist=cidenoms
		let newlist=[]
		for(let i=0;i<chiplist.length;i=i+1){
			let per=0
			for(let j=0;j<oldlist.length;j=j+1){
				if(oldlist[j].denom==chiplist[i]["value"]){
					per=oldlist[j].per
				}
			}
			newlist.push({denom:chiplist[i]["value"],per:per})
		}
		cidenoms=newlist
		rendercigrid()
		calcci()
	})
}

function applycilanguage(){
	document.title=citext("title")+" - PokerTrace"
	innertext("#cititle",citext("title"),false)
	innertext("#back",citext("back"),false)
	innertext("#cientrieslabel",citext("entries"),false)
	value("#ciprofilechips",pttoolchiptext("load"))
	innertext("#cihdenom",citext("denom"),false)
	innertext("#cihper",citext("per"),false)
	innertext("#cihtotal",citext("total"),false)
	innertext("#cichipslabel",citext("chips"),false)
	innertext("#civaluelabel",citext("value"),false)
	innertext("#cinote",citext("note"),false)
}

oninput("#cientries",calcci)
onclick("#ciprofilechips",loadciprofilechips)

applycilanguage()
rendercigrid()
calcci()

// TASK-019：庫存列是動態產生的、沒有 id，見 initialize.js 的 pttoolstatecustom 說明。
function pttoolstatecustom(){
	return { "cidenoms": cidenoms }
}

function pttoolstatecustomapply(data){
	if(!data||!Array.isArray(data["cidenoms"])){
		return
	}
	cidenoms=data["cidenoms"]
	rendercigrid()
	calcci()
}
