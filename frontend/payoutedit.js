"use strict"

let state={}
let sessionid=new URLSearchParams(location.search).get("sessionid")
let savebusy=false
let PAYOUTCOLOR="#cbd5e1"
let leaveguard=bindleaveguard()

if(!sessionid){
	location.href="sessionlist.html"
}

function payoutedittext(key,fallback){
	let language=weblsget(WEBLSNAME+"language",false)
	if(!language){
		language="zhtw"
	}
	if(TRANSLATE[language]&&TRANSLATE[language]["payouteditpage"]&&TRANSLATE[language]["payouteditpage"][key]!=undefined){
		return TRANSLATE[language]["payouteditpage"][key]
	}
	if(TRANSLATE["en"]&&TRANSLATE["en"]["payouteditpage"]&&TRANSLATE["en"]["payouteditpage"][key]!=undefined){
		return TRANSLATE["en"]["payouteditpage"][key]
	}
	return fallback
}

function safetext(value){
	let text=value
	if(value==undefined||value==null){
		text=""
	}
	return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

function gettoken(){
	return weblsget(WEBLSNAME+"token")
}

function applystatictext(){
	document.title=payoutedittext("title","編輯名次")+" - Poker Clock"
	domgetid("btnBack").textContent=payoutedittext("back","返回控制台")
	domgetid("btnSavePayout").value=payoutedittext("save","儲存名次")
	domgetid("quickTitle").textContent=payoutedittext("quicktitle","快速新增")
	domgetid("quickRankLabel").textContent=payoutedittext("quickranklabel","名次範圍")
	domgetid("quickRank").placeholder=payoutedittext("quickrankplaceholder","1 或 1-10")
	domgetid("quickRank").setAttribute("aria-label",payoutedittext("quickrankaria","名次範圍"))
	domgetid("btnAddPayout").value=payoutedittext("add","新增")
	domgetid("quickCashLabel").textContent=payoutedittext("quickcashlabel","獎金")
	domgetid("quickCash").placeholder=payoutedittext("quickcashplaceholder","獎金金額")
	domgetid("quickCash").setAttribute("aria-label",payoutedittext("quickcasharia","獎金"))
	domgetid("quickReward").placeholder=payoutedittext("quickrewardplaceholder","獎項（可留空）")
	domgetid("quickReward").setAttribute("aria-label",payoutedittext("quickrewardaria","獎項"))
	domgetid("quickHintText").textContent=payoutedittext("quickhint","可輸入單一名次或範圍，例如 1-10。獎金為現金金額，會列入總和；獎項可留空，若填了會與獎金一起顯示成「獎金＋獎項」。")
	domgetid("genTitle").textContent=payoutedittext("gentitle","快速產生")
	domgetid("genPlacesLabel").textContent=payoutedittext("genplaceslabel","獲獎名次")
	domgetid("genPlaces").setAttribute("aria-label",payoutedittext("genplacesaria","獲獎名次數"))
	domgetid("genPoolLabel").textContent=payoutedittext("genpoollabel","總獎池（選填）")
	domgetid("genPool").setAttribute("aria-label",payoutedittext("genpoolaria","總獎池"))
	domgetid("genSteepLabel").textContent=payoutedittext("gensteeplabel","集中度")
	domgetid("genSteep").setAttribute("aria-label",payoutedittext("gensteeparia","集中度"))
	domgetid("genRoundLabel").textContent=payoutedittext("genroundlabel","現金取整")
	domgetid("genRound").setAttribute("aria-label",payoutedittext("genroundaria","現金取整"))
	domgetid("genMinLabel").textContent=payoutedittext("genminlabel","最低獎金")
	domgetid("genMin").setAttribute("aria-label",payoutedittext("genminaria","最低獎金"))
	domgetid("btnGenPayout").value=payoutedittext("genbtn","產生獎金分配")
	domgetid("genHintText").textContent=payoutedittext("genhint","依名次數自動鋪一條前重後輕的獎金曲線。總獎池預設帶入控制台計算出的獎池，可自行覆蓋。集中度越小越集中於前段（例如 0.6 冠軍佔比更高）。填總獎池時自動換算現金填入獎金並補足尾差到冠軍；留空則只建立名次、不填獎金。最低獎金可設定墊底名次的下限（例如 2000），低於此值的名次會拉到最低，差額由其餘名次重新分攤。產生會取代目前所有名次。")
	domgetid("editTitle").textContent=payoutedittext("edittitle","名次設定")
	domgetid("headRank").textContent=payoutedittext("headrank","名次")
	domgetid("headCash").textContent=payoutedittext("headcash","獎金")
	domgetid("headReward").textContent=payoutedittext("headreward","獎項")
	domgetid("headAction").textContent=payoutedittext("headaction","操作")
	domgetid("otherRewardTitle").textContent=payoutedittext("otherrewardtitle","其他獎勵")
	domgetid("headOtherLabel").textContent=payoutedittext("headrank","名次")
	domgetid("headOtherCash").textContent=payoutedittext("headcash","獎金")
	domgetid("headOtherReward").textContent=payoutedittext("headreward","獎項")
	domgetid("headOtherAction").textContent=payoutedittext("headaction","操作")
	domgetid("btnAddOtherReward").value=payoutedittext("otherrewardadd","新增一列")
	domgetid("otherRewardHint").textContent=payoutedittext("otherrewardhint","用來記錄與名次無關的獎勵，例如賞金（bounty）、首殺獎、幸運獎。「名次」那格請自行填寫標籤文字。這裡填的獎金會計入場次頁的總獎金，但不會與名次比對，也不會自動分配給特定選手。")
	domgetid("ioTitle").textContent=payoutedittext("ioutitle","匯入匯出")
	domgetid("btnExportPayout").value=payoutedittext("exportjson","匯出 JSON")
	domgetid("btnImportPayout").value=payoutedittext("importjson","匯入 JSON")
	domgetid("importFileLabel").textContent=payoutedittext("importfile","匯入檔案")
	domgetid("payoutJsonText").placeholder=payoutedittext("jsonplaceholder","匯出的名次 JSON 會顯示在這裡，也可以貼上 JSON 後按匯入。")
	domgetid("payoutJsonText").setAttribute("aria-label",payoutedittext("jsonaria","名次 JSON"))
	domgetid("syncText").textContent=payoutedittext("loading","讀取中")
	domgetid("lastAction").textContent=payoutedittext("ready","就緒")
}

function showtoast(message,type){
	let box=domgetid("toast")
	box.textContent=message
	box.className="toast show"+(type?" "+type:"")
	clearTimeout(box.tm)
	box.tm=setTimeout(function(){
		box.classList.remove("show")
	},1800)
}

function updatesync(ok,text){
	let dot=domgetid("syncDot")
	let label=domgetid("syncText")
	if(!ok){
		dot.classList.add("off")
	}else{
		dot.classList.remove("off")
	}
	label.textContent=text
}

function setenabled(enabled){
	let list=document.querySelectorAll("button,input,select,textarea")
	for(let i=0;i<list.length;i=i+1){
		list[i].disabled=!enabled
	}
}

function prizepool(){
	if(state.prizePoolMode=="manual"){
		return parseFloat(state.prizePoolManual)||0
	}
	let pool=(parseFloat(state.buyin)||0)*(parseFloat(state.totalEntries)||0)
	pool=pool+(parseFloat(state.prizePoolCarryover)||0)
	if(pool<(parseFloat(state.guaranteedPrize)||0)){
		pool=parseFloat(state.guaranteedPrize)||0
	}
	return pool
}

function applypooldefault(){
	let pool=prizepool()
	if(pool>0){
		domgetid("genPool").value=Math.round(pool)
	}
}

function totallevels(){
	let schedule=state.schedule||[]
	let count=0
	for(let i=0;i<schedule.length;i=i+1){
		if(schedule[i].type=="level"){
			count=count+1
		}
	}
	return count
}

function levelnumof(index){
	let schedule=state.schedule||[]
	let count=0
	for(let i=0;i<=index&&i<schedule.length;i=i+1){
		if(schedule[i]&&schedule[i].type=="level"){
			count=count+1
		}
	}
	return count
}

function renderheader(){
	let current=(state.schedule||[])[state.currentIndex]
	domgetid("tournName").textContent=state.tournName||payoutedittext("heading","編輯名次")
	domgetid("tournSub").textContent=state.subtitle||payoutedittext("subtitledefault","PAYOUT EDIT")
	domgetid("hLv").textContent=current?levelnumof(state.currentIndex):"—"
	domgetid("hLvMax").textContent=totallevels()
	if(state.regClosed){
		domgetid("regBadge").className="reg-badge reg-closed"
		domgetid("regBadge").textContent=payoutedittext("regclosed","REG CLOSED")
	}else{
		domgetid("regBadge").className="reg-badge reg-open"
		domgetid("regBadge").textContent=payoutedittext("regopen","REG OPEN")
	}
}

function ranktextclean(value,fallback){
	let text=String(value||"").trim()
	text=text.replace(/[－–—]/g,"-")
	text=text.replace(/\s+/g,"")
	if(text==""){
		text=String(fallback)
	}
	return text
}

function cleanpayoutitem(item,index){
	let cash=parseFloat(item["cash"])
	if(isNaN(cash)){
		cash=0
	}
	let pct=parseFloat(item["pct"])
	if(isNaN(pct)){
		pct=0
	}
	let reward=String(item["reward"]||"").trim()
	if(cash==0&&reward!=""&&/^[0-9.,\s]+$/.test(reward)){
		// 舊資料把現金塞在 reward（純數字）→ 轉進獎金欄位，reward 只留獎項文字
		let legacy=parseFloat(reward.replace(/[,\s]/g,""))
		if(!isNaN(legacy)){
			cash=legacy
			reward=""
		}
	}
	// 保留 pct：舊資料可能只有百分比沒有 cash，先留著讓 fillcashfrompct 依獎池換算，
	// 換算不到獎池時也不能丟，儲存路徑會原樣送回避免把獎金歸零。
	return {
		rank: ranktextclean(item["rank"],index+1),
		cash: cash,
		pct: pct,
		reward: reward,
		color: PAYOUTCOLOR
	}
}

function payoutpcttotal(payouts){
	let total=0
	for(let i=0;i<payouts.length;i=i+1){
		total=total+(parseFloat(payouts[i].pct)||0)
	}
	return total
}

function fillcashfrompct(payouts){
	// 舊資料只有 pct 百分比、沒有 cash：優先依當前獎池把 pct 換算成 cash 填入編輯器，
	// 與 payoutedit 的現金模型一致、使用者可見可調（方案 a）。取不到獎池（pool<=0）時
	// 保留 pct 原樣不換算（方案 b），儲存時再原樣送回，避免「開啟舊資料直接儲存」把獎金歸零。
	let list=payouts||[]
	let pool=prizepool()
	let totalpct=payoutpcttotal(list)
	for(let i=0;i<list.length;i=i+1){
		let item=list[i]
		let reward=String(item.reward||"").trim()
		let numericreward=reward!=""&&/^[0-9.,\s]+$/.test(reward)
		let pct=parseFloat(item.pct)||0
		if((parseFloat(item.cash)||0)<=0&&!numericreward&&pct>0&&pool>0){
			let amount=0
			if(totalpct<=1.5){
				amount=Math.round(pool*pct)
			}else{
				amount=Math.round(pool*pct/100)
			}
			item.cash=amount
			item.pct=0
		}
	}
	return list
}

function cleanpayoutlist(input){
	let source=input
	if(input&&input["payouts"]){
		source=input["payouts"]
	}
	if(!Array.isArray(source)){
		return null
	}
	let output=[]
	for(let i=0;i<source.length;i=i+1){
		output.push(cleanpayoutitem(source[i],i))
	}
	return output
}

function readpayouteditor(){
	let rows=document.querySelectorAll("[data-payout-row]")
	let payouts=[]
	for(let i=0;i<rows.length;i=i+1){
		let row=rows[i]
		let cash=parseFloat(row.querySelector("[data-edit-k=\"cash\"]").value)
		if(isNaN(cash)){
			cash=0
		}
		let reward=String(row.querySelector("[data-edit-k=\"reward\"]").value||"").trim()
		let item={
			rank: ranktextclean(row.querySelector("[data-edit-k=\"rank\"]").value,i+1),
			cash: cash,
			reward: reward,
			color: PAYOUTCOLOR
		}
		// 方案 b 保留下來的舊 pct（換算不到獎池才會有）：使用者沒填現金也沒填數字獎項時，
		// 原樣送回 pct，避免儲存把 pct 併同 cash 一起歸零、讓下游獎金 fallback 全斷。
		let origpct=parseFloat(row.getAttribute("data-orig-pct"))
		if(isNaN(origpct)){
			origpct=0
		}
		let numericreward=reward!=""&&/^[0-9.,\s]+$/.test(reward)
		if(cash<=0&&!numericreward&&origpct>0){
			item.pct=origpct
		}
		payouts.push(item)
	}
	state.payouts=payouts
	// 其他獎勵是不綁名次的自由標籤記錄(例如 bounty), 與 payouts 一起讀回 state,
	// 這樣移動 / 複製 / 刪除名次列時重繪編輯器也不會把使用者打到一半的內容弄丟。
	readotherrewardeditor()
}

// 其他獎勵: 三欄 label / cash / reward, label 是使用者自由填的文字(不是名次數字或範圍)。
// 這份清單純粹是記錄, 不參與任何自動獎金計算: 不進後端 sessionplayer._payoutamount,
// 不列入獎金總和 / 獎池, 也不與名次比對。
function cleanotherrewarditem(item){
	let source=item
	if(!source){
		source={}
	}
	let cash=parseFloat(source["cash"])
	if(isNaN(cash)){
		cash=0
	}
	return {
		label: String(source["label"]||"").trim(),
		cash: cash,
		reward: String(source["reward"]||"").trim()
	}
}

function cleanotherrewardlist(input){
	let source=input
	// 相容: 舊值是單一純文字(非陣列), 轉成一列 label="其他" 的記錄, 不丟資料。
	if(typeof source=="string"){
		let text=source.trim()
		source=[]
		if(text!=""){
			source=[{"label": payoutedittext("otherrewardlegacylabel","其他"),"cash": 0,"reward": text}]
		}
	}
	if(!Array.isArray(source)){
		return []
	}
	let output=[]
	for(let i=0;i<source.length;i=i+1){
		output.push(cleanotherrewarditem(source[i]))
	}
	return output
}

function readotherrewardeditor(){
	let rows=document.querySelectorAll("[data-other-row]")
	let list=[]
	for(let i=0;i<rows.length;i=i+1){
		let row=rows[i]
		let cash=parseFloat(row.querySelector("[data-edit-k=\"cash\"]").value)
		if(isNaN(cash)){
			cash=0
		}
		list.push({
			label: String(row.querySelector("[data-edit-k=\"label\"]").value||"").trim(),
			cash: cash,
			reward: String(row.querySelector("[data-edit-k=\"reward\"]").value||"").trim()
		})
	}
	state.otherReward=list
}

function buildotherrewardeditor(){
	let list=cleanotherrewardlist(state.otherReward)
	state.otherReward=list
	let box=domgetid("otherRewardList")
	let html=""
	for(let i=0;i<list.length;i=i+1){
		let item=list[i]
		html=html+`
			<div class="payout-edit-row" data-other-row="${i}">
				<input class="txt" data-edit-k="label" type="text" value="${safetext(item.label)}" placeholder="${safetext(payoutedittext("otherrewardlabelplaceholder","Bounty"))}">
				<input class="txt" data-edit-k="cash" type="number" min="0" step="0.01" value="${item.cash>0?item.cash:""}" placeholder="${safetext(payoutedittext("rowcashplaceholder","獎金"))}" inputmode="decimal">
				<input class="txt" data-edit-k="reward" type="text" value="${safetext(item.reward)}" placeholder="${safetext(payoutedittext("otherrewardrewardplaceholder","獎品（可留空）"))}">
				<div class="struct-actions">
					<input type="button" class="ico-btn" data-other-up="${i}" value="↑" title="${safetext(payoutedittext("moveup","上移"))}">
					<input type="button" class="ico-btn" data-other-down="${i}" value="↓" title="${safetext(payoutedittext("movedown","下移"))}">
					<input type="button" class="ico-btn" data-other-copy="${i}" value="⧉" title="${safetext(payoutedittext("copy","複製"))}">
					<input type="button" class="ico-btn del" data-other-del="${i}" value="×" title="${safetext(payoutedittext("delete","刪除"))}">
				</div>
			</div>
		`
	}
	if(html==""){
		html=`<div style="color:#666;font-size:12px">${safetext(payoutedittext("otherrewardempty","尚無其他獎勵。"))}</div>`
	}
	box.innerHTML=html
	let uplist=box.querySelectorAll("[data-other-up]")
	for(let i=0;i<uplist.length;i=i+1){
		uplist[i].addEventListener("click",function(){
			readotherrewardeditor()
			let index=parseInt(this.dataset.otherUp,10)
			if(0<index){
				let temp=state.otherReward[index-1]
				state.otherReward[index-1]=state.otherReward[index]
				state.otherReward[index]=temp
				buildotherrewardeditor()
			}
		})
	}
	let downlist=box.querySelectorAll("[data-other-down]")
	for(let i=0;i<downlist.length;i=i+1){
		downlist[i].addEventListener("click",function(){
			readotherrewardeditor()
			let index=parseInt(this.dataset.otherDown,10)
			if(index<state.otherReward.length-1){
				let temp=state.otherReward[index+1]
				state.otherReward[index+1]=state.otherReward[index]
				state.otherReward[index]=temp
				buildotherrewardeditor()
			}
		})
	}
	let copylist=box.querySelectorAll("[data-other-copy]")
	for(let i=0;i<copylist.length;i=i+1){
		copylist[i].addEventListener("click",function(){
			readotherrewardeditor()
			let index=parseInt(this.dataset.otherCopy,10)
			let item=JSON.parse(JSON.stringify(state.otherReward[index]))
			state.otherReward.splice(index+1,0,item)
			buildotherrewardeditor()
		})
	}
	let dellist=box.querySelectorAll("[data-other-del]")
	for(let i=0;i<dellist.length;i=i+1){
		dellist[i].addEventListener("click",function(){
			readotherrewardeditor()
			let index=parseInt(this.dataset.otherDel,10)
			state.otherReward.splice(index,1)
			buildotherrewardeditor()
		})
	}
}

function rankplaces(text){
	let value=String(text||"").trim().replace(/[－–—]/g,"-").replace(/\s+/g,"")
	let match=value.match(/^(\d+)-(\d+)$/)
	if(match){
		let a=parseInt(match[1],10)
		let b=parseInt(match[2],10)
		if(!isNaN(a)&&!isNaN(b)&&b>=a){
			return b-a+1
		}
	}
	return 1
}

function updatepayoutsum(){
	let rows=document.querySelectorAll("[data-payout-row]")
	let places=0
	let cashtotal=0
	let noncash=0
	let champion=""
	for(let i=0;i<rows.length;i=i+1){
		let row=rows[i]
		let count=rankplaces(row.querySelector("[data-edit-k=\"rank\"]").value)
		places=places+count
		let cash=parseFloat(row.querySelector("[data-edit-k=\"cash\"]").value)
		if(isNaN(cash)){
			cash=0
		}
		let reward=String(row.querySelector("[data-edit-k=\"reward\"]").value||"").trim()
		cashtotal=cashtotal+cash*count
		if(cash<=0&&reward!=""){
			noncash=noncash+count
		}
		if(i==0){
			let head=[]
			if(cash>0){
				head.push("$"+Math.round(cash).toLocaleString())
			}
			if(reward!=""){
				head.push(reward)
			}
			champion=head.join("＋")
		}
	}
	let box=domgetid("payoutSum")
	box.textContent=payoutedittext("sumprefix","獎金總和：$")+Math.round(cashtotal).toLocaleString()
	box.style.color="#9ca3af"
	let preview=domgetid("payoutPreview")
	if(preview){
		let parts=[payoutedittext("previewplacesprefix","獲獎 ")+places+payoutedittext("previewplacessuffix"," 名")]
		if(cashtotal>0){
			parts.push(payoutedittext("previewcashprefix","現金合計 $")+Math.round(cashtotal).toLocaleString())
		}
		if(champion!=""){
			parts.push(payoutedittext("previewchampionprefix","冠軍 ")+champion)
		}
		if(noncash>0){
			parts.push(payoutedittext("previewnoncashprefix","含 ")+noncash+payoutedittext("previewnoncashsuffix"," 名純獎項"))
		}
		preview.textContent=rows.length?parts.join(" · "):""
	}
}

function buildpayouteditor(){
	renderheader()
	let payouts=state.payouts||[]
	let box=domgetid("payoutEditList")
	let html=""
	for(let i=0;i<payouts.length;i=i+1){
		let item=cleanpayoutitem(payouts[i],i)
		html=html+`
			<div class="payout-edit-row" data-payout-row="${i}" data-orig-pct="${parseFloat(item.pct)||0}">
				<input class="txt" data-edit-k="rank" type="text" value="${safetext(item.rank)}" placeholder="${safetext(payoutedittext("rowrankplaceholder","1 或 1-10"))}">
				<input class="txt" data-edit-k="cash" type="number" min="0" step="0.01" value="${item.cash>0?item.cash:""}" placeholder="${safetext(payoutedittext("rowcashplaceholder","獎金"))}" inputmode="decimal">
				<input class="txt" data-edit-k="reward" type="text" value="${safetext(item.reward)}" placeholder="${safetext(payoutedittext("rowrewardplaceholder","晉級 / 獲票（可留空）"))}">
				<div class="struct-actions">
					<input type="button" class="ico-btn" data-up="${i}" value="↑" title="${safetext(payoutedittext("moveup","上移"))}">
					<input type="button" class="ico-btn" data-down="${i}" value="↓" title="${safetext(payoutedittext("movedown","下移"))}">
					<input type="button" class="ico-btn" data-copy="${i}" value="⧉" title="${safetext(payoutedittext("copy","複製"))}">
					<input type="button" class="ico-btn del" data-del="${i}" value="×" title="${safetext(payoutedittext("delete","刪除"))}">
				</div>
			</div>
		`
	}
	if(html==""){
		html=`<div style="color:#666;font-size:12px">${safetext(payoutedittext("emptylist","尚無名次設定。"))}</div>`
	}
	box.innerHTML=html
	let sumlist=box.querySelectorAll("[data-edit-k=\"cash\"],[data-edit-k=\"reward\"]")
	for(let i=0;i<sumlist.length;i=i+1){
		sumlist[i].addEventListener("input",updatepayoutsum)
	}
	let uplist=box.querySelectorAll("[data-up]")
	for(let i=0;i<uplist.length;i=i+1){
		uplist[i].addEventListener("click",function(){
			readpayouteditor()
			let index=parseInt(this.dataset.up,10)
			if(0<index){
				let temp=state.payouts[index-1]
				state.payouts[index-1]=state.payouts[index]
				state.payouts[index]=temp
				buildpayouteditor()
			}
		})
	}
	let downlist=box.querySelectorAll("[data-down]")
	for(let i=0;i<downlist.length;i=i+1){
		downlist[i].addEventListener("click",function(){
			readpayouteditor()
			let index=parseInt(this.dataset.down,10)
			if(index<state.payouts.length-1){
				let temp=state.payouts[index+1]
				state.payouts[index+1]=state.payouts[index]
				state.payouts[index]=temp
				buildpayouteditor()
			}
		})
	}
	let copylist=box.querySelectorAll("[data-copy]")
	for(let i=0;i<copylist.length;i=i+1){
		copylist[i].addEventListener("click",function(){
			readpayouteditor()
			let index=parseInt(this.dataset.copy,10)
			let item=JSON.parse(JSON.stringify(state.payouts[index]))
			state.payouts.splice(index+1,0,item)
			buildpayouteditor()
		})
	}
	let dellist=box.querySelectorAll("[data-del]")
	for(let i=0;i<dellist.length;i=i+1){
		dellist[i].addEventListener("click",function(){
			readpayouteditor()
			let index=parseInt(this.dataset.del,10)
			state.payouts.splice(index,1)
			buildpayouteditor()
		})
	}
	updatepayoutsum()
}

function exportpayouttext(){
	readpayouteditor()
	let data={
		version: 1,
		type: "poker-clock-payout",
		payouts: state.payouts,
		otherReward: cleanotherrewardlist(state.otherReward)
	}
	return JSON.stringify(data,null,4)
}

function importpayouttext(text){
	let parsed=null
	try{
		parsed=JSON.parse(text)
	}catch(error){
		showtoast(payoutedittext("jsonerror","JSON 格式錯誤"),"err")
		return false
	}
	let payouts=cleanpayoutlist(parsed)
	if(!payouts){
		showtoast(payoutedittext("jsonempty","找不到可匯入的名次設定"),"err")
		return false
	}
	state.payouts=fillcashfrompct(payouts)
	// 舊版匯出檔沒有 otherReward, 沒有這個 key 就保留目前畫面上的內容不覆蓋
	if(parsed&&parsed["otherReward"]!=undefined){
		state.otherReward=cleanotherrewardlist(parsed["otherReward"])
		buildotherrewardeditor()
	}
	buildpayouteditor()
	showtoast(payoutedittext("importsuccessprefix","已匯入 ")+payouts.length+payoutedittext("importsuccesssuffix"," 筆名次"))
	return true
}

function downloadpayoutfile(){
	let text=exportpayouttext()
	let blob=new Blob([text],{type:"application/json"})
	let url=URL.createObjectURL(blob)
	let link=doccreate("a")
	link.href=url
	link.download="payout_"+Date.now()+".json"
	document.body.appendChild(link)
	link.click()
	link.remove()
	URL.revokeObjectURL(url)
}

function loadtimer(){
	updatesync(false,payoutedittext("syncloading","讀取中"))
	setenabled(false)
	let loadingid=ptloadingstart("#payoutEditList")
	let requestoption={}
	let token=gettoken()
	if(token){
		requestoption["headers"]={
			"Authorization": "Bearer "+token
		}
	}
	fetch(AJAXURL+"gettimer/"+sessionid,requestoption).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data.success&&data.data&&data.data.state){
			state=data.data.state
			state.payouts=fillcashfrompct(cleanpayoutlist(state.payouts||[])||[])
			buildpayouteditor()
			buildotherrewardeditor()
			applypooldefault()
			updatesync(true,payoutedittext("syncok","已同步"))
			setenabled(true)
		}else{
			updatesync(false,payoutedittext("syncfail","讀取失敗"))
			showtoast(payoutedittext("loadfail","讀取失敗"),"err")
		}
	}).catch(function(){
		updatesync(false,payoutedittext("syncnetwork","網路不佳"))
		showtoast(payoutedittext("networkfail","網路不佳，請重新嘗試"),"err")
	}).finally(function(){
		ptloadingend(loadingid)
	})
}

