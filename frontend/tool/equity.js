const RANKLISTALL=["A","K","Q","J","T","9","8","7","6","5","4","3","2"]
const SUITLISTALL=[["s","♠"],["h","♥"],["d","♦"],["c","♣"]]
const EQUITYSTATEKEY=WEBLSNAME+"equitystate"
let equityrequestid=0
let equitysolvetimer=null
let equitypreviewhandindex=null
let equitypreviewhovertimer=null

const EQUITYMAXHAND=15
const EQUITYRANGEMAXCOMBO=1326
// 合法的牌型代碼。代碼與資料庫 gametype 表對齊：
// HE 德州 / OM 奧馬哈 / O5 5張奧馬哈 / O8 奧馬哈高低 / BO 5張奧馬哈高低(Big O) /
// SD 短牌 / SH 超級德州 / DW 萬用 2。
const EQUITYGAMETYPELIST=["HE","OM","O5","O8","BO","SD","SH","DW"]
const EQUITYSOLVEDELAYMS=300
const EQUITYPREVIEWHOVERDELAYMS=120

let equitystate={
	gametype: "HE",
	handlist: [["",""],["",""]],
	rangelist: ["",""],
	board: {
		floplist: ["","",""],
		turn: "",
		river: ""
	},
	board2: {
		floplist: ["","",""],
		turn: "",
		river: ""
	},
	boardmode: "single",
	deadlist: [],
	resultlist: [],
	solvinged: false
}

function equitytext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["equitypage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["equitypage"][key]||key
}

function holecount(){
	if(equitystate.gametype=="O5"||equitystate.gametype=="BO"){
		return 5
	}
	if(equitystate.gametype=="SH"){
		return 3
	}
	if(equitystate.gametype=="OM"||equitystate.gametype=="O8"){
		return 4
	}
	return 2
}

// 高低分池（8-or-better）：底池拆成高牌與低牌兩半。
// O8 是 4 張底牌、BO（Big O）是 5 張，選牌限制都一樣是「底牌剛好 2 張 + 公共牌剛好 3 張」，
// 高低兩邊可以各挑不同的組合。
function equityhiloed(){
	if(equitystate.gametype=="O8"||equitystate.gametype=="BO"){
		return true
	}
	return false
}

function maxhandcount(){
	let decksize=52
	if(equitystate.gametype=="SD"){
		decksize=36
	}
	let boardcardcount=5
	if(equitystate.boardmode=="double"){
		boardcardcount=10
	}
	let cap=Math.floor((decksize-boardcardcount)/holecount())
	if(cap>EQUITYMAXHAND){
		cap=EQUITYMAXHAND
	}
	if(cap<2){
		cap=2
	}
	return cap
}

function ranklist(){
	if(equitystate.gametype=="SD"){
		return ["A","K","Q","J","T","9","8","7","6"]
	}
	return RANKLISTALL
}

function isemptycard(cardtext){
	if(cardtext){
		return false
	}
	return true
}

function sanitizecardtext(cardtext,allowedranklist){
	let text=String(cardtext||"").trim()
	if(!text){
		return ""
	}
	let rankchar=text.slice(0,1).toUpperCase()
	let suitchar=text.slice(-1).toLowerCase()
	if(allowedranklist.indexOf(rankchar)<0){
		return ""
	}
	if(suitchar!="s"&&suitchar!="h"&&suitchar!="d"&&suitchar!="c"){
		return ""
	}
	return rankchar+suitchar
}

function persiststate(){
	let raw=JSON.stringify({
		gametype: equitystate.gametype,
		handlist: equitystate.handlist,
		rangelist: equitystate.rangelist,
		board: equitystate.board,
		board2: equitystate.board2,
		boardmode: equitystate.boardmode,
		deadlist: equitystate.deadlist
	})
	weblsset(EQUITYSTATEKEY,raw)
}

function loadpersistedstate(){
	let raw=weblsget(EQUITYSTATEKEY)
	if(!raw){
		return
	}
	try{
		let saved=JSON.parse(raw)
		let savedgametype=String(saved["gametype"]||"").toUpperCase()
		if(EQUITYGAMETYPELIST.indexOf(savedgametype)>=0){
			equitystate.gametype=savedgametype
		}
		if(saved["boardmode"]=="double"){
			equitystate.boardmode="double"
		}else{
			equitystate.boardmode="single"
		}
		let allowedranklist=ranklist()
		let needcount=holecount()
		let newhandlist=[]
		if(Array.isArray(saved["handlist"])){
			for(let i=0;i<saved["handlist"].length;i=i+1){
				if(!Array.isArray(saved["handlist"][i])){
					continue
				}
				let row=[]
				for(let j=0;j<needcount;j=j+1){
					row.push(sanitizecardtext(saved["handlist"][i][j],allowedranklist))
				}
				newhandlist.push(row)
			}
		}
		if(2<=newhandlist.length&&newhandlist.length<=maxhandcount()){
			equitystate.handlist=newhandlist
		}
		if(Array.isArray(saved["rangelist"])){
			equitystate.rangelist=[]
			for(let i=0;i<equitystate.handlist.length;i=i+1){
				equitystate.rangelist.push(String(saved["rangelist"][i]||""))
			}
		}
		let newdeadlist=[]
		if(Array.isArray(saved["deadlist"])){
			for(let i=0;i<saved["deadlist"].length;i=i+1){
				let deadcardtext=sanitizecardtext(saved["deadlist"][i],allowedranklist)
				if(deadcardtext&&newdeadlist.indexOf(deadcardtext)<0){
					newdeadlist.push(deadcardtext)
				}
			}
		}
		equitystate.deadlist=newdeadlist
		if(saved["board"]&&typeof saved["board"]=="object"){
			let board=saved["board"]
			let floplist=["","",""]
			if(Array.isArray(board["floplist"])){
				for(let i=0;i<3;i=i+1){
					floplist[i]=sanitizecardtext(board["floplist"][i],allowedranklist)
				}
			}
			equitystate.board={
				floplist: floplist,
				turn: sanitizecardtext(board["turn"],allowedranklist),
				river: sanitizecardtext(board["river"],allowedranklist)
			}
		}
		if(saved["board2"]&&typeof saved["board2"]=="object"){
			let board=saved["board2"]
			let floplist=["","",""]
			if(Array.isArray(board["floplist"])){
				for(let i=0;i<3;i=i+1){
					floplist[i]=sanitizecardtext(board["floplist"][i],allowedranklist)
				}
			}
			equitystate.board2={
				floplist: floplist,
				turn: sanitizecardtext(board["turn"],allowedranklist),
				river: sanitizecardtext(board["river"],allowedranklist)
			}
		}
	}catch(error){
	}
}

function cardinlist(cardtext,cardlist){
	for(let i=0;i<cardlist.length;i=i+1){
		if(cardlist[i]==cardtext){
			return true
		}
	}
	return false
}

// kind："" 無標記／"best" 最佳高牌（綠）／"low" 贏得低池（黃）／"both" 上綠下黃。
// 原本第二個參數是布林 bested，只能表達兩種狀態；hi-lo 需要四種。
function cardglyph(cardtext,kind){
	if(!cardtext){
		return `<span class="cardslot">?</span>`
	}
	let layerlist=highlightlayerlist(kind)
	let rank=cardtext.slice(0,cardtext.length-1).toUpperCase()
	let suit=cardtext.slice(-1).toLowerCase()
	let symbol="?"
	for(let i=0;i<SUITLISTALL.length;i=i+1){
		if(SUITLISTALL[i][0]==suit){
			symbol=SUITLISTALL[i][1]
		}
	}
	let markclass=""
	if(0<layerlist.length){
		markclass=" cardslotlayered"
	}else if(kind=="best"){
		markclass=" cardslotbest"
	}
	if(kind=="low"){
		markclass=" cardslotlow"
	}
	if(kind=="both"){
		markclass=" cardslotbest cardslotlow"
	}
	// 顏色交給 carddisplay.css 的 .deckface-two / .deckface-four 決定，跟牌桌上的牌面同一個開關。
	return `<span class="cardslot filled pt-suittext${markclass}" data-suit="${symbol}">${highlightlayerhtml(layerlist)}<span class="cardslottext">${rank}${symbol}</span></span>`
}

// 把「有沒有入選最佳高牌」與「有沒有贏得低池」合成 cardglyph 的 kind。
function glyphkind(bested,lowed){
	if(bested&&lowed){
		return "both"
	}
	if(bested){
		return "best"
	}
	if(lowed){
		return "low"
	}
	return ""
}

function highlightlayerlist(kind){
	let layerlist=[]
	if(Array.isArray(kind)){
		for(let i=0;i<kind.length;i=i+1){
			let layer=parseInt(kind[i],10)
			if(0<layer&&layerlist.indexOf(layer)==-1){
				layerlist.push(layer)
			}
		}
	}
	if(kind=="best"||kind=="high"||kind==true){
		layerlist.push(1)
	}
	if(kind=="low"){
		layerlist.push(2)
	}
	if(kind=="both"){
		layerlist.push(1)
		layerlist.push(2)
	}
	layerlist.sort(function(a,b){
		return a-b
	})
	return layerlist
}

