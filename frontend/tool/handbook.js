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
	{ "id": "texasholdem","category": "holdem","title": "Texas Hold'em","ztitle": "德州撲克","zsummary": "每人 2 張手牌，桌面會開出 5 張公共牌。選手可用 0、1 或 2 張手牌組成最佳 5 張牌。","esummary": "Each player gets 2 hole cards and the board receives 5 community cards. Use any 0, 1, or 2 hole cards to make the best 5-card hand.","zdeal": "下盲注與收齊前注後，從按鈕後一位開始依序發兩圈牌，每位選手拿 2 張手牌。翻前從大盲後一位開始下注；翻牌發 3 張公共牌後，從按鈕後一位開始下注；轉牌發 1 張公共牌後再下注；河牌發最後 1 張公共牌後進行最後一輪下注。","edeal": "After blinds and antes are posted, deal two rounds of hole cards starting with the player after the button, so each player has 2 hole cards. Preflop action starts after the big blind; after a 3-card flop, action starts after the button; after the 1-card turn, another betting round follows; after the final 1-card river, the last betting round follows.","zwinner": "最高 5 張牌型勝；同牌力平分底池，不可拆分計分牌由越前位獲得。","ewinner": "Best high 5-card poker hand wins; tied hands split the pot, and any indivisible odd chip goes to the earliest position.","ztip": "德州是多數 Hold'em 變體的母規則，按鈕、盲注、前注與下注結構構成翻前起點。","etip": "Hold'em is the parent structure for many variants; button, blinds, antes, and betting limit define the preflop setup." },
	{ "id": "threeoneholdem","category": "holdem","title": "3-2-1 Hold'em","ztitle": "3-2-1 德州","zsummary": "公共牌不是 3-1-1，而是分成 3 張、2 張、1 張逐段開出，總共 6 張公共牌。","esummary": "Community cards come as 3, then 2, then 1, giving 6 total board cards instead of the normal 5.","zdeal": "翻前後先開 3 張，再開 2 張，最後開 1 張，每段後下注。","edeal": "After preflop, deal 3 community cards, then 2, then 1, with betting after each street.","zwinner": "用 2 張手牌與公共牌任意組合的最佳高牌勝。","ewinner": "Best high hand from the player's hole cards and the board wins.","ztip": "公共牌總數為 6 張，成牌強度高於一般德州。","etip": "The board has 6 community cards, so made-hand strength is higher than regular Hold'em." },
	{ "id": "atomicpineapple","category": "holdem","title": "Atomic Pineapple","ztitle": "超級大菠蘿","zsummary": "拿 5 張手牌，翻前、翻牌、轉牌下注後各棄 1 張。","esummary": "Players get 5 hole cards and discard 1 after preflop, flop, and turn betting.","zdeal": "發 5 張手牌；翻前下注後棄 1 張，翻牌下注後棄 1 張，轉牌下注後棄 1 張，再打到河牌。","edeal": "Deal 5 hole cards; discard 1 after preflop betting, 1 after flop betting, and 1 after turn betting, then continue to the river.","zwinner": "剩下手牌與公共牌組成最佳高牌。","ewinner": "Best high hand using the retained hole cards and board wins.","ztip": "棄牌時點固定在翻前、翻牌、轉牌下注後。","etip": "Discard timing is after preflop, flop, and turn betting." },
	{ "id": "crazypineapple","category": "holdem","title": "Crazy Pineapple","ztitle": "瘋狂大菠蘿","zsummary": "每人翻前發 3 張手牌，翻牌下注結束後、轉牌發出前棄掉 1 張。","esummary": "Each player receives 3 hole cards preflop and discards 1 after post-flop betting, before the turn is dealt.","zdeal": "翻前發 3 張手牌並下注；翻牌發出後進行下注。翻牌下注結束後、轉牌發出前，仍在牌局中的選手必須棄 1 張，剩餘 2 張手牌繼續打轉牌與河牌。","edeal": "Deal 3 hole cards preflop and run preflop betting. Deal the flop and run post-flop betting. After that betting round and before the turn, each active player must discard 1 card and continue with 2 hole cards through turn and river.","zwinner": "棄牌後照德州規則，以剩餘手牌與公共牌組成最佳高牌。","ewinner": "After the discard, Hold'em rules apply and the best high hand from retained hole cards and board wins.","ztip": "選手有責任在轉牌前完成棄牌；未棄牌會成為死手。","etip": "Players are responsible for discarding before the turn; failure to discard results in a dead hand." },
	{ "id": "crymeariverholdem","category": "holdem","title": "Cry Me A River - Hold'em","ztitle": "Cry Me A River 德州","zsummary": "三牌面德州。河牌發出後，最低 river 點數的牌面會被移出遊戲。","esummary": "A triple-board Hold'em game. After the river, the board with the lowest river card is killed.","zdeal": "翻前發 2 張手牌；翻牌開三組牌面，轉牌與河牌各為三組牌面各發 1 張。河牌點數最低的牌面移出遊戲。","edeal": "Deal 2 hole cards preflop; deal 3 flops, then 1 turn and 1 river for each board. The board with the lowest river rank is killed.","zwinner": "若剩兩個牌面，兩個牌面的最佳高牌分池；若只剩一個牌面，該牌面最佳高牌贏得底池。","ewinner": "If 2 boards remain, the best high hand on each board splits the pot; if 1 board remains, that board's best high hand wins the pot.","ztip": "若最低 river 點數並列，可移出兩個牌面；若三張 river 點數相同，只保留最高花色那個牌面。","etip": "If the lowest river rank is tied, 2 boards can be killed; if all 3 rivers tie in rank, only the board with the highest river suit remains." },
	{ "id": "deuceswild","category": "holdem","title": "Deuces Wild","ztitle": "萬用2","zsummary": "四張 2 都是萬用牌，可以當作牌組中的任何其他牌。","esummary": "All four deuces are wild and can be used as any other card in the deck.","zdeal": "發牌與下注照德州，所有 2 視為萬用牌。起手拿到一對 2 必須立刻亮牌，該手牌結束並贏得盲注、前注與下一手按鈕。","edeal": "Deal and bet like Hold'em; all deuces are wild. Pocket deuces must be tabled immediately, ending the hand and winning blinds, antes, and the next button.","zwinner": "含萬用牌後的最佳高牌勝；五條大於同花順，但小於皇家同花順。","ewinner": "Best high hand after wild cards wins; five of a kind beats a straight flush but loses to a royal flush.","ztip": "起手一對 2 沒有立即亮牌，若在攤牌才被發現，該手牌作廢且不能爭取底池。","etip": "Pocket deuces not tabled immediately are mucked if exposed at showdown and lose any claim to the pot." },
	{ "id": "doubleboardholdem","category": "holdem","title": "Double Board - Hold'em","ztitle": "雙牌面德州","zsummary": "同一手牌開兩組公共牌，可作單一贏家或雙贏家分池。","esummary": "One hand plays across two boards and can be single-winner or split by board.","zdeal": "手牌照德州；翻牌、轉牌、河牌各開上、下兩組牌面。","edeal": "Hole cards follow Hold'em; flop, turn, and river are dealt for top and bottom boards.","zwinner": "單一贏家版本：任一牌面最佳五張高牌贏得全池。雙贏家版本：上牌面最佳高牌拿半池、下牌面最佳高牌拿半池。","ewinner": "Single-winner version: the best 5-card high hand from either board wins the full pot. Double-winner version: top board and bottom board each award half.","ztip": "雙贏家分池有不可拆分計分牌時，先給贏得上牌面的手牌；單一牌面內再分不開時，給按鈕順時針方向第一位仍在牌局中的選手。","etip": "For double-winner splits, the odd chip first goes to the top-board winner; an odd chip within one board goes to the first active player clockwise from the button." },
	{ "id": "doubleboardbombholdem","category": "holdem","title": "Double Board Bomb Pot - Hold'em","ztitle": "雙牌面 Bomb Pot 德州","zsummary": "所有人先投入 bomb pot 金額，發手牌後直接看雙牌面翻牌。","esummary": "Everyone posts the bomb-pot amount, receives hole cards, and goes straight to two flops.","zdeal": "收 bomb pot 前注，發手牌，直接開兩組翻牌後開始下注；轉牌、河牌各為兩組牌面各發 1 張。","edeal": "Collect the bomb-pot ante, deal hole cards, reveal two flops, then betting begins; turn and river complete both boards.","zwinner": "兩個牌面分別判定最佳高牌，分池方式照雙牌面德州。","ewinner": "Each board is judged for the best high hand; split handling follows Double Board Hold'em.","ztip": "攤牌時逐一判定上牌面與下牌面。","etip": "At showdown, evaluate the top board and bottom board separately." },
	{ "id": "lazyrivers","category": "holdem","title": "Lazy Rivers","ztitle": "Lazy Rivers","zsummary": "德州河牌變體：每位仍在牌局中的選手會得到自己的明面私人河牌。","esummary": "A Hold'em river variant where each active player receives an individual face-up private river card.","zdeal": "前面街道照德州，到轉牌下注結束後 burn 1 張，為每位仍在牌局中的選手各發 1 張明面私人河牌，然後進行最後一輪下注。","edeal": "Earlier streets follow Hold'em. After turn betting, burn 1 card and deal each active player an individual face-up private river card, followed by the final betting round.","zwinner": "用 2 張手牌、4 張公共牌與自己的明面私人河牌任意組成最佳 5 張牌。","ewinner": "Best 5-card hand using any combination of 2 hole cards, 4 community cards, and that player's individual face-up river card wins.","ztip": "私人河牌必須留在桌面上，作為該選手自己的第五張牌面。","etip": "The private river card stays face-up on the table and completes that player's own five-card board." },
	{ "id": "noahsark","category": "holdem","title": "Noah's Ark (2x2)","ztitle": "Noah's Ark (2x2)","zsummary": "每人 2 張手牌；翻牌、轉牌、河牌每街各發 2 張公共牌，河牌後共有 6 張公共牌。","esummary": "Each player gets 2 hole cards; flop, turn, and river each deal 2 community cards, leaving 6 board cards after the river.","zdeal": "翻前照德州發 2 張手牌。翻牌發 2 張公共牌並下注；轉牌再發 2 張公共牌並下注；河牌再發 2 張公共牌並下注。","edeal": "Preflop follows Hold'em with 2 hole cards. The flop deals 2 community cards and betting follows; the turn deals 2 more and betting follows; the river deals 2 more and the final betting round follows.","zwinner": "從 2 張手牌與 6 張公共牌中選最佳 5 張高牌；其他規則照德州。","ewinner": "Best 5-card high hand from 2 hole cards and 6 board cards wins; all other rules remain unchanged from Hold'em.","ztip": "2x2 指的是三個公共牌街都是一次發 2 張，不是兩組牌面。","etip": "2x2 means every board street deals 2 community cards; it is not a two-board game." },
	{ "id": "pineapple","category": "holdem","title": "Pineapple","ztitle": "大菠蘿","zsummary": "每人翻前發 3 張手牌，翻前下注結束後、翻牌發出前棄掉 1 張。","esummary": "Each player receives 3 hole cards preflop and discards 1 after preflop betting, before the flop is dealt.","zdeal": "翻前發 3 張手牌；翻前下注結束後、翻牌發出前，所有仍在牌局中的選手必須棄 1 張。全部棄牌完成後才發翻牌。","edeal": "Deal 3 hole cards preflop; after preflop betting and before the flop, all active players must discard 1. The flop is dealt after all discards are complete.","zwinner": "棄牌後照德州規則，以剩餘手牌與公共牌組成最佳高牌。","ewinner": "After the discard, Hold'em rules apply and the best high hand from retained hole cards and board wins.","ztip": "選手有責任在翻牌前完成棄牌；未棄牌會成為死手。","etip": "Players are responsible for discarding before the flop; failure to discard results in a dead hand." },
	{ "id": "redriverholdem","category": "holdem","title": "Red River - Holdem","ztitle": "Red River 德州","zsummary": "河牌若是紅牌，會繼續加發公共牌；直到發出黑色 river 才進入最後下注與攤牌。","esummary": "If the river is red, another board card is added; the process continues until a black river appears, then final betting and showdown follow.","zdeal": "翻前、翻牌、轉牌照德州。轉牌下注結束後 burn 1 張並發 river；若 river 是紅心或方塊，下注結束後再 burn 1 張並加發 1 張公共牌，直到發出梅花或黑桃為止。","edeal": "Preflop, flop, and turn follow Hold'em. After turn betting, burn 1 and deal the river; if it is a heart or diamond, another betting round completes, then burn 1 and add another board card until a club or spade appears.","zwinner": "最後所有可用公共牌與手牌組成最佳 5 張高牌。","ewinner": "Best 5-card high hand from the final available board and hole cards wins.","ztip": "紅色 river 會延長牌局；黑色 river 結束加發流程。","etip": "A red river extends the hand; a black river ends the extra-card process." },
	{ "id": "shortdeck","category": "holdem","title": "Short Deck (Six-Plus)","ztitle": "短牌德州（Six-Plus）","zsummary": "移除 2、3、4、5，只用 36 張牌。順子小於三條；A-K-Q-J-10 為最大順子，A-6-7-8-9 為最小順子。","esummary": "Cards 2, 3, 4, and 5 are removed for a 36-card deck. A straight loses to three of a kind; A-K-Q-J-10 is the highest straight, and A-6-7-8-9 is the lowest straight.","zdeal": "以短牌牌組進行德州流程；翻前、翻牌、轉牌、河牌仍是四輪下注。","edeal": "Play Hold'em flow with the Short Deck: preflop, flop, turn, and river betting rounds.","zwinner": "用短牌牌型排序判定最佳高牌；順子小於三條。","ewinner": "Best high hand is determined using Short Deck hand rankings; a straight loses to three of a kind.","ztip": "短牌牌組移除 2、3、4、5，讀牌時不要把不存在的點數算進順子。","etip": "Short Deck removes 2, 3, 4, and 5; do not count removed ranks when reading straights." },
	{ "id": "superholdem","category": "holdem","title": "Super Hold'em","ztitle": "超級德州","zsummary": "每人 3 張手牌，但不棄牌，最後可用 0 到 3 張手牌組牌。","esummary": "Each player keeps 3 hole cards and can use 0 to 3 of them at showdown.","zdeal": "發 3 張手牌後照德州開公共牌與下注。","edeal": "Deal 3 hole cards, then run the normal Hold'em board and betting streets.","zwinner": "任意手牌張數加公共牌組最佳高牌。","ewinner": "Best high hand using any number of hole cards and board cards wins.","ztip": "不要把它誤判成 Omaha；Super Hold'em 不要求剛好 2 張手牌。","etip": "Do not evaluate it as Omaha; Super Hold'em does not require exactly 2 hole cards." },
	{ "id": "winthebutton","category": "holdem","title": "Win the Button - Hold'em","ztitle": "莊位爭奪賽","zsummary": "贏得底池的選手同時贏得下一手按鈕位。","esummary": "The player who wins the pot also wins the dealer button for the next hand.","zdeal": "牌局照德州；每手結束後按鈕移到該手底池贏家，盲注由按鈕左側兩位選手照常支付。","edeal": "Play like Hold'em; after each hand, move the button to the pot winner, and the two players left of the button post blinds as normal.","zwinner": "高牌勝並取得下一手按鈕；若同一位選手連續贏得多個底池，按鈕留在該選手。","ewinner": "Best high hand wins and receives the next button; if the same player wins multiple pots in a row, the button stays with that player.","ztip": "分池時，按鈕給位置最前的獲勝選手。調桌時以抽高牌方式隨機決定移桌者與新座位。","etip": "In a split pot, the button goes to the winning player in the worst position. For table balancing, high-card draws randomly determine who moves and the new seat." },
	{ "id": "omahahigh","category": "omaha","title": "Omaha High","ztitle": "一般奧馬哈","zsummary": "每人 4 張手牌，必須剛好用 2 張手牌與 3 張公共牌組牌。","esummary": "Players get 4 hole cards and must use exactly 2 hole cards plus 3 board cards.","zdeal": "盲注後發手牌，翻前、翻牌、轉牌、河牌四輪下注。","edeal": "After blinds, deal hole cards and play preflop, flop, turn, and river betting rounds.","zwinner": "最佳高牌勝；不能只用 1 張手牌，也不能用 3 張以上手牌，公共牌也必須剛好取 3 張。","ewinner": "Best high hand wins; a player cannot use only 1 hole card or more than 2 hole cards, and must use exactly 3 board cards.","ztip": "攤牌牌型來源固定為剛好 2 張手牌與剛好 3 張公共牌。","etip": "Showdown construction is exactly 2 hole cards and exactly 3 board cards." },
	{ "id": "bigo","category": "omaha","title": "Big O","ztitle": "Big O","zsummary": "5 張手牌的 Omaha 高低玩法，採 8 or better 低牌資格。","esummary": "A 5-card Omaha Hi-Lo game with an 8-or-better qualifier for low.","zdeal": "每人 5 張手牌，翻牌、轉牌、河牌照 Omaha。","edeal": "Deal 5 hole cards, then flop, turn, and river like Omaha.","zwinner": "高牌與合格低牌分池；每邊都必須剛好用 2 張手牌與 3 張公共牌。若沒有合格低牌，高牌通吃整個底池。若有不可拆分計分牌，贏得高牌面並於越前位者獲得。","ewinner": "High and qualifying low split the pot; each side uses exactly 2 hole cards and 3 board cards. If no low qualifies, high wins the full pot. Any indivisible odd chip goes to the earliest-position player among the high-hand winners.","ztip": "不是任意 5 張牌，仍然要套用 Omaha 的 2+3 組牌限制。","etip": "This is not any 5 cards; Omaha's 2+3 construction rule still applies." },
	{ "id": "courchevelhilo","category": "omaha","title": "Courchevel Hi-Lo","ztitle": "Courchevel 高低","zsummary": "5 張手牌 Omaha，高低分池；翻前先開出第一張公共牌。","esummary": "A 5-card Omaha Hi-Lo game where the first board card is exposed before preflop action.","zdeal": "發 5 張手牌並先開 1 張公共牌，再下注、補成翻牌、轉牌、河牌。","edeal": "Deal 5 hole cards and expose 1 board card, then bet, complete the flop, turn, and river.","zwinner": "高牌與 8 or better 低牌分池，組牌仍需 2 張手牌加 3 張公共牌。若有不可拆分計分牌，贏得高牌面並於越前位者獲得。","ewinner": "High and 8-or-better low split; hands still use exactly 2 hole cards and 3 board cards. Any indivisible odd chip goes to the earliest-position player among the high-hand winners.","ztip": "第一張公共牌翻前已知，下注範圍會比一般 Omaha 更集中。","etip": "The exposed first board card focuses ranges before the flop." },
	{ "id": "crymeariveromaha","category": "omaha","title": "Cry Me a River - Omaha","ztitle": "Cry Me A River 奧馬哈","zsummary": "三牌面 Omaha。河牌發出後，river 點數最低的牌面會被移出遊戲。","esummary": "A triple-board Omaha game. After the rivers are dealt, the board with the lowest river rank is killed.","zdeal": "發 4 張或 5 張 Omaha 手牌；翻牌開上、中、下三組牌面，轉牌與河牌各為三組牌面各發 1 張。河牌點數最低的牌面移出遊戲。","edeal": "Deal 4 or 5 Omaha hole cards; deal top, middle, and bottom flops, then one turn and one river for each board. The board with the lowest river rank is killed.","zwinner": "剩餘牌面分別用 Omaha 2+3 規則判定。若剩兩個牌面，兩個牌面的最高牌分池；若只剩一個牌面，該牌面最高牌贏得底池。Ultimate Hi-Lo 版本由最高高牌與最低低牌分池。","ewinner": "Remaining boards are evaluated with Omaha's 2+3 rule. If 2 boards remain, the best high hand on each board splits the pot; if 1 board remains, that board's best high hand wins the pot. In Ultimate Hi-Lo, the highest high hand and lowest low hand split.","ztip": "兩張最低 river 同點數時，兩個牌面都移出遊戲；三張 river 同點數時，只保留最高花色那個牌面。花色由低到高為梅花、方塊、紅心、黑桃。","etip": "If 2 rivers tie for lowest rank, both boards are killed. If all 3 rivers tie in rank, only the board with the highest suit remains. Suit order from low to high is clubs, diamonds, hearts, spades." },
	{ "id": "doubleboardomaha","category": "omaha","title": "Double Board - Omaha","ztitle": "雙牌面奧馬哈","zsummary": "Omaha 打兩組公共牌，兩個牌面分別判定。","esummary": "Omaha played on two boards, with each board evaluated separately.","zdeal": "發 Omaha 手牌，每街開兩組公共牌。","edeal": "Deal Omaha hole cards, then two boards across the streets.","zwinner": "每個牌面都必須用剛好 2 張手牌與該牌面 3 張公共牌。","ewinner": "Each board requires exactly 2 hole cards and 3 cards from that board.","ztip": "派彩時一個牌面一個牌面處理，尤其多人 all-in 時要先列邊池。","etip": "Pay one board at a time, especially with multiple all-ins and side pots." },
	{ "id": "doubleboardbombomaha","category": "omaha","title": "Double Board Bomb Pot - Omaha","ztitle": "雙牌面 Bomb Pot 奧馬哈","zsummary": "所有人投入 bomb pot 後直接看雙牌面翻牌的 Omaha。","esummary": "Everyone posts the bomb-pot amount and goes straight to two Omaha flops.","zdeal": "收固定前注，發 Omaha 手牌，沒有翻前下注；直接開上、下兩組翻牌後開始下注。","edeal": "Collect the fixed ante, deal Omaha hole cards, with no preflop betting; reveal top and bottom flops, then betting starts.","zwinner": "兩個牌面分別用 Omaha 2+3 規則判定。","ewinner": "Each board is evaluated with Omaha's exactly 2+3 rule.","ztip": "Bomb Pot 的底池在發翻牌前已由固定前注形成。","etip": "The Bomb Pot is built from fixed antes before the flops are dealt." },
	{ "id": "lazyriversomaha","category": "omaha","title": "Lazy Rivers - Omaha","ztitle": "Lazy Rivers 奧馬哈","zsummary": "Omaha 河牌變體：每位仍在牌局中的選手會得到自己的明面私人河牌。","esummary": "An Omaha river variant where each active player receives an individual face-up private river card.","zdeal": "前段照 Omaha，到轉牌下注結束後 burn 1 張，為每位仍在牌局中的選手各發 1 張明面私人河牌，然後進行最後一輪下注。","edeal": "Earlier streets follow Omaha. After turn betting, burn 1 card and deal each active player an individual face-up private river card, followed by the final betting round.","zwinner": "用 2 張手牌、4 張公共牌與自己的明面私人河牌任意組成最佳 5 張牌。","ewinner": "Best 5-card hand using any combination of 2 hole cards, 4 community cards, and that player's individual face-up river card wins.","ztip": "私人河牌必須留在桌面上，作為該選手自己的第五張牌面。","etip": "The private river card stays face-up on the table and completes that player's own five-card board." },
	{ "id": "omahahilo","category": "omaha","title": "Omaha Hi-Lo (8/b)","ztitle": "奧馬哈高低（8 or better）","zsummary": "Omaha 分高低半池，低牌需要 8 以下且五張不同點數。","esummary": "Omaha split between high and low; low needs five different ranks 8 or lower.","zdeal": "流程同 Omaha High。","edeal": "Flow is the same as Omaha High.","zwinner": "高牌半池、合格低牌半池；兩邊都要 2 張手牌加 3 張公共牌。若沒有合格低牌，高牌通吃整個底池。若有不可拆分計分牌，贏得高牌面並於越前位者獲得。","ewinner": "High gets half and qualifying low gets half; both use exactly 2 hole cards and 3 board cards. If no low qualifies, high wins the full pot. Any indivisible odd chip goes to the earliest-position player among the high-hand winners.","ztip": "同一手可同時拿高低，稱為 scoop。沒有低牌時高牌通吃。","etip": "One hand can win both halves, called a scoop. If no low qualifies, high scoops." },
	{ "id": "acetofive","category": "draw","title": "A-5 / Ace to Five","ztitle": "A-5 低牌","zsummary": "低牌抽牌遊戲，A 永遠是低牌，順子與同花不影響低牌。","esummary": "A lowball draw game where aces are low and straights and flushes do not count against low.","zdeal": "每人 5 張暗牌，下注後可換 0 到 5 張；Single Draw 換一次，Triple Draw 換三次。","edeal": "Deal 5 down cards, bet, and draw 0 to 5 cards; Single Draw has 1 draw, Triple Draw has 3.","zwinner": "最低 5 張牌勝，最佳牌是 5-4-3-2-A。","ewinner": "Lowest 5-card hand wins; the best hand is 5-4-3-2-A.","ztip": "比低牌時先看最高張，7-5 low 贏 7-6 low。","etip": "Low hands compare from the highest card down; 7-5 low beats 7-6 low." },
	{ "id": "deucetoseven","category": "draw","title": "2-7 / Deuce to Seven","ztitle": "2-7 低牌","zsummary": "低牌抽牌遊戲，A 是高牌，順子與同花會讓低牌變差。","esummary": "A lowball draw game where aces are high and straights and flushes hurt the hand.","zdeal": "每人 5 張暗牌，依 Single Draw 或 Triple Draw 規則換牌與下注。","edeal": "Deal 5 down cards, then draw and bet under Single Draw or Triple Draw rules.","zwinner": "最佳低牌是 7-5-4-3-2，且不能同花。","ewinner": "The best low is 7-5-4-3-2, not a flush.","ztip": "不要把 A-5 的 wheel 當好牌；A-2-3-4-5 在 2-7 是順子且 A 高。","etip": "Do not treat the A-5 wheel as strong; A-2-3-4-5 is a straight with an ace high in 2-7." },
	{ "id": "fivecarddraw","category": "draw","title": "5-Card Draw - High","ztitle": "五張抽牌高牌","zsummary": "傳統 5 張抽牌，高牌牌型勝。","esummary": "Traditional 5-card draw played for the best high hand.","zdeal": "每人 5 張暗牌，下注後可換牌，再下注攤牌。","edeal": "Deal 5 down cards, bet, draw replacements, bet again, then showdown.","zwinner": "標準最高 5 張牌型勝。","ewinner": "Best standard high 5-card poker hand wins.","ztip": "換牌張數會影響對手可取得的公開資訊。","etip": "Draw count is public information that affects the table's reads." },
	{ "id": "archie","category": "draw","title": "Archie","ztitle": "Archie","zsummary": "分池 Single Draw 或 Triple Draw 遊戲，高牌與低牌都有合格條件。","esummary": "A split-pot Single or Triple Draw game with qualifiers for both high and low hands.","zdeal": "每人 5 張暗牌；第一輪下注後可換牌。Single Draw 換一次，Triple Draw 共三次換牌並有四輪下注。","edeal": "Each player gets 5 down cards; after the first betting round players can draw. Single Draw has 1 draw; Triple Draw has 3 draws and 4 betting rounds.","zwinner": "高牌需一對 6 以上；低牌採 A-5 low 並需 8 or better。只有一邊合格時該邊通吃；兩邊都沒人合格時，由攤牌者平分。","ewinner": "High must contain a pair of 6s or better; low uses A-5 low with 8-or-better qualification. If only one side qualifies, that side wins the pot; if nobody qualifies, players who tabled cards split the pot.","ztip": "不可拆分計分牌先給高牌面；若同一面分不開，給按鈕左手邊第一位仍在牌局中的選手。","etip": "The odd chip first goes to the high side; an odd chip within either side goes to the first active player left of the button." },
	{ "id": "badacey","category": "draw","title": "Badacey","ztitle": "Badacey","zsummary": "Badugi 與 A-5 低牌混合，半池給最佳 Badugi，半池給最佳 A-5 低牌。","esummary": "A Badugi and A-5 lowball mix, splitting half to best Badugi and half to best A-5 low.","zdeal": "Triple Draw 節奏，每次可換牌後下注。","edeal": "Triple Draw rhythm with betting after each draw.","zwinner": "Badugi 半池與 A-5 低牌半池分別判定。","ewinner": "Badugi half and A-5 low half are evaluated separately.","ztip": "同一手可爭兩邊，但 Badugi 要不同花色與不同點數。","etip": "One hand can compete both ways, but Badugi needs different suits and ranks." },
	{ "id": "badeucey","category": "draw","title": "Badeucey","ztitle": "Badeucey","zsummary": "Badugi 與 2-7 低牌混合，半池 Badugi、半池 2-7。","esummary": "A Badugi and 2-7 lowball mix, splitting half to Badugi and half to 2-7.","zdeal": "Triple Draw 流程，換牌後下注。","edeal": "Triple Draw flow with betting after draws.","zwinner": "最佳 Badugi 與最佳 2-7 低牌分池。","ewinner": "Best Badugi and best 2-7 low split the pot.","ztip": "A 在 2-7 半池是高牌，在 Badugi 半池也不是自動好牌。","etip": "Aces are high for the 2-7 half and are not automatically strong for the Badugi half." },
	{ "id": "badugi","category": "draw","title": "Badugi","ztitle": "巴杜基","zsummary": "4 張牌低牌遊戲，目標是不同花色、不同點數且越低越好。","esummary": "A 4-card lowball game aiming for four different suits and ranks, as low as possible.","zdeal": "每人 4 張暗牌，Triple Draw，可換牌後下注。","edeal": "Deal 4 down cards, Triple Draw, with betting after each draw.","zwinner": "四張 Badugi 勝三張 Badugi；同張數時比最高張往下。","ewinner": "A 4-card Badugi beats a 3-card Badugi; same length compares high card downward.","ztip": "配對或同花色會讓其中一張不能算入 Badugi。","etip": "Pairs or duplicate suits force one card out of the Badugi hand." },
	{ "id": "drawmaha","category": "draw","title": "Drawmaha 2-7","ztitle": "Drawmaha 2-7","zsummary": "Omaha 高牌加 2-7 抽牌低牌的混合分池遊戲。","esummary": "A split game combining Omaha high with 2-7 draw low.","zdeal": "每位選手的手牌同時形成 Omaha 牌面與抽牌手牌；抽牌半池依 2-7 lowball 判定。","edeal": "Each player's hand forms both an Omaha board hand and a draw hand; the draw half is evaluated as 2-7 lowball.","zwinner": "Omaha 高牌半池與 2-7 抽牌低牌半池分別判定。","ewinner": "Omaha high and 2-7 draw low halves are evaluated separately.","ztip": "Omaha 半池仍需剛好 2 張手牌與 3 張公共牌。","etip": "The Omaha half still uses exactly 2 hole cards and 3 board cards." },
	{ "id": "svitenspecial","category": "draw","title": "Sviten Special","ztitle": "Sviten Special","zsummary": "5 張手牌加公共牌的混合遊戲，分別判定抽牌手牌與 Omaha 牌面。","esummary": "A mixed game with 5 hole cards and a board, evaluating both the draw hand and the Omaha board hand.","zdeal": "發 5 張手牌並開公共牌；選手可換牌，最後同時看抽牌手牌與 Omaha 牌面。","edeal": "Deal 5 hole cards with a board; players draw, then both the draw hand and Omaha board hand are evaluated.","zwinner": "抽牌手牌與 Omaha 牌面各爭一半底池。","ewinner": "The draw hand and Omaha board hand each play for half the pot.","ztip": "Omaha 半池仍需剛好 2 張手牌與 3 張公共牌，抽牌半池看手中 5 張牌。","etip": "The Omaha half still uses exactly 2 hole cards and 3 board cards; the draw half uses the 5-card hand." },
	{ "id": "sevencardstud","category": "stud","title": "7-Card Stud Hi","ztitle": "七張梭哈高牌","zsummary": "沒有公共牌。每人最多 7 張自己的牌，部分明牌、部分暗牌。","esummary": "No community cards. Each player receives up to 7 personal cards, some face up and some face down.","zdeal": "ante 後第三街發兩暗一明，最低明牌門牌付 bring-in 或補足成完整下注；同點數門牌以花色低者付 bring-in，花色由低到高為梅花、方塊、紅心、黑桃。第四到第六街各發 1 張明牌，第七街發 1 張暗牌。","edeal": "After antes, third street deals two downcards and one upcard; the lowest door card posts the bring-in or completes to a full bet. Door-card ties are broken by the lowest suit: clubs, diamonds, hearts, spades. Fourth through sixth streets each deal one upcard, and seventh street deals one downcard.","zwinner": "從自己的 7 張牌中選最佳 5 張高牌。","ewinner": "Best high 5-card hand from the player's own 7 cards wins.","ztip": "第四街之後由目前明牌能組成的最高牌面先行動。明牌牌面只包含桌上已亮出的牌，不包含暗牌；第四街看 2 張明牌，第五街看 3 張明牌，第六街與第七街看 4 張明牌。","etip": "From fourth street onward, the strongest exposed board acts first. Exposed board means only the face-up cards on the table, not downcards: 2 upcards on fourth street, 3 on fifth, and 4 on sixth and seventh." },
	{ "id": "sevencardstudhilo","category": "stud","title": "7-Card Stud Hi-Lo (8/b)","ztitle": "七張梭哈高低（8 or better）","zsummary": "七張梭哈分高低半池，低牌需 8 以下資格。","esummary": "7-Card Stud split between high and an 8-or-better qualifying low.","zdeal": "發牌流程同七張梭哈高牌。","edeal": "Deal flow is the same as Stud Hi.","zwinner": "最佳高牌拿半池；合格最低牌拿半池，沒有低牌時高牌通吃。若有不可拆分計分牌，贏得高牌面並於越前位者獲得。","ewinner": "Best high gets half; qualifying best low gets half. If no low qualifies, high scoops. Any indivisible odd chip goes to the earliest-position player among the high-hand winners.","ztip": "高低可用不同 5 張牌組，A 可作低牌。","etip": "High and low can use different 5-card sets; aces can play low." },
	{ "id": "sevencardstudhiloregular","category": "stud","title": "7-Card Stud Hi-Lo Regular","ztitle": "七張梭哈高低 Regular","zsummary": "七張梭哈高低分池，低牌沒有 8 or better 資格限制。","esummary": "A 7-Card Stud Hi-Lo split game with no 8-or-better low qualifier.","zdeal": "照七張梭哈發牌，逐街下注。","edeal": "Deal as Stud with betting on each street.","zwinner": "高牌半池，最低牌半池；低牌不需要 8 or better 資格。若有不可拆分計分牌，贏得高牌面並於越前位者獲得。","ewinner": "High takes half and low takes half; the low does not need an 8-or-better qualifier. Any indivisible odd chip goes to the earliest-position player among the high-hand winners.","ztip": "Regular 與 8/b 的差別是低牌沒有 8 or better 資格限制。","etip": "Regular differs from 8/b because the low side has no 8-or-better qualifier." },
	{ "id": "razz","category": "stud","title": "Razz","ztitle": "Razz","zsummary": "七張梭哈的低牌版本，目標是最低 5 張牌。","esummary": "The lowball version of 7-Card Stud, aiming for the lowest 5-card hand.","zdeal": "第三街發兩暗一明，最高明牌門牌付 bring-in 或補足成完整下注；同點數門牌以花色高者付 bring-in，花色由低到高為梅花、方塊、紅心、黑桃。第四街之後由目前明牌能組成的最低低牌牌面先行動。","edeal": "Third street deals two downcards and one upcard; the highest door card posts the bring-in or completes to a full bet. Door-card ties are broken by the highest suit: clubs, diamonds, hearts, spades. From fourth street onward, the lowest exposed lowball board acts first.","zwinner": "A-5 低牌規則，最佳是 5-4-3-2-A，順子同花不影響。","ewinner": "A-5 low rules: best is 5-4-3-2-A, and straights or flushes do not hurt.","ztip": "Razz 的牌面越低越強；目前明牌牌面只看桌上已亮出的牌，不包含暗牌。第四街看 2 張明牌，第五街看 3 張明牌，第六街與第七街看 4 張明牌。","etip": "In Razz, lower exposed boards are stronger. Exposed board means only the face-up cards on the table, not downcards: 2 upcards on fourth street, 3 on fifth, and 4 on sixth and seventh." },
	{ "id": "razzdugi","category": "stud","title": "Razzdugi","ztitle": "Razzdugi","zsummary": "Razz 與 Badugi 混合分池，兼看 A-5 低牌與 Badugi。","esummary": "A split game combining Razz with Badugi, playing for A-5 low and Badugi halves.","zdeal": "以 Stud 方式發牌，但同時追求 Razz 低牌與 Badugi 組合。","edeal": "Dealt in Stud style while players chase both Razz low and Badugi hands.","zwinner": "Razz 半池與 Badugi 半池分別判定。","ewinner": "Razz half and Badugi half are judged separately.","ztip": "明牌會同時透露 Razz 半池與 Badugi 半池的資訊。","etip": "Upcards reveal information for both the Razz half and the Badugi half." },
	{ "id": "razzdugideuce","category": "stud","title": "Razzdugi (2-7)","ztitle": "Razzdugi（2-7）","zsummary": "Razzdugi 的 2-7 低牌版本，低牌半池採 2-7 邏輯。","esummary": "A 2-7 version of Razzdugi, where the lowball half follows 2-7 logic.","zdeal": "Stud 發牌流程，同時看 2-7 低牌與 Badugi。","edeal": "Stud deal flow, competing for 2-7 low and Badugi.","zwinner": "2-7 低牌半池與 Badugi 半池分別判定。","ewinner": "2-7 low half and Badugi half are evaluated separately.","ztip": "A 是高牌、順子同花會傷害 2-7 低牌，不要用 Razz 規則判。","etip": "Aces are high and straights/flushes hurt in 2-7; do not evaluate it like Razz." },
	{ "id": "superstud","category": "stud","title": "Super Stud Variations","ztitle": "Super Stud 變體","zsummary": "七張梭哈家族的 Super 變體，起手會有額外選擇或棄牌步驟。","esummary": "Super variants of the 7-Card Stud family add extra starting choices or discard steps.","zdeal": "依該 Super Stud 變體發起手牌並完成棄牌，再照指定的 Stud 高牌、高低或低牌流程進行。","edeal": "Deal the starting cards and complete the discard step for that Super Stud variant, then continue under the specified Stud high, Hi-Lo, or lowball flow.","zwinner": "依該 Super Stud 變體指定的高牌、高低或低牌規則判定。","ewinner": "Determine the winner under the high, Hi-Lo, or lowball rule specified for that Super Stud variant.","ztip": "起手張數、棄牌時點與高低規則由該變體名稱決定。","etip": "Starting-card count, discard timing, and high/low rule are defined by the specific variant name." }
]

