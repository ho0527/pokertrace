let sessionid=getget("sessionid")
// 預設測試用使用者 (defultuser.py)：playerid 0 開頭皆為測試使用者，名稱前綴 TUP_ 為測試選手
// showtestusered 未開啟時查詢結果一律過濾掉測試使用者
const TESTUSERKEYWORD="TUP_"
let showtestusered=false
function rt(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["registerpage"]){ return key }
	return TRANSLATE[LANGUAGE]["registerpage"][key]||key
}
// 屬性值 / option 內容用：escapehtml 不轉義引號，塞進雙引號屬性會被打穿，這裡補上引號轉義。
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
let tables=[]
let seatoccupancy={}
let startchip=0
let maxseat=9
let maxreentry=0
let maxrebuy=0
let maxaddon=0
let rebuyallowed=false
let addonallowed=false
let advancetargets=[]
let unifiedhandrecord=false
let totalchipcount=0
let receiptheaderdata={
	"seriestitle": "",
	"clubname": "",
	"event": "",
	"starttime": ""
}
let registrationws=null
let registrationwstimer=null
let registrationreloadtimer=null
let registrationresultsummary={
	"showed": false
}
let registrationdatalist=[]
let registrationpage=1
let registrationpagesize=25
let registrationfilter="all"
// 報名清單排序狀態(點表頭切換);取值器交給通用 ptsortlist/ptsortarrow
let registrationsortstate={"key": "","ascended": true}

function registrationsortvalue(item,key){
	if(key=="registertime"){
		let text=ptformatdatetime(item["registertime"])
		return text||null
	}
	if(key=="profit"){
		let number=Number(item["profit"])
		return isNaN(number)?null:number
	}
	if(key=="seat"){
		// 座位要**先桌號、後座位號**，而且兩段都要用數值比 ——
		// 直接拿 "10-3" 這種字串排會讓 10 桌跑到 2 桌前面。
		// 併成一個數字（桌號*1000+座位號）比較，通用的 ptsortcompare 看到
		// 兩邊都是 number 就會走數值相減那條。
		// 還沒入座的回 null，ptsortcompare 一律把 null 排到最後（升冪降冪都是），
		// 這正是想要的：未入座的不該卡在名單中間。
		if(!item["tableid"]||!item["seatno"]){
			return null
		}
		let tableno=Number(registrationtablename(item["tableid"]))
		if(isNaN(tableno)){
			tableno=0
		}
		let seatno=Number(item["seatno"])
		if(isNaN(seatno)){
			seatno=0
		}
		return tableno*1000+seatno
	}
	let text=""
	if(item[key]!=null){
		text=String(item[key]).trim()
	}
	return text||null
}
let registrationkeyword=""
let registrationstatekey=WEBLSNAME+"registrationquery"+sessionid

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

if(!sessionid){
	pttoast(rt("missingsessionid"),"error")
	href("sessionlist.html")
}

domgetid("back").href="session.html?id="+sessionid
// 掃描頁帶場次進去: 手動輸入入場編號時可直接預選這一場, 不用再挑。
domgetid("scanlink").href="scan.html?sessionid="+encodeURIComponent(sessionid)

function loadregistrationquerystate(){
	let raw=""
	try{
		raw=localStorage.getItem(registrationstatekey)||""
	}catch(error){
		raw=""
	}
	if(!raw){
		return
	}
	let data=null
	try{
		data=JSON.parse(raw)
	}catch(error){
		data=null
	}
	if(!data){
		return
	}
	let pagesize=int(data["pagesize"])||25
	if(pagesize!=10&&pagesize!=25&&pagesize!=50&&pagesize!=100){
		pagesize=25
	}
	registrationpagesize=pagesize
	registrationpage=int(data["page"])||1
	if(registrationpage<1){
		registrationpage=1
	}
	registrationfilter=String(data["filter"]||"all")
	registrationkeyword=String(data["keyword"]||"")
}

function saveregistrationquerystate(){
	let data={
		"page": registrationpage,
		"pagesize": registrationpagesize,
		"filter": registrationfilter,
		"keyword": registrationkeyword
	}
	try{
		localStorage.setItem(registrationstatekey,JSON.stringify(data))
		// TASK-060：登記進回收索引，超過保留天數會被自動清掉
		ptkeytouch(registrationstatekey)
	}catch(error){
	}
}

loadregistrationquerystate()

// 綁定報名清單表頭排序:點同欄切升降、換欄重設升冪, 排序後回第 1 頁重畫
ptbindsort("#reghead",registrationsortstate,function(){
	registrationpage=1
	renderregistrationlist()
})

function moneytext(value){
	value=float(value)||0
	if(0<=value){
		return "+"+value
	}
	return ""+value
}

function setregistrationresultsummary(summary){
	registrationresultsummary=summary||{
		"showed": false
	}
	if(typeof ptrenderpagesummary=="function"){
		ptrenderpagesummary("#registrationresultsummary",registrationresultsummary)
	}
}

function renderregistrationguides(){
	let actionbox=domgetid("registrationguideactions")
	let statusbox=domgetid("registrationguidestatus")
	let flowbox=domgetid("registrationguideflow")
	if(actionbox){
		actionbox.innerHTML=`
			<div><span class="font-semibold text-white">${rt("helpconfirmlabel")}</span>${rt("helpconfirmtext")}</div>
			<div><span class="font-semibold text-white">${rt("helpseatlabel")}</span>${rt("helpseattext")}</div>
			<div><span class="font-semibold text-white">${rt("helpadvancelabel")}</span>${rt("helpadvancetext")}</div>
			<div><span class="font-semibold text-white">${rt("helpfinancelabel")}</span>${rt("helpfinancetext")}</div>
		`
	}
	if(statusbox){
		statusbox.innerHTML=`
			<div><span class="font-semibold text-yellow-300">${rt("statusregistered")}：</span>${rt("helpregisteredtext")}</div>
			<div><span class="font-semibold text-green-300">${rt("statusconfirmed")}：</span>${rt("helpconfirmedtext")}</div>
			<div><span class="font-semibold text-sky-300">${rt("statusadvanced")}：</span>${rt("helpadvancedtext")}</div>
			<div><span class="font-semibold text-zinc-300">${rt("statuscancelled")}：</span>${rt("helpcancelledtext")}</div>
		`
	}
	if(flowbox){
		flowbox.innerHTML=`
			<div><span class="font-semibold text-white">1.</span> ${rt("helpflow1")}</div>
			<div><span class="font-semibold text-white">2.</span> ${rt("helpflow2")}</div>
			<div><span class="font-semibold text-white">3.</span> ${rt("helpflow3")}</div>
			<div><span class="font-semibold text-white">4.</span> ${rt("helpflow4")}</div>
		`
	}
}

function selectedplayerids(){
	let ids=[]
	let checks=document.querySelectorAll(".selectplayer:checked")
	for(let i=0;i<checks.length;i=i+1){
		if(checks[i].dataset.status=="confirmed"){
			ids.push(int(checks[i].value))
		}
	}
	return ids
}

function selectedconfirmids(){
	let ids=[]
	let checks=document.querySelectorAll(".selectplayer:checked")
	for(let i=0;i<checks.length;i=i+1){
		ids.push(int(checks[i].value))
	}
	return ids
}

function syncselectedplayers(source){
	let value=source.checked
	let id=source.value
	let checks=document.querySelectorAll(`.selectplayer[value="${id}"]`)
	for(let i=0;i<checks.length;i=i+1){
		checks[i].checked=value
	}
}

function setallplayers(checked){
	let checks=document.querySelectorAll(".selectplayer")
	for(let i=0;i<checks.length;i=i+1){
		checks[i].checked=checked
	}
}

function registrationfiltermatched(row){
	if(registrationfilter=="alive"){
		if(row["status"]=="cancelled"){
			return false
		}
		if(row["timerstatus"]=="eliminated"){
			return false
		}
		return true
	}
	if(registrationfilter=="eliminated"){
		return row["timerstatus"]=="eliminated"
	}
	if(registrationfilter=="unseated"){
		if(row["status"]!="confirmed"){
			return false
		}
		if(row["timerstatus"]=="eliminated"){
			return false
		}
		if(row["tableid"]&&row["seatno"]){
			return false
		}
		return true
	}
	if(registrationfilter=="registered"){
		return row["status"]=="registered"
	}
	if(registrationfilter=="confirmed"){
		return row["status"]=="confirmed"&&row["timerstatus"]!="eliminated"
	}
	if(registrationfilter=="advanced"){
		return row["status"]=="advanced"
	}
	if(registrationfilter=="cancelled"){
		return row["status"]=="cancelled"
	}
	return true
}

