// 從 URL 取出 token 並呼叫 verifystaff API
let token=getget("token")

function showsuccess(kind){
	domgetid("loading").classList.add("hidden")
	if(kind=="already_active"){
		domgetid("alreadyactive").classList.remove("hidden")
	}else{
		if(kind=="session_staff_verified"){
			domgetid("successmsg").textContent="您已成功加入該場次的員工名單。"
		}
		domgetid("success").classList.remove("hidden")
	}
}

function showfailed(reason){
	domgetid("loading").classList.add("hidden")
	if(reason){
		domgetid("failedmsg").textContent=reason
	}
	domgetid("failed").classList.remove("hidden")
}

if(!token){
	showfailed("缺少驗證連結, 請從邀請信件點選連結")
}else{
	ajax("GET",AJAXURL+"verifystaff/"+token,function(event,data){
		if(data["success"]){
			showsuccess(data["data"])
		}else{
			let msg="此連結無效或已過期"
			if(data["data"]=="ERROR_verifytoken_invalid"){
				msg="驗證連結無效或已過期"
			}
			showfailed(msg)
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}