const HANDBOOKCATEGORYDETAIL={
	"holdem": {
		"zhtw": "德州系玩法的共同骨架是「個人手牌 + 公共牌」。選手先拿到自己的暗牌，之後牌桌中央逐街開出公共牌；每一街結束前，仍在牌局中的選手要把下注額補齊、加注或棄牌。這類遊戲最重要的核對點，是每位選手到底可以用幾張手牌、公共牌總共有幾張、以及是否有雙牌面、bomb pot、短牌或 wild card 等特殊條件。",
		"en": "Hold'em-family games share the same frame: private hole cards plus a shared board. Players receive their own down cards, then community cards are exposed street by street; before each street closes, active players must call, raise, check when allowed, or fold. The variant changes how many hole cards can be used, how many board cards are live, or whether the game adds double boards, bomb pots, Short Deck, or wild-card rules."
	},
	"omaha": {
		"zhtw": "奧馬哈系玩法看起來像德州，但組牌限制完全不同：不管手上有 4、5、6 或 7 張牌，最後都必須剛好使用 2 張手牌，加上剛好 3 張公共牌。高低玩法會把高牌與低牌分開判定，同一位選手可以用不同的兩張手牌去爭高、爭低。公共牌上的完整牌型不能單獨成為有效手牌，仍然必須加入剛好 2 張手牌。",
		"en": "Omaha-family games look like Hold'em, but the hand-construction rule is different: regardless of whether players hold 4, 5, 6, or 7 cards, they must use exactly 2 hole cards and exactly 3 board cards. Hi-Lo versions evaluate high and low separately, and the same player can use different hole-card pairs for each half. A live-table mistake is seeing a complete hand on the board and forgetting that two hole cards are still mandatory."
	},
	"draw": {
		"zhtw": "抽牌系玩法沒有公共牌，資訊主要來自每位選手換了幾張牌、是否 stand pat，以及每輪下注的強弱。大多數 draw 遊戲一開始發暗牌，下注後選手可以棄掉部分手牌並補新牌；Single Draw 只換一次，Triple Draw 會換三次並穿插四輪下注。勝負判定分為高牌、A-5 低牌、2-7 低牌、Badugi 與混合分池；A、順子、同花在不同低牌規則中的價值完全不同。",
		"en": "Draw games have no shared board. Information comes from how many cards each player draws, whether they stand pat, and how the betting develops. Draw games start with down cards; after betting, players discard and receive replacements. Single Draw has one draw, while Triple Draw has three draws and four betting rounds. Hand evaluation depends on whether the game is high, A-5 lowball, 2-7 lowball, Badugi, or a split mix, because aces, straights, and flushes change value across those rules."
	},
	"stud": {
		"zhtw": "梭哈系玩法沒有按鈕與公共牌，每位選手逐街收到自己的牌，其中一部分明牌攤在桌上、一部分暗牌只有自己知道。第三街的 bring-in 是強制起始下注：高牌梭哈與高低梭哈由最低明牌門牌付出，Razz 由最高明牌門牌付出；同點數時用花色打破平手，花色由低到高為梅花、方塊、紅心、黑桃。第四街之後依目前明牌牌面決定先行動者；目前明牌牌面只看桌上已亮出的牌，不包含暗牌。第四街看 2 張明牌，第五街看 3 張明牌，第六街與第七街看 4 張明牌；高牌梭哈由最強明牌牌面先行動，Razz 由最低低牌明牌牌面先行動。",
		"en": "Stud-family games have no button and no community board. Each player receives personal cards street by street, some face up and some face down. Third street starts with a forced bring-in: Stud Hi and Stud Hi-Lo use the lowest door card, while Razz uses the highest door card. Ties in door-card rank are broken by suit from low to high: clubs, diamonds, hearts, spades. From fourth street onward, the current exposed board determines first action; exposed board means only face-up cards, not downcards. Fourth street uses 2 upcards, fifth street uses 3 upcards, and sixth and seventh street use 4 upcards. Stud Hi uses the strongest exposed board, while Razz uses the lowest exposed lowball board."
	}
}

