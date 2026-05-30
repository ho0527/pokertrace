/*
	製作人員: 賀皓群(小賀) / dc: chris0527 / line: ho960527 / email: chris960527ho@gmail.com / 電話: 0906585605

		|-------    -----    -                     -     -----  -----  -----   -------|
	   |-------    -        -            - - -          -                     -------|
	  |-------    -        -------    -          -     -----    --       --  -------|
	 |-------    -        -     -    -          -         -      --     --  -------|
	|-------    -----    -     -    -          -     -----         -----  -------|

	無授權禁止拷貝使用!
*/

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let currentusertype="player"
let staffData={
	"dealer": [],
	"floor": [],
	"assistant": []
}
let staffLabel={
	"dealer": "dealer",
	"floor": "floor",
	"assistant": "assistant"
}
let currentStaffType="dealer"
let chipcolors=[
	{"name": "白色","color": "#ffffff"},
	{"name": "紅色","color": "#ff0000"},
	{"name": "藍色","color": "#0000ff"},
	{"name": "綠色","color": "#008000"},
	{"name": "黑色","color": "#000000"},
	{"name": "黃色","color": "#ffff00"},
	{"name": "橘色","color": "#ffa500"},
	{"name": "紫色","color": "#800080"},
	{"name": "粉紅色","color": "#ffc0cb"},
	{"name": "灰色","color": "#808080"}
]

function profiletext(key){
	return TRANSLATE[LANGUAGE]["profile"][key]
}

staffLabel={
	"dealer": profiletext("dealer"),
	"floor": profiletext("floor"),
	"assistant": profiletext("assistant")
}

function settext(selector,text){
	let element=document.querySelector(selector)
	if(element){
		element.textContent=text
	}
}

function setlabelbyvalueid(id,text){
	let valueelement=document.getElementById(id)
	if(valueelement&&valueelement.parentElement){
		let labels=valueelement.parentElement.querySelectorAll("span")
		if(0<labels.length){
			labels[0].textContent=text
		}
	}
}

function setcardtitle(valueid,text){
	let valueelement=document.getElementById(valueid)
	if(valueelement){
		let card=valueelement.closest(".bg-zinc-900")
		if(card){
			let title=card.querySelector(".font-semibold")
			if(title){
				title.textContent=text
			}
		}
	}
}

function setstaffcardlabel(countid,text){
	let count=document.getElementById(countid)
	if(count&&count.parentElement){
		let labels=count.parentElement.querySelectorAll("span")
		if(1<labels.length){
			labels[1].textContent=text
		}
	}
}

