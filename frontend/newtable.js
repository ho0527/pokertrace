let sessionid=getget("sessionid")

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

onclick("#back",function(element,event){
	href("session.html?id="+sessionid+"#1")
})

ajax("GET",AJAXURL+"getsession/"+sessionid,function(event,data){
	if(data["success"]){
		onclick("#back",function(element,event){
			href("session.html?id="+sessionid+"#1")
		})

		onsubmit("#form",function(element,event){
			event.preventDefault()

			domgetid("submit").disabled=true

			ajax("POST",AJAXURL+"newtable/"+sessionid,function(event,data){
				if(data["success"]){
					alert("新增成功")
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
	}else{
		alert("查無指定牌桌")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])
