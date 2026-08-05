function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function sptext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["splitpotpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["splitpotpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcsplit(){
	let pot=num(getvalue("sppot"))
	let ways=Math.floor(num(getvalue("spways")))
	let chip=num(getvalue("spchip"))
	if(ways<2){
		ways=2
	}
	if(ways>10){
		ways=10
	}
	if(chip<1){
		chip=1
	}
	let units=Math.floor(pot/chip)
	let baseunits=Math.floor(units/ways)
	let base=baseunits*chip
	let oddunits=units-baseunits*ways
	let odd=oddunits*chip
	let remainder=pot-units*chip
	// 面額被手動改成牌組裡沒有的值時取消選取，不留殘影
	ptchipstripselect(domgetid("spchipstrip"),chip)
	innertext("#spbase","$"+moneyfmt(base),false)
	innertext("#spodd","$"+moneyfmt(odd),false)
	innertext("#spremainder","$"+moneyfmt(remainder),false)
	removeclass("#spremainder",["text-amber-400","text-zinc-200"])
	addclass("#spremainder",[(function(){if(remainder>0){return "text-amber-400"}return "text-zinc-200"})()])

	let html=""
	for(let i=0;i<ways;i=i+1){
		let extra=0
		if(i<oddunits){
			extra=chip
		}
		let amount=base+extra
		let tag=(function(){if(extra>0){return ` <span class="text-amber-400">(+$${moneyfmt(extra)})</span>`}return ""})()
		html=html+`
			<div class="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<span class="text-zinc-300">${sptext("seat")} ${i+1}</span>
				<span class="font-mono font-bold text-white">$${moneyfmt(amount)}${tag}</span>
			</div>
		`
	}
	innerhtml("#sprows",html,false)
}

function loadspprofilechips(){
	ptloadprofilechiplist(function(chiplist){
		if(!chiplist||chiplist.length<1){
			return
		}
		// 列出整組牌組供點選，使用者看得出系統挑了哪一顆、也能一鍵換掉
		innerhtml("#spchipstrip",ptchipstriphtml(chiplist,true),false)
		ptchipswatchapply(domgetid("spchipstrip"),chiplist)
		ptchipstripbind(domgetid("spchipstrip"),function(pickedvalue){
			value("#spchip",pickedvalue)
			calcsplit()
		})
		// 預設仍沿用最小面額，與改版前行為一致
		value("#spchip",chiplist[0]["value"])
		calcsplit()
	})
}

function applysplanguage(){
	document.title=sptext("title")+" - PokerTrace"
	innertext("#sptitle",sptext("title"),false)
	innertext("#back",sptext("back"),false)
	innertext("#sppotlabel",sptext("pot"),false)
	innertext("#spwayslabel",sptext("ways"),false)
	innertext("#spchiplabel",sptext("chip"),false)
	value("#spprofilechips",pttoolchiptext("load"))
	innertext("#spbaselabel",sptext("base"),false)
	innertext("#spoddlabel",sptext("odd"),false)
	innertext("#spremainderlabel",sptext("remainder"),false)
	innertext("#spnote",sptext("note"),false)
	calcsplit()
}

oninput("#sppot",calcsplit)
oninput("#spways",calcsplit)
oninput("#spchip",calcsplit)
onclick("#spprofilechips",loadspprofilechips)

applysplanguage()
calcsplit()
