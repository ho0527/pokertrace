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
	翻後 GTO 求解器（前端）。呼叫後端 solveflop（CFR），畫出各節點 13x13 策略矩陣。
	文案內嵌雙語（讀 language），頁面 chrome 走 translate/initialize。
*/

// 花色代號與符號。原本第三欄放色碼，但沒有任何地方讀它（顏色一直是 CSS 決定的），已移除。
let FSSUITS=[["s","♠"],["h","♥"],["d","♦"],["c","♣"]]
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
		fslibtitle:"預先算好的策略庫",
		fslibopenerlabel:"開池方位置", fslibscenariolabel:"對位",
		fslibhint:"選位置對位、點翻牌選牌，選好會自動載入已經算好的策略，不用重新求解。",
		fslibempty:"這個環境沒有提供預先算好的策略庫。你可以改用下方「自己輸入範圍即時求解」直接算。",
		fslibfail:"讀取失敗",
		fslibnotready:"策略庫還沒有這組對位在這張翻牌的結果。你可以改用下方的即時求解。",
		thirdlabel:"背景選手範圍（多人池，選填，最多 7 家）",
		thirdplaceholder:"留空＝雙人求解；每填一格＝多一個背景選手（固定範圍、一般下注會跟、一被加注就當作蓋牌，非嚴謹多人均衡）",
		advancedtitle:"自己輸入範圍即時求解（多人池、overbet、再加注全下）",
		bgadd:"＋ 加一家", bgcount:"共 {n} 家（OOP＋IP＋{k} 個背景選手）",
		multiwaynote:"簡化多人模型：背景選手固定範圍、一般下注會跟、但一被加注就視為蓋牌；非嚴謹多人 Nash 均衡，僅供參考。",
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
		fslibtitle:"Prebuilt strategy library",
		fslibopenerlabel:"Opener position", fslibscenariolabel:"Matchup",
		fslibhint:"Pick a matchup and click the flop to pick cards — it loads the already-solved strategy automatically, no re-solving.",
		fslibempty:"This environment does not provide a prebuilt strategy library. You can use the range solver below instead.",
		fslibfail:"Failed to load",
		fslibnotready:"The library does not have this matchup on this flop yet. You can use the range solver below instead.",
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
	// 顏色交給 carddisplay.css 的 .deckface-two / .deckface-four 決定，跟牌桌上的牌面同一個開關；
	// 原本寫死 cardred / cardblack，等於這裡永遠是兩色，使用者選四色時對不起來。
	return `<span class="cardslot filled pt-suittext" data-suit="${symbol}">${rank}${symbol}</span>`
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
				button.innerHTML=`<span class="r">${gtoranks[r]}</span><span class="s pt-suittext" data-suit="${FSSUITS[s][1]}">${FSSUITS[s][1]}</span>`
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

let FSBGMAX=7   // 背景選手上限（OOP+IP+7 ＝ 最多 9 人）
// 目前所有背景選手範圍欄位（第一格 #fsthirdrange ＋ #fsbgextra 內動態新增的）
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
// 新增一個背景選手範圍欄位（含移除鈕）
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
	let filled=fsbgranges().length   // 只算「有填內容」的背景選手，空欄位不灌水
	let el=domgetid("fsbgcount")
	if(el){ el.textContent=fstext("bgcount").replace("{k}",filled).replace("{n}",filled+2) }
	let rows=fsbgcount()             // 欄位總數（含空的）用來擋上限
	let add=domgetid("fsbgadd")
	if(add){ add.disabled=rows>=FSBGMAX; add.style.opacity=rows>=FSBGMAX?"0.4":"" }
}

// ── 翻後輸入記憶（localStorage）：翻牌、雙方範圍、底池/計分牌、下注尺寸、背景選手，重整後還原 ──
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
// 範圍/牌面/背景選手跟遊戲類型綁定（短牌 vs 標準牌），只有同類型才還原；底池/計分牌/下注尺寸則一律還原。
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
	// 背景選手（多人池）：蒐集所有 .fsbgrange 欄位，最多 7 家（共 9 人）。標準/短牌都支援。
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
	// 翻後求解器現在是「建議範圍參考」頁裡的一個區塊，不再覆蓋整頁 title（由 gtoapplylanguage 設定）。
	// 2026-07-30：連帶把 `innertext("#fstitle",fstext("title"),false)` 一起刪掉 ——
	// 改成不覆蓋整頁 title 時 `id="fstitle"` 的元素就拿掉了，這一行留著只是對著不存在的
	// 元素寫字。range.html 的 #gtostreetflop 區塊只有 #fssubtitle，沒有標題元素；
	// 下面 21 個 #fs* 在 range.html 都找得到，只有 #fstitle 沒有。
	// （tools/audit/scandeadreference.js 掃出來的）
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
	// 進階區任何輸入變動（範圍、底池、計分牌、背景選手）都即時存檔；背景選手欄位另外更新「共 N 家」
	let adv=domgetid("fsadvanced")
	if(adv){ adv.addEventListener("input",function(e){
		if(e.target&&e.target.classList&&e.target.classList.contains("fsbgrange")){ fsbgupdatecount() }
		fssaveinputs()
	}) }
	fsbgupdatecount()
}

