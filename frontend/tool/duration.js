function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function dutext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["durationpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["durationpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function durationtext(minutes){
	let h=Math.floor(minutes/60)
	let m=Math.round(minutes%60)
	if(h<=0){
		return m+" "+dutext("min")
	}
	return h+" "+dutext("hour")+" "+m+" "+dutext("min")
}

function calcduration(){
	let entries=num(getvalue("duentries"))
	let stack=num(getvalue("dustack"))
	let factor=num(getvalue("dufactor"))
	let startbb=num(getvalue("dustartbb"))
	let mult=num(getvalue("dumult"))
	let levelmin=num(getvalue("dulevelmin"))
	let breakevery=Math.floor(num(getvalue("dubreakevery")))
	let breakmin=num(getvalue("dubreakmin"))
	let target=getvalue("dutarget")
	let finishbb=num(getvalue("dufinishbb"))
	if(factor<1){
		factor=1
	}
	if(mult<=1||startbb<=0||finishbb<=0||entries<1){
		innertext("#dutotalchips","-",false)
		innertext("#dulevels","-",false)
		innertext("#duendbb","-",false)
		innertext("#dutotal","-",false)
		return
	}
	let totalchips=entries*stack*factor
	let remainplayers=(target=="ft"?9:2)
	let endbb=totalchips/remainplayers/finishbb
	let levels=1
	let bb=startbb
	while(bb<endbb&&levels<200){
		bb=bb*mult
		levels=levels+1
	}
	let playmin=levels*levelmin
	let breaks=(function(){if(breakevery>0){return Math.floor((levels-1)/breakevery)*breakmin}return 0})()
	let totalmin=playmin+breaks
	innertext("#dutotalchips",moneyfmt(totalchips),false)
	innertext("#dulevels","L"+levels,false)
	innertext("#duendbb",moneyfmt(bb),false)
	innertext("#dutotal",durationtext(totalmin),false)
}

function applydulanguage(){
	document.title=dutext("title")+" - PokerTrace"
	innertext("#dutitle",dutext("title"),false)
	innertext("#back",dutext("back"),false)
	innertext("#duinputtitle",dutext("inputtitle"),false)
	innertext("#duentrieslabel",dutext("entries"),false)
	innertext("#dustacklabel",dutext("stack"),false)
	innertext("#dufactorlabel",dutext("factor"),false)
	innertext("#dustartbblabel",dutext("startbb"),false)
	innertext("#dumultlabel",dutext("mult"),false)
	innertext("#dulevelminlabel",dutext("levelmin"),false)
	innertext("#dubreakeverylabel",dutext("breakevery"),false)
	innertext("#dubreakminlabel",dutext("breakmin"),false)
	innertext("#dutargetlabel",dutext("target"),false)
	innertext("#dufinishbblabel",dutext("finishbb"),false)
	innertext("#dutotalchipslabel",dutext("totalchips"),false)
	innertext("#dulevelslabel",dutext("levels"),false)
	innertext("#duendbblabel",dutext("endbb"),false)
	innertext("#dutotallabel",dutext("total"),false)
	innertext("#dunote",dutext("note"),false)
	let opts=document.querySelectorAll("#dutarget option")
	if(opts[0]){
		opts[0].textContent=dutext("champion")
	}
	if(opts[1]){
		opts[1].textContent=dutext("ft")
	}
}

oninput("#duentries",calcduration)
oninput("#dustack",calcduration)
oninput("#dufactor",calcduration)
oninput("#dustartbb",calcduration)
oninput("#dumult",calcduration)
oninput("#dulevelmin",calcduration)
oninput("#dubreakevery",calcduration)
oninput("#dubreakmin",calcduration)
oninput("#dufinishbb",calcduration)
onchange("#dutarget",calcduration)

applydulanguage()
calcduration()
