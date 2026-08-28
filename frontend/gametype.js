if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let gametypelist=[]
let gametypecurrentid=""
let gametypekeyword=""

const GAMETYPEKINDLIST=[
	{ "key": "rule","zhtw": "規則","en": "Rule" },
	{ "key": "blind","zhtw": "盲注","en": "Blind" },
	{ "key": "ante","zhtw": "前注","en": "Ante" },
	{ "key": "deal","zhtw": "發牌","en": "Deal" },
	{ "key": "board","zhtw": "公共牌","en": "Board" },
	{ "key": "draw","zhtw": "換牌","en": "Draw" },
	{ "key": "discard","zhtw": "棄牌","en": "Discard" },
	{ "key": "bet","zhtw": "下注","en": "Betting" },
	{ "key": "showdown","zhtw": "攤牌","en": "Showdown" },
	{ "key": "win","zhtw": "勝負","en": "Winner" }
]

const GAMETYPETEXT={
	"zhtw": {
		"title": "遊戲類型設定",
		"desc": "管理場次可選的遊戲類型，並用流程節點描述發牌、下注、換牌、攤牌與底池判定方式。",
		"back": "回偏好設定",
		"newgame": "新增遊戲",
		"listtitle": "遊戲列表",
		"search": "搜尋名稱或代碼",
		"basic": "基本設定",
		"basicdesc": "代碼會用在手牌紀錄與場次類型，請保持短且不可重複。",
		"copyholdem": "複製德州流程",
		"save": "儲存",
		"delete": "刪除",
		"name": "名稱",
		"code": "代碼",
		"description": "描述",
		"enabled": "啟用，顯示在場次與手牌遊戲類型選單",
		"preview": "流程預覽",
		"previewdesc": "節點由左到右代表一手牌的主要流程。",
		"addstep": "新增步驟",
		"editor": "流程節點",
		"editordesc": "每個節點可設定類型、標題、張數、行動來源與結束條件。",
		"kind": "類型",
		"steptitle": "標題",
		"cardcount": "張數",
		"actionfrom": "行動來源",
		"condition": "結束條件",
		"detail": "說明",
		"moveup": "上移",
		"movedown": "下移",
		"remove": "刪除",
		"newname": "新遊戲",
		"newcode": "NEW",
		"required": "請填名稱與代碼",
		"saved": "遊戲類型已儲存",
		"deleted": "遊戲類型已刪除",
		"deleteconfirm": "確定刪除此遊戲類型?",
		"zzdelete": "ZZ 是必要的其他類型，不能刪除。",
		"zzlock": "ZZ 必須存在且保持啟用。",
		"nopermission": "只有超級管理者可以使用此頁。",
		"loadfail": "讀取遊戲類型失敗",
		"savefail": "儲存失敗",
		"empty": "沒有符合的遊戲類型"
	},
	"en": {
		"title": "Game Type Settings",
		"desc": "Manage selectable game types and describe each hand flow with deal, betting, draw, showdown, and pot-award nodes.",
		"back": "Back to Preferences",
		"newgame": "Add Game",
		"listtitle": "Game List",
		"search": "Search name or code",
		"basic": "Basic Settings",
		"basicdesc": "Codes are used by hand records and session game types. Keep them short and unique.",
		"copyholdem": "Copy Hold'em Flow",
		"save": "Save",
		"delete": "Delete",
		"name": "Name",
		"code": "Code",
		"description": "Description",
		"enabled": "Enabled, shown in session and hand game type menus",
		"preview": "Flow Preview",
		"previewdesc": "Nodes run left to right through one hand.",
		"addstep": "Add Step",
		"editor": "Flow Nodes",
		"editordesc": "Each node can define type, title, card count, action source, and ending condition.",
		"kind": "Type",
		"steptitle": "Title",
		"cardcount": "Cards",
		"actionfrom": "Action From",
		"condition": "End Condition",
		"detail": "Detail",
		"moveup": "Move Up",
		"movedown": "Move Down",
		"remove": "Delete",
		"newname": "New Game",
		"newcode": "NEW",
		"required": "Name and code are required",
		"saved": "Game type saved",
		"deleted": "Game type deleted",
		"deleteconfirm": "Delete this game type?",
		"zzdelete": "ZZ is the required Other type and cannot be deleted.",
		"zzlock": "ZZ must exist and stay enabled.",
		"nopermission": "Only super administrators can use this page.",
		"loadfail": "Failed to load game types",
		"savefail": "Save failed",
		"empty": "No matching game type"
	}
}