const HANDBOOKHIGHRANKLIST=[
	{ "zname": "皇家同花順","ename": "Royal Flush","zdesc": "A-K-Q-J-10 同花色，所有高牌牌型中最大。","edesc": "A-K-Q-J-10 of the same suit, the strongest high hand.","example": "A♥ K♥ Q♥ J♥ 10♥" },
	{ "zname": "同花順","ename": "Straight Flush","zdesc": "五張連號且同花色。","edesc": "Five consecutive cards of the same suit.","example": "9♠ 8♠ 7♠ 6♠ 5♠" },
	{ "zname": "四條","ename": "Four of a Kind","zdesc": "四張同點數牌。","edesc": "Four cards of the same rank.","example": "Q♣ Q♦ Q♥ Q♠ 3♣" },
	{ "zname": "葫蘆","ename": "Full House","zdesc": "三條加一對。","edesc": "Three of a kind plus one pair.","example": "K♣ K♦ K♥ 7♠ 7♦" },
	{ "zname": "同花","ename": "Flush","zdesc": "五張同花色但不連號。","edesc": "Five cards of the same suit that are not consecutive.","example": "A♦ J♦ 8♦ 4♦ 2♦" },
	{ "zname": "順子","ename": "Straight","zdesc": "五張連號但不同花色；A-K-Q-J-T 為最大順子、A-2-3-4-5 為最小順子。","edesc": "Five consecutive cards not all suited; A-K-Q-J-T is the highest straight and A-2-3-4-5 is the lowest straight.","example": "10♣ 9♦ 8♠ 7♥ 6♣" },
	{ "zname": "三條","ename": "Three of a Kind","zdesc": "三張同點數牌。","edesc": "Three cards of the same rank.","example": "8♣ 8♦ 8♠ K♥ 4♣" },
	{ "zname": "兩對","ename": "Two Pair","zdesc": "兩組不同點數的對子。","edesc": "Two different pairs.","example": "A♣ A♦ 9♠ 9♥ 3♣" },
	{ "zname": "一對","ename": "One Pair","zdesc": "兩張同點數牌。","edesc": "Two cards of the same rank.","example": "J♣ J♥ A♦ 8♠ 2♣" },
	{ "zname": "高牌","ename": "High Card","zdesc": "以上都沒有時，比五張牌中最大的牌，若相同再往下一張比。","edesc": "If none of the above exists, compare the highest card, then the next card down.","example": "A♣ Q♦ 9♠ 6♥ 3♣" }
]

