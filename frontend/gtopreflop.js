/*
	本檔是 frontend/gto.js 拆出來的一部分（TASK-116）。原檔 3,104 行同時裝著
	翻前矩陣＋對戰樹、翻後求解器、翻後策略庫、街道切換四塊，是三個曾經獨立的頁面
	被物理串接的結果。

	**四個初始化呼叫（gtoinit / fsinit / fslibinit / gtostreetinit）統一移到
	gtostreet.js 的最後。** 原本它們散在各自區塊的結尾，同檔時靠函式提升所以沒事，
	拆檔之後就會變成跨檔的 TDZ —— 實際上 gtoinit() 就呼叫了街道區塊的
	gtostreetapplyforgame()，不移的話一拆就壞。

	載入順序（range.html）：gtopreflop.js → gtopostflop.js → gtostreet.js
*/
/*
	GTO 參考工具（第一階段：9-max preflop push/fold）
	資料來自 gtodata.js（GTORANGELIST / GTOACTIONS / GTOOPTIONS / GTOMETA）。
	本檔只負責邏輯與畫面，新增情境/動作請改 gtodata.js。
*/

// 這兩個是固定不變的點數表 → const（全大寫代表常數，符合慣例）
const GTORANKS_HE=["A","K","Q","J","T","9","8","7","6","5","4","3","2"]
const GTORANKS_SD=["A","K","Q","J","T","9","8","7","6"]   // 短牌只有 9 個點數（拿掉 2~5）
// 這兩個會被重新賦值（切遊戲類型/街道時整個換掉）→ 必須 let。命名沿用專案既有的全大寫慣例。
let gtoranks=GTORANKS_HE   // 依遊戲類型切換，見 gtosyncranks()
let gtostreet="preflop"    // 翻前/翻牌切換（宣告放頂端，避免 gtoinit 早於原宣告位置時的 TDZ）

let gtostate={
	gametype:"HE",
	structure:"NL",   // NL / PL / FL（下注結構）
	tabletype:"9MAX",
	spot:"PFTREE",
	stackbb:10,
	position:"BTN",
	antemode:"bba",   // 預設大盲 ante（現代錦標賽標準）；"each"=每人 ante（輸入值＝佔 BB %）、"bba"=大盲 ante（輸入值＝BB）
	anteratio:1   // ante 輸入值（依 antemode 解讀）；預設 1＝1bb 大盲 ante。0=無 ante。只影響 HE 的 push/fold 情境。
}

// ── 設定記憶（localStorage）：把控制項與每座位計分牌存起來，重整後還原 ──
const GTOSTATEKEY=(typeof WEBLSNAME!="undefined"?WEBLSNAME:"")+"gtostate"

/*
	延後載入的資料檔（TASK-116）。

	這一頁原本同步載入 7 支腳本共約 3.4 MB（未壓縮），其中三支是**條件才用得到**的：

		shortdeckdata.js   627 KB   只有切到短牌才需要
		gtomultiwaycall.js  72 KB   只有正好三人全下池才需要
		gtoante.js         366 KB   **預設就需要**（gtostate.anteratio 預設 1，即 1bb 大盲 ante）

	所以只延後前兩支，省下約 700 KB。gtoante.js 維持同步載入 ——
	延後一個預設就要用的檔案只是把成本搬個位置，還多一條非同步路徑，沒有意義。

	**為什麼需要 ensure 而不是「用到再說」**：所有使用點都有 `typeof X!="undefined"` 防護，
	所以資料沒載到時不會報錯，只會**安靜地顯示空範圍或退回啟發式**。
	那正是這個專案一直在對付的失效模式，所以每個觸發點都必須「確保載入 → 重繪」。
*/
const GTOLAZYDATA={
	shortdeck: "shortdeckdata.js",
	multiwaycall: "gtomultiwaycall.js"
}
let gtodataready={}
let gtodatapending={}

function gtoensuredata(name,done){
	if(gtodataready[name]){
		done()
		return
	}
	if(gtodatapending[name]){
		gtodatapending[name].push(done)
		return
	}
	gtodatapending[name]=[done]
	let node=document.createElement("script")
	node.src=GTOLAZYDATA[name]
	node.onload=function(){
		gtodataready[name]=true
		let waiting=gtodatapending[name]
		gtodatapending[name]=null
		for(let i=0;i<waiting.length;i=i+1){ waiting[i]() }
	}
	node.onerror=function(){
		// 載不到就講出來。靜默失敗會變成「範圍怪怪的」而查不出原因。
		gtodatapending[name]=null
		if(typeof pttoast!="undefined"){ pttoast(gtotext("dataloadfail")||("載入失敗："+GTOLAZYDATA[name])) }
	}
	document.body.appendChild(node)
}

// gtoseats（目前桌型的座位順序）宣告在 gtodata.js:2763，不在本檔。
// 拆檔時我一度以為它是隱含全域而在這裡補了一個 let，結果 verify:runtime 立刻紅在
// 「Identifier 'gtoseats' has already been declared」—— node --check 過得去、只有執行才會炸。
// 資料檔宣告、邏輯檔賦值是這個專案既有的分工，不要再補宣告。

function gtosavestate(){
	try{
		localStorage.setItem(GTOSTATEKEY,JSON.stringify({ state:gtostate, perseat:gtoperseat, seatstacks:gtoseatstacks, street:gtostreet }))
	}catch(e){}
}
function gtoloadstate(){
	try{
		let raw=localStorage.getItem(GTOSTATEKEY)
		if(!raw){ return }
		let bundle=JSON.parse(raw)
		if(bundle&&bundle.state){
			for(let k in bundle.state){ if(gtostate[k]!=undefined){ gtostate[k]=bundle.state[k] } }
		}
		if(bundle&&typeof bundle.perseat=="boolean"){ gtoperseat=bundle.perseat }
		if(bundle&&bundle.seatstacks){ gtoseatstacks=bundle.seatstacks }
		if(bundle&&(bundle.street=="preflop"||bundle.street=="flop")){ gtostreet=bundle.street }   // 翻前/翻後切換也還原
	}catch(e){}
}

// 遊戲類型決定用幾個點數的矩陣、combo 總數（標準 C(52,2)=1326、短牌 C(36,2)=630）
function gtosyncranks(){
	gtoranks=gtostate.gametype=="SD"?GTORANKS_SD:GTORANKS_HE
}
function gtototalcombos(){
	return gtostate.gametype=="SD"?630:1326
}
function gtospotsforgame(){
	return (typeof GTOSPOTSBYGAME!="undefined"&&GTOSPOTSBYGAME[gtostate.gametype])||GTOOPTIONS.spot
}
// 依下注結構回可用情境：FL 走限注專屬情境集；NL/PL 走原本 push/fold・RFI・對戰樹。
function gtoavailablespots(){
	if(gtostate.structure=="FL"&&typeof GTOFLSPOTS!="undefined"){ return GTOFLSPOTS }
	return gtospotsforgame()
}
// 位置分群（限注參考範圍用）：早/中/晚/盲。
function gtoposgroup(pos){
	if(pos=="SB"||pos=="BB"){ return "BLINDS" }
	let b=gtopfbucket(gtostate.tabletype,pos,gtoseats)
	return b   // EARLY / MID / LATE
}
function gtostructurelabel(v){
	return gtotext("struct_"+v)
}

// 目前桌型設定（標準三桌型用寫死的、其他人數用 gtogentable 動態生成）
function gtotablecfg(tt){
	tt=tt||gtostate.tabletype
	return GTOTABLES[tt]||gtogentable(parseInt(tt,10))
}
// tabletype 字串 "8MAX" → 人數 8
function gtonplayers(tt){
	tt=tt||gtostate.tabletype
	return parseInt(tt,10)||9
}
// 深碼資料（RFI / 3bet / 深碼樹）只有 9MAX 與 6MAX 兩套位置版（gtodeeprfi.py 只生成這兩桌）。
// 其他人數（含 2-max，位置名都是 9-max 的子集）一律借 9MAX 查表；2-max 的 SB 開牌＝9MAX SB(HU 開牌)。
function gtodeeptt(){
	if(gtostate.tabletype=="9MAX"||gtostate.tabletype=="6MAX"){ return gtostate.tabletype }
	return "9MAX"
}
// push/fold 開蓋範圍查詢：標準桌型用專屬資料；其他人數用 k(後面人數)對應 9-max 同 k 位置。
function gtopushfoldopen(gametype,tabletype,stack,pos,seats){
	// ante>0 時改用 ante 資料（依 k，適用所有人數）
	let ante=gtoanteopenspot(stack,pos,seats)
	if(ante){ return ante }
	let RL=gametype=="SD"?(typeof SDRANGELIST!="undefined"?SDRANGELIST:{}):(typeof GTORANGELIST!="undefined"?GTORANGELIST:{})
	if(GTOTABLES[tabletype]){
		return RL[gametype+"_"+tabletype+"_PUSHFOLD_"+stack+"BB_"+pos]||null
	}
	let i=seats?seats.indexOf(pos):-1
	let k=i<0?0:seats.length-1-i
	let keypos=pos=="SB"?"SB":((typeof GTOK2POS!="undefined"&&GTOK2POS[k])||"UTG")
	return RL[gametype+"_9MAX_PUSHFOLD_"+stack+"BB_"+keypos]||null
}
// ── Ante（總 ante 以 BB 的百分之一「cents」為單位，對齊 gtoante.py 的 key）──
function gtoantelevelscents(){
	return (typeof GTOANTE_LEVELS!="undefined")?GTOANTE_LEVELS.map(function(a){ return Math.round(a*100) }):[]
}
// 目前情境對應的總 ante（cents）；不適用（非 HE push/fold、或無 ante 資料）回 0。
function gtoantecents(){
	if(gtostate.gametype!="HE"){ return 0 }
	if(!(gtostate.spot=="PUSHFOLD"||gtostate.spot=="PFTREE")){ return 0 }
	let r=gtostate.anteratio||0
	if(r<=0){ return 0 }
	let lv=gtoantelevelscents()
	if(!lv.length){ return 0 }
	// 總 ante(cents)：每人模式＝每人 ante% × 人數；大盲(BBA)模式＝輸入 BB × 100（全桌固定一份，與人數無關）
	let raw=(gtostate.antemode=="bba")?(r*100):(r*gtonplayers())
	if(raw<lv[0]/2){ return 0 }
	let best=lv[0]
	for(let i=0;i<lv.length;i=i+1){ if(Math.abs(lv[i]-raw)<Math.abs(best-raw)){ best=lv[i] } }
	return best
}
// ante 版開蓋範圍（依 k）；BB 不開蓋、無資料回 null。
function gtoanteopenspot(stack,seat,seats){
	let ac=gtoantecents()
	if(!ac||typeof GTOANTEOPEN=="undefined"||seat=="BB"){ return null }
	let key
	if(seat=="SB"){ key=ac+"_"+stack+"_SB" }
	else{
		let i=seats?seats.indexOf(seat):-1
		let k=i<0?2:seats.length-1-i
		if(k<2){ k=2 } if(k>9){ k=9 }
		key=ac+"_"+stack+"_"+k
	}
	return GTOANTEOPEN[key]||null
}
// ante 版跟注範圍（依全下者分桶）。
function gtoantecallspot(eff,bucket){
	let ac=gtoantecents()
	if(!ac||typeof GTOANTECALL=="undefined"){ return null }
	return GTOANTECALL[ac+"_"+eff+"_"+bucket]||null
}

// 全下者分桶（EARLY/MID/LATE）：標準桌型查對照表；其他人數用 k 推。
// 短牌走 SDJAMBUCKET（對齊 shortdeckpushfold.py 的 POS_BUCKET，也就是產生 SDCALLVSJAM key 的那份），
// 其餘走 GTOJAMBUCKET。兩表 9MAX 的 MP / CO 不同桶，混用會靜默查到錯的跟注範圍。
function gtopfbucket(tabletype,jammerpos,seats){
	let bucketmap=null
	if(gtostate.gametype=="SD"){
		if(typeof SDJAMBUCKET!="undefined"){ bucketmap=SDJAMBUCKET }
	}else{
		if(typeof GTOJAMBUCKET!="undefined"){ bucketmap=GTOJAMBUCKET }
	}
	if(bucketmap&&bucketmap[tabletype]&&bucketmap[tabletype][jammerpos]){
		return bucketmap[tabletype][jammerpos]
	}
	let i=seats?seats.indexOf(jammerpos):-1
	let k=i<0?2:seats.length-1-i
	if(jammerpos=="SB"||jammerpos=="BB"||k<=2){ return "LATE" }
	if(k>=6){ return "EARLY" }
	return "MID"
}

let gtoselected=""

function gtotext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["gtopage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["gtopage"][key]||key
}

function gtoactionlabel(action){
	// 先查 TRANSLATE（gtopage.action_*），查無才 fallback 到 gtodata.js 內嵌文案
	let text=gtotext("action_"+action)
	if(text!="action_"+action){
		return text
	}
	let item=GTOACTIONS[action]
	if(!item){
		return action
	}
	return LANGUAGE=="en"?item.en:item.zh
}

function gtometasource(){
	// 先查 TRANSLATE（gtopage.metasource），查無才 fallback 到 gtodata.js 內嵌文案
	let text=gtotext("metasource")
	if(text!="metasource"){
		return text
	}
	return LANGUAGE=="en"?GTOMETA.sourceen:GTOMETA.source
}

