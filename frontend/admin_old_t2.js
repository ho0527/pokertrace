if(!weblsget(WEBLSNAME+"signin")){
	href("./")
}

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
	adminusersetplaceholder("adminuserkeyword","searchplaceholder")
	adminusersetvalue("searchadminuser","search")
	adminusersetvalue("reloadadminuser","reload")
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

function loadadminself(){
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(data["success"]){
			adminselfid=data["data"]["id"]
			renderadminuserlist(adminuserlist)
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function loadadminuserlist(){
	ajax("GET",AJAXURL+"getuserlist",function(event,data){
		if(data["success"]){
			adminuserlist=data["data"]||[]
			renderadminuserlist(adminuserlist)
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

function adminuserpermissioncell(item,selfed){
	let current=Number(item["permission"])||1
	let html="<select class=\"adminuserpermissionselect rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-white outline-none transition focus:border-emerald-400\" data-id=\""+escapehtml(item["id"])+"\">"
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

function renderadminuserlist(list){
	let keywordinput=domgetid("adminuserkeyword")
	let keyword=keywordinput?keywordinput.value.trim():""
	let html=""
	let shown=0
	for(let i=0;i<list.length;i=i+1){
		let item=list[i]
		if(adminusermatchkeyword(item,keyword)){
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
			shown=shown+1
		}
	}
	if(shown==0){
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
}

function changeadminuserpermission(userid,permission){
	if(adminselfid!=null&&userid==adminselfid&&Number(permission)<4){
		pttoast(adminusertext("selfprotect"),"error")
		renderadminuserlist(adminuserlist)
	}else{
		ajax("PUT",AJAXURL+"edituserpermission/"+userid,function(event,data){
			if(data["success"]){
				pttoastsuccess(adminusertext("permissionupdated"))
				loadadminuserlist()
			}else{
				pttoast(pterror(data["data"]||adminusertext("actionfail")),"error")
				renderadminuserlist(adminuserlist)
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
	renderadminuserlist(adminuserlist)
})

onclick("#reloadadminuser",function(element,event){
	loadadminuserlist()
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
			renderadminuserlist(adminuserlist)
		}
	}
}

applyadminuserlanguage()
