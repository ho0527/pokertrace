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
// all-in 勝率逐街快取: hrequitymap[街別]={ 座位: { win, outs } }; 沿用 handdetail 的解算器邏輯
let hrequitymap={}
let hrbbmode=false
let hrpotside="right"

try{ hrbbmode=(localStorage.getItem("hr-bbmode")=="1") }catch(error){ hrbbmode=false }
// 主池位置偏好(帳號設定同步到 localStorage): right=主池靠右、邊池靠左; left 相反
try{ hrpotside=(localStorage.getItem("bc-potside")=="left")?"left":"right" }catch(error){ hrpotside="right" }

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

// upped：梭哈攤在桌面上的明牌。wincls：攤牌時的光暈（" best" 綠框 / " low" 黃框）。
function hrcardback(small,upped){
	return `<span class="bc-card back${small?" sm":""}${upped?" up":""}"><span class="bc-emblem"></span></span>`
}

function hrcardface(card,small,upped,wincls){
	let text=String(card||"")
	if(text.length<2){
		return hrcardback(small,upped)
	}
	let rank=text.substring(0,text.length-1).toUpperCase()
	let info=hrsuitinfo(text.substring(text.length-1))
	return `<span class="bc-card ${info["red"]?"red":""}${small?" sm":""}${upped?" up":""}${wincls||""}"><span class="r">${rank}</span><span class="s">${info["symbol"]}</span></span>`
}

// faceup=true 顯示正面(缺牌仍為牌背), 否則牌背
function hrcard(card,small,faceup){
	if(!faceup){
		return hrcardback(small)
	}
	return hrcardface(card,small)
}

// 只渲染已翻出的公共牌(一開始沒有牌, 依街逐步出現; 不放牌背佔位)
function hrboardslots(board,small,frame){
	let html=""
	let cards=board||[]
	for(let i=0;i<cards.length;i=i+1){
		if(cards[i]){
			// 攤牌後，贏家最佳五張用到的公共牌也要跟著發光（與手牌詳情一致）
			html=html+hrcardface(cards[i],small,false,hrboardwincls(cards[i],frame))
		}
	}
	return html
}

// 公共牌的光暈：只要有任何一個贏家的最佳五張用到這張牌就發光。
// 高牌綠框、低牌黃框，兩邊都用到就兩個 class 都上。
function hrboardwincls(card,frame){
	if(!frame||!frame.showdown||typeof cardkey!="function"){
		return ""
	}
	let kind=""
	let key=cardkey(card)
	for(let seat in hrwinhighlight){
		let value=hrwinhighlight[seat][key]
		if(value=="both"){
			kind="both"
		}
		if(value=="low"&&kind!="both"){
			if(kind=="high"){
				kind="both"
			}else{
				kind="low"
			}
		}
		if(value=="high"&&kind!="both"){
			if(kind=="low"){
				kind="both"
			}else{
				kind="high"
			}
		}
	}
	if(kind=="both"){
		return " best low"
	}
	if(kind=="low"){
		return " low"
	}
	if(kind=="high"){
		return " best"
	}
	return ""
}

// 燒牌(插在底池籌碼堆底下): 預設牌背; 有記錄到牌值(被秀牌)就翻正面顯示(不特別標記、不發光)
function hrpotburnshtml(frame){
	let burns=frame.burns||[]
	if(!burns.length){
		return ""
	}
	let cards=""
	for(let i=0;i<burns.length;i=i+1){
		let b=burns[i]||{}
		if(b.shown&&b.card){
			cards=cards+`<span class="bc-burncard shown">${hrcardface(b.card,true)}</span>`
		}else{
			cards=cards+`<span class="bc-burncard">${hrcardback(true)}</span>`
		}
	}
	return `<div class="bc-potburns">${cards}</div>`
}

// 把底池拆成主池 + 邊池: 只有在下注都掃進池(當街無人還有面前籌碼)且分層>1 時才拆, 避免與面前下注重複計
function hrpotlayers(frame){
	let layers=frame.sidepots||[]
	let hasunswept=false
	for(let key in frame.seats){
		if(!frame.seats[key].folded&&frame.seats[key].bet>0){
			hasunswept=true
		}
	}
	let awarded=frame.award&&Object.keys(frame.award).length
	let mainamount=frame.pot
	let sidelist=[]
	if(layers.length>1&&!hasunswept&&!awarded){
		mainamount=layers[0].amount
		for(let i=1;i<layers.length;i=i+1){
			if(layers[i].amount>0&&layers[i].eligible>=2){
				sidelist.push(layers[i])
			}
		}
	}
	return { mainamount: mainamount,sidelist: sidelist }
}

