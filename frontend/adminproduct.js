if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

if(weblsget(WEBLSNAME+"permission")<4){
	href("main.html")
}

ajax("GET",AJAXURL+"getproductlist",function(event,data){
	if(data["success"]){
		let product=data["data"]["data"]
		let taglist=data["data"]["tag"]
		let tag="全部"


		function main(){
			let tempproduct=[...product]

			tempproduct=tempproduct.filter(function(item){
				return item["name"].includes(getvalue("keyword"))||item["description"].includes(getvalue("keyword"))
			})

			if(tag!="全部"){
				tempproduct=tempproduct.filter(function(item){
					return item["tag"]==tag
				})
			}

			innerhtml("#main",``,false)

			for(let i=0;i<tempproduct.length;i=i+1){
				innerhtml("#main",`
					<div class="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col h-[300px]">
						<img src="../backend/upload/productimage/${tempproduct[i]["imageurl"]}" alt="商品圖" class="rounded-lg mb-3 object-cover h-40">
						<h3 class="font-bold text-lg text-gray-800 mb-1">${tempproduct[i]["name"]}</h3>
						<p class="text-gray-600 text-sm mb-2">${tempproduct[i]["description"]}</p>
						<div class="flex items-center justify-between mt-auto">
							<span class="text-blue-600 font-bold text-xl">NT$${tempproduct[i]["price"].toLocaleString()}</span>
							<div>
								<input type="button" class="productedit bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-lg transition-colors cursor-pointer" data-id="${tempproduct[i]["id"]}" value="修改">
								<input type="button" class="productdelete bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg transition-colors cursor-pointer" data-id="${tempproduct[i]["id"]}" value="刪除">
							</div>
						</div>
					</div>
				`)
			}

			onclick(".productedit",function(element,event){
				href("editproduct.html?id="+dataset(element,"id"))
			})

			onclick(".productdelete",function(element,event){
				if(confirm("確定要刪除此商品嗎？")){
					ajax("DELETE",AJAXURL+"deleteproduct/"+dataset(element,"id"),function(event,data){
						if(data["success"]){
							alert("刪除成功")
							href("")
						}else{
							alert(ERRORLIST[data["data"]]||"未知錯誤")
						}
					},null,[
						["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
					])
				}
			})
		}

		innerhtml("#tagdiv",`
			<input type="button" class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full whitespace-nowrap" data-tag="全部" value="全部">
		`,false)

		for(let i=0;i<taglist.length;i=i+1){
			innerhtml("#tagdiv",`
				<input type="button" class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full whitespace-nowrap" data-tag="${taglist[i]}" value="${taglist[i]}">
			`)
		}

		onclick(".tag",function(element,event){
			removeclass(".tag",["bg-blue-100","text-blue-700"])
			addclass(".tag",["bg-gray-100","text-gray-700"])
			removeclass(element,["bg-gray-100","text-gray-700"])
			addclass(element,["bg-blue-100","text-blue-700"])

			tag=dataset(element,"tag")
			main()
		})

		oninput("#keyword",function(element,event){
			main()
		})

		main()
	}else{
		alert("無法取得商品列表，請稍後再試")
	}
},null)