'use strict';

const STORAGE_KEY = 'pokerClockState_v3';
const OLD_KEY = 'pokerClockState_v2';
const CHANNEL_NAME = 'poker-clock-sync';

const state = {
	tournName: '',
	subtitle: '',
	schedule: [{ type: 'level', sb: 100, bb: 200, ante: 200, dur: 20 }],
	payouts: [],
	currentIndex: 0,
	secondsLeft: 1200,
	running: false,
	players: 9,
	totalEntries: 9,
	startingChips: 25000,
	buyin: 500,
	fee: 100,
	handForHand: false,
	bubbleMode: false,
	marqueeText: '',
	regClosed: false,
	prizePoolMode: 'auto',
	prizePoolManual: 0,
	defaultBreakDur: 10,
	itmMode: 'pct',     // 'pct' | 'count'
	itmPct: 15,
	itmCount: 7,
};

// ===== WebSocket 原生 (取代 localStorage; display 端純被動接收, 不寫 state) =====
// 此檔不從 localStorage 載入 / 儲存, 一切 state 都從 WebSocket 推播

// Audio
let audioCtx;
function ensureAudio() {
	if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
	if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
	updateaudiohint();
}
function beep(freq, dur, vol, type = 'sine', delay = 0) {
	if (!audioCtx) return;
	const o = audioCtx.createOscillator(), g = audioCtx.createGain();
	o.connect(g); g.connect(audioCtx.destination);
	o.type = type; o.frequency.value = freq;
	const t = audioCtx.currentTime + delay;
	g.gain.setValueAtTime(0, t);
	g.gain.linearRampToValueAtTime(vol, t + 0.01);
	g.gain.exponentialRampToValueAtTime(0.001, t + dur);
	o.start(t); o.stop(t + dur + 0.05);
}
function audioenabled(){
	return audioCtx&&audioCtx.state=="running"
}
function updateaudiohint(){
	let hint=document.getElementById("audioUnlockHint")
	if(!hint){
		return
	}
	if(audioenabled()){
		hint.style.display="none"
	}else{
		hint.style.display="block"
	}
}
function buildaudiohint(){
	if(document.getElementById("audioUnlockHint")){
		return
	}
	let hint=document.createElement("button")
	hint.id="audioUnlockHint"
	hint.type="button"
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
	hint.addEventListener("click",function(){
		ensureAudio()
		beep(660,0.08,0.2)
		updateaudiohint()
	})
	document.body.appendChild(hint)
	updateaudiohint()
}
document.addEventListener('click', ensureAudio, { once: true });
document.addEventListener('keydown', ensureAudio, { once: true });

const playLevelEnd = () => { beep(1046, 0.2, 0.4); beep(1046, 0.2, 0.4, 'sine', 0.18); beep(1046, 0.4, 0.4, 'sine', 0.36); };
const playBreakStart = () => { beep(1046, 0.3, 0.35); beep(784, 0.3, 0.35, 'sine', 0.35); beep(523, 0.5, 0.35, 'sine', 0.7); };

// ===== WebSocket 同步 (取代 BroadcastChannel) =====
const SESSIONID = new URLSearchParams(location.search).get('sessionid');
if (!SESSIONID) {
	document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#888;font-family:sans-serif;font-size:14px">缺少 sessionid 參數</div>';
	throw new Error('missing sessionid');
}

let ws = null;
let channelOk = false;  // 維持原本變數名, 給後面 $('syncDot') 用
let wsretrytimer = null;
let lastmarqueetext = '';

function parsecloudtime(value){
	if(!value){
		return null
	}
	let text=String(value).replace(" ","T")
	let time=new Date(text).getTime()
	if(isNaN(time)){
		return null
	}
	return time
}

function applyserverstate(serverstate){
	let oldindex=state.currentIndex
	let oldregclosed=state.regClosed
	Object.assign(state,serverstate)
	if(state.running&&state.lastSyncTime){
		let time=parsecloudtime(state.lastSyncTime)
		if(time){
			let diff=Math.floor((Date.now()-time)/1000)
			if(0<diff){
				state.secondsLeft=Math.max(0,state.secondsLeft-diff)
			}
		}
	}
	if(serverstate.currentIndex!==undefined&&oldindex!==state.currentIndex){
		let item=state.schedule[state.currentIndex]
		if(item&&item.type=="break"){
			playBreakStart()
		}else{
			playLevelEnd()
		}
	}
	if(oldregclosed!=true&&state.regClosed==true){
		playLevelEnd()
	}
}

