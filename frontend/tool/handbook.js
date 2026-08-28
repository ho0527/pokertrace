let handbookcategory="all"
let handbookcurrentid="texasholdem"

const HANDBOOKCATEGORYLIST=[
	{ "id": "all","zhtw": "全部","en": "All" },
	{ "id": "holdem","zhtw": "德州系","en": "Hold'em" },
	{ "id": "omaha","zhtw": "奧馬哈系","en": "Omaha" },
	{ "id": "draw","zhtw": "抽牌系","en": "Draw" },
	{ "id": "stud","zhtw": "梭哈系","en": "Stud" }
]

const HANDBOOKTEXT={
	"zhtw": {
		"title": "撲克玩法手冊",
		"desc": "查玩法、發牌流程與勝負判定。基本規則集中在各系列的主要玩法中，變體可用參見快速跳回。",
		"back": "回上一頁",
		"searchlabel": "搜尋玩法",
		"searchplaceholder": "輸入 Hold'em、Omaha、Razz",
		"listtitle": "玩法列表",
		"resultunit": "項",
		"noresult": "找不到符合的玩法",
		"overview": "玩法重點",
		"ranktitle": "高牌牌型順序",
		"detail": "詳細說明",
		"deal": "發牌流程",
		"winner": "勝負判定",
		"seealso": "參見"
	},
	"en": {
		"title": "Poker Handbook",
		"desc": "Look up game flow, deal structure, and winner rules. Core rules live in the main game for each family, with variants linking back through See Also.",
		"back": "Back",
		"searchlabel": "Search games",
		"searchplaceholder": "Type Hold'em, Omaha, Razz",
		"listtitle": "Game List",
		"resultunit": "items",
		"noresult": "No matching game",
		"overview": "Overview",
		"ranktitle": "High-Hand Ranking",
		"detail": "Detailed Notes",
		"deal": "Deal Flow",
		"winner": "Winner",
		"seealso": "See Also"
	}
}

