function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function cutext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["coloruppage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["coloruppage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

// 已載入的個人牌組（[{value,color,shape,label}]）。空陣列代表沒載入過，明細列就不上色。
let culoadedchiplist=[]

function calccolorup(){
	let amount=num(getvalue("cuamount"))
	let raw=String(getvalue("cudenom")||"").split(",")
	let denoms=[]
	for(let i=0;i<raw.length;i=i+1){
		let d=parseInt(raw[i],10)
		if(d>0&&denoms.indexOf(d)==-1){
			denoms.push(d)
		}
	}
	denoms.sort(function(a,b){return b-a})
	let remaining=amount
	let totalchips=0
	let result=[]
	for(let i=0;i<denoms.length;i=i+1){
		let c=Math.floor(remaining/denoms[i])
		remaining=remaining-c*denoms[i]
		totalchips=totalchips+c
		result.push({denom:denoms[i],count:c})
	}
	let html=""
	for(let i=0;i<result.length;i=i+1){
		html=html+`
			<div class="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				${ptchipswatchhtml(result[i].denom)}
				<span class="font-mono text-zinc-300">$${moneyfmt(result[i].denom)}</span>
				<span class="ml-auto font-mono font-bold text-white">${moneyfmt(result[i].count)} ${cutext("pieces")}</span>
			</div>
		`
	}
	innerhtml("#curows",html,false)
	// 手動改過面額字串後，不在已載入牌組裡的面額會自動隱藏色塊，不留上一次的顏色
	ptchipswatchapply(domgetid("curows"),culoadedchiplist)
	innertext("#cuchips",moneyfmt(totalchips),false)
	innertext("#cucovered","$"+moneyfmt(amount-remaining),false)
	innertext("#curemain","$"+moneyfmt(remaining),false)
}

function loadcuprofilechips(){
	ptloadprofilechiplist(function(chiplist){
		if(!chiplist||chiplist.length<1){
			return
		}
		culoadedchiplist=chiplist
		// 色帶固定呈現「這次載入了什麼」，不隨使用者後續手動編輯面額字串而變動
		innerhtml("#custrip",ptchipstriphtml(chiplist,false),false)
		ptchipswatchapply(domgetid("custrip"),chiplist)
		let denomlist=[]
		for(let i=0;i<chiplist.length;i=i+1){
			denomlist.push(chiplist[i]["value"])
		}
		denomlist.sort(function(a,b){
			return b-a
		})
		value("#cudenom",denomlist.join(", "))
		calccolorup()
	})
}

function applyculanguage(){
	document.title=cutext("title")+" - PokerTrace"
	innertext("#cutitle",cutext("title"),false)
	innertext("#back",cutext("back"),false)
	innertext("#cuamountlabel",cutext("amount"),false)
	innertext("#cudenomlabel",cutext("denomlabel"),false)
	value("#cuprofilechips",pttoolchiptext("load"))
	innertext("#cudenomtitle",cutext("denomtitle"),false)
	innertext("#cuchipslabel",cutext("chips"),false)
	innertext("#cucoveredlabel",cutext("covered"),false)
	innertext("#curemainlabel",cutext("remain"),false)
	innertext("#cunote",cutext("note"),false)
}

oninput("#cuamount",calccolorup)
oninput("#cudenom",calccolorup)
onclick("#cuprofilechips",loadcuprofilechips)

applyculanguage()
calccolorup()