function applyprofilelanguage(){
	document.title=profiletext("title")
	settext("h1",profiletext("title"))
	let playertext=document.querySelector("p.text-zinc-400.mb-8")
	if(playertext){
		let playerid="P-00001"
		let playerel=document.getElementById("playerid")
		if(playerel){
			playerid=playerel.textContent
		}
		playertext.innerHTML=profiletext("playerid")+`: <span class="text-white font-mono font-bold" id="playerid">${playerid}</span>`
	}
	settext("#tab-month",profiletext("monthreport"))
	settext("#tab-year",profiletext("yearreport"))
	settext("#tab-all",profiletext("allreport"))
	settext("#filter-month label",profiletext("selectmonth"))
	settext("#filter-year label",profiletext("selectyear"))
	let feelabel=document.querySelector("label[for=\"includefee\"]")
	if(feelabel){
		feelabel.innerHTML=profiletext("includefee")+`<span class="text-xs text-zinc-500 ml-1">(${profiletext("includefeedesc")})</span>`
	}
	setcardtitle("cash-games",profiletext("cash"))
	setlabelbyvalueid("cash-games",profiletext("games"))
	setlabelbyvalueid("cash-buyin",profiletext("totalbuyin"))
	setlabelbyvalueid("cash-profit",profiletext("totalprofit"))
	setcardtitle("tlt-games",profiletext("tlt"))
	setlabelbyvalueid("tlt-games",profiletext("sessions"))
	setlabelbyvalueid("tlt-buyin",profiletext("totalbuyin"))
	setlabelbyvalueid("tlt-profit",profiletext("totalprofit"))
	setcardtitle("mtt-games",profiletext("mtt"))
	setlabelbyvalueid("mtt-games",profiletext("sessions"))
	setlabelbyvalueid("mtt-buyincount",profiletext("buyincount"))
	setlabelbyvalueid("mtt-buyin",profiletext("totalbuyin"))
	setlabelbyvalueid("mtt-profit",profiletext("totalprofit"))
	setlabelbyvalueid("report-total",profiletext("reporttotal"))
	setstaffcardlabel("dealer-count",profiletext("dealer"))
	setstaffcardlabel("floor-count",profiletext("floor"))
	setstaffcardlabel("assistant-count",profiletext("assistant"))
	let langzhtw=document.getElementById("lang-zhtw")
	if(langzhtw){
		let langsection=langzhtw.closest(".bg-zinc-800")
		if(langsection){
			let title=langsection.querySelector(".text-lg")
			if(title){
				title.textContent=profiletext("language")
			}
		}
		langzhtw.textContent=profiletext("chinese")
	}
	let langen=document.getElementById("lang-en")
	if(langen){
		langen.textContent=profiletext("english")
	}
	let linkcards=document.querySelectorAll("a.bg-zinc-800")
	if(0<linkcards.length){
		let title=linkcards[0].querySelector(".font-semibold")
		if(title){
			title.textContent=profiletext("localtimer")
		}
		let subtitle=linkcards[0].querySelector(".text-xs")
		if(subtitle){
			subtitle.textContent=""
		}
	}
	if(1<linkcards.length){
		let title=linkcards[1].querySelector(".font-semibold")
		if(title){
			title.textContent=profiletext("refereecontrol")
		}
		let subtitle=linkcards[1].querySelector(".text-xs")
		if(subtitle){
			subtitle.textContent=""
		}
	}
	let stafflist=document.getElementById("staffmodal-list")
	if(stafflist&&stafflist.previousElementSibling){
		stafflist.previousElementSibling.textContent=profiletext("staffmodalcurrent")
	}
	let staffinput=document.getElementById("staffid-input")
	if(staffinput){
		staffinput.placeholder=profiletext("staffinputplaceholder")
	}
	let addbutton=document.querySelector("#staffmodal button[onclick=\"addStaff()\"]")
	if(addbutton){
		addbutton.textContent=profiletext("staffmodaladd")
	}
	let closebutton=document.querySelector("#staffmodal button[onclick=\"closeStaffModal()\"].w-full")
	if(closebutton){
		closebutton.textContent=profiletext("staffmodalclose")
	}
	let signout=document.getElementById("signout")
	if(signout){
		signout.value=TRANSLATE[LANGUAGE]["signout"]
	}
}

applyprofilelanguage()

// 取得 includefee toggle 狀態 (預設 true)
function getincludefee(){
	let el=document.getElementById("includefee")
	if(el){
		return el.checked
	}
	return true
}

