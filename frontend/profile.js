if(!weblsget(WEBLSNAME+"signin")){
    href("signin.html")
}

let currentusertype="player"
let currentstafftype="dealer"
let currentreporttype="month"
let signoutpendinged=false
let deleteaccountpendinged=false
let currentplayerid=""
let profilescrolllockcount=0
let profilebodyoverflow=""
let profilehtmloverflow=""
let staffdata={
    "dealer": [],
    "floor": [],
    "assistant": []
}
let chipcolors=[
    {"name": "白色","color": "#ffffff"},
    {"name": "紅色","color": "#ff0000"},
    {"name": "藍色","color": "#0000ff"},
    {"name": "綠色","color": "#008000"},
    {"name": "黑色","color": "#000000"}
]
let chipsets=[]
let lastreportrow=null
let lastreportcontext={"type":"month","year":"","month":""}

function safehtml(value){
    if(value==null||value==undefined){
        return ""
    }
    return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")
}

function profiletext(key){
    if(!TRANSLATE[LANGUAGE]){
        return key
    }
    if(!TRANSLATE[LANGUAGE]["profile"]){
        return key
    }
    return TRANSLATE[LANGUAGE]["profile"][key]||key
}

function settext(selector,text){
    let element=document.querySelector(selector)
    if(element){
        element.textContent=text
    }
}

function lockprofilescroll(){
    if(profilescrolllockcount<1){
        profilebodyoverflow=document.body.style.overflow
        profilehtmloverflow=document.documentElement.style.overflow
        document.body.style.overflow="hidden"
        document.documentElement.style.overflow="hidden"
    }
    profilescrolllockcount=profilescrolllockcount+1
}

function unlockprofilescroll(){
    if(profilescrolllockcount<1){
        return
    }
    profilescrolllockcount=profilescrolllockcount-1
    if(profilescrolllockcount>0){
        return
    }
    document.body.style.overflow=profilebodyoverflow
    document.documentElement.style.overflow=profilehtmloverflow
}

function closeprofilecover(cover){
    if(!cover){
        return
    }
    cover.remove()
    unlockprofilescroll()
}

function setvalue(selector,text){
    let element=document.querySelector(selector)
    if(element){
        element.value=text
    }
}

function rolelabel(type){
    if(type=="dealer"){
        return profiletext("dealer")
    }
    if(type=="floor"){
        return profiletext("floor")
    }
    if(type=="assistant"){
        return profiletext("assistant")
    }
    return profiletext("playerrole")
}

function successprompt(text){
    if(typeof pttoastsuccess=="function"){
        pttoastsuccess(text)
        return
    }
    if(typeof pttoast=="function"){
        pttoast(text,"success")
    }
}

function errorprompt(text){
    if(typeof pttoasterror=="function"){
        pttoasterror(text)
        return
    }
    if(typeof pttoast=="function"){
        pttoast(text,"error")
        return
    }
    alert(text)
}

function updatefocusbadges(){
}

function applyprofilelanguage(){
    document.title=profiletext("title")
    let apidoclink=domgetid("toolapidoclink")
    if(apidoclink){
        apidoclink.href=AJAXURL+"swagger/"
    }
    settext("#profileeyebrow",profiletext("eyebrow"))
    settext("#profiletitle",profiletext("title"))
    updatefocusbadges()

    settext("#basicprofiletitle",profiletext("basicsectiontitle"))
    settext("#basicnamekey",profiletext("name"))
    settext("#basicplayeridkey",profiletext("playerid"))
    settext("#basicrolekey",profiletext("role"))
    settext("#basicemailkey",profiletext("email"))

    settext("#reportsectiontitle",profiletext("reportsectiontitle"))
    settext("#advancedreportentry",profiletext("advancedreportentry"))
    setvalue("#tab-month",profiletext("monthreport"))
    setvalue("#tab-year",profiletext("yearreport"))
    setvalue("#tab-all",profiletext("allreport"))
    settext("#monthfilterlabel",profiletext("selectmonth"))
    settext("#yearfilterlabel",profiletext("selectyear"))
    let feelabel=profiletext("includefee")+" ("+profiletext("includefeedesc")+")"
    settext("#includefeelabel",feelabel)
    settext("#cashcardtitle",profiletext("cash"))
    settext("#cashgameslabel",profiletext("games"))
    settext("#cashbuyinlabel",profiletext("totalbuyin"))
    settext("#cashprofitlabel",profiletext("totalprofit"))
    settext("#tltcardtitle",profiletext("tlt"))
    settext("#tltgameslabel",profiletext("sessions"))
    settext("#tltbuyinlabel",profiletext("totalbuyin"))
    settext("#tltprofitlabel",profiletext("totalprofit"))
    settext("#mttcardtitle",profiletext("mtt"))
    settext("#mttgameslabel",profiletext("sessions"))
    settext("#mttbuyincountlabel",profiletext("buyincount"))
    settext("#mttbuyinlabel",profiletext("totalbuyin"))
    settext("#mttprofitlabel",profiletext("totalprofit"))
    settext("#reporttotallabel",profiletext("reporttotal"))
    setvalue("#exportreportcsv",profiletext("exportcsv"))

    if(currentusertype=="player"){
        settext("#employmenttitle",profiletext("staffsectiontitle"))
    }else{
        settext("#employmenttitle",profiletext("employmentsectiontitle"))
    }

    settext("#preferencestitle",profiletext("preferencessectiontitle"))
    settext("#languagecardtitle",profiletext("languagecardtitle"))
    settext("#languagecarddesc",profiletext("languagecarddesc"))
    settext("#chipcolorcardtitle",profiletext("chipcolorcardtitle"))
    settext("#chipcolorcarddesc",profiletext("chipcolorcarddesc"))
    settext("#chipsetcardtitle",profiletext("chipsetcardtitle"))
    settext("#chipsetcarddesc",profiletext("chipsetcarddesc"))
    settext("#shakecardtitle",profiletext("shakecardtitle"))
    settext("#shakecarddesc",profiletext("shakecarddesc"))
    updateshaketogglebutton()
    setvalue("#lang-zhtw",profiletext("chinese"))
    setvalue("#lang-en",profiletext("english"))

    settext("#toolstitle",profiletext("toolssectiontitle"))
    settext("#toolssubtitle",profiletext("toolssectiondesc"))
    let toollistentrytext=profiletext("toollistentry")
    if(toollistentrytext=="toollistentry"){
        toollistentrytext="查看全部工具"
    }
    settext("#toollistentry",toollistentrytext)
    renderpromotools()

    setvalue("#signout",TRANSLATE[LANGUAGE]["signout"])
    settext("#signoutmodal-title",profiletext("signoutconfirmtitle"))
    settext("#signoutmodal-message",profiletext("signoutconfirmmessage"))
    setvalue("#cancelsignout",TRANSLATE[LANGUAGE]["cancel"])
    setvalue("#confirmsignout",TRANSLATE[LANGUAGE]["signout"])

    settext("#deleteaccountcardtitle",profiletext("deleteaccountcardtitle"))
    settext("#deleteaccountcarddesc",profiletext("deleteaccountcarddesc"))
    setvalue("#deleteaccountbutton",profiletext("deleteaccountcardtitle"))
    settext("#deleteaccountmodal1-title",profiletext("deleteaccountstep1title"))
    settext("#deleteaccountmodal1-message",profiletext("deleteaccountstep1message"))
    setvalue("#canceldeleteaccount1",TRANSLATE[LANGUAGE]["cancel"])
    setvalue("#confirmdeleteaccount1",profiletext("deleteaccountstep1confirm"))
    settext("#deleteaccountmodal2-title",profiletext("deleteaccountstep2title"))
    settext("#deleteaccountmodal2-message",profiletext("deleteaccountstep2message"))
    setvalue("#canceldeleteaccount2",TRANSLATE[LANGUAGE]["cancel"])
    setvalue("#confirmdeleteaccount2",profiletext("deleteaccountfinalbutton"))
    let deleteinput=domgetid("deleteaccountconfirminput")
    if(deleteinput){
        deleteinput.placeholder=profiletext("deleteaccountinputplaceholder")
    }

    settext("#staffmodallistlabel",profiletext("staffmodalcurrent"))
    let input=domgetid("staffid-input")
    if(input){
        input.placeholder=profiletext("staffinputplaceholder")
    }
    setvalue("#addstaffbutton",profiletext("staffmodaladd"))
    setvalue("#closestaffmodalfooter",profiletext("staffmodalclose"))

    renderchipcolorpreview()
    renderchipsetpreview()
    updatelangbuttons()
}

