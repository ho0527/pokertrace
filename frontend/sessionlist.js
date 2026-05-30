let gametype={}
let limittype={}
let stacktype={}
let eventtype={}
let currentpage=1
let sessionpagelimit=20
let currentpagination={
	"page": 1,
	"limit": 20,
	"total": 0,
	"totalpages": 1,
	"hasprev": false,
	"hasnext": false
}
let sessionliststatekey=WEBLSNAME+"sessionliststate"

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function sessiontext(key){
	return TRANSLATE[LANGUAGE]["sessionlist"][key]||key
}

function applysessionlanguage(){
	document.title=sessiontext("title")
	innertext("h1",sessiontext("title"),false)
	domgetid("startdate").placeholder=sessiontext("startdate")
	domgetid("enddate").placeholder=sessiontext("enddate")
	domgetid("name").placeholder=sessiontext("name")
	domgetid("search").value=sessiontext("search")
	let sessionlink=document.querySelector("a[href=\"newsession.html\"]")
	if(sessionlink){
		sessionlink.textContent=sessiontext("newsession")
	}
}

function totypeobject(row){
	let data={}
	for(let i=0;i<row.length;i=i+1){
		data[row[i]["id"]]=row[i]
	}
	return data
}

function formatduration(minutes){
	minutes=int(minutes)||0
	if(minutes<60){
		return minutes+" "+sessiontext("minute")
	}
	return Math.floor(minutes/60)+" "+sessiontext("hour")+" "+(minutes%60)+" "+sessiontext("minute")
}

function cansessioncopy(row){
	return row["isown"]==true
}

function cansessiontimer(row){
	return row["owned"]==true&&(row["isown"]==true||row["accessrole"]=="owner"||row["accessrole"]=="floor"||row["accessrole"]=="assistant")
}

function cansessiondisplay(row){
	return row["owned"]==true&&row["linkuser"]==true
}

function cansessionedit(row){
	return row["isown"]==true||row["isstaff"]==true
}

function cansessionregister(row){
	return row["owned"]==true&&row["linkuser"]==true&&row["openregistration"]==true&&row["isown"]!=true&&row["isstaff"]!=true
}

function sessionshowmoney(row){
	return row["isstaff"]!=true&&((row["isown"]==false&&row["owned"]==true)||(row["isown"]==true&&row["owned"]==false))&&((row["isown"]==false&&row["myregistrationstatus"]=="confirmed")||row["owned"]==false)
}

function hasmyregistrationfinance(row){
	return row["owned"]==true&&row["linkuser"]==true&&row["myregistration"]
}

function getbuyintext(row){
	if(hasmyregistrationfinance(row)){
		return row["myregistration"]["cost"]||0
	}
	let buyintotal=(row["buyin"]||0)+(row["buyinfee"]||0)
	let rebuytotal=(row["rebuybuyin"]||0)+(row["rebuyfee"]||0)
	if(buyintotal!=rebuytotal){
		return buyintotal+"/"+rebuytotal
	}
	return ""+buyintotal
}

function getwinprice(row){
	let buyintotal=(row["buyin"]||0)+(row["buyinfee"]||0)
	let rebuytotal=(row["rebuybuyin"]||0)+(row["rebuyfee"]||0)
	return row["winprice"]-(buyintotal+rebuytotal*row["rebuycount"])
}

function getplacetext(row){
	if(hasmyregistrationfinance(row)){
		let place=row["myregistration"]["timerplace"]||row["myregistration"]["place"]||"-"
		return place+" / "+(row["totalbuyin"]||"-")
	}
	return row["place"]+" / "+row["totalbuyin"]
}

function getprofitdata(row){
	let data={
		"text": "",
		"class": ""
	}
	if(row["owned"]==true&&row["isown"]==true){
		data["text"]=sessiontext("owner")
		data["class"]="text-yellow-400"
	}else if(row["isstaff"]==true){
		data["text"]=sessiontext("staff")
		data["class"]="text-emerald-400"
	}else if(row["owned"]==true&&row["linkuser"]==true){
		if(row["myregistrationstatus"]=="confirmed"&&row["myregistration"]){
			let profit=row["myregistration"]["profit"]||0
			data["text"]=(0<=profit?"+":"")+profit
			data["class"]=0<=profit?"text-green-400":"text-red-400"
		}else if(row["myregistrationstatus"]=="registered"){
			data["text"]=sessiontext("registered")
			data["class"]="text-yellow-400"
		}else{
			data["text"]=sessiontext("registerable")
			data["class"]="text-cyan-400"
		}
	}else{
		let winprice=getwinprice(row)
		data["text"]=(0<=winprice?"+":"")+winprice
		data["class"]=0<=winprice?"text-green-400":"text-red-400"
	}
	return data
}

