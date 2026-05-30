'use strict';

const STORAGE_KEY = 'pokerClockState_v3';
const OLD_KEY = 'pokerClockState_v2';
const CHANNEL_NAME = 'poker-clock-sync';

const DEFAULT_SCHEDULE = [
	{ type: 'level', sb: 100, bb: 200, ante: 200, dur: 20 },
	{ type: 'level', sb: 200, bb: 400, ante: 400, dur: 20 },
	{ type: 'level', sb: 300, bb: 600, ante: 600, dur: 20 },
	{ type: 'level', sb: 400, bb: 800, ante: 800, dur: 20 },
	{ type: 'level', sb: 500, bb: 1000, ante: 1000, dur: 20 },
	{ type: 'break', dur: 10, regCloseAfter: true },
	{ type: 'level', sb: 800, bb: 1600, ante: 1600, dur: 20 },
	{ type: 'level', sb: 1200, bb: 2400, ante: 2400, dur: 20 },
	{ type: 'level', sb: 1500, bb: 3000, ante: 3000, dur: 20 },
	{ type: 'level', sb: 2000, bb: 4000, ante: 4000, dur: 20 },
	{ type: 'level', sb: 3000, bb: 6000, ante: 6000, dur: 20 },
];

const DEFAULT_PAYOUTS = [
	{ rank: '1st', pct: 0.38, color: '#eab308' },
	{ rank: '2nd', pct: 0.22, color: '#ccc' },
	{ rank: '3rd', pct: 0.14, color: '#ccc' },
	{ rank: '4th', pct: 0.10, color: '#aaa' },
	{ rank: '5th', pct: 0.07, color: '#888' },
	{ rank: '6th', pct: 0.05, color: '#666' },
	{ rank: '7th', pct: 0.04, color: '#555' },
];

const DEFAULT_MARQUEE = '⚠ 下一個級別將進行籌碼顏色汰換，請注意自身籌碼數量 | 歡迎參加公館萬能錦標賽，祝各位玩家順利晉級！ | 下一場大型賽事將於本週日 14:00 開始報名 | 請遵守賽場規則，保持良好競賽風格';

// 智能獎金分配模板 (各 ITM 人數對應的標準曲線，數值為百分比，總和 100)
const ITM_TEMPLATES = {
	1: [100],
	2: [65, 35],
	3: [50, 30, 20],
	4: [40, 26, 20, 14],
	5: [38, 24, 17, 13, 8],
	6: [35, 22, 16, 12, 9, 6],
	7: [33, 21, 15, 11, 9, 7, 4],
	8: [30, 19, 14, 11, 9, 7, 5.5, 4.5],
	9: [28, 18, 13, 10.5, 8.5, 7, 6, 5, 4],
	10: [26, 17, 12, 10, 8, 7, 6, 5.5, 4.8, 3.7],
	11: [25, 16, 11.5, 9.5, 8, 6.5, 5.5, 5, 4.5, 4.5, 4],
	12: [24, 15, 11, 9, 7.5, 6.5, 5.5, 5, 4.5, 4, 4, 4],
	13: [23, 14.5, 11, 8.5, 7, 6, 5.5, 5, 4.5, 4, 3.8, 3.6, 3.6],
	14: [22, 14, 10, 8, 7, 6, 5.5, 5, 4.5, 4, 3.8, 3.5, 3.5, 3.2],
	15: [20, 13, 10, 8, 7, 6, 5.5, 5, 4.5, 4.2, 4, 3.8, 3.5, 3, 2.5],
};

const state = {
	tournName: '公館萬能 2 錦標賽',
	subtitle: '04/10',
	schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
	payouts: JSON.parse(JSON.stringify(DEFAULT_PAYOUTS)),
	currentIndex: 0,
	secondsLeft: DEFAULT_SCHEDULE[0].dur * 60,
	running: false,
	players: 52,
	totalEntries: 52,
	startingChips: 40000,
	buyin: 500,
	fee: 50,
	defaultBreakDur: 10,
	soundOn: true,
	vibeOn: true,
	handForHand: false,
	bubbleMode: false,
	marqueeText: DEFAULT_MARQUEE,
	regClosed: false,
	prizePoolMode: 'auto',  // 'auto' | 'manual'
	prizePoolManual: 26000,
	itmMode: 'pct',         // 'pct' | 'count'
	itmPct: 15,             // 百分比 (基於總入場人數)
	itmCount: 7,            // 直接指定人數
};

// ===== WebSocket 原生同步 (取代 localStorage + BroadcastChannel) =====
// 此版本完全靠 WebSocket + REST 跟 DB 同步, 沒有 localStorage 持久化
const SESSIONID = new URLSearchParams(location.search).get('sessionid');
if (!SESSIONID) {
	location.href = 'sessionlist.html';
}

let ws = null;
let wsready = false;
let applyingfromserver = false;  // 防 echo loop
let wsretrytimer = null;
let serverstateinited = false;
let savebusy = false;

function islinkedplayer(){
	return state.playerMode=="linked"
}

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
			sndBreak()
		}else{
			sndLevelEnd()
		}
	}
	if(oldregclosed!=true&&state.regClosed==true){
		sndAlert()
		showToast('報名已關閉','warn')
	}
}

function iscontrolready(){
	return wsready&&serverstateinited&&!savebusy
}

