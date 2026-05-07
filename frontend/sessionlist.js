let gametype={}
let limittype={}
let stacktype={}
let eventtype={}

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function renderSessionTable(sessions){
    if (window.innerWidth<768){
    	innerhtml("#main",sessions.map(function(row){
            let winprice=row["winprice"]-(row["buyin"]+(row["rebuybuyin"]*row["rebuycount"]));
            let isProfit=0<=winprice;
            return `
                <div class="bg-zinc-800 rounded-lg p-4 mb-4 cursor-pointer hover:bg-zinc-700 transition" onclick="location='session.html?id=${row["id"]}'">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-sm text-zinc-400">${row["starttime"].split("T")[0]}</span>
                        <span class="${isProfit?"text-green-400":"text-red-400"} font-bold text-lg">${isProfit?"+":""}${winprice}</span>
                    </div>
                    <div class="my-2 text-center">
                        <p class="text-white font-semibold">${row["name"]} (${eventtype[row["eventtypeid"]]["code"]}${stacktype[row["stacktypeid"]]["code"]}${limittype[row["limittypeid"]]["code"]}${gametype[row["gametypeid"]]["code"]})</p>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mb-3 text-sm text-center">
                        <div>
                            <span class="text-zinc-400">入場費:</span>
                            <span class="text-white ml-1">${row["buyin"]}${(row["buyin"]!=row["rebuybuyin"])?("/"+row["rebuybuyin"]):""}</span>
                        </div>
                        <div>
                            <span class="text-zinc-400">排名:</span>
                            <span class="text-white ml-1">${row["place"]} / ${row["totalbuyin"]}</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="flex-1 text-blue-400 hover:underline copysession text-sm py-1" data-id="${row["id"]}">複製</button>
                        <a href="editsession.html?id=${row["id"]}" class="text-center flex-1 text-blue-400 hover:underline text-sm py-1">編輯</a>
                        <button class="flex-1 text-red-400 hover:underline deletesession text-sm py-1" data-id="${row["id"]}" data-index="${index}">刪除</button>
                    </div>
                </div>
            `
        }).join(""),false)
    }else{
		innerhtml("#main",`
			<table class="w-full text-sm bg-zinc-800 rounded-lg">
				<thead class="sticky top-0">
					<tr class="bg-zinc-700 text-zinc-300">
						<th class="py-2 px-2">#</th>
						<th class="py-2 px-2">時間</th>
						<th class="py-2 px-2">名稱</th>
						<th class="py-2 px-2">買入</th>
						<th class="py-2 px-2">名次</th>
						<th class="py-2 px-2">盈虧</th>
						<th class="py-2 px-2">操作</th>
					</tr>
				</thead>
				<tbody class="text-center">
					${
						sessions.map(function(row, index){
							let winprice=row["winprice"]-(row["buyin"]+(row["rebuybuyin"]*row["rebuycount"]));
							return `
								<tr class="hover:bg-zinc-700 transition cursor-pointer border-b border-zinc-700" onclick="location='session.html?id=${row["id"]}'">
									<td class="py-2 px-2">${index+1}</td>
									<td>${row["starttime"].split("T")[0]} ${row["starttime"].split("T")[1].split(":00Z")[0]}</td>
									<td>${row["name"]} (${eventtype[row["eventtypeid"]]["code"]}${stacktype[row["stacktypeid"]]["code"]}${limittype[row["limittypeid"]]["code"]}${gametype[row["gametypeid"]]["code"]})</td>
									<td>${row["buyin"]}${(row["buyin"]!=row["rebuybuyin"])?("/"+row["rebuybuyin"]):""}</td>
									<td>${row["place"]} / ${row["totalbuyin"]}</td>
									<td class="${0<=winprice?"text-green-400":"text-red-400"} font-bold">${0<=winprice?"+":""}${winprice}</td>
									<td>
										<input type="button" class="text-blue-400 hover:underline copysession cursor-pointer" data-id="${row["id"]}" value="複製">
										<a href="editsession.html?id=${row["id"]}" class="text-blue-400 hover:underline">編輯</a>
										<input type="button" class="text-red-400 hover:underline deletesession cursor-pointer" data-id="${row["id"]}" data-index="${index}" value="刪除">
									</td>
								</tr>
							`
						}).join('')
					}
				</tbody>
			</table>
		`,false)
    }
}


// 計算時間差（分鐘）
function calculateduration(starttime,endtime){
	let start=new Date(starttime)
	let end=new Date(endtime)
	let diff=end-start
	return Math.floor(diff/(1000*60)) // 轉換為分鐘
}

// 格式化時長顯示
function formatduration(minutes){
	if(minutes<60){
		return `${minutes} 分鐘`
	}else{
		return `${Math.floor(minutes/60)} 小時 ${minutes%60} 分鐘`
	}
}

