let id=getget("id")
let tablesessionid=0
let tablefirstdealerplace=1
let tableselfseating=1
let tablehands=[]
let tableevchart=null
let tablehandpage=1
let tablehandpagesize=20
let tablehandsortdir=weblsget(WEBLSNAME+"handsortdir")||"desc"

// 依建立時間排序(升/降冪), 不動原陣列
function handsortbytime(rows,dir){
	rows.sort(function(a,b){
		let ca=String(a["createtime"]||"")
		let cb=String(b["createtime"]||"")
		if(ca!=cb){
			return ca<cb?-1:1
		}
		return (parseInt(a["id"])||0)-(parseInt(b["id"])||0)
	})
	if(dir=="desc"){
		rows.reverse()
	}
	return rows
}

function tablesortedhands(){
	return handsortbytime(tablehands.slice(),tablehandsortdir)
}
let seatlog=[]
let date=""
let chip=0
let tablelinkuser=false
let tablecurrentplayers=[]
let tableavailableplayers=[]
let tabletables=[]
let tableplayerbinded=false

// 場次設定的「每桌座位數」允許 2-10，但這個下拉只列常見的 6/8/9/10。
// 場次若設成 7 這種不在清單內的值，select 會變成 selectedIndex=-1、送出空字串，
// 後端 in: 驗證直接回 400，牌桌設定從此存不起來（第一莊家、本人座位都被卡住）。
// 因此載入時若目前值沒有對應 option 就補一個，並依數值插在正確位置。
function ensuremaxseatoption(seatvalue){
	let select=domgetid("maxseat")
	if(!select||!seatvalue){
		return
	}
	let target=String(seatvalue)
	for(let i=0;i<select.options.length;i=i+1){
		if(select.options[i].value==target){
			return
		}
	}
	let option=document.createElement("option")
	option.value=target
	option.textContent=tabletext("seatn").replace("{n}",target)
	let inserted=false
	for(let i=0;i<select.options.length;i=i+1){
		if(int(select.options[i].value)>int(target)){
			select.insertBefore(option,select.options[i])
			inserted=true
			break
		}
	}
	if(!inserted){
		select.appendChild(option)
	}
}

function tabletext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["tablepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["tablepage"][key]||key
}

function settabletext(selector,text){
	let element=document.querySelector(selector)
	if(element){
		element.textContent=text
	}
}

function applytablelanguage(){
	document.title=tabletext("title")+" - PokerTrace"
	settabletext("#tableheading",tabletext("heading"))
	let back=domgetid("back")
	if(back){
		back.textContent=tabletext("back")
	}
	settabletext("#tableguidekicker",tabletext("guidekicker"))
	settabletext("#tableguidedesc",tabletext("guidedesc"))
	settabletext("#tableguideseat",tabletext("guideseat"))
	settabletext("#tableguidehand",tabletext("guidehand"))
	value("#tabletaboverview",tabletext("taboverview"))
	value("#tabletabplayers",tabletext("tabplayers"))
	value("#tabletabhands",tabletext("tabhands"))
	value("#tabletabstats",tabletext("tabstats"))
	value("#tabletabev",tabletext("tabev"))
	settabletext("#tableoverviewhandsummary",tabletext("overviewhandsummary"))
	settabletext("#tabledescriptiontitle",tabletext("descriptiontitle"))
	settabletext("#tablemaxseatlabel",tabletext("maxseat"))
	settabletext("#tablemaxseat6",tabletext("seat6"))
	settabletext("#tablemaxseat8",tabletext("seat8"))
	settabletext("#tablemaxseat9",tabletext("seat9"))
	settabletext("#tablemaxseat10",tabletext("seat10"))
	settabletext("#tablefirstdealerlabel",tabletext("firstdealer"))
	settabletext("#tableselfseatlabel",tabletext("selfseat"))
	let save=domgetid("save")
	if(save){
		save.value=tabletext("save")
	}
	settabletext("#playerpaneltitle",tabletext("currentseat"))
	let mergetarget=domgetid("mergetabletarget")
	if(mergetarget){
		mergetarget.setAttribute("aria-label",tabletext("mergetablearia"))
	}
	value("#mergetablebutton",tabletext("merge"))
	value("#saveplayers",tabletext("saveplayers"))
	settabletext("#tableseathead",tabletext("seat"))
	settabletext("#tablehistoryhead",tabletext("history"))
	settabletext("#tableseatnote",tabletext("seatnote"))
	settabletext("#tablehandrecordtitle",tabletext("handrecord"))
	settabletext("#newhand",tabletext("newhand"))
	settabletext("#stackadjust",tabletext("stackadjust"))
	let handfilterplayer=domgetid("handfilterplayer")
	if(handfilterplayer){
		handfilterplayer.setAttribute("aria-label",tabletext("filterplayeraria"))
		handfilterplayer.placeholder=tabletext("filterplayerplaceholder")
	}
	let handfilterseat=domgetid("handfilterseat")
	if(handfilterseat){
		handfilterseat.setAttribute("aria-label",tabletext("filterseataria"))
		handfilterseat.placeholder=tabletext("filterseatplaceholder")
	}
	let handfilterfrom=domgetid("handfilterfrom")
	if(handfilterfrom){
		handfilterfrom.setAttribute("aria-label",tabletext("filterfromaria"))
	}
	let handfilterto=domgetid("handfilterto")
	if(handfilterto){
		handfilterto.setAttribute("aria-label",tabletext("filtertoaria"))
	}
	value("#handfilterclear",tabletext("filterclear"))
	settabletext("#tablehandheadtable",tabletext("table"))
	settabletext("#tablehandheadseat",tabletext("seat"))
	settabletext("#tablehandheadplayer",tabletext("player"))
	settabletext("#tablehandheadblind",tabletext("blind"))
	settabletext("#tablehandheadhand",tabletext("hand"))
	settabletext("#tablehandheadresult",tabletext("result"))
	settabletext("#tablehandheadcreate",tabletext("createinfo"))
	settabletext("#tablehandheadaction",tabletext("action"))
	settabletext("#tablestatstitle",tabletext("stats"))
	settabletext("#tableevtitle",tabletext("evtitle"))
	settabletext("#tableevdesc",tabletext("evdesc"))
}

