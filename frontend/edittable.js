let tableid=getget("id")
let sessionid=null

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

ajax("GET",AJAXURL+"gettable/"+tableid,function(event,data){
	if(data["success"]){
		let row=data["data"]

		sessionid=row["sessionid"]

		value("#name",row["name"])
		value("#smallblind",row["smallblind"])
		value("#bigblind",row["bigblind"])
		value("#bigblindante",row["bigblindante"])
		value("#ante",row["ante"])
		value("#chip",row["chip"])
		value("#date",row["starttime"].split("T")[0])
		value("#starttime",row["starttime"].split("T")[1].split("Z")[0])
		value("#endtime",row["endtime"].split("T")[1].split("Z")[0])

		onclick("#back",function(element,event){
			href("session.html?id="+sessionid+"#1")
		})
	}else{
		alert("查無指定牌桌")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

value("#date",new Date().toISOString().split("T")[0])

onsubmit("#form",function(element,event){
	let timezone="+00:00"

	event.preventDefault()

	domgetid("submit").disabled=true

	ajax("PUT",AJAXURL+"edittable/"+tableid,function(event,data){
		if(data["success"]){
			alert("修改成功")
			href("session.html?id="+sessionid+"#1")
		}else{
			innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
			domgetid("submit").disabled=false
		}
	},str({
		"name": getvalue("name"),
		"smallblind": int(getvalue("smallblind")),
		"bigblind": int(getvalue("bigblind")),
		"bigblindante": int(getvalue("bigblindante")),
		"ante": int(getvalue("ante")),
		"chip": float(getvalue("chip")),
		"starttime": `${getvalue("date")} ${getvalue("starttime")}${timezone}`,
		"endtime": `${getvalue("date")} ${getvalue("endtime")}${timezone}`
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})