function buildyearoptions(){
    let select=domgetid("year-date")
    if(!select){
        return
    }
    let html=""
    let year=new Date().getFullYear()
    let i=0
    for(i=0;i<6;i=i+1){
        let value=year-i
        html=html+"<option value=\""+value+"\">"+value+"</option>"
    }
    select.innerHTML=html
}

function setdefaultfilters(){
    let now=new Date()
    let month=(now.getMonth()+1).toString()
    if(month.length<2){
        month="0"+month
    }
    value("#month-date",now.getFullYear()+"-"+month)
    value("#year-date",now.getFullYear())
}

function arrangeprofilesections(){
    let wrapper=domgetid("profilesections")
    if(!wrapper){
        return
    }
    let basic=domgetid("basicprofilepanel")
    let report=domgetid("profilereportpanel")
    let employment=domgetid("employmentpanel")
    let preferences=domgetid("preferencespanel")
    let signout=domgetid("signoutpanel")
    let tools=domgetid("toolspanel")
    let deleteaccount=domgetid("deleteaccountpanel")
    if(currentusertype=="player"){
        wrapper.appendChild(basic)
        wrapper.appendChild(report)
        wrapper.appendChild(employment)
        wrapper.appendChild(preferences)
        if(tools){
            wrapper.appendChild(tools)
        }
        if(signout){
            wrapper.appendChild(signout)
        }
        if(deleteaccount){
            wrapper.appendChild(deleteaccount)
        }
        return
    }
    wrapper.appendChild(basic)
    wrapper.appendChild(employment)
    wrapper.appendChild(preferences)
    wrapper.appendChild(report)
    if(tools){
        wrapper.appendChild(tools)
    }
    if(signout){
        wrapper.appendChild(signout)
    }
    if(deleteaccount){
        wrapper.appendChild(deleteaccount)
    }
}

// 宣傳小工具區：依使用者收藏動態渲染（最多六個，不足以預設清單補滿）
function renderpromotools(){
    let grid=domgetid("promotoolgrid")
    if(!grid||typeof pttoolpromodisplay!="function"){
        return
    }
    let list=pttoolpromodisplay()
    let html=""
    let count=0
    for(let i=0;i<list.length;i=i+1){
        let item=pttoolfindbyhref(list[i])
        // 正式區（pokertrace.net）隱藏還沒通過的維護中工具；測試機 / 本機照常全顯示。
        if(!item||typeof pttoolitemvisible=="function"&&!pttoolitemvisible(item)){
            continue
        }
        count=count+1
        html=html+`
            <a href="${item.href}" class="block rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 transition hover:border-emerald-500">
                <div class="text-lg font-bold text-white">${pttoolitemtitle(item)}</div>
                <div class="mt-1 text-sm text-zinc-400">${pttoolitemdesc(item)}</div>
            </a>
        `
    }
    grid.innerHTML=html
    let panel=domgetid("toolspanel")
    if(panel){
        if(count<1){
            panel.classList.add("hidden")
        }else{
            panel.classList.remove("hidden")
        }
    }
}

function renderbasicprofile(row){
    let name=row["name"]
    if(!name){
        name=profiletext("unnamed")
    }
    innertext("#profilenamevalue",name,false)
    innertext("#playerid",row["playerid"]||"-",false)
    innertext("#profilerolevalue",rolelabel(row["type"]||"player"),false)
    innertext("#profileemailvalue",row["email"]||"-",false)
    innertext("#profiletypebadge",rolelabel(row["type"]||"player"),false)
}

function getincludefee(){
    let checkbox=domgetid("includefee")
    if(checkbox){
        return checkbox.checked
    }
    return true
}

function loadgetuser(){
    let includefee=getincludefee()
    ajax("GET",AJAXURL+"getuser?includefee="+includefee,gotuserdata,null,[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ],{
        "loadingtarget": "#basicprofilepanel"
    })
}

function gotuserdata(event,data){
    if(!data["success"]){
        if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
            pthandleauthfailure(data["data"],{
                "toasted": false
            })
            return
        }
        errorprompt(profiletext("networkerror"))
        return
    }
    let row=data["data"]
    currentusertype=row["type"]||"player"
    currentplayerid=row["playerid"]||""
    chipcolors=row["chipcolors"]||chipcolors
    chipsets=row["chipset"]||chipsets
    renderbasicprofile(row)
    arrangeprofilesections()
    applyprofilelanguage()
    renderemploymentsection(row)
    if(currentusertype=="player"){
        loadstafflist()
    }else{
        staffdata={
            "dealer": [],
            "floor": [],
            "assistant": []
        }
    }
}

