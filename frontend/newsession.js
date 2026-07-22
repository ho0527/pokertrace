if(!weblsget(WEBLSNAME+"signin")){
	if(window.ptrememberreturnpage){
		ptrememberreturnpage()
	}
	href("signin.html")
}

let leaveguard=bindleaveguard()

let flowstate={
	"mode": "",
	"step": 1,
	"maxstep": 1,
	"loadingclubed": false,
	"loadingtypeed": false,
	"temploaded": false
}

function field(id){
	return domgetid(id)
}

function textvalue(id){
	let element=field(id)
	if(!element){
		return ""
	}
	return element.value||""
}

function numbervalue(id){
	let raw=textvalue(id)
	let value=0
	if(raw==""||raw==null){
		return 0
	}
	value=Number(raw)
	if(Number.isNaN(value)){
		return 0
	}
	return value
}

function checkboxvalue(id){
	let element=field(id)
	if(!element){
		return false
	}
	return element.checked==true
}

function setfieldvalue(id,value){
	let element=field(id)
	if(!element){
		return
	}
	if(element.type=="checkbox"){
		element.checked=value==true
		return
	}
	if(value==undefined||value==null){
		element.value=""
		return
	}
	element.value=value
}

function clearerror(){
	innertext("#error","",false)
}

function clearfielderror(id){
	if(field(id)){
		ptsetfieldmessage(field(id),"")
	}
}

function showformerror(message,focusid){
	innertext("#error",message,false)
	pttoasterror(message)
	if(focusid&&field(focusid)){
		ptsetfieldmessage(field(focusid),message)
	}
	if(field("submit")){
		ptsetsubmitstate(field("submit"),false)
	}
	if(field("nextbtn")){
		field("nextbtn").disabled=false
	}
	if(focusid&&field(focusid)){
		field(focusid).focus()
	}
}

function getmodetext(mode){
	if(mode=="hosted"){
		return "主辦牌局"
	}
	if(mode=="personal"){
		return "個人成績補登"
	}
	return "尚未選擇"
}

function setmodecardstate(element,activeed){
	let badge=element.querySelector("span")
	element.className="rounded-[24px] border p-6 text-left transition duration-150"
	if(activeed){
		element.classList.add("border-emerald-400","bg-gradient-to-b","from-emerald-950/60","to-zinc-900","shadow-[0_0_0_1px_rgba(52,211,153,0.3)]")
	}else{
		element.classList.add("border-zinc-700","bg-gradient-to-b","from-zinc-900","to-zinc-800","hover:-translate-y-0.5","hover:border-zinc-500")
	}
	if(badge){
		if(activeed){
			badge.className="mb-4 inline-flex rounded-full border border-emerald-300/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200"
		}else{
			badge.className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300"
		}
	}
}

function setstepitemstate(element,step){
	let bubble=element.querySelector("span")
	let label=element.querySelectorAll("span")[1]
	let activeed=step==flowstate["step"]
	let doneed=step<flowstate["step"]
	let disableded=flowstate["mode"]==""

	element.disabled=disableded
	element.className="flex min-h-[84px] items-center gap-3 rounded-[20px] border px-5 py-4 text-left transition"
	if(activeed){
		element.classList.add("border-emerald-400","bg-emerald-950/30")
	}else{
		element.classList.add("border-zinc-800","bg-zinc-950")
	}
	if(disableded){
		element.classList.add("opacity-55","cursor-not-allowed")
	}else{
		element.classList.add("cursor-pointer")
	}
	if(doneed&&!activeed){
		element.classList.add("border-zinc-600")
	}
	if(bubble){
		bubble.className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border text-sm font-extrabold"
		if(activeed){
			bubble.classList.add("border-emerald-400","bg-emerald-700","text-white")
		}else{
			bubble.classList.add("border-zinc-700","bg-zinc-950","text-zinc-300")
		}
	}
	if(label){
		label.className="text-sm font-bold"
		if(activeed){
			label.classList.add("text-white")
		}else{
			label.classList.add("text-zinc-300")
		}
	}
}

function renderactionhint(){
	let hint="選完模式後，從基本資料開始往下填。"
	if(flowstate["mode"]){
		if(flowstate["step"]==1){
			hint="先確認這場的基本資料與時間。"
		}
		if(flowstate["step"]==2){
			if(flowstate["mode"]=="hosted"){
				hint="先決定再購、再入與報名規則。"
			}else{
				hint="先標記你這次是否再入場，以及是否進 ITM / Final Table。"
			}
		}
		if(flowstate["step"]==3){
			if(flowstate["mode"]=="hosted"){
				hint="把費用與計分牌補齊，並確認下方進階設定與備註，即可建立場次。"
			}else{
				hint="把你的實際支出與結果補齊，並確認進階設定，之後統計會更準。"
			}
		}
	}
	field("actionhint").textContent=hint
}

function rendermodeblocks(){
	let blocks=document.querySelectorAll("[data-mode-panel]")
	let cards=document.querySelectorAll("[data-mode-card]")
	let linked=checkboxvalue("linkuser")
	let i=0
	let blockmode=""

	for(i=0;i<blocks.length;i=i+1){
		blockmode=blocks[i].getAttribute("data-mode-panel")
		blocks[i].classList.toggle("hidden",blockmode!=flowstate["mode"])
	}
	for(i=0;i<cards.length;i=i+1){
		setmodecardstate(cards[i],cards[i].getAttribute("data-mode-card")==flowstate["mode"])
	}

	if(field("openregistration")){
		field("openregistration").disabled=!linked
		if(!linked){
			field("openregistration").checked=false
		}
	}
	if(field("private")){
		field("private").disabled=!linked
		if(!linked){
			field("private").checked=false
		}
	}
}

