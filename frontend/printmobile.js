// A local, paginated PDF keeps Home Screen printing usable without a server upload.
async function ptprintpdf(root,signal){
    const WIDTH=1240
    const HEIGHT=1754
    const MARGIN=64
    const BOTTOM=HEIGHT-MARGIN
    const FONT='"Microsoft JhengHei", "Noto Sans TC", sans-serif'
    const IMAGELIST=[]
    let canvas=null
    let context=null
    let y=MARGIN
    function newpage(){
        canvas=document.createElement("canvas")
        canvas.width=WIDTH
        canvas.height=HEIGHT
        context=canvas.getContext("2d")
        context.fillStyle="#ffffff"
        context.fillRect(0,0,WIDTH,HEIGHT)
        context.fillStyle="#111111"
        y=MARGIN
    }
    async function savepage(){
        signal.throwIfAborted()
        context.font="18px "+FONT
        context.textAlign="right"
        context.fillText(String(IMAGELIST.length+1),WIDTH-MARGIN,HEIGHT-28)
        const BLOB=await new Promise(function(resolve){canvas.toBlob(resolve,"image/jpeg",0.9)})
        IMAGELIST.push(new Uint8Array(await BLOB.arrayBuffer()))
        await new Promise(function(resolve){setTimeout(resolve,0)})
        signal.throwIfAborted()
    }
    function wrap(text,width){
        const LINELIST=[]
        let line=""
        for(const CHARACTER of String(text)){
            if(CHARACTER=="\n"||context.measureText(line+CHARACTER).width>width){
                LINELIST.push(line)
                line=""
            }
            if(CHARACTER!="\n"){line=line+CHARACTER}
        }
        LINELIST.push(line)
        return LINELIST
    }
    async function textblock(text,size,bolded){
        context.font=size+"px "+FONT
        if(bolded){context.font="bold "+context.font}
        const LINELIST=wrap(text,WIDTH-MARGIN*2)
        for(const LINE of LINELIST){
            if(y+size*1.5>BOTTOM){await savepage();newpage()}
            context.font=size+"px "+FONT
            if(bolded){context.font="bold "+context.font}
            context.textAlign="left"
            context.fillStyle="#111111"
            context.fillText(LINE,MARGIN,y+size)
            y=y+size*1.5
        }
        y=y+10
    }
    newpage()
    const NODELIST=root.querySelectorAll(".ptprinteyebrow,.ptprinttitle,.ptprintsubtitle,.ptprintmeta,.ptprintinforow,.ptprintsectiontitle,.ptprinttable,.ptprintnote,.ptprintempty,.ptprintsignlabel")
    for(const NODE of NODELIST){
        signal.throwIfAborted()
        if(NODE.matches("table")){
            const ROWLIST=Array.from(NODE.rows)
            const COUNT=ROWLIST[0].cells.length
            let weightlist=Array(COUNT).fill(1/COUNT)
            if(COUNT==7){weightlist=[0.05,0.18,0.27,0.1,0.15,0.1,0.15]}
            const CELLLIST=[]
            for(const ROW of ROWLIST){
                const LINESET=[]
                context.font="20px "+FONT
                for(let c=0;c<COUNT;c=c+1){LINESET.push(wrap(ROW.cells[c].textContent,(WIDTH-2*MARGIN)*weightlist[c]-16))}
                CELLLIST.push(LINESET)
            }
            function drawrow(lineset,offset,linecount,headered){
                let x=MARGIN
                const ROWHEIGHT=linecount*28+16
                context.font="20px "+FONT
                for(let c=0;c<COUNT;c=c+1){
                    const CELLWIDTH=(WIDTH-2*MARGIN)*weightlist[c]
                    context.fillStyle="#ffffff"
                    if(headered){context.fillStyle="#eeeeee"}
                    context.fillRect(x,y,CELLWIDTH,ROWHEIGHT)
                    context.strokeStyle="#555555"
                    context.strokeRect(x,y,CELLWIDTH,ROWHEIGHT)
                    context.fillStyle="#111111"
                    context.textAlign="left"
                    for(let l=0;l<linecount;l=l+1){context.fillText(lineset[c][offset+l]||"",x+8,y+29+l*28)}
                    x=x+CELLWIDTH
                }
                y=y+ROWHEIGHT
            }
            const HEADERCOUNT=Math.max.apply(null,CELLLIST[0].map(function(cell){return cell.length}))
            if(y+HEADERCOUNT*28+60>BOTTOM){await savepage();newpage()}
            drawrow(CELLLIST[0],0,HEADERCOUNT,true)
            for(let r=1;r<CELLLIST.length;r=r+1){
                const LINECOUNT=Math.max.apply(null,CELLLIST[r].map(function(cell){return cell.length}))
                let offset=0
                for(let part=0;offset<LINECOUNT;part=part+1){
                    const ROOM=Math.floor((BOTTOM-y-16)/28)
                    if(ROOM<1||(offset==0&&LINECOUNT<=48&&LINECOUNT>ROOM)){
                        await savepage()
                        newpage()
                        drawrow(CELLLIST[0],0,HEADERCOUNT,true)
                    }else{
                        const CHUNK=Math.min(ROOM,LINECOUNT-offset)
                        drawrow(CELLLIST[r],offset,CHUNK,false)
                        offset=offset+CHUNK
                    }
                }
            }
            y=y+20
        }else{
            let size=22
            if(NODE.matches(".ptprinttitle")){size=34}
            let text=NODE.textContent.trim()
            if(NODE.matches(".ptprintinforow")){text=Array.from(NODE.children).map(function(child){return child.textContent.trim()}).join(": ")}
            await textblock(text,size,NODE.matches(".ptprinttitle,.ptprintsectiontitle"))
        }
    }
    await savepage()
    const ENCODER=new TextEncoder()
    const CHUNKLIST=[]
    const OFFSETLIST=[0]
    let length=0
    function append(value){
        let data=value
        if(typeof data=="string"){data=ENCODER.encode(data)}
        CHUNKLIST.push(data)
        length=length+data.length
    }
    function object(number,value){
        OFFSETLIST[number]=length
        append(number+" 0 obj\n"+value+"\nendobj\n")
    }
    append("%PDF-1.4\n")
    object(1,"<< /Type /Catalog /Pages 2 0 R >>")
    const PAGELIST=[]
    for(let i=0;i<IMAGELIST.length;i=i+1){PAGELIST.push((3+i*3)+" 0 R")}
    object(2,"<< /Type /Pages /Count "+IMAGELIST.length+" /Kids ["+PAGELIST.join(" ")+"] >>")
    for(let i=0;i<IMAGELIST.length;i=i+1){
        const NUMBER=3+i*3
        object(NUMBER,"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Image "+(NUMBER+1)+" 0 R >> >> /Contents "+(NUMBER+2)+" 0 R >>")
        OFFSETLIST[NUMBER+1]=length
        append((NUMBER+1)+" 0 obj\n<< /Type /XObject /Subtype /Image /Width "+WIDTH+" /Height "+HEIGHT+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+IMAGELIST[i].length+" >>\nstream\n")
        append(IMAGELIST[i])
        append("\nendstream\nendobj\n")
        const CONTENT="q 595.28 0 0 841.89 0 0 cm /Image Do Q\n"
        object(NUMBER+2,"<< /Length "+CONTENT.length+" >>\nstream\n"+CONTENT+"endstream")
    }
    const XREF=length
    append("xref\n0 "+OFFSETLIST.length+"\n0000000000 65535 f \n")
    for(let i=1;i<OFFSETLIST.length;i=i+1){append(String(OFFSETLIST[i]).padStart(10,"0")+" 00000 n \n")}
    append("trailer\n<< /Size "+OFFSETLIST.length+" /Root 1 0 R >>\nstartxref\n"+XREF+"\n%%EOF")
    return new Blob(CHUNKLIST,{"type": "application/pdf"})
}

