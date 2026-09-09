let tableid=getget("tableid")
let handid=getget("handid")||""
let state={
    row: {},
    context: {},
    maxseat: 9,
    dealerseat: 1,
    seatinglist: [null],
    adjustments: {},
    "adjustsignlist": {},
    editlatest: true,
    selfseating: null
}

function editmode(){
    return handid!=""
}

function noteonly(){
    // 編輯非最新一筆校正：只能改備註，計分牌鎖定（後端也只接受備註欄位）
    return editmode()&&!state.editlatest
}

if(!weblsget(WEBLSNAME+"signin")){
    href("signin.html")
}

function num(value){
    let result=parseInt(value,10)
    if(isNaN(result)){
        return 0
    }
    return result
}

function dom(id){
    return domgetid(id)
}

// 本頁的動態文案（TASK-006）。
// 靜態 HTML 由 initialize.js 的 pageauto 機制翻譯，但 settext() 動態寫入的字串它抓不到。
function stackadjusttext(key,fallback){
    if(typeof TRANSLATE!="undefined"&&typeof LANGUAGE!="undefined"&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["stackadjustpage"]&&TRANSLATE[LANGUAGE]["stackadjustpage"][key]!=undefined){
        return TRANSLATE[LANGUAGE]["stackadjustpage"][key]
    }
    return fallback
}

function settext(id,value){
    if(dom(id)){
        dom(id).textContent=String(value)
    }
}

function val(id){
    if(!dom(id)){
        return ""
    }
    return dom(id).value
}

function cachekey(){
    return WEBLSNAME+"stackadjust_"+tableid
}

function savecache(){
    if(editmode()){
        return
    }
    weblsset(cachekey(),str({
        adjustments: state.adjustments,
        "adjustsignlist": state.adjustsignlist,
        dealerseat: state.dealerseat,
        exceptiontype: val("exceptiontype"),
        ps: val("ps")
    }))
}

function loadcache(){
    if(editmode()){
        return
    }
    let raw=weblsget(cachekey())
    if(!raw){
        return
    }
    let data=json(raw)
    if(!data){
        return
    }
    if(data["adjustments"]){
        state.adjustments=data["adjustments"]
    }
    if(data["adjustsignlist"]){
        state.adjustsignlist=data["adjustsignlist"]
    }
    if(data["dealerseat"]){
        state.dealerseat=num(data["dealerseat"])
    }
    if(dom("exceptiontype")&&data["exceptiontype"]){
        dom("exceptiontype").value=data["exceptiontype"]
    }
    if(dom("ps")&&data["ps"]!=null){
        dom("ps").value=data["ps"]
    }
}

function clearcache(){
    weblsset(cachekey(),null)
}

function adjustsign(seat){
    let seatkey=String(seat)
    if(state.adjustsignlist[seatkey]=="negative"){
        return -1
    }
    if(num(state.adjustments[seat])<0||num(state.adjustments[seatkey])<0){
        return -1
    }
    return 1
}

function setadjustment(seat,amount,sign){
    let seatkey=String(seat)
    let value=Math.abs(num(amount))
    if(sign<0){
        state.adjustsignlist[seatkey]="negative"
        state.adjustments[seatkey]=0-value
    }else{
        state.adjustsignlist[seatkey]="positive"
        state.adjustments[seatkey]=value
    }
}

function api(method,url,body,callback){
    ajax(method,AJAXURL+url,function(event,data){
        callback(data)
    },body==null?null:str(body),[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ])
}

function activeSeats(){
    let seats=[]
    for(let i=1;i<state.seatinglist.length;i=i+1){
        if(state.seatinglist[i]&&state.seatinglist[i]!=false&&0<num(state.seatinglist[i]["chip"])){
            seats.push(i)
        }
    }
    return seats
}

function chip(seat){
    if(!state.seatinglist[seat]||state.seatinglist[seat]==false){
        return 0
    }
    return num(state.seatinglist[seat]["chip"])
}

function publicallowed(){
    return !!(state.context&&state.context["unifiedhandrecord"]&&state.context["access"]&&state.context["access"]["canunifiedrecord"])
}

