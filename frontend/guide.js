function guidetext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["guidepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["guidepage"][key]||key
}

function guidechapters(){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["guidepage"]||!TRANSLATE[LANGUAGE]["guidepage"]["chapters"]){
		return []
	}
	return TRANSLATE[LANGUAGE]["guidepage"]["chapters"]
}

function applyguidelanguage(){
	document.title=guidetext("title")+" - PokerTrace"
	let metatag=domgetid("guidedescriptionmeta")
	if(metatag){
		metatag.setAttribute("content",guidetext("description"))
	}
	let heading=domgetid("guideheading")
	if(heading){
		heading.textContent=guidetext("heading")
	}
	let lead=domgetid("guidelead")
	if(lead){
		lead.textContent=guidetext("lead")
	}
	let chapterlabel=domgetid("guidechapterlabel")
	if(chapterlabel){
		chapterlabel.textContent=guidetext("chapterlabel")
	}
	let expandall=domgetid("guideexpandall")
	if(expandall){
		expandall.value=guidetext("expandall")
	}
	let collapseall=domgetid("guidecollapseall")
	if(collapseall){
		collapseall.value=guidetext("collapseall")
	}
}

function guidechapterbyid(chapterid){
	let chapters=guidechapters()
	for(let i=0;i<chapters.length;i=i+1){
		if(chapters[i]["id"]==chapterid){
			return chapters[i]
		}
	}
	return chapters[0]||null
}

function guideallitemids(){
	let ids=[]
	let chapters=guidechapters()
	for(let i=0;i<chapters.length;i=i+1){
		ids.push(chapters[i]["id"])
		for(let j=0;j<chapters[i]["items"].length;j=j+1){
			ids.push(chapters[i]["items"][j]["id"])
		}
	}
	return ids
}

function guiderenderbuttons(){
	let html=""
	let chapters=guidechapters()
	for(let i=0;i<chapters.length;i=i+1){
		let activeclass="bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
		if(i==0){
			activeclass="bg-emerald-500 text-zinc-950"
		}
		html=html+`<a href="#${chapters[i]["id"]}" class="guidebtn mb-2 block w-full whitespace-nowrap rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${activeclass}" data-guide="${chapters[i]["id"]}">${chapters[i]["title"]}</a>`
	}
	innerhtml("#guidebuttons",html,false)
}

function guidecopybutton(itemid){
	return `
		<input type="button" class="guidecopybtn inline-flex min-h-11 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700" data-copy-id="${itemid}" value="${guidetext("copylink")}">
	`
}

function guidestepshtml(item){
	if(!item["steps"]||!item["steps"].length){
		return ""
	}
	let lis=""
	for(let i=0;i<item["steps"].length;i=i+1){
		lis=lis+`
			<li class="flex gap-3">
				<span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-300">${i+1}</span>
				<span class="leading-7">${item["steps"][i]}</span>
			</li>
		`
	}
	return `
		<div class="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/45 p-4">
			<div class="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-500">${guidetext("stepslabel")}</div>
			<ol class="space-y-2 text-sm text-zinc-300">${lis}</ol>
		</div>
	`
}

function guidetoolshtml(item){
	if(!item["tools"]||!item["tools"].length){
		return ""
	}
	let rows=""
	for(let i=0;i<item["tools"].length;i=i+1){
		rows=rows+`
			<div class="flex flex-col gap-0.5 border-t border-zinc-800/70 pt-2 first:border-t-0 first:pt-0 sm:flex-row sm:gap-3">
				<dt class="font-bold text-zinc-200 sm:w-44 sm:shrink-0">${item["tools"][i]["name"]}</dt>
				<dd class="leading-7 text-zinc-400">${item["tools"][i]["use"]}</dd>
			</div>
		`
	}
	return `
		<div class="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900/45 p-4">
			<div class="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-500">${guidetext("toolslabel")}</div>
			<dl class="space-y-2 text-sm">${rows}</dl>
		</div>
	`
}

function guidetiphtml(item){
	if(!item["tip"]){
		return ""
	}
	return `
		<div class="mt-3 flex gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
			<span class="text-[12px] font-bold uppercase tracking-[0.12em] text-emerald-300">${guidetext("tiplabel")}</span>
			<span class="text-sm leading-7 text-emerald-100/90">${item["tip"]}</span>
		</div>
	`
}

