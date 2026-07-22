if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let leaveguard=bindleaveguard()

function batchtext(key){
	return TRANSLATE[LANGUAGE]["batch"][key]||key
}
function seriestext(key){
	return TRANSLATE[LANGUAGE]["series"][key]||key
}
function safehtml(value){
	if(value==null||value==undefined){
		return ""
	}
	return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")
}

// Excel 風格的 flight 標籤: 0->A, 25->Z, 26->AA
function lab(i){
	let s=""
	i=i+1
	while(i>0){
		let m=(i-1)%26
		s=String.fromCharCode(65+m)+s
		i=Math.floor((i-1)/26)
	}
	return s
}

let state={
	ladder: [],       // [{sb,bb,ante}] 一般結構, 來自盲注解析
	turboladder: [],  // [{sb,bb,ante}] Turbo 專用結構; 空的話 turbo 場次沿用一般結構
	rounds: [],       // [{prefix,count,fromLv,toLv,dur,turbo:[bool],sources:[string],start,interval,customtime,starts:[string]}]
	chips: [          // [{shape,value,color}] 寫進每個新建場次的 sessionchip 清單
		{shape: "circle",value: 100,color: "#ffffff"},
		{shape: "circle",value: 500,color: "#ef4444"},
		{shape: "circle",value: 1000,color: "#f59e0b"},
		{shape: "circle",value: 5000,color: "#22c55e"},
		{shape: "circle",value: 10000,color: "#3b82f6"}
	],
	step: 1
}
let MAXSTEP=5

function fillselect(id,row,group){
	let html=""
	let label=""
	for(let i=0;i<row.length;i=i+1){
		label=row[i]["code"]
		if(TRANSLATE&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["type"]&&TRANSLATE[LANGUAGE]["type"][group]&&TRANSLATE[LANGUAGE]["type"][group][row[i]["code"]]){
			label=TRANSLATE[LANGUAGE]["type"][group][row[i]["code"]]
		}
		html=html+`<option value="${row[i]["id"]}">${safehtml(label)}</option>`
	}
	innerhtml("#"+id,html,false)
}

