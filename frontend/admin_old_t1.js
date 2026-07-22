if(!weblsget(WEBLSNAME+"signin")){
	href("./")
}

let adminlogpage=1
let adminloglimit=20
let adminlogerroronly=false

function adminlogtext(key,fallback){
	if(TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["adminlogpage"]&&TRANSLATE[LANGUAGE]["adminlogpage"][key]){
		return TRANSLATE[LANGUAGE]["adminlogpage"][key]
	}
	if(fallback!=null){
		return fallback
	}
	return key
}

function applyadminloglanguage(){
	document.title=adminlogtext("title")+" - PokerTrace"
	let eyebrow=domgetid("adminlogeyebrow")
	if(eyebrow){
		eyebrow.textContent=adminlogtext("eyebrow","API Access Log")
	}
	let heading=domgetid("adminlogheading")
	if(heading){
		heading.textContent=adminlogtext("heading")
	}
	let keyword=domgetid("adminlogkeyword")
	if(keyword){
		keyword.setAttribute("placeholder",adminlogtext("searchplaceholder"))
	}
	let search=domgetid("searchadminlog")
	if(search){
		search.value=adminlogtext("search")
	}
	let erroronly=domgetid("adminlogerroronly")
	if(erroronly){
		erroronly.value=adminlogtext("erroronly")
	}
	let reload=domgetid("reloadadminlog")
	if(reload){
		reload.value=adminlogtext("reload")
	}
	let coltime=domgetid("adminlogcoltime")
	if(coltime){
		coltime.textContent=adminlogtext("coltime")
	}
	let coluser=domgetid("adminlogcoluser")
	if(coluser){
		coluser.textContent=adminlogtext("coluser")
	}
	let colpath=domgetid("adminlogcolpath")
	if(colpath){
		colpath.textContent=adminlogtext("colpath")
	}
	let colstatus=domgetid("adminlogcolstatus")
	if(colstatus){
		colstatus.textContent=adminlogtext("colstatus")
	}
	let detailtitle=domgetid("adminlogdetailtitle")
	if(detailtitle){
		detailtitle.textContent=adminlogtext("detailtitle")
	}
}

function statuscodeclass(code){
	let number=Number(code)
	if(400<=number){
		return "bg-rose-500/15 text-rose-200"
	}
	if(300<=number){
		return "bg-yellow-500/15 text-yellow-200"
	}
	return "bg-emerald-500/15 text-emerald-200"
}

function formatdatetime(value){
	if(!value){
		return ""
	}
	let date=new Date(value)
	if(isNaN(date.getTime())){
		return value
	}
	let pad=function(number){
		return String(number).padStart(2,"0")
	}
	return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())+" "+pad(date.getHours())+":"+pad(date.getMinutes())+":"+pad(date.getSeconds())
}

function userlabelof(item){
	if(item["username"]){
		return escapehtml(item["username"])+" / "+escapehtml(item["userplayerid"]||"")
	}
	if(item["userid"]){
		return adminlogtext("unknownuser")+" #"+escapehtml(item["userid"])
	}
	return adminlogtext("anonymous")
}

let adminlogrows=[]

function renderadminlog(row){
	adminlogrows=row
	let html=""
	for(let i=0;i<row.length;i=i+1){
		let item=row[i]
		html=html+`
			<tr class="adminlogrow border-t border-zinc-800 hover:bg-zinc-900/60 cursor-pointer" data-index="${i}">
				<td class="px-4 py-3 whitespace-nowrap text-zinc-300">${escapehtml(formatdatetime(item["createtime"]))}</td>
				<td class="px-4 py-3 text-zinc-200">${userlabelof(item)}<div class="text-xs text-zinc-500">${escapehtml(item["useremail"]||"")}</div></td>
				<td class="px-4 py-3 text-zinc-300 font-mono text-xs">${escapehtml(item["path"])}</td>
				<td class="px-4 py-3"><span class="text-xs px-2 py-1 rounded ${statuscodeclass(item["statuscode"])}">${escapehtml(item["statuscode"])}</span></td>
			</tr>
		`
	}
	if(!html){
		html=`<tr><td colspan="4" class="px-4 py-6 text-center text-zinc-400">${adminlogtext("empty")}</td></tr>`
	}
	innerhtml("#adminlogtablebody",html,false)
	onclick(".adminlogrow",function(element,event){
		openadminlogdetail(Number(dataset(element,"index")))
	})
}

