let activecategory="all"
let toolfavoritelist=[]

const TOOLLISTTEXTMAP={
    "zhtw": {
        title: "工具總覽",
        eyebrow: "Tool Center",
        desc: "依用途快速找到現場、練習、計分牌、獎金與營運工具。",
        back: "回上一頁",
        searchlabel: "搜尋工具",
        searchplaceholder: "輸入關鍵字，例如 ICM、座位、計分牌",
        countlabel: "顯示",
        empty: "找不到符合條件的工具",
        all: "全部",
        featured: "常用",
        live: "現場",
        chip: "計分牌",
        payout: "獎金",
        strategy: "策略",
        operation: "營運",
        learn: "學習",
        develop: "開發",
        favorite: "最愛",
        favoriteadd: "加入最愛",
        favoriteremove: "已收藏",
        favoriteempty: "尚未收藏工具",
        recent: "最近",
        recentempty: "尚未使用任何工具"
    },
    "en": {
        title: "Tool List",
        eyebrow: "Tool Center",
        desc: "Find live, practice, chip, payout, and operation tools quickly.",
        back: "Back",
        searchlabel: "Search tools",
        searchplaceholder: "Type keywords like ICM, seat, chip",
        countlabel: "Showing",
        empty: "No matching tools",
        all: "All",
        featured: "Featured",
        live: "Live",
        chip: "Chip",
        payout: "Payout",
        strategy: "Strategy",
        operation: "Operation",
        learn: "Learn",
        develop: "Developer",
        favorite: "Favorite",
        favoriteadd: "Add Favorite",
        favoriteremove: "Saved",
        favoriteempty: "No favorite tools yet",
        recent: "Recent",
        recentempty: "No recent tools yet"
    }
}

const TOOLCATEGORYLIST=[
    "all",
    "recent",
    "favorite",
    "featured",
    "live",
    "chip",
    "payout",
    "strategy",
    "operation",
    "learn",
    "develop"
]


function toollistfavoritekey(){
    return WEBLSNAME+"toolfavoritelist"
}

function toollistloadfavorite(){
    toolfavoritelist=[]
    if(typeof pttoolfavoritelist=="function"){
        toolfavoritelist=pttoolfavoritelist()
        return
    }
    let raw=localStorage.getItem(toollistfavoritekey())||""
    if(!raw){
        return
    }
    try{
        let list=JSON.parse(raw)
        if(Array.isArray(list)){
            for(let i=0;i<list.length;i=i+1){
                if(typeof list[i]=="string"&&list[i]!=""){
                    toolfavoritelist.push(list[i])
                }
            }
        }
    }catch(error){
        toolfavoritelist=[]
    }
}

function toollistsavefavorite(){
    if(typeof pttoolfavoritesave=="function"){
        pttoolfavoritesave(toolfavoritelist)
        return
    }
    localStorage.setItem(toollistfavoritekey(),JSON.stringify(toolfavoritelist))
}

function toollistisfavorite(href){
    for(let i=0;i<toolfavoritelist.length;i=i+1){
        if(toolfavoritelist[i]==href){
            return true
        }
    }
    return false
}

function toollisttogglefavorite(href){
    let newlist=[]
    let removed=false
    for(let i=0;i<toolfavoritelist.length;i=i+1){
        if(toolfavoritelist[i]==href){
            removed=true
        }else{
            newlist.push(toolfavoritelist[i])
        }
    }
    if(!removed){
        newlist.push(href)
    }
    toolfavoritelist=newlist
    toollistsavefavorite()
    toollistrender()
}

let toolrecentlist=[]
const TOOLRECENTMAX=8

function toollistrecentkey(){
    return WEBLSNAME+"toolrecentlist"
}

function toollistloadrecent(){
    toolrecentlist=[]
    let raw=localStorage.getItem(toollistrecentkey())||""
    if(!raw){
        return
    }
    try{
        let list=JSON.parse(raw)
        if(Array.isArray(list)){
            for(let i=0;i<list.length;i=i+1){
                if(typeof list[i]=="string"&&list[i]!=""){
                    toolrecentlist.push(list[i])
                }
            }
        }
    }catch(error){
        toolrecentlist=[]
    }
}

