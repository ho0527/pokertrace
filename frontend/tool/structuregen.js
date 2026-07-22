function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function sgtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["structuregenpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["structuregenpage"][key]||key
}

// 面額清單分隔符：中文用頓號，英文不能硬串全形標點
const SGLISTSEP=(function(){if(LANGUAGE=="en"){return ", "}return "、"})()

let sgchipsdefault=[
	{denom:25,on:true},
	{denom:50,on:false},
	{denom:100,on:true},
	{denom:500,on:true},
	{denom:1000,on:true},
	{denom:5000,on:true},
	{denom:25000,on:true},
	{denom:100000,on:false}
]

let sgchips=loadsgchips()

// 目前編輯中的結構（item 陣列）。level:{type,sb,bb,ante,dur,regCloseAfter?,chipRace?} break:{type,dur,chipRaiseValues}
let sgschedule=[]

function loadsgchips(){
	try{
		let raw=localStorage.getItem(WEBLSNAME+"sgchips")
		if(raw){
			let parsed=JSON.parse(raw)
			if(Array.isArray(parsed)&&parsed.length){
				return parsed
			}
		}
	}catch(error){
	}
	return JSON.parse(JSON.stringify(sgchipsdefault))
}

function savesgchips(){
	try{
		localStorage.setItem(WEBLSNAME+"sgchips",JSON.stringify(sgchips))
	}catch(error){
	}
}

function roundblind(value){
	if(value<=0){
		return 0
	}
	let step
	if(value<100){
		step=5
	}else if(value<500){
		step=25
	}else if(value<2000){
		step=50
	}else if(value<10000){
		step=100
	}else if(value<50000){
		step=500
	}else{
		step=1000
	}
	let rounded=Math.round(value/step)*step
	return (function(){if(rounded<step){return step}return rounded})()
}

function snapblind(value,minchip){
	if(minchip>0&&value>=minchip){
		let r=Math.round(value/minchip)*minchip
		return (function(){if(r<minchip){return minchip}return r})()
	}
	return value
}

function selectedchips(){
	let out=[]
	for(let i=0;i<sgchips.length;i=i+1){
		if(sgchips[i].on&&sgchips[i].denom>0&&out.indexOf(sgchips[i].denom)==-1){
			out.push(sgchips[i].denom)
		}
	}
	out.sort(function(a,b){return a-b})
	return out
}

function fmtduration(mins){
	mins=Math.round(mins)
	let h=Math.floor(mins/60)
	let m=mins%60
	if(h<=0){
		return m+sgtext("unitmin")
	}
	return h+sgtext("unithr")+" "+m+sgtext("unitmin")
}

// 依生成器參數產生 schedule（item 陣列），失敗回傳 null
function generateschedule(){
	let startsb=num(getvalue("sgstartsb"))
	let mult=num(getvalue("sgmult"))
	let leveldur=Math.round(num(getvalue("sgleveldur")))
	let levels=Math.round(num(getvalue("sglevels")))
	let breakevery=Math.round(num(getvalue("sgbreakevery")))
	let breakdur=Math.round(num(getvalue("sgbreakdur")))
	let useante=domgetid("sgante").checked
	let chips=selectedchips()
	let minchip=(function(){if(chips.length){return chips[0]}return 0})()

	if(startsb<=0||levels<=0||leveldur<=0||mult<1){
		return null
	}
	if(levels>60){
		levels=60
		pttoast(sgtext("leveltruncated").replace("{n}",60),"warning")
	}

	// 各級盲注（取整＋對齊最小面額）
	let lv=[]
	let sb=startsb
	for(let i=0;i<levels;i=i+1){
		let rsb=snapblind(roundblind(sb),minchip)
		let bb=snapblind(roundblind(rsb*2),minchip)
		if(bb<=rsb){
			bb=rsb*2
		}
		let ante=(function(){if(useante){return bb}return 0})()
		lv.push({sb:rsb,bb:bb,ante:ante,dur:leveldur,removed:[]})
		sb=sb*mult
	}

	// 自動偵測換籌（chip race）：某面額要「自某級起、之後所有級」都不再用於
	// 組成盲注/ante，才算可移除。只看單一級會誤判（例如下一級又用得到）。
	let active=chips.slice()
	let racefrom=1
	while(active.length>=2){
		let next=active[1]
		let removeat=-1
		for(let i=racefrom;i<lv.length;i=i+1){
			let okfromhere=true
			for(let j=i;j<lv.length;j=j+1){
				if(lv[j].sb%next!=0||lv[j].bb%next!=0||(lv[j].ante!=0&&lv[j].ante%next!=0)){
					okfromhere=false
					break
				}
			}
			if(okfromhere){
				removeat=i
				break
			}
		}
		if(removeat<0){
			break
		}
		lv[removeat].removed.push(active[0])
		active.shift()
		racefrom=removeat
	}

	// 組成 schedule。換籌在該面額變得多餘的「前一個休息」執行
	let assigned=[]
	for(let i=0;i<lv.length;i=i+1){
		assigned.push(false)
	}
	let schedule=[]
	for(let i=0;i<lv.length;i=i+1){
		let item={type:"level",sb:lv[i].sb,bb:lv[i].bb,ante:lv[i].ante,dur:lv[i].dur}
		if(lv[i].removed.length){
			item.chipRace=lv[i].removed.slice()
		}
		schedule.push(item)

		let islast=(i==lv.length-1)
		if(breakevery>0&&(i+1)%breakevery==0&&!islast){
			let raise=[]
			for(let j=0;j<=i+1&&j<lv.length;j=j+1){
				if(lv[j].removed.length&&!assigned[j]){
					for(let k=0;k<lv[j].removed.length;k=k+1){
						raise.push(lv[j].removed[k])
					}
					assigned[j]=true
				}
			}
			schedule.push({type:"break",dur:breakdur,chipRaiseValues:raise})
		}
	}

	return schedule
}

