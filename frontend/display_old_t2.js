"use strict"
let state={
	"tournName": "",
	"subtitle": "",
	"schedule": [{ "type": "level", "sb": 100, "bb": 200, "ante": 200, "dur": 20 }],
	"payouts": [],
	"currentIndex": 0,
	"secondsLeft": 1200,
	"running": false,
	"players": 9,
	"totalEntries": 9,
	"startingChips": 25000,
	"buyin": 500,
	"fee": 100,
	"handForHand": false,
	"bubbleMode": false,
	"marqueeText": "",
	"regClosed": false,
	"prizePoolMode": "auto",
	"prizePoolManual": 0,
	"prizePoolCarryover": 0,
	"guaranteedPrize": 0,
	"defaultBreakDur": 10,
	"itmMode": "pct",     // "pct" | "count"
	"itmPct": 15,
	"itmCount": 7,
	"otherReward": [],
}
// WebSocket 原生 (取代 localStorage; display 端純被動接收, 不寫 state)
// 此檔不從 localStorage 載入 / 儲存, 一切 state 都從 WebSocket 推播

// Audio
let audioctx
let audiokeepwarm=false
// 讓音訊輸出裝置保持喚醒: Mac 的 HDMI/AirPlay/藍牙音訊在閒置後第一次播音
// 會喚醒硬體並卡住主執行緒數百毫秒。掛一個 0 音量的循環來源讓裝置不睡,
// 之後的提示音就不用付喚醒延遲, 也不會卡到後面排隊的 WS 更新。
function keepaudiowarm() {
	if (audiokeepwarm || !audioctx) {
		return
	}
	try {
		let buf=audioctx.createBuffer(1, 1, audioctx.sampleRate)
		let src=audioctx.createBufferSource()
		src.buffer=buf
		src.loop=true
		let g=audioctx.createGain()
		g.gain.value=0
		src.connect(g)
		g.connect(audioctx.destination)
		src.start(0)
		audiokeepwarm=true
	} catch (e) {
	}
}
function ensureaudio() {
	if (!audioctx) {
		try {
			audioctx=new (window.AudioContext || window.webkitAudioContext)()
		} catch (e) {
		}
	}
	if (audioctx && audioctx.state == "suspended") {
		audioctx.resume()
	}
	keepaudiowarm()
	updateaudiohint()
}
function beep(freq, dur, vol, type="sine", delay=0) {
	if (!audioctx) {
		return
	}
	let oscillator=audioctx.createOscillator()
	let gain=audioctx.createGain()
	oscillator.connect(gain)
	gain.connect(audioctx.destination)
	oscillator.type=type
	oscillator.frequency.value=freq
	let t=audioctx.currentTime + delay
	gain.gain.setValueAtTime(0, t)
	gain.gain.linearRampToValueAtTime(vol, t + 0.01)
	gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
	oscillator.start(t)
	oscillator.stop(t + dur + 0.05)
}
function audioenabled() {
	return audioctx && audioctx.state == "running"
}
function updateaudiohint() {
	let hint=domgetid("audioUnlockHint")
	if (!hint) {
		return
	}
	if (audioenabled()) {
		hint.style.display="none"
	} else {
		hint.style.display="block"
	}
}

function setmarqueetext(element, text) {
	while (element.firstChild) {
		element.removeChild(element.firstChild)
	}
	let parts=String(text || "").split("|")
	let added=false
	for (let i=0; i<parts.length; i=i+1) {
		let part=parts[i].trim()
		if (part) {
			if (added) {
				element.appendChild(document.createTextNode(" | "))
			}
			element.appendChild(document.createTextNode(part))
			added=true
		}
	}
}

function buildaudiohint() {
	if (domgetid("audioUnlockHint")) {
		return
	}
	let hint=doccreate("div")
	hint.id="audioUnlockHint"
	hint.setAttribute("role", "button")
	hint.setAttribute("tabindex", "0")
	hint.innerHTML="<div style=\"font-size:18px;margin-bottom:6px\">Enable Sound</div><div style=\"font-size:12px;color:#a1a1aa;font-weight:600\">Tap once before the tournament starts</div>"
	hint.style.position="fixed"
	hint.style.left="50%"
	hint.style.top="50%"
	hint.style.transform="translate(-50%,-50%)"
	hint.style.zIndex="9999"
	hint.style.border="1px solid #52525b"
	hint.style.background="rgba(17,24,39,0.96)"
	hint.style.color="#facc15"
	hint.style.borderRadius="12px"
	hint.style.padding="18px 22px"
	hint.style.fontWeight="800"
	hint.style.cursor="pointer"
	hint.style.boxShadow="0 18px 50px rgba(0,0,0,0.45)"
	hint.style.minWidth="240px"
	hint.style.textAlign="center"
	hint.addEventListener("click", function() {
		ensureaudio()
		beep(660, 0.08, 0.2)
		updateaudiohint()
	})
	hint.addEventListener("keydown", function(event) {
		if (event.key == "Enter" || event.key == " ") {
			event.preventDefault()
			this.click()
		}
	})
	document.body.appendChild(hint)
	updateaudiohint()
}
document.addEventListener("click", ensureaudio, { "once": true })
document.addEventListener("keydown", ensureaudio, { "once": true })
function playlevelend() {
	beep(1046, 0.2, 0.4)
	beep(1046, 0.2, 0.4, "sine", 0.18)
	beep(1046, 0.4, 0.4, "sine", 0.36)
}
function playbreakstart() {
	beep(1046, 0.3, 0.35)
	beep(784, 0.3, 0.35, "sine", 0.35)
	beep(523, 0.5, 0.35, "sine", 0.7)
}

