let profileidentitydata=null
let profileidentitydialog=null

function profileidentitytext(key){
    return TRANSLATE[LANGUAGE]["profile"][key]||key
}

function updateprofileidentity(row){
    profileidentitydata={"id": row["id"],"playerid": row["playerid"],"playeridchangedtime": row["playeridchangedtime"]}
    document.getElementById("editplayerid").hidden=Boolean(row["playeridchangedtime"])
    document.getElementById("showplayerqr").disabled=false
}

document.getElementById("showplayerqr").addEventListener("click",function(){
    if(profileidentitydata&&!profileidentitydialog){
        const DIALOG=document.createElement("dialog")
        DIALOG.className="profileidentitydialog"
        DIALOG.setAttribute("role","dialog")
        DIALOG.setAttribute("aria-label",profileidentitytext("myqr"))
        const TITLE=document.createElement("h2")
        TITLE.textContent=profileidentitytext("myqr")
        const CANVAS=document.createElement("canvas")
        const MATRIX=qrmatrix("PTUSER:"+profileidentitydata["id"],"M")
        const SCALE=8
        CANVAS.width=(MATRIX["size"]+8)*SCALE
        CANVAS.height=CANVAS.width
        const CONTEXT=CANVAS.getContext("2d")
        CONTEXT.fillStyle="#ffffff"
        CONTEXT.fillRect(0,0,CANVAS.width,CANVAS.height)
        CONTEXT.fillStyle="#000000"
        for(let y=0;y<MATRIX["size"];y=y+1){
            for(let x=0;x<MATRIX["size"];x=x+1){
                if(MATRIX["modules"][y][x]){
                    CONTEXT.fillRect((x+4)*SCALE,(y+4)*SCALE,SCALE,SCALE)
                }
            }
        }
        const ID=document.createElement("p")
        ID.textContent=profileidentitydata["playerid"]
        const DESCRIPTION=document.createElement("p")
        DESCRIPTION.textContent=profileidentitytext("qrdesc")
        const CLOSE=document.createElement("input")
        CLOSE.type="button"
        CLOSE.className="profileidentitybutton"
        CLOSE.value=TRANSLATE[LANGUAGE]["usernote"]["close"]
        CLOSE.addEventListener("click",function(){DIALOG.close()})
        DIALOG.append(TITLE,CANVAS,ID,DESCRIPTION,CLOSE)
        document.body.appendChild(DIALOG)
        profileidentitydialog=DIALOG
        ptlockpagescroll()
        DIALOG.addEventListener("close",function(){
            DIALOG.remove()
            profileidentitydialog=null
            ptunlockpagescroll()
            document.getElementById("showplayerqr").focus()
        })
        DIALOG.showModal()
    }
})

