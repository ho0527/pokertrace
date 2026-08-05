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

// 已載入的個人牌組（[{value,color,shape,label}]）。空陣列代表沒載入過，不顯示任何色帶。
let crloadedchiplist=[]

function calcrace(){
	let small=num(getvalue("crsmall"))
	let count=num(getvalue("crcount"))
	let newdenom=num(getvalue("crnew"))
	// 面額被手動改成牌組裡沒有的值時，對應色帶取消選取，避免現場照著殘留的顏色收錯牌
	ptchipstripselect(domgetid("crsmallstrip"),small)
	ptchipstripselect(domgetid("crnewstrip"),newdenom)
	let value=small*count
	let newchips=(function(){if(newdenom>0){return Math.floor(value/newdenom)}return 0})()
	let remain=value-newchips*newdenom
	innertext("#crvalue","$"+moneyfmt(value),false)
	innertext("#crnewchips",moneyfmt(newchips)+" × "+moneyfmt(newdenom),false)
	innertext("#crremain","$"+moneyfmt(remain),false)
}

function loadcrprofilechips(){
	ptloadprofilechiplist(function(chiplist){
		if(!chiplist||chiplist.length<1){
			return
		}
		crloadedchiplist=chiplist
		// 兩欄各自列出整組牌組供點選，使用者看得出系統挑了哪兩顆、也能一鍵換掉
		innerhtml("#crsmallstrip",ptchipstriphtml(chiplist,true),false)
		innerhtml("#crnewstrip",ptchipstriphtml(chiplist,true),false)
		ptchipswatchapply(domgetid("crsmallstrip"),chiplist)
		ptchipswatchapply(domgetid("crnewstrip"),chiplist)
		ptchipstripbind(domgetid("crsmallstrip"),function(pickedvalue){
			value("#crsmall",pickedvalue)
			calcrace()
		})
		ptchipstripbind(domgetid("crnewstrip"),function(pickedvalue){
			value("#crnew",pickedvalue)
			calcrace()
		})
		// 預設仍沿用最小兩個面額，與改版前行為一致
		value("#crsmall",chiplist[0]["value"])
		if(chiplist.length>1){
			value("#crnew",chiplist[1]["value"])
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
