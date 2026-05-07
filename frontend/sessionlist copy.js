if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

ajax("GET",AJAXURL+"getsessionlist",function(event,data){
	if(data["success"]){
		let row=data["data"]
		let totalprofit=0

		function main(){
			let date=getvalue("date")
			let club=getvalue("club")
			let gametype=getvalue("gametype")
			let count=0

			innerhtml("#tablemain",``,false)

			for(let i=0;i<row.length;i=i+1){
				let winprice=row[i]["winprice"]-(row[i]["buyin"]+(row[i]["rebuybuyin"]*row[i]["rebuycount"]))
				totalprofit=totalprofit+winprice

				if(!((date&&0!=row[i]["starttime"].split("T")[0].localeCompare(date))||(club&&-1==row[i]["clubname"].indexOf(club))||(gametype&&"all"!=gametype&&gametype!=row[i]["gametype"]))){
					innerhtml("#tablemain",`
						<tr class="hover:bg-zinc-700 transition cursor-pointer" onclick="location='session.html?id=${row[i]["id"]}'">
							<td class="py-2 px-2">${count+1}</td>
							<td>${row[i]["starttime"].split("T")[0]} ${row[i]["starttime"].split("T")[1].split(":00Z")[0]}</td>
							<td>${row[i]["name"]}</td>
							<td>${row[i]["buyin"]}${(row[i]["buyin"]!=row[i]["rebuybuyin"])?("/"+row[i]["rebuybuyin"]):""}</td>
							<td class="${0<=winprice?"text-green-400":"text-red-400"} font-bold">${0<=winprice?"+":""}${winprice}</td>
							<td>
								<a href="editsession.html?id=${row[i]["id"]}" class="text-blue-400 hover:underline">編輯</a>
								<input type="button" class="text-red-400 hover:underline deletesession" data-id="${row[i]["id"]}" value="刪除">
							</td>
						</tr>
					`)

					count=count+1
				}
			}

			innertext("#gamecount",row.length,false)
			innertext("#profit",`${0<=totalprofit?"+":""}${totalprofit}`,false)
			style("#profit",[
				["color",0<=totalprofit?"#34d399":"#f87171"]
			])

			onclick(".deletesession",function(element,event){
				if(confirm("確定刪除?")){
					event.preventDefault()
					event.stopPropagation()

					element.disabled=true

					ajax("DELETE",AJAXURL+"deletesession/"+dataset(element,"id"),function(event,data){
						if(data["success"]){
							alert("刪除成功")
							element.parentElement.parentElement.remove()
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
		alert("權杖已失效，請重新登入")
		weblsset(WEBLSNAME+"signin",null)
		weblsset(WEBLSNAME+"token",null)
		weblsset(WEBLSNAME+"userid",null)
		weblsset(WEBLSNAME+"permission",null)
		weblsset(WEBLSNAME+"name",null)
		href("signin.html")
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
		alert("權限已失效,請重新登入")
		weblsset(WEBLSNAME+"signin",null)
		weblsset(WEBLSNAME+"token",null)
		href("signin.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])