function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function bztext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["bubblepressurepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["bubblepressurepage"][key]||key
}

function calcbz(){
	let remain=num(getvalue("bzremain"))
	let paid=num(getvalue("bzpaid"))
	let stack=num(getvalue("bzstack"))
	let avg=num(getvalue("bzavg"))
	let dist=remain-paid
	let rel=(function(){if(avg>0){return stack/avg}return 0})()
	innertext("#bzdist",(function(){if(dist>0){return dist+" "+bztext("people")}return bztext("inmoney")})(),false)
	innertext("#bzrel",(function(){if(avg>0){return (Math.round(rel*100)/100)+"×"}return "-"})(),false)
	let level
	let color
	let advice
	if(dist<=0){
		level=bztext("lvnone")
		color="text-emerald-400"
		advice=bztext("advnone")
	}else if((dist<=3&&rel<1)||(dist<=6&&rel<0.6)){
		level=bztext("lvextreme")
		color="text-red-400"
		advice=bztext("advextreme")
	}else if((dist<=6&&rel<1.3)||(dist<=12&&rel<0.8)){
		level=bztext("lvhigh")
		color="text-amber-400"
		advice=bztext("advhigh")
	}else if(rel>=1.5){
		level=bztext("lvlow")
		color="text-emerald-400"
		advice=bztext("advlow")
	}else{
		level=bztext("lvmed")
		color="text-zinc-200"
		advice=bztext("advmed")
	}
	innertext("#bzlevel",level,false)
	innertext("#bzadvice",advice,false)
	removeclass("#bzlevel",["text-red-400","text-amber-400","text-emerald-400","text-zinc-200"])
	addclass("#bzlevel",[color])
}

function applybzlanguage(){
	document.title=bztext("title")+" - PokerTrace"
	innertext("#bztitle",bztext("title"),false)
	innertext("#back",bztext("back"),false)
	innertext("#bzremainlabel",bztext("remain"),false)
	innertext("#bzpaidlabel",bztext("paid"),false)
	innertext("#bzstacklabel",bztext("stack"),false)
	innertext("#bzavglabel",bztext("avg"),false)
	innertext("#bzdistlabel",bztext("dist"),false)
	innertext("#bzrellabel",bztext("rel"),false)
	innertext("#bzlevellabel",bztext("level"),false)
	innertext("#bznote",bztext("note"),false)
	calcbz()
}

oninput("#bzremain",calcbz)
oninput("#bzpaid",calcbz)
oninput("#bzstack",calcbz)
oninput("#bzavg",calcbz)

applybzlanguage()
calcbz()
