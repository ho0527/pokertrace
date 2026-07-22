// 場次詳情頁的「加入系列賽」控制項。
// 刻意包在 IIFE 裡並與 session.js 完全隔離：classic script 共用全域語彙環境，
// 若在頂層重複宣告 session.js 已有的變數 (如 sessionid) 會直接拋錯，所以這裡不在頂層宣告任何東西。
(function(){
	function t(key){
		return TRANSLATE[LANGUAGE]["series"][key]||key
	}
	function esc(value){
		if(value==null||value==undefined){
			return ""
		}
		return String(value)
			.replace(/&/g,"&amp;")
			.replace(/</g,"&lt;")
			.replace(/>/g,"&gt;")
			.replace(/"/g,"&quot;")
			.replace(/'/g,"&#39;")
	}

	let sid=getget("id")
	let container=domgetid("seriesattach")
	if(!sid||!container||!weblsget(WEBLSNAME+"signin")){
		return
	}
	let authheader=[["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]]

	function show(){
		container.classList.remove("hidden")
	}

	function renderempty(){
		innerhtml("#seriesattach",`
			<div class="text-[13px] font-bold uppercase tracking-[0.16em] text-emerald-400">${t("attachtitle")}</div>
			<div class="mt-2 text-sm text-zinc-400">${t("noseries")}</div>
			<div class="mt-4">
				<a href="serieslist.html" class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-5 text-sm font-bold text-white transition">${t("goseries")}</a>
			</div>
		`,false)
		show()
	}

	function rendercontrol(serieslist){
		let options=serieslist.map(function(s){
			return `<option value="${esc(s["id"])}">${esc(s["name"])||t("notitle")}</option>`
		}).join("")
		innerhtml("#seriesattach",`
			<div class="text-[13px] font-bold uppercase tracking-[0.16em] text-emerald-400">${t("attachtitle")}</div>
			<div class="mt-2 text-sm text-zinc-400">${t("attachhint")}</div>
			<div class="mt-4 flex flex-col gap-2 md:flex-row">
				<select id="seriesattachselect" class="min-h-11 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 text-[15px] text-white outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15">${options}</select>
				<input type="button" id="seriesattachbtn" class="cursor-pointer rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2 text-sm font-bold text-white transition" value="${t("attachbtn")}">
			</div>
		`,false)
		show()
		onclick("#seriesattachbtn",function(element,event){
			attach(element)
		})
	}

	function attach(button){
		if(button.disabled){
			return
		}
		let targetid=getvalue("seriesattachselect")
		if(!targetid){
			return
		}
		ptsetsubmitstate(button,true,t("attaching"))
		// 先讀回該系列賽目前的場次清單，再把本場次補進去 (editseriessessions 是整批覆寫)
		ajax("GET",AJAXURL+"getseries/"+targetid,function(event,data){
			if(!data["success"]){
				ptsetsubmitstate(button,false)
				pttoast(data["data"]||t("unknownerror"),"error")
				return
			}
			let sessions=(data["data"]||{})["sessions"]||[]
			let ids=[]
			let exists=false
			for(let i=0;i<sessions.length;i=i+1){
				ids.push(Number(sessions[i]["id"]))
				if(String(sessions[i]["id"])==String(sid)){
					exists=true
				}
			}
			if(exists){
				ptsetsubmitstate(button,false)
				pttoast(t("alreadyin"),"error")
				return
			}
			ids.push(Number(sid))
			ajax("PUT",AJAXURL+"editseriessessions/"+targetid,function(event,data){
				ptsetsubmitstate(button,false)
				if(data["success"]){
					pttoastsuccess(t("attached"))
				}else{
					pttoast(data["data"]||t("unknownerror"),"error")
				}
			},str({"sessionids": ids}),authheader)
		},null,authheader)
	}

	// 只有「自己擁有」的場次才顯示加入控制項 (後端也只會把屬於自己的場次加進系列賽)
	ajax("GET",AJAXURL+"getsession/"+sid,function(event,data){
		if(!data["success"]||!data["data"]||data["data"]["isown"]!=true){
			return
		}
		ajax("GET",AJAXURL+"getserieslist",function(event,listdata){
			if(!listdata["success"]){
				return
			}
			let serieslist=listdata["data"]||[]
			if(serieslist.length<=0){
				renderempty()
			}else{
				rendercontrol(serieslist)
			}
		},null,authheader)
	},null,authheader)
})()
