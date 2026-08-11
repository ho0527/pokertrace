let gametype={}
let limittype={}
let stacktype={}
let eventtype={}
// 場次列表的排序狀態。這份清單是**後端分頁**的，所以排序交給後端做
// （在前端排只會排到當前這一頁，使用者以為排了全部其實沒有）。
// 後端只開放時間 / 名稱 / 盈虧三欄 —— 買入與名次的顯示值是前端算出來的，
// 拿任何單一 SQL 欄位去排都會排出與畫面不一致的順序。
let sessionsortstate={ "key": "","ascended": true }
let currentpage=1
// 手機版（<sm 640px）一頁 10 筆，桌面版 20 筆：手機清單較窄，少一點比較好捲。
let sessionpagelimit=20
if(window.innerWidth<640){
	sessionpagelimit=10
}
let currentpagination={
	"page": 1,
	"limit": 20,
	"total": 0,
	"totalpages": 1,
	"hasprev": false,
	"hasnext": false
}
let sessionliststatekey=WEBLSNAME+"sessionliststate"
let quickfiltermode=""

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

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

function sessiontext(key){
	return TRANSLATE[LANGUAGE]["sessionlist"][key]||key
}

let lastsessions=[]

// 把一批場次資料組成 CSV 列（欄位與畫面一致）
function buildsessioncsvrows(sessions){
	let rows=[]
	rows.push([
		sessiontext("colname"),
		sessiontext("colcode"),
		sessiontext("colstart"),
		sessiontext("colend"),
		sessiontext("colbuyin"),
		sessiontext("colplace"),
		sessiontext("colprofit")
	])
	for(let i=0;i<sessions.length;i=i+1){
		let row=sessions[i]
		rows.push([
			row["name"]||"",
			getsessioncodetext(row),
			row["starttime"]||"",
			row["endtime"]||"",
			getbuyintext(row),
			getplacetext(row),
			getprofitdata(row)["text"]
		])
	}
	return rows
}

// 依目前的篩選條件匯出「所有頁」的場次成單一份 CSV（不限於目前這一頁）
function exportsessioncsv(){
	let query=buildsessionfilterquery()
	query.push("page=1")
	query.push("limit=1000000")
	let url=AJAXURL+"getsessionlist?"+query.join("&")
	ajax("GET",url,function(event,data){
		if(!data["success"]){
			pttoast(data["data"]||sessiontext("networkerror"),"error")
			return
		}
		let sessions=(data["data"]||{})["sessions"]||[]
		if(sessions.length<1){
			pttoast(sessiontext("exportnodata"),"error")
			return
		}
		let rows=buildsessioncsvrows(sessions)
		ptdownloadcsv("sessionlist_"+ptexporttimestamp()+".csv",rows)
		pttoast(sessiontext("exportdone"),"success")
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
		loadingtarget: "#main"
	})
}

// 把一批場次資料組成列印用的表格列（欄位與畫面 / CSV 一致）
function buildsessionprintrows(sessions){
	let rows=[]
	for(let i=0;i<sessions.length;i=i+1){
		let row=sessions[i]
		let starttime=row["starttime"]||""
		let datetext=ptformatdatetimeminute(starttime)
		rows.push([
			i+1,
			datetext,
			row["name"]||"",
			getsessioncodetext(row),
			getbuyintext(row),
			getplacetext(row),
			getprofitdata(row)["text"]
		])
	}
	return rows
}