function toollistsaverecent(){
    localStorage.setItem(toollistrecentkey(),JSON.stringify(toolrecentlist))
}

function toollistisrecent(href){
    for(let i=0;i<toolrecentlist.length;i=i+1){
        if(toolrecentlist[i]==href){
            return true
        }
    }
    return false
}

function toollistrecordrecent(href){
    if(!href){
        return
    }
    let newlist=[href]
    for(let i=0;i<toolrecentlist.length;i=i+1){
        if(toolrecentlist[i]!=href&&newlist.length<TOOLRECENTMAX){
            newlist.push(toolrecentlist[i])
        }
    }
    toolrecentlist=newlist
    toollistsaverecent()
}

function toollistfindbyhref(href){
    for(let i=0;i<TOOLITEMLIST.length;i=i+1){
        if(TOOLITEMLIST[i].href==href){
            return TOOLITEMLIST[i]
        }
    }
    return null
}

// 正式區會濾掉還沒通過的維護中工具（pttoolvisiblelist），測試機 / 本機拿到完整清單。
function toollistsourceitems(){
    if(typeof pttoolvisiblelist=="function"){
        return pttoolvisiblelist()
    }
    return TOOLITEMLIST
}

function toollistvisibled(href){
    if(typeof pttoolitemvisible=="function"){
        return pttoolitemvisible(href)
    }
    return true
}

function toollistdisplayitems(){
    if(activecategory=="recent"){
        let list=[]
        for(let i=0;i<toolrecentlist.length;i=i+1){
            let item=toollistfindbyhref(toolrecentlist[i])
            if(item&&toollistvisibled(item.href)){
                list.push(item)
            }
        }
        return list
    }
    return toollistsourceitems()
}

function toollistcategorycount(key){
    let source=toollistsourceitems()
    if(key=="all"){
        return source.length
    }
    if(key=="favorite"){
        let favcount=0
        for(let i=0;i<toolfavoritelist.length;i=i+1){
            if(toollistvisibled(toolfavoritelist[i])){
                favcount=favcount+1
            }
        }
        return favcount
    }
    if(key=="recent"){
        let recentcount=0
        for(let i=0;i<toolrecentlist.length;i=i+1){
            if(toollistvisibled(toolrecentlist[i])){
                recentcount=recentcount+1
            }
        }
        return recentcount
    }
    let count=0
    for(let i=0;i<source.length;i=i+1){
        if((" "+source[i].category+" ").indexOf(" "+key+" ")>=0){
            count=count+1
        }
    }
    return count
}

function toollisttext(key){
    if(TRANSLATE&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["toollistpage"]&&TRANSLATE[LANGUAGE]["toollistpage"][key]){
        return TRANSLATE[LANGUAGE]["toollistpage"][key]
    }
    if(TRANSLATE&&TRANSLATE[LANGUAGE]&&TRANSLATE[LANGUAGE]["pageauto"]&&TRANSLATE[LANGUAGE]["pageauto"]["toollist.html"]){
        let pack=TRANSLATE[LANGUAGE]["pageauto"]["toollist.html"]
        if(key=="title"&&pack["title"]){
            return pack["title"]
        }
        if(key=="eyebrow"&&pack["text"]&&pack["text"]["#toollisteyebrow"]){
            return pack["text"]["#toollisteyebrow"]
        }
        if(key=="desc"&&pack["text"]&&pack["text"]["#toollistdesc"]){
            return pack["text"]["#toollistdesc"]
        }
        if(key=="back"&&pack["text"]&&pack["text"]["#toollistback"]){
            return pack["text"]["#toollistback"]
        }
        if(key=="searchlabel"&&pack["text"]&&pack["text"]["#toollistsearchlabel"]){
            return pack["text"]["#toollistsearchlabel"]
        }
        if(key=="searchplaceholder"&&pack["placeholder"]&&pack["placeholder"]["#toollistsearch"]){
            return pack["placeholder"]["#toollistsearch"]
        }
        if(key=="countlabel"&&pack["text"]&&pack["text"]["#toollistcountlabel"]){
            return pack["text"]["#toollistcountlabel"]
        }
        if(key=="empty"&&pack["text"]&&pack["text"]["#toollistempty"]){
            return pack["text"]["#toollistempty"]
        }
    }
    let pack=TOOLLISTTEXTMAP[LANGUAGE]
    if(!pack){
        pack=TOOLLISTTEXTMAP["zhtw"]
    }
    return pack[key]||key
}

