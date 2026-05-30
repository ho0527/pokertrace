
if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let clubdata=[]

function clubtext(key){
	return TRANSLATE[LANGUAGE]["clublist"][key]
}

function applyclublanguage(){
	document.title=clubtext("title")
	innertext("h1",clubtext("title"),false)
	domgetid("searchname").placeholder=clubtext("searchplaceholder")
	domgetid("searchbutton").value=clubtext("search")
	domgetid("addclubbutton").value=clubtext("addclub")
	let heads=document.querySelectorAll("thead th")
	let headtexts=[
		"#",
		clubtext("name"),
		clubtext("address"),
		clubtext("note"),
		clubtext("action")
	]
	for(let i=0;i<heads.length&&i<headtexts.length;i=i+1){
		heads[i].textContent=headtexts[i]
	}
	let stattitle=document.querySelector(".bg-zinc-800.rounded-lg.p-6.my-8 .text-lg")
	if(stattitle){
		stattitle.textContent=clubtext("stats")
	}
	let statlabels=document.querySelectorAll(".bg-zinc-800.rounded-lg.p-6.my-8 .text-zinc-400")
	if(0<statlabels.length){
		statlabels[0].textContent=clubtext("totalclubs")
	}
	if(1<statlabels.length){
		statlabels[1].textContent=clubtext("displaycount")
	}
	let labels=document.querySelectorAll("#clubform label")
	if(0<labels.length){
		labels[0].innerHTML=clubtext("name")+' <span class="text-red-500">*</span>'
	}
	if(1<labels.length){
		labels[1].innerHTML=clubtext("address")+' <span class="text-red-500">*</span>'
	}
	if(2<labels.length){
		labels[2].textContent=clubtext("note")
	}
	innertext("#modaltitle",clubtext("addclub"),false)
	innertext("#cancelbutton",clubtext("cancel"),false)
	let submit=document.querySelector("#clubform button[type=\"submit\"]")
	if(submit){
		submit.textContent=TRANSLATE[LANGUAGE]["confirm"]
	}
}

applyclublanguage()

ajax("GET",AJAXURL+"getclublist",function(event,data){
	if(data["success"]){
		clubdata=data["data"]
		main()
	}else{
		alert(clubtext("tokenexpired"))
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
						<button class="text-blue-400 hover:underline mr-3 editbutton" data-id="${club["id"]}">${clubtext("edit")}</button>
						<button class="text-red-400 hover:underline deletebutton" data-id="${club["id"]}">${clubtext("delete")}</button>
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
			innertext("#modaltitle",clubtext("editclub"),false)
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

		if(confirm(clubtext("deleteconfirm"))){
			element.disabled=true

			ajax("DELETE",AJAXURL+"deleteclub/"+clubid,function(event,data){
				if(data["success"]){
					alert(clubtext("deletesuccess"))

					ajax("GET",AJAXURL+"getclublist",function(event,data){
						if(data["success"]){
							clubdata=data["data"]
							main()
						}
					},null,[
						["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
					])
				}else{
					alert(clubtext("deletefail"))
					element.disabled=false
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			])
		}
	})
}

onclick("#addclubbutton",function(){
	innertext("#modaltitle",clubtext("addclub"),false)
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
				alert(clubtext("editsuccess"))
			}else{
				alert(clubtext("addsuccess"))
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
				alert(clubtext("operationfail")+": "+data["data"])
			}else{
				alert(clubtext("operationfail")+": "+clubtext("unknownerror"))
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
	if(confirm(clubtext("deleteconfirm"))){
		element.disabled=true

		ajax("DELETE",AJAXURL+"deleteclub/"+clubid,function(event,data){
			if(data["success"]){
				alert(clubtext("deletesuccess"))

				ajax("GET",AJAXURL+"getclublist",function(event,data){
					if(data["success"]){
						clubdata=data["data"]
						main()
					}
				},null,[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				])
			}else{
				alert(clubtext("deletefail"))
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