function getregistrationaction(row){
	if(!cansessionregister(row)){
		return ""
	}
	if(row["myregistrationstatus"]=="registered"||row["myregistrationstatus"]=="confirmed"){
		return `
			<span class="text-yellow-400 text-sm font-semibold">${sessiontext(row["myregistrationstatus"])}</span>
			<input type="button" class="text-red-400 hover:underline unregistersession cursor-pointer" data-id="${row["id"]}" value="${sessiontext("unregister")}">
		`
	}
	return `<input type="button" class="text-emerald-400 hover:underline registersession cursor-pointer" data-id="${row["id"]}" value="${sessiontext("register")}">`
}

function getsessioncodetext(row){
	if(!eventtype[row["eventtypeid"]]||!stacktype[row["stacktypeid"]]||!limittype[row["limittypeid"]]||!gametype[row["gametypeid"]]){
		return ""
	}
	return eventtype[row["eventtypeid"]]["code"]+stacktype[row["stacktypeid"]]["code"]+limittype[row["limittypeid"]]["code"]+gametype[row["gametypeid"]]["code"]
}

function renderSessionTable(sessions){
	let startindex=((currentpagination["page"]||1)-1)*(currentpagination["limit"]||sessionpagelimit)
	if(window.innerWidth<768){
		innerhtml("#main",sessions.map(function(row,index){
			let profitdata=getprofitdata(row)
			return `
				<div class="bg-zinc-800 rounded-lg p-4 mb-3 border border-zinc-700" onclick="location='session.html?id=${row["id"]}'">
					<div class="flex justify-between gap-3 mb-2">
						<div class="text-xs text-zinc-400">#${startindex+index+1} ${row["starttime"].split("T")[0]}</div>
						<div class="${profitdata["class"]} font-bold">${profitdata["text"]}</div>
					</div>
					<div class="font-semibold">${row["name"]} (${getsessioncodetext(row)})</div>
					<div class="grid grid-cols-2 gap-2 text-sm mt-3">
						<div><span class="text-zinc-500">${sessiontext("buyin")} </span>${sessionshowmoney(row)||hasmyregistrationfinance(row)?getbuyintext(row):"-"}</div>
						<div><span class="text-zinc-500">${sessiontext("place")} </span>${getplacetext(row)}</div>
					</div>
					<div class="flex flex-wrap gap-3 mt-3 text-sm" onclick="event.stopPropagation()">
						${getregistrationaction(row)}
						${cansessiontimer(row)?`<a href="control.html?sessionid=${row["id"]}" class="text-emerald-400">${sessiontext("timer")}</a>`:(cansessiondisplay(row)?`<a href="display.html?sessionid=${row["id"]}" class="text-cyan-400">${sessiontext("displaytimer")}</a>`:`<a href="structure.html?sessionid=${row["id"]}" class="text-emerald-400">${sessiontext("structure")}</a>`)}
						${cansessioncopy(row)?`<input type="button" class="text-blue-400 copysession cursor-pointer" data-id="${row["id"]}" value="${sessiontext("copy")}">`:""}
						${cansessionedit(row)?`<a href="session.html?id=${row["id"]}#settings" class="text-blue-400">${sessiontext("edit")}</a>`:""}
					</div>
				</div>
			`
		}).join(""),false)
		bindbuttons()
		return
	}
	innerhtml("#main",`
		<table class="w-full text-sm bg-zinc-800 rounded-lg">
			<thead class="sticky top-0">
				<tr class="bg-zinc-700 text-zinc-300">
					<th class="py-2 px-2">#</th>
					<th class="py-2 px-2">${sessiontext("time")}</th>
					<th class="py-2 px-2">${sessiontext("name")}</th>
					<th class="py-2 px-2">${sessiontext("buyin")}</th>
					<th class="py-2 px-2">${sessiontext("place")}</th>
					<th class="py-2 px-2">${sessiontext("profit")}</th>
					<th class="py-2 px-2">${sessiontext("action")}</th>
				</tr>
			</thead>
			<tbody class="text-center">
				${sessions.map(function(row,index){
					let profitdata=getprofitdata(row)
					return `
						<tr class="hover:bg-zinc-700 transition cursor-pointer border-b border-zinc-700" onclick="location='session.html?id=${row["id"]}'">
							<td class="py-2 px-2">${startindex+index+1}</td>
							<td>${row["starttime"].split("T")[0]} ${row["starttime"].split("T")[1].split(":00Z")[0]}</td>
							<td>${row["name"]} (${getsessioncodetext(row)})</td>
							<td>${sessionshowmoney(row)||hasmyregistrationfinance(row)?getbuyintext(row):"-"}</td>
							<td>${getplacetext(row)}</td>
							<td class="${profitdata["class"]} font-bold">${profitdata["text"]}</td>
							<td>
								${getregistrationaction(row)}
								${cansessiontimer(row)?`<a href="control.html?sessionid=${row["id"]}" class="text-emerald-400 hover:underline mr-2" onclick="event.stopPropagation()">${sessiontext("timer")}</a>`:(cansessiondisplay(row)?`<a href="display.html?sessionid=${row["id"]}" class="text-cyan-400 hover:underline mr-2" onclick="event.stopPropagation()">${sessiontext("displaytimer")}</a>`:`<a href="structure.html?sessionid=${row["id"]}" class="text-emerald-400 hover:underline mr-2" onclick="event.stopPropagation()">${sessiontext("structure")}</a>`)}
								${cansessioncopy(row)?`<input type="button" class="text-blue-400 hover:underline copysession cursor-pointer" data-id="${row["id"]}" value="${sessiontext("copy")}">`:""}
								${cansessionedit(row)?`<a href="session.html?id=${row["id"]}#settings" class="text-blue-400 hover:underline" onclick="event.stopPropagation()">${sessiontext("edit")}</a>`:""}
							</td>
						</tr>
					`
				}).join("")}
			</tbody>
		</table>
	`,false)
	bindbuttons()
}

