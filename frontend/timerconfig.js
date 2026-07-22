const WEBLSNAME="project00061-"
const AJAXURL=(location.origin=="https://pokertrace.chrisho.ggff.net"||location.origin=="https://pokertrace.net")?"/backendapi/":"/project00061/"
const LANGUAGE=weblsget(WEBLSNAME+"language",false)||"zhtw"

let ptloadingnextid=1
let ptloadingitems={}

function ptloadinginit(){
	if(domgetid("ptloadingstyle")){
		return
	}
	let style=doccreate("style")
	style.id="ptloadingstyle"
	style.textContent=`
		.ptloadingcover {
			align-items: center;
			background: rgba(13,13,13,.68);
			backdrop-filter: blur(2px);
			border-radius: inherit;
			display: flex;
			inset: 0;
			justify-content: center;
			min-height: 72px;
			position: absolute;
			z-index: 80;
		}

		body > .ptloadingcover {
			position: fixed;
			z-index: 9997;
		}

		.ptloader {
			align-items: end;
			display: flex;
			gap: 8px;
			height: 54px;
		}

		.ptloader span {
			animation: ptbounce .8s ease-in-out infinite;
			background: #34d399;
			border-radius: 999px;
			height: 14px;
			width: 14px;
		}

		.ptloader span:nth-child(2) {
			animation-delay: .12s;
			background: #38bdf8;
		}

		.ptloader span:nth-child(3) {
			animation-delay: .24s;
			background: #fbbf24;
		}

		.ptloader span:nth-child(4) {
			animation-delay: .36s;
			background: #fb7185;
		}

		@keyframes ptbounce {
			50% {
				border-radius: 14px;
				height: 48px;
				transform: translateY(-8px);
			}
		}
	`
	document.head.appendChild(style)
}

function ptloadingfallback(){
	let target=document.querySelector("main")
	if(target){
		return target
	}
	target=document.querySelector(".layout")
	if(target){
		return target
	}
	target=document.querySelector(".app")
	if(target){
		return target
	}
	return document.body
}

function ptloadingtarget(target){
	let element=null
	if(typeof target=="string"&&target){
		element=document.querySelector(target)
	}else if(target&&target.nodeType==1){
		element=target
	}
	if(!element){
		element=ptloadingfallback()
	}
	return element
}

function ptloadingstart(target){
	ptloadinginit()
	let element=ptloadingtarget(target)
	if(!element){
		return ""
	}
	let count=Number(element.dataset.ptloadingcount||0)+1
	let id="ptloading"+ptloadingnextid
	ptloadingnextid=ptloadingnextid+1
	ptloadingitems[id]=element
	element.dataset.ptloadingcount=String(count)
	if(element!=document.body&&getComputedStyle(element).position=="static"){
		element.dataset.ptloadingposition="static"
		element.style.position="relative"
	}
	if(!element.querySelector(":scope > .ptloadingcover")){
		let cover=doccreate("div")
		cover.className="ptloadingcover"
		cover.innerHTML=`
			<div class="ptloader" aria-label="載入中">
				<span></span>
				<span></span>
				<span></span>
				<span></span>
			</div>
		`
		element.appendChild(cover)
	}
	element.classList.add("ptloadingactive")
	return id
}

function ptloadingend(id){
	let element=ptloadingitems[id]
	if(!element){
		return
	}
	delete ptloadingitems[id]
	let count=Number(element.dataset.ptloadingcount||0)-1
	if(0<count){
		element.dataset.ptloadingcount=String(count)
		return
	}
	delete element.dataset.ptloadingcount
	let cover=element.querySelector(":scope > .ptloadingcover")
	if(cover&&cover.parentElement){
		cover.parentElement.removeChild(cover)
	}
	if(element.dataset.ptloadingposition=="static"){
		element.style.position=""
		delete element.dataset.ptloadingposition
	}
	element.classList.remove("ptloadingactive")
}

window.ptloadingstart=ptloadingstart
window.ptloadingend=ptloadingend
window.ptloadingtarget=ptloadingtarget
