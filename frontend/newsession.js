if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
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
		alert("權限已失效,請重新登入")
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

		loadtempdata()
	}else{
		alert("權限已失效,請重新登入")
		weblsset(WEBLSNAME+"signin",null)
		weblsset(WEBLSNAME+"token",null)
		href("signin.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

value("#date",new Date().toISOString().split("T")[0])

onchange("#buyin",function(element,event){
	value("#rebuybuyin",getvalue("buyin"))
})

onsubmit("#form",function(element,event){
	let timezone="+00:00"

	event.preventDefault()

	domgetid("submit").disabled=true

	ajax("POST",AJAXURL+"newsession",function(event,data){
		if(data["success"]){
			alert("新增成功")
			href("sessionlist.html")
			weblsset(WEBLSNAME+"sessiontemp",null)
		}else{
			innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
			domgetid("submit").disabled=false
		}
	},str({
		"name": getvalue("name"),
		"gametype": getvalue("gameeventtype"),
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