function savepayout(){
	if(savebusy){
		return
	}
	let token=gettoken()
	if(!token){
		showtoast(payoutedittext("signinagain","請重新登入"),"err")
		return
	}
	readpayouteditor()
	savebusy=true
	setenabled(false)
	updatesync(false,payoutedittext("savesync","儲存中"))
	let loadingid=ptloadingstart("#payoutEditList")
	fetch(AJAXURL+"savetimer/"+sessionid,{
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer "+token
		},
		body: JSON.stringify({
			action: "payout-edit",
			state: {
				payouts: state.payouts,
				otherReward: cleanotherrewardlist(state.otherReward)
			}
		})
	}).then(function(response){
		return response.json()
	}).then(function(data){
		if(data&&data.success&&data.data){
			state=data.data
			state.payouts=fillcashfrompct(cleanpayoutlist(state.payouts||[])||[])
			leaveguard.clear()
			buildpayouteditor()
			buildotherrewardeditor()
			showtoast(payoutedittext("savesuccess","名次已儲存"))
			updatesync(true,payoutedittext("syncok","已同步"))
		}else{
			let message=data&&data.data?data.data:payoutedittext("savefail","儲存失敗")
			showtoast(message,"err")
			updatesync(false,payoutedittext("savefail","儲存失敗"))
		}
	}).catch(function(){
		showtoast(payoutedittext("networkfail","網路不佳，請重新嘗試"),"err")
		updatesync(false,payoutedittext("syncnetwork","網路不佳"))
	}).finally(function(){
		ptloadingend(loadingid)
		savebusy=false
		setenabled(true)
	})
}

