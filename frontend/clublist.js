
if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let clubdata=[]

ajax("GET",AJAXURL+"getclublist",function(event,data){
	if(data["success"]){
		clubdata=data["data"]
		main()
	}else{
		alert("權限已失效,請重新登入")
		weblsset(WEBLSNAME+"signin",null)
		weblsset(WEBLSNAME+"token",null)
		href("signin.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

function main(){
	let searchname=getvalue("searchname").toLowerCase()

	innerhtml("#clubtable","",false)

	let displayindex=0
	let totalcount=clubdata.length
	let showcount=0

	for(let i=0;i<totalcount;i=i+1){
		let club=clubdata[i]
		let shouldshow=true

		if(searchname){
			if(club.name.toLowerCase().indexOf(searchname)==-1){
				shouldshow=false
			}
		}

		if(shouldshow){
			displayindex=displayindex+1
			showcount=showcount+1

			innerhtml("#clubtable",`
				<tr class="hover:bg-zinc-700 transition border-b border-zinc-700">
					<td class="py-3 px-4">${displayindex}</td>
					<td class="py-3 px-4">${club["name"]}</td>
					<td class="py-3 px-4"><a href="https://www.google.com/maps?q=${club["address"]}" target="__blank" class="underline text-blue-500">${club["address"]}</a></td>
					<td class="py-3 px-4">${club["ps"]||"-"}</td>
					<td class="py-3 px-4">
						<button class="text-blue-400 hover:underline mr-3 editbutton" data-id="${club["id"]}">編輯</button>
						<button class="text-red-400 hover:underline deletebutton" data-id="${club["id"]}">刪除</button>
					</td>
				</tr>
			`)
		}
	}

	innertext("#totalclubs",totalcount,false)
	innertext("#displaycount",showcount,false)

	onclick(".editbutton",function(element,event){
		let clubid=dataset(element,"id")
		let club=null
		for(let i=0;i<clubdata.length;i=i+1){
			if(clubdata[i].id==clubid){
				club=clubdata[i]
			}
		}

		if(club){
			innertext("#modaltitle","編輯協會",false)
			value("#clubid",club["id"])
			value("#clubname",club["name"])
			value("#clubaddress",club["address"])
			value("#clubps",club["ps"]||"")
			style("#clubmodal",[
				["display","flex"]
			])
		}
	})

	onclick(".deletebutton",function(element,event){
		let clubid=dataset(element,"id")

		if(confirm("確定刪除此協會?")){
			element.disabled=true

			ajax("DELETE",AJAXURL+"deleteclub/"+clubid,function(event,data){
				if(data["success"]){
					alert("刪除成功")

					ajax("GET",AJAXURL+"getclublist",function(event,data){
						if(data["success"]){
							clubdata=data["data"]
							main()
						}
					},null,[
						["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
					])
				}else{
					alert("刪除失敗")
					element.disabled=false
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		}
	})
}

onclick("#addclubbutton",function(){
	innertext("#modaltitle","新增協會",false)
	value("#clubid","")
	value("#clubname","")
	value("#clubaddress","")
	value("#clubps","")
	style("#clubmodal",[
		["display","flex"]
	])
})

onclick("#closemodal",function(element,event){
	style("#clubmodal",[
		["display","none"]
	])
})

onclick("#cancelbutton",function(element,event){
	style("#clubmodal",[
		["display","none"]
	])
})

onsubmit("#clubform",function(element,event){
	event.preventDefault()

	let clubid=getvalue("clubid")
	let method="POST"
	let url=AJAXURL+"newclub"

	if(clubid){
		method="PUT"
		url=AJAXURL+"editclub/"+clubid
	}

	ajax(method,url,function(event,data){
		if(data["success"]){
			if(clubid){
				alert("修改成功")
			}else{
				alert("新增成功")
			}

			style("#clubmodal",[
				["display","none"]
			])

			ajax("GET",AJAXURL+"getclublist",function(event,data){
				if(data["success"]){
					clubdata=data["data"]
					main()
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		}else{
			if(data["data"]){
				alert("操作失敗: "+data["data"])
			}else{
				alert("操作失敗: 未知錯誤")
			}
		}
	},str({
		"name": getvalue("clubname"),
		"address": getvalue("clubaddress"),
		"ps": getvalue("clubps")
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")],
		["Content-Type","application/json"]
	])
})

function deleteclub(clubid,element){
	if(confirm("確定刪除此協會?")){
		element.disabled=true

		ajax("DELETE",AJAXURL+"deleteclub/"+clubid,function(event,data){
			if(data["success"]){
				alert("刪除成功")

				ajax("GET",AJAXURL+"getclublist",function(event,data){
					if(data["success"]){
						clubdata=data["data"]
						main()
					}
				},null,[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				])
			}else{
				alert("刪除失敗")
				element.disabled=false
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	}
}

onclick("#searchbutton",main)

on("#searchname","keypress",function(event){
	if(event.key=="Enter"){
		main()
	}
})