function toollistitemtext(item,key){
    if(!pttoolitemmaintenanced(item)){
        if(typeof LANGUAGE!="undefined"&&LANGUAGE=="en"){
            return item["e"+key]
        }
        return item["z"+key]
    }
    if(typeof LANGUAGE!="undefined"&&LANGUAGE=="en"){
        return item["e"+key]+" (Maintenance)"
    }
    return item["z"+key]+" (維護中)"
}

// function toollistitemtext(item,key){
//     if(LANGUAGE=="en"){
//         return item["e"+key]
//     }
//     return item["z"+key]
// }

function toollistsettext(selector,text){
    let element=document.querySelector(selector)
    if(element){
        element.textContent=text
    }
}

function toollistsetvalue(selector,text){
    let element=document.querySelector(selector)
    if(element){
        element.setAttribute("placeholder",text)
    }
}

function toollistapplylanguage(){
    document.title=toollisttext("title")+" - PokerTrace"
    toollistsettext("#toollisteyebrow",toollisttext("eyebrow"))
    toollistsettext("#toollisttitle",toollisttext("title"))
    toollistsettext("#toollistdesc",toollisttext("desc"))
    toollistsettext("#toollistback",toollisttext("back"))
    toollistsettext("#toollistsearchlabel",toollisttext("searchlabel"))
    toollistsettext("#toollistcountlabel",toollisttext("countlabel"))
    toollistsettext("#toollistempty",toollisttext("empty"))
    toollistsetvalue("#toollistsearch",toollisttext("searchplaceholder"))
}

