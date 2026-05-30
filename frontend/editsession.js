let sessionid=getget("id")

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function slimeditsessionform(){
	let hideids=[
		"gameeventtype",
		"name",
		"clubid",
		"gametype",
		"limittype",
		"stacktype",
		"eventtype",
		"owned",
		"date",
		"starttime",
		"endtime",
		"buyin",
		"buyinfee",
		"chip",
		"rebuybuyin",
		"rebuyfee",
		"rebuychip",
		"reentrycount",
		"reentrybuyin",
		"reentryfee",
		"reentrychip",
		"addoncount",
		"addonbuyin",
		"addonfee",
		"addonchip",
		"linkuser",
		"description"
	]
	for(let i=0;i<hideids.length;i=i+1){
		let element=domgetid(hideids[i])
		if(element&&element.parentElement){
			element.parentElement.style.display="none"
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
		ownedfields.style.display="none"
	}
}

slimeditsessionform()

// 切換主辦/個人模式
function switchownedmode(checked){
	let ownedblock=domgetid("ownedfields")
	let personalblock=domgetid("personalfields")
	let labels=document.querySelectorAll(".ownedlabel")

	if(checked){
		ownedblock.classList.remove("hidden")
		personalblock.classList.add("hidden")
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


		ajax("GET",AJAXURL+"getclublist",function(event,data){
			if(data["success"]){
				let row=data["data"]

				for(let i=0;i<row.length;i=i+1){
					innerhtml("#clubid",`
						<option value="${row[i]["id"]}">${row[i]["name"]}(${row[i]["ps"]})</option>
					`)
				}

				ajax("GET",AJAXURL+"getsession/"+sessionid,function(event,data){
					if(data["success"]){
						let row=data["data"]

						innerhtml("#gameeventtype",{
							"cash": "現金局",
							"tournament": "錦標賽",
							"limited": "限時錦標賽"
						}[row["gametype"]],false)
						value("#name",row["name"])
						value("#clubid",row["clubid"])
						value("#date",row["starttime"].split("T")[0])
						value("#starttime",row["starttime"].split("T")[1].split("Z")[0])
						value("#endtime",row["endtime"].split("T")[1].split("Z")[0])
						value("#buyin",row["buyin"])
						value("#buyinfee",row["buyinfee"]||0)
						value("#chip",row["chip"])
						value("#rebuycount",row["rebuycount"])
						value("#rebuybuyin",row["rebuybuyin"])
						value("#rebuyfee",row["rebuyfee"]||0)
						value("#rebuychip",row["rebuychip"]||0)
						value("#reentrycount",row["reentrycount"]||0)
						value("#reentrybuyin",row["reentrybuyin"]||0)
						value("#reentryfee",row["reentryfee"]||0)
						value("#reentrychip",row["reentrychip"]||0)
						value("#addoncount",row["addoncount"]||0)
						value("#addonbuyin",row["addonbuyin"]||0)
						value("#addonfee",row["addonfee"]||0)
						value("#addonchip",row["addonchip"]||0)
						value("#winprice",row["winprice"])
						value("#winthing",row["winthing"])
						value("#description",row["description"])
						value("#place",row["place"])
						value("#totalbuyin",row["totalbuyin"])
						value("#gametype",row["gametypeid"])
						value("#limittype",row["limittypeid"])
						value("#stacktype",row["stacktypeid"])
						value("#eventtype",row["eventtypeid"])

						if(row["linkuser"]==true){
							domgetid("linkuser").checked=true
						}else{
							domgetid("linkuser").checked=false
						}

						if(row["inmoney"]==true){
							domgetid("inmoney").checked=true
						}else{
							domgetid("inmoney").checked=false
						}

						if(row["inft"]==true){
							domgetid("inft").checked=true
						}else{
							domgetid("inft").checked=false
						}

						if(row["owned"]==true){
							domgetid("owned").checked=true
							switchownedmode(true)
						}else{
							domgetid("owned").checked=false
							switchownedmode(false)
						}
					}else{
						alert("查無指定場次")
						href("sessionlist.html")
					}
				},null,[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				])
			}else{
				alert("權限已失效,請重新登入")
				weblsset(WEBLSNAME+"signin",null)
				weblsset(WEBLSNAME+"token",null)
				href("signin.html")
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	}else{
		alert("權限已失效,請重新登入")
		weblsset(WEBLSNAME+"signin",null)
		weblsset(WEBLSNAME+"token",null)
		href("signin.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

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
	let islinkuser=domgetid("linkuser").checked
	let isinmoney=domgetid("inmoney").checked
	let isinft=domgetid("inft").checked

	ajax("PUT",AJAXURL+"editsessionresult/"+sessionid,function(event,data){
		if(data["success"]){
			alert("修改成功")
			href("sessionlist.html")
		}else{
			innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
			domgetid("submit").disabled=false
		}
	},str({
		"rebuycount": float(getvalue("rebuycount")),
		"winprice": float(getvalue("winprice")),
		"winthing": getvalue("winthing"),
		"inmoney": isinmoney,
		"inft": isinft,
		"place": getvalue("place"),
		"totalbuyin": getvalue("totalbuyin")
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})
