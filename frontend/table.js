let id=getget("id")
let timezone="+00:00"
let seatlog=[]
let date=""
let buyin=0
let chip=0
let seatdata=[
	{ seat: 1, history: [] },
	{ seat: 2, history: [] },
	{ seat: 3, history: [] },
	{ seat: 4, history: [] },
	{ seat: 5, history: [] },
	{ seat: 6, history: [] },
	{ seat: 7, history: [] },
	{ seat: 8, history: [] },
	{ seat: 9, history: [] }
]
let seatsetting={
	2: ["SB","BB"],
	3: ["SB","BB","BTN"],
	4: ["SB","BB","UTG","BTN"],
	5: ["SB","BB","UTG","CO","BTN"],
	6: ["SB","BB","UTG","MP","CO","BTN"],
	7: ["SB","BB","UTG","MP","HJ","CO","BTN"],
	8: ["SB","BB","UTG","MP","MP+1","HJ","CO","BTN"],
	9: ["SB","BB","UTG","UTG+1","MP","MP+1","HJ","CO","BTN"],
	10: ["SB","BB","UTG","UTG+1","UTG+2","MP","MP+1","HJ","CO","BTN"]
}
let tabBtns=document.querySelectorAll('.tab-btn');
let tabContents=document.querySelectorAll('.tab-content');

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}


// 安全取得相對座位名稱
function getseatnameforhand(seatCount, dealerSeat, playerSeat) {
    if (!seatCount || seatCount < 2) return ""; // 防護：至少 2 個座位才有意義
    const mapping = seatsetting[seatCount];
    if (!mapping) return ""; // seatsetting 裡沒有該座位數的 mapping

    // 將 1-based 轉為 0-based index
    const dealerIdx = (dealerSeat - 1);
    const playerIdx = (playerSeat - 1);

    // 計算相對位置 (0 .. seatCount-1)
    const relative = (playerIdx - dealerIdx + seatCount) % seatCount;

    // 直接回傳 mapping 的 relative 索引
    return mapping[relative] || "";
}

