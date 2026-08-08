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

// 預設帶入「下一個可用的牌桌編號」。
//
// 原本這個欄位是空的，只靠 HTML 上一個灰色的 placeholder="1" 當提示 ——
// 而編輯頁帶進來的真實值長得幾乎一樣，兩頁擺在一起會分不出「這是預設值」還是
// 「這只是提示、我其實沒填」。填一個真的值進去，順便省掉每次自己想編號。
//
// 取現有最大編號 +1；一張桌都沒有就從 1 開始。抓不到清單時**不填**，
// 讓使用者自己輸入，總比塞一個可能撞號的值好。
ajax("GET",AJAXURL+"gettablelist/"+sessionid,function(event,data){
	if(data["success"]){
		let rows=data["data"]||[]
		let maxno=0
		for(let i=0;i<rows.length;i=i+1){
			let no=parseInt(rows[i]["no"])
			if(!isNaN(no)&&maxno<no){
				maxno=no
			}
		}
		value("#no",maxno+1)
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

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