// 中段帶展開：22-99 / A2s-ATs / K9o-KJo（給 limp 這種非「由頂向下」的範圍用）
function gtoexpandband(token){
	let parts=token.split("-")
	let out=[]
	if(parts.length!=2){ return out }
	let a=parts[0], b=parts[1]
	if(a.length==2&&a.charAt(0)==a.charAt(1)&&b.length==2&&b.charAt(0)==b.charAt(1)){
		let ia=gtoranks.indexOf(a.charAt(0)), ib=gtoranks.indexOf(b.charAt(0))
		if(ia<0||ib<0){ return out }
		let lo=Math.min(ia,ib), hi=Math.max(ia,ib)
		for(let i=lo;i<=hi;i=i+1){ out.push(gtoranks[i]+gtoranks[i]) }
		return out
	}
	if(a.length==3&&b.length==3&&a.charAt(0)==b.charAt(0)&&a.charAt(2)==b.charAt(2)){
		let hi=a.charAt(0), suit=a.charAt(2)
		let hii=gtoranks.indexOf(hi)
		let ka=gtoranks.indexOf(a.charAt(1)), kb=gtoranks.indexOf(b.charAt(1))
		if(hii<0||ka<0||kb<0){ return out }
		let lo=Math.min(ka,kb), khi=Math.max(ka,kb)
		for(let i=lo;i<=khi;i=i+1){
			if(i>hii){ out.push(hi+gtoranks[i]+suit) }
		}
	}
	return out
}

// token 展開：22+ / A9s+ / ATo+ / KQo / 98s / 22-99 / A2s-ATs（沿用 preflop 慣例）
function gtoexpand(token){
	if(token.indexOf("-")>0){
		return gtoexpandband(token)
	}
	let plus=token.charAt(token.length-1)=="+"
	let body=plus?token.slice(0,-1):token
	let out=[]
	if(body.length==2&&body.charAt(0)==body.charAt(1)){
		let vi=gtoranks.indexOf(body.charAt(0))
		if(vi<0){
			return out
		}
		if(plus){
			for(let i=vi;i>=0;i=i-1){
				out.push(gtoranks[i]+gtoranks[i])
			}
		}else{
			out.push(body)
		}
		return out
	}
	if(body.length==3){
		let hi=body.charAt(0)
		let lo=body.charAt(1)
		let suit=body.charAt(2)
		let hii=gtoranks.indexOf(hi)
		let loi=gtoranks.indexOf(lo)
		if(hii<0||loi<0){
			return out
		}
		if(plus){
			for(let i=loi;i>hii;i=i-1){
				out.push(hi+gtoranks[i]+suit)
			}
		}else{
			out.push(body)
		}
	}
	return out
}

// 把一個 spot 的多動作 token 清單，展開成 { 手牌: 動作 }
function gtobuildactionmap(spotdata){
	let map={}
	for(let i=0;i<GTOACTIONORDER.length;i=i+1){
		let action=GTOACTIONORDER[i]
		let tokens=spotdata[action]
		if(!tokens){
			continue
		}
		for(let j=0;j<tokens.length;j=j+1){
			let hands=gtoexpand(tokens[j])
			for(let k=0;k<hands.length;k=k+1){
				// 已被較高優先序動作標走的就不覆蓋
				if(map[hands[k]]==undefined){
					map[hands[k]]=action
				}
			}
		}
	}
	return map
}

function gtospotkey(){
	return gtostate.gametype+"_"+gtostate.tabletype+"_"+gtostate.spot+"_"+gtostate.stackbb+"BB_"+gtostate.position
}

function gtocurrentspot(){
	// 限注：走專屬情境集（依位置分群查規則參考範圍）
	if(gtostate.structure=="FL"){
		let g=(typeof GTOFL!="undefined")&&GTOFL[gtostate.spot]
		return (g&&g[gtoposgroup(gtostate.position)])||null
	}
	// 短牌：RFI 讀 SDRFI（key 只用位置）；push/fold 讀 SDRANGELIST
	if(gtostate.gametype=="SD"){
		if(gtostate.spot=="RFI"){
			return (typeof SDRFI!="undefined"&&SDRFI[gtostate.position])||null
		}
		if(gtostate.spot=="PUSHFOLD"){
			return gtopushfoldopen("SD",gtostate.tabletype,gtostate.stackbb,gtostate.position,gtoseats)
		}
		return null
	}
	if(gtostate.spot=="PUSHFOLD"){
		return gtopushfoldopen("HE",gtostate.tabletype,gtostate.stackbb,gtostate.position,gtoseats)
	}
	if(typeof GTOMATCHUPSPOTS!="undefined"&&GTOMATCHUPSPOTS[gtostate.spot]){
		return GTOMATCHUPSPOTS[gtostate.spot].data[gtostate.position]||null
	}
	// RFI 深碼：gtodeeprfi.py 生成 25-300bb 每檔各自的範圍，直接用當前計分牌查
	if(gtostate.spot=="RFI"){
		return (typeof GTORFI!="undefined"&&GTORFI["HE_"+gtodeeptt()+"_RFI_"+gtostate.stackbb+"BB_"+gtostate.position])||null
	}
	let key=gtospotkey()
	if(GTORANGELIST[key]){
		return GTORANGELIST[key]
	}
	return (typeof GTORFI!="undefined"&&GTORFI[key])||null
}

function gtostacksforspot(){
	return (typeof GTOSTACKS!="undefined"&&GTOSTACKS[gtostate.spot])||GTOOPTIONS.stackbb
}

// 位置選單依情境：3bet 用「對位」，其餘用桌型位置
function gtopositionsforspot(){
	if(typeof GTOMATCHUPSPOTS!="undefined"&&GTOMATCHUPSPOTS[gtostate.spot]){
		return GTOMATCHUPSPOTS[gtostate.spot].matchups
	}
	return gtotablecfg().positions
}

// 套用新的計分牌（貼齊最近有資料的檔）並重繪
function gtoapplystack(v,stacks){
	if(!v){ return }
	gtostate.stackbb=gtosnapstack(v,stacks)
	gtoselected=""
	gtotreereset(); gtodeepreset()
	gtorenderstacks()   // 重繪讓輸入框顯示貼齊後的值
	gtoapplymode(); gtorendergrid(); gtorendersummary(); gtorendermeta()
	gtosavestate()
}

function gtorenderstacks(){
	let stacks=gtostacksforspot()
	// 檔位多（>6）就用「− 數字框 +」：打任意值或按 ±，貼齊最近有資料的檔；少就維持按鈕
	if(stacks.length>6){
		let lo=Math.min.apply(null,stacks), hi=Math.max.apply(null,stacks)
		if(stacks.indexOf(gtostate.stackbb)<0){ gtostate.stackbb=gtosnapstack(gtostate.stackbb,stacks) }
		let btncls="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-lg font-bold text-zinc-100 transition hover:bg-zinc-700 cursor-pointer select-none"
		innerhtml("#gtostack",`<div class="flex items-center gap-1">`
			+`<input type="button" id="gtostackminus" class="${btncls}" value="−">`
			+`<input type="number" id="gtostackinput" min="${lo}" max="${hi}" step="1" inputmode="numeric" value="${gtostate.stackbb}" class="w-16 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-center text-sm text-zinc-100">`
			+`<input type="button" id="gtostackplus" class="${btncls}" value="+">`
			+`<span class="ml-1 text-sm text-zinc-400">bb</span></div>`,false)
		let inp=domgetid("gtostackinput")
		if(inp){
			inp.addEventListener("change",function(){ gtoapplystack(Number(this.value),stacks) })
		}
		// −/+ 移到排序後的相鄰一檔（升冪）
		let sorted=stacks.slice().sort(function(a,b){ return a-b })
		let minus=domgetid("gtostackminus")
		if(minus){ minus.addEventListener("click",function(){
			let idx=sorted.indexOf(gtostate.stackbb)
			if(idx>0){ gtoapplystack(sorted[idx-1],stacks) }
		}) }
		let plus=domgetid("gtostackplus")
		if(plus){ plus.addEventListener("click",function(){
			let idx=sorted.indexOf(gtostate.stackbb)
			if(idx>=0&&idx<sorted.length-1){ gtoapplystack(sorted[idx+1],stacks) }
		}) }
		return
	}
	gtorenderoption("#gtostack",stacks,"stackbb",function(v){ return v+"bb" })
	let btns=document.querySelectorAll('#gtostack [data-gtoopt]')
	for(let i=0;i<btns.length;i=i+1){
		btns[i].addEventListener("click",function(){ gtohandleoption(this) })
	}
}

// 把任意 bb 值貼齊到 stacks 裡最近的一檔（有資料的）
function gtosnapstack(bb,stacks){
	let best=stacks[0]
	for(let i=0;i<stacks.length;i=i+1){ if(Math.abs(stacks[i]-bb)<Math.abs(best-bb)){ best=stacks[i] } }
	return best
}

function gtohandlabel(r,c){
	if(r==c){
		return gtoranks[r]+gtoranks[r]
	}
	if(r<c){
		return gtoranks[r]+gtoranks[c]+"s"
	}
	return gtoranks[c]+gtoranks[r]+"o"
}

function gtocombos(r,c){
	if(r==c){
		return 6
	}
	if(r<c){
		return 4
	}
	return 12
}

// 頻率（混合）查詢：spotdata.frequencymap[hand] = { jam:60, fold:40 }
function gtohandfrequency(spotdata,label){
	if(spotdata&&spotdata.frequencymap&&spotdata.frequencymap[label]){
		return spotdata.frequencymap[label]
	}
	return null
}

// 目前要畫的範圍：靜態範圍表用選定 spot；對戰樹用「當前行動者」的範圍
function gtoactivespot(){
	if(gtostate.spot=="PFTREE"){
		return gtotreeactorspot()
	}
	if(gtostate.spot=="DEEPTREE"){
		return gtodeepactorspot()
	}
	return gtocurrentspot()
}

// 一手牌在此 spot 的動作頻率（混合用 frequencymap，否則純動作 100%）
function gtohandactionfreq(spotdata,map,label){
	let freq=gtohandfrequency(spotdata,label)
	if(freq){
		return freq
	}
	let o={}
	o[map[label]||"fold"]=100
	return o
}

function gtorendergrid(){
	let spotdata=gtoactivespot()
	let map=spotdata?gtobuildactionmap(spotdata):{}
	let html=""
	let combobyaction={}
	let totalnonfold=0
	let order=GTOACTIONORDER.concat(["fold"])
	let n=gtoranks.length
	for(let r=0;r<n;r=r+1){
		for(let c=0;c<n;c=c+1){
			let label=gtohandlabel(r,c)
			let combos=gtocombos(r,c)
			let freqs=gtohandactionfreq(spotdata,map,label)
			let segs=""
			for(let i=0;i<order.length;i=i+1){
				let a=order[i]
				let f=freqs[a]||0
				if(f>0){
					let it=GTOACTIONS[a]||GTOACTIONS["fold"]
					segs=segs+`<span style="width:${f}%;background:${it.bg}"></span>`
					combobyaction[a]=(combobyaction[a]||0)+combos*f/100
					if(a!="fold"){
						totalnonfold=totalnonfold+combos*f/100
					}
				}
			}
			let selectedcls=label==gtoselected?" gtocellselected":""
			html=html+`<div class="gtocell${selectedcls}" data-gtohand="${label}"><div class="gtocellsegs">${segs}</div><span class="gtocelllabel">${label}</span></div>`
		}
	}
	let gridel=domgetid("gtogrid")
	if(gridel){
		gridel.style.gridTemplateColumns="repeat("+n+",minmax(32px,1fr))"
		// 鎖最小寬度，讓矩陣在窄螢幕改成自己橫捲，而不是把格子壓到 22px。
		// 短牌只有 9 欄，所以依欄數算而不是寫死。
		gridel.style.minWidth=(n*32+(n-1)*2)+"px"
	}
	innerhtml("#gtogrid",html,false)
	gtorenderemptynode(spotdata)
	let total=gtototalcombos()
	let pct=Math.round(totalnonfold/total*1000)/10
	innertext("#gtopercent",pct+"%",false)
	innertext("#gtocombos",Math.round(totalnonfold)+" / "+total+" combo",false)
	gtorenderlegend(combobyaction)
	gtobindcells()
	gtorenderdetail()
}

function gtorenderlegend(combobyaction){
	// 只顯示目前範圍出現的動作（外加 fold），讓圖例隨情境變化
	let order=GTOACTIONORDER.concat(["fold"])
	let html=""
	for(let i=0;i<order.length;i=i+1){
		let action=order[i]
		let combos=combobyaction[action]||0
		if(action!="fold"&&combos<=0){
			continue
		}
		let item=GTOACTIONS[action]
		let pct=Math.round(combos/gtototalcombos()*1000)/10
		html=html+`
			<div class="gtolegenditem">
				<span class="gtolegendswatch" style="background:${item.bg}"></span>
				<span class="gtolegendlabel">${gtoactionlabel(action)}</span>
				<span class="gtolegendpct">${pct}%</span>
			</div>
		`
	}
	innerhtml("#gtolegend",html,false)
}

