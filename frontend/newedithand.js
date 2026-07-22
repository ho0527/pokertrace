let tableid=getget("tableid")
let handid=getget("handid")||""
let presetseat=int(getget("seatno")||0)
// 快速手牌紀錄：由專屬頁 quickhand.html（設定 window.QUICKMODE）或 ?quick=1 觸發。
let quickmode=getget("quick")=="1"||(typeof window!="undefined"&&window.QUICKMODE===true)
let quickstackunit="bb"
let confirmkey=""
let leaveguard=bindleaveguard()
let UNKNOWNCHIP=999999999999
let timebankloaded=false
let timebanksyncbusy=false
let timebankpollid=0
let timebankrenderid=0

let state={
    row: {},
    context: {},
    loadinged: true,
    step: 1,
    step2view: "hub",
    maxseat: 9,
    dealerseat: 1,
    selfseating: presetseat,
    smallblindseat: 0,
    bigblindseat: 0,
    seatinglist: [null],
    gametypes: [],
    blindstructures: [],
    chips: [],
    handgametype: "",
    blindlevel: "custom",
    smallblind: 0,
    bigblind: 0,
    ante: 0,
    emptybuttoned: false,
    deadsmallblinded: false,
    cachedblinded: false,
    handcard: {
        card1: "",
        card2: ""
    },
    boardcard: {
        flop: ["","",""],
        burnflop: "",
        turn: "",
        burnturn: "",
        burnriver: "",
        river: ""
    },
    bittingdata: {
        preflop: [],
        flop: [],
        turn: [],
        river: []
    },
    draws: {},
    showdowndata: {},
    winner: {},
    winnerprice: {},
    defaulttimebankseconds: 15,
    timebanksoundon: true,
    timebankconfigured: false,
    timebankalerted: false,
    timebank: {
        enabled: false,
        seatno: 0,
        durationseconds: 15,
        remainingseconds: 15,
        endtime: "",
        running: false,
        expired: false,
        startedby: 0,
        starttime: "",
        updatedtime: ""
    }
}

function unifiedpublicallowed(){
    return state.context&&state.context["unifiedhandrecord"]&&state.context["access"]&&state.context["access"]["canunifiedrecord"]
}

function publicrecorded(){
    return unifiedpublicallowed()&&num(state.selfseating)==0
}

// 目前手牌遊戲類型的底牌數 / 牌面（短牌只用 6-A）。沿用 handgame 註冊表，與 tool/equity 共用同一套定義。
function herogamecount(){
    return handgameholecount(state.handgametype)
}

function herogameranklist(){
    return handgameranklist(state.handgametype)
}

// 目前手牌的家族 / 街別（board 社區牌、stud 梭哈、draw 換牌）。街別改由 handgame 註冊表決定，
// 不再寫死 preflop/flop/turn/river，讓梭哈（3rd~7th）與換牌（predraw/drawN）共用同一套下注引擎。
function handfamily(){
    return handgamefamily(state.handgametype)
}

function handstreets(){
    return handgamestreets(state.handgametype)
}

function handstreetkeys(){
    let list=handstreets()
    let keys=[]
    for(let i=0;i<list.length;i=i+1){
        keys.push(list[i]["key"])
    }
    return keys
}

function handstreetdef(streetkey){
    let list=handstreets()
    for(let i=0;i<list.length;i=i+1){
        if(list[i]["key"]==streetkey){
            return list[i]
        }
    }
    return null
}

function handstreetname(streetkey){
    let def=handstreetdef(streetkey)
    return def?def["name"]:String(streetkey||"")
}

function firststreet(){
    let keys=handstreetkeys()
    return keys.length?keys[0]:"preflop"
}

function islaststreet(streetkey){
    let keys=handstreetkeys()
    return keys.length>0&&keys[keys.length-1]==streetkey
}

// 依家族補齊 state.bittingdata 的街別 key（缺的補空陣列）。切換遊戲類型後呼叫，
// 舊家族殘留的 key 保留不刪（避免誤丟已輸入動作），實際迭代一律以 handstreetkeys() 為準。
function ensurebittingstreets(){
    let keys=handstreetkeys()
    for(let i=0;i<keys.length;i=i+1){
        if(!state.bittingdata[keys[i]]){
            state.bittingdata[keys[i]]=[]
        }
    }
    let cur=val("actionstreet")
    if(cur&&keys.indexOf(cur)<0&&dom("actionstreet")){
        dom("actionstreet").value=firststreet()
    }
}

// 是否已有選手自行輸入的下注動作（排除系統預設盲注 / 前注）。切換遊戲家族前用來決定是否要確認清空。
function hasUserBettingActions(){
    for(let key in state.bittingdata){
        let list=state.bittingdata[key]||[]
        for(let i=0;i<list.length;i=i+1){
            if(!list[i]["isBlind"]){
                return true
            }
        }
    }
    return false
}

// 切換遊戲家族時重建街別：清掉舊街的下注 / 換牌資料，改用新家族的街別並重貼預設盲注 / 前注。
function resetStreetsForFamily(){
    let fresh={}
    let keys=handstreetkeys()
    for(let i=0;i<keys.length;i=i+1){
        fresh[keys[i]]=[]
    }
    state.bittingdata=fresh
    state.draws={}
    if(dom("actionstreet")){
        dom("actionstreet").value=firststreet()
    }
    rebuildDefaultBets()
}

function herocardlist(){
    return handcardobjtolist(state.handcard,herogamecount())
}

function setherocardlist(list){
    state.handcard=handcardlisttoobj(list,herogamecount())
}

function herofilled(){
    let list=herocardlist()
    if(!list.length){
        return false
    }
    for(let i=0;i<list.length;i=i+1){
        if(!list[i]){
            return false
        }
    }
    return true
}

function seatcardlist(seat){
    let count=herogamecount()
    if(num(seat)==num(state.selfseating)&&num(state.selfseating)>0){
        return herocardlist()
    }
    let data=state.showdowndata[seat]
    if(!data||data["mucked"]){
        return []
    }
    return handcardobjtolist(data,count)
}

function seatcardsfull(seat){
    let count=herogamecount()
    let list=seatcardlist(seat)
    if(list.length!=count){
        return false
    }
    for(let i=0;i<list.length;i=i+1){
        if(!list[i]){
            return false
        }
    }
    return true
}

function cardsjoinlabel(list){
    let parts=[]
    for(let i=0;i<list.length;i=i+1){
        parts.push(list[i]||"?")
    }
    return parts.join(" ")
}

// 切換遊戲類型時，把已選底牌重新套到新類型的張數 / 牌面（移除不合法的牌），與 tool/equity 的處理一致。
function normalizehandcardsforgame(){
    let count=herogamecount()
    let ranks=herogameranklist()
    function fit(obj){
        let list=handcardspresent(obj).filter(function(card){
            return ranks.indexOf(String(card).slice(0,1).toUpperCase())>=0
        })
        let extra={}
        for(let key in obj){
            if(String(key).indexOf("card")!=0){
                extra[key]=obj[key]
            }
        }
        let fixed=handcardlisttoobj(list,count,extra)
        let filled=true
        for(let i=1;i<=count;i=i+1){
            if(!fixed["card"+i]){
                filled=false
            }
        }
        if("shown" in extra){
            fixed["shown"]=filled&&extra["mucked"]!=true
        }
        return fixed
    }
    state.handcard=fit(state.handcard)
    for(let seat in state.showdowndata){
        if(state.showdowndata[seat]&&!state.showdowndata[seat]["mucked"]){
            state.showdowndata[seat]=fit(state.showdowndata[seat])
        }
    }
}

if(!weblsget(WEBLSNAME+"signin")){
    href("signin.html")
}

function ensurenavigationbar(){
    let nav=dom("navigationbar")
    if(!nav){
        return
    }
    if(nav.innerHTML.trim()){
        return
    }
    nav.innerHTML=`
        <nav class="newhand-fallbacknav">
            <a href="main.html" class="newhand-navbrand"><img src="../material/icon/logo.png" alt="PokerTrace" draggable="false"></a>
            <div class="newhand-navlinks">
                <a href="main.html">首頁</a>
                <a href="profile.html">個人資料</a>
                <a href="clublist.html">協會管理</a>
                <a href="sessionlist.html">場次列表</a>
                <a href="benefit.html">收益折線圖</a>
                <a href="contact.html">聯絡訊息</a>
            </div>
        </nav>
        <nav class="newhand-mobilebottom">
            <a href="main.html">首頁</a>
            <a href="clublist.html">協會</a>
            <a href="sessionlist.html">場次</a>
            <a href="benefit.html">收益</a>
            <a href="profile.html">個人</a>
        </nav>
    `
}

function num(value){
    let result=parseInt(value,10)
    if(isNaN(result)){
        return 0
    }
    return result
}

function txt(value){
    if(value==null||value==undefined){
        return ""
    }
    return String(value)
}

function money(value){
    return num(value).toLocaleString("en-US")
}

function raisedChipValues(){
    let raised={}
    let selectedindex=-1
    for(let i=0;i<state.blindstructures.length;i=i+1){
        if(String(state.blindstructures[i]["id"])==String(state.blindlevel)){
            selectedindex=i
        }
    }
    if(selectedindex<0&&state.context&&state.context["timerlevel"]){
        for(let i=0;i<state.blindstructures.length;i=i+1){
            if(String(state.blindstructures[i]["id"])==String(state.context["timerlevel"]["id"])){
                selectedindex=i
            }
        }
    }
    if(0<=selectedindex){
        for(let i=0;i<selectedindex;i=i+1){
            let values=state.blindstructures[i]["chipRaiseValues"]||state.blindstructures[i]["chipraisevalues"]||[]
            for(let j=0;j<values.length;j=j+1){
                if(0<num(values[j])){
                    raised[num(values[j])]=true
                }
            }
        }
    }
    return raised
}

function minchip(){
    let result=0
    let raised=raisedChipValues()
    for(let i=0;i<state.chips.length;i=i+1){
        let value=num(state.chips[i]["value"])
        if(0<value&&!raised[value]&&(result==0||value<result)){
            result=value
        }
    }
    if(result<=0){
        for(let i=0;i<state.chips.length;i=i+1){
            let value=num(state.chips[i]["value"])
            if(0<value&&(result==0||value<result)){
                result=value
            }
        }
    }
    if(result<=0){
        result=1
    }
    return result
}

function roundchip(value){
    let unit=minchip()
    if(unit<=1){
        return num(value)
    }
    return Math.round(num(value)/unit)*unit
}

// 快速紀錄的 BB ⇄ 計分牌換算：以大盲回推計分牌（可輸入大約 BB 數或精確計分牌）。
function bbToChips(bb){
    return roundchip(num(bb)*num(state.bigblind))
}

function chipsToBb(chipvalue){
    if(num(state.bigblind)<=0){
        return 0
    }
    return Math.round(num(chipvalue)/num(state.bigblind)*10)/10
}

function dom(id){
    return domgetid(id)
}

function settext(id,value){
    if(dom(id)){
        dom(id).textContent=txt(value)
    }
}

function sethtml(id,value){
    if(dom(id)){
        dom(id).innerHTML=value
    }
}

function val(id){
    if(!dom(id)){
        return ""
    }
    return dom(id).value
}

function parsecloudtime(value){
    if(!value){
        return null
    }
    let text=String(value)
    if(text.indexOf("T")==-1&&text.indexOf(" ")!=-1){
        text=text.replace(" ","T")
    }
    if(text.indexOf("+")==-1&&text.indexOf("Z")==-1){
        text=text+"Z"
    }
    let time=Date.parse(text)
    if(isNaN(time)){
        return null
    }
    return time
}

function timebankdefaultseconds(){
    return Math.max(1,num(state.defaulttimebankseconds)||15)
}

function timebankcurrentseconds(){
    return timebankdefaultseconds()
}

function normaltimebankstate(data){
    let source=data||{}
    let duration=Math.max(1,num(source["durationseconds"])||timebankcurrentseconds())
    let remaining=num(source["remainingseconds"])
    if(remaining<=0&&source["expired"]!=true&&source["running"]!=true){
        remaining=duration
    }
    if(remaining<0){
        remaining=0
    }
    return {
        enabled: source["enabled"]==true,
        seatno: num(source["seatno"]),
        durationseconds: duration,
        remainingseconds: remaining,
        endtime: txt(source["endtime"]||""),
        running: source["running"]==true,
        expired: source["expired"]==true,
        startedby: num(source["startedby"]),
        starttime: txt(source["starttime"]||""),
        updatedtime: txt(source["updatedtime"]||"")
    }
}

function applytimebankstate(data){
    state.timebank=normaltimebankstate(data)
    if(!state.timebank.expired){
        state.timebankalerted=false
    }
}

function timebankseat(){
    return nextActionSeat(val("actionstreet")||firststreet())
}

function timebankremainingseconds(){
    let runtime=state.timebank||{}
    if(runtime["running"]&&runtime["endtime"]){
        let endtime=parsecloudtime(runtime["endtime"])
        if(endtime!=null){
            let left=Math.ceil((endtime-Date.now())/1000)
            if(left<0){
                left=0
            }
            return left
        }
    }
    return Math.max(0,num(runtime["remainingseconds"]))
}

function timebankusedseconds(){
    let runtime=state.timebank||{}
    let duration=Math.max(0,num(runtime["durationseconds"]))
    let used=duration-timebankremainingseconds()
    if(used<0){
        used=0
    }
    if(duration<used){
        used=duration
    }
    return used
}

function timebankstatuslabel(){
    if(state.timebank.expired){
        return "TIMEBANK EXPIRED"
    }
    if(state.timebank.running){
        return "RUNNING"
    }
    if(state.timebank.enabled){
        return "READY"
    }
    return "IDLE"
}

function timebankbeep(){
    if(state.timebanksoundon!=true){
        return
    }
    try{
        let ctx=new(window.AudioContext||window.webkitAudioContext)()
        let osc=ctx.createOscillator()
        let gain=ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type="square"
        osc.frequency.value=880
        gain.gain.setValueAtTime(0.001,ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.22,ctx.currentTime+0.02)
        gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.28)
        osc.start()
        osc.stop(ctx.currentTime+0.32)
    }catch(error){}
}

function setval(id,value){
    if(dom(id)){
        dom(id).value=txt(value)
    }
}