// WebSocket 同步 (取代 BroadcastChannel)
const SESSIONID=new URLSearchParams(location.search).get("sessionid")
if (!SESSIONID) {
	document.body.innerHTML="<div style=\"display:flex;align-items:center;justify-content:center;height:100vh;color:#888;font-family:sans-serif;font-size:14px\">Missing sessionid parameter</div>"
	throw new Error("missing sessionid")
}

let ws=null
let channelok=false  // 維持原本變數名, 給後面 domgetid("syncDot") 用
let wsretrytimer=null
let wsdownnotified=false  // 斷線提示去重
let lastmarqueetext=""
let lastwsmsg=0  // 最後一次收到 WS 訊息的單調時鐘, 給殭屍連線偵測用

function parsecloudtime(value) {
	if (!value) {
		return null
	}
	let text=String(value).replace(" ", "T")
	let time=new Date(text).getTime()
	if (isNaN(time)) {
		return null
	}
	return time
}

// 倒數錨點: 用單調時鐘 performance.now() 重算, 不依賴各機牆上時鐘
// 舊作法 (Date.now() - lastSyncTime) 會因各裝置時區/系統時鐘不一致而漂移; 改成
// 收到伺服器送來的 secondsLeft 當下記錄錨點, 之後純靠 performance.now() 的經過時間往下算,
// 三台裝置因此都從同一個伺服器值起算, 顯示秒數會對齊。
let anchorsecondsleft=state["secondsLeft"]
let anchorperf=0
let lastticksecond=-1
function nowperf() {
	if (typeof performance != "undefined" && performance.now) {
		return performance.now()
	}
	return Date.now()
}
function settimeranchor(seconds) {
	anchorsecondsleft=Math.max(0, seconds)
	anchorperf=nowperf()
	lastticksecond=Math.floor(anchorsecondsleft)
}
function livesecondsleft() {
	if (!state["running"]) {
		return state["secondsLeft"]
	}
	return Math.max(0, anchorsecondsleft - (nowperf() - anchorperf) / 1000)
}

// 定時 HTTP 校正的容忍值 (秒): 後端秒數與本機平滑倒數差在此值內就不重錨。
const RESYNCTOLERANCESEC=2
function applyserverstate(serverstate, soft) {
	let oldindex=state["currentIndex"]
	let oldregclosed=state["regClosed"]
	let oldrunning=state["running"]
	let prevlive=livesecondsleft()
	Object.assign(state, serverstate)
	let indexchanged=serverstate["currentIndex"] != undefined && oldindex != state["currentIndex"]
	let runningchanged=oldrunning != state["running"]
	// 平滑重錨: soft (每 10 秒定時校正) 時, 若後端秒數與本機平滑倒數只差一點點,
	// 多半只是 gettimer 的網路往返延遲造成的, 就沿用本機值不重錨, 避免畫面每 10 秒
	// 往前/後跳一下。只有誤差超過容忍值, 或級別 / 暫停狀態有變, 才以後端權威值重新下錨。
	if (soft && state["running"] && !indexchanged && !runningchanged && Math.abs(state["secondsLeft"] - prevlive) < RESYNCTOLERANCESEC) {
		state["secondsLeft"]=prevlive
	} else {
		settimeranchor(state["secondsLeft"])
	}
	if (indexchanged) {
		let item=state["schedule"][state["currentIndex"]]
		if (item && item["type"] == "break") {
			playbreakstart()
		} else {
			playlevelend()
		}
	}
	if (oldregclosed != true && state["regClosed"] == true) {
		playlevelend()
	}
	// 級別已換 (或已暫停) 就停掉歸零時的連續補抓, 不再枯等 WS。
	if (indexchanged || !state["running"]) {
		stoplevelendpoll()
	}
}

function getauthtoken() {
	if (typeof weblsget == "function" && typeof WEBLSNAME != "undefined") {
		return weblsget(WEBLSNAME + "token")
	}
	return ""
}

function buildwsurl() {
	let proto="ws:"
	if (location.protocol == "https:") {
		proto="wss:"
	}
	let base=location.host
	if (base.endsWith("/")) {
		base=base.slice(0, -1)
	}
	let url=proto + "//" + base + WSPREFIX + "timer/" + SESSIONID + "/"
	let token=getauthtoken()
	if (token) {
		url=url + "?token=" + encodeURIComponent(token)
	}
	return url
}

function connectws() {
	let url=buildwsurl()
	// [display] connecting WS（除錯訊息已移除）
	try {
		ws=new WebSocket(url)
	} catch (e) {
		console.error("WS create error:", e)
		return
	}

	ws.onopen=function() {
		channelok=true
		lastwsmsg=nowperf()  // 新連線先記錄, 避免一開始就被殭屍偵測誤判
		updatesyncstatus()
		if (wsdownnotified && typeof pttoastsuccess=="function") {
			pttoastsuccess("Control desk sync restored")
			wsdownnotified=false
		}
		// [display] WS connected（除錯訊息已移除）
	}
	ws.onmessage=function(ev) {
		lastwsmsg=nowperf()
		try {
			let msg=JSON.parse(ev.data)
			if ((msg.type == "init" || msg.type == "update") && msg.state) {
				if (Object.keys(msg.state).length > 0) {
					// init 直接以後端權威值下錨; update 走 soft 平滑校正,
					// 沿用 RESYNCTOLERANCESEC 容忍值, 避免後端整數秒因四捨五入 / 網路延遲
					// 比本機平滑值高 1 秒時重錨造成倒數往回跳 (例 05:43 跳回 05:44)。
					applyserverstate(msg.state, msg.type == "update")
					render()
				}
			}
		} catch (e) {
			console.error("WS msg parse error:", e)
		}
	}
	ws.onclose=function() {
		channelok=false
		ws=null
		updatesyncstatus()
		if (!wsdownnotified && typeof pttoasterror=="function") {
			pttoasterror("Control desk connection lost. Retrying...")
			wsdownnotified=true
		}
		console.warn("[display] WS closed, retry in 3s")
		if (wsretrytimer) clearTimeout(wsretrytimer)
		wsretrytimer=setTimeout(connectws, 3000)
	}
	ws.onerror=function(e) {
		console.error("[display] WS error:", e)
	}
}