function gametypetext(key){
	if(GAMETYPETEXT[LANGUAGE]&&GAMETYPETEXT[LANGUAGE][key]){
		return GAMETYPETEXT[LANGUAGE][key]
	}
	return GAMETYPETEXT["zhtw"][key]||key
}

function gametypeescape(value){
	if(value==null||value==undefined){
		return ""
	}
	return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")
}

function gametypekindlabel(kind){
	for(let i=0;i<GAMETYPEKINDLIST.length;i=i+1){
		if(GAMETYPEKINDLIST[i]["key"]==kind){
			if(LANGUAGE=="en"){
				return GAMETYPEKINDLIST[i]["en"]
			}
			return GAMETYPEKINDLIST[i]["zhtw"]
		}
	}
	return kind||"rule"
}

function gametypekindoptions(current){
	let html=""
	for(let i=0;i<GAMETYPEKINDLIST.length;i=i+1){
		let item=GAMETYPEKINDLIST[i]
		let selected=""
		if(item["key"]==current){
			selected=" selected"
		}
		html=html+"<option value=\""+gametypeescape(item["key"])+"\""+selected+">"+gametypeescape(gametypekindlabel(item["key"]))+"</option>"
	}
	return html
}

function gametypeapi(method,path,body,callback){
	ajax(method,AJAXURL+path,function(event,data){
		callback(data)
	},body?JSON.stringify(body):null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function gametypetoast(text,typed){
	if(typed=="error"&&typeof pttoasterror=="function"){
		pttoasterror(text)
		return
	}
	if(typed!="error"&&typeof pttoastsuccess=="function"){
		pttoastsuccess(text)
		return
	}
	if(typeof pttoast=="function"){
		pttoast(text,typed||"success")
		return
	}
	alert(text)
}

function gametypecurrent(){
	for(let i=0;i<gametypelist.length;i=i+1){
		if(String(gametypelist[i]["id"])==String(gametypecurrentid)){
			return gametypelist[i]
		}
	}
	return null
}

function gametypenewflow(){
	return [
		{ "kind": "rule","title": gametypetext("newgame"),"detail": "請描述這個遊戲的基本規則。","cardcount": 0,"actionfrom": "","condition": "" },
		{ "kind": "win","title": "勝負判定","detail": "請描述底池如何判定與分配。","cardcount": 0,"actionfrom": "","condition": "" }
	]
}

function gametypeapplylanguage(){
	document.title=gametypetext("title")+" - PokerTrace"
	let map={
		"gametypetitle": "title",
		"gametypedesc": "desc",
		"backtoprofile": "back",
		"gametypelisttitle": "listtitle",
		"basicsettingtitle": "basic",
		"basicsettingdesc": "basicdesc",
		"flowpreviewtitle": "preview",
		"flowpreviewdesc": "previewdesc",
		"floweditortitle": "editor",
		"floweditordesc": "editordesc",
		"namelabel": "name",
		"codelabel": "code",
		"descriptionlabel": "description",
		"enabledlabel": "enabled"
	}
	for(let id in map){
		let element=domgetid(id)
		if(element){
			element.textContent=gametypetext(map[id])
		}
	}
	value("#newgametypebutton",gametypetext("newgame"))
	value("#duplicateflowbutton",gametypetext("copyholdem"))
	value("#savegametypebutton",gametypetext("save"))
	value("#deletegametypebutton",gametypetext("delete"))
	value("#addstepbutton",gametypetext("addstep"))
	let search=domgetid("gametypesearch")
	if(search){
		search.placeholder=gametypetext("search")
	}
}

function gametypeload(){
	gametypeapi("GET","getgametypesettinglist",null,function(data){
		if(!data["success"]){
			if(data["data"]=="ERROR_no_permission"){
				gametypetoast(gametypetext("nopermission"),"error")
				href("profile.html")
				return
			}
			gametypetoast(gametypetext("loadfail"),"error")
			return
		}
		gametypelist=data["data"]||[]
		if(gametypelist.length>0){
			gametypecurrentid=gametypelist[0]["id"]
		}
		gametyperender()
	})
}

function gametyperender(){
	gametyperenderlist()
	gametyperenderform()
}

function gametyperenderlist(){
	let target=domgetid("gametypelist")
	let count=domgetid("gametypecount")
	if(!target){
		return
	}
	let keyword=gametypekeyword.toLowerCase()
	let html=""
	let shown=0
	for(let i=0;i<gametypelist.length;i=i+1){
		let row=gametypelist[i]
		let hay=(String(row["name"]||"")+" "+String(row["code"]||"")+" "+String(row["description"]||"")).toLowerCase()
		if(keyword==""||hay.indexOf(keyword)>=0){
			shown=shown+1
			let activeclass="border-zinc-800 bg-zinc-950/80 hover:border-emerald-500"
			if(String(row["id"])==String(gametypecurrentid)){
				activeclass="border-emerald-500 bg-emerald-500/10"
			}
			let stateclass="bg-zinc-800 text-zinc-300"
			let statetext="OFF"
			if(row["enabled"]!=false){
				stateclass="bg-emerald-500/15 text-emerald-300"
				statetext="ON"
			}
			html=html+
				"<button type=\"button\" class=\"gametypeitem w-full rounded-2xl border p-4 text-left transition "+activeclass+"\" data-id=\""+gametypeescape(row["id"])+"\">"+
					"<div class=\"flex items-center justify-between gap-3\">"+
						"<div class=\"min-w-0\">"+
							"<div class=\"truncate text-sm font-extrabold text-white\">"+gametypeescape(row["name"]||"-")+"</div>"+
							"<div class=\"mt-1 font-mono text-xs font-bold text-zinc-400\">"+gametypeescape(row["code"]||"-")+"</div>"+
						"</div>"+
						"<div class=\"rounded-full px-2 py-1 text-[11px] font-extrabold "+stateclass+"\">"+statetext+"</div>"+
					"</div>"+
				"</button>"
		}
	}
	if(shown<1){
		html="<div class=\"rounded-2xl border border-dashed border-zinc-800 p-5 text-center text-sm text-zinc-500\">"+gametypetext("empty")+"</div>"
	}
	target.innerHTML=html
	if(count){
		count.textContent=shown
	}
}

function gametyperenderform(){
	let row=gametypecurrent()
	if(!row){
		return
	}
	value("#gametypename",row["name"]||"")
	value("#gametypecode",row["code"]||"")
	value("#gametypedescription",row["description"]||"")
	let enabled=domgetid("gametypeenabled")
	if(enabled){
		enabled.checked=row["enabled"]!=false
		enabled.disabled=row["code"]=="ZZ"
	}
	let deletebutton=domgetid("deletegametypebutton")
	if(deletebutton){
		deletebutton.disabled=row["code"]=="ZZ"
		if(row["code"]=="ZZ"){
			deletebutton.classList.add("opacity-40")
		}else{
			deletebutton.classList.remove("opacity-40")
		}
	}
	gametyperenderpreview(row)
	gametyperendereditor(row)
}

function gametyperenderpreview(row){
	let target=domgetid("flowpreview")
	if(!target){
		return
	}
	let flow=row["flow"]||[]
	let html=""
	for(let i=0;i<flow.length;i=i+1){
		let item=flow[i]
		if(i>0){
			html=html+"<div class=\"flex items-center text-2xl font-black text-zinc-600\">&gt;</div>"
		}
		html=html+
			"<div class=\"w-48 rounded-2xl bg-zinc-950 p-4\">"+
				"<div class=\"mb-2 inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-extrabold text-emerald-300\">"+gametypeescape(gametypekindlabel(item["kind"]))+"</div>"+
				"<div class=\"text-sm font-extrabold text-white\">"+gametypeescape(item["title"]||"-")+"</div>"+
				"<div class=\"mt-2 line-clamp-3 text-xs leading-5 text-zinc-400\">"+gametypeescape(item["detail"]||"")+"</div>"+
			"</div>"
	}
	target.innerHTML=html
}

function gametyperendereditor(row){
	let target=domgetid("floweditor")
	if(!target){
		return
	}
	let flow=row["flow"]||[]
	let html=""
	for(let i=0;i<flow.length;i=i+1){
		let item=flow[i]
		html=html+
			"<div class=\"flowstep rounded-2xl bg-zinc-950/80 p-4\" data-index=\""+i+"\">"+
				"<div class=\"mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between\">"+
					"<div class=\"flex items-center gap-3\">"+
						"<div class=\"flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-extrabold text-emerald-300\">"+(i+1)+"</div>"+
						"<div class=\"text-sm font-extrabold text-white\">"+gametypeescape(item["title"]||gametypetext("addstep"))+"</div>"+
					"</div>"+
					"<div class=\"flex flex-wrap gap-2\">"+
						"<input type=\"button\" class=\"flowup min-h-10 rounded-xl bg-zinc-800 px-3 text-xs font-bold text-zinc-200 transition hover:bg-zinc-700\" data-index=\""+i+"\" value=\""+gametypeescape(gametypetext("moveup"))+"\">"+
						"<input type=\"button\" class=\"flowdown min-h-10 rounded-xl bg-zinc-800 px-3 text-xs font-bold text-zinc-200 transition hover:bg-zinc-700\" data-index=\""+i+"\" value=\""+gametypeescape(gametypetext("movedown"))+"\">"+
						"<input type=\"button\" class=\"flowdelete min-h-10 rounded-xl border border-red-500/40 bg-red-500/10 px-3 text-xs font-bold text-red-300 transition hover:bg-red-500/20\" data-index=\""+i+"\" value=\""+gametypeescape(gametypetext("remove"))+"\">"+
					"</div>"+
				"</div>"+
				"<div class=\"grid grid-cols-1 gap-3 md:grid-cols-4\">"+
					"<label class=\"block\"><span class=\"mb-1 block text-xs font-bold text-zinc-400\">"+gametypeescape(gametypetext("kind"))+"</span><select class=\"flowfield min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white\" data-field=\"kind\" data-index=\""+i+"\">"+gametypekindoptions(item["kind"])+"</select></label>"+
					"<label class=\"block md:col-span-2\"><span class=\"mb-1 block text-xs font-bold text-zinc-400\">"+gametypeescape(gametypetext("steptitle"))+"</span><input type=\"text\" class=\"flowfield min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white\" data-field=\"title\" data-index=\""+i+"\" value=\""+gametypeescape(item["title"]||"")+"\"></label>"+
					"<label class=\"block\"><span class=\"mb-1 block text-xs font-bold text-zinc-400\">"+gametypeescape(gametypetext("cardcount"))+"</span><input type=\"number\" class=\"flowfield min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white\" data-field=\"cardcount\" data-index=\""+i+"\" min=\"0\" inputmode=\"numeric\" value=\""+gametypeescape(item["cardcount"]||0)+"\"></label>"+
					"<label class=\"block md:col-span-2\"><span class=\"mb-1 block text-xs font-bold text-zinc-400\">"+gametypeescape(gametypetext("actionfrom"))+"</span><input type=\"text\" class=\"flowfield min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white\" data-field=\"actionfrom\" data-index=\""+i+"\" value=\""+gametypeescape(item["actionfrom"]||"")+"\"></label>"+
					"<label class=\"block md:col-span-2\"><span class=\"mb-1 block text-xs font-bold text-zinc-400\">"+gametypeescape(gametypetext("condition"))+"</span><input type=\"text\" class=\"flowfield min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white\" data-field=\"condition\" data-index=\""+i+"\" value=\""+gametypeescape(item["condition"]||"")+"\"></label>"+
					"<label class=\"block md:col-span-4\"><span class=\"mb-1 block text-xs font-bold text-zinc-400\">"+gametypeescape(gametypetext("detail"))+"</span><textarea class=\"flowfield min-h-20 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm leading-6 text-white\" data-field=\"detail\" data-index=\""+i+"\">"+gametypeescape(item["detail"]||"")+"</textarea></label>"+
				"</div>"+
			"</div>"
	}
	target.innerHTML=html
}

function gametypeupdatefromform(){
	let row=gametypecurrent()
	if(row){
		row["name"]=getvalue("gametypename")
		row["code"]=getvalue("gametypecode").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,20)
		row["description"]=getvalue("gametypedescription")
		let enabled=domgetid("gametypeenabled")
		if(enabled){
			row["enabled"]=enabled.checked
		}
		if(row["code"]=="ZZ"){
			row["enabled"]=true
		}
	}
}

function gametypefieldchange(element){
	let row=gametypecurrent()
	if(row){
		let index=Number(element.getAttribute("data-index")||0)
		let field=element.getAttribute("data-field")||""
		if(row["flow"]&&row["flow"][index]){
			if(field=="cardcount"){
				row["flow"][index][field]=Number(element.value||0)
			}else{
				row["flow"][index][field]=element.value
			}
			gametyperenderpreview(row)
		}
	}
}

function gametypeaddstep(){
	let row=gametypecurrent()
	if(row){
		if(!row["flow"]){
			row["flow"]=[]
		}
		row["flow"].push({ "kind": "rule","title": gametypetext("addstep"),"detail": "","cardcount": 0,"actionfrom": "","condition": "" })
		gametyperenderform()
	}
}

function gametypemovestep(index,delta){
	let row=gametypecurrent()
	if(row&&row["flow"]){
		let to=index+delta
		if(0<=to&&to<row["flow"].length){
			let item=row["flow"][index]
			row["flow"][index]=row["flow"][to]
			row["flow"][to]=item
			gametyperenderform()
		}
	}
}

function gametypedeletestep(index){
	let row=gametypecurrent()
	if(row&&row["flow"]&&row["flow"].length>1){
		row["flow"].splice(index,1)
		gametyperenderform()
	}
}

function gametypenew(){
	let newid="new"+Date.now()
	let row={
		"id": newid,
		"name": gametypetext("newname"),
		"code": gametypetext("newcode"),
		"description": "",
		"enabled": true,
		"flow": gametypenewflow(),
		"newed": true
	}
	gametypelist.unshift(row)
	gametypecurrentid=newid
	gametyperender()
}

function gametypecopyholdem(){
	let row=gametypecurrent()
	if(row){
		for(let i=0;i<gametypelist.length;i=i+1){
			if(gametypelist[i]["code"]=="HE"){
				row["flow"]=JSON.parse(JSON.stringify(gametypelist[i]["flow"]||[]))
			}
		}
		gametyperenderform()
	}
}

function gametypesave(){
	let row=gametypecurrent()
	if(row){
		gametypeupdatefromform()
		if(!row["name"]||!row["code"]){
			gametypetoast(gametypetext("required"),"error")
			return
		}
		let body={
			"name": row["name"],
			"code": row["code"],
			"description": row["description"],
			"enabled": row["enabled"],
			"flow": row["flow"]||[]
		}
		if(!row["newed"]){
			body["id"]=row["id"]
		}
		gametypeapi("POST","savegametypesetting",body,function(data){
			if(data["success"]){
				gametypetoast(gametypetext("saved"),"success")
				gametypeload()
			}else{
				gametypetoast(gametypetext("savefail"),"error")
			}
		})
	}
}

function gametypedelete(){
	let row=gametypecurrent()
	if(row){
		if(row["code"]=="ZZ"){
			gametypetoast(gametypetext("zzdelete"),"error")
			return
		}
		if(row["newed"]){
			gametypelist.splice(gametypelist.indexOf(row),1)
			if(gametypelist.length>0){
				gametypecurrentid=gametypelist[0]["id"]
			}
			gametyperender()
			return
		}
		if(confirm(gametypetext("deleteconfirm"))){
			gametypeapi("POST","deletegametypesetting/"+encodeURIComponent(row["id"]),{},function(data){
				if(data["success"]){
					gametypetoast(gametypetext("deleted"),"success")
					gametypeload()
				}else{
					gametypetoast(gametypetext("savefail"),"error")
				}
			})
		}
	}
}

function gametypebind(){
	oninput("#gametypesearch",function(){
		gametypekeyword=getvalue("gametypesearch")
		gametyperenderlist()
	})
	oninput("#gametypecode",function(element){
		element.value=element.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,20)
		gametypeupdatefromform()
		gametyperenderlist()
	})
	oninput("#gametypename",function(){
		gametypeupdatefromform()
		gametyperenderlist()
	})
	oninput("#gametypedescription",function(){
		gametypeupdatefromform()
	})
	onchange("#gametypeenabled",function(){
		gametypeupdatefromform()
	})
	onclick("#newgametypebutton",function(){
		gametypenew()
	})
	onclick("#addstepbutton",function(){
		gametypeaddstep()
	})
	onclick("#duplicateflowbutton",function(){
		gametypecopyholdem()
	})
	onclick("#savegametypebutton",function(){
		gametypesave()
	})
	onclick("#deletegametypebutton",function(){
		gametypedelete()
	})
	document.addEventListener("click",function(event){
		let target=event.target
		let item=target.closest(".gametypeitem")
		if(item){
			gametypecurrentid=item.getAttribute("data-id")
			gametyperender()
		}
		if(target.classList.contains("flowup")){
			gametypemovestep(Number(target.getAttribute("data-index")||0),-1)
		}
		if(target.classList.contains("flowdown")){
			gametypemovestep(Number(target.getAttribute("data-index")||0),1)
		}
		if(target.classList.contains("flowdelete")){
			gametypedeletestep(Number(target.getAttribute("data-index")||0))
		}
	})
	document.addEventListener("input",function(event){
		let target=event.target
		if(target.classList.contains("flowfield")){
			gametypefieldchange(target)
		}
	})
	document.addEventListener("change",function(event){
		let target=event.target
		if(target.classList.contains("flowfield")){
			gametypefieldchange(target)
		}
	})
}

gametypeapplylanguage()
gametypebind()
gametypeload()
