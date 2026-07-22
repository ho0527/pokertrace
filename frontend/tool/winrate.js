function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function wrtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["winratepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["winratepage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function signed(value){
	let rounded=Math.round(value)
	return (rounded>=0?"+$":"-$")+moneyfmt(Math.abs(rounded))
}

function calcwr(){
	let wr=num(getvalue("wrwinrate"))
	let bb=num(getvalue("wrbb"))
	let hands=num(getvalue("wrhands"))
	let hours=num(getvalue("wrhours"))
	let per100=wr/100*bb*100
	let hourly=wr/100*bb*hands
	let session=hourly*hours
	innertext("#wrper100",signed(per100),false)
	innertext("#wrhourly",signed(hourly),false)
	innertext("#wrsession",signed(session),false)
	removeclass("#wrhourly",["text-emerald-400","text-red-400"])
	addclass("#wrhourly",[(Math.round(hourly)>=0?"text-emerald-400":"text-red-400")])
	removeclass("#wrsession",["text-emerald-400","text-red-400"])
	addclass("#wrsession",[(Math.round(session)>=0?"text-emerald-400":"text-red-400")])
}

function applywrlanguage(){
	document.title=wrtext("title")+" - PokerTrace"
	innertext("#wrtitle",wrtext("title"),false)
	innertext("#back",wrtext("back"),false)
	innertext("#wrwinratelabel",wrtext("winrate"),false)
	innertext("#wrbblabel",wrtext("bb"),false)
	innertext("#wrhandslabel",wrtext("hands"),false)
	innertext("#wrhourslabel",wrtext("hours"),false)
	innertext("#wrper100label",wrtext("per100"),false)
	innertext("#wrhourlylabel",wrtext("hourly"),false)
	innertext("#wrsessionlabel",wrtext("session"),false)
	innertext("#wrnote",wrtext("note"),false)
}

oninput("#wrwinrate",calcwr)
oninput("#wrbb",calcwr)
oninput("#wrhands",calcwr)
oninput("#wrhours",calcwr)

applywrlanguage()
calcwr()