function render(){
    settext("tablename",state.row["name"]||state.row["token"]||"-")
    settext("dealerlabel","Seat "+state.dealerseat)
    settext("playercount",stackadjusttext("playercount","{n} 人").replace("{n}",activeSeats().length))
    let total=0
    let seats=activeSeats()
    let selecthtml=""
    for(let i=0;i<seats.length;i=i+1){
        selecthtml=selecthtml+`<option value="${seats[i]}">Seat ${seats[i]}</option>`
    }
    dom("dealerseat").innerHTML=selecthtml
    dom("dealerseat").value=state.dealerseat
    let html=""
    for(let i=0;i<seats.length;i=i+1){
        let seat=seats[i]
        let adjust=num(state.adjustments[seat])
        let sign=adjustsign(seat)
        let inputvalue=Math.abs(adjust)
        let signclass=""
        if(sign<0){
            signclass=" active"
        }
        total=total+adjust
        html=html+`
            <div class="newhand-seatcard">
                <div>Seat ${seat}<br><span class="text-zinc-400 text-xs">${stackadjusttext("nowlabel","目前")} ${chip(seat).toLocaleString("en-US")} / ${stackadjusttext("afterlabel","校正後")} <span id="after-${seat}">${(chip(seat)+adjust).toLocaleString("en-US")}</span></span></div>
                <div class="stackadjust-control">
                    <input type="button" class="stackadjust-sign${signclass}" data-seat="${seat}" value="-">
                    <input type="number" class="adjustinput bg-zinc-700 text-white rounded px-2 py-2 w-32" data-seat="${seat}" min="0" inputmode="numeric" value="${inputvalue}" placeholder="0">
                </div>
            </div>
        `
    }
    dom("adjustlist").innerHTML=html
    settext("totaladjust",(0<=total?"+":"")+total.toLocaleString("en-US"))
    settotalinplay(total)
    let inputs=document.querySelectorAll(".adjustinput")
    for(let i=0;i<inputs.length;i=i+1){
        if(noteonly()){
            inputs[i].disabled=true
            inputs[i].classList.add("opacity-50","cursor-not-allowed")
            continue
        }
        inputs[i].addEventListener("input",function(){
            let seat=this.getAttribute("data-seat")
            setadjustment(seat,this.value,adjustsign(seat))
            updatetotals()
            savecache()
        })
    }
    let signbuttons=document.querySelectorAll(".stackadjust-sign")
    for(let i=0;i<signbuttons.length;i=i+1){
        if(noteonly()){
            signbuttons[i].disabled=true
            signbuttons[i].classList.add("disabled")
            continue
        }
        signbuttons[i].addEventListener("click",function(){
            let seat=this.getAttribute("data-seat")
            let input=document.querySelector(".adjustinput[data-seat=\""+seat+"\"]")
            let amount=0
            if(input){
                amount=num(input.value)
            }
            let sign=-1
            if(adjustsign(seat)<0){
                sign=1
            }
            setadjustment(seat,amount,sign)
            if(sign<0){
                this.classList.add("active")
            }else{
                this.classList.remove("active")
            }
            updatetotals()
            savecache()
        })
    }
    if(noteonly()){
        if(dom("exceptiontype")){
            dom("exceptiontype").disabled=true
        }
        if(dom("dealerseat")){
            dom("dealerseat").disabled=true
        }
        settext("adjustnote",stackadjusttext("lockednote","這不是最新一筆紀錄，計分牌已鎖定，只能修改備註"))
    }
    renderwarnings()
}

function settotalinplay(total){
    let seats=activeSeats()
    let before=0
    for(let i=0;i<seats.length;i=i+1){
        before=before+chip(seats[i])
    }
    settext("totalinplay",before.toLocaleString("en-US")+" → "+(before+total).toLocaleString("en-US"))
}

function updatetotals(){
    let seats=activeSeats()
    let total=0
    for(let i=0;i<seats.length;i=i+1){
        let seat=seats[i]
        let adjust=num(state.adjustments[seat])
        total=total+adjust
        settext("after-"+seat,(chip(seat)+adjust).toLocaleString("en-US"))
    }
    settext("totaladjust",(0<=total?"+":"")+total.toLocaleString("en-US"))
    settotalinplay(total)
    renderwarnings()
}

