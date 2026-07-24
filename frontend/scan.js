// 報到 QR 掃描器：優先用瀏覽器內建 BarcodeDetector 讀相機畫面；不支援時改用
// 本地 jsqr.js（jsQR）以 canvas 取幀解碼。辨識到收據 QR（checkin 網址）後自動
// 開啟該筆報到核對頁。兩者都不可用或相機失敗時提供手動輸入。

let scanstream=null
let scandetector=null
let scantimer=null
let scancanvas=null
let scanbusy=false
let scanhandled=false
let scanstarting=false

if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

function scantext(key){
	if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["scanpage"]&&TRANSLATE[LANGUAGE]["scanpage"][key]){
		return TRANSLATE[LANGUAGE]["scanpage"][key]
	}
	return key
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

onclick("#scanmanualgo",function(element,event){
	let manual=getvalue("scanmanualinput")
	if(!manual){
		pttoast(scantext("manualempty"),"warning")
		return
	}
	scanstop()
	href("checkin.html?r="+encodeURIComponent(manual))
})

scanstart()
