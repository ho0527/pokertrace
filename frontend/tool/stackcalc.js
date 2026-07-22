function num(value){
	let n=parseFloat(value)
	return (function(){if(isNaN(n)){return 0}return n})()
}

function sctext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["stackcalcpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["stackcalcpage"][key]||key
}

// translate.js 尚未加入該 key 時（sctext 會原樣回傳 key）改用中文預設字
function scfallbacktext(key,fallback){
	let text=sctext(key)
	if(text==key){
		text=fallback
	}
	return text
}

function fmt(value){
	let v=Math.round(value*10)/10
	return String(v)
}

// ante 型態："bba"＝大盲 ante（全桌只有一份，預設，現代錦標賽標準）；"each"＝每人 ante（每人各付一份）；"none"＝無 ante
let scantemode="bba"

// 自動跟隨旗標：使用者手動改過該欄位後就停止自動帶入，欄位被清空時恢復跟隨
let scbbeditedbyusered=false
let scanteeditedbyusered=false

// 這一手所有 ante 加總：大盲 ante 只有一份；每人 ante ＝ 一份 × 人數；無 ante 為 0
function scantetotal(ante,players){
	let total=0
	if(scantemode=="bba"){
		total=ante
	}
	if(scantemode=="each"){
		total=ante*players
	}
	return total
}

// 大盲未被手動改過時跟著小盲 ×2
function scsyncbb(){
	if(!scbbeditedbyusered){
		value("#scbb",String(num(getvalue("scsb"))*2))
	}
}

// BBA 模式且 ante 未被手動改過時跟著大盲。
// 只在「大盲欄位被更新」時呼叫（改小盲連帶算出的大盲、切換 ante 模式都不觸發），
// 否則使用者會覺得 ante 一直被系統改掉。
function scsyncante(){
	if(scantemode=="bba"&&!scanteeditedbyusered){
		value("#scante",getvalue("scbb"))
	}
}

// 無 ante 模式時停用並淡化 Ante 欄位
function screnderantefield(){
	let antefield=document.querySelector("#scante")
	if(antefield){
		antefield.disabled=scantemode=="none"
		let base="min-h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400"
		if(scantemode=="none"){
			base=base+" opacity-50 cursor-not-allowed"
		}
		antefield.className=base
	}
}

function screnderantemode(){
	let btns=document.querySelectorAll("[data-scantemode]")
	for(let i=0;i<btns.length;i=i+1){
		let on=btns[i].getAttribute("data-scantemode")==scantemode
		btns[i].className="rounded-lg px-2 py-1 text-xs font-bold cursor-pointer "+(on?"bg-emerald-500 text-zinc-950":"bg-zinc-800 text-zinc-300 hover:bg-zinc-700")
	}
}

function calcstack(){
	let stack=num(getvalue("scstack"))
	let sb=num(getvalue("scsb"))
	let bb=num(getvalue("scbb"))
	let ante=num(getvalue("scante"))
	let players=num(getvalue("scplayers"))
	if(players<1){
		players=1
	}
	let bbcount=(function(){if(bb>0){return stack/bb}return 0})()
	let orbit=sb+bb+scantetotal(ante,players)
	let m=(function(){if(orbit>0){return stack/orbit}return 0})()
	let effm=m*(players/10)
	innertext("#scbbcount",(function(){if(bb>0){return fmt(bbcount)}return "-"})(),false)
	innertext("#scm",(function(){if(orbit>0){return fmt(m)}return "-"})(),false)
	innertext("#sceffm",(function(){if(orbit>0){return fmt(effm)}return "-"})(),false)
}

function applysclanguage(){
	document.title=sctext("title")+" - PokerTrace"
	innertext("#sctitle",sctext("title"),false)
	innertext("#scback",sctext("back"),false)
	innertext("#scstacklabel",sctext("stack"),false)
	innertext("#scsblabel",sctext("sb"),false)
	innertext("#scbblabel",sctext("bb"),false)
	innertext("#scantelabel",sctext("ante"),false)
	innertext("#scplayerslabel",sctext("players"),false)
	innertext("#scbbcountlabel",sctext("bbcount"),false)
	innertext("#scmlabel",sctext("m"),false)
	innertext("#sceffmlabel",sctext("effm"),false)
	innertext("#scnote",sctext("note"),false)
	let bba=document.querySelector('[data-scantemode="bba"]')
	if(bba){ bba.value=sctext("ante_bba") }
	let each=document.querySelector('[data-scantemode="each"]')
	if(each){ each.value=sctext("ante_each") }
	let none=document.querySelector('[data-scantemode="none"]')
	if(none){ none.value=scfallbacktext("ante_none","無 ante") }
	let deduct=document.querySelector("#scdeductorbit")
	if(deduct){ deduct.value=scfallbacktext("deductorbit","扣掉本次大小盲") }
	screnderantemode()
	screnderantefield()
}

oninput("#scstack",calcstack)
oninput("#scsb",function(){
	scsyncbb()
	calcstack()
})
oninput("#scbb",function(){
	scbbeditedbyusered=getvalue("scbb")!=""
	scsyncante()
	calcstack()
})
oninput("#scante",function(){
	scanteeditedbyusered=getvalue("scante")!=""
	calcstack()
})
oninput("#scplayers",calcstack)

let scmodebtnlist=document.querySelectorAll("[data-scantemode]")
for(let i=0;i<scmodebtnlist.length;i=i+1){
	scmodebtnlist[i].addEventListener("click",function(){
		scantemode=this.getAttribute("data-scantemode")
		screnderantemode()
		screnderantefield()
		calcstack()
	})
}

// 扣掉本次的小盲 + 大盲 + ante 總額，最低到 0
onclick("#scdeductorbit",function(){
	let stack=num(getvalue("scstack"))
	let players=num(getvalue("scplayers"))
	if(players<1){
		players=1
	}
	let orbit=num(getvalue("scsb"))+num(getvalue("scbb"))+scantetotal(num(getvalue("scante")),players)
	let left=stack-orbit
	if(left<0){
		left=0
	}
	value("#scstack",String(Math.round(left*10)/10))
	calcstack()
})

applysclanguage()
calcstack()
