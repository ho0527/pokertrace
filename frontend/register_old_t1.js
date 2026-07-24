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
let registrationkeyword=""
let registrationstatekey=WEBLSNAME+"registrationquery"+sessionid

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

if(!sessionid){
	pttoast("缺少 sessionid","error")
	href("sessionlist.html")
}

domgetid("back").href="session.html?id="+sessionid

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
	}catch(error){
	}
}

loadregistrationquerystate()

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
			<div><span class="font-semibold text-white">確認報名：</span>把選手從「已報名」推進到可排座、可計入現場流程的狀態。</div>
			<div><span class="font-semibold text-white">排座：</span>只對已確認選手生效，可補未入座、重排選取選手，或平均全場座位。</div>
			<div><span class="font-semibold text-white">晉級：</span>把選手帶往下一場目標賽事，並保存該選手的晉級計分牌。</div>
			<div><span class="font-semibold text-white">收益修正：</span>只改這筆報名的財務資料，不會回寫整個場次設定。</div>
		`
	}
	if(statusbox){
		statusbox.innerHTML=`
			<div><span class="font-semibold text-yellow-300">已報名：</span>選手送出報名，但還沒完成主辦確認。</div>
			<div><span class="font-semibold text-green-300">已確認：</span>可排座、可計入現場人數與後續操作。</div>
			<div><span class="font-semibold text-sky-300">已晉級：</span>已轉入下一場目標賽事，若重複晉級會保留較高計分牌。</div>
			<div><span class="font-semibold text-zinc-300">已取消：</span>這筆報名已失效；若已淘汰則需看再入場額度是否仍可用。</div>
		`
	}
	if(flowbox){
		flowbox.innerHTML=`
			<div><span class="font-semibold text-white">1.</span> 先搜尋或新增選手，確認是不是要用現金 / 票券報名。</div>
			<div><span class="font-semibold text-white">2.</span> 先批次確認，再做未入座補位或平均排座，避免座位混亂。</div>
			<div><span class="font-semibold text-white">3.</span> 現場淘汰或多日賽時，再處理 Reentry、晉級與收益修正。</div>
			<div><span class="font-semibold text-white">4.</span> 每次批次操作後先看本頁摘要，再決定要不要繼續下一步。</div>
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
		return `<span class="bg-yellow-900/40 text-yellow-300 px-2 py-1 rounded text-xs font-semibold">已報名</span>`
	}
	if(status=="confirmed"){
		return `<span class="bg-green-900/40 text-green-300 px-2 py-1 rounded text-xs font-semibold">已確認</span>`
	}
	if(status=="advanced"){
		return `<span class="bg-sky-900/40 text-sky-300 px-2 py-1 rounded text-xs font-semibold">已晉級</span>`
	}
	if(status=="cancelled"){
		return `<span class="bg-zinc-700 text-zinc-400 px-2 py-1 rounded text-xs font-semibold">已取消</span>`
	}
	return `<span>${status}</span>`
}

function formattime(ts){
	if(!ts){
		return "-"
	}
	return ptformatdatetime(ts)
}

function tableoptions(selected){
	let html=`<option value="">未排座</option>`
	for(let i=0;i<tables.length;i=i+1){
		let table=tables[i]
		html=html+`<option value="${safehtml(table["id"])}" ${String(selected)==String(table["id"])?"selected":""}>${safehtml(table["no"]||table["token"]||("Table "+table["id"]))}</option>`
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
	for(let i=1;i<=maxseat;i=i+1){
		let occupant=taken[String(i)]||""
		let takenbyother=occupant&&String(occupant)!=String(ownid)
		let isselected=String(selected)==String(i)
		if(!takenbyother||isselected){
			html=html+`<option value="${i}" ${isselected?"selected":""}>${i}</option>`
		}
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
			<div class="text-lg font-semibold text-white mb-3">設定晉級計分牌</div>
			<div class="text-sm text-zinc-300 mb-3">系統會把選手帶到下一場多日賽；若選手重複晉級，下一場會保留最高計分牌。</div>
			<input type="number" id="advancechipinput" class="w-full bg-zinc-700 text-white rounded px-3 py-2" value="${defaultchip||0}" min="1" inputmode="numeric">
			<div class="flex justify-end gap-2 mt-5">
				<input type="button" class="advancecancel bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded" value="取消">
				<input type="button" class="advanceok bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" value="確認晉級">
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
			pttoast("請輸入晉級計分牌","warning")
			return
		}
		ptremovescrollcover(cover)
		done(chip)
	})
	onenterclick("#advancechipinput",function(){ click(cover.querySelector(".advanceok")) })
}

