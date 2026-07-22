"use strict"

let state={}
let sessionid=new URLSearchParams(location.search).get("sessionid")

function structuretext(key){
	let language=weblsget(WEBLSNAME+"language",false)
	if(!language){
		language="zhtw"
	}
	if(TRANSLATE[language]&&TRANSLATE[language]["structurepage"]&&TRANSLATE[language]["structurepage"][key]!=undefined){
		return TRANSLATE[language]["structurepage"][key]
	}
	if(TRANSLATE["en"]&&TRANSLATE["en"]["structurepage"]&&TRANSLATE["en"]["structurepage"][key]!=undefined){
		return TRANSLATE["en"]["structurepage"][key]
	}
	return key
}

function fmt(value){
	return Math.round(value).toLocaleString()
}

function safetext(value){
	let text=value
	if(value==undefined||value==null){
		text=""
	}
	return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

function scheduleminutes(item){
	if(!item){
		return 0
	}
	if(item.type=="level"&&item.timemode=="hands"){
		return 0
	}
	return parseInt(item.dur,10)||0
}

function moneytext(value){
	let number=parseInt(value,10)
	if(isNaN(number)){
		return String(value||"")
	}
	return fmt(number)
}

function chipracelist(item){
	let list=[]
	let chiprace=[]
	if(item&&item.chipRace){
		chiprace=item.chipRace
	}
	for(let i=0;i<chiprace.length;i=i+1){
		let text=moneytext(chiprace[i])
		if(text&&list.indexOf(text)==-1){
			list.push(text)
		}
	}
	let chipraise=[]
	if(item&&item.chipRaiseValues){
		chipraise=item.chipRaiseValues
	}
	for(let i=0;i<chipraise.length;i=i+1){
		let text=moneytext(chipraise[i])
		if(text&&list.indexOf(text)==-1){
			list.push(text)
		}
	}
	return list
}

function chipracehtml(item){
	let list=chipracelist(item)
	if(list.length<=0){
		return ""
	}
	return "<span class=\"race-pin\">"+structuretext("chiprace")+": "+safetext(list.join("、"))+"</span>"
}

function parsestarttime(){
	let value=state.startTime||state.starttime||state.sessionStartTime||""
	if(!value){
		return null
	}
	let text=String(value).trim()
	if(text==""){
		return null
	}
	if(text.indexOf("T")<0){
		text=text.replace(" ","T")
	}
	text=text.replace(/\+(\d{2})$/,"+$1:00")
	let date=new Date(text)
	if(isNaN(date.getTime())){
		return null
	}
	return date
}

function itemstarttext(startdate,minutes){
	if(!startdate){
		return ""
	}
	let date=new Date(startdate.getTime()+minutes*60000)
	let hour=String(date.getUTCHours()).padStart(2,"0")
	let minute=String(date.getUTCMinutes()).padStart(2,"0")
	return hour+":"+minute
}

function itemstarthtml(startdate,minutes){
	let text=itemstarttext(startdate,minutes)
	if(text==""){
		return ""
	}
	return "<span class=\"start-time\">"+structuretext("starttime")+" "+text+"</span>"
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
	document.title=structuretext("title")+" - Poker Clock"
	domgetid("btnBack").textContent=structuretext("back")
	domgetid("btnEdit").textContent=structuretext("edit")
	domgetid("sectionTitle").textContent=structuretext("sectiontitle")
	domgetid("summaryTitle").textContent=structuretext("summarytitle")
	domgetid("totalDurationLabel").textContent=structuretext("totalduration")
	domgetid("syncText").textContent=structuretext("loading")
	domgetid("lastAction").textContent=structuretext("ready")
}

if(!sessionid){
	showtoast(structuretext("missingid"),"error")
	setTimeout(function(){
		location.href="sessionlist.html"
	},300)
}

function pagelink(page){
	return page+"?sessionid="+encodeURIComponent(sessionid)
}

domgetid("btnBack").href=pagelink("control.html")
domgetid("btnEdit").href=pagelink("structureedit.html")

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

function render(){
	if(!state.schedule){
		return
	}
	let current=state.schedule[state.currentIndex]
	domgetid("tournName").textContent=state.tournName||structuretext("heading")
	domgetid("tournSub").textContent=state.subtitle||structuretext("subtitledefault")
	domgetid("hLv").textContent=current?levelnumof(state.currentIndex):"—"
	domgetid("hLvMax").textContent=totallevels()
	if(state.regClosed){
		domgetid("regBadge").className="reg-badge reg-closed"
		domgetid("regBadge").textContent=structuretext("regclosed")
	}else{
		domgetid("regBadge").className="reg-badge reg-open"
		domgetid("regBadge").textContent=structuretext("regopen")
	}
	let html=""
	let minutes=0
	let elapsedminutes=0
	let startdate=parsestarttime()
	let regitems=[]
	for(let i=0;i<state.schedule.length;i=i+1){
		let item=state.schedule[i]
		let isactive=i==state.currentIndex
		let isdone=i<state.currentIndex
		let isbreak=item.type=="break"
		let rowclass="lvl-row"+(isbreak?" is-break-row":"")+(isactive?" active"+(isbreak?" is-break":""):(isdone?" done":""))
		let label=isbreak?structuretext("break"):"L"+levelnumof(i)
		let blinds=isbreak?structuretext("breaktime"):fmt(item.sb)+"/"+fmt(item.bb)+" <span style=\"color:#666;font-size:11px\">a"+fmt(item.ante)+"</span>"
		let regpin=item.regCloseAfter?"<span class=\"reg-pin\">REG✕</span>":""
		let ishands=item.type=="level"&&item.timemode=="hands"
		let durtext=item.dur+"m"
		if(ishands){
			let target=parseInt(item.handTargetCount,10)||0
			durtext="✋"+(target>0?target:"")
		}
		let racehtml=chipracehtml(item)
		let starttimehtml=itemstarthtml(startdate,elapsedminutes)
		// 手數級別不佔總時長 (無倒數)
		if(!ishands){
			minutes=minutes+scheduleminutes(item)
		}
		if(item.regCloseAfter){
			regitems.push(label)
		}
		html=html+"<div class=\""+rowclass+"\">"+
			"<span class=\"ln\">"+label+"</span>"+
			"<span class=\"blinds\">"+blinds+"</span>"+
			"<span class=\"dur\">"+durtext+"</span>"+
			"<span class=\"structure-meta\">"+starttimehtml+racehtml+regpin+"</span>"+
		"</div>"
		elapsedminutes=elapsedminutes+scheduleminutes(item)
	}
	domgetid("structureList").innerHTML=html
	domgetid("levelCount").textContent=totallevels()
	domgetid("totalDuration").textContent=minutes+"m"
	if(regitems.length>0){
		domgetid("regHint").textContent=structuretext("regcloseprefix")+regitems.join("、")+structuretext("regclosesuffix")
	}else{
		domgetid("regHint").textContent=structuretext("regclosenone")
	}
}

function loadtimer(){
	updatesync(false,structuretext("syncloading"))
	let loadingid=ptloadingstart("#structureList")
	let requestoption={}
	let token=weblsget(WEBLSNAME+"token")
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
			render()
			updatesync(true,structuretext("syncok"))
		}else{
			updatesync(false,structuretext("syncfail"))
			showtoast(structuretext("loadfail"),"err")
		}
	}).catch(function(){
		updatesync(false,structuretext("syncnetwork"))
		showtoast(structuretext("networkfail"),"err")
	}).finally(function(){
		ptloadingend(loadingid)
	})
}

domgetid("btnBack").addEventListener("click",function(event){
	if(event&&event.button!=0){
		return
	}
	if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
		return
	}
	if(history.length>1){
		event.preventDefault()
		history.back()
	}
})

applystatictext()
loadtimer()