function loadgetuser(){
	let includefee=getincludefee()
	ajax("GET",AJAXURL+"getuser?includefee="+includefee,gotuserdata,null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function gotuserdata(event,data){
	if(data["success"]){
		let row=data["data"]
		currentusertype=row["type"]||"player"
		chipcolors=row["chipcolors"]||chipcolors
		renderchipcolorpreview()

		innerhtml("#playerid",row["playerid"],false)
		renderemploymentsection(row)
		if(currentusertype=="player"){
			loadstafflist()
		}
		// data["data"]["totalprice"]=10000

		// 產生最近七天的日期標籤
		let datelabel=[]
		let today=new Date()
		for(let i=6;i>=0;i--){
			let d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-i)
			datelabel.push(`${d.getMonth()+1}/${d.getDate()}`)
		}
		let mychart=echarts.init(domgetid("trendChart"))
		let option={
			"tooltip": { trigger: "axis" },
			"xAxis": { type: "category",data: datelabel },
			"yAxis": { type: "value" },
			"series": [{
				name: TRANSLATE[LANGUAGE]["mainpage"]["profit"],
				type: "line",
				smooth: true,
				data: row["lastweekprofit"],
				areaStyle: {
					color: "#22d3ee",
					opacity: 0.2
				},
				lineStyle: { color: "#22d3ee" },
				itemStyle: { color: "#22d3ee" }
			}]
		}
		mychart.setOption(option)

		innerhtml("#todaytotalprofit",`${0<=row["todaytotalprofit"]?"+":""}${row["todaytotalprofit"]}`,false)
		innerhtml("#weektotalprofit",`${0<=row["weektotalprofit"]?"+":""}${row["weektotalprofit"]}`,false)
		innerhtml("#monthtotalprofit",`${0<=row["monthtotalprofit"]?"+":""}${row["monthtotalprofit"]}`,false)
		addclass("#todaytotalprofit",[`${0<=row["todaytotalprofit"]?"text-green-400":"text-red-400"}`])
		addclass("#weektotalprofit",[`${0<=row["weektotalprofit"]?"text-green-400":"text-red-400"}`])
		addclass("#monthtotalprofit",[`${0<=row["monthtotalprofit"]?"text-green-400":"text-red-400"}`])
	}else{
		if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
			alert(profiletext("tokenexpired"))
			weblsset(WEBLSNAME+"signin",null)
			weblsset(WEBLSNAME+"token",null)
			weblsset(WEBLSNAME+"userid",null)
			weblsset(WEBLSNAME+"permission",null)
			weblsset(WEBLSNAME+"name",null)
			href("signin.html")
		}else{
			alert(profiletext("networkerror"))
		}
	}
}

loadgetuser()

function renderchipcolorpreview(){
	let box=document.getElementById("chipcolorpreview")
	if(!box){
		return
	}
	let names=[]
	for(let i=0;i<chipcolors.length;i=i+1){
		names.push(chipcolors[i]["name"])
	}
	box.textContent=names.join("、")
}

function chipcolorrowhtml(item){
	item=item||{
		"name": "白色",
		"color": "#ffffff"
	}
	return `
		<div class="grid grid-cols-[1fr_120px_40px] gap-2 chipcolorrow">
			<input class="chipcolorname bg-zinc-700 text-white rounded px-3 py-2" value="${item["name"]||""}" placeholder="名稱">
			<input type="color" class="chipcolorvalue bg-zinc-700 rounded px-2 py-1 h-10" value="${item["color"]||"#ffffff"}" title="顏色">
			<button class="removechipcolor bg-red-600 hover:bg-red-700 rounded">×</button>
		</div>
	`
}

function defaultchipcolors(){
	return [
		{"name": "白色","color": "#ffffff"},
		{"name": "紅色","color": "#ff0000"},
		{"name": "藍色","color": "#0000ff"},
		{"name": "綠色","color": "#008000"},
		{"name": "黑色","color": "#000000"},
		{"name": "黃色","color": "#ffff00"},
		{"name": "橘色","color": "#ffa500"},
		{"name": "紫色","color": "#800080"},
		{"name": "粉紅色","color": "#ffc0cb"},
		{"name": "灰色","color": "#808080"}
	]
}

