// 通知中心（檢查表 3.1）：站內通知列表、已讀、刪除
if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let notifpage=1
let notiflimit=20

function nt(key,fallback){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["notificationpage"]&&TRANSLATE[LANGUAGE]["notificationpage"][key]){
		return TRANSLATE[LANGUAGE]["notificationpage"][key]
	}
	if(fallback!=null){
		return fallback
	}
	return key
}

function notifescape(value){
	return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

function applynotifstatic(){
	document.title=nt("title","通知中心")+" - PokerTrace"
	innertext("#notifeyebrow",nt("eyebrow","Notification"),false)
	innertext("#notiftitle",nt("title","通知中心"),false)
	innertext("#notifempty",nt("empty","目前沒有通知"),false)
	let refresh=domgetid("refreshnotif")
	if(refresh){
		refresh.value=nt("refresh","重新整理")
	}
	let readall=domgetid("readallnotif")
	if(readall){
		readall.value=nt("readall","全部已讀")
	}
	let search=domgetid("searchnotif")
	if(search){
		search.value=nt("search","搜尋")
	}
	let keyword=domgetid("notifkeyword")
	if(keyword){
		keyword.setAttribute("placeholder",nt("searchplaceholder","搜尋標題或內容"))
	}
}

function notifcardhtml(row){
	let unreaded=(row["readed"]===false||row["readed"]===0||row["readed"]=="false")
	let border=unreaded?"border-emerald-500/40":"border-zinc-800"
	let dot=unreaded?"<span class=\"inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-400\"></span>":""
	let unreadtag=unreaded?"<span class=\"shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-300\">"+nt("unread","未讀")+"</span>":""
	let readbtn=unreaded?"<input type=\"button\" class=\"notifread cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-200 transition hover:bg-zinc-700\" data-id=\""+notifescape(row["id"])+"\" value=\""+notifescape(nt("markread","標為已讀"))+"\">":""
	return ""+
	"<div class=\"rounded-2xl border "+border+" bg-zinc-900/70 p-4\">"+
		"<div class=\"mb-1 flex items-center gap-2\">"+
			dot+
			"<div class=\"min-w-0 flex-1 text-base font-bold text-white\">"+notifescape(row["title"]||"")+"</div>"+
			unreadtag+
		"</div>"+
		"<div class=\"mb-3 whitespace-pre-line text-sm leading-7 text-zinc-300\">"+notifescape(row["message"]||"")+"</div>"+
		"<div class=\"flex items-center justify-between gap-2\">"+
			"<span class=\"text-xs text-zinc-500\">"+notifescape(ptformatdatetime(row["createtime"]))+"</span>"+
			"<div class=\"flex gap-2\">"+
				readbtn+
				"<input type=\"button\" class=\"notifdelete cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-bold text-rose-300 transition hover:border-rose-400\" data-id=\""+notifescape(row["id"])+"\" value=\""+notifescape(nt("delete","刪除"))+"\">"+
			"</div>"+
		"</div>"+
	"</div>"
}

function rendernotifs(rows){
	let list=domgetid("notiflist")
	let empty=domgetid("notifempty")
	if(!rows||rows.length<1){
		if(list){list.innerHTML=""}
		if(empty){empty.classList.remove("hidden")}
		return
	}
	if(empty){empty.classList.add("hidden")}
	let html=""
	for(let i=0;i<rows.length;i=i+1){
		html=html+notifcardhtml(rows[i])
	}
	if(list){list.innerHTML=html}
	bindnotifbuttons()
}

function bindnotifbuttons(){
	let reads=document.querySelectorAll(".notifread")
	for(let i=0;i<reads.length;i=i+1){
		reads[i].onclick=function(){
			markread(this.dataset.id)
		}
	}
	let deletes=document.querySelectorAll(".notifdelete")
	for(let i=0;i<deletes.length;i=i+1){
		deletes[i].onclick=function(){
			deletenotif(this.dataset.id)
		}
	}
}

function rendernotifpagination(pagination){
	renderptpagination("notifpagination",pagination,function(pagevalue){
		notifpage=pagevalue
		loadnotifs()
	})
}

function loadnotifs(){
	let keywordinput=domgetid("notifkeyword")
	let keyword=keywordinput?keywordinput.value.trim():""
	let url=AJAXURL+"getnotificationlist?page="+notifpage+"&limit="+notiflimit
	if(keyword){
		url=url+"&keyword="+encodeURIComponent(keyword)
	}
	ajax("GET",url,function(event,data){
		if(data["success"]){
			rendernotifs(data["data"]["list"]||[])
			rendernotifpagination(data["data"]["pagination"]||{})
			if(typeof ptupdatenotifybadge=="function"){
				ptupdatenotifybadge()
			}
			return
		}
		if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
			pthandleauthfailure(data["data"],{"toasted": false})
			return
		}
		pttoast(pterror(data["data"]||nt("loadfail","載入失敗")),"error")
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		"loadingtarget": "#notiflist"
	})
}

function markread(id){
	ajax("PUT",AJAXURL+"readnotification/"+id,function(event,data){
		if(data["success"]){
			loadnotifs()
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function markallread(){
	ajax("PUT",AJAXURL+"readallnotification",function(event,data){
		if(data["success"]){
			loadnotifs()
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function deletenotif(id){
	ptconfirm(nt("deleteconfirm","確定要刪除這則通知嗎？"),function(okayed){
		if(!okayed){
			return
		}
		ajax("DELETE",AJAXURL+"deletenotification/"+id,function(event,data){
			if(data["success"]){
				loadnotifs()
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	})
}

applynotifstatic()
loadnotifs()

onclick("#refreshnotif",function(){
	notifpage=1
	loadnotifs()
})

onclick("#readallnotif",function(){
	markallread()
})

onclick("#searchnotif",function(){
	notifpage=1
	loadnotifs()
})

let notifkeywordinput=domgetid("notifkeyword")
if(notifkeywordinput){
	notifkeywordinput.onkeydown=function(event){
		if(event.key=="Enter"){
			notifpage=1
			loadnotifs()
		}
	}
}

let notiflimitselect=domgetid("notiflimitselect")
if(notiflimitselect){
	notiflimit=Number(notiflimitselect.value)||20
	notiflimitselect.onchange=function(){
		notiflimit=Number(notiflimitselect.value)||20
		notifpage=1
		loadnotifs()
	}
}