function highlightlayerhtml(layerlist){
	let html=""
	if(0<layerlist.length){
		html=`<span class="cardslotlayerlist">`
		for(let i=0;i<layerlist.length;i=i+1){
			let layer=layerlist[i]
			if(layer>10){
				layer=10
			}
			html=html+`<span class="cardslotlayer-${layer}"></span>`
		}
		html=html+`</span>`
	}
	return html
}

function getusedcardlist(exceptlist){
	let usedcardlist=[]
	function addcard(cardtext){
		if(!cardtext){
			return
		}
		for(let i=0;i<exceptlist.length;i=i+1){
			if(exceptlist[i]==cardtext){
				return
			}
		}
		usedcardlist.push(cardtext)
	}
	for(let i=0;i<equitystate.handlist.length;i=i+1){
		for(let j=0;j<equitystate.handlist[i].length;j=j+1){
			addcard(equitystate.handlist[i][j])
		}
	}
	for(let i=0;i<equitystate.board.floplist.length;i=i+1){
		addcard(equitystate.board.floplist[i])
	}
	addcard(equitystate.board.turn)
	addcard(equitystate.board.river)
	for(let i=0;i<equitystate.board2.floplist.length;i=i+1){
		addcard(equitystate.board2.floplist[i])
	}
	addcard(equitystate.board2.turn)
	addcard(equitystate.board2.river)
	for(let i=0;i<equitystate.deadlist.length;i=i+1){
		addcard(equitystate.deadlist[i])
	}
	return usedcardlist
}

