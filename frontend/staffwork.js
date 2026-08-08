// 員工工時總覽。兩個分頁：跨場次累計（後端分頁）與單場明細（不分頁）。
// 骨架與資料流比照 sessionlist.js：loadX / renderX / renderptpagination / ptbindsort / ptshowempty。
if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let reportpage=1
const REPORTLIMIT=20
let reportsortstate={
	"key": "",
	"ascended": true
}
let detailsessionlist=[]

function workescape(value){
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

function worktext(key,fallback){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["staffworkpage"]&&TRANSLATE[LANGUAGE]["staffworkpage"][key]!=undefined){
		return TRANSLATE[LANGUAGE]["staffworkpage"][key]
	}
	return fallback
}

function workrolelabel(role){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["staffwork"]){
		let map=TRANSLATE[LANGUAGE]["staffwork"]
		if(role=="dealer"&&map["roledealer"]){
			return map["roledealer"]
		}
		if(role=="floor"&&map["rolefloor"]){
			return map["rolefloor"]
		}
		if(role=="assistant"&&map["roleassistant"]){
			return map["roleassistant"]
		}
	}
	return role||"-"
}

function workauthheader(){
	return [
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	]
}

function selectworktab(tab){
	let buttonlist=document.querySelectorAll(".workwtab-btn")
	let contentlist=document.querySelectorAll(".worktab-content")
	for(let i=0;i<buttonlist.length;i=i+1){
		buttonlist[i].classList.remove("border-emerald-400","text-emerald-400")
		buttonlist[i].classList.add("border-transparent","text-zinc-300")
	}
	for(let i=0;i<contentlist.length;i=i+1){
		contentlist[i].classList.add("hidden")
	}
	let button=document.querySelector('.workwtab-btn[data-worktab="'+tab+'"]')
	let content=domgetid("worktab-"+tab)
	if(button&&content){
		button.classList.add("border-emerald-400","text-emerald-400")
		button.classList.remove("border-transparent","text-zinc-300")
		content.classList.remove("hidden")
	}
	if(tab=="session"){
		loadsessionoption()
	}
}

// ── 跨場次累計 ──────────────────────────────────────────────────────
function reportquery(){
	let query=[]
	query.push("groupby="+encodeURIComponent(getvalue("reportgroupby")||"staff"))
	query.push("viewmode="+encodeURIComponent(getvalue("reportviewmode")||"owner"))
	if(getvalue("reportstartdate")){
		query.push("startdate="+encodeURIComponent(getvalue("reportstartdate")))
	}
	if(getvalue("reportenddate")){
		query.push("enddate="+encodeURIComponent(getvalue("reportenddate")))
	}
	query.push("page="+reportpage)
	query.push("limit="+REPORTLIMIT)
	if(reportsortstate["key"]){
		query.push("order="+encodeURIComponent(reportsortstate["key"]))
		query.push("direction="+(reportsortstate["ascended"]?"asc":"desc"))
	}
	return AJAXURL+"getstaffworkreport?"+query.join("&")
}

function loadreport(){
	ajax("GET",reportquery(),function(event,data){
		if(data["success"]){
			renderreport(data["data"])
		}else{
			pttoast(pterror(data["data"]||worktext("loadfail","載入失敗")),"error")
		}
	},null,workauthheader(),{
		loadingtarget: "#reportmain"
	})
}