function loadtimerstate(soft) {
	// let loadingid=ptloadingstart("#centerPanel")
	let opts={}
	let token=getauthtoken()
	if (token) {
		opts["headers"]={ "Authorization": "Bearer " + token }
	}
	fetch(AJAXURL + "gettimer/" + SESSIONID, opts).then(function(response) {
		return response.json()
	}).then(function(data) {
		if (data && data["success"] && data["data"] && data["data"]["state"]) {
			applyserverstate(data["data"]["state"], soft)
			render()
		}
	}).catch(function(error) {
		console.error("[display] gettimer failed:", error)
	})
}

// 級別倒數歸零 → 主動用 ajax 連續向後端要新狀態, 直到級別真的換掉,
// 不被動枯等 WS 推播 (WS 可能延遲或漏訊)。切換級別要靠 ajax, 不等 websocket。
let levelendpolltimer=null
function startlevelendpoll() {
	if (levelendpolltimer) {
		return
	}
	loadtimerstate()
	levelendpolltimer=setInterval(loadtimerstate, 1000)
}
function stoplevelendpoll() {
	if (levelendpolltimer) {
		clearInterval(levelendpolltimer)
		levelendpolltimer=null
	}
}

loadtimerstate()
connectws()
buildaudiohint()
function updatesyncstatus() {
	let dot=domgetid("syncDot")
	if (!dot) {
		return
	}

	if (channelok) {
		dot.classList.remove("off")
		dot.title="Synchronizing with control desk"
	} else {
		dot.classList.add("off")
		dot.title="Sync connection retrying"
	}
}

// Helpers
function fmt(number) {
	return Math.round(number).toLocaleString()
}
function fmttime(second) {
	second=Math.max(0, Math.floor(second))
	return String(Math.floor(second / 60)).padStart(2, "0") + ":" + String(second % 60).padStart(2, "0")
}

function curitem() {
	return state["schedule"][state["currentIndex"]]
}
function isbreaknow() {
	let item=curitem()
	return item && item["type"]=="break"
}
// 手數級別: 以手數計算 timemode hands, 不倒數時間。
function ishanditem(item) {
	return !!item && item["type"]=="level" && item["timemode"]=="hands"
}
function ishandnow() {
	return ishanditem(curitem())
}
function handtargetof(item) {
	return parseInt(item && item["handTargetCount"], 10) || 0
}
function handcountof(item) {
	return parseInt(item && item["handCount"], 10) || 0
}
function totallevels() {
	let count=0
	for (let i=0; i<state["schedule"].length; i=i+1) {
		if (state["schedule"][i] && state["schedule"][i].type=="level") {
			count=count+1
		}
	}
	return count
}
function levelnumof(idx) {
	let n=0
	for (let i=0; i<=idx; i=i+1) {
		if (state["schedule"][i] && state["schedule"][i].type == "level") {
			n=n+1
		}
	}
	return n
}
function nextlevelitem(fromidx) {
	for (let i=fromidx+1; i<state["schedule"].length; i=i+1) {
		if (state["schedule"][i].type == "level") {
			return { "idx": i, "item": state["schedule"][i] }
		}
	}
	return null
}
function nextbreakitem(fromidx) {
	let secs=state["secondsLeft"]
	for (let i=fromidx+1; i<state["schedule"].length; i=i+1) {
		if (state["schedule"][i].type == "break") {
			return { "idx": i, "item": state["schedule"][i], "secsUntil": secs }
		}
		// 手數級別不倒數時間, dur 不計入倒數估算
		if (!ishanditem(state["schedule"][i])) {
			secs=secs+state["schedule"][i].dur * 60
		}
	}
	// If currently in a break, no "next break"
	return null
}
function regcloseitem(fromidx) {
	if (state["regClosed"]) {
		return null
	}
	let secs=state["secondsLeft"]
	for (let i=fromidx; i<state["schedule"].length; i=i+1) {
		let item=state["schedule"][i]
		// 手數級別不倒數時間, dur 不計入倒數估算
		if (i != fromidx && !ishanditem(item)) {
			secs=secs + (item["dur"] * 60)
		}
		if (item["regCloseAfter"]) {
			return {
				"idx": i,
				"item": item,
				"secsUntil": secs
			}
		}
	}
	return null
}
function prizepool() {
	if (state["prizePoolMode"] == "manual") {
		return state["prizePoolManual"] || 0
	}
	let pool=state["buyin"] * state["totalEntries"]
	pool=pool + (parseFloat(state["prizePoolCarryover"]) || 0)
	if (pool < (parseFloat(state["guaranteedPrize"]) || 0)) {
		pool=parseFloat(state["guaranteedPrize"]) || 0
	}
	return pool
}

function payoutpercenttotal(payouts) {
	let total=0
	for (let i=0; i<payouts.length; i=i+1) {
		total=total + (parseFloat(payouts[i]["pct"]) || 0)
	}
	return total
}

function payoutrewardmoney(value) {
	if (value == null || value == undefined) {
		return null
	}
	let text=String(value).replace(/,/g, "").replace(/\$/g, "").trim()
	if (text == "" || !/^-?\d+(\.\d+)?$/.test(text)) {
		return null
	}
	return parseFloat(text)
}

function payoutpercentamount(item, pool, totalpct) {
	let pct=parseFloat(item["pct"]) || 0
	if (totalpct <= 1.5) {
		return Math.round(pool * pct)
	}
	return Math.round(pool * pct / 100)
}

