
if(!weblsget(WEBLSNAME+"signin")){
	href("signin.html")
}

let clubdata=[]
let clubsortstate={ "key": "","ascended": true }
let clubloadeded=false
let clubloadinged=false
let clubmutatinged=false
let clubsearchname=""
let clubordersavinged=false
let cluborderchangeded=false
let cluborderconflicted=false
let cluborderfailed=false
let cluborderlist=[]
let clubpreviousidlist=[]
let clubordermessage=""
let clubdragid=0
let clubdragpointer=0
let clubdragstarted=false
let clubdragstartx=0
let clubdragstarty=0
let clubdragx=0
let clubdragy=0
let clubdragtarget=-1
let clubdraganimation=0
let clubdraghandle=null
let clubdraglabel=null
let clubdraggeometry=[]
let clubdragorigintop=0
let clubdragoriginleft=0
let clubdragheight=0
let clubdragpitch=0

function safehtml(value){
	if(value==null||value==undefined){
		return ""
	}
	return String(value)
		.replace(/&/g,"&amp;")
		.replace(/</g,"&lt;")
		.replace(/>/g,"&gt;")
		.replace(/"/g,"&quot;")
		.replace(/'/g,"&#39;")
}

function clubtext(key){
	return TRANSLATE[LANGUAGE]["clublist"][key]||key
}

let leaveguard=bindleaveguard(domgetid("clubmodal"))

function applyclublanguage(){
	document.title=clubtext("title")
	innertext("h1",clubtext("title"),false)
	domgetid("searchname").placeholder=clubtext("searchplaceholder")
	domgetid("searchbutton").value=clubtext("search")
	domgetid("clearsearchbutton").value=clubtext("clear")
	domgetid("addclubbutton").value=clubtext("addclub")
	let labels=document.querySelectorAll("#clubform label")
	if(0<labels.length){
		labels[0].innerHTML=clubtext("name")+' <span class="text-red-500">*</span>'
	}
	if(1<labels.length){
		labels[1].innerHTML=clubtext("address")+' <span class="text-red-500">*</span>'
	}
	if(2<labels.length){
		labels[2].textContent=clubtext("note")
	}
	innertext("#modaltitle",clubtext("addclub"),false)
	value("#cancelbutton",clubtext("cancel"))
	let submit=document.querySelector("#clubform input[type=\"submit\"]")
	if(submit){
		submit.value=TRANSLATE[LANGUAGE]["confirm"]
	}
}

applyclublanguage()

function loadclubdata(){
    clubloadinged=true
    main()
    ajax("GET",AJAXURL+"getclublist",function(event,data){
        clubloadinged=false
        if(data["success"]&&Array.isArray(data["data"])){
            clubdata=data["data"]
            clubloadeded=true
            cluborderlist=clubdata.slice()
            clubpreviousidlist=[]
            for(let i=0;i<clubdata.length;i=i+1){
                clubpreviousidlist.push(clubdata[i]["id"])
            }
            cluborderchangeded=false
            cluborderconflicted=false
            cluborderfailed=false
            clubordermessage=clubtext("orderunchanged")
            leaveguard.clear()
        }else{
            cluborderfailed=true
            clubordermessage=clubtext("orderloadfail")
            if(data["data"]=="ERROR_user_not_found"){
                pthandleauthfailure(data["data"],{"toasted": false})
            }else if(clubloadeded&&!cluborderchangeded){
                pttoasterror(clubordermessage)
            }
        }
        main()
    },null,[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ],{"loadingtarget": "#clubmain"})
}

function main(){
    if(clubdragid){
        endclubdrag()
    }
    if(!clubloadeded){
        let html=`<div class="p-6 text-center text-zinc-400" role="status">${clubtext("orderloading")}</div>`
        if(!clubloadinged){
            html=`<div class="p-6 text-center"><p class="mb-4 text-red-400">${clubtext("orderloadfail")}</p><input type="button" class="cluborderbutton" id="clubretrybutton" value="${clubtext("orderreload")}"></div>`
        }
        innerhtml("#clubmain",html,false)
    }else{
        const SEARCHNAME=clubsearchname
        const TOTALCOUNT=cluborderlist.length
        const FILTERED=[]

        for(let i=0;i<TOTALCOUNT;i=i+1){
            const CLUB=cluborderlist[i]
            let showed=true

            if(SEARCHNAME){
                const SEARCHTEXT=[
                    CLUB["name"]||"",
                    CLUB["address"]||"",
                    CLUB["ps"]||""
                ].join(" ").toLowerCase()
                if(SEARCHTEXT.indexOf(SEARCHNAME)==-1){
                    showed=false
                }
            }

            if(showed){
                FILTERED.push(CLUB)
            }
        }

        renderclublist(FILTERED)
        innertext("#totalclubs",TOTALCOUNT,false)
        bindclubbuttons()
    }
    const LOCKED=cluborderchangeded||clubordersavinged||clubloadinged||clubmutatinged
    const BARSHOWN=cluborderchangeded||clubordersavinged||cluborderconflicted
    const FILTEREDED=clubsearchname!=""||clubsortstate["key"]!=""
    domgetid("clubviewbar").hidden=!clubloadeded
    domgetid("cluborderfooter").hidden=!BARSHOWN
    document.body.classList.toggle("cluborderpending",BARSHOWN)
    domgetid("searchname").disabled=LOCKED
    domgetid("searchbutton").disabled=LOCKED
    domgetid("clearsearchbutton").disabled=LOCKED
    domgetid("addclubbutton").disabled=LOCKED
    domgetid("clubcustomorderbutton").hidden=!FILTEREDED
    domgetid("clubcustomorderbutton").disabled=LOCKED
    domgetid("clubviewstatus").textContent=clubtext("orderhelp")
    if(FILTEREDED){
        domgetid("clubviewstatus").textContent=clubtext("orderviewsorted")
    }else if(clubloadeded&&cluborderlist.length<2){
        domgetid("clubviewstatus").textContent=clubtext("orderminimum")
    }
    domgetid("clubmain").setAttribute("aria-busy",String(clubloadinged||clubordersavinged||clubmutatinged))
    domgetid("clubordersave").disabled=!cluborderchangeded||clubordersavinged||clubloadinged||cluborderconflicted
    domgetid("clubordercancel").disabled=clubordersavinged||clubloadinged
    domgetid("cluborderreload").hidden=!cluborderfailed
    domgetid("cluborderreload").disabled=clubordersavinged||clubloadinged
    domgetid("clubordersave").value=clubtext("ordersave")
    if(cluborderfailed&&!cluborderconflicted){
        domgetid("clubordersave").value=clubtext("orderretry")
    }
    let message=clubordermessage
    if(clubordersavinged){
        message=clubtext("ordersaving")
    }else if(clubloadinged){
        message=clubtext("orderloading")
    }
    domgetid("cluborderstatus").textContent=message
    domgetid("cluborderstatus").classList.toggle("cluborderfailure",cluborderfailed)
}

function clubcanreorder(){
    return clubloadeded&&!clubloadinged&&!clubmutatinged&&!clubordersavinged&&!cluborderconflicted&&clubdata.length>1&&clubsortstate["key"]==""&&clubsearchname==""&&domgetid("clubmodal").style.display!="flex"
}

function clubgrip(club){
    return `<input type="button" class="cluborderbutton clubordergrip" data-id="${safehtml(club["id"])}" value="⠿" title="${safehtml(clubtext("orderdrag").replace("%s",club["name"]))}" aria-label="${safehtml(clubtext("orderdrag").replace("%s",club["name"]))}" aria-keyshortcuts="ArrowUp ArrowDown" ${clubcanreorder()?"":"disabled"}>`
}

// 排序取值。三個可排序欄位都是字串；取不到就回 null，由 ptsortcompare 排到最後。
function clubsortvalue(item,key){
    let value=null
    let text=""
    if(item[key]!=null){
        text=String(item[key]).trim()
    }
    if(text!=""){
        value=text
    }
    return value
}

function renderclublist(filtered){
    const SORTED=ptsortlist(filtered,clubsortstate["key"],clubsortstate["ascended"],clubsortvalue)
    if(window.innerWidth<768){
        renderclubcards(SORTED)
    }else{
        renderclubtable(SORTED)
    }
}

function renderclubcards(rowlist){
	let html=""
	for(let i=0;i<rowlist.length;i=i+1){
		let club=rowlist[i]
		html=html+`
			<div class="bg-zinc-900/70 rounded-2xl p-4 mb-3 border border-zinc-800 transition hover:border-zinc-700" data-clubrow data-id="${safehtml(club["id"])}">
				<div class="flex justify-between gap-3 mb-2">
					<div class="cluborderhandle">${clubgrip(club)}<span class="text-xs text-zinc-400">#${i+1}</span></div>
					<div class="flex gap-3 text-sm">
						<input type="button" class="text-blue-400 hover:underline editbutton" data-id="${club["id"]}" value="${clubtext("edit")}" ${cluborderchangeded||clubordersavinged||clubloadinged||clubmutatinged?"disabled":""}>
                        ${club["owned"]!=false?`<input type="button" class="text-red-400 hover:underline deletebutton" data-id="${club["id"]}" value="${clubtext("delete")}" ${cluborderchangeded||clubordersavinged||clubloadinged||clubmutatinged?"disabled":""}>`:""}
					</div>
				</div>
				<div class="font-semibold text-lg">${safehtml(club["name"])}</div>
				<a href="https://www.google.com/maps?q=${encodeURIComponent(club["address"]||"")}" target="_blank" class="block text-blue-400 underline text-sm mt-2 break-words" rel="noopener noreferrer">${safehtml(club["address"])}</a>
				<div class="text-sm text-zinc-300 mt-2 break-words">${safehtml(club["ps"]||"-")}</div>
			</div>
		`
	}
	if(html==""){
		let message=clubtext("emptyall")
		let note=clubtext("nextadd")
		if(clubsearchname!=""){
			message=clubtext("emptysearch")
			note=clubtext("nextadd")
		}
		html=`
			<div class="bg-zinc-900/70 rounded-2xl p-6 text-center border border-zinc-800">
				<div class="text-white font-semibold mb-2">${message}</div>
				<div class="text-zinc-400 text-sm">${note}</div>
			</div>
		`
	}
	innerhtml("#clubmain",html,false)
}

function renderclubtable(rowlist){
	let rows=""
	for(let i=0;i<rowlist.length;i=i+1){
		let club=rowlist[i]
		let rowdivider=i<rowlist.length-1?"[&>td]:border-b [&>td]:border-zinc-800":""
		rows=rows+`
			<tr class="hover:bg-zinc-800/60 transition ${rowdivider}" data-clubrow data-id="${safehtml(club["id"])}">
				<td class="clubordercell py-3 px-4"><div class="cluborderhandle">${clubgrip(club)}<span>${i+1}</span></div></td>
				<td class="py-3 px-4">${safehtml(club["name"])}</td>
				<td class="py-3 px-4"><a href="https://www.google.com/maps?q=${encodeURIComponent(club["address"]||"")}" target="_blank" class="underline text-blue-500" rel="noopener noreferrer">${safehtml(club["address"])}</a></td>
				<td class="py-3 px-4">${safehtml(club["ps"]||"-")}</td>
				<td class="py-3 px-4">
					<input type="button" class="text-blue-400 hover:underline mr-3 editbutton" data-id="${club["id"]}" value="${clubtext("edit")}" ${cluborderchangeded||clubordersavinged||clubloadinged||clubmutatinged?"disabled":""}>
                    ${club["owned"]!=false?`<input type="button" class="text-red-400 hover:underline deletebutton" data-id="${club["id"]}" value="${clubtext("delete")}" ${cluborderchangeded||clubordersavinged||clubloadinged||clubmutatinged?"disabled":""}>`:""}
				</td>
			</tr>
		`
	}
	if(rows==""){
		let message=clubtext("emptyall")
		let note=clubtext("nextadd")
		if(clubsearchname!=""){
			message=clubtext("emptysearch")
		}
		rows=`<tr><td colspan="5" class="py-6 text-center"><div class="text-white font-semibold mb-2">${message}</div><div class="text-zinc-400 text-sm">${note}</div></td></tr>`
	}
	innerhtml("#clubmain",`
		<div class="clubtablewrap md:rounded-2xl md:border md:border-zinc-800 md:bg-zinc-900/40">
			<table class="w-full text-sm border-separate border-spacing-0">
				<thead>
					<tr class="text-zinc-300" id="clublisthead">
						<th class="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-3 px-4">#</th>
						<th class="ptsortth select-none sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-3 px-4" data-sortkey="name"><span>${clubtext("name")}</span><span class="ptsortarrow text-emerald-400" data-sortkey="name"></span></th>
						<th class="ptsortth select-none sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-3 px-4" data-sortkey="address"><span>${clubtext("address")}</span><span class="ptsortarrow text-emerald-400" data-sortkey="address"></span></th>
						<th class="ptsortth select-none sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-3 px-4" data-sortkey="ps"><span>${clubtext("note")}</span><span class="ptsortarrow text-emerald-400" data-sortkey="ps"></span></th>
						<th class="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-800 py-3 px-4">${clubtext("action")}</th>
					</tr>
				</thead>
				<tbody class="text-center">${rows}</tbody>
			</table>
		</div>
	`,false)
    // 這一頁每次 render 會把整個 thead 重畫，所以箭頭與點擊都要在這裡重來一次
    ptsortarrow("#clublisthead",clubsortstate["key"],clubsortstate["ascended"])
    if(!cluborderchangeded&&!clubordersavinged&&!clubloadinged&&!clubmutatinged){
        ptbindsort("#clublisthead",clubsortstate,function(){
            main()
        })
    }
}

function openclubmodal(){
	let modal=domgetid("clubmodal")
	if(modal&&modal.style.display!="flex"){
		ptlockpagescroll()
	}
	style("#clubmodal",[
		["display","flex"]
	])
}

function closeclubmodal(){
	let modal=domgetid("clubmodal")
	let opened=false
	if(modal&&modal.style.display=="flex"){
		opened=true
	}
	style("#clubmodal",[
		["display","none"]
	])
	if(opened){
		ptunlockpagescroll()
		leaveguard.clear()
		main()
	}
}

function bindclubbuttons(){
	onclick(".editbutton",function(element,event){
		if(cluborderchangeded||clubmutatinged||clubloadinged||clubordersavinged){
			return
		}
		let clubid=dataset(element,"id")
		let club=null
		for(let i=0;i<clubdata.length;i=i+1){
			if(clubdata[i].id==clubid){
				club=clubdata[i]
			}
		}

		if(club){
			innertext("#modaltitle",clubtext("editclub"),false)
			value("#clubid",club["id"])
			value("#clubname",club["name"])
			value("#clubaddress",club["address"])
			value("#clubps",club["ps"]||"")
            domgetid("clubname").readOnly=club["owned"]==false
            domgetid("clubaddress").readOnly=club["owned"]==false
            domgetid("clubsharedhint").hidden=club["owned"]!=false
			leaveguard.clear()
			openclubmodal()
		}
	})

	onclick(".deletebutton",function(element,event){
		if(cluborderchangeded||clubmutatinged||clubloadinged||clubordersavinged){
			return
		}
		let clubid=dataset(element,"id")
		ptconfirm(clubtext("deleteconfirm"),function(ok){
			if(!ok||cluborderchangeded||clubmutatinged||clubloadinged||clubordersavinged){
				return
			}
			clubmutatinged=true
			main()

			ajax("DELETE",AJAXURL+"deleteclub/"+clubid,function(event,data){
				clubmutatinged=false
				if(data["success"]){
					pttoastsuccess(clubtext("deletesuccess"))
					pttoastwarning(clubtext("deletenext"))
					loadclubdata()
				}else{
					pttoasterror(clubtext("deletefail"))
					main()
				}
			},null,[
				["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
			],{
				loadingtarget: "#clubmain"
			})
		})
	})
}

onclick("#addclubbutton",function(){
	if(cluborderchangeded||clubmutatinged||clubloadinged||clubordersavinged){
		return
	}
	innertext("#modaltitle",clubtext("addclub"),false)
	value("#clubid","")
	value("#clubname","")
	value("#clubaddress","")
	value("#clubps","")
    domgetid("clubname").readOnly=false
    domgetid("clubaddress").readOnly=false
    domgetid("clubsharedhint").hidden=true
	leaveguard.clear()
	openclubmodal()
})

onclick("#closemodal",function(element,event){
	if(!leaveguard.confirmleave()){
		return
	}
	closeclubmodal()
})

onclick("#cancelbutton",function(element,event){
	if(!leaveguard.confirmleave()){
		return
	}
	closeclubmodal()
})

onsubmit("#clubform",function(element,event){
	event.preventDefault()
	if(clubmutatinged||clubloadinged||clubordersavinged||cluborderchangeded){
		return
	}

	let clubid=getvalue("clubid")
	let method="POST"
	let url=AJAXURL+"newclub"

	if(clubid){
		method="PUT"
		url=AJAXURL+"editclub/"+clubid
	}
    let payload={"name": getvalue("clubname"),"address": getvalue("clubaddress"),"ps": getvalue("clubps")}
    for(let i=0;i<clubdata.length;i=i+1){
        if(String(clubdata[i]["id"])==String(clubid)&&clubdata[i]["owned"]==false){
            url=AJAXURL+"editclubnote/"+clubid
            payload={"ps": getvalue("clubps")}
        }
    }

	clubmutatinged=true
	main()
	ajax(method,url,function(event,data){
		clubmutatinged=false
		if(data["success"]){
			if(clubid){
				pttoastsuccess(clubtext("editsuccess"))
			}else{
				pttoastsuccess(clubtext("addsuccess"))
			}

			leaveguard.clear()
			closeclubmodal()

			loadclubdata()
		}else{
			main()
			if(data["data"]){
				pttoasterror(clubtext("operationfail")+": "+data["data"])
			}else{
				pttoasterror(clubtext("operationfail")+": "+clubtext("unknownerror"))
			}
		}
	},str(payload),[
		["Authorization","Bearer "+weblsget(WEBLSNAME+"token")],
		["Content-Type","application/json"]
	],{
		loadingtarget: "#clubmodal"
	})
})

onclick("#searchbutton",function(element,event){
	if(!cluborderchangeded&&!clubmutatinged&&!clubloadinged&&!clubordersavinged){
		clubsearchname=String(getvalue("searchname")||"").toLowerCase().trim()
		main()
	}
})

onclick("#clearsearchbutton",function(element,event){
	if(!cluborderchangeded&&!clubmutatinged&&!clubloadinged&&!clubordersavinged){
		value("#searchname","")
		clubsearchname=""
		main()
	}
})

on("#searchname","keypress",function(event){
	if(event.key=="Enter"&&!cluborderchangeded&&!clubmutatinged&&!clubloadinged&&!clubordersavinged){
		clubsearchname=String(getvalue("searchname")||"").toLowerCase().trim()
		main()
	}
})

window.addEventListener("resize",function(){
	main()
})

onclick("#clubcustomorderbutton",function(){
    clubsortstate["key"]=""
    clubsearchname=""
    value("#searchname","")
    main()
})

function moveclub(source,target,keyboarded){
    if(clubcanreorder()&&0<=source&&source<cluborderlist.length&&0<=target&&target<cluborderlist.length&&source!=target){
        const MOVED=cluborderlist.splice(source,1)[0]
        cluborderlist.splice(target,0,MOVED)
        cluborderchangeded=false
        for(let i=0;i<cluborderlist.length;i=i+1){
            if(cluborderlist[i]["id"]!=clubpreviousidlist[i]){
                cluborderchangeded=true
            }
        }
        if(cluborderchangeded){
            leaveguard.markdirty()
            clubordermessage=clubtext("ordermoved")
        }else{
            leaveguard.clear()
            clubordermessage=clubtext("orderunchanged")
        }
        cluborderfailed=false
        main()
        const NEXT=document.querySelector(".clubordergrip[data-id='"+MOVED["id"]+"']")
        if(NEXT){
            NEXT.focus({"preventScroll": true})
            if(keyboarded){
                NEXT.scrollIntoView({"block": "nearest"})
            }
        }
    }
}

function endclubdrag(){
    const HANDLE=clubdraghandle
    const POINTER=clubdragpointer
    clubdragid=0
    clubdraghandle=null
    clubdragstarted=false
    clubdragtarget=-1
    if(clubdraganimation){
        cancelAnimationFrame(clubdraganimation)
        clubdraganimation=0
    }
    if(HANDLE&&HANDLE.hasPointerCapture(POINTER)){
        HANDLE.releasePointerCapture(POINTER)
    }
    if(clubdraglabel){
        clubdraglabel.remove()
        clubdraglabel=null
    }
    const ROWLIST=document.querySelectorAll("[data-clubrow]")
    for(let i=0;i<ROWLIST.length;i=i+1){
        ROWLIST[i].classList.remove("clubdragactive")
        ROWLIST[i].style.removeProperty("transform")
    }
    clubdraggeometry=[]
    document.body.classList.remove("clubdragged")
}

function updateclubdrag(autoscrolled){
    if(clubdragid){
        if(clubdragstarted){
            const MAINRECT=domgetid("clubmain").getBoundingClientRect()
            const FOOTER=domgetid("cluborderfooter")
            const FOOTERRECT=FOOTER.getBoundingClientRect()
            const OVERFOOTER=!FOOTER.hidden&&clubdragx>=FOOTERRECT.left&&clubdragx<=FOOTERRECT.right&&clubdragy>=FOOTERRECT.top&&clubdragy<=FOOTERRECT.bottom
            let visiblebottom=window.innerHeight
            if(!FOOTER.hidden){
                visiblebottom=Math.min(visiblebottom,FOOTERRECT.top)
            }
            const ROWLIST=domgetid("clubmain").querySelectorAll("[data-clubrow]")
            let source=-1
            let slot=ROWLIST.length
            for(let i=0;i<ROWLIST.length;i=i+1){
                const GEOMETRY=clubdraggeometry[i]
                if(Number(ROWLIST[i].dataset["id"])==clubdragid){
                    source=i
                }
                const CENTER=clubdragorigintop+clubdragy-clubdragstarty+clubdragheight/2
                if(slot==ROWLIST.length&&CENTER<GEOMETRY["top"]-window.scrollY+GEOMETRY["height"]/2){
                    slot=i
                }
            }
            clubdragtarget=-1
            if(source>=0&&!OVERFOOTER&&clubdragx>=MAINRECT.left&&clubdragx<=MAINRECT.right&&clubdragy>=MAINRECT.top&&clubdragy<=MAINRECT.bottom&&clubdragy>=0&&clubdragy<=window.innerHeight){
                clubdragtarget=slot
                if(source<slot){
                    clubdragtarget=slot-1
                }
            }
            for(let i=0;i<ROWLIST.length;i=i+1){
                let offset=0
                if(clubdragtarget>source&&i>source&&i<=clubdragtarget){
                    offset=-clubdragpitch
                }else if(clubdragtarget>=0&&clubdragtarget<source&&i>=clubdragtarget&&i<source){
                    offset=clubdragpitch
                }
                ROWLIST[i].style.transform="translateY("+offset+"px)"
            }
            if(clubdraglabel){
                clubdraglabel.style.left=clubdragoriginleft+"px"
                clubdraglabel.style.top=clubdragorigintop+clubdragy-clubdragstarty+"px"
            }
            if(autoscrolled&&clubdragx>=MAINRECT.left&&clubdragx<=MAINRECT.right){
                if(clubdragy<96&&MAINRECT.top<80){
                    window.scrollBy(0,-Math.min(20,Math.max(2,(96-clubdragy)/4),80-MAINRECT.top))
                }else if(clubdragy>visiblebottom-64&&MAINRECT.bottom>visiblebottom){
                    window.scrollBy(0,Math.min(20,Math.max(2,(clubdragy-visiblebottom+64)/4),MAINRECT.bottom-visiblebottom))
                }
            }
        }
    }
}

function animateclubdrag(){
    updateclubdrag(true)
    if(clubdragid){
        clubdraganimation=requestAnimationFrame(animateclubdrag)
    }
}

domgetid("clubmain").addEventListener("pointerdown",function(event){
    const HANDLE=event.target.closest(".clubordergrip")
    if(HANDLE&&!HANDLE.disabled&&event.button==0&&event.isPrimary&&clubcanreorder()){
        event.preventDefault()
        clubdragid=Number(HANDLE.dataset["id"])
        clubdragpointer=event.pointerId
        clubdragstartx=event.clientX
        clubdragstarty=event.clientY
        clubdragx=event.clientX
        clubdragy=event.clientY
        clubdraghandle=HANDLE
        HANDLE.focus({"preventScroll": true})
        HANDLE.setPointerCapture(event.pointerId)
        clubdraganimation=requestAnimationFrame(animateclubdrag)
    }
})

domgetid("clubmain").addEventListener("pointermove",function(event){
    if(clubdragid&&event.pointerId==clubdragpointer){
        clubdragx=event.clientX
        clubdragy=event.clientY
        if(!clubdragstarted&&Math.hypot(clubdragx-clubdragstartx,clubdragy-clubdragstarty)>=8){
            clubdragstarted=true
            document.body.classList.add("clubdragged")
            const ROW=clubdraghandle.closest("[data-clubrow]")
            const RECT=ROW.getBoundingClientRect()
            clubdragorigintop=RECT.top
            clubdragoriginleft=RECT.left
            clubdragheight=RECT.height
            clubdragpitch=RECT.height
            clubdraggeometry=[]
            const ROWLIST=domgetid("clubmain").querySelectorAll("[data-clubrow]")
            for(let i=0;i<ROWLIST.length;i=i+1){
                const ROWRECT=ROWLIST[i].getBoundingClientRect()
                clubdraggeometry.push({"top": ROWRECT.top+window.scrollY,"height": ROWRECT.height})
                if(ROWLIST[i]==ROW){
                    if(i+1<ROWLIST.length){
                        clubdragpitch=ROWLIST[i+1].getBoundingClientRect().top-ROWRECT.top
                    }else if(i>0){
                        clubdragpitch=ROWRECT.top-ROWLIST[i-1].getBoundingClientRect().bottom+ROWRECT.height
                    }
                }
            }
            clubdraglabel=document.createElement("div")
            clubdraglabel.className="clubdraglabel"
            clubdraglabel.setAttribute("aria-hidden","true")
            clubdraglabel.setAttribute("inert","")
            clubdraglabel.style.width=RECT.width+"px"
            clubdraglabel.style.left=RECT.left+"px"
            clubdraglabel.style.top=RECT.top+"px"
            const CLONE=ROW.cloneNode(true)
            CLONE.removeAttribute("data-clubrow")
            CLONE.removeAttribute("data-id")
            const IDENTIFIED=CLONE.querySelectorAll("[id]")
            for(let i=0;i<IDENTIFIED.length;i=i+1){
                IDENTIFIED[i].removeAttribute("id")
            }
            if(ROW.tagName=="TR"){
                const TABLE=document.createElement("table")
                TABLE.className="clubdragtable"
                const BODY=document.createElement("tbody")
                const ORIGINALCELL=ROW.querySelectorAll("td")
                const CLONECELL=CLONE.querySelectorAll("td")
                for(let i=0;i<ORIGINALCELL.length;i=i+1){
                    CLONECELL[i].style.width=ORIGINALCELL[i].getBoundingClientRect().width+"px"
                }
                BODY.appendChild(CLONE)
                TABLE.appendChild(BODY)
                clubdraglabel.appendChild(TABLE)
            }else{
                clubdraglabel.appendChild(CLONE)
            }
            document.body.appendChild(clubdraglabel)
            ROW.classList.add("clubdragactive")
        }
    }
})

domgetid("clubmain").addEventListener("pointerup",function(event){
    if(clubdragid&&event.pointerId==clubdragpointer){
        clubdragx=event.clientX
        clubdragy=event.clientY
        updateclubdrag(false)
        const SOURCEID=clubdragid
        const TARGET=clubdragtarget
        const STARTEDED=clubdragstarted
        endclubdrag()
        if(STARTEDED&&TARGET>=0){
            let source=-1
            for(let i=0;i<cluborderlist.length;i=i+1){
                if(cluborderlist[i]["id"]==SOURCEID){
                    source=i
                }
            }
            moveclub(source,TARGET)
        }
    }
})

domgetid("clubmain").addEventListener("pointercancel",function(){
    endclubdrag()
})

domgetid("clubmain").addEventListener("lostpointercapture",function(){
    if(clubdragid){
        endclubdrag()
    }
})

domgetid("clubmain").addEventListener("keydown",function(event){
    const HANDLE=event.target.closest(".clubordergrip")
    if(HANDLE&&!HANDLE.disabled&&clubcanreorder()&&(event.key=="ArrowUp"||event.key=="ArrowDown")){
        event.preventDefault()
        let direction=1
        if(event.key=="ArrowUp"){
            direction=-1
        }
        for(let i=0;i<cluborderlist.length;i=i+1){
            if(cluborderlist[i]["id"]==Number(HANDLE.dataset["id"])){
                moveclub(i,i+direction,true)
                break
            }
        }
    }
})

document.addEventListener("keydown",function(event){
    if(event.key=="Escape"&&clubdragid){
        event.preventDefault()
        endclubdrag()
    }
})

domgetid("clubmain").addEventListener("click",function(event){
    if(event.target.id=="clubretrybutton"&&!clubloadinged){
        loadclubdata()
    }
})

onclick("#clubordercancel",function(){
    if(!clubordersavinged&&!clubloadinged){
        cluborderchangeded=false
        cluborderfailed=false
        cluborderconflicted=false
        cluborderlist=clubdata.slice()
        leaveguard.clear()
        main()
        const HANDLE=document.querySelector(".clubordergrip")
        if(HANDLE){
            HANDLE.focus({"preventScroll": true})
        }
    }
})

onclick("#cluborderreload",function(){
    if(!clubordersavinged&&!clubloadinged){
        if(cluborderchangeded){
            ptconfirm(clubtext("orderreloadconfirm"),function(confirmed){
                if(confirmed){
                    loadclubdata()
                }
            })
        }else{
            loadclubdata()
        }
    }
})

onclick("#clubordersave",function(){
    if(cluborderchangeded&&!clubordersavinged&&!clubloadinged&&!cluborderconflicted){
        const CLUBIDLIST=[]
        for(let i=0;i<cluborderlist.length;i=i+1){
            CLUBIDLIST.push(cluborderlist[i]["id"])
        }
        clubordersavinged=true
        cluborderfailed=false
        main()
        ajax("PUT",AJAXURL+"editcluborder",function(event,data){
            clubordersavinged=false
            if(data["success"]&&Array.isArray(data["data"])){
                clubdata=data["data"]
                cluborderchangeded=false
                cluborderfailed=false
                cluborderlist=clubdata.slice()
                clubpreviousidlist=[]
                for(let i=0;i<clubdata.length;i=i+1){
                    clubpreviousidlist.push(clubdata[i]["id"])
                }
                leaveguard.clear()
                main()
                pttoastsuccess(clubtext("ordersaved"))
                const HANDLE=document.querySelector(".clubordergrip")
                if(HANDLE){
                    HANDLE.focus({"preventScroll": true})
                }
            }else{
                cluborderfailed=true
                cluborderconflicted=data["data"]=="ERROR_club_order_conflict"
                clubordermessage=clubtext("orderfail")
                if(typeof data["data"]=="string"&&TRANSLATE[LANGUAGE]["errorlist"][data["data"]]){
                    clubordermessage=pterror(data["data"])
                }
                main()
            }
        },str({"clubidlist": CLUBIDLIST,"previousidlist": clubpreviousidlist}),[
            ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")],
            ["Content-Type","application/json"]
        ])
    }
})

loadclubdata()