async function ptprintmobile(root){
    const PREVIOUS=document.querySelector(".ptprintpreview")
    if(PREVIOUS){PREVIOUS.close()}
    const TEXT=TRANSLATE[LANGUAGE]["sessionlist"]
    const DIALOG=document.createElement("dialog")
    DIALOG.className="ptprintpreview"
    DIALOG.setAttribute("role","dialog")
    DIALOG.setAttribute("aria-label",TEXT["printpreview"])
    DIALOG.innerHTML=`<h2>${TEXT["printpreview"]}</h2><p>${TEXT["printmobilehint"]}</p><div class="ptprintpreviewaction"><input type="button" data-print="print" value="${TEXT["printlist"]}"><a download="PokerTrace-sessions.pdf" hidden>${TEXT["printpdf"]}</a><input type="button" data-print="share" value="${TEXT["printshare"]}" hidden><input type="button" data-print="close" value="${TRANSLATE[LANGUAGE]["usernote"]["close"]}"></div><p role="status">${TEXT["printpreparing"]}</p><div class="ptprintpreviewpaper"></div>`
    DIALOG.querySelector(".ptprintpreviewpaper").appendChild(root.firstElementChild.cloneNode(true))
    const ABORT=new AbortController()
    let objecturl=""
    let file=null
    DIALOG.querySelector('[data-print="close"]').addEventListener("click",function(){DIALOG.close()})
    DIALOG.querySelector('[data-print="print"]').addEventListener("click",function(){window.print()})
    DIALOG.querySelector('[data-print="share"]').addEventListener("click",async function(){
        try{await navigator.share({"files": [file]})}catch(error){if(error.name!="AbortError"){DIALOG.querySelector('[role="status"]').textContent=TEXT["printshareerror"]}}
    })
    function clear(){DIALOG.close()}
    function accountchange(event){if(event.key==WEBLSNAME+"token"){DIALOG.close()}}
    window.addEventListener("pagehide",clear,{"once": true})
    window.addEventListener("storage",accountchange)
    DIALOG.addEventListener("close",function(){
        ABORT.abort()
        if(objecturl){URL.revokeObjectURL(objecturl)}
        root.replaceChildren()
        file=null
        DIALOG.remove()
        ptunlockpagescroll()
        window.removeEventListener("pagehide",clear)
        window.removeEventListener("storage",accountchange)
    })
    document.body.appendChild(DIALOG)
    ptlockpagescroll()
    DIALOG.showModal()
    try{
        const PDF=await ptprintpdf(root,ABORT.signal)
        ABORT.signal.throwIfAborted()
        objecturl=URL.createObjectURL(PDF)
        file=new File([PDF],"PokerTrace-sessions.pdf",{"type": "application/pdf"})
        const DOWNLOAD=DIALOG.querySelector("a")
        DOWNLOAD.href=objecturl
        DOWNLOAD.hidden=false
        if(navigator.canShare&&navigator.canShare({"files": [file]})){DIALOG.querySelector('[data-print="share"]').hidden=false}
        DIALOG.querySelector('[role="status"]').textContent=TEXT["printready"]
    }catch(error){
        if(error.name!="AbortError"){DIALOG.querySelector('[role="status"]').textContent=TEXT["printpdferror"]}
    }
}
