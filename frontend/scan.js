// 報到 QR 掃描器：優先用瀏覽器內建 BarcodeDetector 讀相機畫面；不支援時改用
// 本地 jsqr.js（jsQR）以 canvas 取幀解碼。辨識到收據 QR（checkin 網址）後自動
// 開啟該筆報到核對頁。兩者都不可用或相機失敗時提供手動輸入。
// 手動輸入用的是收據上印的「入場編號」(sessionplayer.serialno)，只在單一場次內
// 唯一，所以要先選場次；QR 走的則是 sessionplayer.id，兩者不同不可混用。

let scanstream=null
let scandetector=null
let scantimer=null
let scancanvas=null
let scanbusy=false
let scanhandled=false
let scanstarting=false
// 從場次頁 / 報名清單頁點進來時會帶 ?s=<場次id>，用來預選場次。
// 參數名以 sessionid 為準，仍相容舊的 s（已印出的收據 QR 內含 ?s=）
const SCANURLSESSIONID=getget("sessionid")||getget("s")||""
// 手動輸入只列「還在進行中」的場次：結束超過一天的就不列，避免下拉塞滿舊場次。
const SCANSESSIONMAXAGEMS=24*60*60*1000

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function scantext(key){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["scanpage"]&&TRANSLATE[LANGUAGE]["scanpage"][key]){
		return TRANSLATE[LANGUAGE]["scanpage"][key]
	}
	return key
}

// 手動輸入區文案走 translate；查不到翻譯時 scantext 會回 key，這時保留 HTML 既有文案不覆蓋。
function scansettext(id,key){
	let element=domgetid(id)
	let text=scantext(key)
	if(element&&text!=key){
		element.textContent=text
	}
}

