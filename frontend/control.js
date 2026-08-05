'use strict';

function controltext(key){
	let language=weblsget(WEBLSNAME+"language",false)
	if(!language){
		language="zhtw"
	}
	let extra={
		zhtw: {
			itmhintitm: "進入獎金圈",
			breakingnow: "休息中",
			placeunit: " 名",
			ppautoprefix: "名次現金加總 · 原獎池 ",
			ppcarryprefix: " + 前日未用 $",
			ppguaranteeprefix: " · 保底 $",
			ppmanualprefix: "名次現金加總 · 手動獎池 $",
			ppautovalueprefix: " · 自動值 $",
			regbreakprefix: "休息(",
			regbreaksuffix: ")",
			breaklabel: "休息",
			jumptoprefix: "跳轉到 ",
			jumptosuffix: "？",
			breakhashprefix: "☕ 休息 #",
			autopayoutprefix: "將自動產生 ",
			autopayoutsuffix: " 個名次的獎金分配，會覆寫目前的獎金設定，繼續？",
			breakminuteprefix: "☕ 休息 ",
			breakminutesuffix: " 分鐘",
			playersleftsuffix: " 人",
			confirmjoinafterclose: "報名已關閉，仍要加入？",
			operationfailed: "操作失敗",
			defaultmarquee: "⚠ 下一個級別將進行計分牌顏色汰換，請注意自身計分牌數量 | 歡迎參加本場賽事，祝各位選手順利晉級！ | 請留意主辦單位現場公告 | 請遵守賽場規則，保持良好競賽風格",
			reconnected: "已恢復連線",
			connectionlost: "連線中斷，控制已暫停，重試中…",
			syncnotready: "同步尚未完成，請稍候重試",
			playerlinkedhint: "已關聯報名選手：總入場與剩餘人數由已確認報名和淘汰狀態計算。",
			playermanualhint: "未關聯選手：人數可由控制台自由調整。",
			breaktime: "休息時間",
			oneminuteleft: "剩餘 1 分鐘",
			resumeaction: "繼續",
			pauseaction: "暫停",
			resumetoast: "▶ 繼續計時",
			pausetoast: "⏸ 已暫停",
			confirmenditem: "立即結束本項？",
			nextitemaction: "下一項",
			breakstarttoast: "☕ 休息開始",
			enterleveltoast: "進入 Level ",
			previtemaction: "上一項",
			backtobreaktoast: "☕ 回到休息",
			backtoleveltoast: "回到 Level ",
			alreadyhere: "已在此項",
			breaklabel: "休息",
			confirmjumpprefix: "跳轉到 ",
			confirmjumpsuffix: "？",
			jumpactionprefix: "跳到 ",
			jumpedprefix: "已跳到 ",
			timeadjustactionprefix: "時間 ",
			timeadjustactionsuffix: " 秒",
			timesetaction: "設定時間 ",
			timeresetaction: "重設本項時間",
			timeresettoast: "已重設時間",
			levelnotfound: "找不到該關卡",
			confirmendbreak: "結束本次休息？",
			endbreakaction: "結束休息",
			endbreaktoast: "休息結束",
			insertbreakaction: "插入休息",
			insertbreaktoastprefix: "☕ 休息 ",
			insertbreaktoastsuffix: " 分鐘",
			breakadjustinvalid: "目前不在休息中 — 微調無效",
			invalidtime: "請輸入 MM:SS 或分鐘數",
			invalidlevel: "請輸入關卡編號",
			playersleftprefix: "剩 ",
			playerslefttoastsuffix: " 人",
			lastplayer: "已是最後一人",
			bustactionprefix: "淘汰 1 人 (剩 ",
			bustactionsuffix: ")",
			addentrywarn: "報名已關閉，仍要加入？",
			addentryaction: "+1 入場",
			addentrytoastprefix: "+1 入場 (總 ",
			addentrytoastsuffix: ")",
			invalidnumber: "請輸入有效數字",
			editplayersaction: "編輯人數",
			saved: "已儲存",
			titleupdated: "標題已更新",
			edittitleaction: "改標題",
			confirmclosereg: "立即關閉報名？",
			confirmopenreg: "重新開放報名？",
			regcloseaction: "REG 關閉",
			regopenaction: "REG 開放",
			regclosedtoast: "報名已關閉",
			regopentoast: "報名已開放",
			marqueeupdated: "跑馬燈已更新",
			editmarqueeaction: "改跑馬燈",
			invalidamount: "請輸入有效金額",
			prizeupdated: "獎池已更新",
			itmmodepctaction: "ITM 模式：百分比",
			itmmodecountaction: "ITM 模式：人數",
			invalidpct: "請輸入 0-100 的百分比",
			invalidcount: "請輸入大於 0 的人數",
			autoitmconfirmprefix: "將自動產生 ",
			autoitmconfirmmiddle: " 個名次的獎金分配，會覆寫目前的獎金設定，繼續？",
			autoitmtoastprefix: "已智能分配 ",
			autoitmtoastsuffix: " 人獎金",
			autoitmactionprefix: "智能分配 ",
			autoitmactionsuffix: " 人",
			bubbleaction: "泡泡圈",
			bubbletoast: "🫧 泡泡圈 — 已暫停",
			bubbleendaction: "結束泡泡",
			bubbleendtoast: "泡泡結束",
			h4haction: "同步發牌",
			h4htoast: "🃏 Hand-for-Hand 開啟",
			h4hendaction: "結束同步",
			h4hendtoast: "H4H 結束",
			finaltabletoast: "⭐ Final Table — 提示選手",
			coloruptoast: "🪙 計分牌汰換中",
			colorupaction: "計分牌汰換",
			settingssaved: "設定已儲存",
			confirmresetall: "完全重置所有狀態？此操作無法復原",
			timerreset: "已重置計時器",
			linkedeliminateconfirm: "確認淘汰這位關聯選手？",
			linkedrestoreconfirm: "確認回復這位關聯選手？",
			seatlabel: "座位：",
			namelabel: "姓名：",
			signinagain: "請重新登入",
			linkedeliminated: "已標記淘汰",
			linkedrestored: "已復原選手",
			operationfail: "操作失敗",
			networkfail: "網路不佳，請重新嘗試",
			prizeautoprefix: "名次現金加總 · 原獎池 ",
			prizecarry: " + 前日未用 $",
			prizeguarantee: " · 保底 $",
			prizeautoequals: " = $",
			prizemanualprefix: "名次現金加總 · 手動獎池 $",
			prizeautovalue: " · 自動值 $",
			itmhintprefix: "總入場 ",
			itmhintmiddle: " 人 → 前 ",
			itmhintsuffix: " 名",
			itmhintwarnprefix: "\n⚠ 目前獎金分配為 ",
			itmhintwarnmiddle: " 名 — 建議按「智能分配」對齊到 ",
			itmhintok: "\n✓ 獎金分配與 ITM 人數一致",
			"nocontrolpermission": "此帳號沒有計時器控制權限（計分員僅供檢視），控制按鈕已停用",
			"otherreward": "其他獎勵"
		},
		en: {
			itmhintitm: "in the money",
			breakingnow: "On Break",
			placeunit: " places",
			ppautoprefix: "Rank cash total · base pool ",
			ppcarryprefix: " + carried over $",
			ppguaranteeprefix: " · guaranteed $",
			ppmanualprefix: "Rank cash total · manual pool $",
			ppautovalueprefix: " · auto $",
			regbreakprefix: "Break (",
			regbreaksuffix: ")",
			breaklabel: "Break",
			jumptoprefix: "Jump to ",
			jumptosuffix: "?",
			breakhashprefix: "☕ Break #",
			autopayoutprefix: "This will generate payouts for ",
			autopayoutsuffix: " places and overwrite the current prize settings. Continue?",
			breakminuteprefix: "☕ Break ",
			breakminutesuffix: " min",
			playersleftsuffix: " players",
			confirmjoinafterclose: "Registration is closed. Add anyway?",
			operationfailed: "Operation failed",
			defaultmarquee: "⚠ Chip color-up is coming at the next level, please verify your stack size | Welcome to today's event and good luck to all players | Please watch for on-site organizer announcements | Please follow the house rules and keep strong sportsmanship",
			reconnected: "Connection restored",
			connectionlost: "Connection lost. Controls are paused while reconnecting.",
			syncnotready: "Sync is not ready yet. Please try again shortly.",
			playerlinkedhint: "Linked registration mode: total entries and remaining players are calculated from confirmed registrations and elimination status.",
			playermanualhint: "Manual mode: player counts can be adjusted freely from the control page.",
			breaktime: "Break Time",
			oneminuteleft: "1 minute remaining",
			resumeaction: "Resume",
			pauseaction: "Pause",
			resumetoast: "▶ Timer resumed",
			pausetoast: "⏸ Timer paused",
			confirmenditem: "End the current item now?",
			nextitemaction: "Next item",
			breakstarttoast: "☕ Break started",
			enterleveltoast: "Entered Level ",
			previtemaction: "Previous item",
			backtobreaktoast: "☕ Back to break",
			backtoleveltoast: "Back to Level ",
			alreadyhere: "Already on this item",
			breaklabel: "Break",
			confirmjumpprefix: "Jump to ",
			confirmjumpsuffix: "?",
			jumpactionprefix: "Jump to ",
			jumpedprefix: "Jumped to ",
			timeadjustactionprefix: "Time ",
			timeadjustactionsuffix: "s",
			timesetaction: "Set time ",
			timeresetaction: "Reset this time",
			timeresettoast: "Time reset",
			levelnotfound: "Level not found",
			confirmendbreak: "End this break?",
			endbreakaction: "End break",
			endbreaktoast: "Break ended",
			insertbreakaction: "Insert break",
			insertbreaktoastprefix: "☕ Break ",
			insertbreaktoastsuffix: " minutes",
			breakadjustinvalid: "You are not currently on a break, so break adjustments have no effect.",
			invalidtime: "Please enter MM:SS or minutes",
			invalidlevel: "Please enter a level number",
			playersleftprefix: "Left ",
			playerslefttoastsuffix: " players",
			lastplayer: "Already at the last player",
			bustactionprefix: "Bust 1 player (left ",
			bustactionsuffix: ")",
			addentrywarn: "Registration is closed. Add an entry anyway?",
			addentryaction: "+1 Entry",
			addentrytoastprefix: "+1 Entry (total ",
			addentrytoastsuffix: ")",
			invalidnumber: "Please enter valid numbers",
			editplayersaction: "Edit players",
			saved: "Saved",
			titleupdated: "Title updated",
			edittitleaction: "Edit title",
			confirmclosereg: "Close registration now?",
			confirmopenreg: "Reopen registration?",
			regcloseaction: "REG closed",
			regopenaction: "REG open",
			regclosedtoast: "Registration closed",
			regopentoast: "Registration opened",
			marqueeupdated: "Marquee updated",
			editmarqueeaction: "Edit marquee",
			invalidamount: "Please enter a valid amount",
			prizeupdated: "Prize pool updated",
			itmmodepctaction: "ITM mode: percentage",
			itmmodecountaction: "ITM mode: count",
			invalidpct: "Please enter a percentage between 0 and 100",
			invalidcount: "Please enter a count greater than 0",
			autoitmconfirmprefix: "Generate payouts for ",
			autoitmconfirmmiddle: " places and overwrite the current payout setup?",
			autoitmtoastprefix: "Generated smart payouts for ",
			autoitmtoastsuffix: " places",
			autoitmactionprefix: "Smart payout ",
			autoitmactionsuffix: " places",
			bubbleaction: "Bubble mode",
			bubbletoast: "🫧 Bubble mode paused the timer",
			bubbleendaction: "End bubble mode",
			bubbleendtoast: "Bubble mode ended",
			h4haction: "Hand-for-hand",
			h4htoast: "🃏 Hand-for-hand enabled",
			h4hendaction: "End hand-for-hand",
			h4hendtoast: "Hand-for-hand ended",
			finaltabletoast: "⭐ Final Table notice sent",
			coloruptoast: "🪙 Color-up in progress",
			colorupaction: "Color-up",
			settingssaved: "Settings saved",
			confirmresetall: "Reset all timer state? This cannot be undone.",
			timerreset: "Timer reset",
			linkedeliminateconfirm: "Eliminate this linked player?",
			linkedrestoreconfirm: "Restore this linked player?",
			seatlabel: "Seat:",
			namelabel: "Name:",
			signinagain: "Please sign in again",
			linkedeliminated: "Player marked eliminated",
			linkedrestored: "Player restored",
			operationfail: "Operation failed",
			networkfail: "Network unstable. Please try again.",
			prizeautoprefix: "Total payout cash · Base pool ",
			prizecarry: " + carryover $",
			prizeguarantee: " · guarantee $",
			prizeautoequals: " = $",
			prizemanualprefix: "Total payout cash · Manual pool $",
			prizeautovalue: " · Auto value $",
			itmhintprefix: "Total entries ",
			itmhintmiddle: " → Top ",
			itmhintsuffix: " places",
			itmhintwarnprefix: "\n⚠ Current payout setup pays ",
			itmhintwarnmiddle: " places — consider using Smart Prize Split to align with ",
			itmhintok: "\n✓ Payout setup matches the ITM count",
			"nocontrolpermission": "This account has no timer control permission (dealers are view-only), so the controls are disabled.",
			"otherreward": "Other Rewards"
		}
	}
	if(TRANSLATE[language]&&TRANSLATE[language]["controlpage"]&&TRANSLATE[language]["controlpage"][key]!=undefined){
		return TRANSLATE[language]["controlpage"][key]
	}
	if(extra[language]&&extra[language][key]!=undefined){
		return extra[language][key]
	}
	if(TRANSLATE["en"]&&TRANSLATE["en"]["controlpage"]&&TRANSLATE["en"]["controlpage"][key]!=undefined){
		return TRANSLATE["en"]["controlpage"][key]
	}
	if(extra["en"]&&extra["en"][key]!=undefined){
		return extra["en"][key]
	}
	return key
}

const STORAGEKEY='pokerClockState_v3'
const OLDKEY='pokerClockState_v2'

const DEFAULTSCHEDULE=[
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
]

