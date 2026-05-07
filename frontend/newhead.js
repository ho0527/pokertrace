let tableid=getget("tableid")
let timezone="+00:00"

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function clearlocalstorage(){
    weblsset(WEBLSNAME+"dealerseat",null)
    weblsset(WEBLSNAME+"selfseating",null)
    weblsset(WEBLSNAME+"step",null)
    weblsset(WEBLSNAME+"handcard",null)
    weblsset(WEBLSNAME+"boardcard",null)
    weblsset(WEBLSNAME+"bittingdata",null)
    weblsset(WEBLSNAME+"seatinglist",null)
    weblsset(WEBLSNAME+"showdowndata",null)
    weblsset(WEBLSNAME+"winner",null)
    weblsset(WEBLSNAME+"winnerprice",null)
}

onclick("#back",function(element,event){
	href("table.html?id="+tableid+"#2")
})

onclick("#cleardata",function(element,event){
    if(confirm("確定要清空緩存資料嗎？")){
        clearlocalstorage()
        href("")
    }
})

ajax("GET",AJAXURL+"gettable/"+tableid,function(event,data){
	if(data["success"]){
		let row=data["data"]

        // let minchip="100"
		let startchip=row["chip"]
		let dealerseat=weblsget(WEBLSNAME+"dealerseat")??(row["hand"].length==0?row["firstdealerplace"]:row["hand"][row["hand"].length-1]["dealerseat"])
		let selfseating=weblsget(WEBLSNAME+"selfseating")??row["selfseating"]
		let seating=row["seating"]
		let smallblind=int(row["smallblind"])||0
		let bigblind=int(row["bigblind"])||0
		let bigblindante=int(row["bigblindante"])||0
		let ante=int(row["ante"])||0
		let step=int(weblsget(WEBLSNAME+"step")??0)
		let handcard=json(weblsget(WEBLSNAME+"handcard"))??{ "card1": "", "card2": "" }
		let boardcard=json(weblsget(WEBLSNAME+"boardcard"))??{ "flop": [null,null,null],"turn": null,"river": null }
		let bittingdata=json(weblsget(WEBLSNAME+"bittingdata"))??{ "preflop": [],"flop": [],"turn": [],"river": [] }
		let seatinglist=json(weblsget(WEBLSNAME+"seatinglist"))??[null]
		let showdowndata=json(weblsget(WEBLSNAME+"showdowndata"))??{}
        let winner=json(weblsget(WEBLSNAME+"winner"))??[null]
        let winnerprice=json(weblsget(WEBLSNAME+"winnerprice"))??[null]
		let smallblindseat=-1
		let bigblindseat=-1
		let seatcount=0

		if(weblsget(WEBLSNAME+"dealerseat")){
			dealerseat=weblsget(WEBLSNAME+"dealerseat")
		}else{
			console.log(row)
			if(row["hand"].length==0){
				dealerseat=row["firstdealerplace"]
			}else{
				let lastdealer=row["hand"][row["hand"].length-1]["dealerseat"]
				let total=row["seating"].length-1
				do{
					lastdealer=lastdealer+1
					if(lastdealer>total) lastdealer=1
				}while(!row["seating"][lastdealer]||row["seating"][lastdealer]==false)
				dealerseat=lastdealer
			}
		}

        function getpot(step,position=10){
            let totalpot=0
            let seatpot=[null,0,0,0,0,0,0,0,0,0,0,0]

            if(step=="river"){
                for(let i=0;i<bittingdata["river"].length;i=i+1){
                    totalpot=totalpot+bittingdata["river"][i]["chip"]
                    if(bittingdata["river"][i]["action"]!="ante"){
                        seatpot[bittingdata["river"][i]["seat"]]=seatpot[bittingdata["river"][i]["seat"]]+bittingdata["river"][i]["chip"]
                    }
                }
            }

            if(step=="turn"||step=="river"){
                for(let i=0;i<bittingdata["turn"].length;i=i+1){
                    totalpot=totalpot+bittingdata["turn"][i]["chip"]
                    if(bittingdata["turn"][i]["action"]!="ante"){
                        seatpot[bittingdata["turn"][i]["seat"]]=seatpot[bittingdata["turn"][i]["seat"]]+bittingdata["turn"][i]["chip"]
                    }
                }
            }

            if(step=="flop"||step=="turn"||step=="river"){
                for(let i=0;i<bittingdata["flop"].length;i=i+1){
                    totalpot=totalpot+bittingdata["flop"][i]["chip"]
                    if(bittingdata["flop"][i]["action"]!="ante"){
                        seatpot[bittingdata["flop"][i]["seat"]]=seatpot[bittingdata["flop"][i]["seat"]]+bittingdata["flop"][i]["chip"]
                    }
                }
            }

            if(step=="preflop"||step=="flop"||step=="turn"||step=="river"){
                for(let i=0;i<bittingdata["preflop"].length;i=i+1){
                    totalpot=totalpot+bittingdata["preflop"][i]["chip"]
                    if(bittingdata["preflop"][i]["action"]!="ante"){
                        seatpot[bittingdata["preflop"][i]["seat"]]=seatpot[bittingdata["preflop"][i]["seat"]]+bittingdata["preflop"][i]["chip"]
                    }
                }
            }

            return [totalpot,seatpot]
        }

		// 初始化座位列表
		if(seatinglist.length == 1){
            if(row["hand"].length==0){
                for(let i=0;i<seating.length-1;i=i+1){
                    if(seating[i]&&seating[i]["history"]&&seating[i]["history"].length!=0&&seating[i]["history"][seating[i]["history"].length-1]&&seating[i]["history"][seating[i]["history"].length-1]["type"]!="leave"){
                        seatinglist.push({
                            "chip": seating[i]["history"][seating[i]["history"].length-1]["chip"]||seating[i]["chip"]||0,
                            "name": seating[i]["history"][seating[i]["history"].length-1]["player"]
                        })
                        seatcount=seatcount+1
                    }else{
                        seatinglist.push(false)
                    }
                }
                weblsset(WEBLSNAME+"seatinglist",str(seatinglist))
            }else{
                for(let i=0;i<seating.length-1;i=i+1){
                        seatinglist.push(false)
                }
                for(let i=0;i<row["hand"][row["hand"].length-1]["seatingdata"].length;i=i+1){
                    if(0<row["hand"][row["hand"].length-1]["seatingdata"][i]["endchip"]){
                        seatinglist[row["hand"][row["hand"].length-1]["seatingdata"][i]["seatno"]]={
                            "chip": row["hand"][row["hand"].length-1]["seatingdata"][i]["endchip"],
                            "name": row["hand"][row["hand"].length-1]["seatingdata"][i]["name"]
                        }
                        seatcount=seatcount+1
                    }else{
                        seatinglist.push(false)
                    }
                }
                console.log(seatinglist)
                // weblsset(WEBLSNAME+"seatinglist",str(seatinglist))
            }
		}else{
			for(let i=1;i<seatinglist.length;i++){
				if(seatinglist[i]&&seatinglist[i]!=false) seatcount++
			}
		}

		// ==================== 核心功能函數 ====================

		// 獲取玩家剩餘籌碼
		function getPlayerRemainingChips(seat,currentRound){
			let player=seatinglist[seat]
			if(!player) return 0

			let totalBet=0
			let rounds=["preflop","flop","turn","river"]
			let currentIndex=rounds.indexOf(currentRound)

			for(let i=0;i <= currentIndex;i++){
				let round=rounds[i]
				if(bittingdata[round]){
					console.log(bittingdata[round])
					bittingdata[round].forEach(function(bet){
						if(bet.seat==seat){
							console.log(bet.chip)
							totalBet=totalBet+(parseInt(bet.chip)||0)
						}
					})
				}
			}

			return parseInt(player.chip)-totalBet
		}

		// 新增顯示自製鍵盤的函數
		function showCustomKeyboard(seat, currentRound, minRaise) {
			// 檢查是否已存在鍵盤，如果存在則先移除
			let existingKeyboard=document.getElementById("custom-keyboard-modal")
			if(existingKeyboard) {
				document.body.removeChild(existingKeyboard)
			}

			let remaining=getPlayerRemainingChips(seat, currentRound)
			let currentValue=minRaise

			let modal=document.createElement("div")
			modal.id="custom-keyboard-modal"
			modal.className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"

			modal.innerHTML=`
				<div class="bg-zinc-900 rounded-lg max-w-md w-full p-6">
					<div class="mb-4">
						<h2 class="text-xl font-bold mb-2">加注金額</h2>
						<div class="text-sm text-zinc-400 mb-2">
							最小加注: $${minRaise} | 剩餘籌碼: $${remaining}
						</div>
						<input
							type="text"
							id="keyboard-input"
							class="w-full bg-zinc-800 text-white text-2xl font-bold px-4 py-3 rounded text-right"
							value="${currentValue}"
							readonly
						>
					</div>

					<div class="grid grid-cols-3 gap-2 mb-4">
						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="1">1</button>
						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="2">2</button>
						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="3">3</button>

						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="4">4</button>
						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="5">5</button>
						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="6">6</button>

						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="7">7</button>
						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="8">8</button>
						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="9">9</button>

						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="00">00</button>
						<button class="num-btn bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold py-4 rounded" data-num="0">0</button>
						<button class="del-btn bg-red-600 hover:bg-red-700 text-white text-xl font-bold py-4 rounded">
							<svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"></path>
							</svg>
						</button>
					</div>

					<div class="grid grid-cols-3 gap-2 mb-4">
						<button class="shortcut-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded text-sm">最小</button>
						<button class="shortcut-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded text-sm">2BB</button>
						<button class="shortcut-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded text-sm">3BB</button>
						<button class="shortcut-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded text-sm">1/2池</button>
						<button class="shortcut-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded text-sm">3/4池</button>
						<button class="shortcut-btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded text-sm">全下</button>
					</div>

					<div class="flex gap-2">
						<button class="cancel-keyboard bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded flex-1">取消</button>
						<button class="confirm-keyboard bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded flex-1">確認</button>
					</div>
				</div>
			`

			document.body.appendChild(modal)

			let input=document.getElementById("keyboard-input")

			// 計算當前底池
			function calculateCurrentPot() {
				let pot=0
				let rounds=["preflop", "flop", "turn", "river"]
				let currentIndex=rounds.indexOf(currentRound)

				for(let i=0; i <= currentIndex; i++) {
					let round=rounds[i]
					if(bittingdata[round]) {
						bittingdata[round].forEach(function(bet) {
							pot += parseInt(bet.chip) || 0
						})
					}
				}
				return pot
			}

			// 數字按鈕事件
			modal.querySelectorAll(".num-btn").forEach(function(btn) {
				btn.addEventListener("click", function() {
					let num=this.dataset.num
					let currentVal=input.value

					// 如果當前值是0或預設值，直接替換
					if(currentVal == "0" || currentVal == minRaise.toString()) {
						input.value=num
					} else {
						input.value=currentVal + num
					}

					// 限制不超過剩餘籌碼
					if(parseInt(input.value) > remaining) {
						input.value=remaining.toString()
					}
				})
			})

			// 刪除按鈕
			modal.querySelector(".del-btn").addEventListener("click", function() {
				let currentVal=input.value
				if(currentVal.length > 1) {
					input.value=currentVal.slice(0, -1)
				} else {
					input.value="0"
				}
			})

			// 快捷按鈕
			let shortcuts=modal.querySelectorAll(".shortcut-btn")

			shortcuts[0].addEventListener("click", function() {
				input.value=minRaise.toString()
			})

			shortcuts[1].addEventListener("click", function() {
				let amount=bigblind * 2
				if(amount > remaining) amount=remaining
				input.value=amount.toString()
			})

			shortcuts[2].addEventListener("click", function() {
				let amount=bigblind * 3
				if(amount > remaining) amount=remaining
				input.value=amount.toString()
			})

			shortcuts[3].addEventListener("click", function() {
				let pot=calculateCurrentPot()
				let amount=Math.floor(pot / 2)
				if(amount < minRaise) amount=minRaise
				if(amount > remaining) amount=remaining
				input.value=amount.toString()
			})

			shortcuts[4].addEventListener("click", function() {
				let pot=calculateCurrentPot()
				let amount=Math.floor(pot * 3 / 4)
				if(amount < minRaise) amount=minRaise
				if(amount > remaining) amount=remaining
				input.value=amount.toString()
			})

			shortcuts[5].addEventListener("click", function() {
				input.value=remaining.toString()
			})

			// 取消按鈕
			modal.querySelector(".cancel-keyboard").addEventListener("click", function() {
				// 重置加注狀態
				for(let i=0; i < bittingdata[currentRound].length; i++) {
					if(bittingdata[currentRound][i].seat == seat && bittingdata[currentRound][i].action == "raise") {
						bittingdata[currentRound][i].action=""
						bittingdata[currentRound][i].chip=0
						delete bittingdata[currentRound][i].isEditing
						break
					}
				}
				weblsset(WEBLSNAME+"bittingdata", str(bittingdata))
				document.body.removeChild(modal)
				renderBettingTable()
			})

			// 確認按鈕
			modal.querySelector(".confirm-keyboard").addEventListener("click", function() {
				let raiseAmount=parseInt(input.value) || 0

				if(raiseAmount < minRaise) {
					alert(`加注金額不足！最小加注: $${minRaise}`)
					return
				}

				if(raiseAmount > remaining) {
					alert(`籌碼不足！剩餘籌碼: ${remaining}`)
					return
				}

				// 更新加注金額
				for(let i=0; i < bittingdata[currentRound].length; i++) {
					if(bittingdata[currentRound][i].seat == seat && bittingdata[currentRound][i].action == "raise") {
						bittingdata[currentRound][i].chip=raiseAmount
						delete bittingdata[currentRound][i].isEditing
						break
					}
				}

				handleRaiseAction(currentRound, seat)
				weblsset(WEBLSNAME+"bittingdata", str(bittingdata))
				document.body.removeChild(modal)
				renderBettingTable()
				checkNextStepAvailability()
			})

			// 點擊背景關閉
			modal.addEventListener("click", function(e) {
				if(e.target === modal) {
					modal.querySelector(".cancel-keyboard").click()
				}
			})

			// 支援實體鍵盤輸入（電腦版）
			input.addEventListener("focus", function() {
				this.removeAttribute("readonly")
			})

			input.addEventListener("blur", function() {
				this.setAttribute("readonly", "readonly")
			})

			input.addEventListener("input", function() {
				let value=parseInt(this.value) || 0
				if(value > remaining) {
					this.value=remaining.toString()
				}
			})
		}

		// 獲取當前回合玩家已下注金額
		function getPlayerCurrentRoundBet(seat,currentRound){
			let total=0
			if(bittingdata[currentRound]){
				bittingdata[currentRound].forEach(function(bet){
					if(bet.seat==seat&&bet.action!="ante"){
						total += parseInt(bet.chip)||0
					}
				})
			}
			return total
		}

		// 獲取當前回合最高下注金額
		function getCurrentRoundMaxBet(currentRound){
			let playerMaxBets=new Map()

			if(bittingdata[currentRound]){
				bittingdata[currentRound].forEach(function(bet){
					if(bet.action!="ante"){
						let current=playerMaxBets.get(bet.seat)||0
						playerMaxBets.set(bet.seat,current+(parseInt(bet.chip)||0))
					}
				})
			}

			let maxBet=0
			playerMaxBets.forEach(function(total){
				if(total>maxBet) maxBet=total
			})

			if(currentRound=="preflop"&&maxBet==0){
				maxBet=bigblind
			}

			return maxBet
		}

		// 獲取上一次加注差額
		function getLastRaiseAmount(currentRound){
			let allBets=[]

			if(bittingdata[currentRound]){
				let playerTotalBets=new Map()

				bittingdata[currentRound].forEach(function(bet){
					if(bet.action=="raise"||bet.action=="allin"||bet.action=="blind"){
						let current=playerTotalBets.get(bet.seat)||0
						let newTotal=current+(parseInt(bet.chip)||0)
						playerTotalBets.set(bet.seat,newTotal)

						if(bet.action=="raise"||(bet.action=="allin"&&newTotal>getCurrentRoundMaxBet(currentRound))){
							allBets.push({ total: newTotal,action: bet.action })
						}
					}
				})
			}

			if(allBets.length==0){
				return bigblind
			}

			if(allBets.length==1){
				if(currentRound=="preflop"){
					return allBets[0].total-bigblind
				}else{
					return allBets[0].total
				}
			}

			let sortedBets=allBets.sort((a,b) => a.total-b.total)
			return sortedBets[sortedBets.length-1].total-sortedBets[sortedBets.length-2].total
		}

		// 計算跟注金額
		function getCallAmount(seat,currentRound){
			let maxBet=getCurrentRoundMaxBet(currentRound)
			let playerBet=getPlayerCurrentRoundBet(seat,currentRound)
			return Math.max(0,maxBet-playerBet)
		}

		// 計算最小加注金額
		function getMinRaiseAmount(seat,currentRound){
			let currentMaxBet=getCurrentRoundMaxBet(currentRound)
			let lastRaiseAmount=getLastRaiseAmount(currentRound)
			let playerCurrentBet=getPlayerCurrentRoundBet(seat,currentRound)

			let minTotalBet=currentMaxBet+lastRaiseAmount
			let minRaiseChip=minTotalBet-playerCurrentBet

			if(minRaiseChip<bigblind){
				minRaiseChip=bigblind
			}

			return minRaiseChip
		}

		// 檢查玩家是否可以過牌
		function canCheck(seat,currentRound){
			let callAmount=getCallAmount(seat,currentRound)
			return callAmount==0
		}

		// 檢查玩家是否已經行動過
		function hasPlayerActed(seat,currentRound){
			if(!bittingdata[currentRound]) return false

			for(let i=0;i<bittingdata[currentRound].length;i++){
				let bet=bittingdata[currentRound][i]
				if(bet.seat==seat&&bet.action&&bet.action!=""&&bet.action!="blind"&&bet.action!="ante"){
					return true
				}
			}
			return false
		}

		// 獲取上一回合存活玩家
		function getPreviousRoundActivePlayers(currentRound){
			let rounds=["preflop","flop","turn","river"]
			let currentIndex=rounds.indexOf(currentRound)
			if(currentIndex <= 0) return new Set()

			let prevRound=rounds[currentIndex-1]
			let activePlayers=new Set()

			if(bittingdata[prevRound]){
				let lastActions=new Map()
				bittingdata[prevRound].forEach(function(bet){
					lastActions.set(bet.seat,bet.action)
				})

				lastActions.forEach(function(action,seat){
					if(action!="fold"){
						activePlayers.add(seat)
					}
				})
			}

			return activePlayers
		}

		// 初始化翻牌前下注
		function initializePreflopBetting(){
			if(bittingdata["preflop"]&&bittingdata["preflop"].length>0){
				bittingdata["preflop"].forEach(function(bet){
					if(bet.isSB) smallblindseat=bet.seat
					if(bet.isBB) bigblindseat=bet.seat
				})
				return
			}

			bittingdata["preflop"]=[]
			let totalSeats=seatinglist.length-1
			let activePlayers=[]

			for(let i=1;i <= totalSeats;i++){
				if(seatinglist[i]&&seatinglist[i]!=false){
					activePlayers.push(i)
				}
			}

			if(activePlayers.length<2) return

			let dealerIdx=activePlayers.indexOf(parseInt(dealerseat))
			if(dealerIdx==-1) dealerIdx=0

			let orderedPlayers=[]
			for(let i=1;i <= activePlayers.length;i++){
				let idx =(dealerIdx+i) % activePlayers.length
				orderedPlayers.push(activePlayers[idx])
			}

			smallblindseat=orderedPlayers[0]
			bigblindseat=orderedPlayers[1]

			if(ante>0){
				orderedPlayers.forEach(function(seat){
					bittingdata["preflop"].push({
						"seat": seat,
						"name": seatinglist[seat].name,
						"action": "ante",
					    "timebank": 0,
						"chip": ante
					})
				})
			}

			bittingdata["preflop"].push({
				"seat": smallblindseat,
				"name": seatinglist[smallblindseat]["name"],
				"action": "blind",
				"chip": smallblind,
                "timebank": 0,
				"isBlind": true,
				"isSB": true
			})

			if(bigblindante>0){
				bittingdata["preflop"].push({
					"seat": bigblindseat,
					"name": seatinglist[bigblindseat]["name"],
					"action": "ante",
					"chip": bigblindante,
					"timebank": 0,
					"isBlind": true,
					"isBB": true
				})
			}

			bittingdata["preflop"].push({
				"seat": bigblindseat,
				"name": seatinglist[bigblindseat]["name"],
				"action": "blind",
				"chip": bigblind,
				"isBlind": true,
				"isBB": true
			})

			for(let i=2;i<orderedPlayers.length;i++){
				bittingdata["preflop"].push({
					"seat": orderedPlayers[i],
					"name": seatinglist[orderedPlayers[i]]["name"],
					"action": "",
					"timebank": 0,
					"chip": 0
				})
			}

			bittingdata["preflop"].push({
				"seat": smallblindseat,
				"name": seatinglist[smallblindseat]["name"],
				"action": "",
                "timebank": 0,
				"chip": 0
			})

			bittingdata["preflop"].push({
				"seat": bigblindseat,
				"name": seatinglist[bigblindseat]["name"],
				"action": "",
                "timebank": 0,
				"chip": 0
			})

			weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
		}

		// 初始化其他回合的下注
		function initializeRoundBetting(currentRound){
			if(bittingdata[currentRound]&&bittingdata[currentRound].length>0){
				return
			}

			let activePlayers=getPreviousRoundActivePlayers(currentRound)
			if(activePlayers.size==0) return

			bittingdata[currentRound]=[]

			let totalSeats=seatinglist.length-1
			let activeList=[]

			for(let offset=0;offset<totalSeats;offset++){
				let seat =(smallblindseat+offset-1) % totalSeats+1
				if(activePlayers.has(seat)){
					activeList.push(seat)
				}
			}

			activeList.forEach(function(seat){
				bittingdata[currentRound].push({
					"seat": seat,
					"name": seatinglist[seat].name,
					"action": "",
					"chip": 0
				})
			})

			weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
		}

		// 處理加注後的邏輯（修正版）
		function handleRaiseAction(currentRound,raiserSeat){
			if(!bittingdata[currentRound]) return

			// 找到加注者的最後一次行動
			let raiserIndex=-1
			for(let i=bittingdata[currentRound].length-1;i >= 0;i--){
				if(bittingdata[currentRound][i].seat==raiserSeat &&
					(bittingdata[currentRound][i].action=="raise"||bittingdata[currentRound][i].action=="allin")){
					raiserIndex=i
					break
				}
			}

			if(raiserIndex==-1) return

			// 找出所有需要重新行動的玩家
			let playersNeedAction=new Set()
			let playerLastAction=new Map()

			// 遍歷所有記錄，獲取每個玩家的最後行動
			for(let i=0;i <= raiserIndex;i++){
				let bet=bittingdata[currentRound][i]
				if(bet.action!="ante"&&bet.action!="blind"){
					playerLastAction.set(bet.seat,bet.action)
				}
			}

			// 找出需要重新行動的玩家（除了fold和allin的玩家）
			playerLastAction.forEach(function(action,seat){
				if(seat!=raiserSeat&&action!="fold"&&action!="allin"){
					playersNeedAction.add(seat)
				}
			})

			// 為需要重新行動的玩家添加新的行動機會
			playersNeedAction.forEach(function(seat){
				// 檢查是否已經在後面添加過
				let existsAfter=false
				for(let i=raiserIndex+1;i<bittingdata[currentRound].length;i++){
					if(bittingdata[currentRound][i].seat==seat){
						existsAfter=true
						break
					}
				}

				if(!existsAfter){
					bittingdata[currentRound].push({
						seat: seat,
						name: seatinglist[seat].name,
						action: "",
						chip: 0
					})
				}
			})

			weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
		}

		// 檢查是否所有玩家都已行動完畢
		function isRoundComplete(currentRound){
			if(!bittingdata[currentRound]) return false

			let playerLastAction=new Map()
			let playerTotalBet=new Map()

			bittingdata[currentRound].forEach(function(bet){
				if(bet.action!="ante"){
					playerLastAction.set(bet.seat,bet.action)
					let currentBet=playerTotalBet.get(bet.seat)||0
					playerTotalBet.set(bet.seat,currentBet+(parseInt(bet.chip)||0))
				}
			})

			let activePlayers=[]
			playerLastAction.forEach(function(action,seat){
				if(action!="fold"){
					activePlayers.push(seat)
				}
			})

			if(activePlayers.length==0) return false
			if(activePlayers.length==1) return true

			// 檢查是否所有玩家都有行動
			for(let i=0;i<activePlayers.length;i++){
				let seat=activePlayers[i]
				let action=playerLastAction.get(seat)
				if(!action||action=="") return false
			}

			let maxBet=0
			let allInPlayers=new Set()

			playerLastAction.forEach(function(action,seat){
				if(action=="allin"){
					allInPlayers.add(seat)
				}else if(action!="fold"){
					let bet=playerTotalBet.get(seat)||0
					if(bet>maxBet) maxBet=bet
				}
			})

			// 檢查所有非all-in玩家的下注是否相等
			for(let i=0;i<activePlayers.length;i++){
				let seat=activePlayers[i]
				if(!allInPlayers.has(seat)){
					let bet=playerTotalBet.get(seat)||0
					if(bet!=maxBet) return false
				}
			}

			return true
		}

		// 獲取所有存活玩家（未棄牌）
		function getActivePlayers(){
			let activePlayers=[]
			let rounds=["preflop","flop","turn","river"]

			for(let i=1;i<seatinglist.length;i++){
				if(!seatinglist[i]||seatinglist[i]==false) continue

				let hasFolded=false

				for(let r=0;r<rounds.length;r++){
					let round=rounds[r]
					if(bittingdata[round]){
						for(let b=0;b<bittingdata[round].length;b++){
							if(bittingdata[round][b].seat==i&&bittingdata[round][b].action=="fold"){
								hasFolded=true
								break
							}
						}
					}
					if(hasFolded) break
				}

				if(!hasFolded){
					activePlayers.push({
						seat: i,
						name: seatinglist[i].name,
						chip: getPlayerRemainingChips(i,"river")
					})
				}
			}

			return activePlayers
		}

		// ==================== UI 渲染函數 ====================
		function renderBettingTable(){
			let tbody=document.getElementById("betting-table-body")
			if(!tbody) return

			let currentRound=getCurrentBettingRound()

			if(currentRound=="preflop"){
				initializePreflopBetting()
			}else{
				initializeRoundBetting(currentRound)
			}

			tbody.innerHTML=""

			if(!bittingdata[currentRound]) return

			bittingdata[currentRound].forEach(function(bet,index){
				let tr=document.createElement("tr")
				tr.className="bg-zinc-800"
				tr.dataset.seat=bet.seat
				tr.dataset.index=index

				let remaining=getPlayerRemainingChips(bet.seat,currentRound)

				if(bet.action=="blind"){
					tr.innerHTML=`
                        <td class="py-2 px-2">${bet.seat}</td>
                        <td class="py-2 px-2">${bet.name}</td>
                        <td class="py-2 px-2 text-yellow-400">(盲注)</td>
                        <td class="py-2 px-2">$${bet.chip}<span class="text-xs text-zinc-500">(剩餘: $${remaining})</span></td>
                    `
				}else if(bet.action=="ante"){
					tr.innerHTML=`
                        <td class="py-2 px-2">${bet.seat}</td>
                        <td class="py-2 px-2">${bet.name}</td>
                        <td class="py-2 px-2 text-yellow-400">(前注)</td>
                        <td class="py-2 px-2">$${bet.chip}<span class="text-xs text-zinc-500">(剩餘: $${remaining+bigblindante+ante})</span></td>
                    `
				}else{
					let actionText=""
					let chipText=bet.chip||0
					let actionColor="text-white"

					if(bet.action=="raise"){
						actionText="加注"
						actionColor="text-red-400"
					}else if(bet.action=="call"){
						actionText="跟注"
						actionColor="text-green-400"
					}else if(bet.action=="fold"){
						actionText="棄牌"
						actionColor="text-gray-400"
					}else if(bet.action=="check"){
						actionText="過牌"
						actionColor="text-blue-400"
					}else if(bet.action=="allin"){
						actionText="全下"
						actionColor="text-purple-400"
					}else{
						actionText="待行動"
						actionColor="text-zinc-500"
					}

					let canAct=!bet.action||bet.action==""
					let hasActed=bet.action&&bet.action!=""
					let isRaising=bet.action=="raise"&&bet.isEditing

					tr.innerHTML=`
                        <td class="py-2 px-2">${bet.seat}</td>
                        <td class="py-2 px-2">${bet.name}</td>
                        <td class="py-2 px-2">
                            <div class="flex flex-wrap gap-2 items-center">
                                ${canAct ? `
                                    <button class="action-btn bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm" data-action="raise">加注</button>
                                    <button class="action-btn bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm" data-action="call">跟注</button>
                                    <button class="action-btn bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm" data-action="check">過牌</button>
                                    <button class="action-btn bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-sm" data-action="fold">棄牌</button>
                                    <button class="action-btn bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-sm" data-action="allin">全下</button>
                                ` : isRaising ? `
                                    <span class="${actionColor} font-semibold">${actionText}</span>
                                    <button class="confirm-raise-btn bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded text-sm" data-seat="${bet.seat}">確認</button>
                                    <button class="cancel-raise-btn bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-sm" data-seat="${bet.seat}">取消</button>
                                ` : `
                                    <span class="${actionColor} font-semibold">${actionText}</span>
                                    ${hasActed ? `<button class="undo-btn bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-sm ml-2" data-seat="${bet.seat}">反悔</button>` : ''}
                                `}
                            </div>
                        </td>
                        <td class="py-2 px-2">
                            ${isRaising ? `
                                <input type="number" class="raise-input bg-zinc-700 text-white px-2 py-1 rounded w-24" value="${chipText}" data-seat="${bet.seat}">
                            ` : `
                                <span>$${chipText}</span>
                            `}
                            <div class="text-xs text-zinc-500 mt-1">剩餘: $${remaining}</div>
                        </td>
                        <td class="py-2 px-2">
                            <input type="number" class="timebank bg-zinc-700 text-white px-2 py-1 rounded w-24" data-i="${index}" step="1" value="${bet["timebank"]||0}">
                        </td>
                    `

					if(canAct){
						setTimeout(function(){
							let checkBtn=tr.querySelector("[data-action='check']")
							let canCheckNow=canCheck(bet.seat,currentRound)
							if(checkBtn){
								if(!canCheckNow){
									checkBtn.disabled=true
									checkBtn.classList.add("opacity-50","cursor-not-allowed")
									checkBtn.classList.remove("hover:bg-blue-700")
								}
							}

							let callBtn=tr.querySelector("[data-action='call']")
							if(callBtn){
								let callAmount=getCallAmount(bet.seat,currentRound)
								if(callAmount==0&&canCheckNow){
									callBtn.disabled=true
									callBtn.classList.add("opacity-50","cursor-not-allowed")
									callBtn.classList.remove("hover:bg-green-700")
									callBtn.textContent="跟注"
								}else if(callAmount>0){
									callBtn.textContent=`跟注 $${callAmount}`
								}else{
									callBtn.textContent="跟注"
								}
							}

							let raiseBtn=tr.querySelector("[data-action='raise']")
							if(raiseBtn){
								let minRaise=getMinRaiseAmount(bet.seat,currentRound)
								let remaining=getPlayerRemainingChips(bet.seat,currentRound)
								if(remaining<minRaise){
									raiseBtn.textContent=`加注(籌碼不足)`
									raiseBtn.disabled=true
									raiseBtn.classList.add("opacity-50","cursor-not-allowed")
									raiseBtn.classList.remove("hover:bg-red-700")
								}else{
									raiseBtn.textContent=`加注(最少$${minRaise})`
								}
							}

							let allinBtn=tr.querySelector("[data-action='allin']")
							if(allinBtn){
								let remaining=getPlayerRemainingChips(bet.seat,currentRound)
								allinBtn.textContent=`全下 $${remaining}`
							}
						},0)
					}
				}

				tbody.appendChild(tr)
			})

			tbody.querySelectorAll(".action-btn").forEach(function(btn){
				btn.addEventListener("click",handleActionButtonClick)
			})

			tbody.querySelectorAll(".raise-input").forEach(function(input){
				input.addEventListener("input",handleRaiseInputChange)
			})

			tbody.querySelectorAll(".undo-btn").forEach(function(btn){
				btn.addEventListener("click",handleUndoClick)
			})

			tbody.querySelectorAll(".confirm-raise-btn").forEach(function(btn){
				btn.addEventListener("click",handleConfirmRaise)
			})

			tbody.querySelectorAll(".cancel-raise-btn").forEach(function(btn){
				btn.addEventListener("click",handleCancelRaise)
			})

            onchange(".timebank",function(element,event){
                bittingdata[currentRound][dataset(element,"i")]["timebank"]=parseInt(element.value)||0

                weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
            })
		}

		function handleConfirmRaise(event){
			let btn=event.target
			let seat=parseInt(btn.dataset.seat)
			let currentRound=getCurrentBettingRound()

			let raiseIndex=-1
			for(let i=bittingdata[currentRound].length-1;i >= 0;i--){
				if(bittingdata[currentRound][i].seat==seat&&bittingdata[currentRound][i].action=="raise"){
					raiseIndex=i
					break
				}
			}

			if(raiseIndex==-1) return

			let raiseAmount=parseInt(bittingdata[currentRound][raiseIndex].chip)||0
			let minRaise=getMinRaiseAmount(seat,currentRound)
			let remaining=getPlayerRemainingChips(seat,currentRound)

			if(raiseAmount<minRaise){
				alert(`加注金額不足！最小加注: $${minRaise}`)
				return
			}else if(raiseAmount>remaining){
				alert(`籌碼不足！剩餘籌碼: ${remaining}`)
				return
			}else{
				delete bittingdata[currentRound][raiseIndex].isEditing

				handleRaiseAction(currentRound,seat)

				weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
				renderBettingTable()
				checkNextStepAvailability()
			}
		}

		function handleCancelRaise(event){
			let btn=event.target
			let seat=parseInt(btn.dataset.seat)
			let currentRound=getCurrentBettingRound()

			let raiseIndex=-1
			for(let i=bittingdata[currentRound].length-1;i >= 0;i--){
				if(bittingdata[currentRound][i].seat==seat&&bittingdata[currentRound][i].action=="raise"){
					raiseIndex=i
					break
				}
			}

			if(raiseIndex==-1) return

			bittingdata[currentRound][raiseIndex].action=""
			bittingdata[currentRound][raiseIndex].chip=0
			delete bittingdata[currentRound][raiseIndex].isEditing

			weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
			renderBettingTable()
		}

		function handleUndoClick(event){
			let btn=event.target
			let seat=parseInt(btn.dataset.seat)
			let currentRound=getCurrentBettingRound()

			let lastActionIndex=-1
			for(let i=bittingdata[currentRound].length-1;i >= 0;i--){
				if(bittingdata[currentRound][i].seat==seat &&
					bittingdata[currentRound][i].action!="" &&
					bittingdata[currentRound][i].action!="blind" &&
					bittingdata[currentRound][i].action!="ante"){
					lastActionIndex=i
					break
				}
			}

			if(lastActionIndex==-1) return

			bittingdata[currentRound][lastActionIndex].action=""
			bittingdata[currentRound][lastActionIndex].chip=0

			for(let i=lastActionIndex+1;i<bittingdata[currentRound].length;i++){
				if(bittingdata[currentRound][i].action!="blind" &&
					bittingdata[currentRound][i].action!="ante"){
					bittingdata[currentRound][i].action=""
					bittingdata[currentRound][i].chip=0
				}
			}

			weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
			renderBettingTable()
		}

		function handleActionButtonClick(event){
			let btn=event.target
			let tr=btn.closest("tr")
			let seat=parseInt(tr.dataset.seat)
			let index=parseInt(tr.dataset.index)
			let action=btn.dataset.action
			let currentRound=getCurrentBettingRound()

			if(action=="check"){
				if(!canCheck(seat,currentRound)){
					alert("現在不能過牌，需要跟注或加注")
					return
				}
			}

			if(action=="call"){
				let callAmount=getCallAmount(seat,currentRound)
				if(callAmount==0&&canCheck(seat,currentRound)){
					alert("請使用過牌")
					return
				}
			}

			let remaining=getPlayerRemainingChips(seat,currentRound)
			if(action=="raise"){
				let minRaise=getMinRaiseAmount(seat,currentRound)
				if(remaining<minRaise){
					alert(`籌碼不足，無法加注。剩餘籌碼: ${remaining}，最小加注: ${minRaise}`)
					return
				}
			}

			for(let i=index+1;i<bittingdata[currentRound].length;i++){
				if(bittingdata[currentRound][i].action!="blind"&&bittingdata[currentRound][i].action!="ante"){
					bittingdata[currentRound][i].action=""
					bittingdata[currentRound][i].chip=0
				}
			}

			bittingdata[currentRound][index].action=action

			if(action=="raise"){
				let minRaise=getMinRaiseAmount(seat,currentRound)
				bittingdata[currentRound][index].chip=minRaise
				bittingdata[currentRound][index].isEditing=true
			}else if(action=="call"){
				let callAmount=getCallAmount(seat,currentRound)
				bittingdata[currentRound][index].chip=callAmount
			}else if(action=="allin"){
				bittingdata[currentRound][index].chip=remaining

				// 如果全下金額大於當前最高注，需要讓其他玩家重新行動
				let currentMaxBet=getCurrentRoundMaxBet(currentRound)
				let playerCurrentBet=getPlayerCurrentRoundBet(seat,currentRound)
				let totalBet=playerCurrentBet+remaining

				if(totalBet>currentMaxBet){
					handleRaiseAction(currentRound,seat)
				}
			}else{
				bittingdata[currentRound][index].chip=0
			}

			if(action=="raise"){
				weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
				renderBettingTable()
				let minRaise=getMinRaiseAmount(seat,currentRound)
				showCustomKeyboard(seat, currentRound, minRaise)
			}else{
				weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
				renderBettingTable()
				checkNextStepAvailability()
			}
		}

		function handleRaiseInputChange(event){
			let input=event.target
			let seat=parseInt(input.dataset.seat)
			let currentRound=getCurrentBettingRound()
			let value=parseInt(input.value)||0

			let minRaise=getMinRaiseAmount(seat,currentRound)
			let remaining=getPlayerRemainingChips(seat,currentRound)

			if(value>remaining){
				input.value=remaining
				value=remaining
			}

			for(let i=0;i<bittingdata[currentRound].length;i++){
				if(bittingdata[currentRound][i].seat==seat&&bittingdata[currentRound][i].action=="raise"){
					bittingdata[currentRound][i].chip=value
					break
				}
			}

			weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
		}

		function checkNextStepAvailability(){
			let nextBtn=document.getElementById("nextstep")
			if(!nextBtn) return

			let currentRound=getCurrentBettingRound()

			if(isRoundComplete(currentRound)){
				nextBtn.disabled=false
				nextBtn.classList.remove("opacity-50","cursor-not-allowed")
				nextBtn.classList.add("hover:bg-emerald-600")
			}else{
				nextBtn.disabled=true
				nextBtn.classList.add("opacity-50","cursor-not-allowed")
				nextBtn.classList.remove("hover:bg-emerald-600")
			}
		}

		function getCurrentBettingRound(){
			if(step==2) return "preflop"
			if(step==4) return "flop"
			if(step==6) return "turn"
			if(step==8) return "river"
			return "preflop"
		}

		// ==================== 開牌功能 ====================
        function renderShowdown(){
            let content=document.getElementById("showdown-content")
            if(!content){
                content=document.createElement("div")
                content.id="showdown-content"
                content.className="hidden"
                document.querySelector(".max-w-3xl").appendChild(content)
            }

            content.classList.remove("hidden")
            document.getElementById("setting").classList.add("hidden")
            document.getElementById("step-content").classList.add("hidden")
            if(document.getElementById("betting-content")){
                document.getElementById("betting-content").classList.add("hidden")
            }
            if(document.getElementById("board-content")){
                document.getElementById("board-content").classList.add("hidden")
            }

            content.innerHTML=`
                <div class="mb-4">
                    <label class="block mb-2 text-zinc-300 text-xl font-bold">開牌</label>
                    <div class="text-sm text-zinc-400 mb-4">* 點擊玩家選擇手牌，未選擇視為蓋牌</div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm bg-zinc-800 rounded-lg overflow-hidden">
                            <thead>
                                <tr class="bg-zinc-700 text-zinc-300">
                                    <th class="py-2 px-2">座位</th>
                                    <th class="py-2 px-2">玩家</th>
                                    <th class="py-2 px-2">手牌</th>
                                    <th class="py-2 px-2">獲勝</th>
                                    <th class="py-2 px-2">獲利金額</th>
                                    <th class="py-2 px-2">操作</th>
                                </tr>
                            </thead>
                            <tbody id="showdown-table-body">
                            </tbody>
                        </table>
                    </div>
                </div>
                <textarea class="w-full bg-zinc-700 text-white px-3 py-2 rounded h-32 mb-4" id="ps" placeholder="其他紀錄..."></textarea>
                <div class="text-red-500 text-center my-2" id="error"></div>
                <div class="flex justify-end gap-2">
                    <button type="button" class="bg-zinc-600 hover:bg-zinc-700 px-6 py-2 rounded text-lg font-bold" id="back-to-river">返回</button>
                    <button type="button" class="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded text-lg font-bold" id="completehand">完成手牌</button>
                </div>
            `

            let tbody=document.getElementById("showdown-table-body")

            // 計算總底池
            function calculateTotalPot(){
                let totalPot=0
                let rounds=["preflop","flop","turn","river"]

                rounds.forEach(function(round){
                    if(bittingdata[round]){
                        bittingdata[round].forEach(function(bet){
                            totalPot += parseInt(bet.chip)||0
                        })
                    }
                })

                return totalPot
            }

            // 自動計算每個玩家的獎金
            function autoCalculateWinnings(){
                let checkedWinners=document.querySelectorAll('input[name="winnercheckbox"]:checked')
                let winnerCount=checkedWinners.length

                if(winnerCount==0){
                    // 沒有勾選獲勝者，清空所有獎金
                    document.querySelectorAll('.winner-amount').forEach(function(input){
                        input.value=0
                    })
                    return
                }

                let totalPot=calculateTotalPot()
                let baseAmount=Math.floor(totalPot/winnerCount)
                let remainder=totalPot % winnerCount

                // 按座位順序分配（先手優先獲得餘數）
                let sortedWinners=[]
                checkedWinners.forEach(function(checkbox){
                    sortedWinners.push({
                        seat: parseInt(checkbox.dataset.id),
                        checkbox: checkbox
                    })
                })
                sortedWinners.sort((a,b) => a.seat-b.seat)

                // 清空所有玩家的獎金
                document.querySelectorAll('.winner-amount').forEach(function(input){
                    input.value=0
                })

                // 分配獎金給獲勝者
                sortedWinners.forEach(function(winner,index){
                    let amount=baseAmount
                    // 前 remainder 個獲勝者多得一個最小籌碼單位
                    if(index<remainder){
                        amount += parseInt(minchip)
                    }

                    let input=document.querySelector(`.winner-amount[data-seat="${winner.seat}"]`)
                    if(input){
                        input.value=amount
                        winnerprice[winner.seat]=amount
                    }
                })
            }

            for(let i=0;i<seatinglist.length;i=i+1){
                if(seatinglist[i]!=null&&seatinglist[i]!=false){
                    if(i==selfseating){
                        let tr=document.createElement("tr")
                        tr.className="bg-zinc-800"
                        tr.dataset.seat=i

                        let carddisplay=""
                        if(handcard["shown"]||(handcard["card1"]&&handcard["card2"])){
                            carddisplay=`<span class="inline-block bg-emerald-700 px-2 py-1 rounded">${handcard["card1"]}</span> <span class="inline-block bg-emerald-700 px-2 py-1 rounded">${handcard["card2"]}</span>`
                        }else{
                            carddisplay=`<span class="text-zinc-500">蓋牌</span>`
                        }

                        tr.innerHTML=`
                            <td class="py-2 px-2">${i}</td>
                            <td class="py-2 px-2">${seatinglist[i]["name"]}</td>
                            <td class="py-2 px-2" id="card-display-${i}">${carddisplay}</td>
                            <td class="py-2 px-2">
                                <div class="flex align-center justify-center">
                                    <input type="checkbox" class="w-4 h-4 winner-checkbox" name="winnercheckbox" data-id="${i}" ${winner[i]?'checked':''}>
                                </div>
                            </td>
                            <td class="py-2 px-2">
                                <div class="flex align-center justify-center">
                                    <input type="number" class="winner-amount bg-zinc-700 text-white px-2 py-1 rounded w-24" data-seat="${i}" value="${winnerprice[i]||0}" min="0">
                                </div>
                            </td>
                            <td class="py-2 px-2"></td>
                        `

                        tbody.appendChild(tr)
                    }else{
                        let cards=showdowndata[i]||{ card1: "",card2: "",shown: false }

                        let tr=document.createElement("tr")
                        tr.className="bg-zinc-800"
                        tr.dataset.seat=i

                        let carddisplay=""
                        if(cards["shown"]||(cards["card1"]&&cards["card2"])){
                            carddisplay=`<span class="inline-block bg-emerald-700 px-2 py-1 rounded">${cards["card1"]}</span> <span class="inline-block bg-emerald-700 px-2 py-1 rounded">${cards["card2"]==""?"?":cards["card2"]}</span>`
                        }else{
                            carddisplay=`<span class="text-zinc-500">蓋牌</span>`
                        }

                        tr.innerHTML=`
                            <td class="py-2 px-2">${i}</td>
                            <td class="py-2 px-2">${seatinglist[i]["name"]}</td>
                            <td class="py-2 px-2" id="card-display-${i}">${carddisplay}</td>
                            <td class="py-2 px-2">
                                <div class="flex align-center justify-center">
                                    <input type="checkbox" class="w-4 h-4 winner-checkbox" name="winnercheckbox" data-id="${i}" ${winner[i]?'checked':''}>
                                </div>
                            </td>
                            <td class="py-2 px-2">
                                <div class="flex align-center justify-center">
                                    <input type="number" class="winner-amount bg-zinc-700 text-white px-2 py-1 rounded w-24" data-seat="${i}" value="${winnerprice[i]||0}" min="0">
                                </div>
                            </td>
                            <td class="py-2 px-2">
                                <button class="select-cards-btn bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs" data-seat="${i}">選擇手牌</button>
                                ${cards.shown?`<button class="muck-cards-btn bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs ml-1" data-seat="${i}">蓋牌</button>`:''}
                            </td>
                        `

                        tbody.appendChild(tr)
                    }
                }
            }

            // 綁定獲勝checkbox事件
            tbody.querySelectorAll(".winner-checkbox").forEach(function(checkbox){
                checkbox.addEventListener("change",function(){
                    let seat=parseInt(this.dataset.id)

                    if(this.checked){
                        winner[seat]=true
                    }else{
                        winner[seat]=false
                        // 取消勾選時清空該玩家的獎金
                        let input=document.querySelector(`.winner-amount[data-seat="${seat}"]`)
                        if(input){
                            input.value=0
                        }
                    }

                    autoCalculateWinnings()
                    weblsset(WEBLSNAME+"winner",str(winner))
                    weblsset(WEBLSNAME+"winnerprice",str(winnerprice))
                })
            })

            // 綁定獎金輸入框事件
            tbody.querySelectorAll(".winner-amount").forEach(function(input){
                input.addEventListener("change",function(){
                    console.log("in")
                    let seat=parseInt(this.dataset.seat)
                    let amount=parseInt(this.value)||0

                    // 確保金額不為負
                    if(amount<0){
                        this.value=0
                        amount=0
                    }

                    winnerprice[seat]=amount
                    weblsset(WEBLSNAME+"winnerprice",str(winnerprice))
                })
            })

            tbody.querySelectorAll(".select-cards-btn").forEach(function(btn){
                btn.addEventListener("click",function(){
                    let seat=parseInt(this.dataset.seat)
                    showCardSelectionModal(seat)
                })
            })

            tbody.querySelectorAll(".muck-cards-btn").forEach(function(btn){
                btn.addEventListener("click",function(){
                    let seat=parseInt(this.dataset.seat)
                    showdowndata[seat]={ card1: "",card2: "",shown: false }
                    weblsset(WEBLSNAME+"showdowndata",str(showdowndata))
                    renderShowdown()
                })
            })

            document.getElementById("back-to-river").addEventListener("click",function(){
                step=8
                updateStep()
            })

            onclick("#completehand",function(element,event){
                let pot=getpot("river")

                // 驗證至少有一位獲勝者
                let hasWinner=false
                for(let seat in winner){
                    if(winner[seat]&&winner[seat]>0){
                        hasWinner=true
                        break
                    }
                }

                if(!hasWinner){
                    innertext("#error","請至少選擇一位獲勝者並設定獲利金額",false)
                    return
                }

                ajax("POST",AJAXURL+"/newhead/"+tableid,function(event,data){
                    if(data["success"]){
                        alert("手牌記錄完成！")
                        clearlocalstorage()
                        href("table.html?id="+tableid+"#2")
                    }else{
                        innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
                    }
                },str({
                    "dealerseat": int(dealerseat),
                    "selfseating": int(selfseating),
                    "handcard": handcard,
                    "boardcard": boardcard,
                    "bittingdata": bittingdata,
                    "seatinglist": seatinglist,
                    "showdowndata": showdowndata,
                    "winner": winner,
                    "winnerprice": winnerprice,
                    "ps": getvalue("ps"),
                    "totalpot": pot[0],
                    "positionpot": pot[1]
                }),[
                    ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
                ])
            })
        }

		function showCardSelectionModal(seat){
			let modal=document.createElement("div")
			modal.id="card-selection-modal"
			modal.className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
			modal.style.overflowY="auto"

			let playerName=seatinglist[seat].name
			let currentCards=showdowndata[seat] ||{ card1: "",card2: "",shown: false }

			let usedCards=[]
			if(boardcard.flop){
				boardcard.flop.forEach(function(c){
					if(c) usedCards.push(c)
				})
			}
			if(boardcard.turn) usedCards.push(boardcard.turn)
			if(boardcard.river) usedCards.push(boardcard.river)

			for(let s in showdowndata){
				if(parseInt(s)!=seat&&showdowndata[s].shown){
					if(showdowndata[s].card1) usedCards.push(showdowndata[s].card1)
					if(showdowndata[s].card2) usedCards.push(showdowndata[s].card2)
				}
			}

			if(parseInt(selfseating)==seat){
				if(handcard.card1) usedCards.push(handcard.card1)
				if(handcard.card2) usedCards.push(handcard.card2)
			}else{
				if(handcard.card1) usedCards.push(handcard.card1)
				if(handcard.card2) usedCards.push(handcard.card2)
			}

			modal.innerHTML=`
                <div class="bg-zinc-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-4 flex justify-between items-center">
                        <h2 class="text-xl font-bold">${playerName}(座位 ${seat})-選擇手牌</h2>
                        <button class="close-modal text-zinc-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    <div class="p-4">
                        <div class="mb-4">
                            <div class="text-sm text-zinc-400 mb-2">已選擇的牌:</div>
                            <div class="flex gap-2">
                                <span class="inline-block bg-zinc-700 px-3 py-2 rounded" id="modal-selected-card1">${currentCards.card1||"?"}</span>
                                <span class="inline-block bg-zinc-700 px-3 py-2 rounded" id="modal-selected-card2">${currentCards.card2||"?"}</span>
                            </div>
                        </div>
                        <div id="modal-card-picker"></div>
                        <div class="mt-4 flex justify-end gap-2">
                            <button class="cancel-selection bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">取消</button>
                            <button class="confirm-selection bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">確認</button>
                        </div>
                    </div>
                </div>
            `

			document.body.appendChild(modal)

			let selectedCards=[]
			if(parseInt(selfseating)==seat){
				if(handcard.card1&&handcard.card2){
					selectedCards=[handcard.card1,handcard.card2]
					currentCards.card1=handcard.card1
					currentCards.card2=handcard.card2
				}
			}else if(currentCards.card1&&currentCards.card2){
				selectedCards=[currentCards.card1,currentCards.card2]
			}

			renderCardPicker({
				containerId: "modal-card-picker",
				selectedArr: selectedCards,
				max: 2,
				onChange: function(arr){
					currentCards.card1=arr[0]||""
					currentCards.card2=arr[1]||""
					document.getElementById("modal-selected-card1").textContent=currentCards.card1||"?"
					document.getElementById("modal-selected-card2").textContent=currentCards.card2||"?"
				},
				disabledList: usedCards.filter(c => c!=currentCards.card1&&c!=currentCards.card2)
			})

			document.getElementById("modal-selected-card1").textContent=currentCards.card1||"?"
			document.getElementById("modal-selected-card2").textContent=currentCards.card2||"?"

			modal.querySelector(".close-modal").addEventListener("click",function(){
				document.body.removeChild(modal)
			})

			modal.querySelector(".cancel-selection").addEventListener("click",function(){
				document.body.removeChild(modal)
			})

			modal.querySelector(".confirm-selection").addEventListener("click",function(){
				// if(!currentCards.card1||!currentCards.card2){
				// 	alert("請選擇2張手牌")
				// 	return
				// }

				currentCards.shown=true
				showdowndata[seat]=currentCards
				weblsset(WEBLSNAME+"showdowndata",str(showdowndata))

				document.body.removeChild(modal)
				renderShowdown()
			})

			modal.addEventListener("click",function(e){
				if(e.target==modal){
					document.body.removeChild(modal)
				}
			})
		}

		// ==================== 牌面選擇 ====================

		function renderCardPicker({ containerId,selectedArr,max,onChange,disabledList=[] }){
			let suits=[
				{ k: "s",sym: "♠",color: "#90caf9" },
				{ k: "h",sym: "♥",color: "#f48fb1" },
				{ k: "d",sym: "♦",color: "#ffd54f" },
				{ k: "c",sym: "♣",color: "#a5d6a7" }
			]
			let ranks=["A","K","Q","J","T","9","8","7","6","5","4","3","2"]
			let picker=document.getElementById(containerId)
			if(!picker) return

			picker.innerHTML=""
			picker.className="grid gap-1"

			for(let i=0;i<suits.length;i=i+1){
				let suit=suits[i]
				let row=document.createElement("div")
				row.className="flex gap-1 flex-wrap items-center justify-center"

				for(let j=0;j<ranks.length;j++){
					let rank=ranks[j]
					let cardKey=rank+suit.k
					let btn=document.createElement("button")
					btn.type="button"
					btn.className="card-btn relative w-[6.5%] max-w-[30px] h-[40px] bg-zinc-800 hover:bg-zinc-700 rounded flex flex-col items-center justify-center overflow-hidden transition-all"
					btn.innerHTML=`
                        <span class="z-10 text-2xl text-stone-200 font-bold">${rank}</span>
                        <span class="card-suit absolute right-[-15px] text-5xl" style="color:${suit.color}">${suit.sym}</span>
                    `
					btn.dataset.card=cardKey

					if(selectedArr.indexOf(cardKey)!=-1){
						btn.classList.add("ring-2","ring-emerald-400","bg-emerald-700")
					}

					if(disabledList.indexOf(cardKey)!=-1){
						btn.disabled=true
						btn.classList.add("opacity-30","cursor-not-allowed")
					}

					btn.onclick=function(){
						if(btn.disabled) return

						if(selectedArr.indexOf(cardKey)!=-1){
							let idx=selectedArr.indexOf(cardKey)
							selectedArr.splice(idx,1)
							btn.classList.remove("ring-2","ring-emerald-400","bg-emerald-700")
						}else{
							if(selectedArr.length<max){
								selectedArr.push(cardKey)
								btn.classList.add("ring-2","ring-emerald-400","bg-emerald-700")
							}else{
								alert(`最多只能選擇 ${max}張牌`)
								return
							}
						}

						onChange&&onChange(selectedArr.slice())
					}

					row.appendChild(btn)
				}
				picker.appendChild(row)
			}
		}

		function updateCardDisplay(){
			document.getElementById("selected-card1").textContent=handcard.card1||"?"
			document.getElementById("selected-card2").textContent=handcard.card2||"?"

			if(handcard.card1&&handcard.card2){
				weblsset(WEBLSNAME+"handcard",str(handcard))
			}
		}

		function getAllSelectedCards(){
			let res=[]
			if(handcard.card1) res.push(handcard.card1)
			if(handcard.card2) res.push(handcard.card2)
			if(boardcard.flop){
				boardcard.flop.forEach(function(c){
					if(c) res.push(c)
				})
			}
			if(boardcard.turn) res.push(boardcard.turn)
			if(boardcard.river) res.push(boardcard.river)
			return res
		}

		function showBoardSelect(type,count){
			let boardContent=document.getElementById("board-content")
			let area=document.getElementById("board-cards-area")
			let label=document.getElementById("board-label")

			if(!boardContent||!area||!label) return

			boardContent.classList.remove("hidden")
			document.getElementById("setting").classList.add("hidden")
			document.getElementById("step-content").classList.add("hidden")
			if(document.getElementById("betting-content")){
				document.getElementById("betting-content").classList.add("hidden")
			}

			if(type=="flop"){
				label.textContent="選擇翻牌（3張）"
			}else if(type=="turn"){
				label.textContent="選擇轉牌（1張）"
			}else{
				label.textContent="選擇河牌（1張）"
			}

			let used=getAllSelectedCards()
			let boardSel=[]

			if(type=="flop"){
				boardSel =(boardcard.flop&&boardcard.flop.filter(Boolean))||[]
				boardSel.forEach(function(card){
					let idx=used.indexOf(card)
					if(idx!=-1) used.splice(idx,1)
				})
			}else if(type=="turn"){
				boardSel=boardcard.turn ? [boardcard.turn] : []
				if(boardcard.turn){
					let idx=used.indexOf(boardcard.turn)
					if(idx!=-1) used.splice(idx,1)
				}
			}else if(type=="river"){
				boardSel=boardcard.river ? [boardcard.river] : []
				if(boardcard.river){
					let idx=used.indexOf(boardcard.river)
					if(idx!=-1) used.splice(idx,1)
				}
			}

			renderCardPicker({
				"containerId": "board-cards-area",
				"selectedArr": boardSel,
				"max": count,
				"onChange": function(arr){
					if(type=="flop"){
						boardcard.flop=arr.length==3 ? arr : arr.concat([null,null,null]).slice(0,3)
					}else if(type=="turn"){
						boardcard.turn=arr[0]||null
					}else if(type=="river"){
						boardcard.river=arr[0]||null
					}

					document.getElementById("selected-board").textContent=arr.join(" ")||"未選擇"
					weblsset(WEBLSNAME+"boardcard",str(boardcard))
				},
				"disabledList": used
			})

			document.getElementById("selected-board").textContent=boardSel.join(" ")||"未選擇"
		}

		// ==================== 步驟控制 ====================

		function updateStep(){
			document.querySelectorAll(".step-btn").forEach(function(btn,idx){
				if(idx==step){
					btn.classList.add("bg-emerald-500","text-white")
					btn.classList.remove("bg-zinc-700")
				}else{
					btn.classList.remove("bg-emerald-500","text-white")
					btn.classList.add("bg-zinc-700")
				}
			})

			document.getElementById("setting").classList.add("hidden")
			document.getElementById("step-content").classList.add("hidden")
			if(document.getElementById("betting-content")){
				document.getElementById("betting-content").classList.add("hidden")
			}
			if(document.getElementById("board-content")){
				document.getElementById("board-content").classList.add("hidden")
			}
			if(document.getElementById("showdown-content")){
				document.getElementById("showdown-content").classList.add("hidden")
			}

			if(step==0){
				renderSettingTable()
			}else if(step==1){
				document.getElementById("step-content").classList.remove("hidden")
				renderHandCardPicker()
			}else if(step==2||step==4||step==6||step==8){
				if(document.getElementById("betting-content")){
					document.getElementById("betting-content").classList.remove("hidden")
					renderBettingTable()
					checkNextStepAvailability()
				}
			}else if(step==3){
				showBoardSelect("flop",3)
			}else if(step==5){
				showBoardSelect("turn",1)
			}else if(step==7){
				showBoardSelect("river",1)
			}else if(step==9){
				renderShowdown()
			}

			weblsset(WEBLSNAME+"step",step)
		}

		function renderSettingTable(){
			document.getElementById("setting").classList.remove("hidden")
			let tbody=document.getElementById("settingtable")
			if(!tbody) return

			tbody.innerHTML=""

			for(let i=1;i<seatinglist.length;i++){
				let hasPlayer=seatinglist[i]&&seatinglist[i]!=false
				let playerName=hasPlayer ? seatinglist[i].name : ""
				let playerChip=hasPlayer ? seatinglist[i].chip : ""

				let tr=document.createElement("tr")
				tr.className="bg-zinc-800 text-zinc-300"
				tr.innerHTML=`
                    <td class="py-2 px-2">${i}</td>
                    <td class="py-2 px-2">
                        <div class="flex items-center justify-center">
                            <input type="checkbox" class="haveseat w-4 h-4 cursor-pointer" data-seat="${i}" ${hasPlayer ? "checked" : ""}>
                        </div>
                    </td>
                    <td class="py-2 px-2">
                        <input type="text" class="playername bg-zinc-600 text-white rounded px-2 py-1 text-xs w-full" data-seat="${i}" value="${playerName}">
                    </td>
                    <td class="py-2 px-2">
                        <input type="number" class="chipcount bg-zinc-600 text-white rounded px-2 py-1 text-xs w-full" data-seat="${i}" value="${playerChip}">
                    </td>
                    <td class="py-2 px-2">
                        <div class="flex items-center justify-center">
                            <input type="checkbox" class="bannedbutton w-4 h-4 cursor-pointer" data-seat="${i}" ${seatinglist[i]["banned"] ? "checked" : ""}>
                        </div>
                    </td>
                    <td class="py-2 px-2">
                        <div class="flex items-center justify-center">
                            <input type="radio" name="dealer" class="w-4 h-4 cursor-pointer" data-seat="${i}" ${parseInt(dealerseat)==i ? "checked" : ""}>
                        </div>
                    </td>
                    <td class="py-2 px-2">
                        <div class="flex items-center justify-center">
                            <input type="radio" name="hero" class="w-4 h-4 cursor-pointer" data-seat="${i}" ${parseInt(selfseating)==i ? "checked" : ""}>
                        </div>
                    </td>
                `
				tbody.appendChild(tr)
			}

			tbody.querySelectorAll(".haveseat").forEach(function(cb){
				cb.addEventListener("change",function(){
					let seat=parseInt(this.dataset.seat)
					let nameInput=tbody.querySelector(`.playername[data-seat="${seat}"]`)
					let chipInput=tbody.querySelector(`.chipcount[data-seat="${seat}"]`)

					if(this.checked){
						if(!nameInput.value) nameInput.value="玩家"+seat
						if(!chipInput.value) chipInput.value=startchip

						seatinglist[seat] ={
							name: nameInput.value,
							chip: parseInt(chipInput.value)||0
						}
					}else{
						seatinglist[seat]=false
						nameInput.value=""
						chipInput.value=""
					}

					weblsset(WEBLSNAME+"seatinglist",str(seatinglist))
				})
			})

			tbody.querySelectorAll(".playername").forEach(function(input){
				input.addEventListener("change",function(){
					let seat=parseInt(this.dataset.seat)
					let cb=tbody.querySelector(`.haveseat[data-seat="${seat}"]`)

					if(!cb.checked){
						cb.checked=true
						let chipInput=tbody.querySelector(`.chipcount[data-seat="${seat}"]`)
						if(!chipInput.value) chipInput.value=startchip
					}

					if(!seatinglist[seat]) seatinglist[seat] ={}
					seatinglist[seat].name=this.value
					seatinglist[seat].chip=parseInt(tbody.querySelector(`.chipcount[data-seat="${seat}"]`).value)||0

					weblsset(WEBLSNAME+"seatinglist",str(seatinglist))
				})
			})

			tbody.querySelectorAll(".bannedbutton").forEach(function(input){
				input.addEventListener("change",function(){
					let seat=parseInt(this.dataset.seat)

                    seatinglist[seat].banned=this.checked

					weblsset(WEBLSNAME+"seatinglist",str(seatinglist))
				})
			})

			tbody.querySelectorAll(".chipcount").forEach(function(input){
				input.addEventListener("change",function(){
					let seat=parseInt(this.dataset.seat)
					let cb=tbody.querySelector(`.haveseat[data-seat="${seat}"]`)

					if(!cb.checked){
						cb.checked=true
						let nameInput=tbody.querySelector(`.playername[data-seat="${seat}"]`)
						if(!nameInput.value) nameInput.value="玩家"+seat
					}

					if(!seatinglist[seat]) seatinglist[seat] ={}
					seatinglist[seat].chip=parseInt(this.value)||0
					seatinglist[seat].name=tbody.querySelector(`.playername[data-seat="${seat}"]`).value

					weblsset(WEBLSNAME+"seatinglist",str(seatinglist))
				})
			})

			tbody.querySelectorAll('input[name="dealer"]').forEach(function(radio){
				radio.addEventListener("change",function(){
					if(this.checked){
						dealerseat=parseInt(this.dataset.seat)
						weblsset(WEBLSNAME+"dealerseat",dealerseat)
					}
				})
			})

			tbody.querySelectorAll('input[name="hero"]').forEach(function(radio){
				radio.addEventListener("change",function(){
					if(this.checked){
						selfseating=parseInt(this.dataset.seat)
						weblsset(WEBLSNAME+"selfseating",selfseating)
					}
				})
			})
		}

		function renderHandCardPicker(){
			let disabledCards=[]
			if(boardcard.flop){
				boardcard.flop.forEach(function(c){
					if(c) disabledCards.push(c)
				})
			}
			if(boardcard.turn) disabledCards.push(boardcard.turn)
			if(boardcard.river) disabledCards.push(boardcard.river)

			renderCardPicker({
				containerId: "card-picker",
				selectedArr: [handcard.card1,handcard.card2].filter(Boolean),
				max: 2,
				onChange: function(arr){
					handcard.card1=arr[0]||""
					handcard.card2=arr[1]||""
					updateCardDisplay()
				},
				disabledList: disabledCards
			})

			updateCardDisplay()
		}

		// ==================== 初始化 ====================

		document.querySelectorAll(".step-btn").forEach(function(btn,idx){
			btn.addEventListener("click",function(){
				step=idx
				updateStep()
			})
		})

		onclick("#nextstep",function(element,event){
			if(step==0){
				let playerCount=0
				for(let i=1;i<seatinglist.length;i++){
					if(seatinglist[i]&&seatinglist[i]!=false){
						playerCount++
					}
				}
				if(playerCount<2){
					alert("至少需要2位玩家")
					return
				}
				if(!dealerseat){
					alert("請選擇莊家位置")
					return
				}
				if(!selfseating){
					alert("請選擇HERO位置")
					return
				}
			}else if(step==1){
				if(!handcard.card1||!handcard.card2){
					alert("請選擇2張手牌")
					return
				}
			}else if(step==3){
				if(!boardcard.flop||boardcard.flop.filter(Boolean).length!=3){
					alert("請選擇3張翻牌")
					return
				}
			}else if(step==5){
				if(!boardcard.turn){
					alert("請選擇1張轉牌")
					return
				}
			}else if(step==7){
				if(!boardcard.river){
					alert("請選擇1張河牌")
					return
				}
			}else if(step==2||step==4||step==6||step==8){
				let currentRound=getCurrentBettingRound()
				if(!isRoundComplete(currentRound)){
					alert("請完成所有玩家的下注動作")
					return
				}
			}

			if(step<9){
				step=step+1
				updateStep()
			}
		})

		updateStep()
	}else{
		alert("查無指定場次")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])