function reportheadhtml(groupby){
	// 逐筆模式才提供排序：分組模式的排序固定依時數，換欄位意義不大而且要多做白名單
	if(groupby=="log"){
		return `
			<tr class="border-b border-zinc-800 text-zinc-400">
				<th class="ptsortth select-none py-2 px-2" data-sortkey="staffname"><span>${worktext("colstaff","員工")}</span> <span class="ptsortarrow text-emerald-400" data-sortkey="staffname"></span></th>
				<th class="py-2 px-2">${worktext("colsession","場次")}</th>
				<th class="ptsortth select-none py-2 px-2" data-sortkey="starttime"><span>${worktext("colstart","上班")}</span> <span class="ptsortarrow text-emerald-400" data-sortkey="starttime"></span></th>
				<th class="py-2 px-2">${worktext("colend","下班")}</th>
				<th class="ptsortth select-none py-2 px-2" data-sortkey="actualminute"><span>${worktext("colduration","時長")}</span> <span class="ptsortarrow text-emerald-400" data-sortkey="actualminute"></span></th>
				<th class="py-2 px-2">${worktext("colbilling","計費")}</th>
				<th class="py-2 px-2">${worktext("colamount","金額")}</th>
			</tr>
		`
	}
	let firstcolumn=worktext("colstaff","員工")
	if(groupby=="session"){
		firstcolumn=worktext("colsession","場次")
	}
	return `
		<tr class="border-b border-zinc-800 text-zinc-400">
			<th class="py-2 px-2">${firstcolumn}</th>
			<th class="py-2 px-2">${worktext("collogcount","段數")}</th>
			<th class="py-2 px-2">${worktext("colopened","進行中")}</th>
			<th class="py-2 px-2">${worktext("colduration","時長")}</th>
			<th class="py-2 px-2">${worktext("colamount","金額")}</th>
			<th class="py-2 px-2">${worktext("colfirst","最早")}</th>
			<th class="py-2 px-2">${worktext("collast","最後")}</th>
		</tr>
	`
}

function reportrowhtml(item,groupby){
	if(groupby=="log"){
		let endhtml=`<span class="text-emerald-300">${worktext("running","進行中")}</span>`
		if(!item["workinged"]){
			endhtml=ptformatdatetimeminute(item["endtime"])
		}
		let crossday=""
		if(item["crossdayed"]){
			crossday=` <span class="text-rose-300 font-bold">${worktext("crossday","跨日")}</span>`
		}
		return `
			<tr class="border-b border-zinc-800">
				<td class="py-2 px-2">${workescape(item["staffname"])}<div class="text-xs text-zinc-500">${workrolelabel(item["role"])}</div></td>
				<td class="py-2 px-2">${workescape(item["sessionname"])}</td>
				<td class="py-2 px-2">${ptformatdatetimeminute(item["starttime"])}</td>
				<td class="py-2 px-2">${endhtml}${crossday}</td>
				<td class="py-2 px-2">${ptformatduration(item["actualminute"])}</td>
				<td class="py-2 px-2">${item["workinged"]?"-":ptformatduration(item["billingminute"])}</td>
				<td class="py-2 px-2">${item["workinged"]?"-":workescape(item["amount"])}</td>
			</tr>
		`
	}
	let firstcell=workescape(item["staffname"])
	if(groupby=="session"){
		firstcell=workescape(item["sessionname"])
	}
	let openedhtml=`<span class="text-zinc-600">0</span>`
	if(0<int(item["openedcount"])){
		openedhtml=`<span class="text-emerald-300 font-bold">${int(item["openedcount"])}</span>`
	}
	return `
		<tr class="border-b border-zinc-800">
			<td class="py-2 px-2">${firstcell}</td>
			<td class="py-2 px-2">${workescape(item["logcount"])}</td>
			<td class="py-2 px-2">${openedhtml}</td>
			<td class="py-2 px-2">${ptformatduration(item["actualminute"])}</td>
			<td class="py-2 px-2">${workescape(item["amount"])}</td>
			<td class="py-2 px-2">${ptformatdatetimeminute(item["firsttime"])}</td>
			<td class="py-2 px-2">${ptformatdatetimeminute(item["lasttime"])}</td>
		</tr>
	`
}