const DEFAULTPAYOUTS=[
	{ rank: '1', pct: 0.38, color: '#cbd5e1' },
	{ rank: '2', pct: 0.22, color: '#cbd5e1' },
	{ rank: '3', pct: 0.14, color: '#cbd5e1' },
	{ rank: '4', pct: 0.10, color: '#cbd5e1' },
	{ rank: '5', pct: 0.07, color: '#cbd5e1' },
	{ rank: '6', pct: 0.05, color: '#cbd5e1' },
	{ rank: '7', pct: 0.04, color: '#cbd5e1' },
]

const DEFAULTMARQUEE=controltext("defaultmarquee")

// 智能獎金分配模板 (各 ITM 人數對應的標準曲線，數值為百分比，總和 100)
const ITMTEMPLATES={
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
}

const STATE={
	tournName: '',
	subtitle: '',
	schedule: JSON.parse(JSON.stringify(DEFAULTSCHEDULE)),
	payouts: JSON.parse(JSON.stringify(DEFAULTPAYOUTS)),
	currentIndex: 0,
	secondsLeft: DEFAULTSCHEDULE[0].dur * 60,
	running: false,
	players: 52,
	totalEntries: 52,
	startingChips: 40000,
	buyin: 500,
	fee: 50,
	defaultBreakDur: 10,
	soundOn: false,
	vibeOn: true,
	handForHand: false,
	bubbleMode: false,
	marqueeText: DEFAULTMARQUEE,
	regClosed: false,
	prizePoolMode: 'auto',  // 'auto' | 'manual'
	prizePoolManual: 26000,
	prizePoolCarryover: 0,
	guaranteedPrize: 0,
	itmMode: 'pct',         // 'pct' | 'count'
	itmPct: 15,             // 百分比 (基於總入場人數)
	itmCount: 7,            // 直接指定人數
	defaultTimebankSeconds: 15,
	timebankSoundOn: true,
	autoStartByTime: false,
	otherReward: [],
}
let actionhistory=[]

// ==== WebSocket 原生同步 (取代 localStorage + BroadcastChannel) ====
// 此版本完全靠 WebSocket + REST 跟 DB 同步, 沒有 localStorage 持久化
const SESSIONID=new URLSearchParams(location.search).get('sessionid')
if(!SESSIONID||!/^\d+$/.test(SESSIONID)){
	location.href='sessionlist.html'
}

let ws=null
let wsready=false
let applyingfromserver=false  // 防 echo loop
let wsretrytimer=null
let serverstateinited=false
let savebusy=false
let wsdownnotified=false  // 斷線提示去重, 避免重試時重複跳 toast
let controlblocked=false  // 角色無控制權限 (例如計分員) 時鎖住控制按鈕

function islinkedplayer(){
	return STATE.playerMode=="linked"
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

// ==== 倒數錨點: 用單調時鐘 performance.now() 重算, 不依賴各機牆上時鐘 ====
// 舊作法 (Date.now() - lastSyncTime) 會因各裝置時區/系統時鐘不一致而漂移; 改成
// 收到伺服器送來的 secondsLeft 當下記錄錨點, 之後純靠 performance.now() 的經過時間往下算,
// control 與各 display 因此都從同一個伺服器值起算, 顯示秒數會對齊。
let anchorSecondsLeft=STATE.secondsLeft
let anchorPerf=0
let lastTickSecond=-1
function nowperf(){
	if(typeof performance!="undefined"&&performance.now){
		return performance.now()
	}
	return Date.now()
}
function setTimerAnchor(seconds){
	anchorSecondsLeft=Math.max(0,seconds)
	anchorPerf=nowperf()
	lastTickSecond=Math.floor(anchorSecondsLeft)
}
function liveSecondsLeft(){
	if(!STATE.running){
		return STATE.secondsLeft
	}
	return Math.max(0,anchorSecondsLeft-(nowperf()-anchorPerf)/1000)
}

function applyserverstate(serverstate){
	let oldindex=STATE.currentIndex
	let oldregclosed=STATE.regClosed
	Object.assign(STATE,serverstate)
	setTimerAnchor(STATE.secondsLeft)
	if(serverstate.currentIndex!=undefined&&oldindex!=STATE.currentIndex){
		let item=STATE.schedule[STATE.currentIndex]
		if(item&&item.type=="break"){
			sndBreak()
		}else{
			sndLevelEnd()
		}
	}
	if(oldregclosed!=true&&STATE.regClosed==true){
		sndAlert()
		showToast(controltext("regclosedtoast"),"warn")
	}
	// 級別已換 (或已暫停) 就停掉歸零時的連續補抓, 不再枯等後端。
	if(oldindex!=STATE.currentIndex||!STATE.running){
		stoplevelendpoll()
	}
	// 報名 / 淘汰等更新是後端主動推播回來的; 若此刻關聯選手燈箱正開著, 就地重畫清單,
	// 不必關掉再重開才看得到新報名 (buildlinkedplayerlist 會沿用目前的搜尋條件)。
	if(domgetid("modalLinkedPlayers")&&domgetid("modalLinkedPlayers").classList.contains("show")){
		buildlinkedplayerlist()
	}
}

function iscontrolready(){
	return wsready&&serverstateinited&&!savebusy&&!controlblocked
}

function getauthtoken() {
	return weblsget(WEBLSNAME+"token")
}

function buildwsurl() {
	let proto='ws:';
	if(location.protocol == 'https:'){
		proto='wss:';
	}
	let base=location.host;
	if (base.endsWith('/')) base=base.slice(0, -1);
	let url=proto + '//' + base + WSPREFIX + 'timer/' + SESSIONID + '/';
	let token=getauthtoken();
	if (token) {
		url=url + '?token=' + encodeURIComponent(token);
	}
	return url;
}

function connectws() {
	let url=buildwsurl();
	// [control] connecting WS（除錯訊息已移除）
	try{
		ws=new WebSocket(url)
	}catch(e){
		console.error('WS create error:',e)
		return
	}

	ws.onopen=function(){
		wsready=true
		updatesyncstatus()
		loadtimerstate()
		if(wsdownnotified){
			showToast(controltext("reconnected"),"");
			wsdownnotified=false;
		}
		// [control] WS connected（除錯訊息已移除）
	}
	ws.onmessage=function(ev){
		try{
			let msg=JSON.parse(ev.data)
			if((msg.type=='init'||msg.type=='update')&&msg.state){
				if(Object.keys(msg.state).length>0){
					applyingfromserver=true
					applyserverstate(msg.state)
					serverstateinited=true
					applyingfromserver=false
					render()
					setcontrolenabled(iscontrolready())
				}
			}
		}catch(e){
			console.error('WS msg parse error:',e)
		}
	}
	ws.onclose=function(){
		wsready=false
		ws=null
		serverstateinited=false
		setcontrolenabled(false)
		updatesyncstatus()
		if(!wsdownnotified){
			showToast(controltext("connectionlost"),"err");
			wsdownnotified=true;
		}
		console.warn('[control] WS closed, retry in 3s')
		if(wsretrytimer){
			clearTimeout(wsretrytimer)
		}
		wsretrytimer=setTimeout(connectws,3000)
	}
	ws.onerror=function(e){ console.error('[control] WS error:',e) }
}

// save = 不存 localStorage, 直接 PUT 到 DB; 後端會 broadcast 回 WS group → 同步到所有 client
function save(action, partialState=null) {
	if(applyingfromserver){
		return
	}
	if(!iscontrolready()){
		showToast(controltext("syncnotready"),"err");
		updatesyncstatus()
		return
	}
	let token=getauthtoken()
	if(!token){
		console.warn('[control] save: no auth token')
		return
	}
	let payload=STATE
	if(partialState != null){
		payload=partialState
	}
	savebusy=true;
	setcontrolenabled(false);
	let loadingid=ptloadingstart("#timerCard")
	fetch(AJAXURL + 'savetimer/' + SESSIONID,{
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
		}else if(data&&data["success"]==false&&data["data"]=="ERROR_no_permission"){
			// 後端判定無控制權限 (例如計分員): 停用控制並提示, 與 loadcontrolaccess 一致
			blockcontrol()
		}
	}).catch(function(e){
		console.error('[control] save failed:',e)
	}).finally(function(){
		ptloadingend(loadingid)
		savebusy=false;
		setcontrolenabled(iscontrolready())
		updatesyncstatus()
	})
}

function broadcast(action, partialState=null) {
	// 本地操作 (調時間/重設/暫停繼續…) 先就地重設錨點, 讓自己的畫面立刻反映新值,
	// 不必等伺服器回 echo; echo 回來後 applyserverstate 會再以伺服器權威值重錨一次。
	setTimerAnchor(STATE.secondsLeft)
	save(action, partialState);
}

function loadtimerstate(silent){
	let loadingid=null
	if(!silent){
		loadingid=ptloadingstart(".layout")
	}
	// gettimer 私人場次需要帶 token 才有讀取權限; 少了它會被擋成無權限,
	// 換級別時 tick 的補抓就永遠拿不到後端已推進的狀態, 級別不會自己跳。
	let opts={}
	let token=getauthtoken()
	if(token){
		opts["headers"]={ "Authorization": "Bearer "+token }
	}
	fetch(AJAXURL+"gettimer/"+SESSIONID,opts).then(function(response){
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
	}).finally(function(){
		if(loadingid){
			ptloadingend(loadingid)
		}
	})
}

