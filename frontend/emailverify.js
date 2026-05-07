let token=getget("token")

ajax("GET",AJAXURL+"emailverify?token="+token,function(event,data){
	if(data["success"]){
		innerhtml("#message","驗證成功，請前往登入頁面進行登入，將在 3 秒中後導向",false)
		setTimeout(function(){
			href("signin.html")
		},3000)
	}else{
		innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
	}
},str({
	"email": getvalue("email"),
	"name": getvalue("name"),
	"phone": getvalue("phone"),
	"birthday": getvalue("birthday"),
	"address": getvalue("address"),
	"password": getvalue("password")
}))