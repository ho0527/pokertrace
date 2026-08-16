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
	// 多人池（背景選手 range）標準與短牌都支援，欄位一律顯示
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


/*
	統一啟動。四個 init 原本散在各自區塊的結尾，拆檔後必須集中在這裡 ——
	gtoinit() 會呼叫本檔的 gtostreetapplyforgame()，順序不對就是 ReferenceError。
*/
gtoinit()
fsinit()
fslibinit()
gtostreetinit()
