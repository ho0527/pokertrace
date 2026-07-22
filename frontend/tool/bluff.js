function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function bftext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["bluffpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["bluffpage"][key]||key
}

function gcd(a,b){
	a=Math.round(a)
	b=Math.round(b)
	while(b){
		let t=b
		b=a%b
		a=t
	}
	return a||1
}

function calcbluff(){
	let pot=num(getvalue("bfpot"))
	let bet=num(getvalue("bfbet"))
	let value=num(getvalue("bfvalue"))
	if(pot<=0||bet<=0){
		innertext("#bfsize","-",false)
		innertext("#bffrac","-",false)
		innertext("#bfratio","-",false)
		innertext("#bfcombo","-",false)
		return
	}
	let size=bet/pot*100
	let frac=bet/(pot+2*bet)*100
	let g=gcd(pot+bet,bet)
	let ratio=((pot+bet)/g)+" : "+(bet/g)
	let combos=value*bet/(pot+bet)
	innertext("#bfsize",(Math.round(size*10)/10)+"%",false)
	innertext("#bffrac",(Math.round(frac*10)/10)+"%",false)
	innertext("#bfratio",ratio,false)
	innertext("#bfcombo",(function(){if(value>0){return (Math.round(combos*10)/10).toString()}return "-"})(),false)
}

function applybflanguage(){
	document.title=bftext("title")+" - PokerTrace"
	innertext("#bftitle",bftext("title"),false)
	innertext("#back",bftext("back"),false)
	innertext("#bfpotlabel",bftext("pot"),false)
	innertext("#bfbetlabel",bftext("bet"),false)
	innertext("#bfvaluelabel",bftext("value"),false)
	innertext("#bfsizelabel",bftext("size"),false)
	innertext("#bffraclabel",bftext("frac"),false)
	innertext("#bfratiolabel",bftext("ratio"),false)
	innertext("#bfcombolabel",bftext("combo"),false)
	innertext("#bfnote",bftext("note"),false)
}

oninput("#bfpot",calcbluff)
oninput("#bfbet",calcbluff)
oninput("#bfvalue",calcbluff)

applybflanguage()
calcbluff()
