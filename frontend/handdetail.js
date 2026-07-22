let handid=getget("id")
let tableid=getget("tableid")
let sessionid=getget("sessionid")
let currenthand=null

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

// handdetail 動態渲染的字串多語表；靜態標題另由 applyhanddetailstatic 套用
const HANDDETAILTEXT={
	"zhtw": {
		"cardstitle": "牌面",
		"myhandtitle": "我的底牌",
		"seatingtitle": "座位與結果",
		"actionstitle": "下注歷程",
		"notetitle": "備註",
		"colseat": "座位",
		"colplayer": "選手",
		"colhand": "手牌",
		"colstart": "起始",
		"colend": "結束",
		"colresult": "結果",
		"edit": "編輯",
		"privatefilled": "已補私有底牌",
		"privatemissing": "尚未補我的底牌",
		"hidden": "未公開",
		"privatenoteprefix": "Seat ",
		"privatenotesuffix": " 的私有紀錄，只會顯示給本人。",
		"firstcard": "第一張",
		"secondcard": "第二張",
		"privatenote": "私人備註",
		"savemyhand": "儲存我的底牌",
		"saving": "儲存中...",
		"saved": "已儲存",
		"savefail": "儲存失敗",
		"lead": "領先",
		"outs": "補牌",
		"chop": "分池",
		"backdoor": "後門聽牌",
		"drawingdead": "聽死牌",
		"splitpot": "平分底池",
		"needflop": "需要翻牌",
		"allinequity": "All-in 勝率",
		"solving": "All-in 勝率解算中…",
		"hand": "手牌",
		"record": "紀錄",
		"publicrecord": "公共紀錄",
		"blind": "盲注",
		"blindslabel": "盲注",
		"totalpot": "總底池",
		"herohand": "Hero 手牌",
		"nohero": "未指定 Hero，選手可各自補自己的底牌。",
		"board": "公共牌",
		"burn": "燒牌",
		"unknown": "未知",
		"start": "起始",
		"end": "結束",
		"leftbeforesubmit": "送出前已離桌",
		"noseating": "沒有座位資料",
		"loadfail": "讀取手牌失敗",
		"preflop": "翻牌前",
		"exportjson": "匯出 JSON",
		"exportdone": "已匯出手牌 JSON",
		"exportnodata": "手牌尚未載入完成"
	},
	"en": {
		"cardstitle": "Board",
		"myhandtitle": "My Cards",
		"seatingtitle": "Seats & Results",
		"actionstitle": "Action History",
		"notetitle": "Notes",
		"colseat": "Seat",
		"colplayer": "Player",
		"colhand": "Hand",
		"colstart": "Start",
		"colend": "End",
		"colresult": "Result",
		"edit": "Edit",
		"privatefilled": "Private cards saved",
		"privatemissing": "Your cards not added yet",
		"hidden": "Hidden",
		"privatenoteprefix": "Private record for Seat ",
		"privatenotesuffix": ", visible only to you.",
		"firstcard": "First card",
		"secondcard": "Second card",
		"privatenote": "Private note",
		"savemyhand": "Save my cards",
		"saving": "Saving...",
		"saved": "Saved",
		"savefail": "Save failed",
		"lead": "Ahead",
		"outs": "Outs",
		"chop": "Chop",
		"backdoor": "Backdoor draw",
		"drawingdead": "Drawing dead",
		"splitpot": "Split pot",
		"needflop": "Need flop",
		"allinequity": "All-in Equity",
		"solving": "Solving all-in equity…",
		"hand": "Hand",
		"record": "Record",
		"publicrecord": "Public record",
		"blind": "Blind",
		"blindslabel": "Blinds",
		"totalpot": "Total Pot",
		"herohand": "Hero Cards",
		"nohero": "No Hero set; players can add their own cards.",
		"board": "Board",
		"burn": "Burn",
		"unknown": "Unknown",
		"start": "Start",
		"end": "End",
		"leftbeforesubmit": "Left before submission",
		"noseating": "No seat data",
		"loadfail": "Failed to load hand",
		"preflop": "Preflop",
		"exportjson": "Export JSON",
		"exportdone": "Hand JSON exported",
		"exportnodata": "Hand not loaded yet"
	}
}

function hdt(key){
	let pack=HANDDETAILTEXT[LANGUAGE]||HANDDETAILTEXT["zhtw"]
	if(pack[key]!=undefined){
		return pack[key]
	}
	return HANDDETAILTEXT["zhtw"][key]||""
}

// 套用靜態區塊（標題、表頭、編輯鈕）的語言，dynamic 內容各自用 hdt() 處理
function applyhanddetailstatic(){
	let map={
		"#cardstitle": hdt("cardstitle"),
		"#myhandtitle": hdt("myhandtitle"),
		"#seatingtitle": hdt("seatingtitle"),
		"#actionstitle": hdt("actionstitle"),
		"#notetitle": hdt("notetitle"),
		"#colseat": hdt("colseat"),
		"#colplayer": hdt("colplayer"),
		"#colhand": hdt("colhand"),
		"#colstart": hdt("colstart"),
		"#colend": hdt("colend"),
		"#colresult": hdt("colresult")
	}
	for(let selector in map){
		let element=document.querySelector(selector)
		if(element){
			element.textContent=map[selector]
		}
	}
	let editlink=domgetid("editlink")
	if(editlink){
		editlink.textContent=hdt("edit")
	}
	let exportbtn=domgetid("exporthandjson")
	if(exportbtn){
		exportbtn.value=hdt("exportjson")
	}
}

// 匯出目前手牌完整資料為 JSON
function exporthandjson(){
	if(!currenthand){
		pttoast(hdt("exportnodata"),"error")
		return
	}
	let payload={
		"version": 1,
		"type": "poker-trace-hand",
		"hand": currenthand
	}
	let token=currenthand["token"]||handid
	ptdownloadjson("hand_"+token+"_"+ptexporttimestamp()+".json",payload)
	pttoast(hdt("exportdone"),"success")
}

function safe(value){
	if(value==null||value==undefined||value==""){
		return "-"
	}
	return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")
}