function tokenheaders(){
    return [
        ["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]
    ]
}

function api(method,url,body,callback){
    ajax(method,AJAXURL+url,function(event,data){
        callback(data)
    },body==null?null:str(body),tokenheaders())
}

const HANDCACHEVERSION="2"
let handsubmitting=false

function cachekey(key){
    // 快速手牌與一般新增手牌共用同一支 JS，但暫存草稿必須分開命名空間，
    // 否則同一桌的快速手牌草稿會覆蓋（或被覆蓋）一般手牌草稿。
    return WEBLSNAME+(quickmode?"quickhand_":"newedithand_")+tableid+"_"+key
}

function cacheget(key){
    return weblsget(cachekey(key))
}

function cacheset(key,value){
    weblsset(cachekey(key),value)
}

function cachedelete(key){
    weblsset(cachekey(key,null))
}

function clearcache(){
    let keys=["cacheversion","handstep","step2view","dealerseat","selfseating","heromanual","handcard","boardcard","bittingdata","draws","showdowndata","winner","winnerprice","winnerauto","handgametype","blindlevel","handsmallblind","handbigblind","handante","emptybutton","deadsmallblind"]
    for(let i=0;i<keys.length;i=i+1){
        cachedelete(keys[i])
        weblsset(WEBLSNAME+keys[i],null)
    }
}

function keepblindcache(){
    cacheset("handgametype",state.handgametype)
    cacheset("blindlevel",state.blindlevel)
    cacheset("handsmallblind",state.smallblind)
    cacheset("handbigblind",state.bigblind)
    cacheset("handante",state.ante)
}

function savecache(){
    cacheset("cacheversion",HANDCACHEVERSION)
    cacheset("handstep",state.step)
    cacheset("step2view",state.step2view)
    cacheset("dealerseat",state.dealerseat)
    cacheset("selfseating",state.selfseating)
    cacheset("handcard",str(state.handcard))
    cacheset("boardcard",str(state.boardcard))
    cacheset("bittingdata",str(state.bittingdata))
    cacheset("draws",str(state.draws||{}))
    cacheset("showdowndata",str(state.showdowndata))
    cacheset("winner",str(state.winner))
    cacheset("winnerprice",str(state.winnerprice))
    cacheset("winnerauto",str(state.winnerauto||{}))
    cacheset("handgametype",state.handgametype)
    cacheset("blindlevel",state.blindlevel)
    cacheset("handsmallblind",state.smallblind)
    cacheset("handbigblind",state.bigblind)
    cacheset("handante",state.ante)
    cacheset("emptybutton",state.emptybuttoned)
    cacheset("deadsmallblind",state.deadsmallblinded)
}

function loadcache(){
    if(cacheget("handstep")&&cacheget("cacheversion")!=HANDCACHEVERSION){
        clearcache()
        return
    }
    if(cacheget("handstep")){
        state.step=num(cacheget("handstep"))
        if(state.step<1||3<state.step){
            state.step=1
        }
    }
    if(cacheget("step2view")){
        state.step2view=cacheget("step2view")
    }
    if(cacheget("dealerseat")){
        state.dealerseat=num(cacheget("dealerseat"))
    }
    if(cacheget("selfseating")){
        state.selfseating=num(cacheget("selfseating"))
    }
    if(cacheget("handcard")){
        state.handcard=json(cacheget("handcard"))||state.handcard
    }
    if(cacheget("boardcard")){
        state.boardcard=json(cacheget("boardcard"))||state.boardcard
    }
    normalizeboardcard()
    if(cacheget("bittingdata")){
        state.bittingdata=json(cacheget("bittingdata"))||state.bittingdata
    }
    if(cacheget("draws")){
        state.draws=json(cacheget("draws"))||state.draws
    }
    if(cacheget("showdowndata")){
        state.showdowndata=json(cacheget("showdowndata"))||state.showdowndata
    }
    if(cacheget("winner")){
        state.winner=json(cacheget("winner"))||state.winner
    }
    if(cacheget("winnerprice")){
        state.winnerprice=json(cacheget("winnerprice"))||state.winnerprice
    }
    if(cacheget("winnerauto")){
        state.winnerauto=json(cacheget("winnerauto"))||{}
    }
    if(cacheget("handgametype")){
        state.handgametype=cacheget("handgametype")
    }
    if(cacheget("blindlevel")){
        state.blindlevel=cacheget("blindlevel")
        state.cachedblinded=true
    }
    if(cacheget("handsmallblind")){
        state.smallblind=num(cacheget("handsmallblind"))
        state.cachedblinded=true
    }
    if(cacheget("handbigblind")){
        state.bigblind=num(cacheget("handbigblind"))
        state.cachedblinded=true
    }
    if(cacheget("handante")){
        state.ante=num(cacheget("handante"))
        state.cachedblinded=true
    }
    state.emptybuttoned=cacheget("emptybutton")=="true"
    state.deadsmallblinded=cacheget("deadsmallblind")=="true"
}

function normalizeboardcard(){
    if(!state.boardcard){
        state.boardcard={}
    }
    if(!state.boardcard.flop||!state.boardcard.flop.length){
        state.boardcard.flop=["","",""]
    }
    if(state.boardcard.flop.length<3){
        for(let i=state.boardcard.flop.length;i<3;i=i+1){
            state.boardcard.flop.push("")
        }
    }
    state.boardcard.burnflop=state.boardcard.burnflop||""
    state.boardcard.turn=state.boardcard.turn||""
    state.boardcard.burnturn=state.boardcard.burnturn||""
    state.boardcard.river=state.boardcard.river||""
    state.boardcard.burnriver=state.boardcard.burnriver||""
}

function activeSeats(){
    let seats=[]
    for(let i=1;i<state.seatinglist.length;i=i+1){
        if(state.seatinglist[i]&&state.seatinglist[i]!=false&&(unknownchip(i)||0<num(state.seatinglist[i]["chip"]))){
            seats.push(i)
        }
    }
    return seats
}

function nextActiveSeat(startseat){
    let seats=activeSeats()
    if(!seats.length){
        return 0
    }
    for(let offset=1;offset<=state.maxseat;offset=offset+1){
        let seat=(startseat+offset-1)%state.maxseat+1
        for(let i=0;i<seats.length;i=i+1){
            if(seats[i]==seat){
                return seat
            }
        }
    }
    return seats[0]
}

function orderedFrom(startseat){
    let seats=[]
    for(let offset=0;offset<state.maxseat;offset=offset+1){
        let seat=(startseat+offset-1)%state.maxseat+1
        if(state.seatinglist[seat]&&state.seatinglist[seat]!=false&&(unknownchip(seat)||0<num(state.seatinglist[seat]["chip"]))){
            seats.push(seat)
        }
    }
    return seats
}

function unknownchip(seat){
    let item=state.seatinglist[seat]
    if(!item||item==false){
        return false
    }
    if(item["unknownchip"]==true||item["unknownchiped"]==true){
        return true
    }
    if(num(item["chip"])<0){
        return true
    }
    if(String(item["specialbutton"]||"").indexOf("UNKNOWN_CHIP")>=0){
        return true
    }
    return false
}

function chip(seat){
    if(!state.seatinglist[seat]||state.seatinglist[seat]==false){
        return 0
    }
    if(unknownchip(seat)){
        return UNKNOWNCHIP
    }
    return num(state.seatinglist[seat]["chip"])
}

function startchip(seat){
    if(!state.seatinglist[seat]||state.seatinglist[seat]==false){
        return 0
    }
    if(unknownchip(seat)){
        return -1
    }
    return num(state.seatinglist[seat]["chip"])
}

function positionnames(count){
    if(count<=2){
        return ["SB/BTN","BB"]
    }
    if(count==3){
        return ["SB","BB","BTN"]
    }
    if(count==4){
        return ["SB","BB","CO","BTN"]
    }
    if(count==5){
        return ["SB","BB","UTG","CO","BTN"]
    }
    if(count==6){
        return ["SB","BB","UTG","HJ","CO","BTN"]
    }
    if(count==7){
        return ["SB","BB","UTG","LJ","HJ","CO","BTN"]
    }
    if(count==8){
        return ["SB","BB","UTG","U+1","LJ","HJ","CO","BTN"]
    }
    if(count==9){
        return ["SB","BB","UTG","U+1","U+2","LJ","HJ","CO","BTN"]
    }
    if(count==10){
        return ["SB","BB","UTG","U+1","U+2","MP","LJ","HJ","CO","BTN"]
    }
    return ["SB","BB","UTG","U+1","U+2","MP","M+1","LJ","HJ","CO","BTN"]
}

function positionname(seat){
    let seatno=num(seat)
    let active=activeSeats()
    if(active.indexOf(seatno)<0){
        if(seatno==num(state.dealerseat)){
            return "BTN"
        }
        return ""
    }
    let start=state.smallblindseat||nextActiveSeat(state.dealerseat)
    if(active.length==2&&!state.emptybuttoned){
        start=state.dealerseat
    }
    if(state.deadsmallblinded){
        // 獨立大盲：沒有小盲，順序從 button 後第一個座位(大盲)算起，名稱去掉開頭的 SB
        start=state.bigblindseat||nextActiveSeat(state.dealerseat)
    }
    let order=orderedFrom(start)
    let names=state.deadsmallblinded?positionnames(order.length+1).slice(1):positionnames(order.length)
    for(let i=0;i<order.length;i=i+1){
        if(order[i]==seatno){
            return names[i]||""
        }
    }
    return ""
}

function seatlabel(seat){
    let seatno=num(seat)
    let position=positionname(seatno)
    if(position){
        return "Seat "+seatno+"("+position+")"
    }
    return "Seat "+seatno
}

function usedCards(ignorecards){
    let cards=[]
    let ignore=ignorecards||[]
    function add(card){
        if(!card){
            return
        }
        for(let i=0;i<ignore.length;i=i+1){
            if(ignore[i]==card){
                return
            }
        }
        cards.push(card)
    }
    let herolist=handcardspresent(state.handcard)
    for(let i=0;i<herolist.length;i=i+1){
        add(herolist[i])
    }
    for(let i=0;i<state.boardcard.flop.length;i=i+1){
        add(state.boardcard.flop[i])
    }
    add(state.boardcard.burnflop)
    add(state.boardcard.turn)
    add(state.boardcard.burnturn)
    add(state.boardcard.river)
    add(state.boardcard.burnriver)
    // board 家族只排除已 show 的牌；梭哈 / 換牌家族發牌 / 換牌途中已輸入的牌一律排除，避免重複發牌。
    let nonboard=handfamily()!="board"
    for(let seat in state.showdowndata){
        let sd=state.showdowndata[seat]
        if(sd&&(sd["shown"]||(nonboard&&!sd["mucked"]))){
            let seatlist=handcardspresent(sd)
            for(let i=0;i<seatlist.length;i=i+1){
                add(seatlist[i])
            }
        }
    }
    return cards
}

function renderCardPicker(containerid,selected,max,onchange,disabled){
    let container=dom(containerid)
    if(!container){
        return
    }
    let ranks=herogameranklist()
    let suits=[
        ["s","♠","#90caf9"],
        ["h","♥","#f48fb1"],
        ["d","♦","#ffd54f"],
        ["c","♣","#a5d6a7"]
    ]
    container.innerHTML=""
    for(let s=0;s<suits.length;s=s+1){
        let row=doccreate("div")
        row.className="card-suit-row"
        for(let r=0;r<ranks.length;r=r+1){
            let card=ranks[r]+suits[s][0]
            let selecteded=false
            for(let i=0;i<selected.length;i=i+1){
                if(selected[i]==card){
                    selecteded=true
                }
            }
            let disableded=false
            for(let i=0;i<disabled.length;i=i+1){
                if(disabled[i]==card){
                    disableded=true
                }
            }
            let btn=doccreate("div")
            btn.setAttribute("role","button")
            btn.setAttribute("tabindex","0")
            btn.className="card-btn"+(selecteded?" selected":"")+(disableded?" disabled":"")
            btn.dataset.card=card
            btn.innerHTML=`<span class="card-rank">${ranks[r]}</span><span class="card-sym" style="color:${suits[s][2]}">${suits[s][1]}</span>`
            btn.addEventListener("keydown",function(event){
                if(event.key=="Enter"||event.key==" "){
                    event.preventDefault()
                    this.click()
                }
            })
            btn.addEventListener("click",function(){
                if(loadingguard()){
                    return
                }
                if(disableded){
                    return
                }
                let arr=selected.slice()
                let found=-1
                for(let i=0;i<arr.length;i=i+1){
                    if(arr[i]==card){
                        found=i
                    }
                }
                if(0<=found){
                    arr.splice(found,1)
                }else{
                    if(max<=arr.length){
                        arr.shift()
                    }
                    arr.push(card)
                }
                onchange(arr)
            })
            row.appendChild(btn)
        }
        container.appendChild(row)
    }
}

function openHeroPicker(){
    if(loadingguard()){
        return
    }
    if(publicrecorded()){
        pttoast("公共紀錄不指定 Hero，請改在攤牌補各家牌","warn")
        return
    }
    let current=herocardlist().filter(function(card){ return !!card })
    showCardModal("我的手牌",current,herogamecount(),function(arr){
        setherocardlist(arr)
        syncHeroShowdown()
        savecache()
        renderAll()
    })
}

function renderHeroPicker(){
    let bettingbtn=dom("bettingherocards")
    if(bettingbtn){
        bettingbtn.disabled=state.loadinged||publicrecorded()
        bettingbtn.onclick=openHeroPicker
        let herolist=herocardlist()
        let anyed=false
        for(let i=0;i<herolist.length;i=i+1){
            if(herolist[i]){
                anyed=true
            }
        }
        if(publicrecorded()){
            bettingbtn.value="公共紀錄"
        }else if(anyed){
            bettingbtn.value="我的手牌 "+cardsjoinlabel(herolist)
        }else{
            bettingbtn.value="選擇手牌"
        }
    }
}

function syncHeroShowdown(){
    let heroseat=num(state.selfseating)
    if(!heroseat){
        for(let seat in state.showdowndata){
            if(state.showdowndata[seat]&&state.showdowndata[seat]["heroed"]){
                delete state.showdowndata[seat]
            }
        }
        return
    }
    for(let seat in state.showdowndata){
        if(num(seat)!=heroseat&&state.showdowndata[seat]&&state.showdowndata[seat]["heroed"]){
            delete state.showdowndata[seat]
        }
    }
    state.showdowndata[heroseat]=handcardlisttoobj(herocardlist(),herogamecount(),{
        shown: herofilled(),
        mucked: false,
        heroed: true
    })
}

function showCardModal(title,current,max,callback){
    let modal=doccreate("div")
    modal.className="card-modal"
    modal.innerHTML=`
        <div class="card-modal-body">
            <div class="newhand-panelhead">
                <div>
                    <h2>${title}</h2>
                    <p>請點選牌面</p>
                </div>
                <input type="button" class="closemodal" value="關閉">
            </div>
            <div class="newhand-selected" id="modal-selected"></div>
            <div class="card-picker" id="modal-picker"></div>
            <div class="newhand-actions">
                <input type="button" class="cancelmodal" value="取消">
                <input type="button" class="primary confirmmodal" value="確認">
            </div>
        </div>
    `
    ptlockpagescroll()
    document.body.appendChild(modal)
    let selected=current.slice()
    function renderselected(){
        let html=""
        for(let i=0;i<max;i=i+1){
            html=html+`<span>${selected[i]||"?"}</span>`
        }
        sethtml("modal-selected",html)
    }
    function renderpicker(){
        renderselected()
        renderCardPicker("modal-picker",selected,max,function(arr){
            selected=arr
            renderpicker()
        },usedCards(current))
    }
    renderpicker()
    modal.querySelector(".closemodal").addEventListener("click",function(){
        ptremovescrollcover(modal)
    })
    modal.querySelector(".cancelmodal").addEventListener("click",function(){
        ptremovescrollcover(modal)
    })
    modal.querySelector(".confirmmodal").addEventListener("click",function(){
        // 先移除目前燈箱再執行 callback：避免 callback 連續開下一個燈箱時，
        // 新燈箱的 #modal-picker 撞到尚未移除的舊燈箱(導致第二位選手開牌燈箱空白)
        ptremovescrollcover(modal)
        callback(selected)
    })
}

function renderCards(){
    if(publicrecorded()){
        settext("selected-card1","公共")
        settext("selected-card2","紀錄")
    }else{
        settext("selected-card1",state.handcard.card1||"?")
        settext("selected-card2",state.handcard.card2||"?")
    }
    for(let i=0;i<3;i=i+1){
        settext("flop"+i,state.boardcard.flop[i]||"?")
    }
    settext("burnflop","燒 "+(state.boardcard.burnflop||"?"))
    settext("turncard",state.boardcard.turn||"?")
    settext("burnturn","燒 "+(state.boardcard.burnturn||"?"))
    settext("rivercard",state.boardcard.river||"?")
    settext("burnriver","燒 "+(state.boardcard.burnriver||"?"))
}

function rebuildDefaultBets(){
    let first=firststreet()
    state.bittingdata[first]=[]
    let active=activeSeats()
    if(active.length<2){
        renderActions()
        return
    }
    // Dealer 必須落在在局座位（快速紀錄自行入座時 dealer 可能還停在預設空位）
    if(active.indexOf(state.dealerseat)<0){
        state.dealerseat=active[0]
    }
    // 梭哈：改貼前注（每人）+ 帶入注（bring-in），沒有大小盲。
    if(handgameblindtype(state.handgametype)=="ante-bringin"){
        rebuildStudDefaultBets(active,first)
        return
    }
    let sb=nextActiveSeat(state.dealerseat)
    let bb=nextActiveSeat(sb)
    if(active.length==2&&!state.emptybuttoned){
        sb=state.dealerseat
        bb=nextActiveSeat(sb)
    }
    if(state.deadsmallblinded){
        // 獨立大盲：本手沒有小盲，大盲直接落在 button 後第一個座位
        sb=0
        bb=nextActiveSeat(state.dealerseat)
    }
    state.smallblindseat=sb
    state.bigblindseat=bb
    let anteval=num(state.ante)
    let everyoneante=0<anteval&&state.row["antemode"]=="ante"
    let bbante=0<anteval&&state.row["antemode"]!="ante"
    // 依「盲注優先、ante 從剩餘計分牌扣」算出每個座位實際能付多少；整疊都投進去就標記 all-in
    function blindantepost(seat){
        let blindowed=0
        if(seat==sb&&0<sb&&!state.deadsmallblinded){
            blindowed=num(state.smallblind)
        }
        if(seat==bb){
            blindowed=num(state.bigblind)
        }
        let anteowed=0
        if(everyoneante||(bbante&&seat==bb)){
            anteowed=anteval
        }
        if(unknownchip(seat)){
            return { blind: blindowed,ante: anteowed,allin: false }
        }
        let stack=chip(seat)
        let owed=blindowed+anteowed
        if(stack<=owed){
            let blindpaid=Math.min(blindowed,stack)
            return { blind: blindpaid,ante: Math.min(anteowed,stack-blindpaid),allin: true }
        }
        return { blind: blindowed,ante: anteowed,allin: false }
    }
    let posts={}
    for(let i=0;i<active.length;i=i+1){
        posts[active[i]]=blindantepost(active[i])
    }
    if(everyoneante){
        for(let i=0;i<active.length;i=i+1){
            let seat=active[i]
            if(0<posts[seat].ante){
                state.bittingdata[first].push({ seat: seat,action: "ante",chip: posts[seat].ante,timebank: 0,isBlind: true,allined: posts[seat].allin })
            }
        }
    }
    if(0<sb&&!state.deadsmallblinded){
        state.bittingdata[first].push({ seat: sb,action: "blind",chip: posts[sb].blind,timebank: 0,isBlind: true,isSB: true,allined: posts[sb].allin })
    }
    if(0<bb){
        state.bittingdata[first].push({ seat: bb,action: "blind",chip: posts[bb].blind,timebank: 0,isBlind: true,isBB: true,allined: posts[bb].allin })
        if(bbante&&0<posts[bb].ante){
            state.bittingdata[first].push({ seat: bb,action: "ante",chip: posts[bb].ante,timebank: 0,isBlind: true,isBB: true,allined: posts[bb].allin })
        }
    }
    savecache()
    renderAll()
}

// 梭哈預設下注：每位在局選手貼前注（ante），再由 button 後第一座位貼帶入注（bring-in）。
// bring-in 座位實務上依 3rd 街最小明牌決定，這裡先給預設值，使用者可於動作清單自行調整。
function rebuildStudDefaultBets(active,first){
    state.smallblindseat=0
    state.bigblindseat=0
    let anteval=num(state.ante)
    let bringinval=num(state.smallblind)
    for(let i=0;i<active.length;i=i+1){
        let seat=active[i]
        if(anteval<=0){
            continue
        }
        let paid=anteval
        let allin=false
        if(!unknownchip(seat)){
            let stack=chip(seat)
            if(stack<=anteval){
                paid=stack
                allin=true
            }
        }
        if(0<paid){
            state.bittingdata[first].push({ seat: seat,action: "ante",chip: paid,timebank: 0,isBlind: true,allined: allin })
        }
    }
    let bringseat=nextActiveSeat(state.dealerseat)
    if(0<bringinval&&bringseat){
        let paid=bringinval
        let allin=false
        if(!unknownchip(bringseat)){
            let remain=chip(bringseat)-anteval
            if(remain<=0){
                paid=0
            }else if(remain<=bringinval){
                paid=remain
                allin=true
            }
        }
        if(0<paid){
            state.bittingdata[first].push({ seat: bringseat,action: "bringin",chip: paid,timebank: 0,isBlind: true,isBringin: true,allined: allin })
        }
    }
    savecache()
    renderAll()
}

function restoreBlindSeats(){
    // 盲注貼在第一街（換牌家族是 predraw，不是 preflop）
    let preflop=state.bittingdata[firststreet()]||[]
    state.smallblindseat=0
    state.bigblindseat=0
    for(let i=0;i<preflop.length;i=i+1){
        if(preflop[i]["isSB"]||preflop[i]["isDeadSB"]){
            state.smallblindseat=num(preflop[i]["seat"])
        }
        if(preflop[i]["isBB"]){
            state.bigblindseat=num(preflop[i]["seat"])
        }
    }
    if(!state.smallblindseat||!state.bigblindseat){
        let active=activeSeats()
        if(1<active.length){
            let sb=nextActiveSeat(state.dealerseat)
            let bb=nextActiveSeat(sb)
            if(active.length==2&&!state.emptybuttoned){
                sb=state.dealerseat
                bb=nextActiveSeat(sb)
            }
            if(state.deadsmallblinded){
                sb=0
                bb=nextActiveSeat(state.dealerseat)
            }
            if(!state.smallblindseat&&!state.deadsmallblinded){
                state.smallblindseat=sb
            }
            if(!state.bigblindseat){
                state.bigblindseat=bb
            }
        }
    }
}

function totalPot(){
    let total=0
    let streets=handstreetkeys()
    for(let s=0;s<streets.length;s=s+1){
        let list=state.bittingdata[streets[s]]||[]
        for(let i=0;i<list.length;i=i+1){
            total=total+num(list[i]["chip"])
        }
    }
    return total
}

function rewardPot(){
    return totalPot()
}

function positionPot(){
    let data=[null]
    for(let i=1;i<=state.maxseat;i=i+1){
        data.push(0)
    }
    let streets=handstreetkeys()
    for(let s=0;s<streets.length;s=s+1){
        let list=state.bittingdata[streets[s]]||[]
        for(let i=0;i<list.length;i=i+1){
            data[num(list[i]["seat"])]=num(data[num(list[i]["seat"])])+num(list[i]["chip"])
        }
    }
    return data
}

function wagerPot(){
    let data=[null]
    for(let i=1;i<=state.maxseat;i=i+1){
        data.push(0)
    }
    let streets=handstreetkeys()
    for(let s=0;s<streets.length;s=s+1){
        let list=state.bittingdata[streets[s]]||[]
        for(let i=0;i<list.length;i=i+1){
            if(list[i]["action"]!="ante"){
                data[num(list[i]["seat"])]=num(data[num(list[i]["seat"])])+num(list[i]["chip"])
            }
        }
    }
    return data
}

function antePot(){
    let total=0
    let streets=handstreetkeys()
    for(let s=0;s<streets.length;s=s+1){
        let list=state.bittingdata[streets[s]]||[]
        for(let i=0;i<list.length;i=i+1){
            if(list[i]["action"]=="ante"){
                total=total+num(list[i]["chip"])
            }
        }
    }
    return total
}

function sidePots(){
    let pot=wagerPot()
    let ante=antePot()
    let folded=foldedSeats()
    let levels=[]
    for(let i=1;i<pot.length;i=i+1){
        let amount=num(pot[i])
        if(0<amount&&levels.indexOf(amount)<0){
            levels.push(amount)
        }
    }
    levels.sort(function(a,b){
        return a-b
    })
    let result=[]
    let previous=0
    for(let l=0;l<levels.length;l=l+1){
        let level=levels[l]
        let participants=[]
        let eligible=[]
        for(let seat=1;seat<pot.length;seat=seat+1){
            if(level<=num(pot[seat])){
                participants.push(seat)
                if(!folded[seat]){
                    eligible.push(seat)
                }
            }
        }
        let amount=(level-previous)*participants.length
        if(l==0){
            amount=amount+ante
        }
        if(0<amount){
            result.push({
                amount: amount,
                participants: participants,
                eligible: eligible,
                level: level
            })
        }
        previous=level
    }
    if(!result.length&&0<ante){
        let seats=activeSeats()
        let eligible=[]
        for(let i=0;i<seats.length;i=i+1){
            if(!folded[seats[i]]){
                eligible.push(seats[i])
            }
        }
        result.push({
            amount: ante,
            participants: seats,
            eligible: eligible,
            level: 0
        })
    }
    return result
}

function streetPot(street){
    let data=[null]
    for(let i=1;i<=state.maxseat;i=i+1){
        data.push(0)
    }
    let list=state.bittingdata[street]||[]
    for(let i=0;i<list.length;i=i+1){
        if(list[i]["action"]!="ante"){
            data[num(list[i]["seat"])]=num(data[num(list[i]["seat"])])+num(list[i]["chip"])
        }
    }
    return data
}

function foldedSeats(){
    let data={}
    let streets=handstreetkeys()
    for(let s=0;s<streets.length;s=s+1){
        let list=state.bittingdata[streets[s]]||[]
        for(let i=0;i<list.length;i=i+1){
            if(list[i]["action"]=="fold"){
                data[num(list[i]["seat"])]=true
            }
        }
    }
    return data
}

function activeActionSeats(){
    let folded=foldedSeats()
    let seats=activeSeats()
    let result=[]
    for(let i=0;i<seats.length;i=i+1){
        if(!folded[seats[i]]){
            result.push(seats[i])
        }
    }
    return result
}

function remainingChip(seat){
    return chip(seat)-num(positionPot()[seat]||0)
}

function allinedSeat(seat){
    let streets=handstreetkeys()
    for(let s=0;s<streets.length;s=s+1){
        let list=state.bittingdata[streets[s]]||[]
        for(let i=0;i<list.length;i=i+1){
            if(num(list[i]["seat"])==num(seat)&&(list[i]["allined"]==true||list[i]["action"]=="allin")){
                return true
            }
        }
    }
    if(unknownchip(seat)){
        return false
    }
    if(remainingChip(seat)<=0){
        return true
    }
    return false
}

function activeBettingSeats(){
    let seats=activeActionSeats()
    let result=[]
    for(let i=0;i<seats.length;i=i+1){
        if(!allinedSeat(seats[i])){
            result.push(seats[i])
        }
    }
    return result
}

function selectedWinnerSeats(){
    let seats=activeSeats()
    let result=[]
    for(let i=0;i<seats.length;i=i+1){
        if(state.winner[seats[i]]||state.winner[String(seats[i])]){
            result.push(seats[i])
        }
    }
    return result
}

function winnerOrder(list){
    let start=nextActiveSeat(state.dealerseat)
    let order=orderedFrom(start)
    let result=[]
    for(let i=0;i<order.length;i=i+1){
        for(let j=0;j<list.length;j=j+1){
            if(order[i]==list[j]){
                result.push(list[j])
            }
        }
    }
    for(let i=0;i<list.length;i=i+1){
        if(result.indexOf(list[i])<0){
            result.push(list[i])
        }
    }
    return result
}

function applySidePotWinnerPrices(){
    let winners=selectedWinnerSeats()
    let seats=activeSeats()
    for(let i=0;i<seats.length;i=i+1){
        state.winnerprice[seats[i]]=0
    }
    if(!winners.length){
        return
    }
    let pots=sidePots()
    let unit=minchip()
    for(let p=0;p<pots.length;p=p+1){
        let eligible=[]
        for(let i=0;i<winners.length;i=i+1){
            for(let j=0;j<pots[p]["eligible"].length;j=j+1){
                if(winners[i]==pots[p]["eligible"][j]){
                    eligible.push(winners[i])
                }
            }
        }
        if(!eligible.length){
            continue
        }
        eligible=winnerOrder(eligible)
        let share=Math.floor(pots[p]["amount"]/eligible.length/unit)*unit
        let used=share*eligible.length
        for(let i=0;i<eligible.length;i=i+1){
            state.winnerprice[eligible[i]]=num(state.winnerprice[eligible[i]])+share
        }
        let left=pots[p]["amount"]-used
        for(let i=0;i<eligible.length&&unit<=left;i=i+1){
            state.winnerprice[eligible[i]]=num(state.winnerprice[eligible[i]])+unit
            left=left-unit
        }
    }
}

function clearAutoWinner(){
    for(let seat in state.winner){
        if(state.winnerauto&&state.winnerauto[seat]){
            state.winner[seat]=false
        }
    }
    for(let seat in state.winnerprice){
        if(state.winnerauto&&state.winnerauto[seat]){
            state.winnerprice[seat]=0
        }
    }
    state.winnerauto={}
}

function autoWinnerByFold(){
    let seats=activeActionSeats()
    if(seats.length!=1){
        clearAutoWinner()
        return false
    }
    let winnerseat=seats[0]
    clearAutoWinner()
    let allseats=activeSeats()
    for(let i=0;i<allseats.length;i=i+1){
        state.winner[allseats[i]]=false
        state.winnerprice[allseats[i]]=0
    }
    state.winner[winnerseat]=true
    applySidePotWinnerPrices()
    state.winnerauto={}
    state.winnerauto[winnerseat]=true
    return true
}

function maxStreetBet(street){
    let pot=streetPot(street)
    let max=0
    for(let i=1;i<pot.length;i=i+1){
        if(max<num(pot[i])){
            max=num(pot[i])
        }
    }
    return max
}

function lastManualActionSeat(street){
    let list=state.bittingdata[street]||[]
    for(let i=list.length-1;i>=0;i=i-1){
        if(!list[i]["isBlind"]&&list[i]["action"]!="ante"&&list[i]["action"]!="blind"){
            return num(list[i]["seat"])
        }
    }
    return 0
}

function manualActionSeats(street){
    let data={}
    let list=state.bittingdata[street]||[]
    for(let i=0;i<list.length;i=i+1){
        if(!list[i]["isBlind"]&&list[i]["action"]!="ante"&&list[i]["action"]!="blind"){
            data[num(list[i]["seat"])]=true
        }
    }
    return data
}

function streetnextname(street){
    let next=nextstreet(street)
    if(!next){
        return "攤牌 / 送出"
    }
    return handstreetname(next)
}

// 依 handstreetkeys() 的順序推下一街；沒有下一街回空字串（進攤牌）。
function nextstreet(street){
    let keys=handstreetkeys()
    let idx=keys.indexOf(street)
    if(idx<0||idx+1>=keys.length){
        return ""
    }
    return keys[idx+1]
}

function roundFinishInfo(street){
    let seats=activeActionSeats()
    let bettingseats=activeBettingSeats()
    if(seats.length<=1){
        if(seats.length==1){
            return {
                finished: true,
                message: "其他選手都已蓋牌，只剩 "+seatlabel(seats[0])+"，手牌已結束。"
            }
        }
        return {
            finished: true,
            message: "所有選手都已蓋牌，請檢查手牌結果。"
        }
    }
    if(bettingseats.length==0){
        return {
            finished: true,
            message: "All-in complete. Switch to "+streetnextname(street)+"."
        }
    }
    let acted=manualActionSeats(street)
    for(let i=0;i<bettingseats.length;i=i+1){
        if(!acted[bettingseats[i]]){
            return {
                finished: false,
                message: ""
            }
        }
        if(0<callAmount(street,bettingseats[i])){
            return {
                finished: false,
                message: ""
            }
        }
    }
    return {
        finished: true,
        message: "本輪都已跟注 / 過牌，請切換到"+streetnextname(street)+"。"
    }
}

function actionStartSeat(street){
    // 盲注家族的第一街（翻牌前 / 換牌前）由大盲後開始；其餘街與梭哈由 button 後開始。
    if(street==firststreet()&&handgameblindtype(state.handgametype)=="blind"){
        return nextActiveSeat(state.bigblindseat||state.dealerseat)
    }
    return nextActiveSeat(state.dealerseat)
}

function nextActionSeat(street){
    if(roundFinishInfo(street)["finished"]){
        return 0
    }
    let seats=activeBettingSeats()
    if(!seats.length){
        return 0
    }
    let last=lastManualActionSeat(street)
    let start=last?nextActiveSeat(last):actionStartSeat(street)
    let order=orderedFrom(start)
    for(let i=0;i<order.length;i=i+1){
        for(let n=0;n<seats.length;n=n+1){
            if(order[i]==seats[n]){
                return order[i]
            }
        }
    }
    return seats[0]
}

function callAmount(street,seat){
    let current=streetPot(street)[seat]||0
    let max=maxStreetBet(street)
    let amount=max-current
    if(amount<0){
        amount=0
    }
    let remain=remainingChip(seat)
    if(remain<amount){
        amount=remain
    }
    return amount
}

function targetAmountToChip(street,seat,target){
    let current=num(streetPot(street)[seat]||0)
    let amount=num(target)-current
    if(amount<0){
        amount=0
    }
    let remain=remainingChip(seat)
    if(remain<amount){
        amount=remain
    }
    return amount
}

function lastRaiseAmount(street){
    let list=state.bittingdata[street]||[]
    let seatpot=[null]
    for(let i=1;i<=state.maxseat;i=i+1){
        seatpot.push(0)
    }
    let max=0
    let lastraise=num(state.bigblind)
    for(let i=0;i<list.length;i=i+1){
        let item=list[i]
        let seat=num(item["seat"])
        if(item["action"]=="ante"){
            continue
        }
        seatpot[seat]=num(seatpot[seat])+num(item["chip"])
        let current=num(seatpot[seat])
        if(max<current){
            let diff=current-max
            max=current
            if((item["action"]=="bet"||item["action"]=="raise")&&0<diff){
                lastraise=diff
            }
        }
    }
    if(lastraise<=0){
        lastraise=num(state.bigblind)||minchip()
    }
    return lastraise
}

function minimumRaiseAmount(street,seat){
    let call=callAmount(street,seat)
    let remain=remainingChip(seat)
    let minimum=0
    if(maxStreetBet(street)>0){
        minimum=call+lastRaiseAmount(street)
    }else{
        minimum=num(state.bigblind)||minchip()
    }
    if(remain<minimum){
        minimum=remain
    }
    return minimum
}

function validRaiseAmount(street,seat,amount){
    let remain=remainingChip(seat)
    let call=callAmount(street,seat)
    if(amount<=call){
        return false
    }
    if(remain<=amount){
        return true
    }
    if(amount<minimumRaiseAmount(street,seat)){
        return false
    }
    return true
}

function minimumRaiseTarget(street,seat){
    return num(streetPot(street)[seat]||0)+minimumRaiseAmount(street,seat)
}

function maximumRaiseTarget(street,seat){
    return num(streetPot(street)[seat]||0)+remainingChip(seat)
}

function boardEmpty(street){
    if(street=="flop"){
        return !state.boardcard.flop[0]&&!state.boardcard.flop[1]&&!state.boardcard.flop[2]
    }
    if(street=="turn"){
        return !state.boardcard.turn
    }
    if(street=="river"){
        return !state.boardcard.river
    }
    return false
}

function autoOpenBoardPicker(street,afterDone){
    function done(){
        savecache()
        renderAll()
        if(afterDone){
            afterDone()
        }
    }
    if(street=="flop"){
        let current=state.boardcard.flop.filter(function(card){ return !!card })
        showCardModal("Flop",current,3,function(arr){
            state.boardcard.flop=[arr[0]||"",arr[1]||"",arr[2]||""]
            done()
        })
    }else if(street=="turn"){
        let current=state.boardcard.turn?[state.boardcard.turn]:[]
        showCardModal("Turn",current,1,function(arr){
            state.boardcard.turn=arr[0]||""
            done()
        })
    }else if(street=="river"){
        let current=state.boardcard.river?[state.boardcard.river]:[]
        showCardModal("River",current,1,function(arr){
            state.boardcard.river=arr[0]||""
            done()
        })
    }else if(afterDone){
        afterDone()
    }
}

function openBoardCard(key){
    if(loadingguard()){
        return
    }
    if(key=="flop"){
        autoOpenBoardPicker("flop")
        return
    }
    let titles={ turn: "Turn",river: "River",burnflop: "燒牌（翻牌）",burnturn: "燒牌（轉牌）",burnriver: "燒牌（河牌）" }
    let current=state.boardcard[key]?[state.boardcard[key]]:[]
    showCardModal(titles[key]||key,current,1,function(arr){
        state.boardcard[key]=arr[0]||""
        savecache()
        renderAll()
    })
}

function openBoardEditor(){
    if(loadingguard()){
        return
    }
    let flopcards=(state.boardcard.flop||[]).filter(function(card){ return !!card })
    let rows=[
        ["flop","Flop",flopcards.length?flopcards.join(" "):"?"],
        ["burnflop","燒牌（翻牌）",state.boardcard.burnflop||"?"],
        ["turn","Turn",state.boardcard.turn||"?"],
        ["burnturn","燒牌（轉牌）",state.boardcard.burnturn||"?"],
        ["river","River",state.boardcard.river||"?"],
        ["burnriver","燒牌（河牌）",state.boardcard.burnriver||"?"]
    ]
    let rowhtml=""
    for(let i=0;i<rows.length;i=i+1){
        rowhtml=rowhtml+`<input type="button" class="board-editor-row" data-board="${rows[i][0]}" value="${rows[i][1]} ${rows[i][2]}">`
    }
    let modal=doccreate("div")
    modal.className="card-modal"
    modal.innerHTML=`
        <div class="card-modal-body">
            <div class="newhand-panelhead">
                <div>
                    <h2>公共牌</h2>
                    <p>點選要編輯的牌</p>
                </div>
                <input type="button" class="closemodal" value="關閉">
            </div>
            <div class="board-editor-list">${rowhtml}</div>
        </div>
    `
    ptlockpagescroll()
    document.body.appendChild(modal)
    function close(){
        if(modal.parentElement){
            ptremovescrollcover(modal)
        }
    }
    modal.querySelector(".closemodal").addEventListener("click",close)
    let editrows=modal.querySelectorAll(".board-editor-row")
    for(let i=0;i<editrows.length;i=i+1){
        editrows[i].addEventListener("click",function(){
            let key=this.getAttribute("data-board")
            close()
            openBoardCard(key)
        })
    }
}

function runBoardQueue(afterDone){
    let order=["flop","turn","river"]
    let i=0
    function step(){
        while(i<order.length&&!boardEmpty(order[i])){
            i=i+1
        }
        if(i>=order.length){
            if(afterDone){
                afterDone()
            }
            return
        }
        let street=order[i]
        i=i+1
        autoOpenBoardPicker(street,step)
    }
    step()
}

function runRevealQueue(seats,afterDone){
    let i=0
    function step(){
        if(i>=seats.length){
            if(afterDone){
                afterDone()
            }
            return
        }
        let seat=seats[i]
        i=i+1
        let ishero=num(seat)==num(state.selfseating)&&num(state.selfseating)>0
        let count=herogamecount()
        let current
        if(ishero){
            current=herocardlist().filter(function(card){ return !!card })
        }else{
            current=handcardobjtolist(state.showdowndata[seat]||{},count).filter(function(card){ return !!card })
        }
        showCardModal(seatlabel(seat)+" 開牌",current,count,function(arr){
            if(ishero){
                setherocardlist(arr)
                syncHeroShowdown()
            }else{
                let filled=arr.filter(function(card){ return !!card }).length==count
                state.showdowndata[seat]=handcardlisttoobj(arr,count,{ shown: filled,mucked: false })
            }
            savecache()
            renderAll()
            step()
        })
    }
    step()
}

function startAllinReveal(){
    // all-in 使該輪結束：依序補每位仍在局選手的底牌（開牌），再補剩餘公共牌（僅 board 家族），最後進結果頁
    let seats=activeActionSeats()
    runRevealQueue(seats,function(){
        function finish(){
            state.step2view="result"
            savecache()
            renderAll()
            maybeAutoSolve()
        }
        if(handfamily()=="board"){
            runBoardQueue(finish)
        }else{
            // 梭哈 / 換牌無公共牌，直接進結果頁
            finish()
        }
    })
}

function addQuickAction(action,amount,allined){
    let street=val("actionstreet")||firststreet()
    let seat=nextActionSeat(street)
    if(!seat){
        pttoast("找不到可操作座位","error")
        return
    }
    // 投入額把剩餘計分牌跟光時自動視為 all-in，不必只靠手動勾選
    if(!allined&&(action=="bet"||action=="raise"||action=="call")&&!unknownchip(seat)&&num(amount)>0&&num(amount)>=remainingChip(seat)){
        allined=true
    }
    if((action=="bet"||action=="raise")&&!allined&&!validRaiseAmount(street,seat,num(amount))){
        pttoast("Minimum raise is "+money(minimumRaiseAmount(street,seat))+". Short stacks can go all-in.","error")
        return
    }
    state.bittingdata[street].push({
        seat: seat,
        action: allined?"allin":action,
        chip: num(amount),
        timebank: (function(){if(quickmode){return capturetimebankforaction(seat)}return 0})(),
        allined: !!allined
    })
    autoWinnerByFold()
    savecache()
    renderAll()
    let info=roundFinishInfo(street)
    if(!info["finished"]){
        return
    }
    pttoast(info["message"],"warn")
    if(activeActionSeats().length<=1){
        // 只剩一人（其他都蓋牌）→ 直接進結果頁
        state.step2view="result"
        savecache()
        renderAll()
        return
    }
    if(activeBettingSeats().length<=1){
        // 仍在局選手中最多剩一位有計分牌可下注（其餘都 all-in）→ 後續街無需再下注
        // 依序開牌 + 補剩餘公共牌 → 結果頁，避免每條街又被要求 Check / Call 0
        startAllinReveal()
        return
    }
    let next=nextstreet(street)
    if(next&&dom("actionstreet")){
        dom("actionstreet").value=next
        savecache()
        renderAll()
        betweenStreetEvent(next)
    }else if(islaststreet(street)){
        // 最後一街跑完 → 結果頁
        state.step2view="result"
        savecache()
        renderAll()
        maybeAutoSolve()
    }
}

// 進入下一街時依家族觸發不同事件：
// board → 開公共牌選牌器；stud → 開該街發牌器；draw → 開該街換牌器。
function betweenStreetEvent(streetkey){
    let family=handfamily()
    if(family=="board"){
        if(boardEmpty(streetkey)){
            autoOpenBoardPicker(streetkey)
        }
    }else if(family=="stud"){
        openStudDealModal(streetkey)
    }else if(family=="draw"){
        openDrawModal(streetkey)
    }
}

// 取得 / 設定某座位的牌物件：Hero 用 state.handcard，其餘用 state.showdowndata[seat]。
function seatcardobject(seat){
    if(num(seat)==num(state.selfseating)&&num(state.selfseating)>0){
        return state.handcard||{}
    }
    return state.showdowndata[seat]||{}
}

function setseatcardobject(seat,obj){
    if(num(seat)==num(state.selfseating)&&num(state.selfseating)>0){
        state.handcard=obj
        return
    }
    state.showdowndata[seat]=obj
}

// 某座位目前已填的牌數達到底牌數 → 視為完整（供 shown 標記與攤牌顯示）。
function markseatfilled(seat){
    if(num(seat)==num(state.selfseating)&&num(state.selfseating)>0){
        return
    }
    let obj=state.showdowndata[seat]
    if(!obj){
        return
    }
    let filled=handcardspresent(obj).length>=herogamecount()
    obj["shown"]=filled&&obj["mucked"]!=true
}

// 梭哈：某街要發的牌槽（card 索引）與明 / 暗對照。
function studdealslots(streetkey){
    let def=handstreetdef(streetkey)
    return def&&def["deal"]?def["deal"]["slots"]:[]
}

function studdealexposed(streetkey){
    let def=handstreetdef(streetkey)
    return def&&def["deal"]?def["deal"]["exposed"]:[]
}

// 梭哈發牌：逐一在局座位、依該街的牌槽補牌（3rd 一次補 3 張、4th~7th 各補 1 張）。
// 明 / 暗由牌槽位置決定（1、2、7 暗，3~6 明），存於牌物件的 exposed 陣列（與 card1..card7 平行）。
function openStudDealModal(streetkey){
    let slots=studdealslots(streetkey)
    let exposed=studdealexposed(streetkey)
    if(!slots.length){
        return
    }
    let seats=activeActionSeats()
    let idx=0
    function nextSeat(){
        if(idx>=seats.length){
            savecache()
            renderAll()
            return
        }
        let seat=seats[idx]
        idx=idx+1
        let obj=seatcardobject(seat)
        let current=[]
        for(let i=0;i<slots.length;i=i+1){
            if(obj["card"+slots[i]]){
                current.push(obj["card"+slots[i]])
            }
        }
        let hint=[]
        for(let i=0;i<exposed.length;i=i+1){
            hint.push(exposed[i]=="up"?"明":"暗")
        }
        let title=seatlabel(seat)+" · "+handstreetname(streetkey)+"（"+hint.join("/")+"）"
        showCardModal(title,current,slots.length,function(arr){
            let target=seatcardobject(seat)
            let expArr=target["exposed"]||[]
            for(let i=0;i<slots.length;i=i+1){
                target["card"+slots[i]]=arr[i]||""
                expArr[slots[i]-1]=(exposed[i]=="up")
            }
            target["exposed"]=expArr
            setseatcardobject(seat,target)
            markseatfilled(seat)
            savecache()
            nextSeat()
        })
    }
    nextSeat()
}

// 換牌：逐一在局座位重選該街換牌後的完整手牌，並自動比對前後差異記錄丟 / 補的牌。
// predraw（換牌前）視為初始發牌，不會產生丟牌紀錄。
function openDrawModal(streetkey){
    let count=herogamecount()
    let seats=activeActionSeats()
    let idx=0
    let isdraw=!!(handstreetdef(streetkey)&&handstreetdef(streetkey)["draw"])
    function nextSeat(){
        if(idx>=seats.length){
            savecache()
            renderAll()
            return
        }
        let seat=seats[idx]
        idx=idx+1
        let obj=seatcardobject(seat)
        let before=handcardobjtolist(obj,count).filter(function(card){ return !!card })
        let label=isdraw?"換牌後手牌":"起手牌"
        showCardModal(seatlabel(seat)+" · "+handstreetname(streetkey)+" "+label,before,count,function(arr){
            let after=arr.filter(function(card){ return !!card })
            let filled=after.length==count
            let target=handcardlisttoobj(arr,count,{ shown: filled,mucked: false })
            // 保留 Hero 標記
            if(obj["heroed"]){
                target["heroed"]=true
            }
            setseatcardobject(seat,target)
            if(isdraw){
                let discard=[]
                let draw=[]
                for(let i=0;i<before.length;i=i+1){
                    if(after.indexOf(before[i])<0){
                        discard.push(before[i])
                    }
                }
                for(let i=0;i<after.length;i=i+1){
                    if(before.indexOf(after[i])<0){
                        draw.push(after[i])
                    }
                }
                if(!state.draws[streetkey]){
                    state.draws[streetkey]={}
                }
                state.draws[streetkey][seat]={ discard: discard,draw: draw,count: discard.length }
            }
            savecache()
            nextSeat()
        })
    }
    nextSeat()
}

// 從 hub「發牌 / 換牌」磚進入：對目前街別開對應的發牌（stud）或換牌（draw）編輯器。
function openDealDrawEditor(){
    let street=val("actionstreet")||firststreet()
    let family=handfamily()
    if(family=="stud"){
        openStudDealModal(street)
    }else if(family=="draw"){
        openDrawModal(street)
    }
}

// hub 板上「發牌 / 換牌」磚的副標：梭哈顯示 Hero 目前牌、換牌顯示已換街數。
function dealdrawlabel(){
    let family=handfamily()
    if(family=="stud"){
        let hero=herocardlist().filter(function(card){ return !!card })
        return hero.length?("我: "+hero.join(" ")):"點此發牌"
    }
    if(family=="draw"){
        let rounds=0
        for(let k in state.draws){
            if(state.draws[k]&&Object.keys(state.draws[k]).length){
                rounds=rounds+1
            }
        }
        return rounds?("已換 "+rounds+" 街"):"點此換牌"
    }
    return "-"
}

function showRaiseModal(){
    let street=val("actionstreet")||firststreet()
    let seat=nextActionSeat(street)
    if(!seat){
        pttoast("找不到可操作座位","error")
        return
    }
    let call=callAmount(street,seat)
    let current=num(streetPot(street)[seat]||0)
    let remain=remainingChip(seat)
    let unit=minchip()
    let minimum=minimumRaiseTarget(street,seat)
    let maximum=maximumRaiseTarget(street,seat)
    let calltarget=current+call
    let maxtext=unknownchip(seat)?"未知":money(maximum)
    let allinvalue=unknownchip(seat)?minimum:maximum
    let preset=[minimum,roundchip(num(state.bigblind)*2),roundchip(num(state.bigblind)*3),roundchip(calltarget+Math.floor(totalPot()/2)),roundchip(calltarget+Math.floor(totalPot()*3/4)),roundchip(calltarget+totalPot()),maximum]
    let raisedchips=raisedChipValues()
    let chiphtml=""
    for(let i=0;i<state.chips.length;i=i+1){
        let value=num(state.chips[i]["value"])
        if(0<value&&!raisedchips[value]){
            chiphtml=chiphtml+`<input type="button" class="chipcalc-add" data-value="${value}" value="+${money(value)}">`
        }
    }
    let quickhtml=""
    let quicknames=["最低","2BB","3BB","1/2 Pot","3/4 Pot","Pot","All-in"]
    for(let i=0;i<preset.length;i=i+1){
        let value=num(preset[i])
        if(0<value){
            if(maximum<value){
                value=maximum
            }
            quickhtml=quickhtml+`<input type="button" class="chipcalc-set" data-value="${value}" value="${quicknames[i]} ${money(value)}">`
        }
    }
    let modal=doccreate("div")
    modal.className="card-modal"
    modal.innerHTML=`
        <div class="card-modal-body raise-modal-body">
            <div class="newhand-panelhead">
                <div>
                    <h2>${seatlabel(seat)} Bet / Raise</h2>
                    <p>已投入 ${money(current)}，目前跟注到 ${money(calltarget)}，剩餘 ${money(remain)}，最小計分牌 ${money(unit)}</p>
                </div>
                <input type="button" class="closeraisemodal" value="關閉">
            </div>
            <div class="chipcalc-display">
                <div>
                    <span>下注 / 加注到</span>
                    <strong id="raiseamounttext">${money(minimum)}</strong>
                </div>
                <input type="number" id="raiseamount" min="0" step="${unit}" inputmode="numeric" value="${minimum}">
            </div>
            <div class="chipcalc-chips">
                ${chiphtml}
            </div>
            <div class="chipcalc-keypad">
                <input type="button" class="chipcalc-key" data-key="7" value="7">
                <input type="button" class="chipcalc-key" data-key="8" value="8">
                <input type="button" class="chipcalc-key" data-key="9" value="9">
                <input type="button" class="chipcalc-clear" value="清除">
                <input type="button" class="chipcalc-key" data-key="4" value="4">
                <input type="button" class="chipcalc-key" data-key="5" value="5">
                <input type="button" class="chipcalc-key" data-key="6" value="6">
                <input type="button" class="chipcalc-back" value="退格">
                <input type="button" class="chipcalc-key" data-key="1" value="1">
                <input type="button" class="chipcalc-key" data-key="2" value="2">
                <input type="button" class="chipcalc-key" data-key="3" value="3">
                <input type="button" class="chipcalc-plusunit" value="+${money(unit)}">
                <input type="button" class="chipcalc-key zero" data-key="0" value="0">
                <input type="button" class="chipcalc-set chipcalc-allinset" data-value="${allinvalue}" value="All-in ${maxtext}">
            </div>
            <div class="newhand-actions raise-actions mt-3">
                <label class="newhand-checkline raise-allinline">
                    <input type="checkbox" id="raiseallined"> All-in
                </label>
                <input type="button" class="cancelraise" value="取消">
                <input type="button" class="primary confirmraise" value="確認">
            </div>
        </div>
    `
    ptlockpagescroll()
    document.body.appendChild(modal)
    function setamount(value){
        let amount=num(value)
        if(amount<0){
            amount=0
        }
        if(maximum<amount){
            amount=maximum
        }
        domgetid("raiseamount").value=amount
        settext("raiseamounttext",money(amount))
    }
    function addamount(value){
        setamount(num(domgetid("raiseamount").value)+num(value))
    }
    modal.querySelector(".closeraisemodal").addEventListener("click",function(){
        ptremovescrollcover(modal)
    })
    modal.querySelector(".cancelraise").addEventListener("click",function(){
        ptremovescrollcover(modal)
    })
    domgetid("raiseamount").addEventListener("input",function(){
        setamount(this.value)
    })
    let setbtns=modal.querySelectorAll(".chipcalc-set")
    for(let i=0;i<setbtns.length;i=i+1){
        setbtns[i].addEventListener("click",function(){
            setamount(this.getAttribute("data-value"))
            if(this.classList.contains("chipcalc-allinset")){
                domgetid("raiseallined").checked=true
            }
        })
    }
    let addbtns=modal.querySelectorAll(".chipcalc-add")
    for(let i=0;i<addbtns.length;i=i+1){
        addbtns[i].addEventListener("click",function(){
            addamount(this.getAttribute("data-value"))
        })
    }
    let keybtns=modal.querySelectorAll(".chipcalc-key")
    for(let i=0;i<keybtns.length;i=i+1){
        keybtns[i].addEventListener("click",function(){
            let value=String(domgetid("raiseamount").value||"")
            if(value=="0"||value==String(minimum)){
                value=""
            }
            setamount(value+this.getAttribute("data-key"))
        })
    }
    modal.querySelector(".chipcalc-clear").addEventListener("click",function(){
        setamount(0)
    })
    modal.querySelector(".chipcalc-back").addEventListener("click",function(){
        let value=String(domgetid("raiseamount").value||"")
        setamount(value.substring(0,value.length-1))
    })
    modal.querySelector(".chipcalc-plusunit").addEventListener("click",function(){
        addamount(unit)
    })
    modal.querySelector(".confirmraise").addEventListener("click",function(){
        let target=num(domgetid("raiseamount").value)
        let allined=domgetid("raiseallined").checked
        if(maximum<target){
            target=maximum
        }
        if(unit>1&&target%unit!=0){
            target=roundchip(target)
            if(maximum<target){
                target=maximum
            }
            pttoast("已依最小計分牌調整為 "+money(target),"warn")
        }
        let amount=targetAmountToChip(street,seat,target)
        if(!allined&&!validRaiseAmount(street,seat,amount)){
            pttoast("Minimum raise target is "+money(minimumRaiseTarget(street,seat))+". Short stacks can go all-in.","error")
            return
        }
        addQuickAction(maxStreetBet(street)>0?"raise":"bet",amount,allined)
        ptremovescrollcover(modal)
    })
}

function showFirstSeat(){
    let streets=handstreetkeys().slice().reverse()
    for(let s=0;s<streets.length;s=s+1){
        let list=state.bittingdata[streets[s]]||[]
        for(let i=list.length-1;i>=0;i=i-1){
            if(list[i]["action"]=="bet"||list[i]["action"]=="raise"||list[i]["action"]=="allin"){
                return num(list[i]["seat"])
            }
        }
    }
    return nextActiveSeat(state.dealerseat)
}

function renderStatus(){
    settext("pagetitle",quickmode?"快速手牌紀錄":(handid?"編輯手牌":"新增手牌"))
    settext("handtablename",state.row["no"]||state.row["token"]||"-")
    settext("dealerlabel",seatlabel(state.dealerseat))
    settext("blindlabel",money(state.smallblind)+"/"+money(state.bigblind)+" ("+money(state.ante)+")")
    settext("playercountlabel",activeSeats().length+" 人")
    dom("saveandnext").classList.toggle("hidden",!!handid)
}

function loadHandBitting(rows){
    state.bittingdata={
        preflop: [],
        flop: [],
        turn: [],
        river: []
    }
    for(let i=0;i<rows.length;i=i+1){
        let row=rows[i]
        let street=row["type"]||row["bittingtype"]||"preflop"
        if(!state.bittingdata[street]){
            state.bittingdata[street]=[]
        }
        state.bittingdata[street].push({
            seat: num(row["seatno"]||row["seat"]),
            action: row["action"]||"",
            chip: num(row["chip"]),
            timebank: num(row["timebank"]),
            // 後端 hand.py 存檔時把 isSB 寫進 handbittingdata 的 bbed 欄位（歷史欄位名，不可單邊改名），
            // isBB 沒有對應欄位，用「盲注列（action=blind）且不是 SB」推回，restoreBlindSeats 才能還原大盲座位。
            isBlind: !!row["blinded"],
            isSB: !!row["bbed"],
            isBB: !!row["blinded"]&&!row["bbed"]&&row["action"]=="blind",
            allined: row["allined"]==true||row["action"]=="allin"
        })
    }
}

function applyHandEdit(hand){
    state.step=1
    state.dealerseat=num(hand["dealerseat"]||state.dealerseat)
    state.selfseating=num(hand["selfseating"]||state.selfseating)
    state.handgametype=hand["gametype"]||state.handgametype
    state.blindlevel=hand["blindlevel"]||state.blindlevel
    state.smallblind=num(hand["smallblind"]||state.smallblind)
    state.bigblind=num(hand["bigblind"]||state.bigblind)
    state.ante=num(hand["ante"]||hand["bigblindante"]||state.ante)
    state.emptybuttoned=!!hand["emptybutton"]
    state.deadsmallblinded=!!hand["deadsmallblind"]
    state.handcard=hand["handcard"]||state.handcard
    state.boardcard=hand["boardcard"]||state.boardcard
    normalizeboardcard()
    // 還原家族專屬資料（換牌丟 / 補牌紀錄）；梭哈明 / 暗牌對照由牌槽位置推導，不需另存還原。
    let familydata=hand["familydata"]
    if(typeof familydata=="string"){
        familydata=json(familydata)
    }
    if(familydata&&familydata["draws"]){
        state.draws=familydata["draws"]
    }
    if(hand["ps"]||hand["note"]){
        setval("ps",hand["ps"]||hand["note"])
    }
    if(hand["seatingdata"]&&hand["seatingdata"].length){
        for(let i=0;i<hand["seatingdata"].length;i=i+1){
            let row=hand["seatingdata"][i]
            let seatno=num(row["seatno"])
            state.seatinglist[seatno]={
                chip: num(row["chip"]),
                unknownchip: row["unknownchip"]==true||num(row["chip"])<0||String(row["specialbutton"]||"").indexOf("UNKNOWN_CHIP")>=0,
                name: row["name"]||"",
                userid: row["userid"]||null,
                sessionplayerid: row["sessionplayerid"]||null,
                banned: row["banned"]||false,
                specialbutton: row["specialbutton"]||""
            }
            if(row["winnered"]){
                state.winner[seatno]=true
                state.winnerprice[seatno]=num(row["chipchange"])
            }
            if(row["handcard"]&&handcardspresent(row["handcard"]).length){
                let scard={ shown: true,mucked: false }
                for(let c=1;c<=7;c=c+1){
                    if(row["handcard"]["card"+c]){
                        scard["card"+c]=row["handcard"]["card"+c]
                    }
                }
                if(row["handcard"]["exposed"]){
                    scard["exposed"]=row["handcard"]["exposed"]
                }
                state.showdowndata[seatno]=scard
            }
        }
    }
    loadHandBitting(hand["bittingdata"]||[])
    syncHeroShowdown()
}

function renderStep(){
    let buttons=document.querySelectorAll(".stepnav")
    for(let i=0;i<buttons.length;i=i+1){
        buttons[i].classList.toggle("active",num(buttons[i].getAttribute("data-step"))==state.step)
    }
    for(let i=1;i<=3;i=i+1){
        dom("step"+i).classList.toggle("active",i==state.step)
    }
}

function renderSeatSelects(){
	let seats=activeSeats()
	let dealerseats=[]
	if(state.emptybuttoned){
		for(let i=1;i<=state.maxseat;i=i+1){
			dealerseats.push(i)
		}
	}else{
		for(let i=0;i<seats.length;i=i+1){
			dealerseats.push(seats[i])
		}
	}
	if(dealerseats.length&&dealerseats.indexOf(state.dealerseat)<0){
		state.dealerseat=dealerseats[0]
	}
	if(!state.emptybuttoned&&seats.length&&seats.indexOf(state.dealerseat)<0){
		state.dealerseat=seats[0]
	}
	if(seats.length&&seats.indexOf(state.selfseating)<0&&!publicrecorded()){
		state.selfseating=seats[0]
	}
	let html=""
	let dealerhtml=""
	for(let i=0;i<dealerseats.length;i=i+1){
		let seat=dealerseats[i]
		let emptyed=seats.indexOf(seat)<0
		dealerhtml=dealerhtml+`<option value="${seat}">${seatlabel(seat)}${emptyed?" - EMPTY":""}</option>`
	}
	for(let i=0;i<seats.length;i=i+1){
		html=html+`<option value="${seats[i]}">${seatlabel(seats[i])}</option>`
	}
	if(unifiedpublicallowed()){
		html=`<option value="0">公共紀錄</option>`+html
	}
	sethtml("dealerseat",dealerhtml)
	sethtml("selfseating",html)
	setval("dealerseat",state.dealerseat)
	setval("selfseating",state.selfseating)
	if(dom("selfseatinglabel")){
		settext("selfseatinglabel",publicrecorded()?"紀錄類型":"Hero 座位")
	}
	if(dom("herocardtitle")){
		settext("herocardtitle",publicrecorded()?"公共紀錄":"Hero 手牌")
	}
}

function renderSeats(){
    if(quickmode){
        // 快速紀錄：改用視覺化牌桌（felt ring），可點座位入座 / 改設定，並顯示輪到誰行動
        renderFeltSeats()
        return
    }
    let html=""
    for(let i=1;i<=state.maxseat;i=i+1){
        let activeed=state.seatinglist[i]&&state.seatinglist[i]!=false&&(unknownchip(i)||0<num(state.seatinglist[i]["chip"]))
        let chiptext=unknownchip(i)?"未知":money(chip(i))
        let badges=""
        if(i==state.dealerseat){
            badges=badges+`<span class="newhand-badge dealer">DEALER</span>`
        }
        if(i==state.selfseating&&num(state.selfseating)>0){
            badges=badges+`<span class="newhand-badge hero">HERO</span>`
        }
        if(i==state.smallblindseat){
            badges=badges+`<span class="newhand-badge">SB</span>`
        }
        if(i==state.bigblindseat){
            badges=badges+`<span class="newhand-badge">BB</span>`
        }
        html=html+`
            <div class="newhand-seatcard ${activeed?"":"empty"}">
                <div>${seatlabel(i)} ${badges}</div>
                <div>${activeed?chiptext:"EMPTY"}</div>
            </div>
        `
    }
    sethtml("seatlist",html)
}

// 綁定快速紀錄的碼量輸入 / 單位切換 / 未知碼量勾選。
function bindQuickStacks(){
    let toggle=dom("quickstackunittoggle")
    if(toggle){
        toggle.addEventListener("click",function(){
            quickstackunit=quickstackunit=="bb"?"chip":"bb"
            renderSeats()
        })
    }
    let inputs=document.querySelectorAll(".quickstackinput")
    for(let i=0;i<inputs.length;i=i+1){
        inputs[i].addEventListener("change",function(){
            let seat=num(this.getAttribute("data-seat"))
            if(!state.seatinglist[seat]||state.seatinglist[seat]==false){
                return
            }
            let entered=num(this.value)
            state.seatinglist[seat]["chip"]=quickstackunit=="bb"?bbToChips(entered):roundchip(entered)
            state.seatinglist[seat]["unknownchip"]=false
            savecache()
            renderAll()
        })
    }
    let unknowns=document.querySelectorAll(".quickstackunknownchk")
    for(let i=0;i<unknowns.length;i=i+1){
        unknowns[i].addEventListener("change",function(){
            let seat=num(this.getAttribute("data-seat"))
            if(!state.seatinglist[seat]||state.seatinglist[seat]==false){
                return
            }
            state.seatinglist[seat]["unknownchip"]=this.checked
            savecache()
            renderAll()
        })
    }
    let occupies=document.querySelectorAll(".quickseatoccupy")
    for(let i=0;i<occupies.length;i=i+1){
        occupies[i].addEventListener("click",function(){
            quickOccupySeat(num(this.getAttribute("data-seat")))
        })
    }
    let vacates=document.querySelectorAll(".quickseatvacate")
    for(let i=0;i<vacates.length;i=i+1){
        vacates[i].addEventListener("click",function(){
            quickVacateSeat(num(this.getAttribute("data-seat")))
        })
    }
}

// ===== 快速手牌：視覺化牌桌（felt table） =====
function feltesc(s){
    return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c] })
}
// 依座位數環繞橢圓排位；Hero 轉到正下方。
function feltPos(i,n,heroOffset){
    let idx=((i-1)-heroOffset+n)%n
    let ang=(90+idx*(360/n))*Math.PI/180
    return { x: 50+42*Math.cos(ang), y: 47+43*Math.sin(ang) }
}
function feltCardHtml(c){
    let str=String(c)
    let rank=str.slice(0,str.length-1)
    let suit=str.slice(-1)
    let red=suit=="h"||suit=="d"
    let sym={ s:"♠",h:"♥",d:"♦",c:"♣" }[suit]||suit
    return `<div class="felt-pcard${red?" red":""}" data-board="1">${feltesc(rank)}<span>${sym}</span></div>`
}
function feltBoardHtml(){
    if(handfamily()!="board"){
        return `<div class="felt-boardnote" data-board="1">${handfamily()=="stud"?"點此發牌":"點此換牌"}</div>`
    }
    let flop=state.boardcard.flop||["","",""]
    let cards=[flop[0],flop[1],flop[2],state.boardcard.turn,state.boardcard.river]
    let h=""
    for(let k=0;k<5;k=k+1){
        h=h+(cards[k]?feltCardHtml(cards[k]):`<div class="felt-pcard empty" data-board="1">·</div>`)
    }
    return h
}
function renderFeltSeats(){
    let n=state.maxseat
    let toact=nextActionSeat(val("actionstreet")||firststreet())
    let heroOffset=num(state.selfseating)>0?state.selfseating-1:0
    let seatshtml=""
    for(let i=1;i<=n;i=i+1){
        let pos=feltPos(i,n,heroOffset)
        let s=state.seatinglist[i]
        let activeed=s&&s!=false&&(unknownchip(i)||0<num(s["chip"]))
        let style=`left:${pos.x.toFixed(2)}%;top:${pos.y.toFixed(2)}%`
        if(!activeed){
            seatshtml=seatshtml+`<div class="felt-seat empty" style="${style}"><div class="felt-tile empty" data-seat="${i}"><div class="felt-plus">＋</div><div class="felt-emptylbl">入座</div></div></div>`
            continue
        }
        let badges=""
        if(i==state.dealerseat){ badges=badges+`<span class="felt-b d">D</span>` }
        if(i==state.selfseating&&num(state.selfseating)>0){ badges=badges+`<span class="felt-b h">HERO</span>` }
        if(i==state.smallblindseat){ badges=badges+`<span class="felt-b sb">SB</span>` }
        if(i==state.bigblindseat){ badges=badges+`<span class="felt-b bb">BB</span>` }
        let name=s["name"]||("座位 "+i)
        let acct=s["userid"]?`<span class="felt-acct">＠</span>`:""
        let stack=unknownchip(i)?`未知`:(money(chip(i))+`<span class="felt-bb">${chipsToBb(num(s["chip"]))} BB</span>`)
        seatshtml=seatshtml+`<div class="felt-seat${i==toact?" toact":""}" style="${style}"><div class="felt-tile" data-seat="${i}"><div class="felt-badges">${badges}</div><div class="felt-name">${feltesc(name)}${acct}</div><div class="felt-stack">${stack}</div></div></div>`
    }
    let html=`<div class="felt-table"><div class="felt"><div class="felt-center"><div class="felt-pot">底池 ${money(totalPot())}</div><div class="felt-board" id="feltboard">${feltBoardHtml()}</div></div>${seatshtml}</div><div class="felt-hint">點空位加入選手・點選手可改碼量與設定・下方按鍵記錄動作（可移除復原）</div></div>`
    sethtml("seatlist",html)
    bindFeltSeats()
}
function bindFeltSeats(){
    let tiles=document.querySelectorAll(".felt-tile")
    for(let i=0;i<tiles.length;i=i+1){
        tiles[i].addEventListener("click",function(){
            if(loadingguard()){ return }
            let seat=num(this.getAttribute("data-seat"))
            let s=state.seatinglist[seat]
            let activeed=s&&s!=false&&(unknownchip(seat)||0<num(s["chip"]))
            if(activeed){ openSeatMenu(seat) }else{ openAddPlayer(seat) }
        })
    }
    let boards=document.querySelectorAll("#feltboard [data-board]")
    for(let i=0;i<boards.length;i=i+1){
        boards[i].addEventListener("click",function(){
            if(loadingguard()){ return }
            if(handfamily()=="board"){ openBoardEditor() }else{ openDealDrawEditor() }
        })
    }
}
function openFeltPopover(inner){
    let modal=doccreate("div")
    modal.className="felt-popover"
    modal.innerHTML=`<div class="felt-pop-body">${inner}</div>`
    ptlockpagescroll()
    document.body.appendChild(modal)
    modal.addEventListener("click",function(e){ if(e.target===modal){ ptremovescrollcover(modal) } })
    return modal
}
function feltBindUnits(modal,unitref){
    let units=modal.querySelectorAll(".felt-unit")
    for(let i=0;i<units.length;i=i+1){
        units[i].addEventListener("click",function(){
            unitref.u=this.getAttribute("data-unit")
            for(let j=0;j<units.length;j=j+1){ units[j].classList.toggle("on",units[j]==this) }
        })
    }
}
function feltStakeChips(modal,unitref){
    let v=num(modal.querySelector(".felt-stake").value)
    return unitref.u=="bb"?bbToChips(v):roundchip(v)
}
// 入座 / 改名：可輸入名字或搜尋帳號，並設定起始碼量。
function openAddPlayer(seat){
    let ex=state.seatinglist[seat]
    let exActive=ex&&ex!=false&&(unknownchip(seat)||0<num(ex["chip"]))
    let unitref={ u:quickstackunit }
    let prename=exActive?(ex["name"]||""):""
    let prestake=exActive&&!unknownchip(seat)?(unitref.u=="bb"?chipsToBb(num(ex["chip"])):num(ex["chip"])):"100"
    let modal=openFeltPopover(`
        <h3 class="felt-pop-title">座位 ${seat} · ${exActive?"編輯選手":"入座"}</h3>
        <p class="felt-pop-desc">邊記邊設定，不必回牌桌頁。</p>
        <div class="felt-tabs">
            <div class="felt-tab on" data-mode="name">輸入名字</div>
            <div class="felt-tab" data-mode="acct">搜尋帳號</div>
        </div>
        <div class="felt-pane" data-pane="name"><input class="felt-inp feltname" placeholder="例：黑衣哥、光頭" value="${feltesc(prename)}" autocomplete="off"></div>
        <div class="felt-pane hidden" data-pane="acct"><input class="felt-inp feltacct" placeholder="輸入名字或選手 ID…" autocomplete="off"><div class="felt-results feltresults"></div></div>
        <div class="felt-field"><label>起始碼量</label><div class="felt-stakerow"><input type="number" class="felt-inp felt-stake" min="0" step="any" inputmode="decimal" value="${prestake}"><span class="felt-unit ${unitref.u=="bb"?"on":""}" data-unit="bb">BB</span><span class="felt-unit ${unitref.u=="chip"?"on":""}" data-unit="chip">計分牌</span></div></div>
        <div class="felt-pop-foot"><input type="button" class="felt-btn feltcancel" value="取消"><input type="button" class="felt-btn primary feltadd" value="${exActive?"更新":"加入座位"}"></div>
    `)
    let mode={ m:"name" }
    let tabs=modal.querySelectorAll(".felt-tab")
    for(let i=0;i<tabs.length;i=i+1){
        tabs[i].addEventListener("click",function(){
            mode.m=this.getAttribute("data-mode")
            for(let j=0;j<tabs.length;j=j+1){ tabs[j].classList.toggle("on",tabs[j]==this) }
            modal.querySelector('[data-pane="name"]').classList.toggle("hidden",mode.m!="name")
            modal.querySelector('[data-pane="acct"]').classList.toggle("hidden",mode.m!="acct")
        })
    }
    feltBindUnits(modal,unitref)
    let acctinp=modal.querySelector(".feltacct")
    let results=modal.querySelector(".feltresults")
    acctinp.addEventListener("input",function(){
        let kw=this.value.trim()
        if(!kw){ results.innerHTML=""; return }
        api("GET","searchusers?keyword="+encodeURIComponent(kw),null,function(data){
            if(!data||!data["success"]){ return }
            let rows=data["data"]||[]
            let h=""
            for(let r=0;r<rows.length;r=r+1){
                let row=rows[r]
                h=h+`<div class="felt-result" data-id="${row["id"]}" data-name="${feltesc(row["name"]||"")}" data-spid="${row["sessionplayerid"]||""}"><div><div class="felt-rn">${feltesc(row["name"]||"-")}</div><div class="felt-rid">${feltesc(row["playerid"]||"")}</div></div></div>`
            }
            if(!h){ h=`<div class="felt-result" style="cursor:default;color:#87998f">找不到，改用「輸入名字」。</div>` }
            results.innerHTML=h
            let picks=results.querySelectorAll(".felt-result[data-id]")
            for(let p=0;p<picks.length;p=p+1){
                picks[p].addEventListener("click",function(){
                    setSeatPlayer(seat,{ name:this.getAttribute("data-name"), userid:num(this.getAttribute("data-id"))||null, sessionplayerid:num(this.getAttribute("data-spid"))||null, chip:feltStakeChips(modal,unitref), unit:unitref.u })
                    ptremovescrollcover(modal)
                })
            }
        })
    })
    modal.querySelector(".feltcancel").addEventListener("click",function(){ ptremovescrollcover(modal) })
    modal.querySelector(".feltadd").addEventListener("click",function(){
        let name=mode.m=="name"?(modal.querySelector(".feltname").value.trim()||"未命名"):(acctinp.value.trim()||"未命名")
        setSeatPlayer(seat,{ name:name, chip:feltStakeChips(modal,unitref), unit:unitref.u })
        ptremovescrollcover(modal)
    })
    setTimeout(function(){ let f=modal.querySelector(".feltname"); if(f){ f.focus() } },50)
}
function setSeatPlayer(seat,opts){
    if(opts.unit){ quickstackunit=opts.unit }
    let hasbb=num(state.bigblind)>0
    let chipv=opts.chip!=null?opts.chip:(hasbb?bbToChips(100):0)
    state.seatinglist[seat]={ chip:chipv,unknownchip:!!opts.unknown,name:opts.name||"",userid:opts.userid||null,sessionplayerid:opts.sessionplayerid||null,banned:false,specialbutton:"" }
    rebuildDefaultBets()
}
// 已入座座位的設定選單：改碼量 / 改名綁帳號 / 設 Hero / 設 Dealer / 離座。
function openSeatMenu(seat){
    let s=state.seatinglist[seat]
    let name=s["name"]||("座位 "+seat)
    let unitref={ u:quickstackunit }
    let stakeval=unknownchip(seat)?"":(unitref.u=="bb"?chipsToBb(num(s["chip"])):num(s["chip"]))
    let modal=openFeltPopover(`
        <h3 class="felt-pop-title">${feltesc(name)}</h3>
        <p class="felt-pop-desc">座位 ${seat}${s["userid"]?" · 已綁帳號":" · 臨時名字"}</p>
        <div class="felt-field"><label>起始碼量</label><div class="felt-stakerow"><input type="number" class="felt-inp felt-stake" min="0" step="any" inputmode="decimal" value="${stakeval}"><span class="felt-unit ${unitref.u=="bb"?"on":""}" data-unit="bb">BB</span><span class="felt-unit ${unitref.u=="chip"?"on":""}" data-unit="chip">計分牌</span><input type="button" class="felt-btn feltstakesave" value="更新" style="flex:none;padding:8px 14px"></div></div>
        <div class="felt-menu" style="margin-top:12px">
            <div class="felt-mi feltrename">✎ 改名 / 綁定帳號</div>
            <div class="felt-mi felthero">⭐ 設為 Hero</div>
            <div class="felt-mi feltdealer">🔘 設為 Dealer</div>
            <div class="felt-mi feltunknown">❓ 標記未知碼量</div>
            <div class="felt-mi danger feltvacate">✕ 離座</div>
        </div>
        <div class="felt-pop-foot"><input type="button" class="felt-btn feltclose" value="關閉"></div>
    `)
    feltBindUnits(modal,unitref)
    modal.querySelector(".feltstakesave").addEventListener("click",function(){
        let v=num(modal.querySelector(".felt-stake").value)
        state.seatinglist[seat]["chip"]=unitref.u=="bb"?bbToChips(v):roundchip(v)
        state.seatinglist[seat]["unknownchip"]=false
        ptremovescrollcover(modal); savecache(); renderAll()
    })
    modal.querySelector(".feltrename").addEventListener("click",function(){ ptremovescrollcover(modal); openAddPlayer(seat) })
    modal.querySelector(".felthero").addEventListener("click",function(){ ptremovescrollcover(modal); feltSetHero(seat) })
    modal.querySelector(".feltdealer").addEventListener("click",function(){ ptremovescrollcover(modal); state.dealerseat=seat; rebuildDefaultBets() })
    modal.querySelector(".feltunknown").addEventListener("click",function(){ state.seatinglist[seat]["unknownchip"]=true; ptremovescrollcover(modal); savecache(); renderAll() })
    modal.querySelector(".feltvacate").addEventListener("click",function(){ ptremovescrollcover(modal); quickVacateSeat(seat) })
    modal.querySelector(".feltclose").addEventListener("click",function(){ ptremovescrollcover(modal) })
}
function feltSetHero(seat){
    let old=state.selfseating
    if(state.showdowndata[old]&&state.showdowndata[old]["heroed"]){ delete state.showdowndata[old] }
    state.selfseating=seat
    cacheset("heromanual","true")
    savecache(); renderAll()
}