function renderlayout(){
	let chooser=field("modechooser")
	let intro=field("modechooserintro")
	let cards=field("modecards")
	let workspace=field("formworkspace")
	let current=field("currentmodevalue")
	let activeed=flowstate["mode"]!=""

	workspace.classList.toggle("hidden",!activeed)
	if(activeed){
		chooser.classList.add("opacity-60","py-3")
		intro.classList.add("mb-0")
		chooser.classList.add("hidden")
	}else{
		chooser.classList.remove("opacity-60","py-3")
		intro.classList.remove("mb-0")
		chooser.classList.remove("hidden")
	}
	current.textContent=getmodetext(flowstate["mode"])
}

function renderstepnav(){
	let items=document.querySelectorAll("[data-step-item]")
	let i=0
	let step=0
	for(i=0;i<items.length;i=i+1){
		step=Number(items[i].getAttribute("data-step-item"))
		// 進階已併入第3步, 第4個導覽項不再顯示
		if(step>3){
			items[i].classList.add("hidden")
			continue
		}
		setstepitemstate(items[i],step)
	}
}

// 只在有設定次數時才顯示對應的 Rebuy/Reentry/Addon 費用設定區, 讓費用步驟更精簡
function updatefeeblocks(){
	let map=[["rebuybuyin","rebuycount"],["reentrybuyin","reentrycount"],["addonbuyin","addoncount"]]
	for(let i=0;i<map.length;i=i+1){
		let input=field(map[i][0])
		if(!input){
			continue
		}
		let block=input.closest(".mt-4")
		if(block){
			block.classList.toggle("hidden",numbervalue(map[i][1])<=0)
		}
	}
}

// 把核心「買入 / 起始計分牌」那組升級成醒目卡片, 並移到費用區最上方(一次性)
function setupcorebox(){
	let chipfield=field("chip")
	if(!chipfield){
		return
	}
	let core=chipfield.closest(".grid")
	if(!core||core.dataset.coreboxed=="1"){
		return
	}
	core.dataset.coreboxed="1"
	core.classList.add("rounded-[22px]","border","border-emerald-500/40","bg-emerald-500/5","p-5")
	let expl=core.previousElementSibling
	if(expl&&core.parentElement){
		core.parentElement.insertBefore(core,expl)
	}
}

function renderpanels(){
	let panels=document.querySelectorAll("[data-step-panel]")
	let i=0
	let step=0

	for(i=0;i<panels.length;i=i+1){
		step=Number(panels[i].getAttribute("data-step-panel"))
		// 進階(第4面板)併入費用步驟(第3步)一起顯示, 讓流程從 4 步簡化為 3 步
		let logicalstep=(step==4)?3:step
		panels[i].classList.toggle("hidden",logicalstep!=flowstate["step"])
	}
	updatefeeblocks()

	field("previousbtn").disabled=flowstate["step"]<=1
	if(flowstate["step"]>=3){
		field("nextbtn").classList.add("hidden")
		field("submit").classList.remove("hidden")
		field("submit").classList.add("inline-flex")
	}else{
		field("nextbtn").classList.remove("hidden")
		field("submit").classList.add("hidden")
		field("submit").classList.remove("inline-flex")
	}

	renderstepnav()
	renderactionhint()
}

function setmode(mode,confirmed){
	let targetmode=mode||""
	let shouldconfirm=false
	if(flowstate["mode"]==targetmode){
		return
	}
	if(flowstate["mode"]&&targetmode&&targetmode!=flowstate["mode"]){
		if(numbervalue("rebuycount")>0||numbervalue("reentrycount")>0||numbervalue("addoncount")>0||numbervalue("personalreentrycount")>0||numbervalue("winprice")>0||textvalue("description").trim()){
			shouldconfirm=true
		}
	}
	if(shouldconfirm&&confirmed!=true){
		ptconfirm("切換模式後會保留共用欄位，但你應重新確認後續規則與費用設定。要切換嗎？",function(ok){
			if(ok){
				setmode(targetmode,true)
			}
		})
		return
	}
	flowstate["mode"]=targetmode
	field("mode").value=targetmode
	if(targetmode==""){
		flowstate["step"]=1
		flowstate["maxstep"]=1
	}
	rendermodeblocks()
	renderlayout()
	renderpanels()
	savetempdata()
}

function gotoStep(step){
	let target=Number(step)
	let checkstep=0
	if(flowstate["mode"]==""){
		showformerror("請先選擇主辦牌局或個人成績補登","modehosted")
		return
	}
	if(target<1||target>3){
		return
	}
	if(target>flowstate["step"]){
		for(checkstep=1;checkstep<target;checkstep=checkstep+1){
			if(!validatestep(checkstep)){
				flowstate["step"]=checkstep
				if(flowstate["step"]>flowstate["maxstep"]){
					flowstate["maxstep"]=flowstate["step"]
				}
				renderpanels()
				return
			}
		}
	}
	flowstate["step"]=target
	if(flowstate["step"]>flowstate["maxstep"]){
		flowstate["maxstep"]=flowstate["step"]
	}
	clearerror()
	renderpanels()
	savetempdata()
}

function nextstep(){
	if(flowstate["step"]<3){
		gotoStep(flowstate["step"]+1)
	}
}

function previousstep(){
	if(flowstate["step"]<=1){
		return
	}
	flowstate["step"]=flowstate["step"]-1
	clearerror()
	renderpanels()
	savetempdata()
}

function composeisotime(datevalue,timevalue){
	return datevalue+" "+timevalue+"+00:00"
}

function datetimems(datevalue,timevalue){
	let raw=datevalue+"T"+timevalue
	let time=Date.parse(raw)
	if(Number.isNaN(time)){
		return 0
	}
	return time
}