const HANDBOOKGAMELIST=[
	{ "id": "texasholdem","category": "holdem","title": "Texas Hold'em","ztitle": "德州撲克","zsummary": "每人 2 張手牌，最後會有 5 張公共牌。選手可用 0、1 或 2 張手牌組成最佳 5 張牌。","esummary": "Each player gets 2 hole cards and up to 5 community cards. Use any 0, 1, or 2 hole cards to make the best 5-card hand.","zdeal": "盲注與前注後發手牌，依序進行翻前、翻牌、轉牌、河牌下注。","edeal": "Post blinds and antes, deal hole cards, then play preflop, flop, turn, and river betting rounds.","zwinner": "最高 5 張牌型勝；同牌力平分底池，不可拆分計分牌由越前位獲得。","ewinner": "Best high 5-card poker hand wins; tied hands split the pot, and any indivisible odd chip goes to the earliest position.","ztip": "這是多數變體的母規則；先確認按鈕、盲注、前注與下注結構。","etip": "This is the parent structure for many variants; confirm button, blinds, antes, and betting limit first." },
	{ "id": "threeoneholdem","category": "holdem","title": "3-2-1 Hold'em","ztitle": "3-2-1 德州","zsummary": "公共牌不是 3-1-1，而是分成 3 張、2 張、1 張逐段開出，總共 6 張公共牌。","esummary": "Community cards come as 3, then 2, then 1, giving 6 total board cards instead of the normal 5.","zdeal": "翻前後先開 3 張，再開 2 張，最後開 1 張，每段後下注。","edeal": "After preflop, deal 3 community cards, then 2, then 1, with betting after each street.","zwinner": "用 2 張手牌與公共牌任意組合的最佳高牌勝。","ewinner": "Best high hand from the player's hole cards and the board wins.","ztip": "多一張公共牌會讓成牌強度上升，攤牌前請提醒選手公共牌總數。","etip": "The extra board card raises hand strength; remind players how many board cards are live." },
	{ "id": "atomicpineapple","category": "holdem","title": "Atomic Pineapple","ztitle": "超級大菠蘿","zsummary": "Pineapple 變體，通常每人 3 張手牌並在指定街棄掉 1 張。","esummary": "A Pineapple variant where players usually begin with 3 hole cards and discard 1 on a set street.","zdeal": "先發 3 張手牌，依場規在翻牌前或翻牌後棄 1 張，再照德州流程。","edeal": "Deal 3 hole cards, discard 1 before or after the flop by house rule, then continue like Hold'em.","zwinner": "剩下手牌與公共牌組成最佳高牌。","ewinner": "Best high hand using the retained hole cards and board wins.","ztip": "開賽前一定要公告棄牌時點，不同 Pineapple 變體差異都在這裡。","etip": "Announce the discard timing before play; that timing is the key difference among Pineapple variants." },
	{ "id": "crazypineapple","category": "holdem","title": "Crazy Pineapple","ztitle": "瘋狂大菠蘿","zsummary": "每人 3 張手牌，看完翻牌後棄掉 1 張，剩下 2 張打到河牌。","esummary": "Each player starts with 3 hole cards, sees the flop, then discards 1 and continues with 2.","zdeal": "翻前發 3 張，翻牌下注後棄 1 張，再轉牌、河牌。","edeal": "Deal 3 preflop, bet the flop, discard 1, then play turn and river.","zwinner": "與德州相同，最佳高牌勝。","ewinner": "Same as Hold'em: best high hand wins.","ztip": "棄牌前資訊較多，翻牌圈牌力會偏強。","etip": "Players make the discard with more information, so flop ranges run stronger." },
	{ "id": "crymeariverholdem","category": "holdem","title": "Cry Me A River - Hold'em","ztitle": "Cry Me A River 德州","zsummary": "河牌街會有額外公共牌或特殊河牌處理的德州變體。","esummary": "A Hold'em variant built around extra or special river-card handling.","zdeal": "翻前、翻牌、轉牌照德州；河牌依場規加入特殊公共牌流程。","edeal": "Preflop, flop, and turn follow Hold'em; the river uses the announced special board procedure.","zwinner": "依公告可用公共牌組成最佳高牌。","ewinner": "Best high hand using the announced available board cards wins.","ztip": "名字相近的 River 變體很多，請把河牌張數與可用方式寫在結構表。","etip": "River variants are easy to confuse; write the river-card count and usage rule on the structure sheet." },
	{ "id": "deuceswild","category": "holdem","title": "Deuces Wild","ztitle": "萬用2","zsummary": "2 可作萬用牌的高牌遊戲，成牌強度會大幅提高。","esummary": "A high-hand game where deuces act as wild cards, greatly increasing made-hand strength.","zdeal": "發牌與下注通常依德州流程，所有 2 依公告視為 wild。","edeal": "Deal and betting usually follow Hold'em; all deuces are wild as announced.","zwinner": "含 wild 牌後的最佳高牌勝。","ewinner": "Best high hand after applying wild-card rules wins.","ztip": "Wild 牌會改變牌型稀有度，攤牌時建議由 floor 或計分員覆核。","etip": "Wild cards change hand rarity; have the floor or dealer verify showdowns carefully." },
	{ "id": "doubleboardholdem","category": "holdem","title": "Double Board - Hold'em","ztitle": "雙牌面德州","zsummary": "同一手牌開兩組公共牌，常見玩法是兩個牌面各分半池。","esummary": "One hand plays across two boards, commonly splitting the pot between the two boards.","zdeal": "手牌照德州；翻牌、轉牌、河牌各開兩組牌面。","edeal": "Hole cards follow Hold'em; flop, turn, and river are dealt for two separate boards.","zwinner": "每個牌面各自判定最佳高牌，通常各拿半池。","ewinner": "Each board awards its share to the best high hand on that board.","ztip": "攤牌時請逐一標示 Board 1 / Board 2，避免派彩混亂。","etip": "Label Board 1 and Board 2 during showdown to avoid payout confusion." },
	{ "id": "doubleboardbombholdem","category": "holdem","title": "Double Board Bomb Pot - Hold'em","ztitle": "雙牌面 Bomb Pot 德州","zsummary": "所有人先投入強制金額，通常沒有翻前棄牌，直接看雙牌面翻牌。","esummary": "Everyone antes a set amount, usually with no preflop fold, then plays two boards from the flop.","zdeal": "收 bomb pot 前注，發手牌，直接開兩組翻牌後開始下注。","edeal": "Collect the bomb-pot ante, deal hole cards, reveal two flops, then betting begins.","zwinner": "兩個牌面分別判定，常見為半池半池。","ewinner": "Each board is judged separately, commonly for half the pot each.","ztip": "先公告 bomb pot 金額與是否所有在座必須參與。","etip": "Announce the bomb-pot amount and whether every seated player must participate." },
	{ "id": "lazyrivers","category": "holdem","title": "Lazy Rivers","ztitle": "Lazy Rivers","zsummary": "德州河牌變體，通常加入多張或延後揭示的 river 選項。","esummary": "A Hold'em river variant, usually involving multiple or delayed river options.","zdeal": "前面街道照德州；河牌依場規一次或分段揭示。","edeal": "Earlier streets follow Hold'em; river cards are revealed according to the house procedure.","zwinner": "依可用河牌組出最佳高牌。","ewinner": "Best high hand using the available river structure wins.","ztip": "務必在發牌前說清楚每位選手可用哪一張 river。","etip": "Clarify exactly which river card or cards are available to each player before the deal." },
	{ "id": "noahsark","category": "holdem","title": "Noah's Ark (2x2)","ztitle": "Noah's Ark (2x2)","zsummary": "雙組牌面或雙組手牌概念的 Hold'em 變體，重點是分區判定。","esummary": "A Hold'em variant with a two-by-two board or hand concept, centered on separated evaluations.","zdeal": "依 2x2 規則發出分區牌面，下注流程跟德州接近。","edeal": "Deal the separated 2x2 layout, with betting close to Hold'em structure.","zwinner": "依公告的分區組牌規則判定高牌。","ewinner": "High hands are judged under the announced section-combination rule.","ztip": "第一次玩建議把牌面排列固定，讓選手看得懂哪些牌互相連動。","etip": "Use a consistent board layout so players can see which cards belong together." },
	{ "id": "pineapple","category": "holdem","title": "Pineapple","ztitle": "Pineapple","zsummary": "每人 3 張手牌，通常翻牌前棄掉 1 張後回到德州。","esummary": "Each player receives 3 hole cards, usually discards 1 before the flop, then plays like Hold'em.","zdeal": "發 3 張手牌，指定時點棄 1 張，再依德州四街下注。","edeal": "Deal 3 hole cards, discard 1 at the specified time, then play the four Hold'em streets.","zwinner": "剩餘手牌與公共牌組最佳高牌。","ewinner": "Best high hand from the retained hole cards and board wins.","ztip": "和 Crazy Pineapple 的差別是棄牌時點，入口名稱要標清楚。","etip": "The discard timing separates this from Crazy Pineapple; label it clearly." },
	{ "id": "redriverholdem","category": "holdem","title": "Red River - Holdem","ztitle": "Red River 德州","zsummary": "以 river 街特殊規則為主的 Hold'em 變體。","esummary": "A Hold'em variant focused on a special river-street rule.","zdeal": "翻前到轉牌照德州；river 依 Red River 規則處理。","edeal": "Preflop through turn follow Hold'em; the river follows the Red River procedure.","zwinner": "依公告可用牌組最佳高牌。","ewinner": "Best high hand using the announced available cards wins.","ztip": "River 系列變體請在開賽前做一手示範牌。","etip": "For river-family variants, run a demo hand before the first live hand." },
	{ "id": "shortdeck","category": "holdem","title": "Short Deck (Six-Plus)","ztitle": "短牌德州（Six-Plus）","zsummary": "移除 2 到 5，只用 36 張牌。A 可作高張，也常可接 6 組 A-6-7-8-9 順子。","esummary": "Cards 2 through 5 are removed for a 36-card deck. Aces play high and often also low for A-6-7-8-9.","zdeal": "流程接近德州，常用 ante 加 button blind 結構。","edeal": "Flow is close to Hold'em, often using antes plus a button blind.","zwinner": "短牌牌型大小依場規，常見同花大於葫蘆。","ewinner": "Short Deck ranking is house-defined; flush commonly beats full house.","ztip": "短牌牌型排序不是每場都一樣，必須在頁面或口頭公告。","etip": "Short Deck rankings vary; announce them on the sheet or out loud." },
	{ "id": "superholdem","category": "holdem","title": "Super Hold'em","ztitle": "超級德州","zsummary": "每人 3 張手牌，但不棄牌，最後可用 0 到 3 張手牌組牌。","esummary": "Each player keeps 3 hole cards and may use 0 to 3 of them at showdown.","zdeal": "發 3 張手牌後照德州開公共牌與下注。","edeal": "Deal 3 hole cards, then run the normal Hold'em board and betting streets.","zwinner": "任意手牌張數加公共牌組最佳高牌。","ewinner": "Best high hand using any number of hole cards and board cards wins.","ztip": "不要把它誤判成 Omaha；Super Hold'em 不要求剛好 2 張手牌。","etip": "Do not evaluate it as Omaha; Super Hold'em does not require exactly 2 hole cards." },
	{ "id": "winthebutton","category": "holdem","title": "Win the Button - Hold'em","ztitle": "莊位爭奪賽","zsummary": "贏得上一手底池的選手下一手取得按鈕位，而不是固定順時針移動。","esummary": "The previous pot winner receives the button next hand instead of the button moving normally.","zdeal": "牌局照德州；每手結束後依贏家重設按鈕。","edeal": "Play like Hold'em; after each hand, move the button to the pot winner.","zwinner": "高牌勝，並取得下一手按鈕。","ewinner": "Best high hand wins and receives the next button.","ztip": "分池時要先公告按鈕歸屬規則，例如最大邊池或最差位置。","etip": "For split pots, announce how the next button is assigned, such as largest pot or worst position." },
	{ "id": "omahahigh","category": "omaha","title": "Omaha High","ztitle": "一般奧馬哈","zsummary": "每人通常 4 張手牌，必須剛好用 2 張手牌與 3 張公共牌組牌。","esummary": "Players usually get 4 hole cards and must use exactly 2 hole cards plus 3 board cards.","zdeal": "盲注後發手牌，翻前、翻牌、轉牌、河牌四輪下注。","edeal": "After blinds, deal hole cards and play preflop, flop, turn, and river betting rounds.","zwinner": "最佳高牌勝；不能只用 1 張手牌，也不能用 3 張以上手牌，公共牌也必須剛好取 3 張。","ewinner": "Best high hand wins; a player cannot use only 1 hole card or more than 2 hole cards, and must use exactly 3 board cards.","ztip": "最大誤判就是忘記剛好 2 張手牌，攤牌時先檢查組牌來源。","etip": "The most common mistake is missing the exactly-2 rule; check card sources at showdown." },
	{ "id": "bigo","category": "omaha","title": "Big O","ztitle": "Big O","zsummary": "5 張手牌的 Omaha 高低玩法，通常採 8 or better 低牌資格。","esummary": "A 5-card Omaha Hi-Lo game, usually with an 8-or-better qualifier for low.","zdeal": "每人 5 張手牌，翻牌、轉牌、河牌照 Omaha。","edeal": "Deal 5 hole cards, then flop, turn, and river like Omaha.","zwinner": "高牌與合格低牌分池；每邊都必須剛好用 2 張手牌與 3 張公共牌。若沒有合格低牌，高牌通吃整個底池。若有不可拆分計分牌，贏得高牌面並於越前位者獲得。","ewinner": "High and qualifying low split the pot; each side uses exactly 2 hole cards and 3 board cards. If no low qualifies, high wins the full pot. Any indivisible odd chip goes to the earliest-position player among the high-hand winners.","ztip": "不是任意 5 張牌，仍然要套用 Omaha 的 2+3 組牌限制。","etip": "This is not any 5 cards; Omaha's 2+3 construction rule still applies." },
	{ "id": "courchevelhilo","category": "omaha","title": "Courchevel Hi-Lo","ztitle": "Courchevel 高低","zsummary": "5 張手牌 Omaha，高低分池；翻前先開出第一張公共牌。","esummary": "A 5-card Omaha Hi-Lo game where the first board card is exposed before preflop action.","zdeal": "發 5 張手牌並先開 1 張公共牌，再下注、補成翻牌、轉牌、河牌。","edeal": "Deal 5 hole cards and expose 1 board card, then bet, complete the flop, turn, and river.","zwinner": "高牌與 8 or better 低牌分池，組牌仍需 2 張手牌加 3 張公共牌。若有不可拆分計分牌，贏得高牌面並於越前位者獲得。","ewinner": "High and 8-or-better low split; hands still use exactly 2 hole cards and 3 board cards. Any indivisible odd chip goes to the earliest-position player among the high-hand winners.","ztip": "第一張公共牌翻前已知，下注範圍會比一般 Omaha 更集中。","etip": "The exposed first board card focuses ranges before the flop." },
	{ "id": "crymeariveromaha","category": "omaha","title": "Cry Me a River - Omaha","ztitle": "Cry Me A River 奧馬哈","zsummary": "Omaha 河牌變體，保留剛好 2 張手牌與 3 張公共牌規則。","esummary": "An Omaha river variant that keeps the exactly-2-hole-card and exactly-3-board-card rule.","zdeal": "手牌與前段牌面照 Omaha；river 依特殊規則發出。","edeal": "Hole cards and earlier streets follow Omaha; river cards use the special procedure.","zwinner": "依 Omaha 組牌限制判定最高牌，若為高低版本則分池。","ewinner": "Best hand under Omaha construction wins; split if the announced game is Hi-Lo.","ztip": "河牌特殊規則不能改掉 Omaha 的 2+3 組牌限制。","etip": "The special river rule does not remove Omaha's 2+3 construction requirement." },
	{ "id": "doubleboardomaha","category": "omaha","title": "Double Board - Omaha","ztitle": "雙牌面奧馬哈","zsummary": "Omaha 打兩組公共牌，兩個牌面分別判定。","esummary": "Omaha played on two boards, with each board evaluated separately.","zdeal": "發 Omaha 手牌，每街開兩組公共牌。","edeal": "Deal Omaha hole cards, then two boards across the streets.","zwinner": "每個牌面都必須用剛好 2 張手牌與該牌面 3 張公共牌。","ewinner": "Each board requires exactly 2 hole cards and 3 cards from that board.","ztip": "派彩時一個牌面一個牌面處理，尤其多人 all-in 時要先列邊池。","etip": "Pay one board at a time, especially with multiple all-ins and side pots." },
	{ "id": "doubleboardbombomaha","category": "omaha","title": "Double Board Bomb Pot - Omaha","ztitle": "雙牌面 Bomb Pot 奧馬哈","zsummary": "所有人投入 bomb pot 後直接看雙牌面翻牌的 Omaha。","esummary": "Everyone posts the bomb-pot amount and goes straight to two Omaha flops.","zdeal": "收固定前注，發 Omaha 手牌，開兩組翻牌後開始下注。","edeal": "Collect the fixed ante, deal Omaha hole cards, reveal two flops, then betting starts.","zwinner": "兩個牌面分別用 Omaha 2+3 規則判定。","ewinner": "Each board is evaluated with Omaha's exactly 2+3 rule.","ztip": "底池一開始就很大，下注前請確認每位選手都已投入固定金額。","etip": "The pot is large immediately; verify every player posted the fixed amount before betting." },
	{ "id": "lazyriversomaha","category": "omaha","title": "Lazy Rivers - Omaha","ztitle": "Lazy Rivers 奧馬哈","zsummary": "Omaha 的 river 變體，通常在最後一街加入多張或特殊 river。","esummary": "An Omaha river variant usually adding multiple or special river cards.","zdeal": "前段照 Omaha，最後一街依 Lazy Rivers 規則處理。","edeal": "Earlier streets follow Omaha; the final street uses the Lazy Rivers rule.","zwinner": "仍用剛好 2 張手牌與 3 張公共牌判定。","ewinner": "Still evaluated with exactly 2 hole cards and 3 board cards.","ztip": "可用公共牌變多時，別忘了每手只能選其中 3 張公共牌。","etip": "Even with more board cards, each hand uses only 3 board cards." },
	{ "id": "omahahilo","category": "omaha","title": "Omaha Hi-Lo (8/b)","ztitle": "奧馬哈高低（8 or better）","zsummary": "Omaha 分高低半池，低牌通常需要 8 以下且五張不同點數。","esummary": "Omaha split between high and low; low usually needs five different ranks 8 or lower.","zdeal": "流程同 Omaha High。","edeal": "Flow is the same as Omaha High.","zwinner": "高牌半池、合格低牌半池；兩邊都要 2 張手牌加 3 張公共牌。若沒有合格低牌，高牌通吃整個底池。若有不可拆分計分牌，贏得高牌面並於越前位者獲得。","ewinner": "High gets half and qualifying low gets half; both use exactly 2 hole cards and 3 board cards. If no low qualifies, high wins the full pot. Any indivisible odd chip goes to the earliest-position player among the high-hand winners.","ztip": "同一手可同時拿高低，稱為 scoop。沒有低牌時高牌通吃。","etip": "One hand can win both halves, called a scoop. If no low qualifies, high scoops." },
	{ "id": "acetofive","category": "draw","title": "A-5 / Ace to Five","ztitle": "A-5 低牌","zsummary": "低牌抽牌遊戲，A 永遠是低牌，順子與同花通常不影響低牌。","esummary": "A lowball draw game where aces are low and straights and flushes usually do not count against low.","zdeal": "每人 5 張暗牌，下注後可換 0 到 5 張；Single Draw 換一次，Triple Draw 換三次。","edeal": "Deal 5 down cards, bet, and draw 0 to 5 cards; Single Draw has 1 draw, Triple Draw has 3.","zwinner": "最低 5 張牌勝，最佳牌是 5-4-3-2-A。","ewinner": "Lowest 5-card hand wins; the best hand is 5-4-3-2-A.","ztip": "比低牌時先看最高張，7-5 low 贏 7-6 low。","etip": "Low hands compare from the highest card down; 7-5 low beats 7-6 low." },
	{ "id": "deucetoseven","category": "draw","title": "2-7 / Deuce to Seven","ztitle": "2-7 低牌","zsummary": "低牌抽牌遊戲，A 是高牌，順子與同花會讓低牌變差。","esummary": "A lowball draw game where aces are high and straights and flushes hurt the hand.","zdeal": "每人 5 張暗牌，依 Single Draw 或 Triple Draw 規則換牌與下注。","edeal": "Deal 5 down cards, then draw and bet under Single Draw or Triple Draw rules.","zwinner": "最佳低牌是 7-5-4-3-2，且不能同花。","ewinner": "The best low is 7-5-4-3-2, not a flush.","ztip": "不要把 A-5 的 wheel 當好牌；A-2-3-4-5 在 2-7 是順子且 A 高。","etip": "Do not treat the A-5 wheel as strong; A-2-3-4-5 is a straight with an ace high in 2-7." },
	{ "id": "fivecarddraw","category": "draw","title": "5-Card Draw - High","ztitle": "五張抽牌高牌","zsummary": "傳統 5 張抽牌，高牌牌型勝。","esummary": "Traditional 5-card draw played for the best high hand.","zdeal": "每人 5 張暗牌，下注後可換牌，再下注攤牌。","edeal": "Deal 5 down cards, bet, draw replacements, bet again, then showdown.","zwinner": "標準最高 5 張牌型勝。","ewinner": "Best standard high 5-card poker hand wins.","ztip": "換牌張數是重要資訊，現場要清楚宣告換幾張。","etip": "Draw count is meaningful information; announce how many cards each player draws." },
	{ "id": "archie","category": "draw","title": "Archie","ztitle": "Archie","zsummary": "常見為三分池抽牌遊戲，可能同時看高牌、低牌與合格條件。","esummary": "Often played as a split or three-way draw game involving high, low, and qualifying rules.","zdeal": "每人 5 張牌並進行換牌；下注與分池方式依公告。","edeal": "Deal 5 cards and draw; betting and split structure follow the announcement.","zwinner": "依場規把底池分給高牌、低牌或指定資格牌。","ewinner": "The pot is awarded to high, low, or qualifying hands under the house rule.","ztip": "Archie 版本很多，務必先公告分池項目與資格門檻。","etip": "Archie has many versions; announce the pot shares and qualifiers before play." },
	{ "id": "badacey","category": "draw","title": "Badacey","ztitle": "Badacey","zsummary": "Badugi 與 A-5 低牌混合，通常一半底池給最佳 Badugi，一半給最佳 A-5 低牌。","esummary": "A Badugi and A-5 lowball mix, usually splitting half to best Badugi and half to best A-5 low.","zdeal": "Triple Draw 節奏，每次可換牌後下注。","edeal": "Triple Draw rhythm with betting after each draw.","zwinner": "Badugi 半池與 A-5 低牌半池分別判定。","ewinner": "Badugi half and A-5 low half are evaluated separately.","ztip": "同一手可爭兩邊，但 Badugi 要不同花色與不同點數。","etip": "One hand can compete both ways, but Badugi needs different suits and ranks." },
	{ "id": "badeucey","category": "draw","title": "Badeucey","ztitle": "Badeucey","zsummary": "Badugi 與 2-7 低牌混合，通常半池 Badugi、半池 2-7。","esummary": "A Badugi and 2-7 lowball mix, usually splitting half to Badugi and half to 2-7.","zdeal": "Triple Draw 流程，換牌後下注。","edeal": "Triple Draw flow with betting after draws.","zwinner": "最佳 Badugi 與最佳 2-7 低牌分池。","ewinner": "Best Badugi and best 2-7 low split the pot.","ztip": "A 在 2-7 半池是高牌，在 Badugi 半池也不是自動好牌。","etip": "Aces are high for the 2-7 half and are not automatically strong for the Badugi half." },
	{ "id": "badugi","category": "draw","title": "Badugi","ztitle": "巴杜基","zsummary": "4 張牌低牌遊戲，目標是不同花色、不同點數且越低越好。","esummary": "A 4-card lowball game aiming for four different suits and ranks, as low as possible.","zdeal": "每人 4 張暗牌，通常 Triple Draw，可換牌後下注。","edeal": "Deal 4 down cards, usually Triple Draw, with betting after each draw.","zwinner": "四張 Badugi 勝三張 Badugi；同張數時比最高張往下。","ewinner": "A 4-card Badugi beats a 3-card Badugi; same length compares high card downward.","ztip": "配對或同花色會讓其中一張不能算入 Badugi。","etip": "Pairs or duplicate suits force one card out of the Badugi hand." },
	{ "id": "drawmaha","category": "draw","title": "Drawmaha 2-7","ztitle": "Drawmaha 2-7","zsummary": "Omaha 牌面加抽牌手牌的混合分池遊戲。","esummary": "A split game combining an Omaha board with a draw-hand component.","zdeal": "先發多張手牌，部分牌用於 Omaha，部分經換牌爭低牌半池。","edeal": "Players receive multiple hole cards; some play the Omaha board while the draw hand competes for low.","zwinner": "常見為 Omaha 高牌半池與 2-7 抽牌低牌半池。","ewinner": "Commonly split between Omaha high and 2-7 draw low.","ztip": "先確認哪些牌屬於 Omaha、哪些牌屬於 draw hand。","etip": "Confirm which cards belong to the Omaha hand and which belong to the draw hand." },
	{ "id": "svitenspecial","category": "draw","title": "Sviten Special","ztitle": "Sviten Special","zsummary": "5 張手牌加公共牌的混合遊戲，常見一半比 5-card draw、一半比 Omaha。","esummary": "A mixed game with 5 hole cards and a board, often splitting between 5-card draw and Omaha.","zdeal": "發 5 張手牌並有公共牌；中途可換牌，流程依場規。","edeal": "Deal 5 hole cards with a board; players may draw during the hand by house rule.","zwinner": "通常 draw 手牌與 Omaha 牌面各爭半池。","ewinner": "Usually the draw hand and the Omaha board hand each play for half.","ztip": "這類混合遊戲最怕組牌混淆，建議用口頭步驟帶每一街。","etip": "Mixed games invite construction mistakes; walk the table through each street verbally." },
	{ "id": "sevencardstud","category": "stud","title": "7-Card Stud Hi","ztitle": "七張梭哈高牌","zsummary": "沒有公共牌。每人最多 7 張自己的牌，部分明牌、部分暗牌。","esummary": "No community cards. Each player receives up to 7 personal cards, some face up and some face down.","zdeal": "通常 ante 後發兩暗一明，之後逐街發明牌，最後第七張暗牌。","edeal": "Usually ante, deal two down and one up, then upcards on later streets and a final downcard.","zwinner": "從自己的 7 張牌中選最佳 5 張高牌。","ewinner": "Best high 5-card hand from the player's own 7 cards wins.","ztip": "梭哈以明牌決定 bring-in 與部分街道先行動者，和按鈕遊戲不同。","etip": "Stud uses upcards for bring-in and action order, unlike button games." },
	{ "id": "sevencardstudhilo","category": "stud","title": "7-Card Stud Hi-Lo (8/b)","ztitle": "七張梭哈高低（8 or better）","zsummary": "七張梭哈分高低半池，低牌需 8 以下資格。","esummary": "7-Card Stud split between high and an 8-or-better qualifying low.","zdeal": "發牌流程同七張梭哈高牌。","edeal": "Deal flow is the same as Stud Hi.","zwinner": "最佳高牌拿半池；合格最低牌拿半池，沒有低牌時高牌通吃。若有不可拆分計分牌，贏得高牌面並於越前位者獲得。","ewinner": "Best high gets half; qualifying best low gets half. If no low qualifies, high scoops. Any indivisible odd chip goes to the earliest-position player among the high-hand winners.","ztip": "高低可用不同 5 張牌組，A 可作低牌。","etip": "High and low may use different 5-card sets; aces may play low." },
	{ "id": "sevencardstudhiloregular","category": "stud","title": "7-Card Stud Hi-Lo Regular","ztitle": "七張梭哈高低 Regular","zsummary": "高低分池但低牌資格依場規，可能不是 8 or better。","esummary": "A Stud Hi-Lo split game where the low qualifier follows the house rule and may not be 8-or-better.","zdeal": "照七張梭哈發牌，逐街下注。","edeal": "Deal as Stud with betting on each street.","zwinner": "高牌半池，低牌半池；資格門檻依公告。若有不可拆分計分牌，贏得高牌面並於越前位者獲得。","ewinner": "High takes half and low takes half, with qualifier set by announcement. Any indivisible odd chip goes to the earliest-position player among the high-hand winners.","ztip": "Regular 和 8/b 名稱接近，賽前一定要講清低牌資格。","etip": "Regular and 8/b sound similar; state the low qualifier clearly before play." },
	{ "id": "razz","category": "stud","title": "Razz","ztitle": "Razz","zsummary": "七張梭哈的低牌版本，目標是最低 5 張牌。","esummary": "The lowball version of 7-Card Stud, aiming for the lowest 5-card hand.","zdeal": "梭哈發牌流程；明牌最高者通常 bring-in，後續由低牌面先行動。","edeal": "Stud deal flow; highest upcard usually brings in, later streets often start with the lowest board.","zwinner": "A-5 低牌規則，最佳是 5-4-3-2-A，順子同花不影響。","ewinner": "A-5 low rules: best is 5-4-3-2-A, and straights or flushes do not hurt.","ztip": "牌面看起來越低通常越強，行動順序也跟梭哈高牌不同。","etip": "Lower exposed boards are usually stronger, and action order differs from Stud Hi." },
	{ "id": "razzdugi","category": "stud","title": "Razzdugi","ztitle": "Razzdugi","zsummary": "Razz 與 Badugi 混合分池，兼看 A-5 低牌與 Badugi。","esummary": "A split game combining Razz with Badugi, playing for A-5 low and Badugi halves.","zdeal": "以 Stud 方式發牌，但同時追求 Razz 低牌與 Badugi 組合。","edeal": "Dealt in Stud style while players chase both Razz low and Badugi hands.","zwinner": "Razz 半池與 Badugi 半池分別判定。","ewinner": "Razz half and Badugi half are judged separately.","ztip": "明牌會同時透露兩邊資訊，攤牌時分兩次宣讀。","etip": "Upcards reveal information for both halves; announce showdown in two passes." },
	{ "id": "razzdugideuce","category": "stud","title": "Razzdugi (2-7)","ztitle": "Razzdugi（2-7）","zsummary": "Razzdugi 的 2-7 低牌版本，低牌半池採 2-7 邏輯。","esummary": "A 2-7 version of Razzdugi, where the lowball half follows 2-7 logic.","zdeal": "Stud 發牌流程，同時看 2-7 低牌與 Badugi。","edeal": "Stud deal flow, competing for 2-7 low and Badugi.","zwinner": "2-7 低牌半池與 Badugi 半池分別判定。","ewinner": "2-7 low half and Badugi half are evaluated separately.","ztip": "A 是高牌、順子同花會傷害 2-7 低牌，不要用 Razz 規則判。","etip": "Aces are high and straights/flushes hurt in 2-7; do not evaluate it like Razz." },
	{ "id": "superstud","category": "stud","title": "Super Stud Variations","ztitle": "Super Stud 變體","zsummary": "Stud 家族的加牌或特殊起手變體，通常讓選手前期有更多選擇。","esummary": "Stud-family variants with extra cards or special starting choices, giving players more early options.","zdeal": "依公告可能多發起手牌、棄牌或調整明暗牌配置。","edeal": "Announcement may add starting cards, discards, or different up/down-card layout.","zwinner": "依指定 Stud 高牌、高低或低牌規則判定。","ewinner": "Judged by the announced Stud high, Hi-Lo, or lowball rule.","ztip": "Super Stud 不是單一固定規則，請把起手張數與棄牌時點列入賽制說明。","etip": "Super Stud is not one fixed rule; include starting-card count and discard timing in the event notes." }
]