function registrationkeywordmatched(row){
	let keyword=registrationkeyword.trim().toLowerCase()
	if(!keyword){
		return true
	}
	let text=""
	text=text+" "+String(row["playername"]||"")
	text=text+" "+String(row["playerplayerid"]||"")
	text=text+" "+String(row["email"]||"")
	text=text+" "+String(row["serialno"]||"")
	text=text+" "+String(row["timerplace"]||"")
	text=text+" "+String(row["advancetargetname"]||"")
	text=text.toLowerCase()
	if(text.indexOf(keyword)>=0){
		return true
	}
	return false
}

function getfilteredregistrationlist(){
	let list=[]
	for(let i=0;i<registrationdatalist.length;i=i+1){
		let row=registrationdatalist[i]
		if(registrationfiltermatched(row)&&registrationkeywordmatched(row)){
			list.push(row)
		}
	}
	return list
}

function setregistrationfilter(value){
	registrationfilter=value||"all"
	registrationpage=1
	saveregistrationquerystate()
	renderregistrationlist()
}

function bindregistrationquery(){
	oninput("#registrationkeyword",function(element,event){
		registrationkeyword=element.value
		registrationpage=1
		saveregistrationquerystate()
		renderregistrationlist()
	})
	onchange("#registrationpagesize",function(element,event){
		registrationpagesize=int(element.value)||25
		registrationpage=1
		saveregistrationquerystate()
		renderregistrationlist()
	})
	onclick(".registrationfilterbtn",function(element,event){
		setregistrationfilter(dataset(element,"filter"))
	})
	onclick("#registrationprevpage",function(element,event){
		if(1<registrationpage){
			registrationpage=registrationpage-1
			saveregistrationquerystate()
			renderregistrationlist()
		}
	})
	onclick("#registrationnextpage",function(element,event){
		let list=getfilteredregistrationlist()
		let maxpage=Math.ceil(list.length/registrationpagesize)||1
		if(registrationpage<maxpage){
			registrationpage=registrationpage+1
			saveregistrationquerystate()
			renderregistrationlist()
		}
	})
}

function cancancelregistration(r){
	if(r["timerstatus"]=="eliminated"){
		return false
	}
	if(r["tableid"]&&r["seatno"]){
		return false
	}
	return true
}

function canreentryregistration(r){
	if(r["timerstatus"]!="eliminated"){
		return false
	}
	if(0<maxreentry&&int(r["reentrycount"]||0)<maxreentry){
		return true
	}
	return false
}

// Rebuy 給在場中(已確認、未淘汰)的選手：允許 rebuy 且未達上限。
function canrebuyregistration(r){
	if(r["status"]!="confirmed"){
		return false
	}
	if(r["timerstatus"]=="eliminated"){
		return false
	}
	if(!rebuyallowed){
		return false
	}
	if(0<maxrebuy&&int(r["rebuycount"]||0)>=maxrebuy){
		return false
	}
	return true
}

function statusbadge(status){
	if(status=="registered"){
		return `<span class="bg-yellow-900/40 text-yellow-300 px-2 py-1 rounded text-xs font-semibold">${rt("statusregistered")}</span>`
	}
	if(status=="confirmed"){
		return `<span class="bg-green-900/40 text-green-300 px-2 py-1 rounded text-xs font-semibold">${rt("statusconfirmed")}</span>`
	}
	if(status=="advanced"){
		return `<span class="bg-sky-900/40 text-sky-300 px-2 py-1 rounded text-xs font-semibold">${rt("statusadvanced")}</span>`
	}
	if(status=="cancelled"){
		return `<span class="bg-zinc-700 text-zinc-400 px-2 py-1 rounded text-xs font-semibold">${rt("statuscancelled")}</span>`
	}
	return `<span>${status}</span>`
}

function formattime(ts){
	if(!ts){
		return "-"
	}
	return ptformatdatetime(ts)
}

function tmt(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["tablemanage"]&&TRANSLATE[LANGUAGE]["tablemanage"][key]){
		return TRANSLATE[LANGUAGE]["tablemanage"][key]
	}
	return fallback
}

function tableoptions(selected,openonlyed){
	let html=`<option value="">${rt("noseat")}</option>`
	let matched=false
	for(let i=0;i<tables.length;i=i+1){
		let table=tables[i]
		let closed=table["closedtime"]?true:false
		// openonlyed: 排座下拉只列開放中的桌 (已關閉桌不可再塞新選手); 手動座位下拉仍列出全部, 但標註已關閉
		if(openonlyed&&closed&&String(selected)!=String(table["id"])){
			continue
		}
		let label=String(table["no"]||table["token"]||("Table "+table["id"]))
		if(closed){
			label=label+" ("+tmt("closedbadge","已關閉")+")"
		}
		if(String(selected)==String(table["id"])){
			matched=true
		}
		html=html+`<option value="${safehtml(table["id"])}" ${String(selected)==String(table["id"])?"selected":""}>${safehtml(label)}</option>`
	}
	// 已存的牌桌可能已被刪除，此時同樣要保住原值，否則改別的欄位會把選手靜默移出牌桌。
	if(!matched&&selected){
		html=html+`<option value="${safehtml(selected)}" selected>${safehtml(selected)}${rt("tablenotfound")}</option>`
	}
	return html
}

function buildseatoccupancy(){
	seatoccupancy={}
	for(let i=0;i<registrationdatalist.length;i=i+1){
		let row=registrationdatalist[i]
		let seated=row["tableid"]&&row["seatno"]&&row["status"]!="cancelled"&&row["timerstatus"]!="eliminated"
		if(seated){
			let tablekey=String(row["tableid"])
			let seatkey=String(row["seatno"])
			if(!seatoccupancy[tablekey]){
				seatoccupancy[tablekey]={}
			}
			seatoccupancy[tablekey][seatkey]=String(row["id"])
		}
	}
}

function seatoptions(selected,tableid,ownid){
	let html=`<option value="">-</option>`
	let taken={}
	if(tableid&&seatoccupancy[String(tableid)]){
		taken=seatoccupancy[String(tableid)]
	}
	let matched=false
	for(let i=1;i<=maxseat;i=i+1){
		let occupant=taken[String(i)]||""
		let takenbyother=occupant&&String(occupant)!=String(ownid)
		let isselected=String(selected)==String(i)
		if(isselected){
			matched=true
		}
		if(!takenbyother||isselected){
			html=html+`<option value="${i}" ${isselected?"selected":""}>${i}</option>`
		}
	}
	// 座位號可能超出目前的 maxseat（例如場次把每桌座位從 9 改成 6，但已有人坐 8 號位）。
	// 若不補這個選項，select 會落在第一個「-」，而改動任一欄位時 handler 會把該選手的
	// tableid / seatno / startchip 一起送出 —— 使用者只是改了計分牌，座位就被靜默清掉。
	if(!matched&&selected){
		html=html+`<option value="${safehtml(selected)}" selected>${safehtml(selected)}${rt("seatoutofrange")}</option>`
	}
	return html
}

function scheduleregistrationreload(){
	if(registrationreloadtimer){
		clearTimeout(registrationreloadtimer)
	}
	registrationreloadtimer=setTimeout(function(){
		loadregistrations()
	},250)
}

function registrationwsurl(){
	let proto=location.protocol=="https:"?"wss:":"ws:"
	return proto+"//"+location.host+WSPREFIX+"timer/"+sessionid+"/"
}

