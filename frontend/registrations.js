let sessionid=getget("sessionid")
let tables=[]
let startchip=0
let maxseat=9
let advancetargets=[]

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

if(!sessionid){
	pttoast("缺少 sessionid","error")
	href("sessionlist.html")
}

function moneytext(value){
	value=float(value)||0
	if(0<=value){
		return "+"+value
	}
	return ""+value
}

function selectedplayerids(){
	let ids=[]
	let checks=document.querySelectorAll(".selectplayer:checked")
	for(let i=0;i<checks.length;i=i+1){
		ids.push(int(checks[i].value))
	}
	return ids
}

function statusbadge(status){
	if(status=="registered"){
		return `<span class="bg-yellow-900/40 text-yellow-300 px-2 py-1 rounded text-xs font-semibold">已報名</span>`
	}
	if(status=="confirmed"){
		return `<span class="bg-green-900/40 text-green-300 px-2 py-1 rounded text-xs font-semibold">已確認</span>`
	}
	if(status=="advanced"){
		return `<span class="bg-sky-900/40 text-sky-300 px-2 py-1 rounded text-xs font-semibold">已晉級</span>`
	}
	if(status=="cancelled"){
		return `<span class="bg-zinc-700 text-zinc-400 px-2 py-1 rounded text-xs font-semibold">已取消</span>`
	}
	return `<span>${status}</span>`
}

function formattime(ts){
	if(!ts){
		return "-"
	}
	let s=ts.split("T")
	if(s.length<2){
		return ts
	}
	return s[0]+" "+s[1].split(":00.")[0].split("+")[0].split("Z")[0]
}

function tableoptions(selected){
	let html=`<option value="">未排座</option>`
	for(let i=0;i<tables.length;i=i+1){
		let table=tables[i]
		html=html+`<option value="${table["id"]}" ${String(selected)==String(table["id"])?"selected":""}>${table["name"]||table["token"]||("Table "+table["id"])}</option>`
	}
	return html
}

function seatoptions(selected,tableid){
	let html=`<option value="">-</option>`
	for(let i=1;i<=maxseat;i=i+1){
		html=html+`<option value="${i}" ${String(selected)==String(i)?"selected":""}>${i}</option>`
	}
	return html
}

function getboxkeyword(){
	let boxes=document.querySelectorAll(".playeridbox")
	let text=""
	for(let i=0;i<boxes.length;i=i+1){
		text=text+boxes[i].value
	}
	if(text){
		return text
	}
	return getvalue("hostplayerid")
}

function bindusersearch(){
	let boxes=document.querySelectorAll(".playeridbox")
	for(let i=0;i<boxes.length;i=i+1){
		boxes[i].addEventListener("input",function(){
			if(this.value&&this.nextElementSibling){
				this.nextElementSibling.focus()
			}
			value("#hostplayerid",getboxkeyword(),false)
			searchusers()
		})
	}
	oninput("#hostplayerid",function(element,event){
		searchusers()
	})
	onclick("#searchuserbtn",function(element,event){
		searchusers()
	})
}

