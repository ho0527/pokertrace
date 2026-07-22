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
			<div class="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<span class="font-mono text-zinc-300">$${moneyfmt(result[i].denom)}</span>
				<span class="font-mono font-bold text-white">${moneyfmt(result[i].count)} ${cutext("pieces")}</span>
			</div>
		`
	}
	innerhtml("#curows",html,false)
	innertext("#cuchips",moneyfmt(totalchips),false)
	innertext("#cucovered","$"+moneyfmt(amount-remaining),false)
	innertext("#curemain","$"+moneyfmt(remaining),false)
}

function loadcuprofilechips(){
	ptloadprofilechipdenoms(function(denoms){
		if(!denoms||denoms.length<1){
			return
		}
		denoms.sort(function(a,b){
			return b-a
		})
		value("#cudenom",denoms.join(", "))
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