function warnings(){
    let list=[]
    if(!noteonly()){
        let changed=false
        for(let seat in state.adjustments){
            if(num(state.adjustments[seat])!=0){
                changed=true
            }
        }
        if(!changed){
            list.push(stackadjusttext("warnnoadjust","尚未填寫任何計分牌增減。"))
        }
    }
    if(!val("ps").trim()){
        list.push(stackadjusttext("warnnonote","請填寫備註。"))
    }
    return list
}

function renderwarnings(){
    let list=warnings()
    let html=""
    if(!list.length){
        html=`<div class="newhand-ok">${stackadjusttext("cansave","可以儲存。")}</div>`
    }else{
        for(let i=0;i<list.length;i=i+1){
            html=html+`<div class="newhand-warning">${list[i]}</div>`
        }
    }
    dom("warnings").innerHTML=html
}

function collectseating(){
    let data=[null]
    for(let i=1;i<=state.maxseat;i=i+1){
        if(state.seatinglist[i]&&state.seatinglist[i]!=false){
            let seat=state.seatinglist[i]
            data.push({
                chip: chip(i),
                name: seat["name"]||"",
                userid: seat["userid"]||null,
                sessionplayerid: seat["sessionplayerid"]||null,
                banned: seat["banned"]||false,
                specialbutton: seat["specialbutton"]||""
            })
        }else{
            data.push(false)
        }
    }
    return data
}

function buildpayload(){
    let self=state.selfseating
    if(self==null){
        self=publicallowed()?0:(activeSeats()[0]||1)
    }
    return {
        recordtype: "stackadjustment",
        exceptiontype: val("exceptiontype"),
        dealerseat: num(val("dealerseat")||state.dealerseat),
        selfseating: self,
        handcard: {},
        boardcard: { flop: [],turn: "",river: "" },
        bittingdata: {},
        seatinglist: collectseating(),
        showdowndata: {},
        winner: [null],
        winnerprice: [null],
        adjustments: state.adjustments,
        ps: val("ps"),
        note: val("ps"),
        totalpot: 0,
        positionpot: [null],
        gametype: state.row["gametype"]||"HE",
        blindlevel: "",
        levelid: 0,
        smallblind: 0,
        bigblind: 0,
        bigblindante: 0,
        ante: 0,
        emptybutton: false,
        deadsmallblind: false,
        actionsjson: []
    }
}

function aftersave(result){
    savingadjust=false
    let savebtn=dom("saveadjust")
    if(savebtn){
        savebtn.disabled=false
    }
    if(result["success"]){
        clearcache()
        pttoast(editmode()?stackadjusttext("updated","已更新校正"):stackadjusttext("saved","已儲存校正"),"success")
        href("table.html?id="+tableid+"#2")
    }else{
        settext("savestatus",stackadjusttext("savefailed","儲存失敗"))
        pttoast(result["data"]||stackadjusttext("savefailed","儲存失敗"),"error")
    }
}

let savingadjust=false

function save(){
    if(savingadjust){
        return
    }
    let list=warnings()
    if(list.length){
        renderwarnings()
        pttoast(list[0],"error")
        return
    }
    savingadjust=true
    let savebtn=dom("saveadjust")
    if(savebtn){
        savebtn.disabled=true
    }
    settext("savestatus",stackadjusttext("saving","儲存中..."))
    if(editmode()){
        if(noteonly()){
            // 非最新一筆：只送備註，後端也只會更新不影響計分牌的欄位
            api("PUT","edithand/"+handid,{ ps: val("ps"),note: val("ps") },aftersave)
        }else{
            api("PUT","edithand/"+handid,buildpayload(),aftersave)
        }
        return
    }
    api("POST","newhand/"+tableid,buildpayload(),aftersave)
}

