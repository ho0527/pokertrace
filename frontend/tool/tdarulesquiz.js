let tdaquizlang=weblsget(WEBLSNAME+"tdarulesquizlanguage")||"zhtw"
let tdaquizcurrent=null
let tdaquizanswered=false
let tdaquizrighted=false
let tdaquiztotal=0
let tdaquizcorrect=0

const TDAQUIZTEXT={
	"zhtw": {
		"title": "TDA規則測驗",
		"progress": "第 ",
		"questionunit": " 題",
		"score": "答對 ",
		"modebody": "這段內容屬於哪一條規則？",
		"modetitle": "這個標題屬於哪一條規則？",
		"modedescription": "哪一段描述符合這條規則？",
		"correct": "答對了",
		"wrong": "正確答案是 ",
		"next": "下一題",
		"read": "查看規則"
	},
	"en": {
		"title": "TDA Rules Quiz",
		"progress": "Question ",
		"questionunit": "",
		"score": "Correct ",
		"modebody": "Which rule does this description belong to?",
		"modetitle": "Which rule does this title belong to?",
		"modedescription": "Which description matches this rule?",
		"correct": "Correct",
		"wrong": "Correct answer: ",
		"next": "Next question",
		"read": "Read rule"
	}
}

const TDAQUIZBUTTONCLASS="min-h-12 w-full rounded-lg bg-zinc-800 px-4 py-3 text-left text-sm font-bold leading-6 text-zinc-100 whitespace-normal break-words transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
const TDAQUIZRIGHTCLASS="min-h-12 w-full rounded-lg bg-emerald-500/20 px-4 py-3 text-left text-sm font-bold leading-6 text-emerald-100 whitespace-normal break-words ring-1 ring-emerald-400"

function tdaquiztext(key){
	let text=TDAQUIZTEXT[tdaquizlang][key]
	if(!text){
		text=TDAQUIZTEXT["zhtw"][key]||""
	}
	return text
}

function tdaquizsetlanguage(lang){
	if(lang!="en"){
		lang="zhtw"
	}
	tdaquizlang=lang
	tdacurrentlang=lang
	weblsset(WEBLSNAME+"tdarulesquizlanguage",lang)
	weblsset(WEBLSNAME+"tdaruleslanguage",lang)
	tdaquizrenderlanguage()
	tdaquizrenderquestion()
}

function tdaquizbody(item){
	let body=item["bodyzh"]||""
	if(tdaquizlang=="en"){
		body=item["bodyen"]||""
	}else{
		body=tdacleanzh(body)
	}
	body=tdanormalizeline(body)
	body=body.replace(/\[\[TDAREF:[^\]]+\]\]/g,"")
	body=body.replace(/\s+/g," ")
	return body.trim()
}

function tdaquiztitle(item){
	let title=item["titlezh"]||""
	if(tdaquizlang=="en"){
		title=item["titleen"]||""
	}else{
		title=tdacleanzh(title)
	}
	return title.trim()
}

function tdaquizlabel(item){
	let label="§"+item["number"]+" "+tdaquiztitle(item)
	if(item["group"]=="extra"){
		label=item["number"]+" "+tdaquiztitle(item)
	}
	return label
}

function tdaquizitemlist(){
	let itemlist=[]
	for(let i=0;i<TDAITEMLIST.length;i=i+1){
		let item=TDAITEMLIST[i]
		if(tdaquiztitle(item)!=""&&tdaquizbody(item)!=""){
			itemlist.push(item)
		}
	}
	return itemlist
}

function tdaquizrandomindex(length){
	return Math.floor(Math.random()*length)
}

function tdaquizshuffle(list){
	for(let i=list.length-1;0<i;i=i-1){
		let j=tdaquizrandomindex(i+1)
		let temp=list[i]
		list[i]=list[j]
		list[j]=temp
	}
	return list
}

function tdaquizpickoptions(itemlist,correctitem){
	let optionlist=[correctitem]
	let guard=0
	while(optionlist.length<4&&guard<200){
		let item=itemlist[tdaquizrandomindex(itemlist.length)]
		if(optionlist.indexOf(item)==-1){
			optionlist.push(item)
		}
		guard=guard+1
	}
	return tdaquizshuffle(optionlist)
}

function tdaquizexcerpt(text){
	let value=String(text||"")
	if(170<value.length){
		value=value.slice(0,170)+"..."
	}
	return value
}

function tdaquiznewquestion(){
	let itemlist=tdaquizitemlist()
	let correctitem=itemlist[tdaquizrandomindex(itemlist.length)]
	let mode=tdaquizrandomindex(3)
	tdaquizcurrent={
		"mode": mode,
		"correctitem": correctitem,
		"optionlist": tdaquizpickoptions(itemlist,correctitem)
	}
	tdaquizanswered=false
	tdaquizrighted=false
	tdaquiztotal=tdaquiztotal+1
	tdaquizrenderquestion()
}

function tdaquizanswer(key){
	if(!tdaquizanswered&&tdaquizcurrent){
		tdaquizanswered=true
		if(key==tdaquizcurrent["correctitem"]["key"]){
			tdaquizrighted=true
			tdaquizcorrect=tdaquizcorrect+1
		}
		tdaquizrenderquestion()
	}
}

