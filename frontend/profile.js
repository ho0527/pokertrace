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

ajax("GET",AJAXURL+"getuser",function(event,data){
	if(data["success"]){
		let row=data["data"]

		innerhtml("#playerid",row["playerid"],false)
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
				name: "盈虧",
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
			alert("權杖已失效，請重新登入")
			weblsset(WEBLSNAME+"signin",null)
			weblsset(WEBLSNAME+"token",null)
			weblsset(WEBLSNAME+"userid",null)
			weblsset(WEBLSNAME+"permission",null)
			weblsset(WEBLSNAME+"name",null)
			href("signin.html")
		}else{
			alert("網路不佳，請重新嘗試")
		}
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])


onclick("#signout",function(element,event){
	ajax("POST",AJAXURL+"signout",function(event,data){
		if(data["success"]){
			alert("登出成功")
			weblsset(WEBLSNAME+"signin",null)
			weblsset(WEBLSNAME+"token",null)
			weblsset(WEBLSNAME+"userid",null)
			weblsset(WEBLSNAME+"permission",null)
			weblsset(WEBLSNAME+"name",null)
			href("./")
		}else{
			if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
				alert("權杖已失效，請重新登入")
				weblsset(WEBLSNAME+"signin",null)
				weblsset(WEBLSNAME+"token",null)
				weblsset(WEBLSNAME+"userid",null)
				weblsset(WEBLSNAME+"permission",null)
				weblsset(WEBLSNAME+"name",null)
				href("signin.html")
			}else{
				alert("網路不佳，請重新嘗試")
			}
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})