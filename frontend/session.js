let sessionid=getget("id")
let tablelinked=false

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

ajax("GET",AJAXURL+"getsession/"+sessionid,function(event,data){
	if(data["success"]){
		let row=data["data"]
		let winprice=row["winprice"]-(row["buyin"]+(row["rebuybuyin"]*row["rebuycount"]))
		tablelinked=row["tablelinked"]

		innerhtml("#sessiontoken",row["token"],false)
		innerhtml("#info",`
			<div><span class="text-zinc-400">地點：</span>${row["clubname"]}</div>
			<div><span class="text-zinc-400">遊戲類型：</span>${TRANSLATE["zhtw"]["gametype"][row["gametype"]]}</div>
			<div><span class="text-zinc-400">買入：</span>${row["buyin"]}${(row["buyin"]!=row["rebuybuyin"])?("/"+row["rebuybuyin"]):""}</div>
			<div><span class="text-zinc-400">手牌數：</span>${"待開發(b1)"}</div>
			<div><span class="text-zinc-400">日期：</span>${row["starttime"].split("T")[0]}</div>
			<div><span class="text-zinc-400">開始：</span>${row["starttime"].split("T")[1].split(":00Z")[0]}</div>
			<div><span class="text-zinc-400">結束：</span>${row["endtime"].split("T")[1].split(":00Z")[0]}</div>
			<div><span class="text-zinc-400">盈虧：</span><span class="${0<=winprice?"text-green-400":"text-red-400"} font-bold">${0<=winprice?"+":""}${winprice}</span></div>
			<div><span class="text-zinc-400">名次：</span>${row["place"]} / ${row["totalbuyin"]}</div>
		`)
		innerhtml("#description",row["description"],false)

		ajax("GET",AJAXURL+"gettablelist/"+sessionid,function(event,data){
			if(data["success"]){
				let row=data["data"]

				if(tablelinked&&0<row.length){
					domgetid("newtable").style.display="none"
					domgetid("deletetable").style.display="block"
				}

				for(let i=0;i<row.length;i=i+1){
					innerhtml("#tablemain",`
						<tr class="hover:bg-zinc-700 transition cursor-pointer" onclick="window.location='table.html?id=${row[i]["id"]}'">
							<td class="py-2 px-2">${i+1}</td>
							<td>${row[i]["starttime"].split("T")[0]} ${row[i]["starttime"].split("T")[1].split(":00Z")[0]}</td>
							<td>${row[i]["name"]}</td>
							<td>${row[i]["smallblind"]}/${row[i]["bigblind"]}</td>
							<td>${row[i]["bigblindante"]}</td>
							<td>${row[i]["ante"]}</td>
							<td>${tablelinked?(i==0?row[i]["chip"]:"連動牌桌呈上一階段籌碼"):row[i]["chip"]}</td>
							<td>
								${
									tablelinked?`
										-
									`:`
										<a href="edittable.html?id=${row[i]["id"]}" class="text-blue-400 hover:underline">編輯</a>
										<input type="button" class="text-red-400 hover:underline deletetable" data-id="${row[i]["id"]}" value="刪除">
									`
								}
							</td>
						</tr>
					`)
				}

				onclick(".deletetable",function(element,event){
					if(confirm("確定刪除?")){
						event.preventDefault()
						event.stopPropagation()

						element.disabled=true

						ajax("DELETE",AJAXURL+"deletetable/"+dataset(element,"id"),function(event,data){
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

				onclick("#deletetable",function(element,event){
					if(confirm("確定刪除? 此操作無法復原!")){
						event.preventDefault()
						event.stopPropagation()

						element.disabled=true

						ajax("DELETE",AJAXURL+"deletetable/"+row[0]["id"],function(event,data){
							if(data["success"]){
								alert("刪除成功")
								href("")
							}else{
								alert("error")
								element.disabled=false
							}
						},null,[
							["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
						])
					}
				})
			}else{
				innerhtml("#tablemain",`查詢牌桌時遭遇錯誤`,false)
				addclass("#tablemain",["text-red-500","text-center","font-bold","my-1","text-lg"])
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	}else{
		alert("查無指定場次")
		href("sessionlist.html")
	}
},null,[
	["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

domgetid("newtable").href="newtable.html?sessionid="+sessionid

onclick("#back",function(element,event){
	href("sessionlist.html")
})

// 頁籤切換
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(btn => {
	btn.addEventListener('click', () => {
		tabBtns.forEach(b => b.classList.remove('border-emerald-400', 'text-emerald-400'));
		btn.classList.add('border-emerald-400', 'text-emerald-400');
		const tab = btn.getAttribute('data-tab');
		tabContents.forEach(tc => tc.classList.add('hidden'));
		document.getElementById('tab-' + tab).classList.remove('hidden');
		href("#"+dataset(btn,"id"))
	});
});
// 預設顯示第一個頁籤

document.querySelectorAll('.tab-btn')[location.hash.substring(1)!=""?location.hash.substring(1):0].click()
// tabBtns[location.hash.substring(1)??0].classList.add('border-emerald-400', 'text-emerald-400');
// EV圖假資料
if (document.getElementById('evChart')) {
	var myChart = echarts.init(document.getElementById('evChart'));
	var option = {
		tooltip: { trigger: 'axis' },
		xAxis: { type: 'category', data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
		yAxis: { type: 'value' },
		series: [{
			name: 'EV',
			type: 'line',
			smooth: true,
			data: [0, 100, 200, 150, 300, 250, 400, 350, 500, 600],
			areaStyle: { color: '#22d3ee', opacity: 0.2 },
			lineStyle: { color: '#22d3ee' },
			itemStyle: { color: '#22d3ee' }
		}]
	};
	myChart.setOption(option);
}
// 動態座位事件流資料
let seatEvents = [
	{
		seat: 1,
		history: [
			{ type: '入座', player: 'Hero', time: '19:00', buyin: 2000 },
			{ type: '離席', player: 'Hero', time: '20:30' },
			{ type: '入座', player: '玩家B', time: '20:35', buyin: 2000 },
			{ type: '重新買入', player: '玩家B', time: '21:10', buyin: 1000 }
		]
	},
	{
		seat: 2,
		history: [
			{ type: '入座', player: '玩家C', time: '19:00', buyin: 2000 }
		]
	},
	{
		seat: 3,
		history: []
	},
	{
		seat: 4,
		history: [
			{ type: '入座', player: '玩家D', time: '19:00', buyin: 2000 },
			{ type: '重新買入', player: '玩家D', time: '20:50', buyin: 1000 }
		]
	},
	{ seat: 5, history: [] },
	{ seat: 6, history: [] },
	{ seat: 7, history: [] },
	{ seat: 8, history: [] },
	{ seat: 9, history: [] }
];
// 新增事件
window.addSeatEvent = function (e, seatIdx) {
	e.preventDefault();
	const form = e.target;
	const type = form.type.value;
	const player = form.player.value.trim();
	const time = form.time.value;
	const buyin = form.buyin.value ? parseInt(form.buyin.value) : undefined;
	if (!player && (type === '入座' || type === '換人' || type === '重新買入')) {
		alert('請輸入玩家名稱'); return;
	}
	if ((type === '入座' || type === '重新買入') && !buyin) {
		alert('請輸入買入金額'); return;
	}
	seatEvents[seatIdx].history.push({ type, player, time, buyin });
	renderSeatEventTable(parseInt(document.getElementById('max-seat-select').value));
}
// 刪除事件
window.removeSeatEvent = function (seatIdx, eventIdx) {
	seatEvents[seatIdx].history.splice(eventIdx, 1);
	renderSeatEventTable(parseInt(document.getElementById('max-seat-select').value));
}