// handreplay.js
// ===========================================================================
// 手牌動畫回放(handdetail 覆蓋層)
//   * 把單手 bittingdata(依 type 分街 + id 順序)展開成逐步 frame
//   * 在橢圓牌桌(pokertable.css)上逐步播放: 發牌 → 各街下注 → 翻公共牌 → 攤牌
//   * 底牌預設牌背; hero(selfseating)預設亮; 攤牌亮未蓋牌者; 可切「顯示所有底牌」
// ===========================================================================

// 回放用預設計分牌面額(handdetail 沒有場次面額, 用通用色階上色)
let HRCHIPS=[
	{ value: 25000,color: "#0f172a",shape: "circle" },
	{ value: 10000,color: "#3b82f6",shape: "circle" },
	{ value: 5000,color: "#22c55e",shape: "circle" },
	{ value: 1000,color: "#f59e0b",shape: "circle" },
	{ value: 500,color: "#ef4444",shape: "circle" },
	{ value: 100,color: "#e5e7eb",shape: "circle" },
	{ value: 25,color: "#8b5cf6",shape: "circle" }
]

let hrframes=[]
let hrindex=0
let hrtimer=null
let hrhand=null
let hrhero=0
let hrmaxseat=9
let hrrevealall=false
let hrspeed=1
let hrshowpotchips=true
let hrequity={}
let hrequityouts={}
let hrbbmode=false

try{ hrbbmode=(localStorage.getItem("hr-bbmode")=="1") }catch(error){ hrbbmode=false }

// 金額格式: BB 模式時以該手大盲為單位顯示(x.x BB), 否則原始計分牌數
function hrfmtamt(amount){
	let n=hrint(amount)
	let bb=hrint(hrhand&&hrhand["bigblind"])
	if(hrbbmode&&bb>0){
		return (Math.round(n/bb*10)/10)+" BB"
	}
	return String(n)
}

function hrtext(key){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["handreplaypage"]){
		return TRANSLATE[LANGUAGE]["handreplaypage"][key]||key
	}
	return key
}

function hrint(value){
	let n=parseInt(value)
	return isNaN(n)?0:n
}

function hresc(text){
	if(typeof safehtml=="function"){
		return safehtml(text)
	}
	return String(text==null?"":text).replace(/[&<>"]/g,function(c){
		return { "&": "&amp;","<": "&lt;",">": "&gt;","\"": "&quot;" }[c]
	})
}

function hrinitial(name){
	let text=String(name||"").trim()
	return text?text.substring(0,1).toUpperCase():"?"
}

function hrsuitinfo(suit){
	let s=String(suit||"").toLowerCase()
	if(s=="s"){ return { symbol: "♠",red: false } }
	if(s=="h"){ return { symbol: "♥",red: true } }
	if(s=="d"){ return { symbol: "♦",red: true } }
	if(s=="c"){ return { symbol: "♣",red: false } }
	return { symbol: "?",red: false }
}

function hrcardback(small){
	return `<span class="bc-card back${small?" sm":""}"><span class="bc-emblem"></span></span>`
}

function hrcardface(card,small){
	let text=String(card||"")
	if(text.length<2){
		return hrcardback(small)
	}
	let rank=text.substring(0,text.length-1).toUpperCase()
	let info=hrsuitinfo(text.substring(text.length-1))
	return `<span class="bc-card ${info["red"]?"red":""}${small?" sm":""}"><span class="r">${rank}</span><span class="s">${info["symbol"]}</span></span>`
}

// faceup=true 顯示正面(缺牌仍為牌背), 否則牌背
function hrcard(card,small,faceup){
	if(!faceup){
		return hrcardback(small)
	}
	return hrcardface(card,small)
}

// 只渲染已翻出的公共牌(一開始沒有牌, 依街逐步出現; 不放牌背佔位)
function hrboardslots(board,small){
	let html=""
	let cards=board||[]
	for(let i=0;i<cards.length;i=i+1){
		if(cards[i]){
			html=html+hrcard(cards[i],small,true)
		}
	}
	return html
}

// 燒牌(右側): 資料有值就以正面小牌顯示, 標「燒牌」
function hrburnshtml(frame){
	let burns=frame.burns||[]
	let cards=""
	for(let i=0;i<burns.length;i=i+1){
		if(burns[i]){
			cards=cards+hrcardface(burns[i],true)
		}
	}
	if(!cards){
		return ""
	}
	return `<div class="bc-burns"><div class="bc-sidelabel">${hrtext("burn")}</div><div class="bc-burnrow">${cards}</div></div>`
}

