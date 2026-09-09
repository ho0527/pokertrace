let copydatatimer=null
let copydatastartx=0
let copydatastarty=0
let copydataarmed=false
let copydatapendingtarget=null

function copydatasuccessmessage(){
	let message="已複製"
	let languagetext=document.documentElement.lang||""
	if(typeof LANGUAGE!="undefined"&&LANGUAGE=="en"){
		message="Copy!"
	}else if(languagetext.toLowerCase().indexOf("en")==0){
		message="Copy!"
	}
	return message
}

function copydatafailedmessage(){
	let message="複製失敗，請再試一次"
	let languagetext=document.documentElement.lang||""
	if(typeof LANGUAGE!="undefined"&&LANGUAGE=="en"){
		message="Copy failed. Please try again"
	}else if(languagetext.toLowerCase().indexOf("en")==0){
		message="Copy failed. Please try again"
	}
	return message
}

function copydatatoast(message,type){
	if(typeof pttoast=="function"){
		pttoast(message,type)
	}else{
		let oldtoast=document.getElementById("ptcopydatatoast")
		if(oldtoast){
			oldtoast.remove()
		}
		let toast=document.createElement("div")
		toast.id="ptcopydatatoast"
		toast.textContent=message
		toast.style.position="fixed"
		toast.style.top="76px"
		toast.style.left="50%"
		toast.style.zIndex="9999"
		toast.style.maxWidth="420px"
		toast.style.padding="12px 16px"
		toast.style.borderRadius="12px"
		toast.style.background="#18181b"
		toast.style.color="#d1fae5"
		toast.style.fontSize="14px"
		toast.style.fontWeight="700"
		toast.style.textAlign="center"
		toast.style.transform="translateX(-50%)"
		toast.style.boxShadow="0 10px 24px rgba(0,0,0,0.28)"
		document.body.appendChild(toast)
		setTimeout(function(){
			toast.remove()
		},1800)
	}
}

function copydatatarget(element){
	let target=null
	let blocked=element.closest("h1,h2,h3,h4,h5,h6,legend,summary,th,label,input,select,textarea,button,a,[role='button'],[class*='title'],[class*='uppercase'],[data-i18n],[data-i18n-value],[data-copyignore]")
	if(!blocked){
		target=element.closest("[data-copydata],td,li,pre,code,output,p,span,div,article,section,tr")
	}
	return target
}

function copydatatext(target){
	let clone=target.cloneNode(true)
	let removelist=clone.querySelectorAll("h1,h2,h3,h4,h5,h6,legend,summary,th,label,input,select,textarea,button,a,[role='button'],[class*='title'],[class*='uppercase'],[data-i18n],[data-i18n-value],[data-copyignore],script,style,noscript")
	for(let i=0;i<removelist.length;i=i+1){
		removelist[i].remove()
	}
	let text=String(clone.textContent||"").replace(/\s+/g," ").trim()
	return text
}

function copydatafallback(text){
	let textarea=document.createElement("textarea")
	textarea.value=text
	textarea.setAttribute("readonly","")
	textarea.style.position="fixed"
	textarea.style.opacity="0"
	document.body.appendChild(textarea)
	textarea.select()
	let copied=document.execCommand("copy")
	textarea.remove()
	if(copied){
		copydatatoast(copydatasuccessmessage(),"success")
	}else{
		copydatatoast(copydatafailedmessage(),"warning")
	}
}

function copydatacopy(target){
	let text=copydatatext(target)
	if(text!=""&&navigator.clipboard&&navigator.clipboard.writeText){
		navigator.clipboard.writeText(text).then(function(){
			copydatatoast(copydatasuccessmessage(),"success")
		},function(){
			copydatafallback(text)
		})
	}else if(text!=""){
		copydatafallback(text)
	}
}

document.addEventListener("touchstart",function(event){
	let target=null
	copydataarmed=false
	copydatapendingtarget=null
	if(copydatatimer){
		clearTimeout(copydatatimer)
		copydatatimer=null
	}
	if(event.touches.length==1){
		target=copydatatarget(event.target)
	}
	if(target){
		copydatapendingtarget=target
		copydatastartx=event.touches[0].clientX
		copydatastarty=event.touches[0].clientY
		copydatatimer=setTimeout(function(){
			copydatatimer=null
			copydataarmed=true
		},550)
	}
},{"passive": true})

document.addEventListener("touchmove",function(event){
	if(copydatapendingtarget&&event.touches.length==1){
		let movedx=Math.abs(event.touches[0].clientX-copydatastartx)
		let movedy=Math.abs(event.touches[0].clientY-copydatastarty)
		if(12<movedx||12<movedy){
			if(copydatatimer){
				clearTimeout(copydatatimer)
				copydatatimer=null
			}
			copydataarmed=false
			copydatapendingtarget=null
		}
	}
},{"passive": true})

document.addEventListener("touchend",function(){
	if(copydatatimer){
		clearTimeout(copydatatimer)
		copydatatimer=null
	}
	if(copydataarmed&&copydatapendingtarget){
		copydatacopy(copydatapendingtarget)
	}
	copydataarmed=false
	copydatapendingtarget=null
})

document.addEventListener("touchcancel",function(){
	if(copydatatimer){
		clearTimeout(copydatatimer)
		copydatatimer=null
	}
	copydataarmed=false
	copydatapendingtarget=null
})

document.addEventListener("contextmenu",function(event){
	if(copydatatarget(event.target)){
		event.preventDefault()
	}
})
