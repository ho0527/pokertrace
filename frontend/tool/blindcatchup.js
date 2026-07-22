function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function bctext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["blindcatchuppage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["blindcatchuppage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function durtext(minutes){
	let h=Math.floor(minutes/60)
	let m=Math.round(minutes%60)
	if(h<=0){
		return m+" "+bctext("min")
	}
	return h+" "+bctext("hour")+" "+m+" "+bctext("min")
}

function calcbc(){
	let stack=num(getvalue("bcstack"))
	let bb=num(getvalue("bcbb"))
	let mult=num(getvalue("bcmult"))
	let levelmin=num(getvalue("bclevelmin"))
	let threshold=num(getvalue("bcthreshold"))
	if(bb<=0||mult<1||threshold<=0){
		innertext("#bcnow","-",false)
		innertext("#bclevels","-",false)
		innertext("#bctime","-",false)
		innertext("#bcthen","-",false)
		return
	}
	let nowbbcount=stack/bb
	innertext("#bcnow",(Math.round(nowbbcount*10)/10)+" BB",false)
	if(nowbbcount<threshold){
		innertext("#bclevels",bctext("already"),false)
		innertext("#bctime","-",false)
		innertext("#bcthen",(Math.round(nowbbcount*10)/10)+" BB",false)
		return
	}
	if(mult<=1){
		innertext("#bclevels","-",false)
		innertext("#bctime","-",false)
		innertext("#bcthen","-",false)
		return
	}
	let n=0
	let curbb=bb
	while(stack/curbb>=threshold&&n<200){
		curbb=curbb*mult
		n=n+1
	}
	if(n>=200&&stack/curbb>=threshold){
		// 升盲倍數太小（例如 1.001），200 級內還到不了門檻；顯示 >200 並把時間 / 屆時大盲數留白，避免給出被截斷的錯誤答案。
		innertext("#bclevels",">200 "+bctext("levels"),false)
		innertext("#bctime","-",false)
		innertext("#bcthen","-",false)
	}else{
		innertext("#bclevels",n+" "+bctext("levels"),false)
		innertext("#bctime",durtext(n*levelmin),false)
		innertext("#bcthen",(Math.round(stack/curbb*10)/10)+" BB",false)
	}
}

function applybclanguage(){
	document.title=bctext("title")+" - PokerTrace"
	innertext("#bctitle",bctext("title"),false)
	innertext("#back",bctext("back"),false)
	innertext("#bcstacklabel",bctext("stack"),false)
	innertext("#bcbblabel",bctext("bb"),false)
	innertext("#bcmultlabel",bctext("mult"),false)
	innertext("#bclevelminlabel",bctext("levelmin"),false)
	innertext("#bcthresholdlabel",bctext("threshold"),false)
	innertext("#bcnowlabel",bctext("now"),false)
	innertext("#bclevelslabel",bctext("levelsto"),false)
	innertext("#bctimelabel",bctext("time"),false)
	innertext("#bcthenlabel",bctext("then"),false)
	innertext("#bcnote",bctext("note"),false)
}

oninput("#bcstack",calcbc)
oninput("#bcbb",calcbc)
oninput("#bcmult",calcbc)
oninput("#bclevelmin",calcbc)
oninput("#bcthreshold",calcbc)

applybclanguage()
calcbc()