function validatenonnegative(id,label){
	if(numbervalue(id)<0){
		if(field(id)){
			ptsetfieldmessage(field(id),label+"不得為負數")
		}
		showformerror(label+"不得為負數",id)
		return false
	}
	clearfielderror(id)
	return true
}

function instantnumberlabel(id){
	let map={
		"buyin": "買入費",
		"buyinfee": "買入服務費",
		"chip": "起始計分牌",
		"rebuycount": "Rebuy 次數",
		"rebuybuyin": "Rebuy 費用",
		"rebuyfee": "Rebuy 服務費",
		"rebuychip": "Rebuy 計分牌",
		"reentrycount": "Reentry 次數",
		"reentrybuyin": "Reentry 費用",
		"reentryfee": "Reentry 服務費",
		"reentrychip": "Reentry 計分牌",
		"addoncount": "Addon 次數",
		"addonbuyin": "Addon 費用",
		"addonfee": "Addon 服務費",
		"addonchip": "Addon 計分牌",
		"guaranteedprize": "保底獎金",
		"personalbuyin": "買入費",
		"personalbuyinfee": "買入服務費",
		"personalreentrycount": "個人再入次數",
		"personalreentrybuyin": "再入費",
		"personalreentryfee": "再入服務費",
		"winprice": "獎金金額",
		"totalbuyin": "總買入",
		"place": "名次"
	}
	return map[id]||"欄位"
}

let step1requiredids=[
	"name",
	"clubid",
	"date",
	"starttime",
	"endtime"
]

function markfieldinvalid(id,invalid){
	let element=field(id)
	if(!element){
		return
	}
	if(invalid){
		element.classList.add("border-red-500")
		return
	}
	element.classList.remove("border-red-500")
}

function validatenewsessioninstant(id){
	if(!field(id)){
		return true
	}
	if(step1requiredids.indexOf(id)>=0){
		let filled=textvalue(id).trim()!=""
		markfieldinvalid(id,!filled)
		return filled
	}
	return validatenonnegative(id,instantnumberlabel(id))
}

function validatestep(step){
	let hostedids=[]
	let personalids=[]
	let i=0

	clearerror()
	if(flowstate["mode"]==""){
		showformerror("請先選擇主辦牌局或個人成績補登","modehosted")
		return false
	}
	if(step==1){
		if(!textvalue("name").trim()){
			showformerror("請填寫場次名稱","name")
			return false
		}
		if(!textvalue("clubid")){
			showformerror("請選擇地點","clubid")
			return false
		}
		if(!textvalue("date")){
			showformerror("請選擇開始日期","date")
			return false
		}
		if(!textvalue("starttime")){
			showformerror("請選擇開始時間","starttime")
			return false
		}
		if(!textvalue("endtime")){
			showformerror("請選擇結束時間","endtime")
			return false
		}
		if(datetimems(textvalue("date"),textvalue("endtime"))<=datetimems(textvalue("date"),textvalue("starttime"))){
			showformerror("結束時間必須晚於開始時間","endtime")
			return false
		}
		return true
	}
	if(step==2){
		if(flowstate["mode"]=="hosted"){
			if(!validatenonnegative("rebuycount","Rebuy 次數")){
				return false
			}
			if(!validatenonnegative("reentrycount","Reentry 次數")){
				return false
			}
			if(!validatenonnegative("addoncount","Addon 次數")){
				return false
			}
		}else{
			if(!validatenonnegative("personalreentrycount","個人再入次數")){
				return false
			}
		}
		return true
	}
	if(step==3){
		if(flowstate["mode"]=="hosted"){
			hostedids=[
				["buyin","買入費"],
				["buyinfee","買入服務費"],
				["chip","起始計分牌"],
				["rebuybuyin","Rebuy 費用"],
				["rebuyfee","Rebuy 服務費"],
				["rebuychip","Rebuy 計分牌"],
				["reentrybuyin","Reentry 費用"],
				["reentryfee","Reentry 服務費"],
				["reentrychip","Reentry 計分牌"],
				["addonbuyin","Addon 費用"],
				["addonfee","Addon 服務費"],
				["addonchip","Addon 計分牌"],
				["guaranteedprize","保底獎金"]
			]
			for(i=0;i<hostedids.length;i=i+1){
				if(!validatenonnegative(hostedids[i][0],hostedids[i][1])){
					return false
				}
			}
			if(numbervalue("rebuycount")>0&&numbervalue("rebuybuyin")<=0){
				showformerror("已設定 Rebuy 次數，請補齊 Rebuy 費用","rebuybuyin")
				return false
			}
			if(numbervalue("reentrycount")>0&&numbervalue("reentrybuyin")<=0){
				showformerror("已設定 Reentry 次數，請補齊 Reentry 費用","reentrybuyin")
				return false
			}
			if(numbervalue("reentrycount")>0&&numbervalue("reentrychip")<=0){
				showformerror("已設定 Reentry 次數，請補齊 Reentry 計分牌","reentrychip")
				return false
			}
			if(numbervalue("addoncount")>0&&numbervalue("addonbuyin")<=0){
				showformerror("已設定 Addon 次數，請補齊 Addon 費用","addonbuyin")
				return false
			}
			if(numbervalue("addoncount")>0&&numbervalue("addonchip")<=0){
				showformerror("已設定 Addon 次數，請補齊 Addon 計分牌","addonchip")
				return false
			}
		}else{
			personalids=[
				["personalbuyin","買入費"],
				["personalbuyinfee","買入服務費"],
				["personalreentrybuyin","再入費"],
				["personalreentryfee","再入服務費"],
				["winprice","獎金金額"],
				["totalbuyin","總買入"],
				["place","名次"]
			]
			for(i=0;i<personalids.length;i=i+1){
				if(!validatenonnegative(personalids[i][0],personalids[i][1])){
					return false
				}
			}
			if(numbervalue("personalreentrycount")>0&&numbervalue("personalreentrybuyin")<=0){
				showformerror("已設定個人再入次數，請補齊再入費","personalreentrybuyin")
				return false
			}
		}
		return true
	}
	return true
}

