// broadcastcontrol.js
// ===========================================================================
// 裁判端 H4H 手動推進控制台
//   * 需登入且具裁判/主辦權限(後端 cancontrolbroadcast 把關)
//   * 逐手放行: advance(+1) / back(-1) / all(全部)
//   * 放行後後端會 broadcast 事件, 觀眾轉播頁自動重抓
// ===========================================================================

let bccsessionid=(function(){
	let params=new URLSearchParams(location.search||"")
	return params.get("sessionid")||params.get("id")||""
})()
let bccws=null
let bccwsretry=null
let bccwsdowned=false
let bccbusy=false

function bcctext(key,fallback){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["broadcastcontrolpage"]&&TRANSLATE[LANGUAGE]["broadcastcontrolpage"][key]){
		return TRANSLATE[LANGUAGE]["broadcastcontrolpage"][key]
	}
	if(fallback!=null){
		return fallback
	}
	return key
}

// 套用頁面靜態文案
function bccapplytexts(){
	document.title=bcctext("title")
	let setid=function(id,text){
		let el=document.getElementById(id)
		if(el){ el.textContent=text }
	}
	setid("bcckicker",bcctext("kicker"))
	setid("bccsubtitle",bcctext("subtitle"))
	setid("bcclabelreleased",bcctext("released"))
	setid("bcclabelpending",bcctext("pending"))
	setid("bcclabeltotal",bcctext("total"))
	setid("bccnexttitle",bcctext("nexttitle"))
	setid("bcclisttitle",bcctext("listtitle"))
	setid("bccadvance",bcctext("advance"))
	setid("bccback",bcctext("back"))
	setid("bccall",bcctext("all"))
}