// 邊池組(收在主池反方向, 一層層往外堆疊累積): 派彩幀不顯示(已移到贏家面前)
function hrsidepotstackhtml(frame){
	if(frame.award&&Object.keys(frame.award).length){
		return ""
	}
	let layers=hrpotlayers(frame)
	if(!layers.sidelist.length){
		return ""
	}
	let rows=""
	for(let i=0;i<layers.sidelist.length;i=i+1){
		let label=hrtext("sidepot")+(i+1)
		rows=rows+`<div class="bc-sidepotitem"><div class="bc-sidepotchips">${hrchipstack(layers.sidelist[i].amount)}</div><div class="bc-sidepotlabel">${hresc(label)} ${hresc(hrfmtamt(layers.sidelist[i].amount))}</div></div>`
	}
	return `<div class="bc-sidepotwrap">${rows}</div>`
}

// 底池組(主池, 固定收在設定的那一側, 擬真現場): 燒牌插在籌碼堆底下 + 籌碼堆 + 金額
function hrpotgrouphtml(frame){
	let layers=hrpotlayers(frame)
	let mainamount=layers.mainamount
	let burns=hrpotburnshtml(frame)
	// 有邊池時主池標「主池」以區分, 沒有邊池就是單一「底池」
	let potlabel=layers.sidelist.length?hrtext("mainpot"):hrtext("pot")
	let pile=(hrshowpotchips&&mainamount>0)?`<div class="bc-potpile">${hrchipstack(mainamount)}</div>`:""
	let amt=(mainamount>0)?`<div class="bc-pot">${hresc(potlabel)} ${hresc(hrfmtamt(mainamount))}</div>`:""
	if(!burns&&!pile&&!amt){
		return ""
	}
	return `<div class="bc-potgroup">${burns}${pile}${amt}</div>`
}

