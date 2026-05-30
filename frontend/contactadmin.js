let contactpage=1
let contactlimit=20

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function statuslabel(value){
	if(value=="read"){
		return "已讀"
	}
	if(value=="done"){
		return "已處理"
	}
	return "新訊息"
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

function escapehtml(value){
	let div=document.createElement("div")
	div.textContent=value||""
	return div.innerHTML
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
							<div class="font-bold text-lg">${escapehtml(item["subject"]||"未填主旨")}</div>
							<div class="text-xs px-2 py-1 rounded ${statusclass(item["status"])}">${statuslabel(item["status"])}</div>
						</div>
						<div class="text-sm text-zinc-400 mt-2">
							${escapehtml(item["name"])} · ${escapehtml(item["email"])} · ${escapehtml(item["createtime"])}
						</div>
						<div class="text-xs text-zinc-500 mt-1">
							${item["username"]?("登入使用者："+escapehtml(item["username"])+" / "+escapehtml(item["userplayerid"])):"未綁定登入使用者"}
						</div>
					</div>
					<select class="contactstatusselect bg-zinc-800 border border-zinc-700 rounded px-3 py-2" data-id="${item["id"]}">
						<option value="new" ${item["status"]=="new"?"selected":""}>新訊息</option>
						<option value="read" ${item["status"]=="read"?"selected":""}>已讀</option>
						<option value="done" ${item["status"]=="done"?"selected":""}>已處理</option>
					</select>
				</div>
				<div class="mt-4 whitespace-pre-wrap text-zinc-200 leading-7">${escapehtml(item["message"])}</div>
				${item["replymessage"]?`
					<div class="mt-4 border border-emerald-500/30 bg-emerald-500/10 rounded p-4">
						<div class="text-sm font-bold text-emerald-200">已回覆</div>
						<div class="text-xs text-zinc-400 mt-1">${escapehtml(item["replytime"]||"")}</div>
						<div class="text-sm text-zinc-300 mt-2">${escapehtml(item["replysubject"]||"")}</div>
						<div class="mt-2 whitespace-pre-wrap text-zinc-100 leading-7">${escapehtml(item["replymessage"])}</div>
					</div>
				`:""}
				<div class="mt-4 border border-zinc-800 bg-zinc-950 rounded p-4">
					<div class="font-bold">回覆到 ${escapehtml(item["email"])}</div>
					<input class="contactreplysubject w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 mt-3" data-id="${item["id"]}" maxlength="150" value="${escapehtml(item["subject"]?("Re: "+item["subject"]):"Re: PokerTrace 聯絡我們")}">
					<textarea class="contactreplymessage w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 mt-3 min-h-28" data-id="${item["id"]}" maxlength="5000" placeholder="輸入要回覆給使用者的內容"></textarea>
					<div class="flex justify-end mt-3">
						<button class="contactreplybtn bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-4 py-2 rounded" data-id="${item["id"]}">寄出回覆</button>
					</div>
				</div>
			</div>
		`
	}
	if(!html){
		html=`<div class="bg-zinc-900 border border-zinc-800 rounded p-6 text-zinc-400">目前沒有聯絡訊息</div>`
	}
	innerhtml("#contactmessageadminlist",html,false)
	bindstatusselect()
	bindreplybuttons()
}

function renderpagination(pagination){
	let total=Number(pagination["total"]||0)
	let pages=Math.ceil(total/contactlimit)
	let html=""
	if(1<contactpage){
		html=html+`<button class="contactpagebtn bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-3 py-2" data-page="${contactpage-1}">上一頁</button>`
	}
	html=html+`<div class="text-zinc-400 px-3 py-2">第 ${contactpage} 頁 / 共 ${pages||1} 頁</div>`
	if(contactpage<pages){
		html=html+`<button class="contactpagebtn bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-3 py-2" data-page="${contactpage+1}">下一頁</button>`
	}
	innerhtml("#contactmessagepagination",html,false)
	onclick(".contactpagebtn",function(element,event){
		contactpage=Number(dataset(element,"page")||1)
		loadcontactmessages()
	})
}

function loadcontactmessages(){
	let filter=document.getElementById("contactstatusfilter")
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
			pttoast(pterror(data["data"]||"讀取失敗"),"error")
			if(data["data"]=="ERROR_no_permission"||data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
				setTimeout(function(){
					href("./")
				},700)
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
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
					pttoast("已更新狀態","success")
					loadcontactmessages()
				}else{
					pttoast(pterror(data["data"]||"更新失敗"),"error")
				}
			},str({
				"status": element.value
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
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
				pttoast("請輸入回覆內容","warning")
				return
			}
			element.disabled=true
			element.textContent="寄出中..."
			ajax("POST",AJAXURL+"replycontactmessage/"+id,function(event,data){
				element.disabled=false
				element.textContent="寄出回覆"
				if(data["success"]){
					pttoast("已寄出回覆","success")
					loadcontactmessages()
				}else{
					pttoast(pterror(data["data"]||"寄出失敗"),"error")
				}
			},str({
				"subject": subject?subject.value:"",
				"message": message.value
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		}
	}
}

let statusfilter=document.getElementById("contactstatusfilter")
if(statusfilter){
	statusfilter.onchange=function(){
		contactpage=1
		loadcontactmessages()
	}
}

onclick("#reloadcontactmessages",function(element,event){
	loadcontactmessages()
})

loadcontactmessages()