function setprofitvalue(selector,number){
    let text=""+number
    if(0<=number){
        text="+"+number
    }
    innertext(selector,text,false)
    removeclass(selector,["text-green-400","text-red-400"])
    if(0<=number){
        addclass(selector,["text-green-400"])
    }else{
        addclass(selector,["text-red-400"])
    }
}

function setroivalue(selector,number){
    let value=Number(number||0)
    let text=""+value+"%"
    if(0<=value){
        text="+"+value+"%"
    }
    innertext(selector,text,false)
    removeclass(selector,["text-green-400","text-red-400"])
    if(0<=value){
        addclass(selector,["text-green-400"])
    }else{
        addclass(selector,["text-red-400"])
    }
}

function reportroi(row){
    if(row["roi"]!=undefined&&row["roi"]!=null&&row["roi"]!=""){
        return Number(row["roi"]||0)
    }
    let buyin=Number(row["buyin"]||0)
    let profit=Number(row["profit"]||0)
    if(0<buyin){
        return Math.round((profit/buyin*100)*100)/100
    }
    return 0
}

function userreport(type,year,month){
    let includefee=getincludefee()
    lastreportcontext={"type":type,"year":year,"month":month,"includefee":includefee}
    ajax("GET",AJAXURL+"getuserreport?type="+type+"&year="+year+"&month="+month+"&includefee="+includefee,function(event,data){
        if(!data["success"]){
            if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
                pthandleauthfailure(data["data"],{
                    "toasted": false
                })
                return
            }
            errorprompt(profiletext("networkerror"))
            return
        }

        let row=data["data"]
        innertext("#cash-games",row["cash"]["count"],false)
        innertext("#cash-buyin",row["cash"]["buyin"],false)
        setprofitvalue("#cash-profit",row["cash"]["profit"])
        setroivalue("#cash-roi",reportroi(row["cash"]))

        innertext("#tlt-games",row["tlt"]["count"],false)
        innertext("#tlt-buyin",row["tlt"]["buyin"],false)
        setprofitvalue("#tlt-profit",row["tlt"]["profit"])
        setroivalue("#tlt-roi",reportroi(row["tlt"]))

        innertext("#mtt-games",row["mtt"]["count"],false)
        innertext("#mtt-buyin",row["mtt"]["buyin"],false)
        innertext("#mtt-buyincount",row["mtt"]["buyincount"],false)
        setprofitvalue("#mtt-profit",row["mtt"]["profit"])
        setroivalue("#mtt-roi",reportroi(row["mtt"]))
        innertext("#mtt-itm",(row["mtt"]["itm"]||0)+"%",false)
        innertext("#mtt-ft",(row["mtt"]["ft"]||0)+"%",false)
        innertext("#mtt-top3",(row["mtt"]["top3"]||0)+"%",false)
        setprofitvalue("#report-total",row["profit"])
        lastreportrow=row
    },null,[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ],{
        "loadingtarget": "#profilereportpanel"
    })
}

function refreshreportbycurrenttab(){
    let yearvalue=getvalue("year-date")
    let monthvalue=getvalue("month-date")
    if(currentreporttype=="month"){
        let monthtext=String(monthvalue||"")
        let monthparts=monthtext.split("-")
        if(monthparts.length<2){
            let now=new Date()
            userreport("month",now.getFullYear(),now.getMonth()+1)
            return
        }
        userreport("month",monthparts[0],monthparts[1])
        return
    }
    if(currentreporttype=="year"){
        userreport("year",yearvalue,new Date().getMonth()+1)
        return
    }
    userreport("all",yearvalue,new Date().getMonth()+1)
}

function switchreport(type){
    currentreporttype=type
    let types=[
        "month",
        "year",
        "all"
    ]
    let i=0
    for(i=0;i<types.length;i=i+1){
        let id="#tab-"+types[i]
        removeclass(id,["bg-blue-600","text-white"])
        addclass(id,["bg-zinc-700","text-zinc-300"])
    }
    removeclass("#tab-"+type,["bg-zinc-700","text-zinc-300"])
    addclass("#tab-"+type,["bg-blue-600","text-white"])

    addclass("#filter-month",["hidden"])
    addclass("#filter-year",["hidden"])
    if(type=="month"){
        removeclass("#filter-month",["hidden"])
    }
    if(type=="year"){
        removeclass("#filter-year",["hidden"])
    }
    refreshreportbycurrenttab()
}

function reportrangelabel(){
    if(lastreportcontext["type"]=="month"){
        return profiletext("monthreport")+" "+lastreportcontext["year"]+"-"+lastreportcontext["month"]
    }
    if(lastreportcontext["type"]=="year"){
        return profiletext("yearreport")+" "+lastreportcontext["year"]
    }
    return profiletext("allreport")
}

function exportreportcsv(){
    if(!lastreportrow){
        errorprompt(profiletext("exportnodata"))
        return
    }
    let row=lastreportrow
    let feetext=lastreportcontext["includefee"]?profiletext("includefee"):profiletext("excludefee")
    let rows=[]
    rows.push([profiletext("title"),reportrangelabel(),feetext])
    rows.push([])
    rows.push([
        profiletext("exportcoltype"),
        profiletext("exportcolgames"),
        profiletext("exportcolbuyincount"),
        profiletext("totalbuyin"),
        profiletext("totalprofit"),
        "ROI(%)",
        "ITM(%)",
        "FT(%)",
        "Top3(%)"
    ])
    rows.push([profiletext("cash"),row["cash"]["count"],"",row["cash"]["buyin"],row["cash"]["profit"],reportroi(row["cash"]),"","",""])
    rows.push([profiletext("tlt"),row["tlt"]["count"],"",row["tlt"]["buyin"],row["tlt"]["profit"],reportroi(row["tlt"]),"","",""])
    rows.push([profiletext("mtt"),row["mtt"]["count"],row["mtt"]["buyincount"],row["mtt"]["buyin"],row["mtt"]["profit"],reportroi(row["mtt"]),(row["mtt"]["itm"]||0),(row["mtt"]["ft"]||0),(row["mtt"]["top3"]||0)])
    rows.push([])
    rows.push([profiletext("reporttotal"),"","","",row["profit"]])
    let filename="profile_report_"+lastreportcontext["type"]+"_"+ptexporttimestamp()+".csv"
    ptdownloadcsv(filename,rows)
    successprompt(profiletext("exportdone"))
}

function staffcardtitle(role){
    return rolelabel(role)
}

