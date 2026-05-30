"use strict"

let state={}
let sessionid=new URLSearchParams(location.search).get("sessionid")
let savebusy=false
let sessionchips=[]

if(!sessionid){
	location.href="sessionlist.html"
}

function $(id){
	return document.getElementById(id)
}

function fmt(value){
	return Math.round(value).toLocaleString()
}

function gettoken(){
	let token=localStorage.getItem(WEBLSNAME+"token")
	if(!token){
		return null
	}
	try{
		return JSON.parse(token)
	}catch(error){
		return token
	}
}

function showtoast(message,type){
	let box=$("toast")
	box.textContent=message
	box.className="toast show"+(type?" "+type:"")
	clearTimeout(box.tm)
	box.tm=setTimeout(function(){
		box.classList.remove("show")
	},1800)
}

function structconfirm(message,done){
	let old=document.getElementById("structConfirmBox")
	if(old){
		old.remove()
	}
	let box=document.createElement("div")
	box.id="structConfirmBox"
	box.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px"
	box.innerHTML=`
		<div style="background:#111;border:1px solid #333;border-radius:10px;max-width:360px;width:100%;padding:18px;color:#fff">
			<div style="font-weight:800;font-size:18px;margin-bottom:10px">確認操作</div>
			<div style="font-size:14px;color:#ddd;line-height:1.6">${message}</div>
			<div style="display:flex;gap:8px;margin-top:16px">
				<button data-struct-confirm="cancel" style="flex:1;background:#27272a;color:#fff;border:0;border-radius:8px;padding:10px">取消</button>
				<button data-struct-confirm="ok" style="flex:1;background:#059669;color:#fff;border:0;border-radius:8px;padding:10px">確認</button>
			</div>
		</div>
	`
	document.body.appendChild(box)
	let buttons=box.querySelectorAll("[data-struct-confirm]")
	for(let i=0;i<buttons.length;i=i+1){
		buttons[i].addEventListener("click",function(){
			let action=this.dataset.structConfirm
			box.remove()
			if(action=="ok"){
				done()
			}
		})
	}
}

function updatesync(ok,text){
	let dot=$("syncDot")
	let label=$("syncText")
	if(!ok){
		dot.classList.add("off")
	}else{
		dot.classList.remove("off")
	}
	label.textContent=text
}

function setenabled(enabled){
	let list=document.querySelectorAll("button,input,select,textarea")
	for(let i=0;i<list.length;i=i+1){
		list[i].disabled=!enabled
	}
}

function totallevels(){
	let count=0
	for(let i=0;i<state.schedule.length;i=i+1){
		if(state.schedule[i].type=="level"){
			count=count+1
		}
	}
	return count
}

function levelnumof(index){
	let count=0
	for(let i=0;i<=index;i=i+1){
		if(state.schedule[i]&&state.schedule[i].type=="level"){
			count=count+1
		}
	}
	return count
}

function structlevelnumber(index){
	return levelnumof(index)
}

function chipraiseoptions(selected){
	let html=`<option value="">不升</option>`
	for(let i=0;i<sessionchips.length;i=i+1){
		let chip=sessionchips[i]
		html=html+`<option value="${chip["value"]}" ${String(selected)==String(chip["value"])?"selected":""}>${chip["value"]}</option>`
	}
	return html
}

function renderheader(){
	let current=state.schedule[state.currentIndex]
	$("tournName").textContent=state.tournName||"編輯賽程結構"
	$("tournSub").textContent=state.subtitle||"STRUCTURE EDIT"
	$("hLv").textContent=current?levelnumof(state.currentIndex):"—"
	$("hLvMax").textContent=totallevels()
	if(state.regClosed){
		$("regBadge").className="reg-badge reg-closed"
		$("regBadge").textContent="REG CLOSED"
	}else{
		$("regBadge").className="reg-badge reg-open"
		$("regBadge").textContent="REG OPEN"
	}
}