function gtorenderdetail(){
	let box=domgetid("gtodetail")
	if(!box){
		return
	}
	if(!gtoselected){
		box.innerHTML=`<div class="gtodetailhint">${gtotext("detailhint")}</div>`
		return
	}
	let spotdata=gtoactivespot()
	let map=spotdata?gtobuildactionmap(spotdata):{}
	let action=map[gtoselected]||"fold"
	let freq=gtohandfrequency(spotdata,gtoselected)
	let item=GTOACTIONS[action]||GTOACTIONS["fold"]
	let html=`
		<div class="gtodetailhead">
			<span class="gtodetailhand">${gtoselected}</span>
			<span class="gtodetailaction" style="background:${item.bg};color:${item.fg}">${gtoactionlabel(action)}</span>
		</div>
	`
	if(freq){
		const ORDERLIST=GTOACTIONORDER.concat(["fold"])
		html=html+`<div class="gtofreqwrap">`
		for(let i=0;i<ORDERLIST.length;i=i+1){
			let a=ORDERLIST[i]
			if(freq[a]==undefined){
				continue
			}
			let it=GTOACTIONS[a]
			html=html+`
				<div class="gtofreqrow">
					<span class="gtofreqlabel">${gtoactionlabel(a)}</span>
					<span class="gtofreqbar"><span style="width:${freq[a]}%;background:${it.bg}"></span></span>
					<span class="gtofreqpct">${freq[a]}%</span>
				</div>
			`
		}
		html=html+`</div>`
	}else{
		html=html+`<div class="gtodetailnote">${gtotext("detailpure")}</div>`
	}
	// EV（全下相對棄牌，bb）：解釋為什麼這手該全下/棄/混合
	let ev=(spotdata&&spotdata.ev)?spotdata.ev[gtoselected]:undefined
	if(ev!=undefined){
		let sign=ev>0?"+":""
		// let tag=Math.abs(ev)<0.1?gtotext("ev_indiff"):(ev>0?gtotext("ev_plus"):gtotext("ev_minus"))
		html=html+`<div class="gtodetailev">${gtotext("ev_label")}：<span class="gtoevnum">${sign}${ev}BB</span></div>`
	}
	box.innerHTML=html
}

function gtobindcells(){
	let cells=document.querySelectorAll("[data-gtohand]")
	for(let i=0;i<cells.length;i=i+1){
		cells[i].addEventListener("click",function(){
			let label=this.getAttribute("data-gtohand")
			gtoselected=(gtoselected==label)?"":label
			gtorendergrid()
		})
	}
}

// 控制列：依 GTOOPTIONS 產生按鈕（spot / stack / position）
function gtorenderoption(containerid,values,statekey,formatter){
	let html=""
	for(let i=0;i<values.length;i=i+1){
		let value=values[i]
		let text=formatter?formatter(value):value
		html=html+`<input type="button" class="gtoopt" data-gtoopt="${statekey}" data-gtovalue="${value}" value="${text}">`
	}
	innerhtml(containerid,html,false)
}

function gtosyncoptionactive(){
	let buttons=document.querySelectorAll("[data-gtoopt]")
	for(let i=0;i<buttons.length;i=i+1){
		let statekey=buttons[i].getAttribute("data-gtoopt")
		let value=buttons[i].getAttribute("data-gtovalue")
		let active=String(gtostate[statekey])==String(value)
		buttons[i].classList.toggle("gtooptactive",active)
	}
}

function gtospotlabel(spot){
	let map=TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["gtopage"]?TRANSLATE[LANGUAGE]["gtopage"]["spot_"+spot]:null
	return map||spot
}

function gtoposlabel(position){
	// 3BET 跟 VS4BET 用同一套 key 命名（3bettorvOpener），對位字串會撞在一起，
	// 不能用扁平合併的 GTOMATCHUPLABEL 查——要先看目前是哪個情境，查對應那份專屬 label。
	if(typeof gtostate!="undefined"){
		if(gtostate.spot=="3BET"&&typeof GTO3BETLABEL!="undefined"&&GTO3BETLABEL[position]){
			return GTO3BETLABEL[position]
		}
		if(gtostate.spot=="VS3BET"&&typeof GTOVS3BETLABEL!="undefined"&&GTOVS3BETLABEL[position]){
			return GTOVS3BETLABEL[position]
		}
		if(gtostate.spot=="VS4BET"&&typeof GTOVS4BETLABEL!="undefined"&&GTOVS4BETLABEL[position]){
			return GTOVS4BETLABEL[position]
		}
	}
	if(typeof GTOMATCHUPLABEL!="undefined"&&GTOMATCHUPLABEL[position]){
		return GTOMATCHUPLABEL[position]
	}
	return (typeof GTOPOSLABEL!="undefined"&&GTOPOSLABEL[position])||position
}

// 同步對戰樹座位順序到目前桌型
function gtosyncseats(){
	gtoseats=gtotablecfg().seats
}

// 依目前桌型渲染位置按鈕（換桌型會重繪，故自行綁定 click）
function gtorenderpositions(){
	let positions=gtopositionsforspot()
	gtorenderoption("#gtopos",positions,"position",function(v){ return gtoposlabel(v) })
	let btns=document.querySelectorAll('#gtopos [data-gtoopt]')
	for(let i=0;i<btns.length;i=i+1){
		btns[i].addEventListener("click",function(){ gtohandleoption(this) })
	}
}

// 人數：− 數字框 +（2–10）。取代原本三顆桌型按鈕。
function gtorendertabletype(){
	let n=gtonplayers()
	let btncls="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-lg font-bold text-zinc-100 transition hover:bg-zinc-700 cursor-pointer select-none"
	innerhtml("#gtotabletype",`<div class="flex items-center gap-1">`
		+`<input type="button" id="gtotableminus" class="${btncls}" value="−">`
		+`<input type="number" id="gtotableinput" min="2" max="10" step="1" inputmode="numeric" value="${n}" class="w-16 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-center text-sm text-zinc-100">`
		+`<input type="button" id="gtotableplus" class="${btncls}" value="+">`
		+`<span class="ml-1 text-sm text-zinc-400">${gtotext("playersuffix")}</span></div>`,false)
	let inp=domgetid("gtotableinput")
	if(inp){ inp.addEventListener("change",function(){ gtoapplytabletype(Number(this.value)) }) }
	let minus=domgetid("gtotableminus")
	if(minus){ minus.addEventListener("click",function(){ gtoapplytabletype(gtonplayers()-1) }) }
	let plus=domgetid("gtotableplus")
	if(plus){ plus.addEventListener("click",function(){ gtoapplytabletype(gtonplayers()+1) }) }
}
function gtoapplytabletype(n){
	if(!n){ return }
	n=Math.max(2,Math.min(10,Math.round(n)))
	// 沿用 gtohandleoption 的 tabletype 分支（同步座位/位置/重置樹/重繪）
	gtohandleoption({ getAttribute:function(a){ return a=="data-gtoopt"?"tabletype":(n+"MAX") } })
	gtorendertabletype()
	gtorenderante()   // 換人數會改變總 ante（=每人% × 人數），重繪 ante 說明
}

// Ante：每人 ante（佔 BB %）− 數字框 +，只對 HE push/fold 有效。
function gtorenderante(){
	let row=domgetid("gtoanterow")
	let applies=gtostate.gametype=="HE"&&(gtostate.spot=="PUSHFOLD"||gtostate.spot=="PFTREE")&&(typeof GTOANTEOPEN!="undefined")
	if(row){ row.style.display=applies?"":"none" }
	if(!applies){ return }
	let r=gtostate.anteratio||0
	let bba=gtostate.antemode=="bba"
	let step=bba?0.5:2.5
	let max=bba?5:50
	let ac=gtoantecents()
	let note=ac?gtotext("ante_total").replace("{bb}",(ac/100)):gtotext("ante_none")
	let btncls="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-lg font-bold text-zinc-100 transition hover:bg-zinc-700 cursor-pointer select-none"
	function modebtn(m,label){
		let on=gtostate.antemode==m
		return `<input type="button" data-antemode="${m}" value="${label}" class="rounded-lg px-2 py-1 text-xs font-bold cursor-pointer ${on?"bg-emerald-500 text-zinc-950":"bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}">`
	}
	innerhtml("#gtoante",`<div class="flex flex-wrap items-center gap-1">`
		+modebtn("each",gtotext("ante_mode_each"))+modebtn("bba",gtotext("ante_mode_bba"))
		+`<span class="mx-1 text-zinc-600">|</span>`
		+`<input type="button" id="gtoanteminus" class="${btncls}" value="−">`
		+`<input type="number" id="gtoanteinput" min="0" max="${max}" step="${step}" inputmode="numeric" value="${r}" class="w-16 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-center text-sm text-zinc-100">`
		+`<input type="button" id="gtoanteplus" class="${btncls}" value="+">`
		+`<span class="ml-1 text-sm text-zinc-400">${bba?gtotext("ante_suffix_bba"):gtotext("ante_suffix_each")}</span>`
		+`<span class="ml-2 text-xs text-zinc-500">${note}</span></div>`,false)
	let inp=domgetid("gtoanteinput")
	if(inp){ inp.addEventListener("change",function(){ gtoapplyante(Number(this.value)) }) }
	let minus=domgetid("gtoanteminus")
	if(minus){ minus.addEventListener("click",function(){ gtoapplyante((gtostate.anteratio||0)-step) }) }
	let plus=domgetid("gtoanteplus")
	if(plus){ plus.addEventListener("click",function(){ gtoapplyante((gtostate.anteratio||0)+step) }) }
	let modes=document.querySelectorAll("[data-antemode]")
	for(let i=0;i<modes.length;i=i+1){
		modes[i].addEventListener("click",function(){ gtoapplyantemode(this.getAttribute("data-antemode")) })
	}
}
// 切換 ante 模式（每人 ↔ 大盲）：換模式時輸入值語意不同，重設為該模式的合理預設。
function gtoapplyantemode(mode){
	if(gtostate.antemode==mode){ return }
	gtostate.antemode=mode
	gtostate.anteratio=(mode=="bba")?1:0   // BBA 預設 1bb（最常見）；每人預設 0（先不加）
	gtoselected=""
	gtotreereset(); gtodeepreset()
	gtorenderante()
	gtoapplymode(); gtorendergrid(); gtorendersummary()
	gtosavestate()
}
function gtoapplyante(r){
	if(!r||r<0){ r=0 }
	let max=gtostate.antemode=="bba"?5:50
	if(r>max){ r=max }
	gtostate.anteratio=r
	gtoselected=""
	gtotreereset(); gtodeepreset()
	gtorenderante()
	gtoapplymode(); gtorendergrid(); gtorendersummary()
	gtosavestate()
}

function gtohandleoption(el){
	let statekey=el.getAttribute("data-gtoopt")
	let value=el.getAttribute("data-gtovalue")
	if(statekey=="stackbb"){
		value=Number(value)
	}
	gtostate[statekey]=value
	gtoselected=""
	if(statekey=="gametype"){
		// 換遊戲類型：切點數（13/9）、把情境選單過濾成該類型可用的、必要時退回合法情境
		gtosyncranks()
		gtoswapadvranges()   // 進階求解的預設範圍換成該遊戲類型（短牌不能有 2-5）
		let spots=gtoavailablespots()
		if(spots.indexOf(gtostate.spot)<0){ gtostate.spot=spots[0] }
		gtorenderoption("#gtospot",spots,"spot",function(v){ return gtospotlabel(v) })
		let sbtns=document.querySelectorAll('#gtospot [data-gtoopt]')
		for(let i=0;i<sbtns.length;i=i+1){ sbtns[i].addEventListener("click",function(){ gtohandleoption(this) }) }
		let stacks=gtostacksforspot()
		if(stacks.indexOf(gtostate.stackbb)<0){ gtostate.stackbb=stacks[0] }
		let positions=gtopositionsforspot()
		if(positions.indexOf(gtostate.position)<0){ gtostate.position=positions[0] }
		gtorenderstacks()
		gtorenderpositions()
		gtorendermeta()
		gtostreetapplyforgame()
		fslibloadmanifest()   // 切遊戲類型要重讀批次結果（HE→gtoresults、SD→shortdeckresults）
		if(gtostate.gametype=="SD"){
			// 短牌資料是延後載入的（627 KB）。載到之後要重繪，否則矩陣會安靜地空著。
			gtoensuredata("shortdeck",function(){ gtoactivetreerender() })
		}
	}
	if(statekey=="structure"){
		// 換結構：FL 用限注情境集、NL/PL 用原情境；spot/計分牌/位置落回合法值
		let spots=gtoavailablespots()
		if(spots.indexOf(gtostate.spot)<0){ gtostate.spot=spots[0] }
		gtorenderoption("#gtospot",spots,"spot",function(v){ return gtospotlabel(v) })
		let sbtns=document.querySelectorAll('#gtospot [data-gtoopt]')
		for(let i=0;i<sbtns.length;i=i+1){ sbtns[i].addEventListener("click",function(){ gtohandleoption(this) }) }
		let stacks=gtostacksforspot()
		if(stacks.indexOf(gtostate.stackbb)<0){ gtostate.stackbb=stacks[0] }
		let positions=gtopositionsforspot()
		if(positions.indexOf(gtostate.position)<0){ gtostate.position=positions.indexOf("BTN")>=0?"BTN":positions[0] }
		gtorenderstacks()
		gtorenderpositions()
		gtorendermeta()
	}
	if(statekey=="tabletype"){
		gtosyncseats()
		let positions=gtopositionsforspot()
		if(positions.indexOf(gtostate.position)<0){
			// BTN 大多桌型都有；2-max 等沒有 BTN 時退回第一個合法位置（SB）
			gtostate.position=positions.indexOf("BTN")>=0?"BTN":positions[0]
		}
		gtorenderpositions()
	}
	if(statekey=="spot"){
		// 換情境：計分牌檔位與位置選單可能都不同（push/fold 短碼位置 vs RFI 深碼 vs 3bet 對位）
		let stacks=gtostacksforspot()
		if(stacks.indexOf(gtostate.stackbb)<0){
			// 跨類別時給合理預設（深碼 100bb、push/fold 20bb），同類別內則保留原計分牌
			let def=(gtostate.spot=="RFI"||gtostate.spot=="DEEPTREE")?100:20
			gtostate.stackbb=stacks.indexOf(def)>=0?def:stacks[0]
		}
		// 深碼情境一律預設回 100bb（深碼檔位含 10bb，不強制的話會沿用 push/fold 短碼）
		if((gtostate.spot=="RFI"||gtostate.spot=="DEEPTREE")&&stacks.indexOf(100)>=0){ gtostate.stackbb=100 }
		let positions=gtopositionsforspot()
		if(positions.indexOf(gtostate.position)<0){
			gtostate.position=positions[0]
		}
		gtorenderstacks()
		gtorenderpositions()
		gtorendermeta()
	}
	// 換桌型/計分牌/情境/位置都重置對戰樹，避免狀態錯亂
	gtotreereset()
	gtodeepreset()
	gtosyncoptionactive()
	gtorenderante()   // ante 列只在 HE push/fold 顯示，隨情境/遊戲類型切換
	gtoapplymode()
	gtorendergrid()
	gtorendersummary()
	gtorenderscenariobar()
	gtosavestate()
}