function renderpagination(pagination){
	currentpagination=pagination||{
		"page": 1,
		"limit": sessionpagelimit,
		"total": 0,
		"totalpages": 1,
		"hasprev": false,
		"hasnext": false
	}
	let page=currentpagination["page"]||1
	let totalpages=currentpagination["totalpages"]||1
	let html=`
		<input type="button" class="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded cursor-pointer" id="prevpage" value="上一頁" ${currentpagination["hasprev"]?"":"disabled"}>
	`
	let skipped=false
	for(let i=1;i<=totalpages;i=i+1){
		if(i==1||i==totalpages||Math.abs(i-page)<=2){
			html=html+`
				<input type="button" class="${i==page?"bg-blue-600":"bg-zinc-700 hover:bg-zinc-600"} px-3 py-2 rounded cursor-pointer pagebtn" data-page="${i}" value="${i}">
			`
			skipped=false
		}else if(skipped==false){
			html=html+`<span class="px-2 py-2 text-zinc-400">...</span>`
			skipped=true
		}
	}
	html=html+`
		<input type="button" class="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded cursor-pointer" id="nextpage" value="下一頁" ${currentpagination["hasnext"]?"":"disabled"}>
		<span class="text-zinc-400 text-sm px-2">共 ${currentpagination["total"]||0} 筆</span>
	`
	innerhtml("#pagination",html,false)
	onclick("#prevpage",function(element,event){
		if(currentpagination["hasprev"]){
			currentpage=currentpage-1
			loadsessions()
		}
	})
	onclick("#nextpage",function(element,event){
		if(currentpagination["hasnext"]){
			currentpage=currentpage+1
			loadsessions()
		}
	})
	onclick(".pagebtn",function(element,event){
		let pagevalue=int(dataset(element,"page"))
		if(0<pagevalue&&pagevalue!=currentpage){
			currentpage=pagevalue
			loadsessions()
		}
	})
}