function renderstaffcards(){
    let roles=[
        "dealer",
        "floor",
        "assistant"
    ]
    let html=""
    let i=0
    for(i=0;i<roles.length;i=i+1){
        let role=roles[i]
        let list=staffdata[role]||[]
        html=html+
        "<div class=\"rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5\">"+
            "<div class=\"flex items-center justify-between gap-3\">"+
                "<div>"+
                    "<div class=\"text-base font-bold text-white\">"+staffcardtitle(role)+"</div>"+
                    "<div class=\"mt-1 text-xs text-zinc-400\">"+profiletext("staffcountprefix")+list.length+profiletext("staffcountsuffix")+"</div>"+
                "</div>"+
                "<input type=\"button\" class=\"openstaffmodal rounded-2xl bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700\" data-role=\""+role+"\" value=\""+profiletext("manage")+"\">"+
            "</div>"+
        "</div>"
    }
    innerhtml("#employmentcontent",html,false)
    bindemploymentbuttons()
}

function renderemploymentsection(row){
    if(currentusertype=="player"){
        renderstaffcards()
        return
    }
    let employedby=row["employedby"]||[]
    let html=""
    if(employedby.length<1){
        html=
        "<div class=\"rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 p-5 text-sm leading-7 text-zinc-400\">"+
            profiletext("unemployed")+
        "</div>"
    }else{
        let i=0
        for(i=0;i<employedby.length;i=i+1){
            let item=employedby[i]
            let ownername=item["ownername"]
            if(!ownername){
                ownername=profiletext("unnamed")
            }
            let role=rolelabel(item["role"]||"assistant")
            html=html+
            "<div class=\"rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5\">"+
                "<div class=\"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between\">"+
                    "<div>"+
                        "<div class=\"text-base font-bold text-white\">"+escapehtml(ownername)+"</div>"+
                        "<div class=\"mt-1 font-mono text-xs text-zinc-400\">"+item["ownerplayerid"]+"</div>"+
                    "</div>"+
                    "<div class=\"rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-bold text-emerald-300\">"+role+"</div>"+
                "</div>"+
            "</div>"
        }
    }
    innerhtml("#employmentcontent",html,false)
}

function bindemploymentbuttons(){
    let openbuttons=document.querySelectorAll(".openstaffmodal")
    let i=0
    for(i=0;i<openbuttons.length;i=i+1){
        openbuttons[i].onclick=function(){
            openstaffmodal(this.dataset.role)
        }
    }
    let removebuttons=document.querySelectorAll(".removestaffbutton")
    for(i=0;i<removebuttons.length;i=i+1){
        removebuttons[i].onclick=function(){
            removestaff(this.dataset.staffid)
        }
    }
}

function loadstafflist(){
    ajax("GET",AJAXURL+"getstafflist",function(event,data){
        if(!data["success"]){
            if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
                pthandleauthfailure(data["data"],{
                    "toasted": false
                })
            }
            return
        }
        staffdata=data["data"]||staffdata
        renderstaffcards()
        let modal=domgetid("staffmodal")
        if(modal&&!modal.classList.contains("hidden")){
            renderstaffmodal()
        }
    },null,[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ],{
        "loadingtarget": "#employmentpanel"
    })
}

function openstaffmodal(type){
    let modal=domgetid("staffmodal")
    if(!modal||modal.classList.contains("hidden")){
        lockprofilescroll()
    }
    currentstafftype=type
    settext("#staffmodal-title",staffcardtitle(type))
    renderstaffmodal()
    removeclass("#staffmodal",["hidden"])
    addclass("#staffmodal",["flex"])
}

function closestaffmodal(){
    let modal=domgetid("staffmodal")
    let opened=false
    if(modal&&!modal.classList.contains("hidden")){
        opened=true
    }
    addclass("#staffmodal",["hidden"])
    removeclass("#staffmodal",["flex"])
    value("#staffid-input","")
    if(opened){
        unlockprofilescroll()
    }
}

function renderstaffmodal(){
    let list=staffdata[currentstafftype]||[]
    let html=""
    if(list.length<1){
        html="<div class=\"rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-4 text-center text-sm text-zinc-500\">"+profiletext("empty")+"</div>"
    }else{
        let i=0
        for(i=0;i<list.length;i=i+1){
            let row=list[i]
            let statustext=profiletext("active")
            let statusclass="text-emerald-300"
            if(row["status"]=="pending"){
                statustext=profiletext("pending")
                statusclass="text-yellow-300"
            }
            html=html+
            "<div class=\"flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3\">"+
                "<div class=\"min-w-0\">"+
                    "<div class=\"text-sm font-bold text-white break-all\">"+escapehtml(row["staffname"]||profiletext("targetuser"))+"</div>"+
                    "<div class=\"mt-1 font-mono text-xs text-zinc-400\">"+row["staffplayerid"]+"</div>"+
                    "<div class=\"mt-2 text-xs font-bold "+statusclass+"\">"+statustext+"</div>"+
                "</div>"+
                "<input type=\"button\" class=\"modalremovestaff rounded-full border border-zinc-700 px-3 py-1 text-xs font-bold text-zinc-300 transition hover:border-red-400 hover:text-red-300\" data-staffid=\""+row["id"]+"\" value=\""+profiletext("remove")+"\">"+
            "</div>"
        }
    }
    innerhtml("#staffmodal-list",html,false)
    let removebuttons=document.querySelectorAll(".modalremovestaff")
    let i=0
    for(i=0;i<removebuttons.length;i=i+1){
        removebuttons[i].onclick=function(){
            removestaff(this.dataset.staffid)
        }
    }
}

function addstaff(){
    let raw=getvalue("staffid-input").trim()
    if(!raw){
        return
    }
    let playerid=raw
    if(playerid.indexOf("P-")==0){
        playerid=playerid.substring(2)
    }
    let button=domgetid("addstaffbutton")
    if(button){
        button.disabled=true
    }
    ajax("POST",AJAXURL+"newstaff",function(event,data){
        if(button){
            button.disabled=false
        }
        if(data["success"]){
            value("#staffid-input","")
            successprompt(profiletext("invitesent")+(data["data"]["staffname"]||profiletext("targetuser")))
            loadstafflist()
            return
        }
        let message=data["data"]
        if(message=="ERROR_user_not_found"){
            message=profiletext("usernotfound")
        }else if(message=="ERROR_staff_role_mismatch"){
            message=profiletext("rolemismatch")
        }else if(message=="ERROR_staff_already_invited"){
            message=profiletext("alreadyinvited")
        }else if(message=="ERROR_staff_self_invite"){
            message=profiletext("selfinvite")
        }
        errorprompt(message||profiletext("unknownerror"))
    },str({
        "playerid": playerid,
        "role": currentstafftype
    }),[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ],{
        "loadingtarget": "#staffmodal-list"
    })
}