function connectregistrationws(){
	if(registrationws){
		return
	}
	try{
		registrationws=new WebSocket(registrationwsurl())
	}catch(error){
		return
	}
	registrationws.onmessage=function(event){
		try{
			let msg=JSON.parse(event.data)
			if((msg["type"]=="init"||msg["type"]=="update")&&msg["state"]){
				scheduleregistrationreload()
			}
		}catch(error){
		}
	}
	registrationws.onclose=function(){
		registrationws=null
		if(registrationwstimer){
			clearTimeout(registrationwstimer)
		}
		registrationwstimer=setTimeout(function(){
			connectregistrationws()
		},3000)
	}
}

function askadvancechip(defaultchip,done){
	let cover=doccreate("div")
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-sm w-full p-5 shadow-xl">
			<div class="text-lg font-semibold text-white mb-3">${rt("advancechiptitle")}</div>
			<div class="text-sm text-zinc-300 mb-3">${rt("advancechipdesc")}</div>
			<input type="number" id="advancechipinput" class="w-full bg-zinc-700 text-white rounded px-3 py-2" value="${defaultchip||0}" min="1" inputmode="numeric">
			<div class="flex justify-end gap-2 mt-5">
				<input type="button" class="advancecancel bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded" value="${rt("cancel")}">
				<input type="button" class="advanceok bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" value="${rt("confirmadvance")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(cover)
	cover.querySelector(".advancecancel").addEventListener("click",function(){
		ptremovescrollcover(cover)
	})
	cover.querySelector(".advanceok").addEventListener("click",function(){
		let chip=int(cover.querySelector("#advancechipinput").value)
		// 欄位留空時 int("") 會是 NaN，而 NaN<=0 是 false ——
		// 用 chip<=0 檢查會被繞過，接著 JSON.stringify 把 NaN 變成 null，
		// 後端收到 null 會回退成 startchip，選手就帶著錯的計分牌晉級（靜默）。
		// 改用正向條件，NaN 不成立即被擋下。
		if(!(chip>0)){
			pttoast(rt("needadvancechip"),"warning")
			return
		}
		ptremovescrollcover(cover)
		done(chip)
	})
	onenterclick("#advancechipinput",function(){ click(cover.querySelector(".advanceok")) })
}

function canadvanceregistration(){
	if(1<advancetargets.length){
		pttoast(rt("multiadvancetarget"),"warning")
		return false
	}
	return true
}

function financebuttonhtml(r){
	let payment=r["paymenttype"]=="ticket"?rt("paymentticket"):rt("paymentcash")
	let prize=r["prizeoverride"]==null?rt("prizeauto"):r["prizeoverride"]
	let buyextra=""
	if(rebuyallowed){
		buyextra=buyextra+`<span class="text-emerald-300">R:${int(r["rebuycount"]||0)}</span> `
	}
	if(addonallowed){
		buyextra=buyextra+`<span class="text-sky-300">A:${int(r["addoncount"]||0)}</span>`
	}
	return `
		<div class="flex items-center justify-between gap-2 md:block">
			<div class="text-xs text-zinc-400 leading-5 mb-2">
				<div>Reentry ${r["reentrycount"]||0}${rt("reentryunit")} / ${payment}</div>
				${buyextra?`<div>${rt("addonlabel")}${buyextra}</div>`:""}
				<div>${rt("prizefixlabel")}${prize}${rt("ticketvaluelabel")}${r["ticketvalue"]||0}</div>
			</div>
			<input type="button" class="openfinancebtn bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-xs" data-id="${r["id"]}" data-reentry="${r["reentrycount"]||0}" data-rebuy="${int(r["rebuycount"]||0)}" data-addon="${int(r["addoncount"]||0)}" data-prize="${r["prizeoverride"]==null?"":r["prizeoverride"]}" data-ticket="${r["ticketvalue"]||0}" data-payment="${r["paymenttype"]||"cash"}" value="${rt("financefix")}">
		</div>
	`
}

function openfinancemodal(button){
	let id=dataset(button,"id")
	let old=domgetid("financemodal")
	if(old){
		ptremovescrollcover(old)
	}
	let cover=doccreate("div")
	cover.id="financemodal"
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-5 shadow-xl">
			<div class="flex items-center justify-between mb-4">
				<div class="text-lg font-semibold text-white">${rt("financetitle")}</div>
				<input type="button" class="closefinance text-zinc-400 hover:text-white" value="×">
			</div>
			<div class="text-sm text-zinc-400 mb-4">${rt("financedesc")}</div>
			<div class="grid grid-cols-1 gap-3">
				<label class="text-sm text-zinc-300">${rt("financereentry")}<input type="number" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="reentrycount" inputmode="numeric" value="${dataset(button,"reentry")||0}"></label>
				${rebuyallowed?`<label class="text-sm text-zinc-300">${rt("financerebuy")}<input type="number" min="0" inputmode="numeric" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="rebuycount" value="${dataset(button,"rebuy")||0}" placeholder="${rt("sessionmax")}${maxrebuy}"></label>`:""}
				${addonallowed?`<label class="text-sm text-zinc-300">${rt("financeaddon")}<input type="number" min="0" inputmode="numeric" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="addoncount" value="${dataset(button,"addon")||0}" placeholder="${rt("sessionmax")}${maxaddon}"></label>`:""}
				<label class="text-sm text-zinc-300">${rt("financeprize")}<input type="number" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="prizeoverride" inputmode="numeric" value="${dataset(button,"prize")}" placeholder=rt("autoprizehint")></label>
				<label class="text-sm text-zinc-300">${rt("financeticket")}<input type="number" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="ticketvalue" inputmode="numeric" value="${dataset(button,"ticket")||0}"></label>
				<label class="text-sm text-zinc-300">${rt("financepayment")}<select class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="paymenttype">
					<option value="cash" ${dataset(button,"payment")!="ticket"?"selected":""}>${rt("paymentcashbuy")}</option>
					<option value="ticket" ${dataset(button,"payment")=="ticket"?"selected":""}>${rt("paymentticketbuy")}</option>
				</select></label>
			</div>
			<div class="flex justify-end gap-2 mt-5">
				<input type="button" class="closefinance bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded" value="${rt("cancel")}">
				<input type="button" class="savefinancebtn bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" data-id="${id}" value="${rt("save")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(cover)
	onclick(".closefinance",function(element,event){
		ptremovescrollcover(domgetid("financemodal"))
	})
	onclick(".savefinancebtn",function(element,event){
		savefinance(dataset(element,"id"))
	})
	onenterclick(".financeinput",function(){ savefinance(id) })
}

