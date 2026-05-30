let sessionid=getget("id")
let tablelinked=false
let currentsession=null
let settingclubs=[]
let settingtypes={
	"game": [],
	"limit": [],
	"stack": [],
	"event": []
}
let settingsessionlist=[]
let relationtype="satellite"
let relationpage={
	"satelliteoutgoing": 1,
	"satelliteincoming": 1,
	"multidayoutgoing": 1,
	"multidayincoming": 1
}
let settingtabkey=WEBLSNAME+"session-setting-tab-"+sessionid
let userchipcolors=[
	{"name": "白色","color": "#ffffff"},
	{"name": "紅色","color": "#ff0000"},
	{"name": "藍色","color": "#0000ff"},
	{"name": "綠色","color": "#008000"},
	{"name": "黑色","color": "#000000"}
]

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function getmyregistrationhtml(row){
	if(!row["myregistration"]){
		return ""
	}
	let registration=row["myregistration"]
	let place=registration["timerplace"]||registration["place"]||"-"
	let cost=registration["cost"]||0
	let prize=registration["finalprize"]||0
	let profit=registration["profit"]||0
	let profitclass=0<=profit?"text-green-400":"text-red-400"
	let payment=registration["paymenttype"]=="ticket"?"票券":"現金"
	return `
		<div><span class="text-zinc-400">我的入場：</span>${cost} (${payment})</div>
		<div><span class="text-zinc-400">我的名次：</span>${place} / ${row["totalbuyin"]||"-"}</div>
		<div><span class="text-zinc-400">我的獎金：</span>${prize}</div>
		<div><span class="text-zinc-400">我的盈虧：</span><span class="${profitclass} font-bold">${0<=profit?"+":""}${profit}</span></div>
	`
}

function caneditstructure(row){
	if(row["isown"]||row["isadmin"]||row["accessrole"]=="assistant"){
		return true
	}
	return false
}

function getstructurebuttonhtml(row){
	if(caneditstructure(row)){
		return `
			<a href="structureedit.html?sessionid=${sessionid}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold">修改結構</a>
		`
	}
	return `
		<a href="structure.html?sessionid=${sessionid}" class="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-sm font-semibold">查看結構</a>
	`
}