// 依目前篩選條件列印「所有頁」的場次列表（不限於目前這一頁），供協會紙本存底
function printsessionlist(){
	let query=buildsessionfilterquery()
	query.push("page=1")
	query.push("limit=1000000")
	let url=AJAXURL+"getsessionlist?"+query.join("&")
	ajax("GET",url,function(event,data){
		if(!data["success"]){
			pttoast(data["data"]||sessiontext("networkerror"),"error")
			return
		}
		let sessions=(data["data"]||{})["sessions"]||[]
		if(sessions.length<1){
			pttoast(sessiontext("exportnodata"),"error")
			return
		}
		let columns=[
			{"title": sessiontext("printcolno"),"align": "right"},
			{"title": sessiontext("printcoltime")},
			{"title": sessiontext("printcolname")},
			{"title": sessiontext("printcolcode"),"align": "center"},
			{"title": sessiontext("printcolbuyin"),"align": "right"},
			{"title": sessiontext("printcolrank"),"align": "center"},
			{"title": sessiontext("printcolprofit"),"align": "right"}
		]
		let rows=buildsessionprintrows(sessions)
		let gamecount=domgetid("gamecount")?domgetid("gamecount").textContent:String(sessions.length)
		let profit=domgetid("profit")?domgetid("profit").textContent:"-"
		let avg=domgetid("avgplaylength")?domgetid("avgplaylength").textContent:"-"
		let infohtml=ptprintinfogrid([
			[sessiontext("printtotalsession"),gamecount],
			[sessiontext("printtotalprofit"),profit],
			[sessiontext("printavglength"),avg],
			[sessiontext("printcount"),sessions.length]
		])
		let bodyhtml=infohtml+ptprintsectiontitle(sessiontext("printsectiontitle"))+ptprinttable(columns,rows,sessiontext("printempty"))+ptprintsignblock([sessiontext("printsignstaff"),sessiontext("printsignmanager")])
		ptprintrun(ptprintbuild({
			"eyebrow": "Sessions",
			"title": sessiontext("printtitle"),
			"subtitle": sessiontext("printsubtitle"),
			"meta": sessiontext("printmeta")+" "+ptprinttimestamp()
		},bodyhtml))
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
		loadingtarget: "#main"
	})
}

function applysessionlanguage(){
	document.title=sessiontext("title")
	innertext("h1",sessiontext("title"),false)
	innertext("#quickfiltertitle",sessiontext("quickfilters"),false)
	value("#filter-registerable",sessiontext("onlyregisterable"))
	value("#filter-owned",sessiontext("onlyowned"))
	value("#filter-joined",sessiontext("onlyjoined"))
	domgetid("startdate").placeholder=sessiontext("startdate")
	domgetid("enddate").placeholder=sessiontext("enddate")
	// type=date 會忽略 placeholder(改顯示日期遮罩), 故未填時以 text 顯示提示文字, 聚焦才切回 date 選日期
	let datehintids=["startdate","enddate"]
	for(let di=0;di<datehintids.length;di=di+1){
		let dateel=domgetid(datehintids[di])
		if(!dateel){
			continue
		}
		if(!dateel.value){
			dateel.setAttribute("type","text")
		}
		dateel.addEventListener("focus",function(){
			this.setAttribute("type","date")
			if(typeof this.showPicker=="function"){
				try{ this.showPicker() }catch(err){}
			}
		})
		dateel.addEventListener("blur",function(){
			if(!this.value){
				this.setAttribute("type","text")
			}
		})
	}
	domgetid("name").placeholder=sessiontext("name")
	domgetid("search").value=sessiontext("search")
	if(domgetid("clearsearch")){
		domgetid("clearsearch").value=TRANSLATE[LANGUAGE]["sessionlist"]["clearsearch"]||"清空"
	}
	if(domgetid("exportsessioncsv")){
		domgetid("exportsessioncsv").value=sessiontext("exportcsv")
	}
	if(domgetid("togglefilter")){
		domgetid("togglefilter").value=TRANSLATE[LANGUAGE]["sessionlist"]["filteropen"]||"展開"
	}
	if(domgetid("filtertitle")){
		innertext("#filtertitle",TRANSLATE[LANGUAGE]["sessionlist"]["filtertitle"]||"篩選搜尋",false)
	}
	let sessionlinks=document.querySelectorAll("[data-newsessionlink]")
	for(let i=0;i<sessionlinks.length;i=i+1){
		sessionlinks[i].textContent=sessiontext("newsession")
	}
}

function applyquickfilterbuttons(){
	let list=[
		["filter-registerable","registerable"],
		["filter-owned","owned"],
		["filter-joined","joined"]
	]
	for(let i=0;i<list.length;i=i+1){
		let button=domgetid(list[i][0])
		if(!button){
			continue
		}
		removeclass(button,["bg-emerald-600","hover:bg-emerald-700"])
		addclass(button,["bg-zinc-700","hover:bg-zinc-600"])
		if(quickfiltermode==list[i][1]){
			removeclass(button,["bg-zinc-700","hover:bg-zinc-600"])
			addclass(button,["bg-emerald-600","hover:bg-emerald-700"])
		}
	}
}

