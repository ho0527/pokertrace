if(weblsget(WEBLSNAME+"signin")){
	let returnpage=ptgetreturnpage()
	if(returnpage){
		href(returnpage)
	}else{
		href("main.html")
	}
}

const GOOGLECLIENTID="676058961600-uo2cec3c18kiuipfci2tet1l67c8dmbl.apps.googleusercontent.com"

function signintext(key){
	return (TRANSLATE[LANGUAGE]["signinpage"]||{})[key]||key
}

function authtext(key){
	return (TRANSLATE[LANGUAGE]["auth"]||{})[key]||pterror(key)
}

function applysigninlanguage(){
	document.title=signintext("title")
	innertext("#signinheading",signintext("heading"),false)
	innertext("#signinsubheading",signintext("subheading"),false)
	value("#googlesigninbtn",signintext("googlebutton"))
	innertext("#googlefallbackhint",signintext("googlefallbackhint"),false)
}

function showsigninerror(message){
	let box=domgetid("signinerrorbox")
	let text=domgetid("signinerror")
	if(!box||!text){
		return
	}
	text.textContent=message
	box.classList.remove("hidden")
}

function showsigninreason(reasonkey){
	if(!reasonkey){
		return
	}
	let message=authtext(reasonkey)
	showsigninerror(message)
	let returnhint=domgetid("signinreturnhint")
	let returnpage=ptgetreturnpage()
	if(returnhint){
		if(returnpage){
			returnhint.textContent=signintext("backtooriginal")
		}else{
			returnhint.textContent=authtext("reauth")
		}
	}
}

function clearsigninreason(){
	ptclearreturnreason()
	let url=new URL(location.href)
	if(url.searchParams.get("reason")||url.searchParams.get("returnpage")){
		url.searchParams.delete("reason")
		url.searchParams.delete("returnpage")
		history.replaceState({},document.title,url.pathname+(url.search||""))
	}
}

function resolvedestination(data){
	if(data["data"]&&data["data"]["signup"]){
		return "signup.html"
	}
	let params=new URLSearchParams(location.search||"")
	let returnpage=params.get("returnpage")||ptgetreturnpage()
	if(returnpage){
		ptclearreturnpage()
		ptclearreturnreason()
		return returnpage
	}
	ptclearreturnreason()
	return "main.html"
}

function storesigninstate(data){
	// 只有真的拿到有效 token 才寫進 localStorage, 避免把 undefined 存進登入狀態
	if(data["data"]&&data["data"]["token"]){
		weblsset(WEBLSNAME+"signin",true)
		weblsset(WEBLSNAME+"token",data["data"]["token"])
		weblsset(WEBLSNAME+"uid",data["data"]["uid"])
		weblsset(WEBLSNAME+"email",data["data"]["email"])
		weblsset(WEBLSNAME+"name",data["data"]["name"])
		weblsset(WEBLSNAME+"picture",data["data"]["picture"])
		weblsset(WEBLSNAME+"language",data["data"]["language"])
	}
}

function backendsignin(payload){
	// 走站上共用 ajax(): initialize.js 的包裝有 timeout / loading / 逾時中止,
	// 原生 fetch 沒有 timeout 選項, 逾時設定不會生效
	ajax("POST",AJAXURL+"signin",function(event,data){
		if(data["success"]){
			storesigninstate(data)
			clearsigninreason()
			href(resolvedestination(data))
		}else{
			let message=authtext("BACKEND_SIGNIN_FAILED")
			if(data["data"]){
				message=message+" "+pterror(data["data"])
			}
			showsigninerror(message)
			pttoasterror("BACKEND_SIGNIN_FAILED")
		}
	},str(payload),[
		["Content-Type","application/json"]
	],{
		"timeout": 30000,
		"loadingtarget": "#googlesigninbtn"
	})
}

function handleGoogleCredential(response){
	if(response&&response.credential){
		backendsignin({idtoken: response.credential})
		return
	}
	showsigninerror(authtext("GOOGLE_CREDENTIAL_MISSING"))
	pttoasterror("GOOGLE_CREDENTIAL_MISSING")
}

function handlegoogletoken(response){
	if(response&&response.access_token){
		backendsignin({accesstoken: response.access_token})
		return
	}
	// 使用者關掉彈窗或拒絕授權
	if(response&&response.error&&response.error!="access_denied"&&response.error!="popup_closed"){
		showsigninerror(authtext("GOOGLE_SIGNIN_FAILED"))
	}
}

function whengoogleready(callback,count){
	let trycount=count||0
	if(window.google&&window.google.accounts&&window.google.accounts.id){
		callback()
		return
	}
	if(trycount>=200){
		showsigninerror(authtext("GOOGLE_SIGNIN_FAILED"))
		return
	}
	setTimeout(function(){
		whengoogleready(callback,trycount+1)
	},50)
}

let googleready=false
let googletokenclient=null

function showgooglefallback(){
	let box=domgetid("googlefallback")
	if(box){
		box.classList.remove("hidden")
	}
}

// 自訂按鈕走 OAuth token 彈窗 (google.accounts.oauth2)：點擊當下「同步」開啟到
// accounts.google.com 的頂層彈窗，不依賴第三方 cookie → Safari/ITP 也能正常開。
// 拿到 access_token 後送後端, 後端用 userinfo 換取使用者資料 (見 backend/api/user.py)。
// 萬一 token client 還沒初始化 (GSI 尚未載入), 就顯示官方按鈕當保底。
function startgooglesignin(){
	if(!googleready||!googletokenclient){
		showgooglefallback()
		return
	}
	try{
		googletokenclient.requestAccessToken()
	}catch(e){
		showgooglefallback()
	}
}

applysigninlanguage()
showsigninreason(ptgetreturnreason())

onclick("#googlesigninbtn",function(element,event){
	startgooglesignin()
})

whengoogleready(function(){
	let locale="en"
	if(LANGUAGE=="zhtw"){
		locale="zh-TW"
	}

	google.accounts.id.initialize({
		client_id: GOOGLECLIENTID,
		callback: handleGoogleCredential,
		ux_mode: "popup",
		auto_select: false
	})

	// 自訂按鈕用的 OAuth token client (popup 流程)
	googletokenclient=google.accounts.oauth2.initTokenClient({
		client_id: GOOGLECLIENTID,
		scope: "openid email profile",
		callback: handlegoogletoken
	})

	// 保底用的官方按鈕（預設隱藏，token client 無法初始化時才出現）
	google.accounts.id.renderButton(
		domgetid("gsibutton"),
		{
			theme: "filled_blue",
			size: "large",
			type: "standard",
			text: "continue_with",
			shape: "pill",
			logo_alignment: "center",
			width: 280,
			locale: locale
		}
	)

	googleready=true
})