function removestaff(staffid){
    ptconfirm(profiletext("removeconfirm"),function(okayed){
        if(!okayed){
            return
        }
        ajax("DELETE",AJAXURL+"deletestaff/"+staffid,function(event,data){
            if(data["success"]){
                successprompt(profiletext("removesuccess"))
                loadstafflist()
                return
            }
            errorprompt(data["data"]||profiletext("unknownerror"))
        },null,[
            ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
        ],{
            "loadingtarget": "#employmentpanel"
        })
    })
}

function renderchipcolorpreview(){
    let box=domgetid("chipcolorpreview")
    if(!box){
        return
    }
    if(chipcolors.length<1){
        box.textContent=profiletext("nochipcolors")
        return
    }
    let names=[]
    let i=0
    for(i=0;i<chipcolors.length;i=i+1){
        names.push(chipcolors[i]["name"])
    }
    box.textContent=names.join("、")
}

function renderchipsetpreview(){
    let box=domgetid("chipsetpreview")
    if(!box){
        return
    }
    if(chipsets.length<1){
        box.textContent=profiletext("emptychipsetpreview")
        return
    }
    let names=[]
    let i=0
    for(i=0;i<chipsets.length;i=i+1){
        let chips=chipsets[i]["chips"]||[]
        names.push((chipsets[i]["name"]||profiletext("chipsetdefaultname"))+"("+chips.length+")")
    }
    box.textContent=names.join("、")
}

function chipcolorrowhtml(item){
    return ""+
    "<div class=\"chipcolorrow grid grid-cols-[1fr_120px_40px] gap-2\">"+
        "<input class=\"chipcolorname rounded bg-zinc-700 px-3 py-2 text-white\" value=\""+safehtml(item["name"]||"")+"\" placeholder=\""+profiletext("chipcolornameplaceholder")+"\">"+
        "<input type=\"color\" class=\"chipcolorvalue h-10 rounded bg-zinc-700 px-2 py-1\" value=\""+safehtml(item["color"]||"#ffffff")+"\">"+
        "<input type=\"button\" class=\"removechipcolor rounded bg-red-600 hover:bg-red-700\" value=\"×\">"+
    "</div>"
}

function chipcoloroptions(selected){
    let html=""
    let i=0
    for(i=0;i<chipcolors.length;i=i+1){
        let color=chipcolors[i]["color"]
        let name=chipcolors[i]["name"]||color
        let selecteded=""
        if(String(selected).toLowerCase()==String(color).toLowerCase()){
            selecteded=" selected"
        }
        html=html+"<option value=\""+safehtml(color)+"\""+selecteded+">"+safehtml(name)+"</option>"
    }
    return html
}

function chipsetchiprowhtml(chip){
    let circleselected=""
    let squareselected=""
    if(chip["shape"]=="square"){
        squareselected=" selected"
    }else{
        circleselected=" selected"
    }
    return ""+
    "<div class=\"chipsetchiprow grid grid-cols-[90px_1fr_120px_40px] gap-2\">"+
        "<select class=\"chipsetshape rounded bg-zinc-700 px-2 py-2 text-white\">"+
            "<option value=\"circle\""+circleselected+">"+profiletext("chipshape_circle")+"</option>"+
            "<option value=\"square\""+squareselected+">"+profiletext("chipshape_square")+"</option>"+
        "</select>"+
        "<input type=\"number\" class=\"chipsetvalue rounded bg-zinc-700 px-2 py-2 text-white\" inputmode=\"numeric\" value=\""+safehtml(chip["value"]||0)+"\">"+
        "<select class=\"chipsetcolor rounded bg-zinc-700 px-2 py-2 text-white\">"+chipcoloroptions(chip["color"]||"#ffffff")+"</select>"+
        "<input type=\"button\" class=\"removechipsetchip rounded bg-red-600 hover:bg-red-700\" value=\"×\">"+
    "</div>"
}

function chipsetblockhtml(item){
    let chips=item["chips"]||[]
    let chiphtml=""
    let i=0
    for(i=0;i<chips.length;i=i+1){
        chiphtml=chiphtml+chipsetchiprowhtml(chips[i])
    }
    return ""+
    "<div class=\"chipsetblock rounded-lg border border-zinc-700 bg-zinc-800 p-3\">"+
        "<div class=\"mb-3 flex gap-2\">"+
            "<input class=\"chipsetname flex-1 rounded bg-zinc-700 px-3 py-2 text-white\" value=\""+safehtml(item["name"]||"")+"\" placeholder=\""+profiletext("chipsetnameplaceholder")+"\">"+
            "<input type=\"button\" class=\"addchipsetchip rounded bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600\" value=\""+profiletext("addchip")+"\">"+
            "<input type=\"button\" class=\"removechipset rounded bg-red-600 px-3 py-2 text-sm hover:bg-red-700\" value=\""+profiletext("remove")+"\">"+
        "</div>"+
        "<div class=\"chipsetchips space-y-2\">"+chiphtml+"</div>"+
    "</div>"
}

function openchipcolormodal(){
    let old=domgetid("chipcolormodal")
    if(old){
        closeprofilecover(old)
    }
    lockprofilescroll()
    let cover=doccreate("div")
    cover.id="chipcolormodal"
    cover.className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 p-4"
    let rows=""
    let i=0
    for(i=0;i<chipcolors.length;i=i+1){
        rows=rows+chipcolorrowhtml(chipcolors[i])
    }
    cover.innerHTML="" +
    "<div class=\"max-h-[85vh] w-full max-w-lg overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 p-5 shadow-xl\">"+
        "<div class=\"mb-4 flex items-center justify-between\">"+
            "<div class=\"text-lg font-semibold text-white\">"+profiletext("chipcolorcardtitle")+"</div>"+
            "<input type=\"button\" class=\"closechipcolor text-zinc-400 hover:text-white\" value=\"×\">"+
        "</div>"+
        "<div class=\"mb-3 text-sm text-zinc-400\">"+profiletext("chipcolormodaldesc")+"</div>"+
        "<div class=\"mb-1 grid grid-cols-[1fr_120px_40px] gap-2 px-1 text-xs text-zinc-500\">"+
            "<div>"+profiletext("chipcolornameheader")+"</div>"+
            "<div>"+profiletext("chipcolorheader")+"</div>"+
            "<div></div>"+
        "</div>"+
        "<div id=\"chipcolorrows\" class=\"space-y-2\">"+rows+"</div>"+
        "<div class=\"mt-5 flex justify-between gap-2\">"+
            "<input type=\"button\" class=\"rounded bg-zinc-700 px-4 py-2 hover:bg-zinc-600\" id=\"addchipcolor\" value=\""+profiletext("addcolor")+"\">"+
            "<input type=\"button\" class=\"rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-700\" id=\"savechipcolors\" value=\""+profiletext("save")+"\">"+
        "</div>"+
    "</div>"
    document.body.appendChild(cover)
    bindchipcolorbuttons(cover)
}

