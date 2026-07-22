function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function bntext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["bountypoolpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["bountypoolpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcbn(){
	let entries=num(getvalue("bnentries"))
	let head=num(getvalue("bnhead"))
	let mode=getvalue("bnmode")
	let total=entries*head
	// 一般 bounty 沒有「起始頭上賞金」，擊倒時全額入袋；只有 PKO 才是一半入袋、一半加到頭上。
	let pocket=head
	let starttext="-"
	if(mode=="pko"){
		pocket=head/2
		starttext="$"+moneyfmt(head/2)
	}
	innertext("#bntotal","$"+moneyfmt(total),false)
	innertext("#bnstart",starttext,false)
	innertext("#bnpocket","$"+moneyfmt(pocket),false)
}

function applybnlanguage(){
	document.title=bntext("title")+" - PokerTrace"
	innertext("#bntitle",bntext("title"),false)
	innertext("#back",bntext("back"),false)
	innertext("#bnentrieslabel",bntext("entries"),false)
	innertext("#bnheadlabel",bntext("head"),false)
	innertext("#bnmodelabel",bntext("mode"),false)
	innertext("#bntotallabel",bntext("total"),false)
	innertext("#bnstartlabel",bntext("start"),false)
	innertext("#bnpocketlabel",bntext("pocket"),false)
	innertext("#bnnote",bntext("note"),false)
	let opts=document.querySelectorAll("#bnmode option")
	if(opts[0]){
		opts[0].textContent=bntext("modenormal")
	}
	if(opts[1]){
		opts[1].textContent=bntext("modepko")
	}
}

oninput("#bnentries",calcbn)
oninput("#bnhead",calcbn)
onchange("#bnmode",calcbn)

applybnlanguage()
calcbn()
