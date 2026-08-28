const TOOLITEMLIST=[
    {href:"tool/equity.html",category:"featured strategy",ztitle:"勝率解算器",etitle:"Equity Solver",zdesc:"德州 / 奧馬哈 手牌勝率與 outs",edesc:"Hold'em / Omaha equity and outs"},
    {href:"tool/potodds.html",category:"featured strategy",ztitle:"底池賠率",etitle:"Pot Odds",zdesc:"底池賠率與所需勝率",edesc:"Pot odds and required equity"},
    {href:"tool/icm.html",category:"featured payout",ztitle:"ICM / 拆彩金",etitle:"ICM / Chop",zdesc:"ICM 期望值與 chip-chop",edesc:"ICM value and chip chop"},
    {href:"tool/structuregen.html",category:"featured live",ztitle:"結構產生器",etitle:"Structure Generator",zdesc:"即時盲注結構與匯出 JSON",edesc:"Build blind structures and export JSON"},
    {href:"tool/seatdraw.html",category:"featured live",ztitle:"座位抽籤",etitle:"Seat Draw",zdesc:"隨機分配桌號與座位",edesc:"Random table and seat assignment"},
    {href:"tool/cashreconcile.html",category:"featured operation",ztitle:"現場收款對帳",etitle:"Cash Reconcile",zdesc:"應收 vs 實收差額",edesc:"Expected vs collected cash"},
    {href:"tool/tdarules.html",category:"featured learn live",ztitle:"TDA規則手冊",etitle:"TDA Rulebook",zdesc:"2024 TDA 撲克賽事規則 PDF 預覽",edesc:"2024 TDA tournament rules PDF viewer"},
    {href:"tool/handbook.html",category:"featured learn live",ztitle:"撲克玩法手冊",etitle:"Poker Handbook",zdesc:"德州、奧馬哈、Draw、Stud 玩法速查",edesc:"Hold'em, Omaha, Draw, and Stud game guide"},
    {href:"tool/timebankdrill.html",category:"strategy",ztitle:"Timebank 計時器",etitle:"Timebank Drill",zdesc:"多情境時間、點一下開始/暫停",edesc:"Practice decision timing"},
    {href:"tool/stackcalc.html",category:"chip strategy",ztitle:"計分牌量換算",etitle:"Stack Calculator",zdesc:"BB 數與 M 值",edesc:"BB count and M value"},
    {href:"tool/sidepot.html",category:"live strategy",ztitle:"邊池計算",etitle:"Side Pot",zdesc:"多人 all-in 主池與邊池分配",edesc:"Main and side pot calculation"},
    {href:"tool/hostcost.html",category:"operation payout",ztitle:"主辦財務試算",etitle:"Host Cost",zdesc:"成本、獎池、保底與盈虧",edesc:"Cost, prize pool, guarantee and profit"},
    {href:"tool/betsize.html",category:"strategy",ztitle:"下注大小",etitle:"Bet Size",zdesc:"各種 pot 比例與對手所需勝率",edesc:"Pot fractions and opponent required equity"},
    {href:"tool/splitpot.html",category:"live",ztitle:"平分彩池",etitle:"Split Pot",zdesc:"平分彩池與 odd chips 分配",edesc:"Split pot and odd chip handling"},
    {href:"tool/rake.html",category:"operation",ztitle:"抽水計算",etitle:"Rake Calculator",zdesc:"現金桌抽水、cap 與實拿",edesc:"Cash-game rake, cap, and net amount"},
    {href:"tool/preflop.html",category:"strategy",ztitle:"Preflop 決策卡",etitle:"Preflop Card",zdesc:"開牌範圍、加注尺寸、push/fold",edesc:"Open range, sizing, and push/fold"},
    {href:"tool/range.html",category:"strategy",ztitle:"建議範圍參考",etitle:"Suggested Range Reference",zdesc:"翻前起手牌矩陣、建議出手範圍（push/fold、開池、對戰樹）+ 翻牌 GTO 求解器",edesc:"Preflop starting-hand matrix/ranges + flop GTO solver"},
    {href:"tool/chipsetup.html",category:"chip live",ztitle:"起始計分牌配置",etitle:"Starting Chip Setup",zdesc:"依面額建議每人計分牌顆數",edesc:"Recommended chip counts by denomination"},
    {href:"tool/duration.html",category:"live",ztitle:"賽事時長估算",etitle:"Duration Estimate",zdesc:"估算總時長與級數",edesc:"Estimate total time and levels"},
    {href:"tool/avgstack.html",category:"chip live",ztitle:"平均計分牌",etitle:"Average Stack",zdesc:"平均計分牌與平均 BB",edesc:"Average stack and average BB"},
    {href:"tool/chiprace.html",category:"chip live",ztitle:"Chip Race",etitle:"Chip Race",zdesc:"移除小面額換計分牌與餘值",edesc:"Race off small chips"},
    {href:"tool/colorup.html",category:"chip live",ztitle:"計分牌換色",etitle:"Color Up",zdesc:"把金額拆成計分牌顆數",edesc:"Convert values into chip counts"},
    {href:"tool/buyinsplit.html",category:"operation payout",ztitle:"報名費拆分",etitle:"Buy-in Split",zdesc:"獎池 / 手續費 / bounty 拆分",edesc:"Split prize pool, fee, and bounty"},
    {href:"tool/latereg.html",category:"live",ztitle:"Late Reg 截止",etitle:"Late Reg Cutoff",zdesc:"算出報名截止時刻",edesc:"Calculate registration cutoff"},
    {href:"tool/breaksched.html",category:"live",ztitle:"Break 排程",etitle:"Break Schedule",zdesc:"各次休息的時刻表",edesc:"Break timeline"},
    {href:"tool/playerstats.html",category:"operation",ztitle:"選手成績",etitle:"Player Stats",zdesc:"ROI、ITM 率與淨利",edesc:"ROI, ITM, and net profit"},
    {href:"tool/mincash.html",category:"payout",ztitle:"Min Cash 倍率",etitle:"Min Cash Multiple",zdesc:"買入倍率與損益兩平 ITM",edesc:"Buy-in multiple and break-even ITM"},
    {href:"tool/bounty.html",category:"payout strategy",ztitle:"Bounty 價值",etitle:"Bounty Value",zdesc:"一般 / PKO 賞金入袋估算",edesc:"Regular and PKO bounty value"},
    {href:"tool/spr.html",category:"strategy",ztitle:"SPR 計算器",etitle:"SPR Calculator",zdesc:"底池計分牌比與承諾度",edesc:"Stack-to-pot ratio"},
    {href:"tool/evenchop.html",category:"payout",ztitle:"Even Chop",etitle:"Even Chop",zdesc:"剩餘獎金平均拆分",edesc:"Even prize chop"},
    {href:"tool/tablefee.html",category:"operation",ztitle:"桌費 / 時租",etitle:"Table Fee",zdesc:"桌數時租總成本與分攤",edesc:"Table rental cost and share"},
    {href:"tool/staffpay.html",category:"operation",ztitle:"工作人員薪資",etitle:"Staff Pay",zdesc:"時薪、獎金、交通試算",edesc:"Hourly pay, bonus, and travel"},
    {href:"tool/bluff.html",category:"strategy",ztitle:"Bluff 平衡頻率",etitle:"Bluff Frequency",zdesc:"下注大小對應詐唬比例",edesc:"Bluff ratio by bet size"},
    {href:"tool/matchup.html",category:"strategy",ztitle:"全下對戰勝率表",etitle:"All-in Matchup",zdesc:"常見 preflop 對戰參考",edesc:"Common preflop all-in matchups"},
    {href:"tool/glossary.html",category:"learn",ztitle:"中英術語對照",etitle:"Glossary",zdesc:"可搜尋的撲克術語表",edesc:"Searchable poker glossary"},
    {href:"tool/rules.html",category:"learn live",ztitle:"規則速查",etitle:"Rules Quick Check",zdesc:"常見賽事規則重點",edesc:"Common tournament rule notes"},
    {href:"tool/handranking.html",category:"learn",ztitle:"牌型排名",etitle:"Hand Ranking",zdesc:"10 種牌型大小排序",edesc:"Poker hand ranking"},
    {href:"tool/positions.html",category:"learn strategy",ztitle:"位置參考",etitle:"Positions",zdesc:"9 人桌位置與打法",edesc:"9-max positions and notes"},
    {href:"tool/drawouts.html",category:"learn strategy",ztitle:"聽牌補牌表",etitle:"Draw Outs",zdesc:"常見聽牌 outs 與成牌率",edesc:"Common draw outs and odds"},
    {href:"tool/regprogress.html",category:"operation live",ztitle:"報名 / 獎池進度",etitle:"Registration Progress",zdesc:"進度條與距保底差額",edesc:"Progress and guarantee gap"},
    {href:"tool/depthstrategy.html",category:"strategy",ztitle:"計分牌深度策略",etitle:"Depth Strategy",zdesc:"依 BB 數給打法建議",edesc:"Strategy note by BB depth"},
    {href:"tool/preflopodds.html",category:"learn strategy",ztitle:"起手牌機率",etitle:"Preflop Odds",zdesc:"常見起手與翻牌機率",edesc:"Starting hand and flop odds"},
    {href:"tool/oddsconv.html",category:"strategy",ztitle:"賠率換算",etitle:"Odds Converter",zdesc:"勝率、對賭與隱含勝率",edesc:"Equity, odds, and implied equity"},
    {href:"tool/chipcolor.html",category:"chip",ztitle:"計分牌顏色表",etitle:"Chip Color",zdesc:"常見計分牌顏色與面額",edesc:"Common chip colors and values"},
    {href:"tool/handsest.html",category:"operation",ztitle:"每小時手數估算",etitle:"Hands Estimate",zdesc:"桌數、dealer 與每小時手數",edesc:"Hands per hour estimate"},
    {href:"tool/effstack.html",category:"chip strategy",ztitle:"有效計分牌",etitle:"Effective Stack",zdesc:"雙方較小計分牌與 BB 數",edesc:"Effective stack in BB"},
    {href:"tool/bankroll.html",category:"operation strategy",ztitle:"Bankroll 建議",etitle:"Bankroll",zdesc:"依賽制建議買入數",edesc:"Buy-in guidance by format"},
    {href:"tool/tipshare.html",category:"operation",ztitle:"小費分配",etitle:"Tip Share",zdesc:"floor 抽成與計分員分配",edesc:"Tip split for staff"},
    {href:"tool/levelclock.html",category:"live",ztitle:"級數時刻表",etitle:"Level Clock",zdesc:"每級與休息的時刻",edesc:"Level and break timeline"},
    {href:"tool/chipcount.html",category:"chip live",ztitle:"點碼計算",etitle:"Chip Count",zdesc:"各面額顆數即時加總",edesc:"Add chip counts by value"},
    {href:"tool/cbet.html",category:"strategy",ztitle:"C-bet 參考卡",etitle:"C-bet Card",zdesc:"依牌面頻率與尺寸",edesc:"C-bet sizing by board texture"},
    {href:"tool/blinddefense.html",category:"strategy",ztitle:"大盲防守參考",etitle:"Blind Defense",zdesc:"面對各位置 open 的防守",edesc:"Blind defense by opener"},
    {href:"tool/checklist.html",category:"operation live",ztitle:"主辦 Checklist",etitle:"Host Checklist",zdesc:"賽前 / 賽中 / 收場勾選",edesc:"Before, during, and close checklist"},
    {href:"tool/namegen.html",category:"operation",ztitle:"賽事命名建議",etitle:"Name Generator",zdesc:"模板組合命名靈感",edesc:"Tournament name ideas"},
    {href:"tool/winrate.html",category:"operation strategy",ztitle:"現金桌時薪估算",etitle:"Winrate Estimate",zdesc:"bb/100 換算期望時薪",edesc:"Convert bb/100 to hourly"},
    {href:"tool/addonev.html",category:"payout strategy",ztitle:"Add-on 划算嗎",etitle:"Add-on EV",zdesc:"每計分牌成本比較",edesc:"Compare chip cost"},
    {href:"tool/countdown.html",category:"live",ztitle:"倒數計時器",etitle:"Countdown",zdesc:"倒數到指定時刻",edesc:"Countdown to a target time"},
    {href:"tool/staffing.html",category:"operation live",ztitle:"現場人力配置",etitle:"Staffing",zdesc:"桌數 / dealer / floor / 助理",edesc:"Dealer, floor, and assistant needs"},
    {href:"tool/preflopsize.html",category:"strategy",ztitle:"翻牌前加注尺寸",etitle:"Preflop Size",zdesc:"open / 3bet / 4bet 尺寸卡",edesc:"Open, 3bet, and 4bet sizing"},
    {href:"tool/winprob.html",category:"payout strategy",ztitle:"計分牌奪冠機率",etitle:"Win Probability",zdesc:"依計分牌占比簡易估算",edesc:"Simple stack-share win estimate"},
    {href:"tool/bbante.html",category:"live",ztitle:"BB Ante 換算",etitle:"BB Ante",zdesc:"傳統前注與 BB ante 對齊",edesc:"Convert ante formats"},
    {href:"tool/bustrate.html",category:"operation live",ztitle:"淘汰速率估算",etitle:"Bust Rate",zdesc:"淘汰速率與 FT 預估",edesc:"Bust pace and final table estimate"},
    {href:"tool/roitarget.html",category:"operation",ztitle:"ROI 目標反推",etitle:"ROI Target",zdesc:"每場需回收金額",edesc:"Required return per event"},
    {href:"tool/tablebalance.html",category:"live",ztitle:"桌位平衡建議",etitle:"Table Balance",zdesc:"各桌人數平衡提示",edesc:"Table balancing suggestion"},
    {href:"tool/investtracker.html",category:"operation",ztitle:"選手投入追蹤",etitle:"Investment Tracker",zdesc:"單場投入與淨利",edesc:"Single-event investment and net"},
    {href:"tool/structurecheck.html",category:"live",ztitle:"結構快慢檢查",etitle:"Structure Check",zdesc:"每小時盲注成長評估",edesc:"Blind growth speed check"},
    {href:"tool/breakeven.html",category:"operation",ztitle:"主辦損益平衡",etitle:"Break Even",zdesc:"回本所需報名人數",edesc:"Entries needed to break even"},
    {href:"tool/satellite.html",category:"payout",ztitle:"衛星賽席位換算",etitle:"Satellite Seats",zdesc:"獎池換算晉級席位數",edesc:"Convert prize pool to seats"},
    {href:"tool/impliedodds.html",category:"strategy",ztitle:"隱含賠率",etitle:"Implied Odds",zdesc:"含後續可贏的所需勝率",edesc:"Required equity with future win"},
    {href:"tool/stakingmarkup.html",category:"operation payout",ztitle:"賣股 / Markup",etitle:"Staking Markup",zdesc:"賣股成本與鎖定利潤",edesc:"Markup and locked profit"},
    {href:"tool/chipinventory.html",category:"chip operation",ztitle:"全場計分牌需求",etitle:"Chip Inventory",zdesc:"各面額全場備量",edesc:"Venue-wide chip inventory"},
    {href:"tool/bountypool.html",category:"payout",ztitle:"賞金池估算",etitle:"Bounty Pool",zdesc:"總賞金池與 PKO 頭上",edesc:"Total bounty pool and PKO head value"},
    {href:"tool/blindcatchup.html",category:"strategy live",ztitle:"盲注追上估算",etitle:"Blind Catchup",zdesc:"幾級後進入短碼",edesc:"When a stack becomes short"},
    {href:"tool/threebetrange.html",category:"strategy",ztitle:"3-bet / 4-bet 範圍卡",etitle:"3-bet / 4-bet Range",zdesc:"價值與詐唬範圍參考",edesc:"Value and bluff range notes"},
    {href:"tool/riverbet.html",category:"strategy",ztitle:"河牌下注參考",etitle:"River Bet",zdesc:"價值 / 詐唬頻率與尺寸",edesc:"River value/bluff sizing notes"},
    {href:"tool/dealersop.html",category:"learn live",ztitle:"發牌流程速查",etitle:"Dealer SOP",zdesc:"發牌與錯誤處理重點",edesc:"Dealing and error handling notes"},
    {href:"tool/bubblepressure.html",category:"payout strategy",ztitle:"泡沫壓力指數",etitle:"Bubble Pressure",zdesc:"接近獎圈的 ICM 壓力提示",edesc:"ICM pressure near the money"},
    {href:"tool/refund.html",category:"operation",ztitle:"退賽退費試算",etitle:"Refund",zdesc:"依政策算可退金額",edesc:"Refund amount by policy"},
    {href:"tool/regpace.html",category:"operation live",ztitle:"報名進度配速",etitle:"Registration Pace",zdesc:"達標所需報名配速",edesc:"Entry pace needed for target"},
    {href:"tool/waitlist.html",category:"operation live",ztitle:"候補等待估算",etitle:"Waitlist",zdesc:"候補等待與消化時間",edesc:"Waitlist time estimate"},
    {href:"tool/kpi.html",category:"operation",ztitle:"賽事 KPI 摘要",etitle:"KPI Summary",zdesc:"抽水率、淨利率等指標",edesc:"Rake rate, margin, and metrics"},
    {href:"tool/potbuilder.html",category:"strategy",ztitle:"底池成長試算",etitle:"Pot Builder",zdesc:"多街下注後的底池",edesc:"Pot growth across streets"},
    {href:"tool/chipaudit.html",category:"chip operation",ztitle:"計分牌總量稽核",etitle:"Chip Audit",zdesc:"應有 vs 清點差異",edesc:"Expected vs counted chip total"},
    {href:"tool/partnersplit.html",category:"operation payout",ztitle:"收益夥伴分配",etitle:"Partner Split",zdesc:"依比例分配收益",edesc:"Split profit by share"},
    {href:"tool/payouttable.html",category:"payout",ztitle:"獎金分配表",etitle:"Payout Table",zdesc:"總獎池到各名次獎金",edesc:"Prize pool to place payouts"},
    {href:"tool/apidoc.html",category:"develop",ztitle:"公開 API 文件",etitle:"Public API Doc",zdesc:"小工具的公開 API 說明",edesc:"Public API reference for tools"}
]

