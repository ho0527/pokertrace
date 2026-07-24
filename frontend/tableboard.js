// 多牌桌總覽看板（檢查表 3.4）＋ 平衡建議與一鍵平衡（檢查表 3.5）
let boardsessionid=getget("id")||getget("sessionid")

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let boardtimer=null
let boardlastdata=null

function boardtext(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["tableboardpage"]&&TRANSLATE[LANGUAGE]["tableboardpage"][key]){
		return TRANSLATE[LANGUAGE]["tableboardpage"][key]
	}
	return fallback
}

function boardescape(value){
	return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

// 併桌相關文案沿用 translate.js 既有 tablemanage 區段 (原 register 牌桌管理搬過來)
function boardmanagetext(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["tablemanage"]&&TRANSLATE[LANGUAGE]["tablemanage"][key]){
		return TRANSLATE[LANGUAGE]["tablemanage"][key]
	}
	return fallback
}

function boardfindtable(tableid){
	let tablelist=[]
	if(boardlastdata){
		tablelist=boardlastdata["tables"]||[]
	}
	for(let i=0;i<tablelist.length;i=i+1){
		if(String(tablelist[i]["id"])==String(tableid)){
			return tablelist[i]
		}
	}
	return null
}

function boardtablelabel(table){
	return String(table["name"]||("#"+(table["no"]||table["id"])))
}

function applyboardstatic(){
	document.title=boardtext("title","多牌桌總覽")+" - PokerTrace"
	innertext("#boardtitle",boardtext("title","多牌桌總覽"),false)
	innertext("#statlabeltables",boardtext("tables","牌桌"),false)
	innertext("#statlabelplayers",boardtext("players","在場選手"),false)
	innertext("#statlabelavg",boardtext("avg","平均每桌"),false)
	innertext("#boardempty",boardtext("empty","此場次尚無牌桌"),false)
	let back=domgetid("backtosession")
	if(back){
		back.textContent=boardtext("back","回場次")
		back.href=boardsessionid?("session.html?id="+boardsessionid):"sessionlist.html"
	}
	let refresh=domgetid("refreshboard")
	if(refresh){
		refresh.value=boardtext("refresh","重新整理")
	}
	let auto=domgetid("autobalance")
	if(auto){
		auto.value=boardtext("autobalance","自動平衡入座")
	}
	let unseat=domgetid("unseatall")
	if(unseat){
		unseat.value=boardtext("unseatallbutton","全部退座（打散）")
	}
}