// 獎金金額來源優先序：獎金欄位 > 舊資料塞在 reward 的純數字 > 舊 % 換算
function payoutcashamount(item, pool, totalpct) {
	let cash=parseFloat(item["cash"]) || 0
	if (cash > 0) {
		return Math.round(cash)
	}
	let rewardmoney=payoutrewardmoney(item["reward"])
	if (rewardmoney != null) {
		return Math.round(rewardmoney)
	}
	return payoutpercentamount(item, pool, totalpct)
}

// 只有「非純數字」的 reward 才算獎項文字（純數字視為舊資料的現金）
function payoutrewardtext(item) {
	let reward=String(item["reward"] || "").trim()
	if (reward == "" || payoutrewardmoney(reward) != null) {
		return ""
	}
	return reward
}

function payoutcashtotal(payouts, pool, totalpct) {
	let total=0
	for (let i=0; i<payouts.length; i=i+1) {
		total=total + payoutcashamount(payouts[i], pool, totalpct)
	}
	return total
}

function payoutranknumber(value) {
	let match=String(value || "").match(/\d+/)
	if (match) {
		return parseInt(match[0], 10)
	}
	return 0
}

function payoutrankrange(value, index) {
	let text=String(value || "").trim().replace(/[－–—]/g, "-")
	let match=text.match(/(\d+)\s*-\s*(\d+)/)
	if (match) {
		let start=parseInt(match[1], 10)
		let end=parseInt(match[2], 10)
		if (end < start) {
			let temp=start
			start=end
			end=temp
		}
		return { "start": start, "end": end }
	}
	let rank=payoutranknumber(text)
	if (rank == 0) {
		rank=index + 1
	}
	return { "start": rank, "end": rank }
}

function payoutranktext(start, end) {
	if (start == end) {
		return String(start)
	}
	return start + "-" + end
}

function payoutdisplayvalue(item, amount) {
	let rewardtext=payoutrewardtext(item)
	let moneytext=amount > 0 ? ("$" + fmt(amount)) : ""
	if (moneytext != "" && rewardtext != "") {
		return moneytext + "+" + rewardtext
	}
	if (moneytext != "") {
		return moneytext
	}
	if (rewardtext != "") {
		return rewardtext
	}
	return "$" + fmt(amount)
}

function buildpayoutrows() {
	let pool=prizepool()
	let payouts=state["payouts"] || []
	let totalpct=payoutpercenttotal(payouts)
	let raws=[]
	let rows=[]
	for (let i=0; i<payouts.length; i=i+1) {
		let amount=payoutcashamount(payouts[i], pool, totalpct)
		raws.push(amount)
	}
	for (let i=0; i<payouts.length; i=i+1) {
		let rank=payoutrankrange(payouts[i]["rank"], i)
		if (rank["start"] <= state["players"]) {
			rows.push({
				"rankstart": rank["start"],
				"rankend": rank["end"],
				"value": payoutdisplayvalue(payouts[i], raws[i]),
				"color": "#cbd5e1",
				"inmoney": i < itmcount()
			})
		}
	}
	rows.sort(function(a, b) {
		return a["rankstart"] - b["rankstart"]
	})
	let merged=[]
	for (let i=0; i<rows.length; i=i+1) {
		let last=merged[merged.length - 1]
		if (last && last["value"] == rows[i]["value"] && last["color"] == rows[i]["color"] && last["rankend"] + 1 == rows[i]["rankstart"]) {
			last["rankend"]=rows[i]["rankend"]
		} else {
			merged.push(rows[i])
		}
	}
	return merged
}

function visiblepayoutrows(rows) {
	let maxrows=15
	if (rows.length <= maxrows) {
		return rows
	}
	let first=rows[0]
	let last=rows[rows.length - 1]
	let middle=rows.slice(1, rows.length - 1)
	let pagesize=maxrows - 2
	let pagecount=Math.max(1, Math.ceil(middle.length / pagesize))
	let page=Math.floor(Date.now() / 3000) % pagecount
	let start=page * pagesize
	let output=[first]
	for (let i=start; i<middle.length && i<start+pagesize; i=i+1) {
		output.push(middle[i])
	}
	output.push(last)
	return output
}

// 計算 ITM (進獎金圈) 人數
function itmcount() {
	let maxnumber=Math.max(1, state["totalEntries"] || 1)
	let number=1
	if (state["itmMode"]=="count") {
		number=parseInt(state["itmCount"], 10) || 1
	} else {
		number=Math.round((state["totalEntries"] || 0) * (parseFloat(state["itmPct"]) || 0) / 100)
	}
	return Math.max(1, Math.min(number, maxnumber))
}