function canadvanceregistration(){
	if(1<advancetargets.length){
		pttoast("此賽事有多個晉級目標，請先整理關聯設定","warning")
		return false
	}
	return true
}

function financebuttonhtml(r){
	let payment=r["paymenttype"]=="ticket"?"票券":"現金"
	let prize=r["prizeoverride"]==null?"自動":r["prizeoverride"]
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
				<div>Reentry ${r["reentrycount"]||0} 次 / ${payment}</div>
				${buyextra?`<div>加購 ${buyextra}</div>`:""}
				<div>獎金修正 ${prize} / 票值 ${r["ticketvalue"]||0}</div>
			</div>
			<input type="button" class="openfinancebtn bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-xs" data-id="${r["id"]}" data-reentry="${r["reentrycount"]||0}" data-rebuy="${int(r["rebuycount"]||0)}" data-addon="${int(r["addoncount"]||0)}" data-prize="${r["prizeoverride"]==null?"":r["prizeoverride"]}" data-ticket="${r["ticketvalue"]||0}" data-payment="${r["paymenttype"]||"cash"}" value="修正收益">
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
				<div class="text-lg font-semibold text-white">修正收益資料</div>
				<input type="button" class="closefinance text-zinc-400 hover:text-white" value="×">
			</div>
			<div class="text-sm text-zinc-400 mb-4">這裡只修正此選手的報名財務資料，不會更改賽事本身設定。</div>
			<div class="grid grid-cols-1 gap-3">
				<label class="text-sm text-zinc-300">Reentry 次數<input type="number" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="reentrycount" inputmode="numeric" value="${dataset(button,"reentry")||0}"></label>
				${rebuyallowed?`<label class="text-sm text-zinc-300">重買 (Rebuy) 次數<input type="number" min="0" inputmode="numeric" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="rebuycount" value="${dataset(button,"rebuy")||0}" placeholder="本場上限 ${maxrebuy}"></label>`:""}
				${addonallowed?`<label class="text-sm text-zinc-300">增購 (Addon) 次數<input type="number" min="0" inputmode="numeric" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="addoncount" value="${dataset(button,"addon")||0}" placeholder="本場上限 ${maxaddon}"></label>`:""}
				<label class="text-sm text-zinc-300">獎金修正<input type="number" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="prizeoverride" inputmode="numeric" value="${dataset(button,"prize")}" placeholder="空白代表使用自動獎金"></label>
				<label class="text-sm text-zinc-300">票券價值<input type="number" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="ticketvalue" inputmode="numeric" value="${dataset(button,"ticket")||0}"></label>
				<label class="text-sm text-zinc-300">買入方式<select class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="paymenttype">
					<option value="cash" ${dataset(button,"payment")!="ticket"?"selected":""}>現金買入</option>
					<option value="ticket" ${dataset(button,"payment")=="ticket"?"selected":""}>票券買入</option>
				</select></label>
			</div>
			<div class="flex justify-end gap-2 mt-5">
				<input type="button" class="closefinance bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded" value="取消">
				<input type="button" class="savefinancebtn bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" data-id="${id}" value="儲存">
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
			let action=`<input type="button" class="searchregisterbtn bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs" data-playerid="${safehtml(r["playerid"])}" value="報名">`
			if(r["isstaff"]){
				action=`<span class="text-xs text-red-300">員工不可報名</span>`
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
			html=`<div class="px-3 py-3 text-zinc-500 text-sm">沒有符合的使用者</div>`
		}
		if(!html){
			html=`
				<div class="px-4 py-4 text-sm leading-7 text-zinc-400">
					<div class="font-semibold text-zinc-200">找不到符合的選手</div>
					<div class="mt-1">可搜尋選手 ID、名稱或 Email。若是現場新選手，請先確認他是否已建立帳號。</div>
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
						"eyebrow": "報名結果",
						"title": "已加入 1 位選手",
						"message": "系統已將搜尋到的選手加入這場賽事，接下來可直接做確認或排座。",
						"items": [
							{"label": "成功", "value": "1"},
							{"label": "失敗", "value": "0"},
							{"label": "下一步", "value": "確認 / 排座"}
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
			let tablehtml=tableoptions("")
			toolbar.innerHTML=`
				<div class="flex items-center justify-between gap-3">
					<div>
						<div class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">加入選手</div>
						<div class="mb-3 text-sm leading-6 text-zinc-400">輸入選手 ID、名稱或 Email 查詢後加入，或對現場選手直接報名。</div>
					</div>
					<div class="flex flex-wrap gap-2 items-center mb-3">
						<input type="text" class="bg-zinc-700 text-white rounded px-2 py-2 text-sm w-48" id="hostplayerid" placeholder="選手 ID / 名稱 / Email">
						<input type="button" class="${showtestusered?"bg-emerald-600 hover:bg-emerald-700":"bg-zinc-700 hover:bg-zinc-600"} px-3 py-2 rounded text-sm font-semibold" id="showtestuserbtn" value="測試使用者">
					</div>
				</div>
				<div class="mb-3 hidden rounded border border-zinc-700 overflow-hidden" id="usersearchresult"></div>
				<div class="mt-4 border-t border-zinc-800 pt-4 mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">批次確認與排座</div>
				<div class="mb-3 text-sm leading-6 text-zinc-400">先勾選要處理的選手，再批次確認或排座；排座僅對已確認選手生效。</div>
				<div class="flex flex-wrap gap-2 items-center">
					<label class="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" id="selectallplayers">全選</label>
					<input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-sm font-semibold" id="confirmselectedbtn" value="批次確認">
					<select class="bg-zinc-700 text-white rounded px-2 py-2 text-sm" id="randomtable">${tablehtml}</select>
					<input type="number" class="bg-zinc-700 text-white rounded px-2 py-2 text-sm w-28" id="randomstartchip" inputmode="numeric" value="${startchip}" placeholder="起始計分牌">
					<input type="button" class="bg-sky-600 hover:bg-sky-700 px-3 py-2 rounded text-sm font-semibold" id="randomunseatedbtn" value="未入座補位">
					<input type="button" class="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-semibold" id="randomselectedbtn" value="重排選取選手">
					<input type="button" class="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-sm font-semibold" id="randombalancedbtn" value="全部桌平均排座">
					<input type="button" class="bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded text-sm font-semibold" id="applybestchipbtn" value="套用晉級最高計分牌">
				</div>
				<div class="mt-4 border-t border-zinc-800 pt-4">
					<div class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">List Query</div>
					<div class="flex flex-wrap items-center gap-2">
						<input type="text" class="bg-zinc-700 text-white rounded px-2 py-2 text-sm w-full sm:w-64" id="registrationkeyword" value="${safehtml(registrationkeyword)}" placeholder="查詢名稱 / ID / 名次">
						<input type="button" class="registrationfilterbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" data-filter="all" value="全部">
						<input type="button" class="registrationfilterbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" data-filter="alive" value="未淘汰">
						<input type="button" class="registrationfilterbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" data-filter="eliminated" value="已淘汰">
						<input type="button" class="registrationfilterbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" data-filter="unseated" value="未入座">
						<input type="button" class="registrationfilterbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" data-filter="registered" value="待確認">
						<select class="bg-zinc-700 text-white rounded px-2 py-2 text-sm" id="registrationpagesize">
							<option value="10" ${registrationpagesize==10?"selected":""}>每頁 10</option>
							<option value="25" ${registrationpagesize==25?"selected":""}>每頁 25</option>
							<option value="50" ${registrationpagesize==50?"selected":""}>每頁 50</option>
							<option value="100" ${registrationpagesize==100?"selected":""}>每頁 100</option>
						</select>
					</div>
					<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
						<div class="text-sm text-zinc-400" id="registrationpageinfo"></div>
						<div class="flex gap-2">
							<input type="button" class="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" id="registrationprevpage" value="上一頁">
							<input type="button" class="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm font-semibold" id="registrationnextpage" value="下一頁">
						</div>
					</div>
				</div>
			`
			let hostinput=domgetid("hostplayerid")
			if(hostinput){
				hostinput.placeholder="選手 ID / 名稱 / Email"
			}
			// let searchbutton=domgetid("searchuserbtn")
			// if(searchbutton&&!domgetid("hostregisterbtn")){
			// 	searchbutton.value="查詢選手"
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
					pttoast("請先選擇牌桌","warning")
					return
				}
				element.disabled=true
				ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+sessionid,function(event,data){
					element.disabled=false
					if(data["success"]){
						setregistrationresultsummary({
							"showed": true,
							"type": "success",
							"eyebrow": "排座結果",
							"title": "未入座選手已補位",
							"message": "系統已依指定牌桌與起始計分牌處理未入座選手，請再檢查是否仍有人工調整需求。",
							"items": [
								{"label": "模式", "value": "未入座補位"},
								{"label": "牌桌", "value": String(tableid)},
								{"label": "計分牌", "value": String(int(getvalue("randomstartchip")||startchip))}
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
					pttoast("請先選擇牌桌","warning")
					return
				}
				if(ids.length==0){
					pttoast("請先選取要重排的選手","warning")
					return
				}
				element.disabled=true
				ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+sessionid,function(event,data){
					element.disabled=false
					if(data["success"]){
						setregistrationresultsummary({
							"showed": true,
							"type": "success",
							"eyebrow": "排座結果",
							"title": "已重排選取選手",
							"message": "只針對目前勾選的已確認選手重新分配座位，其他選手資料不受影響。",
							"items": [
								{"label": "模式", "value": "重排選取選手"},
								{"label": "成功", "value": String(ids.length)},
								{"label": "牌桌", "value": String(tableid)}
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
							"eyebrow": "排座結果",
							"title": "已完成平均排座",
							"message": "系統已嘗試平衡所有牌桌座位，請再檢查個別桌況是否需要微調。",
							"items": [
								{"label": "模式", "value": "平均全場"},
								{"label": "起始計分牌", "value": String(int(getvalue("randomstartchip")||startchip))},
								{"label": "下一步", "value": "檢查桌況"}
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
			pageinfo.innerText="顯示 "+from+"-"+to+" / "+fulllist.length+"，第 "+registrationpage+" / "+maxpage+" 頁"
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
				empty.innerText="尚無報名紀錄"
				emptymobile.innerText="尚無報名紀錄"
			}else{
				empty.innerText="查無符合條件的報名紀錄"
				emptymobile.innerText="查無符合條件的報名紀錄"
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
					<input type="button" class="confirmbtn bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="確認">
					<input type="button" class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="取消">
				`
			}else if(r["status"]=="confirmed"){
				actions=`
					${advancetargets.length?`<input type="button" class="advancebtn bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" data-chip="${(unifiedhandrecord&&int(r["latestchip"]||0)>0)?int(r["latestchip"]):(r["startchip"]||startchip)}" value="晉級">`:""}
					${canrebuyregistration(r)?`<input type="button" class="rebuybtn bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="Rebuy">`:""}
					<input type="button" class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="取消">
				`
				if(canreentryregistration(r)){
					actions=`
						<input type="button" class="reentrybtn bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs" data-playerid="${safehtml(r["playerplayerid"])}" value="Reentry">
						<input type="button" class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="取消">
					`
				}else if(r["timerstatus"]=="eliminated"){
					actions=`<span class="text-xs text-yellow-300">Reentry 已達上限</span>`
				}
			}else if(r["status"]=="advanced"){
				actions=`
					${advancetargets.length?`<input type="button" class="advancebtn bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" data-chip="${r["advancechip"]||r["startchip"]||startchip}" value="更新計分牌">`:""}
					<input type="button" class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="取消">
				`
			}

			if(!cancancelregistration(r)){
				actions=actions.replace(/<input type="button" class="cancelbtn[^>]*?>/g,"")
			}
			let receiptbtn=`<input type="button" class="printreceiptbtn bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-xs" data-id="${r["id"]}" value="列印收據">`
			let profitclass=0<=float(r["profit"])?"text-green-400":"text-red-400"
			let selectedhtml=(r["status"]=="registered"||r["status"]=="confirmed")?`<input type="checkbox" class="selectplayer" value="${r["id"]}" data-status="${r["status"]}">`:""
			let seathtml=`<span class="text-zinc-500 text-xs">確認後可排座</span>`
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
					seathtml=`<span class="text-zinc-500 text-xs">已淘汰，請先 Reentry</span>`
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
						<div class="text-xs text-zinc-400">成本 ${r["cost"]||0} / 名次 ${r["timerplace"]||"-"}</div>
						<div class="text-xs text-zinc-400">自動獎金 ${r["autoprize"]||0}</div>
						${r["advancetargetid"]?`<div class="text-xs text-sky-300">晉級 ${escapehtml(r["advancetargetname"]||"-")} / 計分牌 ${r["advancechip"]||0}</div>`:""}
						${0<int(r["advancecount"])?`<div class="text-xs text-sky-300">重複晉級 ${r["advancecount"]} 次 / 最高 ${r["bestadvancechip"]||0}</div>`:""}
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
							<div class="text-xs text-zinc-400 mb-2">桌次/座位/計分牌數</div>
							${mobileseathtml}
						</div>
					</div>
					<div class="mt-4 border-t border-zinc-700 grid grid-cols-2 gap-5 mt-4">
						<div class="flex items-center justify-between pt-3">
							<div>
								<div class="text-xs text-zinc-400">成本 ${r["cost"]||0} / 名次 ${r["timerplace"]||"-"}</div>
								<div class="text-xs text-zinc-400">自動獎金 ${r["autoprize"]||0}</div>
								${r["advancetargetid"]?`<div class="text-xs text-sky-300">晉級 ${escapehtml(r["advancetargetname"]||"-")} / 計分牌 ${r["advancechip"]||0}</div>`:""}
								${0<int(r["advancecount"])?`<div class="text-xs text-sky-300">重複晉級 ${r["advancecount"]} 次 / 最高 ${r["bestadvancechip"]||0}</div>`:""}
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
		ptconfirm("確定要取消這位選手的報名嗎?",function(ok){
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
					pttoast("已晉級到 "+(target["name"]||"-")+"，累計晉級 "+count+" 次","success")
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
			pttoast("找不到報名資料","error")
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
	let payment="現金"
	if(r["paymenttype"]=="ticket"){
		payment="票券"
	}
	let tableno=""
	if(r["tableid"]){
		tableno=registrationtablename(r["tableid"])
	}
	// 報到 / 驗證網址：帶場次 id 與這筆報名 id。checkin.html 之後再做，QR 先把網址編進去。
	let basepath=location.pathname.replace(/[^/]*$/,"")
	let qrdata=location.origin+basepath+"checkin.html?s="+encodeURIComponent(sessionid)+"&r="+encodeURIComponent(r["id"])
	// 入場編號要確認 / 報到後才有；未確認顯示「未確認」而不是舊號碼。
	let entryno="未確認"
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
		pttoast("請先選取要確認的選手","warning")
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
				"eyebrow": "批次確認摘要",
				"title": "批次確認已完成",
				"message": "系統已完成這次批次確認。建議下一步直接檢查未入座選手，決定是否要補位或平均排座。",
				"items": [
					{"label": "成功", "value": String(successcount)},
					{"label": "失敗", "value": String(ids.length-successcount)},
					{"label": "下一步", "value": "補位 / 排座"}
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
		pttoast("沒有重複晉級選手可套用最高計分牌","warning")
		return
	}
	ptconfirm("確定把 "+plans.length+" 位重複晉級選手的起始計分牌，套用為各自的最高晉級計分牌？",function(okayed){
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
					"eyebrow": "套用最高計分牌",
					"title": failcount==0?"已套用重複晉級最高計分牌":"部分選手套用失敗",
					"message": "系統已把重複晉級選手的起始計分牌更新為各自的最高晉級計分牌。",
					"items": [
						{"label": "成功", "value": String(successcount)},
						{"label": "失敗", "value": String(failcount)}
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
				"eyebrow": "座位結果",
				"title": "已儲存座位調整",
				"message": "這位選手的牌桌、座位與起始計分牌已更新完成。",
				"items": [
					{"label": "選手", "value": String(sessionplayerid)},
					{"label": "模式", "value": "單筆座位調整"},
					{"label": "下一步", "value": "檢查桌況"}
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
			setregistrationresultsummary({
				"showed": true,
				"type": 0<warnings.length?"warning":"success",
				"eyebrow": "收益修正摘要",
				"title": 0<warnings.length?"收益修正已儲存，且有提醒":"收益修正已儲存",
				"message": "這次修改只影響該筆報名財務資料，不會改動場次本身的獎金或買入設定。",
				"items": [
					{"label": "選手", "value": String(sessionplayerid)},
					{"label": "警告", "value": String(warnings.length)},
					{"label": "影響範圍", "value": "單筆報名"}
				],
				"details": warnings
			})
			loadregistrations()
			let modal=domgetid("financemodal")
			if(modal){
				ptremovescrollcover(modal)
			}
			pttoast("修改完成","success")
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
		pttoast("目前沒有報名資料可列印","error")
		return
	}
	let sessionname=""
	if(domgetid("sessionname")){
		sessionname=domgetid("sessionname").textContent||""
	}
	let columns=[
		{"title": "序號","align": "right"},
		{"title": "選手"},
		{"title": "ID"},
		{"title": "報名時間"},
		{"title": "狀態","align": "center"},
		{"title": "桌次","align": "center"},
		{"title": "座位","align": "center"},
		{"title": "買入","align": "right"},
		{"title": "名次","align": "center"},
		{"title": "獎金","align": "right"},
		{"title": "盈虧","align": "right"}
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
		["場次",sessionname||"-"],
		["總筆數",registrationdatalist.length],
		["已報名",statregistered],
		["已確認",statconfirmed],
		["已取消",statcancelled],
		["總計分牌數",stattotalchip]
	])
	let bodyhtml=infohtml+ptprintsectiontitle("報名名單")+ptprinttable(columns,rows,"尚無報名紀錄")+ptprintsignblock(["承辦人簽名","主管簽名"])
	ptprintrun(ptprintbuild({
		"eyebrow": "Registrations",
		"title": (sessionname||"場次")+" 報名名單",
		"subtitle": "報名清單存底",
		"meta": "列印時間 "+ptprinttimestamp()
	},bodyhtml))
}

onclick("#printregister",function(element,event){
	printregistrationlist()
})

connectregistrationws()
loadregistrations()