function openchipcolormodal(){
	let old=document.getElementById("chipcolormodal")
	if(old){
		old.remove()
	}
	let cover=document.createElement("div")
	cover.id="chipcolormodal"
	cover.className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4"
	let rows=""
	for(let i=0;i<chipcolors.length;i=i+1){
		rows=rows+chipcolorrowhtml(chipcolors[i])
	}
	cover.innerHTML=`
		<div class="bg-zinc-900 border border-zinc-700 rounded-lg max-w-lg w-full p-5 shadow-xl">
			<div class="flex items-center justify-between mb-4">
				<div class="text-lg font-semibold text-white">籌碼顏色種類</div>
				<button class="closechipcolor text-zinc-400 hover:text-white">×</button>
			</div>
			<div class="text-sm text-zinc-400 mb-3">這些顏色會出現在賽事設定的籌碼顏色下拉選單。名稱是下拉選單顯示文字，顏色是實際儲存色碼。</div>
			<div class="grid grid-cols-[1fr_120px_40px] gap-2 text-xs text-zinc-500 mb-1 px-1">
				<div>顏色名稱</div>
				<div>顏色</div>
				<div></div>
			</div>
			<div id="chipcolorrows" class="space-y-2">${rows}</div>
			<div class="flex justify-between gap-2 mt-5">
				<button id="addchipcolor" class="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded">新增顏色</button>
				<button id="savechipcolors" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">儲存</button>
			</div>
		</div>
	`
	document.body.appendChild(cover)
	bindchipcolorbuttons(cover)
}