// 快速紀錄：讓某座位入座（預設 100BB 起始碼量；無大盲時先標未知碼量）。
function quickOccupySeat(seat){
    if(seat<1||seat>state.maxseat){
        return
    }
    let hasbb=num(state.bigblind)>0
    state.seatinglist[seat]={
        chip: hasbb?bbToChips(100):0,
        unknownchip: !hasbb,
        name: "",
        userid: null,
        sessionplayerid: null,
        banned: false,
        specialbutton: ""
    }
    rebuildDefaultBets()
}

// 快速紀錄：讓某座位離座（清空）；若為 Dealer / Hero，renderSeatSelects 會自動改指到其他在局座位。
function quickVacateSeat(seat){
    if(!state.seatinglist[seat]||state.seatinglist[seat]==false){
        return
    }
    state.seatinglist[seat]=false
    rebuildDefaultBets()
}

function renderGameTypes(){
    if(!state.handgametype){
        state.handgametype=defaultGameType()
    }
    let html=""
    for(let i=0;i<state.gametypes.length;i=i+1){
        let row=state.gametypes[i]
        let code=String(row["code"]||"")
        let enableded=handgameenabled(code)
        // 已實作的用 handgame 註冊表的中文名；未實作的退回後端 description（中文）並標記未支援、disabled
        let label=enableded?handgamename(code):(row["description"]||row["name"]||code)
        if(!enableded){
            label=label+"（未支援）"
        }
        html=html+`<option value="${escapehtml(code)}"${enableded?"":" disabled"}>${escapehtml(label)}</option>`
    }
    if(!html){
        let code=state.handgametype||"HE"
        html=`<option value="${code}">${handgamename(code)}</option>`
    }
    // 實際紀錄必須是已實作的類型；若場次預設是未支援類型，退回第一個已實作（德州）
    if(!handgameenabled(state.handgametype)){
        state.handgametype=handgamefirstenabled()
    }
    sethtml("handgametype",html)
    setval("handgametype",state.handgametype)
}

