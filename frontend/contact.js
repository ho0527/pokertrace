let contactform=document.getElementById("contactform")
let contactsubmit=document.getElementById("contactsubmit")

function contactvalue(id){
	let element=document.getElementById(id)
	if(!element){
		return ""
	}
	return element.value.trim()
}

function fillcontactfromuser(){
	if(!weblsget(WEBLSNAME+"signin")){
		return
	}
	ajax("GET",AJAXURL+"getuser",function(event,data){
		if(data["success"]){
			if(document.getElementById("contactname")&&!document.getElementById("contactname").value){
				document.getElementById("contactname").value=data["data"]["name"]||""
			}
			if(document.getElementById("contactemail")&&!document.getElementById("contactemail").value){
				document.getElementById("contactemail").value=data["data"]["email"]||""
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
		if(!name||!email||!message){
			pttoast("請填寫姓名、Email 與內容","warning")
			return
		}
		if(contactsubmit){
			contactsubmit.disabled=true
			contactsubmit.textContent="送出中..."
		}
		let headers=[]
		if(weblsget(WEBLSNAME+"token")){
			headers=[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			]
		}
		ajax("POST",AJAXURL+"newcontactmessage",function(event,data){
			if(contactsubmit){
				contactsubmit.disabled=false
				contactsubmit.textContent="送出訊息"
			}
			if(data["success"]){
				pttoast("已收到你的訊息，謝謝你的建議","success")
				contactform.reset()
				fillcontactfromuser()
			}else{
				pttoast(pterror(data["data"]||"送出失敗"),"error")
			}
		},str({
			"name": name,
			"email": email,
			"subject": subject,
			"message": message
		}),headers)
	}
}

fillcontactfromuser()
