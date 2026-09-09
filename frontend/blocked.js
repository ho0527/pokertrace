function blockedtext(key){
	return (TRANSLATE[LANGUAGE]["blockedpage"]||{})[key]||key
}

let reason=ptgetreturnreason()
if(reason=="ERROR_user_banned"){
	document.title=blockedtext("pagetitle")
	ptsignoutlocal("ERROR_user_banned")
}else{
	href("main.html")
}