// 版本/來源/免責聲明：RFI 是參考資料，要標清楚不是 solver 算的
function gtorendermeta(){
	let matchupspot=typeof GTOMATCHUPSPOTS!="undefined"&&GTOMATCHUPSPOTS[gtostate.spot]
	let ref=gtostate.spot=="RFI"||matchupspot
	let ver=ref?gtotext("rfi_version"):GTOMETA.version
	let source=ref?gtotext("rfi_source"):gtometasource()
	innertext("#gtoversionvalue",ver+" · "+source,false)
	let disc=gtotext("disclaimer")
	if(gtostate.structure=="FL"){ disc=gtotext("fl_disclaimer") }
	else if(gtostate.spot=="RFI"){ disc=gtotext("rfi_disclaimer") }
	else if(matchupspot){ disc=gtotext("tbet_disclaimer") }
	else if(gtostate.structure=="PL"){ disc=gtotext("pl_disclaimer") }
	innertext("#gtodisclaimer",disc,false)
}

function gtobindoptions(){
	// 綁定除了 position 以外的控制鈕（position 由 gtorenderpositions 自行綁定）
	let buttons=document.querySelectorAll("[data-gtoopt]")
	for(let i=0;i<buttons.length;i=i+1){
		let sk=buttons[i].getAttribute("data-gtoopt")
		if(sk=="position"||sk=="stackbb"){
			continue   // position 由 gtorenderpositions、stackbb 由 gtorenderstacks 自行綁定
		}
		buttons[i].addEventListener("click",function(){ gtohandleoption(this) })
	}
}

function gtorendersummary(){
	let posmap=TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["gtopage"]?TRANSLATE[LANGUAGE]["gtopage"]:{}
	let summary=gtotext("summary")
		.replace("{stack}",gtostate.stackbb)
		.replace("{position}",gtoposlabel(gtostate.position))
		.replace("{spot}",gtospotlabel(gtostate.spot))
	innertext("#gtosummary",summary,false)
}

// query string：?spot=PUSHFOLD&stackbb=10&position=BTN&hand=AKs（給未來手牌串接預留）
function gtoapplyquery(){
	let params=new URLSearchParams(location.search||"")
	let gametype=params.get("gametype")
	let structure=params.get("structure")
	let tabletype=params.get("tabletype")
	let spot=params.get("spot")
	let stackbb=params.get("stackbb")
	let position=params.get("position")
	let hand=params.get("hand")
	if(structure&&GTOOPTIONS.structure.indexOf(structure)>=0){
		gtostate.structure=structure
	}
	if(gametype&&GTOOPTIONS.gametype.indexOf(gametype)>=0){
		gtostate.gametype=gametype
	}
	if(tabletype&&GTOOPTIONS.tabletype.indexOf(tabletype)>=0){
		gtostate.tabletype=tabletype
	}
	// spot 要落在目前結構/遊戲類型可用的清單裡；否則退回第一個合法情境
	let allowedspots=gtoavailablespots()
	if(spot&&allowedspots.indexOf(spot)>=0){
		gtostate.spot=spot
	}else if(allowedspots.indexOf(gtostate.spot)<0){
		gtostate.spot=allowedspots[0]
	}
	let stacks=gtostacksforspot()
	if(stackbb&&stacks.indexOf(Number(stackbb))>=0){
		gtostate.stackbb=Number(stackbb)
	}else if(stacks.indexOf(gtostate.stackbb)<0){
		gtostate.stackbb=stacks[0]
	}
	let positions=gtopositionsforspot()
	if(position&&positions.indexOf(position)>=0){
		gtostate.position=position
	}else if(positions.indexOf(gtostate.position)<0){
		gtostate.position=positions.indexOf("BTN")>=0?"BTN":positions[0]
	}
	if(hand){
		// ?hand= 只接受 169 種標準起手牌代號（AA、AKs、AKo…，對子無後綴、非對子高牌在前），
		// 這個值會進 innerHTML（gtorenderdetail），不合法就整個忽略，避免 DOM XSS
		let handed=false
		if(/^[AKQJT98765432]{2}[so]?$/.test(hand)){
			let hi=GTORANKS_HE.indexOf(hand.charAt(0))
			let lo=GTORANKS_HE.indexOf(hand.charAt(1))
			if(hand.length==2&&hi==lo){ handed=true }
			if(hand.length==3&&hi<lo){ handed=true }
		}
		if(handed){
			gtoselected=hand
		}
	}
}

function gtoapplylanguage(){
	document.title=gtotext("title")+" - PokerTrace"
	innertext("#gtotitle",gtotext("title"),false)
	innertext("#gtosubtitle",gtotext("subtitle"),false)
	innertext("#back",gtotext("back"),false)
	innertext("#gtoperseatlabel",gtotext("perseatlabel"),false)
	// 翻前／翻後切換鈕的文字（原本寫死在 HTML，英文模式不會翻）
	let streetbtns=document.querySelectorAll("[data-gtostreet]")
	for(let i=0;i<streetbtns.length;i=i+1){
		let k=streetbtns[i].getAttribute("data-gtostreet")
		streetbtns[i].value=gtotext(k=="flop"?"street_flop":"street_preflop")
	}
	innertext("#gtostructurelabel",gtotext("structurelabel"),false)
	innertext("#gtogametypelabel",gtotext("gametypelabel"),false)
	innertext("#gtotabletypelabel",gtotext("tabletypelabel"),false)
	innertext("#gtospotlabel",gtotext("spotlabel"),false)
	innertext("#gtostacklabel",gtotext("stacklabel"),false)
	innertext("#gtoantelabel",gtotext("antelabel"),false)
	innertext("#gtoposlabel",gtotext("poslabel"),false)
	gtorenderante()
	innertext("#gtogridtitle",gtotext("gridtitle"),false)
	innertext("#gtopercentlabel",gtotext("percentlabel"),false)
	innertext("#gtolegendtitle",gtotext("legendtitle"),false)
	innertext("#gtodetailtitle",gtotext("detailtitle"),false)
	innertext("#gtosuitednote",gtotext("suitednote"),false)
	innertext("#gtoversionlabel",gtotext("versionlabel"),false)
	// 版本值與免責聲明由 gtorendermeta() 依情境設定（push/fold 自算 vs RFI 參考）
	innertext("#gtotreetitle",gtotext("tree_title"),false)
	innertext("#gtotreehint",gtotext("tree_hint"),false)
	value("#gtotreeback",gtotext("tree_back"))
	value("#gtotreereset",gtotext("tree_reset"))
	// 導覽說明面板（HTML 放 translate.js 的 gtopage.guidehtml，雙語）
	innertext("#gtoguidetitle",gtotext("guidetitle"),false)
	let guidebody=domgetid("gtoguidebody")
	if(guidebody){ guidebody.innerHTML=gtotext("guidehtml") }
	innertext("#gtostreetnote",gtotext("streetnote"),false)
}

/* ============== 動作樹（push/fold 對戰樹） ============== */

let gtotree={ pointer:0, jammeridx:-1, jammerpos:null, line:[], terminal:"" }

// 目前已有幾人跟注全下（多人全下池用）
function gtotreecallcount(){
	let n=0
	for(let i=0;i<gtotree.line.length;i=i+1){ if(gtotree.line[i].action=="call"){ n=n+1 } }
	return n
}

// MTT 每座位計分牌（chip-EV 參考，非 ICM）：每座位可有自己的計分牌。
// gtoperseat 關閉時＝所有座位用統一 gtostate.stackbb（原本行為）。
let gtoseatstacks={}
let gtoperseat=false

function gtoavailstacks(){
	// 依情境給每座位計分牌可貼齊的檔位：深碼樹用 10–300 深碼檔，push/fold 用 1–30。
	if(gtostate.spot=="DEEPTREE"){
		return (typeof GTOSTACKS!="undefined"&&GTOSTACKS["DEEPTREE"])||[10,25,50,100,200]
	}
	return (typeof GTOSTACKS!="undefined"&&GTOSTACKS["PUSHFOLD"])||[10,15,20,25,30]
}
function gtostackround(bb){
	let opts=gtoavailstacks()
	let best=opts[0]
	for(let i=0;i<opts.length;i=i+1){
		if(Math.abs(opts[i]-bb)<Math.abs(best-bb)){ best=opts[i] }
	}
	return best
}
// 某座位實際使用的計分牌（每座位模式用自己的、四捨五入到最近檔；否則用統一計分牌）
function gtoseatstack(pos){
	if(gtoperseat&&gtoseatstacks[pos]!=null){ return gtostackround(gtoseatstacks[pos]) }
	return gtostate.stackbb
}

function gtotreeopenspot(actorpos){
	return gtopushfoldopen(gtostate.gametype,gtostate.tabletype,gtoseatstack(actorpos),actorpos,gtoseats)
}

// 一手牌 label 的實際 combo 數：對子 6、同花 4、不同花 12
function gtocombolabel(label){
	let n=12
	if(label.length==2){ n=6 }
	else if(label.charAt(2)=="s"){ n=4 }
	return n
}
// 粗略牌力分數（多人全下池收緊用）：近似翻前全下強度排序——大對子最強，高張同花/連張其次，
// 讓 AKs/AQs 這類 broadway 能排在中小對子附近，而不是被所有對子壓在後面。
function gtohandstrength(label){
	let n=gtoranks.length
	let hi=n-gtoranks.indexOf(label.charAt(0))   // A 最強（HE 13、SD 9），2 最小
	let score=0
	if(label.length==2){
		score=hi*hi*2.2+40                       // 對子：平方放大高牌，AA 遠高於小對
	}else{
		let lo=n-gtoranks.indexOf(label.charAt(1))
		let suited=0
		if(label.charAt(2)=="s"){ suited=8 }
		let gap=hi-lo
		let connector=0
		if(gap<=2){ connector=4-gap }
		score=hi*hi*1.1+lo*2.4+suited+connector
	}
	return score
}
// 多人全下池：面對 N 位已全下/跟注的對手，要贏得攤牌需打敗更多手 → 跟注範圍要更緊。
// 沒有嚴謹多人 solver 資料，這裡用啟發式：每多一位先前跟注者，就依牌力只保留較強的一部分。
function gtomultiwaytighten(spotdata,priorcallers){
	if(!spotdata||priorcallers<=0){ return spotdata }
	let tokens=spotdata.call||spotdata.jam
	if(!tokens){ return spotdata }
	let handset={}
	for(let i=0;i<tokens.length;i=i+1){
		let hs=gtoexpand(tokens[i])
		for(let j=0;j<hs.length;j=j+1){ handset[hs[j]]=true }
	}
	let hands=Object.keys(handset)
	hands.sort(function(a,b){ return gtohandstrength(b)-gtohandstrength(a) })
	let total=0
	for(let i=0;i<hands.length;i=i+1){ total=total+gtocombolabel(hands[i]) }
	let keep=total/(1+0.5*priorcallers)   // 1 人先跟→留 2/3；2 人→1/2；3 人→2/5…
	let acc=0
	let kept=[]
	for(let i=0;i<hands.length;i=i+1){
		if(acc<keep){
			kept.push(hands[i])
			acc=acc+gtocombolabel(hands[i])
		}
	}
	let out={}
	if(spotdata.call){ out.call=kept }
	else{ out.jam=kept }
	return out
}

// 目前 overcaller 的有效計分牌（min(自己, 全下者)，貼齊 push/fold 檔位）
function gtomultiwayeff(){
	let caller=gtoseats[gtotree.pointer]
	return gtostackround(Math.min(gtoseatstack(caller),gtoseatstack(gtotree.jammerpos)))
}
// 3 人全下池（正好 1 位先前跟注）第三家的「實算 overcall 範圍」；沒有對應資料回 null。
function gtomultiwaycallspot(){
	if(gtostate.gametype!="HE"||typeof GTOMULTIWAYCALL=="undefined"||gtostate.tabletype=="2MAX"){ return null }
	if(gtotreecallcount()!=1){ return null }
	let bucket=gtopfbucket(gtostate.tabletype,gtotree.jammerpos,gtoseats)
	return GTOMULTIWAYCALL[gtoantecents()+"_"+gtomultiwayeff()+"_"+bucket]||null
}