function getauthtoken() {
	let token=localStorage.getItem(WEBLSNAME+'token');

	if(!token){
		return null;
	}

	try{
		return JSON.parse(token);
	}catch(e){
		return token;
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
	console.log('[control] connecting WS:', url);
	try { ws = new WebSocket(url); } catch (e) { console.error('WS create error:', e); return; }

	ws.onopen = function () {
		wsready = true;
		updatesyncstatus();
		loadtimerstate();
		console.log('[control] WS connected');
	};
	ws.onmessage = function (ev) {
		try {
			let msg = JSON.parse(ev.data);
			if ((msg.type === 'init' || msg.type === 'update') && msg.state) {
				if (Object.keys(msg.state).length > 0) {
					applyingfromserver = true;
					applyserverstate(msg.state);
					serverstateinited = true;
					applyingfromserver = false;
					render();
					setcontrolenabled(iscontrolready());
				}
			}
		} catch (e) { console.error('WS msg parse error:', e); }
	};
	ws.onclose = function () {
		wsready = false; ws = null;
		serverstateinited = false;
		setcontrolenabled(false);
		updatesyncstatus();
		console.warn('[control] WS closed, retry in 3s');
		if (wsretrytimer) clearTimeout(wsretrytimer);
		wsretrytimer = setTimeout(connectws, 3000);
	};
	ws.onerror = function (e) { console.error('[control] WS error:', e); };
}

// save = 不存 localStorage, 直接 PUT 到 DB; 後端會 broadcast 回 WS group → 同步到所有 client
function save(action, partialState=null) {
	if (applyingfromserver) return;
	if (!iscontrolready()) {
		showToast('同步尚未完成，請稍候重試','err');
		updatesyncstatus();
		return;
	}
	let token = getauthtoken();
	if (!token) { console.warn('[control] save: no auth token'); return; }
	let payload = partialState !== null ? partialState : state;
	savebusy=true;
	setcontrolenabled(false);
	fetch(AJAXURL + 'savetimer/' + SESSIONID, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
		body: JSON.stringify({ state: payload, action: action || "" })
	}).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data["success"]&&data["data"]){
			applyingfromserver=true
			applyserverstate(data["data"])
			serverstateinited=true
			applyingfromserver=false
			render()
			setcontrolenabled(iscontrolready())
		}
	}).catch(function (e) {
		console.error('[control] save failed:', e);
	}).finally(function(){
		savebusy=false;
		setcontrolenabled(iscontrolready());
		updatesyncstatus();
	});
}

function broadcast(action, partialState=null) { 
	save(action, partialState); 
}

function loadtimerstate(){
	fetch(AJAXURL+"gettimer/"+SESSIONID).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data["success"]&&data["data"]&&data["data"]["state"]){
			applyingfromserver=true
			applyserverstate(data["data"]["state"])
			serverstateinited=true
			applyingfromserver=false
			render()
			setcontrolenabled(iscontrolready())
		}
	}).catch(function(error){
		console.error("[control] gettimer failed:",error)
	})
}

function updatesyncstatus() {
	let dot = document.getElementById('syncDot');
	let text = document.getElementById('syncText');

	if (!dot || !text) {
		return;
	}

	if (wsready) {
		dot.classList.remove('off');
		text.textContent = '前台同步中';
	} else {
		dot.classList.add('off');
		text.textContent = '連線重試中';
	}
}

function setcontrolenabled(enabled){
	let controls=document.querySelectorAll('button,input,select,textarea');
	for(let i=0;i<controls.length;i=i+1){
		if(controls[i].dataset&&controls[i].dataset.syncFree=="1"){
			continue;
		}
		controls[i].disabled=!enabled;
	}
}

setcontrolenabled(false);
loadtimerstate();
connectws();

// Audio
let audioCtx;
function ensureAudio() {
	if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
	if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function beep(freq, dur, vol, type = 'sine', delay = 0) {
	if (!state.soundOn || !audioCtx) return;
	const o = audioCtx.createOscillator(), g = audioCtx.createGain();
	o.connect(g); g.connect(audioCtx.destination);
	o.type = type; o.frequency.value = freq;
	const t = audioCtx.currentTime + delay;
	g.gain.setValueAtTime(0, t);
	g.gain.linearRampToValueAtTime(vol, t + 0.01);
	g.gain.exponentialRampToValueAtTime(0.001, t + dur);
	o.start(t); o.stop(t + dur + 0.05);
}
function vibe(p) { if (state.vibeOn && navigator.vibrate) navigator.vibrate(p); }
const sndClick = () => vibe(8);
const sndConfirm = () => { beep(660, 0.08, 0.25); vibe(15); };
const sndAlert = () => { beep(880, 0.15, 0.3); beep(880, 0.15, 0.3, 'sine', 0.18); vibe([20, 40, 20]); };
const sndLevelEnd = () => { beep(1046, 0.18, 0.4); beep(1046, 0.18, 0.4, 'sine', 0.18); beep(1046, 0.4, 0.4, 'sine', 0.36); vibe([60, 40, 60, 40, 100]); };
const sndBreak = () => { beep(1046, 0.3, 0.35); beep(784, 0.3, 0.35, 'sine', 0.35); beep(523, 0.5, 0.35, 'sine', 0.7); vibe([100, 50, 100, 50, 200]); };

// Helpers
const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString();
const fmtTime = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };
function parseTimeInput(str) {
	str = (str || '').trim();
	if (!str) return null;
	if (str.includes(':')) { const [m, s] = str.split(':').map(x => parseInt(x, 10) || 0); return m * 60 + s; }
	return parseInt(str, 10) * 60;
}
function showToast(msg, type = '') {
	const t = $('toast');
	t.textContent = msg;
	t.className = 'toast show' + (type ? ' ' + type : '');
	clearTimeout(t._tm);
	t._tm = setTimeout(() => t.classList.remove('show'), 1800);
}
function setLastAction(s) { $('lastAction').textContent = s; }

function controlconfirm(message,done){
	let old=document.getElementById("controlConfirmBox")
	if(old){
		old.remove()
	}
	let box=document.createElement("div")
	box.id="controlConfirmBox"
	box.className="modal-bg show"
	box.innerHTML=`
		<div class="modal">
			<div class="modal-title"><span>確認操作</span><button class="modal-close" data-control-confirm="cancel">×</button></div>
			<div style="color:#ddd;line-height:1.6;font-size:14px;white-space:pre-line">${message}</div>
			<div style="display:flex;gap:8px;margin-top:16px">
				<button class="btn btn-ghost" data-control-confirm="cancel" style="flex:1">取消</button>
				<button class="btn btn-primary" data-control-confirm="ok" style="flex:1">確認</button>
			</div>
		</div>
	`
	document.body.appendChild(box)
	let buttons=box.querySelectorAll("[data-control-confirm]")
	for(let i=0;i<buttons.length;i=i+1){
		buttons[i].addEventListener("click",function(){
			let action=this.dataset.controlConfirm
			box.remove()
			if(action=="ok"){
				done()
			}
		})
	}
}

