// signin.js
// ===========================================================================
// 改用 Google Identity Services (GIS)
//   * 取代 Firebase Auth, 避開跨域 cookie / storage partitioning 問題
//   * 所有瀏覽器 (含 Safari/iOS) 都能正常運作
// ===========================================================================

if(weblsget(WEBLSNAME+"signin")){
	href("main.html")
}

const GOOGLE_CLIENT_ID="676058961600-uo2cec3c18kiuipfci2tet1l67c8dmbl.apps.googleusercontent.com"

// 把 Google id_token 送到後端 /signin, 完成本地登入狀態
function backendsignin(idtoken){
	fetch(AJAXURL+"signin",{
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			idtoken: idtoken
		})
	})
	.then(function(res){
		return res.json()
	})
	.then(function(data){
		if(data["success"]){
			weblsset(WEBLSNAME+"signin",true)
			weblsset(WEBLSNAME+"token",data["data"]["token"])
			weblsset(WEBLSNAME+"uid",data["data"]["uid"])
			weblsset(WEBLSNAME+"email",data["data"]["email"])
			weblsset(WEBLSNAME+"name",data["data"]["name"])
			weblsset(WEBLSNAME+"picture",data["data"]["picture"])
			weblsset(WEBLSNAME+"language",data["data"]["language"])
			if(data["data"]["signup"]){
				href("signup.html")
			}else{
				href("main.html")
			}
		}else{
			innertext("#error","登入失敗, 請重試",false)
		}
	})
	.catch(function(err){
		innertext("#error","登入失敗: "+err,false)
	})
}

// GIS callback: 拿到 id_token 就丟給後端
function handleGoogleCredential(response){
	if(response&&response.credential){
		backendsignin(response.credential)
	}else{
		innertext("#error","未取得 Google 憑證",false)
	}
}

// gsi/client 是 async 載入, 等好了再 init
function whengoogleready(callback){
	if(window.google&&window.google.accounts&&window.google.accounts.id){
		callback()
		return
	}
	setTimeout(function(){
		whengoogleready(callback)
	},50)
}

whengoogleready(function(){
	let locale="en"
	if(LANGUAGE=="zhtw"){
		locale="zh-TW"
	}

	google.accounts.id.initialize({
		client_id: GOOGLE_CLIENT_ID,
		callback: handleGoogleCredential,
		ux_mode: "popup",
		auto_select: false
	})

	google.accounts.id.renderButton(
		document.getElementById("gsibutton"),
		{
			theme: "filled_blue",
			size: "large",
			type: "standard",
			text: "signin_with",
			shape: "pill",
			logo_alignment: "center",
			width: 280,
			locale: locale
		}
	)
})