ajax("GET",AJAXURL+"getsession/"+sessionid,function(event,data){
	if(data["success"]){
		let row=data["data"]
		currentsession=row
		let winprice=row["winprice"]-(row["buyin"]+(row["rebuybuyin"]*row["rebuycount"]))
		tablelinked=row["tablelinked"]

		innerhtml("#sessiontoken",row["token"],false)
		innerhtml("#info",`
			<div><span class="text-zinc-400">地點：</span>${row["clubname"]}</div>
			<div><span class="text-zinc-400">遊戲類型：</span>${TRANSLATE[LANGUAGE]["gametype"][row["gametype"]]}</div>
			<div><span class="text-zinc-400">買入：</span>${row["buyin"]}${(row["buyin"]!=row["rebuybuyin"])?("/"+row["rebuybuyin"]):""}</div>
			<div><span class="text-zinc-400">手牌數：</span>${"待開發(b1)"}</div>
			<div><span class="text-zinc-400">日期：</span>${row["starttime"].split("T")[0]}</div>
			<div><span class="text-zinc-400">開始：</span>${row["starttime"].split("T")[1].split(":00Z")[0]}</div>
			<div><span class="text-zinc-400">結束：</span>${row["endtime"].split("T")[1].split(":00Z")[0]}</div>
			<div><span class="text-zinc-400">盈虧：</span><span class="${0<=winprice?"text-green-400":"text-red-400"} font-bold">${0<=winprice?"+":""}${winprice}</span></div>
			<div><span class="text-zinc-400">名次：</span>${row["place"]} / ${row["totalbuyin"]}</div>
			${getmyregistrationhtml(row)}
		`)
		innerhtml("#description",row["description"],false)

		// 報名 / 主辦操作區
		renderactionarea(row)
		loadsettingdata()
		if(!domgetid("tab-relations").classList.contains("hidden")){
			renderrelationpage(relationtype)
		}
		loaduserchipcolors()

		ajax("GET",AJAXURL+"gettablelist/"+sessionid,function(event,data){
			if(data["success"]){
				let row=data["data"]

				if(tablelinked&&0<row.length){
					domgetid("newtable").style.display="none"
					domgetid("deletetable").style.display="block"
				}

				for(let i=0;i<row.length;i=i+1){
					innerhtml("#tablemain",`
						<tr class="hover:bg-zinc-700 transition cursor-pointer" onclick="window.location='table.html?id=${row[i]["id"]}'">
							<td>${row[i]["name"]}</td>
							<td>
								${
									tablelinked?`
										-
									`:`
										<a href="edittable.html?id=${row[i]["id"]}" class="text-blue-400 hover:underline">編輯</a>
										<input type="button" class="text-red-400 hover:underline deletetable" data-id="${row[i]["id"]}" value="刪除">
									`
								}
							</td>
						</tr>
					`)
				}

				onclick(".deletetable",function(element,event){
					ptconfirm("確定刪除?",function(){
						event.preventDefault()
						event.stopPropagation()

						element.disabled=true

						ajax("DELETE",AJAXURL+"deletetable/"+dataset(element,"id"),function(event,data){
							if(data["success"]){
								pttoast("刪除成功","success")
								element.parentElement.parentElement.remove()
							}else{
								pttoast("刪除失敗","error")
								element.disabled=false
							}
						},null,[
							["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
						])
					})
				})

				onclick("#deletetable",function(element,event){
					ptconfirm("確定刪除? 此操作無法復原!",function(){
						event.preventDefault()
						event.stopPropagation()

						element.disabled=true

						ajax("DELETE",AJAXURL+"deletetable/"+row[0]["id"],function(event,data){
							if(data["success"]){
								pttoast("刪除成功","success")
								href("")
							}else{
								pttoast("刪除失敗","error")
								element.disabled=false
							}
						},null,[
							["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
						])
					})
				})
			}else{
				innerhtml("#tablemain",`查詢牌桌時遭遇錯誤`,false)
				addclass("#tablemain",["text-red-500","text-center","font-bold","my-1","text-lg"])
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	}else{
		pttoast("查無指定場次","error")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

domgetid("newtable").href="newtable.html?sessionid="+sessionid

// 報名 / 主辦操作區渲染
function renderactionarea(row){
	let area=domgetid("actionarea")
	let title=domgetid("actiontitle")
	let btns=domgetid("actionbuttons")
	let hint=domgetid("actionhint")

	area.classList.remove("hidden")
	btns.innerHTML=""
	hint.textContent=""

	if(!row["owned"]){
		title.textContent="Blind Structure"
		btns.innerHTML=`
			${getstructurebuttonhtml(row)}
		`
		hint.textContent="Use this structure as the default blind source when recording hands."
		return
	}

	if(row["isown"]||row["isadmin"]){
		// 主辦人視角
		title.textContent="主辦操作"
		let buttonshtml=`
			<a href="control.html?sessionid=${sessionid}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold">🎛️ 計時器控制台</a>
			<a href="display.html?sessionid=${sessionid}" target="_blank" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold">📺 顯示頁 (新分頁)</a>
			${getstructurebuttonhtml(row)}
		`
		if(row["linkuser"]){
			buttonshtml=buttonshtml+`
				<a href="registrations.html?sessionid=${sessionid}" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-semibold">👥 報名清單</a>
			`
			hint.textContent="本場次已開放關聯使用者報名"
		}else{
			hint.textContent="本場次未開放關聯使用者報名"
		}
		btns.innerHTML=buttonshtml
		return
	}

	// 非主辦人, 看是不是開放報名
	if(row["accessrole"]=="floor"||row["accessrole"]=="assistant"){
		title.textContent="Staff Actions"
		btns.innerHTML=`
			<a href="control.html?sessionid=${sessionid}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold">Timer Control</a>
			<a href="display.html?sessionid=${sessionid}" target="_blank" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold">Display</a>
			${getstructurebuttonhtml(row)}
		`
		hint.textContent="You can control this session timer."
		return
	}

	if(!row["linkuser"]){
		area.classList.add("hidden")
		return
	}

	title.textContent="報名"
	let mystatus=row["myregistrationstatus"]
	let displaylink=`
		<a href="display.html?sessionid=${sessionid}" target="_blank" class="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-sm font-semibold">顯示計時器</a>
	`

	if(mystatus=="registered"){
		btns.innerHTML=`
			${displaylink}
			<span class="text-yellow-400 font-semibold">⏳ 已報名, 等待主辦確認</span>
			<button class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold" id="unregisterbtn">取消報名</button>
		`
	}else if(mystatus=="confirmed"){
		btns.innerHTML=`
			${displaylink}
			<span class="text-green-400 font-semibold">✅ 已確認入場</span>
			<button class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold" id="unregisterbtn">取消報名</button>
		`
	}else{
		btns.innerHTML=`
			${displaylink}
			<button class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold" id="registerbtn">報名此場次</button>
		`
	}

	onclick("#registerbtn",function(element,event){
		element.disabled=true
		ajax("POST",AJAXURL+"registersession/"+sessionid,function(event,data){
			if(data["success"]){
				pttoast("報名成功，等待主辦確認","success")
				location.reload()
			}else{
				let msg=data["data"]
				if(msg=="ERROR_already_registered"){
					msg="您已經報名過了"
				}else if(msg=="ERROR_cannot_register_own_session"){
					msg="不能報名自己主辦的場次"
				}else if(msg=="ERROR_session_not_open_for_registration"){
					msg="此場次未開放報名"
				}
				pttoast(msg||"未知錯誤","error")
				element.disabled=false
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	})

	onclick("#unregisterbtn",function(element,event){
		ptconfirm("確定要取消報名嗎?",function(){
			element.disabled=true
			ajax("POST",AJAXURL+"unregistersession/"+sessionid,function(event,data){
				if(data["success"]){
					pttoast("已取消報名","success")
					location.reload()
				}else{
					pttoast(pterror(data["data"]||"未知錯誤"),"error")
					element.disabled=false
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	})
}

function settingauthheaders(){
	return [
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	]
}

function optionhtml(rows,selected,labelkey){
	let html=""
	for(let i=0;i<rows.length;i=i+1){
		let text=rows[i]["name"]||rows[i]["code"]||rows[i]["id"]
		if(labelkey&&TRANSLATE[LANGUAGE]["type"]&&TRANSLATE[LANGUAGE]["type"][labelkey]&&TRANSLATE[LANGUAGE]["type"][labelkey][rows[i]["code"]]){
			text=TRANSLATE[LANGUAGE]["type"][labelkey][rows[i]["code"]]
		}
		html=html+`<option value="${rows[i]["id"]}" ${String(selected)==String(rows[i]["id"])?"selected":""}>${text}</option>`
	}
	return html
}

function loadsettingdata(){
	ajax("GET",AJAXURL+"getclublist",function(event,data){
		if(data["success"]){
			settingclubs=data["data"]||[]
			rendersettings(getactivesettingtab())
		}
	},null,settingauthheaders())
	ajax("GET",AJAXURL+"gettypelist",function(event,data){
		if(data["success"]){
			settingtypes=data["data"]
			rendersettings(getactivesettingtab())
		}
	},null,settingauthheaders())
	ajax("GET",AJAXURL+"getsessionlist?limit=200",function(event,data){
		if(data["success"]){
			let payload=data["data"]
			settingsessionlist=payload["sessions"]||payload||[]
			let active=document.querySelector(".settings-side-btn.bg-emerald-600")
			if(active&&active.dataset.setting=="relation"){
				rendersettings("relation")
			}
		}
	},null,settingauthheaders())
}

function getactivesettingtab(){
	let saved=localStorage.getItem(settingtabkey)
	if(saved=="game"||saved=="delete"){
		return saved
	}
	let active=document.querySelector(".settings-side-btn.bg-emerald-600")
	if(active&&active.dataset.setting){
		return active.dataset.setting
	}
	return "general"
}

function loaduserchipcolors(){
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(data["success"]){
			userchipcolors=data["data"]["chipcolors"]||userchipcolors
			if(getactivesettingtab()=="game"){
				rendersettings("game")
			}
		}
	},null,settingauthheaders())
}

function settingdate(value){
	if(!value){
		return ""
	}
	return value.split("T")[0]
}

function settingtime(value){
	if(!value||value.indexOf("T")==-1){
		return ""
	}
	return value.split("T")[1].split("Z")[0].split("+")[0]
}

function chipcoloroptions(selected){
	let html=""
	for(let i=0;i<userchipcolors.length;i=i+1){
		let color=userchipcolors[i]["color"]
		let name=userchipcolors[i]["name"]||color
		html=html+`<option value="${color}" ${String(selected).toLowerCase()==String(color).toLowerCase()?"selected":""}>${name}</option>`
	}
	return html
}

function chiprowhtml(chip){
	chip=chip||{
		"shape": "circle",
		"value": 100,
		"color": "#ffffff"
	}
	return `
		<div class="grid grid-cols-[90px_1fr_120px_40px] gap-2 chiprow">
			<select class="setchipshape bg-zinc-700 text-white rounded px-2 py-2">
				<option value="circle" ${chip["shape"]!="square"?"selected":""}>圓形</option>
				<option value="square" ${chip["shape"]=="square"?"selected":""}>方形</option>
			</select>
			<input type="number" class="setchipvalue bg-zinc-700 text-white rounded px-2 py-2" value="${chip["value"]||0}">
			<select class="setchipcolor bg-zinc-700 text-white rounded px-2 py-2">${chipcoloroptions(chip["color"]||"#ffffff")}</select>
			<button class="removechiprow bg-red-600 hover:bg-red-700 rounded">×</button>
		</div>
	`
}

function rendersettings(tab){
	if(!currentsession||!domgetid("settingscontent")){
		return
	}
	localStorage.setItem(settingtabkey,tab)
	let buttons=document.querySelectorAll(".settings-side-btn")
	for(let i=0;i<buttons.length;i=i+1){
		buttons[i].classList.remove("bg-emerald-600","text-white")
		buttons[i].classList.add("text-zinc-300")
		if(buttons[i].dataset.setting==tab){
			buttons[i].classList.add("bg-emerald-600","text-white")
			buttons[i].classList.remove("text-zinc-300")
		}
	}
	if(tab=="general"){
		rendersettinggeneral()
	}else if(tab=="game"){
		rendersettinggame()
	}else{
		rendersettingdelete()
	}
}

function rendersettinggeneral(){
	let clubhtml=optionhtml(settingclubs,currentsession["clubid"],"")
	let gametypehtml=optionhtml(settingtypes["game"]||[],currentsession["gametypeid"],"game")
	let limithtml=optionhtml(settingtypes["limit"]||[],currentsession["limittypeid"],"limit")
	let stackhtml=optionhtml(settingtypes["stack"]||[],currentsession["stacktypeid"],"stack")
	let eventhtml=optionhtml(settingtypes["event"]||[],currentsession["eventtypeid"],"event")
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4">一般</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<label class="block text-sm text-zinc-300">名稱<input id="setname" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["name"]||""}"></label>
			<label class="block text-sm text-zinc-300">地點<select id="setclubid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${clubhtml}</select></label>
			<label class="block text-sm text-zinc-300">開始日期<input type="date" id="setdate" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${settingdate(currentsession["starttime"])}"></label>
			<div class="grid grid-cols-2 gap-2">
				<label class="block text-sm text-zinc-300">開始時間<input type="time" step="1" id="setstarttime" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${settingtime(currentsession["starttime"])}"></label>
				<label class="block text-sm text-zinc-300">結束時間<input type="time" step="1" id="setendtime" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${settingtime(currentsession["endtime"])}"></label>
			</div>
			<label class="block text-sm text-zinc-300">遊戲類型<select id="setgametypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${gametypehtml}</select></label>
			<label class="block text-sm text-zinc-300">限注類型<select id="setlimittypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${limithtml}</select></label>
			<label class="block text-sm text-zinc-300">籌碼類型<select id="setstacktypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${stackhtml}</select></label>
			<label class="block text-sm text-zinc-300">賽事細項<select id="seteventtypeid" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2">${eventhtml}</select></label>
			<label class="block text-sm text-zinc-300">起始籌碼<input type="number" id="setchip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["chip"]||0}"></label>
			<label class="block text-sm text-zinc-300">每桌座位數<input type="number" min="2" max="10" id="setmaxseat" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["maxseat"]||9}"></label>
			<div class="grid grid-cols-2 gap-2 items-end">
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setowned" ${currentsession["owned"]?"checked":""}>主辦牌局</label>
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setlinkuser" ${currentsession["linkuser"]?"checked":""}>使用者連結</label>
				<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setopenregistration" ${currentsession["openregistration"]?"checked":""}>開放報名</label>
			</div>
			<label class="block text-sm text-zinc-300 md:col-span-2">備註<textarea id="setdescription" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2 resize-none" rows="3">${currentsession["description"]||""}</textarea></label>
		</div>
		<div class="text-right mt-4"><button id="savesettinggeneral" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">儲存一般設定</button></div>
	`,false)
	onclick("#savesettinggeneral",function(element,event){
		savesettings(element,{
			"name": getvalue("setname"),
			"clubid": getvalue("setclubid"),
			"starttime": getvalue("setdate")+" "+getvalue("setstarttime")+"+00:00",
			"endtime": getvalue("setdate")+" "+getvalue("setendtime")+"+00:00",
			"gametypeid": getvalue("setgametypeid"),
			"limittypeid": getvalue("setlimittypeid"),
			"stacktypeid": getvalue("setstacktypeid"),
			"eventtypeid": getvalue("seteventtypeid"),
			"chip": float(getvalue("setchip")||0),
			"maxseat": int(getvalue("setmaxseat")||9),
			"owned": domgetid("setowned").checked,
			"linkuser": domgetid("setlinkuser").checked,
			"openregistration": domgetid("setopenregistration").checked,
			"description": getvalue("setdescription")
		})
	})
}

function rendersettinggame(){
	let chiprows=currentsession["chips"]||[]
	let chiphtml=""
	for(let i=0;i<chiprows.length;i=i+1){
		chiphtml=chiphtml+chiprowhtml(chiprows[i])
	}
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4">牌局設定</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<label class="block text-sm text-zinc-300">買入費<input type="number" id="setbuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["buyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">買入服務費<input type="number" id="setbuyinfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["buyinfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">買入籌碼<input type="number" id="setchip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["chip"]||0}"></label>
			<label class="block text-sm text-zinc-300">重購費<input type="number" id="setrebuybuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["rebuybuyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">重購服務費<input type="number" id="setrebuyfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["rebuyfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">重購籌碼<input type="number" id="setrebuychip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["rebuychip"]||0}"></label>
			<label class="block text-sm text-zinc-300">再入費<input type="number" id="setreentrybuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["reentrybuyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">再入服務費<input type="number" id="setreentryfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["reentryfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">再入籌碼<input type="number" id="setreentrychip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["reentrychip"]||0}"></label>
			<label class="block text-sm text-zinc-300">增購費<input type="number" id="setaddonbuyin" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["addonbuyin"]||0}"></label>
			<label class="block text-sm text-zinc-300">增購服務費<input type="number" id="setaddonfee" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["addonfee"]||0}"></label>
			<label class="block text-sm text-zinc-300">增購籌碼<input type="number" id="setaddonchip" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["addonchip"]||0}"></label>
			<label class="block text-sm text-zinc-300">重購次數<input type="number" id="setrebuycount" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["rebuycount"]||0}"></label>
			<label class="block text-sm text-zinc-300">再入次數<input type="number" id="setreentrycount" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["reentrycount"]||0}"></label>
			<label class="block text-sm text-zinc-300">增購次數<input type="number" id="setaddoncount" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["addoncount"]||0}"></label>
			<label class="block text-sm text-zinc-300">票券價值<input type="number" id="setticketvalue" class="mt-1 w-full bg-zinc-700 text-white rounded px-3 py-2" value="${currentsession["ticketvalue"]||0}"></label>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="radio" name="setantemode" value="bigblindante" ${currentsession["antemode"]!="ante"?"checked":""}>大盲前注</label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="radio" name="setantemode" value="ante" ${currentsession["antemode"]=="ante"?"checked":""}>前注</label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setunifiedhandrecord" ${currentsession["unifiedhandrecord"]?"checked":""}>統一紀錄手牌</label>
			<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" id="setticketenabled" ${currentsession["ticketenabled"]?"checked":""}>允許票券買入</label>
		</div>
		<div class="mt-6">
			<div class="flex justify-between items-center mb-2">
				<div class="font-semibold text-zinc-200">使用籌碼面額</div>
				<button id="addchiprow" class="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded text-sm">新增籌碼</button>
			</div>
			<div id="chiprows" class="space-y-2">${chiphtml}</div>
		</div>
		<div class="text-right mt-4"><button id="savesettinggame" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">儲存牌局設定</button></div>
	`,false)
	onclick("#addchiprow",function(element,event){
		domgetid("chiprows").insertAdjacentHTML("beforeend",chiprowhtml())
		bindchipremove()
	})
	bindchipremove()
	onclick("#savesettinggame",function(element,event){
		let antemode=document.querySelector("input[name='setantemode']:checked").value
		savesettings(element,{
			"buyin": float(getvalue("setbuyin")||0),
			"buyinfee": float(getvalue("setbuyinfee")||0),
			"chip": float(getvalue("setchip")||0),
			"rebuycount": float(getvalue("setrebuycount")||0),
			"rebuybuyin": float(getvalue("setrebuybuyin")||0),
			"rebuyfee": float(getvalue("setrebuyfee")||0),
			"rebuychip": float(getvalue("setrebuychip")||0),
			"reentrycount": float(getvalue("setreentrycount")||0),
			"reentrybuyin": float(getvalue("setreentrybuyin")||0),
			"reentryfee": float(getvalue("setreentryfee")||0),
			"reentrychip": float(getvalue("setreentrychip")||0),
			"addoncount": float(getvalue("setaddoncount")||0),
			"addonbuyin": float(getvalue("setaddonbuyin")||0),
			"addonfee": float(getvalue("setaddonfee")||0),
			"addonchip": float(getvalue("setaddonchip")||0),
			"ticketenabled": domgetid("setticketenabled").checked,
			"ticketvalue": float(getvalue("setticketvalue")||0),
			"antemode": antemode,
			"unifiedhandrecord": domgetid("setunifiedhandrecord").checked,
			"chips": getsettingchips()
		})
	})
}

function bindchipremove(){
	onclick(".removechiprow",function(element,event){
		element.parentElement.remove()
	})
}

function getsettingchips(){
	let rows=document.querySelectorAll(".chiprow")
	let chips=[]
	for(let i=0;i<rows.length;i=i+1){
		chips.push({
			"shape": rows[i].querySelector(".setchipshape").value,
			"value": int(rows[i].querySelector(".setchipvalue").value)||0,
			"color": rows[i].querySelector(".setchipcolor").value
		})
	}
	return chips
}

function relationoptions(type){
	let selected={}
	let rows=currentsession["relations"]||[]
	for(let i=0;i<rows.length;i=i+1){
		if(rows[i]["relationtype"]==type){
			selected[rows[i]["targetid"]]=true
		}
	}
	let html=""
	for(let i=0;i<settingsessionlist.length;i=i+1){
		let item=settingsessionlist[i]
		if(String(item["id"])==String(sessionid)){
			continue
		}
		html=html+`<label class="flex items-center gap-2 bg-zinc-700/40 rounded px-3 py-2"><input type="checkbox" class="relationcheck" data-type="${type}" value="${item["id"]}" ${selected[item["id"]]?"checked":""}>${item["name"]} #${item["token"]}</label>`
	}
	if(!html){
		html=`<div class="text-zinc-500">沒有可關聯的賽事</div>`
	}
	return html
}

function rendersettingrelation(){
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4">賽事關聯</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<div class="font-semibold text-zinc-200 mb-2">衛星賽關聯</div>
				<div class="space-y-2 max-h-64 overflow-auto">${relationoptions("satellite")}</div>
				<button class="mt-3 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded" id="savesatellite">儲存衛星賽關聯</button>
			</div>
			<div>
				<div class="font-semibold text-zinc-200 mb-2">多日賽關聯</div>
				<div class="space-y-2 max-h-64 overflow-auto">${relationoptions("multiday")}</div>
				<button class="mt-3 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded" id="savemultiday">儲存多日賽關聯</button>
			</div>
		</div>
	`,false)
	onclick("#savesatellite",function(element,event){
		saverelations(element,"satellite")
	})
	onclick("#savemultiday",function(element,event){
		saverelations(element,"multiday")
	})
}

function rendersettingdelete(){
	innerhtml("#settingscontent",`
		<div class="text-lg font-semibold mb-4 text-red-300">刪除賽事</div>
		<div class="text-zinc-300 mb-4">刪除後此賽事不會再出現在列表中。</div>
		<button id="deletesessionfromsettings" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">刪除賽事</button>
	`,false)
	onclick("#deletesessionfromsettings",function(element,event){
		ptconfirm("確定刪除此賽事?",function(ok){
			if(!ok){
				return
			}
			element.disabled=true
			ajax("DELETE",AJAXURL+"deletesession/"+sessionid,function(event,data){
				if(data["success"]){
					pttoast("刪除成功")
					href("sessionlist.html")
				}else{
					pttoast(data["data"]||"刪除失敗","error")
					element.disabled=false
				}
			},null,settingauthheaders())
		})
	})
}

function savesettings(element,payload){
	element.disabled=true
	ajax("PUT",AJAXURL+"editsessionsettings/"+sessionid,function(event,data){
		element.disabled=false
		if(data["success"]){
			for(let key in payload){
				currentsession[key]=payload[key]
			}
			if(data["data"]){
				for(let key in data["data"]){
					currentsession[key]=data["data"][key]
				}
			}
			pttoast("儲存成功")
		}else{
			pttoast(data["data"]||"儲存失敗","error")
		}
	},str(payload),settingauthheaders())
}

function saverelations(element,type){
	let checks=document.querySelectorAll(`.relationcheck[data-type="${type}"]:checked`)
	let ids=[]
	for(let i=0;i<checks.length;i=i+1){
		ids.push(int(checks[i].value))
	}
	element.disabled=true
	ajax("PUT",AJAXURL+"editsessionrelations/"+sessionid,function(event,data){
		element.disabled=false
		if(data["success"]){
			currentsession["relations"]=data["data"]
			pttoast("儲存成功","success")
			rendersettingrelation()
		}else{
			pttoast(pterror(data["data"]||"儲存失敗"),"error")
		}
	},str({
		"relationtype": type,
		"targetids": ids
	}),settingauthheaders())
}

function renderrelationpage(type){
	relationtype=type||relationtype
	if(!currentsession){
		innerhtml("#relationscontent",`
			<div class="text-zinc-400 text-sm">賽事資料載入中...</div>
		`,false)
		return
	}
	let data=currentsession["relationdata"]||{
		"outgoing": currentsession["relations"]||[],
		"incoming": []
	}
	innerhtml("#relationscontent",`
		<div class="flex flex-wrap gap-2 mb-4">
			<button class="relationtypebtn ${relationtype=="satellite"?"bg-emerald-600":"bg-zinc-700"} px-4 py-2 rounded" data-type="satellite">衛星賽</button>
			<button class="relationtypebtn ${relationtype=="multiday"?"bg-emerald-600":"bg-zinc-700"} px-4 py-2 rounded" data-type="multiday">多日賽</button>
		</div>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			${relationpanel("outgoing",data,relationtype)}
			${relationpanel("incoming",data,relationtype)}
		</div>
	`,false)
	onclick(".relationtypebtn",function(element,event){
		renderrelationpage(dataset(element,"type"))
	})
	bindrelationpanel("outgoing",relationtype)
	bindrelationpanel("incoming",relationtype)
	loadrelationsearch("outgoing",relationtype)
	loadrelationsearch("incoming",relationtype)
}

function relationpanel(direction,data,type){
	let title=direction=="outgoing"?"本賽事通往其他賽事":"其他賽事通往本賽事"
	let desc=type=="satellite"?"衛星賽：source 可取得 target 票券":"多日賽：source 晉級 target"
	let rows=data[direction]||[]
	let selected=[]
	for(let i=0;i<rows.length;i=i+1){
		if(rows[i]["relationtype"]==type){
			let name=direction=="outgoing"?rows[i]["targetname"]:rows[i]["sourcename"]
			let token=direction=="outgoing"?rows[i]["targettoken"]:rows[i]["sourcetoken"]
			let id=direction=="outgoing"?rows[i]["targetid"]:rows[i]["sourceid"]
			selected.push(`<span class="inline-flex items-center gap-2 bg-zinc-700 rounded px-2 py-1 text-xs">${name} #${token}<button class="removerelation text-red-300" data-type="${type}" data-direction="${direction}" data-id="${id}">×</button></span>`)
		}
	}
	return `
		<div class="border border-zinc-700 rounded p-4">
			<div class="font-semibold text-zinc-100">${title}</div>
			<div class="text-xs text-zinc-500 mb-3">${desc}</div>
			<div class="flex flex-wrap gap-2 mb-3 min-h-8" id="selected-${direction}">${selected.join("")||"<span class='text-zinc-500 text-sm'>尚未建立關聯</span>"}</div>
			<div class="flex gap-2 mb-2">
				<input class="relationkeyword flex-1 bg-zinc-700 rounded px-3 py-2" data-type="${type}" data-direction="${direction}" placeholder="搜尋賽事名稱 / token">
				<button class="relationsearch bg-sky-600 hover:bg-sky-700 rounded px-3" data-type="${type}" data-direction="${direction}">搜尋</button>
			</div>
			<div class="relationresult space-y-2" id="relationresult-${direction}"></div>
			<div class="relationpager flex gap-2 mt-3" id="relationpager-${direction}"></div>
		</div>
	`
}

function bindrelationpanel(direction,type){
	onclick(`.relationsearch[data-direction="${direction}"][data-type="${type}"]`,function(element,event){
		let thistype=dataset(element,"type")
		relationpage[thistype+direction]=1
		loadrelationsearch(direction,thistype)
	})
	onclick(`.removerelation[data-direction="${direction}"][data-type="${type}"]`,function(element,event){
		let direction=dataset(element,"direction")
		let thistype=dataset(element,"type")
		let id=dataset(element,"id")
		let ids=[]
		let rows=(currentsession["relationdata"]||{})[direction]||[]
		for(let i=0;i<rows.length;i=i+1){
			if(rows[i]["relationtype"]==thistype){
				let rowid=direction=="outgoing"?rows[i]["targetid"]:rows[i]["sourceid"]
				if(String(rowid)!=String(id)){
					ids.push(rowid)
				}
			}
		}
		saverelationdirection(direction,ids,thistype)
	})
}

function loadrelationsearch(direction,type){
	type=type||relationtype
	let key=type+direction
	let page=relationpage[key]||1
	let keyword=""
	let input=document.querySelector(`.relationkeyword[data-direction="${direction}"][data-type="${type}"]`)
	if(input){
		keyword=input.value
	}
	ajax("GET",AJAXURL+"searchsessionrelations/"+sessionid+"?page="+page+"&limit=6&keyword="+encodeURIComponent(keyword),function(event,data){
		if(!data["success"]){
			pttoast(data["data"]||"搜尋失敗","error")
			return
		}
		let rows=data["data"]["sessions"]||[]
		let html=""
		for(let i=0;i<rows.length;i=i+1){
			html=html+`
				<div class="flex justify-between items-center bg-zinc-700/40 rounded px-3 py-2">
					<div><div>${rows[i]["name"]}</div><div class="text-xs text-zinc-500">#${rows[i]["token"]}</div></div>
					<button class="addrelation bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-sm" data-type="${type}" data-direction="${direction}" data-id="${rows[i]["id"]}">加入</button>
				</div>
			`
		}
		innerhtml("#relationresult-"+direction,html||"<div class='text-zinc-500 text-sm'>沒有符合的賽事</div>",false)
		let pg=data["data"]["pagination"]
		innerhtml("#relationpager-"+direction,`
			<button class="relationpagebtn bg-zinc-700 px-3 py-1 rounded" data-type="${type}" data-direction="${direction}" data-page="${page-1}" ${pg["hasprev"]?"":"disabled"}>上一頁</button>
			<span class="text-sm text-zinc-400 py-1">${pg["page"]}/${pg["totalpages"]}</span>
			<button class="relationpagebtn bg-zinc-700 px-3 py-1 rounded" data-type="${type}" data-direction="${direction}" data-page="${page+1}" ${pg["hasnext"]?"":"disabled"}>下一頁</button>
		`,false)
		onclick(`.relationpagebtn[data-direction="${direction}"][data-type="${type}"]`,function(element,event){
			let direction=dataset(element,"direction")
			let thistype=dataset(element,"type")
			relationpage[thistype+direction]=int(dataset(element,"page"))
			loadrelationsearch(direction,thistype)
		})
		onclick(`.addrelation[data-direction="${direction}"][data-type="${type}"]`,function(element,event){
			addrelation(dataset(element,"direction"),int(dataset(element,"id")),dataset(element,"type"))
		})
	},null,settingauthheaders())
}

function addrelation(direction,id,type){
	type=type||relationtype
	let ids=[]
	let rows=(currentsession["relationdata"]||{})[direction]||[]
	for(let i=0;i<rows.length;i=i+1){
		if(rows[i]["relationtype"]==type){
			ids.push(direction=="outgoing"?rows[i]["targetid"]:rows[i]["sourceid"])
		}
	}
	if(type=="multiday"&&direction=="outgoing"){
		ids=[id]
	}else if(ids.indexOf(id)==-1){
		ids.push(id)
	}
	saverelationdirection(direction,ids,type)
}

function saverelationdirection(direction,ids,type){
	type=type||relationtype
	ajax("PUT",AJAXURL+"editsessionrelations/"+sessionid,function(event,data){
		if(data["success"]){
			currentsession["relationdata"]=data["data"]
			currentsession["relations"]=data["data"]["outgoing"]||[]
			pttoast("儲存成功")
			renderrelationpage(type)
		}else{
			pttoast(data["data"]||"儲存失敗","error")
		}
	},str({
		"relationtype": type,
		"direction": direction,
		"targetids": ids
	}),settingauthheaders())
}

onclick(".settings-side-btn",function(element,event){
	rendersettings(dataset(element,"setting"))
})

onclick("#back",function(element,event){
	href("sessionlist.html")
})

// 頁籤切換
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(btn => {
	btn.addEventListener('click', () => {
		tabBtns.forEach(b => b.classList.remove('border-emerald-400', 'text-emerald-400'));
		btn.classList.add('border-emerald-400', 'text-emerald-400');
		const tab = btn.getAttribute('data-tab');
		tabContents.forEach(tc => tc.classList.add('hidden'));
		document.getElementById('tab-' + tab).classList.remove('hidden');
		if(tab=="relations"){
			renderrelationpage(relationtype)
		}
		href("#"+tab)
	});
});
// 預設顯示第一個頁籤

let sessionhash=location.hash.substring(1)
let sessiontab=document.querySelector('.tab-btn[data-tab="'+sessionhash+'"]')
if(!sessiontab&&sessionhash!=""){
	sessiontab=document.querySelectorAll('.tab-btn')[int(sessionhash)||0]
}
if(!sessiontab){
	sessiontab=document.querySelectorAll('.tab-btn')[0]
}
sessiontab.click()
// tabBtns[location.hash.substring(1)??0].classList.add('border-emerald-400', 'text-emerald-400');
// EV圖假資料
if (document.getElementById('evChart')) {
	var myChart = echarts.init(document.getElementById('evChart'));
	var option = {
		tooltip: { trigger: 'axis' },
		xAxis: { type: 'category', data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
		yAxis: { type: 'value' },
		series: [{
			name: 'EV',
			type: 'line',
			smooth: true,
			data: [0, 100, 200, 150, 300, 250, 400, 350, 500, 600],
			areaStyle: { color: '#22d3ee', opacity: 0.2 },
			lineStyle: { color: '#22d3ee' },
			itemStyle: { color: '#22d3ee' }
		}]
	};
	myChart.setOption(option);
}
// 動態座位事件流資料
let seatEvents = [
	{
		seat: 1,
		history: [
			{ type: '入座', player: 'Hero', time: '19:00', buyin: 2000 },
			{ type: '離席', player: 'Hero', time: '20:30' },
			{ type: '入座', player: '玩家B', time: '20:35', buyin: 2000 },
			{ type: '重新買入', player: '玩家B', time: '21:10', buyin: 1000 }
		]
	},
	{
		seat: 2,
		history: [
			{ type: '入座', player: '玩家C', time: '19:00', buyin: 2000 }
		]
	},
	{
		seat: 3,
		history: []
	},
	{
		seat: 4,
		history: [
			{ type: '入座', player: '玩家D', time: '19:00', buyin: 2000 },
			{ type: '重新買入', player: '玩家D', time: '20:50', buyin: 1000 }
		]
	},
	{ seat: 5, history: [] },
	{ seat: 6, history: [] },
	{ seat: 7, history: [] },
	{ seat: 8, history: [] },
	{ seat: 9, history: [] }
];
// 新增事件
window.addSeatEvent = function (e, seatIdx) {
	e.preventDefault();
	const form = e.target;
	const type = form.type.value;
	const player = form.player.value.trim();
	const time = form.time.value;
	const buyin = form.buyin.value ? parseInt(form.buyin.value) : undefined;
	if (!player && (type === '入座' || type === '換人' || type === '重新買入')) {
		pttoast('請輸入玩家名稱',"warning"); return;
	}
	if ((type === '入座' || type === '重新買入') && !buyin) {
		pttoast('請輸入買入金額',"warning"); return;
	}
	seatEvents[seatIdx].history.push({ type, player, time, buyin });
	renderSeatEventTable(parseInt(document.getElementById('max-seat-select').value));
}
// 刪除事件
window.removeSeatEvent = function (seatIdx, eventIdx) {
	seatEvents[seatIdx].history.splice(eventIdx, 1);
	renderSeatEventTable(parseInt(document.getElementById('max-seat-select').value));
}
