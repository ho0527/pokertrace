const RANKLISTALL=["A","K","Q","J","T","9","8","7","6","5","4","3","2"]
const SUITLISTALL=[["s","♠"],["h","♥"],["d","♦"],["c","♣"]]
const EQUITYSTATEKEY=WEBLSNAME+"equitystate"
let equityrequestid=0
let equitysolvetimer=null

const EQUITYMAXHAND=15
const EQUITYSOLVEDELAYMS=300

let equitystate={
	gametype: "HE",
	handlist: [["",""],["",""]],
	board: {
		floplist: ["","",""],
		turn: "",
		river: ""
	},
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
	if(equitystate.gametype=="O5"){
		return 5
	}
	if(equitystate.gametype=="OM"){
		return 4
	}
	return 2
}

function maxhandcount(){
	let decksize=52
	if(equitystate.gametype=="SD"){
		decksize=36
	}
	let cap=Math.floor((decksize-5)/holecount())
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
		board: equitystate.board,
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
		if(savedgametype=="HE"||savedgametype=="OM"||savedgametype=="O5"||savedgametype=="SD"){
			equitystate.gametype=savedgametype
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
	}catch(error){
	}
}

function cardisred(cardtext){
	let suit=String(cardtext||"").slice(-1).toLowerCase()
	if(suit=="h"||suit=="d"){
		return true
	}
	return false
}

function cardinlist(cardtext,cardlist){
	for(let i=0;i<cardlist.length;i=i+1){
		if(cardlist[i]==cardtext){
			return true
		}
	}
	return false
}