function tableunknownchip(player){
	if(!player){
		return false
	}
	if(player["unknownchip"]==true||player["unknownchiped"]==true){
		return true
	}
	if(float(player["chip"])<0){
		return true
	}
	return false
}

function tablechiptext(player,defaultchip){
	if(tableunknownchip(player)){
		return tabletext("unknown")
	}
	return player?(player["chip"]||defaultchip||0):(defaultchip||0)
}

let seatdata=[
	{ seat: 1, history: [] },
	{ seat: 2, history: [] },
	{ seat: 3, history: [] },
	{ seat: 4, history: [] },
	{ seat: 5, history: [] },
	{ seat: 6, history: [] },
	{ seat: 7, history: [] },
	{ seat: 8, history: [] },
	{ seat: 9, history: [] }
]
let tabBtns=document.querySelectorAll('.tab-btn');
let tabContents=document.querySelectorAll('.tab-content');

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

applytablelanguage()

function tableinitialtab(){
	let hash=location.hash.substring(1)
	if(hash){
		let named=document.querySelector('.tab-btn[data-tab="'+hash+'"]')
		if(named){
			return named
		}
		let index=int(hash)
		if(tabBtns[index]){
			return tabBtns[index]
		}
	}
	return tabBtns[0]
}

function tableactivetab(btn,hashupdated){
	if(!btn){
		btn=tabBtns[0]
	}
	if(!btn){
		return
	}
	for(let i=0;i<tabBtns.length;i=i+1){
		tabBtns[i].classList.remove("border-emerald-400","text-emerald-400")
	}
	btn.classList.add("border-emerald-400","text-emerald-400")
	let tab=btn.getAttribute("data-tab")
	for(let i=0;i<tabContents.length;i=i+1){
		tabContents[i].classList.add("hidden")
	}
	let content=domgetid("tab-"+tab)
	if(content){
		content.classList.remove("hidden")
	}
	if(hashupdated){
		let hash="#"+dataset(btn,"id")
		if(location.hash!=hash){
			href(hash)
		}
	}
	if(tab=="stats"){
		renderstats(tablehands,"tablestatscards")
	}
	if(tab=="ev"){
		renderev(tablehands,"evChart")
	}
}

function tablebindtabs(){
	for(let i=0;i<tabBtns.length;i=i+1){
		tabBtns[i].addEventListener("click",function(){
			tableactivetab(this,true)
		})
	}
	window.addEventListener("hashchange",function(){
		tableactivetab(tableinitialtab(),false)
	})
}

