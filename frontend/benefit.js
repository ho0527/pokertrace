if(!weblsget(WEBLSNAME+"signin")){
    href("signin.html")
}

let allsessiondata=[]
let chart=null
let clubchart=null

// 依協會分組的獲利／虧損色。emerald 沿用全站「獲利」語意, red 沿用「虧損」語意。
// 這組配色在 deuteranopia 下的 OKLab ΔE 只有 6.5, 屬 6-8 底線帶, 依 dataviz 規範
// 「僅在有次要編碼時才可使用」— 本圖同時具備三重次要編碼: 長條由零基線往正負兩側
// 分岔(位置)、每條直接標註帶正負號的數值(文字)、以及下方的表格孿生。
const CLUBPROFITCOLOR="#34d399"
const CLUBLOSSCOLOR="#f87171"

function benefittext(key){
    if(!TRANSLATE[LANGUAGE]){
        return key
    }
    if(!TRANSLATE[LANGUAGE]["benefit"]){
        return key
    }
    return TRANSLATE[LANGUAGE]["benefit"][key]||key
}

function setbenefittext(selector,text){
    let element=document.querySelector(selector)
    if(element){
        if(element.tagName=="INPUT"){
            element.value=text
        }else{
            element.textContent=text
        }
    }
}

function applybenefitlanguage(){
    document.title=benefittext("title")
    setbenefittext("#benefiteyebrow",benefittext("eyebrow"))
    setbenefittext("#benefittitle",benefittext("title"))
    setbenefittext("#benefitpositiondesc",benefittext("positiondesc"))
    setbenefittext("#backtoprofile",benefittext("backtoprofile"))
    setbenefittext("#benefitfiltertitle",benefittext("filtertitle"))
    setbenefittext("#benefitfilterdesc",benefittext("filterdesc"))
    setbenefittext("#startdatelabel",benefittext("startdate"))
    setbenefittext("#enddatelabel",benefittext("enddate"))
    setbenefittext("#search",benefittext("search"))
    setbenefittext("#reset",benefittext("reset"))
    setbenefittext("#summaryrangetitle",benefittext("summaryrangetitle"))
    setbenefittext("#summarytotaltitle",benefittext("summarytotaltitle"))
    setbenefittext("#summarycounttitle",benefittext("summarycounttitle"))
    setbenefittext("#chartemptytitle",benefittext("emptychart"))
    setbenefittext("#chartemptydesc",benefittext("emptychartdesc"))
    setbenefittext("#chartemptycta",TRANSLATE[LANGUAGE]["navigationbar"]["session"])
    setbenefittext("#clubsectiontitle",benefittext("clubsectiontitle"))
    setbenefittext("#clubsectiondesc",benefittext("clubsectiondesc"))
    setbenefittext("#clubheadname",benefittext("clubheadname"))
    setbenefittext("#clubheadcount",benefittext("clubheadcount"))
    setbenefittext("#clubheadprofit",benefittext("clubheadprofit"))
    setbenefittext("#clubemptytitle",benefittext("clubempty"))
    setbenefittext("#clubemptydesc",benefittext("clubemptydesc"))
}

function sessionshowmoney(row){
    return row["isstaff"]!=true&&((row["isown"]==false&&row["owned"]==true)||(row["isown"]==true&&row["owned"]==false))&&((row["isown"]==false&&(row["myregistrationstatus"]=="confirmed"||row["myregistrationstatus"]=="advanced"))||row["owned"]==false)
}

function sessionprofit(row){
    if(row["isstaff"]==true){
        return null
    }
    if(row["owned"]==true){
        if(row["isown"]==true){
            return null
        }
        if((row["myregistrationstatus"]=="confirmed"||row["myregistrationstatus"]=="advanced")&&row["myregistration"]){
            return float(row["myregistration"]["profit"]||0)
        }
        return null
    }
    if(row["isown"]==true){
        let buyintotal=float(row["buyin"]||0)+float(row["buyinfee"]||0)
        let rebuytotal=(float(row["rebuybuyin"]||0)+float(row["rebuyfee"]||0))*float(row["rebuycount"]||0)
        let reentrytotal=(float(row["reentrybuyin"]||0)+float(row["reentryfee"]||0))*float(row["reentrycount"]||0)
        let addontotal=(float(row["addonbuyin"]||0)+float(row["addonfee"]||0))*float(row["addoncount"]||0)
        return float(row["winprice"]||0)-(buyintotal+rebuytotal+reentrytotal+addontotal)
    }
    return null
}