/*
	讀取本地 gtoworker.py 批次算好的離線結果（gtoresults/manifest.json + gtoresults/<id>.json），
	直接餵進上面既有的 fsstate/fsrenderresult 畫面，不用重新呼叫 solveflop。

	介面走 GTO Wizard 那種操作邏輯：選位置對位（按鈕）→ 點翻牌（卡牌選擇器，可選任意花色）
	→ 兩個都選了就自動載入。使用者選的花色不一定剛好等於 gtoworker.py 存的那張代表牌
	（同構去重只留 1755 張代表花色），所以用花色重新標號的方式算出「牌型指紋」去配對
	（跟 gtoflops.py 的 canon_key 是同一套算法），而不是要求使用者剛好點出存檔用的那組花色。
*/
/*
	TASK-086：manifest 的格式改過了，這裡的三個變數是「正規化之後」的形態。

	舊格式是一列一筆的陣列（7.3 MB / 56,160 筆），每筆帶 id / scenario / board /
	pot / stack / betsizes。實際上：id 恆等於 scenario+"_"+翻牌（所以 scenario 與
	board 冗餘），而 pot / stack / betsizes **這裡從來沒有用到** ——
	畫面上那三個值是從各翻牌自己的結果 JSON（fsstate.data）讀的。
	而且全部對位共用同一份 1755（德州）／573（短牌）個翻牌的清單。
	新格式因此只有「共用翻牌清單 + 對位名稱」，7.3 MB → 約 17 KB。

	`cache:"no-store"` 刻意保留：17 KB 每次重抓可以忽略，
	而保留它就完全沒有「為了快取而讓資料更新失效」的風險。

	fslibnormalize() 同時吃得下新舊兩種格式 —— 正式機的靜態檔是人工同步的，
	一定會有前端已經更新、manifest 還是舊格式的時間差。
*/
let fslibscenarionamelist=[]
let fslibfloplist=[]
// canonkey → 翻牌字串。載入時算一次；以前是每次查詢都對 1755 筆各算一次
// fslibcanonkey（裡面還有花色全排列），那是白花的。
let fslibflopkeymap={}
// 對位 → null（擁有全部翻牌）或 { 翻牌字串: true }（批次沒跑完時只有部分）
let fslibscenariohave={}
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
	return fslibscenarionamelist
}

// 把 manifest.json 讀進來的東西正規化成 fslibscenarionamelist / fslibfloplist /
// fslibflopkeymap / fslibscenariohave 四個變數。新舊兩種格式都吃。
function fslibnormalize(data){
	fslibscenarionamelist=[]
	fslibfloplist=[]
	fslibflopkeymap={}
	fslibscenariohave={}
	if(Array.isArray(data)){
		// 舊格式（陣列）：正式機還沒同步新 manifest 時會走到這裡
		let seen={}
		for(let i=0;i<data.length;i=i+1){
			let row=data[i]
			let name=row&&row.scenario
			let flop=(row&&row.board&&row.board.join(""))||""
			if(!name||!flop){ continue }
			if(fslibscenarionamelist.indexOf(name)<0){
				fslibscenarionamelist.push(name)
				fslibscenariohave[name]={}
			}
			fslibscenariohave[name][flop]=true
			if(!seen[flop]){ seen[flop]=true; fslibfloplist.push(flop) }
		}
	}else{
		if(data&&data.scenario&&Array.isArray(data.flop)){
			fslibfloplist=data.flop.slice()
			for(let name in data.scenario){
				fslibscenarionamelist.push(name)
				let own=data.scenario[name]
				if(Array.isArray(own)){
					// 索引清單：批次還沒跑完，這個對位只有部分翻牌
					let map={}
					for(let i=0;i<own.length;i=i+1){
						let flop=fslibfloplist[own[i]]
						if(flop!=undefined){ map[flop]=true }
					}
					fslibscenariohave[name]=map
				}else{
					fslibscenariohave[name]=null
				}
			}
		}
	}
	// 指紋索引只算一次
	for(let i=0;i<fslibfloplist.length;i=i+1){
		let flop=fslibfloplist[i]
		let cardlist=[flop.slice(0,2),flop.slice(2,4),flop.slice(4,6)]
		fslibflopkeymap[fslibcanonkey(cardlist)]=flop
	}
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
	// 使用者選的花色不一定等於存檔用的那組代表花色，所以用牌型指紋（canonkey）去查
	let flop=fslibflopkeymap[fslibcanonkey(fslibstate.board)]
	let have=fslibscenariohave[fslibstate.scenario]
	// 不能寫 have!=undefined —— null==undefined 在 JS 是成立的，那樣會把
	// 「擁有全部翻牌」（null）的對位一起排除掉。用有沒有這個 key 來判斷。
	let known=Object.prototype.hasOwnProperty.call(fslibscenariohave,fslibstate.scenario)
	let matchid=""
	// have==null 表示這個對位擁有全部翻牌；是物件時要逐一確認有沒有這一個
	if(flop!=undefined&&known&&(have==null||have[flop]==true)){
		matchid=fslibstate.scenario+"_"+flop
	}
	if(!matchid){
		innertext("#fslibhint",fstext("fslibnotready"),false)
		return
	}
	fetch("../"+fslibresultsdir()+"/"+matchid+".json",{cache:"no-store"}).then(function(r){
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
	fslibnormalize(null)
	fslibrenderopeners()
	fslibrenderscenarios()
	fetch("../"+fslibresultsdir()+"/manifest.json",{cache:"no-store"}).then(function(r){
		if(!r.ok){ throw new Error("http "+r.status) }
		return r.json()
	}).then(function(data){
		fslibnormalize(data)
		if(fslibscenarionamelist.length==0){
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