function safehtml(value){
	if(value==null||value==undefined){
		return ""
	}
	return String(value)
		.replace(/&/g,"&amp;")
		.replace(/</g,"&lt;")
		.replace(/>/g,"&gt;")
		.replace(/"/g,"&quot;")
		.replace(/'/g,"&#39;")
}

function tableinfocard(label,value,accented){
	return `
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg px-4 py-3 min-h-[78px]">
			<div class="text-xs text-zinc-500 mb-1">${safehtml(label)}</div>
			<div class="text-lg font-bold ${accented?"text-emerald-300":"text-zinc-100"}">${safehtml(value)}</div>
		</div>
	`
}

function tabletime(value){
	let text=String(value||"")
	if(text.indexOf("T")!=-1){
		let parts=text.split("T")
		let time=(parts[1]||"").replace("Z","")
		return time.substring(0,5)
	}
	return "-"
}

function activeplayercount(seating){
	let count=0
	if(tablecurrentplayers&&tablecurrentplayers.length){
		for(let i=0;i<tablecurrentplayers.length;i=i+1){
			if(tablecurrentplayers[i]&&tablecurrentplayers[i]["player"]){
				count=count+1
			}
		}
		return count
	}
	for(let i=0;i<seating.length;i=i+1){
		let item=seating[i]
		let history=item&&item["history"]?item["history"]:[]
		if(history.length&&history[history.length-1]["type"]!="leave"){
			count=count+1
		}
	}
	return count
}

function renderoverview(row,activecount){
	let gamename=(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["gametype"]&&TRANSLATE[LANGUAGE]["gametype"][row["gametype"]])?TRANSLATE[LANGUAGE]["gametype"][row["gametype"]]:row["gametype"]||"-"
	let blind=`${row["smallblind"]||0}/${row["bigblind"]||0}`
	let ante=[]
	if(row["bigblindante"]){
		ante.push("BB Ante "+row["bigblindante"])
	}
	if(row["ante"]){
		ante.push("Ante "+row["ante"])
	}
	if(ante.length){
		blind=blind+" ("+ante.join(" / ")+")"
	}
	innerhtml("#overviewtitle",row["no"]||("#"+(row["token"]||id)))
	innerhtml("#overviewcards",`
		${tableinfocard(tabletext("currentplayers"),activecount+" / "+(row["maxseat"]||9),true)}
		${tableinfocard(tabletext("startchip"),row["chip"]||"-",false)}
		${tableinfocard(tabletext("time"),tabletime(row["starttime"])+" - "+tabletime(row["endtime"]),false)}
		${tableinfocard(tabletext("place"),row["clubname"]||"-",false)}
	`,false)
	let description=String(row["description"]||tabletext("nodescription")).trim()
	innerhtml("#description",description,false)
}

function renderoverviewhandcards(){
	let stat=handstats(tablehands)
	innerhtml("#overviewhandcards",`
		${tableinfocard(tabletext("handcount"),stat["total"],false)}
		${tableinfocard(tabletext("netprofit"),(0<=stat["profit"]?"+":"")+stat["profit"],0<=stat["profit"])}
		${tableinfocard(tabletext("winrate"),(stat["total"]?Math.round(stat["win"]*1000/stat["total"])/10:0)+"%",false)}
		${tableinfocard(tabletext("allincount"),stat["allin"],false)}
	`,false)
}

ajax("GET",AJAXURL+"gettable/"+id,function(event,data){
	if(data["success"]){
		let row=data["data"]

		date=row["starttime"].split("T")[0]
		tablesessionid=row["sessionid"]
		tablefirstdealerplace=parseInt(row["firstdealerplace"])||1
		tableselfseating=parseInt(row["selfseating"])||1
		tablelinkuser=row["linkuser"]?true:false
		if(domgetid("tablebroadcast")&&tablesessionid&&row["broadcastopen"]&&row["unifiedhandrecord"]&&row["owned"]&&row["linkuser"]&&!row["private"]){domgetid("tablebroadcast").href="broadcast.html?sessionid="+encodeURIComponent(tablesessionid);domgetid("tablebroadcast").classList.remove("hidden")}
		tablecurrentplayers=row["currentplayers"]||[]
		tableavailableplayers=row["availableplayers"]||[]
		tabletables=row["tables"]||[]
		chip=row["chip"]
		seatdata=row["seating"]

		ensuremaxseatoption(row["maxseat"])
		value("#maxseat",row["maxseat"],false)

		// 初始化最大座位與莊家
		renderCurrentPlayerTable(row["maxseat"])
		domgetid("maxseat").addEventListener("change",function(){
			// 補 seatdata 長度
			let n=parseInt(this.value)
			while(tablecurrentplayers.length<n){
				tablecurrentplayers.push({ "seatno": tablecurrentplayers.length+1,"player": null })
			}
			renderCurrentPlayerTable(n)
		})
		domgetid("firstdealerplace").addEventListener("change",function(){
			tablefirstdealerplace=parseInt(this.value)||1
		})
		domgetid("selfseating").addEventListener("change",function(){
			tableselfseating=parseInt(this.value)||1
		})

		value("#firstdealerplace",tablefirstdealerplace,false)
		value("#selfseating",tableselfseating,false)

		innerhtml("#tabletoken",row["token"],false)
		innerhtml("#date",date,false)
		renderoverview(row,activeplayercount(seatdata))
		value("#firstdealerplace",tablefirstdealerplace,false)
		value("#selfseating",tableselfseating,false)

		// 頁籤切換
		tablebindtabs()

		// 預設顯示第一個頁籤
		tableactivetab(tableinitialtab(),false)

		domgetid("back").href="session.html?id="+row["sessionid"]+"#1"
		onclick("#back",function(element,event){
			if(event&&event.button!==0){
				return
			}
			if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
				return
			}
			event.preventDefault()
			href("session.html?id="+row["sessionid"]+"#1")
		})
	}else{
		pttoast(tabletext("sessionnotfound"),"error")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
],{
	loadingtarget: "main"
})

onsubmit("#settingform",function(element,event){
	event.preventDefault()

	if(domgetid("save").disabled){
		return
	}

	ptsetsubmitstate(domgetid("save"),true,tabletext("saving"))

	ajax("PUT",AJAXURL+"edittablesetting/"+id,function(event,data){
		if(data["success"]){
			tablefirstdealerplace=parseInt(getvalue("firstdealerplace"))||1
			tableselfseating=parseInt(getvalue("selfseating"))||1
			pttoast(tabletext("savesuccess"),"success")
			ptsetsubmitstate(domgetid("save"),false)
		}else{
			pttoast(data["data"]||tabletext("savefail"),"error")
			ptsetsubmitstate(domgetid("save"),false)
		}
	},str({
		"maxseat": getvalue("maxseat"),
		"firstdealerplace": getvalue("firstdealerplace"),
		"selfseating": getvalue("selfseating")
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})

domgetid("newhand").href="newedithand.html?tableid="+id
if(domgetid("quickhand")){
	domgetid("quickhand").href="quickhand.html?tableid="+id
}
if(domgetid("stackadjust")){
	domgetid("stackadjust").href="stackadjust.html?tableid="+id
}

function cardtext(hand){
	let recordtype=hand["recordtype"]||"hand"
	if(recordtype=="stackadjustment"){
		return tabletext("stackadjust")
	}
	if(recordtype=="brokenhand"){
		return "Broken Hand"
	}
	let handcard=hand["handcard"]||{}
	let board=hand["boardcard"]||{}
	if(typeof handcard=="string"){
		handcard=json(handcard)||{}
	}
	if(typeof board=="string"){
		board=json(board)||{}
	}
	let boardcards=[]
	if(board["flop"]){
		for(let i=0;i<board["flop"].length;i=i+1){
			if(board["flop"][i]){
				boardcards.push(board["flop"][i])
			}
		}
	}
	if(board["turn"]){
		boardcards.push(board["turn"])
	}
	if(board["river"]){
		boardcards.push(board["river"])
	}
	return renderhandcards(handcard,boardcards,!!hand["selfseating"])
}

// 把卡片補滿到固定張數，缺的用「?」（rendercard("") 會回未知牌）
function renderfixedcards(cards,count){
	let html=""
	for(let i=0;i<count;i=i+1){
		html=html+rendercard((cards&&cards[i])||"")
	}
	return html
}

// 跟 handdetail 一致的乾淨排版（無 Hero/Board 文字、中間細分隔線），並像 session 一樣補滿空位：底牌 2 張、公共牌 5 張
function renderhandcards(handcard,boardcards,herovisible){
	let html=`<span class="pt-cardline pt-card-detail">`
	if(herovisible){
		html=html+renderfixedcards([handcard?handcard["card1"]:"",handcard?handcard["card2"]:""],2)
		html=html+`<span class="pt-card-divider"></span>`
	}
	html=html+renderfixedcards(boardcards,5)
	html=html+`</span>`
	return html
}

function cardparts(card){
	let text=String(card||"")
	if(text.length<2){
		return { rank: "?",suit: "",symbol: "?",reded: false }
	}
	let rank=text.substring(0,text.length-1).toUpperCase()
	let suit=text.substring(text.length-1).toLowerCase()
	let symbol="?"
	let reded=false
	if(suit=="s"){
		symbol="♠"
	}else if(suit=="h"){
		symbol="♥"
		reded=true
	}else if(suit=="d"){
		symbol="♦"
		reded=true
	}else if(suit=="c"){
		symbol="♣"
	}
	return { rank: rank,suit: suit,symbol: symbol,reded: reded }
}

function rendercard(card){
	let parts=cardparts(card)
	if(parts["rank"]=="?"){
		return `<span class="pt-card unknown"><span class="pt-card-rank">?</span></span>`
	}
	return `<span class="pt-card ${parts["reded"]?"red":""}" data-suit="${parts["symbol"]}"><span class="pt-card-rank">${parts["rank"]}</span><span class="pt-card-suit">${parts["symbol"]}</span></span>`
}

function rendercardgroup(cards,label){
	let html=`<span class="pt-cardgroup">`
	if(label){
		html=html+`<span class="pt-cardgroup-label">${label}</span>`
	}
	if(!cards||!cards.length){
		html=html+`<span class="pt-card-note">-</span>`
	}else{
		for(let i=0;i<cards.length;i=i+1){
			html=html+rendercard(cards[i])
		}
	}
	html=html+`</span>`
	return html
}

function handdetailurl(hand){
	return "handdetail.html?id="+hand["id"]+"&tableid="+hand["tableid"]+"&sort="+tablehandsortdir
}

function actioninvestmap(hand){
	let data={}
	let rows=hand["bittingdata"]||[]
	for(let i=0;i<rows.length;i=i+1){
		let seat=int(rows[i]["seatno"]||rows[i]["seat"]||0)
		if((rows[i]["action"]||"")=="ante"){
			continue
		}
		if(!data[seat]){
			data[seat]=0
		}
		data[seat]=data[seat]+int(rows[i]["chip"]||0)
	}
	return data
}

function actionstackmap(hand){
	let data={}
	let rows=hand["seatingdata"]||[]
	for(let i=0;i<rows.length;i=i+1){
		let chipvalue=int(rows[i]["chip"]||0)
		if(chipvalue<0||String(rows[i]["specialbutton"]||"").indexOf("UNKNOWN_CHIP")>=0){
			chipvalue=-1
		}
		data[int(rows[i]["seatno"])]=chipvalue
	}
	return data
}

// ante 不算進 running（街上下注額），但判斷 all-in 時要計入總投入，否則盲注＋ante＋下注剛好跟光計分牌會被漏判
function actionanteinvestmap(hand){
	let data={}
	let rows=hand["bittingdata"]||[]
	for(let i=0;i<rows.length;i=i+1){
		if((rows[i]["action"]||"")=="ante"){
			let seat=int(rows[i]["seatno"]||rows[i]["seat"]||0)
			data[seat]=int(data[seat]||0)+int(rows[i]["chip"]||0)
		}
	}
	return data
}

function actionlabel(hand,row,running){
	let seat=int(row["seatno"]||row["seat"]||0)
	let action=row["action"]||""
	if(!running[seat]){
		running[seat]=0
	}
	if(action!="ante"){
		running[seat]=running[seat]+int(row["chip"]||0)
	}
	let stacks=actionstackmap(hand)
	let ante=actionanteinvestmap(hand)
	if(action=="allin"||row["allined"]==true){
		return "Seat "+seat+" ALLIN"
	}
	if(action!="ante"&&0<int(stacks[seat]||0)&&running[seat]+int(ante[seat]||0)>=int(stacks[seat]||0)){
		return "Seat "+seat+" ALLIN"
	}
	let map={ ante: "Ante",blind: "Blind",check: "Check",call: "Call",bet: "Bet",raise: "Raise",fold: "Fold" }
	return "Seat "+seat+" "+(map[action]||action||"-")
}

function actionsummary(hand){
	let rows=hand["bittingdata"]||[]
	let running={}
	let texts=[]
	for(let i=0;i<rows.length;i=i+1){
		let label=actionlabel(hand,rows[i],running)
		if(texts.length<4){
			texts.push(label)
		}
	}
	if(rows.length>4){
		texts.push("...")
	}
	return texts.join(" / ")||"-"
}

function handstats(rows){
	let total=rows.length
	let win=0
	let profit=0
	let best=null
	let worst=null
	let allin=0
	for(let i=0;i<rows.length;i=i+1){
		let result=float(rows[i]["result"]||0)
		profit=profit+result
		if(0<result){
			win=win+1
		}
		if(best===null||best<result){
			best=result
		}
		if(worst===null||result<worst){
			worst=result
		}
		let bitting=rows[i]["bittingdata"]||[]
		let running={}
		let allined=false
		for(let j=0;j<bitting.length;j=j+1){
			let label=actionlabel(rows[i],bitting[j],running)
			if(!allined&&label.indexOf("ALLIN")!=-1){
				allined=true
			}
		}
		if(allined){
			allin=allin+1
		}
	}
	if(0<worst){
		worst=0
	}
	return { total: total,win: win,profit: profit,avg: total?Math.round(profit/total):0,best: best||0,worst: worst||0,allin: allin }
}

function renderstats(rows,containerid){
	let stat=handstats(rows)
	let rate=stat["total"]?Math.round(stat["win"]*1000/stat["total"])/10:0
	let html=`
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${tabletext("handcount")}</div><div class="text-xl font-bold">${stat["total"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${tabletext("netprofit")}</div><div class="text-xl font-bold ${0<=stat["profit"]?"text-green-400":"text-red-400"}">${0<=stat["profit"]?"+":""}${stat["profit"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${tabletext("winrate")}</div><div class="text-xl font-bold">${rate}%</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">AVG</div><div class="text-xl font-bold">${0<=stat["avg"]?"+":""}${stat["avg"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">BEST</div><div class="text-xl font-bold text-green-400">+${stat["best"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">WORST</div><div class="text-xl font-bold text-red-400">${stat["worst"]}</div></div>
		<div class="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4"><div class="text-zinc-400 text-xs">${tabletext("allincount")}</div><div class="text-xl font-bold">${stat["allin"]}</div></div>
	`
	innerhtml("#"+containerid,html,false)
}

function renderev(rows,chartid){
	let labels=[]
	let actual=[]
	let sum=0
	for(let i=rows.length-1;i>=0;i=i-1){
		sum=sum+float(rows[i]["result"]||0)
		labels.push(String(labels.length+1))
		actual.push(sum)
	}
	let chart=echarts.init(domgetid(chartid))
	chart.setOption({
		tooltip: { trigger: "axis" },
		xAxis: { type: "category",data: labels },
		yAxis: { type: "value" },
		series: [{
			name: tabletext("evtitle"),
			type: "line",
			smooth: true,
			data: actual,
			areaStyle: { color: "#22d3ee",opacity: 0.18 },
			lineStyle: { color: "#22d3ee" },
			itemStyle: { color: "#22d3ee" }
		}]
	})
	tableevchart=chart
}

function rendertablehandpager(total){
	let totalpage=Math.max(1,Math.ceil(total/tablehandpagesize))
	if(totalpage<tablehandpage){
		tablehandpage=totalpage
	}
	let start=total?((tablehandpage-1)*tablehandpagesize+1):0
	let end=Math.min(total,tablehandpage*tablehandpagesize)
	innerhtml("#handpager",`
		<div class="text-zinc-400">${tabletext("displayrange")} ${start}-${end} / ${total}</div>
		<div class="flex items-center gap-2">
			<input type="button" class="tablehandpagebtn bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded" data-page="${tablehandpage-1}" ${tablehandpage<=1?"disabled":""} value="${tabletext("prev")}">
			<span class="text-zinc-300">${tablehandpage} / ${totalpage}</span>
			<input type="button" class="tablehandpagebtn bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded" data-page="${tablehandpage+1}" ${totalpage<=tablehandpage?"disabled":""} value="${tabletext("next")}">
		</div>
	`,false)
	onclick(".tablehandpagebtn",function(element,event){
		let page=int(dataset(element,"page")||1)
		if(page<1){
			page=1
		}
		tablehandpage=page
		rendertablehandlist()
	})
}

function handsummarytext(id){
	for(let i=0;i<tablehands.length;i=i+1){
		if(String(tablehands[i]["id"])==String(id)){
			let h=tablehands[i]
			let blind=(h["smallblind"]||0)+"/"+(h["bigblind"]||0)
			let seat=h["selfseating"]||"-"
			let player=h["playername"]||"-"
			return "Blind "+blind+" | Seat "+seat+" | Player "+player
		}
	}
	return ""
}

function rendertablehandlist(){
	let rows=tablesortedhands()
	let totalpage=Math.max(1,Math.ceil(rows.length/tablehandpagesize))
	if(totalpage<tablehandpage){
		tablehandpage=totalpage
	}
	let start=(tablehandpage-1)*tablehandpagesize
	let end=Math.min(rows.length,start+tablehandpagesize)
	let html=""
	for(let i=start;i<end;i=i+1){
		let hand=rows[i]
		let result=float(hand["result"]||0)
		let actions=""
		if(hand["canedit"]){
			// 計分牌校正紀錄要用 stackadjust.html 編輯（newedithand 會把它存成普通手牌）；最新一筆可改計分牌，非最新一筆只能改備註，由該頁判斷
			// 快速手牌為獨立紀錄，用 quickhand.html 編輯（可自由改計分牌、不與其他手牌連動）
			let editurl=`newedithand.html?tableid=${hand["tableid"]}&handid=${hand["id"]}`
			if(hand["recordtype"]=="stackadjustment"){
				editurl=`stackadjust.html?tableid=${hand["tableid"]}&handid=${hand["id"]}`
			}else if(hand["recordtype"]=="quickhand"){
				editurl=`quickhand.html?tableid=${hand["tableid"]}&handid=${hand["id"]}`
			}
			actions=actions+`<a class="text-sky-300 hover:underline mr-2" href="${editurl}">${tabletext("edit")}</a>`
		}
		if(hand["candelete"]){
			actions=actions+`<input type="button" class="deletehand text-red-300 hover:underline" data-id="${hand["id"]}" value="${tabletext("delete")}">`
		}
		let detailurl=handdetailurl(hand)
		html=html+`
			<tr class="handrow border-t border-zinc-700 hover:bg-zinc-700 cursor-pointer" data-url="${detailurl}">
				<td class="relative py-2 px-2">${i+1}<a href="${detailurl}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2">${safehtml(hand["tablename"]||hand["tabletoken"]||"-")}<a href="${detailurl}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2">${safehtml(hand["selfseating"]||"-")}<a href="${detailurl}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2">${safehtml(hand["playername"]||"-")}<a href="${detailurl}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2">${hand["smallblind"]||0}/${hand["bigblind"]||0} (${hand["ante"]||hand["bigblindante"]||0})<a href="${detailurl}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2">${cardtext(hand)}<a href="${detailurl}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2 ${0<=result?"text-green-400":"text-red-400"} font-bold">${0<=result?"+":""}${result}<a href="${detailurl}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="relative py-2 px-2 text-xs text-zinc-400">${safehtml(hand["creatorname"]||"-")}<br>${safehtml(hand["createtime"]||"")}<a href="${detailurl}" class="rowlink absolute inset-0 z-10"></a></td>
				<td class="py-2 px-2" data-stop="true">${actions}</td>
			</tr>
		`
	}
	if(!html){
		html=`<tr><td colspan="9" class="py-6 text-zinc-500">${tabletext("nohands")}</td></tr>`
	}
	innerhtml("#handtable",html,false)
	onclick(".handrow",function(element,event){
		// 只攔截導航用的 rowlink 左鍵改走 SPA；中鍵／Ctrl 交給 <a> 原生（背景開新分頁、不離開本頁）；編輯/刪除照常
		if(!event.target.closest("a.rowlink")){
			return
		}
		if(event&&event.button!==0){
			return
		}
		if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
			return
		}
		event.preventDefault()
		href(dataset(element,"url"))
	})
	onclick(".deletehand",function(element,event){
		let summary=handsummarytext(dataset(element,"id"))
		ptconfirm(tabletext("deletehandconfirm")+tabletext("deletehandconfirmdetail")+(summary?"\n"+summary:""),function(okayed){
			if(!okayed){
				return
			}
			ajax("DELETE",AJAXURL+"deletehand/"+dataset(element,"id"),function(event,data){
				if(data["success"]){
					pttoast(tabletext("deletesuccess"),"success")
					loadhandlist()
				}else{
					pttoast(data["data"]||tabletext("deletefail"),"error")
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	})
	rendertablehandpager(rows.length)
}

function loadhandlist(){
	let qs=[]
	if(getvalue("handfilterplayer")){
		qs.push("playerid="+encodeURIComponent(getvalue("handfilterplayer")))
	}
	if(getvalue("handfilterseat")){
		qs.push("seatno="+encodeURIComponent(getvalue("handfilterseat")))
	}
	if(getvalue("handfilterfrom")){
		qs.push("datefrom="+encodeURIComponent(getvalue("handfilterfrom")))
	}
	if(getvalue("handfilterto")){
		qs.push("dateto="+encodeURIComponent(getvalue("handfilterto")))
	}
	let url=AJAXURL+"gethandlist/"+id
	if(qs.length){
		url=url+"?"+qs.join("&")
	}
	ajax("GET",url,function(event,data){
		if(!data["success"]){
			pttoast(data["data"]||tabletext("loadhandfail"),"error")
			return
		}
		let rows=data["data"]||[]
		tablehands=rows
		renderstats(tablehands,"tablestatscards")
		renderoverviewhandcards()
		tablehandpage=1
		rendertablehandlist()
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#handtable"
	})
}

function bindhandfilters(){
	let ids=["handfilterplayer","handfilterseat","handfilterfrom","handfilterto"]
	for(let i=0;i<ids.length;i=i+1){
		let input=domgetid(ids[i])
		if(input){
			input.addEventListener("change",function(){
				loadhandlist()
			})
			input.addEventListener("keydown",function(event){
				if(event.key=="Enter"){
					event.preventDefault()
					loadhandlist()
				}
			})
		}
	}
	onclick("#handfilterclear",function(element,event){
		value("#handfilterplayer","",false)
		value("#handfilterseat","",false)
		value("#handfilterfrom","",false)
		value("#handfilterto","",false)
		loadhandlist()
	})
	let tablehandsortbtn=domgetid("tablehandsort")
	if(tablehandsortbtn){
		tablehandsortbtn.value=tabletext("sorttime")+" "+(tablehandsortdir=="desc"?"↓":"↑")
	}
	onclick("#tablehandsort",function(element,event){
		tablehandsortdir=(tablehandsortdir=="desc")?"asc":"desc"
		weblsset(WEBLSNAME+"handsortdir",tablehandsortdir)
		element.value=tabletext("sorttime")+" "+(tablehandsortdir=="desc"?"↓":"↑")
		tablehandpage=1
		rendertablehandlist()
	})
}

function connecthandws(){
	if(!tablesessionid){
		return
	}
	let proto=location.protocol=="https:"?"wss:":"ws:"
	try{
		let ws=new WebSocket(proto+"//"+location.host+WSPREFIX+"hand/"+tablesessionid+"/")
		ws.onmessage=function(event){
			let data=json(event.data)
			if(data&&data["event"]){
				loadhandlist()
			}
		}
	}catch(error){
		// WS 訊息解析錯誤，靜默忽略以免影響牌桌頁
	}
}

bindhandfilters()
loadhandlist()
setTimeout(connecthandws,300)

// 選手頁籤動態座位與莊家設定
function tableauthheaders(){
	return [
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	]
}

function reloadtablepage(){
	location.reload()
}

function ensurecurrentplayers(maxseat){
	for(let i=0;i<maxseat;i=i+1){
		if(!tablecurrentplayers[i]){
			tablecurrentplayers[i]={ "seatno": i+1,"player": null }
		}
		tablecurrentplayers[i]["seatno"]=i+1
	}
	if(maxseat<tablecurrentplayers.length){
		tablecurrentplayers=tablecurrentplayers.slice(0,maxseat)
	}
}

function renderseatsettingselects(maxseat){
	let dealerSelect=domgetid("firstdealerplace")
	let selfseating=domgetid("selfseating")
	let olddealer=dealerSelect.value||tablefirstdealerplace
	let oldselfseating=selfseating.value||tableselfseating
	dealerSelect.innerHTML=""
	selfseating.innerHTML=""
	for(let i=1;i<=maxseat;i=i+1){
		let opt=doccreate("option")
		let opt1=doccreate("option")
		opt.value=i
		opt1.value=i
		opt.textContent=tabletext("seat")+" "+i
		opt1.textContent=tabletext("seat")+" "+i
		dealerSelect.appendChild(opt)
		selfseating.appendChild(opt1)
	}
	if(olddealer&&parseInt(olddealer)<=parseInt(maxseat)){
		dealerSelect.value=olddealer
	}else{
		dealerSelect.value=1
	}
	if(oldselfseating&&parseInt(oldselfseating)<=parseInt(maxseat)){
		selfseating.value=oldselfseating
	}else{
		selfseating.value=1
	}
}

function tableoptionhtml(currentid){
	let html=`<option value="">${tabletext("moveplaceholder")}</option>`
	for(let i=0;i<tabletables.length;i=i+1){
		if(String(tabletables[i]["id"])==String(currentid)){
			continue
		}
		html=html+`<option value="${tabletables[i]["id"]}">${safehtml(tabletables[i]["no"]||tabletables[i]["token"]||"-")}</option>`
	}
	return html
}

function rendermergetableoptions(){
	let html=`<option value="">${tabletext("selecttargettable")}</option>`
	for(let i=0;i<tabletables.length;i=i+1){
		if(String(tabletables[i]["id"])==String(id)){
			continue
		}
		// 已關閉的桌不可作為併桌目標
		if(tabletables[i]["closedtime"]){
			continue
		}
		html=html+`<option value="${tabletables[i]["id"]}">${safehtml(tabletables[i]["no"]||tabletables[i]["token"]||"-")}</option>`
	}
	innerhtml("#mergetabletarget",html,false)
}

function playerselecthtml(seatno,player){
	let selected=player&&player["sessionplayerid"]?String(player["sessionplayerid"]):""
	let html=`<select class="tableplayerselect bg-zinc-700 text-white rounded px-2 py-2 text-sm min-w-[220px]" data-seat="${seatno}">`
	html=html+`<option value="">${tabletext("emptyseat")}</option>`
	for(let i=0;i<tableavailableplayers.length;i=i+1){
		let item=tableavailableplayers[i]
		let text=(item["name"]||"-")+" / "+(item["playerid"]||"")
		if(item["tableid"]&&String(item["tableid"])!=String(id)){
			text=text+" ("+(item["tablename"]||item["tabletoken"]||tabletext("othertable"))+")"
		}
		html=html+`<option value="${item["sessionplayerid"]}" ${String(item["sessionplayerid"])==selected?"selected":""}>${safehtml(text)}</option>`
	}
	html=html+`</select>`
	return html
}

function renderCurrentPlayerTable(maxSeat){
	let maxseat=parseInt(maxSeat)||9
	ensurecurrentplayers(maxseat)
	renderseatsettingselects(maxseat)
	rendermergetableoptions()
	let tbody=domgetid("seat-player-table-body")
	if(tbody&&tbody.parentNode&&tbody.parentNode.querySelector("thead tr")){
		tbody.parentNode.querySelector("thead tr").innerHTML=`
			<th class="py-2 px-2">${tabletext("seat")}</th>
			<th class="py-2 px-2">${tabletext("currentplayers")}</th>
			<th class="py-2 px-2">${tabletext("startchip")}</th>
			<th class="py-2 px-2">${tabletext("action")}</th>
		`
	}
	if(tablelinkuser){
		innertext("#playerpanelnote",tabletext("linkedplayernote"),false)
	}else{
		innertext("#playerpanelnote",tabletext("genericplayernote"),false)
	}
	let html=""
	for(let i=0;i<maxseat;i=i+1){
		let seatno=i+1
		let current=tablecurrentplayers[i]||{ "seatno": seatno,"player": null }
		let player=current["player"]
		let unknowned=tableunknownchip(player)
		let chipvalue=unknowned?-1:(player?(player["chip"]||chip||0):(chip||0))
		let playercell=""
		if(tablelinkuser){
			playercell=playerselecthtml(seatno,player)
		}else{
			playercell=`<input type="text" class="tablenameinput bg-zinc-700 text-white rounded px-2 py-2 text-sm min-w-[220px]" data-seat="${seatno}" value="${safehtml(player?player["name"]||"":"")}" placeholder="${tabletext("playernameplaceholder")}">`
		}
		let movehtml=`<select class="movetabletarget bg-zinc-700 text-white rounded px-2 py-2 text-xs" data-seat="${seatno}">${tableoptionhtml(id)}</select>`
		let disabled=player?"":"disabled"
		html=html+`
			<tr class="border-t border-zinc-700">
				<td class="py-2 px-2 text-center font-bold">${tabletext("seat")} ${seatno}</td>
				<td class="py-2 px-2">${playercell}</td>
				<td class="py-2 px-2">
					<div class="flex flex-wrap items-center gap-2">
						<input type="number" class="tablechipinput bg-zinc-700 text-white rounded px-2 py-2 text-sm w-28" data-seat="${seatno}" inputmode="numeric" value="${chipvalue}" ${unknowned?"disabled":""}>
						<label class="text-xs text-zinc-300 flex items-center gap-1"><input type="checkbox" class="tableunknownchip" data-seat="${seatno}" ${unknowned?"checked":""}> ${tabletext("unknownstack")}</label>
					</div>
				</td>
				<td class="py-2 px-2">
					<div class="flex flex-wrap gap-2">
						<input type="button" class="clearseat bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-xs" data-seat="${seatno}" value="${tabletext("clearseat")}" ${disabled}>
						<input type="button" class="eliminateseat bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs" data-seat="${seatno}" value="${tabletext("bustseat")}" ${disabled}>
						${movehtml}
						<input type="button" class="moveseat bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-xs" data-seat="${seatno}" value="${tabletext("moveseat")}" ${disabled}>
					</div>
				</td>
			</tr>
		`
	}
	if(!html){
		html=`<tr><td colspan="4" class="py-6 text-zinc-500 text-center">${tabletext("noseats")}</td></tr>`
	}
	innerhtml("#seat-player-table-body",html,false)
	bindCurrentPlayerActions()
}

function playerbyid(sessionplayerid){
	for(let i=0;i<tableavailableplayers.length;i=i+1){
		if(String(tableavailableplayers[i]["sessionplayerid"])==String(sessionplayerid)){
			return tableavailableplayers[i]
		}
	}
	return null
}

function applycurrentinputs(){
	let maxseat=parseInt(getvalue("maxseat"))||9
	ensurecurrentplayers(maxseat)
	for(let i=0;i<maxseat;i=i+1){
		let seatno=i+1
		let chipinput=document.querySelector(".tablechipinput[data-seat='"+seatno+"']")
		let unknowninput=document.querySelector(".tableunknownchip[data-seat='"+seatno+"']")
		let unknowned=unknowninput?unknowninput.checked:false
		let chipvalue=unknowned?-1:(chipinput?float(chipinput.value||0):0)
		if(tablelinkuser){
			let select=document.querySelector(".tableplayerselect[data-seat='"+seatno+"']")
			let sessionplayerid=select?select.value:""
			if(sessionplayerid){
				let item=playerbyid(sessionplayerid)
				tablecurrentplayers[i]["player"]={
					"sessionplayerid": sessionplayerid,
					"userid": item?item["userid"]:null,
					"name": item?item["name"]:"",
					"playerid": item?item["playerid"]:"",
					"chip": chipvalue,
					"unknownchip": unknowned
				}
			}else{
				tablecurrentplayers[i]["player"]=null
			}
		}else{
			let input=document.querySelector(".tablenameinput[data-seat='"+seatno+"']")
			let name=input?input.value.trim():""
			if(name){
				tablecurrentplayers[i]["player"]={
					"name": name,
					"chip": chipvalue,
					"unknownchip": unknowned
				}
			}else{
				tablecurrentplayers[i]["player"]=null
			}
		}
	}
}

let savingtableplayers=false

function savecurrentplayers(done){
	if(savingtableplayers){
		return
	}
	applycurrentinputs()
	let rows=[]
	for(let i=0;i<tablecurrentplayers.length;i=i+1){
		let player=tablecurrentplayers[i]["player"]
		if(player){
			let row={
				"seatno": tablecurrentplayers[i]["seatno"],
				"chip": player["chip"]||0,
				"unknownchip": tableunknownchip(player)
			}
			if(tablelinkuser){
				row["sessionplayerid"]=player["sessionplayerid"]
			}else{
				row["name"]=player["name"]||""
			}
			rows.push(row)
		}
	}
	savingtableplayers=true
	let saveplayersbtn=domgetid("saveplayers")
	if(saveplayersbtn){
		saveplayersbtn.disabled=true
	}
	ajax("PUT",AJAXURL+"savetableplayers/"+id,function(event,data){
		savingtableplayers=false
		if(saveplayersbtn){
			saveplayersbtn.disabled=false
		}
		if(data["success"]){
			if(done){
				done()
				return
			}
			pttoast(tabletext("saveplayers"),"success")
			reloadtablepage()
		}else{
			pttoast(data["data"]||tabletext("savefail"),"error")
		}
	},str({ "players": rows }),tableauthheaders(),{
		loadingtarget: "#seat-player-table-body"
	})
}

function bindCurrentPlayerActions(){
	if(!tableplayerbinded){
		tableplayerbinded=true
		domgetid("saveplayers").addEventListener("click",function(event){
			savecurrentplayers()
		})
		domgetid("mergetablebutton").addEventListener("click",function(event){
			let targettableid=getvalue("mergetabletarget")
			if(!targettableid){
				pttoast(tabletext("selecttargettableerror"),"error")
				return
			}
			let mergeselect=domgetid("mergetabletarget")
			let targetname=mergeselect&&mergeselect.selectedOptions&&mergeselect.selectedOptions[0]?mergeselect.selectedOptions[0].textContent.trim():""
			ptconfirm(tabletext("mergeconfirm").replace("{table}",targetname||tabletext("targettable")),function(okayed){
				if(!okayed){
					return
				}
				ajax("POST",AJAXURL+"mergetableplayers/"+id,function(event,data){
					if(data["success"]){
						pttoast(tabletext("mergesuccess"),"success")
						reloadtablepage()
					}else{
						pttoast(data["data"]||tabletext("mergefail"),"error")
					}
				},str({ "targettableid": targettableid }),tableauthheaders(),{
					loadingtarget: "#seat-player-table-body"
				})
			})
		})
	}
	onclick(".clearseat",function(element,event){
		let seatno=int(dataset(element,"seat")||0)
		if(0<seatno&&seatno<=tablecurrentplayers.length){
			tablecurrentplayers[seatno-1]["player"]=null
			renderCurrentPlayerTable(getvalue("maxseat"))
		}
	})
	onclick(".tableunknownchip",function(element,event){
		let seatno=int(dataset(element,"seat")||0)
		let chipinput=document.querySelector(".tablechipinput[data-seat='"+seatno+"']")
		if(chipinput){
			chipinput.disabled=element.checked
			if(element.checked){
				chipinput.value=-1
			}else if(float(chipinput.value)<0){
				chipinput.value=chip||0
			}
		}
	})
	onclick(".eliminateseat",function(element,event){
		applycurrentinputs()
		let seatno=int(dataset(element,"seat")||0)
		if(seatno<=0||tablecurrentplayers.length<seatno||!tablecurrentplayers[seatno-1]["player"]){
			return
		}
		let player=tablecurrentplayers[seatno-1]["player"]
		let playername=player&&player["name"]?player["name"]:tabletext("thisplayer")
		ptconfirm(tabletext("bustconfirm").replace("{seat}",seatno).replace("{player}",playername),function(okayed){
			if(!okayed){
				return
			}
			let body={ "seatno": seatno }
			if(tablelinkuser){
				body["sessionplayerid"]=player["sessionplayerid"]
			}
			ajax("POST",AJAXURL+"eliminatetableplayer/"+id,function(event,data){
				if(data["success"]){
					pttoast(tabletext("bustsuccess"),"success")
					reloadtablepage()
				}else{
					pttoast(data["data"]||tabletext("bustfail"),"error")
				}
			},str(body),tableauthheaders(),{
				loadingtarget: "#seat-player-table-body"
			})
		})
	})
	onclick(".moveseat",function(element,event){
		applycurrentinputs()
		let seatno=int(dataset(element,"seat")||0)
		let target=document.querySelector(".movetabletarget[data-seat='"+seatno+"']")
		let targettableid=target?target.value:""
		if(!targettableid){
			pttoast(tabletext("selecttargettableerror"),"error")
			return
		}
		let player=tablecurrentplayers[seatno-1]["player"]
		let body={ "seatno": seatno,"targettableid": targettableid }
		if(tablelinkuser&&player){
			body["sessionplayerid"]=player["sessionplayerid"]
		}
		ajax("POST",AJAXURL+"movetableplayer/"+id,function(event,data){
			if(data["success"]){
				pttoast(tabletext("movesuccess"),"success")
				reloadtablepage()
			}else{
				pttoast(data["data"]||tabletext("movefail"),"error")
			}
		},str(body),tableauthheaders(),{
			loadingtarget: "#seat-player-table-body"
		})
	})
}