function buildchartdata(startdate,enddate){
    let alldailyprofit={}
    let allsorteddates=[]
    let i=0
    for(i=0;i<allsessiondata.length;i=i+1){
        let session=allsessiondata[i]
        let profit=sessionprofit(session)
        if(profit==null||!sessionshowmoney(session)){
            continue
        }
        let date=ptformatdatetime(session["starttime"]).substring(0,10)
        if(date==""){
            continue
        }
        if(alldailyprofit[date]==undefined){
            alldailyprofit[date]=0
            allsorteddates.push(date)
        }
        alldailyprofit[date]=alldailyprofit[date]+profit
    }
    allsorteddates.sort()

    let allcumulative={}
    let cumulative=0
    for(i=0;i<allsorteddates.length;i=i+1){
        let date=allsorteddates[i]
        cumulative=cumulative+alldailyprofit[date]
        allcumulative[date]=cumulative
    }

    let sorteddates=[]
    for(i=0;i<allsorteddates.length;i=i+1){
        let currentdate=allsorteddates[i]
        let passstarted=true
        let passended=true
        if(startdate!=""&&currentdate<startdate){
            passstarted=false
        }
        if(enddate!=""&&currentdate>enddate){
            passended=false
        }
        if(passstarted&&passended){
            sorteddates.push(currentdate)
        }
    }

    let dailyprofit={}
    let cumulativevalues=[]
    let totalprofit=0
    for(i=0;i<sorteddates.length;i=i+1){
        let date=sorteddates[i]
        dailyprofit[date]=alldailyprofit[date]||0
        cumulativevalues.push(allcumulative[date]||0)
        totalprofit=allcumulative[date]||0
    }

    return {
        "sorteddates": sorteddates,
        "dailyprofit": dailyprofit,
        "cumulativevalues": cumulativevalues,
        "totalprofit": totalprofit
    }
}

// 依協會彙整。刻意重用 sessionprofit() 與 sessionshowmoney(), 不自行重寫排除規則:
// 那兩支已經處理好「聘用人員不計入自己盈虧」(isstaff) 與「主辦場次不計入」(owned+isown)。
function buildclubdata(startdate,enddate){
    let grouplist=[]
    let indexmap={}
    let i=0
    for(i=0;i<allsessiondata.length;i=i+1){
        let session=allsessiondata[i]
        let profit=sessionprofit(session)
        if(profit!=null&&sessionshowmoney(session)){
            let date=ptformatdatetime(session["starttime"]).substring(0,10)
            let inranged=true
            if(date==""){
                inranged=false
            }
            if(startdate!=""&&date<startdate){
                inranged=false
            }
            if(enddate!=""&&date>enddate){
                inranged=false
            }
            if(inranged){
                let name=session["clubname"]||""
                if(name==""){
                    name=benefittext("clubuncategorized")
                }
                if(indexmap[name]==undefined){
                    indexmap[name]=grouplist.length
                    grouplist.push({"name":name,"count":0,"profit":0})
                }
                let target=grouplist[indexmap[name]]
                target["count"]=target["count"]+1
                target["profit"]=target["profit"]+profit
            }
        }
    }
    grouplist.sort(function(a,b){
        return b["profit"]-a["profit"]
    })
    return grouplist
}

// 協會表的排序狀態。key 為空字串時維持 buildclubdata 的預設順序（淨盈虧由大到小）。
let clubsortstate={ "key": "","ascended": true }

// 排序取值：協會名稱用字串比、場次數與淨盈虧用數字比。
// 取不到就回 null，由 ptsortcompare 統一排到最後。
function clubsortvalue(item,key){
    let value=null
    if(key=="name"){
        let text=String(item["name"]||"").trim()
        if(text!=""){
            value=text
        }
    }else{
        let number=Number(item[key])
        if(item[key]!=null&&!isNaN(number)){
            value=number
        }
    }
    return value
}

