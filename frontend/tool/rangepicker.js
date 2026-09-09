const RANGEPICKERRANKLIST=["A","K","Q","J","T","9","8","7","6","5","4","3","2"]
const RANGEPICKERSTATEKEY=WEBLSNAME+"rangepickerstate"
let rangepickercolor="red"
let rangepickerdrawinged=false

function rangepickerlabel(row,column){
	if(row==column){
		return RANGEPICKERRANKLIST[row]+RANGEPICKERRANKLIST[column]
	}
	if(row<column){
		return RANGEPICKERRANKLIST[row]+RANGEPICKERRANKLIST[column]+"s"
	}
	return RANGEPICKERRANKLIST[column]+RANGEPICKERRANKLIST[row]+"o"
}

function rangepickersave(){
	let colorbyhand={}
	let celllist=document.querySelectorAll(".rangepicker-cell")
	for(let i=0;i<celllist.length;i=i+1){
		let color=celllist[i].getAttribute("data-color")||"none"
		if(color!="none"){
			colorbyhand[celllist[i].getAttribute("data-hand")]=color
		}
	}
	let data={
		"title": domgetid("rangepickertitle").value,
		"colorbyhand": colorbyhand
	}
	weblsset(RANGEPICKERSTATEKEY,JSON.stringify(data))
}

function rangepickerupdate(){
	let selectedlist=[]
	let celllist=document.querySelectorAll('.rangepicker-cell[data-color="red"],.rangepicker-cell[data-color="green"],.rangepicker-cell[data-color="blue"]')
	for(let i=0;i<celllist.length;i=i+1){
		selectedlist.push(celllist[i].getAttribute("data-hand"))
	}
	domgetid("rangepickeroutput").value=selectedlist.join(",")
	let title=String(domgetid("rangepickertitle").value||"").trim()
	innertext("#rangepickertitledisplay",title||"未命名範圍",false)
	rangepickersave()
}

function rangepickerpaint(cell){
	cell.setAttribute("data-color",rangepickercolor)
	rangepickerupdate()
}

function rangepickerload(){
	let raw=weblsget(RANGEPICKERSTATEKEY)
	if(raw){
		try{
			let data=JSON.parse(raw)
			domgetid("rangepickertitle").value=String(data["title"]||"")
			let colorbyhand=data["colorbyhand"]||{}
			let celllist=document.querySelectorAll(".rangepicker-cell")
			for(let i=0;i<celllist.length;i=i+1){
				let hand=celllist[i].getAttribute("data-hand")
				let color=String(colorbyhand[hand]||"none")
				if(["red","green","blue","none"].indexOf(color)<0){
					color="none"
				}
				celllist[i].setAttribute("data-color",color)
			}
		}catch(error){
		}
	}
	rangepickerupdate()
}

const RANGEPICKERGRID=domgetid("rangepickergrid")
for(let row=0;row<13;row=row+1){
	for(let column=0;column<13;column=column+1){
		let hand=rangepickerlabel(row,column)
		let cell=doccreate("div")
		cell.className="rangepicker-cell"
		cell.setAttribute("role","button")
		cell.setAttribute("tabindex","0")
		cell.setAttribute("data-hand",hand)
		cell.setAttribute("data-color","none")
		cell.textContent=hand
		cell.addEventListener("mousedown",function(){
			rangepickerdrawinged=true
			rangepickerpaint(cell)
		})
		cell.addEventListener("mouseenter",function(){
			if(rangepickerdrawinged){
				rangepickerpaint(cell)
			}
		})
		cell.addEventListener("click",function(){
			if(!rangepickerdrawinged){
				rangepickerpaint(cell)
			}
		})
		cell.addEventListener("keydown",function(event){
			if(event.key=="Enter"||event.key==" "){
				event.preventDefault()
				rangepickerpaint(cell)
			}
		})
		RANGEPICKERGRID.appendChild(cell)
	}
}

document.addEventListener("mouseup",function(){
	rangepickerdrawinged=false
})

onclick("#rangepickerpalette .rangepicker-swatch",function(element){
	rangepickercolor=element.getAttribute("data-color")
	let swatchlist=document.querySelectorAll(".rangepicker-swatch")
	for(let i=0;i<swatchlist.length;i=i+1){
		swatchlist[i].classList.remove("active")
	}
	element.classList.add("active")
})

oninput("#rangepickertitle",function(){
	rangepickerupdate()
})

onclick("#rangepickercopy",function(){
	let output=domgetid("rangepickeroutput").value
	if(navigator.clipboard&&navigator.clipboard.writeText){
		navigator.clipboard.writeText(output).then(function(){
			pttoast("已複製範圍","success")
		})
	}else{
		domgetid("rangepickeroutput").select()
		document.execCommand("copy")
		pttoast("已複製範圍","success")
	}
})

onclick("#rangepickerexport",function(){
	let data=weblsget(RANGEPICKERSTATEKEY)||"{}"
	let blob=new Blob([data],{ "type": "application/json" })
	let link=doccreate("a")
	let title=String(domgetid("rangepickertitle").value||"poker-range").trim()||"poker-range"
	link.href=URL.createObjectURL(blob)
	link.download=title+".poker"
	link.click()
	URL.revokeObjectURL(link.href)
})

onclick("#rangepickerimport",function(){
	domgetid("rangepickerfile").click()
})

onchange("#rangepickerfile",function(element){
	if(element.files&&element.files[0]){
		let reader=new FileReader()
		reader.addEventListener("load",function(event){
			try{
				let data=JSON.parse(event.target.result)
				if(data&&typeof data=="object"){
					weblsset(RANGEPICKERSTATEKEY,JSON.stringify(data))
					rangepickerload()
				}
			}catch(error){
				pttoast("配置格式無效","error")
			}
		})
		reader.readAsText(element.files[0])
	}
})

onclick("#rangepickerclear",function(){
	ptconfirm("確定清除所有標記與標題？",function(ok){
		if(ok){
			weblsset(RANGEPICKERSTATEKEY,"{}")
			domgetid("rangepickertitle").value=""
			let celllist=document.querySelectorAll(".rangepicker-cell")
			for(let i=0;i<celllist.length;i=i+1){
				celllist[i].setAttribute("data-color","none")
			}
			rangepickerupdate()
		}
	})
})

rangepickerload()
