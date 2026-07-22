if(!weblsget(WEBLSNAME+"signin")){
    href("signin.html")
}

let allsessiondata=[]
let chart=null

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

ajax("GET",AJAXURL+"getsessionlist?limit=1000",function(event,data){
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
    allsessiondata=data["data"]["sessions"]||data["data"]||[]
    renderchart()
},null,[
    ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
],{
    "loadingtarget": "#chartwrap"
})

onclick("#search",function(){
    renderchart()
})

onclick("#reset",function(){
    setdefaultdates()
    renderchart()
})

onenterclick("#startdate,#enddate",function(){
    renderchart()
})