// 級別倒數歸零 → 主動用 ajax 連續向後端要新狀態, 直到後端把 currentIndex 推進為止,
// 不被動枯等 WS (時間到的換級別是後端讀取時才惰性計算, 沒有任何主動推播)。
let levelendpolltimer=null
function startlevelendpoll(){
	if(levelendpolltimer){
		return
	}
	loadtimerstate(true)
	levelendpolltimer=setInterval(function(){
		loadtimerstate(true)
	},1000)
}
function stoplevelendpoll(){
	if(levelendpolltimer){
		clearInterval(levelendpolltimer)
		levelendpolltimer=null
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

function controlpageurl(page){
	return page+"?sessionid="+encodeURIComponent(SESSIONID)
}

function setcontrollink(id,page){
	let link=domgetid(id)
	if(link){
		link.href=controlpageurl(page)
	}
}

function setlinktext(id,text){
	let link=domgetid(id)
	if(link){
		link.textContent=text
	}
}

setcontrollink("btnEditPayouts","payoutedit.html")
setcontrollink("btnViewStruct","structure.html")
setcontrollink("btnEditStruct","structureedit.html")
setcontrollink("btnTableBoard","tableboard.html")
setcontrollink("btnRegList","register.html")
setcontrollink("tableMergeHint","tableboard.html")

// Audio
let audioCtx;
function ensureAudio() {
	if(!audioCtx){
		try{
			audioCtx=new (window.AudioContext||window.webkitAudioContext)()
		}catch(e){}
	}
	if(audioCtx&&audioCtx.state=="suspended"){
		audioCtx.resume()
	}
}
function beep(freq,dur,vol,type="sine",delay=0) {
	if(!STATE.soundOn||!audioCtx){
		return
	}
	let o=audioCtx.createOscillator()
	let g=audioCtx.createGain()
	o.connect(g)
	g.connect(audioCtx.destination)
	o.type=type
	o.frequency.value=freq
	let t=audioCtx.currentTime+delay
	g.gain.setValueAtTime(0,t)
	g.gain.linearRampToValueAtTime(vol,t+0.01)
	g.gain.exponentialRampToValueAtTime(0.001,t+dur)
	o.start(t)
	o.stop(t+dur+0.05)
}
function vibe(p) {
	if(STATE.vibeOn&&navigator.vibrate){
		navigator.vibrate(p)
	}
}
function sndClick(){
	vibe(8)
}
function sndConfirm(){
	beep(660,0.08,0.25)
	vibe(15)
}
function sndAlert(){
	beep(880,0.15,0.3)
	beep(880,0.15,0.3,"sine",0.18)
	vibe([
		20,
		40,
		20
	])
}
function sndLevelEnd(){
	beep(1046,0.18,0.4)
	beep(1046,0.18,0.4,"sine",0.18)
	beep(1046,0.4,0.4,"sine",0.36)
	vibe([
		60,
		40,
		60,
		40,
		100
	])
}
function sndBreak(){
	beep(1046,0.3,0.35)
	beep(784,0.3,0.35,"sine",0.35)
	beep(523,0.5,0.35,"sine",0.7)
	vibe([
		100,
		50,
		100,
		50,
		200
	])
}

// Helpers
function fmt(n){
	return Math.round(n).toLocaleString()
}
// 與 structure.js 的 safetext 相同: 選手姓名 / 桌名等資料要先跳脫再塞 innerHTML, 防儲存型 XSS
function safetext(value){
	let text=value
	if(value==undefined||value==null){
		text=""
	}
	return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}
function fmtTime(s){
	s=Math.max(0,Math.floor(s))
	return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")
}
function parseTimeInput(str) {
	str=(str||"").trim()
	if(!str){
		return null
	}
	if(str.includes(":")){
		let part=str.split(":")
		let minute=parseInt(part[0],10)||0
		let second=parseInt(part[1],10)||0
		return minute*60+second
	}
	return parseInt(str,10)*60
}
function showToast(msg,type="") {
	let t=domgetid("toast")
	innertext(t, String(msg||""), false)
	if(type){
		t.className="toast show "+type
	}else{
		t.className="toast show"
	}
	clearTimeout(t._tm)
	t._tm=setTimeout(function(){
		removeclass(t, ["show"])
	},1800)
}
function formatactiontime(){
	let now=new Date()
	let hour=String(now.getHours()).padStart(2,'0')
	let minute=String(now.getMinutes()).padStart(2,'0')
	let second=String(now.getSeconds()).padStart(2,'0')
	return hour+':'+minute+':'+second
}
function setLastAction(s) {
	s=String(s||"")
	innertext(domgetid('lastAction'), s, false)
	actionhistory.unshift({
		text: s,
		time: formatactiontime()
	})
	if(10<actionhistory.length){
		actionhistory.length=10
	}
	renderactionhistory()
}

function applycontrolstatictext(){
	document.title=controltext("title")+" - Poker Clock"
	value(domgetid('back'), controltext("back"))
	value(domgetid('btnEditTitle'), controltext("edittitle"))
	domgetid('regBadge').title=controltext("regbadgetitle")
	innertext(domgetid('timeAdjustTitle'), controltext("timeadjust"), false)
	// innertext(domgetid('timeAdjustHint'), controltext("timeadjusthint"), false)
	innertext(domgetid('timeSetLabel'), controltext("setto"), false)
	value(domgetid('btnSetTime'), controltext("apply"))
	value(domgetid('btnResetLv'), controltext("resettime"))
	value(domgetid('btnEndLv'), controltext("enditem"))
	if(domgetid('handControlTitle')){
		innertext(domgetid('handControlTitle'), controltext("handcontroltitle"), false)
	}
	if(domgetid('btnHandReset')){
		value(domgetid('btnHandReset'), controltext("handreset"))
	}
	innertext(domgetid('levelControlTitle'), controltext("levelcontrol"), false)
	value(domgetid('btnPrevLv'), controltext("previtem"))
	value(domgetid('btnNextLv'), controltext("nextitem"))
	innertext(domgetid('jumpLevelLabel'), controltext("jumptol"), false)
	domgetid('jumpLvInput').placeholder=controltext("jumpplaceholder")
	value(domgetid('btnJumpLv'), controltext("jump"))
	innertext(domgetid('jumpLevelHint'), controltext("jumphint"), false)
	innertext(domgetid('breakControlTitle'), controltext("breakcontrol"), false)
	innertext(domgetid('breakDurationLabel'), controltext("defaultduration"), false)
	innertext(domgetid('breakMinuteUnit'), controltext("minuteunit"), false)
	innertext(domgetid('breakHint'), controltext("breakhint"), false)
	innertext(domgetid('playerManageTitle'), controltext("playermanage"), false)
	if(domgetid('tableManageTitle')){
		innertext(domgetid('tableManageTitle'), controltext("tablemanage"), false)
		innertext(domgetid('tableCountLabel'), controltext("tablecountlabel"), false)
		innertext(domgetid('tableSeatedLabel'), controltext("tableseatedlabel"), false)
		innertext(domgetid('tableAvgLabel'), controltext("tableavglabel"), false)
		innertext(domgetid('tableMergeTitle'), controltext("tablemergetitle"), false)
		innertext(domgetid('tableStatusLine'), controltext("tablelinkhint"), false)
		setlinktext('btnTableBoard', controltext("tableboardlink"))
		setlinktext('btnRegList', controltext("reglistlink"))
	}
	innertext(domgetid('totalEntriesLabel'), controltext("totalentries"), false)
	innertext(domgetid('avgChipsLabel'), controltext("avgchips"), false)
	value(domgetid('btnBust'), islinkedplayer() ? controltext("managelinkedplayers") : controltext("bust"))
	value(domgetid('btnAddEntry'), controltext("addentry"))
	value(domgetid('btnEditPlayers'), controltext("manualedit"))
	innertext(domgetid('prizeItmTitle'), controltext("prizeitm"), false)
	innertext(domgetid('cashPrizeTitle'), controltext("cashprize"), false)
	innertext(domgetid('prizeSegAuto'), controltext("auto"), false)
	innertext(domgetid('prizeSegManual'), controltext("manual"), false)
	innertext(domgetid('manualAmountLabel'), controltext("manualamount"), false)
	value(domgetid('btnSavePrize'), controltext("apply"))
	innertext(domgetid('itmSettingTitle'), controltext("itmsetting"), false)
	innertext(domgetid('itmSegPct'), controltext("pctmode"), false)
	innertext(domgetid('itmSegCount'), controltext("countmode"), false)
	domgetid('itmPctIn').setAttribute("aria-label",controltext("itmpctaria"))
	innertext(domgetid('itmCountLabel'), controltext("count"), false)
	innertext(domgetid('itmPctUnit'), controltext("count"), false)
	innertext(domgetid('itmCountUnit'), controltext("count"), false)
	value(domgetid('btnAutoITM'), controltext("smartpayout"))
	innertext(domgetid('rankPreviewTitle'), controltext("rankpreview"), false)
	innertext(domgetid('otherRewardTitle'), controltext("otherreward"), false)
	setlinktext('btnEditPayouts', controltext("editpayout"))
	innertext(domgetid('quickPresetTitle'), controltext("quickpreset"), false)
	value(domgetid('btnBubble'), controltext("bubblemode"))
	value(domgetid('btnHandForHand'), controltext("handforhand"))
	// value(domgetid('btnColorUp'), controltext("colorup"))
	innertext(domgetid('presetHint1'), controltext("presethint1"), false)
	innertext(domgetid('presetHint2'), controltext("presethint2"), false)
	innertext(domgetid('structureTitle'), controltext("structuretitle"), false)
	innertext(domgetid('structureHint'), controltext("structurehint"), false)
	setlinktext('btnViewStruct', controltext("viewstructure"))
	setlinktext('btnEditStruct', controltext("editstructure"))
	innertext(domgetid('marqueeTitle'), controltext("marquee"), false)
	domgetid('marqueeIn').placeholder=controltext("marqueeplaceholder")
	domgetid('marqueeIn').setAttribute("aria-label",controltext("marqueearia"))
	value(domgetid('btnMarqueeReset'), controltext("marqueereset"))
	innertext(domgetid('brandTitle'), controltext("brandtitle"), false)
	innertext(domgetid('brandNameLabel'), controltext("brandname"), false)
	innertext(domgetid('brandLogoLabel'), controltext("brandlogo"), false)
	innertext(domgetid('brandColorLabel'), controltext("brandcolor"), false)
	value(domgetid('btnBrandColorClear'), controltext("brandclear"))
	value(domgetid('btnBrandReload'), controltext("brandreload"))
	value(domgetid('btnBrandSave'), controltext("brandsave"))
	innertext(domgetid('brandHint'), controltext("brandhint"), false)
	updatebrandcolorhint()
	value(domgetid('btnMarqueeSave'), controltext("marqueesave"))
	innertext(domgetid('syncText'), controltext("syncok"), false)
	innertext(domgetid('lastAction'), controltext("ready"), false)
	innertext(domgetid('btnSettings'), controltext("settings"), false)
	innertext(domgetid('modalTitleLabel'), controltext("modaltitle"), false)
	innertext(domgetid('mainTitleLabel'), controltext("maintitle"), false)
	innertext(domgetid('subTitleLabel'), controltext("subtitle"), false)
	domgetid('editTsub').placeholder=controltext("subtitleplaceholder")
	value(domgetid('btnSaveTitle'), controltext("save"))
	innertext(domgetid('modalPlayersLabel'), controltext("modalplayers"), false)
	innertext(domgetid('remainingPlayersLabel'), controltext("remainingplayers"), false)
	innertext(domgetid('modalTotalEntriesLabel'), controltext("totalentries"), false)
	innertext(domgetid('startingChipsLabel'), controltext("startingchips"), false)
	value(domgetid('btnSavePlayers'), controltext("save"))
	innertext(domgetid('modalLinkedPlayersLabel'), controltext("modallinkedplayers"), false)
	innertext(domgetid('linkedPlayerSearchLabel'), controltext("search"), false)
	domgetid('linkedPlayerSearch').placeholder=controltext("playersearchplaceholder")
	innertext(domgetid('linkedTableSearchLabel'), controltext("table"), false)
	domgetid('linkedTableSearch').placeholder=controltext("tablesearchplaceholder")
	innertext(domgetid('linkedSeatSearchLabel'), controltext("seat"), false)
	innertext(domgetid('modalSettingsLabel'), controltext("modalsettings"), false)
	innertext(domgetid('buyinLabel'), controltext("buyin"), false)
	innertext(domgetid('feeLabel'), controltext("fee"), false)
	innertext(domgetid('sessionFeeHint'), controltext("sessionfeehint"), false)
	innertext(domgetid('soundLabel'), controltext("sound"), false)
	innertext(domgetid('vibrationLabel'), controltext("vibration"), false)
	innertext(domgetid('autoStartLabel'), controltext("autostart"), false)
	innertext(domgetid('timebankDefaultLabel'), controltext("timebankdefault"), false)
	innertext(domgetid('timebankSoundLabel'), controltext("timebanksound"), false)
	value(domgetid('btnReset'), controltext("resetall"))
	value(domgetid('btnSaveSettings'), controltext("save"))
}

function updatesyncstatus() {
	let dot=domgetid('syncDot')
	let text=domgetid('syncText')
	if (!dot || !text) {
		return
	}
	if (wsready) {
		removeclass(dot, ['off'])
		innertext(text, controltext("syncok"), false)
	} else {
		addclass(dot, ['off'])
		innertext(text, controltext("syncretry"), false)
	}
}

function renderactionhistory(){
	let box=domgetid('actionHistoryList')
	if(!box){
		return
	}
	if(actionhistory.length<=0){
		innerhtml(box, '<div class="history-item"><strong>'+controltext("nohistory")+'</strong><span>'+controltext("ready")+'</span></div>', false)
		return
	}
	let html=''
	for(let i=0;i<actionhistory.length;i=i+1){
		html=html+`<div class="history-item"><strong>${actionhistory[i].text}</strong><span>${actionhistory[i].time}</span></div>`
	}
	innerhtml(box, html, false)
}

function ensurecontrolworkbench(){
	let togglesection=null
	if(domgetid('btnMainToggle')){
		togglesection=domgetid('btnMainToggle').closest('.section')
	}
	if(togglesection&&!domgetid('controlGuideCard')){
		let guide=doccreate('div')
		guide.className='section'
		innerhtml(guide, `
			<details class="guide-collapse">
				<summary class="guide-summary">
					<div class="section-title mb-0">${controltext("guide")}</div>
					<div class="guide-toggle">${controltext("guidecollapse")}</div>
				</summary>
				<div class="card info-card" id="controlGuideCard">
					<div class="info-block">
						<div class="info-heading">${controltext("guideheading1")}</div>
						<div class="info-text">
							<div>${controltext("guideline1")}</div>
							<div>${controltext("guideline2")}</div>
							<div>${controltext("guideline3")}</div>
						</div>
					</div>
					<div class="info-block">
						<div class="info-heading">${controltext("guideheading2")}</div>
						<div class="info-text" id="impactSummary">
							<div>${controltext("guideimpact1")}</div>
							<div>${controltext("guideimpact2")}</div>
							<div>${controltext("guideimpact3")}</div>
						</div>
					</div>
				</div>
			</details>
		`, false)
		togglesection.insertAdjacentElement('afterend',guide)
	}
	let regsection=null
	if(domgetid('regHint')){
		regsection=domgetid('regHint').closest('.section')
	}
	if(regsection&&!domgetid('btnDangerEndLevel')){
		let danger=doccreate('div')
		danger.className='section'
		innerhtml(danger, `
			<div class="section-title">${controltext("danger")}</div>
			<div class="card danger-card">
				<div class="danger-copy">${controltext("dangercopy")}</div>
				<div class="danger-grid">
					<input type="button" class="btn btn-danger" id="btnDangerEndLevel" value="${controltext("dangerenditem")}">
					<input type="button" class="btn btn-danger" id="btnDangerRegToggle" value="${controltext("dangerregtoggle")}">
					<input type="button" class="btn btn-warn" id="btnDangerAutoItm" value="${controltext("dangerautoitm")}">
					<input type="button" class="btn btn-danger" id="btnDangerReset" value="${controltext("dangerreset")}">
				</div>
			</div>
		`, false)
		regsection.insertAdjacentElement('beforebegin',danger)
		domgetid('btnDangerEndLevel').addEventListener('click',function(){ domgetid('btnEndLv').click() })
		domgetid('btnDangerRegToggle').addEventListener('click',function(){ domgetid('regBadge').click() })
		domgetid('btnDangerAutoItm').addEventListener('click',function(){ domgetid('btnAutoITM').click() })
		domgetid('btnDangerReset').addEventListener('click',function(){ domgetid('btnReset').click() })
	}
	if(regsection&&!domgetid('actionHistoryList')){
		let history=doccreate('div')
		history.className='section'
		style(history, [["marginBottom", '70px']])
		innerhtml(history, `
			<div class="section-title">${controltext("recentactions")}</div>
			<div class="card">
				<div class="history-list" id="actionHistoryList"></div>
			</div>
		`, false)
		regsection.insertAdjacentElement('afterend',history)
	}
	renderactionhistory()
}

function controlconfirm(message,done){
	let old=domgetid("controlConfirmBox")
	if(old){
		ptremovescrollcover(old)
	}
	let box=doccreate("div")
	box.id="controlConfirmBox"
	box.className="modal-bg show"
	innerhtml(box, `
		<div class="modal">
			<div class="modal-title"><span>${controltext("confirmtitle")}</span><input type="button" class="modal-close" data-control-confirm="cancel" value="×"></div>
			<div class="whitespace-pre-line text-sm leading-relaxed text-neutral-200">${message}</div>
			<div class="mt-4 flex gap-2">
				<input type="button" class="btn btn-ghost flex-1" data-control-confirm="cancel" value="${controltext("cancel")}">
				<input type="button" class="btn btn-primary flex-1" data-control-confirm="ok" value="${controltext("confirm")}">
			</div>
		</div>
	`, false)
	ptlockpagescroll()
	document.body.appendChild(box)
	let buttons=box.querySelectorAll("[data-control-confirm]")
	for(let i=0;i<buttons.length;i=i+1){
		buttons[i].addEventListener("click",function(){
			let action=this.dataset.controlConfirm
			ptremovescrollcover(box)
			if(action=="ok"){
				done()
			}
		})
	}
}

function opencontrolmodal(modalid){
	let modal=domgetid(modalid)
	if(!modal){
		return
	}
	if(!modal.classList.contains("show")){
		ptlockpagescroll()
	}
	addclass(modal, ["show"])
}

function closecontrolmodal(modal){
	if(!modal){
		return
	}
	let opened=false
	if(modal.classList.contains("show")){
		opened=true
	}
	removeclass(modal, ["show"])
	if(opened){
		ptunlockpagescroll()
	}
}

// ==== 牌桌管理: 並桌 (掉桌) 提醒與快速連結 ====
// 以 getsessiontableboard 的各桌實際入座數計算: 剩餘選手可併到最少幾桌,
// 差額即為可掉桌數; 可掉桌數增加時跳一次提醒, 點橫幅直接跳多牌桌總覽操作並桌。
let tablemergenotified=0
function tableneededcount(tables,totalplayers){
	let capacities=[]
	for(let i=0;i<tables.length;i=i+1){
		capacities.push(parseInt(tables[i]["maxseat"],10)||9)
	}
	capacities.sort(function(a,b){ return b-a })
	let filled=0
	for(let i=0;i<capacities.length;i=i+1){
		filled=filled+capacities[i]
		if(totalplayers<=filled){
			return i+1
		}
	}
	return Math.max(1,capacities.length)
}
function rendertableinfo(data){
	if(!domgetid('tableStatTables')){
		return
	}
	let alltables=(data&&data["tables"])||[]
	// 已關閉的桌不計入牌桌數與併桌建議: 它們已在收桌流程中, 不該被當成容量、也不該被建議「掉桌」。
	// 但關閉桌上若還有人, 人數仍計入 totalplayers(這些人要併去開放桌, 需求容量要算他們)。
	let tables=[]
	for(let i=0;i<alltables.length;i=i+1){
		if(!alltables[i]["closed"]){
			tables.push(alltables[i])
		}
	}
	let tablecount=tables.length
	let totalplayers=0
	for(let i=0;i<alltables.length;i=i+1){
		totalplayers=totalplayers+(parseInt(alltables[i]["occupied"],10)||0)
	}
	let avg=0
	if(tablecount>0){
		avg=Math.round(totalplayers/tablecount*10)/10
	}
	innertext(domgetid('tableStatTables'), String(tablecount), false)
	innertext(domgetid('tableStatPlayers'), String(totalplayers), false)
	innertext(domgetid('tableStatAvg'), String(avg), false)
	let hint=domgetid('tableMergeHint')
	let statusline=domgetid('tableStatusLine')
	if(tablecount<1){
		style(hint, [["display",'none']])
		innertext(statusline, controltext("tablenotables")+" · "+controltext("tablelinkhint"), false)
		tablemergenotified=0
		return
	}
	let needed=tableneededcount(tables,totalplayers)
	let breakable=tablecount-needed
	if(breakable<1||totalplayers<1){
		style(hint, [["display",'none']])
		innertext(statusline, controltext("tablemergenone")+" · "+controltext("tablelinkhint"), false)
		tablemergenotified=0
		return
	}
	// 建議掉桌: 從人數最少的桌開始收
	let sorted=tables.slice().sort(function(a,b){
		return (parseInt(a["occupied"],10)||0)-(parseInt(b["occupied"],10)||0)
	})
	let candidates=[]
	for(let i=0;i<breakable&&i<sorted.length;i=i+1){
		candidates.push(sorted[i]["name"]||("#"+(sorted[i]["no"]||sorted[i]["id"])))
	}
	innertext(domgetid('tableMergeBody'), controltext("tablemergehintprefix")+totalplayers+controltext("tablemergehintmid1")+tablecount+controltext("tablemergehintmid2")+needed+controltext("tablemergehintmid3")+breakable+controltext("tablemergehintsuffix"), false)
	innertext(domgetid('tableMergeTables'), controltext("tablemergecandidates")+candidates.join(controltext("tablemergejoin")), false)
	style(hint, [["display",'block']])
	innertext(statusline, controltext("tablelinkhint"), false)
	if(tablemergenotified<breakable){
		sndAlert()
		showToast(controltext("tablemergetoast"),"warn")
	}
	tablemergenotified=breakable
}
function loadtableboard(){
	if(!domgetid('tableStatTables')){
		return
	}
	let token=getauthtoken()
	if(!token){
		return
	}
	fetch(AJAXURL+"getsessiontableboard/"+SESSIONID,{
		headers: { 'Authorization': 'Bearer '+token }
	}).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data["success"]){
			rendertableinfo(data["data"])
		}
	}).catch(function(error){
		console.warn("[control] getsessiontableboard failed:",error)
	})
}

