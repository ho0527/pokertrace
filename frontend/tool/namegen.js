let NGDAYS=[
	{zh:"週五夜",en:"Friday Night"},
	{zh:"週末",en:"Weekend"},
	{zh:"平日午場",en:"Weekday Daytime"},
	{zh:"月底",en:"Month-End"},
	{zh:"假日",en:"Holiday"}
]
let NGTIERS=[
	{zh:"微注",en:"Micro"},
	{zh:"小資",en:"Small"},
	{zh:"標準",en:"Standard"},
	{zh:"高額",en:"High Roller"},
	{zh:"豪客",en:"Super High Roller"}
]
let NGFORMATS=[
	{zh:"無限注德州",en:"NLH"},
	{zh:"PKO 賞金",en:"PKO Bounty"},
	{zh:"深籌",en:"Deepstack"},
	{zh:"渦輪",en:"Turbo"},
	{zh:"短牌",en:"Short Deck"}
]
let NGFLAVORS=[
	{zh:"經典",en:"Classic"},
	{zh:"衝榜",en:"Leaderboard"},
	{zh:"嘉年華",en:"Carnival"},
	{zh:"菁英",en:"Elite"},
	{zh:"派對",en:"Party"}
]

function ngtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["namegenpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["namegenpage"][key]||key
}

function fillselect(id,list){
	let sel=domgetid(id)
	let html=""
	for(let i=0;i<list.length;i=i+1){
		let label=(function(){if(LANGUAGE=="en"){return list[i].en}return list[i].zh})()
		html=html+`<option value="${i}">${label}</option>`
	}
	sel.innerHTML=html
}

function pick(list,id){
	let i=parseInt(getvalue(id),10)||0
	return list[i]||list[0]
}

function calcng(){
	let day=pick(NGDAYS,"ngday")
	let tier=pick(NGTIERS,"ngtier")
	let format=pick(NGFORMATS,"ngformat")
	let flavor=pick(NGFLAVORS,"ngflavor")
	let names=[]
	if(LANGUAGE=="en"){
		names.push(day.en+" "+tier.en+" "+format.en)
		names.push(flavor.en+" Cup - "+format.en)
		names.push(tier.en+" "+format.en+" ("+day.en+")")
	}else{
		names.push(day.zh+tier.zh+format.zh+"賽")
		names.push(flavor.zh+"盃 · "+format.zh)
		names.push(tier.zh+format.zh+"（"+day.zh+"）")
	}
	let html=""
	for(let i=0;i<names.length;i=i+1){
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-lg font-bold text-emerald-400">${names[i]}</div>
		`
	}
	innerhtml("#ngrows",html,false)
}

function applynglanguage(){
	document.title=ngtext("title")+" - PokerTrace"
	innertext("#ngtitle",ngtext("title"),false)
	innertext("#back",ngtext("back"),false)
	innertext("#ngdaylabel",ngtext("day"),false)
	innertext("#ngtierlabel",ngtext("tier"),false)
	innertext("#ngformatlabel",ngtext("format"),false)
	innertext("#ngflavorlabel",ngtext("flavor"),false)
	innertext("#ngnote",ngtext("note"),false)
	fillselect("ngday",NGDAYS)
	fillselect("ngtier",NGTIERS)
	fillselect("ngformat",NGFORMATS)
	fillselect("ngflavor",NGFLAVORS)
	calcng()
}

onchange("#ngday",calcng)
onchange("#ngtier",calcng)
onchange("#ngformat",calcng)
onchange("#ngflavor",calcng)

applynglanguage()
