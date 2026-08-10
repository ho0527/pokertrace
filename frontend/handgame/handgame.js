/*
	手牌遊戲類型註冊表（前端共用「輪子」）。
	各遊戲在自己的檔案呼叫 handgameregister() 登錄：holecount / ranklist / 中文名稱 / 是否已實作。
	牌型 code 與 tool/equity（HE/OM/O5/SD）對齊；快速解算直接共用後端 equity 端點，不另造輪子。
*/

let HANDGAMEFULLRANK=["A","K","Q","J","T","9","8","7","6","5","4","3","2"]
let HANDGAMESHORTRANK=["A","K","Q","J","T","9","8","7","6"]

// 社區牌（board）家族的預設街別：翻牌前 / 翻牌 / 轉牌 / 河牌。
// 新增家族（梭哈 stud、換牌 draw）在各自檔案用 streets 覆寫；board 家族沿用這組。
let BOARDSTREETS=[
	{ key: "preflop",name: "翻牌前" },
	{ key: "flop",name: "翻牌圈",board: "flop" },
	{ key: "turn",name: "轉牌圈",board: "turn" },
	{ key: "river",name: "河牌圈",board: "river" }
]

// 換牌（draw）家族的街別產生器：換牌前 + n 次換牌。單/雙/三換傳 1/2/3。
function handgamedrawstreets(count){
	let ordinal=["","第一次換牌","第二次換牌","第三次換牌"]
	let list=[{ key: "predraw",name: "換牌前" }]
	for(let i=1;i<=count;i=i+1){
		list.push({ key: "draw"+i,name: ordinal[i]||("第"+i+"次換牌"),draw: true })
	}
	return list
}

let HANDGAMEMAP={}
let HANDGAMEORDER=[]

function handgameregister(def){
	if(!def||!def["code"]){
		return
	}
	let code=String(def["code"]).toUpperCase()
	HANDGAMEMAP[code]=def
	if(HANDGAMEORDER.indexOf(code)<0){
		HANDGAMEORDER.push(code)
	}
}

function handgamedef(code){
	let key=String(code||"").toUpperCase()
	if(HANDGAMEMAP[key]){
		return HANDGAMEMAP[key]
	}
	// 未實作 / 未知類型：以德州為基底但標記為未支援
	return {
		code: key,
		name: key,
		holecount: 2,
		ranklist: HANDGAMEFULLRANK,
		omaha: false,
		enabled: false,
		family: "board",
		streets: BOARDSTREETS,
		low: false,
		drawcount: 0,
		blindtype: "blind",
		exposedmap: {}
	}
}

function handgameenabled(code){
	return handgamedef(code)["enabled"]==true
}

function handgamename(code){
	return handgamedef(code)["name"]||String(code||"")
}

function handgameholecount(code){
	return handgamedef(code)["holecount"]||2
}

function handgameranklist(code){
	return handgamedef(code)["ranklist"]||HANDGAMEFULLRANK
}

function handgameomahaed(code){
	return handgamedef(code)["omaha"]==true
}

// 家族：board（社區牌）/ stud（梭哈）/ draw（換牌）。未註冊者預設 board。
function handgamefamily(code){
	return handgamedef(code)["family"]||"board"
}

// 街別清單（含 key / name / board|deal|draw meta）。未指定者退回 board 家族的四街。
function handgamestreets(code){
	return handgamedef(code)["streets"]||BOARDSTREETS
}

// 低牌牌型：false / "a5" / "27"。目前僅供顯示與手動判讀，未接後端解算。
function handgameislow(code){
	return handgamedef(code)["low"]||false
}

// 換牌家族的換牌回合數（單/雙/三換 = 1/2/3）。
function handgamedrawcount(code){
	return handgamedef(code)["drawcount"]||0
}

// 下注制：blind（盲注）/ ante-bringin（前注 + 帶入注，梭哈用）。
function handgameblindtype(code){
	return handgamedef(code)["blindtype"]||"blind"
}

// 梭哈每街的明/暗牌對照 {streetkey:["hole"|"up",...]}。
function handgameexposedmap(code){
	return handgamedef(code)["exposedmap"]||{}
}

// 底牌槽位是明牌還是暗牌，回 ["hole","hole","up",...]，長度等於 holecount。
// 把 exposedmap 依街別順序攤平 —— 梭哈是 2 暗 + 4 明 + 1 暗，
// 顯示端要靠這個才分得出「這張當時是攤開給大家看的」。
// 非梭哈牌型沒有 exposedmap，整副都算暗牌。
function handgameexposedlist(code){
	let list=[]
	let map=handgameexposedmap(code)
	let streets=handgamestreets(code)
	for(let i=0;i<streets.length;i=i+1){
		let part=map[streets[i]["key"]]||[]
		for(let j=0;j<part.length;j=j+1){
			list.push(part[j])
		}
	}
	let count=handgameholecount(code)
	for(let i=list.length;i<count;i=i+1){
		list.push("hole")
	}
	return list
}

// 這個牌型會不會棄牌（瘋狂菠蘿翻牌後棄一張）。棄掉的牌記在 familydata 的 discard。
function handgamediscardcount(code){
	return handgamedef(code)["discardcount"]||0
}

// 是否可用 equity 後端自動解算贏家：board 家族支援，梭哈 / 換牌先手動。
// 但 board 家族裡也有不能自動解的 —— 瘋狂菠蘿（CP）翻牌後要棄一張，而註冊表
// 沒有棄牌的概念，記錄下來的 3 張含已棄的那張，丟給後端會湊出比實際更好的牌，
// **而且不會報錯，只是安靜地判錯贏家**。所以各牌型可用 autosolve: false 明確關掉。
function handgameautosolvable(code){
	if(handgamedef(code)["autosolve"]==false){
		return false
	}
	return handgamefamily(code)=="board"
}

function handgamefirstenabled(){
	for(let i=0;i<HANDGAMEORDER.length;i=i+1){
		if(handgameenabled(HANDGAMEORDER[i])){
			return HANDGAMEORDER[i]
		}
	}
	return "HE"
}

// 牌物件 {card1,card2,...} 與陣列互轉（共用）
function handcardobjtolist(obj,count){
	let list=[]
	for(let i=1;i<=count;i=i+1){
		list.push(obj&&obj["card"+i]?obj["card"+i]:"")
	}
	return list
}

function handcardlisttoobj(list,count,extra){
	let obj={}
	if(extra){
		for(let key in extra){
			obj[key]=extra[key]
		}
	}
	for(let i=1;i<=count;i=i+1){
		obj["card"+i]=(list&&list[i-1])?list[i-1]:""
	}
	return obj
}

// 任意 card1..card7 中已填的牌（顯示 / 排重用，不限 holecount）。
// 上限 7 以支援 7 張梭哈；board / 換牌家族用不到的槽位不存在，不影響結果。
function handcardspresent(obj){
	let list=[]
	for(let i=1;i<=7;i=i+1){
		if(obj&&obj["card"+i]){
			list.push(obj["card"+i])
		}
	}
	return list
}
