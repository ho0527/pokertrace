// 從 URL 取出 token 並呼叫 verifystaff API
function staffverifytext(key,fallbacktext){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["staffverifypage"]&&TRANSLATE[LANGUAGE]["staffverifypage"][key]){
		return TRANSLATE[LANGUAGE]["staffverifypage"][key]
	}
	return fallbacktext||key
}

function staffverifyset(selector,text){
	let element=document.querySelector(selector)
	if(element){
		element.textContent=text
	}
}

function applystaffverifylanguage(){
	document.title=staffverifytext("title","員工邀請確認")+" - PokerTrace"
	staffverifyset("p.mb-3",staffverifytext("eyebrow","Staff Invite"))
	staffverifyset("#loading h1",staffverifytext("loadingtitle","驗證中..."))
	staffverifyset("#loading p",staffverifytext("loadingdesc","正在處理您的邀請確認"))
	staffverifyset("#success h1",staffverifytext("successtitle","確認成功！"))
	staffverifyset("#successmsg",staffverifytext("successuser","您已成功加入該主辦的員工名單。"))
	staffverifyset("#success a",staffverifytext("signin","前往登入"))
	staffverifyset("#alreadyactive h1",staffverifytext("alreadytitle","已確認過"))
	staffverifyset("#alreadyactive p",staffverifytext("alreadydesc","您先前已確認過此邀請。"))
	staffverifyset("#alreadyactive a",staffverifytext("signin","前往登入"))
	staffverifyset("#failed h1",staffverifytext("failedtitle","驗證失敗"))
	staffverifyset("#failedmsg",staffverifytext("faileddesc","此連結無效或已過期。"))
	staffverifyset("#failed a",staffverifytext("home","回首頁"))
}

applystaffverifylanguage()

let token=getget("token")

function showsuccess(kind){
	domgetid("loading").classList.add("hidden")
	if(kind=="already_active"){
		domgetid("alreadyactive").classList.remove("hidden")
	}else{
		if(kind=="session_staff_verified"){
			domgetid("successmsg").textContent=staffverifytext("successsession","您已成功加入該場次的員工名單。")
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

function verifytimeout(){
	let el=domgetid("loading")
	if(typeof pttoast=="function"){
		pttoast(staffverifytext("timeout","驗證時間較久，請檢查連線後重試"),"warning")
	}else if(el){
		el.textContent=staffverifytext("timeoutlong","驗證時間較久，請檢查連線後重試，或重新整理頁面 / 回首頁")
	}
}

if(!token){
	showfailed(staffverifytext("missing","缺少驗證連結，請從邀請信件點選連結"))
}else{
	let watchdog=setTimeout(verifytimeout,15000)
	ajax("GET",AJAXURL+"verifystaff/"+token,function(event,data){
		clearTimeout(watchdog)
		if(data["success"]){
			showsuccess(data["data"])
		}else{
			let msg=staffverifytext("faileddesc","此連結無效或已過期。")
			if(data["data"]=="ERROR_verifytoken_invalid"){
				msg=staffverifytext("invalid","驗證連結無效或已過期")
			}
			showfailed(msg)
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}