function buildlinkedplayerlist(){
	let box=$('linkedPlayerList')
	if(!box){
		return
	}
	let keyword=($('linkedPlayerSearch').value||"").toLowerCase()
	let tablefilter=$('linkedTableSearch')?($('linkedTableSearch').value||"").toLowerCase():""
	let seatfilter=$('linkedSeatSearch')?String($('linkedSeatSearch').value||""):""
	let list=state.linkedPlayers||[]
	let html=""
	for(let i=0;i<list.length;i=i+1){
		let item=list[i]
		let name=(item["playername"]||"").toLowerCase()
		let playerid=(item["playerplayerid"]||"").toLowerCase()
		let tablename=(item["tablename"]||item["tabletoken"]||"").toLowerCase()
		let seatno=String(item["seatno"]||"")
		if(keyword&&name.indexOf(keyword)==-1&&playerid.indexOf(keyword)==-1&&tablename.indexOf(keyword)==-1&&seatno.indexOf(keyword)==-1){
			continue
		}
		if(tablefilter&&tablename.indexOf(tablefilter)==-1){
			continue
		}
		if(seatfilter&&seatno!=seatfilter){
			continue
		}
		let iseliminated=item["status"]=="eliminated"
		let tabletext=(item["tablename"]||item["tabletoken"]||"-")+" / Seat "+(item["seatno"]||"-")
		html=html+`
			<div style="display:grid;grid-template-columns:1fr 86px;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid #181818">
				<div>
					<div style="font-size:13px;color:#fff;font-weight:800">${item["playername"]||"未命名玩家"}</div>
					<div style="font-size:11px;color:#888">${tabletext}</div>
					<div style="font-size:11px;color:#666">P-${item["playerplayerid"]||""} ${iseliminated?" · 已淘汰":" · 仍在場"}</div>
				</div>
				<button class="btn btn-sm ${iseliminated?"btn-ghost":"btn-danger"}" data-timer-player="${item["id"]}" data-timer-action="${iseliminated?"restore":"eliminate"}">${iseliminated?"復原":"淘汰"}</button>
			</div>
		`
	}
	if(!html){
		html=`<div style="padding:16px;text-align:center;color:#666;font-size:13px">沒有符合的玩家</div>`
	}
	box.innerHTML=html
	let buttons=box.querySelectorAll("[data-timer-player]")
	for(let i=0;i<buttons.length;i=i+1){
		buttons[i].addEventListener("click",function(){
			edittimerplayer(this.dataset.timerPlayer,this.dataset.timerAction)
		})
	}
}

function openlinkedplayers(){
	if(!islinkedplayer()){
		return
	}
	$('linkedPlayerSearch').value=""
	if($('linkedTableSearch')){
		$('linkedTableSearch').value=""
	}
	if($('linkedSeatSearch')){
		$('linkedSeatSearch').value=""
	}
	buildlinkedplayerlist()
	$('modalLinkedPlayers').classList.add('show')
}

function edittimerplayer(timerplayerid,action){
	let token=getauthtoken()
	if(!token){
		showToast("請重新登入","err")
		return
	}
	fetch(AJAXURL+"edittimerplayer/"+SESSIONID+"/"+timerplayerid,{
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer "+token
		},
		body: JSON.stringify({
			"action": action
		})
	}).then(function(response){
		return response.json()
	}).then(function(data){
		if(data["success"]){
			applyserverstate(data["data"])
			buildlinkedplayerlist()
			render()
			showToast(action=="eliminate"?"已標記淘汰":"已復原玩家")
		}else{
			showToast(data["data"]||"操作失敗","err")
		}
	}).catch(function(error){
		showToast("網路不佳，請重新嘗試","err")
	})
}

// Schedule helpers
function curItem() { return state.schedule[state.currentIndex]; }
function isBreakNow() { const it = curItem(); return it && it.type === 'break'; }
function totalLevels() { return state.schedule.filter(it => it.type === 'level').length; }
function levelNumOf(idx) {
	let n = 0;
	for (let i = 0; i <= idx; i++) if (state.schedule[i].type === 'level') n++;
	return n;
}
function nextLevelItem(fromIdx) {
	for (let i = fromIdx + 1; i < state.schedule.length; i++) if (state.schedule[i].type === 'level') return { idx: i, item: state.schedule[i] };
	return null;
}
function prizePool() {
	if (state.prizePoolMode === 'manual') return state.prizePoolManual;
	return state.buyin * state.totalEntries;
}
function payoutDisplayValue(item,amount){
	if(item.reward){
		return item.reward;
	}
	return '$' + fmt(amount);
}

// ITM (in-the-money) 計算
function itmCount() {
	const maxN = Math.max(1, state.totalEntries);
	let n;
	if (state.itmMode === 'count') n = parseInt(state.itmCount, 10) || 1;
	else n = Math.round(state.totalEntries * (parseFloat(state.itmPct) || 0) / 100);
	return Math.max(1, Math.min(n, maxN));
}

function ordinal(n) {
	const v = n % 100;
	if (v >= 11 && v <= 13) return n + 'th';
	switch (n % 10) {
		case 1: return n + 'st';
		case 2: return n + 'nd';
		case 3: return n + 'rd';
		default: return n + 'th';
	}
}

function rankColor(i) {
	if (i === 0) return '#eab308';
	if (i === 1) return '#cbd5e1';
	if (i === 2) return '#cd7f32';
	if (i < 6) return '#aaa';
	if (i < 12) return '#888';
	return '#666';
}

// 智能生成 n 人獎金分配；n <= 15 用模板，n > 15 用衰減公式
function generateSmartPayouts(n) {
	n = Math.max(1, Math.min(n, 100));
	let pcts;
	if (ITM_TEMPLATES[n]) {
		pcts = ITM_TEMPLATES[n].slice();
	} else {
		// 大型賽事：用衰減 (top-heavy)，再 normalize 到 100
		const decay = 0.82;
		const raw = [];
		let v = 1;
		for (let i = 0; i < n; i++) { raw.push(v); v *= decay; }
		const sum = raw.reduce((a, b) => a + b, 0);
		pcts = raw.map(p => Math.round(p / sum * 1000) / 10);
	}
	// 修正捨入誤差，確保總和 = 100
	const diff = +(100 - pcts.reduce((a, b) => a + b, 0)).toFixed(2);
	if (Math.abs(diff) > 0.001) pcts[0] = +(pcts[0] + diff).toFixed(2);
	return pcts.map((p, i) => ({
		rank: ordinal(i + 1),
		pct: p / 100,
		color: rankColor(i),
	}));
}