function showcardpicker(titletext,currentcardlist,maxcount,disabledcardlist,confirmcallback){
	let selectedcardlist=[]
	for(let i=0;i<currentcardlist.length;i=i+1){
		if(currentcardlist[i]){
			selectedcardlist.push(currentcardlist[i])
		}
	}
	let modal=document.createElement("div")
	modal.className="toolmodal"
	modal.innerHTML=`
		<div class="toolmodal-body">
			<div class="toolmodal-head">
				<div class="toolmodal-title">${titletext}</div>
				<input type="button" class="toolmodal-close" value="${equitytext("close")}">
			</div>
			<div class="toolmodal-selected hidden" id="pickerselected"></div>
			<div class="cardpicker" id="pickergrid"></div>
			<div class="toolmodal-actions">
				<input type="button" class="toolmodal-cancel" value="${equitytext("cancel")}">
				<input type="button" class="toolmodal-confirm" value="${equitytext("confirm")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(modal)

	function closemodal(){
		if(modal.parentElement){
			ptremovescrollcover(modal)
		}
	}

	function renderpicker(){
		let selectedhtml=""
		for(let i=0;i<maxcount;i=i+1){
			if(selectedcardlist[i]){
				selectedhtml=selectedhtml+`<span>${selectedcardlist[i]}</span>`
			}else{
				selectedhtml=selectedhtml+`<span>?</span>`
			}
		}
		modal.querySelector("#pickerselected").innerHTML=selectedhtml
		let grid=modal.querySelector("#pickergrid")
		grid.innerHTML=""
		let availableranklist=ranklist()
		for(let suitindex=0;suitindex<SUITLISTALL.length;suitindex=suitindex+1){
			let row=document.createElement("div")
			row.className="cardpicker-row"
			for(let rankindex=0;rankindex<availableranklist.length;rankindex=rankindex+1){
				let cardtext=availableranklist[rankindex]+SUITLISTALL[suitindex][0]
				let selecteded=false
				if(selectedcardlist.indexOf(cardtext)>=0){
					selecteded=true
				}
				let disableded=false
				if(disabledcardlist.indexOf(cardtext)>=0&&!selecteded){
					disableded=true
				}
				let button=document.createElement("div")
				button.setAttribute("role","button")
				button.setAttribute("tabindex","0")
				button.addEventListener("keydown",function(event){
					if(event.key=="Enter"||event.key==" "){
						event.preventDefault()
						this.click()
					}
				})
				button.className="cardbtn"
				if(selecteded){
					button.className=button.className+" selected"
				}
				if(disableded){
					button.className=button.className+" disabled"
				}
				button.innerHTML=`<span class="r">${availableranklist[rankindex]}</span><span class="s pt-suittext" data-suit="${SUITLISTALL[suitindex][1]}">${SUITLISTALL[suitindex][1]}</span>`
				button.addEventListener("click",function(){
					if(disableded){
						return
					}
					let selectedindex=selectedcardlist.indexOf(cardtext)
					if(selectedindex>=0){
						selectedcardlist.splice(selectedindex,1)
					}else{
						if(selectedcardlist.length>=maxcount){
							selectedcardlist.splice(0,1)
						}
						selectedcardlist.push(cardtext)
					}
					renderpicker()
				})
				row.appendChild(button)
			}
			grid.appendChild(row)
		}
	}

	renderpicker()
	modal.querySelector(".toolmodal-close").addEventListener("click",closemodal)
	modal.querySelector(".toolmodal-cancel").addEventListener("click",closemodal)
	modal.querySelector(".toolmodal-confirm").addEventListener("click",function(){
		confirmcallback(selectedcardlist.slice())
		closemodal()
	})
}

function buildfixedcardlist(selectedcardlist){
	let needcount=holecount()
	let fixedcardlist=[]
	for(let i=0;i<needcount;i=i+1){
		if(selectedcardlist[i]){
			fixedcardlist.push(selectedcardlist[i])
		}else{
			fixedcardlist.push("")
		}
	}
	return fixedcardlist
}

function getresultrow(handindex){
	for(let i=0;i<equitystate.resultlist.length;i=i+1){
		if(equitystate.resultlist[i]["index"]==handindex){
			return equitystate.resultlist[i]
		}
	}
	return null
}

function getboardbestmap(){
	let bestmap={}
	for(let i=0;i<equitystate.resultlist.length;i=i+1){
		let resultrow=equitystate.resultlist[i]
		if(resultrow["bested"]==true){
			let bestcardlist=resultrow["bestcardlist"]||[]
			for(let j=0;j<bestcardlist.length;j=j+1){
				bestmap[bestcardlist[j]]=true
			}
		}
	}
	return bestmap
}

function rankvalue(rankchar){
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
	return map[String(rankchar||"").toUpperCase()]||0
}

function ranklabel(rankvalue){
	if(rankvalue==1){
		return "A"
	}
	let map={
		14: "A",
		13: "K",
		12: "Q",
		11: "J",
		10: "T"
	}
	return map[rankvalue]||String(rankvalue||0)
}

function parsecardvalue(cardtext){
	let text=String(cardtext||"").toUpperCase()
	if(text.length<2){
		return null
	}
	return {
		card: cardtext,
		key: text,
		rank: rankvalue(text.substring(0,text.length-1)),
		suit: text.substring(text.length-1).toLowerCase()
	}
}

function sortdesc(values){
	values.sort(function(a,b){
		return b-a
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
		values.push(equitystate.gametype=="SD"?5:1)
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
		values.push(equitystate.gametype=="SD"?5:1)
	}
	for(let i=0;i<=values.length-5;i=i+1){
		if(values[i]-1==values[i+1]&&values[i+1]-1==values[i+2]&&values[i+2]-1==values[i+3]&&values[i+3]-1==values[i+4]){
			return values[i+4]
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
			rank: parseInt(rank,10),
			count: counts[rank]
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
	let acelowvalue=(equitystate.gametype=="SD"?5:1)
	let straightlowlabel=(function(){if((straightb==acelowvalue)){return "A"}return ranklabel(straightb)})()
	if(flushed&&straight){
		return { category: 8,ranks: [straight],name: "straight flush",main: straightlowlabel+"-"+ranklabel(straight) }
	}
	if(groups[0]["count"]==4){
		let kicker=0
		for(let i=0;i<groups.length;i=i+1){
			if(groups[i]["count"]==1){
				kicker=groups[i]["rank"]
			}
		}
		return { category: 7,ranks: [groups[0]["rank"],kicker],name: "four of a kind",main: ranklabel(groups[0]["rank"]) }
	}
	if(groups[0]["count"]==3&&groups[1]&&groups[1]["count"]==2){
		return { category: 6,ranks: [groups[0]["rank"],groups[1]["rank"]],name: "full house",main: ranklabel(groups[0]["rank"])+ranklabel(groups[1]["rank"]) }
	}
	if(flushed){
		let sortedranks=sortdesc(ranks)
		return { category: 5,ranks: sortedranks,name: "flush",main: ranklabel(sortedranks[0]) }
	}
	if(straight){
		return { category: 4,ranks: [straight],name: "straight",main: straightlowlabel+"-"+ranklabel(straight) }
	}
	if(groups[0]["count"]==3){
		let kickers=[]
		for(let i=0;i<groups.length;i=i+1){
			if(groups[i]["count"]==1){
				kickers.push(groups[i]["rank"])
			}
		}
		kickers=sortdesc(kickers)
		return { category: 3,ranks: [groups[0]["rank"],kickers[0]||0,kickers[1]||0],name: "three of a kind",main: ranklabel(groups[0]["rank"]) }
	}
	if(groups[0]["count"]==2&&groups[1]&&groups[1]["count"]==2){
		let highpair=Math.max(groups[0]["rank"],groups[1]["rank"])
		let lowpair=Math.min(groups[0]["rank"],groups[1]["rank"])
		return { category: 2,ranks: [highpair,lowpair],name: "two pair",main: ranklabel(highpair)+ranklabel(lowpair) }
	}
	if(groups[0]["count"]==2){
		return { category: 1,ranks: [groups[0]["rank"]],name: "one pair",main: ranklabel(groups[0]["rank"]) }
	}
	let sortedranks=sortdesc(ranks)
	return { category: 0,ranks: sortedranks,name: "high card",main: ranklabel(sortedranks[0]) }
}

function ensureequityrangelist(){
	if(!Array.isArray(equitystate.rangelist)){
		equitystate.rangelist=[]
	}
	while(equitystate.rangelist.length<equitystate.handlist.length){
		equitystate.rangelist.push("")
	}
	while(equitystate.rangelist.length>equitystate.handlist.length){
		equitystate.rangelist.pop()
	}
}

function currentdecklist(){
	let output=[]
	let availableranklist=ranklist()
	for(let rankindex=0;rankindex<availableranklist.length;rankindex=rankindex+1){
		for(let suitindex=0;suitindex<SUITLISTALL.length;suitindex=suitindex+1){
			output.push(availableranklist[rankindex]+SUITLISTALL[suitindex][0])
		}
	}
	return output
}

function rankindexof(rankchar){
	let availableranklist=ranklist()
	return availableranklist.indexOf(String(rankchar||"").toUpperCase())
}

function normalizehandtoken(token){
	let text=String(token||"").trim().toUpperCase()
	text=text.replace(/10/g,"T")
	return text
}

function addrangecombo(combolist,cardone,cardtwo){
	if(cardone==cardtwo){
		return
	}
	let combo=[cardone,cardtwo]
	combo.sort()
	let key=combo[0]+combo[1]
	let existed=false
	for(let i=0;i<combolist.length;i=i+1){
		if(combolist[i][0]+combolist[i][1]==key){
			existed=true
		}
	}
	if(!existed){
		combolist.push(combo)
	}
}

function addrangehand(combolist,rankone,ranktwo,suitedmode){
	let decklist=currentdecklist()
	for(let i=0;i<decklist.length;i=i+1){
		for(let j=i+1;j<decklist.length;j=j+1){
			let cardone=decklist[i]
			let cardtwo=decklist[j]
			let ranka=cardone.slice(0,1).toUpperCase()
			let rankb=cardtwo.slice(0,1).toUpperCase()
			let suita=cardone.slice(-1).toLowerCase()
			let suitb=cardtwo.slice(-1).toLowerCase()
			let matched=false
			if(ranka==rankone&&rankb==ranktwo){
				matched=true
			}
			if(ranka==ranktwo&&rankb==rankone){
				matched=true
			}
			if(matched){
				if(suitedmode=="s"&&suita!=suitb){
					matched=false
				}
				if(suitedmode=="o"&&suita==suitb){
					matched=false
				}
			}
			if(matched){
				addrangecombo(combolist,cardone,cardtwo)
			}
		}
	}
}

function addrangeabstract(combolist,token){
	let text=normalizehandtoken(token)
	let rangedata=text.match(/^([AKQJT98765432])([AKQJT98765432])([SO])?(\+)?$/)
	if(rangedata){
		let rankone=rangedata[1]
		let ranktwo=rangedata[2]
		let suitedmode=String(rangedata[3]||"").toLowerCase()
		let plussed=rangedata[4]=="+"
		if(rankindexof(rankone)<0||rankindexof(ranktwo)<0){
			return false
		}
		if(rankone==ranktwo){
			let startindex=rankindexof(rankone)
			let endindex=startindex
			if(plussed){
				endindex=0
			}
			for(let i=startindex;i>=endindex;i=i-1){
				addrangehand(combolist,ranklist()[i],ranklist()[i],"")
			}
			return true
		}
		let highrank=rankone
		let kickerrank=ranktwo
		if(rankindexof(ranktwo)<rankindexof(rankone)){
			highrank=ranktwo
			kickerrank=rankone
		}
		let startindex=rankindexof(kickerrank)
		let endindex=startindex
		if(plussed){
			endindex=rankindexof(highrank)+1
		}
		for(let i=startindex;i>=endindex;i=i-1){
			addrangehand(combolist,highrank,ranklist()[i],suitedmode)
		}
		return true
	}
	return false
}

function addrangetoken(combolist,token){
	let text=normalizehandtoken(token)
	if(!text){
		return true
	}
	if(text=="*"||text=="ANY"||text=="RANDOM"){
		let decklist=currentdecklist()
		for(let i=0;i<decklist.length;i=i+1){
			for(let j=i+1;j<decklist.length;j=j+1){
				addrangecombo(combolist,decklist[i],decklist[j])
			}
		}
		return true
	}
	let exact=text.match(/^([AKQJT98765432][SHDC])([AKQJT98765432][SHDC])$/)
	if(exact){
		let cardone=sanitizecardtext(exact[1],ranklist())
		let cardtwo=sanitizecardtext(exact[2],ranklist())
		if(cardone&&cardtwo&&cardone!=cardtwo){
			addrangecombo(combolist,cardone,cardtwo)
			return true
		}
		return false
	}
	let rangematch=text.match(/^([AKQJT98765432]{2}[SO]?)-([AKQJT98765432]{2}[SO]?)$/)
	if(rangematch){
		let left=rangematch[1]
		let right=rangematch[2]
		let leftone=left.slice(0,1)
		let lefttwo=left.slice(1,2)
		let rightone=right.slice(0,1)
		let righttwo=right.slice(1,2)
		let suitedmode=String(left.slice(2,3)||right.slice(2,3)||"").toLowerCase()
		if(leftone==lefttwo&&rightone==righttwo){
			let startindex=rankindexof(leftone)
			let endindex=rankindexof(rightone)
			if(startindex>=0&&endindex>=0){
				let step=1
				if(startindex>endindex){
					step=-1
				}
				for(let i=startindex;step==1?i<=endindex:i>=endindex;i=i+step){
					addrangehand(combolist,ranklist()[i],ranklist()[i],"")
				}
				return true
			}
		}
		if(leftone==rightone&&lefttwo!=righttwo){
			let startindex=rankindexof(lefttwo)
			let endindex=rankindexof(righttwo)
			if(startindex>=0&&endindex>=0){
				let step=1
				if(startindex>endindex){
					step=-1
				}
				for(let i=startindex;step==1?i<=endindex:i>=endindex;i=i+step){
					addrangehand(combolist,leftone,ranklist()[i],suitedmode)
				}
				return true
			}
		}
		return false
	}
	return addrangeabstract(combolist,text)
}

function parserangetext(rangetext){
	let text=String(rangetext||"").replace(/\s+/g,"")
	let combolist=[]
	if(!text){
		return combolist
	}
	let tokenlist=text.split(/[,\uff0c]+/)
	for(let i=0;i<tokenlist.length;i=i+1){
		if(!addrangetoken(combolist,tokenlist[i])){
			return null
		}
		if(combolist.length>EQUITYRANGEMAXCOMBO){
			return null
		}
	}
	return combolist
}

function hasrangetext(){
	ensureequityrangelist()
	for(let i=0;i<equitystate.rangelist.length;i=i+1){
		if(String(equitystate.rangelist[i]||"").trim()){
			return true
		}
	}
	return false
}

function rangecompatibleed(combolist,blockedlist){
	for(let i=0;i<combolist.length;i=i+1){
		let blockeded=false
		for(let j=0;j<combolist[i].length;j=j+1){
			if(blockedlist.indexOf(combolist[i][j])>=0){
				blockeded=true
			}
		}
		if(!blockeded){
			return true
		}
	}
	return false
}

function equityrangehandlabel(row,column){
	let availableranklist=ranklist()
	if(row==column){
		return availableranklist[row]+availableranklist[column]
	}
	if(row<column){
		return availableranklist[row]+availableranklist[column]+"s"
	}
	return availableranklist[column]+availableranklist[row]+"o"
}

function showequityrangepicker(handindex){
	if(holecount()!=2){
		pttoast(equitytext("rangeonlyholdem"),"warning")
		return
	}
	let selectedlist=[]
	let savedtokenlist=String(equitystate.rangelist[handindex]||"").split(/[,，]+/)
	for(let i=0;i<savedtokenlist.length;i=i+1){
		let token=normalizehandtoken(savedtokenlist[i])
		if(/^[AKQJT98765432]{2}[SO]?$/.test(token)&&selectedlist.indexOf(token)<0){
			selectedlist.push(token)
		}
	}
	let modal=document.createElement("div")
	modal.className="toolmodal"
	modal.innerHTML=`
		<div class="toolmodal-body equityrange-modalbody">
			<div class="toolmodal-head">
				<div class="toolmodal-title">${equitytext("selectrange")}</div>
				<input type="button" class="toolmodal-close" value="${equitytext("close")}">
			</div>
			<div class="equityrange-picker" id="equityrangepicker"></div>
			<div class="equityrange-selection" id="equityrangeselection"></div>
			<div class="toolmodal-actions">
				<input type="button" class="toolmodal-cancel" value="${equitytext("cancel")}">
				<input type="button" class="toolmodal-confirm" value="${equitytext("confirm")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(modal)

	function closemodal(){
		if(modal.parentElement){
			ptremovescrollcover(modal)
		}
	}

	function renderselection(){
		let grid=modal.querySelector("#equityrangepicker")
		grid.innerHTML=""
		let availableranklist=ranklist()
		for(let row=0;row<availableranklist.length;row=row+1){
			for(let column=0;column<availableranklist.length;column=column+1){
				let hand=equityrangehandlabel(row,column)
				let button=document.createElement("input")
				button.type="button"
				button.className="equityrange-cell"
				button.setAttribute("data-rangehand",hand)
				button.value=hand
				if(selectedlist.indexOf(hand)>=0){
					button.className=button.className+" selected"
				}
				button.addEventListener("click",function(){
					let selectedindex=selectedlist.indexOf(hand)
					if(selectedindex>=0){
						selectedlist.splice(selectedindex,1)
					}else{
						selectedlist.push(hand)
					}
					renderselection()
				})
				grid.appendChild(button)
			}
		}
		let summary=equitytext("selectedrange")+" "+selectedlist.length
		if(selectedlist.length>0){
			summary=summary+" · "+selectedlist.join(",")
		}
		modal.querySelector("#equityrangeselection").textContent=summary
	}

	renderselection()
	modal.querySelector(".toolmodal-close").addEventListener("click",closemodal)
	modal.querySelector(".toolmodal-cancel").addEventListener("click",closemodal)
	modal.querySelector(".toolmodal-confirm").addEventListener("click",function(){
		equitystate.rangelist[handindex]=selectedlist.join(",")
		if(selectedlist.length>0){
			equitystate.handlist[handindex]=["",""]
		}
		clearequityresult()
		persiststate()
		closemodal()
		renderhandlist()
		renderboardcard()
		autosolveequity()
	})
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

function comparehandvalue(a,b){
	if(a["category"]!=b["category"]){
		return a["category"]-b["category"]
	}
	return comparearrays(a["ranks"],b["ranks"])
}

function bestholdemcombo(cardtextlist){
	let parsed=[]
	for(let i=0;i<cardtextlist.length;i=i+1){
		let item=parsecardvalue(cardtextlist[i])
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
						let combo=[parsed[a],parsed[b],parsed[c],parsed[d],parsed[e]]
						let value=evaluatefive(combo)
						if(!best||0<comparehandvalue(value,best["value"])){
							best={
								"value": value,
								"cardlist": [combo[0]["card"],combo[1]["card"],combo[2]["card"],combo[3]["card"],combo[4]["card"]]
							}
						}
					}
				}
			}
		}
	}
	return best
}