function askadvancechip(defaultchip,done){
	let cover=document.createElement("div")
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-sm w-full p-5 shadow-xl">
			<div class="text-lg font-semibold text-white mb-3">設定晉級籌碼</div>
			<div class="text-sm text-zinc-300 mb-3">系統會把玩家帶到下一場多日賽；若玩家重複晉級，下一場會保留最高籌碼。</div>
			<input type="number" id="advancechipinput" class="w-full bg-zinc-700 text-white rounded px-3 py-2" value="${defaultchip||0}" min="1">
			<div class="flex justify-end gap-2 mt-5">
				<button class="advancecancel bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded">取消</button>
				<button class="advanceok bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">確認晉級</button>
			</div>
		</div>
	`
	document.body.appendChild(cover)
	cover.querySelector(".advancecancel").addEventListener("click",function(){
		document.body.removeChild(cover)
	})
	cover.querySelector(".advanceok").addEventListener("click",function(){
		let chip=int(cover.querySelector("#advancechipinput").value)
		if(chip<=0){
			pttoast("請輸入晉級籌碼","warning")
			return
		}
		document.body.removeChild(cover)
		done(chip)
	})
}

function financebuttonhtml(r){
	let payment=r["paymenttype"]=="ticket"?"票券":"現金"
	let prize=r["prizeoverride"]==null?"自動":r["prizeoverride"]
	return `
		<div class="text-xs text-zinc-400 leading-5 mb-2">
			<div>重購 ${r["rebuycount"]||0} 次 / ${payment}</div>
			<div>獎金修正 ${prize} / 票值 ${r["ticketvalue"]||0}</div>
		</div>
		<button class="openfinancebtn bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-xs" data-id="${r["id"]}" data-rebuy="${r["rebuycount"]||0}" data-prize="${r["prizeoverride"]==null?"":r["prizeoverride"]}" data-ticket="${r["ticketvalue"]||0}" data-payment="${r["paymenttype"]||"cash"}">修正收益</button>
	`
}

function openfinancemodal(button){
	let id=dataset(button,"id")
	let cover=document.createElement("div")
	cover.id="financemodal"
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-5 shadow-xl">
			<div class="flex items-center justify-between mb-4">
				<div class="text-lg font-semibold text-white">修正收益資料</div>
				<button class="closefinance text-zinc-400 hover:text-white">×</button>
			</div>
			<div class="text-sm text-zinc-400 mb-4">這裡只修正此玩家的報名財務資料，不會更改賽事本身設定。</div>
			<div class="grid grid-cols-1 gap-3">
				<label class="text-sm text-zinc-300">重購次數<input type="number" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="rebuycount" value="${dataset(button,"rebuy")||0}"></label>
				<label class="text-sm text-zinc-300">獎金修正<input type="number" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="prizeoverride" value="${dataset(button,"prize")}" placeholder="空白代表使用自動獎金"></label>
				<label class="text-sm text-zinc-300">票券價值<input type="number" class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="ticketvalue" value="${dataset(button,"ticket")||0}"></label>
				<label class="text-sm text-zinc-300">買入方式<select class="financeinput mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" data-id="${id}" data-field="paymenttype">
					<option value="cash" ${dataset(button,"payment")!="ticket"?"selected":""}>現金買入</option>
					<option value="ticket" ${dataset(button,"payment")=="ticket"?"selected":""}>票券買入</option>
				</select></label>
			</div>
			<div class="flex justify-end gap-2 mt-5">
				<button class="closefinance bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded">取消</button>
				<button class="savefinancebtn bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded" data-id="${id}">儲存</button>
			</div>
		</div>
	`
	document.body.appendChild(cover)
	onclick(".closefinance",function(element,event){
		document.getElementById("financemodal").remove()
	})
	onclick(".savefinancebtn",function(element,event){
		savefinance(dataset(element,"id"))
	})
}

