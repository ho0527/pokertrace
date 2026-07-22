let signedin=weblsget(WEBLSNAME+"signin")
let githuburl="https://github.com/ho0527/pokertrace"
let introdownloadurl="pokertraceintro.pdf"
let guideurl="guide.html"

function indextext(key){
	return (TRANSLATE[LANGUAGE]["indexpage"]||{})[key]||key
}

let TOOLLIST=[
	["tool/equity.html","toolequity"],
	["tool/range.html","toolgto"],
	["tool/tdarules.html","tooltdarule"],
	["tool/timebankdrill.html","tooltb"],
	["tool/potodds.html","toolpo"],
	["tool/apidoc.html","toolapidoc"]
]

function actionhtml(){
	let primary=signedin?[indextext("actionsessionlist"),"sessionlist.html"]:[indextext("actionsignin"),"signin.html"]
	return `
		<a href="${primary[1]}" class="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-5 py-3 rounded-lg transition">${primary[0]}</a>
		<a href="${guideurl}" class="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-bold px-5 py-3 rounded-lg transition">${indextext("actionguide")}</a>
		<a href="${githuburl}" target="_blank" rel="noopener" class="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-bold px-5 py-3 rounded-lg transition">${indextext("actiongithub")}</a>
		<a href="${introdownloadurl}" download class="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-bold px-5 py-3 rounded-lg transition">${indextext("actiondownloadpdf")}</a>
	`
}

function rendertexts(){
	document.title=indextext("title")
	innertext("#indexbadge",indextext("badge"),false)
	innertext("#heroname",indextext("heroname"),false)
	innertext("#herotagline",indextext("herotagline"),false)
	innertext("#herodesc",indextext("herodesc"),false)
	innertext("#step1title",indextext("step1title"),false)
	innertext("#step1desc",indextext("step1desc"),false)
	innertext("#step2title",indextext("step2title"),false)
	innertext("#step2desc",indextext("step2desc"),false)
	innertext("#step3title",indextext("step3title"),false)
	innertext("#step3desc",indextext("step3desc"),false)
	innertext("#problemtitle",indextext("problemtitle"),false)
	innertext("#problemdesc",indextext("problemdesc"),false)
	innertext("#shot1title",indextext("shot1title"),false)
	innertext("#shot1desc",indextext("shot1desc"),false)
	innertext("#shot2title",indextext("shot2title"),false)
	innertext("#shot2desc",indextext("shot2desc"),false)
	innertext("#contactkicker",indextext("contactkicker"),false)
	innertext("#contacttitle",indextext("contacttitle"),false)
	innertext("#contactdesc",indextext("contactdesc"),false)
	innertext("#contactbtn",indextext("contactbtn"),false)
	innertext("#bottomtitle",indextext("bottomtitle"),false)
	innertext("#bottomdesc",indextext("bottomdesc"),false)
	innertext("#toolstitle",indextext("toolstitle"),false)
	innertext("#toolssubtitle",indextext("toolssubtitle"),false)
}

function rendertools(){
	let html=""
	let count=0
	for(let i=0;i<TOOLLIST.length;i=i+1){
		let href=TOOLLIST[i][0]
		let key=TOOLLIST[i][1]
		// 正式區（pokertrace.net）隱藏還沒通過的維護中工具；測試機 / 本機照常全顯示。
		if(typeof pttoolitemvisible=="function"&&!pttoolitemvisible(href)){
			continue
		}
		count=count+1
		html=html+`
			<a href="${href}" class="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-emerald-500">
				<div class="text-lg font-bold text-white">${indextext(key+"title")}</div>
				<div class="mt-1 text-sm text-zinc-400 leading-6">${indextext(key+"desc")}</div>
			</a>
		`
	}
	innerhtml("#indextools",html,false)
	let section=domgetid("indextoolsection")
	if(section){
		if(count<1){
			section.classList.add("hidden")
		}else{
			section.classList.remove("hidden")
		}
	}
}

function renderhomeactions(){
	innerhtml("#homeactions",actionhtml(),false)
	innerhtml("#bottomactions",actionhtml(),false)
}

function renderfeatures(){
	let html=""
	for(let i=1;i<=12;i=i+1){
		html=html+`
			<div class="indexfeature">
				<div class="font-bold">${indextext("feat"+i+"title")}</div>
				<div class="text-sm text-zinc-400 mt-2 leading-6">${indextext("feat"+i+"desc")}</div>
			</div>
		`
	}
	innerhtml("#featurelist",html,false)
}

function rendermobilenavcta(){
	let node=domgetid("mobilepagetitle")
	if(!node){
		return
	}
	let label=signedin?indextext("navmobilehome"):indextext("navmobilesignin")
	let target=signedin?"main.html":"signin.html"
	// 拔掉 id，讓 initialize.js 的 syncmobilepagetitle() 不再覆寫此節點
	node.removeAttribute("id")
	node.classList.remove("mobilepagetitle")
	node.classList.add("indexmobilenavcta")
	node.innerHTML=`<a href="${target}" class="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-4 py-1.5 text-sm transition">${label}</a>`
}

rendertexts()
renderhomeactions()
renderfeatures()
rendertools()
rendermobilenavcta()