function bestomahacombo(holelist,boardlist){
	if(holelist.length<2||boardlist.length<3){
		return null
	}
	let best=null
	for(let a=0;a<holelist.length-1;a=a+1){
		for(let b=a+1;b<holelist.length;b=b+1){
			for(let c=0;c<boardlist.length-2;c=c+1){
				for(let d=c+1;d<boardlist.length-1;d=d+1){
					for(let e=d+1;e<boardlist.length;e=e+1){
						let cardtextlist=[holelist[a],holelist[b],boardlist[c],boardlist[d],boardlist[e]]
						let parsed=[]
						for(let k=0;k<cardtextlist.length;k=k+1){
							parsed.push(parsecardvalue(cardtextlist[k]))
						}
						let value=evaluatefive(parsed)
						if(!best||0<comparehandvalue(value,best["value"])){
							best={
								"value": value,
								"cardlist": cardtextlist
							}
						}
					}
				}
			}
		}
	}
	return best
}

function scorecategorytext(category){
	let map={
		"9": "fivekind",
		"8": "straightflush",
		"7": "quads",
		"6": "fullhouse",
		"5": "flush",
		"4": "straight",
		"3": "trips",
		"2": "twopair",
		"1": "pair",
		"0": "highcard"
	}
	return equitytext(map[String(category)]||"wildbest")
}

function deuceswildbestlabel(scorelist){
	if(!Array.isArray(scorelist)||scorelist.length<1){
		return ""
	}
	let category=Number(scorelist[0])
	let maintext=""
	if(category==8||category==4){
		let high=Number(scorelist[1])||0
		let low=high-4
		if(high==5){
			low=1
		}
		maintext=ranklabel(low)+"-"+ranklabel(high)
	}else if(category==6||category==2){
		maintext=ranklabel(Number(scorelist[1])||0)+ranklabel(Number(scorelist[2])||0)
	}else if(category>=0){
		maintext=ranklabel(Number(scorelist[1])||0)
	}
	if(maintext){
		return "("+scorecategorytext(category)+" "+maintext+")"
	}
	return "("+scorecategorytext(category)+")"
}

// 目前公共牌的清單（只取已選的，順序是 flop → turn → river）。
function equityboardcardlist(){
	return equityboardcardlistfromdata(equitystate.board)
}

function equityboardcardlistfromdata(boarddata){
	let cardlist=[]
	for(let i=0;i<boarddata.floplist.length;i=i+1){
		if(boarddata.floplist[i]){
			cardlist.push(boarddata.floplist[i])
		}
	}
	if(boarddata.turn){
		cardlist.push(boarddata.turn)
	}
	if(boarddata.river){
		cardlist.push(boarddata.river)
	}
	return cardlist
}

function addpreviewlayer(data,cardlist,layer){
	for(let i=0;i<(cardlist||[]).length;i=i+1){
		let cardtext=cardlist[i]["card"]||cardlist[i]
		if(!data[cardtext]){
			data[cardtext]=[]
		}
		if(data[cardtext].indexOf(layer)==-1){
			data[cardtext].push(layer)
		}
	}
}

function equitybasepreviewoffset(lowmap){
	let offset=0
	for(let i=0;i<equitystate.resultlist.length;i=i+1){
		let resultrow=getresultrow(i)
		if(resultrow&&resultrow["bested"]==true){
			offset=1
		}
	}
	let boardlowmap=(lowmap||{})["board"]||{}
	for(let key in boardlowmap){
		offset=2
	}
	let handlowmap=(lowmap||{})["hand"]||{}
	for(let key in handlowmap){
		let rowmap=handlowmap[key]||{}
		for(let cardkey in rowmap){
			offset=2
		}
	}
	return offset
}

function combineequityhighlight(kind,preview,offset){
	let layerlist=highlightlayerlist(kind)
	let previewlist=highlightlayerlist(preview)
	for(let i=0;i<previewlist.length;i=i+1){
		let layer=previewlist[i]+offset
		if(layerlist.indexOf(layer)==-1){
			layerlist.push(layer)
		}
	}
	return layerlist
}

function equitypreviewmap(handindex){
	let output={
		"hand": {},
		"board": {},
		"board2": {}
	}
	if(handindex==null){
		return output
	}
	let holelist=equitystate.handlist[handindex]||[]
	let boarddatalist=[equitystate.board]
	let boardkeylist=["board"]
	if(equitystate.boardmode=="double"){
		boarddatalist.push(equitystate.board2)
		boardkeylist.push("board2")
	}
	let layer=1
	for(let i=0;i<boarddatalist.length;i=i+1){
		let boardlist=equityboardcardlistfromdata(boarddatalist[i])
		let combo=null
		if(boardlist.length>=5){
			if(equitystate.gametype=="DW"&&i==0){
				let resultrow=getresultrow(handindex)
				if(resultrow&&Array.isArray(resultrow["bestcardlist"])){
					combo={
						"cardlist": resultrow["bestcardlist"]
					}
				}
			}else if(equitystate.gametype=="OM"||equitystate.gametype=="O5"||equitystate.gametype=="O8"||equitystate.gametype=="BO"){
				combo=bestomahacombo(holelist,boardlist)
			}else{
				combo=bestholdemcombo(holelist.concat(boardlist))
			}
		}
		if(combo){
			addpreviewlayer(output["hand"],combo["cardlist"],layer)
			addpreviewlayer(output[boardkeylist[i]],combo["cardlist"],layer)
			layer=layer+1
		}
		if(equityhiloed()){
			let oldboard=equitystate.board
			equitystate.board=boarddatalist[i]
			let lowcombo=bestlowcombo(handindex)
			equitystate.board=oldboard
			if(lowcombo){
				addpreviewlayer(output["hand"],lowcombo["cardlist"],layer)
				addpreviewlayer(output[boardkeylist[i]],lowcombo["cardlist"],layer)
				layer=layer+1
			}
		}
	}
	return output
}

// 這五張是否構成合格的低牌：點數都 8 或更小（A 算 1）、且不能重複。
// 不合格回 null，合格回由大到小排好的點數陣列（越小的陣列代表越好的低牌）。
function lowcombovalue(cardtextlist){
	let valuelist=[]
	for(let i=0;i<cardtextlist.length;i=i+1){
		let item=parsecardvalue(cardtextlist[i])
		if(!item){
			return null
		}
		let value=item["rank"]
		if(value==14){
			value=1
		}
		if(value>8){
			return null
		}
		if(valuelist.indexOf(value)>=0){
			return null
		}
		valuelist.push(value)
	}
	return sortdesc(valuelist)
}

