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
// 手牌表 / 牌桌清單排序狀態(可點各欄表頭)
let sessionhandsortstate={"key": "createtime","ascended": sessionhandsortdir=="asc"}
let sessiontablesortstate={"key": "","ascended": true}

function sessionhandsortvalue(item,key){
	if(key=="createtime"){
		let text=ptformatdatetime(item["createtime"])
		return text||null
	}
	if(key=="selfseating"||key=="bigblind"||key=="result"){
		let number=Number(item[key])
		return isNaN(number)?null:number
	}
	if(key=="tablename"){
		let text=String(item["tablename"]||"").trim()
		return text||null
	}
	let text=""
	if(item[key]!=null){
		text=String(item[key]).trim()
	}
	return text||null
}

function sessiontablesortvalue(item,key){
	if(key=="no"){
		return sessiontableno(item)
	}
	let text=""
	if(item[key]!=null){
		text=String(item[key]).trim()
	}
	return text||null
}
let sessionhandsloadeded=false
let sessionevchart=null
let sessionselectedplayer=""
let sessionhandpage=1
let sessionhandpagesize=20
let sessiontables=[]
let sessiontablepage=1
let sessiontablepagesize=20
let sessionendeded=false
// 這場的主辦單位在我的追隨清單裡的那一筆（沒追隨就是 null）
let sessionfollowtarget=null
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
		"role": sessionpagetext("roleplayer","選手"),
		"status": sessionpagetext("roleplayerstatus","可查看場次資訊"),
		"nextstep": sessionpagetext("roleplayernext","先確認時間、地點與目前是否開放報名。"),
		"ctatext": sessionpagetext("roleplayercta","查看總覽"),
		"ctahref": "#overview-general",
		"focus": sessionpagetext("roleplayerfocus","你現在先需要的是場次基本資訊與報名狀態。"),
		"helper": sessionpagetext("roleplayerhelper","完成必要動作後，再往下看牌桌、手牌或其他細節。")
	}
	if(row["isown"]||row["isadmin"]){
		result["role"]=sessionpagetext("rolehost","主辦 / 管理")
		result["status"]=sessionpagetext("rolehoststatus","可管理報名、計時器、設定與場次結構")
		result["nextstep"]=sessionpagetext("rolehostnext","先檢查報名狀態與計時器，再決定是否要進入管理區。")
		result["ctatext"]=sessionpagetext("rolehostcta","前往管理區")
		result["ctahref"]="#other-settings"
		result["focus"]=sessionpagetext("rolehostfocus","主辦版首屏會優先給你管理入口與現場執行工具。")
		result["helper"]=sessionpagetext("rolehosthelper","報名清單、計時器控制台與場次設定會集中在快速入口。")
		return result
	}
	if(row["accessrole"]=="floor"||row["accessrole"]=="assistant"){
		result["role"]=row["accessrole"]=="floor"?sessionpagetext("rolefloor","裁判"):sessionpagetext("roleassistant","助理")
		result["status"]=sessionpagetext("rolestaffstatus","可協助現場流程，並可操作計時器")
		result["nextstep"]=sessionpagetext("rolestaffnext","先確認目前報名 / 計時器狀態，再進入控制台執行現場操作。")
		result["ctatext"]=sessionpagetext("rolestaffcta","開啟計時器控制台")
		result["ctahref"]="control.html?sessionid="+sessionid
		result["focus"]=sessionpagetext("rolestafffocus","你現在最重要的是知道目前節奏、報名是否關閉、以及下一步現場流程。")
		result["helper"]=sessionpagetext("rolestaffhelper","深層設定不會放在首屏，先把現場執行需要的資訊看清楚。")
		return result
	}
	if(row["isstaff"]==true){
		result["role"]=sessionpagetext("rolehired","已聘用員工")
		result["status"]=sessionpagetext("rolehiredstatus","可查看相關場次並協助執行，但不會以選手身份報名")
		result["nextstep"]=sessionpagetext("rolehirednext","先確認你的協助範圍與目前場次狀態。")
		result["ctatext"]=sessionpagetext("rolehiredcta","查看場次狀態")
		result["ctahref"]="#overview-general"
		result["focus"]=sessionpagetext("rolehiredfocus","員工版首屏會先給你必要資訊，不會把選手報名動作放在前面。")
		result["helper"]=sessionpagetext("rolehiredhelper","若你是裁判或助理，會另外顯示計時器相關入口。")
		return result
	}
	let mystatus=row["myregistrationstatus"]||""
	if(mystatus=="registered"){
		result["status"]=sessionpagetext("roleregisteredstatus","你已報名，等待主辦確認")
		result["nextstep"]=sessionpagetext("roleregisterednext","保留這頁追蹤確認狀態，若行程有變可取消報名。")
		result["ctatext"]=sessionpagetext("roleregisteredcta","查看我的狀態")
		result["ctahref"]="#overview-general"
		result["focus"]=sessionpagetext("roleregisteredfocus","你現在最重要的是等候確認，不需要先看深層管理資訊。")
		result["helper"]=sessionpagetext("roleregisteredhelper","確認後再留意座位、剩餘人數與計時器顯示。")
		return result
	}
	if(mystatus=="confirmed"){
		result["status"]=sessionpagetext("roleconfirmedstatus","你已確認入場")
		result["nextstep"]=sessionpagetext("roleconfirmednext","先確認自己的名次 / 入場資料，再視需要看牌桌或計時器。")
		result["ctatext"]=sessionpagetext("roleconfirmedcta","查看我的資料")
		result["ctahref"]="#overview-general"
		result["focus"]=sessionpagetext("roleconfirmedfocus","你的首屏會優先展示個人結果與接下來要注意的資訊。")
		result["helper"]=sessionpagetext("roleconfirmedhelper","如果你已淘汰且可再入場，主動作會改成再入場。")
		return result
	}
	if(row["openregistration"]==true&&row["linkuser"]==true){
		result["status"]=sessionpagetext("roleopenstatus","目前開放報名")
		result["nextstep"]=sessionpagetext("roleopennext","先看規則與時間，確認沒問題後直接報名。")
		result["ctatext"]=sessionpagetext("roleopencta","立即報名")
		result["ctahref"]="#overview-general"
		result["focus"]=sessionpagetext("roleopenfocus","選手首屏會先把是否能報名和你接下來該做什麼講清楚。")
		result["helper"]=sessionpagetext("roleopenhelper","不需要先翻到手牌、設定或其他管理資訊。")
		return result
	}
	result["status"]=sessionpagetext("roleclosedstatus","目前未開放報名或尚未與選手報名連結")
	result["nextstep"]=sessionpagetext("roleclosednext","先確認開賽時間、報名條件與主辦公告。")
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
		<div class="text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-400">${sessionpagetext("tplyourrole","你的角色")}</div>
		<div class="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div class="min-w-0 flex-1">
				<div class="text-3xl font-extrabold tracking-tight text-white">${safehtml(roledata["role"])}</div>
				<div class="mt-2 text-sm leading-7 text-zinc-300">${safehtml(roledata["status"])}</div>
				<div class="mt-4 rounded-2xl border border-emerald-900/60 bg-black/20 px-4 py-4">
					<div class="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">${sessionpagetext("tplsuggestnext","建議下一步")}</div>
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
		{"label": sessionpagetext("infocurrentrole","目前身份"), "value": roledata["role"]},
		{"label": sessionpagetext("inforegstatus","報名狀態"), "value": row["myregistrationstatus"]||sessionpagetext("infonotregistered","未報名")},
		{"label": sessionpagetext("infotimer","計時器"), "value": row["linkuser"]==true?sessionpagetext("infotimerlinked","可連動"):sessionpagetext("infotimerunlinked","未連動")},
		{"label": sessionpagetext("inforegistration","報名"), "value": row["openregistration"]==true?sessionpagetext("inforegopen","開放中"):sessionpagetext("inforegclosed","未開放")}
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
		<div class="text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-400">${sessionpagetext("tplfocusnow","現在先看這些")}</div>
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
			sessionpagetext("guidehost1","先檢查目前是否開放報名、是否需要切去報名清單處理現場名單。"),
			sessionpagetext("guidehost2","若場次進行中，優先確認計時器與報名關閉狀態。"),
			sessionpagetext("guidehost3","需要調整規則時再進入其他設定，避免現場分心。")
		]
	}else if(row["accessrole"]=="floor"||row["accessrole"]=="assistant"){
		list=[
			sessionpagetext("guidestaff1","先確認當前關卡、剩餘人數與報名是否已關閉。"),
			sessionpagetext("guidestaff2","有現場節奏需要處理時，再進控制台執行操作。"),
			sessionpagetext("guidestaff3","若只需查看資訊，留在總覽即可，不必先進設定。")
		]
	}else if(row["isstaff"]==true){
		list=[
			sessionpagetext("guidehired1","先確認自己是以員工身份協助，不需要執行選手報名動作。"),
			sessionpagetext("guidehired2","查看目前場次狀態與座位 / 進度資訊。"),
			sessionpagetext("guidehired3","有需要再配合主辦進入對應工具頁。")
		]
	}else{
		list=[
			sessionpagetext("guideplayer1","先看目前是否開放報名與你的報名狀態。"),
			sessionpagetext("guideplayer2","已確認入場再看個人名次、座位與計時器資訊。"),
			sessionpagetext("guideplayer3","深層資料如手牌與其他設定放在後面，需要時再進去。")
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
		<div class="text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-400">${sessionpagetext("tplwhatnext","你下一步該做什麼")}</div>
		<div class="mt-2 text-sm leading-7 text-zinc-400">${safehtml(roledata["nextstep"])}</div>
		<div class="mt-4 grid grid-cols-1 gap-3">${html}</div>
	`
}

// 追隨主辦單位的入口。只有「別人的主辦場次」才顯示 ——
// 自己的場次與個人牌局紀錄都沒有追隨的對象。
// 標籤用協會名稱（row["clubname"]，本來就會回給每個看得到這場的人），
// **不顯示主辦者姓名**：全站沒有任何地方顯示「這場是誰主辦的」。
function rendersessionhostbar(row){
	let bar=domgetid("sessionhostbar")
	let button=domgetid("sessionfollowbutton")
	if(!bar||!button||!row){
		return
	}
	if(row["owned"]!=true||row["isown"]==true||!row["userid"]){
		addclass(bar,["hidden"])
		return
	}
	innertext("#sessionhostname",row["clubname"]||ptfollowtext("hostlabel","主辦單位"),false)
	removeclass(bar,["hidden"])
	sessionfollowtarget=null
	ptfollowloadlist(function(followlist){
		let followed=false
		if(followlist){
			for(let i=0;i<followlist.length;i=i+1){
				if(followlist[i]["followuserid"]==row["userid"]){
					sessionfollowtarget=followlist[i]
					followed=true
				}
			}
		}
		ptfollowapplybuttonstate(button,followed)
	})
}

function rendersessionquicklinks(row){
	let element=domgetid("sessionquicklinks")
	if(!element||!row){
		return
	}
	let html=""
	if(row["isown"]||row["isadmin"]){
		html=html+sessionquickbutton("register.html?sessionid="+sessionid,sessionpagetext("quickregisterdesk","報名工作台"),"bg-purple-600 hover:bg-purple-500")
		html=html+sessionquickbutton("control.html?sessionid="+sessionid,sessionpagetext("quicktimerconsole","計時器控制台"),"bg-emerald-600 hover:bg-emerald-500")
		html=html+sessionquickbutton("display.html?sessionid="+sessionid,sessionpagetext("quickdisplaypage","顯示頁"),"bg-sky-600 hover:bg-sky-500","_blank")
		html=html+sessionquickbutton("#other-settings",sessionpagetext("quicksessionsettings","場次設定"),"bg-zinc-800 hover:bg-zinc-700")
	}else if(row["accessrole"]=="floor"||row["accessrole"]=="assistant"){
		html=html+sessionquickbutton("control.html?sessionid="+sessionid,sessionpagetext("quickgotoconsole","前往控制台"),"bg-emerald-600 hover:bg-emerald-500")
		html=html+sessionquickbutton("display.html?sessionid="+sessionid,sessionpagetext("quickdisplaypage","顯示頁"),"bg-sky-600 hover:bg-sky-500","_blank")
		html=html+sessionquickbutton("#table-list",sessionpagetext("quickviewtable","查看牌桌"),"bg-zinc-800 hover:bg-zinc-700")
	}else{
		html=html+sessionquickbutton("#overview-general",sessionpagetext("quickoverview","總覽資訊"),"bg-emerald-600 hover:bg-emerald-500")
		html=html+sessionquickbutton("#table-list",sessionpagetext("quicktableseat","牌桌 / 座位"),"bg-zinc-800 hover:bg-zinc-700")
		html=html+sessionquickbutton("display.html?sessionid="+sessionid,sessionpagetext("quicktimerdisplay","計時器顯示"),"bg-sky-600 hover:bg-sky-500","_blank")
	}
	element.innerHTML=`
		<div class="text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-400">${sessionpagetext("tplquickentry","快速入口")}</div>
		<div class="mt-2 text-sm leading-7 text-zinc-400">${sessionpagetext("tplquickentryhint","把這個角色最常用的動作集中在這裡，避免同頁資訊過載。")}</div>
		<div class="mt-4 flex flex-wrap gap-3">${html}</div>
	`
}

function applydefaultsessionview(row){
	if(sessiondefaultviewapplieded||location.hash){
		return
	}
	sessiondefaultviewapplieded=true
	// 從手牌詳情返回(網址沒帶 hash)時, 預設停在「手牌」分頁而非總覽, 讓使用者回到原本看的地方
	if((document.referrer||"").indexOf("handdetail.html")>=0){
		let handstab=document.querySelector('.tab-btn[data-tab="hands"]')
		if(handstab){
			handstab.click()
			return
		}
	}
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
	let yes=sessionbooled(value)
	let cls=yes?"bg-emerald-500/15 text-emerald-300 border-emerald-500/40":"bg-zinc-700/40 text-zinc-400 border-zinc-600"
	let dot=yes?"bg-emerald-400":"bg-zinc-500"
	return `<span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${cls}"><span class="h-1.5 w-1.5 rounded-full ${dot}"></span>${yes?sessionpagetext("yes","是"):sessionpagetext("no","否")}</span>`
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
				<div><div class="text-[11px] text-zinc-500">${sessionpagetext("tplcount","次數")}</div><div class="text-sm font-semibold text-zinc-200">${safehtml(sessionrebuynumber(count))}</div></div>
				<div><div class="text-[11px] text-zinc-500">${sessionpagetext("tplbuyin","買入")}</div><div class="text-sm font-semibold text-zinc-200">${safehtml(sessionfeetext(buyin,fee))}</div></div>
				<div><div class="text-[11px] text-zinc-500">${sessionpagetext("tplchip","計分牌")}</div><div class="text-sm font-semibold text-zinc-200">${safehtml(sessionrebuynumber(chip))}</div></div>
			</div>
		</div>
	`
}

function sessiondisplayvalue(value){
	// **布林要用 typeof 判，不可以寫 value==false / value==true。**
	// JS 的鬆散比較讓 `0==false` 與 `1==true` 都成立，所以舊版把數值 0 顯示成「否」、
	// 數值 1 顯示成「是」，空字串也變成「否」。實際會看到的：
	//   買入 / 服務費 0 元 → 「否」（sessionmoneytext 走這一支，服務費 0 會印成 1000(1000+否)）
	//   保底獎金 0、票券價值 0 → 「否」
	//   前注 0、統計「已取消 0 人」→ 「否」；「已報名 1 人」→ 「是」
	//   場次說明沒填 → 「否」
	// 2026-08-07 使用者在場次「資訊」分頁看到地點顯示成「否」才追出來的。
	//
	// 真正的布林（ticketenabled 這類）走的是 sessionboolrow，不經過這裡；
	// 這裡保留 typeof 的布林分支只是防呆。
	if(typeof value=="boolean"){
		if(value){
			return sessionpagetext("yes","是")
		}
		return sessionpagetext("no","否")
	}
	// 空字串也要用 typeof 判 —— `0==""` 在 JS 裡同樣成立，
	// 寫成 `value==""` 會把數值 0 一起當成沒有值，服務費 0 就變成 1000(1000+-)。
	if(value==null||value==undefined){
		return "-"
	}
	if(typeof value=="string"&&value.trim()==""){
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

// 判斷用布林與顯示用文字必須分開：文字會隨語系變成 Yes/No，
// 若沿用 sessionbooltext(...)=="是" 這種比對，切英文後判斷就會全錯。
function sessionbooled(value){
	return value==true||value==1||value=="1"||value=="true"||value=="True"
}

function sessionbooltext(value){
	if(sessionbooled(value)){
		return sessionpagetext("yes","是")
	}
	return sessionpagetext("no","否")
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

function sessionyesbycounted(count,price,chip){
	return float(count||0)>0||float(price||0)>0||float(chip||0)>0
}

function sessionyesbycount(count,price,chip){
	if(sessionyesbycounted(count,price,chip)){
		return sessionpagetext("yes","是")
	}
	return sessionpagetext("no","否")
}

function sessionantetext(value){
	if(value=="ante"){
		return sessionpagetext("anteregular","前注")
	}
	return sessionpagetext("antebigblind","大盲前注")
}

// 「資訊」分頁（#othertab-orderinfo）。
//
// 這一頁的定位是**識別與分享**，不重複總覽已經有的遊戲方式 / 買入規則卡片
// （那些由 rendersessiondetailinfo 畫在 #sessiondetailinfo，屬於總覽區）。
//
// 特別值得做好的理由：selectsessionothertab() 對**沒有設定檢視權限的人**
// 會把分頁 fallback 到 orderinfo，所以這是非擁有者點進「其他」看到的第一個畫面。
// 舊版這裡只有一段除錯殘留（「場次id: #」與開發用詞 querykey），而且容器上掛了
// data-i18n，textContent 覆蓋把兩個 span 一起清掉，等於連那段殘留都顯示不完整。
function orderinforow(label,value,copytext){
	let copyhtml=""
	if(copytext){
		copyhtml=`<input type="button" class="orderinfocopy shrink-0 rounded-lg border border-emerald-600/60 bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-300 transition hover:bg-emerald-600/20" data-copy="${safehtml(copytext)}" value="${safehtml(sessionpagetext("orderinfocopy","複製"))}">`
	}
	return `
		<div class="flex items-center justify-between gap-3 border-b border-zinc-800 py-3 last:border-b-0">
			<div class="text-sm text-zinc-500">${safehtml(label)}</div>
			<div class="flex min-w-0 items-center gap-2">
				<div class="truncate text-sm font-semibold text-zinc-100">${safehtml(value)}</div>
				${copyhtml}
			</div>
		</div>
	`
}

// 文字欄位的顯示值：**沒有值就留白**，不要補「-」也不要補任何字。
//
// 刻意不用 sessiondisplayvalue()：那一支是給布林值用的，開頭是 `if(value==false)`，
// 而 JS 的 `""==false` 成立 —— 所以空字串會被顯示成「否」。
// 地點沒填時畫面出現「否」就是這樣來的。
function orderinfotext(value){
	if(value==null||value==undefined){
		return ""
	}
	return String(value)
}

function orderinfosection(title){
	return `<div class="mt-6 mb-1 text-xs font-bold uppercase tracking-wider text-zinc-500 first:mt-0">${safehtml(title)}</div>`
}

function rendersessionorderinfo(row){
	let element=domgetid("orderinfocontent")
	if(!element||!row){
		return
	}
	// 分享連結用當前網址的目錄組出來，不硬編網域 —— 測試機與正式機是不同網域，
	// 寫死其中一個會讓另一台複製到錯的連結。
	let sharelink=location.origin+location.pathname+"?id="+sessionid
	let html=""

	html=html+orderinfosection(sessionpagetext("orderinfoshare","識別與分享"))
	html=html+orderinforow(sessionpagetext("orderinfotoken","場次代碼"),orderinfotext(row["token"]),row["token"])
	html=html+orderinforow(sessionpagetext("orderinfolink","場次連結"),sharelink,sharelink)

	html=html+orderinfosection(sessionpagetext("orderinfobasic","基本資料"))
	html=html+orderinforow(sessionpagetext("orderinfoname","名稱"),orderinfotext(row["name"]),"")
	html=html+orderinforow(sessionpagetext("orderinfoclub","協會"),orderinfotext(row["clubname"]),"")
	html=html+orderinforow(sessionpagetext("orderinfoplace","地點"),orderinfotext(row["place"]),"")
	// 時間到分就好，秒沒有意義。ptformatdatetimeminute 取 ptformatdatetime 的前 16 字元，
	// 空值時兩支都回空字串，所以沒填的時間欄一樣是留白。
	html=html+orderinforow(sessionpagetext("orderinfostart","開始時間"),ptformatdatetimeminute(row["starttime"]),"")
	html=html+orderinforow(sessionpagetext("orderinfoend","結束時間"),ptformatdatetimeminute(row["endtime"]),"")
	html=html+orderinforow(sessionpagetext("orderinfocreate","建立時間"),ptformatdatetimeminute(row["createtime"]),"")

	html=html+orderinfosection(sessionpagetext("orderinfosystem","系統識別"))
	html=html+orderinforow(sessionpagetext("orderinfoid","場次編號"),sessionid,String(sessionid))
	html=html+`<div class="mt-2 text-xs leading-6 text-zinc-500">${safehtml(sessionpagetext("orderinfoidnote","回報問題時附上這個編號，可以更快找到這一場。"))}</div>`

	element.innerHTML=html
	onclick(".orderinfocopy",function(element,event){
		let text=dataset(element,"copy")
		if(!text){
			return
		}
		if(navigator.clipboard&&navigator.clipboard.writeText){
			navigator.clipboard.writeText(text).then(function(){
				pttoast(sessionpagetext("orderinfocopied","已複製到剪貼簿"),"success")
			}).catch(function(){
				pttoast(sessionpagetext("orderinfocopyfailed","複製失敗，請手動選取"),"warning")
			})
		}else{
			pttoast(sessionpagetext("orderinfocopyfailed","複製失敗，請手動選取"),"warning")
		}
	})
}

function rendersessiondetailinfo(row){
	if(!domgetid("sessiondetailinfo")){
		return
	}
	if(!row){
		return
	}
	let html=""
	html=html+sessioninfocard(sessionpagetext("cardgametype","遊戲方式"),sessiontypetext("limit",row["limittypeid"],row["limittypeid"])+sessiontypetext("stack",row["stacktypeid"],row["stacktypeid"])+sessionpagetext("chipunit","碼")+sessiontypetext("game",row["gametypeid"],row["gametype"]),"text-center")
	html=html+sessioninfocard(sessionpagetext("cardeventtype","賽事細項"),sessiontypetext("event",row["eventtypeid"],row["eventtypeid"]),"text-center")
	html=html+sessioninfocard(sessionpagetext("cardmaxseat","每桌座位"),sessiondisplayvalue(row["maxseat"]),"text-center")
	html=html+sessioninfocard(sessionpagetext("cardantemode","前注模式"),sessionantetext(row["antemode"]),"text-center")
	html=html+sessioninfocard(sessionpagetext("cardbuyinfee","買入(服務費)"),sessionfeetext(row["buyin"],row["buyinfee"]),"text-center")
	html=html+sessioninfocard(sessionpagetext("cardbuyinchip","買入計分牌"),sessionmoneytext(row["chip"]),"text-center")
	html=html+sessioninfocard(sessionpagetext("cardticketvalue","票券價值"),sessionmoneytext(row["ticketvalue"]),"text-center")
	html=html+sessioninfocard(sessionpagetext("cardguaranteed","保底獎金"),sessionmoneytext(row["guaranteedprize"]),"text-center")

	html=html+sessionsectiontitle(sessionpagetext("sectionbuyinrule","買入規則"))
	html=html+`<div class="col-span-1 sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-2">`
	html=html+sessionrebuycard(sessionpagetext("rulereentry","可再入"),sessionyesbycounted(row["reentrycount"],row["reentrybuyin"],row["reentrychip"]),row["reentrycount"],row["reentrybuyin"],row["reentryfee"],row["reentrychip"])
	html=html+sessionrebuycard(sessionpagetext("rulerebuy","可重買"),sessionyesbycounted(row["rebuycount"],row["rebuybuyin"],row["rebuychip"]),row["rebuycount"],row["rebuybuyin"],row["rebuyfee"],row["rebuychip"])
	html=html+sessionrebuycard(sessionpagetext("ruleaddon","可增購"),sessionyesbycounted(row["addoncount"],row["addonbuyin"],row["addonchip"]),row["addoncount"],row["addonbuyin"],row["addonfee"],row["addonchip"])
	html=html+`</div>`

	html=html+sessionsectiontitle(sessionpagetext("sectionsessionsetting","場次設定"))
	html=html+sessionsettingspanel([
		[sessionpagetext("setticketenabled","允許票券"),row["ticketenabled"]],
		[sessionpagetext("setregclosed","報名截止"),row["regclosed"]],
		[sessionpagetext("setlinkuser","使用者連結"),row["linkuser"]],
		[sessionpagetext("setopenregistration","開放報名"),row["openregistration"]],
		[sessionpagetext("setprivate","私人牌局"),row["private"]],
		[sessionpagetext("setsessionended","場次結束"),row["sessionended"]],
		[sessionpagetext("setunifiedhand","統一手牌紀錄"),row["unifiedhandrecord"]],
		[sessionpagetext("setautostart","依時間自動開始"),row["autostartbytime"]]
	])
	innerhtml("#sessiondetailinfo",html,false)
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
	let payment=registration["paymenttype"]=="ticket"?sessionpagetext("paymentticket","票券"):sessionpagetext("paymentcash","現金")
	return `
		${sessioninfocard(sessionpagetext("cardmyentry","我的入場"),cost+" ("+payment+")","")}
		${sessioninfocard(sessionpagetext("cardmyplace","我的名次"),place+" / "+totalbuyin,"")}
		${sessioninfocard(sessionpagetext("cardmyprize","我的獎金"),prize,"")}
		${sessioninfocard(sessionpagetext("cardmyprofit","我的盈虧"),(0<=profit?"+":"")+profit,profitclass)}
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
			<a href="structureedit.html?sessionid=${sessionid}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold">${sessionpagetext("tplmodifystructure","修改結構")}</a>
		`
	}
	return `
		<a href="structure.html?sessionid=${sessionid}" class="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-sm font-semibold">${sessionpagetext("tplviewstructure","查看結構")}</a>
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
		return "Lv."+level+sessionpagetext("levelbreak","休息")
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
			<input type="number" min="1" inputmode="numeric" class="bg-zinc-700 text-white rounded px-3 py-2" id="tablesearch" placeholder="${sessionpagetext("tpltablenoplaceholder","牌桌編號")}">
			<input type="button" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded" id="tablesearchbutton" value="${sessionpagetext("tplsearch","搜尋")}">
			<a href="newtable.html" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" id="newtable">${sessionpagetext("tpladdtable","新增牌桌")}</a>
			<input type="button" class="hidden bg-red-600 hover:bg-red-700 px-4 py-2 rounded cursor-pointer" id="deletetable" value="${sessionpagetext("tpldeletealltable","刪除所有牌桌")}">
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
	let namehead=domgetid("sessiontablenamehead")
	if(namehead){
		namehead.textContent=sessionpagetext("tablenoheader","牌桌編號")
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
		<div class="text-zinc-400">${sessionpagetext("tplshow","顯示")} ${start}-${end} / ${total}</div>
		<div class="flex items-center gap-2">
			<input type="button" class="tablepagebtn bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded" data-page="${sessiontablepage-1}" ${sessiontablepage<=1?"disabled":""} value="${sessionpagetext("tplprevpage","上一頁")}">
			<span class="text-zinc-300">${sessiontablepage} / ${totalpage}</span>
			<input type="button" class="tablepagebtn bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded" data-page="${sessiontablepage+1}" ${totalpage<=sessiontablepage?"disabled":""} value="${sessionpagetext("tplnextpage","下一頁")}">
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
	rows=ptsortlist(rows,sessiontablesortstate["key"],sessiontablesortstate["ascended"],sessiontablesortvalue)
	ptsortarrow("#sessiontablehead",sessiontablesortstate["key"],sessiontablesortstate["ascended"])
	let totalpage=Math.max(1,Math.ceil(rows.length/sessiontablepagesize))
	if(totalpage<sessiontablepage){
		sessiontablepage=totalpage
	}
	let start=(sessiontablepage-1)*sessiontablepagesize
	let end=Math.min(rows.length,start+sessiontablepagesize)
	let html=""
	for(let i=start;i<end;i=i+1){
		let tableurl=`table.html?id=${rows[i]["id"]}`
		let closed=rows[i]["closedtime"]?true:false
		let closedbadge=""
		if(closed){
			closedbadge=` <span class="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-300">${smt("closedbadge","已關閉")}</span>`
		}
		let managehtml=""
		if(sessioncanmanagetable()){
			// 併桌/關閉權限比照後端 tableowneraccess: 擁有者或管理員 (聘用人員不可)
			managehtml=`
				<input type="button" class="mergetablebtn text-amber-400 hover:underline" data-id="${rows[i]["id"]}" value="${smt("mergebutton","併桌")}">
				<input type="button" class="closetablebtn ${closed?"text-emerald-400":"text-zinc-300"} hover:underline" data-id="${rows[i]["id"]}" data-closed="${closed?"1":""}" value="${closed?smt("openbutton","重新開啟"):smt("closebutton","關閉牌桌")}">
			`
		}
		html=html+`
			<tr class="hover:bg-zinc-700 transition cursor-pointer sessiontablerow" data-url="${tableurl}">
				<td class="relative py-2 px-2">${safehtml(sessiontableno(rows[i]))}${closedbadge}<a href="${tableurl}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2">
					${
						tablelinked||!canviewsessionsettings(currentsession)?`
							${managehtml||"-"}${managehtml?"":`<a href="${tableurl}" class="rowlink absolute inset-0 z-10"></a>`}
						`:`
							<a href="edittable.html?id=${rows[i]["id"]}" class="text-blue-400 hover:underline">${sessionpagetext("tpledit","編輯")}</a>
							<input type="button" class="text-red-400 hover:underline deletetable" data-id="${rows[i]["id"]}" value="${sessionpagetext("tpldelete","刪除")}">
							${managehtml}
						`
					}
				</td>
			</tr>
		`
	}
	if(!html){
		html=`<tr><td colspan="2" class="py-6 text-zinc-500 text-center">${sessionpagetext("tplnotable","查無牌桌")}</td></tr>`
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
		ptconfirm(sessionpagetext("confirmdelete","確定刪除?"),function(){
			event.preventDefault()
			event.stopPropagation()

			element.disabled=true

			ajax("DELETE",AJAXURL+"deletetable/"+dataset(element,"id"),function(event,data){
				if(data["success"]){
					pttoast(sessionpagetext("deletesuccess","刪除成功"),"success")
					for(let i=0;i<sessiontables.length;i=i+1){
						if(String(sessiontables[i]["id"])==String(dataset(element,"id"))){
							sessiontables.splice(i,1)
							break
						}
					}
					rendersessiontablelist()
				}else{
					pttoast(sessionpagetext("deletefail","刪除失敗"),"error")
					element.disabled=false
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	})
	onclick(".mergetablebtn",function(element,event){
		opensessiontablemerge(dataset(element,"id"))
	})
	onclick(".closetablebtn",function(element,event){
		let tableid=dataset(element,"id")
		let closed=dataset(element,"closed")?false:true
		let table=findsessiontable(tableid)
		let label=table?String(sessiontableno(table)):""
		if(closed){
			ptconfirm(smt("closeconfirm","確定要關閉「{table}」嗎？關閉後不會再有新選手進入此桌。").replace("{table}",safehtml(label)),function(okayed){
				if(!okayed){
					return
				}
				callsessiontableclosed(tableid,true,element)
			})
		}else{
			callsessiontableclosed(tableid,false,element)
		}
	})
	rendersessiontablepager(rows.length)
}

// 本頁的動態文案（TASK-006 批次 9）。與專案其他頁一致：先查 translate.js 的 sessionpage，
// 查不到才用 fallback。命名刻意不叫 sessiontext —— sessionlist.js 已經用了那個名字，
// 雖然兩支不會同時載入，但同名不同義容易誤讀。
function sessionpagetext(key,fallback){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["sessionpage"]&&TRANSLATE[LANGUAGE]["sessionpage"][key]!=undefined){
		return TRANSLATE[LANGUAGE]["sessionpage"][key]
	}
	return fallback
}

function smt(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["tablemanage"]&&TRANSLATE[LANGUAGE]["tablemanage"][key]){
		return TRANSLATE[LANGUAGE]["tablemanage"][key]
	}
	return fallback
}

function sessioncanmanagetable(){
	if(!currentsession){
		return false
	}
	if(currentsession["isown"]||currentsession["isadmin"]){
		return true
	}
	return false
}

function findsessiontable(tableid){
	for(let i=0;i<sessiontables.length;i=i+1){
		if(String(sessiontables[i]["id"])==String(tableid)){
			return sessiontables[i]
		}
	}
	return null
}

function callsessiontableclosed(tableid,closed,element){
	if(element){
		element.disabled=true
	}
	ajax("POST",AJAXURL+"closetable/"+tableid,function(event,data){
		if(element){
			element.disabled=false
		}
		if(data["success"]){
			pttoast(closed?smt("closesuccess","已關閉牌桌"):smt("opensuccess","已重新開啟牌桌"),"success")
			loadsessiondata(true)
		}else{
			pttoast(pterror(data["data"]||smt("togglefail","操作失敗")),"error")
		}
	},str({
		"closed": closed
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#tablemain"
	})
}

function opensessiontablemerge(sourceid){
	// 空位數要用實際入座狀況計算, gettablelist 沒帶, 改抓多牌桌總覽看板資料
	ajax("GET",AJAXURL+"getsessiontableboard/"+sessionid,function(event,data){
		if(!data["success"]){
			pttoast(pterror(data["data"]||smt("loadfail","載入牌桌資料失敗")),"error")
			return
		}
		let boardtables=(data["data"]||{})["tables"]||[]
		let source=null
		for(let i=0;i<boardtables.length;i=i+1){
			if(String(boardtables[i]["id"])==String(sourceid)){
				source=boardtables[i]
			}
		}
		if(!source){
			pttoast(pterror("ERROR_table_not_found"),"error")
			return
		}
		let sourcelabel=String(source["name"]||source["no"]||source["id"])
		let sourcecount=int(source["occupied"]||0)
		let old=domgetid("tablemergemodal")
		if(old){
			ptremovescrollcover(old)
		}
		let optionhtml=""
		for(let i=0;i<boardtables.length;i=i+1){
			let table=boardtables[i]
			if(String(table["id"])==String(sourceid)||table["closed"]){
				continue
			}
			let empty=int(table["empty"]||0)
			let enough=sourcecount<=empty
			let optiontext=String(table["name"]||table["no"]||table["id"])+"　"+smt("emptycount","{n} 空位").replace("{n}",empty)
			if(!enough){
				optiontext=optiontext+"　"+smt("mergeinsufficient","空位不足")
			}
			optionhtml=optionhtml+`<input type="button" class="tablemergetargetbtn w-full text-left bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 rounded px-3 py-2 text-sm" data-id="${safehtml(table["id"])}" value="${safehtml(optiontext)}" ${enough?"":"disabled"}>`
		}
		if(!optionhtml){
			optionhtml=`<div class="text-sm text-zinc-500">${smt("mergenotarget","沒有可併入的開放牌桌")}</div>`
		}
		let cover=doccreate("div")
		cover.id="tablemergemodal"
		cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
		cover.innerHTML=`
			<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-5 shadow-xl">
				<div class="flex items-center justify-between mb-4">
					<div class="text-lg font-semibold text-white">${smt("mergetitle","併桌：選擇目標牌桌")}</div>
					<input type="button" class="closetablemerge text-zinc-400 hover:text-white" value="×">
				</div>
				<div class="text-sm text-zinc-400 mb-4">${smt("mergedesc","把「{table}」的所有選手併到選定的目標桌，併桌後本桌會自動關閉。").replace("{table}",safehtml(sourcelabel))}</div>
				<div class="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto">${optionhtml}</div>
				<div class="flex justify-end gap-2 mt-5">
					<input type="button" class="closetablemerge bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded" value="${smt("cancel","取消")}">
				</div>
			</div>
		`
		ptlockpagescroll()
		document.body.appendChild(cover)
		onclick(".closetablemerge",function(element,event){
			ptremovescrollcover(domgetid("tablemergemodal"))
		})
		onclick(".tablemergetargetbtn",function(element,event){
			let targetid=dataset(element,"id")
			let target=null
			for(let i=0;i<boardtables.length;i=i+1){
				if(String(boardtables[i]["id"])==String(targetid)){
					target=boardtables[i]
				}
			}
			let targetlabel=target?String(target["name"]||target["no"]||target["id"]):""
			ptconfirm(smt("mergeconfirm","確定要把「{source}」的所有選手併到「{target}」嗎？併桌後「{source}」會自動關閉。").replace(/\{source\}/g,safehtml(sourcelabel)).replace("{target}",safehtml(targetlabel)),function(okayed){
				if(!okayed){
					return
				}
				sessionmergetableto(sourceid,targetid)
			})
		})
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function sessionmergetableto(sourceid,targetid){
	ajax("POST",AJAXURL+"mergetableplayers/"+sourceid,function(event,data){
		if(data["success"]){
			let modal=domgetid("tablemergemodal")
			if(modal){
				ptremovescrollcover(modal)
			}
			let movedata=data["data"]||{}
			// 併桌=拆桌: 成功後自動關閉來源桌, 之後不該再有人進來
			ajax("POST",AJAXURL+"closetable/"+sourceid,function(event,closedata){
				if(closedata["success"]){
					opensessionmergeresult(movedata,true)
				}else{
					pttoast(smt("mergeclosefail","併桌完成，但自動關閉來源桌失敗，請手動關閉"),"warning")
					opensessionmergeresult(movedata,false)
				}
				loadsessiondata(true)
			},str({
				"closed": true
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		}else{
			pttoast(pterror(data["data"]||smt("mergefail","併桌失敗")),"error")
		}
	},str({
		"targettableid": int(targetid)
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#tablemergemodal"
	})
}

function opensessionmergeresult(movedata,closeded){
	let old=domgetid("tablemergeresultmodal")
	if(old){
		ptremovescrollcover(old)
	}
	let sourcelabel=String(movedata["sourcetablename"]||movedata["sourcetableno"]||"")
	let targetlabel=String(movedata["targettablename"]||movedata["targettableno"]||"")
	let moves=movedata["moves"]||[]
	let rowhtml=""
	for(let i=0;i<moves.length;i=i+1){
		let move=moves[i]
		let playeridhtml=""
		if(move["playerid"]){
			playeridhtml=` <span class="text-sm font-normal text-zinc-400">(${safehtml(move["playerid"])})</span>`
		}
		rowhtml=rowhtml+`
			<div class="flex items-center justify-between gap-3 border-t border-zinc-800 py-2">
				<div class="min-w-0 truncate text-lg font-bold text-white">${safehtml(move["playername"]||"-")}${playeridhtml}</div>
				<div class="shrink-0 font-mono text-xl font-extrabold text-emerald-400">${safehtml(movedata["sourcetableno"])}-${safehtml(move["fromseatno"])} → ${safehtml(move["totableno"])}-${safehtml(move["toseatno"])}</div>
			</div>
		`
	}
	if(!rowhtml){
		rowhtml=`<div class="py-3 text-sm text-zinc-400">${smt("resultempty","此次併桌沒有需要移動的選手。")}</div>`
	}
	let closedhtml=""
	if(closeded){
		closedhtml=`<div class="mt-3 text-xs text-amber-300">${smt("resultclosed","「{source}」已自動關閉，不會再有新選手進入。").replace("{source}",safehtml(sourcelabel))}</div>`
	}
	let cover=doccreate("div")
	cover.id="tablemergeresultmodal"
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-5 shadow-xl">
			<div class="text-lg font-semibold text-white mb-4">${smt("resulttitle","「{source}」併入「{target}」").replace("{source}",safehtml(sourcelabel)).replace("{target}",safehtml(targetlabel))}</div>
			<div class="max-h-[50vh] overflow-y-auto">${rowhtml}</div>
			${closedhtml}
			<div class="flex justify-end gap-2 mt-5">
				<input type="button" class="closemergeresult bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded font-semibold" value="${smt("resultclose","關閉")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(cover)
	onclick(".closemergeresult",function(element,event){
		ptremovescrollcover(domgetid("tablemergeresultmodal"))
	})
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
			"text": sessionpagetext("statusended","End (已結束)"),
			"class": "text-zinc-300 border-zinc-500 bg-zinc-700/40"
		}
	}
	if(row["openregistration"]==false){
		return {
			"key": "running",
			"text": sessionpagetext("statusrunning","Running (進行中)"),
			"class": "text-sky-300 border-sky-500/50 bg-sky-500/10"
		}
	}
	if(!sessionregistrationopened(row)){
		return {
			"key": "running",
			"text": sessionpagetext("statusrunning","Running (進行中)"),
			"class": "text-sky-300 border-sky-500/50 bg-sky-500/10"
		}
	}
	return {
		"key": "latereg",
		"text": sessionpagetext("statuslatereg","Late Reg. (報名中)"),
		"class": "text-emerald-300 border-emerald-500/50 bg-emerald-500/10"
	}
}

function sessionstatushtml(row){
	let status=sessionstatusdata(row)
	let text=status["text"]
	if(status["key"]=="latereg"){
		text=sessionpagetext("badgelatereg","報名中")
	}else if(status["key"]=="running"){
		text=sessionpagetext("badgerunning","進行中")
	}else if(status["key"]=="end"){
		text=sessionpagetext("badgeended","已結束")
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
		pttoast(sessionpagetext("loadslow","載入時間較久, 請檢查連線後重試"),"warning")
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
			return sessionpagetext("rankadvancedwith","已晉級 (")+advancechip+")"
		}
		return sessionpagetext("statusadvanced","已晉級")
	}
	if(item["status"]=="active"){
		return sessionpagetext("rankrunning","進行中...")
	}
	return sessionpagetext("rankbusted","已淘汰")
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
		innerhtml("#sessionplayerscontent",`<div class="text-zinc-400 text-sm">${sessionpagetext("tplsessionloading","場次資料載入中...")}</div>`,false)
		return
	}
	if(!currentsession["linkuser"]){
		innerhtml("#sessionplayerscontent",`
			<div class="text-lg font-semibold mb-2">${sessionpagetext("tplseat","座位")}</div>
			<div class="text-zinc-400 text-sm">${sessionpagetext("tplnolinkedplayer","此場次沒有開啟關聯選手。")}</div>
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
		let myhtml=`<div class="text-zinc-400 text-sm">${sessionpagetext("tplnoseathint","尚未找到你的座位。若已報名，請等待主辦確認並排座。")}</div>`
		if(myseat){
			myhtml=`
				<div class="inline-flex flex-wrap items-center gap-2 bg-emerald-900/30 border border-emerald-700 rounded px-3 py-2">
					<span class="text-emerald-300 font-semibold">${sessionpagetext("tplmyseat","我的座位")}</span>
					<span>${sessionplayerseattext(myseat)}</span>
				</div>
			`
		}else if(currentsession["myregistrationstatus"]=="registered"){
			myhtml=`<div class="text-yellow-300 text-sm">${sessionpagetext("tplregisteredwait","你已報名，等待主辦確認。")}</div>`
		}
		let html=`
			<div class="flex flex-wrap justify-between gap-3 mb-4">
				<div>
					<div class="text-lg font-semibold">${sessionpagetext("tplseat","座位")}</div>
					<div class="text-sm text-zinc-400">${sessionpagetext("tplcurrent","目前")} ${tablekeys.length} ${sessionpagetext("tpltableslash","桌 /")} ${activecount} ${sessionpagetext("tplplayercount","位選手")}</div>
				</div>
				${myhtml}
			</div>
			<div class="flex flex-wrap gap-2 items-center mb-4">
				<input id="sessionplayersearch" class="bg-zinc-700 text-white rounded px-3 py-2 text-sm min-w-[240px]" value="${keyword}" placeholder="${sessionpagetext("tplsearchplayertable","查詢選手名稱 / ID / 牌桌")}">
			</div>
		`
		if(tablekeys.length==0){
			html=html+`<div class="text-zinc-500 text-sm">${sessionpagetext("tplnomatchlinked","目前沒有符合條件的關聯選手。")}</div>`
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
					<div class="text-lg font-semibold">${sessionpagetext("tplplace","名次")}</div>
					<div class="text-sm text-zinc-400">${sessionpagetext("tpltotalprize","總獎金")} ${sessionmoney(cashprize)} ${sessionpagetext("tploriginalprize","/ 原獎池")} ${sessionmoney(pool)} / Entries ${state["totalEntries"]||0}</div>
				</div>
			</div>
		`
		if(payouts.length==0&&otherrewardlist.length==0){
			html=html+`<div class="text-zinc-500 text-sm">${sessionpagetext("tplnopayout","目前沒有 payout 設定。")}</div>`
		}else{
			// 名次列與其他獎勵列合併在同一張表; 其他獎勵的「名次」那格顯示主辦自訂的標籤文字。
			html=html+`
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-zinc-700 text-zinc-300">
								<th class="py-2 px-2 text-left">${sessionpagetext("tplplace","名次")}</th>
								<th class="py-2 px-2 text-right">${sessionpagetext("tplprize","獎項")}</th>
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
					<div class="font-semibold text-zinc-100">${sessionpagetext("tplplayerstatusprize","選手狀態與獎金")}</div>
					<input id="sessionpayoutsearch" class="bg-zinc-700 text-white rounded px-3 py-2 text-sm w-full sm:w-72" value="${keyword}" placeholder="${sessionpagetext("tplsearchplayerfull","查詢選手 / ID / 桌位 / 名次")}">
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-zinc-700 text-zinc-300">
								<th class="py-2 px-2 text-left">${sessionpagetext("tplplayer","選手")}</th>
								<th class="py-2 px-2 text-left">${sessionpagetext("tplseatpos","桌位")}</th>
								<th class="py-2 px-2 text-left">${sessionpagetext("tplplace","名次")}</th>
								<th class="py-2 px-2 text-right">${sessionpagetext("tplprize","獎項")}</th>
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
					<td class="py-3 px-2 text-zinc-500" colspan="4">${sessionpagetext("tplnolinkedplayernow","目前沒有關聯選手。")}</td>
				</tr>
			`
		}
		for(let i=0;i<players.length;i=i+1){
			let item=players[i]
			let advanceded=item["registrationstatus"]=="advanced"
			let activeed=item["status"]=="active"&&!advanceded
			let place=int(item["place"]||0)
			let ranktext=sessionpagetext("rankbusted","已淘汰")
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
					ranktext=sessionpagetext("rankrunning","進行中...")
					rankclass="text-emerald-300"
				}
			}else if(advanceded){
				let advancechip=int(item["advancechip"]||0)
				if(advancechip){
					ranktext=sessionpagetext("rankadvancedwith","已晉級 (")+advancechip+")"
				}else{
					ranktext=sessionpagetext("rankadvanced","已晉級")
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
					<td class="py-3 px-2 text-zinc-500" colspan="4">${sessionpagetext("tplnomatchplayer","目前沒有符合條件的選手。")}</td>
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

		rendersessionorderinfo(row)
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
		rendersessionhostbar(row)
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
			${sessioninfocard(sessionpagetext("cardvenue","地點"),row["clubname"]||"-","text-center")}
			${sessioninfocard(sessionpagetext("cardgametypelabel","遊戲類型"),TRANSLATE[LANGUAGE]["gametype"][row["gametype"]]||"-","text-center")}
			${sessioninfocard(sessionpagetext("cardprofit","盈虧"),profittext,profitclass+" text-center")}
			${sessioninfocard(sessionpagetext("cardplace","名次"),placetext+(row["multidayremaining"]?" ("+row["multidayremaining"]+")":""),"text-center")}
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
						ptconfirm(sessionpagetext("confirmdeleteforever","確定刪除? 此操作無法復原!"),function(){
							event.preventDefault()
							event.stopPropagation()

							element.disabled=true

							ajax("DELETE",AJAXURL+"deletetable/"+row[0]["id"],function(event,data){
								if(data["success"]){
									pttoast(sessionpagetext("deletesuccess","刪除成功"),"success")
									href("")
								}else{
									pttoast(sessionpagetext("deletefail","刪除失敗"),"error")
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
				innerhtml("#tablemain",`${sessionpagetext("tpltablesearcherror","查詢牌桌時遭遇錯誤")}`,false)
				addclass("#tablemain",["text-red-500","text-center","font-bold","my-1","text-lg"])
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		],tablemainoptions)
	}else if(!silent){
		// silent=true 為背景自動更新, 查詢失敗時本輪靜默略過, 不 toast 也不強制跳轉離開頁面
		pttoast(sessionpagetext("sessionnotfound","查無指定場次"),"error")
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
		title.textContent=sessionpagetext("titlemyrecord","個人紀錄")
		let edithtml=""
		if(row["isown"]||row["isadmin"]){
			edithtml=`<input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold" data-sessionjump="#other-settings-result" value="${sessionpagetext("tpledit","編輯")}">`
		}
		btns.innerHTML=`
			${edithtml}
			${getstructurebuttonhtml(row)}
		`
		hint.textContent=sessionpagetext("hintmyrecord","可快速修改重購次數、名次、總買入等個人場次結果。")
		return
	}

	if(row["isown"]||row["isadmin"]){
		// 主辦人視角
		title.textContent=sessionpagetext("titlehostaction","主辦操作")
		let buttonshtml=`
			<a href="control.html?sessionid=${sessionid}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold">${sessionpagetext("tpltimerconsole","🎛️ 計時器控制台")}</a>
			<a href="display.html?sessionid=${sessionid}" target="_blank" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold">${sessionpagetext("tpldisplaypage","📺 顯示頁 (新分頁)")}</a>
			${getstructurebuttonhtml(row)}
		`
		if(row["linkuser"]){
			// 報到核對連 scan.html 而不是 checkin.html：checkin 需要單一報名 id
			// （收據 QR 上的 r，或入場編號 entry），從場次頁進去沒有那個值。
			// scan.html 才是場次層級的入口 —— 相機掃描或手動輸入入場編號，
			// 兩條路都會轉到 checkin.html，而且帶 sessionid 進去可以預選這一場。
			buttonshtml=buttonshtml+`
				<a href="register.html?sessionid=${sessionid}" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-semibold">${sessionpagetext("tplregisterlist","👥 報名清單")}</a>
				<a href="scan.html?sessionid=${sessionid}" class="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded text-sm font-semibold">${sessionpagetext("tplcheckin","✅ 報到核對")}</a>
			`
			hint.textContent=sessionpagetext("linkopened","本場次已開放關聯使用者報名")
		}else{
			hint.textContent=sessionpagetext("linkclosed","本場次未開放關聯使用者報名")
		}
		btns.innerHTML=buttonshtml
		return
	}

	// 非主辦人, 看是不是開放報名
	if(row["accessrole"]=="floor"||row["accessrole"]=="assistant"){
		title.textContent="Staff Actions"
		// 報到核對對現場人員比對主辦更重要 —— 排隊報到本來就是裁判／助理在做的。
		// 只有開放報名的場次才有東西可以核對。
		let staffcheckinhtml=""
		if(row["linkuser"]){
			staffcheckinhtml=`<a href="scan.html?sessionid=${sessionid}" class="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded text-sm font-semibold">${sessionpagetext("tplcheckin","✅ 報到核對")}</a>`
		}
		btns.innerHTML=`
			${sessionstatushtml(row)}
			<a href="control.html?sessionid=${sessionid}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold">Timer Control</a>
			<a href="display.html?sessionid=${sessionid}" target="_blank" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold">Display</a>
			${staffcheckinhtml}
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
		<a href="display.html?sessionid=${sessionid}" target="_blank" class="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-sm font-semibold">${sessionpagetext("tplshowtimer","顯示計時器")}</a>
	`

	if(row["isstaff"]==true){
		title.textContent=sessionpagetext("titlehired","已聘用")
		btns.innerHTML=`
			${sessionstatushtml(row)}
			${displaylink}
			${getstructurebuttonhtml(row)}
		`
		hint.textContent=sessionpagetext("hintstaffnoreg","已聘用員工不能報名此場次。")
		return
	}

	title.textContent=sessionpagetext("titleregister","報名")
	let mystatus=row["myregistrationstatus"]
	let status=sessionstatusdata(row)
	// 報名成功後，選手自己也要能開報到核對頁 —— 原本只有主辦與現場人員有入口。
	// 選手連的是**自己那一筆**（checkin.html?sessionid=&r=），與收據 QR 掃出來的是同一頁；
	// 不是 scan.html（那是工作人員掃別人的，選手用不到也不該用）。
	let mycheckinhtml=""
	if(row["myregistration"]&&row["myregistration"]["id"]){
		mycheckinhtml=`<a href="checkin.html?sessionid=${safehtml(sessionid)}&r=${safehtml(row["myregistration"]["id"])}" class="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded text-sm font-semibold">${sessionpagetext("tplmycheckin","✅ 我的報到核對")}</a>`
	}
	let reentryed=false
	if(mystatus=="confirmed"&&row["myregistration"]&&row["myregistration"]["timerstatus"]=="eliminated"&&(int(row["reentrycount"]||0)<=0||int(row["myregistration"]["reentrycount"]||0)<int(row["reentrycount"]||0))){
		reentryed=true
	}

	if(mystatus=="registered"){
		btns.innerHTML=`
			${sessionstatushtml(row)}
			${displaylink}
			<span class="text-yellow-400 font-semibold">${sessionpagetext("tplbadgeregistered","⏳ 已報名, 等待主辦確認")}</span>
			${mycheckinhtml}
			<input type="button" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold" id="unregisterbtn" value="${sessionpagetext("tplunregister","取消報名")}">
		`
	}else if(mystatus=="confirmed"){
		btns.innerHTML=`
			${sessionstatushtml(row)}
			${displaylink}
			<span class="text-green-400 font-semibold">${sessionpagetext("tplbadgeconfirmed","✅ 已確認入場")}</span>
			${mycheckinhtml}
			<input type="button" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold" id="unregisterbtn" value="${sessionpagetext("tplunregister","取消報名")}">
		`
		if(reentryed&&status["key"]=="latereg"){
			btns.innerHTML=`
				${sessionstatushtml(row)}
				${displaylink}
				<span class="text-zinc-400 font-semibold">${sessionpagetext("tplbusted","已淘汰")}</span>
				${mycheckinhtml}
				<input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold" id="registerbtn" value="${sessionpagetext("tplreregister","重新報名 / 再入")}">
			`
		}
	}else if(status["key"]!="latereg"){
		btns.innerHTML=`
			${sessionstatushtml(row)}
			${displaylink}
		`
		hint.textContent=sessionpagetext("hintregclosed","目前未開放報名。")
	}else{
		btns.innerHTML=`
			${sessionstatushtml(row)}
			${displaylink}
			<input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold" id="registerbtn" value="${sessionpagetext("tplregisterthis","報名此場次")}">
		`
	}

	onclick("#registerbtn",function(element,event){
		element.disabled=true
		ajax("POST",AJAXURL+"registersession/"+sessionid,function(event,data){
			if(data["success"]){
				pttoast(sessionpagetext("registersuccess","報名成功，等待主辦確認"),"success")
				location.reload()
			}else{
				let msg=data["data"]
				if(msg=="ERROR_already_registered"){
					msg=sessionpagetext("erralreadyregistered","您已經報名過了")
				}else if(msg=="ERROR_cannot_register_own_session"){
					msg=sessionpagetext("errownsession","不能報名自己主辦的場次")
				}else if(msg=="ERROR_staff_cannot_register"){
					msg=sessionpagetext("errstaffnoreg","已聘用員工不能報名此場次")
				}else if(msg=="ERROR_session_ended"){
					msg=sessionpagetext("errsessionended","此場次已結束")
				}else if(msg=="ERROR_session_not_open_for_registration"){
					msg=sessionpagetext("errregclosed","此場次未開放報名")
				}
				pttoast(msg||"未知錯誤","error")
				element.disabled=false
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	})

	onclick("#unregisterbtn",function(element,event){
		ptconfirm(sessionpagetext("confirmcancelreg","確定要取消報名嗎?"),function(){
			element.disabled=true
			ajax("POST",AJAXURL+"unregistersession/"+sessionid,function(event,data){
				if(data["success"]){
					pttoast(sessionpagetext("cancelregdone","已取消報名"),"success")
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

// 下拉只列出使用者自己的調色盤。若這個計分牌已存的顏色不在調色盤裡（例如預設牌組用的
// #ef4444 #f59e0b #22c55e #3b82f6，早期使用者的調色盤沒有這幾色），沒有任何 option 會被
// selected，瀏覽器就會落在第一個選項 —— 使用者只是打開場次設定再按儲存，顏色就被靜默改掉了。
// 所以這裡把「目前這個值」補成一個選項，確保它一定選得到、也一定存得回去。
// profile.js 的同名函式有同樣的處理，兩邊要一起改。
function chipcoloroptions(selected){
	let html=""
	let matched=false
	for(let i=0;i<userchipcolors.length;i=i+1){
		let color=userchipcolors[i]["color"]
		let name=userchipcolors[i]["name"]||color
		if(String(selected).toLowerCase()==String(color).toLowerCase()){
			matched=true
		}
		html=html+`<option value="${safehtml(color)}" ${String(selected).toLowerCase()==String(color).toLowerCase()?"selected":""}>${safehtml(name)}</option>`
	}
	if(!matched&&selected){
		// 放在最前面而不是最後面：它是目前生效的值，排在第一個比較符合直覺
		html=`<option value="${safehtml(selected)}" selected>${safehtml(selected)}${sessionpagetext("colornotinpalette","（不在調色盤中）")}</option>`+html
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
				<option value="circle" ${chip["shape"]!="square"?"selected":""}>${sessionpagetext("tplround","圓形")}</option>
				<option value="square" ${chip["shape"]=="square"?"selected":""}>${sessionpagetext("tplsquare","方形")}</option>
			</select>
			<input type="number" class="setchipvalue bg-zinc-700 text-white rounded px-2 py-2" inputmode="numeric" value="${chip["value"]||0}">
			<select class="setchipcolor bg-zinc-700 text-white rounded px-2 py-2">${chipcoloroptions(chip["color"]||"#ffffff")}</select>
			<input type="button" class="removechiprow bg-red-600 hover:bg-red-700 rounded" value="×">
		</div>
	`
}

function chipsetsbuttonhtml(){
	if(!userchipsets||userchipsets.length==0){
		return `<span class="text-xs text-zinc-500">${sessionpagetext("tplchipsethint","可到個人資料設定常用計分牌組合")}</span>`
	}
	let html=""
	for(let i=0;i<userchipsets.length;i=i+1){
		html=html+`
			<input type="button" class="importchipset bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded text-sm" data-chipset="${i}" value="${sessionpagetext("tplimportprefix","匯入 ")}${safehtml(userchipsets[i]["name"]||("組合 "+(i+1)))}">
		`
	}
	return html
}

function rendersettings(tab){
	if(!currentsession||!domgetid("settingscontent")){
		return
	}
	weblsset(settingtabkey,tab)
	ptkeytouch(settingtabkey)
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
	}else if(tab=="display"){
		rendersettingdisplay()
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
		<div class="text-lg font-semibold mb-4">${sessionpagetext("tplgeneral","一般")}</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplname","名稱")}<input id="setname" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${safehtml(currentsession["name"]||"")}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplvenue","地點")}<select id="setclubid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${clubhtml}</select></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplstartdate","開始日期")}<input type="date" id="setdate" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${settingdate(currentsession["starttime"])}"></label>
			<div class="grid grid-cols-2 gap-2">
				<label class="block text-sm text-zinc-300">${sessionpagetext("tplstarttime","開始時間")}<input type="time" step="1" id="setstarttime" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${settingtime(currentsession["starttime"])}"></label>
				<label class="block text-sm text-zinc-300">${sessionpagetext("tplendtime","結束時間")}<input type="time" step="1" id="setendtime" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${settingtime(currentsession["endtime"])}"></label>
			</div>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplgametype","遊戲類型")}<select id="setgametypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${gametypehtml}</select></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tpllimittype","限注類型")}<select id="setlimittypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${limithtml}</select></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplchiptype","計分牌類型")}<select id="setstacktypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${stackhtml}</select></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tpleventdetail","賽事細項")}<select id="seteventtypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${eventhtml}</select></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplstartchip","起始計分牌")}<input type="number" id="setchip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["chip"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplmaxseatcount","每桌座位數")}<input type="number" min="2" max="10" inputmode="numeric" id="setmaxseat" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["maxseat"]||9}"></label>
			<div class="grid grid-cols-2 gap-2 items-end">
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setowned" ${currentsession["owned"]?"checked":""}>${sessionpagetext("tplhostgame","主辦牌局")}</label>
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setlinkuser" ${currentsession["linkuser"]?"checked":""}>${sessionpagetext("tpllinkuser","使用者連結")}</label>
			</div>
			<div class="grid grid-cols-2 gap-2 items-end">
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setopenregistration" ${currentsession["openregistration"]?"checked":""}>${sessionpagetext("tplopenregistration","開放報名")}</label>
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setautostartbytime" ${currentsession["autostartbytime"]?"checked":""}>${sessionpagetext("tplautostartbytime","依照時間自動開始")}</label>
			</div>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2 md:col-span-2"><input type="checkbox" id="setprivate" ${currentsession["private"]?"checked":""}>${sessionpagetext("tplprivategame","私人牌局")}</label>
			<label class="block text-sm text-zinc-300 md:col-span-2">${sessionpagetext("tplnote","備註")}<textarea id="setdescription" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2 resize-none" rows="3">${safehtml(currentsession["description"]||"")}</textarea></label>
		</div>
		<div class="text-right mt-4"><input type="button" id="savesettinggeneral" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" value="${sessionpagetext("tplsavegeneralsetting","儲存一般設定")}"></div>
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
	let rebuycountlabel=currentsession["owned"]?sessionpagetext("rebuymax","重買次數上限"):sessionpagetext("rebuycount","重買次數")
	let reentrycountlabel=currentsession["owned"]?sessionpagetext("reentrymax","再入次數上限"):sessionpagetext("reentrycount","再入次數")
	let addoncountlabel=currentsession["owned"]?sessionpagetext("addonmax","增購次數上限"):sessionpagetext("addoncount","增購次數")
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4">${sessionpagetext("tplgamesetting","牌局設定")}</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplbuyincost","買入費")}<input type="number" id="setbuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["buyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplbuyinfee","買入服務費")}<input type="number" id="setbuyinfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["buyinfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplbuyinchip","買入計分牌")}<input type="number" id="setchip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["chip"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplrebuycost","重買費")}<input type="number" id="setrebuybuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["rebuybuyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplrebuyfee","重買服務費")}<input type="number" id="setrebuyfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["rebuyfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplrebuychip","重買計分牌")}<input type="number" id="setrebuychip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["rebuychip"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplreentrycost","再入費")}<input type="number" id="setreentrybuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["reentrybuyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplreentryfee","再入服務費")}<input type="number" id="setreentryfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["reentryfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplreentrychip","再入計分牌")}<input type="number" id="setreentrychip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["reentrychip"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tpladdoncost","增購費")}<input type="number" id="setaddonbuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["addonbuyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tpladdonfee","增購服務費")}<input type="number" id="setaddonfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["addonfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tpladdonchip","增購計分牌")}<input type="number" id="setaddonchip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["addonchip"]||0}"></label>
			<label class="block text-sm text-zinc-300">${rebuycountlabel}<input type="number" id="setrebuycount" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["rebuycount"]||0}"></label>
			<label class="block text-sm text-zinc-300">${reentrycountlabel}<input type="number" id="setreentrycount" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["reentrycount"]||0}"></label>
			<label class="block text-sm text-zinc-300">${addoncountlabel}<input type="number" id="setaddoncount" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["addoncount"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplticketvalue","票券價值")}<input type="number" id="setticketvalue" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["ticketvalue"]||0}"></label>
			<label class="block text-sm text-zinc-300">${sessionpagetext("tplguaranteed","保底獎金")}<input type="number" id="setguaranteedprize" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" inputmode="numeric" value="${currentsession["guaranteedprize"]||0}"></label>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="radio" name="setantemode" value="bigblindante" ${currentsession["antemode"]!="ante"?"checked":""}>${sessionpagetext("tplbigblindante","大盲前注")}</label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="radio" name="setantemode" value="ante" ${currentsession["antemode"]=="ante"?"checked":""}>${sessionpagetext("tplante","前注")}</label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setunifiedhandrecord" ${currentsession["unifiedhandrecord"]?"checked":""}>${sessionpagetext("tplunifiedhand","統一紀錄手牌")}</label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setticketenabled" ${currentsession["ticketenabled"]?"checked":""}>${sessionpagetext("tplallowticket","允許票券買入")}</label>
		</div>
		<div class="mt-6">
			<div class="flex flex-wrap justify-between items-center gap-2 mb-2">
				<div class="font-semibold text-zinc-200">${sessionpagetext("tplusechipdenom","使用計分牌面額")}</div>
				<div class="flex flex-wrap gap-2 items-center">
					${chipsetsbuttonhtml()}
					<input type="button" id="addchiprow" class="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm" value="${sessionpagetext("tpladdchiprow","新增計分牌")}">
				</div>
			</div>
			<div id="chiprows" class="space-y-2">${chiphtml}</div>
		</div>
		<div class="text-right mt-4"><input type="button" id="savesettinggame" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" value="${sessionpagetext("tplsavegamesetting","儲存牌局設定")}"></div>
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
		pttoast(sessionpagetext("importedprefix","已匯入 ")+(set["name"]||sessionpagetext("chipsetdefault","計分牌組合")),"success")
	})
	bindchipremove()
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
	// 後端 winprice 是 integer|min:0, place / totalbuyin 以字串存但同樣不接受負數
	let winpriceelement=domgetid("setwinprice")
	let placeelement=domgetid("setplace")
	let totalbuyinelement=domgetid("settotalbuyin")
	if(!winpriceelement||!placeelement||!totalbuyinelement){
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
	if(settingresultnumber("settotalbuyin")<0){
		let message=sessionresulttext("totalbuyinnegative","總買入不得為負數")
		ptsetfieldmessage(totalbuyinelement,message)
		pttoast(message,"error")
		totalbuyinelement.focus()
		return false
	}
	ptsetfieldmessage(totalbuyinelement,"")
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
			<label class="block text-sm text-zinc-300">${safehtml(sessionresulttext("totalbuyin","總買入"))}<input type="number" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" id="settotalbuyin" min="0" inputmode="numeric" value="${safehtml(currentsession["totalbuyin"]||0)}"></label>
			<label class="block text-sm text-zinc-300">${safehtml(sessionresulttext("winthing","獲獎獎品"))}<input type="text" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" id="setwinthing" placeholder="${safehtml(sessionresulttext("winthingplaceholder","如無獎品可填 N/A"))}" value="${safehtml(currentsession["winthing"]||"N/A")}"></label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setinmoney" ${currentsession["inmoney"]?"checked":""}>${safehtml(sessionresulttext("inmoney","有進錢圈 (ITM)"))}</label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setinft" ${currentsession["inft"]?"checked":""}>${safehtml(sessionresulttext("inft","有進 Final Table"))}</label>
		</div>
		<div class="text-right mt-4"><input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" id="savesettingresult" value="${safehtml(sessionresulttext("save","儲存我的成績"))}"></div>
	`,false)
	let checklist=["setwinprice","setplace","settotalbuyin"]
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
		// editsessionresult 是整列覆寫: 七個欄位一定要送齊, 沒送的會被寫成 0 或 false,
		// reentrycount 本頁沒有欄位可編輯, 所以帶回 currentsession 目前值; 其餘六個送使用者輸入值
		let reentrycount=int(currentsession["reentrycount"]||0)
		if(Number.isNaN(reentrycount)){
			reentrycount=0
		}
		let inmoneyelement=domgetid("setinmoney")
		let inftelement=domgetid("setinft")
		let payload={
			"reentrycount": reentrycount,
			"winprice": settingresultnumber("setwinprice"),
			"winthing": (getvalue("setwinthing")||"").trim()||"N/A",
			"inmoney": inmoneyelement!=null&&inmoneyelement.checked==true,
			"inft": inftelement!=null&&inftelement.checked==true,
			"place": String(settingresultnumber("setplace")),
			"totalbuyin": String(settingresultnumber("settotalbuyin"))
		}
		element.disabled=true
		ajax("PUT",AJAXURL+"editsessionresult/"+sessionid,function(event,data){
			element.disabled=false
			if(data["success"]){
				currentsession["winprice"]=payload["winprice"]
				currentsession["winthing"]=payload["winthing"]
				currentsession["place"]=payload["place"]
				currentsession["totalbuyin"]=payload["totalbuyin"]
				currentsession["inmoney"]=payload["inmoney"]
				currentsession["inft"]=payload["inft"]
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
		html=`<div class="text-zinc-500">${sessionpagetext("tplnorelation","沒有可關聯的賽事")}</div>`
	}
	return html
}

function rendersettingrelation(){
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4">${sessionpagetext("tplseriesrelation","賽事關聯")}</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<div class="font-semibold text-zinc-200 mb-2">${sessionpagetext("tplsatelliterelation","衛星賽關聯")}</div>
				<div class="space-y-2 max-h-64 overflow-auto">${relationoptions("satellite")}</div>
				<input type="button" class="mt-3 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded" id="savesatellite" value="${sessionpagetext("tplsavesatellite","儲存衛星賽關聯")}">
			</div>
			<div>
				<div class="font-semibold text-zinc-200 mb-2">${sessionpagetext("tplmultidayrelation","多日賽關聯")}</div>
				<div class="space-y-2 max-h-64 overflow-auto">${relationoptions("multiday")}</div>
				<input type="button" class="mt-3 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded" id="savemultiday" value="${sessionpagetext("tplsavemultiday","儲存多日賽關聯")}">
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

// 大螢幕可關閉的四組區塊。代號要與後端 timer.py 的 DISPLAYBLOCKLIST 一致。
const DISPLAYBLOCKOPTION=[
	{"key":"payout","label":sessionpagetext("blockpayout","獎金欄（整列，含獎金池與其他獎勵）")},
	{"key":"stack","label":sessionpagetext("blockstack","平均計分牌與報名數")},
	{"key":"nextblind","label":sessionpagetext("blocknextblind","下一級盲注與進度條")},
	{"key":"marquee","label":sessionpagetext("blockmarquee","跑馬燈與其他獎勵")}
]

// 三欄順序的可選排列。後端 normalizecolumnorder 只收完整排列，這裡直接把六種都列出來。
const DISPLAYCOLUMNOPTION=[
	{"key":"","label":sessionpagetext("orderdefault","預設（獎金 / 計時器 / 資訊）")},
	{"key":"payout,center,info","label":sessionpagetext("orderpci","獎金 / 計時器 / 資訊")},
	{"key":"payout,info,center","label":sessionpagetext("orderpic","獎金 / 資訊 / 計時器")},
	{"key":"center,payout,info","label":sessionpagetext("ordercpi","計時器 / 獎金 / 資訊")},
	{"key":"center,info,payout","label":sessionpagetext("ordercip","計時器 / 資訊 / 獎金")},
	{"key":"info,payout,center","label":sessionpagetext("orderipc","資訊 / 獎金 / 計時器")},
	{"key":"info,center,payout","label":sessionpagetext("ordericp","資訊 / 計時器 / 獎金")}
]

// 大螢幕底色固定 #0d0d0d，這裡算主色對它的 WCAG 對比。
// 大螢幕看不清楚是現場事故，不能等到現場才發現，所以在設定當下就要提示（FR-5）。
// TASK-052：實作收攏到 initialize.js 的 ptcontrastratio()，這裡只留頁面自己的名字
function displaycontrastratio(hex){
	return ptcontrastratio(hex)
}

function updatedisplaycontrasthint(){
	let hint=domgetid("displaycolorhint")
	if(!hint){
		return
	}
	let color=getvalue("displaybrandcolor")||""
	if(color==""){
		hint.textContent=sessionpagetext("hintdefaultcolor","未設定主色時使用內建的綠色。")
		hint.className="mt-2 text-xs text-zinc-500"
	}else{
		let ratio=displaycontrastratio(color)
		if(ratio<3){
			hint.textContent=sessionpagetext("contrastfailprefix","對比不足（")+ratio.toFixed(1)+sessionpagetext("contrastfailsuffix",":1）。這個顏色在大螢幕深色底上會看不清楚，建議改用更亮的顏色。")
			hint.className="mt-2 text-xs font-bold text-red-400"
		}else if(ratio<4.5){
			hint.textContent=sessionpagetext("contrastwarnprefix","對比偏低（")+ratio.toFixed(1)+sessionpagetext("contrastwarnsuffix",":1）。遠處觀看可能吃力，建議實際在現場螢幕確認。")
			hint.className="mt-2 text-xs font-bold text-amber-400"
		}else{
			hint.textContent=sessionpagetext("contrastlowsuffix","對比良好（")+ratio.toFixed(1)+":1）。"
			hint.className="mt-2 text-xs text-emerald-400"
		}
	}
}

function rendersettingdisplay(){
	let hiddenlist=String(currentsession["displayfields"]||"").split(",")
	let blockhtml=""
	let i=0
	for(i=0;i<DISPLAYBLOCKOPTION.length;i=i+1){
		let option=DISPLAYBLOCKOPTION[i]
		let checked=""
		if(hiddenlist.indexOf(option["key"])<0){
			checked=" checked"
		}
		blockhtml=blockhtml+`
			<label class="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<input type="checkbox" class="displayblock h-5 w-5 accent-emerald-500" data-block="${option["key"]}"${checked}>
				<span class="text-sm text-zinc-200">${option["label"]}</span>
			</label>
		`
	}
	let orderhtml=""
	for(i=0;i<DISPLAYCOLUMNOPTION.length;i=i+1){
		let option=DISPLAYCOLUMNOPTION[i]
		let selected=""
		if(String(currentsession["columnorder"]||"")==option["key"]){
			selected=" selected"
		}
		orderhtml=orderhtml+`<option value="${option["key"]}"${selected}>${option["label"]}</option>`
	}
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-1 text-white">${sessionpagetext("tplbigscreen","大螢幕顯示")}</div>
		<div class="mb-6 text-sm leading-7 text-zinc-400">${sessionpagetext("tpldisplaysettinghint","這些設定只影響本場次的 display.html 大螢幕。留空的欄位代表沒有設定，大螢幕就維持預設外觀。")}</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="block">
				<label class="mb-2 block text-sm font-bold text-zinc-100" for="displaybrandname">${sessionpagetext("tplbrandname","品牌／協會名稱")}</label>
				<input type="text" class="min-h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400" id="displaybrandname" maxlength="120" value="${safehtml(currentsession["brandname"]||"")}">
			</div>
			<div class="block">
				<label class="mb-2 block text-sm font-bold text-zinc-100" for="displaybrandlogo">${sessionpagetext("tpllogourl","Logo 圖片網址")}</label>
				<input type="text" class="min-h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400" id="displaybrandlogo" maxlength="255" placeholder="https://..." value="${safehtml(currentsession["brandlogo"]||"")}">
				<div class="mt-2 text-xs leading-6 text-zinc-500">${sessionpagetext("tpllogourlhint","只接受 http／https 開頭的網址。大螢幕會把高度限制在 34px，建議準備橫式、去背的圖。")}</div>
			</div>
		</div>

		<div class="mt-4 block">
			<label class="mb-2 block text-sm font-bold text-zinc-100" for="displaybrandcolor">${sessionpagetext("tplaccentcolor","主色")}</label>
			<div class="flex items-center gap-3">
				<input type="color" class="h-12 w-16 shrink-0 cursor-pointer rounded-2xl border border-zinc-700 bg-zinc-800" id="displaybrandcolorpicker" value="${safehtml(currentsession["brandcolor"]||"#4ade80")}">
				<input type="text" class="min-h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400" id="displaybrandcolor" maxlength="20" placeholder="#4ade80" value="${safehtml(currentsession["brandcolor"]||"")}">
				<input type="button" class="min-h-12 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700" id="displaybrandcolorclear" value="${sessionpagetext("tplclear","清除")}">
			</div>
			<div class="mt-2 text-xs text-zinc-500" id="displaycolorhint"></div>
		</div>

		<div class="mt-6 text-sm font-bold text-zinc-100">${sessionpagetext("tplblockstoshow","要顯示的區塊")}</div>
		<div class="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">${blockhtml}</div>

		<div class="mt-6 block">
			<label class="mb-2 block text-sm font-bold text-zinc-100" for="displaycolumnorder">${sessionpagetext("tplcolumnorder","欄位順序")}</label>
			<select class="min-h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400" id="displaycolumnorder">${orderhtml}</select>
			<div class="mt-2 text-xs leading-6 text-zinc-500">${sessionpagetext("tplcolumnorderhint","欄位順序只在寬度大於 900px 的螢幕生效。手機與平板的大螢幕頁是另一套上下堆疊的版面，沒有三欄可以調整。")}</div>
		</div>

		<div class="mt-6">
			<input type="button" id="savedisplaysettings" class="min-h-12 rounded-2xl bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-500" value="${sessionpagetext("tplsave","儲存")}">
		</div>
	`,false)

	updatedisplaycontrasthint()
	oninput("#displaybrandcolor",function(){
		let color=getvalue("displaybrandcolor")
		if(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)){
			value("#displaybrandcolorpicker",color)
		}
		updatedisplaycontrasthint()
	})
	onchange("#displaybrandcolorpicker",function(element){
		value("#displaybrandcolor",element.value)
		updatedisplaycontrasthint()
	})
	onclick("#displaybrandcolorclear",function(){
		value("#displaybrandcolor","")
		updatedisplaycontrasthint()
	})
	onclick("#savedisplaysettings",function(element,event){
		// 勾選代表「要顯示」，送出去的是「要隱藏的清單」，語意相反要換算
		let hidden=[]
		let boxlist=document.querySelectorAll(".displayblock")
		let j=0
		for(j=0;j<boxlist.length;j=j+1){
			if(!boxlist[j].checked){
				hidden.push(boxlist[j].getAttribute("data-block"))
			}
		}
		savesettings(element,{
			"brandname": getvalue("displaybrandname")||"",
			"brandlogo": getvalue("displaybrandlogo")||"",
			"brandcolor": getvalue("displaybrandcolor")||"",
			"displayfields": hidden.join(","),
			"columnorder": getvalue("displaycolumnorder")||""
		})
	})
}

function rendersettingdelete(){
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4 text-red-300">${sessionpagetext("tpldeletesession","刪除賽事")}</div>
		<div class="text-zinc-300 mb-4">${sessionpagetext("tpldeletehint","刪除後此賽事不會再出現在列表中。")}</div>
		<input type="button" id="deletesessionfromsettings" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded" value="${sessionpagetext("tpldeletesession","刪除賽事")}">
	`,false)
	onclick("#deletesessionfromsettings",function(element,event){
		ptconfirm(sessionpagetext("confirmdeleteseries","確定刪除此賽事?"),function(ok){
			if(!ok){
				return
			}
			element.disabled=true
			ajax("DELETE",AJAXURL+"deletesession/"+sessionid,function(event,data){
				if(data["success"]){
					pttoast(sessionpagetext("deletesuccess","刪除成功"))
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
			pttoast(sessionpagetext("savesuccess","儲存成功"))
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
			pttoast(sessionpagetext("savesuccess","儲存成功"),"success")
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
			<div class="text-zinc-400 text-sm">${sessionpagetext("tplserieslodaing","賽事資料載入中...")}</div>
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
			<input type="button" class="relationtypebtn ${relationtype=="satellite"?"bg-emerald-600":"bg-zinc-700"} px-4 py-2 rounded" data-type="satellite" value="${sessionpagetext("tplsatellite","衛星賽")}">
			<input type="button" class="relationtypebtn ${relationtype=="multiday"?"bg-emerald-600":"bg-zinc-700"} px-4 py-2 rounded" data-type="multiday" value="${sessionpagetext("tplmultiday","多日賽")}">
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
	let title=direction=="outgoing"?sessionpagetext("relationoutgoing","本賽事通往其他賽事"):sessionpagetext("relationincoming","其他賽事通往本賽事")
	let desc=type=="satellite"?sessionpagetext("relationsatellite","衛星賽：source 可取得 target 票券"):sessionpagetext("relationmultiday","多日賽：source 晉級 target")
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
				<input class="relationkeyword flex-1 bg-zinc-700 rounded px-3 py-2" data-type="${type}" data-direction="${direction}" placeholder="${sessionpagetext("tplsearchseries","搜尋賽事名稱 / token")}">
				<input type="button" class="relationsearch bg-sky-600 hover:bg-sky-700 rounded px-3" data-type="${type}" data-direction="${direction}" value="${sessionpagetext("tplsearch","搜尋")}">
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
					<input type="button" class="addrelation bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-sm" data-type="${safehtml(type)}" data-direction="${safehtml(direction)}" data-id="${safehtml(rows[i]["id"])}" value="${sessionpagetext("tpladd","加入")}">
				</div>
			`
		}
		innerhtml("#relationresult-"+direction,html||"<div class='text-zinc-500 text-sm'>沒有符合的賽事</div>",false)
		let pg=data["data"]["pagination"]
		innerhtml("#relationpager-"+direction,`
			<input type="button" class="relationpagebtn bg-zinc-700 px-3 py-1 rounded" data-type="${type}" data-direction="${direction}" data-page="${page-1}" ${pg["hasprev"]?"":"disabled"} value="${sessionpagetext("tplprevpage","上一頁")}">
			<span class="text-sm text-zinc-400 py-1">${pg["page"]}/${pg["totalpages"]}</span>
			<input type="button" class="relationpagebtn bg-zinc-700 px-3 py-1 rounded" data-type="${type}" data-direction="${direction}" data-page="${page+1}" ${pg["hasnext"]?"":"disabled"} value="${sessionpagetext("tplnextpage","下一頁")}">
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
			pttoast(sessionpagetext("savesuccess","儲存成功"))
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

onclick(".settings-scroll-btn",function(element,event){
	let wrap=domgetid("settingsscroll")
	if(wrap){
		let direction=element.getAttribute("data-settingscroll")||""
		let amount=0
		if(direction=="left"){
			amount=0-Math.floor(wrap.clientWidth*0.75)
		}else if(direction=="right"){
			amount=Math.floor(wrap.clientWidth*0.75)
		}
		if(amount!=0){
			if(typeof wrap.scrollBy=="function"){
				wrap.scrollBy({
					"left": amount,
					"behavior": "smooth"
				})
			}else{
				wrap.scrollLeft=wrap.scrollLeft+amount
			}
		}
	}
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

// TASK-038 顯示 A：多 board 時每個 board 各一組，label 標「第 n 次」。
// 單 board 時 label 仍是 Board，畫面與之前完全相同。
function sessionboardgroups(hand){
	if(!ptmultiboarded(hand)){
		return sessionrendercardgroup(ptboardcardlist(hand["boardcard"]),"Board",5)
	}
	let boardlist=ptboardlistof(hand)
	let html=""
	for(let i=0;i<boardlist.length;i=i+1){
		let item=boardlist[i]
		let cards=[]
		for(let k=0;k<item["board"]["flop"].length;k=k+1){
			cards.push(item["board"]["flop"][k])
		}
		if(item["board"]["turn"]){
			cards.push(item["board"]["turn"])
		}
		if(item["board"]["river"]){
			cards.push(item["board"]["river"])
		}
		html=html+sessionrendercardgroup(cards,sessionpagetext("boardrun","Run {n}").replace("{n}",item["runno"]),5)
	}
	return html
}

function sessionhandcards(hand){
	let handcard=hand["handcard"]||{}
	if(!hand["selfseating"]){
		return sessionboardgroups(hand)
	}
	// 上限 7 是為了 7 張梭哈（ST / RA）；寫成 5 會讓場次頁的底牌少兩張。
	let herocards=[]
	for(let i=1;i<=7;i=i+1){
		if(handcard&&handcard["card"+i]){
			herocards.push(handcard["card"+i])
		}
	}
	return sessionrendercardgroup(herocards,"Hero")+sessionboardgroups(hand)
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
	let map={ ante: "Ante",blind: sessionpagetext("actionblind","盲注"),check: "Check",call: "Call",bet: "Bet",raise: "Raise",fold: "Fold" }
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
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplcumulativechip","累積計分牌量")}</div><div class="text-xl font-bold text-emerald-400">${stat["cur"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplmaxchip","最大計分牌量")}</div><div class="text-xl font-bold">${stat["max"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplminchip","最小計分牌量")}</div><div class="text-xl font-bold">${stat["min"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplavgchip","平均計分牌量")}</div><div class="text-xl font-bold">${stat["avgstack"]}</div></div>
	`,false)
	innerhtml("#sessionstatscards",`
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tpltotalhands","總手數")}</div><div class="text-xl font-bold">${stat["total"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplnetprofit","淨利")}</div><div class="text-xl font-bold ${0<=stat["profit"]?"text-green-400":"text-red-400"}">${0<=stat["profit"]?"+":""}${stat["profit"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplwinrate","勝率")}</div><div class="text-xl font-bold">${stat["rate"]}%</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplaverage","平均")}</div><div class="text-xl font-bold ${0<=stat["avg"]?"text-green-400":"text-red-400"}">${0<=stat["avg"]?"+":""}${stat["avg"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplmaxwin","最大贏")}</div><div class="text-xl font-bold text-green-400">+${stat["best"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplmaxlose","最大輸")}</div><div class="text-xl font-bold text-red-400">${stat["worst"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplallinhands","All-in 手數")}</div><div class="text-xl font-bold">${stat["allin"]}</div></div>
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
			<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplcumulativechip","累積計分牌量")}</div><div class="text-xl font-bold text-emerald-400">${stat["cur"]}</div></div>
			<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplmaxchip","最大計分牌量")}</div><div class="text-xl font-bold">${stat["max"]}</div></div>
			<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${sessionpagetext("tplavgchip","平均計分牌量")}</div><div class="text-xl font-bold">${stat["avgstack"]}</div></div>
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
			name: sessionpagetext("cumulativechip","累積計分牌"),
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
	return ptsortlist(rows,sessionhandsortstate["key"]||"createtime",sessionhandsortstate["ascended"],sessionhandsortvalue)
}

function rendersessionhandpager(total){
	let totalpage=Math.max(1,Math.ceil(total/sessionhandpagesize))
	if(totalpage<sessionhandpage){
		sessionhandpage=totalpage
	}
	let start=total?((sessionhandpage-1)*sessionhandpagesize+1):0
	let end=Math.min(total,sessionhandpage*sessionhandpagesize)
	innerhtml("#sessionhandpager",`
		<div class="text-zinc-400">${sessionpagetext("tplshow","顯示")} ${start}-${end} / ${total}</div>
		<div class="flex items-center gap-2">
			<input type="button" class="sessionhandpagebtn bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded" data-page="${sessionhandpage-1}" ${sessionhandpage<=1?"disabled":""} value="${sessionpagetext("tplprevpage","上一頁")}">
			<span class="text-zinc-300">${sessionhandpage} / ${totalpage}</span>
			<input type="button" class="sessionhandpagebtn bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded" data-page="${sessionhandpage+1}" ${totalpage<=sessionhandpage?"disabled":""} value="${sessionpagetext("tplnextpage","下一頁")}">
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
	ptsortarrow("#sessionhandhead",sessionhandsortstate["key"],sessionhandsortstate["ascended"])
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
		html=`<tr><td colspan="6" class="py-6 text-zinc-500 text-center">${sessionpagetext("handempty","尚無手牌")}</td></tr>`
	}
	if(!cardhtml){
		cardhtml=`<div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 py-6 text-center text-zinc-500">${sessionpagetext("handempty","尚無手牌")}</div>`
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
		sessionhandsortbtn.textContent=sessionpagetext("sorttime","時間 ")+(sessionhandsortdir=="desc"?"↓":"↑")
	}
	onclick("#sessionhandsort",function(element,event){
		sessionhandsortdir=(sessionhandsortdir=="desc")?"asc":"desc"
		weblsset(WEBLSNAME+"handsortdir",sessionhandsortdir)
		element.textContent=sessionpagetext("sorttime","時間 ")+(sessionhandsortdir=="desc"?"↓":"↑")
		sessionhandsortstate["key"]="createtime"
		sessionhandsortstate["ascended"]=(sessionhandsortdir=="asc")
		sessionhandpage=1
		rendersessionhandtable()
	})
	// 綁定手牌表各欄表頭排序;切到建立時間欄時同步時間鈕方向與 handsortdir
	ptbindsort("#sessionhandhead",sessionhandsortstate,function(){
		if(sessionhandsortstate["key"]=="createtime"){
			sessionhandsortdir=sessionhandsortstate["ascended"]?"asc":"desc"
			weblsset(WEBLSNAME+"handsortdir",sessionhandsortdir)
			let sortbtn=domgetid("sessionhandsort")
			if(sortbtn){
				sortbtn.textContent=sessionpagetext("sorttime","時間 ")+(sessionhandsortdir=="desc"?"↓":"↑")
			}
		}
		sessionhandpage=1
		rendersessionhandtable()
	})
	// 綁定牌桌清單表頭排序
	ptbindsort("#sessiontablehead",sessiontablesortstate,function(){
		sessiontablepage=1
		rendersessiontablelist()
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
		pttoast(sessionpagetext("loadslow","載入時間較久, 請檢查連線後重試"),"warning")
	},15000)
	ajax("GET",AJAXURL+"getsessionhandlist/"+sessionid,function(event,data){
		clearTimeout(handlistwatchdog)
		if(data["success"]){
			sessionhandsloadeded=true
			sessionhands=data["data"]||[]
			rendersessionhandtable()
			rendersessionstats()
			rendersessionev()
		}else{
			if(data["data"]=="ERROR_no_permission"){
				sessionhandsloadeded=true
				sessionhands=[]
				innerhtml("#sessionhandtable",`<tr><td colspan="6" class="py-6 text-zinc-500 text-center">${sessionpagetext("tplnohandpermission","目前沒有手牌檢視權限")}</td></tr>`,false)
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

// ── 員工工時（打卡）分頁 ──────────────────────────────────────────────
// 資料來源是 getstaffworkstatus，那一支把 sessionstaff 與 userstaff 取聯集
// （同一人以 sessionstaff 優先），所以長期聘用的員工不必再單場指派一次就會出現。

let staffworkdata=null

function staffworktext(key,fallback){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["staffwork"]&&TRANSLATE[LANGUAGE]["staffwork"][key]!=undefined){
		return TRANSLATE[LANGUAGE]["staffwork"][key]
	}
	return fallback
}

function staffrolelabel(role){
	if(role=="dealer"){
		return staffworktext("roledealer","計分員")
	}
	if(role=="floor"){
		return staffworktext("rolefloor","裁判")
	}
	if(role=="assistant"){
		return staffworktext("roleassistant","助理")
	}
	return role||"-"
}

function staffminutetext(minute){
	// 格式化統一走 initialize.js 的 ptformatduration，三個用到工時的畫面才不會各自漂移
	return ptformatduration(minute)
}

function loadstaffwork(){
	if(!sessionid){
		return
	}
	ajax("GET",AJAXURL+"getstaffworkstatus/"+sessionid,function(event,data){
		if(data["success"]){
			staffworkdata=data["data"]
			renderstaffwork()
		}else{
			staffworkdata=null
			innerhtml("#staffworkcontent",`<div class="py-6 text-center text-zinc-500">${safehtml(pterror(data["data"]||staffworktext("loadfail","載入失敗")))}</div>`,false)
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#staffworkcontent"
	})
}

function staffworkrowhtml(item){
	// 進行中的班用綠點標出來。跨日的另外標天數 —— 系統刻意允許跨日、也不自動收班，
	// 所以「忘了打下班卡」不會有任何阻力，只能靠畫面把它變顯眼。
	let statushtml=`<span class="text-zinc-500">${staffworktext("statusoff","未打卡")}</span>`
	if(item["workinged"]){
		let daytext=""
		let dayed=Math.floor((int(item["totalminute"])||0)/1440)
		if(0<dayed){
			daytext=` <span class="text-rose-300 font-bold">${staffworktext("crossday","已跨")}${dayed}${staffworktext("day","天")}</span>`
		}
		statushtml=`<span class="inline-flex items-center gap-1 text-emerald-300"><span class="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>${staffworktext("statuson","上班中")}</span>${daytext}`
	}
	let selfbadge=""
	if(item["selfstarted"]){
		selfbadge=` <span class="rounded-full border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">${staffworktext("selfmark","自己按的")}</span>`
	}
	// 上桌／下桌是在多牌桌總覽做的（桌子在那裡）。這裡只顯示結果，
	// 但自己那一列給一個入口 —— 否則員工不會知道要去哪裡選桌。
	let tablehtml=`<span class="text-zinc-600">-</span>`
	if(item["ontableed"]){
		tablehtml=safehtml(item["tablename"]||item["tableno"]||item["tableid"])
	}
	if(item["selfed"]){
		tablehtml=tablehtml+`<div class="mt-1"><a href="tableboard.html?id=${safehtml(sessionid)}" class="text-xs text-emerald-400 hover:underline">${staffworktext("picktable","去選桌")}</a></div>`
	}
	// 單場覆寫只有 sessionstaff 來源的人才改得了（sessionstaff.hourlyrate 是那張表的欄位）。
	// 留白 = 清除覆寫、回去沿用全域預設；0 = 這場真的無給職。兩者不同。
	let ratehtml=`<span class="text-zinc-600">${staffworktext("ratenone","未設定")}</span>`
	if(item["ratesource"]!="none"){
		ratehtml=safehtml(item["hourlyrate"])+`<div class="text-xs text-zinc-500">${item["ratesource"]=="sessionstaff"?staffworktext("ratesession","本場覆寫"):staffworktext("rateglobal","全域預設")}</div>`
	}
	if(item["source"]=="sessionstaff"&&canviewsessionsettings(currentsession)){
		ratehtml=ratehtml+`
			<div class="mt-1 flex items-center gap-1">
				<input type="number" class="staffrateinput w-20 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs" data-sessionstaffid="${item["sessionstaffid"]}" min="0" value="${item["ratesource"]=="sessionstaff"?safehtml(item["hourlyrate"]):""}">
				<input type="button" class="staffratesave text-xs text-emerald-400 hover:underline" data-sessionstaffid="${item["sessionstaffid"]}" value="${staffworktext("ratesave","存")}">
			</div>
		`
	}
	// 這裡是**代打卡**：打的是那個人的班（個人層級），不是「這一場的卡」。
	// 場次只是記錄 —— 段的場次歸屬是上桌時帶入的，不是在這裡選的。
	let buttonhtml=""
	if(staffworkdata["canmanage"]||item["selfed"]){
		if(item["shiftstate"]=="working"){
			buttonhtml=`
				<input type="button" class="staffshiftbtn rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-500" data-action="breakstaffshift" data-staffuserid="${item["staffuserid"]}" value="${staffworktext("shiftbreak","休息卡")}">
				<input type="button" class="staffshiftbtn rounded bg-zinc-700 px-3 py-1 text-sm text-white hover:bg-zinc-600" data-action="endstaffshift" data-staffuserid="${item["staffuserid"]}" value="${staffworktext("shiftend","下班卡")}">
			`
		}else if(item["shiftstate"]=="onbreak"){
			buttonhtml=`
				<input type="button" class="staffshiftbtn rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500" data-action="resumestaffshift" data-staffuserid="${item["staffuserid"]}" value="${staffworktext("shiftresume","結束休息")}">
				<input type="button" class="staffshiftbtn rounded bg-zinc-700 px-3 py-1 text-sm text-white hover:bg-zinc-600" data-action="endstaffshift" data-staffuserid="${item["staffuserid"]}" value="${staffworktext("shiftend","下班卡")}">
			`
		}else{
			buttonhtml=`<input type="button" class="staffshiftbtn rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500" data-action="startstaffshift" data-staffuserid="${item["staffuserid"]}" value="${staffworktext("shiftstart","上班卡")}">`
		}
	}
	// 只有「單場指派」進來的才給移除鈕；長期聘用的要去個人檔案解聘，不該從場次頁拆掉
	if(item["source"]=="sessionstaff"&&canviewsessionsettings(currentsession)){
		buttonhtml=buttonhtml+` <input type="button" class="staffsessionremove text-red-400 hover:underline text-sm" data-sessionstaffid="${item["sessionstaffid"]}" value="${staffworktext("removesession","移除")}">`
	}
	return `
		<tr class="border-b border-zinc-800">
			<td class="py-2 px-2">${safehtml(item["staffname"])}<div class="text-xs text-zinc-500">${safehtml(item["staffplayerid"])}</div></td>
			<td class="py-2 px-2">${staffrolelabel(item["role"])}</td>
			<td class="py-2 px-2">${statushtml}${selfbadge}</td>
			<td class="py-2 px-2">${tablehtml}</td>
			<td class="py-2 px-2">${staffminutetext(item["totalminute"])}<div class="text-xs text-zinc-500">${staffworktext("billing","計費")} ${staffminutetext(item["billingminute"])}</div></td>
			<td class="py-2 px-2">${ratehtml}</td>
			<td class="py-2 px-2">${item["ratesource"]=="none"?`<span class="text-zinc-600">-</span>`:safehtml(item["amount"])}</td>
			<td class="py-2 px-2">${buttonhtml}</td>
		</tr>
	`
}

function renderstaffwork(){
	if(!staffworkdata){
		return
	}
	let stafflist=staffworkdata["stafflist"]||[]
	let pendinglist=staffworkdata["pendinglist"]||[]
	if(stafflist.length==0){
		// 已經指派但對方還沒確認時，**不可以**再說「沒有可排班的員工」——
		// 那會讓人以為剛才的指派沒有生效（實際上是 status='pending'，在等對方點信）。
		if(0<pendinglist.length){
			innerhtml("#staffworkcontent",`
				<div class="py-8 text-center">
					<div class="text-zinc-400">${staffworktext("pendingonly","已指派，等待對方確認")}</div>
					<div class="mt-2 text-sm text-zinc-500">${staffworktext("pendingonlynext","對方點了邀請信裡的連結之後，就會出現在排班清單中。")}</div>
				</div>
				${staffpendinghtml(pendinglist)}
				${staffassignformhtml()}
			`,false)
			bindstaffassign()
			return
		}
		// **空狀態也要把指派表單畫出來。**
		// 空狀態的文案寫著「或為本場次單獨指派」，但舊版在這裡直接 return，
		// 於是那個控制項只有在**已經有人**的時候才看得到 —— 最需要它的時候反而沒有，
		// 使用者除了那句話之外沒有任何下一步可以按。
		// 這一段對沒有設定檢視權限的人會是空字串（staffassignformhtml 自己擋掉），
		// 那種情況下只顯示說明文字是對的。
		innerhtml("#staffworkcontent",`
			<div class="py-8 text-center">
				<div class="text-zinc-400">${staffworktext("emptystaff","這場沒有可排班的員工")}</div>
				<div class="mt-2 text-sm text-zinc-500">${staffworktext("emptystaffnext","請先到個人檔案聘用計分員、裁判或助理，或為本場次單獨指派。")}</div>
				<a href="profile.html#employmentpanel" class="mt-4 inline-block rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-400">${staffworktext("emptystaffgoprofile","前往個人檔案聘用")}</a>
			</div>
			${staffassignformhtml()}
		`,false)
		bindstaffassign()
		return
	}
	let totalminute=0
	let totalamount=0
	let workingcount=0
	let bodyhtml=""
	for(let i=0;i<stafflist.length;i=i+1){
		totalminute=totalminute+(int(stafflist[i]["totalminute"])||0)
		totalamount=totalamount+(int(stafflist[i]["amount"])||0)
		if(stafflist[i]["workinged"]){
			workingcount=workingcount+1
		}
		bodyhtml=bodyhtml+staffworkrowhtml(stafflist[i])
	}
	innerhtml("#staffworkcontent",`
		<div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
				<div class="text-xs text-zinc-500">${staffworktext("cardtotalminute","本場總時數")}</div>
				<div class="mt-1 text-2xl font-bold">${staffminutetext(totalminute)}</div>
			</div>
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
				<div class="text-xs text-zinc-500">${staffworktext("cardtotalamount","本場總金額")}</div>
				<div class="mt-1 text-2xl font-bold">${totalamount}</div>
			</div>
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
				<div class="text-xs text-zinc-500">${staffworktext("cardworking","上班中")}</div>
				<div class="mt-1 text-2xl font-bold ${0<workingcount?"text-emerald-400":""}">${workingcount}</div>
			</div>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="text-zinc-400">
					<tr class="border-b border-zinc-800">
						<th class="py-2 px-2">${staffworktext("colstaff","員工")}</th>
						<th class="py-2 px-2">${staffworktext("colrole","角色")}</th>
						<th class="py-2 px-2">${staffworktext("colstatus","狀態")}</th>
						<th class="py-2 px-2">${staffworktext("coltable","目前牌桌")}</th>
						<th class="py-2 px-2">${staffworktext("colduration","累計時數")}</th>
						<th class="py-2 px-2">${staffworktext("colrate","時薪")}</th>
						<th class="py-2 px-2">${staffworktext("colamount","金額")}</th>
						<th class="py-2 px-2"></th>
					</tr>
				</thead>
				<tbody>${bodyhtml}</tbody>
			</table>
		</div>
		<div class="mt-4 text-xs text-zinc-500">${staffworktext("billinghint","計費以 30 分鐘為單位無條件進位；上班中的班不計金額。")}</div>
		${staffpendinghtml(pendinglist)}
		${staffassignformhtml()}
	`,false)
	onclick(".staffshiftbtn",function(element){
		staffclock(element.getAttribute("data-action"),element.getAttribute("data-staffuserid"))
	})
	onclick(".staffratesave",function(element){
		let sessionstaffid=element.getAttribute("data-sessionstaffid")
		let input=document.querySelector('.staffrateinput[data-sessionstaffid="'+sessionstaffid+'"]')
		let rate=input?input.value.trim():""
		// 留白要送 null（清除覆寫、回去沿用全域），不能送 0 —— 0 代表這場真的無給職
		let ratevalue=null
		if(rate!=""){
			ratevalue=int(rate)
		}
		ajax("PUT",AJAXURL+"editsessionstaffrate/"+sessionstaffid,function(event,data){
			if(data["success"]){
				pttoast(staffworktext("rateok","時薪已更新，只影響之後的打卡"),"success")
				loadstaffwork()
			}else{
				pttoast(pterror(data["data"]||staffworktext("ratefail","更新失敗")),"error")
			}
		},str({
			"hourlyrate": ratevalue
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		],{
			loadingtarget: "#staffworkcontent"
		})
	})
	bindstaffassign()
}

// 待確認的聘用（sessionstaff / userstaff 的 status='pending'）。
// 這些人**還不能排班**，所以不放任何操作按鈕，只讓主辦看得到「我確實指派了、在等對方」。
function staffpendinghtml(pendinglist){
	if(!pendinglist||pendinglist.length==0){
		return ""
	}
	let html=""
	for(let i=0;i<pendinglist.length;i=i+1){
		let item=pendinglist[i]
		let sourcetext=staffworktext("pendingsourcesession","本場指派")
		if(item["source"]=="userstaff"){
			sourcetext=staffworktext("pendingsourceglobal","長期聘用")
		}
		html=html+`
			<div class="flex items-center justify-between gap-3 border-b border-zinc-800 py-3 last:border-b-0">
				<div class="min-w-0">
					<div class="truncate text-sm font-semibold text-zinc-200">${safehtml(item["staffname"])}</div>
					<div class="text-xs text-zinc-500">${safehtml(item["staffplayerid"])} · ${safehtml(staffrolelabel(item["role"]))} · ${safehtml(sourcetext)}</div>
				</div>
				<div class="shrink-0 rounded-full border border-amber-600/50 bg-amber-600/10 px-3 py-1 text-xs font-bold text-amber-300">${staffworktext("pendingbadge","待確認")}</div>
			</div>
		`
	}
	return `
		<div class="mt-6 border-t border-zinc-800 pt-4">
			<div class="mb-2 text-sm font-bold">${staffworktext("pendingtitle","待確認的邀請")}</div>
			<div class="mb-2 text-xs text-zinc-500">${staffworktext("pendinghint","對方確認之前不會出現在排班清單，也不能上桌或打卡。")}</div>
			${html}
		</div>
	`
}

function staffassignformhtml(){
	// 單場指派。這是 newstaff/{sessionid} 與 deletesessionstaff 這兩支端點的第一個前端 ——
	// 在此之前 sessionstaff 只有後端、沒有任何畫面在寫它。
	if(!canviewsessionsettings(currentsession)){
		return ""
	}
	return `
		<div class="mt-6 border-t border-zinc-800 pt-4">
			<div class="mb-2 text-sm font-bold">${staffworktext("assigntitle","指派本場員工")}</div>
			<div class="mb-2 text-xs text-zinc-500">${staffworktext("assignhint","只在這一場生效，不影響其他場次。長期聘用請到個人檔案設定。")}</div>
			<div class="flex flex-wrap items-center gap-2">
				<input type="text" class="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" data-i18n-placeholder="staffwork.assignplayerid" id="staffassignplayerid" placeholder="選手編號">
				<select class="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" id="staffassignrole">
					<option value="dealer">${staffworktext("roledealer","計分員")}</option>
					<option value="floor">${staffworktext("rolefloor","裁判")}</option>
					<option value="assistant">${staffworktext("roleassistant","助理")}</option>
				</select>
				<input type="button" class="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500" id="staffassignbutton" value="${staffworktext("assignbutton","指派")}">
			</div>
		</div>
	`
}

function bindstaffassign(){
	onclick("#staffassignbutton",function(){
		let playerid=(getvalue("staffassignplayerid")||"").trim()
		if(!playerid){
			pttoast(staffworktext("assignneedplayerid","請輸入選手編號"),"error")
			return
		}
		ajax("POST",AJAXURL+"newstaff/"+sessionid,function(event,data){
			if(data["success"]){
				pttoast(staffworktext("assignok","已指派"),"success")
				value("#staffassignplayerid","")
				loadstaffwork()
			}else{
				pttoast(pterror(data["data"]||staffworktext("assignfail","指派失敗")),"error")
			}
		},str({
			"playerid": playerid,
			"role": getvalue("staffassignrole")||"dealer"
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		],{
			loadingtarget: "#staffworkcontent"
		})
	})
	onclick(".staffsessionremove",function(element){
		let sessionstaffid=element.getAttribute("data-sessionstaffid")
		ptconfirm(staffworktext("removeconfirm","確定要把這位員工從本場次移除嗎？"),function(){
			ajax("DELETE",AJAXURL+"deletesessionstaff/"+sessionstaffid,function(event,data){
				if(data["success"]){
					pttoast(staffworktext("removeok","已移除"),"success")
					loadstaffwork()
				}else{
					pttoast(pterror(data["data"]||staffworktext("removefail","移除失敗")),"error")
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			],{
				loadingtarget: "#staffworkcontent"
			})
		})
	})
}

function staffclock(action,staffuserid){
	// 打卡端點是**個人層級**的（不吃 sessionid）—— 場次歸屬由上桌帶入。
	ajax("POST",AJAXURL+action,function(event,data){
		if(data["success"]){
			pttoast(staffworktext(action+"ok",staffworktext("shiftok","已更新")),"success")
			loadstaffwork()
		}else{
			pttoast(pterror(data["data"]||staffworktext("clockfail","打卡失敗")),"error")
		}
	},str({
		"staffuserid": int(staffuserid)
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#staffworkcontent"
	})
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
	if(tab=="orderinfo"){
		// 場次資料可能還沒回來（這一頁是沒有設定檢視權限時的預設分頁，會在載入完成前就被選中），
		// 所以載入完成的那一段也會再呼叫一次。
		rendersessionorderinfo(currentsession)
	}
	if(tab=="staff"){
		loadstaffwork()
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
		"othertab": "",
		"settingtab": ""
	}
	// 從場次列表或個人紀錄的「編輯」進來時直接停在 其他 → 設定 → 我的成績
	if(sessionhash=="other-settings-result"||sessionhash=="settings-result"){
		state["othertab"]="settings"
		state["settingtab"]="result"
		state["tab"]="other"
	}
	// 「其他」底下有哪些子分頁**從 DOM 讀**，不要再寫死字串清單。
	// 原本這裡是 other-settings / other-relations / other-orderinfo 三個字面值，
	// 2026-08 加了 other-staff 之後忘了補：hash 對不到任何一條 → tab 維持空字串 →
	// 落回預設的總覽，但網址列的 #other-staff 不會被改掉，畫面與網址就此對不起來。
	// 這種漏法不會報錯，只會看起來「點了沒反應」。
	let othertabnamelist=[]
	let othertabnodelist=document.querySelectorAll(".othertab-btn[data-othertab]")
	for(let i=0;i<othertabnodelist.length;i=i+1){
		othertabnamelist.push(othertabnodelist[i].getAttribute("data-othertab"))
	}
	for(let i=0;i<othertabnamelist.length;i=i+1){
		let name=othertabnamelist[i]
		if(sessionhash=="overview-other-"+name||sessionhash=="other-"+name||sessionhash==name){
			state["othertab"]=name
			state["tab"]="other"
		}
	}
	if(sessionhash=="overview-general"||sessionhash=="overview-info"||sessionhash=="overview-action"||sessionhash=="overview-note"){
		state["overviewtab"]=sessionhash.replace("overview-","")
		state["tab"]="overview"
	}
	if(sessionhash=="general"||sessionhash=="info"||sessionhash=="action"||sessionhash=="note"){
		state["overviewtab"]=sessionhash
		state["tab"]="overview"
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
	if(state["settingtab"]){
		// currentsession 還沒載入時 rendersettings 會直接返回, 先寫入頁籤記憶讓資料載完後仍停在同一個分頁
		weblsset(settingtabkey,state["settingtab"])
		ptkeytouch(settingtabkey)
		rendersettings(state["settingtab"])
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
		if(event&&event.button!=0){
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
	if(jump=="#other-settings-result"){
		let tab=document.querySelector('.tab-btn[data-tab="other"]')
		if(tab){
			tab.click()
			selectsessionothertab("settings")
			rendersettings("result")
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
		return sessionpagetext("statusregistered","已報名")
	}
	if(status=="confirmed"){
		return sessionpagetext("statusconfirmed","已確認")
	}
	if(status=="advanced"){
		return sessionpagetext("statusadvanced","已晉級")
	}
	if(status=="cancelled"){
		return sessionpagetext("statuscancelled","已取消")
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
	if(!sessionyesbycounted(count,rawbuyin,rawchip)){
		return sessionpagetext("no","否")
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
		[sessionpagetext("printsessionname","場次名稱"),row["name"]||"-"],
		[sessionpagetext("printcode","代碼"),sessionprintcodetext(row)],
		[sessionpagetext("printdate","日期"),ptformatdatetimeminute(row["starttime"])],
		[sessionpagetext("cardvenue","地點"),row["clubname"]||"-"],
		[sessionpagetext("cardgametypelabel","遊戲類型"),gametypetext],
		[sessionpagetext("cardmaxseat","每桌座位"),sessiondisplayvalue(row["maxseat"])],
		[sessionpagetext("cardantemode","前注模式"),sessionantetext(row["antemode"])],
		[sessionpagetext("cardbuyinfee","買入(服務費)"),sessionfeetext(row["buyin"],row["buyinfee"])],
		[sessionpagetext("cardbuyinchip","買入計分牌"),sessionmoneytext(row["chip"])],
		[sessionpagetext("cardticketvalue","票券價值"),sessionmoneytext(row["ticketvalue"])],
		[sessionpagetext("cardguaranteed","保底獎金"),float(row["guaranteedprize"])||0],
		[sessionpagetext("printreentryfee","再入次數/再入費"),sessionprintfeevalue(row["reentrycount"],row["reentrybuyin"],row["reentrychip"],reentrybuyin,reentryfee)],
		[sessionpagetext("printrebuyfee","重買次數/重買費"),sessionprintfeevalue(row["rebuycount"],row["rebuybuyin"],row["rebuychip"],rebuybuyin,rebuyfee)],
		[sessionpagetext("printaddonfee","增購次數/增購費"),sessionprintfeevalue(row["addoncount"],row["addonbuyin"],row["addonchip"],row["addonbuyin"],row["addonfee"])],
		[sessionpagetext("printsessionended","場次結束"),sessionbooltext(row["sessionended"])]
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
		{"title": sessionpagetext("printplace","名次"),"align": "center"},
		{"title": sessionpagetext("printplayer","選手")},
		{"title": "ID"},
		{"title": sessionpagetext("printbuyin","買入"),"align": "right"},
		{"title": sessionpagetext("printprize","獎金"),"align": "right"},
		{"title": sessionpagetext("printcolprofit","盈虧"),"align": "right"}
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
	return ptprinttable(columns,rows,sessionpagetext("printnorank","尚無名次資料"))
}

function sessionprintregisterhtml(registrations,tablelist){
	let columns=[
		{"title": sessionpagetext("printcolno","序號"),"align": "right"},
		{"title": sessionpagetext("printplayer","選手")},
		{"title": "ID"},
		{"title": sessionpagetext("printcolstatus","狀態"),"align": "center"},
		{"title": sessionpagetext("printcoltable","桌次"),"align": "center"},
		{"title": sessionpagetext("printcolseat","座位"),"align": "center"},
		{"title": sessionpagetext("printbuyin","買入"),"align": "right"},
		{"title": sessionpagetext("printplace","名次"),"align": "center"},
		{"title": sessionpagetext("printprize","獎金"),"align": "right"},
		{"title": sessionpagetext("printcolprofit","盈虧"),"align": "right"}
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
	return ptprinttable(columns,rows,sessionpagetext("printnoregistration","尚無報名紀錄"))
}

// 賽事結構表：開始時間 / 關卡 / 小盲 / 大盲 / 前注 / 時間(分) / 備註(REG CLOSE、換籌)。
function sessionprintstructurehtml(schedule,row){
	let columns=[
		{"title": sessionpagetext("printcolstart","開始"),"align": "center"},
		{"title": sessionpagetext("printcollevel","關卡"),"align": "center"},
		{"title": sessionpagetext("printcolsb","小盲"),"align": "right"},
		{"title": sessionpagetext("printcolbb","大盲"),"align": "right"},
		{"title": sessionpagetext("printcolante","前注"),"align": "right"},
		{"title": sessionpagetext("printcolduration","時間(分)"),"align": "right"},
		{"title": sessionpagetext("printcolnote","備註")}
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
			note.push(sessionpagetext("printchipraise","換籌 ")+item["chipRaiseValues"].join("/"))
		}
		let notetext=note.join(" / ")||"-"
		if(item["type"]=="break"){
			rows.push([clock,sessionpagetext("printbreak","休息"),"-","-","-",sessiondisplayvalue(item["dur"]),notetext])
		}else{
			level=level+1
			rows.push([clock,"Lv."+level,sessiondisplayvalue(item["sb"]),sessiondisplayvalue(item["bb"]),sessiondisplayvalue(item["ante"]),sessiondisplayvalue(item["dur"]),notetext])
		}
		running=running+int(item["dur"]||0)
	}
	return ptprinttable(columns,rows,sessionpagetext("printnostructure","尚無結構資料"))
}

function printsession(){
	if(!currentsession){
		pttoast(sessionpagetext("printnotloaded","場次資料尚未載入完成，請稍候再列印"),"warning")
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
		let bodyhtml=ptprintsectiontitle(sessionpagetext("printsectionsummary","場次摘要"))+sessionprintsummaryhtml(row)
		// 報名統計 / 名次 / 名單只在主辦(可看報名資料)時列印。
		let isowner=row["isown"]||row["isadmin"]
		if(isowner){
			if(stats["registered"]!=undefined){
				bodyhtml=bodyhtml+ptprintsectiontitle(sessionpagetext("printsectionregstats","報名統計"))+ptprintinfogrid([
					[sessionpagetext("printstatregistered","已報名"),sessiondisplayvalue(stats["registered"])],
					[sessionpagetext("printstatconfirmed","已確認"),sessiondisplayvalue(int(stats["confirmed"]||0)+int(stats["advanced"]||0))],
					[sessionpagetext("printstatcancelled","已取消"),sessiondisplayvalue(stats["cancelled"])],
					[sessionpagetext("printstatcount","報名筆數"),registrations.length]
				])
			}
			bodyhtml=bodyhtml+ptprintsectiontitle(sessionpagetext("printsectionrank","名次結算"))+sessionprintrankhtml(registrations)
			bodyhtml=bodyhtml+ptprintsectiontitle(sessionpagetext("printsectionreglist","報名名單"))+sessionprintregisterhtml(registrations,tablelist)
		}
		// 賽事結構放在報名名單下面。
		let schedule=(sessiontimerstate||{})["schedule"]||[]
		if(schedule.length==0){
			schedule=row["schedule"]||[]
		}
		bodyhtml=bodyhtml+ptprintsectiontitle(sessionpagetext("printsectionstructure","賽事結構"))+sessionprintstructurehtml(schedule,row)
		bodyhtml=bodyhtml+ptprintsignblock([sessionpagetext("printsignstaff","承辦人簽名"),sessionpagetext("printsignmanager","主管簽名")])
		ptprintrun(ptprintbuild({
			"eyebrow": "Session",
			"title": (row["name"]||sessionpagetext("printsessionfallback","場次"))+sessionpagetext("printtitlesuffix"," 場次存底"),
			"subtitle": sessionpagetext("printsubtitle","場次詳情存底"),
			"meta": sessionpagetext("printmeta","列印時間")+" "+ptprinttimestamp()
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
		pttoast(sessionpagetext("printnohand","目前沒有手牌可列印"),"warning")
		return
	}
	let columns=[
		{"title": "#","align": "right"},
		{"title": sessionpagetext("handcolposition","位置")},
		{"title": sessionpagetext("handcolcards","起手牌 / 公牌")},
		{"title": sessionpagetext("handcolaction","行動")},
		{"title": sessionpagetext("handcolresult","結果"),"align": "right"}
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
	let sessionname=currentsession?(currentsession["name"]||sessionpagetext("handsession","場次")):sessionpagetext("handsession","場次")
	let infohtml=ptprintinfogrid([
		[sessionpagetext("handsession","場次"),sessionname],
		[sessionpagetext("handtotal","手牌總數"),list.length],
		[sessionpagetext("handsort","排序"),sessionhandsortdir=="desc"?sessionpagetext("handsortdesc","時間新→舊"):sessionpagetext("handsortasc","時間舊→新")]
	])
	let bodyhtml=infohtml+ptprintsectiontitle(sessionpagetext("handsectiontitle","手牌總覽"))+ptprinttable(columns,rows,sessionpagetext("handempty","尚無手牌"))+ptprintsignblock([sessionpagetext("printsignstaff","承辦人簽名"),sessionpagetext("printsignmanager","主管簽名")])
	ptprintrun(ptprintbuild({
		"eyebrow": "Hands",
		"title": sessionname+sessionpagetext("handtitlesuffix"," 手牌總覽"),
		"subtitle": sessionpagetext("handsubtitle","手牌紀錄存底"),
		"meta": sessionpagetext("printmeta","列印時間")+" "+ptprinttimestamp()
	},bodyhtml))
}

onclick("#printsessionhands",function(element,event){
	printsessionhands()
})

// 追隨主辦單位：已追隨就是取消，沒追隨就開設定對話框。
// 對話框需要「這位主辦單位有哪些地點」，那份資料要從可追隨清單拿
// （它是從使用者本來就看得到的場次反推的，不會多曝光任何東西）。
onclick("#sessionfollowbutton",function(element,event){
	let button=domgetid("sessionfollowbutton")
	if(!button||button.disabled||!currentsession){
		return
	}
	if(sessionfollowtarget){
		ptconfirm(ptfollowtext("unfollowconfirm","確定要取消追隨嗎？取消後不會再收到新場次通知。"),function(okayed){
			if(!okayed){
				return
			}
			ptsetsubmitstate(button,true,ptfollowtext("removing","處理中…"))
			ptfollowdelete(sessionfollowtarget["followuserid"],function(deleted,responsedata){
				ptsetsubmitstate(button,false)
				if(!deleted){
					pttoast(pterror(responsedata),"error")
					return
				}
				sessionfollowtarget=null
				ptfollowapplybuttonstate(button,false)
				pttoastsuccess(ptfollowtext("unfollowed","已取消追隨"))
			})
		})
		return
	}
	ptsetsubmitstate(button,true,ptfollowtext("removing","處理中…"))
	ptfollowloadtarget(function(targetlist){
		ptsetsubmitstate(button,false)
		if(targetlist==null){
			pttoast(pterror(ptfollowtext("loadfail","追隨清單載入失敗")),"error")
			return
		}
		let target=null
		for(let i=0;i<targetlist.length;i=i+1){
			if(targetlist[i]["followuserid"]==currentsession["userid"]){
				target=targetlist[i]
			}
		}
		if(!target){
			pttoast(pterror("ERROR_follow_target_not_found"),"error")
			return
		}
		// 預設選「全部地點」，但把本場的地點先勾起來 ——
		// 使用者改選「只追隨指定地點」時不用再找一次。
		target["allclubed"]=true
		target["followclubidlist"]=[currentsession["clubid"]]
		ptfollowopenmodal("edit",target,function(saveded){
			if(saveded){
				rendersessionhostbar(currentsession)
			}
		})
	})
})
