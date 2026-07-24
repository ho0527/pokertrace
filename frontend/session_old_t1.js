let sessionid=getget("id")
let tablelinked=false
let currentsession=null
let sessiontimerstate=null
let sessiontimerloadinged=false
let sessiontimercallbacks=[]
let sessionselectedtable=""
let sessionresizetimer=null
let settingclubs=[]
let settingtypes={
	"game": [],
	"limit": [],
	"stack": [],
	"event": []
}
let settingsessionlist=[]
let relationtype="satellite"
let relationpage={
	"satelliteoutgoing": 1,
	"satelliteincoming": 1,
	"multidayoutgoing": 1,
	"multidayincoming": 1
}
let settingtabkey=WEBLSNAME+"session-setting-tab-"+sessionid
let userchipcolors=[
	{"name": "白色","color": "#ffffff"},
	{"name": "紅色","color": "#ff0000"},
	{"name": "藍色","color": "#0000ff"},
	{"name": "綠色","color": "#008000"},
	{"name": "黑色","color": "#000000"}
]
let userchipsets=[]
let sessionhands=[]
let sessionhandsortdir=weblsget(WEBLSNAME+"handsortdir")||"desc"
let sessionhandsloadeded=false
let sessionevchart=null
let sessionselectedplayer=""
let sessionhandpage=1
let sessionhandpagesize=20
let sessiontables=[]
let sessiontablepage=1
let sessiontablepagesize=20
let sessionendeded=false
var myChart=null
let sessiondefaultviewapplieded=false

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

function updatesessionname(){
	if(!currentsession){
		return
	}
	innertext("#sessionname",currentsession["name"],false)
	if(typeof scheduleupdatetextmarquees=="function"){
		scheduleupdatetextmarquees()
	}
}

function updatesessiontabs(){
	if(!currentsession){
		return
	}
	let showed=!!currentsession["owned"]
	let settingsed=canviewsessionsettings(currentsession)
	let hiddenkeys=[
		"payout"
	]
	for(let i=0;i<hiddenkeys.length;i=i+1){
		let key=hiddenkeys[i]
		let btn=document.querySelector('.tab-btn[data-tab="'+key+'"]')
		let content=domgetid("tab-"+key)
		if(btn){
			btn.classList.toggle("hidden",!showed)
		}
		if(content&&!showed){
			content.classList.toggle("hidden",true)
		}
	}
	let active=document.querySelector(".tab-btn.border-emerald-400")
	let tableseatbtn=document.querySelector('.tabletab-btn[data-tabletab="seats"]')
	if(tableseatbtn){
		tableseatbtn.classList.toggle("hidden",!showed)
	}
	let tableseatcontent=domgetid("tabletab-seats")
	if(tableseatcontent&&!showed){
		tableseatcontent.classList.add("hidden")
	}
	if(!showed&&active&&active.getAttribute("data-tab")=="payout"){
		let overview=document.querySelector('.tab-btn[data-tab="overview"]')
		if(overview){
			overview.click()
		}
	}
	if(!showed&&domgetid("tabletab-list")){
		selectsessiontabletab("list")
	}
	let settingsbtn=document.querySelector('.othertab-btn[data-othertab="settings"]')
	let settingscontent=domgetid("othertab-settings")
	if(settingsbtn){
		settingsbtn.classList.toggle("hidden",!settingsed)
	}
	if(settingscontent&&!settingsed){
		settingscontent.classList.add("hidden")
	}
	if(!settingsed&&settingsbtn&&settingsbtn.classList.contains("border-emerald-400")){
		selectsessionothertab("orderinfo")
	}
}

function canviewsessionsettings(row){
	if(!row){
		return false
	}
	if(row["isown"]||row["isadmin"]||row["isstaff"]){
		return true
	}
	return false
}

function sessionroledata(row){
	let result={
		"role": "選手",
		"status": "可查看場次資訊",
		"nextstep": "先確認時間、地點與目前是否開放報名。",
		"ctatext": "查看總覽",
		"ctahref": "#overview-general",
		"focus": "你現在先需要的是場次基本資訊與報名狀態。",
		"helper": "完成必要動作後，再往下看牌桌、手牌或其他細節。"
	}
	if(row["isown"]||row["isadmin"]){
		result["role"]="主辦 / 管理"
		result["status"]="可管理報名、計時器、設定與場次結構"
		result["nextstep"]="先檢查報名狀態與計時器，再決定是否要進入管理區。"
		result["ctatext"]="前往管理區"
		result["ctahref"]="#other-settings"
		result["focus"]="主辦版首屏會優先給你管理入口與現場執行工具。"
		result["helper"]="報名清單、計時器控制台與場次設定會集中在快速入口。"
		return result
	}
	if(row["accessrole"]=="floor"||row["accessrole"]=="assistant"){
		result["role"]=row["accessrole"]=="floor"?"裁判":"助理"
		result["status"]="可協助現場流程，並可操作計時器"
		result["nextstep"]="先確認目前報名 / 計時器狀態，再進入控制台執行現場操作。"
		result["ctatext"]="開啟計時器控制台"
		result["ctahref"]="control.html?sessionid="+sessionid
		result["focus"]="你現在最重要的是知道目前節奏、報名是否關閉、以及下一步現場流程。"
		result["helper"]="深層設定不會放在首屏，先把現場執行需要的資訊看清楚。"
		return result
	}
	if(row["isstaff"]==true){
		result["role"]="已聘用員工"
		result["status"]="可查看相關場次並協助執行，但不會以選手身份報名"
		result["nextstep"]="先確認你的協助範圍與目前場次狀態。"
		result["ctatext"]="查看場次狀態"
		result["ctahref"]="#overview-general"
		result["focus"]="員工版首屏會先給你必要資訊，不會把選手報名動作放在前面。"
		result["helper"]="若你是裁判或助理，會另外顯示計時器相關入口。"
		return result
	}
	let mystatus=row["myregistrationstatus"]||""
	if(mystatus=="registered"){
		result["status"]="你已報名，等待主辦確認"
		result["nextstep"]="保留這頁追蹤確認狀態，若行程有變可取消報名。"
		result["ctatext"]="查看我的狀態"
		result["ctahref"]="#overview-general"
		result["focus"]="你現在最重要的是等候確認，不需要先看深層管理資訊。"
		result["helper"]="確認後再留意座位、剩餘人數與計時器顯示。"
		return result
	}
	if(mystatus=="confirmed"){
		result["status"]="你已確認入場"
		result["nextstep"]="先確認自己的名次 / 入場資料，再視需要看牌桌或計時器。"
		result["ctatext"]="查看我的資料"
		result["ctahref"]="#overview-general"
		result["focus"]="你的首屏會優先展示個人結果與接下來要注意的資訊。"
		result["helper"]="如果你已淘汰且可再入場，主動作會改成再入場。"
		return result
	}
	if(row["openregistration"]==true&&row["linkuser"]==true){
		result["status"]="目前開放報名"
		result["nextstep"]="先看規則與時間，確認沒問題後直接報名。"
		result["ctatext"]="立即報名"
		result["ctahref"]="#overview-general"
		result["focus"]="選手首屏會先把是否能報名和你接下來該做什麼講清楚。"
		result["helper"]="不需要先翻到手牌、設定或其他管理資訊。"
		return result
	}
	result["status"]="目前未開放報名或尚未與選手報名連結"
	result["nextstep"]="先確認開賽時間、報名條件與主辦公告。"
	return result
}

function sessionquickbutton(href,label,color,target){
	if(href.indexOf("#")==0){
		return `<input type="button" class="${color} inline-flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-bold text-white transition" data-sessionjump="${safehtml(href)}" value="${safehtml(label)}">`
	}
	let targettext=target?` target="${target}"`:""
	return `<a href="${href}"${targettext} class="${color} inline-flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-bold text-white transition">${label}</a>`
}

function rendersessionrolesummary(row){
	let element=domgetid("rolesummary")
	if(!element||!row){
		return
	}
	let roledata=sessionroledata(row)
	let cta=roledata["ctahref"].indexOf(".html")!=-1
		? sessionquickbutton(roledata["ctahref"],roledata["ctatext"],"bg-emerald-600 hover:bg-emerald-500")
		: sessionquickbutton(roledata["ctahref"],roledata["ctatext"],"bg-emerald-600 hover:bg-emerald-500")
	element.innerHTML=`
		<div class="text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-400">你的角色</div>
		<div class="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div class="min-w-0 flex-1">
				<div class="text-3xl font-extrabold tracking-tight text-white">${safehtml(roledata["role"])}</div>
				<div class="mt-2 text-sm leading-7 text-zinc-300">${safehtml(roledata["status"])}</div>
				<div class="mt-4 rounded-2xl border border-emerald-900/60 bg-black/20 px-4 py-4">
					<div class="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">建議下一步</div>
					<div class="mt-2 text-base font-semibold text-white">${safehtml(roledata["nextstep"])}</div>
				</div>
			</div>
			<div class="shrink-0">${cta}</div>
		</div>
	`
}

function rendersessionfocus(row){
	let element=domgetid("sessionfocus")
	if(!element||!row){
		return
	}
	let roledata=sessionroledata(row)
	let rows=[
		{"label": "目前身份", "value": roledata["role"]},
		{"label": "報名狀態", "value": row["myregistrationstatus"]||"未報名"},
		{"label": "計時器", "value": row["linkuser"]==true?"可連動":"未連動"},
		{"label": "報名", "value": row["openregistration"]==true?"開放中":"未開放"}
	]
	let html=""
	for(let i=0;i<rows.length;i=i+1){
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
				<div class="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">${safehtml(rows[i]["label"])}</div>
				<div class="mt-1 text-base font-semibold text-white">${safehtml(rows[i]["value"])}</div>
			</div>
		`
	}
	element.innerHTML=`
		<div class="text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-400">現在先看這些</div>
		<div class="mt-3 text-sm leading-7 text-zinc-300">${safehtml(roledata["focus"])}</div>
		<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">${html}</div>
		<div class="mt-4 text-sm leading-7 text-zinc-400">${safehtml(roledata["helper"])}</div>
	`
}

function rendersessionnextsteps(row){
	let element=domgetid("sessionnextsteps")
	if(!element||!row){
		return
	}
	let roledata=sessionroledata(row)
	let list=[]
	if(row["isown"]||row["isadmin"]){
		list=[
			"先檢查目前是否開放報名、是否需要切去報名清單處理現場名單。",
			"若場次進行中，優先確認計時器與報名關閉狀態。",
			"需要調整規則時再進入其他設定，避免現場分心。"
		]
	}else if(row["accessrole"]=="floor"||row["accessrole"]=="assistant"){
		list=[
			"先確認當前關卡、剩餘人數與報名是否已關閉。",
			"有現場節奏需要處理時，再進控制台執行操作。",
			"若只需查看資訊，留在總覽即可，不必先進設定。"
		]
	}else if(row["isstaff"]==true){
		list=[
			"先確認自己是以員工身份協助，不需要執行選手報名動作。",
			"查看目前場次狀態與座位 / 進度資訊。",
			"有需要再配合主辦進入對應工具頁。"
		]
	}else{
		list=[
			"先看目前是否開放報名與你的報名狀態。",
			"已確認入場再看個人名次、座位與計時器資訊。",
			"深層資料如手牌與其他設定放在後面，需要時再進去。"
		]
	}
	let html=""
	for(let i=0;i<list.length;i=i+1){
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4">
				<div class="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">STEP ${i+1}</div>
				<div class="mt-2 text-sm leading-7 text-zinc-200">${safehtml(list[i])}</div>
			</div>
		`
	}
	element.innerHTML=`
		<div class="text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-400">你下一步該做什麼</div>
		<div class="mt-2 text-sm leading-7 text-zinc-400">${safehtml(roledata["nextstep"])}</div>
		<div class="mt-4 grid grid-cols-1 gap-3">${html}</div>
	`
}

function rendersessionquicklinks(row){
	let element=domgetid("sessionquicklinks")
	if(!element||!row){
		return
	}
	let html=""
	if(row["isown"]||row["isadmin"]){
		html=html+sessionquickbutton("register.html?sessionid="+sessionid,"報名工作台","bg-purple-600 hover:bg-purple-500")
		html=html+sessionquickbutton("control.html?sessionid="+sessionid,"計時器控制台","bg-emerald-600 hover:bg-emerald-500")
		html=html+sessionquickbutton("display.html?sessionid="+sessionid,"顯示頁","bg-sky-600 hover:bg-sky-500","_blank")
		html=html+sessionquickbutton("#other-settings","場次設定","bg-zinc-800 hover:bg-zinc-700")
	}else if(row["accessrole"]=="floor"||row["accessrole"]=="assistant"){
		html=html+sessionquickbutton("control.html?sessionid="+sessionid,"前往控制台","bg-emerald-600 hover:bg-emerald-500")
		html=html+sessionquickbutton("display.html?sessionid="+sessionid,"顯示頁","bg-sky-600 hover:bg-sky-500","_blank")
		html=html+sessionquickbutton("#table-list","查看牌桌","bg-zinc-800 hover:bg-zinc-700")
	}else{
		html=html+sessionquickbutton("#overview-general","總覽資訊","bg-emerald-600 hover:bg-emerald-500")
		html=html+sessionquickbutton("#table-list","牌桌 / 座位","bg-zinc-800 hover:bg-zinc-700")
		html=html+sessionquickbutton("display.html?sessionid="+sessionid,"計時器顯示","bg-sky-600 hover:bg-sky-500","_blank")
	}
	element.innerHTML=`
		<div class="text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-400">快速入口</div>
		<div class="mt-2 text-sm leading-7 text-zinc-400">把這個角色最常用的動作集中在這裡，避免同頁資訊過載。</div>
		<div class="mt-4 flex flex-wrap gap-3">${html}</div>
	`
}

function applydefaultsessionview(row){
	if(sessiondefaultviewapplieded||location.hash){
		return
	}
	sessiondefaultviewapplieded=true
	let tab=document.querySelector('.tab-btn[data-tab="overview"]')
	if(tab){
		tab.click()
		selectsessionoverviewtab("general")
	}
}

function sessioninfocard(label,value,extraclass){
	return `
		<div class="bg-zinc-900/60 border border-zinc-700 rounded-lg px-4 py-3 min-h-[74px] flex flex-col justify-center">
			<div class="text-xs text-zinc-500 mb-1">${safehtml(label)}</div>
			<div class="text-base font-semibold ${!extraclass.includes("text-")?"text-zinc-100":""} break-words ${extraclass||""}" data-textmarquee>${safehtml(value)}</div>
		</div>
	`
}

function sessioninfohtmlcard(label,html,extraclass){
	return `
		<div class="bg-zinc-900/60 border border-zinc-700 rounded-lg px-4 py-3 min-h-[74px]">
			<div class="text-xs text-zinc-500 mb-1">${safehtml(label)}</div>
			<div class="text-base font-semibold text-zinc-100 break-words ${extraclass||""}" data-textmarquee>${html}</div>
		</div>
	`
}

function sessionboolbadge(value){
	let yes=sessionbooltext(value)=="是"
	let cls=yes?"bg-emerald-500/15 text-emerald-300 border-emerald-500/40":"bg-zinc-700/40 text-zinc-400 border-zinc-600"
	let dot=yes?"bg-emerald-400":"bg-zinc-500"
	return `<span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${cls}"><span class="h-1.5 w-1.5 rounded-full ${dot}"></span>${yes?"是":"否"}</span>`
}

function sessionboolcard(label,value){
	return `
		<div class="bg-zinc-900/60 border border-zinc-700 rounded-lg px-4 py-3 min-h-[74px] flex flex-col items-center justify-center gap-1.5">
			<div class="text-xs text-zinc-500">${safehtml(label)}</div>
			${sessionboolbadge(value)}
		</div>
	`
}

function sessionboolrow(label,value){
	return `
		<div class="flex items-center justify-between gap-2 rounded-lg bg-zinc-900/40 px-3 py-2">
			<span class="text-xs text-zinc-400">${safehtml(label)}</span>
			${sessionboolbadge(value)}
		</div>
	`
}

function sessionsectiontitle(title){
	return `<div class="col-span-1 sm:col-span-2 lg:col-span-4 text-xs font-semibold tracking-wide text-zinc-500 mt-2">${safehtml(title)}</div>`
}

function sessionsettingspanel(rows){
	let inner=""
	for(let i=0;i<rows.length;i=i+1){
		inner=inner+sessionboolrow(rows[i][0],rows[i][1])
	}
	return `
		<div class="col-span-1 sm:col-span-2 lg:col-span-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">${inner}</div>
		</div>
	`
}

function sessionrebuycard(label,enabled,count,buyin,fee,chip){
	if(!enabled){
		return `
			<div class="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3">
				<span class="text-sm font-semibold text-zinc-400">${safehtml(label)}</span>
				${sessionboolbadge(false)}
			</div>
		`
	}
	return `
		<div class="rounded-lg border border-emerald-700/40 bg-emerald-900/10 px-4 py-3">
			<div class="flex items-center justify-between gap-2 mb-2">
				<span class="text-sm font-semibold text-zinc-100">${safehtml(label)}</span>
				${sessionboolbadge(true)}
			</div>
			<div class="grid grid-cols-3 gap-2 text-center">
				<div><div class="text-[11px] text-zinc-500">次數</div><div class="text-sm font-semibold text-zinc-200">${safehtml(sessionrebuynumber(count))}</div></div>
				<div><div class="text-[11px] text-zinc-500">買入</div><div class="text-sm font-semibold text-zinc-200">${safehtml(sessionfeetext(buyin,fee))}</div></div>
				<div><div class="text-[11px] text-zinc-500">計分牌</div><div class="text-sm font-semibold text-zinc-200">${safehtml(sessionrebuynumber(chip))}</div></div>
			</div>
		</div>
	`
}

function sessiondisplayvalue(value){
	if(value==false){
		return "否"
	}
	if(value==true){
		return "是"
	}
	if(value==null||value==undefined||value==""){
		return "-"
	}
	return value
}

function sessionrebuynumber(value){
	if(value==null||value==undefined||value==""||value==false){
		return "0"
	}
	return value
}

function sessionbooltext(value){
	if(value==true||value==1||value=="1"||value=="true"||value=="True"){
		return "是"
	}
	return "否"
}

function sessiontypetext(typekey,idvalue,fallback){
	let rows=settingtypes[typekey]||[]
	for(let i=0;i<rows.length;i=i+1){
		if(String(rows[i]["id"])==String(idvalue)||String(rows[i]["code"])==String(idvalue)){
			let code=rows[i]["code"]
			if(TRANSLATE[LANGUAGE]["type"]&&TRANSLATE[LANGUAGE]["type"][typekey]&&TRANSLATE[LANGUAGE]["type"][typekey][code]){
				return TRANSLATE[LANGUAGE]["type"][typekey][code]
			}
			return rows[i]["name"]||code||rows[i]["id"]
		}
	}
	if(typekey=="game"&&TRANSLATE[LANGUAGE]["gametype"]&&TRANSLATE[LANGUAGE]["gametype"][fallback]){
		return TRANSLATE[LANGUAGE]["gametype"][fallback]
	}
	return sessiondisplayvalue(fallback||idvalue)
}

function sessionmoneytext(value){
	value=sessiondisplayvalue(value)
	if(value=="-"){
		return value
	}
	return value
}

function sessionfeetext(price,fee){
	return sessionmoneytext(price+fee)+"("+sessionmoneytext(price)+"+"+sessionmoneytext(fee)+")"
}

function sessionyesbycount(count,price,chip){
	if(float(count||0)>0||float(price||0)>0||float(chip||0)>0){
		return "是"
	}
	return "否"
}

function sessionantetext(value){
	if(value=="ante"){
		return "前注"
	}
	return "大盲前注"
}