function buildwsurl() {
	let proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
	let base = location.host;
	if (base.endsWith('/')) base = base.slice(0, -1);
	return proto + '//' + base + '/ws/timer/' + SESSIONID + '/';
}

function connectws() {
	let url = buildwsurl();
	console.log('[display] connecting WS:', url);
	try { ws = new WebSocket(url); } catch (e) { console.error('WS create error:', e); return; }

	ws.onopen = function () {
		channelOk = true;
		updatesyncstatus();
		console.log('[display] WS connected');
	};
	ws.onmessage = function (ev) {
		try {
			let msg = JSON.parse(ev.data);
			if ((msg.type === 'init' || msg.type === 'update') && msg.state) {
				if (Object.keys(msg.state).length > 0) {
					applyserverstate(msg.state);
					render();
				}
			}
		} catch (e) { console.error('WS msg parse error:', e); }
	};
	ws.onclose = function () {
		channelOk = false; ws = null;
		updatesyncstatus();
		console.warn('[display] WS closed, retry in 3s');
		if (wsretrytimer) clearTimeout(wsretrytimer);
		wsretrytimer = setTimeout(connectws, 3000);
	};
	ws.onerror = function (e) { console.error('[display] WS error:', e); };
}

function loadtimerstate(){
	fetch(AJAXURL+"gettimer/"+SESSIONID).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data["success"]&&data["data"]&&data["data"]["state"]){
			applyserverstate(data["data"]["state"])
			render()
		}
	}).catch(function(error){
		console.error("[display] gettimer failed:",error)
	})
}

loadtimerstate();
connectws();
buildaudiohint();

function updatesyncstatus() {
	let dot = document.getElementById('syncDot');

	if (!dot) {
		return;
	}

	if (channelOk) {
		dot.classList.remove('off');
		dot.title = '與裁判台同步中';
	} else {
		dot.classList.add('off');
		dot.title = '同步連線重試中';
	}
}

// Helpers
const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString();
const fmtTime = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };

function curItem() { return state.schedule[state.currentIndex]; }
function isBreakNow() { const it = curItem(); return it && it.type === 'break'; }
function totalLevels() { return state.schedule.filter(it => it.type === 'level').length; }
function levelNumOf(idx) {
	let n = 0;
	for (let i = 0; i <= idx; i++) if (state.schedule[i] && state.schedule[i].type === 'level') n++;
	return n;
}
function nextLevelItem(fromIdx) {
	for (let i = fromIdx + 1; i < state.schedule.length; i++) if (state.schedule[i].type === 'level') return { idx: i, item: state.schedule[i] };
	return null;
}
function nextBreakItem(fromIdx) {
	let secs = state.secondsLeft;
	for (let i = fromIdx + 1; i < state.schedule.length; i++) {
		if (state.schedule[i].type === 'break') return { idx: i, item: state.schedule[i], secsUntil: secs };
		secs += state.schedule[i].dur * 60;
	}
	// If currently in a break, no "next break"
	return null;
}
function regCloseItem(fromIdx) {
	if(state.regClosed){
		return null
	}
	let secs=state.secondsLeft
	for(let i=fromIdx;i<state.schedule.length;i=i+1){
		let item=state.schedule[i]
		if(i!=fromIdx){
			secs=secs+(item.dur*60)
		}
		if(item.regCloseAfter){
			return {
				"idx": i,
				"item": item,
				"secsUntil": secs
			}
		}
	}
	return null
}
function prizePool() {
	if (state.prizePoolMode === 'manual') return state.prizePoolManual || 0;
	return state.buyin * state.totalEntries;
}

function payoutRankNumber(value){
	let match=String(value||"").match(/\d+/)
	if(match){
		return parseInt(match[0],10)
	}
	return 0
}

