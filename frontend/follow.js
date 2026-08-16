// follow.js
// ===========================================================================
// 追隨主辦單位（共用模組，profile.html 與 session.html 都載入）
//
//   * 追隨的對象是主辦單位，可再縮到單一協會地點
//   * 畫面上一律用**協會名稱**標示，不顯示主辦者姓名 —— 全站沒有任何地方
//     顯示「這場是誰主辦的」，這個性質要保持（後端也不回姓名）
//   * 完全私密：不顯示追隨人數，主辦單位看不到誰追隨他
//
// 對話框是用 JS 建 DOM（同 initialize.js 的 ptconfirm），裡面的元素一律用
// **class 選取**不要用 id —— 用 id 的話 verify:reference 會報「JS 操作不存在的 id」。
// ===========================================================================

// 兩態按鈕的底色組。基底 class（min-h-10 rounded-2xl border px-4 …）寫在
// HTML 那一側，這裡只切換兩種狀態各自的邊框與底色。
const FOLLOWBUTTONOFF=["border-zinc-700","bg-zinc-800","text-zinc-100","hover:bg-zinc-700"]
const FOLLOWBUTTONON=["border-emerald-500/50","bg-emerald-500/10","text-emerald-300","hover:bg-emerald-500/20"]

// safehtml 是各頁自己定義的（profile.js:69、clublist.js:17…），不是全域共用。
// 這裡自己帶一份專屬的，避免多一個同名全域函式互相覆蓋。
function ptfollowsafehtml(value){
	if(value==null){
		return ""
	}
	return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")
}

function ptfollowtext(key,fallbacktext){
	let section=TRANSLATE[LANGUAGE]["follow"]
	if(section&&section[key]){
		return section[key]
	}
	return fallbacktext||key
}

function ptfollowheader(){
	return [["Authorization","Bearer "+weblsget(WEBLSNAME+"token")]]
}

// 兩態按鈕：先把兩組 class 都移掉再加上該有的那組。
// 不可以用字串拼 class（Tailwind 掃不到就不會產出樣式，而且是靜默的）。
function ptfollowapplybuttonstate(button,followed){
	if(!button){
		return
	}
	for(let i=0;i<FOLLOWBUTTONOFF.length;i=i+1){
		button.classList.remove(FOLLOWBUTTONOFF[i])
	}
	for(let i=0;i<FOLLOWBUTTONON.length;i=i+1){
		button.classList.remove(FOLLOWBUTTONON[i])
	}
	let addlist=FOLLOWBUTTONOFF
	let text=ptfollowtext("follow","追隨")
	if(followed){
		addlist=FOLLOWBUTTONON
		text=ptfollowtext("following","追隨中")
	}
	for(let i=0;i<addlist.length;i=i+1){
		button.classList.add(addlist[i])
	}
	button.value=text
}

// 主辦單位的顯示名稱＝他所有地點的名稱。只有一個地點時就是那個地點的名字，
// 那是最常見的情況，看起來最自然。
function ptfollowlabel(clublist){
	let namelist=[]
	for(let i=0;i<clublist.length;i=i+1){
		let name=clublist[i]["clubname"]
		if(name&&namelist.indexOf(name)<0){
			namelist.push(name)
		}
	}
	if(!namelist.length){
		return ptfollowtext("targetlabel","選擇主辦單位")
	}
	return namelist.join(" · ")
}

function ptfollowscopetext(item){
	if(item["allclubed"]){
		return ptfollowtext("scopeall","全部地點")
	}
	let selected=(item["followclubidlist"]||[]).length
	let total=(item["clublist"]||[]).length
	return ptfollowtext("venuecount","共 {selected} / {total} 個地點").replace("{selected}",selected).replace("{total}",total)
}

function ptfollowloadlist(done){
	ajax("GET",AJAXURL+"getfollowlist",function(event,data){
		if(data["success"]){
			done(data["data"]["followlist"]||[])
			return
		}
		if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
			pthandleauthfailure(data["data"],{"toasted": false})
			return
		}
		done(null)
	},null,ptfollowheader())
}

function ptfollowloadtarget(done){
	ajax("GET",AJAXURL+"getfollowtargetlist",function(event,data){
		if(data["success"]){
			done(data["data"]["followtargetlist"]||[])
			return
		}
		if(data["data"]=="ERROR_token_error"||data["data"]=="ERROR_token_not_found"){
			pthandleauthfailure(data["data"],{"toasted": false})
			return
		}
		done(null)
	},null,ptfollowheader())
}

function ptfollownotify(followuserid,notifyenabled,done){
	ajax("PUT",AJAXURL+"editfollow/"+encodeURIComponent(followuserid),function(event,data){
		done(data["success"]==true,data["data"])
	},str({
		"notifyed": notifyenabled
	}),ptfollowheader())
}

