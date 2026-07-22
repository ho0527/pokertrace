let contactpage=1
let contactlimit=20

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let leaveguard=bindleaveguard()

function contactadmintext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["contactadminpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["contactadminpage"][key]||key
}

function applycontactadminlanguage(){
	document.title=contactadmintext("title")+" - PokerTrace"
	let heading=domgetid("contactadminheading")
	if(heading){
		heading.textContent=contactadmintext("heading")
	}
	let filter=domgetid("contactstatusfilter")
	if(filter){
		filter.setAttribute("aria-label",contactadmintext("filterlabel"))
		if(filter.options[0]){
			filter.options[0].text=contactadmintext("allstatus")
		}
		if(filter.options[1]){
			filter.options[1].text=contactadmintext("new")
		}
		if(filter.options[2]){
			filter.options[2].text=contactadmintext("read")
		}
		if(filter.options[3]){
			filter.options[3].text=contactadmintext("done")
		}
	}
	let reload=domgetid("reloadcontactmessages")
	if(reload){
		reload.value=contactadmintext("reload")
	}
}

function statuslabel(value){
	if(value=="read"){
		return contactadmintext("read")
	}
	if(value=="done"){
		return contactadmintext("done")
	}
	return contactadmintext("new")
}

function statusclass(value){
	if(value=="done"){
		return "bg-emerald-500/20 text-emerald-200"
	}
	if(value=="read"){
		return "bg-blue-500/20 text-blue-200"
	}
	return "bg-yellow-500/20 text-yellow-200"
}

function rendercontactmessages(row){
	let html=""
	for(let i=0;i<row.length;i=i+1){
		let item=row[i]
		html=html+`
			<div class="bg-zinc-900 border border-zinc-800 rounded p-5">
				<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<div class="font-bold text-lg">${escapehtml(item["subject"]||contactadmintext("nosubject"))}</div>
							<div class="text-xs px-2 py-1 rounded ${statusclass(item["status"])}">${statuslabel(item["status"])}</div>
						</div>
						<div class="text-sm text-zinc-400 mt-2">
							${escapehtml(item["name"])} · ${escapehtml(item["email"])} · ${escapehtml(ptformatdatetime(item["createtime"]))}
						</div>
						<div class="text-xs text-zinc-500 mt-1">
							${item["username"]?(contactadmintext("linkeduser")+escapehtml(item["username"])+" / "+escapehtml(item["userplayerid"])):contactadmintext("unlinkeduser")}
						</div>
					</div>
					<select class="contactstatusselect bg-zinc-800 border border-zinc-700 rounded px-3 py-2" data-id="${item["id"]}">
						<option value="new" ${item["status"]=="new"?"selected":""}>${contactadmintext("new")}</option>
						<option value="read" ${item["status"]=="read"?"selected":""}>${contactadmintext("read")}</option>
						<option value="done" ${item["status"]=="done"?"selected":""}>${contactadmintext("done")}</option>
					</select>
				</div>
				<div class="mt-4 whitespace-pre-wrap text-zinc-200 leading-7">${escapehtml(item["message"])}</div>
				${item["replymessage"]?`
					<div class="mt-4 border border-emerald-500/30 bg-emerald-500/10 rounded p-4">
						<div class="text-sm font-bold text-emerald-200">${contactadmintext("replied")}</div>
						<div class="text-xs text-zinc-400 mt-1">${escapehtml(item["replytime"]||"")}</div>
						<div class="text-sm text-zinc-300 mt-2">${escapehtml(item["replysubject"]||"")}</div>
						<div class="mt-2 whitespace-pre-wrap text-zinc-100 leading-7">${escapehtml(item["replymessage"])}</div>
					</div>
				`:""}
				<div class="mt-4 border border-zinc-800 bg-zinc-950 rounded p-4">
					<div class="font-bold">${contactadmintext("replyto")} ${escapehtml(item["email"])}</div>
					<input class="contactreplysubject w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 mt-3" data-id="${item["id"]}" maxlength="150" value="${escapehtml(item["subject"]?(contactadmintext("replysubjectprefix")+item["subject"]):contactadmintext("replysubjectdefault")).replace(/"/g,"&quot;")}">
					<textarea class="contactreplymessage w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 mt-3 min-h-28" data-id="${item["id"]}" maxlength="5000" placeholder="${contactadmintext("replyplaceholder")}"></textarea>
					<div class="flex justify-end mt-3">
						<input type="button" class="contactreplybtn bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-4 py-2 rounded" data-id="${item["id"]}" value="${contactadmintext("replysend")}">
					</div>
				</div>
			</div>
		`
	}
	if(!html){
		html=`<div class="bg-zinc-900 border border-zinc-800 rounded p-6 text-zinc-400">${contactadmintext("empty")}</div>`
	}
	innerhtml("#contactmessageadminlist",html,false)
	bindstatusselect()
	bindreplybuttons()
}