function defaultGameType(){
    for(let i=0;i<state.gametypes.length;i=i+1){
        if(String(state.gametypes[i]["id"])==String(state.row["gametypeid"])){
            if(isMixedGameType(state.gametypes[i])){
                return holdemGameType()
            }
            return state.gametypes[i]["code"]
        }
    }
    return holdemGameType()
}

function isMixedGameType(item){
    let text=String((item&&item["code"]?item["code"]:"")+" "+(item&&item["name"]?item["name"]:"")).toLowerCase()
    if(text.indexOf("mix")>=0||text.indexOf("mixed")>=0||text.indexOf("混合")>=0){
        return true
    }
    return false
}

function holdemGameType(){
    for(let i=0;i<state.gametypes.length;i=i+1){
        let code=String(state.gametypes[i]["code"]||"").toLowerCase()
        let name=String(state.gametypes[i]["name"]||"").toLowerCase()
        if(code=="he"||code=="holdem"||code=="hold'em"||name.indexOf("hold")>=0||name.indexOf("德州")>=0){
            return state.gametypes[i]["code"]
        }
    }
    if(state.gametypes.length){
        return state.gametypes[0]["code"]
    }
    return "HE"
}

function usableLevel(level){
    if(!level){
        return false
    }
    let leveltype=String(level["type"]||level["leveltype"]||"").toLowerCase()
    if(leveltype=="break"||leveltype=="rest"||level["isbreak"]==true){
        return false
    }
    return 0<num(level["smallblind"])&&0<num(level["bigblind"])
}

