let contactform=domgetid("contactform")
let contactsubmit=domgetid("contactsubmit")
let leaveguard=bindleaveguard()

function contacttext(key,fallbacktext){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["contactpage"]&&TRANSLATE[LANGUAGE]["contactpage"][key]){
		return TRANSLATE[LANGUAGE]["contactpage"][key]
	}
	return fallbacktext||key
}

function setcontacttext(selector,text){
	let element=document.querySelector(selector)
	if(element){
		element.textContent=text
	}
}

function applycontactlanguage(){
	document.title=contacttext("title")+" - PokerTrace"
	setcontacttext("#contacttitle",contacttext("heading"))
	setcontacttext("#contactdesc",contacttext("desc"))
	setcontacttext("#contactreporttitle",contacttext("reporttitle"))
	setcontacttext("#contactreportdesc",contacttext("reportdesc"))
	setcontacttext("#contactnamelabel",contacttext("name"))
	setcontacttext("#contactsubjectlabel",contacttext("subject"))
	setcontacttext("#contactmessagelabel",contacttext("message"))
	let subject=domgetid("contactsubject")
	if(subject){
		subject.placeholder=contacttext("subjectplaceholder")
	}
	if(contactsubmit){
		contactsubmit.value=contacttext("submit")
	}
}

function contactvalue(id){
	let element=domgetid(id)
	if(!element){
		return ""
	}
	return element.value.trim()
}

function markcontactinvalid(element,invalid){
	if(!element){
		return
	}
	// border-zinc-700 與 border-red-500 都是 border-color, 同權重時由 CSS 檔內的先後順序決定勝負,
	// 而建置版 tailwind.css 把 border-zinc-700 排在 border-red-500 之後 -> 只加紅框不會生效(驗證錯誤看不出來)。
	// 因此切換狀態時要把另一個移掉, 不能只靠疊加。
	if(invalid){
		element.classList.remove("border-zinc-700")
		element.classList.add("border-red-500")
		return
	}
	element.classList.remove("border-red-500")
	element.classList.add("border-zinc-700")
}

function validatecontactfield(id){
	let element=domgetid(id)
	let valid=true
	if(id=="contactname"){
		valid=ptvalidatefield(element,{
			"required": true,
			"requiredmessage": contacttext("namerequired","請填寫姓名")
		})
		markcontactinvalid(element,!valid)
		return valid
	}
	if(id=="contactemail"){
		let emailvalue=contactvalue(id)
		valid=ptvalidatefield(element,{
			"required": true,
			"requiredmessage": contacttext("emailrequired","請填寫 Email"),
			"email": true,
			"emailmessage": contacttext("emailinvalid","Email 格式不正確")
		})
		if(valid&&emailvalue.indexOf("@")<0){
			ptsetfieldmessage(element,contacttext("emailinvalid","Email 格式不正確"))
			valid=false
		}
		markcontactinvalid(element,!valid)
		return valid
	}
	if(id=="contactmessage"){
		valid=ptvalidatefield(element,{
			"required": true,
			"requiredmessage": contacttext("messagerequired","請填寫內容")
		})
		markcontactinvalid(element,!valid)
		return valid
	}
	return true
}

function validatecontactform(){
	let valided=true
	if(!validatecontactfield("contactname")){
		valided=false
	}
	if(!validatecontactfield("contactemail")){
		valided=false
	}
	if(!validatecontactfield("contactmessage")){
		valided=false
	}
	return valided
}

function bindcontactvalidation(){
	let fieldlist=[
		"contactname",
		"contactemail",
		"contactmessage"
	]
	for(let i=0;i<fieldlist.length;i=i+1){
		let element=domgetid(fieldlist[i])
		if(!element){
			continue
		}
		element.addEventListener("input",function(){
			validatecontactfield(this.id)
		})
		element.addEventListener("change",function(){
			validatecontactfield(this.id)
		})
	}
}

function fillcontactfromuser(){
	if(!weblsget(WEBLSNAME+"signin")){
		return
	}
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(data["success"]){
			if(domgetid("contactname")&&!domgetid("contactname").value){
				domgetid("contactname").value=data["data"]["name"]||""
			}
			if(domgetid("contactemail")&&!domgetid("contactemail").value){
				domgetid("contactemail").value=data["data"]["email"]||""
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

if(contactform){
	contactform.onsubmit=function(event){
		event.preventDefault()
		let name=contactvalue("contactname")
		let email=contactvalue("contactemail")
		let subject=contactvalue("contactsubject")
		let message=contactvalue("contactmessage")
		if(!validatecontactform()){
			pttoast(contacttext("requiredwarning"),"warning")
			return
		}
		ptsetsubmitstate(contactsubmit,true,contacttext("submitting"))
		let headers=[]
		if(weblsget(WEBLSNAME+"token")){
			headers=[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			]
		}
		ajax("POST",AJAXURL+"newcontactmessage",function(event,data){
			ptsetsubmitstate(contactsubmit,false)
			if(data["success"]){
				leaveguard.clear()
				pttoast(contacttext("success"),"success")
				contactform.reset()
				fillcontactfromuser()
			}else{
				pttoast(pterror(data["data"]||contacttext("fail")),"error")
			}
		},str({
			"name": name,
			"email": email,
			"subject": subject,
			"message": message
		}),headers)
	}
}

applycontactlanguage()
bindcontactvalidation()
fillcontactfromuser()