// 第一個被勾「截買」的 level 之 index；其後的項目視為截買後
function regcutoffindex(){
	for(let i=0;i<sgschedule.length;i=i+1){
		if(sgschedule[i].regCloseAfter){
			return i
		}
	}
	return -1
}

// 已由某個休息承接執行的換籌面額。level 的 chipRace 若已在此清單內，就不重複顯示／計次
function racedatbreak(){
	let out=[]
	for(let i=0;i<sgschedule.length;i=i+1){
		let it=sgschedule[i]
		if(it.type=="break"&&it.chipRaiseValues){
			for(let j=0;j<it.chipRaiseValues.length;j=j+1){
				if(out.indexOf(it.chipRaiseValues[j])==-1){
					out.push(it.chipRaiseValues[j])
				}
			}
		}
	}
	return out
}

// level 的 chipRace 中還沒有任何休息承接的面額（沒有休息、或移除點落在最後一個休息之後時會有值）
function uncoveredrace(chiprace,covered){
	let out=[]
	if(chiprace){
		for(let i=0;i<chiprace.length;i=i+1){
			if(covered.indexOf(chiprace[i])==-1){
				out.push(chiprace[i])
			}
		}
	}
	return out
}

function summary(){
	let levels=0
	let totalmins=0
	let breaks=0
	let races=0
	let covered=racedatbreak()
	for(let i=0;i<sgschedule.length;i=i+1){
		let it=sgschedule[i]
		totalmins=totalmins+(parseInt(it.dur,10)||0)
		if(it.type=="level"){
			levels=levels+1
			// 沒有休息可承接時（breakevery=0，或移除點在最後一個休息之後）換籌在該級直接執行，也要計次，
			// 否則摘要顯示 0 次換籌但 JSON 匯出仍帶 chipRace，UI 與匯出會不一致
			if(uncoveredrace(it.chipRace,covered).length){
				races=races+1
			}
		}else{
			breaks=breaks+1
			// 每個有換籌的休息算一次（與「休息次數」一致的計次方式）
			if(it.chipRaiseValues&&it.chipRaiseValues.length){
				races=races+1
			}
		}
	}
	return {levels:levels,totalmins:totalmins,breaks:breaks,races:races}
}

function raiseoptions(selected){
	let chips=selectedchips()
	let html="<option value=\"\">"+sgtext("noraise")+"</option>"
	for(let i=0;i<chips.length;i=i+1){
		let sel=(String(selected)==String(chips[i]))?" selected":""
		html=html+"<option value=\""+chips[i]+"\""+sel+">"+moneyfmt(chips[i])+"</option>"
	}
	return html
}

let sgselectcls="min-h-9 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-2 text-sm text-white outline-none focus:border-emerald-400"
let sginputcls="min-h-9 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-2 text-sm text-white outline-none focus:border-emerald-400"
let sgicocls="min-h-8 w-8 rounded-lg bg-zinc-800 text-sm font-bold text-zinc-200 transition hover:bg-zinc-700"

