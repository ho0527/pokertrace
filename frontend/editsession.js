let sessionid=getget("id")
let originalreentrycount=0
let leaveguard=bindleaveguard()

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function field(id){
	return domgetid(id)
}

function textvalue(id){
	let element=field(id)
	if(!element){
		return ""
	}
	return element.value||""
}

function numbervalue(id){
	let value=Number(textvalue(id))
	if(Number.isNaN(value)){
		return 0
	}
	return value
}

function checkboxvalue(id){
	let element=field(id)
	if(!element){
		return false
	}
	return element.checked==true
}

function setfieldvalue(id,value){
	let element=field(id)
	if(!element){
		return
	}
	if(value==undefined||value==null){
		element.value=""
		return
	}
	element.value=value
}

function setcheckboxvalue(id,value){
	let element=field(id)
	if(!element){
		return
	}
	element.checked=value==true
}

function showerror(message){
	innertext("#error",message,false)
	pttoast(message,"error")
	ptsetsubmitstate(field("submit"),false)
}

function sessiontypetext(type){
	if(type=="cash"){
		return "現金局"
	}
	if(type=="limited"){
		return "限時錦標賽"
	}
	if(type=="tournament"){
		return "錦標賽"
	}
	return "場次"
}

function displaytime(value){
	return ptformatdatetime(value)
}

function loadsession(){
	ajax("GET",AJAXURL+"getsession/"+sessionid,function(event,data){
		if(data["success"]){
			let row=data["data"]
			// 後端 editsessionresult 只允許擁有者/管理員/聘用人員, 前端比照同一組欄位擋下純連結開放的瀏覽者
			if(row["isown"]==true||row["isadmin"]==true||row["isstaff"]==true){
				innertext("#sessionname",row["name"]||"未命名場次",false)
				innertext("#sessiontype",sessiontypetext(row["gametype"]),false)
				innertext("#sessiontime"," · "+displaytime(row["starttime"]),false)
				setfieldvalue("winprice",row["winprice"]||0)
				setfieldvalue("winthing",row["winthing"]||"N/A")
				setfieldvalue("place",row["place"]||0)
				setfieldvalue("totalbuyin",row["totalbuyin"]||0)
				originalreentrycount=Number(row["reentrycount"]||0)
				if(Number.isNaN(originalreentrycount)){
					originalreentrycount=0
				}
				setcheckboxvalue("inmoney",row["inmoney"]==true)
				setcheckboxvalue("inft",row["inft"]==true)
			}else{
				pttoast("ERROR_no_permission","error")
				href("sessionlist.html")
			}
		}else{
			pttoast(data["data"]||"ERROR_session_not_found","error")
			href("sessionlist.html")
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function validateresult(){
	if(numbervalue("winprice")<0){
		ptsetfieldmessage(field("winprice"),"獲獎金額不得為負數")
		showerror("獲獎金額不得為負數")
		field("winprice").focus()
		return false
	}
	ptsetfieldmessage(field("winprice"),"")
	if(numbervalue("totalbuyin")<0){
		ptsetfieldmessage(field("totalbuyin"),"總買入不得為負數")
		showerror("總買入不得為負數")
		field("totalbuyin").focus()
		return false
	}
	ptsetfieldmessage(field("totalbuyin"),"")
	if(numbervalue("place")<0){
		ptsetfieldmessage(field("place"),"名次不得為負數")
		showerror("名次不得為負數")
		field("place").focus()
		return false
	}
	ptsetfieldmessage(field("place"),"")
	return true
}

function bindresultvalidation(){
	let fieldlist=[
		"winprice",
		"totalbuyin",
		"place"
	]
	for(let i=0;i<fieldlist.length;i=i+1){
		let element=field(fieldlist[i])
		if(!element){
			continue
		}
		element.addEventListener("input",function(){
			validateresult()
		})
		element.addEventListener("change",function(){
			validateresult()
		})
	}
}

onsubmit("#form",function(element,event){
	event.preventDefault()
	if(field("submit").disabled){
		return
	}
	ptsetsubmitstate(field("submit"),true,"儲存中...")
	innertext("#error","",false)
	if(!validateresult()){
		return
	}
	ajax("PUT",AJAXURL+"editsessionresult/"+sessionid,function(event,data){
		if(data["success"]){
			leaveguard.clear()
			pttoast("修改成功","success")
			href("sessionlist.html")
		}else{
			showerror(pterror(data["data"]))
		}
	},str({
		"reentrycount": originalreentrycount,
		"winprice": numbervalue("winprice"),
		"winthing": textvalue("winthing").trim()||"N/A",
		"inmoney": checkboxvalue("inmoney"),
		"inft": checkboxvalue("inft"),
		"place": String(numbervalue("place")),
		"totalbuyin": String(numbervalue("totalbuyin"))
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})

loadsession()
bindresultvalidation()