function rendersessiondetailinfo(row){
	if(!domgetid("sessiondetailinfo")){
		return
	}
	if(!row){
		return
	}
	let html=""
	html=html+sessioninfocard("遊戲方式",sessiontypetext("limit",row["limittypeid"],row["limittypeid"])+sessiontypetext("stack",row["stacktypeid"],row["stacktypeid"])+"碼"+sessiontypetext("game",row["gametypeid"],row["gametype"]),"text-center")
	html=html+sessioninfocard("賽事細項",sessiontypetext("event",row["eventtypeid"],row["eventtypeid"]),"text-center")
	html=html+sessioninfocard("每桌座位",sessiondisplayvalue(row["maxseat"]),"text-center")
	html=html+sessioninfocard("前注模式",sessionantetext(row["antemode"]),"text-center")
	html=html+sessioninfocard("買入(服務費)",sessionfeetext(row["buyin"],row["buyinfee"]),"text-center")
	html=html+sessioninfocard("買入計分牌",sessionmoneytext(row["chip"]),"text-center")
	html=html+sessioninfocard("票券價值",sessionmoneytext(row["ticketvalue"]),"text-center")
	html=html+sessioninfocard("保底獎金",sessionmoneytext(row["guaranteedprize"]),"text-center")

	html=html+sessionsectiontitle("買入規則")
	html=html+`<div class="col-span-1 sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-2">`
	html=html+sessionrebuycard("可再入",sessionyesbycount(row["reentrycount"],row["reentrybuyin"],row["reentrychip"])=="是",row["reentrycount"],row["reentrybuyin"],row["reentryfee"],row["reentrychip"])
	html=html+sessionrebuycard("可重買",sessionyesbycount(row["rebuycount"],row["rebuybuyin"],row["rebuychip"])=="是",row["rebuycount"],row["rebuybuyin"],row["rebuyfee"],row["rebuychip"])
	html=html+sessionrebuycard("可增購",sessionyesbycount(row["addoncount"],row["addonbuyin"],row["addonchip"])=="是",row["addoncount"],row["addonbuyin"],row["addonfee"],row["addonchip"])
	html=html+`</div>`

	html=html+sessionsectiontitle("場次設定")
	html=html+sessionsettingspanel([
		["允許票券",row["ticketenabled"]],
		["報名截止",row["regclosed"]],
		["使用者連結",row["linkuser"]],
		["開放報名",row["openregistration"]],
		["私人牌局",row["private"]],
		["場次結束",row["sessionended"]],
		["統一手牌紀錄",row["unifiedhandrecord"]],
		["依時間自動開始",row["autostartbytime"]]
	])
	innerhtml("#sessiondetailinfo",html,false)
}

function updatesessionhandcount(){
	if(domgetid("sessionhandcount")){
		innertext("#sessionhandcount",sessionhands.length,false)
	}
}

function getsessiondetailplacetext(row){
	// 邏輯對齊 sessionlist.js 的 getplacetext: 優先用 myregistration.timerplace(即時算好的名次), 不要直接用 session 表本身的 place/totalbuyin 欄位
	if(row["owned"]==true&&row["linkuser"]==true){
		let total=row["displaytotalbuyin"]||row["totalbuyin"]||"-"
		let status=row["myregistrationstatus"]
		if(!row["myregistration"]||(status!="registered"&&status!="confirmed"&&status!="advanced")){
			return total
		}
		let place=row["myregistration"]["timerplace"]||row["displayplace"]||row["myregistration"]["place"]||0
		if(!int(place)){
			return "- / "+total
		}
		return place+" / "+total
	}
	return (row["place"]||"-")+" / "+(row["multidayremaining"]||row["totalbuyin"]||"-")
}

function getmyregistrationhtml(row){
	if(!row["myregistration"]){
		return ""
	}
	let registration=row["myregistration"]
	let place=registration["timerplace"]||registration["place"]||"-"
	let totalbuyin=row["displaytotalbuyin"]||row["totalbuyin"]||"-"
	let cost=registration["cost"]||0
	let prize=registration["finalprize"]||0
	let profit=registration["profit"]||0
	let profitclass=0<=profit?"text-green-400":"text-red-400"
	let payment=registration["paymenttype"]=="ticket"?"票券":"現金"
	return `
		${sessioninfocard("我的入場",cost+" ("+payment+")","")}
		${sessioninfocard("我的名次",place+" / "+totalbuyin,"")}
		${sessioninfocard("我的獎金",prize,"")}
		${sessioninfocard("我的盈虧",(0<=profit?"+":"")+profit,profitclass)}
	`
}

function caneditstructure(row){
	if(row["isown"]||row["isadmin"]||row["accessrole"]=="assistant"){
		return true
	}
	return false
}

function getstructurebuttonhtml(row){
	if(caneditstructure(row)){
		return `
			<a href="structureedit.html?sessionid=${sessionid}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold">修改結構</a>
		`
	}
	return `
		<a href="structure.html?sessionid=${sessionid}" class="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-sm font-semibold">查看結構</a>
	`
}

function sessionregclosed(row){
	let state=sessiontimerstate||{}
	if(sessiontimerstate&&Object.prototype.hasOwnProperty.call(state,"regClosed")){
		return state["regClosed"]==true
	}
	return row["regclosed"]==true
}

function sessiondeadlinelevel(schedule,index){
	let level=0
	for(let i=0;i<=index;i=i+1){
		if(schedule[i]&&schedule[i]["type"]=="level"){
			level=level+1
		}
	}
	if(schedule[index]&&schedule[index]["type"]=="break"){
		return "Lv."+level+"休息"
	}
	return "Lv."+level
}

function sessiondeadlineclock(row,minutes){
	let starttime=new Date(row["starttime"])
	if(isNaN(starttime.getTime())){
		return ""
	}
	starttime.setUTCMinutes(starttime.getUTCMinutes()+minutes)
	let hour=String(starttime.getUTCHours()).padStart(2,"0")
	let minute=String(starttime.getUTCMinutes()).padStart(2,"0")
	return hour+":"+minute
}

function sessionregistrationdeadline(row){
	let state=sessiontimerstate||{}
	let schedule=state["schedule"]||[]
	if(schedule.length==0){
		schedule=row["schedule"]||[]
	}
	let minutes=0
	for(let i=0;i<schedule.length;i=i+1){
		let item=schedule[i]||{}
		minutes=minutes+int(item["dur"]||0)
		if(item["regCloseAfter"]){
			let level=sessiondeadlinelevel(schedule,i)
			let clock=sessiondeadlineclock(row,minutes)
			if(clock){
				return level+"/"+clock
			}
			return level
		}
	}
	return "X"
}

function sessiondatetext(row){
	return ptformatdatetimeminute(row["starttime"])+"@"+sessionregistrationdeadline(row)
}

function rendersessiondate(row){
	innertext("#date",sessiondatetext(row),false)
}

function sessiontableno(row){
	return row["no"]||row["name"]||row["token"]||""
}

function initsessiontabletools(){
	let list=domgetid("tabletab-list")
	if(!list){
		return
	}
	let controls=list.querySelector(".bg-zinc-800.rounded-lg.p-4")
	if(controls&&!domgetid("tablesearch")){
		// 整段重建前先保存 #tableboardentry(多牌桌總覽入口), 重建後插回, 避免被 innerHTML 抹除
		let tableboardentry=domgetid("tableboardentry")
		controls.innerHTML=`
			<input type="number" min="1" inputmode="numeric" class="bg-zinc-700 text-white rounded px-3 py-2" id="tablesearch" placeholder="牌桌編號">
			<input type="button" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded" id="tablesearchbutton" value="搜尋">
			<a href="newtable.html" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" id="newtable">新增牌桌</a>
			<input type="button" class="hidden bg-red-600 hover:bg-red-700 px-4 py-2 rounded cursor-pointer" id="deletetable" value="刪除所有牌桌">
		`
		if(tableboardentry){
			domgetid("newtable").insertAdjacentElement("afterend",tableboardentry)
		}
	}
	if(domgetid("newtable")){
		domgetid("newtable").href="newtable.html?sessionid="+sessionid
		if(!canviewsessionsettings(currentsession)){
			domgetid("newtable").classList.add("hidden")
		}else{
			domgetid("newtable").classList.remove("hidden")
		}
	}
	if(domgetid("deletetable")&&!canviewsessionsettings(currentsession)){
		domgetid("deletetable").classList.add("hidden")
	}
	let heads=list.querySelectorAll("thead th")
	if(heads.length){
		heads[0].textContent="牌桌編號"
	}
	if(!domgetid("tablepager")){
		let pager=doccreate("div")
		pager.id="tablepager"
		pager.className="flex flex-wrap items-center justify-between gap-3 mt-3 text-sm"
		list.appendChild(pager)
	}
	let search=domgetid("tablesearch")
	if(search&&!search.dataset.binded){
		search.dataset.binded="1"
		search.addEventListener("input",function(){
			sessiontablepage=1
			rendersessiontablelist()
		})
	}
	let searchbutton=domgetid("tablesearchbutton")
	if(searchbutton&&!searchbutton.dataset.binded){
		searchbutton.dataset.binded="1"
		onclick("#tablesearchbutton",function(element,event){
			sessiontablepage=1
			rendersessiontablelist()
		})
	}
}

function filtersessiontables(){
	let keyword=String(getvalue("tablesearch")||"").trim()
	let rows=[]
	for(let i=0;i<sessiontables.length;i=i+1){
		let tableno=String(sessiontableno(sessiontables[i]))
		if(!keyword||tableno.indexOf(keyword)!=-1){
			rows.push(sessiontables[i])
		}
	}
	return rows
}

function rendersessiontablepager(total){
	let totalpage=Math.max(1,Math.ceil(total/sessiontablepagesize))
	if(totalpage<sessiontablepage){
		sessiontablepage=totalpage
	}
	let start=total?((sessiontablepage-1)*sessiontablepagesize+1):0
	let end=Math.min(total,sessiontablepage*sessiontablepagesize)
	innerhtml("#tablepager",`
		<div class="text-zinc-400">顯示 ${start}-${end} / ${total}</div>
		<div class="flex items-center gap-2">
			<input type="button" class="tablepagebtn bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded" data-page="${sessiontablepage-1}" ${sessiontablepage<=1?"disabled":""} value="上一頁">
			<span class="text-zinc-300">${sessiontablepage} / ${totalpage}</span>
			<input type="button" class="tablepagebtn bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded" data-page="${sessiontablepage+1}" ${totalpage<=sessiontablepage?"disabled":""} value="下一頁">
		</div>
	`,false)
	onclick(".tablepagebtn",function(element,event){
		let page=int(dataset(element,"page")||1)
		if(page<1){
			page=1
		}
		sessiontablepage=page
		rendersessiontablelist()
	})
}