function setfilteropened(opened){
	let filterbody=domgetid("filterbody")
	let togglefilter=domgetid("togglefilter")
	if(!filterbody||!togglefilter){
		return
	}
	if(opened){
		filterbody.classList.remove("hidden")
		togglefilter.value=TRANSLATE[LANGUAGE]["sessionlist"]["filterclose"]||"收合"
	}else{
		filterbody.classList.add("hidden")
		togglefilter.value=TRANSLATE[LANGUAGE]["sessionlist"]["filteropen"]||"展開"
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

function sessionedithref(row){
	if(row["owned"]==true){
		return "session.html?id="+row["id"]+"#settings"
	}
	return "session.html?id="+row["id"]+"#other-settings-result"
}

function sessionrowended(row){
	if(row["sessionended"]==true){
		return true
	}
	if(row["myregistrationstatus"]=="advanced"){
		return true
	}
	return false
}

function cansessionregister(row){
	return row["owned"]==true&&row["linkuser"]==true&&row["openregistration"]==true&&row["regclosed"]!=true&&sessionrowended(row)!=true&&row["isown"]!=true&&row["isstaff"]!=true
}

function sessionliststatuskey(row){
	if(sessionrowended(row)){
		return "ended"
	}
	if(row["openregistration"]==true&&row["regclosed"]!=true){
		return "registerable"
	}
	return "running"
}

function sessionshowmoney(row){
	return row["isstaff"]!=true&&((row["isown"]==false&&row["owned"]==true)||(row["isown"]==true&&row["owned"]==false))&&((row["isown"]==false&&(row["myregistrationstatus"]=="confirmed"||row["myregistrationstatus"]=="advanced"))||row["owned"]==false)
}

function hasmyregistrationfinance(row){
	return row["owned"]==true&&row["linkuser"]==true&&row["myregistration"]
}

function getbuyintext(row){
	if(hasmyregistrationfinance(row)){
		return row["myregistration"]["cost"]||0
	}
	let buyintotal=(row["buyin"]||0)+(row["buyinfee"]||0)
	let reentrytotal=(row["reentrybuyin"]||0)+(row["reentryfee"]||0)
	if(buyintotal!=reentrytotal){
		return buyintotal+"/"+reentrytotal
	}
	return ""+buyintotal
}

function getmobilebuyintext(row){
	return getbuyintext(row)
}

function getwinprice(row){
	let buyintotal=(row["buyin"]||0)+(row["buyinfee"]||0)
	let reentrytotal=(row["reentrybuyin"]||0)+(row["reentryfee"]||0)
	let rebuytotal=(row["rebuybuyin"]||0)+(row["rebuyfee"]||0)
	let addontotal=(row["addonbuyin"]||0)+(row["addonfee"]||0)
	return row["winprice"]-(buyintotal+reentrytotal*row["reentrycount"]+rebuytotal*row["rebuycount"]+addontotal*row["addoncount"])
}

function isplacenotregistered(row){
	if(row["owned"]!=true||row["linkuser"]!=true){
		return false
	}
	let status=row["myregistrationstatus"]
	return !row["myregistration"]||(status!="registered"&&status!="confirmed"&&status!="advanced")
}

function getplacetext(row){
	// 主辦關聯使用者報名的場次, 依選手報名狀態顯示名次
	if(row["owned"]==true&&row["linkuser"]==true){
		let total=row["displaytotalbuyin"]||row["totalbuyin"]||"-"
		// 沒有報名: 只顯示總報名人次
		if(isplacenotregistered(row)){
			return total
		}
		let place=row["myregistration"]["timerplace"]||row["displayplace"]||row["myregistration"]["place"]||0
		// 有報名還沒名次: - / 報名總人次
		if(!int(place)){
			return "- / "+total
		}
		// 有名次: 名次 / 報名總人次
		return place+" / "+total
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
		if((row["myregistrationstatus"]=="confirmed"||row["myregistrationstatus"]=="advanced")&&row["myregistration"]){
			let profit=row["myregistration"]["profit"]||0
			data["text"]=(0<=profit?"+":"")+profit
			data["class"]=0<=profit?"text-green-400":"text-red-400"
		}else if(row["myregistrationstatus"]=="registered"){
			data["text"]=sessiontext("registered")
			data["class"]="text-yellow-400"
		}else{
			let statuskey=sessionliststatuskey(row)
			data["text"]=sessiontext(statuskey)
			data["class"]=statuskey=="registerable"?"text-cyan-400":(statuskey=="ended"?"text-zinc-400":"text-sky-400")
		}
	}else{
		let winprice=getwinprice(row)
		data["text"]=(0<=winprice?"+":"")+winprice
		data["class"]=0<=winprice?"text-green-400":"text-red-400"
	}
	return data
}

function getmobileprofitdata(row){
	let data=getprofitdata(row)
	if(row["owned"]==true&&row["linkuser"]==true&&row["myregistrationstatus"]!="confirmed"&&row["myregistrationstatus"]!="advanced"&&row["myregistration"]){
		data["text"]=""
		data["class"]=""
		if(sessionrowended(row)){
			let cost=row["myregistration"]["cost"]||0
			data["text"]="-"+cost
			data["class"]="text-red-400"
		}
	}
	return data
}

function getregistrationaction(row){
	if(row["myregistrationstatus"]=="confirmed"&&row["myregistration"]&&row["myregistration"]["timerstatus"]=="eliminated"&&(int(row["reentrycount"]||0)<=0||int(row["myregistration"]["reentrycount"]||0)<int(row["reentrycount"]||0))){
		let eliminatedtext=TRANSLATE[LANGUAGE]["sessionlist"]["eliminated"]||"已淘汰"
		if(!cansessionregister(row)){
			return `<span class="text-zinc-400 text-sm font-semibold">${eliminatedtext}</span>`
		}
		return `
			<span class="text-zinc-400 text-sm font-semibold">${eliminatedtext}</span>
			<input type="button" class="text-emerald-400 hover:underline registersession cursor-pointer" data-id="${row["id"]}" value="${sessiontext("register")}">
		`
	}
	if(row["myregistrationstatus"]=="registered"||row["myregistrationstatus"]=="confirmed"){
		return `
			<span class="text-yellow-400 text-sm font-semibold">${sessiontext(row["myregistrationstatus"])}</span>
			<input type="button" class="text-red-400 hover:underline unregistersession cursor-pointer" data-id="${row["id"]}" value="${sessiontext("unregister")}">
		`
	}
	if(!cansessionregister(row)){
		return ""
	}
	return `<input type="button" class="text-emerald-400 hover:underline registersession cursor-pointer" data-id="${row["id"]}" value="${sessiontext("register")}">`
}

function getsessioncodetext(row){
	if(!eventtype[row["eventtypeid"]]||!stacktype[row["stacktypeid"]]||!limittype[row["limittypeid"]]||!gametype[row["gametypeid"]]){
		return ""
	}
	return safehtml(eventtype[row["eventtypeid"]]["code"])+safehtml(stacktype[row["stacktypeid"]]["code"])+safehtml(limittype[row["limittypeid"]]["code"])+safehtml(gametype[row["gametypeid"]]["code"])
}

function sessionpassesquickfilter(row){
	if(quickfiltermode=="registerable"){
		return cansessionregister(row)
	}
	if(quickfiltermode=="owned"){
		return row["isown"]==true&&row["owned"]==true
	}
	if(quickfiltermode=="joined"){
		if(row["myregistrationstatus"]=="registered"||row["myregistrationstatus"]=="confirmed"||row["myregistrationstatus"]=="advanced"){
			return true
		}
		if(row["isown"]==true&&row["owned"]!=true){
			return true
		}
		return row["isstaff"]==true
	}
	return true
}

function renderSessionTable(sessions){
	lastsessions=sessions||[]
	if(sessions.length<=0){
		let message=sessiontext("emptyall")
		let action=`
			<div class="mt-4 flex flex-wrap gap-2 justify-center">
				<a href="newsession.html" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">${sessiontext("newsession")}</a>
				<a href="profile.html" class="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded">${TRANSLATE[LANGUAGE]["navigationbar"]["profile"]}</a>
			</div>
			<div class="text-xs text-zinc-500 mt-3">${sessiontext("nextnewsession")}</div>
		`
		if(getvalue("startdate")||getvalue("enddate")||getvalue("club")||getvalue("name")||quickfiltermode){
			message=sessiontext("emptysearch")
			action=`
				<div class="mt-4 flex flex-wrap gap-2 justify-center">
					<input type="button" class="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded cursor-pointer" id="emptyclearfilters" value="${sessiontext("clearfilter")}">
				</div>
				<div class="text-xs text-zinc-500 mt-3">${sessiontext("nextdetail")}</div>
			`
		}
		ptshowempty("#main",message,action)
		onclick("#emptyclearfilters",function(element,event){
			value("#startdate","")
			value("#enddate","")
			value("#club","")
			value("#gametype","all")
			value("#name","")
			quickfiltermode=""
			applyquickfilterbuttons()
			currentpage=1
			loadsessions()
		})
		return
	}
	let startindex=((currentpagination["page"]||1)-1)*(currentpagination["limit"]||sessionpagelimit)
	if(window.innerWidth<768){
		innerhtml("#main",sessions.map(function(row,index){
			let profitdata=getmobileprofitdata(row)
			return `
				<div class="relative bg-zinc-900/70 rounded-2xl p-4 mb-3 border border-zinc-800 transition hover:border-zinc-700"><a href="session.html?id=${row["id"]}" class="absolute inset-0 rounded-2xl" aria-label="${safehtml(row["name"])}"></a>
					<div class="flex justify-between gap-3 mb-2">
						<div class="text-xs text-zinc-400">#${startindex+index+1} ${ptformatdatetimeminute(row["starttime"])}</div>
						<div class="${profitdata["class"]} font-bold">${profitdata["text"]}</div>
					</div>
					<div class="font-semibold">${safehtml(row["name"])} (${getsessioncodetext(row)})</div>
					<div class="grid grid-cols-2 gap-2 text-sm mt-3">
						<div><span class="text-zinc-500">${sessiontext("buyin")} </span>${getmobilebuyintext(row)}</div>
						<div><span class="text-zinc-500">${sessiontext(isplacenotregistered(row)?"totalregister":"place")} </span>${getplacetext(row)}</div>
					</div>
					<div class="relative z-10 flex flex-wrap gap-3 mt-3 text-sm justify-around items-center">
						${getregistrationaction(row)}
						${cansessiontimer(row)?`<a href="control.html?sessionid=${row["id"]}" class="text-emerald-400">${sessiontext("timer")}</a>`:(cansessiondisplay(row)?`<a href="display.html?sessionid=${row["id"]}" class="text-cyan-400">${sessiontext("displaytimer")}</a>`:`<a href="structure.html?sessionid=${row["id"]}" class="text-emerald-400">${sessiontext("structure")}</a>`)}
						${cansessioncopy(row)?`<input type="button" class="text-blue-400 copysession cursor-pointer" data-id="${row["id"]}" value="${sessiontext("copy")}">`:""}
						${cansessionedit(row)?`<a href="${sessionedithref(row)}" class="text-blue-400">${sessiontext("edit")}</a>`:""}
					</div>
				</div>
			`
		}).join(""),false)
		bindbuttons()
		return
	}
	innerhtml("#main",`
		<table class="sessionlisttable w-full text-sm border-separate border-spacing-0">
			<thead>
				<tr class="text-zinc-300" id="sessionlisthead">
					<th class="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-2 px-2">#</th>
					<th class="ptsortth select-none sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-2 px-2" data-sortkey="starttime"><span>${sessiontext("time")}</span><span class="ptsortarrow text-emerald-400" data-sortkey="starttime"></span></th>
					<th class="ptsortth select-none sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-2 px-2" data-sortkey="name"><span>${sessiontext("name")}</span><span class="ptsortarrow text-emerald-400" data-sortkey="name"></span></th>
					<th class="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-2 px-2">${sessiontext("buyin")}</th>
					<th class="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-2 px-2">${sessiontext("place")}</th>
					<th class="ptsortth select-none sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-2 px-2" data-sortkey="profit"><span>${sessiontext("profit")}</span><span class="ptsortarrow text-emerald-400" data-sortkey="profit"></span></th>
					<th class="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-2 px-2">${sessiontext("action")}</th>
				</tr>
			</thead>
			<tbody class="text-center">
				${sessions.map(function(row,index){
					let profitdata=getprofitdata(row)
					let rowdivider=index<sessions.length-1?"[&>td]:border-b [&>td]:border-zinc-800":""
					// 賽制代碼（例如 NDNNLHE）是辨識同名賽事的關鍵，**不能被截掉**，
					// 所以和名稱本體拆成兩個 span：只有名稱那半會縮、代碼那半固定完整顯示。
					// getsessioncodetext() 內部已經 safehtml 過，不要再跳脫一次。
					let codetext=getsessioncodetext(row)
					let codehtml=""
					let fullname=safehtml(row["name"])
					if(codetext){
						codehtml=`<span class="sessionnamecode">(${codetext})</span>`
						fullname=fullname+" ("+codetext+")"
					}
					return `
						<tr class="hover:bg-zinc-800/60 transition cursor-pointer ${rowdivider}">
							<td class="relative py-2 px-2">${startindex+index+1}<a href="session.html?id=${row["id"]}" class="rowlink absolute inset-0 z-10" aria-label="${safehtml(row["name"])}"></a></td>
							<td class="relative py-2 px-2">${ptformatdatetimeminute(row["starttime"])}<a href="session.html?id=${row["id"]}" class="rowlink absolute inset-0 z-10"></a></td>
							<td class="sessionnamecol relative py-2 px-2">
								<div class="sessionnamecell" title="${fullname}">
									<span class="sessionnametext">${safehtml(row["name"])}</span>
									${codehtml}
								</div>
								<a href="session.html?id=${row["id"]}" class="rowlink absolute inset-0 z-10"></a>
							</td>
							<td class="relative py-2 px-2">${sessionshowmoney(row)||hasmyregistrationfinance(row)?getbuyintext(row):"-"}<a href="session.html?id=${row["id"]}" class="rowlink absolute inset-0 z-10"></a></td>
							<td class="relative py-2 px-2">${getplacetext(row)}<a href="session.html?id=${row["id"]}" class="rowlink absolute inset-0 z-10"></a></td>
							<td class="relative py-2 px-2 ${profitdata["class"]} font-bold">${profitdata["text"]}<a href="session.html?id=${row["id"]}" class="rowlink absolute inset-0 z-10"></a></td>
							<td class="py-2 px-2" data-stop="true">
								${getregistrationaction(row)}
								${cansessiontimer(row)?`<a href="control.html?sessionid=${row["id"]}" class="text-emerald-400 hover:underline mr-2">${sessiontext("timer")}</a>`:(cansessiondisplay(row)?`<a href="display.html?sessionid=${row["id"]}" class="text-cyan-400 hover:underline mr-2">${sessiontext("displaytimer")}</a>`:`<a href="structure.html?sessionid=${row["id"]}" class="text-emerald-400 hover:underline mr-2">${sessiontext("structure")}</a>`)}
								${cansessioncopy(row)?`<input type="button" class="text-blue-400 hover:underline copysession cursor-pointer" data-id="${row["id"]}" value="${sessiontext("copy")}">`:""}
								${cansessionedit(row)?`<a href="${sessionedithref(row)}" class="text-blue-400 hover:underline">${sessiontext("edit")}</a>`:""}
							</td>
						</tr>
					`
				}).join("")}
			</tbody>
		</table>
	`,false)
	// 表頭每次 render 都被重畫，所以箭頭與點擊要在這裡重來一次
	ptsortarrow("#sessionlisthead",sessionsortstate["key"],sessionsortstate["ascended"])
	ptbindsort("#sessionlisthead",sessionsortstate,function(){
		currentpage=1
		loadsessions()
	})
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
	renderptpagination("pagination",currentpagination,function(pagevalue){
		currentpage=pagevalue
		loadsessions()
	})
}

function bindbuttons(){
	onclick(".registersession",function(element,event){
		event.preventDefault()
		event.stopPropagation()
		if(element.disabled){
			return
		}
		ptsetsubmitstate(element,true,sessiontext("registering"))
		ajax("POST",AJAXURL+"registersession/"+dataset(element,"id"),function(event,data){
			if(data["success"]){
				loadsessions()
			}else{
				pttoast(data["data"]||sessiontext("unknownerror"),"error")
				ptsetsubmitstate(element,false)
			}
		},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
			loadingtarget: "#main"
		})
	})
	onclick(".unregistersession",function(element,event){
		event.preventDefault()
		event.stopPropagation()
		ptconfirm(sessiontext("unregisterconfirm"),function(ok){
			if(!ok){
				return
			}
			if(element.disabled){
				return
			}
			ptsetsubmitstate(element,true,sessiontext("cancelling"))
			ajax("POST",AJAXURL+"unregistersession/"+dataset(element,"id"),function(event,data){
				if(data["success"]){
					loadsessions()
				}else{
					pttoast(data["data"]||sessiontext("unknownerror"),"error")
					ptsetsubmitstate(element,false)
				}
			},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
				loadingtarget: "#main"
			})
		})
	})
	onclick(".copysession",function(element,event){
		event.preventDefault()
		event.stopPropagation()
		if(element.disabled){
			return
		}
		ptsetsubmitstate(element,true,sessiontext("copying"))
		ajax("POST",AJAXURL+"copysession/"+dataset(element,"id"),function(event,data){
			if(data["success"]){
				href("session.html?id="+data["data"]+"#settings")
			}else{
				ptsetsubmitstate(element,false)
				pttoast(sessiontext("unknownerror"),"error")
			}
		},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
			loadingtarget: "#main"
		})
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
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
		loadingtarget: "#filterbody"
	})
}