function bccauthheaders(){
	return [["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]]
}

function bccnotice(text){
	let box=document.getElementById("bccnotice")
	if(!box){
		return
	}
	if(text){
		box.textContent=text
		box.classList.remove("hidden")
	}else{
		box.classList.add("hidden")
	}
}

function bccesc(text){
	if(typeof safehtml=="function"){
		return safehtml(text)
	}
	return String(text==null?"":text).replace(/[&<>"']/g,function(c){
		return { "&": "&amp;","<": "&lt;",">": "&gt;","\"": "&quot;","'": "&#39;" }[c]
	})
}

function bccblind(hand){
	let sb=hand["smallblind"]||0
	let bb=hand["bigblind"]||0
	let ante=hand["ante"]||hand["bigblindante"]||0
	return sb+"/"+bb+(ante?" ("+ante+")":"")
}

function bccrender(control){
	document.getElementById("bccmain").classList.remove("hidden")
	let name=document.getElementById("bccname")
	if(name){
		name.textContent=control["name"]||bcctext("unnamed")
	}
	document.getElementById("bccreleased").textContent=control["released"]
	document.getElementById("bccpending").textContent=control["pending"]
	document.getElementById("bcctotal").textContent=control["total"]

	let next=control["nexthand"]
	let nextbox=document.getElementById("bccnext")
	if(next){
		nextbox.innerHTML=`<span class="font-bold text-emerald-300">${bcctext("handpre")}${bccesc(next["order"])}${bcctext("handpost")}</span> · ${bccesc(next["tablename"]||next["tabletoken"]||"-")} · ${bcctext("blind")} ${bccesc(bccblind(next))} <span class="text-zinc-500">${bccesc(ptformatdatetime(next["createtime"]))}</span>`
	}else{
		nextbox.innerHTML=`<span class="text-zinc-500">${bcctext("allreleased")}</span>`
	}

	// 按鈕可用狀態
	document.getElementById("bccadvance").disabled=bccbusy||control["pending"]<=0
	document.getElementById("bccall").disabled=bccbusy||control["pending"]<=0
	document.getElementById("bccback").disabled=bccbusy||control["released"]<=0

	// 手牌清單(最新在上)
	let hands=control["hands"]||[]
	let html=""
	for(let i=hands.length-1;i>=0;i=i-1){
		let hand=hands[i]
		let tag=hand["released"]
			?`<span class="rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-xs font-bold">${bcctext("tagreleased")}</span>`
			:`<span class="rounded-full bg-amber-500/15 text-amber-300 px-2 py-0.5 text-xs font-bold">${bcctext("tagpending")}</span>`
		html=html+`
			<div class="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 ${hand["released"]?"bg-zinc-900/40":"bg-zinc-900/70"} px-4 py-2.5">
				<div class="flex items-center gap-3">
					<span class="text-xs font-mono text-zinc-500">${bcctext("handpre")}${bccesc(hand["order"])}${bcctext("handpost")}</span>
					<span class="text-sm text-zinc-300">${bccesc(hand["tablename"]||hand["tabletoken"]||"-")}</span>
					<span class="text-xs text-zinc-500">${bccesc(bccblind(hand))}</span>
				</div>
				${tag}
			</div>`
	}
	if(!html){
		html=`<div class="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-6 text-center text-sm text-zinc-500">${bcctext("nohands")}</div>`
	}
	document.getElementById("bcclist").innerHTML=html
}

function bccload(){
	if(!bccsessionid){
		return
	}
	ajax("GET",AJAXURL+"getbroadcastcontrol/"+encodeURIComponent(bccsessionid),function(event,data){
		// 防呆: success 但 data["data"] 為空時視同載入失敗, 避免存取 null 屬性
		if(data&&data["success"]&&data["data"]){
			bccnotice("")
			if(!data["data"]["h4h"]){
				bccnotice(bcctext("noticenoth4h"))
			}
			bccrender(data["data"])
		}else{
			bccnotice(data&&data["data"]?String(data["data"]):bcctext("noticeloadfail"))
		}
	},null,bccauthheaders())
}

function bccact(action){
	if(bccbusy||!bccsessionid){
		return
	}
	bccbusy=true
	document.getElementById("bccadvance").disabled=true
	document.getElementById("bccall").disabled=true
	document.getElementById("bccback").disabled=true
	ajax("PUT",AJAXURL+"broadcastrelease/"+encodeURIComponent(bccsessionid),function(event,data){
		bccbusy=false
		if(data&&data["success"]){
			if(typeof pttoast=="function"){
				pttoast(bcctext("toastok"),"success")
			}
			bccload()
		}else{
			if(typeof pttoast=="function"){
				pttoast(data&&data["data"]?String(data["data"]):bcctext("toastfail"),"error")
			}
			bccload()
		}
	},str({ "action": action }),bccauthheaders())
}

function bccwsurl(){
	let proto=location.protocol=="https:"?"wss:":"ws:"
	let base=location.host
	if(base.endsWith("/")){
		base=base.slice(0,-1)
	}
	let url=proto+"//"+base+WSPREFIX+"hand/"+encodeURIComponent(bccsessionid)+"/"
	let token=weblsget(WEBLSNAME+"token")
	if(token){
		url=url+"?token="+encodeURIComponent(token)
	}
	return url
}

function bccconnectws(){
	if(!bccsessionid){
		return
	}
	try{
		bccws=new WebSocket(bccwsurl())
	}catch(error){
		bccwsdowned=true
		bccnotice(bcctext("noticewsdown","轉播連線中斷，重新連線中…"))
		return
	}
	bccws.onopen=function(){
		// 重連成功: 重抓控制台補上斷線期間漏掉的事件, 並由 bccload 重設提示
		if(bccwsdowned){
			bccwsdowned=false
			bccload()
		}
	}
	bccws.onmessage=function(event){
		let data=json(event.data)
		// 有新手牌記錄時待放行數會變, 重抓控制台
		if(data&&data["event"]&&data["event"]!="broadcast.released"){
			bccload()
		}
	}
	bccws.onerror=function(){
		bccwsdowned=true
		bccnotice(bcctext("noticewsdown","轉播連線中斷，重新連線中…"))
	}
	bccws.onclose=function(){
		bccws=null
		bccwsdowned=true
		bccnotice(bcctext("noticewsdown","轉播連線中斷，重新連線中…"))
		if(bccwsretry){ clearTimeout(bccwsretry) }
		bccwsretry=setTimeout(bccconnectws,3000)
	}
}

bccapplytexts()

onclick("#bccadvance",function(){ bccact("advance") })
onclick("#bccall",function(){
	if(typeof ptconfirm=="function"){
		ptconfirm(bcctext("confirmall"),function(okayed){
			if(okayed){ bccact("all") }
		})
	}else{
		bccact("all")
	}
})
onclick("#bccback",function(){ bccact("back") })

if(!bccsessionid){
	bccnotice(bcctext("noticenosession"))
}else if(!weblsget(WEBLSNAME+"token")){
	bccnotice(bcctext("noticelogin"))
}else{
	bccload()
	bccconnectws()
}