domgetid("btnBack").href="control.html?sessionid="+encodeURIComponent(sessionid)

domgetid("btnBack").addEventListener("click",function(event){
	if(event&&event.button!=0){
		return
	}
	if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
		return
	}
	if(!leaveguard.confirmleave()){
		event.preventDefault()
		return
	}
})

domgetid("btnSavePayout").addEventListener("click",function(){
	savepayout()
})

domgetid("btnAddPayout").addEventListener("click",function(){
	readpayouteditor()
	let rank=ranktextclean(domgetid("quickRank").value,state.payouts.length+1)
	let cash=parseFloat(domgetid("quickCash").value)
	if(isNaN(cash)){
		cash=0
	}
	state.payouts.push({
		rank: rank,
		cash: cash,
		reward: String(domgetid("quickReward").value||"").trim(),
		color: PAYOUTCOLOR
	})
	domgetid("quickRank").value=""
	domgetid("quickReward").value=""
	domgetid("quickCash").value=""
	buildpayouteditor()
})

onenterclick("#quickRank,#quickReward,#quickCash",function(){
	click("#btnAddPayout")
})

domgetid("btnAddOtherReward").addEventListener("click",function(){
	readotherrewardeditor()
	state.otherReward.push({
		label: "",
		cash: 0,
		reward: ""
	})
	buildotherrewardeditor()
})

