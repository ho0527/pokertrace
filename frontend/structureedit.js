"use strict"

let state={}
let sessionid=new URLSearchParams(location.search).get("sessionid")
let savebusy=false
let sessionchips=[]
let leaveguard=bindleaveguard()

if(!sessionid){
	location.href="sessionlist.html"
}

function structureedittext(key){
	let language=weblsget(WEBLSNAME+"language",false)
	if(!language){
		language="zhtw"
	}
	if(TRANSLATE[language]&&TRANSLATE[language]["structureeditpage"]&&TRANSLATE[language]["structureeditpage"][key]!=undefined){
		return TRANSLATE[language]["structureeditpage"][key]
	}
	if(TRANSLATE["en"]&&TRANSLATE["en"]["structureeditpage"]&&TRANSLATE["en"]["structureeditpage"][key]!=undefined){
		return TRANSLATE["en"]["structureeditpage"][key]
	}
	return key
}

function fmt(value){
	return Math.round(value).toLocaleString()
}

function gettoken(){
	return weblsget(WEBLSNAME+"token")
}

function showtoast(message,type){
	let box=domgetid("toast")
	box.textContent=message
	box.className="toast show"+(type?" "+type:"")
	clearTimeout(box.tm)
	box.tm=setTimeout(function(){
		box.classList.remove("show")
	},1800)
}

function applystatictext(){
	document.title=structureedittext("title")+" - Poker Clock"
	domgetid("btnBack").textContent=structureedittext("back")
	domgetid("btnView").textContent=structureedittext("view")
	domgetid("btnSaveStruct").value=structureedittext("save")
	domgetid("btnAddLevel").value=structureedittext("addlevel")
	domgetid("btnAddBreak").value=structureedittext("addbreak")
	domgetid("quickTitle").textContent=structureedittext("quicktitle")
	domgetid("levelDurLabel").textContent=structureedittext("leveldur")
	domgetid("breakDurLabel").textContent=structureedittext("breakdur")
	domgetid("editTitle").textContent=structureedittext("edittitle")
	domgetid("headItem").textContent=structureedittext("item")
	domgetid("headType").textContent=structureedittext("type")
	domgetid("headMinute").textContent=structureedittext("minute")
	domgetid("headAction").textContent=structureedittext("action")
	domgetid("regHintText").textContent=structureedittext("reghint")+" "+structureedittext("handhint")
	domgetid("parseTitle").textContent=structureedittext("parsetitle")
	domgetid("parseHintText").textContent=structureedittext("parsehint")
	domgetid("parseText").placeholder=structureedittext("parseplaceholder")
	domgetid("parseText").setAttribute("aria-label",structureedittext("parsearia"))
	domgetid("btnParseStruct").value=structureedittext("parsebtn")
	domgetid("btnParseImage").textContent=structureedittext("parseimagebtn")
	domgetid("btnShowAiPrompt").value=structureedittext("showaiprompt")
	domgetid("aiPromptHint").textContent=structureedittext("aiprompthint")
	domgetid("btnCopyAiPrompt").value=structureedittext("copyaiprompt")
	domgetid("ioTitle").textContent=structureedittext("ioutitle")
	domgetid("btnExportStruct").value=structureedittext("exportjson")
	domgetid("btnImportStruct").value=structureedittext("importjson")
	domgetid("btnImportFile").textContent=structureedittext("importfile")
	domgetid("structJsonText").placeholder=structureedittext("jsonplaceholder")
	domgetid("structJsonText").setAttribute("aria-label",structureedittext("jsonaria"))
	domgetid("syncText").textContent=structureedittext("loading")
	domgetid("lastAction").textContent=structureedittext("ready")
	let applylist=document.querySelectorAll(".struct-apply-btn")
	for(let i=0;i<applylist.length;i=i+1){
		applylist[i].value=structureedittext("apply")
	}
}

function pagelink(page){
	return page+"?sessionid="+encodeURIComponent(sessionid)
}

domgetid("btnBack").href=pagelink("control.html")
domgetid("btnView").href=pagelink("structure.html")

