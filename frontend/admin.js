if(!weblsget(WEBLSNAME+"signin")){
	href("./")
}

// API 紀錄表的排序狀態。這份清單是後端分頁的，排序由後端做（見 loadadminlog）。
// key 為空字串時用後端預設（id DESC，也就是最新的在前）。
let adminlogsortstate={ "key": "","ascended": true }
let adminlogpage=1
let adminloglimit=20
let adminlogerroronly=false

function adminlogtext(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["adminlogpage"]&&TRANSLATE[LANGUAGE]["adminlogpage"][key]){
		return TRANSLATE[LANGUAGE]["adminlogpage"][key]
	}
	if(fallback!=null){
		return fallback
	}
	return key
}

function applyadminloglanguage(){
	document.title=adminlogtext("title")+" - PokerTrace"
	let eyebrow=domgetid("adminlogeyebrow")
	if(eyebrow){
		eyebrow.textContent=adminlogtext("eyebrow","API Access Log")
	}
	let heading=domgetid("adminlogheading")
	if(heading){
		heading.textContent=adminlogtext("heading")
	}
	let keyword=domgetid("adminlogkeyword")
	if(keyword){
		keyword.setAttribute("placeholder",adminlogtext("searchplaceholder"))
	}
	let search=domgetid("searchadminlog")
	if(search){
		search.value=adminlogtext("search")
	}
	let erroronly=domgetid("adminlogerroronly")
	if(erroronly){
		erroronly.value=adminlogtext("erroronly")
	}
	let reload=domgetid("reloadadminlog")
	if(reload){
		reload.value=adminlogtext("reload")
	}
	let coltime=domgetid("adminlogcoltime")
	if(coltime){
		coltime.textContent=adminlogtext("coltime")
	}
	let coluser=domgetid("adminlogcoluser")
	if(coluser){
		coluser.textContent=adminlogtext("coluser")
	}
	let colpath=domgetid("adminlogcolpath")
	if(colpath){
		colpath.textContent=adminlogtext("colpath")
	}
	let colstatus=domgetid("adminlogcolstatus")
	if(colstatus){
		colstatus.textContent=adminlogtext("colstatus")
	}
	let detailtitle=domgetid("adminlogdetailtitle")
	if(detailtitle){
		detailtitle.textContent=adminlogtext("detailtitle")
	}
}

function statuscodeclass(code){
	let number=Number(code)
	if(400<=number){
		return "bg-rose-500/15 text-rose-200"
	}
	if(300<=number){
		return "bg-yellow-500/15 text-yellow-200"
	}
	return "bg-emerald-500/15 text-emerald-200"
}

function formatdatetime(value){
	if(!value){
		return ""
	}
	let date=new Date(value)
	if(isNaN(date.getTime())){
		return value
	}
	let pad=function(number){
		return String(number).padStart(2,"0")
	}
	return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())+" "+pad(date.getHours())+":"+pad(date.getMinutes())+":"+pad(date.getSeconds())
}

function userlabelof(item){
	if(item["username"]){
		return escapehtml(item["username"])+" / "+escapehtml(item["userplayerid"]||"")
	}
	if(item["userid"]){
		return adminlogtext("unknownuser")+" #"+escapehtml(item["userid"])
	}
	return adminlogtext("anonymous")
}

let adminlogrows=[]

function renderadminlog(row){
	adminlogrows=row
	let html=""
	for(let i=0;i<row.length;i=i+1){
		let item=row[i]
		html=html+`
			<tr class="adminlogrow border-t border-zinc-800 hover:bg-zinc-900/60 cursor-pointer" data-index="${i}">
				<td class="px-4 py-3 whitespace-nowrap text-zinc-300">${escapehtml(formatdatetime(item["createtime"]))}</td>
				<td class="px-4 py-3 text-zinc-200">${userlabelof(item)}<div class="text-xs text-zinc-500">${escapehtml(item["useremail"]||"")}</div></td>
				<td class="px-4 py-3 text-zinc-300 font-mono text-xs">${escapehtml(item["path"])}</td>
				<td class="px-4 py-3"><span class="text-xs px-2 py-1 rounded ${statuscodeclass(item["statuscode"])}">${escapehtml(item["statuscode"])}</span></td>
			</tr>
		`
	}
	if(!html){
		html=`<tr><td colspan="4" class="px-4 py-6 text-center text-zinc-400">${adminlogtext("empty")}</td></tr>`
	}
	innerhtml("#adminlogtablebody",html,false)
	onclick(".adminlogrow",function(element,event){
		openadminlogdetail(Number(dataset(element,"index")))
	})
}

