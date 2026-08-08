// 多牌桌總覽看板（檢查表 3.4）＋ 平衡建議與一鍵平衡（檢查表 3.5）
let boardsessionid=getget("id")||getget("sessionid")

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let boardtimer=null
let boardlastdata=null
let boardstaffdata=null

// 員工總覽面板的狀態。協會員工可能很多，所以篩選 / 排序 / 分頁都要有。
// 這些狀態**不放進網址也不存 localStorage** —— 這一頁 15 秒輪詢一次重畫，
// 狀態留在記憶體即可；存起來反而會讓下次進來莫名其妙被篩掉一堆人。
const BOARDSTAFFPAGESIZE=10
let boardstaffstate={
	"filter": "all",
	"keyword": "",
	"page": 1
}
let boardstaffsortstate={
	"key": "",
	"ascended": true
}

function boardtext(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["tableboardpage"]&&TRANSLATE[LANGUAGE]["tableboardpage"][key]){
		return TRANSLATE[LANGUAGE]["tableboardpage"][key]
	}
	return fallback
}

function boardescape(value){
	return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

// 併桌相關文案沿用 translate.js 既有 tablemanage 區段 (原 register 牌桌管理搬過來)
function boardmanagetext(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["tablemanage"]&&TRANSLATE[LANGUAGE]["tablemanage"][key]){
		return TRANSLATE[LANGUAGE]["tablemanage"][key]
	}
	return fallback
}

function boardfindtable(tableid){
	let tablelist=[]
	if(boardlastdata){
		tablelist=boardlastdata["tables"]||[]
	}
	for(let i=0;i<tablelist.length;i=i+1){
		if(String(tablelist[i]["id"])==String(tableid)){
			return tablelist[i]
		}
	}
	return null
}

function boardtablelabel(table){
	return String(table["name"]||("#"+(table["no"]||table["id"])))
}

function applyboardstatic(){
	document.title=boardtext("title","多牌桌總覽")+" - PokerTrace"
	innertext("#boardtitle",boardtext("title","多牌桌總覽"),false)
	innertext("#statlabeltables",boardtext("tables","牌桌"),false)
	innertext("#statlabelplayers",boardtext("players","在場選手"),false)
	innertext("#statlabelavg",boardtext("avg","平均每桌"),false)
	innertext("#boardempty",boardtext("empty","此場次尚無牌桌"),false)
	let back=domgetid("backtosession")
	if(back){
		back.textContent=boardtext("back","回場次")
		back.href=boardsessionid?("session.html?id="+boardsessionid):"sessionlist.html"
	}
	let refresh=domgetid("refreshboard")
	if(refresh){
		refresh.value=boardtext("refresh","重新整理")
	}
	let auto=domgetid("autobalance")
	if(auto){
		auto.value=boardtext("autobalance","自動平衡入座")
	}
	let unseat=domgetid("unseatall")
	if(unseat){
		unseat.value=boardtext("unseatallbutton","全部退座（打散）")
	}
}

// 指派值班：列出本場所有有效員工，標出各自狀態（在別桌／未打卡／空閒）。
// 同桌同角色重疊不擋，只在送出前用 ptconfirm 問一次 —— 交接時新舊計分員要能並存。
function openstaffassignmodal(tableid){
	if(!boardstaffdata){
		return
	}
	// 狀態文字走共用的 boardstaffstatetext —— 桌卡、這個選單、員工總覽三處
	// 對同一個人不可以標成不同狀態。
	// 「空閒」的排前面：員工多的時候，能馬上派的人不該埋在名單中段。
	let stafflist=(boardstaffdata["stafflist"]||[]).slice()
	stafflist=ptsortlist(stafflist,"state",true,boardstaffsortvalue)
	let optionhtml=""
	let optioncount=0
	for(let i=0;i<stafflist.length;i=i+1){
		let item=stafflist[i]
		if(item["ontableed"]&&String(item["tableid"])==String(tableid)){
			continue
		}
		let searchtext=String(item["staffname"]||"")+" "+String(item["staffplayerid"]||"")+" "+boardrolelabel(item["role"])
		optionhtml=optionhtml+`<input type="button" class="boardstaffpick w-full text-left bg-zinc-700 hover:bg-zinc-600 rounded px-3 py-2 text-sm" data-staffuserid="${boardescape(item["staffuserid"])}" data-role="${boardescape(item["role"])}" data-search="${boardescape(searchtext.toLowerCase())}" value="${boardescape(boardrolelabel(item["role"])+" · "+item["staffname"]+"　"+boardstaffstatetext(item))}">`
		optioncount=optioncount+1
	}
	if(!optionhtml){
		optionhtml=`<div class="text-sm text-zinc-500">${boardstafftext("noassignable","沒有可指派的員工")}</div>`
	}
	// 協會員工可能很多，選單要能搜尋。少於 8 個就不放搜尋框，免得畫面多一個沒用的東西。
	let searchhtml=""
	if(8<=optioncount){
		searchhtml=`<input type="text" class="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" id="boardstaffmodalsearch" placeholder="${boardstafftext("searchplaceholder","搜尋姓名或編號")}">`
	}
	let cover=doccreate("div")
	cover.id="boardstaffmodal"
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-5 shadow-xl">
			<div class="flex items-center justify-between mb-4">
				<div class="text-lg font-semibold text-white">${boardstafftext("assigntitle2","指派值班員工")}</div>
				<input type="button" class="closeboardstaff text-zinc-400 hover:text-white" value="×">
			</div>
			<div class="text-sm text-zinc-400 mb-4">${boardstafftext("assigndesc","選一位員工到這張桌。原本在別桌的會自動換過來；還沒打卡的會順便打上班卡。")}</div>
			${searchhtml}
			<div class="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto" id="boardstaffoptionlist">${optionhtml}</div>
			<div class="hidden py-4 text-center text-sm text-zinc-500" id="boardstaffmodalempty">${boardstafftext("filterempty","這個條件沒有符合的員工")}</div>
			<div class="flex justify-end gap-2 mt-5">
				<input type="button" class="closeboardstaff bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded" value="${boardmanagetext("cancel","取消")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(cover)
	onclick(".closeboardstaff",function(element,event){
		ptremovescrollcover(domgetid("boardstaffmodal"))
	})
	onclick(".boardstaffpick",function(element,event){
		sendstaffassign(tableid,dataset(element,"staffuserid"),false)
	})
	// 選單的搜尋是**就地隱藏**，不重畫 —— 重畫會把輸入框換掉、游標掉，
	// 而這是彈窗，每打一個字就跳掉焦點特別難用。
	oninput("#boardstaffmodalsearch",function(element,event){
		let keyword=String(element.value||"").trim().toLowerCase()
		let optionlist=document.querySelectorAll(".boardstaffpick")
		let showncount=0
		for(let i=0;i<optionlist.length;i=i+1){
			let matched=!keyword||String(optionlist[i].getAttribute("data-search")||"").indexOf(keyword)>=0
			if(matched){
				optionlist[i].classList.remove("hidden")
				showncount=showncount+1
			}else{
				optionlist[i].classList.add("hidden")
			}
		}
		let empty=domgetid("boardstaffmodalempty")
		if(empty){
			if(showncount==0){
				empty.classList.remove("hidden")
			}else{
				empty.classList.add("hidden")
			}
		}
	})
}

