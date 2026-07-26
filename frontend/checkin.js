// 報到核對頁：掃描收據 QR 後開啟，網址帶 sessionid(場次id) 與 r(報名id)。
// 另一種進法是掃描頁的手動輸入：帶 sessionid 與 entry(收據上的入場編號 serialno)，
// 入場編號只在單一場次內唯一，所以一定要有場次，走 getcheckininfobyentry。
// 目前為唯讀核對版：查出該筆報名並顯示選手 / 狀態 / 桌座 / 買入。報到動作之後再加。
//
// 參數名以 sessionid 為準，但一定要相容舊的 s：已經印出去的收據 QR 內含 ?s=，
// 改名後那些紙本仍要掃得動，所以讀取一律「新的優先、沒有才回退舊的」。
let sessionid=getget("sessionid")||getget("s")
let registrationid=getget("r")
let entryno=getget("entry")
let checkindata=null

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function checkintext(key,fallbacktext){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["checkinpage"]&&TRANSLATE[LANGUAGE]["checkinpage"][key]){
		return TRANSLATE[LANGUAGE]["checkinpage"][key]
	}
	if(fallbacktext!=null){
		return fallbacktext
	}
	return key
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

// 帶場次進來(從報名工作台掃碼)時，返回目標回該場次的報名工作台；沒帶場次才回場次列表。
function checkinbacklink(){
	if(sessionid){
		return `<a href="register.html?sessionid=${encodeURIComponent(sessionid)}" class="rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-5 py-2 text-sm font-bold text-white">${escapehtml(checkintext("backregister","回報名工作台"))}</a>`
	}
	return `<a href="sessionlist.html" class="rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-5 py-2 text-sm font-bold text-white">${escapehtml(checkintext("backsessionlist","場次列表"))}</a>`
}

function checkinerrorcard(message){
	return `
		<div class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
			<div class="text-lg font-bold text-red-300">${escapehtml(message)}</div>
			<div class="mt-4 flex flex-wrap justify-center gap-2">
				${checkinbacklink()}
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
	// 掃到的是前一日的收據、該選手已晉級時，後端會自動沿鏈回傳最新一場的資料，
	// 這裡明確告知現場人員「這張舊收據仍有效，看到的是最新場次」，免得以為掃錯或重印。
	let advancenotice=""
	if(d["followedadvanceed"]){
		let noticetext=checkintext("advancefollowed","此收據為「{from}」的報到憑證，該選手已晉級，以下顯示「{current}」的最新資料。")
		noticetext=noticetext.replace("{from}",d["advancedfrom"]||"").replace("{current}",d["currentsessionname"]||"")
		advancenotice=`<div class="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">${escapehtml(noticetext)}</div>`
	}
	let html=`
		<div class="rounded-[28px] border border-zinc-800 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] md:p-8">
			${advancenotice}
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
	// 手動輸入(entry)進來時網址沒有 r，改用後端回傳的 sessionplayerid 組 QR，收據 QR 才掃得動。
	let receiptregistrationid=registrationid||d["sessionplayerid"]||""
	let receiptsessionid=sessionid||d["sessionid"]||""
	let qrdata=location.origin+basepath+"checkin.html?sessionid="+encodeURIComponent(receiptsessionid)+"&r="+encodeURIComponent(receiptregistrationid)
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
	// r(報名id) 優先照舊走 getcheckininfo；只有 entry(入場編號) 時走 getcheckininfobyentry，需要 s(場次id)。
	let requesturl=""
	let entryed=false
	if(registrationid){
		requesturl=AJAXURL+"getcheckininfo/"+encodeURIComponent(registrationid)
	}else if(entryno&&sessionid){
		requesturl=AJAXURL+"getcheckininfobyentry/"+encodeURIComponent(sessionid)+"/"+encodeURIComponent(entryno)
		entryed=true
	}
	if(!requesturl){
		let message=checkintext("missingparam")
		if(entryno&&!sessionid){
			message=checkintext("missingsession")
		}
		innerhtml("#checkinmain",checkinerrorcard(message),false)
		return
	}
	ajax("GET",requesturl,function(event,data){
		if(!data["success"]){
			let message=pterror(data["data"]||checkintext("loadfail"))
			// 手動輸入查不到時要指名是入場編號打錯，不要顯示看不懂的「找不到報名資料」。
			if(entryed&&data["data"]=="ERROR_registration_not_found"){
				message=checkintext("entrynotfound")
			}
			innerhtml("#checkinmain",checkinerrorcard(message),false)
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