function tdaquizoptiontext(item){
	let text=tdaquizlabel(item)
	if(tdaquizcurrent["mode"]==2){
		text=tdaquizexcerpt(tdaquizbody(item))
	}
	return text
}

function tdaquizrenderlanguage(){
	let zh=domgetid("tdaquizzh")
	let en=domgetid("tdaquizen")
	if(zh&&en){
		zh.className="min-h-10 rounded-lg px-4 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
		en.className=zh.className
		if(tdaquizlang=="en"){
			zh.className=zh.className+" bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
			en.className=en.className+" bg-emerald-500 text-white hover:bg-emerald-400"
		}else{
			zh.className=zh.className+" bg-emerald-500 text-white hover:bg-emerald-400"
			en.className=en.className+" bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
		}
	}
	document.title=tdaquiztext("title")+" - PokerTrace"
}

function tdaquizrenderquestion(){
	if(tdaquizcurrent){
		let mode=tdaquizcurrent["mode"]
		let correctitem=tdaquizcurrent["correctitem"]
		let modekey="modebody"
		let question=tdaquizexcerpt(tdaquizbody(correctitem))
		if(mode==1){
			modekey="modetitle"
			question=tdaquiztitle(correctitem)
		}
		if(mode==2){
			modekey="modedescription"
			question=tdaquizlabel(correctitem)
		}
		innertext("#tdaquizprogress",tdaquiztext("progress")+String(tdaquiztotal)+tdaquiztext("questionunit"),false)
		innertext("#tdaquizmode",tdaquiztext(modekey),false)
		innertext("#tdaquizscore",tdaquiztext("score")+String(tdaquizcorrect)+" / "+String(tdaquiztotal),false)
		innertext("#tdaquizquestion",question,false)
		let optionhtml=""
		for(let i=0;i<tdaquizcurrent["optionlist"].length;i=i+1){
			let item=tdaquizcurrent["optionlist"][i]
			let classvalue=TDAQUIZBUTTONCLASS
			let disabledtext=""
			if(tdaquizanswered){
				disabledtext=" disabled"
				if(item["key"]==correctitem["key"]){
					classvalue=TDAQUIZRIGHTCLASS
				}
			}
			optionhtml=optionhtml+`<button type="button" class="${escapehtml(classvalue)}" data-tdaquizanswer="${escapehtml(item["key"])}"${disabledtext}>${escapehtml(tdaquizoptiontext(item))}</button>`
		}
		innerhtml("#tdaquizoptionlist",optionhtml,false)
		tdaquizbindanswer()
		tdaquizrenderresult()
	}
}

function tdaquizrenderresult(){
	let result=domgetid("tdaquizresult")
	if(result&&tdaquizcurrent){
		if(tdaquizanswered){
			removeclass(result,["hidden"])
			let correctitem=tdaquizcurrent["correctitem"]
			let label=tdaquizlabel(correctitem)
			let href="tool/tdarule2024.html#tdaitem"+correctitem["key"]
			let html=""
			if(tdaquizrighted){
				html=`${escapehtml(tdaquiztext("correct"))}。 <a href="${escapehtml(href)}" class="text-emerald-200 underline decoration-emerald-400 underline-offset-4">${escapehtml(tdaquiztext("read"))}</a>`
				result.className="mt-5 rounded-lg bg-emerald-500/15 p-4 text-sm font-bold leading-6 text-emerald-100"
			}else{
				html=`${escapehtml(tdaquiztext("wrong"))}${escapehtml(label)}。 <a href="${escapehtml(href)}" class="text-emerald-200 underline decoration-emerald-400 underline-offset-4">${escapehtml(tdaquiztext("read"))}</a>`
				result.className="mt-5 rounded-lg bg-rose-500/15 p-4 text-sm font-bold leading-6 text-rose-100"
			}
			result.innerHTML=html
		}else{
			addclass(result,["hidden"])
			result.innerHTML=""
		}
	}
}

function tdaquizbindanswer(){
	let buttonlist=document.querySelectorAll("[data-tdaquizanswer]")
	for(let i=0;i<buttonlist.length;i=i+1){
		buttonlist[i].addEventListener("click",function(){
			tdaquizanswer(this.getAttribute("data-tdaquizanswer")||"")
		})
	}
}

let tdaquizzh=domgetid("tdaquizzh")
if(tdaquizzh){
	tdaquizzh.addEventListener("click",function(){
		tdaquizsetlanguage("zhtw")
	})
}

let tdaquizen=domgetid("tdaquizen")
if(tdaquizen){
	tdaquizen.addEventListener("click",function(){
		tdaquizsetlanguage("en")
	})
}

let tdaquiznext=domgetid("tdaquiznext")
if(tdaquiznext){
	tdaquiznext.addEventListener("click",tdaquiznewquestion)
}

tdaquizrenderlanguage()
innertext("#tdaquiznext",tdaquiztext("next"),false)
tdaquiznewquestion()