function sendstaffassign(tableid,staffuserid,replaceed){
	ajax("POST",AJAXURL+"assignstafftable/"+tableid,function(event,data){
		if(!data["success"]){
			pttoast(pterror(data["data"]||boardstafftext("assignfail2","指派失敗")),"error")
			return
		}
		// 後端不擋重疊，只回 warningcode。要不要真的換掉舊的由這裡問。
		if(data["data"]["warningcode"]=="tablestaffoverlap"&&!replaceed){
			ptremovescrollcover(domgetid("boardstaffmodal"))
			loadboard()
			pttoast(boardstafftext("overlapwarn","這張桌同角色已有人，兩位會同時在桌（交接中）。"),"warning")
			return
		}
		ptremovescrollcover(domgetid("boardstaffmodal"))
		pttoast(data["data"]["autoclockined"]?boardstafftext("assignokclock","已上桌，並自動打了上班卡"):boardstafftext("assignok2","已上桌"),"success")
		loadboard()
	},str({
		"staffuserid": int(staffuserid),
		"replaceed": replaceed
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],null)
}

// 下桌。桌卡與員工總覽面板兩處都用這一支 —— 原本這段是內嵌在桌卡的 handler 裡，
// 面板要再用一次時抄一份的話，日後改一邊就會不一致。
function sendstaffrelease(tablestaffid){
	ajax("POST",AJAXURL+"releasestafftable/"+tablestaffid,function(event,data){
		if(data["success"]){
			pttoast(boardstafftext("leaveok","已下桌"),"success")
			loadboard()
		}else{
			pttoast(pterror(data["data"]||boardstafftext("leavefail","下桌失敗")),"error")
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],null)
}

function boardstafftext(key,fallback){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["staffwork"]&&TRANSLATE[LANGUAGE]["staffwork"][key]!=undefined){
		return TRANSLATE[LANGUAGE]["staffwork"][key]
	}
	return fallback
}

function boardrolelabel(role){
	if(role=="dealer"){
		return boardstafftext("roledealer","計分員")
	}
	if(role=="floor"){
		return boardstafftext("rolefloor","裁判")
	}
	if(role=="assistant"){
		return boardstafftext("roleassistant","助理")
	}
	return role||"-"
}

// 找出「我」在這場的那一列。員工自己可以選桌 —— 上桌／下桌只是**紀錄什麼時候坐下、
// 什麼時候離開**，不是需要主管核准的管理動作，所以不該卡在 canmanage 後面。
// 後端本來就放行（staffworkoperate 有 self 那一條），卡住的一直是前端。
function boardselfstaff(){
	if(!boardstaffdata){
		return null
	}
	let list=boardstaffdata["stafflist"]||[]
	for(let i=0;i<list.length;i=i+1){
		if(list[i]["selfed"]){
			return list[i]
		}
	}
	return null
}

// 員工目前的狀態代碼。桌卡、指派選單、員工總覽三個地方都用這一支，
// 免得同一個人在三處被標成不同狀態。
//   ontable  在桌值班中
//   idle     已打卡、目前沒在任何桌（可以馬上派）
//   onbreak  休息中（班開著但沒有未結束的段）
//   off      還沒上班
function boardstaffstatekey(item){
	if(item["ontableed"]){
		return "ontable"
	}
	if(item["shiftstate"]=="onbreak"){
		return "onbreak"
	}
	if(item["shiftstate"]=="working"){
		return "idle"
	}
	return "off"
}

function boardstaffstatetext(item){
	let key=boardstaffstatekey(item)
	if(key=="ontable"){
		return boardstafftext("stateontable","在")+(item["tablename"]||item["tableno"]||item["tableid"])
	}
	if(key=="onbreak"){
		return boardstafftext("stateonbreak","休息中")
	}
	if(key=="idle"){
		return boardstafftext("stateidle","空閒")
	}
	return boardstafftext("statenoclock","未打卡")
}

function boardstaffstatecolor(item){
	let key=boardstaffstatekey(item)
	if(key=="ontable"){
		return "border-emerald-600/50 bg-emerald-600/10 text-emerald-300"
	}
	if(key=="onbreak"){
		return "border-amber-600/50 bg-amber-600/10 text-amber-300"
	}
	if(key=="idle"){
		return "border-sky-600/50 bg-sky-600/10 text-sky-300"
	}
	return "border-zinc-700 bg-zinc-800 text-zinc-400"
}

// 依目前的篩選條件與關鍵字挑出要顯示的員工。排序與分頁在 renderboardstaffpanel 做。
function boardstafffiltered(){
	let list=[]
	if(boardstaffdata){
		list=boardstaffdata["stafflist"]||[]
	}
	let keyword=String(boardstaffstate["keyword"]||"").trim().toLowerCase()
	let out=[]
	for(let i=0;i<list.length;i=i+1){
		let item=list[i]
		let statekey=boardstaffstatekey(item)
		let matched=true
		if(boardstaffstate["filter"]=="working"){
			// 「上班中」＝ 有打卡的人，含在桌與空閒；休息中刻意不算在內，
			// 那是「人在但現在不能派」，與「可以派」混在一起會誤導現場。
			matched=statekey=="ontable"||statekey=="idle"
		}else if(boardstaffstate["filter"]=="idle"){
			matched=statekey=="idle"
		}else if(boardstaffstate["filter"]=="ontable"){
			matched=statekey=="ontable"
		}else if(boardstaffstate["filter"]=="onbreak"){
			matched=statekey=="onbreak"
		}else if(boardstaffstate["filter"]=="off"){
			matched=statekey=="off"
		}
		if(matched&&keyword){
			let hay=String(item["staffname"]||"")+" "+String(item["staffplayerid"]||"")+" "+boardrolelabel(item["role"])
			matched=hay.toLowerCase().indexOf(keyword)>=0
		}
		if(matched){
			out.push(item)
		}
	}
	return out
}

function boardstaffsortvalue(item,key){
	if(key=="name"){
		return String(item["staffname"]||"")||null
	}
	if(key=="role"){
		return boardrolelabel(item["role"])||null
	}
	if(key=="state"){
		// 依「現場最想先看到」的順序給權重，不是照字母排。
		let order={ "ontable": 1,"idle": 2,"onbreak": 3,"off": 4 }
		return order[boardstaffstatekey(item)]||9
	}
	if(key=="minute"){
		let number=Number(item["totalminute"])
		return isNaN(number)?null:number
	}
	return null
}

function boardstaffcount(statekey){
	let list=[]
	if(boardstaffdata){
		list=boardstaffdata["stafflist"]||[]
	}
	if(statekey=="all"){
		return list.length
	}
	let total=0
	for(let i=0;i<list.length;i=i+1){
		let key=boardstaffstatekey(list[i])
		if(statekey=="working"){
			if(key=="ontable"||key=="idle"){
				total=total+1
			}
		}else if(key==statekey){
			total=total+1
		}
	}
	return total
}

// 員工總覽：篩選 + 排序 + 分頁。協會員工多的時候，桌卡上零散的值班列看不出全貌。
function renderboardstaffpanel(){
	let panel=domgetid("boardstaffpanel")
	if(!panel){
		return
	}
	let all=[]
	if(boardstaffdata){
		all=boardstaffdata["stafflist"]||[]
	}
	if(all.length==0){
		addclass("#boardstaffpanel","hidden")
		return
	}
	removeclass("#boardstaffpanel","hidden")

	let filterlist=[
		["all",boardstafftext("filterall","全部")],
		["working",boardstafftext("filterworking","上班中")],
		["idle",boardstafftext("filteridle","空閒")],
		["ontable",boardstafftext("filterontable","在桌")],
		["onbreak",boardstafftext("filteronbreak","休息中")],
		["off",boardstafftext("filteroff","未打卡")]
	]
	let chiphtml=""
	for(let i=0;i<filterlist.length;i=i+1){
		let key=filterlist[i][0]
		let actived=boardstaffstate["filter"]==key
		let style=actived?"border-emerald-500 bg-emerald-600/20 text-emerald-300":"border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
		chiphtml=chiphtml+`<input type="button" class="boardstafffilter cursor-pointer rounded-full border px-3 py-1 text-xs font-bold ${style}" data-filter="${boardescape(key)}" value="${boardescape(filterlist[i][1]+" "+boardstaffcount(key))}">`
	}

	let list=boardstafffiltered()
	list=ptsortlist(list,boardstaffsortstate["key"],boardstaffsortstate["ascended"],boardstaffsortvalue)
	let totalpages=Math.ceil(list.length/BOARDSTAFFPAGESIZE)||1
	if(totalpages<boardstaffstate["page"]){
		boardstaffstate["page"]=totalpages
	}
	if(boardstaffstate["page"]<1){
		boardstaffstate["page"]=1
	}
	let start=(boardstaffstate["page"]-1)*BOARDSTAFFPAGESIZE
	let rowhtml=""
	for(let i=start;i<list.length&&i<start+BOARDSTAFFPAGESIZE;i=i+1){
		let item=list[i]
		let selfmark=""
		if(item["selfed"]){
			selfmark=`<span class="ml-1 text-emerald-300">（${boardstafftext("me","我")}）</span>`
		}
		let actionhtml=""
		if(boardstaffdata["canmanage"]&&!item["ontableed"]){
			actionhtml=`<span class="text-xs text-zinc-600">${boardstafftext("picktablehint","從桌卡指派")}</span>`
		}
		if(item["ontableed"]){
			actionhtml=`<input type="button" class="boardstaffpanelrelease cursor-pointer text-xs text-zinc-400 hover:text-rose-300" data-tablestaffid="${boardescape(item["tablestaffid"])}" value="${boardstafftext("leavetable","下桌")}">`
		}
		rowhtml=rowhtml+`
			<tr class="border-b border-zinc-800 last:border-b-0">
				<td class="py-2 px-2 text-sm text-zinc-200">${boardescape(item["staffname"])}${selfmark}<div class="text-xs text-zinc-500">${boardescape(item["staffplayerid"])}</div></td>
				<td class="py-2 px-2 text-sm text-zinc-300">${boardescape(boardrolelabel(item["role"]))}</td>
				<td class="py-2 px-2"><span class="rounded-full border px-2 py-0.5 text-xs font-bold ${boardstaffstatecolor(item)}">${boardescape(boardstaffstatetext(item))}</span></td>
				<td class="py-2 px-2 text-sm text-zinc-300">${boardescape(ptformatduration(item["totalminute"]))}</td>
				<td class="py-2 px-2 text-right">${actionhtml}</td>
			</tr>
		`
	}
	if(!rowhtml){
		rowhtml=`<tr><td colspan="5" class="py-6 text-center text-sm text-zinc-500">${boardstafftext("filterempty","這個條件沒有符合的員工")}</td></tr>`
	}

	let pagehtml=""
	if(1<totalpages){
		pagehtml=`
			<div class="mt-3 flex items-center justify-center gap-2 text-sm">
				<input type="button" class="boardstaffpage cursor-pointer rounded border border-zinc-700 px-3 py-1 ${boardstaffstate["page"]<=1?"opacity-40":"hover:border-emerald-500"}" data-page="${boardstaffstate["page"]-1}" value="&lt;">
				<span class="text-zinc-400">${boardstaffstate["page"]} / ${totalpages}</span>
				<input type="button" class="boardstaffpage cursor-pointer rounded border border-zinc-700 px-3 py-1 ${totalpages<=boardstaffstate["page"]?"opacity-40":"hover:border-emerald-500"}" data-page="${boardstaffstate["page"]+1}" value="&gt;">
			</div>
		`
	}

	panel.innerHTML=`
		<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
			<div class="text-sm font-bold text-white">${boardstafftext("paneltitle","員工總覽")}</div>
			<input type="text" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-white" id="boardstaffkeyword" value="${boardescape(boardstaffstate["keyword"])}" placeholder="${boardstafftext("searchplaceholder","搜尋姓名或編號")}">
		</div>
		<div class="mb-3 flex flex-wrap gap-2">${chiphtml}</div>
		<div class="overflow-x-auto">
			<table class="w-full min-w-[520px]">
				<thead class="text-left text-xs font-bold uppercase tracking-wider text-zinc-400" id="boardstaffhead">
					<tr class="border-b border-zinc-800">
						<th class="ptsortth select-none py-2 px-2" data-sortkey="name"><span class="pointer-events-none">${boardstafftext("colname","姓名")}</span><span class="ptsortarrow pointer-events-none text-emerald-400" data-sortkey="name"></span></th>
						<th class="ptsortth select-none py-2 px-2" data-sortkey="role"><span class="pointer-events-none">${boardstafftext("colrole","角色")}</span><span class="ptsortarrow pointer-events-none text-emerald-400" data-sortkey="role"></span></th>
						<th class="ptsortth select-none py-2 px-2" data-sortkey="state"><span class="pointer-events-none">${boardstafftext("colstate","狀態")}</span><span class="ptsortarrow pointer-events-none text-emerald-400" data-sortkey="state"></span></th>
						<th class="ptsortth select-none py-2 px-2" data-sortkey="minute"><span class="pointer-events-none">${boardstafftext("colduration","累計時數")}</span><span class="ptsortarrow pointer-events-none text-emerald-400" data-sortkey="minute"></span></th>
						<th class="py-2 px-2"></th>
					</tr>
				</thead>
				<tbody>${rowhtml}</tbody>
			</table>
		</div>
		${pagehtml}
	`
	ptsortarrow("#boardstaffhead",boardstaffsortstate["key"],boardstaffsortstate["ascended"])
	ptbindsort("#boardstaffhead",boardstaffsortstate,function(){
		renderboardstaffpanel()
	})
	onclick(".boardstafffilter",function(element,event){
		boardstaffstate["filter"]=dataset(element,"filter")
		boardstaffstate["page"]=1
		renderboardstaffpanel()
	})
	onclick(".boardstaffpage",function(element,event){
		let page=int(dataset(element,"page")||1)
		if(page<1||totalpages<page){
			return
		}
		boardstaffstate["page"]=page
		renderboardstaffpanel()
	})
	oninput("#boardstaffkeyword",function(element,event){
		boardstaffstate["keyword"]=element.value
		boardstaffstate["page"]=1
		renderboardstaffpanel()
		// 重畫會把輸入框換掉，游標會掉 —— 補回焦點與游標位置，
		// 不然打第二個字就要重新點一次欄位。
		let box=domgetid("boardstaffkeyword")
		if(box){
			box.focus()
			box.setSelectionRange(box.value.length,box.value.length)
		}
	})
	onclick(".boardstaffpanelrelease",function(element,event){
		sendstaffrelease(dataset(element,"tablestaffid"))
	})
}

// 這張桌現在誰在顧。一桌同角色刻意允許並存（交接時新舊計分員短暫重疊），
// 所以這裡是逐列顯示、不是只顯示一個人。
function tablestaffhtml(table){
	if(!boardstaffdata){
		return ""
	}
	let selfstaff=boardselfstaff()
	let list=(boardstaffdata["tablemap"]||{})[String(table["id"])]||[]
	let selfontableed=false
	let rowhtml=""
	for(let i=0;i<list.length;i=i+1){
		let selfrowed=selfstaff&&String(list[i]["staffuserid"])==String(selfstaff["staffuserid"])
		if(selfrowed){
			selfontableed=true
		}
		let releasehtml=""
		// 能管的人可以讓任何人下桌；員工自己**只能讓自己下桌**
		if(boardstaffdata["canmanage"]||selfrowed){
			releasehtml="<input type=\"button\" class=\"boardstaffrelease shrink-0 text-xs text-zinc-400 hover:text-rose-300 cursor-pointer\" data-tablestaffid=\""+boardescape(list[i]["tablestaffid"])+"\" value=\""+boardstafftext("leavetable","下桌")+"\">"
		}
		rowhtml=rowhtml+
			"<div class=\"flex items-center justify-between gap-2 text-xs\">"+
				"<span class=\"min-w-0 truncate "+(selfrowed?"text-emerald-200 font-bold":"text-emerald-300")+"\">"+boardrolelabel(list[i]["role"])+" · "+boardescape(list[i]["staffname"])+(selfrowed?"（"+boardstafftext("me","我")+"）":"")+"</span>"+
				releasehtml+
			"</div>"
	}
	if(!rowhtml){
		rowhtml="<div class=\"text-xs text-zinc-600\">"+boardstafftext("nostaff","未指派")+"</div>"
	}
	let buttonhtml=""
	if(boardstaffdata["canmanage"]){
		buttonhtml="<input type=\"button\" class=\"boardstaffassign mt-1 w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs cursor-pointer\" data-id=\""+boardescape(table["id"])+"\" value=\""+boardstafftext("assigntable","指派值班")+"\">"
	}
	// 員工自己：沒在這桌就給「我上這桌」。已經在這桌就不給（上面那列已經有下桌鈕）。
	if(selfstaff&&!selfontableed){
		buttonhtml=buttonhtml+"<input type=\"button\" class=\"boardstaffsit mt-1 w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1 text-xs cursor-pointer\" data-id=\""+boardescape(table["id"])+"\" data-staffuserid=\""+boardescape(selfstaff["staffuserid"])+"\" value=\""+boardstafftext("sithere","我上這桌")+"\">"
	}
	return "<div class=\"mb-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2\">"+rowhtml+buttonhtml+"</div>"
}

function tablecardhtml(table,avg){
	let occupied=int(table["occupied"]||0)
	let maxseat=int(table["maxseat"]||9)
	let empty=int(table["empty"]||(maxseat-occupied))
	let title=table["name"]||("#"+(table["no"]||table["id"]))
	let flag=""
	if(table["closed"]){
		flag="<span class=\"rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-300\">"+boardtext("closedbadge","已關閉")+"</span>"
	}else if(occupied==0&&boardlastdata&&boardlastdata["tablecount"]>1){
		flag="<span class=\"rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-300\">"+boardtext("needmerge","可併桌（無人）")+"</span>"
	}else if(Math.abs(occupied-avg)>=2){
		flag="<span class=\"rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-300\">"+boardtext("unbalanced","人數不均")+"</span>"
	}
	// 每顆點對應「實際座位號」: 最左=1 號位, 有人才亮綠、空位灰。
	// 不可用 i<occupied 只亮前 N 顆——那樣 3/5/9 號位有人會誤亮成 1/2/3。
	let seatset={}
	let players=table["players"]||[]
	for(let i=0;i<players.length;i=i+1){
		seatset[int(players[i]["seatno"])]=true
	}
	let dots=""
	for(let i=1;i<=maxseat;i=i+1){
		let on=seatset[i]==true
		dots=dots+"<span class=\"inline-block h-3 w-3 rounded-full "+(on?"bg-emerald-400":"bg-zinc-700")+"\" title=\""+i+"\"></span>"
	}
	let playerhtml=""
	for(let i=0;i<players.length;i=i+1){
		let p=players[i]
		playerhtml=playerhtml+
			"<div class=\"flex items-center justify-between gap-2 border-t border-zinc-800 py-1.5 text-sm\">"+
				"<span class=\"min-w-0 truncate text-zinc-200\">S"+boardescape(p["seatno"])+" "+boardescape(p["name"]||"-")+"</span>"+
				"<span class=\"shrink-0 font-mono text-xs text-zinc-400\">"+boardescape(p["chip"]||0)+"</span>"+
			"</div>"
	}
	if(!playerhtml){
		playerhtml="<div class=\"border-t border-zinc-800 py-2 text-center text-xs text-zinc-600\">-</div>"
	}
	return ""+
	"<div class=\"rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4\">"+
		"<div class=\"mb-2 flex items-center justify-between gap-2\">"+
			"<div class=\"text-base font-bold text-white truncate\">"+boardescape(title)+"</div>"+
			flag+
		"</div>"+
		tablestaffhtml(table)+
		"<div class=\"mb-2 flex items-baseline gap-2\">"+
			"<span class=\"text-2xl font-extrabold text-emerald-400\">"+occupied+"</span>"+
			"<span class=\"text-sm text-zinc-500\">/ "+maxseat+"</span>"+
			"<span class=\"ml-auto text-xs text-zinc-500\">"+empty+" "+boardtext("seatempty","空位")+"</span>"+
		"</div>"+
		"<div class=\"mb-3 flex flex-wrap gap-1\">"+dots+"</div>"+
		playerhtml+
		// 空桌與已關閉桌不可當併桌來源, 併桌鈕 disable
		"<div class=\"mt-3 flex gap-2\">"+
			"<input type=\"button\" class=\"boardmergebtn w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-bold cursor-pointer\" data-id=\""+boardescape(table["id"])+"\" value=\""+boardmanagetext("mergebutton","併桌")+"\""+((table["closed"]||occupied==0)?" disabled":"")+">"+
			"<input type=\"button\" class=\"boardclosebtn w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-bold cursor-pointer\" data-id=\""+boardescape(table["id"])+"\" data-closed=\""+(table["closed"]?"1":"0")+"\" value=\""+(table["closed"]?boardtext("openbutton","開啟牌桌"):boardtext("closebutton","關閉牌桌"))+"\">"+
		"</div>"+
	"</div>"
}

function renderboard(data){
	boardlastdata=data
	let tables=data["tables"]||[]
	let tablecount=tables.length
	let totalplayers=int(data["totalplayers"]||0)
	// 平衡基準 avg 只用「有人且未關閉」的桌計算: 空桌(已標可併桌)與關閉桌不稀釋平均,
	// 否則 5/5/0 會算出 avg=3 而把兩張明明平衡的桌誤標「人數不均」
	let basecount=0
	let baseplayers=0
	for(let i=0;i<tables.length;i=i+1){
		if(!tables[i]["closed"]&&0<int(tables[i]["occupied"]||0)){
			basecount=basecount+1
			baseplayers=baseplayers+int(tables[i]["occupied"]||0)
		}
	}
	let avg=basecount>0?Math.round(baseplayers/basecount):0
	innertext("#stattables",tablecount,false)
	innertext("#statplayers",totalplayers,false)
	innertext("#statavg",avg,false)
	innertext("#boardsessionname","",false)
	// 員工總覽面板。資料由另一支 API（getstaffworkstatus）帶回來，
	// 兩支各自失敗互不影響，拿不到就整塊隱藏。
	renderboardstaffpanel()

	let grid=domgetid("boardgrid")
	let empty=domgetid("boardempty")
	if(tablecount<1){
		if(grid){grid.innerHTML=""}
		if(empty){empty.classList.remove("hidden")}
		hidebalancehint()
		return
	}
	if(empty){empty.classList.add("hidden")}
	let html=""
	for(let i=0;i<tables.length;i=i+1){
		html=html+tablecardhtml(tables[i],avg)
	}
	if(grid){grid.innerHTML=html}
	onclick(".boardmergebtn",function(element,event){
		openboardmergemodal(dataset(element,"id"))
	})
	onclick(".boardstaffassign",function(element,event){
		openstaffassignmodal(dataset(element,"id"))
	})
	onclick(".boardstaffsit",function(element,event){
		// 員工自己上桌。原本在別桌會自動換過來，還沒打卡會順便打上班卡 ——
		// 與主辦指派走的是同一支端點，差別只在 staffuserid 是自己。
		sendstaffassign(dataset(element,"id"),dataset(element,"staffuserid"),false)
	})
	onclick(".boardstaffrelease",function(element,event){
		sendstaffrelease(dataset(element,"tablestaffid"))
	})
	onclick(".boardclosebtn",function(element,event){
		let tableid=dataset(element,"id")
		let closed=dataset(element,"closed")=="1"
		ptconfirm(closed?boardtext("openconfirm","確定要重新開啟這張牌桌嗎？"):boardtext("closeconfirm","確定要關閉這張牌桌嗎？關閉後不會再有新選手進入。"),function(okayed){
			if(!okayed){
				return
			}
			ajax("POST",AJAXURL+"closetable/"+tableid,function(event,data){
				if(data["success"]){
					pttoast(closed?boardtext("opensuccess","已開啟牌桌"):boardtext("closesuccess","已關閉牌桌"),"success")
					loadboard()
				}else{
					pttoast(pterror(data["data"]||boardtext("togglefail","操作失敗")),"error")
				}
			},str({
				"closed": !closed
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	})
	renderbalancehint(tables,avg)
}

function hidebalancehint(){
	let hint=domgetid("balancehint")
	if(hint){
		hint.classList.add("hidden")
	}
}

function renderbalancehint(tables,avg){
	let hint=domgetid("balancehint")
	if(!hint){
		return
	}
	let over=[]
	let under=[]
	for(let i=0;i<tables.length;i=i+1){
		let t=tables[i]
		// 空桌走「可併桌(無人)」、關閉桌走「已關閉」標籤, 都不進平衡建議的偏多/偏少清單
		if(t["closed"]||int(t["occupied"]||0)==0){
			continue
		}
		let label=t["name"]||("#"+(t["no"]||t["id"]))
		let delta=int(t["occupied"]||0)-avg
		if(delta>=2){
			over.push(label+" (+"+delta+")")
		}else if(delta<=-2){
			under.push(label+" ("+delta+")")
		}
	}
	if(over.length==0&&under.length==0){
		hint.classList.add("hidden")
		hint.innerHTML=""
		return
	}
	let parts=[]
	if(over.length){
		parts.push(boardtext("over","偏多：")+over.join("、"))
	}
	if(under.length){
		parts.push(boardtext("under","偏少：")+under.join("、"))
	}
	hint.classList.remove("hidden")
	hint.innerHTML=boardescape(boardtext("hintprefix","平衡建議："))+boardescape(parts.join("　|　"))
}

// ==== 併桌 (原 register 牌桌管理搬過來): 選目標桌 modal → mergetableplayers → 自動關閉來源桌 → 結果 modal ====
function openboardmergemodal(sourceid){
	let source=boardfindtable(sourceid)
	if(!source){
		return
	}
	let sourcelabel=boardtablelabel(source)
	let sourcecount=int(source["occupied"]||0)
	let old=domgetid("boardmergemodal")
	if(old){
		ptremovescrollcover(old)
	}
	let tablelist=boardlastdata["tables"]||[]
	let optionhtml=""
	let totalempty=0
	for(let i=0;i<tablelist.length;i=i+1){
		let table=tablelist[i]
		// 只列其他開放中的桌; 空位不足以容納來源人數者 disable
		if(String(table["id"])==String(sourceid)||table["closed"]){
			continue
		}
		let tablemaxseat=int(table["maxseat"]||9)
		let empty=int(table["empty"]||(tablemaxseat-int(table["occupied"]||0)))
		totalempty=totalempty+empty
		let enough=sourcecount<=empty
		let optiontext=boardtablelabel(table)+"　"+boardmanagetext("emptycount","{n} 空位").replace("{n}",empty)
		if(!enough){
			optiontext=optiontext+"　"+boardmanagetext("mergeinsufficient","空位不足")
		}
		optionhtml=optionhtml+`<input type="button" class="boardmergetargetbtn w-full text-left bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 rounded px-3 py-2 text-sm" data-id="${boardescape(table["id"])}" value="${boardescape(optiontext)}" ${enough?"":"disabled"}>`
	}
	if(!optionhtml){
		optionhtml=`<div class="text-sm text-zinc-500">${boardmanagetext("mergenotarget","沒有可併入的開放牌桌")}</div>`
	}else{
		// 最上方多一個「隨機分配到所有開放桌」: 各開放桌空位總和不足來源人數則 disable
		let autoenough=sourcecount<=totalempty
		let autotext=boardmanagetext("mergeauto","隨機分配到所有開放桌")+"　"+boardmanagetext("mergeautototal","共 {n} 空位").replace("{n}",totalempty)
		if(!autoenough){
			autotext=autotext+"　"+boardmanagetext("mergeinsufficient","空位不足")
		}
		optionhtml=`<input type="button" class="boardmergeautobtn w-full text-left bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded px-3 py-2 text-sm font-semibold" value="${boardescape(autotext)}" ${autoenough?"":"disabled"}>`+optionhtml
	}
	let cover=doccreate("div")
	cover.id="boardmergemodal"
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-5 shadow-xl">
			<div class="flex items-center justify-between mb-4">
				<div class="text-lg font-semibold text-white">${boardmanagetext("mergetitle","併桌：選擇目標牌桌")}</div>
				<input type="button" class="closeboardmerge text-zinc-400 hover:text-white" value="×">
			</div>
			<div class="text-sm text-zinc-400 mb-4">${boardmanagetext("mergedesc","把「{table}」的所有選手併到選定的目標桌，併桌後本桌會自動關閉。").replace("{table}",boardescape(sourcelabel))}</div>
			<div class="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto">${optionhtml}</div>
			<div class="flex justify-end gap-2 mt-5">
				<input type="button" class="closeboardmerge bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded" value="${boardmanagetext("cancel","取消")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(cover)
	onclick(".closeboardmerge",function(element,event){
		ptremovescrollcover(domgetid("boardmergemodal"))
	})
	onclick(".boardmergetargetbtn",function(element,event){
		let targetid=dataset(element,"id")
		let target=boardfindtable(targetid)
		let targetlabel=""
		if(target){
			targetlabel=boardtablelabel(target)
		}
		ptconfirm(boardmanagetext("mergeconfirm","確定要把「{source}」的所有選手併到「{target}」嗎？併桌後「{source}」會自動關閉。").replace(/\{source\}/g,boardescape(sourcelabel)).replace("{target}",boardescape(targetlabel)),function(okayed){
			if(!okayed){
				return
			}
			boardmergeto(sourceid,targetid)
		})
	})
	onclick(".boardmergeautobtn",function(element,event){
		ptconfirm(boardmanagetext("mergeautoconfirm","確定要把「{source}」的所有選手隨機分配到所有開放牌桌嗎？併桌後「{source}」會自動關閉。").replace(/\{source\}/g,boardescape(sourcelabel)),function(okayed){
			if(!okayed){
				return
			}
			boardmergeto(sourceid,"auto")
		})
	})
}

function boardmergeto(sourceid,targetid){
	// targetid="auto" 為特殊值(隨機分配到所有開放桌), 原樣送字串; 其餘照舊轉數字
	let targetvalue=targetid
	if(targetid!="auto"){
		targetvalue=int(targetid)
	}
	ajax("POST",AJAXURL+"mergetableplayers/"+sourceid,function(event,data){
		if(data["success"]){
			let modal=domgetid("boardmergemodal")
			if(modal){
				ptremovescrollcover(modal)
			}
			let movedata=data["data"]||{}
			// 併桌=拆桌: 成功後自動關閉來源桌, 之後不該再有人進來
			ajax("POST",AJAXURL+"closetable/"+sourceid,function(event,closedata){
				if(closedata["success"]){
					openboardmergeresult(movedata,true)
				}else{
					pttoast(boardmanagetext("mergeclosefail","併桌完成，但自動關閉來源桌失敗，請手動關閉"),"warning")
					openboardmergeresult(movedata,false)
				}
				loadboard()
			},str({
				"closed": true
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		}else{
			pttoast(pterror(data["data"]||boardmanagetext("mergefail","併桌失敗")),"error")
		}
	},str({
		"targettableid": targetvalue
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#boardmergemodal"
	})
}

function openboardmergeresult(movedata,closeded){
	let old=domgetid("boardmergeresultmodal")
	if(old){
		ptremovescrollcover(old)
	}
	let sourcelabel=String(movedata["sourcetablename"]||movedata["sourcetableno"]||"")
	let targetlabel=String(movedata["targettablename"]||movedata["targettableno"]||"")
	// auto 模式後端 targettableno/targettablename 給 null → targetlabel 為空 → 標題改「併入多桌」, 各列去向看 moves
	let titletext=""
	if(targetlabel==""){
		titletext=boardmanagetext("resulttitlemulti","「{source}」併入多桌").replace("{source}",boardescape(sourcelabel))
	}else{
		titletext=boardmanagetext("resulttitle","「{source}」併入「{target}」").replace("{source}",boardescape(sourcelabel)).replace("{target}",boardescape(targetlabel))
	}
	let moves=movedata["moves"]||[]
	let rowhtml=""
	for(let i=0;i<moves.length;i=i+1){
		let move=moves[i]
		let playeridhtml=""
		if(move["playerid"]){
			playeridhtml=` <span class="text-sm font-normal text-zinc-400">(${boardescape(move["playerid"])})</span>`
		}
		rowhtml=rowhtml+`
			<div class="flex items-center justify-between gap-3 border-t border-zinc-800 py-2">
				<div class="min-w-0 truncate text-lg font-bold text-white">${boardescape(move["playername"]||"-")}${playeridhtml}</div>
				<div class="shrink-0 font-mono text-xl font-extrabold text-emerald-400">${boardescape(movedata["sourcetableno"])}-${boardescape(move["fromseatno"])} → ${boardescape(move["totableno"])}-${boardescape(move["toseatno"])}</div>
			</div>
		`
	}
	if(!rowhtml){
		rowhtml=`<div class="py-3 text-sm text-zinc-400">${boardmanagetext("resultempty","此次併桌沒有需要移動的選手。")}</div>`
	}
	let closedhtml=""
	if(closeded){
		closedhtml=`<div class="mt-3 text-xs text-amber-300">${boardmanagetext("resultclosed","「{source}」已自動關閉，不會再有新選手進入。").replace("{source}",boardescape(sourcelabel))}</div>`
	}
	let cover=doccreate("div")
	cover.id="boardmergeresultmodal"
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-5 shadow-xl">
			<div class="text-lg font-semibold text-white mb-4">${titletext}</div>
			<div class="max-h-[50vh] overflow-y-auto">${rowhtml}</div>
			${closedhtml}
			<div class="flex justify-end gap-2 mt-5">
				<input type="button" class="closeboardmergeresult bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded font-semibold" value="${boardmanagetext("resultclose","關閉")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(cover)
	onclick(".closeboardmergeresult",function(element,event){
		ptremovescrollcover(domgetid("boardmergeresultmodal"))
	})
}

// 值班員工的資料另外打一支 getstaffworkstatus，**刻意不改 getsessiontableboard 的回傳形狀** ——
// 那一支已經有既有前端在吃，改 payload 還要同步 apidoc.js、過 verify:apidoc，
// 成本高於多打一支 API。兩支各自失敗互不影響，值班列拿不到就單純不顯示。
function loadstaffboard(){
	if(!boardsessionid){
		return
	}
	ajax("GET",AJAXURL+"getstaffworkstatus/"+boardsessionid,function(event,data){
		if(data["success"]){
			boardstaffdata=data["data"]
			if(boardlastdata){
				renderboard(boardlastdata)
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],null)
}

function loadboard(){
	if(!boardsessionid){
		pttoast(boardtext("nosession","缺少場次 ID"),"error")
		return
	}
	ajax("GET",AJAXURL+"getsessiontableboard/"+boardsessionid,function(event,data){
		if(data["success"]){
			renderboard(data["data"])
			loadstaffboard()
			return
		}
		if(data["data"]=="ERROR_no_permission"){
			pttoast(boardtext("noperm","沒有權限檢視此看板"),"error")
			return
		}
		if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
			pthandleauthfailure(data["data"],{"toasted": false})
			return
		}
		pttoast(pterror(data["data"]||boardtext("loadfail","載入失敗")),"error")
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		"loadingtarget": "#boardgrid"
	})
}

function autobalance(){
	if(!boardlastdata||!boardsessionid){
		return
	}
	let tableids=[]
	let tables=boardlastdata["tables"]||[]
	for(let i=0;i<tables.length;i=i+1){
		// 已關閉的桌不參與自動平衡 (後端也會再排除一次)
		if(tables[i]["closed"]){
			continue
		}
		tableids.push(tables[i]["id"])
	}
	if(tableids.length<2){
		return
	}
	ptconfirm(boardtext("confirmbalance","確定要自動把未入座／可調整的選手平衡到各桌嗎？"),function(okayed){
		if(!okayed){
			return
		}
		ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+boardsessionid,function(event,data){
			if(data["success"]){
				pttoast(boardtext("balancedone","已套用平衡"),"success")
				loadboard()
				return
			}
			pttoast(pterror(data["data"]||boardtext("balancefail","平衡失敗")),"error")
		},str({
			"mode": "balanced",
			"tableids": tableids
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	})
}

function unseatallplayers(){
	if(!boardsessionid){
		return
	}
	ptconfirm(boardtext("unseatallconfirm","確定要打散重抽嗎？將把所有在場選手變為未排桌，之後可用隨機排座重新抽桌。"),function(okayed){
		if(!okayed){
			return
		}
		ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+boardsessionid,function(event,data){
			if(data["success"]){
				let unseatedcount=(data["data"]||{})["unseatedcount"]||0
				pttoast(boardtext("unseatalldone","已退座 {n} 位選手").replace("{n}",String(unseatedcount)),"success")
				loadboard()
				return
			}
			pttoast(pterror(data["data"]||boardtext("unseatallfail","全部退座失敗")),"error")
		},str({
			"mode": "unseatall"
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	})
}

applyboardstatic()
loadboard()

boardtimer=setInterval(loadboard,15000)

onclick("#refreshboard",function(){
	loadboard()
})

onclick("#autobalance",function(){
	autobalance()
})

onclick("#unseatall",function(){
	unseatallplayers()
})

window.addEventListener("beforeunload",function(){
	if(boardtimer){
		clearInterval(boardtimer)
	}
})
