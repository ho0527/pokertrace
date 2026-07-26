// 沒登入過 → 回 signin 頁面
if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let leaveguard=bindleaveguard()

// ==== 粒子背景 ====
// 不用 IIFE 包裝: 上一行省略分號時, 開頭的 ( 會被解析成函式呼叫 (ASI 陷阱), 導致整支腳本崩潰
const PARTICLECOLORLIST=[
	"#3b82f6",
	"#7c3aed",
	"#10b981",
	"#f59e0b",
	"#ec4899"
]
const PARTICLECONTAINER=domgetid("particles")
const PARTICLECOUNT=28

if(PARTICLECONTAINER){
	for(let i=0;i<PARTICLECOUNT;i=i+1){
		let particle=doccreate("div")
		let size=Math.random()*8+3

		particle.className="particle"
		particle.style.cssText=`
			width: ${size}px; height: ${size}px;
			background: ${PARTICLECOLORLIST[Math.floor(Math.random()*PARTICLECOLORLIST.length)]};
			left: ${Math.random()*100}%;
			animation-duration: ${Math.random()*12+8}s;
			animation-delay: ${Math.random()*10}s;
		`
		PARTICLECONTAINER.appendChild(particle)
	}
}

// ==== 註冊頁文案查表 ====
// 文案優先讀 translate.js 的 signuppage 區段, key 尚未建立前先用目前頁面文案當 fallback
const SIGNUPFALLBACK={
	"welcometitle": "感謝您註冊PokerTrace！",
	"welcomesub": "Welcome to the PokerTrace · 建立您的帳號以開始使用",
	"usernamelabel": "顯示名稱",
	"usernamelabelhint": "Display Name",
	"usernameplaceholder": "請輸入您的名稱…",
	"usernameerror": "⚠ 請輸入名稱",
	"languagelabel": "語言偏好",
	"languagelabelhint": "Language",
	"rolelabel": "帳號類型",
	"rolelabelhint": "Account Type",
	"rolewarning": "請注意，帳號類型選擇後無法再修改，請謹慎選擇",
	"roleerror": "⚠ 請選擇帳號類型",
	"roleplayer": "Player 選手",
	"roledealer": "Dealer 計分員",
	"rolefloor": "Floor 裁判",
	"roleassistant": "Assistant 助理",
	"languagenamezhtw": "中文",
	"languagenameen": "English",
	"submitbutton": "確認送出 Submit",
	"submitting": "送出中…",
	"successtitle": "註冊成功！",
	"successwelcomeprefix": "歡迎，",
	"successwelcomesuffix": "！",
	"successrolelabel": "帳號類型：",
	"successlanglabel": "語言：",
	"successgomain": "前往主頁 →",
	"unknownerror": "未知錯誤"
}

function signuptext(key,languagekey){
	let uselanguage=languagekey||LANGUAGE
	let section=(TRANSLATE[uselanguage]||{})["signuppage"]||{}
	let text=section[key]
	if(text==undefined){
		text=SIGNUPFALLBACK[key]
	}
	if(text==undefined){
		text=key
	}
	return text
}

function applysignuplanguage(){
	innertext("#signupwelcometitle",signuptext("welcometitle"),false)
	innertext("#signupwelcomesub",signuptext("welcomesub"),false)
	innertext("#usernamelabeltext",signuptext("usernamelabel"),false)
	innertext("#usernamelabelhint",signuptext("usernamelabelhint"),false)
	innertext("#username-err",signuptext("usernameerror"),false)
	innertext("#languagelabeltext",signuptext("languagelabel"),false)
	innertext("#languagelabelhint",signuptext("languagelabelhint"),false)
	innertext("#rolelabeltext",signuptext("rolelabel"),false)
	innertext("#rolelabelhint",signuptext("rolelabelhint"),false)
	innertext("#rolewarning",signuptext("rolewarning"),false)
	innertext("#role-err",signuptext("roleerror"),false)
	innertext("#successtitle",signuptext("successtitle"),false)
	innertext("#successwelcomeprefix",signuptext("successwelcomeprefix"),false)
	innertext("#successwelcomesuffix",signuptext("successwelcomesuffix"),false)
	innertext("#successrolelabel",signuptext("successrolelabel"),false)
	innertext("#successlanglabel",signuptext("successlanglabel"),false)
	innertext("#successgomain",signuptext("successgomain"),false)
	value("#role-player","🎮 "+signuptext("roleplayer"))
	value("#role-dealer","🃏 "+signuptext("roledealer"))
	value("#role-floor","⚖️ "+signuptext("rolefloor"))
	value("#role-assistant","🙋 "+signuptext("roleassistant"))
	value("#submit-btn",signuptext("submitbutton"))
	let usernamefield=domgetid("username")
	if(usernamefield){
		usernamefield.placeholder=signuptext("usernameplaceholder")
	}
}