// 個人資料「宣傳小工具」預設收藏（依序）：使用者尚未收藏任何工具時，顯示這六個；
// 之後依使用者收藏排序取前六名，不足六個再用此清單補滿。
const PTTOOLPROMODEFAULT=[
    "tool/equity.html",
    "tool/potodds.html",
    "tool/tdarules.html",
    "tool/structuregen.html",
    "tool/range.html",
    "tool/apidoc.html"
]

const PTTOOLPROMOMAX=6
// 維護完成後，把對應的 tool 路徑加到這裡，就不再顯示維護中。
const TOOLMAINTENANCEOFFLIST=[
    "tool/tdarules.html",
    "tool/equity.html",
    "tool/structuregen.html",
    "tool/apidoc.html",
    "tool/range.html",
    "tool/stackcalc.html",
    "tool/handbook.html"
]

function pttoolfindbyhref(href){
    for(let i=0;i<TOOLITEMLIST.length;i=i+1){
        if(TOOLITEMLIST[i].href==href){
            return TOOLITEMLIST[i]
        }
    }
    return null
}

function pttoolitemmaintenanced(item){
    if(!item||!item.href){
        return false
    }
    if(item.href.indexOf("tool/")!=0){
        return false
    }
    if(TOOLMAINTENANCEOFFLIST.indexOf(item.href)>=0){
        return false
    }
    return true
}