const HANDBOOKCATEGORYDETAIL={
	"holdem": {
		"zhtw": "德州系玩法的共同骨架是「個人手牌 + 公共牌」。選手先拿到自己的暗牌，之後牌桌中央逐街開出公共牌；每一街結束前，仍在牌局中的選手要把下注額補齊、加注或棄牌。這類遊戲最重要的核對點，是每位選手到底可以用幾張手牌、公共牌總共有幾張、以及是否有雙牌面、bomb pot、短牌或 wild card 等特殊條件。",
		"en": "Hold'em-family games share the same frame: private hole cards plus a shared board. Players receive their own down cards, then community cards are exposed street by street; before each street closes, active players must call, raise, check when allowed, or fold. The key checks are how many hole cards may be used, how many board cards are live, and whether the game adds double boards, bomb pots, Short Deck, or wild-card rules."
	},
	"omaha": {
		"zhtw": "奧馬哈系玩法看起來像德州，但組牌限制完全不同：不管手上有 4、5、6 或 7 張牌，最後通常都必須剛好使用 2 張手牌，加上剛好 3 張公共牌。高低玩法還要把高牌與低牌分開判定，同一位選手可以用不同的兩張手牌去爭高、爭低。現場最常見錯誤，就是看到公共牌上已有完整牌型，卻忘記自己仍然必須用兩張手牌。",
		"en": "Omaha-family games look like Hold'em, but the hand-construction rule is different: regardless of whether players hold 4, 5, 6, or 7 cards, they normally must use exactly 2 hole cards and exactly 3 board cards. Hi-Lo versions evaluate high and low separately, and the same player may use different hole-card pairs for each half. The most common live-table mistake is seeing a complete hand on the board and forgetting that two hole cards are still mandatory."
	},
	"draw": {
		"zhtw": "抽牌系玩法沒有公共牌，資訊主要來自每位選手換了幾張牌、是否 stand pat，以及每輪下注的強弱。大多數 draw 遊戲一開始發暗牌，下注後選手可以棄掉部分手牌並補新牌；Single Draw 只換一次，Triple Draw 會換三次並穿插四輪下注。判定時要先確認是高牌、A-5 低牌、2-7 低牌、Badugi，還是混合分池，因為 A、順子、同花在不同低牌規則中的價值完全不同。",
		"en": "Draw games have no shared board. Information comes from how many cards each player draws, whether they stand pat, and how the betting develops. Most draw games start with down cards; after betting, players discard and receive replacements. Single Draw has one draw, while Triple Draw has three draws and four betting rounds. Before judging a hand, confirm whether the game is high, A-5 lowball, 2-7 lowball, Badugi, or a split mix, because aces, straights, and flushes change value across those rules."
	},
	"stud": {
		"zhtw": "梭哈系玩法通常沒有按鈕與公共牌，每位選手逐街收到自己的牌，其中一部分明牌攤在桌上、一部分暗牌只有自己知道。行動順序常由明牌決定：一開始可能由最差或最高明牌 bring-in，後面街道則依目前牌面強弱決定誰先說話。梭哈的重點不是公共牌組合，而是記住每個人亮出過哪些牌、哪些牌已經死掉，以及這些資訊如何影響低牌、高牌或分池判定。",
		"en": "Stud-family games usually have no button and no community board. Each player receives personal cards street by street, some face up and some face down. Action order is often determined by exposed cards: the bring-in may be forced by the worst or highest upcard, while later streets start from the strongest or lowest visible board depending on the game. The skill is tracking exposed cards, dead cards, and how that information affects high, low, or split-pot evaluation."
	}
}