applysignuplanguage()

let googlename=weblsget(WEBLSNAME+"name")
let usernameinput=domgetid("username")
if(googlename&&usernameinput){
	usernameinput.value=googlename
}

// ==== 語言切換 (HTML 內 onclick 會呼叫) ====
function switchLang(lang){
	let arr=[
		"zh",
		"en"
	]

	for(let i=0;i<arr.length;i=i+1){
		domgetid("lang-"+arr[i]).classList.toggle("active",arr[i]==lang)
	}

	domgetid("lang-value").value=lang
}

// ==== 帳號類型切換 (HTML 內 onclick 會呼叫) ====
function switchRole(role){
	let arr=[
		"player",
		"dealer",
		"floor",
		"assistant"
	]

	for(let i=0;i<arr.length;i=i+1){
		domgetid("role-"+arr[i]).classList.toggle("active",arr[i]==role)
	}

	domgetid("role-value").value=role
	domgetid("role-err").classList.add("hidden")
}

// ==== 名稱欄位輸入時清除錯誤 ====
function validatesignupname(){
	let element=domgetid("username")
	if(!element.value.trim()){
		domgetid("username-err").classList.remove("hidden")
		element.classList.add("border-red-500")
		return false
	}
	domgetid("username-err").classList.add("hidden")
	element.classList.remove("border-red-500")
	return true
}

function validatesignuprole(){
	let role=domgetid("role-value").value
	if(!role){
		domgetid("role-err").classList.remove("hidden")
		return false
	}
	domgetid("role-err").classList.add("hidden")
	return true
}

function setsignupsubmit(locked){
	let btn=domgetid("submit-btn")
	if(!btn){
		return
	}
	btn.disabled=locked
	if(locked){
		btn.setAttribute("aria-busy","true")
		btn.value=signuptext("submitting")
		return
	}
	btn.removeAttribute("aria-busy")
	btn.value=signuptext("submitbutton")
}

domgetid("username").addEventListener("input",function(){
	validatesignupname()
})

// ==== 表單送出 ====
onsubmit("#form",function(element,event){
	event.preventDefault()

	let btn=domgetid("submit-btn")
	if(btn&&btn.disabled){
		return
	}
	let name=domgetid("username").value.trim()
	let role=domgetid("role-value").value
	let lang=domgetid("lang-value").value
	let valid=true

	if(!validatesignupname()){
		valid=false
	}

	if(!validatesignuprole()){
		valid=false
	}

	if(!valid){
		return
	}

	setsignupsubmit(true)

	// 後端 language 為 zhtw / en, 前端 lang-value 為 zh / en
	let langkey="en"
	if(lang=="zh"){
		langkey="zhtw"
	}

	ajax("POST",AJAXURL+"signup",function(event,data){
		if(data["success"]){
			leaveguard.clear()

			// 顯示成功畫面 (文案改用使用者剛選好的語言)
			domgetid("form").classList.add("hidden")
			domgetid("success-name").textContent=name
			domgetid("success-role").textContent=signuptext("role"+role,langkey)
			domgetid("success-lang").textContent=signuptext("languagename"+langkey,langkey)
			innertext("#successtitle",signuptext("successtitle",langkey),false)
			innertext("#successwelcomeprefix",signuptext("successwelcomeprefix",langkey),false)
			innertext("#successwelcomesuffix",signuptext("successwelcomesuffix",langkey),false)
			innertext("#successrolelabel",signuptext("successrolelabel",langkey),false)
			innertext("#successlanglabel",signuptext("successlanglabel",langkey),false)
			innertext("#successgomain",signuptext("successgomain",langkey),false)

			let ss=domgetid("success-screen")
			ss.classList.remove("hidden")
			ss.classList.add("flex")

			// 把新的 language 寫進 localStorage
			weblsset(WEBLSNAME+"language",langkey)
		}else{
			setsignupsubmit(false)
			pttoasterror(data["data"]||signuptext("unknownerror"))
		}
	},str({
		"name": name,
		"type": role,
		"language": langkey
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})