function validateallsteps(){
	let step=1
	for(step=1;step<=3;step=step+1){
		if(!validatestep(step)){
			flowstate["step"]=step
			if(flowstate["step"]>flowstate["maxstep"]){
				flowstate["maxstep"]=flowstate["step"]
			}
			renderpanels()
			return false
		}
	}
	return true
}

function getformdata(){
	return {
		"mode": flowstate["mode"],
		"step": flowstate["step"],
		"maxstep": flowstate["maxstep"],
		"name": textvalue("name"),
		"gameeventtype": textvalue("gameeventtype"),
		"clubid": textvalue("clubid"),
		"date": textvalue("date"),
		"starttime": textvalue("starttime"),
		"endtime": textvalue("endtime"),
		"rebuycount": numbervalue("rebuycount"),
		"reentrycount": numbervalue("reentrycount"),
		"addoncount": numbervalue("addoncount"),
		"linkuser": checkboxvalue("linkuser"),
		"openregistration": checkboxvalue("openregistration"),
		"private": checkboxvalue("private"),
		"personalreentrycount": numbervalue("personalreentrycount"),
		"inmoney": checkboxvalue("inmoney"),
		"inft": checkboxvalue("inft"),
		"buyin": numbervalue("buyin"),
		"buyinfee": numbervalue("buyinfee"),
		"chip": numbervalue("chip"),
		"rebuybuyin": numbervalue("rebuybuyin"),
		"rebuyfee": numbervalue("rebuyfee"),
		"rebuychip": numbervalue("rebuychip"),
		"reentrybuyin": numbervalue("reentrybuyin"),
		"reentryfee": numbervalue("reentryfee"),
		"reentrychip": numbervalue("reentrychip"),
		"addonbuyin": numbervalue("addonbuyin"),
		"addonfee": numbervalue("addonfee"),
		"addonchip": numbervalue("addonchip"),
		"guaranteedprize": numbervalue("guaranteedprize"),
		"personalbuyin": numbervalue("personalbuyin"),
		"personalbuyinfee": numbervalue("personalbuyinfee"),
		"personalreentrybuyin": numbervalue("personalreentrybuyin"),
		"personalreentryfee": numbervalue("personalreentryfee"),
		"winprice": numbervalue("winprice"),
		"totalbuyin": numbervalue("totalbuyin"),
		"place": numbervalue("place"),
		"winthing": textvalue("winthing"),
		"gametypeid": textvalue("gametype"),
		"limittypeid": textvalue("limittype"),
		"stacktypeid": textvalue("stacktype"),
		"eventtypeid": textvalue("eventtype"),
		"description": textvalue("description")
	}
}

function savetempdata(){
	weblsset(WEBLSNAME+"sessiontemp",str(getformdata()))
}

function restoretmpvalue(data,key,id){
	if(data[key]==undefined){
		return
	}
	setfieldvalue(id,data[key])
}

function loadtempdata(){
	let raw=weblsget(WEBLSNAME+"sessiontemp")
	let data=null
	let mode=""
	if(flowstate["temploaded"]==true){
		return
	}
	if(!flowstate["loadingclubed"]||!flowstate["loadingtypeed"]){
		return
	}
	if(!raw){
		flowstate["temploaded"]=true
		return
	}
	data=json(raw)
	if(!data){
		flowstate["temploaded"]=true
		return
	}
	mode=data["mode"]||""
	if(!mode){
		if(data["owned"]==true){
			mode="hosted"
		}else if(data["owned"]==false){
			mode="personal"
		}
	}
	restoretmpvalue(data,"gameeventtype","gameeventtype")
	restoretmpvalue(data,"name","name")
	restoretmpvalue(data,"clubid","clubid")
	restoretmpvalue(data,"date","date")
	restoretmpvalue(data,"starttime","starttime")
	restoretmpvalue(data,"endtime","endtime")
	restoretmpvalue(data,"rebuycount","rebuycount")
	restoretmpvalue(data,"reentrycount","reentrycount")
	restoretmpvalue(data,"addoncount","addoncount")
	restoretmpvalue(data,"linkuser","linkuser")
	restoretmpvalue(data,"openregistration","openregistration")
	restoretmpvalue(data,"private","private")
	restoretmpvalue(data,"personalreentrycount","personalreentrycount")
	if(data["personalreentrycount"]==undefined&&data["owned"]==false){
		restoretmpvalue(data,"reentrycount","personalreentrycount")
	}
	restoretmpvalue(data,"inmoney","inmoney")
	restoretmpvalue(data,"inft","inft")
	restoretmpvalue(data,"buyin","buyin")
	restoretmpvalue(data,"buyinfee","buyinfee")
	restoretmpvalue(data,"chip","chip")
	restoretmpvalue(data,"rebuybuyin","rebuybuyin")
	restoretmpvalue(data,"rebuyfee","rebuyfee")
	restoretmpvalue(data,"rebuychip","rebuychip")
	restoretmpvalue(data,"reentrybuyin","reentrybuyin")
	restoretmpvalue(data,"reentryfee","reentryfee")
	restoretmpvalue(data,"reentrychip","reentrychip")
	restoretmpvalue(data,"addonbuyin","addonbuyin")
	restoretmpvalue(data,"addonfee","addonfee")
	restoretmpvalue(data,"addonchip","addonchip")
	restoretmpvalue(data,"guaranteedprize","guaranteedprize")
	restoretmpvalue(data,"personalbuyin","personalbuyin")
	if(data["personalbuyin"]==undefined&&data["owned"]==false){
		restoretmpvalue(data,"buyin","personalbuyin")
	}
	restoretmpvalue(data,"personalbuyinfee","personalbuyinfee")
	if(data["personalbuyinfee"]==undefined&&data["owned"]==false){
		restoretmpvalue(data,"buyinfee","personalbuyinfee")
	}
	restoretmpvalue(data,"personalreentrybuyin","personalreentrybuyin")
	if(data["personalreentrybuyin"]==undefined&&data["owned"]==false){
		restoretmpvalue(data,"reentrybuyin","personalreentrybuyin")
	}
	restoretmpvalue(data,"personalreentryfee","personalreentryfee")
	if(data["personalreentryfee"]==undefined&&data["owned"]==false){
		restoretmpvalue(data,"reentryfee","personalreentryfee")
	}
	restoretmpvalue(data,"winprice","winprice")
	restoretmpvalue(data,"totalbuyin","totalbuyin")
	restoretmpvalue(data,"place","place")
	restoretmpvalue(data,"winthing","winthing")
	restoretmpvalue(data,"gametypeid","gametype")
	if(data["gametype"]!=undefined&&String(data["gametype"]).match(/^[0-9]+$/)){
		restoretmpvalue(data,"gametype","gametype")
	}
	restoretmpvalue(data,"limittypeid","limittype")
	restoretmpvalue(data,"stacktypeid","stacktype")
	restoretmpvalue(data,"eventtypeid","eventtype")
	restoretmpvalue(data,"description","description")
	if(data["step"]){
		flowstate["step"]=Number(data["step"])||1
	}
	if(data["maxstep"]){
		flowstate["maxstep"]=Number(data["maxstep"])||1
	}
	if(flowstate["step"]<1){
		flowstate["step"]=1
	}
	if(flowstate["maxstep"]<flowstate["step"]){
		flowstate["maxstep"]=flowstate["step"]
	}
	if(mode){
		setmode(mode,true)
	}
	syncpersonaldefaults()
	synchosteddefaults()
	flowstate["temploaded"]=true
}