document.getElementById("editplayerid").addEventListener("click",function(){
    if(profileidentitydata&&!profileidentitydata["playeridchangedtime"]&&!profileidentitydialog){
        const TOKEN=weblsget(WEBLSNAME+"token")
        const DIALOG=document.createElement("dialog")
        DIALOG.className="profileidentitydialog"
        DIALOG.setAttribute("role","dialog")
        DIALOG.setAttribute("aria-label",profileidentitytext("editid"))
        DIALOG.innerHTML=`<form><h2>${profileidentitytext("editid")}</h2><p>${profileidentitytext("idonce")}</p><label>${profileidentitytext("idlabel")}<input type="text" class="profileidentityinput" name="playerid" minlength="8" maxlength="8" pattern="[1-9][0-9]{7}" inputmode="numeric" autocomplete="off" required></label><p class="profileidentitystage"></p><p class="profileidentityerror" role="alert" hidden></p><div class="profileidentityaction"><input type="button" class="profileidentitybutton" name="cancel" value="${TRANSLATE[LANGUAGE]["usernote"]["cancel"]}"><input type="submit" class="profileidentitybutton profileidentityprimary" value="${profileidentitytext("idnext")}"></div></form>`
        const FORM=DIALOG.querySelector("form")
        const INPUT=FORM.querySelector('input[name="playerid"]')
        const ERROR=FORM.querySelector(".profileidentityerror")
        const STAGE=FORM.querySelector(".profileidentitystage")
        const SUBMIT=FORM.querySelector('input[type="submit"]')
        const CANCEL=FORM.querySelector('input[name="cancel"]')
        let step=0
        let checkinged=false
        let savinged=false
        CANCEL.addEventListener("click",function(){if(!savinged){DIALOG.close()}})
        FORM.addEventListener("submit",function(event){
            event.preventDefault()
            ERROR.hidden=true
            if(!savinged&&!checkinged&&TOKEN==weblsget(WEBLSNAME+"token")){
                if(step==0){
                    if(INPUT.value==String(profileidentitydata["playerid"])){
                        ERROR.textContent=pterror("ERROR_playerid_same")
                        ERROR.hidden=false
                    }else if(FORM.reportValidity()){
                        const CANDIDATE=INPUT.value
                        checkinged=true
                        INPUT.readOnly=true
                        SUBMIT.disabled=true
                        SUBMIT.value=profileidentitytext("idchecking")
                        ajax("POST",AJAXURL+"checkmyplayerid",function(event,data){
                            checkinged=false
                            if(DIALOG.isConnected&&DIALOG.open&&TOKEN==weblsget(WEBLSNAME+"token")){
                                SUBMIT.disabled=false
                                if(data&&data["success"]&&data["data"]&&data["data"]["playerid"]==CANDIDATE){
                                    INPUT.value=CANDIDATE
                                    step=1
                                    STAGE.textContent=profileidentitytext("idconfirm1").replace("{id}",CANDIDATE)
                                    SUBMIT.value=profileidentitytext("idconfirmbutton1")
                                }else{
                                    INPUT.readOnly=false
                                    SUBMIT.value=profileidentitytext("idnext")
                                    ERROR.textContent=pterror(data&&data["data"]||"ERROR_database_error")
                                    ERROR.hidden=false
                                    INPUT.focus()
                                }
                            }
                        },JSON.stringify({"playerid": CANDIDATE}),[["Authorization","Bearer "+TOKEN]],{"authfailurehandled": true,"silent": true})
                    }
                }else if(step==1){
                    step=2
                    INPUT.readOnly=true
                    STAGE.textContent=profileidentitytext("idconfirm"+step).replace("{id}",INPUT.value)
                    SUBMIT.value=profileidentitytext("idconfirmbutton"+step)
                }else{
                    savinged=true
                    SUBMIT.disabled=true
                    CANCEL.disabled=true
                    ajax("PUT",AJAXURL+"editmyplayerid",function(event,data){
                        savinged=false
                        if(TOKEN==weblsget(WEBLSNAME+"token")){
                            if(data&&data["success"]){
                                DIALOG.close()
                                loadgetuser()
                                pttoastsuccess(profileidentitytext("idchanged"))
                            }else{
                                ERROR.textContent=pterror(data&&data["data"]||"ERROR_database_error")
                                ERROR.hidden=false
                                SUBMIT.disabled=false
                                CANCEL.disabled=false
                                INPUT.readOnly=false
                                step=0
                                SUBMIT.value=profileidentitytext("idnext")
                                STAGE.textContent=""
                            }
                        }
                    },JSON.stringify({"playerid": INPUT.value,"confirmplayerid": INPUT.value,"confirmagain": INPUT.value}),[["Authorization","Bearer "+TOKEN]],{"authfailurehandled": true,"loadingtarget": FORM})
                }
            }
        })
        DIALOG.addEventListener("cancel",function(event){if(savinged){event.preventDefault()}})
        DIALOG.addEventListener("close",function(){
            DIALOG.remove()
            profileidentitydialog=null
            ptunlockpagescroll()
        })
        document.body.appendChild(DIALOG)
        profileidentitydialog=DIALOG
        ptlockpagescroll()
        DIALOG.showModal()
    }
})

window.addEventListener("storage",function(event){
    if(event.key==WEBLSNAME+"token"){
        profileidentitydata=null
        if(profileidentitydialog){profileidentitydialog.close()}
        document.getElementById("editplayerid").hidden=true
        document.getElementById("showplayerqr").disabled=true
    }
})