const HANDBOOKSHORTDECKRANKLIST=[
	{ "zname": "皇家同花順","ename": "Royal Flush","zdesc": "A-K-Q-J-10 同花色，短牌高牌牌型中最大。","edesc": "A-K-Q-J-10 of the same suit, the strongest Short Deck high hand.","example": "A♥ K♥ Q♥ J♥ 10♥" },
	{ "zname": "同花順","ename": "Straight Flush","zdesc": "五張連號且同花色；短牌最低順子是 A-6-7-8-9。","edesc": "Five consecutive cards of the same suit; the lowest Short Deck straight is A-6-7-8-9.","example": "J♠ 10♠ 9♠ 8♠ 7♠" },
	{ "zname": "四條","ename": "Four of a Kind","zdesc": "四張同點數牌，另一張為 kicker。","edesc": "Four cards of the same rank plus one kicker.","example": "9♣ 9♦ 9♥ 9♠ 8♣" },
	{ "zname": "同花","ename": "Flush","zdesc": "五張同花色但不連號；短牌中同花大於葫蘆。","edesc": "Five cards of the same suit that are not consecutive; in Short Deck, a flush beats a full house.","example": "A♦ J♦ 10♦ 8♦ 7♦" },
	{ "zname": "葫蘆","ename": "Full House","zdesc": "三張同點數加一對；短牌中低於同花、高於順子。","edesc": "Three cards of one rank plus a pair; in Short Deck, it loses to a flush and beats a straight.","example": "J♣ J♦ J♠ Q♥ Q♣" },
	{ "zname": "三條","ename": "Three of a Kind","zdesc": "三張同點數牌；短牌中三條大於順子。","edesc": "Three cards of the same rank; in Short Deck, trips beat a straight.","example": "7♣ 7♦ 7♠ K♥ 10♣" },
	{ "zname": "順子","ename": "Straight","zdesc": "五張連號但不同花色；短牌中順子小於三條。A-K-Q-J-10 最大，A-6-7-8-9 最小。","edesc": "Five consecutive cards not all suited; in Short Deck, a straight loses to three of a kind. A-K-Q-J-10 is highest and A-6-7-8-9 is lowest.","example": "10♣ 9♦ 8♠ 7♥ 6♣" },
	{ "zname": "兩對","ename": "Two Pair","zdesc": "兩組不同點數的對子。","edesc": "Two different pairs.","example": "10♣ 10♦ 8♠ 8♥ 9♣" },
	{ "zname": "一對","ename": "One Pair","zdesc": "兩張同點數牌。","edesc": "Two cards of the same rank.","example": "Q♣ Q♦ A♠ 10♥ 7♣" },
	{ "zname": "高牌","ename": "High Card","zdesc": "以上都沒有時，比五張牌中最大的牌，若相同再往下一張比。","edesc": "If none of the above exists, compare the highest card, then the next card down.","example": "K♣ J♦ 10♠ 9♥ 6♣" }
]