function guideitemhtml(item,index){
	let pagebutton=""
	if(item["pageurl"]){
		pagebutton=`
			<a href="${item["pageurl"]}" class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400">
				${item["pagelabel"]||guidetext("pagefallback")}
			</a>
		`
	}
	return `
		<article id="${item["id"]}" class="scroll-mt-28 rounded-[24px] border border-zinc-800 bg-zinc-950/65 shadow-[0_18px_40px_rgba(0,0,0,0.16)]" data-guide-item="${item["id"]}">
			<div class="guideitemhead flex cursor-pointer select-none items-center gap-3 p-5" role="button" tabindex="0">
				<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 font-bold text-emerald-300">${index+1}</div>
				<div class="min-w-0 flex-1">
					<h3 class="text-lg font-extrabold text-white">${item["title"]}</h3>
					<a href="#${item["id"]}" class="text-xs font-bold text-emerald-300 transition hover:text-emerald-200">#${item["id"]}</a>
				</div>
				<span class="guidechevron shrink-0 text-xs text-zinc-500 transition">▼</span>
			</div>
			<div class="guideitembody hidden px-5 pb-5">
				<p class="text-sm leading-7 text-zinc-400">${item["desc"]}</p>
				${guidestepshtml(item)}
				${guidetoolshtml(item)}
				${guidetiphtml(item)}
				<div class="mt-4 flex flex-wrap gap-2">
					${pagebutton}
					<a href="#${item["id"]}" class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800">${guidetext("position")}</a>
					${guidecopybutton(item["id"])}
				</div>
			</div>
		</article>
	`
}

function guidechapterhtml(chapter){
	let itemshtml=""
	for(let i=0;i<chapter["items"].length;i=i+1){
		itemshtml=itemshtml+guideitemhtml(chapter["items"][i],i)
	}
	return `
		<section id="${chapter["id"]}" class="guidesection scroll-mt-24 rounded-[28px] border border-zinc-800 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] md:p-8" data-guide-section="${chapter["id"]}">
			<div class="guidechapterhead flex cursor-pointer select-none flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" role="button" tabindex="0">
				<div class="flex items-center gap-3">
					<div class="min-w-0">
						<div class="text-sm font-bold text-emerald-300">${guidetext("chaptereyebrow")}</div>
						<h2 class="mt-1 text-2xl font-extrabold tracking-tight text-white">${chapter["title"]}</h2>
					</div>
					<span class="guidechapterchevron shrink-0 text-xs text-zinc-500 transition">▼</span>
				</div>
				<div class="flex flex-wrap gap-2">
					<a href="#${chapter["id"]}" class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700">${guidetext("chapterlink")}</a>
					<a href="pokertraceintro.pdf" download class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700">${guidetext("downloadpdf")}</a>
				</div>
			</div>
			<div class="guidechapterbody mt-5">
				<p class="mb-5 leading-7 text-zinc-400">${chapter["lead"]}</p>
				<div class="grid gap-3">${itemshtml}</div>
			</div>
		</section>
	`
}

function renderguide(){
	let html=""
	let chapters=guidechapters()
	for(let i=0;i<chapters.length;i=i+1){
		html=html+guidechapterhtml(chapters[i])
	}
	innerhtml("#guidesections",html,false)
	let sections=document.querySelectorAll("[data-guide-section]")
	for(let i=0;i<sections.length;i=i+1){
		setguidechapteropen(sections[i],true)
	}
}

function setguideitemopen(article,opened){
	let body=article.querySelector(".guideitembody")
	if(!body){
		return
	}
	body.classList.toggle("hidden",!opened)
	let chevron=article.querySelector(".guidechevron")
	if(chevron){
		chevron.classList.toggle("rotate-180",opened)
	}
}

function setguidechapteropen(section,opened){
	let body=section.querySelector(".guidechapterbody")
	if(!body){
		return
	}
	body.classList.toggle("hidden",!opened)
	let chevron=section.querySelector(".guidechapterchevron")
	if(chevron){
		chevron.classList.toggle("rotate-180",opened)
	}
}

function toggleguidehead(head,event){
	if(event.target.closest("a")||event.target.closest("input")){
		return
	}
	let article=head.closest("[data-guide-item]")
	if(article){
		let body=article.querySelector(".guideitembody")
		setguideitemopen(article,body.classList.contains("hidden"))
		return
	}
	let section=head.closest("[data-guide-section]")
	if(section){
		let body=section.querySelector(".guidechapterbody")
		setguidechapteropen(section,body.classList.contains("hidden"))
	}
}

function bindguidetoggles(){
	let heads=document.querySelectorAll(".guideitemhead,.guidechapterhead")
	for(let i=0;i<heads.length;i=i+1){
		heads[i].addEventListener("click",function(event){
			toggleguidehead(this,event)
		})
		heads[i].addEventListener("keydown",function(event){
			if(event.key=="Enter"||event.key==" "){
				event.preventDefault()
				toggleguidehead(this,event)
			}
		})
	}
}

function setallguideopen(opened){
	let articles=document.querySelectorAll("[data-guide-item]")
	for(let i=0;i<articles.length;i=i+1){
		setguideitemopen(articles[i],opened)
	}
	let sections=document.querySelectorAll("[data-guide-section]")
	for(let i=0;i<sections.length;i=i+1){
		setguidechapteropen(sections[i],true)
	}
}

function bindguideexpandbuttons(){
	onclick("#guideexpandall",function(){
		setallguideopen(true)
	})
	onclick("#guidecollapseall",function(){
		setallguideopen(false)
	})
}

function expandguidetarget(target){
	let article=target.closest("[data-guide-item]")
	if(article){
		setguideitemopen(article,true)
	}
	let section=target.closest("[data-guide-section]")
	if(section){
		setguidechapteropen(section,true)
	}
}

