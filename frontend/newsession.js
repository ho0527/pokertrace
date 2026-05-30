if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function slimnewsessionform(){
	let hideids=[
		"chip",
		"rebuychip",
		"reentrycount",
		"reentrybuyin",
		"reentryfee",
		"reentrychip",
		"addoncount",
		"addonbuyin",
		"addonfee",
		"addonchip",
		"description",
		"gametype",
		"limittype",
		"stacktype",
		"eventtype"
	]
	for(let i=0;i<hideids.length;i=i+1){
		let element=domgetid(hideids[i])
		if(element){
			let box=element.parentElement
			if(hideids[i]=="owned"){
				box=element.parentElement
			}
			if(box){
				box.style.display="none"
			}
		}
	}
	let gametype=domgetid("gametype")
	if(gametype&&gametype.parentElement&&gametype.parentElement.parentElement){
		gametype.parentElement.parentElement.style.display="none"
	}
	let stacktype=domgetid("stacktype")
	if(stacktype&&stacktype.parentElement&&stacktype.parentElement.parentElement){
		stacktype.parentElement.parentElement.style.display="none"
	}
	let ownedfields=domgetid("ownedfields")
	if(ownedfields){
		ownedfields.classList.add("hidden")
	}
	let labels=document.querySelectorAll("label")
	for(let i=0;i<labels.length;i=i+1){
		if(labels[i].getAttribute("for")=="description"){
			labels[i].style.display="none"
		}
	}
}

slimnewsessionform()

// 切換主辦/個人模式
// owned=true: 顯示 #ownedfields, 隱藏 #personalfields, 改 .ownedlabel 文字
// owned=false: 反之
function switchownedmode(checked){
	let ownedblock=domgetid("ownedfields")
	let personalblock=domgetid("personalfields")
	let labels=document.querySelectorAll(".ownedlabel")

	if(checked){
		ownedblock.classList.remove("hidden")
		personalblock.classList.add("hidden")
		// 改共用區欄位的 label 文字
		for(let i=0;i<labels.length;i=i+1){
			let txt=labels[i].textContent
			if(txt=="買入費"){
				labels[i].textContent="買入費 (主辦設定)"
			}
			if(txt=="買入籌碼"){
				labels[i].textContent="買入籌碼 (主辦設定)"
			}
			if(txt=="重購次數"){
				labels[i].textContent="重購次數 (主辦設定)"
			}
			if(txt=="重購費"){
				labels[i].textContent="重購費 (主辦設定)"
			}
		}
	}else{
		ownedblock.classList.add("hidden")
		personalblock.classList.remove("hidden")
		// 還原 label
		for(let i=0;i<labels.length;i=i+1){
			let id=labels[i].parentElement.getAttribute("for")
			if(id=="buyin"){
				labels[i].textContent="買入費"
			}
			if(id=="chip"){
				labels[i].textContent="買入籌碼"
			}
			if(id=="rebuycount"){
				labels[i].textContent="重購次數"
			}
			if(id=="rebuybuyin"){
				labels[i].textContent="重購費"
			}
		}
	}
}

function loadtempdata(){
	let sessiontemp=weblsget(WEBLSNAME+"sessiontemp")

	if(sessiontemp){
		sessiontemp=json(sessiontemp)

		value("#name",sessiontemp["name"])
		value("#gametype",sessiontemp["gametype"])
		value("#clubid",sessiontemp["clubid"])
		value("#buyin",sessiontemp["buyin"])
		value("#chip",sessiontemp["chip"])
		value("#rebuycount",sessiontemp["rebuycount"])
		value("#rebuybuyin",sessiontemp["rebuybuyin"])
		value("#winprice",sessiontemp["winprice"])
		value("#winthing",sessiontemp["winthing"])
		value("#place",sessiontemp["place"])
		value("#totalbuyin",sessiontemp["totalbuyin"])
		// value("#date",sessiontemp["starttime"].split("T")[0])
		value("#starttime",sessiontemp["starttime"].split("T")[1].split(":00Z")[0])
		value("#endtime",sessiontemp["endtime"].split("T")[1].split(":00Z")[0])
		value("#description",sessiontemp["description"])

		if(sessiontemp["owned"]==true){
			domgetid("owned").checked=true
			switchownedmode(true)
		}
	}
}