// 這一手的最佳低牌組合。湊不出合格低牌時回 null。
// 與後端 equitylowscore() 同一套規則：底牌剛好 2 張 + 公共牌剛好 3 張，
// 五個層次的巢狀迴圈就是在窮舉這兩組組合，底牌最多 5 張、公共牌 5 張，共 100 組。
//
// 回傳的是**實際那五張牌**而不只是文字 —— 牌面要發黃光就必須知道是哪幾張，
// 原本只回文字（bestlowlabel）拿不到牌，所以拆成這支加上 lowlabelof()。
function bestlowcombo(handindex){
	let holelist=[]
	for(let i=0;i<(equitystate.handlist[handindex]||[]).length;i=i+1){
		if(equitystate.handlist[handindex][i]){
			holelist.push(equitystate.handlist[handindex][i])
		}
	}
	let boardlist=equityboardcardlist()
	let bestlow=null
	let bestcard=[]
	if(holelist.length>=2&&boardlist.length>=5){
		for(let a=0;a<holelist.length;a=a+1){
			for(let b=a+1;b<holelist.length;b=b+1){
				for(let c=0;c<boardlist.length;c=c+1){
					for(let d=c+1;d<boardlist.length;d=d+1){
						for(let e=d+1;e<boardlist.length;e=e+1){
							let combocard=[holelist[a],holelist[b],boardlist[c],boardlist[d],boardlist[e]]
							let combovalue=lowcombovalue(combocard)
							if(combovalue){
								let betteredd=false
								if(bestlow==null){
									betteredd=true
								}else{
									for(let f=0;f<combovalue.length;f=f+1){
										if(combovalue[f]!=bestlow[f]){
											betteredd=combovalue[f]<bestlow[f]
											break
										}
									}
								}
								if(betteredd){
									bestlow=combovalue
									bestcard=combocard
								}
							}
						}
					}
				}
			}
		}
	}
	if(!bestlow){
		return null
	}
	return {
		"cardlist": bestcard,
		"value": bestlow
	}
}

// 把低牌的點數陣列變成顯示文字，例如「(低牌 8-4-3-2-A)」。
// 點數一定 ≤8，所以只有 1 要換成 A。
function lowlabelof(combo){
	if(!combo){
		return ""
	}
	let labeltext=""
	for(let i=0;i<combo["value"].length;i=i+1){
		let piece=String(combo["value"][i])
		if(combo["value"][i]==1){
			piece="A"
		}
		if(labeltext){
			labeltext=labeltext+"-"
		}
		labeltext=labeltext+piece
	}
	return "("+equitytext("lowlabel")+" "+labeltext+")"
}

// 贏得低池的那幾手，各自用到的牌。回傳 { handindex: {牌: true}, board: {牌: true} }。
//
// 語意刻意與高牌側的 bested 對齊：後端的 bested 是「達到全場最佳高牌分數」而不是
// 「這一手自己的最佳五張」，所以低牌這邊也是「達到全場最好的低牌」才發光，
// 不是每一手都把自己的低牌標起來 —— 否則畫面上會有一堆牌發黃光但其實沒贏到低池。
function lowwinnermap(){
	let output={
		"hand": {},
		"board": {}
	}
	if(equityhiloed()==false||boardcount()<5){
		return output
	}
	let combolist=[]
	let bestvalue=null
	for(let i=0;i<equitystate.handlist.length;i=i+1){
		let combo=bestlowcombo(i)
		combolist.push(combo)
		if(combo){
			let betteredd=false
			if(bestvalue==null){
				betteredd=true
			}else{
				for(let k=0;k<combo["value"].length;k=k+1){
					if(combo["value"][k]!=bestvalue[k]){
						betteredd=combo["value"][k]<bestvalue[k]
						break
					}
				}
			}
			if(betteredd){
				bestvalue=combo["value"]
			}
		}
	}
	if(bestvalue==null){
		return output
	}
	let boardlist=equityboardcardlist()
	for(let i=0;i<combolist.length;i=i+1){
		let combo=combolist[i]
		if(!combo){
			continue
		}
		let sameed=true
		for(let k=0;k<combo["value"].length;k=k+1){
			if(combo["value"][k]!=bestvalue[k]){
				sameed=false
			}
		}
		if(sameed==false){
			continue
		}
		if(!output["hand"][i]){
			output["hand"][i]={}
		}
		for(let k=0;k<combo["cardlist"].length;k=k+1){
			let cardtext=combo["cardlist"][k]
			if(cardinlist(cardtext,boardlist)){
				output["board"][cardtext]=true
			}else{
				output["hand"][i][cardtext]=true
			}
		}
	}
	return output
}

function besthandlabel(resultrow){
	if(resultrow&&equitystate.gametype=="DW"){
		let dwlabel=deuceswildbestlabel(resultrow["bestscore"])
		if(dwlabel){
			return dwlabel
		}
	}
	let bestcardlist=[]
	if(resultrow){
		bestcardlist=resultrow["bestcardlist"]||[]
	}
	let parsed=[]
	for(let i=0;i<(bestcardlist||[]).length;i=i+1){
		let item=parsecardvalue(bestcardlist[i])
		if(item){
			parsed.push(item)
		}
	}
	if(parsed.length!=5){
		return ""
	}
	let value=evaluatefive(parsed)
	return "("+value["name"]+" "+value["main"]+")"
}

function boardcount(){
	let count=0
	for(let i=0;i<equitystate.board.floplist.length;i=i+1){
		if(equitystate.board.floplist[i]){
			count=count+1
		}
	}
	if(equitystate.board.turn){
		count=count+1
	}
	if(equitystate.board.river){
		count=count+1
	}
	return count
}

function pctformat(value){
	let percentvalue=Number(value)||0
	if(percentvalue<=0){
		return "0"
	}
	if(percentvalue<0.1){
		return "<0.1"
	}
	if(percentvalue>99&&percentvalue<100){
		return ">99"
	}
	if(percentvalue>=10){
		return String(Math.round(percentvalue))
	}
	return percentvalue.toFixed(1)
}

function renderoutcardgrid(cardlist){
	let html=`<div class="w-full mt-1 flex flex-wrap items-center gap-[0.15rem]">`
	for(let i=0;i<cardlist.length;i=i+1){
		let rank=cardlist[i].slice(0,cardlist[i].length-1).toUpperCase()
		let suit=cardlist[i].slice(-1).toLowerCase()
		let symbol="?"
		for(let j=0;j<SUITLISTALL.length;j=j+1){
			if(SUITLISTALL[j][0]==suit){
				symbol=SUITLISTALL[j][1]
			}
		}
		html=html+`<span class="cardchip pt-suittext" data-suit="${symbol}">${rank}${symbol}</span>`
	}
	html=html+`</div>`
	return html
}

function statuslabel(statustext,outcardlist,chopoutlist){
	if(statustext=="need_flop"){
		return equitytext("needflop")
	}
	if(statustext=="runner_runner"){
		return equitytext("runnerrunner")
	}
	if(statustext=="drawing_dead"){
		return equitytext("drawingdead")
	}
	if(statustext=="ahead"){
		return equitytext("ahead")
	}
	if(statustext=="win"){
		return equitytext("winlocked")
	}
	if(statustext=="tie_only"){
		return equitytext("tieonly")
	}
	if(statustext=="out"){
		let html=equitytext("outlabel")+` <span class="text-zinc-500">(${outcardlist.length})</span>`
		html=html+renderoutcardgrid(outcardlist)
		if(chopoutlist&&0<chopoutlist.length){
			html=html+`<div class="mt-2">${equitytext("chopoutlabel")} <span class="text-zinc-500">(${chopoutlist.length})</span></div>`
			html=html+renderoutcardgrid(chopoutlist)
		}
		return html
	}
	if(statustext=="chop_out"){
		let html=equitytext("chopoutlabel")+` <span class="text-zinc-500">(${chopoutlist.length})</span>`
		html=html+renderoutcardgrid(chopoutlist)
		return html
	}
	return ""
}