// Render
function render() {
	const it = curItem();
	if (!it) return;

	$('tournName').textContent = state.tournName;
	$('tournSub').textContent = state.subtitle ? state.subtitle : 'REFEREE CONTROL';
	const curLvNum = it.type === 'level' ? levelNumOf(state.currentIndex) : levelNumOf(state.currentIndex);
	$('hLv').textContent = curLvNum || '—';
	$('hLvMax').textContent = totalLevels();

	const reg = $('regBadge');
	if (state.regClosed) { reg.className = 'reg-badge reg-closed'; reg.textContent = 'REG CLOSED'; }
	else { reg.className = 'reg-badge reg-open'; reg.textContent = 'REG OPEN'; }

	const tc = $('timerCard'), td = $('timerDisp'), ts = $('timerStatus'), tl = $('timerLabel'), prog = $('timerProg');
	tc.className = 'timer-card';
	td.className = 'timer-display';

	const totalSecs = it.dur * 60;
	const pct = totalSecs > 0 ? Math.max(0, (state.secondsLeft / totalSecs) * 100) : 0;

	if (it.type === 'break') {
		tc.classList.add('is-break');
		td.classList.add('is-break');
		tl.textContent = '☕ BREAK';
		prog.style.background = '#fbbf24';
		ts.textContent = state.running ? '▶ 倒數中' : '⏸ 已暫停';
	} else {
		const ln = levelNumOf(state.currentIndex);
		tl.textContent = `LEVEL ${ln} / ${totalLevels()}`;
		if (state.secondsLeft <= 30) { td.classList.add('danger'); prog.style.background = '#ef4444'; }
		else if (state.secondsLeft <= 60) { td.classList.add('warn'); prog.style.background = '#eab308'; }
		else if (pct < 30) prog.style.background = '#eab308';
		else prog.style.background = '#22c55e';
		ts.textContent = state.running ? '▶ 計時中' : '⏸ 已暫停';
	}

	td.textContent = fmtTime(state.secondsLeft);
	prog.style.width = pct + '%';

	if (!state.running) { tc.classList.add('is-paused'); td.classList.add('paused'); }

	// Blinds row
	if (it.type === 'level') {
		$('curBlinds').textContent = fmt(it.sb) + '/' + fmt(it.bb);
		$('curAnte').textContent = fmt(it.ante);
	} else {
		const next = nextLevelItem(state.currentIndex);
		if (next) {
			$('curBlinds').textContent = fmt(next.item.sb) + '/' + fmt(next.item.bb) + ' →';
			$('curAnte').textContent = fmt(next.item.ante);
		} else {
			$('curBlinds').textContent = '—';
			$('curAnte').textContent = '—';
		}
	}
	$('curPlayers').textContent = state.players;

	// Main toggle
	const mt = $('btnMainToggle');
	if (state.running) { mt.textContent = '⏸ 暫停計時'; mt.className = 'btn btn-big btn-primary'; }
	else { mt.textContent = '▶ 繼續計時'; mt.className = 'btn btn-big btn-warn'; }

	// Break button
	const bb = $('btnBreakToggle');
	if (it.type === 'break') { bb.textContent = '⏹ 結束本次休息'; bb.className = 'btn btn-big btn-danger'; }
	else { bb.textContent = '☕ 立即插入休息'; bb.className = 'btn btn-big btn-warn'; }

	$('breakDurInput').value = state.defaultBreakDur;

	// Players
	$('playerNum').textContent = state.players;
	$('metaEntries').textContent = state.totalEntries;
	const avg = state.players > 0 ? Math.round(state.startingChips * state.totalEntries / state.players) : 0;
	$('metaAvg').textContent = fmt(avg);
	let modehint=$('playerModeHint')
	let pminus=$('btnPMinus')
	let pplus=$('btnPPlus')
	let addentry=$('btnAddEntry')
	let editplayers=$('btnEditPlayers')
	if(!modehint&&document.getElementById("playerManualButtons")){
		modehint=document.createElement("div")
		modehint.id="playerModeHint"
		modehint.style.fontSize="11px"
		modehint.style.color="#666"
		modehint.style.marginTop="8px"
		modehint.style.lineHeight="1.5"
		document.getElementById("playerManualButtons").insertAdjacentElement("afterend",modehint)
	}
	if(modehint){
		if(islinkedplayer()){
			modehint.textContent="已關聯報名玩家：總入場與剩餘人數由已確認報名和淘汰狀態計算。"
		}else{
			modehint.textContent="未關聯玩家：人數可由控制台自由調整。"
		}
	}
	if(pminus){
		pminus.disabled=islinkedplayer()
	}
	if(pplus){
		pplus.disabled=islinkedplayer()
	}
	if(addentry){
		addentry.disabled=islinkedplayer()
	}
	if(editplayers){
		editplayers.disabled=islinkedplayer()
	}

	// Schedule list
	const ll = $('lvlList');
	ll.innerHTML = state.schedule.map((it2, i) => {
		const isActive = i === state.currentIndex;
		const isDone = i < state.currentIndex;
		const isBreak = it2.type === 'break';
		const cls = 'lvl-row' + (isBreak ? ' is-break-row' : '') + (isActive ? ' active' + (isBreak ? ' is-break' : '') : isDone ? ' done' : '');
		const ln = isBreak ? '☕' : 'L' + levelNumOf(i);
		const blinds = isBreak ? '休息時間' : fmt(it2.sb) + '/' + fmt(it2.bb) + ' <span style="color:#666;font-size:11px">a' + fmt(it2.ante) + '</span>';
		const regPin = it2.regCloseAfter ? '<span class="reg-pin">REG✕</span>' : '';
		return `<div class="${cls}" data-jump="${i}">
			<span class="ln">${ln}</span>
			<span class="blinds">${blinds}</span>
			<span class="dur">${it2.dur}m</span>
			<span>${regPin}</span>
		</div>`;
	}).join('');
	ll.querySelectorAll('.lvl-row').forEach(row => {
		row.addEventListener('click', () => jumpTo(parseInt(row.dataset.jump, 10)));
	});

	// Prize pool
	const pp = prizePool();
	const ppAuto = state.buyin * state.totalEntries;
	$('prizePoolBlock').innerHTML = `
		<div style="font-family:'JetBrains Mono',monospace;font-size:24px;color:#22c55e;font-weight:900">$${fmt(pp)}</div>
		<div style="font-size:11px;color:#666;margin-top:2px">
			${state.prizePoolMode === 'auto'
				? state.totalEntries + ' × $' + fmt(state.buyin) + ' (自動)'
				: '手動 · 自動值為 $' + fmt(ppAuto)}
		</div>`;
	$('prizeSegAuto').classList.toggle('active', state.prizePoolMode === 'auto');
	$('prizeSegManual').classList.toggle('active', state.prizePoolMode === 'manual');
	$('prizeManualRow').style.display = state.prizePoolMode === 'manual' ? 'flex' : 'none';
	if (state.prizePoolMode === 'manual' && document.activeElement !== $('prizeManualIn')) $('prizeManualIn').value = state.prizePoolManual;

	// ITM section
	$('itmSegPct').classList.toggle('active', state.itmMode === 'pct');
	$('itmSegCount').classList.toggle('active', state.itmMode === 'count');
	$('itmPctRow').style.display = state.itmMode === 'pct' ? 'flex' : 'none';
	$('itmCountRow').style.display = state.itmMode === 'count' ? 'flex' : 'none';
	if (document.activeElement !== $('itmPctIn')) $('itmPctIn').value = state.itmPct;
	if (document.activeElement !== $('itmCountIn')) $('itmCountIn').value = state.itmCount;
	const ic = itmCount();
	const ipctVal = state.totalEntries > 0 ? (ic / state.totalEntries * 100) : 0;
	$('itmPctResult').textContent = ic;
	$('itmCountResult').textContent = ipctVal.toFixed(1);
	const payoutN = state.payouts.length;
	let hint = `總入場 ${state.totalEntries} 人 → 前 ${ic} 名 (${ipctVal.toFixed(1)}%) 進入獎金圈`;
	if (payoutN !== ic) {
		hint += `\n⚠ 目前獎金分配為 ${payoutN} 名 — 建議按「智能分配」對齊到 ${ic} 名`;
		$('itmHint').style.color = '#fbbf24';
	} else {
		hint += `\n✓ 獎金分配與 ITM 人數一致`;
		$('itmHint').style.color = '#4ade80';
	}
	$('itmHint').textContent = hint;
	$('itmHint').style.whiteSpace = 'pre-line';

	// Payouts list — 計算總和以校正最後一名讓金額加總 = 獎池
	let acc = 0;
	const raws = state.payouts.map(p => Math.round(pp * p.pct / 100) * 100);
	const sumRaw = raws.reduce((a, b) => a + b, 0);
	const lastIdx = raws.length - 1;
	if (lastIdx >= 0) raws[lastIdx] += (pp - sumRaw);  // 修正捨入差到最後一名
	$('payoutsList').innerHTML = state.payouts.map((p, i) => {
		return `<div class="payout-row" style="color:${p.color}"><span>${p.rank}</span><span>${payoutDisplayValue(p,raws[i])}</span></div>`;
	}).join('');

	// Marquee input (don't reset if user is typing)
	const ma = $('marqueeIn');
	if (document.activeElement !== ma) ma.value = state.marqueeText || '';

	// Reg hint
	const regItems = state.schedule.map((s, i) => s.regCloseAfter ? (s.type === 'break' ? '休息(' + (i + 1) + ')' : 'L' + levelNumOf(i)) : null).filter(Boolean);
	$('regHint').textContent = regItems.length
		? '當前觸發點：' + regItems.join('、') + ' 結束時自動關閉'
		: '尚未設定觸發點 — 可手動切換或在賽程結構中標記';
}

