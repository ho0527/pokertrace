// 報名收據四聯單 — 參照 POKER DREAM 實體收據格式
// 四聯：店家聯 HOUSE / 選手聯 PLAYER / 發牌聯 DEALER / 桌面聯 TABLE
// 可被其他頁（如 register）載入：呼叫 receiptprint(data) 列印指定選手的四聯單。
// 單獨開 receipt.html 時，用下方 RECEIPTSAMPLE 範例資料預覽版面。

const RECEIPTSAMPLE={
	"seriestitle": "",
	"venue": "POKER DREAM 23 TAIWAN",
	"event": "#F2 Freeroll to Ultra Stack - CAP 150",
	"starttime": "2026-06-29 12:00:00",
	"playername": "HO HAO-CHUN",
	"entryno": "54",
	"buyin": "NT$ 0",
	"payment": "",
	"issuedate": "2026-06-29 12:07:39",
	"issuer": "Rurul",
	"tableno": "",
	"seatno": "",
	"qrdata": "https://pokertrace.example/frontend/checkin.html?sessionid=123&r=456"
}

// 每一聯要顯示哪些區塊。共通抬頭（logo / 標題 / 賽事 / 選手 / 號碼 / QR）四聯都有。
const COPYLIST=[
	{"key": "house","label": "HOUSE COPY","sections": ["buyin","issue","stamp"]},
	{"key": "player","label": "PLAYER COPY","sections": ["buyin","issue","attention"]},
	{"key": "dealer","label": "DEALER COPY","sections": ["seat","issue","stamp"]},
	{"key": "table","label": "TABLE COPY","sections": ["tablenotice"]}
]

// 開始時間只取到分鐘（YYYY-MM-DD HH:mm），不顯示秒。
function receiptminute(value){
	if(value==null||value==""){
		return ""
	}
	let text=String(value).replace("T"," ").replace("Z","").trim()
	if(16<=text.length){
		return text.substring(0,16)
	}
	return text
}

function receiptescape(value){
	if(value==null){
		return ""
	}
	return String(value)
		.replace(/&/g,"&amp;")
		.replace(/</g,"&lt;")
		.replace(/>/g,"&gt;")
}

// 有值就顯示，沒值就給一條可手寫的空白底線。
// 注意：不可用 value=="" 判空，因為 JS 裡 0=="" 為 true，會讓真正的 0（例如 0 元獎金）印成空白底線。
function receiptfield(value){
	let emptyed=false
	if(value==undefined||value==null){
		emptyed=true
	}
	if(typeof value=="string"&&value.length==0){
		emptyed=true
	}
	if(emptyed){
		return `<span class="receiptblankinline"></span>`
	}
	return receiptescape(value)
}

function receipthassection(copy,key){
	return copy["sections"].indexOf(key)!=-1
}

// 產生真正可掃描的 QR（需載入 qrcode.js）。text 為要編碼的內容（報到 / 驗證網址）。
function receiptqr(text){
	if(typeof qrmatrix!="function"){
		return ""
	}
	if(text==null||text==""){
		text=" "
	}
	let qr=qrmatrix(String(text),"M")
	if(!qr){
		return ""
	}
	let quiet=4
	let cell=4
	let dim=(qr["size"]+quiet*2)*cell
	let rects=""
	for(let y=0;y<qr["size"];y=y+1){
		for(let x=0;x<qr["size"];x=x+1){
			if(qr["modules"][y][x]){
				rects=rects+`<rect x="${(x+quiet)*cell}" y="${(y+quiet)*cell}" width="${cell}" height="${cell}"></rect>`
			}
		}
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}" class="receiptqrsvg"><rect x="0" y="0" width="${dim}" height="${dim}" fill="#ffffff"></rect><g fill="#000000">${rects}</g></svg>`
}

function receiptkvgroup(pairs){
	let html=`<div class="receiptkvgroup">`
	for(let i=0;i<pairs.length;i=i+1){
		html=html+`<div class="receiptkv"><span class="receiptkvlabel">${pairs[i][0]}</span> <span class="receiptkvvalue">${pairs[i][1]}</span></div>`
	}
	html=html+`</div>`
	return html
}

