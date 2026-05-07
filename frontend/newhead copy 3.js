let id=getget("tableid")
let timezone="+00:00"

if(!weblsget(WEBLSNAME+"signin")){
    href("signin.html")
}

ajax("GET",AJAXURL+"gettable/"+id,function(event,data){
    if(data["success"]){
        let row=data["data"]

        let startchip="20000"
        let lastdealer=weblsget(WEBLSNAME+"lastdealer")??row["lastdealer"]
        let selfseating=weblsget(WEBLSNAME+"selfseating")??row["selfseating"]
        let seating=row["seating"]
        let smallblind=row["smallblind"]
        let bigblind=row["bigblind"]
        let bigblindante=row["bigblindante"]
        let ante=row["ante"]
        let step=int(weblsget(WEBLSNAME+"step")??0)
        let cardselect=json(weblsget(WEBLSNAME+"cardselect")??[])
        let handcard=json(weblsget(WEBLSNAME+"handcard")??{ "card1": "","card2": "" })
        let boardcard=json(weblsget(WEBLSNAME+"boardcard")??{ "flop": [null,null,null], "turn": null, "river": null })
        let bittingdata=json(weblsget(WEBLSNAME+"bittingdata"))??{ "preflop": [], "flop": [], "turn": [], "river": [] }
        let seatcount=0
        let seatinglist=json(weblsget(WEBLSNAME+"seatinglist"))??[null]
        let totalpot=0
        let seatpot=[null,0,0,0,0,0,0,0,0,0,0,0]
        let seatsetting={
            2: ["SB","BB"],
            3: ["SB","BB","BTN"],
            4: ["SB","BB","UTG","BTN"],
            5: ["SB","BB","UTG","CO","BTN"],
            6: ["SB","BB","UTG","MP","CO","BTN"],
            7: ["SB","BB","UTG","MP","HJ","CO","BTN"],
            8: ["SB","BB","UTG","MP","MP+1","HJ","CO","BTN"],
            9: ["SB","BB","UTG","UTG+1","MP","MP+1","HJ","CO","BTN"],
            10: ["SB","BB","UTG","UTG+1","UTG+2","MP","MP+1","HJ","CO","BTN"]
        }
        let seat

        // 新增：smallblindseat / bigblindseat 變數（用來在加注時把他們補回尾端）
        let smallblindseat=-1
        let bigblindseat=-1

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

            console.log(totalpot)
            console.log(seatpot)

            return [totalpot,seatpot]
        }
        console.log("bigblind:", row["bigblind"])
        console.log("bigblindante:", row["bigblindante"])
        console.log("ante:", row["ante"])
        console.log("smallblind:", row["smallblind"])
        console.log("bittingdata:", JSON.parse(localStorage.getItem(WEBLSNAME+"bittingdata")))

        console.log("seating data:", seating);
        console.log(getpot("preflop"))
        console.log("seating length:", seating ? seating.length : "seating is undefined");

        if(seatinglist.length==1){
            for(let i=0;i<seating.length-1;i=i+1){
                console.log("Processing seat "+i+":", seating[i])
                if(seating[i] && seating[i]["history"]&&seating[i]["history"].length!=0 && seating[i]["history"][seating[i]["history"].length-1] && seating[i]["history"][seating[i]["history"].length-1]["type"]!="leave"){
                    seatinglist.push({
                        "chip": seating[i]["history"][seating[i]["history"].length-1]["chip"]||seating[i]["chip"]||0,
                        "name": seating[i]["history"][seating[i]["history"].length-1]["player"]
                    })
                    seatcount=seatcount+1
                }else{
                    seatinglist.push(false)
                }
            }
        }

        // 初始化翻牌前下注數據
        console.log(bittingdata)
        if(!bittingdata["preflop"]||bittingdata["preflop"].length==0){
            if(0<ante){
                for(let i=1;i<seatinglist.length;i=i+1){
                    if(seatinglist[i]!=false&&seatinglist[i]!=null){
                        bittingdata["preflop"].push({
                            "seat": i,
                            "name": seatinglist[i]["name"],
                            "action": "blind",
                            "chip": ante,
                            "isBlind": false,
                            "isSB": false
                        })
                    }
                }
            }

            let totalSeats=seatinglist.length-1
            let count=0
            for(let offset=1;offset<=totalSeats;offset=offset+1){
                let seatIndex=((lastdealer+offset-1)%totalSeats)+1
                let player=seatinglist[seatIndex]["name"]
                if(player!=false&&player!=null){
                    if(count==0){
                        bittingdata["preflop"].push({
                            "seat": seatIndex,
                            "name": player,
                            "action": "blind",
                            "chip": (ante==0)?smallblind:(smallblind+ante),
                            "isBlind": true,
                            "isSB": true
                        })
                        // 記錄小盲 seat
                        smallblindseat=seatIndex
                        count=count+1
                    }else if(count==1){
                        if(0<bigblindante){
                            bittingdata["preflop"].push({
                                "seat": seatIndex,
                                "name": player,
                                "action": "ante",
                                "chip": bigblindante,
                                "isBlind": true,
                                "isBB": true
                            })
                        }
                        bittingdata["preflop"].push({
                            "seat": seatIndex,
                            "name": player,
                            "action": "blind",
                            "chip": bigblind,
                            "isBlind": true,
                            "isBB": true
                        })
                        // 記錄大盲 seat
                        bigblindseat=seatIndex
                        count=count+1
                    }else{
                        bittingdata["preflop"].push({
                            "seat": seatIndex,
                            "name": player,
                            "action": "",
                            "chip": (ante==0)?0:ante,
                            "isAnte": (ante!=0)
                        })
                    }
                }
            }

            // ====== 後處理：若有 raise，需把可能還要動作的玩家加到最後面 ======
            let lastRaiserIndex=-1
            for(let i=bittingdata["preflop"].length-1;i>=0;i=i-1){
                if(bittingdata["preflop"][i].action === "raise"){
                    lastRaiserIndex=i
                    break
                }
            }
            if(lastRaiserIndex !== -1){
                for(let i=0;i<lastRaiserIndex;i=i+1){
                    let item=bittingdata["preflop"][i]
                    if(item && item.name != false && item.action !== "fold"){
                        let existsTail=false
                        for(let j=lastRaiserIndex+1;j<bittingdata["preflop"].length;j=j+1){
                            if(bittingdata["preflop"][j] && bittingdata["preflop"][j].seat===item.seat){
                                existsTail=true
                                break
                            }
                        }
                        if(!existsTail){
                            bittingdata["preflop"].push({
                                seat: item.seat,
                                name: item.name,
                                action: "",
                                chip: 0
                            })
                        }
                    }
                }
            }

            // ====== 小盲額外一個 call（放最後面） ======
            if(smallblindseat > 0 && seatinglist[smallblindseat] != false && seatinglist[smallblindseat] != null){
                let tailHasSB=false
                for(let ti=bittingdata["preflop"].length-1;ti>=0 && ti>bittingdata["preflop"].length-4;ti=ti-1){
                    if(bittingdata["preflop"][ti] && bittingdata["preflop"][ti].seat===smallblindseat){
                        tailHasSB=true
                        break
                    }
                }
                if(!tailHasSB){
                    bittingdata["preflop"].push({
                        seat: smallblindseat,
                        name: seatinglist[smallblindseat]["name"],
                        action: "",
                        chip: 0
                    })
                }
            }

            console.log("after post-process", bittingdata)
            weblsset(WEBLSNAME+"bittingdata", str(bittingdata))
        }else{
            // 若 localStorage 有 preflop 資料，嘗試從中找出 sb/bb 座位
            let arrp=bittingdata["preflop"]
            for(let i=0;i<arrp.length;i=i+1){
                if(arrp[i] && arrp[i].isSB) smallblindseat=arrp[i].seat
                if(arrp[i] && arrp[i].isBB) bigblindseat=arrp[i].seat
            }
        }


        function updateCardDisplay(){
            document.getElementById("selected-card1").textContent=handcard.card1||"?"
            document.getElementById("selected-card2").textContent=handcard.card2||"?"
            if(handcard["card1"]!=""&&handcard["card2"]!=""){
                updateStep()
            }
        }
        renderCardPicker({
            containerId: "card-picker",
            selectedArr: [handcard.card1,handcard.card2].filter(Boolean),
            max: 2,
            onChange: function(arr){
                handcard.card1=arr[0]||""
                handcard.card2=arr[1]||""
                updateCardDisplay()
            },
            disabledList: []
        })
        updateCardDisplay()
        function getAllSelectedCards(){
            const res=[]
            if(handcard.card1) res.push(handcard.card1)
            if(handcard.card2) res.push(handcard.card2)
            boardcard.flop.forEach(function(c){ if(c) res.push(c) })
            if(boardcard.turn) res.push(boardcard.turn)
            if(boardcard.river) res.push(boardcard.river)
            return res
        }

        let stepContent=document.getElementById("step-content");
        let bettingContent=document.getElementById("betting-content");
        let stepBtns=document.querySelectorAll(".step-btn");
        let posBtns=document.querySelectorAll(".pos-btn");

        function getPreflopBettingDefault() {
            let seatPos=[]
            if (seatsetting[seatcount]) {
                seatPos=seatsetting[seatcount]
            }
            let sbIdx=seatPos.indexOf("SB")
            let bbIdx=seatPos.indexOf("BB")
            let sbSeat=-1, bbSeat=-1
            if (sbIdx !== -1) sbSeat=(lastdealer+1+sbIdx)%(seatinglist.length-1)
            if (bbIdx !== -1) bbSeat=(lastdealer+1+bbIdx)%(seatinglist.length-1)
            return { sbSeat, bbSeat }
        }

        function saveBettingToLocalStorage() {
            let tbody=document.getElementById("betting-table-body")
            if(!tbody) return
            let rows=Array.prototype.slice.call(tbody.querySelectorAll("tr"))
            let arr=rows.map(function(tr){
                let seat=parseInt(tr.children[0].textContent)||null
                let name=tr.children[1].textContent||null
                let action=tr.dataset.action||""
                let input=tr.querySelector("input")
                let chip=input ? (parseInt(input.value)||0) : 0
                return { seat, name, action, chip }
            })

            let currentRound=getCurrentBettingRound()
            bittingdata[currentRound]=arr
            weblsset(WEBLSNAME+"bittingdata",str(bittingdata))
        }

        function getCurrentBettingRound() {
            if(step === 1) return "preflop"
            if(step === 3) return "flop"
            if(step === 5) return "turn"
            if(step === 7) return "river"
            return "preflop"
        }

        function setDisabledStyle(input,isDisabled){
            if(isDisabled){
                input.disabled=true
                input.classList.add("bg-gray-600","text-gray-300","cursor-not-allowed")
                input.classList.remove("bg-zinc-700","text-white")
            }else{
                input.disabled=false
                input.classList.remove("bg-gray-600","text-gray-300","cursor-not-allowed")
                input.classList.add("bg-zinc-700","text-white")
            }
        }

        function renderBettingTable(){
            let tbody=document.getElementById("betting-table-body")
            if(!tbody) return
            tbody.innerHTML=""
            let rows=[]

            let currentRound=getCurrentBettingRound()

            if(Array.isArray(bittingdata[currentRound]) && bittingdata[currentRound].length>0){
                // 如果不是preflop階段，則需要過濾出未棄牌的玩家
                if(currentRound !== "preflop") {
                    let previousRound = getPreviousRound(currentRound);
                    let activePlayers = new Set();
                    // 先找出前一回合未棄牌的玩家
                    if(previousRound && bittingdata[previousRound]) {
                        bittingdata[previousRound].forEach(function(action) {
                            if(action.action !== "fold") {
                                activePlayers.add(action.seat);
                            }
                        });
                    }
                    // 只保留活躍玩家的記錄
                    rows = bittingdata[currentRound].filter(function(row) {
                        return activePlayers.has(row.seat);
                    });
                } else {
                    rows = bittingdata[currentRound].slice();
                }
            }else{
                if(currentRound === "preflop"){
                    rows=bittingdata["preflop"].slice()
                }else{
                    for(let idx=0;idx<seatinglist.length;idx=idx+1){
                        let p=seatinglist[idx]
                        if(p!=false&&p!=null){
                            let prevRound=getPreviousRound(currentRound)
                            let foldedInPrevRound=false
                            if(prevRound && bittingdata[prevRound]){
                                for(let xi=0;xi<bittingdata[prevRound].length;xi=xi+1){
                                    if(bittingdata[prevRound][xi].seat === idx && bittingdata[prevRound][xi].action === "fold"){
                                        foldedInPrevRound=true
                                        break
                                    }
                                }
                            }
                            if(!foldedInPrevRound){
                                rows.push({seat:idx,name:p["name"],action:"",chip:0})
                            }
                        }
                    }
                    bittingdata[currentRound]=rows.slice()
                }
            }

            console.log("Rendering betting table for "+currentRound, rows)

            for(let rindex=0;rindex<rows.length;rindex=rindex+1){
                let r=rows[rindex]
                let seat=r.seat||""
                let name=r.name||""
                let action=r.action||""
                let chip=(typeof r.chip!=="undefined")?r.chip:""
                let tr=document.createElement("tr")
                tr.dataset.rowIndex=rindex
                // 使用模板字串建立 innerHTML
                if(action=="blind"){
                    tr.innerHTML=`
                        <td>${seat}</td>
                        <td>${name}</td>
                        <td>(下盲注)</td>
                        <td>$<input class="bg-zinc-700 text-white px-2 rounded w-20" type="number" value="${chip}" disabled></td>
                    `
                }else if(action=="ante"){
                    tr.innerHTML=`
                        <td>${seat}</td>
                        <td>${name}</td>
                        <td>(下前注)</td>
                        <td>$<input class="bg-zinc-700 text-white px-2 rounded w-20" type="number" value="${chip}" disabled></td>
                    `
                }else{
                    tr.innerHTML=`
                        <td>${seat}</td>
                        <td>${name}</td>
                        <td>
                            <div class="action-buttons flex gap-1 items-center">
                                <button data-action="raise" class="bg-zinc-700 text-white px-2 py-1 rounded">加注</button>
                                <button data-action="call" class="bg-zinc-700 text-white px-2 py-1 rounded">跟注</button>
                                <button data-action="fold" class="bg-zinc-700 text-white px-2 py-1 rounded">棄牌</button>
                                <button data-action="check" class="bg-zinc-700 text-white px-2 py-1 rounded">過牌</button>
                                <button data-action="allin" class="bg-zinc-700 text-white px-2 py-1 rounded">全下</button>
                            </div>
                        </td>
                        <td>$<input class="bg-zinc-700 text-white px-2 rounded w-20" type="number" value="${chip}" ${(["call","fold","check","allin"].indexOf(action)!==-1)?"disabled":""}></td>
                    `
                }
                tr.dataset.action=action
                tbody.appendChild(tr)

                if(action&&action!="blind"&&action!="ante"){
                    let activeBtn=tr.querySelector("button[data-action='"+action+"']")
                    if(activeBtn){
                        activeBtn.classList.remove("bg-zinc-700")
                        activeBtn.classList.add("bg-emerald-500")
                    }
                }
            }

            // 事件綁定（委派）
            tbody.removeEventListener("click", handleActionClick)
            tbody.addEventListener("click", handleActionClick)

            tbody.removeEventListener("change", handleInputChange)
            tbody.addEventListener("change", handleInputChange)

            let trnodes=tbody.querySelectorAll("tr")
            for(let ti=0;ti<trnodes.length;ti=ti+1){
                updateRowInputState(trnodes[ti])
            }

            saveBettingToLocalStorage()
        }

        function handleActionClick(event){
            if(!event.target.matches("button[data-action]")) return

            let button=event.target
            let tr=button.closest("tr")
            let rowIndex=parseInt(tr.dataset.rowIndex)
            let act=button.dataset.action
            let input=tr.querySelector("input")
            let buttons=tr.querySelectorAll("button[data-action]")

            let currentRound=getCurrentBettingRound()
            let seat=parseInt(tr.children[0].textContent)
            let modelIndex=-1
            // 找最後一筆符合條件的 model index（修正：避免更新到早期的同座位紀錄）
            for(let mi=bittingdata[currentRound].length-1;mi>=0;mi=mi-1){
                if(bittingdata[currentRound][mi] && bittingdata[currentRound][mi].seat===seat && bittingdata[currentRound][mi].name===tr.children[1].textContent){
                    modelIndex=mi
                    break
                }
            }

            // 越位自動 fold（在 modelIndex 之前且沒 action 的玩家）
            if(modelIndex !== -1){
                for(let pi=0;pi<modelIndex;pi=pi+1){
                    let item=bittingdata[currentRound][pi]
                    if(!item) continue
                    if(item.action===""||typeof item.action==="undefined"){
                        if(item.action==="blind"||item.action==="ante") continue
                        item.action="fold"
                        item.chip=0
                    }
                }
            }

            // 重置按鈕顏色
            for(let bi=0;bi<buttons.length;bi=bi+1){
                buttons[bi].classList.remove("bg-emerald-500")
                buttons[bi].classList.add("bg-zinc-700")
            }
            button.classList.remove("bg-zinc-700")
            button.classList.add("bg-emerald-500")
            tr.dataset.action=act

            // 若使用者更改選擇，清除後面的動作（modelIndex+1 ~ end）但保留 blind/ante
            if(modelIndex !== -1){
                for(let ci=modelIndex+1;ci<bittingdata[currentRound].length;ci=ci+1){
                    if(!bittingdata[currentRound][ci]) continue
                    if(bittingdata[currentRound][ci].action==="blind"||bittingdata[currentRound][ci].action==="ante") continue
                    bittingdata[currentRound][ci].action=""
                    bittingdata[currentRound][ci].chip=0
                }
            }

            // 更新 model 中此 index 的 action 與 chip
            if(modelIndex !== -1){
                bittingdata[currentRound][modelIndex].action=act
                if(act==="call"){
                    let callAmount=getCallAmountForSeat(currentRound, seat)
                    // 小盲注特殊處理
                    if(currentRound === "preflop" && seat === smallblindseat) {
                        callAmount = bigblind - smallblind;  // 只需補齊差額
                    }
                    bittingdata[currentRound][modelIndex].chip=callAmount
                }else if(act==="fold"||act==="check"){
                    bittingdata[currentRound][modelIndex].chip=0
                }else if(act==="allin"){
                    let player=seatinglist[seat]
                    bittingdata[currentRound][modelIndex].chip=(player?player.chip:0)
                }else if(act==="raise"){
                    let minRaise=getMinRaiseAmountByModel(currentRound, modelIndex)
                    bittingdata[currentRound][modelIndex].chip=minRaise
                }
            }

            // 若是加注，需把在 raiser 之前且仍在局內的玩家加到尾端（並且確保 sb/bb 也會被加入）
            if(act === "raise" && modelIndex !== -1){
                handleRaiseActionModel(currentRound, modelIndex)
                // 加注時：確保 sb/bb 若仍有在場且未 fold，會被加入尾端
                if(smallblindseat > 0){
                    let sbAlive=false
                    for(let si=0;si<bittingdata[currentRound].length;si=si+1){
                        if(bittingdata[currentRound][si] && bittingdata[currentRound][si].seat===smallblindseat && bittingdata[currentRound][si].action!=="fold"){
                            sbAlive=true
                            break
                        }
                    }
                    if(sbAlive){
                        // 如果尾端沒有 sb，加入
                        let found=false
                        for(let si=bittingdata[currentRound].length-1;si>modelIndex;si=si-1){
                            if(bittingdata[currentRound][si] && bittingdata[currentRound][si].seat===smallblindseat){
                                found=true
                                break
                            }
                        }
                        if(!found){
                            bittingdata[currentRound].push({ seat: smallblindseat, name: seatinglist[smallblindseat]["name"], action: "", chip: 0 })
                        }
                    }
                }
                if(bigblindseat > 0){
                    let bbAlive=false
                    for(let si=0;si<bittingdata[currentRound].length;si=si+1){
                        if(bittingdata[currentRound][si] && bittingdata[currentRound][si].seat===bigblindseat && bittingdata[currentRound][si].action!=="fold"){
                            bbAlive=true
                            break
                        }
                    }
                    if(bbAlive){
                        let found=false
                        for(let si=bittingdata[currentRound].length-1;si>modelIndex;si=si-1){
                            if(bittingdata[currentRound][si] && bittingdata[currentRound][si].seat===bigblindseat){
                                found=true
                                break
                            }
                        }
                        if(!found){
                            bittingdata[currentRound].push({ seat: bigblindseat, name: seatinglist[bigblindseat]["name"], action: "", chip: 0 })
                        }
                    }
                }
            }

            normalizeBittingData(currentRound)
            weblsset(WEBLSNAME+"bittingdata", str(bittingdata))
            renderBettingTable()
        }

        function handleInputChange(event){
            if(!event.target.matches("input")) return
            let input=event.target
            let tr=input.closest("tr")
            let currentRound=getCurrentBettingRound()
            let seat=parseInt(tr.children[0].textContent)
            let modelIndex=-1
            // 改為從後往前找最後一筆符合的 model index（修正同座位多筆時找最後一筆）
            for(let mi=bittingdata[currentRound].length-1;mi>=0;mi=mi-1){
                if(bittingdata[currentRound][mi] && bittingdata[currentRound][mi].seat===seat && bittingdata[currentRound][mi].name===tr.children[1].textContent){
                    modelIndex=mi
                    break
                }
            }

            if(tr.dataset.action === "raise"){
                validateRaiseAmount(input, tr)
                if(modelIndex !== -1){
                    bittingdata[currentRound][modelIndex].chip=parseInt(input.value)||0
                }
            }else if(tr.dataset.action === "call"){
                // call disabled
            }else{
                if(modelIndex !== -1){
                    bittingdata[currentRound][modelIndex].chip=parseInt(input.value)||0
                }
            }

            saveBettingToLocalStorage()
            normalizeBittingData(getCurrentBettingRound())
            renderBettingTable()
        }

        function updateRowInputState(tr){
            let act=tr.dataset.action
            let input=tr.querySelector("input")
            let seat=parseInt(tr.children[0].textContent)
            let player=seatinglist[seat]

            if(act === "raise"){
                setDisabledStyle(input, false)
                let minRaise=getMinRaiseAmount(tr)
                if(parseInt(input.value) < minRaise){
                    input.value=minRaise
                }
            }else if(act === "call"){
                let currentRound=getCurrentBettingRound()
                if(currentRound === "preflop"){
                    let sbSeat=getPreflopBettingDefault().sbSeat
                    if(seat === sbSeat){
                        input.value = Math.max(0, bigblind - smallblind)
                        setDisabledStyle(input, true)
                        return
                    }
                }
                let maxBet=getMaxBetAmount(tr)
                input.value=maxBet
                setDisabledStyle(input, true)
            }else if(act === "allin"){
                input.value=(player?player.chip:0)
                setDisabledStyle(input, true)
            }else if(act === "fold"||act === "check"){
                input.value=0
                setDisabledStyle(input, true)
            }else{
                setDisabledStyle(input, false)
            }
        }

        function getMaxBetAmount(tr){
            let tbody=document.getElementById("betting-table-body")
            let maxBet=0
            let trs=tbody.querySelectorAll("tr")
            for(let i=0;i<trs.length;i=i+1){
                let t=trs[i]
                let act=t.dataset.action
                let input=t.querySelector("input")
                let v=input ? (parseInt(input.value)||0) : 0
                if(act === 'raise'||act === 'allin'){
                    if(v > maxBet) maxBet = v
                }
            }
            if(maxBet === 0) maxBet = bigblind
            return maxBet
        }

        function getMinRaiseAmount(trExclude){
            let tbody=document.getElementById("betting-table-body")
            let maxBet=0
            let trs=tbody.querySelectorAll("tr")
            for(let i=0;i<trs.length;i=i+1){
                let tr=trs[i]
                if(tr === trExclude) continue
                let act=tr.dataset.action
                let input=tr.querySelector("input")
                let v=input ? (parseInt(input.value)||0) : 0
                if(act === 'raise'||act === 'allin'){
                    if(v > maxBet) maxBet = v
                }
            }
            if(maxBet === 0) maxBet = bigblind
            return maxBet + bigblind
        }

        function validateRaiseAmount(input, tr){
            let val=parseInt(input.value)||0
            let minRaise=getMinRaiseAmount(tr)

            if(val < minRaise){
                input.classList.add("border", "border-red-500")
                setTimeout(function(){
                    input.value=minRaise
                    input.classList.remove("border", "border-red-500")
                }, 1000)
            }else{
                input.classList.remove("border", "border-red-500")
            }
        }

        function getMinRaiseAmountByModel(currentRound, modelIndex){
            let arr=bittingdata[currentRound]
            let maxBet=0
            for(let i=0;i<arr.length;i=i+1){
                if(i===modelIndex) continue
                let it=arr[i]
                if(!it) continue
                if(it.action==="raise"||it.action==="allin"){
                    if((parseInt(it.chip)||0) > maxBet) maxBet=parseInt(it.chip)||0
                }
            }
            if(maxBet===0) maxBet=bigblind
            return maxBet + bigblind
        }

        function getCallAmountForSeat(currentRound, seat){
            let highest=0
            let arr=bittingdata[currentRound]||[]
            for(let i=0;i<arr.length;i=i+1){
                if(!arr[i]) continue
                let v=parseInt(arr[i].chip)||0
                if(v>highest) highest=v
            }
            let selfChip=0
            for(let i=0;i<arr.length;i=i+1){
                if(!arr[i]) continue
                if(arr[i].seat===seat){
                    selfChip=parseInt(arr[i].chip)||0
                }
            }
            let callAmt=highest - selfChip
            if(callAmt < 0) callAmt=0
            if(highest === 0) callAmt = bigblind
            return callAmt
        }

        function handleRaiseActionModel(currentRound, raiserIndex){
            let arr = bittingdata[currentRound]
            if(!Array.isArray(arr)) return
            let raiser = arr[raiserIndex]
            if(!raiser) return
            for(let i=0;i<raiserIndex;i=i+1){
                let item = arr[i]
                if(!item) continue
                if(item.action === 'fold'||item.action === 'blind'||item.action === 'ante') continue
                let existsAfter=false
                for(let j=raiserIndex+1;j<arr.length;j=j+1){
                    if(arr[j] && arr[j].seat === item.seat){ existsAfter=true; break }
                }
                if(!existsAfter){
                    arr.push({ seat: item.seat, name: item.name, action: '', chip: 0 })
                }
            }
            bittingdata[currentRound] = arr
            weblsset(WEBLSNAME+"bittingdata", str(bittingdata))
        }

        function normalizeBittingData(currentRound){
            let arr = bittingdata[currentRound]
            if(!Array.isArray(arr)) return
            let bySeat = {}
            let newArr = []
            for(let i=0;i<arr.length;i=i+1){
                let it = arr[i]
                if(!it) continue
                if(!bySeat[it.seat]){
                    bySeat[it.seat] = { firstIndex: i, firstAction: it.action }
                    newArr.push(it)
                }else{
                    let first = bySeat[it.seat]
                    let finalActions = ['call','fold','check','allin']
                    if(first.firstAction && finalActions.indexOf(first.firstAction)!==-1){
                        continue
                    }else{
                        newArr.push(it)
                    }
                }
            }
            bittingdata[currentRound] = newArr
            weblsset(WEBLSNAME+"bittingdata", str(bittingdata))
        }

        function getPreviousRound(currentRound) {
            const rounds=["preflop", "flop", "turn", "river"]
            const currentIndex=rounds.indexOf(currentRound)
            return currentIndex > 0 ? rounds[currentIndex - 1] : null
        }

        function getActivePlayers(round) {
            if (!bittingdata[round] || !Array.isArray(bittingdata[round])) {
                return new Set();
            }

            const activePlayers = new Set();
            const playerLastAction = new Map();

            // 獲取每個玩家最後的動作
            bittingdata[round].forEach(function(action) {
                playerLastAction.set(action.seat, action.action);
            });

            // 檢查哪些玩家還在遊戲中
            playerLastAction.forEach(function(action, seat) {
                if (action !== "fold") {
                    activePlayers.add(seat);
                }
            });

            return activePlayers;
        }

        function updateStep(){
            // 清除舊的下注資料
            if(step > 1) {
                let currentRound = getCurrentBettingRound();
                if(!bittingdata[currentRound]) {
                    bittingdata[currentRound] = [];
                    // 從前一階段複製活躍玩家
                    let previousRound = getPreviousRound(currentRound);
                    if(previousRound && bittingdata[previousRound]) {
                        let activePlayers = new Set();
                        bittingdata[previousRound].forEach(function(action) {
                            if(action.action !== "fold") {
                                activePlayers.add(action.seat);
                            }
                        });
                        // 為活躍玩家創建新的回合記錄
                        activePlayers.forEach(function(seat) {
                            bittingdata[currentRound].push({
                                seat: seat,
                                name: seatinglist[seat].name,
                                action: "",
                                chip: 0
                            });
                        });
                    }
                }
            }

            document.querySelectorAll(".step-btn").forEach(function(btn,idx){
                if(idx==step){
                    btn.classList.add("bg-emerald-500","text-white")
                    btn.classList.remove("bg-zinc-700")
                }else{
                    btn.classList.remove("bg-emerald-500","text-white")
                    btn.classList.add("bg-zinc-700")
                }
            })

            document.getElementById("step-content").classList.add("hidden")
            if(document.getElementById("betting-content")) document.getElementById("betting-content").classList.add("hidden")
            let boardContent=document.getElementById("board-content")
            if(boardContent) boardContent.classList.add("hidden")
            if(step==0){
                removeclass("#setting",["hidden"])
                innerhtml("#settingtable","",false)

                for(let i=1;i<seatinglist.length;i=i+1){
                    if(seatinglist[i]!=false&&seatinglist[i]!=null){
                        innerhtml("#settingtable",`
                            <tr class="bg-zinc-800 text-zinc-300">
                                <td class="py-2 px-2">${i}</td>
                                <td class="py-2 px-2">
                                    <div class="flex items-center justify-center">
                                        <input type="checkbox" class="haveseat text-zinc-600 text-white rounded px-2 py-1 w-4 h-4 cursor-pointer" data-id="${i}" checked>
                                    </div>
                                </td>
                                <td class="py-2 px-2"><input type="text" class="playername bg-zinc-600 text-white rounded px-2 py-1 text-xs w-full" id="playername_${i}" data-id="${i}" value="${seatinglist[i]["name"]}"></td>
                                <td class="py-2 px-2"><input type="text" class="chipcount bg-zinc-600 text-white rounded px-2 py-1 text-xs w-full" id="chipcount_${i}" data-id="${i}" value="${seatinglist[i]["chip"]}"></td>
                                <td class="py-2 px-2">
                                    <div class="flex items-center justify-center">
                                        <input type="radio" class="text-zinc-600 text-white rounded px-2 py-1 w-4 h-4 cursor-pointer" name="dealer" data-id="${i}" ${lastdealer==i?"checked":""}>
                                    </div>
                                </td>
                                <td class="py-2 px-2">
                                    <div class="flex items-center justify-center">
                                        <input type="radio" class="text-zinc-600 text-white rounded px-2 py-1 w-4 h-4 cursor-pointer" name="hero" data-id="${i}" ${selfseating==i?"checked":""}>
                                    </div>
                                </td>
                            </tr>
                        `)
                    }else{
                        innerhtml("#settingtable",`
                            <tr class="bg-zinc-800 text-zinc-300">
                                <td class="py-2 px-2">${i}</td>
                                <td class="py-2 px-2">
                                    <div class="flex items-center justify-center">
                                        <input type="checkbox" class="haveseat text-zinc-600 text-white rounded px-2 py-1 w-4 h-4 cursor-pointer" id="haveseat_${i}" data-id="${i}">
                                    </div>
                                </td>
                                <td class="py-2 px-2"><input type="text" class="playername bg-zinc-600 text-white rounded px-2 py-1 text-xs w-full" id="playername_${i}" data-id="${i}"></td>
                                <td class="py-2 px-2"><input type="text" class="chipcount bg-zinc-600 text-white rounded px-2 py-1 text-xs w-full" id="chipcount_${i}" data-id="${i}"></td>
                                <td class="py-2 px-2">
                                    <div class="flex items-center justify-center">
                                        <input type="radio" class="text-zinc-600 text-white rounded px-2 py-1 w-4 h-4 cursor-pointer" name="dealer" ${lastdealer==i?"checked":""}>
                                    </div>
                                </td>
                                <td class="py-2 px-2">
                                    <div class="flex items-center justify-center">
                                        <input type="radio" class="text-zinc-600 text-white rounded px-2 py-1 w-4 h-4 cursor-pointer" name="hero" ${selfseating==i?"checked":""}>
                                    </div>
                                </td>
                            </tr>
                        `)
                    }
                }

                onchange(".haveseat",function(element,event){
                    let id=dataset(element,"id")
                    if(element.checked){
                        value("#playername_"+id,"玩家"+id)
                        value("#chipcount_"+id,startchip)
                        seatinglist[id]={
                            "chip": startchip,
                            "name": "玩家"+id
                        }
                    }else{
                        value("#playername_"+id,"")
                        value("#chipcount_"+id,"")
                        seatinglist[id]=false
                    }
                    weblsset(WEBLSNAME+"seatinglist",str(seatinglist))
                })

                onchange(".playername",function(element,event){
                    let id=dataset(element,"id")
                    if(domgetid("haveseat_"+id).checked==true){
                        seatinglist[id]["name"]=getvalue(element)[0]
                    }else{
                        domgetid("haveseat_"+id).checked=true
                        value("#chipcount_"+id,startchip)
                        seatinglist[id]={
                            "chip": startchip,
                            "name": getvalue(element)[0]
                        }
                    }
                    weblsset(WEBLSNAME+"seatinglist",str(seatinglist))
                })

                onchange(".chipcount",function(element,event){
                    let id=dataset(element,"id")
                    if(domgetid("haveseat_"+id).checked==true){
                        seatinglist[id]["chip"]=getvalue(element)[0]
                    }else{
                        domgetid("haveseat_"+id).checked=true
                        value("#playername_"+id,"玩家"+id)
                        seatinglist[id]={
                            "chip": getvalue(element)[0],
                            "name": "玩家"+id
                        }
                    }
                    weblsset(WEBLSNAME+"seatinglist",str(seatinglist))
                })

                onchange("input[name='dealer']",function(element,event){
                    let id=dataset(element,"id")
                    lastdealer=id
                    weblsset(WEBLSNAME+"lastdealer",lastdealer)
                })

                onchange("input[name='hero']",function(element,event){
                    let id=dataset(element,"id")
                    selfseating=id
                    weblsset(WEBLSNAME+"selfseating",selfseating)
                })
            }else if(step==1){
                addclass("#setting",["hidden"])
                document.getElementById("step-content").classList.remove("hidden")
                renderCardSelectHighlight && renderCardSelectHighlight()
            }else if([2,4,6,8].indexOf(step)!==-1){
                addclass("#setting",["hidden"])
                if(document.getElementById("betting-content")){
                    document.getElementById("betting-content").classList.remove("hidden")
                    renderBettingTable && renderBettingTable()
                }
            }else if(step==3){
                showBoardSelect && showBoardSelect("flop",3)
            }else if(step==5){
                showBoardSelect && showBoardSelect("turn",1)
            }else if(step==7){
                showBoardSelect && showBoardSelect("river",1)
            }else if(step==9){
                showBoardSelect && showBoardSelect("river",1)
            }
            weblsset(WEBLSNAME+"step",step)
        }

        updateStep()
        document.querySelectorAll(".step-btn").forEach(function(btn,idx){
            btn.addEventListener("click",function(){
                step=idx
                updateStep()
            })
        })
        document.querySelectorAll("button").forEach(function(btn){
            if(btn.textContent.includes("下一步")){
                btn.addEventListener("click",function(){
                    if(step < document.querySelectorAll(".step-btn").length-1){
                        step=step+1
                        updateStep()
                    }
                })
            }
        })

        posBtns.forEach(function(btn){
            btn.addEventListener("click",function(){
                posBtns.forEach(function(b){
                    b.classList.remove("bg-emerald-500")
                    b.classList.add("bg-zinc-700")
                })
                btn.classList.remove("bg-zinc-700")
                btn.classList.add("bg-emerald-500")
                nowseating=this.id.split("_")[1]
                weblsset(WEBLSNAME+"nowseating",nowseating)
            })
        })

        function renderCardSelectHighlight(){
            document.querySelectorAll(".card-rank-btn,.card-suit-btn").forEach(function(btn){
                btn.classList.remove("ring-2","ring-emerald-400","opacity-50")
                btn.style.fontSize=""
                btn.style.minWidth=""
                btn.style.minHeight=""
                btn.style.margin=""
            })
            document.querySelectorAll(".card2-rank-btn,.card2-suit-btn").forEach(function(btn){
                btn.classList.remove("ring-2","ring-emerald-400","opacity-50")
                btn.style.fontSize=""
                btn.style.minWidth=""
                btn.style.minHeight=""
                btn.style.margin=""
            })
            if(window.innerWidth < 640){
                document.querySelectorAll(".card-rank-btn,.card-suit-btn,.card2-rank-btn,.card2-suit-btn").forEach(function(btn){
                    btn.style.fontSize="1.5rem"
                    btn.style.minWidth="2.5rem"
                    btn.style.minHeight="2.5rem"
                    btn.style.margin="0.15rem"
                })
            }
            document.querySelectorAll(".card-rank-btn,.card2-rank-btn").forEach(function(btn){
                btn.disabled=false
                btn.classList.remove("opacity-50")
            })
            document.querySelectorAll(".card-suit-btn,.card2-suit-btn").forEach(function(btn){
                btn.disabled=false
                btn.classList.remove("opacity-50")
            })
            let all=getAllSelectedCards()
        }

        document.querySelectorAll(".card-rank-btn").forEach(function(btn){
            btn.addEventListener("click",function(){
                selectedCard1.rank=this.dataset.card
                updateCardDisplay()
            })
        })
        document.querySelectorAll(".card-suit-btn").forEach(function(btn){
            btn.addEventListener("click",function(){
                selectedCard1.suit=this.dataset.suit
                updateCardDisplay()
            })
        })
        document.querySelectorAll(".card2-rank-btn").forEach(function(btn){
            btn.addEventListener("click",function(){
                selectedCard2.rank=this.dataset.card
                updateCardDisplay()
            })
        })
        document.querySelectorAll(".card2-suit-btn").forEach(function(btn){
            btn.addEventListener("click",function(){
                selectedCard2.suit=this.dataset.suit
                updateCardDisplay()
            })
        })

        function isCardDuplicate(){
            return handcard.card1 && handcard.card2 && handcard.card1==handcard.card2
        }
        document.getElementById("step-content").addEventListener("click",function(){
            if(isCardDuplicate()){
                alert("兩張牌不能重複")
                selectedCard2.rank=""
                selectedCard2.suit=""
                updateCardDisplay()
            }
        })

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
            for(let si=0;si<suits.length;si=si+1){
                let suit=suits[si]
                let row=document.createElement("div")
                row.className="card-row"
                for(let ri=0;ri<ranks.length;ri=ri+1){
                    let rank=ranks[ri]
                    let cardKey=rank+suit.k
                    let btn=document.createElement("button")
                    btn.className="card-btn relative overflow-hidden"
                    btn.innerHTML=`<span class="z-10 text-2xl text-stone-200 font-bold">${rank}</span><span class="card-suit absolute right-[-15px] text-5xl" style="color:${suit.color}">${suit.sym}</span>`
                    btn.dataset.card=cardKey
                    if(selectedArr.indexOf(cardKey)!==-1) btn.classList.add("selected")
                    if(disabledList.indexOf(cardKey)!==-1){
                        btn.disabled=true
                        btn.classList.add("opacity-50")
                    }
                    btn.onclick=function(){
                        if(btn.classList.contains("selected")){
                            let idx=selectedArr.indexOf(cardKey)
                            if(idx > -1) selectedArr.splice(idx,1)
                        }else{
                            if(selectedArr.length < max) selectedArr.push(cardKey)
                        }
                        onChange && onChange(selectedArr.slice())
                        renderCardPicker({ containerId,selectedArr,max,onChange,disabledList })
                        weblsset(WEBLSNAME+"cardselect",str(cardselect))
                        weblsset(WEBLSNAME+"handcard",str(handcard))
                        weblsset(WEBLSNAME+"boardcard",str(boardcard))
                    }
                    row.appendChild(btn)
                }
                picker.appendChild(row)
            }
        }

        updateCardDisplay()

        function showBoardSelect(type,count){
            addclass("#setting",["hidden"])
            let boardContent=document.getElementById("board-content")
            let area=document.getElementById("board-cards-area")
            let label=document.getElementById("board-label")
            boardContent.classList.remove("hidden")
            area.innerHTML=""
            label.textContent=type=="flop"?"選擇翻牌（3張）":type=="turn"?"選擇轉牌（1張）":"選擇河牌（1張）"
            let used=cardselect.slice()
            if(type !== "flop" && boardcard.flop) used=used.concat(boardcard.flop.filter(Boolean))
            if(type !== "turn" && boardcard.turn) used=used.concat([boardcard.turn].filter(Boolean))
            if(type !== "river" && boardcard.river) used=used.concat([boardcard.river].filter(Boolean))
            let boardSel=[]
            if(type=="flop") boardSel=(boardcard.flop && boardcard.flop.filter(Boolean))||[]
            if(type=="turn") boardSel=boardcard.turn?[boardcard.turn]:[]
            if(type=="river") boardSel=boardcard.river?[boardcard.river]:[]
            renderCardPicker({
                containerId: "board-cards-area",
                selectedArr: boardSel,
                max: count,
                onChange: function(arr){
                    let all=used.concat(arr)
                    if(all.length !== new Set(all).size){
                        alert("公共牌不能重複")
                        return
                    }
                    if(type=="flop") boardcard.flop=arr
                    if(type=="turn") boardcard.turn=arr[0]||null
                    if(type=="river") boardcard.river=arr[0]||null
                    document.getElementById("selected-board").textContent=arr.join(" ")
                },
                disabledList: used
            })
            document.getElementById("selected-board").textContent=boardSel.join(" ")
        }
    }else{
        alert("查無指定場次")
        href("sessionlist.html")
    }
},null,[
    ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])