const HANDBOOKBEGINNERDETAIL={
	"texasholdem": {
		"zhtw": [
			"德州撲克的目標是每一手最後比誰能組出最強的 5 張高牌牌型。每位選手一開始拿 2 張只有自己看的手牌，桌面會開出 5 張大家都能用的公共牌。",
			"攤牌時從自己的 2 張手牌加桌上 5 張公共牌中，挑出最好的 5 張。可以兩張手牌都用、只用一張、甚至完全不用手牌而直接用桌上 5 張公共牌比牌。",
			"一手牌可以在任何下注圈結束：如果有人下注後其他人都棄牌，最後留下的人直接贏底池，不需要攤牌。只有最後還有兩位以上選手沒棄牌時，才進入攤牌比牌型。"
		],
		"en": [
			"Texas Hold'em has one simple goal: at the end of the hand, make the strongest 5-card high poker hand. Each player starts with 2 private hole cards, and the table can reveal up to 5 shared community cards.",
			"At showdown, each player chooses the best 5 cards from 2 hole cards plus the 5 board cards. A player can use both hole cards, only 1 hole card, or even 0 hole cards if the board itself makes the best hand.",
			"A hand can end before showdown: if one player bets and everyone else folds, the last remaining player wins the pot immediately. Showdown only happens when at least two players remain after the final betting round."
		]
	},
	"omahahigh": {
		"zhtw": [
			"一般奧馬哈看起來像德州，因為一樣有翻前、翻牌、轉牌、河牌，也一樣使用公共牌。但最重要的差別是組牌限制：攤牌時必須剛好使用 2 張手牌，加上剛好 3 張公共牌。",
			"這不是任意五張牌。即使公共牌上已經有四張同花，選手手上只有一張同花，也不能用一張手牌加四張公共牌湊同花；因為公共牌只能用三張。",
			"一般奧馬哈每人 4 張手牌，手牌組合比德州多很多，所以成牌強度會變高。多人底池裡，兩對、弱順子或弱同花不夠強。"
		],
		"en": [
			"Omaha High looks like Hold'em because it uses preflop, flop, turn, river, and community cards. The key difference is construction: at showdown a player must use exactly 2 hole cards and exactly 3 board cards.",
			"This is not any five cards. If the board has four cards of one suit and you hold only one card of that suit, that is not a flush in Omaha because you can use only three board cards.",
			"Omaha High gives each player 4 hole cards, creating far more card combinations than Hold'em. Made hands run stronger, so two pair, weak straights, and weak flushes are fragile in multi-way pots."
		]
	},
	"fivecarddraw": {
		"zhtw": [
			"抽牌系玩法沒有公共牌，資訊主要來自每位選手換了幾張牌、是否 stand pat，以及每輪下注的強弱。",
			"大多數 draw 遊戲一開始發暗牌，下注後選手可以棄掉部分手牌並補新牌；Single Draw 只換一次，Triple Draw 會換三次並穿插四輪下注。",
			"勝負判定分為高牌、A-5 低牌、2-7 低牌、Badugi 與混合分池；A、順子、同花在不同低牌規則中的價值完全不同。"
		],
		"en": [
			"Draw games have no shared board. Information mainly comes from how many cards each player draws, whether they stand pat, and how strongly each betting round develops.",
			"Draw games start with down cards. After betting, players can discard part of the hand and receive replacements. Single Draw has one draw; Triple Draw has three draws with four betting rounds.",
			"Hand evaluation depends on whether the game is high, A-5 lowball, 2-7 lowball, Badugi, or a split mix, because aces, straights, and flushes change value across those rules."
		]
	},
	"sevencardstud": {
		"zhtw": [
			"梭哈系玩法沒有按鈕與公共牌，每位選手逐街收到自己的牌，其中一部分明牌攤在桌上、一部分暗牌只有自己知道。",
			"第三街的 bring-in 是強制起始下注。高牌梭哈與高低梭哈由最低明牌門牌付出，Razz 由最高明牌門牌付出；同點數時用花色打破平手，花色由低到高為梅花、方塊、紅心、黑桃。第四街之後依目前明牌牌面決定先行動者；目前明牌牌面只看桌上已亮出的牌，不包含暗牌。第四街看 2 張明牌，第五街看 3 張明牌，第六街與第七街看 4 張明牌；高牌梭哈由最強明牌牌面先行動，Razz 由最低低牌明牌牌面先行動。",
			"七張梭哈高牌最後從自己的 7 張牌中挑最佳 5 張高牌。重點不是公共牌組合，而是記住每個人亮出過哪些牌、哪些牌已經死掉。"
		],
		"en": [
			"Stud-family games have no button and no shared board. Each player receives personal cards street by street, some face up and some face down.",
			"Third street starts with a forced bring-in. Stud Hi and Stud Hi-Lo use the lowest door card; Razz uses the highest door card. Ties in door-card rank are broken by suit from low to high: clubs, diamonds, hearts, spades. From fourth street onward, the current exposed board determines first action; exposed board means only face-up cards, not downcards. Fourth street uses 2 upcards, fifth street uses 3 upcards, and sixth and seventh street use 4 upcards. Stud Hi uses the strongest exposed board, while Razz uses the lowest exposed lowball board.",
			"7-Card Stud High chooses the best 5-card high hand from a player's own 7 cards. There is no shared board; exposed cards and dead cards form the public information."
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
			"德州和一般奧馬哈都會從可用牌中挑最佳五張；七張梭哈則是從自己的七張牌中挑最佳五張；五張抽牌高牌使用手上的五張。"
		],
		"erbody": [
			"In high-hand games, the winner is not simply the player with the highest single card. Players compare the strongest five-card poker hand. The hand category comes first; if the category ties, compare the ranks inside that category, then kickers.",
			"Hold'em and Omaha High choose the best five cards from their available cards; 7-Card Stud chooses the best five from a player's own seven cards; 5-Card Draw High uses the five cards in hand."
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
			"Standard Hold'em gives each player 2 hole cards and up to 5 board cards. At showdown, choose the best 5 cards from the 7 available cards. A player can use two hole cards, one hole card, or no hole cards."
		]
	},
	{
		"id": "guideomaha",
		"category": "guide",
		"title": "Omaha Construction",
		"ztitle": "奧馬哈組牌限制",
		"zsummary": "奧馬哈不是任意五張牌，攤牌時必須剛好 2 張手牌加 3 張公共牌。",
		"esummary": "Omaha is not any five cards; showdown requires exactly 2 hole cards and exactly 3 board cards.",
		"zbody": [
			"奧馬哈系玩法看起來像德州，但組牌限制完全不同：不管手上有 4、5、6 或 7 張牌，最後都必須剛好使用 2 張手牌，加上剛好 3 張公共牌。",
			"公共牌上的完整牌型不能單獨成為有效 Omaha 手牌。例如公共牌是四張同花，選手手上只有一張同花，不能把那一張加上四張公共牌當同花；因為 Omaha 只能取三張公共牌。"
		],
		"erbody": [
			"Omaha-family games look like Hold'em, but the construction rule is different: regardless of whether players hold 4, 5, 6, or 7 cards, they must use exactly 2 hole cards and exactly 3 board cards.",
			"A complete-looking board is not a valid Omaha hand by itself. If the board contains four suited cards and a player has only one card of that suit, that is not a flush in Omaha because only three board cards can be used."
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
			"勝負判定分為高牌、A-5 低牌、2-7 低牌、Badugi 與混合分池；A、順子、同花在不同低牌規則中的價值完全不同。"
		],
		"erbody": [
			"Draw games have no shared board. Information mainly comes from how many cards each player draws, whether they stand pat, and how strongly each betting round develops.",
			"Draw games start with down cards. After betting, players can discard part of the hand and receive replacements. Single Draw has one draw; Triple Draw has three draws with four betting rounds.",
			"Hand evaluation depends on whether the game is high, A-5 lowball, 2-7 lowball, Badugi, or a split mix, because aces, straights, and flushes change value across those rules."
		]
	},
	{
		"id": "guidestud",
		"category": "guide",
		"title": "Stud Basics",
		"ztitle": "梭哈系基本規則",
		"zsummary": "梭哈沒有公共牌，明牌會決定資訊、bring-in 與部分街道行動順序。",
		"esummary": "Stud has no shared board; upcards drive information, bring-ins, and action order on later streets.",
		"zbody": [
			"梭哈系玩法沒有按鈕與公共牌，每位選手逐街收到自己的牌，其中一部分明牌攤在桌上、一部分暗牌只有自己知道。",
			"第三街的 bring-in 是強制起始下注。高牌梭哈與高低梭哈由最低明牌門牌付出，Razz 由最高明牌門牌付出；同點數時用花色打破平手，花色由低到高為梅花、方塊、紅心、黑桃。第四街之後依目前明牌牌面決定先行動者；目前明牌牌面只看桌上已亮出的牌，不包含暗牌。第四街看 2 張明牌，第五街看 3 張明牌，第六街與第七街看 4 張明牌；高牌梭哈由最強明牌牌面先行動，Razz 由最低低牌明牌牌面先行動。"
		],
		"erbody": [
			"Stud-family games have no button and no shared board. Each player receives personal cards street by street, some face up and some face down.",
			"Third street starts with a forced bring-in. Stud Hi and Stud Hi-Lo use the lowest door card; Razz uses the highest door card. Ties in door-card rank are broken by suit from low to high: clubs, diamonds, hearts, spades. From fourth street onward, the current exposed board determines first action; exposed board means only face-up cards, not downcards. Fourth street uses 2 upcards, fifth street uses 3 upcards, and sixth and seventh street use 4 upcards. Stud Hi uses the strongest exposed board, while Razz uses the lowest exposed lowball board."
		]
	},
	{
		"id": "guidesplitlow",
		"category": "guide",
		"title": "Lowball and Split Pots",
		"ztitle": "低牌與分池",
		"zsummary": "高低玩法有低牌資格限制；沒有合格低牌時由高牌通吃。",
		"esummary": "Hi-Lo games use a low qualifier; if no low qualifies, high wins the full pot.",
		"zbody": [
			"高低玩法會把底池分成高牌半池與低牌半池。Omaha Hi-Lo 與 Stud Hi-Lo (8/b) 的低牌資格是 8 or better：五張低牌都必須是 8 以下，而且不能配對。若沒有人有合格低牌，高牌拿走整個底池。",
			"A-5 低牌把 A 視為低牌，順子與同花不會讓牌變差；2-7 低牌則把 A 視為高牌，順子與同花會讓牌變差。Badugi 則不是五張牌，而是最多四張不同花色、不同點數的低牌。"
		],
		"erbody": [
			"Hi-Lo games split the pot between a high half and a low half. Omaha Hi-Lo and Stud Hi-Lo (8/b) use an 8-or-better qualifier: all five low cards must be 8 or lower and unpaired. If nobody qualifies for low, high wins the full pot.",
			"A-5 lowball treats aces as low and ignores straights and flushes. 2-7 lowball treats aces as high and penalizes straights and flushes. Badugi is not a five-card hand; it is up to four low cards with different suits and ranks."
		]
	}
]