function receiptseatsection(data){
	return `
		<div class="receiptseatrow">
			<div class="receiptseatbox">
				<div class="receiptseatlabel">TABLE 桌號</div>
				<div class="receiptseatvalue">${receiptfield(data["tableno"])}</div>
			</div>
			<div class="receiptseatbox">
				<div class="receiptseatlabel">SEAT 座位</div>
				<div class="receiptseatvalue">${receiptfield(data["seatno"])}</div>
			</div>
		</div>
	`
}

function receiptstampsection(){
	return `
		<div class="receiptstamp"></div>
	`
}

function receiptattentionsection(){
	return `
		<div class="receiptnotice">
			<div class="receiptnoticetitle">--- ATTENTION: RULE ON CHIP STACKS IN PLAY ---</div>
			<div class="receiptnoticebody">Players who collect their table and seat assignment will have their stacks put into play when all of their seat numbers have been collected.</div>
		</div>
	`
}

function receipttablenoticesection(){
	return `
		<div class="receipttablenotice">--ALWAYS SHOW ON TABLE--</div>
	`
}

// 置中抬頭：logo、系列賽/場館、賽事、開賽時間、分隔線（不含選手名）。
function receiptheader(data){
	// 第二行標題：有系列賽就顯示系列賽 title，否則顯示場館名。
	let titleline=data["seriestitle"]
	if(titleline==null||titleline==""){
		titleline=data["venue"]
	}
	return `
		<div class="receiptlogorow"><img src="../material/icon/logo.png" alt="PokerTrace" class="receiptlogoimg"></div>
		<div class="receipttitleline">${receiptescape(titleline)}</div>
		<div class="receiptevent">${receiptescape(data["event"])}</div>
		<div class="receiptdatetime">${receiptescape(receiptminute(data["starttime"]))}</div>
		<div class="receiptdivider"></div>
	`
}

// 給獎金收據用：抬頭 + 置中選手名。
function receiptcommon(data){
	return receiptheader(data)+`<div class="receiptname">${receiptfield(data["playername"])}</div>`
}

function receiptslip(data,copy){
	let bigclass="receiptbig"
	if(data["entryno"]!=null&&data["entryno"]!=""&&isNaN(data["entryno"])){
		bigclass="receiptbig receiptbigtext"
	}
	// 下半部靠左：選手名 →（入場編號 + QR 同一列）→ 買入/付款 → 座位 → 開立資訊。
	let body=`<div class="receiptname">${receiptfield(data["playername"])}</div>`
	body=body+`
		<div class="receiptidrow">
			<div class="${bigclass}">${receiptfield(data["entryno"])}</div>
			<div class="receiptqr">${receiptqr(data["qrdata"]||data["entryno"])}</div>
		</div>
	`
	if(receipthassection(copy,"buyin")){
		body=body+receiptkvgroup([
			["BUY-IN:",receiptfield(data["buyin"])],
			["PAYMENT:",receiptfield(data["payment"])]
		])
	}
	if(receipthassection(copy,"seat")){
		body=body+receiptseatsection(data)
	}
	if(receipthassection(copy,"issue")){
		body=body+receiptkvgroup([
			["ISSUE DATE:",receiptfield(data["issuedate"])],
			["ISSUER:",receiptfield(data["issuer"])]
		])
	}
	let html=receiptheader(data)+`<div class="receiptbody">${body}</div>`
	html=html+`<div class="receiptcopylabel">--- ${receiptescape(copy["label"])} ---</div>`
	if(receipthassection(copy,"stamp")){
		html=html+receiptstampsection()
	}
	if(receipthassection(copy,"attention")){
		html=html+receiptattentionsection()
	}
	if(receipthassection(copy,"tablenotice")){
		html=html+receipttablenoticesection()
	}
	return `<div class="receiptslip" data-copy="${copy["key"]}">${html}</div>`
}

// 組出四聯（含裁切線）的內容 HTML。
function receiptsheethtml(data){
	let html=""
	for(let i=0;i<COPYLIST.length;i=i+1){
		html=html+receiptslip(data,COPYLIST[i])
		if(i<COPYLIST.length-1){
			html=html+`<div class="receiptcutline">- - - - - - - - - - - - - - - - - - - - - - - - - -</div>`
		}
	}
	return html
}

