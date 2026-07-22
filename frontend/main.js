if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let mainchart=null
let mainuser=null

function maintext(key){
	return (TRANSLATE[LANGUAGE]["mainpage"]||{})[key]||key
}

function applymainlanguage(){
	document.title=maintext("title")
	innertext("#mainheading",maintext("summarytitle"),false)
	innertext("#mainsummarydesc",maintext("summarydesc"),false)
	innertext("#mainquicktitle",maintext("quicktitle"),false)
	innertext("#mainrecenttitle",maintext("recenttitle"),false)
	innertext("#mainrecentdesc",maintext("recentdesc"),false)
	innertext("#mainnextstepstitle",maintext("nextstepstitle"),false)
	innertext("#mainlabeltoday",maintext("todayprofit"),false)
	innertext("#mainlabelweek",maintext("weekprofit"),false)
	innertext("#mainlabelmonth",maintext("monthprofit"),false)
}

function rolelabel(type){
	if(type=="dealer"){
		return maintext("dealerrole")
	}
	if(type=="floor"){
		return maintext("floorrole")
	}
	if(type=="assistant"){
		return maintext("assistantrole")
	}
	return maintext("playerrole")
}

function quickcardhtml(title,desc,hrefvalue,color){
	return `
		<a href="${hrefvalue}" class="block bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-5 border border-zinc-700 transition">
			<div class="text-sm ${color} font-semibold mb-2">${title}</div>
			<div class="text-sm text-zinc-300 leading-7">${desc}</div>
		</a>
	`
}

function renderquicklinks(type){
	let html=""
	html=html+quickcardhtml(maintext("sessionentrytitle"),maintext("sessionentrydesc"),"sessionlist.html","text-emerald-300")
	html=html+quickcardhtml(maintext("profileentrytitle"),maintext("profileentrydesc"),"profile.html","text-sky-300")
	let returnpage=ptgetreturnpage()
	if(returnpage){
		html=html+quickcardhtml(maintext("recenttitle"),maintext("recentdesc"),returnpage,"text-yellow-300")
	}else{
		html=html+`
			<div class="bg-zinc-800 rounded-2xl p-5 border border-zinc-700">
				<div class="text-sm text-yellow-300 font-semibold mb-2">${maintext("recenttitle")}</div>
				<div class="text-sm text-zinc-400 leading-7">${maintext("recentempty")}</div>
			</div>
		`
	}
	if(type=="floor"||type=="assistant"){
		html=html+quickcardhtml(maintext("timerentrytitle"),maintext("timerentrydesc"),"sessionlist.html","text-rose-300")
	}else if(type=="dealer"){
		html=html+quickcardhtml(maintext("staffentrytitle"),maintext("staffentrydesc"),"profile.html","text-rose-300")
	}else{
		html=html+quickcardhtml(maintext("benefitentrytitle"),maintext("benefitentrydesc"),"benefit.html","text-rose-300")
	}
	innerhtml("#mainquicklinks",html,false)
}

function renderrecentcard(){
	let returnpage=ptgetreturnpage()
	if(!returnpage){
		innerhtml("#mainrecentcard",`
			<div class="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-400">
				${maintext("recentempty")}
			</div>
		`,false)
		return
	}
	innerhtml("#mainrecentcard",`
		<a href="${returnpage}" class="block bg-zinc-900 border border-zinc-700 rounded-xl p-4 hover:border-emerald-400 transition">
			<div class="text-sm text-emerald-300 font-semibold mb-2">${maintext("recenttitle")}</div>
			<div class="text-sm text-zinc-300 break-all">${returnpage}</div>
		</a>
	`,false)
}