function blindLevelNumber(levelid){
    let count=0
    for(let i=0;i<state.blindstructures.length;i=i+1){
        if(usableLevel(state.blindstructures[i])){
            count=count+1
            if(String(state.blindstructures[i]["id"])==String(levelid)){
                return count
            }
        }
    }
    return count+1
}

function matchBlindLevel(){
    // 盲注值對得上某個結構級別就回傳該級別 id，否則 custom（讓編輯/載入優先用結構而非跳回自填）
    for(let i=0;i<state.blindstructures.length;i=i+1){
        let level=state.blindstructures[i]
        if(usableLevel(level)&&num(level["smallblind"])==num(state.smallblind)&&num(level["bigblind"])==num(state.bigblind)&&num(level["ante"]||level["bigblindante"])==num(state.ante)){
            return level["id"]
        }
    }
    return "custom"
}

function renderBlindLevels(){
    let html=`<option value="custom">自填</option>`
    let idmatch=false
    let levelno=0
    for(let i=0;i<state.blindstructures.length;i=i+1){
        let level=state.blindstructures[i]
        if(usableLevel(level)){
            levelno=levelno+1
            if(String(level["id"])==String(state.blindlevel)){
                idmatch=true
            }
            html=html+`<option value="${level["id"]}">LV${levelno} ${level["smallblind"]}/${level["bigblind"]} (${level["ante"]||level["bigblindante"]||0})</option>`
        }
    }
    if(!idmatch){
        // 目前選的不是有效結構級別（custom 或舊 id 對不上）：盲注值對得上結構就用結構級別，否則才自填
        state.blindlevel=matchBlindLevel()
    }
    sethtml("blindlevelselect",html)
    setval("blindlevelselect",state.blindlevel)
    setval("handsmallblind",state.smallblind)
    setval("handbigblind",state.bigblind)
    setval("handante",state.ante)
    settext("antelabel",state.row["antemode"]=="ante"?"Ante":"BB Ante")
}

