const USERNOTECOLORLIST=["#f87171","#fbbf24","#34d399","#60a5fa","#d4d4d8"]
let usernotecache={}
let usernotetoken=""
let usernotegeneration=0
let usernoteauthorid=0
let usernotedialog=null
let usernotequeued=false

function ptusernotetext(key){
    return TRANSLATE[LANGUAGE]["usernote"][key]||key
}

function ptusernotesafehtml(text){
    return String(text||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")
}

function ptusernotesession(){
    const TOKEN=weblsget(WEBLSNAME+"token")||""
    if(TOKEN!=usernotetoken){
        usernotegeneration=usernotegeneration+1
        usernotetoken=TOKEN
        usernotecache={}
        usernoteauthorid=0
        if(usernotedialog){
            usernotedialog.close()
        }
        const ENTRYLIST=document.querySelectorAll(".ptusernote")
        for(let i=0;i<ENTRYLIST.length;i=i+1){
            if(ENTRYLIST[i].dataset.usernoteview=="avatar"){
                ENTRYLIST[i].style.removeProperty("--usernote-color")
                ENTRYLIST[i].dataset.usernoteenabled="0"
                ENTRYLIST[i].removeAttribute("role")
                ENTRYLIST[i].removeAttribute("tabindex")
                ENTRYLIST[i].removeAttribute("aria-disabled")
            }else{
                ENTRYLIST[i].textContent=""
            }
            ENTRYLIST[i].removeAttribute("title")
            ENTRYLIST[i].setAttribute("aria-label",ptusernotetext("title"))
        }
    }
    return TOKEN
}

function ptusernotehtml(userid,name){
    const ID=Number(userid)
    let html=""
    if(Number.isSafeInteger(ID)&&ID>0&&ID!=usernoteauthorid){
        html=`<span class="ptusernote" data-usernoteid="${ID}" data-usernotename="${ptusernotesafehtml(name)}" role="button" tabindex="0" aria-label="${ptusernotesafehtml(ptusernotetext("title"))}"></span>`
    }
    return html
}

function ptusernoteavatarhtml(userid,name,avatarhtml){
    const ID=Number(userid)
    let html=avatarhtml
    if(Number.isSafeInteger(ID)&&ID>0){
        html=`<span class="ptusernote ptusernoteavatar" data-usernoteid="${ID}" data-usernotename="${ptusernotesafehtml(name)}" data-usernoteview="avatar" role="button" tabindex="0" aria-label="${ptusernotesafehtml(ptusernotetext("title"))}">${avatarhtml}</span>`
    }
    return html
}

function ptusernotepaint(){
    const ENTRYLIST=document.querySelectorAll(".ptusernote")
    for(let i=0;i<ENTRYLIST.length;i=i+1){
        const ENTRY=ENTRYLIST[i]
        const AVATARED=ENTRY.dataset.usernoteview=="avatar"
        const ENABLED=Boolean(usernotetoken)&&Number(ENTRY.dataset.usernoteid)!=usernoteauthorid
        ENTRY.hidden=!AVATARED&&!ENABLED
        const STATE=usernotecache[ENTRY.dataset.usernoteid]
        let text=ptusernotetext("loading")
        let color=""
        ENTRY.removeAttribute("aria-disabled")
        ENTRY.removeAttribute("title")
        if(STATE&&STATE["state"]=="loaded"){
            const DATA=STATE["data"]
            text=DATA["note"]||ptusernotetext("add")
            color=DATA["color"]||""
            if(color&&!DATA["note"]){
                text=ptusernotetext("colornote")
            }
            ENTRY.setAttribute("aria-label",ptusernotetext("title")+" · "+ENTRY.dataset.usernotename+" · "+text)
        }else if(STATE&&STATE["state"]=="error"){
            text=ptusernotetext("loaderror")
            ENTRY.setAttribute("aria-label",text)
        }else{
            ENTRY.setAttribute("aria-disabled","true")
            ENTRY.setAttribute("aria-label",text)
        }
        if(AVATARED){
            ENTRY.dataset.usernoteenabled="0"
            ENTRY.removeAttribute("role")
            ENTRY.removeAttribute("tabindex")
            ENTRY.style.removeProperty("--usernote-color")
            ENTRY.setAttribute("aria-label",ENTRY.dataset.usernotename||ptusernotetext("account"))
            if(ENABLED){
                ENTRY.dataset.usernoteenabled="1"
                ENTRY.setAttribute("role","button")
                ENTRY.setAttribute("tabindex","0")
                ENTRY.setAttribute("aria-label",ptusernotetext("title")+" · "+ENTRY.dataset.usernotename)
                if(STATE&&STATE["state"]=="error"){
                    ENTRY.setAttribute("aria-label",ptusernotetext("loaderror")+" · "+ENTRY.dataset.usernotename)
                }
                if(/^#[0-9a-f]{6}$/i.test(color)){
                    ENTRY.style.setProperty("--usernote-color",color)
                }
            }else{
                ENTRY.removeAttribute("aria-disabled")
            }
        }else{
            ENTRY.replaceChildren()
            if(/^#[0-9a-f]{6}$/i.test(color)){
                const DOT=document.createElement("span")
                DOT.className="ptusernotedot"
                DOT.style.backgroundColor=color
                DOT.setAttribute("aria-hidden","true")
                ENTRY.appendChild(DOT)
            }
            const COPY=document.createElement("span")
            COPY.className="ptusernotecopy"
            COPY.textContent=text
            ENTRY.appendChild(COPY)
            const ICON=document.createElement("span")
            ICON.className="ptusernoteicon"
            ICON.textContent="✎"
            ICON.setAttribute("aria-hidden","true")
            ENTRY.appendChild(ICON)
        }
    }
}

function ptusernoterefresh(){
    const TOKEN=ptusernotesession()
    if(TOKEN){
        const ENTRYLIST=document.querySelectorAll(".ptusernote")
        const IDLIST=[]
        for(let i=0;i<ENTRYLIST.length;i=i+1){
            const ENTRY=ENTRYLIST[i]
            const ID=Number(ENTRY.dataset.usernoteid)
            if(ENTRY.dataset.usernotebound!="1"){
                ENTRY.dataset.usernotebound="1"
                ENTRY.addEventListener("click",function(event){
                    if(ENTRY.dataset.usernoteenabled!="0"){
                        event.preventDefault()
                        event.stopPropagation()
                        ptusernoteopen(ENTRY)
                    }
                })
                ENTRY.addEventListener("keydown",function(event){
                    if(ENTRY.dataset.usernoteenabled!="0"&&(event.key=="Enter"||event.key==" ")){
                        event.preventDefault()
                        event.stopPropagation()
                        ENTRY.click()
                    }
                })
            }
            const STATE=usernotecache[ID]
            if(!STATE||(STATE["state"]=="loaded"&&Date.now()-STATE["time"]>15000)){
                usernotecache[ID]={"state": "loading"}
                IDLIST.push(ID)
            }
        }
        ptusernotepaint()
        for(let i=0;i<IDLIST.length;i=i+100){
            const BATCH=IDLIST.slice(i,i+100)
            const GENERATION=usernotegeneration
            ajax("POST",AJAXURL+"getusernotelist",function(event,data){
                if(ptusernotesession()==TOKEN&&usernotegeneration==GENERATION){
                    const RESULT={}
                    if(data&&data["success"]&&Array.isArray(data["data"])){
                        usernoteauthorid=Number(data["userid"]||0)
                        for(let j=0;j<data["data"].length;j=j+1){
                            const ITEM=data["data"][j]
                            RESULT[ITEM["targetuserid"]]=ITEM
                        }
                        for(let j=0;j<BATCH.length;j=j+1){
                            if(usernotecache[BATCH[j]]&&usernotecache[BATCH[j]]["state"]=="loading"){
                                usernotecache[BATCH[j]]={"state": "loaded","time": Date.now(),"data": RESULT[BATCH[j]]||{"color": "","note": ""}}
                            }
                        }
                    }else{
                        for(let j=0;j<BATCH.length;j=j+1){
                            if(usernotecache[BATCH[j]]&&usernotecache[BATCH[j]]["state"]=="loading"){
                                usernotecache[BATCH[j]]={"state": "error"}
                            }
                        }
                    }
                    ptusernotepaint()
                }
            },JSON.stringify({"targetuseridlist": BATCH}),[["Authorization","Bearer "+TOKEN]],{"authfailurehandled": true})
        }
    }
}

function ptusernotequeue(){
    if(!usernotequeued){
        usernotequeued=true
        setTimeout(function(){
            usernotequeued=false
            ptusernoterefresh()
        },0)
    }
}

function ptusernoteopen(entry){
    const TOKEN=ptusernotesession()
    const ID=Number(entry.dataset.usernoteid)
    const STATE=usernotecache[ID]
    const ENABLED=ID!=usernoteauthorid&&entry.dataset.usernoteenabled!="0"
    if(TOKEN&&ENABLED&&STATE&&STATE["state"]=="error"){
        delete usernotecache[ID]
        ptusernoterefresh()
    }else if(TOKEN&&ENABLED&&STATE&&STATE["state"]=="loaded"&&!usernotedialog){
        const DATA=STATE["data"]
        const GENERATION=usernotegeneration
        const DIALOG=document.createElement("dialog")
        DIALOG.className="ptusernoteeditor"
        DIALOG.setAttribute("role","dialog")
        DIALOG.setAttribute("aria-label",ptusernotetext("title"))
        let color=DATA["color"]||""
        let savinged=false
        let colorhtml=""
        for(let i=0;i<USERNOTECOLORLIST.length;i=i+1){
            colorhtml=colorhtml+`<label class="ptusernotecoloroption"><input type="radio" class="ptusernotecolorchoice" name="usernotecolor" value="${USERNOTECOLORLIST[i]}" aria-label="${ptusernotesafehtml(ptusernotetext("color"+i))}"><span>${ptusernotesafehtml(ptusernotetext("color"+i))}</span></label>`
        }
        DIALOG.innerHTML=`
            <form class="ptusernoteform">
                <div class="ptusernoteheading"><div><h2>${ptusernotesafehtml(ptusernotetext("title"))}</h2><p>${ptusernotesafehtml(ptusernotetext("private"))}</p></div><input type="button" class="ptusernotequiet ptusernoteclose" value="${ptusernotesafehtml(ptusernotetext("close"))}"></div>
                <div class="ptusernotetarget"></div>
                <fieldset><legend>${ptusernotesafehtml(ptusernotetext("colorlabel"))}</legend><div class="ptusernotecolorlist">${colorhtml}<label class="ptusernotecoloroption"><input type="color" class="ptusernotecustom" value="#34d399" aria-label="${ptusernotesafehtml(ptusernotetext("custom"))}"><span>${ptusernotesafehtml(ptusernotetext("custom"))}</span></label></div></fieldset>
                <p class="ptusernoteselection" aria-live="polite"></p>
                <label class="ptusernotelabel"><span>${ptusernotesafehtml(ptusernotetext("textlabel"))}</span><textarea class="ptusernotetextarea" rows="5" placeholder="${ptusernotesafehtml(ptusernotetext("placeholder"))}"></textarea></label>
                <div class="ptusernotecounter"></div>
                <p class="ptusernoteerror" role="alert" hidden></p>
                <div class="ptusernoteaction"><input type="button" class="ptusernotequiet ptusernoteclearall" value="${ptusernotesafehtml(ptusernotetext("clear"))}"><div><input type="button" class="ptusernotesecondary ptusernoteclose" value="${ptusernotesafehtml(ptusernotetext("cancel"))}"><input type="submit" class="ptusernoteprimary" value="${ptusernotesafehtml(ptusernotetext("save"))}"></div></div>
            </form>
        `
        const FORM=DIALOG.querySelector("form")
        const TEXTAREA=DIALOG.querySelector("textarea")
        const ERROR=DIALOG.querySelector(".ptusernoteerror")
        const SAVE=DIALOG.querySelector("input[type=submit]")
        const CUSTOM=DIALOG.querySelector(".ptusernotecustom")
        const RADIOLIST=DIALOG.querySelectorAll("input[type=radio]")
        DIALOG.querySelector(".ptusernotetarget").textContent=entry.dataset.usernotename||ptusernotetext("account")+" "+ID
        TEXTAREA.value=DATA["note"]||""
        function updatecolor(){
            let label=ptusernotetext("custom")
            for(let i=0;i<RADIOLIST.length;i=i+1){
                RADIOLIST[i].checked=RADIOLIST[i].value==color
                if(RADIOLIST[i].checked){
                    label=ptusernotetext("color"+i)
                }
            }
            CUSTOM.classList.toggle("ptusernotecustomselected",Boolean(color)&&!USERNOTECOLORLIST.includes(color))
            DIALOG.querySelector(".ptusernoteselection").textContent=ptusernotetext("nocolorhint")
            if(color){
                CUSTOM.value=color
                DIALOG.querySelector(".ptusernoteselection").textContent=ptusernotetext("selected")+label
            }
        }
        function counttext(){
            const COUNT=Array.from(TEXTAREA.value).length
            DIALOG.querySelector(".ptusernotecounter").textContent=COUNT+" / 1,000"
            ERROR.hidden=COUNT<=1000
            if(COUNT>1000){
                ERROR.textContent=ptusernotetext("toolong")
            }
        }
        for(let i=0;i<RADIOLIST.length;i=i+1){
            RADIOLIST[i].style.setProperty("--usernotecolor",RADIOLIST[i].value)
            RADIOLIST[i].addEventListener("click",function(){
                if(color==RADIOLIST[i].value){
                    color=""
                }else{
                    color=RADIOLIST[i].value
                }
                updatecolor()
            })
            RADIOLIST[i].addEventListener("keydown",function(event){
                if(event.key==" "){
                    event.preventDefault()
                    if(!event.repeat){
                        RADIOLIST[i].click()
                    }
                }
            })
        }
        CUSTOM.addEventListener("input",function(){
            color=CUSTOM.value
            updatecolor()
        })
        TEXTAREA.addEventListener("input",counttext)
        CUSTOM.addEventListener("click",function(event){
            if(color&&color==CUSTOM.value&&!USERNOTECOLORLIST.includes(color)){
                event.preventDefault()
                color=""
                updatecolor()
            }
        })
        DIALOG.querySelector(".ptusernoteclearall").addEventListener("click",function(){
            color=""
            TEXTAREA.value=""
            updatecolor()
            counttext()
        })
        const CLOSELIST=DIALOG.querySelectorAll(".ptusernoteclose")
        for(let i=0;i<CLOSELIST.length;i=i+1){
            CLOSELIST[i].addEventListener("click",function(){
                if(!savinged){
                    DIALOG.close()
                }
            })
        }
        DIALOG.addEventListener("cancel",function(event){
            if(savinged){
                event.preventDefault()
            }
        })
        DIALOG.addEventListener("close",function(){
            DIALOG.remove()
            usernotedialog=null
            ptunlockpagescroll()
            const RETURN=document.querySelector('.ptusernote[data-usernoteid="'+ID+'"]')
            if(RETURN){
                RETURN.focus()
            }
        })
        FORM.addEventListener("submit",function(event){
            event.preventDefault()
            counttext()
            if(!savinged&&Array.from(TEXTAREA.value).length<=1000&&ptusernotesession()==TOKEN){
                savinged=true
                ERROR.hidden=true
                const CONTROLLIST=FORM.querySelectorAll("input, textarea")
                for(let i=0;i<CONTROLLIST.length;i=i+1){
                    CONTROLLIST[i].disabled=true
                }
                SAVE.value=ptusernotetext("saving")
                ajax("PUT",AJAXURL+"editusernote/"+ID,function(event,data){
                    savinged=false
                    if(ptusernotesession()==TOKEN&&usernotegeneration==GENERATION){
                        if(data&&data["success"]){
                            usernotecache[ID]={"state": "loaded","time": Date.now(),"data": data["data"]}
                            ptusernotepaint()
                            DIALOG.close()
                            document.dispatchEvent(new CustomEvent("ptusernotechanged",{"detail": {"targetuserid": ID}}))
                            pttoast(ptusernotetext("saved"),"success")
                        }else{
                            for(let i=0;i<CONTROLLIST.length;i=i+1){
                                CONTROLLIST[i].disabled=false
                            }
                            SAVE.value=ptusernotetext("save")
                            ERROR.textContent=ptusernotetext("saveerror")
                            if(data&&ptisauthfailure(data["data"])){
                                ERROR.textContent=ptusernotetext("autherror")
                            }
                            ERROR.hidden=false
                        }
                    }
                },JSON.stringify({"color": color,"note": TEXTAREA.value}),[["Authorization","Bearer "+TOKEN]],{"authfailurehandled": true,"loadingtarget": FORM})
            }
        })
        updatecolor()
        counttext()
        usernotedialog=DIALOG
        document.body.appendChild(DIALOG)
        ptlockpagescroll()
        DIALOG.showModal()
    }
}

const USERNOTEOBSERVER=new MutationObserver(function(mutationlist){
    let refreshed=false
    for(let i=0;i<mutationlist.length;i=i+1){
        const NODELIST=mutationlist[i].addedNodes
        for(let j=0;j<NODELIST.length;j=j+1){
            const NODE=NODELIST[j]
            if(NODE.nodeType==1&&(NODE.matches(".ptusernote")||NODE.querySelector(".ptusernote"))){
                refreshed=true
            }
        }
    }
    if(refreshed){
        ptusernotequeue()
    }
})
USERNOTEOBSERVER.observe(document.body,{"childList": true,"subtree": true})
window.addEventListener("storage",function(){
    ptusernotesession()
    ptusernotequeue()
})
window.addEventListener("pagehide",function(){
    usernotecache={}
    usernoteauthorid=0
    usernotetoken=""
    usernotegeneration=usernotegeneration+1
    if(usernotedialog){
        usernotedialog.close()
    }
    const ENTRYLIST=document.querySelectorAll(".ptusernote")
    for(let i=0;i<ENTRYLIST.length;i=i+1){
        if(ENTRYLIST[i].dataset.usernoteview=="avatar"){
            ENTRYLIST[i].style.removeProperty("--usernote-color")
            ENTRYLIST[i].dataset.usernoteenabled="0"
            ENTRYLIST[i].removeAttribute("role")
            ENTRYLIST[i].removeAttribute("tabindex")
            ENTRYLIST[i].removeAttribute("aria-disabled")
        }else{
            ENTRYLIST[i].textContent=""
            ENTRYLIST[i].hidden=true
        }
        ENTRYLIST[i].setAttribute("aria-label",ptusernotetext("title"))
    }
})
window.addEventListener("pageshow",ptusernotequeue)
ptusernotequeue()
