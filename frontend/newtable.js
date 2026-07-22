let sessionid=getget("sessionid")

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function newtabletext(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["newtablepage"]&&TRANSLATE[LANGUAGE]["newtablepage"][key]){
		return TRANSLATE[LANGUAGE]["newtablepage"][key]
	}
	return fallback
}

onclick("#back",function(element,event){
	href("session.html?id="+sessionid+"#1")
})

ajax("GET",AJAXURL+"getsession/"+sessionid,function(event,data){
	if(data["success"]){
		onclick("#back",function(element,event){
			href("session.html?id="+sessionid+"#1")
		})

		onsubmit("#form",function(element,event){
			event.preventDefault()

			domgetid("submit").disabled=true
			innertext("#error","",false)

			let tableno=getvalue("no")
			let rangestart=getvalue("rangestart")
			let rangeend=getvalue("rangeend")
			let ranged=false
			if(rangestart!=""||rangeend!=""){
				ranged=true
			}
			if(ranged){
				if(rangestart==""){
					rangestart=rangeend
				}
				if(rangeend==""){
					rangeend=rangestart
				}
				rangestart=parseInt(rangestart)
				rangeend=parseInt(rangeend)
				if(!rangestart||!rangeend||rangestart<1||rangeend<rangestart){
					innertext("#error",newtabletext("rangeerror","請輸入正確的牌桌編號範圍"),false)
					domgetid("submit").disabled=false
					return
				}
				if(100<rangeend-rangestart+1){
					innertext("#error",newtabletext("rangelimit","一次最多新增 100 個牌桌"),false)
					domgetid("submit").disabled=false
					return
				}
			}else{
				tableno=parseInt(tableno)
				if(!tableno||tableno<1){
					innertext("#error",newtabletext("tablenorequired","請輸入牌桌編號"),false)
					domgetid("submit").disabled=false
					return
				}
			}

			ajax("POST",AJAXURL+"newtable/"+sessionid,function(event,data){
				if(data["success"]){
					pttoast(newtabletext("addsuccess","新增成功"),"success")
					setTimeout(function(){
						href("session.html?id="+sessionid+"#1")
					},300)
				}else{
					innertext("#error",ERRORLIST[data["data"]]||newtabletext("unknownerror","未知錯誤"),false)
					domgetid("submit").disabled=false
				}
			},str({
				"no": getvalue("no"),
				"rangestart": getvalue("rangestart"),
				"rangeend": getvalue("rangeend")
			}),[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		})
	}else{
		pttoast(newtabletext("sessionnotfound","查無指定場次"),"error")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])
