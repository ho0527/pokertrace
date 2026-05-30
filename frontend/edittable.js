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
		"name": getvalue("name")
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})