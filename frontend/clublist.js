
if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let clubdata=[]
let clubpage=1
let clubpagelimit=10
let clubpagination={
	"page": 1,
	"total": 0,
	"totalpages": 1,
	"hasprev": false,
	"hasnext": false
}

function safehtml(value){
	if(value==null||value==undefined){
		return ""
	}
	return String(value)
		.replace(/&/g,"&amp;")
		.replace(/</g,"&lt;")
		.replace(/>/g,"&gt;")
		.replace(/"/g,"&quot;")
		.replace(/'/g,"&#39;")
}

function clubtext(key){
	return TRANSLATE[LANGUAGE]["clublist"][key]||key
}

let leaveguard=bindleaveguard(domgetid("clubmodal"))

function applyclublanguage(){
	document.title=clubtext("title")
	innertext("h1",clubtext("title"),false)
	domgetid("searchname").placeholder=clubtext("searchplaceholder")
	domgetid("searchbutton").value=clubtext("search")
	domgetid("clearsearchbutton").value=clubtext("clear")
	domgetid("addclubbutton").value=clubtext("addclub")
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
	value("#cancelbutton",clubtext("cancel"))
	let submit=document.querySelector("#clubform input[type=\"submit\"]")
	if(submit){
		submit.value=TRANSLATE[LANGUAGE]["confirm"]
	}
}

applyclublanguage()

ajax("GET",AJAXURL+"getclublist",function(event,data){
	if(data["success"]){
		clubdata=data["data"]
		main()
	}else{
		pthandleauthfailure(data["data"]||"ERROR_token_error",{
			"toasted": false
		})
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

function main(){
	let searchname=getvalue("searchname").toLowerCase().trim()
	let totalcount=clubdata.length
	let filtered=[]

	for(let i=0;i<totalcount;i=i+1){
		let club=clubdata[i]
		let shouldshow=true

		if(searchname){
			let searchtext=[
				club["name"]||"",
				club["address"]||"",
				club["ps"]||""
			].join(" ").toLowerCase()
			if(searchtext.indexOf(searchname)==-1){
				shouldshow=false
			}
		}

		if(shouldshow){
			filtered.push(club)
		}
	}

	renderclublist(filtered)
	innertext("#totalclubs",totalcount,false)
	innertext("#displaycount",filtered.length,false)
	bindclubbuttons()
}

// 協會清單的排序狀態。key 為空字串時維持後端回傳的順序。
let clubsortstate={ "key": "","ascended": true }

// 排序取值。三個可排序欄位都是字串；取不到就回 null，由 ptsortcompare 排到最後。
function clubsortvalue(item,key){
    let value=null
    let text=""
    if(item[key]!=null){
        text=String(item[key]).trim()
    }
    if(text!=""){
        value=text
    }
    return value
}

function renderclublist(filtered){
    // **排序要在分頁之前**：先切片再排只會排到當前頁，那是假的排序
    filtered=ptsortlist(filtered,clubsortstate["key"],clubsortstate["ascended"],clubsortvalue)
	let showcount=filtered.length
	let totalpages=Math.ceil(showcount/clubpagelimit)
	if(totalpages<1){
		totalpages=1
	}
	if(clubpage>totalpages){
		clubpage=totalpages
	}
	if(clubpage<1){
		clubpage=1
	}
	let start=(clubpage-1)*clubpagelimit
	let end=start+clubpagelimit
	let pageclubs=[]
	for(let i=start;i<end&&i<showcount;i=i+1){
		pageclubs.push(filtered[i])
	}
	clubpagination={
		"page": clubpage,
		"total": showcount,
		"totalpages": totalpages,
		"hasprev": 1<clubpage,
		"hasnext": clubpage<totalpages
	}
	if(window.innerWidth<768){
		renderclubcards(pageclubs,start)
	}else{
		renderclubtable(pageclubs,start)
	}
	renderclubpagination()
}

function renderclubcards(pageclubs,start){
	let html=""
	for(let i=0;i<pageclubs.length;i=i+1){
		let club=pageclubs[i]
		html=html+`
			<div class="bg-zinc-900/70 rounded-2xl p-4 mb-3 border border-zinc-800 transition hover:border-zinc-700">
				<div class="flex justify-between gap-3 mb-2">
					<div class="text-xs text-zinc-400">#${start+i+1}</div>
					<div class="flex gap-3 text-sm">
						<input type="button" class="text-blue-400 hover:underline editbutton" data-id="${club["id"]}" value="${clubtext("edit")}">
						<input type="button" class="text-red-400 hover:underline deletebutton" data-id="${club["id"]}" value="${clubtext("delete")}">
					</div>
				</div>
				<div class="font-semibold text-lg">${safehtml(club["name"])}</div>
				<a href="https://www.google.com/maps?q=${encodeURIComponent(club["address"]||"")}" target="_blank" class="block text-blue-400 underline text-sm mt-2 break-words" rel="noopener noreferrer">${safehtml(club["address"])}</a>
				<div class="text-sm text-zinc-300 mt-2 break-words">${safehtml(club["ps"]||"-")}</div>
			</div>
		`
	}
	if(html==""){
		let message=clubtext("emptyall")
		let note=clubtext("nextadd")
		if(getvalue("searchname")){
			message=clubtext("emptysearch")
			note=clubtext("nextadd")
		}
		html=`
			<div class="bg-zinc-900/70 rounded-2xl p-6 text-center border border-zinc-800">
				<div class="text-white font-semibold mb-2">${message}</div>
				<div class="text-zinc-400 text-sm">${note}</div>
			</div>
		`
	}
	innerhtml("#clubmain",html,false)
}

function renderclubtable(pageclubs,start){
	let rows=""
	for(let i=0;i<pageclubs.length;i=i+1){
		let club=pageclubs[i]
		let rowdivider=i<pageclubs.length-1?"[&>td]:border-b [&>td]:border-zinc-800":""
		rows=rows+`
			<tr class="hover:bg-zinc-800/60 transition ${rowdivider}">
				<td class="py-3 px-4">${start+i+1}</td>
				<td class="py-3 px-4">${safehtml(club["name"])}</td>
				<td class="py-3 px-4"><a href="https://www.google.com/maps?q=${encodeURIComponent(club["address"]||"")}" target="_blank" class="underline text-blue-500" rel="noopener noreferrer">${safehtml(club["address"])}</a></td>
				<td class="py-3 px-4">${safehtml(club["ps"]||"-")}</td>
				<td class="py-3 px-4">
					<input type="button" class="text-blue-400 hover:underline mr-3 editbutton" data-id="${club["id"]}" value="${clubtext("edit")}">
					<input type="button" class="text-red-400 hover:underline deletebutton" data-id="${club["id"]}" value="${clubtext("delete")}">
				</td>
			</tr>
		`
	}
	if(rows==""){
		let message=clubtext("emptyall")
		let note=clubtext("nextadd")
		if(getvalue("searchname")){
			message=clubtext("emptysearch")
		}
		rows=`<tr><td colspan="5" class="py-6 text-center"><div class="text-white font-semibold mb-2">${message}</div><div class="text-zinc-400 text-sm">${note}</div></td></tr>`
	}
	innerhtml("#clubmain",`
		<div class="max-h-[50vh] overflow-auto md:rounded-2xl md:border md:border-zinc-800 md:bg-zinc-900/40">
			<table class="w-full text-sm border-separate border-spacing-0">
				<thead>
					<tr class="text-zinc-300" id="clublisthead">
						<th class="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-3 px-4">#</th>
						<th class="ptsortth select-none sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-3 px-4" data-sortkey="name"><span>${clubtext("name")}</span><span class="ptsortarrow text-emerald-400" data-sortkey="name"></span></th>
						<th class="ptsortth select-none sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-3 px-4" data-sortkey="address"><span>${clubtext("address")}</span><span class="ptsortarrow text-emerald-400" data-sortkey="address"></span></th>
						<th class="ptsortth select-none sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-3 px-4" data-sortkey="ps"><span>${clubtext("note")}</span><span class="ptsortarrow text-emerald-400" data-sortkey="ps"></span></th>
						<th class="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-3 px-4">${clubtext("action")}</th>
					</tr>
				</thead>
				<tbody class="text-center">${rows}</tbody>
			</table>
		</div>
	`,false)
    // 這一頁每次 render 會把整個 thead 重畫，所以箭頭與點擊都要在這裡重來一次
    ptsortarrow("#clublisthead",clubsortstate["key"],clubsortstate["ascended"])
    ptbindsort("#clublisthead",clubsortstate,function(){
        clubpage=1
        main()
    })
}

function renderclubpagination(){
	let html=`
		<input type="button" class="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-3 py-2 rounded-xl cursor-pointer transition" id="clubprevpage" value="${clubtext("prevpage")}" ${clubpagination["hasprev"]?"":"disabled"}>
	`
	for(let i=1;i<=clubpagination["totalpages"];i=i+1){
		if(i==1||i==clubpagination["totalpages"]||Math.abs(i-clubpagination["page"])<=2){
			html=html+`
				<input type="button" class="${i==clubpagination["page"]?"bg-emerald-600":"bg-zinc-800 hover:bg-zinc-700"} px-3 py-2 rounded-xl cursor-pointer clubpagebutton transition" data-page="${i}" value="${i}">
			`
		}
	}
	html=html+`
		<input type="button" class="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-3 py-2 rounded-xl cursor-pointer transition" id="clubnextpage" value="${clubtext("nextpage")}" ${clubpagination["hasnext"]?"":"disabled"}>
		<span class="text-zinc-400 text-sm px-2">${clubtext("totalcount").replace("%s",clubpagination["total"]||0)}</span>
	`
	innerhtml("#clubpagination",html,false)
	onclick("#clubprevpage",function(element,event){
		if(clubpagination["hasprev"]){
			clubpage=clubpage-1
			main()
		}
	})
	onclick("#clubnextpage",function(element,event){
		if(clubpagination["hasnext"]){
			clubpage=clubpage+1
			main()
		}
	})
	onclick(".clubpagebutton",function(element,event){
		let pagevalue=int(dataset(element,"page"))
		if(0<pagevalue&&pagevalue!=clubpage){
			clubpage=pagevalue
			main()
		}
	})
}

function openclubmodal(){
	let modal=domgetid("clubmodal")
	if(modal&&modal.style.display!="flex"){
		ptlockpagescroll()
	}
	style("#clubmodal",[
		["display","flex"]
	])
}

function closeclubmodal(){
	let modal=domgetid("clubmodal")
	let opened=false
	if(modal&&modal.style.display=="flex"){
		opened=true
	}
	style("#clubmodal",[
		["display","none"]
	])
	if(opened){
		ptunlockpagescroll()
	}
}

function bindclubbuttons(){
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
			leaveguard.clear()
			openclubmodal()
		}
	})

	onclick(".deletebutton",function(element,event){
		let clubid=dataset(element,"id")
		ptconfirm(clubtext("deleteconfirm"),function(ok){
			if(!ok){
				return
			}
			element.disabled=true

			ajax("DELETE",AJAXURL+"deleteclub/"+clubid,function(event,data){
				if(data["success"]){
					pttoastsuccess(clubtext("deletesuccess"))
					pttoastwarning(clubtext("deletenext"))

					ajax("GET",AJAXURL+"getclublist",function(event,data){
						if(data["success"]){
							clubdata=data["data"]
							main()
						}else{
							pttoasterror(data["data"]||clubtext("unknownerror"))
						}
					},null,[
						["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
					],{
						loadingtarget: "#clubmain"
					})
				}else{
					pttoasterror(clubtext("deletefail"))
					element.disabled=false
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			],{
				loadingtarget: "#clubmain"
			})
		})
	})
}

onclick("#addclubbutton",function(){
	innertext("#modaltitle",clubtext("addclub"),false)
	value("#clubid","")
	value("#clubname","")
	value("#clubaddress","")
	value("#clubps","")
	leaveguard.clear()
	openclubmodal()
})

onclick("#closemodal",function(element,event){
	if(!leaveguard.confirmleave()){
		return
	}
	closeclubmodal()
})

onclick("#cancelbutton",function(element,event){
	if(!leaveguard.confirmleave()){
		return
	}
	closeclubmodal()
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
				pttoastsuccess(clubtext("editsuccess"))
			}else{
				pttoastsuccess(clubtext("addsuccess"))
			}

			leaveguard.clear()
			closeclubmodal()

			ajax("GET",AJAXURL+"getclublist",function(event,data){
				if(data["success"]){
					clubdata=data["data"]
					main()
				}else{
					pttoasterror(data["data"]||clubtext("unknownerror"))
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			],{
				loadingtarget: "#clubmain"
			})
		}else{
			if(data["data"]){
				pttoasterror(clubtext("operationfail")+": "+data["data"])
			}else{
				pttoasterror(clubtext("operationfail")+": "+clubtext("unknownerror"))
			}
		}
	},str({
		"name": getvalue("clubname"),
		"address": getvalue("clubaddress"),
		"ps": getvalue("clubps")
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")],
		["Content-Type","application/json"]
	],{
		loadingtarget: "#clubmodal"
	})
})

onclick("#searchbutton",function(element,event){
	clubpage=1
	main()
})

onclick("#clearsearchbutton",function(element,event){
	value("#searchname","")
	clubpage=1
	main()
})

on("#searchname","keypress",function(event){
	if(event.key=="Enter"){
		clubpage=1
		main()
	}
})

window.addEventListener("resize",function(){
	main()
})