function searchusers(){
	let keyword=getboxkeyword()
	let box=domgetid("usersearchresult")
	if(!box){
		return
	}
	if(!keyword){
		box.classList.add("hidden")
		box.innerHTML=""
		return
	}
	ajax("GET",AJAXURL+"searchusers?sessionid="+sessionid+"&keyword="+encodeURIComponent(keyword),function(event,data){
		if(!data["success"]){
			return
		}
		let rows=data["data"]||[]
		let html=""
		for(let i=0;i<rows.length;i=i+1){
			let r=rows[i]
			let action=`<button class="searchregisterbtn bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs" data-playerid="${r["playerid"]}">報名</button>`
			if(r["registrationstatus"]){
				action=`<span class="text-xs text-zinc-400">${r["registrationstatus"]}</span>`
			}
			html=html+`
				<div class="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
					<div>
						<div class="text-sm text-white">${r["name"]||"-"}</div>
						<div class="text-xs text-zinc-500">${r["playerid"]||""} ${r["email"]||""}</div>
					</div>
					${action}
				</div>
			`
		}
		if(!html){
			html=`<div class="px-3 py-3 text-zinc-500 text-sm">沒有符合的使用者</div>`
		}
		box.innerHTML=html
		box.classList.remove("hidden")
		onclick(".searchregisterbtn",function(element,event){
			element.disabled=true
			ajax("POST",AJAXURL+"registersessionplayer/"+sessionid,function(event,data){
				if(data["success"]){
					loadregistrations()
				}else{
					pttoast(pterror(data["data"]||"報名失敗"),"error")
					element.disabled=false
				}
			},str({
				"playerid": dataset(element,"playerid")
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function loadregistrations(){
	ajax("GET",AJAXURL+"getsessionregistrationlist/"+sessionid,function(event,data){
		if(!data["success"]){
			pttoast(pterror(data["data"]||"載入失敗"),"error")
			return
		}

		let row=data["data"]
		tables=row["tables"]||[]
		advancetargets=row["advancetargets"]||[]
		startchip=row["startchip"]||0
		maxseat=int(row["maxseat"]||9)

		innertext("#sessionname",row["sessionname"],false)
		innertext("#statregistered",row["stats"]["registered"],false)
		innertext("#statconfirmed",row["stats"]["confirmed"],false)
		innertext("#statcancelled",row["stats"]["cancelled"],false)

		let toolbar=domgetid("registrationtoolbar")
		if(toolbar){
			let tablehtml=tableoptions("")
			toolbar.innerHTML=`
				<div class="flex flex-wrap gap-2 items-center mb-3">
					<div class="flex gap-1" id="playeridboxes">
						<input maxlength="1" class="playeridbox bg-zinc-700 text-white rounded px-2 py-2 text-sm w-9 text-center">
						<input maxlength="1" class="playeridbox bg-zinc-700 text-white rounded px-2 py-2 text-sm w-9 text-center">
						<input maxlength="1" class="playeridbox bg-zinc-700 text-white rounded px-2 py-2 text-sm w-9 text-center">
						<input maxlength="1" class="playeridbox bg-zinc-700 text-white rounded px-2 py-2 text-sm w-9 text-center">
						<input maxlength="1" class="playeridbox bg-zinc-700 text-white rounded px-2 py-2 text-sm w-9 text-center">
						<input maxlength="1" class="playeridbox bg-zinc-700 text-white rounded px-2 py-2 text-sm w-9 text-center">
						<input maxlength="1" class="playeridbox bg-zinc-700 text-white rounded px-2 py-2 text-sm w-9 text-center">
						<input maxlength="1" class="playeridbox bg-zinc-700 text-white rounded px-2 py-2 text-sm w-9 text-center">
					</div>
					<input type="text" class="bg-zinc-700 text-white rounded px-2 py-2 text-sm w-48" id="hostplayerid" placeholder="玩家 ID / 名稱 / Email">
					<button class="bg-sky-600 hover:bg-sky-700 px-3 py-2 rounded text-sm font-semibold" id="searchuserbtn">查詢使用者</button>
				</div>
				<div class="mb-3 hidden rounded border border-zinc-700 overflow-hidden" id="usersearchresult"></div>
				<div class="flex flex-wrap gap-2 items-center">
					<label class="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" id="selectallplayers">全選</label>
					<select class="bg-zinc-700 text-white rounded px-2 py-2 text-sm" id="randomtable">${tablehtml}</select>
					<input type="number" class="bg-zinc-700 text-white rounded px-2 py-2 text-sm w-28" id="randomstartchip" value="${startchip}" placeholder="起始籌碼">
					<button class="bg-sky-600 hover:bg-sky-700 px-3 py-2 rounded text-sm font-semibold" id="randomunseatedbtn">未入座補位</button>
					<button class="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-semibold" id="randomselectedbtn">重排選取玩家</button>
					<button class="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-sm font-semibold" id="randombalancedbtn">全部桌平均排座</button>
				</div>
			`
			bindusersearch()
			onclick("#hostregisterbtn",function(element,event){
				let playerid=getvalue("hostplayerid")
				if(!playerid){
					pttoast("請輸入玩家 ID","warning")
					return
				}
				element.disabled=true
				ajax("POST",AJAXURL+"registersessionplayer/"+sessionid,function(event,data){
					element.disabled=false
					if(data["success"]){
						value("#hostplayerid","",false)
						loadregistrations()
					}else{
						pttoast(pterror(data["data"]||"新增玩家失敗"),"error")
					}
				},str({
					"playerid": playerid
				}),[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				])
			})
			onclick("#randomunseatedbtn",function(element,event){
				let tableid=getvalue("randomtable")
				if(!tableid){
					pttoast("請先選擇牌桌","warning")
					return
				}
				element.disabled=true
				ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+sessionid,function(event,data){
					element.disabled=false
					if(data["success"]){
						loadregistrations()
					}else{
						pttoast(pterror(data["data"]||"隨機座位失敗"),"error")
					}
				},str({
					"tableid": int(tableid),
					"startchip": int(getvalue("randomstartchip")||startchip),
					"mode": "unseated"
				}),[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				])
			})
			onclick("#randomselectedbtn",function(element,event){
				let tableid=getvalue("randomtable")
				let ids=selectedplayerids()
				if(!tableid){
					pttoast("請先選擇牌桌","warning")
					return
				}
				if(ids.length==0){
					pttoast("請先選取要重排的玩家","warning")
					return
				}
				element.disabled=true
				ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+sessionid,function(event,data){
					element.disabled=false
					if(data["success"]){
						loadregistrations()
					}else{
						pttoast(pterror(data["data"]||"重排座位失敗"),"error")
					}
				},str({
					"tableid": int(tableid),
					"startchip": int(getvalue("randomstartchip")||startchip),
					"mode": "selected",
					"playerids": ids
				}),[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				])
			})
			onclick("#randombalancedbtn",function(element,event){
				element.disabled=true
				ajax("PUT",AJAXURL+"randomizesessionplayerseats/"+sessionid,function(event,data){
					element.disabled=false
					if(data["success"]){
						loadregistrations()
					}else{
						pttoast(pterror(data["data"]||"平均排座失敗"),"error")
					}
				},str({
					"startchip": int(getvalue("randomstartchip")||startchip),
					"mode": "balanced"
				}),[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				])
			})
			onclick("#selectallplayers",function(element,event){
				let checks=document.querySelectorAll(".selectplayer")
				for(let i=0;i<checks.length;i=i+1){
					checks[i].checked=element.checked
				}
			})
		}

		let list=row["registrations"]||[]
		let body=domgetid("reglist")
		let empty=domgetid("empty")

		if(list.length==0){
			body.innerHTML=""
			empty.classList.remove("hidden")
			return
		}

		empty.classList.add("hidden")

		let html=""
		for(let i=0;i<list.length;i=i+1){
			let r=list[i]
			let actions=""
			if(r["status"]=="registered"){
				actions=`
					<button class="confirmbtn bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}">確認</button>
					<button class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}">取消</button>
				`
			}else if(r["status"]=="confirmed"){
				actions=`
					${advancetargets.length?`<button class="advancebtn bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" data-chip="${r["startchip"]||startchip}">晉級</button>`:""}
					<button class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}">取消</button>
				`
			}else if(r["status"]=="advanced"){
				actions=`
					${advancetargets.length?`<button class="advancebtn bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}" data-chip="${r["advancechip"]||r["startchip"]||startchip}">更新籌碼</button>`:""}
					<button class="cancelbtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}">取消</button>
				`
			}else{
				actions=`<button class="confirmbtn bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs" data-id="${r["id"]}">恢復</button>`
			}

			let profitclass=0<=float(r["profit"])?"text-green-400":"text-red-400"
			let seathtml=`<span class="text-zinc-500 text-xs">確認後可排座</span>`
			if(r["status"]=="confirmed"){
				seathtml=`
					<div class="grid grid-cols-[1.4fr_80px_100px] gap-1 min-w-[300px]">
						<select class="seatinput bg-zinc-700 text-white rounded px-2 py-1 text-xs" data-id="${r["id"]}" data-field="tableid">${tableoptions(r["tableid"])}</select>
						<select class="seatinput bg-zinc-700 text-white rounded px-2 py-1 text-xs" data-id="${r["id"]}" data-field="seatno">${seatoptions(r["seatno"],r["tableid"])}</select>
						<input type="number" class="seatinput bg-zinc-700 text-white rounded px-2 py-1 text-xs" data-id="${r["id"]}" data-field="startchip" value="${r["startchip"]||startchip}">
					</div>
				`
			}
			html=html+`
				<tr class="border-t border-zinc-700">
					<td class="px-3 py-2">
						${r["status"]=="confirmed"?`<input type="checkbox" class="selectplayer" value="${r["id"]}">`:""}
					</td>
					<td class="px-3 py-2">#${r["serialno"]||i+1}</td>
					<td class="px-3 py-2">
						<div>${r["playername"]||"-"}</div>
						<div class="text-xs text-zinc-500">${r["playerplayerid"]||""}</div>
					</td>
					<td class="px-3 py-2 text-xs">${formattime(r["registertime"])}</td>
					<td class="px-3 py-2">${statusbadge(r["status"])}</td>
					<td class="px-3 py-2">
						${seathtml}
					</td>
					<td class="px-3 py-2">
						<div class="text-xs text-zinc-400">成本 ${r["cost"]||0} / 名次 ${r["timerplace"]||"-"}</div>
						<div class="text-xs text-zinc-400">自動獎金 ${r["autoprize"]||0}</div>
						${r["advancetargetid"]?`<div class="text-xs text-sky-300">晉級 ${r["advancetargetname"]||"-"} / 籌碼 ${r["advancechip"]||0}</div>`:""}
						${0<int(r["advancecount"])?`<div class="text-xs text-sky-300">重複晉級 ${r["advancecount"]} 次 / 最高 ${r["bestadvancechip"]||0}</div>`:""}
						<div class="${profitclass} font-bold">${moneytext(r["profit"])}</div>
					</td>
					<td class="px-3 py-2">
						${financebuttonhtml(r)}
					</td>
					<td class="px-3 py-2 text-right">${actions}</td>
				</tr>
			`
		}

		body.innerHTML=html
		bindactions()
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function bindactions(){
	onclick(".confirmbtn",function(element,event){
		element.disabled=true
		ajax("PUT",AJAXURL+"confirmsessionplayer/"+dataset(element,"id"),function(event,data){
			if(data["success"]){
				loadregistrations()
			}else{
				pttoast(pterror(data["data"]||"操作失敗"),"error")
				element.disabled=false
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	})

	onclick(".cancelbtn",function(element,event){
		ptconfirm("確定要取消這位玩家的報名嗎?",function(){
			element.disabled=true
			ajax("PUT",AJAXURL+"cancelsessionplayer/"+dataset(element,"id"),function(event,data){
				if(data["success"]){
					loadregistrations()
				}else{
					pttoast(pterror(data["data"]||"操作失敗"),"error")
					element.disabled=false
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	})

	onclick(".advancebtn",function(element,event){
		let sessionplayerid=dataset(element,"id")
		let defaultchip=int(dataset(element,"chip")||startchip)
		askadvancechip(defaultchip,function(chip){
			element.disabled=true
			ajax("PUT",AJAXURL+"advancesessionplayer/"+sessionplayerid,function(event,data){
				element.disabled=false
				if(data["success"]){
					let target=data["data"]["target"]
					let count=data["data"]["advancecount"]||1
					pttoast("已晉級到 "+target["name"]+"，累計晉級 "+count+" 次","success")
					loadregistrations()
				}else{
					pttoast(pterror(data["data"]||"晉級失敗"),"error")
				}
			},str({
				"advancechip": chip
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	})

	let seatinputs=document.querySelectorAll(".seatinput")
	for(let i=0;i<seatinputs.length;i=i+1){
		seatinputs[i].addEventListener("change",function(){
			saveseat(this.dataset.id)
		})
	}

	onclick(".openfinancebtn",function(element,event){
		openfinancemodal(element)
	})
}

function saveseat(sessionplayerid){
	let inputs=document.querySelectorAll(`.seatinput[data-id="${sessionplayerid}"]`)
	let payload={}
	for(let i=0;i<inputs.length;i=i+1){
		let field=inputs[i].dataset.field
		payload[field]=int(inputs[i].value)||0
	}
	ajax("PUT",AJAXURL+"editsessionplayerseat/"+sessionplayerid,function(event,data){
		if(data["success"]){
			loadregistrations()
			let modal=document.getElementById("financemodal")
			if(modal){
				modal.remove()
			}
		}else{
			pttoast(pterror(data["data"]||"儲存座位失敗"),"error")
		}
	},str(payload),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function savefinance(sessionplayerid){
	let inputs=document.querySelectorAll(`.financeinput[data-id="${sessionplayerid}"]`)
	let payload={}
	for(let i=0;i<inputs.length;i=i+1){
		let field=inputs[i].dataset.field
		if(field=="paymenttype"){
			payload[field]=inputs[i].value
		}else if(field=="prizeoverride"&&inputs[i].value===""){
			payload[field]=null
		}else{
			payload[field]=float(inputs[i].value)||0
		}
	}
	ajax("PUT",AJAXURL+"editsessionplayerfinance/"+sessionplayerid,function(event,data){
		if(data["success"]){
			let warnings=(data["data"]&&data["data"]["warnings"])?data["data"]["warnings"]:[]
			for(let i=0;i<warnings.length;i=i+1){
				pttoast(pterror(warnings[i]),"warning")
			}
			loadregistrations()
		}else{
			pttoast(data["data"]||"儲存收益修正失敗","error")
		}
	},str(payload),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

loadregistrations()
