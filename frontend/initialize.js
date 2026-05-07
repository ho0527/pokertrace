/*
	製作人員: 賀皓群(小賀) / dc: chris0527 / line: ho960527 / email: chris960527ho@gmail.com / 電話: 0906585605

		|-------    -----    -                     -     -----  -----  -----   -------|
	   |-------    -        -            - - -          -                     -------|
	  |-------    -        -------    -          -     -----    --       --  -------|
	 |-------    -        -     -    -          -         -      --     --  -------|
	|-------    -----    -     -    -          -     -----         -----  -------|

	無授權禁止拷貝使用!
*/

const WEBLSNAME="project00061-"
const AJAXURL=(location.origin=="https://pokertrace.chrisho.ggff.net")?"/backendapi/":"/project00061/"
const ERRORLIST={
	"ERROR_request_mimes_type_error": "檔案需為圖片",
	"ERROR_request_data_not_found": "缺少必填資料",
	"ERROR_request_data_type_error": "資料型態錯誤",
	"ERROR_password_error": "密碼錯誤",
	"ERROR_username_error": "使用者名稱錯誤",
	"ERROR_username_exist": "使用者名稱已存在",
	"ERROR_token_error": "token錯誤",
	"ERROR_token_not_found": "找不到token",
	"ERROR_no_permission": "沒有權限",
	"ERROR_user_not_found": "找不到使用者",
	"ERROR_session_not_found": "找不到場次",
	"ERROR_product_not_found": "找不到此商品",
	"ERROR_phone_exist": "手機號碼已存在",
	"ERROR_email_exist": "電子郵件已存在"
}

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
						<a href="main.html" class="text-gray-200 hover:text-blue-600">首頁</a>
						<a href="main.html" class="text-gray-200 hover:text-blue-600">個人資料</a>
						<a href="clublist.html" class="text-gray-200 hover:text-blue-600">協會管理</a>
						<a href="sessionlist.html" class="text-gray-200 hover:text-blue-600">場次列表</a>
						<a href="benefit.html" class="text-gray-200 hover:text-blue-600">收益折線圖</a>
						<a href="admin.html" class="text-gray-200 hover:text-blue-600">管理後台</a>
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
						<span class="text-xs mt-1">首頁</span>
					</a>
					<a href="clublist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
						</svg>
						<span class="text-xs mt-1">協會</span>
					</a>
					<a href="sessionlist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
						</svg>
						<span class="text-xs mt-1">場次</span>
					</a>
					<a href="benefit.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
						</svg>
						<span class="text-xs mt-1">收益</span>
					</a>
					<a href="profile.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
						</svg>
						<span class="text-xs mt-1">管理</span>
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
						<a href="main.html" class="text-gray-200 hover:text-blue-600">首頁</a>
						<a href="profile.html" class="text-gray-200 hover:text-blue-600">個人資料</a>
						<a href="clublist.html" class="text-gray-200 hover:text-blue-600">協會管理</a>
						<a href="sessionlist.html" class="text-gray-200 hover:text-blue-600">場次列表</a>
						<a href="benefit.html" class="text-gray-200 hover:text-blue-600">收益折線圖</a>
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
						<span class="text-xs mt-1">首頁</span>
					</a>
					<a href="clublist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
						</svg>
						<span class="text-xs mt-1">協會</span>
					</a>
					<a href="sessionlist.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
						</svg>
						<span class="text-xs mt-1">場次</span>
					</a>
					<a href="benefit.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
						</svg>
						<span class="text-xs mt-1">收益</span>
					</a>
					<a href="profile.html" class="flex flex-col items-center justify-center flex-1 text-gray-400 hover:text-emerald-400 transition-colors py-1">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
						</svg>
						<span class="text-xs mt-1">個人</span>
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
					<a href="signin.html" class="text-gray-200 hover:text-blue-600">登入</a>
					<a href="signup.html" class="text-gray-200 hover:text-blue-600">註冊</a>
				</div>
			</div>
		</nav>

		<!-- 手機版頂部簡化導航 -->
		<nav class="bg-zinc-800 shadow sticky top-0 z-50 md:hidden">
			<div class="px-4 flex justify-between items-center h-14">
				<img src="../material/icon/logo.png" alt="logo" class="h-10 inline-block mr-2" draggable="false">
				<div class="flex gap-3">
					<a href="signin.html" class="text-sm text-gray-200 hover:text-emerald-400">登入</a>
					<a href="signup.html" class="text-sm text-emerald-500 hover:text-emerald-400">註冊</a>
				</div>
			</div>
		</nav>
	`,false)
}

addclass("#navigationbar",["sticky","top-0","z-50"])

innerhtml("#footer",`
	<footer class="bg-zinc-800 border-t border-black py-8 mt-8">
		<div class="max-w-6xl mx-auto px-4 text-center text-gray-300 text-sm space-y-2">
			<div>&copy; 2025 PokerTrace. All rights reserved.</div>
			<div class="flex justify-center gap-4 text-gray-400">
				<a href="#" class="hover:text-emerald-400">隱私權政策</a>
				<span>|</span>
				<a href="#" class="hover:text-emerald-400">服務條款</a>
				<span>|</span>
				<a href="#" class="hover:text-emerald-400">聯絡我們</a>
			</div>
			<div class="text-xs text-gray-500">
				系統版本 v1.0.0 | Made with ♠ ♥ ♦ ♣ in Taipei
			</div>
		</div>
	</footer>
`,false)

addclass("html",["h-screen"])

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