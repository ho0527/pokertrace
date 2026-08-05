let GLOSSARY=[
	{en:"Buy-in",zh:"買入","notezh":"參加場次的基本費用","noteen":"Base cost to enter an event"},
	{en:"Stack",zh:"計分牌量","notezh":"選手手上的計分牌總數","noteen":"Total chips a player holds"},
	{en:"Big Blind (BB)",zh:"大盲","notezh":"強制下注，常用作計分牌深度單位","noteen":"Mandatory bet, commonly used as the unit of stack depth"},
	{en:"Small Blind (SB)",zh:"小盲","notezh":"位於大盲左手邊的強制下注","noteen":"Mandatory bet posted just before the big blind"},
	{en:"Ante",zh:"前注","notezh":"每位選手或大盲位於發牌前投入的小注","noteen":"Small bet posted before the deal by each player or the big blind"},
	{en:"Button (BTN)",zh:"莊位","notezh":"最有利的位置，最後行動","noteen":"The most favorable position, acting last"},
	{en:"UTG (Under the Gun)",zh:"槍口位","notezh":"翻牌前第一個行動的位置","noteen":"First position to act preflop"},
	{en:"Cutoff (CO)",zh:"關煞位","notezh":"莊位右手邊的位置","noteen":"The seat to the right of the button"},
	{en:"Pot Odds",zh:"底池賠率","notezh":"跟注金額與可贏底池的比例","noteen":"Ratio of the call amount to the pot you can win"},
	{en:"Equity",zh:"勝率 / 權益","notezh":"當前牌力贏得底池的機率","noteen":"Probability your current hand wins the pot"},
	{en:"Outs",zh:"補牌數","notezh":"能讓你成牌的剩餘牌張數","noteen":"Remaining cards that complete your hand"},
	{en:"ICM",zh:"獨立計分牌模型","notezh":"以名次獎金換算計分牌價值","noteen":"Converts chip counts into prize-money value by finish"},
	{en:"M-ratio",zh:"M 值","notezh":"計分牌相對於一圈盲注前注的倍數","noteen":"Your stack as a multiple of one orbit of blinds and antes"},
	{en:"SPR",zh:"底池計分牌比","notezh":"有效計分牌 ÷ 底池","noteen":"Effective stack ÷ pot"},
	{en:"Open Raise",zh:"開池加注","notezh":"翻牌前第一個加注進池","noteen":"The first raise into the pot preflop"},
	{en:"3-bet",zh:"再加注","notezh":"對開池加注的反加注","noteen":"A reraise of an open raise"},
	{en:"4-bet",zh:"四度下注","notezh":"對 3-bet 的再加注","noteen":"A reraise of a 3-bet"},
	{en:"C-bet (Continuation bet)",zh:"持續下注","notezh":"翻牌前加注者在翻牌續攻","noteen":"A follow-up bet on the flop by the preflop raiser"},
	{en:"Check-raise",zh:"過牌加注","notezh":"先過牌再對對手下注加注","noteen":"Checking first, then raising a bet behind you"},
	{en:"Float",zh:"漂浮跟注","notezh":"用較弱牌跟注，計畫後續搶池","noteen":"Calling with a weaker hand, planning to take the pot on a later street"},
	{en:"Bluff",zh:"詐唬","notezh":"以弱牌下注迫使對手棄牌","noteen":"Betting a weak hand to make opponents fold"},
	{en:"Value Bet",zh:"價值下注","notezh":"以較強牌下注求被較弱牌跟注","noteen":"Betting a strong hand to get called by worse"},
	{en:"MDF",zh:"最小防守頻率","notezh":"防止對手任意詐唬獲利的最低跟注比例","noteen":"Minimum defend frequency that stops opponents bluffing profitably"},
	{en:"Range",zh:"範圍","notezh":"某情境下可能持有的所有牌組合","noteen":"All the hand combinations possible in a given spot"},
	{en:"Nuts",zh:"堅果牌","notezh":"當前最大的牌","noteen":"The best possible hand at the moment"},
	{en:"Cooler",zh:"撞牌","notezh":"兩手大牌相撞、難以避免輸錢","noteen":"Two big hands clash, making losses hard to avoid"},
	{en:"Bad Beat",zh:"爆冷被逆轉","notezh":"領先很多卻被反超","noteen":"A big favorite gets overtaken on a late card"},
	{en:"Bubble",zh:"泡沫期","notezh":"距離進入獎圈只差一兩名","noteen":"One or two spots away from the money"},
	{en:"ITM (In the Money)",zh:"進入獎圈","notezh":"已確定能拿到獎金的名次","noteen":"A finish that guarantees a payout"},
	{en:"Final Table (FT)",zh:"決賽桌","notezh":"剩最後一桌的階段","noteen":"The stage with only one table left"},
	{en:"Deal / Chop",zh:"拆彩金","notezh":"剩餘選手協議分配獎金","noteen":"Remaining players agree to split the prize money"},
	{en:"Chip Race",zh:"計分牌競賽","notezh":"移除小面額時的進位流程","noteen":"The rounding process when removing small denominations"},
	{en:"Color Up",zh:"換色","notezh":"把小面額換成大面額計分牌","noteen":"Swapping small denominations for larger chips"},
	{en:"Re-entry",zh:"重新報名","notezh":"淘汰後以新買入再次進場","noteen":"Entering again with a new buy-in after busting"},
	{en:"Rebuy",zh:"重購","notezh":"計分牌過低時補購計分牌","noteen":"Buying more chips when your stack is low"},
	{en:"Add-on",zh:"加購","notezh":"特定時點額外加購計分牌","noteen":"An extra chip purchase at a specific point"},
	{en:"PKO (Progressive KO)",zh:"漸進賞金賽","notezh":"擊倒對手獲得部分賞金、部分加到自己頭上","noteen":"Knocking out an opponent wins part of their bounty and adds part to your own"},
	{en:"Late Reg",zh:"延遲報名","notezh":"開賽後仍可報名的時段","noteen":"The window when you can still register after the start"},
	{en:"Level",zh:"級數","notezh":"盲注結構的一個階段","noteen":"One stage of the blind structure"},
	{en:"Time Bank",zh:"延時計分牌","notezh":"決策超時可動用的額外思考時間","noteen":"Extra thinking time you can use when a decision runs long"}
]

