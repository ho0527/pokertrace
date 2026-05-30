"use strict"

let state={}
let sessionid=new URLSearchParams(location.search).get("sessionid")

if(!sessionid){
	alert("缺少 sessionid 參數")
	location.href="sessionlist.html"
}

function $(id){
	return document.getElementById(id)
}

function fmt(value){
	return Math.round(value).toLocaleString()
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
	$("tournName").textContent=state.tournName||"賽程結構"
	$("tournSub").textContent=state.subtitle||"STRUCTURE VIEW"
	$("hLv").textContent=current?levelnumof(state.currentIndex):"—"
	$("hLvMax").textContent=totallevels()
	if(state.regClosed){
		$("regBadge").className="reg-badge reg-closed"
		$("regBadge").textContent="REG CLOSED"
	}else{
		$("regBadge").className="reg-badge reg-open"
		$("regBadge").textContent="REG OPEN"
	}
	let html=""
	let minutes=0
	let regitems=[]
	for(let i=0;i<state.schedule.length;i=i+1){
		let item=state.schedule[i]
		let isactive=i==state.currentIndex
		let isdone=i<state.currentIndex
		let isbreak=item.type=="break"
		let rowclass="lvl-row"+(isbreak?" is-break-row":"")+(isactive?" active"+(isbreak?" is-break":""):(isdone?" done":""))
		let label=isbreak?"休息":"L"+levelnumof(i)
		let blinds=isbreak?"休息時間":fmt(item.sb)+"/"+fmt(item.bb)+" <span style=\"color:#666;font-size:11px\">a"+fmt(item.ante)+"</span>"
		let regpin=item.regCloseAfter?"<span class=\"reg-pin\">REG✕</span>":""
		minutes=minutes+(parseInt(item.dur,10)||0)
		if(item.regCloseAfter){
			regitems.push(label)
		}
		html=html+"<div class=\""+rowclass+"\">"+
			"<span class=\"ln\">"+label+"</span>"+
			"<span class=\"blinds\">"+blinds+"</span>"+
			"<span class=\"dur\">"+item.dur+"m</span>"+
			"<span>"+regpin+"</span>"+
		"</div>"
	}
	$("structureList").innerHTML=html
	$("levelCount").textContent=totallevels()
	$("totalDuration").textContent=minutes+"m"
	if(regitems.length>0){
		$("regHint").textContent="報名關閉點："+regitems.join("、")+" 結束時自動關閉"
	}else{
		$("regHint").textContent="尚未設定自動報名關閉點"
	}
}

function loadtimer(){
	updatesync(false,"讀取中")
	fetch(AJAXURL+"gettimer/"+sessionid).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data.success&&data.data&&data.data.state){
			state=data.data.state
			render()
			updatesync(true,"已同步")
		}else{
			updatesync(false,"讀取失敗")
			showtoast("讀取失敗","err")
		}
	}).catch(function(){
		updatesync(false,"網路不佳")
		showtoast("網路不佳，請重新嘗試","err")
	})
}

$("btnBack").addEventListener("click",function(){
	location.href="control.html?sessionid="+encodeURIComponent(sessionid)
})

$("btnEdit").addEventListener("click",function(){
	location.href="structureedit.html?sessionid="+encodeURIComponent(sessionid)
})

loadtimer()