// 設定列印紙張為 80mm 連續紙（收據）。與 print.js 的名單列印共用同一個 <style> 節點，
// 每次列印前各自設定，避免 80mm 與 A4 互相殘留。
function receiptsetpagestyle(){
	let el=document.getElementById("ptpagestyle")
	if(!el){
		el=document.createElement("style")
		el.id="ptpagestyle"
		document.head.appendChild(el)
	}
	el.textContent="@page{size:80mm auto;margin:0}"
}

// 供其他頁呼叫：列印指定選手的四聯收據。
// 有 print.js 時用共用列印容器 #ptprintroot（列印時只顯示它）；否則退回頁面既有的 #receiptsheet。
function receiptprint(data){
	let root=null
	if(typeof ptprintcontainer=="function"){
		root=ptprintcontainer()
		root.innerHTML=`<div class="receiptsheet">${receiptsheethtml(data)}</div>`
	}else{
		root=document.getElementById("receiptsheet")
		if(!root){
			return
		}
		root.innerHTML=receiptsheethtml(data)
	}
	receiptsetpagestyle()
	window.print()
}

// ===== 獎金發放收據（2 聯：店家聯 + 選手聯），供員工在報到頁列印 =====
const PRIZECOPYLIST=[
	{"key": "house","label": "HOUSE COPY","sections": ["sign","stamp"]},
	{"key": "player","label": "PLAYER COPY","sections": ["sign"]}
]

function receiptsignsection(){
	return `
		<div class="receiptsignrow">
			<div class="receiptsignline"></div>
			<div class="receiptsignlabel">領獎人簽名 Signature</div>
		</div>
	`
}

function receiptprizeslip(data,copy){
	let html=receiptcommon(data)
	html=html+`<div class="receiptprizerankline">名次 Place ${receiptfield(data["place"])}</div>`
	html=html+`<div class="receiptprizelabel">獎金 PRIZE</div>`
	html=html+`<div class="receiptprizeamount">${receiptfield(data["prize"])}</div>`
	html=html+receiptkvgroup([
		["入場編號 Entry",receiptfield(data["entryno"])]
	])
	html=html+`<div class="receiptqr">${receiptqr(data["qrdata"]||data["entryno"])}</div>`
	html=html+receiptkvgroup([
		["ISSUE DATE:",receiptfield(data["issuedate"])],
		["ISSUER:",receiptfield(data["issuer"])]
	])
	html=html+`<div class="receiptcopylabel">--- ${receiptescape(copy["label"])} ---</div>`
	if(receipthassection(copy,"sign")){
		html=html+receiptsignsection()
	}
	if(receipthassection(copy,"stamp")){
		html=html+receiptstampsection()
	}
	return `<div class="receiptslip" data-copy="prize-${copy["key"]}">${html}</div>`
}

function receiptprizesheethtml(data){
	let html=""
	for(let i=0;i<PRIZECOPYLIST.length;i=i+1){
		html=html+receiptprizeslip(data,PRIZECOPYLIST[i])
		if(i<PRIZECOPYLIST.length-1){
			html=html+`<div class="receiptcutline">- - - - - - - - - - - - - - - - - - - - - - - - - -</div>`
		}
	}
	return html
}

// 供報到頁呼叫：列印指定選手的獎金發放收據（兩聯）。
function receiptprizeprint(data){
	let root=null
	if(typeof ptprintcontainer=="function"){
		root=ptprintcontainer()
		root.innerHTML=`<div class="receiptsheet">${receiptprizesheethtml(data)}</div>`
	}else{
		root=document.getElementById("receiptsheet")
		if(!root){
			return
		}
		root.innerHTML=receiptprizesheethtml(data)
	}
	receiptsetpagestyle()
	window.print()
}

// 單獨開 receipt.html 時：用範例資料把版面渲染到頁面上的 #receiptsheet。
let receiptsheet=document.getElementById("receiptsheet")
if(receiptsheet){
	receiptsheet.innerHTML=receiptsheethtml(RECEIPTSAMPLE)
}

let printbutton=document.getElementById("printreceipt")
if(printbutton){
	printbutton.addEventListener("click",function(){
		receiptsetpagestyle()
		window.print()
	})
}

let backbutton=document.getElementById("backsession")
if(backbutton){
	backbutton.addEventListener("click",function(){
		history.back()
	})
}