function syncpersonaldefaults(){
	if(flowstate["mode"]!="personal"){
		return
	}
	if(numbervalue("personalbuyin")>=0){
		setfieldvalue("personalreentrybuyin",numbervalue("personalbuyin"))
	}
	if(numbervalue("personalbuyinfee")>=0){
		setfieldvalue("personalreentryfee",numbervalue("personalbuyinfee"))
	}
}

function synchosteddefaults(){
	if(flowstate["mode"]!="hosted"){
		return
	}
	// 次數 > 0 時把買入/手續費/計分牌預設帶入 (該欄還是 0 才帶, 買入/手續費照原邏輯直接同步)
	// 次數 = 0 時把該組買入/手續費/計分牌歸零
	if(numbervalue("rebuycount")>0){
		if(numbervalue("buyin")>=0){
			setfieldvalue("rebuybuyin",numbervalue("buyin"))
		}
		if(numbervalue("buyinfee")>=0){
			setfieldvalue("rebuyfee",numbervalue("buyinfee"))
		}
		if(numbervalue("rebuychip")==0&&numbervalue("chip")>0){
			setfieldvalue("rebuychip",numbervalue("chip"))
		}
	}else{
		setfieldvalue("rebuybuyin",0)
		setfieldvalue("rebuyfee",0)
		setfieldvalue("rebuychip",0)
	}
	if(numbervalue("reentrycount")>0){
		if(numbervalue("buyin")>=0){
			setfieldvalue("reentrybuyin",numbervalue("buyin"))
		}
		if(numbervalue("buyinfee")>=0){
			setfieldvalue("reentryfee",numbervalue("buyinfee"))
		}
		if(numbervalue("reentrychip")==0&&numbervalue("chip")>0){
			setfieldvalue("reentrychip",numbervalue("chip"))
		}
	}else{
		setfieldvalue("reentrybuyin",0)
		setfieldvalue("reentryfee",0)
		setfieldvalue("reentrychip",0)
	}
	if(numbervalue("addoncount")>0){
		if(numbervalue("addonbuyin")==0&&numbervalue("buyin")>0){
			setfieldvalue("addonbuyin",numbervalue("buyin"))
		}
		if(numbervalue("addonfee")==0&&numbervalue("buyinfee")>0){
			setfieldvalue("addonfee",numbervalue("buyinfee"))
		}
		if(numbervalue("addonchip")==0&&numbervalue("chip")>0){
			setfieldvalue("addonchip",numbervalue("chip"))
		}
	}else{
		setfieldvalue("addonbuyin",0)
		setfieldvalue("addonfee",0)
		setfieldvalue("addonchip",0)
	}
}