function toollistrendercategory(){
    let html=""
    for(let i=0;i<TOOLCATEGORYLIST.length;i=i+1){
        let key=TOOLCATEGORYLIST[i]
        // 正式區某分類的工具若全被隱藏，就不要留下 0 筆的空分類按鈕；all / recent / favorite 一律保留。
        if(toollistcategorycount(key)<1&&key!="all"&&key!="recent"&&key!="favorite"){
            continue
        }
        let activeclass=""
        if(key==activecategory){
            activeclass=" bg-emerald-500 text-white"
        }else{
            activeclass=" bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        }
        html=html+`<input type="button" class="min-h-10 rounded-full px-4 text-sm font-bold transition${activeclass}" data-toolcategory="${key}" value="${toollisttext(key)} ${toollistcategorycount(key)}">`
    }
    document.querySelector("#toollistcategory").innerHTML=html
    let buttonlist=document.querySelectorAll("[data-toolcategory]")
    for(let i=0;i<buttonlist.length;i=i+1){
        buttonlist[i].addEventListener("click",function(){
            activecategory=this.getAttribute("data-toolcategory")
            toollistrender()
        })
    }
}

function toollistmatched(item,keyword){
    let matched=true
    if(activecategory=="favorite"){
        matched=toollistisfavorite(item.href)
    }else if(activecategory=="recent"){
        matched=toollistisrecent(item.href)
    }else if(activecategory!="all"){
        matched=false
        if((" "+item.category+" ").indexOf(" "+activecategory+" ")>=0){
            matched=true
        }
    }
    if(!matched){
        return false
    }
    if(keyword==""){
        return true
    }
    let haystack=[
        item.href,
        item.ztitle,
        item.etitle,
        item.zdesc,
        item.edesc,
        item.category
    ].join(" ").toLowerCase()
    if(haystack.indexOf(keyword)>=0){
        return true
    }
    return false
}

function toollistrendercontent(){
    let input=document.querySelector("#toollistsearch")
    let keyword=""
    if(input){
        keyword=input.value.trim().toLowerCase()
    }
    let html=""
    let count=0
    let displaylist=toollistdisplayitems()
    for(let i=0;i<displaylist.length;i=i+1){
        let item=displaylist[i]
        if(toollistmatched(item,keyword)){
            count=count+1
            let favoriteclass="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            let favoritetext=toollisttext("favoriteadd")
            if(toollistisfavorite(item.href)){
                favoriteclass="border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                favoritetext=toollisttext("favoriteremove")
            }
            html=html+`
                <article class="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 transition hover:border-emerald-500">
                    <div class="mb-3 flex items-center justify-between gap-3">
                        <div class="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">${toollisttext(item.category.split(" ")[0])}</div>
                        <input type="button" class="min-h-9 shrink-0 rounded-full border px-3 text-xs font-bold transition ${favoriteclass}" data-toolfavorite="${item.href}" value="${favoritetext}">
                    </div>
                    <a href="${item.href}" class="block" data-toolopen="${item.href}">
                        <div class="text-lg font-bold text-white">${toollistitemtext(item,"title")}</div>
                        <div class="mt-1 text-sm leading-6 text-zinc-400">${toollistitemtext(item,"desc")}</div>
                    </a>
                </article>
            `
        }
    }
    document.querySelector("#toollistcontent").innerHTML=html
    toollistbindfavorite()
    toollistbindopen()
    toollistsettext("#toollistcount",String(count))
    let empty=document.querySelector("#toollistempty")
    if(empty){
        if(count<1){
            empty.classList.remove("hidden")
        }else{
            empty.classList.add("hidden")
        }
        if(activecategory=="favorite"&&count<1){
            empty.textContent=toollisttext("favoriteempty")
        }else if(activecategory=="recent"&&count<1){
            empty.textContent=toollisttext("recentempty")
        }else{
            empty.textContent=toollisttext("empty")
        }
    }
}

function toollistbindfavorite(){
    let buttonlist=document.querySelectorAll("[data-toolfavorite]")
    for(let i=0;i<buttonlist.length;i=i+1){
        buttonlist[i].addEventListener("click",function(event){
            if(event){
                event.preventDefault()
                event.stopPropagation()
            }
            toollisttogglefavorite(this.getAttribute("data-toolfavorite")||"")
        })
    }
}

function toollistbindopen(){
    let buttonlist=document.querySelectorAll("[data-toolopen]")
    for(let i=0;i<buttonlist.length;i=i+1){
        buttonlist[i].addEventListener("click",function(){
            toollistrecordrecent(this.getAttribute("data-toolopen")||"")
        })
    }
}

function toollistrender(){
    toollistrendercategory()
    toollistrendercontent()
}

function toollistinit(){
    toollistloadfavorite()
    toollistloadrecent()
    toollistapplylanguage()
    let input=document.querySelector("#toollistsearch")
    if(input){
        input.addEventListener("input",function(){
            toollistrendercontent()
        })
    }
    let back=domgetid("toollistback")
    if(back){
        back.onclick=function(event){
            if(event&&event.button!=0){
                return
            }
            if(event&&event.ctrlKey||event&&event.metaKey||event&&event.shiftKey||event&&event.altKey){
                return
            }
            event.preventDefault()
            pagebacknavigate(back)
        }
    }
    toollistrender()
    if(typeof pttoolfavoritesyncfrombackend=="function"){
        pttoolfavoritesyncfrombackend(function(list){
            if(Array.isArray(list)){
                toolfavoritelist=list
                toollistrender()
            }
        })
    }
}

toollistinit()
