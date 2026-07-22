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
	if(gridel){ gridel.style.gridTemplateColumns="repeat("+n+",minmax(0,1fr))" }
	innerhtml("#gtogrid",html,false)
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
		return (typeof SDRFI!="undefined"&&SDRFI[actor])||null
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
	let d=gtostate.gametype=="SD"?(typeof SD3BET!="undefined"?SD3BET:null):gtodeepdata(typeof GTO3BET!="undefined"?GTO3BET:undefined,typeof GTO3BET_50!="undefined"?GTO3BET_50:undefined)
	return (d&&d[actor+"v"+gtodeep.opener])||null
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

// 當前行動者的範圍（給矩陣畫）。終局或無資料回 null（按鈕仍可走）。
function gtodeepactorspot(){
	if(gtodeep.terminal){ return null }
	let actor=gtodeepactor()
	if(!actor){ return null }
	if(gtodeep.level==0){
		if(actor=="BB"){ return null }   // BB 被 limp 到才行動；無 solver 範圍資料 → 空
		return gtodeepopenspot(actor)     // 只給開池範圍；limp 沒資料就 0%
	}
	if(gtodeep.level==1){ return gtodeep3betspot(actor) }
	// 面對 3bet：只有開池者有 vs3bet 資料；中間冷回應者（如 BB）沒資料 → null（有按鈕、空範圍）
	if(gtodeep.level==2){ return actor==gtodeep.opener?gtodeepvs3betspot():null }
	// 面對 4bet：只有 3bet 者有 vs4bet 資料
	if(gtodeep.level==3){ return actor==gtodeep.threebettor?gtodeepvs4betspot():null }
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
function gtoactivetreerender(){
	if(gtostate.spot=="DEEPTREE"){ gtodeeprender() }
	else{ gtotreerender() }
	gtorendergrid()
	gtosavestate()
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
	gtorendergrid()
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

gtoinit()
/*
	翻後 GTO 求解器（前端）。呼叫後端 solveflop（CFR），畫出各節點 13x13 策略矩陣。
	文案內嵌雙語（讀 language），頁面 chrome 走 translate/initialize。
*/

let FSSUITS=[["s","♠","#e5e7eb"],["h","♥","#f87171"],["d","♦","#60a5fa"],["c","♣","#34d399"]]
let FSACTIONBASE={ check:"#38bdf8", fold:"#18181b", call:"#10b981", raise:"#a855f7" }
let FSBETCOLOR={ "33":"#fb923c", "50":"#fb7185", "66":"#f43f5e", "75":"#f43f5e", "100":"#e11d48", "125":"#be123c", "150":"#9f1239", "200":"#881337" }
function fsactioncolor(a){
	if(FSACTIONBASE[a]){ return FSACTIONBASE[a] }
	if(a.indexOf("bet")==0){ return FSBETCOLOR[a.slice(3)]||"#f43f5e" }
	return "#888"
}

let FSTXT={
	zhtw:{
		title:"翻後 GTO 求解器", subtitle:"自製 CFR 即時求解翻牌局面（eval7，免費）",
		boardlabel:"翻牌", potlabel:"底池", stacklabel:"有效後手計分牌",
		ooplabel:"OOP 範圍（先行動）", iplabel:"IP 範圍（後行動）", betlabel:"下注尺寸",
		random:"隨機翻牌", solve:"求解", solving:"求解中…", allowraise:"允許加注",
		hint:"輸入翻牌、雙方範圍與下注尺寸後按「求解」。後端用 CFR 迭代到均衡（約 2 秒）。",
		suitednote:"右上同花、左下不同花、對角對子。格子顏色＝該手在此節點的動作頻率；灰色＝不在範圍。",
		disclaimer:"本工具為自製 CFR 求解器（flop 子局面、turn/river 以精確 showdown equity 結算），非完整多街 solver；屬真算策略參考，實戰需自行判斷。",
		evoop:"OOP EV", evip:"EV IP",
		actions:{ check:"過牌", bet:"下注", fold:"棄牌", call:"跟注", raise:"加注" },
		nodedesc:{ oop_root:"OOP 先行動：過牌 或 下注", ip_vs_bet:"IP 面對 OOP 下注：棄牌 或 跟注", ip_vs_check:"IP 面對 OOP 過牌：過牌 或 下注", oop_vs_bet:"OOP 過後面對 IP 下注：棄牌 或 跟注" },
		nodetab:{ oop_root:"OOP 開蓋", ip_vs_bet:"IP vs 下注", ip_vs_check:"IP vs 過牌", oop_vs_bet:"OOP vs 下注" },
		detailhint:"點上方矩陣任一格，看該手牌各動作的 EV 與偏離 EV。",
		detailnotinrange:"不在此節點範圍。",
		detailnote:"GTO 會混合到各動作 EV 相等（無差異）。「偏離」＝固定只打該動作會比 GTO 少賺多少。",
		theoev:"理論 EV（GTO 混合）",
		colaction:"動作", colfreq:"頻率", colloss:"偏離 EV",
		errboard:"請選 3 張不重複的翻牌", errrange:"請填寫雙方範圍", errfail:"求解失敗，請確認後端與輸入",
		fslibtitle:"本地批次結果（gtoworker.py 算好的）",
		fslibopenerlabel:"開池方位置", fslibscenariolabel:"對位",
		fslibhint:"選位置對位、點翻牌選牌，選好會自動載入已經算好的策略，不用重新求解。",
		fslibempty:"目前沒有離線批次結果，請先在本地執行 gtoworker.py。",
		fslibfail:"讀取失敗",
		fslibnotready:"這組位置對位還沒算到這張翻牌，稍後 gtoworker.py 跑完再回來看。",
		thirdlabel:"背景玩家範圍（多人池，選填，最多 7 家）",
		thirdplaceholder:"留空＝雙人求解；每填一格＝多一個背景玩家（固定範圍、一般下注會跟、一被加注就當作蓋牌，非嚴謹多人均衡）",
		advancedtitle:"自己輸入範圍即時求解（多人池、overbet、再加注全下）",
		bgadd:"＋ 加一家", bgcount:"共 {n} 家（OOP＋IP＋{k} 個背景玩家）",
		multiwaynote:"簡化多人模型：背景玩家固定範圍、一般下注會跟、但一被加注就視為蓋牌；非嚴謹多人 Nash 均衡，僅供參考。",
		street_flop:"翻牌", street_turn:"轉牌", street_river:"河牌",
		deal_turn:"抽轉牌", deal_river:"抽河牌",
		term_fold:"這步棄牌，對手直接贏得底池，行動結束。", term_call:"這步跟注，雙方直接攤牌比大小，行動結束。",
		term_check:"雙方都過牌，直接攤牌比大小，行動結束。", term_end:"行動結束。",
		wizard_start:"從翻牌後 OOP 先行動開始", wizard_back:"上一步", wizard_reset:"重設",
		nl_check:"過牌", nl_raise:"加注", nl_allin:"全下", nl_bet:"下注", betprefix:"下注 ",
		kind_srp:"單加注池", kind_3bet:"3bet 池",
		close:"關閉", cancel:"取消", confirm:"確定"
	},
	en:{
		title:"Postflop GTO Solver", subtitle:"In-house CFR, solves flop spots in real time (eval7, free)",
		boardlabel:"Flop", potlabel:"Pot", stacklabel:"Eff. stack behind",
		ooplabel:"OOP range (acts first)", iplabel:"IP range (acts last)", betlabel:"Bet size",
		random:"Random flop", solve:"Solve", solving:"Solving…", allowraise:"Allow raise",
		hint:"Enter the flop, both ranges and a bet size, then Solve. The backend runs CFR to equilibrium (~2s).",
		suitednote:"Upper-right suited, lower-left offsuit, diagonal pairs. Cell color = action frequency at this node; grey = not in range.",
		disclaimer:"In-house CFR solver (flop subgame; turn/river settled by exact showdown equity), not a full multi-street solver; a computed reference, use judgment in practice.",
		evoop:"OOP EV", evip:"EV IP",
		actions:{ check:"Check", bet:"Bet", fold:"Fold", call:"Call", raise:"Raise" },
		nodedesc:{ oop_root:"OOP first to act: check or bet", ip_vs_bet:"IP facing OOP bet: fold or call", ip_vs_check:"IP facing OOP check: check or bet", oop_vs_bet:"OOP facing IP bet after check: fold or call" },
		nodetab:{ oop_root:"OOP open", ip_vs_bet:"IP vs bet", ip_vs_check:"IP vs check", oop_vs_bet:"OOP vs bet" },
		detailhint:"Click any cell above to see each action's EV and EV-loss for that hand.",
		detailnotinrange:"Not in this node's range.",
		detailnote:"GTO mixes until each action's EV is equal (indifference). \"EV-loss\" = how much always taking that one action loses vs GTO.",
		theoev:"Theoretical EV (GTO mix)",
		colaction:"Action", colfreq:"Freq", colloss:"EV-loss",
		errboard:"Pick 3 distinct flop cards", errrange:"Fill in both ranges", errfail:"Solve failed — check backend and inputs",
		fslibtitle:"Local batch results (from gtoworker.py)",
		fslibopenerlabel:"Opener position", fslibscenariolabel:"Matchup",
		fslibhint:"Pick a matchup and click the flop to pick cards — it loads the already-solved strategy automatically, no re-solving.",
		fslibempty:"No offline batch results yet — run gtoworker.py locally first.",
		fslibfail:"Failed to load",
		fslibnotready:"This matchup hasn't reached this flop yet — check back once gtoworker.py has run further.",
		thirdlabel:"Background player ranges (multiway, optional, up to 7)",
		thirdplaceholder:"Leave empty for a heads-up solve. Each box adds one background player (fixed range that calls a normal bet but is assumed to fold to any raise — not a rigorous multiway equilibrium).",
		advancedtitle:"Solve your own ranges live (multiway, overbets, re-raise all-in)",
		bgadd:"＋ Add player", bgcount:"{n} players total (OOP + IP + {k} background)",
		multiwaynote:"Simplified multiway model: background players have fixed ranges that call normal bets but are assumed to fold to any raise — not a rigorous multiway Nash equilibrium, reference only.",
		street_flop:"flop", street_turn:"turn", street_river:"river",
		deal_turn:"Deal turn", deal_river:"Deal river",
		term_fold:"Folded here — opponent takes the pot immediately.", term_call:"Called here — hands go to showdown.",
		term_check:"Both checked through — straight to showdown.", term_end:"End of the action.",
		wizard_start:"Start: OOP acts first on the flop", wizard_back:"Back", wizard_reset:"Reset",
		nl_check:"check", nl_raise:"raise", nl_allin:"all-in", nl_bet:"bet", betprefix:"Bet ",
		kind_srp:"SRP", kind_3bet:"3bet pot",
		close:"Close", cancel:"Cancel", confirm:"Confirm"
	}
}
let FSNODEORDER=["oop_root","ip_vs_bet","ip_vs_check","oop_vs_bet"]
let FSBETS=[0.33,0.5,0.66,0.75,1.0,1.25,1.5,2.0]   // 含 overbet；後端 build_tree 接受任意比例

let fsstate={ betsizes:[0.66], allowraise:true, data:null, node:"oop_root", selected:"", terminal:false, terminalaction:"", board:["As","Kh","7c"] }
let fspath=[]

function fstext(key){
	// 先查 TRANSLATE（gtopage.fs_*），查無才 fallback 到內嵌的 FSTXT
	let text=gtotext("fs_"+key)
	if(text!="fs_"+key){
		return text
	}
	let t=FSTXT[LANGUAGE]||FSTXT.zhtw
	return t[key]!=undefined?t[key]:key
}
function fsactionlabel(a){
	if(a.indexOf("bet")==0){
		return fstext("betprefix")+a.slice(3)+"%"
	}
	// 先查 TRANSLATE（gtopage.fs_action_*），查無才 fallback 到內嵌的 FSTXT.actions
	let text=gtotext("fs_action_"+a)
	if(text!="fs_action_"+a){
		return text
	}
	let t=FSTXT[LANGUAGE]||FSTXT.zhtw
	return (t.actions&&t.actions[a])||a
}

// 節點分頁標籤：oop_root / ip_vs_check / ip_vs_bet33 / oop_vs_raise100 ...
function fsnodelabel(name){
	let t=FSTXT[LANGUAGE]||FSTXT.zhtw
	if(name=="oop_root"){
		// 先查 TRANSLATE（gtopage.fs_nodetab_oop_root），查無才 fallback 到內嵌的 FSTXT.nodetab
		let text=gtotext("fs_nodetab_oop_root")
		if(text!="fs_nodetab_oop_root"){
			return text
		}
		return t.nodetab.oop_root
	}
	let m=name.match(/^(oop|ip)_vs_(check|bet|raise|allin)(\d+)?$/)
	if(!m){ return name }
	let who=m[1].toUpperCase()
	let kind=m[2]; let pct=m[3]
	let vs=" vs "
	if(kind=="check"){ return who+vs+fstext("nl_check") }
	if(kind=="raise"){ return who+vs+fstext("nl_raise") }
	if(kind=="allin"){ return who+vs+fstext("nl_allin") }
	return who+vs+fstext("nl_bet")+(pct?" "+pct+"%":"")
}

// 選牌介面沿用 equity 解算器的卡牌選擇器樣式（tool.css 的 cardslot/toolmodal/cardpicker），
// 不用原本一格一個下拉選單那種笨重的做法。
function fscardglyph(cardtext){
	if(!cardtext){ return `<span class="cardslot">?</span>` }
	let rank=cardtext.slice(0,cardtext.length-1).toUpperCase()
	let suit=cardtext.slice(-1).toLowerCase()
	// rank/花色白名單：這裡的字串會直接進 innerHTML，非標準牌代號一律畫成空槽，避免注入
	if(GTORANKS_HE.indexOf(rank)<0||"shdc".indexOf(suit)<0){ return `<span class="cardslot">?</span>` }
	let symbol="?"
	for(let i=0;i<FSSUITS.length;i=i+1){
		if(FSSUITS[i][0]==suit){ symbol=FSSUITS[i][1] }
	}
	let colorclass=(suit=="h"||suit=="d")?"cardred":"cardblack"
	return `<span class="cardslot filled ${colorclass}">${rank}${symbol}</span>`
}

function fsshowcardpicker(titletext,currentcardlist,maxcount,confirmcallback,disabledcardlist){
	let selectedcardlist=currentcardlist.filter(function(c){ return !!c })
	disabledcardlist=disabledcardlist||[]
	let modal=document.createElement("div")
	modal.className="toolmodal"
	modal.innerHTML=`
		<div class="toolmodal-body">
			<div class="toolmodal-head">
				<div class="toolmodal-title">${titletext}</div>
				<input type="button" class="toolmodal-close" value="${fstext("close")}">
			</div>
			<div class="toolmodal-selected" id="fspickerselected"></div>
			<div class="cardpicker" id="fspickergrid"></div>
			<div class="toolmodal-actions">
				<input type="button" class="toolmodal-cancel" value="${fstext("cancel")}">
				<input type="button" class="toolmodal-confirm" value="${fstext("confirm")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(modal)

	function closemodal(){
		if(modal.parentElement){ ptremovescrollcover(modal) }
	}

	function renderpicker(){
		let selectedhtml=""
		for(let i=0;i<maxcount;i=i+1){
			selectedhtml=selectedhtml+`<span>${selectedcardlist[i]||"?"}</span>`
		}
		modal.querySelector("#fspickerselected").innerHTML=selectedhtml
		let grid=modal.querySelector("#fspickergrid")
		grid.innerHTML=""
		for(let s=0;s<FSSUITS.length;s=s+1){
			let row=document.createElement("div")
			row.className="cardpicker-row"
			for(let r=0;r<gtoranks.length;r=r+1){
				let cardtext=gtoranks[r]+FSSUITS[s][0]
				let selecteded=selectedcardlist.indexOf(cardtext)>=0
				let disableded=disabledcardlist.indexOf(cardtext)>=0&&!selecteded
				let button=document.createElement("div")
				button.setAttribute("role","button")
				button.setAttribute("tabindex","0")
				button.addEventListener("keydown",function(event){
					if(event.key=="Enter"||event.key==" "){ event.preventDefault(); this.click() }
				})
				button.className="cardbtn"+(selecteded?" selected":"")+(disableded?" disabled":"")
				let colorclass=(FSSUITS[s][0]=="h"||FSSUITS[s][0]=="d")?"cardred":"cardblack"
				button.innerHTML=`<span class="r">${gtoranks[r]}</span><span class="s ${colorclass}">${FSSUITS[s][1]}</span>`
				button.addEventListener("click",function(){
					if(disableded){ return }
					let idx=selectedcardlist.indexOf(cardtext)
					if(idx>=0){
						selectedcardlist.splice(idx,1)
					}else{
						if(selectedcardlist.length>=maxcount){ selectedcardlist.splice(0,1) }
						selectedcardlist.push(cardtext)
					}
					renderpicker()
				})
				row.appendChild(button)
			}
			grid.appendChild(row)
		}
	}

	renderpicker()
	modal.querySelector(".toolmodal-close").addEventListener("click",closemodal)
	modal.querySelector(".toolmodal-cancel").addEventListener("click",closemodal)
	modal.querySelector(".toolmodal-confirm").addEventListener("click",function(){
		confirmcallback(selectedcardlist.slice())
		closemodal()
	})
}

function fsopenboardpicker(){
	fsshowcardpicker(fstext("boardlabel"),fsstate.board,3,function(selected){
		if(selected.length==3){ fsstate.board=selected; fsrenderboard(); fssaveinputs() }
	})
}

function fsrenderboard(){
	let html=""
	for(let i=0;i<3;i=i+1){ html=html+fscardglyph(fsstate.board[i]) }
	innerhtml("#fsboard",`<div class="handrowcard boardstreetflop">${html}</div>`,false)
	let el=domgetid("fsboard")
	if(el){ el.style.cursor="pointer"; el.onclick=function(){ fsopenboardpicker() } }
}

function fsrenderbetsizes(){
	let html=""
	for(let i=0;i<FSBETS.length;i=i+1){
		let active=fsstate.betsizes.indexOf(FSBETS[i])>=0?" gtooptactive":""
		html=html+`<input type="button" class="gtoopt${active}" data-fsbet="${FSBETS[i]}" value="${Math.round(FSBETS[i]*100)}%">`
	}
	let ractive=fsstate.allowraise?" gtooptactive":""
	html=html+`<input type="button" class="gtoopt${ractive}" id="fsraisetoggle" value="${fstext("allowraise")}">`
	innerhtml("#fsbetsizes",html,false)
	let btns=document.querySelectorAll("[data-fsbet]")
	for(let i=0;i<btns.length;i=i+1){
		btns[i].addEventListener("click",function(){
			let v=Number(this.getAttribute("data-fsbet"))
			let idx=fsstate.betsizes.indexOf(v)
			if(idx>=0){
				if(fsstate.betsizes.length>1){ fsstate.betsizes.splice(idx,1) }   // 至少留一檔
			}else if(fsstate.betsizes.length<4){
				fsstate.betsizes.push(v)                                          // 最多四檔（含 overbet）
			}
			fsrenderbetsizes()
			fssaveinputs()
		})
	}
	let rt=domgetid("fsraisetoggle")
	if(rt){
		rt.addEventListener("click",function(){ fsstate.allowraise=!fsstate.allowraise; fsrenderbetsizes(); fssaveinputs() })
	}
}

function fsgetboard(){
	let board=fsstate.board.filter(function(c){ return !!c })
	if(board.length!=3||(new Set(board)).size!=3){ return null }
	return board
}

function fsrandomflop(){
	let deck=[]
	for(let r=0;r<gtoranks.length;r=r+1){
		for(let s=0;s<FSSUITS.length;s=s+1){
			deck.push(gtoranks[r]+FSSUITS[s][0])
		}
	}
	for(let i=deck.length-1;i>0;i=i-1){
		let j=Math.floor(Math.random()*(i+1))
		let tmp=deck[i]; deck[i]=deck[j]; deck[j]=tmp
	}
	fsstate.board=[deck[0],deck[1],deck[2]]
	fsrenderboard()
	fssaveinputs()
}

function fshandlabel(r,c){
	if(r==c){ return gtoranks[r]+gtoranks[r] }
	if(r<c){ return gtoranks[r]+gtoranks[c]+"s" }
	return gtoranks[c]+gtoranks[r]+"o"
}

function fsrendermatrix(){
	let data=fsstate.data
	if(!data){ return }
	let node=data.nodes[fsstate.node]
	let actions=node.actions
	let html=""
	let n=gtoranks.length
	for(let r=0;r<n;r=r+1){
		for(let c=0;c<n;c=c+1){
			let label=fshandlabel(r,c)
			let freqs=node.cells[label]
			let segs=""
			if(freqs){
				for(let a=0;a<actions.length;a=a+1){
					let f=freqs[a]||0
					if(f>0){
						segs=segs+`<span class="fsseg" style="width:${f}%;background:${fsactioncolor(actions[a])}"></span>`
					}
				}
			}
			let sel=label==fsstate.selected?" fscell-sel":""
			let cls=(freqs?"fscell":"fscell fscell-empty")+sel
			html=html+`<div class="${cls}" data-fshand="${label}"><div class="fssegs">${segs}</div><span class="fslabel">${label}</span></div>`
		}
	}
	let fsgridel=domgetid("fsgrid")
	if(fsgridel){ fsgridel.style.gridTemplateColumns="repeat("+n+",minmax(0,1fr))" }
	innerhtml("#fsgrid",html,false)
	fsrenderlegend(actions)
	let cells=document.querySelectorAll("[data-fshand]")
	for(let i=0;i<cells.length;i=i+1){
		cells[i].addEventListener("click",function(){
			let label=this.getAttribute("data-fshand")
			fsstate.selected=(fsstate.selected==label)?"":label
			fsrendermatrix()
			fsrenderdetail()
		})
	}
}

function fsrenderdetail(){
	let box=domgetid("fsdetail")
	if(!box){ return }
	let data=fsstate.data
	if(!fsstate.selected||!data){
		box.innerHTML=`<div class="fsdetailhint">${fstext("detailhint")}</div>`
		return
	}
	let node=data.nodes[fsstate.node]
	let label=fsstate.selected
	let freqs=node.cells[label]
	let evs=node.ev?node.ev[label]:null
	if(!freqs||!evs){
		box.innerHTML=`<div class="fsdetailhint">${label}：${fstext("detailnotinrange")}</div>`
		return
	}
	let actions=node.actions
	let best=Math.max.apply(null,evs)
	let mixev=0
	for(let a=0;a<actions.length;a=a+1){ mixev=mixev+(freqs[a]/100)*evs[a] }
	let rows=""
	for(let a=0;a<actions.length;a=a+1){
		let loss=best-evs[a]
		let losstxt=loss<0.005?`<span class="fsok">≈GTO</span>`:`-${loss.toFixed(2)}`
		rows=rows+`<tr>
			<td><span class="fsdot" style="background:${fsactioncolor(actions[a])}"></span>${fsactionlabel(actions[a])}</td>
			<td class="fsnum">${freqs[a]}%</td>
			<td class="fsnum">${evs[a].toFixed(2)}</td>
			<td class="fsnum">${losstxt}</td>
		</tr>`
	}
	box.innerHTML=`
		<div class="fsdetailhead"><span class="fsdetailhand">${label}</span><span class="fsdetailmix">${fstext("theoev")} ${mixev.toFixed(2)}</span></div>
		<table class="fsdetailtable">
			<thead><tr><th>${fstext("colaction")}</th><th class="fsnum">${fstext("colfreq")}</th><th class="fsnum">EV</th><th class="fsnum">${fstext("colloss")}</th></tr></thead>
			<tbody>${rows}</tbody>
		</table>
		<div class="fsdetailnote">${fstext("detailnote")}</div>
	`
}

function fsrenderlegend(actions){
	let html=""
	for(let a=0;a<actions.length;a=a+1){
		html=html+`<div class="gtolegenditem"><span class="gtolegendswatch" style="background:${fsactioncolor(actions[a])}"></span><span class="gtolegendlabel">${fsactionlabel(actions[a])}</span></div>`
	}
	innerhtml("#fslegend",html,false)
}

// ============== Wizard：像 GTO Wizard 一樣一步步選動作，往下走這棵樹 ==============
// 樹的形狀固定（見 gtosolvecore.build_tree / backend/api/gto.py build_tree），
// 所以「選了這個動作，下一個節點叫什麼名字」可以直接用命名規則算出來，不用後端額外給。
function fsnextnodename(name,action){
	if(action=="check"){
		if(name=="oop_root"){ return "ip_vs_check" }
		return null   // ip_vs_check 選 check → 雙方過牌，直接攤牌
	}
	if(action.indexOf("bet")==0){
		let pct=action.slice(3)
		if(name=="oop_root"){ return "ip_vs_bet"+pct }
		if(name=="ip_vs_check"){ return "oop_vs_bet"+pct }
	}
	if(action=="raise"){
		let m=name.match(/^(oop|ip)_vs_bet(\d+)$/)
		if(m){
			let who=m[1]=="oop"?"ip":"oop"
			return who+"_vs_raise"+m[2]
		}
		let m2=name.match(/^(oop|ip)_vs_raise(\d+)$/)
		if(m2){
			let who=m2[1]=="oop"?"ip":"oop"
			return who+"_vs_allin"+m2[2]   // 再加注全下
		}
	}
	return null   // fold / call，或全下節點再選任何動作 → 都是終局
}

let fsstreetstack=[]   // 跨街「上一步」用：每往下一街（轉牌/河牌）就把目前這條街的狀態存一份

function fswizardreset(){
	fspath=[]
	fsstate.node="oop_root"
	fsstate.terminal=false
	fsstate.terminalaction=""
	fsstate.selected=""
}

function fswizardfullreset(){
	fsstreetstack=[]
	fswizardreset()
}

function fswizardnext(action){
	let data=fsstate.data
	let to=fsnextnodename(fsstate.node,action)
	if(to&&data.nodes[to]){
		fspath.push({ from:fsstate.node, action:action, to:to })
		fsstate.node=to
		fsstate.terminal=false
	}else{
		fspath.push({ from:fsstate.node, action:action, to:null })
		fsstate.terminal=true
		fsstate.terminalaction=action
	}
	fsstate.selected=""
	fsrenderwizard()
	fsrendermatrixwrap()
	fsrenderdetail()
}

function fswizardback(){
	if(!fspath.length){
		// 這條街已經在起點了：如果上一街還在堆疊裡，退回上一街「抽牌前」的那個終局畫面
		if(!fsstreetstack.length){ return }
		let prev=fsstreetstack.pop()
		fsstate.data=prev.data
		fspath=prev.path
		fsstate.node=prev.node
		fsstate.terminal=prev.terminal
		fsstate.terminalaction=prev.terminalaction
		fsstate.selected=""
		fsrenderwizard()
		fsrendermatrixwrap()
		fsrenderdetail()
		return
	}
	fspath.pop()
	fsstate.node=fspath.length?fspath[fspath.length-1].to:"oop_root"
	fsstate.terminal=false
	fsstate.terminalaction=""
	fsstate.selected=""
	fsrenderwizard()
	fsrendermatrixwrap()
	fsrenderdetail()
}

function fsstreetname(board){
	let n=(board||[]).length
	if(n==3){ return fstext("street_flop") }
	if(n==4){ return fstext("street_turn") }
	if(n==5){ return fstext("street_river") }
	return ""
}

function fsadvancestreetlabel(){
	let n=(fsstate.data.board||[]).length
	if(n==3){ return fstext("deal_turn") }
	if(n==4){ return fstext("deal_river") }
	return ""
}

function fsadvancestreet(){
	let n=(fsstate.data.board||[]).length
	if(n>=5){ return }
	fsshowcardpicker(fsadvancestreetlabel(),[],1,function(selected){
		if(selected.length==1){ fsrequestnextstreet(selected[0]) }
	},fsstate.data.board)
}

function fsrequestnextstreet(newcard){
	// range 優先用「載入的結果自己帶的」（批次結果或前一街往下帶的），沒有才退回進階輸入框
	let oop=fsstate.data.ooprange||(domgetid("fsooprange")?domgetid("fsooprange").value:"")||""
	let ip=fsstate.data.iprange||(domgetid("fsiprange")?domgetid("fsiprange").value:"")||""
	let body={
		board:fsstate.data.board,
		ooprange:String(oop).trim(),
		iprange:String(ip).trim(),
		shortdeck:gtostate.gametype=="SD",
		pot:fsstate.data.pot,
		stack:fsstate.data.stack,
		betsizes:fsstate.data.betsizes,
		"raise":fsstate.data.raise,
		iters:fsstate.data.iters,
		path:fspath.map(function(e){ return e.action }),
		newcard:newcard,
	}
	let button=domgetid("fswizardback")
	ajax("POST",AJAXURL+"solvenextstreet",function(event,data){
		if(data&&data["success"]&&data["data"]){
			fsstreetstack.push({
				data:fsstate.data, path:fspath, node:fsstate.node,
				terminal:fsstate.terminal, terminalaction:fsstate.terminalaction,
			})
			fsstate.data=data["data"]
			fspath=[]
			fsstate.node="oop_root"
			fsstate.terminal=false
			fsstate.terminalaction=""
			fsstate.selected=""
			fsrenderwizard()
			fsrendermatrixwrap()
			fsrenderdetail()
		}else{
			pttoast(fstext("errfail"),"error")
		}
	},JSON.stringify(body),[
		["Content-Type","application/json"]
	],{timeout:60000})
}

function fsterminaltext(){
	let a=fsstate.terminalaction
	if(a=="fold"){ return fstext("term_fold") }
	if(a=="call"){ return fstext("term_call") }
	if(a=="check"){ return fstext("term_check") }
	return fstext("term_end")
}

// 一手牌 label（如 "AKs"/"72o"/"77"）對應的實際 combo 數：對子 6、同花 4、不同花 12
function fslabelcombos(label){
	if(label.length==2){ return 6 }
	return label.charAt(2)=="s"?4:12
}

// 把某個節點的 169 格頻率，彙總成「每個動作」的整體佔比與 combo 數（GTO Wizard 那種大色塊要用）
function fsactionstats(node){
	let totals={}
	for(let a=0;a<node.actions.length;a=a+1){ totals[node.actions[a]]=0 }
	let totalcombos=0
	let labels=Object.keys(node.cells)
	for(let i=0;i<labels.length;i=i+1){
		let label=labels[i]
		let combos=fslabelcombos(label)
		let freqs=node.cells[label]
		totalcombos=totalcombos+combos
		for(let a=0;a<node.actions.length;a=a+1){
			totals[node.actions[a]]=totals[node.actions[a]]+combos*(freqs[a]||0)/100
		}
	}
	return { totals:totals, totalcombos:totalcombos }
}

function fsrenderwizard(){
	let box=domgetid("fswizard")
	if(!box){ return }
	let data=fsstate.data
	let crumbs=""
	for(let i=0;i<fspath.length;i=i+1){
		crumbs=crumbs+`<span class="gtolinetag">${fsactionlabel(fspath[i].action)}</span>`
	}
	if(!crumbs){
		crumbs=`<span class="gtolinetag gtolinetag-empty">${fstext("wizard_start")}</span>`
	}
	let ctl=`<input type="button" class="gtotreectl" id="fswizardback" value="${fstext("wizard_back")}">`
		+`<input type="button" class="gtotreectl" id="fswizardreset" value="${fstext("wizard_reset")}">`
	let boardline=`<div class="mt-1 text-xs text-zinc-500">${fsstreetname(data.board)}：${data.board.map(fscardglyph).join("")}</div>`
	let body=""
	if(fsstate.terminal){
		let advance=""
		if(fsstate.terminalaction!="fold"&&(data.board||[]).length<5){
			advance=`<input type="button" class="gtotreectl mt-2" id="fsadvancestreet" value="${fsadvancestreetlabel()}">`
		}
		body=`<div class="mt-3 text-sm font-bold text-emerald-300">${fsterminaltext()}</div>${advance}`
	}else{
		let node=data.nodes[fsstate.node]
		body=`<div class="mt-3 text-sm font-bold text-emerald-300">${fsnodelabel(fsstate.node)} — ${node.actions.map(fsactionlabel).join(" / ")}</div>
			<div class="mt-2 flex flex-wrap gap-2" id="fswizardactions"></div>`
	}
	box.innerHTML=`
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div class="flex flex-wrap gap-1.5">${crumbs}</div>
			<div class="flex gap-2">${ctl}</div>
		</div>
		${boardline}
		${body}
	`
	let back=domgetid("fswizardback")
	if(back){ back.addEventListener("click",function(){ fswizardback() }) }
	let reset=domgetid("fswizardreset")
	if(reset){ reset.addEventListener("click",function(){ fswizardreset(); fsrenderwizard(); fsrendermatrixwrap(); fsrenderdetail() }) }
	let advancebtn=domgetid("fsadvancestreet")
	if(advancebtn){ advancebtn.addEventListener("click",function(){ fsadvancestreet() }) }
	if(!fsstate.terminal){
		let node=data.nodes[fsstate.node]
		let stats=fsactionstats(node)
		let html=""
		for(let i=0;i<node.actions.length;i=i+1){
			let a=node.actions[i]
			let combos=stats.totals[a]||0
			let pct=stats.totalcombos>0?Math.round(combos/stats.totalcombos*1000)/10:0
			html=html+`
				<div class="min-w-[120px] flex-1 cursor-pointer rounded-2xl p-3 transition hover:brightness-110" style="background:${fsactioncolor(a)}" data-fswizardact="${a}">
					<div class="text-sm font-bold text-white">${fsactionlabel(a)}</div>
					<div class="mt-1 text-2xl font-extrabold text-white">${pct}%</div>
					<div class="text-xs text-white/80">${Math.round(combos*10)/10} combos</div>
				</div>
			`
		}
		innerhtml("#fswizardactions",html,false)
		let btns=document.querySelectorAll("[data-fswizardact]")
		for(let i=0;i<btns.length;i=i+1){
			btns[i].addEventListener("click",function(){ fswizardnext(this.getAttribute("data-fswizardact")) })
		}
	}
}

// 終局時矩陣區沒有意義（沒有下一個節點的策略可看），整區隱藏，只留 wizard 的終局訊息
function fsrendermatrixwrap(){
	let wrap=domgetid("fsmatrixwrap")
	if(!wrap){ return }
	wrap.style.display=fsstate.terminal?"none":"block"
	if(!fsstate.terminal){ fsrendermatrix() }
}

function fsrenderresult(){
	let data=fsstate.data
	let total=data.evoop+data.evip
	let oopw=total>0?Math.round(data.evoop/total*100):50
	domgetid("fsevbar").style.width=oopw+"%"
	innertext("#fsevoop",data.evoop.toFixed(2),false)
	innertext("#fsevip",data.evip.toFixed(2),false)
	let multiwarn=domgetid("fsmultiwarn")
	if(multiwarn){
		if(data.multiway){
			multiwarn.classList.remove("hidden")
			innertext("#fsmultiwarn",data.note||fstext("multiwaynote"),false)
		}else{
			multiwarn.classList.add("hidden")
		}
	}
	fswizardfullreset()
	fsrenderwizard()
	fsrendermatrixwrap()
	fsrenderdetail()
	domgetid("fsresult").style.display="block"
}

let FSBGMAX=7   // 背景玩家上限（OOP+IP+7 ＝ 最多 9 人）
// 目前所有背景玩家範圍欄位（第一格 #fsthirdrange ＋ #fsbgextra 內動態新增的）
function fsbgranges(){
	let out=[]
	let els=document.querySelectorAll(".fsbgrange")
	for(let i=0;i<els.length;i=i+1){
		let v=(els[i].value||"").trim()
		if(v){ out.push(v) }
	}
	return out.slice(0,FSBGMAX)
}
function fsbgcount(){ return document.querySelectorAll(".fsbgrange").length }
// 新增一個背景玩家範圍欄位（含移除鈕）
function fsbgaddrow(){
	if(fsbgcount()>=FSBGMAX){ return }
	let wrap=domgetid("fsbgextra")
	if(!wrap){ return }
	let row=document.createElement("div")
	row.className="fsbgrow flex items-start gap-2"
	let ta=document.createElement("textarea")
	ta.rows=2
	ta.className="fsbgrange w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono"
	ta.placeholder=fstext("thirdplaceholder")
	let del=document.createElement("input")
	del.type="button"
	del.value="✕"
	del.className="mt-1 rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-700"
	del.addEventListener("click",function(){ row.parentNode.removeChild(row); fsbgupdatecount(); fssaveinputs() })
	row.appendChild(ta)
	row.appendChild(del)
	wrap.appendChild(row)
	fsbgupdatecount()
}
// 更新「共 N 家」提示與 ＋ 鈕的可用狀態
function fsbgupdatecount(){
	let filled=fsbgranges().length   // 只算「有填內容」的背景玩家，空欄位不灌水
	let el=domgetid("fsbgcount")
	if(el){ el.textContent=fstext("bgcount").replace("{k}",filled).replace("{n}",filled+2) }
	let rows=fsbgcount()             // 欄位總數（含空的）用來擋上限
	let add=domgetid("fsbgadd")
	if(add){ add.disabled=rows>=FSBGMAX; add.style.opacity=rows>=FSBGMAX?"0.4":"" }
}

// ── 翻後輸入記憶（localStorage）：翻牌、雙方範圍、底池/計分牌、下注尺寸、背景玩家，重整後還原 ──
const FSINPUTKEY=(typeof WEBLSNAME!="undefined"?WEBLSNAME:"")+"fsinputs"
function fssaveinputs(){
	try{
		let bg=[]
		let els=document.querySelectorAll(".fsbgrange")
		for(let i=0;i<els.length;i=i+1){ bg.push(els[i].value||"") }
		localStorage.setItem(FSINPUTKEY,JSON.stringify({
			gametype:gtostate.gametype,
			board:fsstate.board,
			oop:(domgetid("fsooprange")||{}).value||"",
			ip:(domgetid("fsiprange")||{}).value||"",
			pot:(domgetid("fspot")||{}).value||"",
			stack:(domgetid("fsstack")||{}).value||"",
			betsizes:fsstate.betsizes,
			allowraise:fsstate.allowraise,
			bg:bg
		}))
	}catch(e){}
}
// 還原上次翻後輸入。回傳 { ranges:bool }：ranges=true 表示已還原範圍（fsinit 就不用再套預設）。
// 範圍/牌面/背景玩家跟遊戲類型綁定（短牌 vs 標準牌），只有同類型才還原；底池/計分牌/下注尺寸則一律還原。
function fsloadinputs(){
	try{
		let raw=localStorage.getItem(FSINPUTKEY)
		if(!raw){ return null }
		let s=JSON.parse(raw)
		if(!s){ return null }
		if(Array.isArray(s.betsizes)&&s.betsizes.length){ fsstate.betsizes=s.betsizes.slice(0,4) }
		if(typeof s.allowraise=="boolean"){ fsstate.allowraise=s.allowraise }
		if(domgetid("fspot")&&s.pot){ domgetid("fspot").value=s.pot }
		if(domgetid("fsstack")&&s.stack){ domgetid("fsstack").value=s.stack }
		let samegame=s.gametype==gtostate.gametype
		if(!samegame){ return { ranges:false } }
		if(Array.isArray(s.board)&&s.board.length==3){ fsstate.board=s.board }
		if(domgetid("fsooprange")&&s.oop){ domgetid("fsooprange").value=s.oop }
		if(domgetid("fsiprange")&&s.ip){ domgetid("fsiprange").value=s.ip }
		if(Array.isArray(s.bg)){
			let base=domgetid("fsthirdrange")
			if(base){ base.value=s.bg[0]||"" }
			for(let i=1;i<s.bg.length&&i<FSBGMAX;i=i+1){
				fsbgaddrow()
				let extra=document.querySelectorAll("#fsbgextra .fsbgrange")
				let last=extra[extra.length-1]
				if(last){ last.value=s.bg[i]||"" }
			}
		}
		return { ranges:!!(s.oop||s.ip) }
	}catch(e){ return null }
}

function fssolve(){
	let board=fsgetboard()
	if(!board){ pttoast(fstext("errboard"),"error"); return }
	let ooprange=(domgetid("fsooprange").value||"").trim()
	let iprange=(domgetid("fsiprange").value||"").trim()
	if(!ooprange||!iprange){ pttoast(fstext("errrange"),"error"); return }
	let sd=gtostate.gametype=="SD"
	// 背景玩家（多人池）：蒐集所有 .fsbgrange 欄位，最多 7 家（共 9 人）。標準/短牌都支援。
	let bgranges=fsbgranges()
	let body={
		board:board,
		ooprange:ooprange,
		iprange:iprange,
		shortdeck:sd,
		pot:Number(domgetid("fspot").value)||10,
		stack:Number(domgetid("fsstack").value)||0,
		betsizes:fsstate.betsizes,
		"raise":fsstate.allowraise,
		thirdranges:bgranges,
		thirdrange:bgranges[0]||""   // 相容舊後端（單一第三人）
	}
	let button=domgetid("fssolve")
	ptsetsubmitstate(button,true,fstext("solving"))
	ajax("POST",AJAXURL+"solveflop",function(event,data){
		ptsetsubmitstate(button,false)
		if(data&&data["success"]&&data["data"]){
			fsstate.data=data["data"]
			fsstate.node="oop_root"
			fsstate.selected=""
			fsrenderresult()
		}else{
			pttoast(fstext("errfail"),"error")
		}
	},JSON.stringify(body),[
		["Content-Type","application/json"]
	],{timeout:60000})
}

function fsapplylanguage(){
	// 翻後求解器現在是「建議範圍參考」頁裡的一個區塊，不再覆蓋整頁 title（由 gtoapplylanguage 設定）
	innertext("#fstitle",fstext("title"),false)
	innertext("#fssubtitle",fstext("subtitle"),false)
	innertext("#fsadvancedtitle",fstext("advancedtitle"),false)
	innertext("#fsboardlabel",fstext("boardlabel"),false)
	innertext("#fspotlabel",fstext("potlabel"),false)
	innertext("#fsstacklabel",fstext("stacklabel"),false)
	innertext("#fsooplabel",fstext("ooplabel"),false)
	innertext("#fsiplabel",fstext("iplabel"),false)
	innertext("#fsthirdlabel",fstext("thirdlabel"),false)
	domgetid("fsthirdrange").placeholder=fstext("thirdplaceholder")
	var bgadd=domgetid("fsbgadd"); if(bgadd){ bgadd.value=fstext("bgadd") }
	var bgextra=document.querySelectorAll("#fsbgextra .fsbgrange")
	for(var bi=0;bi<bgextra.length;bi=bi+1){ bgextra[bi].placeholder=fstext("thirdplaceholder") }
	if(typeof fsbgupdatecount=="function"){ fsbgupdatecount() }
	innertext("#fsbetlabel",fstext("betlabel"),false)
	innertext("#fshint",fstext("hint"),false)
	innertext("#fssuitednote",fstext("suitednote"),false)
	innertext("#fsdisclaimer",fstext("disclaimer"),false)
	value("#fsrandom",fstext("random"))
	value("#fssolve",fstext("solve"))
}

// 進階求解的預設範例範圍。短牌不能有 2–5，另給短牌版。
let FS_DEFAULT_RANGES={
	HE:{ oop:"22+,A2s+,K9s+,QTs+,JTs,T9s,98s,AJo+,KQo", ip:"22+,A2s+,K9s+,Q9s+,J9s+,T8s+,A9o+,KTo+,QJo" },
	SD:{ oop:"66+,A6s+,K9s+,QTs+,JTs,T9s,98s,ATo+,KQo", ip:"66+,A6s+,K9s+,Q9s+,J9s+,T8s+,A9o+,KTo+,QJo" }
}

// 把進階求解的雙方範圍換成目前遊戲類型的預設（若使用者沒改過、或裡面有另一牌組非法的牌）
function gtoswapadvranges(){
	let oop=domgetid("fsooprange"), ip=domgetid("fsiprange")
	if(!oop||!ip){ return }
	let d=FS_DEFAULT_RANGES[gtostate.gametype]||FS_DEFAULT_RANGES.HE
	let other=gtostate.gametype=="SD"?FS_DEFAULT_RANGES.HE:FS_DEFAULT_RANGES.SD
	// 只在「還是另一牌組的預設值」時才換，避免蓋掉使用者自訂
	if(oop.value.trim()==""||oop.value.trim()==other.oop){ oop.value=d.oop }
	if(ip.value.trim()==""||ip.value.trim()==other.ip){ ip.value=d.ip }
}

function fsinit(){
	let restored=fsloadinputs()   // 先還原上次翻後輸入（localStorage）
	fsrenderboard()
	fsrenderbetsizes()
	// 沒還原到範圍才套遊戲類型預設：短牌（?gametype=SD 或還原）不能載入含 2–5 的 Hold'em 範圍
	if(!(restored&&restored.ranges)){
		let d=FS_DEFAULT_RANGES[gtostate.gametype]||FS_DEFAULT_RANGES.HE
		domgetid("fsooprange").value=d.oop
		domgetid("fsiprange").value=d.ip
	}
	fsapplylanguage()
	onclick("#fsrandom",function(){ fsrandomflop() })
	onclick("#fssolve",function(){ fssolve() })
	onclick("#fsbgadd",function(){ fsbgaddrow() })
	onenterclick("#fspot,#fsstack",function(){ fssolve() })
	// 進階區任何輸入變動（範圍、底池、計分牌、背景玩家）都即時存檔；背景玩家欄位另外更新「共 N 家」
	let adv=domgetid("fsadvanced")
	if(adv){ adv.addEventListener("input",function(e){
		if(e.target&&e.target.classList&&e.target.classList.contains("fsbgrange")){ fsbgupdatecount() }
		fssaveinputs()
	}) }
	fsbgupdatecount()
}

fsinit()
/*
	讀取本地 gtoworker.py 批次算好的離線結果（gtoresults/manifest.json + gtoresults/<id>.json），
	直接餵進上面既有的 fsstate/fsrenderresult 畫面，不用重新呼叫 solveflop。

	介面走 GTO Wizard 那種操作邏輯：選位置對位（按鈕）→ 點翻牌（卡牌選擇器，可選任意花色）
	→ 兩個都選了就自動載入。使用者選的花色不一定剛好等於 gtoworker.py 存的那張代表牌
	（同構去重只留 1755 張代表花色），所以用花色重新標號的方式算出「牌型指紋」去配對
	（跟 gtoflops.py 的 canon_key 是同一套算法），而不是要求使用者剛好點出存檔用的那組花色。
*/
let fslibmanifest=[]
let fslibstate={ scenario:"", board:["As","Kh","7c"] }

// 批次結果目錄依遊戲類型：標準版 gtoworker.py → gtoresults；短牌 shortdeckworker.py → shortdeckresults
function fslibresultsdir(){
	return gtostate.gametype=="SD"?"shortdeckresults":"gtoresults"
}

function fslibrankval(ch){
	return "23456789TJQKA".indexOf(ch.toUpperCase())
}

function fslibpermute(arr){
	if(arr.length<=1){ return [arr] }
	let out=[]
	for(let i=0;i<arr.length;i=i+1){
		let rest=arr.slice(0,i).concat(arr.slice(i+1))
		let subs=fslibpermute(rest)
		for(let j=0;j<subs.length;j=j+1){ out.push([arr[i]].concat(subs[j])) }
	}
	return out
}

function fslibcmp(a,b){
	for(let i=0;i<a.length;i=i+1){
		if(a[i]!=b[i]){ return a[i]<b[i]?-1:1 }
	}
	return 0
}

// 花色不管實際字母、只管「誰跟誰同花」，找出所有花色重新標號方式裡字典序最小的那個當指紋
function fslibcanonkey(board){
	let suits=[]
	for(let i=0;i<board.length;i=i+1){
		let s=board[i].slice(-1).toLowerCase()
		if(suits.indexOf(s)<0){ suits.push(s) }
	}
	let perms=fslibpermute(suits.map(function(_,i){ return i }))
	let best=null
	for(let p=0;p<perms.length;p=p+1){
		let remap={}
		for(let i=0;i<suits.length;i=i+1){ remap[suits[i]]=perms[p][i] }
		let labeled=board.map(function(c){ return [fslibrankval(c[0]),remap[c.slice(-1).toLowerCase()]] })
		labeled.sort(function(a,b){ return b[0]-a[0]||b[1]-a[1] })
		let flat=[]
		for(let i=0;i<labeled.length;i=i+1){ flat=flat.concat(labeled[i]) }
		if(best==null||fslibcmp(flat,best)<0){ best=flat }
	}
	return best.join(",")
}

function fslibscenarios(){
	let names=[]
	for(let i=0;i<fslibmanifest.length;i=i+1){
		let sc=fslibmanifest[i].scenario
		if(names.indexOf(sc)<0){ names.push(sc) }
	}
	return names
}

let GTOPOSORDER=["UTG","UTG1","MP","LJ","HJ","CO","BTN","SB","BB"]

function fslibscenarieswithinfo(){
	// 把情境名稱拆成 {name, opener, caller, kind}，之後兩層選單（先選開池方位置）用
	let out=[]
	let names=fslibscenarios()
	for(let i=0;i<names.length;i=i+1){
		let m=names[i].match(/^([A-Za-z0-9]+)vs([A-Za-z0-9]+)_(SRP|3betpot)$/)
		if(!m){ continue }
		out.push({ name:names[i], opener:m[1], caller:m[2], kind:m[3] })
	}
	return out
}

function fslibopenerlist(){
	let infos=fslibscenarieswithinfo()
	let openers=[]
	for(let i=0;i<infos.length;i=i+1){
		if(openers.indexOf(infos[i].opener)<0){ openers.push(infos[i].opener) }
	}
	openers.sort(function(a,b){ return GTOPOSORDER.indexOf(a)-GTOPOSORDER.indexOf(b) })
	return openers
}

// 第一層：選開池方位置（UTG / HJ / CO...）
function fslibrenderopeners(){
	let row=domgetid("fslibopenerrow")
	if(!row){ return }
	let openers=fslibopenerlist()
	let html=""
	for(let i=0;i<openers.length;i=i+1){
		let active=openers[i]==fslibstate.opener?" gtooptactive":""
		html=html+`<input type="button" class="gtoopt${active}" data-fslibopener="${openers[i]}" value="${gtoposlabel(openers[i])}">`
	}
	innerhtml(row,html,false)
	let btns=document.querySelectorAll("[data-fslibopener]")
	for(let i=0;i<btns.length;i=i+1){
		btns[i].addEventListener("click",function(){
			fslibstate.opener=this.getAttribute("data-fslibopener")
			let infos=fslibscenarieswithinfo().filter(function(x){ return x.opener==fslibstate.opener })
			if(infos.length&&infos.map(function(x){ return x.name }).indexOf(fslibstate.scenario)<0){
				fslibstate.scenario=infos[0].name
			}
			fslibrenderopeners()
			fslibrenderscenarios()
			fslibtryload()
		})
	}
}

// 第二層：選對位（vs HJ、vs BB…），只列目前選定開池方位置底下的情境
function fslibrenderscenarios(){
	let row=domgetid("fslibscenariorow")
	if(!row){ return }
	let infos=fslibscenarieswithinfo().filter(function(x){ return x.opener==fslibstate.opener })
	let html=""
	for(let i=0;i<infos.length;i=i+1){
		let active=infos[i].name==fslibstate.scenario?" gtooptactive":""
		let kind=infos[i].kind=="SRP"?fstext("kind_srp"):fstext("kind_3bet")
		let label="vs "+gtoposlabel(infos[i].caller)+"（"+kind+"）"
		html=html+`<input type="button" class="gtoopt${active}" data-fslibscenario="${infos[i].name}" value="${label}">`
	}
	innerhtml(row,html,false)
	let btns=document.querySelectorAll("[data-fslibscenario]")
	for(let i=0;i<btns.length;i=i+1){
		btns[i].addEventListener("click",function(){
			fslibstate.scenario=this.getAttribute("data-fslibscenario")
			fslibrenderscenarios()
			fslibtryload()
		})
	}
}

function fslibrenderboard(){
	let html=""
	for(let i=0;i<3;i=i+1){ html=html+fscardglyph(fslibstate.board[i]) }
	innerhtml("#fslibboardcards",`<div class="handrowcard boardstreetflop">${html}</div>`,false)
	let el=domgetid("fslibboardcards")
	if(el){
		el.style.cursor="pointer"
		el.onclick=function(){
			fsshowcardpicker(fstext("boardlabel"),fslibstate.board,3,function(selected){
				if(selected.length==3){ fslibstate.board=selected; fslibrenderboard(); fslibtryload() }
			})
		}
	}
}

function fslibtryload(){
	if(!fslibstate.scenario||fslibstate.board.filter(function(c){ return !!c }).length!=3){ return }
	let key=fslibcanonkey(fslibstate.board)
	let match=null
	for(let i=0;i<fslibmanifest.length;i=i+1){
		let m=fslibmanifest[i]
		if(m.scenario==fslibstate.scenario&&fslibcanonkey(m.board)==key){ match=m; break }
	}
	if(!match){
		innertext("#fslibhint",fstext("fslibnotready"),false)
		return
	}
	fetch("../"+fslibresultsdir()+"/"+match.id+".json",{cache:"no-store"}).then(function(r){
		if(!r.ok){ throw new Error("http "+r.status) }
		return r.json()
	}).then(function(data){
		fsstate.data=data
		fsstate.node="oop_root"
		fsstate.selected=""
		fsrenderresult()
		innertext("#fslibhint",fstext("fslibhint"),false)
	}).catch(function(e){
		pttoast(fstext("fslibfail"),"error")
	})
}

// 從網址帶入翻牌：?street=flop&flop=As,Kh,7c（給 handdetail.html 這類頁面連過來用）
function fslibapplyqueryboard(){
	let params=new URLSearchParams(location.search||"")
	let flop=params.get("flop")
	if(!flop){ return }
	let cards=flop.split(",").map(function(c){ return c.trim() }).filter(function(c){ return !!c })
	// 只接受標準兩碼牌代號（rank+花色白名單）且三張不重複；任一張不合法就整組忽略（避免注入）
	let validlist=[]
	for(let i=0;i<cards.length;i=i+1){
		let rank=cards[i].charAt(0).toUpperCase()
		let suit=cards[i].slice(1).toLowerCase()
		if(cards[i].length==2&&GTORANKS_HE.indexOf(rank)>=0&&"shdc".indexOf(suit)>=0){
			validlist.push(rank+suit)
		}
	}
	if(validlist.length==3&&(new Set(validlist)).size==3){ fslibstate.board=validlist }
}

// 讀（或重讀）目前遊戲類型的批次結果清單。切遊戲類型時要重讀（HE→gtoresults、SD→shortdeckresults）。
function fslibloadmanifest(){
	fslibmanifest=[]
	fslibrenderopeners()
	fslibrenderscenarios()
	fetch("../"+fslibresultsdir()+"/manifest.json",{cache:"no-store"}).then(function(r){
		if(!r.ok){ throw new Error("http "+r.status) }
		return r.json()
	}).then(function(data){
		fslibmanifest=data||[]
		if(fslibmanifest.length==0){
			innertext("#fslibhint",fstext("fslibempty"),false)
			return
		}
		let openers=fslibopenerlist()
		fslibstate.opener=openers[0]||""
		let infos=fslibscenarieswithinfo().filter(function(x){ return x.opener==fslibstate.opener })
		fslibstate.scenario=(infos[0]&&infos[0].name)||""
		fslibrenderopeners()
		fslibrenderscenarios()
		fslibrenderboard()
		fslibtryload()
	}).catch(function(e){
		innertext("#fslibhint",fstext("fslibempty"),false)
	})
}

// 翻後也放一個遊戲類型切換（Hold'em／短牌）：翻前的選擇器在切到翻後時被藏起來了，
// 直接沿用 gtohandleoption 的 gametype 分支（會同步點數/進階範圍/高亮，並重讀對應的批次結果）
function fslibrendergametype(){
	let row=domgetid("fslibgametype")
	if(!row){ return }
	let opts=GTOOPTIONS.gametype
	let html=""
	for(let i=0;i<opts.length;i=i+1){
		let active=String(gtostate.gametype)==String(opts[i])?" gtooptactive":""
		html=html+`<input type="button" class="gtoopt${active}" data-gtoopt="gametype" data-gtovalue="${opts[i]}" value="${gtogamelabel(opts[i])}">`
	}
	innerhtml(row,html,false)
	let btns=row.querySelectorAll("[data-gtoopt]")
	for(let i=0;i<btns.length;i=i+1){
		btns[i].addEventListener("click",function(){ gtohandleoption(this) })
	}
}

function fslibinit(){
	innertext("#fslibtitle",fstext("fslibtitle"),false)
	innertext("#fslibgametypelabel",gtotext("gametypelabel"),false)
	fslibrendergametype()
	innertext("#fslibopenerlabel",fstext("fslibopenerlabel"),false)
	innertext("#fslibscenariolabel",fstext("fslibscenariolabel"),false)
	innertext("#fslibboardlabel",fstext("boardlabel"),false)
	innertext("#fslibhint",fstext("fslibhint"),false)
	fslibapplyqueryboard()
	fslibloadmanifest()
}

fslibinit()
/*
	gto.html 上方的「翻前 / 翻牌」切換（原本 flopsolver.html 的功能已併入本檔）。
	Turn/River 按鈕先放著但停用：目前的樹只到 flop，턴/river 還是用窮舉 equity 收斂，
	沒有真的可以逐張選牌的節點，硬做會誤導使用者以為那是精算結果。
	（gtostreet 宣告移到檔案頂端，避免 gtoinit 早於此行執行時碰到 let 的暫時性死區。）
*/

function gtostreetapply(){
	let pre=domgetid("gtostreetpreflop")
	let flop=domgetid("gtostreetflop")
	if(pre){ pre.style.display=gtostreet=="preflop"?"block":"none" }
	if(flop){ flop.style.display=gtostreet=="flop"?"block":"none" }
	let btns=document.querySelectorAll("[data-gtostreet]")
	for(let i=0;i<btns.length;i=i+1){
		btns[i].classList.toggle("gtooptactive",btns[i].getAttribute("data-gtostreet")==gtostreet)
	}
}

// 翻後兩種遊戲類型都開放：批次結果（讀 gtoresults / shortdeckresults）+ 進階即時求解。
// 短牌的即時求解後端已支援（solveflop/solvenextstreet 帶 shortdeck flag），進階區不再隱藏。
function gtostreetapplyforgame(){
	let flopbtn=document.querySelector('[data-gtostreet="flop"]')
	if(flopbtn){
		flopbtn.disabled=false
		flopbtn.title=""
		flopbtn.style.opacity=""
	}
	let adv=domgetid("fsadvanced")
	if(adv){ adv.style.display="block" }
	// 多人池（背景玩家 range）標準與短牌都支援，欄位一律顯示
	let third=domgetid("fsthirdwrap")||(domgetid("fsthirdrange")?domgetid("fsthirdrange").closest("div"):null)
	if(third){ third.style.display="block" }
	gtostreetapply()
}

function gtostreetinit(){
	let params=new URLSearchParams(location.search||"")
	let street=params.get("street")
	if(street=="flop"){ gtostreet="flop" }
	gtostreetapplyforgame()
	let btns=document.querySelectorAll("[data-gtostreet]")
	for(let i=0;i<btns.length;i=i+1){
		btns[i].addEventListener("click",function(){
			if(this.disabled){ return }
			gtostreet=this.getAttribute("data-gtostreet")
			gtostreetapply()
			gtosavestate()
		})
	}
}

gtostreetinit()