function renderhandresult(resultrow){
	if(!resultrow){
		return ""
	}
	let winvalue=Number(resultrow["win"])||0
	let tievalue=Number(resultrow["tie"])||0
	let labelhtml=""
	let rangehtml=""
	if(resultrow["rangecount"]){
		rangehtml=`<div class="equityrangemeta">${equitytext("rangecount")} ${resultrow["rangecount"]} · ${equitytext("rangesample")} ${resultrow["sample"]||0}</div>`
	}
	if(boardcount()>=5){
		let bestlabel=besthandlabel(resultrow)
		if(equityhiloed()){
			// 後端的 bestcardlist 只有高牌那五張，低牌在這裡自己算（規則與後端相同）
			let lowlabel=lowlabelof(bestlowcombo(resultrow["index"]))
			if(!lowlabel){
				lowlabel="("+equitytext("nolow")+")"
			}
			if(bestlabel){
				bestlabel=bestlabel+" "+lowlabel
			}else{
				bestlabel=lowlabel
			}
		}
		if(bestlabel){
			labelhtml=`<div class="my-2 text-center text-sm font-bold text-zinc-300">${bestlabel}</div>`
		}
	}
	let statushtml=statuslabel(resultrow["status"],resultrow["outlist"]||resultrow["outs"]||[],resultrow["chopoutlist"]||[])
	if(equityhiloed()){
		// hi-lo 的兩個數字是**平均分池份額**與**通吃率**，不是勝率與平手率。
		// 兩者不互斥（份額 100% 必然通吃 100%），所以不能像高牌那樣疊在同一條進度條上，
		// 也不能沿用「0% 勝 + 100% 平 = 平分底池」那條判斷。
		return `
			${labelhtml}
			<div class="equityinline">
				${rangehtml}
				<div class="equitybar">
					<div class="equitybar-win" data-equitywidth="${winvalue}"></div>
				</div>
				<div class="equitypct">
					<span class="win">${equitytext("sharelabel")} ${pctformat(winvalue)}%</span>
					<span class="tie">${equitytext("scooplabel")} ${pctformat(tievalue)}%</span>
				</div>
				<div class="equityout text-center">${statushtml}</div>
			</div>
		`
	}
	if(pctformat(winvalue)=="0"&&pctformat(tievalue)=="100"){
		statushtml=equitytext("tieonly")
	}
	return `
		${labelhtml}
		<div class="equityinline">
			${rangehtml}
			<div class="equitybar">
				<div class="equitybar-win" data-equitywidth="${winvalue}"></div>
				<div class="equitybar-tie" data-equitywidth="${tievalue}"></div>
			</div>
			<div class="equitypct">
				<span class="win">${pctformat(winvalue)}%</span>
				<span class="tie">${pctformat(tievalue)}%</span>
			</div>
			<div class="equityout text-center">${statushtml}</div>
		</div>
	`
}

function applyequitybarwidth(host){
	let barlist=host.querySelectorAll("[data-equitywidth]")
	for(let i=0;i<barlist.length;i=i+1){
		barlist[i].style.width=barlist[i].getAttribute("data-equitywidth")+"%"
	}
}

function handrowglowed(resultrow){
	if(!resultrow){
		return false
	}
	let winvalue=Number(resultrow["win"])||0
	let tievalue=Number(resultrow["tie"])||0
	if(equityhiloed()){
		// hi-lo 拿滿 100% 份額就是每副牌都通吃，此時 tie（通吃率）也會是 100，
		// 沿用高牌那條 tievalue<=0 的判斷會讓通吃永遠不發光。
		return winvalue>=100
	}
	if(winvalue>=100&&tievalue<=0){
		return true
	}
	return false
}

function renderhandlist(){
	ensureequityrangelist()
	let host=domgetid("handlist")
	host.innerHTML=""
	// 整份算一次就好，不要每一手各算一次 —— lowwinnermap() 內部會對每一手窮舉 100 組
	let lowmap=lowwinnermap()
	let previewmap=equitypreviewmap(equitypreviewhandindex)
	let previewoffset=equitybasepreviewoffset(lowmap)
	for(let i=0;i<equitystate.handlist.length;i=i+1){
		let row=document.createElement("div")
		row.className="handrow"
		row.setAttribute("data-previewhand",i)
		let resultrow=getresultrow(i)
		if(handrowglowed(resultrow)){
			row.className=row.className+" handrowbest"
		}
		let previewed=false
		if(equitypreviewhandindex!=null&&equitypreviewhandindex==i){
			previewed=true
		}
		let cardhtml=""
		let needcount=holecount()
		let bestcardlist=[]
		if(resultrow&&resultrow["bested"]==true){
			bestcardlist=resultrow["bestcardlist"]||[]
		}
		let lowhandmap=lowmap["hand"][i]||{}
		for(let j=0;j<needcount;j=j+1){
			let cardtext=equitystate.handlist[i][j]||""
			let bested=false
			if(cardtext&&cardinlist(cardtext,bestcardlist)){
				bested=true
			}
			let lowed=false
			if(cardtext&&lowhandmap[cardtext]==true){
				lowed=true
			}
			let kind=glyphkind(bested,lowed)
			if(previewed&&cardtext&&previewmap["hand"][cardtext]){
				kind=combineequityhighlight(kind,previewmap["hand"][cardtext],previewoffset)
			}
			cardhtml=cardhtml+cardglyph(cardtext,kind)
		}
		let resulthtml=""
		if(equitystate.solvinged){
			resulthtml=`<div class="equityinline"><div class="equityloading">${equitytext("solve")}...</div></div>`
		}else{
			resulthtml=renderhandresult(resultrow)
		}
		let removedisabled=""
		if(equitystate.handlist.length<=2){
			removedisabled=" disabled"
		}
		row.innerHTML=`
			<div class="flex items-center justify-evenly mb-3">
				<span class="handrow-label">${equitytext("hand")} ${i+1}</span>
				<input type="button" class="handrow-remove" data-removeindex="${i}" value="${equitytext("remove")}"${removedisabled}>
			</div>
			<div class="handrowcard" role="button" tabindex="0" data-handindex="${i}">${cardhtml}</div>
			<div class="equityrangebox">
				<input type="button" class="equityrangeselect" data-rangeindex="${i}" value="${equitytext("selectrange")}">
				<div class="equityrangehint">${String(equitystate.rangelist[i]||equitytext("norangeset"))}</div>
			</div>
			${resulthtml}
		`
		applyequitybarwidth(row)
		host.appendChild(row)
	}

	let handarealist=host.querySelectorAll("[data-handindex]")
	for(let i=0;i<handarealist.length;i=i+1){
		handarealist[i].addEventListener("click",function(){
			let handindex=parseInt(this.getAttribute("data-handindex"),10)
			let currentcardlist=equitystate.handlist[handindex].filter(function(cardtext){
				return !!cardtext
			})
			showcardpicker(equitytext("hand")+" "+(handindex+1),currentcardlist,holecount(),getusedcardlist(equitystate.handlist[handindex]),function(selectedcardlist){
				equitystate.handlist[handindex]=buildfixedcardlist(selectedcardlist)
				if(selectedcardlist.length>0){
					equitystate.rangelist[handindex]=""
				}
				persiststate()
				renderhandlist()
				autosolveequity()
			})
		})
		handarealist[i].addEventListener("keydown",function(event){
			if(event.key=="Enter"||event.key==" "){
				event.preventDefault()
				this.click()
			}
		})
	}

		let removelist=host.querySelectorAll("[data-removeindex]")
	for(let i=0;i<removelist.length;i=i+1){
		removelist[i].addEventListener("click",function(){
			if(equitystate.handlist.length<=2){
				pttoast(equitytext("minhand"),"warning")
				return
			}
			let handindex=parseInt(this.getAttribute("data-removeindex"),10)
			equitystate.handlist.splice(handindex,1)
			equitystate.rangelist.splice(handindex,1)
			clearequityresult()
			persiststate()
			renderhandlist()
			autosolveequity()
		})
	}

	let addbutton=domgetid("addhandbutton")
	addbutton.style.display=""
	if(equitystate.handlist.length>=maxhandcount()){
		addbutton.style.display="none"
	}
	let rangebuttonlist=host.querySelectorAll("[data-rangeindex]")
	for(let i=0;i<rangebuttonlist.length;i=i+1){
		rangebuttonlist[i].addEventListener("click",function(){
			let rangeindex=parseInt(this.getAttribute("data-rangeindex"),10)
			showequityrangepicker(rangeindex)
		})
	}
	bindequitypreviewhand()
}

function setequitypreviewhand(handindex){
	if(equitypreviewhovertimer){
		clearTimeout(equitypreviewhovertimer)
		equitypreviewhovertimer=null
	}
	if(equitypreviewhandindex!=handindex){
		equitypreviewhandindex=handindex
		renderhandlist()
		renderboardcard()
	}
}

function clearequitypreviewhand(){
	if(equitypreviewhovertimer){
		clearTimeout(equitypreviewhovertimer)
		equitypreviewhovertimer=null
	}
	if(equitypreviewhandindex!=null){
		equitypreviewhandindex=null
		renderhandlist()
		renderboardcard()
	}
}

function bindequitypreviewhand(){
	let previewlist=document.querySelectorAll("[data-previewhand]")
	for(let i=0;i<previewlist.length;i=i+1){
		previewlist[i].addEventListener("mouseenter",function(){
			let handindex=parseInt(this.getAttribute("data-previewhand"),10)
			if(equitypreviewhovertimer){
				clearTimeout(equitypreviewhovertimer)
			}
			equitypreviewhovertimer=setTimeout(function(){
				equitypreviewhovertimer=null
				setequitypreviewhand(handindex)
			},EQUITYPREVIEWHOVERDELAYMS)
		})
		previewlist[i].addEventListener("mouseleave",function(){
			clearequitypreviewhand()
		})
	}
}