function loadtypelist(){
	ajax("GET",AJAXURL+"gettypelist",function(event,data){
		if(data["success"]){
			let typemap=data["data"]
			fillselect("b-gametype",typemap["game"],"game")
			fillselect("b-limittype",typemap["limit"],"limit")
			fillselect("b-stacktype",typemap["stack"],"stack")
			fillselect("b-eventtype",typemap["event"],"event")
		}
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
}

function setstepitemstate(element,step){
	let bubble=element.querySelector("span")
	let label=element.querySelectorAll("span")[1]
	let activeed=step==state.step
	element.className="flex min-h-[64px] items-center gap-2 rounded-2xl border px-4 py-3 text-left transition cursor-pointer"
	element.classList.add(activeed?"border-emerald-400":"border-zinc-800")
	element.classList.add(activeed?"bg-emerald-950/30":"bg-zinc-950")
	if(bubble){
		bubble.className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border text-sm font-extrabold"
		bubble.classList.add(activeed?"border-emerald-400":"border-zinc-700")
		bubble.classList.add(activeed?"bg-emerald-700":"bg-zinc-950")
		bubble.classList.add(activeed?"text-white":"text-zinc-300")
	}
	if(label){
		label.className="text-sm font-bold "+(activeed?"text-white":"text-zinc-300")
	}
}

function renderstep(){
	let panels=document.querySelectorAll("[data-steppanel]")
	for(let i=0;i<panels.length;i=i+1){
		panels[i].classList.toggle("hidden",int(dataset(panels[i],"steppanel"))!=state.step)
	}
	let items=document.querySelectorAll("[data-stepitem]")
	for(let i=0;i<items.length;i=i+1){
		setstepitemstate(items[i],int(dataset(items[i],"stepitem")))
	}
	domgetid("b-prevstep").disabled=state.step<=1
	domgetid("b-prevstep").classList.toggle("opacity-40",state.step<=1)
	domgetid("b-nextstep").classList.toggle("hidden",state.step>=MAXSTEP)
	if(state.step==MAXSTEP){
		renderpreview()
	}
	window.scrollTo({"top": 0,"behavior": "smooth"})
}

function gotostep(step){
	let target=int(step)
	if(target<1){ target=1 }
	if(target>MAXSTEP){ target=MAXSTEP }
	state.step=target
	renderstep()
}

// 在某個系列賽裡批量建立 (?seriesid=)；沒有就是建立一個新系列賽
let attachseriesid=getget("seriesid")

function keyOf(r,i){
	return state.rounds[r].prefix+lab(i)
}
function nameOf(r,i){
	return state.rounds[r].prefix+"-"+lab(i)
}
function keysOf(r){
	let out=[]
	for(let i=0;i<state.rounds[r].count;i=i+1){
		out.push(keyOf(r,i))
	}
	return out
}

// 上一層平均分配到這一層 (範本預設; 之後可手動改)
function autoSources(prevKeys,thisCount){
	let res=[]
	let per=Math.ceil(prevKeys.length/Math.max(thisCount,1))
	for(let j=0;j<thisCount;j=j+1){
		res.push(prevKeys.slice(j*per,(j+1)*per).join(","))
	}
	return res
}

function ensureround(round,prevKeys){
	if(!round.turbo){
		round.turbo=[]
	}
	while(round.turbo.length<round.count){
		round.turbo.push(false)
	}
	round.turbo.length=round.count
	if(!round.starts){
		round.starts=[]
	}
	while(round.starts.length<round.count){
		round.starts.push("")
	}
	round.starts.length=round.count
	if(!round.sources){
		round.sources=[]
	}
	if(prevKeys){
		round.sources=autoSources(prevKeys,round.count)
	}else{
		round.sources.length=round.count
	}
}

// 套用範本: counts 例如 [16,4,2,1]
function applytemplate(counts){
	state.rounds=[]
	let prevTo=0
	for(let r=0;r<counts.length;r=r+1){
		let fromLv,toLv,dur
		if(r==0){
			fromLv=1; toLv=12; dur=25
		}else if(r==1){
			fromLv=13; toLv=25; dur=20
		}else{
			fromLv=prevTo+1; toLv=prevTo+4; dur=20
		}
		prevTo=toLv
		let round={
			prefix: "D"+(r+1),
			count: counts[r],
			fromLv: fromLv,
			toLv: toLv,
			dur: dur,
			turbo: [],
			sources: [],
			start: "",
			interval: counts[r]>1?120:0,
			customtime: false,
			starts: []
		}
		// 16 組範本預設把每 4 組的第 4 組設 turbo (對應 D/H/L/P)
		for(let i=0;i<round.count;i=i+1){
			round.turbo.push(r==0&&counts[0]==16&&(i%4==3))
		}
		state.rounds.push(round)
	}
	// 重算每層 sources
	for(let r=1;r<state.rounds.length;r=r+1){
		state.rounds[r].sources=autoSources(keysOf(r-1),state.rounds[r].count)
	}
	renderrounds()
}

// 把個人資料的面額由小到大排, 依每幾級休息一次的間隔排進 colorups (例如 8=10,12=50)
function colorupsfromdenoms(denoms){
	let breakevery=int(getvalue("b-breakevery"))||4
	let regclose=int(getvalue("b-regclose"))||0
	let sorted=denoms.slice().sort(function(a,b){ return a-b })
	let parts=[]
	let lv=breakevery
	for(let i=0;i<sorted.length;i=i+1){
		if(regclose>0&&lv>=regclose){
			break
		}
		parts.push(lv+"="+sorted[i])
		lv=lv+breakevery
	}
	return parts.join(",")
}

function loadcolorupsfromprofile(){
	ptloadprofilechipdenoms(function(denoms){
		if(!denoms||denoms.length<1){
			return
		}
		value("#b-colorups",colorupsfromdenoms(denoms))
		renderpreview()
	})
}

function colorupmap(){
	let map={}
	let raw=getvalue("b-colorups")||""
	let parts=raw.split(",")
	for(let i=0;i<parts.length;i=i+1){
		let kv=parts[i].split("=")
		if(kv.length==2){
			let lv=parseInt(kv[0].trim(),10)
			let denom=parseInt(kv[1].trim(),10)
			if(lv>0&&denom>0){
				map[lv]=denom
			}
		}
	}
	return map
}

// useitemdur: 級別自帶 dur 時優先使用 (turbo 結構的每級時長跟著匯入的結構走)
function buildschedule(fromLv,toLv,dur,ladder,useitemdur){
	let breakEvery=int(getvalue("b-breakevery"))||0
	let breakDur=int(getvalue("b-breakdur"))||10
	let regclose=int(getvalue("b-regclose"))||0
	let cu=colorupmap()
	let s=[]
	for(let lv=fromLv;lv<=toLv;lv=lv+1){
		if(lv-1>=ladder.length){
			break
		}
		let base=ladder[lv-1]
		let lvdur=(useitemdur&&int(base["dur"])>0)?int(base["dur"]):dur
		let item={"type": "level","sb": base["sb"],"bb": base["bb"],"ante": base["ante"],"dur": lvdur}
		if(lv==regclose){
			item["regCloseAfter"]=true
		}
		s.push(item)
		if(cu[lv]){
			s.push({"type": "break","dur": breakDur,"chipRaiseValues": [cu[lv]]})
		}else if(breakEvery>0&&lv%breakEvery==0&&lv<toLv){
			s.push({"type": "break","dur": breakDur})
		}
	}
	return s
}

function buildspec(){
	let flights=[]
	for(let r=0;r<state.rounds.length;r=r+1){
		let round=state.rounds[r]
		for(let i=0;i<round.count;i=i+1){
			let isturbo=(r==0&&round.turbo[i])
			// turbo 場次優先用 turbo 專用結構 (含其每級時長); 沒匯入就沿用一般結構
			let useturbo=isturbo&&state.turboladder.length>0
			let ladder=useturbo?state.turboladder:state.ladder
			let sched=buildschedule(round.fromLv,round.toLv,round.dur,ladder,useturbo)
			let flight={"key": keyOf(r,i),"name": nameOf(r,i),"schedule": sched}
			let sms=flightstartms(round,i)
			if(sms!=null){
				flight["starttime"]=fmtdt(sms)
				flight["endtime"]=fmtdt(sms+schedulemins(sched)*60000)
			}
			flights.push(flight)
		}
	}
	let advancement=[]
	for(let r=1;r<state.rounds.length;r=r+1){
		let round=state.rounds[r]
		for(let i=0;i<round.count;i=i+1){
			let src=(round.sources[i]||"").split(",").map(function(x){return x.trim()}).filter(function(x){return x})
			if(src.length){
				advancement.push({"from": src,"to": keyOf(r,i)})
			}
		}
	}
	return {"flights": flights,"advancement": advancement}
}

function roundcard(r){
	let round=state.rounds[r]
	// 時間設定: 固定間隔 (起始+每場間隔) 或 每場自訂開始時間
	let timehtml=""
	if(round.customtime){
		let trows=""
		for(let i=0;i<round.count;i=i+1){
			trows=trows+`
				<label class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-sm text-zinc-300">${nameOf(r,i)}</span>
					<input type="datetime-local" class="flex-1 min-h-9 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400 r-fstart" data-r="${r}" data-i="${i}" value="${safehtml((round.starts&&round.starts[i])||"")}">
				</label>
			`
		}
		timehtml=`<div class="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-2">${trows}</div>`
	}else{
		timehtml=`
			<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
				<label class="flex flex-col gap-1"><span class="text-xs text-zinc-500">${batchtext("start")}</span>
					<input type="datetime-local" class="min-h-9 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400 r-start" data-r="${r}" value="${safehtml(round.start||"")}"></label>
				<label class="flex flex-col gap-1"><span class="text-xs text-zinc-500">${batchtext("interval")}</span>
					<input type="number" min="0" inputmode="numeric" class="min-h-9 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400 r-interval" data-r="${r}" value="${round.interval}"></label>
			</div>
		`
	}
	timehtml=`
		<label class="mt-2 inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
			<input type="checkbox" class="h-4 w-4 accent-emerald-500 r-customtime" data-r="${r}" ${round.customtime?"checked":""}>${batchtext("customtime")}
		</label>
		${timehtml}
	`
	let turbohtml=""
	if(r==0){
		let boxes=""
		for(let i=0;i<round.count;i=i+1){
			boxes=boxes+`<label class="inline-flex items-center gap-1 mr-2 mb-1 text-xs text-zinc-300"><input type="checkbox" class="h-4 w-4 accent-amber-500 r-turbo" data-r="${r}" data-i="${i}" ${round.turbo[i]?"checked":""}>${lab(i)}</label>`
		}
		turbohtml=`
			<div class="mt-2">
				<div class="text-xs text-zinc-500 mb-1">${batchtext("turbo")}</div>
				<div class="flex flex-wrap">${boxes}</div>
			</div>
		`
	}
	let maphtml=""
	if(r>0){
		let rows=""
		for(let i=0;i<round.count;i=i+1){
			rows=rows+`
				<div class="flex items-center gap-2">
					<div class="w-20 shrink-0 text-sm text-zinc-300">${nameOf(r,i)}</div>
					<span class="text-zinc-600 text-xs">←</span>
					<input type="text" class="flex-1 min-h-9 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400 r-source" data-r="${r}" data-i="${i}" value="${safehtml(round.sources[i]||"")}" placeholder="${batchtext("sourcesph")}">
				</div>
			`
		}
		maphtml=`<div class="mt-3"><div class="text-xs text-zinc-500 mb-1">${batchtext("sources")}</div><div class="flex flex-col gap-1.5">${rows}</div></div>`
	}
	return `
		<div class="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
			<div class="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
				<label class="flex flex-col gap-1"><span class="text-xs text-zinc-500">${batchtext("prefix")}</span>
					<input type="text" class="min-h-9 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400 r-prefix" data-r="${r}" value="${safehtml(round.prefix)}"></label>
				<label class="flex flex-col gap-1"><span class="text-xs text-zinc-500">${batchtext("count")}</span>
					<input type="number" min="1" max="32" inputmode="numeric" class="min-h-9 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400 r-count" data-r="${r}" value="${round.count}"></label>
				<label class="flex flex-col gap-1"><span class="text-xs text-zinc-500">${batchtext("fromlv")}</span>
					<input type="number" min="1" inputmode="numeric" class="min-h-9 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400 r-from" data-r="${r}" value="${round.fromLv}"></label>
				<label class="flex flex-col gap-1"><span class="text-xs text-zinc-500">${batchtext("tolv")}</span>
					<input type="number" min="1" inputmode="numeric" class="min-h-9 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400 r-to" data-r="${r}" value="${round.toLv}"></label>
				<label class="flex flex-col gap-1"><span class="text-xs text-zinc-500">${batchtext("dur")} (min)</span>
					<input type="number" min="1" inputmode="numeric" class="min-h-9 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400 r-dur" data-r="${r}" value="${round.dur}"></label>
			</div>
			${timehtml}
			${turbohtml}
			${maphtml}
		</div>
	`
}

function renderrounds(){
	let html=""
	for(let r=0;r<state.rounds.length;r=r+1){
		html=html+roundcard(r)
	}
	innerhtml("#b-rounds",html||`<div class="text-sm text-zinc-500">${batchtext("noround")}</div>`,false)
	bindrounds()
}

function bindrounds(){
	onchange(".r-prefix",function(el){
		let r=int(dataset(el,"r"))
		state.rounds[r].prefix=el.value||("D"+(r+1))
		// prefix 變了, 下一層的來源 key 也要更新
		if(r+1<state.rounds.length){
			state.rounds[r+1].sources=autoSources(keysOf(r),state.rounds[r+1].count)
		}
		renderrounds()
	})
	onchange(".r-count",function(el){
		let r=int(dataset(el,"r"))
		let c=int(el.value)||1
		if(c<1){c=1}
		if(c>32){c=32}
		state.rounds[r].count=c
		ensureround(state.rounds[r],null)
		// 本層 keys 變了 → 下一層來源重算; 本層來源依上一層重算
		if(r>0){
			state.rounds[r].sources=autoSources(keysOf(r-1),c)
		}
		if(r+1<state.rounds.length){
			state.rounds[r+1].sources=autoSources(keysOf(r),state.rounds[r+1].count)
		}
		renderrounds()
	})
	onchange(".r-from",function(el){ state.rounds[int(dataset(el,"r"))].fromLv=int(el.value)||1 })
	onchange(".r-to",function(el){ state.rounds[int(dataset(el,"r"))].toLv=int(el.value)||1 })
	onchange(".r-dur",function(el){ state.rounds[int(dataset(el,"r"))].dur=int(el.value)||20 })
	onchange(".r-turbo",function(el){ state.rounds[int(dataset(el,"r"))].turbo[int(dataset(el,"i"))]=el.checked; renderpreview() })
	onchange(".r-source",function(el){ state.rounds[int(dataset(el,"r"))].sources[int(dataset(el,"i"))]=el.value })
	onchange(".r-start",function(el){ state.rounds[int(dataset(el,"r"))].start=el.value; renderpreview() })
	onchange(".r-interval",function(el){ state.rounds[int(dataset(el,"r"))].interval=int(el.value)||0; renderpreview() })
	onchange(".r-customtime",function(el){
		let r=int(dataset(el,"r"))
		let round=state.rounds[r]
		round.customtime=el.checked
		ensureround(round,null)
		if(el.checked){
			// 切到自訂時, 用 起始+間隔 預填每場時間 (已自訂過的不蓋)
			let base=parselocaldt(round.start)
			for(let i=0;i<round.count;i=i+1){
				if(!round.starts[i]&&base!=null){
					round.starts[i]=fmtlocaldt(base+i*(int(round.interval)||0)*60000)
				}
			}
		}
		renderrounds()
		renderpreview()
	})
	onchange(".r-fstart",function(el){ state.rounds[int(dataset(el,"r"))].starts[int(dataset(el,"i"))]=el.value; renderpreview() })
}

// datetime-local ("YYYY-MM-DDTHH:MM") -> 毫秒 (視為 +00 牆鐘時間, 不做時區換算)
function parselocaldt(s){
	if(!s){
		return null
	}
	let m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
	if(!m){
		return null
	}
	return Date.UTC(int(m[1]),int(m[2])-1,int(m[3]),int(m[4]),int(m[5]))
}

// 毫秒 -> datetime-local 字串 ("YYYY-MM-DDTHH:MM"), 與 parselocaldt 相反
function fmtlocaldt(ms){
	let d=new Date(ms)
	function p(n){ return (n<10?"0":"")+n }
	return d.getUTCFullYear()+"-"+p(d.getUTCMonth()+1)+"-"+p(d.getUTCDate())+"T"+p(d.getUTCHours())+":"+p(d.getUTCMinutes())
}

function fmtdt(ms){
	let d=new Date(ms)
	function p(n){ return (n<10?"0":"")+n }
	return d.getUTCFullYear()+"-"+p(d.getUTCMonth()+1)+"-"+p(d.getUTCDate())+" "+p(d.getUTCHours())+":"+p(d.getUTCMinutes())+":00+00"
}

function schedulemins(sched){
	let total=0
	for(let i=0;i<sched.length;i=i+1){
		total=total+(int(sched[i]["dur"])||0)
	}
	return total
}

// 取某 round 第 i 場的開始毫秒; 自訂模式看該場自己的時間, 否則 round 起始 + i×間隔; 沒設就回 null
function flightstartms(round,i){
	if(round.customtime){
		return parselocaldt(round.starts&&round.starts[i])
	}
	let base=parselocaldt(round.start)
	if(base==null){
		return null
	}
	return base+i*(int(round.interval)||0)*60000
}

function renderpreview(){
	if(!state.rounds.length){
		innerhtml("#b-preview",`<div class="text-zinc-500">${batchtext("noround")}</div>`,false)
		return
	}
	let spec=buildspec()
	let hasturbo=false
	let rows=state.rounds.map(function(round,r){
		let turbon=0
		if(r==0){ for(let i=0;i<round.count;i=i+1){ if(round.turbo[i]){turbon=turbon+1} } }
		if(turbon){ hasturbo=true }
		let timeinfo=""
		if(round.customtime){
			timeinfo=" · "+batchtext("customtime")
		}else if(round.start){
			timeinfo=" · "+batchtext("start")+" "+safehtml(ptformatdatetime(round.start))+((round.count>1&&round.interval)?(" +"+round.interval+"m"):"")
		}
		return `<div class="flex flex-wrap items-center gap-x-3 gap-y-1 py-1 border-b border-zinc-800/60">
			<span class="font-bold text-emerald-400 w-12">${safehtml(round.prefix)}</span>
			<span>${round.count} ${batchtext("flightsunit")}</span>
			<span class="text-zinc-500">Lv ${round.fromLv}-${round.toLv} · ${round.dur}min${turbon?(" · "+turbon+" turbo"):""}${timeinfo}</span>
		</div>`
	}).join("")
	let edges=spec["advancement"].map(function(e){
		return `<div class="text-xs text-zinc-400">${safehtml(e["from"].join(", "))} <span class="text-zinc-600">→</span> ${safehtml(e["to"])}</div>`
	}).join("")
	innerhtml("#b-preview",`
		<div class="mb-3">${rows}</div>
		<div class="text-sm font-bold mb-1">${batchtext("previewflights").replace("{n}",spec["flights"].length)} · ${batchtext("previewedges").replace("{n}",spec["advancement"].length)}</div>
		<div class="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 max-h-48 overflow-auto flex flex-col gap-0.5">${edges||('<span class="text-zinc-600 text-xs">—</span>')}</div>
		${state.ladder.length?"":('<div class="mt-2 text-amber-400 text-xs">'+batchtext("needparse")+'</div>')}
		${(hasturbo&&state.ladder.length&&!state.turboladder.length)?('<div class="mt-2 text-amber-400 text-xs">'+batchtext("turbofallback")+'</div>'):""}
	`,false)
}

function applylanguage(){
	document.title=batchtext("title")+" - PokerTrace"
	innertext("#pagetitle",batchtext("title"),false)
	innertext("#pagehint",batchtext("hint"),false)
	innertext("#blindhint",batchtext("blindhint"),false)
	value("#b-parse",batchtext("parse"))
	value("#b-colorupsfromprofile",pttoolchiptext("load"))
	value("#b-chipsfromprofile",pttoolchiptext("load"))
	value("#b-chipadd",batchtext("chipadd"))
	if(domgetid("b-upload")){ value("#b-upload",batchtext("upload")) }
	if(domgetid("b-savejson")){ value("#b-savejson",batchtext("savecfg")) }
	if(domgetid("b-loadjson")){ value("#b-loadjson",batchtext("loadcfg")) }
	value("#b-addround",batchtext("addround"))
	value("#b-removeround",batchtext("removeround"))
	value("#b-refresh",batchtext("refresh"))
	value("#b-create",batchtext("create"))
	domgetid("b-structtext").placeholder=batchtext("structph")
	let secs=document.querySelectorAll("[data-sec]")
	for(let i=0;i<secs.length;i=i+1){ secs[i].textContent=batchtext(dataset(secs[i],"sec")) }
	let labels=document.querySelectorAll("[data-label]")
	for(let i=0;i<labels.length;i=i+1){ labels[i].textContent=batchtext(dataset(labels[i],"label")) }
	let steplabels=document.querySelectorAll("[data-steplabel]")
	for(let i=0;i<steplabels.length;i=i+1){ steplabels[i].textContent=batchtext(dataset(steplabels[i],"steplabel")) }
	value("#b-prevstep",batchtext("prevstep"))
	value("#b-nextstep",batchtext("nextstep"))
	let opts=document.querySelectorAll("[data-opt]")
	for(let i=0;i<opts.length;i=i+1){ opts[i].textContent=seriestext(dataset(opts[i],"opt")) }
	let bopts=document.querySelectorAll("[data-bopt]")
	for(let i=0;i<bopts.length;i=i+1){ bopts[i].textContent=batchtext(dataset(bopts[i],"bopt")) }
}

// 計分牌清單 (state.chips): 會直接寫進每個新建場次的 sessionchip, 跟 colorups/起始碼分開
function renderchiprows(){
	let html=""
	for(let i=0;i<state.chips.length;i=i+1){
		let c=state.chips[i]
		html=html+`
			<div class="flex items-center gap-2">
				<input type="color" class="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 chip-color" data-i="${i}" value="${safehtml(c.color||"#888888")}">
				<select class="min-h-10 rounded-xl border border-zinc-700 bg-zinc-800 px-2 text-sm text-white outline-none focus:border-emerald-400 chip-shape" data-i="${i}">
					<option value="circle" ${c.shape!="square"?"selected":""}>●</option>
					<option value="square" ${c.shape=="square"?"selected":""}>■</option>
				</select>
				<input type="number" min="0" inputmode="numeric" class="min-h-10 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400 chip-value" data-i="${i}" value="${int(c.value)||0}">
				<input type="button" class="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-xs font-bold text-red-300 transition chip-remove" data-i="${i}" value="✕">
			</div>
		`
	}
	innerhtml("#b-chiprows",html||`<div class="text-sm text-zinc-500">-</div>`,false)
	bindchiprows()
}

function bindchiprows(){
	onchange(".chip-color",function(el){ state.chips[int(dataset(el,"i"))].color=el.value })
	onchange(".chip-shape",function(el){ state.chips[int(dataset(el,"i"))].shape=el.value })
	onchange(".chip-value",function(el){ state.chips[int(dataset(el,"i"))].value=int(el.value)||0 })
	onclick(".chip-remove",function(el){
		if(state.chips.length<=1){
			return
		}
		state.chips.splice(int(dataset(el,"i")),1)
		renderchiprows()
	})
}

function applychipstobatch(chips){
	let cleaned=[]
	for(let i=0;i<chips.length;i=i+1){
		let value=int(chips[i]["value"])||0
		if(value<=0){
			continue
		}
		cleaned.push({shape: chips[i]["shape"]=="square"?"square":"circle",value: value,color: chips[i]["color"]||"#888888"})
	}
	if(!cleaned.length){
		return
	}
	state.chips=cleaned
	renderchiprows()
}

// 直接讀個人資料的原始計分牌組合 (含 shape/color), 跟 ptloadprofilechipsets 不同 (那個只留面額數字)
function loadrawprofilechipsets(done){
	if(!weblsget(WEBLSNAME+"signin")||!weblsget(WEBLSNAME+"token")){
		pttoast(pttoolchiptext("needsignin"),"warning")
		done([])
		return
	}
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(!data||!data["success"]){
			done([])
			return
		}
		let sets=(data["data"]||{})["chipset"]||[]
		let out=[]
		for(let i=0;i<sets.length;i=i+1){
			let chips=(sets[i]["chips"]||[]).filter(function(c){ return (int(c["value"])||0)>0 })
			if(chips.length){
				out.push({name: sets[i]["name"]||"",chips: chips})
			}
		}
		done(out)
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
}

function openchipsetpickerforbatch(sets){
	let old=domgetid("b-chipsetpicker")
	if(old){
		old.parentNode.removeChild(old)
	}
	let cover=document.createElement("div")
	cover.id="b-chipsetpicker"
	cover.className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 p-4"
	let rows=""
	for(let i=0;i<sets.length;i=i+1){
		let name=safehtml(sets[i].name||batchtext("chipsetunnamed"))
		let denomtext=safehtml(sets[i].chips.map(function(c){ return c["value"] }).join("、"))
		rows=rows+`
			<div role="button" tabindex="0" data-pick="${i}" class="cursor-pointer rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 transition hover:border-emerald-500 hover:bg-zinc-700">
				<div class="text-sm font-bold text-white">${name}</div>
				<div class="mt-0.5 text-xs text-zinc-400">${batchtext("chipsetdenomcount").replace("{n}",sets[i].chips.length)} · ${denomtext}</div>
			</div>
		`
	}
	cover.innerHTML=`
		<div class="max-h-[85vh] w-full max-w-md overflow-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl">
			<div class="mb-1 text-lg font-bold text-white">${batchtext("pickchipset")}</div>
			<div class="mb-4 text-sm text-zinc-400">${batchtext("pickchipsethint")}</div>
			<div class="space-y-2">${rows}</div>
			<div class="mt-5 flex justify-end">
				<input type="button" id="b-pickcancel" class="min-h-11 rounded-2xl bg-zinc-800 px-4 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700" value="${batchtext("pickcancel")}">
			</div>
		</div>
	`
	document.body.appendChild(cover)
	function close(){
		if(cover.parentNode){
			cover.parentNode.removeChild(cover)
		}
	}
	cover.addEventListener("click",function(e){
		if(e.target==cover){
			close()
		}
	})
	domgetid("b-pickcancel").addEventListener("click",close)
	let picks=cover.querySelectorAll("[data-pick]")
	for(let i=0;i<picks.length;i=i+1){
		picks[i].addEventListener("click",function(){
			let idx=parseInt(this.getAttribute("data-pick"),10)
			applychipstobatch(sets[idx].chips)
			pttoastsuccess(batchtext("chipsloaded").replace("{n}",sets[idx].chips.length))
			close()
		})
	}
}

function loadchipsfromprofile(){
	loadrawprofilechipsets(function(sets){
		if(!sets.length){
			pttoast(pttoolchiptext("empty"),"warning")
			return
		}
		if(sets.length==1){
			applychipstobatch(sets[0].chips)
			pttoastsuccess(batchtext("chipsloaded").replace("{n}",sets[0].chips.length))
			return
		}
		openchipsetpickerforbatch(sets)
	})
}

function loadclubs(){
	ajax("GET",AJAXURL+"getclublist",function(event,data){
		if(data["success"]){
			let rows=data["data"]||[]
			let html=""
			for(let i=0;i<rows.length;i=i+1){
				html=html+`<option value="${safehtml(rows[i]["id"])}">${safehtml(rows[i]["name"])}</option>`
			}
			innerhtml("#b-club",html,false)
		}
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
}

function firstnum(obj,keys){
	for(let i=0;i<keys.length;i=i+1){
		let v=obj[keys[i]]
		if(v!=undefined&&v!=null&&v!==""){
			return int(v)
		}
	}
	return 0
}

// 從任意級別陣列 (盲注生成器輸出 / app schedule / 純 ladder) 抽出 {sb,bb,ante}
function laddertfromitems(arr){
	let ladder=[]
	for(let i=0;i<arr.length;i=i+1){
		let it=arr[i]
		if(typeof it!="object"||it==null){
			continue
		}
		if((it["type"]||"level")=="break"){
			continue
		}
		let sb=firstnum(it,["sb","smallblind","smallBlind","SB"])
		let bb=firstnum(it,["bb","bigblind","bigBlind","BB"])
		let ante=firstnum(it,["ante","Ante","bbante"])
		let dur=firstnum(it,["dur","duration","min","minutes"])
		if(sb<=0&&bb<=0){
			continue
		}
		if(bb<=0){
			bb=sb*2
		}
		let level={"sb": sb,"bb": bb,"ante": ante}
		if(dur>0){
			level["dur"]=dur
		}
		ladder.push(level)
	}
	return ladder
}

function structtarget(){
	return getvalue("b-structtarget")=="turbo"?"turbo":"normal"
}

function renderstructpreview(){
	let text=""
	if(state.turboladder.length){
		text=batchtext("parsed2").replace("{n}",state.ladder.length).replace("{m}",state.turboladder.length)
	}else if(state.ladder.length){
		text=batchtext("parsed").replace("{n}",state.ladder.length)
	}
	innertext("#b-structpreview",text,false)
}

function setladder(ladder){
	if(structtarget()=="turbo"){
		state.turboladder=ladder
	}else{
		state.ladder=ladder
	}
	if(ladder.length){
		renderstructpreview()
	}else{
		innertext("#b-structpreview",batchtext("parsednone"),false)
	}
	renderpreview()
}

function loadstructure(){
	let text=(getvalue("b-structtext")||"").trim()
	if(!text){
		pttoast(batchtext("structempty"),"error")
		return
	}
	// JSON (盲注生成器輸出): 直接讀, 不必走解析
	if(text[0]=="["||text[0]=="{"){
		let json=null
		try{
			json=JSON.parse(text)
		}catch(e){
			pttoast(batchtext("jsoninvalid"),"error")
			return
		}
		let arr=Array.isArray(json)?json:(json["schedule"]||json["levels"]||json["blinds"]||json["items"]||json["structure"]||[])
		if(!Array.isArray(arr)||!arr.length){
			pttoast(batchtext("jsoninvalid"),"error")
			return
		}
		setladder(laddertfromitems(arr))
		return
	}
	// 純文字: 走後端規則/AI 解析
	let btn=domgetid("b-parse")
	ptsetsubmitstate(btn,true,batchtext("parsing"))
	ajax("POST",AJAXURL+"parsestructure",function(event,data){
		ptsetsubmitstate(btn,false)
		if(!data["success"]){
			pttoast(data["data"]||batchtext("networkerror"),"error")
			return
		}
		setladder(laddertfromitems((data["data"]||{})["schedule"]||[]))
	},str({"text": text,"mode": "auto"}),[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
}

function loadseriescontext(){
	if(!attachseriesid){
		return
	}
	// 已在某個系列賽裡 → 隱藏「新建系列賽」相關欄位
	let n=domgetid("b-seriesname")
	if(n&&n.closest("label")){
		n.closest("label").classList.add("hidden")
	}
	let s=domgetid("b-scoringtype")
	if(s&&s.closest("label")){
		s.closest("label").classList.add("hidden")
	}
	ajax("GET",AJAXURL+"getseries/"+attachseriesid,function(event,data){
		if(data["success"]&&data["data"]){
			innertext("#pagehint",batchtext("intoseries").replace("{n}",data["data"]["name"]||""),false)
		}
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
}

function create(){
	let btn=domgetid("b-create")
	if(btn.disabled){
		return
	}
	if(!getvalue("b-club")){
		pttoast(batchtext("needclub"),"error")
		return
	}
	if(!getvalue("b-startdate")){
		pttoast(batchtext("needstart"),"error")
		return
	}
	if(!state.ladder.length){
		pttoast(batchtext("needparse"),"error")
		return
	}
	if(!state.rounds.length){
		pttoast(batchtext("noround"),"error")
		return
	}
	let spec=buildspec()
	if(!spec["flights"].length){
		pttoast(batchtext("noround"),"error")
		return
	}
	let startdate=getvalue("b-startdate")
	let common={
		"clubid": getvalue("b-club"),
		"buyin": int(getvalue("b-buyin"))||0,
		"buyinfee": int(getvalue("b-fee"))||0,
		"chip": int(getvalue("b-chip"))||3000,
		"maxseat": int(getvalue("b-maxseat"))||9,
		"starttime": startdate+" 12:00:00+00",
		"endtime": startdate+" 20:00:00+00",
		"openregistration": true,
		"private": false,
		"rebuycount": int(getvalue("b-rebuycount"))||0,
		"rebuybuyin": int(getvalue("b-rebuybuyin"))||0,
		"rebuyfee": int(getvalue("b-rebuyfee"))||0,
		"rebuychip": int(getvalue("b-rebuychip"))||0,
		"reentrycount": int(getvalue("b-reentrycount"))||0,
		"reentrybuyin": int(getvalue("b-reentrybuyin"))||0,
		"reentryfee": int(getvalue("b-reentryfee"))||0,
		"reentrychip": int(getvalue("b-reentrychip"))||0,
		"addoncount": int(getvalue("b-addoncount"))||0,
		"addonbuyin": int(getvalue("b-addonbuyin"))||0,
		"addonfee": int(getvalue("b-addonfee"))||0,
		"addonchip": int(getvalue("b-addonchip"))||0,
		"description": getvalue("b-description")||"",
		"gametypeid": getvalue("b-gametype")||1,
		"limittypeid": getvalue("b-limittype")||1,
		"stacktypeid": getvalue("b-stacktype")||1,
		"eventtypeid": getvalue("b-eventtype")||1,
		"chips": state.chips
	}
	let payload={
		"common": common,
		"flights": spec["flights"],
		"advancement": spec["advancement"]
	}
	if(attachseriesid){
		// 附加到既有系列賽 (一個系列賽可含多個多日賽事)
		payload["seriesid"]=attachseriesid
	}else{
		payload["createseries"]=true
		payload["seriesname"]=getvalue("b-seriesname")||spec["flights"][0]["name"]
		payload["seriesscoringtype"]=getvalue("b-scoringtype")||"profit"
	}
	ptsetsubmitstate(btn,true,batchtext("creating"))
	ajax("POST",AJAXURL+"batchcreatesessions",function(event,data){
		ptsetsubmitstate(btn,false)
		if(data["success"]){
			let d=data["data"]||{}
			pttoastsuccess(batchtext("created").replace("{n}",d["flightcount"]||0))
			leaveguard.clear()
			if(d["seriesid"]){
				href("series.html?id="+d["seriesid"])
			}else{
				href("serieslist.html")
			}
		}else{
			pttoast(data["data"]||batchtext("createfail"),"error")
		}
	},str(payload),[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
}

applylanguage()
loadclubs()
loadtypelist()
loadseriescontext()
applytemplate([8,2,1])
renderchiprows()
renderstep()

onclick("#b-prevstep",function(element,event){ gotostep(state.step-1) })
onclick("#b-nextstep",function(element,event){ gotostep(state.step+1) })
onclick("[data-stepitem]",function(element,event){ gotostep(dataset(element,"stepitem")) })
onclick("#b-chipsfromprofile",function(element,event){ loadchipsfromprofile() })
onclick("#b-chipadd",function(element,event){
	if(state.chips.length>=12){
		return
	}
	state.chips.push({shape: "circle",value: 0,color: "#888888"})
	renderchiprows()
})

onclick(".tpl-btn",function(element,event){
	let counts=dataset(element,"tpl").split("-").map(function(x){return int(x)})
	applytemplate(counts)
	renderpreview()
})
onclick("#b-upload",function(element,event){
	domgetid("b-structfile").click()
})
domgetid("b-structfile").addEventListener("change",function(event){
	let file=event.target.files&&event.target.files[0]
	if(!file){
		return
	}
	let reader=new FileReader()
	reader.onload=function(){
		value("#b-structtext",reader.result||"")
		loadstructure()
	}
	reader.readAsText(file)
})
onclick("#b-addround",function(element,event){
	let r=state.rounds.length
	let prevTo=r>0?state.rounds[r-1].toLv:0
	let round={prefix: "D"+(r+1),count: 1,fromLv: prevTo+1,toLv: prevTo+4,dur: 20,turbo: [],sources: [],start: "",interval: 0,customtime: false,starts: []}
	ensureround(round,null)
	state.rounds.push(round)
	if(r>0){
		state.rounds[r].sources=autoSources(keysOf(r-1),round.count)
	}
	renderrounds()
	renderpreview()
})
onclick("#b-removeround",function(element,event){
	if(state.rounds.length>1){
		state.rounds.pop()
		renderrounds()
		renderpreview()
	}
})
onclick("#b-parse",function(element,event){ loadstructure() })
onclick("#b-colorupsfromprofile",function(element,event){ loadcolorupsfromprofile() })
onclick("#b-refresh",function(element,event){ renderpreview() })
onclick("#b-create",function(element,event){ create() })

// 重買/重入/加買「次數」改成非 0 時, 把該列的買入/手續費/計分牌預設帶入上面的買入/手續費/起始碼
// (只在該欄還是 0 時帶, 使用者已自訂就不蓋); 次數改成 0 時把該列買入/手續費/計分牌歸零
function autofillstruct(countid,buyinid,feeid,chipid){
	if((int(getvalue(countid))||0)<=0){
		value("#"+buyinid,"0")
		value("#"+feeid,"0")
		value("#"+chipid,"0")
		return
	}
	if((int(getvalue(buyinid))||0)<=0){ value("#"+buyinid,String(int(getvalue("b-buyin"))||0)) }
	if((int(getvalue(feeid))||0)<=0){ value("#"+feeid,String(int(getvalue("b-fee"))||0)) }
	if((int(getvalue(chipid))||0)<=0){ value("#"+chipid,String(int(getvalue("b-chip"))||0)) }
}
onchange("#b-rebuycount",function(element,event){ autofillstruct("b-rebuycount","b-rebuybuyin","b-rebuyfee","b-rebuychip") })
onchange("#b-reentrycount",function(element,event){ autofillstruct("b-reentrycount","b-reentrybuyin","b-reentryfee","b-reentrychip") })
onchange("#b-addoncount",function(element,event){ autofillstruct("b-addoncount","b-addonbuyin","b-addonfee","b-addonchip") })

// 把整份精靈設定收成一個物件, 方便存成 JSON 之後改改欄位重用
function collectconfig(){
	let nums=["b-buyin","b-fee","b-chip","b-maxseat","b-rebuycount","b-rebuybuyin","b-rebuyfee","b-rebuychip","b-reentrycount","b-reentrybuyin","b-reentryfee","b-reentrychip","b-addoncount","b-addonbuyin","b-addonfee","b-addonchip","b-breakevery","b-breakdur","b-regclose"]
	let cfg={
		"seriesname": getvalue("b-seriesname"),
		"club": getvalue("b-club"),
		"startdate": getvalue("b-startdate"),
		"scoringtype": getvalue("b-scoringtype"),
		"description": getvalue("b-description"),
		"colorups": getvalue("b-colorups"),
		"ladder": state.ladder,
		"turboladder": state.turboladder,
		"rounds": state.rounds,
		"chips": state.chips
	}
	for(let i=0;i<nums.length;i=i+1){
		cfg[nums[i].replace("b-","")]=int(getvalue(nums[i]))||0
	}
	return cfg
}

function applyconfig(cfg){
	if(!cfg||typeof cfg!="object"){
		pttoast(batchtext("jsoninvalid"),"error")
		return
	}
	let textfields=[["seriesname","b-seriesname"],["startdate","b-startdate"],["description","b-description"],["colorups","b-colorups"]]
	for(let i=0;i<textfields.length;i=i+1){
		if(cfg[textfields[i][0]]!=undefined){ value("#"+textfields[i][1],cfg[textfields[i][0]]) }
	}
	if(cfg["scoringtype"]){ value("#b-scoringtype",cfg["scoringtype"]) }
	if(cfg["club"]){ value("#b-club",cfg["club"]) }
	let numfields=["buyin:b-buyin","fee:b-fee","chip:b-chip","maxseat:b-maxseat","rebuycount:b-rebuycount","rebuybuyin:b-rebuybuyin","rebuyfee:b-rebuyfee","rebuychip:b-rebuychip","reentrycount:b-reentrycount","reentrybuyin:b-reentrybuyin","reentryfee:b-reentryfee","reentrychip:b-reentrychip","addoncount:b-addoncount","addonbuyin:b-addonbuyin","addonfee:b-addonfee","addonchip:b-addonchip","breakevery:b-breakevery","breakdur:b-breakdur","regclose:b-regclose"]
	for(let i=0;i<numfields.length;i=i+1){
		let kv=numfields[i].split(":")
		if(cfg[kv[0]]!=undefined){ value("#"+kv[1],String(cfg[kv[0]])) }
	}
	if(Array.isArray(cfg["ladder"])){
		state.ladder=cfg["ladder"]
	}
	if(Array.isArray(cfg["turboladder"])){
		state.turboladder=cfg["turboladder"]
	}
	if(Array.isArray(cfg["chips"])&&cfg["chips"].length){
		applychipstobatch(cfg["chips"])
	}
	renderstructpreview()
	if(Array.isArray(cfg["rounds"])&&cfg["rounds"].length){
		state.rounds=cfg["rounds"]
		// 容錯: 補齊手動編輯 JSON 時可能缺的欄位, 避免 renderrounds 出錯
		for(let r=0;r<state.rounds.length;r=r+1){
			let rd=state.rounds[r]
			if(rd.count==undefined){ rd.count=1 }
			if(rd.prefix==undefined){ rd.prefix="D"+(r+1) }
			if(rd.dur==undefined){ rd.dur=20 }
			if(rd.fromLv==undefined){ rd.fromLv=1 }
			if(rd.toLv==undefined){ rd.toLv=rd.fromLv }
			if(rd.start==undefined){ rd.start="" }
			if(rd.interval==undefined){ rd.interval=0 }
			if(rd.customtime==undefined){ rd.customtime=false }
			if(!Array.isArray(rd.starts)){ rd.starts=[] }
			ensureround(rd,null)
		}
	}
	renderrounds()
	renderpreview()
	pttoastsuccess(batchtext("cfgloaded"))
}

function savejson(){
	let cfg=collectconfig()
	let blob=new Blob([JSON.stringify(cfg,null,2)],{type: "application/json"})
	let url=URL.createObjectURL(blob)
	let a=document.createElement("a")
	a.href=url
	a.download=(getvalue("b-seriesname")||"batch")+".json"
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

onclick("#b-savejson",function(element,event){ savejson() })
onclick("#b-loadjson",function(element,event){ domgetid("b-configfile").click() })
domgetid("b-configfile").addEventListener("change",function(event){
	let file=event.target.files&&event.target.files[0]
	if(!file){
		return
	}
	let reader=new FileReader()
	reader.onload=function(){
		let cfg=null
		try{
			cfg=JSON.parse(reader.result)
		}catch(e){
			pttoast(batchtext("jsoninvalid"),"error")
			return
		}
		applyconfig(cfg)
	}
	reader.readAsText(file)
})
