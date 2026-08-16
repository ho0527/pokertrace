if(!weblsget(WEBLSNAME+"signin")){
    href("signin.html")
}

let currentusertype="player"
let currentstafftype="dealer"
// 員工名單彈窗的篩選狀態。每次開彈窗都重設回「全部」——
// 留著上次的條件會讓人以為名單裡的人不見了。
let staffmodalfilter="all"
let staffmodalkeyword=""
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
// 後端 getuser 回來前的 fallback，內容與 backend/api/user.py 的 defaultchipcolors() 對齊。
// 兩邊要一起改，否則載入前後的顏色下拉選項會不一致。
let chipcolors=[
    {"name": "白色","color": "#ffffff"},
    {"name": "紅色","color": "#ff0000"},
    {"name": "藍色","color": "#0000ff"},
    {"name": "綠色","color": "#008000"},
    {"name": "黑色","color": "#000000"},
    {"name": "黃色","color": "#ffff00"},
    {"name": "橘色","color": "#ffa500"},
    {"name": "紫色","color": "#800080"},
    {"name": "粉紅色","color": "#ffc0cb"},
    {"name": "灰色","color": "#808080"},
    {"name": "亮紅色","color": "#ef4444"},
    {"name": "琥珀色","color": "#f59e0b"},
    {"name": "亮綠色","color": "#22c55e"},
    {"name": "亮藍色","color": "#3b82f6"}
]
let chipsets=[]
// 大螢幕品牌的個人預設值(TASK-026)。只在建立新場次時被帶進 session，
// 單場改動走 editsessionsettings 只寫 session 表，永遠不會回寫這裡(FR-8)。
let displaydefault={"brandname":"","brandcolor":"","brandlogo":"","displayfields":"","columnorder":""}
// 代號要與後端 timer.py 的 DISPLAYBLOCKLIST / DISPLAYCOLUMNLIST 一致
const DISPLAYDEFAULTBLOCK=[
    {"key":"payout","label":"displayblockpayout"},
    {"key":"stack","label":"displayblockstack"},
    {"key":"nextblind","label":"displayblocknextblind"},
    {"key":"marquee","label":"displayblockmarquee"}
]
const DISPLAYDEFAULTORDER=[
    {"key":"","label":"displayorderdefault"},
    {"key":"payout,center,info","label":"displayorderpci"},
    {"key":"payout,info,center","label":"displayorderpic"},
    {"key":"center,payout,info","label":"displayordercpi"},
    {"key":"center,info,payout","label":"displayordercip"},
    {"key":"info,payout,center","label":"displayorderipc"},
    {"key":"info,center,payout","label":"displayordericp"}
]
let carddeck="classic"
// TASK-046：牌背與牌面分開。舊帳號沒分開設定過時後端回傳與 carddeck 相同的值。
let cardback="classic"
let cardfaceskin="classic"
let potmainside="right"
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
    // 2026-07-30：刪掉 `domgetid("toolapidoclink")` 那段 —— profile.html 沒有這個 id
    // （全站也沒有），所以 if 永遠不成立，是死碼。而且它要設的 href 是 AJAXURL+"swagger/"，
    // 本專案的 API 文件是 frontend/tool/apidoc.html 不是 swagger，就算元素補回來連結也是錯的。
    // （tools/audit/scandeadreference.js 掃出來的）
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
    settext("#displaydefaultcardtitle",profiletext("displaydefaultcardtitle"))
    settext("#displaydefaultcarddesc",profiletext("displaydefaultcarddesc"))
    setvalue("#opendisplaydefaultmodal",profiletext("manage"))
    settext("#chipsetcarddesc",profiletext("chipsetcarddesc"))
    settext("#shakecardtitle",profiletext("shakecardtitle"))
    settext("#shakecarddesc",profiletext("shakecarddesc"))
    updateshaketogglebutton()
    setvalue("#lang-zhtw",profiletext("chinese"))
    setvalue("#lang-en",profiletext("english"))
    settext("#replaysettingscardtitle",profiletext("replaysettingscardtitle"))
    settext("#replaysettingscarddesc",profiletext("replaysettingscarddesc"))

    settext("#toolstitle",profiletext("toolssectiontitle"))
    settext("#toolssubtitle",profiletext("toolssectiondesc"))
    settext("#toollistentry",profiletext("toollistentry"))
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
    renderdisplaydefaultpreview()
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
    let follow=domgetid("followpanel")
    let deleteaccount=domgetid("deleteaccountpanel")
    if(currentusertype=="player"){
        wrapper.appendChild(basic)
        wrapper.appendChild(report)
        if(follow){
            wrapper.appendChild(follow)
        }
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
    if(follow){
        wrapper.appendChild(follow)
    }
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
    carddeck=row["carddeck"]||"classic"
    cardback=row["cardback"]||carddeck
    cardfaceskin=row["cardface"]||carddeck
    potmainside=row["potmainside"]||"right"
    displaydefault={
        "brandname": row["displaybrandname"]||"",
        "brandcolor": row["displaybrandcolor"]||"",
        "brandlogo": row["displaybrandlogo"]||"",
        "displayfields": row["displaydisplayfields"]||"",
        "columnorder": row["displaycolumnorder"]||""
    }
    // 牌背 / 主池位置偏好快取到 localStorage, 供手牌回放 / 現場轉播直接讀取(key 與其共用)
    try{
        localStorage.setItem("bc-deck",carddeck)
        localStorage.setItem(CARDBACKKEY,cardback)
        localStorage.setItem(CARDSKINKEY,cardfaceskin)
        localStorage.setItem("bc-potside",potmainside)
    }catch(error){
        // localStorage 不可用時忽略
    }
    renderbasicprofile(row)
    arrangeprofilesections()
    applyprofilelanguage()
    renderemploymentsection(row)
    loadfollowsection()
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
    // 打卡面板只給員工看（type 不是 player 的人）。主辦者自己不打卡 ——
    // 他要替員工代打卡是在場次頁的員工分頁做，那裡看得到全部人。
    if(currentusertype!="player"){
        let panel=domgetid("staffshiftpanel")
        if(panel){
            panel.classList.remove("hidden")
        }
        ptloadshiftpanel("staffshiftpanel",null,null)
    }
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
            // 篩選列也要重畫 —— 新增或移除員工之後各狀態的計數會變，
            // 只重畫名單的話那幾個數字會停在舊值。
            renderstaffmodalfilter()
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
    // 每次開彈窗都把篩選重設 —— 留著上次的條件會讓人以為名單裡的人不見了。
    staffmodalfilter="all"
    staffmodalkeyword=""
    renderstaffmodalfilter()
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

// 篩選列。人少的時候不顯示 —— 三個人也要先過一排篩選鈕只是礙事。
// 門檻設 6：一個畫面裝得下的量就不需要工具。
function renderstaffmodalfilter(){
    let bar=domgetid("staffmodalfilterbar")
    if(!bar){
        return
    }
    let fulllist=staffdata[currentstafftype]||[]
    if(fulllist.length<6){
        addclass("#staffmodalfilterbar",["hidden"])
        return
    }
    removeclass("#staffmodalfilterbar",["hidden"])
    let activecount=0
    let pendingcount=0
    for(let i=0;i<fulllist.length;i=i+1){
        if(fulllist[i]["status"]=="pending"){
            pendingcount=pendingcount+1
        }else{
            activecount=activecount+1
        }
    }
    let filterlist=[
        ["all",profiletext("filterall"),fulllist.length],
        ["active",profiletext("active"),activecount],
        ["pending",profiletext("pending"),pendingcount]
    ]
    let chiphtml=""
    for(let i=0;i<filterlist.length;i=i+1){
        let key=filterlist[i][0]
        let style="border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
        if(staffmodalfilter==key){
            style="border-emerald-500 bg-emerald-600/20 text-emerald-300"
        }
        chiphtml=chiphtml+"<input type=\"button\" class=\"staffmodalfilter cursor-pointer rounded-full border px-3 py-1 text-xs font-bold "+style+"\" data-filter=\""+key+"\" value=\""+escapehtml(filterlist[i][1]+" "+filterlist[i][2])+"\">"
    }
    bar.innerHTML=
        "<div class=\"flex flex-wrap gap-2\">"+chiphtml+"</div>"+
        "<input type=\"text\" class=\"mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white\" id=\"staffmodalsearch\" value=\""+escapehtml(staffmodalkeyword)+"\" placeholder=\""+escapehtml(profiletext("filtersearch"))+"\">"
    let buttons=bar.querySelectorAll(".staffmodalfilter")
    for(let i=0;i<buttons.length;i=i+1){
        buttons[i].onclick=function(){
            staffmodalfilter=this.getAttribute("data-filter")
            renderstaffmodalfilter()
            renderstaffmodal()
        }
    }
    let search=domgetid("staffmodalsearch")
    if(search){
        search.oninput=function(){
            staffmodalkeyword=this.value
            // 只重畫名單，**不重畫篩選列** —— 重畫會把輸入框換掉、游標跳掉，
            // 打第二個字就得重新點一次。
            renderstaffmodal()
        }
    }
}

function renderstaffmodal(){
    let fulllist=staffdata[currentstafftype]||[]
    // 協會員工可能很多，名單要能依狀態篩、也能搜姓名或編號。
    // 篩選條件不持久化 —— 每次開彈窗都從「全部」開始，
    // 否則上次篩過的條件會讓人以為名單少了人。
    let keyword=String(staffmodalkeyword||"").trim().toLowerCase()
    let list=[]
    for(let k=0;k<fulllist.length;k=k+1){
        let item=fulllist[k]
        let matched=true
        if(staffmodalfilter=="active"){
            matched=item["status"]!="pending"
        }else if(staffmodalfilter=="pending"){
            matched=item["status"]=="pending"
        }
        if(matched&&keyword){
            let hay=String(item["staffname"]||"")+" "+String(item["staffplayerid"]||"")
            matched=hay.toLowerCase().indexOf(keyword)>=0
        }
        if(matched){
            list.push(item)
        }
    }
    let html=""
    if(fulllist.length<1){
        html="<div class=\"rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-4 text-center text-sm text-zinc-500\">"+profiletext("empty")+"</div>"
    }else if(list.length<1){
        html="<div class=\"rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-4 text-center text-sm text-zinc-500\">"+profiletext("filterempty")+"</div>"
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

// 下拉只列出使用者自己的調色盤。若這個計分牌已存的顏色不在調色盤裡（例如預設牌組用的
// #ef4444 #f59e0b #22c55e #3b82f6，早期使用者的調色盤沒有這幾色），沒有任何 option 會被
// selected，瀏覽器就會落在第一個選項 —— 使用者只是打開編輯再按儲存，顏色就被靜默改掉了。
// 所以這裡把「目前這個值」補成一個選項，確保它一定選得到、也一定存得回去。
function chipcoloroptions(selected){
    let html=""
    let i=0
    let matched=false
    for(i=0;i<chipcolors.length;i=i+1){
        let color=chipcolors[i]["color"]
        let name=chipcolors[i]["name"]||color
        let selecteded=""
        if(String(selected).toLowerCase()==String(color).toLowerCase()){
            selecteded=" selected"
            matched=true
        }
        html=html+"<option value=\""+safehtml(color)+"\""+selecteded+">"+safehtml(name)+"</option>"
    }
    if(!matched&&selected){
        // 放在最前面而不是最後面：它是目前生效的值，排在第一個比較符合直覺
        html="<option value=\""+safehtml(selected)+"\" selected>"+safehtml(selected)+profiletext("colornotinpalette")+"</option>"+html
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

// 與 session.js / control.js 同一套：主色對大螢幕底色 #0d0d0d 的 WCAG 對比
// TASK-052：實作收攏到 initialize.js 的 ptcontrastratio()，這裡只留頁面自己的名字
function displaydefaultcontrast(hex){
    return ptcontrastratio(hex)
}

function renderdisplaydefaultpreview(){
    let box=domgetid("displaydefaultpreview")
    if(!box){
        return
    }
    let parts=[]
    if(displaydefault["brandname"]){
        parts.push(displaydefault["brandname"])
    }
    if(displaydefault["brandlogo"]){
        parts.push(profiletext("displaydefaulthaslogo"))
    }
    if(displaydefault["brandcolor"]){
        parts.push(displaydefault["brandcolor"])
    }
    if(displaydefault["displayfields"]){
        parts.push(profiletext("displaydefaulthidden")+displaydefault["displayfields"].split(",").length)
    }
    if(displaydefault["columnorder"]){
        parts.push(profiletext("displaydefaulthasorder"))
    }
    if(parts.length<1){
        box.textContent=profiletext("emptydisplaydefault")
    }else{
        box.textContent=parts.join("、")
    }
}

function updatedisplaydefaulthint(){
    let hint=domgetid("displaydefaultcolorhint")
    if(!hint){
        return
    }
    let color=getvalue("displaydefaultcolor")||""
    if(color==""){
        hint.textContent=profiletext("displaydefaultcolorunset")
        hint.className="mt-2 text-xs text-zinc-500"
    }else{
        let ratio=displaydefaultcontrast(color)
        if(ratio<3){
            hint.textContent=profiletext("displaydefaultcolorlow")+"（"+ratio.toFixed(1)+":1）"
            hint.className="mt-2 text-xs font-bold text-red-400"
        }else if(ratio<4.5){
            hint.textContent=profiletext("displaydefaultcolormid")+"（"+ratio.toFixed(1)+":1）"
            hint.className="mt-2 text-xs font-bold text-amber-400"
        }else{
            hint.textContent=profiletext("displaydefaultcolorok")+"（"+ratio.toFixed(1)+":1）"
            hint.className="mt-2 text-xs text-emerald-400"
        }
    }
}

function opendisplaydefaultmodal(){
    let old=domgetid("displaydefaultmodal")
    if(old){
        old.remove()
    }
    let hiddenlist=String(displaydefault["displayfields"]||"").split(",")
    let blockhtml=""
    let i=0
    for(i=0;i<DISPLAYDEFAULTBLOCK.length;i=i+1){
        let option=DISPLAYDEFAULTBLOCK[i]
        let checked=""
        if(hiddenlist.indexOf(option["key"])<0){
            checked=" checked"
        }
        blockhtml=blockhtml+
        "<label class=\"flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2\">"+
            "<input type=\"checkbox\" class=\"displaydefaultblock h-5 w-5 accent-emerald-500\" data-block=\""+option["key"]+"\""+checked+">"+
            "<span class=\"text-sm text-zinc-200\">"+profiletext(option["label"])+"</span>"+
        "</label>"
    }
    let orderhtml=""
    for(i=0;i<DISPLAYDEFAULTORDER.length;i=i+1){
        let option=DISPLAYDEFAULTORDER[i]
        let selected=""
        if(String(displaydefault["columnorder"]||"")==option["key"]){
            selected=" selected"
        }
        orderhtml=orderhtml+"<option value=\""+option["key"]+"\""+selected+">"+profiletext(option["label"])+"</option>"
    }
    let cover=document.createElement("div")
    cover.id="displaydefaultmodal"
    cover.className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    cover.innerHTML=""+
    "<div class=\"max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-5\">"+
        "<div class=\"mb-4 flex items-start justify-between gap-3\">"+
            "<div>"+
                "<div class=\"text-lg font-semibold text-white\">"+profiletext("displaydefaultcardtitle")+"</div>"+
                "<div class=\"mt-1 text-sm leading-6 text-zinc-400\">"+profiletext("displaydefaultmodaldesc")+"</div>"+
            "</div>"+
            "<input type=\"button\" class=\"closedisplaydefault text-zinc-400 hover:text-white\" value=\"×\">"+
        "</div>"+
        "<div class=\"space-y-4\">"+
            "<div>"+
                "<label class=\"mb-2 block text-sm font-bold text-zinc-100\" for=\"displaydefaultname\">"+profiletext("displaydefaultname")+"</label>"+
                "<input type=\"text\" class=\"min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400\" id=\"displaydefaultname\" maxlength=\"120\" value=\""+safehtml(displaydefault["brandname"])+"\">"+
            "</div>"+
            "<div>"+
                "<label class=\"mb-2 block text-sm font-bold text-zinc-100\" for=\"displaydefaultlogo\">"+profiletext("displaydefaultlogo")+"</label>"+
                "<input type=\"text\" class=\"min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400\" id=\"displaydefaultlogo\" maxlength=\"255\" placeholder=\"https://...\" value=\""+safehtml(displaydefault["brandlogo"])+"\">"+
                "<div class=\"mt-2 text-xs leading-6 text-zinc-500\">"+profiletext("displaydefaultlogohint")+"</div>"+
            "</div>"+
            "<div>"+
                "<label class=\"mb-2 block text-sm font-bold text-zinc-100\" for=\"displaydefaultcolor\">"+profiletext("displaydefaultcolor")+"</label>"+
                "<div class=\"flex items-center gap-3\">"+
                    "<input type=\"color\" class=\"h-12 w-16 shrink-0 cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800\" id=\"displaydefaultcolorpicker\" value=\""+safehtml(displaydefault["brandcolor"]||"#4ade80")+"\">"+
                    "<input type=\"text\" class=\"min-h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400\" id=\"displaydefaultcolor\" maxlength=\"20\" placeholder=\"#4ade80\" value=\""+safehtml(displaydefault["brandcolor"])+"\">"+
                    "<input type=\"button\" class=\"min-h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-bold text-zinc-100 hover:bg-zinc-700\" id=\"displaydefaultcolorclear\" value=\""+profiletext("displaydefaultclear")+"\">"+
                "</div>"+
                "<div class=\"mt-2 text-xs text-zinc-500\" id=\"displaydefaultcolorhint\"></div>"+
            "</div>"+
            "<div>"+
                "<div class=\"mb-2 text-sm font-bold text-zinc-100\">"+profiletext("displaydefaultblocks")+"</div>"+
                "<div class=\"grid grid-cols-1 gap-2\">"+blockhtml+"</div>"+
            "</div>"+
            "<div>"+
                "<label class=\"mb-2 block text-sm font-bold text-zinc-100\" for=\"displaydefaultorder\">"+profiletext("displaydefaultorder")+"</label>"+
                "<select class=\"min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none focus:border-emerald-400\" id=\"displaydefaultorder\">"+orderhtml+"</select>"+
                "<div class=\"mt-2 text-xs leading-6 text-zinc-500\">"+profiletext("displaydefaultorderhint")+"</div>"+
            "</div>"+
        "</div>"+
        "<div class=\"mt-5 flex justify-end gap-2\">"+
            "<input type=\"button\" class=\"closedisplaydefault rounded-xl bg-zinc-700 px-4 py-2 hover:bg-zinc-600\" value=\""+profiletext("cancel")+"\">"+
            "<input type=\"button\" class=\"rounded-xl bg-emerald-600 px-4 py-2 hover:bg-emerald-700\" id=\"savedisplaydefault\" value=\""+profiletext("save")+"\">"+
        "</div>"+
    "</div>"
    document.body.appendChild(cover)
    updatedisplaydefaulthint()
    let closebuttons=cover.querySelectorAll(".closedisplaydefault")
    for(i=0;i<closebuttons.length;i=i+1){
        closebuttons[i].addEventListener("click",function(){
            cover.remove()
        })
    }
    cover.querySelector("#displaydefaultcolor").addEventListener("input",function(){
        let color=getvalue("displaydefaultcolor")
        if(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)){
            cover.querySelector("#displaydefaultcolorpicker").value=color
        }
        updatedisplaydefaulthint()
    })
    cover.querySelector("#displaydefaultcolorpicker").addEventListener("change",function(){
        cover.querySelector("#displaydefaultcolor").value=this.value
        updatedisplaydefaulthint()
    })
    cover.querySelector("#displaydefaultcolorclear").addEventListener("click",function(){
        cover.querySelector("#displaydefaultcolor").value=""
        updatedisplaydefaulthint()
    })
    cover.querySelector("#savedisplaydefault").addEventListener("click",function(){
        savedisplaydefault(this,cover)
    })
}

function savedisplaydefault(button,cover){
    // 勾選代表「要顯示」，送出去的是「要隱藏的清單」，語意相反
    let hidden=[]
    let boxlist=cover.querySelectorAll(".displaydefaultblock")
    let i=0
    for(i=0;i<boxlist.length;i=i+1){
        if(!boxlist[i].checked){
            hidden.push(boxlist[i].getAttribute("data-block"))
        }
    }
    let payload={
        "brandname": getvalue("displaydefaultname")||"",
        "brandlogo": getvalue("displaydefaultlogo")||"",
        "brandcolor": getvalue("displaydefaultcolor")||"",
        "displayfields": hidden.join(","),
        "columnorder": getvalue("displaydefaultorder")||""
    }
    button.disabled=true
    ajax("PUT",AJAXURL+"edituserdisplaydefault",function(event,data){
        button.disabled=false
        if(data&&data["success"]){
            // 後端會把不合法的值正規化成空字串，用回傳值而不是送出去的值，
            // 才不會讓畫面顯示一個其實沒存進去的設定
            let saved=data["data"]||{}
            displaydefault={
                "brandname": saved["displaybrandname"]||"",
                "brandcolor": saved["displaybrandcolor"]||"",
                "brandlogo": saved["displaybrandlogo"]||"",
                "displayfields": saved["displaydisplayfields"]||"",
                "columnorder": saved["displaycolumnorder"]||""
            }
            renderdisplaydefaultpreview()
            successprompt(profiletext("savesuccess"))
            cover.remove()
        }else{
            errorprompt((data&&data["data"])||profiletext("unknownerror"))
        }
    },JSON.stringify(payload),[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ])
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

// 手牌回放設定燈箱內的選取高亮:牌背卡片(data-deck)標 sel、主池位置膠囊(data-potside)變藍
function renderreplayselection(){
    let cover=domgetid("replaysettingsmodal")
    if(!cover){
        return
    }
    // TASK-046：牌背(data-cardback)與牌面(data-cardface)各自一組色票，各自標選取
    let backopts=cover.querySelectorAll("[data-cardback]")
    let i=0
    for(i=0;i<backopts.length;i=i+1){
        if(backopts[i].getAttribute("data-cardback")==cardback){
            backopts[i].classList.add("sel")
        }else{
            backopts[i].classList.remove("sel")
        }
    }
    let faceopts=cover.querySelectorAll("[data-cardface-skin]")
    for(i=0;i<faceopts.length;i=i+1){
        if(faceopts[i].getAttribute("data-cardface-skin")==cardfaceskin){
            faceopts[i].classList.add("sel")
        }else{
            faceopts[i].classList.remove("sel")
        }
    }
    let sideopts=cover.querySelectorAll("[data-potside]")
    for(i=0;i<sideopts.length;i=i+1){
        if(sideopts[i].getAttribute("data-potside")==potmainside){
            sideopts[i].classList.remove("bg-zinc-700","text-zinc-300")
            sideopts[i].classList.add("bg-blue-600","text-white")
        }else{
            sideopts[i].classList.remove("bg-blue-600","text-white")
            sideopts[i].classList.add("bg-zinc-700","text-zinc-300")
        }
    }
}

// TASK-046：kind 是 "cardback" 或 "cardface"，只換那一邊。
// 端點同時接受 carddeck（整套一起換，舊行為）與這兩個，回應會把三個值都帶回來。
function switchdeck(kind,deck){
    let body={}
    body[kind]=deck
    ajax("PUT",AJAXURL+"editusercarddeck",function(event,data){
        if(data["success"]){
            carddeck=data["data"]||carddeck
            cardback=data["cardback"]||cardback
            cardfaceskin=data["cardface"]||cardfaceskin
            try{
                localStorage.setItem("bc-deck",carddeck)
                localStorage.setItem(CARDBACKKEY,cardback)
                localStorage.setItem(CARDSKINKEY,cardfaceskin)
            }catch(error){
                // localStorage 不可用時忽略
            }
            // 立刻套用到目前這一頁，不必重整就看得到
            ptcardskinapply(document.documentElement,cardback,cardfaceskin)
            renderreplayselection()
            return
        }
        errorprompt(profiletext("unknownerror"))
    },str(body),[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ])
}

function switchpotside(side){
    ajax("PUT",AJAXURL+"edituserpotmainside",function(event,data){
        if(data["success"]){
            potmainside=data["data"]||side
            try{
                localStorage.setItem("bc-potside",potmainside)
            }catch(error){
                // localStorage 不可用時忽略
            }
            renderreplayselection()
            return
        }
        errorprompt(profiletext("unknownerror"))
    },str({
        "potmainside": side
    }),[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ])
}

// 牌面配色（兩色 / 四色）。與牌背不同，這是全站生效的顯示偏好，
// 由 initialize.js 在每一頁把 class 掛到 <html> 上，所以每頁都吃得到。
// 目前只存 localStorage —— 後端還沒有 cardface 欄位（見 TASK-046），換裝置要重選一次。
function switchcardface(face){
    try{
        localStorage.setItem(CARDFACEKEY,face)
    }catch(error){
        // localStorage 不可用時只套用當下這一頁
    }
    ptcardfaceapply(face)
    let cover=domgetid("replaysettingsmodal")
    if(cover){
        let opts=cover.querySelectorAll("[data-cardface]")
        for(let i=0;i<opts.length;i=i+1){
            let selected=opts[i].getAttribute("data-cardface")==face
            opts[i].className="rounded-full "+(selected?"bg-blue-600 text-white":"bg-zinc-700 text-zinc-300")+" px-6 py-2 text-sm font-bold transition hover:opacity-90"
        }
    }
}

// 手牌回放設定燈箱:牌背樣式(實際卡背+牌面預覽,點即套用並存帳號)+ 主池位置
function openreplaysettings(){
    let old=domgetid("replaysettingsmodal")
    if(old){
        closeprofilecover(old)
    }
    lockprofilescroll()
    let i=0
    let decks=[
        {"key": "classic","name": profiletext("deckclassic")},
        {"key": "crimson","name": profiletext("deckcrimson")},
        {"key": "midnight","name": profiletext("deckmidnight")},
        {"key": "royal","name": profiletext("deckroyal")},
        {"key": "ocean","name": profiletext("deckocean")},
        {"key": "sunset","name": profiletext("decksunset")},
        {"key": "rose","name": profiletext("deckrose")},
        {"key": "graphite","name": profiletext("deckgraphite")},
        {"key": "minimal","name": profiletext("deckminimal")}
    ]
    // 牌面只列真的看得出差別的四套（2026-07-29 人工決策）。
    //
    // 原因：那 8 個名字描述的是**牌背**的顏色。牌面底色分別是 #18181b / #221416 /
    // #20262e / #1e1830 / #10222a / #291a12 / #26141c / #242428 —— 全是「幾乎黑」，
    // RGB 每個分量差不到 0x20，在 40x46 的卡片上根本分不出來。列 8 個但其中 6 個
    // 看起來一模一樣，比只列 4 個更糟。
    //
    // 牌背維持 8 種：那邊是 #1e3a8a / #7f1d1d / #0f5d43 / #6d28d9 / #0e7490 /
    // #c2410c / #be185d / #3f3f46，差異明顯，名字也名副其實。
    const FACEKEYLIST=["classic","midnight","graphite","minimal"]
    let facedecks=[]
    for(i=0;i<decks.length;i=i+1){
        if(FACEKEYLIST.indexOf(decks[i]["key"])>=0){
            facedecks.push(decks[i])
        }
    }
    // 使用者先前若選過已經被移除的那 5 套，仍要看得到自己目前的選擇，
    // 否則整排色票沒有任何一個被標選中，會以為設定不見了（TASK-048 同類問題）。
    let facelisted=false
    for(i=0;i<facedecks.length;i=i+1){
        if(facedecks[i]["key"]==cardfaceskin){
            facelisted=true
        }
    }
    if(!facelisted){
        for(i=0;i<decks.length;i=i+1){
            if(decks[i]["key"]==cardfaceskin){
                facedecks.push({"key": decks[i]["key"],"name": decks[i]["name"]+profiletext("decknotlisted")})
            }
        }
    }
    // TASK-046 變體 A：牌背與牌面各一組色票，上下兩區。
    // 每一組只預覽自己那一邊——牌背只畫牌背、牌面只畫一張 A♥，
    // 選什麼就看到什麼，不會像以前那樣兩張一起出現卻只能一起換。
    let backswatches=""
    let faceswatches=""
    for(i=0;i<decks.length;i=i+1){
        let backsel=decks[i]["key"]==cardback?" sel":""
        backswatches=backswatches+`<div class="hr-lbopt deck-${decks[i]["key"]}${backsel}" data-cardback="${decks[i]["key"]}"><div class="hr-lbswatch"><span class="bc-card back sm"><span class="bc-emblem"></span></span></div><div class="hr-lbname">${decks[i]["name"]}</div></div>`
    }
    for(i=0;i<facedecks.length;i=i+1){
        let facesel=facedecks[i]["key"]==cardfaceskin?" sel":""
        faceswatches=faceswatches+`<div class="hr-lbopt deck-${facedecks[i]["key"]}${facesel}" data-cardface-skin="${facedecks[i]["key"]}"><div class="hr-lbswatch"><span class="bc-card red sm"><span class="r">A</span><span class="s">♥</span></span></div><div class="hr-lbname">${facedecks[i]["name"]}</div></div>`
    }
    let currentface=ptcardfaceget()
    let twosel=currentface=="two"?"bg-blue-600 text-white":"bg-zinc-700 text-zinc-300"
    let foursel=currentface=="four"?"bg-blue-600 text-white":"bg-zinc-700 text-zinc-300"
    let leftsel=potmainside=="left"?"bg-blue-600 text-white":"bg-zinc-700 text-zinc-300"
    let rightsel=potmainside=="right"?"bg-blue-600 text-white":"bg-zinc-700 text-zinc-300"
    let cover=doccreate("div")
    cover.id="replaysettingsmodal"
    cover.className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 p-4"
    cover.innerHTML=`
        <div class="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl">
            <div class="mb-4 flex items-center justify-between">
                <div class="text-lg font-semibold text-white">${profiletext("replaysettingscardtitle")}</div>
                <input type="button" class="closereplaysettings cursor-pointer text-zinc-400 hover:text-white" value="×">
            </div>
            <div class="mb-2 text-sm font-bold text-zinc-300">${profiletext("carddeckcardtitle")}</div>
            <div class="hr-lbgrid mb-5">${backswatches}</div>
            <div class="mb-2 text-sm font-bold text-zinc-300">${profiletext("cardfaceskincardtitle")}</div>
            <div class="mb-1 text-xs text-zinc-500">${profiletext("cardfaceskincarddesc")}</div>
            <div class="hr-lbgrid mb-5">${faceswatches}</div>
            <div class="mb-2 text-sm font-bold text-zinc-300">${profiletext("cardfacecardtitle")}</div>
            <div class="mb-1 text-xs text-zinc-500">${profiletext("cardfacecarddesc")}</div>
            <div class="mb-5 flex gap-2">
                <input type="button" class="rounded-full ${twosel} px-6 py-2 text-sm font-bold transition hover:opacity-90" data-cardface="two" value="${profiletext("cardfacetwo")}">
                <input type="button" class="rounded-full ${foursel} px-6 py-2 text-sm font-bold transition hover:opacity-90" data-cardface="four" value="${profiletext("cardfacefour")}">
            </div>
            <div class="mb-2 text-sm font-bold text-zinc-300">${profiletext("potsidecardtitle")}</div>
            <div class="flex gap-2">
                <input type="button" class="rounded-full ${leftsel} px-6 py-2 text-sm font-bold transition hover:opacity-90" data-potside="left" value="${profiletext("potsideleft")}">
                <input type="button" class="rounded-full ${rightsel} px-6 py-2 text-sm font-bold transition hover:opacity-90" data-potside="right" value="${profiletext("potsideright")}">
            </div>
        </div>`
    document.body.appendChild(cover)
    let closebuttons=cover.querySelectorAll(".closereplaysettings")
    for(i=0;i<closebuttons.length;i=i+1){
        closebuttons[i].onclick=function(){
            closeprofilecover(cover)
        }
    }
    let backopts=cover.querySelectorAll("[data-cardback]")
    for(i=0;i<backopts.length;i=i+1){
        backopts[i].onclick=function(){
            switchdeck("cardback",this.getAttribute("data-cardback"))
        }
    }
    let faceskinopts=cover.querySelectorAll("[data-cardface-skin]")
    for(i=0;i<faceskinopts.length;i=i+1){
        faceskinopts[i].onclick=function(){
            switchdeck("cardface",this.getAttribute("data-cardface-skin"))
        }
    }
    let faceopts=cover.querySelectorAll("[data-cardface]")
    for(i=0;i<faceopts.length;i=i+1){
        faceopts[i].onclick=function(){
            switchcardface(this.getAttribute("data-cardface"))
        }
    }
    let sideopts=cover.querySelectorAll("[data-potside]")
    for(i=0;i<sideopts.length;i=i+1){
        sideopts[i].onclick=function(){
            switchpotside(this.getAttribute("data-potside"))
        }
    }
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

onclick("#opendisplaydefaultmodal",function(){
    opendisplaydefaultmodal()
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

onclick("#openreplaysettings",function(){
    openreplaysettings()
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

// ===== 追隨主辦單位 =====
// 一位主辦單位一張卡。標籤用協會名稱組出來，不顯示主辦者姓名
// （全站沒有任何地方顯示「這場是誰主辦的」，這個性質要保持）。

function renderfollowsection(followlist){
    let grid=domgetid("followlist")
    if(!grid){
        return
    }
    if(!followlist.length){
        ptshowempty("#followlist",ptfollowtext("emptylist","還沒有追隨任何主辦單位"),`
            <div class="mt-4 flex flex-wrap justify-center gap-2">
                <input type="button" class="cursor-pointer rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-700" id="followemptyadd" value="${ptfollowtext("add","新增追隨")}">
            </div>
            <div class="mt-3 text-xs text-zinc-500">${ptfollowtext("emptylistnext","在場次頁點主辦單位旁的「追隨」，或用上面的「新增追隨」加入。")}</div>
        `)
        onclick("#followemptyadd",function(element,event){
            openfollowmodal("add",null)
        })
        return
    }
    let html=""
    for(let i=0;i<followlist.length;i=i+1){
        let item=followlist[i]
        let chiphtml=""
        let clublist=item["clublist"]||[]
        let followclubidlist=item["followclubidlist"]||[]
        for(let n=0;n<clublist.length;n=n+1){
            if(item["allclubed"]||0<=followclubidlist.indexOf(clublist[n]["clubid"])){
                chiphtml=chiphtml+`<span class="followscopechip">${safehtml(clublist[n]["clubname"]||"")}</span>`
            }
        }
        let notifyclass="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
        let notifytext=ptfollowtext("notifyoff","通知已關閉（點擊開啟）")
        if(item["notifyed"]){
            notifyclass="border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            notifytext=ptfollowtext("notifyon","通知已開啟（點擊關閉）")
        }
        html=html+`
            <div class="followcard rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="text-base font-bold text-white">${safehtml(ptfollowlabel(clublist))}</div>
                    <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">${ptfollowtext("following","追隨中")}</span>
                </div>
                <div class="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">${ptfollowtext("scope","地點範圍")}</div>
                <div class="followscopelist mt-2">
                    <span class="text-sm text-zinc-300">${safehtml(ptfollowscopetext(item))}</span>
                    ${chiphtml}
                </div>
                <div class="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
                    <input type="button" class="min-h-10 cursor-pointer rounded-2xl border px-4 text-sm font-bold transition ${notifyclass} follownotifybutton" data-followuserid="${item["followuserid"]}" data-notifyed="${item["notifyed"]}" value="${notifytext}">
                    <input type="button" class="min-h-10 cursor-pointer rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700 followscopebutton" data-followuserid="${item["followuserid"]}" value="${ptfollowtext("scope","地點範圍")}">
                    <input type="button" class="min-h-10 cursor-pointer rounded-2xl border border-red-900/60 bg-red-950/40 px-4 text-sm font-bold text-red-300 transition hover:bg-red-900/40 followremovebutton" data-followuserid="${item["followuserid"]}" value="${ptfollowtext("unfollow","取消追隨")}">
                </div>
            </div>
        `
    }
    grid.innerHTML=html
    bindfollowcard(followlist)
}

function bindfollowcard(followlist){
    let grid=domgetid("followlist")
    if(!grid){
        return
    }
    let notifylist=grid.querySelectorAll(".follownotifybutton")
    for(let i=0;i<notifylist.length;i=i+1){
        notifylist[i].addEventListener("click",function(event){
            let button=event.currentTarget
            // 這顆會被連點，沒擋重入的話會送出兩個相反的請求，最後停在哪個值看運氣
            if(button.disabled){
                return
            }
            let wanted=button.getAttribute("data-notifyed")!="true"
            ptsetsubmitstate(button,true,ptfollowtext("removing","處理中…"))
            ptfollownotify(button.getAttribute("data-followuserid"),wanted,function(okayed,responsedata){
                ptsetsubmitstate(button,false)
                if(!okayed){
                    pttoast(pterror(responsedata),"error")
                    return
                }
                loadfollowsection()
            })
        })
    }
    let scopelist=grid.querySelectorAll(".followscopebutton")
    for(let i=0;i<scopelist.length;i=i+1){
        scopelist[i].addEventListener("click",function(event){
            let followuserid=int(event.currentTarget.getAttribute("data-followuserid"))
            let target=null
            for(let n=0;n<followlist.length;n=n+1){
                if(followlist[n]["followuserid"]==followuserid){
                    target=followlist[n]
                }
            }
            openfollowmodal("edit",target)
        })
    }
    let removelist=grid.querySelectorAll(".followremovebutton")
    for(let i=0;i<removelist.length;i=i+1){
        removelist[i].addEventListener("click",function(event){
            let button=event.currentTarget
            if(button.disabled){
                return
            }
            ptconfirm(ptfollowtext("unfollowconfirm","確定要取消追隨嗎？取消後不會再收到新場次通知。"),function(okayed){
                if(!okayed){
                    return
                }
                ptsetsubmitstate(button,true,ptfollowtext("removing","處理中…"))
                ptfollowdelete(button.getAttribute("data-followuserid"),function(deleted,responsedata){
                    ptsetsubmitstate(button,false)
                    if(!deleted){
                        pttoast(pterror(responsedata),"error")
                        return
                    }
                    pttoastsuccess(ptfollowtext("unfollowed","已取消追隨"))
                    loadfollowsection()
                })
            })
        })
    }
}

function openfollowmodal(mode,target){
    ptfollowopenmodal(mode,target,function(saveded){
        if(saveded){
            loadfollowsection()
        }
    })
}

function loadfollowsection(){
    let grid=domgetid("followlist")
    if(!grid){
        return
    }
    ptfollowloadlist(function(followlist){
        if(followlist==null){
            // 只丟 toast 的話這一區會留白，看起來像壞掉；補一顆重新載入
            ptshowempty("#followlist",ptfollowtext("loadfail","追隨清單載入失敗"),`
                <div class="mt-4 flex flex-wrap justify-center gap-2">
                    <input type="button" class="cursor-pointer rounded bg-zinc-700 px-4 py-2 hover:bg-zinc-600" id="followretry" value="${ptfollowtext("retry","重新載入")}">
                </div>
            `)
            onclick("#followretry",function(element,event){
                loadfollowsection()
            })
            return
        }
        renderfollowsection(followlist)
        scrolltofollowpanel()
    })
}

// 從場次列表的空狀態按「管理追隨清單」進來時帶著 #followpanel。
// arrangeprofilesections() 用 appendChild 重排過，瀏覽器自己的錨點捲動會失準，
// 所以資料畫完之後再手動捲一次。
let followscrolled=false

function scrolltofollowpanel(){
    if(followscrolled||location.hash!="#followpanel"){
        return
    }
    let panel=domgetid("followpanel")
    if(panel){
        followscrolled=true
        panel.scrollIntoView({"behavior": "smooth","block": "start"})
    }
}

onclick("#followaddbutton",function(element,event){
    openfollowmodal("add",null)
})
