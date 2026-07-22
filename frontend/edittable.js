let tableid=getget("id")
let sessionid=null
let leaveguard=bindleaveguard()

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function edittabletext(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["edittablepage"]&&TRANSLATE[LANGUAGE]["edittablepage"][key]){
		return TRANSLATE[LANGUAGE]["edittablepage"][key]
	}
	return fallback
}

ajax("GET",AJAXURL+"gettable/"+tableid,function(event,data){
	if(data["success"]){
		let row=data["data"]

		sessionid=row["sessionid"]

		value("#no",row["no"])

		onclick("#back",function(element,event){
			if(!leaveguard.confirmleave()){return}
			href("session.html?id="+sessionid+"#1")
		})
	}else{
		pttoast(edittabletext("tablenotfound","查無指定牌桌"),"error")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

onsubmit("#form",function(element,event){
	event.preventDefault()

	domgetid("submit").disabled=true

	let tableno=parseInt(getvalue("no"))
	if(!tableno||tableno<1){
		innertext("#error",edittabletext("tablenorequired","請輸入牌桌編號"),false)
		domgetid("submit").disabled=false
		return
	}

	ajax("PUT",AJAXURL+"edittable/"+tableid,function(event,data){
		if(data["success"]){
			leaveguard.clear()
			pttoast(edittabletext("editsuccess","修改成功"),"success")
			setTimeout(function(){
				href("session.html?id="+sessionid+"#1")
			},300)
		}else{
			innertext("#error",ERRORLIST[data["data"]]||edittabletext("unknownerror","未知錯誤"),false)
			domgetid("submit").disabled=false
		}
	},str({
		"no": getvalue("no")
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})
