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

let mainchart=null

function maintext(key){
	return TRANSLATE[LANGUAGE]["mainpage"][key]
}

function applymainlanguage(){
	document.title=maintext("title")
	let title=document.querySelector("h1")
	if(title){
		title.textContent=maintext("title")
	}
	let labels=document.querySelectorAll(".grid.grid-cols-1.md\\:grid-cols-3.gap-6.mb-8 .text-lg")
	let labelkeys=[
		"todayprofit",
		"weekprofit",
		"monthprofit"
	]
	for(let i=0;i<labels.length&&i<labelkeys.length;i=i+1){
		labels[i].textContent=maintext(labelkeys[i])
	}
	let trendtitle=document.querySelector(".bg-zinc-800.rounded-lg.p-6.shadow.mb-8 .text-lg")
	if(trendtitle){
		trendtitle.textContent=maintext("weeklytrend")
	}
}

function rendermainchart(profitdata){
	let datelabel=[]
	let today=new Date()
	for(let i=6;i>=0;i=i-1){
		let date=new Date(today.getFullYear(),today.getMonth(),today.getDate()-i)
		datelabel.push(`${date.getMonth()+1}/${date.getDate()}`)
	}

	if(!mainchart){
		mainchart=echarts.init(domgetid("trendChart"))
	}

	let option={
		"tooltip": { trigger: "axis" },
		"xAxis": { type: "category",data: datelabel },
		"yAxis": { type: "value" },
		"series": [{
			name: maintext("profit"),
			type: "line",
			smooth: true,
			data: profitdata,
			areaStyle: {
				color: "#22d3ee",
				opacity: 0.2
			},
			lineStyle: { color: "#22d3ee" },
			itemStyle: { color: "#22d3ee" }
		}]
	}
	mainchart.setOption(option)
}

applymainlanguage()

ajax("GET",AJAXURL+"getuser",function(event,data){
	if(data["success"]){
		let row=data["data"]

		rendermainchart(row["lastweekprofit"])

		innerhtml("#todaytotalprofit",`${0<=row["todaytotalprofit"]?"+":""}${row["todaytotalprofit"]}`,false)
		innerhtml("#weektotalprofit",`${0<=row["weektotalprofit"]?"+":""}${row["weektotalprofit"]}`,false)
		innerhtml("#monthtotalprofit",`${0<=row["monthtotalprofit"]?"+":""}${row["monthtotalprofit"]}`,false)
		addclass("#todaytotalprofit",[`${0<=row["todaytotalprofit"]?"text-green-400":"text-red-400"}`])
		addclass("#weektotalprofit",[`${0<=row["weektotalprofit"]?"text-green-400":"text-red-400"}`])
		addclass("#monthtotalprofit",[`${0<=row["monthtotalprofit"]?"text-green-400":"text-red-400"}`])
	}else{
		if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
			alert(TRANSLATE[LANGUAGE]["errorlist"][data["data"]])
			weblsset(WEBLSNAME+"signin",null)
			weblsset(WEBLSNAME+"token",null)
			weblsset(WEBLSNAME+"userid",null)
			weblsset(WEBLSNAME+"permission",null)
			weblsset(WEBLSNAME+"name",null)
			href("signin.html")
		}else{
			alert(maintext("networkerror"))
		}
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])
