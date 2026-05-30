// cloudsync.js
// ===========================================================================
// 計時器跨裝置雲端同步 (control.html / display.html 用)
//
// 設計:
//   * WebSocket 為主 (即時推播), 連不上時 fallback REST polling
//   * control 模式: monkey-patch Storage.setItem → 同 tab 寫入也會推到 API
//   * 任何模式: 收到雲端 state → 寫 localStorage + dispatch CustomEvent("cloudsync-state")
//   * 主腳本只要監聽 cloudsync-state 並 Object.assign(state, e.detail.state); render()
// ===========================================================================

window.cloudsync=(function(){
	let STORAGEKEY="pokerClockState_v3"
	let SESSIONID=null
	let MODE="display"
	let POLLMS=2500
	let polltimer=null
	let inapplyingfromcloud=false
	let ws=null
	let wsretrytimer=null

	function gettoken(){
		try{
			return JSON.parse(localStorage.getItem(WEBLSNAME+"token"))
		}catch(e){
			return null
		}
	}

	function applycloudstate(stateobj){
		if(!stateobj||Object.keys(stateobj).length==0){
			return
		}
		inapplyingfromcloud=true
		try{
			localStorage.setItem(STORAGEKEY,JSON.stringify(stateobj))
		}catch(e){}
		inapplyingfromcloud=false

		// 通知主腳本: state 變了, 請更新 render
		try{
			window.dispatchEvent(new CustomEvent("cloudsync-state",{
				detail: {
					state: stateobj
				}
			}))
		}catch(e){}
	}

	function pullfromcloud(callback){
		fetch(AJAXURL+"gettimer/"+SESSIONID).then(function(r){
			return r.json()
		}).then(function(d){
			if(d&&d.success&&d.data&&d.data.state){
				applycloudstate(d.data.state)
			}
			if(callback){
				callback()
			}
		}).catch(function(e){
			if(callback){
				callback()
			}
		})
	}

	function pushtocloud(statejson){
		if(inapplyingfromcloud){
			return
		}
		let token=gettoken()
		if(!token){
			return
		}
		let parsed=null
		try{
			parsed=JSON.parse(statejson)
		}catch(e){
			return
		}
		fetch(AJAXURL+"savetimer/"+SESSIONID,{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer "+token
			},
			body: JSON.stringify({
				state: parsed
			})
		}).catch(function(e){})
	}

	function setupwriteinterceptor(){
		// control 模式: monkey-patch Storage.setItem 抓自己 tab 的寫入
		if(MODE!="control"){
			return
		}
		let orig=Storage.prototype.setItem
		Storage.prototype.setItem=function(k,v){
			orig.apply(this,[k,v])
			if(this===localStorage&&k===STORAGEKEY){
				pushtocloud(v)
			}
		}
	}

	function startpolling(){
		if(polltimer){
			return
		}
		polltimer=setInterval(function(){
			pullfromcloud()
		},POLLMS)
	}

	function stoppolling(){
		if(polltimer){
			clearInterval(polltimer)
			polltimer=null
		}
	}

	function buildwsurl(){
		let proto="ws:"
		if(location.protocol=="https:"){
			proto="wss:"
		}
		let base=AJAXURL
		if(base.indexOf("/")==0){
			base=location.host+base
		}
		if(base.charAt(base.length-1)=="/"){
			base=base.substring(0,base.length-1)
		}
		return proto+"//"+base+"/ws/timer/"+SESSIONID+"/"
	}

	function connectws(){
		try{
			ws=new WebSocket(buildwsurl())
		}catch(e){
			console.warn("cloudsync: WS create failed, fallback polling")
			startpolling()
			return
		}

		ws.onopen=function(){
			stoppolling()
			console.log("cloudsync: WS connected")
		}

		ws.onmessage=function(ev){
			try{
				let msg=JSON.parse(ev.data)
				if((msg.type=="init"||msg.type=="update")&&msg.state){
					applycloudstate(msg.state)
				}
			}catch(e){}
		}

		ws.onclose=function(){
			ws=null
			console.warn("cloudsync: WS closed, fallback polling + retry")
			if(MODE=="display"){
				startpolling()
			}
			if(wsretrytimer){
				clearTimeout(wsretrytimer)
			}
			wsretrytimer=setTimeout(function(){
				connectws()
			},5000)
		}

		ws.onerror=function(e){
			console.warn("cloudsync: WS error",e)
		}
	}

	return {
		init: function(opts){
			SESSIONID=opts.sessionid
			MODE=opts.mode||"display"
			if(opts.storagekey){
				STORAGEKEY=opts.storagekey
			}
			if(opts.pollms){
				POLLMS=opts.pollms
			}
			if(!SESSIONID){
				console.warn("cloudsync: missing sessionid")
				return
			}
			// 1. monkey-patch (control 模式才需要)
			setupwriteinterceptor()
			// 2. 先用 REST pull 拿到目前狀態
			pullfromcloud(function(){
				if(opts.onready){
					opts.onready()
				}
			})
			// 3. 開 WebSocket
			connectws()
		},
		pull: pullfromcloud
	}
})()