const HANDBOOKHIGHRANKLIST=[
	{ "zname": "皇家同花順","ename": "Royal Flush","zdesc": "A-K-Q-J-10 同花色，所有高牌牌型中最大。","edesc": "A-K-Q-J-10 of the same suit, the strongest high hand.","example": "A♥ K♥ Q♥ J♥ 10♥" },
	{ "zname": "同花順","ename": "Straight Flush","zdesc": "五張連號且同花色。","edesc": "Five consecutive cards of the same suit.","example": "9♠ 8♠ 7♠ 6♠ 5♠" },
	{ "zname": "四條","ename": "Four of a Kind","zdesc": "四張同點數牌。","edesc": "Four cards of the same rank.","example": "Q♣ Q♦ Q♥ Q♠ 3♣" },
	{ "zname": "葫蘆","ename": "Full House","zdesc": "三條加一對。","edesc": "Three of a kind plus one pair.","example": "K♣ K♦ K♥ 7♠ 7♦" },
	{ "zname": "同花","ename": "Flush","zdesc": "五張同花色但不連號。","edesc": "Five cards of the same suit that are not consecutive.","example": "A♦ J♦ 8♦ 4♦ 2♦" },
	{ "zname": "順子","ename": "Straight","zdesc": "五張連號但不同花色；A 可作最大，也可在 A-2-3-4-5 中作最小。","edesc": "Five consecutive cards not all suited; ace can be high or low in A-2-3-4-5.","example": "10♣ 9♦ 8♠ 7♥ 6♣" },
	{ "zname": "三條","ename": "Three of a Kind","zdesc": "三張同點數牌。","edesc": "Three cards of the same rank.","example": "8♣ 8♦ 8♠ K♥ 4♣" },
	{ "zname": "兩對","ename": "Two Pair","zdesc": "兩組不同點數的對子。","edesc": "Two different pairs.","example": "A♣ A♦ 9♠ 9♥ 3♣" },
	{ "zname": "一對","ename": "One Pair","zdesc": "兩張同點數牌。","edesc": "Two cards of the same rank.","example": "J♣ J♥ A♦ 8♠ 2♣" },
	{ "zname": "高牌","ename": "High Card","zdesc": "以上都沒有時，比五張牌中最大的牌，若相同再往下一張比。","edesc": "If none of the above exists, compare the highest card, then the next card down.","example": "A♣ Q♦ 9♠ 6♥ 3♣" }
]

