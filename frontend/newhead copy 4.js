let id=getget("tableid")
let timezone="+00:00"

if(!weblsget(WEBLSNAME+"signin")){
    href("signin.html")
}

function clearlocalstorage(){
    weblsset(WEBLSNAME+"lastdealer",null)
    weblsset(WEBLSNAME+"selfseating",null)
    weblsset(WEBLSNAME+"step",null)
    weblsset(WEBLSNAME+"handcard",null)
    weblsset(WEBLSNAME+"boardcard",null)
    weblsset(WEBLSNAME+"bittingdata",null)
    weblsset(WEBLSNAME+"seatinglist",null)
    weblsset(WEBLSNAME+"showdowndata",null)
    weblsset(WEBLSNAME+"winner",null)
}

ajax("GET",AJAXURL+"gettable/"+id,function(event,data){
    if(data["success"]){
        let row=data["data"]

        let startchip="20000"
        let lastdealer=weblsget(WEBLSNAME+"lastdealer")??row["lastdealer"]
        let selfseating=weblsget(WEBLSNAME+"selfseating")??row["selfseating"]
        let seating=row["seating"]
        let smallblind=parseInt(row["smallblind"])||0
        let bigblind=parseInt(row["bigblind"])||0
        let bigblindante=parseInt(row["bigblindante"])||0
        let ante=parseInt(row["ante"])||0
        let step=int(weblsget(WEBLSNAME+"step")??0)
        let handcard=json(weblsget(WEBLSNAME+"handcard")??{ "card1": "","card2": "" })
        let boardcard=json(weblsget(WEBLSNAME+"boardcard")??{ "flop": [null,null,null],"turn": null,"river": null })
        let bittingdata=json(weblsget(WEBLSNAME+"bittingdata"))??{ "preflop": [],"flop": [],"turn": [],"river": [] }
        let seatinglist=json(weblsget(WEBLSNAME+"seatinglist"))??[null]
        let showdowndata=json(weblsget(WEBLSNAME+"showdowndata"))??{}
        let winner=json(weblsget(WEBLSNAME+"winner"))??[null]

        let smallblindseat=-1
        let bigblindseat=-1
        let seatcount=0

        // 初始化座位列表
        if(seatinglist.length==1){
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
            for(let i=1;i<seatinglist.length;i=i+1){
                if(seatinglist[i]&&seatinglist[i]!=false){
                    seatcount=seatcount+1
                }
            }
        }

        // ==================== 核心功能函數 ====================

        // 獲取玩家剩餘籌碼
        function getPlayerRemainingChips(seat,currentRound){
            let player=seatinglist[seat]
            if(player){
                let totalBet=0
                let rounds=["preflop","flop","turn","river"]
                let currentIndex=rounds.indexOf(currentRound)

                for(let i=0;i <= currentIndex;i=i+1){
                    let round=rounds[i]
                    if(bittingdata[round]){
                        bittingdata[round].forEach(function(bet){
                            if(bet.seat==seat&&bet.action!="ante"){
                                totalBet += parseInt(bet.chip)||0
                            }
                        })
                    }
                }

                return parseInt(player.chip)-totalBet
            }else{
                return 0
            }
        }

        // 獲取當前回合玩家已下注金額
        function getPlayerCurrentRoundBet(seat,currentRound){
            let total=0
            if(bittingdata[currentRound]){
                bittingdata[currentRound].forEach(function(bet){
                    if(bet.seat==seat&&bet.action!="ante"){
                        total=total+parseInt(bet.chip)||0
                    }
                })
            }
            return total
        }

        // 獲取當前回合最高下注金額
        function getCurrentRoundMaxBet(currentRound){
            let playermaxbet=new Map()

            if(bittingdata[currentRound]){
                bittingdata[currentRound].forEach(function(bet){
                    if(bet.action!="ante"){
                        let current=playermaxbet.get(bet.seat)||0
                        playermaxbet.set(bet.seat,current+(parseInt(bet.chip)||0))
                    }
                })
            }

            let maxbet=0
            playermaxbet.forEach(function(total){
                if(maxbet<total){
                    maxbet=total
                }
            })

            // 如果是preflop且沒有人加注，最高下注是大盲
            if(currentRound=="preflop"&&maxbet==0){
                maxbet=bigblind
            }

            return maxbet
        }

        // 獲取上一次加注差額（用於計算最小加注）
        function getLastRaiseAmount(currentRound){
            let allBets=[]

            if(bittingdata[currentRound]){
                let playerTotalBets=new Map()

                bittingdata[currentRound].forEach(function(bet){
                    if(bet.action=="raise"||bet.action=="allin"||bet.action=="blind"){
                        let current=playerTotalBets.get(bet.seat)||0
                        let newTotal=current+(parseInt(bet.chip)||0)
                        playerTotalBets.set(bet.seat,newTotal)

                        if(bet.action=="raise"||(bet.action=="allin"&&newTotal > getCurrentRoundMaxBet(currentRound))){
                            allBets.push({ total: newTotal,action: bet.action })
                        }
                    }
                })
            }

            // 如果沒有加注記錄
            if(allBets.length==0){
                return bigblind
            }

            // 如果只有一次加注（從大盲開始）
            if(allBets.length==1){
                if(currentRound=="preflop"){
                    return allBets[0].total-bigblind
                }else{
                    return allBets[0].total
                }
            }

            // 如果有多次加注，計算最後一次的加注差額
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

            // 最小加注=當前最高下注+上次加注差額
            let minTotalBet=currentMaxBet+lastRaiseAmount

            // 玩家需要再下注的金額=最小加注總額-玩家已下注金額
            let minRaiseChip=minTotalBet-playerCurrentBet

            // 確保最小加注至少是大盲
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

            for(let i=0;i<bittingdata[currentRound].length;i=i+1){
                let bet=bittingdata[currentRound][i]
                if(bet.seat==seat&&bet.action&&bet.action!=""&&bet.action!="blind"&&bet.action!="ante"){
                    return true
                }
            }
            return false
        }

        // 獲取上一回合存活玩家
        function getPreviousRoundactiveplayer(currentRound){
            let rounds=["preflop","flop","turn","river"]
            let currentIndex=rounds.indexOf(currentRound)
            if(currentIndex <= 0) return new Set()

            let prevRound=rounds[currentIndex-1]
            let activeplayer=new Set()

            if(bittingdata[prevRound]){
                let lastActions=new Map()
                bittingdata[prevRound].forEach(function(bet){
                    lastActions.set(bet.seat,bet.action)
                })

                lastActions.forEach(function(action,seat){
                    if(action!="fold"){
                        activeplayer.add(seat)
                    }
                })
            }

            return activeplayer
        }

        // 初始化翻牌前下注
        function initializePreflopBetting(){
            if(bittingdata["preflop"]&&bittingdata["preflop"].length > 0){
                bittingdata["preflop"].forEach(function(bet){
                    if(bet.isSB) smallblindseat=bet.seat
                    if(bet.isBB) bigblindseat=bet.seat
                })
                return
            }

            bittingdata["preflop"]=[]
            let totalSeats=seatinglist.length-1
            let activeplayer=[]

            for(let i=1;i <= totalSeats;i=i+1){
                if(seatinglist[i]&&seatinglist[i]!=false){
                    activeplayer.push(i)
                }
            }

            if(activeplayer.length<2) return

            let dealerIdx=activeplayer.indexOf(parseInt(lastdealer))
            if(dealerIdx==-1) dealerIdx=0

            let orderedPlayers=[]
            for(let i=1;i <= activeplayer.length;i=i+1){
                let idx=(dealerIdx+i) % activeplayer.length
                orderedPlayers.push(activeplayer[idx])
            }

            smallblindseat=orderedPlayers[0]
            bigblindseat=orderedPlayers[1]

            if(ante > 0){
                orderedPlayers.forEach(function(seat){
                    bittingdata["preflop"].push({
                        seat: seat,
                        name: seatinglist[seat].name,
                        action: "ante",
                        chip: ante
                    })
                })
            }

            bittingdata["preflop"].push({
                seat: smallblindseat,
                name: seatinglist[smallblindseat].name,
                action: "blind",
                chip: smallblind,
                isBlind: true,
                isSB: true
            })

            if(bigblindante > 0){
                bittingdata["preflop"].push({
                    seat: bigblindseat,
                    name: seatinglist[bigblindseat].name,
                    action: "ante",
                    chip: bigblindante,
                    isBlind: true,
                    isBB: true
                })
            }

            bittingdata["preflop"].push({
                seat: bigblindseat,
                name: seatinglist[bigblindseat].name,
                action: "blind",
                chip: bigblind,
                isBlind: true,
                isBB: true
            })

            for(let i=2;i<orderedPlayers.length;i=i+1){
                bittingdata["preflop"].push({
                    seat: orderedPlayers[i],
                    name: seatinglist[orderedPlayers[i]].name,
                    action: "",
                    chip: 0
                })
            }

            bittingdata["preflop"].push({
                seat: smallblindseat,
                name: seatinglist[smallblindseat].name,
                action: "",
                chip: 0
            })

            bittingdata["preflop"].push({
                seat: bigblindseat,
                name: seatinglist[bigblindseat].name,
                action: "",
                chip: 0
            })

            weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
        }

        // 初始化其他回合的下注
        function initializeRoundBetting(currentRound){
            if(bittingdata[currentRound]&&bittingdata[currentRound].length > 0){
                return
            }

            let activeplayer=getPreviousRoundactiveplayer(currentRound)
            if(activeplayer.size==0) return

            bittingdata[currentRound]=[]

            let totalSeats=seatinglist.length-1
            let activeList=[]

            for(let offset=0;offset<totalSeats;offset++){
                let seat=(smallblindseat+offset-1) % totalSeats+1
                if(activeplayer.has(seat)){
                    activeList.push(seat)
                }
            }

            activeList.forEach(function(seat){
                bittingdata[currentRound].push({
                    seat: seat,
                    name: seatinglist[seat].name,
                    action: "",
                    chip: 0
                })
            })

            weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
        }

        // 處理加注後的邏輯-修正版
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

            // 計算加注者的總下注
            let raiserTotalBet=0
            for(let i=0;i <= raiserIndex;i=i+1){
                if(bittingdata[currentRound][i].seat==raiserSeat&&bittingdata[currentRound][i].action!="ante"){
                    raiserTotalBet += parseInt(bittingdata[currentRound][i].chip)||0
                }
            }

            // 找出所有在加注前已行動但未棄牌的玩家
            let playersNeedAction=new Set()
            let playerLastActionIndex=new Map()

            for(let i=0;i<raiserIndex;i=i+1){
                let bet=bittingdata[currentRound][i]
                if(bet.action!="ante"){
                    if(bet.action=="fold"){
                        // 已棄牌的玩家不需要再行動
                        playersNeedAction.delete(bet.seat)
                    }else{
                        // 記錄玩家最後的行動索引
                        playersNeedAction.add(bet.seat)
                        playerLastActionIndex.set(bet.seat,i)
                    }
                }
            }

            // 移除加注者自己
            playersNeedAction.delete(raiserSeat)

            // 檢查每個玩家的總下注
            let playersToAdd=[]
            playersNeedAction.forEach(function(seat){
                let playerTotalBet=0
                for(let i=0;i<bittingdata[currentRound].length;i=i+1){
                    if(bittingdata[currentRound][i].seat==seat&&bittingdata[currentRound][i].action!="ante"){
                        playerTotalBet += parseInt(bittingdata[currentRound][i].chip)||0
                    }
                }

                // 如果玩家的總下注小於加注者的總下注，需要再行動
                if(playerTotalBet<raiserTotalBet){
                    // 檢查是否已經在加注後有行動記錄
                    let hasActionAfterRaise=false
                    for(let i=raiserIndex+1;i<bittingdata[currentRound].length;i=i+1){
                        if(bittingdata[currentRound][i].seat==seat){
                            hasActionAfterRaise=true
                            break
                        }
                    }

                    if(!hasActionAfterRaise){
                        playersToAdd.push(seat)
                    }
                }
            })

            // 按照座位順序添加需要行動的玩家
            let totalSeats=seatinglist.length-1
            let orderedSeats=[]

            // 從加注者的下一個座位開始
            for(let offset=1;offset <= totalSeats;offset++){
                let seat=(raiserSeat+offset-1) % totalSeats+1
                if(playersToAdd.indexOf(seat)!=-1){
                    orderedSeats.push(seat)
                }
            }

            // 添加到下注記錄
            orderedSeats.forEach(function(seat){
                bittingdata[currentRound].push({
                    seat: seat,
                    name: seatinglist[seat].name,
                    action: "",
                    chip: 0
                })
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

            let activeplayer=[]
            playerLastAction.forEach(function(action,seat){
                if(action!="fold"){
                    activeplayer.push(seat)
                }
            })

            if(activeplayer.length==0) return false
            if(activeplayer.length==1) return true

            // 檢查所有玩家是否都已行動
            for(let i=0;i<activeplayer.length;i=i+1){
                let seat=activeplayer[i]
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
                    if(bet > maxBet) maxBet=bet
                }
            })

            // 檢查所有非全下玩家的下注是否相等
            for(let i=0;i<activeplayer.length;i=i+1){
                let seat=activeplayer[i]
                if(!allInPlayers.has(seat)){
                    let bet=playerTotalBet.get(seat)||0
                    if(bet!=maxBet) return false
                }
            }

            return true
        }

        // 獲取所有存活玩家（未棄牌）
        function getactiveplayer(){
            let activeplayer=[]
            let rounds=["preflop","flop","turn","river"]

            for(let i=1;i<seatinglist.length;i=i+1){
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
                    activeplayer.push({
                        "seat": i,
                        "name": seatinglist[i].name,
                        "chip": getPlayerRemainingChips(i,"river")
                    })
                }
            }

            return activeplayer
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
                        <td class="py-2 px-2">$${bet.chip}<span class="text-xs text-zinc-500">(剩餘: $${remaining})</span></td>
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
                            <div class="flex flex-wrap gap-1 items-center">
                                ${canAct?`
                                    <button class="action-btn bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs" data-action="raise">加注</button>
                                    <button class="action-btn bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs" data-action="call">跟注</button>
                                    <button class="action-btn bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs" data-action="fold">棄牌</button>
                                    <button class="action-btn bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs" data-action="check">過牌</button>
                                    <button class="action-btn bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs" data-action="allin">全下</button>
                                `:isRaising?`
                                    <span class="${actionColor} font-semibold">${actionText}</span>
                                    <button class="confirm-raise-btn bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded text-xs" data-seat="${bet.seat}">確認</button>
                                    <button class="cancel-raise-btn bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs" data-seat="${bet.seat}">取消</button>
                                `:`
                                    <span class="${actionColor} font-semibold">${actionText}</span>
                                    ${hasActed?`<button class="undo-btn bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs ml-2" data-seat="${bet.seat}">反悔</button>`:''}
                                `}
                            </div>
                        </td>
                        <td class="py-2 px-2">
                            ${isRaising?`
                                <input type="number" class="raise-input bg-zinc-700 text-white px-2 py-1 rounded w-24" value="${chipText}" data-seat="${bet.seat}">
                            `:`
                                <span>$${chipText}</span>
                            `}
                            <div class="text-xs text-zinc-500 mt-1">剩餘: $${remaining}</div>
                        </td>
                    `

                    if(canAct){
                        setTimeout(function(){
                            let checkBtn=tr.querySelector('[data-action="check"]')
                            let canCheckNow=canCheck(bet.seat,currentRound)
                            if(checkBtn){
                                if(!canCheckNow){
                                    checkBtn.disabled=true
                                    checkBtn.classList.add("opacity-50","cursor-not-allowed")
                                    checkBtn.classList.remove("hover:bg-blue-700")
                                }
                            }

                            let callBtn=tr.querySelector('[data-action="call"]')
                            if(callBtn){
                                let callAmount=getCallAmount(bet.seat,currentRound)
                                if(callAmount==0&&canCheckNow){
                                    callBtn.disabled=true
                                    callBtn.classList.add("opacity-50","cursor-not-allowed")
                                    callBtn.classList.remove("hover:bg-green-700")
                                    callBtn.textContent="跟注"
                                }else if(callAmount > 0){
                                    callBtn.textContent=`跟注 $${callAmount}`
                                }else{
                                    callBtn.textContent="跟注"
                                }
                            }

                            let raiseBtn=tr.querySelector('[data-action="raise"]')
                            if(raiseBtn){
                                let minRaise=getMinRaiseAmount(bet.seat,currentRound)
                                let remaining=getPlayerRemainingChips(bet.seat,currentRound)
                                if(remaining<minRaise){
                                    raiseBtn.textContent=`加注(籌碼不足)`
                                    raiseBtn.disabled=true
                                    raiseBtn.classList.add("opacity-50","cursor-not-allowed")
                                    raiseBtn.classList.remove("hover:bg-red-700")
                                }else{
                                    raiseBtn.textContent=`加注(最少${minRaise})`
                                }
                            }

                            let allinBtn=tr.querySelector('[data-action="allin"]')
                            if(allinBtn){
                                let remaining=getPlayerRemainingChips(bet.seat,currentRound)
                                allinBtn.textContent=`全下 ${remaining}`
                            }
                        },0)
                    }
                }

                tbody.appendChild(tr)
            })

            onclick(tbody.querySelectorAll(".action-btn"),function(element,event){
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

                // 檢查是否有玩家被越位（在當前玩家之前還有待行動的玩家）
                let skippedPlayers=[]
                for(let i=0;i<index;i=i+1){
                    let bet=bittingdata[currentRound][i]
                    if(bet.action==""&&bet.action!="blind"&&bet.action!="ante"){
                        skippedPlayers.push({
                            seat: bet.seat,
                            name: bet.name,
                            index: i
                        })
                    }
                }

                // 如果有被越位的玩家，自動棄牌
                if(skippedPlayers.length > 0){
                    // 將被越位的玩家設為棄牌
                    skippedPlayers.forEach(function(player){
                        bittingdata[currentRound][player.index].action="fold"
                        bittingdata[currentRound][player.index].chip=0
                    })
                }

                // 清除當前玩家之後的所有行動
                for(let i=index+1;i<bittingdata[currentRound].length;i=i+1){
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
                    let playerTotalBet=playerCurrentBet+remaining

                    if(playerTotalBet > currentMaxBet){
                        handleRaiseAction(currentRound,seat)
                    }
                }else{
                    bittingdata[currentRound][index].chip=0
                }

                // 只有非加注動作才處理後續邏輯
                if(action=="raise"){
                    // 加注需要等待確認
                    weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
                    renderBettingTable()
                }else{
                    weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
                    renderBettingTable()
                    checkNextStepAvailability()
                }
            })

            oninput(tbody.querySelectorAll(".raise-input"),function(element,event){
                let input=event.target
                let seat=parseInt(input.dataset.seat)
                let currentRound=getCurrentBettingRound()
                let value=parseInt(input.value)||0

                let minRaise=getMinRaiseAmount(seat,currentRound)
                let remaining=getPlayerRemainingChips(seat,currentRound)

                if(value > remaining){
                    input.value=remaining
                    value=remaining
                }

                // 找到對應的記錄並更新
                for(let i=0;i<bittingdata[currentRound].length;i=i+1){
                    if(bittingdata[currentRound][i].seat==seat&&bittingdata[currentRound][i].action=="raise"){
                        bittingdata[currentRound][i].chip=value
                        break
                    }
                }

                weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
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
                alert(`加注金額不足！最小加注: ${minRaise}`)
                return
            }

            if(raiseAmount > remaining){
                alert(`籌碼不足！剩餘籌碼: ${remaining}`)
                return
            }

            // 確認加注，移除編輯狀態
            delete bittingdata[currentRound][raiseIndex].isEditing

            handleRaiseAction(currentRound,seat)

            weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
            renderBettingTable()
            checkNextStepAvailability()
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

            // 取消加注，重置為待行動
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

            // 清除該玩家之後所有的行動記錄
            let toRemove=[]
            for(let i=lastActionIndex+1;i<bittingdata[currentRound].length;i=i+1){
                if(bittingdata[currentRound][i].action!="blind" &&
                    bittingdata[currentRound][i].action!="ante"){
                    bittingdata[currentRound][i].action=""
                    bittingdata[currentRound][i].chip=0
                }
            }

            weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
            renderBettingTable()
            checkNextStepAvailability()
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
                // 創建開牌區域
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

            let activeplayer=getactiveplayer()

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
                                    <th class="py-2 px-2">獲勝玩家</th>
                                    <th class="py-2 px-2">操作</th>
                                </tr>
                            </thead>
                            <tbody id="showdown-table-body">
                            </tbody>
                        </table>
                    </div>
                </div>
			    <div class="text-red-500 text-center my-2" id="error"></div>
                <div class="flex justify-end gap-2">
                    <button type="button" class="bg-zinc-600 hover:bg-zinc-700 px-6 py-2 rounded text-lg font-bold" id="back-to-river">返回</button>
                    <button type="button" class="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded text-lg font-bold" id="completehand">完成手牌</button>
                </div>
            `

            let tbody=document.getElementById("showdown-table-body")

            for(let i=0;i<seatinglist.length;i=i+1){
                if(seatinglist[i]!=null&&seatinglist[i]!=false){
                    if(i==selfseating){
                        let cards=handcard

                        let tr=document.createElement("tr")
                        tr.className="bg-zinc-800"
                        tr.dataset.seat=i

                        let carddisplay=""
                        if(handcard["card1"]&&handcard["card2"]){
                            carddisplay=`<span class="inline-block bg-emerald-700 px-2 py-1 rounded">${handcard["card1"]}</span> <span class="inline-block bg-emerald-700 px-2 py-1 rounded">${handcard["card2"]}</span>`
                        }else if(handcard["shown"]){
                            carddisplay=`<span class="text-zinc-500">未設定</span>`
                        }else{
                            carddisplay=`<span class="text-zinc-500">蓋牌</span>`
                        }

                        tr.innerHTML=`
                            <td class="py-2 px-2">${i}</td>
                            <td class="py-2 px-2">${seatinglist[i]["name"]}</td>
                            <td class="py-2 px-2" id="card-display-${i}">${carddisplay}</td>
                            <td class="py-2 px-2">
                                <div class="flex align-center justify-center">
                                    <input type="checkbox" class="w-4 h-4" name="winnercheckbox" data-id="${i}" ${winner[i]?'checked':''}>
                                <div>
                            </td>
                            <td class="py-2 px-2"></td>
                        `

                        tbody.appendChild(tr)
                    }else{
                        let cards=showdowndata[i]||{ card1: "",card2: "",shown: false }

                        let tr=document.createElement("tr")
                        tr.className="bg-zinc-800"
                        tr.dataset.seat=i

                        let cardDisplay=""
                        if(cards.shown&&cards.card1&&cards.card2){
                            cardDisplay=`<span class="inline-block bg-emerald-700 px-2 py-1 rounded">${cards.card1}</span> <span class="inline-block bg-emerald-700 px-2 py-1 rounded">${cards.card2}</span>`
                        }else if(cards.shown){
                            cardDisplay=`<span class="text-zinc-500">未設定</span>`
                        }else{
                            cardDisplay=`<span class="text-zinc-500">蓋牌</span>`
                        }

                        tr.innerHTML=`
                            <td class="py-2 px-2">${i}</td>
                            <td class="py-2 px-2">${seatinglist[i]["name"]}</td>
                            <td class="py-2 px-2" id="card-display-${i}">${cardDisplay}</td>
                            <td class="py-2 px-2">
                                <div class="flex align-center justify-center">
                                    <input type="checkbox" class="w-4 h-4" name="winnercheckbox" data-id="${i}" ${winner[i]?'checked':''}>
                                <div>
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
            // seatinglist.forEach(function(player){
            //     if(!player["heroed"]){
            //     }
            // })

            onchange("input[name='winnercheckbox']",function(element,event){
                winner[dataset(element,"id")]=!winner[dataset(element,"id")]
                weblsset(WEBLSNAME+"winner",str(winner))
            })

            // 綁定事件
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
				ajax("POST",AJAXURL+"/newcustomer",function(event,data){
					if(data["success"]){
                        alert("手牌記錄完成！")
                        // clearlocalstorage()
                        href("table.html?id="+id)
					}else{
                        innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
                        domgetid("submit").disabled=false
					}
				},str({
					"name": name,
					"phone": phone,
					"address": address
				}),[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				])
            })
        }

        function showCardSelectionModal(seat){
            // 創建燈箱
            let modal=document.createElement("div")
            modal.id="card-selection-modal"
            modal.className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            modal.style.overflowY="auto"

            let playerName=seatinglist[seat].name
            let currentCards=showdowndata[seat] ||{ card1: "",card2: "",shown: false }

            // 獲取所有已使用的牌
            let usedCards=[]
            if(boardcard.flop){
                boardcard.flop.forEach(function(c){
                    if(c) usedCards.push(c)
                })
            }
            if(boardcard.turn) usedCards.push(boardcard.turn)
            if(boardcard.river) usedCards.push(boardcard.river)

            // 其他玩家的牌
            for(let s in showdowndata){
                if(parseInt(s)!=seat&&showdowndata[s].shown){
                    if(showdowndata[s].card1) usedCards.push(showdowndata[s].card1)
                    if(showdowndata[s].card2) usedCards.push(showdowndata[s].card2)
                }
            }

            // Hero的手牌
            if(parseInt(selfseating)==seat){
                if(handcard.card1) usedCards.push(handcard.card1)
                if(handcard.card2) usedCards.push(handcard.card2)
            }else{
                // 不是Hero，排除Hero的牌
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

            // 如果是Hero，自動使用已記錄的手牌
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

            // 更新顯示
            document.getElementById("modal-selected-card1").textContent=currentCards.card1||"?"
            document.getElementById("modal-selected-card2").textContent=currentCards.card2||"?"

            // 綁定關閉事件
            modal.querySelector(".close-modal").addEventListener("click",function(){
                document.body.removeChild(modal)
            })

            modal.querySelector(".cancel-selection").addEventListener("click",function(){
                document.body.removeChild(modal)
            })

            modal.querySelector(".confirm-selection").addEventListener("click",function(){
                if(!currentCards.card1||!currentCards.card2){
                    alert("請選擇2張手牌")
                    return
                }

                currentCards.shown=true
                showdowndata[seat]=currentCards
                weblsset(WEBLSNAME+"showdowndata",str(showdowndata))

                document.body.removeChild(modal)
                renderShowdown()
            })

            // 點擊背景關閉
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
                row.className="flex gap-1 flex-wrap"

                for(let i=0;i<ranks.length;i=i+1){
                    let rank=ranks[i]
                    let cardKey=rank+suit.k
                    let btn=document.createElement("button")
                    btn.type="button"
                    btn.className="card-btn relative w-[32px] h-[40px] bg-zinc-800 hover:bg-zinc-700 rounded flex flex-col items-center justify-center overflow-hidden transition-all"
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
                boardSel=(boardcard.flop&&boardcard.flop.filter(Boolean))||[]
                boardSel.forEach(function(card){
                    let idx=used.indexOf(card)
                    if(idx!=-1) used.splice(idx,1)
                })
            }else if(type=="turn"){
                boardSel=boardcard.turn?[boardcard.turn]:[]
                if(boardcard.turn){
                    let idx=used.indexOf(boardcard.turn)
                    if(idx!=-1) used.splice(idx,1)
                }
            }else if(type=="river"){
                boardSel=boardcard.river?[boardcard.river]:[]
                if(boardcard.river){
                    let idx=used.indexOf(boardcard.river)
                    if(idx!=-1) used.splice(idx,1)
                }
            }

            renderCardPicker({
                containerId: "board-cards-area",
                selectedArr: boardSel,
                max: count,
                onChange: function(arr){
                    if(type=="flop"){
                        boardcard.flop=arr.length==3?arr:arr.concat([null,null,null]).slice(0,3)
                    }else if(type=="turn"){
                        boardcard.turn=arr[0]||null
                    }else if(type=="river"){
                        boardcard.river=arr[0]||null
                    }

                    document.getElementById("selected-board").textContent=arr.join(" ")||"未選擇"
                    weblsset(WEBLSNAME+"boardcard",str(boardcard))
                },
                disabledList: used
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

            for(let i=1;i<seatinglist.length;i=i+1){
                let hasplayer=seatinglist[i]&&seatinglist[i]!=false

                let tr=document.createElement("tr")
                tr.className="bg-zinc-800 text-zinc-300"
                tr.innerHTML=`
                    <td class="py-2 px-2">${i}</td>
                    <td class="py-2 px-2">
                        <div class="flex items-center justify-center">
                            <input type="checkbox" class="haveseat w-4 h-4 cursor-pointer" data-seat="${i}" ${hasplayer?"checked":""}>
                        </div>
                    </td>
                    <td class="py-2 px-2">
                        <input type="text" class="playername bg-zinc-600 text-white rounded px-2 py-1 text-xs w-full" data-seat="${i}" value="${hasplayer?seatinglist[i].name:""}">
                    </td>
                    <td class="py-2 px-2">
                        <input type="number" class="chipcount bg-zinc-600 text-white rounded px-2 py-1 text-xs w-full" data-seat="${i}" value="${hasplayer?seatinglist[i].chip:""}">
                    </td>
                    <td class="py-2 px-2">
                        <div class="flex items-center justify-center">
                            <input type="radio" name="dealer" class="w-4 h-4 cursor-pointer" data-seat="${i}" ${parseInt(lastdealer)==i?"checked":""}>
                        </div>
                    </td>
                    <td class="py-2 px-2">
                        <div class="flex items-center justify-center">
                            <input type="radio" name="hero" class="w-4 h-4 cursor-pointer" data-seat="${i}" ${parseInt(selfseating)==i?"checked":""}>
                        </div>
                    </td>
                `
                tbody.appendChild(tr)
            }

            // 綁定事件
            tbody.querySelectorAll(".haveseat").forEach(function(cb){
                cb.addEventListener("change",function(){
                    let seat=parseInt(this.dataset.seat)
                    let nameInput=tbody.querySelector(`.playername[data-seat="${seat}"]`)
                    let chipInput=tbody.querySelector(`.chipcount[data-seat="${seat}"]`)

                    if(this.checked){
                        if(!nameInput.value) nameInput.value="玩家"+seat
                        if(!chipInput.value) chipInput.value=startchip

                        seatinglist[seat]={
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

                    if(!seatinglist[seat]) seatinglist[seat]={}
                    seatinglist[seat].name=this.value
                    seatinglist[seat].chip=parseInt(tbody.querySelector(`.chipcount[data-seat="${seat}"]`).value)||0

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

                    if(!seatinglist[seat]) seatinglist[seat]={}
                    seatinglist[seat].chip=parseInt(this.value)||0
                    seatinglist[seat].name=tbody.querySelector(`.playername[data-seat="${seat}"]`).value

                    weblsset(WEBLSNAME+"seatinglist",str(seatinglist))
                })
            })

            tbody.querySelectorAll('input[name="dealer"]').forEach(function(radio){
                radio.addEventListener("change",function(){
                    if(this.checked){
                        lastdealer=parseInt(this.dataset.seat)
                        weblsset(WEBLSNAME+"lastdealer",lastdealer)
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

        // 初始化步驟按鈕點擊事件
        document.querySelectorAll(".step-btn").forEach(function(btn,idx){
            btn.addEventListener("click",function(){
                step=idx
                updateStep()
            })
        })

        // 初始化下一步按鈕
        document.querySelectorAll("button").forEach(function(btn){
            if(btn.textContent.includes("下一步")){
                btn.addEventListener("click",function(){
                    // 驗證當前步驟
                    if(step==0){
                        // 驗證設定
                        let playerCount=0
                        for(let i=1;i<seatinglist.length;i=i+1){
                            if(seatinglist[i]&&seatinglist[i]!=false){
                                playerCount++
                            }
                        }
                        if(playerCount<2){
                            alert("至少需要2位玩家")
                            return
                        }
                        if(!lastdealer){
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
            }
        })

        // 啟動
        updateStep()
    }else{
        alert("查無指定場次")
        href("sessionlist.html")
    }
},null,[
    ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])