function buildpayload(){
	let payload={
		"name": textvalue("name").trim(),
		"gametype": textvalue("gameeventtype"),
		"clubid": textvalue("clubid"),
		"buyin": 0,
		"buyinfee": 0,
		"chip": 0,
		"rebuycount": 0,
		"rebuybuyin": 0,
		"rebuyfee": 0,
		"rebuychip": 0,
		"reentrycount": 0,
		"reentrybuyin": 0,
		"reentryfee": 0,
		"reentrychip": 0,
		"addoncount": 0,
		"addonbuyin": 0,
		"addonfee": 0,
		"addonchip": 0,
		"linkuser": false,
		"openregistration": false,
		"guaranteedprize": 0,
		"private": false,
		"winprice": 0,
		"winthing": "N/A",
		"inmoney": false,
		"inft": false,
		"place": "0",
		"totalbuyin": "0",
		"owned": flowstate["mode"]=="hosted",
		"starttime": composeisotime(textvalue("date"),textvalue("starttime")),
		"endtime": composeisotime(textvalue("date"),textvalue("endtime")),
		"description": textvalue("description").trim(),
		"gametypeid": textvalue("gametype")||1,
		"limittypeid": textvalue("limittype")||1,
		"stacktypeid": textvalue("stacktype")||1,
		"eventtypeid": textvalue("eventtype")||1
	}
	if(flowstate["mode"]=="hosted"){
		payload["buyin"]=numbervalue("buyin")
		payload["buyinfee"]=numbervalue("buyinfee")
		payload["chip"]=numbervalue("chip")
		payload["rebuycount"]=numbervalue("rebuycount")
		payload["rebuybuyin"]=numbervalue("rebuybuyin")
		payload["rebuyfee"]=numbervalue("rebuyfee")
		payload["rebuychip"]=numbervalue("rebuychip")
		payload["reentrycount"]=numbervalue("reentrycount")
		payload["reentrybuyin"]=numbervalue("reentrybuyin")
		payload["reentryfee"]=numbervalue("reentryfee")
		payload["reentrychip"]=numbervalue("reentrychip")
		payload["addoncount"]=numbervalue("addoncount")
		payload["addonbuyin"]=numbervalue("addonbuyin")
		payload["addonfee"]=numbervalue("addonfee")
		payload["addonchip"]=numbervalue("addonchip")
		payload["linkuser"]=checkboxvalue("linkuser")
		payload["openregistration"]=checkboxvalue("linkuser")&&checkboxvalue("openregistration")
		payload["guaranteedprize"]=numbervalue("guaranteedprize")
		payload["private"]=checkboxvalue("linkuser")&&checkboxvalue("private")
	}else{
		payload["buyin"]=numbervalue("personalbuyin")
		payload["buyinfee"]=numbervalue("personalbuyinfee")
		payload["reentrycount"]=numbervalue("personalreentrycount")
		payload["reentrybuyin"]=numbervalue("personalreentrybuyin")
		payload["reentryfee"]=numbervalue("personalreentryfee")
		payload["winprice"]=numbervalue("winprice")
		payload["winthing"]=textvalue("winthing").trim()||"N/A"
		payload["inmoney"]=checkboxvalue("inmoney")
		payload["inft"]=checkboxvalue("inft")
		payload["place"]=String(numbervalue("place"))
		payload["totalbuyin"]=String(numbervalue("totalbuyin"))
	}
	return payload
}

function handlerequestfailure(data){
	let errorkey=""
	if(data&&data["data"]){
		errorkey=data["data"]
	}
	if(errorkey=="ERROR_token_not_found"||errorkey=="ERROR_token_error"||errorkey=="ERROR_no_permission"){
		pthandleauthfailure(errorkey)
		return
	}
	showformerror(pterror(errorkey||"\u64cd\u4f5c\u5931\u6557"))
}

function aiimportpreview(data){
	let lines=[]
	let schedule=Array.isArray(data["schedule"])?data["schedule"]:[]
	let levels=0
	let breaks=0
	let i=0
	if(data["name"]){
		lines.push("名稱："+data["name"])
	}
	if(data["startingStack"]!=null&&data["startingStack"]!=undefined){
		lines.push("起始計分牌："+Number(data["startingStack"]).toLocaleString())
	}
	if(data["buyin"]!=null&&data["buyin"]!=undefined){
		lines.push("買入："+(Number(data["buyin"])==0?"Freeroll (0)":Number(data["buyin"]).toLocaleString()))
	}
	if(data["startTime"]){
		lines.push("開始時間："+data["startTime"]+(data["startTimeDerived"]?"（由報名截止時間回推）":""))
	}else if(data["regCloseEndTime"]){
		lines.push("報名截止時間 "+data["regCloseEndTime"]+"：無法回推開始時間（來源未標示報名截止級別），請自行填寫")
	}
	for(i=0;i<schedule.length;i=i+1){
		if(schedule[i]["type"]=="break"){
			breaks=breaks+1
		}else{
			levels=levels+1
		}
	}
	if(schedule.length>0){
		lines.push("賽程結構："+levels+" 級 + "+breaks+" 個休息"+(data["regCloseLevel"]?"，報名截止 L"+data["regCloseLevel"]:""))
	}
	let box=domgetid("aiImportPreview")
	box.textContent=""
	for(i=0;i<lines.length;i=i+1){
		let line=doccreate("div")
		line.textContent=lines[i]
		box.appendChild(line)
	}
	box.classList.remove("hidden")
}

function applyaiimport(data){
	if(data["name"]){
		setfieldvalue("name",data["name"])
	}
	if(data["startingStack"]!=null&&data["startingStack"]!=undefined){
		setfieldvalue("chip",data["startingStack"])
	}
	if(data["buyin"]!=null&&data["buyin"]!=undefined){
		setfieldvalue("buyin",data["buyin"])
		setfieldvalue("personalbuyin",data["buyin"])
	}
	if(data["startTime"]){
		setfieldvalue("starttime",data["startTime"])
	}
	flowstate["aischedule"]=Array.isArray(data["schedule"])?data["schedule"]:[]
	weblsset(WEBLSNAME+"aischedule",str(flowstate["aischedule"]))
	aiimportpreview(data)
	savetempdata()
}

