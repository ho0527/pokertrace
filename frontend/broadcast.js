// broadcast.js
// ===========================================================================
// 場外現場轉播 (唯讀)
//   * 從 URL 取 sessionid, 連 ws/hand/<sessionid>/ 收即時事件, 事件到就重抓手牌
//   * 手牌資料走公開端點 getbroadcasthandlist (免登入, 後端只對公開統一紀錄場開放)
//   * 純唯讀: 不寫任何狀態, 不顯示編輯/刪除
// ===========================================================================

let bcsessionid=(function(){
	let params=new URLSearchParams(location.search||"")
	return params.get("sessionid")||params.get("id")||""
})()
let bcws=null
let bcwsretry=null
let bchands=[]
let bcloading=false
let bcmaxseat=0
let bcchips=[]
let bcbbmode=false
let bccurbb=0

try{ bcbbmode=(localStorage.getItem("bc-bbmode")=="1") }catch(error){ bcbbmode=false }

// 金額格式: BB 模式時以 大盲 為單位顯示(x.x BB), 否則顯示原始計分牌數
// 防呆: bccurbb 為 0(尚未渲染牌桌或該手無大盲金額)時不做除法, 退回計分牌數顯示
function bcfmtamt(amount){
	let n=bcint(amount)
	if(bcbbmode){
		if(bccurbb>0){
			let v=n/bccurbb
			return (Math.round(v*10)/10)+" BB"
		}
		return String(n)
	}
	return String(n)
}

function bctext(key,fallback){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["broadcastpage"]&&TRANSLATE[LANGUAGE]["broadcastpage"][key]){
		return TRANSLATE[LANGUAGE]["broadcastpage"][key]
	}
	if(fallback!=null){
		return fallback
	}
	return key
}

// 套用頁面靜態文案(標題 / 頁腳 / 皮膚選項 / 初始狀態)
function bcapplytexts(){
	document.title=bctext("title")
	let setid=function(id,text){
		let el=document.getElementById(id)
		if(el){ el.textContent=text }
	}
	setid("bckicker",bctext("kicker"))
	setid("bclatesttitle",bctext("latesttitle"))
	setid("bclisttitle",bctext("listtitle"))
	setid("bcfoot",bctext("foot"))
	setid("bcskinclassic",bctext("skinclassic"))
	setid("bcskincrimson",bctext("skincrimson"))
	setid("bcskinmidnight",bctext("skinmidnight"))
	setid("bcskinroyal",bctext("skinroyal"))
	setid("bcskinocean",bctext("skinocean"))
	setid("bcskinsunset",bctext("skinsunset"))
	setid("bcskinrose",bctext("skinrose"))
	setid("bcskingraphite",bctext("skingraphite"))
	setid("bcskinminimal",bctext("skinminimal"))
	setid("bcstatus",bctext("statusconnecting"))
}

function bcstatus(text,live){
	let dot=document.getElementById("bcdot")
	let label=document.getElementById("bcstatus")
	if(label){
		label.textContent=text
	}
	if(dot){
		if(live){
			dot.classList.add("on")
		}else{
			dot.classList.remove("on")
		}
	}
}

function bcbadgechip(text,tone){
	let color=tone=="warn"?"border-amber-500/40 bg-amber-500/10 text-amber-200":"border-zinc-700 bg-zinc-900/70 text-zinc-300"
	return `<span class="inline-flex items-center gap-1 rounded-full border ${color} px-2.5 py-1 font-bold">${text}</span>`
}

// 依轉播設定顯示狀態(延遲 / 底牌隱藏 / H4H)
function bcrenderbadge(meta){
	let box=document.getElementById("bcbadge")
	if(!box){
		return
	}
	let html=""
	let delay=bcint(meta["broadcastdelay"])
	if(delay>0){
		html=html+bcbadgechip(bctext("delaypre")+delay+bctext("delaypost"),"warn")
	}
	if(meta["broadcastshowcard"]===false){
		html=html+bcbadgechip(bctext("badgemask"),"warn")
	}
	if(meta["broadcasth4h"]===true){
		html=html+bcbadgechip(bctext("badgeh4h"),"warn")
	}
	box.innerHTML=html
}

