// 沒登入過 → 回 signin 頁面
if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

// ===== 粒子背景 =====
(function(){
	let colors=[
		"#3b82f6",
		"#7c3aed",
		"#10b981",
		"#f59e0b",
		"#ec4899"
	]
	let container=document.getElementById("particles")
	let count=28

	for(let i=0;i<count;i=i+1){
		let p=document.createElement("div")
		let size=Math.random()*8+3

		p.className="particle"
		p.style.cssText=`
			width: ${size}px; height: ${size}px;
			background: ${colors[Math.floor(Math.random()*colors.length)]};
			left: ${Math.random()*100}%;
			animation-duration: ${Math.random()*12+8}s;
			animation-delay: ${Math.random()*10}s;
		`
		container.appendChild(p)
	}
})()

// ===== 帳號類型對照 =====
let ROLELABELS={
	"player": "玩家 Player",
	"dealer": "發牌員 Dealer",
	"floor": "裁判 Floor",
	"assistant": "助理 Assistant"
}

let LANGLABELS={
	"zh": "中文",
	"en": "English"
}

let googlename=weblsget(WEBLSNAME+"name")
if(googlename){
	document.getElementById("username").value=googlename
}

// ===== 語言切換 (HTML 內 onclick 會呼叫) =====
function switchLang(lang){
	let arr=[
		"zh",
		"en"
	]

	for(let i=0;i<arr.length;i=i+1){
		document.getElementById("lang-"+arr[i]).classList.toggle("active",arr[i]==lang)
	}

	document.getElementById("lang-value").value=lang
}

// ===== 帳號類型切換 (HTML 內 onclick 會呼叫) =====
function switchRole(role){
	let arr=[
		"player",
		"dealer",
		"floor",
		"assistant"
	]

	for(let i=0;i<arr.length;i=i+1){
		document.getElementById("role-"+arr[i]).classList.toggle("active",arr[i]==role)
	}

	document.getElementById("role-value").value=role
	document.getElementById("role-err").classList.add("hidden")
}

// ===== 名稱欄位輸入時清除錯誤 =====
document.getElementById("username").addEventListener("input",function(){
	if(this.value.trim()){
		document.getElementById("username-err").classList.add("hidden")
		this.classList.remove("border-red-500")
	}
})

// ===== 表單送出 =====
onsubmit("#form",function(element,event){
	event.preventDefault()

	let name=document.getElementById("username").value.trim()
	let role=document.getElementById("role-value").value
	let lang=document.getElementById("lang-value").value
	let valid=true

	if(!name){
		document.getElementById("username-err").classList.remove("hidden")
		document.getElementById("username").classList.add("border-red-500")
		valid=false
	}else{
		document.getElementById("username-err").classList.add("hidden")
		document.getElementById("username").classList.remove("border-red-500")
	}

	if(!role){
		document.getElementById("role-err").classList.remove("hidden")
		valid=false
	}else{
		document.getElementById("role-err").classList.add("hidden")
	}

	if(!valid){
		return
	}

	let btn=document.getElementById("submit-btn")
	btn.disabled=true
	document.getElementById("submit-text").classList.add("hidden")
	document.getElementById("submit-loading").classList.remove("hidden")
	document.getElementById("submit-loading").classList.add("flex")

	// 後端 language 為 zhtw / en, 前端 lang-value 為 zh / en
	let langkey="en"
	if(lang=="zh"){
		langkey="zhtw"
	}

	ajax("POST",AJAXURL+"signup",function(event,data){
		if(data["success"]){
			// 顯示成功畫面
			document.getElementById("form").classList.add("hidden")
			document.getElementById("success-name").textContent=name
			document.getElementById("success-role").textContent=ROLELABELS[role]
			document.getElementById("success-lang").textContent=LANGLABELS[lang]

			let ss=document.getElementById("success-screen")
			ss.classList.remove("hidden")
			ss.classList.add("flex")

			// 把新的 language 寫進 localStorage
			weblsset(WEBLSNAME+"language",langkey)
		}else{
			btn.disabled=false
			document.getElementById("submit-text").classList.remove("hidden")
			document.getElementById("submit-loading").classList.add("hidden")
			document.getElementById("submit-loading").classList.remove("flex")
			alert(data["data"]||"未知錯誤")
		}
	},str({
		"name": name,
		"type": role,
		"language": langkey
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})