function tablecardhtml(table,avg){
	let occupied=int(table["occupied"]||0)
	let maxseat=int(table["maxseat"]||9)
	let empty=int(table["empty"]||(maxseat-occupied))
	let title=table["name"]||("#"+(table["no"]||table["id"]))
	let flag=""
	if(table["closed"]){
		flag="<span class=\"rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-300\">"+boardtext("closedbadge","已關閉")+"</span>"
	}else if(occupied==0&&boardlastdata&&boardlastdata["tablecount"]>1){
		flag="<span class=\"rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-300\">"+boardtext("needmerge","可併桌（無人）")+"</span>"
	}else if(Math.abs(occupied-avg)>=2){
		flag="<span class=\"rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-300\">"+boardtext("unbalanced","人數不均")+"</span>"
	}
	// 每顆點對應「實際座位號」: 最左=1 號位, 有人才亮綠、空位灰。
	// 不可用 i<occupied 只亮前 N 顆——那樣 3/5/9 號位有人會誤亮成 1/2/3。
	let seatset={}
	let players=table["players"]||[]
	for(let i=0;i<players.length;i=i+1){
		seatset[int(players[i]["seatno"])]=true
	}
	let dots=""
	for(let i=1;i<=maxseat;i=i+1){
		let on=seatset[i]==true
		dots=dots+"<span class=\"inline-block h-3 w-3 rounded-full "+(on?"bg-emerald-400":"bg-zinc-700")+"\" title=\""+i+"\"></span>"
	}
	let playerhtml=""
	for(let i=0;i<players.length;i=i+1){
		let p=players[i]
		playerhtml=playerhtml+
			"<div class=\"flex items-center justify-between gap-2 border-t border-zinc-800 py-1.5 text-sm\">"+
				"<span class=\"min-w-0 truncate text-zinc-200\">S"+boardescape(p["seatno"])+" "+boardescape(p["name"]||"-")+"</span>"+
				"<span class=\"shrink-0 font-mono text-xs text-zinc-400\">"+boardescape(p["chip"]||0)+"</span>"+
			"</div>"
	}
	if(!playerhtml){
		playerhtml="<div class=\"border-t border-zinc-800 py-2 text-center text-xs text-zinc-600\">-</div>"
	}
	return ""+
	"<div class=\"rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4\">"+
		"<div class=\"mb-2 flex items-center justify-between gap-2\">"+
			"<div class=\"text-base font-bold text-white truncate\">"+boardescape(title)+"</div>"+
			flag+
		"</div>"+
		"<div class=\"mb-2 flex items-baseline gap-2\">"+
			"<span class=\"text-2xl font-extrabold text-emerald-400\">"+occupied+"</span>"+
			"<span class=\"text-sm text-zinc-500\">/ "+maxseat+"</span>"+
			"<span class=\"ml-auto text-xs text-zinc-500\">"+empty+" "+boardtext("seatempty","空位")+"</span>"+
		"</div>"+
		"<div class=\"mb-3 flex flex-wrap gap-1\">"+dots+"</div>"+
		playerhtml+
		// 空桌與已關閉桌不可當併桌來源, 併桌鈕 disable
		"<div class=\"mt-3 flex gap-2\">"+
			"<input type=\"button\" class=\"boardmergebtn w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-bold cursor-pointer\" data-id=\""+boardescape(table["id"])+"\" value=\""+boardmanagetext("mergebutton","併桌")+"\""+((table["closed"]||occupied==0)?" disabled":"")+">"+
			"<input type=\"button\" class=\"boardclosebtn w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-bold cursor-pointer\" data-id=\""+boardescape(table["id"])+"\" data-closed=\""+(table["closed"]?"1":"0")+"\" value=\""+(table["closed"]?boardtext("openbutton","開啟牌桌"):boardtext("closebutton","關閉牌桌"))+"\">"+
		"</div>"+
	"</div>"
}

