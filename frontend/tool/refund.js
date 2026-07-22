function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function rftext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["refundpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["refundpage"][key]||key
}

function moneyfmt(value){
	return Math.round(value).toLocaleString("en-US")
}

function calcrf(){
	let paid=num(getvalue("rfpaid"))
	let fee=num(getvalue("rffee"))
	let policy=getvalue("rfpolicy")
	let refund=0
	if(policy=="full"){
		refund=paid
	}else if(policy=="fee"){
		refund=paid-fee
	}else if(policy=="half"){
		refund=paid/2
	}else{
		refund=0
	}
	if(refund<0){
		refund=0
	}
	let keep=paid-refund
	innertext("#rfrefund","$"+moneyfmt(refund),false)
	innertext("#rfkeep","$"+moneyfmt(keep),false)
}

function applyrflanguage(){
	document.title=rftext("title")+" - PokerTrace"
	innertext("#rftitle",rftext("title"),false)
	innertext("#back",rftext("back"),false)
	innertext("#rfpaidlabel",rftext("paid"),false)
	innertext("#rffeelabel",rftext("fee"),false)
	innertext("#rfpolicylabel",rftext("policy"),false)
	innertext("#rfrefundlabel",rftext("refund"),false)
	innertext("#rfkeeplabel",rftext("keep"),false)
	innertext("#rfnote",rftext("note"),false)
	let opts=document.querySelectorAll("#rfpolicy option")
	let keys=["full","fee","none","half"]
	for(let i=0;i<opts.length;i=i+1){
		opts[i].textContent=rftext("opt_"+keys[i])
	}
	calcrf()
}

oninput("#rfpaid",calcrf)
oninput("#rffee",calcrf)
onchange("#rfpolicy",calcrf)

applyrflanguage()
calcrf()