function rendersessiontablelist(){
	let rows=filtersessiontables()
	let totalpage=Math.max(1,Math.ceil(rows.length/sessiontablepagesize))
	if(totalpage<sessiontablepage){
		sessiontablepage=totalpage
	}
	let start=(sessiontablepage-1)*sessiontablepagesize
	let end=Math.min(rows.length,start+sessiontablepagesize)
	let html=""
	for(let i=start;i<end;i=i+1){
		let tableurl=`table.html?id=${rows[i]["id"]}`
		html=html+`
			<tr class="hover:bg-zinc-700 transition cursor-pointer sessiontablerow" data-url="${tableurl}">
				<td class="relative py-2 px-2">${safehtml(sessiontableno(rows[i]))}<a href="${tableurl}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2">
					${
						tablelinked||!canviewsessionsettings(currentsession)?`
							-<a href="${tableurl}" class="rowlink absolute inset-0 z-10"></a>
						`:`
							<a href="edittable.html?id=${rows[i]["id"]}" class="text-blue-400 hover:underline">編輯</a>
							<input type="button" class="text-red-400 hover:underline deletetable" data-id="${rows[i]["id"]}" value="刪除">
						`
					}
				</td>
			</tr>
		`
	}
	if(!html){
		html=`<tr><td colspan="2" class="py-6 text-zinc-500 text-center">查無牌桌</td></tr>`
	}
	innerhtml("#tablemain",html,false)
	onclick(".sessiontablerow",function(element,event){
		// 只攔截導航用的 rowlink 左鍵改走 SPA；中鍵／Ctrl 交給 <a> 原生（背景開新分頁、不離開本頁）；編輯/刪除等控制項照常運作
		if(!event.target.closest("a.rowlink")){
			return
		}
		if(event&&event.button!=0){
			return
		}
		if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
			return
		}
		event.preventDefault()
		href(dataset(element,"url"))
	})
	onclick(".deletetable",function(element,event){
		ptconfirm("確定刪除?",function(){
			event.preventDefault()
			event.stopPropagation()

			element.disabled=true

			ajax("DELETE",AJAXURL+"deletetable/"+dataset(element,"id"),function(event,data){
				if(data["success"]){
					pttoast("刪除成功","success")
					for(let i=0;i<sessiontables.length;i=i+1){
						if(String(sessiontables[i]["id"])==String(dataset(element,"id"))){
							sessiontables.splice(i,1)
							break
						}
					}
					rendersessiontablelist()
				}else{
					pttoast("刪除失敗","error")
					element.disabled=false
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	})
	rendersessiontablepager(rows.length)
}

function sessionplayersended(players){
	if(!players.length){
		return false
	}
	for(let i=0;i<players.length;i=i+1){
		if(players[i]["registrationstatus"]!="advanced"&&!int(players[i]["place"]||0)){
			return false
		}
	}
	return true
}

function sessionended(row){
	let state=sessiontimerstate||{}
	let players=state["linkedPlayers"]||[]
	if(sessionplayersended(players)){
		return true
	}
	if(sessiontimerstate){
	}else if(row["sessionended"]==true){
		return true
	}
	let totalentries=int(state["totalEntries"]||0)
	if(!players.length&&totalentries<=0){
		return false
	}
	let active=0
	for(let i=0;i<players.length;i=i+1){
		if(players[i]["status"]=="active"&&players[i]["registrationstatus"]!="advanced"){
			active=active+1
		}
	}
	return active<=1
}

function sessionregistrationopened(row){
	if(row["openregistration"]==false){
		return false
	}
	if(sessionregclosed(row)){
		return false
	}
	return true
}

function sessionstatusdata(row){
	if(sessionended(row)){
		return {
			"key": "end",
			"text": "End (已結束)",
			"class": "text-zinc-300 border-zinc-500 bg-zinc-700/40"
		}
	}
	if(row["openregistration"]==false){
		return {
			"key": "running",
			"text": "Running (進行中)",
			"class": "text-sky-300 border-sky-500/50 bg-sky-500/10"
		}
	}
	if(!sessionregistrationopened(row)){
		return {
			"key": "running",
			"text": "Running (進行中)",
			"class": "text-sky-300 border-sky-500/50 bg-sky-500/10"
		}
	}
	return {
		"key": "latereg",
		"text": "Late Reg. (報名中)",
		"class": "text-emerald-300 border-emerald-500/50 bg-emerald-500/10"
	}
}

function sessionstatushtml(row){
	let status=sessionstatusdata(row)
	let text=status["text"]
	if(status["key"]=="latereg"){
		text="報名中"
	}else if(status["key"]=="running"){
		text="進行中"
	}else if(status["key"]=="end"){
		text="已結束"
	}
	return `<span class="inline-flex items-center rounded border px-3 py-2 text-sm font-semibold ${status["class"]}">${text}</span>`
}

function sessionmoney(value){
	value=float(value)||0
	return "$"+value
}

function payoutpool(state){
	if(!state){
		return 0
	}
	if(state["prizePoolMode"]=="manual"){
		return float(state["prizePoolManual"])||0
	}
	let pool=(float(state["buyin"])||0)*(float(state["totalEntries"])||0)
	pool=pool+(float(state["prizePoolCarryover"])||0)
	if(pool<(float(state["guaranteedPrize"])||0)){
		pool=float(state["guaranteedPrize"])||0
	}
	return pool
}

function payoutranknumber(value){
	let match=String(value||"").match(/\d+/)
	if(match){
		return int(match[0])
	}
	return 0
}

function payoutrankrange(value,index){
	let text=String(value||"").trim().replace(/[－–—]/g,"-")
	let match=text.match(/(\d+)\s*-\s*(\d+)/)
	if(match){
		let start=int(match[1])
		let end=int(match[2])
		if(end<start){
			let temp=start
			start=end
			end=temp
		}
		return { "start": start, "end": end, "text": start+"-"+end }
	}
	let rank=payoutranknumber(text)
	if(rank==0){
		rank=index+1
	}
	return { "start": rank, "end": rank, "text": String(rank) }
}

function payoutrewardtext(item){
	let reward=String(item["reward"]||"").trim()
	if(reward==""||payoutrewardmoney(reward)!=null){
		return ""
	}
	return reward
}

function payoutvalue(item,amount){
	let rewardtext=payoutrewardtext(item)
	let moneytext=amount>0?sessionmoney(amount):""
	if(moneytext!=""&&rewardtext!=""){
		return moneytext+"+"+rewardtext
	}
	if(moneytext!=""){
		return moneytext
	}
	if(rewardtext!=""){
		return rewardtext
	}
	return sessionmoney(amount)
}

function payoutrewardmoney(value){
	if(value==null||value==undefined){
		return null
	}
	let text=String(value).replace(/,/g,"").replace(/\$/g,"").trim()
	if(text==""||!/^-?\d+(\.\d+)?$/.test(text)){
		return null
	}
	return float(text)
}

function payoutcashamount(item,pool,totalpct){
	let cash=float(item["cash"])||0
	if(cash>0){
		return Math.round(cash)
	}
	if(item["reward"]){
		let rewardmoney=payoutrewardmoney(item["reward"])
		if(rewardmoney!=null){
			return Math.round(rewardmoney)
		}
		// reward 非空但不是數字 (例如晉級 DAY2A 這種 flight 標記) 時金額為 0, 不落到 pct 分支
		// 對齊後端 _payoutamount: float(reward) 失敗即 return 0, 否則會顯示不存在的幻影獎金
		return 0
	}
	let pct=float(item["pct"])||0
	if(totalpct<=1.5){
		return Math.round(pool*pct)
	}
	return Math.round(pool*pct/100)
}

function payoutcashtotal(payouts,pool,totalpct){
	let total=0
	for(let i=0;i<payouts.length;i=i+1){
		total=total+payoutcashamount(payouts[i],pool,totalpct)
	}
	return total
}

function payoutamountforrank(payouts,pool,totalpct,rank){
	for(let i=0;i<payouts.length;i=i+1){
		let item=payouts[i]
		let itemrank=payoutrankrange(item["rank"],i)
		if(itemrank["start"]<=rank&&rank<=itemrank["end"]){
			return payoutvalue(item,payoutcashamount(item,pool,totalpct))
		}
	}
	return "-"
}

function payoutplayerprize(item,autoprize){
	let override=item["prizeoverride"]
	if(override!=null&&override!=undefined){
		return sessionmoney(float(override)||0)
	}
	let stored=item["prize"]
	if(stored!=null&&stored!=undefined&&(float(stored)||0)!=0){
		return sessionmoney(float(stored)||0)
	}
	return autoprize
}

function payoutplayerorderstatus(item){
	if(item["registrationstatus"]=="advanced"){
		return 1
	}
	if(item["status"]=="active"){
		return 2
	}
	return 3
}

function payoutplayerorder(players){
	let rows=[]
	for(let i=0;i<players.length;i=i+1){
		rows.push(players[i])
	}
	rows.sort(function(a,b){
		let astatus=payoutplayerorderstatus(a)
		let bstatus=payoutplayerorderstatus(b)
		if(astatus!=bstatus){
			return astatus-bstatus
		}
		if(astatus==1){
			let achip=int(a["advancechip"]||0)
			let bchip=int(b["advancechip"]||0)
			if(achip!=bchip){
				return bchip-achip
			}
		}
		if(astatus==3){
			let ap=int(a["place"]||0)
			let bp=int(b["place"]||0)
			if(ap&&bp&&ap!=bp){
				return ap-bp
			}
			if(ap&&!bp){
				return -1
			}
			if(!ap&&bp){
				return 1
			}
		}
		let aserial=int(a["serialno"]||0)
		let bserial=int(b["serialno"]||0)
		if(aserial!=bserial){
			return aserial-bserial
		}
		return int(a["sessionplayerid"]||0)-int(b["sessionplayerid"]||0)
	})
	return rows
}

function payoutplayerswithplaces(players){
	let rows=[]
	for(let i=0;i<players.length;i=i+1){
		let item={}
		for(let key in players[i]){
			item[key]=players[i][key]
		}
		rows.push(item)
	}
	let eliminated=[]
	for(let i=0;i<rows.length;i=i+1){
		if(rows[i]["status"]=="eliminated"){
			eliminated.push(rows[i])
		}
	}
	eliminated.sort(function(a,b){
		let atime=String(a["eliminatedtime"]||"")
		let btime=String(b["eliminatedtime"]||"")
		if(atime<btime){
			return -1
		}
		if(atime>btime){
			return 1
		}
		return int(a["id"]||0)-int(b["id"]||0)
	})
	for(let i=0;i<eliminated.length;i=i+1){
		if(!int(eliminated[i]["place"]||0)){
			eliminated[i]["place"]=rows.length-i
		}
	}
	return rows
}

function sessiontimerauthheaders(){
	let headers=[]
	let token=weblsget(WEBLSNAME+"token")
	if(token){
		headers.push(["Authorization","Bearer "+token])
	}
	return headers
}

function loadsessiontimerdata(done){
	if(sessiontimerstate){
		done()
		return
	}
	sessiontimercallbacks.push(done)
	if(sessiontimerloadinged){
		return
	}
	sessiontimerloadinged=true
	let watchdog=setTimeout(function(){
		pttoast("載入時間較久, 請檢查連線後重試","warning")
	},15000)
	ajax("GET",AJAXURL+"gettimer/"+sessionid,function(event,data){
		clearTimeout(watchdog)
		sessiontimerloadinged=false
		if(data["success"]&&data["data"]&&data["data"]["state"]){
			sessiontimerstate=data["data"]["state"]
		}
		let callbacks=sessiontimercallbacks
		sessiontimercallbacks=[]
		for(let i=0;i<callbacks.length;i=i+1){
			callbacks[i]()
		}
	},null,sessiontimerauthheaders())
}

function mysessionplayerid(){
	if(currentsession&&currentsession["myregistration"]){
		return currentsession["myregistration"]["id"]
	}
	return null
}

function sessionplayerseattext(item){
	if(sessionendeded){
		return "-"
	}
	if(item["tablename"]&&item["seatno"]){
		return item["tablename"]+" / Seat "+item["seatno"]
	}
	if(item["tabletoken"]&&item["seatno"]){
		return item["tabletoken"]+" / Seat "+item["seatno"]
	}
	if(item["seatno"]){
		return "Seat "+item["seatno"]
	}
	return "-"
}

function playerinitials(item){
	let name=item["playername"]||item["playerplayerid"]||"?"
	name=String(name)
	let text=""
	for(let i=0;i<name.length;i=i+1){
		if(name[i]!=" "){
			text=text+name[i]
		}
		if(text.length>=2){
			return text
		}
	}
	return text||"?"
}

function playeravatarhtml(item,sizeclass){
	let avatar=item["playeravatarurl"]||""
	if(avatar){
		return `<img src="${safehtml(avatar)}" class="${sizeclass} rounded-full object-cover border border-zinc-600" referrerpolicy="no-referrer">`
	}
	return `<div class="${sizeclass} rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-xs font-bold text-zinc-200">${safehtml(playerinitials(item))}</div>`
}

function sessionplayerstatus(item){
	if(item["registrationstatus"]=="advanced"){
		let advancechip=int(item["advancechip"]||0)
		if(advancechip){
			return "已晉級 ("+advancechip+")"
		}
		return "已晉級"
	}
	if(item["status"]=="active"){
		return "進行中..."
	}
	return "已淘汰"
}

function sessionplayerkeywordmatch(item,keyword){
	if(!keyword){
		return true
	}
	keyword=String(keyword).toLowerCase()
	let name=String(item["playername"]||"").toLowerCase()
	let playerid=String(item["playerplayerid"]||"").toLowerCase()
	let table=String(item["tablename"]||item["tabletoken"]||"").toLowerCase()
	if(name.indexOf(keyword)!=-1||playerid.indexOf(keyword)!=-1||table.indexOf(keyword)!=-1){
		return true
	}
	return false
}

function payoutplayerkeywordmatch(item,keyword,ranktext,prize){
	if(!keyword){
		return true
	}
	keyword=String(keyword).toLowerCase()
	let name=String(item["playername"]||"").toLowerCase()
	let playerid=String(item["playerplayerid"]||"").toLowerCase()
	let seat=String(sessionplayerseattext(item)||"").toLowerCase()
	let rank=String(ranktext||"").toLowerCase()
	let amount=String(prize||"").toLowerCase()
	if(name.indexOf(keyword)!=-1||playerid.indexOf(keyword)!=-1||seat.indexOf(keyword)!=-1||rank.indexOf(keyword)!=-1||amount.indexOf(keyword)!=-1){
		return true
	}
	return false
}

function buildsessionplayertables(players,keyword){
	let tables={}
	let tablekeys=[]
	for(let i=0;i<players.length;i=i+1){
		let item=players[i]
		if(item["status"]!="active"){
			continue
		}
		if(!sessionplayerkeywordmatch(item,keyword)){
			continue
		}
		let key=item["tableid"]?String(item["tableid"]):"unseated"
		if(!tables[key]){
			tables[key]={
				"key": key,
				"name": item["tablename"]||item["tabletoken"]||"未排座",
				"players": []
			}
			tablekeys.push(key)
		}
		tables[key]["players"].push(item)
	}
	return {
		"tables": tables,
		"tablekeys": tablekeys
	}
}

function sessiontablebuttonhtml(table,key,activekey){
	return `
		<input type="button" class="sessiontablebtn ${key==activekey?"bg-emerald-600 text-white":"bg-zinc-700 text-zinc-200"} hover:bg-emerald-700 px-3 py-2 rounded text-sm" data-tablekey="${safehtml(key)}" value="${safehtml(table["name"])} ${table["players"].length}">
	`
}

function seatplayer(list,seatno){
	for(let i=0;i<list.length;i=i+1){
		if(String(list[i]["seatno"])==String(seatno)){
			return list[i]
		}
	}
	return null
}

function sessiontablecirclehtml(table,myid){
	let maxseat=int(currentsession["maxseat"]||9)
	if(maxseat<=0){
		maxseat=9
	}
	let mobileed=window.innerWidth<640
	let aspectclass=mobileed?"aspect-[7/8]":"aspect-[16/10]"
	let tableleft=mobileed?8:8
	let tableright=mobileed?8:8
	let tabletop=mobileed?16:18
	let tablebottom=mobileed?14:18
	let dealerbottom=mobileed?89:87
	let rx=mobileed?41:39
	let ry=mobileed?39:30
	let cy=mobileed?51:52
	let cardwidth=mobileed?62:88
	let emptywidth=mobileed?54:68
	let avatarclass=mobileed?"w-7 h-7":"w-9 h-9"
	let avatarwrap=mobileed?"w-7":"w-9"
	let cardpadding=mobileed?"px-1 py-1":"px-1.5 py-1.5"
	let nametext=mobileed?"text-[10px]":"text-xs"
	let html=`
		<div class="relative mx-auto my-2 w-full max-w-[960px] ${aspectclass} overflow-visible">
			<div class="absolute rounded-[50%] bg-emerald-950/70 border-4 border-emerald-800 shadow-inner flex items-center justify-center" style="left:${tableleft}%;right:${tableright}%;top:${tabletop}%;bottom:${tablebottom}%">
				<div class="text-center">
					<div class="${mobileed?"text-sm":"text-lg"} font-semibold text-emerald-100">${safehtml(table["name"])}</div>
					<div class="text-xs text-emerald-300">${table["players"].length} players</div>
				</div>
			</div>
			<div class="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-zinc-950 border border-yellow-200 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide shadow-lg z-10" style="top:${dealerbottom}%">DEALER</div>
	`
	let seatgap=maxseat-1
	if(seatgap<=0){
		seatgap=1
	}
	for(let i=1;i<=maxseat;i=i+1){
		let angle=(138+(264*(i-1)/seatgap))*Math.PI/180
		let left=50+rx*Math.cos(angle)
		let top=cy+ry*Math.sin(angle)
		if(!mobileed&&maxseat==9){
			let desktoppositions=[
				null,
				{ "left": 24,"top": 75 },
				{ "left": 10,"top": 61 },
				{ "left": 10,"top": 39 },
				{ "left": 28,"top": 24 },
				{ "left": 50,"top": 20 },
				{ "left": 72,"top": 24 },
				{ "left": 90,"top": 39 },
				{ "left": 90,"top": 61 },
				{ "left": 76,"top": 75 }
			]
			left=desktoppositions[i]["left"]
			top=desktoppositions[i]["top"]
		}
		let item=seatplayer(table["players"],i)
		let ownered=item&&myid&&String(item["sessionplayerid"])==String(myid)
		if(item){
			html=html+`
				<div class="absolute -translate-x-1/2 -translate-y-1/2 text-center" style="left:${left}%;top:${top}%;width:${cardwidth}px">
					<div class="${ownered?"bg-emerald-900/90 border-emerald-400":"bg-zinc-900/95 border-zinc-700"} border rounded-lg ${cardpadding} shadow-lg">
						<div class="mx-auto ${avatarwrap}">${playeravatarhtml(item,avatarclass)}</div>
						<div class="mt-1 text-[11px] text-zinc-400">Seat ${i}</div>
						<div class="${nametext} font-semibold truncate">${safehtml(item["playername"]||"-")}</div>
					</div>
				</div>
			`
		}else{
			html=html+`
				<div class="absolute -translate-x-1/2 -translate-y-1/2 text-center" style="left:${left}%;top:${top}%;width:${emptywidth}px">
					<div class="bg-zinc-900/80 border border-zinc-700 rounded-lg ${cardpadding} shadow">
						<div class="text-[11px] text-zinc-500">Seat ${i}</div>
						<div class="${nametext} font-semibold text-zinc-500">EMPTY</div>
					</div>
				</div>
			`
		}
	}
	html=html+`</div>`
	return html
}

function sessionunseatedhtml(table,myid){
	let html=`
		<div class="border border-zinc-700 rounded p-4">
			<div class="font-semibold mb-3">${safehtml(table["name"])}</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
	`
	for(let i=0;i<table["players"].length;i=i+1){
		let item=table["players"][i]
		let ownered=myid&&String(item["sessionplayerid"])==String(myid)
		html=html+`
			<div class="${ownered?"bg-emerald-900/30 border-emerald-700":"bg-zinc-700/40 border-zinc-700"} border rounded px-3 py-2 flex items-center gap-2">
				${playeravatarhtml(item,"w-9 h-9")}
				<div class="min-w-0">
					<div class="text-sm font-semibold truncate">${safehtml(item["playername"]||"-")}</div>
					<div class="text-xs text-zinc-500">${safehtml(item["playerplayerid"]||"")}</div>
				</div>
			</div>
		`
	}
	html=html+`</div></div>`
	return html
}

function bindsessionplayeractions(){
	onclick(".sessiontablebtn",function(element,event){
		sessionselectedtable=dataset(element,"tablekey")
		rendersessionplayers()
	})
	let search=domgetid("sessionplayersearch")
	if(search){
		search.addEventListener("input",function(){
			rendersessionplayers()
		})
	}
}

function rendersessionplayers(){
	let box=domgetid("sessionplayerscontent")
	if(!box){
		return
	}
	if(!currentsession){
		innerhtml("#sessionplayerscontent",`<div class="text-zinc-400 text-sm">場次資料載入中...</div>`,false)
		return
	}
	if(!currentsession["linkuser"]){
		innerhtml("#sessionplayerscontent",`
			<div class="text-lg font-semibold mb-2">座位</div>
			<div class="text-zinc-400 text-sm">此場次沒有開啟關聯選手。</div>
		`,false)
		return
	}
	loadsessiontimerdata(function(){
		let state=sessiontimerstate||{}
		let players=state["linkedPlayers"]||[]
		let activecount=0
		for(let i=0;i<players.length;i=i+1){
			if(players[i]["status"]=="active"){
				activecount=activecount+1
			}
		}
		let searched=document.activeElement&&document.activeElement.id=="sessionplayersearch"
		let myid=mysessionplayerid()
		let myseat=null
		for(let i=0;i<players.length;i=i+1){
			if(myid&&String(players[i]["sessionplayerid"])==String(myid)){
				myseat=players[i]
			}
		}
		let oldsearch=domgetid("sessionplayersearch")
		let keyword=oldsearch?oldsearch.value:""
		let tabledata=buildsessionplayertables(players,keyword)
		let tables=tabledata["tables"]
		let tablekeys=tabledata["tablekeys"]
		if((!sessionselectedtable||!tables[sessionselectedtable])&&myseat&&tables[String(myseat["tableid"])]){
			sessionselectedtable=String(myseat["tableid"])
		}
		if((!sessionselectedtable||!tables[sessionselectedtable])&&0<tablekeys.length){
			sessionselectedtable=tablekeys[0]
		}
		let myhtml=`<div class="text-zinc-400 text-sm">尚未找到你的座位。若已報名，請等待主辦確認並排座。</div>`
		if(myseat){
			myhtml=`
				<div class="inline-flex flex-wrap items-center gap-2 bg-emerald-900/30 border border-emerald-700 rounded px-3 py-2">
					<span class="text-emerald-300 font-semibold">我的座位</span>
					<span>${sessionplayerseattext(myseat)}</span>
				</div>
			`
		}else if(currentsession["myregistrationstatus"]=="registered"){
			myhtml=`<div class="text-yellow-300 text-sm">你已報名，等待主辦確認。</div>`
		}
		let html=`
			<div class="flex flex-wrap justify-between gap-3 mb-4">
				<div>
					<div class="text-lg font-semibold">座位</div>
					<div class="text-sm text-zinc-400">目前 ${tablekeys.length} 桌 / ${activecount} 位選手</div>
				</div>
				${myhtml}
			</div>
			<div class="flex flex-wrap gap-2 items-center mb-4">
				<input id="sessionplayersearch" class="bg-zinc-700 text-white rounded px-3 py-2 text-sm min-w-[240px]" value="${keyword}" placeholder="查詢選手名稱 / ID / 牌桌">
			</div>
		`
		if(tablekeys.length==0){
			html=html+`<div class="text-zinc-500 text-sm">目前沒有符合條件的關聯選手。</div>`
			innerhtml("#sessionplayerscontent",html,false)
			bindsessionplayeractions()
			if(searched&&domgetid("sessionplayersearch")){
				domgetid("sessionplayersearch").focus()
			}
			return
		}
		html=html+`<div class="flex flex-wrap gap-2 mb-5">`
		for(let i=0;i<tablekeys.length;i=i+1){
			html=html+sessiontablebuttonhtml(tables[tablekeys[i]],tablekeys[i],sessionselectedtable)
		}
		html=html+`</div>`
		let activetable=tables[sessionselectedtable]||tables[tablekeys[0]]
		if(sessionselectedtable=="unseated"){
			html=html+sessionunseatedhtml(activetable,myid)
		}else{
			html=html+sessiontablecirclehtml(activetable,myid)
		}
		innerhtml("#sessionplayerscontent",html,false)
		bindsessionplayeractions()
		if(searched&&domgetid("sessionplayersearch")){
			domgetid("sessionplayersearch").focus()
		}
	})
}

function rendersessionpayout(){
	let box=domgetid("sessionpayoutcontent")
	if(!box){
		return
	}
	let oldsearch=domgetid("sessionpayoutsearch")
	let keyword=oldsearch?oldsearch.value:""
	let searched=document.activeElement&&document.activeElement.id=="sessionpayoutsearch"
	loadsessiontimerdata(function(){
		let state=sessiontimerstate||{}
		let payouts=state["payouts"]||[]
		let players=payoutplayerswithplaces(state["linkedPlayers"]||[])
		players=payoutplayerorder(players)
		let pool=payoutpool(state)
		let totalpct=0
		for(let i=0;i<payouts.length;i=i+1){
			totalpct=totalpct+(float(payouts[i]["pct"])||0)
		}
		let cashprize=payoutcashtotal(payouts,pool,totalpct)
		// 其他獎勵: 自由標籤的獎勵列, 與名次列合併在同一張表顯示;
		// 其中的「獎金」要一併計入上方的總獎金(獎池 pool 維持原始報名金額不變)。
		let otherrewardlist=state["otherReward"]
		if(!Array.isArray(otherrewardlist)){
			otherrewardlist=[]
		}
		for(let i=0;i<otherrewardlist.length;i=i+1){
			cashprize=cashprize+(float((otherrewardlist[i]||{})["cash"])||0)
		}
		let html=`
			<div class="flex flex-wrap justify-between gap-3 mb-4">
				<div>
					<div class="text-lg font-semibold">名次</div>
					<div class="text-sm text-zinc-400">總獎金 ${sessionmoney(cashprize)} / 原獎池 ${sessionmoney(pool)} / Entries ${state["totalEntries"]||0}</div>
				</div>
			</div>
		`
		if(payouts.length==0&&otherrewardlist.length==0){
			html=html+`<div class="text-zinc-500 text-sm">目前沒有 payout 設定。</div>`
		}else{
			// 名次列與其他獎勵列合併在同一張表; 其他獎勵的「名次」那格顯示主辦自訂的標籤文字。
			html=html+`
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-zinc-700 text-zinc-300">
								<th class="py-2 px-2 text-left">名次</th>
								<th class="py-2 px-2 text-right">獎項</th>
							</tr>
						</thead>
						<tbody>
			`
			for(let i=0;i<payouts.length;i=i+1){
				let item=payouts[i]
				let amount=payoutcashamount(item,pool,totalpct)
				let rank=payoutrankrange(item["rank"],i)["text"]
				html=html+`
					<tr class="border-b border-zinc-700">
						<td class="py-2 px-2">${rank}</td>
						<td class="py-2 px-2 text-right font-semibold">${safehtml(payoutvalue(item,amount))}</td>
					</tr>
				`
			}
			for(let i=0;i<otherrewardlist.length;i=i+1){
				let otheritem=otherrewardlist[i]||{}
				let othercash=float(otheritem["cash"])||0
				let otherreward=String(otheritem["reward"]||"").trim()
				let otherparts=[]
				if(0<othercash){
					otherparts.push(sessionmoney(othercash))
				}
				if(otherreward!=""){
					otherparts.push(otherreward)
				}
				// label / reward 是主辦自由輸入的文字, 進 innerhtml 前一律 safehtml 跳脫防 XSS
				html=html+`
					<tr class="border-b border-zinc-700">
						<td class="py-2 px-2">${safehtml(String(otheritem["label"]||"").trim())}</td>
						<td class="py-2 px-2 text-right font-semibold">${safehtml(otherparts.join("＋"))}</td>
					</tr>
				`
			}
			html=html+`
						</tbody>
					</table>
				</div>
			`
		}
		html=html+`
			<div class="mt-6">
				<div class="flex flex-wrap items-center justify-between gap-3 mb-3">
					<div class="font-semibold text-zinc-100">選手狀態與獎金</div>
					<input id="sessionpayoutsearch" class="bg-zinc-700 text-white rounded px-3 py-2 text-sm w-full sm:w-72" value="${keyword}" placeholder="查詢選手 / ID / 桌位 / 名次">
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-zinc-700 text-zinc-300">
								<th class="py-2 px-2 text-left">選手</th>
								<th class="py-2 px-2 text-left">桌位</th>
								<th class="py-2 px-2 text-left">名次</th>
								<th class="py-2 px-2 text-right">獎項</th>
							</tr>
						</thead>
						<tbody>
		`
		let showncount=0
		if(currentsession){
			sessionendeded=sessionended(currentsession)
		}
		if(players.length==0){
			html=html+`
				<tr>
					<td class="py-3 px-2 text-zinc-500" colspan="4">目前沒有關聯選手。</td>
				</tr>
			`
		}
		for(let i=0;i<players.length;i=i+1){
			let item=players[i]
			let advanceded=item["registrationstatus"]=="advanced"
			let activeed=item["status"]=="active"&&!advanceded
			let place=int(item["place"]||0)
			let ranktext="已淘汰"
			let prize="-"
			let rankclass="text-red-300"
			if(activeed&&sessionendeded&&place<=0){
				place=1
			}
			if(activeed){
				if(0<place){
					ranktext=String(place)
					prize=payoutamountforrank(payouts,pool,totalpct,place)
				}else{
					ranktext="進行中..."
					rankclass="text-emerald-300"
				}
			}else if(advanceded){
				let advancechip=int(item["advancechip"]||0)
				if(advancechip){
					ranktext="已晉級 ("+advancechip+")"
				}else{
					ranktext="已晉級"
				}
				rankclass="text-sky-300"
			}else if(place){
				ranktext=String(place)
				prize=payoutamountforrank(payouts,pool,totalpct,place)
			}
			prize=payoutplayerprize(item,prize)
			if(!payoutplayerkeywordmatch(item,keyword,ranktext,prize)){
				continue
			}
			showncount=showncount+1
			let reentrycount=int(item["reentrycount"]||0)
			let rebuycount=int(item["rebuycount"]||0)
			let addoncount=int(item["addoncount"]||0)
			let buytags=[]
			if(reentrycount>0){
				buytags.push("E"+reentrycount)
			}
			if(rebuycount>0){
				buytags.push("R:"+rebuycount)
			}
			if(addoncount>0){
				buytags.push("A:"+addoncount)
			}
			let reentryhtml=""
			if(buytags.length>0){
				reentryhtml=`<div class="text-xs text-amber-400">(${buytags.join(" ")})</div>`
			}
			html=html+`
				<tr class="border-b border-zinc-700 ${activeed?"":"bg-zinc-900/30"}">
					<td class="py-2 px-2">
						<div class="flex items-center gap-2">
							${playeravatarhtml(item,"w-9 h-9")}
							<div class="min-w-0">
								<div class="font-semibold truncate">${safehtml(item["playername"]||"-")}</div>
								<div class="text-xs text-zinc-500">${safehtml(item["playerplayerid"]||"")}</div>
							</div>
							${reentryhtml}
						</div>
					</td>
					<td class="py-2 px-2 text-zinc-300">${safehtml(sessionplayerseattext(item))}</td>
					<td class="py-2 px-2 ${rankclass}">${ranktext}</td>
					<td class="py-2 px-2 text-right font-semibold">${safehtml(prize)}</td>
				</tr>
			`
		}
		if(players.length!=0&&showncount==0){
			html=html+`
				<tr>
					<td class="py-3 px-2 text-zinc-500" colspan="4">目前沒有符合條件的選手。</td>
				</tr>
			`
		}
		html=html+`
						</tbody>
					</table>
				</div>
			</div>
		`
		innerhtml("#sessionpayoutcontent",html,false)
		let search=domgetid("sessionpayoutsearch")
		if(search){
			search.addEventListener("input",function(){
				rendersessionpayout()
			})
			if(searched){
				search.focus()
			}
		}
	})
}

function selectsessiontabletab(tab){
	if(tab=="seats"&&currentsession&&!currentsession["owned"]){
		tab="list"
	}
	let btns=document.querySelectorAll(".tabletab-btn")
	let contents=document.querySelectorAll(".tabletab-content")
	for(let i=0;i<btns.length;i=i+1){
		btns[i].classList.remove("border-emerald-400","text-emerald-400")
	}
	for(let i=0;i<contents.length;i=i+1){
		contents[i].classList.add("hidden")
	}
	let btn=document.querySelector('.tabletab-btn[data-tabletab="'+tab+'"]')
	let content=domgetid("tabletab-"+tab)
	if(btn){
		btn.classList.add("border-emerald-400","text-emerald-400")
	}
	if(content){
		content.classList.remove("hidden")
	}
	if(tab=="seats"){
		rendersessionplayers()
	}
}

function rendersessionextratab(tab){
	if(currentsession&&!currentsession["owned"]&&tab=="payout"){
		return
	}
	if(tab=="payout"){
		rendersessionpayout()
	}
}

window.addEventListener("resize",function(){
	if(sessionresizetimer){
		clearTimeout(sessionresizetimer)
	}
	sessionresizetimer=setTimeout(function(){
		if(domgetid("tabletab-seats")&&!domgetid("tabletab-seats").classList.contains("hidden")){
			rendersessionplayers()
		}
	},150)
})

function loadsessiondata(silent){
	// 重爬時清空快取, 讓計時器 / 手牌等資料重新抓取
	// silent=true 為背景自動更新, 不顯示整頁 loading 遮罩, 避免每 15 秒閃一次
	sessiontimerstate=null
	sessiontimerloadinged=false
	sessionhandsloadeded=false
	sessionhands=[]
	let sessionmainoptions={}
	if(!silent){
		sessionmainoptions["loadingtarget"]="#sessionmain"
	}
	ajax("GET",AJAXURL+"getsession/"+sessionid,function(event,data){
	if(data["success"]){
		let row=data["data"]
		currentsession=row
		if(domgetid("sessionbroadcast")&&row["broadcastopen"]&&row["unifiedhandrecord"]&&row["owned"]&&row["linkuser"]&&!row["private"]){domgetid("sessionbroadcast").href="broadcast.html?sessionid="+encodeURIComponent(sessionid);domgetid("sessionbroadcast").classList.remove("hidden")}
		if(domgetid("sessionbroadcastcontrol")&&row["broadcasth4h"]&&(row["isown"]||row["accessrole"]=="floor"||row["accessrole"]=="assistant"||row["accessrole"]=="dealer")){domgetid("sessionbroadcastcontrol").href="broadcastcontrol.html?sessionid="+encodeURIComponent(sessionid);domgetid("sessionbroadcastcontrol").classList.remove("hidden")}
		updatesessiontabs()
		// 與列表頁 sessionlist.js 的 getwinprice 演算一致: 扣買入 + 重入 + 重買 + 增購成本
		let buyintotal=(row["buyin"]||0)+(row["buyinfee"]||0)
		let reentrytotal=(row["reentrybuyin"]||0)+(row["reentryfee"]||0)
		let rebuytotal=(row["rebuybuyin"]||0)+(row["rebuyfee"]||0)
		let addontotal=(row["addonbuyin"]||0)+(row["addonfee"]||0)
		let winprice=row["winprice"]-(buyintotal+reentrytotal*row["reentrycount"]+rebuytotal*row["rebuycount"]+addontotal*row["addoncount"])
		let profittext="+"+winprice
		let profitclass="text-green-400"
		if(winprice<0){
			profittext=winprice
			profitclass="text-red-400"
		}
		if(row["owned"]==true&&row["isown"]==true){
			profittext="-"
			profitclass="text-zinc-400"
		}else if(row["owned"]==true&&row["linkuser"]==true&&(row["myregistrationstatus"]=="confirmed"||row["myregistrationstatus"]=="advanced")&&row["myregistration"]){
			// 主辦場次(自己以選手身分關聯): session 表 reentrycount/rebuycount/addoncount 是上限設定值, 比照 sessionlist.js getprofitdata 改用 myregistration.profit; 新公式只留給個人記錄場次
			let profit=row["myregistration"]["profit"]||0
			profittext=(0<=profit?"+":"")+profit
			profitclass=0<=profit?"text-green-400":"text-red-400"
		}
		tablelinked=row["tablelinked"]

		innertext("#sessiontoken",row["token"],false)
		innertext("#sessionid",sessionid,false)
		rendersessiondate(row)
		if(row["linkuser"]==true){
			loadsessiontimerdata(function(){
				rendersessiondate(row)
			})
		}
		updatesessionname()
		rendersessionrolesummary(row)
		rendersessionfocus(row)
		rendersessionnextsteps(row)
		rendersessionquicklinks(row)
		let placetext=getsessiondetailplacetext(row)
		let remaininghtml=""
		let showremaining=false
		let relationkeys=["incoming","outgoing"]
		for(let i=0;i<relationkeys.length;i=i+1){
			let rows=((row["relationdata"]||{})[relationkeys[i]])||[]
			for(let j=0;j<rows.length;j=j+1){
				if(rows[j]["relationtype"]=="multiday"){
					showremaining=true
				}
			}
		}
		// if(showremaining){
		// 	remaininghtml=sessioninfocard("Players Remaining",row["multidayremaining"]||0,"text-center")
		// }
		innerhtml("#info",`
			${sessioninfocard("地點",row["clubname"]||"-","text-center")}
			${sessioninfocard("遊戲類型",TRANSLATE[LANGUAGE]["gametype"][row["gametype"]]||"-","text-center")}
			${sessioninfocard("盈虧",profittext,profitclass+" text-center")}
			${sessioninfocard("名次",placetext+(row["multidayremaining"]?" ("+row["multidayremaining"]+")":""),"text-center")}
		`,false)
		rendersessiondetailinfo(row)
		innertext("#description",sessiondisplayvalue(row["description"]),false)

		// 報名 / 主辦操作區
		renderactionarea(row)
		applydefaultsessionview(row)
		loadsettingdata()
		if(domgetid("othertab-relations")&&!domgetid("othertab-relations").classList.contains("hidden")){
			renderrelationpage(relationtype)
		}
		if(row["owned"]&&domgetid("tabletab-seats")&&!domgetid("tabletab-seats").classList.contains("hidden")){
			rendersessionplayers()
		}
		if(row["owned"]&&!domgetid("tab-payout").classList.contains("hidden")){
			rendersessionpayout()
		}
		if(domgetid("tab-hands")&&!domgetid("tab-hands").classList.contains("hidden")){
			loadsessionhands()
		}
		loaduserchipcolors()

		initsessiontabletools()
		let tablemainoptions={}
		if(!silent){
			tablemainoptions["loadingtarget"]="#tablemain"
		}
		ajax("GET",AJAXURL+"gettablelist/"+sessionid,function(event,data){
			if(data["success"]){
				let row=data["data"]
				sessiontables=row||[]

				if(tablelinked&&0<row.length&&canviewsessionsettings(currentsession)){
					domgetid("newtable").style.display="none"
					domgetid("deletetable").style.display="block"
				}
				rendersessiontablelist()

				let deletetablebtn=domgetid("deletetable")
				if(deletetablebtn&&!deletetablebtn.dataset.binded){
					deletetablebtn.dataset.binded="1"
					onclick("#deletetable",function(element,event){
						ptconfirm("確定刪除? 此操作無法復原!",function(){
							event.preventDefault()
							event.stopPropagation()

							element.disabled=true

							ajax("DELETE",AJAXURL+"deletetable/"+row[0]["id"],function(event,data){
								if(data["success"]){
									pttoast("刪除成功","success")
									href("")
								}else{
									pttoast("刪除失敗","error")
									element.disabled=false
								}
							},null,[
								["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
							],{
								loadingtarget: "#tablemain"
							})
						})
					})
				}
			}else{
				innerhtml("#tablemain",`查詢牌桌時遭遇錯誤`,false)
				addclass("#tablemain",["text-red-500","text-center","font-bold","my-1","text-lg"])
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		],tablemainoptions)
	}else if(!silent){
		// silent=true 為背景自動更新, 查詢失敗時本輪靜默略過, 不 toast 也不強制跳轉離開頁面
		pttoast("查無指定場次","error")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
],sessionmainoptions)
}
loadsessiondata()

// 每 15 秒向後端重新抓取場次資料; 但使用者正在「其他 > 設定」分頁編輯時不打斷他
const SESSIONAUTOREFRESHMS=15000

function sessioninsettingsview(){
	// 只有「其他」主分頁開著, 且其中的「設定」子分頁正在顯示時, 才算在編輯設定
	let othertab=domgetid("tab-other")
	let settingscontent=domgetid("othertab-settings")
	if(!othertab||!settingscontent){
		return false
	}
	if(othertab.classList.contains("hidden")){
		return false
	}
	if(settingscontent.classList.contains("hidden")){
		return false
	}
	return true
}

function sessionautorefresh(){
	if(document.hidden){
		return
	}
	if(sessioninsettingsview()){
		return
	}
	loadsessiondata(true)
}

setInterval(sessionautorefresh,SESSIONAUTOREFRESHMS)

domgetid("newtable").href="newtable.html?sessionid="+sessionid
if(domgetid("tableboardentry")){
	domgetid("tableboardentry").href="tableboard.html?id="+sessionid
}

// 報名 / 主辦操作區渲染
function renderactionarea(row,timerloaded){
	let area=domgetid("actionarea")
	let title=domgetid("actiontitle")
	let btns=domgetid("actionbuttons")
	let hint=domgetid("actionhint")
	if(!title){
		title={
			"textContent": ""
		}
	}
	if(!hint){
		hint={
			"textContent": ""
		}
	}

	area.classList.remove("hidden")
	btns.innerHTML=""
	if(title){
		title.textContent=""
	}
	if(hint){
		hint.textContent=""
	}

	if(row["owned"]==true&&row["linkuser"]==true&&timerloaded!=true&&!sessiontimerstate){
		loadsessiontimerdata(function(){
			renderactionarea(row,true)
		})
	}

	if(!row["owned"]){
		title.textContent="個人紀錄"
		let edithtml=""
		if(row["isown"]||row["isadmin"]){
			edithtml=`<a href="editsession.html?id=${sessionid}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold">編輯</a>`
		}
		btns.innerHTML=`
			${edithtml}
			${getstructurebuttonhtml(row)}
		`
		hint.textContent="可快速修改重購次數、名次、總買入等個人場次結果。"
		return
	}

	if(row["isown"]||row["isadmin"]){
		// 主辦人視角
		title.textContent="主辦操作"
		let buttonshtml=`
			<a href="control.html?sessionid=${sessionid}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold">🎛️ 計時器控制台</a>
			<a href="display.html?sessionid=${sessionid}" target="_blank" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold">📺 顯示頁 (新分頁)</a>
			${getstructurebuttonhtml(row)}
		`
		if(row["linkuser"]){
			buttonshtml=buttonshtml+`
				<a href="register.html?sessionid=${sessionid}" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-semibold">👥 報名清單</a>
			`
			hint.textContent="本場次已開放關聯使用者報名"
		}else{
			hint.textContent="本場次未開放關聯使用者報名"
		}
		btns.innerHTML=buttonshtml
		return
	}

	// 非主辦人, 看是不是開放報名
	if(row["accessrole"]=="floor"||row["accessrole"]=="assistant"){
		title.textContent="Staff Actions"
		btns.innerHTML=`
			${sessionstatushtml(row)}
			<a href="control.html?sessionid=${sessionid}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold">Timer Control</a>
			<a href="display.html?sessionid=${sessionid}" target="_blank" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold">Display</a>
			${getstructurebuttonhtml(row)}
		`
		hint.textContent="You can control this session timer."
		return
	}

	if(!row["linkuser"]){
		area.classList.add("hidden")
		return
	}

	let displaylink=`
		<a href="display.html?sessionid=${sessionid}" target="_blank" class="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-sm font-semibold">顯示計時器</a>
	`

	if(row["isstaff"]==true){
		title.textContent="已聘用"
		btns.innerHTML=`
			${sessionstatushtml(row)}
			${displaylink}
			${getstructurebuttonhtml(row)}
		`
		hint.textContent="已聘用員工不能報名此場次。"
		return
	}

	title.textContent="報名"
	let mystatus=row["myregistrationstatus"]
	let status=sessionstatusdata(row)
	let reentryed=false
	if(mystatus=="confirmed"&&row["myregistration"]&&row["myregistration"]["timerstatus"]=="eliminated"&&(int(row["reentrycount"]||0)<=0||int(row["myregistration"]["reentrycount"]||0)<int(row["reentrycount"]||0))){
		reentryed=true
	}

	if(mystatus=="registered"){
		btns.innerHTML=`
			${sessionstatushtml(row)}
			${displaylink}
			<span class="text-yellow-400 font-semibold">⏳ 已報名, 等待主辦確認</span>
			<input type="button" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold" id="unregisterbtn" value="取消報名">
		`
	}else if(mystatus=="confirmed"){
		btns.innerHTML=`
			${sessionstatushtml(row)}
			${displaylink}
			<span class="text-green-400 font-semibold">✅ 已確認入場</span>
			<input type="button" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold" id="unregisterbtn" value="取消報名">
		`
		if(reentryed&&status["key"]=="latereg"){
			btns.innerHTML=`
				${sessionstatushtml(row)}
				${displaylink}
				<span class="text-zinc-400 font-semibold">已淘汰</span>
				<input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold" id="registerbtn" value="重新報名 / 再入">
			`
		}
	}else if(status["key"]!="latereg"){
		btns.innerHTML=`
			${sessionstatushtml(row)}
			${displaylink}
		`
		hint.textContent="目前未開放報名。"
	}else{
		btns.innerHTML=`
			${sessionstatushtml(row)}
			${displaylink}
			<input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold" id="registerbtn" value="報名此場次">
		`
	}

	onclick("#registerbtn",function(element,event){
		element.disabled=true
		ajax("POST",AJAXURL+"registersession/"+sessionid,function(event,data){
			if(data["success"]){
				pttoast("報名成功，等待主辦確認","success")
				location.reload()
			}else{
				let msg=data["data"]
				if(msg=="ERROR_already_registered"){
					msg="您已經報名過了"
				}else if(msg=="ERROR_cannot_register_own_session"){
					msg="不能報名自己主辦的場次"
				}else if(msg=="ERROR_staff_cannot_register"){
					msg="已聘用員工不能報名此場次"
				}else if(msg=="ERROR_session_ended"){
					msg="此場次已結束"
				}else if(msg=="ERROR_session_not_open_for_registration"){
					msg="此場次未開放報名"
				}
				pttoast(msg||"未知錯誤","error")
				element.disabled=false
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	})

	onclick("#unregisterbtn",function(element,event){
		ptconfirm("確定要取消報名嗎?",function(){
			element.disabled=true
			ajax("POST",AJAXURL+"unregistersession/"+sessionid,function(event,data){
				if(data["success"]){
					pttoast("已取消報名","success")
					location.reload()
				}else{
					pttoast(pterror(data["data"]||"未知錯誤"),"error")
					element.disabled=false
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	})
}

function settingauthheaders(){
	return [
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	]
}

function optionhtml(rows,selected,labelkey){
	let html=""
	for(let i=0;i<rows.length;i=i+1){
		let text=rows[i]["name"]||rows[i]["code"]||rows[i]["id"]
		if(labelkey&&TRANSLATE[LANGUAGE]["type"]&&TRANSLATE[LANGUAGE]["type"][labelkey]&&TRANSLATE[LANGUAGE]["type"][labelkey][rows[i]["code"]]){
			text=TRANSLATE[LANGUAGE]["type"][labelkey][rows[i]["code"]]
		}
		html=html+`<option value="${safehtml(rows[i]["id"])}" ${String(selected)==String(rows[i]["id"])?"selected":""}>${safehtml(text)}</option>`
	}
	return html
}

function loadsettingdata(){
	if(!canviewsessionsettings(currentsession)){
		ajax("GET",AJAXURL+"gettypelist",function(event,data){
			if(data["success"]){
				settingtypes=data["data"]
				rendersessiondetailinfo(currentsession)
			}
		},null,settingauthheaders(),{
			loadingtarget: "#sessionmain"
		})
		return
	}
	ajax("GET",AJAXURL+"getclublist",function(event,data){
		if(data["success"]){
			settingclubs=data["data"]||[]
			rendersettings(getactivesettingtab())
		}
	},null,settingauthheaders(),{
		loadingtarget: "#sessionmain"
	})
	ajax("GET",AJAXURL+"gettypelist",function(event,data){
		if(data["success"]){
			settingtypes=data["data"]
			rendersessiondetailinfo(currentsession)
			rendersettings(getactivesettingtab())
		}
	},null,settingauthheaders(),{
		loadingtarget: "#sessionmain"
	})
	ajax("GET",AJAXURL+"getsessionlist?limit=200",function(event,data){
		if(data["success"]){
			let payload=data["data"]
			settingsessionlist=payload["sessions"]||payload||[]
			let active=document.querySelector(".settings-side-btn.bg-emerald-600")
			if(active&&active.dataset.setting=="relation"){
				rendersettings("relation")
			}
		}
	},null,settingauthheaders(),{
		loadingtarget: "#sessionmain"
	})
}

function getactivesettingtab(){
	let saved=weblsget(settingtabkey,false)
	if(saved=="game"||saved=="result"||saved=="delete"){
		return saved
	}
	let active=document.querySelector(".settings-side-btn.bg-emerald-600")
	if(active&&active.dataset.setting){
		return active.dataset.setting
	}
	return "general"
}

function loaduserchipcolors(){
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(data["success"]){
			userchipcolors=data["data"]["chipcolors"]||userchipcolors
			userchipsets=data["data"]["chipset"]||[]
			if(getactivesettingtab()=="game"){
				rendersettings("game")
			}
		}
	},null,settingauthheaders())
}

function settingdate(value){
	if(!value){
		return ""
	}
	return value.split("T")[0]
}

function settingtime(value){
	if(!value||value.indexOf("T")==-1){
		return ""
	}
	return value.split("T")[1].split("Z")[0].split("+")[0]
}

function chipcoloroptions(selected){
	let html=""
	for(let i=0;i<userchipcolors.length;i=i+1){
		let color=userchipcolors[i]["color"]
		let name=userchipcolors[i]["name"]||color
		html=html+`<option value="${safehtml(color)}" ${String(selected).toLowerCase()==String(color).toLowerCase()?"selected":""}>${safehtml(name)}</option>`
	}
	return html
}

function chiprowhtml(chip){
	chip=chip||{
		"shape": "circle",
		"value": 100,
		"color": "#ffffff"
	}
	return `
		<div class="grid grid-cols-[90px_1fr_120px_40px] gap-2 chiprow">
			<select class="setchipshape bg-zinc-700 text-white rounded px-2 py-2">
				<option value="circle" ${chip["shape"]!="square"?"selected":""}>圓形</option>
				<option value="square" ${chip["shape"]=="square"?"selected":""}>方形</option>
			</select>
			<input type="number" class="setchipvalue bg-zinc-700 text-white rounded px-2 py-2" inputmode="numeric" value="${chip["value"]||0}">
			<select class="setchipcolor bg-zinc-700 text-white rounded px-2 py-2">${chipcoloroptions(chip["color"]||"#ffffff")}</select>
			<input type="button" class="removechiprow bg-red-600 hover:bg-red-700 rounded" value="×">
		</div>
	`
}

function chipsetsbuttonhtml(){
	if(!userchipsets||userchipsets.length==0){
		return `<span class="text-xs text-zinc-500">可到個人資料設定常用計分牌組合</span>`
	}
	let html=""
	for(let i=0;i<userchipsets.length;i=i+1){
		html=html+`
			<input type="button" class="importchipset bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded text-sm" data-chipset="${i}" value="匯入 ${safehtml(userchipsets[i]["name"]||("組合 "+(i+1)))}">
		`
	}
	return html
}

function rendersettings(tab){
	if(!currentsession||!domgetid("settingscontent")){
		return
	}
	weblsset(settingtabkey,tab)
	let sidebuttons=document.querySelectorAll(".settings-side-btn")
	for(let i=0;i<sidebuttons.length;i=i+1){
		sidebuttons[i].classList.remove("bg-emerald-600","text-white")
		sidebuttons[i].classList.add("text-zinc-300")
		if(sidebuttons[i].dataset.setting==tab){
			sidebuttons[i].classList.add("bg-emerald-600","text-white")
			sidebuttons[i].classList.remove("text-zinc-300")
		}
	}
	if(tab=="general"){
		rendersettinggeneral()
	}else if(tab=="game"){
		rendersettinggame()
	}else if(tab=="result"){
		rendersettingresult()
	}else{
		rendersettingdelete()
	}
}

function rendersettinggeneral(){
	let clubhtml=optionhtml(settingclubs,currentsession["clubid"],"")
	let gametypehtml=optionhtml(settingtypes["game"]||[],currentsession["gametypeid"],"game")
	let limithtml=optionhtml(settingtypes["limit"]||[],currentsession["limittypeid"],"limit")
	let stackhtml=optionhtml(settingtypes["stack"]||[],currentsession["stacktypeid"],"stack")
	let eventhtml=optionhtml(settingtypes["event"]||[],currentsession["eventtypeid"],"event")
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4">一般</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<label class="block text-sm text-zinc-300">名稱<input id="setname" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${safehtml(currentsession["name"]||"")}"></label>
			<label class="block text-sm text-zinc-300">地點<select id="setclubid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${clubhtml}</select></label>
			<label class="block text-sm text-zinc-300">開始日期<input type="date" id="setdate" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${settingdate(currentsession["starttime"])}"></label>
			<div class="grid grid-cols-2 gap-2">
				<label class="block text-sm text-zinc-300">開始時間<input type="time" step="1" id="setstarttime" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${settingtime(currentsession["starttime"])}"></label>
				<label class="block text-sm text-zinc-300">結束時間<input type="time" step="1" id="setendtime" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${settingtime(currentsession["endtime"])}"></label>
			</div>
			<label class="block text-sm text-zinc-300">遊戲類型<select id="setgametypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${gametypehtml}</select></label>
			<label class="block text-sm text-zinc-300">限注類型<select id="setlimittypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${limithtml}</select></label>
			<label class="block text-sm text-zinc-300">計分牌類型<select id="setstacktypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${stackhtml}</select></label>
			<label class="block text-sm text-zinc-300">賽事細項<select id="seteventtypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${eventhtml}</select></label>
			<label class="block text-sm text-zinc-300">起始計分牌<input type="number" id="setchip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["chip"]||0}"></label>
			<label class="block text-sm text-zinc-300">每桌座位數<input type="number" min="2" max="10" inputmode="numeric" id="setmaxseat" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["maxseat"]||9}"></label>
			<div class="grid grid-cols-2 gap-2 items-end">
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setowned" ${currentsession["owned"]?"checked":""}>主辦牌局</label>
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setlinkuser" ${currentsession["linkuser"]?"checked":""}>使用者連結</label>
			</div>
			<div class="grid grid-cols-2 gap-2 items-end">
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setopenregistration" ${currentsession["openregistration"]?"checked":""}>開放報名</label>
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setautostartbytime" ${currentsession["autostartbytime"]?"checked":""}>依照時間自動開始</label>
			</div>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2 md:col-span-2"><input type="checkbox" id="setprivate" ${currentsession["private"]?"checked":""}>私人牌局</label>
			<label class="block text-sm text-zinc-300 md:col-span-2">備註<textarea id="setdescription" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2 resize-none" rows="3">${safehtml(currentsession["description"]||"")}</textarea></label>
		</div>
		<div class="text-right mt-4"><input type="button" id="savesettinggeneral" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" value="儲存一般設定"></div>
	`,false)
	onclick("#savesettinggeneral",function(element,event){
		savesettings(element,{
			"name": getvalue("setname"),
			"clubid": getvalue("setclubid"),
			"starttime": getvalue("setdate")+" "+getvalue("setstarttime")+"+00:00",
			"endtime": getvalue("setdate")+" "+getvalue("setendtime")+"+00:00",
			"gametypeid": getvalue("setgametypeid"),
			"limittypeid": getvalue("setlimittypeid"),
			"stacktypeid": getvalue("setstacktypeid"),
			"eventtypeid": getvalue("seteventtypeid"),
			"chip": float(getvalue("setchip")||0),
			"maxseat": int(getvalue("setmaxseat")||9),
			"owned": domgetid("setowned").checked,
			"linkuser": domgetid("setlinkuser").checked,
			"openregistration": domgetid("setopenregistration").checked,
			"private": domgetid("setprivate").checked,
			"autostartbytime": domgetid("setautostartbytime").checked,
			"description": getvalue("setdescription")
		})
	})
}

function rendersettinggame(){
	let chiprows=currentsession["chips"]||[]
	let chiphtml=""
	for(let i=0;i<chiprows.length;i=i+1){
		chiphtml=chiphtml+chiprowhtml(chiprows[i])
	}
	let rebuycountlabel=currentsession["owned"]?"重買次數上限":"重買次數"
	let reentrycountlabel=currentsession["owned"]?"再入次數上限":"再入次數"
	let addoncountlabel=currentsession["owned"]?"增購次數上限":"增購次數"
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4">牌局設定</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<label class="block text-sm text-zinc-300">買入費<input type="number" id="setbuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["buyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">買入服務費<input type="number" id="setbuyinfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["buyinfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">買入計分牌<input type="number" id="setchip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["chip"]||0}"></label>
			<label class="block text-sm text-zinc-300">重買費<input type="number" id="setrebuybuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["rebuybuyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">重買服務費<input type="number" id="setrebuyfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["rebuyfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">重買計分牌<input type="number" id="setrebuychip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["rebuychip"]||0}"></label>
			<label class="block text-sm text-zinc-300">再入費<input type="number" id="setreentrybuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["reentrybuyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">再入服務費<input type="number" id="setreentryfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["reentryfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">再入計分牌<input type="number" id="setreentrychip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["reentrychip"]||0}"></label>
			<label class="block text-sm text-zinc-300">增購費<input type="number" id="setaddonbuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["addonbuyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">增購服務費<input type="number" id="setaddonfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["addonfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">增購計分牌<input type="number" id="setaddonchip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["addonchip"]||0}"></label>
			<label class="block text-sm text-zinc-300">${rebuycountlabel}<input type="number" id="setrebuycount" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["rebuycount"]||0}"></label>
			<label class="block text-sm text-zinc-300">${reentrycountlabel}<input type="number" id="setreentrycount" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["reentrycount"]||0}"></label>
			<label class="block text-sm text-zinc-300">${addoncountlabel}<input type="number" id="setaddoncount" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["addoncount"]||0}"></label>
			<label class="block text-sm text-zinc-300">票券價值<input type="number" id="setticketvalue" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["ticketvalue"]||0}"></label>
			<label class="block text-sm text-zinc-300">保底獎金<input type="number" id="setguaranteedprize" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["guaranteedprize"]||0}"></label>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="radio" name="setantemode" value="bigblindante" ${currentsession["antemode"]!="ante"?"checked":""}>大盲前注</label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="radio" name="setantemode" value="ante" ${currentsession["antemode"]=="ante"?"checked":""}>前注</label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setunifiedhandrecord" ${currentsession["unifiedhandrecord"]?"checked":""}>統一紀錄手牌</label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setticketenabled" ${currentsession["ticketenabled"]?"checked":""}>允許票券買入</label>
		</div>
		<div id="broadcastsettings" class="mt-4 rounded border border-zinc-700 bg-zinc-800/40 p-3 ${currentsession["unifiedhandrecord"]?"":"hidden"}">
			<div class="font-semibold text-zinc-200 mb-2">現場轉播</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setbroadcastopen" ${currentsession["broadcastopen"]?"checked":""}>開放場外轉播</label>
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setbroadcastshowcard" ${currentsession["broadcastshowcard"]!=false?"checked":""}>顯示底牌</label>
				<label class="block text-sm text-zinc-300">延遲播出（分鐘）<input type="number" min="0" inputmode="numeric" id="setbroadcastdelay" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["broadcastdelay"]||0}"></label>
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setbroadcasth4h" ${currentsession["broadcasth4h"]?"checked":""}>H4H 手動推進</label>
			</div>
			<div class="mt-2 text-xs text-zinc-500">僅「統一手牌紀錄 + 公開場次」可轉播；開放後手牌分頁會出現「現場轉播」按鈕，供場外唯讀觀看。</div>
		</div>
		<div class="mt-6">
			<div class="flex flex-wrap justify-between items-center gap-2 mb-2">
				<div class="font-semibold text-zinc-200">使用計分牌面額</div>
				<div class="flex flex-wrap gap-2 items-center">
					${chipsetsbuttonhtml()}
					<input type="button" id="addchiprow" class="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm" value="新增計分牌">
				</div>
			</div>
			<div id="chiprows" class="space-y-2">${chiphtml}</div>
		</div>
		<div class="text-right mt-4"><input type="button" id="savesettinggame" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" value="儲存牌局設定"></div>
	`,false)
	onclick("#addchiprow",function(element,event){
		domgetid("chiprows").insertAdjacentHTML("beforeend",chiprowhtml())
		bindchipremove()
	})
	onclick(".importchipset",function(element,event){
		let index=int(dataset(element,"chipset"))
		let set=userchipsets[index]
		if(!set){
			return
		}
		let chips=set["chips"]||[]
		let html=""
		for(let i=0;i<chips.length;i=i+1){
			html=html+chiprowhtml(chips[i])
		}
		innerhtml("#chiprows",html,false)
		bindchipremove()
		pttoast("已匯入 "+(set["name"]||"計分牌組合"),"success")
	})
	bindchipremove()
	// 非統一手牌紀錄不能轉播: 依「統一紀錄手牌」勾選狀態即時顯示/隱藏現場轉播設定
	let unifiedchk=domgetid("setunifiedhandrecord")
	if(unifiedchk){
		unifiedchk.addEventListener("change",function(){
			let box=domgetid("broadcastsettings")
			if(box){
				if(this.checked){
					box.classList.remove("hidden")
				}else{
					box.classList.add("hidden")
				}
			}
		})
	}
	onclick("#savesettinggame",function(element,event){
		let antemode=document.querySelector("input[name='setantemode']:checked").value
		savesettings(element,{
			"buyin": float(getvalue("setbuyin")||0),
			"buyinfee": float(getvalue("setbuyinfee")||0),
			"chip": float(getvalue("setchip")||0),
			"rebuycount": float(getvalue("setrebuycount")||0),
			"rebuybuyin": float(getvalue("setrebuybuyin")||0),
			"rebuyfee": float(getvalue("setrebuyfee")||0),
			"rebuychip": float(getvalue("setrebuychip")||0),
			"reentrycount": float(getvalue("setreentrycount")||0),
			"reentrybuyin": float(getvalue("setreentrybuyin")||0),
			"reentryfee": float(getvalue("setreentryfee")||0),
			"reentrychip": float(getvalue("setreentrychip")||0),
			"addoncount": float(getvalue("setaddoncount")||0),
			"addonbuyin": float(getvalue("setaddonbuyin")||0),
			"addonfee": float(getvalue("setaddonfee")||0),
			"addonchip": float(getvalue("setaddonchip")||0),
			"guaranteedprize": float(getvalue("setguaranteedprize")||0),
			"ticketenabled": domgetid("setticketenabled").checked,
			"ticketvalue": float(getvalue("setticketvalue")||0),
			"antemode": antemode,
			"unifiedhandrecord": domgetid("setunifiedhandrecord").checked,
			"broadcastopen": domgetid("setbroadcastopen").checked,
			"broadcastshowcard": domgetid("setbroadcastshowcard").checked,
			"broadcastdelay": float(getvalue("setbroadcastdelay")||0),
			"broadcasth4h": domgetid("setbroadcasth4h").checked,
			"chips": getsettingchips()
		})
	})
}

function bindchipremove(){
	onclick(".removechiprow",function(element,event){
		element.parentElement.remove()
	})
}

function getsettingchips(){
	let rows=document.querySelectorAll(".chiprow")
	let chips=[]
	for(let i=0;i<rows.length;i=i+1){
		chips.push({
			"shape": rows[i].querySelector(".setchipshape").value,
			"value": int(rows[i].querySelector(".setchipvalue").value)||0,
			"color": rows[i].querySelector(".setchipcolor").value
		})
	}
	return chips
}

function sessionresulttext(key,fallbacktext){
	if(typeof TRANSLATE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["sessionresult"]&&TRANSLATE[LANGUAGE]["sessionresult"][key]!=undefined){
		return TRANSLATE[LANGUAGE]["sessionresult"][key]
	}
	return fallbacktext
}

function settingresultnumber(id){
	// int() 就是 parseInt, 空字串或 "-" 會得到 NaN; 統一收斂成 0 避免送出 null 讓後端 required 驗證失敗
	let value=int(getvalue(id))
	if(Number.isNaN(value)){
		return 0
	}
	return value
}

function validatesettingresult(){
	// 比照 editsession.js validateresult: 後端 winprice 是 integer|min:0, place 以字串存但同樣不接受負數
	let winpriceelement=domgetid("setwinprice")
	let placeelement=domgetid("setplace")
	if(!winpriceelement||!placeelement){
		return false
	}
	if(settingresultnumber("setwinprice")<0){
		let message=sessionresulttext("winpricenegative","獲獎金額不得為負數")
		ptsetfieldmessage(winpriceelement,message)
		pttoast(message,"error")
		winpriceelement.focus()
		return false
	}
	ptsetfieldmessage(winpriceelement,"")
	if(settingresultnumber("setplace")<0){
		let message=sessionresulttext("placenegative","名次不得為負數")
		ptsetfieldmessage(placeelement,message)
		pttoast(message,"error")
		placeelement.focus()
		return false
	}
	ptsetfieldmessage(placeelement,"")
	return true
}

function rendersettingresult(){
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4">${safehtml(sessionresulttext("title","我的成績"))}</div>
		<div class="text-xs text-zinc-500 mb-4">${safehtml(sessionresulttext("description","登錄自己在本場次的獎金、獎品與名次，會同步反映在總覽的盈虧統計。"))}</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<label class="block text-sm text-zinc-300">${safehtml(sessionresulttext("winprice","獲獎金額"))}<input type="number" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" id="setwinprice" min="0" inputmode="numeric" value="${safehtml(currentsession["winprice"]||0)}"></label>
			<label class="block text-sm text-zinc-300">${safehtml(sessionresulttext("place","名次"))}<input type="number" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" id="setplace" min="0" inputmode="numeric" value="${safehtml(currentsession["place"]||0)}"></label>
			<label class="block text-sm text-zinc-300 md:col-span-2">${safehtml(sessionresulttext("winthing","獲獎獎品"))}<input type="text" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" id="setwinthing" placeholder="${safehtml(sessionresulttext("winthingplaceholder","如無獎品可填 N/A"))}" value="${safehtml(currentsession["winthing"]||"N/A")}"></label>
		</div>
		<div class="text-right mt-4"><input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" id="savesettingresult" value="${safehtml(sessionresulttext("save","儲存我的成績"))}"></div>
	`,false)
	let checklist=["setwinprice","setplace"]
	for(let i=0;i<checklist.length;i=i+1){
		let element=domgetid(checklist[i])
		if(element){
			element.addEventListener("input",function(){
				validatesettingresult()
			})
			element.addEventListener("change",function(){
				validatesettingresult()
			})
		}
	}
	onclick("#savesettingresult",function(element,event){
		if(!validatesettingresult()){
			return
		}
		// editsessionresult 是整列覆寫: reentrycount / totalbuyin / inmoney / inft 沒送會被寫成 0 或 false,
		// 所以未編輯的欄位一律帶回 currentsession 目前值, 型別比照 editsession.js 與後端 validate schema
		let reentrycount=int(currentsession["reentrycount"]||0)
		if(Number.isNaN(reentrycount)){
			reentrycount=0
		}
		let payload={
			"reentrycount": reentrycount,
			"winprice": settingresultnumber("setwinprice"),
			"winthing": (getvalue("setwinthing")||"").trim()||"N/A",
			"inmoney": currentsession["inmoney"]==true,
			"inft": currentsession["inft"]==true,
			"place": String(settingresultnumber("setplace")),
			"totalbuyin": String(currentsession["totalbuyin"]||0)
		}
		element.disabled=true
		ajax("PUT",AJAXURL+"editsessionresult/"+sessionid,function(event,data){
			element.disabled=false
			if(data["success"]){
				currentsession["winprice"]=payload["winprice"]
				currentsession["winthing"]=payload["winthing"]
				currentsession["place"]=payload["place"]
				pttoast(sessionresulttext("savesuccess","儲存成功"),"success")
				loadsessiondata()
			}else{
				pttoast(pterror(data["data"]||sessionresulttext("savefail","儲存失敗")),"error")
			}
		},str(payload),settingauthheaders())
	})
}

function relationoptions(type){
	let selected={}
	let rows=currentsession["relations"]||[]
	for(let i=0;i<rows.length;i=i+1){
		if(rows[i]["relationtype"]==type){
			selected[rows[i]["targetid"]]=true
		}
	}
	let html=""
	for(let i=0;i<settingsessionlist.length;i=i+1){
		let item=settingsessionlist[i]
		if(String(item["id"])==String(sessionid)){
			continue
		}
		html=html+`<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" class="relationcheck" data-type="${safehtml(type)}" value="${safehtml(item["id"])}" ${selected[item["id"]]?"checked":""}>${safehtml(item["name"])} #${safehtml(item["token"])}</label>`
	}
	if(!html){
		html=`<div class="text-zinc-500">沒有可關聯的賽事</div>`
	}
	return html
}

function rendersettingrelation(){
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4">賽事關聯</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<div class="font-semibold text-zinc-200 mb-2">衛星賽關聯</div>
				<div class="space-y-2 max-h-64 overflow-auto">${relationoptions("satellite")}</div>
				<input type="button" class="mt-3 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded" id="savesatellite" value="儲存衛星賽關聯">
			</div>
			<div>
				<div class="font-semibold text-zinc-200 mb-2">多日賽關聯</div>
				<div class="space-y-2 max-h-64 overflow-auto">${relationoptions("multiday")}</div>
				<input type="button" class="mt-3 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded" id="savemultiday" value="儲存多日賽關聯">
			</div>
		</div>
	`,false)
	onclick("#savesatellite",function(element,event){
		saverelations(element,"satellite")
	})
	onclick("#savemultiday",function(element,event){
		saverelations(element,"multiday")
	})
}

function rendersettingdelete(){
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4 text-red-300">刪除賽事</div>
		<div class="text-zinc-300 mb-4">刪除後此賽事不會再出現在列表中。</div>
		<input type="button" id="deletesessionfromsettings" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded" value="刪除賽事">
	`,false)
	onclick("#deletesessionfromsettings",function(element,event){
		ptconfirm("確定刪除此賽事?",function(ok){
			if(!ok){
				return
			}
			element.disabled=true
			ajax("DELETE",AJAXURL+"deletesession/"+sessionid,function(event,data){
				if(data["success"]){
					pttoast("刪除成功")
					href("sessionlist.html")
				}else{
					pttoast(data["data"]||"刪除失敗","error")
					element.disabled=false
				}
			},null,settingauthheaders())
		})
	})
}

function savesettings(element,payload){
	element.disabled=true
	ajax("PUT",AJAXURL+"editsessionsettings/"+sessionid,function(event,data){
		element.disabled=false
		if(data["success"]){
			for(let key in payload){
				currentsession[key]=payload[key]
			}
			if(data["data"]){
				for(let key in data["data"]){
					currentsession[key]=data["data"][key]
				}
			}
			updatesessionname()
			pttoast("儲存成功")
			loadsessiondata()
		}else{
			pttoast(data["data"]||"儲存失敗","error")
		}
	},str(payload),settingauthheaders())
}

function saverelations(element,type){
	let checks=document.querySelectorAll(`.relationcheck[data-type="${type}"]:checked`)
	let ids=[]
	for(let i=0;i<checks.length;i=i+1){
		ids.push(int(checks[i].value))
	}
	element.disabled=true
	ajax("PUT",AJAXURL+"editsessionrelations/"+sessionid,function(event,data){
		element.disabled=false
		if(data["success"]){
			currentsession["relationdata"]=data["data"]
			currentsession["relations"]=data["data"]["outgoing"]||[]
			pttoast("儲存成功","success")
			rendersettingrelation()
		}else{
			pttoast(pterror(data["data"]||"儲存失敗"),"error")
		}
	},str({
		"relationtype": type,
		"targetids": ids
	}),settingauthheaders())
}

function renderrelationpage(type){
	relationtype=type||relationtype
	if(!currentsession){
		innerhtml("#relationscontent",`
			<div class="text-zinc-400 text-sm">賽事資料載入中...</div>
		`,false)
		return
	}
	let editabled=canviewsessionsettings(currentsession)
	let data=currentsession["relationdata"]||{
		"outgoing": currentsession["relations"]||[],
		"incoming": []
	}
	innerhtml("#relationscontent",`
		<div class="flex flex-wrap gap-2 mb-4">
			<input type="button" class="relationtypebtn ${relationtype=="satellite"?"bg-emerald-600":"bg-zinc-700"} px-4 py-2 rounded" data-type="satellite" value="衛星賽">
			<input type="button" class="relationtypebtn ${relationtype=="multiday"?"bg-emerald-600":"bg-zinc-700"} px-4 py-2 rounded" data-type="multiday" value="多日賽">
		</div>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			${relationpanel("outgoing",data,relationtype,editabled)}
			${relationpanel("incoming",data,relationtype,editabled)}
		</div>
	`,false)
	onclick(".relationtypebtn",function(element,event){
		renderrelationpage(dataset(element,"type"))
	})
	if(editabled){
		bindrelationpanel("outgoing",relationtype)
		bindrelationpanel("incoming",relationtype)
		loadrelationsearch("outgoing",relationtype)
		loadrelationsearch("incoming",relationtype)
	}
}

function relationpanel(direction,data,type,editabled){
	let title=direction=="outgoing"?"本賽事通往其他賽事":"其他賽事通往本賽事"
	let desc=type=="satellite"?"衛星賽：source 可取得 target 票券":"多日賽：source 晉級 target"
	let rows=data[direction]||[]
	let selected=[]
	for(let i=0;i<rows.length;i=i+1){
		if(rows[i]["relationtype"]==type){
			let name=direction=="outgoing"?rows[i]["targetname"]:rows[i]["sourcename"]
			let token=direction=="outgoing"?rows[i]["targettoken"]:rows[i]["sourcetoken"]
			let id=direction=="outgoing"?rows[i]["targetid"]:rows[i]["sourceid"]
			let removehtml=""
			if(editabled){
				removehtml=`<input type="button" class="removerelation text-red-300" data-type="${safehtml(type)}" data-direction="${safehtml(direction)}" data-id="${safehtml(id)}" value="×">`
			}
			selected.push(`
				<span class="inline-flex items-center gap-2 bg-zinc-700 rounded px-2 py-1 text-xs">
					<a class="hover:text-emerald-300" href="session.html?id=${safehtml(id)}">${safehtml(name)} #${safehtml(token)}</a>
					${removehtml}
				</span>
			`)
		}
	}
	let searchhtml=""
	if(editabled){
		searchhtml=`
			<div class="flex gap-2 mb-2">
				<input class="relationkeyword flex-1 bg-zinc-700 rounded px-3 py-2" data-type="${type}" data-direction="${direction}" placeholder="搜尋賽事名稱 / token">
				<input type="button" class="relationsearch bg-sky-600 hover:bg-sky-700 rounded px-3" data-type="${type}" data-direction="${direction}" value="搜尋">
			</div>
			<div class="relationresult space-y-2" id="relationresult-${direction}"></div>
			<div class="relationpager flex gap-2 mt-3" id="relationpager-${direction}"></div>
		`
	}
	return `
		<div class="border border-zinc-700 rounded p-4">
			<div class="font-semibold text-zinc-100">${title}</div>
			<div class="text-xs text-zinc-500 mb-3">${desc}</div>
			<div class="flex flex-wrap gap-2 mb-3 min-h-8" id="selected-${direction}">${selected.join("")||"<span class='text-zinc-500 text-sm'>尚未建立關聯</span>"}</div>
			${searchhtml}
		</div>
	`
}

function bindrelationpanel(direction,type){
	if(!canviewsessionsettings(currentsession)){
		return
	}
	onclick(`.relationsearch[data-direction="${direction}"][data-type="${type}"]`,function(element,event){
		let thistype=dataset(element,"type")
		relationpage[thistype+direction]=1
		loadrelationsearch(direction,thistype)
	})
	onclick(`.removerelation[data-direction="${direction}"][data-type="${type}"]`,function(element,event){
		let direction=dataset(element,"direction")
		let thistype=dataset(element,"type")
		let id=dataset(element,"id")
		let ids=[]
		let rows=(currentsession["relationdata"]||{})[direction]||[]
		for(let i=0;i<rows.length;i=i+1){
			if(rows[i]["relationtype"]==thistype){
				let rowid=direction=="outgoing"?rows[i]["targetid"]:rows[i]["sourceid"]
				if(String(rowid)!=String(id)){
					ids.push(rowid)
				}
			}
		}
		saverelationdirection(direction,ids,thistype)
	})
}

function loadrelationsearch(direction,type){
	if(!canviewsessionsettings(currentsession)){
		return
	}
	type=type||relationtype
	let key=type+direction
	let page=relationpage[key]||1
	let keyword=""
	let input=document.querySelector(`.relationkeyword[data-direction="${direction}"][data-type="${type}"]`)
	if(input){
		keyword=input.value
	}
	ajax("GET",AJAXURL+"searchsessionrelations/"+sessionid+"?page="+page+"&limit=6&keyword="+encodeURIComponent(keyword),function(event,data){
		if(!data["success"]){
			pttoast(data["data"]||"搜尋失敗","error")
			return
		}
		let rows=data["data"]["sessions"]||[]
		let html=""
		for(let i=0;i<rows.length;i=i+1){
			html=html+`
				<div class="flex justify-between items-center bg-zinc-700/40 rounded px-3 py-2">
					<div><div>${safehtml(rows[i]["name"])}</div><div class="text-xs text-zinc-500">#${safehtml(rows[i]["token"])}</div></div>
					<input type="button" class="addrelation bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-sm" data-type="${safehtml(type)}" data-direction="${safehtml(direction)}" data-id="${safehtml(rows[i]["id"])}" value="加入">
				</div>
			`
		}
		innerhtml("#relationresult-"+direction,html||"<div class='text-zinc-500 text-sm'>沒有符合的賽事</div>",false)
		let pg=data["data"]["pagination"]
		innerhtml("#relationpager-"+direction,`
			<input type="button" class="relationpagebtn bg-zinc-700 px-3 py-1 rounded" data-type="${type}" data-direction="${direction}" data-page="${page-1}" ${pg["hasprev"]?"":"disabled"} value="上一頁">
			<span class="text-sm text-zinc-400 py-1">${pg["page"]}/${pg["totalpages"]}</span>
			<input type="button" class="relationpagebtn bg-zinc-700 px-3 py-1 rounded" data-type="${type}" data-direction="${direction}" data-page="${page+1}" ${pg["hasnext"]?"":"disabled"} value="下一頁">
		`,false)
		onclick(`.relationpagebtn[data-direction="${direction}"][data-type="${type}"]`,function(element,event){
			let direction=dataset(element,"direction")
			let thistype=dataset(element,"type")
			relationpage[thistype+direction]=int(dataset(element,"page"))
			loadrelationsearch(direction,thistype)
		})
		onclick(`.addrelation[data-direction="${direction}"][data-type="${type}"]`,function(element,event){
			addrelation(dataset(element,"direction"),int(dataset(element,"id")),dataset(element,"type"))
		})
	},null,settingauthheaders())
}

function addrelation(direction,id,type){
	if(!canviewsessionsettings(currentsession)){
		return
	}
	type=type||relationtype
	let ids=[]
	let rows=(currentsession["relationdata"]||{})[direction]||[]
	for(let i=0;i<rows.length;i=i+1){
		if(rows[i]["relationtype"]==type){
			ids.push(direction=="outgoing"?rows[i]["targetid"]:rows[i]["sourceid"])
		}
	}
	if(type=="multiday"&&direction=="outgoing"){
		ids=[id]
	}else if(ids.indexOf(id)==-1){
		ids.push(id)
	}
	saverelationdirection(direction,ids,type)
}

function saverelationdirection(direction,ids,type){
	if(!canviewsessionsettings(currentsession)){
		return
	}
	type=type||relationtype
	ajax("PUT",AJAXURL+"editsessionrelations/"+sessionid,function(event,data){
		if(data["success"]){
			currentsession["relationdata"]=data["data"]
			currentsession["relations"]=data["data"]["outgoing"]||[]
			pttoast("儲存成功")
			renderrelationpage(type)
		}else{
			pttoast(data["data"]||"儲存失敗","error")
		}
	},str({
		"relationtype": type,
		"direction": direction,
		"targetids": ids
	}),settingauthheaders())
}

onclick(".settings-side-btn",function(element,event){
	rendersettings(dataset(element,"setting"))
})

document.addEventListener("dblclick",function(event){
	let target=event.target
	if(!target||typeof target.closest!="function"){
		return
	}
	if(
		target.closest(".tab-btn")||
		target.closest(".overviewtab-btn")||
		target.closest(".othertab-btn")||
		target.closest(".tabletab-btn")||
		target.closest(".handtab-btn")||
		target.closest(".settings-side-btn")||
		target.closest("button")||
		target.closest("a")||
		target.closest("input[type='button']")
	){
		event.preventDefault()
	}
})

// 頁籤切換
function sessioncardparts(card){
	let text=String(card||"")
	if(text.length<2){
		return { rank: "?",suit: "",symbol: "?",reded: false }
	}
	let rank=text.substring(0,text.length-1).toUpperCase()
	let suit=text.substring(text.length-1).toLowerCase()
	let symbol="?"
	let reded=false
	if(suit=="s"){
		symbol="♠"
	}else if(suit=="h"){
		symbol="♥"
		reded=true
	}else if(suit=="d"){
		symbol="♦"
		reded=true
	}else if(suit=="c"){
		symbol="♣"
	}
	return { rank: rank,suit: suit,symbol: symbol,reded: reded }
}

function sessionrendercard(card){
	let parts=sessioncardparts(card)
	if(parts["rank"]=="?"){
		return `<span class="pt-card unknown"><span class="pt-card-rank">?</span></span>`
	}
	return `<span class="pt-card ${parts["reded"]?"red":""}" data-suit="${safehtml(parts["symbol"])}"><span class="pt-card-rank">${safehtml(parts["rank"])}</span><span class="pt-card-suit">${safehtml(parts["symbol"])}</span></span>`
}

function sessionrendercardgroup(cards,label,placeholder){
	let html=`<span class="pt-cardgroup">`
	if(label){
		html=html+`<span class="pt-cardgroup-label">${safehtml(label)}</span>`
	}
	let count=cards?cards.length:0
	for(let i=0;i<count;i=i+1){
		html=html+sessionrendercard(cards[i])
	}
	if(placeholder&&0<placeholder){
		for(let i=count;i<placeholder;i=i+1){
			html=html+`<span class="pt-card unknown"><span class="pt-card-rank">?</span></span>`
		}
	}else if(!count){
		html=html+`<span class="pt-card-note">-</span>`
	}
	html=html+`</span>`
	return html
}

function sessionhandcards(hand){
	let handcard=hand["handcard"]||{}
	let board=hand["boardcard"]||{}
	let boardcards=[]
	if(board["flop"]){
		for(let i=0;i<board["flop"].length;i=i+1){
			if(board["flop"][i]){
				boardcards.push(board["flop"][i])
			}
		}
	}
	if(board["turn"]){
		boardcards.push(board["turn"])
	}
	if(board["river"]){
		boardcards.push(board["river"])
	}
	if(!hand["selfseating"]){
		return sessionrendercardgroup(boardcards,"Board",5)
	}
	return sessionrendercardgroup([handcard["card1"],handcard["card2"]],"Hero")+sessionrendercardgroup(boardcards,"Board",5)
}

function sessionactionstackmap(hand){
	let data={}
	let rows=hand["seatingdata"]||[]
	for(let i=0;i<rows.length;i=i+1){
		data[int(rows[i]["seatno"])]=int(rows[i]["chip"]||0)
	}
	return data
}

// ante 不算進 running（街上下注額），但判斷 all-in 時要計入總投入，否則盲注＋ante＋下注剛好跟光計分牌會被漏判
function sessionanteinvestmap(hand){
	let data={}
	let rows=hand["bittingdata"]||[]
	for(let i=0;i<rows.length;i=i+1){
		if((rows[i]["action"]||"")=="ante"){
			let seat=int(rows[i]["seatno"]||rows[i]["seat"]||0)
			data[seat]=int(data[seat]||0)+int(rows[i]["chip"]||0)
		}
	}
	return data
}

function sessionactionlabel(hand,row,running){
	let seat=int(row["seatno"]||row["seat"]||0)
	let action=row["action"]||""
	if(!running[seat]){
		running[seat]=0
	}
	if(action!="ante"){
		running[seat]=running[seat]+int(row["chip"]||0)
	}
	let stacks=sessionactionstackmap(hand)
	let ante=sessionanteinvestmap(hand)
	if(action=="allin"||row["allined"]==true){
		return "Seat "+seat+" ALLIN"
	}
	if(action!="ante"&&0<int(stacks[seat]||0)&&running[seat]+int(ante[seat]||0)>=int(stacks[seat]||0)){
		return "Seat "+seat+" ALLIN"
	}
	let map={ ante: "Ante",blind: "盲注",check: "Check",call: "Call",bet: "Bet",raise: "Raise",fold: "Fold" }
	return "Seat "+seat+" "+(map[action]||action||"-")
}

function sessionactionsummary(hand){
	let rows=hand["bittingdata"]||[]
	let running={}
	let texts=[]
	for(let i=0;i<rows.length;i=i+1){
		if(texts.length<4){
			texts.push(sessionactionlabel(hand,rows[i],running))
		}else{
			sessionactionlabel(hand,rows[i],running)
		}
	}
	if(4<rows.length){
		texts.push("...")
	}
	return texts.join(" / ")||"-"
}

function sessionhasallin(hand){
	let rows=hand["bittingdata"]||[]
	let running={}
	for(let i=0;i<rows.length;i=i+1){
		if(sessionactionlabel(hand,rows[i],running).indexOf("ALLIN")!=-1){
			return true
		}
	}
	return false
}

// 統一紀錄可有多名選手, 以 userid > sessionplayerid > 姓名 當作選手識別 key
function sessionplayerkey(seat){
	if(int(seat["userid"]||0)>0){
		return "u:"+seat["userid"]
	}
	if(seat["sessionplayerid"]){
		return "sp:"+seat["sessionplayerid"]
	}
	return "n:"+String(seat["name"]||"").trim()
}

// 掃描本場次所有手牌座位, 列出出現過的選手(去重, 由最舊到最新)
function sessionplayerlist(){
	let map={}
	let order=[]
	for(let i=sessionhands.length-1;i>=0;i=i-1){
		let seats=sessionhands[i]["seatingdata"]||[]
		for(let j=0;j<seats.length;j=j+1){
			let key=sessionplayerkey(seats[j])
			if(!map[key]){
				let name=String(seats[j]["name"]||"").trim()||("Seat "+int(seats[j]["seatno"]||0))
				map[key]={ "key": key,"name": name,"spids": {} }
				order.push(map[key])
			}
			if(seats[j]["sessionplayerid"]){
				map[key]["spids"][String(seats[j]["sessionplayerid"])]=true
			}
		}
	}
	return order
}

// 確保已選選手有效, 預設選自己(以 myregistration 對應的 sessionplayerid 比對), 否則選第一位
function sessionensureselectedplayer(players){
	let valid={}
	for(let i=0;i<players.length;i=i+1){
		valid[players[i]["key"]]=true
	}
	if(sessionselectedplayer&&valid[sessionselectedplayer]){
		return
	}
	let myid=mysessionplayerid()
	if(myid){
		for(let i=0;i<players.length;i=i+1){
			if(players[i]["spids"][String(myid)]){
				sessionselectedplayer=players[i]["key"]
				return
			}
		}
	}
	sessionselectedplayer=players.length?players[0]["key"]:""
}

function sessionplayerselecthtml(id,players){
	let options=""
	for(let i=0;i<players.length;i=i+1){
		let selected=players[i]["key"]==sessionselectedplayer?"selected":""
		options=options+`<option value="${safehtml(players[i]["key"])}" ${selected}>${safehtml(players[i]["name"])}</option>`
	}
	return `<select id="${id}" class="min-h-10 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-emerald-400">${options}</select>`
}

// 個人紀錄: 以 selfseating 當英雄座位
function sessionheroseat(hand){
	let seats=hand["seatingdata"]||[]
	let self=int(hand["selfseating"]||0)
	for(let j=0;j<seats.length;j=j+1){
		if(int(seats[j]["seatno"]||0)==self){
			return seats[j]
		}
	}
	return null
}

function sessionseatbykey(hand,key){
	let seats=hand["seatingdata"]||[]
	for(let j=0;j<seats.length;j=j+1){
		if(sessionplayerkey(seats[j])==key){
			return seats[j]
		}
	}
	return null
}

// 判斷某座位該手是否 all-in
function sessionseatallin(hand,seatno){
	let rows=hand["bittingdata"]||[]
	let running={}
	for(let i=0;i<rows.length;i=i+1){
		if(sessionactionlabel(hand,rows[i],running)=="Seat "+seatno+" ALLIN"){
			return true
		}
	}
	return false
}

// 依選手座位取得序列: 每手結束後計分牌(endchip)為累積計分牌量, 每手 endchip-chip 為當手損益
function sessionchipseries(getseat){
	let labels=[]
	let stacks=[]
	let deltas=[]
	let hands=[]
	for(let i=sessionhands.length-1;i>=0;i=i-1){
		let hand=sessionhands[i]
		let seat=getseat(hand)
		if(!seat){
			continue
		}
		labels.push(String(labels.length+1))
		stacks.push(int(seat["endchip"]||0))
		deltas.push(int(seat["endchip"]||0)-int(seat["chip"]||0))
		hands.push(hand)
	}
	return { "labels": labels,"stacks": stacks,"deltas": deltas,"hands": hands,"getseat": getseat }
}

function sessionseriesstats(series){
	let n=series["stacks"].length
	let max=null
	let min=null
	let sumstack=0
	let profit=0
	let win=0
	let best=null
	let worst=null
	let allin=0
	for(let i=0;i<n;i=i+1){
		let stack=series["stacks"][i]
		sumstack=sumstack+stack
		if(max==null||max<stack){
			max=stack
		}
		if(min==null||stack<min){
			min=stack
		}
		let delta=series["deltas"][i]
		profit=profit+delta
		if(0<delta){
			win=win+1
		}
		if(best==null||best<delta){
			best=delta
		}
		if(worst==null||delta<worst){
			worst=delta
		}
		let seat=series["getseat"](series["hands"][i])
		if(seat&&sessionseatallin(series["hands"][i],int(seat["seatno"]||0))){
			allin=allin+1
		}
	}
	if(0<worst){
		worst=0
	}
	return {
		total: n,
		cur: n?series["stacks"][n-1]:0,
		max: max||0,
		min: min||0,
		avgstack: n?Math.round(sumstack/n):0,
		profit: profit,
		win: win,
		rate: n?Math.round(win*1000/n)/10:0,
		avg: n?Math.round(profit/n):0,
		best: best||0,
		worst: worst||0,
		allin: allin
	}
}

// 取得目前要呈現的座位取得器與選手清單(統一紀錄需選人, 個人紀錄用英雄座位)
function sessionstatscontext(playerboxid,selectid,rerender){
	let unified=!!(currentsession&&currentsession["unifiedhandrecord"])
	let playerbox=domgetid(playerboxid)
	if(!unified){
		if(playerbox){
			playerbox.classList.add("hidden")
			playerbox.innerHTML=""
		}
		return function(hand){ return sessionheroseat(hand) }
	}
	let players=sessionplayerlist()
	sessionensureselectedplayer(players)
	if(playerbox){
		if(players.length){
			playerbox.classList.remove("hidden")
			playerbox.innerHTML=sessionplayerselecthtml(selectid,players)
			let select=domgetid(selectid)
			if(select){
				select.addEventListener("change",function(){
					sessionselectedplayer=this.value
					rerender()
				})
			}
		}else{
			playerbox.classList.add("hidden")
			playerbox.innerHTML=""
		}
	}
	let key=sessionselectedplayer
	return function(hand){ return sessionseatbykey(hand,key) }
}

function rendersessionstatsandev(){
	rendersessionstats()
	rendersessionev()
}

function rendersessionstats(){
	let getseat=sessionstatscontext("sessionstatsplayer","sessionstatsplayerselect",rendersessionstatsandev)
	let stat=sessionseriesstats(sessionchipseries(getseat))
	innerhtml("#sessionstatschipcards",`
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">累積計分牌量</div><div class="text-xl font-bold text-emerald-400">${stat["cur"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">最大計分牌量</div><div class="text-xl font-bold">${stat["max"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">最小計分牌量</div><div class="text-xl font-bold">${stat["min"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">平均計分牌量</div><div class="text-xl font-bold">${stat["avgstack"]}</div></div>
	`,false)
	innerhtml("#sessionstatscards",`
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">總手數</div><div class="text-xl font-bold">${stat["total"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">淨利</div><div class="text-xl font-bold ${0<=stat["profit"]?"text-green-400":"text-red-400"}">${0<=stat["profit"]?"+":""}${stat["profit"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">勝率</div><div class="text-xl font-bold">${stat["rate"]}%</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">平均</div><div class="text-xl font-bold ${0<=stat["avg"]?"text-green-400":"text-red-400"}">${0<=stat["avg"]?"+":""}${stat["avg"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">最大贏</div><div class="text-xl font-bold text-green-400">+${stat["best"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">最大輸</div><div class="text-xl font-bold text-red-400">${stat["worst"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">All-in 手數</div><div class="text-xl font-bold">${stat["allin"]}</div></div>
	`,false)
}

function rendersessionev(){
	let dom=domgetid("evChart")
	if(!dom){
		return
	}
	let getseat=sessionstatscontext("sessionevplayer","sessionevplayerselect",rendersessionstatsandev)
	let series=sessionchipseries(getseat)
	let stat=sessionseriesstats(series)
	let summary=domgetid("sessionevsummary")
	if(summary){
		summary.innerHTML=`
			<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">累積計分牌量</div><div class="text-xl font-bold text-emerald-400">${stat["cur"]}</div></div>
			<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">最大計分牌量</div><div class="text-xl font-bold">${stat["max"]}</div></div>
			<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">平均計分牌量</div><div class="text-xl font-bold">${stat["avgstack"]}</div></div>
		`
	}
	if(!sessionevchart||sessionevchart.isDisposed()){
		sessionevchart=echarts.init(dom)
		myChart=sessionevchart
	}
	sessionevchart.setOption({
		tooltip: { trigger: "axis" },
		grid: { left: 60,right: 20,top: 20,bottom: 30 },
		xAxis: { type: "category",data: series["labels"] },
		yAxis: { type: "value" },
		series: [{
			name: "累積計分牌",
			type: "line",
			smooth: true,
			data: series["stacks"],
			areaStyle: { color: "#22d3ee",opacity: 0.18 },
			lineStyle: { color: "#22d3ee" },
			itemStyle: { color: "#22d3ee" }
		}]
	},true)
	// 直接進到圖表頁時容器可能尚未取得寬度(資料為非同步載入), 延遲 resize 讓圖表抓到正確尺寸
	setTimeout(function(){
		if(sessionevchart&&!sessionevchart.isDisposed()){
			sessionevchart.resize()
		}
	},30)
}

function sessionhanddate(hand){
	let text=String(hand["createtime"]||hand["handtime"]||"")
	if(10<=text.length){
		return text.substring(0,10)
	}
	return ""
}

function filtersessionhands(){
	let keyword=String(getvalue("sessionhandsearch")||"").toLowerCase()
	let seat=int(getvalue("sessionhandseat")||0)
	let datefrom=getvalue("sessionhandfrom")||""
	let dateto=getvalue("sessionhandto")||""
	let rows=[]
	for(let i=0;i<sessionhands.length;i=i+1){
		let hand=sessionhands[i]
		let matched=true
		let date=sessionhanddate(hand)
		if(seat&&int(hand["selfseating"]||0)!=seat){
			matched=false
		}
		if(datefrom&&(!date||date<datefrom)){
			matched=false
		}
		if(dateto&&(!date||dateto<date)){
			matched=false
		}
		if(keyword){
			let text=[
				hand["tablename"]||"",
				hand["playername"]||"",
				hand["creatorname"]||"",
				"seat "+(hand["selfseating"]||""),
				hand["smallblind"]||"",
				hand["bigblind"]||""
			].join(" ").toLowerCase()
			if(text.indexOf(keyword)==-1){
				matched=false
			}
		}
		if(matched){
			rows.push(hand)
		}
	}
	rows.sort(function(a,b){
		let ca=String(a["createtime"]||"")
		let cb=String(b["createtime"]||"")
		if(ca!=cb){
			return ca<cb?-1:1
		}
		return (parseInt(a["id"])||0)-(parseInt(b["id"])||0)
	})
	if(sessionhandsortdir=="desc"){
		rows.reverse()
	}
	return rows
}

function rendersessionhandpager(total){
	let totalpage=Math.max(1,Math.ceil(total/sessionhandpagesize))
	if(totalpage<sessionhandpage){
		sessionhandpage=totalpage
	}
	let start=total?((sessionhandpage-1)*sessionhandpagesize+1):0
	let end=Math.min(total,sessionhandpage*sessionhandpagesize)
	innerhtml("#sessionhandpager",`
		<div class="text-zinc-400">顯示 ${start}-${end} / ${total}</div>
		<div class="flex items-center gap-2">
			<input type="button" class="sessionhandpagebtn bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded" data-page="${sessionhandpage-1}" ${sessionhandpage<=1?"disabled":""} value="上一頁">
			<span class="text-zinc-300">${sessionhandpage} / ${totalpage}</span>
			<input type="button" class="sessionhandpagebtn bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded" data-page="${sessionhandpage+1}" ${totalpage<=sessionhandpage?"disabled":""} value="下一頁">
		</div>
	`,false)
	onclick(".sessionhandpagebtn",function(element,event){
		let page=int(dataset(element,"page")||1)
		if(page<1){
			page=1
		}
		sessionhandpage=page
		rendersessionhandtable()
	})
}

function rendersessionhandtable(){
	let html=""
	let cardhtml=""
	let rows=filtersessionhands()
	let totalpage=Math.max(1,Math.ceil(rows.length/sessionhandpagesize))
	if(totalpage<sessionhandpage){
		sessionhandpage=totalpage
	}
	let start=(sessionhandpage-1)*sessionhandpagesize
	let end=Math.min(rows.length,start+sessionhandpagesize)
	for(let i=start;i<end;i=i+1){
		let hand=rows[i]
		let result=float(hand["result"]||0)
		let resultcolor=0<=result?"text-green-400":"text-red-400"
		let resulttext=(0<=result?"+":"")+result
		let url=`handdetail.html?id=${hand["id"]}&tableid=${hand["tableid"]}&sessionid=${sessionid}&sort=${sessionhandsortdir}`
		let badge=sessionhasallin(hand)?`<span class="inline-flex items-center rounded bg-red-500/15 text-red-300 border border-red-500/40 px-2 py-1 text-xs font-bold">ALLIN</span>`:"-"
		html=html+`
			<tr class="border-t border-zinc-700 hover:bg-zinc-700 cursor-pointer sessionhandrow" data-url="${url}">
				<td class="relative py-2 px-2 font-bold">${i+1}<a href="${url}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2">${safehtml(hand["tablename"]||"-")}<a href="${url}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2">${sessionhandcards(hand)}<a href="${url}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2 text-xs text-zinc-300">${safehtml(sessionactionsummary(hand))}<a href="${url}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2 ${resultcolor} font-bold">${resulttext}<a href="${url}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2">${badge}<a href="${url}" class="rowlink absolute inset-0 z-10"></a></td>
			</tr>
		`
		let cardbadge=sessionhasallin(hand)?`<span class="inline-flex items-center rounded bg-red-500/15 text-red-300 border border-red-500/40 px-2 py-0.5 text-[11px] font-bold">ALLIN</span>`:""
		cardhtml=cardhtml+`
			<a href="${url}" class="sessionhandrow block cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 transition active:bg-zinc-800 text-inherit no-underline" data-url="${url}">
				<div class="mb-3 flex items-center justify-between gap-2">
					<div class="flex min-w-0 items-center gap-2">
						<span class="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-zinc-800 px-2 text-xs font-bold text-zinc-300">#${i+1}</span>
						<span class="truncate text-sm font-semibold text-zinc-100">${safehtml(hand["tablename"]||"-")}</span>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						${cardbadge}
						<span class="text-base font-bold ${resultcolor}">${resulttext}</span>
					</div>
				</div>
				<div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">${sessionhandcards(hand)}</div>
				<div class="text-xs leading-5 text-zinc-400">${safehtml(sessionactionsummary(hand))}</div>
			</a>
		`
	}
	if(!html){
		html=`<tr><td colspan="6" class="py-6 text-zinc-500 text-center">尚無手牌</td></tr>`
	}
	if(!cardhtml){
		cardhtml=`<div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 py-6 text-center text-zinc-500">尚無手牌</div>`
	}
	innerhtml("#sessionhandtable",html,false)
	innerhtml("#sessionhandcards",cardhtml,false)
	bindsessionhandrowlink()
	rendersessionhandpager(rows.length)
}

function sessionrowurl(element){
	if(!element){
		return ""
	}
	return element.getAttribute("data-url")||""
}

function bindsessionhandrowlink(){
	let rows=document.querySelectorAll(".sessionhandrow")
	for(let i=0;i<rows.length;i=i+1){
		rows[i].addEventListener("click",function(event){
			// 只攔截一般左鍵，改用 SPA 導航留在同分頁；中鍵／Ctrl／Cmd 等交給 <a> 原生行為（背景開新分頁、不離開 session.html）
			if(event.button!=0){
				return
			}
			if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey){
				return
			}
			let url=sessionrowurl(this)
			if(url==""){
				return
			}
			event.preventDefault()
			href(url)
		})
	}
}

function bindsessionhandfilters(){
	let ids=["sessionhandsearch","sessionhandseat","sessionhandfrom","sessionhandto"]
	for(let i=0;i<ids.length;i=i+1){
		let input=domgetid(ids[i])
		if(input){
			input.addEventListener("input",function(){
				sessionhandpage=1
				rendersessionhandtable()
			})
			input.addEventListener("change",function(){
				sessionhandpage=1
				rendersessionhandtable()
			})
		}
	}
	onclick("#sessionhandclear",function(element,event){
		value("#sessionhandsearch","",false)
		value("#sessionhandseat","",false)
		value("#sessionhandfrom","",false)
		value("#sessionhandto","",false)
		sessionhandpage=1
		rendersessionhandtable()
	})
	let sessionhandsortbtn=domgetid("sessionhandsort")
	if(sessionhandsortbtn){
		sessionhandsortbtn.textContent="時間 "+(sessionhandsortdir=="desc"?"↓":"↑")
	}
	onclick("#sessionhandsort",function(element,event){
		sessionhandsortdir=(sessionhandsortdir=="desc")?"asc":"desc"
		weblsset(WEBLSNAME+"handsortdir",sessionhandsortdir)
		element.textContent="時間 "+(sessionhandsortdir=="desc"?"↓":"↑")
		sessionhandpage=1
		rendersessionhandtable()
	})
}

function loadsessionhands(){
	if(sessionhandsloadeded){
		rendersessionhandtable()
		rendersessionstats()
		rendersessionev()
		return
	}
	let handlistwatchdog=setTimeout(function(){
		pttoast("載入時間較久, 請檢查連線後重試","warning")
	},15000)
	ajax("GET",AJAXURL+"getsessionhandlist/"+sessionid,function(event,data){
		clearTimeout(handlistwatchdog)
		if(data["success"]){
			sessionhandsloadeded=true
			sessionhands=data["data"]||[]
			updatesessionhandcount()
			rendersessionhandtable()
			rendersessionstats()
			rendersessionev()
		}else{
			if(data["data"]=="ERROR_no_permission"){
				sessionhandsloadeded=true
				sessionhands=[]
				innerhtml("#sessionhandtable",`<tr><td colspan="6" class="py-6 text-zinc-500 text-center">目前沒有手牌檢視權限</td></tr>`,false)
				return
			}
			pttoast(data["data"]||"讀取手牌失敗","error")
		}
	},null,settingauthheaders())
}

function selectsessionhandtab(tab){
	let btns=document.querySelectorAll(".handtab-btn")
	let contents=document.querySelectorAll(".handtab-content")
	for(let i=0;i<btns.length;i=i+1){
		btns[i].classList.remove("border-emerald-400","text-emerald-400")
	}
	for(let i=0;i<contents.length;i=i+1){
		contents[i].classList.add("hidden")
	}
	let btn=document.querySelector('.handtab-btn[data-handtab="'+tab+'"]')
	let content=domgetid("handtab-"+tab)
	if(btn){
		btn.classList.add("border-emerald-400","text-emerald-400")
	}
	if(content){
		content.classList.remove("hidden")
	}
	if(tab=="overview"){
		rendersessionhandtable()
	}
	if(tab=="stats"){
		rendersessionstats()
	}
	if(tab=="ev"){
		rendersessionev()
	}
	if(tab=="ev"&&typeof myChart!="undefined"&&myChart){
		setTimeout(function(){
			myChart.resize()
		},20)
	}
}

function sessionhandtabhash(tab){
	if(tab=="ev"){
		return "chart"
	}
	if(tab=="stats"){
		return "stats"
	}
	return "hands"
}

function sessionhandtabhref(tab){
	return location.pathname+location.search+"#"+sessionhandtabhash(tab)
}

function selectsessionoverviewtab(tab){
	let btns=document.querySelectorAll(".overviewtab-btn")
	let contents=document.querySelectorAll(".overviewtab-content")
	for(let i=0;i<btns.length;i=i+1){
		btns[i].classList.remove("border-emerald-400","text-emerald-400")
	}
	for(let i=0;i<contents.length;i=i+1){
		contents[i].classList.add("hidden")
	}
	let btn=document.querySelector('.overviewtab-btn[data-overviewtab="'+tab+'"]')
	let content=domgetid("overviewtab-"+tab)
	if(btn&&content){
		btn.classList.add("border-emerald-400","text-emerald-400")
		content.classList.remove("hidden")
	}
}

function getactiveoverviewtab(){
	let active=document.querySelector(".overviewtab-btn.border-emerald-400")
	if(active){
		return active.getAttribute("data-overviewtab")
	}
	return "general"
}

function getoverviewhash(){
	return "overview-"+getactiveoverviewtab()
}

function selectsessionothertab(tab){
	if(tab=="settings"&&currentsession&&!canviewsessionsettings(currentsession)){
		tab="orderinfo"
	}
	let btns=document.querySelectorAll(".othertab-btn")
	let contents=document.querySelectorAll(".othertab-content")
	for(let i=0;i<btns.length;i=i+1){
		btns[i].classList.remove("border-emerald-400","text-emerald-400")
	}
	for(let i=0;i<contents.length;i=i+1){
		contents[i].classList.add("hidden")
	}
	let btn=document.querySelector('.othertab-btn[data-othertab="'+tab+'"]')
	let content=domgetid("othertab-"+tab)
	if(btn&&content){
		btn.classList.add("border-emerald-400","text-emerald-400")
		content.classList.remove("hidden")
	}
	if(tab=="settings"){
		rendersettings(getactivesettingtab())
	}
	if(tab=="relations"){
		renderrelationpage(relationtype)
	}
}

function getactiveothertab(){
	let active=document.querySelector(".othertab-btn.border-emerald-400")
	if(active){
		return active.getAttribute("data-othertab")
	}
	if(currentsession&&!canviewsessionsettings(currentsession)){
		return "orderinfo"
	}
	return "settings"
}

let tabBtns=document.querySelectorAll(".tab-btn")
let tabContents=document.querySelectorAll(".tab-content")
let overviewtabBtns=document.querySelectorAll(".overviewtab-btn")
let othertabBtns=document.querySelectorAll(".othertab-btn")
let tabletabBtns=document.querySelectorAll(".tabletab-btn")
let handtabBtns=document.querySelectorAll(".handtab-btn")

function sessionhashstate(){
	let sessionhash=location.hash.substring(1)
	let state={
		"tab": sessionhash,
		"handtab": "",
		"tabletab": "",
		"overviewtab": "",
		"othertab": ""
	}
	if(sessionhash=="overview-other-settings"||sessionhash=="overview-other-relations"){
		state["othertab"]=sessionhash.replace("overview-other-","")
		state["tab"]="other"
	}
	if(sessionhash=="other-settings"||sessionhash=="other-relations"||sessionhash=="other-orderinfo"){
		state["othertab"]=sessionhash.replace("other-","")
		state["tab"]="other"
	}
	if(sessionhash=="overview-general"||sessionhash=="overview-info"||sessionhash=="overview-action"||sessionhash=="overview-note"){
		state["overviewtab"]=sessionhash.replace("overview-","")
		state["tab"]="overview"
	}
	if(sessionhash=="general"||sessionhash=="info"||sessionhash=="action"||sessionhash=="note"){
		state["overviewtab"]=sessionhash
		state["tab"]="overview"
	}
	if(sessionhash=="settings"||sessionhash=="relations"||sessionhash=="orderinfo"){
		state["othertab"]=sessionhash
		state["tab"]="other"
	}
	if(sessionhash=="ev"||sessionhash=="chart"){
		state["handtab"]="ev"
		state["tab"]="hands"
	}
	if(sessionhash=="stats"){
		state["handtab"]="stats"
		state["tab"]="hands"
	}
	if(sessionhash=="seats"||sessionhash=="players"||sessionhash=="5"){
		state["tabletab"]="seats"
		state["tab"]="table"
	}
	if(sessionhash=="list"){
		state["tabletab"]="list"
		state["tab"]="table"
	}
	if(sessionhash=="3"||sessionhash=="4"){
		state["handtab"]=sessionhash=="3"?"ev":"stats"
		state["tab"]="hands"
	}
	return state
}

function sessiontabbutton(tab){
	let btn=document.querySelector('.tab-btn[data-tab="'+tab+'"]')
	if(btn){
		return btn
	}
	btn=document.querySelector('.tab-btn[data-id="'+tab+'"]')
	if(btn){
		return btn
	}
	let btns=document.querySelectorAll(".tab-btn")
	if(tab!=""){
		btn=btns[int(tab)||0]
	}
	if(!btn){
		btn=btns[0]
	}
	return btn
}

function sessionsettab(btn,hashupdated){
	if(!btn){
		btn=sessiontabbutton("")
	}
	if(!btn){
		return
	}
	for(let j=0;j<tabBtns.length;j=j+1){
		tabBtns[j].classList.remove("border-emerald-400","text-emerald-400")
	}
	btn.classList.add("border-emerald-400","text-emerald-400")
	let tab=btn.getAttribute("data-tab")
	for(let j=0;j<tabContents.length;j=j+1){
		tabContents[j].classList.add("hidden")
	}
	let content=domgetid("tab-"+tab)
	if(content){
		content.classList.remove("hidden")
	}
	if(tab=="relations"){
		renderrelationpage(relationtype)
	}
	if(tab=="table"){
		selectsessiontabletab("list")
	}
	if(tab=="hands"){
		loadsessionhands()
		selectsessionhandtab("overview")
	}
	if(tab=="other"&&!document.querySelector(".othertab-btn.border-emerald-400")){
		selectsessionothertab(getactiveothertab())
	}
	if(tab=="overview"&&!document.querySelector(".overviewtab-btn.border-emerald-400")){
		selectsessionoverviewtab("general")
	}
	rendersessionextratab(tab)
	if(hashupdated){
		let hash=tab
		if(tab=="overview"){
			hash="overview-"+getactiveoverviewtab()
		}
		if(tab=="other"){
			hash="other-"+getactiveothertab()
		}
		if(location.hash!="#"+hash){
			href("#"+hash)
		}
	}
}

function applysessionhash(){
	let state=sessionhashstate()
	let btn=sessiontabbutton(state["tab"])
	sessionsettab(btn,false)
	if(state["overviewtab"]){
		selectsessionoverviewtab(state["overviewtab"])
	}
	if(state["othertab"]){
		selectsessionothertab(state["othertab"])
	}
	if(state["tabletab"]){
		selectsessiontabletab(state["tabletab"])
	}
	if(state["handtab"]){
		selectsessionhandtab(state["handtab"])
	}
}
for(let i=0;i<overviewtabBtns.length;i=i+1){
	overviewtabBtns[i].addEventListener("click",function(){
		let tab=this.getAttribute("data-overviewtab")
		selectsessionoverviewtab(tab)
		href("#"+getoverviewhash())
	})
}
for(let i=0;i<othertabBtns.length;i=i+1){
	othertabBtns[i].addEventListener("click",function(){
		let tab=this.getAttribute("data-othertab")
		selectsessionothertab(tab)
		href("#other-"+tab)
	})
}
for(let i=0;i<tabletabBtns.length;i=i+1){
	tabletabBtns[i].addEventListener("click",function(){
		selectsessiontabletab(this.getAttribute("data-tabletab"))
		href("#"+this.getAttribute("data-tabletab"))
	})
}
for(let i=0;i<handtabBtns.length;i=i+1){
	handtabBtns[i].href=sessionhandtabhref(handtabBtns[i].getAttribute("data-handtab"))
	handtabBtns[i].addEventListener("click",function(event){
		if(event&&event.button!==0){
			return
		}
		if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
			return
		}
		event.preventDefault()
		let tab=this.getAttribute("data-handtab")
		selectsessionhandtab(tab)
		href("#"+sessionhandtabhash(tab))
	})
}
bindsessionhandfilters()
document.addEventListener("click",function(event){
	let target=event.target
	let button=target.closest("[data-sessionjump]")
	if(!button){
		return
	}
	let jump=button.getAttribute("data-sessionjump")||""
	if(jump=="#other-settings"){
		let tab=document.querySelector('.tab-btn[data-tab="other"]')
		if(tab){
			tab.click()
			selectsessionothertab("settings")
			href(jump)
		}
		return
	}
	if(jump=="#table-list"){
		let tab=document.querySelector('.tab-btn[data-tab="table"]')
		if(tab){
			tab.click()
			selectsessiontabletab("list")
			href(jump)
		}
		return
	}
	let tab=document.querySelector('.tab-btn[data-tab="overview"]')
	if(tab){
		tab.click()
		selectsessionoverviewtab("general")
		href("#overview-general")
	}
})
for(let i=0;i<tabBtns.length;i=i+1){
	tabBtns[i].addEventListener("click",function(){
		sessionsettab(this,true)
	})
}
// 預設顯示第一個頁籤

applysessionhash()
window.addEventListener("hashchange",function(){
	applysessionhash()
})

// ===== 場次列印（摘要 + 名次 + 報名名單），供協會紙本存底 =====
function sessionprintstatustext(status){
	if(status=="registered"){
		return "已報名"
	}
	if(status=="confirmed"){
		return "已確認"
	}
	if(status=="advanced"){
		return "已晉級"
	}
	if(status=="cancelled"){
		return "已取消"
	}
	return status||"-"
}

function sessionprinttablename(tablelist,tableid){
	if(!tableid){
		return "-"
	}
	for(let i=0;i<tablelist.length;i=i+1){
		if(String(tablelist[i]["id"])==String(tableid)){
			return tablelist[i]["no"]||tablelist[i]["token"]||("桌 "+tableid)
		}
	}
	return "-"
}

function sessionprintmoney(value){
	value=float(value)||0
	if(0<=value){
		return "+"+value
	}
	return ""+value
}

function sessionprintplaceorder(a,b){
	let ap=int(a["timerplace"]||0)
	let bp=int(b["timerplace"]||0)
	if(ap&&bp&&ap!=bp){
		return ap-bp
	}
	if(ap&&!bp){
		return -1
	}
	if(!ap&&bp){
		return 1
	}
	return int(a["serialno"]||0)-int(b["serialno"]||0)
}

// 從已載入的 settingtypes 取某型別的短代碼。
function sessionprintcode(typekey,idvalue){
	let rows=settingtypes[typekey]||[]
	for(let i=0;i<rows.length;i=i+1){
		if(String(rows[i]["id"])==String(idvalue)){
			return rows[i]["code"]||""
		}
	}
	return ""
}

function sessionprintcodetext(row){
	let code=sessionprintcode("event",row["eventtypeid"])+sessionprintcode("stack",row["stacktypeid"])+sessionprintcode("limit",row["limittypeid"])+sessionprintcode("game",row["gametypeid"])
	return code||"-"
}

// 再入 / 重買 / 增購顯示：不可就寫「否」，可就寫「<次數> / <總費用>(<費用>/<服務費>)」。
// rawbuyin/rawchip 用來判斷是否開放；effbuyin/efffee 是實際計費用（含 fallback）。
function sessionprintfeevalue(count,rawbuyin,rawchip,effbuyin,efffee){
	if(sessionyesbycount(count,rawbuyin,rawchip)!="是"){
		return "否"
	}
	let b=float(effbuyin)||0
	let f=float(efffee)||0
	return sessiondisplayvalue(count)+" / "+(b+f)+"("+b+"/"+f+")"
}

function sessionprintsummaryhtml(row){
	let gametypetext="-"
	if(TRANSLATE[LANGUAGE]["gametype"]&&TRANSLATE[LANGUAGE]["gametype"][row["gametype"]]){
		gametypetext=TRANSLATE[LANGUAGE]["gametype"][row["gametype"]]
	}else if(row["gametype"]){
		gametypetext=row["gametype"]
	}
	let basebuyin=float(row["buyin"])||0
	let basefee=float(row["buyinfee"])||0
	let reentrybuyin=float(row["reentrybuyin"])||0
	if(reentrybuyin<=0){
		reentrybuyin=basebuyin
	}
	let reentryfee=float(row["reentryfee"])||0
	if(reentryfee<=0){
		reentryfee=basefee
	}
	let rebuybuyin=float(row["rebuybuyin"])||0
	if(rebuybuyin<=0){
		rebuybuyin=basebuyin
	}
	let rebuyfee=float(row["rebuyfee"])||0
	if(rebuyfee<=0){
		rebuyfee=basefee
	}
	return ptprintinfogrid([
		["場次名稱",row["name"]||"-"],
		["代碼",sessionprintcodetext(row)],
		["日期",ptformatdatetimeminute(row["starttime"])],
		["地點",row["clubname"]||"-"],
		["遊戲類型",gametypetext],
		["每桌座位",sessiondisplayvalue(row["maxseat"])],
		["前注模式",sessionantetext(row["antemode"])],
		["買入(服務費)",sessionfeetext(row["buyin"],row["buyinfee"])],
		["買入計分牌",sessionmoneytext(row["chip"])],
		["票券價值",sessionmoneytext(row["ticketvalue"])],
		["保底獎金",float(row["guaranteedprize"])||0],
		["再入次數/再入費",sessionprintfeevalue(row["reentrycount"],row["reentrybuyin"],row["reentrychip"],reentrybuyin,reentryfee)],
		["重買次數/重買費",sessionprintfeevalue(row["rebuycount"],row["rebuybuyin"],row["rebuychip"],rebuybuyin,rebuyfee)],
		["增購次數/增購費",sessionprintfeevalue(row["addoncount"],row["addonbuyin"],row["addonchip"],row["addonbuyin"],row["addonfee"])],
		["場次結束",sessionbooltext(row["sessionended"])]
	])
}

function sessionprintrankhtml(registrations){
	let ranked=[]
	for(let i=0;i<registrations.length;i=i+1){
		if(registrations[i]["status"]!="cancelled"){
			ranked.push(registrations[i])
		}
	}
	ranked.sort(sessionprintplaceorder)
	let columns=[
		{"title": "名次","align": "center"},
		{"title": "選手"},
		{"title": "ID"},
		{"title": "買入","align": "right"},
		{"title": "獎金","align": "right"},
		{"title": "盈虧","align": "right"}
	]
	let rows=[]
	for(let i=0;i<ranked.length;i=i+1){
		let r=ranked[i]
		rows.push([
			r["timerplace"]||r["place"]||"-",
			r["playername"]||"-",
			r["playerplayerid"]||"",
			r["cost"]||0,
			r["finalprize"]||0,
			sessionprintmoney(r["profit"])
		])
	}
	return ptprinttable(columns,rows,"尚無名次資料")
}

function sessionprintregisterhtml(registrations,tablelist){
	let columns=[
		{"title": "序號","align": "right"},
		{"title": "選手"},
		{"title": "ID"},
		{"title": "狀態","align": "center"},
		{"title": "桌次","align": "center"},
		{"title": "座位","align": "center"},
		{"title": "買入","align": "right"},
		{"title": "名次","align": "center"},
		{"title": "獎金","align": "right"},
		{"title": "盈虧","align": "right"}
	]
	let rows=[]
	for(let i=0;i<registrations.length;i=i+1){
		let r=registrations[i]
		rows.push([
			r["serialno"]||(i+1),
			r["playername"]||"-",
			r["playerplayerid"]||"",
			sessionprintstatustext(r["status"]),
			sessionprinttablename(tablelist,r["tableid"]),
			r["seatno"]||"-",
			r["cost"]||0,
			r["timerplace"]||r["place"]||"-",
			r["finalprize"]||0,
			sessionprintmoney(r["profit"])
		])
	}
	return ptprinttable(columns,rows,"尚無報名紀錄")
}

// 賽事結構表：開始時間 / 關卡 / 小盲 / 大盲 / 前注 / 時間(分) / 備註(REG CLOSE、換籌)。
function sessionprintstructurehtml(schedule,row){
	let columns=[
		{"title": "開始","align": "center"},
		{"title": "關卡","align": "center"},
		{"title": "小盲","align": "right"},
		{"title": "大盲","align": "right"},
		{"title": "前注","align": "right"},
		{"title": "時間(分)","align": "right"},
		{"title": "備註"}
	]
	let rows=[]
	let level=0
	let running=0
	for(let i=0;i<schedule.length;i=i+1){
		let item=schedule[i]||{}
		let clock=sessiondeadlineclock(row,running)||"-"
		let note=[]
		if(item["regCloseAfter"]){
			note.push("REG CLOSE")
		}
		if(item["chipRaiseValues"]&&item["chipRaiseValues"].length){
			note.push("換籌 "+item["chipRaiseValues"].join("/"))
		}
		let notetext=note.join(" / ")||"-"
		if(item["type"]=="break"){
			rows.push([clock,"休息","-","-","-",sessiondisplayvalue(item["dur"]),notetext])
		}else{
			level=level+1
			rows.push([clock,"Lv."+level,sessiondisplayvalue(item["sb"]),sessiondisplayvalue(item["bb"]),sessiondisplayvalue(item["ante"]),sessiondisplayvalue(item["dur"]),notetext])
		}
		running=running+int(item["dur"]||0)
	}
	return ptprinttable(columns,rows,"尚無結構資料")
}

function printsession(){
	if(!currentsession){
		pttoast("場次資料尚未載入完成，請稍候再列印","warning")
		return
	}
	let row=currentsession
	ajax("GET",AJAXURL+"getsessionregistrationlist/"+sessionid,function(event,data){
		let registrations=[]
		let tablelist=[]
		let stats={}
		if(data["success"]&&data["data"]){
			registrations=data["data"]["registrations"]||[]
			tablelist=data["data"]["tables"]||[]
			stats=data["data"]["stats"]||{}
		}
		let bodyhtml=ptprintsectiontitle("場次摘要")+sessionprintsummaryhtml(row)
		// 報名統計 / 名次 / 名單只在主辦(可看報名資料)時列印。
		let isowner=row["isown"]||row["isadmin"]
		if(isowner){
			if(stats["registered"]!=undefined){
				bodyhtml=bodyhtml+ptprintsectiontitle("報名統計")+ptprintinfogrid([
					["已報名",sessiondisplayvalue(stats["registered"])],
					["已確認",sessiondisplayvalue(int(stats["confirmed"]||0)+int(stats["advanced"]||0))],
					["已取消",sessiondisplayvalue(stats["cancelled"])],
					["報名筆數",registrations.length]
				])
			}
			bodyhtml=bodyhtml+ptprintsectiontitle("名次結算")+sessionprintrankhtml(registrations)
			bodyhtml=bodyhtml+ptprintsectiontitle("報名名單")+sessionprintregisterhtml(registrations,tablelist)
		}
		// 賽事結構放在報名名單下面。
		let schedule=(sessiontimerstate||{})["schedule"]||[]
		if(schedule.length==0){
			schedule=row["schedule"]||[]
		}
		bodyhtml=bodyhtml+ptprintsectiontitle("賽事結構")+sessionprintstructurehtml(schedule,row)
		bodyhtml=bodyhtml+ptprintsignblock(["承辦人簽名","主管簽名"])
		ptprintrun(ptprintbuild({
			"eyebrow": "Session",
			"title": (row["name"]||"場次")+" 場次存底",
			"subtitle": "場次詳情存底",
			"meta": "列印時間 "+ptprinttimestamp()
		},bodyhtml))
	},null,sessiontimerauthheaders())
}

onclick("#printsession",function(element,event){
	printsession()
})

// ===== 手牌總覽列印 =====
// 起手牌 / 公牌轉純文字（列印用）。
function sessionprinthandcardstext(hand){
	let hero=[]
	if(hand["selfseating"]&&hand["handcard"]){
		if(hand["handcard"]["card1"]){
			hero.push(String(hand["handcard"]["card1"]))
		}
		if(hand["handcard"]["card2"]){
			hero.push(String(hand["handcard"]["card2"]))
		}
	}
	let board=[]
	if(hand["boardcard"]){
		let flop=hand["boardcard"]["flop"]||[]
		for(let i=0;i<flop.length;i=i+1){
			if(flop[i]){
				board.push(String(flop[i]))
			}
		}
		if(hand["boardcard"]["turn"]){
			board.push(String(hand["boardcard"]["turn"]))
		}
		if(hand["boardcard"]["river"]){
			board.push(String(hand["boardcard"]["river"]))
		}
	}
	let text=hero.join(" ")
	if(board.length){
		text=text?text+" | "+board.join(" "):board.join(" ")
	}
	return text||"-"
}

function printsessionhands(){
	let list=filtersessionhands()
	if(!list||list.length<1){
		pttoast("目前沒有手牌可列印","warning")
		return
	}
	let columns=[
		{"title": "#","align": "right"},
		{"title": "位置"},
		{"title": "起手牌 / 公牌"},
		{"title": "行動"},
		{"title": "結果","align": "right"}
	]
	let rows=[]
	for(let i=0;i<list.length;i=i+1){
		let hand=list[i]
		let result=float(hand["result"]||0)
		rows.push([
			i+1,
			hand["tablename"]||"-",
			sessionprinthandcardstext(hand),
			sessionactionsummary(hand),
			(0<=result?"+":"")+result
		])
	}
	let sessionname=currentsession?(currentsession["name"]||"場次"):"場次"
	let infohtml=ptprintinfogrid([
		["場次",sessionname],
		["手牌總數",list.length],
		["排序",sessionhandsortdir=="desc"?"時間新→舊":"時間舊→新"]
	])
	let bodyhtml=infohtml+ptprintsectiontitle("手牌總覽")+ptprinttable(columns,rows,"尚無手牌")+ptprintsignblock(["承辦人簽名","主管簽名"])
	ptprintrun(ptprintbuild({
		"eyebrow": "Hands",
		"title": sessionname+" 手牌總覽",
		"subtitle": "手牌紀錄存底",
		"meta": "列印時間 "+ptprinttimestamp()
	},bodyhtml))
}

onclick("#printsessionhands",function(element,event){
	printsessionhands()
})