function aiimportsession(){
	let text=textvalue("aiImportText").trim()
	let status=domgetid("aiImportStatus")
	if(text==""){
		status.textContent="請先貼上賽事內容"
		return
	}
	let token=weblsget(WEBLSNAME+"token")
	field("aiImportBtn").disabled=true
	let aimsgs=["AI 解析中…","AI 正在思考…","AI 正在整理賽程結構…","就快好了，請稍候…","內容較長，AI 仍在努力，請再等一下…"]
	let aimsgi=0
	status.textContent=aimsgs[0]
	// 等待期間輪播鼓勵訊息，讓使用者知道沒卡住；停在最後一句不回頭，避免像重置。
	let aimsgtimer=setInterval(function(){
		if(aimsgi<aimsgs.length-1){
			aimsgi=aimsgi+1
		}
		status.textContent=aimsgs[aimsgi]
	},5500)
	// fetch 沒有 timeout 選項, 用 AbortController + setTimeout 實作 60 秒逾時, 逾時會進 catch 的 AbortError 分支
	const AIABORTCONTROLLER=new AbortController()
	const AIABORTTIMER=setTimeout(function(){
		AIABORTCONTROLLER.abort()
	},60000)
	fetch(AJAXURL+"parsestructure",{
		method: "POST",
		signal: AIABORTCONTROLLER.signal,
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer "+token
		},
		body: JSON.stringify({ text: text, mode: "session" })
	}).then(function(response){
		return response.json()
	}).then(function(res){
		if(!res||!res["success"]||!res["data"]){
			status.textContent="解析失敗，請再試一次"
			return
		}
		let data=res["data"]
		applyaiimport(data)
		let count=flowstate["aischedule"].length
		if(data["aiavailable"]==false){
			status.textContent="AI 未啟用，僅用規則解析結構（"+count+" 項）"
		}else if(count>0){
			status.textContent="已填入欄位，並帶入 "+count+" 個賽程項目（建立場次後自動套用）"
		}else{
			status.textContent="已填入欄位"
		}
	}).catch(function(error){
		if(error&&error.name=="AbortError"){
			status.textContent="AI 解析逾時，請縮短內容或稍後再試"
		}else{
			status.textContent="網路不佳，請重新嘗試"
		}
	}).finally(function(){
		clearTimeout(AIABORTTIMER)
		clearInterval(aimsgtimer)
		field("aiImportBtn").disabled=false
	})
}

function saveaischedule(sessionid,schedule,done){
	let token=weblsget(WEBLSNAME+"token")
	fetch(AJAXURL+"savetimer/"+sessionid,{
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer "+token
		},
		body: JSON.stringify({ action: "struct-edit", state: { schedule: schedule, currentIndex: 0 } })
	}).then(function(response){
		return response.json()
	}).then(function(){
		done()
	}).catch(function(){
		// 結構存失敗不擋場次建立，仍導頁；使用者可到「編輯結構」重貼。
		done()
	})
}

function fillselect(id,row,group){
	let html=""
	let label=""
	let i=0
	for(i=0;i<row.length;i=i+1){
		label=row[i]["code"]
		if(TRANSLATE&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["type"]&&TRANSLATE[LANGUAGE]["type"][group]&&TRANSLATE[LANGUAGE]["type"][group][row[i]["code"]]){
			label=TRANSLATE[LANGUAGE]["type"][group][row[i]["code"]]
		}
		html=html+"<option value=\""+row[i]["id"]+"\">"+label+"</option>"
	}
	field(id).innerHTML=html
}