function payoutRankText(start,end){
	if(start==end){
		return String(start)
	}
	return start+"-"+end
}

function payoutDisplayValue(item,amount){
	if(item.reward){
		return item.reward
	}
	return "$"+fmt(amount)
}

function buildPayoutRows(){
	let pool=prizePool()
	let payouts=state.payouts||[]
	let raws=[]
	let rows=[]
	let total=0
	for(let i=0;i<payouts.length;i=i+1){
		let amount=Math.round(pool*(parseFloat(payouts[i].pct)||0)/100)*100
		raws.push(amount)
		total=total+amount
	}
	if(0<raws.length&&0<pool){
		raws[raws.length-1]=raws[raws.length-1]+(pool-total)
	}
	for(let i=0;i<payouts.length;i=i+1){
		let rank=payoutRankNumber(payouts[i].rank)
		if(rank==0){
			rank=i+1
		}
		if(rank<=state.players){
			rows.push({
				"rankstart": rank,
				"rankend": rank,
				"value": payoutDisplayValue(payouts[i],raws[i]),
				"color": payouts[i].color||"#888",
				"inmoney": i<itmCount()
			})
		}
	}
	rows.sort(function(a,b){
		return a["rankstart"]-b["rankstart"]
	})
	let merged=[]
	for(let i=0;i<rows.length;i=i+1){
		let last=merged[merged.length-1]
		if(last&&last["value"]==rows[i]["value"]&&last["color"]==rows[i]["color"]&&last["rankend"]+1==rows[i]["rankstart"]){
			last["rankend"]=rows[i]["rankend"]
		}else{
			merged.push(rows[i])
		}
	}
	return merged
}

function visiblePayoutRows(rows){
	let maxrows=15
	if(rows.length<=maxrows){
		return rows
	}
	let first=rows[0]
	let last=rows[rows.length-1]
	let middle=rows.slice(1,rows.length-1)
	let pagesize=maxrows-2
	let pagecount=Math.max(1,Math.ceil(middle.length/pagesize))
	let page=Math.floor(Date.now()/3000)%pagecount
	let start=page*pagesize
	let output=[first]
	for(let i=start;i<middle.length&&i<start+pagesize;i=i+1){
		output.push(middle[i])
	}
	output.push(last)
	return output
}

// 計算 ITM (進獎金圈) 人數
function itmCount() {
	const maxN = Math.max(1, state.totalEntries || 1);
	let n;
	if (state.itmMode === 'count') n = parseInt(state.itmCount, 10) || 1;
	else n = Math.round((state.totalEntries || 0) * (parseFloat(state.itmPct) || 0) / 100);
	return Math.max(1, Math.min(n, maxN));
}

