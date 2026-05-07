let sessionid=getget("sessionid")

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

// 桌次連動功能
let linkedtable=[]
let linkedTableCounter=1

function renderLinkedTable(){
	let html=``

	linkedtable.forEach((table,index) => {
		html=html+`
			<tr class="border-b border-zinc-700">
				<td class="px-3 py-2"><input type="text" class="w-20 bg-zinc-700 text-white rounded px-2 py-1" value="${table.level}" data-index="${index}" data-field="level"></td>
				<td class="px-3 py-2"><input type="number" class="w-20 bg-zinc-700 text-white rounded px-2 py-1" value="${table.smallblind}" data-index="${index}" data-field="smallblind"></td>
				<td class="px-3 py-2"><input type="number" class="w-20 bg-zinc-700 text-white rounded px-2 py-1" value="${table.bigblind}" data-index="${index}" data-field="bigblind"></td>
				<td class="px-3 py-2">
					<input type="number" class="w-20 bg-zinc-700 text-white rounded px-2 py-1" value="${table.bigblindante}" data-index="${index}" data-field="bigblindante">,
					<input type="number" class="w-20 bg-zinc-700 text-white rounded px-2 py-1" value="${table.ante}" data-index="${index}" data-field="ante">
				</td>
				<td class="px-3 py-2"><input type="time" class="bg-zinc-700 text-white rounded px-2 py-1" value="${table.starttime}" data-index="${index}" data-field="starttime"></td>
				<td class="px-3 py-2"><input type="time" class="bg-zinc-700 text-white rounded px-2 py-1" value="${table.endtime}" data-index="${index}" data-field="endtime"></td>
				<td class="px-3 py-2 text-center">
					<button type="button" class="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm" onclick="deleteLinkedTable(${index})">刪除</button>
				</td>
			</tr>
		`
	})

	domgetid("linkedtable").innerHTML=html

	// 更新特定欄位值而不重新渲染整個表格
	function updateFieldValue(index,field,value){
		let inputs=domgetid("linkedtable").querySelectorAll(`input[data-index="${index}"][data-field="${field}"]`)
		inputs.forEach(input => {
			if(input !== document.activeElement){
				input.value=value
			}
		})
	}

	// 綁定輸入事件 - 即時更新 linkedtable
	domgetid("linkedtable").querySelectorAll("input").forEach(input => {
		input.addEventListener("input",function(){
			let index=parseInt(this.dataset.index)
			let field=this.dataset.field
			let value=this.value

			// 根據欄位類型進行轉換和聯動更新
			if(field=="level"){
				linkedtable[index][field]=value
			}else if(field=="smallblind"){
				// 修改小盲時，大盲 = 小盲 * 2
				let smallblindValue=parseInt(value) || 0
				linkedtable[index].smallblind=smallblindValue
				linkedtable[index].bigblind=smallblindValue * 2
				updateFieldValue(index,"bigblind",linkedtable[index].bigblind)
				updateFieldValue(index,"bigblindante",linkedtable[index].bigblind)
			}else if(field=="bigblind"){
				// 修改大盲時：
				// 1. 更新大盲前注 = 大盲
				// 2. 如果有下一個，下一個的小盲 = 該大盲
				let bigblindValue=parseInt(value) || 0
				linkedtable[index].bigblind=bigblindValue
				linkedtable[index].bigblindante=bigblindValue
				updateFieldValue(index,"bigblindante",linkedtable[index].bigblindante)

				if(index+1 < linkedtable.length){
					linkedtable[index+1].smallblind=bigblindValue
					linkedtable[index+1].bigblind=bigblindValue * 2
					linkedtable[index+1].bigblindante=bigblindValue * 2
					updateFieldValue(index+1,"smallblind",linkedtable[index+1].smallblind)
					updateFieldValue(index+1,"bigblind",linkedtable[index+1].bigblind)
					updateFieldValue(index+1,"bigblindante",linkedtable[index+1].bigblind)
				}
			}else if(field=="bigblindante" || field=="ante"){
				linkedtable[index][field]=parseInt(value) || 0
			}else if(field=="starttime"){
				linkedtable[index].starttime=value
			}else if(field=="endtime"){
				// 修改結束時間時，如果有下一個，下一個的開始時間 = 該結束時間
				linkedtable[index].endtime=value

				if(index+1 < linkedtable.length){
					linkedtable[index+1].starttime=value
					updateFieldValue(index+1,"starttime",linkedtable[index+1].starttime)
				}
			}
		})

		// 也綁定 change 事件以確保失去焦點時也會更新
		input.addEventListener("change",function(){
			let index=parseInt(this.dataset.index)
			let field=this.dataset.field
			let value=this.value

			if(field=="level"){
				linkedtable[index][field]=value
			}else if(field=="smallblind"){
				let smallblindValue=parseInt(value) || 0
				linkedtable[index].smallblind=smallblindValue
				linkedtable[index].bigblind=smallblindValue * 2
				updateFieldValue(index,"bigblind",linkedtable[index].bigblind)
				updateFieldValue(index,"bigblindante",linkedtable[index].bigblind)
			}else if(field=="bigblind"){
				let bigblindValue=parseInt(value) || 0
				linkedtable[index].bigblind=bigblindValue
				linkedtable[index].bigblindante=bigblindValue
				updateFieldValue(index,"bigblindante",linkedtable[index].bigblindante)

				if(index+1<linkedtable.length){
					linkedtable[index+1].smallblind=bigblindValue
					linkedtable[index+1].bigblind=bigblindValue * 2
					linkedtable[index+1].bigblindante=bigblindValue * 2
					console.log(linkedtable)
					updateFieldValue(index+1,"smallblind",linkedtable[index+1].smallblind)
					updateFieldValue(index+1,"bigblind",linkedtable[index+1].bigblind)
					updateFieldValue(index+1,"bigblindante",linkedtable[index+1].bigblind)
				}
			}else if(field=="bigblindante" || field=="ante"){
				linkedtable[index][field]=parseInt(value) || 0
			}else if(field=="starttime"){
				linkedtable[index].starttime=value
			}else if(field=="endtime"){
				linkedtable[index].endtime=value

				if(index+1 < linkedtable.length){
					linkedtable[index+1].starttime=value
					updateFieldValue(index+1,"starttime",linkedtable[index+1].starttime)
				}
			}
		})
	})
}