function gltext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["glossarypage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["glossarypage"][key]||key
}

function renderglossary(){
	let q=String(getvalue("glsearch")||"").trim().toLowerCase()
	let html=""
	let count=0
	for(let i=0;i<GLOSSARY.length;i=i+1){
		let g=GLOSSARY[i]
		let note=(function(){if(LANGUAGE=="en"){return g.noteen}return g.notezh})()
		let hay=(g.en+" "+g.zh+" "+g.noteen+" "+g.notezh).toLowerCase()
		if(q!=""&&hay.indexOf(q)==-1){
			continue
		}
		count=count+1
		html=html+`
			<div class="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
				<div class="flex flex-wrap items-baseline justify-between gap-2">
					<span class="font-bold text-white">${g.en}</span>
					<span class="text-emerald-400">${g.zh}</span>
				</div>
				<div class="mt-1 text-sm text-zinc-400">${note}</div>
			</div>
		`
	}
	if(count==0){
		html=`<div class="text-sm text-zinc-500">${gltext("noresult")}</div>`
	}
	innerhtml("#glrows",html,false)
	innertext("#glcount",count+" "+gltext("terms"),false)
}

function applygllanguage(){
	document.title=gltext("title")+" - PokerTrace"
	innertext("#gltitle",gltext("title"),false)
	innertext("#back",gltext("back"),false)
	domgetid("glsearch").setAttribute("placeholder",gltext("search"))
	renderglossary()
}

oninput("#glsearch",renderglossary)

applygllanguage()