function buildPayouts() {
	const pool = prizePool();
	const payouts = state.payouts || [];
	const ic = itmCount();
	const ipct = state.totalEntries > 0 ? (ic / state.totalEntries * 100) : 0;
	const playersLeft = state.players || 0;
	const remainingToBubble = playersLeft - ic;

	// ITM 橫幅：前 N 名進獎金圈
	const banner = $('itmBanner');
	if (payouts.length > 0) {
		banner.style.display = 'block';
		let bubbleLine = '';
		if (remainingToBubble > 1) {
			bubbleLine = `<div style="margin-top:4px;font-size:10px;color:#888;letter-spacing:0.5px">距泡泡 ${remainingToBubble} 人</div>`;
		} else if (remainingToBubble === 1 && playersLeft > 0) {
			bubbleLine = `<div style="margin-top:4px;font-size:11px;color:#fbbf24;font-weight:900;letter-spacing:0.5px;animation:blink 1s ease-in-out infinite"> 泡泡圈！</div>`;
		} else if (playersLeft > 0) {
			bubbleLine = `<div style="margin-top:4px;font-size:10px;color:#4ade80;letter-spacing:0.5px">已進獎金圈</div>`;
		}
		banner.innerHTML = `
			<div style="font-size:9px;color:#888;letter-spacing:2px;margin-bottom:2px">IN THE MONEY</div>
			<div>前 <span class="big">${ic}</span> 名 <span class="pct">(${ipct.toFixed(1)}%)</span></div>
			${bubbleLine}
		`;
	} else {
		banner.style.display = 'none';
	}

	let payoutrows=visiblePayoutRows(buildPayoutRows())
	$('payoutList').innerHTML = payoutrows.map(function(p){
		let cls=p["inmoney"] ? 'prow mono in-money' : 'prow mono below-bubble';
		return `<div class="${cls}" style="color:${p["color"]}"><span>${payoutRankText(p["rankstart"],p["rankend"])}</span><span>${p["value"]}</span></div>`;
	}).join('');

	let prizepooltext='$' + fmt(pool);
	let prizepoolcalctext=state.prizePoolMode === 'manual'
		? '手動設定'
		: state.totalEntries + ' × $' + fmt(state.buyin) + '  (rake excluded)';
	let prizepooldisplays=document.querySelectorAll('.prizePoolDisplay');
	for(let i=0;i<prizepooldisplays.length;i=i+1){
		prizepooldisplays[i].textContent=prizepooltext;
	}
	let prizepoolcalcs=document.querySelectorAll('.prizePoolCalc');
	for(let i=0;i<prizepoolcalcs.length;i=i+1){
		prizepoolcalcs[i].textContent=prizepoolcalctext;
	}

	// Players 卡片下方補 bubble 提示
	const bs = $('bubbleStatus');
	if (bs && payouts.length > 0 && playersLeft > 0) {
		if (remainingToBubble > 1) {
			bs.style.display = 'block';
			bs.style.color = remainingToBubble <= 3 ? '#fbbf24' : '#666';
			bs.textContent = `距泡泡 ${remainingToBubble} 人 · ITM 前 ${ic}`;
		} else if (remainingToBubble === 1) {
			bs.style.display = 'block';
			bs.style.color = '#fbbf24';
			bs.textContent = ` 泡泡圈中 (前 ${ic} 名 ITM)`;
		} else {
			bs.style.display = 'block';
			bs.style.color = '#4ade80';
			bs.textContent = `✓ 已進獎金圈 (前 ${ic} 名 ITM)`;
		}
	} else if (bs) {
		bs.style.display = 'none';
	}
	bs.style.display = 'none';
}

function buildScheduleList() {
	$('blindStructureList').innerHTML = state.schedule.map((it, i) => {
		const isActive = i === state.currentIndex;
		const isDone = i < state.currentIndex;
		const isBr = it.type === 'break';
		let cls = 'lvl-row';
		if (isActive) cls += ' active' + (isBr ? ' is-break' : '');
		else if (isDone) cls += ' done';
		else cls += ' upcoming';
		if (isBr) cls += ' is-break-row';

		const ln = isBr ? '☕' : 'L' + levelNumOf(i);
		const blinds = isBr ? '<span style="color:#fbbf24">休息 '+chipRaiseText(it)+'</span>' : `<span style="font-family:'JetBrains Mono',monospace;color:${isActive ? '#fff' : isDone ? '#2a2a2a' : '#555'}">${fmt(it.sb)}/${fmt(it.bb)}</span>`;
		const regTag = it.regCloseAfter ? '<span style="color:#7f1d1d;font-size:9px;margin-left:4px;background:#3f0f0f;padding:1px 4px;border-radius:3px;font-weight:800">REG✕</span>' : '';
		return `<div class="${cls}">
			<span style="color:${isActive ? (isBr ? '#fbbf24' : '#4ade80') : isDone ? '#2a2a2a' : '#555'};min-width:32px;font-size:11px;font-weight:800">${ln}</span>
			${blinds}
			<span style="color:${isActive ? '#eab308' : isDone ? '#2a2a2a' : '#404040'}">${it.dur}m${regTag}</span>
		</div>`;
	}).join('');
}

function chipRaiseText(item){
	let values=(item&&item.chipRaiseValues)?item.chipRaiseValues:[]
	if(!values.length){
		return ""
	}
	let text=[]
	for(let i=0;i<values.length;i=i+1){
		text.push(fmt(values[i]))
	}
	return "Chip raise "+text.join(" / ")
}

