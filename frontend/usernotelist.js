let usernotelistpage=1
let usernotelistgeneration=0
let usernotesearchtimer=null

function loadusernotemanagement(silent){
    const TOKEN=weblsget(WEBLSNAME+"token")||""
    const LIST=document.getElementById("usernotemanagementlist")
    const STATUS=document.getElementById("usernotestatus")
    const PREVIOUS=document.getElementById("usernoteprevious")
    const NEXT=document.getElementById("usernotenext")
    usernotelistgeneration=usernotelistgeneration+1
    const GENERATION=usernotelistgeneration
    PREVIOUS.disabled=true
    NEXT.disabled=true
    document.getElementById("usernoteretry").hidden=true
    if(TOKEN){
        if(!silent){
            STATUS.textContent=ptusernotetext("loading")
        }
        const KEYWORD=document.getElementById("usernotesearch").value.trim()
        ajax("GET",AJAXURL+"getmyusernotelist?page="+usernotelistpage+"&limit=20&keyword="+encodeURIComponent(KEYWORD),function(event,data){
            if(GENERATION==usernotelistgeneration&&TOKEN==weblsget(WEBLSNAME+"token")){
                if(data&&data["success"]){
                    const PAYLOAD=data["data"]
                    const ROWLIST=PAYLOAD["notelist"]||[]
                    const TOTAL=Number(PAYLOAD["total"])||0
                    const PAGECOUNT=Math.max(1,Math.ceil(TOTAL/20))
                    if(usernotelistpage>PAGECOUNT){
                        usernotelistpage=PAGECOUNT
                        loadusernotemanagement(true)
                    }else{
                        let html=""
                        for(let i=0;i<ROWLIST.length;i=i+1){
                            const ROW=ROWLIST[i]
                            html=html+`<article class="usernotemanagementrow"><div class="usernotemanagementidentity"><h2>${ptusernotesafehtml(ROW["name"]||ptusernotetext("account"))}</h2><p>${ptusernotesafehtml(ROW["playerid"])}</p>${ptusernotehtml(ROW["targetuserid"],ROW["name"])}</div><input type="button" class="usernotedelete" data-targetuserid="${ROW["targetuserid"]}" value="${ptusernotesafehtml(ptusernotetext("delete"))}"></article>`
                        }
                        LIST.innerHTML=html
                        STATUS.textContent=ptusernotetext("total").replace("{count}",String(TOTAL))
                        if(TOTAL==0){
                            STATUS.textContent=ptusernotetext("empty")
                        }
                        document.getElementById("usernotepage").textContent=usernotelistpage+" / "+PAGECOUNT
                        PREVIOUS.disabled=usernotelistpage<=1
                        NEXT.disabled=usernotelistpage>=PAGECOUNT
                        const DELETELIST=LIST.querySelectorAll(".usernotedelete")
                        for(let i=0;i<DELETELIST.length;i=i+1){
                            DELETELIST[i].addEventListener("click",function(){
                                const ID=DELETELIST[i].dataset.targetuserid
                                ptconfirm(ptusernotetext("deleteconfirm"),function(){
                                    if(TOKEN!=weblsget(WEBLSNAME+"token")){
                                        return
                                    }
                                    DELETELIST[i].disabled=true
                                    ajax("PUT",AJAXURL+"editusernote/"+ID,function(event,result){
                                        if(TOKEN==weblsget(WEBLSNAME+"token")){
                                            if(result&&result["success"]){
                                                delete usernotecache[ID]
                                                loadusernotemanagement(true)
                                            }else{
                                                DELETELIST[i].disabled=false
                                                pttoasterror(ptusernotetext("saveerror"))
                                            }
                                        }
                                    },JSON.stringify({"color": "","note": ""}),[["Authorization","Bearer "+TOKEN]])
                                })
                            })
                        }
                    }
                }else{
                    STATUS.textContent=ptusernotetext("loaderror")
                    document.getElementById("usernoteretry").hidden=false
                }
            }
        },null,[["Authorization","Bearer "+TOKEN]])
    }else{
        LIST.replaceChildren()
        href("signin.html")
    }
}

document.getElementById("usernotesearch").addEventListener("input",function(){
    clearTimeout(usernotesearchtimer)
    usernotesearchtimer=setTimeout(function(){
        usernotelistpage=1
        loadusernotemanagement()
    },300)
})
document.getElementById("usernoteprevious").addEventListener("click",function(){
    usernotelistpage=Math.max(1,usernotelistpage-1)
    loadusernotemanagement()
})
document.getElementById("usernotenext").addEventListener("click",function(){
    usernotelistpage=usernotelistpage+1
    loadusernotemanagement()
})
document.getElementById("usernoteretry").addEventListener("click",function(){loadusernotemanagement()})
document.addEventListener("ptusernotechanged",function(){loadusernotemanagement(true)})
window.addEventListener("storage",function(){
    document.getElementById("usernotemanagementlist").replaceChildren()
    loadusernotemanagement()
})
window.addEventListener("pageshow",function(event){
    if(event.persisted){
        loadusernotemanagement(true)
    }
})
loadusernotemanagement()