function savetimerbankstate(silented,callback){
    if(timebanksyncbusy){
        if(callback){
            callback(false)
        }
        return
    }
    timebanksyncbusy=true
    api("PUT","savetimebank/"+tableid,{
        state: state.timebank
    },function(result){
        timebanksyncbusy=false
        if(result["success"]&&result["data"]&&result["data"]["state"]){
            applytimebankstate(result["data"]["state"])
        }else if(!silented){
            pttoast(result["data"]||"Timebank 儲存失敗","error")
        }
        if(callback){
            callback(result["success"]==true)
        }
        renderTimebank()
    })
}

function loadtimebank(callback){
    api("GET","gettimebank/"+tableid,null,function(result){
        if(result["success"]&&result["data"]){
            if(result["data"]["defaults"]){
                // 場次有設定 timebank 秒數(>0)才視為啟用 → 下注畫面才顯示 timebank
                state.timebankconfigured=num(result["data"]["defaults"]["defaultTimebankSeconds"])>0
                state.defaulttimebankseconds=Math.max(1,num(result["data"]["defaults"]["defaultTimebankSeconds"])||state.defaulttimebankseconds||15)
                state.timebanksoundon=result["data"]["defaults"]["timebankSoundOn"]!=false
            }
            if(result["data"]["state"]){
                applytimebankstate(result["data"]["state"])
            }else{
                applytimebankstate({
                    enabled: false,
                    seatno: 0,
                    durationseconds: timebankcurrentseconds(),
                    remainingseconds: timebankcurrentseconds()
                })
            }
        }else{
            applytimebankstate({
                enabled: false,
                seatno: 0,
                durationseconds: timebankcurrentseconds(),
                remainingseconds: timebankcurrentseconds()
            })
        }
        timebankloaded=true
        syncurrenttimebankseat(true)
        renderTimebank()
        if(callback){
            callback()
        }
    })
}

function createtimebankstate(seat,seconds){
    let duration=Math.max(1,num(seconds)||timebankcurrentseconds())
    return normaltimebankstate({
        enabled: 0<seat,
        seatno: seat,
        durationseconds: duration,
        remainingseconds: duration,
        endtime: "",
        running: false,
        expired: false,
        startedby: state.context&&state.context["currentuser"]?num(state.context["currentuser"]["id"]):0,
        starttime: "",
        updatedtime: ""
    })
}

function syncurrenttimebankseat(silented){
    let seat=timebankseat()
    let currentseat=num(state.timebank["seatno"])
    if(seat==currentseat&&state.timebank["enabled"]){
        return
    }
    state.timebank=createtimebankstate(seat,timebankcurrentseconds())
    state.timebankalerted=false
    if(timebankloaded){
        savetimerbankstate(silented)
    }
}

function starttimebank(){
    let seat=timebankseat()
    if(!seat){
        pttoast("目前沒有可操作座位","warn")
        return
    }
    if(num(state.timebank["seatno"])!=seat){
        state.timebank=createtimebankstate(seat,timebankcurrentseconds())
    }
    let remaining=Math.max(1,timebankremainingseconds())
    state.timebank["enabled"]=true
    state.timebank["seatno"]=seat
    state.timebank["running"]=true
    state.timebank["expired"]=false
    state.timebank["remainingseconds"]=remaining
    state.timebank["endtime"]=new Date(Date.now()+remaining*1000).toISOString()
    state.timebank["starttime"]=new Date().toISOString()
    state.timebank["startedby"]=state.context&&state.context["currentuser"]?num(state.context["currentuser"]["id"]):0
    state.timebankalerted=false
    savetimerbankstate(false)
    renderTimebank()
}

function pausetimebank(){
    state.timebank["remainingseconds"]=timebankremainingseconds()
    state.timebank["running"]=false
    state.timebank["endtime"]=""
    state.timebank["expired"]=false
    savetimerbankstate(false)
    renderTimebank()
}

function resettimebank(seconds,silented){
    let seat=timebankseat()
    state.timebank=createtimebankstate(seat,seconds)
    state.timebankalerted=false
    if(timebankloaded){
        savetimerbankstate(silented)
    }
    renderTimebank()
}

function capturetimebankforaction(seat){
    if(num(state.timebank["seatno"])!=num(seat)){
        return 0
    }
    let used=timebankusedseconds()
    state.timebank["remainingseconds"]=timebankremainingseconds()
    state.timebank["running"]=false
    state.timebank["endtime"]=""
    state.timebank["expired"]=false
    return used
}

function polltimebank(){
    if(!timebankloaded||timebanksyncbusy||document.visibilityState=="hidden"){
        return
    }
    api("GET","gettimebank/"+tableid,null,function(result){
        if(result["success"]&&result["data"]&&result["data"]["state"]){
            applytimebankstate(result["data"]["state"])
            if(result["data"]["defaults"]){
                state.defaulttimebankseconds=Math.max(1,num(result["data"]["defaults"]["defaultTimebankSeconds"])||state.defaulttimebankseconds||15)
                state.timebanksoundon=result["data"]["defaults"]["timebankSoundOn"]!=false
            }
            renderTimebank()
        }
    })
}

function renderTimebank(){
    if(!dom("timebankPanel")){
        return
    }
    // 場次沒設 timebank 秒數就整個隱藏（下注畫面不顯示）
    dom("timebankPanel").style.display=state.timebankconfigured?"":"none"
    if(!state.timebankconfigured){
        return
    }
    let seat=timebankseat()
    let remaining=timebankremainingseconds()
    if(state.timebank["running"]&&remaining<=0){
        state.timebank["running"]=false
        state.timebank["expired"]=true
        state.timebank["remainingseconds"]=0
        state.timebank["endtime"]=""
        savetimerbankstate(true)
    }
    dom("timebankPanel").classList.toggle("running",state.timebank["running"]==true)
    dom("timebankPanel").classList.toggle("expired",state.timebank["expired"]==true)
    settext("timebankStatus",timebankstatuslabel())
    settext("timebankCountdown",String(remaining))
    if(dom("timebankStart")){
        dom("timebankStart").disabled=state.loadinged||!seat||state.timebank["running"]==true
    }
    if(dom("timebankPause")){
        dom("timebankPause").disabled=state.loadinged||state.timebank["running"]!=true
    }
    if(dom("timebankReset")){
        dom("timebankReset").disabled=state.loadinged||!seat
    }
    if(state.timebank["expired"]==true&&!state.timebankalerted){
        state.timebankalerted=true
        timebankbeep()
    }
}

// timebank 面板只存在於 quickhand.html（quickmode）；newedithand.html 已移除該區域，
// 因此非 quickmode 時不啟動 render 與輪詢，免得對沒有 UI 的頁面持續發背景請求。
function starttimebankloops(){
    if(!quickmode){
        return
    }
    if(!timebankrenderid){
        timebankrenderid=setInterval(function(){
            renderTimebank()
        },500)
    }
    if(!timebankpollid){
        timebankpollid=setInterval(function(){
            polltimebank()
        },3000)
    }
}

function actionLabel(action){
    if(action=="ante"){
        return "Ante"
    }
    if(action=="blind"){
        return "盲注"
    }
    if(action=="bringin"){
        return "帶入注"
    }
    if(action=="deadsmallblind"){
        return "DEAD SMALL BLIND"
    }
    if(action=="check"){
        return "Check"
    }
    if(action=="call"){
        return "Call"
    }
    if(action=="bet"){
        return "Bet"
    }
    if(action=="raise"){
        return "Raise"
    }
    if(action=="allin"){
        return "ALLIN"
    }
    if(action=="fold"){
        return "Fold"
    }
    return action
}

function renderActions(){
    let streetdefs=handstreets()
    let streets=[]
    for(let s=0;s<streetdefs.length;s=s+1){
        streets.push([streetdefs[s]["key"],streetdefs[s]["name"]])
    }
    let html=""
    for(let s=0;s<streets.length;s=s+1){
        let list=state.bittingdata[streets[s][0]]||[]
        let seatpot=[null]
        for(let seat=1;seat<=state.maxseat;seat=seat+1){
            seatpot.push(0)
        }
        if(list.length){
            html=html+`<div class="newhand-actiongroup"><strong>${streets[s][1]}</strong></div>`
        }
        for(let i=0;i<list.length;i=i+1){
            let action=list[i]
            let chip=num(action["chip"])
            let chiptext=""
            let timebanktext=""
            if(action["action"]=="deadsmallblind"){
                if(0<num(action["deadamount"])){
                    chiptext=" · 死錢 "+money(num(action["deadamount"]))
                }
            }else if(action["action"]!="ante"){
                seatpot[num(action["seat"])]=num(seatpot[num(action["seat"])])+chip
                if(0<chip){
                    chiptext=" · "+money(chip)+" ("+money(seatpot[num(action["seat"])])+")"
                }
            }else if(0<chip){
                chiptext=" · "+money(chip)
            }
            if(0<num(action["timebank"])){
                timebanktext=" · TB "+num(action["timebank"])+"s"
            }
            html=html+`
                <div class="newhand-actionitem">
                    <div>${seatlabel(action["seat"])} · ${actionLabel(action["action"])}${chiptext}${timebanktext}${action["isBlind"]?" · 預設":""}</div>
                    <input type="button" class="removeaction" data-street="${streets[s][0]}" data-index="${i}" value="移除">
                </div>
            `
        }
    }
    if(!html){
        html=`<div class="newhand-actionitem">尚未有下注動作</div>`
    }
    sethtml("actionlist",html)
    renderQuickAction()
    let btns=document.querySelectorAll(".removeaction")
    for(let i=0;i<btns.length;i=i+1){
        btns[i].addEventListener("click",function(){
            let street=this.getAttribute("data-street")
            let index=num(this.getAttribute("data-index"))
            state.bittingdata[street].splice(index,1)
            savecache()
            renderAll()
        })
    }
}

function renderQuickAction(){
    let street=val("actionstreet")||firststreet()
    let info=roundFinishInfo(street)
    syncurrenttimebankseat(true)
    if(info["finished"]){
        settext("currentactionseat","Seat -")
        settext("currentactionmeta",info["message"])
        setval("quickcheckcall","Check / Call")
        setval("quickraise","Bet / Raise")
        dom("quickcheckcall").disabled=true
        dom("quickraise").disabled=true
        dom("quickfold").disabled=true
        renderTimebank()
        return
    }
    dom("quickcheckcall").disabled=false
    dom("quickraise").disabled=false
    dom("quickfold").disabled=false
    let seat=nextActionSeat(street)
    let call=callAmount(street,seat)
    if(!seat){
        settext("currentactionseat","Seat -")
        settext("currentactionmeta","目前沒有可操作座位")
        setval("quickcheckcall","Check / Call")
        setval("quickraise","Bet / Raise")
        renderTimebank()
        return
    }
    settext("currentactionseat",seatlabel(seat))
    settext("currentactionmeta","已投入 "+money(streetPot(street)[seat]||0)+"，需跟注 "+money(call))
    setval("quickcheckcall",call>0?"Call "+money(call):"Check")
    setval("quickraise",maxStreetBet(street)>0?"Raise":"Bet")
    renderTimebank()
}

