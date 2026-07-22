function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function botext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["bountypage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["bountypage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcbounty(){
	let head=num(getvalue("bohead"))
	let mode=getvalue("bomode")
	let kos=num(getvalue("bokos"))
	let perpocket=(mode=="pko"?head/2:head)
	let perhead=(mode=="pko"?head/2:0)
	let cash=perpocket*kos
	let headgrow=perhead*kos
	innertext("#boper","$"+moneyfmt(perpocket),false)
	innertext("#bocash","$"+moneyfmt(cash),false)
	innertext("#boheadgrow",(mode=="pko"?"+$"+moneyfmt(headgrow):"$0"),false)
}

function applybolanguage(){
	document.title=botext("title")+" - PokerTrace"
	innertext("#botitle",botext("title"),false)
	innertext("#back",botext("back"),false)
	innertext("#boheadlabel",botext("head"),false)
	innertext("#bomodelabel",botext("mode"),false)
	innertext("#bokoslabel",botext("kos"),false)
	innertext("#boperlabel",botext("per"),false)
	innertext("#bocashlabel",botext("cash"),false)
	innertext("#boheadgrowlabel",botext("headgrow"),false)
	innertext("#bonote",botext("note"),false)
	let opts=document.querySelectorAll("#bomode option")
	if(opts[0]){
		opts[0].textContent=botext("modenormal")
	}
	if(opts[1]){
		opts[1].textContent=botext("modepko")
	}
}

oninput("#bohead",calcbounty)
onchange("#bomode",calcbounty)
oninput("#bokos",calcbounty)

applybolanguage()
calcbounty()
