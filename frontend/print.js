// 共用列印模組
// 把資料組成乾淨的黑白文件，塞進 body 直下的 #ptprintroot，再呼叫 window.print()。
// 列印樣式在 print.css，列印時只顯示 #ptprintroot、隱藏站台其他元素。

function ptprintescape(value){
	if(value==null){
		return ""
	}
	return String(value)
		.replace(/&/g,"&amp;")
		.replace(/</g,"&lt;")
		.replace(/>/g,"&gt;")
		.replace(/"/g,"&quot;")
		.replace(/'/g,"&#39;")
}

// 取得（必要時建立）列印容器，並清空內容。容器一定掛在 body 直下。
function ptprintcontainer(){
	let root=document.getElementById("ptprintroot")
	if(!root){
		root=document.createElement("div")
		root.id="ptprintroot"
		document.body.appendChild(root)
	}
	root.innerHTML=""
	return root
}

// 資訊區塊：pairs 為 [["標籤","值"],...]
function ptprintinfogrid(pairs){
	let html=`<div class="ptprintinfogrid">`
	for(let i=0;i<pairs.length;i=i+1){
		html=html+`
			<div class="ptprintinforow">
				<span class="ptprintinfolabel">${ptprintescape(pairs[i][0])}</span>
				<span class="ptprintinfovalue">${ptprintescape(pairs[i][1])}</span>
			</div>
		`
	}
	html=html+`</div>`
	return html
}

// 表格：columns 為 [{"title":"選手","align":"left"},...]；rows 為二維字串陣列。
function ptprinttable(columns,rows,emptytext){
	if(!rows||rows.length<1){
		return `<div class="ptprintempty">${ptprintescape(emptytext||"無資料")}</div>`
	}
	let head=""
	for(let i=0;i<columns.length;i=i+1){
		let align=columns[i]["align"]||"left"
		let cls=align=="right"?"ptprintnum":(align=="center"?"ptprintcenter":"")
		head=head+`<th class="${cls}">${ptprintescape(columns[i]["title"])}</th>`
	}
	let body=""
	for(let r=0;r<rows.length;r=r+1){
		let cells=""
		for(let c=0;c<columns.length;c=c+1){
			let align=columns[c]["align"]||"left"
			let cls=align=="right"?"ptprintnum":(align=="center"?"ptprintcenter":"")
			cells=cells+`<td class="${cls}">${ptprintescape(rows[r][c])}</td>`
		}
		body=body+`<tr>${cells}</tr>`
	}
	return `
		<table class="ptprinttable">
			<thead><tr>${head}</tr></thead>
			<tbody>${body}</tbody>
		</table>
	`
}

function ptprintsectiontitle(text){
	return `<div class="ptprintsectiontitle">${ptprintescape(text)}</div>`
}

// 簽名 / 用印區
function ptprintsignblock(labels){
	let html=`<div class="ptprintfoot">`
	for(let i=0;i<labels.length;i=i+1){
		html=html+`
			<div class="ptprintsign">
				<div class="ptprintsignline"></div>
				<div class="ptprintsignlabel">${ptprintescape(labels[i])}</div>
			</div>
		`
	}
	html=html+`</div>`
	return html
}

// 組出文件外框：eyebrow 小標、title 主標、subtitle 副標、meta 產出資訊、bodyhtml 內容。
function ptprintbuild(options,bodyhtml){
	let eyebrow=options["eyebrow"]||""
	let title=options["title"]||""
	let subtitle=options["subtitle"]||""
	let meta=options["meta"]||""
	return `
		<div class="ptprintdoc">
			<div class="ptprinthead">
				${eyebrow?`<div class="ptprinteyebrow">${ptprintescape(eyebrow)}</div>`:""}
				<div class="ptprinttitle">${ptprintescape(title)}</div>
				${subtitle?`<div class="ptprintsubtitle">${ptprintescape(subtitle)}</div>`:""}
				${meta?`<div class="ptprintmeta">${ptprintescape(meta)}</div>`:""}
			</div>
			${bodyhtml}
		</div>
	`
}

// 產出「列印時間」字串，供 meta 使用。
function ptprinttimestamp(){
	let now=new Date()
	let year=now.getFullYear()
	let month=String(now.getMonth()+1).padStart(2,"0")
	let day=String(now.getDate()).padStart(2,"0")
	let hour=String(now.getHours()).padStart(2,"0")
	let minute=String(now.getMinutes()).padStart(2,"0")
	return year+"-"+month+"-"+day+" "+hour+":"+minute
}

// 設定列印紙張大小。名單類用 A4；收據（80mm）由 receipt.js 另外設定。
// 兩者共用同一個 <style id="ptpagestyle"> 節點，各自在列印前設定，避免殘留互相干擾。
function ptsetpagestyle(css){
	let el=document.getElementById("ptpagestyle")
	if(!el){
		el=document.createElement("style")
		el.id="ptpagestyle"
		document.head.appendChild(el)
	}
	el.textContent=css
}

// 把組好的 HTML 塞進列印容器並開啟列印對話框（名單類固定 A4）。
function ptprintrun(html){
	let root=ptprintcontainer()
	root.innerHTML=html
	ptsetpagestyle("@page{size:A4;margin:12mm}")
	window.print()
}