function rendereditor(){
	let host=domgetid("sgtable")
	host.innerHTML=""
	let cutoff=regcutoffindex()
	let covered=racedatbreak()
	let lvnum=0
	for(let i=0;i<sgschedule.length;i=i+1){
		let it=sgschedule[i]
		let tr=document.createElement("tr")
		tr.setAttribute("data-sgrow",i)
		tr.setAttribute("data-type",it.type)
		if(it.type=="break"){
			tr.className="border-b border-zinc-800/60 bg-amber-500/5 align-top"
			tr.setAttribute("data-chiprace","")
			let raisevals=it.chipRaiseValues||[]
			let racehtml=
				"<div class=\"grid grid-cols-3 gap-1\">"+
					"<select class=\"sgraise "+sgselectcls+"\">"+raiseoptions(raisevals[0]||"")+"</select>"+
					"<select class=\"sgraise "+sgselectcls+"\">"+raiseoptions(raisevals[1]||"")+"</select>"+
					"<select class=\"sgraise "+sgselectcls+"\">"+raiseoptions(raisevals[2]||"")+"</select>"+
				"</div>"
			let breaklabeltext=sgtext("breaklabel")
			if(raisevals.length){
				breaklabeltext=sgtext("breakraced").replace("{d}",raisevals.map(moneyfmt).join(SGLISTSEP))
			}
			tr.innerHTML=
				"<td class=\"py-2 pr-3 font-bold text-amber-300\">B</td>"+
				"<td class=\"py-2 pr-3\" colspan=\"3\">"+racehtml+"<div class=\"mt-1 text-[11px] font-bold text-amber-300\">"+breaklabeltext+"</div></td>"+
				"<td class=\"py-2 pr-3\"><input type=\"number\" min=\"1\" inputmode=\"numeric\" class=\"sgdur "+sginputcls+"\" value=\""+(parseInt(it.dur,10)||0)+"\"></td>"+
				"<td class=\"py-2 pr-3 text-center\"><input type=\"checkbox\" class=\"sgreg h-5 w-5 accent-emerald-500\""+((function(){if(it.regCloseAfter){return " checked"}return ""})())+"></td>"+
				"<td class=\"py-2\">"+rowactions(i)+"</td>"
		}else{
			lvnum=lvnum+1
			tr.className="border-b border-zinc-800/60 align-top"
			tr.setAttribute("data-chiprace",(function(){if(it.chipRace&&it.chipRace.length){return JSON.stringify(it.chipRace)}return ""})())
			let badge=""
			if(cutoff>=0){
				if(i>cutoff){
					badge="<span class=\"ml-1 rounded-md bg-zinc-700/70 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300\">"+sgtext("regafter")+"</span>"
				}else{
					badge="<span class=\"ml-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300\">"+sgtext("regbefore")+"</span>"
				}
			}
			// 換籌（可移除）提示以休息列優先；沒有休息承接的面額才顯示在 level 列，
			// 讓 breakevery=0 這類情況不會整個消失（與 summary 的換籌次數、JSON 的 chipRace 一致）
			let racetag=""
			let raceleft=uncoveredrace(it.chipRace,covered)
			if(raceleft.length){
				racetag="<span class=\"ml-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-300\">"+esc(sgtext("racetag").replace("{d}",raceleft.map(moneyfmt).join(SGLISTSEP)))+"</span>"
			}
			tr.innerHTML=
				"<td class=\"py-2 pr-3 whitespace-nowrap font-bold text-zinc-200\">"+lvnum+badge+racetag+"</td>"+
				"<td class=\"py-2 pr-3\"><input type=\"number\" min=\"0\" inputmode=\"numeric\" class=\"sgsb "+sginputcls+"\" value=\""+(parseInt(it.sb,10)||0)+"\"></td>"+
				"<td class=\"py-2 pr-3\"><input type=\"number\" min=\"0\" inputmode=\"numeric\" class=\"sgbb "+sginputcls+"\" value=\""+(parseInt(it.bb,10)||0)+"\"></td>"+
				"<td class=\"py-2 pr-3\"><input type=\"number\" min=\"0\" inputmode=\"numeric\" class=\"sgante "+sginputcls+"\" value=\""+(parseInt(it.ante,10)||0)+"\"></td>"+
				"<td class=\"py-2 pr-3\"><input type=\"number\" min=\"1\" inputmode=\"numeric\" class=\"sgdur "+sginputcls+"\" value=\""+(parseInt(it.dur,10)||0)+"\"></td>"+
				"<td class=\"py-2 pr-3 text-center\"><input type=\"checkbox\" class=\"sgreg h-5 w-5 accent-emerald-500\""+((function(){if(it.regCloseAfter){return " checked"}return ""})())+"></td>"+
				"<td class=\"py-2\">"+rowactions(i)+"</td>"
		}
		host.appendChild(tr)
	}
	bindrows()
	rendersummary()
	value("#sgjson",structurejson())
}

function rowactions(i){
	return "<div class=\"flex gap-1\">"+
		"<input type=\"button\" data-sgup=\""+i+"\" class=\""+sgicocls+"\" value=\"↑\">"+
		"<input type=\"button\" data-sgdown=\""+i+"\" class=\""+sgicocls+"\" value=\"↓\">"+
		"<input type=\"button\" data-sgtype=\""+i+"\" class=\""+sgicocls+"\" value=\"⇄\" title=\""+sgtext("switchtype")+"\">"+
		"<input type=\"button\" data-sgcopy=\""+i+"\" class=\""+sgicocls+"\" value=\"⧉\">"+
		"<input type=\"button\" data-sgdel=\""+i+"\" class=\"min-h-8 w-8 rounded-lg bg-zinc-800 text-sm font-bold text-red-500 transition hover:bg-red-700 hover:text-white\" value=\"×\">"+
	"</div>"
}

function rendersummary(){
	let s=summary()
	innertext("#sgsumlevels",String(s.levels),false)
	innertext("#sgsumtime",fmtduration(s.totalmins),false)
	innertext("#sgsumbreaks",String(s.breaks),false)
	innertext("#sgsumraces",String(s.races),false)
}

// 從 DOM 讀回編輯內容到 sgschedule
function readeditor(){
	let rows=domgetid("sgtable").querySelectorAll("[data-sgrow]")
	let out=[]
	for(let i=0;i<rows.length;i=i+1){
		let row=rows[i]
		let type=row.getAttribute("data-type")
		let dur=parseInt(row.querySelector(".sgdur").value,10)||1
		if(type=="break"){
			let item={type:"break",dur:dur,chipRaiseValues:[]}
			let selects=row.querySelectorAll(".sgraise")
			for(let j=0;j<selects.length;j=j+1){
				let v=parseInt(selects[j].value,10)||0
				if(v&&item.chipRaiseValues.indexOf(v)==-1){
					item.chipRaiseValues.push(v)
				}
			}
			let breakreg=row.querySelector(".sgreg")
			if(breakreg&&breakreg.checked){
				item.regCloseAfter=true
			}
			out.push(item)
		}else{
			let item={
				type:"level",
				sb:parseInt(row.querySelector(".sgsb").value,10)||0,
				bb:parseInt(row.querySelector(".sgbb").value,10)||0,
				ante:parseInt(row.querySelector(".sgante").value,10)||0,
				dur:dur
			}
			if(row.querySelector(".sgreg").checked){
				item.regCloseAfter=true
			}
			let cr=row.getAttribute("data-chiprace")
			if(cr){
				try{
					let arr=JSON.parse(cr)
					if(Array.isArray(arr)&&arr.length){
						item.chipRace=arr
					}
				}catch(error){
				}
			}
			out.push(item)
		}
	}
	sgschedule=out
}