ajax("GET",AJAXURL+"getclublist",function(event,data){
	if(data["success"]){
		let row=data["data"]

		for(let i=0;i<row.length;i=i+1){
			innerhtml("#clubid",`
				<option value="${row[i]["id"]}">${row[i]["name"]}(${row[i]["ps"]})</option>
			`)
		}

		loadtempdata()
	}else{
		pttoast("權限已失效，請重新登入","error")
		weblsset(WEBLSNAME+"signin",null)
		weblsset(WEBLSNAME+"token",null)
		href("signin.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

ajax("GET",AJAXURL+"gettypelist",function(event,data){
	if(data["success"]){
		let gametyperow=data["data"]["game"]
		let limittyperow=data["data"]["limit"]
		let stacktyperow=data["data"]["stack"]
		let eventtyperow=data["data"]["event"]

		// 填充遊戲類型
		for(let i=0;i<gametyperow.length;i=i+1){
			innerhtml("#gametype",`
				<option value="${gametyperow[i]["id"]}">${TRANSLATE[LANGUAGE]["type"]["game"][gametyperow[i]["code"]]}</option>
			`)
		}

		// 填充限注類型
		for(let i=0;i<limittyperow.length;i=i+1){
			innerhtml("#limittype",`
				<option value="${limittyperow[i]["id"]}">${TRANSLATE[LANGUAGE]["type"]["limit"][limittyperow[i]["code"]]}</option>
			`)
		}

		// 填充籌碼類型
		for(let i=0;i<stacktyperow.length;i=i+1){
			innerhtml("#stacktype",`
				<option value="${stacktyperow[i]["id"]}">${TRANSLATE[LANGUAGE]["type"]["stack"][stacktyperow[i]["code"]]}</option>
			`)
		}

		// 填充賽事類型
		for(let i=0;i<eventtyperow.length;i=i+1){
			innerhtml("#eventtype",`
				<option value="${eventtyperow[i]["id"]}">${TRANSLATE[LANGUAGE]["type"]["event"][eventtyperow[i]["code"]]}</option>
			`)
		}

		loadtempdata()
	}else{
		pttoast("權限已失效，請重新登入","error")
		weblsset(WEBLSNAME+"signin",null)
		weblsset(WEBLSNAME+"token",null)
		href("signin.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

value("#date",new Date().toISOString().split("T")[0])

oninput("#buyin",function(element,event){
	value("#rebuybuyin",getvalue("buyin"))
})

oninput("#buyinfee",function(element,event){
	value("#rebuyfee",getvalue("buyinfee"))
})

onchange("#owned",function(element,event){
	switchownedmode(element.checked)
})

onsubmit("#form",function(element,event){
	let timezone="+00:00"

	event.preventDefault()

	domgetid("submit").disabled=true

	let isowned=domgetid("owned").checked
	let islinkuser=false
	let isopenregistration=false
	if(isowned&&domgetid("linkuser")){
		islinkuser=domgetid("linkuser").checked
	}
	if(islinkuser&&domgetid("openregistration")){
		isopenregistration=domgetid("openregistration").checked
	}
	let isinmoney=domgetid("inmoney").checked
	let isinft=domgetid("inft").checked

	ajax("POST",AJAXURL+"newsession",function(event,data){
		if(data["success"]){
			pttoast("新增成功","success")
			weblsset(WEBLSNAME+"sessiontemp",null)
			if(data["data"]){
				href("session.html?id="+data["data"]+"#settings")
			}else{
				href("sessionlist.html")
			}
		}else{
			innertext("#error",pterror(data["data"]),false)
			pttoast(pterror(data["data"]),"error")
			domgetid("submit").disabled=false
		}
	},str({
		"name": getvalue("name"),
		"gametype": getvalue("gameeventtype"),
		"clubid": getvalue("clubid"),
		"buyin": float(getvalue("buyin")),
		"buyinfee": float(getvalue("buyinfee")||0),
		"chip": 0,
		"rebuycount": float(getvalue("rebuycount")),
		"rebuybuyin": float(getvalue("rebuybuyin")),
		"rebuyfee": float(getvalue("rebuyfee")||0),
		"rebuychip": 0,
		"reentrycount": 0,
		"reentrybuyin": 0,
		"reentryfee": 0,
		"reentrychip": 0,
		"addoncount": 0,
		"addonbuyin": 0,
		"addonfee": 0,
		"addonchip": 0,
		"linkuser": islinkuser,
		"openregistration": isopenregistration,
		"winprice": float(getvalue("winprice")),
		"winthing": getvalue("winthing"),
		"inmoney": isinmoney,
		"inft": isinft,
		"place": getvalue("place"),
		"totalbuyin": getvalue("totalbuyin"),
		"owned": isowned,
		"starttime": `${getvalue("date")} ${getvalue("starttime")}${timezone}`,
		"endtime": `${getvalue("date")} ${getvalue("endtime")}${timezone}`,
		"description": "",
		"gametypeid": getvalue("gametype")||1,
		"limittypeid": getvalue("limittype")||1,
		"stacktypeid": getvalue("stacktype")||1,
		"eventtypeid": getvalue("eventtype")||1
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})