// ==== 前端角色 gate: 後端 savetimer 已用 hastimercontrolpermission 強制把關,
// 這裡用 getsession 回傳的 isown / isadmin / accessrole 先行判斷 (裁判 floor 與
// 助理 assistant 可操作, 計分員 dealer 不可), 沒有控制權就直接停用控制按鈕並提示,
// 不必等按下去吃後端 403 才知道。判斷條件與 backend/api/timer.py 一致。
function blockcontrol(){
	controlblocked=true
	setcontrolenabled(false)
	if(domgetid("lastAction")){
		innertext(domgetid("lastAction"), controltext("nocontrolpermission"), false)
	}
	showToast(controltext("nocontrolpermission"),"warn")
}

function loadcontrolaccess(){
	let token=getauthtoken()
	if(!token){
		return
	}
	fetch(AJAXURL+"getsession/"+SESSIONID,{
		headers: { "Authorization": "Bearer "+token }
	}).then(function(response){
		return response.json()
	}).then(function(data){
		// fail-open: 只有完全無此場次存取權 (getsession 回 ERROR_no_permission) 才前端先鎖。
		// 不再用 accessrole 主動鎖 staff: getsession 的 accessrole 來自 getsessionstaffaccess,
		// 以 sessionstaff 優先, 會把同一人在 userstaff 的 floor/assistant 身分被 sessionstaff 的 dealer 遮蔽,
		// 而後端 hastimercontrolpermission 兩表各查會放行 floor/assistant, 前端據 accessrole 鎖會誤鎖後端允許的人。
		// 計分員等真正無控制權者交由 savetimer 回 ERROR_no_permission 時 (見 sendstate) blockcontrol 把關。
		if(data&&data["success"]==false&&data["data"]=="ERROR_no_permission"){
			blockcontrol()
		}
	}).catch(function(error){
		// 拿不到角色資訊時不擋前端 (後端仍會強制把關), 改由 save 收到 403 時停用
		console.warn("[control] getsession failed:",error)
	})
}

applycontrolstatictext()
ensurecontrolworkbench()
loadtimerstate()
connectws()
loadtableboard()
loadcontrolaccess()
setInterval(loadtableboard,20000)

function timerplayerfunction(element){
	requestedittimerplayer(element.dataset.timerPlayer,element.dataset.timerAction)
}

function buildlinkedplayerlistbase(){
	let box=domgetid('linkedPlayerList')
	if(!box){
		return
	}
	let keyword=(getvalue(domgetid('linkedPlayerSearch'))||"").toLowerCase()
	let tablefilter=""
	if(domgetid('linkedTableSearch')){
		tablefilter=(getvalue(domgetid('linkedTableSearch'))||"").toLowerCase()
	}
	let seatfilter=""
	if(domgetid('linkedSeatSearch')){
		seatfilter=String(getvalue(domgetid('linkedSeatSearch'))||"")
	}
	let list=STATE.linkedPlayers||[]
	let html=""
	for(let i=0;i<list.length;i=i+1){
		let item=list[i]
		let name=String(item["playername"]||"").toLowerCase()
		let playerid=String(item["playerplayerid"]||"").toLowerCase()
		let tablename=String(item["tablename"]||item["tabletoken"]||"").toLowerCase()
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
		let statustext=" · "+controltext("stillin")
		let buttonclass="btn btn-sm btn-danger"
		let buttonaction="eliminate"
		let buttontext=controltext("bust").replace("— ","")
		if(iseliminated){
			statustext=" · "+controltext("eliminated")
			buttonclass="btn btn-sm btn-ghost"
			buttonaction="restore"
			buttontext=controltext("restore")
		}
		html=html+`
			<div class="grid grid-cols-[1fr_150px] items-center gap-2 border-b border-neutral-900 px-3 py-2.5">
				<div>
					<div class="text-[13px] font-extrabold text-white">${safetext(item["playername"]||controltext("unnamedplayer"))}</div>
					<div class="text-[11px] text-neutral-500">${safetext(tabletext)}</div>
					<div class="text-[11px] text-neutral-600">${safetext(item["playerplayerid"]||"")}${statustext}</div>
				</div>
				<div class="flex justify-end gap-1.5">
					<input type="button" class="${buttonclass}" onclick="timerplayerfunction(this)" data-sync-free="1" data-timer-player="${safetext(item["id"])}" data-timer-action="${buttonaction}" value="${buttontext}">
				</div>
			</div>
		`
	}
	if(!html){
		html=`<div class="p-4 text-center text-[13px] text-neutral-600">${controltext("noplayers")}</div>`
	}
	innerhtml(box, html, false)

	// onclick(".timerplayerfunction",function(element,event){
	// })
}

function updatesummarycards(){
	if(!domgetid('summaryStage')){
		return
	}
	const IT=curItem()
	if(!IT){
		return
	}
	let stage='Level '+levelNumOf(STATE.currentIndex)
	if(IT.type=='break'){
		stage=controltext("breakingnow")
	}
	innertext(domgetid('summaryStage'), stage+' / '+fmtTime(STATE.secondsLeft), false)
	if(STATE.regClosed){
		innertext(domgetid('summaryReg'), '已關閉', false)
	}else{
		innertext(domgetid('summaryReg'), '開放中', false)
	}
	innertext(domgetid('summaryPlayers'), String(STATE.players)+' / '+String(STATE.totalEntries), false)
	innertext(domgetid('summaryPrize'), '$'+fmt(prizePool())+' / '+String(itmCount())+controltext("placeunit"), false)
	if(wsready){
		innertext(domgetid('summarySync'), '同步正常', false)
	}else{
		innertext(domgetid('summarySync'), '重連中', false)
	}
}

function openlinkedplayers(){
	if(!islinkedplayer()){
		return
	}
	value(domgetid('linkedPlayerSearch'), "")
	if(domgetid('linkedTableSearch')){
		value(domgetid('linkedTableSearch'), "")
	}
	if(domgetid('linkedSeatSearch')){
		value(domgetid('linkedSeatSearch'), "")
	}
	buildlinkedplayerlist()
	opencontrolmodal('modalLinkedPlayers')
}

function findlinkedplayer(timerplayerid){
	let list=STATE.linkedPlayers||[]
	for(let i=0;i<list.length;i=i+1){
		if(String(list[i]["id"])==String(timerplayerid)){
			return list[i]
		}
	}
	return null
}

function requestedittimerplayer(timerplayerid,action){
	let item=findlinkedplayer(timerplayerid)
	controlconfirm(linkedplayerconfirmmessage(item,action),function(){
		edittimerplayer(timerplayerid,action)
	})
}

function edittimerplayer(timerplayerid,action){
	let token=getauthtoken()
	if(!token){
		showToast(controltext("signinagain"),"err")
		return
	}
	let loadingid=ptloadingstart("#modalLinkedPlayers")
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
			loadtableboard()
			if(action=="eliminate"){
				showToast(controltext("linkedeliminated"))
			}else{
				showToast(controltext("linkedrestored"))
			}
		}else{
			showToast(data["data"]||controltext("operationfailed"),"err")
		}
	}).catch(function(error){
		showToast(controltext("networkfail"),"err")
	}).finally(function(){
		ptloadingend(loadingid)
	})
}

// Schedule helpers
function curItem() {
	return STATE.schedule[STATE.currentIndex]
}
function isBreakNow() {
	let it=curItem()
	return it&&it.type=="break"
}
// 手數級別: 以手數計算 (timemode=="hands")，不倒數時間。
function isHandItem(item) {
	return !!item&&item.type=="level"&&item.timemode=="hands"
}
function isHandNow() {
	return isHandItem(curItem())
}
function handTargetOf(item) {
	return parseInt(item&&item.handTargetCount,10)||0
}
function handCountOf(item) {
	return parseInt(item&&item.handCount,10)||0
}
function totalLevels() {
	let total=0
	for(let i=0;i<STATE.schedule.length;i=i+1){
		if(STATE.schedule[i].type=="level"){
			total=total+1
		}
	}
	return total
}
function levelNumOf(idx) {
	let n=0;
	for (let i=0; i <= idx; i=i+1){
		if(STATE.schedule[i].type=="level"){
			n=n+1
		}
	}
	return n;
}
function nextLevelItem(fromIdx) {
	for (let i=fromIdx + 1; i < STATE.schedule.length; i=i+1){
		if(STATE.schedule[i].type=="level"){
			return {
				idx: i,
				item: STATE.schedule[i]
			}
		}
	}
	return null;
}
function prizePool() {
	if (STATE.prizePoolMode == 'manual') return STATE.prizePoolManual;
	let pool=STATE.buyin * STATE.totalEntries;
	pool=pool+(parseFloat(STATE.prizePoolCarryover)||0);
	if(pool<(parseFloat(STATE.guaranteedPrize)||0)){
		pool=parseFloat(STATE.guaranteedPrize)||0;
	}
	return pool;
}
function payoutPercentTotal(payouts){
	let total=0;
	for(let i=0;i<payouts.length;i=i+1){
		total=total+(parseFloat(payouts[i].pct)||0);
	}
	return total;
}
function payoutRewardMoney(value){
	if(value==null||value==undefined){
		return null;
	}
	let text=String(value).replace(/,/g,'').replace(/\$/g,'').trim();
	if(text==''||!/^-?\d+(\.\d+)?$/.test(text)){
		return null;
	}
	return parseFloat(text);
}
function payoutPercentAmount(item,pool,totalpct){
	let pct=parseFloat(item.pct)||0;
	if(totalpct<=1.5){
		return Math.round(pool*pct);
	}
	return Math.round(pool*pct/100);
}
function payoutCashAmount(item,pool,totalpct){
	let cash=parseFloat(item.cash)||0;
	if(cash>0){
		return Math.round(cash);
	}
	let rewardmoney=payoutRewardMoney(item.reward);
	if(rewardmoney!=null){
		return Math.round(rewardmoney);
	}
	return payoutPercentAmount(item,pool,totalpct);
}
function payoutCashTotal(payouts,pool,totalpct){
	let total=0;
	for(let i=0;i<payouts.length;i=i+1){
		total=total+payoutCashAmount(payouts[i],pool,totalpct);
	}
	return total;
}
function payoutRewardText(item){
	let reward=String(item.reward||"").trim();
	if(reward==""||payoutRewardMoney(reward)!=null){
		return "";
	}
	return reward;
}
function payoutDisplayValue(item,amount){
	let rewardtext=payoutRewardText(item);
	let moneytext=amount>0?('$' + fmt(amount)):"";
	if(moneytext!=""&&rewardtext!=""){
		return moneytext+"+"+rewardtext;
	}
	if(moneytext!=""){
		return moneytext;
	}
	if(rewardtext!=""){
		return rewardtext;
	}
	return '$' + fmt(amount);
}

