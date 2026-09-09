/*
	製作人員: 賀皓群(小賀) / dc: chris0527 / line: ho960527 / email: chris960527ho@gmail.com / 電話: 0906585605

		|-------    -----    -                     -     -----  -----  -----   -------|
	   |-------    -        -            - - -          -                     -------|
	  |-------    -        -------    -          -     -----    --       --  -------|
	 |-------    -        -     -    -          -         -      --     --  -------|
	|-------    -----    -     -    -          -     -----         -----  -------|

	無授權禁止拷貝使用!
*/

const WEBLSNAME="pokertrace-"
// 一次性搬移：WEBLSNAME 從舊前綴 "project00061-" 改名為 "pokertrace-" 後，
// 舊使用者 localStorage 仍是舊前綴 key（signin/token/uid/email/name/picture/language 等），
// 若不搬移會被當成未登入而一次性登出。這裡把每個舊前綴 key 複製到對應新前綴 key
// （newkey=WEBLSNAME+去掉舊前綴的後段），只在新 key 尚未存在時複製、不覆蓋既有新值。
// 用旗標 WEBLSNAME+"migrated" 確保只跑一次；不移除舊 key（index.html 早期腳本仍直接讀
// project00061-signin / project00061-returnpage，移除會讓 PWA 冷啟導向失效）。
// 直接用原生 localStorage API，避免相依 weblsget/weblsset 的載入順序；存取被停用時以 try/catch 吞掉。
const WEBLSNAMEOLD="project00061-"
try{
	if(!localStorage.getItem(WEBLSNAME+"migrated")){
		// 先收集舊前綴 key 清單再處理，避免邊遍歷邊寫入造成索引位移／重複搬移
		let oldkeylist=[]
		for(let i=0;i<localStorage.length;i=i+1){
			let key=localStorage.key(i)
			if(key&&key.indexOf(WEBLSNAMEOLD)==0){
				oldkeylist.push(key)
			}
		}
		for(let i=0;i<oldkeylist.length;i=i+1){
			let oldkey=oldkeylist[i]
			let newkey=WEBLSNAME+oldkey.slice(WEBLSNAMEOLD.length)
			if(localStorage.getItem(newkey)==null){
				localStorage.setItem(newkey,localStorage.getItem(oldkey))
			}
		}
		localStorage.setItem(WEBLSNAME+"migrated","1")
	}
}catch(error){}
// 後端 API 前綴依「頁面實際路徑」判斷（比只看網域穩）：
// 頁面被服務在 /project00061/ 前綴下（某些 nginx server 用這個代理到 Django）→ 用 /project00061/；
// 否則（port 3061 專屬 server、正式站等，root 服務、代理走 /backendapi/）→ 用 /backendapi/。
// 之前只看網域，導致 port 3061 用了不通的 /project00061/，即時求解/轉牌河牌全部 404。
const AJAXURL=location.pathname.indexOf("/project00061/")>=0?"/project00061/":"/backendapi/"
// WebSocket 前綴要跟 AJAXURL 同一套判斷：port 80 路徑部署只有 location /project00061/ 有 Upgrade 代理，
// 直接連 /ws/ 會落到靜態 location / 變 404（API 通、計時器/手牌同步全掛）。
const WSPREFIX=location.pathname.indexOf("/project00061/")>=0?"/project00061/ws/":"/ws/"

// 把任意值轉成安全的 HTML 文字，避免使用者可控資料(選手名稱/備註/賽事名稱等)經 innerHTML 造成 XSS。
// 全頁面共用：initialize.js 在各頁的頁面腳本之前載入。
function escapehtml(value){
	let div=doccreate("div")
	div.textContent=(value==null||value==undefined)?"":value
	return div.innerHTML
}
const LANGUAGE=weblsget(WEBLSNAME+"language")||"zhtw"
const CURRENTPAGENAME=(location.pathname.split("/").pop()||"").toLowerCase()

/* 牌面配色（兩色 / 四色）。掛在 <html> 上而不是 <body>，這樣在 body 還沒解析完之前
   就已經生效，不會先閃一下預設配色再跳成使用者選的。

   刻意用 localStorage 直接讀而不等 getuser 回來：那是一次 ajax，會有明顯閃爍。
   getuser 回來後若值不同會再套一次（見 loadbackendadminlinks）。

   全站每一頁都吃得到，因為 initialize.js 是所有頁面共用的。這正是先前
   deck skin 只影響 broadcast / handreplay 的原因 —— 那兩處各自套 class，其他頁沒人套。 */
const CARDBACKKEY="bc-cardback"
const CARDSKINKEY="bc-cardface"
const CARDSKINLIST=["classic","crimson","midnight","royal","ocean","sunset","rose","graphite","minimal"]

// TASK-046：牌背與牌面分開套用。
// 在此之前 .deck-<key> 一個 class 同時決定牌背與牌面，所以兩者只能一起換。
// 現在拆成 .cardback-<key> 與 .cardface-<key> 兩組，各自獨立。
// .deck-<key> 沒有移除：色票預覽要一次顯示整套，仍然用得到。
//
// 注意這與「兩色 / 四色」(deckface-two / deckface-four) 是**不同的軸**：
// 那個決定花色用幾種顏色，這個決定卡片的底色與外框皮膚，兩者互不影響。
function ptcardskinvalid(value){
    if(CARDSKINLIST.indexOf(value)>=0){
        return value
    }
    return "classic"
}

function ptcardskinapply(element,back,face){
    if(!element){
        return
    }
    for(let i=0;i<CARDSKINLIST.length;i=i+1){
        element.classList.remove("cardback-"+CARDSKINLIST[i])
        element.classList.remove("cardface-"+CARDSKINLIST[i])
    }
    element.classList.add("cardback-"+ptcardskinvalid(back))
    element.classList.add("cardface-"+ptcardskinvalid(face))
}

// 讀本機儲存的牌背 / 牌面。沒有拆分過的舊資料仍存在 bc-deck，兩者都沿用它。
function ptcardskinget(){
    let deck=""
    let back=""
    let face=""
    try{
        deck=localStorage.getItem("bc-deck")||""
        back=localStorage.getItem(CARDBACKKEY)||""
        face=localStorage.getItem(CARDSKINKEY)||""
    }catch(error){
        deck=""
    }
    return {
        "back": ptcardskinvalid(back||deck),
        "face": ptcardskinvalid(face||deck)
    }
}

const CARDFACEKEY="bc-face"

function ptcardfaceapply(face){
	let root=document.documentElement
	if(!root){
		return
	}
	root.classList.remove("deckface-two","deckface-four")
	if(face=="two"){
		root.classList.add("deckface-two")
		return
	}
	root.classList.add("deckface-four")
}

function ptcardfaceget(){
	let saved=""
	try{
		saved=localStorage.getItem(CARDFACEKEY)||""
	}catch(error){
		saved=""
	}
	if(saved=="two"){
		return "two"
	}
	return "four"
}

ptcardfaceapply(ptcardfaceget())

// TASK-046：牌背 / 牌面皮膚套在 <html> 上，全站都吃得到。
// 在此之前 .deck-<key> 只加在手牌回放的覆蓋層上，
// 所以 carddisplay.css 為 .pt-card 寫的那 8 套牌面配色在 handdetail / session / table
// 這些真正用 .pt-card 的頁面上其實不會生效。改成全站套用後才符合
// 使用者要的「牌面全站同步」。
ptcardskinapply(document.documentElement,ptcardskinget()["back"],ptcardskinget()["face"])


// 給沒有暫存/自動保存功能的表單頁面使用：追蹤欄位是否有未保存的變更，
// 離開頁面(返回/重整/關閉)或按下站內的返回按鈕時跳出確認提示，避免資料遺失。
let CURRENTLEAVEGUARD=null
function bindleaveguard(root){
	let dirty=false
	let scope=root||document
	function markdirty(e){
		let tag=e.target&&e.target.tagName
		if(tag=="INPUT"||tag=="TEXTAREA"||tag=="SELECT"){
			dirty=true
		}
	}
	scope.addEventListener("input",markdirty)
	scope.addEventListener("change",markdirty)
	function onbeforeunload(e){
		if(dirty){
			e.preventDefault()
			e.returnValue=""
			return ""
		}
	}
	window.addEventListener("beforeunload",onbeforeunload)
	let guard={
		isdirty:function(){
			return dirty
		},
		clear:function(){
			dirty=false
		},
		confirmleave:function(){
			if(!dirty){
				return true
			}
			return confirm(TRANSLATE[LANGUAGE]["common"]["leaveconfirm"])
		}
	}
	CURRENTLEAVEGUARD=guard
	return guard
}

function istimerpage(){
	let pages=[
		"control.html",
		"display.html",
		"structure.html",
		"structureedit.html",
		"payoutedit.html"
	]
	for(let i=0;i<pages.length;i=i+1){
		if(CURRENTPAGENAME==pages[i]){
			return true
		}
	}
	return false
}

const TIMERPAGEED=istimerpage()
// display.html 是唯一要維持全裸（無站台導覽頁籤 / 返回上頁）的頁面；control 之類的計時器頁仍要有導覽頁籤與返回上頁（但一律不注入站台 footer）
const DISPLAYONLYPAGEED=(CURRENTPAGENAME=="display.html")
let ptpagescrolllockcount=0
let ptpagescrollbodyoverflow=""
let ptpagescrollhtmloverflow=""

function ptlockpagescroll(){
	if(ptpagescrolllockcount<1){
		ptpagescrollbodyoverflow=document.body.style.overflow
		ptpagescrollhtmloverflow=document.documentElement.style.overflow
		document.body.style.overflow="hidden"
		document.documentElement.style.overflow="hidden"
	}
	ptpagescrolllockcount=ptpagescrolllockcount+1
}

function ptunlockpagescroll(){
	if(ptpagescrolllockcount<1){
		return
	}
	ptpagescrolllockcount=ptpagescrolllockcount-1
	if(ptpagescrolllockcount>0){
		return
	}
	document.body.style.overflow=ptpagescrollbodyoverflow
	document.documentElement.style.overflow=ptpagescrollhtmloverflow
}

function ptremovescrollcover(cover){
	if(!cover){
		return
	}
	if(cover.parentElement){
		cover.parentElement.removeChild(cover)
	}
	ptunlockpagescroll()
}

// 全站：任何帶 data-url 的列，支援中鍵點擊開新分頁（連帶擋掉中鍵 autoscroll）
// 同時接受 event 或 element，避免呼叫端傳錯型別就整個失效
// ptdataurltarget 定義於下方（約行 1259），此處不再重複定義，靠 hoisting 供以下處理器使用
// 直接在中鍵 mousedown 開新分頁：若改在 mousedown preventDefault 再等 auxclick，Chromium 會因 preventDefault 不再觸發 auxclick，導致沒反應
document.addEventListener("mousedown",function(event){
	if(event.button!=1){
		return
	}
	let target=ptdataurltarget(event)
	if(target){
		event.preventDefault()
		window.open(target.getAttribute("data-url"),"_blank","noopener")
	}
})

innerhtml("head",`
	<link href="../material/icon/icon.png" rel="shortcut icon" type="image/x-icon">
	<link href="../material/icon/icon.png" rel="apple-touch-icon">
	<link rel="manifest" href="manifest.json">
`)

let appuistyle=doccreate("style")
appuistyle.textContent=`
	:root {
		color-scheme: dark;
		/* 設計代幣 (design tokens): 全站共用色彩與字級, 後續各頁 CSS 可逐步改用 var(--*) */
		--color-bg: #09090b;
		--color-surface: #18181b;
		--color-surface-2: #27272a;
		--color-border: #27272a;
		--color-text: #f4f4f5;
		--color-text-muted: #a1a1aa;
		--color-text-faint: #71717a;
		--color-primary: #10b981;
		--color-primary-hover: #059669;
		--color-primary-soft: #34d399;
		--color-accent: #06b6d4;
		--color-danger: #ef4444;
		--color-warning: #fbbf24;
		--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans TC", "PingFang TC", sans-serif;
		--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	* {
		box-sizing: border-box;
	}

	html {
		background: var(--color-bg);
		scroll-behavior: smooth;
	}

	body {
		background: var(--color-bg);
		color: var(--color-text);
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
		touch-action: manipulation;
		animation: ptpagefadein .18s ease-out;
	}

	@keyframes ptpagefadein {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@media (prefers-reduced-motion: reduce) {
		body { animation: none; }
	}

	a,
	button,
	input,
	select,
	textarea {
		transition: border-color .16s ease, box-shadow .16s ease, background-color .16s ease, color .16s ease, opacity .16s ease;
		touch-action: manipulation;
	}

	a:focus-visible,
	button:focus-visible,
	input:focus-visible,
	select:focus-visible,
	textarea:focus-visible,
	[role="button"]:focus-visible,
	[tabindex]:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	button:not(:disabled):active,
	input[type="button"]:not(:disabled):active,
	input[type="submit"]:not(:disabled):active,
	input[type="reset"]:not(:disabled):active,
	[role="button"]:not(:disabled):active {
		transform: scale(0.97);
	}

	button:disabled,
	input[type="button"]:disabled,
	input[type="submit"]:disabled,
	input[type="reset"]:disabled {
		cursor: not-allowed;
	}

	.modal,
	[role="dialog"],
	[role="alertdialog"] > div {
		max-height: calc(100vh - 32px);
		overflow-y: auto;
	}

	button.ptsubmitting,
	input[type="submit"].ptsubmitting {
		opacity: .72;
	}

	.ptfieldinvalid {
		border-color: var(--color-danger) !important;
		box-shadow: 0 0 0 3px rgba(239,68,68,0.18) !important;
	}

	.ptfieldmessage {
		color: #fca5a5;
		font-size: 12px;
		font-weight: 700;
		line-height: 1.5;
		margin-top: 6px;
	}

	input,
	select,
	textarea {
		min-height: 40px;
	}

	input::placeholder,
	textarea::placeholder {
		color: var(--color-text-faint);
	}

	table {
		border-collapse: collapse;
	}

	table thead tr > th:first-child {
		text-align: center;
	}

	#navigationbar nav {
		width:100%;
		background: rgba(9,9,11,0.82);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--color-border);
	}

	#navigationbar nav.hidden,
	#navigationbar nav.md\\:hidden {
		display: none;
	}

	#navigationbar nav.md\\:block > div {
		align-items: center;
		display: flex;
		height: 64px;
		justify-content: space-between;
		margin: 0 auto;
		max-width: 72rem;
		padding: 0 16px;
		width: 100%;
	}

	#navigationbar nav.md\\:block img {
		display: inline-block;
		height: 40px;
		max-width: 180px;
		width: auto;
	}

	#navigationbar #headerlink {
		align-items: center;
		display: flex;
		gap: 16px;
	}

	#navigationbar #headerlink a {
		color: #d4d4d8;
		font-weight: 600;
		padding: 6px 4px;
		text-decoration: none;
		transition: color .16s ease;
	}

	#navigationbar #headerlink a:hover {
		color: #6ee7b7;
	}

	#navigationbar a[aria-current="page"] {
		color: #34d399;
		font-weight: 800;
	}

	#navigationbar nav.fixed a:hover,
	#navigationbar nav.fixed a[aria-current="page"] {
		color: #34d399;
	}

	.mobilepagetitle {
		color: #f4f4f5;
		display: none;
		font-size: 17px;
		font-weight: 800;
		line-height: 1.2;
		margin-left: 16px;
		max-width: 58vw;
		overflow: hidden;
		text-align: right;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	#navnotify,
	#navnotifymobile {
		position: relative;
	}

	.mobilenavigationaction {
		align-items: center;
		display: flex;
		gap: 12px;
		min-width: 0;
	}

	#navnotifymobile {
		color: #d4d4d8;
		display: flex;
	}

	#navnotifymobile svg {
		display: block;
		height: 24px;
		width: 24px;
	}

	#navnotifybadge,
	#navnotifybadgemobile {
		background: #f43f5e;
		border-radius: 9999px;
		color: #ffffff;
		font-size: 11px;
		font-weight: 700;
		line-height: 18px;
		min-width: 18px;
		padding: 0 4px;
		position: absolute;
		text-align: center;
	}

	#navnotifybadge {
		right: -12px;
		top: -8px;
	}

	#navnotifybadgemobile {
		right: -4px;
		top: -4px;
	}

	#navnotifybadge.hidden,
	#navnotifybadgemobile.hidden {
		display: none;
	}

	#footer footer {
		margin-bottom: env(safe-area-inset-bottom);
	}

	::-webkit-scrollbar {
		width: 10px;
		height: 10px;
	}

	::-webkit-scrollbar-track {
		background: #09090b;
	}

	::-webkit-scrollbar-thumb {
		background: #3f3f46;
		border-radius: 999px;
		border: 2px solid #09090b;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #52525b;
	}

	@media (max-width: 768px) {
		body {
			overflow-x: hidden;
		}

		input,
		select,
		textarea,
		button {
			font-size: 16px;
		}

		#navigationbar nav.fixed {
			padding-bottom: env(safe-area-inset-bottom);
		}

		#navigationbar nav.md\\:block {
			display: none !important;
		}

		#navigationbar nav.md\\:hidden {
			display: block !important;
		}

		#navigationbar nav.md\\:hidden:not(.fixed) {
			border-bottom: 1px solid #18181b;
			padding-top: env(safe-area-inset-top);
			position: sticky;
			top: 0;
			z-index: 50;
		}

		#navigationbar nav.md\\:hidden:not(.fixed) > div {
			align-items: center;
			display: flex;
			height: 56px;
			justify-content: space-between;
			padding: 0 16px;
		}

		#navigationbar nav.md\\:hidden:not(.fixed) img {
			display: block;
			flex: 0 0 auto;
			height: 40px;
			max-width: 160px;
			width: auto;
		}

		#navigationbar nav.fixed {
			background: rgba(9,9,11,0.92);
			border-top: 1px solid #27272a;
			bottom: 0;
			left: 0;
			position: fixed;
			right: 0;
			z-index: 50;
		}

		#navigationbar nav.fixed > div {
			align-items: center;
			display: flex;
			height: 64px;
			justify-content: space-around;
		}

		#navigationbar nav.fixed a {
			align-items: center;
			color: #a1a1aa;
			display: flex;
			flex: 1 1 0;
			flex-direction: column;
			font-size: 12px;
			justify-content: center;
			line-height: 1;
			padding: 4px 0;
			text-decoration: none;
		}

		#navigationbar nav.fixed svg {
			display: block;
			height: 24px;
			width: 24px;
		}

		#navigationbar nav.fixed span {
			font-size: 12px;
			line-height: 1;
			margin-top: 4px;
		}

		.mobilepagetitle {
			display: block;
		}

		.mobilepagetitle-source {
			display: none !important;
		}

		.pttoolheader {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}

		.pttoolheader > * {
			min-width: 0;
			align-self: stretch;
		}

		.pttoolheader .pttoolaction {
			flex-wrap: nowrap;
			justify-content: stretch;
			width: 100%;
		}

		.pttoolheader .pttoolaction > * {
			flex: 1 1 0;
			min-width: 0;
			text-align: center;
		}

		.pttoolheader .pttooltitle {
			max-width: 100%;
		}
	}

	@media (min-width: 769px) {
		#navigationbar nav.md\\:block {
			display: block !important;
		}

		#navigationbar nav.md\\:hidden {
			display: none !important;
		}

		/* 桌機空間充足，還原標題原本的換行，不套跑馬燈 */
		.pttooltitle.textmarquee {
			white-space: normal;
			overflow: visible;
		}

		.pttooltitle.textmarquee.overflowed {
			color: inherit;
		}

		.pttooltitle.textmarquee.overflowed::before {
			display: none;
		}
	}
`
document.head.appendChild(appuistyle)

