if(weblsget(WEBLSNAME+"signin")){
	href("main.html")
}

onsubmit("#form",function(element,event){
	event.preventDefault()

	domgetid("submit").disabled=true

	ajax("POST",AJAXURL+"signup",function(event,data){
		if(data["success"]){
			alert("註冊成功，請至信箱內收取驗證信，並點選連結驗證後進行登入")
			href("signin.html")
		}else{
			innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
			domgetid("submit").disabled=false
			innerhtml("submit",`註冊中...`,false)
		}
	},str({
		"username": getvalue("username"),
		"email": getvalue("email"),
		"name": getvalue("name"),
		"phone": getvalue("phone"),
		"password": getvalue("password")
	}))
})