function renderclubtable(grouplist){
    grouplist=ptsortlist(grouplist,clubsortstate["key"],clubsortstate["ascended"],clubsortvalue)
    ptsortarrow("#clubtablehead",clubsortstate["key"],clubsortstate["ascended"])
    let body=domgetid("clubtablebody")
    body.innerHTML=""
    let i=0
    for(i=0;i<grouplist.length;i=i+1){
        let row=document.createElement("tr")
        row.className="border-b border-zinc-900"
        let namecell=document.createElement("td")
        namecell.className="py-2 pr-4 text-zinc-100"
        // 協會名稱是使用者資料, 用 textContent 寫入不進 HTML 字串
        namecell.textContent=grouplist[i]["name"]
        let countcell=document.createElement("td")
        countcell.className="py-2 pr-4 text-right font-mono text-zinc-300"
        countcell.textContent=String(grouplist[i]["count"])
        let profitcell=document.createElement("td")
        profitcell.className="py-2 text-right font-mono font-bold"
        if(grouplist[i]["profit"]<0){
            profitcell.style.color=CLUBLOSSCOLOR
        }else{
            profitcell.style.color=CLUBPROFITCOLOR
        }
        profitcell.textContent=formatsignednumber(grouplist[i]["profit"])
        row.appendChild(namecell)
        row.appendChild(countcell)
        row.appendChild(profitcell)
        body.appendChild(row)
    }
}

function renderclubchart(){
    let startdate=getvalue("startdate")
    let enddate=getvalue("enddate")
    let grouplist=buildclubdata(startdate,enddate)
    renderclubtable(grouplist)

    if(grouplist.length<1){
        addclass("#clubempty",[])
        removeclass("#clubempty",["hidden"])
        addclass("#clubtablewrap",["hidden"])
        addclass("#clubchart",["hidden"])
        if(clubchart){
            clubchart.clear()
        }
        return
    }
    addclass("#clubempty",["hidden"])
    removeclass("#clubtablewrap",["hidden"])

    // 只有一個協會時不畫長條圖: 單條長條圖沒有比較對象, 表格本身就是更好的呈現
    if(grouplist.length<2){
        addclass("#clubchart",["hidden"])
        if(clubchart){
            clubchart.clear()
        }
        return
    }
    removeclass("#clubchart",["hidden"])

    // 高度依協會數量算出, 並額外保留 X 軸標籤帶的空間, 避免軸標籤被容器裁掉
    let host=domgetid("clubchart")
    host.style.width="100%"
    host.style.height=(grouplist.length*44+96)+"px"
    if(!clubchart){
        clubchart=echarts.init(host)
    }else{
        clubchart.resize()
    }

    let namelist=[]
    let valuelist=[]
    let i=0
    for(i=grouplist.length-1;i>=0;i=i-1){
        namelist.push(grouplist[i]["name"])
        let itemcolor=CLUBPROFITCOLOR
        if(grouplist[i]["profit"]<0){
            itemcolor=CLUBLOSSCOLOR
        }
        valuelist.push({
            "value": grouplist[i]["profit"],
            "itemStyle": {
                "color": itemcolor,
                "borderRadius": 4
            },
            "count": grouplist[i]["count"]
        })
    }

    clubchart.setOption({
        "backgroundColor": "#18181b",
        "tooltip": {
            "trigger": "item",
            "backgroundColor": "rgba(0, 0, 0, 0.7)",
            "textStyle": {
                "color": "#fff"
            },
            "formatter": function(params){
                // params.name 為使用者輸入的協會名稱, ECharts tooltip 會當 HTML 解析,
                // 因此先把角括號與 & 轉義再組字串
                let safename=String(params.name).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
                let count=params.data["count"]||0
                return safename+"<br>"+benefittext("clubheadprofit")+": "+formatsignednumber(params.value)+"<br>"+benefittext("clubheadcount")+": "+count
            }
        },
        "grid": {
            "left": "3%",
            "right": "12%",
            "top": "6%",
            "bottom": "12%",
            "containLabel": true
        },
        "xAxis": {
            "type": "value",
            "axisLine": {
                "lineStyle": {
                    "color": "#3f3f46"
                }
            },
            "axisLabel": {
                "color": "#999"
            },
            "splitLine": {
                "lineStyle": {
                    "color": "#27272a",
                    "type": "solid"
                }
            }
        },
        "yAxis": {
            "type": "category",
            "data": namelist,
            "axisLine": {
                "lineStyle": {
                    "color": "#3f3f46"
                }
            },
            "axisLabel": {
                "color": "#d4d4d8"
            },
            "axisTick": {
                "show": false
            },
            "splitLine": {
                "show": false
            }
        },
        "series": [
            {
                "type": "bar",
                "data": valuelist,
                "barCategoryGap": "45%",
                "label": {
                    "show": true,
                    "position": "right",
                    "color": "#e4e4e7",
                    "fontFamily": "ui-monospace, SFMono-Regular, Menlo, monospace",
                    "formatter": function(params){
                        return formatsignednumber(params.value)
                    }
                }
            }
        ]
    },true)
}