window.addLinkedTable=function(){
	let lastTable=linkedtable[linkedtable.length - 1]

	linkedtable.push({
		id: linkedTableCounter,
		level: `LV${linkedTableCounter}`,
		smallblind: lastTable ? lastTable.bigblind : 100,
		bigblind: lastTable ? lastTable.bigblind * 2 : 200,
		bigblindante: lastTable ? lastTable.bigblind * 2 : 200,
		ante: 0,
		starttime: lastTable ? lastTable.endtime : "19:00",
		endtime: "23:30"
	})
	linkedTableCounter=linkedTableCounter+1
	renderLinkedTable()
}

window.deleteLinkedTable=function(index){
	linkedtable.splice(index,1)
	renderLinkedTable()
}

onchange("#linked",function(element,event){
	if(element.checked){
		domgetid("normal").style.display="none"
		domgetall(".tablelinked")[0].style.display="block"
		if(linkedtable.length==0){
			addLinkedTable()
		}else{
			renderLinkedTable()
		}
	}else{
		domgetid("normal").style.display="block"
		domgetall(".tablelinked")[0].style.display="none"
	}
})

// 初始化隱藏桌次連動表格
domgetall(".tablelinked")[0].style.display="none"

onclick("#back",function(element,event){
	href("session.html?id="+sessionid+"#1")
})

ajax("GET",AJAXURL+"getsession/"+sessionid,function(event,data){
	if(data["success"]){
		let row=data["data"]

		value("#name",row["name"],false)
		value("#chip",row["chip"],false)
		value("#date",row["starttime"].split("T")[0],false)
		value("#starttime",row["starttime"].split("T")[1].split(":00Z")[0],false)
		value("#endtime",row["endtime"].split("T")[1].split(":00Z")[0],false)
	}else{
		alert("查無指定牌桌")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

value("#date",new Date().toISOString().split("T")[0])

onclick("#back",function(element,event){
	href("session.html?id="+sessionid+"#1")
})

onsubmit("#form",function(element,event){
	let timezone="+00:00"

	event.preventDefault()

	domgetid("submit").disabled=true

	ajax("POST",AJAXURL+"newtable/"+sessionid,function(event,data){
		if(data["success"]){
			alert("新增成功")
			href("session.html?id="+sessionid+"#1")
		}else{
			innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
			domgetid("submit").disabled=false
		}
	},str(domgetid("linked").checked?({
		"linked": true,
		"name": getvalue("name"),
		"chip": float(getvalue("chip")),
		"date": getvalue("date"),
		"tablelist": linkedtable
	}):({
		"linked": false,
		"name": getvalue("name"),
		"smallblind": int(getvalue("smallblind")),
		"bigblind": int(getvalue("bigblind")),
		"bigblindante": int(getvalue("bigblindante")),
		"ante": int(getvalue("ante")),
		"chip": float(getvalue("chip")),
		"starttime": `${getvalue("date")} ${getvalue("starttime")}${timezone}`,
		"endtime": `${getvalue("date")} ${getvalue("endtime")}${timezone}`
	})),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})