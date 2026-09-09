// PokerTrace Service Worker（檢查表 3.2.1 / 3.2.2）
// 策略：
//  - 導覽請求（HTML 頁面）：network-first，失敗時回快取，再失敗回 offline.html
//  - 程式碼檔（.js / .css）：network-first，線上一律拿最新，離線才回快取
//    （避免改版後使用者卡在舊快取，不必每次手動加 CACHEVERSION）
//  - 其他同源靜態檔（圖片等）：stale-while-revalidate
//  - API 請求、非 GET、跨來源（CDN）：一律直接走網路，不快取
// 改版時把 CACHEVERSION 加一，activate 會清掉舊快取。

const CACHEVERSION="pokertrace-v7"
const OFFLINE_URL = "offline.html"

// 預先快取的核心資源（相對於 SW scope，即 frontend/）
const PRECACHE = [
	"offline.html",
	"manifest.json",
	"initialize.js",
	"translate.js",
	"index.css",
	// Tailwind 從 Play CDN 改成本地建置產物後，這支是全站版面的命脈，沒有它整頁沒樣式。
	// 以前是跨來源 CDN（依上面策略不快取）→ 離線時本來就完全沒樣式；改本地後順便補進預快取。
	"tailwind.css"
]

// 這些路徑片段代表後端 API，永遠不快取
const APIHINTS = ["/backendapi/", "/project00061/"]

// 這些路徑片段代表同源靜態資源，即使命中 APIHINTS 也不算 API。
// frontend/：頁面與程式碼檔。material/：logo 與圖示（在 frontend/ 之外，
// 以前會被 "/project00061/" 誤判成 API 而完全不快取，離線時破圖）。
const STATICHINTS = ["/frontend/", "/material/"]

function isapi(url){
	for(let i = 0; i < APIHINTS.length; i = i + 1){
		if(url.pathname.indexOf(APIHINTS[i]) >= 0){
			let staticed = false
			for(let j = 0; j < STATICHINTS.length; j = j + 1){
				if(url.pathname.indexOf(STATICHINTS[j]) >= 0){
					staticed = true
				}
			}
			if(!staticed){
				return true
			}
		}
	}
	return false
}

self.addEventListener("install", function(event){
	event.waitUntil(
		caches.open(CACHEVERSION).then(function(cache){
			// 個別加入，避免某一支 404 導致整批失敗
			return Promise.all(PRECACHE.map(function(asset){
				return cache.add(asset).catch(function(){ return null })
			}))
		}).then(function(){
			return self.skipWaiting()
		})
	)
})

self.addEventListener("activate", function(event){
	event.waitUntil(
		caches.keys().then(function(keys){
			return Promise.all(keys.map(function(key){
				if(key != CACHEVERSION){
					return caches.delete(key)
				}
				return null
			}))
		}).then(function(){
			return self.clients.claim()
		})
	)
})

self.addEventListener("fetch", function(event){
	let request = event.request
	if(request.method !== "GET"){
		return
	}
	let url = new URL(request.url)
	// 跨來源（Tailwind / chrisplugin CDN 等）與 API：不介入
	if(url.origin !== self.location.origin){
		return
	}
	if(isapi(url)){
		return
	}

	// 導覽（HTML 頁面）：network-first
	if(request.mode === "navigate"){
		event.respondWith(
			fetch(request).then(function(response){
				if(response && response.ok){
					let copy = response.clone()
					caches.open(CACHEVERSION).then(function(cache){
						cache.put(request, copy)
					})
				}
				return response
			}).catch(function(){
				return caches.match(request).then(function(cached){
					return cached || caches.match(OFFLINE_URL)
				})
			})
		)
		return
	}

	// 程式碼檔（.js / .css）：network-first，線上永遠拿最新，離線才回快取
	if(/\.(?:js|css)$/i.test(url.pathname)){
		event.respondWith(
			fetch(request).then(function(response){
				if(response && response.status === 200 && response.type === "basic"){
					let copy = response.clone()
					caches.open(CACHEVERSION).then(function(cache){
						cache.put(request, copy)
					})
				}
				return response
			}).catch(function(){
				return caches.match(request)
			})
		)
		return
	}

	// 其他同源靜態檔：stale-while-revalidate
	event.respondWith(
		caches.match(request).then(function(cached){
			let network = fetch(request).then(function(response){
				if(response && response.status === 200 && response.type === "basic"){
					let copy = response.clone()
					caches.open(CACHEVERSION).then(function(cache){
						cache.put(request, copy)
					})
				}
				return response
			}).catch(function(){
				return cached
			})
			return cached || network
		})
	)
})
