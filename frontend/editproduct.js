let id=getget("id")

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

if(weblsget(WEBLSNAME+"permission")<4){
	href("main.html")
}

ajax("GET",AJAXURL+"getproduct/"+id,function(event,data){
	if(data["success"]){
		value("#name",data["data"]["name"])
		value("#tag",data["data"]["tag"])
		value("#price",data["data"]["price"])
		value("#stock",data["data"]["stock"])
		value("#description",data["data"]["description"])
		domgetid("previewImg").src="../backend/upload/productimage/"+data["data"]["imageurl"]
	}else{
		alert("商品不存在或已被刪除")
		href("adminproduct.html")
	}
},null)

// 圖片預覽與拖拉
const imagePreview=document.getElementById("imagePreview")
const productImage=document.getElementById("image")
const previewImg=document.getElementById("previewImg")
const previewText=document.getElementById("previewText")

imagePreview.addEventListener("click",function(){
	productImage.click()
})

imagePreview.addEventListener("dragover",function(e){
	e.preventDefault()
	imagePreview.classList.add("dragover")
})

imagePreview.addEventListener("dragleave",function(e){
	e.preventDefault()
	imagePreview.classList.remove("dragover")
})

imagePreview.addEventListener("drop",function(e){
	e.preventDefault()
	imagePreview.classList.remove("dragover")
	const file=e.dataTransfer.files[0]
	if(file&&file.type.startsWith("image/")){
		productImage.files=e.dataTransfer.files
		showPreview(file)
	}
})

productImage.addEventListener("change",function(e){
	const file=e.target.files[0]
	if(file&&file.type.startsWith("image/")){
		showPreview(file)
	}
})

function showPreview(file){
	const reader=new FileReader()
	reader.onload=function(e){
		previewImg.src=e.target.result
		previewImg.classList.remove("hidden")
		previewText.classList.add("hidden")
	}
	reader.readAsDataURL(file)
}

onsubmit("#form",function(element,event){
	event.preventDefault()

	domgetid("submit").disabled=true

	ajax("PUT",AJAXURL+"editproduct/"+id,function(event,data){
		if(data["success"]){
			alert("修改成功")
			href("adminproduct.html")
		}else{
			innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
			domgetid("submit").disabled=false
		}
	},formdata([
		["name",getvalue("name")],
		["tag",getvalue("tag")],
		["price",getvalue("price")],
		["stock",getvalue("stock")],
		domgetid("image").files[0]?["image",domgetid("image").files[0]]:[],
		["description",getvalue("description")],
	]),[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})