function formatrange(startdate,enddate){
    return startdate+" ~ "+enddate
}

function formatsignednumber(number){
    if(0<=number){
        return "+"+number
    }
    return ""+number
}

function updatesummary(result,startdate,enddate){
    innertext("#summaryrangevalue",formatrange(startdate,enddate),false)
    innertext("#summarytotalvalue",formatsignednumber(result["totalprofit"]||0),false)
    removeclass("#summarytotalvalue",["text-green-400","text-red-400"])
    if(0<=(result["totalprofit"]||0)){
        addclass("#summarytotalvalue",["text-green-400"])
    }else{
        addclass("#summarytotalvalue",["text-red-400"])
    }
    innertext("#summarycountvalue",result["sorteddates"].length,false)

    if(result["sorteddates"].length<1){
        innertext("#benefitresultdesc",benefittext("emptyresultdesc"),false)
        return
    }
    innertext("#benefitresultdesc",benefittext("resultdescprefix")+" "+startdate+" "+benefittext("to")+" "+enddate+" "+benefittext("resultdescsuffix"),false)
}

function showemptychart(showed){
    if(showed){
        style("#chart",[["display","none"]])
        removeclass("#chartempty",["hidden"])
        return
    }
    style("#chart",[["display","block"]])
    addclass("#chartempty",["hidden"])
}

function renderchart(){
    let startdate=getvalue("startdate")
    let enddate=getvalue("enddate")
    let result=buildchartdata(startdate,enddate)
    updatesummary(result,startdate,enddate)

    if(result["sorteddates"].length<1){
        showemptychart(true)
        if(chart){
            chart.clear()
        }
        return
    }

    showemptychart(false)
    if(!chart){
        chart=echarts.init(domgetid("chart"))
    }

    let option={
        "backgroundColor": "#18181b",
        "tooltip": {
            "trigger": "axis",
            "backgroundColor": "rgba(0, 0, 0, 0.7)",
            "textStyle": {
                "color": "#fff"
            },
            "formatter": function(params){
                if(params.length<1){
                    return ""
                }
                let date=params[0].name
                let value=params[0].value
                let dailyvalue=result["dailyprofit"][date]||0
                return date+"<br>"+benefittext("dailyprofit")+": "+dailyvalue+"<br>"+benefittext("cumulativeprofit")+": "+value
            }
        },
        "grid": {
            "left": "10%",
            "right": "10%",
            "top": "10%",
            "bottom": "10%",
            "containLabel": true
        },
        "xAxis": {
            "type": "category",
            "data": result["sorteddates"],
            "name": benefittext("date"),
            "nameLocation": "middle",
            "nameGap": 30,
            "nameTextStyle": {
                "color": "#999"
            },
            "axisLine": {
                "lineStyle": {
                    "color": "#555"
                }
            },
            "axisLabel": {
                "color": "#bbb"
            }
        },
        "yAxis": {
            "type": "value",
            "name": benefittext("amount"),
            "nameLocation": "middle",
            "nameGap": 50,
            "nameTextStyle": {
                "color": "#999"
            },
            "axisLine": {
                "lineStyle": {
                    "color": "#555"
                }
            },
            "axisLabel": {
                "color": "#bbb"
            },
            "splitLine": {
                "lineStyle": {
                    "color": "#444"
                }
            }
        },
        "series": [{
            "type": "line",
            "data": result["cumulativevalues"],
            "showSymbol": true,
            "smooth": true,
            "itemStyle": {
                "color": function(params){
                    let dailyvalue=result["dailyprofit"][result["sorteddates"][params.dataIndex]]||0
                    if(0<=dailyvalue){
                        return "#10b981"
                    }
                    return "#ef4444"
                },
                "borderColor": "#fff",
                "borderWidth": 2
            },
            "lineStyle": {
                "color": "#3b82f6",
                "width": 2
            },
            "areaStyle": {
                "color": new echarts.graphic.LinearGradient(0,0,0,1,[
                    {"offset": 0,"color": "rgba(59, 130, 246, 0.3)"},
                    {"offset": 1,"color": "rgba(59, 130, 246, 0.1)"}
                ])
            }
        }]
    }

    chart.setOption(option)
}