function generatepayouts(){
	let places=parseInt(domgetid("genPlaces").value,10)||0
	let pool=parseFloat(domgetid("genPool").value)||0
	let steep=parseFloat(domgetid("genSteep").value)||0.7
	let step=parseInt(domgetid("genRound").value,10)||0
	let mincash=parseFloat(domgetid("genMin").value)||0
	if(places<=0){
		showtoast(payoutedittext("genplacesrequired","請輸入獲獎名次數"),"err")
		return
	}
	if(places>200){
		places=200
	}
	if(steep<=0||steep>=1){
		steep=0.7
	}
	let existing=document.querySelectorAll("[data-payout-row]").length
	if(existing>0&&!window.confirm(payoutedittext("genconfirm","產生新分配會覆蓋目前所有名次，確定嗎？"))){
		return
	}
	let weights=[]
	for(let i=0;i<places;i=i+1){
		weights.push(Math.pow(steep,i))
	}
	let payouts=[]
	if(pool>0){
		// 先以權重算原始分配，再把低於最低獎金的名次拉到最低，
		// 不足的部分由剩餘名次依權重重新分攤（可能連鎖，故迭代處理）。
		let raw=[]
		let floored=[]
		for(let i=0;i<places;i=i+1){
			raw.push(0)
			floored.push(false)
		}
		if(mincash>0&&pool<mincash*places){
			// 獎池不足以讓每個名次都達到最低，只能平均分配
			for(let i=0;i<places;i=i+1){
				raw[i]=pool/places
			}
		}else{
			let guard=0
			while(guard<=places+2){
				guard=guard+1
				let remaining=pool
				let activeweight=0
				for(let i=0;i<places;i=i+1){
					if(floored[i]){
						remaining=remaining-mincash
					}else{
						activeweight=activeweight+weights[i]
					}
				}
				let changed=false
				for(let i=0;i<places;i=i+1){
					if(!floored[i]){
						let c=activeweight>0?remaining*weights[i]/activeweight:0
						if(mincash>0&&c<mincash){
							floored[i]=true
							changed=true
						}
					}
				}
				if(!changed){
					break
				}
			}
			let remaining=pool
			let activeweight=0
			for(let i=0;i<places;i=i+1){
				if(floored[i]){
					remaining=remaining-mincash
				}else{
					activeweight=activeweight+weights[i]
				}
			}
			for(let i=0;i<places;i=i+1){
				if(floored[i]){
					raw[i]=mincash
				}else{
					raw[i]=activeweight>0?remaining*weights[i]/activeweight:0
				}
			}
		}
		let cash=[]
		let sumcash=0
		for(let i=0;i<places;i=i+1){
			let c=raw[i]
			if(step>0){
				c=Math.round(c/step)*step
			}else{
				c=Math.round(c)
			}
			if(mincash>0&&pool>=mincash*places&&c<mincash){
				c=mincash
			}
			cash.push(c)
			sumcash=sumcash+c
		}
		cash[0]=cash[0]+(pool-sumcash)
		if(mincash>0&&pool>=mincash*places&&cash[0]<mincash){
			cash[0]=mincash
		}
		if(cash[0]<0){
			cash[0]=0
		}
		for(let i=0;i<places;i=i+1){
			payouts.push({
				rank: String(i+1),
				cash: Math.round(cash[i]),
				reward: "",
				color: PAYOUTCOLOR
			})
		}
	}else{
		for(let i=0;i<places;i=i+1){
			payouts.push({
				rank: String(i+1),
				cash: 0,
				reward: "",
				color: PAYOUTCOLOR
			})
		}
	}
	state.payouts=payouts
	buildpayouteditor()
	showtoast(payoutedittext("gensuccessprefix","已產生 ")+places+payoutedittext("gensuccesssuffix"," 筆名次，記得儲存"))
}

