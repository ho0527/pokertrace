function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function rptext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["regpacepage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["regpacepage"][key]||key
}

function calcrp(){
	let current=num(getvalue("rpcurrent"))
	let target=num(getvalue("rptarget"))
	let open=num(getvalue("rpopen"))
	let left=num(getvalue("rpleft"))
	let pace=(function(){if(open>0){return current/open*60}return 0})()
	let needpeople=target-current
	let needpace=(function(){if(left>0){return needpeople/left*60}return 0})()
	let proj=current+pace*(left/60)
	innertext("#rppace",(function(){if(open>0){return (Math.round(pace*10)/10)+" "+rptext("perhour")}return "-"})(),false)
	innertext("#rpneed",(needpeople<=0?rptext("reached"):(left>0?(Math.round(needpace*10)/10)+" "+rptext("perhour"):"-")),false)
	innertext("#rpproj",(function(){if(open>0){return Math.round(proj)+" "+rptext("people")}return "-"})(),false)
	removeclass("#rpneed",["text-emerald-400","text-red-400","text-zinc-200"])
	if(needpeople<=0){
		addclass("#rpneed",["text-emerald-400"])
	}else if(left<=0){
		addclass("#rpneed",["text-zinc-200"])
	}else{
		addclass("#rpneed",[(needpace<=pace?"text-emerald-400":"text-red-400")])
	}
}

function applyrplanguage(){
	document.title=rptext("title")+" - PokerTrace"
	innertext("#rptitle",rptext("title"),false)
	innertext("#back",rptext("back"),false)
	innertext("#rpcurrentlabel",rptext("current"),false)
	innertext("#rptargetlabel",rptext("target"),false)
	innertext("#rpopenlabel",rptext("open"),false)
	innertext("#rpleftlabel",rptext("left"),false)
	innertext("#rppacelabel",rptext("pace"),false)
	innertext("#rpneedlabel",rptext("need"),false)
	innertext("#rpprojlabel",rptext("proj"),false)
	innertext("#rpnote",rptext("note"),false)
}

oninput("#rpcurrent",calcrp)
oninput("#rptarget",calcrp)
oninput("#rpopen",calcrp)
oninput("#rpleft",calcrp)

applyrplanguage()
calcrp()
