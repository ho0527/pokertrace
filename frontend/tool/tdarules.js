let tdacurrentlang="zhtw"

const TDAPDF={
	zhtw: "tdazhtw.pdf",
	en: "tdaen.pdf"
}

function tdatext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["tdarulespage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["tdarulespage"][key]||key
}

// 語言切換鈕以 innerHTML 重繪（樣式內嵌），避免外掛在綁定時重置 input 樣式
function tdarenderlangbar(){
	let bar=domgetid("tdalangbar")
	if(!bar){
		return
	}
	let options=[["zhtw",tdatext("zhtw")],["en",tdatext("en")]]
	let html=""
	for(let i=0;i<options.length;i=i+1){
		let key=options[i][0]
		let label=options[i][1]
		let cls="bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
		if(key==tdacurrentlang){
			cls="bg-emerald-500 text-white"
		}
		html=html+`<input type="button" data-tdalang="${key}" class="min-h-10 cursor-pointer rounded-full px-5 text-sm font-bold transition ${cls}" value="${label}">`
	}
	bar.innerHTML=html
	let buttons=bar.querySelectorAll("[data-tdalang]")
	for(let i=0;i<buttons.length;i=i+1){
		buttons[i].addEventListener("click",function(){
			tdasetpdf(this.getAttribute("data-tdalang")||"zhtw")
		})
	}
}

function tdasetpdf(lang){
	if(lang!="en"){
		lang="zhtw"
	}
	tdacurrentlang=lang
	let pdf=TDAPDF[lang]
	let frame=domgetid("tdaframe")
	if(frame&&frame.getAttribute("src")!=pdf){
		frame.setAttribute("src",pdf)
	}
	let open=domgetid("tdaopennewtab")
	if(open){
		open.setAttribute("href",pdf)
	}
	tdarenderlangbar()
}

function applytdalanguage(){
	document.title=tdatext("title")+" - PokerTrace"
	innertext("#tdatitle",tdatext("title"),false)
	innertext("#back",tdatext("back"),false)
	innertext("#tdaopennewtab",tdatext("opennewtab"),false)
	innertext("#tdanote",tdatext("note"),false)
	tdarenderlangbar()
}

applytdalanguage()
tdasetpdf(LANGUAGE=="en"?"en":"zhtw")