function renderreport(data){
	let list=data["list"]||[]
	let groupby=data["groupby"]||"staff"
	innertext("#reportcardminute",ptformatduration(data["pageminute"]),false)
	innertext("#reportcardamount",String(data["pageamount"]||0),false)
	let openedtotal=0
	for(let i=0;i<list.length;i=i+1){
		if(groupby=="log"){
			if(list[i]["workinged"]){
				openedtotal=openedtotal+1
			}
		}else{
			openedtotal=openedtotal+int(list[i]["openedcount"])
		}
	}
	innertext("#reportcardopened",String(openedtotal),false)

	if(list.length==0){
		// 「完全沒資料」與「篩選後沒資料」是兩種不同狀況，文案與下一步都不一樣
		let message=worktext("emptyall","還沒有任何工時紀錄")
		let action=`<div class="text-sm text-zinc-500">${worktext("emptyallnext","到場次頁的員工分頁替員工打上班卡，紀錄就會出現在這裡。")}</div>`
		if(getvalue("reportstartdate")||getvalue("reportenddate")){
			message=worktext("emptysearch","這個區間沒有工時紀錄")
			action=`<input type="button" class="rounded-xl bg-zinc-800 px-5 py-2 text-sm text-zinc-200 hover:bg-zinc-700" id="emptyclearfilter" value="${worktext("clear","清除條件")}">`
		}
		ptshowempty("#reportmain",message,action)
		innerhtml("#reportpagination","",false)
		onclick("#emptyclearfilter",function(){
			clearreportfilter()
		})
		return
	}

	let bodyhtml=""
	for(let i=0;i<list.length;i=i+1){
		bodyhtml=bodyhtml+reportrowhtml(list[i],groupby)
	}
	innerhtml("#reportmain",`
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead id="reporthead">${reportheadhtml(groupby)}</thead>
				<tbody>${bodyhtml}</tbody>
			</table>
		</div>
	`,false)
	if(groupby=="log"){
		ptsortarrow("#reporthead",reportsortstate["key"],reportsortstate["ascended"])
		ptbindsort("#reporthead",reportsortstate,function(){
			reportpage=1
			loadreport()
		})
	}
	renderptpagination("reportpagination",data["pagination"],function(page){
		reportpage=page
		loadreport()
	})
}

function clearreportfilter(){
	value("#reportstartdate","")
	value("#reportenddate","")
	reportpage=1
	loadreport()
}

// ── 單場明細 ────────────────────────────────────────────────────────
function loadsessionoption(){
	if(0<detailsessionlist.length){
		return
	}
	ajax("GET",AJAXURL+"getsessionlist?quickfilter=owned&limit=200",function(event,data){
		if(!data["success"]){
			return
		}
		// getsessionlist 的鍵是 sessions（不是 list）—— session.py:623
		detailsessionlist=data["data"]["sessions"]||[]
		let optionhtml=""
		for(let i=0;i<detailsessionlist.length;i=i+1){
			optionhtml=optionhtml+`<option value="${workescape(detailsessionlist[i]["id"])}">${workescape(detailsessionlist[i]["name"])}</option>`
		}
		if(!optionhtml){
			optionhtml=`<option value="">${worktext("nosession","沒有可選的場次")}</option>`
		}
		innerhtml("#detailsession",optionhtml,false)
		loaddetail()
	},null,workauthheader(),null)
}

function loaddetail(){
	let pickedid=getvalue("detailsession")
	if(!pickedid){
		return
	}
	ajax("GET",AJAXURL+"getsessionstaffwork/"+pickedid,function(event,data){
		if(data["success"]){
			renderdetail(data["data"])
		}else{
			pttoast(pterror(data["data"]||worktext("loadfail","載入失敗")),"error")
		}
	},null,workauthheader(),{
		loadingtarget: "#detailmain"
	})
}

