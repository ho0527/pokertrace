/*
	製作人員: 賀皓群(小賀) / dc: chris0527 / line: ho960527 / email: chris960527ho@gmail.com / 電話: 0906585605

		|-------    -----    -                     -     -----  -----  -----   -------|
	   |-------    -        -            - - -          -                     -------|
	  |-------    -        -------    -          -     -----    --       --  -------|
	 |-------    -        -     -    -          -         -      --     --  -------|
	|-------    -----    -     -    -          -     -----         -----  -------|

	無授權禁止拷貝使用!
*/

let page=1
let pageproductcount=12

function updatecart(){
	ajax("GET",AJAXURL+"getcart",function(event,data){
		if(data["success"]){
			let row=data["data"]

			innertext("#cartcount",0<row.length?row.length:"",false)

			for(let i=0;i<row.length;i=i+1){
				innerhtml("#cartmain",`
					<div class="notification-item p-4 border-b border-gray-100 hover:bg-gray-50">
						<div class="flex items-start">
							<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
								<img src="../backend/upload/productimage/${row[i]["imageurl"]}" alt="商品圖" class="w-full h-full object-cover rounded-full">
							</div>
							<div class="flex justify-between w-full">
								<div>
									<h4 class="font-medium text-gray-800 text-sm">${row[i]["name"]}</h4>
									<p class="text-gray-600 text-xs mt-1">${row[i]["description"]}</p>
								</div>
								<p class="text-gray-400 text-xs mt-1">
									x${row[i]["count"]}
								</p>
							</div>
						</div>
					</div>
				`)
			}

			onclick("#cart",function(element,event){
				domgetid("cartdiv").classList.toggle("hidden")
			})

			document.addEventListener("click",function(event){
				if(!event.target.closest("#cart")&&!event.target.closest("#cartdiv")){
					addclass("#cartdiv",["hidden"])
				}
			})
		}
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

if(weblsget(WEBLSNAME+"signin")){
	innerhtml("#headerlink",`
		<a href="main.html" class="text-gray-700 hover:text-blue-600">個人資料</a>
		<button class="relative" id="cart">
			<i class="fas fa-shopping-cart text-xl text-gray-700"></i>
			<span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1" id="cartcount"></span>
		</button>
	`,false)

	updatecart()
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

			let totalpage=Math.ceil(tempproduct.length/pageproductcount)

			if(totalpage<page){ page=totalpage }
			if(page<1){ page=1 }

			let start=(page-1)*pageproductcount
			let end=start+pageproductcount
			let showproduct=tempproduct.slice(start,end)

			innerhtml("#main",``,false)

			for(let i=0;i<showproduct.length;i=i+1){
				innerhtml("#main",`
					<div class="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col h-[300px]">
						<img src="../backend/upload/productimage/${showproduct[i]["imageurl"]}" alt="商品圖" class="rounded-lg mb-3 object-cover h-40">
						<h3 class="font-bold text-lg text-gray-800 mb-1">${showproduct[i]["name"]}</h3>
						<p class="text-gray-600 text-sm mb-2">${showproduct[i]["description"]}</p>
						<div class="flex items-center justify-between mt-auto">
							<span class="text-blue-600 font-bold text-xl">NT$${showproduct[i]["price"].toLocaleString()}</span>
							<div>
								<button class="addcart bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-lg transition-colors" data-id="${showproduct[i]["id"]}">
									<i class="fas fa-cart-plus mr-1"></i>加入購物車
								</button>
							</div>
						</div>
					</div>
				`)
			}

			let pagehtml=`
				<button class="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 cursor-pointer" data-page="${page-1}" aria-label="Previous"><i class="fas fa-chevron-left"></i></buttton>
			`

			for(let i=1;i<=totalpage;i=i+1){
				pagehtml=`
					${pagehtml}
					<button class="px-3 py-2 border-t border-b border-gray-300 ${i==page?"text-blue-600 font-bold":"text-gray-700"} bg-white hover:bg-blue-50 cursor-pointer" data-page="${i}">${i}</buttton>
				`
			}

			pagehtml=`
				${pagehtml}
				<button class="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 cursor-pointer" data-page="${page+1}" aria-label="Next">
					<i class="fas fa-chevron-right"></i>
				</buttton>
			`

			innerhtml("#pagination",pagehtml,false)

			onclick("#pagination button",function(element,event){
				event.preventDefault()
				page=int(dataset(element,"page"))
				main()
			})

			onclick(".addcart",function(element,event){
				ajax("POST",AJAXURL+"addcart/"+dataset(element,"id"),function(event,data){
					if(data["success"]){
						href("")
					}else{
						if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
							alert("請先登入再訂購商品")
							href("signin.html")
						}else{
							alert(ERRORLIST[data["data"]]||"未知錯誤")
						}
					}
				},null,[
					["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
				])
			})
		}

		innerhtml("#tagdiv",`
			<input type="button" class="tag bg-blue-100 text-blue-700 px-3 py-1 rounded-full whitespace-nowrap cursor-pointer" data-tag="全部" value="全部">
		`,false)

		for(let i=0;i<taglist.length;i=i+1){
			innerhtml("#tagdiv",`
				<input type="button" class="tag bg-gray-100 text-gray-700 px-3 py-1 rounded-full whitespace-nowrap cursor-pointer" data-tag="${taglist[i]}" value="${taglist[i]}">
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
},null,[])