function bindchipcolorbuttons(cover){
	let closebuttons=cover.querySelectorAll(".closechipcolor")
	for(let i=0;i<closebuttons.length;i=i+1){
		closebuttons[i].onclick=function(){
			cover.remove()
		}
	}
	let addbutton=cover.querySelector("#addchipcolor")
	addbutton.onclick=function(){
		cover.querySelector("#chipcolorrows").insertAdjacentHTML("beforeend",chipcolorrowhtml({
			"name": "新顏色",
			"color": "#ffffff"
		}))
		bindchipcolorbuttons(cover)
	}
	let removebuttons=cover.querySelectorAll(".removechipcolor")
	for(let i=0;i<removebuttons.length;i=i+1){
		removebuttons[i].onclick=function(){
			this.parentElement.remove()
		}
	}
	let savebutton=cover.querySelector("#savechipcolors")
	savebutton.onclick=function(){
		if(this.dataset.busy=="1"){
			return
		}
		let rows=cover.querySelectorAll(".chipcolorrow")
		let colors=[]
		for(let i=0;i<rows.length;i=i+1){
			colors.push({
				"name": rows[i].querySelector(".chipcolorname").value,
				"color": rows[i].querySelector(".chipcolorvalue").value
			})
		}
		this.dataset.busy="1"
		this.disabled=true
		ajax("PUT",AJAXURL+"edituserchipcolors",function(event,data){
			savebutton.dataset.busy="0"
			savebutton.disabled=false
			if(data["success"]){
				chipcolors=data["data"]
				renderchipcolorpreview()
				pttoast("儲存成功","success")
				cover.remove()
			}else{
				pttoast(pterror(data["data"]||"儲存失敗"),"error")
			}
		},str({
			"colors": colors
		}),[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	}
}

onclick("#openchipcolormodal",function(element,event){
	openchipcolormodal()
})


function userreport(type,year=new Date().getFullYear(),month=new Date().getMonth()+1){
	let includefee=getincludefee()
	ajax("GET",AJAXURL+"getuserreport?type="+type+"&year="+year+"&month="+month+"&includefee="+includefee,function(event,data){
		if(data["success"]){
			let row=data["data"]

			innertext("#cash-games",row["cash"]["count"],false)
			innertext("#cash-buyin",row["cash"]["buyin"],false)
			innertext("#cash-profit",`${0<=row["cash"]["profit"]?"+":""}${row["cash"]["profit"]}`,false)
			removeclass("#cash-profit",["text-green-400","text-red-400"])
			addclass("#cash-profit",[`${0<=row["cash"]["profit"]?"text-green-400":"text-red-400"}`])

			innertext("#tlt-games",row["tlt"]["count"],false)
			innertext("#tlt-buyin",row["tlt"]["buyin"],false)
			innertext("#tlt-profit",`${0<=row["tlt"]["profit"]?"+":""}${row["tlt"]["profit"]}`,false)
			removeclass("#tlt-profit",["text-green-400","text-red-400"])
			addclass("#tlt-profit",[`${0<=row["tlt"]["profit"]?"text-green-400":"text-red-400"}`])

			innertext("#mtt-games",row["mtt"]["count"],false)
			innertext("#mtt-buyin",row["mtt"]["buyin"],false)
			innertext("#mtt-buyincount",row["mtt"]["buyincount"],false)
			innertext("#mtt-profit",`${0<=row["mtt"]["profit"]?"+":""}${row["mtt"]["profit"]}`,false)
			removeclass("#mtt-profit",["text-green-400","text-red-400"])
			addclass("#mtt-profit",[`${0<=row["mtt"]["profit"]?"text-green-400":"text-red-400"}`])

			// MTT 進階統計 (ROI / ITM / FT / Top3)
			let mttroi=row["mtt"]["roi"]||0
			innertext("#mtt-roi",`${0<=mttroi?"+":""}${mttroi}%`,false)
			removeclass("#mtt-roi",["text-green-400","text-red-400"])
			addclass("#mtt-roi",[`${0<=mttroi?"text-green-400":"text-red-400"}`])
			innertext("#mtt-itm",`${row["mtt"]["itm"]||0}%`,false)
			innertext("#mtt-ft",`${row["mtt"]["ft"]||0}%`,false)
			innertext("#mtt-top3",`${row["mtt"]["top3"]||0}%`,false)

			innertext("#report-total",`${0<=row["profit"]?"+":""}${row["profit"]}`,false)
			removeclass("#report-total",["text-green-400","text-red-400"])
			addclass("#report-total",[`${0<=row["profit"]?"text-green-400":"text-red-400"}`])
		}else{
			if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
				alert(profiletext("tokenexpired"))
				weblsset(WEBLSNAME+"signin",null)
				weblsset(WEBLSNAME+"token",null)
				weblsset(WEBLSNAME+"userid",null)
				weblsset(WEBLSNAME+"permission",null)
				weblsset(WEBLSNAME+"name",null)
				href("signin.html")
			}else{
				alert(profiletext("networkerror"))
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

userreport("month")

// 偵測當前選中的報表 tab
function getcurrenttab(){
	let arr=[
		"month",
		"year",
		"all"
	]
	for(let i=0;i<arr.length;i=i+1){
		let t=document.getElementById("tab-"+arr[i])
		if(t&&t.classList.contains("bg-blue-600")){
			return arr[i]
		}
	}
	return "month"
}

// includefee 切換時, 重新拉 dashboard + report 資料
function refreshprofile(){
	loadgetuser()
	let type=getcurrenttab()
	if(type=="month"){
		let mdv=document.getElementById("month-date").value
		userreport("month",mdv.split("-")[0],mdv.split("-")[1])
	}else{
		if(type=="year"){
			let ydv=document.getElementById("year-date").value
			userreport("year",ydv)
		}else{
			userreport("all")
		}
	}
}

document.getElementById("includefee").addEventListener("change",refreshprofile)

value("#signout",TRANSLATE[LANGUAGE]["signout"])

// ===== 報表切換 =====
const reportTabs = ['month', 'year', 'all'];

function switchReport(type) {
	["month", "year", "all"].forEach(t => {
		const tab = document.getElementById('tab-' + t)
		tab.classList.remove('bg-blue-600', 'text-white')
		tab.classList.add('bg-zinc-700', 'text-zinc-300')
	});
	document.getElementById('tab-' + type).classList.remove('bg-zinc-700', 'text-zinc-300')
	document.getElementById('tab-' + type).classList.add('bg-blue-600', 'text-white')

	document.getElementById('filter-month').classList.add('hidden')
	document.getElementById('filter-year').classList.add('hidden')

	if (type === 'month') document.getElementById('filter-month').classList.remove('hidden')
	if (type === 'year') document.getElementById('filter-year').classList.remove('hidden')

	userreport(type, type == 'month' ? document.getElementById('month-date').value.split('-')[0] : document.getElementById('year-date').value, type === 'month' ? document.getElementById('month-date').value.split('-')[1] : new Date().getMonth() + 1)

	// // 寫死假資料示例 (日後串接 API)
	// const data = {
	// 	month: { cashGames: 48, cashBuyin: '$12,000', cashProfit: '+$3,400', tltGames: 12, tltBuyin: '$6,000', tltProfit: '-$800', mttGames: 5, mttBuyin: '$5,000', mttProfit: '+$12,500', total: '+$15,100', totalClass: 'text-green-400' },
	// 	yearly:  { cashGames: 312, cashBuyin: '$98,000', cashProfit: '+$21,000', tltGames: 88, tltBuyin: '$44,000', tltProfit: '+$5,600', mttGames: 24, mttBuyin: '$24,000', mttProfit: '+$38,000', total: '+$64,600', totalClass: 'text-green-400' },
	// 	career:  { cashGames: 1024, cashBuyin: '$410,000', cashProfit: '+$72,000', tltGames: 380, tltBuyin: '$190,000', tltProfit: '-$12,000', mttGames: 95, mttBuyin: '$95,000', mttProfit: '+$180,000', total: '+$240,000', totalClass: 'text-green-400' },
	// };
	// const d = data[type];
	// document.getElementById('cash-games').textContent = d.cashGames;
	// document.getElementById('cash-buyin').textContent = d.cashBuyin;
	// document.getElementById('cash-profit').textContent = d.cashProfit;
	// document.getElementById('cash-profit').className = 'font-mono font-bold ' + (d.cashProfit.startsWith('+') ? 'text-green-400' : 'text-red-400');
	// document.getElementById('tlt-games').textContent = d.tltGames;
	// document.getElementById('tlt-buyin').textContent = d.tltBuyin;
	// document.getElementById('tlt-profit').textContent = d.tltProfit;
	// document.getElementById('tlt-profit').className = 'font-mono font-bold ' + (d.tltProfit.startsWith('+') ? 'text-green-400' : 'text-red-400');
	// document.getElementById('mtt-games').textContent = d.mttGames;
	// document.getElementById('mtt-buyin').textContent = d.mttBuyin;
	// document.getElementById('mtt-profit').textContent = d.mttProfit;
	// document.getElementById('mtt-profit').className = 'font-mono font-bold ' + (d.mttProfit.startsWith('+') ? 'text-green-400' : 'text-red-400');
	// const totalEl = document.getElementById('report-total');
	// totalEl.textContent = d.total;
	// totalEl.className = 'text-2xl font-bold ' + d.totalClass;
}

onchange("#month-date",function(element,event){
	userreport("month", element.value.split('-')[0], element.value.split('-')[1]);
})

onchange("#year-date",function(element,event){
	userreport("year",element.value);
})

// ===== 聘用人員燈箱 =====
// 載入主辦人旗下所有員工
function loadstafflist(){
	if(currentusertype!="player"){
		return
	}

	ajax("GET",AJAXURL+"getstafflist",function(event,data){
		if(data["success"]){
			staffData=data["data"]
			renderstaffcards()
			if(!domgetid("staffmodal").classList.contains("hidden")){
				renderStaffModal()
			}
		}else{
			if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
				alert(profiletext("tokenexpired"))
				weblsset(WEBLSNAME+"signin",null)
				weblsset(WEBLSNAME+"token",null)
				href("signin.html")
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

// 渲染 profile 頁的 3 張卡片 (含計數與名單)
function renderstaffcards(){
	let roles=[
		"dealer",
		"floor",
		"assistant"
	]

	for(let i=0;i<roles.length;i=i+1){
		let r=roles[i]
		let list=staffData[r]||[]

		document.getElementById(r+"-count").textContent=list.length

		let html=""
		if(list.length==0){
			html=`<div class="text-xs text-zinc-500">${profiletext("empty")}</div>`
		}else{
			for(let j=0;j<list.length;j=j+1){
				let s=list[j]
				let statusbadge=""
				if(s["status"]=="pending"){
					statusbadge=`<span class="text-xs text-yellow-400">(${profiletext("pending")})</span>`
				}
				html=html+`
					<div class="text-xs text-zinc-400 flex justify-between">
						<span>${s["staffplayerid"]} ${s["staffname"]||""} ${statusbadge}</span>
						<button class="text-zinc-600 hover:text-red-400" onclick="removeStaff(${s["id"]})">✕</button>
					</div>
				`
			}
		}

		document.getElementById(r+"-list").innerHTML=html
	}
}

function renderemploymentsection(row){
	let title=document.getElementById("staffsectiontitle")
	let content=document.getElementById("staffsectioncontent")

	if(!title||!content){
		return
	}

	if((row["type"]||"player")=="player"){
		title.textContent=profiletext("staff")
		return
	}

	title.textContent=profiletext("employed")
	content.className="grid grid-cols-1 gap-4"

	let employedby=row["employedby"]||[]
	let html=""
	if(employedby.length==0){
		html=`
			<div class="bg-zinc-900 rounded-lg p-5 text-zinc-400 text-sm">
				${profiletext("unemployed")}
			</div>
		`
	}else{
		for(let i=0;i<employedby.length;i=i+1){
			let item=employedby[i]
			let role=staffLabel[item["role"]]||item["role"]
			html=html+`
				<div class="bg-zinc-900 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div>
						<div class="font-semibold text-white">${item["ownername"]||profiletext("unnamed")}</div>
						<div class="text-xs text-zinc-400 font-mono">P-${item["ownerplayerid"]}</div>
					</div>
					<div class="text-sm text-emerald-400 font-semibold">${role}</div>
				</div>
			`
		}
	}

	content.innerHTML=html
	let modal=document.getElementById("staffmodal")
	if(modal){
		modal.remove()
	}
}

function openStaffModal(type){
	currentStaffType=type
	document.getElementById("staffmodal-title").textContent=staffLabel[type]
	renderStaffModal()
	let modal=document.getElementById("staffmodal")
	modal.classList.remove("hidden")
	modal.classList.add("flex")
}

function closeStaffModal(){
	let modal=document.getElementById("staffmodal")
	modal.classList.add("hidden")
	modal.classList.remove("flex")
	document.getElementById("staffid-input").value=""
}

function renderStaffModal(){
	let list=staffData[currentStaffType]||[]
	let container=document.getElementById("staffmodal-list")
	if(list.length==0){
		container.innerHTML=`<div class="text-zinc-500 text-sm text-center py-4">${profiletext("empty")}</div>`
		return
	}

	let html=""
	for(let i=0;i<list.length;i=i+1){
		let s=list[i]
		let statusbadge=""
		if(s["status"]=="pending"){
			statusbadge=`<span class="text-xs text-yellow-400 ml-2">(${profiletext("pending")})</span>`
		}
		html=html+`
			<div class="flex items-center justify-between bg-zinc-900 rounded px-3 py-2">
				<div>
					<span class="text-xs font-mono text-zinc-400">P-${s["staffplayerid"]}</span>
					<span class="ml-2 text-sm text-white">${s["staffname"]||""}</span>
					${statusbadge}
				</div>
				<button onclick="removeStaff(${s["id"]})" class="text-zinc-500 hover:text-red-400 text-lg leading-none transition">&times;</button>
			</div>
		`
	}
	container.innerHTML=html
}

function addStaff(){
	let input=document.getElementById("staffid-input").value.trim()
	if(!input){
		return
	}

	// 接受 P-xxxxxxxx 或 xxxxxxxx
	let playerid=input
	if(playerid.indexOf("P-")==0){
		playerid=playerid.substring(2)
	}

	let btn=document.querySelector("#staffmodal button[onclick=\"addStaff()\"]")
	if(btn){
		btn.disabled=true
	}

	ajax("POST",AJAXURL+"newstaff",function(event,data){
		if(btn){
			btn.disabled=false
		}
		if(data["success"]){
			document.getElementById("staffid-input").value=""
			alert(profiletext("invitesent")+(data["data"]["staffname"]||profiletext("targetuser")))
			loadstafflist()
		}else{
			let msg=data["data"]
			if(msg=="ERROR_user_not_found"){
				msg=profiletext("usernotfound")
			}else if(msg=="ERROR_staff_role_mismatch"){
				msg=profiletext("rolemismatch")
			}else if(msg=="ERROR_staff_already_invited"){
				msg=profiletext("alreadyinvited")
			}else if(msg=="ERROR_staff_self_invite"){
				msg=profiletext("selfinvite")
			}
			alert(msg||profiletext("unknownerror"))
		}
	},str({
		"playerid": playerid,
		"role": currentStaffType
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

function removeStaff(staffid){
	if(!confirm(profiletext("removeconfirm"))){
		return
	}
	ajax("DELETE",AJAXURL+"deletestaff/"+staffid,function(event,data){
		if(data["success"]){
			loadstafflist()
		}else{
			alert(data["data"]||profiletext("unknownerror"))
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

// 點擊遮罩關閉
document.getElementById("staffmodal").addEventListener("click",function(e){
	if(e.target===this){
		closeStaffModal()
	}
})

let langbutton=document.getElementById("lang-"+LANGUAGE)
langbutton.classList.remove("bg-zinc-700","text-zinc-300")
langbutton.classList.add("bg-blue-600","text-white")
// ===== 語言切換 =====
function switchLang(lang){
	let langlist=[
		"zhtw",
		"en"
	]
	for(let i=0;i<langlist.length;i=i+1){
		let btn=document.getElementById("lang-"+langlist[i])
		btn.classList.remove("bg-blue-600","text-white")
		btn.classList.add("bg-zinc-700","text-zinc-300")
	}
	let active=document.getElementById("lang-"+lang)
	active.classList.remove("bg-zinc-700","text-zinc-300")
	active.classList.add("bg-blue-600","text-white")
	// 日後串接翻譯邏輯
	ajax("PUT",AJAXURL+"edituserlanguage",function(event,data){
		if(data["success"]){
			weblsset(WEBLSNAME+"language",data["data"])
			href("")
		}else{
			alert(profiletext("unknownerror"))
		}
	},str({
		"langkey": lang
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

onclick("#signout",function(element,event){
	ajax("POST",AJAXURL+"signout",function(event,data){
		if(data["success"]){
			alert(TRANSLATE[LANGUAGE]["api"]["signout"]["success"])
			weblsset(WEBLSNAME+"uid",null)
			weblsset(WEBLSNAME+"signin",null)
			weblsset(WEBLSNAME+"token",null)
			weblsset(WEBLSNAME+"userid",null)
			weblsset(WEBLSNAME+"email",null)
			weblsset(WEBLSNAME+"permission",null)
			weblsset(WEBLSNAME+"name",null)
			href("./")
		}else{
			if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
				alert(profiletext("tokenexpired"))
				weblsset(WEBLSNAME+"uid",null)
				weblsset(WEBLSNAME+"signin",null)
				weblsset(WEBLSNAME+"token",null)
				weblsset(WEBLSNAME+"userid",null)
				weblsset(WEBLSNAME+"email",null)
				weblsset(WEBLSNAME+"permission",null)
				weblsset(WEBLSNAME+"name",null)
				href("signin.html")
			}else{
				alert(profiletext("networkerror"))
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})