function bindrows(){
	let box=domgetid("sgtable")
	// 小盲改動時自動帶 BB=2×SB、ante=BB
	let sblist=box.querySelectorAll(".sgsb")
	for(let i=0;i<sblist.length;i=i+1){
		sblist[i].addEventListener("input",function(){
			let row=this.closest("[data-sgrow]")
			let bb=row.querySelector(".sgbb")
			let ante=row.querySelector(".sgante")
			let v=parseInt(this.value,10)||0
			if(bb){
				bb.value=v*2
			}
			if(ante&&parseInt(ante.value,10)>0){
				ante.value=v*2
			}
		})
	}
	let live=box.querySelectorAll(".sgsb,.sgbb,.sgante,.sgdur")
	for(let i=0;i<live.length;i=i+1){
		live[i].addEventListener("input",function(){
			readeditor()
			rendersummary()
			value("#sgjson",structurejson())
		})
		live[i].addEventListener("change",function(){
			readeditor()
			rendersummary()
			value("#sgjson",structurejson())
		})
	}
	// 換籌下拉改變時整列重繪，讓休息列的「可移除」提示與換籌次數同步更新
	let raiselist=box.querySelectorAll(".sgraise")
	for(let i=0;i<raiselist.length;i=i+1){
		raiselist[i].addEventListener("change",function(){
			readeditor()
			rendereditor()
		})
	}
	let reglist=box.querySelectorAll(".sgreg")
	for(let i=0;i<reglist.length;i=i+1){
		reglist[i].addEventListener("change",function(){
			readeditor()
			rendereditor()
		})
	}
	bindrowactions(box)
}

function bindrowactions(box){
	let ups=box.querySelectorAll("[data-sgup]")
	for(let i=0;i<ups.length;i=i+1){
		ups[i].addEventListener("click",function(){
			readeditor()
			let idx=parseInt(this.getAttribute("data-sgup"),10)
			if(idx>0){
				let t=sgschedule[idx-1]
				sgschedule[idx-1]=sgschedule[idx]
				sgschedule[idx]=t
				rendereditor()
			}
		})
	}
	let downs=box.querySelectorAll("[data-sgdown]")
	for(let i=0;i<downs.length;i=i+1){
		downs[i].addEventListener("click",function(){
			readeditor()
			let idx=parseInt(this.getAttribute("data-sgdown"),10)
			if(idx<sgschedule.length-1){
				let t=sgschedule[idx+1]
				sgschedule[idx+1]=sgschedule[idx]
				sgschedule[idx]=t
				rendereditor()
			}
		})
	}
	let copies=box.querySelectorAll("[data-sgcopy]")
	for(let i=0;i<copies.length;i=i+1){
		copies[i].addEventListener("click",function(){
			readeditor()
			let idx=parseInt(this.getAttribute("data-sgcopy"),10)
			let clone=JSON.parse(JSON.stringify(sgschedule[idx]))
			sgschedule.splice(idx+1,0,clone)
			rendereditor()
		})
	}
	let types=box.querySelectorAll("[data-sgtype]")
	for(let i=0;i<types.length;i=i+1){
		types[i].addEventListener("click",function(){
			readeditor()
			let idx=parseInt(this.getAttribute("data-sgtype"),10)
			let it=sgschedule[idx]
			if(it.type=="break"){
				// 休息 → 級：套用鄰近一級的盲注當預設值
				let base={sb:100,bb:200,ante:0}
				for(let j=idx-1;j>=0;j=j-1){
					if(sgschedule[j].type=="level"){
						base={sb:sgschedule[j].sb,bb:sgschedule[j].bb,ante:sgschedule[j].ante}
						break
					}
				}
				sgschedule[idx]={type:"level",sb:base.sb,bb:base.bb,ante:base.ante,dur:parseInt(it.dur,10)||20}
			}else{
				sgschedule[idx]={type:"break",dur:parseInt(it.dur,10)||10,chipRaiseValues:[]}
			}
			rendereditor()
		})
	}
	let dels=box.querySelectorAll("[data-sgdel]")
	for(let i=0;i<dels.length;i=i+1){
		dels[i].addEventListener("click",function(){
			readeditor()
			if(sgschedule.length<=1){
				pttoast(sgtext("atleastone"),"warning")
				return
			}
			let idx=parseInt(this.getAttribute("data-sgdel"),10)
			sgschedule.splice(idx,1)
			rendereditor()
		})
	}
}

function regenerate(){
	let schedule=generateschedule()
	if(!schedule){
		sgschedule=[]
		domgetid("sgtable").innerHTML="<tr><td colspan=\"7\" class=\"py-4 text-center text-zinc-500\">"+sgtext("invalid")+"</td></tr>"
		innertext("#sgsumlevels","-",false)
		innertext("#sgsumtime","-",false)
		innertext("#sgsumbreaks","-",false)
		innertext("#sgsumraces","-",false)
		value("#sgjson","")
		return
	}
	sgschedule=schedule
	rendereditor()
}