function renderboardcard(){
	let host=domgetid("boardcard")
	let bestmap=getboardbestmap()
	let lowmap=lowwinnermap()
	let previewmap=equitypreviewmap(equitypreviewhandindex)
	let previewoffset=equitybasepreviewoffset(lowmap)
	function boardhtml(boarddata,boardindex,labeltext){
		let previewboardmap=previewmap["board"]
		if(boardindex==2){
			previewboardmap=previewmap["board2"]
		}

		let flophtml=""
		for(let i=0;i<3;i=i+1){
			let cardtext=boarddata.floplist[i]||""
			let bested=false
			if(cardtext&&bestmap[cardtext]==true){
				bested=true
			}
			let lowed=false
			if(cardtext&&lowmap["board"][cardtext]==true){
				lowed=true
			}
			let kind=glyphkind(bested,lowed)
			if(equitypreviewhandindex!=null&&cardtext&&previewboardmap[cardtext]){
				kind=combineequityhighlight(kind,previewboardmap[cardtext],previewoffset)
			}
			flophtml=flophtml+cardglyph(cardtext,kind)
		}
		let turnbest=false
		if(boarddata.turn&&bestmap[boarddata.turn]==true){
			turnbest=true
		}
		let turnlow=false
		if(boarddata.turn&&lowmap["board"][boarddata.turn]==true){
			turnlow=true
		}
		let riverbest=false
		if(boarddata.river&&bestmap[boarddata.river]==true){
			riverbest=true
		}
		let riverlow=false
		if(boarddata.river&&lowmap["board"][boarddata.river]==true){
			riverlow=true
		}
		let turnkind=glyphkind(turnbest,turnlow)
		if(equitypreviewhandindex!=null&&boarddata.turn&&previewboardmap[boarddata.turn]){
			turnkind=combineequityhighlight(turnkind,previewboardmap[boarddata.turn],previewoffset)
		}
		let riverkind=glyphkind(riverbest,riverlow)
		if(equitypreviewhandindex!=null&&boarddata.river&&previewboardmap[boarddata.river]){
			riverkind=combineequityhighlight(riverkind,previewboardmap[boarddata.river],previewoffset)
		}
		return `
			<div class="equityboardrow">
				<div class="equityboardrow-label">${labeltext}</div>
				<div class="boardstreet boardstreetflop handrowcard" data-boardindex="${boardindex}" data-boardslot="floplist">${flophtml}</div>
				<div class="boardstreet boardstreetturn handrowcard" data-boardindex="${boardindex}" data-boardslot="turn">${cardglyph(boarddata.turn||"",turnkind)}</div>
				<div class="boardstreet boardstreetriver handrowcard" data-boardindex="${boardindex}" data-boardslot="river">${cardglyph(boarddata.river||"",riverkind)}</div>
			</div>
		`
	}
	let html=boardhtml(equitystate.board,1,equitytext("boardone"))
	if(equitystate.boardmode=="double"){
		html=html+boardhtml(equitystate.board2,2,equitytext("boardtwo"))
	}
	host.innerHTML=html

	let slotlist=host.querySelectorAll("[data-boardslot]")
	for(let i=0;i<slotlist.length;i=i+1){
		slotlist[i].addEventListener("click",function(){
			let boardindex=parseInt(this.getAttribute("data-boardindex"),10)
			let boardslot=this.getAttribute("data-boardslot")
			let boarddata=equitystate.board
			if(boardindex==2){
				boarddata=equitystate.board2
			}
			if(boardslot=="floplist"){
				let currentcardlist=boarddata.floplist.filter(function(cardtext){
					return !!cardtext
				})
				showcardpicker(equitytext("flop"),currentcardlist,3,getusedcardlist(boarddata.floplist),function(selectedcardlist){
					boarddata.floplist=[selectedcardlist[0]||"",selectedcardlist[1]||"",selectedcardlist[2]||""]
					persiststate()
					renderboardcard()
					autosolveequity()
				})
			}else{
				let currentcardlist=[]
				if(boarddata[boardslot]){
					currentcardlist.push(boarddata[boardslot])
				}
				let titletext=equitytext("turn")
				if(boardslot=="river"){
					titletext=equitytext("river")
				}
				showcardpicker(titletext,currentcardlist,1,getusedcardlist([boarddata[boardslot]]),function(selectedcardlist){
					if(selectedcardlist[0]){
						boarddata[boardslot]=selectedcardlist[0]
					}else{
						boarddata[boardslot]=""
					}
					persiststate()
					renderboardcard()
					autosolveequity()
				})
			}
		})
	}
}

function renderdeadcard(){
	let host=domgetid("deadcard")
	if(!host){
		return
	}
	let cardhtml=""
	for(let i=0;i<equitystate.deadlist.length;i=i+1){
		cardhtml=cardhtml+cardglyph(equitystate.deadlist[i],"")
	}
	if(equitystate.deadlist.length==0){
		cardhtml=cardglyph("","")
	}
	host.innerHTML=`<div class="handrowcard deadcardslot" data-deadslot="1">${cardhtml}</div>`
	host.querySelector("[data-deadslot]").addEventListener("click",function(){
		showcardpicker(equitytext("dead"),equitystate.deadlist.slice(),52,getusedcardlist(equitystate.deadlist),function(selectedcardlist){
			let newdeadlist=[]
			for(let i=0;i<selectedcardlist.length;i=i+1){
				if(selectedcardlist[i]&&newdeadlist.indexOf(selectedcardlist[i])<0){
					newdeadlist.push(selectedcardlist[i])
				}
			}
			equitystate.deadlist=newdeadlist
			clearequityresult()
			persiststate()
			renderdeadcard()
			renderhandlist()
			renderboardcard()
			autosolveequity()
		})
	})
}

function rendergametype(){
	let buttonlist=document.querySelectorAll(".gametypebtn")
	for(let i=0;i<buttonlist.length;i=i+1){
		let activeed=false
		if(buttonlist[i].getAttribute("data-gametype")==equitystate.gametype){
			activeed=true
		}
		buttonlist[i].classList.toggle("active",activeed)
	}
}

function boardcountvalue(){
	if(equitystate.boardmode=="double"){
		return 2
	}
	return 1
}

function renderboardcount(){
	innertext("#boardcountvalue",String(boardcountvalue()),false)
	let removebutton=domgetid("removeboardbutton")
	let addbutton=domgetid("addboardbutton")
	if(removebutton){
		removebutton.disabled=boardcountvalue()<=1
	}
	if(addbutton){
		addbutton.disabled=boardcountvalue()>=2
	}
}

function clearequityresult(){
	equitystate.resultlist=[]
	equitystate.solvinged=false
}

function allhandreadyed(){
	if(equitystate.handlist.length<2){
		return false
	}
	ensureequityrangelist()
	let ranged=hasrangetext()
	for(let i=0;i<equitystate.handlist.length;i=i+1){
		if(ranged&&String(equitystate.rangelist[i]||"").trim()){
			let combolist=parserangetext(equitystate.rangelist[i])
			if(combolist==null||combolist.length<=0){
				return false
			}
		}else{
			let filledcount=0
			for(let j=0;j<equitystate.handlist[i].length;j=j+1){
				if(equitystate.handlist[i][j]){
					filledcount=filledcount+1
				}
			}
			if(filledcount!=holecount()){
				return false
			}
		}
	}
	return true
}

function solveequity(){
	ensureequityrangelist()
	if(hasrangetext()&&holecount()!=2){
		clearequityresult()
		renderhandlist()
		renderboardcard()
		pttoast(equitytext("rangeonlyholdem"),"warning")
		return
	}
	let handlist=[]
	let rangelist=[]
	let blockedlist=equitystate.deadlist.slice()
	for(let i=0;i<equitystate.board.floplist.length;i=i+1){
		if(equitystate.board.floplist[i]){
			blockedlist.push(equitystate.board.floplist[i])
		}
	}
	if(equitystate.board.turn){
		blockedlist.push(equitystate.board.turn)
	}
	if(equitystate.board.river){
		blockedlist.push(equitystate.board.river)
	}
	if(equitystate.boardmode=="double"){
		for(let i=0;i<equitystate.board2.floplist.length;i=i+1){
			if(equitystate.board2.floplist[i]){
				blockedlist.push(equitystate.board2.floplist[i])
			}
		}
		if(equitystate.board2.turn){
			blockedlist.push(equitystate.board2.turn)
		}
		if(equitystate.board2.river){
			blockedlist.push(equitystate.board2.river)
		}
	}
	for(let i=0;i<equitystate.handlist.length;i=i+1){
		if(String(equitystate.rangelist[i]||"").trim()){
			let combolist=parserangetext(equitystate.rangelist[i])
			if(combolist==null||combolist.length<=0||!rangecompatibleed(combolist,blockedlist)){
				clearequityresult()
				renderhandlist()
				renderboardcard()
				pttoast(equitytext("rangeerror"),"warning")
				return
			}
			rangelist.push(combolist)
			handlist.push(combolist[0])
		}else{
			let selectedcardlist=equitystate.handlist[i].filter(function(cardtext){
				return !!cardtext
			})
			if(selectedcardlist.length!=holecount()){
				clearequityresult()
				renderhandlist()
				renderboardcard()
				return
			}
			handlist.push(selectedcardlist)
			rangelist.push([selectedcardlist])
		}
	}
	let bodydata={
		gametype: equitystate.gametype,
		handlist: handlist,
		board: {
			floplist: equitystate.board.floplist.slice(),
			turn: equitystate.board.turn,
			river: equitystate.board.river
		},
		dead: equitystate.deadlist.slice()
	}
	if(hasrangetext()){
		bodydata["rangelist"]=rangelist
	}
	if(equitystate.boardmode=="double"){
		bodydata["boardlist"]=[
			{
				"floplist": equitystate.board.floplist.slice(),
				"turn": equitystate.board.turn,
				"river": equitystate.board.river
			},
			{
				"floplist": equitystate.board2.floplist.slice(),
				"turn": equitystate.board2.turn,
				"river": equitystate.board2.river
			}
		]
	}
	equityrequestid=equityrequestid+1
	let requestid=equityrequestid
	equitystate.solvinged=true
	renderhandlist()
	// 有登入就帶 token：後端驗過 token 的請求可略過匿名的每 IP 限流；未登入時不帶，維持匿名可用
	let headerlist=[
		["Content-Type","application/json"]
	]
	let token=weblsget(WEBLSNAME+"token")
	if(token){
		headerlist.push(["Authorization","Bearer "+token])
	}
	ajax("POST",AJAXURL+"equity",function(event,data){
		if(requestid!=equityrequestid){
			return
		}
		equitystate.solvinged=false
		if(data&&data["success"]){
			let resultlist=[]
			if(data["data"]&&data["data"]["resultlist"]){
				resultlist=data["data"]["resultlist"]
			}else if(data["data"]&&data["data"]["results"]){
				resultlist=data["data"]["results"]
			}
			equitystate.resultlist=resultlist
			renderhandlist()
			renderboardcard()
		}else{
			equitystate.resultlist=[]
			renderhandlist()
			renderboardcard()
			pttoast(pterror((data&&data["data"])||equitytext("solvefail")),"error")
		}
	},JSON.stringify(bodydata),headerlist)
}