ajax("GET",AJAXURL+"getsessionlist",async function(event,data){
	if(data["success"]){
		let row=data["data"]
		let totalprofit=0
		let typelistajax=await fetch(AJAXURL+"gettypelist",{
			"method": "GET",
			headers: {
				"Authorization": "Bearer "+weblsget(WEBLSNAME+"token"),
				"Content-Type": "application/json"
			}
		})
		let typelistdata=await typelistajax.json()
		if(typelistdata["success"]){
			typelistdata=typelistdata["data"]
			gametype=Object.fromEntries(typelistdata["game"].map(event => [event.id, event]))
			limittype=Object.fromEntries(typelistdata["limit"].map(event => [event.id, event]))
			stacktype=Object.fromEntries(typelistdata["stack"].map(event => [event.id, event]))
			eventtype=Object.fromEntries(typelistdata["event"].map(event => [event.id, event]))
		}else{}

		function main(){
			let startdate=getvalue("startdate")
			let enddate=getvalue("enddate")
			let club=getvalue("club")
			let gametype=getvalue("gametype")
			let name=getvalue("name")
			let count=0
			let totalplaytime=0
			let gamecount=0
			let filtersessions=[]

			totalprofit=0

			innerhtml("#tablemain",``,false)

			for(let i=0;i<row.length;i=i+1){
				if(!((startdate&&new Date(row[i]["starttime"])<new Date(startdate))||(enddate&&new Date(row[i]["endtime"])>new Date(enddate))||(club&&-1==row[i]["clubname"].indexOf(club))||(gametype&&"all"!=gametype&&gametype!=row[i]["gametype"])||(name&&-1==row[i]["name"].indexOf(name)))){
					let winprice=row[i]["winprice"]-(row[i]["buyin"]+(row[i]["rebuybuyin"]*row[i]["rebuycount"]))
					let duration=calculateduration(row[i]["starttime"],row[i]["endtime"])
					totalprofit=totalprofit+winprice
					totalplaytime=totalplaytime+duration
					gamecount=gamecount+1
				}
			}

			for(let i=0;i<row.length;i=i+1){
				let winprice=row[i]["winprice"]-(row[i]["buyin"]+(row[i]["rebuybuyin"]*row[i]["rebuycount"]))
				if(!((startdate&&new Date(row[i]["starttime"])<new Date(startdate))||(enddate&&new Date(row[i]["endtime"])>new Date(enddate))||(club&&-1==row[i]["clubname"].indexOf(club))||(gametype&&"all"!=gametype&&gametype!=row[i]["gametype"])||(name&&-1==row[i]["name"].indexOf(name)))){
					filtersessions.push(row[i])
					// innerhtml("#tablemain",`
					// 	<tr class="hover:bg-zinc-700 transition cursor-pointer" onclick="location='session.html?id=${row[i]["id"]}'">
					// 		<td class="py-2 px-2">${count+1}</td>
					// 		<td>${row[i]["starttime"].split("T")[0]} ${row[i]["starttime"].split("T")[1].split(":00Z")[0]}</td>
					// 		<td>${row[i]["name"]}</td>
					// 		<td>${row[i]["buyin"]}${(row[i]["buyin"]!=row[i]["rebuybuyin"])?("/"+row[i]["rebuybuyin"]):""}</td>
					// 		<td>${row[i]["place"]} / ${row[i]["totalbuyin"]}</td>
					// 		<td class="${0<=winprice?"text-green-400":"text-red-400"} font-bold">${0<=winprice?"+":""}${winprice}</td>
					// 		<td>
					// 			<input type="button" class="text-blue-400 hover:underline copysession cursor-pointer" data-id="${row[i]["id"]}" value="複製">
					// 			<a href="editsession.html?id=${row[i]["id"]}" class="text-blue-400 hover:underline">編輯</a>
					// 			<input type="button" class="text-red-400 hover:underline deletesession cursor-pointer" data-id="${row[i]["id"]}" value="刪除">
					// 		</td>
					// 	</tr>
					// `)

					count=count+1
				}

				if(40<=count){
					break
				}
			}

            renderSessionTable(filtersessions);

			// 計算平均時長
			innertext("#gamecount",gamecount,false)
			innertext("#profit",`${0<=totalprofit?"+":""}${totalprofit}`,false)
			innertext("#avgplaylength",formatduration(0<gamecount?Math.floor(totalplaytime/gamecount):0),false)

			style("#profit",[
				["color",0<=totalprofit?"#34d399":"#f87171"]
			])

			onclick(".copysession",function(element,event){
				event.preventDefault()
				event.stopPropagation()
				ajax("POST",AJAXURL+"copysession/"+dataset(element,"id"),function(event,data){
					if(data["success"]){
						href("editsession.html?id="+data["data"])
					}else{
						alert("error")
					}
				},null,[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				])
			})

			onclick(".deletesession",function(element,event){
				event.preventDefault()
				event.stopPropagation()
				if(confirm("確定刪除?")){
					element.disabled=true

					ajax("DELETE",AJAXURL+"deletesession/"+dataset(element,"id"),function(event,data){
						if(data["success"]){
							alert("刪除成功")
							row.splice(dataset(element,"index"),1)
							main()
						}else{
							alert("error")
							element.disabled=false
						}
					},null,[
						["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
					])
				}
			})
		}

		main()

		onclick("#search",function(element,event){
			main()
		})
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

ajax("GET",AJAXURL+"getclublist",function(event,data){
	if(data["success"]){
		let row=data["data"]

		for(let i=0;i<row.length;i=i+1){
			innerhtml("#club",`
				<option value="${row[i]["name"]}">${row[i]["name"]}</option>
			`)
		}
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

onenterclick("#date,#club,#gametype,#name",function(element,event){
	click("#search")
})