function structconfirm(message,done){
	let old=domgetid("structConfirmBox")
	if(old){
		old.remove()
	}
	let box=doccreate("div")
	box.id="structConfirmBox"
	box.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px"
	box.innerHTML=`
		<div style="background:#111;border:1px solid #333;border-radius:10px;max-width:360px;width:100%;padding:18px;color:#fff">
			<div style="font-weight:800;font-size:18px;margin-bottom:10px">${structureedittext("confirmtitle")}</div>
			<div style="font-size:14px;color:#ddd;line-height:1.6">${message}</div>
			<div style="display:flex;gap:8px;margin-top:16px">
				<input type="button" data-struct-confirm="cancel" value="${structureedittext("cancel")}" style="flex:1;background:#27272a;color:#fff;border:0;border-radius:8px;padding:10px">
				<input type="button" data-struct-confirm="ok" value="${structureedittext("confirm")}" style="flex:1;background:#059669;color:#fff;border:0;border-radius:8px;padding:10px">
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
	let dot=domgetid("syncDot")
	let label=domgetid("syncText")
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

function structitemlabel(index){
	if(state.schedule[index]&&state.schedule[index].type=="break"){
		return structureedittext("break")
	}
	return "L"+structlevelnumber(index)
}

function chipraiseoptions(selected){
	let html=`<option value="">${structureedittext("noraise")}</option>`
	for(let i=0;i<sessionchips.length;i=i+1){
		let chip=sessionchips[i]
		html=html+`<option value="${chip["value"]}" ${String(selected)==String(chip["value"])?"selected":""}>${chip["value"]}</option>`
	}
	return html
}

function renderheader(){
	let current=state.schedule[state.currentIndex]
	domgetid("tournName").textContent=state.tournName||structureedittext("heading")
	domgetid("tournSub").textContent=state.subtitle||structureedittext("subtitledefault")
	domgetid("hLv").textContent=current?levelnumof(state.currentIndex):"—"
	domgetid("hLvMax").textContent=totallevels()
	if(state.regClosed){
		domgetid("regBadge").className="reg-badge reg-closed"
		domgetid("regBadge").textContent=structureedittext("regclosed")
	}else{
		domgetid("regBadge").className="reg-badge reg-open"
		domgetid("regBadge").textContent=structureedittext("regopen")
	}
}

function readstructeditor(){
	let rows=document.querySelectorAll("[data-struct-row]")
	let newschedule=[]
	for(let i=0;i<rows.length;i=i+1){
		let row=rows[i]
		let rowindex=parseInt(row.dataset.structRow,10)
		let sourceitem=state.schedule[rowindex]||{}
		let typeinput=row.querySelector("[data-edit-k=\"type\"]")
		let durinput=row.querySelector("[data-edit-k=\"dur\"]")
		let reginput=row.querySelector("[data-edit-k=\"reg\"]")
		let type=typeinput?typeinput.value:"level"
		let durnum=durinput?parseInt(durinput.value,10):0
		if(type=="break"){
			let item={ type: "break", dur: (isNaN(durnum)||durnum<1)?1:durnum }
			item.chipRaiseValues=[]
			let chips=row.querySelectorAll(".chipraiseinput")
			for(let j=0;j<chips.length;j=j+1){
				let chipvalue=parseInt(chips[j].value,10)||0
				if(chipvalue&&item.chipRaiseValues.indexOf(chipvalue)==-1){
					item.chipRaiseValues.push(chipvalue)
				}
			}
			if(reginput&&reginput.checked){
				item.regCloseAfter=true
			}
			newschedule.push(item)
			continue
		}
		let smallblindinput=row.querySelector("[data-edit-k=\"sb\"]")
		let bigblindinput=row.querySelector("[data-edit-k=\"bb\"]")
		let anteinput=row.querySelector("[data-edit-k=\"ante\"]")
		let smallblind=parseInt(sourceitem["sb"],10)||0
		let bigblind=parseInt(sourceitem["bb"],10)||0
		let ante=parseInt(sourceitem["ante"],10)||0
		if(smallblindinput){
			smallblind=parseInt(smallblindinput.value,10)||0
		}
		if(bigblindinput){
			bigblind=parseInt(bigblindinput.value,10)||0
		}
		if(anteinput){
			ante=parseInt(anteinput.value,10)||0
		}
		let ishands=type=="hands"
		let item={
			"type": "level",
			"timemode": ishands?"hands":"time",
			"dur": ishands?(parseInt(row.dataset.minutes,10)||20):((isNaN(durnum)||durnum<1)?1:durnum),
			"sb": smallblind,
			"bb": bigblind,
			"ante": ante
		}
		if(ishands){
			item.handTargetCount=(isNaN(durnum)||durnum<0)?0:durnum
			item.handCount=parseInt(row.dataset.handcount,10)||0
		}
		if(reginput&&reginput.checked){
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
		if(item["timemode"]=="hands"){
			output.timemode="hands"
			output.handTargetCount=parseInt(item["handTargetCount"],10)||0
			output.handCount=parseInt(item["handCount"],10)||0
		}else{
			output.timemode="time"
		}
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
		showtoast(structureedittext("jsonerror"),"err")
		return false
	}
	let schedule=cleanstructlist(parsed)
	if(!schedule||schedule.length==0){
		showtoast(structureedittext("jsonempty"),"err")
		return false
	}
	state.schedule=schedule
	if(state.currentIndex>=state.schedule.length){
		state.currentIndex=state.schedule.length-1
	}
	buildstructeditor()
	showtoast(structureedittext("importsuccessprefix")+state.schedule.length+structureedittext("importsuccesssuffix"))
	return true
}

function downloadstructfile(){
	let text=exportstructtext()
	let blob=new Blob([text],{type:"application/json"})
	let url=URL.createObjectURL(blob)
	let link=doccreate("a")
	link.href=url
	link.download="blindstructure_"+Date.now()+".json"
	document.body.appendChild(link)
	link.click()
	link.remove()
	URL.revokeObjectURL(url)
}

function buildstructeditor(){
	renderheader()
	let box=domgetid("structEditList")
	let html=""
	for(let i=0;i<state.schedule.length;i=i+1){
		let item=state.schedule[i]
		let isbreak=item.type=="break"
		let ishands=!isbreak&&item.timemode=="hands"
		let label=isbreak?"B":"L"+structlevelnumber(i)
		let chipraises=item.chipRaiseValues||[]
		let chipraisehtml=`
			<select class="txt chipraiseinput">${chipraiseoptions(chipraises[0]||"")}</select>
			<select class="txt chipraiseinput">${chipraiseoptions(chipraises[1]||"")}</select>
			<select class="txt chipraiseinput">${chipraiseoptions(chipraises[2]||"")}</select>
		`
		// 手數級別: 數字欄改填「目標手數」(0=不設目標); 分鐘與已記手數先存進 row dataset 以免切換時遺失。
		let durvalue=ishands?(parseInt(item.handTargetCount,10)||0):item.dur
		let durmin=ishands?"0":"1"
		let durtitle=ishands?structureedittext("handtargetunit"):structureedittext("minute")
		html=html+`
			<div class="struct-table-row ${isbreak?"is-break":""}" data-struct-row="${i}" data-minutes="${parseInt(item.dur,10)||20}" data-handcount="${parseInt(item.handCount,10)||0}">
				<div class="struct-index">${label}</div>
				<select class="struct-type" data-edit-k="type">
					<option value="level" ${(!isbreak&&!ishands)?"selected":""}>Level</option>
					<option value="hands" ${ishands?"selected":""}>${structureedittext("levelhands")}</option>
					<option value="break" ${isbreak?"selected":""}>${structureedittext("break")}</option>
				</select>
				${isbreak?chipraisehtml:`<input type="number" class="txt" data-edit-k="sb" min="0" value="${item.sb}" inputmode="numeric" placeholder="-">
				<input type="number" class="txt" data-edit-k="bb" min="0" value="${item.bb}" inputmode="numeric" placeholder="-">
				<input type="number" class="txt" data-edit-k="ante" min="0" value="${item.ante}" inputmode="numeric" placeholder="-">`}
				<input type="number" class="txt" data-edit-k="dur" min="${durmin}" value="${durvalue}" inputmode="numeric" title="${durtitle}">
				<input type="checkbox" class="struct-check" data-edit-k="reg" ${item.regCloseAfter?"checked":""}>
				<div class="struct-actions">
					<input type="button" class="ico-btn" data-up="${i}" value="↑" title="${structureedittext("moveup")}">
					<input type="button" class="ico-btn" data-down="${i}" value="↓" title="${structureedittext("movedown")}">
					<input type="button" class="ico-btn" data-copy="${i}" value="⧉" title="${structureedittext("copy")}">
					<input type="button" class="ico-btn del" data-del="${i}" value="×" title="${structureedittext("delete")}">
				</div>
			</div>
		`
	}
	box.innerHTML=html
	updatestructsummary()
	let typelist=box.querySelectorAll("[data-edit-k=\"type\"]")
	for(let i=0;i<typelist.length;i=i+1){
		typelist[i].addEventListener("change",function(){
			readstructeditor()
			buildstructeditor()
		})
	}
	let smallblindlist=box.querySelectorAll("[data-edit-k=\"sb\"]")
	for(let i=0;i<smallblindlist.length;i=i+1){
		smallblindlist[i].addEventListener("input",function(){
			let row=this.closest("[data-struct-row]")
			if(!row){
				return
			}
			let bigblind=row.querySelector("[data-edit-k=\"bb\"]")
			let ante=row.querySelector("[data-edit-k=\"ante\"]")
			let value=parseInt(this.value,10)||0
			let next=value*2
			if(bigblind){
				bigblind.value=next
			}
			if(ante){
				ante.value=next
			}
		})
	}
	let bigblindlist=box.querySelectorAll("[data-edit-k=\"bb\"]")
	for(let i=0;i<bigblindlist.length;i=i+1){
		bigblindlist[i].addEventListener("input",function(){
			let row=this.closest("[data-struct-row]")
			if(!row){
				return
			}
			let ante=row.querySelector("[data-edit-k=\"ante\"]")
			if(ante){
				ante.value=parseInt(this.value,10)||0
			}
		})
	}
	let uplist=box.querySelectorAll("[data-up]")
	for(let i=0;i<uplist.length;i=i+1){
		uplist[i].addEventListener("click",function(){
			readstructeditor()
			let index=parseInt(this.dataset.up,10)
			if(0<index){
				let label=structitemlabel(index)
				let temp=state.schedule[index-1]
				state.schedule[index-1]=state.schedule[index]
				state.schedule[index]=temp
				buildstructeditor()
				showtoast(structureedittext("moveditemupprefix")+label)
			}
		})
	}
	let downlist=box.querySelectorAll("[data-down]")
	for(let i=0;i<downlist.length;i=i+1){
		downlist[i].addEventListener("click",function(){
			readstructeditor()
			let index=parseInt(this.dataset.down,10)
			if(index<state.schedule.length-1){
				let label=structitemlabel(index)
				let temp=state.schedule[index+1]
				state.schedule[index+1]=state.schedule[index]
				state.schedule[index]=temp
				buildstructeditor()
				showtoast(structureedittext("moveditemdownprefix")+label)
			}
		})
	}
	let copylist=box.querySelectorAll("[data-copy]")
	for(let i=0;i<copylist.length;i=i+1){
		copylist[i].addEventListener("click",function(){
			readstructeditor()
			let index=parseInt(this.dataset.copy,10)
			let label=structitemlabel(index)
			let item=JSON.parse(JSON.stringify(state.schedule[index]))
			state.schedule.splice(index+1,0,item)
			buildstructeditor()
			showtoast(structureedittext("copieditemprefix")+label)
		})
	}
	let dellist=box.querySelectorAll("[data-del]")
	for(let i=0;i<dellist.length;i=i+1){
		dellist[i].addEventListener("click",function(){
			readstructeditor()
			let index=parseInt(this.dataset.del,10)
			if(state.schedule.length<=1){
				showtoast(structureedittext("atleastone"),"err")
				return
			}
			structconfirm(structureedittext("deleteitem"),function(){
				let label=structitemlabel(index)
				state.schedule.splice(index,1)
				if(state.currentIndex>=state.schedule.length){
					state.currentIndex=state.schedule.length-1
				}
				buildstructeditor()
				showtoast(structureedittext("deleteditemprefix")+label)
			})
		})
	}
}

function loadtimer(){
	updatesync(false,structureedittext("syncloading"))
	setenabled(false)
	let loadingid=ptloadingstart("#structEditList")
	let requestoption={}
	let token=gettoken()
	if(token){
		requestoption["headers"]={
			"Authorization": "Bearer "+token
		}
	}
	fetch(AJAXURL+"gettimer/"+sessionid,requestoption).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data.success&&data.data&&data.data.state){
			state=data.data.state
			sessionchips=state.chips||[]
			buildstructeditor()
			updatesync(true,structureedittext("syncok"))
			setenabled(true)
		}else{
			updatesync(false,structureedittext("syncfail"))
			showtoast(structureedittext("loadfail"),"err")
		}
	}).catch(function(){
		updatesync(false,structureedittext("syncnetwork"))
		showtoast(structureedittext("networkfail"),"err")
	}).finally(function(){
		ptloadingend(loadingid)
	})
}

function savestruct(){
	if(savebusy){
		return
	}
	let token=gettoken()
	if(!token){
		showtoast(structureedittext("signinagain"),"err")
		return
	}
	readstructeditor()
	if(state.currentIndex>=state.schedule.length){
		state.currentIndex=state.schedule.length-1
	}
	savebusy=true
	setenabled(false)
	updatesync(false,structureedittext("savesync"))
	let loadingid=ptloadingstart("#structEditList")
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
			leaveguard.clear()
			buildstructeditor()
			showtoast(structureedittext("savesuccess"))
			updatesync(true,structureedittext("syncok"))
		}else{
			let message=data&&data.data?data.data:structureedittext("savefail")
			showtoast(message,"err")
			updatesync(false,structureedittext("savefail"))
		}
	}).catch(function(){
		showtoast(structureedittext("networkfail"),"err")
		updatesync(false,structureedittext("syncnetwork"))
	}).finally(function(){
		ptloadingend(loadingid)
		savebusy=false
		setenabled(true)
	})
}

domgetid("btnBack").addEventListener("click",function(event){
	if(event&&event.button!=0){
		return
	}
	if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
		return
	}
	if(!leaveguard.confirmleave()){
		event.preventDefault()
		return
	}
	if(window.history.length>1){
		event.preventDefault()
		window.history.back()
	}
})

domgetid("btnSaveStruct").addEventListener("click",function(){
	savestruct()
})

domgetid("btnAddLevel").addEventListener("click",function(){
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
	showtoast(structureedittext("addeditemprefix")+structitemlabel(state.schedule.length-1))
})

domgetid("btnAddBreak").addEventListener("click",function(){
	readstructeditor()
	state.schedule.push({ type: "break", dur: state.defaultBreakDur||10 })
	buildstructeditor()
	showtoast(structureedittext("addeditemprefix")+structureedittext("break"))
})

domgetid("btnExportStruct").addEventListener("click",function(){
	let box=domgetid("structJsonText")
	box.style.display="block"
	box.value=exportstructtext()
	box.focus()
	box.select()
	downloadstructfile()
	showtoast(structureedittext("exportsuccess"))
})

domgetid("btnImportStruct").addEventListener("click",function(){
	let box=domgetid("structJsonText")
	if(box.style.display=="none"||box.style.display==""){
		box.style.display="block"
		box.focus()
		return
	}
	if(importstructtext(box.value)){
		box.value=exportstructtext()
	}
})

domgetid("structFileIn").addEventListener("change",function(){
	let file=this.files&&this.files[0]
	if(!file){
		return
	}
	let reader=new FileReader()
	reader.onload=function(){
		let text=String(reader.result||"")
		domgetid("structJsonText").style.display="block"
		domgetid("structJsonText").value=text
		importstructtext(text)
	}
	reader.readAsText(file)
	this.value=""
})

function applyparseresult(data,fromai){
	if(data&&data.success&&data.data&&Array.isArray(data.data.schedule)&&data.data.schedule.length>0){
		let schedule=cleanstructlist(data.data.schedule)
		if(!schedule||schedule.length==0){
			domgetid("parseStatus").textContent=structureedittext("parsefail")
			showtoast(structureedittext("parsefail"),"err")
			return
		}
		state.schedule=schedule
		if(state.currentIndex>=state.schedule.length){
			state.currentIndex=state.schedule.length-1
		}
		buildstructeditor()
		domgetid("parseStatus").textContent=structureedittext("parsesuccessprefix")+schedule.length+structureedittext("parsesuccesssuffix")+(data.data.source=="ai"?" (AI)":"")
		showtoast(structureedittext("importsuccessprefix")+schedule.length+structureedittext("importsuccesssuffix"))
	}else if(fromai&&data&&data.data&&data.data.aiavailable==false){
		domgetid("parseStatus").textContent=structureedittext("aidisabled")
		showtoast(structureedittext("aidisabled"),"err")
	}else{
		domgetid("parseStatus").textContent=structureedittext("parsefail")
		showtoast(structureedittext("parsefail"),"err")
	}
}

function sendparserequest(payload,statuskey,fromai){
	let token=gettoken()
	if(!token){
		showtoast(structureedittext("signinagain"),"err")
		return
	}
	domgetid("btnParseStruct").disabled=true
	domgetid("parseStatus").textContent=structureedittext(statuskey)
	let loadingid=ptloadingstart("#parseText")
	fetch(AJAXURL+"parsestructure",{
		method: "POST",
		timeout: 60000,
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer "+token
		},
		body: JSON.stringify(payload)
	}).then(function(response){
		return response.json()
	}).then(function(data){
		applyparseresult(data,fromai)
	}).catch(function(){
		domgetid("parseStatus").textContent=structureedittext("networkfail")
		showtoast(structureedittext("networkfail"),"err")
	}).finally(function(){
		ptloadingend(loadingid)
		domgetid("btnParseStruct").disabled=false
	})
}

function parsestructuretext(mode){
	let text=domgetid("parseText").value||""
	if(text.trim()==""){
		showtoast(structureedittext("parseempty"),"err")
		return
	}
	sendparserequest({ text: text, mode: mode||"auto" },mode=="ai"?"parsingai":"parsing",mode=="ai")
}

function parsestructureimage(dataurl){
	sendparserequest({ image: dataurl },"parsingimage",true)
}

domgetid("btnParseStruct").addEventListener("click",function(){
	parsestructuretext("auto")
})

domgetid("parseImageIn").addEventListener("change",function(){
	let file=this.files&&this.files[0]
	if(!file){
		return
	}
	let reader=new FileReader()
	reader.onload=function(){
		let dataurl=String(reader.result||"")
		domgetid("parseImagePreview").src=dataurl
		domgetid("parseImagePreview").style.display="block"
		parsestructureimage(dataurl)
	}
	reader.readAsDataURL(file)
	this.value=""
})

function aipromptbody(){
	let language=weblsget(WEBLSNAME+"language",false)||"zhtw"
	if(language=="en"){
		return [
			"You are a poker tournament structure converter. At the end I will paste a structure copied from another website. Convert it into the following JSON and return ONLY the JSON with no explanation.",
			"",
			"Format:",
			'{"schedule":[',
			'  {"type":"level","sb":<small blind int>,"bb":<big blind int>,"ante":<ante int>,"dur":<minutes int>},',
			'  {"type":"break","dur":<minutes int>}',
			"]}",
			"",
			"Rules:",
			"1. One level object per blind level, in original order; use a break object for any break / Colour Up (breaks need no blinds).",
			"2. Normalize every number to a plain integer: drop thousands separators (1,000 -> 1000), expand K/M (1K -> 1000, 1.2K -> 1200, 2.5K -> 2500, 1M -> 1000000).",
			'3. If blinds are written as "SB / BB (Ante)", the value in parentheses is the ante; use 0 if there is no ante.',
			"4. If only the big blind is given, set the small blind to half the big blind.",
			"5. Ignore anything that is not the level/break table (buy-in, prize pool, rules text, etc.).",
			'6. If a row marks registration closing, add "regCloseAfter":true to that row.'
		].join("\n")
	}
	return [
		"你是一個撲克賽程結構轉換器。我會在最後貼上一段從別的網站複製的比賽結構，請把它轉成下面這個 JSON，並且「只回傳 JSON、不要任何說明文字」。",
		"",
		"格式：",
		'{"schedule":[',
		'  {"type":"level","sb":小盲整數,"bb":大盲整數,"ante":前注整數,"dur":分鐘整數},',
		'  {"type":"break","dur":分鐘整數}',
		"]}",
		"",
		"規則：",
		"1. 每個盲注級別一個 level 物件，依原順序排列；休息 / Break / Colour Up 用 break 物件（break 不需要盲注）。",
		"2. 數字一律轉成純整數：去掉千分位逗號（1,000→1000），展開 K/M（1K→1000、1.2K→1200、2.5K→2500、1M→1000000）。",
		"3. 盲注若寫成「SB / BB (Ante)」，括號內是前注；沒有前注就填 0。",
		"4. 只有大盲、沒有小盲時，小盲填大盲的一半。",
		"5. 忽略所有不是級別/休息表格的內容（報名費、獎池、規則說明等）。",
		"6. 若某一列代表報名截止，在那一列加上 \"regCloseAfter\":true。"
	].join("\n")
}

function buildaiprompt(){
	let structure=(domgetid("parseText").value||"").trim()
	if(structure==""){
		structure=structureedittext("aipromptplaceholder")
	}
	return aipromptbody()+"\n\n"+structureedittext("aipromptstructlabel")+"\n"+structure
}

domgetid("btnShowAiPrompt").addEventListener("click",function(){
	let box=domgetid("aiPromptBox")
	if(box.style.display=="none"||box.style.display==""){
		domgetid("aiPromptText").value=buildaiprompt()
		box.style.display="block"
	}else{
		box.style.display="none"
	}
})

domgetid("btnCopyAiPrompt").addEventListener("click",function(){
	let box=domgetid("aiPromptText")
	box.value=buildaiprompt()
	box.focus()
	box.select()
	function done(){
		showtoast(structureedittext("aipromptcopied"))
	}
	if(navigator.clipboard&&navigator.clipboard.writeText){
		navigator.clipboard.writeText(box.value).then(done,function(){
			document.execCommand("copy")
			done()
		})
	}else{
		document.execCommand("copy")
		done()
	}
})

domgetid("btnApplyLevelDur").addEventListener("click",function(){
	readstructeditor()
	let dur=parseInt(domgetid("structLevelDur").value,10)
	if(isNaN(dur)||dur<=0){
		showtoast(structureedittext("badleveldur"),"err")
		return
	}
	for(let i=0;i<state.schedule.length;i=i+1){
		if(state.schedule[i].type=="level"){
			state.schedule[i].dur=dur
		}
	}
	buildstructeditor()
	showtoast(structureedittext("leveldurapplied"))
})

onenterclick("#structLevelDur",function(){
	click("#btnApplyLevelDur")
})

domgetid("btnApplyBreakDur").addEventListener("click",function(){
	readstructeditor()
	let dur=parseInt(domgetid("structBreakDur").value,10)
	if(isNaN(dur)||dur<=0){
		showtoast(structureedittext("badbreakdur"),"err")
		return
	}
	for(let i=0;i<state.schedule.length;i=i+1){
		if(state.schedule[i].type=="break"){
			state.schedule[i].dur=dur
		}
	}
	buildstructeditor()
	showtoast(structureedittext("breakdurapplied"))
})

onenterclick("#structBreakDur",function(){
	click("#btnApplyBreakDur")
})

function updatestructsummary(){
	let box=domgetid("structSummary")
	if(!box){
		return
	}
	let rows=document.querySelectorAll("[data-struct-row]")
	let levels=0
	let breaks=0
	let handslevels=0
	let minutes=0
	let regcloselevel=0
	for(let i=0;i<rows.length;i=i+1){
		let row=rows[i]
		let typeel=row.querySelector("[data-edit-k=\"type\"]")
		let type=typeel?typeel.value:"level"
		let durel=row.querySelector("[data-edit-k=\"dur\"]")
		let dur=parseInt(durel?durel.value:0,10)||0
		let regel=row.querySelector("[data-edit-k=\"reg\"]")
		if(type=="break"){
			breaks=breaks+1
			minutes=minutes+dur
		}else{
			levels=levels+1
			if(type=="hands"){
				handslevels=handslevels+1
				minutes=minutes+(parseInt(row.dataset.minutes,10)||0)
			}else{
				minutes=minutes+dur
			}
		}
		if(regel&&regel.checked&&regcloselevel==0){
			regcloselevel=levels
		}
	}
	let hours=Math.floor(minutes/60)
	let mins=minutes%60
	let parts=[
		structureedittext("sumlevels")+" "+levels,
		structureedittext("sumbreaks")+" "+breaks,
		structureedittext("sumduration")+" "+hours+structureedittext("sumhour")+" "+mins+structureedittext("summin")
	]
	if(regcloselevel>0){
		parts.push(structureedittext("sumreg")+" "+structureedittext("sumlevelword")+" "+regcloselevel)
	}else{
		parts.push(structureedittext("sumreg")+" "+structureedittext("sumregnone"))
	}
	if(handslevels>0){
		parts.push(structureedittext("sumhandsprefix")+handslevels+structureedittext("sumhandssuffix"))
	}
	box.textContent=rows.length?parts.join(" · "):""
	updatestructwarnings()
}

function structchipvalues(){
	let list=[]
	for(let i=0;i<sessionchips.length;i=i+1){
		let value=parseInt(sessionchips[i]["value"],10)||0
		if(value>0&&list.indexOf(value)==-1){
			list.push(value)
		}
	}
	list.sort(function(a,b){return a-b})
	return list
}

function readstructrows(){
	let rows=document.querySelectorAll("[data-struct-row]")
	let items=[]
	let levelno=0
	for(let i=0;i<rows.length;i=i+1){
		let row=rows[i]
		let typeel=row.querySelector("[data-edit-k=\"type\"]")
		let type=typeel?typeel.value:"level"
		let isbreak=type=="break"
		let item={ el: row, isbreak: isbreak }
		if(isbreak){
			item.chips=[]
			let chips=row.querySelectorAll(".chipraiseinput")
			for(let j=0;j<chips.length;j=j+1){
				let value=parseInt(chips[j].value,10)||0
				if(value&&item.chips.indexOf(value)==-1){
					item.chips.push(value)
				}
			}
			item.label=structureedittext("warnbreakword")
		}else{
			levelno=levelno+1
			let sbel=row.querySelector("[data-edit-k=\"sb\"]")
			let bbel=row.querySelector("[data-edit-k=\"bb\"]")
			let anteel=row.querySelector("[data-edit-k=\"ante\"]")
			item.sb=parseInt(sbel?sbel.value:0,10)||0
			item.bb=parseInt(bbel?bbel.value:0,10)||0
			item.ante=parseInt(anteel?anteel.value:0,10)||0
			item.label=structureedittext("warnlevelword")+levelno
		}
		items.push(item)
	}
	return items
}

// 結構檢查：只警告不限制，紅色=盲注下降，橘色=換籌過早 / ante 不一致。
function updatestructwarnings(){
	let box=domgetid("structWarnings")
	if(!box){
		return
	}
	let items=readstructrows()
	for(let i=0;i<items.length;i=i+1){
		items[i].el.classList.remove("struct-warn")
		items[i].el.classList.remove("struct-decrease")
	}
	let messages=[]
	// 1) 盲注下降：某一級比前一級小（大盲變小，或大盲相同但小盲變小）
	let prev=null
	for(let i=0;i<items.length;i=i+1){
		let it=items[i]
		if(it.isbreak){
			continue
		}
		if(it.bb>0&&prev&&prev.bb>0){
			let smaller=it.bb<prev.bb||(it.bb==prev.bb&&it.sb<prev.sb)
			if(smaller){
				it.el.classList.add("struct-decrease")
				messages.push({
					type: "err",
					tag: structureedittext("warndecrease"),
					text: it.label+" "+prev.sb+"/"+prev.bb+" → "+it.sb+"/"+it.bb+" "+structureedittext("warndecreasemsg")
				})
			}
		}
		prev=it
	}
	// 2) 換籌過早：休息把某面額 race 掉，但後面級別的盲注/前注還會用到（無法用剩下的面額湊出）
	let chipvalues=structchipvalues()
	let removed=[]
	for(let i=0;i<items.length;i=i+1){
		let it=items[i]
		if(!it.isbreak||!it.chips.length){
			continue
		}
		for(let c=0;c<it.chips.length;c=c+1){
			if(removed.indexOf(it.chips[c])==-1){
				removed.push(it.chips[c])
			}
		}
		let remaining=chipvalues.filter(function(v){return removed.indexOf(v)==-1})
		let smallest=remaining.length?remaining[0]:0
		for(let c=0;c<it.chips.length;c=c+1){
			let chip=it.chips[c]
			let hitlevel=null
			for(let k=i+1;k<items.length&&!hitlevel;k=k+1){
				let lv=items[k]
				if(lv.isbreak){
					continue
				}
				let vals=[lv.sb,lv.bb,lv.ante]
				for(let v=0;v<vals.length;v=v+1){
					let val=vals[v]
					if(val<=0){
						continue
					}
					let needs=smallest>0?(val%smallest!=0&&remaining.indexOf(val)==-1):(val<chip)
					if(needs){
						hitlevel=lv.label
						break
					}
				}
			}
			if(hitlevel){
				it.el.classList.add("struct-warn")
				messages.push({
					type: "warn",
					tag: structureedittext("warnrace"),
					text: it.label+" "+structureedittext("warnracemsg").replace("{chip}",chip).replace("{level}",hitlevel)
				})
			}
		}
	}
	// 3) ante 不一致：ante 已經開始收，之後卻有級別沒有 ante（中間缺一塊）
	let antestarted=false
	for(let i=0;i<items.length;i=i+1){
		let it=items[i]
		if(it.isbreak){
			continue
		}
		if(it.ante>0){
			antestarted=true
			continue
		}
		if(antestarted&&(it.sb>0||it.bb>0)){
			it.el.classList.add("struct-warn")
			messages.push({
				type: "warn",
				tag: structureedittext("warnante"),
				text: it.label+" "+structureedittext("warnantemsg")
			})
		}
	}
	let html=""
	for(let i=0;i<messages.length;i=i+1){
		let m=messages[i]
		html=html+`<div class="swline ${m.type}"><span class="swtag">${m.tag}</span>${m.text}</div>`
	}
	box.innerHTML=html
}

let structEditListBox=domgetid("structEditList")
if(structEditListBox){
	structEditListBox.addEventListener("input",updatestructsummary)
	structEditListBox.addEventListener("change",updatestructsummary)
}

applystatictext()
loadtimer()