function openadminlogdetail(index){
	let item=adminlogrows[index]
	if(!item){
		return
	}
	let userlabel=adminlogtext("anonymous")
	if(item["username"]){
		userlabel=item["username"]+" / "+(item["userplayerid"]||"")
	}else if(item["userid"]){
		userlabel=adminlogtext("unknownuser")+" #"+item["userid"]
	}
	let rows=[
		[adminlogtext("coltime"),formatdatetime(item["createtime"])],
		[adminlogtext("coluser"),userlabel+(item["useremail"]?(" / "+item["useremail"]):"")],
		[adminlogtext("colmethod"),item["method"]],
		[adminlogtext("colpath"),item["path"]],
		[adminlogtext("colstatus"),item["statuscode"]],
		[adminlogtext("colip"),item["ipaddress"]||"-"],
		[adminlogtext("colagent"),item["useragent"]||"-"]
	]
	let html=""
	for(let i=0;i<rows.length;i=i+1){
		html=html+`
			<div>
				<div class="text-xs uppercase tracking-wide text-zinc-500">${escapehtml(rows[i][0])}</div>
				<div class="mt-1 break-all text-zinc-100">${escapehtml(rows[i][1])}</div>
			</div>
		`
	}
	innerhtml("#adminlogdetailbody",html,false)
	let modal=domgetid("adminlogdetailmodal")
	if(modal){
		modal.classList.remove("hidden")
	}
}

function closeadminlogdetail(){
	let modal=domgetid("adminlogdetailmodal")
	if(modal){
		modal.classList.add("hidden")
	}
}

onclick("#closeadminlogdetail",function(element,event){
	closeadminlogdetail()
})

onclick("#adminlogdetailmodal",function(element,event){
	if(event.target==element){
		closeadminlogdetail()
	}
})

function renderadminlogpagination(pagination){
	renderptpagination("adminlogpagination",pagination,function(pagevalue){
		adminlogpage=pagevalue
		loadadminlog()
	})
}