// 手動輸入的場次下拉：清單直接用 getsessionlist（後端只回本人擁有 / 受聘 / 可報名的場次），
// 前端再留下「主辦場次 + 自己可操作（isown / isstaff） + 尚未結束」的，才是能報到的場。
function scanloadsessionlist(){
	let select=domgetid("scanmanualsession")
	if(select){
		select.innerHTML=`<option value="">${escapehtml(scantext("sessionloading"))}</option>`
		ajax("GET",AJAXURL+"getsessionlist?limit=200&page=1",function(event,data){
			if(!data["success"]){
				select.innerHTML=`<option value="">${escapehtml(scantext("sessionfail"))}</option>`
				return
			}
			let list=(data["data"]||{})["sessions"]||[]
			let optionlist=[]
			let selectedid=""
			for(let i=0;i<list.length;i=i+1){
				let row=list[i]
				let operateded=row["isown"]==true||row["isstaff"]==true
				let recented=true
				let endtime=row["endtime"]||row["starttime"]||""
				if(endtime){
					let endtimems=new Date(String(endtime).replace(" ","T")).getTime()
					if(!isNaN(endtimems)){
						recented=(Date.now()-endtimems)<SCANSESSIONMAXAGEMS
					}
				}
				let usableed=row["owned"]==true&&operateded&&row["sessionended"]!=true&&recented
				// 網址指定的場次一律列出來（可能已結束或較舊），才不會點進來反而選不到。
				if(String(row["id"])==String(SCANURLSESSIONID)&&operateded){
					usableed=true
					selectedid=String(row["id"])
				}
				if(usableed){
					let starttime=ptformatdatetimeminute(row["starttime"])
					let name=row["name"]||""
					if(starttime){
						name=name+"（"+starttime+"）"
					}
					optionlist.push({
						"id": String(row["id"]),
						"name": name
					})
				}
			}
			let html=""
			if(optionlist.length<1){
				html=`<option value="">${escapehtml(scantext("sessionempty"))}</option>`
			}else{
				// 只有一個可選時不放提示選項，讓它自動選定，工作人員不用多點一次。
				if(1<optionlist.length&&!selectedid){
					html=`<option value="">${escapehtml(scantext("sessionrequired"))}</option>`
				}
				for(let i=0;i<optionlist.length;i=i+1){
					html=html+`<option value="${escapehtml(optionlist[i]["id"])}">${escapehtml(optionlist[i]["name"])}</option>`
				}
			}
			select.innerHTML=html
			if(selectedid){
				select.value=selectedid
				// 從場次頁 / 報名工作台帶 ?s= 進來時場次已經確定, 不需要再讓使用者挑,
				// 把下拉換成固定文字顯示, 避免誤選到別場而查不到人。
				let fixedbox=domgetid("scanmanualsessionfixed")
				if(fixedbox){
					let picked=select.selectedOptions&&select.selectedOptions[0]?select.selectedOptions[0].textContent:""
					fixedbox.textContent=picked
					fixedbox.classList.remove("hidden")
					fixedbox.classList.add("flex")
					select.classList.add("hidden")
				}
			}
		},null,[
			["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
		])
	}
}

function scanstatus(text,kind){
	let box=domgetid("scanstatus")
	if(!box){
		return
	}
	box.textContent=text
	let color="text-zinc-400"
	if(kind=="success"){
		color="text-emerald-300"
	}else if(kind=="warning"){
		color="text-yellow-300"
	}else if(kind=="error"){
		color="text-red-300"
	}
	box.className="mt-3 min-h-6 text-sm "+color
}

function scanstop(){
	if(scantimer){
		clearInterval(scantimer)
		scantimer=null
	}
	if(scanstream){
		let tracks=scanstream.getTracks()
		for(let i=0;i<tracks.length;i=i+1){
			tracks[i].stop()
		}
		scanstream=null
	}
	let video=domgetid("scanvideo")
	if(video){
		video.srcObject=null
	}
}

// 解析掃到的內容：取 checkin 網址裡的 s / r，導向報到頁。
function scangoto(value){
	if(scanhandled){
		return
	}
	let target=""
	try{
		let parsed=new URL(value)
		let s=parsed.searchParams.get("sessionid")||parsed.searchParams.get("s")
		let r=parsed.searchParams.get("r")
		if(r){
			target="checkin.html?"
			if(s){
				target=target+"sessionid="+encodeURIComponent(s)+"&"
			}
			target=target+"r="+encodeURIComponent(r)
		}
	}catch(error){
		target=""
	}
	if(!target){
		scanstatus(scantext("notcheckinqr")+value,"warning")
		return
	}
	scanhandled=true
	scanstop()
	scanstatus(scantext("going"),"success")
	href(target)
}

function scandetectloop(){
	if(scanbusy||scanhandled||!scandetector){
		return
	}
	let video=domgetid("scanvideo")
	if(!video||video.readyState<2){
		return
	}
	scanbusy=true
	scandetector.detect(video).then(function(codes){
		scanbusy=false
		if(codes&&codes.length>0&&codes[0]["rawValue"]){
			scangoto(codes[0]["rawValue"])
		}
	}).catch(function(error){
		scanbusy=false
	})
}

// jsQR fallback：從視訊流取一幀畫到 canvas，getImageData 丟給 jsQR 解碼，
// 解到值走與 BarcodeDetector 相同的 scangoto 流程。
function scanjsqrloop(){
	if(scanbusy||scanhandled){
		return
	}
	let video=domgetid("scanvideo")
	if(!video||video.readyState<2||!video.videoWidth||!video.videoHeight){
		return
	}
	scanbusy=true
	if(!scancanvas){
		scancanvas=document.createElement("canvas")
	}
	scancanvas.width=video.videoWidth
	scancanvas.height=video.videoHeight
	let context=scancanvas.getContext("2d",{"willReadFrequently": true})
	context.drawImage(video,0,0,scancanvas.width,scancanvas.height)
	let imagedata=context.getImageData(0,0,scancanvas.width,scancanvas.height)
	let code=jsQR(imagedata.data,scancanvas.width,scancanvas.height)
	scanbusy=false
	if(code&&code["data"]){
		scangoto(code["data"])
	}
}

function scanpolling(){
	if(scantimer||scanhandled||!scanstream){
		return
	}
	if(scandetector){
		scantimer=setInterval(scandetectloop,300)
	}else{
		scantimer=setInterval(scanjsqrloop,250)
	}
}

function scancamerastart(){
	navigator.mediaDevices.getUserMedia({"video": {"facingMode": "environment"}}).then(function(stream){
		scanstarting=false
		scanstream=stream
		let video=domgetid("scanvideo")
		video.srcObject=stream
		video.play()
		scanstatus(scantext("aim"),"info")
		scanpolling()
	}).catch(function(error){
		scanstarting=false
		scanstatus(scantext("camerafail"),"error")
	})
}

function scanstart(){
	if(scanstarting){
		return
	}
	scanhandled=false
	scandetector=null
	if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
		scanstatus(scantext("camerafail"),"error")
		return
	}
	if(("BarcodeDetector" in window)&&BarcodeDetector.getSupportedFormats){
		scanstarting=true
		BarcodeDetector.getSupportedFormats().then(function(formatlist){
			let supported=false
			for(let i=0;i<formatlist.length;i=i+1){
				if(formatlist[i]=="qr_code"){
					supported=true
				}
			}
			if(supported){
				try{
					scandetector=new BarcodeDetector({"formats": ["qr_code"]})
				}catch(error){
					scandetector=null
				}
			}
			if(scandetector||typeof jsQR=="function"){
				scancamerastart()
			}else{
				scanstarting=false
				scanstatus(scantext("nosupport"),"warning")
			}
		}).catch(function(error){
			if(typeof jsQR=="function"){
				scandetector=null
				scancamerastart()
			}else{
				scanstarting=false
				scanstatus(scantext("nosupport"),"warning")
			}
		})
	}else if(typeof jsQR=="function"){
		scanstarting=true
		scancamerastart()
	}else{
		scanstatus(scantext("nosupport"),"warning")
	}
}

