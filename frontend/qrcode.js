// 自帶、不依賴 CDN 的 QR Code 產生器（byte 模式，含 Reed-Solomon 糾錯與遮罩選擇）。
// 演算法依 QR Code 標準（作法參考 Nayuki 的公開實作，改寫成本專案風格）。
// 對外：qrmatrix(text,ecclevel) 回傳 {"size":n,"modules":[[bool,...],...]}。
// ecclevel 傳 "L" / "M" / "Q" / "H"，預設 "M"。

// 每個糾錯等級、每個版本(1..40)的「每區塊糾錯碼字數」與「區塊數」。index 0 為佔位。
const QRECCCODEWORDSPERBLOCK={
	"L": [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
	"M": [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
	"Q": [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
	"H": [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]
}
const QRNUMBLOCKS={
	"L": [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
	"M": [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
	"Q": [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
	"H": [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]
}
// 糾錯等級在格式資訊裡的 2-bit 值。
const QRECCFORMATBITS={
	"L": 1,
	"M": 0,
	"Q": 3,
	"H": 2
}

function qrgetbit(value,index){
	return ((value>>>index)&1)!=0
}

// GF(256) 乘法（多項式 0x11D），不需查表。
function qrgfmultiply(x,y){
	let z=0
	for(let i=7;i>=0;i=i-1){
		z=(z<<1)^((z>>>7)*0x11d)
		z=z^(((y>>>i)&1)*x)
	}
	return z&0xff
}

// 產生 Reed-Solomon 除式（generator polynomial）係數，長度為 degree。
function qrrsdivisor(degree){
	let result=[]
	for(let i=0;i<degree-1;i=i+1){
		result.push(0)
	}
	result.push(1)
	let root=1
	for(let i=0;i<degree;i=i+1){
		for(let j=0;j<result.length;j=j+1){
			result[j]=qrgfmultiply(result[j],root)
			if(j+1<result.length){
				result[j]=result[j]^result[j+1]
			}
		}
		root=qrgfmultiply(root,0x02)
	}
	return result
}

// 計算 data 對 divisor 的餘式（即糾錯碼字），長度為 divisor.length。
function qrrsremainder(data,divisor){
	let result=[]
	for(let i=0;i<divisor.length;i=i+1){
		result.push(0)
	}
	for(let k=0;k<data.length;k=k+1){
		let factor=data[k]^result[0]
		result.shift()
		result.push(0)
		for(let i=0;i<result.length;i=i+1){
			result[i]=result[i]^qrgfmultiply(divisor[i],factor)
		}
	}
	return result
}

function qrnumrawdatamodules(ver){
	let result=(16*ver+128)*ver+64
	if(ver>=2){
		let numalign=Math.floor(ver/7)+2
		result=result-((25*numalign-10)*numalign-55)
		if(ver>=7){
			result=result-36
		}
	}
	return result
}

function qrnumdatacodewords(ver,ecl){
	return Math.floor(qrnumrawdatamodules(ver)/8)-QRECCCODEWORDSPERBLOCK[ecl][ver]*QRNUMBLOCKS[ecl][ver]
}

function qralignmentpositions(ver){
	if(ver==1){
		return []
	}
	let numalign=Math.floor(ver/7)+2
	let step=26
	if(ver!=32){
		step=Math.ceil((ver*4+4)/(numalign*2-2))*2
	}
	let result=[6]
	for(let pos=ver*4+10;result.length<numalign;pos=pos-step){
		result.splice(1,0,pos)
	}
	return result
}

// 把文字轉成 UTF-8 位元組陣列。
function qrutf8bytes(text){
	let encoded=unescape(encodeURIComponent(text))
	let bytes=[]
	for(let i=0;i<encoded.length;i=i+1){
		bytes.push(encoded.charCodeAt(i)&0xff)
	}
	return bytes
}

// 依資料長度挑最小可容納的版本。
function qrpickversion(datalen,ecl){
	for(let ver=1;ver<=40;ver=ver+1){
		let ccbits=8
		if(ver>=10){
			ccbits=16
		}
		let capacitybits=qrnumdatacodewords(ver,ecl)*8
		let needbits=4+ccbits+datalen*8
		if(needbits<=capacitybits){
			return ver
		}
	}
	return -1
}

// 把資料碼字分區塊、各自算糾錯，再交錯合併。
function qraddeccandinterleave(datacodewords,ver,ecl){
	let numblocks=QRNUMBLOCKS[ecl][ver]
	let blockecclen=QRECCCODEWORDSPERBLOCK[ecl][ver]
	let rawcodewords=Math.floor(qrnumrawdatamodules(ver)/8)
	let numshortblocks=numblocks-rawcodewords%numblocks
	let shortblocklen=Math.floor(rawcodewords/numblocks)
	let blocks=[]
	let rsdiv=qrrsdivisor(blockecclen)
	let k=0
	for(let i=0;i<numblocks;i=i+1){
		let datlen=shortblocklen-blockecclen
		if(i>=numshortblocks){
			datlen=datlen+1
		}
		let dat=datacodewords.slice(k,k+datlen)
		k=k+datlen
		let ecc=qrrsremainder(dat,rsdiv)
		if(i<numshortblocks){
			dat.push(0)
		}
		blocks.push(dat.concat(ecc))
	}
	let result=[]
	for(let i=0;i<blocks[0].length;i=i+1){
		for(let j=0;j<blocks.length;j=j+1){
			if(i!=shortblocklen-blockecclen||j>=numshortblocks){
				result.push(blocks[j][i])
			}
		}
	}
	return result
}

function qrnewgrid(size,fill){
	let grid=[]
	for(let y=0;y<size;y=y+1){
		let row=[]
		for(let x=0;x<size;x=x+1){
			row.push(fill)
		}
		grid.push(row)
	}
	return grid
}

function qrsetfunction(state,x,y,dark){
	if(x<0||y<0||x>=state["size"]||y>=state["size"]){
		return
	}
	state["modules"][y][x]=dark
	state["isfunction"][y][x]=true
}

function qrdrawfinder(state,cx,cy){
	for(let dy=-4;dy<=4;dy=dy+1){
		for(let dx=-4;dx<=4;dx=dx+1){
			let dist=Math.max(Math.abs(dx),Math.abs(dy))
			qrsetfunction(state,cx+dx,cy+dy,dist!=2&&dist!=4)
		}
	}
}

function qrdrawalignment(state,cx,cy){
	for(let dy=-2;dy<=2;dy=dy+1){
		for(let dx=-2;dx<=2;dx=dx+1){
			qrsetfunction(state,cx+dx,cy+dy,Math.max(Math.abs(dx),Math.abs(dy))!=1)
		}
	}
}

function qrdrawformatbits(state,mask){
	let data=(QRECCFORMATBITS[state["ecl"]]<<3)|mask
	let rem=data
	for(let i=0;i<10;i=i+1){
		rem=(rem<<1)^((rem>>>9)*0x537)
	}
	let bits=((data<<10)|rem)^0x5412
	let size=state["size"]
	for(let i=0;i<=5;i=i+1){
		qrsetfunction(state,8,i,qrgetbit(bits,i))
	}
	qrsetfunction(state,8,7,qrgetbit(bits,6))
	qrsetfunction(state,8,8,qrgetbit(bits,7))
	qrsetfunction(state,7,8,qrgetbit(bits,8))
	for(let i=9;i<15;i=i+1){
		qrsetfunction(state,14-i,8,qrgetbit(bits,i))
	}
	for(let i=0;i<8;i=i+1){
		qrsetfunction(state,size-1-i,8,qrgetbit(bits,i))
	}
	for(let i=8;i<15;i=i+1){
		qrsetfunction(state,8,size-15+i,qrgetbit(bits,i))
	}
	qrsetfunction(state,8,size-8,true)
}

function qrdrawversion(state){
	let ver=state["version"]
	if(ver<7){
		return
	}
	let rem=ver
	for(let i=0;i<12;i=i+1){
		rem=(rem<<1)^((rem>>>11)*0x1f25)
	}
	let bits=(ver<<12)|rem
	let size=state["size"]
	for(let i=0;i<18;i=i+1){
		let color=qrgetbit(bits,i)
		let a=size-11+i%3
		let b=Math.floor(i/3)
		qrsetfunction(state,a,b,color)
		qrsetfunction(state,b,a,color)
	}
}

function qrdrawfunctionpatterns(state){
	let size=state["size"]
	for(let i=0;i<size;i=i+1){
		qrsetfunction(state,6,i,i%2==0)
		qrsetfunction(state,i,6,i%2==0)
	}
	qrdrawfinder(state,3,3)
	qrdrawfinder(state,size-4,3)
	qrdrawfinder(state,3,size-4)
	let positions=qralignmentpositions(state["version"])
	let count=positions.length
	for(let i=0;i<count;i=i+1){
		for(let j=0;j<count;j=j+1){
			let skipcorner=(i==0&&j==0)||(i==0&&j==count-1)||(i==count-1&&j==0)
			if(!skipcorner){
				qrdrawalignment(state,positions[i],positions[j])
			}
		}
	}
	qrdrawformatbits(state,0)
	qrdrawversion(state)
}

function qrdrawcodewords(state,codewords){
	let size=state["size"]
	let i=0
	for(let right=size-1;right>=1;right=right-2){
		if(right==6){
			right=5
		}
		for(let vert=0;vert<size;vert=vert+1){
			for(let j=0;j<2;j=j+1){
				let x=right-j
				let upward=((right+1)&2)==0
				let y=size-1-vert
				if(!upward){
					y=vert
				}
				if(!state["isfunction"][y][x]&&i<codewords.length*8){
					state["modules"][y][x]=qrgetbit(codewords[i>>>3],7-(i&7))
					i=i+1
				}
			}
		}
	}
}

function qrmaskcondition(mask,x,y){
	if(mask==0){
		return (x+y)%2==0
	}
	if(mask==1){
		return y%2==0
	}
	if(mask==2){
		return x%3==0
	}
	if(mask==3){
		return (x+y)%3==0
	}
	if(mask==4){
		return (Math.floor(x/3)+Math.floor(y/2))%2==0
	}
	if(mask==5){
		return (x*y)%2+(x*y)%3==0
	}
	if(mask==6){
		return ((x*y)%2+(x*y)%3)%2==0
	}
	return (((x+y)%2)+(x*y)%3)%2==0
}

function qrapplymask(state,mask){
	let size=state["size"]
	for(let y=0;y<size;y=y+1){
		for(let x=0;x<size;x=x+1){
			if(!state["isfunction"][y][x]&&qrmaskcondition(mask,x,y)){
				state["modules"][y][x]=!state["modules"][y][x]
			}
		}
	}
}

// 遮罩懲罰分數（僅影響選哪個遮罩，不影響可掃描性）。實作規則 1、2、4。
function qrpenalty(state){
	let size=state["size"]
	let modules=state["modules"]
	let result=0
	// 規則 1：橫向、縱向連續同色 >=5
	for(let y=0;y<size;y=y+1){
		let run=1
		for(let x=1;x<size;x=x+1){
			if(modules[y][x]==modules[y][x-1]){
				run=run+1
				if(run==5){
					result=result+3
				}else if(run>5){
					result=result+1
				}
			}else{
				run=1
			}
		}
	}
	for(let x=0;x<size;x=x+1){
		let run=1
		for(let y=1;y<size;y=y+1){
			if(modules[y][x]==modules[y-1][x]){
				run=run+1
				if(run==5){
					result=result+3
				}else if(run>5){
					result=result+1
				}
			}else{
				run=1
			}
		}
	}
	// 規則 2：2x2 同色方塊
	for(let y=0;y<size-1;y=y+1){
		for(let x=0;x<size-1;x=x+1){
			let c=modules[y][x]
			if(c==modules[y][x+1]&&c==modules[y+1][x]&&c==modules[y+1][x+1]){
				result=result+3
			}
		}
	}
	// 規則 4：深色比例偏離 50%
	let dark=0
	for(let y=0;y<size;y=y+1){
		for(let x=0;x<size;x=x+1){
			if(modules[y][x]){
				dark=dark+1
			}
		}
	}
	let total=size*size
	let k=Math.ceil(Math.abs(dark*20-total*10)/total)-1
	result=result+k*10
	return result
}

// 對外主函式：把文字編成 QR，回傳 {"size":n,"modules":二維 bool}。
function qrmatrix(text,ecl){
	if(!ecl){
		ecl="M"
	}
	let databytes=qrutf8bytes(text)
	let version=qrpickversion(databytes.length,ecl)
	if(version<0){
		return null
	}
	let ccbits=8
	if(version>=10){
		ccbits=16
	}
	// 組位元流：mode(byte=0100) + 長度 + 資料位元組
	let bits=[]
	function qrappendbits(value,length){
		for(let i=length-1;i>=0;i=i-1){
			bits.push((value>>>i)&1)
		}
	}
	qrappendbits(4,4)
	qrappendbits(databytes.length,ccbits)
	for(let i=0;i<databytes.length;i=i+1){
		qrappendbits(databytes[i],8)
	}
	let capacitybits=qrnumdatacodewords(version,ecl)*8
	// 終止符
	let terminator=Math.min(4,capacitybits-bits.length)
	for(let i=0;i<terminator;i=i+1){
		bits.push(0)
	}
	// 補到位元組邊界
	while(bits.length%8!=0){
		bits.push(0)
	}
	// 位元 → 碼字
	let datacodewords=[]
	for(let i=0;i<bits.length;i=i+8){
		let value=0
		for(let j=0;j<8;j=j+1){
			value=(value<<1)|bits[i+j]
		}
		datacodewords.push(value)
	}
	// 補位元組 0xEC / 0x11
	let padtoggle=0xec
	while(datacodewords.length<Math.floor(capacitybits/8)){
		datacodewords.push(padtoggle)
		if(padtoggle==0xec){
			padtoggle=0x11
		}else{
			padtoggle=0xec
		}
	}
	let allcodewords=qraddeccandinterleave(datacodewords,version,ecl)
	let size=version*4+17
	let state={
		"size": size,
		"version": version,
		"ecl": ecl,
		"modules": qrnewgrid(size,false),
		"isfunction": qrnewgrid(size,false)
	}
	qrdrawfunctionpatterns(state)
	qrdrawcodewords(state,allcodewords)
	// 選遮罩：算 8 種懲罰分數取最低
	let bestmask=0
	let bestpenalty=-1
	for(let mask=0;mask<8;mask=mask+1){
		qrapplymask(state,mask)
		qrdrawformatbits(state,mask)
		let penalty=qrpenalty(state)
		if(bestpenalty<0||penalty<bestpenalty){
			bestpenalty=penalty
			bestmask=mask
		}
		qrapplymask(state,mask)
	}
	qrapplymask(state,bestmask)
	qrdrawformatbits(state,bestmask)
	return {
		"size": state["size"],
		"modules": state["modules"]
	}
}