function loadclubs(){
	ajax("GET",AJAXURL+"getclublist",function(event,data){
		if(data["success"]){
			let row=data["data"]
			for(let i=0;i<row.length;i=i+1){
				innerhtml("#club",`<option value="${safehtml(row[i]["id"])}">${safehtml(row[i]["name"])}</option>`)
			}
		}
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
		loadingtarget: "#filterbody"
	})
}

// 依目前的篩選條件組出查詢字串（不含分頁參數），匯出與列表共用
function buildsessionfilterquery(){
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
	if(quickfiltermode){
		query.push("quickfilter="+encodeURIComponent(quickfiltermode))
	}
	return query
}

function loadsessionpayload(){
	savesessionliststate()
	let query=buildsessionfilterquery()
	query.push("page="+currentpage)
	query.push("limit="+sessionpagelimit)
	if(sessionsortstate["key"]){
		query.push("order="+encodeURIComponent(sessionsortstate["key"]))
		query.push("direction="+(sessionsortstate["ascended"]?"asc":"desc"))
	}
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
			currentpage=((payload["pagination"]||{})["page"])||1
			renderpagination(payload["pagination"])
			renderSessionTable(sessions)
			innertext("#gamecount",stats["gamecount"],false)
			innertext("#profit",(0<=stats["totalprofit"]?"+":"")+stats["totalprofit"],false)
			innertext("#avgplaylength",formatduration(stats["avgduration"]),false)
			style("#profit",[["color",0<=stats["totalprofit"]?"#34d399":"#f87171"]])
		}else{
			pttoast(data["data"]||sessiontext("networkerror"),"error")
		}
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
		loadingtarget: "#main"
	})
}