function searchusers(){
	let keyword=getvalue("hostplayerid")||""
	let box=domgetid("usersearchresult")
	if(!box){
		return
	}
	if(!keyword&&showtestusered){
		keyword=TESTUSERKEYWORD
	}
	if(!keyword){
		box.classList.add("hidden")
		box.innerHTML=""
		return
	}
	ajax("GET",AJAXURL+"searchusers?sessionid="+sessionid+"&keyword="+encodeURIComponent(keyword),function(event,data){
		if(!data["success"]){
			return
		}
		let rows=data["data"]||[]
		let html=""
		for(let i=0;i<rows.length;i=i+1){
			let r=rows[i]
			if(!showtestusered&&String(r["playerid"]||"").indexOf("0")==0){
				continue
			}
			let action=`<input type="button" class="searchregisterbtn bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs" data-playerid="${safehtml(r["playerid"])}" value="${rt("register")}">`
			if(r["isstaff"]){
				action=`<span class="text-xs text-red-300">${rt("staffcannotregister")}</span>`
			}
			if(r["registrationstatus"]){
				action=`<span class="text-xs text-zinc-400">${r["registrationstatus"]}</span>`
				if(r["registrationstatus"]=="confirmed"&&r["timerstatus"]=="eliminated"&&0<maxreentry&&int(r["reentrycount"]||0)<maxreentry){
					action=`<input type="button" class="searchregisterbtn bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs" data-playerid="${safehtml(r["playerid"])}" value="Reentry">`
				}
			}
			html=html+`
				<div class="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
					<div>
						<div class="text-sm text-white">${escapehtml(r["name"]||"-")}</div>
						<div class="text-xs text-zinc-500">${escapehtml(r["playerid"]||"")} ${escapehtml(r["email"]||"")}</div>
					</div>
					${action}
				</div>
			`
		}
		if(!html){
			html=`<div class="px-3 py-3 text-zinc-500 text-sm">${rt("nomatchuser")}</div>`
		}
		if(!html){
			html=`
				<div class="px-4 py-4 text-sm leading-7 text-zinc-400">
					<div class="font-semibold text-zinc-200">${rt("nomatchplayer")}</div>
					<div class="mt-1">${rt("searchdesc")}</div>
				</div>
			`
		}
		box.innerHTML=html
		box.classList.remove("hidden")
		onclick(".searchregisterbtn",function(element,event){
			element.disabled=true
			ajax("POST",AJAXURL+"registersessionplayer/"+sessionid,function(event,data){
				if(data["success"]){
					setregistrationresultsummary({
						"showed": true,
						"type": "success",
						"eyebrow": rt("panelregisterresult"),
						"title": rt("paneladded1"),
						"message": rt("paneladdedmsg"),
						"items": [
							{"label": rt("labelsuccess"), "value": "1"},
							{"label": rt("labelfail"), "value": "0"},
							{"label": rt("labelnext"), "value": rt("valueconfirmseat")}
						]
					})
					loadregistrations()
				}else{
					pttoast(pterror(data["data"]||"報名失敗"),"error")
					element.disabled=false
				}
			},str({
				"playerid": dataset(element,"playerid")
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			],{
				loadingtarget: "#usersearchresult"
			})
		})
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#usersearchresult"
	})
}

function loadregistrations(){
	ajax("GET",AJAXURL+"getsessionregistrationlist/"+sessionid,function(event,data){
		if(!data["success"]){
			pttoast(pterror(data["data"]||"載入失敗"),"error")
			return
		}

		let row=data["data"]
		tables=row["tables"]||[]
		advancetargets=row["advancetargets"]||[]
		startchip=row["startchip"]||0
		maxseat=int(row["maxseat"]||9)
		maxreentry=int(row["reentrycount"]||0)
		maxrebuy=int(row["rebuycount"]||0)
		maxaddon=int(row["addoncount"]||0)
		rebuyallowed=!!row["rebuyallowed"]
		addonallowed=!!row["addonallowed"]
		unifiedhandrecord=!!row["unifiedhandrecord"]
		totalchipcount=int(row["totalchipcount"]||0)
		receiptheaderdata["seriestitle"]=row["seriestitle"]||""
		receiptheaderdata["clubname"]=row["clubname"]||""
		receiptheaderdata["event"]=row["sessionname"]||""
		receiptheaderdata["starttime"]=row["starttime"]||""

		innertext("#sessionname",row["sessionname"],false)
		let totalchipbox=domgetid("stattotalchip")
		if(totalchipbox){
			totalchipbox.textContent=totalchipcount.toLocaleString("en-US")
		}
		let stats=row["stats"]||{}
		innertext("#statregistered",stats["registered"]||0,false)
		innertext("#statconfirmed",(stats["confirmed"]||0)+(stats["advanced"]||0),false)
		innertext("#statcancelled",stats["cancelled"]||0,false)
		renderregistrationguides()
		setregistrationresultsummary(registrationresultsummary)

		let toolbar=domgetid("registrationtoolbar")
		if(toolbar){
			let tablehtml=tableoptions("",true)
			toolbar.innerHTML=`
				<div class="flex items-center justify-between gap-3">
					<div>
						<div class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">${rt("addplayer")}</div>
						<div class="mb-3 text-sm leading-6 text-zinc-400">${rt("searchhint")}</div>
					</div>
					<div class="flex flex-wrap gap-2 items-center mb-3">
						<input type="text" class="bg-zinc-700 text-white rounded px-2 py-2 text-sm w-48" id="hostplayerid" placeholder=rt("searchplaceholder")>
						<input type="button" class="${showtestusered?"bg-emerald-600 hover:bg-emerald-700":"bg-zinc-700 hover:bg-zinc-600"} px-3 py-2 rounded text-sm font-semibold" id="showtestuserbtn" value="${rt("testuser")}">
					</div>
				</div>
				<div class="mb-3 hidden rounded border border-zinc-700 overflow-hidden" id="usersearchresult"></div>
				<div class="mt-4 border-t border-zinc-800 pt-4 mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">${rt("batchtitle")}</div>
				<div class="mb-3 text-sm leading-6 text-zinc-400">${rt("batchhint")}</div>
				<div class="flex flex-wrap gap-2 items-center">
					<label class="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" id="selectallplayers">${rt("selectall")}</label>
					<input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-sm font-semibold" id="confirmselectedbtn" value="${rt("batchconfirmbtn")}">
					<select class="bg-zinc-700 text-white rounded px-2 py-2 text-sm" id="randomtable">${tablehtml}</select>
					<input type="number" class="bg-zinc-700 text-white rounded px-2 py-2 text-sm w-28" id="randomstartchip" inputmode="numeric" value="${startchip}" placeholder="${rt("startchipplaceholder")}">
					<input type="button" class="bg-sky-600 hover:bg-sky-700 px-3 py-2 rounded text-sm font-semibold" id="randomunseatedbtn" value="${rt("fillunseatedbtn")}">
					<input type="button" class="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-semibold" id="randomselectedbtn" value="${rt("reseatselectedbtn")}">
					<input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-sm font-semibold" id="randombalancedbtn" value="${rt("balanceallbtn")}">
					<input type="button" class="bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded text-sm font-semibold" id="unseatallbtn" value="${rt("unseatall_btn")}">
					<input type="button" class="bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded text-sm font-semibold" id="applybestchipbtn" value="${rt("applybestchipbtn")}">
				</div>
				<div class="mt-4 border-t border-zinc-800 pt-4">
					<div class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">List Query</div>
					<div class="flex flex-wrap items-center gap-2">
						<input type="text" class="bg-zinc-700 text-white rounded px-2 py-2 text-sm w-full sm:w-64" id="registrationkeyword" value="${safehtml(registrationkeyword)}" placeholder="${rt("filterplaceholder")}">
						<input type="button" class="registrationfilterbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" data-filter="all" value="${rt("filterall")}">
						<input type="button" class="registrationfilterbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" data-filter="alive" value="${rt("filteralive")}">
						<input type="button" class="registrationfilterbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" data-filter="eliminated" value="${rt("filterbusted")}">
						<input type="button" class="registrationfilterbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" data-filter="unseated" value="${rt("filterunseated")}">
						<input type="button" class="registrationfilterbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" data-filter="registered" value="${rt("filterpending")}">
						<select class="bg-zinc-700 text-white rounded px-2 py-2 text-sm" id="registrationpagesize">
							<option value="10" ${registrationpagesize==10?"selected":""}>${rt("perpageprefix")}10</option>
							<option value="25" ${registrationpagesize==25?"selected":""}>${rt("perpageprefix")}25</option>
							<option value="50" ${registrationpagesize==50?"selected":""}>${rt("perpageprefix")}50</option>
							<option value="100" ${registrationpagesize==100?"selected":""}>${rt("perpageprefix")}100</option>
						</select>
					</div>
					<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
						<div class="text-sm text-zinc-400" id="registrationpageinfo"></div>
						<div class="flex gap-2">
							<input type="button" class="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" id="registrationprevpage" value="${rt("prevpage")}">
							<input type="button" class="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" id="registrationnextpage" value="${rt("nextpage")}">
						</div>
					</div>
				</div>
			`
			let hostinput=domgetid("hostplayerid")
			if(hostinput){
				hostinput.placeholder=rt("searchplaceholder")
			}
			// let searchbutton=domgetid("searchuserbtn")
			// if(searchbutton&&!domgetid("hostregisterbtn")){
			// 	searchbutton.value="${rt("searchplayerbtn")}"
			// 	searchbutton.insertAdjacentHTML("afterend",`<input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-sm font-semibold" id="hostregisterbtn" value="直接報名">`)
			// }
			let resultbox=domgetid("usersearchresult")
			if(resultbox&&resultbox.previousElementSibling==null){
				resultbox.classList.add("mt-3")
			}
			oninput("#hostplayerid",function(element,event){
				searchusers()
			})
			onclick("#showtestuserbtn",function(element,event){
				showtestusered=!showtestusered
				if(showtestusered){
					element.classList.remove("bg-zinc-700","hover:bg-zinc-600")
					element.classList.add("bg-emerald-600","hover:bg-emerald-700")
				}else{
					element.classList.remove("bg-emerald-600","hover:bg-emerald-700")
					element.classList.add("bg-zinc-700","hover:bg-zinc-600")
				}
				searchusers()
			})
			onclick("#randomunseatedbtn",function(element,event){
				let tableid=getvalue("randomtable")
				if(!tableid){
					pttoast(rt("needselecttable"),"warning")
					return
				}
				element.disabled=true
				ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+sessionid,function(event,data){
					element.disabled=false
					if(data["success"]){
						setregistrationresultsummary({
							"showed": true,
							"type": "success",
							"eyebrow": rt("panelseatresult"),
							"title": rt("panelfilledtitle"),
							"message": rt("panelfilledmsg"),
							"items": [
								{"label": rt("labelmode"), "value": rt("valuefillunseated")},
								{"label": rt("labeltable"), "value": String(tableid)},
								{"label": rt("labelchip"), "value": String(int(getvalue("randomstartchip")||startchip))}
							]
						})
						loadregistrations()
					}else{
						pttoast(pterror(data["data"]||"隨機座位失敗"),"error")
					}
				},str({
					"tableid": int(tableid),
					"startchip": int(getvalue("randomstartchip")||startchip),
					"mode": "unseated"
				}),[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				],{
					loadingtarget: "#reglist"
				})
			})
			onclick("#randomselectedbtn",function(element,event){
				let tableid=getvalue("randomtable")
				let ids=selectedplayerids()
				if(!tableid){
					pttoast(rt("needselecttable"),"warning")
					return
				}
				if(ids.length==0){
					pttoast(rt("needselectreseat"),"warning")
					return
				}
				element.disabled=true
				ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+sessionid,function(event,data){
					element.disabled=false
					if(data["success"]){
						setregistrationresultsummary({
							"showed": true,
							"type": "success",
							"eyebrow": rt("panelseatresult"),
							"title": rt("panelreseattitle"),
							"message": rt("panelreseatmsg"),
							"items": [
								{"label": rt("labelmode"), "value": rt("valuereseatselected")},
								{"label": rt("labelsuccess"), "value": String(ids.length)},
								{"label": rt("labeltable"), "value": String(tableid)}
							]
						})
						loadregistrations()
					}else{
						pttoast(pterror(data["data"]||"重排座位失敗"),"error")
					}
				},str({
					"tableid": int(tableid),
					"startchip": int(getvalue("randomstartchip")||startchip),
					"mode": "selected",
					"playerids": ids
				}),[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				],{
					loadingtarget: "#reglist"
				})
			})
			onclick("#randombalancedbtn",function(element,event){
				element.disabled=true
				ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+sessionid,function(event,data){
					element.disabled=false
					if(data["success"]){
						setregistrationresultsummary({
							"showed": true,
							"type": "success",
							"eyebrow": rt("panelseatresult"),
							"title": rt("panelbalancetitle"),
							"message": rt("panelbalancemsg"),
							"items": [
								{"label": rt("labelmode"), "value": rt("valuebalanceall")},
								{"label": rt("labelstartchip"), "value": String(int(getvalue("randomstartchip")||startchip))},
								{"label": rt("labelnext"), "value": rt("valuechecktable")}
							]
						})
						loadregistrations()
					}else{
						pttoast(pterror(data["data"]||"平均排座失敗"),"error")
					}
				},str({
					"startchip": int(getvalue("randomstartchip")||startchip),
					"mode": "balanced"
				}),[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				],{
					loadingtarget: "#reglist"
				})
			})
			onclick("#unseatallbtn",function(element,event){
				ptconfirm(rt("unseatall_confirm"),function(okayed){
					if(!okayed){
						return
					}
					element.disabled=true
					ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+sessionid,function(event,data){
						element.disabled=false
						if(data["success"]){
							let unseatedcount=(data["data"]||{})["unseatedcount"]||0
							pttoast(rt("unseatall_done").replace("{n}",String(unseatedcount)),"success")
							loadregistrations()
						}else{
							pttoast(pterror(data["data"]||rt("unseatall_fail")),"error")
						}
					},str({
						"mode": "unseatall"
					}),[
						["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
					],{
						loadingtarget: "#reglist"
					})
				})
			})
			onclick("#selectallplayers",function(element,event){
				setallplayers(element.checked)
			})
			onclick("#confirmselectedbtn",function(element,event){
				confirmselectedplayers(element)
			})
			onclick("#applybestchipbtn",function(element,event){
				applybestadvancechips(element)
			})
			bindregistrationquery()
		}

		registrationdatalist=row["registrations"]||[]
		renderregistrationlist()
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#reglist"
	})
}