function renderShowdown(){
    syncHeroShowdown()
    let first=showFirstSeat()
    settext("showorderhint","建議 "+seatlabel(first)+" 先 show；現場可選擇其他選手 show 或 muck。")
    let seats=activeSeats()
    let pot=positionPot()
    let html=""
    for(let i=0;i<seats.length;i=i+1){
        let seat=seats[i]
        let data=state.showdowndata[seat]||{ shown: false,mucked: false }
        let cardstext=data["mucked"]?"MUCK":cardsjoinlabel(handcardobjtolist(data,herogamecount()))
        let syncedtext=seat==state.selfseating&&num(state.selfseating)>0?" · Hero 同步":""
        let endtext=money(chip(seat)-num(pot[seat])+num(state.winnerprice[seat]))
        if(unknownchip(seat)){
            let result=num(state.winnerprice[seat])-num(pot[seat])
            endtext="inf."+(0<=result?"+":"")+money(result)
        }
        html=html+`
            <div class="showdown-row">
                <div>${seatlabel(seat)}</div>
                <div class="showdown-cards">${cardstext}${syncedtext}</div>
                <input type="button" class="showcards" data-seat="${seat}" value="選牌">
                <input type="button" class="muckcards" data-seat="${seat}" value="Muck">
                <label><input type="checkbox" class="winnercheck" data-seat="${seat}" ${state.winner[seat]?"checked":""}> 贏家</label>
                <input type="number" class="winneramount" data-seat="${seat}" value="${num(state.winnerprice[seat])}" min="0" step="${minchip()}" inputmode="numeric" placeholder="分配">
                <div class="text-zinc-400 text-xs">投入 ${money(pot[seat]||0)} / 結束 ${endtext}</div>
            </div>
        `
    }
    sethtml("showdownlist",html)
    bindShowdown()
}

function bindShowdown(){
    let showbtns=document.querySelectorAll(".showcards")
    for(let i=0;i<showbtns.length;i=i+1){
        showbtns[i].addEventListener("click",function(){
            let seat=this.getAttribute("data-seat")
            let count=herogamecount()
            let current=state.showdowndata[seat]||{ shown: false,mucked: false }
            showCardModal(seatlabel(seat)+" show 牌",handcardobjtolist(current,count).filter(function(card){ return !!card }),count,function(arr){
                if(num(seat)==num(state.selfseating)&&num(state.selfseating)>0){
                    setherocardlist(arr)
                    syncHeroShowdown()
                    renderCards()
                    renderHeroPicker()
                }else{
                    let filled=arr.filter(function(card){ return !!card }).length==count
                    state.showdowndata[seat]=handcardlisttoobj(arr,count,{ shown: filled,mucked: false })
                }
                savecache()
                renderShowdown()
            })
        })
    }
    let muckbtns=document.querySelectorAll(".muckcards")
    for(let i=0;i<muckbtns.length;i=i+1){
        muckbtns[i].addEventListener("click",function(){
            let seat=this.getAttribute("data-seat")
            state.showdowndata[seat]={ card1: "",card2: "",shown: false,mucked: true }
            savecache()
            renderShowdown()
        })
    }
    let winners=document.querySelectorAll(".winnercheck")
    for(let i=0;i<winners.length;i=i+1){
        winners[i].addEventListener("change",function(){
            state.winnerauto={}
            state.winner[this.getAttribute("data-seat")]=this.checked
            applySidePotWinnerPrices()
            savecache()
            renderAll()
        })
    }
    let amounts=document.querySelectorAll(".winneramount")
    for(let i=0;i<amounts.length;i=i+1){
        amounts[i].addEventListener("input",function(){
            state.winnerauto={}
            state.winnerprice[this.getAttribute("data-seat")]=num(this.value)
            savecache()
            renderSummary()
        })
    }
}

function endChip(seat){
    return chip(seat)-num(positionPot()[seat]||0)+num(state.winnerprice[seat])
}

function unifiedeliminateallowed(){
    // 只有「統一紀錄手牌」且選手有綁定帳號(linkuser)的場次，送出後才會自動淘汰
    return !!(state.context&&state.context["unifiedhandrecord"]&&state.context["session"]&&state.context["session"]["linkuser"])
}

function bustedSeats(){
    let result=[]
    if(!unifiedeliminateallowed()){
        return result
    }
    let seats=activeSeats()
    for(let i=0;i<seats.length;i=i+1){
        let seat=seats[i]
        if(unknownchip(seat)){
            continue
        }
        if(endChip(seat)<=0){
            result.push(seat)
        }
    }
    return result
}

// all-in 且被跟注（≥2 人攤牌、至少 1 人 all-in）時牌面必然發到河牌，回傳仍缺的街
function allinShowdownBoardMissing(){
    let showdown=activeActionSeats()
    if(showdown.length<2){
        return []
    }
    let anyallin=false
    for(let i=0;i<showdown.length;i=i+1){
        if(allinedSeat(showdown[i])){
            anyallin=true
        }
    }
    if(!anyallin){
        return []
    }
    let bc=state.boardcard||{}
    let flop=bc.flop||[]
    let missing=[]
    if(!flop[0]||!flop[1]||!flop[2]){
        missing.push({ label: "翻牌",burnkey: "burnflop",burnlabel: "燒牌（翻牌）" })
    }
    if(!bc.turn){
        missing.push({ label: "轉牌",burnkey: "burnturn",burnlabel: "燒牌（轉牌）" })
    }
    if(!bc.river){
        missing.push({ label: "河牌",burnkey: "burnriver",burnlabel: "燒牌（河牌）" })
    }
    return missing
}

function warnings(){
    let list=[]
    if(activeSeats().length<2){
        list.push("有效選手少於 2 人。")
    }
    let busted=bustedSeats()
    for(let i=0;i<busted.length;i=i+1){
        list.push(seatlabel(busted[i])+" 計分牌歸 0，送出後將自動淘汰該選手，不需再由裁判處理。")
    }
    if(!publicrecorded()&&!herofilled()){
        list.push("Hero 手牌尚未選完整。")
    }
    let haswinner=false
    for(let seat in state.winner){
        if(state.winner[seat]){
            haswinner=true
        }
    }
    if(!haswinner){
        list.push("尚未選擇贏家。")
    }
    if(totalPot()<=0){
        list.push("下注紀錄目前沒有任何底池。")
    }
    if(minchip()>1&&totalPot()%minchip()!=0){
        list.push("總底池不是最小計分牌 "+money(minchip())+" 的倍數。")
    }
    let pot=positionPot()
    let seats=activeSeats()
    for(let i=0;i<seats.length;i=i+1){
        if(!unknownchip(seats[i])&&chip(seats[i])-num(pot[seats[i]])+num(state.winnerprice[seats[i]])<0){
            list.push(seatlabel(seats[i])+" 結束碼量小於 0。")
        }
        if(minchip()>1&&num(state.winnerprice[seats[i]])%minchip()!=0){
            list.push(seatlabel(seats[i])+" 分配金額不是最小計分牌 "+money(minchip())+" 的倍數。")
        }
    }
    let allinmissing=allinShowdownBoardMissing()
    for(let i=0;i<allinmissing.length;i=i+1){
        let m=allinmissing[i]
        if(state.boardcard&&state.boardcard[m.burnkey]){
            list.push("有選手 all-in 攤牌，但「"+m.label+"」未填、卻已填「"+m.burnlabel+"」("+state.boardcard[m.burnkey]+")，是否誤把公共牌點成燒牌？")
        }else{
            list.push("有選手 all-in 攤牌，但「"+m.label+"」尚未填，請確認牌面是否完整。")
        }
    }
    return list
}

function renderWarnings(){
    let list=warnings()
    let html=""
    if(!list.length){
        html=`<div class="newhand-ok">檢查通過，可以送出。</div>`
    }else{
        for(let i=0;i<list.length;i=i+1){
            html=html+`<div class="newhand-warning">${list[i]}</div>`
        }
    }
    sethtml("warnings",html)
}

function renderSummary(){
    let seats=activeSeats()
    let winnercount=0
    let totalwin=0
    for(let seat in state.winner){
        if(state.winner[seat]){
            winnercount=winnercount+1
        }
    }
    for(let seat in state.winnerprice){
        totalwin=totalwin+num(state.winnerprice[seat])
    }
    sethtml("summarybox","有效選手："+seats.length+" 人<br>總底池："+money(totalPot())+"<br>收益底池："+money(rewardPot())+"<br>贏家數："+winnercount+"<br>已分配："+money(totalwin)+"<br>第一次送出若有提醒會停下，再點一次可強制送出。")
}

function setloading(loadinged){
    state.loadinged=loadinged
    renderLoadingLock()
}

function loadingguard(){
    if(state.loadinged){
        pttoast("資料載入中","warn")
        return true
    }
    return false
}

function setsubmitlock(locked){
    handsubmitting=locked
    if(dom("savehand")){
        dom("savehand").disabled=locked
    }
    if(dom("saveandnext")){
        dom("saveandnext").disabled=locked
    }
}

function renderLoadingLock(){
    let selectors=[".stepnav","[data-goto]","[data-hub]","#bettingherocards","#quickfold","#quickcheckcall","#quickraise","#savehand","#saveandnext","#solvewinner","#rebuildblinds",".boardpick",".card-btn",".showcards",".muckcards",".winnercheck",".winneramount","#timebankStart","#timebankPause","#timebankReset"]
    for(let s=0;s<selectors.length;s=s+1){
        let items=document.querySelectorAll(selectors[s])
        for(let i=0;i<items.length;i=i+1){
            items[i].disabled=state.loadinged
        }
    }
    let fields=["dealerseat","selfseating","blindlevelselect","handsmallblind","handbigblind","handante","handgametype","emptybutton","deadsmallblind","actionstreet"]
    for(let i=0;i<fields.length;i=i+1){
        if(dom(fields[i])){
            dom(fields[i]).disabled=state.loadinged
        }
    }
    settext("savestatus",state.loadinged?"載入中...":(handid?"尚未更新":"尚未儲存"))
}

function renderAll(){
    normalizeboardcard()
    ensurebittingstreets()
    restoreBlindSeats()
    renderStep()
    renderStep2View()
    renderStatus()
    renderGameTypes()
    renderActionStreetSelect()
    renderBlindLevels()
    renderBlindFieldLabels()
    renderSeatSelects()
    renderSeats()
    renderCards()
    renderHeroPicker()
    renderActions()
    renderShowdown()
    renderHubStatus()
    renderWarnings()
    renderSummary()
    renderTimebank()
    renderLoadingLock()
}

// 依下注制切換第一步的欄位標籤：梭哈（ante-bringin）把「小盲」改成「帶入注」並隱藏「大盲」，
// 其餘（盲注制）維持小盲 / 大盲。前注欄位標籤仍由 renderBlindLevels 依 antemode 設定。
function renderBlindFieldLabels(){
    let stud=handgameblindtype(state.handgametype)=="ante-bringin"
    settext("smallblindlabel",stud?"帶入注":"小盲")
    if(dom("bigblindfield")){
        dom("bigblindfield").classList.toggle("hidden",stud)
    }
    if(stud){
        settext("antelabel","Ante")
    }
}

// 依家族的 handstreets() 動態填 #actionstreet 下拉；保留目前選取（若仍有效）。
// 梭哈顯示 3rd~7th、換牌顯示換牌前 / 第 n 次換牌、社區牌沿用翻牌前~河牌圈。
function renderActionStreetSelect(){
    let sel=dom("actionstreet")
    if(!sel){
        return
    }
    let streetdefs=handstreets()
    let keys=handstreetkeys()
    let current=sel.value
    let html=""
    for(let i=0;i<streetdefs.length;i=i+1){
        html=html+`<option value="${streetdefs[i]["key"]}">${streetdefs[i]["name"]}</option>`
    }
    sel.innerHTML=html
    if(current&&keys.indexOf(current)>=0){
        sel.value=current
    }else{
        sel.value=firststreet()
    }
}

function renderStep2View(){
    let views=["hub","betting","result"]
    if(views.indexOf(state.step2view)<0){
        state.step2view="hub"
    }
    for(let i=0;i<views.length;i=i+1){
        let el=dom("step2"+views[i])
        if(el){
            el.classList.toggle("active",views[i]==state.step2view)
        }
    }
}

function herocardlabel(){
    if(publicrecorded()){
        return "公共紀錄"
    }
    return cardsjoinlabel(herocardlist())
}

function boardcardlabel(){
    let parts=[]
    let flop=state.boardcard.flop||["","",""]
    for(let i=0;i<flop.length;i=i+1){
        if(flop[i]){
            parts.push(flop[i])
        }
    }
    if(state.boardcard.turn){
        parts.push(state.boardcard.turn)
    }
    if(state.boardcard.river){
        parts.push(state.boardcard.river)
    }
    return parts.length?parts.join(" "):"未選"
}

function renderHubStatus(){
    let street=val("actionstreet")||firststreet()
    let streetname=handstreetname(street)
    let info=roundFinishInfo(street)
    let seat=nextActionSeat(street)
    let betinfo=info["finished"]?"本街已結束":(seat?seatlabel(seat)+" 行動中":"-")
    let family=handfamily()
    settext("hubboardtitle",family=="board"?"公共牌":(family=="stud"?"發牌":"換牌"))
    settext("hubherocards",herocardlabel())
    settext("hubboardcards",family=="board"?boardcardlabel():dealdrawlabel())
    settext("hubbetinfo",streetname+"・"+betinfo)
    sethtml("hubstatus",`
        <div class="newhand-hubstatusitem"><span>街別</span><strong>${streetname}</strong></div>
        <div class="newhand-hubstatusitem"><span>底池</span><strong>${money(totalPot())}</strong></div>
        <div class="newhand-hubstatusitem"><span>剩餘選手</span><strong>${activeActionSeats().length}</strong></div>
        <div class="newhand-hubstatusitem"><span>下一位</span><strong>${seat?seatlabel(seat):"-"}</strong></div>
    `)
}

function collectWinnerArray(){
    let data=[null]
    for(let i=1;i<=state.maxseat;i=i+1){
        data.push(state.winner[i]==true||state.winner[String(i)]==true)
    }
    return data
}

function collectWinnerPrice(){
    let data=[null]
    for(let i=1;i<=state.maxseat;i=i+1){
        data.push(num(state.winnerprice[i]||state.winnerprice[String(i)]))
    }
    return data
}

function collectSeating(){
    let data=[null]
    for(let i=1;i<=state.maxseat;i=i+1){
        if(state.seatinglist[i]&&state.seatinglist[i]!=false){
            let seat=state.seatinglist[i]
            let special=""
            if(state.emptybuttoned&&i==state.dealerseat){
                special="EMPTY_BUTTON"
            }
            if(state.deadsmallblinded&&i==state.smallblindseat){
                special="DEAD_SMALLBLIND"
            }
            if(unknownchip(i)){
                if(special){
                    special=special+"|UNKNOWN_CHIP"
                }else{
                    special="UNKNOWN_CHIP"
                }
            }
            data.push({
                chip: startchip(i),
                unknownchip: unknownchip(i),
                name: seat["name"]||"",
                userid: seat["userid"]||null,
                sessionplayerid: seat["sessionplayerid"]||null,
                banned: seat["banned"]||false,
                specialbutton: special
            })
        }else{
            data.push(false)
        }
    }
    return data
}

// 家族專屬資料（board 家族為空）：換牌的丟 / 補牌紀錄、梭哈各座位明 / 暗牌對照。
// 後端存成單一 familydatajson 欄位，與 handcard / boardcard 解構分開，不影響既有社區牌流程。
function buildFamilyData(){
    let family=handfamily()
    if(family=="board"){
        return {}
    }
    let data={
        family: family,
        low: handgameislow(state.handgametype),
        drawcount: handgamedrawcount(state.handgametype)
    }
    if(family=="draw"){
        data["draws"]=state.draws||{}
    }
    if(family=="stud"){
        let exposed={}
        if(num(state.selfseating)>0&&state.handcard&&state.handcard["exposed"]){
            exposed[state.selfseating]=state.handcard["exposed"]
        }
        for(let seat in state.showdowndata){
            if(state.showdowndata[seat]&&state.showdowndata[seat]["exposed"]){
                exposed[seat]=state.showdowndata[seat]["exposed"]
            }
        }
        data["exposed"]=exposed
    }
    return data
}

function payload(){
    syncHeroShowdown()
    let handcard=state.handcard
    if(publicrecorded()){
        handcard={}
    }
    return {
        recordtype: quickmode?"quickhand":"hand",
        familydata: buildFamilyData(),
        dealerseat: num(state.dealerseat),
        selfseating: num(state.selfseating),
        handcard: handcard,
        boardcard: state.boardcard,
        bittingdata: state.bittingdata,
        seatinglist: collectSeating(),
        showdowndata: state.showdowndata,
        winner: collectWinnerArray(),
        winnerprice: collectWinnerPrice(),
        ps: val("ps"),
        note: val("ps"),
        totalpot: totalPot(),
        positionpot: positionPot(),
        gametype: val("handgametype")||state.handgametype,
        blindlevel: val("blindlevelselect")||state.blindlevel,
        levelid: val("blindlevelselect")=="custom"?0:num(val("blindlevelselect")),
        smallblind: num(val("handsmallblind")),
        bigblind: num(val("handbigblind")),
        bigblindante: state.row["antemode"]=="ante"?0:num(val("handante")),
        ante: state.row["antemode"]=="ante"?num(val("handante")):0,
        emptybutton: state.emptybuttoned,
        deadsmallblind: state.deadsmallblinded,
        actionsjson: []
    }
}

function warningKey(){
    return JSON.stringify(warnings())
}

function saveHand(nexted){
    let key=warningKey()
    if(warnings().length&&confirmkey!=key){
        confirmkey=key
        renderWarnings()
        pttoast("有提醒事項，再點一次送出可強制儲存","warn")
        return
    }
    if(handsubmitting){
        return
    }
    setsubmitlock(true)
    settext("savestatus",handid?"更新中...":"儲存中...")
    let data=payload()
    if(handid){
        api("PUT","edithand/"+handid,data,function(result){
            if(result["success"]){
                leaveguard.clear()
                pttoast("已更新","success")
                href("table.html?id="+tableid+"#2")
            }else{
                setsubmitlock(false)
                settext("savestatus","更新失敗")
                pttoast(result["data"]||"更新失敗","error")
            }
        })
        return
    }
    api("POST","newhand/"+tableid,data,function(result){
        if(result["success"]){
            clearcache()
            leaveguard.clear()
            if(nexted){
                keepblindcache()
            }
            pttoast("已儲存","success")
            if(nexted){
                href("newedithand.html?tableid="+tableid)
            }else{
                href("table.html?id="+tableid+"#2")
            }
        }else{
            setsubmitlock(false)
            settext("savestatus","儲存失敗")
            pttoast(result["data"]||"儲存失敗","error")
        }
    })
}

