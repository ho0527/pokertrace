function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function wltext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["waitlistpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["waitlistpage"][key]||key
}

function durtext(minutes){
	let total=Math.round(minutes)
	let h=Math.floor(total/60)
	let m=total-h*60
	if(h<=0){
		return m+" "+wltext("min")
	}
	return h+" "+wltext("hour")+" "+m+" "+wltext("min")
}

function calcwl(){
	let list=num(getvalue("wllist"))
	let pos=num(getvalue("wlpos"))
	let rate=num(getvalue("wlrate"))
	if(rate<=0){
		innertext("#wlyou",wltext("never"),false)
		innertext("#wlall",wltext("never"),false)
		return
	}
	let youMin=pos/rate*60
	let allMin=list/rate*60
	innertext("#wlyou",durtext(youMin),false)
	innertext("#wlall",durtext(allMin),false)
}

function applywllanguage(){
	document.title=wltext("title")+" - PokerTrace"
	innertext("#wltitle",wltext("title"),false)
	innertext("#back",wltext("back"),false)
	innertext("#wllistlabel",wltext("list"),false)
	innertext("#wlposlabel",wltext("pos"),false)
	innertext("#wlratelabel",wltext("rate"),false)
	innertext("#wlyoulabel",wltext("you"),false)
	innertext("#wlalllabel",wltext("all"),false)
	innertext("#wlnote",wltext("note"),false)
}

oninput("#wllist",calcwl)
oninput("#wlpos",calcwl)
oninput("#wlrate",calcwl)

applywllanguage()
calcwl()
