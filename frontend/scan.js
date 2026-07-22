// 報到 QR 掃描器：用瀏覽器內建 BarcodeDetector（不依賴 CDN）讀相機畫面，
// 辨識到收據 QR（checkin 網址）後自動開啟該筆報到核對頁。不支援時提供手動輸入。

let scanstream=null
let scandetector=null
let scantimer=null
let scanbusy=false
let scanhandled=false
let scanstarting=false

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
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
		let s=parsed.searchParams.get("s")
		let r=parsed.searchParams.get("r")
		if(r){
			target="checkin.html?"
			if(s){
				target=target+"s="+encodeURIComponent(s)+"&"
			}
			target=target+"r="+encodeURIComponent(r)
		}
	}catch(error){
		target=""
	}
	if(!target){
		scanstatus("掃到內容，但不是報到 QR："+value,"warning")
		return
	}
	scanhandled=true
	scanstop()
	scanstatus("已辨識，前往報到頁…","success")
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

function scanstart(){
	if(scanstarting){
		return
	}
	scanhandled=false
	if(!("BarcodeDetector" in window)||!BarcodeDetector.getSupportedFormats){
		scanstatus("這個瀏覽器不支援內建 QR 掃描，請改用手機相機掃描收據 QR，或在下方手動輸入報名編號。","warning")
		return
	}
	if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
		scanstatus("無法存取相機，請改用手機相機或手動輸入。","warning")
		return
	}
	scanstarting=true
	BarcodeDetector.getSupportedFormats().then(function(formatlist){
		let supported=false
		for(let i=0;i<formatlist.length;i=i+1){
			if(formatlist[i]=="qr_code"){
				supported=true
			}
		}
		if(!supported){
			scanstarting=false
			scanstatus("這個瀏覽器不支援內建 QR 掃描，請改用手機相機掃描收據 QR，或在下方手動輸入報名編號。","warning")
			return
		}
		try{
			scandetector=new BarcodeDetector({"formats": ["qr_code"]})
		}catch(error){
			scanstarting=false
			scanstatus("無法建立 QR 掃描器，請手動輸入報名編號。","error")
			return
		}
		navigator.mediaDevices.getUserMedia({"video": {"facingMode": "environment"}}).then(function(stream){
			scanstarting=false
			scanstream=stream
			let video=domgetid("scanvideo")
			video.srcObject=stream
			video.play()
			scanstatus("將 QR 對準框內…","info")
			scantimer=setInterval(scandetectloop,300)
		}).catch(function(error){
			scanstarting=false
			scanstatus("相機啟動失敗（可能未授權相機權限）。請允許權限後按「重新啟動相機」，或手動輸入。","error")
		})
	}).catch(function(error){
		scanstarting=false
		scanstatus("無法建立 QR 掃描器，請手動輸入報名編號。","error")
	})
}

onclick("#scanrestart",function(element,event){
	scanstop()
	scanstart()
})

onclick("#scanmanualgo",function(element,event){
	let manual=getvalue("scanmanualinput")
	if(!manual){
		pttoast("請輸入報名編號","warning")
		return
	}
	scanstop()
	href("checkin.html?r="+encodeURIComponent(manual))
})

scanstart()