function gtotreecallspot(){
	// 跟注方＝目前行動者；有效計分牌＝min(跟注者, 全下者)，因為單挑攤牌頂多輸贏較小那疊
	let caller=gtoseats[gtotree.pointer]
	let eff=gtostackround(Math.min(gtoseatstack(caller),gtoseatstack(gtotree.jammerpos)))
	let base=null
	if(gtostate.gametype=="SD"){
		if(gtostate.tabletype=="2MAX"){
			base=(typeof SDRANGELIST!="undefined"&&SDRANGELIST["SD_2MAX_PUSHFOLD_"+eff+"BB_BB"])||null
		}else{
			let sdbucket=gtopfbucket(gtostate.tabletype,gtotree.jammerpos,gtoseats)
			base=(typeof SDCALLVSJAM!="undefined"&&SDCALLVSJAM[eff+"_"+sdbucket])||null
		}
	}else if(gtostate.tabletype=="2MAX"){
		base=(typeof GTORANGELIST!="undefined"&&GTORANGELIST["HE_2MAX_PUSHFOLD_"+eff+"BB_BB"])||null
	}else{
		let bucket=gtopfbucket(gtostate.tabletype,gtotree.jammerpos,gtoseats)
		base=gtoantecallspot(eff,bucket)
		if(!base){ base=(typeof GTOCALLVSJAM!="undefined"&&GTOCALLVSJAM[eff+"_"+bucket])||null }
	}
	// 3 人池（1 位先前跟注）用 eval7 實算的 overcall 範圍；更多人（4+）或無資料才退回啟發式收緊
	let exact=gtomultiwaycallspot()
	if(exact){ return exact }
	return gtomultiwaytighten(base,gtotreecallcount())
}

// 當前行動者的範圍（給矩陣畫）。終局或無決策回 null。
function gtotreeactorspot(){
	if(gtotree.terminal){
		return null
	}
	let actor=gtoseats[gtotree.pointer]
	if(!actor){
		return null
	}
	if(gtotree.jammeridx>=0){
		return gtotreecallspot()
	}
	if(actor=="BB"){
		return null
	}
	return gtotreeopenspot(actor)
}

function gtotreefacingjam(){
	return gtotree.jammeridx>=0
}

function gtotreeresolveterminal(){
	if(gtotree.terminal){
		return
	}
	if(gtotree.pointer>=gtoseats.length){
		// 全部座位都行動完：有人全下＋有人跟 → 攤牌（可能多人）；有人全下但無人跟 → 收池；沒人全下 → BB 收盲
		if(gtotree.jammeridx>=0){
			gtotree.terminal=gtotreecallcount()>0?"showdown":"jamwin"
		}else{
			gtotree.terminal="bbwin"
		}
		return
	}
	let actor=gtoseats[gtotree.pointer]
	// 翻前蓋到大盲、且沒人全下：BB 直接收下盲注，無決策
	if(gtotree.jammeridx<0&&actor=="BB"){
		gtotree.terminal="bbwin"
	}
}

function gtotreereset(){
	gtotree.pointer=0
	gtotree.jammeridx=-1
	gtotree.jammerpos=null
	gtotree.line=[]
	gtotree.terminal=""
	gtotreeresolveterminal()
}

// 純轉移（不重繪），供 act 與 back 重播共用
function gtotreeapply(action){
	let actor=gtoseats[gtotree.pointer]
	if(!actor||gtotree.terminal){
		return
	}
	gtotree.line.push({ pos:actor, action:action })
	if(gtotree.jammeridx<0){
		if(action=="jam"){
			gtotree.jammeridx=gtotree.pointer
			gtotree.jammerpos=actor
		}
		gtotree.pointer=gtotree.pointer+1
	}else{
		// 面對全下：不論跟注或棄牌都往下讓後面的人也能決策 → 允許多人全下池
		gtotree.pointer=gtotree.pointer+1
	}
	gtotreeresolveterminal()
}

function gtotreeact(action){
	gtotreeapply(action)
	gtoselected=""
	gtotreerender()
	gtorendergrid()
}

function gtotreeback(){
	if(!gtotree.line.length){
		return
	}
	let actions=gtotree.line.slice(0,-1).map(function(e){ return e.action })
	gtotreereset()
	for(let i=0;i<actions.length;i=i+1){
		gtotreeapply(actions[i])
	}
	gtoselected=""
	gtotreerender()
	gtorendergrid()
}

function gtotreeavailableactions(){
	if(gtotree.terminal){
		return []
	}
	let actor=gtoseats[gtotree.pointer]
	if(!actor){
		return []
	}
	if(gtotree.jammeridx>=0){
		return ["call","fold"]
	}
	if(actor=="BB"){
		return []
	}
	return ["jam","fold"]
}

function gtotreeshortlabel(action){
	let key="act_"+action
	let text=gtotext(key)
	return text==key?gtoactionlabel(action):text
}

function gtotreestatustext(){
	let actor=gtoseats[gtotree.pointer]
	if(gtotree.terminal=="bbwin"){
		return gtotext("tree_bbwin")
	}
	if(gtotree.terminal=="jamwin"){
		return gtotext("tree_jamwin").replace("{jammer}",gtoposlabel(gtotree.jammerpos))
	}
	if(gtotree.terminal=="showdown"){
		let n=gtotreecallcount()+1   // 跟注者 + 全下者
		if(n>=3){ return gtotext("tree_showdown_multi").replace("{n}",n) }
		return gtotext("tree_showdown")
	}
	if(gtotree.jammeridx>=0){
		let base=gtotext("tree_facing").replace("{seat}",gtoposlabel(actor)).replace("{jammer}",gtoposlabel(gtotree.jammerpos))
		let cc=gtotreecallcount()
		if(cc>0){
			if(gtomultiwaycallspot()){ base=base+gtotext("tree_facing_exact3") }
			else{ base=base+gtotext("tree_facing_callers").replace("{n}",cc) }
		}
		return base
	}
	return gtotext("tree_open").replace("{seat}",gtoposlabel(actor))
}

function gtotreerenderstrip(){
	let linemap={}
	for(let i=0;i<gtotree.line.length;i=i+1){
		linemap[gtotree.line[i].pos]=gtotree.line[i].action
	}
	let html=""
	for(let i=0;i<gtoseats.length;i=i+1){
		let seat=gtoseats[i]
		let state="pending"
		let actiontext=""
		if(linemap[seat]){
			state=linemap[seat]
			actiontext=gtotreeshortlabel(linemap[seat])
		}else if(!gtotree.terminal&&i==gtotree.pointer){
			state="act"
			actiontext=gtotext("tree_toact")
		}else{
			actiontext=gtotext("tree_pending")
		}
		let herobadge=seat==gtostate.position?`<span class="gtoseathero">${gtotext("tree_hero")}</span>`:""
		html=html+`
			<div class="gtoseat gtoseat-${state} cursor-pointer" data-gtoseatjump="${i}" title="${gtotext("tree_jumphint")}">
				<div class="gtoseatpos">${gtoposlabel(seat)}${herobadge}</div>
				<div class="gtoseatact">${actiontext}</div>
			</div>
		`
	}
	innerhtml("#gtotreestrip",html,false)
	let seats=document.querySelectorAll("#gtotreestrip [data-gtoseatjump]")
	for(let i=0;i<seats.length;i=i+1){
		seats[i].addEventListener("click",function(){ gtotreejumpto(Number(this.getAttribute("data-gtoseatjump"))) })
	}
}

// 點座位快速跳位：重設後把該座位「之前」的每個人都設為蓋牌，讓該座位成為目前行動者。
function gtotreejumpto(idx){
	gtotreereset()
	for(let i=0;i<idx;i=i+1){
		if(gtotree.terminal){ break }
		gtotreeapply("fold")
	}
	gtoselected=""
	gtotreerender()
	gtorendergrid()
}

function gtotreerenderline(){
	if(!gtotree.line.length){
		innerhtml("#gtotreeline",`<span class="gtolinetag gtolinetag-empty">${gtotext("tree_linestart")}</span>`,false)
		return
	}
	let html=""
	for(let i=0;i<gtotree.line.length;i=i+1){
		let e=gtotree.line[i]
		html=html+`<span class="gtolinetag gtolinetag-${e.action}">${gtoposlabel(e.pos)} ${gtotreeshortlabel(e.action)}</span>`
	}
	innerhtml("#gtotreeline",html,false)
}

// 對戰樹目前行動者的整體佔比/combo 數（跟 flop wizard 的 fsactionstats 同樣算法）
// 給任一 spotdata 算「每個動作」整體佔比與 combo 數，PFTREE / DEEPTREE 共用
function gtogenericactionstats(spotdata){
	let map=spotdata?gtobuildactionmap(spotdata):{}
	let totals={}
	let totalcombos=0
	let n=gtoranks.length
	for(let r=0;r<n;r=r+1){
		for(let c=0;c<n;c=c+1){
			let label=gtohandlabel(r,c)
			let combos=gtocombos(r,c)
			let freqs=gtohandactionfreq(spotdata,map,label)
			totalcombos=totalcombos+combos
			for(let a in freqs){
				totals[a]=(totals[a]||0)+combos*freqs[a]/100
			}
		}
	}
	return { totals:totals, totalcombos:totalcombos }
}

function gtotreeactionstats(){
	return gtogenericactionstats(gtotreeactorspot())
}

function gtotreeactioncolor(a){
	if(a=="fold"){ return "#18181b" }
	if(a=="jam"){ return "#e11d48" }
	if(a=="call"){ return "#38bdf8" }
	return "#888"
}

function gtotreerenderactions(){
	let actions=gtotreeavailableactions()
	let stats=gtotreeactionstats()
	let html=""
	for(let i=0;i<actions.length;i=i+1){
		let a=actions[i]
		let combos=stats.totals[a]||0
		let pct=stats.totalcombos>0?Math.round(combos/stats.totalcombos*1000)/10:0
		html=html+`
			<div class="min-w-[120px] flex-1 cursor-pointer rounded-2xl p-3 transition hover:brightness-110" style="background:${gtotreeactioncolor(a)}" data-gtotreeact="${a}">
				<div class="text-sm font-bold text-white">${gtotreeshortlabel(a)}</div>
				<div class="mt-1 text-2xl font-extrabold text-white">${pct}%</div>
				<div class="text-xs text-white/80">${Math.round(combos*10)/10} combos</div>
			</div>
		`
	}
	if(gtotree.terminal=="showdown"){
		html=html+`<a class="gtotreebtn gtotreebtn-link" href="equity.html">${gtotext("tree_gotoequity")}</a>`
	}
	innerhtml("#gtotreeactions",html,false)
	let acts=document.querySelectorAll("[data-gtotreeact]")
	for(let i=0;i<acts.length;i=i+1){
		acts[i].addEventListener("click",function(){
			gtotreeact(this.getAttribute("data-gtotreeact"))
		})
	}
}

// 每座位計分牌輸入列（MTT）：每個座位一個數字框，改動就重繪對戰樹
function gtoperseatrender(){
	let row=domgetid("gtoperseatrow")
	if(!row){ return }
	row.style.display=gtoperseat?"flex":"none"
	if(!gtoperseat){ return }
	let html=""
	for(let i=0;i<gtoseats.length;i=i+1){
		let seat=gtoseats[i]
		if(gtoseatstacks[seat]==null){ gtoseatstacks[seat]=gtostate.stackbb }
		html=html+`<label class="flex items-center gap-1 text-xs text-zinc-400">${gtoposlabel(seat)}
			<input type="number" min="1" step="0.5" inputmode="decimal" value="${gtoseatstacks[seat]}" data-gtoseat="${seat}"
				class="w-16 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"></label>`
	}
	innerhtml(row,html,false)
	let inputs=document.querySelectorAll("[data-gtoseat]")
	for(let i=0;i<inputs.length;i=i+1){
		inputs[i].addEventListener("input",function(){
			gtoseatstacks[this.getAttribute("data-gtoseat")]=Number(this.value)||gtostate.stackbb
			gtoactivetreerender()
		})
	}
}

// 對戰樹情境摘要：人數 · 結構 · ante（隨新控制項變化，讓樹看得出目前是哪個局面）
function gtotreecontext(){
	let parts=[gtonplayers()+gtotext("playersuffix"), gtostructurelabel(gtostate.structure)]
	let ac=gtoantecents()
	if(ac){ parts.push("ante "+(ac/100)+"bb") }
	return parts.join(" · ")
}
function gtotreesethint(){
	innerhtml("#gtotreehint",gtotext("tree_hint")+" <span class='text-emerald-300 font-bold'>｜ "+gtotreecontext()+"</span>",false)
}
function gtotreerender(){
	innertext("#gtotreestatus",gtotreestatustext(),false)
	gtotreesethint()
	gtoperseatrender()
	gtotreerenderstrip()
	gtotreerenderline()
	gtotreerenderactions()
}