function render() {
	$('tournName').textContent = state.tournName;
	$('tournSub').textContent = state.subtitle ? '— ' + state.subtitle : '';
	$('bInfo').textContent = '$' + fmt(state.buyin) + '+' + fmt(state.fee);
	$('statusInfo').innerHTML = state.running ? '<span style="color:#4ade80">▶ RUNNING</span>' : '<span style="color:#888">⏸ PAUSED</span>';

	$('bubbleBanner').style.display = state.bubbleMode ? 'block' : 'none';
	$('h4hBanner').style.display = state.handForHand ? 'block' : 'none';

	const it = curItem();
	if (!it) return;

	const overlay = $('breakOverlay');
	if (it.type === 'break') {
		overlay.style.display = 'flex';
		$('breakTimerDisplay').textContent = fmtTime(state.secondsLeft);
		$('breakTimerDisplay').className = 'mono' + (!state.running ? ' timer-paused' : '');
		const next = nextLevelItem(state.currentIndex);
		if (next) {
			$('breakNextLevel').textContent = levelNumOf(next.idx);
			$('breakNextBlinds').textContent = fmt(next.item.sb) + '/' + fmt(next.item.bb) + (chipRaiseText(it) ? ' · ' + chipRaiseText(it) : '');
		} else {
			$('breakNextLevel').textContent = '—';
			$('breakNextBlinds').textContent = '結束';
		}
		$('tagLabel').textContent = 'BREAK';
		$('tagLabel').style.color = '#fbbf24';
	} else {
		overlay.style.display = 'none';
		$('tagLabel').textContent = 'LEVEL';
		$('tagLabel').style.color = '#555';
	}

	const totalSecs = it.dur * 60;
	const pct = totalSecs > 0 ? Math.max(0, (state.secondsLeft / totalSecs) * 100) : 0;
	const td = $('timerDisplay');
	td.textContent = fmtTime(state.secondsLeft);
	td.className = 'timer-main';
	if (!state.running && it.type !== 'break') td.classList.add('timer-paused');
	else if (state.secondsLeft <= 30) td.classList.add('timer-red');
	else if (state.secondsLeft <= 60) td.classList.add('timer-amber');

	const barColor = state.secondsLeft <= 30 ? '#ef4444' : state.secondsLeft <= 60 ? '#fbbf24' : pct < 30 ? '#eab308' : '#22c55e';
	$('progressBar').style.width = pct + '%';
	$('progressBar').style.background = barColor;

	if (it.type === 'level') {
		$('levelNum').textContent = levelNumOf(state.currentIndex);
		$('levelOf').textContent = '';
		$('blindsDisplay').textContent = fmt(it.sb) + ' / ' + fmt(it.bb);
		$('anteDisplay').textContent = fmt(it.ante);
	} else {
		const next = nextLevelItem(state.currentIndex);
		$('levelNum').textContent = '☕';
		$('levelOf').textContent = '休息';
		if (next) {
			$('blindsDisplay').textContent = fmt(next.item.sb) + ' / ' + fmt(next.item.bb);
			$('anteDisplay').textContent = fmt(next.item.ante);
		} else {
			$('blindsDisplay').textContent = '—';
			$('anteDisplay').textContent = '—';
		}
	}

	$('avgStack').textContent = fmt(state.startingChips * state.totalEntries / Math.max(1, state.players))+" "+"("+(((state.startingChips * state.totalEntries / Math.max(1, state.players))/((it.bb)?(it.bb):(nextLevelItem(state.currentIndex).item.bb))).toFixed(1))+"BB)";
	$('playersDisplay').textContent = state.players;
	$('entriesLabel').textContent = '/' + state.totalEntries;

	$('regStatus').innerHTML = state.regClosed
		? '<span style="background:#3f0f0f;border:1px solid #7f1d1d;color:#f87171;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;letter-spacing:1px">REG CLOSED</span>'
		: '<span style="background:#14391f;border:1px solid #166534;color:#4ade80;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;letter-spacing:1px">REG OPEN</span>';

	const regcard=$('regCountdownCard');
	const regclose=regCloseItem(state.currentIndex);
	console.log(regclose)
	console.log(state)
	console.log(state.regClosed)
	if(state.regClosed){
		regcard.style.display='block';
		$('regCountdownDisplay').textContent='CLOSED';
		$('regCountdownDisplay').style.color='#f87171';
		$('regCloseAfterLabel').textContent='報名已截止';
	}else if(regclose){
		regcard.style.display='block';
		$('regCountdownDisplay').textContent=fmtTime(regclose.secsUntil);
		$('regCountdownDisplay').style.color=regclose.secsUntil<=300 ? '#f87171' : '#4ade80';
		if(regclose.item.type=='break'){
			$('regCloseAfterLabel').textContent='休息結束後截止';
		}else{
			$('regCloseAfterLabel').textContent='Level '+levelNumOf(regclose.idx)+' 結束後截止';
		}
	}else{
		regcard.style.display='block';
		$('regCountdownDisplay').textContent='CLOSED';
		$('regCountdownDisplay').style.color='#f87171';
		$('regCloseAfterLabel').textContent='報名已截止';
	}

	// Next blinds info
	const nb = $('nextBlindsInfo');
	const next = nextLevelItem(state.currentIndex);
	if (next) {
		nb.innerHTML = `
			<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #181818;font-size:13px;color:#888">
				<span>Level ${levelNumOf(next.idx)}</span>
				<span style="color:#ccc;font-family:'JetBrains Mono',monospace;font-size:35px;">${fmt(next.item.sb)}/${fmt(next.item.bb)}</span>
			</div>
			<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #181818;font-size:13px;color:#888">
				<span>BB Ante</span>
				<span style="color:#eab308;font-family:'JetBrains Mono',monospace;font-size:35px;">${fmt(next.item.ante)}</span>
			</div>
			<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:13px;color:#888">
				<span>Duration</span>
				<span style="color:#ccc;font-family:'JetBrains Mono',monospace;font-size:35px;">${next.item.dur} min</span>
			</div>
		`;
	} else {
		nb.innerHTML = '<div style="font-size:12px;color:#444">Final level</div>';
	}

	// Next break
	const brk = nextBreakItem(state.currentIndex);
	const bc = $('breakCountdownCard');
	if (brk && it.type !== 'break') {
		bc.style.display = 'block';
		const bd = $('breakCountdownDisplay');
		bd.textContent = fmtTime(brk.secsUntil);
		bd.style.color = brk.secsUntil <= 300 ? '#ef4444' : '#fbbf24';
		$('breakAfterLabel').textContent = '休息時長 ' + brk.item.dur + ' 分';
	} else if (it.type === 'break') {
		bc.style.display = 'block';
		const bd = $('breakCountdownDisplay');
		bd.textContent = 'ON BREAK';
		bd.style.color = '#fbbf24';
		$('breakAfterLabel').textContent = fmtTime(state.secondsLeft) + ' 剩餘';
	} else {
		bc.style.display = 'none';
	}

	// Marquee
	const mt = $('marqueeText');
	const mw = $('marqueeWrap');
	const newText = state.marqueeText || '';
	if (mt.dataset.text !== newText) {
		mt.dataset.text = newText;
		mt.innerHTML = newText.split('|').map(s => s.trim()).filter(Boolean).join(' &nbsp;|&nbsp; ');
	}
	if(lastmarqueetext!=newText){
		lastmarqueetext=newText;
		setTimeout(function(){
			if(mt.scrollWidth<=mw.clientWidth-24){
				mw.classList.add('centered');
				mw.classList.remove('scrolling');
			}else{
				mw.classList.add('scrolling');
				mw.classList.remove('centered');
			}
		},0);
	}

	buildScheduleList();
	buildPayouts();
}

// Local tick to keep timer smooth between sync messages
setInterval(() => {
	if (!state.running) return;
	if (state.secondsLeft > 0) {
		state.secondsLeft--;
		if (state.secondsLeft === 30) { beep(880, 0.15, 0.4); beep(880, 0.15, 0.4, 'sine', 0.2); beep(880, 0.15, 0.4, 'sine', 0.4); }
		if (state.secondsLeft <= 5 && state.secondsLeft > 0) beep(880, 0.1, 0.3);
	}else{
		loadtimerstate();
	}
	render();
}, 1000);

updatesyncstatus();
render();