function readstructeditor(){
	let rows=document.querySelectorAll("[data-struct-row]")
	let newschedule=[]
	for(let i=0;i<rows.length;i=i+1){
		let row=rows[i]
		let type=row.querySelector("[data-edit-k=\"type\"]").value
		let item={
			type: type,
			dur: parseInt(row.querySelector("[data-edit-k=\"dur\"]").value,10)||1
		}
		if(type=="level"){
			item.sb=parseInt(row.querySelector("[data-edit-k=\"sb\"]").value,10)||0
			item.bb=parseInt(row.querySelector("[data-edit-k=\"bb\"]").value,10)||0
			item.ante=parseInt(row.querySelector("[data-edit-k=\"ante\"]").value,10)||0
		}else{
			item.chipRaiseValues=[]
			let chips=row.querySelectorAll(".chipraiseinput")
			for(let j=0;j<chips.length;j=j+1){
				let chipvalue=parseInt(chips[j].value,10)||0
				if(chipvalue&&item.chipRaiseValues.indexOf(chipvalue)==-1){
					item.chipRaiseValues.push(chipvalue)
				}
			}
		}
		if(row.querySelector("[data-edit-k=\"reg\"]").checked){
			item.regCloseAfter=true
		}
		newschedule.push(item)
	}
	if(0<newschedule.length){
		state.schedule=newschedule
	}
}

function cleanstructitem(item){
	let type=item["type"]||"level"
	let output={
		type: type,
		dur: parseInt(item["dur"],10)||1
	}
	if(type=="level"){
		output.sb=parseInt(item["sb"],10)||0
		output.bb=parseInt(item["bb"],10)||0
		output.ante=parseInt(item["ante"],10)||0
	}else{
		output.chipRaiseValues=[]
		let chips=item["chipRaiseValues"]||[]
		for(let i=0;i<chips.length&&i<3;i=i+1){
			let chipvalue=parseInt(chips[i],10)||0
			if(chipvalue&&output.chipRaiseValues.indexOf(chipvalue)==-1){
				output.chipRaiseValues.push(chipvalue)
			}
		}
	}
	if(item["regCloseAfter"]){
		output.regCloseAfter=true
	}
	return output
}

function cleanstructlist(input){
	let source=input
	if(input&&input["schedule"]){
		source=input["schedule"]
	}
	if(!Array.isArray(source)){
		return null
	}
	let output=[]
	for(let i=0;i<source.length;i=i+1){
		output.push(cleanstructitem(source[i]))
	}
	return output
}

function exportstructtext(){
	readstructeditor()
	let data={
		version: 1,
		type: "poker-clock-structure",
		schedule: state.schedule
	}
	return JSON.stringify(data,null,4)
}

function importstructtext(text){
	let parsed=null
	try{
		parsed=JSON.parse(text)
	}catch(error){
		showtoast("JSON 格式錯誤","err")
		return false
	}
	let schedule=cleanstructlist(parsed)
	if(!schedule||schedule.length==0){
		showtoast("找不到可匯入的盲注結構","err")
		return false
	}
	state.schedule=schedule
	if(state.currentIndex>=state.schedule.length){
		state.currentIndex=state.schedule.length-1
	}
	buildstructeditor()
	showtoast("已匯入 "+state.schedule.length+" 個項目")
	return true
}

function downloadstructfile(){
	let text=exportstructtext()
	let blob=new Blob([text],{type:"application/json"})
	let url=URL.createObjectURL(blob)
	let link=document.createElement("a")
	link.href=url
	link.download="blindstructure_"+Date.now()+".json"
	document.body.appendChild(link)
	link.click()
	link.remove()
	URL.revokeObjectURL(url)
}