// Actions
function tick() {
	if (!state.running) return;
	state.secondsLeft--;

	const it = curItem();
	if (!it) return;

	if (state.secondsLeft === 60) { sndAlert(); showToast('剩餘 1 分鐘', 'warn'); }
	else if (state.secondsLeft === 30) { sndAlert(); }
	else if (state.secondsLeft <= 5 && state.secondsLeft > 0) { beep(880, 0.1, 0.3); vibe(10); }

	if (state.secondsLeft <= 0) {
		loadtimerstate();
		render();
		return;
	}
	render();
}

function togglePause() {
	ensureAudio();
	state.running = !state.running;
	sndClick();
	setLastAction(state.running ? '繼續' : '暫停');
	showToast(state.running ? '▶ 繼續計時' : '⏸ 已暫停');
	broadcast('toggle');
	render();
}

function adjustTime(delta) {
	ensureAudio();
	const it = curItem();
	const max = it.dur * 60;
	state.secondsLeft = Math.max(0, Math.min(max + 600, state.secondsLeft + delta));
	sndClick();
	setLastAction(`時間 ${delta > 0 ? '+' : ''}${delta}秒`);
	broadcast('time-adjust');
	render();
}

function setTimeTo(secs) {
	ensureAudio();
	state.secondsLeft = secs;
	sndConfirm();
	setLastAction('設定時間 ' + fmtTime(secs));
	broadcast('time-set');
	render();
}

function resetCurrentItem() {
	ensureAudio();
	state.secondsLeft = curItem().dur * 60;
	sndConfirm();
	setLastAction('重設本項時間');
	showToast('已重設時間');
	broadcast('time-reset');
	render();
}

function endItemNow() {
	ensureAudio();
	controlconfirm('立即結束本項？',function(){
		state.secondsLeft = 0;
		tick();
	})
}

function nextItem() {
	ensureAudio();
	if (state.currentIndex < state.schedule.length - 1) {
		const prev = curItem();
		if (prev.regCloseAfter && !state.regClosed) state.regClosed = true;
		state.currentIndex++;
		state.secondsLeft = curItem().dur * 60;
		sndConfirm();
		setLastAction('下一項');
		const it = curItem();
		showToast(it.type === 'break' ? '☕ 休息開始' : '進入 Level ' + levelNumOf(state.currentIndex));
		broadcast('next-item');
		render();
	}
}

function prevItem() {
	ensureAudio();
	if (state.currentIndex > 0) {
		state.currentIndex--;
		state.secondsLeft = curItem().dur * 60;
		sndConfirm();
		setLastAction('上一項');
		const it = curItem();
		showToast(it.type === 'break' ? '☕ 回到休息' : '回到 Level ' + levelNumOf(state.currentIndex));
		broadcast('prev-item');
		render();
	}
}

function jumpTo(idx) {
	ensureAudio();
	if (idx < 0 || idx >= state.schedule.length) return;
	if (idx === state.currentIndex) { showToast('已在此項'); return; }
	const it = state.schedule[idx];
	const label = it.type === 'break' ? '休息' : 'Level ' + levelNumOf(idx);
	controlconfirm('跳轉到 ' + label + '？',function(){
		state.currentIndex = idx;
		state.secondsLeft = it.dur * 60;
		sndConfirm();
		setLastAction('跳到 ' + label);
		showToast('已跳到 ' + label);
		broadcast('jump');
		render();
	})
}