const HANDBOOKBEGINNERDETAIL={
	"texasholdem": {
		"zhtw": [
			"德州撲克的目標很單純：每一手最後比誰能組出最強的 5 張高牌牌型。每位選手一開始拿 2 張只有自己看的手牌，桌面最多會開出 5 張大家都能用的公共牌。",
			"攤牌時不是比 7 張牌全部，而是從自己的 2 張手牌加桌上 5 張公共牌中，挑出最好的 5 張。你可以兩張手牌都用、只用一張、甚至完全不用手牌而直接用桌上 5 張公共牌。",
			"一手牌可能在任何下注圈結束：如果有人下注後其他人都棄牌，最後留下的人直接贏底池，不需要攤牌。只有最後還有兩位以上選手沒棄牌時，才進入攤牌比牌型。"
		],
		"en": [
			"Texas Hold'em has one simple goal: at the end of the hand, make the strongest 5-card high poker hand. Each player starts with 2 private hole cards, and the table can reveal up to 5 shared community cards.",
			"At showdown you do not compare all 7 cards. You choose the best 5 cards from your 2 hole cards plus the 5 board cards. You may use both hole cards, only 1 hole card, or even 0 hole cards if the board itself makes your best hand.",
			"A hand can end before showdown: if one player bets and everyone else folds, the last remaining player wins the pot immediately. Showdown only happens when at least two players remain after the final betting round."
		]
	},
	"omahahigh": {
		"zhtw": [
			"一般奧馬哈看起來像德州，因為一樣有翻前、翻牌、轉牌、河牌，也一樣使用公共牌。但最重要的差別是組牌限制：攤牌時必須剛好使用 2 張手牌，加上剛好 3 張公共牌。",
			"這不是任意五張牌。即使公共牌上已經有四張同花，你手上只有一張同花，也不能用一張手牌加四張公共牌湊同花；因為公共牌只能用三張。",
			"一般奧馬哈通常每人 4 張手牌，手牌組合比德州多很多，所以成牌強度會變高。多人底池裡，兩對、弱順子或弱同花常常不夠強。"
		],
		"en": [
			"Omaha High looks like Hold'em because it uses preflop, flop, turn, river, and community cards. The key difference is construction: at showdown a player must use exactly 2 hole cards and exactly 3 board cards.",
			"This is not any five cards. If the board has four cards of one suit and you hold only one card of that suit, that is not a flush in Omaha because you may use only three board cards.",
			"Omaha High usually gives each player 4 hole cards, creating far more card combinations than Hold'em. Made hands run stronger, so two pair, weak straights, and weak flushes are often fragile in multi-way pots."
		]
	},
	"fivecarddraw": {
		"zhtw": [
			"抽牌系玩法沒有公共牌，資訊主要來自每位選手換了幾張牌、是否 stand pat，以及每輪下注的強弱。",
			"大多數 draw 遊戲一開始發暗牌，下注後選手可以棄掉部分手牌並補新牌；Single Draw 只換一次，Triple Draw 會換三次並穿插四輪下注。",
			"判定時要先確認是高牌、A-5 低牌、2-7 低牌、Badugi，還是混合分池，因為 A、順子、同花在不同低牌規則中的價值完全不同。"
		],
		"en": [
			"Draw games have no shared board. Information mainly comes from how many cards each player draws, whether they stand pat, and how strongly each betting round develops.",
			"Most draw games start with down cards. After betting, players may discard part of the hand and receive replacements. Single Draw has one draw; Triple Draw has three draws with four betting rounds.",
			"Before judging a hand, confirm whether the game is high, A-5 lowball, 2-7 lowball, Badugi, or a split mix, because aces, straights, and flushes change value across those rules."
		]
	},
	"sevencardstud": {
		"zhtw": [
			"梭哈系玩法通常沒有按鈕與公共牌，每位選手逐街收到自己的牌，其中一部分明牌攤在桌上、一部分暗牌只有自己知道。",
			"行動順序常由明牌決定：一開始可能由最差或最高明牌 bring-in，後面街道則依目前牌面強弱決定誰先說話。",
			"七張梭哈高牌最後從自己的 7 張牌中挑最佳 5 張高牌。重點不是公共牌組合，而是記住每個人亮出過哪些牌、哪些牌已經死掉。"
		],
		"en": [
			"Stud-family games usually have no button and no shared board. Each player receives personal cards street by street, some face up and some face down.",
			"Action order is often determined by exposed cards: the bring-in may be forced by the worst or highest upcard, while later streets start from the strongest or lowest visible board depending on the game.",
			"7-Card Stud High chooses the best 5-card high hand from a player's own 7 cards. The skill is not reading a shared board, but tracking exposed cards and dead cards."
		]
	}
}

const HANDBOOKGUIDELIST=[
	{
		"id": "guidehighrank",
		"category": "guide",
		"title": "High-Hand Ranking",
		"ztitle": "高牌牌型順序",
		"zsummary": "德州、一般奧馬哈、五張抽牌高牌與七張梭哈高牌都會用到的標準高牌大小。",
		"esummary": "The standard high-hand ranking used by Hold'em, Omaha High, 5-Card Draw High, and 7-Card Stud High.",
		"zbody": [
			"高牌玩法的勝負不是比誰手上單張最大，而是比誰能組出最強的五張牌型。牌型先決定大類；若大類相同，再比該牌型內的點數，例如兩個人都是一對，就先比對子的點數，再比剩下的 kicker。",
			"德州和一般奧馬哈都會從可用牌中挑最佳五張；七張梭哈則是從自己的七張牌中挑最佳五張；五張抽牌高牌通常正好就是手上的五張。"
		],
		"erbody": [
			"In high-hand games, the winner is not simply the player with the highest single card. Players compare the strongest five-card poker hand. The hand category comes first; if the category ties, compare the ranks inside that category, then kickers.",
			"Hold'em and Omaha High choose the best five cards from their available cards; 7-Card Stud chooses the best five from a player's own seven cards; 5-Card Draw High usually uses the five cards in hand."
		],
		"ranked": true
	},
	{
		"id": "guideholdem",
		"category": "guide",
		"title": "Hold'em Basics",
		"ztitle": "德州系基本規則",
		"zsummary": "德州系玩法的共通骨架：手牌、公共牌、下注街與最佳五張。",
		"esummary": "The shared Hold'em frame: hole cards, board cards, betting streets, and best five cards.",
		"zbody": [
			"德州系玩法的共同骨架是「個人手牌 + 公共牌」。選手先拿到自己的暗牌，之後牌桌中央逐街開出公共牌；每一街結束前，仍在牌局中的選手要把下注額補齊、加注或棄牌。",
			"標準德州每人 2 張手牌，桌上最多 5 張公共牌。攤牌時從 2 張手牌加 5 張公共牌中挑最佳 5 張，可以用兩張手牌、一張手牌，甚至完全不用手牌。"
		],
		"erbody": [
			"Hold'em-family games share the same frame: private hole cards plus a shared board. Players receive down cards, then community cards are exposed street by street; before each street closes, active players must call, raise, check when allowed, or fold.",
			"Standard Hold'em gives each player 2 hole cards and up to 5 board cards. At showdown, choose the best 5 cards from the 7 available cards. A player may use two hole cards, one hole card, or no hole cards."
		]
	},
	{
		"id": "guideomaha",
		"category": "guide",
		"title": "Omaha Construction",
		"ztitle": "奧馬哈組牌限制",
		"zsummary": "奧馬哈不是任意五張牌，攤牌時通常必須剛好 2 張手牌加 3 張公共牌。",
		"esummary": "Omaha is not any five cards; showdown usually requires exactly 2 hole cards and exactly 3 board cards.",
		"zbody": [
			"奧馬哈系玩法看起來像德州，但組牌限制完全不同：不管手上有 4、5、6 或 7 張牌，最後通常都必須剛好使用 2 張手牌，加上剛好 3 張公共牌。",
			"最常見錯誤，是看到公共牌上已有完整牌型就直接宣告。例如公共牌是四張同花，你手上只有一張同花，不能把那一張加上四張公共牌當同花；因為 Omaha 只能取三張公共牌。"
		],
		"erbody": [
			"Omaha-family games look like Hold'em, but the construction rule is different: regardless of whether players hold 4, 5, 6, or 7 cards, they usually must use exactly 2 hole cards and exactly 3 board cards.",
			"The common mistake is treating the board as if any five cards may be used. If the board contains four suited cards and a player has only one card of that suit, that is not a flush in Omaha because only three board cards may be used."
		]
	},
	{
		"id": "guidedraw",
		"category": "guide",
		"title": "Draw Basics",
		"ztitle": "抽牌系基本規則",
		"zsummary": "抽牌沒有公共牌，重點是換幾張、是否 stand pat，以及使用哪一種高低牌規則。",
		"esummary": "Draw games have no shared board; focus on draw count, standing pat, and which high or low rule is used.",
		"zbody": [
			"抽牌系玩法沒有公共牌，資訊主要來自每位選手換了幾張牌、是否 stand pat，以及每輪下注的強弱。",
			"大多數 draw 遊戲一開始發暗牌，下注後選手可以棄掉部分手牌並補新牌；Single Draw 只換一次，Triple Draw 會換三次並穿插四輪下注。",
			"判定時要先確認是高牌、A-5 低牌、2-7 低牌、Badugi，還是混合分池，因為 A、順子、同花在不同低牌規則中的價值完全不同。"
		],
		"erbody": [
			"Draw games have no shared board. Information mainly comes from how many cards each player draws, whether they stand pat, and how strongly each betting round develops.",
			"Most draw games start with down cards. After betting, players may discard part of the hand and receive replacements. Single Draw has one draw; Triple Draw has three draws with four betting rounds.",
			"Before judging a hand, confirm whether the game is high, A-5 lowball, 2-7 lowball, Badugi, or a split mix, because aces, straights, and flushes change value across those rules."
		]
	},
	{
		"id": "guidestud",
		"category": "guide",
		"title": "Stud Basics",
		"ztitle": "梭哈系基本規則",
		"zsummary": "梭哈通常沒有公共牌，明牌會決定資訊、bring-in 與部分街道行動順序。",
		"esummary": "Stud usually has no shared board; upcards drive information, bring-ins, and action order on later streets.",
		"zbody": [
			"梭哈系玩法通常沒有按鈕與公共牌，每位選手逐街收到自己的牌，其中一部分明牌攤在桌上、一部分暗牌只有自己知道。",
			"行動順序常由明牌決定：一開始可能由最差或最高明牌 bring-in，後面街道則依目前牌面強弱決定誰先說話。梭哈的重點是記住每個人亮出過哪些牌、哪些牌已經死掉，以及這些資訊如何影響低牌、高牌或分池判定。"
		],
		"erbody": [
			"Stud-family games usually have no button and no shared board. Each player receives personal cards street by street, some face up and some face down.",
			"Action order is often determined by exposed cards: the bring-in may be forced by the worst or highest upcard, while later streets start from the strongest or lowest visible board depending on the game. The skill is tracking exposed cards, dead cards, and how they affect high, low, or split-pot evaluation."
		]
	},
	{
		"id": "guidesplitlow",
		"category": "guide",
		"title": "Lowball and Split Pots",
		"ztitle": "低牌與分池",
		"zsummary": "高低玩法要先確認低牌資格；沒有合格低牌時通常由高牌通吃。",
		"esummary": "Hi-Lo games need a low qualifier check; if no low qualifies, high usually wins the full pot.",
		"zbody": [
			"高低玩法會把底池分成高牌半池與低牌半池。低牌常見資格是 8 or better：五張低牌都必須是 8 以下，而且不能配對。若沒有人有合格低牌，高牌通常拿走整個底池。",
			"A-5 低牌把 A 視為低牌，順子與同花通常不會讓牌變差；2-7 低牌則把 A 視為高牌，順子與同花會讓牌變差。Badugi 則不是五張牌，而是最多四張不同花色、不同點數的低牌。"
		],
		"erbody": [
			"Hi-Lo games split the pot between a high half and a low half. A common low qualifier is 8-or-better: all five low cards must be 8 or lower and unpaired. If nobody qualifies for low, high usually wins the full pot.",
			"A-5 lowball treats aces as low and usually ignores straights and flushes. 2-7 lowball treats aces as high and penalizes straights and flushes. Badugi is not a five-card hand; it is up to four low cards with different suits and ranks."
		]
	}
]