function rendernextsteps(type,row){
	let html=""
	if(type=="floor"||type=="assistant"){
		html=html+`
			<a href="sessionlist.html" class="block bg-zinc-900 border border-zinc-700 rounded-xl p-4 hover:border-emerald-400 transition">
				<div class="text-sm text-emerald-300 font-semibold mb-2">${maintext("timerentrytitle")}</div>
				<div class="text-sm text-zinc-300">${maintext("timerentrydesc")}</div>
			</a>
		`
	}
	html=html+`
		<a href="profile.html" class="block bg-zinc-900 border border-zinc-700 rounded-xl p-4 hover:border-sky-400 transition">
			<div class="text-sm text-sky-300 font-semibold mb-2">${maintext("profileentrytitle")}</div>
			<div class="text-sm text-zinc-300">${maintext("profileentrydesc")}</div>
		</a>
	`
	if(type=="player"){
		html=html+`
			<a href="benefit.html" class="block bg-zinc-900 border border-zinc-700 rounded-xl p-4 hover:border-yellow-400 transition">
				<div class="text-sm text-yellow-300 font-semibold mb-2">${maintext("benefitentrytitle")}</div>
				<div class="text-sm text-zinc-300">${maintext("benefitentrydesc")}</div>
			</a>
		`
	}
	if((row["todaytotalprofit"]||0)==0&&(row["weektotalprofit"]||0)==0&&(row["monthtotalprofit"]||0)==0){
		html=html+`
			<div class="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
				<div class="text-sm text-zinc-300 leading-7">${maintext("nosummary")}</div>
			</div>
		`
	}
	innerhtml("#mainnextsteps",html,false)
}

function rendermainchart(profitdata){
	let emptyed=true
	let datalength=profitdata.length
	for(let i=0;i<datalength;i=i+1){
		if(Number(profitdata[i]||0)!=0){
			emptyed=false
		}
	}
	if(emptyed){
		style("#trendChart",[["display","none"]])
		innerhtml("#mainsummaryempty",`
			<div class="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
				<div class="text-sm text-zinc-300 leading-7">${maintext("nosummary")}</div>
			</div>
		`,false)
		removeclass("#mainsummaryempty",["hidden"])
		return
	}
	style("#trendChart",[["display","block"]])
	addclass("#mainsummaryempty",["hidden"])
	let datelabel=[]
	let today=new Date()
	for(let i=6;i>=0;i=i-1){
		let date=new Date(today.getFullYear(),today.getMonth(),today.getDate()-i)
		datelabel.push((date.getMonth()+1)+"/"+date.getDate())
	}
	if(!mainchart){
		mainchart=echarts.init(domgetid("trendChart"))
	}
	let option={
		"tooltip": {
			trigger: "axis"
		},
		"xAxis": {
			type: "category",
			data: datelabel
		},
		"yAxis": {
			type: "value"
		},
		"series": [{
			name: maintext("profit"),
			type: "line",
			smooth: true,
			data: profitdata,
			areaStyle: {
				color: "#22d3ee",
				opacity: 0.2
			},
			lineStyle: {
				color: "#22d3ee"
			},
			itemStyle: {
				color: "#22d3ee"
			}
		}]
	}
	mainchart.setOption(option)
}

function renderprofits(row){
	let keys=[
		["todaytotalprofit","todaytotalprofit"],
		["weektotalprofit","weektotalprofit"],
		["monthtotalprofit","monthtotalprofit"]
	]
	for(let i=0;i<keys.length;i=i+1){
		let id=keys[i][0]
		let key=keys[i][1]
		let number=Number(row[key]||0)
		let text=""+number
		if(0<number){
			text="+"+number
		}
		innertext("#"+id,text,false)
		removeclass("#"+id,["text-green-400","text-red-400","text-zinc-400"])
		if(0<number){
			addclass("#"+id,["text-green-400"])
		}else if(number<0){
			addclass("#"+id,["text-red-400"])
		}else{
			addclass("#"+id,["text-zinc-400"])
		}
	}
}

function rendermain(row){
	mainuser=row
	let type=row["type"]||"player"
	innertext("#mainrolelabel",rolelabel(type),false)
	renderquicklinks(type)
	renderrecentcard()
	rendernextsteps(type,row)
	renderprofits(row)
	rendermainchart(row["lastweekprofit"]||[])
}

applymainlanguage()

ajax("GET",AJAXURL+"getuser",function(event,data){
	if(data["success"]){
		rendermain(data["data"])
		return
	}
	if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"||data["data"]=="ERROR_no_permission"){
		pthandleauthfailure(data["data"],{
			"toasted": false
		})
		return
	}
	pttoasterror(data["data"]||maintext("networkerror"))
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
],{
	loadingtarget: "main"
})