// 分頁隱藏時暫停解碼輪詢，回到前景再恢復，避免背景白耗 CPU。
document.addEventListener("visibilitychange",function(){
	if(document.hidden){
		if(scantimer){
			clearInterval(scantimer)
			scantimer=null
		}
	}else{
		scanpolling()
	}
})

onclick("#scanrestart",function(element,event){
	scanstop()
	scanstart()
})

// 手動輸入送出的是「場次 + 入場編號」，checkin.html 會改打 getcheckininfobyentry。
onclick("#scanmanualgo",function(element,event){
	let select=domgetid("scanmanualsession")
	let manualsessionid=""
	if(select){
		manualsessionid=select.value
	}
	let manual=getvalue("scanmanualinput")
	if(!manualsessionid){
		pttoast(scantext("sessionrequired"),"warning")
	}else if(!manual){
		pttoast(scantext("manualempty"),"warning")
	}else{
		scanstop()
		href("checkin.html?sessionid="+encodeURIComponent(manualsessionid)+"&entry="+encodeURIComponent(manual))
	}
})

scansettext("scanmanualhint","manualhint")
scansettext("scanmanualsessionlabel","manualsessionlabel")
scansettext("scanmanualentrylabel","manualentrylabel")
if(domgetid("scanmanualinput")&&scantext("manualentrylabel")!="manualentrylabel"){
	domgetid("scanmanualinput").setAttribute("placeholder",scantext("manualentrylabel"))
}
// 帶場次進來(從報名工作台掃碼)時，返回目標回該場次的報名工作台；沒帶場次才回場次列表。
if(SCANURLSESSIONID&&domgetid("scanback")){
	domgetid("scanback").href="register.html?sessionid="+encodeURIComponent(SCANURLSESSIONID)
}
scanloadsessionlist()
scanstart()
