let sessionid=getget("id")

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
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
				<option value="${gametyperow[i]["id"]}">${TRANSLATE["zhtw"]["type"]["game"][gametyperow[i]["code"]]}</option>
			`)
		}

		// 填充限注類型
		for(let i=0;i<limittyperow.length;i=i+1){
			innerhtml("#limittype",`
				<option value="${limittyperow[i]["id"]}">${TRANSLATE["zhtw"]["type"]["limit"][limittyperow[i]["code"]]}</option>
			`)
		}

		// 填充籌碼類型
		for(let i=0;i<stacktyperow.length;i=i+1){
			innerhtml("#stacktype",`
				<option value="${stacktyperow[i]["id"]}">${TRANSLATE["zhtw"]["type"]["stack"][stacktyperow[i]["code"]]}</option>
			`)
		}

		// 填充賽事類型
		for(let i=0;i<eventtyperow.length;i=i+1){
			innerhtml("#eventtype",`
				<option value="${eventtyperow[i]["id"]}">${TRANSLATE["zhtw"]["type"]["event"][eventtyperow[i]["code"]]}</option>
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
						value("#rebuycount",row["rebuycount"])
						value("#rebuybuyin",row["rebuybuyin"])
						value("#winprice",row["winprice"])
						value("#chip",row["chip"])
						value("#winthing",row["winthing"])
						value("#description",row["description"])
						value("#place",row["place"])
						value("#totalbuyin",row["totalbuyin"])
						value("#gametype",row["gametypeid"])
						value("#limittype",row["limittypeid"])
						value("#stacktype",row["stacktypeid"])
						value("#eventtype",row["eventtypeid"])
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

onsubmit("#form",function(element,event){
	let timezone="+00:00"

	event.preventDefault()

	domgetid("submit").disabled=true

	ajax("PUT",AJAXURL+"editsession/"+sessionid,function(event,data){
		if(data["success"]){
			alert("修改成功")
			// weblsset(WEBLSNAME+"signin",true)
			// weblsset(WEBLSNAME+"token",data["data"]["token"])
			// weblsset(WEBLSNAME+"userid",data["data"]["userid"])
			// weblsset(WEBLSNAME+"permission",data["data"]["permission"])
			// weblsset(WEBLSNAME+"name",data["data"]["name"])
			href("sessionlist.html")
		}else{
			innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
			domgetid("submit").disabled=false
		}
	},str({
		"name": getvalue("name"),
		"gametype": getvalue("gametype"),
		"clubid": getvalue("clubid"),
		"buyin": float(getvalue("buyin")),
		"chip": float(getvalue("chip")),
		"rebuycount": float(getvalue("rebuycount")),
		"rebuybuyin": float(getvalue("rebuybuyin")),
		"winprice": float(getvalue("winprice")),
		"winthing": getvalue("winthing"),
		"place": getvalue("place"),
		"totalbuyin": getvalue("totalbuyin"),
		"starttime": `${getvalue("date")} ${getvalue("starttime")}${timezone}`,
		"endtime": `${getvalue("date")} ${getvalue("endtime")}${timezone}`,
		"description": getvalue("description"),
		"gametypeid": getvalue("gametype"),
		"limittypeid": getvalue("limittype"),
		"stacktypeid": getvalue("stacktype"),
		"eventtypeid": getvalue("eventtype")
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})