function loadadminlog(){
	let keywordinput=domgetid("adminlogkeyword")
	let keyword=keywordinput?keywordinput.value.trim():""
	let url=AJAXURL+"getapilog?page="+adminlogpage+"&limit="+adminloglimit
	// 這份清單是**後端分頁**的，所以排序一定要交給後端。
	// 在前端排只會排到當前這 20 筆，使用者以為排了全部其實沒有 —— 那比不能排更糟。
	if(adminlogsortstate["key"]){
		url=url+"&order="+encodeURIComponent(adminlogsortstate["key"])+"&direction="+(adminlogsortstate["ascended"]?"asc":"desc")
	}
	if(keyword){
		url=url+"&keyword="+encodeURIComponent(keyword)
	}
	if(adminlogerroronly){
		url=url+"&erroronly=1"
	}
	ajax("GET",url,function(event,data){
		if(data["success"]){
			renderadminlog(data["data"]["logs"]||[])
			renderadminlogpagination(data["data"]["pagination"]||{})
		}else{
			pttoast(pterror(data["data"]||adminlogtext("loadfail")),"error")
			if(data["data"]=="ERROR_no_permission"||data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
				setTimeout(function(){
					href("./")
				},700)
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#adminlogtablebody"
	})
}

onclick("#reloadadminlog",function(element,event){
	adminlogpage=1
	loadadminlog()
})

onclick("#searchadminlog",function(element,event){
	adminlogpage=1
	loadadminlog()
})

function renderadminlogerroronly(){
	let button=domgetid("adminlogerroronly")
	if(!button){
		return
	}
	button.setAttribute("aria-pressed",adminlogerroronly?"true":"false")
	if(adminlogerroronly){
		button.classList.remove("border-zinc-700","bg-zinc-800")
		button.classList.add("border-rose-400","bg-rose-500/15","text-rose-200")
	}else{
		button.classList.remove("border-rose-400","bg-rose-500/15","text-rose-200")
		button.classList.add("border-zinc-700","bg-zinc-800")
	}
}

onclick("#adminlogerroronly",function(element,event){
	adminlogerroronly=!adminlogerroronly
	renderadminlogerroronly()
	adminlogpage=1
	loadadminlog()
})

let keywordinput=domgetid("adminlogkeyword")
if(keywordinput){
	keywordinput.onkeydown=function(event){
		if(event.key=="Enter"){
			adminlogpage=1
			loadadminlog()
		}
	}
}

let limitselect=domgetid("adminloglimitselect")
if(limitselect){
	adminloglimit=Number(limitselect.value)||20
	limitselect.onchange=function(){
		adminloglimit=Number(limitselect.value)||20
		adminlogpage=1
		loadadminlog()
	}
}

applyadminloglanguage()
loadadminlog()

// 使用者管理頁籤 ===============================================================

function adminusertext(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["adminuserpage"]&&TRANSLATE[LANGUAGE]["adminuserpage"][key]){
		return TRANSLATE[LANGUAGE]["adminuserpage"][key]
	}
	if(fallback!=null){
		return fallback
	}
	return key
}

function adminpadnumber(number){
	return String(number).padStart(2,"0")
}

// 依「現在 + 時長(小時)」算出到期時刻，格式化成 YYYY-MM-DD HH:MM:SS 給後端 blockuser 用。
function adminuserexpiry(hours){
	let target=new Date(Date.now()+hours*3600000)
	return target.getFullYear()+"-"+adminpadnumber(target.getMonth()+1)+"-"+adminpadnumber(target.getDate())+" "+adminpadnumber(target.getHours())+":"+adminpadnumber(target.getMinutes())+":"+adminpadnumber(target.getSeconds())
}

function adminusersettext(id,key){
	let element=domgetid(id)
	if(element){
		element.textContent=adminusertext(key)
	}
}

function adminusersetvalue(id,key){
	let element=domgetid(id)
	if(element){
		element.value=adminusertext(key)
	}
}

function adminusersetplaceholder(id,key){
	let element=domgetid(id)
	if(element){
		element.setAttribute("placeholder",adminusertext(key))
	}
}

function applyadminuserlanguage(){
	adminusersetvalue("admintabbuttonlog","tablog")
	adminusersetvalue("admintabbuttonuser","tabuser")
	adminusersettext("adminusereyebrow","eyebrow")
	adminusersettext("adminuserheading","heading")
	adminusersettext("adminuserhint","adminhint")
	adminusersettext("adminusersorthint","sorthint")
	adminusersetplaceholder("adminuserkeyword","searchplaceholder")
	adminusersetvalue("showadminuserdefault","showdefaultuser")
	adminusersetvalue("searchadminuser","search")
	adminusersetvalue("reloadadminuser","reload")
	let limitselectelement=domgetid("adminuserlimitselect")
	if(limitselectelement){
		limitselectelement.setAttribute("aria-label",adminusertext("pagesizelabel"))
	}
	adminusersettext("adminusercolname","colname")
	adminusersettext("adminusercolplayerid","colplayerid")
	adminusersettext("adminusercolemail","colemail")
	adminusersettext("adminusercolpermission","colpermission")
	adminusersettext("adminusercolstatus","colstatus")
	adminusersettext("adminusercolcreatetime","colcreatetime")
	adminusersettext("adminusercolaction","colaction")
	adminusersettext("adminuserblocktitle","blockmodaltitle")
	adminusersettext("adminuserblockreasonlabel","blockreasonlabel")
	adminusersetplaceholder("adminuserblockreason","blockreasonplaceholder")
	adminusersettext("adminuserblockdurationlabel","blockdurationlabel")
	adminusersetvalue("canceladminuserblock","cancel")
	adminusersetvalue("submitadminuserblock","submit")
	adminusersettext("adminuserbantitle","banmodaltitle")
	adminusersettext("adminuserbanreasonlabel","banreasonlabel")
	adminusersetplaceholder("adminuserbanreason","banreasonplaceholder")
	adminusersettext("adminuserbanwarning","banconfirm")
	adminusersetvalue("canceladminuserban","cancel")
	adminusersetvalue("submitadminuserban","ban")
	let durationselect=domgetid("adminuserblockduration")
	if(durationselect&&5<=durationselect.options.length){
		durationselect.options[0].textContent=adminusertext("duration1hour")
		durationselect.options[1].textContent=adminusertext("duration1day")
		durationselect.options[2].textContent=adminusertext("duration3day")
		durationselect.options[3].textContent=adminusertext("duration7day")
		durationselect.options[4].textContent=adminusertext("duration30day")
	}
}

function setadmintabbuttonactive(button,actived){
	if(button){
		if(actived){
			button.classList.remove("bg-zinc-700","text-zinc-300","hover:bg-zinc-600")
			button.classList.add("bg-blue-600","text-white")
		}else{
			button.classList.remove("bg-blue-600","text-white")
			button.classList.add("bg-zinc-700","text-zinc-300","hover:bg-zinc-600")
		}
	}
}

let adminuserloadeded=false

function showadmintab(tabname){
	let logsection=domgetid("admintablog")
	let usersection=domgetid("admintabuser")
	let logbutton=domgetid("admintabbuttonlog")
	let userbutton=domgetid("admintabbuttonuser")
	if(tabname=="user"){
		if(logsection){
			logsection.classList.add("hidden")
		}
		if(usersection){
			usersection.classList.remove("hidden")
		}
		setadmintabbuttonactive(userbutton,true)
		setadmintabbuttonactive(logbutton,false)
		if(!adminuserloadeded){
			adminuserloadeded=true
			loadadminself()
			loadadminuserlist()
		}
	}else{
		if(usersection){
			usersection.classList.add("hidden")
		}
		if(logsection){
			logsection.classList.remove("hidden")
		}
		setadmintabbuttonactive(logbutton,true)
		setadmintabbuttonactive(userbutton,false)
	}
}

onclick("#admintabbuttonlog",function(element,event){
	showadmintab("log")
})

onclick("#admintabbuttonuser",function(element,event){
	showadmintab("user")
})

// 目前登入管理員自己的 id，用來做自我保護(不能封鎖/停權/降權自己)。
let adminselfid=null
let adminuserlist=[]
// 預設測試用使用者 (defultuser.py)：playerid 0 開頭皆為測試使用者，判定與 register.js 一致。
// showdefaultusered 未開啟時清單一律過濾掉這些使用者。
let showdefaultusered=false
// 排序狀態：空字串代表維持後端回傳順序，切換欄位時重設為升冪。
let adminusersortkey=""
let adminusersortascended=true
// 狀態排序次序：有問題的排前面（永久停權 > 限時封鎖 > 正常）。
const ADMINUSERSTATUSORDER={"banned": 0,"blocked": 1,"active": 2}
// getuserlist 一次回傳全部使用者、沒有分頁參數，所以這裡做前端分頁：過濾 → 排序 → 切片。
let adminuserpage=1
let adminuserlimit=20

function loadadminself(){
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(data["success"]){
			adminselfid=data["data"]["id"]
			renderadminuserlist()
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function loadadminuserlist(){
	ajax("GET",AJAXURL+"getuserlist",function(event,data){
		if(data["success"]){
			adminuserlist=data["data"]||[]
			renderadminuserlist()
		}else{
			pttoast(pterror(data["data"]||adminusertext("loadfail")),"error")
			if(data["data"]=="ERROR_no_permission"||data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
				setTimeout(function(){
					href("./")
				},700)
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#adminusertablebody"
	})
}

function adminusermatchkeyword(item,keyword){
	let matched=true
	if(keyword){
		let text=((item["name"]||"")+" "+(item["email"]||"")+" "+(item["playerid"]||"")).toLowerCase()
		matched=0<=text.indexOf(keyword.toLowerCase())
	}
	return matched
}

// 預設 / 測試使用者判定：playerid 以 "0" 開頭（與 register.js 的 searchusers 過濾條件相同）。
function adminuserdefaulted(item){
	return String(item["playerid"]||"").indexOf("0")==0
}

// 取出排序用的值；取不到（null / undefined / 空字串 / 非法值）一律回 null，由 adminusercompare 統一排到最後。
function adminusersortvalue(item,key){
	let value=null
	if(key=="permission"){
		let number=Number(item["permission"])
		if(item["permission"]!=null&&item["permission"]!=""&&!isNaN(number)){
			value=number
		}
	}else if(key=="status"){
		if(ADMINUSERSTATUSORDER[item["status"]]!=undefined){
			value=ADMINUSERSTATUSORDER[item["status"]]
		}
	}else if(key=="createtime"){
		// ptformatdatetime 會正規化成固定寬度 YYYY-MM-DD HH:MM:SS，字典序即等於時間序。
		let text=ptformatdatetime(item["createtime"])
		if(text!=""){
			value=text
		}
	}else{
		let text=""
		if(item[key]!=null){
			text=String(item[key]).trim()
		}
		if(text!=""){
			value=text
		}
	}
	return value
}

function adminusercompare(itema,itemb,key,ascended){
	let left=adminusersortvalue(itema,key)
	let right=adminusersortvalue(itemb,key)
	let result=0
	if(left==null&&right!=null){
		result=1
	}else if(left!=null&&right==null){
		result=-1
	}else if(left!=null&&right!=null){
		if(typeof left=="number"){
			result=left-right
		}else{
			result=String(left).localeCompare(String(right),"zh-Hant")
		}
		if(!ascended){
			result=0-result
		}
	}
	return result
}

// 回傳「過濾（關鍵字 + 預設使用者）+ 排序」後的清單，讓 renderadminuserlist 只負責畫。
function adminuservisiblelist(){
	let keywordinput=domgetid("adminuserkeyword")
	let keyword=""
	if(keywordinput){
		keyword=keywordinput.value.trim()
	}
	let list=[]
	for(let i=0;i<adminuserlist.length;i=i+1){
		let item=adminuserlist[i]
		if(adminusermatchkeyword(item,keyword)&&(showdefaultusered||!adminuserdefaulted(item))){
			list.push(item)
		}
	}
	if(adminusersortkey!=""){
		list.sort(function(itema,itemb){
			return adminusercompare(itema,itemb,adminusersortkey,adminusersortascended)
		})
	}
	return list
}

function renderadminusersortarrow(){
	let arrowlist=document.querySelectorAll(".adminusersortarrow")
	for(let i=0;i<arrowlist.length;i=i+1){
		let arrow=arrowlist[i]
		let mark=""
		if(adminusersortkey!=""&&dataset(arrow,"sortkey")==adminusersortkey){
			mark=" ▲"
			if(!adminusersortascended){
				mark=" ▼"
			}
		}
		arrow.textContent=mark
	}
}

function adminuserpermissioncell(item,selfed){
	// TASK-062：下拉只列 Lv1~Lv5。權限若被設成範圍外的值（例如 0 或 6），
	// select 找不到相符 option 會落到第一個（Lv1），操作者一按儲存就**靜默降權**。
	// 與 TASK-048 同一類問題，這裡比照補一個代表目前值的 option。
	let current=Number(item["permission"])
	if(!(current>=1&&current<=5)){
		current=Number(item["permission"])||0
	}
	let html="<select class=\"adminuserpermissionselect rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-white outline-none transition focus:border-emerald-400\" data-id=\""+escapehtml(item["id"])+"\">"
	if(!(current>=1&&current<=5)){
		html=html+"<option value=\""+current+"\" selected>Lv"+current+adminusertext("permissionoutofrange")+"</option>"
	}
	for(let level=1;level<=5;level=level+1){
		let selecteded=""
		if(level==current){
			selecteded=" selected"
		}
		let disableded=""
		if(selfed&&level<4){
			disableded=" disabled"
		}
		html=html+"<option value=\""+level+"\""+selecteded+disableded+">Lv"+level+"</option>"
	}
	html=html+"</select>"
	return html
}

function adminuserstatuscell(item){
	let status=item["status"]
	let html=""
	if(status=="banned"){
		html="<span class=\"text-xs px-2 py-1 rounded bg-rose-500/15 text-rose-200\">"+escapehtml(adminusertext("statusbanned"))+"</span>"
		if(item["blockreason"]){
			html=html+"<div class=\"mt-1 text-xs text-zinc-500\">"+escapehtml(adminusertext("reasonlabel"))+": "+escapehtml(item["blockreason"])+"</div>"
		}
	}else if(status=="blocked"){
		html="<span class=\"text-xs px-2 py-1 rounded bg-yellow-500/15 text-yellow-200\">"+escapehtml(adminusertext("statusblocked"))+"</span>"
		if(item["blockexpiry"]){
			html=html+"<div class=\"mt-1 text-xs text-zinc-500\">"+escapehtml(adminusertext("expirylabel"))+": "+escapehtml(ptformatdatetime(item["blockexpiry"]))+"</div>"
		}
		if(item["blockreason"]){
			html=html+"<div class=\"mt-1 text-xs text-zinc-500\">"+escapehtml(adminusertext("reasonlabel"))+": "+escapehtml(item["blockreason"])+"</div>"
		}
	}else{
		html="<span class=\"text-xs px-2 py-1 rounded bg-emerald-500/15 text-emerald-200\">"+escapehtml(adminusertext("statusactive"))+"</span>"
	}
	return html
}

function adminuseractioncell(item,selfed){
	let html=""
	if(selfed){
		html="<span class=\"text-xs text-zinc-500\">"+escapehtml(adminusertext("selftag"))+"</span>"
	}else if(item["status"]=="active"){
		html="<div class=\"flex flex-wrap gap-2\">"+
			"<input type=\"button\" class=\"adminuserblockbutton rounded-xl border border-zinc-700 px-3 py-1 text-sm text-zinc-300 transition hover:border-emerald-400\" data-id=\""+escapehtml(item["id"])+"\" value=\""+escapehtml(adminusertext("block"))+"\">"+
			"<input type=\"button\" class=\"adminuserbanbutton rounded-xl border border-zinc-700 px-3 py-1 text-sm text-rose-200 transition hover:border-rose-400\" data-id=\""+escapehtml(item["id"])+"\" value=\""+escapehtml(adminusertext("ban"))+"\">"+
			"</div>"
	}else{
		html="<input type=\"button\" class=\"adminuserunbanbutton rounded-xl border border-zinc-700 px-3 py-1 text-sm text-emerald-200 transition hover:border-emerald-400\" data-id=\""+escapehtml(item["id"])+"\" value=\""+escapehtml(adminusertext("unban"))+"\">"
	}
	return html
}

function renderadminuserlist(){
	let visiblelist=adminuservisiblelist()
	let total=visiblelist.length
	let totalpages=Math.ceil(total/adminuserlimit)
	if(totalpages<1){
		totalpages=1
	}
	// 過濾後頁數變少時把目前頁碼收斂回最後一頁，避免顯示空白表格。
	if(totalpages<adminuserpage){
		adminuserpage=totalpages
	}
	let start=(adminuserpage-1)*adminuserlimit
	let list=visiblelist.slice(start,start+adminuserlimit)
	let html=""
	for(let i=0;i<list.length;i=i+1){
		let item=list[i]
		let selfed=(adminselfid!=null&&item["id"]==adminselfid)
		let selflabel=""
		if(selfed){
			selflabel=" <span class=\"text-xs text-emerald-400\">("+escapehtml(adminusertext("selftag"))+")</span>"
		}
		html=html+"<tr class=\"border-t border-zinc-800\">"+
			"<td class=\"px-4 py-3 text-zinc-200\">"+escapehtml(item["name"]||"")+selflabel+"</td>"+
			"<td class=\"px-4 py-3 font-mono text-xs text-zinc-300\">"+escapehtml(item["playerid"]||"")+"</td>"+
			"<td class=\"px-4 py-3 break-all text-zinc-300\">"+escapehtml(item["email"]||"")+"</td>"+
			"<td class=\"px-4 py-3\">"+adminuserpermissioncell(item,selfed)+"</td>"+
			"<td class=\"px-4 py-3\">"+adminuserstatuscell(item)+"</td>"+
			"<td class=\"px-4 py-3 whitespace-nowrap text-zinc-300\">"+escapehtml(ptformatdatetime(item["createtime"]))+"</td>"+
			"<td class=\"px-4 py-3\">"+adminuseractioncell(item,selfed)+"</td>"+
			"</tr>"
	}
	if(list.length==0){
		html="<tr><td colspan=\"7\" class=\"px-4 py-6 text-center text-zinc-400\">"+escapehtml(adminusertext("empty"))+"</td></tr>"
	}
	innerhtml("#adminusertablebody",html,false)
	onchange(".adminuserpermissionselect",function(element,event){
		changeadminuserpermission(dataset(element,"id"),element.value)
	})
	onclick(".adminuserblockbutton",function(element,event){
		openadminuserblock(dataset(element,"id"))
	})
	onclick(".adminuserbanbutton",function(element,event){
		openadminuserban(dataset(element,"id"))
	})
	onclick(".adminuserunbanbutton",function(element,event){
		unbanadminuser(dataset(element,"id"))
	})
	renderptpagination("adminuserpagination",{
		"page": adminuserpage,
		"limit": adminuserlimit,
		"total": total,
		"totalpages": totalpages,
		"hasprev": 1<adminuserpage,
		"hasnext": adminuserpage<totalpages
	},function(pagevalue){
		adminuserpage=pagevalue
		renderadminuserlist()
	})
}

function changeadminuserpermission(userid,permission){
	if(adminselfid!=null&&userid==adminselfid&&Number(permission)<4){
		pttoast(adminusertext("selfprotect"),"error")
		renderadminuserlist()
	}else{
		ajax("PUT",AJAXURL+"edituserpermission/"+userid,function(event,data){
			if(data["success"]){
				pttoastsuccess(adminusertext("permissionupdated"))
				loadadminuserlist()
			}else{
				pttoast(pterror(data["data"]||adminusertext("actionfail")),"error")
				renderadminuserlist()
			}
		},str({
			"permission": String(permission)
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	}
}

let adminuserblocktargetid=null
let adminuserbantargetid=null

function openadminuserblock(userid){
	if(adminselfid!=null&&userid==adminselfid){
		pttoast(adminusertext("selfprotect"),"error")
	}else{
		adminuserblocktargetid=userid
		let reason=domgetid("adminuserblockreason")
		if(reason){
			reason.value=""
		}
		let duration=domgetid("adminuserblockduration")
		if(duration){
			duration.selectedIndex=0
		}
		let modal=domgetid("adminuserblockmodal")
		if(modal){
			modal.classList.remove("hidden")
		}
	}
}

function closeadminuserblock(){
	let modal=domgetid("adminuserblockmodal")
	if(modal){
		modal.classList.add("hidden")
	}
}

function submitadminuserblock(){
	let reasoninput=domgetid("adminuserblockreason")
	let reason=reasoninput?reasoninput.value.trim():""
	if(!reason){
		pttoast(adminusertext("reasonrequired"),"error")
	}else{
		let durationselect=domgetid("adminuserblockduration")
		let hours=durationselect?Number(durationselect.value):0
		if(!hours){
			hours=1
		}
		ajax("POST",AJAXURL+"blockuser/"+adminuserblocktargetid,function(event,data){
			if(data["success"]){
				pttoastsuccess(adminusertext("blocksuccess"))
				closeadminuserblock()
				loadadminuserlist()
			}else{
				pttoast(pterror(data["data"]||adminusertext("actionfail")),"error")
			}
		},str({
			"reason": reason,
			"blocktime": adminuserexpiry(hours)
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	}
}

function openadminuserban(userid){
	if(adminselfid!=null&&userid==adminselfid){
		pttoast(adminusertext("selfprotect"),"error")
	}else{
		adminuserbantargetid=userid
		let reason=domgetid("adminuserbanreason")
		if(reason){
			reason.value=""
		}
		let modal=domgetid("adminuserbanmodal")
		if(modal){
			modal.classList.remove("hidden")
		}
	}
}

function closeadminuserban(){
	let modal=domgetid("adminuserbanmodal")
	if(modal){
		modal.classList.add("hidden")
	}
}

function submitadminuserban(){
	let reasoninput=domgetid("adminuserbanreason")
	let reason=reasoninput?reasoninput.value.trim():""
	if(!reason){
		pttoast(adminusertext("reasonrequired"),"error")
	}else{
		ajax("POST",AJAXURL+"banuser/"+adminuserbantargetid,function(event,data){
			if(data["success"]){
				pttoastsuccess(adminusertext("bansuccess"))
				closeadminuserban()
				loadadminuserlist()
			}else{
				pttoast(pterror(data["data"]||adminusertext("actionfail")),"error")
			}
		},str({
			"reason": reason
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	}
}

function unbanadminuser(userid){
	ptconfirm(adminusertext("unbanconfirm"),function(okayed){
		if(okayed){
			ajax("POST",AJAXURL+"unbanuser/"+userid,function(event,data){
				if(data["success"]){
					pttoastsuccess(adminusertext("unbansuccess"))
					loadadminuserlist()
				}else{
					pttoast(pterror(data["data"]||adminusertext("actionfail")),"error")
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		}
	})
}

onclick("#searchadminuser",function(element,event){
	adminuserpage=1
	renderadminuserlist()
})

onclick("#reloadadminuser",function(element,event){
	adminuserpage=1
	loadadminuserlist()
})

onclick("#showadminuserdefault",function(element,event){
	showdefaultusered=!showdefaultusered
	adminuserpage=1
	if(showdefaultusered){
		element.classList.remove("bg-zinc-700","hover:bg-zinc-600")
		element.classList.add("bg-emerald-600","hover:bg-emerald-700")
	}else{
		element.classList.remove("bg-emerald-600","hover:bg-emerald-700")
		element.classList.add("bg-zinc-700","hover:bg-zinc-600")
	}
	renderadminuserlist()
})

onclick(".adminusersortheader",function(element,event){
	let sortkey=dataset(element,"sortkey")
	if(sortkey){
		if(adminusersortkey==sortkey){
			adminusersortascended=!adminusersortascended
		}else{
			adminusersortkey=sortkey
			adminusersortascended=true
		}
		// 排序改變後停在原頁碼會看到不相干的資料，一律回到第 1 頁。
		adminuserpage=1
		renderadminusersortarrow()
		renderadminuserlist()
	}
})

onclick("#closeadminuserblock",function(element,event){
	closeadminuserblock()
})

onclick("#canceladminuserblock",function(element,event){
	closeadminuserblock()
})

onclick("#submitadminuserblock",function(element,event){
	submitadminuserblock()
})

onclick("#adminuserblockmodal",function(element,event){
	if(event.target==element){
		closeadminuserblock()
	}
})

onclick("#closeadminuserban",function(element,event){
	closeadminuserban()
})

onclick("#canceladminuserban",function(element,event){
	closeadminuserban()
})

onclick("#submitadminuserban",function(element,event){
	submitadminuserban()
})

onclick("#adminuserbanmodal",function(element,event){
	if(event.target==element){
		closeadminuserban()
	}
})

let adminuserkeywordinput=domgetid("adminuserkeyword")
if(adminuserkeywordinput){
	adminuserkeywordinput.onkeydown=function(event){
		if(event.key=="Enter"){
			adminuserpage=1
			renderadminuserlist()
		}
	}
}

let adminuserlimitselect=domgetid("adminuserlimitselect")
if(adminuserlimitselect){
	adminuserlimit=Number(adminuserlimitselect.value)||20
	adminuserlimitselect.onchange=function(){
		adminuserlimit=Number(adminuserlimitselect.value)||20
		adminuserpage=1
		renderadminuserlist()
	}
}

applyadminuserlanguage()

// API 紀錄表頭排序：後端分頁，所以改變排序要回第 1 頁並重新請求
ptbindsort("#adminloghead",adminlogsortstate,function(){
	adminlogpage=1
	ptsortarrow("#adminloghead",adminlogsortstate["key"],adminlogsortstate["ascended"])
	loadadminlog()
})