applysessionlanguage()
loadclubs()
restoresessionliststate()
loadtypes(function(){
	applyquickfilterbuttons()
	loadsessions()
})

onkeydown("#name",function(element,event){
	if(event.key=="Enter"){
		click("#search")
	}
})

onclick("#exportsessioncsv",function(element,event){
	exportsessioncsv()
})

onclick("#printsessionlist",function(element,event){
	printsessionlist()
})

onclick("#search",function(element,event){
	currentpage=1
	loadsessions()
})

onclick("#clearsearch",function(element,event){
	value("#startdate","")
	value("#enddate","")
	value("#club","")
	value("#gametype","all")
	value("#name","")
	quickfiltermode=""
	applyquickfilterbuttons()
	currentpage=1
	loadsessions()
})

onclick("#filter-registerable",function(element,event){
	if(quickfiltermode=="registerable"){
		quickfiltermode=""
	}else{
		quickfiltermode="registerable"
	}
	applyquickfilterbuttons()
	currentpage=1
	loadsessions()
})

onclick("#filter-owned",function(element,event){
	if(quickfiltermode=="owned"){
		quickfiltermode=""
	}else{
		quickfiltermode="owned"
	}
	applyquickfilterbuttons()
	currentpage=1
	loadsessions()
})

onclick("#filter-joined",function(element,event){
	if(quickfiltermode=="joined"){
		quickfiltermode=""
	}else{
		quickfiltermode="joined"
	}
	applyquickfilterbuttons()
	currentpage=1
	loadsessions()
})