/* ============== 深計分牌對戰樹（RFI → 3bet → 面對3bet → 面對4bet，一路串起來） ============== */
// 不用像 3BET/VS3BET/VS4BET 那樣先選情境、再從一整排「誰 vs 誰」的清單挑對位——
// 直接跟 PFTREE 一樣：一路點動作，系統自己接上對應的位置對位資料。
// level: 0=還沒人開池 / 1=面對開池 / 2=開池者面對3bet / 3=3bet者面對4bet

// level 0＝還沒人開池（用 pointer 依序）；level>=1＝面對下注（用 queue 排隊，才能正確處理加注後
// 「從加注者下一位繞一圈、每個沒蓋牌的人依序回應」——例如 BTN 開池、SB 3bet 後，要先換 BB 再回 BTN）。
let gtodeep={ pointer:0, level:0, opener:null, threebettor:null, aggressor:null, queue:[], foldedset:{}, limpers:[], callers:[], line:[], terminal:"" }
// 跟注(limp)一律是預設動作；範圍由資料決定，正常深度沒有 limp 就顯示 0%（不硬寫）。

// 目前行動者：level 0 用 pointer；面對下注用 queue 的第一位
function gtodeepactor(){
	if(gtodeep.terminal){ return null }
	if(gtodeep.level==0){ return gtoseats[gtodeep.pointer] }
	return gtodeep.queue.length?gtodeep.queue[0]:null
}
// 開池後要回應的人：開池者之後、到 BB 為止、沒蓋牌的（不繞回頭）
function gtodeepseatsafter(pos){
	let pi=gtoseats.indexOf(pos)
	let out=[]
	for(let i=pi+1;i<gtoseats.length;i=i+1){ if(!gtodeep.foldedset[gtoseats[i]]){ out.push(gtoseats[i]) } }
	return out
}
// 有人加注後要回應的人：從加注者下一位開始繞一圈、沒蓋牌的、不含加注者自己
function gtodeepresponders(raiser){
	let ri=gtoseats.indexOf(raiser)
	let out=[]
	for(let step=1;step<gtoseats.length;step=step+1){
		let seat=gtoseats[(ri+step)%gtoseats.length]
		if(seat==raiser){ break }
		if(!gtodeep.foldedset[seat]){ out.push(seat) }
	}
	return out
}
// 走到翻牌的人數：line 裡每位最後一個動作不是棄牌的
function gtodeepflopcount(){
	let last={}
	for(let i=0;i<gtodeep.line.length;i=i+1){ last[gtodeep.line[i].pos]=gtodeep.line[i].action }
	let n=0
	for(let p in last){ if(last[p]!="fold"){ n=n+1 } }
	return n
}

// 3bet/vs3bet/vs4bet 資料只有兩檔 profile：淺深碼(~50bb，3bet/4bet 更寬) 與 深碼(~100bb)，
// 各檔對應到最近的 profile（3bet/4bet 範圍在 75-200bb 幾乎不變）。
// 開池 RFI 則是 25-300bb 每檔各自的範圍（gtodeeprfi.py 生成），不走 profile。
// 目前決策的有效計分牌(bb)：每座位不同計分牌(gtoperseat)時用相關座位；否則統一 gtostate.stackbb。
//   開池＝開池者自己的計分牌；面對加注／再加注＝雙方取 min（攤牌頂多輸贏較小那疊）。
function gtodeepeffstack(){
	if(!gtoperseat){ return gtostate.stackbb }
	let actor=gtodeepactor()
	if(!actor){ return gtostate.stackbb }
	if(gtodeep.level==0){ return gtoseatstack(actor) }   // 開池＝開池者自己
	return Math.min(gtoseatstack(actor),gtoseatstack(gtodeep.aggressor))   // 面對下注＝與加注者取 min
}
function gtodeepprofile(){
	return gtodeepeffstack()<62?50:100
}
// 深碼對戰樹的四層 range 查詢，依遊戲類型（GTO*/SD*）+ 深碼 profile 切換資料。
function gtodeepdata(base100, base50){
	if(gtostate.gametype=="SD"){ return null }   // 短牌走各自的 SD* 分支，不到這裡
	if(gtodeepprofile()==50&&typeof base50!="undefined"){ return base50 }
	return typeof base100!="undefined"?base100:null
}
// 單挑(2-max, HE)用 GTOHU 專屬資料；否則走 9/6-max 對位資料
function gtodeephu(){
	return gtostate.gametype!="SD"&&gtostate.tabletype=="2MAX"&&typeof GTOHU!="undefined"
}
// 深碼 RFI 的查表位置：9/6-max 有自己的資料、位置名正確；其他人數（自然命名 UTG 起）要用 k(後面人數)
// 對回 9-max 同 k 的位置——否則 4-max 的 UTG(k3) 會誤查成 9-max UTG(k8)，開得太緊。
function gtodeeprfipos(actor){
	if(gtostate.tabletype=="9MAX"||gtostate.tabletype=="6MAX"){ return actor }
	if(actor=="SB"||actor=="BB"){ return actor }
	let i=gtoseats.indexOf(actor)
	let k=i<0?2:gtoseats.length-1-i
	if(k<2){ k=2 } if(k>9){ k=9 }
	return (typeof GTOK2POS!="undefined"&&GTOK2POS[k])||"UTG"
}
function gtodeepopenspot(actor){
	if(gtostate.gametype=="SD"){
		let open=(typeof SDRFI!="undefined"&&SDRFI[actor])||null
		if(actor=="SB"&&open){
			return gtodeepreferencesblimp(open)
		}
		return open
	}
	let open
	if(gtodeephu()){ open=GTOHU.SB_OPEN }   // 單挑：SB 按鈕寬開牌
	// 開池層用每檔計分牌各自的 RFI（gtodeeprfi.py 生成）；位置以 k 對應 9-max、每座位模式用開池者自己的計分牌
	else{ open=(typeof GTORFI!="undefined"&&GTORFI["HE_"+gtodeeptt()+"_RFI_"+gtodeepeffstack()+"BB_"+gtodeeprfipos(actor)])||null }
	// 蓋到小盲＝SB vs BB：SB 除了加注，還有補牌(跟注)範圍（真 GTO；加注重疊的歸加注）
	if(actor=="SB"&&open&&typeof GTOSB_LIMP!="undefined"){
		return { raise:(open.raise||[]), limp:GTOSB_LIMP }
	}
	return open
}
function gtodeep3betspot(actor){
	if(gtodeephu()){ return GTOHU.BB_3BET }   // 單挑：BB 面對 SB 開牌
	return gtodeep3betspotfor(actor,gtodeep.opener)
}
function gtodeep3betspotfor(actor,opener){
	let d=gtostate.gametype=="SD"?(typeof SD3BET!="undefined"?SD3BET:null):gtodeepdata(typeof GTO3BET!="undefined"?GTO3BET:undefined,typeof GTO3BET_50!="undefined"?GTO3BET_50:undefined)
	return (d&&d[actor+"v"+opener])||null
}
function gtodeepvs3betspot(){
	if(gtodeephu()){ return GTOHU.SB_VS3BET }   // 單挑：SB 面對 BB 的 3bet
	let d=gtostate.gametype=="SD"?(typeof SDVS3BET!="undefined"?SDVS3BET:null):gtodeepdata(typeof GTOVS3BET!="undefined"?GTOVS3BET:undefined,typeof GTOVS3BET_50!="undefined"?GTOVS3BET_50:undefined)
	return (d&&d[gtodeep.opener+"v"+gtodeep.threebettor])||null
}
function gtodeepvs4betspot(){
	if(gtodeephu()){ return GTOHU.BB_VS4BET }   // 單挑：BB 面對 SB 的 4bet
	let d=gtostate.gametype=="SD"?(typeof SDVS4BET!="undefined"?SDVS4BET:null):gtodeepdata(typeof GTOVS4BET!="undefined"?GTOVS4BET:undefined,typeof GTOVS4BET_50!="undefined"?GTOVS4BET_50:undefined)
	return (d&&d[gtodeep.threebettor+"v"+gtodeep.opener])||null
}

function gtodeepprioraction(actor){
	for(let i=gtodeep.line.length-1;i>=0;i=i-1){
		if(gtodeep.line[i].pos==actor){
			return gtodeep.line[i].action
		}
	}
	return ""
}

function gtoreferencecardvalue(card){
	let idx=gtoranks.indexOf(card)
	if(idx<0){ return 0 }
	return 14-idx
}

function gtoreferencehandscore(hand){
	if(hand.length==2){
		return 1000+gtoreferencecardvalue(hand.charAt(0))*20
	}
	let hi=gtoreferencecardvalue(hand.charAt(0))
	let lo=gtoreferencecardvalue(hand.charAt(1))
	let suited=hand.charAt(2)=="s"
	let gap=hi-lo
	let score=hi*30+lo*4
	if(suited){ score=score+20 }
	if(gap==1){ score=score+16 }
	else if(gap==2){ score=score+8 }
	if(hi==14&&suited){ score=score+10 }
	if(!suited){ score=score-5 }
	return score
}

function gtoreferencecombos(hand){
	if(hand.length==2){ return 6 }
	if(hand.charAt(2)=="s"){ return 4 }
	return 12
}

function gtoreferencehandlist(tokenlist){
	let seen={}
	let handlist=[]
	if(tokenlist){
		for(let i=0;i<tokenlist.length;i=i+1){
			let expanded=gtoexpand(tokenlist[i])
			for(let j=0;j<expanded.length;j=j+1){
				if(!seen[expanded[j]]){
					seen[expanded[j]]=true
					handlist.push(expanded[j])
				}
			}
		}
	}
	handlist.sort(function(a,b){
		let diff=gtoreferencehandscore(b)-gtoreferencehandscore(a)
		if(diff!=0){ return diff }
		if(a<b){ return -1 }
		if(a>b){ return 1 }
		return 0
	})
	return handlist
}

function gtoreferenceallhandlist(){
	let handlist=[]
	for(let r=0;r<gtoranks.length;r=r+1){
		for(let c=0;c<gtoranks.length;c=c+1){
			handlist.push(gtohandlabel(r,c))
		}
	}
	handlist.sort(function(a,b){
		let diff=gtoreferencehandscore(b)-gtoreferencehandscore(a)
		if(diff!=0){ return diff }
		if(a<b){ return -1 }
		if(a>b){ return 1 }
		return 0
	})
	return handlist
}

function gtoreferencedifference(handlist,usedlist){
	let used={}
	let out=[]
	for(let i=0;i<usedlist.length;i=i+1){
		used[usedlist[i]]=true
	}
	for(let i=0;i<handlist.length;i=i+1){
		if(!used[handlist[i]]){
			out.push(handlist[i])
		}
	}
	return out
}

function gtoreferenceactiontokens(spotdata,actionlist){
	let tokenlist=[]
	if(spotdata){
		for(let i=0;i<actionlist.length;i=i+1){
			let itemlist=spotdata[actionlist[i]]
			if(itemlist){
				for(let j=0;j<itemlist.length;j=j+1){
					tokenlist.push(itemlist[j])
				}
			}
		}
	}
	return tokenlist
}

function gtoreferencepick(handlist,startfraction,endfraction){
	let total=0
	let out=[]
	for(let i=0;i<handlist.length;i=i+1){
		total=total+gtoreferencecombos(handlist[i])
	}
	if(total<=0){ return out }
	let acc=0
	for(let i=0;i<handlist.length;i=i+1){
		let pct=acc/total
		acc=acc+gtoreferencecombos(handlist[i])
		if(pct>=startfraction&&pct<endfraction){
			out.push(handlist[i])
		}
	}
	return out
}

function gtoreferencefillminimum(handlist,primarylist,secondarylist,mincount){
	let out=secondarylist.slice()
	let used={}
	for(let i=0;i<primarylist.length;i=i+1){
		used[primarylist[i]]=true
	}
	for(let i=0;i<out.length;i=i+1){
		used[out[i]]=true
	}
	for(let i=0;i<handlist.length;i=i+1){
		if(out.length>=mincount){ break }
		if(!used[handlist[i]]){
			out.push(handlist[i])
			used[handlist[i]]=true
		}
	}
	return out
}

function gtoreferencefallbackhandlist(level){
	let tokenlist=["QQ+","AKs","AKo","JJ","AQs","TT","AJs","KQs"]
	if(level>=3){
		tokenlist=["KK+","AKs","AKo","QQ","JJ"]
	}
	return gtoreferencehandlist(tokenlist)
}

function gtodeepreferencebbvslimp(){
	let firstlimper="SB"
	if(gtodeep.limpers.length){
		firstlimper=gtodeep.limpers[0]
	}
	let source=gtodeep3betspotfor("BB",firstlimper)
	let handlist=gtoreferencehandlist(gtoreferenceactiontokens(source,["raise","call"]))
	if(!handlist.length){
		handlist=gtoreferencefallbackhandlist(1)
	}
	let endraise=0.45
	if(gtodeep.limpers.length>=2){ endraise=0.32 }
	if(gtodeep.limpers.length>=3){ endraise=0.24 }
	return {
		"spot":"BBVSLIMPREF",
		"matchup":"BBvLIMP",
		"raise":gtoreferencepick(handlist,0,endraise),
		"check":gtoreferencepick(handlist,endraise,1)
	}
}

function gtodeepsolvedspot(actor){
	if(typeof GTOSOLVEDDEEP=="undefined"){ return null }
	if(gtostate.gametype=="HE"&&gtostate.tabletype=="6MAX"&&gtodeepeffstack()==100&&actor=="BB"&&gtodeep.level==0&&gtodeep.limpers.length==1){
		let key="HE_6MAX_100BB_"+gtodeep.limpers[0]+"LIMP_BB"
		return GTOSOLVEDDEEP[key]||null
	}
	return null
}