function renderdetail(data){
	let loglist=data["loglist"]||[]
	if(loglist.length==0){
		ptshowempty("#detailmain",worktext("emptysession","這場還沒有工時紀錄"),`<div class="text-sm text-zinc-500">${worktext("emptysessionnext","到場次頁的員工分頁替員工打上班卡。")}</div>`)
		return
	}
	// 進行中的段置頂 —— 系統允許跨日又不自動收班，忘了打下班卡的班會一直長，
	// 所以要用版面把它推到眼前，不能等使用者自己去翻。
	let openedlist=[]
	let closedlist=[]
	for(let i=0;i<loglist.length;i=i+1){
		if(loglist[i]["workinged"]){
			openedlist.push(loglist[i])
		}else{
			closedlist.push(loglist[i])
		}
	}
	let sortedlist=openedlist.concat(closedlist)
	let bodyhtml=""
	for(let i=0;i<sortedlist.length;i=i+1){
		let item=sortedlist[i]
		let endhtml=`<span class="text-emerald-300">${worktext("running","進行中")}</span>`
		if(!item["workinged"]){
			endhtml=ptformatdatetimeminute(item["endtime"])
		}
		let crossday=""
		if(item["crossdayed"]){
			crossday=` <span class="text-rose-300 font-bold">${worktext("crossday","跨日")}</span>`
		}
		let selfbadge=""
		if(item["selfstarted"]){
			selfbadge=` <span class="rounded-full border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">${worktext("selfmark","自己按的")}</span>`
		}
		// 補下班卡：只對進行中的段顯示，而且只有能管理的人看得到。
		// 系統允許跨日又不自動收班，忘了打卡的班會一直長 —— 補救鍵必須就在那一列上，
		// 不能讓人先去別的地方找。
		let fixhtml=""
		if(item["workinged"]&&data["canmanage"]){
			fixhtml=`
				<div class="mt-1 flex flex-wrap items-center gap-1">
					<input type="datetime-local" class="workfixtime rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs" data-worklogid="${item["id"]}">
					<input type="button" class="workfixsave text-xs text-amber-400 hover:underline" data-worklogid="${item["id"]}" data-sessionid="${item["sessionid"]}" data-staffuserid="${item["staffuserid"]}" value="${worktext("backfill","補下班卡")}">
				</div>
			`
		}
		bodyhtml=bodyhtml+`
			<tr class="border-b border-zinc-800 ${item["workinged"]?"bg-emerald-500/5":""}">
				<td class="py-2 px-2">${workescape(item["staffname"])}<div class="text-xs text-zinc-500">${workrolelabel(item["role"])}</div></td>
				<td class="py-2 px-2">${ptformatdatetimeminute(item["starttime"])}${selfbadge}</td>
				<td class="py-2 px-2">${endhtml}${crossday}${fixhtml}</td>
				<td class="py-2 px-2">${ptformatduration(item["actualminute"])}</td>
				<td class="py-2 px-2">${item["workinged"]?"-":ptformatduration(item["billingminute"])}</td>
				<td class="py-2 px-2">${item["workinged"]?"-":workescape(item["amount"])}</td>
				<td class="py-2 px-2 text-xs text-zinc-500">${workescape(item["startoperatorname"]||"")}</td>
			</tr>
		`
	}
	let summaryhtml=""
	let summarylist=data["staffsummarylist"]||[]
	for(let i=0;i<summarylist.length;i=i+1){
		summaryhtml=summaryhtml+`
			<tr class="border-b border-zinc-800 text-zinc-300">
				<td class="py-2 px-2">${workescape(summarylist[i]["staffname"])}</td>
				<td class="py-2 px-2">${workescape(summarylist[i]["logcount"])}</td>
				<td class="py-2 px-2">${ptformatduration(summarylist[i]["actualminute"])}</td>
				<td class="py-2 px-2">${ptformatduration(summarylist[i]["billingminute"])}</td>
				<td class="py-2 px-2">${workescape(summarylist[i]["amount"])}</td>
			</tr>
		`
	}
	innerhtml("#detailmain",`
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="text-zinc-400">
					<tr class="border-b border-zinc-800">
						<th class="py-2 px-2">${worktext("colstaff","員工")}</th>
						<th class="py-2 px-2">${worktext("colstart","上班")}</th>
						<th class="py-2 px-2">${worktext("colend","下班")}</th>
						<th class="py-2 px-2">${worktext("colduration","時長")}</th>
						<th class="py-2 px-2">${worktext("colbilling","計費")}</th>
						<th class="py-2 px-2">${worktext("colamount","金額")}</th>
						<th class="py-2 px-2">${worktext("coloperator","操作者")}</th>
					</tr>
				</thead>
				<tbody>${bodyhtml}</tbody>
			</table>
		</div>
		<div class="mt-6 px-2">
			<div class="mb-2 text-sm font-bold">${worktext("summarytitle","每人小計")}</div>
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="text-zinc-400">
						<tr class="border-b border-zinc-800">
							<th class="py-2 px-2">${worktext("colstaff","員工")}</th>
							<th class="py-2 px-2">${worktext("collogcount","段數")}</th>
							<th class="py-2 px-2">${worktext("colduration","時長")}</th>
							<th class="py-2 px-2">${worktext("colbilling","計費")}</th>
							<th class="py-2 px-2">${worktext("colamount","金額")}</th>
						</tr>
					</thead>
					<tbody>${summaryhtml}</tbody>
				</table>
			</div>
			<div class="mt-3 text-sm">
				${worktext("grandtotal","全場合計")}：${ptformatduration(data["total"]["actualminute"])} / ${workescape(data["total"]["amount"])}
			</div>
		</div>
	`,false)
	onclick(".workfixsave",function(element){
		let worklogid=element.getAttribute("data-worklogid")
		let input=document.querySelector('.workfixtime[data-worklogid="'+worklogid+'"]')
		let picked=input?input.value.trim():""
		if(!picked){
			pttoast(worktext("backfillneedtime","請先選下班時間"),"error")
			return
		}
		// datetime-local 給的是 YYYY-MM-DDTHH:mm，後端要 19 字元的 YYYY-MM-DD HH:MM:SS
		let endtime=picked.replace("T"," ")
		if(endtime.length==16){
			endtime=endtime+":00"
		}
		// 補的是那個人的**班**（個人層級），不是這一場的卡 —— 所以不帶 sessionid
		ajax("POST",AJAXURL+"endstaffshift",function(event,data){
			if(data["success"]){
				pttoast(worktext("backfillok","已補下班卡"),"success")
				loaddetail()
			}else{
				pttoast(pterror(data["data"]||worktext("backfillfail","補登失敗")),"error")
			}
		},str({
			"staffuserid": int(element.getAttribute("data-staffuserid")),
			"endtime": endtime
		}),workauthheader(),{
			loadingtarget: "#detailmain"
		})
	})
}

// ── 綁定 ────────────────────────────────────────────────────────────
let worktabbuttonlist=document.querySelectorAll(".workwtab-btn")
for(let i=0;i<worktabbuttonlist.length;i=i+1){
	worktabbuttonlist[i].addEventListener("click",function(){
		selectworktab(this.getAttribute("data-worktab"))
	})
}
onclick("#reportsearch",function(){
	reportpage=1
	loadreport()
})
onclick("#reportclear",function(){
	clearreportfilter()
})
onchange("#reportgroupby",function(){
	reportpage=1
	reportsortstate["key"]=""
	loadreport()
})
onchange("#reportviewmode",function(){
	reportpage=1
	loadreport()
})
onchange("#detailsession",function(){
	loaddetail()
})

// 打卡面板放最上面：這一頁是員工自己會來看的地方，狀態與三顆按鈕要第一眼就看到。
// 面板本身在 initialize.js，profile 用的是同一支 —— 兩頁各寫一份狀態機遲早會漏改一邊。
ptloadshiftpanel("staffshiftpanel",null,null)
loadreport()