function init(){
    dom("back").href="table.html?id="+tableid+"#2"
    dom("back").addEventListener("click",function(event){
        if(event&&event.button!=0){
            return
        }
        if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
            return
        }
        event.preventDefault()
        href("table.html?id="+tableid+"#2")
    })
    dom("saveadjust").addEventListener("click",save)
    dom("ps").addEventListener("input",function(){
        renderwarnings()
        savecache()
    })
    dom("exceptiontype").addEventListener("change",savecache)
    dom("dealerseat").addEventListener("change",function(){
        state.dealerseat=num(this.value)
        render()
        savecache()
    })
    if(editmode()){
        loadexisting()
        return
    }
    api("GET","gettable/"+tableid,null,function(result){
        if(!result["success"]){
            pttoast(result["data"]||stackadjusttext("loadtablefailed","讀取牌桌失敗"),"error")
            return
        }
        state.row=result["data"]
        api("GET","gethandcontext/"+tableid,null,function(contextresult){
            if(contextresult["success"]){
                state.context=contextresult["data"]
                state.maxseat=num(state.context["maxseat"]||9)
                state.seatinglist=state.context["seatmap"]||[null]
                state.dealerseat=num(state.context["nextdealer"]||1)
                for(let i=state.seatinglist.length;i<=state.maxseat;i=i+1){
                    state.seatinglist.push(false)
                }
            }
            loadcache()
            render()
        })
    })
}

function loadexisting(){
    settext("pagetitle",stackadjusttext("pagetitle","編輯計分牌校正"))
    settext("savestatus",stackadjusttext("loading","載入中..."))
    api("GET","gethand/"+handid,null,function(result){
        if(!result["success"]){
            settext("savestatus",stackadjusttext("loadfailed","載入失敗"))
            pttoast(result["data"]||stackadjusttext("loadrecordfailed","讀取紀錄失敗"),"error")
            return
        }
        let hand=result["data"]
        if((hand["recordtype"]||"hand")!="stackadjustment"){
            pttoast(stackadjusttext("notadjustrecord","這不是計分牌校正紀錄"),"error")
            href("table.html?id="+tableid+"#2")
            return
        }
        state.row={ name: hand["tablename"],token: hand["tabletoken"],gametype: hand["gametype"] }
        state.editlatest=!!hand["islatest"]
        state.selfseating=num(hand["selfseating"])
        state.dealerseat=num(hand["dealerseat"]||1)
        let seats=hand["seatingdata"]||[]
        let maxseatno=0
        for(let i=0;i<seats.length;i=i+1){
            if(num(seats[i]["seatno"])>maxseatno){
                maxseatno=num(seats[i]["seatno"])
            }
        }
        state.maxseat=Math.max(maxseatno,9)
        state.seatinglist=[null]
        for(let i=1;i<=state.maxseat;i=i+1){
            state.seatinglist.push(false)
        }
        let adjustments=hand["adjustments"]||{}
        for(let i=0;i<seats.length;i=i+1){
            let seatno=num(seats[i]["seatno"])
            if(seatno<1||seatno>state.maxseat){
                continue
            }
            state.seatinglist[seatno]={
                chip: num(seats[i]["chip"]),
                name: seats[i]["name"]||"",
                userid: seats[i]["userid"]||null,
                sessionplayerid: seats[i]["sessionplayerid"]||null,
                banned: seats[i]["banned"]||false,
                specialbutton: seats[i]["specialbutton"]||""
            }
            // 校正紀錄的 chipchange 存的就是當時的增減量；若 adjustments 沒帶就用它還原
            let adjust=adjustments[seatno]
            if(adjust==null){
                adjust=adjustments[String(seatno)]
            }
            if(adjust==null){
                adjust=seats[i]["chipchange"]
            }
            state.adjustments[seatno]=num(adjust)
        }
        if(dom("exceptiontype")&&hand["exceptiontype"]){
            dom("exceptiontype").value=hand["exceptiontype"]
        }
        if(dom("ps")){
            dom("ps").value=hand["ps"]||hand["note"]||""
        }
        settext("savestatus",noteonly()?stackadjusttext("noteonlystatus","非最新紀錄，僅可改備註"):stackadjusttext("notupdated","尚未更新"))
        render()
    })
}

init()
