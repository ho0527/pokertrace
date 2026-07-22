function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function potext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["potoddspage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["potoddspage"][key]||key
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

function calcpotodds(){
	let pot=num(getvalue("popot"))
	let call=num(getvalue("pocall"))
	if(call<=0){
		innertext("#poratio","-",false)
		innertext("#poneed","-",false)
		innertext("#pomdf","-",false)
		calcev()
		return
	}
	let need=call/(pot+call)*100
	let g=gcd(pot,call)
	let ratio=(pot/g)+" : "+(call/g)
	innertext("#poratio",ratio,false)
	innertext("#poneed",(need>=10?Math.round(need):Math.round(need*10)/10)+"%",false)
	// MDF = 下注前底池 ÷（下注前底池 + 下注額）。此處目前底池含對手下注，下注前底池 = pot − call。
	let prepot=pot-call
	if(prepot>0){
		let mdf=prepot/(prepot+call)*100
		innertext("#pomdf",(mdf>=10?Math.round(mdf):Math.round(mdf*10)/10)+"%",false)
	}else{
		innertext("#pomdf","-",false)
	}
	calcev()
}

function calcev(){
	let pot=num(getvalue("popot"))
	let call=num(getvalue("pocall"))
	let eq=num(getvalue("poeq"))/100
	if(call<=0){
		innertext("#poev","-",false)
		innertext("#poadvice","-",false)
		return
	}
	if(eq<0){eq=0}
	if(eq>1){eq=1}
	let ev=eq*pot-(1-eq)*call
	innertext("#poev",(ev>=0?"+":"")+Math.round(ev),false)
	let advice=(function(){if(ev>0){return potext("callit")}return ((function(){if(ev<0){return potext("foldit")}return potext("breakeven")})())})()
	innertext("#poadvice",advice,false)
	removeclass("#poev",["text-emerald-400","text-red-400","text-zinc-200"])
	addclass("#poev",[(function(){if(ev>0){return "text-emerald-400"}return ((function(){if(ev<0){return "text-red-400"}return "text-zinc-200"})())})()])
}

function calcoutsodds(){
	let outs=num(getvalue("poouts"))
	if(outs<0){
		outs=0
	}
	let flop=outs*4
	let turn=outs*2
	if(flop>100){
		flop=100
	}
	if(turn>100){
		turn=100
	}
	innertext("#poflop",flop+"%",false)
	innertext("#poturn",turn+"%",false)
}

function applypolanguage(){
	document.title=potext("title")+" - PokerTrace"
	innertext("#potitle",potext("title"),false)
	innertext("#poback",potext("back"),false)
	innertext("#popotlabel",potext("pot"),false)
	innertext("#pocalllabel",potext("call"),false)
	innertext("#poratiolabel",potext("ratio"),false)
	innertext("#poneedlabel",potext("need"),false)
	innertext("#pooutstitle",potext("outstitle"),false)
	innertext("#pooutslabel",potext("outs"),false)
	innertext("#poflopodds",potext("flopodds"),false)
	innertext("#poturnodds",potext("turnodds"),false)
	innertext("#pomdflabel",potext("mdf"),false)
	innertext("#poevtitle",potext("evtitle"),false)
	innertext("#poeqlabel",potext("eq"),false)
	innertext("#poevlabel",potext("ev"),false)
	innertext("#poadvicelabel",potext("advice"),false)
	innertext("#poevnote",potext("evnote"),false)
}

oninput("#popot",calcpotodds)
oninput("#pocall",calcpotodds)
oninput("#poouts",calcoutsodds)
oninput("#poeq",calcev)

applypolanguage()
calcpotodds()
calcoutsodds()