const HANDBOOKSPECIALDETAIL={
	"texasholdem": {
		"zhtw": "德州的比牌一定要記住「最佳五張」這件事。假設你拿 A-K，桌上是 A-A-9-9-2，你的最佳五張會是 A-A-A-9-9，也就是葫蘆；如果另一位選手拿 A-Q，他也同樣有 A-A-A-9-9，因為第五張 kicker 沒有進入最佳五張，所以兩人平分。這也是為什麼不能只看自己兩張手牌大不大，必須看最後能組成哪一個五張牌型。",
		"en": "The key Hold'em idea is always best five cards. If you hold A-K and the board is A-A-9-9-2, your best hand is A-A-A-9-9, a full house. If another player holds A-Q, that player also has A-A-A-9-9 because the kicker does not enter the best five cards, so the pot is split. This is why players must read the final 5-card hand, not only their 2 hole cards."
	},
	"shortdeck": {
		"zhtw": "短牌因為移除 2 到 5，牌組密度大幅改變：順子比較容易出現，同花反而比較稀有，所以很多規則會把同花排在葫蘆之上。A 的低端用法也要先講清楚，常見是 A-6-7-8-9 算最小順子。下注前請先公告完整牌型排序，否則攤牌時非常容易爭議。",
		"en": "Short Deck removes 2 through 5, so the deck density changes sharply: straights become easier, while flushes become rarer, which is why many rule sets rank a flush above a full house. Ace-low usage must also be announced, commonly allowing A-6-7-8-9 as the wheel. Publish the full ranking before play to avoid showdown disputes."
	},
	"omahahigh": {
		"zhtw": "奧馬哈高牌的牌力通常比德州高很多，因為每位選手有更多手牌組合可以搭配公共牌。兩對、set、弱順子或弱同花在多人底池中常常不夠強。計分員攤牌時要逐手確認「兩張手牌 + 三張公共牌」，不要只看選手口頭宣稱。",
		"en": "Omaha High produces stronger hands than Hold'em because each player has many more hole-card combinations to pair with the board. Two pair, sets, weak straights, and weak flushes can be fragile in multi-way pots. At showdown, verify exactly 2 hole cards plus 3 board cards instead of relying only on verbal declarations."
	},
	"omahahilo": {
		"zhtw": "Omaha Hi-Lo 的低牌半池通常採 8 or better：五張低牌都必須是 8 以下，且不能配對。A 可作低牌，最好的低牌是 A-2-3-4-5。高牌與低牌可以用不同組合，所以同一位選手可能用一組牌拿高、另一組牌拿低；若沒有合格低牌，高牌獲得整個底池。",
		"en": "Omaha Hi-Lo usually uses an 8-or-better low qualifier: all five low cards must be 8 or lower and unpaired. Aces play low, so the best low is A-2-3-4-5. High and low may use different card combinations, allowing one player to win both halves. If no low qualifies, the high hand wins the entire pot."
	},
	"bigo": {
		"zhtw": "Big O 是五張手牌的 Omaha 高低，牌力與聽牌會比四張 Omaha 更誇張。因為手牌多一張，選手更常同時有高牌潛力與低牌潛力；但組牌限制仍然是剛好兩張手牌，不能因為手牌多就任意取用三張或四張。",
		"en": "Big O is 5-card Omaha Hi-Lo, so hand strength and draws become even larger than in 4-card Omaha. With one extra hole card, players more often hold both high and low potential, but the construction rule remains exactly 2 hole cards. The extra card does not allow using three or four hole cards."
	},
	"courchevelhilo": {
		"zhtw": "Courchevel 的特色是翻前先亮出第一張公共牌，因此所有選手在第一輪下注前就知道一部分牌面。這會讓起手牌選擇更依賴那張已知公共牌：能和它形成堅果聽牌、低牌潛力或強高牌結構的手牌價值上升。補成翻牌後，仍照 Omaha 高低規則判定。",
		"en": "Courchevel exposes the first board card before preflop action, so every player knows part of the board before the first betting round. Starting hands that connect with that exposed card through nut draws, low potential, or strong high structure gain value. After the flop is completed, evaluation still follows Omaha Hi-Lo rules."
	},
	"doubleboardholdem": {
		"zhtw": "雙牌面玩法最重要的是分開判定。每個 board 都像一個獨立的德州牌面，通常各自爭半池；同一位選手可能贏上面牌面、輸下面牌面。若有多人 all-in，應先列主池與邊池，再對每個邊池分別看兩個牌面，否則派彩很容易亂掉。",
		"en": "Double-board games must be evaluated board by board. Each board functions like an independent Hold'em board, commonly for half the pot. The same player may win one board and lose the other. With multiple all-ins, build main and side pots first, then evaluate both boards for each pot to avoid payout errors."
	},
	"doubleboardomaha": {
		"zhtw": "雙牌面 Omaha 比雙牌面德州更容易誤判，因為每個牌面都要單獨套用 Omaha 的 2+3 規則。選手不能用上面牌面的兩張公共牌加下面牌面的一張公共牌混合組牌；每次判定都只能取同一個牌面中的三張公共牌。",
		"en": "Double-board Omaha is easier to misread than double-board Hold'em because the Omaha 2+3 rule applies separately to each board. Players cannot mix two board cards from the top board with one from the bottom board. Each evaluation must use three cards from the same board."
	},
	"pineapple": {
		"zhtw": "Pineapple 家族的重點是「多拿一張、再棄一張」。棄牌時點會大幅影響策略：翻牌前棄牌比較接近德州，翻牌後棄牌則讓選手能用更多資訊保留最適合牌面的兩張。開局前請把棄牌時點講清楚，並要求選手棄牌動作完成後不能再換回。",
		"en": "The Pineapple family is about receiving one extra card and discarding one later. The discard timing changes strategy sharply: discarding before the flop is closer to Hold'em, while discarding after the flop lets players keep the two cards that fit the board best. Announce the timing clearly and make the discard final."
	},
	"superholdem": {
		"zhtw": "Super Hold'em 和 Pineapple 最大差別是不用棄牌。選手保留三張手牌到攤牌，且通常可使用 0 到 3 張手牌，所以強牌密度會比德州高。它不是 Omaha：沒有剛好兩張手牌的限制，這點在判定三條、葫蘆、同花與順子時尤其要注意。",
		"en": "Super Hold'em differs from Pineapple because no card is discarded. Players keep all 3 hole cards to showdown and may usually use 0 to 3 of them, so hand strength runs higher than in Hold'em. It is not Omaha: there is no exactly-2-hole-card requirement, which matters for trips, full houses, flushes, and straights."
	},
	"acetofive": {
		"zhtw": "A-5 低牌把 A 視為最低牌，而且順子與同花不會讓牌變差。因此 5-4-3-2-A 是最強低牌，也常被稱為 wheel。比較低牌時先看最高張，最高張相同再往下一張比；例如 7-5-4-3-2 贏 7-6-5-4-A，因為第二高張 5 小於 6。",
		"en": "A-5 lowball treats aces as low, and straights or flushes do not hurt the hand. That makes 5-4-3-2-A the best low, often called the wheel. Compare lows from the highest card downward; for example, 7-5-4-3-2 beats 7-6-5-4-A because the second-highest card, 5, is lower than 6."
	},
	"deucetoseven": {
		"zhtw": "2-7 低牌和 A-5 幾乎相反：A 是高牌，順子和同花都會讓牌變差。最好的牌是不同花色的 7-5-4-3-2。選手常犯的錯是把 A-2-3-4-5 當成好低牌；在 2-7 中它既有 A 高，又是一副順子，通常非常差。",
		"en": "2-7 lowball is almost the opposite of A-5: aces are high, and straights and flushes hurt. The best hand is 7-5-4-3-2 with no flush. A common mistake is treating A-2-3-4-5 as a good low; in 2-7 it is ace-high and also a straight, making it very weak."
	},
	"badugi": {
		"zhtw": "Badugi 的目標不是五張牌，而是最多四張不同花色、不同點數的低牌。四張 Badugi 一定贏三張 Badugi，三張贏兩張；同樣張數時才比較最高張往下。若手牌中有配對或同花色，只能保留其中一張進入有效 Badugi 組合。",
		"en": "Badugi is not a five-card hand game. The goal is a low hand of up to four cards with all different suits and ranks. Any 4-card Badugi beats any 3-card Badugi, which beats any 2-card hand; only hands of the same length compare high card downward. Paired ranks or duplicate suits force one card out of the valid Badugi."
	},
	"badacey": {
		"zhtw": "Badacey 同時判定 Badugi 與 A-5 低牌，所以一手牌可能只拿半池，也可能通吃。好的起手牌通常同時有低點數、不同花色、不同點數這些特徵。換牌時要想清楚自己是在追 Badugi 半池、A-5 半池，還是有機會兩邊一起改善。",
		"en": "Badacey evaluates both Badugi and A-5 lowball, so a hand may win only half or scoop both halves. Good starting hands often combine low ranks, different suits, and unpaired ranks. During draws, decide whether you are improving for the Badugi half, the A-5 half, or both at once."
	},
	"badeucey": {
		"zhtw": "Badeucey 把 Badugi 與 2-7 低牌放在同一手。因為 2-7 中 A 是高牌，A 在這個遊戲裡通常不像 Badacey 那麼有價值。最佳方向通常是低而不成順、不成同花，同時保留不同花色與不同點數來爭 Badugi 半池。",
		"en": "Badeucey combines Badugi with 2-7 lowball. Because aces are high in 2-7, aces are usually less valuable here than in Badacey. The ideal direction is low without making a straight or flush, while also preserving different suits and ranks for the Badugi half."
	},
	"sevencardstud": {
		"zhtw": "七張梭哈高牌沒有公共牌，所以每位選手的明牌就是主要資訊。第三街通常由指定明牌 bring-in，後續街道常由目前明牌最強者先行動。到第七街時，每位未棄牌選手最多有三張暗牌、四張明牌，從自己的七張牌中選最佳五張高牌。",
		"en": "7-Card Stud High has no community board, so exposed upcards are the main public information. Third street usually starts with a forced bring-in, and later streets often begin with the strongest exposed board. By seventh street, each remaining player has up to three downcards and four upcards, choosing the best five-card high hand from their own seven cards."
	},
	"sevencardstudhilo": {
		"zhtw": "Stud Hi-Lo 會把底池分成高牌與低牌兩半。低牌通常採 8 or better，且低牌不看順子同花；同一位選手可以用一組五張牌爭高，用另一組五張牌爭低。若所有人都沒有合格低牌，最高牌型拿走整個底池。",
		"en": "Stud Hi-Lo splits the pot into high and low halves. The low side usually uses an 8-or-better qualifier and ignores straights and flushes. One player may use one five-card hand for high and a different five-card hand for low. If nobody qualifies for low, the high hand wins the full pot."
	},
	"razz": {
		"zhtw": "Razz 是 Stud 的 A-5 低牌版本，目標是做出最低五張牌。A 是低牌，順子與同花不影響牌力，所以 wheel 是最強牌。和 Stud Hi 不同，明牌看起來越低通常越有利；行動順序與 bring-in 規則也應依 Razz 規則而非高牌規則執行。",
		"en": "Razz is the A-5 lowball version of Stud, aiming for the lowest five-card hand. Aces are low, and straights or flushes do not hurt, so the wheel is best. Unlike Stud High, lower exposed boards are usually stronger; action order and bring-in rules should follow Razz rules, not high-hand Stud rules."
	}
}