function payoutRankRange(value,index){
	let text=String(value||"").trim().replace(/[－–—]/g,"-");
	let match=text.match(/(\d+)\s*-\s*(\d+)/);
	if(match){
		let start=parseInt(match[1],10);
		let end=parseInt(match[2],10);
		if(end<start){
			let temp=start;
			start=end;
			end=temp;
		}
		return { start: start, end: end, text: start+"-"+end };
	}
	match=text.match(/\d+/);
	if(match){
		let rank=parseInt(match[0],10);
		return { start: rank, end: rank, text: String(rank) };
	}
	let fallback=index+1;
	return { start: fallback, end: fallback, text: String(fallback) };
}

function payoutRankLabel(value,index){
	return payoutRankRange(value,index).text;
}

// ITM (in-the-money) 計算
function itmCount() {
	let maxN=Math.max(1, STATE.totalEntries);
	let n;
	if (STATE.itmMode == 'count'){
		n=parseInt(STATE.itmCount, 10) || 1;
	}else{
		n=Math.round(STATE.totalEntries * (parseFloat(STATE.itmPct) || 0) / 100);
	}
	return Math.max(1, Math.min(n, maxN));
}

// 智能生成 n 人獎金分配；n <= 15 用模板，n > 15 用衰減公式
function generateSmartPayouts(n) {
	n=Math.max(1, Math.min(n, 100));
	let pcts;
	if(ITMTEMPLATES[n]){
		pcts=ITMTEMPLATES[n].slice()
	} else {
		// 大型賽事：用衰減 (top-heavy)，再 normalize 到 100
		let decay=0.82;
		let raw=[];
		let v=1;
		for (let i=0; i < n; i=i+1){
			raw.push(v);
			v=v * decay;
		}
		let sum=0;
		for(let i=0;i<raw.length;i=i+1){
			sum=sum+raw[i];
		}
		pcts=[];
		for(let i=0;i<raw.length;i=i+1){
			pcts.push(Math.round(raw[i] / sum * 1000) / 10);
		}
	}
	// 修正捨入誤差，確保總和 = 100
	let pcttotal=0;
	for(let i=0;i<pcts.length;i=i+1){
		pcttotal=pcttotal+pcts[i];
	}
	const DIFF=+(100 - pcttotal).toFixed(2);
	if (Math.abs(DIFF) > 0.001) pcts[0]=+(pcts[0] + DIFF).toFixed(2);
	let rows=[];
	for(let i=0;i<pcts.length;i=i+1){
		rows.push({
			rank: String(i + 1),
			pct: pcts[i] / 100,
			color: "#cbd5e1",
		});
	}
	return rows;
}

// Render
function renderbase() {
	let it=curItem();
	if (!it){
		return
	}
	ensurecontrolworkbench()

	if(STATE.tournName){
		innertext(domgetid('tournName'), STATE.tournName, false)
	}else{
		innertext(domgetid('tournName'), '賽事控制台', false)
	}
	if(STATE.subtitle){
		innertext(domgetid('tournSub'), STATE.subtitle, false)
	}else{
		innertext(domgetid('tournSub'), 'REFEREE CONTROL', false)
	}
	let curLvNum=levelNumOf(STATE.currentIndex);
	innertext(domgetid('hLv'), curLvNum || '—', false)
	innertext(domgetid('hLvMax'), totalLevels(), false)

	let reg=domgetid('regBadge');
	if (STATE.regClosed) {
		reg.className='reg-badge reg-closed';
		innertext(reg, 'REG CLOSED', false)
	}else{
		reg.className='reg-badge reg-open';
		innertext(reg, 'REG OPEN', false)
	}

	let tc=domgetid('timerCard'), td=domgetid('timerDisp'), ts=domgetid('timerStatus'), tl=domgetid('timerLabel'), prog=domgetid('timerProg');
	tc.className='timer-card';
	td.className='timer-display';

	let handmode=isHandItem(it);
	let totalSecs=it.dur * 60;
	let pct=0;
	if(totalSecs>0){
		pct=Math.max(0, (STATE.secondsLeft / totalSecs) * 100);
	}

	if (it.type == 'break') {
		addclass(tc, ['is-break'])
		addclass(td, ['is-break'])
		innertext(tl, '☕ BREAK', false)
		style(prog, [["background", '#fbbf24']])
		if(STATE.running){
			innertext(ts, controltext("countdownstatus"), false)
		}else{
			innertext(ts, controltext("pausedstatus"), false)
		}
	} else if (handmode) {
		// 手數級別: 顯示手數而非倒數時間, 進度條依 handCount/目標手數。
		let ln=levelNumOf(STATE.currentIndex);
		let target=handTargetOf(it);
		let count=handCountOf(it);
		innertext(tl, controltext("handlabel") + ' · LEVEL ' + ln + ' / ' + totalLevels(), false)
		pct=(target > 0) ? Math.min(100, count / target * 100) : 0;
		if (target > 0 && count >= target) {
			style(prog, [["background", '#22c55e']])
			innertext(ts, '✋ ' + controltext("handtargetreached"), false)
		} else {
			style(prog, [["background", '#3b82f6']])
			innertext(ts, controltext("handmode"), false)
		}
	} else {
		let ln=levelNumOf(STATE.currentIndex);
		innertext(tl, `LEVEL ${ln} / ${totalLevels()}`, false)
		if (STATE.secondsLeft <= 30) {
			addclass(td, ['danger'])
			style(prog, [["background", '#ef4444']])
		}else if (STATE.secondsLeft <= 60) {
			addclass(td, ['warn'])
			style(prog, [["background", '#eab308']])
		}else if (pct < 30) {
			style(prog, [["background", '#eab308']])
		}else{
			style(prog, [["background", '#22c55e']])
		}
		if(STATE.running){
			innertext(ts, controltext("runningstatus"), false)
		}else{
			innertext(ts, controltext("pausedstatus"), false)
		}
	}

	if (handmode) {
		let target=handTargetOf(it);
		let count=handCountOf(it);
		innertext(td, (target > 0) ? (count + ' / ' + target) : String(count), false)
	} else {
		innertext(td, fmtTime(STATE.secondsLeft), false)
	}
	style(prog, [["width", pct + '%']])

	if (!STATE.running && !handmode) {
		addclass(tc, ['is-paused'])
		addclass(td, ['paused'])
	}

	// 手數控制區與時間微調區互斥顯示
	if (domgetid('handControlSection')) {
		style(domgetid('handControlSection'), [["display", handmode ? 'block' : 'none']])
	}
	if (domgetid('timeAdjustSection')) {
		style(domgetid('timeAdjustSection'), [["display", handmode ? 'none' : 'block']])
	}
	if (handmode) {
		innertext(domgetid('handNum'), handCountOf(it), false)
		let target=handTargetOf(it);
		let hint=controltext("handhint");
		if (target > 0) {
			hint=controltext("handlabel") + ' ' + handCountOf(it) + ' / ' + target + ' — ' + hint;
		}
		innertext(domgetid('handHint'), hint, false)
	}

	// Blinds row
	if (it.type == 'level') {
		innertext(domgetid('curBlinds'), fmt(it.sb) + '/' + fmt(it.bb), false)
		innertext(domgetid('curAnte'), fmt(it.ante), false)
	} else {
		let next=nextLevelItem(STATE.currentIndex);
		if (next) {
			innertext(domgetid('curBlinds'), fmt(next.item.sb) + '/' + fmt(next.item.bb) + ' →', false)
			innertext(domgetid('curAnte'), fmt(next.item.ante), false)
		} else {
			innertext(domgetid('curBlinds'), '—', false)
			innertext(domgetid('curAnte'), '—', false)
		}
	}
	innertext(domgetid('curPlayers'), STATE.players, false)

	// Main toggle
	let mt=domgetid('btnMainToggle');
	if (STATE.running) {
		value(mt, controltext("mainpause"))
		mt.className='btn btn-big btn-primary';
	}else{
		value(mt, controltext("mainresume"))
		mt.className='btn btn-big btn-warn';
	}

	// Break button
	let bb=domgetid('btnBreakToggle');
	if (it.type == 'break') {
		value(bb, controltext("endbreak"))
		bb.className='btn btn-big btn-danger';
	}else{
		value(bb, controltext("insertbreak"))
		bb.className='btn btn-big btn-warn';
	}

	value(domgetid('breakDurInput'), STATE.defaultBreakDur)

	// Players
	innertext(domgetid('playerNum'), STATE.players, false)
	innertext(domgetid('metaEntries'), STATE.totalEntries, false)
	// Avg Stack：場上總計分牌 ÷ 剩餘人數。總計分牌＝起始碼 × 總入場人次（計分牌守恆），
	// 與 display 端 averagestacktotal() 一致。
	let avg=0;
	if(STATE.players>0){
		avg=Math.round(STATE.startingChips * STATE.totalEntries / STATE.players);
	}
	innertext(domgetid('metaAvg'), fmt(avg), false)
	let modehint=domgetid('playerModeHint')
	let pminus=domgetid('btnPMinus')
	let pplus=domgetid('btnPPlus')
	let addentry=domgetid('btnAddEntry')
	let editplayers=domgetid('btnEditPlayers')
	if(!modehint&&domgetid("playerManualButtons")){
		modehint=doccreate("div")
		modehint.id="playerModeHint"
		style(modehint, [["fontSize", "11px"]])
		style(modehint, [["color", "#666"]])
		style(modehint, [["marginTop", "8px"]])
		style(modehint, [["lineHeight", "1.5"]])
		domgetid("playerManualButtons").insertAdjacentElement("afterend",modehint)
	}
	if(modehint){
		if(islinkedplayer()){
			innertext(modehint, "已關聯報名選手：總入場與剩餘人數由已確認報名和淘汰狀態計算。", false)
		}else{
			innertext(modehint, "未關聯選手：人數可由控制台自由調整。", false)
		}
	}
	if(pminus){
		pminus.disabled=islinkedplayer()
		style(pminus, [["display", islinkedplayer() ? 'none' : '']])
	}
	if(pplus){
		pplus.disabled=islinkedplayer()
		style(pplus, [["display", islinkedplayer() ? 'none' : '']])
	}
	if(addentry){
		addentry.disabled=islinkedplayer()
		style(addentry, [["display", islinkedplayer() ? 'none' : '']])
	}
	if(editplayers){
		editplayers.disabled=islinkedplayer()
		style(editplayers, [["display", islinkedplayer() ? 'none' : '']])
	}
	let manualbuttons=domgetid('playerManualButtons')
	if(manualbuttons){
		manualbuttons.classList.toggle('grid-cols-1', islinkedplayer())
		manualbuttons.classList.toggle('grid-cols-3', !islinkedplayer())
	}
	let bustbutton=domgetid('btnBust')
	if(bustbutton){
		bustbutton.classList.toggle('btn-danger', !islinkedplayer())
		if(islinkedplayer()){
			value(bustbutton, controltext("managelinkedplayers"))
		}else{
			value(bustbutton, controltext("bust"))
		}
	}

	// Schedule list
	let ll=domgetid('lvlList');
	let lvlhtml="";
	for(let i=0;i<STATE.schedule.length;i=i+1){
		let it2=STATE.schedule[i];
		let isactive=i==STATE.currentIndex;
		let isdone=i<STATE.currentIndex;
		let isbreak=it2.type=="break";
		let cls="lvl-row";
		if(isbreak){
			cls=cls+" is-break-row";
		}
		if(isactive){
			cls=cls+" active";
			if(isbreak){
				cls=cls+" is-break";
			}
		}else if(isdone){
			cls=cls+" done";
		}
		let ln="☕";
		if(!isbreak){
			ln="L"+levelNumOf(i);
		}
		let blinds=controltext("breaktime");
		if(!isbreak){
			blinds=fmt(it2.sb)+"/"+fmt(it2.bb)+' <span class="text-[11px] text-neutral-600">a'+fmt(it2.ante)+"</span>";
		}
		let regPin="";
		if(it2.regCloseAfter){
			regPin='<span class="reg-pin">REG✕</span>';
		}
		let durtext=it2.dur+"m";
		if(isHandItem(it2)){
			let t=handTargetOf(it2);
			durtext='✋'+(t>0?(handCountOf(it2)+"/"+t):controltext("handlabel"));
		}
		lvlhtml=lvlhtml+`<div class="${cls}" data-jump="${i}">
			<span class="ln">${ln}</span>
			<span class="blinds">${blinds}</span>
			<span class="dur">${durtext}</span>
			<span>${regPin}</span>
		</div>`;
	}
	innerhtml(ll, lvlhtml, false);
	let levelrows=ll.querySelectorAll('.lvl-row');
	for(let i=0;i<levelrows.length;i=i+1){
		levelrows[i].addEventListener('click',function(){
			jumpTo(parseInt(this.dataset.jump, 10));
		});
	}

	// Prize pool
	const PP=prizePool();
	const PPAUTO=STATE.buyin * STATE.totalEntries;
	const PPCARRY=parseFloat(STATE.prizePoolCarryover)||0;
	const PPGUARANTEE=parseFloat(STATE.guaranteedPrize)||0;
	const PAYOUTPCTTOTAL=payoutPercentTotal(STATE.payouts||[]);
	const PAYOUTCASHTOTAL=payoutCashTotal(STATE.payouts||[],PP,PAYOUTPCTTOTAL);
	let ppAutoText=controltext("ppautoprefix") + STATE.totalEntries + ' × $' + fmt(STATE.buyin);
	if(0<PPCARRY){
		ppAutoText=ppAutoText + controltext("ppcarryprefix") + fmt(PPCARRY);
	}
	if(0<PPGUARANTEE){
		ppAutoText=ppAutoText + controltext("ppguaranteeprefix") + fmt(PPGUARANTEE);
	}
	ppAutoText=ppAutoText + ' = $' + fmt(PP);
	let prizepooltext=ppAutoText;
	if(STATE.prizePoolMode!="auto"){
		prizepooltext=controltext("ppmanualprefix") + fmt(PP) + controltext("ppautovalueprefix") + fmt(PPAUTO);
	}
	innerhtml(domgetid('prizePoolBlock'), `
		<div class="font-mono text-2xl font-black text-green-500">$${fmt(PAYOUTCASHTOTAL)}</div>
		<div class="mt-0.5 text-[11px] text-neutral-600">
			${prizepooltext}
		</div>`, false);
	domgetid('prizeSegAuto').classList.toggle('active', STATE.prizePoolMode == 'auto');
	domgetid('prizeSegManual').classList.toggle('active', STATE.prizePoolMode == 'manual');
	if(STATE.prizePoolMode == 'manual'){
		style(domgetid('prizeManualRow'), [["display", 'flex']])
	}else{
		style(domgetid('prizeManualRow'), [["display", 'none']])
	}
	if (STATE.prizePoolMode == 'manual' && document.activeElement != domgetid('prizeManualIn')){
		value(domgetid('prizeManualIn'), STATE.prizePoolManual)
	}

	// ITM section
	domgetid('itmSegPct').classList.toggle('active', STATE.itmMode == 'pct');
	domgetid('itmSegCount').classList.toggle('active', STATE.itmMode == 'count');
	if(STATE.itmMode == 'pct'){
		style(domgetid('itmPctRow'), [["display", 'flex']])
	}else{
		style(domgetid('itmPctRow'), [["display", 'none']])
	}
	if(STATE.itmMode == 'count'){
		style(domgetid('itmCountRow'), [["display", 'flex']])
	}else{
		style(domgetid('itmCountRow'), [["display", 'none']])
	}
	if (document.activeElement != domgetid('itmPctIn')){
		value(domgetid('itmPctIn'), STATE.itmPct)
	}
	if (document.activeElement != domgetid('itmCountIn')){
		value(domgetid('itmCountIn'), STATE.itmCount)
	}
	let ic=itmCount();
	let ipctVal=0;
	if(STATE.totalEntries > 0){
		ipctVal=ic / STATE.totalEntries * 100;
	}
	innertext(domgetid('itmPctResult'), ic, false)
	innertext(domgetid('itmCountResult'), ipctVal.toFixed(1), false)
	let payoutN=STATE.payouts.length;
	let hint=controltext("itmhintprefix")+STATE.totalEntries+controltext("itmhintmiddle")+ic+controltext("itmhintsuffix")+" ("+ipctVal.toFixed(1)+"%) "+controltext("itmhintitm");
	if (payoutN != ic) {
		hint +=controltext("itmhintwarnprefix")+payoutN+controltext("itmhintwarnmiddle")+ic+controltext("itmhintsuffix");
		style(domgetid('itmHint'), [["color", '#fbbf24']])
	} else {
		hint +=controltext("itmhintok");
		style(domgetid('itmHint'), [["color", '#4ade80']])
	}
	innertext(domgetid('itmHint'), hint, false)
	style(domgetid('itmHint'), [["whiteSpace", 'pre-line']])

	// Payouts list
	let raws=[];
	for(let i=0;i<STATE.payouts.length;i=i+1){
		raws.push(payoutCashAmount(STATE.payouts[i],PP,PAYOUTPCTTOTAL));
	}
	let payouthtml="";
	for(let i=0;i<STATE.payouts.length;i=i+1){
		let p=STATE.payouts[i];
		// payoutDisplayValue 可能回傳 reward 自由文字 (floor/assistant 可寫入), 進 innerhtml 前要跳脫防 XSS;
		// rank 經 payoutRankRange 已是純數字, 不需跳脫。
		payouthtml=payouthtml+`<div class="payout-row"><span>${payoutRankLabel(p.rank,i)}</span><span>${safetext(payoutDisplayValue(p,raws[i]))}</span></div>`;
	}
	innerhtml(domgetid('payoutsList'), payouthtml, false);

	// 其他獎勵: 三欄清單(自由標籤 / 獎金 / 獎品), 純記錄用, 不列入獎金總和也不參與任何結算, 空清單就整塊隱藏。
	// label 與 reward 都是主辦自由輸入的文字, 進 innerhtml 前一律 safetext 跳脫防 XSS。
	let otherrewardlist=STATE.otherReward;
	if(!Array.isArray(otherrewardlist)){
		otherrewardlist=[];
	}
	let otherrewardhtml="";
	for(let i=0;i<otherrewardlist.length;i=i+1){
		let item=otherrewardlist[i]||{};
		let cash=parseFloat(item["cash"]);
		if(isNaN(cash)){
			cash=0;
		}
		let reward=String(item["reward"]||"").trim();
		let parts=[];
		if(cash>0){
			parts.push('$'+fmt(cash));
		}
		if(reward!=""){
			parts.push(reward);
		}
		otherrewardhtml=otherrewardhtml+`<div class="payout-row"><span>${safetext(String(item["label"]||"").trim())}</span><span>${safetext(parts.join("+"))}</span></div>`;
	}
	innerhtml(domgetid('otherRewardList'), otherrewardhtml, false);
	if(otherrewardhtml==""){
		domgetid('otherRewardBlock').classList.add("hidden")
	}else{
		domgetid('otherRewardBlock').classList.remove("hidden")
	}

	// Marquee input (don't reset if user is typing)
	let ma=domgetid('marqueeIn');
	if (document.activeElement != ma){
		value(ma, STATE.marqueeText || '')
	}

	// Reg hint
	let regItems=[];
	for(let i=0;i<STATE.schedule.length;i=i+1){
		let s=STATE.schedule[i];
		if(s.regCloseAfter){
			if(s.type == 'break'){
				regItems.push(controltext("regbreakprefix") + (i + 1) + controltext("regbreaksuffix"));
			}else{
				regItems.push('L' + levelNumOf(i));
			}
		}
	}
	// 舊版 REG hint 目前停用，保留 regItems 給未來重開功能時使用。
	updatesummarycards()
	renderactionhistory()
}

