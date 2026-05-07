// 計算玩家需要跟注的金額
function getCallAmountForSeat(currentRound, seat, bittingdata, smallblindseat, bigblindseat, smallblind, bigblind) {
    let highest = 0;
    let arr = bittingdata[currentRound] || [];

    // 找出當前最高注金額
    for(let i=0; i < arr.length; i++) {
        if(!arr[i]) continue;
        let v = parseInt(arr[i].chip) || 0;
        if(v > highest) highest = v;
    }

    // 計算該座位已經投入的籌碼
    let selfChip = 0;
    for(let i=0; i < arr.length; i++) {
        if(!arr[i]) continue;
        if(arr[i].seat === seat) {
            selfChip += parseInt(arr[i].chip) || 0;
        }
    }

    // 特殊處理：preflop階段的小盲位
    if(currentRound === "preflop" && seat === smallblindseat) {
        // 如果小盲還沒有補齊差額（除了原本的小盲注外沒有其他動作）
        let hasOtherAction = false;
        for(let i=0; i < arr.length; i++) {
            if(arr[i] && arr[i].seat === seat && arr[i].action !== "blind") {
                hasOtherAction = true;
                break;
            }
        }
        if(!hasOtherAction) {
            return bigblind - smallblind; // 只需補齊到大盲注
        }
    }

    let callAmt = highest - selfChip;
    if(callAmt < 0) callAmt = 0;
    return callAmt;
}

// 檢查是否允許玩家check
function canPlayerCheck(currentRound, seat, bittingdata, bigblindseat) {
    // preflop階段特殊處理大盲位
    if(currentRound === "preflop" && seat === bigblindseat) {
        // 檢查是否有人raise
        let hasRaise = false;
        for(let action of bittingdata[currentRound]) {
            if(action && action.action === "raise") {
                hasRaise = true;
                break;
            }
        }
        return !hasRaise; // 如果沒有人raise，大盲可以check
    }

    // 其他情況：檢查該輪是否已經有人下注
    let hasAnyBet = false;
    for(let action of bittingdata[currentRound]) {
        if(action && (action.action === "raise" || action.action === "bet")) {
            hasAnyBet = true;
            break;
        }
    }
    return !hasAnyBet;
}

// 獲取當前輪次中仍在遊戲中的玩家
function getActivePlayers(bittingdata, currentRound) {
    let activePlayers = new Set();

    if(currentRound === "preflop") {
        // preflop階段：所有還沒有行動或沒有fold的玩家
        for(let action of bittingdata[currentRound]) {
            if(action && action.action !== "fold") {
                activePlayers.add(action.seat);
            }
        }
    } else {
        // 其他階段：從上一輪找出未棄牌的玩家
        let previousRound = getPreviousRound(currentRound);
        if(previousRound && bittingdata[previousRound]) {
            let lastActions = new Map(); // 記錄每個玩家最後的動作
            for(let action of bittingdata[previousRound]) {
                if(action) {
                    lastActions.set(action.seat, action.action);
                }
            }
            lastActions.forEach((action, seat) => {
                if(action !== "fold") {
                    activePlayers.add(seat);
                }
            });
        }
    }

    return activePlayers;
}

// 初始化新一輪的下注數據
function initializeRoundBetting(currentRound, bittingdata, seatinglist, activePlayers) {
    bittingdata[currentRound] = [];

    // 只為活躍玩家創建新的下注記錄
    activePlayers.forEach(seat => {
        if(seatinglist[seat] && seatinglist[seat] !== false) {
            bittingdata[currentRound].push({
                seat: seat,
                name: seatinglist[seat].name,
                action: "",
                chip: 0
            });
        }
    });

    return bittingdata[currentRound];
}

// 設置preflop階段的初始下注順序
function initializePreflopBetting(lastdealer, seatinglist, smallblind, bigblind, ante=0) {
    let bettingOrder = [];
    let totalSeats = seatinglist.length - 1;

    // 計算小盲和大盲的位置
    let sbPosition = (lastdealer + 1) % totalSeats || totalSeats;
    let bbPosition = (lastdealer + 2) % totalSeats || totalSeats;

    // 1. 收集ante（如果有）
    if(ante > 0) {
        for(let i = 1; i < seatinglist.length; i++) {
            if(seatinglist[i] && seatinglist[i] !== false) {
                bettingOrder.push({
                    seat: i,
                    name: seatinglist[i].name,
                    action: "ante",
                    chip: ante
                });
            }
        }
    }

    // 2. 加入小盲注
    bettingOrder.push({
        seat: sbPosition,
        name: seatinglist[sbPosition].name,
        action: "blind",
        chip: smallblind,
        isSB: true
    });

    // 3. 加入大盲注
    bettingOrder.push({
        seat: bbPosition,
        name: seatinglist[bbPosition].name,
        action: "blind",
        chip: bigblind,
        isBB: true
    });

    // 4. 從大盲下家開始依序加入
    let currentPosition = (bbPosition + 1) % totalSeats || totalSeats;
    while(currentPosition !== sbPosition) {
        if(seatinglist[currentPosition] && seatinglist[currentPosition] !== false) {
            bettingOrder.push({
                seat: currentPosition,
                name: seatinglist[currentPosition].name,
                action: "",
                chip: 0
            });
        }
        currentPosition = (currentPosition + 1) % totalSeats || totalSeats;
    }

    // 5. 最後加入小盲和大盲的額外行動機會
    bettingOrder.push({
        seat: sbPosition,
        name: seatinglist[sbPosition].name,
        action: "",
        chip: 0,
        isSB: true,
        isAdditionalAction: true
    });

    bettingOrder.push({
        seat: bbPosition,
        name: seatinglist[bbPosition].name,
        action: "",
        chip: 0,
        isBB: true,
        isAdditionalAction: true
    });

    return bettingOrder;
}