function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

let spplayers=[
	{name:"A",chips:3000,eligible:true},
	{name:"B",chips:8000,eligible:true},
	{name:"C",chips:5000,eligible:true}
]

function sptext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["sidepotpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["sidepotpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function esc(text){
	return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

function computepots(players){
	let active=[]
	for(let i=0;i<players.length;i=i+1){
		if(players[i].chips>0){
			active.push({name:players[i].name,chips:players[i].chips,eligible:players[i].eligible,idx:i})
		}
	}
	let levelset={}
	for(let i=0;i<active.length;i=i+1){
		levelset[active[i].chips]=true
	}
	let levels=Object.keys(levelset).map(function(v){return parseFloat(v)}).sort(function(a,b){return a-b})
	let prev=0
	let raw=[]
	for(let l=0;l<levels.length;l=l+1){
		let lv=levels[l]
		let layer=lv-prev
		let contributors=[]
		let eligible=[]
		let eligibleidx=[]
		for(let i=0;i<active.length;i=i+1){
			if(active[i].chips>=lv){
				contributors.push(active[i])
				if(active[i].eligible){
					eligible.push(active[i].name)
					eligibleidx.push(active[i].idx)
				}
			}
		}
		raw.push({amount:layer*contributors.length,eligible:eligible,key:eligibleidx.join("|")})
		prev=lv
	}
	let merged=[]
	for(let i=0;i<raw.length;i=i+1){
		if(merged.length>0&&merged[merged.length-1].key==raw[i].key){
			merged[merged.length-1].amount=merged[merged.length-1].amount+raw[i].amount
		}else{
			merged.push({amount:raw[i].amount,eligible:raw[i].eligible,key:raw[i].key})
		}
	}
	return merged
}

function renderplayers(){
	let host=domgetid("spplayers")
	host.innerHTML=""
	for(let i=0;i<spplayers.length;i=i+1){
		let p=spplayers[i]
		let checkedtext=""
		if(p.eligible){
			checkedtext="checked"
		}
		let row=document.createElement("div")
		row.className="flex items-center gap-2"
		row.innerHTML=`
			<input type="text" value="${esc(p.name)}" data-spname="${i}" class="min-h-12 w-28 sm:w-36 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400">
			<input type="number" min="0" inputmode="numeric" value="${p.chips}" data-spchips="${i}" class="min-h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400">
			<label class="flex w-24 items-center justify-center"><input type="checkbox" class="h-5 w-5 accent-emerald-500" data-spfold="${i}" ${checkedtext}></label>
			<input type="button" class="handrow-remove w-12" data-spremove="${i}" value="${sptext("remove")}">
		`
		host.appendChild(row)
	}
	let names=host.querySelectorAll("[data-spname]")
	for(let i=0;i<names.length;i=i+1){
		names[i].addEventListener("input",function(){
			spplayers[parseInt(this.getAttribute("data-spname"),10)].name=this.value
			renderresults()
		})
	}
	let chips=host.querySelectorAll("[data-spchips]")
	for(let i=0;i<chips.length;i=i+1){
		chips[i].addEventListener("input",function(){
			spplayers[parseInt(this.getAttribute("data-spchips"),10)].chips=num(this.value)
			renderresults()
		})
	}
	let folds=host.querySelectorAll("[data-spfold]")
	for(let i=0;i<folds.length;i=i+1){
		folds[i].addEventListener("change",function(){
			spplayers[parseInt(this.getAttribute("data-spfold"),10)].eligible=this.checked
			renderresults()
		})
	}
	let removes=host.querySelectorAll("[data-spremove]")
	for(let i=0;i<removes.length;i=i+1){
		removes[i].addEventListener("click",function(){
			if(spplayers.length<=2){
				pttoast(sptext("minplayer"),"warning")
				return
			}
			spplayers.splice(parseInt(this.getAttribute("data-spremove"),10),1)
			renderplayers()
			renderresults()
		})
	}
}

function renderresults(){
	let total=0
	for(let i=0;i<spplayers.length;i=i+1){
		if(spplayers[i].chips>0){
			total=total+spplayers[i].chips
		}
	}
	innertext("#sptotal","$"+moneyfmt(total),false)
	let pots=computepots(spplayers)
	let html=""
	for(let i=0;i<pots.length;i=i+1){
		let label=(i==0?sptext("mainpot"):sptext("sidepot")+" "+i)
		let names=(function(){if(pots[i].eligible.length>0){return esc(pots[i].eligible.join("、"))}return sptext("noeligible")})()
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
				<div class="flex items-center justify-between">
					<div class="font-bold text-white">${label}</div>
					<div class="font-mono text-xl font-extrabold text-emerald-400">$${moneyfmt(pots[i].amount)}</div>
				</div>
				<div class="mt-1 text-sm text-zinc-400">${sptext("eligible")}：${names}</div>
			</div>
		`
	}
	if(pots.length==0){
		html=`<div class="text-sm text-zinc-500">${sptext("empty")}</div>`
	}
	innerhtml("#spresults",html,false)
}

function applysplanguage(){
	document.title=sptext("title")+" - PokerTrace"
	innertext("#sptitle",sptext("title"),false)
	innertext("#back",sptext("back"),false)
	innertext("#spplayerstitle",sptext("playerstitle"),false)
	value("#spaddplayer","+ "+sptext("player"))
	innertext("#spnamehead",sptext("name"),false)
	innertext("#spchipshead",sptext("chips"),false)
	innertext("#spfoldhead",sptext("showdown"),false)
	innertext("#spnote",sptext("note"),false)
	innertext("#spresulttitle",sptext("resulttitle"),false)
	innertext("#sptotallabel",sptext("total"),false)
}

onclick("#spaddplayer",function(){
	if(spplayers.length>=10){
		return
	}
	spplayers.push({name:String.fromCharCode(65+spplayers.length),chips:5000,eligible:true})
	renderplayers()
	renderresults()
})

applysplanguage()
renderplayers()
renderresults()

// TASK-019：選手列是動態產生的、沒有 id，見 initialize.js 的 pttoolstatecustom 說明。
function pttoolstatecustom(){
	return { "spplayers": spplayers }
}

function pttoolstatecustomapply(data){
	if(!data||!Array.isArray(data["spplayers"])){
		return
	}
	spplayers=data["spplayers"]
	renderplayers()
	renderresults()
}