// Jump to a level number (1-indexed, only counting levels)
function jumpToLevelNum(num) {
	let count = 0;
	for (let i = 0; i < state.schedule.length; i++) {
		if (state.schedule[i].type === 'level') {
			count++;
			if (count === num) { jumpTo(i); return; }
		}
	}
	showToast('找不到該關卡', 'err');
}

function toggleBreak() {
	ensureAudio();
	const it = curItem();
	if (it.type === 'break') {
		controlconfirm('結束本次休息？',function(){
			if (state.currentIndex < state.schedule.length - 1) {
				state.currentIndex++;
				state.secondsLeft = curItem().dur * 60;
			}
			sndConfirm();
			setLastAction('結束休息');
			showToast('休息結束');
			broadcast('break-toggle');
			render();
		})
		return
	} else {
		// Insert a break right after current and jump to it
		const dur = state.defaultBreakDur || 10;
		state.schedule.splice(state.currentIndex + 1, 0, { type: 'break', dur });
		state.currentIndex++;
		state.secondsLeft = dur * 60;
		state.running = true;
		sndBreak();
		setLastAction('插入休息');
		showToast('☕ 休息 ' + dur + ' 分鐘', 'warn');
	}
	broadcast('break-toggle');
	render();
}

// Bindings
$('btnMainToggle').addEventListener('click', togglePause);
document.querySelectorAll('[data-time]').forEach(b => b.addEventListener('click', () => adjustTime(parseInt(b.dataset.time, 10))));
document.querySelectorAll('[data-break-time]').forEach(b => {
	b.addEventListener('click', () => {
		const d = parseInt(b.dataset.breakTime, 10);
		if (isBreakNow()) adjustTime(d);
		else showToast('目前不在休息中 — 微調無效', 'warn');
	});
});

$('btnSetTime').addEventListener('click', () => {
	const v = parseTimeInput($('timeSetInput').value);
	if (v === null || isNaN(v)) { showToast('請輸入 MM:SS 或秒數', 'err'); return; }
	setTimeTo(v);
	$('timeSetInput').value = '';
});
$('btnResetLv').addEventListener('click', resetCurrentItem);
$('btnEndLv').addEventListener('click', endItemNow);
$('btnPrevLv').addEventListener('click', prevItem);
$('btnNextLv').addEventListener('click', nextItem);
$('btnJumpLv').addEventListener('click', () => {
	const v = parseInt($('jumpLvInput').value, 10);
	if (isNaN(v)) { showToast('請輸入關卡編號', 'err'); return; }
	jumpToLevelNum(v);
	$('jumpLvInput').value = '';
});
$('btnBreakToggle').addEventListener('click', toggleBreak);
$('breakDurInput').addEventListener('change', () => {
	const v = parseInt($('breakDurInput').value, 10);
	if (!isNaN(v) && v >= 1) { state.defaultBreakDur = v; sndClick(); broadcast('default-break'); }
});

// Players
$('btnPMinus').addEventListener('click', () => { ensureAudio(); if (state.players > 0) { state.players--; sndClick(); setLastAction('剩 ' + state.players); broadcast('player-change'); render(); } });
$('btnPPlus').addEventListener('click', () => { ensureAudio(); state.players++; sndClick(); setLastAction('剩 ' + state.players); broadcast('player-change'); render(); });
$('btnBust').addEventListener('click', () => {
	if(islinkedplayer()){
		openlinkedplayers();
		return;
	}
	ensureAudio();
	if (state.players <= 1) { showToast('已是最後一人', 'warn'); return; }
	state.players--; sndConfirm(); setLastAction('淘汰 1 人 (剩 ' + state.players + ')'); showToast('剩 ' + state.players + ' 人'); 
	broadcast('bust', { players: state.players }); 
	render();
});
$('btnAddEntry').addEventListener('click', () => {
	if(islinkedplayer()){
		openlinkedplayers();
		return;
	}
	ensureAudio();
	if (state.regClosed) { showToast('報名已關閉，仍要加入？', 'warn'); }
	state.players++; state.totalEntries++; sndConfirm(); setLastAction('+1 入場'); showToast('+1 入場 (總 ' + state.totalEntries + ')'); 
	broadcast('add-entry', { players: state.players, totalEntries: state.totalEntries }); 
	render();
});
$('btnEditPlayers').addEventListener('click', () => {
	if(islinkedplayer()){
		openlinkedplayers();
		return;
	}
	$('editPlayersIn').value = state.players;
	$('editEntriesIn').value = state.totalEntries;
	$('editChipsIn').value = state.startingChips;
	$('modalPlayers').classList.add('show');
});
$('btnSavePlayers').addEventListener('click', () => {
	const p = parseInt($('editPlayersIn').value, 10);
	const e = parseInt($('editEntriesIn').value, 10);
	const c = parseInt($('editChipsIn').value, 10);
	if (isNaN(p) || isNaN(e) || isNaN(c)) { showToast('請輸入有效數字', 'err'); return; }
	state.players = Math.max(0, p);
	state.totalEntries = Math.max(state.players, e);
	state.startingChips = Math.max(100, c);
	sndConfirm(); setLastAction('編輯人數'); showToast('已儲存');
	broadcast('players-edit', { players: state.players, totalEntries: state.totalEntries, startingChips: state.startingChips }); 
	render();
	$('modalPlayers').classList.remove('show');
});
if($('linkedPlayerSearch')){
	$('linkedPlayerSearch').addEventListener('input',buildlinkedplayerlist);
}
if($('linkedTableSearch')){
	$('linkedTableSearch').addEventListener('input',buildlinkedplayerlist);
}
if($('linkedSeatSearch')){
	$('linkedSeatSearch').addEventListener('input',buildlinkedplayerlist);
}

// Title
$('btnEditTitle').addEventListener('click', () => {
	$('editTname').value = state.tournName;
	$('editTsub').value = state.subtitle || '';
	$('modalTitle').classList.add('show');
});
$('titleBlock').addEventListener('click', () => $('btnEditTitle').click());
$('btnSaveTitle').addEventListener('click', () => {
	state.tournName = $('editTname').value || state.tournName;
	state.subtitle = $('editTsub').value || '';
	sndConfirm(); showToast('標題已更新'); setLastAction('改標題');
	broadcast('title', { tournName: state.tournName, subtitle: state.subtitle }); 
	render();
	$('modalTitle').classList.remove('show');
});