// 邊池(左側): 只有 all-in 造成多層時才列出主池/邊池
function hrsidepotshtml(frame){
	// 派彩幀底池已移到贏家面前, 不再顯示邊池
	if(frame.award&&Object.keys(frame.award).length){
		return ""
	}
	// 只顯示有 2 人以上競爭的池; 單人資格的是未被跟注的退還額, 不算池
	let pots=(frame.sidepots||[]).filter(function(p){ return p.eligible>=2 })
	if(pots.length<=1){
		return ""
	}
	let rows=""
	for(let i=0;i<pots.length;i=i+1){
		let label=i==0?hrtext("mainpot"):(hrtext("sidepot")+i)
		rows=rows+`<div class="bc-potrow"><span class="bc-potlabel">${hresc(label)}</span><span class="bc-potval">${hresc(hrfmtamt(pots[i].amount))}</span></div>`
	}
	return `<div class="bc-sidepots">${rows}</div>`
}

// 底池計分牌疊(可關閉)
function hrpotchipshtml(frame){
	if(!hrshowpotchips||!(frame.pot>0)){
		return ""
	}
	return `<div class="bc-potchips">${hrchipstack(frame.pot)}</div>`
}

function hrseatcards(seat){
	let handcard=seat&&seat["handcard"]?seat["handcard"]:{}
	if(typeof handcard=="string"){
		handcard=(typeof json=="function"?json(handcard):null)||{}
	}
	return [handcard["card1"]||"",handcard["card2"]||""]
}

// 盲注: 記錄端 action 皆為 "blind", 用下注金額對照該手 bb 判斷小盲/大盲
function hrblindlabel(a,chip,hand){
	if(a=="sb"||a=="smallblind"){ return hrtext("sb") }
	if(a=="bb"||a=="bigblind"){ return hrtext("bb") }
	let bb=hrint(hand&&hand["bigblind"])
	if(bb>0){
		return hrint(chip)>=bb?hrtext("bb"):hrtext("sb")
	}
	return hrtext("sb")
}

function hractionmeta(action,allined,chip,hand){
	let a=String(action||"").toLowerCase()
	if(allined||a=="allin"){ return { label: hrtext("allin"),cls: "danger" } }
	if(a=="fold"){ return { label: hrtext("fold"),cls: "danger" } }
	if(a=="raise"){ return { label: hrtext("raise"),cls: "aggressive" } }
	if(a=="bet"){ return { label: hrtext("bet"),cls: "aggressive" } }
	if(a=="call"){ return { label: hrtext("call"),cls: "neutral" } }
	if(a=="check"){ return { label: hrtext("check"),cls: "neutral" } }
	if(a=="ante"){ return { label: hrtext("ante"),cls: "neutral" } }
	if(a=="blind"||a=="sb"||a=="bb"||a=="smallblind"||a=="bigblind"){ return { label: hrblindlabel(a,chip,hand),cls: "neutral" } }
	if(!a){ return null }
	return { label: a,cls: "neutral" }
}

function hrchipstack(amount){
	let denoms=HRCHIPS.slice().sort(function(a,b){ return hrint(b["value"])-hrint(a["value"]) })
	let discs=[]
	let remain=amount
	let cap=5
	for(let i=0;i<denoms.length&&discs.length<cap;i=i+1){
		let value=hrint(denoms[i]["value"])
		if(value<=0){ continue }
		let take=Math.min(Math.floor(remain/value),cap-discs.length)
		for(let j=0;j<take;j=j+1){
			discs.push(denoms[i])
		}
		remain=remain-take*value
	}
	if(!discs.length){
		discs.push(denoms[denoms.length-1])
	}
	let html=""
	for(let i=0;i<discs.length;i=i+1){
		html=html+`<span class="bc-chipdisc" style="background:${hresc(discs[i]["color"])}"></span>`
	}
	return html
}