// Actions
function tick() {
	if (!STATE.running) return;
	const IT=curItem();
	if (!IT) return;
	// 手數級別不倒數時間, 由裁判手動 +1/-1 手與「下一項」推進。
	if (isHandItem(IT)) return;

	let live=liveSecondsLeft();
	STATE.secondsLeft=live;
	// 歸零時的補抓要放在 cur==lastTickSecond 提早 return 之前; 否則 cur 在 live 真的到 0
	// 之前 (0.x 秒) 就先變成 0, 之後每個 tick 都被提早 return 擋掉, 補抓永遠不會啟動,
	// 後端已推進的級別拿不到, 控制台的級別就不會自己跳。
	if (live <= 0) {
		startlevelendpoll();
	} else {
		stoplevelendpoll();
	}
	let cur=Math.floor(live);
	if (cur == lastTickSecond) return;
	lastTickSecond=cur;

	if (cur == 60) { sndAlert(); showToast(controltext("oneminuteleft"), 'warn'); }
	else if (cur == 30) { sndAlert(); }
	else if (cur <= 5 && cur >= 1) { beep(880, 0.1, 0.3); vibe(10); }

	render();
}

function togglePause() {
	ensureAudio();
	STATE.running=!STATE.running;
	sndClick();
	if(STATE.running){
		setLastAction(controltext("resumeaction"));
		showToast(controltext("mainresume"));
	}else{
		setLastAction(controltext("pauseaction"));
		showToast(controltext("pausedstatus"));
	}
	broadcast('toggle');
	render();
}

function adjustTime(delta) {
	ensureAudio();
	const IT=curItem();
	const MAX=IT.dur * 60;
	STATE.secondsLeft=Math.max(0, Math.min(MAX + 600, STATE.secondsLeft + delta));
	sndClick();
	let sign='';
	if(delta>0){
		sign='+';
	}
	setLastAction(controltext("timeadjustactionprefix")+sign+delta+controltext("timeadjustactionsuffix"));
	broadcast('time-adjust');
	render();
}

function setTimeTo(secs) {
	ensureAudio();
	STATE.secondsLeft=secs;
	sndConfirm();
	setLastAction(controltext("timesetaction") + fmtTime(secs));
	broadcast('time-set');
	render();
}

function resetCurrentItem() {
	ensureAudio();
	STATE.secondsLeft=curItem().dur * 60;
	sndConfirm();
	setLastAction(controltext("timeresetaction"));
	showToast(controltext("timeresettoast"));
	broadcast('time-reset');
	render();
}

function endItemNow() {
	ensureAudio();
	controlconfirm(controltext("confirmenditem"),function(){
		if (isHandNow()) {
			nextItem();
			return;
		}
		STATE.secondsLeft=0;
		tick();
	})
}

// 手數級別: +1/-1 手, 不動時間。
function adjustHand(delta) {
	ensureAudio();
	const IT=curItem();
	if (!isHandItem(IT)) return;
	let count=handCountOf(IT) + delta;
	if (count < 0) count=0;
	IT.handCount=count;
	let target=handTargetOf(IT);
	if (delta > 0 && target > 0 && count == target) {
		sndLevelEnd();
		showToast('✋ ' + controltext("handtargetreached"), 'warn');
	} else {
		sndClick();
	}
	setLastAction(controltext("handactionprefix") + count);
	broadcast('hand-count');
	render();
}

function resetHandCount() {
	ensureAudio();
	const IT=curItem();
	if (!isHandItem(IT)) return;
	IT.handCount=0;
	sndConfirm();
	setLastAction(controltext("handactionprefix") + 0);
	broadcast('hand-count');
	render();
}

function nextItem() {
	ensureAudio();
	if (STATE.currentIndex < STATE.schedule.length - 1) {
		const PREV=curItem();
		if (PREV.regCloseAfter && !STATE.regClosed) STATE.regClosed=true;
		STATE.currentIndex=STATE.currentIndex+1;
		STATE.secondsLeft=curItem().dur * 60;
		sndConfirm();
		setLastAction(controltext("nextitemaction"));
		const IT=curItem();
		if(IT.type == 'break'){
			showToast(controltext("breakstarttoast"));
		}else{
			showToast(controltext("enterleveltoast") + levelNumOf(STATE.currentIndex));
		}
		broadcast('next-item');
		render();
	}
}

function prevItem() {
	ensureAudio();
	if (STATE.currentIndex > 0) {
		STATE.currentIndex=STATE.currentIndex-1;
		STATE.secondsLeft=curItem().dur * 60;
		sndConfirm();
		setLastAction(controltext("previtemaction"));
		const IT=curItem();
		if(IT.type == 'break'){
			showToast(controltext("backtobreaktoast"));
		}else{
			showToast(controltext("backtoleveltoast") + levelNumOf(STATE.currentIndex));
		}
		broadcast('prev-item');
		render();
	}
}

function jumpTo(idx) {
	ensureAudio();
	if (idx < 0 || idx >= STATE.schedule.length) return;
	if (idx == STATE.currentIndex) { showToast(controltext("alreadyhere")); return; }
	const IT=STATE.schedule[idx];
	let label='Level ' + levelNumOf(idx);
	if(IT.type == 'break'){
		label=controltext("breaklabel");
	}
	controlconfirm(controltext("jumptoprefix") + label + controltext("jumptosuffix"),function(){
		STATE.currentIndex=idx;
		STATE.secondsLeft=IT.dur * 60;
		sndConfirm();
		setLastAction(controltext("jumpactionprefix") + label);
		showToast(controltext("jumpedprefix") + label);
		broadcast('jump');
		render();
	})
}

// Jump to a level number (1-indexed, only counting levels)
function jumpToLevelNum(num) {
	let count=0;
	for (let i=0; i < STATE.schedule.length; i=i+1) {
		if (STATE.schedule[i].type == 'level') {
			count=count+1;
			if (count == num) { jumpTo(i); return; }
		}
	}
	showToast(controltext("levelnotfound"), 'err');
}

function toggleBreak() {
	ensureAudio();
	const IT=curItem();
	if (IT.type == 'break') {
		controlconfirm(controltext("confirmendbreak"),function(){
			if (STATE.currentIndex < STATE.schedule.length - 1) {
				STATE.currentIndex=STATE.currentIndex+1;
				STATE.secondsLeft=curItem().dur * 60;
			}
			sndConfirm();
			setLastAction(controltext("endbreakaction"));
			showToast(controltext("endbreaktoast"));
			broadcast('break-toggle');
			render();
		})
		return
	} else {
		// Insert a break right after current and jump to it
		const DUR=STATE.defaultBreakDur || 10;
		STATE.schedule.splice(STATE.currentIndex + 1, 0, { "type": "break", "dur": DUR });
		STATE.currentIndex=STATE.currentIndex+1;
		STATE.secondsLeft=DUR * 60;
		STATE.running=true;
		sndBreak();
		setLastAction(controltext("insertbreakaction"));
		showToast(controltext("breakminuteprefix")+DUR+controltext("breakminutesuffix"), 'warn');
	}
	broadcast('break-toggle');
	render();
}

// 原本這裡是先讓 base 產生中文 HTML，再對整段 HTML 做 replaceAll 反查。
// 那個做法很脆弱：選手名字只要含有「仍在場」「已淘汰」這些字就會被一起換掉，
// 而且 value="淘汰" 那兩條是直接在 HTML 字串上動屬性。改成 base 產生時就用
// controltext()，這層包裝已無存在必要。
function buildlinkedplayerlist(){
	buildlinkedplayerlistbase()
}

function linkedplayerconfirmmessage(item,action){
	let playername=controltext("unnamedplayer")
	if(item&&item["playername"]){
		playername=item["playername"]
	}
	if(action=="eliminate"){
		let tablename="-"
		if(item&&item["tablename"]){
			tablename=item["tablename"]
		}else if(item&&item["tabletoken"]){
			tablename=item["tabletoken"]
		}
		let seatno="-"
		if(item&&item["seatno"]){
			seatno=item["seatno"]
		}
		// controlconfirm 會把訊息塞 innerHTML, 選手姓名 / 桌名 / 座位要先跳脫
		return controltext("linkedeliminateconfirm")+"\n\n"+controltext("seatlabel")+safetext(tablename)+" / Seat "+safetext(seatno)+"\n"+controltext("namelabel")+safetext(playername)
	}
	return controltext("linkedrestoreconfirm")+"\n\n"+controltext("namelabel")+safetext(playername)
}