function buildpayouts() {
	let pool=prizepool()
	let payouts=state["payouts"] || []
	let totalpct=payoutpercenttotal(payouts)
	let payoutcashtotalamount=payoutcashtotal(payouts, pool, totalpct)
	let itmcountvalue=itmcount()
	let playersleft=state["players"] || 0
	let remainingtobubble=playersleft - itmcountvalue

	let payoutrows=visiblepayoutrows(buildpayoutrows())
	domgetid("payoutList").innerHTML=payoutrows.map(function(p) {
		let classname="prow mono below-bubble"
		if (p["inmoney"]) {
			classname="prow mono in-money"
		}
		// value 可能含 reward 自由文字(操作者可控), 走 innerHTML 前先跳脫(含引號)。
		let valuetext=escapehtml(p["value"]).replace(/"/g, "&quot;").replace(/'/g, "&#39;")
		return "<div class=\"" + classname + "\"><span>" + payoutranktext(p["rankstart"], p["rankend"]) + "</span><span>" + valuetext + "</span></div>"
	}).join("")
	let prizepooltext="$" + fmt(payoutcashtotalamount)
	// let prizepoolcalctext="名次現金加總 · 原獎池 " + state["totalEntries"] + " × $" + fmt(state["buyin"])
	// if (0 < (parseFloat(state["prizePoolCarryover"]) || 0)) {
	// 	prizepoolcalctext=prizepoolcalctext + " + 前日未用 $" + fmt(state["prizePoolCarryover"])
	// }
	// if (0 < (parseFloat(state["guaranteedPrize"]) || 0)) {
	// 	prizepoolcalctext=prizepoolcalctext + " · 保底 $" + fmt(state["guaranteedPrize"])
	// }
	// if (state["prizePoolMode"] == "manual") {
	// 	prizepoolcalctext="名次現金加總 · 手動獎池 $" + fmt(pool)
	// }
	// 其他獎勵: 三欄清單(自由標籤 / 獎金 / 獎品), 純顯示記錄, 不列入 payoutcashtotal / 獎池, 也不參與任何結算。
	// 這頁固定英文不做中譯, 標題已寫死在 display.html; label / reward 是主辦自由輸入,
	// 走 innerHTML 前一律 escapehtml 並跳脫引號防 XSS。
	let otherrewardlist=state["otherReward"]
	if (!Array.isArray(otherrewardlist)) {
		otherrewardlist=[]
	}
	let otherrewardhtml=""
	for (let i=0; i<otherrewardlist.length; i=i+1) {
		let item=otherrewardlist[i] || {}
		let cash=parseFloat(item["cash"])
		if (isNaN(cash)) {
			cash=0
		}
		let reward=String(item["reward"] || "").replace(/^\s+|\s+$/g, "")
		let parts=[]
		if (0 < cash) {
			parts.push("$" + fmt(cash))
		}
		if (reward != "") {
			parts.push(reward)
		}
		let labeltext=escapehtml(String(item["label"] || "").replace(/^\s+|\s+$/g, "")).replace(/"/g, "&quot;").replace(/'/g, "&#39;")
		let valuetext=escapehtml(parts.join("+")).replace(/"/g, "&quot;").replace(/'/g, "&#39;")
		otherrewardhtml=otherrewardhtml + "<div class=\"other-reward-row mono\"><span>" + labeltext + "</span><span>" + valuetext + "</span></div>"
	}
	domgetid("otherRewardList").innerHTML=otherrewardhtml
	if (otherrewardhtml == "") {
		domgetid("otherRewardBlock").style.display="none"
	} else {
		domgetid("otherRewardBlock").style.display=""
	}

	let prizepooldisplays=document.querySelectorAll(".prizePoolDisplay")
	for (let i=0; i<prizepooldisplays.length; i=i+1) {
		prizepooldisplays[i].textContent=prizepooltext
	}
	// let prizepoolcalcs=document.querySelectorAll(".prizePoolCalc")
	// for (let i=0; i<prizepoolcalcs.length; i=i+1) {
	// 	prizepoolcalcs[i].textContent=prizepoolcalctext
	// }

	// Players 卡片下方補 bubble 提示
	// let bubblestatus=domgetid("bubbleStatus")
	// if (bubblestatus && payouts.length > 0 && playersleft > 0) {
	// 	if (remainingtobubble > 1) {
	// 		bubblestatus.style.display="block"
	// 		if (remainingtobubble <= 3) {
	// 			bubblestatus.style.color="#fbbf24"
	// 		} else {
	// 			bubblestatus.style.color="#666"
	// 		}
	// 		bubblestatus.textContent=String(remainingtobubble) + " players to bubble - Top " + itmcountvalue + " ITM"
	// 	} else if (remainingtobubble == 1) {
	// 		bubblestatus.style.display="block"
	// 		bubblestatus.style.color="#fbbf24"
	// 		bubblestatus.textContent="On the bubble (Top " + itmcountvalue + " ITM)"
	// 	} else {
	// 		bubblestatus.style.display="block"
	// 		bubblestatus.style.color="#4ade80"
	// 		bubblestatus.textContent="In the money (Top " + itmcountvalue + " ITM)"
	// 	}
	// } else if (bubblestatus) {
	// 	bubblestatus.style.display="none"
	// }
}

function buildschedulelist() {
	let htmllist=[]
	for (let i=0; i<state["schedule"].length; i=i+1) {
		let item=state["schedule"][i]
		let isactiveed=false
		let isdoneed=false
		let isbreaked=false
		let classname="lvl-row"
		let levelname=""
		let blindtext=""
		let regtag=""
		let durtext=item["dur"] + "m"
		let labelcolor="#555"
		let durationcolor="#404040"
		let blindcolor="#555"

		if (i==state["currentIndex"]) {
			isactiveed=true
		}
		if (i<state["currentIndex"]) {
			isdoneed=true
		}
		if (item["type"]=="break") {
			isbreaked=true
		}

		if (isactiveed) {
			classname=classname + " active"
			if (isbreaked) {
				classname=classname + " is-break"
			}
		} else if (isdoneed) {
			classname=classname + " done"
		} else {
			classname=classname + " upcoming"
		}

		if (isbreaked) {
			classname=classname + " is-break-row"
			levelname="☕"
			blindtext="<span style=\"color:#fbbf24\">Break " + chipraisetext(item) + "</span>"
			labelcolor="#fbbf24"
		} else {
			levelname="L" + levelnumof(i)
			if (isactiveed) {
				blindcolor="#fff"
				labelcolor="#4ade80"
			} else if (isdoneed) {
				blindcolor="#2a2a2a"
				labelcolor="#2a2a2a"
			}
			blindtext="<span style=\"font-family:JetBrains Mono,monospace;color:" + blindcolor + "\">" + fmt(item["sb"]) + "/" + fmt(item["bb"]) + "</span>"
		}

		if (!isbreaked && isactiveed) {
			labelcolor="#4ade80"
		}

		if (isactiveed) {
			durationcolor="#eab308"
		} else if (isdoneed) {
			durationcolor="#2a2a2a"
		}

		if (item["regCloseAfter"]) {
			regtag="<span style=\"color:#7f1d1d;font-size:9px;margin-left:4px;background:#3f0f0f;padding:1px 4px;border-radius:3px;font-weight:800\">REG✕</span>"
		}

		if (ishanditem(item)) {
			let target=handtargetof(item)
			durtext="✋"
			if (0<target) {
				durtext=durtext + handcountof(item) + "/" + target
			}
		}

		htmllist.push(
			"<div class=\"" + classname + "\">" +
				"<span style=\"color:" + labelcolor + ";min-width:32px;font-size:11px;font-weight:800\">" + levelname + "</span>" +
				blindtext +
				"<span style=\"color:" + durationcolor + "\">" + durtext + regtag + "</span>" +
			"</div>"
		)
	}
	domgetid("blindStructureList").innerHTML=htmllist.join("")
}

function chipraisetext(item) {
	let values=[]
	if (item && item["chipRaiseValues"]) {
		values=item["chipRaiseValues"]
	}
	if (!values.length) {
		return ""
	}
	let text=[]
	for (let i=0; i<values.length; i=i+1) {
		text.push(fmt(values[i]))
	}
	return "Chip raise " + text.join(" / ")
}

function numericstate(value) {
	let number=parseFloat(value)
	if (isNaN(number)) {
		return 0
	}
	return number
}

function currentbigblind(item) {
	if (item && item["bb"]) {
		return numericstate(item["bb"])
	}
	let next=nextlevelitem(state["currentIndex"])
	if (next && next["item"] && next["item"]["bb"]) {
		return numericstate(next["item"]["bb"])
	}
	return 0
}

function averagestacktotal() {
	// 場上總計分牌＝起始碼 × 總入場人次（計分牌守恆：被淘汰選手的計分牌已轉給存活者，
	// 不會消失）。不可用 linkedchiptotal 只加總「存活選手」的當前計分牌，因為在
	// 沒有牌局計分牌資料時會退回起始碼，漏掉被淘汰選手的計分牌而嚴重低估平均計分牌。
	return numericstate(state["startingChips"]) * numericstate(state["totalEntries"])
}

// 顯示端品牌化（檢查表 3.3）：品牌名稱、主色、logo、可選顯示欄位
function applybranding() {
	let color=state["brandColor"] || ""
	let name=state["brandName"] || ""
	let logo=state["brandLogo"] || ""
	let nameEl=domgetid("tournName")
	if (nameEl) {
		nameEl.style.color=color || ""
		let host=nameEl.parentNode
		if (host) {
			let brand=document.getElementById("brandHeader")
			if (name) {
				if (!brand) {
					brand=document.createElement("div")
					brand.id="brandHeader"
					brand.style.fontWeight="800"
					brand.style.letterSpacing="0.04em"
					host.insertBefore(brand, host.firstChild)
				}
				brand.textContent=name
				brand.style.color=color || ""
				brand.style.display=""
			} else if (brand) {
				brand.style.display="none"
			}
			let img=document.getElementById("brandLogoImg")
			if (logo) {
				if (!img) {
					img=document.createElement("img")
					img.id="brandLogoImg"
					img.alt="brand"
					img.style.maxHeight="56px"
					img.style.marginBottom="8px"
					host.insertBefore(img, host.firstChild)
				}
				img.src=logo
				img.style.display=""
			} else if (img) {
				img.style.display="none"
			}
		}
	}
	// displayFields：要隱藏的欄位元素 id，以逗號分隔（留空＝全部顯示）
	let raw=String(state["displayFields"] || "")
	let hideset={}
	let parts=raw.split(",")
	for (let i=0;i<parts.length;i=i+1) {
		let key=parts[i].replace(/^\s+|\s+$/g, "")
		if (key) {
			hideset[key]=true
		}
	}
	let known=["avgStack", "payoutList", "prizePoolDisplay", "playersDisplay", "nextBlindsCard", "anteDisplay", "regCountdownCard", "breakCountdownCard"]
	for (let i=0;i<known.length;i=i+1) {
		let el=document.getElementById(known[i])
		if (!el) {
			continue
		}
		el.style.display=hideset[known[i]] ? "none" : ""
	}
}

function render() {
	domgetid("tournName").textContent=state["tournName"]
	applybranding()
	if (state["subtitle"]) {
		domgetid("tournSub").textContent="— " + state["subtitle"]
	} else {
		domgetid("tournSub").textContent=""
	}
	domgetid("bInfo").textContent="$" + fmt(state["buyin"]) + "+" + fmt(state["fee"])
	if (state["running"]) {
		domgetid("statusInfo").innerHTML="<span style=\"color:#4ade80\">▶ RUNNING</span>"
	} else {
		domgetid("statusInfo").innerHTML="<span style=\"color:#fbbf24\">⏸ PAUSED</span>"
	}
	if (state["bubbleMode"]) {
		domgetid("bubbleBanner").style.display="block"
	} else {
		domgetid("bubbleBanner").style.display="none"
	}
	if (state["handForHand"]) {
		domgetid("h4hBanner").style.display="block"
	} else {
		domgetid("h4hBanner").style.display="none"
	}
	let it=curitem()
	if (!it) {
		return
	}
	let overlay=domgetid("breakOverlay")
	if (it.type == "break") {
		overlay.style.display="flex"
		domgetid("breakTimerDisplay").textContent=fmttime(state["secondsLeft"])
		domgetid("breakTimerDisplay").className="mono"
		if (!state["running"]) {
			domgetid("breakTimerDisplay").className=domgetid("breakTimerDisplay").className + " timer-paused"
		}
		let next=nextlevelitem(state["currentIndex"])
		if (chipraisetext(it)) {
			domgetid("breakNextBlinds").textContent=" · " + chipraisetext(it)
		} else {
			domgetid("breakNextBlinds").textContent=""
		}
		domgetid("tagLabel").textContent="BREAK"
		domgetid("tagLabel").style.color="#fbbf24"
	} else {
		overlay.style.display="none"
		if (ishanditem(it)) {
			domgetid("tagLabel").textContent="HANDS"
		} else {
			domgetid("tagLabel").textContent="LEVEL"
		}
		domgetid("tagLabel").style.color="#555"
	}

	let handmode=ishanditem(it)
	let td=domgetid("timerDisplay")
	let pct
	let barcolor
	if (handmode) {
		// 手數級別: 顯示手數而非倒數時間, 進度條依 handCount/目標手數。
		let target=handtargetof(it)
		let count=handcountof(it)
		if (target > 0) {
			td.textContent=count + " / " + target
		} else {
			td.textContent=String(count)
		}
		td.className="timer-main"
		if (target > 0) {
			pct=Math.min(100, count / target * 100)
		} else {
			pct=0
		}
		if (target > 0 && count >= target) {
			barcolor="#22c55e"
		} else {
			barcolor="#3b82f6"
		}
	} else {
		let totalsecs=it.dur * 60
		if (totalsecs > 0) {
			pct=Math.max(0, (state["secondsLeft"] / totalsecs) * 100)
		} else {
			pct=0
		}
		td.textContent=fmttime(state["secondsLeft"])
		td.className="timer-main"
		if (!state["running"] && it.type != "break") {
			td.classList.add("timer-paused")
		} else if (state["secondsLeft"] <= 30) {
			td.classList.add("timer-red")
		} else if (state["secondsLeft"] <= 60) {
			td.classList.add("timer-amber")
		}
		if (state["secondsLeft"] <= 30) {
			barcolor="#ef4444"
		} else if (state["secondsLeft"] <= 60) {
			barcolor="#fbbf24"
		} else if (pct < 30) {
			barcolor="#eab308"
		} else {
			barcolor="#22c55e"
		}
	}
	if (pct < 100) {
		domgetid("progressBar").style.width=pct + "%"
	} else {
		domgetid("progressBar").style.width="100%"
	}
	domgetid("progressBar").style.background=barcolor
	if (it.type == "level") {
		domgetid("levelNum").textContent=levelnumof(state["currentIndex"])
		domgetid("levelOf").textContent=""
		domgetid("blindsDisplay").textContent=fmt(it.sb) + " / " + fmt(it.bb)
		domgetid("anteDisplay").textContent=fmt(it.ante)
	} else {
		let next=nextlevelitem(state["currentIndex"])
		domgetid("levelNum").textContent="☕"
		domgetid("levelOf").textContent="Break"
		if (next) {
			domgetid("blindsDisplay").textContent=fmt(next["item"]["sb"]) + " / " + fmt(next["item"]["bb"])
			domgetid("anteDisplay").textContent=fmt(next["item"]["ante"])
		} else {
			domgetid("blindsDisplay").textContent="—"
			domgetid("anteDisplay").textContent="—"
		}
	}

	let avgstack=averagestacktotal() / Math.max(1, numericstate(state["players"]))
	let bigblind=currentbigblind(it)
	let avgstackbb=0
	if (0 < bigblind) {
		avgstackbb=avgstack / bigblind
	}
	domgetid("avgStack").textContent=fmt(avgstack) + " (" + avgstackbb.toFixed(1) + "BB)"
	domgetid("playersDisplay").textContent=state["players"]
	if (state["showMultidayRemaining"]==true) {
		// 分母用「本日進場人數」(multidayTodayEntries: 晉級 + 本日新進), 不用只算晉級的 multidayRemaining,
		// 否則 Day2 有 re-entry / 直接報名時在場人數會超過晉級人數, 出現 13/12 這種矛盾。
		domgetid("entriesLabel").textContent="/" + (state["multidayTodayEntries"] || 0) + "(" + (state["multidaySourceTotalEntries"] || 0) + ")"
	} else {
		domgetid("entriesLabel").textContent="/" + state["totalEntries"]
	}

	let regcard=domgetid("regCountdownCard")
	let regclose=regcloseitem(state["currentIndex"])
	if (state["regClosed"]) {
		regcard.style.display="block"
		domgetid("regCountdownDisplay").textContent="CLOSED"
		domgetid("regCountdownDisplay").style.color="#f87171"
		domgetid("regCloseAfterLabel").textContent="Registration closed"
	} else if (regclose) {
		regcard.style.display="block"
		domgetid("regCountdownDisplay").textContent=fmttime(regclose["secsUntil"])
		if (regclose["secsUntil"] <= 300) {
			domgetid("regCountdownDisplay").style.color="#f87171"
		} else {
			domgetid("regCountdownDisplay").style.color="#4ade80"
		}
		if (regclose["item"]["type"] == "break") {
			domgetid("regCloseAfterLabel").textContent="Closes after break"
		} else {
			domgetid("regCloseAfterLabel").textContent="Closes after Level " + levelnumof(regclose["idx"])
		}
	} else {
		// 報名未關閉且往後找不到 regCloseAfter 級別:
		// 若 regCloseAfter 級別已在目前級別之前(已經過)才顯示 CLOSED,
		// 結構中完全沒有 regCloseAfter 時報名沒有截止點, 整張卡片隱藏, 不可誤示 CLOSED。
		let regclosepassed=false
		for (let i=0; i<state["currentIndex"] && i<state["schedule"].length; i=i+1) {
			if (state["schedule"][i] && state["schedule"][i]["regCloseAfter"]) {
				regclosepassed=true
			}
		}
		if (regclosepassed) {
			regcard.style.display="block"
			domgetid("regCountdownDisplay").textContent="CLOSED"
			domgetid("regCountdownDisplay").style.color="#f87171"
			domgetid("regCloseAfterLabel").textContent="Registration closed"
		} else {
			regcard.style.display="none"
		}
	}

	// Next blinds info
	let nb=domgetid("nextBlindsInfo")
	let next=nextlevelitem(state["currentIndex"])
	if (next) {
		nb.innerHTML=
			"<div style=\"display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #181818;font-size:17px;font-weight:600;color:#aaa\">" +
				"<span>Level " + levelnumof(next.idx) + "</span>" +
				"<span style=\"color:#ccc;font-family:JetBrains Mono,monospace;font-size:35px;\">" + fmt(next["item"]["sb"]) + "/" + fmt(next["item"]["bb"]) + "</span>" +
			"</div>" +
			"<div style=\"display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #181818;font-size:17px;font-weight:600;color:#aaa\">" +
				"<span>BB Ante</span>" +
				"<span style=\"color:#eab308;font-family:JetBrains Mono,monospace;font-size:35px;\">" + fmt(next["item"]["ante"]) + "</span>" +
			"</div>"
	} else {
		nb.innerHTML="<div style=\"font-size:12px;color:#444\">Final level</div>"
	}

	// Next break
	let brk=nextbreakitem(state["currentIndex"])
	let bc=domgetid("breakCountdownCard")
	if (brk && it.type != "break") {
		bc.style.display="block"
		let bd=domgetid("breakCountdownDisplay")
		bd.textContent=fmttime(brk["secsUntil"])
		if (brk["secsUntil"] <= 300) {
			bd.style.color="#ef4444"
		} else {
			bd.style.color="#fbbf24"
		}
		domgetid("breakAfterLabel").textContent="Break duration " + brk["item"]["dur"] + " min"
	} else if (it.type == "break") {
		bc.style.display="block"
		let bd=domgetid("breakCountdownDisplay")
		bd.textContent="ON BREAK"
		bd.style.color="#fbbf24"
		domgetid("breakAfterLabel").textContent=fmttime(state["secondsLeft"]) + " remaining"
	} else {
		bc.style.display="none"
	}

	// Marquee
	let mt=domgetid("marqueeText")
	let mw=domgetid("marqueeWrap")
	let newtext=state["marqueeText"] || ""
	if (mt.dataset.text != newtext) {
		mt.dataset.text=newtext
		setmarqueetext(mt, newtext)
	}
	if (lastmarqueetext != newtext) {
		lastmarqueetext=newtext
		setTimeout(function() {
			if (70 <= lastmarqueetext.length) {
				mw.classList.add("scrolling")
				mw.classList.remove("centered")
			} else {
				mw.classList.add("centered")
				mw.classList.remove("scrolling")
			}
		}, 0)
	}

	buildschedulelist()
	buildpayouts()
}

// Local tick: 用單調時鐘重算秒數, 只在「顯示的整數秒」改變時才重繪,
// 因此各裝置的秒數跳動會落在同一個邊界 (200ms 內), 不再各自 setInterval 漂移。
setInterval(function() {
	if (!state["running"]) {
		return
	}
	if (ishandnow()) {
		return
	}
	let live=livesecondsleft()
	state["secondsLeft"]=live
	// 歸零時要先啟動級別結束補抓, 這段必須在下面 cur==lastticksecond 的提早 return 之前;
	// 否則 cur 在 live 還沒真的到 0 前 (0.x 秒) 就先變成 0, 之後每個 tick 都被提早 return
	// 擋掉, startlevelendpoll 永遠不會被呼叫, 換級別只能等 10 秒定時校正才追上 (畫面會跳)。
	if (live <= 0) {
		startlevelendpoll()
	} else {
		stoplevelendpoll()
	}
	let cur=Math.floor(live)
	if (cur == lastticksecond) {
		return
	}
	lastticksecond=cur
	if (cur == 30) {
		beep(880, 0.15, 0.4)
		beep(880, 0.15, 0.4, "sine", 0.2)
		beep(880, 0.15, 0.4, "sine", 0.4)
	} else if (cur <= 5 && cur >= 1) {
		beep(880, 0.1, 0.3)
	}
	render()
}, 200)
// 定時向後端 HTTP 重新校正: 補 WS 漏訊 / 修正各機本機時鐘漂移 / 蓋過殭屍連線。
// gettimer 回的 secondsLeft 是後端即時算好的, 重新下錨不會讓倒數往回跳。
// 間隔 10 秒: 顯示螢幕數量少, 對後端幾乎無感; 不更短是因 gettimer 是中等重的查詢。
const RESYNCMS=10000
setInterval(function() {
	loadtimerstate(true)
}, RESYNCMS)
// 殭屍 WS 偵測: 連線狀態還是 OPEN 但太久沒收到任何訊息 (中間 proxy 已丟棄),
// onclose 不會觸發, 既有的 3 秒重連也不會啟動。主動關掉以觸發 onclose → 重連。
const WSSILENTMS=30000
setInterval(function() {
	if (ws && ws.readyState == WebSocket.OPEN && WSSILENTMS < nowperf() - lastwsmsg) {
		console.warn("[display] WS 靜默過久, 強制重連")
		try {
			ws.close()
		} catch (e) {
		}
	}
}, 5000)
// 顯示螢幕平常沒人操作, 滑鼠閒置一段時間就把游標藏起來, 一動就恢復。
const CURSORIDLEMS=3000
let cursoridletimer=null
function restartcursoridle() {
	document.body.classList.remove("cursor-idle")
	clearTimeout(cursoridletimer)
	cursoridletimer=setTimeout(function() {
		document.body.classList.add("cursor-idle")
	}, CURSORIDLEMS)
}
document.addEventListener("mousemove", restartcursoridle)
restartcursoridle()
updatesyncstatus()
render()
