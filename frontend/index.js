let signedin=weblsget(WEBLSNAME+"signin")
let githuburl="https://github.com/"

function actionhtml(){
	let primary=signedin?["場次列表","sessionlist.html"]:["登入","signin.html"]
	let secondary=signedin?["新增賽事","newsession.html"]:["註冊","signup.html"]
	return `
		<a href="${primary[1]}" class="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-5 py-3 rounded">${primary[0]}</a>
		<a href="${githuburl}" target="_blank" rel="noopener" class="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-bold px-5 py-3 rounded">GitHub</a>
		<a href="${secondary[1]}" class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 font-bold px-5 py-3 rounded">${secondary[0]}</a>
	`
}

function renderhomeactions(){
	innerhtml("#homeactions",actionhtml(),false)
	innerhtml("#bottomactions",actionhtml(),false)
}

function renderfeatures(){
	let features=[
		["完全免費","核心功能不收費，適合社群、朋友局、小型錦標賽與想自己管理資料的主辦。"],
		["無廣告干擾","頁面專注在報名、座位、計時器與結果紀錄，不用在操作中被廣告打斷。"],
		["開源透明","可以從 GitHub 查看原始碼，自行部署，也能依照自己的賽事流程調整。"],
		["賽事設定","主辦牌局、使用者連結、開放報名、買入與重購設定集中管理。"],
		["報名清單","8 格玩家 ID 搜尋、模糊查詢、直接報名、序號與狀態追蹤。"],
		["座位安排","支援未入座補位、選取玩家重排，以及全部桌平均排座。"],
		["多日賽晉級","Day1 到 Day2/Day3 的關聯、晉級籌碼與重複晉級次數。"],
		["計時器","盲注級別、休息、chip raise、報名截止與顯示端同步。"]
	]
	let html=""
	for(let i=0;i<features.length;i=i+1){
		html=html+`
			<div class="border border-zinc-800 bg-zinc-900 rounded p-4">
				<div class="font-bold">${features[i][0]}</div>
				<div class="text-sm text-zinc-400 mt-2 leading-6">${features[i][1]}</div>
			</div>
		`
	}
	innerhtml("#featurelist",html,false)
}

renderhomeactions()
renderfeatures()