let ptloadingstyle=doccreate("style")
ptloadingstyle.textContent=`
	.ptloadingcover {
		align-items: center;
		background: rgba(24,24,27,.72);
		backdrop-filter: blur(2px);
		border-radius: inherit;
		display: flex;
		inset: 0;
		justify-content: center;
		min-height: 72px;
		position: absolute;
		z-index: 80;
	}

	body > .ptloadingcover {
		position: fixed;
		z-index: 9997;
	}

	.ptloadingwrap {
		position: relative;
	}

	.ptloader {
		align-items: end;
		display: flex;
		gap: 8px;
		height: 54px;
	}

	.ptloader span {
		animation: ptbounce .8s ease-in-out infinite;
		background: #34d399;
		border-radius: 999px;
		height: 14px;
		width: 14px;
	}

	.ptloader span:nth-child(2) {
		animation-delay: .12s;
		background: #38bdf8;
	}

	.ptloader span:nth-child(3) {
		animation-delay: .24s;
		background: #fbbf24;
	}

	.ptloader span:nth-child(4) {
		animation-delay: .36s;
		background: #fb7185;
	}

	@keyframes ptbounce {
		50% {
			border-radius: 14px;
			height: 48px;
			transform: translateY(-8px);
		}
	}
`
document.head.appendChild(ptloadingstyle)

if(!DISPLAYONLYPAGEED&&weblsget(WEBLSNAME+"signin")){
	if(4<=weblsget(WEBLSNAME+"permission")){
		// 管理員版本
		innerhtml("#navigationbar",`
			<!-- 桌面版導航 -->
			<nav class="bg-zinc-800 shadow sticky top-0 z-50 hidden md:block">
				<div class="max-w-6xl mx-auto px-4 flex justify-between items-center h-16">
					<div class="flex items-center space-x-4">
						<a href="./" class="text-xl font-bold text-gray-200">
							<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
						</a>
					</div>
					<div class="flex items-center space-x-4" id="headerlink">
						<a href="main.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["index"]}</a>
						<a href="profile.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["profile"]}</a>
						<a href="clublist.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["club"]}</a>
						<a href="sessionlist.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["session"]}</a>
						<a href="serieslist.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["series"]}</a>
						<a href="notification.html" class="relative text-gray-200 hover:text-emerald-300" id="navnotify">${TRANSLATE[LANGUAGE]["navigationbar"]["notification"]}<span id="navnotifybadge" class="hidden absolute -top-2 -right-3 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[11px] font-bold leading-[18px] text-white">0</span></a>
					</div>
				</div>
			</nav>

			<!-- 手機版頂部簡化導航 -->
			<nav class="bg-zinc-800 shadow sticky top-0 z-50 md:hidden">
				<div class="px-4 flex justify-between items-center h-14">
					<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
					<div class="flex items-center gap-3 mobilenavigationaction">
						<div class="mobilepagetitle" id="mobilepagetitle"></div>
						<a href="notification.html" class="relative text-gray-200 hover:text-emerald-300" id="navnotifymobile" title="${TRANSLATE[LANGUAGE]["navigationbar"]["notification"]}">
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
							</svg>
							<span id="navnotifybadgemobile" class="hidden absolute -top-1 -right-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[11px] font-bold leading-[18px] text-white">0</span>
						</a>
					</div>
				</div>
			</nav>

			<!-- 手機版置底導航 -->
			<nav class="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700 z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
				<div class="flex justify-around items-center h-16">
					<a href="main.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["phone"]["index"]}</span>
					</a>
					<a href="clublist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["phone"]["club"]}</span>
					</a>
					<a href="sessionlist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["phone"]["session"]}</span>
					</a>
					<a href="serieslist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["phone"]["series"]}</span>
					</a>
					<a href="profile.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["phone"]["profile"]}</span>
					</a>
				</div>
			</nav>
		`,false)
	}else{
		// 一般使用者版本
		innerhtml("#navigationbar",`
			<!-- 桌面版導航 -->
			<nav class="bg-zinc-800 shadow sticky top-0 z-50 hidden md:block">
				<div class="max-w-6xl mx-auto px-4 flex justify-between items-center h-16">
					<div class="flex items-center justify-center space-x-4">
						<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
					</div>
					<div class="flex items-center space-x-4" id="headerlink">
						<a href="main.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["index"]}</a>
						<a href="profile.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["profile"]}</a>
						<a href="clublist.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["club"]}</a>
						<a href="sessionlist.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["session"]}</a>
						<a href="serieslist.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["series"]}</a>
					</div>
				</div>
			</nav>

			<!-- 手機版頂部簡化導航 -->
			<nav class="bg-zinc-800 shadow sticky top-0 z-50 md:hidden">
				<div class="px-4 flex justify-between items-center h-14">
					<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
					<div class="flex items-center gap-3 mobilenavigationaction">
						<div class="mobilepagetitle" id="mobilepagetitle"></div>
						<a href="notification.html" class="relative text-gray-200 hover:text-emerald-300" id="navnotifymobile" title="${TRANSLATE[LANGUAGE]["navigationbar"]["notification"]}">
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
							</svg>
							<span id="navnotifybadgemobile" class="hidden absolute -top-1 -right-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[11px] font-bold leading-[18px] text-white">0</span>
						</a>
					</div>
				</div>
			</nav>

			<!-- 手機版置底導航 -->
			<nav class="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700 z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
				<div class="flex justify-around items-center h-16">
					<a href="main.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["phone"]["index"]}</span>
					</a>
					<a href="clublist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["phone"]["club"]}</span>
					</a>
					<a href="sessionlist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["phone"]["session"]}</span>
					</a>
					<a href="serieslist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["phone"]["series"]}</span>
					</a>
					<a href="profile.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["phone"]["profile"]}</span>
					</a>
				</div>
			</nav>
		`,false)
	}
}else if(!DISPLAYONLYPAGEED){
	// 未登入版本
	innerhtml("#navigationbar",`
		<!-- 桌面版導航 -->
		<nav class="bg-zinc-800 shadow sticky top-0 z-50 hidden md:block">
			<div class="max-w-6xl mx-auto px-4 flex justify-between items-center h-16">
				<div class="flex items-center space-x-4">
					<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
				</div>
				<div class="flex items-center space-x-4" id="headerlink">
					<a href="signin.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["signin"]}</a>
					<a href="signup.html" class="text-gray-200 hover:text-emerald-300">${TRANSLATE[LANGUAGE]["navigationbar"]["signup"]}</a>
				</div>
			</div>
		</nav>

		<!-- 手機版頂部簡化導航 -->
		<nav class="bg-zinc-800 shadow sticky top-0 z-50 md:hidden">
			<div class="px-4 flex justify-between items-center h-14">
				<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
				<div class="mobilepagetitle" id="mobilepagetitle"></div>
			</div>
		</nav>
	`,false)
}

if(!DISPLAYONLYPAGEED){
	addclass("#navigationbar",["sticky","top-0","z-50"])
}

let ptloadingnextid=1
let ptloadingitems={}
let ptloadinghostref=new WeakMap()

function ptloadingfallback(){
	let target=document.querySelector("main")
	if(target){
		return target
	}
	target=document.querySelector(".layout")
	if(target){
		return target
	}
	target=document.querySelector(".w-full.max-w-6xl")
	if(target){
		return target
	}
	target=domgetid("main")
	if(target){
		return target
	}
	return document.body
}

function ptloadingtarget(target){
	let element=null
	if(typeof target=="string"&&target){
		element=document.querySelector(target)
	}else if(target&&target.nodeType==1){
		element=target
	}
	if(!element){
		element=ptloadingfallback()
	}
	let tag=(element.tagName||"").toLowerCase()
	if(tag=="tbody"||tag=="thead"||tag=="tfoot"||tag=="tr"||tag=="table"){
		let wrap=element.closest(".overflow-x-auto")
		if(wrap){
			element=wrap
		}else{
			let table=element.closest("table")
			if(table&&table.parentElement){
				element=table.parentElement
			}else if(element.parentElement){
				element=element.parentElement
			}
		}
	}
	return element
}

function ptisscrollable(element){
	if(!element||element==document.body){
		return false
	}
	let style=getComputedStyle(element)
	let oy=style.overflowY
	let ox=style.overflowX
	return oy=="auto"||oy=="scroll"||ox=="auto"||ox=="scroll"
}

function ptcoverhost(element){
	// 若 loading 目標本身是可捲動容器，蓋板放進去會隨內部捲動而消失；
	// 改用一層不捲動的外層 wrapper 承載蓋板，讓它固定覆蓋在此區塊上
	if(!ptisscrollable(element)||!element.parentElement){
		return element
	}
	let parent=element.parentElement
	if(parent.classList.contains("ptloadingwrap")){
		return parent
	}
	let wrap=doccreate("div")
	wrap.className="ptloadingwrap"
	parent.insertBefore(wrap,element)
	wrap.appendChild(element)
	return wrap
}

function ptloadingstart(target){
	let element=ptloadingtarget(target)
	if(!element){
		return ""
	}
	let host=ptloadinghostref.get(element)
	if(!host){
		host=ptcoverhost(element)
		ptloadinghostref.set(element,host)
	}
	let count=Number(element.dataset.ptloadingcount||0)+1
	let id="ptloading"+ptloadingnextid
	ptloadingnextid=ptloadingnextid+1
	ptloadingitems[id]=element
	element.dataset.ptloadingcount=String(count)
	if(host!=document.body&&getComputedStyle(host).position=="static"){
		host.dataset.ptloadingposition="static"
		host.style.position="relative"
	}
	if(!host.querySelector(":scope > .ptloadingcover")){
		let cover=doccreate("div")
		cover.className="ptloadingcover"
		cover.innerHTML=`
			<div class="ptloader" aria-label="${ptcommontext("loading","載入中")}">
				<span></span>
				<span></span>
				<span></span>
				<span></span>
			</div>
		`
		host.appendChild(cover)
	}
	element.classList.add("ptloadingactive")
	return id
}

function ptloadingend(id){
	let element=ptloadingitems[id]
	if(!element){
		return
	}
	delete ptloadingitems[id]
	let count=Number(element.dataset.ptloadingcount||0)-1
	if(0<count){
		element.dataset.ptloadingcount=String(count)
		return
	}
	delete element.dataset.ptloadingcount
	let host=ptloadinghostref.get(element)||element
	let cover=host.querySelector(":scope > .ptloadingcover")
	if(cover&&cover.parentElement){
		cover.parentElement.removeChild(cover)
	}
	if(host.dataset.ptloadingposition=="static"){
		host.style.position=""
		delete host.dataset.ptloadingposition
	}
	element.classList.remove("ptloadingactive")
}

window.ptloadingstart=ptloadingstart
window.ptloadingend=ptloadingend
window.ptloadingtarget=ptloadingtarget

function ptsetsubmitstate(button,submitting,text){
	if(!button){
		return
	}
	let tag=(button.tagName||"").toLowerCase()
	if(submitting){
		if(button.dataset.ptsubmitoldtext==undefined){
			if(tag=="input"){
				button.dataset.ptsubmitoldtext=button.value||""
			}else{
				button.dataset.ptsubmitoldtext=button.textContent||""
			}
		}
		button.disabled=true
		button.classList.add("ptsubmitting")
		button.setAttribute("aria-busy","true")
		if(text){
			if(tag=="input"){
				button.value=text
			}else{
				button.textContent=text
			}
		}
		return
	}
	button.disabled=false
	button.classList.remove("ptsubmitting")
	button.removeAttribute("aria-busy")
	if(button.dataset.ptsubmitoldtext!=undefined){
		if(tag=="input"){
			button.value=button.dataset.ptsubmitoldtext
		}else{
			button.textContent=button.dataset.ptsubmitoldtext
		}
		delete button.dataset.ptsubmitoldtext
	}
}

function ptfieldmessageid(element){
	if(!element.id){
		element.id="ptfield"+String(Math.random()).replace(".","")
	}
	return element.id+"-ptmessage"
}

function ptsetfieldmessage(element,message){
	if(!element){
		return
	}
	let id=ptfieldmessageid(element)
	let messageelement=domgetid(id)
	if(!message){
		element.classList.remove("ptfieldinvalid")
		element.removeAttribute("aria-invalid")
		element.removeAttribute("aria-describedby")
		if(messageelement&&messageelement.parentElement){
			messageelement.parentElement.removeChild(messageelement)
		}
		return
	}
	if(!messageelement){
		messageelement=doccreate("div")
		messageelement.id=id
		messageelement.className="ptfieldmessage"
		element.insertAdjacentElement("afterend",messageelement)
	}
	messageelement.textContent=pterror(message)
	element.classList.add("ptfieldinvalid")
	element.setAttribute("aria-invalid","true")
	element.setAttribute("aria-describedby",id)
}

function ptvalidatefield(element,rules){
	if(!element){
		return true
	}
	let rulelist=rules||{}
	let value=(element.value||"").trim()
	if(rulelist["required"]&&value==""){
		ptsetfieldmessage(element,rulelist["requiredmessage"]||"請填寫此欄位")
		return false
	}
	if(rulelist["email"]&&value!=""&&!element.checkValidity()){
		ptsetfieldmessage(element,rulelist["emailmessage"]||"Email 格式不正確")
		return false
	}
	if(rulelist["nonnegative"]&&value!=""&&Number(value)<0){
		ptsetfieldmessage(element,rulelist["nonnegativemessage"]||"不得為負數")
		return false
	}
	ptsetfieldmessage(element,"")
	return true
}

function ptbindfieldvalidation(element,rules){
	if(!element){
		return
	}
	element.addEventListener("input",function(){
		ptvalidatefield(element,rules)
	})
	element.addEventListener("change",function(){
		ptvalidatefield(element,rules)
	})
}

function ptcommontext(key,fallbacktext){
	if(typeof TRANSLATE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["common"]&&TRANSLATE[LANGUAGE]["common"][key]!=undefined){
		return TRANSLATE[LANGUAGE]["common"][key]
	}
	return fallbacktext
}

function ptrequesttimeoutmessage(){
	return ptcommontext("timeout","連線逾時，請檢查網路後重試")
}

window.ptsetsubmitstate=ptsetsubmitstate
window.ptsetfieldmessage=ptsetfieldmessage
window.ptvalidatefield=ptvalidatefield
window.ptbindfieldvalidation=ptbindfieldvalidation

function ptajaxloadingtarget(options){
	if(options&&options["loadingtarget"]!=undefined){
		return options["loadingtarget"]
	}
	return null
}

if(typeof window.ajax=="function"&&!window.ptajaxwrapped){
	let ptoldajax=window.ajax
	window.ajax=function(method,url,callback,body,headers,options){
		let loadingtarget=ptajaxloadingtarget(options)
		let loadingid=""
		let timeout=10000
		let timedout=false
		let timer=null
		if(loadingtarget){
			loadingid=ptloadingstart(loadingtarget)
		}
		if(options&&Number(options["timeout"])>0){
			timeout=Number(options["timeout"])
		}
		let doneed=false
		let requesthandle=null
		function finish(){
			if(doneed){
				return
			}
			doneed=true
			if(timer){
				clearTimeout(timer)
			}
			ptloadingend(loadingid)
		}
		function wrappedcallback(event,data){
			if(timedout){
				return
			}
			finish()
			if(pthandleapiauthfailure(data)){
				return
			}
			if(callback){
				callback(event,data)
			}
		}
		timer=setTimeout(function(){
			let data={
				"success": false,
				"data": "ERROR_request_timeout"
			}
			timedout=true
			finish()
			// 逾時時同時中止底層請求, 避免請求仍在背景送達伺服器造成重複寫入(例如新增場次多筆)。
			// 底層 ajax 若有回傳可 abort 的 handle(XHR)就取消它; 沒有則略過, 不影響原流程。
			if(requesthandle&&typeof requesthandle.abort=="function"){
				requesthandle.abort()
			}
			pttoasterror(ptrequesttimeoutmessage())
			if(callback){
				callback(null,data)
			}
		},timeout)
		try{
			requesthandle=ptoldajax(method,url,wrappedcallback,body,headers)
		}catch(error){
			finish()
			throw error
		}
	}
	window.ptajaxwrapped=true
}

if(typeof window.fetch=="function"&&!window.ptfetchwrapped){
	let ptoldfetch=window.fetch.bind(window)
	window.fetch=function(resource,options){
		let requestoptions=options||{}
		let timeout=10000
		if(Number(requestoptions["timeout"])>0){
			timeout=Number(requestoptions["timeout"])
		}
		if(requestoptions["signal"]){
			return ptoldfetch(resource,requestoptions)
		}
		let controller=null
		let timer=null
		if(typeof AbortController=="function"){
			controller=new AbortController()
			requestoptions["signal"]=controller.signal
			timer=setTimeout(function(){
				controller.abort()
			},timeout)
		}
		return ptoldfetch(resource,requestoptions).then(function(response){
			if(timer){
				clearTimeout(timer)
			}
			return response
		}).catch(function(error){
			if(timer){
				clearTimeout(timer)
			}
			if(error&&error.name=="AbortError"){
				pttoasterror(ptrequesttimeoutmessage())
			}
			throw error
		})
	}
	window.ptfetchwrapped=true
}