function safeattr(value){
	return String(value||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
}

function money(value){
	let number=parseInt(value||0,10)
	if(isNaN(number)){
		number=0
	}
	return number.toLocaleString("en-US")
}

function tokenheaders(){
	return [
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	]
}

function cardpair(value){
	if(!value){
		return rendercardgroup([])
	}
	return rendercardgroup([value["card1"],value["card2"]])
}

function cardpairhighlight(value,highlight){
	if(!value){
		return rendercardgroup([])
	}
	return rendercardgroup([value["card1"],value["card2"]],highlight)
}

function boardtext(board){
	if(!board){
		return rendercardgroup([])
	}
	let flop=board["flop"]||[]
	let cards=[]
	for(let i=0;i<flop.length;i=i+1){
		if(flop[i]){
			cards.push(flop[i])
		}
	}
	if(board["turn"]){
		cards.push(board["turn"])
	}
	if(board["river"]){
		cards.push(board["river"])
	}
	return rendercardgroup(cards)
}

function boardcards(board){
	if(!board){
		return []
	}
	let flop=board["flop"]||[]
	let cards=[]
	for(let i=0;i<flop.length;i=i+1){
		if(flop[i]){
			cards.push(flop[i])
		}
	}
	if(board["turn"]){
		cards.push(board["turn"])
	}
	if(board["river"]){
		cards.push(board["river"])
	}
	return cards
}

function boardtexthighlight(board,highlight){
	return rendercardgroup(boardcards(board),highlight)
}

function boardhasstreet(board,street){
	if(!board){
		return false
	}
	if(street=="flop"){
		let flop=board["flop"]||[]
		for(let i=0;i<flop.length;i=i+1){
			if(flop[i]){
				return true
			}
		}
		return false
	}
	if(street=="turn"){
		if(board["turn"]){
			return true
		}
		return false
	}
	if(street=="river"){
		if(board["river"]){
			return true
		}
		return false
	}
	return false
}

function markrabbitfromstreet(rabbitmap,board,startstreet){
	let streetlist=["flop","turn","river"]
	let started=false
	for(let i=0;i<streetlist.length;i=i+1){
		let street=streetlist[i]
		if(street==startstreet){
			started=true
		}
		if(started&&boardhasstreet(board,street)){
			rabbitmap[street]=true
		}
	}
}

function streetrows(hand,street){
	let rows=[]
	let bitting=hand["bittingdata"]||[]
	for(let i=0;i<bitting.length;i=i+1){
		let row=bitting[i]
		if((row["type"]||row["bittingtype"])==street){
			rows.push(row)
		}
	}
	return rows
}

function countactiveseats(activemap){
	let count=0
	for(let seat in activemap){
		if(activemap[seat]){
			count=count+1
		}
	}
	return count
}

function seatallined(row,running,stacks,ante){
	let seat=parseInt(row["seatno"]||row["seat"]||0,10)
	if((row["action"]||"")=="allin"||row["allined"]==true){
		return true
	}
	let invested=parseInt(running[seat]||0,10)+parseInt((ante&&ante[seat])||0,10)
	if(0<parseInt(stacks[seat]||0,10)&&invested>=parseInt(stacks[seat]||0,10)){
		return true
	}
	return false
}

function hasactiveallin(activemap,running,stacks,allinedmap,ante){
	for(let seat in activemap){
		if(!activemap[seat]){
			continue
		}
		if(allinedmap&&allinedmap[seat]==true){
			return true
		}
		let invested=parseInt(running[seat]||0,10)+parseInt((ante&&ante[seat])||0,10)
		if(0<parseInt(stacks[seat]||0,10)&&invested>=parseInt(stacks[seat]||0,10)){
			return true
		}
	}
	return false
}

function rabbitstreetmap(hand){
	let board=hand["boardcard"]||{}
	let rabbitmap={}
	let activemap={}
	let seating=hand["seatingdata"]||[]
	for(let i=0;i<seating.length;i=i+1){
		let seat=parseInt(seating[i]["seatno"]||0,10)
		if(0<seat){
			activemap[seat]=true
		}
	}
	let running={}
	let allinedmap={}
	let stacks=stackmap(hand)
	let ante=anteinvestmap(hand)
	let prefloprows=streetrows(hand,"preflop")
	for(let i=0;i<prefloprows.length;i=i+1){
		let row=prefloprows[i]
		let seat=parseInt(row["seatno"]||row["seat"]||0,10)
		let action=row["action"]||""
		if(!running[seat]){
			running[seat]=0
		}
		if(action!="ante"){
			running[seat]=running[seat]+parseInt(row["chip"]||0,10)
		}
		if(seatallined(row,running,stacks,ante)){
			allinedmap[seat]=true
		}
		if(action=="fold"){
			activemap[seat]=false
		}
	}
	if(countactiveseats(activemap)<=1){
		markrabbitfromstreet(rabbitmap,board,"flop")
		return rabbitmap
	}
	let streetlist=["flop","turn"]
	for(let s=0;s<streetlist.length;s=s+1){
		let street=streetlist[s]
		if(!boardhasstreet(board,street)){
			continue
		}
		let rows=streetrows(hand,street)
		for(let i=0;i<rows.length;i=i+1){
			let row=rows[i]
			let seat=parseInt(row["seatno"]||row["seat"]||0,10)
			let action=row["action"]||""
			if(!running[seat]){
				running[seat]=0
			}
			if(action!="ante"){
				running[seat]=running[seat]+parseInt(row["chip"]||0,10)
			}
			if(seatallined(row,running,stacks,ante)){
				allinedmap[seat]=true
			}
			if(action=="fold"){
				activemap[seat]=false
			}
		}
		if(countactiveseats(activemap)<=1){
			if(street=="flop"){
				markrabbitfromstreet(rabbitmap,board,"turn")
			}else if(street=="turn"){
				markrabbitfromstreet(rabbitmap,board,"river")
			}
			return rabbitmap
		}
		if(hasactiveallin(activemap,running,stacks,allinedmap,ante)){
			continue
		}
		if(street=="flop"&&boardhasstreet(board,"turn")){
			if(streetrows(hand,"turn").length==0){
				markrabbitfromstreet(rabbitmap,board,"turn")
				return rabbitmap
			}
		}
		if(street=="turn"&&boardhasstreet(board,"river")){
			if(streetrows(hand,"river").length==0){
				markrabbitfromstreet(rabbitmap,board,"river")
				return rabbitmap
			}
		}
	}
	return rabbitmap
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

function cardkey(card){
	return String(card||"").toUpperCase()
}

function rendercard(card,highlight,rabbited){
	let parts=cardparts(card)
	if(parts["rank"]=="?"){
		return `<span class="pt-card unknown"><span class="pt-card-rank">?</span></span>`
	}
	let highlighted=highlight&&highlight[cardkey(card)]
	let classes="pt-card"
	if(parts["reded"]){
		classes=classes+" red"
	}
	if(highlighted){
		classes=classes+" pt-card-best"
	}
	if(rabbited){
		classes=classes+" pt-card-x"
	}
	return `<span class="${classes}" data-suit="${parts["symbol"]}"><span class="pt-card-rank">${parts["rank"]}</span><span class="pt-card-suit">${parts["symbol"]}</span></span>`
}

function rendercardgroup(cards,highlight,burned){
	let html=`<span class="pt-cardline pt-card-detail">`
	if(!cards||!cards.length){
		html=html+`<span class="pt-card-note">-</span>`
	}else{
		for(let i=0;i<cards.length;i=i+1){
			html=html+rendercard(cards[i],highlight,burned==true)
		}
	}
	html=html+`</span>`
	return html
}

function renderboardgroup(board,highlight,rabbitmap){
	let html=`<span class="pt-cardline pt-card-detail">`
	let count=0
	let flop=[]
	if(board&&board["flop"]){
		flop=board["flop"]
	}
	for(let i=0;i<flop.length;i=i+1){
		if(flop[i]){
			count=count+1
			html=html+rendercard(flop[i],highlight,rabbitmap&&rabbitmap["flop"]==true)
		}
	}
	if(board&&board["turn"]){
		count=count+1
		html=html+rendercard(board["turn"],highlight,rabbitmap&&rabbitmap["turn"]==true)
	}
	if(board&&board["river"]){
		count=count+1
		html=html+rendercard(board["river"],highlight,rabbitmap&&rabbitmap["river"]==true)
	}
	for(let i=count;i<5;i=i+1){
		html=html+`<span class="pt-card unknown"><span class="pt-card-rank">?</span></span>`
	}
	html=html+`</span>`
	return html
}

function privatecardstatus(row,hand){
	if(row["privatecarded"]){
		return `<div class="text-xs text-emerald-300 mt-1">${hdt("privatefilled")}</div>`
	}
	if(hand&&hand["myseatno"]&&String(hand["myseatno"])==String(row["seatno"])){
		return `<div class="text-xs text-yellow-300 mt-1">${hdt("privatemissing")}</div>`
	}
	return `<div class="text-xs text-zinc-500 mt-1">${hdt("hidden")}</div>`
}

function rendermyhandcard(hand){
	let box=domgetid("myhandcardbox")
	if(!box){
		return
	}
	if(!hand["myseatno"]){
		box.classList.add("hidden")
		return
	}
	box.classList.remove("hidden")
	let myhandcard=hand["myhandcard"]||{}
	let note=hand["myhandnote"]||""
	innerhtml("#myhandcardcontent",`
		<div class="text-zinc-400 mb-3">${hdt("privatenoteprefix")}${safe(hand["myseatno"])}${hdt("privatenotesuffix")}</div>
		<div class="grid grid-cols-2 gap-2 mb-3">
			<label class="block">
				<span class="block text-zinc-400 mb-1">${hdt("firstcard")}</span>
				<input id="mycard1" class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2" value="${safeattr(myhandcard["card1"]||"")}" placeholder="As">
			</label>
			<label class="block">
				<span class="block text-zinc-400 mb-1">${hdt("secondcard")}</span>
				<input id="mycard2" class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2" value="${safeattr(myhandcard["card2"]||"")}" placeholder="Kd">
			</label>
		</div>
		<label class="block mb-3">
			<span class="block text-zinc-400 mb-1">${hdt("privatenote")}</span>
			<textarea id="myhandnote" class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 min-h-24">${safeattr(note)}</textarea>
		</label>
		<div class="flex items-center gap-3">
			<input type="button" class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-bold" id="savemyhandcard" value="${hdt("savemyhand")}">
			<span id="myhandcardstatus" class="text-zinc-400"></span>
		</div>
	`,false)
	onclick("#savemyhandcard",function(element,event){
		savemyhandcard()
	})
}

function savemyhandcard(){
	innertext("#myhandcardstatus",hdt("saving"),false)
	ajax("PUT",AJAXURL+"editmyhandcard/"+handid,function(event,data){
		if(data["success"]){
			innertext("#myhandcardstatus",hdt("saved"),false)
			pttoast(hdt("saved"),"success")
			loadhand()
		}else{
			innertext("#myhandcardstatus",data["data"]||hdt("savefail"),false)
		}
	},str({
		"handcard": {
			"card1": domgetid("mycard1").value,
			"card2": domgetid("mycard2").value
		},
		"note": domgetid("myhandnote").value
	}),tokenheaders())
}

function rankvalue(rank){
	let map={
		"2": 2,
		"3": 3,
		"4": 4,
		"5": 5,
		"6": 6,
		"7": 7,
		"8": 8,
		"9": 9,
		"T": 10,
		"J": 11,
		"Q": 12,
		"K": 13,
		"A": 14
	}
	return map[String(rank||"").toUpperCase()]||0
}

function ranklabel(value){
	let map={
		14: "A",
		13: "K",
		12: "Q",
		11: "J",
		10: "T"
	}
	return map[value]||String(value)
}

function parsecardvalue(card){
	let text=String(card||"").toUpperCase()
	if(text.length<2){
		return null
	}
	return {
		"card": card,
		"key": cardkey(card),
		"rank": rankvalue(text.substring(0,text.length-1)),
		"suit": text.substring(text.length-1).toLowerCase()
	}
}

function sortdesc(values){
	values.sort(function(a,b){
		return b-a
	})
	return values
}

function rsortdesc(values){
	values.sort(function(a,b){
		return a-b
	})
	return values
}

function uniquevalues(values){
	let data=[]
	for(let i=0;i<values.length;i=i+1){
		if(data.indexOf(values[i])==-1){
			data.push(values[i])
		}
	}
	return data
}

function straighttop(ranks){
	let values=sortdesc(uniquevalues(ranks))
	if(values.indexOf(14)!=-1){
		values.push(1)
	}
	for(let i=0;i<=values.length-5;i=i+1){
		if(values[i]-1==values[i+1]&&values[i+1]-1==values[i+2]&&values[i+2]-1==values[i+3]&&values[i+3]-1==values[i+4]){
			return values[i]
		}
	}
	return 0
}

function straightbottom(ranks){
	let values=sortdesc(uniquevalues(ranks))
	if(values.indexOf(14)!=-1){
		values.push(1)
	}
	for(let i=0;i<=values.length-5;i=i+1){
		if(values[i]-1==values[i+1]&&values[i+1]-1==values[i+2]&&values[i+2]-1==values[i+3]&&values[i+3]-1==values[i+4]){
			return values[i+4]
		}
	}
	return 0
}

function comparearrays(a,b){
	let length=Math.max(a.length,b.length)
	for(let i=0;i<length;i=i+1){
		let av=a[i]||0
		let bv=b[i]||0
		if(av!=bv){
			return av-bv
		}
	}
	return 0
}

function evaluatefive(cards){
	let ranks=[]
	let counts={}
	let groups=[]
	for(let i=0;i<cards.length;i=i+1){
		ranks.push(cards[i]["rank"])
		if(!counts[cards[i]["rank"]]){
			counts[cards[i]["rank"]]=0
		}
		counts[cards[i]["rank"]]=counts[cards[i]["rank"]]+1
	}
	for(let rank in counts){
		groups.push({
			"rank": parseInt(rank,10),
			"count": counts[rank]
		})
	}
	groups.sort(function(a,b){
		if(a["count"]!=b["count"]){
			return b["count"]-a["count"]
		}
		return b["rank"]-a["rank"]
	})
	let flushed=true
	for(let i=1;i<cards.length;i=i+1){
		if(cards[i]["suit"]!=cards[0]["suit"]){
			flushed=false
		}
	}
	let straight=straighttop(ranks)
	let straightb=straightbottom(ranks)
	if(flushed&&straight){
		return { "category": 8,"ranks": [straight],"name": "straight flush","main": ranklabel(straightb)+"-"+ranklabel(straight) }
	}
	if(groups[0]["count"]==4){
		let kicker=0
		for(let i=0;i<groups.length;i=i+1){
			if(groups[i]["count"]==1){
				kicker=groups[i]["rank"]
			}
		}
		return { "category": 7,"ranks": [groups[0]["rank"],kicker],"name": "four of a kind","main": ranklabel(groups[0]["rank"]) }
	}
	if(groups[0]["count"]==3&&groups[1]&&groups[1]["count"]==2){
		return { "category": 6,"ranks": [groups[0]["rank"],groups[1]["rank"]],"name": "full house","main": ranklabel(groups[0]["rank"])+ranklabel(groups[1]["rank"]) }
	}
	if(flushed){
		return { "category": 5,"ranks": sortdesc(ranks),"name": "flush","main": ranklabel(sortdesc(ranks)[0]) }
	}
	if(straight){
		return { "category": 4,"ranks": [straight],"name": "straight","main": ranklabel(straightb)+"-"+ranklabel(straight) }
	}
	if(groups[0]["count"]==3){
		let kickers=[]
		for(let i=0;i<groups.length;i=i+1){
			if(groups[i]["count"]==1){
				kickers.push(groups[i]["rank"])
			}
		}
		kickers=sortdesc(kickers)
		return { "category": 3,"ranks": [groups[0]["rank"],kickers[0]||0,kickers[1]||0],"name": "three of a kind","main": ranklabel(groups[0]["rank"]) }
	}
	if(groups[0]["count"]==2&&groups[1]&&groups[1]["count"]==2){
		let pair1=groups[0]["rank"]
		let pair2=groups[1]["rank"]
		if(pair2<pair1){
			let temp=pair1
			pair1=pair2
			pair2=temp
		}
		let highpair=Math.max(groups[0]["rank"],groups[1]["rank"])
		let lowpair=Math.min(groups[0]["rank"],groups[1]["rank"])
		let kicker=0
		for(let i=0;i<groups.length;i=i+1){
			if(groups[i]["count"]==1){
				kicker=groups[i]["rank"]
			}
		}
		return { "category": 2,"ranks": [highpair,lowpair,kicker],"name": "two pair","main": ranklabel(highpair)+ranklabel(lowpair) }
	}
	if(groups[0]["count"]==2){
		let kickers=[]
		for(let i=0;i<groups.length;i=i+1){
			if(groups[i]["count"]==1){
				kickers.push(groups[i]["rank"])
			}
		}
		kickers=sortdesc(kickers)
		return { "category": 1,"ranks": [groups[0]["rank"],kickers[0]||0,kickers[1]||0,kickers[2]||0],"name": "one pair","main": ranklabel(groups[0]["rank"]) }
	}
	return { "category": 0,"ranks": sortdesc(ranks),"name": "high card","main": ranklabel(sortdesc(ranks)[0]) }
}

function comparehandvalue(a,b){
	if(a["category"]!=b["category"]){
		return a["category"]-b["category"]
	}
	return comparearrays(a["ranks"],b["ranks"])
}

function choosecards(source,indexes){
	let data=[]
	for(let i=0;i<indexes.length;i=i+1){
		data.push(source[indexes[i]])
	}
	return data
}

function besthand(cards){
	let parsed=[]
	for(let i=0;i<cards.length;i=i+1){
		let item=parsecardvalue(cards[i])
		if(item){
			parsed.push(item)
		}
	}
	if(parsed.length<5){
		return null
	}
	let best=null
	for(let a=0;a<parsed.length-4;a=a+1){
		for(let b=a+1;b<parsed.length-3;b=b+1){
			for(let c=b+1;c<parsed.length-2;c=c+1){
				for(let d=c+1;d<parsed.length-1;d=d+1){
					for(let e=d+1;e<parsed.length;e=e+1){
						let combo=choosecards(parsed,[a,b,c,d,e])
						let value=evaluatefive(combo)
						if(!best||0<comparehandvalue(value,best["value"])){
							best={
								"value": value,
								"cards": combo
							}
						}
					}
				}
			}
		}
	}
	return best
}

function highlitemap(cards){
	let data={}
	for(let i=0;i<(cards||[]).length;i=i+1){
		data[cardkey(cards[i]["card"]||cards[i])]=true
	}
	return data
}

function handlabel(best){
	if(!best){
		return ""
	}
	return "("+best["value"]["name"]+" "+best["value"]["main"]+")"
}

function handcardsarray(handcard){
	let cards=[]
	if(handcard&&handcard["card1"]){
		cards.push(handcard["card1"])
	}
	if(handcard&&handcard["card2"]){
		cards.push(handcard["card2"])
	}
	return cards
}

function showdowninfo(row,board){
	let handcards=handcardsarray(row["handcard"])
	if(handcards.length!=2){
		return null
	}
	let cards=[]
	for(let i=0;i<handcards.length;i=i+1){
		cards.push(handcards[i])
	}
	for(let i=0;i<board.length;i=i+1){
		cards.push(board[i])
	}
	let best=besthand(cards)
	if(!best){
		return null
	}
	return {
		"best": best,
		"highlight": highlitemap(best["cards"]),
		"label": handlabel(best)
	}
}

function boardhighlightfromshowdown(showdown){
	let data={}
	for(let seat in showdown){
		let cards=showdown[seat]["best"]["cards"]||[]
		for(let i=0;i<cards.length;i=i+1){
			data[cardkey(cards[i]["card"])]=true
		}
	}
	return data
}

function bestshowdownseat(showdown){
	let bestseat=null
	for(let seat in showdown){
		if(bestseat==null||0<comparehandvalue(showdown[seat]["best"]["value"],showdown[bestseat]["best"]["value"])){
			bestseat=seat
		}
	}
	return bestseat
}

function burntext(board){
	// 燒牌固定 3 張（翻牌前 / 轉牌前 / 河牌前），沒記錄的以 ? 補齊
	let cards=["","",""]
	if(board){
		cards=[board["burnflop"]||"",board["burnturn"]||"",board["burnriver"]||""]
	}
	return rendercardgroup(cards,false,true)
}

function actionname(action){
	let map={
		ante: "Ante",
		blind: hdt("blind"),
		check: "Check",
		call: "Call",
		bet: "Bet",
		raise: "Raise",
		allin: "All-in",
		fold: "Fold"
	}
	return map[action]||action||"-"
}

function streetname(street){
	let map={
		preflop: hdt("preflop"),
		flop: "Flop",
		turn: "Turn",
		river: "River"
	}
	return map[street]||street||"-"
}

function investmap(hand){
	let data={}
	let bitting=hand["bittingdata"]||[]
	for(let i=0;i<bitting.length;i=i+1){
		let row=bitting[i]
		let seat=parseInt(row["seatno"]||row["seat"]||0,10)
		if(!data[seat]){
			data[seat]=0
		}
		data[seat]=data[seat]+parseInt(row["chip"]||0,10)
	}
	return data
}

function potinvestmap(hand){
	let data={}
	let bitting=hand["bittingdata"]||[]
	for(let i=0;i<bitting.length;i=i+1){
		let row=bitting[i]
		let seat=parseInt(row["seatno"]||row["seat"]||0,10)
		let chip=parseInt(row["chip"]||0,10)
		if(seat<=0||chip<=0){
			continue
		}
		if(!data[seat]){
			data[seat]=0
		}
		data[seat]=data[seat]+chip
	}
	return data
}

function foldedseatsmap(hand){
	let data={}
	let bitting=hand["bittingdata"]||[]
	for(let i=0;i<bitting.length;i=i+1){
		if((bitting[i]["action"]||"")=="fold"){
			data[parseInt(bitting[i]["seatno"]||bitting[i]["seat"]||0,10)]=true
		}
	}
	return data
}

function stackmap(hand){
	let data={}
	let seating=hand["seatingdata"]||[]
	for(let i=0;i<seating.length;i=i+1){
		let chip=parseInt(seating[i]["chip"]||0,10)
		if(chip<0||String(seating[i]["specialbutton"]||"").indexOf("UNKNOWN_CHIP")>=0){
			chip=-1
		}
		data[parseInt(seating[i]["seatno"]||0,10)]=chip
	}
	return data
}

// 每位選手投入的 ante 總額。ante 不算進 running（街上下注額），但判斷 all-in 時必須計入總投入，
// 否則「盲注＋ante＋下注」剛好跟光計分牌的選手會被漏判（running 少了 ante 而小於起始計分牌）。
function anteinvestmap(hand){
	let data={}
	let bitting=hand["bittingdata"]||[]
	for(let i=0;i<bitting.length;i=i+1){
		if((bitting[i]["action"]||"")=="ante"){
			let seat=parseInt(bitting[i]["seatno"]||bitting[i]["seat"]||0,10)
			data[seat]=(data[seat]||0)+parseInt(bitting[i]["chip"]||0,10)
		}
	}
	return data
}

function unknownseat(row){
	if(!row){
		return false
	}
	if(row["unknownchip"]==true||row["unknownchiped"]==true){
		return true
	}
	if(parseInt(row["chip"]||0,10)<0){
		return true
	}
	if(String(row["specialbutton"]||"").indexOf("UNKNOWN_CHIP")>=0){
		return true
	}
	return false
}

function actiondisplay(hand,row,running){
	let seat=parseInt(row["seatno"]||row["seat"]||0,10)
	let action=row["action"]||""
	if(!running[seat]){
		running[seat]=0
	}
	let chip=parseInt(row["chip"]||0,10)
	if(action!="ante"){
		running[seat]=running[seat]+chip
	}
	let stacks=stackmap(hand)
	let ante=anteinvestmap(hand)
	let allintext=""
	if(0<chip){
		allintext=" <span class=\"text-zinc-400\">"+money(chip)+" ("+money(running[seat])+")</span>"
	}
	if(action=="allin"||row["allined"]==true){
		return `<span class="text-red-400 font-bold">Seat ${seat} ALLIN <span class="inline-block text-red-500 align-middle">▲</span></span>${allintext}`
	}
	if(action!="ante"&&0<parseInt(stacks[seat]||0,10)&&running[seat]+parseInt(ante[seat]||0,10)>=parseInt(stacks[seat]||0,10)){
		return `<span class="text-red-400 font-bold">Seat ${seat} ALLIN <span class="inline-block text-red-500 align-middle">▲</span></span>${allintext}`
	}
	let chiptext=""
	if(action=="ante"){
		if(0<chip){
			chiptext=" <span class=\"text-zinc-400\">"+money(chip)+"</span>"
		}
	}else if(0<chip){
		chiptext=" <span class=\"text-zinc-400\">"+money(chip)+" ("+money(running[seat])+")</span>"
	}
	return `Seat ${seat} ${actionname(action)}${chiptext}`
}

function knownhandcards(row){
	if(row&&row["handcard"]&&row["handcard"]["card1"]&&row["handcard"]["card2"]){
		return [row["handcard"]["card1"],row["handcard"]["card2"]]
	}
	return null
}

function equitygametype(hand){
	let g=String(hand["gametype"]||"").toUpperCase()
	if(g=="SD"||g.indexOf("SHORT")>=0){
		return "SD"
	}
	return "HE"
}

// 找出「有人 all-in 並被跟注」最早成立的街（≥2 人未蓋牌且至少 1 人 all-in），找不到回 -1
function allinstreetindex(hand){
	let streetlist=["preflop","flop","turn","river"]
	let activemap={}
	let seating=hand["seatingdata"]||[]
	for(let i=0;i<seating.length;i=i+1){
		let seat=parseInt(seating[i]["seatno"]||0,10)
		if(0<seat){
			activemap[seat]=true
		}
	}
	let running={}
	let allinedmap={}
	let stacks=stackmap(hand)
	let ante=anteinvestmap(hand)
	for(let s=0;s<streetlist.length;s=s+1){
		let rows=streetrows(hand,streetlist[s])
		for(let i=0;i<rows.length;i=i+1){
			let row=rows[i]
			let seat=parseInt(row["seatno"]||row["seat"]||0,10)
			let action=row["action"]||""
			if(!running[seat]){
				running[seat]=0
			}
			if(action!="ante"){
				running[seat]=running[seat]+parseInt(row["chip"]||0,10)
			}
			if(seatallined(row,running,stacks,ante)){
				allinedmap[seat]=true
			}
			if(action=="fold"){
				activemap[seat]=false
			}
		}
		let activelist=[]
		for(let seat in activemap){
			if(activemap[seat]){
				activelist.push(seat)
			}
		}
		if(2<=activelist.length){
			let anyallin=false
			let notallin=0
			for(let k=0;k<activelist.length;k=k+1){
				if(allinedmap[activelist[k]]){
					anyallin=true
				}else{
					notallin=notallin+1
				}
			}
			// 只有當「還能下注的選手」剩下至多 1 位時，牌面才必然發完、勝率才有意義；
			// 若仍有 2 位以上非全押選手在打邊池，這條街還有動作，先不顯示勝率。
			if(anyallin&&notallin<=1){
				return s
			}
		}
	}
	return -1
}

// 組出 all-in 勝率要顯示的資料：未蓋牌且有亮牌的座位＋從 all-in 街起每條街的牌面
function buildallinequityplan(hand){
	let aistreet=allinstreetindex(hand)
	if(aistreet<0){
		return null
	}
	let folded=foldedseatsmap(hand)
	let potinvest=potinvestmap(hand)
	let seating=hand["seatingdata"]||[]
	let seats=[]
	for(let i=0;i<seating.length;i=i+1){
		let seatno=parseInt(seating[i]["seatno"]||0,10)
		if(parseInt(potinvest[seatno]||0,10)<=0){
			continue
		}
		if(folded[seatno]){
			continue
		}
		let cards=knownhandcards(seating[i])
		// 只要有任一位未蓋牌的選手沒亮牌，勝率就無法誠實計算，直接不顯示
		if(!cards){
			return null
		}
		seats.push({ seatno: seatno,name: seating[i]["name"],cards: cards })
	}
	if(seats.length<2||seats.length>6){
		return null
	}
	// 全押勝率只送出未蓋牌選手的底牌，蓋掉選手亮出的牌後端不知道，會被當成活牌算進補牌；
	// 這裡記下這些「實際拿不到」的牌，前端用灰叉標出（同兔牌樣式），但不改補牌數與勝率。
	let inplay={}
	for(let i=0;i<seats.length;i=i+1){
		for(let j=0;j<seats[i].cards.length;j=j+1){
			inplay[cardkey(seats[i].cards[j])]=true
		}
	}
	let blocked={}
	for(let i=0;i<seating.length;i=i+1){
		let cards=knownhandcards(seating[i])
		if(!cards){
			continue
		}
		for(let j=0;j<cards.length;j=j+1){
			if(!inplay[cardkey(cards[j])]){
				blocked[cardkey(cards[j])]=true
			}
		}
	}
	let board=hand["boardcard"]||{}
	let flop=[]
	let rawflop=board["flop"]||[]
	for(let i=0;i<rawflop.length;i=i+1){
		if(rawflop[i]){
			flop.push(rawflop[i])
		}
	}
	let streetlist=["preflop","flop","turn","river"]
	let streets=[]
	for(let s=aistreet;s<streetlist.length;s=s+1){
		let st=streetlist[s]
		let b=null
		if(st=="preflop"){
			b=[]
		}else if(st=="flop"){
			if(flop.length>=3){
				b=flop.slice()
			}
		}else if(st=="turn"){
			if(flop.length>=3&&board["turn"]){
				b=flop.concat([board["turn"]])
			}
		}else if(st=="river"){
			if(flop.length>=3&&board["turn"]&&board["river"]){
				b=flop.concat([board["turn"],board["river"]])
			}
		}
		if(b!=null){
			streets.push({ street: st,board: b })
		}
	}
	if(!streets.length){
		return null
	}
	return { gametype: equitygametype(hand),seats: seats,streets: streets,blocked: blocked }
}

function streethasequity(plan,street){
	if(!plan){
		return false
	}
	for(let i=0;i<plan.streets.length;i=i+1){
		if(plan.streets[i]["street"]==street){
			return true
		}
	}
	return false
}

function equityminicard(card){
	let parts=cardparts(card)
	if(parts["rank"]=="?"){
		return ""
	}
	let colorclass=parts["reded"]?"text-red-400":"text-zinc-100"
	return `<span class="${colorclass}">${parts["rank"]}${parts["symbol"]}</span>`
}

// 與勝率解算器 pctformat 規則一致：0 顯示 0、0~0.1 顯示 <0.1、<10 取小數一位、>=10 取整數
function equitypctround(value){
	let number=Number(value)||0
	if(number<=0){
		return "0"
	}
	if(number<0.1){
		return "<0.1"
	}
	if(10<=number){
		return String(Math.round(number))
	}
	return number.toFixed(1)
}

function renderoutchips(cardlist,blocked){
	let html=`<span class="inline-flex flex-wrap items-center gap-0.5 align-middle">`
	for(let i=0;i<cardlist.length;i=i+1){
		let parts=cardparts(cardlist[i])
		if(parts["rank"]=="?"){
			continue
		}
		let colorclass=parts["reded"]?"text-[#f87171]":"text-zinc-100"
		let blockedclass=(blocked&&blocked[cardkey(cardlist[i])])?" pt-card-x":""
		html=html+`<span class="px-1 py-px rounded bg-zinc-800 border border-zinc-700 ${colorclass} text-[10px] leading-none${blockedclass}">${parts["rank"]}${parts["symbol"]}</span>`
	}
	html=html+`</span>`
	return html
}

// 領先方顯示「領先」，落後方顯示補牌（preflop 為單張領先牌、flop/turn 為剩一張的補牌）
function renderoutline(resultrow,boardlen,blocked,remaining){
	if(!resultrow){
		return ""
	}
	let status=resultrow["status"]||""
	let outs=resultrow["outlist"]||resultrow["outs"]||[]
	let chops=resultrow["chopoutlist"]||[]
	let win=Number(resultrow["win"])||0
	let tie=Number(resultrow["tie"])||0
	if(win<=0&&tie>=100){
		// 已確定平分（每張剩餘牌都分池）時，直接顯示平分底池，不再把分池牌全列出來
		return `<div class="mt-1 pl-[3.4rem]"><div class="text-[10px] text-zinc-500">${hdt("splitpot")}</div></div>`
	}
	// 分池牌覆蓋「全部」剩餘牌時（例如 K9 vs K9 翻牌前，逐張判斷一律分池而開出 48 張），
	// 那不是真正的分池 out、也還沒確定平分（仍有勝率），只是兩手牌型相同的雜訊；改顯示需要翻牌，不要把那一整排列出來
	let allchop=outs.length==0&&chops.length>0&&remaining>0&&chops.length>=remaining
	let inner=""
	if(outs.length>0){
		inner=inner+`<div class="flex items-start gap-1 text-[10px] text-emerald-300/90 mb-0.5"><span class="shrink-0">${hdt("outs")} (${outs.length})</span>${renderoutchips(outs,blocked)}</div>`
	}
	if(chops.length>0&&!allchop){
		inner=inner+`<div class="flex items-start gap-1 text-[10px] text-amber-300/90 mb-0.5"><span class="shrink-0">${hdt("chop")} (${chops.length})</span>${renderoutchips(chops,blocked)}</div>`
	}
	if(allchop){
		inner=inner+`<div class="text-[10px] text-zinc-500">${hdt("needflop")}</div>`
	}
	if(!inner){
		if(status=="ahead"||status=="win"){
			inner=`<div class="text-[10px] font-bold text-emerald-300">${hdt("lead")}</div>`
		}else if(status=="runner_runner"){
			inner=`<div class="text-[10px] text-zinc-500">${hdt("backdoor")}</div>`
		}else if(status=="drawing_dead"){
			inner=`<div class="text-[10px] text-zinc-500">${hdt("drawingdead")}</div>`
		}else if(status=="tie_only"){
			inner=`<div class="text-[10px] text-zinc-500">${hdt("splitpot")}</div>`
		}else if(status=="need_flop"){
			inner=`<div class="text-[10px] text-zinc-500">${hdt("needflop")}</div>`
		}
	}
	if(!inner){
		return ""
	}
	return `<div class="mt-1 pl-[3.4rem]">${inner}</div>`
}

// 依需求 A 視為最小，整手牌由小排到大（例 K♠J♥→J♥K♠、4♦A♥→A♥4♦）
function equitysortrank(card){
	let parts=parsecardvalue(card)
	let r=parts?parts["rank"]:0
	if(r==14){
		r=1
	}
	return r
}

function equitysortcards(cards){
	let copy=(cards||[]).slice()
	copy.sort(function(a,b){
		return equitysortrank(a)-equitysortrank(b)
	})
	return copy
}

function renderallinbars(plan,results,boardlen){
	let html=`<div class="mt-2 pt-2 border-t border-zinc-700 space-y-1.5">`
	html=html+`<div class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">${hdt("allinequity")}</div>`
	// 算出尚未發出的牌數（整副牌 - 各家底牌 - 已發公共牌），用來判斷分池牌是否覆蓋全部剩餘牌
	let decksize=plan.gametype=="SD"?36:52
	let inplay=boardlen
	for(let k=0;k<plan.seats.length;k=k+1){
		inplay=inplay+(plan.seats[k].cards?plan.seats[k].cards.length:0)
	}
	let remaining=decksize-inplay
	for(let k=0;k<plan.seats.length;k=k+1){
		let seat=plan.seats[k]
		let resultrow=null
		for(let m=0;m<results.length;m=m+1){
			if(results[m]["index"]==k){
				resultrow=results[m]
			}
		}
		let win=resultrow?Number(resultrow["win"])||0:0
		let tie=resultrow?Number(resultrow["tie"])||0:0
		let sortedcards=equitysortcards(seat.cards)
		let cardhtml=""
		for(let c=0;c<sortedcards.length;c=c+1){
			cardhtml=cardhtml+equityminicard(sortedcards[c])
		}
		let tietext=0<Number(tie)?equitypctround(tie)+"%":""
		html=html+`
			<div>
				<div class="flex items-center gap-1.5 text-[11px] leading-none">
					<span class="text-zinc-400 w-6 shrink-0">S${seat.seatno}</span>
					<span class="w-10 shrink-0 whitespace-nowrap">${cardhtml}</span>
					<span class="text-emerald-300 tabular-nums w-9 text-right shrink-0">${equitypctround(win)}%</span>
					<span class="relative flex-1 min-w-[40px] h-2 rounded bg-zinc-700 overflow-hidden">
						<span class="absolute left-0 top-0 rounded h-full bg-emerald-500" style="width:${win}%"></span>
						<span class="absolute top-0 right-0 rounded h-full bg-amber-400/70" style="width:${tie}%"></span>
					</span>
					<span class="text-amber-300 tabular-nums w-8 shrink-0">${tietext}</span>
				</div>
				${renderoutline(resultrow,boardlen,plan.blocked,remaining)}
			</div>
		`
	}
	html=html+`</div>`
	return html
}

function runallinequity(plan){
	for(let i=0;i<plan.streets.length;i=i+1){
		(function(streetitem){
			let host=domgetid("ptequity-"+streetitem["street"])
			if(!host){
				return
			}
			let handlist=[]
			for(let k=0;k<plan.seats.length;k=k+1){
				handlist.push(plan.seats[k].cards.slice())
			}
			let bodydata={
				gametype: plan.gametype,
				handlist: handlist,
				board: {
					floplist: [streetitem["board"][0]||"",streetitem["board"][1]||"",streetitem["board"][2]||""],
					turn: streetitem["board"][3]||"",
					river: streetitem["board"][4]||""
				}
			}
			ajax("POST",AJAXURL+"equity",function(event,data){
				let target=domgetid("ptequity-"+streetitem["street"])
				if(!target){
					return
				}
				if(data&&data["success"]&&data["data"]){
					let results=data["data"]["resultlist"]||data["data"]["results"]||[]
					target.outerHTML=renderallinbars(plan,results,streetitem["board"].length)
				}else{
					target.outerHTML=""
				}
			},JSON.stringify(bodydata),[
				["Content-Type","application/json"],
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})(plan.streets[i])
	}
}

function renderhand(hand){
	currenthand=hand
	// 動畫回放入口: 一般手牌(有座位資料)才顯示按鈕
	let replaybtn=document.getElementById("replaybtn")
	if(replaybtn&&(hand["recordtype"]||"hand")=="hand"&&(hand["seatingdata"]||[]).length){
		if(typeof hrtext=="function"){
			replaybtn.value=hrtext("openbtn")
		}
		replaybtn.classList.remove("hidden")
		replaybtn.onclick=function(){ openhandreplay(currenthand) }
	}
	tableid=tableid||hand["tableid"]
	sessionid=sessionid||hand["sessionid"]
	updatebacklink()
	loadhandneighbors()
	let board=boardcards(hand["boardcard"])
	let rabbitmap=rabbitstreetmap(hand)
	let seating=hand["seatingdata"]||[]
	let potinvest=potinvestmap(hand)
	let folded=foldedseatsmap(hand)
	let showdown={}
	for(let i=0;i<seating.length;i=i+1){
		let row=seating[i]
		if(parseInt(potinvest[row["seatno"]]||0,10)<=0){
			continue
		}
		// 最大牌型只取「有參與到最後底池的人」（未蓋牌者），蓋牌者不納入比較與顯示
		if(folded[row["seatno"]]){
			continue
		}
		let info=showdowninfo(row,board)
		if(info){
			showdown[row["seatno"]]=info
		}
	}
	let bestseat=bestshowdownseat(showdown)
	let bestshowdown={}
	if(bestseat!=null){
		bestshowdown[bestseat]=showdown[bestseat]
	}
	let boardhighlight=boardhighlightfromshowdown(bestshowdown)
	let herohighlight=null
	let heroed=parseInt(hand["selfseating"]||0,10)>0
	if(bestseat!=null&&heroed&&String(bestseat)==String(hand["selfseating"])&&showdown[hand["selfseating"]]){
		herohighlight=showdown[hand["selfseating"]]["highlight"]
	}
	// 計分牌校正紀錄要用 stackadjust.html 編輯，普通手牌才用 newedithand
	domgetid("editlink").href=((hand["recordtype"]||"hand")=="stackadjustment"?"stackadjust.html":"newedithand.html")+"?tableid="+tableid+"&handid="+handid
	if(hand["canedit"]){
		domgetid("editlink").classList.remove("hidden")
	}else{
		domgetid("editlink").classList.add("hidden")
	}
	innerhtml("#summary",`
		<div class="bg-zinc-800 rounded-lg p-4"><div class="text-zinc-400 text-xs">${hdt("hand")}</div><div class="font-bold" data-textmarquee>${safe(hand["token"])}</div></div>
		<div class="bg-zinc-800 rounded-lg p-4"><div class="text-zinc-400 text-xs">Dealer</div><div class="font-bold" data-textmarquee>Seat ${safe(hand["dealerseat"])}</div></div>
		<div class="bg-zinc-800 rounded-lg p-4"><div class="text-zinc-400 text-xs">${hdt("record")}</div><div class="font-bold" data-textmarquee>${heroed?"Seat "+safe(hand["selfseating"]):hdt("publicrecord")}</div></div>
		<div class="bg-zinc-800 rounded-lg p-4"><div class="text-zinc-400 text-xs">${hdt("blindslabel")}</div><div class="font-bold" data-textmarquee>${money(hand["smallblind"])}/${money(hand["bigblind"])} (${money(hand["ante"]||hand["bigblindante"])})</div></div>
		<div class="bg-zinc-800 rounded-lg p-4"><div class="text-zinc-400 text-xs">${hdt("totalpot")}</div><div class="font-bold" data-textmarquee>${money(hand["totalpot"])}</div></div>
	`,false)
	let herohtml=`<div class="mb-3"><span class="text-zinc-400 block mb-1">${hdt("herohand")}</span>${cardpairhighlight(hand["handcard"],herohighlight)}</div>`
	if(!heroed){
		herohtml=`<div class="mb-3"><span class="text-zinc-400 block mb-1">${hdt("publicrecord")}</span><span class="text-zinc-300">${hdt("nohero")}</span></div>`
	}
	innerhtml("#cards",`
		${herohtml}
		<div class="mb-3"><span class="text-zinc-400 block mb-1">${hdt("board")}</span>${renderboardgroup(hand["boardcard"],boardhighlight,rabbitmap)}</div>
		<div><span class="text-zinc-400 block mb-1">${hdt("burn")}</span>${burntext(hand["boardcard"])}</div>
	`,false)
	// 有翻牌才給 GTO 參考連結：帶這手牌實際的翻牌過去，情境/位置還是要使用者自己選
	// （這手牌實際的對手範圍是什麼，程式沒辦法幫你判斷）
	let gtolink=domgetid("gtoreflink")
	if(gtolink){
		let flop=(hand["boardcard"]||{})["flop"]||[]
		let flopcards=flop.filter(function(c){ return !!c })
		if(flopcards.length==3){
			gtolink.href="tool/range.html?street=flop&flop="+flopcards.join(",")
			gtolink.classList.remove("hidden")
		}else{
			gtolink.classList.add("hidden")
		}
	}
	rendermyhandcard(hand)
	let seatinghtml=""
	let seatingcardhtml=""
	let invest=investmap(hand)
	for(let i=0;i<seating.length;i=i+1){
		let row=seating[i]
		let isadjust=(hand["recordtype"]||"hand")!="hand"
		let oldinvest=parseInt(row["chipchange"]||0,10)
		let currentinvest=parseInt(invest[row["seatno"]]||oldinvest||0,10)
		let winamount=0
		if(row["winnered"]){
			winamount=parseInt(row["endchip"]||0,10)-parseInt(row["chip"]||0,10)+oldinvest
		}
		// 校正 / 例外紀錄沒有下注，直接用儲存的 endchip，淨增減＝endchip-chip
		let endchip=isadjust?parseInt(row["endchip"]||0,10):parseInt(row["chip"]||0,10)-currentinvest+winamount
		let result=endchip-parseInt(row["chip"]||0,10)
		let unknowned=unknownseat(row)
		if(unknowned){
			result=winamount-currentinvest
		}
		let info=showdown[row["seatno"]]
		let highlighted=info&&bestseat!=null&&String(bestseat)==String(row["seatno"])
		let handhtml=cardpairhighlight(row["handcard"],highlighted?info["highlight"]:null)
		if(!row["handcard"]||(!row["handcard"]["card1"]&&!row["handcard"]["card2"])){
			handhtml=privatecardstatus(row,hand)
		}
		let resulttext=(0<=result?"+":"")+money(result)
		let resultclass=0<=result?"text-green-400":"text-red-400"
		let endtext=money(endchip)
		let endclass=""
		if(unknowned){
			endtext="inf."+(0<=result?"+":"")+money(result)
		}else if(endchip==0){
			endtext="Eliminated"
			endclass="text-red-400"
		}
		let starttext=unknowned?hdt("unknown"):money(row["chip"])
		seatinghtml=seatinghtml+`
			<tr class="border-t border-zinc-700">
				<td class="py-2 px-2">Seat ${row["seatno"]}</td>
				<td class="py-2 px-2">${safe(row["name"])}</td>
				<td class="py-2 px-2">${handhtml}</td>
				<td class="py-2 px-2">${starttext}</td>
				<td class="py-2 px-2 ${endclass}">${endtext}</td>
				<td class="py-2 px-2 ${resultclass} font-bold">${resulttext}${info?`<div class="text-xs text-zinc-300 mt-1">${info["label"]}</div>`:""}</td>
			</tr>
		`
		seatingcardhtml=seatingcardhtml+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
				<div class="mb-3 flex items-start justify-between gap-3">
					<div class="flex min-w-0 flex-1 items-center gap-2">
						<span class="shrink-0 rounded-full bg-zinc-800 px-2 py-1 text-xs font-bold text-zinc-300">Seat ${row["seatno"]}</span>
						<span class="min-w-0 flex-1 text-sm font-semibold text-zinc-100" data-textmarquee>${safe(row["name"])}</span>
					</div>
					<div class="shrink-0 text-right">
						<div class="${resultclass} font-bold">${resulttext}</div>
					</div>
				</div>
				<div class="mb-3 flex gap-3 items-end">
					${handhtml}
					${info?`<div class="text-xs text-zinc-300">${info["label"]}</div>`:""}
				</div>
				<div class="flex items-center gap-4 text-xs">
					<span class="text-zinc-400">${hdt("start")} <span class="text-zinc-200">${starttext}</span></span>
					<span class="text-zinc-400">${hdt("end")} <span class="${endclass||"text-zinc-200"}">${endtext}</span></span>
				</div>
			</div>
		`
	}
	// 有下注卻沒有座位資料的座位（例如送出前先被淘汰），仍補一列避免從結果表消失
	let seatedset={}
	for(let i=0;i<seating.length;i=i+1){
		seatedset[String(seating[i]["seatno"])]=true
	}
	let orphanseats=[]
	for(let seatkey in invest){
		let bseat=parseInt(seatkey,10)
		if(0<bseat&&!seatedset[String(bseat)]&&orphanseats.indexOf(bseat)==-1){
			orphanseats.push(bseat)
		}
	}
	orphanseats=rsortdesc(orphanseats)
	for(let i=0;i<orphanseats.length;i=i+1){
		let bseat=orphanseats[i]
		let currentinvest=parseInt(invest[bseat]||0,10)
		let result=0-currentinvest
		let resulttext=(0<=result?"+":"")+money(result)
		let resultclass=0<=result?"text-green-400":"text-red-400"
		seatinghtml=seatinghtml+`
			<tr class="border-t border-zinc-700">
				<td class="py-2 px-2">Seat ${bseat}</td>
				<td class="py-2 px-2">-<div class="text-xs text-zinc-500 mt-1">${hdt("leftbeforesubmit")}</div></td>
				<td class="py-2 px-2"><div class="text-xs text-zinc-500">${hdt("hidden")}</div></td>
				<td class="py-2 px-2">${hdt("unknown")}</td>
				<td class="py-2 px-2 text-zinc-500">inf.${resulttext}</td>
				<td class="py-2 px-2 ${resultclass} font-bold">${resulttext}</td>
			</tr>
		`
		seatingcardhtml=seatingcardhtml+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
				<div class="mb-3 flex items-start justify-between gap-3">
					<div class="flex min-w-0 flex-1 items-center gap-2">
						<span class="shrink-0 rounded-full bg-zinc-800 px-2 py-1 text-xs font-bold text-zinc-300">Seat ${bseat}</span>
						<span class="min-w-0 flex-1 text-xs text-zinc-500">${hdt("leftbeforesubmit")}</span>
					</div>
					<div class="shrink-0 ${resultclass} font-bold">${resulttext}</div>
				</div>
				<div class="mb-3 text-xs text-zinc-500">${hdt("hidden")}</div>
				<div class="flex items-center gap-4 text-xs">
					<span class="text-zinc-400">${hdt("start")} <span class="text-zinc-200">${hdt("unknown")}</span></span>
					<span class="text-zinc-400">${hdt("end")} <span class="text-zinc-500">inf.${resulttext}</span></span>
				</div>
			</div>
		`
	}
	if(!seatinghtml){
		seatinghtml=`<tr><td colspan="6" class="py-6 text-zinc-500">${hdt("noseating")}</td></tr>`
	}
	if(!seatingcardhtml){
		seatingcardhtml=`<div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 py-6 text-center text-zinc-500">${hdt("noseating")}</div>`
	}
	innerhtml("#seating",seatinghtml,false)
	innerhtml("#seatingcards",seatingcardhtml,false)
	let equityplan=buildallinequityplan(hand)
	let streetlist=["preflop","flop","turn","river"]
	let actionhtml=""
	let bitting=hand["bittingdata"]||[]
	let running={}
	for(let s=0;s<streetlist.length;s=s+1){
		let street=streetlist[s]
		let itemhtml=""
		for(let i=0;i<bitting.length;i=i+1){
			let row=bitting[i]
			if((row["type"]||row["bittingtype"])==street){
				itemhtml=itemhtml+`<div class="py-2 border-b border-zinc-700 last:border-b-0">${actiondisplay(hand,row,running)}</div>`
			}
		}
		if(!itemhtml){
			itemhtml=`<div class="text-zinc-500">-</div>`
		}
		let equityhtml=""
		if(streethasequity(equityplan,street)){
			equityhtml=`<div class="mt-2 pt-2 border-t border-zinc-700 text-[10px] text-zinc-500" id="ptequity-${street}">${hdt("solving")}</div>`
		}
		actionhtml=actionhtml+`<div class="bg-zinc-900 rounded p-4"><div class="font-bold mb-2">${streetname(street)}</div>${itemhtml}${equityhtml}</div>`
	}
	innerhtml("#actions",actionhtml,false)
	if(equityplan){
		runallinequity(equityplan)
	}
	innertext("#note",hand["ps"]||hand["note"]||"-",false)
}

function backfallback(){
	if(sessionid){
		href("session.html?id="+sessionid+"#hands")
		return
	}
	if(tableid){
		href("table.html?id="+tableid+"#2")
	}
}

function backfallbackurl(){
	if(sessionid){
		return "session.html?id="+sessionid+"#hands"
	}
	if(tableid){
		return "table.html?id="+tableid+"#2"
	}
	return "sessionlist.html"
}

// 排序方向: 優先看網址 sort 參數, 否則沿用記住的偏好(localStorage), 預設降冪
function handsortpref(){
	return getget("sort")||weblsget(WEBLSNAME+"handsortdir")||"desc"
}

// 抓同情境(session 或 table)手牌清單, 依 sort 參數排序, 找出目前手牌前後鄰居設定上一手/下一手
function loadhandneighbors(){
	let endpoint=sessionid?("getsessionhandlist/"+encodeURIComponent(sessionid)):(tableid?("gethandlist/"+encodeURIComponent(tableid)):"")
	if(!endpoint){
		return
	}
	ajax("GET",AJAXURL+endpoint,function(event,data){
		if(!data||!data["success"]||!data["data"]){
			return
		}
		let list=data["data"].slice()
		list.sort(function(a,b){
			let ca=String(a["createtime"]||"")
			let cb=String(b["createtime"]||"")
			if(ca!=cb){
				return ca<cb?-1:1
			}
			return (parseInt(a["id"])||0)-(parseInt(b["id"])||0)
		})
		if(handsortpref()=="desc"){
			list.reverse()
		}
		let idx=-1
		for(let i=0;i<list.length;i=i+1){
			if(String(list[i]["id"])==String(handid)){
				idx=i
				break
			}
		}
		if(idx<0){
			return
		}
		sethandneighbor("prevhand",list[idx-1])
		sethandneighbor("nexthand",list[idx+1])
	},null,tokenheaders())
}

function sethandneighbor(elid,hand){
	let el=document.getElementById(elid)
	if(!el){
		return
	}
	if(!hand){
		el.classList.add("hidden")
		return
	}
	let url="handdetail.html?id="+encodeURIComponent(hand["id"])+"&tableid="+encodeURIComponent(hand["tableid"]||tableid||"")
	if(sessionid){
		url=url+"&sessionid="+encodeURIComponent(sessionid)
	}
	url=url+"&sort="+encodeURIComponent(handsortpref())
	el.href=url
	el.classList.remove("hidden")
}

function updatebacklink(){
	let back=domgetid("back")
	if(back){
		back.href=backfallbackurl()
	}
}

onclick("#back",function(element,event){
	if(event&&event.button!=0){
		return
	}
	if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
		return
	}
	event.preventDefault()
	if(1<history.length){
		let fallbacked=false
		let timer=setTimeout(function(){
			if(fallbacked){
				return
			}
			fallbacked=true
			backfallback()
		},300)
		window.addEventListener("pagehide",function(){
			fallbacked=true
			clearTimeout(timer)
		},{ once: true })
		history.back()
		return
	}
	backfallback()
})

updatebacklink()

function loadhand(){
	ajax("GET",AJAXURL+"gethand/"+handid,function(event,data){
		if(data["success"]){
			renderhand(data["data"])
		}else{
			pttoast(data["data"]||hdt("loadfail"),"error")
		}
	},null,tokenheaders())
}

onclick("#exporthandjson",function(element,event){
	exporthandjson()
})

// ===== 單筆手牌列印 =====
function handprintcardstext(cardobj){
	if(!cardobj){
		return ""
	}
	let cards=[]
	if(cardobj["card1"]){
		cards.push(String(cardobj["card1"]))
	}
	if(cardobj["card2"]){
		cards.push(String(cardobj["card2"]))
	}
	return cards.join(" ")
}

function handprintboardtext(boardcard){
	if(!boardcard){
		return "-"
	}
	let board=[]
	let flop=boardcard["flop"]||[]
	for(let i=0;i<flop.length;i=i+1){
		if(flop[i]){
			board.push(String(flop[i]))
		}
	}
	if(boardcard["turn"]){
		board.push(String(boardcard["turn"]))
	}
	if(boardcard["river"]){
		board.push(String(boardcard["river"]))
	}
	return board.join(" ")||"-"
}

function handprintstreetname(street){
	if(street=="preflop"){
		return "翻前"
	}
	if(street=="flop"){
		return "翻牌"
	}
	if(street=="turn"){
		return "轉牌"
	}
	if(street=="river"){
		return "河牌"
	}
	return street
}

function handprintactionname(action){
	let map={ ante: "Ante",blind: "盲注",check: "Check",call: "Call",bet: "Bet",raise: "Raise",fold: "Fold",allin: "ALLIN" }
	return map[action]||action||"-"
}

function printhand(){
	let hand=currenthand
	if(!hand){
		pttoast("手牌資料尚未載入","warning")
		return
	}
	let heroed=parseInt(hand["selfseating"]||0,10)>0
	let infohtml=ptprintinfogrid([
		["手牌",hand["token"]||"-"],
		["日期",ptformatdatetimeminute(hand["createtime"]||hand["handtime"])],
		["莊家座位","Seat "+(hand["dealerseat"]||"-")],
		["紀錄",heroed?"Seat "+hand["selfseating"]:"公開紀錄"],
		["盲注",money(hand["smallblind"])+"/"+money(hand["bigblind"])+" ("+money(hand["ante"]||hand["bigblindante"])+")"],
		["總底池",money(hand["totalpot"])]
	])
	let cardpairs=[]
	if(heroed){
		cardpairs.push(["英雄手牌",handprintcardstext(hand["handcard"])||"-"])
	}
	cardpairs.push(["公牌",handprintboardtext(hand["boardcard"])])
	let cardhtml=ptprintinfogrid(cardpairs)

	let seatcols=[
		{"title": "座位","align": "center"},
		{"title": "選手"},
		{"title": "手牌"},
		{"title": "起始","align": "right"},
		{"title": "結束","align": "right"},
		{"title": "淨額","align": "right"},
		{"title": "得標","align": "center"}
	]
	let seating=hand["seatingdata"]||[]
	let seatrows=[]
	for(let i=0;i<seating.length;i=i+1){
		let row=seating[i]
		let start=parseInt(row["chip"]||0,10)
		let end=parseInt(row["endchip"]||0,10)
		let result=end-start
		seatrows.push([
			"Seat "+(row["seatno"]||"-"),
			row["name"]||"-",
			handprintcardstext(row["handcard"])||"-",
			money(start),
			money(end),
			(0<=result?"+":"")+money(result),
			row["winnered"]?"是":"-"
		])
	}
	let seathtml=ptprinttable(seatcols,seatrows,"無座位資料")

	let actioncols=[
		{"title": "街","align": "center"},
		{"title": "座位","align": "center"},
		{"title": "動作"},
		{"title": "金額","align": "right"}
	]
	let bitting=hand["bittingdata"]||[]
	let streetlist=["preflop","flop","turn","river"]
	let actionrows=[]
	for(let s=0;s<streetlist.length;s=s+1){
		for(let i=0;i<bitting.length;i=i+1){
			let row=bitting[i]
			if((row["type"]||row["bittingtype"])==streetlist[s]){
				let amount="-"
				if(row["action"]!="fold"&&row["action"]!="check"){
					amount=money(row["chip"])
				}
				actionrows.push([
					handprintstreetname(streetlist[s]),
					"Seat "+(row["seatno"]||"-"),
					handprintactionname(row["action"])+(row["allined"]?" (ALLIN)":""),
					amount
				])
			}
		}
	}
	let actionhtml=ptprinttable(actioncols,actionrows,"無行動資料")

	let note=hand["ps"]||hand["note"]||""
	let notehtml=""
	if(note){
		notehtml=ptprintsectiontitle("備註")+`<div class="ptprintnote">${ptprintescape(note)}</div>`
	}

	let bodyhtml=infohtml+ptprintsectiontitle("牌面")+cardhtml+ptprintsectiontitle("座位結果")+seathtml+ptprintsectiontitle("行動")+actionhtml+notehtml
	ptprintrun(ptprintbuild({
		"eyebrow": "Hand",
		"title": "手牌 "+(hand["token"]||"")+" 明細",
		"subtitle": "單筆手牌存底",
		"meta": "列印時間 "+ptprinttimestamp()
	},bodyhtml))
}

onclick("#printhand",function(element,event){
	printhand()
})

applyhanddetailstatic()
loadhand()