// Reg badge click toggle
$('regBadge').addEventListener('click', () => {
	controlconfirm(state.regClosed ? '重新開放報名？' : '立即關閉報名？',function(){
		state.regClosed = !state.regClosed;
		sndConfirm(); setLastAction(state.regClosed ? 'REG 關閉' : 'REG 開放');
		showToast(state.regClosed ? '報名已關閉' : '報名已開放');
		broadcast('reg-toggle', { regClosed: state.regClosed });
		render();
	})
});
$('btnRegToggle').addEventListener('click', () => $('regBadge').click());
$('btnRegEdit').addEventListener('click', () => {
	buildRegPickList();
	$('modalReg').classList.add('show');
});
function buildRegPickList() {
	$('regPickList').innerHTML = state.schedule.map((s, i) => {
		const lab = s.type === 'break' ? '☕ 休息 #' + (i + 1) + ' (' + s.dur + 'm)' : 'L' + levelNumOf(i) + ' — ' + fmt(s.sb) + '/' + fmt(s.bb);
		return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #181818;font-size:13px">
			<span style="color:${s.type === 'break' ? '#fbbf24' : '#fff'}">${lab}</span>
			<input type="checkbox" data-reg-i="${i}" ${s.regCloseAfter ? 'checked' : ''} style="width:20px;height:20px">
		</div>`;
	}).join('');
}
$('btnRegClear').addEventListener('click', () => {
	state.schedule.forEach(s => delete s.regCloseAfter);
	buildRegPickList();
});
$('btnRegDone').addEventListener('click', () => {
	document.querySelectorAll('[data-reg-i]').forEach(cb => {
		const i = parseInt(cb.dataset.regI, 10);
		if (cb.checked) state.schedule[i].regCloseAfter = true;
		else delete state.schedule[i].regCloseAfter;
	});
	sndConfirm(); showToast('觸發點已更新');
	broadcast('reg-config'); render();
	$('modalReg').classList.remove('show');
});

// Marquee
$('btnMarqueeSave').addEventListener('click', () => {
	state.marqueeText = $('marqueeIn').value;
	sndConfirm(); showToast('跑馬燈已更新'); setLastAction('改跑馬燈');
	broadcast('marquee'); render();
});
$('btnMarqueeReset').addEventListener('click', () => {
	$('marqueeIn').value = DEFAULT_MARQUEE;
	state.marqueeText = DEFAULT_MARQUEE;
	sndConfirm(); broadcast('marquee'); render();
});

// Prize pool — 只抓 [data-mode] 的 seg，避免和 ITM 模式按鈕衝突
document.querySelectorAll('[data-mode]').forEach(s => s.addEventListener('click', () => {
	state.prizePoolMode = s.dataset.mode;
	if (state.prizePoolMode === 'manual' && !state.prizePoolManual) {
		state.prizePoolManual = state.buyin * state.totalEntries;
	}
	sndClick(); broadcast('prize-mode'); render();
}));
$('btnSavePrize').addEventListener('click', () => {
	const v = parseInt($('prizeManualIn').value, 10);
	if (isNaN(v) || v < 0) { showToast('請輸入有效金額', 'err'); return; }
	state.prizePoolManual = v;
	sndConfirm(); showToast('獎池已更新');
	broadcast('prize-amount'); render();
});

// ITM 模式切換
document.querySelectorAll('[data-itm-mode]').forEach(s => s.addEventListener('click', () => {
	state.itmMode = s.dataset.itmMode;
	sndClick(); setLastAction('ITM 模式：' + (state.itmMode === 'pct' ? '百分比' : '人數'));
	broadcast('itm-mode'); render();
}));
// ITM 百分比輸入
$('itmPctIn').addEventListener('change', () => {
	const v = parseFloat($('itmPctIn').value);
	if (isNaN(v) || v <= 0 || v > 100) { showToast('請輸入 0-100 的百分比', 'err'); return; }
	state.itmPct = v;
	sndConfirm(); broadcast('itm-pct'); render();
});
$('itmPctIn').addEventListener('input', () => {
	const v = parseFloat($('itmPctIn').value);
	if (!isNaN(v) && v > 0 && v <= 100) {
		const c = Math.max(1, Math.round(state.totalEntries * v / 100));
		$('itmPctResult').textContent = c;
	}
});
// ITM 人數輸入
$('itmCountIn').addEventListener('change', () => {
	const v = parseInt($('itmCountIn').value, 10);
	if (isNaN(v) || v <= 0) { showToast('請輸入大於 0 的人數', 'err'); return; }
	state.itmCount = Math.min(v, state.totalEntries);
	sndConfirm(); broadcast('itm-count'); render();
});
$('itmCountIn').addEventListener('input', () => {
	const v = parseInt($('itmCountIn').value, 10);
	if (!isNaN(v) && v > 0 && state.totalEntries > 0) {
		$('itmCountResult').textContent = (v / state.totalEntries * 100).toFixed(1);
	}
});
// 智能分配獎金
$('btnAutoITM').addEventListener('click', () => {
	ensureAudio();
	const n = itmCount();
	controlconfirm(`將自動產生 ${n} 個名次的獎金分配，會覆寫目前的獎金設定，繼續？`,function(){
		state.payouts = generateSmartPayouts(n);
		sndConfirm(); showToast('已智能分配 ' + n + ' 人獎金', 'warn');
		setLastAction('智能分配 ' + n + ' 人');
		broadcast('auto-itm'); render();
	})
});

// Payouts edit
function buildPayoutsEditor() {
	const c = $('payoutsEditList');
	c.innerHTML = state.payouts.map((p, i) => `
		<div style="display:grid;grid-template-columns:58px 1fr 74px 92px 36px;gap:6px;align-items:center;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;padding:6px">
			<input class="txt" data-pay-i="${i}" data-pay-k="rank" type="text" value="${p.rank}" style="font-size:12px;padding:6px;min-height:34px">
			<input class="txt" data-pay-i="${i}" data-pay-k="color" type="color" value="${p.color}" style="padding:2px;min-height:34px;width:100%">
			<input class="txt" data-pay-i="${i}" data-pay-k="pct" type="number" step="0.01" min="0" value="${(p.pct * 100).toFixed(2)}" style="font-size:12px;padding:6px;min-height:34px" inputmode="decimal" title="百分比">
			<input class="txt" data-pay-i="${i}" data-pay-k="reward" type="text" value="${p.reward||''}" style="font-size:12px;padding:6px;min-height:34px" placeholder="獎項">
			<button class="ico-btn del" data-pay-del="${i}" style="width:30px;height:34px">✕</button>
		</div>
	`).join('') || '<div style="color:#666;font-size:12px">尚無名次</div>';
	updatePayoutSum();
	c.querySelectorAll('[data-pay-del]').forEach(b => b.addEventListener('click', () => {
		state.payouts.splice(parseInt(b.dataset.payDel, 10), 1);
		buildPayoutsEditor();
	}));
	c.querySelectorAll('[data-pay-k="pct"]').forEach(inp => inp.addEventListener('input', updatePayoutSum));
}
function updatePayoutSum() {
	let sum = 0;
	document.querySelectorAll('[data-pay-k="pct"]').forEach(inp => sum += parseFloat(inp.value) || 0);
	$('payoutsSum').textContent = '總和：' + sum.toFixed(2) + '%';
	$('payoutsSum').style.color = Math.abs(sum - 100) < 0.01 ? '#4ade80' : sum > 100 ? '#f87171' : '#fbbf24';
}
$('btnEditPayouts').addEventListener('click', () => { buildPayoutsEditor(); $('modalPayouts').classList.add('show'); });
$('btnAddPayout').addEventListener('click', () => {
	const rank = (state.payouts.length + 1) + 'th';
	state.payouts.push({ rank, pct: 0, color: '#888', reward: '' });
	buildPayoutsEditor();
});
$('btnRemovePayout').addEventListener('click', () => {
	if (state.payouts.length > 0) state.payouts.pop();
	buildPayoutsEditor();
});
$('btnSavePayouts').addEventListener('click', () => {
	const newPayouts = [];
	const indices = [...new Set([...document.querySelectorAll('[data-pay-i]')].map(el => parseInt(el.dataset.payI, 10)))];
	indices.sort((a, b) => a - b).forEach(i => {
		const p = { rank: '', pct: 0, color: '#888' };
		document.querySelectorAll('[data-pay-i="' + i + '"]').forEach(el => {
			const k = el.dataset.payK;
			if (k === 'pct') p[k] = (parseFloat(el.value) || 0) / 100;
			else p[k] = el.value;
		});
		newPayouts.push(p);
	});
	state.payouts = newPayouts;
	sndConfirm(); showToast('獎金分配已儲存');
	broadcast('payouts'); render();
	$('modalPayouts').classList.remove('show');
});

// Presets
$('btnBubble').addEventListener('click', () => {
	ensureAudio();
	state.bubbleMode = !state.bubbleMode;
	state.running = false;
	sndAlert(); setLastAction(state.bubbleMode ? '泡泡圈' : '結束泡泡');
	showToast(state.bubbleMode ? '🫧 泡泡圈 — 已暫停' : '泡泡結束', 'warn');
	broadcast('bubble'); render();
});
$('btnHandForHand').addEventListener('click', () => {
	ensureAudio();
	state.handForHand = !state.handForHand;
	state.running = false;
	sndAlert(); setLastAction(state.handForHand ? '同步發牌' : '結束同步');
	showToast(state.handForHand ? '🃏 Hand-for-Hand 開啟' : 'H4H 結束', 'warn');
	broadcast('h4h'); render();
});
$('btnFinalTable').addEventListener('click', () => { ensureAudio(); showToast('⭐ Final Table — 提示玩家'); sndAlert(); setLastAction('Final Table'); broadcast('final-table'); });
$('btnColorUp').addEventListener('click', () => { ensureAudio(); showToast('🪙 籌碼汰換中', 'warn'); sndBreak(); setLastAction('籌碼汰換'); broadcast('color-up'); });

// Structure pages
function gotostructurepage(page){
	location.href=page+"?sessionid="+encodeURIComponent(SESSIONID);
}
$('btnViewStruct').addEventListener('click',function(){
	gotostructurepage("structure.html");
});
$('btnEditStruct').addEventListener('click',function(){
	gotostructurepage("structureedit.html");
});

// Settings
$('btnSettings').addEventListener('click', () => {
	$('setBuyin').value = '$' + fmt(state.buyin);
	$('setFee').value = '$' + fmt(state.fee);
	$('setSound').value = state.soundOn ? '1' : '0';
	$('setVibe').value = state.vibeOn ? '1' : '0';
	$('modalSettings').classList.add('show');
});
$('btnSaveSettings').addEventListener('click', () => {
	state.soundOn = $('setSound').value === '1';
	state.vibeOn = $('setVibe').value === '1';
	sndConfirm(); showToast('設定已儲存');
	broadcast('settings'); render();
	$('modalSettings').classList.remove('show');
});
$('btnReset').addEventListener('click', () => {
	controlconfirm('完全重置所有狀態？此操作無法復原',function(){
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(OLD_KEY);
		let sessionbuyin=state.buyin;
		let sessionfee=state.fee;
		Object.assign(state,{
			tournName: '公館萬能 2 錦標賽',
			subtitle: '04/10',
			schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
			payouts: JSON.parse(JSON.stringify(DEFAULT_PAYOUTS)),
			currentIndex: 0,
			secondsLeft: DEFAULT_SCHEDULE[0].dur * 60,
			running: false,
			players: 52,
			totalEntries: 52,
			startingChips: 40000,
			buyin: sessionbuyin,
			fee: sessionfee,
			defaultBreakDur: 10,
			soundOn: true,
			vibeOn: true,
			handForHand: false,
			bubbleMode: false,
			marqueeText: DEFAULT_MARQUEE,
			regClosed: false,
			prizePoolMode: 'auto',
			prizePoolManual: sessionbuyin*52,
			itmMode: 'pct',
			itmPct: 15,
			itmCount: 7
		});
		sndConfirm();
		showToast('已重置計時器');
		broadcast('reset');
		render();
	})
});

// Modal close
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => $(b.dataset.close).classList.remove('show')));
document.querySelectorAll('.modal-bg').forEach(bg => bg.addEventListener('click', e => { if (e.target === bg) bg.classList.remove('show'); }));

// Sync indicator
updatesyncstatus();

// Wake lock
let wakeLock = null;
async function requestWake() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && state.running) requestWake(); });
document.addEventListener('click', () => { ensureAudio(); requestWake(); }, { once: true });

// Init
render();
setInterval(tick, 1000);