function bindchipcolorbuttons(cover){
    let closebuttons=cover.querySelectorAll(".closechipcolor")
    let i=0
    for(i=0;i<closebuttons.length;i=i+1){
        closebuttons[i].onclick=function(){
            closeprofilecover(cover)
        }
    }
    let addbutton=cover.querySelector("#addchipcolor")
    if(addbutton){
        addbutton.onclick=function(){
            cover.querySelector("#chipcolorrows").insertAdjacentHTML("beforeend",chipcolorrowhtml({
                "name": profiletext("newcolor"),
                "color": "#ffffff"
            }))
            bindchipcolorbuttons(cover)
        }
    }
    let removebuttons=cover.querySelectorAll(".removechipcolor")
    for(i=0;i<removebuttons.length;i=i+1){
        removebuttons[i].onclick=function(){
            this.parentElement.remove()
        }
    }
    let savebutton=cover.querySelector("#savechipcolors")
    if(savebutton){
        savebutton.onclick=function(){
            let rows=cover.querySelectorAll(".chipcolorrow")
            let colors=[]
            let j=0
            for(j=0;j<rows.length;j=j+1){
                colors.push({
                    "name": rows[j].querySelector(".chipcolorname").value,
                    "color": rows[j].querySelector(".chipcolorvalue").value
                })
            }
            savebutton.disabled=true
            ajax("PUT",AJAXURL+"edituserchipcolors",function(event,data){
                savebutton.disabled=false
                if(data["success"]){
                    chipcolors=data["data"]||[]
                    renderchipcolorpreview()
                    successprompt(profiletext("savesuccess"))
                    closeprofilecover(cover)
                    return
                }
                errorprompt(pterror(data["data"]||profiletext("unknownerror")))
            },str({
                "colors": colors
            }),[
                ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
            ])
        }
    }
}

function openchipsetmodal(){
    let old=domgetid("chipsetmodal")
    if(old){
        closeprofilecover(old)
    }
    lockprofilescroll()
    let cover=doccreate("div")
    cover.id="chipsetmodal"
    cover.className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 p-4"
    let html=""
    let i=0
    for(i=0;i<chipsets.length;i=i+1){
        html=html+chipsetblockhtml(chipsets[i])
    }
    cover.innerHTML="" +
    "<div class=\"max-h-[85vh] w-full max-w-3xl overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 p-5 shadow-xl\">"+
        "<div class=\"mb-4 flex items-center justify-between\">"+
            "<div>"+
                "<div class=\"text-lg font-semibold text-white\">"+profiletext("chipsetcardtitle")+"</div>"+
                "<div class=\"mt-1 text-sm text-zinc-400\">"+profiletext("chipsetmodaldesc")+"</div>"+
            "</div>"+
            "<input type=\"button\" class=\"closechipset text-zinc-400 hover:text-white\" value=\"×\">"+
        "</div>"+
        "<div id=\"chipsetrows\" class=\"space-y-3\">"+html+"</div>"+
        "<div class=\"mt-5 flex justify-between gap-2\">"+
            "<input type=\"button\" class=\"rounded bg-zinc-700 px-4 py-2 hover:bg-zinc-600\" id=\"addchipset\" value=\""+profiletext("addset")+"\">"+
            "<input type=\"button\" class=\"rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-700\" id=\"savechipsets\" value=\""+profiletext("save")+"\">"+
        "</div>"+
    "</div>"
    document.body.appendChild(cover)
    bindchipsetbuttons(cover)
}

function bindchipsetbuttons(cover){
    let closebuttons=cover.querySelectorAll(".closechipset")
    let i=0
    for(i=0;i<closebuttons.length;i=i+1){
        closebuttons[i].onclick=function(){
            closeprofilecover(cover)
        }
    }
    let addset=cover.querySelector("#addchipset")
    if(addset){
        addset.onclick=function(){
            cover.querySelector("#chipsetrows").insertAdjacentHTML("beforeend",chipsetblockhtml({
                "name": profiletext("chipsetdefaultname"),
                "chips": [{
                    "shape": "circle",
                    "value": 100,
                    "color": "#ffffff"
                }]
            }))
            bindchipsetbuttons(cover)
        }
    }
    let addchips=cover.querySelectorAll(".addchipsetchip")
    for(i=0;i<addchips.length;i=i+1){
        addchips[i].onclick=function(){
            let block=this.closest(".chipsetblock")
            block.querySelector(".chipsetchips").insertAdjacentHTML("beforeend",chipsetchiprowhtml({
                "shape": "circle",
                "value": 100,
                "color": "#ffffff"
            }))
            bindchipsetbuttons(cover)
        }
    }
    let removechips=cover.querySelectorAll(".removechipsetchip")
    for(i=0;i<removechips.length;i=i+1){
        removechips[i].onclick=function(){
            this.parentElement.remove()
        }
    }
    let removesets=cover.querySelectorAll(".removechipset")
    for(i=0;i<removesets.length;i=i+1){
        removesets[i].onclick=function(){
            this.closest(".chipsetblock").remove()
        }
    }
    let shapeinputs=cover.querySelectorAll(".chipsetshape")
    for(i=0;i<shapeinputs.length;i=i+1){
        let row=shapeinputs[i].closest(".chipsetchiprow")
        let data=row
        let value=shapeinputs[i].value
        if(data.dataset.bound!="1"){
            data.dataset.bound="1"
        }
        if(value=="square"){
            shapeinputs[i].value="square"
        }else{
            shapeinputs[i].value="circle"
        }
    }
    let savebutton=cover.querySelector("#savechipsets")
    if(savebutton){
        savebutton.onclick=function(){
            let blocks=cover.querySelectorAll(".chipsetblock")
            let sets=[]
            let j=0
            for(j=0;j<blocks.length;j=j+1){
                let rows=blocks[j].querySelectorAll(".chipsetchiprow")
                let chips=[]
                let k=0
                for(k=0;k<rows.length;k=k+1){
                    chips.push({
                        "shape": rows[k].querySelector(".chipsetshape").value,
                        "value": int(rows[k].querySelector(".chipsetvalue").value)||0,
                        "color": rows[k].querySelector(".chipsetcolor").value
                    })
                }
                sets.push({
                    "name": blocks[j].querySelector(".chipsetname").value,
                    "chips": chips
                })
            }
            savebutton.disabled=true
            ajax("PUT",AJAXURL+"edituserchipset",function(event,data){
                savebutton.disabled=false
                if(data["success"]){
                    chipsets=data["data"]||[]
                    renderchipsetpreview()
                    successprompt(profiletext("savesuccess"))
                    closeprofilecover(cover)
                    return
                }
                errorprompt(data["data"]||profiletext("unknownerror"))
            },str({
                "sets": sets
            }),[
                ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
            ])
        }
    }
}

