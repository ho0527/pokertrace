if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let seriesid=getget("id")
let seriesdata=null
let members=[]
let managing=false
let leaderboardloaded=false
let isowner=false

function seriestext(key){
	return TRANSLATE[LANGUAGE]["series"][key]||key
}

let leaveguard=bindleaveguard(domgetid("editpanel"))

function safehtml(value){
	if(value==null||value==undefined){
		return ""
	}
	return String(value)
		.replace(/&/g,"&amp;")
		.replace(/</g,"&lt;")
		.replace(/>/g,"&gt;")
		.replace(/"/g,"&quot;")
		.replace(/'/g,"&#39;")
}

function profitdisplay(value){
	let number=Number(value)||0
	let text=Number.isInteger(number)?String(number):number.toFixed(2)
	return {
		"text": (0<=number?"+":"")+text,
		"class": 0<=number?"text-green-400":"text-red-400"
	}
}

function moneydisplay(value){
	let number=Number(value)||0
	return Number.isInteger(number)?String(number):number.toFixed(2)
}

function datepart(value){
	return ptformatdatetime(value).substring(0,10)
}

function daterange(row){
	let start=datepart(row["starttime"])
	let end=datepart(row["endtime"])
	if(start&&end){
		return start+" ~ "+end
	}
	return start||end||""
}

function applystatictext(){
	innertext("#eyebrow",seriestext("eyebrow"),false)
	innertext("#backlink","← "+seriestext("back"),false)
	value("#editbtn",seriestext("edit"))
	value("#deletebtn",seriestext("delete"))
	if(domgetid("batchbtn")){
		innertext("#batchbtn",seriestext("batchcreate"),false)
		domgetid("batchbtn").href="batchcreate.html?seriesid="+seriesid
	}
	value("#editcancel",seriestext("cancel"))
	value("#editsubmit",seriestext("save"))
	let labels=document.querySelectorAll("[data-label]")
	for(let i=0;i<labels.length;i=i+1){
		labels[i].textContent=seriestext(dataset(labels[i],"label"))
	}
	let opts=document.querySelectorAll("[data-opt]")
	for(let i=0;i<opts.length;i=i+1){
		opts[i].textContent=seriestext(dataset(opts[i],"opt"))
	}
	domgetid("e-name").placeholder=seriestext("nameplaceholder")
	domgetid("e-description").placeholder=seriestext("descriptionplaceholder")
	// 分頁標籤
	let tabnames={"overview": "overview","sessions": "sessions","leaderboard": "leaderboard"}
	let tabs=document.querySelectorAll(".tab-btn")
	for(let i=0;i<tabs.length;i=i+1){
		tabs[i].value=seriestext(tabnames[dataset(tabs[i],"tab")])
	}
}

function rendertabs(active){
	let tabs=document.querySelectorAll(".tab-btn")
	for(let i=0;i<tabs.length;i=i+1){
		let name=dataset(tabs[i],"tab")
		let content=domgetid("tab-"+name)
		if(name==active){
			removeclass(tabs[i],["text-zinc-300","border-transparent"])
			addclass(tabs[i],["text-emerald-400","border-emerald-400","font-bold"])
			if(content){
				content.classList.remove("hidden")
			}
		}else{
			removeclass(tabs[i],["text-emerald-400","border-emerald-400","font-bold"])
			addclass(tabs[i],["text-zinc-300","border-transparent"])
			if(content){
				content.classList.add("hidden")
			}
		}
	}
	if(active=="leaderboard"&&!leaderboardloaded){
		loadleaderboard()
	}
}

function renderheader(){
	document.title=(seriesdata["name"]||seriestext("notitle"))+" - PokerTrace"
	innertext("#seriesname",seriesdata["name"]||seriestext("notitle"),false)
	let meta=[]
	if(seriesdata["token"]){
		meta.push(seriesdata["token"])
	}
	let range=daterange(seriesdata)
	if(range){
		meta.push(range)
	}
	meta.push(seriestext("scoringtype")+": "+seriestext("scoring_"+(seriesdata["scoringtype"]||"profit")))
	innertext("#seriesmeta",meta.join(" · "),false)
}

function renderoverview(){
	let agg=seriesdata["aggregate"]||{}
	let profit=profitdisplay(agg["totalprofit"])
	let cards=[
		["sessioncount",agg["sessioncount"]||0,""],
		["myprofit",profit["text"],profit["class"]],
		["mycost",moneydisplay(agg["totalcost"]),""],
		["myprize",moneydisplay(agg["totalwinprice"]),""]
	]
	let cardhtml=cards.map(function(c){
		return `
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 text-center">
				<div class="text-sm text-zinc-400">${seriestext(c[0])}</div>
				<div class="mt-1 text-2xl font-extrabold ${c[2]}">${c[1]}</div>
			</div>
		`
	}).join("")
	let deschtml=""
	if(seriesdata["description"]){
		deschtml=`<section class="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 text-sm text-zinc-300 whitespace-pre-wrap">${safehtml(seriesdata["description"])}</section>`
	}
	innerhtml("#tab-overview",`
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">${cardhtml}</div>
		${deschtml}
	`,false)
}

function membercard(row){
	let profit=profitdisplay(row["profit"])
	let removebtn=managing?`<input type="button" class="cursor-pointer shrink-0 text-red-400 hover:underline text-sm removemember" data-id="${row["id"]}" value="${seriestext("remove")}" onclick="event.stopPropagation()">`:""
	return `
		<div class="relative flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 ${managing?"":"cursor-pointer hover:border-zinc-700"} transition">
			${managing?"":`<a href="session.html?id=${row["id"]}" class="absolute inset-0 rounded-2xl" aria-label="${safehtml(row["name"])}"></a>`}
			<div class="min-w-0">
				<div class="font-semibold truncate">${safehtml(row["name"])}</div>
				<div class="text-xs text-zinc-500 mt-1">${datepart(row["starttime"])}${row["token"]?" · "+safehtml(row["token"]):""}</div>
			</div>
			<div class="flex items-center gap-3 shrink-0">
				<div class="font-bold ${profit["class"]}">${profit["text"]}</div>
				${removebtn}
			</div>
		</div>
	`
}

function rendersessions(){
	let managebtnlabel=managing?seriestext("done"):seriestext("managesessions")
	let managebtnhtml=isowner?`<input type="button" class="cursor-pointer rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-5 py-2 text-sm font-bold text-white transition" id="managebtn" value="${managebtnlabel}">`:""
	let managepanel=managing?`
		<section class="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
			<div class="flex flex-col gap-2 md:flex-row">
				<input type="text" class="min-h-11 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15" id="sessionsearch" placeholder="${seriestext("searchsession")}">
				<input type="button" class="cursor-pointer rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-sm font-bold text-white transition" id="dosearch" value="${seriestext("addsessions")}">
			</div>
			<div id="candidates" class="mt-3 flex flex-col gap-2"></div>
			<div class="mt-4 flex justify-end">
				<input type="button" class="cursor-pointer rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2 text-sm font-bold text-white transition" id="savesessions" value="${seriestext("save")}">
			</div>
		</section>
	`:""
	let listhtml=""
	if(members.length<=0){
		listhtml=`<div class="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">${seriestext("nosessions")}<div class="text-xs mt-2">${seriestext("nosessionhint")}</div></div>`
	}else{
		listhtml=`<div class="flex flex-col gap-3">${members.map(membercard).join("")}</div>`
	}
	innerhtml("#tab-sessions",`
		<div class="mb-4 flex items-center justify-between gap-3">
			<div class="text-lg font-bold">${seriestext("sessions")} (${members.length})</div>
			${managebtnhtml}
		</div>
		${managepanel}
		${listhtml}
	`,false)
	bindsessions()
}

function bindsessions(){
	onclick("#managebtn",function(element,event){
		managing=!managing
		rendersessions()
	})
	onclick(".removemember",function(element,event){
		event.stopPropagation()
		let id=String(dataset(element,"id"))
		members=members.filter(function(m){
			return String(m["id"])!=id
		})
		rendersessions()
	})
	onclick("#dosearch",function(element,event){
		searchcandidates()
	})
	onkeydown("#sessionsearch",function(element,event){
		if(event.key=="Enter"){
			searchcandidates()
		}
	})
	onclick("#savesessions",function(element,event){
		savesessions(element)
	})
	onclick(".addcandidate",function(element,event){
		let id=dataset(element,"id")
		if(members.some(function(m){return String(m["id"])==String(id)})){
			return
		}
		members.push({
			"id": id,
			"name": dataset(element,"name"),
			"starttime": dataset(element,"starttime"),
			"token": dataset(element,"token"),
			"profit": 0
		})
		rendersessions()
		rendertabs("sessions")
	})
}

function searchcandidates(){
	let keyword=getvalue("sessionsearch")||""
	let url=AJAXURL+"getsessionlist?quickfilter=owned&limit=50&page=1"
	if(keyword){
		url=AJAXURL+"getsessionlist?limit=50&page=1&name="+encodeURIComponent(keyword)
	}
	ajax("GET",url,function(event,data){
		if(!data["success"]){
			pttoast(data["data"]||seriestext("networkerror"),"error")
			return
		}
		let sessions=(data["data"]||{})["sessions"]||[]
		let memberids={}
		for(let i=0;i<members.length;i=i+1){
			memberids[String(members[i]["id"])]=true
		}
		let rows=sessions.filter(function(s){
			return s["isown"]==true&&!memberids[String(s["id"])]
		})
		if(rows.length<=0){
			innerhtml("#candidates",`<div class="text-center text-sm text-zinc-500 py-3">—</div>`,false)
			return
		}
		innerhtml("#candidates",rows.map(function(s){
			return `
				<div class="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
					<div class="min-w-0">
						<div class="font-semibold truncate">${safehtml(s["name"])}</div>
						<div class="text-xs text-zinc-500">${datepart(s["starttime"])}${s["token"]?" · "+safehtml(s["token"]):""}</div>
					</div>
					<input type="button" class="cursor-pointer shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-sm font-bold text-white transition addcandidate" data-id="${s["id"]}" data-name="${safehtml(s["name"])}" data-starttime="${safehtml(s["starttime"])}" data-token="${safehtml(s["token"]||"")}" value="${seriestext("add")}">
				</div>
			`
		}).join(""),false)
		bindsessions()
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
		loadingtarget: "#candidates"
	})
}

function savesessions(button){
	if(button.disabled){
		return
	}
	ptsetsubmitstate(button,true,seriestext("saving"))
	let payload={
		"sessionids": members.map(function(m){
			return Number(m["id"])
		})
	}
	ajax("PUT",AJAXURL+"editseriessessions/"+seriesid,function(event,data){
		ptsetsubmitstate(button,false)
		if(data["success"]){
			pttoastsuccess(seriestext("sessionssaved"))
			managing=false
			leaderboardloaded=false
			members=(data["data"]||{})["sessions"]||members
			seriesdata["aggregate"]=(data["data"]||{})["aggregate"]||seriesdata["aggregate"]
			renderoverview()
			rendersessions()
		}else{
			pttoast(data["data"]||seriestext("unknownerror"),"error")
		}
	},str(payload),[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
}

function loadleaderboard(){
	ajax("GET",AJAXURL+"getseriesleaderboard/"+seriesid,function(event,data){
		if(!data["success"]){
			pttoast(data["data"]||seriestext("networkerror"),"error")
			return
		}
		leaderboardloaded=true
		renderleaderboard((data["data"]||{})["leaderboard"]||[])
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
		loadingtarget: "#tab-leaderboard"
	})
}

function renderleaderboard(rows){
	if(!rows||rows.length<=0){
		innerhtml("#tab-leaderboard",`<div class="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">${seriestext("noleaderboard")}<div class="text-xs mt-2">${seriestext("noleaderboardhint")}</div></div>`,false)
		return
	}
	innerhtml("#tab-leaderboard",`
		<div class="overflow-auto rounded-2xl border border-zinc-800 bg-zinc-900/40">
			<table class="w-full text-sm border-separate border-spacing-0">
				<thead>
					<tr class="text-zinc-300">
						<th class="sticky top-0 bg-zinc-800 border-b border-zinc-800 py-2 px-3 text-center">${seriestext("rank")}</th>
						<th class="sticky top-0 bg-zinc-800 border-b border-zinc-800 py-2 px-3 text-left">${seriestext("player")}</th>
						<th class="sticky top-0 bg-zinc-800 border-b border-zinc-800 py-2 px-3 text-center">${seriestext("entries")}</th>
						<th class="sticky top-0 bg-zinc-800 border-b border-zinc-800 py-2 px-3 text-center">${seriestext("cashes")}</th>
						<th class="sticky top-0 bg-zinc-800 border-b border-zinc-800 py-2 px-3 text-center">${seriestext("bestplace")}</th>
						<th class="sticky top-0 bg-zinc-800 border-b border-zinc-800 py-2 px-3 text-center">${seriestext("prize")}</th>
						<th class="sticky top-0 bg-zinc-800 border-b border-zinc-800 py-2 px-3 text-center">${seriestext("profit")}</th>
						<th class="sticky top-0 bg-zinc-800 border-b border-zinc-800 py-2 px-3 text-center">${seriestext("scoring_points")}</th>
					</tr>
				</thead>
				<tbody>
					${rows.map(function(r,index){
						let profit=profitdisplay(r["totalprofit"])
						let divider=index<rows.length-1?"[&>td]:border-b [&>td]:border-zinc-800":""
						return `
							<tr class="${divider}">
								<td class="py-2 px-3 text-center font-bold">${r["rank"]}</td>
								<td class="py-2 px-3 text-left">${safehtml(r["playername"])||"—"}</td>
								<td class="py-2 px-3 text-center">${r["entries"]||0}</td>
								<td class="py-2 px-3 text-center">${r["cashes"]||0}</td>
								<td class="py-2 px-3 text-center">${r["bestplace"]!=null?r["bestplace"]:"-"}</td>
								<td class="py-2 px-3 text-center">${moneydisplay(r["totalprize"])}</td>
								<td class="py-2 px-3 text-center font-bold ${profit["class"]}">${profit["text"]}</td>
								<td class="py-2 px-3 text-center">${r["points"]||0}</td>
							</tr>
						`
					}).join("")}
				</tbody>
			</table>
		</div>
	`,false)
}

function filleditform(){
	value("#e-name",seriesdata["name"]||"")
	value("#e-scoringtype",seriesdata["scoringtype"]||"profit")
	value("#e-starttime",datepart(seriesdata["starttime"]))
	value("#e-endtime",datepart(seriesdata["endtime"]))
	value("#e-description",seriesdata["description"]||"")
	domgetid("e-private").checked=(seriesdata["private"]==true)
}

function rendered(){
	renderheader()
	renderoverview()
	rendersessions()
}

function loadseries(){
	ajax("GET",AJAXURL+"getseries/"+seriesid,function(event,data){
		if(!data["success"]){
			pttoast(data["data"]||seriestext("notfound"),"error")
			return
		}
		seriesdata=data["data"]
		members=seriesdata["sessions"]||[]
		isowner=(seriesdata["isowner"]==true)
		if(isowner){
			domgetid("owneractions").classList.remove("hidden")
		}else{
			domgetid("owneractions").classList.add("hidden")
		}
		leaderboardloaded=false
		rendered()
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
		loadingtarget: "#tab-overview"
	})
}

applystatictext()
loadseries()

let tabbuttons=document.querySelectorAll(".tab-btn")
for(let i=0;i<tabbuttons.length;i=i+1){
	tabbuttons[i].addEventListener("click",function(event){
		rendertabs(dataset(event.currentTarget,"tab"))
	})
}

onclick("#editbtn",function(element,event){
	filleditform()
	leaveguard.clear()
	domgetid("editpanel").classList.toggle("hidden")
})
onclick("#editcancel",function(element,event){
	if(!leaveguard.confirmleave()){
		return
	}
	domgetid("editpanel").classList.add("hidden")
})
onclick("#deletebtn",function(element,event){
	ptconfirm(seriestext("deleteconfirm"),function(ok){
		if(!ok){
			return
		}
		ajax("DELETE",AJAXURL+"deleteseries/"+seriesid,function(event,data){
			if(data["success"]){
				pttoastsuccess(seriestext("deleted"))
				href("serieslist.html")
			}else{
				pttoast(data["data"]||seriestext("unknownerror"),"error")
			}
		},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
	})
})

domgetid("editform").addEventListener("submit",function(event){
	event.preventDefault()
	let submit=domgetid("editsubmit")
	if(submit.disabled){
		return
	}
	let name=getvalue("e-name").trim()
	if(!name){
		pttoast(seriestext("requiredname"),"error")
		return
	}
	ptsetsubmitstate(submit,true,seriestext("saving"))
	let payload={
		"name": name,
		"description": getvalue("e-description")||"",
		"scoringtype": getvalue("e-scoringtype")||"profit",
		"starttime": getvalue("e-starttime")||null,
		"endtime": getvalue("e-endtime")||null,
		"private": domgetid("e-private").checked
	}
	ajax("PUT",AJAXURL+"editseries/"+seriesid,function(event,data){
		ptsetsubmitstate(submit,false)
		if(data["success"]){
			pttoastsuccess(seriestext("saved"))
			leaveguard.clear()
			domgetid("editpanel").classList.add("hidden")
			leaderboardloaded=false
			loadseries()
		}else{
			pttoast(data["data"]||seriestext("unknownerror"),"error")
		}
	},str(payload),[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
})