function loadclublist(){
	ajax("GET",AJAXURL+"getclublist",function(event,data){
		let row=[]
		let html="<option value=\"\">\u8acb\u9078\u64c7\u5730\u9ede</option>"
		let i=0
		if(data["success"]){
			row=data["data"]
			for(i=0;i<row.length;i=i+1){
				html=html+"<option value=\""+row[i]["id"]+"\">"+row[i]["name"]+"("+row[i]["ps"]+")</option>"
			}
			field("clubid").innerHTML=html
			flowstate["loadingclubed"]=true
			loadtempdata()
			return
		}
		handlerequestfailure(data)
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function loadtypelist(){
	ajax("GET",AJAXURL+"gettypelist",function(event,data){
		let typemap=null
		if(data["success"]){
			typemap=data["data"]
			fillselect("gametype",typemap["game"],"game")
			fillselect("limittype",typemap["limit"],"limit")
			fillselect("stacktype",typemap["stack"],"stack")
			fillselect("eventtype",typemap["event"],"event")
			flowstate["loadingtypeed"]=true
			loadtempdata()
			return
		}
		handlerequestfailure(data)
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function bindevents(){
	let modebuttons=document.querySelectorAll("[data-mode-card]")
	let stepbuttons=document.querySelectorAll("[data-step-item]")
	let numberbuttons=document.querySelectorAll("[data-number-target]")
	let syncids=[
		"name","gameeventtype","clubid","date","starttime","endtime",
		"rebuycount","reentrycount","addoncount","personalreentrycount",
		"buyin","buyinfee","chip","rebuybuyin","rebuyfee","rebuychip",
		"reentrybuyin","reentryfee","reentrychip","addonbuyin","addonfee",
		"addonchip","guaranteedprize","personalbuyin","personalbuyinfee",
		"personalreentrybuyin","personalreentryfee","totalbuyin","winprice",
		"place","winthing","gametype","limittype","stacktype","eventtype","description"
	]
	let checkboxids=["linkuser","openregistration","private","inmoney","inft"]
	let i=0
	let element=null

	for(i=0;i<modebuttons.length;i=i+1){
		modebuttons[i].addEventListener("click",function(){
			setmode(this.getAttribute("data-mode-card"))
		})
		modebuttons[i].addEventListener("keydown",function(event){
			if(event.key=="Enter"||event.key==" "){
				event.preventDefault()
				setmode(this.getAttribute("data-mode-card"))
			}
		})
	}
	for(i=0;i<stepbuttons.length;i=i+1){
		stepbuttons[i].addEventListener("click",function(){
			gotoStep(this.getAttribute("data-step-item"))
		})
		stepbuttons[i].addEventListener("keydown",function(event){
			if(event.key=="Enter"||event.key==" "){
				event.preventDefault()
				gotoStep(this.getAttribute("data-step-item"))
			}
		})
	}
	for(i=0;i<numberbuttons.length;i=i+1){
		numberbuttons[i].addEventListener("click",function(){
			let targetid=this.getAttribute("data-number-target")
			let delta=Number(this.getAttribute("data-number-delta"))||0
			let target=field(targetid)
			let current=numbervalue(targetid)
			let next=current+delta
			if(next<0){
				next=0
			}
			if(target){
				target.value=String(next)
				if(targetid=="personalreentrycount"){
					syncpersonaldefaults()
				}
				savetempdata()
			}
		})
	}
	field("previousbtn").addEventListener("click",function(){
		previousstep()
	})
	field("nextbtn").addEventListener("click",function(){
		nextstep()
	})
	field("changemodebtn").addEventListener("click",function(){
		field("modechooser").scrollIntoView({
			"behavior": "smooth",
			"block": "start"
		})
		setmode("",true)
	})
	setupcorebox()

	for(i=0;i<syncids.length;i=i+1){
		element=field(syncids[i])
		if(!element){
			continue
		}
		element.addEventListener("input",function(){
			if(this.id=="personalbuyin"||this.id=="personalbuyinfee"){
				syncpersonaldefaults()
			}
			if(this.id=="buyin"||this.id=="buyinfee"||this.id=="chip"||this.id=="rebuycount"||this.id=="reentrycount"||this.id=="addoncount"){
				synchosteddefaults()
			}
			validatenewsessioninstant(this.id)
			savetempdata()
		})
		element.addEventListener("change",function(){
			if(this.id=="personalbuyin"||this.id=="personalbuyinfee"){
				syncpersonaldefaults()
			}
			if(this.id=="buyin"||this.id=="buyinfee"||this.id=="chip"||this.id=="rebuycount"||this.id=="reentrycount"||this.id=="addoncount"){
				synchosteddefaults()
			}
			validatenewsessioninstant(this.id)
			savetempdata()
		})
	}

	for(i=0;i<checkboxids.length;i=i+1){
		element=field(checkboxids[i])
		if(!element){
			continue
		}
		element.addEventListener("change",function(){
			if(this.id=="linkuser"){
				rendermodeblocks()
			}
			savetempdata()
		})
	}

	// 多步驟表單: 在輸入框(如起始計分牌)按 Enter 不要送出整個表單, 避免提前/連續建立; 請改用「下一步/建立」按鈕
	field("form").addEventListener("keydown",function(event){
		if(event.key=="Enter"&&event.target&&event.target.tagName=="INPUT"&&event.target.type!="submit"&&event.target.type!="button"){
			event.preventDefault()
		}
	})
	field("form").addEventListener("submit",function(event){
		let payload=null
		event.preventDefault()
		if(field("submit").disabled){
			return
		}
		ptsetsubmitstate(field("submit"),true,"建立中...")
		if(!validateallsteps()){
			ptsetsubmitstate(field("submit"),false)
			return
		}
		payload=buildpayload()
		ajax("POST",AJAXURL+"newsession",function(responseevent,data){
			if(data["success"]){
				leaveguard.clear()
				weblsset(WEBLSNAME+"sessiontemp",null)
				let newid=data["data"]
				let schedule=flowstate["aischedule"]||[]
				if(newid&&schedule.length>0){
					// AI \u532f\u5165\u6709\u5e36\u7d50\u69cb\uff1a\u5efa\u7acb\u5f8c\u7acb\u523b\u628a\u7d50\u69cb\u5b58\u9032\u65b0\u5834\u6b21\uff0c\u518d\u5c0e\u9801\u3002
					saveaischedule(newid,schedule,function(){
						weblsset(WEBLSNAME+"aischedule",null)
						pttoastsuccess("\u65b0\u589e\u6210\u529f")
						href("session.html?id="+newid+"#settings")
					})
					return
				}
				pttoastsuccess("\u65b0\u589e\u6210\u529f")
				if(newid){
					href("session.html?id="+newid+"#settings")
				}else{
					href("sessionlist.html")
				}
				return
			}
			if(data&&data["data"]=="ERROR_request_timeout"){
				// 逾時時底層請求可能其實已送達並在後端建立了場次; 若此時重新啟用建立鈕讓使用者立刻再送, 容易造成重複多筆。
				// 保持建立鈕停用並提示回列表確認, 搭配後端去重雙重把關。
				ptsetsubmitstate(field("submit"),true,"請回列表確認")
				innertext("#error","連線逾時，場次可能已建立，請先回場次列表確認，不要重複送出。",false)
				pttoasterror("連線逾時，場次可能已建立，請先回場次列表確認")
				return
			}
			ptsetsubmitstate(field("submit"),false)
			handlerequestfailure(data)
		},str(payload),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	})

	if(field("aiImportBtn")){
		field("aiImportBtn").addEventListener("click",aiimportsession)
	}
}

function initdefaultvalues(){
	let today=new Date().toISOString().split("T")[0]
	let savedschedule=json(weblsget(WEBLSNAME+"aischedule"))
	if(Array.isArray(savedschedule)){
		flowstate["aischedule"]=savedschedule
	}
	setfieldvalue("date",today)
	rendermodeblocks()
	renderlayout()
	renderpanels()
}

bindevents()
initdefaultvalues()
loadclublist()
loadtypelist()
