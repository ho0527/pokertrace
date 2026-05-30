if(!weblsget(WEBLSNAME+"signin")){
    href("signin.html")
}

let allSessionData=[]
let chart=null

function benefittext(key){
    return TRANSLATE[LANGUAGE]["benefit"][key]
}

function applybenefitlanguage(){
    document.title=benefittext("title")
    innertext("h1",benefittext("title"),false)
    let labels=document.querySelectorAll("label")
    if(0<labels.length){
        labels[0].textContent=benefittext("startdate")
    }
    if(1<labels.length){
        labels[1].textContent=benefittext("enddate")
    }
    innertext("#search",benefittext("search"),false)
    innertext("#reset",benefittext("reset"),false)
}

applybenefitlanguage()

// 計算時間差（分鐘）
function calculateduration(starttime,endtime){
    let start=new Date(starttime)
    let end=new Date(endtime)
    let diff=end-start
    return Math.floor(diff/(1000*60)) // 轉換為分鐘
}

// 格式化時長顯示
function formatduration(minutes){
    if(minutes<60){
        return `${minutes} ${benefittext("minute")}`
    }else{
        return `${Math.floor(minutes/60)} ${benefittext("hour")} ${minutes%60} ${benefittext("minute")}`
    }
}

// 根據日期範圍重新繪製圖表
function renderChart(){
    let startdate=getvalue("#startdate")
    let enddate=getvalue("#enddate")

    // 第一步：用全部資料算出每日盈虧（同一天的 session 合併累加，不重複新增）
    let allDailyProfit={}
    let allSortedDates=[]

    function sessionshowmoney(row){
        return row["isstaff"]!=true&&((row["isown"]==false&&row["owned"]==true)||(row["isown"]==true&&row["owned"]==false))&&((row["isown"]==false&&row["myregistrationstatus"]=="confirmed")||row["owned"]==false)
    }

    function sessionprofit(row){
        if(row["isstaff"]==true){
            return null
        }
        if(row["owned"]==true){
            if(row["isown"]==true){
                return null
            }
            if(row["myregistrationstatus"]=="confirmed"&&row["myregistration"]){
                return float(row["myregistration"]["profit"]||0)
            }
            return null
        }
        if(row["isown"]==true){
            return float(row["winprice"]||0)-((float(row["buyin"]||0)+float(row["buyinfee"]||0))+((float(row["rebuybuyin"]||0)+float(row["rebuyfee"]||0))*float(row["rebuycount"]||0)))
        }
        return null
    }

    for(let i=0;i<allSessionData.length;i=i+1){
        let session=allSessionData[i]
        let date=session["starttime"].split("T")[0]
        let profit=sessionprofit(session)

        if(profit!==null&&sessionshowmoney(session)){
            if(allDailyProfit[date]==undefined){
                allDailyProfit[date]=0
                allSortedDates.push(date)
            }
            allDailyProfit[date]+=profit
        }
    }

    allSortedDates.sort()

    // 第二步：對全部日期計算累計值（從最一開始到最後）
    let allCumulative={}
    let cum=0
    for(let i=0;i<allSortedDates.length;i=i+1){
        let date=allSortedDates[i]
        cum+=allDailyProfit[date]
        allCumulative[date]=cum
    }

    // 第三步：篩選要顯示的日期範圍
    let sortedDates=allSortedDates.filter(function(date){
        let passStart=startdate==="" || date>=startdate
        let passEnd=enddate==="" || date<=enddate
        return passStart && passEnd
    })

    // 每日盈虧只取篩選範圍內的（tooltip 用）
    let dailyProfit={}
    for(let i=0;i<sortedDates.length;i=i+1){
        dailyProfit[sortedDates[i]]=allDailyProfit[sortedDates[i]]||0
    }

    // 直接使用全資料算出的累計值，原點自然反映歷史總金額
    let cumulativeValues=[]
    for(let i=0;i<sortedDates.length;i=i+1){
        cumulativeValues.push(allCumulative[sortedDates[i]])
    }

    // 初始化圖表
    if(!chart){
        chart=echarts.init(document.getElementById("chart"))
    }

    let option={
        backgroundColor: "#18181b",
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            textStyle: {
                color: "#fff"
            },
            formatter: function(params){
                if(params.length === 0) return ""
                let date=params[0].name
                let value=params[0].value
                let dailyValue=dailyProfit[date] || 0
                return `${date}<br>${benefittext("dailyprofit")}: ${dailyValue}<br>${benefittext("cumulativeprofit")}: ${value}`
            }
        },
        grid: {
            left: "10%",
            right: "10%",
            top: "10%",
            bottom: "10%",
            containLabel: true
        },
        xAxis: {
            type: "category",
            data: sortedDates,
            name: benefittext("date"),
            nameLocation: "middle",
            nameGap: 30,
            nameTextStyle: {
                color: "#999"
            },
            axisLine: {
                lineStyle: {
                    color: "#555"
                }
            },
            axisLabel: {
                color: "#bbb"
            }
        },
        yAxis: {
            type: "value",
            name: benefittext("amount"),
            nameLocation: "middle",
            nameGap: 50,
            nameTextStyle: {
                color: "#999"
            },
            axisLine: {
                lineStyle: {
                    color: "#555"
                }
            },
            axisLabel: {
                color: "#bbb"
            },
            splitLine: {
                lineStyle: {
                    color: "#444"
                }
            }
        },
        series: [
            {
                type: "line",
                data: cumulativeValues,
                showSymbol: true,
                smooth: true,
                itemStyle: {
                    color: function(params){
                        let dailyValue=dailyProfit[sortedDates[params.dataIndex]] || 0
                        return dailyValue >= 0 ? "#10b981" : "#ef4444" // 綠色盈利，紅色虧損
                    },
                    borderColor: "#fff",
                    borderWidth: 2
                },
                lineStyle: {
                    color: "#3b82f6",
                    width: 2
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
                        { offset: 1, color: "rgba(59, 130, 246, 0.1)" }
                    ])
                }
            }
        ]
    }

    chart.setOption(option)
}

// 獲取所有session資料
ajax("GET",AJAXURL+"getsessionlist?limit=1000",function(event,data){
    if(data["success"]){
        allSessionData=(data["data"]["sessions"]||data["data"]||[])

        let today = new Date()
        let thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

        value("#enddate", today.toISOString().split("T")[0])
        value("#startdate", thirtyDaysAgo.toISOString().split("T")[0])

        // 初始繪製
        renderChart()
    }else{
        pttoast(benefittext("networkerror"),"error")
    }
},null,[
    ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
])

// 綁定查詢按鈕
onclick("#search", function(){
    renderChart()
})

// 綁定重置按鈕
onclick("#reset", function(){
	let today = new Date()
	let thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

	value("#enddate", today.toISOString().split("T")[0])
	value("#startdate", thirtyDaysAgo.toISOString().split("T")[0])

    renderChart()
})

// 監聽Enter鍵
onenterclick("#startdate,#enddate", function(){
    renderChart()
})
