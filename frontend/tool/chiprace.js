function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function crtext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["chipracepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["chipracepage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcrace(){
	let small=num(getvalue("crsmall"))
	let count=num(getvalue("crcount"))
	let newdenom=num(getvalue("crnew"))
	let value=small*count
	let newchips=(function(){if(newdenom>0){return Math.floor(value/newdenom)}return 0})()
	let remain=value-newchips*newdenom
	innertext("#crvalue","$"+moneyfmt(value),false)
	innertext("#crnewchips",moneyfmt(newchips)+" × "+moneyfmt(newdenom),false)
	innertext("#crremain","$"+moneyfmt(remain),false)
}

function loadcrprofilechips(){
	ptloadprofilechipdenoms(function(denoms){
		if(!denoms||denoms.length<1){
			return
		}
		value("#crsmall",denoms[0])
		if(denoms.length>1){
			value("#crnew",denoms[1])
		}
		calcrace()
	})
}

function applycrlanguage(){
	document.title=crtext("title")+" - PokerTrace"
	innertext("#crtitle",crtext("title"),false)
	innertext("#back",crtext("back"),false)
	innertext("#crsmalllabel",crtext("small"),false)
	innertext("#crcountlabel",crtext("count"),false)
	innertext("#crnewlabel",crtext("newdenom"),false)
	value("#crprofilechips",pttoolchiptext("load"))
	innertext("#crvaluelabel",crtext("value"),false)
	innertext("#crnewchipslabel",crtext("newchips"),false)
	innertext("#crremainlabel",crtext("remain"),false)
	innertext("#crnote",crtext("note"),false)
}

oninput("#crsmall",calcrace)
oninput("#crcount",calcrace)
oninput("#crnew",calcrace)
onclick("#crprofilechips",loadcrprofilechips)

applycrlanguage()
calcrace()