ajax("GET",AJAXURL+"gettable/"+id,function(event,data){
	if(data["success"]){
		let row=data["data"]
		let seatcount=1
		let seat=[null]

		date=row["starttime"].split("T")[0]
		buyin=row["buyin"]
		chip=row["chip"]
		seatdata=row["seating"]

		renderPlayerTable(row["maxseat"])
		document.getElementById('maxseat').addEventListener('change',function(){
			renderPlayerTable(parseInt(this.value))
		})

		// 初始化最大座位與莊家
		renderSeatEventTable(row["maxseat"])
		document.getElementById("maxseat").addEventListener("change",function(){
			// 補 seatdata 長度
			const n=parseInt(this.value)
			while(seatdata.length<n) {
				seatdata.push({ seat: seatdata.length+1,history: [] })
			}
			renderSeatEventTable(n)
		})

		value("#firstdealerplace",row["firstdealerplace"]!=""?row["firstdealerplace"]:1,false)
		value("#selfseating",row["selfseating"]!=""?row["selfseating"]:1,false)

		for(let i=0;i<seatdata.length-1;i=i+1){
			if(seatdata[i]&&seatdata[i]["history"]&&seatdata[i]["history"].length!=0&&seatdata[i]["history"][seatdata[i]["history"].length-1]&&seatdata[i]["history"][seatdata[i]["history"].length-1]["type"]!="leave"){
				seat.push(true)
				seatcount=seatcount+1
			}else{
				seat.push(false)
			}
		}

		console.log(seatcount)
		console.log(seat)

		innerhtml("#tabletoken",row["token"],false)
		innerhtml("#date",date,false)
		innerhtml("#info",`
			<div><span class="text-zinc-400">地點：</span>${row["clubname"]}</div>
			<div><span class="text-zinc-400">遊戲類型：</span>${TRANSLATE["zhtw"]["gametype"][row["gametype"]]}</div>
			<div><span class="text-zinc-400">小盲/大盲：</span>${row["smallblind"]}/${row["bigblind"]}</div>
			<div><span class="text-zinc-400">大盲前注,前注：</span>(${row["bigblindante"]},${row["ante"]})</div>
			<div><span class="text-zinc-400">買入：</span>${row["buyin"]}${(row["buyin"]!=row["rebuybuyin"])?("/"+row["rebuybuyin"]):""}</div>
			<div><span class="text-zinc-400">開始：</span>${row["starttime"].split("T")[1].split(":00Z")[0]}</div>
			<div><span class="text-zinc-400">結束：</span>${row["endtime"].split("T")[1].split(":00Z")[0]}</div>
			<div><span class="text-zinc-400">名次：</span>${row["place"]} / ${row["totalbuyin"]}</div>
		`)
		innerhtml("#description",row["description"],false)
		value("#maxseat",row["maxseat"],false)

		innerhtml("#handtable",``,false)
		for(let i=0;i<row["hand"].length;i=i+1){
			let winprice=row["hand"][i]["chipchange"]
			innerhtml("#handtable",`
				<tr class="handtr hover:bg-zinc-700 transition cursor-pointer">
					<td class="py-2 px-2">${i+1}</td>
					<td>${getseatnameforhand(seatcount, row["hand"][i]["dealerseat"], row["hand"][i]["selfseating"])}</td>
					<td>${json(row["hand"][i]["handcard"])["card1"]} ${json(row["hand"][i]["handcard"])["card2"]}</td>
					<!-- <td>加注-跟注-下注-棄牌</td> -->
					<td class="${0<=winprice?"text-green-400":"text-red-400"} font-bold">${0<=winprice?"+":""}${winprice}</td>
					<!-- <td>★</td> -->
				</tr>
			`)
		}

		let datalabel=[]

		for(let i=0;i<row["ev"]["actual"].length;i=i+1){
			datalabel.push(i+1)
		}

		// 頁籤切換
		tabBtns.forEach(btn =>{
			btn.addEventListener('click',() =>{
				tabBtns.forEach(b => b.classList.remove('border-emerald-400','text-emerald-400'));
				btn.classList.add('border-emerald-400','text-emerald-400');
				const tab=btn.getAttribute('data-tab');
				tabContents.forEach(tc => tc.classList.add('hidden'));
				document.getElementById('tab-'+tab).classList.remove('hidden');
				href("#"+dataset(btn,"id"))
				if(tab=="ev"){
					let mychart=echarts.init(domgetid("evChart"))
					let option={
						"tooltip": { trigger: "axis" },
						"xAxis": { type: "category",data: datalabel },
						"yAxis": { type: "value" },
						"series": [{
							name: "盈虧",
							type: "line",
							smooth: true,
							data: row["ev"]["actual"],
							areaStyle: {
								color: "#22d3ee",
								opacity: 0.2
							},
							lineStyle: { color: "#22d3ee" },
							itemStyle: { color: "#22d3ee" }
						}]
					}
					mychart.setOption(option)
				}
			})
		})

		// 預設顯示第一個頁籤
		document.querySelectorAll('.tab-btn')[location.hash.substring(1)!=""?location.hash.substring(1):0].click()

		onclick("#back",function(element,event){
			href("session.html?id="+row["sessionid"]+"#1")
		})
	}else{
		alert("查無指定場次")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

onsubmit("#settingform",function(element,event){
	event.preventDefault()

	domgetid("save").disabled=true

	ajax("PUT",AJAXURL+"edittablesetting/"+id,function(event,data){
		if(data["success"]){
			alert("儲存成功")
			// href("table.html")
			domgetid("save").disabled=false
		}else{
			// innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
			alert("error")
			domgetid("save").disabled=false
		}
	},str({
		"maxseat": getvalue("maxseat"),
		"firstdealerplace": getvalue("firstdealerplace"),
		"selfseating": getvalue("selfseating")
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
})

domgetid("newhead").href="newhead.html?tableid="+id

// 玩家頁籤動態座位與莊家設定
function renderPlayerTable(maxSeat=9){
	const tbody=document.getElementById("seat-event-table-body")
	const dealerSelect=document.getElementById("firstdealerplace")
	const selfseating=document.getElementById("selfseating")
	tbody.innerHTML=""
	dealerSelect.innerHTML=""
	selfseating.innerHTML=""
	// 假資料
	const playerData=[
		{ seat: 1,name: "Hero",join: true,status: "" },
		{ seat: 2,name: "玩家B",join: true,status: "中途加入" },
		{ seat: 3,name: "",join: false,status: "" },
		{ seat: 4,name: "玩家D",join: true,status: "重新買入" },
		{ seat: 5,name: "",join: false,status: "" },
		{ seat: 6,name: "",join: false,status: "" },
		{ seat: 7,name: "",join: false,status: "" },
		{ seat: 8,name: "",join: false,status: "" },
		{ seat: 9,name: "",join: false,status: "" },
	];
	for(let i=1;i<=maxSeat;i++){
		const p=playerData[i-1] ||{ seat: i,name: "",join: false,status: "" }
		const tr=document.createElement('tr');
		tr.innerHTML=`
			<td class="py-2 px-2">${i}</td>
			<td><input type="text" class="bg-zinc-700 text-white rounded px-2 py-1 w-24 sm:w-32" value="${p.name}" placeholder="未命名"></td>
			<td><input type="checkbox" ${p.join?'checked':''}></td>
			<td>
			<select class="bg-zinc-700 text-white rounded px-2 py-1">
				<option value="">-</option>
				<option ${p.status=='中途加入'?'selected':''}>中途加入</option>
				<option ${p.status=='重新買入'?'selected':''}>重新買入</option>
			</select>
			</td>
			<td><button class="text-blue-400 hover:underline">換桌</button></td>
		`
		tbody.appendChild(tr)

		// 莊家選單
		const opt=document.createElement('option')
		opt.value=i
		opt.textContent=`${i}號位`
		dealerSelect.appendChild(opt)
		selfseating.appendChild(opt)
	}
	dealerSelect.value=1
	selfseating.value=1
}

function renderSeatEventTable(maxSeat=9){
	const tbody=document.getElementById('seat-event-table-body');
	const dealerSelect=document.getElementById('firstdealerplace');
	const selfseating=document.getElementById('selfseating');
	tbody.innerHTML='';
	dealerSelect.innerHTML='';
	selfseating.innerHTML='';
	for(let i=1;i<=maxSeat;i++){
		const seat=seatdata[i-1] ||{ seat: i,history: [] };
		// 事件流內容
		let historyHtml='';
		if(seat.history.length==0){
			historyHtml='<div class="text-zinc-500">無紀錄</div>';
		} else{
			historyHtml=seat.history.map((h,idx) => `
				<div class="flex flex-wrap gap-2 items-center text-xs mb-1">
					<span class="rounded bg-zinc-700 px-2 py-0.5">${TRANSLATE["zhtw"]["seatingtype"][h["type"]]}</span>
					<span>${h.player?h.player:''}</span>
					<span>${h["time"].includes("T")?h["time"].split("T")[1].split("Z")[0]:h["time"]}</span>
					${h.buyin?`<span class="text-red-400">${h.buyin}</span>`:''}
					${h.chip?`起始籌碼 <span class="text-emerald-400">${h.chip}</span>`:''}
					<button class="text-red-400 hover:underline" onclick="removeSeatEvent(this,${i-1},${idx})" data-id="${h["id"]}">刪除</button>
				</div>
			`).join('');
		}
		// 新增事件表單
		const addForm=`
			<form onsubmit="addSeatEvent(event,${i-1})" class="flex flex-wrap gap-2 items-center mt-2">
				<select class="bg-zinc-700 text-white rounded px-2 py-1 text-xs" id="seatingtype_${i-1}">
					<option value="buyin">買入</option>
					<option value="rebuy">重新買入</option>
					<option value="leave">離席</option>
				</select>
				<input type="text" class="bg-zinc-700 text-white rounded px-2 py-1 text-xs w-20" id="seatingname_${i-1}" placeholder="玩家">
				<input type="time" class="bg-zinc-700 text-white rounded px-2 py-1 text-xs w-25" id="seatingtime_${i-1}" step="1" value="${new Date().toTimeString().split(" ")[0]}">
				<input type="number" class="bg-zinc-700 text-white rounded px-2 py-1 text-xs w-20" id="seatingbuyin_${i-1}" placeholder="買入費" value="${buyin}">
				<input type="number" class="bg-zinc-700 text-white rounded px-2 py-1 text-xs w-20" id="seatingchip_${i-1}" placeholder="起始籌碼" value="${chip}">
				<button type="submit" class="bg-emerald-500 hover:bg-emerald-600 text-white rounded px-2 py-1 text-xs" id="newseatingbutton_${i}">新增</button>
			</form>
		`
		const tr=document.createElement("tr")
		tr.innerHTML=`
			<td class="py-2 px-2 align-top">${i}</td>
			<td class="py-2 px-2 align-top">${historyHtml}${addForm}</td>
			<!-- <td class="py-2 px-2 align-top"><button class="text-blue-400 hover:underline" onclick="alert('換桌功能僅示意')">換桌</button></td> -->
		`
		tbody.appendChild(tr);

		// 莊家選單
		const opt=document.createElement("option");
		const opt1=document.createElement("option");
		opt.value=i;
		opt1.value=i;
		opt.textContent=`${i}號位`;
		opt1.textContent=`${i}號位`;
		dealerSelect.appendChild(opt);
		selfseating.appendChild(opt1);
	}
}

// 新增事件
function addSeatEvent(event,seatid){
	event.preventDefault()

	let seatno=seatid+1
	let type=getvalue("seatingtype_"+(seatid))
	let name=getvalue("seatingname_"+(seatid))
	let time=getvalue("seatingtime_"+(seatid))
	let buyin=float(getvalue("seatingbuyin_"+(seatid)))
	let chip=float(getvalue("seatingchip_"+(seatid)))

	// if(!time){
	// 	alert("請輸入玩家時間")
	// 	return
	// }
	if(!name&&(type=="buyin"||type=="rebuy")){
		alert("請輸入玩家名稱")
		return
	}
	// if((type=="buyin"||type=="rebuy")&&!buyin){
	// 	alert("請輸入買入金額")
	// 	return
	// }
	if((type=="buyin"||type=="rebuy")&&!chip){
		alert("請輸入起始籌碼")
		return
	}

	ajax("POST",AJAXURL+"newseating/"+id+"/"+(seatno),function(event,data){
		if(data["success"]){
			domgetid("newseatingbutton_"+(seatno)).disabled=false

			seatdata[seatid].history.push({ "id": data["data"],type,"player": name,time,buyin,chip })
			renderSeatEventTable(parseInt(getvalue("maxseat")))
		}else{
			domgetid("newseatingbutton_"+(seatno)).disabled=false
		}
	},str({
		"type": type,
		"name": name,
		"time": `${date} ${time}${timezone}`,
		"buyin": buyin,
		"chip": chip
	}),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	])
}

// 刪除事件
function removeSeatEvent(element,seatIdx,eventIdx){
	if(confirm("確定刪除?")){
		element.disabled=true

		ajax("DELETE",AJAXURL+"deleteseating/"+dataset(element,"id"),function(event,data){
			if(data["success"]){
				seatdata[seatIdx].history.splice(eventIdx,1)
				renderSeatEventTable(parseInt(getvalue("maxseat")))
			}else{
				alert("error")
				element.disabled=false
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	}
}