// ---- frame 產生: 把整手展開成一連串狀態快照 ----
function hrstreetrows(hand,street){
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

function hrboardcards(hand){
	let board=hand["boardcard"]||{}
	if(typeof board=="string"){
		board=(typeof json=="function"?json(board):null)||{}
	}
	let flop=[]
	if(board["flop"]){
		for(let i=0;i<board["flop"].length;i=i+1){
			if(board["flop"][i]){
				flop.push(board["flop"][i])
			}
		}
	}
	return {
		flop: flop,
		turn: board["turn"]||"",
		river: board["river"]||"",
		burnflop: board["burnflop"]||"",
		burnturn: board["burnturn"]||"",
		burnriver: board["burnriver"]||""
	}
}

function hrsnapshot(state,phase,actingseat){
	// 深拷貝目前狀態成一個 frame
	let seats={}
	for(let key in state.seats){
		let s=state.seats[key]
		seats[key]={ bet: s.bet,invested: s.invested,folded: s.folded,allin: s.allin,action: s.action?{ label: s.action.label,cls: s.action.cls }:null }
	}
	let award={}
	if(state.award){
		for(let k in state.award){
			award[k]=state.award[k]
		}
	}
	let frame={
		board: state.board.slice(),
		burns: state.burns.slice(),
		pot: state.pot,
		seats: seats,
		award: award,
		phase: phase,
		showdown: state.showdown,
		acting: actingseat||0
	}
	frame.sidepots=hrsidepots(frame)
	// all-in 鎖定: 未蓋牌者≥2 且「還能下注(未全押)」的人≤1 → 動作已結束, 翻牌
	let active=0
	let canact=0
	for(let key in seats){
		if(!seats[key].folded){
			active=active+1
			if(!seats[key].allin){
				canact=canact+1
			}
		}
	}
	frame.allinlocked=(active>=2&&canact<=1)
	return frame
}

// 由各座位累積投入 + 蓋牌狀態算出主池/邊池分層
function hrsidepots(frame){
	let contribs=[]
	for(let key in frame.seats){
		let amt=hrint(frame.seats[key].invested)
		if(amt>0){
			contribs.push({ amt: amt,folded: frame.seats[key].folded })
		}
	}
	if(!contribs.length){
		return []
	}
	let levels=[]
	for(let i=0;i<contribs.length;i=i+1){
		if(levels.indexOf(contribs[i].amt)<0){
			levels.push(contribs[i].amt)
		}
	}
	levels.sort(function(a,b){ return a-b })
	let pots=[]
	let prev=0
	for(let l=0;l<levels.length;l=l+1){
		let cap=levels[l]
		let amount=0
		let eligkeys=[]
		for(let i=0;i<contribs.length;i=i+1){
			if(contribs[i].amt>=cap){
				amount=amount+(cap-prev)
				if(!contribs[i].folded){
					eligkeys.push(i)
				}
			}
		}
		if(amount>0){
			let key=eligkeys.join(",")
			// 連續層若「可贏的座位集合」相同就合併(避免盲注造成雜訊小池)
			if(pots.length&&pots[pots.length-1].key==key){
				pots[pots.length-1].amount=pots[pots.length-1].amount+amount
			}else{
				pots.push({ amount: amount,eligible: eligkeys.length,key: key })
			}
		}
		prev=cap
	}
	return pots
}

function hrbuildframes(hand){
	let frames=[]
	let seatlist=hand["seatingdata"]||[]
	let state={ board: [],burns: [],pot: 0,seats: {},award: {},showdown: false }
	for(let i=0;i<seatlist.length;i=i+1){
		let seatno=hrint(seatlist[i]["seatno"])
		state.seats[seatno]={ bet: 0,invested: 0,folded: false,allin: false,action: null }
	}
	// 發牌
	frames.push(hrsnapshot(state,hrtext("deal"),0))

	let board=hrboardcards(hand)
	let streets=[
		{ key: "preflop",label: hrtext("preflop"),board: [],burn: "" },
		{ key: "flop",label: hrtext("flop"),board: board.flop.slice(0,3),burn: board.burnflop },
		{ key: "turn",label: hrtext("turn"),board: board.flop.slice(0,3).concat(board.turn?[board.turn]:[]),burn: board.burnturn },
		{ key: "river",label: hrtext("river"),board: board.flop.slice(0,3).concat(board.turn?[board.turn]:[]).concat(board.river?[board.river]:[]),burn: board.burnriver }
	]

	for(let si=0;si<streets.length;si=si+1){
		let street=streets[si]
		let rows=hrstreetrows(hand,street.key)
		if(street.key!="preflop"){
			// 這條街既沒有公共牌也沒有動作 → 手牌已在前一街結束
			let hasboard=street.board.length>(streets[si-1].board.length)
			if(!hasboard&&rows.length==0){
				break
			}
			// 上一街下注掃進底池, 清掉當前下注與動作標籤
			for(let key in state.seats){
				state.pot=state.pot+state.seats[key].bet
				state.seats[key].bet=0
				state.seats[key].action=null
			}
			// 翻牌前先顯示燒牌(若有), 再翻該街公共牌
			if(street.burn){
				state.burns.push(street.burn)
			}
			state.board=street.board.slice()
			frames.push(hrsnapshot(state,street.label,0))
		}
		for(let r=0;r<rows.length;r=r+1){
			let row=rows[r]
			let seatno=hrint(row["seatno"])
			if(!state.seats[seatno]){
				state.seats[seatno]={ bet: 0,invested: 0,folded: false,allin: false,action: null }
			}
			let s=state.seats[seatno]
			let action=String(row["action"]||"").toLowerCase()
			let allined=row["allined"]===true||action=="allin"
			if(action=="fold"){
				s.folded=true
			}else{
				s.bet=s.bet+hrint(row["chip"])
				s.invested=s.invested+hrint(row["chip"])
			}
			if(allined){
				s.allin=true
			}
			s.action=hractionmeta(action,allined,hrint(row["chip"]),hand)
			frames.push(hrsnapshot(state,street.label,seatno))
		}
	}

	// 攤牌: 剩餘下注入池, 標記攤牌
	for(let key in state.seats){
		state.pot=state.pot+state.seats[key].bet
		state.seats[key].bet=0
		state.seats[key].action=null
	}
	state.showdown=true
	frames.push(hrsnapshot(state,hrtext("showdown"),0))

	// 派彩: 底池分給贏家(seatingdata.winnered), 計分牌移到贏家面前
	let winners=[]
	for(let i=0;i<seatlist.length;i=i+1){
		if(seatlist[i]["winnered"]){
			winners.push(hrint(seatlist[i]["seatno"]))
		}
	}
	let totalpot=state.pot
	if(winners.length&&totalpot>0){
		let share=Math.floor(totalpot/winners.length)
		let award={}
		for(let w=0;w<winners.length;w=w+1){
			award[winners[w]]=share
		}
		// 餘數給第一位贏家
		let leftover=totalpot-share*winners.length
		if(leftover>0){
			award[winners[0]]=award[winners[0]]+leftover
		}
		state.award=award
		state.pot=0
		frames.push(hrsnapshot(state,hrtext("payout"),0))
	}
	return frames
}

// ---- 依 frame 渲染牌桌 ----
function hrmaxseatof(hand){
	let seats=hand["seatingdata"]||[]
	let max=0
	for(let i=0;i<seats.length;i=i+1){
		if(hrint(seats[i]["seatno"])>max){
			max=hrint(seats[i]["seatno"])
		}
	}
	return max>=2?max:Math.max(max,6)
}

function hrcardvisible(seatno,seatstate,frame){
	if(hrrevealall){
		return true
	}
	if(seatno==hrhero){
		return true
	}
	if(frame.showdown&&seatstate&&!seatstate.folded){
		return true
	}
	// all-in 且動作結束 → 未蓋牌者亮牌(跑馬前先攤)
	if(frame.allinlocked&&seatstate&&!seatstate.folded){
		return true
	}
	return false
}

function hrseatposhtml(seat,seatno,x,y,isdealer,frame){
	let dealer=isdealer?`<span class="bc-dealer">D</span>`:""
	if(!seat){
		return `
			<div class="bc-seatpos" style="left:${x}%;top:${y}%">
				<div class="bc-seatbox empty">${dealer}
					<div class="bc-avatar">—</div>
					<div class="bc-name">${hrtext("emptyseat")}</div>
					<div class="bc-chip">Seat ${seatno}</div>
					<div class="bc-seatcards"></div>
				</div>
			</div>`
	}
	let ss=frame.seats[seatno]||{ bet: 0,invested: 0,folded: false,allin: false,action: null }
	let win=(frame.showdown&&seat["winnered"])?" win":""
	let foldcls=ss.folded?" folded":""
	let acting=(!ss.folded&&frame.acting==seatno)?" acting":""
	let name=hresc(seat["name"]||("Seat "+seatno))
	// 剩餘碼量 = 起始碼扣掉本手已投入
	let remain=hrint(seat["chip"])-hrint(ss.invested)
	if(remain<0){ remain=0 }
	let visible=hrcardvisible(seatno,ss,frame)
	let cards=hrseatcards(seat)
	// 蓋牌者預設收牌(牌背); 但「顯示所有底牌」時仍亮出(座位維持暗化)
	let cardshtml
	if(ss.folded&&!visible){
		cardshtml=hrcardback(true)+hrcardback(true)
	}else{
		cardshtml=hrcard(cards[0],true,visible)+hrcard(cards[1],true,visible)
	}
	let actionhtml=ss.action?`<div class="bc-action ${ss.action.cls}">${hresc(ss.action.label)}</div>`:""
	// all-in 持久標誌
	let allinbadge=(ss.allin&&!ss.folded)?`<span class="bc-allin">ALL-IN</span>`:""
	let equityhtml=hrequityhtml(seatno,ss,frame)
	return `
		<div class="bc-seatpos" style="left:${x}%;top:${y}%">
			<div class="bc-seatbox${win}${foldcls}${acting}">${dealer}${allinbadge}${equityhtml}
				<div class="bc-avatar">${hresc(hrinitial(seat["name"]))}</div>
				<div class="bc-name">${name}</div>
				<div class="bc-chip">${hresc(hrfmtamt(remain))}</div>
				<div class="bc-seatcards">${cardshtml}</div>
				${actionhtml}
			</div>
		</div>`
}

// outs 以精簡色字(rank+花色)呈現, 節省空間避免手機卡到
function hroutspips(outs){
	let max=6
	let html=""
	for(let i=0;i<outs.length&&i<max;i=i+1){
		let text=String(outs[i]||"")
		if(text.length<2){ continue }
		let rank=text.substring(0,text.length-1).toUpperCase()
		let info=hrsuitinfo(text.substring(text.length-1))
		html=html+`<span class="${info["red"]?"r":""}">${hresc(rank)}${info["symbol"]}</span>`
	}
	if(outs.length>max){
		html=html+`<span class="mo">+${outs.length-max}</span>`
	}
	return html
}

// all-in 勝率小標(含 outs): all-in / 動作鎖定 / 攤牌時顯示; 資料由 hrloadequity 非同步填入
function hrequityhtml(seatno,ss,frame){
	if(ss.folded){
		return ""
	}
	if(!ss.allin&&!frame.showdown&&!frame.allinlocked){
		return ""
	}
	let pct=hrequity[seatno]
	if(pct==null||pct===""){
		return ""
	}
	let outs=hrequityouts[seatno]||[]
	let outshtml=outs.length?` <span class="bc-outs">${hroutspips(outs)}</span>`:""
	return `<span class="bc-equity">${hresc(pct)}%${outshtml}</span>`
}

function hrbethtml(amount,x,y,won){
	if(!(amount>0)){
		return ""
	}
	let cls=won?" bc-betwon":""
	return `<div class="bc-bet${cls}" style="left:${x}%;top:${y}%"><div class="bc-betchips">${hrchipstack(amount)}</div><div class="bc-betamt">${hresc(hrfmtamt(amount))}</div></div>`
}

function hrtablehtml(hand,frame){
	let seats=hand["seatingdata"]||[]
	let byseat={}
	for(let i=0;i<seats.length;i=i+1){
		byseat[hrint(seats[i]["seatno"])]=seats[i]
	}
	let n=hrmaxseat
	let dealerseat=hrint(hand["dealerseat"])
	// 讓 hero(selfseating)固定落在正下方: 以 hero 為基準旋轉座位排列
	let offset=(hrhero>=1&&hrhero<=n)?(hrhero-1):0
	let seatshtml=""
	let bethtml=""
	for(let k=0;k<n;k=k+1){
		let seatno=((k+offset)%n)+1
		let theta=(Math.PI/2)+(k/n)*Math.PI*2
		let px=Math.round((50+45*Math.cos(theta))*10)/10
		let py=Math.round((50+41*Math.sin(theta))*10)/10
		seatshtml=seatshtml+hrseatposhtml(byseat[seatno],seatno,px,py,dealerseat==seatno,frame)
		let ss=frame.seats[seatno]
		let bx=Math.round((50+30*Math.cos(theta))*10)/10
		let by=Math.round((50+27*Math.sin(theta))*10)/10
		if(byseat[seatno]&&ss&&!ss.folded&&ss.bet>0){
			bethtml=bethtml+hrbethtml(ss.bet,bx,by)
		}
		// 派彩: 底池計分牌移到贏家面前
		if(byseat[seatno]&&frame.award&&frame.award[seatno]>0){
			bethtml=bethtml+hrbethtml(frame.award[seatno],bx,by,true)
		}
	}
	return `
		<div class="bc-tablewrap">
			<div class="bc-felt"></div>
			${hrsidepotshtml(frame)}
			${hrburnshtml(frame)}
			<div class="bc-center">
				<div class="bc-board">${hrboardslots(frame.board,false)}</div>
				${frame.pot>0?`<div class="bc-pot">${hrtext("pot")} ${hresc(hrfmtamt(frame.pot))}</div>`:""}
				${hrpotchipshtml(frame)}
			</div>
			${bethtml}
			${seatshtml}
		</div>`
}

// ---- 覆蓋層 + 播放控制 ----
function hrbuildoverlay(){
	if(document.getElementById("hroverlay")){
		return
	}
	let saveddeck="classic"
	try{
		saveddeck=localStorage.getItem("bc-deck")||"classic"
	}catch(error){
		saveddeck="classic"
	}
	let root=document.createElement("div")
	root.id="hroverlay"
	root.className="hr-overlay deck-"+saveddeck
	root.setAttribute("hidden","")
	root.innerHTML=`
		<div class="hr-top">
			<div class="hr-title">${hrtext("title")}</div>
			<div class="flex items-center gap-3">
				<span class="hr-phase" id="hrphase">${hrtext("deal")}</span>
				<button class="hr-close" id="hrclose" aria-label="${hrtext("closearia")}">×</button>
			</div>
		</div>
		<div class="hr-stage" id="hrstage"></div>
		<div class="hr-controls">
			<input type="range" class="hr-seek" id="hrseek" min="0" max="0" value="0" aria-label="${hrtext("title")}">
			<button class="hr-btn" id="hrprev" aria-label="${hrtext("prevaria")}">⏮</button>
			<button class="hr-btn play" id="hrplay">${hrtext("play")}</button>
			<button class="hr-btn" id="hrnext" aria-label="${hrtext("nextaria")}">⏭</button>
			<span class="hr-progress" id="hrprogress">0/0</span>
			<select class="hr-select" id="hrspeed" aria-label="speed">
				<option value="0.5">0.5×</option>
				<option value="1" selected>1×</option>
				<option value="2">2×</option>
				<option value="4">4×</option>
			</select>
			<select class="hr-select" id="hrskin" aria-label="deck">
				<option value="classic">${hrtext("skinclassic")}</option>
				<option value="crimson">${hrtext("skincrimson")}</option>
				<option value="midnight">${hrtext("skinmidnight")}</option>
			</select>
			<label class="hr-toggle"><input type="checkbox" id="hrreveal">${hrtext("revealall")}</label>
			<label class="hr-toggle"><input type="checkbox" id="hrpotchips" checked>${hrtext("potchips")}</label>
			<label class="hr-toggle"><input type="checkbox" id="hrbb">BB</label>
		</div>
		<div class="hr-lightbox" id="hrlightbox" hidden>
			<div class="hr-lbpanel">
				<div class="hr-lbtitle">${hrtext("decktitle")}</div>
				<div class="hr-lbgrid" id="hrlbgrid"></div>
			</div>
		</div>`
	document.body.appendChild(root)
	hrlbbuild()
	hrbindtablegesture()

	document.getElementById("hrclose").addEventListener("click",hrclose)
	document.getElementById("hrplay").addEventListener("click",hrtoggleplay)
	document.getElementById("hrprev").addEventListener("click",function(){ hrpause(); hrgoto(hrindex-1) })
	document.getElementById("hrnext").addEventListener("click",function(){ hrpause(); hrgoto(hrindex+1) })
	document.getElementById("hrseek").addEventListener("input",function(){ hrpause(); hrgoto(hrint(this.value)) })
	document.getElementById("hrspeed").addEventListener("change",function(){
		hrspeed=parseFloat(this.value)||1
		if(hrtimer){ hrpause(); hrplay() }
	})
	document.getElementById("hrreveal").addEventListener("change",function(){
		hrrevealall=this.checked
		hrshow()
	})
	document.getElementById("hrpotchips").addEventListener("change",function(){
		hrshowpotchips=this.checked
		hrshow()
	})
	let hrbbcb=document.getElementById("hrbb")
	if(hrbbcb){
		hrbbcb.checked=hrbbmode
		hrbbcb.addEventListener("change",function(){
			hrbbmode=this.checked
			try{
				localStorage.setItem("hr-bbmode",hrbbmode?"1":"0")
			}catch(error){
				// localStorage 不可用時忽略
			}
			hrshow()
		})
	}
	let skinsel=document.getElementById("hrskin")
	skinsel.value=saveddeck
	skinsel.addEventListener("change",function(){ hrapplyskin(this.value) })
	document.addEventListener("keydown",hrkeydown)
}

// 牌面牌背皮膚(與現場轉播共用 localStorage bc-deck)
function hrapplyskin(skin){
	let valid=["classic","crimson","midnight"]
	if(valid.indexOf(skin)<0){
		skin="classic"
	}
	let root=document.getElementById("hroverlay")
	if(root){
		root.className="hr-overlay deck-"+skin
	}
	try{
		localStorage.setItem("bc-deck",skin)
	}catch(error){
		// localStorage 不可用時忽略
	}
	let sel=document.getElementById("hrskin")
	if(sel){
		sel.value=skin
	}
}

// 皮膚燈箱: 三種皮膚各附小牌預覽
function hrlbbuild(){
	let grid=document.getElementById("hrlbgrid")
	if(!grid){
		return
	}
	let root=document.getElementById("hroverlay")
	let cur=((root&&root.className.match(/deck-(\w+)/))||[])[1]||"classic"
	let skins=[
		{ key: "classic",name: hrtext("skinclassic") },
		{ key: "crimson",name: hrtext("skincrimson") },
		{ key: "midnight",name: hrtext("skinmidnight") }
	]
	let html=""
	for(let i=0;i<skins.length;i=i+1){
		let sel=skins[i].key==cur?" sel":""
		html=html+`<div class="hr-lbopt deck-${skins[i].key}${sel}" data-skin="${skins[i].key}"><div class="hr-lbswatch">${hrcardback(true)}${hrcardface("Ah",true)}</div><div class="hr-lbname">${hresc(skins[i].name)}</div></div>`
	}
	grid.innerHTML=html
	let opts=grid.querySelectorAll(".hr-lbopt")
	for(let i=0;i<opts.length;i=i+1){
		opts[i].addEventListener("click",function(){
			hrapplyskin(this.getAttribute("data-skin"))
			hrlbbuild()
			hrcloselightbox()
		})
	}
}

function hropenlightbox(){
	hrlbbuild()
	let lb=document.getElementById("hrlightbox")
	if(lb){ lb.removeAttribute("hidden") }
}

function hrcloselightbox(){
	let lb=document.getElementById("hrlightbox")
	if(lb){ lb.setAttribute("hidden","") }
}

// 長按牌桌 = 開皮膚燈箱; 長按後左右拖曳 = 移動時間軸(scrub)
function hrbindtablegesture(){
	let stage=document.getElementById("hrstage")
	if(!stage){
		return
	}
	stage.style.touchAction="none"
	let timer=null
	let startx=0
	let scrubbing=false
	stage.addEventListener("pointerdown",function(ev){
		startx=ev.clientX
		scrubbing=false
		if(timer){ clearTimeout(timer) }
		timer=setTimeout(function(){
			timer=null
			if(!scrubbing){ hropenlightbox() }
		},450)
	})
	stage.addEventListener("pointermove",function(ev){
		if(timer==null&&!scrubbing){
			return
		}
		let dx=ev.clientX-startx
		if(!scrubbing&&Math.abs(dx)>10){
			if(timer){ clearTimeout(timer); timer=null }
			scrubbing=true
			hrpause()
		}
		if(scrubbing){
			let rect=stage.getBoundingClientRect()
			let ratio=(ev.clientX-rect.left)/rect.width
			if(ratio<0){ ratio=0 }
			if(ratio>1){ ratio=1 }
			hrgoto(Math.round(ratio*(hrframes.length-1)))
		}
	})
	let endgesture=function(){
		if(timer){ clearTimeout(timer); timer=null }
		scrubbing=false
	}
	stage.addEventListener("pointerup",endgesture)
	stage.addEventListener("pointercancel",endgesture)
	stage.addEventListener("pointerleave",endgesture)
	let lb=document.getElementById("hrlightbox")
	if(lb){
		lb.addEventListener("click",function(ev){
			if(ev.target===lb){ hrcloselightbox() }
		})
	}
}

function hrkeydown(event){
	let root=document.getElementById("hroverlay")
	if(!root||root.hasAttribute("hidden")){
		return
	}
	let lb=document.getElementById("hrlightbox")
	if(event.key=="Escape"){
		if(lb&&!lb.hasAttribute("hidden")){ hrcloselightbox() }
		else{ hrclose() }
	}
	else if(event.key=="ArrowRight"){ hrpause(); hrgoto(hrindex+1) }
	else if(event.key=="ArrowLeft"){ hrpause(); hrgoto(hrindex-1) }
	else if(event.key==" "){ event.preventDefault(); hrtoggleplay() }
}

function hrshow(){
	let frame=hrframes[hrindex]
	if(!frame){
		return
	}
	document.getElementById("hrstage").innerHTML=hrtablehtml(hrhand,frame)
	document.getElementById("hrphase").textContent=frame.phase
	document.getElementById("hrprogress").textContent=(hrindex+1)+"/"+hrframes.length
	let seek=document.getElementById("hrseek")
	seek.max=hrframes.length-1
	seek.value=hrindex
	document.getElementById("hrprev").disabled=hrindex<=0
	document.getElementById("hrnext").disabled=hrindex>=hrframes.length-1
}

function hrgoto(index){
	if(index<0){ index=0 }
	if(index>hrframes.length-1){ index=hrframes.length-1 }
	hrindex=index
	hrshow()
}

function hrplay(){
	if(hrindex>=hrframes.length-1){
		hrindex=0
	}
	let base=1100
	let interval=Math.max(220,base/hrspeed)
	hrtimer=setInterval(function(){
		if(hrindex>=hrframes.length-1){
			hrpause()
			return
		}
		hrgoto(hrindex+1)
	},interval)
	let btn=document.getElementById("hrplay")
	if(btn){ btn.textContent=hrtext("pause") }
}

function hrpause(){
	if(hrtimer){
		clearInterval(hrtimer)
		hrtimer=null
	}
	let btn=document.getElementById("hrplay")
	if(btn){ btn.textContent=hrtext("play") }
}

function hrtoggleplay(){
	if(hrtimer){
		hrpause()
	}else{
		hrplay()
	}
}

function hrclose(){
	hrpause()
	let root=document.getElementById("hroverlay")
	if(root){
		root.setAttribute("hidden","")
	}
	document.body.style.overflow=""
}

// 抓場次實際計分牌面額(含顏色)套到下注計分牌上色; 失敗則沿用通用色階
function hrloadchips(hand){
	let sid=hand["sessionid"]
	if(!sid||typeof ajax!="function"||typeof AJAXURL=="undefined"){
		return
	}
	let token=(typeof weblsget=="function"&&typeof WEBLSNAME!="undefined")?weblsget(WEBLSNAME+"token"):""
	let headers=token?[["Authorization","Bearer "+token]]:[]
	ajax("GET",AJAXURL+"getsessionchips/"+encodeURIComponent(sid),function(event,data){
		if(data&&data["success"]&&data["data"]&&data["data"].length){
			HRCHIPS=data["data"]
			// 只影響渲染, 重畫目前 frame 即可套用新配色
			hrshow()
		}
	},null,headers)
}

// all-in 鎖定當下的公共牌(可能是空/翻牌/轉牌); equity 要用「當時」的板面才算得出機率, 用完整板面會變成 0/100
function hrallinlockboard(){
	for(let i=0;i<hrframes.length;i=i+1){
		if(hrframes[i].allinlocked){
			return hrframes[i].board.slice()
		}
	}
	return []
}

// 有 all-in 時, 蒐集未蓋牌且底牌已知的座位, 呼叫 equity 端點算 all-in 勝率
function hrloadequity(hand){
	let bit=hand["bittingdata"]||[]
	let hasallin=false
	let folded={}
	for(let i=0;i<bit.length;i=i+1){
		let a=String(bit[i]["action"]||"").toLowerCase()
		if(bit[i]["allined"]===true||a=="allin"){ hasallin=true }
		if(a=="fold"){ folded[hrint(bit[i]["seatno"])]=true }
	}
	if(!hasallin||typeof ajax!="function"||typeof AJAXURL=="undefined"){
		return
	}
	let seats=hand["seatingdata"]||[]
	let entries=[]
	for(let i=0;i<seats.length;i=i+1){
		let seatno=hrint(seats[i]["seatno"])
		if(folded[seatno]){ continue }
		let hc=hrseatcards(seats[i])
		if(hc[0]&&hc[1]&&String(hc[0]).length>=2&&String(hc[1]).length>=2){
			entries.push({ seatno: seatno,cards: [hc[0],hc[1]] })
		}
	}
	if(entries.length<2){
		return
	}
	// 用 all-in 鎖定當下的板面(未發完的牌交給後端枚舉), 才會是真正的機率而非 0/100
	let lockboard=hrallinlockboard()
	let bodydata={
		gametype: (typeof equitygametype=="function")?equitygametype(hand):"HE",
		handlist: entries.map(function(e){ return e.cards }),
		board: { floplist: [lockboard[0]||"",lockboard[1]||"",lockboard[2]||""],turn: lockboard[3]||"",river: lockboard[4]||"" }
	}
	ajax("POST",AJAXURL+"equity",function(event,data){
		if(data&&data["success"]&&data["data"]){
			let results=data["data"]["resultlist"]||data["data"]["results"]||[]
			for(let k=0;k<entries.length;k=k+1){
				let r=results[k]
				if(r&&r["win"]!=null){
					hrequity[entries[k].seatno]=Math.round(Number(r["win"])||0)
					hrequityouts[entries[k].seatno]=r["outs"]||r["outlist"]||[]
				}
			}
			hrshow()
		}
	},JSON.stringify(bodydata),[
		["Content-Type","application/json"],
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

// 對外入口: 由 handdetail 按鈕呼叫
function openhandreplay(hand){
	if(!hand){
		return
	}
	hrhand=hand
	hrhero=hrint(hand["selfseating"])
	hrmaxseat=hrmaxseatof(hand)
	hrframes=hrbuildframes(hand)
	hrindex=0
	hrequity={}
	hrequityouts={}
	hrbuildoverlay()
	let root=document.getElementById("hroverlay")
	root.removeAttribute("hidden")
	document.body.style.overflow="hidden"
	hrshow()
	hrloadchips(hand)
	hrloadequity(hand)
}