function setactiveguidebutton(sectionid){
	let buttons=document.querySelectorAll(".guidebtn")
	for(let i=0;i<buttons.length;i=i+1){
		let activeed=buttons[i].getAttribute("data-guide")==sectionid
		buttons[i].classList.toggle("bg-emerald-500",activeed)
		buttons[i].classList.toggle("text-zinc-950",activeed)
		buttons[i].classList.toggle("bg-zinc-800",!activeed)
		buttons[i].classList.toggle("text-zinc-300",!activeed)
	}
}

function guidehashvalue(){
	return (location.hash||"").replace("#","")
}

function guidescrolltohash(hashid,behavior){
	let targetid=hashid||"start"
	let target=domgetid(targetid)
	if(!target){
		let chapter=guidechapterbyid(targetid)
		if(chapter){
			target=domgetid(chapter["id"])
			// 這裡原本還有一行 targetid=chapter["id"]，但 targetid 在這之後
			// 沒有任何地方會再讀它（下面用的是 target 與 target.dataset），
			// 移除的那段 #start fallback 也只是賦值。是死賦值，一併清掉。
		}
	}
	// 這裡原本還有一段「都找不到就捲到 #start」的 fallback，
	// 但 guide.html 從來沒有 id="start" 的元素（所有備份都沒有），
	// 章節是 JS 動態塞進 #guidesections 的、各有自己的 id，
	// 所以那段永遠不成立，等於直接落到下面的 return。行為完全不變，只是把死路拿掉。
	// （tools/audit/scandeadreference.js 掃出來的）
	if(!target){
		return
	}
	expandguidetarget(target)
	target.scrollIntoView({
		"behavior": behavior||"smooth",
		"block": "start"
	})
	let chapterid=target.dataset.guideSection||""
	if(chapterid==""){
		let parent=target.closest("[data-guide-section]")
		if(parent){
			chapterid=parent.dataset.guideSection||""
		}
	}
	if(chapterid==""){
		chapterid="start"
	}
	setactiveguidebutton(chapterid)
}

function guidechapterfromnode(node){
	if(!node){
		return "start"
	}
	if(node.dataset.guideSection){
		return node.dataset.guideSection
	}
	let parent=node.closest("[data-guide-section]")
	if(parent){
		return parent.dataset.guideSection
	}
	return "start"
}

function bindguidebuttons(){
	let buttons=document.querySelectorAll(".guidebtn")
	for(let i=0;i<buttons.length;i=i+1){
		buttons[i].addEventListener("click",function(event){
			event.preventDefault()
			let targetid=this.getAttribute("data-guide")
			history.replaceState(null,"","#"+targetid)
			guidescrolltohash(targetid,"smooth")
		})
	}
}

function bindguidecopybuttons(){
	let buttons=document.querySelectorAll(".guidecopybtn")
	for(let i=0;i<buttons.length;i=i+1){
		buttons[i].addEventListener("click",function(event){
			event.preventDefault()
			let itemid=this.getAttribute("data-copy-id")
			let copyurl=location.origin+location.pathname+"#"+itemid
			if(navigator.clipboard&&navigator.clipboard.writeText){
				navigator.clipboard.writeText(copyurl).then(function(){
					pttoastsuccess(guidetext("copysuccess"))
				}).catch(function(){
					pttoasterror(guidetext("copyfail"))
				})
			}else{
				pttoastwarning(guidetext("copyunsupported"))
			}
		})
	}
}

function bindguidescrollstate(){
	let sections=document.querySelectorAll("[data-guide-section]")
	if(!sections.length){
		return
	}
	let observer=new IntersectionObserver(function(entries){
		let currentid=""
		for(let i=0;i<entries.length;i=i+1){
			if(entries[i].isIntersecting){
				currentid=guidechapterfromnode(entries[i].target)
				break
			}
		}
		if(currentid){
			setactiveguidebutton(currentid)
		}
	},{
		"rootMargin": "-20% 0px -60% 0px",
		"threshold": 0.2
	})
	for(let i=0;i<sections.length;i=i+1){
		observer.observe(sections[i])
	}
}

function bindguidehashchange(){
	window.addEventListener("hashchange",function(){
		guidescrolltohash(guidehashvalue(),"smooth")
	})
}

function initguide(){
	applyguidelanguage()
	guiderenderbuttons()
	renderguide()
	bindguidebuttons()
	bindguidecopybuttons()
	bindguidetoggles()
	bindguideexpandbuttons()
	bindguidescrollstate()
	bindguidehashchange()
	let itemids=guideallitemids()
	let hashid=guidehashvalue()
	if(!hashid){
		setactiveguidebutton("start")
		return
	}
	let matched=false
	for(let i=0;i<itemids.length;i=i+1){
		if(itemids[i]==hashid){
			matched=true
			break
		}
	}
	if(!matched){
		history.replaceState(null,"","#start")
		setactiveguidebutton("start")
		return
	}
	setTimeout(function(){
		guidescrolltohash(hashid,"auto")
	},60)
}

initguide()