function renderboard(data){
	boardlastdata=data
	let tables=data["tables"]||[]
	let tablecount=tables.length
	let totalplayers=int(data["totalplayers"]||0)
	// 平衡基準 avg 只用「有人且未關閉」的桌計算: 空桌(已標可併桌)與關閉桌不稀釋平均,
	// 否則 5/5/0 會算出 avg=3 而把兩張明明平衡的桌誤標「人數不均」
	let basecount=0
	let baseplayers=0
	for(let i=0;i<tables.length;i=i+1){
		if(!tables[i]["closed"]&&0<int(tables[i]["occupied"]||0)){
			basecount=basecount+1
			baseplayers=baseplayers+int(tables[i]["occupied"]||0)
		}
	}
	let avg=basecount>0?Math.round(baseplayers/basecount):0
	innertext("#stattables",tablecount,false)
	innertext("#statplayers",totalplayers,false)
	innertext("#statavg",avg,false)
	innertext("#boardsessionname","",false)

	let grid=domgetid("boardgrid")
	let empty=domgetid("boardempty")
	if(tablecount<1){
		if(grid){grid.innerHTML=""}
		if(empty){empty.classList.remove("hidden")}
		hidebalancehint()
		return
	}
	if(empty){empty.classList.add("hidden")}
	let html=""
	for(let i=0;i<tables.length;i=i+1){
		html=html+tablecardhtml(tables[i],avg)
	}
	if(grid){grid.innerHTML=html}
	onclick(".boardmergebtn",function(element,event){
		openboardmergemodal(dataset(element,"id"))
	})
	onclick(".boardclosebtn",function(element,event){
		let tableid=dataset(element,"id")
		let closed=dataset(element,"closed")=="1"
		ptconfirm(closed?boardtext("openconfirm","確定要重新開啟這張牌桌嗎？"):boardtext("closeconfirm","確定要關閉這張牌桌嗎？關閉後不會再有新選手進入。"),function(okayed){
			if(!okayed){
				return
			}
			ajax("POST",AJAXURL+"closetable/"+tableid,function(event,data){
				if(data["success"]){
					pttoast(closed?boardtext("opensuccess","已開啟牌桌"):boardtext("closesuccess","已關閉牌桌"),"success")
					loadboard()
				}else{
					pttoast(pterror(data["data"]||boardtext("togglefail","操作失敗")),"error")
				}
			},str({
				"closed": !closed
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	})
	renderbalancehint(tables,avg)
}

function hidebalancehint(){
	let hint=domgetid("balancehint")
	if(hint){
		hint.classList.add("hidden")
	}
}

function renderbalancehint(tables,avg){
	let hint=domgetid("balancehint")
	if(!hint){
		return
	}
	let over=[]
	let under=[]
	for(let i=0;i<tables.length;i=i+1){
		let t=tables[i]
		// 空桌走「可併桌(無人)」、關閉桌走「已關閉」標籤, 都不進平衡建議的偏多/偏少清單
		if(t["closed"]||int(t["occupied"]||0)==0){
			continue
		}
		let label=t["name"]||("#"+(t["no"]||t["id"]))
		let delta=int(t["occupied"]||0)-avg
		if(delta>=2){
			over.push(label+" (+"+delta+")")
		}else if(delta<=-2){
			under.push(label+" ("+delta+")")
		}
	}
	if(over.length==0&&under.length==0){
		hint.classList.add("hidden")
		hint.innerHTML=""
		return
	}
	let parts=[]
	if(over.length){
		parts.push(boardtext("over","偏多：")+over.join("、"))
	}
	if(under.length){
		parts.push(boardtext("under","偏少：")+under.join("、"))
	}
	hint.classList.remove("hidden")
	hint.innerHTML=boardescape(boardtext("hintprefix","平衡建議："))+boardescape(parts.join("　|　"))
}

// ==== 併桌 (原 register 牌桌管理搬過來): 選目標桌 modal → mergetableplayers → 自動關閉來源桌 → 結果 modal ====
function openboardmergemodal(sourceid){
	let source=boardfindtable(sourceid)
	if(!source){
		return
	}
	let sourcelabel=boardtablelabel(source)
	let sourcecount=int(source["occupied"]||0)
	let old=domgetid("boardmergemodal")
	if(old){
		ptremovescrollcover(old)
	}
	let tablelist=boardlastdata["tables"]||[]
	let optionhtml=""
	let totalempty=0
	for(let i=0;i<tablelist.length;i=i+1){
		let table=tablelist[i]
		// 只列其他開放中的桌; 空位不足以容納來源人數者 disable
		if(String(table["id"])==String(sourceid)||table["closed"]){
			continue
		}
		let tablemaxseat=int(table["maxseat"]||9)
		let empty=int(table["empty"]||(tablemaxseat-int(table["occupied"]||0)))
		totalempty=totalempty+empty
		let enough=sourcecount<=empty
		let optiontext=boardtablelabel(table)+"　"+boardmanagetext("emptycount","{n} 空位").replace("{n}",empty)
		if(!enough){
			optiontext=optiontext+"　"+boardmanagetext("mergeinsufficient","空位不足")
		}
		optionhtml=optionhtml+`<input type="button" class="boardmergetargetbtn w-full text-left bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 rounded px-3 py-2 text-sm" data-id="${boardescape(table["id"])}" value="${boardescape(optiontext)}" ${enough?"":"disabled"}>`
	}
	if(!optionhtml){
		optionhtml=`<div class="text-sm text-zinc-500">${boardmanagetext("mergenotarget","沒有可併入的開放牌桌")}</div>`
	}else{
		// 最上方多一個「隨機分配到所有開放桌」: 各開放桌空位總和不足來源人數則 disable
		let autoenough=sourcecount<=totalempty
		let autotext=boardmanagetext("mergeauto","隨機分配到所有開放桌")+"　"+boardmanagetext("mergeautototal","共 {n} 空位").replace("{n}",totalempty)
		if(!autoenough){
			autotext=autotext+"　"+boardmanagetext("mergeinsufficient","空位不足")
		}
		optionhtml=`<input type="button" class="boardmergeautobtn w-full text-left bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded px-3 py-2 text-sm font-semibold" value="${boardescape(autotext)}" ${autoenough?"":"disabled"}>`+optionhtml
	}
	let cover=doccreate("div")
	cover.id="boardmergemodal"
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-5 shadow-xl">
			<div class="flex items-center justify-between mb-4">
				<div class="text-lg font-semibold text-white">${boardmanagetext("mergetitle","併桌：選擇目標牌桌")}</div>
				<input type="button" class="closeboardmerge text-zinc-400 hover:text-white" value="×">
			</div>
			<div class="text-sm text-zinc-400 mb-4">${boardmanagetext("mergedesc","把「{table}」的所有選手併到選定的目標桌，併桌後本桌會自動關閉。").replace("{table}",boardescape(sourcelabel))}</div>
			<div class="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto">${optionhtml}</div>
			<div class="flex justify-end gap-2 mt-5">
				<input type="button" class="closeboardmerge bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded" value="${boardmanagetext("cancel","取消")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(cover)
	onclick(".closeboardmerge",function(element,event){
		ptremovescrollcover(domgetid("boardmergemodal"))
	})
	onclick(".boardmergetargetbtn",function(element,event){
		let targetid=dataset(element,"id")
		let target=boardfindtable(targetid)
		let targetlabel=""
		if(target){
			targetlabel=boardtablelabel(target)
		}
		ptconfirm(boardmanagetext("mergeconfirm","確定要把「{source}」的所有選手併到「{target}」嗎？併桌後「{source}」會自動關閉。").replace(/\{source\}/g,boardescape(sourcelabel)).replace("{target}",boardescape(targetlabel)),function(okayed){
			if(!okayed){
				return
			}
			boardmergeto(sourceid,targetid)
		})
	})
	onclick(".boardmergeautobtn",function(element,event){
		ptconfirm(boardmanagetext("mergeautoconfirm","確定要把「{source}」的所有選手隨機分配到所有開放牌桌嗎？併桌後「{source}」會自動關閉。").replace(/\{source\}/g,boardescape(sourcelabel)),function(okayed){
			if(!okayed){
				return
			}
			boardmergeto(sourceid,"auto")
		})
	})
}

function boardmergeto(sourceid,targetid){
	// targetid="auto" 為特殊值(隨機分配到所有開放桌), 原樣送字串; 其餘照舊轉數字
	let targetvalue=targetid
	if(targetid!="auto"){
		targetvalue=int(targetid)
	}
	ajax("POST",AJAXURL+"mergetableplayers/"+sourceid,function(event,data){
		if(data["success"]){
			let modal=domgetid("boardmergemodal")
			if(modal){
				ptremovescrollcover(modal)
			}
			let movedata=data["data"]||{}
			// 併桌=拆桌: 成功後自動關閉來源桌, 之後不該再有人進來
			ajax("POST",AJAXURL+"closetable/"+sourceid,function(event,closedata){
				if(closedata["success"]){
					openboardmergeresult(movedata,true)
				}else{
					pttoast(boardmanagetext("mergeclosefail","併桌完成，但自動關閉來源桌失敗，請手動關閉"),"warning")
					openboardmergeresult(movedata,false)
				}
				loadboard()
			},str({
				"closed": true
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		}else{
			pttoast(pterror(data["data"]||boardmanagetext("mergefail","併桌失敗")),"error")
		}
	},str({
		"targettableid": targetvalue
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#boardmergemodal"
	})
}

function openboardmergeresult(movedata,closeded){
	let old=domgetid("boardmergeresultmodal")
	if(old){
		ptremovescrollcover(old)
	}
	let sourcelabel=String(movedata["sourcetablename"]||movedata["sourcetableno"]||"")
	let targetlabel=String(movedata["targettablename"]||movedata["targettableno"]||"")
	// auto 模式後端 targettableno/targettablename 給 null → targetlabel 為空 → 標題改「併入多桌」, 各列去向看 moves
	let titletext=""
	if(targetlabel==""){
		titletext=boardmanagetext("resulttitlemulti","「{source}」併入多桌").replace("{source}",boardescape(sourcelabel))
	}else{
		titletext=boardmanagetext("resulttitle","「{source}」併入「{target}」").replace("{source}",boardescape(sourcelabel)).replace("{target}",boardescape(targetlabel))
	}
	let moves=movedata["moves"]||[]
	let rowhtml=""
	for(let i=0;i<moves.length;i=i+1){
		let move=moves[i]
		let playeridhtml=""
		if(move["playerid"]){
			playeridhtml=` <span class="text-sm font-normal text-zinc-400">(${boardescape(move["playerid"])})</span>`
		}
		rowhtml=rowhtml+`
			<div class="flex items-center justify-between gap-3 border-t border-zinc-800 py-2">
				<div class="min-w-0 truncate text-lg font-bold text-white">${boardescape(move["playername"]||"-")}${playeridhtml}</div>
				<div class="shrink-0 font-mono text-xl font-extrabold text-emerald-400">${boardescape(movedata["sourcetableno"])}-${boardescape(move["fromseatno"])} → ${boardescape(move["totableno"])}-${boardescape(move["toseatno"])}</div>
			</div>
		`
	}
	if(!rowhtml){
		rowhtml=`<div class="py-3 text-sm text-zinc-400">${boardmanagetext("resultempty","此次併桌沒有需要移動的選手。")}</div>`
	}
	let closedhtml=""
	if(closeded){
		closedhtml=`<div class="mt-3 text-xs text-amber-300">${boardmanagetext("resultclosed","「{source}」已自動關閉，不會再有新選手進入。").replace("{source}",boardescape(sourcelabel))}</div>`
	}
	let cover=doccreate("div")
	cover.id="boardmergeresultmodal"
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-5 shadow-xl">
			<div class="text-lg font-semibold text-white mb-4">${titletext}</div>
			<div class="max-h-[50vh] overflow-y-auto">${rowhtml}</div>
			${closedhtml}
			<div class="flex justify-end gap-2 mt-5">
				<input type="button" class="closeboardmergeresult bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded font-semibold" value="${boardmanagetext("resultclose","關閉")}">
			</div>
		</div>
	`
	ptlockpagescroll()
	document.body.appendChild(cover)
	onclick(".closeboardmergeresult",function(element,event){
		ptremovescrollcover(domgetid("boardmergeresultmodal"))
	})
}

function loadboard(){
	if(!boardsessionid){
		pttoast(boardtext("nosession","缺少場次 ID"),"error")
		return
	}
	ajax("GET",AJAXURL+"getsessiontableboard/"+boardsessionid,function(event,data){
		if(data["success"]){
			renderboard(data["data"])
			return
		}
		if(data["data"]=="ERROR_no_permission"){
			pttoast(boardtext("noperm","沒有權限檢視此看板"),"error")
			return
		}
		if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
			pthandleauthfailure(data["data"],{"toasted": false})
			return
		}
		pttoast(pterror(data["data"]||boardtext("loadfail","載入失敗")),"error")
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		"loadingtarget": "#boardgrid"
	})
}

function autobalance(){
	if(!boardlastdata||!boardsessionid){
		return
	}
	let tableids=[]
	let tables=boardlastdata["tables"]||[]
	for(let i=0;i<tables.length;i=i+1){
		// 已關閉的桌不參與自動平衡 (後端也會再排除一次)
		if(tables[i]["closed"]){
			continue
		}
		tableids.push(tables[i]["id"])
	}
	if(tableids.length<2){
		return
	}
	ptconfirm(boardtext("confirmbalance","確定要自動把未入座／可調整的選手平衡到各桌嗎？"),function(okayed){
		if(!okayed){
			return
		}
		ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+boardsessionid,function(event,data){
			if(data["success"]){
				pttoast(boardtext("balancedone","已套用平衡"),"success")
				loadboard()
				return
			}
			pttoast(pterror(data["data"]||boardtext("balancefail","平衡失敗")),"error")
		},str({
			"mode": "balanced",
			"tableids": tableids
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	})
}

function unseatallplayers(){
	if(!boardsessionid){
		return
	}
	ptconfirm(boardtext("unseatallconfirm","確定要打散重抽嗎？將把所有在場選手變為未排桌，之後可用隨機排座重新抽桌。"),function(okayed){
		if(!okayed){
			return
		}
		ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+boardsessionid,function(event,data){
			if(data["success"]){
				let unseatedcount=(data["data"]||{})["unseatedcount"]||0
				pttoast(boardtext("unseatalldone","已退座 {n} 位選手").replace("{n}",String(unseatedcount)),"success")
				loadboard()
				return
			}
			pttoast(pterror(data["data"]||boardtext("unseatallfail","全部退座失敗")),"error")
		},str({
			"mode": "unseatall"
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	})
}

applyboardstatic()
loadboard()

boardtimer=setInterval(loadboard,15000)

onclick("#refreshboard",function(){
	loadboard()
})

onclick("#autobalance",function(){
	autobalance()
})

onclick("#unseatall",function(){
	unseatallplayers()
})

window.addEventListener("beforeunload",function(){
	if(boardtimer){
		clearInterval(boardtimer)
	}
})
