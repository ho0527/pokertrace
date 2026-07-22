function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function satext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["satellitepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["satellitepage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcsa(){
	let entries=num(getvalue("saentries"))
	let buyin=num(getvalue("sabuyin"))
	let seat=num(getvalue("saseat"))
	let pool=entries*buyin
	let seats=(function(){if(seat>0){return Math.floor(pool/seat)}return 0})()
	let cash=pool-seats*seat
	let ratio=(function(){if(seats>0){return entries/seats}return 0})()
	innertext("#sapool","$"+moneyfmt(pool),false)
	innertext("#saseats",String(seats),false)
	innertext("#sacash","$"+moneyfmt(cash),false)
	innertext("#saratio",(function(){if(seats>0){return (Math.round(ratio*10)/10).toString()}return "-"})(),false)
}

function applysalanguage(){
	document.title=satext("title")+" - PokerTrace"
	innertext("#satitle",satext("title"),false)
	innertext("#back",satext("back"),false)
	innertext("#saentrieslabel",satext("entries"),false)
	innertext("#sabuyinlabel",satext("buyin"),false)
	innertext("#saseatlabel",satext("seat"),false)
	innertext("#sapoollabel",satext("pool"),false)
	innertext("#saseatslabel",satext("seats"),false)
	innertext("#sacashlabel",satext("cash"),false)
	innertext("#saratiolabel",satext("ratio"),false)
	innertext("#sanote",satext("note"),false)
}

oninput("#saentries",calcsa)
oninput("#sabuyin",calcsa)
oninput("#saseat",calcsa)

applysalanguage()
calcsa()