function applycontrolruntimecopy(){
	if(domgetid("tournName")&&!STATE.tournName){
		innertext(domgetid("tournName"), controltext("heading"), false)
	}
	// 計時器狀態與兩顆主按鈕的文字都由 render() 依當下狀態決定，現在那些設定點已直接
	// 走 controltext()，所以重新算繪一次就會是新語系。
	//
	// 原本這裡是讀回 DOM 上的文字再丟進 controlmessage() 反查 —— 那個做法只在
	// 「中文 → 英文」的第一次有效：切成英文後 DOM 上是英文，再切回中文時
	// controlmessage() 用中文當 key 比對不到，文字就永遠卡在英文。
	//
	// **2026-07-30 修正無限遞迴**：這裡原本寫 `if(typeof render=="function"){ render() }`，
	// 但 render() 的本體就是 renderbase() + applycontrolruntimecopy()，等於
	// render → applycontrolruntimecopy → render 無條件互相呼叫。`typeof render=="function"`
	// 永遠成立，所以不是防呆而是遞迴的起點。control.js 結尾（第 2979 行）有一個頂層的
	// `render();`，頁面一載入就會 RangeError: Maximum call stack size exceeded，
	// 後面的品牌設定載入也一起不會執行。node --check 不會抓到這種錯，
	// 是 tools/audit/scanruntimeload.js 用沙箱實際執行才發現的。
	//
	// 不需要在這裡重新算繪：applycontrolruntimecopy() 只有 render() 會呼叫
	// （全專案 grep 過，沒有其他呼叫點），而 render() 在進來之前已經跑完 renderbase()，
	// 上面那段註解想要的「重新算繪一次」已經發生了。
	if(domgetid("playerModeHint")){
		if(islinkedplayer()){
			innertext(domgetid("playerModeHint"), controltext("playerlinkedhint"), false)
		}else{
			innertext(domgetid("playerModeHint"), controltext("playermanualhint"), false)
		}
	}
	if(domgetid("curBlinds")&&isBreakNow()){
		innertext(domgetid("curBlinds"), controltext("breaktime"), false)
	}
	if(domgetid("prizePoolBlock")){
		let pp=prizePool()
		let ppAuto=STATE.buyin*STATE.totalEntries
		let ppCarry=parseFloat(STATE.prizePoolCarryover)||0
		let ppGuarantee=parseFloat(STATE.guaranteedPrize)||0
		let payoutpcttotal=payoutPercentTotal(STATE.payouts||[])
		let payoutcashtotal=payoutCashTotal(STATE.payouts||[],pp,payoutpcttotal)
		let prizepooltext=controltext("prizeautoprefix")+STATE.totalEntries+" × $"+fmt(STATE.buyin)
		if(0<ppCarry){
			prizepooltext=prizepooltext+controltext("prizecarry")+fmt(ppCarry)
		}
		if(0<ppGuarantee){
			prizepooltext=prizepooltext+controltext("prizeguarantee")+fmt(ppGuarantee)
		}
		prizepooltext=prizepooltext+controltext("prizeautoequals")+fmt(pp)
		if(STATE.prizePoolMode!="auto"){
			prizepooltext=controltext("prizemanualprefix")+fmt(pp)+controltext("prizeautovalue")+fmt(ppAuto)
		}
		innerhtml(domgetid("prizePoolBlock"), `<div class="font-mono text-2xl font-black text-green-500">$${fmt(payoutcashtotal)}</div><div class="mt-0.5 text-[11px] text-neutral-600">${prizepooltext}</div>`, false)
	}
	if(domgetid("itmHint")){
		let ic=itmCount()
		let ipctVal=0
		if(STATE.totalEntries>0){
			ipctVal=ic/STATE.totalEntries*100
		}
		let payoutN=STATE.payouts.length
		let hint=controltext("itmhintprefix")+STATE.totalEntries+controltext("itmhintmiddle")+ic+controltext("itmhintsuffix")+" ("+ipctVal.toFixed(1)+"%)"
		if(payoutN!=ic){
			hint=hint+controltext("itmhintwarnprefix")+payoutN+controltext("itmhintwarnmiddle")+ic+controltext("itmhintsuffix")
		}else{
			hint=hint+controltext("itmhintok")
		}
		innertext(domgetid("itmHint"), hint, false)
	}
}

function render(){
	renderbase()
	applycontrolruntimecopy()
}

// Bindings
domgetid('btnMainToggle').addEventListener('click', togglePause);
let timebuttons=document.querySelectorAll('[data-time]');
for(let i=0;i<timebuttons.length;i=i+1){
	timebuttons[i].addEventListener('click',function(){
		adjustTime(parseInt(this.dataset.time, 10));
	});
}
let breaktimebuttons=document.querySelectorAll('[data-break-time]');
for(let i=0;i<breaktimebuttons.length;i=i+1){
	breaktimebuttons[i].addEventListener('click',function(){
		let d=parseInt(this.dataset.breakTime, 10);
		if (isBreakNow()){
			adjustTime(d);
		}else{
			showToast(controltext("breakadjustinvalid"), 'warn');
		}
	});
}

domgetid('btnSetTime').addEventListener('click', function(){
	let v=parseTimeInput(getvalue(domgetid('timeSetInput')));
	if (v == null || isNaN(v)) {
		showToast(controltext("invalidtime"), 'err');
		return;
	}
	setTimeTo(v);
	value(domgetid('timeSetInput'), '')
});
onenterclick("#timeSetInput",function(){ click("#btnSetTime") })
domgetid('btnResetLv').addEventListener('click', resetCurrentItem);
domgetid('btnEndLv').addEventListener('click', endItemNow);
if(domgetid('btnHandPlus')){
	domgetid('btnHandPlus').addEventListener('click', function(){ adjustHand(1); });
}
if(domgetid('btnHandMinus')){
	domgetid('btnHandMinus').addEventListener('click', function(){ adjustHand(-1); });
}
if(domgetid('btnHandReset')){
	domgetid('btnHandReset').addEventListener('click', resetHandCount);
}
domgetid('btnPrevLv').addEventListener('click', prevItem);
domgetid('btnNextLv').addEventListener('click', nextItem);
domgetid('btnJumpLv').addEventListener('click', function(){
	let v=parseInt(getvalue(domgetid('jumpLvInput')), 10);
	if (isNaN(v)) {
		showToast(controltext("invalidlevel"), 'err');
		return;
	}
	jumpToLevelNum(v);
	value(domgetid('jumpLvInput'), '')
});
onenterclick("#jumpLvInput",function(){ click("#btnJumpLv") })
domgetid('btnBreakToggle').addEventListener('click', toggleBreak);
domgetid('breakDurInput').addEventListener('change', function(){
	let v=parseInt(getvalue(domgetid('breakDurInput')), 10);
	if (!isNaN(v) && v >= 1) {
		STATE.defaultBreakDur=v;
		sndClick();
		broadcast('default-break');
	}
});

// Players
domgetid('btnPMinus').addEventListener('click', function(){
	ensureAudio();
	if (STATE.players > 0) {
		STATE.players=STATE.players-1;
		sndClick();
		setLastAction(controltext("playersleftprefix") + STATE.players);
		broadcast('player-change');
		render();
	}
});
domgetid('btnPPlus').addEventListener('click', function(){
	ensureAudio();
	STATE.players=STATE.players+1;
	sndClick();
	setLastAction(controltext("playersleftprefix") + STATE.players);
	broadcast('player-change');
	render();
});
domgetid('btnBust').addEventListener('click', function(){
	if(islinkedplayer()){
		openlinkedplayers();
		return;
	}
	ensureAudio();
	if (STATE.players <= 1) {
		showToast(controltext("lastplayer"), 'warn');
		return;
	}
	STATE.players=STATE.players-1;
	sndConfirm();
	setLastAction(controltext("bustactionprefix") + STATE.players + ')');
	showToast(controltext("playersleftprefix")+STATE.players+controltext("playersleftsuffix"));
	broadcast('bust', { players: STATE.players });
	render();
});
domgetid('btnAddEntry').addEventListener('click', function(){
	if(islinkedplayer()){
		openlinkedplayers();
		return;
	}
	ensureAudio();
	if (STATE.regClosed) {
		showToast(controltext("confirmjoinafterclose"), 'warn');
	}
	STATE.players=STATE.players+1;
	STATE.totalEntries=STATE.totalEntries+1;
	sndConfirm();
	setLastAction(controltext("addentryaction"));
	showToast(controltext("addentrytoastprefix") + STATE.totalEntries + controltext("addentrytoastsuffix"));
	broadcast('add-entry', { players: STATE.players, totalEntries: STATE.totalEntries });
	render();
});
domgetid('btnEditPlayers').addEventListener('click', function(){
	if(islinkedplayer()){
		openlinkedplayers();
		return;
	}
	value(domgetid('editPlayersIn'), STATE.players)
	value(domgetid('editEntriesIn'), STATE.totalEntries)
	value(domgetid('editChipsIn'), STATE.startingChips)
	opencontrolmodal('modalPlayers')
});
domgetid('btnSavePlayers').addEventListener('click', function(){
	let p=parseInt(getvalue(domgetid('editPlayersIn')), 10);
	let e=parseInt(getvalue(domgetid('editEntriesIn')), 10);
	let c=parseInt(getvalue(domgetid('editChipsIn')), 10);
	if (isNaN(p) || isNaN(e) || isNaN(c)) {
		showToast(controltext("invalidnumber"), 'err');
		return;
	}
	STATE.players=Math.max(0, p);
	STATE.totalEntries=Math.max(STATE.players, e);
	STATE.startingChips=Math.max(100, c);
	sndConfirm();
	setLastAction(controltext("editplayersaction"));
	showToast(controltext("saved"));
	broadcast('players-edit', { players: STATE.players, totalEntries: STATE.totalEntries, startingChips: STATE.startingChips });
	render();
	closecontrolmodal(domgetid('modalPlayers'))
});
onenterclick("#editPlayersIn,#editEntriesIn,#editChipsIn",function(){ click("#btnSavePlayers") })
if(domgetid('linkedPlayerSearch')){
	domgetid('linkedPlayerSearch').addEventListener('input',buildlinkedplayerlist);
}
if(domgetid('linkedTableSearch')){
	domgetid('linkedTableSearch').addEventListener('input',buildlinkedplayerlist);
}
if(domgetid('linkedSeatSearch')){
	domgetid('linkedSeatSearch').addEventListener('input',buildlinkedplayerlist);
}

// Title
domgetid('btnEditTitle').addEventListener('click', function(){
	value(domgetid('editTname'), STATE.tournName)
	value(domgetid('editTsub'), STATE.subtitle || '')
	opencontrolmodal('modalTitle')
});
domgetid('titleBlock').addEventListener('click', function(){
	domgetid('btnEditTitle').click();
});
domgetid('btnSaveTitle').addEventListener('click', function(){
	STATE.tournName=getvalue(domgetid('editTname')) || STATE.tournName;
	STATE.subtitle=getvalue(domgetid('editTsub')) || '';
	sndConfirm();
	showToast(controltext("titleupdated"));
	setLastAction(controltext("edittitleaction"));
	broadcast('title', { tournName: STATE.tournName, subtitle: STATE.subtitle });
	render();
	closecontrolmodal(domgetid('modalTitle'))
});
onenterclick("#editTname,#editTsub",function(){ click("#btnSaveTitle") })

// Reg badge click toggle
domgetid('regBadge').addEventListener('click', function(){
	let confirmtext=controltext("confirmclosereg");
	if(STATE.regClosed){
		confirmtext=controltext("confirmopenreg");
	}
	controlconfirm(confirmtext,function(){
		STATE.regClosed=!STATE.regClosed;
		sndConfirm();
		if(STATE.regClosed){
			setLastAction(controltext("regcloseaction"));
			showToast(controltext("regclosedtoast"));
		}else{
			setLastAction(controltext("regopenaction"));
			showToast(controltext("regopentoast"));
		}
		broadcast('reg-toggle', { regClosed: STATE.regClosed });
		render();
	})
});
// 舊版 REG 設定入口保留參考，目前畫面已隱藏。
// domgetid('btnRegToggle').addEventListener('click', function(){
// 	domgetid('regBadge').click()
// })
// domgetid('btnRegEdit').addEventListener('click', function(){
// 	buildRegPickList();
// 	domgetid('modalReg').classList.add('show');
// });
function buildRegPickList() {
	let html="";
	for(let i=0;i<STATE.schedule.length;i=i+1){
		let s=STATE.schedule[i];
		let lab='L' + levelNumOf(i) + ' — ' + fmt(s.sb) + '/' + fmt(s.bb);
		let color="#fff";
		let checked="";
		if(s.type == 'break'){
			lab=controltext("breakhashprefix") + (i + 1) + ' (' + s.dur + 'm)';
			color="#fbbf24";
		}
		if(s.regCloseAfter){
			checked="checked";
		}
		let labelclass="text-white";
		if(color=="#fbbf24"){
			labelclass="text-amber-400";
		}
		html=html+`<div class="flex items-center justify-between border-b border-neutral-900 px-3 py-2.5 text-[13px]">
			<span class="${labelclass}">${lab}</span>
			<input type="checkbox" class="h-5 w-5" data-reg-i="${i}" ${checked}>
		</div>`;
	}
	innerhtml(domgetid('regPickList'), html, false);
}
// domgetid('btnRegClear').addEventListener('click', function(){
// 	for(let i=0;i<state.schedule.length;i=i+1){
// 		delete state.schedule[i].regCloseAfter;
// 	}
// 	buildRegPickList();
// });
// domgetid('btnRegDone').addEventListener('click', function(){
// 	let regchecks=document.querySelectorAll('[data-reg-i]');
// 	for(let x=0;x<regchecks.length;x=x+1){
// 		let cb=regchecks[x];
// 		let i = parseInt(cb.dataset.regI, 10);
// 		if (cb.checked) state.schedule[i].regCloseAfter = true;
// 		else delete state.schedule[i].regCloseAfter;
// 	}
// 	sndConfirm(); showToast('觸發點已更新');
// 	broadcast('reg-config'); render();
// 	domgetid('modalReg').classList.remove('show');
// });

// Marquee
/* ── 大螢幕品牌現場微調 (TASK-025) ────────────────────────────────────────
   品牌設定存在 session 表, 寫入端點是 editsessionsettings, 與場次設定頁(TASK-024)
   完全同一條路徑; 刻意不走 savetimer/broadcast, 因為那條寫的是 sessiontimerconfig,
   一個概念留兩條寫入路徑遲早會互相覆蓋。
   儲存後 display 端會在既有的 gettimer 輪詢週期內取到新值(FR-9)。
   ──────────────────────────────────────────────────────────────────────── */