function localdateymd(datevalue){
    let y=datevalue.getFullYear()
    let m=String(datevalue.getMonth()+1).padStart(2,"0")
    let d=String(datevalue.getDate()).padStart(2,"0")
    return y+"-"+m+"-"+d
}

function setdefaultdates(){
    let today=new Date()
    let thirtydaysago=new Date(today.getTime()-30*24*60*60*1000)
    value("#enddate",localdateymd(today))
    value("#startdate",localdateymd(thirtydaysago))
}

applybenefitlanguage()
setdefaultdates()

/* ── 場次資料載入（TASK-013 修正沉默截斷）─────────────────────────────────
   原本固定抓 getsessionlist?limit=1000 一次就算了。場次超過 1000 的使用者
   會少算，而且畫面上沒有任何提示——趨勢圖少幾天還算直覺，但「依協會分組」
   的數字看起來就是一個總和，使用者會直接當成全部歷史。

   後端回傳的 pagination.total 是真實總數，所以這裡不用猜「是不是被截斷了」，
   可以直接比對並把剩下的頁補抓回來。

   PAGELIMIT 是安全上限：真的有極端多場次的帳號時，不要無止盡地送請求。
   停在上限時會明確顯示「只計入前 N 筆」，而不是沉默地少算。
   ──────────────────────────────────────────────────────────────────────── */

const SESSIONPAGESIZE=1000
const SESSIONMAXPAGE=10

function showincompletehint(loaded,total){
    let box=domgetid("benefitresultdesc")
    if(!box){
        return
    }
    if(loaded>=total){
        return
    }
    // 沒有全部載入時一定要講清楚，不可以讓使用者以為看到的是全部歷史
    let text=benefittext("incompletedata").replace("{loaded}",loaded).replace("{total}",total)
    let hint=document.createElement("div")
    hint.className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300"
    hint.textContent=text
    box.appendChild(hint)
}

function loadsessionpage(page,collected){
    ajax("GET",AJAXURL+"getsessionlist?limit="+SESSIONPAGESIZE+"&page="+page,function(event,data){
        if(!data["success"]){
            if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
                pthandleauthfailure(data["data"],{
                    "toasted": false
                })
                return
            }
            if(typeof pttoasterror=="function"){
                pttoasterror(benefittext("networkerror"))
            }
            return
        }
        let list=data["data"]["sessions"]||data["data"]||[]
        let i=0
        for(i=0;i<list.length;i=i+1){
            collected.push(list[i])
        }
        let pagination=data["data"]["pagination"]||{}
        let total=parseInt(pagination["total"],10)||collected.length
        let totalpages=parseInt(pagination["totalpages"],10)||1
        // 還有下一頁、而且沒撞到安全上限時就繼續補抓
        if(page<totalpages&&page<SESSIONMAXPAGE){
            loadsessionpage(page+1,collected)
            return
        }
        allsessiondata=collected
        renderchart()
        renderclubchart()
        showincompletehint(collected.length,total)
    },null,[
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ],{
        "loadingtarget": "#chartwrap"
    })
}

loadsessionpage(1,[])

onclick("#search",function(){
    renderchart()
    renderclubchart()
})

onclick("#reset",function(){
    setdefaultdates()
    renderchart()
    renderclubchart()
})

onenterclick("#startdate,#enddate",function(){
    renderchart()
    renderclubchart()
})

// 協會表表頭排序：重畫時 renderclubchart 會重新算 grouplist，排序在 renderclubtable 內套用
ptbindsort("#clubtablehead",clubsortstate,function(){
    renderclubchart()
})
