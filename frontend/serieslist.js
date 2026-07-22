if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function seriestext(key){
	return TRANSLATE[LANGUAGE]["series"][key]||key
}

let leaveguard=bindleaveguard(domgetid("createpanel"))

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

// 把金額格式化：整數就不顯示小數，並加上正負號與顏色
function profitdisplay(value){
	let number=Number(value)||0
	let text=Number.isInteger(number)?String(number):number.toFixed(2)
	return {
		"text": (0<=number?"+":"")+text,
		"class": 0<=number?"text-green-400":"text-red-400"
	}
}

function moneydisplay(value){
	let number=Number(value)||0
	return Number.isInteger(number)?String(number):number.toFixed(2)
}

function daterange(row){
	let start=ptformatdatetime(row["starttime"]).substring(0,10)
	let end=ptformatdatetime(row["endtime"]).substring(0,10)
	if(start&&end){
		return start+" ~ "+end
	}
	return start||end||""
}

function applylanguage(){
	document.title=seriestext("title")+" - PokerTrace"
	innertext("#pagetitle",seriestext("title"),false)
	innertext("#eyebrow",seriestext("eyebrow"),false)
	value("#togglecreate",seriestext("newseries"))
	value("#togglecreatemobile",seriestext("newseries"))
	value("#createsubmit",seriestext("create"))
	domgetid("f-name").placeholder=seriestext("nameplaceholder")
	domgetid("f-description").placeholder=seriestext("descriptionplaceholder")
	let labels=document.querySelectorAll("[data-label]")
	for(let i=0;i<labels.length;i=i+1){
		labels[i].textContent=seriestext(dataset(labels[i],"label"))
	}
	let opts=document.querySelectorAll("[data-opt]")
	for(let i=0;i<opts.length;i=i+1){
		opts[i].textContent=seriestext(dataset(opts[i],"opt"))
	}
}

function rendercard(row){
	let profit=profitdisplay(row["totalprofit"])
	let range=daterange(row)
	let isown=(row["isowner"]==true)
	let deletebtn=isown?`<input type="button" class="relative z-10 cursor-pointer shrink-0 text-red-400 hover:underline text-sm deleteseries" data-id="${row["id"]}" data-name="${safehtml(row["name"])}" value="${seriestext("delete")}">`:`<span class="shrink-0 text-xs text-zinc-500">${seriestext("shared")}</span>`
	return `
		<div class="relative bg-zinc-900/70 rounded-2xl p-5 border border-zinc-800 transition hover:border-emerald-500/60 cursor-pointer flex flex-col gap-3">
			<a href="series.html?id=${row["id"]}" class="absolute inset-0 rounded-2xl" aria-label="${safehtml(row["name"])||seriestext("notitle")}"></a>
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<div class="font-bold text-lg truncate">${safehtml(row["name"])||seriestext("notitle")}</div>
					<div class="text-xs text-zinc-500 mt-1">${safehtml(row["token"]||"")}${range?" · "+range:""}</div>
				</div>
				${deletebtn}
			</div>
			<div class="grid grid-cols-2 gap-3 text-sm">
				<div class="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3 text-center">
					<div class="text-zinc-500 text-xs">${seriestext("sessioncount")}</div>
					<div class="font-extrabold text-lg mt-1">${row["sessioncount"]||0}</div>
				</div>
				<div class="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3 text-center">
					<div class="text-zinc-500 text-xs">${seriestext("myprofit")}</div>
					<div class="font-extrabold text-lg mt-1 ${profit["class"]}">${profit["text"]}</div>
				</div>
			</div>
		</div>
	`
}

function renderlist(rows){
	if(!rows||rows.length<=0){
		ptshowempty("#main",seriestext("empty"),`<div class="text-xs text-zinc-500 mt-2">${seriestext("emptyhint")}</div>`)
		return
	}
	innerhtml("#main",`<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">${rows.map(rendercard).join("")}</div>`,false)
	binddelete()
}

function binddelete(){
	onclick(".deleteseries",function(element,event){
		event.preventDefault()
		event.stopPropagation()
		ptconfirm(seriestext("deleteconfirm"),function(ok){
			if(!ok){
				return
			}
			ajax("DELETE",AJAXURL+"deleteseries/"+dataset(element,"id"),function(event,data){
				if(data["success"]){
					pttoastsuccess(seriestext("deleted"))
					loadseries()
				}else{
					pttoast(data["data"]||seriestext("unknownerror"),"error")
				}
			},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
				loadingtarget: "#main"
			})
		})
	})
}

function loadseries(){
	ajax("GET",AJAXURL+"getserieslist",function(event,data){
		if(data["success"]){
			renderlist(data["data"]||[])
		}else{
			pttoast(data["data"]||seriestext("networkerror"),"error")
		}
	},null,[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]],{
		loadingtarget: "#main"
	})
}

function togglecreatepanel(){
	let panel=domgetid("createpanel")
	if(!panel){
		return
	}
	if(!panel.classList.contains("hidden")){
		if(!leaveguard.confirmleave()){
			return
		}
		leaveguard.clear()
		panel.classList.add("hidden")
		return
	}
	panel.classList.remove("hidden")
	domgetid("f-name").focus()
}

function emptyornull(id){
	let v=getvalue(id)
	return v?v:null
}

applylanguage()
loadseries()

onclick("#togglecreate",function(element,event){
	togglecreatepanel()
})
onclick("#togglecreatemobile",function(element,event){
	togglecreatepanel()
})

domgetid("createform").addEventListener("submit",function(event){
	event.preventDefault()
	let submit=domgetid("createsubmit")
	if(submit.disabled){
		return
	}
	let name=getvalue("f-name").trim()
	if(!name){
		pttoast(seriestext("requiredname"),"error")
		return
	}
	ptsetsubmitstate(submit,true,seriestext("creating"))
	let payload={
		"name": name,
		"description": getvalue("f-description")||"",
		"scoringtype": getvalue("f-scoringtype")||"profit",
		"starttime": emptyornull("f-starttime"),
		"endtime": emptyornull("f-endtime"),
		"private": domgetid("f-private").checked
	}
	ajax("POST",AJAXURL+"newseries",function(event,data){
		ptsetsubmitstate(submit,false)
		if(data["success"]){
			pttoastsuccess(seriestext("created"))
			leaveguard.clear()
			href("series.html?id="+data["data"])
		}else{
			pttoast(data["data"]||seriestext("unknownerror"),"error")
		}
	},str(payload),[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]])
})
