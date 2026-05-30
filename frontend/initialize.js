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
const AJAXURL="// 輸入您的後端連接埠"
const LANGUAGE=weblsget(WEBLSNAME+"language")||"zhtw"

innerhtml("head",`
	<link href="../material/icon/icon.png" rel="shortcut icon" type="image/x-icon">
	<link href="../material/icon/icon.png" rel="apple-touch-icon">
`)

if(weblsget(WEBLSNAME+"signin")){
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
						<a href="main.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["index"]}</a>
						<a href="profile.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["profile"]}</a>
						<a href="clublist.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["club"]}</a>
						<a href="sessionlist.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["session"]}</a>
						<a href="benefit.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["benefit"]}</a>
						<a href="admin.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["admin"]}</a>
					</div>
				</div>
			</nav>

			<!-- 手機版頂部簡化導航 -->
			<nav class="bg-zinc-800 shadow sticky top-0 z-50 md:hidden">
				<div class="px-4 flex justify-between items-center h-14">
					<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
				</div>
			</nav>

			<!-- 手機版置底導航 -->
			<nav class="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700 z-50 md:hidden">
				<div class="flex justify-around items-center h-16">
					<a href="main.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["index"]}</span>
					</a>
					<a href="clublist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["club"]}</span>
					</a>
					<a href="sessionlist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["session"]}</span>
					</a>
					<a href="benefit.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["benefit"]}</span>
					</a>
					<a href="profile.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["profile"]}</span>
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
						<a href="main.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["index"]}</a>
						<a href="profile.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["profile"]}</a>
						<a href="clublist.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["club"]}</a>
						<a href="sessionlist.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["session"]}</a>
						<a href="benefit.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["benefit"]}</a>
					</div>
				</div>
			</nav>

			<!-- 手機版頂部簡化導航 -->
			<nav class="bg-zinc-800 shadow sticky top-0 z-50 md:hidden">
				<div class="px-4 flex justify-center items-center h-14">
					<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
				</div>
			</nav>

			<!-- 手機版置底導航 -->
			<nav class="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700 z-50 md:hidden">
				<div class="flex justify-around items-center h-16">
					<a href="main.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["index"]}</span>
					</a>
					<a href="clublist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["club"]}</span>
					</a>
					<a href="sessionlist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["session"]}</span>
					</a>
					<a href="benefit.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["benefit"]}</span>
					</a>
					<a href="profile.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
						</svg>
						<span class="text-xs mt-1">${TRANSLATE[LANGUAGE]["navigationbar"]["profile"]}</span>
					</a>
				</div>
			</nav>
		`,false)
	}
}else{
	// 未登入版本
	innerhtml("#navigationbar",`
		<!-- 桌面版導航 -->
		<nav class="bg-zinc-800 shadow sticky top-0 z-50 hidden md:block">
			<div class="max-w-6xl mx-auto px-4 flex justify-between items-center h-16">
				<div class="flex items-center space-x-4">
					<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
				</div>
				<div class="flex items-center space-x-4" id="headerlink">
					<a href="signin.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["signin"]}</a>
					<a href="signup.html" class="text-gray-200 hover:text-blue-600">${TRANSLATE[LANGUAGE]["navigationbar"]["signup"]}</a>
				</div>
			</div>
		</nav>

		<!-- 手機版頂部簡化導航 -->
		<nav class="bg-zinc-800 shadow sticky top-0 z-50 md:hidden">
			<div class="px-4 flex justify-between items-center h-14">
				<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
				<div class="flex gap-3">
					<a href="signin.html" class="text-sm text-gray-200 hover:text-emerald-400">${TRANSLATE[LANGUAGE]["navigationbar"]["signin"]}</a>
					<a href="signup.html" class="text-sm text-emerald-500 hover:text-emerald-400">${TRANSLATE[LANGUAGE]["navigationbar"]["signup"]}</a>
				</div>
			</div>
		</nav>
	`,false)
}

addclass("#navigationbar",["sticky","top-0","z-50"])

function loadbackendadminlinks(){
	if(!weblsget(WEBLSNAME+"signin")||!weblsget(WEBLSNAME+"token")){
		return
	}
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(data["success"]&&4<=Number(data["data"]["permission"]||0)){
			let headerlink=document.getElementById("headerlink")
			if(headerlink&&!document.getElementById("contactadminlink")){
				headerlink.insertAdjacentHTML("beforeend",`
					<a id="contactadminlink" href="contactadmin.html" class="text-gray-200 hover:text-blue-600">聯絡訊息</a>
				`)
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

loadbackendadminlinks()

innerhtml("#footer",`
	<footer class="bg-zinc-800 border-t border-black py-8 mt-8">
		<div class="max-w-6xl mx-auto px-4 text-center text-gray-300 text-sm space-y-2">
			<div>&copy; 2025 PokerTrace. All rights reserved.</div>
			<div class="flex justify-center gap-4 text-gray-400">
				<a href="privacy.html" class="hover:text-emerald-400">${TRANSLATE[LANGUAGE]["footer"]["privacy"]}</a>
				<span>|</span>
				<a href="terms.html" class="hover:text-emerald-400">${TRANSLATE[LANGUAGE]["footer"]["terms"]}</a>
				<span>|</span>
				<a href="contact.html" class="hover:text-emerald-400">${TRANSLATE[LANGUAGE]["footer"]["contact"]}</a>
			</div>
			<div class="text-xs text-gray-500">
				系統版本 v1.0.0 | Made with ♠ ♥ ♦ ♣ in Taipei
			</div>
		</div>
	</footer>
`,false)

addclass("html",["h-screen"])

let pagelayoutstyle=document.createElement("style")
pagelayoutstyle.textContent=`
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
`
document.head.appendChild(pagelayoutstyle)

// 手機版添加 padding-bottom 避免內容被置底欄遮擋
if(weblsget(WEBLSNAME+"signin")){
	let style=document.createElement("style")
	style.textContent=`
		@media (max-width: 768px) {
			body {
				padding-bottom: 64px;
			}
		}
	`
	document.head.appendChild(style)
}

function pterror(key){
	let map={
		"ERROR_token_not_found": "登入狀態已失效，請重新登入",
		"ERROR_token_error": "登入狀態已失效，請重新登入",
		"ERROR_no_permission": "沒有操作權限",
		"ERROR_session_not_found": "找不到賽事",
		"ERROR_table_not_found": "找不到牌桌",
		"ERROR_user_not_found": "找不到使用者",
		"ERROR_request_data_not_found": "請確認必填欄位",
		"ERROR_request_data_type_error": "欄位格式不正確",
		"ERROR_already_registered": "此玩家已報名",
		"ERROR_registration_not_found": "找不到報名資料",
		"ERROR_session_relation_not_found": "此賽事尚未設定下一場多日賽",
		"ERROR_session_not_open_for_registration": "此賽事未開放報名",
		"ERROR_cannot_register_own_session": "不能報名自己主辦的賽事",
		"WARNING_rebuycount_exceeded": "重購次數已超過賽事設定，請再次確認"
	}
	return map[key]||key||"操作失敗"
}

function pttoast(message,type){
	let box=document.getElementById("pttoastbox")
	if(!box){
		box=document.createElement("div")
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
	let item=document.createElement("div")
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

function ptconfirm(message,done){
	let cover=document.createElement("div")
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-sm w-full p-5 shadow-xl">
			<div class="text-lg font-semibold text-white mb-3">確認操作</div>
			<div class="text-sm text-zinc-300 mb-5">${pterror(message)}</div>
			<div class="flex justify-end gap-2">
				<button class="ptcancel bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded">取消</button>
				<button class="ptok bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">確認</button>
			</div>
		</div>
	`
	document.body.appendChild(cover)
	cover.querySelector(".ptcancel").addEventListener("click",function(){
		document.body.removeChild(cover)
		if(done){
			done(false)
		}
	})
	cover.querySelector(".ptok").addEventListener("click",function(){
		document.body.removeChild(cover)
		if(done){
			done(true)
		}
	})
}