function autosolveequity(){
	if(equitysolvetimer){
		clearTimeout(equitysolvetimer)
		equitysolvetimer=null
	}
	if(allhandreadyed()){
		// 每選一張牌就送一次會很快用完後端限流額度，這裡延遲彙整連續的選牌動作，只送最後一次
		equityrequestid=equityrequestid+1
		equitystate.solvinged=true
		renderhandlist()
		equitysolvetimer=setTimeout(function(){
			equitysolvetimer=null
			solveequity()
		},EQUITYSOLVEDELAYMS)
		return
	}
	equityrequestid=equityrequestid+1
	clearequityresult()
	renderhandlist()
	renderboardcard()
}

function applyequitylanguage(){
	document.title=equitytext("title")+" - PokerTrace"
	innertext("#equitytitle",equitytext("title"),false)
	innertext("#back",equitytext("back"),false)
	innertext("#equitygametypelabel",equitytext("gametype"),false)
	innertext("#equityhandlistlabel",equitytext("handlist"),false)
	innertext("#equityboardlabel",equitytext("board"),false)
	innertext("#equityboardmodelabel",equitytext("boardmode"),false)
	innertext("#equitydeadlabel",equitytext("dead"),false)
	innertext("#equitydeadhint",equitytext("deadhint"),false)
	value("#addhandbutton","+ "+equitytext("addhand"))
	value("#clearbutton",equitytext("clear"))
	let buttonlist=document.querySelectorAll(".gametypebtn")
	for(let i=0;i<buttonlist.length;i=i+1){
		let gametype=buttonlist[i].getAttribute("data-gametype")
		if(gametype=="OM"){
			buttonlist[i].textContent=equitytext("omaha")
		}else if(gametype=="O5"){
			buttonlist[i].textContent=equitytext("omaha5")
		}else if(gametype=="O8"){
			buttonlist[i].textContent=equitytext("omaha8")
		}else if(gametype=="BO"){
			buttonlist[i].textContent=equitytext("bigo")
		}else if(gametype=="SD"){
			buttonlist[i].textContent=equitytext("shortdeck")
		}else if(gametype=="SH"){
			buttonlist[i].textContent=equitytext("superholdem")
		}else if(gametype=="DW"){
			buttonlist[i].textContent=equitytext("deuceswild")
		}else{
			buttonlist[i].textContent=equitytext("holdem")
		}
	}
}

function applyequitygametype(needcount,allowedranklist){
	for(let i=0;i<equitystate.handlist.length;i=i+1){
		let selectedcardlist=equitystate.handlist[i].filter(function(cardtext){
			return !!cardtext
		})
		selectedcardlist=selectedcardlist.filter(function(cardtext){
			return allowedranklist.indexOf(String(cardtext).slice(0,1).toUpperCase())>=0
		})
		let fixedcardlist=[]
		for(let j=0;j<needcount;j=j+1){
			if(selectedcardlist[j]){
				fixedcardlist.push(selectedcardlist[j])
			}else{
				fixedcardlist.push("")
			}
		}
		equitystate.handlist[i]=fixedcardlist
	}
	let boardcardlist=equitystate.board.floplist.filter(function(cardtext){
		return !!cardtext
	})
	boardcardlist=boardcardlist.filter(function(cardtext){
		return allowedranklist.indexOf(String(cardtext).slice(0,1).toUpperCase())>=0
	})
	equitystate.board.floplist=[boardcardlist[0]||"",boardcardlist[1]||"",boardcardlist[2]||""]
	if(allowedranklist.indexOf(String(equitystate.board.turn||"").slice(0,1).toUpperCase())<0){
		equitystate.board.turn=""
	}
	if(allowedranklist.indexOf(String(equitystate.board.river||"").slice(0,1).toUpperCase())<0){
		equitystate.board.river=""
	}
	let boardcardlist2=equitystate.board2.floplist.filter(function(cardtext){
		return !!cardtext
	})
	boardcardlist2=boardcardlist2.filter(function(cardtext){
		return allowedranklist.indexOf(String(cardtext).slice(0,1).toUpperCase())>=0
	})
	equitystate.board2.floplist=[boardcardlist2[0]||"",boardcardlist2[1]||"",boardcardlist2[2]||""]
	if(allowedranklist.indexOf(String(equitystate.board2.turn||"").slice(0,1).toUpperCase())<0){
		equitystate.board2.turn=""
	}
	if(allowedranklist.indexOf(String(equitystate.board2.river||"").slice(0,1).toUpperCase())<0){
		equitystate.board2.river=""
	}
	equitystate.deadlist=equitystate.deadlist.filter(function(cardtext){
		return allowedranklist.indexOf(String(cardtext).slice(0,1).toUpperCase())>=0
	})
	while(equitystate.handlist.length>maxhandcount()){
		equitystate.handlist.pop()
	}
	clearequityresult()
	persiststate()
	rendergametype()
	renderboardcount()
	renderhandlist()
	renderboardcard()
	renderdeadcard()
	autosolveequity()
}

function equityhashandcards(){
	for(let i=0;i<equitystate.handlist.length;i=i+1){
		for(let j=0;j<equitystate.handlist[i].length;j=j+1){
			if(equitystate.handlist[i][j]){
				return true
			}
		}
	}
	return false
}

onclick(".gametypebtn",function(element){
	let gametype=element.getAttribute("data-gametype")
	if(gametype==equitystate.gametype){
		return
	}
	if(equityhashandcards()){
		ptconfirm(equitytext("gametypeswitchconfirm"),function(ok){
			if(!ok){
				rendergametype()
				return
			}
			equitystate.gametype=gametype
			applyequitygametype(holecount(),ranklist())
		})
		return
	}
	equitystate.gametype=gametype
	applyequitygametype(holecount(),ranklist())
})

onclick("#removeboardbutton",function(){
	if(equitystate.boardmode=="single"){
		return
	}
	equitystate.boardmode="single"
	if(equitystate.handlist.length>maxhandcount()){
		while(equitystate.handlist.length>maxhandcount()){
			equitystate.handlist.pop()
		}
	}
	clearequityresult()
	persiststate()
	renderboardcount()
	renderhandlist()
	renderboardcard()
	autosolveequity()
})

onclick("#addboardbutton",function(){
	if(equitystate.boardmode=="double"){
		return
	}
	equitystate.boardmode="double"
	clearequityresult()
	persiststate()
	renderboardcount()
	renderhandlist()
	renderboardcard()
	autosolveequity()
})

onclick("#addhandbutton",function(){
	if(equitystate.handlist.length>=maxhandcount()){
		return
	}
	let newcardlist=[]
	for(let i=0;i<holecount();i=i+1){
		newcardlist.push("")
	}
	equitystate.handlist.push(newcardlist)
	equitystate.rangelist.push("")
	clearequityresult()
	persiststate()
	renderhandlist()
	renderboardcard()
})

onclick("#clearbutton",function(){
	equityrequestid=equityrequestid+1
	for(let i=0;i<equitystate.handlist.length;i=i+1){
		let emptycardlist=[]
		for(let j=0;j<holecount();j=j+1){
			emptycardlist.push("")
		}
		equitystate.handlist[i]=emptycardlist
		equitystate.rangelist[i]=""
	}
	equitystate.board={
		floplist: ["","",""],
		turn: "",
		river: ""
	}
	equitystate.board2={
		floplist: ["","",""],
		turn: "",
		river: ""
	}
	equitystate.deadlist=[]
	clearequityresult()
	persiststate()
	renderhandlist()
	renderboardcard()
	renderdeadcard()
})

loadpersistedstate()
applyequitylanguage()
rendergametype()
renderboardcount()
renderhandlist()
renderboardcard()
renderdeadcard()
autosolveequity()