function openadminlogdetail(index){
	let item=adminlogrows[index]
	if(!item){
		return
	}
	let userlabel=adminlogtext("anonymous")
	if(item["username"]){
		userlabel=item["username"]+" / "+(item["userplayerid"]||"")
	}else if(item["userid"]){
		userlabel=adminlogtext("unknownuser")+" #"+item["userid"]
	}
	let rows=[
		[adminlogtext("coltime"),formatdatetime(item["createtime"])],
		[adminlogtext("coluser"),userlabel+(item["useremail"]?(" / "+item["useremail"]):"")],
		[adminlogtext("colmethod"),item["method"]],
		[adminlogtext("colpath"),item["path"]],
		[adminlogtext("colstatus"),item["statuscode"]],
		[adminlogtext("colip"),item["ipaddress"]||"-"],
		[adminlogtext("colagent"),item["useragent"]||"-"]
	]
	let html=""
	for(let i=0;i<rows.length;i=i+1){
		html=html+`
			<div>
				<div class="text-xs uppercase tracking-wide text-zinc-500">${escapehtml(rows[i][0])}</div>
				<div class="mt-1 break-all text-zinc-100">${escapehtml(rows[i][1])}</div>
			</div>
		`
	}
	innerhtml("#adminlogdetailbody",html,false)
	let modal=domgetid("adminlogdetailmodal")
	if(modal){
		modal.classList.remove("hidden")
	}
}

function closeadminlogdetail(){
	let modal=domgetid("adminlogdetailmodal")
	if(modal){
		modal.classList.add("hidden")
	}
}

onclick("#closeadminlogdetail",function(element,event){
	closeadminlogdetail()
})

onclick("#adminlogdetailmodal",function(element,event){
	if(event.target==element){
		closeadminlogdetail()
	}
})

function renderadminlogpagination(pagination){
	renderptpagination("adminlogpagination",pagination,function(pagevalue){
		adminlogpage=pagevalue
		loadadminlog()
	})
}

function loadadminlog(){
	let keywordinput=domgetid("adminlogkeyword")
	let keyword=keywordinput?keywordinput.value.trim():""
	let url=AJAXURL+"getapilog?page="+adminlogpage+"&limit="+adminloglimit
	if(keyword){
		url=url+"&keyword="+encodeURIComponent(keyword)
	}
	if(adminlogerroronly){
		url=url+"&erroronly=1"
	}
	ajax("GET",url,function(event,data){
		if(data["success"]){
			renderadminlog(data["data"]["logs"]||[])
			renderadminlogpagination(data["data"]["pagination"]||{})
		}else{
			pttoast(pterror(data["data"]||adminlogtext("loadfail")),"error")
			if(data["data"]=="ERROR_no_permission"||data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
				setTimeout(function(){
					href("./")
				},700)
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#adminlogtablebody"
	})
}

onclick("#reloadadminlog",function(element,event){
	adminlogpage=1
	loadadminlog()
})

onclick("#searchadminlog",function(element,event){
	adminlogpage=1
	loadadminlog()
})

function renderadminlogerroronly(){
	let button=domgetid("adminlogerroronly")
	if(!button){
		return
	}
	button.setAttribute("aria-pressed",adminlogerroronly?"true":"false")
	if(adminlogerroronly){
		button.classList.remove("border-zinc-700","bg-zinc-800")
		button.classList.add("border-rose-400","bg-rose-500/15","text-rose-200")
	}else{
		button.classList.remove("border-rose-400","bg-rose-500/15","text-rose-200")
		button.classList.add("border-zinc-700","bg-zinc-800")
	}
}

onclick("#adminlogerroronly",function(element,event){
	adminlogerroronly=!adminlogerroronly
	renderadminlogerroronly()
	adminlogpage=1
	loadadminlog()
})

let keywordinput=domgetid("adminlogkeyword")
if(keywordinput){
	keywordinput.onkeydown=function(event){
		if(event.key=="Enter"){
			adminlogpage=1
			loadadminlog()
		}
	}
}

let limitselect=domgetid("adminloglimitselect")
if(limitselect){
	adminloglimit=Number(limitselect.value)||20
	limitselect.onchange=function(){
		adminloglimit=Number(limitselect.value)||20
		adminlogpage=1
		loadadminlog()
	}
}

applyadminloglanguage()
loadadminlog()