function updatelangbuttons(){
    let langs=[
        "zhtw",
        "en"
    ]
    let i=0
    for(i=0;i<langs.length;i=i+1){
        let button=domgetid("lang-"+langs[i])
        if(button){
            button.classList.remove("bg-blue-600","text-white")
            button.classList.add("bg-zinc-700","text-zinc-300")
        }
    }
    let active=domgetid("lang-"+LANGUAGE)
    if(active){
        active.classList.remove("bg-zinc-700","text-zinc-300")
        active.classList.add("bg-blue-600","text-white")
    }
}

function switchlang(lang){
    ajax("PUT",AJAXURL+"edituserlanguage",function(event,data){
        if(data["success"]){
            weblsset(WEBLSNAME+"language",data["data"])
            successprompt(profiletext("languagesaved"))
            location.reload()
            return
        }
        errorprompt(profiletext("unknownerror"))
    },str({
        "langkey": lang
    }),[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ])
}

function opensignoutmodal(){
    let modal=domgetid("signoutmodal")
    if(!modal||modal.classList.contains("hidden")){
        lockprofilescroll()
    }
    let status=domgetid("signoutmodal-status")
    if(status){
        status.textContent=""
        status.classList.add("hidden")
    }
    setvalue("#confirmsignout",TRANSLATE[LANGUAGE]["signout"])
    removeclass("#signoutmodal",["hidden"])
    addclass("#signoutmodal",["flex"])
}

function closesignoutmodal(){
    if(signoutpendinged){
        return
    }
    let modal=domgetid("signoutmodal")
    let opened=false
    if(modal&&!modal.classList.contains("hidden")){
        opened=true
    }
    addclass("#signoutmodal",["hidden"])
    removeclass("#signoutmodal",["flex"])
    if(opened){
        unlockprofilescroll()
    }
}

function showsignoutstatus(text){
    let status=domgetid("signoutmodal-status")
    if(status){
        status.textContent=text
        status.classList.remove("hidden")
    }
}

function clearsignoutstorage(){
    weblsset(WEBLSNAME+"uid",null)
    weblsset(WEBLSNAME+"signin",null)
    weblsset(WEBLSNAME+"token",null)
    weblsset(WEBLSNAME+"userid",null)
    weblsset(WEBLSNAME+"email",null)
    weblsset(WEBLSNAME+"permission",null)
    weblsset(WEBLSNAME+"name",null)
}

function setsignoutloading(loadinged){
    let button=domgetid("confirmsignout")
    if(!button){
        return
    }
    button.disabled=loadinged
    if(loadinged){
        button.value=profiletext("signouting")
        button.classList.add("opacity-60","cursor-not-allowed")
        return
    }
    button.value=TRANSLATE[LANGUAGE]["signout"]
    button.classList.remove("opacity-60","cursor-not-allowed")
}

function dosignout(){
    if(signoutpendinged){
        return
    }
    signoutpendinged=true
    setsignoutloading(true)
    ajax("POST",AJAXURL+"signout",function(event,data){
        if(data["success"]){
            showsignoutstatus(TRANSLATE[LANGUAGE]["api"]["signout"]["success"])
            clearsignoutstorage()
            setTimeout(function(){
                href("./")
            },600)
            return
        }
        if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
            showsignoutstatus(profiletext("tokenexpired"))
            clearsignoutstorage()
            setTimeout(function(){
                href("signin.html")
            },900)
            return
        }
        signoutpendinged=false
        setsignoutloading(false)
        showsignoutstatus(profiletext("networkerror"))
    },null,[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ])
}

// ===== 刪除帳號（兩層 lightbox 確認 + 輸入選手 ID，真刪除、無法復原）=====
function opendeleteaccountmodal1(){
    let modal=domgetid("deleteaccountmodal1")
    if(!modal||modal.classList.contains("hidden")){
        lockprofilescroll()
    }
    removeclass("#deleteaccountmodal1",["hidden"])
    addclass("#deleteaccountmodal1",["flex"])
}

function closedeleteaccountmodal1(){
    let modal=domgetid("deleteaccountmodal1")
    let opened=false
    if(modal&&!modal.classList.contains("hidden")){
        opened=true
    }
    addclass("#deleteaccountmodal1",["hidden"])
    removeclass("#deleteaccountmodal1",["flex"])
    if(opened){
        unlockprofilescroll()
    }
}

function opendeleteaccountmodal2(){
    let modal=domgetid("deleteaccountmodal2")
    if(!modal||modal.classList.contains("hidden")){
        lockprofilescroll()
    }
    value("#deleteaccountconfirminput","")
    let status=domgetid("deleteaccountmodal2-status")
    if(status){
        status.textContent=""
        status.classList.add("hidden")
    }
    setvalue("#confirmdeleteaccount2",profiletext("deleteaccountfinalbutton"))
    removeclass("#deleteaccountmodal2",["hidden"])
    addclass("#deleteaccountmodal2",["flex"])
}

function closedeleteaccountmodal2(){
    if(deleteaccountpendinged){
        return
    }
    let modal=domgetid("deleteaccountmodal2")
    let opened=false
    if(modal&&!modal.classList.contains("hidden")){
        opened=true
    }
    addclass("#deleteaccountmodal2",["hidden"])
    removeclass("#deleteaccountmodal2",["flex"])
    if(opened){
        unlockprofilescroll()
    }
}

function showdeleteaccountstatus(text){
    let status=domgetid("deleteaccountmodal2-status")
    if(status){
        status.textContent=text
        status.classList.remove("hidden")
    }
}

function setdeleteaccountloading(loadinged){
    let button=domgetid("confirmdeleteaccount2")
    if(!button){
        return
    }
    button.disabled=loadinged
    if(loadinged){
        button.value=profiletext("deleteaccountdeleting")
        button.classList.add("opacity-60","cursor-not-allowed")
        return
    }
    button.value=profiletext("deleteaccountfinalbutton")
    button.classList.remove("opacity-60","cursor-not-allowed")
}

