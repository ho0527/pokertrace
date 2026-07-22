// 計算玩家需要跟注的金額
function getcallamountforseat(currentround, seat, bittingdata, smallblindseat, bigblindseat, smallblind, bigblind) {
    let highest=0
    let arr=bittingdata[currentround] || []
    // 找出當前最高注金額
    for(let i=0; i<arr.length; i=i+1) {
        if(!arr[i]) continue
        let v=parseInt(arr[i]["chip"]) || 0
        if(v > highest) highest=v
    }

    // 計算該座位已經投入的計分牌
    let selfchip=0
    for(let i=0; i<arr.length; i=i+1) {
        if(!arr[i]) continue
        if(arr[i]["seat"]==seat) {
            selfchip=selfchip + (parseInt(arr[i]["chip"]) || 0)
        }
    }

    // 特殊處理：preflop階段的小盲位
    if(currentround=="preflop" && seat==smallblindseat) {
        // 如果小盲還沒有補齊差額（除了原本的小盲注外沒有其他動作）
        let hasotheraction=false
        for(let i=0; i<arr.length; i=i+1) {
            if(arr[i] && arr[i]["seat"]==seat && arr[i]["action"]!="blind") {
                hasotheraction=true
                break
            }
        }
        if(!hasotheraction) {
            return bigblind - smallblind // 只需補齊到大盲注
        }
    }

    let callamount=highest - selfchip
    if(callamount < 0) callamount=0
    return callamount
}

// 檢查是否允許玩家check
function canplayercheck(currentround, seat, bittingdata, bigblindseat) {
    // preflop階段特殊處理大盲位
    if(currentround=="preflop" && seat==bigblindseat) {
        // 檢查是否有人raise
        let hasraise=false
        for(let action of bittingdata[currentround]) {
            if(action && action["action"]=="raise") {
                hasraise=true
                break
            }
        }
        return !hasraise // 如果沒有人raise，大盲可以check
    }

    // 其他情況：檢查該輪是否已經有人下注
    let hasanybet=false
    for(let action of bittingdata[currentround]) {
        if(action && (action["action"]=="raise" || action["action"]=="bet")) {
            hasanybet=true
            break
        }
    }
    return !hasanybet
}

// 獲取當前輪次中仍在遊戲中的玩家
function getactiveplayers(bittingdata, currentround) {
    let activeplayerlist=new Set()
    if(currentround=="preflop") {
        // preflop階段：所有還沒有行動或沒有fold的玩家
        for(let action of bittingdata[currentround]) {
            if(action && action["action"]!="fold") {
                activeplayerlist.add(action["seat"])
            }
        }
    } else {
        // 其他階段：從上一輪找出未棄牌的玩家
        let previousround=getPreviousRound(currentround)
        if(previousround && bittingdata[previousround]) {
            let lastactionmap=new Map() // 記錄每個玩家最後的動作
            for(let action of bittingdata[previousround]) {
                if(action) {
                    lastactionmap.set(action["seat"], action["action"])
                }
            }
            let lastactionlist=Array.from(lastactionmap.entries())
            for(let i=0; i<lastactionlist.length; i=i+1) {
                let seat=lastactionlist[i][0]
                let action=lastactionlist[i][1]
                if(action!="fold") {
                    activeplayerlist.add(seat)
                }
            }
        }
    }

    return activeplayerlist
}

// 初始化新一輪的下注數據
function initializeroundbetting(currentround, bittingdata, seatinglist, activeplayerlist) {
    bittingdata[currentround]=[]
    // 只為活躍玩家創建新的下注記錄
    let activeplayerarray=Array.from(activeplayerlist)
    for(let i=0; i<activeplayerarray.length; i=i+1) {
        let seat=activeplayerarray[i]
        if(seatinglist[seat] && seatinglist[seat]!=false) {
            bittingdata[currentround].push({
                "seat": seat,
                "name": seatinglist[seat]["name"],
                "action": "",
                "chip": 0
            })
        }
    }
    return bittingdata[currentround]
}

// 設置preflop階段的初始下注順序
function initializepreflopbetting(lastdealer, seatinglist, smallblind, bigblind, ante=0) {
    let bettingorderlist=[]
    let totalseat=seatinglist.length - 1
    // 計算小盲和大盲的位置
    let smallblindposition=(lastdealer + 1) % totalseat || totalseat
    let bigblindposition=(lastdealer + 2) % totalseat || totalseat
    // 1. 收集ante（如果有）
    if(ante > 0) {
        for(let i=1; i<seatinglist.length; i=i+1) {
            if(seatinglist[i] && seatinglist[i]!=false) {
                bettingorderlist.push({
                    "seat": i,
                    "name": seatinglist[i]["name"],
                    "action": "ante",
                    "chip": ante
                })
            }
        }
    }

    // 2. 加入小盲注
    bettingorderlist.push({
        "seat": smallblindposition,
        "name": seatinglist[smallblindposition]["name"],
        "action": "blind",
        "chip": smallblind,
        "isSB": true
    })
    // 3. 加入大盲注
    bettingorderlist.push({
        "seat": bigblindposition,
        "name": seatinglist[bigblindposition]["name"],
        "action": "blind",
        "chip": bigblind,
        "isBB": true
    })
    // 4. 從大盲下家開始依序加入
    let currentposition=(bigblindposition + 1) % totalseat || totalseat
    while(currentposition!=smallblindposition) {
        if(seatinglist[currentposition] && seatinglist[currentposition]!=false) {
            bettingorderlist.push({
                "seat": currentposition,
                "name": seatinglist[currentposition]["name"],
                "action": "",
                "chip": 0
            })
        }
        currentposition=(currentposition + 1) % totalseat || totalseat
    }

    // 5. 最後加入小盲和大盲的額外行動機會
    bettingorderlist.push({
        "seat": smallblindposition,
        "name": seatinglist[smallblindposition]["name"],
        "action": "",
        "chip": 0,
        "isSB": true,
        "isAdditionalAction": true
    })
    bettingorderlist.push({
        "seat": bigblindposition,
        "name": seatinglist[bigblindposition]["name"],
        "action": "",
        "chip": 0,
        "isBB": true,
        "isAdditionalAction": true
    })
    return bettingorderlist
}