function hrseatcards(seat){
	let handcard=seat&&seat["handcard"]?seat["handcard"]:{}
	if(typeof handcard=="string"){
		handcard=(typeof json=="function"?json(handcard):null)||{}
	}
	// 底牌依牌型而定，讀實際存在的 card1..card7。
	// 上限 7 是為了 7 張梭哈（ST / RA）；寫成 5 會讓回放時最後兩張安靜不見。
	let cards=[]
	for(let i=1;i<=7;i=i+1){
		if(handcard["card"+i]){
			cards.push(handcard["card"+i])
		}
	}
	return cards
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

// 這一手要回放哪幾條街。**街別一律問 frontend/handgame/ 的註冊表**，
// 不要在這裡再寫死一份 preflop/flop/turn/river ——
// 梭哈是 3rd~7th 五條（一次發三張，之後四條街各發一張，也就是 1+4 次下注機會），
// 換牌是換牌前 + N 次換牌，坐馬哈更是換牌與公共牌混在同一手。
// 回傳每街的：公共牌累積、燒牌、這街要發到第幾張底牌。
function hrstreetplan(hand){
	let board=hrboardcards(hand)
	let list=[]
	if(typeof handgamestreets=="function"){
		list=handgamestreets(String(hand["gametype"]||"").toUpperCase())||[]
	}
	if(!list.length){
		list=[
			{ key: "preflop" },
			{ key: "flop",board: "flop" },
			{ key: "turn",board: "turn" },
			{ key: "river",board: "river" }
		]
	}
	let plan=[]
	let cards=[]
	let dealt=0
	for(let i=0;i<list.length;i=i+1){
		let item=list[i]
		let burn=""
		if(item["board"]=="flop"){
			cards=board.flop.slice(0,3)
			burn=board.burnflop
		}
		if(item["board"]=="turn"&&board.turn){
			cards=cards.concat([board.turn])
			burn=board.burnturn
		}
		if(item["board"]=="river"&&board.river){
			cards=cards.concat([board.river])
			burn=board.burnriver
		}
		// 梭哈的街別帶 deal.slots，例如三街是 [1,2,3]、四街是 [4]
		if(item["deal"]&&item["deal"]["slots"]&&item["deal"]["slots"].length){
			for(let k=0;k<item["deal"]["slots"].length;k=k+1){
				if(dealt<hrint(item["deal"]["slots"][k])){
					dealt=hrint(item["deal"]["slots"][k])
				}
			}
		}
		plan.push({
			key: item["key"],
			label: hrstreetlabel(item),
			board: cards.slice(),
			burn: burn,
			dealt: dealt,
			dealed: item["deal"]!=undefined,
			drawed: item["draw"]==true
		})
	}
	return plan
}

// 街別名稱：社區牌四條沿用本檔既有的多語字串（回放的用詞和以前一樣），
// 其餘（梭哈 / 換牌 / 坐馬哈）用註冊表登記的中文名。
function hrstreetlabel(item){
	let key=item["key"]
	let map={
		preflop: "preflop",
		flop: "flop",
		turn: "turn",
		river: "river"
	}
	if(map[key]){
		return hrtext(map[key])
	}
	return item["name"]||key
}

// 攤牌時要發光的牌：{座位: {牌: "high"|"low"|"both"}}。
// **判定直接借用 handdetail.js 那一套**（showdowninfo / bestshowdownseat /
// bestlowshowdownseat / seatshowdownhighlight），不在這裡另造一份評牌 ——
// 兩份實作遲早會漂移，而且回放跟詳情頁對同一手講不同的話會很難查。
// handdetail.html 的載入順序是 handreplay.js 在前、handdetail.js 在後，
// 但這裡是**執行期**才呼叫，那時兩支都載好了；仍然用 typeof 守著，
// 萬一日後有別的頁面單獨載 handreplay.js 也只是沒有光暈，不會整個爆掉。
let hrwinhighlight={}

function hrbuildwinhighlight(hand){
	let data={}
	if(typeof showdowninfo!="function"||typeof bestshowdownseat!="function"){
		return data
	}
	let board=[]
	if(typeof ptboardcardlist=="function"){
		board=ptboardcardlist(hand["boardcard"]||{})
	}
	let showdown={}
	let seatlist=hand["seatingdata"]||[]
	for(let i=0;i<seatlist.length;i=i+1){
		let row=seatlist[i]
		if(row["handcard"]){
			let info=showdowninfo(row,board,hand)
			if(info){
				showdown[hrint(row["seatno"])]=info
			}
		}
	}
	let bestseat=bestshowdownseat(showdown)
	let bestlowseat=null
	if(typeof bestlowshowdownseat=="function"){
		bestlowseat=bestlowshowdownseat(showdown)
	}
	for(let seat in showdown){
		let map=seatshowdownhighlight(showdown[seat],seat,bestseat,bestlowseat)
		if(map){
			data[seat]=map
		}
	}
	return data
}

// 這張牌在攤牌時要不要發光。回 ""、"best"（綠框）或 "low"（黃框）。
function hrcardwincls(seatno,card,frame){
	if(!frame.showdown){
		return ""
	}
	let map=hrwinhighlight[String(seatno)]
	if(!map||typeof cardkey!="function"){
		return ""
	}
	let kind=map[cardkey(card)]
	if(kind=="low"){
		return " low"
	}
	if(kind=="both"){
		return " best low"
	}
	if(kind){
		return " best"
	}
	return ""
}

// 底牌槽位的明暗（梭哈 2 暗 + 4 明 + 1 暗）。明牌當時全桌都看得到，
// 回放時就該一直是正面，不能跟暗牌一起蓋著。
function hrexposedlist(hand){
	if(typeof handgameexposedlist=="function"){
		return handgameexposedlist(String(hand["gametype"]||"").toUpperCase())
	}
	return []
}

// TASK-037 起 flop/turn/river 共用 initialize.js 的解析；burn 三張是重播專用，留在這裡
function hrboardcards(hand){
	let board=hand["boardcard"]||{}
	if(typeof board=="string"){
		board=(typeof json=="function"?json(board):null)||{}
	}
	let parsed=ptboardobject(board)
	return {
		flop: parsed["flop"],
		turn: parsed["turn"],
		river: parsed["river"],
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
		streetkey: state.streetkey||"preflop",
		showdown: state.showdown,
		acting: actingseat||0,
		// 已經發到第幾張底牌。梭哈是一街一街發的（3rd 發 3 張、4th~7th 各 1 張），
		// 不是一開始就 7 張全部在手上，所以每一格畫面要知道當下發了幾張。
		// 社區牌家族與換牌家族一開始就發滿，dealt 直接等於底牌張數。
		dealt: state.dealt||0,
		exposed: (state.exposed||[]).slice()
	}
	frame.sidepots=hrsidepots(frame)
	// all-in 攤牌鎖定: 未蓋牌者≥2、當街下注都已跟平(或全押), 且還能下注(有計分牌)的人≤1
	// → 動作真的結束才翻牌跑馬, 避免「還沒 call 就開牌」
	let active=0
	let withchips=0
	let maxbet=0
	for(let key in seats){
		if(!seats[key].folded){
			active=active+1
			if(!seats[key].allin){
				withchips=withchips+1
			}
			if(seats[key].bet>maxbet){
				maxbet=seats[key].bet
			}
		}
	}
	let matched=true
	for(let key in seats){
		if(!seats[key].folded&&!seats[key].allin&&seats[key].bet<maxbet){
			matched=false
		}
	}
	frame.allinlocked=(active>=2&&withchips<=1&&matched)
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

// 手牌結束時依各座位「總投入」分層(主池 index 0=資格最多者), 每層含金額與有資格(未蓋牌)座位, 供派彩歸屬
function hrfinalpots(seats){
	let contribs=[]
	for(let key in seats){
		let amt=hrint(seats[key].invested)
		if(amt>0){
			contribs.push({ seat: hrint(key),amt: amt,folded: seats[key].folded })
		}
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
		let elig=[]
		for(let i=0;i<contribs.length;i=i+1){
			if(contribs[i].amt>=cap){
				amount=amount+(cap-prev)
				if(!contribs[i].folded){
					elig.push(contribs[i].seat)
				}
			}
		}
		if(amount>0){
			let key=elig.slice().sort(function(a,b){ return a-b }).join(",")
			// 相同「有資格集合」的連續層合併(盲注造成的雜訊小層)
			if(pots.length&&pots[pots.length-1].key==key){
				pots[pots.length-1].amount=pots[pots.length-1].amount+amount
			}else{
				pots.push({ amount: amount,eligibleseats: elig,key: key })
			}
		}
		prev=cap
	}
	return pots
}

function hrbuildframes(hand){
	let frames=[]
	let seatlist=hand["seatingdata"]||[]
	let streets=hrstreetplan(hand)
	let exposed=hrexposedlist(hand)
	let drawdata=((hand["familydata"]||{})["draws"])||{}
	hrwinhighlight=hrbuildwinhighlight(hand)
	// 梭哈是一街一街發牌，第一格畫面只有三街那三張；其餘牌型一開始就發滿。
	let studed=streets.length>0&&streets[0].dealed
	let maxhole=0
	for(let i=0;i<seatlist.length;i=i+1){
		let count=hrseatcards(seatlist[i]).length
		if(maxhole<count){
			maxhole=count
		}
	}
	let state={ board: [],burns: [],pot: 0,seats: {},award: {},showdown: false,streetkey: streets.length?streets[0].key:"preflop",dealt: studed?0:maxhole,exposed: exposed }
	for(let i=0;i<seatlist.length;i=i+1){
		let seatno=hrint(seatlist[i]["seatno"])
		state.seats[seatno]={ bet: 0,invested: 0,folded: false,allin: false,action: null }
	}
	if(studed){
		state.dealt=streets[0].dealt
	}
	// 發牌
	frames.push(hrsnapshot(state,hrtext("deal"),0))

	for(let si=0;si<streets.length;si=si+1){
		let street=streets[si]
		state.streetkey=street.key
		let rows=hrstreetrows(hand,street.key)
		if(0<si){
			// 這條街既沒有新公共牌、沒有新發的底牌、沒有換牌，也沒有動作
			// → 手牌已在前一街結束。
			// **全下之後仍然要把剩下的牌發完 / 換完**，所以只要這街真的有發生過就不能中斷。
			// 換牌有沒有發生看 familydata.draws 有沒有那一街的紀錄 ——
			// 光看「這街是換牌街」會把蓋牌收場的手也演完不存在的換牌。
			let hasboard=street.board.length>streets[si-1].board.length
			let hasdeal=street.dealt>streets[si-1].dealt&&street.dealt<=maxhole
			let hasdraw=street.drawed&&(drawdata[street.key]!=undefined)
			if(!hasboard&&!hasdeal&&!hasdraw&&rows.length==0){
				break
			}
			// 上一街下注掃進底池, 清掉當前下注與動作標籤
			for(let key in state.seats){
				state.pot=state.pot+state.seats[key].bet
				state.seats[key].bet=0
				state.seats[key].action=null
			}
			// **每一次發牌前都有一張燒牌**，不是只有社區牌家族才有：
			// 梭哈的四街到七街各燒一張、換牌的每一次換牌前也燒一張。
			// 只有第一次發牌（翻牌前 / 三街 / 換牌前）不燒，與德州的翻牌前一致。
			// 記錄端目前只存得下 burnflop / burnturn / burnriver 三張，所以梭哈與換牌
			// 的燒牌沒有牌值，畫成牌背（shown:false）—— 那本來就是看不到的牌。
			if(hasboard||hasdeal||hasdraw){
				state.burns.push({ card: street.burn||"",shown: street.burn?true:false })
			}
			state.board=street.board.slice()
			if(hasdeal){
				state.dealt=street.dealt
			}
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
			}else if(action=="ante"){
				// 前注是死錢, 直接進底池, 不放在座位前(不算當前下注); invested 仍計入以正確算剩餘計分牌與邊池
				state.pot=state.pot+hrint(row["chip"])
				s.invested=s.invested+hrint(row["chip"])
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

	// TASK-038：run it twice 以上時，攤牌後逐個把後面的 board 發出來，
	// 每個 board 一個 frame，標籤標「第 n 次」。單 board 時這個迴圈不會執行，
	// 重播內容與之前完全相同。
	let replayboardlist=ptboardlistof(hand)
	for(let ri=1;ri<replayboardlist.length;ri=ri+1){
		let runboard=replayboardlist[ri]["board"]
		let runcards=[]
		for(let k=0;k<runboard["flop"].length;k=k+1){
			runcards.push(runboard["flop"][k])
		}
		if(runboard["turn"]){
			runcards.push(runboard["turn"])
		}
		if(runboard["river"]){
			runcards.push(runboard["river"])
		}
		state.board=runcards
		frames.push(hrsnapshot(state,hrtext("boardrun").replace("{n}",replayboardlist[ri]["runno"]),0))
	}

	// 派彩: 先分邊池(反方向那側)再分主池。每個池分給該池「有資格且有贏得毛額」的贏家。
	// 各座位贏得毛額 wpot: 贏家 = endchip - chip + chipchange(chipchange 即本手投入), 輸家 = 0。
	let wpot={}
	let winnered={}
	for(let i=0;i<seatlist.length;i=i+1){
		let seatno=hrint(seatlist[i]["seatno"])
		if(seatlist[i]["winnered"]){
			winnered[seatno]=true
			let won=hrint(seatlist[i]["endchip"])-hrint(seatlist[i]["chip"])+hrint(seatlist[i]["chipchange"])
			wpot[seatno]=won>0?won:0
		}
	}
	let potlayers=hrfinalpots(state.seats)
	let remaining={}
	for(let seat in wpot){
		remaining[seat]=wpot[seat]
	}
	let sideawards={}
	let mainaward={}
	// 反向逐層歸屬: 先外層邊池, 最後主池(index 0=主池); 依剩餘 wpot 貪婪指派給有資格的贏家
	for(let li=potlayers.length-1;li>=0;li=li-1){
		let layer=potlayers[li]
		let eligwin=[]
		for(let e=0;e<layer.eligibleseats.length;e=e+1){
			let seat=layer.eligibleseats[e]
			if(winnered[seat]&&(remaining[seat]||0)>0){
				eligwin.push(seat)
			}
		}
		if(!eligwin.length){
			for(let e=0;e<layer.eligibleseats.length;e=e+1){
				if(winnered[layer.eligibleseats[e]]){
					eligwin.push(layer.eligibleseats[e])
				}
			}
		}
		if(!eligwin.length){
			continue
		}
		let share=Math.floor(layer.amount/eligwin.length)
		let leftover=layer.amount-share*eligwin.length
		for(let w=0;w<eligwin.length;w=w+1){
			let seat=eligwin[w]
			let amt=share+(w===0?leftover:0)
			if(li===0){
				mainaward[seat]=(mainaward[seat]||0)+amt
			}else{
				sideawards[seat]=(sideawards[seat]||0)+amt
			}
			remaining[seat]=(remaining[seat]||0)-amt
		}
	}
	// 先分邊池: 邊池籌碼移到贏家面前, 主池(index 0)仍留在桌上
	if(Object.keys(sideawards).length){
		state.award=sideawards
		state.pot=potlayers.length?potlayers[0].amount:0
		frames.push(hrsnapshot(state,hrtext("paysidepots"),0))
	}
	// 再分主池: 全部籌碼到位
	let finalaward={}
	for(let seat in sideawards){
		finalaward[seat]=sideawards[seat]
	}
	for(let seat in mainaward){
		finalaward[seat]=(finalaward[seat]||0)+mainaward[seat]
	}
	if(Object.keys(finalaward).length){
		state.award=finalaward
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

function hrseatposhtml(seat,seatno,x,y,isdealer,frame,upward){
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
	// 底牌張數依牌型（Hold'em 2 / Omaha 4 / 梭哈 7）；蓋牌者預設收牌(牌背); 但「顯示所有底牌」時仍亮出(座位維持暗化)
	let holecount=cards.length>0?cards.length:2
	// **梭哈不是一開始就七張在手上**：三街發三張，之後每街各發一張。
	// frame.dealt 是這一格畫面已經發到第幾張，超過的還沒發出來就不要畫。
	if(0<frame.dealt&&frame.dealt<holecount){
		holecount=frame.dealt
	}
	let exposed=frame.exposed||[]
	let cardshtml=""
	for(let i=0;i<holecount;i=i+1){
		// 梭哈的明牌不畫在座位框裡 —— 現場是攤在選手面前的桌面上，
		// 由 hrupcardshtml() 另外畫在座位與底池之間。這裡只留暗牌（手上拿著的那幾張）。
		if(exposed[i]=="up"){
			continue
		}
		// 蓋牌者的牌收掉了，一律畫牌背（除非開了「顯示所有底牌」）
		let faceup=visible
		if(ss.folded&&!visible){
			faceup=false
		}
		let wincls=hrcardwincls(seatno,cards[i],frame)
		if(faceup){
			cardshtml=cardshtml+hrcardface(cards[i],true,false,wincls)
		}else{
			cardshtml=cardshtml+hrcardback(true,false)
		}
	}
	let actionhtml=ss.action?`<div class="bc-action ${ss.action.cls}">${hresc(ss.action.label)}</div>`:""
	// all-in 持久標誌
	let allinbadge=(ss.allin&&!ss.folded)?`<span class="bc-allin">ALL-IN</span>`:""
	let equityhtml=hrequityhtml(seatno,ss,frame)
	// 顯示勝率小標(含 outs)的座位提高層級, 避免小標被相鄰座位框蓋掉
	let eqcls=equityhtml?" eq":""
	return `
		<div class="bc-seatpos${eqcls}" style="left:${x}%;top:${y}%">
			${hrupcardshtml(seat,seatno,frame,upward)}
			<div class="bc-seatbox${win}${foldcls}${acting}">${dealer}${allinbadge}${equityhtml}
				<div class="bc-avatar">${hresc(hrinitial(seat["name"]))}</div>
				<div class="bc-name">${name}</div>
				<div class="bc-chip">${hresc(hrfmtamt(remain))}</div>
				<div class="bc-seatcards">${cardshtml}</div>
				${actionhtml}
			</div>
		</div>`
}

// 梭哈的明牌攤在**牌桌上**、選手面前，一排橫放。
//
// 位置是**貼著座位框朝中心的那一側**，不是用半徑另外算一個座標。
// 用半徑算過一版，結果壓在頭像上：座位框寬 118px、高約 115px，在 760x475 的桌面上
// 佔 15.5% x / 24% y，中心又在半徑 45/41 —— 框的內緣落在半徑 37/29，
// 而要同時閃過框和下注籌碼、又不撞到中央底池，可用的半徑帶幾乎是空的，
// 斜角座位一定會重疊。改成貼著框放就與角度無關，不管座位在哪裡都不會蓋到頭像。
// 蓋牌的人牌已經收掉，不畫。
function hrupcardshtml(seat,seatno,frame,upward){
	if(!seat){
		return ""
	}
	let exposed=frame.exposed||[]
	let upped=false
	for(let i=0;i<exposed.length;i=i+1){
		if(exposed[i]=="up"){
			upped=true
		}
	}
	if(!upped){
		return ""
	}
	let ss=frame.seats[seatno]||{ folded: false }
	if(ss.folded&&!hrrevealall){
		return ""
	}
	let cards=hrseatcards(seat)
	let holecount=cards.length
	if(0<frame.dealt&&frame.dealt<holecount){
		holecount=frame.dealt
	}
	let html=""
	for(let i=0;i<holecount;i=i+1){
		if(exposed[i]=="up"){
			// 明牌一律正面 —— 當時全桌都看得到
			html=html+hrcardface(cards[i],true,true,hrcardwincls(seatno,cards[i],frame))
		}
	}
	if(!html){
		return ""
	}
	// 座位在下半圈就把牌放在框的上方、上半圈放在下方 —— 兩者都是朝牌桌中心那一側
	return `<div class="bc-upcards ${upward?"above":"below"}">${html}</div>`
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

// all-in 勝率小標(含 outs): 只有 all-in 被跟注鎖定(牌已開)或攤牌時才顯示, 跟開牌時機一致;
// 一全下但還沒有人跟注時不顯示(還沒開牌不給機率)。依「當前這條街的板面」逐街更新。
function hrequityhtml(seatno,ss,frame){
	if(ss.folded){
		return ""
	}
	if(!frame.showdown&&!frame.allinlocked){
		return ""
	}
	let streetmap=hrequitymap[frame.streetkey]
	if(!streetmap||!streetmap[seatno]){
		return ""
	}
	let pct=streetmap[seatno].win
	let outs=streetmap[seatno].outs||[]
	let outshtml=outs.length?` <span class="bc-outs">${hroutspips(outs)}</span>`:""
	// 沒 outs 時, 依解算器狀態顯示「需要翻牌 / 後門聽牌 / 聽死牌 / 平分」等
	let statustext=hrequitystatuslabel(streetmap[seatno].status,outs.length>0)
	let statushtml=statustext?` <span class="bc-eqstatus">${hresc(statustext)}</span>`:""
	return `<span class="bc-equity">${hresc(pct)}%${outshtml}${statushtml}</span>`
}

// 把 equity 端點的 status 對成解算器式文字(走 translate, 換語言自動更新); 有 outs 時不另標
function hrequitystatuslabel(status,hasouts){
	if(hasouts){
		return ""
	}
	if(status=="runner_runner"){ return hrtext("backdoor") }
	if(status=="drawing_dead"){ return hrtext("drawingdead") }
	if(status=="need_flop"){ return hrtext("needflop") }
	if(status=="tie_only"){ return hrtext("splitpot") }
	if(status=="chop_out"){ return hrtext("chopout") }
	return ""
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
	// 這一手有沒有明牌（只有梭哈家族有）。有的話版面要挪，沒有就完全維持原樣。
	let uppedlayout=false
	let exposedlist=frame.exposed||[]
	for(let i=0;i<exposedlist.length;i=i+1){
		if(exposedlist[i]=="up"){
			uppedlayout=true
		}
	}
	// 讓 hero(selfseating)固定落在正下方: 以 hero 為基準旋轉座位排列
	let offset=(hrhero>=1&&hrhero<=n)?(hrhero-1):0
	let seatshtml=""
	let bethtml=""
	for(let k=0;k<n;k=k+1){
		let seatno=((k+offset)%n)+1
		let theta=(Math.PI/2)+(k/n)*Math.PI*2
		let px=Math.round((50+45*Math.cos(theta))*10)/10
		let py=Math.round((50+41*Math.sin(theta))*10)/10
		// sin>0 表示座位在下半圈，明牌要放在座位框「上方」才是朝向牌桌中心
		seatshtml=seatshtml+hrseatposhtml(byseat[seatno],seatno,px,py,dealerseat==seatno,frame,0<Math.sin(theta))
		let ss=frame.seats[seatno]
		// 有明牌時下注籌碼往內讓一圈，否則會和貼在框內緣的明牌疊在一起。
		// 梭哈沒有公共牌，中央只有底池數字，往內讓不會撞到東西。
		// 沒有明牌的牌型維持原本的 27/24，畫面完全不變。
		let betrx=27
		let betry=24
		if(uppedlayout){
			betrx=20
			betry=17
		}
		let bx=Math.round((50+betrx*Math.cos(theta))*10)/10
		let by=Math.round((50+betry*Math.sin(theta))*10)/10
		if(byseat[seatno]&&ss&&!ss.folded&&ss.bet>0){
			bethtml=bethtml+hrbethtml(ss.bet,bx,by)
		}
		// 派彩: 底池計分牌移到贏家面前
		if(byseat[seatno]&&frame.award&&frame.award[seatno]>0){
			bethtml=bethtml+hrbethtml(frame.award[seatno],bx,by,true)
		}
	}
	return `
		<div class="bc-tablewrap potside-${hresc(hrpotside)}">
			<div class="bc-felt"></div>
			${hrsidepotstackhtml(frame)}
			<div class="bc-center">
				<div class="bc-board">${hrboardslots(frame.board,false,frame)}</div>
			</div>
			${hrpotgrouphtml(frame)}
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
		// TASK-046：覆蓋層的 deck class 以牌背為準（維持既有行為），
		// 牌背與牌面各自的皮膚再用 cardback- / cardface- 疊上去。
		saveddeck=localStorage.getItem(CARDBACKKEY)||localStorage.getItem("bc-deck")||"classic"
	}catch(error){
		saveddeck="classic"
	}
	let root=document.createElement("div")
	root.id="hroverlay"
	root.className="hr-overlay deck-"+saveddeck
	ptcardskinapply(root,ptcardskinget()["back"],ptcardskinget()["face"])
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
			<input type="button" class="hr-togglebtn${hrrevealall?" on":""}" id="hrreveal" value="${hrtext("revealall")}">
			<input type="button" class="hr-togglebtn${hrshowpotchips?" on":""}" id="hrpotchips" value="${hrtext("potchips")}">
			<input type="button" class="hr-togglebtn${hrbbmode?" on":""}" id="hrbb" value="BB">
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
	document.getElementById("hrreveal").addEventListener("click",function(){
		hrrevealall=!hrrevealall
		this.classList.toggle("on",hrrevealall)
		hrshow()
	})
	document.getElementById("hrpotchips").addEventListener("click",function(){
		hrshowpotchips=!hrshowpotchips
		this.classList.toggle("on",hrshowpotchips)
		hrshow()
	})
	let hrbbcb=document.getElementById("hrbb")
	if(hrbbcb){
		hrbbcb.classList.toggle("on",hrbbmode)
		hrbbcb.addEventListener("click",function(){
			hrbbmode=!hrbbmode
			this.classList.toggle("on",hrbbmode)
			try{
				localStorage.setItem("hr-bbmode",hrbbmode?"1":"0")
			}catch(error){
				// localStorage 不可用時忽略
			}
			hrshow()
		})
	}
	document.addEventListener("keydown",hrkeydown)
}

// 牌面牌背皮膚(與現場轉播共用 localStorage bc-deck)
function hrapplyskin(skin){
	let valid=["classic","crimson","midnight","royal","ocean","sunset","rose","graphite","minimal"]
	if(valid.indexOf(skin)<0){
		skin="classic"
	}
	let root=document.getElementById("hroverlay")
	if(root){
		root.className="hr-overlay deck-"+skin
		// 選單是整套換，所以牌背與牌面都設成同一個值
		ptcardskinapply(root,skin,skin)
	}
	try{
		localStorage.setItem("bc-deck",skin)
		localStorage.setItem(CARDBACKKEY,skin)
		localStorage.setItem(CARDSKINKEY,skin)
	}catch(error){
		// localStorage 不可用時忽略
	}
	// 同步存回帳號, 讓牌背偏好跨裝置一致(與 profile 設定共用同一來源)
	if(typeof ajax=="function"&&typeof AJAXURL!="undefined"&&typeof weblsget=="function"&&typeof WEBLSNAME!="undefined"){
		let token=weblsget(WEBLSNAME+"token")
		if(token){
			ajax("PUT",AJAXURL+"editusercarddeck",function(event,data){},JSON.stringify({ carddeck: skin }),[
				["Content-Type","application/json"],
				["Authorization","Bearer "+token]
			])
		}
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
		{ key: "midnight",name: hrtext("skinmidnight") },
		{ key: "royal",name: hrtext("skinroyal") },
		{ key: "ocean",name: hrtext("skinocean") },
		{ key: "sunset",name: hrtext("skinsunset") },
		{ key: "rose",name: hrtext("skinrose") },
		{ key: "graphite",name: hrtext("skingraphite") },
		{ key: "minimal",name: hrtext("skinminimal") }
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

// all-in 勝率: 沿用 handdetail 的解算器邏輯(buildallinequityplan 找到被跟注的 all-in 街 + 各街板面),
// 逐街呼叫 equity 端點, 依「當時板面」算勝率與 outs(用完整板面會變成 0/100), 結果快取到 hrequitymap[街別]。
function hrloadequity(hand){
	if(typeof buildallinequityplan!="function"||typeof ajax!="function"||typeof AJAXURL=="undefined"){
		return
	}
	let plan=buildallinequityplan(hand)
	if(!plan||!plan.seats||plan.seats.length<2){
		return
	}
	for(let i=0;i<plan.streets.length;i=i+1){
		hrfetchstreetequity(plan,plan.streets[i],1)
	}
}

// 逐街抓勝率; 這條街失敗(伺服器忙 / 偶發網路)時自動重試, 避免「某條街(例如轉牌)勝率不見」
function hrfetchstreetequity(plan,streetitem,attempt){
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
		if(data&&data["success"]&&data["data"]){
			let results=data["data"]["resultlist"]||data["data"]["results"]||[]
			let bystreet={}
			for(let k=0;k<plan.seats.length;k=k+1){
				let r=results[k]
				if(r&&r["win"]!=null){
					bystreet[plan.seats[k].seatno]={
						win: Math.round(Number(r["win"])||0),
						outs: r["outs"]||r["outlist"]||[],
						status: r["status"]||""
					}
				}
			}
			hrequitymap[streetitem["street"]]=bystreet
			hrshow()
		}else if(attempt<3){
			setTimeout(function(){ hrfetchstreetequity(plan,streetitem,attempt+1) },400*attempt)
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
	try{ hrpotside=(localStorage.getItem("bc-potside")=="left")?"left":"right" }catch(error){ hrpotside="right" }
	hrframes=hrbuildframes(hand)
	hrindex=0
	hrequitymap={}
	hrbuildoverlay()
	let root=document.getElementById("hroverlay")
	root.removeAttribute("hidden")
	document.body.style.overflow="hidden"
	hrshow()
	hrloadchips(hand)
	hrloadequity(hand)
}
