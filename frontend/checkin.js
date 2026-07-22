// 報到核對頁：掃描收據 QR 後開啟，網址帶 s(場次id) 與 r(報名id)。
// 目前為唯讀核對版：查出該筆報名並顯示選手 / 狀態 / 桌座 / 買入。報到動作之後再加。

let sessionid=getget("s")
let registrationid=getget("r")
let checkindata=null

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function checkinstatustext(status){
	if(status=="registered"){
		return "已報名"
	}
	if(status=="confirmed"){
		return "已確認"
	}
	if(status=="advanced"){
		return "已晉級"
	}
	if(status=="cancelled"){
		return "已取消"
	}
	return status||"-"
}

function checkinstatusbadge(status){
	let cls="bg-zinc-700 text-zinc-300"
	if(status=="registered"){
		cls="bg-yellow-900/40 text-yellow-300"
	}else if(status=="confirmed"){
		cls="bg-green-900/40 text-green-300"
	}else if(status=="advanced"){
		cls="bg-sky-900/40 text-sky-300"
	}else if(status=="cancelled"){
		cls="bg-zinc-700 text-zinc-400"
	}
	return `<span class="inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold ${cls}">${checkinstatustext(status)}</span>`
}

function checkinerrorcard(message){
	return `
		<div class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
			<div class="text-lg font-bold text-red-300">${escapehtml(message)}</div>
			<div class="mt-4 flex flex-wrap justify-center gap-2">
				<a href="sessionlist.html" class="rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-5 py-2 text-sm font-bold text-white">場次列表</a>
			</div>
		</div>
	`
}

function checkininforow(label,value){
	return `
		<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
			<div class="text-xs text-zinc-500">${escapehtml(label)}</div>
			<div class="mt-1 text-base font-semibold text-zinc-100">${escapehtml(value)}</div>
		</div>
	`
}

function rendercheckin(d){
	let seat="未排座"
	if(d["tablename"]&&d["seatno"]){
		seat=d["tablename"]+" / Seat "+d["seatno"]
	}else if(d["seatno"]){
		seat="Seat "+d["seatno"]
	}
	let payment="現金"
	if(d["paymenttype"]=="ticket"){
		payment="票券"
	}
	let entryno="未確認"
	if((d["status"]=="confirmed"||d["status"]=="advanced")&&d["serialno"]!=null&&d["serialno"]!=""){
		entryno=d["serialno"]
	}
	let entryclass="text-5xl"
	if(isNaN(entryno)){
		entryclass="text-xl"
	}
	checkindata=d
	let titleline=d["seriestitle"]||d["clubname"]||""
	let sessionlink=""
	if(sessionid){
		sessionlink=`<a href="session.html?id=${encodeURIComponent(sessionid)}" class="rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-5 py-2 text-sm font-bold text-white">場次詳情</a>`
	}
	// 員工檢視且有獎金可發時，才顯示列印獎金收據。
	let prizelink=""
	if(d["canissue"]&&float(d["finalprize"])>0){
		prizelink=`<input type="button" id="printprizebtn" class="cursor-pointer rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-2 text-sm font-bold text-white" value="列印獎金收據">`
	}
	let html=`
		<div class="rounded-[28px] border border-zinc-800 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] md:p-8">
			<div class="flex items-center justify-between gap-3">
				<div class="min-w-0">
					${titleline?`<div class="text-sm text-emerald-300">${escapehtml(titleline)}</div>`:""}
					<div class="text-base font-semibold text-white break-words">${escapehtml(d["sessionname"]||"")}</div>
				</div>
				${checkinstatusbadge(d["status"])}
			</div>
			<div class="mt-4 flex items-end justify-between gap-3">
				<div class="min-w-0">
					<div class="text-xs text-zinc-500">選手</div>
					<div class="text-3xl font-extrabold text-white break-words">${escapehtml(d["playername"]||"-")}</div>
					<div class="text-sm text-zinc-500">${escapehtml(d["playerplayerid"]||"")}</div>
				</div>
				<div class="text-right">
					<div class="text-xs text-zinc-500">入場編號</div>
					<div class="${entryclass} font-extrabold text-emerald-400">${escapehtml(entryno)}</div>
				</div>
			</div>
			<div class="mt-5 grid grid-cols-2 gap-3">
				${checkininforow("牌桌",d["tablename"]||"未排座")}
				${checkininforow("座位",d["seatno"]||"-")}
				${checkininforow("買入",(d["buyin"]||0)+" ("+payment+")")}
				${checkininforow("Reentry",d["reentrycount"]||0)}
			</div>
			<div class="mt-6 flex flex-wrap gap-2">
				${prizelink}
				${sessionlink}
			</div>
		</div>
	`
	innerhtml("#checkinmain",html,false)
	onclick("#printprizebtn",function(element,event){
		receiptprizeprint(buildprizereceiptdata(checkindata))
	})
}

// 把報到資料組成獎金發放收據所需欄位。
function buildprizereceiptdata(d){
	let basepath=location.pathname.replace(/[^/]*$/,"")
	let qrdata=location.origin+basepath+"checkin.html?s="+encodeURIComponent(sessionid)+"&r="+encodeURIComponent(registrationid)
	return {
		"seriestitle": d["seriestitle"]||"",
		"venue": d["clubname"]||"",
		"event": d["sessionname"]||"",
		"starttime": d["starttime"]||"",
		"playername": d["playername"]||"",
		"place": d["place"]||"",
		"prize": d["finalprize"]||0,
		"entryno": d["serialno"]||"",
		"issuedate": ptprinttimestamp(),
		"issuer": "",
		"qrdata": qrdata
	}
}

function loadcheckin(){
	if(!registrationid){
		innerhtml("#checkinmain",checkinerrorcard("網址缺少報名參數"),false)
		return
	}
	ajax("GET",AJAXURL+"getcheckininfo/"+encodeURIComponent(registrationid),function(event,data){
		if(!data["success"]){
			innerhtml("#checkinmain",checkinerrorcard(pterror(data["data"]||"載入失敗")),false)
			return
		}
		rendercheckin(data["data"])
	},null,[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
	],{
		loadingtarget: "#checkinmain"
	})
}

loadcheckin()