function handbooktext(key){
	let pack=HANDBOOKTEXT[LANGUAGE]
	if(!pack){
		pack=HANDBOOKTEXT["zhtw"]
	}
	return pack[key]||key
}

function handbookcategorytext(key){
	for(let i=0;i<HANDBOOKCATEGORYLIST.length;i=i+1){
		if(HANDBOOKCATEGORYLIST[i]["id"]==key){
			let value=HANDBOOKCATEGORYLIST[i][LANGUAGE]
			if(!value){
				value=HANDBOOKCATEGORYLIST[i]["zhtw"]
			}
			return value
		}
	}
	return key
}

function handbookgametitle(game){
	if(LANGUAGE=="en"){
		return game["title"]
	}
	return game["ztitle"]
}

function handbookgamefield(game,key){
	if(LANGUAGE=="en"){
		return game["e"+key]
	}
	return game["z"+key]
}

function handbooklanguagetext(item){
	if(LANGUAGE=="en"&&item["en"]){
		return item["en"]
	}
	return item["zhtw"]||""
}

function handbooklanguageparagraphlist(item){
	if(LANGUAGE=="en"&&item["en"]){
		return item["en"]
	}
	return item["zhtw"]||[]
}

function handbookbeginnercontent(game){
	let item=HANDBOOKBEGINNERDETAIL[game["id"]]
	let html=""
	if(item){
		let list=handbooklanguageparagraphlist(item)
		for(let i=0;i<list.length;i=i+1){
			html=html+`<p class="text-sm leading-7 text-zinc-300">${list[i]}</p>`
		}
		html=html+`
			<div class="mt-4 rounded-2xl bg-zinc-950/70 p-4">
				<div class="text-sm font-extrabold text-cyan-300">${handbooktext("ranktitle")}</div>
				<div class="mt-3 space-y-2">
					${handbookrankcontent()}
				</div>
			</div>
		`
	}
	return html
}

function handbookrankcontent(){
	let html=""
	for(let i=0;i<HANDBOOKHIGHRANKLIST.length;i=i+1){
		let item=HANDBOOKHIGHRANKLIST[i]
		let name=item["zname"]
		let desc=item["zdesc"]
		if(LANGUAGE=="en"){
			name=item["ename"]
			desc=item["edesc"]
		}
		html=html+`
			<div class="flex items-start gap-3 rounded-2xl bg-zinc-900 p-3">
				<div class="min-w-[108px] rounded-xl bg-zinc-950 px-3 py-2 text-center font-mono text-xs font-extrabold leading-6 text-white shadow-inner">${item["example"]}</div>
				<div class="min-w-0">
					<div class="text-sm font-extrabold text-white">${i+1}. ${name}</div>
					<p class="mt-1 text-sm leading-6 text-zinc-300">${desc}</p>
				</div>
			</div>
		`
	}
	return html
}

function handbookcategorydetail(game){
	let item=HANDBOOKCATEGORYDETAIL[game["category"]]
	if(item){
		return handbooklanguagetext(item)
	}
	return ""
}

function handbookspecialdetail(game){
	let item=HANDBOOKSPECIALDETAIL[game["id"]]
	if(item){
		return handbooklanguagetext(item)
	}
	if(game["category"]=="holdem"){
		if(LANGUAGE=="en"){
			return "For this Hold'em variant, the name usually signals the changed part of the game: extra board cards, a special river, a different button rule, or a different preflop setup. Before the first hand, announce exactly what changes from normal Hold'em and keep the table layout consistent so players can read the board correctly."
		}
		return "這個德州變體的名稱通常代表它改動的地方：可能是多一組牌面、特殊河牌、按鈕移動規則，或翻前投入方式不同。第一手開始前，請明確公告它和一般德州不同的部分，並固定牌面擺放方式，讓選手能正確讀牌。"
	}
	if(game["category"]=="omaha"){
		if(LANGUAGE=="en"){
			return "For this Omaha variant, treat the special board or pot rule as an addition on top of the core Omaha construction rule. Unless the event specifically says otherwise, every showdown hand still needs exactly 2 hole cards and exactly 3 board cards. When the board is unusual, announce which board cards belong together before awarding the pot."
		}
		return "這個 Omaha 變體可以把特殊牌面或特殊底池規則視為加在核心 Omaha 規則上的一層。除非賽制另有公告，攤牌時仍然要剛好使用 2 張手牌與 3 張公共牌。牌面不尋常時，派彩前要先說清楚哪些公共牌屬於同一組牌面。"
	}
	if(game["category"]=="draw"){
		if(LANGUAGE=="en"){
			return "For this draw variant, the most important live procedure is the draw order and the number of cards exchanged. The dealer should announce each player's draw count, keep discards separate from the stub, and make sure nobody changes their declared draw after replacement cards are dealt."
		}
		return "這個抽牌變體最重要的現場流程，是換牌順序與每位選手換幾張。計分員應該清楚宣告每家的換牌張數，把棄牌和牌堆分開，並確保補牌開始後選手不能再改變已宣告的換牌數。"
	}
	if(LANGUAGE=="en"){
		return "For this Stud variant, exposed cards are part of the public record. The dealer should keep each player's board neatly ordered by street, announce forced bets and action order clearly, and avoid mixing high-hand and lowball action rules."
	}
	return "這個 Stud 變體中，明牌就是公開資訊的一部分。計分員應把每位選手的明牌依街道排好，清楚宣告強制下注與行動順序，並避免把高牌 Stud 與低牌 Stud 的行動規則混在一起。"
}