function bcnotice(text){
	let box=document.getElementById("bcnotice")
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

// 花色 → 符號 / 紅色
function bcsuitinfo(suit){
	let s=String(suit||"").toLowerCase()
	if(s=="s"){ return { symbol: "♠",red: false } }
	if(s=="h"){ return { symbol: "♥",red: true } }
	if(s=="d"){ return { symbol: "♦",red: true } }
	if(s=="c"){ return { symbol: "♣",red: false } }
	return { symbol: "?",red: false }
}

// 牌背(未知牌 / 遮罩 / 蓋牌後皆用牌背)
function bccardback(small){
	return `<span class="bc-card back${small?" sm":""}"><span class="bc-emblem"></span></span>`
}

function bccardhtml(card,small){
	let sm=small?" sm":""
	let text=String(card||"")
	if(text.length<2){
		return bccardback(small)
	}
	let rank=text.substring(0,text.length-1).toUpperCase()
	let info=bcsuitinfo(text.substring(text.length-1))
	return `<span class="bc-card ${info["red"]?"red":""}${sm}"><span class="r">${rank}</span><span class="s">${info["symbol"]}</span></span>`
}

function bccardsfixed(cards,count,small){
	let html=""
	for(let i=0;i<count;i=i+1){
		html=html+bccardhtml(cards&&cards[i]?cards[i]:"",small)
	}
	return html
}

// 把 boardcard 物件 {flop:[],turn,river} 攤平成陣列（TASK-037 起共用 initialize.js 的解析）
function bcboardcards(hand){
	return ptboardcardlist(hand["boardcard"])
}

function bcseatcards(seat){
	let handcard=seat["handcard"]||{}
	if(typeof handcard=="string"){
		handcard=json(handcard)||{}
	}
	// 底牌依牌型而定（Hold'em 2、Omaha 4…），讀實際存在的 card1..card5。
	let cards=[]
	for(let i=1;i<=5;i=i+1){
		if(handcard["card"+i]){
			cards.push(handcard["card"+i])
		}
	}
	return cards
}

function bcesc(text){
	if(typeof safehtml=="function"){
		return safehtml(text)
	}
	return String(text==null?"":text).replace(/[&<>"']/g,function(c){
		return { "&": "&amp;","<": "&lt;",">": "&gt;","\"": "&quot;","'": "&#39;" }[c]
	})
}

function bcblindtext(hand){
	let sb=hand["smallblind"]||0
	let bb=hand["bigblind"]||0
	let ante=hand["ante"]||hand["bigblindante"]||0
	return sb+"/"+bb+(ante?" ("+ante+")":"")
}

function bcint(value){
	let n=parseInt(value)
	return isNaN(n)?0:n
}

function bcinitial(name){
	let text=String(name||"").trim()
	if(!text){
		return "?"
	}
	return text.substring(0,1).toUpperCase()
}

// 底池 = 本手所有下注計分牌加總(顯示用)
function bcpot(hand){
	let rows=hand["bittingdata"]||[]
	let total=0
	for(let i=0;i<rows.length;i=i+1){
		total=total+bcint(rows[i]["chip"])
	}
	return total
}

function bcmaxseatof(hand){
	if(bcmaxseat){
		return bcmaxseat
	}
	let seats=hand["seatingdata"]||[]
	let max=0
	for(let i=0;i<seats.length;i=i+1){
		if(bcint(seats[i]["seatno"])>max){
			max=bcint(seats[i]["seatno"])
		}
	}
	return max||9
}

// 盲注小盲/大盲判斷: 記錄端 action 皆為 "blind", 用下注金額對照該手 sb/bb 判斷
// (資料表 bbed 欄位實際存的是 isSB, 名稱誤導, 故不直接採用; 僅在無盲注金額時當後備)
function bcblindlabel(lastact,hand){
	let a=String(lastact["action"]||"").toLowerCase()
	if(a=="sb"||a=="smallblind"){ return bctext("actionsb","小盲") }
	if(a=="bb"||a=="bigblind"){ return bctext("actionbb","大盲") }
	let bb=bcint(hand&&hand["bigblind"])
	let chip=bcint(lastact["chip"])
	if(bb>0){
		if(chip>=bb){
			return bctext("actionbb","大盲")
		}
		return bctext("actionsb","小盲")
	}
	if(lastact["bbed"]){
		return bctext("actionsb","小盲")
	}
	return bctext("actionbb","大盲")
}

// 動作 → 翻譯標籤 + 語氣分類
function bcactionmeta(lastact,hand){
	if(!lastact){
		return null
	}
	let a=String(lastact["action"]||"").toLowerCase()
	let allined=lastact["allined"]
	if(allined||a=="allin"){ return { "label": bctext("actionallin","全下"),"cls": "danger" } }
	if(a=="fold"){ return { "label": bctext("actionfold","蓋牌"),"cls": "danger" } }
	if(a=="raise"){ return { "label": bctext("actionraise","加注"),"cls": "aggressive" } }
	if(a=="bet"){ return { "label": bctext("actionbet","下注"),"cls": "aggressive" } }
	if(a=="call"){ return { "label": bctext("actioncall","跟注"),"cls": "neutral" } }
	if(a=="check"){ return { "label": bctext("actioncheck","過牌"),"cls": "neutral" } }
	if(a=="ante"){ return { "label": bctext("actionante","前注"),"cls": "neutral" } }
	if(a=="blind"||a=="sb"||a=="bb"||a=="smallblind"||a=="bigblind"){ return { "label": bcblindlabel(lastact,hand),"cls": "neutral" } }
	if(!a){ return null }
	return { "label": a,"cls": "neutral" }
}

// 從 bittingdata 彙整每座位: 是否蓋牌 / 已投入計分牌 / 最後動作
function bchandactions(hand){
	let rows=hand["bittingdata"]||[]
	let folded={}
	let invested={}
	let last={}
	for(let i=0;i<rows.length;i=i+1){
		let seat=bcint(rows[i]["seatno"])
		let action=String(rows[i]["action"]||"").toLowerCase()
		let allined=rows[i]["allined"]===true||action=="allin"
		if(action=="fold"){
			folded[seat]=true
		}
		invested[seat]=(invested[seat]||0)+bcint(rows[i]["chip"])
		if(action){
			last[seat]={ action: action,allined: allined,chip: bcint(rows[i]["chip"]),bbed: (rows[i]["bbed"]===true||rows[i]["bbed"]=="true") }
		}
	}
	return { folded: folded,invested: invested,last: last }
}

// 把下注金額拆成場次面額, 回傳一疊有色計分牌(最多 5 枚)
function bcchipstack(amount){
	let denoms=(bcchips||[]).slice().sort(function(a,b){ return bcint(b["value"])-bcint(a["value"]) })
	let discs=[]
	let remain=amount
	let cap=5
	for(let i=0;i<denoms.length&&discs.length<cap;i=i+1){
		let value=bcint(denoms[i]["value"])
		if(value<=0){
			continue
		}
		let take=Math.min(Math.floor(remain/value),cap-discs.length)
		for(let j=0;j<take;j=j+1){
			discs.push({ color: denoms[i]["color"]||"#ffffff",shape: denoms[i]["shape"]||"circle" })
		}
		remain=remain-take*value
	}
	if(!discs.length&&denoms.length){
		let d=denoms[denoms.length-1]
		discs.push({ color: d["color"]||"#ffffff",shape: d["shape"]||"circle" })
	}
	let html=""
	for(let i=0;i<discs.length;i=i+1){
		let sq=discs[i]["shape"]=="square"?" square":""
		html=html+`<span class="bc-chipdisc${sq}" style="background:${bcesc(discs[i]["color"])}"></span>`
	}
	return html
}

function bcbethtml(amount,x,y){
	if(!(amount>0)){
		return ""
	}
	return `<div class="bc-bet" style="left:${x}%;top:${y}%"><div class="bc-betchips">${bcchipstack(amount)}</div><div class="bc-betamt">${bcesc(bcfmtamt(amount))}</div></div>`
}

function bcseatposhtml(seat,seatno,x,y,isdealer,folded,actionmeta,invested){
	let dealer=isdealer?`<span class="bc-dealer">D</span>`:""
	if(!seat){
		return `
			<div class="bc-seatpos" style="left:${x}%;top:${y}%">
				<div class="bc-seatbox empty">${dealer}
					<div class="bc-avatar">—</div>
					<div class="bc-name">${bctext("emptyseat")}</div>
					<div class="bc-chip">Seat ${seatno}</div>
					<div class="bc-seatcards"></div>
				</div>
			</div>`
	}
	let win=seat["winnered"]?" win":""
	let foldcls=folded?" folded":""
	let name=bcesc(seat["name"]||("Seat "+seatno))
	// 目前碼量 = 起始碼扣掉本手已投入(例: 43000-5000=38000)
	let chip=bcint(seat["chip"])-bcint(invested)
	if(chip<0){ chip=0 }
	// 蓋牌後底牌收回, 一律顯示牌背；牌背張數依牌型底牌數（Hold'em 2 / Omaha 4）。
	let holecards=bcseatcards(seat)
	let holecount=holecards.length>0?holecards.length:2
	let cardshtml
	if(folded){
		cardshtml=""
		for(let i=0;i<holecount;i=i+1){
			cardshtml=cardshtml+bccardback(true)
		}
	}else{
		cardshtml=bccardsfixed(holecards,holecount,true)
	}
	let actionhtml=actionmeta?`<div class="bc-action ${actionmeta["cls"]}">${bcesc(actionmeta["label"])}</div>`:""
	return `
		<div class="bc-seatpos" style="left:${x}%;top:${y}%">
			<div class="bc-seatbox${win}${foldcls}">${dealer}
				<div class="bc-avatar">${bcesc(bcinitial(seat["name"]))}</div>
				<div class="bc-name">${name}</div>
				<div class="bc-chip">${bcesc(bcfmtamt(chip))}</div>
				<div class="bc-seatcards">${cardshtml}</div>
				${actionhtml}
			</div>
		</div>`
}

// 橢圓牌桌: 座位環繞四周, 中央公共牌 + 底池, 座位前方顯示下注計分牌
function bctablehtml(hand){
	let seats=hand["seatingdata"]||[]
	let byseat={}
	for(let i=0;i<seats.length;i=i+1){
		byseat[bcint(seats[i]["seatno"])]=seats[i]
	}
	let n=bcmaxseatof(hand)
	let dealerseat=bcint(hand["dealerseat"])
	let acts=bchandactions(hand)
	bccurbb=bcint(hand["bigblind"])
	let seatshtml=""
	let bethtml=""
	for(let k=0;k<n;k=k+1){
		let seatno=k+1
		// k=0 落在正下方, 依序環繞
		let theta=(Math.PI/2)+(k/n)*Math.PI*2
		let px=Math.round((50+45*Math.cos(theta))*10)/10
		let py=Math.round((50+41*Math.sin(theta))*10)/10
		let folded=acts["folded"][seatno]===true
		let lastact=acts["last"][seatno]
		let ameta=bcactionmeta(lastact,hand)
		seatshtml=seatshtml+bcseatposhtml(byseat[seatno],seatno,px,py,dealerseat==seatno,folded,ameta,acts["invested"][seatno])
		if(byseat[seatno]&&!folded&&acts["invested"][seatno]>0){
			let bx=Math.round((50+30*Math.cos(theta))*10)/10
			let by=Math.round((50+27*Math.sin(theta))*10)/10
			bethtml=bethtml+bcbethtml(acts["invested"][seatno],bx,by)
		}
	}
	let board=bcboardcards(hand)
	return `
		<div class="bc-tablewrap">
			<div class="bc-felt"></div>
			<div class="bc-center">
				<div class="bc-board">${ptmultiboarded(hand)?bcboardrunhtml(hand,5):bccardsfixed(board,5)}</div>
				<div class="bc-pot">${bctext("pot")} ${bcesc(bcfmtamt(bcpot(hand)))}</div>
			</div>
			${bethtml}
			${seatshtml}
		</div>`
}

function bclatesthtml(hand){
	return `
		<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
			<div class="text-sm font-bold text-zinc-200">${bcesc(hand["tablename"]||hand["tabletoken"]||"-")} · ${bctext("blind")} ${bcesc(bcblindtext(hand))}</div>
			<div class="text-xs text-zinc-500">${bcesc(ptformatdatetime(hand["createtime"]))}</div>
		</div>
		${bctablehtml(hand)}`
}

// TASK-038 顯示 A：多 board 時每個 board 一列，左邊標「第 n 次」。
// 單 board 時不走這裡，畫面與之前完全相同。
function bcboardrunhtml(hand,fixedcount){
	let boardlist=ptboardlistof(hand)
	let html=""
	for(let i=0;i<boardlist.length;i=i+1){
		let item=boardlist[i]
		let cards=[]
		for(let k=0;k<item["board"]["flop"].length;k=k+1){
			cards.push(item["board"]["flop"][k])
		}
		if(item["board"]["turn"]){
			cards.push(item["board"]["turn"])
		}
		if(item["board"]["river"]){
			cards.push(item["board"]["river"])
		}
		html=html+`
			<div class="flex items-center gap-2">
				<span class="shrink-0 rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">${bcesc(bctext("boardrun","Run {n}").replace("{n}",item["runno"]))}</span>
				<span class="flex items-center gap-1">${bccardsfixed(cards,fixedcount)}</span>
			</div>`
	}
	return html
}

function bcrowhtml(hand,index){
	let board=bcboardcards(hand)
	return `
		<div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
			<div class="flex items-center gap-3">
				<span class="text-xs font-mono text-zinc-500">#${index}</span>
				<span class="text-sm text-zinc-300">${bcesc(hand["tablename"]||hand["tabletoken"]||"-")}</span>
				<span class="text-xs text-zinc-500">${bcesc(bcblindtext(hand))}</span>
			</div>
			<div class="flex flex-col items-end gap-1">${ptmultiboarded(hand)?bcboardrunhtml(hand,5):`<div class="flex items-center gap-1">${bccardsfixed(board,5)}</div>`}</div>
		</div>`
}

function bcrender(){
	let latestwrap=document.getElementById("bclatestwrap")
	let latest=document.getElementById("bclatest")
	let list=document.getElementById("bclist")
	if(!bchands.length){
		if(latestwrap){ latestwrap.classList.add("hidden") }
		if(list){ list.innerHTML=`<div class="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-6 text-center text-sm text-zinc-500">${bctext("nohands")}</div>` }
		return
	}
	if(latestwrap){ latestwrap.classList.remove("hidden") }
	if(latest){ latest.innerHTML=bclatesthtml(bchands[0]) }
	let html=""
	for(let i=1;i<bchands.length;i=i+1){
		html=html+bcrowhtml(bchands[i],i+1)
	}
	if(!html){
		html=`<div class="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-6 text-center text-sm text-zinc-500">${bctext("onlyone")}</div>`
	}
	if(list){ list.innerHTML=html }
}

function bcloadhands(){
	if(!bcsessionid||bcloading){
		return
	}
	bcloading=true
	ajax("GET",AJAXURL+"getbroadcasthandlist/"+encodeURIComponent(bcsessionid),function(event,data){
		bcloading=false
		if(data&&data["success"]){
			if(data["session"]){
				let name=document.getElementById("bcname")
				if(name){
					name.textContent=data["session"]["name"]||bctext("unnamed")
				}
				bcmaxseat=bcint(data["session"]["maxseat"])
				bcchips=data["session"]["chips"]||[]
				bcrenderbadge(data["session"])
			}
			bchands=data["data"]||[]
			bcrender()
			if(data["session"]&&data["session"]["broadcasth4h"]===true&&!bchands.length){
				bcnotice(bctext("noticeh4h"))
			}else{
				bcnotice("")
			}
		}else{
			bcnotice(bctext("noticeclosed"))
		}
	})
}

function bcwsurl(){
	let proto=location.protocol=="https:"?"wss:":"ws:"
	let base=location.host
	if(base.endsWith("/")){
		base=base.slice(0,-1)
	}
	// 本頁為公開唯讀轉播: 資料端點 getbroadcasthandlist 只對公開統一紀錄場開放,
	// 後端 handreadallowed 對這類場次也允許匿名連線, 故一律不附 token,
	// 避免 Bearer token 以 query string 進入伺服器日誌
	return proto+"//"+base+WSPREFIX+"hand/"+encodeURIComponent(bcsessionid)+"/"
}

function bcconnectws(){
	if(!bcsessionid){
		return
	}
	let url=bcwsurl()
	try{
		bcws=new WebSocket(url)
	}catch(error){
		bcstatus(bctext("statusoffline"),false)
		return
	}
	bcws.onopen=function(){
		bcstatus(bctext("statuslive"),true)
	}
	bcws.onmessage=function(event){
		let data=json(event.data)
		// 任何手牌事件(新增/編輯/刪除)都重抓最新清單
		if(data&&(data["event"]||data["type"]=="update")){
			bcloadhands()
		}
	}
	bcws.onclose=function(){
		bcws=null
		bcstatus(bctext("statusreconnect"),false)
		if(bcwsretry){ clearTimeout(bcwsretry) }
		bcwsretry=setTimeout(bcconnectws,3000)
	}
	bcws.onerror=function(){
		bcstatus(bctext("statusoffline"),false)
	}
}

// 牌面牌背皮膚(觀眾偏好, 存 localStorage)
function bcapplyskin(skin){
	let valid=["classic","crimson","midnight","royal","ocean","sunset","rose","graphite","minimal"]
	if(valid.indexOf(skin)<0){
		skin="classic"
	}
	// 這一行是逐一列舉的，新增 skin 時漏加會讓切換時舊 class 沒被移除（兩套樣式疊在一起）
	document.body.classList.remove("deck-classic","deck-crimson","deck-midnight","deck-royal","deck-ocean","deck-sunset","deck-rose","deck-graphite","deck-minimal")
	document.body.classList.add("deck-"+skin)
	// TASK-046：轉播頁的下拉是「整套一起換」，所以牌背與牌面都設成同一個值。
	// 真正要分開選是在 profile 的燈箱裡。
	ptcardskinapply(document.body,skin,skin)
	try{
		localStorage.setItem("bc-deck",skin)
		localStorage.setItem(CARDBACKKEY,skin)
		localStorage.setItem(CARDSKINKEY,skin)
	}catch(error){
		// localStorage 不可用時忽略, 皮膚仍會套用於本次瀏覽
	}
	let sel=document.getElementById("bcskin")
	if(sel){
		sel.value=skin
	}
}

// 使用者切換牌背時同步存回帳號, 讓偏好跨裝置一致(與 profile / 手牌回放共用同一來源)
function bcsavedecktoaccount(skin){
	if(typeof ajax!="function"||typeof AJAXURL=="undefined"||typeof weblsget!="function"||typeof WEBLSNAME=="undefined"){
		return
	}
	let token=weblsget(WEBLSNAME+"token")
	if(!token){
		return
	}
	ajax("PUT",AJAXURL+"editusercarddeck",function(event,data){},JSON.stringify({ carddeck: skin }),[
		["Content-Type","application/json"],
		["Authorization","Bearer "+token]
	])
}

function bcinitskin(){
	let saved="classic"
	try{
		// TASK-046：拆分後以牌背為準（下拉本來就是整套換），沒拆分過時 bc-deck 仍是來源
		saved=localStorage.getItem(CARDBACKKEY)||localStorage.getItem("bc-deck")||"classic"
	}catch(error){
		saved="classic"
	}
	bcapplyskin(saved)
	let sel=document.getElementById("bcskin")
	if(sel){
		sel.addEventListener("change",function(){
			bcapplyskin(this.value)
			bcsavedecktoaccount(this.value)
		})
	}
}

// BB 單位切換
function bcupdatebbbtn(){
	let btn=document.getElementById("bcbbtoggle")
	if(!btn){
		return
	}
	if(bcbbmode){
		btn.classList.add("bg-emerald-600","text-white")
		btn.classList.remove("text-zinc-300")
	}else{
		btn.classList.remove("bg-emerald-600","text-white")
		btn.classList.add("text-zinc-300")
	}
}

function bcinitbbtoggle(){
	bcupdatebbbtn()
	let btn=document.getElementById("bcbbtoggle")
	if(btn){
		btn.addEventListener("click",function(){
			bcbbmode=!bcbbmode
			try{
				localStorage.setItem("bc-bbmode",bcbbmode?"1":"0")
			}catch(error){
				// localStorage 不可用時忽略
			}
			bcupdatebbbtn()
			bcrender()
		})
	}
}

bcapplytexts()
bcinitskin()
bcinitbbtoggle()

if(!bcsessionid){
	bcnotice(bctext("noticenosession"))
	bcstatus(bctext("statusnosession"),false)
}else{
	bcloadhands()
	bcconnectws()
	// 定期重抓: 延遲播出時, 手牌到點才會通過後端時間過濾, 需輪詢讓它自動浮現
	setInterval(bcloadhands,15000)
}