function addlevel(){
	readeditor()
	let last={sb:100,bb:200,ante:0,dur:Math.round(num(getvalue("sgleveldur")))||20}
	for(let i=sgschedule.length-1;i>=0;i=i-1){
		if(sgschedule[i].type=="level"){
			last=sgschedule[i]
			break
		}
	}
	let mult=num(getvalue("sgmult"))||1.5
	// 盲注算法比照 generateschedule()：先由小盲取整＋對齊最小面額，大盲再由小盲的兩倍推得，
	// 避免 sb / bb 各自 Math.round(x*mult) 造成大盲偏離 2×小盲（例如 125/250 ×1.5 會變成 188/375）
	let chips=selectedchips()
	let minchip=(function(){if(chips.length){return chips[0]}return 0})()
	let sb=snapblind(roundblind(last.sb*mult),minchip)
	let bb=snapblind(roundblind(sb*2),minchip)
	if(bb<=sb){
		bb=sb*2
	}
	sgschedule.push({
		type:"level",
		sb:sb,
		bb:bb,
		ante:(function(){if(last.ante>0){return bb}return 0})(),
		dur:last.dur
	})
	rendereditor()
}

function addbreak(){
	readeditor()
	sgschedule.push({type:"break",dur:Math.round(num(getvalue("sgbreakdur")))||10,chipRaiseValues:[]})
	rendereditor()
}

function structurejson(){
	let data={
		version:1,
		type:"poker-clock-structure",
		schedule:sgschedule
	}
	return JSON.stringify(data,null,4)
}

function renderchips(){
	let host=domgetid("sgchips")
	host.innerHTML=""
	for(let i=0;i<sgchips.length;i=i+1){
		let b=document.createElement("input")
		b.type="button"
		b.setAttribute("data-sgchip",i)
		b.className="min-h-10 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-bold text-zinc-400 transition hover:border-zinc-500"
		if(sgchips[i].on){
			b.className="min-h-10 rounded-2xl border border-emerald-500 bg-emerald-500/15 px-4 text-sm font-bold text-emerald-300 transition"
		}
		b.value=moneyfmt(sgchips[i].denom)
		host.appendChild(b)
	}
	let list=host.querySelectorAll("[data-sgchip]")
	for(let i=0;i<list.length;i=i+1){
		list[i].addEventListener("click",function(){
			let idx=parseInt(this.getAttribute("data-sgchip"),10)
			sgchips[idx].on=!sgchips[idx].on
			savesgchips()
			renderchips()
			regenerate()
		})
	}
	let allon=sgchips.length>0
	for(let i=0;i<sgchips.length;i=i+1){
		if(!sgchips[i].on){
			allon=false
		}
	}
	let selectalltext=sgtext("selectall")
	if(allon){
		selectalltext=sgtext("deselectall")
	}
	value("#sgchipselectall",selectalltext)
}

// 全選 / 取消全選桌上的計分牌面額
function toggleselectallchips(){
	let allon=sgchips.length>0
	for(let i=0;i<sgchips.length;i=i+1){
		if(!sgchips[i].on){
			allon=false
		}
	}
	for(let i=0;i<sgchips.length;i=i+1){
		sgchips[i].on=!allon
	}
	savesgchips()
	renderchips()
	regenerate()
}

function addchip(){
	let v=Math.round(num(getvalue("sgchipadd")))
	if(v<=0){
		pttoast(sgtext("badchip"),"warning")
		return
	}
	let found=false
	for(let i=0;i<sgchips.length;i=i+1){
		if(sgchips[i].denom==v){
			sgchips[i].on=true
			found=true
		}
	}
	if(!found){
		sgchips.push({denom:v,on:true})
	}
	sgchips.sort(function(a,b){return a.denom-b.denom})
	savesgchips()
	value("#sgchipadd","")
	renderchips()
	regenerate()
}

// 套用一組面額到桌上計分牌
function applychipdenoms(denoms){
	if(!denoms||denoms.length<1){
		return
	}
	sgchips=[]
	for(let i=0;i<denoms.length;i=i+1){
		sgchips.push({denom:denoms[i],on:true})
	}
	savesgchips()
	renderchips()
	regenerate()
}

// 從個人資料的計分牌組合（chipsets）載入面額。
// interactive=true（使用者點按鈕）時，多組會跳選擇燈箱；
// 自動載入（interactive=false）不跳燈箱，只在剛好一組時靜默套用。
function loadprofilechips(interactive){
	ptloadprofilechipsets(function(sets){
		if(!sets||sets.length<1){
			return
		}
		if(sets.length==1){
			applychipdenoms(sets[0].denoms)
			if(interactive){
				pttoast(sgtext("profileloaded").replace("{n}",sets[0].denoms.length),"success")
			}
			return
		}
		if(interactive){
			openchipsetpicker(sets)
		}
	},!interactive)
}