function boardcompleteforsolve(){
    let flop=state.boardcard.flop||[]
    return !!(flop[0]&&flop[1]&&flop[2]&&state.boardcard.turn&&state.boardcard.river)
}

// 仍在局（未蓋牌）且已補齊完整 show 牌的座位，可參與自動解算 / 攤牌。
function showdownEligibleSeats(){
    let seats=[]
    let actionseats=activeActionSeats()
    for(let i=0;i<actionseats.length;i=i+1){
        if(seatcardsfull(actionseats[i])){
            seats.push(actionseats[i])
        }
    }
    return seats
}

// 「選完動作自動按解析」：手牌下注跑完時，board 家族且公共牌齊、攤牌人數 > 1 才自動解算。
// 梭哈 / 換牌（handgameautosolvable=false）一律略過，維持手動指定贏家。
function maybeAutoSolve(){
    if(!handgameautosolvable(state.handgametype)){
        return
    }
    if(!boardcompleteforsolve()){
        return
    }
    if(showdownEligibleSeats().length>1){
        runSolveWinner()
    }
}

// 把單一底池的金額分給贏家（依座位順序補足最小單位餘額）
function distributePot(pot,winners){
    if(!winners.length){
        return
    }
    let unit=minchip()
    winners=winnerOrder(winners)
    let amount=num(pot["amount"])
    let share=Math.floor(amount/winners.length/unit)*unit
    for(let i=0;i<winners.length;i=i+1){
        state.winner[winners[i]]=true
        state.winnerauto[winners[i]]=true
        state.winnerprice[winners[i]]=num(state.winnerprice[winners[i]])+share
    }
    let left=amount-share*winners.length
    for(let i=0;i<winners.length&&unit<=left;i=i+1){
        state.winnerprice[winners[i]]=num(state.winnerprice[winners[i]])+unit
        left=left-unit
    }
}

// 依序解算每個（邊）池：每池把有完整 show 牌的合格座位丟給 equity 後端，bested 者即贏家。
// 與 tool 勝率解算器共用同一個 equity 端點，奧馬哈「必用 2 張」與短牌牌型都由後端正確處理。
function solvePotQueue(queue,index,gametype,board){
    if(index>=queue.length){
        savecache()
        renderAll()
        if(selectedWinnerSeats().length){
            pttoast("已套用建議贏家","success")
        }else{
            pttoast("沒有足夠 show 牌可解算","warn")
        }
        return
    }
    let item=queue[index]
    function advance(winners){
        distributePot(item["pot"],winners)
        solvePotQueue(queue,index+1,gametype,board)
    }
    if(item["elig"].length==0){
        advance([])
        return
    }
    if(item["elig"].length==1){
        advance([item["elig"][0]])
        return
    }
    let handlist=[]
    for(let i=0;i<item["elig"].length;i=i+1){
        handlist.push(seatcardlist(item["elig"][i]))
    }
    api("POST","equity",{ gametype: gametype,handlist: handlist,board: board },function(result){
        if(!result["success"]){
            pttoast(result["data"]||"解算失敗","error")
            savecache()
            renderAll()
            return
        }
        let resultlist=(result["data"]&&(result["data"]["resultlist"]||result["data"]["results"]))||[]
        let winners=[]
        for(let i=0;i<resultlist.length;i=i+1){
            let idx=num(resultlist[i]["index"])
            if(resultlist[i]["bested"]==true&&item["elig"][idx]!=undefined){
                winners.push(item["elig"][idx])
            }
        }
        advance(winners)
    })
}

function solveWinner(){
    if(selectedWinnerSeats().length){
        ptconfirm("快速解算會覆蓋目前手動設定的贏家與分配金額，確定要繼續嗎？",function(ok){
            if(ok){
                runSolveWinner()
            }
        })
        return
    }
    runSolveWinner()
}

function runSolveWinner(){
    if(!boardcompleteforsolve()){
        pttoast("請先補齊公共牌（翻牌、轉牌、河牌）再解算","warn")
        return
    }
    let gametype=state.handgametype||"HE"
    let count=herogamecount()
    // 仍在局（未蓋牌）且有完整 show 牌的座位才能參與解算
    let showncards={}
    let actionseats=activeActionSeats()
    for(let i=0;i<actionseats.length;i=i+1){
        if(seatcardsfull(actionseats[i])){
            showncards[actionseats[i]]=true
        }
    }
    let board={
        floplist: (state.boardcard.flop||["","",""]).slice(),
        turn: state.boardcard.turn||"",
        river: state.boardcard.river||""
    }
    // 清空現有贏家與分配，重新計算
    for(let seat in state.winner){
        state.winner[seat]=false
    }
    for(let seat in state.winnerprice){
        state.winnerprice[seat]=0
    }
    state.winnerauto={}
    // 依邊池逐一解算：每池只看有完整 show 牌的合格座位
    let pots=sidePots()
    let queue=[]
    for(let p=0;p<pots.length;p=p+1){
        let elig=[]
        let eligible=pots[p]["eligible"]||[]
        for(let i=0;i<eligible.length;i=i+1){
            if(showncards[eligible[i]]){
                elig.push(eligible[i])
            }
        }
        queue.push({ pot: pots[p],elig: elig })
    }
    solvePotQueue(queue,0,gametype,board)
}

function bindEvents(){
    dom("back").href="table.html?id="+tableid+"#2"
    dom("back").addEventListener("click",function(event){
        if(event&&event.button!=0){
            return
        }
        if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
            return
        }
        event.preventDefault()
        if(!leaveguard.confirmleave()){return}
        href("table.html?id="+tableid+"#2")
    })
    dom("cleardata").addEventListener("click",function(){
        ptconfirm("確定清空暫存？",function(okayed){
            if(okayed){
                clearcache()
                href("newedithand.html?tableid="+tableid)
            }
        })
    })
    let stepnav=document.querySelectorAll(".stepnav")
    for(let i=0;i<stepnav.length;i=i+1){
        stepnav[i].addEventListener("click",function(){
            if(loadingguard()){
                return
            }
            state.step=num(this.getAttribute("data-step"))
            savecache()
            renderAll()
        })
    }
    let gotos=document.querySelectorAll("[data-goto]")
    for(let i=0;i<gotos.length;i=i+1){
        gotos[i].addEventListener("click",function(){
            if(loadingguard()){
                return
            }
            state.step=num(this.getAttribute("data-goto"))
            savecache()
            renderAll()
        })
    }
    let hubbtns=document.querySelectorAll("[data-hub]")
    for(let i=0;i<hubbtns.length;i=i+1){
        hubbtns[i].addEventListener("click",function(){
            if(loadingguard()){
                return
            }
            let target=this.getAttribute("data-hub")
            if(target=="hero"){
                openHeroPicker()
                return
            }
            if(target=="board"){
                // 社區牌家族開公共牌編輯器；梭哈 / 換牌家族改開該街的發牌 / 換牌編輯器。
                if(handfamily()=="board"){
                    openBoardEditor()
                }else{
                    openDealDrawEditor()
                }
                return
            }
            state.step2view=target
            savecache()
            renderAll()
        })
    }
    let hubcards=document.querySelectorAll(".newhand-hubbtn")
    for(let i=0;i<hubcards.length;i=i+1){
        hubcards[i].addEventListener("keydown",function(event){
            if(event.key=="Enter"||event.key==" "){
                event.preventDefault()
                this.click()
            }
        })
    }
    dom("dealerseat").addEventListener("change",function(){
        state.dealerseat=num(this.value)
        rebuildDefaultBets()
    })
    dom("selfseating").addEventListener("change",function(){
        let oldseat=state.selfseating
        if(state.showdowndata[oldseat]&&state.showdowndata[oldseat]["heroed"]){
            delete state.showdowndata[oldseat]
        }
        state.selfseating=num(this.value)
        if(state.selfseating==0){
            state.handcard={}
        }
        cacheset("heromanual","true")
        syncHeroShowdown()
        savecache()
        renderAll()
    })
    dom("blindlevelselect").addEventListener("change",function(){
        state.blindlevel=this.value
        state.cachedblinded=true
        for(let i=0;i<state.blindstructures.length;i=i+1){
            if(String(state.blindstructures[i]["id"])==String(state.blindlevel)){
                state.smallblind=num(state.blindstructures[i]["smallblind"])
                state.bigblind=num(state.blindstructures[i]["bigblind"])
                state.ante=num(state.blindstructures[i]["ante"]||state.blindstructures[i]["bigblindante"])
            }
        }
        savecache()
        rebuildDefaultBets()
    })
    let blindids=["handsmallblind","handbigblind","handante"]
    for(let i=0;i<blindids.length;i=i+1){
        dom(blindids[i]).addEventListener("input",function(){
            state.cachedblinded=true
            state.smallblind=num(val("handsmallblind"))
            state.bigblind=num(val("handbigblind"))
            state.ante=num(val("handante"))
            // 手填的盲注若剛好對上某個結構級別就選該級別，否則才 custom
            state.blindlevel=matchBlindLevel()
            savecache()
            rebuildDefaultBets()
        })
    }
    dom("handgametype").addEventListener("change",function(){
        let previous=state.handgametype
        let selected=this.value
        let prevfamily=handgamefamily(previous)
        let newfamily=handgamefamily(selected)
        let self=this
        function apply(){
            state.handgametype=selected
            if(previous!=selected){
                normalizehandcardsforgame()
            }
            if(prevfamily!=newfamily){
                resetStreetsForFamily()
            }else{
                ensurebittingstreets()
            }
            savecache()
            renderAll()
        }
        if(prevfamily!=newfamily&&hasUserBettingActions()){
            ptconfirm("切換遊戲家族會清空已輸入的下注動作與換牌 / 發牌紀錄，確定要切換嗎？",function(ok){
                if(ok){
                    apply()
                }else{
                    self.value=previous
                }
            })
            return
        }
        apply()
    })
    dom("emptybutton").addEventListener("change",function(){
        state.emptybuttoned=this.checked
        dom("emptybutton").checked=state.emptybuttoned
        rebuildDefaultBets()
    })
    dom("deadsmallblind").addEventListener("change",function(){
        state.deadsmallblinded=this.checked
        dom("deadsmallblind").checked=state.deadsmallblinded
        rebuildDefaultBets()
    })
    dom("rebuildblinds").addEventListener("click",rebuildDefaultBets)
    dom("actionstreet").addEventListener("change",function(){
        renderAll()
    })
    dom("quickcheckcall").addEventListener("click",function(){
        if(loadingguard()){
            return
        }
        let street=val("actionstreet")||firststreet()
        let seat=nextActionSeat(street)
        let amount=callAmount(street,seat)
        addQuickAction(amount>0?"call":"check",amount)
    })
    dom("quickraise").addEventListener("click",function(){
        if(loadingguard()){
            return
        }
        showRaiseModal()
    })
    dom("quickfold").addEventListener("click",function(){
        if(loadingguard()){
            return
        }
        addQuickAction("fold",0)
    })
    if(dom("timebankStart")){
        dom("timebankStart").addEventListener("click",function(){
            if(loadingguard()){
                return
            }
            starttimebank()
        })
    }
    if(dom("timebankPause")){
        dom("timebankPause").addEventListener("click",function(){
            if(loadingguard()){
                return
            }
            pausetimebank()
        })
    }
    if(dom("timebankReset")){
        dom("timebankReset").addEventListener("click",function(){
            if(loadingguard()){
                return
            }
            resettimebank(timebankcurrentseconds(),false)
        })
    }
    document.addEventListener("visibilitychange",function(){
        if(document.visibilityState=="visible"){
            polltimebank()
            renderTimebank()
        }
    })
    let boardbtns=document.querySelectorAll(".boardpick")
    for(let i=0;i<boardbtns.length;i=i+1){
        boardbtns[i].addEventListener("click",function(){
            let board=this.getAttribute("data-board")
            let index=num(this.getAttribute("data-index"))
            let current=[]
            if(board=="flopall"){
                current=state.boardcard.flop.filter(function(card){ return !!card })
            }else if(board=="flop"){
                current=state.boardcard.flop[index]?[state.boardcard.flop[index]]:[]
            }else if(board=="burnflop"||board=="burnturn"||board=="burnriver"){
                current=state.boardcard[board]?[state.boardcard[board]]:[]
            }else{
                current=state.boardcard[board]?[state.boardcard[board]]:[]
            }
            showCardModal(board=="flopall"?"Flop":board,current,board=="flopall"?3:1,function(arr){
                if(board=="flopall"){
                    state.boardcard.flop=[arr[0]||"",arr[1]||"",arr[2]||""]
                }else if(board=="flop"){
                    state.boardcard.flop[index]=arr[0]||""
                }else if(board=="burnflop"||board=="burnturn"||board=="burnriver"){
                    state.boardcard[board]=arr[0]||""
                }else{
                    state.boardcard[board]=arr[0]||""
                }
                savecache()
                renderAll()
            })
        })
    }
    dom("solvewinner").addEventListener("click",solveWinner)
    dom("savehand").addEventListener("click",function(){
        if(loadingguard()){
            return
        }
        saveHand(false)
    })
    dom("saveandnext").addEventListener("click",function(){
        if(loadingguard()){
            return
        }
        saveHand(true)
    })
    if(dom("clearhandcache")){
        dom("clearhandcache").addEventListener("click",function(){
            if(loadingguard()){
                return
            }
            ptconfirm("清空本桌尚未送出的暫存手牌資料？此動作無法復原。",function(ok){
                if(ok){
                    clearcache()
                    pttoast("已清空暫存","success")
                    href("newedithand.html?tableid="+tableid)
                }
            })
        })
    }
}

function applyRow(row){
    state.row=row
    state.maxseat=num(row["maxseat"]||9)
    state.blindstructures=row["blindstructures"]||[]
    if(row["chips"]&&row["chips"].length){
        state.chips=row["chips"]
    }
    if(state.cachedblinded){
        if(!state.handgametype){
            state.handgametype=""
        }
        return
    }
    state.smallblind=num(row["smallblind"])
    state.bigblind=num(row["bigblind"])
    state.ante=num(row["ante"]||row["bigblindante"])
    if(!state.handgametype){
        state.handgametype=""
    }
    if(!state.smallblind||!state.bigblind){
        for(let i=0;i<state.blindstructures.length;i=i+1){
            if(usableLevel(state.blindstructures[i])){
                state.blindlevel=state.blindstructures[i]["id"]
                state.smallblind=num(state.blindstructures[i]["smallblind"])
                state.bigblind=num(state.blindstructures[i]["bigblind"])
                state.ante=num(state.blindstructures[i]["ante"]||state.blindstructures[i]["bigblindante"])
                break
            }
        }
    }
}

function applyContext(context){
    state.context=context
    state.maxseat=num(context["maxseat"]||state.maxseat)
    if(context["timebankdefaults"]){
        state.defaulttimebankseconds=Math.max(1,num(context["timebankdefaults"]["defaultTimebankSeconds"])||state.defaulttimebankseconds||15)
        state.timebanksoundon=context["timebankdefaults"]["timebankSoundOn"]!=false
    }else if(context["timerstate"]){
        state.defaulttimebankseconds=Math.max(1,num(context["timerstate"]["defaultTimebankSeconds"])||state.defaulttimebankseconds||15)
        state.timebanksoundon=context["timerstate"]["timebankSoundOn"]!=false
    }
    if(context["chips"]&&context["chips"].length){
        state.chips=context["chips"]
    }
    if(context["seatmap"]){
        state.seatinglist=context["seatmap"]
    }
    for(let i=state.seatinglist.length;i<=state.maxseat;i=i+1){
        state.seatinglist.push(false)
    }
    if(!cacheget("dealerseat")){
        state.dealerseat=num(context["nextdealer"]||state.dealerseat||1)
    }
    if(presetseat){
        state.selfseating=presetseat
    }else if(unifiedpublicallowed()&&cacheget("heromanual")!="true"&&!handid){
        state.selfseating=0
    }else if(cacheget("heromanual")=="true"&&cacheget("selfseating")!=null){
        state.selfseating=num(state.selfseating)
    }else if(context["currentseat"]){
        state.selfseating=num(context["currentseat"])
    }else if(context["latesthand"]&&context["latesthand"]["selfseating"]){
        state.selfseating=num(context["latesthand"]["selfseating"])
    }else if(state.row["selfseating"]){
        state.selfseating=num(state.row["selfseating"])
    }
    if(context["timerlevel"]&&usableLevel(context["timerlevel"])&&!state.cachedblinded){
        state.blindlevel=String(context["timerlevel"]["id"]||state.blindlevel)
        state.smallblind=num(context["timerlevel"]["smallblind"]||state.smallblind)
        state.bigblind=num(context["timerlevel"]["bigblind"]||state.bigblind)
        state.ante=num(context["timerlevel"]["ante"]||context["timerlevel"]["bigblindante"]||state.ante)
    }
}

function loadGameTypes(callback){
    api("GET","gettypelist",null,function(result){
        if(result["success"]){
            state.gametypes=(result["data"]&&result["data"]["game"])?result["data"]["game"]:[]
            state.handgametype=state.handgametype||defaultGameType()
        }
        callback()
    })
}

function init(){
    if(quickmode){
        document.body.classList.add("newhand-quick")
    }
    ensurenavigationbar()
    bindEvents()
    starttimebankloops()
    setloading(true)
    if(!handid){
        loadcache()
    }
    api("GET","gettable/"+tableid,null,function(result){
        if(!result["success"]){
            pttoast(result["data"]||"讀取牌桌失敗","error")
            return
        }
        applyRow(result["data"])
        api("GET","gethandcontext/"+tableid,null,function(contextresult){
            if(contextresult["success"]){
                applyContext(contextresult["data"])
            }
            loadtimebank(function(){
                loadGameTypes(function(){
                if(handid){
                    api("GET","gethand/"+handid,null,function(handresult){
                        if(handresult["success"]){
                            applyHandEdit(handresult["data"])
                        }
                        dom("emptybutton").checked=state.emptybuttoned
                        dom("deadsmallblind").checked=state.deadsmallblinded
                        renderAll()
                        setloading(false)
                    })
                    return
                }
                dom("emptybutton").checked=state.emptybuttoned
                dom("deadsmallblind").checked=state.deadsmallblinded
                if(!cacheget("bittingdata")){
                    rebuildDefaultBets()
                }else{
                    renderAll()
                }
                setloading(false)
                })
            })
        })
    })
}

init()