// 與 session.js 的 displaycontrastratio 同一套算法: 主色對大螢幕底色 #0d0d0d 的 WCAG 對比。
// 兩處各有一份是刻意的 — control.js 不載入 session.js, 而共用檔 initialize.js 是全站載入,
// 為了兩個頁面把一支只有大螢幕會用到的函式塞進去並不划算。
// TASK-052：實作收攏到 initialize.js 的 ptcontrastratio()，這裡只留頁面自己的名字
function brandcontrastratio(hex){
	return ptcontrastratio(hex)
}

function updatebrandcolorhint(){
	let hint=domgetid('brandColorHint')
	if(!hint){
		return
	}
	let color=getvalue(domgetid('brandColorIn'))||""
	if(color==""){
		hint.textContent=controltext("brandcolordefault")
		hint.className="mt-1 text-[11px] leading-normal text-neutral-500"
	}else{
		let ratio=brandcontrastratio(color)
		if(ratio<3){
			hint.textContent=controltext("brandcolorlow")+" ("+ratio.toFixed(1)+":1)"
			hint.className="mt-1 text-[11px] font-extrabold leading-normal text-red-400"
		}else if(ratio<4.5){
			hint.textContent=controltext("brandcolormid")+" ("+ratio.toFixed(1)+":1)"
			hint.className="mt-1 text-[11px] font-extrabold leading-normal text-amber-400"
		}else{
			hint.textContent=controltext("brandcolorok")+" ("+ratio.toFixed(1)+":1)"
			hint.className="mt-1 text-[11px] leading-normal text-green-400"
		}
	}
}

// 從 session 讀回目前值。兩套 UI 對同一份資料, 進來就重讀一次才不會顯示舊值。
function loadbrandsetting(){
	fetch(AJAXURL+"getsession/"+SESSIONID,{
		headers: {"Authorization": "Bearer "+weblsget(WEBLSNAME+"token")}
	}).then(function(response){
		return response.json()
	}).then(function(data){
		if(!data||data["success"]!=true||!data["data"]){
			return
		}
		let row=data["data"]
		value(domgetid('brandNameIn'),row["brandname"]||"")
		value(domgetid('brandLogoIn'),row["brandlogo"]||"")
		value(domgetid('brandColorIn'),row["brandcolor"]||"")
		value(domgetid('brandColorPick'),row["brandcolor"]||"#4ade80")
		updatebrandcolorhint()
	}).catch(function(error){
		// 讀不到就維持畫面上的值, 不打斷現場其他操作
	})
}

function savebrandsetting(){
	let payload={
		"brandname": getvalue(domgetid('brandNameIn'))||"",
		"brandlogo": getvalue(domgetid('brandLogoIn'))||"",
		"brandcolor": getvalue(domgetid('brandColorIn'))||""
	}
	fetch(AJAXURL+"editsessionsettings/"+SESSIONID,{
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer "+weblsget(WEBLSNAME+"token")
		},
		body: JSON.stringify(payload)
	}).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data["success"]==true){
			sndConfirm()
			showToast(controltext("brandsaved"))
			setLastAction(controltext("brandaction"))
			// 後端會把不合法的值正規化成空字串, 重讀才看得到真正存進去的內容
			loadbrandsetting()
		}else{
			showToast(controltext("brandsavefailed"))
		}
	}).catch(function(error){
		showToast(controltext("brandsavefailed"))
	})
}

domgetid('brandColorIn').addEventListener('input', function(){
	let color=getvalue(domgetid('brandColorIn'))
	if(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)){
		value(domgetid('brandColorPick'),color)
	}
	updatebrandcolorhint()
})
domgetid('brandColorPick').addEventListener('change', function(){
	value(domgetid('brandColorIn'),domgetid('brandColorPick').value)
	updatebrandcolorhint()
})
domgetid('btnBrandColorClear').addEventListener('click', function(){
	value(domgetid('brandColorIn'),"")
	updatebrandcolorhint()
})
domgetid('btnBrandReload').addEventListener('click', function(){
	loadbrandsetting()
	showToast(controltext("brandreloaded"))
})
domgetid('btnBrandSave').addEventListener('click', savebrandsetting)

domgetid('btnMarqueeSave').addEventListener('click', function(){
	STATE.marqueeText=getvalue(domgetid('marqueeIn'));
	sndConfirm();
	showToast(controltext("marqueeupdated"));
	setLastAction(controltext("editmarqueeaction"));
	broadcast('marquee');
	render();
});
domgetid('btnMarqueeReset').addEventListener('click', function(){
	value(domgetid('marqueeIn'), DEFAULTMARQUEE)
	STATE.marqueeText=DEFAULTMARQUEE
	sndConfirm();
	broadcast('marquee');
	render();
});

// Prize pool — 只抓 [data-mode] 的 seg，避免和 ITM 模式按鈕衝突
let prizemodes=document.querySelectorAll('[data-mode]');
for(let i=0;i<prizemodes.length;i=i+1){
	prizemodes[i].addEventListener('click',function(){
		STATE.prizePoolMode=this.dataset.mode;
		if (STATE.prizePoolMode == 'manual' && !STATE.prizePoolManual) {
			STATE.prizePoolManual=STATE.buyin * STATE.totalEntries;
		}
		sndClick();
		broadcast('prize-mode');
		render();
	});
}
domgetid('btnSavePrize').addEventListener('click', function(){
	let v=parseInt(getvalue(domgetid('prizeManualIn')), 10);
	if (isNaN(v) || v < 0) {
		showToast(controltext("invalidamount"), 'err');
		return;
	}
	STATE.prizePoolManual=v;
	sndConfirm();
	showToast(controltext("prizeupdated"));
	broadcast('prize-amount');
	render();
});
onenterclick("#prizeManualIn",function(){ click("#btnSavePrize") })

// ITM 模式切換
let itmmodes=document.querySelectorAll('[data-itm-mode]');
for(let i=0;i<itmmodes.length;i=i+1){
	itmmodes[i].addEventListener('click',function(){
		STATE.itmMode=this.dataset.itmMode;
		sndClick();
		if(STATE.itmMode == 'pct'){
			setLastAction(controltext("itmmodepctaction"));
		}else{
			setLastAction(controltext("itmmodecountaction"));
		}
		broadcast('itm-mode');
		render();
	});
}
// ITM 百分比輸入
domgetid('itmPctIn').addEventListener('change', function(){
	let v=parseFloat(getvalue(domgetid('itmPctIn')));
	if (isNaN(v) || v <= 0 || v > 100) {
		showToast(controltext("invalidpct"), 'err');
		return;
	}
	STATE.itmPct=v;
	sndConfirm();
	broadcast('itm-pct');
	render();
});
domgetid('itmPctIn').addEventListener('input', function(){
	let v=parseFloat(getvalue(domgetid('itmPctIn')));
	if (!isNaN(v) && v > 0 && v <= 100) {
		let c=Math.max(1, Math.round(STATE.totalEntries * v / 100));
		innertext(domgetid('itmPctResult'), c, false)
	}
});
// ITM 人數輸入
domgetid('itmCountIn').addEventListener('change', function(){
	let v=parseInt(getvalue(domgetid('itmCountIn')), 10);
	if (isNaN(v) || v <= 0) {
		showToast(controltext("invalidcount"), 'err');
		return;
	}
	STATE.itmCount=Math.min(v, STATE.totalEntries);
	sndConfirm();
	broadcast('itm-count');
	render();
});
domgetid('itmCountIn').addEventListener('input', function(){
	let v=parseInt(getvalue(domgetid('itmCountIn')), 10);
	if (!isNaN(v) && v > 0 && STATE.totalEntries > 0) {
		innertext(domgetid('itmCountResult'), (v / STATE.totalEntries * 100).toFixed(1), false)
	}
});
// 智能分配獎金
domgetid('btnAutoITM').addEventListener('click', function(){
	ensureAudio();
	let n=itmCount();
	controlconfirm(controltext("autopayoutprefix")+n+controltext("autopayoutsuffix"),function(){
		STATE.payouts=generateSmartPayouts(n);
		sndConfirm();
		showToast(controltext("autoitmtoastprefix")+n+controltext("autoitmtoastsuffix"), 'warn');
		setLastAction(controltext("autoitmactionprefix")+n+controltext("autoitmactionsuffix"));
		broadcast('auto-itm');
		render();
	})
});

// Presets
domgetid('btnBubble').addEventListener('click', function(){
	ensureAudio();
	STATE.bubbleMode=!STATE.bubbleMode;
	STATE.running=false;
	sndAlert();
	if(STATE.bubbleMode){
		setLastAction(controltext("bubbleaction"));
		showToast(controltext("bubbletoast"), 'warn');
	}else{
		setLastAction(controltext("bubbleendaction"));
		showToast(controltext("bubbleendtoast"), 'warn');
	}
	broadcast('bubble');
	render();
});
domgetid('btnHandForHand').addEventListener('click', function(){
	ensureAudio();
	STATE.handForHand=!STATE.handForHand;
	STATE.running=false;
	sndAlert();
	if(STATE.handForHand){
		setLastAction(controltext("h4haction"));
		showToast(controltext("h4htoast"), 'warn');
	}else{
		setLastAction(controltext("h4hendaction"));
		showToast(controltext("h4hendtoast"), 'warn');
	}
	broadcast('h4h');
	render();
});
// domgetid('btnFinalTable').addEventListener('click', function(){
// 	ensureAudio();
// 	showToast(controltext("finaltabletoast"));
// 	sndAlert();
// 	setLastAction('Final Table');
// 	broadcast('final-table');
// });
// domgetid('btnColorUp').addEventListener('click', function(){
// 	ensureAudio();
// 	showToast(controltext("coloruptoast"), 'warn');
// 	sndBreak();
// 	setLastAction(controltext("colorupaction"));
// 	broadcast('color-up');
// });

// Settings
domgetid('btnSettings').addEventListener('click', function(){
	value(domgetid('setBuyin'), '$' + fmt(STATE.buyin))
	value(domgetid('setFee'), '$' + fmt(STATE.fee))
	// <select> 不能用 value(domgetid(...)) — select.length 會讓 helper 走 forEach 分支而丟錯，
	// 改用字串選擇器 "#id"（走 querySelectorAll，NodeList 才有 forEach）。雙引號優先。
	if(STATE.soundOn){
		value("#setSound", "1")
	}else{
		value("#setSound", "0")
	}
	if(STATE.vibeOn){
		value("#setVibe", "1")
	}else{
		value("#setVibe", "0")
	}
	if(STATE.autoStartByTime){
		value("#setAutoStart", "1")
	}else{
		value("#setAutoStart", "0")
	}
	value(domgetid('setDefaultTimebank'), STATE.defaultTimebankSeconds || 15)
	if(STATE.timebankSoundOn){
		value("#setTimebankSound", "1")
	}else{
		value("#setTimebankSound", "0")
	}
	opencontrolmodal('modalSettings')
});
domgetid('btnSaveSettings').addEventListener('click', function(){
	// <select> 讀值同理：用裸 id（走 getElementById 回傳字串），不要傳 domgetid 元素或 "#id"（會回陣列）
	STATE.soundOn=getvalue("setSound") == "1";
	STATE.vibeOn=getvalue("setVibe") == "1";
	STATE.autoStartByTime=getvalue("setAutoStart") == "1";
	STATE.defaultTimebankSeconds=Math.max(1, parseInt(getvalue(domgetid('setDefaultTimebank')), 10) || 15);
	STATE.timebankSoundOn=getvalue("setTimebankSound") == "1";
	sndConfirm();
	showToast(controltext("settingssaved"));
	broadcast('settings');
	render();
	closecontrolmodal(domgetid('modalSettings'))
});
onenterclick("#setDefaultTimebank",function(){ click("#btnSaveSettings") })
domgetid('btnReset').addEventListener('click', function(){
	controlconfirm(controltext("confirmresetall"),function(){
		weblsset(STORAGEKEY,null)
		weblsset(OLDKEY,null)
		let sessionbuyin=STATE.buyin;
		let sessionfee=STATE.fee;
		Object.assign(STATE,{
			tournName: '',
			subtitle: '',
			schedule: JSON.parse(JSON.stringify(DEFAULTSCHEDULE)),
			payouts: JSON.parse(JSON.stringify(DEFAULTPAYOUTS)),
			currentIndex: 0,
			secondsLeft: DEFAULTSCHEDULE[0].dur * 60,
			running: false,
			players: 52,
			totalEntries: 52,
			startingChips: 40000,
			buyin: sessionbuyin,
			fee: sessionfee,
			defaultBreakDur: 10,
			soundOn: false,
			vibeOn: true,
			handForHand: false,
			bubbleMode: false,
			marqueeText: DEFAULTMARQUEE,
			regClosed: false,
			prizePoolMode: 'auto',
			prizePoolManual: sessionbuyin*52,
			prizePoolCarryover: 0,
			guaranteedPrize: 0,
			itmMode: 'pct',
			itmPct: 15,
			itmCount: 7,
			defaultTimebankSeconds: 15,
			timebankSoundOn: true,
			autoStartByTime: false,
			otherReward: []
		});
		sndConfirm();
		showToast(controltext("timerreset"));
		broadcast('reset');
		render();
	})
});

// Modal close
let closebuttons=document.querySelectorAll('[data-close]');
for(let i=0;i<closebuttons.length;i=i+1){
	closebuttons[i].addEventListener('click',function(){
		closecontrolmodal(domgetid(this.dataset.close))
	});
}
let modalbgs=document.querySelectorAll('.modal-bg');
for(let i=0;i<modalbgs.length;i=i+1){
	modalbgs[i].addEventListener('click',function(e){
		if (e.target == this) {
			closecontrolmodal(this)
		}
	});
}

// Sync indicator
updatesyncstatus();

// Wake lock
let wakeLock=null;
async function requestWake() { try { if ('wakeLock' in navigator) wakeLock=await navigator.wakeLock.request('screen'); } catch (e) {} }
document.addEventListener('visibilitychange', function(){
	if (document.visibilityState == 'visible' && STATE.running) {
		requestWake();
	}
});
document.addEventListener('click', function(){
	ensureAudio();
	requestWake();
}, { once: true });

// Init
render();
// 品牌設定不在 STATE 裡(它存在 session 表), render() 帶不到, 要另外讀一次
loadbrandsetting();
setInterval(tick, 200);