function dodeleteaccount(){
    if(deleteaccountpendinged){
        return
    }
    let confirmtext=String(getvalue("deleteaccountconfirminput")||"").trim()
    if(confirmtext.indexOf("P-")==0){
        confirmtext=confirmtext.substring(2)
    }
    if(!confirmtext||confirmtext!=String(currentplayerid)){
        showdeleteaccountstatus(profiletext("deleteaccountmismatch"))
        return
    }
    deleteaccountpendinged=true
    setdeleteaccountloading(true)
    ajax("DELETE",AJAXURL+"deleteuseraccount",function(event,data){
        if(data["success"]){
            showdeleteaccountstatus(profiletext("deleteaccountsuccess"))
            clearsignoutstorage()
            setTimeout(function(){
                href("./")
            },900)
            return
        }
        if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
            showdeleteaccountstatus(profiletext("tokenexpired"))
            clearsignoutstorage()
            setTimeout(function(){
                href("signin.html")
            },900)
            return
        }
        deleteaccountpendinged=false
        setdeleteaccountloading(false)
        if(data["data"]=="ERROR_confirm_text_error"){
            showdeleteaccountstatus(profiletext("deleteaccountmismatch"))
            return
        }
        showdeleteaccountstatus(profiletext("networkerror"))
    },str({
        "confirmtext": confirmtext
    }),[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ])
}

buildyearoptions()
setdefaultfilters()
applyprofilelanguage()
switchreport("month")
loadgetuser()

if(typeof pttoolfavoritesyncfrombackend=="function"){
    pttoolfavoritesyncfrombackend(function(){
        renderpromotools()
    })
}

onclick("#tab-month",function(){
    switchreport("month")
})

onclick("#tab-year",function(){
    switchreport("year")
})

onclick("#tab-all",function(){
    switchreport("all")
})

onchange("#month-date",function(element,event){
    if(currentreporttype=="month"){
        refreshreportbycurrenttab()
    }
})

onchange("#year-date",function(element,event){
    if(currentreporttype=="year"){
        refreshreportbycurrenttab()
    }
})

domgetid("includefee").addEventListener("change",function(){
    loadgetuser()
    refreshreportbycurrenttab()
})

onclick("#exportreportcsv",function(){
    exportreportcsv()
})

onclick("#openchipcolormodal",function(){
    openchipcolormodal()
})

onclick("#openchipsetmodal",function(){
    openchipsetmodal()
})

// ===== 搖一搖回報問題開關（偵測與燈箱在 initialize.js）=====
function shakecontactoffed(){
    return weblsget(WEBLSNAME+"shakecontactoff")?true:false
}

function updateshaketogglebutton(){
    let button=domgetid("shaketogglebutton")
    if(!button){
        return
    }
    let offed=shakecontactoffed()
    button.value=offed?profiletext("shakeoff"):profiletext("shakeon")
    button.classList.remove("border-zinc-700","bg-zinc-800","text-zinc-100","hover:bg-zinc-700","border-emerald-500/50","bg-emerald-500/10","text-emerald-300","hover:bg-emerald-500/20")
    if(offed){
        button.classList.add("border-zinc-700","bg-zinc-800","text-zinc-100","hover:bg-zinc-700")
    }else{
        button.classList.add("border-emerald-500/50","bg-emerald-500/10","text-emerald-300","hover:bg-emerald-500/20")
    }
}

onclick("#shaketogglebutton",function(){
    if(!shakecontactoffed()){
        weblsset(WEBLSNAME+"shakecontactoff",true)
        updateshaketogglebutton()
        pttoastsuccess(profiletext("shakedisabled"))
        return
    }
    function enableshake(){
        weblsset(WEBLSNAME+"shakecontactoff",null)
        updateshaketogglebutton()
        pttoastsuccess(profiletext("shakeenabled"))
        if(window.ptshakecontactstart){
            window.ptshakecontactstart()
        }
    }
    // iOS 需在使用者手勢中請求動作感應權限，點擊開啟正好是手勢
    if(typeof DeviceMotionEvent!="undefined"&&typeof DeviceMotionEvent.requestPermission=="function"){
        DeviceMotionEvent.requestPermission().then(function(state){
            // 這裡已明確問過一次，記錄旗標讓 initialize.js 的引導橫幅不再出現
            weblsset(WEBLSNAME+"shakecontactiosasked",true)
            if(state=="granted"){
                enableshake()
            }else{
                pttoastwarning(profiletext("shakepermissiondenied"))
            }
        }).catch(function(){
            weblsset(WEBLSNAME+"shakecontactiosasked",true)
            pttoastwarning(profiletext("shakepermissiondenied"))
        })
        return
    }
    enableshake()
})

onclick("#lang-zhtw",function(){
    switchlang("zhtw")
})

onclick("#lang-en",function(){
    switchlang("en")
})

onclick("#closestaffmodal",function(){
    closestaffmodal()
})

onclick("#closestaffmodalfooter",function(){
    closestaffmodal()
})

onclick("#staffmodal",function(element,event){
    if(element==event.target){
        closestaffmodal()
    }
})

onclick("#addstaffbutton",function(){
    addstaff()
})

onenterclick("#staffid-input",function(){
    addstaff()
})

onclick("#signout",function(){
    opensignoutmodal()
})

onclick("#cancelsignout",function(){
    closesignoutmodal()
})

onclick("#signoutmodal",function(element,event){
    if(element==event.target){
        closesignoutmodal()
    }
})

onclick("#confirmsignout",function(){
    dosignout()
})

onclick("#deleteaccountbutton",function(){
    opendeleteaccountmodal1()
})

onclick("#canceldeleteaccount1",function(){
    closedeleteaccountmodal1()
})

onclick("#deleteaccountmodal1",function(element,event){
    if(element==event.target){
        closedeleteaccountmodal1()
    }
})

onclick("#confirmdeleteaccount1",function(){
    closedeleteaccountmodal1()
    opendeleteaccountmodal2()
})

onclick("#canceldeleteaccount2",function(){
    closedeleteaccountmodal2()
})

onclick("#deleteaccountmodal2",function(element,event){
    if(element==event.target){
        closedeleteaccountmodal2()
    }
})

onenterclick("#deleteaccountconfirminput",function(){
    dodeleteaccount()
})

onclick("#confirmdeleteaccount2",function(){
    dodeleteaccount()
})