function bindbuttons(){
	onclick(".registersession",function(element,event){
		event.preventDefault()
		event.stopPropagation()
		element.disabled=true
		ajax("POST",AJAXURL+"registersession/"+dataset(element,"id"),function(event,data){
			if(data["success"]){
				loadsessions()
			}else{
				pttoast(data["data"]||sessiontext("unknownerror"),"error")
				element.disabled=false
			}
		},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
	})
	onclick(".unregistersession",function(element,event){
		event.preventDefault()
		event.stopPropagation()
		ptconfirm(sessiontext("unregisterconfirm"),function(ok){
			if(!ok){
				return
			}
			element.disabled=true
			ajax("POST",AJAXURL+"unregistersession/"+dataset(element,"id"),function(event,data){
				if(data["success"]){
					loadsessions()
				}else{
					pttoast(data["data"]||sessiontext("unknownerror"),"error")
					element.disabled=false
				}
			},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
		})
	})
	onclick(".copysession",function(element,event){
		event.preventDefault()
		event.stopPropagation()
		ajax("POST",AJAXURL+"copysession/"+dataset(element,"id"),function(event,data){
			if(data["success"]){
				href("session.html?id="+data["data"]+"#settings")
			}else{
				pttoast(sessiontext("unknownerror"),"error")
			}
		},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
	})
}

function loadtypes(done){
	ajax("GET",AJAXURL+"gettypelist",function(event,data){
		if(data["success"]){
			gametype=totypeobject(data["data"]["game"])
			limittype=totypeobject(data["data"]["limit"])
			stacktype=totypeobject(data["data"]["stack"])
			eventtype=totypeobject(data["data"]["event"])
		}
		done()
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
}

function loadclubs(){
	ajax("GET",AJAXURL+"getclublist",function(event,data){
		if(data["success"]){
			let row=data["data"]
			for(let i=0;i<row.length;i=i+1){
				innerhtml("#club",`<option value="${row[i]["id"]}">${row[i]["name"]}</option>`)
			}
		}
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
}

function loadsessionpayload(){
	savesessionliststate()
	let query=[]
	if(getvalue("startdate")){
		query.push("startdate="+encodeURIComponent(getvalue("startdate")))
	}
	if(getvalue("enddate")){
		query.push("enddate="+encodeURIComponent(getvalue("enddate")))
	}
	if(getvalue("club")){
		query.push("club="+encodeURIComponent(getvalue("club")))
	}
	if(getvalue("gametype")&&getvalue("gametype")!="all"){
		query.push("gametype="+encodeURIComponent(getvalue("gametype")))
	}
	if(getvalue("name")){
		query.push("name="+encodeURIComponent(getvalue("name")))
	}
	query.push("page="+currentpage)
	query.push("limit="+sessionpagelimit)
	return AJAXURL+"getsessionlist?"+query.join("&")
}

function loadsessions(){
	ajax("GET",loadsessionpayload(),function(event,data){
		if(data["success"]){
			let payload=data["data"]
			let sessions=payload["sessions"]||[]
			let stats=payload["stats"]||{
				"gamecount": 0,
				"totalprofit": 0,
				"avgduration": 0
			}
			renderpagination(payload["pagination"])
			renderSessionTable(sessions)
			innertext("#gamecount",stats["gamecount"],false)
			innertext("#profit",(0<=stats["totalprofit"]?"+":"")+stats["totalprofit"],false)
			innertext("#avgplaylength",formatduration(stats["avgduration"]),false)
			style("#profit",[["color",0<=stats["totalprofit"]?"#34d399":"#f87171"]])
		}else{
			pttoast(data["data"]||sessiontext("networkerror"),"error")
		}
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
}

applysessionlanguage()
loadclubs()
restoresessionliststate()
loadtypes(function(){
	loadsessions()
})

onclick("#search",function(element,event){
	currentpage=1
	loadsessions()
})

function savesessionliststate(){
	weblsset(sessionliststatekey,str({
		"startdate": getvalue("startdate"),
		"enddate": getvalue("enddate"),
		"club": getvalue("club"),
		"gametype": getvalue("gametype"),
		"name": getvalue("name"),
		"page": currentpage
	}))
}

function restoresessionliststate(){
	let saved=weblsget(sessionliststatekey)
	if(!saved){
		return
	}
	saved=json(saved)
	value("#startdate",saved["startdate"]||"",false)
	value("#enddate",saved["enddate"]||"",false)
	value("#gametype",saved["gametype"]||"all",false)
	value("#name",saved["name"]||"",false)
	currentpage=int(saved["page"]||1)
	setTimeout(function(){
		if(saved["club"]){
			value("#club",saved["club"],false)
		}
	},200)
}