function loadbackendadminlinks(){
	if(!weblsget(WEBLSNAME+"signin")||!weblsget(WEBLSNAME+"token")){
		return
	}
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(data["success"]){
			// 牌背 / 主池位置偏好每頁同步到 localStorage, 供手牌回放讀取帳號設定
			try{
				localStorage.setItem("bc-deck",data["data"]["carddeck"]||"classic")
				localStorage.setItem("bc-potside",data["data"]["potmainside"]||"right")
				// TASK-046：cardback / cardface 是**牌背與牌面的皮膚**。
				// 舊帳號沒分開設定時後端會回傳與 carddeck 相同的值，所以外觀不變。
				localStorage.setItem(CARDBACKKEY,data["data"]["cardback"]||data["data"]["carddeck"]||"classic")
				localStorage.setItem(CARDSKINKEY,data["data"]["cardface"]||data["data"]["carddeck"]||"classic")
				localStorage.setItem(CARDFACEKEY,data["data"]["cardfacemode"]||"four")
				ptcardfaceapply(data["data"]["cardfacemode"]||"four")
				// 這裡刻意不讀 data["cardface"] 當成兩色/四色——那個欄位現在是皮膚名稱，
				// 直接餵給 ptcardfaceapply() 會讓使用者選的兩色設定被吃掉。
			}catch(error){
				// localStorage 不可用時忽略
			}
		}
		if(data["success"]&&4<=Number(data["data"]["permission"]||0)){
			let headerlink=domgetid("headerlink")
			if(headerlink&&!domgetid("contactadminlink")){
				headerlink.insertAdjacentHTML("beforeend",`
					<a id="contactadminlink" href="contactadmin.html" class="text-gray-200 hover:text-emerald-300">${(typeof TRANSLATE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["navigationbar"]&&TRANSLATE[LANGUAGE]["navigationbar"]["contactadmin"])||"聯絡訊息"}</a>
				`)
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

if(!DISPLAYONLYPAGEED){
	loadbackendadminlinks()
}

function markactivenavigation(){
	let current=location.pathname.split("/").pop()||"index.html"
	let links=document.querySelectorAll("#navigationbar a[href]")
	for(let i=0;i<links.length;i=i+1){
		let href=links[i].getAttribute("href")||""
		let target=href.split("?")[0].replace("./","")
		if(target==""||target=="./"){
			target="index.html"
		}
		if(target==current){
			links[i].setAttribute("aria-current","page")
		}
	}
}

if(!DISPLAYONLYPAGEED){
	markactivenavigation()
}

// 全站表單:在單行輸入框按 Enter 自動觸發該區塊的主要送出按鈕
// 已用 onenterclick/onenterkeydown 綁過 onkeydown 的輸入框會被跳過,避免重複觸發
function ptenterfindsubmit(input){
	var submitwords=["登入","登錄","註冊","建立","新增","儲存","保存","送出","確定","確認","查詢","搜尋","加入","繼續","下一步","完成","申請","邀請","更新","變更","綁定","發送","寄送","匯入","付款","下單"]
	var cancelwords=["取消","關閉","刪除","移除","返回","上一頁","上一步","登出","×"]
	// 英文介面下按鈕文字會變成 Save / Cancel / Sign In，上面兩份中文清單一個都比對不到，
	// Enter 送出就只剩 type=submit 與 emerald/blue class 兩條後備判斷，時好時壞。
	// 英文不能沿用中文的 indexOf 子字串比對：英文字會互相包含（back 在 backup 裡、
	// add 在 address 裡），會把不相干的按鈕誤判成取消鈕而擋掉 Enter。所以英文一律整字比對。
	var submitworden=["save","submit","confirm","create","add","search","join","continue","next","done","finish","apply","invite","update","change","bind","send","import","pay","order","ok"]
	var cancelworden=["cancel","close","delete","remove","back","previous"]
	// 這幾個是跨字的片語，整字比對抓不到，改用「去掉非英文字母後」的字串比對。
	// 例如 "Sign In" -> "signin"、"Log Out" -> "logout"。
	var submitphraseen=["signin","login","signup","register"]
	var cancelphraseen=["signout","logout"]
	function labelof(btn){ return String(btn.value||btn.textContent||"").trim() }
	function matchworden(wordlist,list){
		var i=0
		var j=0
		for(i=0;i<list.length;i=i+1){
			for(j=0;j<wordlist.length;j=j+1){
				if(wordlist[j]==list[i]){ return true }
			}
		}
		return false
	}
	function matchphraseen(squashed,list){
		var i=0
		for(i=0;i<list.length;i=i+1){
			if(squashed.indexOf(list[i])>=0){ return true }
		}
		return false
	}
	function iscandidate(btn){
		if(!btn||btn.disabled){ return false }
		if(btn.offsetParent==null){ return false }
		var tag=btn.tagName.toLowerCase()
		var t=String(btn.getAttribute("type")||"").toLowerCase()
		if(tag=="input"&&t!="button"&&t!="submit"){ return false }
		var label=labelof(btn)
		var lower=label.toLowerCase()
		var squashed=lower.replace(/[^a-z]/g,"")
		var wordlist=lower.split(/[^a-z]+/)
		var i=0
		// TASK-061：明確標記優先於任何文字比對。
		// 原本這行排在取消字詞之後，所以像「確認刪除」這種標了 data-entersubmit
		// 卻含有取消字詞的按鈕會被擋掉 —— 宣告應該勝過猜測。
		if(btn.hasAttribute("data-entersubmit")){ return true }
		for(i=0;i<cancelwords.length;i=i+1){ if(label.indexOf(cancelwords[i])>=0){ return false } }
		if(matchphraseen(squashed,cancelphraseen)){ return false }
		if(matchworden(wordlist,cancelworden)){ return false }
		if(t=="submit"){ return true }
		for(i=0;i<submitwords.length;i=i+1){ if(label.indexOf(submitwords[i])>=0){ return true } }
		if(matchphraseen(squashed,submitphraseen)){ return true }
		if(matchworden(wordlist,submitworden)){ return true }
		var c=String(btn.className||"")
		return c.indexOf("bg-emerald-6")>=0||c.indexOf("bg-emerald-7")>=0||c.indexOf("bg-blue-6")>=0||c.indexOf("bg-blue-7")>=0
	}
	var node=input
	var hops=0
	while(node&&node!=document.body&&hops<8){
		if(node.querySelectorAll){
			var btns=node.querySelectorAll("input[type=button],input[type=submit],button")
			var j=0
			for(j=0;j<btns.length;j=j+1){
				if(iscandidate(btns[j])){ return btns[j] }
			}
		}
		node=node.parentElement
		hops=hops+1
	}
	return null
}

document.addEventListener("keydown",function(event){
	if(event.key!="Enter"||event.isComposing||event.keyCode==229){ return }
	if(event.ctrlKey||event.metaKey||event.altKey){ return }
	var el=event.target
	if(!el||!el.tagName){ return }
	if(el.tagName.toLowerCase()!="input"){ return }
	if(el.onkeydown){ return }
	if(event.defaultPrevented){ return }
	if(el.hasAttribute("data-noentersubmit")){ return }
	var type=String(el.getAttribute("type")||"text").toLowerCase()
	var allowed=["text","number","password","email","tel","search","url","date","time","month","week","datetime-local"]
	if(allowed.indexOf(type)<0){ return }
	var submit=ptenterfindsubmit(el)
	if(submit){
		event.preventDefault()
		submit.click()
	}
})

function currentpagepath(){
	let page=location.pathname.split("/").pop()||""
	let query=location.search||""
	let hash=location.hash||""
	return page+query+hash
}

function getcurrentpagename(){
	return CURRENTPAGENAME
}

function ptcanrememberreturnpage(page){
	let target=(page||getcurrentpagename()).toLowerCase()
	let blocked=[
		"",
		"index.html",
		"signin.html",
		"signup.html"
	]
	for(let i=0;i<blocked.length;i=i+1){
		if(target==blocked[i]){
			return false
		}
	}
	return true
}

function ptrememberreturnpage(page){
	let target=page||currentpagepath()
	let pagename=(target.split("?")[0]||"").toLowerCase()
	if(!ptcanrememberreturnpage(pagename)){
		return
	}
	weblsset(WEBLSNAME+"returnpage",target)
}

function ptgetreturnpage(){
	let page=weblsget(WEBLSNAME+"returnpage")
	if(!page){
		return ""
	}
	if(!ptcanrememberreturnpage((page.split("?")[0]||"").toLowerCase())){
		return ""
	}
	return page
}

function ptclearreturnpage(){
	weblsset(WEBLSNAME+"returnpage",null)
}

function ptsetreturnreason(reasonkey){
	if(reasonkey){
		weblsset(WEBLSNAME+"returnreason",reasonkey)
		return
	}
	weblsset(WEBLSNAME+"returnreason",null)
}

function ptgetreturnreason(){
	let params=new URLSearchParams(location.search||"")
	let reason=params.get("reason")||""
	if(reason){
		return reason
	}
	return weblsget(WEBLSNAME+"returnreason")||""
}

function ptclearreturnreason(){
	weblsset(WEBLSNAME+"returnreason",null)
}

function backbuttonfallback(button){
	// 回退目標優先讀「按鈕本身」的 data-backfallback，方便各頁直接掛在按鈕上共用；
	// 找不到時再退而求其次讀 <body> 的 data-backfallback
	if(button&&button.getAttribute){
		let value=(button.getAttribute("data-backfallback")||"").trim()
		if(value){
			return value
		}
	}
	if(document.body){
		return (document.body.getAttribute("data-backfallback")||"").trim()
	}
	return ""
}

function pagebackfallback(button){
	let current=CURRENTPAGENAME
	// 1) 按鈕（或頁面）自訂的回退目標（data-backfallback），供各頁共用
	let configured=backbuttonfallback(button)
	if(configured){
		return configured
	}
	// 2) 記住的 returnpage；排除本頁本身，避免回退到自己造成重整
	let returnpage=ptgetreturnpage()
	if(returnpage&&(returnpage.split("?")[0].split("#")[0]||"").toLowerCase()!=current){
		return returnpage
	}
	// 3) 預設回退
	if(current=="newsession.html"){
		return "sessionlist.html"
	}
	if(weblsget(WEBLSNAME+"signin")){
		return "main.html"
	}
	return "signin.html"
}

function pagebacknavigate(button){
	// 優先用瀏覽器上一頁（同站來源、來源不是本頁、且有歷史可回），讓瀏覽器前進／後退能正常循環；
	// 只有在沒有可用上一頁時（沒有來源、跨站、來源就是本頁），才退回 data-backfallback 指定的連結
	let backtoreferrer=false
	let currenturl=(location.href||"").split("#")[0]
	if(document.referrer){
		try{
			let ref=new URL(document.referrer)
			let refurl=(ref.href||"").split("#")[0]
			if(ref.origin==location.origin&&refurl!=currenturl&&window.history.length>1){
				backtoreferrer=true
			}
		}catch(error){
			backtoreferrer=false
		}
	}
	if(backtoreferrer){
		history.back()
		return
	}
	href(pagebackfallback(button))
}

function pagebackhref(button){
	return pagebackfallback(button)
}

function canshowautobackbutton(){
	let current=CURRENTPAGENAME
	let blocked=[
		"",
		"index.html",
		"main.html",
		"profile.html",
		"clublist.html",
		"sessionlist.html",
		"benefit.html",
		"admin.html",
		"signin.html",
		"signup.html",
		"equity.html",
		"timebankdrill.html",
		"potodds.html",
		"icm.html",
		"stackcalc.html",
		"toollist.html",
		"notification.html",
		"session.html",
		"apidoc.html",
		"control.html",
		"structure.html",
		"structureedit.html",
		"serieslist.html",
		"payoutedit.html"
	]
	for(let i=0;i<blocked.length;i=i+1){
		if(current==blocked[i]){
			return false
		}
	}
	return true
}

function initpagebackbutton(){
	// 頁面若自己寫死了「回上一頁」按鈕（id="back"），改幫它綁上聰明版導航邏輯，
	// 讓它跟自動產生的按鈕一樣先走 history.back()，而不是當成普通連結一直往前新增歷史
	let existingback=domgetid("back")
	if(existingback){
		onclick("#back",function(element,event){
			if(event&&event.button!=0){
				return
			}
			if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
				return
			}
			event.preventDefault()
			pagebacknavigate(element)
		})
		return
	}
	if(!domgetid("navigationbar")||!canshowautobackbutton()){
		return
	}
	// 把頁面（<body data-backfallback>）設定的回退目標掛到按鈕上，讓設定統一集中在「回上一頁」按鈕
	let configured=document.body?(document.body.getAttribute("data-backfallback")||"").trim():""
	let backfallbackattr=configured?` data-backfallback="${configured}"`:""
	let fallback=pagebackhref(document.body)
	let wrap=doccreate("div")
	wrap.className="mx-auto w-full max-w-6xl px-4 py-3 md:py-4"
	wrap.innerHTML=`
		<div class="flex w-full items-center justify-between">
			<a href="${fallback}" class="w-full md:w-fit inline-flex min-h-12 items-center justify-center rounded-2xl bg-zinc-800 px-6 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700 cursor-pointer" id="autoback"${backfallbackattr}>${ptcommontext("back","回上一頁")}</a>
		</div>
	`
	domgetid("navigationbar").insertAdjacentElement("afterend",wrap)
	onclick("#autoback",function(element,event){
		if(event&&event.button!=0){
			return
		}
		if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
			return
		}
		event.preventDefault()
		if(CURRENTLEAVEGUARD&&!CURRENTLEAVEGUARD.confirmleave()){
			return
		}
		pagebacknavigate(element)
	})
}

/* ── 工具頁通用行為：輸入狀態保存 + 複製結果 / 重設 ────────────────────────
   以 <body data-backfallback="toollist.html"> 判定工具頁。2026-07-28 實測 frontend/tool/
   底下 85 個頁面全部都有這個屬性，因此不需要維護頁面白名單，新增工具頁也會自動吃到。
   刻意做成通用自動接線而非逐頁改：85 頁逐一加程式碼不但工作量大，日後每加一頁都要記得補。
   ───────────────────────────────────────────────────────────────────── */

const TOOLPAGEED=(function(){
	if(!document.body){
		return false
	}
	return (document.body.getAttribute("data-backfallback")||"").trim()=="toollist.html"
})()

const TOOLSTATEPREFIX=WEBLSNAME+"toolstate:"

// 只保存「使用者填的值」。按鈕類、檔案、密碼、隱藏欄位都不存；沒有 id 的也不存，
// 因為重新載入後無法穩定對應回同一個欄位。
function pttoolstatefieldlist(){
	let output=[]
	let candidatelist=document.querySelectorAll("input[id],select[id],textarea[id]")
	for(let i=0;i<candidatelist.length;i=i+1){
		let field=candidatelist[i]
		let type=(field.getAttribute("type")||"").toLowerCase()
		let skipped=false
		if(type=="button"||type=="submit"||type=="reset"||type=="file"||type=="password"||type=="hidden"){
			skipped=true
		}
		if(field.closest("#navigationbar")||field.closest("#footer")||field.closest("#pttoolactionbar")){
			skipped=true
		}
		if(!skipped){
			output.push(field)
		}
	}
	return output
}

function pttoolstatesave(){
	if(!TOOLPAGEED){
		return
	}
	let state={}
	let fieldlist=pttoolstatefieldlist()
	for(let i=0;i<fieldlist.length;i=i+1){
		let field=fieldlist[i]
		let type=(field.getAttribute("type")||"").toLowerCase()
		if(type=="checkbox"||type=="radio"){
			state[field.id]=field.checked
		}else{
			state[field.id]=field.value
		}
	}
	// 動態產生的輸入（chipsetup 的面額列、icm 的名次列等）沒有 id，上面那圈抓不到，
	// 而且列數本身也是狀態 —— 共用層無從得知每一頁的資料形狀。因此改成 opt-in：
	// 有動態列的頁面自己定義 pttoolstatecustom()，回傳可序列化的物件即可。
	if(typeof pttoolstatecustom=="function"){
		state["_custom"]=pttoolstatecustom()
	}
	try{
		localStorage.setItem(TOOLSTATEPREFIX+CURRENTPAGENAME,JSON.stringify(state))
		// 納入 TASK-060 的過期回收。工具頁有 85 個（其中 66 個有可保存欄位），
		// 每頁一個 key，不記進索引的話 ptkeysweep() 永遠回收不到它們 ——
		// 那正是 TASK-060 要解決的無上限累積，只是換一族 key。
		ptkeytouch(TOOLSTATEPREFIX+CURRENTPAGENAME)
	}catch(error){
		// 無痕模式或容量已滿時 setItem 會丟例外。保存失敗不該影響工具本身能不能用。
	}
}

function pttoolstaterestore(){
	if(!TOOLPAGEED){
		return
	}
	let state=null
	try{
		state=JSON.parse(localStorage.getItem(TOOLSTATEPREFIX+CURRENTPAGENAME)||"null")
	}catch(error){
		state=null
	}
	if(!state){
		return
	}
	// 動態列必須先還原，否則下面那圈跑的時候那些欄位還不存在。
	// 各頁的 apply 內部會重新算繪，所以還原完 DOM 就是完整的。
	if(state["_custom"]!=undefined&&typeof pttoolstatecustomapply=="function"){
		pttoolstatecustomapply(state["_custom"])
	}
	let fieldlist=pttoolstatefieldlist()
	let restoreded=false
	for(let i=0;i<fieldlist.length;i=i+1){
		let field=fieldlist[i]
		if(state[field.id]!=undefined){
			let type=(field.getAttribute("type")||"").toLowerCase()
			if(type=="checkbox"||type=="radio"){
				field.checked=state[field.id]==true
			}else{
				field.value=state[field.id]
			}
			restoreded=true
		}
	}
	// 各頁的計算是掛在 input / change 上的，直接改 value 不會觸發，
	// 因此還原後補派事件讓該頁自己重算，否則畫面會停在預設值的舊結果。
	if(restoreded){
		for(let i=0;i<fieldlist.length;i=i+1){
			fieldlist[i].dispatchEvent(new Event("input",{"bubbles":true}))
			fieldlist[i].dispatchEvent(new Event("change",{"bubbles":true}))
		}
	}
}

// 複製用的純文字：把主卡片整個複製一份，把每個輸入控制項換成它「目前的值」，
// 再取 textContent。這樣不必知道任何一頁的結構，就能同時帶出標籤與使用者填的數字。
function pttoolresulttext(){
	let card=document.querySelector("section[class*=\"rounded-[28px]\"]")
	if(!card){
		return ""
	}
	let clone=card.cloneNode(true)
	let actionbar=clone.querySelector("#pttoolactionbar")
	if(actionbar){
		actionbar.remove()
	}
	let originallist=card.querySelectorAll("input,select,textarea")
	let clonelist=clone.querySelectorAll("input,select,textarea")
	for(let i=0;i<clonelist.length;i=i+1){
		let text=""
		if(originallist[i]){
			let type=(originallist[i].getAttribute("type")||"").toLowerCase()
			if(type=="button"||type=="submit"||type=="reset"){
				text=""
			}else if(type=="checkbox"||type=="radio"){
				if(originallist[i].checked){
					text=" [v] "
				}else{
					text=" [ ] "
				}
			}else{
				text=" "+originallist[i].value+" "
			}
		}
		clonelist[i].replaceWith(document.createTextNode(text))
	}
	let rawlist=String(clone.textContent||"").split("\n")
	let linelist=[]
	for(let i=0;i<rawlist.length;i=i+1){
		let line=rawlist[i].replace(/\s+/g," ").trim()
		if(line!=""){
			linelist.push(line)
		}
	}
	return document.title.replace(" - PokerTrace","")+"\n"+linelist.join("\n")
}

function pttoolactionbar(){
	if(!TOOLPAGEED){
		return
	}
	if((document.body.getAttribute("data-toolaction")||"").trim()=="off"){
		return
	}
	let card=document.querySelector("section[class*=\"rounded-[28px]\"]")
	if(!card){
		return
	}
	// 純參考頁（glossary、rules、tdarules 這類）沒有任何可保存欄位，
	// 對它們顯示「重設輸入」沒有意義，只留「複製結果」。
	let resetbuttonhtml=""
	if(pttoolstatefieldlist().length>0){
		resetbuttonhtml=`<input type="button" class="min-h-10 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700" id="pttoolreset" value="${ptcommontext("resetinput","重設輸入")}">`
	}
	let wrap=doccreate("div")
	wrap.id="pttoolactionbar"
	wrap.className="mx-auto mt-4 flex w-full max-w-6xl flex-wrap gap-2 px-4"
	wrap.innerHTML=`
		<input type="button" class="min-h-10 rounded-2xl border border-emerald-600/60 bg-emerald-600/10 px-4 text-sm font-bold text-emerald-300 transition hover:bg-emerald-600/20" id="pttoolcopy" value="${ptcommontext("copyresult","複製結果")}">
		${resetbuttonhtml}
	`
	card.insertAdjacentElement("afterend",wrap)
	onclick("#pttoolcopy",function(){
		let text=pttoolresulttext()
		if(text==""){
			return
		}
		if(navigator.clipboard&&navigator.clipboard.writeText){
			navigator.clipboard.writeText(text).then(function(){
				pttoast(ptcommontext("copied","已複製到剪貼簿"),"success")
			}).catch(function(){
				pttoast(ptcommontext("copyfailed","複製失敗，請手動選取"),"warning")
			})
		}else{
			pttoast(ptcommontext("copyfailed","複製失敗，請手動選取"),"warning")
		}
	})
	onclick("#pttoolreset",function(){
		try{
			localStorage.removeItem(TOOLSTATEPREFIX+CURRENTPAGENAME)
		}catch(error){
			// 清不掉也要照樣重新載入，讓使用者至少回到預設值
		}
		location.reload()
	})
}

if(TOOLPAGEED){
	// 保存用事件委派掛在 document 上，各頁動態新增的欄位（例如 chipsetup 的「+ 面額」）也會被涵蓋
	document.addEventListener("input",pttoolstatesave)
	document.addEventListener("change",pttoolstatesave)
	// 還原必須等各頁自己的 script 跑完並綁好 handler，否則補派的事件沒有人接。
	// initialize.js 在各工具頁是最後幾支 script 之一，DOMContentLoaded 會在全部同步 script 執行完才觸發。
	document.addEventListener("DOMContentLoaded",function(){
		pttoolactionbar()
		pttoolstaterestore()
	})
}

function ptdataurltarget(node){
	let target=node
	if(node&&node.target){
		target=node.target
	}
	if(!target||typeof target.closest!="function"){
		return null
	}
	if(target.closest("a,button,input,select,textarea,label,[data-stop]")){
		return null
	}
	return target.closest("[data-url]")
}

function ptopenurlnewtab(url){
	if(!url){
		return
	}
	window.open(url,"_blank","noopener")
}

document.addEventListener("auxclick",function(event){
	if(!event||event.button!=1){
		return
	}
	let element=ptdataurltarget(event.target)
	if(!element){
		return
	}
	let url=element.getAttribute("data-url")||""
	if(url==""){
		return
	}
	event.preventDefault()
	ptopenurlnewtab(url)
})

document.addEventListener("click",function(event){
	if(!event||(!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey)){
		return
	}
	let element=ptdataurltarget(event.target)
	if(!element){
		return
	}
	let url=element.getAttribute("data-url")||""
	if(url==""){
		return
	}
	event.preventDefault()
	event.stopPropagation()
	ptopenurlnewtab(url)
},true)

if(!DISPLAYONLYPAGEED){
	initpagebackbutton()
}

if(weblsget(WEBLSNAME+"signin")&&ptcanrememberreturnpage()){
	ptrememberreturnpage()
}

let mobilepagetitleheading=null

function getpagetitletext(){
	let text=""
	if(mobilepagetitleheading){
		text=mobilepagetitleheading.textContent.trim()
	}
	if(text){
		return text
	}
	let doctitle=document.title||""
	let parts=doctitle.split(" - ")
	if(parts.length<2){
		parts=doctitle.split(" — ")
	}
	if(parts.length){
		text=parts[0].trim()
	}
	return text
}

function findmobilepagetitleheading(){
	let headings=document.querySelectorAll("h1,h2")
	for(let i=0;i<headings.length;i=i+1){
		let item=headings[i]
		if(item.closest("#navigationbar")||item.closest("#footer")){
			continue
		}
		if(item.closest("[role='dialog']")||item.closest(".modal")||item.closest(".modal-content")){
			continue
		}
		let classvalue=item.getAttribute("class")||""
		if(classvalue.indexOf("text-4xl")!=-1||classvalue.indexOf("text-5xl")!=-1){
			continue
		}
		if(!item.textContent.trim()){
			continue
		}
		return item
	}
	return null
}

function syncmobilepagetitle(){
	let title=domgetid("mobilepagetitle")
	if(!title){
		return
	}
	let heading=findmobilepagetitleheading()
	if(mobilepagetitleheading&&mobilepagetitleheading!=heading){
		mobilepagetitleheading.classList.remove("mobilepagetitle-source")
	}
	mobilepagetitleheading=heading
	if(mobilepagetitleheading){
		mobilepagetitleheading.classList.add("mobilepagetitle-source")
	}
	let titletext=getpagetitletext()
	if(title.textContent!=titletext){
		title.textContent=titletext
	}
}

if(!DISPLAYONLYPAGEED){
	syncmobilepagetitle()

	let mobilepagetitleobserver=new MutationObserver(function(){
		syncmobilepagetitle()
	})

	mobilepagetitleobserver.observe(document.body,{
		childList: true,
		subtree: true,
		characterData: true
	})
}

function applypagelanguage(){
	if(CURRENTPAGENAME=="display.html"){
		return
	}

	if(!TRANSLATE||!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["pageauto"]){
		return
	}

	let page=location.pathname.split("/").pop()||"index.html"
	let pack=TRANSLATE[LANGUAGE]["pageauto"][page]
	if(!pack){
		return
	}

	if(pack["title"]){
		document.title=pack["title"]+" - PokerTrace"
	}

	let textlist=pack["text"]||{}
	let textkeylist=Object.keys(textlist)
	for(let i=0;i<textkeylist.length;i=i+1){
		let selector=textkeylist[i]
		let element=document.querySelector(selector)
		if(element){
			element.textContent=textlist[selector]
		}
	}

	let htmllist=pack["html"]||{}
	let htmlkeylist=Object.keys(htmllist)
	for(let i=0;i<htmlkeylist.length;i=i+1){
		let selector=htmlkeylist[i]
		let element=document.querySelector(selector)
		if(element){
			element.innerHTML=htmllist[selector]
		}
	}

	let valuelist=pack["value"]||{}
	let valuekeylist=Object.keys(valuelist)
	for(let i=0;i<valuekeylist.length;i=i+1){
		let selector=valuekeylist[i]
		let element=document.querySelector(selector)
		if(element){
			element.value=valuelist[selector]
		}
	}

	let placeholderlist=pack["placeholder"]||{}
	let placeholderkeylist=Object.keys(placeholderlist)
	for(let i=0;i<placeholderkeylist.length;i=i+1){
		let selector=placeholderkeylist[i]
		let element=document.querySelector(selector)
		if(element){
			element.setAttribute("placeholder",placeholderlist[selector])
		}
	}

	let titlelist=pack["attrtitle"]||{}
	let titlekeylist=Object.keys(titlelist)
	for(let i=0;i<titlekeylist.length;i=i+1){
		let selector=titlekeylist[i]
		let element=document.querySelector(selector)
		if(element){
			element.setAttribute("title",titlelist[selector])
		}
	}

}

applypagelanguage()

/*
	標記式翻譯（TASK-069 選項 B）。

	`pageauto` 用 CSS selector 從外面指向 HTML 節點，selector 綁死版面結構，
	改版就靜默失效（`.mb-6 .grid div:nth-child(1) .text-sm` 這種）。
	這裡改成把標記寫在元素身上，標記跟著元素走：

	    <h1 data-i18n="sessionlist.title">場次管理</h1>
	    <input type="text" data-i18n-placeholder="sessionlist.name" placeholder="名稱">
	    <select data-i18n-aria-label="sessionlist.gametypefilter" aria-label="遊戲類型">

	鍵是「區段.鍵名」，直接對應 TRANSLATE[語言][區段][鍵名]，
	沿用各頁既有的區段（sessionlist、gametype…），不另立命名空間。
	點記法讓跨區段引用很自然 —— 遊戲類型的選項屬於共用的 gametype 區段，
	不屬於 sessionlist。

	**找不到鍵時不覆寫**，讓 HTML 原本的字留著。
	這一點跟 xxxtext() 那套刻意不同：那套查無會回傳鍵名本身，
	畫面就顯示 indextoollistlink 這種東西（TASK-085 實際發生過）。
	缺鍵退化成原本的中文，比退化成一個鍵名好得多，
	而缺鍵本身由 npm run verify:i18n 抓。

	屬性用白名單而不是掃所有 data-i18n-*：
	CSS 沒辦法比對「屬性名稱前綴」，要掃全部元素才做得到，成本不划算。
	白名單以外的寫法會被 verify:i18n 報出來，不會靜默失效。
*/
const I18NATTRLIST=["placeholder","value","title","alt","aria-label"]

function i18ntext(key){
	let out=undefined
	let at=String(key||"").indexOf(".")
	if(at>0){
		let pack=TRANSLATE[LANGUAGE][key.slice(0,at)]
		if(pack){
			out=pack[key.slice(at+1)]
		}
	}
	return out
}

function applydatai18n(){
	if(TRANSLATE&&TRANSLATE[LANGUAGE]){
		let textlist=document.querySelectorAll("[data-i18n]")
		for(let i=0;i<textlist.length;i=i+1){
			let text=i18ntext(textlist[i].getAttribute("data-i18n"))
			if(text!=undefined){
				textlist[i].textContent=text
			}
		}
		for(let a=0;a<I18NATTRLIST.length;a=a+1){
			let name=I18NATTRLIST[a]
			let attrlist=document.querySelectorAll("[data-i18n-"+name+"]")
			for(let i=0;i<attrlist.length;i=i+1){
				let text=i18ntext(attrlist[i].getAttribute("data-i18n-"+name))
				if(text!=undefined){
					attrlist[i].setAttribute(name,text)
				}
			}
		}
	}
}

applydatai18n()

function pttoolfavoritehref(){
	let path=(location.pathname||"").replace(/\\/g,"/").toLowerCase()
	if(path.indexOf("/tool/")<0){
		return ""
	}
	let page=CURRENTPAGENAME
	if(!page){
		return ""
	}
	return "tool/"+page
}

function pttoolfavoritekey(){
	return WEBLSNAME+"toolfavoritelist"
}

function pttoolfavoritetext(saveded){
	if(LANGUAGE=="en"){
		if(saveded){
			return "Saved"
		}
		return "Add Favorite"
	}
	if(saveded){
		return "已收藏"
	}
	return "加入最愛"
}

function pttoolfavoritelist(){
	let raw=localStorage.getItem(pttoolfavoritekey())||""
	if(!raw){
		return []
	}
	try{
		let list=JSON.parse(raw)
		if(Array.isArray(list)){
			return list
		}
	}catch(error){
	}
	return []
}

function pttoolfavoritesanitize(list){
	let output=[]
	if(!Array.isArray(list)){
		return output
	}
	for(let i=0;i<list.length;i=i+1){
		let item=String(list[i]||"").trim()
		if(!item){
			continue
		}
		if(!/^(tool\/[a-z0-9]+\.html|gto\.html)$/.test(item)){
			continue
		}
		if(output.indexOf(item)<0){
			output.push(item)
		}
	}
	return output
}

function pttoolfavoritemerge(list,otherlist){
	let output=pttoolfavoritesanitize(list)
	let addon=pttoolfavoritesanitize(otherlist)
	for(let i=0;i<addon.length;i=i+1){
		if(output.indexOf(addon[i])<0){
			output.push(addon[i])
		}
	}
	return output
}

function pttoolfavoritehas(href){
	let list=pttoolfavoritelist()
	for(let i=0;i<list.length;i=i+1){
		if(list[i]==href){
			return true
		}
	}
	return false
}

function pttoolfavoritesend(list){
	if(!weblsget(WEBLSNAME+"signin")||!weblsget(WEBLSNAME+"token")){
		return
	}
	ajax("PUT",AJAXURL+"edittoolfavorite",function(event,data){
		if(!data||data["success"]!=true){
			return
		}
		try{
			localStorage.setItem(pttoolfavoritekey(),JSON.stringify(pttoolfavoritesanitize(data["data"]||[])))
		}catch(error){
			// 無痕模式或容量已滿時 setItem 會丟例外，保存失敗不該中斷流程
		}
	},str({
		"favorites": pttoolfavoritesanitize(list)
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function pttoolfavoritesave(list,synced){
	let output=pttoolfavoritesanitize(list)
	try{
		localStorage.setItem(pttoolfavoritekey(),JSON.stringify(output))
	}catch(error){
		// 無痕模式或容量已滿時 setItem 會丟例外，保存失敗不該中斷流程
	}
	if(synced!=false){
		pttoolfavoritesend(output)
	}
}

function pttoolfavoritesyncfrombackend(done){
	let locallist=pttoolfavoritelist()
	if(!weblsget(WEBLSNAME+"signin")||!weblsget(WEBLSNAME+"token")){
		if(done){
			done(locallist)
		}
		return
	}
	ajax("GET",AJAXURL+"gettoolfavorite",function(event,data){
		if(!data||data["success"]!=true){
			if(done){
				done(locallist)
			}
			return
		}
		let backendlist=pttoolfavoritesanitize(data["data"]||[])
		let output=pttoolfavoritemerge(backendlist,locallist)
		pttoolfavoritesave(output,false)
		if(JSON.stringify(output)!=JSON.stringify(backendlist)){
			pttoolfavoritesend(output)
		}
		if(done){
			done(output)
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function pttoolfavoritetoggle(href){
	let list=pttoolfavoritelist()
	let newlist=[]
	let removed=false
	for(let i=0;i<list.length;i=i+1){
		if(list[i]==href){
			removed=true
		}else if(list[i]){
			newlist.push(list[i])
		}
	}
	if(!removed){
		newlist.push(href)
	}
	pttoolfavoritesave(newlist)
	pttoolfavoriteupdate()
}

function pttoolfavoriteupdate(){
	let button=domgetid("toolfavoritebutton")
	if(!button){
		return
	}
	let href=button.getAttribute("data-toolhref")||""
	let saveded=pttoolfavoritehas(href)
	button.value=pttoolfavoritetext(saveded)
	button.classList.remove("border-zinc-700","bg-zinc-800","text-zinc-100","hover:bg-zinc-700","border-emerald-500/50","bg-emerald-500/10","text-emerald-300","hover:bg-emerald-500/20")
	if(saveded){
		button.classList.add("border-emerald-500/50","bg-emerald-500/10","text-emerald-300","hover:bg-emerald-500/20")
	}else{
		button.classList.add("border-zinc-700","bg-zinc-800","text-zinc-100","hover:bg-zinc-700")
	}
}

function inittoolfavoritebutton(){
	let href=pttoolfavoritehref()
	if(!href||domgetid("toolfavoritebutton")){
		return
	}
	let back=domgetid("back")
	if(!back){
		return
	}
	let parent=back.parentElement
	if(!parent){
		return
	}
	// 手機版標題太長時，這排 flex 會把「加入最愛 / 回上一頁」擠變形；
	// 加上標記讓 CSS 在窄螢幕改成上下堆疊、按鈕拉成整條，標題則跑馬燈。
	parent.classList.add("pttoolheader")
	let titleheading=parent.querySelector("h1")
	if(titleheading){
		titleheading.classList.add("pttooltitle")
		if(!titleheading.hasAttribute("data-textmarquee")){
			titleheading.setAttribute("data-textmarquee","")
		}
	}
	let button=doccreate("input")
	button.type="button"
	button.id="toolfavoritebutton"
	button.setAttribute("data-toolhref",href)
	button.className="min-h-10 rounded-2xl border px-4 text-sm font-bold transition"
	let action=doccreate("div")
	action.className="pttoolaction flex shrink-0 flex-wrap justify-end gap-2"
	parent.insertBefore(action,back)
	action.appendChild(button)
	action.appendChild(back)
	onclick("#toolfavoritebutton",function(){
		pttoolfavoritetoggle(href)
	})
	pttoolfavoriteupdate()
	pttoolfavoritesyncfrombackend(function(){
		pttoolfavoriteupdate()
	})
}

inittoolfavoritebutton()

function pttoolchiptext(key){
	let map={
		"load": {
			"zhtw": "從個人資料載入面額",
			"en": "Load Profile Denoms"
		},
		"needsignin": {
			"zhtw": "請先登入才能讀取個人資料計分牌",
			"en": "Sign in to load profile chip settings"
		},
		"empty": {
			"zhtw": "個人資料沒有設定計分牌面額",
			"en": "No chip denominations in profile"
		},
		"loaded": {
			"zhtw": "已從個人資料載入 {n} 種面額",
			"en": "Loaded {n} denominations from profile"
		}
	}
	let lang=(LANGUAGE=="en"||LANGUAGE=="e")?"en":"zhtw"
	if(map[key]&&map[key][lang]){
		return map[key][lang]
	}
	return key
}

function ptprofilechipdenoms(userdata){
	let chipsets=[]
	if(userdata&&Array.isArray(userdata["chipset"])){
		chipsets=userdata["chipset"]
	}
	let denoms=[]
	for(let i=0;i<chipsets.length;i=i+1){
		let chiplist=chipsets[i]["chips"]||[]
		for(let j=0;j<chiplist.length;j=j+1){
			let value=parseInt(chiplist[j]["value"],10)||0
			if(value>0&&denoms.indexOf(value)<0){
				denoms.push(value)
			}
		}
	}
	denoms.sort(function(a,b){
		return a-b
	})
	return denoms
}

function ptloadprofilechipdenoms(done,silented){
	if(!weblsget(WEBLSNAME+"signin")||!weblsget(WEBLSNAME+"token")){
		if(!silented){
			pttoast(pttoolchiptext("needsignin"),"warning")
		}
		if(done){
			done([])
		}
		return
	}
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(!data||data["success"]!=true){
			if(done){
				done([])
			}
			return
		}
		let denoms=ptprofilechipdenoms(data["data"]||{})
		if(denoms.length<1){
			if(!silented){
				pttoast(pttoolchiptext("empty"),"warning")
			}
		}else{
			if(!silented){
				pttoast(pttoolchiptext("loaded").replace("{n}",denoms.length),"success")
			}
		}
		if(done){
			done(denoms)
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

// 把個人資料的計分牌整理成帶樣式的清單 [{value,color,shape,label}]，面額去重、由小到大。
// label 取自 chipcolors 調色盤的顏色名稱；該顏色不在調色盤裡時退回 hex 本身，不留空白。
// 與 ptprofilechipdenoms() 併存：那支只回傳數字陣列，已有 7 個呼叫點依賴，不可改其形狀。
function ptprofilechiplist(userdata){
	let palettelist=[]
	if(userdata&&Array.isArray(userdata["chipcolors"])){
		palettelist=userdata["chipcolors"]
	}
	let chipsetlist=[]
	if(userdata&&Array.isArray(userdata["chipset"])){
		chipsetlist=userdata["chipset"]
	}
	let output=[]
	for(let i=0;i<chipsetlist.length;i=i+1){
		let chiplist=chipsetlist[i]["chips"]||[]
		for(let j=0;j<chiplist.length;j=j+1){
			let value=parseInt(chiplist[j]["value"],10)||0
			let existed=false
			for(let k=0;k<output.length;k=k+1){
				if(output[k]["value"]==value){
					existed=true
				}
			}
			if(value>0&&!existed){
				let color=chiplist[j]["color"]||""
				let label=color
				for(let k=0;k<palettelist.length;k=k+1){
					if(String(palettelist[k]["color"]).toLowerCase()==String(color).toLowerCase()){
						label=palettelist[k]["name"]||color
					}
				}
				output.push({
					"value": value,
					"color": color,
					"shape": chiplist[j]["shape"]||"circle",
					"label": label
				})
			}
		}
	}
	output.sort(function(a,b){
		return a["value"]-b["value"]
	})
	return output
}

// 載入個人資料的計分牌帶樣式清單，done 收到 [{value,color,shape,label}]。
// 未登入 / 請求失敗 / 沒有設定時一律 done([])，讓呼叫端沿用自己的預設面額，不得因此崩頁。
function ptloadprofilechiplist(done,silented){
	if(!weblsget(WEBLSNAME+"signin")||!weblsget(WEBLSNAME+"token")){
		if(!silented){
			pttoast(pttoolchiptext("needsignin"),"warning")
		}
		if(done){
			done([])
		}
		return
	}
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(!data||data["success"]!=true){
			if(done){
				done([])
			}
			return
		}
		let chiplist=ptprofilechiplist(data["data"]||{})
		if(chiplist.length<1){
			if(!silented){
				pttoast(pttoolchiptext("empty"),"warning")
			}
		}else{
			if(!silented){
				pttoast(pttoolchiptext("loaded").replace("{n}",chiplist.length),"success")
			}
		}
		if(done){
			done(chiplist)
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

// 計分牌色塊（chip swatch）的佔位標記；變體 A 圓點前綴，樣式在 index.css。
// 這裡只寫入面額（整數，我們自己控制的值），使用者的顏色與名稱一律不進 HTML 字串，
// 改由 ptchipswatchapply() 以 element.style 與 textContent 指派，從根本避免自我 XSS。
function ptchipswatchhtml(value){
	return "<span class=\"chipswatch\" data-chipswatch=\""+(parseInt(value,10)||0)+"\"><span class=\"chipswatch-dot\"></span><span class=\"chipswatch-name\"></span></span>"
}

// 「已載入牌組」色帶的佔位標記。selectabled 為 true 時每顆膠囊做成可點選（需要子元素，
// 依 AGENTS.md 慣例用 role="button" 而非 input type="button"）。
function ptchipstriphtml(chiplist,selectabled){
	let html=""
	for(let i=0;i<chiplist.length;i=i+1){
		let value=parseInt(chiplist[i]["value"],10)||0
		let pickattribute=""
		if(selectabled){
			pickattribute=" role=\"button\" tabindex=\"0\" data-chippick=\""+value+"\""
		}
		html=html+"<span class=\"chippill\""+pickattribute+">"+ptchipswatchhtml(value)+"<span class=\"chippill-value\">"+value.toLocaleString("en-US")+"</span></span>"
	}
	return html
}

// 把 root 底下所有色塊佔位標記填上顏色與名稱。
// 找不到對應面額時整顆色塊隱藏，避免殘留上一次的顏色造成現場抓錯牌。
function ptchipswatchapply(root,chiplist){
	let boxlist=root.querySelectorAll("[data-chipswatch]")
	for(let i=0;i<boxlist.length;i=i+1){
		let value=parseInt(boxlist[i].getAttribute("data-chipswatch"),10)
		let matched=null
		for(let j=0;j<chiplist.length;j=j+1){
			if(chiplist[j]["value"]==value){
				matched=chiplist[j]
			}
		}
		let dot=boxlist[i].querySelector(".chipswatch-dot")
		let name=boxlist[i].querySelector(".chipswatch-name")
		if(matched){
			boxlist[i].style.display=""
			dot.style.background=matched["color"]
			name.textContent=matched["label"]
		}else{
			boxlist[i].style.display="none"
		}
	}
}

// 綁定可點選色帶：點擊或鍵盤 Enter／空白鍵都會把該面額回傳給 done。
function ptchipstripbind(root,done){
	let picklist=root.querySelectorAll("[data-chippick]")
	for(let i=0;i<picklist.length;i=i+1){
		picklist[i].addEventListener("click",function(){
			done(parseInt(this.getAttribute("data-chippick"),10))
		})
		picklist[i].addEventListener("keydown",function(event){
			if(event.key=="Enter"||event.key==" "){
				event.preventDefault()
				done(parseInt(this.getAttribute("data-chippick"),10))
			}
		})
	}
}

// 標記色帶中目前選中的面額；value 不在色帶內時全部取消選取。
function ptchipstripselect(root,value){
	let picklist=root.querySelectorAll("[data-chippick]")
	for(let i=0;i<picklist.length;i=i+1){
		if(parseInt(picklist[i].getAttribute("data-chippick"),10)==value){
			picklist[i].classList.add("is-selected")
		}else{
			picklist[i].classList.remove("is-selected")
		}
	}
}

// 把個人資料的每個計分牌組合（類別）各自整理成 {name,denoms}，不合併
function ptprofilechipsetlist(userdata){
	let chipsets=[]
	if(userdata&&Array.isArray(userdata["chipset"])){
		chipsets=userdata["chipset"]
	}
	let out=[]
	for(let i=0;i<chipsets.length;i=i+1){
		let chiplist=chipsets[i]["chips"]||[]
		let denoms=[]
		for(let j=0;j<chiplist.length;j=j+1){
			let value=parseInt(chiplist[j]["value"],10)||0
			if(value>0&&denoms.indexOf(value)<0){
				denoms.push(value)
			}
		}
		denoms.sort(function(a,b){
			return a-b
		})
		if(denoms.length){
			out.push({name:chipsets[i]["name"]||"",denoms:denoms})
		}
	}
	return out
}

// 載入個人資料的計分牌組合清單（每個類別分開），done 收到 [{name,denoms}]
function ptloadprofilechipsets(done,silented){
	if(!weblsget(WEBLSNAME+"signin")||!weblsget(WEBLSNAME+"token")){
		if(!silented){
			pttoast(pttoolchiptext("needsignin"),"warning")
		}
		if(done){
			done([])
		}
		return
	}
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(!data||data["success"]!=true){
			if(done){
				done([])
			}
			return
		}
		let sets=ptprofilechipsetlist(data["data"]||{})
		if(sets.length<1){
			if(!silented){
				pttoast(pttoolchiptext("empty"),"warning")
			}
		}
		if(done){
			done(sets)
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

if(!TIMERPAGEED){
innerhtml("#footer",`
	<footer class="sitefooter bg-zinc-950 border-t border-zinc-800 py-8 mt-8">
		<div class="sitefooterinner max-w-6xl mx-auto px-4 text-center text-zinc-400 text-sm space-y-2">
			<div>&copy; 2025-2026 PokerTrace. All rights reserved.</div>
			<div class="sitefooterlinks flex justify-center gap-4 text-gray-400">
				<a href="privacy.html" class="sitefooterlink hover:text-emerald-400">${TRANSLATE[LANGUAGE]["footer"]["privacy"]}</a>
				<span class="sitefooterdivider">|</span>
				<a href="terms.html" class="sitefooterlink hover:text-emerald-400">${TRANSLATE[LANGUAGE]["footer"]["terms"]}</a>
				<span class="sitefooterdivider">|</span>
				<a href="contact.html" class="sitefooterlink hover:text-emerald-400">${TRANSLATE[LANGUAGE]["footer"]["contact"]}</a>
			</div>
			<div class="sitefooternote text-xs text-gray-500">
				${TRANSLATE[LANGUAGE]["footer"]["version"]} a4.1.0 | Made with ♠ ♥ ♦ ♣ in Taipei
			</div>
		</div>
	</footer>
`,false)
}

addclass("html",["h-screen"])

let pagelayoutstyle=doccreate("style")
pagelayoutstyle.textContent=`
	/* footer 的關鍵版面用真正的 CSS 寫死，不依賴 Tailwind CDN 即時生成
	   （避免重量級頁面在手機上還沒生成完類別，footer 就先渲染成半裸樣式） */
	.sitefooter {
		position: relative;
		margin-top: 2rem;
		padding-top: 2rem;
		padding-bottom: 2rem;
		background: #09090b;
		border-top: 1px solid #27272a;
	}

	.sitefooterinner {
		position: relative;
		z-index: 1;
		max-width: 72rem;
		margin-left: auto;
		margin-right: auto;
		padding-left: 1rem;
		padding-right: 1rem;
		text-align: center;
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: #a1a1aa;
	}

	.sitefooterinner > * + * {
		margin-top: 0.5rem;
	}

	.sitefooterlinks {
		display: flex;
		justify-content: center;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.sitefooternote {
		font-size: 0.75rem;
		line-height: 1rem;
		color: #6b7280;
	}

	.sitefooterdivider{
		color: #71717a;
	}

	.sitefooterlink {
		color: #71717a;
		transition: color 0.2s ease,background-color 0.2s ease,border-color 0.2s ease;
	}

	@media (min-width: 769px) {
		html,
		body {
			min-height: 100vh;
		}

		body {
			display: flex;
			flex-direction: column;
		}

		#footer {
			margin-top: auto;
		}
	}

	@media (max-width: 768px) {
		#footer {
			margin-top: 40px;
		}

		/* .sitefooter {
			background: linear-gradient(180deg,#18181b 0%,#232326 100%);
			border-top: 1px solid #3f3f46;
			box-shadow: 0 -16px 36px rgba(0,0,0,0.3);
			margin-top: 0;
			padding-bottom: calc(28px + env(safe-area-inset-bottom));
			padding-top: 28px;
		} */

		.sitefooterinner {
			padding-left: 20px;
			padding-right: 20px;
		}

		.sitefooterlinks {
			gap: 10px 12px;
			justify-content: center;
			margin-top: 14px;
		}

		.sitefooternote {
			color: #71717a;
			line-height: 1.6;
			margin-top: 14px;
		}
	}
`
document.head.appendChild(pagelayoutstyle)

// 手機版添加 padding-bottom 避免內容被置底欄遮擋
if(!DISPLAYONLYPAGEED&&weblsget(WEBLSNAME+"signin")){
	let style=doccreate("style")
	style.textContent=`
		@media (max-width: 768px) {
			body {
				padding-bottom: calc(64px + env(safe-area-inset-bottom));
			}
		}
	`
	document.head.appendChild(style)
}

function pterror(key){
	if(typeof TRANSLATE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["errorlist"]&&TRANSLATE[LANGUAGE]["errorlist"][key]){
		return TRANSLATE[LANGUAGE]["errorlist"][key]
	}
	let map={
		"NETWORK_ERROR": "網路不佳，請檢查連線後再試一次",
		"GOOGLE_CREDENTIAL_MISSING": "Google 登入沒有取得憑證，請重新嘗試",
		"GOOGLE_SIGNIN_FAILED": "Google 登入流程失敗，請關閉彈窗後再試一次",
		"BACKEND_SIGNIN_FAILED": "登入驗證失敗，請重新登入",
		"ERROR_token_not_found": "登入狀態已失效，請重新登入",
		"ERROR_token_error": "登入狀態已失效，請重新登入",
		"ERROR_no_permission": "沒有操作權限",
		"ERROR_session_not_found": "找不到賽事",
		"ERROR_table_not_found": "找不到牌桌",
		"ERROR_user_not_found": "找不到使用者",
		"ERROR_request_data_not_found": "請確認必填欄位",
		"ERROR_request_data_type_error": "欄位格式不正確",
		"ERROR_request_timeout": "連線逾時，請檢查網路後重試",
		"ERROR_only_latest_hand_deletable": "只能刪除最新一筆紀錄，以免後面手牌的計分牌錯亂",
		"ERROR_already_registered": "此選手已報名",
		"ERROR_registration_not_found": "找不到報名資料",
		"ERROR_session_relation_not_found": "此賽事尚未設定下一場多日賽",
		"ERROR_session_not_open_for_registration": "此賽事未開放報名",
		"ERROR_cannot_register_own_session": "不能報名自己主辦的賽事",
		"WARNING_rebuycount_exceeded": "重購次數已超過賽事設定，請再次確認",
		"WARNING_addoncount_exceeded": "增購次數已超過賽事設定，請再次確認",
		"ERROR_too_many_requests": "操作太頻繁，請稍後再試",
		"ERROR_database_error": "資料寫入失敗，請稍後再試",
		"ERROR_timer_save_conflict": "計時器狀態已被其他人更新，請重試"
	}
	return map[key]||key||"操作失敗"
}

function pttoast(message,type){
	let box=domgetid("pttoastbox")
	if(!box){
		box=doccreate("div")
		box.id="pttoastbox"
		box.className="fixed z-[9999] space-y-2 w-[min(92vw,420px)] pointer-events-none"
		box.style.top="76px"
		box.style.left="50%"
		box.style.transform="translateX(-50%)"
		document.body.appendChild(box)
	}
	let text=pterror(message)
	let exists=box.querySelectorAll("[data-toast-text]")
	for(let i=0;i<exists.length;i=i+1){
		if(exists[i].dataset.toastText==text){
			return
		}
	}
	let item=doccreate("div")
	let color="border-emerald-500 bg-zinc-900 text-emerald-100"
	if(type=="error"){
		color="border-red-500 bg-zinc-900 text-red-100"
	}else if(type=="warning"){
		color="border-yellow-500 bg-zinc-900 text-yellow-100"
	}
	item.className="rounded border shadow-lg px-4 py-3 text-sm text-center pointer-events-auto "+color
	item.style.opacity="0"
	item.style.transform="translateY(-8px)"
	item.style.transition="all .18s"
	item.dataset.toastText=text
	item.textContent=text
	box.appendChild(item)
	setTimeout(function(){
		item.style.opacity="1"
		item.style.transform="translateY(0)"
	},10)
	setTimeout(function(){
		item.style.opacity="0"
		item.style.transform="translateY(-6px)"
		setTimeout(function(){
			if(item.parentElement){
				item.parentElement.removeChild(item)
			}
		},220)
	},2200)
}

function ptauthtarget(reasonkey){
	let query=[]
	if(reasonkey){
		query.push("reason="+encodeURIComponent(reasonkey))
	}
	let returnpage=ptgetreturnpage()
	if(returnpage){
		query.push("returnpage="+encodeURIComponent(returnpage))
	}
	if(query.length<=0){
		return "signin.html"
	}
	return "signin.html?"+query.join("&")
}

// 登出時要保留的 key（其餘一律清掉）。
//   returnpage / returnreason：pthandleauthfailure 會先 ptrememberreturnpage() 再登出，
//     重新登入後要導回原頁；清掉就回不去了。
//   migrated / v6 / coldlaunched：一次性遷移與 PWA 冷啟旗標，屬瀏覽器層級，
//     清掉會讓遷移邏輯重跑。
//   language / pwainstalldismiss：裝置層級的介面偏好，與帳號無關，不含個人資料。
const PTSIGNOUTKEEPLIST=[
	"returnpage",
	"returnreason",
	"migrated",
	"v6",
	"coldlaunched",
	"language",
	"pwainstalldismiss"
]

// 登出時把本站所有 localStorage 清乾淨（保留清單除外），避免上一個帳號的資料留給下一個登入者。
// 用「前綴掃描」而不是逐一列舉：像 stackadjust_<id>、session-setting-tab-<sessionid> 這種
// 帶動態後綴的 key 列舉不完，而且日後新增 key 也不必回來改這裡。
function ptclearlocalstorage(prefix){
	let removelist=[]
	for(let i=0;i<localStorage.length;i=i+1){
		let key=localStorage.key(i)
		if(!key||key.indexOf(prefix)!=0){
			continue
		}
		let name=key.substring(prefix.length)
		if(PTSIGNOUTKEEPLIST.indexOf(name)>=0){
			continue
		}
		removelist.push(key)
	}
	// 先收集再刪除：邊走訪邊 removeItem 會讓 localStorage.key(i) 的索引位移而漏刪。
	for(let i=0;i<removelist.length;i=i+1){
		localStorage.removeItem(removelist[i])
	}
	return removelist.length
}

function ptsignoutlocal(reasonkey){
	ptclearlocalstorage(WEBLSNAME)
	// 舊前綴 (WEBLSNAMEOLD) 的 key 是一次性遷移時刻意保留的，index.html 的 PWA 冷啟腳本讀「新 or 舊」兩種前綴。
	// 登出時若只清新前綴，project00061-signin 會殘留為真，冷啟條件就會成立，再讀 stale 的 project00061-returnpage
	// 導向已登入頁、又被彈回 signin。這裡把遷移搬過的登入相關 key 連同舊 returnpage / returnreason 一併清掉。
	// 只清舊前綴的 returnpage：新前綴的要留著，pthandleauthfailure 會先 ptrememberreturnpage() 再登出，重新登入後要導回原頁。
	const OLDSIGNOUTKEYLIST=["uid","signin","token","userid","email","permission","name","picture","returnpage","returnreason"]
	for(let i=0;i<OLDSIGNOUTKEYLIST.length;i=i+1){
		weblsset(WEBLSNAMEOLD+OLDSIGNOUTKEYLIST[i],null)
	}
	if(reasonkey){
		ptsetreturnreason(reasonkey)
	}
}

function pthandleauthfailure(reasonkey,options){
	let reason=reasonkey||"ERROR_token_error"
	let optiondata=options||{}
	let redirected=true
	let toasted=true
	if(optiondata["redirected"]==false){
		redirected=false
	}
	if(optiondata["toasted"]==false){
		toasted=false
	}
	if(ptcanrememberreturnpage()){
		ptrememberreturnpage()
	}
	ptsetreturnreason(reason)
	ptsignoutlocal(reason)
	if(toasted){
		pttoast(reason,"error")
	}
	if(redirected){
		href(ptauthtarget(reason))
	}
}

function ptisauthfailure(message){
	if(message=="ERROR_token_error"||message=="ERROR_token_not_found"){
		return true
	}
	return false
}

function pthandleapiauthfailure(data,options){
	if(!data||data["success"]!=false){
		return false
	}
	let message=data["data"]||""
	if(!ptisauthfailure(message)){
		return false
	}
	pthandleauthfailure(message,options)
	return true
}

function ptpagesummarytypeclass(type){
	if(type=="success"){
		return "border-emerald-700 bg-emerald-950/60 text-emerald-100"
	}
	if(type=="warning"){
		return "border-amber-700 bg-amber-950/50 text-amber-100"
	}
	if(type=="error"){
		return "border-red-700 bg-red-950/50 text-red-100"
	}
	return "border-zinc-700 bg-zinc-900/80 text-zinc-100"
}

function ptrenderpagesummary(target,summary){
	let element=ptloadingtarget(target)
	if(!element){
		return
	}
	if(!summary||summary["showed"]==false){
		element.innerHTML=""
		element.classList.add("hidden")
		return
	}
	let items=summary["items"]||[]
	let itemhtml=""
	for(let i=0;i<items.length;i=i+1){
		itemhtml=itemhtml+`
			<div class="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
				<div class="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">${pterror(items[i]["label"]||"-")}</div>
				<div class="mt-1 text-lg font-extrabold text-white">${pterror(items[i]["value"]||"-")}</div>
			</div>
		`
	}
	let detailhtml=""
	let details=summary["details"]||[]
	for(let i=0;i<details.length;i=i+1){
		detailhtml=detailhtml+`<div>${pterror(details[i])}</div>`
	}
	element.innerHTML=`
		<div class="rounded-[24px] border ${ptpagesummarytypeclass(summary["type"]||"info")} px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
			<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div class="min-w-0 flex-1">
					<div class="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">${pterror(summary["eyebrow"]||"更新摘要")}</div>
					<div class="mt-1 text-lg font-extrabold text-white">${pterror(summary["title"]||"-")}</div>
					<div class="mt-2 text-sm leading-7 text-zinc-300">${pterror(summary["message"]||"")}</div>
				</div>
				${summary["actionhtml"]||""}
			</div>
			${itemhtml?`<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">${itemhtml}</div>`:""}
			${detailhtml?`<div class="mt-4 space-y-1 text-sm leading-6 text-zinc-300">${detailhtml}</div>`:""}
		</div>
	`
	element.classList.remove("hidden")
}

function pttoastsuccess(message){
	pttoast(message,"success")
}

function pttoastwarning(message){
	pttoast(message,"warning")
}

function pttoasterror(message){
	pttoast(message,"error")
}

function ptshowempty(target,message,actionhtml){
	let element=ptloadingtarget(target)
	if(!element){
		return
	}
	let action=actionhtml||""
	element.innerHTML=`
		<div class="rounded-lg px-5 py-8 text-center">
			<div class="text-base font-semibold text-white mb-2">${pterror(message)}</div>
			<div class="text-sm text-zinc-400">${ptcommontext("emptynext","\u8acb\u5f9e\u4e0b\u65b9\u5efa\u8b70\u7684\u4e0b\u4e00\u6b65\u7e7c\u7e8c")}</div>
			${action}
		</div>
	`
}

function ptconfirm(message,done){
	let previousfocus=document.activeElement
	let cover=doccreate("div")
	cover.setAttribute("style","position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px")
	cover.setAttribute("role","alertdialog")
	cover.setAttribute("aria-modal","true")
	cover.setAttribute("aria-labelledby","ptconfirmtitle")
	cover.setAttribute("aria-describedby","ptconfirmbody")
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full p-5 shadow-2xl">
			<div id="ptconfirmtitle" class="text-lg font-bold text-white mb-3">${ptcommontext("confirmtitle","\u78ba\u8a8d\u64cd\u4f5c")}</div>
			<div id="ptconfirmbody" class="text-sm leading-7 text-zinc-300 mb-5 whitespace-pre-line">${pterror(message)}</div>
			<div class="flex justify-end gap-3 flex-wrap">
				<input type="button" class="ptcancel bg-zinc-700 hover:bg-zinc-600 text-white border-0 rounded-lg cursor-pointer" style="padding:11px 24px;font-size:15px;font-weight:600;min-width:104px;min-height:46px" value="${ptcommontext("cancel","\u53d6\u6d88")}">
				<input type="button" class="ptok bg-emerald-600 hover:bg-emerald-700 text-white border-0 rounded-lg cursor-pointer" style="padding:11px 24px;font-size:15px;font-weight:600;min-width:104px;min-height:46px" value="${ptcommontext("confirm","\u78ba\u8a8d")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(cover)
	let cancelbtn=cover.querySelector(".ptcancel")
	let okbtn=cover.querySelector(".ptok")
	let closed=false
	function finish(result){
		if(closed){
			return
		}
		closed=true
		document.removeEventListener("keydown",onkeydown,true)
		if(cover.parentElement){
			document.body.removeChild(cover)
		}
		ptunlockpagescroll()
		if(previousfocus&&typeof previousfocus.focus=="function"){
			previousfocus.focus()
		}
		if(done){
			done(result)
		}
	}
	function onkeydown(event){
		if(event.key=="Escape"){
			event.preventDefault()
			finish(false)
		}else if(event.key=="Tab"){
			// \u7c21\u6613\u7126\u9ede\u5faa\u74b0: \u53ea\u5728\u53d6\u6d88 / \u78ba\u8a8d\u5169\u9846\u6309\u9215\u9593\u79fb\u52d5
			let focusables=[cancelbtn,okbtn]
			let index=focusables.indexOf(document.activeElement)
			if(event.shiftKey){
				index=index<=0?focusables.length-1:index-1
			}else{
				index=index>=focusables.length-1?0:index+1
			}
			event.preventDefault()
			focusables[index].focus()
		}
	}
	document.addEventListener("keydown",onkeydown,true)
	cancelbtn.addEventListener("click",function(){
		finish(false)
	})
	okbtn.addEventListener("click",function(){
		finish(true)
	})
	okbtn.focus()
}

window.pttoastsuccess=pttoastsuccess
window.pttoastwarning=pttoastwarning
window.pttoasterror=pttoasterror
window.ptshowempty=ptshowempty
window.ptlockpagescroll=ptlockpagescroll
window.ptunlockpagescroll=ptunlockpagescroll
window.ptremovescrollcover=ptremovescrollcover
window.ptrememberreturnpage=ptrememberreturnpage
window.ptgetreturnpage=ptgetreturnpage
window.ptclearreturnpage=ptclearreturnpage
window.ptsignoutlocal=ptsignoutlocal
window.pthandleauthfailure=pthandleauthfailure
window.ptisauthfailure=ptisauthfailure
window.pthandleapiauthfailure=pthandleapiauthfailure
window.ptrenderpagesummary=ptrenderpagesummary
window.ptgetreturnreason=ptgetreturnreason
window.ptclearreturnreason=ptclearreturnreason

let marqueeRaf=null

function updatetextmarquees(){
	let elements=document.querySelectorAll("[data-textmarquee]")
	for(let i=0;i<elements.length;i=i+1){
		let element=elements[i]
		if(!element.classList.contains("textmarquee")){
			element.classList.add("textmarquee")
		}

		let text=element.textContent.trim()
		let oldcolor=element.style.getPropertyValue("--marquee-color")
		let color=oldcolor
		if(!element.classList.contains("overflowed")||!color){
			color=getComputedStyle(element).color
		}
		let clientwidth=element.clientWidth
		let scrollwidth=element.scrollWidth
		let distance=scrollwidth-clientwidth
		if(distance<0){
			distance=0
		}
		let overflowed=0<distance
		let distancetext="-"+distance+"px"

		if(element.dataset.marqueetext!=text){
			element.dataset.marqueetext=text
		}
		if(element.style.getPropertyValue("--marquee-color")!=color){
			element.style.setProperty("--marquee-color",color)
		}
		if(element.style.getPropertyValue("--marquee-distance")!=distancetext){
			element.style.setProperty("--marquee-distance",distancetext)
		}

		if(overflowed&&!element.classList.contains("overflowed")){
			element.classList.add("overflowed")
		}else if(!overflowed&&element.classList.contains("overflowed")){
			element.classList.remove("overflowed")
		}
	}
}

function scheduleupdatetextmarquees(){
	cancelAnimationFrame(marqueeRaf)

	marqueeRaf=requestAnimationFrame(function(){
		updatetextmarquees()
	})
}

updatetextmarquees()

onresize(window,function(element,event){
	updatetextmarquees()
})

let observer=new MutationObserver(function(){
	scheduleupdatetextmarquees()
	ptenhanceclickableelements(document)
})

// initialize.js 在計時器頁是放在 <head>，執行時 document.body 還不存在，
// 需要 body 的初始化要等 DOM 就緒再跑，否則 observe(null) / body.appendChild 會丟錯。
// 其他頁面把 initialize.js 放在 body 結尾，body 已存在時就立即執行，行為不變。
function ptinitafterbody(fn){
	if(document.body){
		fn()
	}else{
		document.addEventListener("DOMContentLoaded",fn)
	}
}

ptinitafterbody(function(){
	updatetextmarquees()
	observer.observe(document.body,{
		childList: true,
		subtree: true,
		characterData: true,
	})
})

// 手機版：頁面最上方下拉重整 + 清除該頁面快取
function ptisnativeinteractive(element){
	let tag=(element.tagName||"").toLowerCase()
	if(tag=="button"||tag=="a"||tag=="input"||tag=="select"||tag=="textarea"||tag=="summary"){
		return true
	}
	return false
}

function ptenhanceclickableelements(root){
	let target=root||document
	let elements=target.querySelectorAll("[onclick],.cursor-pointer,[data-mode-card],.seg")
	for(let i=0;i<elements.length;i=i+1){
		let element=elements[i]
		if(ptisnativeinteractive(element)){
			continue
		}
		if(element.dataset.ptkeyboarded=="1"){
			continue
		}
		element.dataset.ptkeyboarded="1"
		if(!element.getAttribute("role")){
			element.setAttribute("role","button")
		}
		if(!element.getAttribute("tabindex")){
			element.setAttribute("tabindex","0")
		}
		element.addEventListener("keydown",function(event){
			if(event.key!="Enter"&&event.key!=" "){
				return
			}
			event.preventDefault()
			this.click()
		})
	}
}

ptinitafterbody(function(){
	ptenhanceclickableelements(document)
})

function setuppulltorefresh(){
	let touchabled=("ontouchstart" in window)||(navigator.maxTouchPoints>0)
	if(!touchabled){
		return
	}
	let pullstyle=doccreate("style")
	pullstyle.textContent=`
		html{overscroll-behavior-y:contain;}
		.ptpull{
			position:fixed;top:0;left:0;right:0;
			display:flex;justify-content:center;
			pointer-events:none;z-index:120;
		}
		.ptpull-inner{
			margin-top:8px;width:40px;height:40px;border-radius:50%;
			display:flex;align-items:center;justify-content:center;
			background:#18181b;border:1px solid #3f3f46;color:#10b981;
			box-shadow:0 8px 24px rgba(0,0,0,.45);
			opacity:0;transform:translateY(-56px) rotate(0deg);
		}
		.ptpull-ring{
			width:18px;height:18px;border-radius:50%;
			border:2px solid rgba(16,185,129,.25);border-top-color:#10b981;
		}
		.ptpull.armed .ptpull-inner{border-color:#10b981;}
		.ptpull.refreshing .ptpull-ring{animation:ptpullspin .7s linear infinite;}
		@keyframes ptpullspin{to{transform:rotate(360deg);}}
	`
	document.head.appendChild(pullstyle)

	let host=doccreate("div")
	host.className="ptpull"
	host.innerHTML=`<div class="ptpull-inner"><div class="ptpull-ring"></div></div>`
	let inner=host.querySelector(".ptpull-inner")
	document.body.appendChild(host)

	let threshold=72
	let maxpull=130
	let starty=0
	let pulling=false
	let distance=0
	let refreshing=false

	function scrolltop(){
		return window.scrollY||document.documentElement.scrollTop||document.body.scrollTop||0
	}
	function blocked(){
		// 有燈箱、載入遮罩或確認框時不觸發，避免誤刷新
		return !!document.querySelector(".toolmodal,.ptloadingcover,.ptconfirmcover,.ptcover")
	}
	function reset(){
		pulling=false
		distance=0
		host.classList.remove("armed")
		inner.style.transform="translateY(-56px) rotate(0deg)"
		inner.style.opacity="0"
	}
	function render(){
		let progress=distance/threshold
		if(progress>1){
			progress=1
		}
		let y=distance
		if(y>maxpull){
			y=maxpull
		}
		inner.style.opacity=String(progress)
		inner.style.transform="translateY("+(y-48)+"px) rotate("+(progress*270)+"deg)"
		if(distance>=threshold){
			host.classList.add("armed")
		}else{
			host.classList.remove("armed")
		}
	}

	function refetchassets(){
		let urls=[]
		let nodes=document.querySelectorAll('script[src],link[rel="stylesheet"][href]')
		for(let i=0;i<nodes.length;i=i+1){
			let url=nodes[i].src||nodes[i].href
			if(url&&url.indexOf(location.origin)==0&&urls.indexOf(url)<0){
				urls.push(url)
			}
		}
		let jobs=[]
		for(let i=0;i<urls.length;i=i+1){
			jobs.push(fetch(urls[i],{ cache:"reload" }).catch(function(){}))
		}
		try{
			if(window.caches&&caches.keys){
				jobs.push(caches.keys().then(function(keys){
					return Promise.all(keys.map(function(key){
						return caches.delete(key)
					}))
				}).catch(function(){}))
			}
		}catch(error){
		}
		try{
			if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations){
				jobs.push(navigator.serviceWorker.getRegistrations().then(function(regs){
					return Promise.all(regs.map(function(reg){
						return reg.unregister()
					}))
				}).catch(function(){}))
			}
		}catch(error){
		}
		return Promise.all(jobs)
	}
	function dorefresh(){
		if(refreshing){
			return
		}
		refreshing=true
		host.classList.add("refreshing")
		host.classList.add("armed")
		inner.style.opacity="1"
		inner.style.transform="translateY(24px) rotate(0deg)"
		let reloaded=false
		function reload(){
			if(reloaded){
				return
			}
			reloaded=true
			location.reload()
		}
		refetchassets().then(reload,reload)
		// 安全保險：最久 2 秒後一定重整
		setTimeout(reload,2000)
	}

	document.addEventListener("touchstart",function(event){
		if(refreshing||event.touches.length!=1||scrolltop()>0||blocked()){
			starty=0
			return
		}
		starty=event.touches[0].clientY
		pulling=true
	},{passive:true})

	document.addEventListener("touchmove",function(event){
		if(!pulling||refreshing||starty<=0){
			return
		}
		if(scrolltop()>0||blocked()){
			reset()
			return
		}
		let delta=event.touches[0].clientY-starty
		if(delta<=0){
			reset()
			return
		}
		// 阻止原生下拉重整，改用自訂的
		if(event.cancelable){
			event.preventDefault()
		}
		distance=delta*0.5
		render()
	},{passive:false})

	function endhandler(){
		if(!pulling||refreshing){
			return
		}
		if(distance>=threshold){
			dorefresh()
		}else{
			reset()
		}
	}
	document.addEventListener("touchend",endhandler,{passive:true})
	document.addEventListener("touchcancel",function(){
		if(!refreshing){
			reset()
		}
	},{passive:true})
}

ptinitafterbody(setuppulltorefresh)

// ===== 共用匯出工具（CSV / JSON 下載）=====
// 觸發瀏覽器下載一個文字檔
function ptdownloadfile(filename,text,mimetype){
	let type=mimetype||"text/plain;charset=utf-8"
	let blob=new Blob([text],{type:type})
	let url=URL.createObjectURL(blob)
	let link=document.createElement("a")
	link.href=url
	link.download=filename
	document.body.appendChild(link)
	link.click()
	link.remove()
	URL.revokeObjectURL(url)
}

// 單一 CSV 欄位跳脫：含逗號／引號／換行時用雙引號包起並把內部引號加倍
function ptcsvcell(value){
	let text=(value==null||value==undefined)?"":String(value)
	if(text.indexOf("\"")>=0||text.indexOf(",")>=0||text.indexOf("\n")>=0||text.indexOf("\r")>=0){
		text="\""+text.replace(/"/g,"\"\"")+"\""
	}
	return text
}

// rows 為二維陣列（每列一個陣列），回傳 CSV 字串（CRLF 換行）
function ptbuildcsv(rows){
	let lines=[]
	for(let i=0;i<rows.length;i=i+1){
		let cells=[]
		let row=rows[i]||[]
		for(let j=0;j<row.length;j=j+1){
			cells.push(ptcsvcell(row[j]))
		}
		lines.push(cells.join(","))
	}
	return lines.join("\r\n")
}

// 下載 CSV，前置 UTF-8 BOM 讓 Excel 正確顯示中文
function ptdownloadcsv(filename,rows){
	let csv=String.fromCharCode(0xFEFF)+ptbuildcsv(rows)
	ptdownloadfile(filename,csv,"text/csv;charset=utf-8")
}

// 下載 JSON（縮排 4）
function ptdownloadjson(filename,obj){
	ptdownloadfile(filename,JSON.stringify(obj,null,4),"application/json")
}

// 產生 yyyymmdd_hhmmss 時間戳，給匯出檔名用
function ptexporttimestamp(){
	function pad(n){
		return n<10?("0"+n):(""+n)
	}
	let d=new Date()
	return ""+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+"_"+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds())
}

// ===== PWA：service worker 註冊與 manifest 連結（檢查表 3.2）=====
// 由 initialize.js 自身的 script src 推算前端根目錄，讓 root 與 tool/ 子頁都指到同一份 sw.js / manifest.json
function ptfrontendbase(){
	let scripts=document.getElementsByTagName("script")
	for(let i=0;i<scripts.length;i=i+1){
		let src=scripts[i].src||""
		let idx=src.indexOf("initialize.js")
		if(idx>=0){
			return src.substring(0,idx)
		}
	}
	return ""
}

function ptsetuppwa(){
	let base=ptfrontendbase()
	if(!base){
		return
	}
	// 補上 manifest 連結（若頁面沒寫）
	if(!document.querySelector("link[rel=\"manifest\"]")){
		let link=document.createElement("link")
		link.rel="manifest"
		link.href=base+"manifest.json"
		document.head.appendChild(link)
	}
	// service worker 只在安全環境（https / localhost）可用
	if(!("serviceWorker" in navigator)){
		return
	}
	window.addEventListener("load",function(){
		navigator.serviceWorker.register(base+"sw.js",{"scope": base}).catch(function(){
			// 註冊失敗不影響一般使用，靜默略過
		})
	})
}

ptsetuppwa()

// ===== PWA 安裝引導（檢查表 3.2.2）=====
// 瀏覽器丟出 beforeinstallprompt 時先攔下，改用自家的浮動按鈕引導使用者安裝。
let ptdeferredinstall=null
function ptsetupinstallprompt(){
	window.addEventListener("beforeinstallprompt",function(e){
		e.preventDefault()
		ptdeferredinstall=e
		ptshowinstallbutton()
	})
	window.addEventListener("appinstalled",function(){
		ptdeferredinstall=null
		let btn=document.getElementById("ptinstallbtn")
		if(btn){
			btn.remove()
		}
	})
}
function ptshowinstallbutton(){
	if(document.getElementById("ptinstallbtn")){
		return
	}
	if(weblsget(WEBLSNAME+"pwainstalldismiss")){
		return
	}
	let t=(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["pwa"])||{}
	let wrap=document.createElement("div")
	wrap.id="ptinstallbtn"
	wrap.className="fixed bottom-20 right-4 z-50 flex items-center gap-3 rounded-2xl border border-emerald-600 bg-zinc-900/95 px-4 py-3 shadow-lg max-w-[90vw]"
	wrap.innerHTML=`
		<div class="text-sm text-zinc-100">
			<div class="font-bold">${t["install"]||"Install App"}</div>
			<div class="text-xs text-zinc-400">${t["installhint"]||""}</div>
		</div>
		<button id="ptinstallgo" class="cursor-pointer rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-500">${t["install"]||"Install"}</button>
		<button id="ptinstalldismiss" class="cursor-pointer rounded-xl px-2 py-2 text-xs text-zinc-400 hover:text-zinc-200">${t["dismiss"]||"Dismiss"}</button>
	`
	document.body.appendChild(wrap)
	document.getElementById("ptinstallgo").addEventListener("click",function(){
		if(!ptdeferredinstall){
			return
		}
		ptdeferredinstall.prompt()
		ptdeferredinstall.userChoice.finally(function(){
			ptdeferredinstall=null
			wrap.remove()
		})
	})
	document.getElementById("ptinstalldismiss").addEventListener("click",function(){
		weblsset(WEBLSNAME+"pwainstalldismiss",true)
		wrap.remove()
	})
}
ptsetupinstallprompt()

// ===== 搖一搖聯絡我們 =====
// 手機上劇烈搖晃裝置時跳出燈箱，引導使用者到「聯絡我們」回報問題。
// 使用者可在燈箱內或個人資料偏好設定關閉（記錄在 localStorage 的 shakecontactoff）。
let ptshakelastx=null
let ptshakelasty=null
let ptshakelastz=null
let ptshakecount=0
let ptshakefirsttime=0
let ptshakecooldownuntil=0
let ptshakelistening=false

function ptshakecontactenabled(){
	return weblsget(WEBLSNAME+"shakecontactoff")?false:true
}

function ptshakecontacttext(key){
	let t=(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["shakecontact"])||{}
	return t[key]||key
}

function ptshakecontactshow(){
	if(domgetid("ptshakecontact")){
		return
	}
	let cover=doccreate("div")
	cover.id="ptshakecontact"
	cover.setAttribute("style","position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px")
	cover.setAttribute("role","dialog")
	cover.setAttribute("aria-modal","true")
	cover.setAttribute("aria-labelledby","ptshakecontacttitle")
	cover.setAttribute("aria-describedby","ptshakecontactbody")
	cover.innerHTML=`
		<div class="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
			<div id="ptshakecontacttitle" class="text-lg font-bold text-white mb-3">${ptshakecontacttext("title")}</div>
			<div id="ptshakecontactbody" class="text-sm leading-7 text-zinc-300 mb-5">${ptshakecontacttext("body")}</div>
			<div class="flex justify-end gap-3 flex-wrap">
				<input type="button" class="ptshakeclose bg-zinc-700 hover:bg-zinc-600 text-white border-0 rounded-lg cursor-pointer" style="padding:11px 24px;font-size:15px;font-weight:600;min-width:104px;min-height:46px" value="${ptshakecontacttext("close")}">
				<a href="contact.html" class="ptshakego inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer" style="padding:11px 24px;font-size:15px;font-weight:600;min-width:104px;min-height:46px;text-decoration:none">${ptshakecontacttext("contact")}</a>
			</div>
			<div class="mt-4 text-right">
				<input type="button" class="ptshakedisable cursor-pointer border-0 bg-transparent p-0 text-xs text-zinc-500 hover:text-zinc-300 underline" value="${ptshakecontacttext("disable")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(cover)
	function close(){
		document.removeEventListener("keydown",onkeydown,true)
		ptremovescrollcover(cover)
	}
	function onkeydown(event){
		if(event.key=="Escape"){
			event.preventDefault()
			close()
		}
	}
	document.addEventListener("keydown",onkeydown,true)
	cover.querySelector(".ptshakeclose").addEventListener("click",function(){
		close()
	})
	cover.querySelector(".ptshakego").addEventListener("click",function(){
		close()
	})
	cover.querySelector(".ptshakedisable").addEventListener("click",function(){
		weblsset(WEBLSNAME+"shakecontactoff",true)
		close()
		pttoastsuccess(ptshakecontacttext("disabledtoast"))
	})
}

function ptshakeonmotion(event){
	if(!ptshakecontactenabled()){
		return
	}
	let acc=event.accelerationIncludingGravity
	if(!acc||acc.x==null||acc.y==null||acc.z==null){
		return
	}
	let now=Date.now()
	if(now<ptshakecooldownuntil){
		return
	}
	if(ptshakelastx===null){
		ptshakelastx=acc.x
		ptshakelasty=acc.y
		ptshakelastz=acc.z
		return
	}
	let delta=Math.abs(acc.x-ptshakelastx)+Math.abs(acc.y-ptshakelasty)+Math.abs(acc.z-ptshakelastz)
	ptshakelastx=acc.x
	ptshakelasty=acc.y
	ptshakelastz=acc.z
	if(delta<25){
		return
	}
	// 1.2 秒內累積 3 次劇烈晃動才算「搖一搖」，避免走路或放桌上誤觸
	if(now-ptshakefirsttime>1200){
		ptshakecount=0
		ptshakefirsttime=now
	}
	ptshakecount=ptshakecount+1
	if(ptshakecount<3){
		return
	}
	ptshakecount=0
	// 觸發後冷卻 15 秒，避免燈箱連續跳出
	ptshakecooldownuntil=now+15000
	ptshakecontactshow()
}

function ptshakecontactlisten(){
	if(ptshakelistening){
		return
	}
	ptshakelistening=true
	window.addEventListener("devicemotion",ptshakeonmotion)
}

function ptshakeaskdismissed(){
	return weblsget(WEBLSNAME+"shakecontactiosasked")?true:false
}

// iOS 專用：系統的動作感應授權彈窗必須由使用者手勢觸發，
// 所以先顯示自家橫幅，使用者點「允許」的當下再請求系統授權。
function ptshowshakepermissionask(){
	if(domgetid("ptshakeask")||ptshakeaskdismissed()){
		return
	}
	let wrap=doccreate("div")
	wrap.id="ptshakeask"
	wrap.className="fixed bottom-20 right-4 z-50 flex items-center gap-3 rounded-2xl border border-emerald-600 bg-zinc-900/95 px-4 py-3 shadow-lg max-w-[90vw]"
	wrap.innerHTML=`
		<div class="text-sm text-zinc-100">
			<div class="font-bold">${ptshakecontacttext("asktitle")}</div>
			<div class="text-xs text-zinc-400">${ptshakecontacttext("askbody")}</div>
		</div>
		<input type="button" class="ptshakeaskgo cursor-pointer rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-500 border-0" value="${ptshakecontacttext("askallow")}">
		<input type="button" class="ptshakeasklater cursor-pointer rounded-xl px-2 py-2 text-xs text-zinc-400 hover:text-zinc-200 border-0 bg-transparent" value="${ptshakecontacttext("asklater")}">
	`
	document.body.appendChild(wrap)
	function finish(){
		weblsset(WEBLSNAME+"shakecontactiosasked",true)
		if(wrap.parentElement){
			wrap.parentElement.removeChild(wrap)
		}
	}
	wrap.querySelector(".ptshakeaskgo").addEventListener("click",function(){
		if(typeof DeviceMotionEvent=="undefined"||typeof DeviceMotionEvent.requestPermission!="function"){
			finish()
			return
		}
		DeviceMotionEvent.requestPermission().then(function(state){
			finish()
			if(state=="granted"){
				ptshakecontactlisten()
				pttoastsuccess(ptshakecontacttext("askgranted"))
			}else{
				pttoastwarning(ptshakecontacttext("askdenied"))
			}
		}).catch(function(){
			finish()
			pttoastwarning(ptshakecontacttext("askdenied"))
		})
	})
	wrap.querySelector(".ptshakeasklater").addEventListener("click",function(){
		finish()
	})
}

function ptshakecontactstart(){
	if(TIMERPAGEED||!ptshakecontactenabled()){
		return
	}
	let touchabled=("ontouchstart" in window)||(navigator.maxTouchPoints>0)
	if(!touchabled||typeof DeviceMotionEvent=="undefined"){
		return
	}
	if(typeof DeviceMotionEvent.requestPermission=="function"){
		// iOS 需要使用者同意動作感應權限；沒有手勢時只有「先前已同意」才會靜默成功。
		// 尚未詢問過（reject）就顯示一次性引導橫幅，讓使用者用點擊手勢完成授權；
		// 使用者明確拒絕過（denied）則不再打擾。
		DeviceMotionEvent.requestPermission().then(function(state){
			if(state=="granted"){
				ptshakecontactlisten()
			}
		}).catch(function(){
			ptshowshakepermissionask()
		})
		return
	}
	ptshakecontactlisten()
}

window.ptshakecontactstart=ptshakecontactstart
window.ptshakecontactshow=ptshakecontactshow
window.ptshakecontactenabled=ptshakecontactenabled
window.ptshowshakepermissionask=ptshowshakepermissionask

ptinitafterbody(ptshakecontactstart)

// ===== 首次使用導覽 onboarding（檢查表 4.4.2）=====
// 登入後第一次造訪時顯示一次性導覽；先讓使用者選「主辦者／選手」再帶對應流程。
function ptonboarding(){
	if(!weblsget(WEBLSNAME+"signin")){
		return
	}
	if(weblsget(WEBLSNAME+"onboardingseen")){
		return
	}
	let path=(location.pathname||"").toLowerCase()
	// 首頁現在也直接掛在根網址(https://pokertrace.net/, 由根目錄 index.html 提供),
	// 此時 pathname 是 "/" 或 "/frontend/" 不含 "index.html", 要一併視為首頁, 否則新手導覽會在首頁彈出。
	let pagename=path.split("/").pop()
	let indexed=path.indexOf("index.html")>=0||pagename==""
	if(path.indexOf("signin")>=0||path.indexOf("signup")>=0||indexed||path.indexOf("/tool/")>=0){
		return
	}
	let t=(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["onboarding"])||null
	if(!t){
		return
	}

	let role=null
	let idx=0

	let overlay=document.createElement("div")
	overlay.id="ptonboarding"
	overlay.className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"

	function finish(){
		weblsset(WEBLSNAME+"onboardingseen",true)
		overlay.remove()
	}

	function steps(){
		return (role==="host"?t["hoststeps"]:t["playersteps"])||[]
	}

	function render(){
		if(role===null){
			overlay.innerHTML=`
				<div class="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
					<div class="text-lg font-bold text-zinc-100">${(t["hoststeps"][0]&&t["hoststeps"][0]["title"])||"Welcome"}</div>
					<div class="mt-4 grid grid-cols-1 gap-3">
						<button id="ptobhost" class="cursor-pointer rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500">${TRANSLATE[LANGUAGE]["navigationbar"]["club"]||"Host"}</button>
						<button id="ptobplayer" class="cursor-pointer rounded-xl bg-zinc-700 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-600">${TRANSLATE[LANGUAGE]["navigationbar"]["session"]||"Player"}</button>
						<button id="ptobskip" class="cursor-pointer px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200">${t["skip"]}</button>
					</div>
				</div>
			`
			document.getElementById("ptobhost").addEventListener("click",function(){
				role="host"
				idx=0
				render()
			})
			document.getElementById("ptobplayer").addEventListener("click",function(){
				role="player"
				idx=0
				render()
			})
			document.getElementById("ptobskip").addEventListener("click",finish)
			return
		}

		let list=steps()
		let step=list[idx]||{}
		let islast=idx>=list.length-1
		let dots=""
		for(let i=0;i<list.length;i=i+1){
			dots=dots+`<span class="inline-block h-2 w-2 rounded-full ${i===idx?"bg-emerald-500":"bg-zinc-600"}"></span>`
		}
		overlay.innerHTML=`
			<div class="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
				<div class="text-lg font-bold text-zinc-100">${step["title"]||""}</div>
				<div class="mt-3 text-sm leading-relaxed text-zinc-300">${step["body"]||""}</div>
				<div class="mt-5 flex items-center justify-center gap-2">${dots}</div>
				<div class="mt-5 flex items-center justify-between">
					<button id="ptobskip2" class="cursor-pointer px-2 py-2 text-xs text-zinc-400 hover:text-zinc-200">${t["skip"]}</button>
					<div class="flex gap-2">
						<button id="ptobprev" class="cursor-pointer rounded-xl bg-zinc-700 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-600 ${idx===0?"opacity-40 pointer-events-none":""}">${t["prev"]}</button>
						<button id="ptobnext" class="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">${islast?t["done"]:t["next"]}</button>
					</div>
				</div>
			</div>
		`
		document.getElementById("ptobskip2").addEventListener("click",finish)
		document.getElementById("ptobprev").addEventListener("click",function(){
			if(idx>0){
				idx=idx-1
				render()
			}
		})
		document.getElementById("ptobnext").addEventListener("click",function(){
			if(islast){
				finish()
				return
			}
			idx=idx+1
			render()
		})
	}

	document.body.appendChild(overlay)
	render()
}
if(document.readyState==="loading"){
	document.addEventListener("DOMContentLoaded",ptonboarding)
}else{
	ptonboarding()
}

// ===== 通知中心 nav 入口與未讀數（檢查表 3.1）=====
function ptupdatenotifybadge(){
	if(!weblsget(WEBLSNAME+"signin")||!weblsget(WEBLSNAME+"token")){
		return
	}
	ajax("GET",AJAXURL+"getnotificationunreadcount",function(event,data){
		if(!data||!data["success"]){
			return
		}
		let n=(data["data"]&&data["data"]["unread"])||0
		let ids=["navnotifybadge","navnotifybadgemobile"]
		for(let i=0;i<ids.length;i=i+1){
			let el=document.getElementById(ids[i])
			if(!el){
				continue
			}
			if(n>0){
				el.textContent=n>99?"99+":(""+n)
				el.classList.remove("hidden")
			}else{
				el.classList.add("hidden")
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function ptsetupnotify(){
	if(typeof DISPLAYONLYPAGEED!="undefined"&&DISPLAYONLYPAGEED){
		return
	}
	if(!weblsget(WEBLSNAME+"signin")){
		return
	}
	let header=document.getElementById("headerlink")
	if(header&&!document.getElementById("navnotify")){
		let a=document.createElement("a")
		a.href="notification.html"
		a.id="navnotify"
		a.className="relative text-gray-200 hover:text-emerald-300"
		a.innerHTML=TRANSLATE[LANGUAGE]["navigationbar"]["notification"]+"<span id=\"navnotifybadge\" class=\"hidden absolute -top-2 -right-3 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[11px] font-bold leading-[18px] text-white\">0</span>"
		header.appendChild(a)
	}
	ptupdatenotifybadge()
}

ptsetupnotify()

// 工具頁底部的靜態 SEO 說明區塊（#toolseotitle / #toolseobody）：
// 中文文案直接寫在各工具 HTML 裡（讓搜尋引擎不執行 JS 也讀得到），
// 這裡依頁面檔名從 TRANSLATE 的 toolseo 字典套用目前語言的文字。
function ptapplytoolseo(){
	let seotitle=document.getElementById("toolseotitle")
	let seobody=document.getElementById("toolseobody")
	if(!seotitle&&!seobody){
		return
	}
	let seodict=TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["toolseo"]
	if(!seodict){
		return
	}
	let seobase=CURRENTPAGENAME.replace(".html","")
	if(seotitle&&seodict[seobase+"title"]){
		seotitle.textContent=seodict[seobase+"title"]
	}
	if(seobody&&seodict[seobase+"body"]){
		seobody.textContent=seodict[seobase+"body"]
	}
}

// 共用公共牌解析（TASK-037）
// 在此之前 broadcast.js / handdetail.js / handreplay.js / session.js / table.js
// 各自寫了一份幾乎一樣的攤平邏輯，改動時很容易漏掉其中一兩個，而漏掉的地方
// 只會在那一頁顯示錯誤、不會報任何錯。集中在這裡之後只需要改一個地方。
// 後端回傳的格式仍是 {"flop": [...],"turn": "","river": ""}（TASK-037 改成從
// 正規化表組出來，但欄位格式沒變），偶爾會是尚未 parse 的 JSON 字串，兩種都吃。
function ptboardobject(value){
	let board=value||{}
	if(typeof board=="string"){
		try{
			board=JSON.parse(board)||{}
		}catch(error){
			board={}
		}
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
		"flop": flop,
		"turn": board["turn"]||"",
		"river": board["river"]||""
	}
}

// 攤平成單一陣列，順序固定為 flop、turn、river
function ptboardcardlist(value){
	let board=ptboardobject(value)
	let cards=[]
	for(let i=0;i<board["flop"].length;i=i+1){
		cards.push(board["flop"][i])
	}
	if(board["turn"]){
		cards.push(board["turn"])
	}
	if(board["river"]){
		cards.push(board["river"])
	}
	return cards
}

// ── 會無限增長的 localStorage key 的過期回收（TASK-060）────────────────────
// 有幾類 key 是「每個場次 / 每張牌桌各一份」，使用者用越久越多：
//   session-setting-tab-<sessionid>   場次設定頁記住的分頁
//   registrationquery<sessionid>       報名查詢頁的查詢條件
//   newedithand_<tableid>_<欄位>       手牌草稿（quickhand_ 同理，每桌十幾個 key）
//   stackadjust_<id>                   計分牌校正草稿
//
// 這些在登出時會被 ptclearlocalstorage() 一次清掉，但**不登出的人永遠不會清**。
// localStorage 有容量上限，滿了之後 setItem 會丟例外——而全站的 setItem 幾乎都
// 包在 try/catch 裡靜默忽略，所以滿了不會有任何症狀，只會有功能默默不生效。
//
// 做法：寫入端呼叫 ptkeytouch() 記一筆「最後寫入時間」到單一索引 key，
// 每次載入時 ptkeysweep() 把超過保留天數的 key 連同索引一起刪掉。
// 只回收有登記在索引裡的 key，沒登記的一律不碰——寧可漏收也不要誤刪。
const PTKEYINDEXNAME=WEBLSNAME+"keyindex"
const PTKEYKEEPDAY=60

function ptkeyindexread(){
	try{
		let raw=localStorage.getItem(PTKEYINDEXNAME)
		if(!raw){
			return {}
		}
		let data=JSON.parse(raw)
		if(data&&typeof data=="object"&&!Array.isArray(data)){
			return data
		}
		return {}
	}catch(error){
		return {}
	}
}

function ptkeyindexwrite(index){
	try{
		localStorage.setItem(PTKEYINDEXNAME,JSON.stringify(index))
	}catch(error){
		// 連索引都寫不進去代表已經滿了，這時回收更重要，但也只能等下一次載入
	}
}

// 寫入端每次寫這類 key 時呼叫一次，把最後寫入時間記進索引。
function ptkeytouch(key){
	if(!key){
		return
	}
	let index=ptkeyindexread()
	index[key]=Date.now()
	ptkeyindexwrite(index)
}

// 回收：超過保留天數的 key 直接刪；已經不存在的 key 從索引移除，索引本身才不會長。
function ptkeysweep(){
	let index=ptkeyindexread()
	let now=Date.now()
	let limit=PTKEYKEEPDAY*24*60*60*1000
	let next={}
	let removed=0
	for(let key in index){
		let stamp=index[key]
		let exists=false
		try{
			exists=localStorage.getItem(key)!=null
		}catch(error){
			exists=false
		}
		if(!exists){
			continue
		}
		if(typeof stamp!="number"||now-stamp>limit){
			try{
				localStorage.removeItem(key)
				removed=removed+1
			}catch(error){
				next[key]=stamp
			}
			continue
		}
		next[key]=stamp
	}
	ptkeyindexwrite(next)
	return removed
}

// TASK-060：每次載入回收一次過期的動態 key。
// **這個呼叫必須放在上面那幾個 const 之後**：函式宣告會提升，但 const 不會，
// 放在檔案前段呼叫會踩到暫時死區（TDZ），丟 ReferenceError 並讓 initialize.js
// 從那一行整個中斷 —— 2026-07-29 實際發生過一次。
ptkeysweep()

// 共用對比度計算（TASK-052）
// 在此之前 control.js / session.js / profile.js 各有一份一模一樣的 WCAG 相對亮度
// 與對比度公式（只有函式名稱不同），改一處另外兩處不會跟著動，也沒有任何檢查會發現。
// 這三頁都已經載入 initialize.js，收攏在這裡不需要多載入任何東西。
//
// backluminance 預設是深色底 #0d0d0d 的相對亮度。要跟別的底色比就自己傳。
// 注意 display.js 的 brandcontrastborder() **不是**這個的重複實作：它用的是簡易
// luma 判斷要挑哪一個外框色，不是 WCAG 對比度，兩者刻意不同，不要合併。
const DARKBACKLUMINANCE=0.00477

function ptcontrastratio(hex,backluminance){
    let value=String(hex||"").replace("#","")
    if(value.length==3){
        value=value[0]+value[0]+value[1]+value[1]+value[2]+value[2]
    }
    if(value.length!=6){
        return 0
    }
    let channel=[]
    let i=0
    for(i=0;i<3;i=i+1){
        let part=parseInt(value.substring(i*2,i*2+2),16)/255
        if(part<=0.03928){
            channel.push(part/12.92)
        }else{
            channel.push(Math.pow((part+0.055)/1.055,2.4))
        }
    }
    let lum=0.2126*channel[0]+0.7152*channel[1]+0.0722*channel[2]
    let backlum=DARKBACKLUMINANCE
    if(backluminance!=undefined&&backluminance!=null){
        backlum=backluminance
    }
    return (Math.max(lum,backlum)+0.05)/(Math.min(lum,backlum)+0.05)
}

// 共用多 board 讀取（TASK-038）
// 後端從 TASK-038 起在手牌物件上附加 boardlist：每個 run 一筆
// {"runno":1,"board":{...},"amount":0,"allocationlist":[{"seatno","amount"}]}。
// 舊資料或舊回應沒有這個欄位時，用 boardcard / totalpot 組成單一筆，
// 所以呼叫端可以一律當作陣列處理，不必兩種寫法都防。
function ptboardlistof(hand){
	let source=(hand||{})["boardlist"]
	if(Array.isArray(source)&&source.length>0){
		let list=[]
		for(let i=0;i<source.length;i=i+1){
			let item=source[i]||{}
			list.push({
				"runno": item["runno"]||(i+1),
				"board": ptboardobject(item["board"]),
				"amount": item["amount"]||0,
				"allocationlist": item["allocationlist"]||[]
			})
		}
		return list
	}
	return [{
		"runno": 1,
		"board": ptboardobject((hand||{})["boardcard"]),
		"amount": (hand||{})["totalpot"]||0,
		"allocationlist": []
	}]
}

// 是否為多 board 手牌。單 board 時所有畫面都必須維持原樣，所以每個顯示端
// 都用這個判斷來決定要不要走新的堆疊版面。
function ptmultiboarded(hand){
	return ptboardlistof(hand).length>1
}

// 共用日期時間格式化：全站統一輸出 YYYY-MM-DD HH:MM:SS，不含 T 與 Z。
// 後端 timestamptz 會回傳像 "2026-07-12T14:30:00.123456Z" 或帶 "+08:00" 位移的字串，
// 這裡以字串處理保留資料庫原始時間（不做瀏覽器時區換算），全站顯示才會一致。
// 只給日期沒有時間時補 00:00:00，只有 HH:MM 時補秒，確保欄位長度與格式固定。
function ptformatdatetime(value){
	if(!value){
		return ""
	}
	let text=String(value).trim().replace("T"," ")
	let dotindex=text.indexOf(".")
	if(0<=dotindex){
		text=text.substring(0,dotindex)
	}
	let plusindex=text.indexOf("+")
	if(0<=plusindex){
		text=text.substring(0,plusindex)
	}
	text=text.replace("Z","").trim()
	if(text.length==10){
		text=text+" 00:00:00"
	}
	if(text.length==16){
		text=text+":00"
	}
	return text
}

// 分鐘數 → 「X 小時 Y 分」。給員工工時相關的頁面共用（session 頁員工分頁、
// tableboard 桌卡、staffwork 總覽頁），文案讀 translate.js 的 staffwork 區段。
//
// **刻意沒有把 sessionlist.js 的 formatduration 併進來**：那一支讀的是 sessionlist 區段，
// 用字不同（zhtw「分鐘」vs「分」、en「hr/min」vs「h/m」）。併進來等於改掉場次列表
// 現有的顯示文字 —— 為了去重而動到既有畫面文案，划不來。
function ptformatduration(minute){
	let value=parseInt(minute,10)
	if(isNaN(value)){
		value=0
	}
	let hourtext="小時"
	let minutetext="分"
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["staffwork"]){
		if(TRANSLATE[LANGUAGE]["staffwork"]["hour"]){
			hourtext=TRANSLATE[LANGUAGE]["staffwork"]["hour"]
		}
		if(TRANSLATE[LANGUAGE]["staffwork"]["minute"]){
			minutetext=TRANSLATE[LANGUAGE]["staffwork"]["minute"]
		}
	}
	if(value<60){
		return value+" "+minutetext
	}
	return Math.floor(value/60)+" "+hourtext+" "+(value%60)+" "+minutetext
}

// 打卡面板（上班 / 休息或回來 / 下班）。profile 與 staffwork 兩頁都要放同一組，
// 所以抽在這裡 —— 兩頁各寫一份的話，狀態機遲早會有一邊漏改。
//
// 狀態只有三種，而且**全部由 NULL 推導**，沒有 status 欄：
//   off      沒有未結束的班
//   working  班開著，而且有未結束的工作段
//   onbreak  班開著，但沒有未結束的工作段
function ptstaffshifttext(key,fallback){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["staffwork"]&&TRANSLATE[LANGUAGE]["staffwork"][key]!=undefined){
		return TRANSLATE[LANGUAGE]["staffwork"][key]
	}
	return fallback
}

function ptrendershiftpanel(containerid,data,onaction){
	let container=domgetid(containerid)
	if(!container){
		return
	}
	let state=data["state"]||"off"
	let statushtml=`<span class="text-zinc-500">${ptstaffshifttext("stateoff","未上班")}</span>`
	if(state=="working"){
		statushtml=`<span class="inline-flex items-center gap-1 text-emerald-300"><span class="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>${ptstaffshifttext("stateworking","工作中")}</span>`
	}
	if(state=="onbreak"){
		statushtml=`<span class="inline-flex items-center gap-1 text-amber-300"><span class="inline-block h-2 w-2 rounded-full bg-amber-400"></span>${ptstaffshifttext("stateonbreak","休息中")}</span>`
	}
	let tablehtml=""
	if(data["table"]){
		let tablename=data["table"]["name"]||data["table"]["no"]||data["table"]["id"]
		tablehtml=`<div class="mt-1 text-xs text-zinc-400">${ptstaffshifttext("attable","目前牌桌")}：${tablename}　${data["table"]["sessionname"]||""}</div>`
	}
	let buttonhtml=""
	if(state=="off"){
		buttonhtml=`<input type="button" class="ptshiftaction rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-500" data-action="startstaffshift" value="${ptstaffshifttext("shiftstart","上班卡")}">`
	}
	if(state=="working"){
		buttonhtml=`
			<input type="button" class="ptshiftaction rounded-2xl bg-amber-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-amber-500" data-action="breakstaffshift" value="${ptstaffshifttext("shiftbreak","休息卡")}">
			<input type="button" class="ptshiftaction rounded-2xl bg-zinc-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-zinc-600" data-action="endstaffshift" value="${ptstaffshifttext("shiftend","下班卡")}">
		`
	}
	if(state=="onbreak"){
		buttonhtml=`
			<input type="button" class="ptshiftaction rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-500" data-action="resumestaffshift" value="${ptstaffshifttext("shiftresume","結束休息")}">
			<input type="button" class="ptshiftaction rounded-2xl bg-zinc-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-zinc-600" data-action="endstaffshift" value="${ptstaffshifttext("shiftend","下班卡")}">
		`
	}
	container.innerHTML=`
		<div class="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<div class="text-sm font-bold">${statushtml}</div>
				<div class="mt-1 text-xs text-zinc-400">${ptstaffshifttext("shifttotal","本班累計")}：${ptformatduration(data["shiftminute"])}${0<data["segmentlist"].length?"　"+data["segmentlist"].length+ptstaffshifttext("segmentcount"," 段"):""}</div>
				${tablehtml}
			</div>
			<div class="flex flex-wrap gap-2">${buttonhtml}</div>
		</div>
	`
	onclick("#"+containerid+" .ptshiftaction",function(element){
		onaction(element.getAttribute("data-action"))
	})
}

function ptloadshiftpanel(containerid,staffuserid,afterload){
	let url=AJAXURL+"getstaffshiftstatus"
	if(staffuserid){
		url=url+"?staffuserid="+encodeURIComponent(staffuserid)
	}
	ajax("GET",url,function(event,data){
		if(!data["success"]){
			innerhtml("#"+containerid,`<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 text-sm text-zinc-500">${ptstaffshifttext("shiftloadfail","打卡狀態載入失敗")}</div>`,false)
			return
		}
		ptrendershiftpanel(containerid,data["data"],function(action){
			ptsendshiftaction(action,staffuserid,function(){
				ptloadshiftpanel(containerid,staffuserid,afterload)
			})
		})
		if(afterload){
			afterload(data["data"])
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#"+containerid
	})
}

function ptsendshiftaction(action,staffuserid,done){
	let body={}
	if(staffuserid){
		body["staffuserid"]=staffuserid
	}
	ajax("POST",AJAXURL+action,function(event,data){
		if(data["success"]){
			pttoast(ptstaffshifttext(action+"ok",ptstaffshifttext("shiftok","已更新")),"success")
			done()
		}else{
			pttoast(pterror(data["data"]||ptstaffshifttext("shiftfail","操作失敗")),"error")
		}
	},JSON.stringify(body),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],null)
}

// 只取到分鐘的日期時間（YYYY-MM-DD HH:mm）。開始時間顯示用，不需要秒。
function ptformatdatetimeminute(value){
	let text=ptformatdatetime(value)
	if(16<=text.length){
		return text.substring(0,16)
	}
	return text
}

// 通用表格排序（各頁資料表共用，仿 admin 的做法抽成共用）：
//   * getvalue(item,key) 由各頁提供，回傳排序值(數字或字串)；取不到一律回 null，統一排到最後
//   * ptsortlist 依 key/ascended 排一份新陣列(不改原陣列)；key 為空字串代表維持原順序
//   * ptsortarrow 依當前 key/ascended 更新表頭箭頭(容器內 .ptsortarrow[data-sortkey])
//   * ptbindsort 綁定容器內 .ptsortth 的點擊：同欄切升降、換欄重設升冪，再呼叫 rerender()
function ptsortcompare(itema,itemb,key,ascended,getvalue){
	let left=getvalue(itema,key)
	let right=getvalue(itemb,key)
	let result=0
	if(left==null&&right!=null){
		result=1
	}else if(left!=null&&right==null){
		result=-1
	}else if(left!=null&&right!=null){
		if(typeof left=="number"&&typeof right=="number"){
			result=left-right
		}else{
			result=String(left).localeCompare(String(right),"zh-Hant")
		}
		if(!ascended){
			result=0-result
		}
	}
	return result
}

function ptsortlist(list,key,ascended,getvalue){
	let out=(list||[]).slice()
	if(key){
		out.sort(function(itema,itemb){
			return ptsortcompare(itema,itemb,key,ascended,getvalue)
		})
	}
	return out
}

function ptsortarrow(containerselector,key,ascended){
	let container=document.querySelector(containerselector)
	if(!container){
		return
	}
	let arrows=container.querySelectorAll(".ptsortarrow")
	for(let i=0;i<arrows.length;i=i+1){
		let mark=""
		if(key&&arrows[i].getAttribute("data-sortkey")==key){
			mark=ascended?" ▲":" ▼"
		}
		arrows[i].textContent=mark
	}
}

function ptbindsort(containerselector,state,rerender){
	let container=document.querySelector(containerselector)
	if(!container){
		return
	}
	let ths=container.querySelectorAll(".ptsortth")
	for(let i=0;i<ths.length;i=i+1){
		// 有些頁面每次 render 會把整個 thead 重畫（例如 clublist），
		// 那種情況必須在 render 後重新呼叫 ptbindsort。但 addEventListener
		// 不會解除舊的，重複呼叫就會**疊加**監聽器 —— 點一下切換兩次方向，
		// 看起來像「排序壞掉」而不是「綁了兩次」。用標記擋掉重複綁定。
		// 重畫產生的是新元素，不會帶著這個標記，所以新的 thead 仍然綁得到。
		if(ths[i].getAttribute("data-ptsortbound")=="1"){
			continue
		}
		ths[i].setAttribute("data-ptsortbound","1")
		ths[i].style.cursor="pointer"
		ths[i].addEventListener("click",function(){
			let key=this.getAttribute("data-sortkey")
			if(!key){
				return
			}
			if(state["key"]==key){
				state["ascended"]=!state["ascended"]
			}else{
				state["key"]=key
				state["ascended"]=true
			}
			rerender()
		})
	}
}

// 共用分頁切換器。前後頁固定顯示，用「<」「>」符號（語言中性）。
// 桌面版顯示完整頁碼（第一頁、最後一頁與目前頁 ±2，中間用 ... 省略）；
// 手機版（<sm）改成精簡的「目前頁 / 總頁數」文字，避免一排頁碼換行變醜。
// 各頁面只需要提供自己的 pagination 物件（{page,limit,total,totalpages,hasprev,hasnext}）
// 與換頁後要做的事（gotopage 回呼），畫面 style 可依需求覆蓋 class，但切換邏輯統一在這裡維護。
function renderptpagination(containerid,pagination,gotopage){
	pagination=pagination||{}
	let page=pagination["page"]||1
	let totalpages=pagination["totalpages"]||1
	let hasprev=!!pagination["hasprev"]
	let hasnext=!!pagination["hasnext"]
	let total=pagination["total"]||0
	let totaltext="共 "+total+" 筆"
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["pagination"]&&TRANSLATE[LANGUAGE]["pagination"]["total"]){
		totaltext=TRANSLATE[LANGUAGE]["pagination"]["total"].replace("%s",total)
	}
	let numbershtml=""
	let skipped=false
	for(let i=1;i<=totalpages;i=i+1){
		if(i==1||i==totalpages||Math.abs(i-page)<=2){
			numbershtml=numbershtml+`
				<input type="button" class="${i==page?"bg-emerald-600":"bg-zinc-800 hover:bg-zinc-700"} px-3 py-2 rounded-xl cursor-pointer ptpagebtn transition" data-page="${i}" value="${i}">
			`
			skipped=false
		}else if(skipped==false){
			numbershtml=numbershtml+`<span class="px-2 py-2 text-zinc-400">...</span>`
			skipped=true
		}
	}
	let html=`
		<input type="button" class="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-3 py-2 rounded-xl cursor-pointer transition ptpageprev" value="<" ${hasprev?"":"disabled"}>
		<div class="hidden sm:flex items-center gap-2">${numbershtml}</div>
		<div class="flex items-center px-3 text-zinc-300 sm:hidden">${page} / ${totalpages}</div>
		<input type="button" class="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-3 py-2 rounded-xl cursor-pointer transition ptpagenext" value=">" ${hasnext?"":"disabled"}>
		<span class="text-zinc-400 text-sm px-2">${totaltext}</span>
	`
	innerhtml("#"+containerid,html,false)
	onclick("#"+containerid+" .ptpageprev",function(element,event){
		if(hasprev){
			gotopage(page-1)
		}
	})
	onclick("#"+containerid+" .ptpagenext",function(element,event){
		if(hasnext){
			gotopage(page+1)
		}
	})
	onclick("#"+containerid+" .ptpagebtn",function(element,event){
		let pagevalue=int(dataset(element,"page"))
		if(0<pagevalue&&pagevalue!=page){
			gotopage(pagevalue)
		}
	})
}
ptapplytoolseo()
