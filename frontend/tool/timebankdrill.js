function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

let TBKEY=WEBLSNAME+"timebankdrill"

let tbstate={
	presets: [],
	seconds: 30,
	remaining: 30,
	running: false,
	tickid: 0,
	tapcount: 0,
	taptimer: 0
}

function tbtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["timebankdrillpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["timebankdrillpage"][key]||key
}

// preset 的 label 由使用者輸入且存進 localStorage，未跳脫直接進 innerHTML 會變成可持久化的 self-XSS
function tbesc(text){
	return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

function loadpresets(){
	let raw=weblsget(TBKEY)
	let list=null
	if(raw){
		try{
			list=JSON.parse(raw)
		}catch(error){
			list=null
		}
	}
	if(!list||!list.length){
		list=[
			{ seconds: 30,label: "30s" },
			{ seconds: 60,label: "60s" },
			{ seconds: 15,label: "15s" }
		]
	}
	tbstate.presets=list
}

function savepresets(){
	weblsset(TBKEY,JSON.stringify(tbstate.presets))
}

function tbbeep(){
	try{
		let ctx=new (window.AudioContext||window.webkitAudioContext)()
		let osc=ctx.createOscillator()
		let gain=ctx.createGain()
		osc.connect(gain)
		gain.connect(ctx.destination)
		osc.frequency.value=880
		gain.gain.value=0.2
		osc.start()
		setTimeout(function(){
			osc.stop()
			ctx.close()
		},300)
	}catch(error){
	}
}

function rendertimer(){
	innertext("#tbcount",String(tbstate.remaining),false)
	let hint=tbtext("taptostart")
	if(tbstate.running){
		hint=tbtext("taptopause")
	}else if(tbstate.remaining<=0){
		hint=tbtext("timeup")
	}else if(tbstate.remaining!=tbstate.seconds){
		hint=tbtext("taptoresume")
	}
	innertext("#tbhint",hint,false)
	let timer=domgetid("tbtimer")
	timer.classList.toggle("tbexpired",tbstate.remaining<=0)
}

function stoptick(){
	if(tbstate.tickid){
		clearInterval(tbstate.tickid)
		tbstate.tickid=0
	}
}

function starttick(){
	stoptick()
	tbstate.running=true
	tbstate.tickid=setInterval(function(){
		tbstate.remaining=tbstate.remaining-1
		if(tbstate.remaining<=0){
			tbstate.remaining=0
			tbstate.running=false
			stoptick()
			tbbeep()
		}
		rendertimer()
	},1000)
	rendertimer()
}

function pausetick(){
	stoptick()
	tbstate.running=false
	rendertimer()
}

function resettimer(seconds,autostart){
	tbstate.seconds=seconds
	tbstate.remaining=seconds
	if(autostart){
		starttick()
	}else{
		stoptick()
		tbstate.running=false
		rendertimer()
	}
}

function taptfeedback(){
	let timer=domgetid("tbtimer")
	if(!timer){
		return
	}
	let prev=timer.style.borderColor
	timer.style.borderColor="var(--color-primary)"
	setTimeout(function(){
		timer.style.borderColor=prev
	},100)
}

function handletap(){
	taptfeedback()
	tbstate.tapcount=tbstate.tapcount+1
	if(tbstate.taptimer){
		clearTimeout(tbstate.taptimer)
	}
	tbstate.taptimer=setTimeout(function(){
		let taps=tbstate.tapcount
		tbstate.tapcount=0
		if(taps>=3){
			// 連點多下：重置目前秒數並繼續
			resettimer(tbstate.seconds,true)
		}else{
			// 一下或兩下都視為單擊：暫停 / 開始切換
			toggletimer()
		}
	},420)
}

function toggletimer(){
	if(tbstate.running){
		pausetick()
	}else{
		if(tbstate.remaining<=0){
			resettimer(tbstate.seconds,true)
		}else{
			starttick()
		}
	}
}

function renderpresetbuttons(){
	let host=domgetid("tbpresets")
	host.innerHTML=""
	for(let i=0;i<tbstate.presets.length;i=i+1){
		let p=tbstate.presets[i]
		let btn=document.createElement("div")
		btn.setAttribute("role","button")
		btn.setAttribute("tabindex","0")
		btn.className="min-h-14 cursor-pointer rounded-2xl bg-zinc-800 px-4 text-center text-base font-bold text-zinc-100 transition hover:bg-zinc-700 flex flex-col items-center justify-center"
		btn.innerHTML=`<div>${tbesc(p["label"]||p["seconds"]+"s")}</div><div class="text-xs text-zinc-400">${num(p["seconds"])}s</div>`
		btn.addEventListener("click",function(){
			resettimer(num(p["seconds"]),true)
		})
		btn.addEventListener("keydown",function(event){
			if(event.key=="Enter"||event.key==" "){
				event.preventDefault()
				resettimer(num(p["seconds"]),true)
			}
		})
		host.appendChild(btn)
	}
}

function renderpresetlist(){
	let host=domgetid("tbpresetlist")
	host.innerHTML=""
	for(let i=0;i<tbstate.presets.length;i=i+1){
		let p=tbstate.presets[i]
		let row=document.createElement("div")
		row.className="handrow"
		row.innerHTML=`
			<span class="handrow-label">${num(p["seconds"])}s</span>
			<div class="flex-1 px-2 text-sm text-zinc-300">${tbesc(p["label"]||"")}</div>
			<input type="button" class="handrow-remove" data-remove="${i}" value="${tbesc(tbtext("remove"))}">
		`
		host.appendChild(row)
	}
	let removes=host.querySelectorAll("[data-remove]")
	for(let i=0;i<removes.length;i=i+1){
		removes[i].addEventListener("click",function(){
			let idx=parseInt(this.getAttribute("data-remove"),10)
			tbstate.presets.splice(idx,1)
			savepresets()
			renderpresetbuttons()
			renderpresetlist()
		})
	}
}

function applytblanguage(){
	document.title=tbtext("title")+" - PokerTrace"
	innertext("#tbtitle",tbtext("title"),false)
	innertext("#tbback",tbtext("back"),false)
	innertext("#tbpresetslabel",tbtext("presets"),false)
	innertext("#tbsecondslabel",tbtext("seconds"),false)
	innertext("#tblabellabel",tbtext("label"),false)
	value("#tbadd",tbtext("add"))
	rendertimer()
}

onclick("#tbtimer",function(){
	handletap()
})

onclick("#tbadd",function(){
	let seconds=num(getvalue("tbnewseconds"))
	if(seconds<1){
		pttoast(tbtext("badseconds"),"warning")
		return
	}
	let label=getvalue("tbnewlabel")||(seconds+"s")
	tbstate.presets.push({ seconds: seconds,label: label })
	savepresets()
	value("#tbnewlabel","")
	renderpresetbuttons()
	renderpresetlist()
})

loadpresets()
tbstate.seconds=num(tbstate.presets[0]["seconds"])||30
tbstate.remaining=tbstate.seconds
applytblanguage()
renderpresetbuttons()
renderpresetlist()
rendertimer()