function cardglyph(cardtext,bested){
	if(!cardtext){
		return `<span class="cardslot">?</span>`
	}
	let rank=cardtext.slice(0,cardtext.length-1).toUpperCase()
	let suit=cardtext.slice(-1).toLowerCase()
	let symbol="?"
	for(let i=0;i<SUITLISTALL.length;i=i+1){
		if(SUITLISTALL[i][0]==suit){
			symbol=SUITLISTALL[i][1]
		}
	}
	let colorclass="cardblack"
	if(cardisred(cardtext)){
		colorclass="cardred"
	}
	let bestclass=""
	if(bested){
		bestclass=" cardslotbest"
	}
	return `<span class="cardslot filled ${colorclass}${bestclass}">${rank}${symbol}</span>`
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
				let colorclass="cardblack"
				if(SUITLISTALL[suitindex][0]=="h"||SUITLISTALL[suitindex][0]=="d"){
					colorclass="cardred"
				}
				button.innerHTML=`<span class="r">${availableranklist[rankindex]}</span><span class="s ${colorclass}">${SUITLISTALL[suitindex][1]}</span>`
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

function besthandlabel(bestcardlist){
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
	if(percentvalue>=10){
		return String(Math.round(percentvalue))
	}
	return percentvalue.toFixed(1)
}

function renderoutcardgrid(cardlist){
	let html=`<div class="w-full mt-1 flex flex-wrap items-center gap-[0.15rem]">`
	for(let i=0;i<cardlist.length;i=i+1){
		let colorclass="cardblack"
		if(cardisred(cardlist[i])){
			colorclass="cardred"
		}
		let rank=cardlist[i].slice(0,cardlist[i].length-1).toUpperCase()
		let suit=cardlist[i].slice(-1).toLowerCase()
		let symbol="?"
		for(let j=0;j<SUITLISTALL.length;j=j+1){
			if(SUITLISTALL[j][0]==suit){
				symbol=SUITLISTALL[j][1]
			}
		}
		html=html+`<span class="cardchip ${colorclass}">${rank}${symbol}</span>`
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
	if(boardcount()>=5){
		let bestlabel=besthandlabel(resultrow["bestcardlist"]||[])
		if(bestlabel){
			labelhtml=`<div class="my-2 text-center text-sm font-bold text-zinc-300">${bestlabel}</div>`
		}
	}
	let statushtml=statuslabel(resultrow["status"],resultrow["outlist"]||resultrow["outs"]||[],resultrow["chopoutlist"]||[])
	if(pctformat(winvalue)=="0"&&pctformat(tievalue)=="100"){
		statushtml=equitytext("tieonly")
	}
	return `
		${labelhtml}
		<div class="equityinline">
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
	if(winvalue>=100&&tievalue<=0){
		return true
	}
	return false
}

function renderhandlist(){
	let host=domgetid("handlist")
	host.innerHTML=""
	for(let i=0;i<equitystate.handlist.length;i=i+1){
		let row=document.createElement("div")
		row.className="handrow"
		let resultrow=getresultrow(i)
		if(handrowglowed(resultrow)){
			row.className=row.className+" handrowbest"
		}
		let cardhtml=""
		let needcount=holecount()
		let bestcardlist=[]
		if(resultrow&&resultrow["bested"]==true){
			bestcardlist=resultrow["bestcardlist"]||[]
		}
		for(let j=0;j<needcount;j=j+1){
			let cardtext=equitystate.handlist[i][j]||""
			let bested=false
			if(cardtext&&cardinlist(cardtext,bestcardlist)){
				bested=true
			}
			cardhtml=cardhtml+cardglyph(cardtext,bested)
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
			<div class="handrowcard" data-handindex="${i}">${cardhtml}</div>
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
				persiststate()
				renderhandlist()
				autosolveequity()
			})
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
}

function renderboardcard(){
	let host=domgetid("boardcard")
	let flophtml=""
	let bestmap=getboardbestmap()
	for(let i=0;i<3;i=i+1){
		let cardtext=equitystate.board.floplist[i]||""
		let bested=false
		if(cardtext&&bestmap[cardtext]==true){
			bested=true
		}
		flophtml=flophtml+cardglyph(cardtext,bested)
	}
	let turnbest=false
	if(equitystate.board.turn&&bestmap[equitystate.board.turn]==true){
		turnbest=true
	}
	let riverbest=false
	if(equitystate.board.river&&bestmap[equitystate.board.river]==true){
		riverbest=true
	}
	host.innerHTML=`
		<div class="boardstreet boardstreetflop handrowcard" data-boardslot="floplist">${flophtml}</div>
		<div class="boardstreet boardstreetturn handrowcard" data-boardslot="turn">${cardglyph(equitystate.board.turn||"",turnbest)}</div>
		<div class="boardstreet boardstreetriver handrowcard" data-boardslot="river">${cardglyph(equitystate.board.river||"",riverbest)}</div>
	`

	host.querySelector("[data-boardslot=\"floplist\"]").addEventListener("click",function(){
		let currentcardlist=equitystate.board.floplist.filter(function(cardtext){
			return !!cardtext
		})
		showcardpicker("Flop",currentcardlist,3,getusedcardlist(equitystate.board.floplist),function(selectedcardlist){
			equitystate.board.floplist=[selectedcardlist[0]||"",selectedcardlist[1]||"",selectedcardlist[2]||""]
			persiststate()
			renderboardcard()
			autosolveequity()
		})
	})

	host.querySelector("[data-boardslot=\"turn\"]").addEventListener("click",function(){
		let currentcardlist=[]
		if(equitystate.board.turn){
			currentcardlist.push(equitystate.board.turn)
		}
		showcardpicker("Turn",currentcardlist,1,getusedcardlist([equitystate.board.turn]),function(selectedcardlist){
			if(selectedcardlist[0]){
				equitystate.board.turn=selectedcardlist[0]
			}else{
				equitystate.board.turn=""
			}
			persiststate()
			renderboardcard()
			autosolveequity()
		})
	})

	host.querySelector("[data-boardslot=\"river\"]").addEventListener("click",function(){
		let currentcardlist=[]
		if(equitystate.board.river){
			currentcardlist.push(equitystate.board.river)
		}
		showcardpicker("River",currentcardlist,1,getusedcardlist([equitystate.board.river]),function(selectedcardlist){
			if(selectedcardlist[0]){
				equitystate.board.river=selectedcardlist[0]
			}else{
				equitystate.board.river=""
			}
			persiststate()
			renderboardcard()
			autosolveequity()
		})
	})
}

function renderdeadcard(){
	let host=domgetid("deadcard")
	if(!host){
		return
	}
	let cardhtml=""
	for(let i=0;i<equitystate.deadlist.length;i=i+1){
		cardhtml=cardhtml+cardglyph(equitystate.deadlist[i],false)
	}
	if(equitystate.deadlist.length==0){
		cardhtml=cardglyph("",false)
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

function clearequityresult(){
	equitystate.resultlist=[]
	equitystate.solvinged=false
}

function allhandreadyed(){
	if(equitystate.handlist.length<2){
		return false
	}
	for(let i=0;i<equitystate.handlist.length;i=i+1){
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
	return true
}

function solveequity(){
	let handlist=[]
	for(let i=0;i<equitystate.handlist.length;i=i+1){
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
		}else if(gametype=="SD"){
			buttonlist[i].textContent=equitytext("shortdeck")
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
	equitystate.deadlist=equitystate.deadlist.filter(function(cardtext){
		return allowedranklist.indexOf(String(cardtext).slice(0,1).toUpperCase())>=0
	})
	while(equitystate.handlist.length>maxhandcount()){
		equitystate.handlist.pop()
	}
	clearequityresult()
	persiststate()
	rendergametype()
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

onclick("#addhandbutton",function(){
	if(equitystate.handlist.length>=maxhandcount()){
		return
	}
	let newcardlist=[]
	for(let i=0;i<holecount();i=i+1){
		newcardlist.push("")
	}
	equitystate.handlist.push(newcardlist)
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
	}
	equitystate.board={
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
renderhandlist()
renderboardcard()
renderdeadcard()
autosolveequity()