onclick("#togglefilter",function(element,event){
	let filterbody=domgetid("filterbody")
	if(filterbody&&filterbody.classList.contains("hidden")){
		setfilteropened(true)
	}else{
		setfilteropened(false)
	}
})

function savesessionliststate(){
	weblsset(sessionliststatekey,str({
		"startdate": getvalue("startdate"),
		"enddate": getvalue("enddate"),
		"club": getvalue("club"),
		"gametype": getvalue("gametype"),
		"name": getvalue("name"),
		"page": currentpage,
		"quickfiltermode": quickfiltermode
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
	quickfiltermode=saved["quickfiltermode"]||""
	applyquickfilterbuttons()
	setTimeout(function(){
		if(saved["club"]){
			value("#club",saved["club"],false)
		}
	},200)
}

onchange("#startdate",function(element,event){
	if(getvalue("enddate")==""){
		value("#enddate",getvalue("startdate"),false)
		savesessionliststate()
	}
})

onchange("#enddate",function(element,event){
	if(getvalue("startdate")==""){
		value("#startdate",getvalue("enddate"),false)
		savesessionliststate()
	}
})

// 表格中鍵拖曳捲動：在清單上按住滑鼠中鍵上下拖動即可快速捲動，純點一下中鍵仍維持開新分頁
let middledragscroll={
	active: false,
	moved: false,
	starty: 0,
	startscroll: 0,
	targetscroll: 0,
	rafid: 0
}

function getsessionscroller(){
	return domgetid("main")
}

// 每幀只寫一次 scrollTop，避免每個 mousemove 都同步觸發重排造成卡頓
function applymiddledragscroll(){
	middledragscroll.rafid=0
	let scroller=getsessionscroller()
	if(scroller){
		scroller.scrollTop=middledragscroll.targetscroll
	}
}

if(getsessionscroller()){
	getsessionscroller().addEventListener("mousedown",function(event){
		if(event.button!=1){
			return
		}
		let scroller=getsessionscroller()
		if(!scroller){
			return
		}
		middledragscroll.active=true
		middledragscroll.moved=false
		middledragscroll.starty=event.clientY
		middledragscroll.startscroll=scroller.scrollTop
		middledragscroll.targetscroll=scroller.scrollTop
		scroller.style.cursor="grabbing"
		scroller.classList.add("middledragging")
		event.preventDefault()
	})
	getsessionscroller().addEventListener("auxclick",function(event){
		if(event.button==1&&middledragscroll.moved){
			middledragscroll.moved=false
			event.preventDefault()
			event.stopPropagation()
		}
	},true)
	document.addEventListener("mousemove",function(event){
		if(!middledragscroll.active){
			return
		}
		let dy=event.clientY-middledragscroll.starty
		if(Math.abs(dy)>3){
			middledragscroll.moved=true
		}
		middledragscroll.targetscroll=middledragscroll.startscroll+dy*1.4
		if(!middledragscroll.rafid){
			middledragscroll.rafid=requestAnimationFrame(applymiddledragscroll)
		}
	})
	document.addEventListener("mouseup",function(event){
		if(!middledragscroll.active){
			return
		}
		middledragscroll.active=false
		if(middledragscroll.rafid){
			cancelAnimationFrame(middledragscroll.rafid)
			middledragscroll.rafid=0
		}
		let scroller=getsessionscroller()
		if(scroller){
			scroller.scrollTop=middledragscroll.targetscroll
			scroller.style.cursor=""
			scroller.classList.remove("middledragging")
		}
	})
}