function gtodeepreferencevs3bet(actor){
	let source=gtodeep3betspotfor(actor,gtodeep.opener)
	let prior=gtodeepprioraction(actor)
	let handlist=[]
	let endraise=0.10
	let endcall=0.32
	if(prior=="call"){
		handlist=gtoreferencehandlist(gtoreferenceactiontokens(source,["call"]))
		endraise=0.12
		endcall=0.55
	}else{
		handlist=gtoreferencehandlist(gtoreferenceactiontokens(source,["raise","call"]))
	}
	if(!handlist.length){
		handlist=gtoreferencefallbackhandlist(2)
	}
	let raiselist=gtoreferencepick(handlist,0,endraise)
	let calllist=gtoreferencepick(handlist,endraise,endcall)
	calllist=gtoreferencefillminimum(handlist,raiselist,calllist,2)
	return {
		"spot":"COLDVS3BETREF",
		"matchup":actor+"v"+gtodeep.threebettor,
		"raise":raiselist,
		"call":calllist
	}
}

function gtodeepreferencevs4bet(actor){
	let prior=gtodeepprioraction(actor)
	let source=gtodeep3betspotfor(actor,gtodeep.opener)
	let handlist=[]
	let endraise=0.04
	let endcall=0.12
	if(prior=="call"){
		handlist=gtoreferencehandlist(gtoreferenceactiontokens(source,["call"]))
		endraise=0.06
		endcall=0.18
	}else{
		handlist=gtoreferencehandlist(gtoreferenceactiontokens(source,["raise","call"]))
	}
	if(!handlist.length){
		handlist=gtoreferencefallbackhandlist(3)
	}
	let raiselist=gtoreferencepick(handlist,0,endraise)
	let calllist=gtoreferencepick(handlist,endraise,endcall)
	calllist=gtoreferencefillminimum(handlist,raiselist,calllist,2)
	return {
		"spot":"COLDVS4BETREF",
		"matchup":actor+"v"+gtodeep.aggressor,
		"raise":raiselist,
		"call":calllist
	}
}

// 當前行動者的範圍（給矩陣畫）。終局或無資料回 null（按鈕仍可走）。
function gtodeepreferencesblimp(open){
	let raiselist=gtoreferencehandlist(gtoreferenceactiontokens(open,["raise"]))
	let handlist=gtoreferencedifference(gtoreferenceallhandlist(),raiselist)
	let limplist=gtoreferencepick(handlist,0.10,0.42)
	limplist=gtoreferencefillminimum(handlist,[],limplist,4)
	return {
		"spot":"SDSBLIMPREF",
		"position":"SB",
		"raise":open.raise||[],
		"limp":limplist
	}
}

function gtodeepactorspot(){
	if(gtodeep.terminal){ return null }
	let actor=gtodeepactor()
	if(!actor){ return null }
	if(gtodeep.level==0){
		let solvedspot=gtodeepsolvedspot(actor)
		if(solvedspot){ return solvedspot }
		if(actor=="BB"){ return gtodeepreferencebbvslimp() }   // BB 被 limp 到：用既有 BB vs limper 對位資料切 iso / check 參考範圍
		return gtodeepopenspot(actor)     // 只給開池範圍；limp 沒資料就 0%
	}
	if(gtodeep.level==1){ return gtodeep3betspot(actor) }
	// 面對 3bet：開池者用正式 vs3bet；冷跟者 / 尚未行動者用既有對位資料切出 squeeze / cold 4bet 參考範圍
	if(gtodeep.level==2){
		if(actor==gtodeep.opener){ return gtodeepvs3betspot() }
		return gtodeepreferencevs3bet(actor)
	}
	// 面對 4bet：3bet 者用正式 vs4bet；旁邊玩家 / 冷跟者用更緊的 cold vs4bet 參考範圍
	if(gtodeep.level==3){
		if(actor==gtodeep.threebettor){ return gtodeepvs4betspot() }
		return gtodeepreferencevs4bet(actor)
	}
	return null
}

function gtodeepresolveterminal(){
	if(gtodeep.terminal){ return }
	if(gtodeep.level==0){
		if(gtodeep.pointer>=gtoseats.length){
			gtodeep.terminal=gtodeep.limpers.length>0?"limpflop":"allfold"
			return
		}
		// 蓋到 BB：沒人 limp → BB 收盲；有人 limp → BB 還要決策（過牌/iso），不是終局
		if(gtoseats[gtodeep.pointer]=="BB"&&gtodeep.limpers.length==0){ gtodeep.terminal="bbwin"; return }
		return
	}
	// 面對下注：排隊的人都回應完了 → 收線
	if(gtodeep.queue.length==0){
		if(gtodeep.callers.length>0){ gtodeep.terminal="flop" }   // 有人跟注 → 進翻牌（可能多人）
		else{ gtodeep.terminal=(gtodeep.aggressor==gtodeep.opener)?"openerwins":"threebettorwins" }   // 全蓋給最後加注者
	}
}

function gtodeepreset(){
	gtodeep.pointer=0
	gtodeep.level=0
	gtodeep.opener=null
	gtodeep.threebettor=null
	gtodeep.aggressor=null
	gtodeep.queue=[]
	gtodeep.foldedset={}
	gtodeep.limpers=[]
	gtodeep.callers=[]
	gtodeep.line=[]
	gtodeep.terminal=""
	gtodeepresolveterminal()
}

function gtodeepapply(action){
	let actor=gtodeepactor()
	if(!actor||gtodeep.terminal){ return }
	gtodeep.line.push({ pos:actor, action:action, level:gtodeep.level })
	if(gtodeep.level==0){
		if(action=="raise"){
			if(gtodeep.limpers.length>0){
				// 前面有人 limp → 隔離加注(iso)；limper 需個別回應，本工具此線終止並顯示 iso 範圍
				gtodeep.opener=actor
				gtodeep.terminal="isoraise"
			}else{
				gtodeep.opener=actor
				gtodeep.aggressor=actor
				gtodeep.level=1
				gtodeep.queue=gtodeepseatsafter(actor)   // 開池者之後的人依序面對開池
				gtodeep.callers=[]
			}
		}else if(action=="limp"){
			gtodeep.limpers.push(actor)
			gtodeep.pointer=gtodeep.pointer+1
		}else if(action=="check"){
			gtodeep.terminal="limpflop"   // BB 過牌，limped pot 直接進翻牌
		}else{
			gtodeep.foldedset[actor]=true
			gtodeep.pointer=gtodeep.pointer+1
		}
	}else{
		// 面對下注：目前行動者＝queue 第一位，行動後移出
		gtodeep.queue.shift()
		if(action=="fold"){
			gtodeep.foldedset[actor]=true
		}else if(action=="call"){
			gtodeep.callers.push(actor)   // 冷跟/跟注，之後 queue 空且有人跟 → 翻牌
		}else if(action=="raise"){
			if(gtodeep.level>=3){
				// 面對 4bet 再加注＝5bet 全下
				gtodeep.aggressor=actor
				gtodeep.terminal="allin"
			}else{
				gtodeep.level=gtodeep.level+1
				if(gtodeep.level==2){ gtodeep.threebettor=actor }
				gtodeep.aggressor=actor
				gtodeep.queue=gtodeepresponders(actor)   // 從加注者下一位繞一圈、每個沒蓋牌的人回應
				gtodeep.callers=[]
			}
		}
	}
	gtodeepresolveterminal()
}

function gtodeepact(action){
	gtodeepapply(action)
	gtoselected=""
	gtodeeprender()
	gtorendergrid()
}

function gtodeepback(){
	if(!gtodeep.line.length){ return }
	let actions=gtodeep.line.slice(0,-1).map(function(e){ return e.action })
	gtodeepreset()
	for(let i=0;i<actions.length;i=i+1){ gtodeepapply(actions[i]) }
	gtoselected=""
	gtodeeprender()
	gtorendergrid()
}

function gtodeepavailableactions(){
	if(gtodeep.terminal){ return [] }
	let actor=gtodeepactor()
	if(!actor){ return [] }
	if(gtodeep.level==0){
		if(actor=="BB"){
			return gtodeep.limpers.length>0?["raise","check"]:[]   // BB 被 limp 到：加注 或 過牌
		}
		return ["raise","limp","fold"]   // 開池 / 跟注(limp) / 棄牌 —— 跟注一律預設有，範圍由資料決定
	}
	return ["raise","call","fold"]
}

// 名詞統一：所有加注動作（開池/3bet/4bet/iso）一律叫「加注」；尺寸差異放在按鈕上（見 gtodeepraisesize）。
function gtodeepactionlabel(action,level){
	if(action=="fold"){ return gtotext("deepact_fold") }
	if(action=="call"){ return gtotext("deepact_call") }
	if(action=="limp"){ return gtotext("deepact_call") }
	if(action=="check"){ return gtotext("deepact_check") }
	if(action=="raise"){ return gtotext("deepact_raise") }
	return action
}

// 加注在各層的代表尺寸（只顯示在按鈕上，用來區分開池/3bet/4bet/5bet 而不用不同名詞）
function gtodeepraisesize(level){
	if(level==0){ return "2BB" }
	if(level==1){ return "6BB" }
	if(level==2){ return "13BB" }
	return gtotext("deepact_allin")
}

function gtodeepactioncolor(action){
	if(action=="fold"){ return "#18181b" }
	if(action=="call"){ return "#38bdf8" }
	if(action=="limp"){ return "#38bdf8" }
	if(action=="check"){ return "#64748b" }
	if(action=="raise"){ return "#e11d48" }
	return "#888"
}

function gtodeepstatustext(){
	let actor=gtodeepactor()
	if(gtodeep.terminal=="bbwin"){ return gtotext("deep_bbwin") }
	if(gtodeep.terminal=="allfold"){ return gtotext("deep_allfold") }
	// openerwins / threebettorwins：最後加注者無人跟、直接收池（用 aggressor 顯示）
	if(gtodeep.terminal=="openerwins"||gtodeep.terminal=="threebettorwins"){ return gtotext("deep_openerwins").replace("{pos}",gtoposlabel(gtodeep.aggressor)) }
	if(gtodeep.terminal=="flop"){ return gtotext("deep_flop").replace("{n}",gtodeepflopcount()) }
	if(gtodeep.terminal=="allin"){ return gtotext("deep_allin") }
	if(gtodeep.terminal=="limpflop"){ return gtotext("deep_limpflop").replace("{n}",gtodeepflopcount()) }
	if(gtodeep.terminal=="isoraise"){ return gtotext("deep_isoraise").replace("{pos}",gtoposlabel(gtodeep.opener)) }
	if(gtodeep.level==0&&actor=="BB"){ return gtotext("deep_bbfacelimp").replace("{n}",gtodeep.limpers.length) }
	if(gtodeep.level==0){ return gtotext("deep_open").replace("{pos}",gtoposlabel(actor)) }
	// 面對下注（各層統一）：面對「最後加注者」的加注
	return gtotext("deep_facing").replace("{pos}",gtoposlabel(actor)).replace("{opener}",gtoposlabel(gtodeep.aggressor))
}

function gtodeeprenderstrip(){
	let linemap={}
	for(let i=0;i<gtodeep.line.length;i=i+1){
		linemap[gtodeep.line[i].pos]=gtodeep.line[i]
	}
	let curactor=gtodeepactor()
	let html=""
	for(let i=0;i<gtoseats.length;i=i+1){
		let seat=gtoseats[i]
		let state="pending"
		let actiontext=""
		if(!gtodeep.terminal&&seat==curactor){
			// 目前行動者永遠標「行動中」——即使之前已行動過（例如開池者又要面對 3bet）
			state="act"
			actiontext=gtotext("tree_toact")
		}else if(linemap[seat]){
			state=linemap[seat].action
			actiontext=gtodeepactionlabel(linemap[seat].action,linemap[seat].level)
		}else{
			actiontext=gtotext("tree_pending")
		}
		let herobadge=seat==gtostate.position?`<span class="gtoseathero">${gtotext("tree_hero")}</span>`:""
		html=html+`
			<div class="gtoseat gtoseat-${state} cursor-pointer" data-gtoseatjump="${i}" title="${gtotext("tree_jumphint")}">
				<div class="gtoseatpos">${gtoposlabel(seat)}${herobadge}</div>
				<div class="gtoseatact">${actiontext}</div>
			</div>
		`
	}
	innerhtml("#gtotreestrip",html,false)
	let seats=document.querySelectorAll("#gtotreestrip [data-gtoseatjump]")
	for(let i=0;i<seats.length;i=i+1){
		seats[i].addEventListener("click",function(){ gtodeepjumpto(Number(this.getAttribute("data-gtoseatjump"))) })
	}
}

// 點座位快速跳位（深碼樹，開池前）：把該座位之前的每個人設為蓋牌，讓該座位成為開池者。
function gtodeepjumpto(idx){
	gtodeepreset()
	for(let i=0;i<idx;i=i+1){
		if(gtodeep.terminal||gtodeep.level!=0){ break }
		gtodeepapply("fold")
	}
	gtoselected=""
	gtodeeprender()
	gtorendergrid()
}