// 多組計分牌時的選擇彈窗
function openchipsetpicker(sets){
	let old=domgetid("sgchipsetpicker")
	if(old){
		old.parentNode.removeChild(old)
	}
	let cover=document.createElement("div")
	cover.id="sgchipsetpicker"
	cover.className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 p-4"
	let rows=""
	for(let i=0;i<sets.length;i=i+1){
		let name=sets[i].name||sgtext("chipsetunnamed")
		let denomtext=sets[i].denoms.map(moneyfmt).join(SGLISTSEP)
		rows=rows+
			"<div role=\"button\" tabindex=\"0\" data-sgpick=\""+i+"\" class=\"cursor-pointer rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 transition hover:border-emerald-500 hover:bg-zinc-700\">"+
				"<div class=\"text-sm font-bold text-white\">"+esc(name)+"</div>"+
				"<div class=\"mt-0.5 text-xs text-zinc-400\">"+sgtext("chipsetdenomcount").replace("{n}",sets[i].denoms.length)+" · "+esc(denomtext)+"</div>"+
			"</div>"
	}
	cover.innerHTML=
		"<div class=\"max-h-[85vh] w-full max-w-md overflow-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl\">"+
			"<div class=\"mb-1 text-lg font-bold text-white\">"+sgtext("pickchipset")+"</div>"+
			"<div class=\"mb-4 text-sm text-zinc-400\">"+sgtext("pickchipsethint")+"</div>"+
			"<div class=\"space-y-2\">"+rows+"</div>"+
			"<div class=\"mt-5 flex justify-end\">"+
				"<input type=\"button\" id=\"sgpickcancel\" class=\"min-h-11 rounded-2xl bg-zinc-800 px-4 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700\" value=\""+sgtext("pickcancel")+"\">"+
			"</div>"+
		"</div>"
	document.body.appendChild(cover)
	function close(){
		if(cover.parentNode){
			cover.parentNode.removeChild(cover)
		}
	}
	cover.addEventListener("click",function(e){
		if(e.target==cover){
			close()
		}
	})
	domgetid("sgpickcancel").addEventListener("click",close)
	let picks=cover.querySelectorAll("[data-sgpick]")
	for(let i=0;i<picks.length;i=i+1){
		picks[i].addEventListener("click",function(){
			let idx=parseInt(this.getAttribute("data-sgpick"),10)
			applychipdenoms(sets[idx].denoms)
			pttoast(sgtext("profileloaded").replace("{n}",sets[idx].denoms.length),"success")
			close()
		})
	}
}

