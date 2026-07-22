function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function tftext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["tablefeepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["tablefeepage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calctf(){
	let tables=num(getvalue("tftables"))
	let rate=num(getvalue("tfrate"))
	let hours=num(getvalue("tfhours"))
	let people=num(getvalue("tfpeople"))
	if(people<1){
		people=1
	}
	let total=tables*rate*hours
	let pertable=rate*hours
	let perhead=total/people
	innertext("#tftotal","$"+moneyfmt(total),false)
	innertext("#tfpertable","$"+moneyfmt(pertable),false)
	innertext("#tfperhead","$"+moneyfmt(perhead),false)
}

function applytflanguage(){
	document.title=tftext("title")+" - PokerTrace"
	innertext("#tftitle",tftext("title"),false)
	innertext("#back",tftext("back"),false)
	innertext("#tftableslabel",tftext("tables"),false)
	innertext("#tfratelabel",tftext("rate"),false)
	innertext("#tfhourslabel",tftext("hours"),false)
	innertext("#tfpeoplelabel",tftext("people"),false)
	innertext("#tftotallabel",tftext("total"),false)
	innertext("#tfpertablelabel",tftext("pertable"),false)
	innertext("#tfperheadlabel",tftext("perhead"),false)
	innertext("#tfnote",tftext("note"),false)
}

oninput("#tftables",calctf)
oninput("#tfrate",calctf)
oninput("#tfhours",calctf)
oninput("#tfpeople",calctf)

applytflanguage()
calctf()
