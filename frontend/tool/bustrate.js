function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function butext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["bustratepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["bustratepage"][key]||key
}

function durtext(minutes){
	let h=Math.floor(minutes/60)
	let m=Math.round(minutes%60)
	if(h<=0){
		return m+" "+butext("min")
	}
	return h+" "+butext("hour")+" "+m+" "+butext("min")
}

function calcbu(){
	let start=num(getvalue("bustart"))
	let current=num(getvalue("bucurrent"))
	let elapsed=num(getvalue("buelapsed"))
	let target=num(getvalue("butarget"))
	let busted=start-current
	if(elapsed<=0||busted<=0){
		innertext("#burate","-",false)
		innertext("#bueta","-",false)
		innertext("#butotal","-",false)
		return
	}
	let rateperhour=busted/elapsed*60
	innertext("#burate",(Math.round(rateperhour*10)/10)+" "+butext("perhour"),false)
	let tobust=current-target
	if(tobust<=0){
		innertext("#bueta",butext("reached"),false)
		innertext("#butotal",durtext(elapsed),false)
		return
	}
	let etamin=tobust/(busted/elapsed)
	innertext("#bueta",durtext(etamin),false)
	innertext("#butotal",durtext(elapsed+etamin),false)
}

function applybulanguage(){
	document.title=butext("title")+" - PokerTrace"
	innertext("#butitle",butext("title"),false)
	innertext("#back",butext("back"),false)
	innertext("#bustartlabel",butext("start"),false)
	innertext("#bucurrentlabel",butext("current"),false)
	innertext("#buelapsedlabel",butext("elapsed"),false)
	innertext("#butargetlabel",butext("target"),false)
	innertext("#buratelabel",butext("rate"),false)
	innertext("#buetalabel",butext("eta"),false)
	innertext("#butotallabel",butext("total"),false)
	innertext("#bunote",butext("note"),false)
}

oninput("#bustart",calcbu)
oninput("#bucurrent",calcbu)
oninput("#buelapsed",calcbu)
oninput("#butarget",calcbu)

applybulanguage()
calcbu()