function buildstructeditor(){
	renderheader()
	let box=$("structEditList")
	let html=""
	for(let i=0;i<state.schedule.length;i=i+1){
		let item=state.schedule[i]
		let isbreak=item.type=="break"
		let label=isbreak?"B":"L"+structlevelnumber(i)
		let chipraises=item.chipRaiseValues||[]
		let chipraisehtml=`
			<select class="txt chipraiseinput">${chipraiseoptions(chipraises[0]||"")}</select>
			<select class="txt chipraiseinput">${chipraiseoptions(chipraises[1]||"")}</select>
			<select class="txt chipraiseinput">${chipraiseoptions(chipraises[2]||"")}</select>
		`
		html=html+`
			<div class="struct-table-row ${isbreak?"is-break":""}" data-struct-row="${i}">
				<div class="struct-index">${label}</div>
				<select class="struct-type" data-edit-k="type">
					<option value="level" ${isbreak?"":"selected"}>Level</option>
					<option value="break" ${isbreak?"selected":""}>休息</option>
				</select>
				${isbreak?chipraisehtml:`<input class="txt" data-edit-k="sb" type="number" min="0" value="${item.sb}" inputmode="numeric" placeholder="-">
				<input class="txt" data-edit-k="bb" type="number" min="0" value="${item.bb}" inputmode="numeric" placeholder="-">
				<input class="txt" data-edit-k="ante" type="number" min="0" value="${item.ante}" inputmode="numeric" placeholder="-">`}
				<input class="txt" data-edit-k="dur" type="number" min="1" value="${item.dur}" inputmode="numeric">
				<input class="struct-check" data-edit-k="reg" type="checkbox" ${item.regCloseAfter?"checked":""}>
				<div class="struct-actions">
					<button class="ico-btn" data-up="${i}" title="上移">↑</button>
					<button class="ico-btn" data-down="${i}" title="下移">↓</button>
					<button class="ico-btn" data-copy="${i}" title="複製">⧉</button>
					<button class="ico-btn del" data-del="${i}" title="刪除">×</button>
				</div>
			</div>
		`
	}
	box.innerHTML=html
	let typelist=box.querySelectorAll("[data-edit-k=\"type\"]")
	for(let i=0;i<typelist.length;i=i+1){
		typelist[i].addEventListener("change",function(){
			readstructeditor()
			buildstructeditor()
		})
	}
	let uplist=box.querySelectorAll("[data-up]")
	for(let i=0;i<uplist.length;i=i+1){
		uplist[i].addEventListener("click",function(){
			readstructeditor()
			let index=parseInt(this.dataset.up,10)
			if(0<index){
				let temp=state.schedule[index-1]
				state.schedule[index-1]=state.schedule[index]
				state.schedule[index]=temp
				buildstructeditor()
			}
		})
	}
	let downlist=box.querySelectorAll("[data-down]")
	for(let i=0;i<downlist.length;i=i+1){
		downlist[i].addEventListener("click",function(){
			readstructeditor()
			let index=parseInt(this.dataset.down,10)
			if(index<state.schedule.length-1){
				let temp=state.schedule[index+1]
				state.schedule[index+1]=state.schedule[index]
				state.schedule[index]=temp
				buildstructeditor()
			}
		})
	}
	let copylist=box.querySelectorAll("[data-copy]")
	for(let i=0;i<copylist.length;i=i+1){
		copylist[i].addEventListener("click",function(){
			readstructeditor()
			let index=parseInt(this.dataset.copy,10)
			let item=JSON.parse(JSON.stringify(state.schedule[index]))
			state.schedule.splice(index+1,0,item)
			buildstructeditor()
		})
	}
	let dellist=box.querySelectorAll("[data-del]")
	for(let i=0;i<dellist.length;i=i+1){
		dellist[i].addEventListener("click",function(){
			readstructeditor()
			let index=parseInt(this.dataset.del,10)
			if(state.schedule.length<=1){
				showtoast("至少要有一項","err")
				return
			}
			structconfirm("刪除此項？",function(){
				state.schedule.splice(index,1)
				if(state.currentIndex>=state.schedule.length){
					state.currentIndex=state.schedule.length-1
				}
				buildstructeditor()
			})
		})
	}
}

function loadtimer(){
	updatesync(false,"讀取中")
	setenabled(false)
	fetch(AJAXURL+"gettimer/"+sessionid).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data.success&&data.data&&data.data.state){
			state=data.data.state
			sessionchips=state.chips||[]
			buildstructeditor()
			updatesync(true,"已同步")
			setenabled(true)
		}else{
			updatesync(false,"讀取失敗")
			showtoast("讀取失敗","err")
		}
	}).catch(function(){
		updatesync(false,"網路不佳")
		showtoast("網路不佳，請重新嘗試","err")
	})
}