function renderregistrationlist(){
		let fulllist=getfilteredregistrationlist()
		fulllist=ptsortlist(fulllist,registrationsortstate["key"],registrationsortstate["ascended"],registrationsortvalue)
		ptsortarrow("#reghead",registrationsortstate["key"],registrationsortstate["ascended"])
		let maxpage=Math.ceil(fulllist.length/registrationpagesize)||1
		if(registrationpage>maxpage){
			registrationpage=maxpage
		}
		if(registrationpage<1){
			registrationpage=1
		}
		saveregistrationquerystate()
		let start=(registrationpage-1)*registrationpagesize
		let end=start+registrationpagesize
		let list=[]
		for(let i=start;i<fulllist.length&&i<end;i=i+1){
			list.push(fulllist[i])
		}
		let pageinfo=domgetid("registrationpageinfo")
		if(pageinfo){
			let from=start+1
			if(fulllist.length==0){
				from=0
			}
			let to=end
			if(fulllist.length<to){
				to=fulllist.length
			}
			pageinfo.innerText=rt("pageinfoprefix")+from+"-"+to+" / "+fulllist.length+rt("pageinfomid")+registrationpage+" / "+maxpage+rt("pageinfosuffix")
		}
		let prevbutton=domgetid("registrationprevpage")
		if(prevbutton){
			prevbutton.disabled=registrationpage<=1
		}
		let nextbutton=domgetid("registrationnextpage")
		if(nextbutton){
			nextbutton.disabled=maxpage<=registrationpage
		}
		let filterbuttons=document.querySelectorAll(".registrationfilterbtn")
		for(let i=0;i<filterbuttons.length;i=i+1){
			filterbuttons[i].classList.remove("bg-emerald-700","text-white")
			filterbuttons[i].classList.add("bg-zinc-700")
			if(dataset(filterbuttons[i],"filter")==registrationfilter){
				filterbuttons[i].classList.remove("bg-zinc-700")
				filterbuttons[i].classList.add("bg-emerald-700","text-white")
			}
		}
		let selectall=domgetid("selectallplayers")
		if(selectall){
			selectall.checked=false
		}
		let body=domgetid("reglist")
		let empty=domgetid("empty")
		let cards=domgetid("regcards")
		let emptymobile=domgetid("emptymobile")

		if(list.length==0){
			body.innerHTML=""
			cards.innerHTML=""
			if(registrationdatalist.length==0){
				empty.innerText=rt("noregistration")
				emptymobile.innerText=rt("noregistration")
			}else{
				empty.innerText=rt("nomatchregistration")
				emptymobile.innerText=rt("nomatchregistration")
			}
			empty.classList.remove("hidden")
			emptymobile.classList.remove("hidden")
			return
		}

		empty.classList.add("hidden")
		emptymobile.classList.add("hidden")

		buildseatoccupancy()

		let html=""
		let cardhtml=""
		for(let i=0;i<list.length;i=i+1){
			let r=list[i]
			let actions=""
			if(r["status"]=="registered"){
				actions=`
					<input type="button" class="confirmbtn bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="${rt("confirm")}">
					<input type="button" class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="${rt("cancel")}">
				`
			}else if(r["status"]=="confirmed"){
				actions=`
					${advancetargets.length?`<input type="button" class="advancebtn bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" data-chip="${(unifiedhandrecord&&int(r["latestchip"]||0)>0)?int(r["latestchip"]):(r["startchip"]||startchip)}" value="${rt("advance")}">`:""}
					${canrebuyregistration(r)?`<input type="button" class="rebuybtn bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="Rebuy">`:""}
					<input type="button" class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="${rt("cancel")}">
				`
				if(canreentryregistration(r)){
					actions=`
						<input type="button" class="reentrybtn bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs" data-playerid="${safehtml(r["playerplayerid"])}" value="Reentry">
						<input type="button" class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="${rt("cancel")}">
					`
				}else if(r["timerstatus"]=="eliminated"){
					actions=`<span class="text-xs text-yellow-300">${rt("reentrymaxed")}</span>`
				}
			}else if(r["status"]=="advanced"){
				actions=`
					${advancetargets.length?`<input type="button" class="advancebtn bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" data-chip="${r["advancechip"]||r["startchip"]||startchip}" value="${rt("updatechip")}">`:""}
					<input type="button" class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="${rt("cancel")}">
				`
			}

			if(!cancancelregistration(r)){
				actions=actions.replace(/<input type="button" class="cancelbtn[^>]*?>/g,"")
			}
			let receiptbtn=`<input type="button" class="printreceiptbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="${rt("printreceipt")}">`
			let profitclass=0<=float(r["profit"])?"text-green-400":"text-red-400"
			let selectedhtml=(r["status"]=="registered"||r["status"]=="confirmed")?`<input type="checkbox" class="selectplayer" value="${r["id"]}" data-status="${r["status"]}">`:""
			let seathtml=`<span class="text-zinc-500 text-xs">${rt("seatafterconfirm")}</span>`
			if(r["status"]=="confirmed"){
				seathtml=`
					<div class="flex items-center justify-between gap-2 min-w-[100px] my-2">
						<select class="seatinput text-center w-full bg-zinc-700 text-white rounded px-2 py-1 text-xs" data-id="${r["id"]}" data-field="tableid">${tableoptions(r["tableid"])}</select>
						<select class="seatinput text-center w-full bg-zinc-700 text-white rounded px-2 py-1 text-xs" data-id="${r["id"]}" data-field="seatno">${seatoptions(r["seatno"],r["tableid"],r["id"])}</select>
					</div>
					<input type="number" class="seatinput w-full bg-zinc-700 text-white rounded px-2 py-1 text-xs" data-id="${r["id"]}" data-field="startchip" data-bestchip="${r["bestadvancechip"]||0}" value="${r["startchip"]||startchip}">
				`
				// 「記錄手牌」連結目前刻意不顯示；若未來要恢復，需在這裡重新加回產生碼（連到 newedithand.html?tableid=...&seatno=...&playerid=...）。
				if(r["timerstatus"]=="eliminated"){
					selectedhtml=""
					seathtml=`<span class="text-zinc-500 text-xs">${rt("bustedneedreentry")}</span>`
				}
			}
			html=html+`
				<tr class="border-t border-zinc-700">
					<td class="px-3 py-2">
						${selectedhtml}
					</td>
					<td class="px-3 py-2">
						<div>${escapehtml(r["playername"]||"-")}</div>
						<div class="text-xs text-zinc-500">${escapehtml(r["playerplayerid"]||"")}</div>
					</td>
					<td class="px-3 py-2 text-xs">${formattime(r["registertime"])}</td>
					<td class="px-3 py-2">${statusbadge(r["status"])}</td>
					<td class="px-3 py-2">
						${seathtml}
					</td>
					<td class="px-3 py-2">
						<div class="text-xs text-zinc-400">${rt("costlabel")}${r["cost"]||0} / ${rt("placelabel")}${r["timerplace"]||"-"}</div>
						<div class="text-xs text-zinc-400">${rt("autoprizelabel")}${r["autoprize"]||0}</div>
						${r["advancetargetid"]?`<div class="text-xs text-sky-300">${rt("advancedprefix")}${escapehtml(r["advancetargetname"]||"-")}${rt("chipmid")}${r["advancechip"]||0}</div>`:""}
						${0<int(r["advancecount"])?`<div class="text-xs text-sky-300">${rt("repeatadvanceprefix")}${r["advancecount"]}${rt("repeatadvancemid")}${r["bestadvancechip"]||0}</div>`:""}
						<div class="${profitclass} font-bold">${moneytext(r["profit"])}</div>
					</td>
					<td class="px-3 py-2">
						${financebuttonhtml(r)}
					</td>
					<td class="px-3 py-2 text-right">
						<div class="flex flex-wrap justify-end gap-1">${actions}${receiptbtn}</div>
					</td>
				</tr>
			`
			let mobilecheckbox=selectedhtml
			// 手機卡片欄寬只有半欄，桌次 / 座位下拉改成直向堆疊，避免擠在一行
			let mobileseathtml=seathtml.replace("flex items-center justify-between gap-2 min-w-[100px] my-2","grid grid-cols-1 gap-2 my-2")
			cardhtml=cardhtml+`
				<div class="registrationcard bg-zinc-800 rounded-lg border border-zinc-700 p-4">
					<div class="grid grid-cols-2 gap-5">
						<div class="">
							<div class="flex items-start gap-3">
								<div class="pt-1">${mobilecheckbox}</div>
								<div>
									<div class="font-semibold">${escapehtml(r["playername"]||"-")}</div>
									<div class="text-xs text-zinc-500">${escapehtml(r["playerplayerid"]||"")}</div>
									<div class="text-xs text-zinc-500 mt-1"> ${formattime(r["registertime"])}</div>
								</div>
							</div>
							<div class="mt-3">${statusbadge(r["status"])}</div>
						</div>
						<div>
							<div class="text-xs text-zinc-400 mb-2">${rt("tableseatchip")}</div>
							${mobileseathtml}
						</div>
					</div>
					<div class="mt-4 border-t border-zinc-700 grid grid-cols-2 gap-5 mt-4">
						<div class="flex items-center justify-between pt-3">
							<div>
								<div class="text-xs text-zinc-400">${rt("costlabel")}${r["cost"]||0} / ${rt("placelabel")}${r["timerplace"]||"-"}</div>
								<div class="text-xs text-zinc-400">${rt("autoprizelabel")}${r["autoprize"]||0}</div>
								${r["advancetargetid"]?`<div class="text-xs text-sky-300">${rt("advancedprefix")}${escapehtml(r["advancetargetname"]||"-")}${rt("chipmid")}${r["advancechip"]||0}</div>`:""}
								${0<int(r["advancecount"])?`<div class="text-xs text-sky-300">${rt("repeatadvanceprefix")}${r["advancecount"]}${rt("repeatadvancemid")}${r["bestadvancechip"]||0}</div>`:""}
							</div>
							<div class="${profitclass} font-bold mt-1">${moneytext(r["profit"])}</div>
						</div>
						<div class="pt-3">
							${financebuttonhtml(r)}
						</div>
					</div>
					<div class="mt-4 flex flex-wrap justify-end gap-2">
						${actions}${receiptbtn}
					</div>
				</div>
			`
		}

		body.innerHTML=html
		cards.innerHTML=cardhtml
		bindactions()
}

function bindactions(){
	onclick(".confirmbtn",function(element,event){
		element.disabled=true
		ajax("PUT",AJAXURL+"confirmsessionplayer/"+dataset(element,"id"),function(event,data){
			if(data["success"]){
				loadregistrations()
			}else{
				pttoast(pterror(data["data"]||"操作失敗"),"error")
				element.disabled=false
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		],{
			loadingtarget: "#reglist"
		})
	})

	onclick(".cancelbtn",function(element,event){
		ptconfirm(rt("confirmcancel"),function(ok){
			if(ok!=true){
				return
			}
			element.disabled=true
			ajax("PUT",AJAXURL+"cancelsessionplayer/"+dataset(element,"id"),function(event,data){
				if(data["success"]){
					loadregistrations()
				}else{
					pttoast(pterror(data["data"]||"操作失敗"),"error")
					element.disabled=false
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			],{
				loadingtarget: "#reglist"
			})
		})
	})

	onclick(".reentrybtn",function(element,event){
		element.disabled=true
		ajax("POST",AJAXURL+"registersessionplayer/"+sessionid,function(event,data){
			if(data["success"]){
				loadregistrations()
			}else{
				pttoast(pterror(data["data"]||"Reentry 失敗"),"error")
				element.disabled=false
			}
		},str({
			"playerid": dataset(element,"playerid")
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		],{
			loadingtarget: "#reglist"
		})
	})

	onclick(".rebuybtn",function(element,event){
		element.disabled=true
		ajax("PUT",AJAXURL+"rebuysessionplayer/"+dataset(element,"id"),function(event,data){
			if(data["success"]){
				loadregistrations()
			}else{
				pttoast(pterror(data["data"]||"Rebuy 失敗"),"error")
				element.disabled=false
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		],{
			loadingtarget: "#reglist"
		})
	})

	onclick(".advancebtn",function(element,event){
		if(!canadvanceregistration()){
			return
		}
		let sessionplayerid=dataset(element,"id")
		let defaultchip=int(dataset(element,"chip")||startchip)
		askadvancechip(defaultchip,function(chip){
			element.disabled=true
			ajax("PUT",AJAXURL+"advancesessionplayer/"+sessionplayerid,function(event,data){
				element.disabled=false
				if(data["success"]){
					let advancedata=data["data"]||{}
					let target=advancedata["target"]||{}
					let count=advancedata["advancecount"]||1
					pttoast(rt("advancedtoprefix")+(target["name"]||"-")+rt("advancedcountmid")+count+rt("advancedcountsuffix"),"success")
					loadregistrations()
				}else{
					pttoast(pterror(data["data"]||"晉級失敗"),"error")
				}
			},str({
				"advancechip": chip
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			],{
				loadingtarget: "#reglist"
			})
		})
	})

	let seatinputs=document.querySelectorAll(".seatinput")
	for(let i=0;i<seatinputs.length;i=i+1){
		seatinputs[i].addEventListener("change",function(){
			if(this.dataset.field=="tableid"){
				// 換桌時座位一律重設回未選 (-), 並依新桌重建可選座位, 避免把舊座位號帶到新桌
				let seatbox=this.closest("tr")||this.closest(".registrationcard")
				if(seatbox){
					let seatselect=seatbox.querySelector(`.seatinput[data-id="${this.dataset.id}"][data-field="seatno"]`)
					if(seatselect){
						seatselect.innerHTML=seatoptions("",this.value,this.dataset.id)
						seatselect.value=""
					}
				}
			}
			saveseat(this.dataset.id,this)
		})
	}

	let checks=document.querySelectorAll(".selectplayer")
	for(let i=0;i<checks.length;i=i+1){
		checks[i].addEventListener("change",function(){
			syncselectedplayers(this)
		})
	}

	onclick(".openfinancebtn",function(element,event){
		openfinancemodal(element)
	})

	onclick(".printreceiptbtn",function(element,event){
		let r=findregistrationbyid(dataset(element,"id"))
		if(!r){
			pttoast(rt("registrationnotfound"),"error")
			return
		}
		receiptprint(buildreceiptdata(r))
	})
}

function findregistrationbyid(id){
	for(let i=0;i<registrationdatalist.length;i=i+1){
		if(String(registrationdatalist[i]["id"])==String(id)){
			return registrationdatalist[i]
		}
	}
	return null
}

// 把一筆報名資料組成收據四聯單所需欄位。未知欄位（開賽時間 / 系列賽 / 開立人）先留空，之後再串。
function buildreceiptdata(r){
	let sessionname=""
	if(domgetid("sessionname")){
		sessionname=domgetid("sessionname").textContent||""
	}
	let payment=rt("paymentcash")
	if(r["paymenttype"]=="ticket"){
		payment=rt("paymentticket")
	}
	let tableno=""
	if(r["tableid"]){
		tableno=registrationtablename(r["tableid"])
	}
	// 報到 / 驗證網址：帶場次 id 與這筆報名 id。checkin.html 之後再做，QR 先把網址編進去。
	let basepath=location.pathname.replace(/[^/]*$/,"")
	let qrdata=location.origin+basepath+"checkin.html?sessionid="+encodeURIComponent(sessionid)+"&r="+encodeURIComponent(r["id"])
	// 入場編號要確認 / 報到後才有；未確認顯示「未確認」而不是舊號碼。
	let entryno=rt("entrypending")
	if((r["status"]=="confirmed"||r["status"]=="advanced")&&r["serialno"]){
		entryno=r["serialno"]
	}
	return {
		"seriestitle": receiptheaderdata["seriestitle"],
		"venue": receiptheaderdata["clubname"]||sessionname,
		"event": receiptheaderdata["event"]||sessionname,
		"starttime": receiptheaderdata["starttime"],
		"playername": r["playername"]||"",
		"entryno": entryno,
		"buyin": "NT$ "+(r["cost"]||0),
		"payment": payment,
		"issuedate": ptformatdatetime(r["registertime"]),
		"issuer": "",
		"tableno": tableno,
		"seatno": r["seatno"]||"",
		"qrdata": qrdata
	}
}

function confirmselectedplayers(button){
	let ids=selectedconfirmids()
	if(ids.length==0){
		pttoast(rt("needselectconfirm"),"warning")
		return
	}
	button.disabled=true
	let index=0
	let successcount=0
	function next(){
		if(ids.length<=index){
			button.disabled=false
			setregistrationresultsummary({
				"showed": true,
				"type": "success",
				"eyebrow": rt("panelbatchconfirm"),
				"title": rt("panelbatchtitle"),
				"message": rt("panelbatchmsg"),
				"items": [
					{"label": rt("labelsuccess"), "value": String(successcount)},
					{"label": rt("labelfail"), "value": String(ids.length-successcount)},
					{"label": rt("labelnext"), "value": rt("valuefillseat")}
				]
			})
			loadregistrations()
			return
		}
		ajax("PUT",AJAXURL+"confirmsessionplayer/"+ids[index],function(event,data){
			if(data["success"]){
				successcount=successcount+1
				index=index+1
				next()
			}else{
				button.disabled=false
				pttoast(pterror(data["data"]||"操作失敗"),"error")
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		],{
			loadingtarget: "#reglist"
		})
	}
	next()
}

function applybestadvancechips(button){
	// 先把每位重複晉級選手「整列」的座位資料快照下來(含套用後的 startchip)，
	// 之後再逐筆送出。每次儲存會觸發 WebSocket 廣播 → 重新載入並重繪表格，
	// 若改在送出當下才從 DOM 讀值，未存的列會被重繪洗回 0，導致只有前幾筆成功。
	let inputs=document.querySelectorAll(`.seatinput[data-field="startchip"]`)
	let plans=[]
	let seen={}
	for(let i=0;i<inputs.length;i=i+1){
		let id=inputs[i].dataset.id
		let best=int(inputs[i].dataset.bestchip)
		if(0<best&&!seen[id]){
			seen[id]=true
			let rowinputs=document.querySelectorAll(`.seatinput[data-id="${id}"]`)
			let payload={}
			for(let j=0;j<rowinputs.length;j=j+1){
				payload[rowinputs[j].dataset.field]=int(rowinputs[j].value)||0
			}
			payload["startchip"]=best
			plans.push({"id": id,"payload": payload})
		}
	}
	for(let i=0;i<inputs.length;i=i+1){
		let best=int(inputs[i].dataset.bestchip)
		if(0<best){
			inputs[i].value=best
		}
	}
	if(plans.length==0){
		pttoast(rt("noduplicateadvance"),"warning")
		return
	}
	ptconfirm(rt("confirmapplyprefix")+plans.length+rt("confirmapplysuffix"),function(okayed){
		if(!okayed){
			return
		}
		if(button){
			button.disabled=true
		}
		let index=0
		let successcount=0
		let failcount=0
		function next(){
			if(plans.length<=index){
				if(button){
					button.disabled=false
				}
				setregistrationresultsummary({
					"showed": true,
					"type": failcount==0?"success":"warning",
					"eyebrow": rt("panelapplymax"),
					"title": failcount==0?rt("panelapplyoktitle"):rt("panelapplyfailtitle"),
					"message": rt("panelapplymsg"),
					"items": [
						{"label": rt("labelsuccess"), "value": String(successcount)},
						{"label": rt("labelfail"), "value": String(failcount)}
					]
				})
				loadregistrations()
				return
			}
			let plan=plans[index]
			ajax("PUT",AJAXURL+"editsessionplayerseat/"+plan["id"],function(event,data){
				if(data["success"]){
					successcount=successcount+1
				}else{
					failcount=failcount+1
				}
				index=index+1
				next()
			},str(plan["payload"]),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			],{
				loadingtarget: "#reglist"
			})
		}
		next()
	})
}

function saveseat(sessionplayerid,source){
	let box=document
	if(source){
		box=source.closest("tr")
		if(!box){
			box=source.closest(".registrationcard")
		}
		if(!box){
			box=document
		}
	}
	let inputs=box.querySelectorAll(`.seatinput[data-id="${sessionplayerid}"]`)
	let payload={}
	for(let i=0;i<inputs.length;i=i+1){
		let field=inputs[i].dataset.field
		payload[field]=int(inputs[i].value)||0
	}
	ajax("PUT",AJAXURL+"editsessionplayerseat/"+sessionplayerid,function(event,data){
		if(data["success"]){
			setregistrationresultsummary({
				"showed": true,
				"type": "success",
				"eyebrow": rt("panelseatsaved"),
				"title": rt("panelseatsavedtitle"),
				"message": rt("panelseatsavedmsg"),
				"items": [
					{"label": rt("labelplayer"), "value": String(sessionplayerid)},
					{"label": rt("labelmode"), "value": rt("valuesingleseat")},
					{"label": rt("labelnext"), "value": rt("valuechecktable")}
				]
			})
			loadregistrations()
			let modal=domgetid("financemodal")
			if(modal){
				ptremovescrollcover(modal)
			}
		}else{
			pttoast(pterror(data["data"]||"儲存座位失敗"),"error")
		}
	},str(payload),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#reglist"
	})
}

function savefinance(sessionplayerid){
	let inputs=document.querySelectorAll(`.financeinput[data-id="${sessionplayerid}"]`)
	let payload={}
	for(let i=0;i<inputs.length;i=i+1){
		let field=inputs[i].dataset.field
		if(field=="paymenttype"){
			payload[field]=inputs[i].value
		}else if(field=="prizeoverride"&&inputs[i].value==""){
			payload[field]=null
		}else{
			payload[field]=float(inputs[i].value)||0
		}
	}
	ajax("PUT",AJAXURL+"editsessionplayerfinance/"+sessionplayerid,function(event,data){
		if(data["success"]){
			let warnings=(data["data"]&&data["data"]["warnings"])?data["data"]["warnings"]:[]
			for(let i=0;i<warnings.length;i=i+1){
				pttoast(pterror(warnings[i]),"warning")
			}
			// 收益修正不佔版面摘要區塊, 用上方浮動提示即可(警告已逐條 pttoast, 下方另有「修改完成」)
			loadregistrations()
			let modal=domgetid("financemodal")
			if(modal){
				ptremovescrollcover(modal)
			}
			pttoast(rt("edited"),"success")
		}else{
			pttoast(data["data"]||"儲存收益修正失敗","error")
		}
	},str(payload),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#reglist"
	})
}

// 匯出目前場次的報名名單為 CSV
function exportregistercsv(){
	if(!registrationdatalist||registrationdatalist.length<1){
		pttoast(rt("csv_none"),"error")
		return
	}
	let header=rt("csv_header").split("|")
	let rows=[header]
	for(let i=0;i<registrationdatalist.length;i=i+1){
		let r=registrationdatalist[i]
		// finalprize 已含後端 autoprize fallback, 且 prizeoverride 明確設 0 時 finalprize=0 是刻意值,
		// 不能用 ||autoprize 把 0 誤退回自動獎金 (會與用 0 算的 profit 矛盾), 只在 null/undefined 才 fallback。
		let prizevalue=r["finalprize"]
		if(prizevalue==null||prizevalue==undefined){
			prizevalue=r["autoprize"]
		}
		rows.push([
			r["serialno"]||(i+1),
			r["playername"]||"",
			r["playerplayerid"]||"",
			formattime(r["registertime"]),
			r["status"]||"",
			r["cost"]||0,
			r["timerplace"]||"",
			prizevalue||0,
			r["profit"]||0
		])
	}
	ptdownloadcsv("registrations_"+ptexporttimestamp()+".csv",rows)
	pttoast(rt("csv_done"),"success")
}

if(domgetid("exportregistercsv")){
	domgetid("exportregistercsv").value=rt("csv_btn")
}

onclick("#exportregistercsv",function(element,event){
	exportregistercsv()
})

function registrationstatustext(status){
	if(status=="registered"){
		return rt("statusregistered")
	}
	if(status=="confirmed"){
		return rt("statusconfirmed")
	}
	if(status=="advanced"){
		return rt("statusadvanced")
	}
	if(status=="cancelled"){
		return rt("statuscancelled")
	}
	return status||"-"
}

function registrationtablename(tableid){
	if(!tableid){
		return "-"
	}
	for(let i=0;i<tables.length;i=i+1){
		if(String(tables[i]["id"])==String(tableid)){
			return tables[i]["no"]||tables[i]["token"]||("桌 "+tableid)
		}
	}
	return "-"
}

// 列印整份報名名單（不受目前篩選 / 分頁影響，供協會紙本存底）
function printregistrationlist(){
	if(!registrationdatalist||registrationdatalist.length<1){
		pttoast(rt("noprintdata"),"error")
		return
	}
	let sessionname=""
	if(domgetid("sessionname")){
		sessionname=domgetid("sessionname").textContent||""
	}
	let columns=[
		{"title": rt("printcolno"),"align": "right"},
		{"title": rt("printcolplayer")},
		{"title": "ID"},
		{"title": rt("printcolregtime")},
		{"title": rt("printcolstatus"),"align": "center"},
		{"title": rt("printcoltable"),"align": "center"},
		{"title": rt("printcolseat"),"align": "center"},
		{"title": rt("printcolbuyin"),"align": "right"},
		{"title": rt("printcolplace"),"align": "center"},
		{"title": rt("printcolprize"),"align": "right"},
		{"title": rt("printcolprofit"),"align": "right"}
	]
	let rows=[]
	for(let i=0;i<registrationdatalist.length;i=i+1){
		let r=registrationdatalist[i]
		// 同 CSV 匯出: finalprize=0 (prizeoverride 明確設 0) 是刻意值, 只在 null/undefined 才 fallback autoprize。
		let prizevalue=r["finalprize"]
		if(prizevalue==null||prizevalue==undefined){
			prizevalue=r["autoprize"]
		}
		rows.push([
			r["serialno"]||(i+1),
			r["playername"]||"-",
			r["playerplayerid"]||"",
			formattime(r["registertime"]),
			registrationstatustext(r["status"]),
			registrationtablename(r["tableid"]),
			r["seatno"]||"-",
			r["cost"]||0,
			r["timerplace"]||r["place"]||"-",
			prizevalue||0,
			moneytext(r["profit"])
		])
	}
	let statregistered=domgetid("statregistered")?domgetid("statregistered").textContent:"0"
	let statconfirmed=domgetid("statconfirmed")?domgetid("statconfirmed").textContent:"0"
	let statcancelled=domgetid("statcancelled")?domgetid("statcancelled").textContent:"0"
	let stattotalchip=domgetid("stattotalchip")?domgetid("stattotalchip").textContent:"0"
	let infohtml=ptprintinfogrid([
		[rt("printsession"),sessionname||"-"],
		[rt("printtotalcount"),registrationdatalist.length],
		[rt("statusregistered"),statregistered],
		[rt("statusconfirmed"),statconfirmed],
		[rt("statuscancelled"),statcancelled],
		[rt("printtotalchip"),stattotalchip]
	])
	let bodyhtml=infohtml+ptprintsectiontitle(rt("printsectiontitle"))+ptprinttable(columns,rows,rt("noregistration"))+ptprintsignblock([rt("printsignstaff"),rt("printsignmanager")])
	ptprintrun(ptprintbuild({
		"eyebrow": "Registrations",
		"title": (sessionname||rt("printsession"))+rt("printtitlesuffix"),
		"subtitle": rt("printsubtitle"),
		"meta": rt("printmeta")+" "+ptprinttimestamp()
	},bodyhtml))
}

onclick("#printregister",function(element,event){
	printregistrationlist()
})

connectregistrationws()
loadregistrations()