function esc(text){
	return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

function copyjson(){
	let text=structurejson()
	if(!text){
		return
	}
	if(navigator.clipboard&&navigator.clipboard.writeText){
		navigator.clipboard.writeText(text).then(function(){
			pttoast(sgtext("copied"),"success")
		}).catch(function(){
			fallbackcopy(text)
		})
	}else{
		fallbackcopy(text)
	}
}

function fallbackcopy(text){
	let box=domgetid("sgjson")
	box.classList.remove("hidden")
	value("#sgjson",text)
	box.focus()
	box.select()
	pttoast(sgtext("copymanual"),"warning")
}

function exportjson(){
	let text=structurejson()
	if(!text){
		return
	}
	domgetid("sgjson").classList.remove("hidden")
	value("#sgjson",text)
	let blob=new Blob([text],{type:"application/json"})
	let url=URL.createObjectURL(blob)
	let a=document.createElement("a")
	a.href=url
	a.download="poker-structure.json"
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
	pttoast(sgtext("exported"),"success")
}

// 把匯入的 JSON 轉成乾淨的 schedule（item 陣列），無法解析回傳 null
function parseimportedschedule(raw){
	let data
	try{
		data=JSON.parse(raw)
	}catch(error){
		return null
	}
	let list=null
	if(Array.isArray(data)){
		list=data
	}else if(data&&Array.isArray(data.schedule)){
		list=data.schedule
	}
	if(!list){
		return null
	}
	let out=[]
	for(let i=0;i<list.length;i=i+1){
		let it=list[i]
		if(!it||typeof it!="object"){
			continue
		}
		if(it.type=="break"){
			let item={type:"break",dur:parseInt(it.dur,10)||1,chipRaiseValues:[]}
			if(Array.isArray(it.chipRaiseValues)){
				for(let j=0;j<it.chipRaiseValues.length;j=j+1){
					let v=parseInt(it.chipRaiseValues[j],10)||0
					if(v&&item.chipRaiseValues.indexOf(v)==-1){
						item.chipRaiseValues.push(v)
					}
				}
			}
			out.push(item)
		}else if(it.type=="level"||it.sb!=undefined||it.bb!=undefined){
			let item={
				type:"level",
				sb:parseInt(it.sb,10)||0,
				bb:parseInt(it.bb,10)||0,
				ante:parseInt(it.ante,10)||0,
				dur:parseInt(it.dur,10)||1
			}
			if(it.regCloseAfter){
				item.regCloseAfter=true
			}
			if(Array.isArray(it.chipRace)){
				let cr=[]
				for(let j=0;j<it.chipRace.length;j=j+1){
					let v=parseInt(it.chipRace[j],10)||0
					if(v&&cr.indexOf(v)==-1){
						cr.push(v)
					}
				}
				if(cr.length){
					item.chipRace=cr
				}
			}
			out.push(item)
		}
	}
	return out
}

function importjson(raw){
	let schedule=parseimportedschedule(raw)
	if(!schedule){
		pttoast(sgtext("importfail"),"error")
		return
	}
	if(!schedule.length){
		pttoast(sgtext("importempty"),"warning")
		return
	}
	sgschedule=schedule
	rendereditor()
	pttoast(sgtext("imported").replace("{n}",schedule.length),"success")
}

function importfromfile(file){
	if(!file){
		return
	}
	let reader=new FileReader()
	reader.onload=function(e){
		importjson(e.target.result)
	}
	reader.onerror=function(){
		pttoast(sgtext("importfail"),"error")
	}
	reader.readAsText(file)
}

function applysglanguage(){
	document.title=sgtext("title")+" - PokerTrace"
	innertext("#sgtitle",sgtext("title"),false)
	innertext("#back",sgtext("back"),false)
	innertext("#sgchipslabel",sgtext("chipslabel"),false)
	value("#sgchipaddbtn",sgtext("addchip"))
	value("#sgchipfromprofile",sgtext("fromprofile"))
	innertext("#sgchipshint",sgtext("chipshint"),false)
	innertext("#sggenlabel",sgtext("genlabel"),false)
	innertext("#sgstartsblabel",sgtext("startsb"),false)
	innertext("#sgmultlabel",sgtext("mult"),false)
	innertext("#sgleveldurlabel",sgtext("leveldur"),false)
	innertext("#sglevelslabel",sgtext("levels"),false)
	innertext("#sgbreakeverylabel",sgtext("breakevery"),false)
	innertext("#sgbreakdurlabel",sgtext("breakdur"),false)
	innertext("#sgantelabel",sgtext("ante"),false)
	innertext("#sggenhint",sgtext("genhint"),false)
	innertext("#sgstructlabel",sgtext("structlabel"),false)
	value("#sgaddlevel",sgtext("addlevel"))
	value("#sgaddbreak",sgtext("addbreak"))
	value("#sgregen",sgtext("regen"))
	value("#sgcopy",sgtext("copyjson"))
	value("#sgimport",sgtext("importjson"))
	value("#sgexport",sgtext("exportjson"))
	innertext("#sgedithint",sgtext("edithint"),false)
	innertext("#sgsumlevelslabel",sgtext("sumlevels"),false)
	innertext("#sgsumtimelabel",sgtext("sumtime"),false)
	innertext("#sgsumbreakslabel",sgtext("sumbreaks"),false)
	innertext("#sgsumraceslabel",sgtext("sumraces"),false)
	innertext("#sgthlevel",sgtext("thlevel"),false)
	innertext("#sgthsb",sgtext("thsb"),false)
	innertext("#sgthbb",sgtext("thbb"),false)
	innertext("#sgthante",sgtext("thante"),false)
	innertext("#sgthdur",sgtext("thdur"),false)
	innertext("#sgthreg",sgtext("threg"),false)
	innertext("#sgthaction",sgtext("thaction"),false)
	let addinput=domgetid("sgchipadd")
	if(addinput){
		addinput.setAttribute("placeholder",sgtext("chipplaceholder"))
	}
	innertext("#sgparsetitle",sgtext("parsetitle"),false)
	innertext("#sgparsehint",sgtext("parsehint"),false)
	let parseinput=domgetid("sgparsetext")
	if(parseinput){
		parseinput.setAttribute("placeholder",sgtext("parseplaceholder"))
	}
	value("#sgparsebtn",sgtext("parsebtn"))
	innertext("#sgparseimagebtn",sgtext("parseimagebtn"),false)
	value("#sgshowaiprompt",sgtext("showaiprompt"))
	innertext("#sgaiprompthint",sgtext("aiprompthint"),false)
	value("#sgcopyaiprompt",sgtext("copyaiprompt"))
}

// ===== 貼上解析（移植自 structureedit）=====
function sgaipromptbody(){
	if(LANGUAGE=="en"){
		return [
			"You are a poker tournament structure converter. At the end I will paste a structure copied from another website. Convert it into the following JSON and return ONLY the JSON with no explanation.",
			"",
			"Format:",
			'{"schedule":[',
			'  {"type":"level","sb":<small blind int>,"bb":<big blind int>,"ante":<ante int>,"dur":<minutes int>},',
			'  {"type":"break","dur":<minutes int>}',
			"]}",
			"",
			"Rules:",
			"1. One level object per blind level, in original order; use a break object for any break / Colour Up (breaks need no blinds).",
			"2. Normalize every number to a plain integer: drop thousands separators (1,000 -> 1000), expand K/M (1K -> 1000, 1.2K -> 1200, 2.5K -> 2500, 1M -> 1000000).",
			'3. If blinds are written as "SB / BB (Ante)", the value in parentheses is the ante; use 0 if there is no ante.',
			"4. If only the big blind is given, set the small blind to half the big blind.",
			"5. Ignore anything that is not the level/break table (buy-in, prize pool, rules text, etc.).",
			'6. If a row marks registration closing, add "regCloseAfter":true to that row.'
		].join("\n")
	}
	return [
		"你是一個撲克賽程結構轉換器。我會在最後貼上一段從別的網站複製的比賽結構，請把它轉成下面這個 JSON，並且「只回傳 JSON、不要任何說明文字」。",
		"",
		"格式：",
		'{"schedule":[',
		'  {"type":"level","sb":小盲整數,"bb":大盲整數,"ante":前注整數,"dur":分鐘整數},',
		'  {"type":"break","dur":分鐘整數}',
		"]}",
		"",
		"規則：",
		"1. 每個盲注級別一個 level 物件，依原順序排列；休息 / Break / Colour Up 用 break 物件（break 不需要盲注）。",
		"2. 數字一律轉成純整數：去掉千分位逗號（1,000→1000），展開 K/M（1K→1000、1.2K→1200、2.5K→2500、1M→1000000）。",
		"3. 盲注若寫成「SB / BB (Ante)」，括號內是前注；沒有前注就填 0。",
		"4. 只有大盲、沒有小盲時，小盲填大盲的一半。",
		"5. 忽略所有不是級別/休息表格的內容（報名費、獎池、規則說明等）。",
		"6. 若某一列代表報名截止，在那一列加上 \"regCloseAfter\":true。"
	].join("\n")
}

function sgbuildaiprompt(){
	let structure=(getvalue("sgparsetext")||"").trim()
	if(structure==""){
		structure=sgtext("aipromptplaceholder")
	}
	return sgaipromptbody()+"\n\n"+sgtext("aipromptstructlabel")+"\n"+structure
}

function sgapplyparseresult(data){
	if(data&&data.success&&data.data&&Array.isArray(data.data.schedule)&&data.data.schedule.length>0){
		let schedule=parseimportedschedule(JSON.stringify({schedule:data.data.schedule}))
		if(!schedule||!schedule.length){
			innertext("#sgparsestatus",sgtext("parsefail"),false)
			pttoast(sgtext("parsefail"),"error")
			return
		}
		sgschedule=schedule
		rendereditor()
		innertext("#sgparsestatus",sgtext("parsesuccessprefix")+schedule.length+sgtext("parsesuccesssuffix")+((data.data.source=="ai")?" (AI)":""),false)
		pttoast(sgtext("imported").replace("{n}",schedule.length),"success")
	}else if(data&&data.data&&data.data.aiavailable==false){
		innertext("#sgparsestatus",sgtext("aidisabled"),false)
		pttoast(sgtext("aidisabled"),"error")
	}else{
		innertext("#sgparsestatus",sgtext("parsefail"),false)
		pttoast(sgtext("parsefail"),"error")
	}
}

function sgsendparse(payload,statuskey){
	let token=weblsget(WEBLSNAME+"token")
	if(!token){
		pttoast(sgtext("signinagain"),"warning")
		return
	}
	let btn=domgetid("sgparsebtn")
	ptsetsubmitstate(btn,true,sgtext(statuskey))
	innertext("#sgparsestatus",sgtext(statuskey),false)
	ajax("POST",AJAXURL+"parsestructure",function(event,data){
		ptsetsubmitstate(btn,false)
		if(!data){
			innertext("#sgparsestatus",sgtext("networkfail"),false)
			pttoast(sgtext("networkfail"),"error")
			return
		}
		sgapplyparseresult(data)
	},JSON.stringify(payload),[["Authorization","Bearer "+token]])
}

function sgparserun(mode){
	let text=getvalue("sgparsetext")||""
	if(text.trim()==""){
		pttoast(sgtext("parseempty"),"error")
		return
	}
	sgsendparse({text:text,mode:mode||"auto"},"parsing")
}

domgetid("sgparsebtn").addEventListener("click",function(){
	sgparserun("auto")
})
domgetid("sgparseimagein").addEventListener("change",function(){
	let file=this.files&&this.files[0]
	if(!file){
		return
	}
	let reader=new FileReader()
	reader.onload=function(){
		let dataurl=String(reader.result||"")
		let prev=domgetid("sgparseimagepreview")
		prev.src=dataurl
		prev.classList.remove("hidden")
		sgsendparse({image:dataurl},"parsingimage")
	}
	reader.readAsDataURL(file)
	this.value=""
})
domgetid("sgshowaiprompt").addEventListener("click",function(){
	let box=domgetid("sgaipromptbox")
	if(box.classList.contains("hidden")){
		domgetid("sgaiprompttext").value=sgbuildaiprompt()
		box.classList.remove("hidden")
	}else{
		box.classList.add("hidden")
	}
})
domgetid("sgcopyaiprompt").addEventListener("click",function(){
	let box=domgetid("sgaiprompttext")
	box.value=sgbuildaiprompt()
	box.focus()
	box.select()
	function done(){
		pttoast(sgtext("aipromptcopied"),"success")
	}
	if(navigator.clipboard&&navigator.clipboard.writeText){
		navigator.clipboard.writeText(box.value).then(done,function(){
			document.execCommand("copy")
			done()
		})
	}else{
		document.execCommand("copy")
		done()
	}
})

let sginputs=["sgstartsb","sgmult","sgleveldur","sglevels","sgbreakevery","sgbreakdur"]
for(let i=0;i<sginputs.length;i=i+1){
	domgetid(sginputs[i]).addEventListener("input",regenerate)
}
domgetid("sgante").addEventListener("change",regenerate)
domgetid("sgchipaddbtn").addEventListener("click",addchip)
domgetid("sgchipselectall").addEventListener("click",toggleselectallchips)
domgetid("sgchipfromprofile").addEventListener("click",function(){
	loadprofilechips(true)
})
domgetid("sgchipadd").addEventListener("keydown",function(e){
	if(e.key=="Enter"){
		addchip()
	}
})
domgetid("sgaddlevel").addEventListener("click",addlevel)
domgetid("sgaddbreak").addEventListener("click",addbreak)
domgetid("sgregen").addEventListener("click",regenerate)
domgetid("sgcopy").addEventListener("click",copyjson)
domgetid("sgexport").addEventListener("click",exportjson)
domgetid("sgimport").addEventListener("click",function(){
	domgetid("sgimportfile").click()
})
domgetid("sgimportfile").addEventListener("change",function(){
	importfromfile(this.files[0])
	this.value=""
})

applysglanguage()
renderchips()
regenerate()
loadprofilechips(false)