const HANDBOOKSPECIALDETAIL={
	"texasholdem": {
		"zhtw": "德州的比牌要記住「最佳五張」這件事。假設拿 A-K，桌上是 A-A-9-9-2，最佳五張會是 A-A-A-9-9，也就是葫蘆；如果另一位選手拿 A-Q，他也同樣有 A-A-A-9-9，因為第五張 kicker 沒有進入最佳五張，所以兩人平分。",
		"en": "The key Hold'em idea is always best five cards. With A-K on an A-A-9-9-2 board, the best hand is A-A-A-9-9, a full house. Another player holding A-Q also has A-A-A-9-9 because the kicker does not enter the best five cards, so the pot is split."
	},
	"threeoneholdem": {
		"zhtw": "3-2-1 德州只改公共牌開出的張數。一般德州公共牌是翻牌 3 張、轉牌 1 張、河牌 1 張；3-2-1 德州改成翻牌 3 張、第二段 2 張、最後一段 1 張，最後桌面共有 6 張公共牌。手牌仍是每人 2 張，攤牌時從手牌與公共牌中選最佳 5 張高牌。",
		"en": "3-2-1 Hold'em changes only the number of community cards dealt by street. Regular Hold'em uses a 3-card flop, 1-card turn, and 1-card river; 3-2-1 Hold'em deals 3 community cards, then 2, then 1, leaving 6 total board cards. Each player still has 2 hole cards, and showdown uses the best 5-card high hand from hole cards and board."
	},
	"noahsark": {
		"zhtw": "Noah's Ark 的 2x2 指的是三個公共牌街都一次發 2 張。一般德州是翻牌 3 張、轉牌 1 張、河牌 1 張；Noah's Ark 改成翻牌 2 張、轉牌 2 張、河牌 2 張，最後桌面共有 6 張公共牌。手牌仍是每人 2 張，攤牌時從手牌與公共牌中選最佳 5 張高牌。",
		"en": "In Noah's Ark, 2x2 means each board street deals 2 community cards. Regular Hold'em uses a 3-card flop, 1-card turn, and 1-card river; Noah's Ark deals 2 on the flop, 2 on the turn, and 2 on the river, leaving 6 total board cards. Each player still has 2 hole cards, and showdown uses the best 5-card high hand from hole cards and board."
	},
	"atomicpineapple": {
		"zhtw": "Atomic Pineapple 改的是起手手牌數與棄牌節奏。每位選手先拿 5 張手牌，翻前下注後棄 1 張，翻牌下注後棄 1 張，轉牌下注後再棄 1 張；到河牌時每位未棄牌選手剩 2 張手牌。攤牌照德州高牌邏輯，從剩餘手牌與公共牌中選最佳 5 張。",
		"en": "Atomic Pineapple changes the starting hand size and discard rhythm. Each player starts with 5 hole cards, discards 1 after preflop betting, 1 after flop betting, and 1 after turn betting; by the river each remaining player has 2 hole cards. Showdown follows Hold'em high-hand logic using retained hole cards and board."
	},
	"crazypineapple": {
		"zhtw": "Crazy Pineapple 改的是棄牌時點。每位選手翻前拿 3 張手牌並看完翻牌下注，翻牌下注結束後、轉牌發出前棄 1 張；剩餘 2 張手牌繼續打轉牌與河牌。未在轉牌前棄牌會成為死手。",
		"en": "Crazy Pineapple changes the discard timing. Each player starts with 3 hole cards, sees the flop betting round, then discards 1 card after flop betting and before the turn. The remaining 2 hole cards continue through turn and river. Failure to discard before the turn results in a dead hand."
	},
	"crymeariverholdem": {
		"zhtw": "Cry Me A River 德州改成三個牌面同時進行。翻牌開三組牌面，轉牌與河牌各為三組牌面各發 1 張；河牌點數最低的牌面移出遊戲。若最低 river 並列，並列的低牌面一起移出；若三張 river 同點數，只保留最高花色的牌面。",
		"en": "Cry Me A River Hold'em plays three boards at once. Three flops are dealt, then each board receives a turn and a river; the board with the lowest river rank is killed. If the lowest river rank is tied, the tied low boards are killed; if all three rivers tie in rank, only the board with the highest suit remains."
	},
	"deuceswild": {
		"zhtw": "Deuces Wild 把四張 2 設為萬用牌，任何 2 都可代表牌組中的其他牌來組最佳高牌。起手拿到一對 2 時必須立即亮牌，該手牌立刻結束；持有者贏得盲注、前注與下一手按鈕。萬用牌加入後，五條大於同花順，但小於皇家同花順。",
		"en": "Deuces Wild makes all four deuces wild, so any 2 can represent another card in the deck for the best high hand. Pocket deuces are tabled immediately and end the hand; that player wins the blinds, antes, and next button. With wild cards in play, five of a kind beats a straight flush but loses to a royal flush."
	},
	"doubleboardbombholdem": {
		"zhtw": "Double Board Bomb Pot 德州把底池在翻前先建立起來。所有選手投入 bomb pot 金額後發手牌，沒有額外翻前下注，直接開上、下兩組翻牌後開始下注；轉牌與河牌也各為兩組牌面各發 1 張。兩個牌面分別判定並分配底池。",
		"en": "Double Board Bomb Pot Hold'em builds the pot before the flop. All players post the bomb-pot amount, receive hole cards, and no additional preflop betting occurs; top and bottom flops are dealt and betting begins. Turn and river each add 1 card to both boards, and the two boards are evaluated separately."
	},
	"lazyrivers": {
		"zhtw": "Lazy Rivers 德州改的是河牌。翻前、翻牌與轉牌照德州進行；轉牌下注結束後，不是在中央發共同河牌，而是為每位仍在牌局中的選手各發 1 張明面私人河牌。每位選手只能使用自己的私人河牌，不能使用其他選手的私人河牌。",
		"en": "Lazy Rivers Hold'em changes the river. Preflop, flop, and turn follow Hold'em; after turn betting, instead of one shared river card, each active player receives one individual face-up private river. A player can use only that player's own private river, not another player's private river."
	},
	"redriverholdem": {
		"zhtw": "Red River 德州改的是 river 顏色觸發。轉牌下注後發 river；若該 river 是紅心或方塊，下注結束後再 burn 1 張並加發 1 張公共牌。這個流程會持續到發出梅花或黑桃；黑色 river 出現後，加發流程結束並進入最後攤牌判定。",
		"en": "Red River Hold'em changes the river through card color. After turn betting, the river is dealt; if that river is a heart or diamond, betting completes, then 1 card is burned and another board card is added. The process continues until a club or spade appears; once a black river appears, the extra-card process ends and showdown is evaluated."
	},
	"winthebutton": {
		"zhtw": "莊位爭奪賽改的是下一手按鈕歸屬。牌局本身照德州進行；每手結束後，贏得底池的選手同時取得下一手按鈕。分池時按鈕給位置最前的獲勝選手；同一位選手連續贏得底池時，按鈕留在該選手。",
		"en": "Win the Button changes who receives the next dealer button. The hand itself follows Hold'em; after each hand, the pot winner also receives the next button. In a split pot, the button goes to the winning player in earliest position; if the same player wins consecutive pots, the button stays with that player."
	},
	"shortdeck": {
		"zhtw": "短牌德州移除 2、3、4、5，只用 36 張牌。下注流程與德州相同，但高牌牌型排序改變：同花大於葫蘆，三條大於順子，也就是順子小於三條。A 可作最大牌，也可接 6-7-8-9 組成最小順子 A-6-7-8-9。攤牌時先套用下方短牌牌型順序，再比較同牌型內的點數與 kicker。",
		"en": "Short Deck Hold'em removes 2, 3, 4, and 5, leaving a 36-card deck. Betting follows Hold'em, but high-hand rankings change: a flush beats a full house, and three of a kind beats a straight. An ace can play high and can also make the lowest straight, A-6-7-8-9. At showdown, apply the Short Deck ranking below before comparing ranks and kickers within the same hand type."
	},
	"omahahigh": {
		"zhtw": "奧馬哈高牌的牌力比德州高很多，因為每位選手有更多手牌組合可以搭配公共牌。兩對、set、弱順子或弱同花在多人底池中不夠強。每一手有效牌型都必須剛好由 2 張手牌與 3 張公共牌組成。",
		"en": "Omaha High produces stronger hands than Hold'em because each player has many more hole-card combinations to pair with the board. Two pair, sets, weak straights, and weak flushes can be fragile in multi-way pots. At showdown, every valid hand is exactly 2 hole cards plus 3 board cards."
	},
	"omahahilo": {
		"zhtw": "Omaha Hi-Lo 的低牌半池採 8 or better：五張低牌都必須是 8 以下，且不能配對。A 可作低牌，最好的低牌是 A-2-3-4-5。高牌與低牌可以用不同組合，所以同一位選手可以用一組牌拿高、另一組牌拿低；若沒有合格低牌，高牌獲得整個底池。",
		"en": "Omaha Hi-Lo uses an 8-or-better low qualifier: all five low cards must be 8 or lower and unpaired. Aces play low, so the best low is A-2-3-4-5. High and low can use different card combinations, allowing one player to win both halves. If no low qualifies, the high hand wins the entire pot."
	},
	"bigo": {
		"zhtw": "Big O 是五張手牌的 Omaha 高低，牌力與聽牌會比四張 Omaha 更誇張。因為手牌多一張，選手更常同時有高牌潛力與低牌潛力；但組牌限制仍然是剛好兩張手牌，不能因為手牌多就任意取用三張或四張。",
		"en": "Big O is 5-card Omaha Hi-Lo, so hand strength and draws become even larger than in 4-card Omaha. With one extra hole card, players have more high and low combinations, but the construction rule remains exactly 2 hole cards. The extra card does not allow using three or four hole cards."
	},
	"courchevelhilo": {
		"zhtw": "Courchevel 的特色是翻前先亮出第一張公共牌，因此所有選手在第一輪下注前就知道一部分牌面。這會讓起手牌選擇更依賴那張已知公共牌：能和它形成堅果聽牌、低牌潛力或強高牌結構的手牌價值上升。補成翻牌後，仍照 Omaha 高低規則判定。",
		"en": "Courchevel exposes the first board card before preflop action, so every player knows part of the board before the first betting round. Starting hands that connect with that exposed card through nut draws, low potential, or strong high structure gain value. After the flop is completed, evaluation still follows Omaha Hi-Lo rules."
	},
	"crymeariveromaha": {
		"zhtw": "Cry Me A River Omaha 改成三個牌面同時進行，並保留 Omaha 的 2+3 組牌限制。翻牌開上、中、下三組牌面，轉牌與河牌各為三組牌面各發 1 張；河牌點數最低的牌面移出遊戲。剩餘牌面各自用剛好 2 張手牌與該牌面 3 張公共牌判定。",
		"en": "Cry Me A River Omaha plays three boards at once while keeping Omaha's 2+3 construction rule. Top, middle, and bottom flops are dealt, then each board receives a turn and river; the board with the lowest river rank is killed. Each remaining board is evaluated with exactly 2 hole cards and 3 cards from that board."
	},
	"doubleboardholdem": {
		"zhtw": "雙牌面玩法最重要的是分開判定。雙贏家版本中，每個牌面各爭半池；同一位選手可以贏上面牌面、輸下面牌面。多人 all-in 時先列主池與邊池，再對每個邊池分別看兩個牌面。",
		"en": "Double-board games must be evaluated board by board. In the double-winner version, each board plays for half the pot. The same player can win one board and lose the other. With multiple all-ins, build main and side pots first, then evaluate both boards for each pot to avoid payout errors."
	},
	"doubleboardomaha": {
		"zhtw": "雙牌面 Omaha 比雙牌面德州更容易誤判，因為每個牌面都要單獨套用 Omaha 的 2+3 規則。選手不能用上面牌面的兩張公共牌加下面牌面的一張公共牌混合組牌；每次判定都只能取同一個牌面中的三張公共牌。",
		"en": "Double-board Omaha is easier to misread than double-board Hold'em because the Omaha 2+3 rule applies separately to each board. Players cannot mix two board cards from the top board with one from the bottom board. Each evaluation must use three cards from the same board."
	},
	"doubleboardbombomaha": {
		"zhtw": "Double Board Bomb Pot Omaha 在翻牌前由固定前注形成底池。每位選手拿 Omaha 手牌後，不再進行翻前下注，直接開上、下兩組翻牌並開始下注；轉牌與河牌各為兩組牌面各發 1 張。攤牌時每個牌面都必須用剛好 2 張手牌與該牌面 3 張公共牌。",
		"en": "Double Board Bomb Pot Omaha forms the pot from fixed antes before the flop. After Omaha hole cards are dealt, there is no additional preflop betting; top and bottom flops are revealed and betting begins. Turn and river each add 1 card to both boards, and every showdown hand uses exactly 2 hole cards and 3 cards from one board."
	},
	"lazyriversomaha": {
		"zhtw": "Lazy Rivers Omaha 改的是河牌來源。翻前、翻牌與轉牌照 Omaha 進行；轉牌下注結束後，每位仍在牌局中的選手各拿 1 張明面私人河牌。攤牌時仍套用 Omaha 組牌限制，從手牌中剛好取 2 張，並從 4 張公共牌加自己的私人河牌中剛好取 3 張。",
		"en": "Lazy Rivers Omaha changes where the river comes from. Preflop, flop, and turn follow Omaha; after turn betting, each active player receives one individual face-up private river. Showdown still follows Omaha construction: exactly 2 hole cards plus exactly 3 cards from the 4 shared board cards and that player's own private river."
	},
	"pineapple": {
		"zhtw": "大菠蘿每位選手翻前拿 3 張手牌。翻前下注結束後、翻牌發出前，仍在牌局中的選手必須棄 1 張；所有人棄牌完成後才發翻牌。未在翻牌前棄牌會成為死手。",
		"en": "Pineapple gives each player 3 hole cards preflop. After preflop betting and before the flop, each active player must discard 1 card; the flop is dealt only after all discards are complete. Failure to discard before the flop results in a dead hand."
	},
	"superholdem": {
		"zhtw": "Super Hold'em 和大菠蘿最大差別是不用棄牌。選手保留三張手牌到攤牌，且可使用 0 到 3 張手牌，所以強牌密度會比德州高。它不是 Omaha：沒有剛好兩張手牌的限制，這點在判定三條、葫蘆、同花與順子時尤其要注意。",
		"en": "Super Hold'em differs from Pineapple because no card is discarded. Players keep all 3 hole cards to showdown and can use 0 to 3 of them, so hand strength runs higher than in Hold'em. It is not Omaha: there is no exactly-2-hole-card requirement, which matters for trips, full houses, flushes, and straights."
	},
	"acetofive": {
		"zhtw": "A-5 低牌把 A 視為最低牌，而且順子與同花不會讓牌變差。因此 5-4-3-2-A 是最強低牌，也常被稱為 wheel。比較低牌時先看最高張，最高張相同再往下一張比；例如 7-5-4-3-2 贏 7-6-5-4-A，因為第二高張 5 小於 6。",
		"en": "A-5 lowball treats aces as low, and straights or flushes do not hurt the hand. That makes 5-4-3-2-A the best low, called the wheel. Compare lows from the highest card downward; for example, 7-5-4-3-2 beats 7-6-5-4-A because the second-highest card, 5, is lower than 6."
	},
	"deucetoseven": {
		"zhtw": "2-7 低牌和 A-5 幾乎相反：A 是高牌，順子和同花都會讓牌變差。最好的牌是不同花色的 7-5-4-3-2。不要把 A-2-3-4-5 當成好低牌；在 2-7 中它既有 A 高，又是一副順子，牌力很差。",
		"en": "2-7 lowball is almost the opposite of A-5: aces are high, and straights and flushes hurt. The best hand is 7-5-4-3-2 with no flush. A-2-3-4-5 is ace-high and also a straight, making it very weak."
	},
	"badugi": {
		"zhtw": "Badugi 的目標不是五張牌，而是最多四張不同花色、不同點數的低牌。四張 Badugi 一定贏三張 Badugi，三張贏兩張；同樣張數時才比較最高張往下。若手牌中有配對或同花色，只能保留其中一張進入有效 Badugi 組合。",
		"en": "Badugi is not a five-card hand game. The goal is a low hand of up to four cards with all different suits and ranks. Any 4-card Badugi beats any 3-card Badugi, which beats any 2-card hand; only hands of the same length compare high card downward. Paired ranks or duplicate suits force one card out of the valid Badugi."
	},
	"badacey": {
		"zhtw": "Badacey 同時判定 Badugi 與 A-5 低牌，所以一手牌可以只拿半池，也可以通吃。好的起手牌同時有低點數、不同花色、不同點數這些特徵。換牌時要想清楚自己是在追 Badugi 半池、A-5 半池，還是有機會兩邊一起改善。",
		"en": "Badacey evaluates both Badugi and A-5 lowball, so a hand can win only half or scoop both halves. Good starting hands combine low ranks, different suits, and unpaired ranks. During draws, decide whether you are improving for the Badugi half, the A-5 half, or both at once."
	},
	"badeucey": {
		"zhtw": "Badeucey 把 Badugi 與 2-7 低牌放在同一手。因為 2-7 中 A 是高牌，A 在這個遊戲裡不像 Badacey 那麼有價值。最佳方向是低而不成順、不成同花，同時保留不同花色與不同點數來爭 Badugi 半池。",
		"en": "Badeucey combines Badugi with 2-7 lowball. Because aces are high in 2-7, aces are less valuable here than in Badacey. The ideal direction is low without making a straight or flush, while also preserving different suits and ranks for the Badugi half."
	},
	"fivecarddraw": {
		"zhtw": "5-Card Draw High 沒有公共牌。每位選手先拿 5 張暗牌，第一輪下注後可棄掉 0 到 5 張並補回同樣張數；換牌後進行最後一輪下注。攤牌時只看手中 5 張牌，最高高牌牌型勝。",
		"en": "5-Card Draw High has no community cards. Each player receives 5 down cards, then after the first betting round can discard 0 to 5 cards and draw the same number of replacements; a final betting round follows. Showdown uses only the 5 cards in hand, and the highest poker hand wins."
	},
	"archie": {
		"zhtw": "Archie 是高低分池抽牌遊戲，而且高牌與低牌都有合格門檻。高牌半池需要至少一對 6；低牌半池採 A-5 low 並需要 8 or better。只有一邊合格時，該邊贏得整個底池；兩邊都沒人合格時，由攤牌者平分。",
		"en": "Archie is a split-pot draw game with qualifiers on both sides. The high half requires at least a pair of 6s; the low half uses A-5 low with an 8-or-better qualifier. If only one side qualifies, that side wins the entire pot; if neither side qualifies, the players who tabled cards split the pot."
	},
	"drawmaha": {
		"zhtw": "Drawmaha 2-7 把 Omaha 高牌與 2-7 抽牌低牌放進同一手。手牌同時用來組 Omaha 半池，也作為抽牌半池的 5 張手牌；抽牌半池採 2-7 lowball，A 是高牌，順子與同花會讓牌變差。Omaha 半池仍要剛好 2 張手牌與 3 張公共牌。",
		"en": "Drawmaha 2-7 combines Omaha high with a 2-7 draw-low half. The same hand both supplies the Omaha half and serves as the 5-card draw hand; the draw half uses 2-7 lowball, where aces are high and straights or flushes hurt. The Omaha half still requires exactly 2 hole cards and 3 board cards."
	},
	"svitenspecial": {
		"zhtw": "Sviten Special 同時看抽牌手牌與 Omaha 牌面。每位選手拿 5 張手牌並有公共牌面，換牌後攤牌；抽牌半池看手中的 5 張牌，Omaha 半池要剛好用 2 張手牌與 3 張公共牌。同一手牌可拿其中一半，也可同時贏兩半。",
		"en": "Sviten Special evaluates both the draw hand and the Omaha board hand. Each player receives 5 hole cards with a community board, draws, then reaches showdown; the draw half uses the 5-card hand, while the Omaha half uses exactly 2 hole cards and 3 board cards. One hand can win either half or both halves."
	},
	"sevencardstud": {
		"zhtw": "七張梭哈高牌沒有公共牌，所以每位選手的明牌就是主要資訊。第三街每位選手拿兩張暗牌與一張明牌；那張明牌稱為門牌，最低門牌必須付 bring-in，也可直接補足成該輪完整下注。第四街之後，每輪新發 1 張明牌，第七街發暗牌；下注由目前明牌能組成最高牌面的選手先行動。目前明牌牌面只看桌上的明牌，例如第四街看兩張明牌、第五街看三張明牌、第六與第七街看四張明牌。",
		"en": "7-Card Stud High has no community board, so exposed upcards are the main public information. On third street, each player receives two downcards and one upcard; that upcard is the door card, and the lowest door card must post the bring-in or complete to a full bet. From fourth street onward, each street deals one new upcard until seventh street, which is dealt down; betting starts with the strongest hand that can be made from the currently exposed upcards. Exposed board means only the face-up cards on the table: two upcards on fourth street, three on fifth, and four on sixth and seventh."
	},
	"sevencardstudhilo": {
		"zhtw": "Stud Hi-Lo 會把底池分成高牌與低牌兩半。8/b 版本的低牌採 8 or better，且低牌不看順子同花；同一位選手可以用一組五張牌爭高，用另一組五張牌爭低。若所有人都沒有合格低牌，最高牌型拿走整個底池。",
		"en": "Stud Hi-Lo splits the pot into high and low halves. The 8/b version uses an 8-or-better qualifier and ignores straights and flushes for low. One player can use one five-card hand for high and a different five-card hand for low. If nobody qualifies for low, the high hand wins the full pot."
	},
	"sevencardstudhiloregular": {
		"zhtw": "七張梭哈高低 Regular 與 8/b 的差別在低牌資格。Regular 低牌沒有 8 or better 門檻，最低五張牌可爭低牌半池；高牌半池仍由最高五張高牌取得。同一位選手可用不同五張牌分別爭高牌與低牌。",
		"en": "7-Card Stud Hi-Lo Regular differs from 8/b through the low qualifier. Regular has no 8-or-better requirement, so the lowest five-card hand can compete for the low half; the high half still goes to the best five-card high hand. One player can use different five-card hands for high and low."
	},
	"razz": {
		"zhtw": "Razz 是 Stud 的 A-5 低牌版本，目標是做出最低五張牌。第三街每位選手拿兩張暗牌與一張明牌，最高門牌付 bring-in；同點數時用花色打破平手，花色由低到高為梅花、方塊、紅心、黑桃。第四街之後由目前明牌能組成最低低牌牌面的選手先行動。A 是低牌，順子與同花不影響牌力，所以 wheel 是最強牌。",
		"en": "Razz is the A-5 lowball version of Stud, aiming for the lowest five-card hand. On third street, each player receives two downcards and one upcard, and the highest door card posts the bring-in; ties in rank are broken by suit, from clubs, diamonds, hearts, to spades. From fourth street onward, betting starts with the lowest lowball hand that can be made from the currently exposed upcards. Aces are low, and straights or flushes do not hurt, so the wheel is best."
	},
	"razzdugi": {
		"zhtw": "Razzdugi 把 Razz 低牌與 Badugi 放在同一手分池。Razz 半池採 A-5 低牌，A 是低牌且順子同花不影響；Badugi 半池看最多四張不同花色、不同點數的低牌。明牌會同時影響兩邊的讀牌與下注強度。",
		"en": "Razzdugi splits between Razz low and Badugi. The Razz half uses A-5 low, where aces are low and straights or flushes do not hurt; the Badugi half uses up to four low cards with different suits and ranks. Exposed cards affect hand reading and betting strength for both halves."
	},
	"razzdugideuce": {
		"zhtw": "Razzdugi（2-7）把低牌半池改成 2-7 邏輯。A 是高牌，順子與同花會讓低牌變差；Badugi 半池仍看不同花色與不同點數。這個版本不能用 Razz 的 A-5 low 方式判定 2-7 半池。",
		"en": "Razzdugi (2-7) changes the lowball half to 2-7 logic. Aces are high, and straights or flushes hurt; the Badugi half still uses different suits and ranks. The 2-7 half is not evaluated with Razz's A-5 low rules."
	},
	"superstud": {
		"zhtw": "Super Stud Variations 以梭哈發牌為基礎，變化點在起手手牌數、棄牌節奏或攤牌判定方向。沒有公共牌；每位選手只使用自己的暗牌與明牌組牌。攤牌類型由該項目決定，可為高牌、高低分池、Razz 低牌或 Badugi 混合。",
		"en": "Super Stud Variations use Stud dealing as the base and vary the starting-card count, discard rhythm, or showdown direction. There are no community cards; each player uses only that player's own downcards and upcards. Evaluation depends on whether the specific event is high, Hi-Lo, Razz low, or mixed with Badugi."
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
		html=html+handbookrankblock()
	}
	return html
}

function handbookrankblock(){
	let html=`
		<div class="mt-4 rounded-2xl bg-zinc-950/70 p-4">
			<div class="text-sm font-extrabold text-cyan-300">${handbooktext("ranktitle")}</div>
			<div class="mt-3 space-y-2">
				${handbookrankcontent()}
			</div>
		</div>
	`
	return html
}

function handbookrankcontent(){
	let list=HANDBOOKHIGHRANKLIST
	if(handbookcurrentid=="shortdeck"){
		list=HANDBOOKSHORTDECKRANKLIST
	}
	let html=""
	for(let i=0;i<list.length;i=i+1){
		let item=list[i]
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
	if(LANGUAGE=="en"){
		return game["esummary"]+" "+game["edeal"]+" "+game["ewinner"]
	}
	return game["zsummary"]+" "+game["zdeal"]+" "+game["zwinner"]
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
	if(game["id"]=="shortdeck"){
		html=html+handbookrankblock()
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
			const DETAILED=document.getElementById("handbookdetail")
			if(DETAILED&&window.matchMedia("(max-width: 1023px)").matches){
				DETAILED.scrollIntoView({ "behavior": "smooth","block": "start" })
			}
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