function savestruct(){
	if(savebusy){
		return
	}
	let token=gettoken()
	if(!token){
		showtoast("請重新登入","err")
		return
	}
	readstructeditor()
	if(state.currentIndex>=state.schedule.length){
		state.currentIndex=state.schedule.length-1
	}
	savebusy=true
	setenabled(false)
	updatesync(false,"儲存中")
	fetch(AJAXURL+"savetimer/"+sessionid,{
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer "+token
		},
		body: JSON.stringify({
			action: "struct-edit",
			state: {
				schedule: state.schedule,
				currentIndex: state.currentIndex
			}
		})
	}).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data.success&&data.data){
			state=data.data
			buildstructeditor()
			showtoast("結構已儲存")
			updatesync(true,"已同步")
		}else{
			let message=data&&data.data?data.data:"儲存失敗"
			showtoast(message,"err")
			updatesync(false,"儲存失敗")
		}
	}).catch(function(){
		showtoast("網路不佳，請重新嘗試","err")
		updatesync(false,"網路不佳")
	}).finally(function(){
		savebusy=false
		setenabled(true)
	})
}

$("btnBack").addEventListener("click",function(){
	location.href="control.html?sessionid="+encodeURIComponent(sessionid)
})

$("btnView").addEventListener("click",function(){
	location.href="structure.html?sessionid="+encodeURIComponent(sessionid)
})

$("btnSaveStruct").addEventListener("click",function(){
	savestruct()
})

$("btnAddLevel").addEventListener("click",function(){
	readstructeditor()
	let lastlv={ sb: 100, bb: 200, ante: 200, dur: 20 }
	for(let i=state.schedule.length-1;i>=0;i=i-1){
		if(state.schedule[i].type=="level"){
			lastlv=state.schedule[i]
			break
		}
	}
	state.schedule.push({ type: "level", sb: Math.round(lastlv.sb*1.5), bb: Math.round(lastlv.bb*1.5), ante: Math.round(lastlv.ante*1.5), dur: lastlv.dur })
	buildstructeditor()
})

$("btnAddBreak").addEventListener("click",function(){
	readstructeditor()
	state.schedule.push({ type: "break", dur: state.defaultBreakDur||10 })
	buildstructeditor()
})

$("btnExportStruct").addEventListener("click",function(){
	let box=$("structJsonText")
	box.style.display="block"
	box.value=exportstructtext()
	box.focus()
	box.select()
	downloadstructfile()
	showtoast("已匯出並下載 JSON")
})

$("btnImportStruct").addEventListener("click",function(){
	let box=$("structJsonText")
	if(box.style.display=="none"||box.style.display==""){
		box.style.display="block"
		box.focus()
		return
	}
	if(importstructtext(box.value)){
		box.value=exportstructtext()
	}
})

$("structFileIn").addEventListener("change",function(){
	let file=this.files&&this.files[0]
	if(!file){
		return
	}
	let reader=new FileReader()
	reader.onload=function(){
		let text=String(reader.result||"")
		$("structJsonText").style.display="block"
		$("structJsonText").value=text
		importstructtext(text)
	}
	reader.readAsText(file)
	this.value=""
})

$("btnApplyLevelDur").addEventListener("click",function(){
	readstructeditor()
	let dur=parseInt($("structLevelDur").value,10)
	if(isNaN(dur)||dur<=0){
		showtoast("請輸入正確 Level 時長","err")
		return
	}
	for(let i=0;i<state.schedule.length;i=i+1){
		if(state.schedule[i].type=="level"){
			state.schedule[i].dur=dur
		}
	}
	buildstructeditor()
})

$("btnApplyBreakDur").addEventListener("click",function(){
	readstructeditor()
	let dur=parseInt($("structBreakDur").value,10)
	if(isNaN(dur)||dur<=0){
		showtoast("請輸入正確休息時長","err")
		return
	}
	for(let i=0;i<state.schedule.length;i=i+1){
		if(state.schedule[i].type=="break"){
			state.schedule[i].dur=dur
		}
	}
	buildstructeditor()
})

loadtimer()