function renderpagination(pagination){
	renderptpagination("contactmessagepagination",pagination,function(pagevalue){
		contactpage=pagevalue
		loadcontactmessages()
	})
}

function loadcontactmessages(){
	let filter=domgetid("contactstatusfilter")
	let statusvalue=""
	if(filter){
		statusvalue=filter.value
	}
	let url=AJAXURL+"getcontactmessages?page="+contactpage+"&limit="+contactlimit
	if(statusvalue){
		url=url+"&status="+encodeURIComponent(statusvalue)
	}
	ajax("GET",url,function(event,data){
		if(data["success"]){
			rendercontactmessages(data["data"]["messages"]||[])
			renderpagination(data["data"]["pagination"]||{})
		}else{
			pttoast(pterror(data["data"]||contactadmintext("loadfail")),"error")
			if(data["data"]=="ERROR_no_permission"||data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
				setTimeout(function(){
					href("./")
				},700)
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#contactmessageadminlist"
	})
}

function bindstatusselect(){
	let elements=document.querySelectorAll(".contactstatusselect")
	for(let i=0;i<elements.length;i=i+1){
		elements[i].onchange=function(){
			let element=this
			element.disabled=true
			ajax("PUT",AJAXURL+"editcontactmessage/"+element.dataset.id,function(event,data){
				element.disabled=false
				if(data["success"]){
					pttoast(contactadmintext("statussaved"),"success")
					loadcontactmessages()
				}else{
					pttoast(pterror(data["data"]||contactadmintext("statussavefail")),"error")
				}
			},str({
				"status": element.value
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			],{
				loadingtarget: "#contactmessageadminlist"
			})
		}
	}
}

function findreplyfield(selector,id){
	let elements=document.querySelectorAll(selector)
	for(let i=0;i<elements.length;i=i+1){
		if(elements[i].dataset.id==id){
			return elements[i]
		}
	}
	return null
}

function bindreplybuttons(){
	let elements=document.querySelectorAll(".contactreplybtn")
	for(let i=0;i<elements.length;i=i+1){
		elements[i].onclick=function(){
			let element=this
			let id=element.dataset.id
			let subject=findreplyfield(".contactreplysubject",id)
			let message=findreplyfield(".contactreplymessage",id)
			if(!message||!message.value.trim()){
				pttoast(contactadmintext("replyrequired"),"warning")
				return
			}
			element.disabled=true
			element.value=contactadmintext("replysending")
			ajax("POST",AJAXURL+"replycontactmessage/"+id,function(event,data){
				element.disabled=false
				element.value=contactadmintext("replysend")
				if(data["success"]){
					leaveguard.clear()
					pttoast(contactadmintext("replysuccess"),"success")
					loadcontactmessages()
				}else{
					pttoast(pterror(data["data"]||contactadmintext("replyfail")),"error")
				}
			},str({
				"subject": subject?subject.value:"",
				"message": message.value
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			],{
				loadingtarget: "#contactmessageadminlist"
			})
		}
	}
}

let statusfilter=domgetid("contactstatusfilter")
if(statusfilter){
	statusfilter.onchange=function(){
		contactpage=1
		loadcontactmessages()
	}
}

onclick("#reloadcontactmessages",function(element,event){
	loadcontactmessages()
})

applycontactadminlanguage()
loadcontactmessages()