function handbookdetailparagraphlist(game){
	let list=[
		handbookspecialdetail(game)
	]
	return list
}

function handbookdetailcontent(game){
	let list=handbookdetailparagraphlist(game)
	let html=""
	for(let i=0;i<list.length;i=i+1){
		if(list[i]){
			html=html+`<p class="text-sm leading-7 text-zinc-300">${list[i]}</p>`
		}
	}
	return html
}

function handbookreferencelist(game){
	let list=[]
	if(game["id"]!="texasholdem"&&game["category"]=="holdem"){
		list.push("texasholdem")
	}
	if(game["id"]=="omahahigh"){
		list.push("texasholdem")
	}
	if(game["id"]!="omahahigh"&&game["category"]=="omaha"){
		list.push("omahahigh")
	}
	if(game["id"]=="bigo"||game["id"]=="courchevelhilo"){
		list.push("omahahilo")
	}
	if(game["id"]!="fivecarddraw"&&game["category"]=="draw"){
		list.push("fivecarddraw")
	}
	if(game["id"]=="badacey"||game["id"]=="badeucey"){
		list.push("badugi")
	}
	if(game["id"]!="sevencardstud"&&game["category"]=="stud"){
		list.push("sevencardstud")
	}
	if(game["id"]=="sevencardstudhilo"||game["id"]=="sevencardstudhiloregular"){
		list.push("omahahilo")
	}
	return list
}

function handbookreferenceblock(game){
	let list=handbookreferencelist(game)
	let html=""
	if(list.length>0){
		html=`
			<div class="rounded-2xl bg-zinc-900 p-4">
				<div class="text-sm font-extrabold text-cyan-300">${handbooktext("seealso")}</div>
				<div class="mt-3 flex flex-wrap gap-2">
					${handbookreferencebuttonlist(list)}
				</div>
			</div>
		`
	}
	return html
}

function handbookreferencebuttonlist(list){
	let html=""
	for(let i=0;i<list.length;i=i+1){
		let game=handbookfindgame(list[i])
		html=html+`<input type="button" class="min-h-10 rounded-full bg-zinc-800 px-4 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700" data-handbookref="${game["id"]}" value="${handbookgametitle(game)}">`
	}
	return html
}

function handbookbindreference(){
	let buttonlist=document.querySelectorAll("[data-handbookref]")
	for(let i=0;i<buttonlist.length;i=i+1){
		buttonlist[i].addEventListener("click",function(){
			let id=this.getAttribute("data-handbookref")||"texasholdem"
			let game=handbookfindgame(id)
			handbookcategory=game["category"]
			handbookcurrentid=id
			handbookrender()
		})
	}
}

function handbookcategorycount(key){
	if(key=="all"){
		return HANDBOOKGAMELIST.length
	}
	let count=0
	for(let i=0;i<HANDBOOKGAMELIST.length;i=i+1){
		if(HANDBOOKGAMELIST[i]["category"]==key){
			count=count+1
		}
	}
	return count
}

function handbookmatches(game,keyword){
	let matched=true
	if(handbookcategory!="all"&&game["category"]!=handbookcategory){
		matched=false
	}
	if(matched&&keyword!=""){
		let haystack=[
			game["title"],
			game["ztitle"],
			game["zsummary"],
			game["esummary"],
			game["zdeal"],
			game["edeal"],
			game["zwinner"],
			game["ewinner"],
			game["ztip"],
			game["etip"],
			handbookcategorytext(game["category"])
		].join(" ").toLowerCase()
		if(haystack.indexOf(keyword)<0){
			matched=false
		}
	}
	return matched
}

function handbookfilteredlist(){
	let input=domgetid("handbooksearch")
	let keyword=""
	if(input){
		keyword=String(input.value||"").trim().toLowerCase()
	}
	let list=[]
	for(let i=0;i<HANDBOOKGAMELIST.length;i=i+1){
		if(handbookmatches(HANDBOOKGAMELIST[i],keyword)){
			list.push(HANDBOOKGAMELIST[i])
		}
	}
	return list
}

function handbookfindgame(id){
	for(let i=0;i<HANDBOOKGAMELIST.length;i=i+1){
		if(HANDBOOKGAMELIST[i]["id"]==id){
			return HANDBOOKGAMELIST[i]
		}
	}
	return HANDBOOKGAMELIST[0]
}

function handbookrendercategory(){
	let html=""
	for(let i=0;i<HANDBOOKCATEGORYLIST.length;i=i+1){
		let key=HANDBOOKCATEGORYLIST[i]["id"]
		let classlist="bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
		if(key==handbookcategory){
			classlist="bg-cyan-400 text-zinc-950"
		}
		html=html+`<input type="button" class="min-h-10 rounded-full px-4 text-sm font-bold transition ${classlist}" data-handbookcategory="${key}" value="${handbookcategorytext(key)} ${handbookcategorycount(key)}">`
	}
	innerhtml("#handbookcategory",html,false)
	let buttonlist=document.querySelectorAll("[data-handbookcategory]")
	for(let i=0;i<buttonlist.length;i=i+1){
		buttonlist[i].addEventListener("click",function(){
			handbookcategory=this.getAttribute("data-handbookcategory")||"all"
			handbookrender()
		})
	}
}

function handbookrenderlist(){
	let list=handbookfilteredlist()
	let html=""
	for(let i=0;i<list.length;i=i+1){
		let game=list[i]
		let classlist="bg-zinc-950/70 text-zinc-300 hover:bg-zinc-800"
		if(game["id"]==handbookcurrentid){
			classlist="bg-cyan-400 text-zinc-950"
		}
		html=html+`
			<button type="button" class="min-h-[76px] w-full rounded-2xl px-4 py-3 text-left transition ${classlist}" data-handbookgame="${game["id"]}">
				<span class="block text-sm font-extrabold leading-5">${handbookgametitle(game)}</span>
				<span class="mt-1 block text-xs leading-5 opacity-75">${game["title"]}</span>
			</button>
		`
	}
	if(list.length<1){
		html=`<div class="rounded-2xl bg-zinc-950/70 p-4 text-sm text-zinc-500">${handbooktext("noresult")}</div>`
	}else{
		let selecteded=false
		for(let i=0;i<list.length;i=i+1){
			if(list[i]["id"]==handbookcurrentid){
				selecteded=true
			}
		}
		if(!selecteded){
			handbookcurrentid=list[0]["id"]
		}
	}
	innerhtml("#handbooklist",html,false)
	innertext("#handbookresultcount",String(list.length)+" "+handbooktext("resultunit"),false)
	let buttonlist=document.querySelectorAll("[data-handbookgame]")
	for(let i=0;i<buttonlist.length;i=i+1){
		buttonlist[i].addEventListener("click",function(){
			handbookcurrentid=this.getAttribute("data-handbookgame")||"texasholdem"
			handbookrender()
		})
	}
}

function handbookrenderdetail(){
	let game=handbookfindgame(handbookcurrentid)
	let html=`
		<div class="border-b border-zinc-800 pb-5">
			<div>
				<div class="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">${handbookcategorytext(game["category"])}</div>
				<h2 class="mt-2 text-2xl font-extrabold text-white md:text-3xl">${handbookgametitle(game)}</h2>
				<div class="mt-1 text-sm text-zinc-500">${game["title"]}</div>
			</div>
		</div>
		<div class="mt-5 grid grid-cols-1 gap-4">
			<div class="space-y-3 rounded-2xl bg-zinc-900 p-4">
				<div class="text-sm font-extrabold text-cyan-300">${handbooktext("detail")}</div>
				${handbookbeginnercontent(game)}
				${handbookdetailcontent(game)}
			</div>
			<div class="rounded-2xl bg-zinc-900 p-4">
				<div class="text-sm font-extrabold text-cyan-300">${handbooktext("overview")}</div>
				<p class="mt-2 text-sm leading-7 text-zinc-300">${handbookgamefield(game,"summary")}</p>
			</div>
			<div class="rounded-2xl bg-zinc-900 p-4">
				<div class="text-sm font-extrabold text-cyan-300">${handbooktext("deal")}</div>
				<p class="mt-2 text-sm leading-7 text-zinc-300">${handbookgamefield(game,"deal")}</p>
			</div>
			<div class="rounded-2xl bg-zinc-900 p-4">
				<div class="text-sm font-extrabold text-cyan-300">${handbooktext("winner")}</div>
				<p class="mt-2 text-sm leading-7 text-zinc-300">${handbookgamefield(game,"winner")}</p>
			</div>
			${handbookreferenceblock(game)}
		</div>
	`
	innerhtml("#handbookdetail",html,false)
	handbookbindreference()
}

function handbookapplylanguage(){
	document.title=handbooktext("title")+" - PokerTrace"
	innertext("#handbooktitle",handbooktext("title"),false)
	innertext("#handbookdesc",handbooktext("desc"),false)
	innertext("#back",handbooktext("back"),false)
	innertext("#handbooksearchlabel",handbooktext("searchlabel"),false)
	innertext("#handbooklisttitle",handbooktext("listtitle"),false)
	domgetid("handbooksearch").setAttribute("placeholder",handbooktext("searchplaceholder"))
}

function handbookrender(){
	handbookrendercategory()
	handbookrenderlist()
	handbookrenderdetail()
}

oninput("#handbooksearch",function(){
	handbookrender()
})

handbookapplylanguage()
handbookrender()