function gtodeeprenderline(){
	if(!gtodeep.line.length){
		innerhtml("#gtotreeline",`<span class="gtolinetag gtolinetag-empty">${gtotext("tree_linestart")}</span>`,false)
		return
	}
	let html=""
	for(let i=0;i<gtodeep.line.length;i=i+1){
		let e=gtodeep.line[i]
		html=html+`<span class="gtolinetag gtolinetag-${e.action}">${gtoposlabel(e.pos)} ${gtodeepactionlabel(e.action,e.level)}</span>`
	}
	innerhtml("#gtotreeline",html,false)
}

function gtodeeprenderactions(){
	let actions=gtodeepavailableactions()
	let stats=gtogenericactionstats(gtodeepactorspot())
	let html=""
	for(let i=0;i<actions.length;i=i+1){
		let a=actions[i]
		let combos=stats.totals[a]||0
		let pct=stats.totalcombos>0?Math.round(combos/stats.totalcombos*1000)/10:0
		// 按鈕上：加注顯示尺寸（加注 2BB/6BB/…），用來區分各層而不用不同名詞
		let tilelabel=a=="raise"?(gtodeepactionlabel(a,gtodeep.level)+" "+gtodeepraisesize(gtodeep.level)):gtodeepactionlabel(a,gtodeep.level)
		html=html+`
			<div class="min-w-[120px] flex-1 cursor-pointer rounded-2xl p-3 transition hover:brightness-110" style="background:${gtodeepactioncolor(a)}" data-gtodeepact="${a}">
				<div class="text-sm font-bold text-white">${tilelabel}</div>
				<div class="mt-1 text-2xl font-extrabold text-white">${pct}%</div>
				<div class="text-xs text-white/80">${Math.round(combos*10)/10} combos</div>
			</div>
		`
	}
	if(gtodeep.terminal=="flop"||gtodeep.terminal=="limpflop"){
		html=html+`<input type="button" class="gtotreebtn" id="gtodeepgotoflop" value="${gtotext("deep_gotoflop")}">`
	}
	innerhtml("#gtotreeactions",html,false)
	let acts=document.querySelectorAll("[data-gtodeepact]")
	for(let i=0;i<acts.length;i=i+1){
		acts[i].addEventListener("click",function(){ gtodeepact(this.getAttribute("data-gtodeepact")) })
	}
	let goflop=domgetid("gtodeepgotoflop")
	if(goflop){
		goflop.addEventListener("click",function(){
			gtostreet="flop"
			gtostreetapply()
			gtosavestate()
		})
	}
}

function gtodeeprender(){
	innertext("#gtotreestatus",gtodeepstatustext(),false)
	gtotreesethint()
	gtoperseatrender()
	gtodeeprenderstrip()
	gtodeeprenderline()
	gtodeeprenderactions()
}

// 重繪目前作用中的對戰樹（每座位計分牌列的輸入／開關改動時用，依情境走 PFTREE 或 DEEPTREE）
/*
	無資料節點的空狀態（TASK-117）。

	終局或真正缺資料時不能只讓矩陣 169 格全部灰底，使用者會分不清楚
	是「這手都不該打」還是「這裡根本沒資料」。cold 4bet、squeeze、BB 被 limp
	這些分支現在已由 gtodeepreference*() 補上參考範圍，只有其他未知分支才會進這裡。
*/
function gtotreefinished(){
	if(gtostate.spot=="PFTREE"&&gtotree.terminal){ return true }
	if(gtostate.spot=="DEEPTREE"&&gtodeep.terminal){ return true }
	return false
}

function gtorenderemptynode(spotdata){
	let host=domgetid("gtogridempty")
	if(!host){ return }
	let intree=(gtostate.spot=="PFTREE"||gtostate.spot=="DEEPTREE")
	if(spotdata||!intree||gtotreefinished()){
		host.style.display="none"
		return
	}
	host.style.display="block"
	innerhtml("#gtogridempty",
		`<div class="gtogridemptytitle">${gtotext("emptynodetitle")}</div>`+
		`<div class="gtogridemptydesc">${gtotext("emptynodedesc")}</div>`+
		`<div class="gtogridemptyhint">${gtotext("emptynodehinttitle")}</div>`+
		`<ul class="gtogridemptylist">`+
		`<li>${gtotext("emptynodehint1")}</li>`+
		`<li>${gtotext("emptynodehint2")}</li>`+
		`<li>${gtotext("emptynodehint3")}</li>`+
		`</ul>`,false)
}

/*
	情境摘要列（TASK-117，mockup 變體 A）。

	七排控制列原本一次全露、全部同權重，是「廉價感」最直接的來源。
	改成一行 chip，點哪一顆才展開哪一組；同時只開一組（手風琴），再點一次收起。

	分組刻意不是一顆 chip 對一排：「類型」把遊戲類型與下注結構合在一起、
	「進階」把 Ante 與 Hero 位置合在一起 —— 使用者心裡想的是「我要改什麼」，
	不是「這是第幾排」。
*/
const GTOCHIPGROUP=[
	{ key:"tabletype",rowlist:["gtorowtabletype"] },
	{ key:"stack",rowlist:["gtorowstack"] },
	{ key:"spot",rowlist:["gtorowspot"] },
	{ key:"gametype",rowlist:["gtorowgametype","gtorowstructure"] },
	{ key:"more",rowlist:["gtoanterow","gtorowpos"] }
]
let gtoopengroup=""

function gtochipvalue(key){
	if(key=="tabletype"){ return gtonplayers()+gtotext("playersuffix") }
	if(key=="stack"){ return gtostate.stackbb+"bb" }
	if(key=="spot"){ return gtospotlabel(gtostate.spot) }
	if(key=="gametype"){ return gtogamelabel(gtostate.gametype)+" · "+gtostructurelabel(gtostate.structure) }
	return ""
}

/*
	資料等級。**這是誠信需求不是裝飾** —— 淺碼 push/fold 是 gtopreflopnash.py 迭代求解的
	（TASK-114），深碼的開池與對抗範圍是外插參考（gtodeeprfi.py 自己的註解就寫明「非 solver」，
	而 TASK-115 的深碼 CFR 沒能取代它）。畫面上必須看得出差別。
*/
function gtodatagrade(){
	if(gtostate.structure=="FL"){ return "ref" }
	if(gtostate.spot=="PFTREE"||gtostate.spot=="PUSHFOLD"){ return "solved" }
	return "ref"
}

function gtorenderscenariobar(){
	let host=domgetid("gtoscenariobar")
	if(!host){ return }
	let html=""
	for(let i=0;i<GTOCHIPGROUP.length;i=i+1){
		let group=GTOCHIPGROUP[i]
		let opencls=(gtoopengroup==group.key)?" gtoscenariochipopen":""
		if(group.key=="more"){
			html=html+`<button type="button" class="gtoscenariochip gtoscenariochipmore${opencls}" data-gtochip="more">${gtotext("chipmore")}</button>`
		}else{
			html=html+`<button type="button" class="gtoscenariochip${opencls}" data-gtochip="${group.key}"><span class="gtoscenariochipkey">${gtotext("chip_"+group.key)}</span>${gtochipvalue(group.key)}</button>`
		}
	}
	let grade=gtodatagrade()
	html=html+`<span class="gtodatagrade gtodatagrade${grade=="solved"?"solved":"ref"}">${gtotext(grade=="solved"?"grade_solved":"grade_ref")}</span>`
	innerhtml("#gtoscenariobar",html,false)
	let chips=host.querySelectorAll("[data-gtochip]")
	for(let i=0;i<chips.length;i=i+1){
		chips[i].addEventListener("click",function(){
			let key=this.getAttribute("data-gtochip")
			gtoopengroup=(gtoopengroup==key)?"":key
			gtoapplychipgroup()
			gtorenderscenariobar()
		})
	}
	gtoapplychipgroup()
}

function gtoapplychipgroup(){
	let grid=domgetid("gtocontrolgrid")
	if(!grid){ return }
	let anyopen=false
	for(let i=0;i<GTOCHIPGROUP.length;i=i+1){
		let group=GTOCHIPGROUP[i]
		let show=(gtoopengroup==group.key)
		for(let j=0;j<group.rowlist.length;j=j+1){
			let row=domgetid(group.rowlist[j])
			if(row){ row.style.display=show?"":"none" }
		}
		if(show){ anyopen=true }
	}
	// Ante 那一排本來就有自己的顯示條件（只在 HE 且 push/fold 才適用），不能被這裡覆蓋
	gtoapplyanterowvisible()
	grid.className=anyopen?"gtocontrolgrid gtocontrolopen":"gtocontrolgrid gtocontrolcollapsed"
}

function gtoapplyanterowvisible(){
	let row=domgetid("gtoanterow")
	if(!row){ return }
	let applicable=(gtostate.gametype=="HE")&&(gtostate.spot=="PUSHFOLD"||gtostate.spot=="PFTREE")
	if(!applicable){ row.style.display="none" }
}

function gtoactivetreerender(){
	if(gtostate.spot=="DEEPTREE"){ gtodeeprender() }
	else{ gtotreerender() }
	gtorendergrid()
	gtorenderscenariobar()
	gtosavestate()
	// 走到「正好三人全下池」才需要 overcall 精算資料（72 KB，延後載入）。
	// 沒載到時 gtomultiwaycallspot() 會回 null，畫面**安靜地**退回啟發式收緊 ——
	// 看起來完全正常，只是範圍不對。所以這裡確保載入後重繪一次。
	if(gtostate.spot=="PFTREE"&&gtotreefacingjam()&&gtotreecallcount()==1&&!gtodataready["multiwaycall"]){
		gtoensuredata("multiwaycall",function(){
			if(gtostate.spot=="DEEPTREE"){ gtodeeprender() }
			else{ gtotreerender() }
			gtorendergrid()
		})
	}
}

function gtoapplymode(){
	let tree=gtostate.spot=="PFTREE"
	let deep=gtostate.spot=="DEEPTREE"
	let panel=domgetid("gtotreepanel")
	if(panel){
		panel.style.display=(tree||deep)?"block":"none"
	}
	let summary=domgetid("gtosummary")
	if(summary){
		summary.style.display=(tree||deep)?"none":"block"
	}
	// 每座位計分牌：push/fold 對戰樹與深碼對戰樹都支援
	let perseattoggle=domgetid("gtoperseattoggle")
	if(perseattoggle){ perseattoggle.style.display=(tree||deep)?"flex":"none" }
	let perseatrow=domgetid("gtoperseatrow")
	if(perseatrow&&!(tree||deep)){ perseatrow.style.display="none" }
	if(tree){
		gtotreerender()
	}
	if(deep){
		gtodeeprender()
	}
}

/* ============================================== */

function gtogamelabel(v){
	if(v=="HE"){ return gtotext("game_HE") }
	if(v=="SD"){ return gtotext("game_SD") }
	return v
}

function gtoinit(){
	// 控制列：下注結構（NL/PL/FL）＋遊戲類型（德州撲克 / 短牌）
	gtorenderoption("#gtostructure",GTOOPTIONS.structure,"structure",gtostructurelabel)
	gtorenderoption("#gtogametype",GTOOPTIONS.gametype,"gametype",gtogamelabel)
	gtoloadstate()   // 先還原上次的設定（localStorage）
	gtoapplyquery()  // 再讓網址 query 覆蓋、並驗證所有值合法
	gtosyncranks()   // 先依遊戲類型定好點數（可能被 query 帶成 SD）
	gtorenderoption("#gtospot",gtoavailablespots(),"spot",function(v){ return gtospotlabel(v) })
	gtosyncseats()
	gtorendertabletype()
	gtorenderpositions()
	gtorenderstacks()
	gtorenderante()
	gtobindoptions()
	gtobindtreecontrols()
	let perseatchk=domgetid("gtoperseat")
	if(perseatchk){ perseatchk.checked=gtoperseat }   // 還原每座位計分牌開關的勾選狀態
	gtoapplylanguage()
	gtorendermeta()
	gtosyncoptionactive()
	gtotreereset()
	gtodeepreset()
	gtoapplymode()
	gtostreetapplyforgame()
	gtorendersummary()
	gtorenderscenariobar()
	gtorendergrid()
	// 開頁時狀態就是短牌（從 localStorage 還原、或網址帶 ?gametype=SD）的情況。
	// 漏掉這一條的話首次繪製會是空矩陣，而且不會有任何錯誤訊息。
	if(gtostate.gametype=="SD"){
		gtoensuredata("shortdeck",function(){ gtoactivetreerender() })
	}
}

function gtobindtreecontrols(){
	let reset=domgetid("gtotreereset")
	if(reset){
		reset.addEventListener("click",function(){
			gtoselected=""
			if(gtostate.spot=="DEEPTREE"){
				gtodeepreset()
				gtodeeprender()
			}else{
				gtotreereset()
				gtotreerender()
			}
			gtorendergrid()
		})
	}
	let back=domgetid("gtotreeback")
	if(back){
		back.addEventListener("click",function(){
			if(gtostate.spot=="DEEPTREE"){
				gtodeepback()
			}else{
				gtotreeback()
			}
		})
	}
	let perseat=domgetid("gtoperseat")
	if(perseat){
		perseat.addEventListener("change",function(){
			gtoperseat=this.checked
			if(gtoperseat){
				// 開啟時：每座位預設帶入目前統一計分牌
				for(let i=0;i<gtoseats.length;i=i+1){ gtoseatstacks[gtoseats[i]]=gtostate.stackbb }
			}
			gtoactivetreerender()
		})
	}
}

