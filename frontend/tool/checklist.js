// 每個 section / item 的 "key" 是 localStorage 的穩定識別碼，不要改名或重複；
// 之後新增、刪除或調整項目順序時，使用者已勾選的狀態才不會錯位到別的項目。
let CHECKSECTIONS=[
	{
		"key":"before",
		titleZh:"開賽前",titleEn:"Before Start",
		items:[
			{"key":"blind",zh:"確認盲注結構與時鐘設定",en:"Confirm blind structure and clock"},
			{"key":"payout",zh:"確認獎金結構與保底",en:"Confirm payout structure and guarantee"},
			{"key":"chip",zh:"備妥起始計分牌與發牌員",en:"Prepare starting chips and dealers"},
			{"key":"seat",zh:"座位抽籤與桌號公告",en:"Seat draw and table number posting"},
			{"key":"cashier",zh:"報名收款與對帳準備",en:"Registration cashiering ready"},
			{"key":"latereg",zh:"公告 late reg 與休息時間",en:"Announce late reg and break times"}
		]
	},
	{
		"key":"during",
		titleZh:"進行中",titleEn:"During Event",
		items:[
			{"key":"raise",zh:"準時升盲與公告級數",en:"Raise blinds on time and announce levels"},
			{"key":"track",zh:"追蹤報名人數與獎池",en:"Track entries and prize pool"},
			{"key":"balance",zh:"併桌 / 破桌與桌位平衡",en:"Table breaks and seat balancing"},
			{"key":"chiprace",zh:"處理 chip race 與換色",en:"Handle chip race and color-up"},
			{"key":"dispute",zh:"記錄爭議與處罰",en:"Log disputes and penalties"},
			{"key":"latereg",zh:"確認 late reg 截止與 addon",en:"Confirm late reg close and add-on"}
		]
	},
	{
		"key":"after",
		titleZh:"收場後",titleEn:"After Event",
		items:[
			{"key":"result",zh:"確認最終名次與獎金發放",en:"Confirm final results and payouts"},
			{"key":"cash",zh:"現場收款結算與對帳",en:"Reconcile cash and cashiering"},
			{"key":"tip",zh:"小費分配與人員結算",en:"Tip split and staff settlement"},
			{"key":"venue",zh:"場地與器材歸位",en:"Reset venue and equipment"},
			{"key":"report",zh:"記錄場次數據與回報",en:"Record event stats and report"}
		]
	}
]

function cktext(key){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["checklistpage"]&&TRANSLATE[LANGUAGE]["checklistpage"][key]){
		return TRANSLATE[LANGUAGE]["checklistpage"][key]
	}
	return key
}

function ckstoragekey(){
	return WEBLSNAME+"toolcheckliststate"
}

function loadckstate(){
	try{
		let raw=localStorage.getItem(ckstoragekey())||"{}"
		let data=JSON.parse(raw)
		if(data&&typeof data=="object"){
			return data
		}
	}catch(error){
	}
	return {}
}

function saveckstate(){
	let boxes=document.querySelectorAll("[data-ckitem]")
	let data={}
	for(let i=0;i<boxes.length;i=i+1){
		data[boxes[i].getAttribute("data-ckitem")]=boxes[i].checked
	}
	localStorage.setItem(ckstoragekey(),JSON.stringify(data))
}

function applyckstate(){
	let data=loadckstate()
	let boxes=document.querySelectorAll("[data-ckitem]")
	for(let i=0;i<boxes.length;i=i+1){
		let key=boxes[i].getAttribute("data-ckitem")
		if(data[key]==true){
			boxes[i].checked=true
		}
	}
}

function updateckprogress(){
	let boxes=document.querySelectorAll("[data-ckitem]")
	let done=0
	for(let i=0;i<boxes.length;i=i+1){
		if(boxes[i].checked){
			done=done+1
		}
	}
	let pct=(function(){if(boxes.length>0){return Math.round(done/boxes.length*100)}return 0})()
	innertext("#ckprogress",done+" / "+boxes.length+" ("+pct+"%)",false)
	saveckstate()
}

function resetckstate(){
	localStorage.removeItem(ckstoragekey())
	let boxes=document.querySelectorAll("[data-ckitem]")
	for(let i=0;i<boxes.length;i=i+1){
		boxes[i].checked=false
	}
	updateckprogress()
}

function renderck(){
	let html=""
	for(let s=0;s<CHECKSECTIONS.length;s=s+1){
		let sec=CHECKSECTIONS[s]
		let title=(function(){if(LANGUAGE=="en"){return sec.titleEn}return sec.titleZh})()
		html=html+`<div><div class="mb-2 text-lg font-extrabold text-white">${title}</div><div class="space-y-2">`
		for(let i=0;i<sec.items.length;i=i+1){
			let item=sec.items[i]
			let label=(function(){if(LANGUAGE=="en"){return item.en}return item.zh})()
			html=html+`
				<label class="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 cursor-pointer">
					<input type="checkbox" data-ckitem="${sec["key"]}-${item["key"]}" class="h-5 w-5 accent-emerald-500">
					<span class="text-zinc-200">${label}</span>
				</label>
			`
		}
		html=html+`</div></div>`
	}
	innerhtml("#ckbody",html,false)
	applyckstate()
	let boxes=document.querySelectorAll("[data-ckitem]")
	for(let i=0;i<boxes.length;i=i+1){
		boxes[i].addEventListener("change",updateckprogress)
	}
	updateckprogress()
}

function applycklanguage(){
	document.title=cktext("title")+" - PokerTrace"
	innertext("#cktitle",cktext("title"),false)
	innertext("#back",cktext("back"),false)
	innertext("#ckprogresslabel",cktext("progress"),false)
	value("#ckreset",cktext("reset"))
	innertext("#cknote",cktext("note"),false)
	renderck()
}

onclick("#ckreset",resetckstate)

applycklanguage()