domgetid("btnGenPayout").addEventListener("click",generatepayouts)

onenterclick("#genPlaces,#genPool,#genSteep,#genRound,#genMin",function(){
	click("#btnGenPayout")
})

domgetid("btnExportPayout").addEventListener("click",function(){
	let box=domgetid("payoutJsonText")
	box.style.display="block"
	box.value=exportpayouttext()
	box.focus()
	box.select()
	downloadpayoutfile()
	showtoast(payoutedittext("exportsuccess","已匯出並下載 JSON"))
})

domgetid("btnImportPayout").addEventListener("click",function(){
	let box=domgetid("payoutJsonText")
	if(box.style.display=="none"||box.style.display==""){
		box.style.display="block"
		box.focus()
		return
	}
	if(importpayouttext(box.value)){
		box.value=exportpayouttext()
	}
})

domgetid("payoutFileIn").addEventListener("change",function(){
	let file=this.files&&this.files[0]
	if(!file){
		return
	}
	let reader=new FileReader()
	reader.onload=function(){
		let text=String(reader.result||"")
		domgetid("payoutJsonText").style.display="block"
		domgetid("payoutJsonText").value=text
		importpayouttext(text)
	}
	reader.readAsText(file)
	this.value=""
})

applystatictext()
loadtimer()