function ptfollowdelete(followuserid,done){
	ajax("DELETE",AJAXURL+"deletefollow/"+encodeURIComponent(followuserid),function(event,data){
		done(data["success"]==true,data["data"])
	},null,ptfollowheader())
}

function ptfollowsave(payload,done){
	ajax("POST",AJAXURL+"newfollow",function(event,data){
		done(data["success"]==true,data["data"])
	},str(payload),ptfollowheader())
}

function ptfollowclosemodal(cover){
	if(cover&&cover.parentNode){
		cover.parentNode.removeChild(cover)
	}
	ptunlockpagescroll()
}

// mode: "add" 從清單挑一位主辦單位；"edit" 已經知道是誰（場次頁或卡片的地點範圍）
// target: {"followuserid","clublist","allclubed","notifyed","followclubidlist"}
// done(saveded) 在關閉時呼叫，saveded 為真表示有寫入
function ptfollowopenmodal(mode,target,done){
	let cover=doccreate("div")
	cover.className="followmodal fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
	cover.setAttribute("role","dialog")
	cover.setAttribute("aria-modal","true")

	let modaltitle=ptfollowtext("modaltitleedit","追隨設定")
	if(mode=="add"){
		modaltitle=ptfollowtext("modaltitleadd","新增追隨")
	}

	cover.innerHTML=`
		<div class="followpanel w-full max-w-md rounded-[28px] border border-zinc-800 bg-zinc-900 p-6 max-h-full overflow-y-auto">
			<div class="flex items-start justify-between gap-3">
				<h3 class="text-lg font-bold text-white">${modaltitle}</h3>
				<input type="button" class="followclose cursor-pointer rounded-2xl border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-100 hover:bg-zinc-700" value="${ptfollowtext("close","關閉")}">
			</div>
			<div class="followtargetblock mt-4 hidden">
				<div class="mb-2 text-sm font-bold text-zinc-300">${ptfollowtext("targetlabel","選擇主辦單位")}</div>
				<select class="followtargetselect w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"></select>
			</div>
			<div class="followtargetname mt-4 text-base font-bold text-white"></div>
			<div class="mt-5">
				<div class="mb-2 text-sm font-bold text-zinc-300">${ptfollowtext("scope","地點範圍")}</div>
				<label class="followclubitem text-sm text-zinc-100">
					<input type="radio" class="followscopeall" name="followscope" checked>
					<span>${ptfollowtext("scopeall","全部地點")}</span>
				</label>
				<div class="mb-2 pl-8 text-xs text-zinc-500">${ptfollowtext("scopeallhint","之後新增的地點也會自動涵蓋")}</div>
				<label class="followclubitem text-sm text-zinc-100">
					<input type="radio" class="followscopepick" name="followscope">
					<span>${ptfollowtext("scopeselected","只追隨指定地點")}</span>
				</label>
				<div class="followclublist mt-1 max-h-64 overflow-y-auto pl-6"></div>
				<div class="followscopecount mt-1 pl-8 text-xs text-zinc-400"></div>
			</div>
			<label class="followclubitem mt-4 text-sm text-zinc-100">
				<input type="checkbox" class="follownotify" checked>
				<span>${ptfollowtext("notifylabel","開新場次時通知我")}</span>
			</label>
			<div class="followerror mt-3 hidden text-sm text-rose-400"></div>
			<div class="mt-5 flex justify-end gap-2">
				<input type="button" class="followcancel cursor-pointer rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-zinc-700" value="${ptfollowtext("cancel","取消")}">
				<input type="button" class="followsave cursor-pointer rounded-2xl border border-emerald-500/50 bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700" value="${ptfollowtext("save","儲存")}">
			</div>
		</div>
	`

	document.body.appendChild(cover)
	ptlockpagescroll()

	let targetblock=cover.querySelector(".followtargetblock")
	let targetselect=cover.querySelector(".followtargetselect")
	let targetname=cover.querySelector(".followtargetname")
	let scopeall=cover.querySelector(".followscopeall")
	let scopepick=cover.querySelector(".followscopepick")
	let clublistbox=cover.querySelector(".followclublist")
	let scopecount=cover.querySelector(".followscopecount")
	let notifybox=cover.querySelector(".follownotify")
	let errorbox=cover.querySelector(".followerror")
	let savebutton=cover.querySelector(".followsave")
	let currenttarget=target||{}
	let targetlist=[]
	let saveded=false

	function showerror(message){
		errorbox.textContent=pterror(message)
		errorbox.classList.remove("hidden")
	}

	function clearerror(){
		errorbox.textContent=""
		errorbox.classList.add("hidden")
	}

	function refreshcount(){
		let clublist=currenttarget["clublist"]||[]
		let selected=0
		let boxlist=clublistbox.querySelectorAll(".followclubcheck")
		for(let i=0;i<boxlist.length;i=i+1){
			if(boxlist[i].checked){
				selected=selected+1
			}
		}
		scopecount.textContent=ptfollowtext("scopecount","已選 {selected} / {total}").replace("{selected}",selected).replace("{total}",clublist.length)
	}

	function refreshscopestate(){
		if(scopeall.checked){
			clublistbox.classList.add("followclubdisabled")
		}else{
			clublistbox.classList.remove("followclubdisabled")
		}
	}

	function rendertarget(){
		let clublist=currenttarget["clublist"]||[]
		targetname.textContent=ptfollowlabel(clublist)
		let followclubidlist=currenttarget["followclubidlist"]||[]
		let html=""
		for(let i=0;i<clublist.length;i=i+1){
			let checkedtext=""
			if(0<=followclubidlist.indexOf(clublist[i]["clubid"])){
				checkedtext=" checked"
			}
			html=html+`
				<label class="followclubitem text-sm text-zinc-100">
					<input type="checkbox" class="followclubcheck" data-clubid="${clublist[i]["clubid"]}"${checkedtext}>
					<span>${ptfollowsafehtml(clublist[i]["clubname"]||"")}</span>
				</label>
			`
		}
		if(!clublist.length){
			html=`<div class="py-2 text-xs text-zinc-500">${ptfollowtext("scopeempty","目前沒有可選的地點")}</div>`
			scopepick.disabled=true
		}
		clublistbox.innerHTML=html
		let boxlist=clublistbox.querySelectorAll(".followclubcheck")
		for(let i=0;i<boxlist.length;i=i+1){
			boxlist[i].addEventListener("change",function(){
				refreshcount()
			})
		}
		// 追隨過而且不是全部地點，就把畫面切到「只追隨指定地點」
		if(currenttarget["allclubed"]==false&&0<followclubidlist.length){
			scopepick.checked=true
			scopeall.checked=false
		}else{
			scopeall.checked=true
		}
		if(currenttarget["notifyed"]==false){
			notifybox.checked=false
		}
		refreshscopestate()
		refreshcount()
	}

	if(mode=="add"){
		targetblock.classList.remove("hidden")
		ptfollowloadtarget(function(list){
			if(list==null){
				showerror(ptfollowtext("loadfail","追隨清單載入失敗"))
				return
			}
			targetlist=list
			if(!targetlist.length){
				targetblock.classList.add("hidden")
				targetname.textContent=ptfollowtext("targetempty","目前沒有可追隨的主辦單位")
				savebutton.disabled=true
				return
			}
			let html=""
			for(let i=0;i<targetlist.length;i=i+1){
				let suffix=""
				if(targetlist[i]["followed"]){
					suffix=" ("+ptfollowtext("targetfollowed","已追隨")+")"
				}
				html=html+`<option value="${i}">${ptfollowsafehtml(ptfollowlabel(targetlist[i]["clublist"]||[])+suffix)}</option>`
			}
			targetselect.innerHTML=html
			currenttarget=targetlist[0]
			rendertarget()
		})
	}else{
		rendertarget()
	}

	targetselect.addEventListener("change",function(){
		let index=int(targetselect.value)
		if(targetlist[index]){
			currenttarget=targetlist[index]
			scopepick.disabled=false
			notifybox.checked=true
			rendertarget()
		}
	})

	scopeall.addEventListener("change",function(){
		clearerror()
		refreshscopestate()
	})

	scopepick.addEventListener("change",function(){
		clearerror()
		refreshscopestate()
	})

	cover.querySelector(".followclose").addEventListener("click",function(){
		ptfollowclosemodal(cover)
		done(saveded)
	})

	cover.querySelector(".followcancel").addEventListener("click",function(){
		ptfollowclosemodal(cover)
		done(saveded)
	})

	savebutton.addEventListener("click",function(){
		clearerror()
		if(!currenttarget["followuserid"]){
			showerror(ptfollowtext("targetempty","目前沒有可追隨的主辦單位"))
			return
		}
		let clubidlist=[]
		let boxlist=clublistbox.querySelectorAll(".followclubcheck")
		for(let i=0;i<boxlist.length;i=i+1){
			if(boxlist[i].checked){
				clubidlist.push(int(boxlist[i].getAttribute("data-clubid")))
			}
		}
		if(!scopeall.checked&&!clubidlist.length){
			showerror(ptfollowtext("scoperequired","請至少勾選一個地點"))
			return
		}
		ptsetsubmitstate(savebutton,true,ptfollowtext("saving","儲存中…"))
		ptfollowsave({
			"followuserid": String(currenttarget["followuserid"]),
			"allclubed": scopeall.checked,
			"clubidlist": clubidlist,
			"notifyed": notifybox.checked
		},function(okayed,responsedata){
			ptsetsubmitstate(savebutton,false)
			if(!okayed){
				// 不關對話框：關掉的話使用者剛勾好的地點就全沒了
				showerror(responsedata)
				return
			}
			saveded=true
			pttoastsuccess(ptfollowtext("saved","已儲存追隨設定"))
			ptfollowclosemodal(cover)
			done(true)
		})
	})
}