// 正式區（pokertrace.net）不顯示還沒通過驗收的維護中工具；測試機 / 本機 / IP 仍顯示全部，方便繼續測試。
const PTTOOLPRODUCTIONHOSTLIST=[
    "pokertrace.net",
    "www.pokertrace.net"
]

function pttoolproductioned(){
    if(typeof location=="undefined"||!location.hostname){
        return false
    }
    let host=String(location.hostname).toLowerCase()
    if(PTTOOLPRODUCTIONHOSTLIST.indexOf(host)>=0){
        return true
    }
    return false
}

// item 可傳工具物件或 href 字串；正式區的維護中工具回 false（整個隱藏，不只是標示）。
function pttoolitemvisible(item){
    if(typeof item=="string"){
        item=pttoolfindbyhref(item)
    }
    if(!item){
        return false
    }
    if(pttoolproductioned()&&pttoolitemmaintenanced(item)){
        return false
    }
    return true
}

function pttoolvisiblelist(){
    let list=[]
    for(let i=0;i<TOOLITEMLIST.length;i=i+1){
        if(pttoolitemvisible(TOOLITEMLIST[i])){
            list.push(TOOLITEMLIST[i])
        }
    }
    return list
}

function pttoolitemtitle(item){
    if(!pttoolitemmaintenanced(item)){
        if(typeof LANGUAGE!="undefined"&&LANGUAGE=="en"){
            return item.etitle
        }
        return item.ztitle
    }
    if(typeof LANGUAGE!="undefined"&&LANGUAGE=="en"){
        return item.etitle+" (Maintenance)"
    }
    return item.ztitle+" (維護中)"
}

function pttoolitemdesc(item){
    if(typeof LANGUAGE!="undefined"&&LANGUAGE=="en"){
        return item.edesc
    }
    return item.zdesc
}

// 計算宣傳小工具區要顯示的工具清單（最多六個）：先取使用者收藏，再用預設清單補滿。
function pttoolpromodisplay(){
    let favs=[]
    if(typeof pttoolfavoritelist=="function"){
        favs=pttoolfavoritelist()
    }
    let out=[]
    for(let i=0;i<favs.length&&out.length<PTTOOLPROMOMAX;i=i+1){
        if(pttoolitemvisible(favs[i])&&out.indexOf(favs[i])<0){
            out.push(favs[i])
        }
    }
    for(let i=0;i<PTTOOLPROMODEFAULT.length&&out.length<PTTOOLPROMOMAX;i=i+1){
        if(pttoolitemvisible(PTTOOLPROMODEFAULT[i])&&out.indexOf(PTTOOLPROMODEFAULT[i])<0){
            out.push(PTTOOLPROMODEFAULT[i])
        }
    }
    return out
}
