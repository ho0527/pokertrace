let tdacurrentlang=weblsget(WEBLSNAME+"tdaruleslanguage")||"zhtw"
let tdacurrentsection=weblsget(WEBLSNAME+"tdarulessection")||"all"
let tdacompareitemlist=tdaloadcompareitemlist()

const TDAPDF={
	"zhtw": "tdazhtw.pdf",
	"en": "tdaen.pdf"
}

const TDAUILIST={
	"zhtw": {
		"title": "TDA規則手冊",
		"eyebrow": "Tools",
		"description": "2024 Poker TDA 規則、推薦程序與附錄範例互動查詢。中文規則取自 PDF，並可展開英文原文對照。",
		"back": "回上一頁",
		"searchlabel": "搜尋規則",
		"searchplaceholder": "搜尋中文、English、規則編號或關鍵字",
		"compare": "顯示英文對照",
		"countsuffix": " 筆內容",
		"empty": "找不到符合的內容",
		"all": "全部",
		"pdftitle": "PDF 原檔",
		"pdfnote": "需要完整排版與原始頁面時，請下載 PDF。",
		"download": "下載 PDF",
		"opennewtab": "開啟 PDF",
		"zhtw": "中文",
		"en": "English",
		"comparetitle": "英文原文對照",
		"compareitem": "顯示英文對照",
		"hidecompareitem": "隱藏英文對照",
		"top": "回到頁首"
	},
	"en": {
		"title": "TDA Rulebook",
		"eyebrow": "Tools",
		"description": "Interactive 2024 Poker TDA rules, recommended procedures, and illustration addendum. Search and compare each item with the Chinese PDF text.",
		"back": "Back",
		"searchlabel": "Search rules",
		"searchplaceholder": "Search Chinese, English, rule number, or keywords",
		"compare": "Show Chinese comparison",
		"countsuffix": " items",
		"empty": "No matching items",
		"all": "All",
		"pdftitle": "PDF Source",
		"pdfnote": "Download the PDF when you need the complete source layout.",
		"download": "Download PDF",
		"opennewtab": "Open PDF",
		"zhtw": "中文",
		"en": "English",
		"comparetitle": "Chinese PDF comparison",
		"compareitem": "Show Chinese comparison",
		"hidecompareitem": "Hide Chinese comparison",
		"top": "Back to top"
	}
}

const TDABUTTONCLASS="min-h-10 rounded-lg px-4 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
const TDABUTTONACTIVE=" bg-emerald-500 text-white hover:bg-emerald-400"
const TDABUTTONNORMAL=" bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
const TDASIDEBUTTONCLASS="block w-full rounded-lg px-3 py-3 text-left text-sm font-bold leading-5 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
const TDASIDEACTIVE=" bg-zinc-800 text-white"
const TDASIDENORMAL=" text-zinc-400 hover:bg-zinc-800/80 hover:text-white"

const TDAITEMLIST=[
	{
		"group": "rules",
		"key": "rule1",
		"number": "1",
		"sectionkey": "General Concepts",
		"sectionzh": "一般概念",
		"sectionen": "General Concepts",
		"titlezh": "裁判(floor)決策",
		"titleen": "Floor Decisions",
		"bodyzh": "比賽的最佳利益和公平是決策的首要考慮因素。在特殊情況下，出於公平考慮的常識性決策有時優先於技術規\n則。裁判具有場上決策最終決定權。",
		"bodyen": "The best interest of the game and fairness are top priorities in decision-making. Unusual circumstances\noccasionally dictate that common-sense decisions in the interest of fairness take priority over technical\nrules. Floor decisions are final."
	},
	{
		"group": "rules",
		"key": "rule2",
		"number": "2",
		"sectionkey": "General Concepts",
		"sectionzh": "一般概念",
		"sectionen": "General Concepts",
		"titlezh": "玩家職責",
		"titleen": "Player Responsibilities",
		"bodyzh": "玩家應核實註冊資料和座位分配，在實質行動(SA(参見§(規則符號，下同)36))之前確認自己拿到了正確數量\n的牌，保護好自己的手牌，明確自己的意圖，注意行動，使用正確的術語和手勢依序行動，捍衛自己的行動權利，\n保持手牌可見且籌碼正確堆放，在有活牌時留在牌桌(table)上，攤牌時正確攤開所有手牌，如果發現錯誤應立即\n提出、及時動作，於必要時要求計時(call time(見§29))、快速轉移桌子、遵守一人一手牌原則、了解並遵守規則、保\n持良好禮儀，如果看到或經歷歧視性或冒犯性行為，請告知場方，並共同維護秩序良好、讓所有玩家都感到受歡\n迎的賽事環境。",
		"bodyen": "Players should verify registration data and seat assignments, verify they’re dealt the correct number of\ncards before SA occurs, protect their hands, make their intentions clear, follow the action, act in turn with\nproper terminology and gestures, defend their right to act, keep cards visible and chips correctly stacked,\nremain at the table with a live hand, table all cards properly when competing at showdown, speak up if\nthey see a mistake, play in a timely manner, call for a clock when warranted, transfer tables promptly,\nfollow one player to a hand, know and comply with the rules, practice proper etiquette, inform the house if\nthey see or experience discriminatory or offensive behavior, and generally contribute to an orderly event\nwhere all players feel welcome."
	},
	{
		"group": "rules",
		"key": "rule3",
		"number": "3",
		"sectionkey": "General Concepts",
		"sectionzh": "一般概念",
		"sectionen": "General Concepts",
		"titlezh": "官方術語和手勢",
		"titleen": "Official Terminology and Gestures",
		"bodyzh": "官方下注術語是簡單、明確且歷史悠久的表述，例如下注(bet)、加注(raise)、跟注(call)、棄牌(fold)、過牌\n(check)、全押(all in)、完成(complete)和底池(pot)(僅限底池限注(pot-limit only))。地區性術語也可能\n符合此標準。此外，玩家在面對行動時必須謹慎使用手勢；敲擊桌面表示過牌。玩家有責任明確表達自己的意圖:\n使用非標準術語或手勢的風險由玩家自行承擔，並可能導致與玩家意圖不同的裁決。另請參閱§2和§42。",
		"bodyen": "Official betting terms are simple, unmistakable, time-honored declarations like bet, raise, call, fold, check,\nall-in, complete, and pot (pot-limit only). Regional terms may also meet this test. Also, players must use\ngestures with caution when facing action; tapping the table is a check. It is the responsibility of players to\nmake their intentions clear: using non-standard terms or gestures is at player’s risk and may result in a\nruling other than what the player intended. See also Rules 2 and 42."
	},
	{
		"group": "rules",
		"key": "rule4",
		"number": "4",
		"sectionkey": "General Concepts",
		"sectionzh": "一般概念",
		"sectionen": "General Concepts",
		"titlezh": "選手身分",
		"titleen": "Player Identity",
		"bodyzh": "選手必須隨時保持清晰可辨的身份。錦標賽工作人員有權要求選手取下任何妨礙識別或乾擾其他參賽者視線的\n物品(例如太陽眼鏡、頭巾或其他臉部遮蓋物)。",
		"bodyen": "Players must be clearly identifiable at all times. Tournament staff may request a player to remove\nany item (sunglasses, hood, or other facial covering) which inhibits their identification or is a\ndistraction to other participants."
	},
	{
		"group": "rules",
		"key": "rule5",
		"number": "5",
		"sectionkey": "General Concepts",
		"sectionzh": "一般概念",
		"sectionen": "General Concepts",
		"titlezh": "電子設備和通信",
		"titleen": "Electronic Devices and Communication",
		"bodyzh": "A、玩家不得在牌桌上使用手機通話。鈴聲、音樂、圖片、影片等應保持安靜，不打擾其他人。上述及其他設備、工\n具、攝影、拍照和通訊方式均不得造成滋擾、延誤遊戲或創造競爭優勢，並須遵守場地和遊戲規則。\nB、手機和其他設備不得放在桌上。\nC、持牌選手不得接觸或操作電子或通訊設備。此類設備的定義可能包含新技術，並應由賽事總監(TD)進行更\n新。\nD:禁止在牌桌上使用下注應用程式、圖表和其他撲克策略工具。玩家也不得接收或使用其他個人或來源的撲克\n策略資料。違反§5的行為可能受到§71的處罰。",
		"bodyen": "A: Players may not talk on a phone at the table. Ring tones, music, images, video etc. should be\ninaudible and non-disturbing to others. These and other devices, tools, photography, videography, and\ncommunication must not create a nuisance, delay the game or create competitive advantage and are\nsubject to house and gaming regulations.\nB. Phones and other devices may not rest on the table.\nC: Players with live hands may not interact with or operate an electronic or communication\ndevice. The definition of such devices may include new technologies and shall be as updated by\nthe TD.\nD: Betting apps, charts, and other poker strategy tools may not be used at the table. Nor may players\nreceive or use poker strategy data from another person or source. Violations of Rule 5 may be\nsubject to penalties in Rule 71."
	},
	{
		"group": "rules",
		"key": "rule6",
		"number": "6",
		"sectionkey": "General Concepts",
		"sectionzh": "一般概念",
		"sectionen": "General Concepts",
		"titlezh": "官方語言",
		"titleen": "Official Language",
		"bodyzh": "桌上應清楚地張貼並宣布可接受的語言。",
		"bodyen": "The house will clearly post and announce acceptable language(s) at the table."
	},
	{
		"group": "rules",
		"key": "rule7",
		"number": "7",
		"sectionkey": "Seating, Breaking and Balancing Tables",
		"sectionzh": "安排座位、拆桌和平衡牌桌",
		"sectionen": "Seating, Breaking and Balancing Tables",
		"titlezh": "隨機正確座位",
		"titleen": "Random Correct Seating",
		"bodyzh": "錦標賽與衛星賽的座位將以隨機方式分配。若玩家起始時坐錯座位但籌碼量正確，則必須帶著其全部籌碼移到\n正確的座位上。",
		"bodyen": "Tournament and satellite seats will be randomly assigned. A player starting in a wrong seat with a correct\nchip stack will move to the correct seat with their current total chip stack."
	},
	{
		"group": "rules",
		"key": "rule8",
		"number": "8",
		"sectionkey": "Seating, Breaking and Balancing Tables",
		"sectionzh": "安排座位、拆桌和平衡牌桌",
		"sectionen": "Seating, Breaking and Balancing Tables",
		"titlezh": "替補、延遲註冊和重新入場",
		"titleen": "Alternates, Late Registration, and Re-Entries",
		"bodyzh": "A:替補玩家、遲到註冊的玩家以及重新入場(re-entry)的玩家將獲得完整起始籌碼。他們將按照與新玩家相同的流\n程，從相同的座位池中隨機抽取座位和牌桌，除了小盲位(small blind，SB)和按鈕位(button，BTN)之間的\n座位之外，其他座位都將獲得發牌。\nB:在重新入場賽事中，如果允許玩家放棄籌碼並購買新的籌碼，則放棄的籌碼將被移除。",
		"bodyen": "A: Alternates, players registering late, and re-entries will be sold full stacks. They will randomly draw a\nseat and table by the same process and from the same seat pool then in place for new players and are\ndealt in except between the small blind and button.\nB: In re-entry events, if a player is permitted to forfeit chips and buy a new stack, the forfeited chips will be\nremoved from play."
	},
	{
		"group": "rules",
		"key": "rule9",
		"number": "9",
		"sectionkey": "Seating, Breaking and Balancing Tables",
		"sectionzh": "安排座位、拆桌和平衡牌桌",
		"sectionen": "Seating, Breaking and Balancing Tables",
		"titlezh": "特殊需求",
		"titleen": "Special Needs",
		"bodyzh": "將盡可能為有特殊需求的玩家提供便利。",
		"bodyen": "Accommodations for players with special needs will be made when possible."
	},
	{
		"group": "rules",
		"key": "rule10",
		"number": "10",
		"sectionkey": "Seating, Breaking and Balancing Tables",
		"sectionzh": "安排座位、拆桌和平衡牌桌",
		"sectionen": "Seating, Breaking and Balancing Tables",
		"titlezh": "新玩家和來自拆牌桌的玩家",
		"titleen": "New Players and Players from Broken Tables",
		"bodyzh": "A:進入錦標賽的新玩家和來自拆桌(broken table)的玩家可以獲得任何座位，包括小盲、大盲(big blind，\nBB)或按鈕位，並且除了小盲和按鈕位之間的座位外，都可以獲得發牌。\nB:拆桌的玩家將透過兩步驟隨機程式獲得新的桌位和座位。參見附錄說明。",
		"bodyen": "A: New players entering the tournament and players from broken tables can get any seat including the\nsmall or big blind or the button and be dealt in except between the SB and button.\nB: Players from a broken table will be assigned new tables and seats by a 2-step random process. See\nIllustration Addendum."
	},
	{
		"group": "rules",
		"key": "rule11",
		"number": "11",
		"sectionkey": "Seating, Breaking and Balancing Tables",
		"sectionzh": "安排座位、拆桌和平衡牌桌",
		"sectionen": "Seating, Breaking and Balancing Tables",
		"titlezh": "平衡牌桌和暫停遊戲",
		"titleen": "Balancing Tables and Halting Play",
		"bodyzh": "A:在翻牌類或混合遊戲中進行平衡牌桌時，下一手該當大盲的玩家會移到最差的位置(worst position)，獨立大盲\n(single big blind)也包含在內，即使該玩家連續擔任兩次大盲也一樣。最差的位置永遠不會是小盲位。若是七張\n牌(Stud)遊戲，玩家依座位順序移動(較短桌(short table)最後一個空位為應補位置)。\nB:在混合遊戲(例如HORSE)中，當遊戲從德州撲克切換到梭哈時，於最後一手德州撲克結束後，BTN會移到\n下一手若仍為德州撲克時應在的位置，並在進行Stud時固定不動。此時被移動的玩家為若該手仍為德州撲\n克時應當擔任大盲的玩家。當遊戲再切回德州撲克時，按鈕位會從原先凍結的位置重新開始。\nC:從哪一桌先移出玩家，依事先設定的程序決定。\nD:當某桌因淘汰而比最多玩家的桌少了三名以上玩家，且盲注受到影響時，該桌遊戲將暫停(詳見附錄)。其\n他形式的遊戲(例如6人桌或快速賽)是否暫停，則由賽事總監(TD)自行決定。TD亦可選擇不暫停遊戲，此舉\n不視為誤發牌(misdeal)。隨著賽事進行，TD應讓各桌人數更趨平均。",
		"bodyen": "A: To balance in flop and mixed-games, the player to be big blind next moves to the worst position,\nincluding single big blind if available, even if that means the seat is big blind twice. Worst position is never\nthe small blind. In stud-only, players move by position (last seat open at the short table is the seat filled).\nB: In mixed games (ex: HORSE), when the game shifts from hold’em to stud, after the last hold’em hand\nthe button moves to the position it would be if the next hand was hold’em and is frozen there during stud.\nThe player moved in stud is the player who would be big blind if the game were hold’em for that hand.\nShifting to hold'em the button starts where it was frozen.\nC: The table from which a player is moved will be specified by a predetermined procedure.\nD: Play will halt on tables 3 or more players short (by elimination) than the table with the most players\nonce the blinds are impacted (See Illustration Addendum). Play halts on other formats (ex: 6-hand and\nturbos) at TDs discretion. TDs may waive halting play and waiver is not a misdeal. As the event\nprogresses, at TD’s discretion tables should be more tightly balanced."
	},
	{
		"group": "rules",
		"key": "rule12",
		"number": "12",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "宣告、攤牌時口頭宣布手牌",
		"titleen": "Declarations. Cards Speak at Showdown",
		"bodyzh": "以實際牌面決定勝負。攤牌時口頭宣布牌力(同:手牌價值、牌力、hand value)時不具約束力，但故意報錯手牌\n可能將會受到處罰。攤牌時發牌員(dealer)應判斷及宣告手牌價值。無論是否在牌局中的任何玩家，如果認為\n在發牌員讀牌、計算或分配底池時出現錯誤時，都應馬上提出異議。",
		"bodyen": "Cards speak to determine the winner. Verbal declarations of hand value are not binding at showdown but\ndeliberately miscalling a hand may be penalized. Dealers should read and announce hand values at\nshowdown. Any player, in the hand or not, should speak up if they think a mistake is made in reading\nhands or calculating and awarding the pot."
	},
	{
		"group": "rules",
		"key": "rule13",
		"number": "13",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "攤牌並殺死獲勝牌",
		"titleen": "Tabling Cards and Killing Winning Hand",
		"bodyzh": "A:正確的出牌方式是:\n1)將所有牌面朝上放在桌面上\n2)讓發牌員和所有玩家能夠清楚地判斷牌局。(「所有牌」指的是德州撲克牌中的兩張底牌、奧馬哈撲克\n中的四張底牌、七人梭哈撲克中的七張牌等等。)\nB:攤牌時，玩家必須保護自己的手牌，等待讀牌(另見§65)。如果玩家沒有完全亮出所有牌，然後以為自己贏\n了就棄牌(muck)，則風險自負。如果一手牌無法100%檢索和識別，且TD認定並未被清楚展示，則玩家無權獲得底\n池。TD對牌局是否已充分亮出的決定有最終決定權。\nC:發牌員不能取消明顯是贏家的正確牌。",
		"bodyen": "A: Proper tabling is both 1) turning all cards face up on the table and 2) allowing the dealer and players to\nread the hand clearly. “All cards” means both hole cards in hold’em, all 4 hole cards in Omaha, all 7 cards\nin 7-stud, etc.\nB: At showdown players must protect their hands while waiting for cards to be read (See also Rule 65).\nPlayers who don’t fully table all cards, then muck thinking they’ve won, do so at their own risk. If a hand is\nnot 100% retrievable and identifiable and the TD rules it was not clearly read, the player has no claim to\nthe pot. The TDs decision on whether a hand was sufficiently tabled is final.\nC: Dealers cannot kill a properly tabled hand that was obviously the winner."
	},
	{
		"group": "rules",
		"key": "rule14",
		"number": "14",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "攤牌時棄牌",
		"titleen": "Live Cards at Showdown",
		"bodyzh": "棄掉牌面朝下未攤開的牌不會自動將其消滅(kill)；玩家可以改變主意，回收那些100%可識別、可回收的牌。\n發牌員將牌推至棄牌堆時，牌將會被消滅。被消滅的牌將無法被回收。",
		"bodyen": "Discarding non-tabled cards face down does not automatically kill them; players may change their minds\nand table cards that remain 100% identifiable and retrievable. Cards are killed by the dealer when pushed\ninto the muck or otherwise rendered irretrievable and unidentifiable."
	},
	{
		"group": "rules",
		"key": "rule15",
		"number": "15",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "攤牌和棄牌違規",
		"titleen": "Showdown and Discarding Irregularities",
		"bodyzh": "A:如果玩家亮出一張可以組成贏牌的牌，發牌員應建議該玩家亮出所有牌。如果玩家拒絕亮出，則應呼叫裁判。\nB:如果玩家下注後棄牌，並認為自己贏了(忘記還有另一位玩家在牌局中)，發牌員應保留該牌並呼叫裁\n判(§58情況除外)。如果該牌被棄牌且無法100%確定地取回和識別，則該玩家出局失去攤牌資格，且無權取\n回已跟注的籌碼。但若該玩家的下注或加注尚未被他人跟注，則未被跟注的部分籌碼將會退還給玩家。",
		"bodyen": "A: If a player tables one card that would make a winning hand, the dealer should advise the player to\ntable all cards. If the player refuses, the floor should be called.\nB: If a player bets then discards thinking they have won (forgetting another player is still in the hand), the\ndealer should hold the cards and call the floor (a Rule 58 exception). If cards are mucked and not\nretrievable and identifiable to 100% certainty, the player is out and not entitled to a refund of called bets. If\ncards are mucked and the player initiated a bet or raise not yet called, the uncalled amount will be\nreturned."
	},
	{
		"group": "rules",
		"key": "rule16",
		"number": "16",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "當全下(all-in)時秀牌(show card、face up)",
		"titleen": "Face Up for All-Ins",
		"bodyzh": "一旦有玩家全下，且牌局中所有其他玩家的下注操作均已完成，所有有參與手牌的玩家將立即亮牌。全下或已\n跟注所有下注操作的玩家不得棄牌。主池和邊池中的所有牌局都必須亮出且有效。參見附錄說明。",
		"bodyen": "All hands will be tabled without delay once a player is all-in and all betting action by all other players in\nthe hand is complete. No player who is either all-in or has called all betting action may muck their hand\nwithout tabling. All hands in both the main and side pot(s) must be tabled and are live. See Illustration\nAddendum."
	},
	{
		"group": "rules",
		"key": "rule17",
		"number": "17",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "非全下(non all-in)攤牌和攤牌順序",
		"titleen": "Non All-In Showdowns and Showdown Order",
		"bodyzh": "A:在非全下攤牌時，如果沒有主動亮牌或棄牌，TD可以強制執行亮牌順序。最後一輪(final betting\nround)(或最後一條街(final street))的最後一名下注或加注玩家必須先亮牌。如果沒有最後一輪下注，\n則最後一輪中第一個行動的玩家必須先亮牌(例如，撲克中按鈕位左側第一個座位的玩家、梭哈遊戲中亮牌的\n高牌、Razz遊戲中低手的玩家等等)。\nB:非全下攤牌時，除一名玩家外其他玩家均棄牌且未亮牌，則為無爭議攤牌。最後一位持有活牌的玩家獲勝，\n並得無需亮牌。",
		"bodyen": "A: In a non all-in showdown, if cards are not spontaneously tabled or discarded, the TD may enforce an\norder of show. The last aggressive player on the final betting round (final street) must table first. If there\nwas no final round bet, the player who would act first in a final betting round must table first (i.e. first seat\nleft of the button in flop games, high hand showing in stud, low hand in razz, etc.).\nB: A non all-in showdown is uncontested if all but one player mucks face down without tabling. The last\nplayer with live cards wins and is not required to table the cards."
	},
	{
		"group": "rules",
		"key": "rule18",
		"number": "18",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "請求看牌",
		"titleen": "Asking to See a Hand",
		"bodyzh": "A:攤牌時不再持有牌的玩家，或已將牌面朝下棄牌而未攤牌的玩家，將失去要求查看任何牌的權利或特權。\nB:如果河牌圈有人下注，任何跟注者都有不可剝奪的權利，要求最後一位進攻者亮出其牌面(「跟注者付錢看\n牌(the hand they paid to see)」)，前提是該跟注者亮出或保留其牌。TD有權酌情處理所有其他請求，\n例如要求查看另一位跟注者的手牌或在河牌圈沒有下注的情況下。參見附錄說明[2013年通過]。",
		"bodyen": "A: Players not still in possession of cards at showdown, or who have mucked their cards face down\nwithout tabling, lose any rights or privileges to ask to see any hand.\nB: If there was a river bet, any caller has an inalienable right to have the last aggressor’s hand tabled\non request (“the hand they paid to see”) provided the caller tabled or retains his or her cards. TDs\ndiscretion governs all other requests such as to see the hand of another caller, or if there was no river\nbet. See Illustration Addendum [adopted 2013]."
	},
	{
		"group": "rules",
		"key": "rule19",
		"number": "19",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "攤牌時以公共牌成牌(Play the Board)",
		"titleen": "Playing the Board at Showdown",
		"bodyzh": "以公共牌成牌，玩家仍必須亮出所有底牌才能獲得部分底池(請參閱§13-A)。",
		"bodyen": "To play the board, players must table all hole cards to get part of the pot (See Rule 13-A)."
	},
	{
		"group": "rules",
		"key": "rule20",
		"number": "20",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "獲取奇數籌碼",
		"titleen": "Awarding Odd Chips",
		"bodyzh": "首先，奇數籌碼將被拆分成遊戲中最小的面值。\nA)撲克中，如果玩家持有兩手或兩手以上高牌或低牌:奇數籌碼將分配給按鈕左側第一個座位\nB)梭哈、Razz、stud/8中，如果玩家持有兩手或兩手以上高牌或低牌:奇數籌碼將分配給玩家五張牌\n獲勝牌中花色最高的牌。\nC)高低分牌:底池中的奇數籌碼將分配給高牌。",
		"bodyen": "First, odd chips will be broken into the smallest denomination in play. A) Board games with 2 or more high\nor low hands: the odd chip goes to the first seat left of the button. B) Stud, razz, and if 2 or more high or\nlow hands in stud/8: the odd chip goes to the high card by suit in the player’s 5-card winning hand. C) H/L\nsplit: the odd chip in the total pot goes to the high side."
	},
	{
		"group": "rules",
		"key": "rule21",
		"number": "21",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "邊池(side pot)",
		"titleen": "Side Pots",
		"bodyzh": "每個邊池將單獨分割。",
		"bodyen": "Each side pot will be split separately."
	},
	{
		"group": "rules",
		"key": "rule22",
		"number": "22",
		"sectionkey": "Pots / Showdown",
		"sectionzh": "底池 / 攤牌",
		"sectionen": "Pots / Showdown",
		"titlezh": "有爭議的牌局和底池",
		"titleen": "Disputed Hands and Pots",
		"bodyzh": "對已攤牌的讀牌結果，可在下一手牌開始前提出異議(參見§23)。底池計算和給予過程中出現的計算錯誤\n可在下一手牌出現SA前提出異議。如果一手牌在中場休息期間結束，則任何異議權將在判給底池後1分\n鐘終止。",
		"bodyen": "The reading of a tabled hand may be disputed until the next hand begins (see Rule 23). Accounting errors\nin calculating and awarding the pot may be disputed until substantial action occurs on the next hand. If a\nhand finishes during a break, the right to any dispute ends 1 minute after the pot is awarded.\n`"
	},
	{
		"group": "rules",
		"key": "rule23",
		"number": "23",
		"sectionkey": "General Procedures",
		"sectionzh": "一般程序",
		"sectionen": "General Procedures",
		"titlezh": "新牌局和新限制",
		"titleen": "New Hand and New Limits",
		"bodyzh": "新等級在場地宣布或計時系統發出音訊訊號時開始。新等級適用於下一手牌。牌局在第一次洗牌、按下洗牌\n按鈕或發牌員發牌時開始。如果牌局錯誤的從上一級別開始，則在發生SA後，該手牌將繼續在上一級別繼續\n(§36)。如果在發牌員發牌期間新等級開始，則接任發牌員將按上一級別發一手牌。",
		"bodyen": "A new level starts on announcement by the floor or audio signal by the clocking system. The new\nlevel applies to the next hand. Hands begin on the first riffle, push of the shuffler button, or on the dealer\npush. If a hand starts at the prior level by mistake, the hand will continue at the prior level after substantial\naction occurs (Rule 36). If a new level starts during the dealer push, the incoming dealer will deal\none hand at the prior level."
	},
	{
		"group": "rules",
		"key": "rule24",
		"number": "24",
		"sectionkey": "General Procedures",
		"sectionzh": "一般程序",
		"sectionen": "General Procedures",
		"titlezh": "籌碼競猜，指定籌碼升級(color up)",
		"titleen": "Chip Race, Scheduled Color Ups",
		"bodyzh": "A:指定顏色升級時，籌碼將從1號位開始競猜，每位玩家最多可獲得一枚籌碼。玩家不會被淘汰出局:在競猜\n中輸掉最後一枚籌碼的玩家將獲得一枚仍在遊戲中的最低面值籌碼。\nB:玩家必須完全看到他們的籌碼，並鼓勵他們觀看籌碼競賽。\nC:如果比賽結束後，玩家仍有已移除面額的籌碼，則只能以等值金額兌換為當前面值。如果已移除面值的籌碼\n總和未達到遊戲中最小面值的籌碼，則將被移除，且不予補償。",
		"bodyen": "A: At scheduled color-ups, chips will be raced off starting in seat 1, with a maximum of one chip awarded\nto a player. Players can’t be raced out of play: a player losing their last chip(s) in a race will get 1 chip of\nthe lowest denomination still in play.\nB: Players must have their chips fully visible and are encouraged to witness the chip race.\nC: If after the race, a player still has chips of a removed denomination, they will be exchanged for current\ndenominations only at equal value. Chips of removed denominations that do not fully total at least the\nsmallest denomination still in play will be removed without compensation."
	},
	{
		"group": "rules",
		"key": "rule25",
		"number": "25",
		"sectionkey": "General Procedures",
		"sectionzh": "一般程序",
		"sectionen": "General Procedures",
		"titlezh": "牌和籌碼應保持可見、可數且易於管理、並酌情升級",
		"titleen": "Cards and Chips Kept Visible, Countable, and Manageable. Discretionary Color-Ups",
		"bodyzh": "A:所有玩家、發牌員和場地工作人員有權合理估計籌碼數量；因此，籌碼應保持可數。TDA建議將20張相同面\n值的籌碼整齊地垂直堆疊，作為標準。面值較大的籌碼必須始終可見且易於識別。如果場地工作人員一個\n人無法透過看一眼籌碼堆就快速估計其價值，玩家可能也無法做到。\nB:TD控制遊戲中籌碼的數量和面額，並可隨時自行決定更換一名或多名玩家的籌碼。自行決定更換籌碼時，\n應公告於場上玩家。\nC:玩家必須隨時將手中的牌放在清晰可見的地方。",
		"bodyen": "A: Players, dealers, and the floor are entitled to a reasonable estimation of chip counts; thus, chips should\nbe kept in countable stacks. The TDA recommends clean vertical stacks of 20 same denomination chips\neach as a standard. Higher denomination chips must be visible and identifiable at all times. If a floor\nperson can’t look at a chip stack and quickly estimate its value, players likely can’t either.\nB: TDs control the number and denominations of chips in play and may color up one or more players at\ntheir discretion at any time. Discretionary color ups are to be announced.\nC: Players must keep live hands in plain view at all times."
	},
	{
		"group": "rules",
		"key": "rule26",
		"number": "26",
		"sectionkey": "General Procedures",
		"sectionzh": "一般程序",
		"sectionen": "General Procedures",
		"titlezh": "換牌",
		"titleen": "Deck Changes",
		"bodyzh": "換牌將在更換發牌員、點數變化或場方規定時進行。玩家本身不得要求換牌。",
		"bodyen": "Deck changes will be on the dealer push or level changes or as prescribed by the house. Players may not\nask for deck changes."
	},
	{
		"group": "rules",
		"key": "rule27",
		"number": "27",
		"sectionkey": "General Procedures",
		"sectionzh": "一般程序",
		"sectionen": "General Procedures",
		"titlezh": "重新買入(rebuy)",
		"titleen": "Re-buys",
		"bodyzh": "玩家不會錯過任何一手牌。在牌局開始前聲明重新買入的玩家，視為以背後籌碼(chips behind)進行遊戲且\n必須重新買入。",
		"bodyen": "Players may not miss a hand. Players declaring intent to rebuy before a hand are playing chips behind\nand must make the re-buy."
	},
	{
		"group": "rules",
		"key": "rule28",
		"number": "28",
		"sectionkey": "General Procedures",
		"sectionzh": "一般程序",
		"sectionen": "General Procedures",
		"titlezh": "追兔(Rabbit Hunting)",
		"titleen": "Rabbit Hunting",
		"bodyzh": "不允許玩追兔(即在牌局結束後揭示若未結束時會發出的牌)。",
		"bodyen": "Rabbit hunting (revealing cards that would have come if the hand had not ended) is not allowed."
	},
	{
		"group": "rules",
		"key": "rule29",
		"number": "29",
		"sectionkey": "General Procedures",
		"sectionzh": "一般程序",
		"sectionen": "General Procedures",
		"titlezh": "呼叫計時(call time/clock)",
		"titleen": "Calling for a Clock",
		"bodyzh": "玩家應及時行動，以保持合理的遊戲節奏。如果TD認為已過合理時間，他們可以主動或批准任何玩家的計時\n請求。玩家必須在座位上才能呼叫計時(§30)。計時鐘上的玩家最多有25秒時間，外加5秒倒數來行動。如\n果玩家面臨下注且時間耗盡，則該手牌自動蓋牌；如果沒有下注，則該手牌自動過牌。如果動作時間五五開(tie)\n則做出有利於玩家的判決。賽事總監可以調整允許時間並採取其他措施以適應遊戲並防止持續拖延。另請參閱§2和§\n70。",
		"bodyen": "Players should act in a timely manner to maintain a reasonable pace of the game. If in TD’s judgement\nreasonable time has passed, they may call the clock or approve a clock request by any player in the\nevent. Players must be at their seats to call for a clock (Rule 30). A player on the clock has up to 25\nseconds plus a 5 second countdown to act. If the player faces a bet and time expires, the hand is dead; if\nnot facing a bet, the hand is checked. A tie goes to the player. TDs may adjust the time allowed and take\nother steps to fit the game and stop persistent delays. See also Rules 2 and 70."
	},
	{
		"group": "rules",
		"key": "rule30",
		"number": "30",
		"sectionkey": "Player Present / Eligible for Hand",
		"sectionzh": "玩家在場 / 有資格出牌",
		"sectionen": "Player Present / Eligible for Hand",
		"titlezh": "在座位上(At Your Seat)、活手(Live Hands)",
		"titleen": "At Your Seat and Live Hands",
		"bodyzh": "要擁有一手活牌，玩家必須在發完第一輪發牌後，坐在自己的座位上。不在座位上的玩家不得查看自己的牌，因為\n這些牌會被立即銷毀。他們所發的盲注和前注將被沒收至底池，並且如缺席的玩家將收到梭哈強制注牌(bring-\nin card)，該牌將用於起始強制注(bring-in)。「在座位上」是指在您可觸及的範圍內。此規則並非旨在鼓勵\n玩家在牌局中離開座位。",
		"bodyen": "To have a live hand, players must be at their seats when the last card is dealt to all players on the initial\ndeal. Players not then at their seats may not look at their cards which are killed immediately. Their posted\nblinds and antes forfeit to the pot and an absent player dealt the stud bring-in card posts the bring-in. “At\nyour seat” means in reach of your chair. This rule is not intended to encourage players to be out of their\nseats while in a hand."
	},
	{
		"group": "rules",
		"key": "rule31",
		"number": "31",
		"sectionkey": "Player Present / Eligible for Hand",
		"sectionzh": "玩家在場 / 有資格出牌",
		"sectionen": "Player Present / Eligible for Hand",
		"titlezh": "留在牌桌上等待行動",
		"titleen": "At the Table with Action Pending",
		"bodyzh": "持有有效牌局的玩家(包括全押或已完成下注的玩家)必須留在牌桌上，直至所有下注回合結束，直至\n攤牌。離開牌桌不符合保護牌局和遵守行動的原則，將受到處罰。",
		"bodyen": "Players with live hands (including players all-in or otherwise finished betting) must remain at the table for\nall betting rounds and showdown. Leaving the table is incompatible with protecting your hand and\nfollowing the action and is subject to penalty."
	},
	{
		"group": "rules",
		"key": "rule32",
		"number": "32",
		"sectionkey": "Button / Blinds",
		"sectionzh": "按鈕 / 盲注",
		"sectionen": "Button / Blinds",
		"titlezh": "死按鈕(Dead Button)",
		"titleen": "Dead Button",
		"bodyzh": "在錦標賽中將使用死按鈕。",
		"bodyen": "Tournament play will use a dead button."
	},
	{
		"group": "rules",
		"key": "rule33",
		"number": "33",
		"sectionkey": "Button / Blinds",
		"sectionzh": "按鈕 / 盲注",
		"sectionen": "Button / Blinds",
		"titlezh": "躲避盲注",
		"titleen": "Dodging Blinds",
		"bodyzh": "故意躲避盲注的玩家將被處罰。參見§71-B。",
		"bodyen": "Players who intentionally dodge any blind will incur a penalty. See Rule 71-B."
	},
	{
		"group": "rules",
		"key": "rule34",
		"number": "34",
		"sectionkey": "Button / Blinds",
		"sectionzh": "按鈕 / 盲注",
		"sectionen": "Button / Blinds",
		"titlezh": "按鈕位置和移動",
		"titleen": "Button Placement and Movement",
		"bodyzh": "A:如果在SA發生之前發現錯誤的按鈕移動，則會修正錯誤。但是，如果SA後發生了非正常錯誤，遊戲將繼續進\n行。例如:如果按鈕移動兩次，並且發生了SA，則錯誤成立，按鈕在下一局牌中不會被移回。所有玩家都有責任\n監督按鈕的放置，並在發現錯誤時及時報告(§2)。\nB:單挑局中，小盲注玩家是按鈕玩家，會拿到最後一張牌，並在翻牌前第一個行動，並在所有其他下注輪中最後\n一個行動。單挑局開始時，按鈕玩家可能需要調整，以確保沒有玩家連續兩次拿到大盲注。",
		"bodyen": "A: If incorrect button movement is discovered before SA occurs, the error will be corrected.\nHowever, if SA has occurred, play will continue. Ex: If the button is moved twice and SA occurs\nthe error will stand, the button will not be backed-up on the next hand. All players have a\nresponsibility to monitor button placement and speak up if they see a mistake (Rule 2)\nB: Heads-up, the small blind is the button, is dealt the last card, and acts first pre-flop and last on all\nother betting rounds. Starting heads-up play, the button may need to be adjusted to ensure no player has\nthe big blind twice in a row."
	},
	{
		"group": "rules",
		"key": "rule35",
		"number": "35",
		"sectionkey": "Dealing Rules",
		"sectionzh": "發牌規則",
		"sectionen": "Dealing Rules",
		"titlezh": "發牌錯誤(misdeal)和污損牌組(fouled decks)",
		"titleen": "Misdeals and Fouled Decks",
		"bodyzh": "A:發牌錯誤包括但不限於:\n1)初始發牌時出現兩張或以上的牌面朝上錯置牌\n2)第一張牌發至錯誤玩家\n3)將牌發給了沒有資格拿牌的玩家\n4)漏發牌給具有拿牌資格的玩家\n5)任何玩家拿到的牌數錯誤(§37除外)\n6)在SA發生前，發現不符合該遊戲類型的非標準牌(例如:出現鬼牌或短牌遊戲出現2-3-4-5)\n7)在翻牌類型遊戲(Flop game)中，若發出的前兩張牌中有一張被發牌員失誤翻開，或任何其他兩張底牌被翻開。\n換牌遊戲(如Lowball)則依據場館規則處理。\nB:玩家可能會在按鈕位置上拿到兩張連續的牌(§37)。\nC:如果發牌錯誤，重新發牌與原先發牌完全相同(exact re-play):按鈕不動，沒有新玩家入座，盲注不變。牌\n會發給之前原本就可以得牌但發牌時不在座位上的玩家。他們可以進行重新發牌(§30)。正在受罰(penalty)\n且原局有參與的玩家，重發時仍會被發牌，隨後其手牌會被判定無效(killed)。對於受罰玩家而言，原發牌\n與重發牌合計僅視為一手牌，而非兩手。\nD:一旦發生SA(§36)，則無法宣告發牌錯誤。該局必須繼續進行，除非發現汙損牌組。在重大動作後發現\n的非標準牌將被視為廢牌(Scraps of paper)，惟在汙損牌組之情況除外。\nE:污損牌組(Fouled decks)。若發現兩張或更多花色與點數完全相同的牌，則視為污損牌組。其他汙損條\n件依可能由當地規範或場館規範而定。如果發現弄髒的牌組，無論SA如何，遊戲都將停止，所有下注將被\n原路退回。當一局牌結束後依照§22以污損牌組提出的異議權利終止。",
		"bodyen": "A: Misdeals include but are not necessarily limited to: 1) 2 or more boxed cards on the initial deal; 2) first\ncard dealt to the wrong seat; 3) cards dealt to a seat not entitled to a hand; 4) a seat entitled to a hand is\ndealt out; 5) the wrong number of cards is dealt to any player (except Rule 37); 6) Before SA, a non-\nstandard card for the game type is found (example: jokers, 2-3-4-5 in short deck); 7) In flop games, if 1 of\nthe first 2 cards dealt off the deck or any other 2 downcards are exposed by dealer error. House rules\napply for draw games (ex: lowball).\nB: Players may be dealt 2 consecutive cards on the button (see also Rule 37).\nC: In misdeals, the re-deal is an exact re-play: the button doesn’t move, no new players are seated, limits\nstay the same. Cards are dealt to players who were dealt-in but not at their seats for the original deal\nand they can play the re-deal (Rule 30). Players on penalty who were originally dealt-in will receive\ncards then their hands are killed. The original deal and re-deal count as 1 hand for a player on penalty,\nnot 2.\nD: Once substantial action occurs (see Rule 36) a misdeal cannot be declared; the hand must proceed\nunless the deck is fouled. Non-standard cards found after SA are treated as scraps of paper (exception:\nfouled decks).\nE: Fouled decks.If 2 or more cards of the same suit and rank are found, the deck is fouled. Other fouled\ndeck conditions may be defined by local gaming regulations and house policy. If a fouled deck is\ndiscovered, regardless of SA, play will stop and all bets will be returned. Once a hand concludes, the right\nto dispute based on a fouled deck ends according to Rule 22."
	},
	{
		"group": "rules",
		"key": "rule36",
		"number": "36",
		"sectionkey": "Dealing Rules",
		"sectionzh": "發牌規則",
		"sectionen": "Dealing Rules",
		"titlezh": "實質行動(substantial action，SA)",
		"titleen": "Substantial Action (SA)",
		"bodyzh": "實質行動是指下列其中一種\nA)依序進行任意2個行動，其中至少一個將籌碼放入底池(即除2次過牌或2次棄牌之外的任意2個行動)\nB)依次進行任意3個行動的組合(過牌、下注、加注、跟注、棄牌)。\n下盲注不計入SA。參見§35-D和§53-B。",
		"bodyen": "Substantial Action is either A) any 2 actions in turn, at least one of which puts chips in the pot (i.e. any 2\nactions except 2 checks or 2 folds) or B) any combination of 3 actions in turn (check, bet, raise, call, fold).\nPosted blinds do not count towards SA. See Rules 35-D and 53-B."
	},
	{
		"group": "rules",
		"key": "rule37",
		"number": "37",
		"sectionkey": "Dealing Rules",
		"sectionzh": "發牌規則",
		"sectionen": "Dealing Rules",
		"titlezh": "按鈕牌太少",
		"titleen": "Button with Too Few Cards",
		"bodyzh": "按鈕玩家發牌過少，應立即宣布。如果遊戲類型允許，即便經過大量行動，按鈕玩家仍可補發缺少的牌。\n但是，如果按鈕玩家在牌局進行中(透過過牌或下注)才宣告發牌過少，則按鈕玩家的牌局無效。",
		"bodyen": "A player on the button dealt too few cards should announce it immediately. Missing button cards may be\nreplaced even after substantial action if permitted for the game type. However, if the button acts on a\nhand with too few cards (by check or bet), the button’s hand is dead."
	},
	{
		"group": "rules",
		"key": "rule38",
		"number": "38",
		"sectionkey": "Dealing Rules",
		"sectionzh": "發牌規則",
		"sectionen": "Dealing Rules",
		"titlezh": "實質行動後的燒牌(burn card)",
		"titleen": "Burns After Substantial Action",
		"bodyzh": "燒牌的作用是為了保護剩餘牌堆(protect the stub)，而非「維持發牌順序」(preserve card order)。\n若已發生SA，且有玩家因手牌數量錯誤導致該手牌被判定無效(Killed)，則該無效手牌的所有卡片均須放入\n廢牌(Muck)。後續發牌則依據隨機性原則處理(詳見§RP-14隨機性原則)。剩餘牌堆視為一般牌堆處理；在後\n續的每一輪中，有且僅有一張牌須從剩餘牌堆中燒掉，絕對不會多於一張。\n另請參見附錄。",
		"bodyen": "The burn card is to protect the stub, not “preserve card order”. If SA occurs and a hand is killed due to the\nwrong number of cards, all cards of the killed hand are mucked and randomness applies to further\ndealing (See also RP-14 Randomness). The stub is treated as a normal stub and one and only one card\nis burned off the stub for each subsequent street. The burn is always one card per street, never more.\nSee Illustration Addendum."
	},
	{
		"group": "rules",
		"key": "rule39",
		"number": "39",
		"sectionkey": "Dealing Rules",
		"sectionzh": "發牌規則",
		"sectionen": "Dealing Rules",
		"titlezh": "不正規翻牌(irregular flops)和提前發牌(premature-dealt cards)",
		"titleen": "Irregular Flops and Premature-Dealt Cards",
		"bodyzh": "A:如果翻牌發出了4張而非3張，無論牌面是否翻開也無論是否能推測哪張是第一張牌，皆須請Floor到\n場。發牌員將這4張牌面朝下打亂，由Floor隨機抽選1張作為下一輪的燒牌，其餘3張則作為正式翻牌\n(詳見§RP-14隨機性原則)。\nB:如果發出3張翻牌前漏了燒牌，無論牌面是否翻開也無論是否能推測哪張是第一張牌，如果沒有行動，發牌員將這3張牌面朝下打亂，隨機抽出1張作為該輪的燒牌。翻牌則由剩下的2張牌加上牌堆的下一張牌組成。如果\n已有任何行動(即使只有一次過牌)，則遊戲繼續使用最初的三張牌，後續的轉牌仍維持只燒一張牌。\nC:提前發出的牌，請參閱§RP-5。\nD:局中重洗牌(reshuffling)。為了維護遊戲公平性，在牌局進行過程中，任何需要重新洗牌的牌堆都必須面\n朝下且未顯示的進行。例如，過早發牌(§39、§RP-5)、亂序牌堆(§RP-4)、額外抽牌或梭哈(§RP-10-H)等。",
		"bodyen": "A: 4-Card Flops. If the flop has 4 rather than 3 cards, exposed or not, and regardless of whether the door\ncard is presumed known, the floor will be called. The dealer then scrambles the 4 cards face down, the\nfloor randomly selects 1 as the next burn card and the other 3 are the flop (See also RP-14\nRandomness).\nB: If there was no burn on a 3-card flop, exposed or not and regardless of whether the door card is\npresumed known, if no action has occurred, the 3 cards are scrambled face down, one chosen as the\nburn. The flop will be the other 2 cards plus the next card off the stub. If any action (even one check) has\noccurred, play proceeds with the initial 3 cards. Only one card is burned for the turn.\nC: For prematurely dealt cards, see Recommended Procedure 5.\nD: Reshuffling During a Hand. To protect game integrity, anytime the stub must be re-shuffled during the\nplay of a hand, the cards must be shuffled face-down and unexposed. Examples include premature cards\n(Rule 39 and RP-5), disordered stub (RP-4), extra draw or stud cards (RP-10-H), etc."
	},
	{
		"group": "rules",
		"key": "rule40",
		"number": "40",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "下注方式:口頭聲明和籌碼",
		"titleen": "Methods of Betting: Verbal and Chips",
		"bodyzh": "A:下注方式為口頭聲明和(/或)推出籌碼。如果玩家同時進行兩種方式，則以先做出的方式為準。如果兩動\n作同時進行，則以清晰合理的口頭聲明為準，否則以籌碼為準。當情況不明或口頭聲明與籌碼聲明相矛盾的\n情況下，TD將根據具體情況和§1決定下注。參見附錄說明。另見§57。\nB:口頭聲明可以是一般性的(「跟注(call)」、「加注(raise)」)，也可以是僅聲明具體數額(「一千(one\nthousand)」)，或者兩者兼而有之(「加注，一千(raise, one thousand)」)。\nC:在所有下注規則中，僅聲明特定金額等同於安靜的推出相同金額。例如:聲明「二百」等於推出200籌碼。",
		"bodyen": "A: Bets are by verbal declaration and/or pushing out chips. If a player does both, whichever is first defines\nthe bet. If simultaneous, a clear and reasonable verbal declaration takes precedence, otherwise the chips\nplay. In unclear situations or where verbal and chips are contradictory, the TD will determine the bet\nbased on the circumstances and Rule 1. See Illustration Addendum. See also Rule 57.\nB: Verbal declarations may be general (“call”, “raise”), a specific amount only (“one thousand”) or both\n(“raise, one thousand”).\nC: For all betting rules, declaring a specific amount only is the same as silently pushing out an equal\namount. Ex: Declaring “two hundred” is the same as silently pushing out 200 in chips."
	},
	{
		"group": "rules",
		"key": "rule41",
		"number": "41",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "跟注方式",
		"titleen": "Methods of Calling",
		"bodyzh": "標準且可接受的跟注方式包括:\nA)口頭聲明「跟注(call)」。\nB)推出與跟注金額相等的籌碼。\nC)在不發言的情況下僅推出一枚超額籌碼(overchip)。\nD)在不發言的情況下推出多枚籌碼，且其總額依據多籌碼規則(§45)符合跟注定義。\n在不發言的情況下，投入與當前注碼相比比例極微小的籌碼(例如:盲注2000-4000。A下注50000，B隨後默默\n推出一個1000的籌碼)是不標準的，強烈不鼓勵，此行為可能受到懲罰，並將由TD全權裁定處理方式，包括可能\n被判定為完全跟注。",
		"bodyen": "Standard and acceptable forms of calling include: A) saying “call”; B) pushing out chips equal to a call; C)\nsilently pushing out an overchip; or D) silently pushing out multiple chips equal to a call under the multi-\nchip rule (Rule 45). Silently betting chip(s) relatively tiny to the bet (ex: blinds 2k-4k. A bets 50k, B then\nsilently puts out one 1k chip) is non-standard, strongly discouraged, subject to penalty, and will be\ninterpreted at TDs discretion, including being ruled a full call."
	},
	{
		"group": "rules",
		"key": "rule42",
		"number": "42",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "加注方法",
		"titleen": "Methods of Raising",
		"bodyzh": "在無限注或底池限注遊戲中，加注必須透過以下方式進行:\nA)一次推出全部籌碼。\nB)在推出籌碼之前口頭聲明全部籌碼並玩家有責任使意圖明確。\n註:2次加注(2-motion raises)於2019年取消。",
		"bodyen": "In no-limit or pot-limit, a raise must be made by A) pushing out the full amount in one motion or B) verbally\ndeclaring the full amount prior to pushing out chips. It is the responsibility of players to make their\nintentions clear. Note: 2-motion raises eliminated in 2019."
	},
	{
		"group": "rules",
		"key": "rule43",
		"number": "43",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "加注金額",
		"titleen": "Raise Amounts",
		"bodyzh": "A:加注金額必須至少等於目前下注輪次中之前最大的全額下注或加注金額。如果玩家加注金額大於或等於先前\n最大下注金額的50%，但低於最低加注金額，則必須進行全額最低加注。若低於50%，則視為跟注，除非玩家\n有先聲明「加注(raise)」或全押(all in)(§45-B)。\n口頭聲明金額或推出相同金額的籌碼為相同動作(§40-C)。例如:在無限注德州撲克(NLHE)中，開局下注\n1000，口頭聲明「一千四百」或默默的推出1400籌碼均視為跟注，除非有先聲明加注。參見附錄說明。\nB:在沒有其他明確聲明前，聲明的加注金額即為總下注金額。例如:A開注2000，B口頭聲明「加注，八千」。總\n下注金額為8000。",
		"bodyen": "A: A raise must be at least equal to the largest prior full bet or raise of the current betting round. A player\nwho raises 50% or more of the largest prior bet but less than a minimum raise must make a full minimum\nraise. If less than 50% it is a call unless “raise” is first declared or the player is all-in (Rule 45-B).\nDeclaring an amount or pushing out the same amount of chips is treated the same (Rule 40-C). Ex:\nNLHE, opening bet is 1000, verbally declaring “Fourteen hundred” or silently pushing out 1400 in chips\nare both calls unless raise is first declared. See Illustration Addendum.\nB: Without other clarifying information, declaring raise and an amount is the total bet. Ex: A opens for\n2000, B declares “Raise, eight thousand.” The total bet is 8000."
	},
	{
		"group": "rules",
		"key": "rule44",
		"number": "44",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "超額籌碼下注(Overchip)",
		"titleen": "Oversized Chip Betting (Overchips)",
		"bodyzh": "如果面對下注或盲注，在未事先聲明加注的情況下，推出一個超額籌碼(包括玩家的最後一枚籌碼)均視為跟注。\n如果意圖用超額籌碼加注，你必須在籌碼落地前口頭聲明加注。如果僅聲明加注但未說明金額，則加注金額為該\n籌碼允許的最大金額。如果無正在面對下注，當默默推出一個超額籌碼(未口頭聲明時)視為下注金額為該籌碼\n允許的最大金額。",
		"bodyen": "If facing a bet or blind, pushing out a single oversized chip (including your last chip) is a call if raise isn’t\nfirst declared. To raise with an overchip you must declare raise before the chip hits the table surface. If\nraise is declared but no amount is stated, the raise is the maximum allowable for the chip. If not facing a\nbet, pushing out an overchip silently (no declaration) is a bet of the maximum for the chip."
	},
	{
		"group": "rules",
		"key": "rule45",
		"number": "45",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "多籌碼下注",
		"titleen": "Multiple Chip Betting",
		"bodyzh": "A:當面對下注，除非先聲明加注或全押，否則多籌碼下注(包括用玩家最後的籌碼下注)，若所有丟出的籌碼都\n是跟注所必需的，則該多籌碼下注即為跟注。也就是說，若拿掉所有丟出的籌碼中的其中一張面額最小的籌碼\n後剩餘金額不足以支付跟注數額。也就是說，即使拿走最小籌碼之一，籌碼數也少於跟注金額。例1:玩家A開池\n400，B加注到1100(加注700)，C默默地拿出一個500和一個1000的籌碼。這被視為跟注，因為拿走500的籌碼後，\n籌碼數少於1100的跟注金額。例2:無限注德州撲克25-50。翻牌後A開池1050，B拿出他最後的籌碼(兩張1000的\n籌碼)。除非先聲明加注或全押，否則B跟注。\nB:如果不需要所有丟出的籌碼來跟注；即只拿走一個最小的籌碼，剩餘的籌碼數額大於或等於跟注數額:\n1)如果玩家還有籌碼，則按照§43中的50%標準下注。\n2)A玩家用最後籌碼下注，無論是否達到50%的門檻，都視為全押。參見附錄。",
		"bodyen": "A: If facing a bet, unless raise or all-in is declared first, a multiple-chip bet (including a bet of your last\nchips) is a call if every chip is needed to make the call; i.e. removal of just one of the smallest chips\nleaves less than the call amount. Ex-1: Player A opens for 400: B raises to 1100 total (a 700 raise), C\nputs out one 500 and one 1000 chip silently. This is a call because removing the 500 chip leaves less\nthan the 1100 call amount. Ex-2: NLHE 25-50. Post-flop A opens for 1050 and B puts out his last chips\n(two 1000’s). B calls unless raise or all-in was first declared.\nB: If every chip is not needed to make the call; i.e. removing just one of the smallest chips leaves the call\namount or more: 1) if the player has chips remaining, the 50% standard in Rule 43 governs the bet. 2) A\nbet of a player’s last chip(s) is an all-in bet whether reaching the 50% threshold or not. See Addendum."
	},
	{
		"group": "rules",
		"key": "rule46",
		"number": "46",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "先前的下注未拉回",
		"titleen": "Prior Bet Chips Not Pulled In",
		"bodyzh": "A:為了避免混淆，玩家手中尚未下注的籌碼如果面臨加注，應在將添加籌碼至先前的下注之前口頭說明他們的行動。\nB:如果面臨加注，明確撤回先前的下注籌碼將約束玩家僅能跟注或加注；他們不得將籌碼放回並棄牌。\nC:如果新籌碼被悄悄添加，且發牌員不清楚下注，則跟注和加注§41-§45適用如下:\n1)如果先前的籌碼不足以覆蓋跟注金額且被棄置或全部撤回，則超過的籌碼視為跟注，多個新籌碼需滿足50%\n的加注標準(§43)。\n2)如果先前的籌碼被部分撤回或先前的籌碼足以覆蓋跟注金額，則最終下注的籌碼總數達到50%的標準(§43\n和§45)，則為加注；如果少於50%，則為跟注。參見附錄說明。",
		"bodyen": "A: To avoid confusion, players with prior-bet chips not yet pulled in who face a raise should verbalize their\naction before adding chips to the prior bet.\nB: If facing a raise, clearly pulling back a prior bet chip binds a player to call or raise; they may not put the\nchip(s) back out and fold.\nC: If new chip(s) are added silently and the bet is unclear to the house, the call and raise rules 41-45\napply as follows: 1) If prior chips don’t cover the call AND are either left alone OR fully pulled back, an\noverchip is a call and multiple new chips are subject to the 50% raise standard (Rule 43). 2) If prior chips\nare partly pulled back OR if prior chip(s) cover the call, the combined final chip bet is a raise if reaching\nthe 50% standard (Rules 43 and 45), if less it is a call. See Illustration Addendum."
	},
	{
		"group": "rules",
		"key": "rule47",
		"number": "47",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "重新開始下注。",
		"titleen": "Re-Opening the Bet.",
		"bodyzh": "A:在無限注和底池限注遊戲中，如果全下(或累計多次短籌碼全下)總額少於全額下注或加注，則對於已經行動\n且在輪到他們行動時沒有面臨至少全額下注或加注的玩家，將不會重新開啟下注。若多次短籌碼全下重新開啟\n下注，則最低加注額始終為該輪最後一次有效全額下注或加注(另請參閱§43)。\nB:在限注遊戲中，已行動的玩家需要至少下注或加注金額的50%才能重新開始下注。參見附錄說明。",
		"bodyen": "A: In no-limit and pot limit, an all-in wager (or cumulative multiple short all-ins) totaling less than a full bet\nor raise will not reopen betting for players who have already acted and are not facing at least a full bet or\nraise when the action returns to them. If multiple short all-ins re-open the betting, the minimum raise is\nalways the last full valid bet or raise of the round (See also Rule 43).\nB: In limit, at least 50% of a full bet or raise is required to re-open betting for players who have already\nacted. See Illustration Addendum."
	},
	{
		"group": "rules",
		"key": "rule48",
		"number": "48",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "允許加注次數",
		"titleen": "Number of Allowable Raises",
		"bodyzh": "無限注和底池限注遊戲中，加注次數不設上限。在限注遊戲中，加注次數有上限；即使出現單挑\n(heads-up)局面此上限仍適用，直到整個賽事只剩兩名玩家為止，屆時改採場方規定。\n譯註:此處的「單挑(heads-up)」指錦標賽總人數仍多於兩人時、在單一牌桌上出現的單挑局面(例如:\n下注進行到河牌時僅剩兩人、翻牌時只有兩人入池、或僅大小盲對戰等)，而非指整個賽事只剩最後兩\n人的「實質決戰」。",
		"bodyen": "There is no cap on the number of raises in no-limit and pot-limit. In limit play, there is a limit to raises even\nwhen heads-up until the event is down to 2 players; the house limit applies."
	},
	{
		"group": "rules",
		"key": "rule49",
		"number": "49",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "接受行動(accepted action)",
		"titleen": "Accepted Action",
		"bodyzh": "撲克是一種需要保持警覺和持續觀察的遊戲。無論其他人如何說，跟注者都有責任在跟注前確定對手的正確下\n注金額。如果跟注者要求點數，但收到發牌員或玩家的錯誤訊息，然後推出該金額或聲明跟注，該跟注者仍視\n為接受了全部正確行動，並接受正確的下注或全押金額。與所有情況一樣，可能由TD酌情適用§1。另請參閱\nRP-12。",
		"bodyen": "Poker is a game of alert, continuous observation. It is the caller’s responsibility to determine the correct\namount of an opponent’s bet before calling, regardless of what is stated by others. If a caller requests a\ncount but receives incorrect information from a dealer or player, then pushes out that amount or declares\ncall, the caller has accepted the full correct action and is subject to the correct wager or all-in amount. As\nwith all situations, Rule 1 may apply at TD’s discretion. See also RP-12."
	},
	{
		"group": "rules",
		"key": "rule50",
		"number": "50",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "依序行動",
		"titleen": "Acting in Turn",
		"bodyzh": "A:玩家必須透過口頭和/或推出籌碼的方式按輪行動。依序行動具有約束力，並將留在底池中的籌碼投入底池。\nB:玩家必須等待明確的下注金額才能行動。例如:在NLHE中，A說「加注」(但沒有明確金額)，B迅速棄牌。\nB應該等到A的加注金額明確後再行動。",
		"bodyen": "A: Players must act in turn verbally and/or by pushing out chips. Action in turn is binding and commits\nchips to the pot that stay in the pot.\nB: Players must wait for clear bet amounts before acting. Ex: NLHE, A says “raise” (but no amount), and\nB quickly folds. B should wait to act until A’s raise amount is clear."
	},
	{
		"group": "rules",
		"key": "rule51",
		"number": "51",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "每輪中的約束性聲明/不足額跟注(undercall)",
		"titleen": "Binding Declarations / Undercalls in Turn",
		"bodyzh": "A: 一般的口頭聲明(例如「跟注」或「加注」)會要求選手接受目前的全部行動。\n參見[[TDAREF:ADD-51:附錄 §51]]\nB: 選手未先聲明「跟注」，而是聲明或推出少於跟注金額的籌碼，即為不足額跟注。\n如果選手依序行動且面對以下情況，則必須全額跟注:\n1) 任何單挑下注\n2) 多人底池中任一輪的開注\n其他情況下，賽事總監可自行決定。開注是每輪第一個下注籌碼(而非過牌)。在盲注遊戲中，大盲是翻牌前的開注。全下按鈕可減少不足額跟注的頻率(請參閱[[TDAREF:RP-1:§RP-1全下按鈕]])。此規則規定了選手何時必須全額跟注；依賽事總監裁量，選手可能必須放棄原本想做出的不足額跟注金額並棄牌(詳見[[TDAREF:ADD-51:補充說明]])。至於不足額下注與不足額加注，請見[[TDAREF:52:§52錯誤下注、不足額下注及不足額加注]]。\nC: 如果連續出現兩次或兩次以上不足額跟注，牌局會退回給第一個不足額跟注的選手，該選手必須依[[TDAREF:51-B:§51-B]]修正下注。賽事總監將根據具體情況決定如何處理其餘下注者的手牌。",
		"bodyen": "A: General verbal declarations in turn (such as “call” or “raise”) commit a player to the full current action.\nSee Illustration Addendum\nB: A player undercalls by declaring or pushing out less than the call amount without first declaring “call”.\nAn undercall is a mandatory full call if made in turn facing 1) any bet heads-up or 2) the opening bet on\nany round multi-way. In other situations, TD’s discretion applies. The opening bet is the first chip bet of\neach betting round (not a check). In blind games the posted BB is the pre-flop opener. All-in buttons\nreduce undercall frequency (See Recommended Procedure 1). This rule governs when players must\nmake a full call and when, at TDs discretion they may forfeit the amount of the intended undercall and fold\n(see Illustration Addendum). For underbets and underraises, see Rule 52.\nC: If two or more undercalls occur in sequence, play backs up to the first undercaller who must correct his\nor her bet per Rule 51-B. The TD will determine how to treat hands of the remaining bettors based on the\ncircumstances."
	},
	{
		"group": "rules",
		"key": "rule52",
		"number": "52",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "錯誤下注、不足額下注及不足額加注",
		"titleen": "Incorrect Bets, Underbets and Underraises",
		"bodyzh": "A:在限注和無限注遊戲中，如果加注或開池金額低於最低合法金額，則可在當前街的任何位置進行糾正(如果是\n在河牌圈，則可以至攤牌開始前的任何時間)。例如:NLHE 100-200，翻牌後A開池600，B加注到1000(加注\n不足200)。C和D跟注，E棄牌，然後錯誤被發現。在轉牌圈發牌前的任何時間，將所有下注者的總下注金額\n加到1200。轉牌圈發牌後，錯誤成立。有關跟注不足的情況，請參閱§51。\nB:在底池限注遊戲中，如果玩家基於不準確的底池金額而不足額下注，如果底池金額過高(非法下注)，則將當\n前街上所有玩家糾正；如果底池金額過低，則將糾正直至下注後出現的SA。參見附錄說明。",
		"bodyen": "A: In limit and no-limit, opening or raising less than the minimum legal amount is corrected anywhere on\nthe current street (if on the river any time before showdown starts). Ex: NLHE 100-200, post-flop A opens\nfor 600 and B raises to 1000 (a 200 underraise). C and D call, E folds then the error is noticed. Increase\nthe bet to 1200 total for all bettors any time before the turn is dealt. After the turn the error stands. For\nundercalls, see Rule 51.\nB: In pot limit, if a player underbets the pot based on an inaccurate count, if the pot count is too high (an\nillegal bet), it will be corrected for all players anywhere on the current street; if too low, corrected until\nsubstantial action occurs after the bet. See Illustration Addendum."
	},
	{
		"group": "rules",
		"key": "rule53",
		"number": "53",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "不依序行動(越位、out of turn，OOT)",
		"titleen": "Action Out of Turn (OOT)",
		"bodyzh": "A:任何不依序行動(過牌、跟注或加注) 都會依序回傳給正確的玩家。如果對越位玩家的行動沒有改變，則越位\n行動的玩家將受到懲罰，並且具有約束力。正確玩家的過牌、跟注或棄牌不會改變行動。若行動改變，則越位行\n動不具約束力，任何下注或加注都會回傳所有選項給越位玩家:包含跟注、加注或棄牌。越位棄牌具有約束力。\n參見附錄。\nB:因越位行動而被跳過的玩家必須捍衛其行動權。如果被跳過的玩家擁有合理的時間，並且在越位行動(§36)\n發生於該玩家之後未提出任何意見，則越位行動具有約束力。行動將撤回，floor將根據具體情況裁定如何\n處理被跳過的牌局，包括判定該牌局無效或限制玩家採取消極行動(non-aggressive action，即跟注、過\n牌或棄牌)。參見附錄。",
		"bodyen": "A: Any action out of turn (check, call, or raise) will be backed up to the correct player in order. The OOT\naction is subject to penalty and is binding if action to the OOT player does not change. A check, call or\nfold by the correct player does not change action. If action changes, the OOT action is not binding; any\nbet or raise is returned to the OOT player who has all options: call, raise, or fold. An OOT fold is binding.\nSee Illustration Addendum.\nB: Players skipped by OOT action must defend their right to act. If a skipped player had reasonable time\nand does not speak up before substantial action (Rule 36) OOT occurs after the player, the OOT action is\nbinding. Action backs up and the floor will rule on how to treat the skipped hand given the circumstances,\nincluding ruling the hand dead or limiting the player to non-aggressive action. See Addendum."
	},
	{
		"group": "rules",
		"key": "rule54",
		"number": "54",
		"sectionkey": "Bets and Raises",
		"sectionzh": "下注與加注",
		"sectionen": "Bets and Raises",
		"titlezh": "底池大小及底池限注",
		"titleen": "Pot Size and Pot-Limit Bets",
		"bodyzh": "A:只有在底池限注撲克中，玩家才有權利計算底池金額。在限注和無限注撲克中，發牌員不會計算底池\n金額。另請參閱§RP-22攤分底池\nB:翻牌前全押死盲注(dead blind)或短全押盲注(short all-in blind)不會影響底池計算。所有翻\n牌前底池下注和再下底池下注均假設已下滿盲注。例如在底池限注奧馬哈(PLO)，盲注100-200:\n 例1:小盲注死盲注，大盲注下注200。\n 例2:小盲注下注100，大盲注短盲注100。在這兩個例子中，第一個行動的玩家的底池限注均為\n700。\nC:翻牌後，下注基於實際底池大小。\nD:在無限注遊戲中，聲明「下注底池(bet the pot)」並非有效下注，但它要求玩家必須進行有效下\n注(至少是最低下注額)，否則可能受到處罰。面對下注的玩家必須有效加注。",
		"bodyen": "A: Players are entitled to a pot count in pot-limit only. Dealers will not count the pot in limit and no-limit.\nSee also RP-22 Spreading the Pot\nB: Pre-flop a dead or short all-in blind will not affect pot calculation. All pre-flop pot and re-pot bets will\nassume full blinds were posted. Ex 1: PLO, 100-200 blinds, dead SB, BB posts 200. Ex 2: SB posts\n100, BB short posts 100. In both examples the pot-limit bet for first player to act is 700.\nC: Post-flop, bets are based on actual pot size.\nD: Declaring “I bet the pot” is not a valid bet in no-limit but it does bind the player to making a valid bet (at\nleast a minimum bet) and may be subject to penalty. Players facing a bet must make a valid raise."
	},
	{
		"group": "rules",
		"key": "rule55",
		"number": "55",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "無效下注聲明",
		"titleen": "Invalid Bet Declarations",
		"bodyzh": "如果玩家無人下注，且:\nA)聲明「跟注」視為過牌\nB)聲明「加注」玩家必須至少下注最低金額。\n面對有人下注若玩家聲明「過牌」且可以跟注或棄牌但不能加注。",
		"bodyen": "If a player faces no bet and: A) declares “call”, it is a check; B) declares “raise”, the player must make at\nleast a minimum bet. A player declaring “check” when facing a bet may call or fold, but cannot raise."
	},
	{
		"group": "rules",
		"key": "rule56",
		"number": "56",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "連續下注(string bet)與加注",
		"titleen": "String Bets and Raises",
		"bodyzh": "不允許進行連續下注和加注。此類下注涉及多個動作，玩家先下注，然後返回籌碼堆，再添加更多籌碼。",
		"bodyen": "String bets and raises are not allowed. Such wagers involve multiple movements whereby a player\nputs out a bet then returns to their stack for more chips to add to the bet."
	},
	{
		"group": "rules",
		"key": "rule57",
		"number": "57",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "非標準及不明確下注",
		"titleen": "Non-Standard and Unclear Betting",
		"bodyzh": "玩家使用非官方下注術語和手勢需自行承擔風險。這些術語和手勢的含義可能與玩家的本意不同。另當宣告的\n下注在規則上可以有多種含義，則該下注將被視為不超過下注前底池大小*的最高合理金額。例如:在200-400的\nNLHE遊戲中，底池總金額小於5000，玩家聲明「我下注5(I bet five)」。在沒有其他說明時則下注金額為\n500；如果底池總金額為5000或以上，則下注金額為5000。*底池金額是所有先前下注的總和，包括玩家尚未\n收進底池的下注籌碼。參見§2、3、40和42。",
		"bodyen": "Players use unofficial betting terms and gestures at their own risk. These may be interpreted to mean\nother than what the player intended. Also, if a declared bet can legally have multiple meanings, it will be\nruled the highest reasonable amount that is less than or equal to the pot size* before the bet. Ex: NLHE\n200-400, the pot totals less than 5000, player declares “I bet five.” With no other clarifying information, the\nbet is 500; if the pot totals 5000 or more, the bet is 5000. *The pot is the total of all prior bets including\nany bets in front of a player not yet pulled in. See Rules 2, 3, 40 and 42."
	},
	{
		"group": "rules",
		"key": "rule58",
		"number": "58",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "非標準棄牌",
		"titleen": "Non-Standard Folds",
		"bodyzh": "在最後一輪下注結束前的任何時間，面對無人下注時棄牌(例如:面對過牌或翻牌後第一個行動)或非順位棄牌均\n視為強制棄牌並且受到處罰。另見§15-B。",
		"bodyen": "Any time before the end of the final betting round, folding in turn if there’s no bet to you (ex: facing a\ncheck or first to act post-flop) or folding out of turn are binding folds subject to penalty. See also 15-B."
	},
	{
		"group": "rules",
		"key": "rule59",
		"number": "59",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "條件(Conditional)和過早聲明(Premature Declarations)",
		"titleen": "Conditional and Premature Declarations",
		"bodyzh": "A:條件式的聲明未來行動並非標準做法並強烈建議不要使用。TD可自行決定是否對這些陳述進行約束或\n處罰。例如:「如果你下注，我就加注」之類的「如果-那麼(if-than)」陳述。\nB:如果玩家A宣布「下注」或「加注」，且B在得知A的確切下注金額之前跟注，則TD將根據情況做出最佳\n裁定包括可能要求B跟注任何金額。",
		"bodyen": "A: Conditional statements of future action are non-standard and strongly discouraged. At TDs discretion\nthey may be binding and/or penalized. Example: “if – then” statements such as \"If you bet, I will raise.”\nB: If Player A declares “bet” or “raise” and B calls before A’s exact bet amount is known, the TD will rule\nthe bet as best fits the situation including possibly obliging B to call any amount."
	},
	{
		"group": "rules",
		"key": "rule60",
		"number": "60",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "對手籌碼量",
		"titleen": "Count of Opponent’s Chip Stack",
		"bodyzh": "玩家、發牌員和現場人員有權合理估計對手的籌碼量(§25)。\n玩家只有在面對全下且輪到自己行動時，才可以要求精確的計數。全下玩家無需自行計數；如有玩家要求，發\n牌員或裁判會進行計數。適用於接受行動(§49)。可見且可計數的籌碼堆(§25)可大幅提高計數的準確性。",
		"bodyen": "Players, dealers, and the floor are entitled to a reasonable estimation of opponents’ chip stacks (Rule 25).\nA player may request a more precise count only if facing an all-in bet and it is his or her turn to act. The\nall-in player is not required to count; on request the dealer or floor will count it. Accepted action applies\n(Rule 49). Visible and countable chip stacks (Rule 25) greatly improve counting accuracy."
	},
	{
		"group": "rules",
		"key": "rule61",
		"number": "61",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "過度下注(overbet)並期待找零",
		"titleen": "Over-Betting Expecting Change",
		"bodyzh": "下注不應用來找零。超過預期下注金額可能會讓桌上所有人感到困惑。所有默默下注的籌碼都有可能被計入下\n注金額。例如:玩家A面對開注金額為325時他默默下注了525(一個500和一個25)，預期獲得200的零錢。根\n據多籌碼規則(§45)，這相當於加注到650。",
		"bodyen": "Betting should not be used to obtain change. Pushing out more than the intended bet can confuse\neveryone at the table. All chips pushed out silently are at risk of being counted in the bet. Ex: the opening\nbet is 325 to player A who silently puts out 525 (one 500 and one 25), expecting 200 change. This is a\nraise to 650 under the multiple chip rule (Rule 45)."
	},
	{
		"group": "rules",
		"key": "rule62",
		"number": "62",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "全下後發現有隱藏籌碼",
		"titleen": "All-In with Chips Found Behind Later",
		"bodyzh": "若A全下，且在一名玩家跟注後發現身後有隱藏籌碼，則TD將判定該隱藏籌碼是否屬於可接受行動(§49)。如\n果不屬於可接受行動，A獲勝後將不會獲得該籌碼的賠償。如果A輸了該籌碼不會為其保留且TD可將籌碼獎勵\n給獲勝的跟注者。\n玩法:其他",
		"bodyen": "If A bets all-in and a hidden chip is found behind after a player calls, the TD will determine if the chip\nbehind is part of accepted action (Rule 49). If not part of the action, A is not paid off for the chip(s) if he or\nshe wins. If A loses, he or she is not saved by the chip(s) and the TD may award the chip(s) to the\nwinning caller."
	},
	{
		"group": "rules",
		"key": "rule63",
		"number": "63",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "籌碼不在視野範圍內且在移動途中",
		"titleen": "Chips Out of View and in Transit",
		"bodyzh": "玩家不得以任何遮擋視線的方式持有或移動籌碼。違反此規定的玩家將被沒收籌碼，並可能被取消比賽資\n格。被沒收的籌碼將被移出賽事。TDA建議場方在必要時提供籌碼架或籌碼袋，以便運送籌碼。",
		"bodyen": "Players may not hold or transport chips in a way that takes them out of view. A player who does so will\nforfeit the chips and may be disqualified. The forfeited chips will be taken out of play. The TDA\nrecommends the house provide racks or bags to transport chips when needed."
	},
	{
		"group": "rules",
		"key": "rule64",
		"number": "64",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "失物招領籌碼",
		"titleen": "Lost and Found Chips",
		"bodyzh": "遺失或找到的籌碼如無法確定其所有權，將被取消比賽資格並歸還至錦標賽庫存。",
		"bodyen": "Lost and found chips for which ownership cannot be determined will be taken out of play and returned to\ntournament inventory."
	},
	{
		"group": "rules",
		"key": "rule65",
		"number": "65",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "意外殺死/弄髒/暴露的手牌",
		"titleen": "Accidentally Killed / Fouled / Exposed Hands",
		"bodyzh": "A:玩家必須始終保護自己的手牌，包括在攤牌時等待讀牌時。\n如果發牌員誤殺了一手牌或是TD判定一手牌犯規且無法100%確定，玩家將無法獲得任何補償，且無權獲得已\n跟注的退款。如果玩家發起了下注或加注但未被跟注，則未跟注的金額將退還。\nB:如果一手牌犯規但可以識別，則無論是否有牌暴露，該手牌仍可繼續遊戲。",
		"bodyen": "A: Players must protect their hands at all times, including at showdown while waiting for hands to be read.\nIf the dealer kills a hand by mistake or if in TDs judgement a hand is fouled and cannot be identified to\n100% certainty, the player has no redress and is not entitled to a refund of called bets. If the player\ninitiated a bet or raise and hasn’t been called, the uncalled amount will be returned.\nB: If a hand is fouled but can be identified, it remains in play despite any cards exposed."
	},
	{
		"group": "rules",
		"key": "rule66",
		"number": "66",
		"sectionkey": "Other Play",
		"sectionzh": "其他遊戲程序",
		"sectionen": "Other Play",
		"titlezh": "梭哈中的死牌與棄牌",
		"titleen": "Dead Hands and Mucking in Stud",
		"bodyzh": "在梭哈撲克遊戲中，如果玩家面對行動時在牌桌上拿起明牌則手牌死牌。梭哈撲克遊戲中正確的棄牌方式是將\n所有明牌全部面朝下推到牌堆前面。",
		"bodyen": "In stud poker, if a player picks up the upcards while facing action, the hand is dead. Proper mucking in\nstud is turning down all up cards and pushing them all forward face down."
	},
	{
		"group": "rules",
		"key": "rule67",
		"number": "67",
		"sectionkey": "Etiquette and Penalties",
		"sectionzh": "禮儀和處罰",
		"sectionen": "Etiquette and Penalties",
		"titlezh": "不披露(no disclosure)，一手牌一人決策",
		"titleen": "No Disclosure. One Player to a Hand",
		"bodyzh": "玩家必須始終保護錦標賽中的其他玩家。因此，無論是否在牌局中，玩家都不得:\n1. 討論進行中或已棄牌的內容\n2. 在比賽進行中的任何時間提出建議或批評\n3. 讀出尚未攤開的一手牌\n一人一手牌規則是有影響的。除其他事項外，此規則禁止向其他玩家、顧問或觀眾展示牌局或討論策略。",
		"bodyen": "Players must protect other players in the tournament at all times. Therefore players, whether in the hand\nor not, must not:\n1. Discuss contents of live or mucked hands,\n2. Advise or criticize play at any time,\n3. Read a hand that hasn't been tabled.\nOne-player-to-a-hand is in effect. Among other things, this rule prohibits showing a hand to or discussing\nstrategy with another player, advisor, or spectator."
	},
	{
		"group": "rules",
		"key": "rule68",
		"number": "68",
		"sectionkey": "Etiquette and Penalties",
		"sectionzh": "禮儀和處罰",
		"sectionen": "Etiquette and Penalties",
		"titlezh": "攤牌和正確棄牌",
		"titleen": "Exposing Cards and Proper Folding",
		"bodyzh": "在行動未完成時亮牌，包括當前玩家最後行動時亮牌，可能會受到懲罰，但不會被判為死牌。任何懲罰均從該局\n牌結束時開始。棄牌時，應將牌面朝前推至靠近桌面的位置，不得故意亮牌或高拋(「直升機拋」)。參見§66。",
		"bodyen": "Exposing cards with action pending, including the current player when last to act, may result in a penalty but not\na dead hand. Any penalty begins at the end of the hand. When folding, cards should be pushed forward low to\nthe table, not deliberately exposed or tossed high (“helicoptered”). See Rule 66."
	},
	{
		"group": "rules",
		"key": "rule69",
		"number": "69",
		"sectionkey": "Etiquette and Penalties",
		"sectionzh": "禮儀和處罰",
		"sectionen": "Etiquette and Penalties",
		"titlezh": "道德遊戲",
		"titleen": "Ethical Play",
		"bodyzh": "撲克是一種個人遊戲。玩牌不當將受到處罰，包括沒收籌碼和(/或)取消資格。故意轉移籌碼或其他形式的串通\n行為將被取消資格。",
		"bodyen": "Poker is an individual game. Soft play will result in penalties, which may include chip forfeiture and/or\ndisqualification. Chip dumping and other forms of collusion will result in disqualification."
	},
	{
		"group": "rules",
		"key": "rule70",
		"number": "70",
		"sectionkey": "Etiquette and Penalties",
		"sectionzh": "禮儀和處罰",
		"sectionen": "Etiquette and Penalties",
		"titlezh": "違反禮儀",
		"titleen": "Etiquette Violations",
		"bodyzh": "違反禮儀的行為將受到§71的強制措施。例如但不限於:持續拖延遊戲、不必要地觸摸其他玩家身體(或牌、籌碼)、\n反覆不按順序行事、保持不良的牌(或籌碼)的可見性和可數性、在發牌員夠不著的地方下注、辱罵行為、不\n雅衛生習慣以及過多的閒聊。",
		"bodyen": "Etiquette violations are subject to enforcement actions in Rule 71. Examples include but are not limited to:\npersistent delay of the game, unnecessarily touching another player’s person, cards or chips, repeatedly\nacting out of turn, maintaining poor card or chip visibility and countability, betting out of reach of the\ndealer, abusive conduct, offensive hygiene, and excessive chatter."
	},
	{
		"group": "rules",
		"key": "rule71",
		"number": "71",
		"sectionkey": "Etiquette and Penalties",
		"sectionzh": "禮儀和處罰",
		"sectionen": "Etiquette and Penalties",
		"titlezh": "警告、處罰和取消資格",
		"titleen": "Warnings, Penalties, and Disqualification",
		"bodyzh": "A:處罰選項包括但不限於口頭警告、一次或多次的「錯過一手牌(missed hand)」或「錯過一圈(missed\nround)」的處罰以及取消資格。對於錯過一輪的違規者，將按處罰時牌桌上每位玩家(包括其本人)乘以處罰輪數\n的倍數失去手牌。屢次違規將受到加重處罰。離開牌桌或受到處罰的玩家可能會被前注或盲注而遭淘汰。\nB:違反禮儀(§70)、行動未完成時亮牌、丟牌、違反一人一手牌規則、不當使用設備或策略工具(§5)或類似情況，\n均可能受到處罰。玩牌不當、濫用、擾亂秩序、躲避盲注或作弊均會受到處罰。在河牌圈最後行動時，持有唯\n一堅果牌過牌並不自動構成玩牌不當；TD將根據具體情況酌情處理。\nC:受罰的玩家必須離開牌桌。牌會被發到他們的座位上，將支付盲注和前注，他們的牌會在第一次發牌後被清\n除。如果是梭哈的強制注牌，他們必須下注起始強制注。\nD:被取消資格(Disqualify，DQ)的選手的籌碼將從比賽中移除。",
		"bodyen": "A: Enforcement options include but are not limited to verbal warnings, one or more “missed hand” or\n“missed round” penalties, and disqualification. For missed rounds, the offender will miss one hand for\nevery player (including him or her) at the table when the penalty is given multiplied by the number of\npenalty rounds. Repeat infractions are subject to escalating penalties. Players away from the table or on\npenalty may be anted or blinded out of a tournament.\nB: A penalty may be invoked for etiquette violations (Rule 70), card exposure with action pending,\nthrowing cards, violating one-player-to-a-hand, improper use of devices or strategy tools (Rule 5), or\nsimilar incidents. Penalties will be given for soft play, abuse, disruptive behavior, dodging blinds or\ncheating. Checking the exclusive nuts when last to act on the river is not an automatic soft play violation;\nTD’s discretion applies based on the situation.\nC: Players on penalty must be away from the table. Cards are dealt to their seats, their blinds and antes\nposted, their hands are killed after the initial deal, and if dealt the stud bring-in they must post the bring-in.\nD: Chips of a disqualified player shall be removed from play."
	},
	{
		"group": "extra",
		"key": "rp1",
		"number": "RP-1",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "全下按鈕",
		"titleen": "All-In Buttons",
		"bodyzh": "全下按鈕清楚地顯示玩家「全下」。發牌員應保留按鈕(而不是每個玩家)。\n當玩家全下時，發牌員會將一個全下按鈕放在該玩家面前，讓桌上的其他玩家都能看到。",
		"bodyen": "All-in buttons clearly indicate a player is “all-in.” The dealer should keep the buttons (not each player).\nWhen a player bets all-in, the dealer places an all-in button in front of the player, in full view of the rest of\nthe table."
	},
	{
		"group": "extra",
		"key": "rp2",
		"number": "RP-2",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "不鼓勵收攏下注籌碼(Bringing in Bets)",
		"titleen": "Bringing in Bets is Discouraged",
		"bodyzh": "在牌桌上的下注與加注行動仍在進行時，發牌員習慣性的將已下注籌碼收進底池，屬於不良發牌習慣。\n減少或移動玩家面前的下注籌碼堆，可能影響後續玩家的行動判斷、造成混淆，並提高錯誤發生的機率。\n只有目前正面臨行動決策的玩家，才可以要求發牌員收攏下注籌碼。",
		"bodyen": "Routinely bringing in chips as betting and raising proceeds around the table is poor dealing practice.\nReducing bet stacks can influence action, create confusion and increase errors. Only the player currently\nfacing action may ask the dealer to bring-in bets."
	},
	{
		"group": "extra",
		"key": "rp3",
		"number": "RP-3",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "個人物品",
		"titleen": "Personal Belongings",
		"bodyzh": "桌面對於籌碼管理、發牌和下注至關重要。桌子及其附近空間(含腿部空間和走道)不得堆疊不必要的\n個人物品。每個場館都應清楚標示其允許帶入比賽區域的物品政策。",
		"bodyen": "The table surface is vital for chip stack management, dealing, and betting. The table and nearby spaces\n(legroom and walkways) must not be cluttered by non-essential personal items. Each cardroom should\nclearly display its policy on items allowed in the tournament area."
	},
	{
		"group": "extra",
		"key": "rp4",
		"number": "RP-4",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "無序牌堆(Disordered Stub)",
		"titleen": "Disordered Stub",
		"bodyzh": "當一手牌剩餘未發牌時，如果牌堆意外掉落且看起來雜亂無章:\n1)如果可以先嘗試按原順序重新排列牌堆\n2)如果無法重新排列，則僅使用牌堆中的牌(而不是棄牌和之前的燒牌)重新排列一張牌堆。這些牌堆應該被打\n亂、洗牌、切牌，然後使用新的牌堆繼續遊戲\n3)如果牌堆掉落時與棄牌(和/或燒牌)混在一起，時將混合好的牌打亂，洗牌，切牌。遊戲繼續使用新的牌堆\n進行。",
		"bodyen": "When cards remain to be dealt on a hand and the stub is accidentally dropped and appears to be\ndisordered: 1) first try to reconstruct the stub in its original order if possible; 2) If not possible, create a\nnew stub using only the stub cards (not the muck and prior burns). These should be scrambled, shuffled,\ncut, and play proceeds with the new stub; 3) If when dropped the stub is mixed in with the muck and/or\nburns, then scramble the mixed cards together, shuffle, and cut. Play proceeds with the new stub."
	},
	{
		"group": "extra",
		"key": "rp5",
		"number": "RP-5",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "提前發牌",
		"titleen": "Prematurely Dealt Cards",
		"bodyzh": "有時會在前一輪作業完成之前過早發出公共牌和燒牌。處理這些情況的一般程序是:\nA:提前翻牌:將翻牌的燒牌當作燒牌。將提前翻牌的公開牌放回牌堆，重新洗牌。從新洗好的牌堆中重新發牌\n(不額外燒牌)。\nB:提前發出的轉牌:將轉牌的燒牌牌保留為燒牌牌。將提前發的轉牌放回牌堆，重新洗牌。從新洗好的牌堆中\n重新發牌(不額外燒牌)。\nC:河牌提前發牌:將河牌的燒牌保留為燒牌。將提前發的河牌放回牌堆，重新洗牌。從新洗好的牌堆中重新發\n河牌(不額外燒牌)。\nD:梭哈遊戲過早發牌:過早的發牌會被放回牌堆，牌堆會重新洗牌(參見§RP-17，重新洗牌)，並且會從新洗好的\n牌堆中發出一條新街，無需再次燒牌。",
		"bodyen": "Board and burn cards are sometimes dealt prematurely, before action on the preceding round is finished.\nThe general procedures for these situations are:\nA: Premature flop, leave the flop burn card as the burn. Return the premature board cards to the deck\nstub and reshuffle the entire stub. Re-deal the flop (without another burn) from the newly shuffled stub.\nB: A premature turn card: leave the turn burn card as the burn. Return the premature turn card to the\ndeck stub and reshuffle the entire stub. Re-deal the turn (without another burn) from the newly shuffled\nstub\nC: A premature river card: leave the river burn card as the burn. Return the premature river card to the\ndeck stub and reshuffle the entire stub. Re-deal the river (without another burn) from the newly shuffled\nstub\nD: Premature card in stud: the premature card is returned to the stub, the stub is re-shuffled (See RP-17,\nreshuffling), and a new street is dealt from the newly shuffled stub without another burn."
	},
	{
		"group": "extra",
		"key": "rp6",
		"number": "RP-6",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "高效移動玩家",
		"titleen": "Efficient Movement of Players",
		"bodyzh": "移動玩家進行拆分和平衡牌桌之操作時應迅速，以免過度錯過盲注或延誤遊戲進程。如果環境允許，玩家應配備\n籌碼架以便運輸籌碼，並進行足夠的籌碼升級，以免玩家攜帶過多籌碼(請參閱§10、§11和§63)。",
		"bodyen": "Moving players for breaking and balancing should be expeditious so as not to unduly miss blinds or\notherwise delay the game. If possible, players should have racks for chip transport and sufficient color-\nups should be done so players do not carry unusually large numbers of chips (see Rules 10, 11 and 63)."
	},
	{
		"group": "extra",
		"key": "rp7",
		"number": "RP-7",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "更換發牌員的時機",
		"titleen": "Timing of Dealer Pushes",
		"bodyzh": "TDA建議發牌員在預定的休息時間或等級變更前90秒暫緩更換發牌員。這樣可以避免在遊戲的關鍵階段出現時間耗盡的情況。",
		"bodyen": "The TDA recommends that dealers hold up the push 90 seconds prior to a scheduled break or a level\nchange. This avoids having time expire in crucial stages of the game."
	},
	{
		"group": "extra",
		"key": "rp8",
		"number": "RP-8",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "同步發牌(hand for hand)程序",
		"titleen": "Hand for Hand Procedures",
		"bodyzh": "A:領取獎金資格從公告「完成目前手牌後稍等，我們將開始進行同步發牌」時開始。如果目前牌局中\n出局的玩家數量足夠多，足以贏得獎金，則出局玩家將有資格分得當前牌局所支付名次的獎金。例\n如:一場50名玩家獎勵圈(ITM、payout)的NLHE錦標賽。公告發佈時剩餘52名玩家，且在目前牌局\n中，有3名玩家出局。這3名玩家將平分第50名的獎金。\nB:在同步發牌期間，每手牌最多會從時鐘中扣除3分鐘。\nC:為了讓玩家最清楚了解等級變化的時間，計時器應盡可能在每手牌中減少2分鐘，而不是在多手牌\n「批量」減少。\nD:隨著時間流逝，盲注以每手2分鐘的速度繼續增加，並達到新的等級。\nE:鼓勵但不要求玩家在同步發牌期間保持坐姿。\nF:如果在同步發牌牌局中出現全押和跟注的情況，所有進行玩家手中的牌都應保持牌面朝下。發牌員\n在接獲指示前不得再發牌。",
		"bodyen": "A: Payoff eligibility starts at the announcement: “finish the current hand you’re on then hold up, we are\ngoing hand for hand”. If enough players bust on the current hand to break into the money, the busting\nplayers will be eligible for a share of the place(s) paid on the current hand. Example: NLHE tournament\npaying 50 players. 52 players remain when the announcement is made and during the current hand 3\nplayers bust. All 3 players will share in the 50th place payout.\nB: During H4H play, a maximum of 3 minutes per hand will be deducted from the clock.\nC: So that players can most clearly know the timing of level changes, whenever possible the clock should\nbe reduced by 2-minutes each hand not after “batches” of multiple hands.\nD: Blinds continue to increase as time elapses off the clock at the rate of 2 minutes per hand and new\nlevels are reached.\nE: Players are encouraged but not required to remain seated during H4H play.\nF: In the event of an all-in and call during H4H, the cards of all players in the hand should remain face\ndown. Dealers should not deal additional cards until instructed."
	},
	{
		"group": "extra",
		"key": "rp9",
		"number": "RP-9",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "決賽桌的玩家人數",
		"titleen": "Number of Players at Final Table",
		"bodyzh": "9人桌和8人桌賽事將從兩張各有5名玩家的桌子合併為一張9人桌的決賽桌。7人桌和6人桌賽事將從兩張各有4名玩家的桌子合併為7人桌的決賽桌。",
		"bodyen": "9 and 8-handed events will combine from two tables of five players each to a 9-handed final table. 7 and\n6-handed events will combine from two tables of four players each to a 7-handed final table."
	},
	{
		"group": "extra",
		"key": "rp10",
		"number": "RP-10",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "錦標賽梭哈發牌程序",
		"titleen": "Tournament Stud Dealing Procedures",
		"bodyzh": "A:首輪發牌時亮出的底牌將作為玩家的明牌，第三街將發給該玩家。該玩家可以作為強制注者。\nB:如果手上還有下注動作，發牌人在第七街亮出的牌將被替換。第七街即使手上沒有剩餘的下注動作，街\n道也應該被發出，並且在全押的情況下，沒有淘汰風險的玩家首先亮出。\nC:不在座位(參見§30)的玩家的牌將被清除。第四街的非活牌手牌不會被發牌。\nD:如果在Stud(或Stud-8)中出現兩張或兩張以上相同的高牌，或在Razz中出現兩張或兩張以上相同的低牌，\n則在兩款遊戲中都從花色最高的牌開始下注。\nE:如果發到花色最低的低牌的玩家全押前注，則從其左側開始下注。持有籌碼的玩家必須至少下注至前注\n金額，否則棄牌。\nF:第四街出現一對時注碼不會加倍。\nG:有關梭哈遊戲中過早發出的牌，請參閱§RP-5-D。\nH:第七街牌序過短程序。如果在第七街發牌前，目前牌堆中的牌數小於「所需數量」(#剩餘玩家數量+燒牌\n+未發的最後一張牌)，則按以下步驟操作:\nA)如果將之前3張燒掉的牌(分別用於第4、5和6街)加起來可以達到所需的張數，則當前牌序將與先前燒\n掉的牌混合，產生一張新牌序。新的牌序將被切掉，燒掉一張牌，並向每位玩家發一張牌。\nB)如果目前牌序中至少有3張牌，但將先前燒掉的牌加起來仍達不到所需的張數，則發牌員將燒掉目前牌序的\n頂牌，並將下一張牌作為公共牌發在桌子中央。\nC)如果目前牌序中少於3張牌，則將目前牌序與先前燒掉的3張牌混合，產生一新牌序，然後切掉一張牌，燒\n掉一張牌，並發出下一張牌作為公共牌。\nD)如果有公共牌，則在第6街最先行動的玩家將在第7街最先行動。",
		"bodyen": "A: A downcard exposed on the initial deal will be the player’s upcard and 3rd street will be dealt down to\nthat player. The player can be the bring-in.\nB: A card exposed by the dealer on 7th street will be replaced if betting action remains on the hand. 7th\nstreet should be dealt down even if no betting action remains on the hand and in all-in situations the\nplayer(s) not at risk expose first.\nC: Cards of a player not at his or her seat (See Rule 30) for the deal will be killed. No cards will be dealt\nto a hand on 4th street that is not live.\nD: If there are two or more matching high hands showing in Stud (or Stud-8) or low hands in Razz, betting\nstarts on the hand with the high card by suit in both games.\nE: If the player dealt the low card by suit is all-in for the ante, betting starts to his or her left. Players with\nchips must bet at least the bring-in or fold.\nF: Bets will not be doubled on 4th street for a pair showing.\nG: For premature cards dealt in stud see RP-5-D.\nH: 7th street short stub procedure. If before dealing 7th street the number of cards in the current stub is\nless than the “required number” (# remaining players + burn card + undealt last card) proceed as follows:\nA) if the required number can be reached by adding the 3 prior burn cards (for 4th, 5th, and 6th street) the\ncurrent stub will be scrambled with the prior burns to create a new stub. The new stub will be cut, a card\nburned, and one card dealt to each player. B) if there are at least 3 cards in the current stub but adding\nthe prior burns would not reach the required number, the dealer will burn the top card of the current stub\nand deal the next card as a community card in the center of the table. C) if the current stub has less than\n3 cards, it will be scrambled with the 3 prior burns for a new stub which will then be cut, a card burned,\nand the next card dealt as a community card. D) If a community card is in play, the first player who would\nact on 6th street will be first to act on 7th street."
	},
	{
		"group": "extra",
		"key": "rp11",
		"number": "RP-11",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "前注格式與無前注減少",
		"titleen": "Ante Formats and No Ante Reduction",
		"bodyzh": "若使用單玩家支付前注的方式，建議採用大盲注前注格式(BBA)，即先計算大盲注。隨著比賽的進行，前注不\n應減少(包括在決賽桌)。",
		"bodyen": "If a single-payer ante is used, the big blind ante format (BBA) with big-blind-first calculation is\nrecommended. Antes should not be reduced (including at the final table) as play progresses in the event."
	},
	{
		"group": "extra",
		"key": "rp12",
		"number": "RP-12",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "發牌員應宣布下注並加注",
		"titleen": "Dealers Should Announce Bets and Raises",
		"bodyzh": "發牌員應在牌桌下注時例行宣布非全下的下注金額。全下下注僅在當前行動的玩家要求下才計算。已接受的行\n動繼續適用(§49)。預定的和有選擇的籌碼升級可提高下注注碼的可計算性。",
		"bodyen": "Dealers should routinely announce non-all-in bet values as betting proceeds around the table. All-in bets\nwill be counted only on request of the player currently facing action. Accepted action continues to apply\n(Rule 49). Scheduled and discretionary color-ups improve bet countability."
	},
	{
		"group": "extra",
		"key": "rp13",
		"number": "RP-13",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "在分池遊戲中，發牌員應堆疊籌碼",
		"titleen": "Dealers Should Stack Chips in Split-Pot Games",
		"bodyzh": "在分池遊戲中，發牌員應盡可能定期堆疊底池籌碼。堆疊的籌碼不應遮住玩家視線或乾擾遊戲。",
		"bodyen": "Where possible, dealers should periodically stack pot chips in split-pot games. Stacking chips should not\nobscure players’ view or otherwise disrupt the game."
	},
	{
		"group": "extra",
		"key": "rp14",
		"number": "RP-14",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "隨機性可應用於特殊情況",
		"titleen": "Randomness May be Applied to Special Situations",
		"bodyzh": "對於TDA規則和程序中未涵蓋的錯誤補救措施，TD可以使用隨機性來設計解決方案。",
		"bodyen": "For error remedies not otherwise covered in the TDA Rules and Procedures, TDs may use the concept of\nrandomness to design a solution."
	},
	{
		"group": "extra",
		"key": "rp15",
		"number": "RP-15",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "正確的錦標賽工作人員溝通",
		"titleen": "Proper Tournament Staff Communication",
		"bodyzh": "A:即將離任的發牌員應告知新任發牌員有關牌桌上的相關資訊。例如:盲注訊息、對玩家的警告或處罰、\n破壞性行為。\nB:發牌員應告知場內所有違反§2和§70的現有和潛在違規行為。特別強調任何針對\n特定玩家或工作人員的歧視性或冒犯性行為。",
		"bodyen": "A: Outgoing dealers should inform incoming dealers of pertinent information regarding the table.\nExamples include: blind information, players on warning or penalties, disruptive behavior.\nB: The dealer should inform the floor of all existing and potential infractions of Rule 2 (Player\nResponsibilities) and Rule 70 (Etiquette). Special emphasis on any discriminatory or offensive behavior in\ngeneral or towards specific players or staff."
	},
	{
		"group": "extra",
		"key": "rp16",
		"number": "RP-16",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "破牌桌上缺席的玩家",
		"titleen": "Player Absent on a Breaking Table",
		"bodyzh": "如果在拆分牌桌時玩家沒有在場，他們的籌碼應該由工作人員移到新的桌子上。",
		"bodyen": "If a player is not present during breaking of a table, their chips should be moved to the new table by a\nstaff member."
	},
	{
		"group": "extra",
		"key": "rp17",
		"number": "RP-17",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "錦標賽換牌遊戲下注程序",
		"titleen": "Tournament Draw Betting Procedures",
		"bodyzh": "在所有單次換牌遊戲中皆允許平跟(limp)入池。",
		"bodyen": "Limping is allowed in all single-draw games."
	},
	{
		"group": "extra",
		"key": "rp18",
		"number": "RP-18",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "混合遊戲順序",
		"titleen": "Order of Mixed Games",
		"bodyzh": "為了減少錯誤，在混合遊戲賽事(例如HORSE)中，梭哈和stud-8不需要連續進行。",
		"bodyen": "In order to reduce errors, in mixed game events (ex HORSE), stud and stud-8 need not be played\nconsecutively."
	},
	{
		"group": "extra",
		"key": "rp19",
		"number": "RP-19",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "減少拖延",
		"titleen": "Reducing Stalling",
		"bodyzh": "場方應明確宣布減少拖延的意圖，以便玩家了解遊戲的預期時間。建議各場方制定減少拖延的創新方法。\nTDA會員場方成功運用的一些方法包括:\n隨機拆桌取代重新抽桌、每個盲注級別採固定手數制、以一圈為單位同步進行、採軟性逐手同步制、增\n設行動限時計時器等。",
		"bodyen": "The house should clearly announce intention to reduce stalling so that players understand timely play is\nexpected. It’s recommended that each house establish creative methods for reducing stalling. Some\nmethods successfully used by TDA member houses include:\nRandom table breaks instead of table draws, using fixed # of hands per level, going orbit for orbit, soft\nhand for hand, and adding a shot clock"
	},
	{
		"group": "extra",
		"key": "rp20",
		"number": "RP-20",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "準備洗牌的牌",
		"titleen": "Cards Ready for Shuffle",
		"bodyzh": "比賽開始或休息結束、比賽恢復後的一分鐘內，現場應宣布「發牌員準備牌(\"dealers prepare\nyour decks\")」。當至少有兩名玩家在牌桌上時，發牌者會洗牌並將牌擺正，以便在盲注開始時進行\n洗牌。",
		"bodyen": "At the start of the tournament of ending of a break, within one minute of starting or resuming play,\nthe floor should announce “dealers prepare your decks”. When at least 2 players are at the table,\nthe dealer will wash and square the deck, to be ready for shuffle when the level starts."
	},
	{
		"group": "extra",
		"key": "rp21",
		"number": "RP-21",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "攤分",
		"titleen": "Spreading the Pot",
		"bodyzh": "底池僅在底池限注賽事中計算。如有要求，底池可打散，以增加籌碼可見度。另請參閱§54:底池大小\n和底池限注。",
		"bodyen": "The pot will only be counted in pot-limit events. On request the pot may be spread to increase\nchip visibility. See also Rule 54: Pot Size and Pot-Limit Bets."
	},
	{
		"group": "extra",
		"key": "rp22",
		"number": "RP-22",
		"sectionkey": "Recommended Procedures",
		"sectionzh": "推薦程序",
		"sectionen": "Recommended Procedures",
		"titlezh": "使用無面額或籌碼價值的物品進行下注(賞金籌碼、時間銀行等)",
		"titleen": "Betting Non-Denominational Items (Bounty chips, clock tokens etc)",
		"bodyzh": "無面額的道具(例如賞金籌碼、時間銀行等)的大小應與標準下注籌碼不同。使用這些道具進行下注將\n根據場方政策或§1進行解釋，並可由TD酌情判定為跟注或全押。",
		"bodyen": "Action items with no nominal value (bounty chips, clock tokens etc) should be of different size\nthan standard betting chips. Betting with these items will be interpreted per house policy or Rule 1\nand may be ruled a call or all-in at TDs discretion."
	},
	{
		"group": "extra",
		"key": "add10",
		"number": "§10",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §10",
		"sectionen": "Addendum Rule 10",
		"titlezh": "拆桌，兩步驟隨機程序。",
		"titleen": "Breaking Tables, 2-Step Random Process. A 2-step random or “double-blind”",
		"bodyzh": "兩步驟隨機程序亦稱「雙盲」程序確保在分配新座位時不偏袒任何一方。以下是此類程序的範例:\n1)向拆桌的玩家展示新的座位卡，然後將牌面朝下打亂，形成一疊；\n2)發牌員向每位玩家發一張牌面朝上的撲克牌。然後依序從持有花色最高的撲克牌的玩家發出座位卡。",
		"bodyen": "process assures that there is no favoritism in distributing new seat assignments. An example of\none such process: 1) show players at the breaking table the new seat cards then scramble the\ncards face down and form a stack; 2) the dealer then deals one playing card face up to each\nplayer. The seat cards are then dealt out with the first seat card going to the player with the\nhighest playing card by suit showing."
	},
	{
		"group": "extra",
		"key": "add11",
		"number": "§11",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §11",
		"sectionen": "Addendum Rule 11",
		"titlezh": "平衡牌桌和暫停遊戲",
		"titleen": "",
		"bodyzh": "例如: NLHE9人遊戲，A桌有5名玩家，B桌包含最多的玩家總共有8名。一旦A桌大盲為空位比賽就會暫停。",
		"bodyen": ""
	},
	{
		"group": "extra",
		"key": "add16",
		"number": "§16",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §16",
		"sectionen": "Addendum Rule 16",
		"titlezh": "當全下時秀牌",
		"titleen": "Face Up for All-Ins. “All hands will be tabled without delay once a player is all-in and",
		"bodyzh": "「一旦有玩家全下，且牌局中所有其他玩家的下注操作均已完成，所有有參與手牌的玩家將立即亮牌」。此規\n則意味著，當至少有一名玩家全押，且其他玩家沒有進一步下注操作的機會時，所有玩家的所有底牌將立即亮出。\n不要等到攤牌才亮牌；不要等到邊池分配完畢才亮出只為主底池全押的玩家；如果在攤牌前的任何一輪下注操作已\n完成，則立即亮牌，然後清出剩餘的牌。\n例1. NLHE。剩餘兩名玩家。\n轉牌圈，籌碼較少的玩家A全押，B跟注。此時，A和B的手牌均翻開，然後燒牌，翻開河牌，進入攤牌階\n段。\n例2. NLHE.剩餘三名玩家。\n翻牌前，籌碼最少的玩家A全押，B和C都跟注。此時不要亮牌，因為B和C都有籌碼還可以進一步下注。\n翻牌時B和C過牌；仍然可以下注，所以不要翻開牌。\n轉牌圈，B全押，C跟注。現在所有牌(A、B、C)都亮牌，因為無法繼續下注。燒牌，河牌圈發牌，然後攤牌。\n先贏得B和C之間的邊池，再贏得主池。注意:在贏得B和C之間的邊池之前，不要將A的牌面朝下。\n例3. NLHE.剩餘三名玩家。\n翻牌前，玩家籌碼最少的A全押700，B和C都跟注，各自剩下幾千籌碼。此時不要亮牌，因為B和C都有籌\n碼還可以進一步下注。\n翻牌時B和C過牌；仍然可以下注，所以不要翻開牌。\n轉牌圈，B下注1000，C跟注。由於B和C都還有籌碼，並因河牌還沒發，所以還可以下注，所以先不要亮\n牌。\n河牌圈，B和C都過牌。現在所有牌(A、B和C)都亮出，因為下注結束，牌局即將進入攤牌階段。先將2000\n的邊池分配給B和C，然後再將主池分配給B和C。注意:在B和C之間的邊池分配完成之前，不要將A的\n牌面朝下保留。",
		"bodyen": "all betting action by all other players in the hand is complete”. This rule means that all downcards\nof all players will be turned up at once when at least one player is all-in and there is no chance of\nfurther betting action by the other player(s). Do not wait for the showdown to turn the cards up;\ndo not wait for side pots to be divided before turning up the all-in who is only in for the main pot;\nif betting action is finalized on any street prior to the showdown, turn the cards up at that point\nand then run out the remaining cards.\nExample 1. NLHE. Two players remain. On the turn, Player A (the shorter stack) pushes all-in\nand is called by B. Turn both A and B’s downcards up at this point, then burn and turn the river\nand proceed to showdown.\nExample 2. NLHE. Three players remain.\nPre-flop, Player A (the shortest stack) pushes all-in and is called by both B and C. Do not turn\ncards up yet because B and C both have chips so further betting action is possible.\nOn the flop B and C check; betting is still possible so don’t turn the cards up yet.\nOn the turn B pushes all-in and C calls. Turn all hands up now (A, B, and C) because no further\nbetting is possible. Burn and turn the river then proceed to showdown. Award the side pot\nbetween B and C first, then award the main pot. Notice: you do not keep A’s cards face down\nuntil the side pot between B and C is awarded.\nExample 3. NLHE. Three players remain.\nPre-flop, Player A (the shortest stack) pushes all-in for 700 and is called by both B and C who\nhave several thousand each left. Do not turn cards up yet because B and C both have chips so\nfurther betting action is possible.\nOn the flop B and C check; betting is still possible so don’t turn the cards up yet.\nOn the turn B bets 1000 and C calls. Since both B and C still have chips and the river remains to\nbe dealt, betting is still possible so don’t turn the cards up yet.\nOn the river both B and C check. Turn all hands up now (A, B, and C) because betting is over\nand the hand is moving to showdown. Award the 2000 side pot between B and C first, then\naward the main pot. Notice: do not keep A’s cards face down until the side pot between B and C\nis awarded."
	},
	{
		"group": "extra",
		"key": "add18",
		"number": "§18",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §18",
		"sectionen": "Addendum Rule 18",
		"titlezh": "請求看牌",
		"titleen": "Asking to See a Hand",
		"bodyzh": "例1:NLHE。牌局剩餘3名玩家。河牌圈無人下注，無玩家全押。攤牌時，玩家A棄牌，牌面朝下，由發牌員將\n牌推入棄牌區。B亮出他的牌，顯示三條。C將他的牌面朝下推向前。B可以要求看C的牌，因為B已\n經亮出了他的牌。但是，B的請求由TD酌情決定；B沒有一定可查看底牌的權利，因為河牌圈無人\n下注，因此他沒有「付錢查看C的牌」。A和C都不得要求查看競爭對手的牌，因為他們既沒有亮出自\n己的牌，也沒有保留自己的牌。\n例2:NLHE。牌局剩餘4名玩家。河牌圈A下注1000，B跟注，C加注到5000，D、A和B全部跟注。沒有玩家全\n押。B亮出底牌，亮出三條。D立即棄牌，牌面向下，發牌員將其棄牌並丟進棄牌堆。C開始將牌面朝下\n推向前方。A和B都擁有可查看底牌的權利，有權要求查看C的牌，因為\n1)由於C是河牌圈最後一位進攻者，他們付費查看；\n2) A和B均保留自己的牌。D(也跟注C)棄牌後未亮牌，即放棄了看C牌的權利。此情況下的所有其他\n請求均由TD決定，例如B要求查看A的牌(即另一位跟注者的牌)。",
		"bodyen": "Example 1: NLHE. 3 players remain in the hand. There is no betting on the river and no player is\nall-in. At showdown Player A discards face down and the cards are pushed into the muck by the\ndealer. B tables his hand, showing trips. C pushes his cards forward face-down. B may ask to\nsee C’s hand because B has tabled his cards. However, B’s request is at TDs discretion; B has\nno inalienable right to see it because there was no bet on the river thus he did not “pay to see\nC’s hand.” Neither A nor C may ask to see a competitor’s hand because they have neither tabled\ntheir cards nor retained them.\nExample 2: NLHE. 4 players remain in the hand. On the river A bets 1000, B calls, C raises to\n5000, and D, A and B all call. No player is all-in. B tables his hand, showing trips. D instantly\ndiscards face down and the dealer kills his hand into the muck. C begins to push his cards\nforward face-down. Both A and B have an inalienable right to see C’s hand on request because\n1) they paid to see it as C was the last aggressor on the river and 2) both A and B retain their\ncards. D (who also called C) relinquished his right to see C’s hand when he discarded without\ntabling. All other requests in this situation are at TD’s discretion, such as B asking to see A’s\ncards (the cards of another caller)."
	},
	{
		"group": "extra",
		"key": "add38",
		"number": "§38",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §38",
		"sectionen": "Addendum Rule 38",
		"titlezh": "實質行動後的燒牌",
		"titleen": "Burns After Substantial Action",
		"bodyzh": "例1-A:50-100。1號位和2號位分別是小盲/大盲。翻牌前，發給所有玩家初始牌。\n1號位和2號位的小盲/大盲。3號位的槍口棄牌，4號位的玩家跟注也順帶透過籌碼完成了兩次實質行動。5\n號位的玩家隨後意識到自己只有一張牌，由於SA已經發生，他的牌已死。發牌員會只燒一張牌，然後發出翻\n牌。發牌員不會燒兩張牌來「恢復原來的牌堆順序」。\n例1-B:同樣的遊戲和初始發牌。3號位槍口棄牌，4號座位跟注，完成了實質操作。5號座位隨後意識到自己\n有三張牌，由於SA已經發生，他的牌已死。發牌員會燒掉一張牌，然後發出翻牌。發牌員不會將5號座位的第\n三張牌視為燒牌而在沒有燒牌的情況下發出翻牌。",
		"bodyen": "Example 1-A: THE 50-100. SB / BB in seats 1 and 2. Pre-flop, initial cards dealt to all players.\nSB / BB in seats 1 and 2. Seat 3 (UTG) folds and Seat 4 calls, completing substantial action with\n2 actions with chips. Seat 5 then realizes she has only 1 card and her hand is dead because SA\nhas occurred. The dealer will burn only one card and then put out the flop. The dealer will not\nburn 2 cards to “return to the original stub order”.\nExample 1-B: Same game and initial deal. Seat 3 (UTG) folds and Seat 4 calls, completing\nsubstantial action. Seat 5 then realizes she has 3 cards and her hand is dead because SA has\noccurred. The dealer will burn one card and then put out the flop. The dealer will not consider\nSeat 5’s third card as the burn and put out the flop without a burn off the stub."
	},
	{
		"group": "extra",
		"key": "add40a",
		"number": "§40-A",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §40-A",
		"sectionen": "Addendum Rule 40-A",
		"titlezh": "下注方式，不明確或矛盾的下注。「當情況不明或口頭聲明與籌碼聲明相矛盾的情況下，TD將根據具",
		"titleen": "Methods of Betting, Unclear or Contradictory Bets. “In unclear situations or",
		"bodyzh": "體情況和§1決定下注。」\n例1:河牌單挑，玩家A口頭宣布「四萬兩千」，但只放出5000籌碼。並且桌上並非所有人都聽到了A的宣告。\n隨後玩家B推出5000籌碼跟注。雙方都在牌桌上且A持有獲勝牌。此情況判決無統一標準:雖口頭聲明先行但\n未必明確。籌碼看起來是5000的下注。在這些不明確且相互矛盾的情況下，TD將根據§1做出最公平的裁決。",
		"bodyen": "where verbal and chips are contradictory, the TD will determine the bet based on the\ncircumstances and Rule 1”.\nExample 1: THE, heads-up on the river Player A verbally declares “forty-two thousand” but\npushes out only a 5k chip. Not everyone at the table heard the declaration. Player B pushes out\n5k to call. Both players table and A has the best hand. Ruling criteria is mixed: verbal came first\nbut wasn’t necessarily clear. The chip appeared to be a bet of 5k. In these unclear and\ncontradictory situations, the TD will make the fairest ruling possible using Rule 1."
	},
	{
		"group": "extra",
		"key": "add43",
		"number": "§43",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §43",
		"sectionen": "Addendum Rule 43",
		"titlezh": "加注金額。「目前下注輪次中之前最大的全額下注或加注金額」。",
		"titleen": "Raise Amounts. “The largest prior full bet or raise of the current betting round”.",
		"bodyzh": "此指的是當前回合中前一位下注者的最大額外行動或「最後一次合法加注」。當前回合即「當前街」，即\n翻牌遊戲中的翻牌前、翻牌圈、轉牌圈、河牌圈；7張梭哈遊戲中的第3街、第4街、第5街、第6街、第7\n街，等等。\n例1:NLHE，盲注100-200。翻牌後，A開注600。B加注1000，總下注1600。C再加注2000，總下注3600。\n如果D想要加注，他必須至少加注「本輪最大下注或加注」，即C的加注2000。因此，D必須再加注至少2000，\n總下注5600。請注意，D的最低加注額並非3600(C的總下注額)，而只是2000，即C額外加注的金額。\n例2:NLHE，盲注50-100。翻牌前A處於槍口位置，全押總計150(下注金額增加50)。因此，我們有一個100\n的盲注和一個全押，使總金額增加50。因為100仍然是「本輪最大下注或加注」，因此如果B想要再加注，\n他必須至少加注100，總計250。\n例3:NLHE，盲注100-200。轉牌圈，A下注300。B推出兩個500的籌碼，總計1000(加注700)。C可以跟注\n1000。如C想要加注，必須至少達到「本輪最大下注或加注」，也就是B的加注700。因此，C的最低加注\n額為700，總計1700。注意，他的最低加注額不是B的總下注額1000。\n例4-A:NLHE，盲注25-50。A加注75至125。請注意，125等於50(下注)加注75。此街的下一次加注必須「至\n少等於之前最大下注或加注的金額」，即75。B現在最小加注(75)至200。C隨後再加注300，總金額為\n500。現在我們有一個50的下注，兩次75的加注，以及一次300的加注，總金額為500。如果D想再次加注，\n「加注金額必須至少等於當前下注輪中前一次最大下注或加注金額」，即300。因此D必須至少再加注300，\n使總金額達到800。\n例4-B:與4-A相同。同樣是D的下注500，但A剛剛加注450，總下注500，B和C都跟注了。因此，盲注50，加注\n450。「加注必須至少等於本輪最大下注或加注金額」，即A的加注450。因此，D的跟注金額為500，如果D\n想再加注，則必須至少加注450，總下注金額為950。",
		"bodyen": "This line refers to the largest additional action or “last legal increment” by a preceding bettor in\nthe current round. The current round is the “current street”, i.e. pre-flop, flop, turn, river in board\ngames; 3rd – 4th – 5th – 6th – 7th street in 7-stud, etc.\nExample 1: NLHE, Blinds 100-200. Post-flop, A opens with a bet of 600. B raises 1000 for total\nof 1600. C re-raises 2000 for total of 3600. If D wants to raise, he must at least raise the “largest\nbet or raise of the current round”, which is C’s raise of 2000. So, D must re-raise at least 2000\nmore for a total of 5600. Note that D’s minimum raise is not 3600 (C’s total bet), but only 2000,\nthe additional raise action that C added.\nExample 2: NLHE, Blinds 50-100. Pre-flop A is under the gun and goes all-in for a total of 150\n(an increase in the bet of 50). So, we have a 100 blind bet and an all-in wager that increases the\ntotal by 50. Which is larger? The 100 is still the “largest bet or raise of the current round”, so if B\nwants to re-raise he must raise at least 100 for a total of 250.\nExample 3: NLHE, Blinds 100-200. On the turn A bets 300. B pushes out two 500 chips making\nthe total 1000 (a 700 raise). It is 1000 to C to call. If C wants to raise, it must be “at least the\nlargest bet or raise of the current round”, which is B’s raise of 700. So, C’s minimum raise would\nbe 700 for a total of 1700. Note his minimum raise is not 1000, B’s total bet.\nExample 4-A: NLHE, Blinds 25-50. A raises 75 to 125 total. Notice that 125 total = 50 (bet) plus\n75 (raise). The next raise on this street must be “at least the size of the largest previous bet or\nraise”, which is 75. B now raises the minimum (75) to 200 total. C then re-raises 300 for total of\n500. We now have a bet of 50, two raises of 75 and a raise of 300 for total of 500. If D wants to\nre-raise, “the raise must be at least the size of the largest previous bet or raise of the current\nbetting round”, which is now 300. So, D must raise at least 300 more to a total of 800.\nExample 4-B: Same as 4-A. It's the same 500 to D, but there’s just been one raise of 450 by A\nto a total of 500 and B and C have both called. So, there’s a blind bet of 50 and a raise of 450. \"A\nraise must be at least the size of the largest previous bet or raise of the current betting round\",\nwhich is A’s raise of 450. So, it’s 500 for D to call, and if D wants to re-raise he must raise at\nleast 450 for a total of 950."
	},
	{
		"group": "extra",
		"key": "add45",
		"number": "§45",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §45",
		"sectionen": "Addendum Rule 45",
		"titlezh": "多籌碼下注",
		"titleen": "Multiple Chip Betting.",
		"bodyzh": "「A:當面對下注，除非先聲明加注或全押，否則多籌碼下注(包括用玩家最後的籌碼下注)，若所有丟出的籌碼\n都是跟注所必需的，則該多籌碼下注即為跟注。也就是說，若拿掉所有丟出的籌碼中的其中一張面額最小的籌碼\n後剩餘金額不足以支付跟注數額。也就是說，即使拿走最小籌碼之一，籌碼數也少於跟注金額。B:如果不需要所\n有丟出的籌碼來跟注；即只拿走一個最小的籌碼，剩餘的籌碼數額大於或等於跟注數額:1)如果玩家還有籌碼，\n則按照§43中的50%標準下注。2)A玩家用最後籌碼下注，無論是否達到50%的門檻，都視為全押。」\n例1:沒有一個籌碼可以被移除並仍然還至少達到跟注金額。\n例1-A:玩家A翻牌後開注1200，B默默地丟出兩枚1000籌碼。這算跟注，因為任何籌碼都無法移除並且至少還能\n剩下1200。\n例1-B:NLHE，盲注250-500。翻牌前，UTG玩家加注600，總籌碼1100。UTG+1玩家默默地丟出一枚500和一枚\n1000的籌碼。這算跟注，因為無論拿走500還是1000，都無法剩下至少1100的籌碼。\n例2:與上面的1-B相同，只是UTG+1默默地丟出一枚1000和五枚100籌碼。\n可以移除四張100，但仍剩下1100的跟注金額。因此將受到§43中50%標準的約束:最低加注金額為600，600的\n50%為300，因此如果UTG+1玩家的牌面加注金額為1400或更多，他必須加注至1700。由於UTG+1玩家的牌面\n加注金額為1500，因此在本例中他必須加注。\n例3:與上述範例2相同，但UTG+1位置的玩家默默地丟出一枚1000和三枚100籌碼。其中兩張100可以移除且\n仍有1100的跟注金額，因此此情況適用§43。但由於玩家未丟出至少50%的最低加注金額，因此此下注仍被視\n為跟注，玩家將反還200籌碼。\n例4:用所有籌碼進行多籌碼下注。A)若需要所有籌碼才能跟注，則處理方式與持有剩餘籌碼的玩家完全相同\n(請參閱上述例1)。B)如果只移除一個最小籌碼，剩餘籌碼金額等於或大於跟注金額，則無論該玩家是否達到\n50%的加注標準，該玩家都被視為全押。\n例4-A:A開池加注1400，B(剩餘籌碼量較大)默默地丟出一枚1000和三枚500籌碼。這是強制性最小加注至\n2800，因為已經達到了50%的門檻2100(1400+700=2100)。\n例4-B:同樣是1400的開池玩家，B(剩餘籌碼量較大)丟出一枚1000和兩枚500籌碼。由於未達到50%的門檻\n2100，因此應視為跟注。注意:在範例4-A和4-B中，如果玩家B丟出自己最後的籌碼，則將視為全押。",
		"bodyen": "“A: If facing a bet, unless raise or all-in is declared first, a multiple-chip bet (including a bet of\nyour last chips) is a call if every chip is needed to make the call; i.e. removal of just one of the\nsmallest chips leaves less than the call amount. B: If every chip is not needed to make the call;\ni.e. removal of just one of the smallest chips leaves the call amount or more: 1) if the player has\nchips remaining, the bet is governed by the 50% standard in Rule 43; 2) if the player’s last chips\nare bet he or she is all-in whether reaching the 50% threshold or not.”\nExample 1: There is not one chip that can be removed and still leave the call amount.\n1-A: Player A opens post flop for 1200, B silently puts out two 1000’s. This is a call because\nneither chip can be removed and still leave at least 1200.\n1-B: NLHE, blinds 250-500. Preflop the UTG raises 600 to total of 1100. The UTG+1 silently puts\nout one 500 and one 1000 chip. This is a call because neither the 500 nor the 1000 can be\nremoved and still leave at least 1100.\nExample 2: Same as 1-B above except the UTG+1 puts out one 1000 and five 100s silently.\nFour of the 100s could be removed and still leave the 1100 call amount. Therefore, this would be\nsubject to the 50% standard in Rule 43: the minimum raise is 600, 50% of 600 is 300, therefore,\nif the UTG+1 puts out 1400 or more, he will be held to making a full raise to 1700 total. Since the\nUTG put out 1500 he must raise in this example.\nExample 3: Same as 2 above except the UTG+1 puts out one 1000 and three 100s silently. Two\nof the 100s can be removed and still leave the 1100 call amount therefore this is subject to Rule\n43. Since the player did not put out at least 50% of a minimum raise, this bet is ruled a call and\n200 is returned to the player.\nExample 4: Multiple-chip bet of all chips. A) If all chips are needed to make the call, this is\ntreated exactly the same as a player with chips behind (See example 1 above). B) If removing\njust one of the smallest chips leaves the call amount or more, the player is all-in regardless of\nwhether the bet reaches the 50% raise standard.\nExample 4-A: A opens for 1400, B (with remaining chips behind in large chip stack) silently\npushes out one 1000 and three 500’s. This is a mandatory min-raise to 2800 because the 50%\nthreshold of 2100 (1400+700=2100) is reached.\nExample 4-B: Same 1400 opener, B (with remaining chips behind in large chip stack) puts out\none 1000 and two 500s. This is a call because it is short of the 50% threshold of 2100. NOTE: In\nboth example 4-A and 4-B, Player B would be all-in if putting out his or her last chips."
	},
	{
		"group": "extra",
		"key": "add46",
		"number": "§46",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §46",
		"sectionen": "Addendum Rule 46",
		"titlezh": "先前的下注未拉回，情況範例。",
		"titleen": "Prior Bet Chips Not Pulled In, situation examples.",
		"bodyzh": "情況1:如果之前的籌碼不足以覆蓋跟注，且沒有跟注。例如:盲注25-50，大盲玩家放盲注兩枚25，按鈕位加注到\n600(加注大盲玩家550)。\n1:增加一枚超額籌碼即為跟注(將一枚1000面額籌碼放到兩枚25面額籌碼上)。\n2:如果需要所有新籌碼都跟注，則添加多個新籌碼也算跟注:a)將兩枚500面額籌碼放到兩枚25面額籌碼中，\n或b)將一枚100和一枚500面額籌碼放入兩枚25面額的籌碼中。在這兩個例子中，所有新籌碼需要將籌碼\n與先前的籌碼結合才能進行跟注。\n3:如果無需最小籌碼之一即可跟注，則添加多個新籌碼屬於§45中的多籌碼下注(將一枚1000和500籌碼放在\n兩枚25籌碼上，總下注金額為1550)。根據§45，如果默默的多籌碼下注達到50%的門檻，則視為加注；否則，\n視為跟注。\n情況2:如果先前的籌碼沒有覆蓋跟注並且全部撤回:\n1移) 除所有先前的籌碼並添加額外的籌碼即為跟注(撤回兩枚25，添加面額1000籌碼)。\n2)移除所有先前的籌碼並添加多個新籌碼是符合§45的下注(撤回兩枚25，添加兩枚或更多新籌碼)。\n情況3:如果先前的籌碼被部分撤回(無論是否覆蓋跟注金額)\n1)部分移除先前的籌碼(撤回一個25，將另外25留在外面，添加任何新籌碼，是規則45多籌碼下注(如果達到\n50%則加注，否則跟注)。\n情況4:如果先前的籌碼足以覆蓋跟注金額，則根據§45，添加任何新籌碼均視為多籌碼下注。例如:50-100，大\n盲注玩家下注1000籌碼。翻牌前加注至700(大盲注玩家加注600)。先前的1000籌碼足以覆蓋加注金額，因\n此根據規則45，添加任何新籌碼均視為多籌碼下注。無論最初下注的1000籌碼是否被收回或保留，此規則\n均適用。\n情況5:無論上述情況如何，將所有籌碼組合併向前推或拋的動作均可解釋為根據§45認定為有意下注所有籌碼。",
		"bodyen": "Situation 1: If prior chips don’t cover the call AND are left alone. Ex: THE 25-50, the BB posts\ntwo 25’s, button raises to 600 total (550 more to BB).\n1: Adding an overchip is a call (drop a 1k chip onto the two 25’s).\n2: Adding multiple new chips is a call if all new chips are needed to call a) drop two 500’s onto\nthe two 25’s or b) drop a 100 and 500 chip onto the two 25’s. In these two examples all new\nchips when combined with the prior chips are needed to make the call.\n3: Adding multiple new chips is a Rule 45 multiple chip bet if one of the smallest new chips is not\nneeded to make the call (drop a 1k and 500 chip onto the two 25’s is a total bet of 1550). Per\nRule 45, a silent multi-chip bet is a raise if it hits the 50% threshold; otherwise it is a call.\nSituation 2: If prior chips don’t cover the call AND are fully pulled back:\n1) Removing all prior chips and adding an overchip is a call (pull back the two 25’s, add 1k chip).\n2) Removing all prior chips and adding new multiple chips is a Rule 45 bet (pull back two 25’s,\nadd two or more new chips).\nSituation 3: if prior chip(s) are partly pulled back (whether or not they cover the call amount)\n1) Partial removal of prior chips (pull back one 25, leave the other 25 out, add any new chip(s), is\na Rule 45 multiple-chip bet (a raise if hitting 50%, otherwise a call).\nSituation 4: If prior chip(s) cover the call amount, adding any new chip(s) is a Rule 45 multiple\nchip bet. Ex: THE 50-100, BB posts one 1k chip. Pre-flop raise to 700 (600 more to BB). The 1k\nprior chip covers the raise, thus adding any new chip(s) is a Rule 45 bet of all chips. This\napplies whether or not the initial 1k posted is pulled back or left alone.\nSituation 5: Regardless of the above, the gesture of combining and pushing or tossing all chips\nforward may be interpreted as intent to bet all chips under Rule 45."
	},
	{
		"group": "extra",
		"key": "add47",
		"number": "§47",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §47",
		"sectionen": "Addendum Rule 47",
		"titlezh": "重新開始下注",
		"titleen": "Re-opening the bet.",
		"bodyzh": "例1.多個短籌碼全押下注，累計等於全額加注，因此重新開始下注:\nNLHE，盲注50-100。翻牌後，A開注，最低下注100。\nB全押，總籌碼125。C跟注125，\nD全押200，E跟注200。\n行動回到A，他面臨總共100的加注。由於100是全額加注，因此下注重新開放，A可以棄牌、跟注或加注。要注\n意的是，B的25加注和D的75加注本身都不是全額加注，但加起來才算全額加注，因此下注重新開放給「行動\n返回時至少面臨全額加注的玩家」。\n例1-A:在上述例1的結尾，A順利地叫出了總數200(給他另外100)。\n現在下注的是C，他只需要加注75。C之前跟注125，現在需要加注200(加注75)。C必須至少加注225才能重\n新下注。由於75並非全額加注，C的下注不會被重新下注，他可以選擇75跟注或棄牌，但不能加注。\n例1-B:在上述例1的結尾，A加注最低金額(100)，使C的總籌碼數達到300。C已跟注125，因此C需要再跟\n注175。175超過了最大限度的加注。由於C已經行動，並且「現在至少面臨最大限度的加注」，因此下注機\n會重新向C開放，此時C可以棄牌、跟注或再加注。\n例2:多次短全押，最小加注是最後一次完全有效的下注或加注。\nNLHE，盲注50-100。翻牌後A開池300，B全押500，C全押650，D全押800，E跟注800。玩家F的最低加注計\n算如下。開池下注300設定了初始最低加注。由於沒有玩家全押超過300，F的最低加注仍為300。F可以跟注\n800，也可以加注到至少1100。另請參閱附錄說明中的§43，範例2。\n例3.短全押，2種場景。\nNLHE，盲注2000-4000。翻牌前A跟注大盲注4000。B棄牌，C全押7500(比大盲注4000多3500)。棄牌輪到小\n盲注，小盲注也棄牌。\n例3-A:尚未行動的大盲注玩家(BB)需要加注3500。大盲注玩家可以棄牌、跟注3500或加注到至少4000，總計\n11500。如果大盲注玩家跟注，A需要加注3500。A已經行動，並且面臨3500，這並非全額加注。因此，A只能\n棄牌或跟注3500，而不能加注，因為「當行動回到他手中時，這並非至少全額下注」。\n例3-B:大盲注玩家加注最低金額(4000)，總計11500。此時A的下注金額為7500，由於7500超過了最低加注\n額，因此A可以重新下注，可以選擇棄牌、跟注或再加注。",
		"bodyen": "Example 1. Multiple short all-in wagers that cumulatively equal a full raise and therefore re-open\nbetting:\nNLHE, Blinds 50-100. Post-flop, A opens betting for the 100 minimum.\nB goes all in for a total of 125. C calls the 125,\nD goes all in for 200 total and E calls 200.\nAction returns to A who is facing a total raise of 100. Since 100 is a full raise, the betting is re-\nopened for A who can fold, call, or raise here. Note that neither B’s increment of 25 or D’s\nincrement of 75 is by itself a full raise, but when added together they total a full raise and thus re-\nopen the betting to “a player who is facing at least a full raise when the action returns”.\nExample 1-A: At the end of Example 1 above, A smooth calls the 200 total (another 100 to him).\nThe bet is now on C who only faces a 75 increment. C called 125 previously and now faces 200\ntotal (75 more). C must face at least 225 total to re-open betting. Because 75 is not a full raise,\nbetting for C is not re-opened and C can either call with 75 more or fold, he cannot raise.\nExample 1-B: At the end of Example 1 above, A raises the minimum (100), and makes it 300\ntotal to C. C already has called 125 so it’s an additional 175 for C to call. 175 is more than a full\nraise. Since C already acted and is “now facing at least a full raise”, the betting is re-opened to C\nwho can fold, call, or re-raise here.\nExample 2: Multiple short all-ins, the min-raise is the last full valid bet or raise.\nNLHE, Blinds 50-100. Post-flop A opens for 300, B pushes all-in for 500 total, C goes all-in for\n650 total, D goes all-in for 800 total, E calls 800. What is the min raise for Player F? The opening\nbet (300) sets the initial min raise. Because no single player was all-in for more than 300, the min\nraise for F remains 300. F can either smooth call 800 or raise to at least 1100. See also Rule 43,\nExample 2 in Illustration Addendum.\nExample 3. Short all-in, 2 scenarios.\nNLHE, Blinds 2000-4000. Pre-flop A calls the BB for 4000. B folds and C pushes all-in for 7500\ntotal (an increment of 3500 above the 4000 BB). It’s folded around to the SB who also folds.\nExample 3-A. It’s 3500 more to the BB who has not yet acted on his option. The BB can fold,\nsmooth call the 3500, or raise by at least 4000 for a total of 11,500. The BB smooth calls and it’s\n3500 more to A. A has already acted and is facing 3500 which is not a full raise. Therefore, A\ncan only fold or call the 3500, he cannot raise because it is not “at least a full bet when the action\nreturns to him”.\nExample 3-B. The BB raises the minimum (4000), for a total of 11500. It is now 7500 to A and\nbecause 7500 is more than a full minimum raise, betting is now re-opened for A who can fold,\ncall, or re-raise."
	},
	{
		"group": "extra",
		"key": "add51",
		"number": "§51",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §51",
		"sectionen": "Addendum Rule 51",
		"titlezh": "每輪中的約束性聲明/不足額跟注",
		"titleen": "Binding Declarations / Undercalls in Turn",
		"bodyzh": "例1:NLHE，盲注1000-2000。翻牌後，A開池2000，B加注到8000，C默默地推下2000。C低跟了B的下\n注。根據§51-B，由於B不是開池者(A才是)，且該輪仍為多人遊戲，賽事總監可自行決定要求C完全跟\n注，或允許C放棄2000的低跟注並棄牌。\n例2:NLHE，盲注1000-2000。翻牌後剩餘4名玩家。A開池下注8000，B默默下注2000。根據§51-B，B\n的開池下注跟注不足，必須全額跟注8000。\n例3:NLHE，盲注1000-2000。翻牌後，A開池2000，B加注到8000，C聲明「跟注」。根據§51-A，C已\n在輪次中做出一般性口頭聲明(「跟注」)。C有義務跟注B的全部8000下注。\n例4:NLHE，盲注200-400。開注者下注400，玩家A加注到1200，玩家B默默地拿出一個500的籌碼。發\n牌員告訴B 1200，B棄牌。根據TD的判斷，B放棄400並返回100。",
		"bodyen": "Example 1: NLHE, blinds 1000-2000. Post-flop, A opens for 2000, B raises to 8000, C pushes\nout 2000 silently. C has undercalled B’s bet. Per Rule 51-B, because B is not the opener (A is)\nand the round is still multi-way, at TD’s discretion C may be required to make a full call or\nallowed to forfeit the 2000 undercall and fold.\nExample 2: NLHE, blinds 1000-2000. Post-flop 4 players remain. A opens for 8000, B silently\nputs out 2000. Per Rule 51-B, B undercalled the opening bet and must make a full call of 8000.\nExample 3: NLHE, blinds 1000-2000. Post-flop, A opens for 2000, B raises to 8000, C declares\n“call”. Per Rule 51-A, C has made a general verbal declaration (“call”) in turn. C is obligated to\ncall B’s full bet of 8000.\nExample 4: NLHE, blinds 200-400. Opener bets 400, player A raises to 1200 and Player B puts\nout one 500 chip silently. Dealer tells B it’s 1200 and B folds. At TD’s discretion B forfeits 400\nand 100 is returned."
	},
	{
		"group": "extra",
		"key": "add52b",
		"number": "§52-B",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §52-B",
		"sectionen": "Addendum Rule 52-B",
		"titlezh": "底池限注遊戲中的下注金額錯誤",
		"titleen": "Incorrect Bet Amounts, Pot-Limit Games",
		"bodyzh": "例1: PLO，盲注500-1000。翻牌後底池總額為10,500。玩家A想下注底池，並詢問發牌員數牌。發牌\n員回答「九千五百」。A推牌9,500。玩家B棄牌，玩家C跟注9,500。在最初的錯誤下注之後，發生了\n實質行動。發牌員隨後意識到A的底池下注應該是10,500。由於報出的金額小於底池金額，並且發生了\n實質行動，9,500的下注具有約束力，不會增加到10,500。\n例2:與例1相同，玩家B棄牌，然後發牌員意識到A的底池下注應該是10,500。由於沒有實質行動，A必\n須將總下注額增加到10,500。\n例3:PLO，盲注500-1000。翻牌後底池總額為10,500。玩家A想下注，並詢問發牌員數牌。發牌員回答\n「一萬一千五百」。A推牌11,500。玩家B棄牌，玩家C和D都跟注11,500。在燒牌並翻開下一張牌之前，\n發牌員意識到最初的下注是非法超額下注。儘管出現了實質行動，但由於該下注非法，所有在當前街上\n跟注的玩家的下注金額將被降至10,500。如果下一張牌發出，錯誤將生效。",
		"bodyen": "Example 1: PLO, 500-1000 blinds. Post-flop the pot totals 10,500. Player A wants to bet the pot\nand asks the dealer for a count. Dealer replies “nine thousand five hundred”. A pushes out\n9,500. Player B folds and Player C calls 9,500. Substantial action has occurred after the initial\nerroneous bet. The dealer then realizes A’s pot bet should have been 10,500. Because the\nquoted amount was less than the pot and substantial action has occurred, the 9,500 bet is\nbinding and will not be increased to 10,500.\nExample 2: Same as example 1 above, Player B folds then the dealer realizes A’s pot bet\nshould have been 10,500. Substantial action has not occurred, so A must increase his or her bet\nto 10,500 total.\nExample 3: PLO, 500-1000 blinds. Post-flop the pot totals 10,500. Player A wants to bet the pot\nand asks the dealer for a count. Dealer replies “eleven thousand five hundred”. A pushes out\n11,500. Player B folds, Player C and D both call 11,500. Before burning and turning the next\ncard, the dealer realizes the initial bet was an illegal overbet. Despite substantial action\noccurring, because the bet was illegal it will be reduced to 10,500 for all players calling anywhere\non the current street. If the next card is dealt the error will stand."
	},
	{
		"group": "extra",
		"key": "add53a",
		"number": "§53-A",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §53-A",
		"sectionen": "Addendum Rule 53-A",
		"titlezh": "不依序行動(OOT)",
		"titleen": "Action Out of Turn (OOT)",
		"bodyzh": "例1:50-100。翻牌後3號位的玩家加注300，4號位的玩家棄牌，5號位的玩家行動，6號位的玩家宣告\n「加注到800」。\n步驟1:行動回到順序正確的玩家(5號位)，該玩家面臨300的下注。\n步驟2:如果5號位的玩家跟注或棄牌，則行動(300下注)保持不變，6號位玩家的OOT加注(加注至800)\n具有約束力。但是，如果5號位的玩家加注(例如加注至600)，則對6號位玩家的行動將從300下注變為\n600下注。如果行動發生變化，800籌碼可能會退還給6號位的玩家，他可以選擇:跟注600、再加注至\n至少900或棄牌。\n例2:50-100。翻牌後3號位的玩家過牌，4號位的玩家過牌，當6號位的玩家宣告「過牌」時，5號位的\n玩家開始行動。\n步驟1:行動回到順序正確的、沒有面對下注的玩家(5號位)。\n步驟2:如果5號位的玩家過牌，則行動(過牌)保持不變，6號位玩家的OOT過牌仍然有效。但是，如果5\n號位的玩家下注(例如300)，則對6號位玩家的行動就從過牌變成下注300。如果行動發生變化，6號位\n的玩家將擁有所有選項:跟注300、加注到至少600或棄牌。",
		"bodyen": "Example 1: THE 50-100. Post flop Seat 3 opens for 300, Seat 4 folds, action is on Seat 5 when\nSeat 6 declares “raise to eight hundred”.\nStep 1: Action backs up to the correct player in order (Seat 5) who is facing a bet of 300.\nStep 2: If Seat 5 calls or folds then the action (a 300 bet) has not changed and Seat 6’s OOT\nraise is binding (raise to 800). However, if Seat 5 raises, (say, to 600 total), then the action to\nSeat 6 has changed from a 300 bet to a 600 bet. If action changes, the 800 chips may be\nreturned to Seat 6 who has all options open: call 600, re-raise to at least 900, or fold.\nExample 2: THE 50-100. Post flop Seat 3 checks, Seat 4 checks, action is on Seat 5 when Seat\n6 declares “check”.\nStep 1: Action backs up to the correct player in order (Seat 5) who is not facing a bet.\nStep 2: If Seat 5 checks then the action (a check) has not changed and Seat 6’s OOT check is\nbinding. However, if Seat 5 bets, (say, 300), then the action to Seat 6 has changed from a check\nto a 300 bet. If action changes, then Seat 6 has all options open: call 300, raise to at least 600,\nor fold."
	},
	{
		"group": "extra",
		"key": "add53b",
		"number": "§53-B",
		"sectionkey": "Addendum",
		"sectionzh": "附錄 §53-B",
		"sectionen": "Addendum Rule 53-B",
		"titlezh": "不依序實質行動(OOT)。",
		"titleen": "Substantial Action Out of Turn (OOT). A player skipped by OOT action must",
		"bodyzh": "因不依序行動而被跳過的玩家必須捍衛其行動權。若在合理的時間內，被跳過的玩家在其左側發生不依\n序實質行動(參見§36)時仍未發言，則該不依序行動具有約束力。應請裁判到場裁定如何處理被跳過玩\n家的手牌。\n例1:NLHE，盲注100-200。UTG(3號位)下注600。5號位的玩家越位跟注600時，4號位的玩家被跳過。\n6號位的玩家思考片刻後棄牌。此時4號位左側已有兩名涉及籌碼行動的玩家。兩名涉及籌碼行動的玩\n家構成實質行動(§36)。此外，4號位的玩家已有合理時間發言並提醒發牌員自己被跳過。由於發生越\n位實質行動，5號位玩家的越位跟注現在具有約束力，6號位玩家的越位棄牌也具有約束力(§58)。應請\n裁判到場裁定如何處理4號位玩家的手牌。\n例2:NLHE，盲注100-200。剩餘四位玩家看轉牌。發牌員亮出轉牌後，UTG(3號位)開注600。5號位的\n玩家越位過牌且6號位的玩家越位跟注600時，4號位的玩家被跳過。應請裁判到場裁定如何處理4號位\n玩家的手牌。",
		"bodyen": "defend his right to act. If there is reasonable time and the skipped player has not spoken up by\nthe time substantial action (see Rule 36) OOT occurs to his left, the OOT action is binding. The\nfloor will be called to render a decision on how to treat the skipped hand.\nExample 1: NLHE, blinds 100-200. UTG (Seat 3) makes it 600. Seat 4 is skipped when Seat 5\ncalls 600 OOT. Seat 6 thinks for a moment then folds. There are now two players acting with\nchips involved to the left of Seat 4. Two players with chips qualifies as substantial action (Rule\n36). Also, Seat 4 has had reasonable time to speak up and bring it to the dealer’s attention that\nhe has been skipped. The OOT call by Seat 5 is now binding due to substantial action OOT, and\nthe OOT fold by Seat 6 is binding (Rule 58). The floor is called to make a decision on the fate of\nSeat 4’s hand.\nExample 2: NLHE, blinds 100-200. Four players remain to see the turn. After the dealer tables\nthe turn card, the UTG (Seat 3) opens betting for 600. Seat 4 is skipped when Seat 5 checks and\nSeat 6 calls 600 OOT. The floor is called to make a decision on the fate of Seat 4’s hand."
	}
]

function tdatext(key){
	let lang=tdacurrentlang
	if(!TDAUILIST[lang]){
		lang="zhtw"
	}
	return TDAUILIST[lang][key]||key
}

function tdaprimary(item,key){
	let value=item[key+"zh"]
	if(tdacurrentlang=="en"){
		value=item[key+"en"]
	}
	return value||""
}

function tdasecondary(item,key){
	let value=item[key+"en"]
	if(tdacurrentlang=="en"){
		value=item[key+"zh"]
	}
	return value||""
}

function tdasectionvalue(item){
	let value=item["sectionzh"]
	if(tdacurrentlang=="en"){
		value=item["sectionen"]
	}
	return value
}

function tdaitemid(item){
	return "tdaitem"+item["key"]
}

function tdaitembykey(key){
	let item=null
	for(let i=0;i<TDAITEMLIST.length;i=i+1){
		if(TDAITEMLIST[i]["key"]==key){
			item=TDAITEMLIST[i]
			i=TDAITEMLIST.length
		}
	}
	return item
}

function tdaloadcompareitemlist(){
	let itemlist={}
	let text=weblsget(WEBLSNAME+"tdarulescompareitemlist")||""
	if(text!=""){
		let keylist=text.split(",")
		for(let i=0;i<keylist.length;i=i+1){
			if(keylist[i]!=""){
				itemlist[keylist[i]]=true
			}
		}
	}
	return itemlist
}

function tdastorecompareitemlist(){
	let keylist=[]
	for(let i=0;i<TDAITEMLIST.length;i=i+1){
		let key=TDAITEMLIST[i]["key"]
		if(tdacompareitemlist[key]){
			keylist.push(key)
		}
	}
	weblsset(WEBLSNAME+"tdarulescompareitemlist",keylist.join(","))
}

function tdacleanzhpart(value){
	let text=String(value||"")
	text=text.replace(/§RP-14隨機性可應用於特殊情況隨機性原則/g,"[[TDAREF:RP-14:§RP-14隨機性原則]]")
	text=text.replace(/§RP-14隨機性原則/g,"[[TDAREF:RP-14:§RP-14隨機性原則]]")
	text=text.replace(/§RP-5提前發牌/g,"[[TDAREF:RP-5:§RP-5提前發牌]]")
	text=text.replace(/§RP-4無序牌堆/g,"[[TDAREF:RP-4:§RP-4無序牌堆]]")
	text=text.replace(/(實質[行行]動)\(SA\((?:参見|參見)§\(規則符號，下同\)([0-9]+)\)\)/g,"[[TDAREF:$2:$1]]")
	text=text.replace(/SA\(§([0-9]+)([^)]*)\)/g,"[[TDAREF:$1:§$1$2]]")
	text=text.replace(/要求計時\(call time\(見§([0-9]+)\)\)/g,"[[TDAREF:$1:要求計時]]")
	text=text.replace(/([\u3400-\u9fff行]+)\([A-Za-z][^()]*?\((?:見|参見|參見)§([0-9]+)\)\)/g,"[[TDAREF:$2:$1]]")
	text=text.replace(/\([A-Za-z][^)]*\)/g,"")
	text=text.replace(/§\(規則符號，下同\)([0-9]+)/g,"§$1")
	text=text.replace(/Floor/g,"裁判")
	text=text.replace(/\bTD\b/g,"賽事總監")
	text=text.replace(/SA/g,"實質行動")
	text=text.replace(/不依序行動\(越位、out of turn，OOT\)/g,"不依序行動(越位)")
	text=text.replace(/(^|\n)([A-Z])[:：、)]\s*/g,"$1$2: ")
	text=text.replace(/(^|\n)\s*([0-9]+)[.)、]\s*/g,"$1    $2. ")
	text=text.replace(/(^|\n)\s*(i|ii|iii|iv|v|vi|vii|viii|ix|x)[.)、]\s*/g,"$1        $2) ")
	return text
}

function tdacleanzh(value){
	let text=String(value||"")
	let partlist=text.split(/(\[\[TDAREF:[^\]]+\]\])/g)
	for(let i=0;i<partlist.length;i=i+1){
		if(partlist[i].indexOf("[[TDAREF:")!=0){
			partlist[i]=tdacleanzhpart(partlist[i])
		}
	}
	return partlist.join("")
}

function tdanormalizeline(value,language){
	let text=String(value||"")
	let jointext=""
	if(language=="en"){
		jointext=" "
		text=text.replace(/-\n/g,"-")
	}
	text=text.replace(/\r\n/g,"\n")
	text=text.replace(/\n([A-Z])[:：、)]/g,"[[TDALINE]]$1:")
	text=text.replace(/\n((?:譯註|註)[:：])/g,"[[TDANOTE]]$1")
	text=text.replace(/\n([0-9]+[.)、])/g,"[[TDALIST]]$1")
	text=text.replace(/\n(步驟[0-9]+[:：])/g,"[[TDALIST]]$1")
	text=text.replace(/\n(例[0-9一二三四五六七八九十-])/g,"[[TDABLOCK]]$1")
	text=text.replace(/\n(Example [0-9])/g,"[[TDABLOCK]]$1")
	text=text.replace(/\n(Step [0-9]+[:：])/g,"[[TDALIST]]$1")
	text=text.replace(/\n/g,jointext)
	text=text.replace(/\[\[TDALINE\]\]/g,"\n")
	text=text.replace(/\[\[TDANOTE\]\]/g,"\n")
	text=text.replace(/\[\[TDABLOCK\]\]/g,"\n\n")
	text=text.replace(/\[\[TDALIST\]\]/g,"\n    ")
	text=text.replace(/\n{3,}/g,"\n\n")
	return text
}

function tdabuttonclass(activeed){
	let classvalue=TDABUTTONCLASS+TDABUTTONNORMAL
	if(activeed){
		classvalue=TDABUTTONCLASS+TDABUTTONACTIVE
	}
	return classvalue
}

function tdasideclass(activeed){
	let classvalue=TDASIDEBUTTONCLASS+TDASIDENORMAL
	if(activeed){
		classvalue=TDASIDEBUTTONCLASS+TDASIDEACTIVE
	}
	return classvalue
}

function tdarefkey(ref){
	let key=""
	let group="rules"
	let value=String(ref||"")
	if(value.indexOf("ADD-")==0){
		group="extra"
		key="add"+value.replace("ADD-","").split("-")[0].toLowerCase().replace(/[^a-z0-9]+/g,"")
	}else if(value.indexOf("RP-")==0){
		group="extra"
		key="rp"+value.replace("RP-","").split("-")[0].toLowerCase().replace(/[^a-z0-9]+/g,"")
	}else{
		key="rule"+value.split("-")[0].toLowerCase().replace(/[^a-z0-9]+/g,"")
	}
	return {
		"group": group,
		"key": key
	}
}

function tdareflabel(ref,label,language){
	let text=String(label||"")
	let lang=language||tdacurrentlang
	let target=tdarefkey(ref)
	let item=tdaitembykey(target["key"])
	let bareed=false
	let suffix=""
	let matched=String(ref||"").match(/^((?:RP-)?[0-9]+)(-[A-Z])$/)
	if(matched){
		suffix=matched[2]
	}
	if(/^(?:§\s*)?(?:Rule |Recommended Procedure )?(RP-[0-9]+(?:-[A-Z])?|[0-9]+(?:-[A-Z])?)$/.test(text)){
		bareed=true
	}
	if(item&&bareed){
		if(suffix!=""){
			text=text.replace(suffix,"")
		}
		if(lang=="en"){
			if(item["number"].indexOf("RP-")==0){
				text="RP-"+item["number"].replace("RP-","")+" "+item["titleen"]+suffix
			}else{
				text="Rule "+item["number"]+" "+item["titleen"]+suffix
			}
		}else{
			text=text+tdacleanzh(item["titlezh"])+suffix
		}
	}
	return text
}

function tdasearchregexptext(value){
	let text=String(value||"")
	text=text.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")
	return text
}

function tdahighlighthtml(value,search){
	let html=String(value||"")
	if(search!=""){
		let pattern=tdasearchregexptext(search)
		let partlist=html.split(/(<[^>]+>)/g)
		for(let i=0;i<partlist.length;i=i+1){
			if(partlist[i].indexOf("<")!=0){
				let regexp=new RegExp(pattern,"gi")
				partlist[i]=partlist[i].replace(regexp,function(match){
					return `<span class="mx-0.5 rounded bg-yellow-400/20 px-1 text-yellow-100">${match}</span>`
				})
			}
		}
		html=partlist.join("")
	}
	return html
}

function tdalinkhtml(ref,label,language){
	let target=tdarefkey(ref)
	let text=tdareflabel(ref,label,language)
	let classvalue="font-bold text-emerald-300 underline decoration-emerald-500/60 underline-offset-4 hover:text-emerald-200"
	return `<a href="${escapehtml(tdahashurl(target["key"]))}" class="${escapehtml(classvalue)}" data-tdajump="${escapehtml(target["key"])}" data-tdajumpgroup="${escapehtml(target["group"])}">${escapehtml(text)}</a>`
}

function tdalinksequencehtml(value,language,prefix){
	let text=String(value||"")
	let html=""
	let start=0
	let regexp=/(\s*(?:、|,|，|和|及|and|or)\s*)?(RP-[0-9]+(?:-[A-Z])?|[0-9]+(?:-[A-Z])?)/g
	let matched=null
	for(matched=regexp.exec(text);matched;matched=regexp.exec(text)){
		html=html+text.slice(start,matched.index)
		if(matched[1]){
			html=html+matched[1]
		}
		let label="§"+matched[2]
		if(language=="en"){
			if(matched[2].indexOf("RP-")==0){
				label=matched[2]
			}else{
				label=(prefix||"Rule ")+matched[2]
			}
		}
		html=html+tdalinkhtml(matched[2],label,language)
		start=regexp.lastIndex
	}
	html=html+text.slice(start)
	return html
}

function tdareplacenonanchorhtml(value,regexp,handler){
	let partlist=String(value||"").split(/(<a\b[^>]*>.*?<\/a>)/g)
	for(let i=0;i<partlist.length;i=i+1){
		if(partlist[i].indexOf("<a")!=0){
			partlist[i]=partlist[i].replace(regexp,handler)
		}
	}
	return partlist.join("")
}

function tdalinkplainreferences(text,language){
	let partlist=String(text||"").split(/(<a\b[^>]*>.*?<\/a>)/g)
	for(let i=0;i<partlist.length;i=i+1){
		if(partlist[i].indexOf("<a")!=0){
			partlist[i]=tdareplacenonanchorhtml(partlist[i],/§\s*((?:RP-[0-9]+(?:-[A-Z])?|[0-9]+(?:-[A-Z])?)(?:(?:、|,|，|和|及)\s*(?:RP-[0-9]+(?:-[A-Z])?|[0-9]+(?:-[A-Z])?))*)/g,function(match,ref){
				return tdalinksequencehtml(ref,language,"Rule ")
			})
			if(language=="en"){
				partlist[i]=tdareplacenonanchorhtml(partlist[i],/\bRules?\s+((?:[0-9]+(?:-[A-Z])?|RP-[0-9]+(?:-[A-Z])?)(?:(?:,| and | or )\s*(?:[0-9]+(?:-[A-Z])?|RP-[0-9]+(?:-[A-Z])?))*)/g,function(match,ref){
					return tdalinksequencehtml(ref,language,"Rule ")
				})
				partlist[i]=tdareplacenonanchorhtml(partlist[i],/\bRecommended Procedures?\s+((?:RP-)?[0-9]+(?:-[A-Z])?)/g,function(match,ref){
					let target=ref
					if(target.indexOf("RP-")!=0){
						target="RP-"+target
					}
					return tdalinkhtml(target,"Recommended Procedure "+ref,language)
				})
			}
			partlist[i]=tdareplacenonanchorhtml(partlist[i],/(^|[^#A-Za-z0-9])\b(RP-[0-9]+(?:-[A-Z])?)\b/g,function(match,prefix,ref){
				return prefix+tdalinkhtml(ref,ref,language)
			})
		}
	}
	return partlist.join("")
}

function tdarendertext(value,language,search){
	let text=String(value||"")
	if(language=="zh"){
		text=tdacleanzh(text)
	}
	text=escapehtml(text)
	text=text.replace(/\[\[TDAREF:([^:]+):([^\]]+)\]\]/g,function(match,ref,label){
		return tdalinkhtml(ref,label,language)
	})
	text=tdalinkplainreferences(text,language)
	text=tdahighlighthtml(text,search)
	return text
}

function tdarenderstructuredtext(value,language,search){
	let text=String(value||"")
	if(language=="zh"){
		text=tdacleanzh(text)
	}
	let linelist=text.split("\n")
	let html=""
	for(let i=0;i<linelist.length;i=i+1){
		let line=linelist[i]
		if(line.trim()==""){
			html=html+`<div class="h-3"></div>`
		}else{
			let matched=line.match(/^\s*([A-Z])[:：]\s*(.*)$/)
			if(matched){
				html=html+`<div class="grid grid-cols-[1rem_minmax(0,1fr)] gap-1"><span class="text-zinc-300">${escapehtml(matched[1])}:</span><span>${tdarendertext(matched[2],language,search)}</span></div>`
			}else{
				matched=line.match(/^\s*(譯註)[:：]\s*(.*)$/)
				if(matched){
					html=html+`<div class="mt-2 grid grid-cols-[2rem_minmax(0,1fr)] gap-1 text-[13px] italic leading-6 text-zinc-500"><span>${escapehtml(matched[1])}:</span><span>${tdarendertext(matched[2],language,search)}</span></div>`
				}else{
					matched=line.match(/^\s*([0-9]+)[.)、]\s*(.*)$/)
					if(matched){
						html=html+`<div class="grid grid-cols-[1rem_minmax(0,1fr)] gap-1 pl-4"><span class="text-zinc-300">${escapehtml(matched[1])}.</span><span>${tdarendertext(matched[2],language,search)}</span></div>`
					}else{
						matched=line.match(/^\s*(i|ii|iii|iv|v|vi|vii|viii|ix|x)[.)、]\s*(.*)$/)
						if(matched){
							html=html+`<div class="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-1 pl-8"><span class="text-zinc-300">${escapehtml(matched[1])})</span><span>${tdarendertext(matched[2],language,search)}</span></div>`
						}else{
							html=html+`<div>${tdarendertext(line,language,search)}</div>`
						}
					}
				}
			}
		}
	}
	return html
}

function tdarenderlangbar(){
	let bar=domgetid("tdalangbar")
	if(bar){
		let optionlist=[["zhtw",tdatext("zhtw")],["en",tdatext("en")]]
		let html=""
		for(let i=0;i<optionlist.length;i=i+1){
			let key=optionlist[i][0]
			html=html+`<input type="button" class="${escapehtml(tdabuttonclass(key==tdacurrentlang))}" data-tdalang="${escapehtml(key)}" value="${escapehtml(optionlist[i][1])}">`
		}
		bar.innerHTML=html
		let buttonlist=bar.querySelectorAll("[data-tdalang]")
		for(let i=0;i<buttonlist.length;i=i+1){
			buttonlist[i].addEventListener("click",function(){
				tdasetlanguage(this.getAttribute("data-tdalang")||"zhtw")
			})
		}
	}
}

function tdascrolltoelement(target,smoothed){
	if(target){
		let offset=84
		let nav=domgetid("navigationbar")
		if(nav){
			offset=Math.ceil(nav.getBoundingClientRect().height)+14
		}
		let top=target.getBoundingClientRect().top+window.pageYOffset-offset
		let behavior="auto"
		if(smoothed){
			behavior="smooth"
		}
		if(top<0){
			top=0
		}
		window.scrollTo({
			"top": top,
			"behavior": behavior
		})
	}
}

function tdascrolltokey(key,smoothed){
	let target=domgetid("tdaitem"+key)
	tdascrolltoelement(target,smoothed)
}

function tdahashurl(key){
	return window.location.pathname+window.location.search+"#tdaitem"+key
}

function tdascrolllater(key,smoothed){
	if(window.requestAnimationFrame){
		window.requestAnimationFrame(function(){
			tdascrolltokey(key,smoothed)
		})
	}else{
		setTimeout(function(){
			tdascrolltokey(key,smoothed)
		},20)
	}
}

function tdajumptokey(key,smoothed){
	let item=tdaitembykey(key)
	let searchinput=domgetid("tdasearch")
	let changed=false
	if(item){
		if(tdacurrentsection!=item["sectionkey"]){
			tdacurrentsection=item["sectionkey"]
			weblsset(WEBLSNAME+"tdarulessection",tdacurrentsection)
			changed=true
		}
	}else{
		if(tdacurrentsection!="all"){
			tdacurrentsection="all"
			weblsset(WEBLSNAME+"tdarulessection",tdacurrentsection)
			changed=true
		}
	}
	if(searchinput){
		if(searchinput.value!=""){
			searchinput.value=""
			changed=true
		}
	}
	if(changed){
		tdarender()
	}
	if(window.history&&window.history.replaceState){
		window.history.replaceState(null,"",tdahashurl(key))
	}
	tdascrolllater(key,smoothed)
}

function tdabindjumplink(){
	let linklist=document.querySelectorAll("[data-tdajump]")
	for(let i=0;i<linklist.length;i=i+1){
		linklist[i].addEventListener("click",function(event){
			event.preventDefault()
			let key=this.getAttribute("data-tdajump")||""
			tdajumptokey(key,true)
		})
	}
}

function tdabinditemcompare(){
	let buttonlist=document.querySelectorAll("[data-tdacompareitem]")
	for(let i=0;i<buttonlist.length;i=i+1){
		buttonlist[i].addEventListener("click",function(){
			let key=this.getAttribute("data-tdacompareitem")||""
			if(tdacompareitemlist[key]){
				delete tdacompareitemlist[key]
			}else{
				tdacompareitemlist[key]=true
			}
			tdastorecompareitemlist()
			tdarenderitemlist()
		})
	}
}

function tdagetsectionlist(){
	let sectionlist=[]
	for(let i=0;i<TDAITEMLIST.length;i=i+1){
		let item=TDAITEMLIST[i]
		if(sectionlist.indexOf(item["sectionkey"])==-1){
			sectionlist.push(item["sectionkey"])
		}
	}
	return sectionlist
}

function tdarendersectionnav(){
	let side=domgetid("tdasidenav")
	let sectionlist=tdagetsectionlist()
	let html=`<input type="button" class="${escapehtml(tdasideclass(tdacurrentsection=="all"))}" data-tdasection="all" value="${escapehtml(tdatext("all"))}">`
	for(let i=0;i<sectionlist.length;i=i+1){
		let key=sectionlist[i]
		let label=key
		if(key=="Addendum"){
			label="附錄"
			if(tdacurrentlang=="en"){
				label="Addendum"
			}
		}else{
			for(let j=0;j<TDAITEMLIST.length;j=j+1){
				if(TDAITEMLIST[j]["sectionkey"]==key){
					label=tdasectionvalue(TDAITEMLIST[j])
					j=TDAITEMLIST.length
				}
			}
		}
		html=html+`<input type="button" class="${escapehtml(tdasideclass(tdacurrentsection==key))}" data-tdasection="${escapehtml(key)}" value="${escapehtml(label)}">`
	}
	if(side){
		side.innerHTML=html
	}
	let buttonlist=document.querySelectorAll("[data-tdasection]")
	for(let i=0;i<buttonlist.length;i=i+1){
		buttonlist[i].addEventListener("click",function(){
			tdacurrentsection=this.getAttribute("data-tdasection")||"all"
			weblsset(WEBLSNAME+"tdarulessection",tdacurrentsection)
			tdarender()
			if(window.requestAnimationFrame){
				window.requestAnimationFrame(function(){
					tdascrolltoelement(document.querySelector("#tdarulelist article"),true)
				})
			}else{
				tdascrolltoelement(document.querySelector("#tdarulelist article"),true)
			}
		})
	}
}

function tdaitemcompared(item,globalcompared){
	let compared=false
	if(globalcompared){
		compared=true
	}else if(tdacompareitemlist[item["key"]]){
		compared=true
	}
	return compared
}

function tdaitemvisibletext(item,compared){
	let primarylang="zh"
	let secondarylang="en"
	if(tdacurrentlang=="en"){
		primarylang="en"
		secondarylang="zh"
	}
	let text=item["number"]+" "+tdasectionvalue(item)+" "+tdaprimary(item,"title")+" "+tdaprimary(item,"body")
	text=tdanormalizeline(text,primarylang)
	if(primarylang=="zh"){
		text=tdacleanzh(text)
	}
	if(compared){
		let secondarytext=tdasecondary(item,"title")+" "+tdasecondary(item,"body")
		secondarytext=tdanormalizeline(secondarytext,secondarylang)
		if(secondarylang=="zh"){
			secondarytext=tdacleanzh(secondarytext)
		}
		text=text+" "+secondarytext
	}
	return text.toLowerCase()
}

function tdaitemmatched(item,search,compared){
	let matched=true
	if(matched&&tdacurrentsection!="all"&&item["sectionkey"]!=tdacurrentsection){
		matched=false
	}
	if(matched&&search!=""){
		let hay=tdaitemvisibletext(item,compared)
		if(hay.indexOf(search)==-1){
			matched=false
		}
	}
	return matched
}

function tdasearchtext(){
	let text=""
	let searchinput=domgetid("tdasearch")
	if(searchinput){
		text=String(searchinput.value||"").trim().toLowerCase()
	}
	return text
}

function tdahandlesearchchange(){
	let search=tdasearchtext()
	if(search!=""&&tdacurrentsection!="all"){
		tdacurrentsection="all"
		tdarendersectionnav()
	}
	tdarenderitemlist()
}

function tdarender(){
	document.title=tdatext("title")+" - PokerTrace"
	innertext("#tdaeyebrow",tdatext("eyebrow"),false)
	innertext("#tdatitle",tdatext("title"),false)
	innertext("#tdadescription",tdatext("description"),false)
	innertext("#back",tdatext("back"),false)
	innertext("#tdasearchlabel",tdatext("searchlabel"),false)
	innertext("#tdacomparelabel",tdatext("compare"),false)
	innertext("#tdapdftitle",tdatext("pdftitle"),false)
	innertext("#tdapdfnote",tdatext("pdfnote"),false)
	innertext("#tdadownload",tdatext("download"),false)
	innertext("#tdaopennewtab",tdatext("opennewtab"),false)
	innertext("#tdaempty",tdatext("empty"),false)
	let topbutton=domgetid("tdatopbutton")
	if(topbutton){
		topbutton.setAttribute("aria-label",tdatext("top"))
		topbutton.setAttribute("title",tdatext("top"))
	}
	let searchinput=domgetid("tdasearch")
	if(searchinput){
		searchinput.setAttribute("placeholder",tdatext("searchplaceholder"))
	}
	let pdf=TDAPDF[tdacurrentlang]||TDAPDF["zhtw"]
	let download=domgetid("tdadownload")
	let open=domgetid("tdaopennewtab")
	if(download){
		download.setAttribute("href",pdf)
	}
	if(open){
		open.setAttribute("href",pdf)
	}
	tdarenderlangbar()
	tdarendersectionnav()
	tdarenderitemlist()
}

function tdarenderitemlist(){
	let search=tdasearchtext()
	let compare=domgetid("tdacompare")
	let compared=false
	if(compare&&compare.checked){
		compared=true
	}
	let html=""
	let count=0
	for(let i=0;i<TDAITEMLIST.length;i=i+1){
		let item=TDAITEMLIST[i]
		let itemcompared=tdaitemcompared(item,compared)
		if(tdaitemmatched(item,search,itemcompared)){
			count=count+1
			let comparehtml=""
			let secondarytitlehtml=""
			if(itemcompared){
				let secondarylang="en"
				if(tdacurrentlang=="en"){
					secondarylang="zh"
				}
				secondarytitlehtml=`<div class="mt-1 text-base font-bold leading-snug text-zinc-400">${tdarendertext(tdasecondary(item,"title"),secondarylang,search)}</div>`
				comparehtml=`<div class="mt-4 rounded-lg bg-zinc-900/80 p-4"><div class="text-sm font-extrabold text-emerald-400">${escapehtml(tdatext("comparetitle"))}</div><div class="mt-2 text-sm leading-7 text-justify text-zinc-400">${tdarenderstructuredtext(tdanormalizeline(tdasecondary(item,"body"),secondarylang),secondarylang,search)}</div></div>`
			}
			let primarylang="zh"
			if(tdacurrentlang=="en"){
				primarylang="en"
			}
			let comparelabel=tdatext("compareitem")
			if(itemcompared){
				comparelabel=tdatext("hidecompareitem")
			}
			let numberhtml=escapehtml(item["number"])
			if(item["group"]=="extra"&&String(item["number"]).indexOf("§")==0){
				numberhtml=tdalinkhtml(item["number"].replace("§",""),item["number"])
			}
			html=html+`<article class="scroll-mt-28 rounded-lg bg-zinc-900/80 p-5 md:p-6 lg:scroll-mt-24" id="${escapehtml(tdaitemid(item))}"><div class="mb-3 flex flex-wrap items-center justify-between gap-3"><div class="flex flex-wrap items-center gap-2"><span class="rounded-lg bg-emerald-900 px-3 py-1.5 text-[13px] font-extrabold text-emerald-100">${numberhtml}</span><span class="text-[13px] font-bold text-zinc-500">${escapehtml(tdasectionvalue(item))}</span></div><input type="button" class="min-h-9 rounded-lg bg-zinc-800 px-3 text-[13px] font-bold text-zinc-200 transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-400" data-tdacompareitem="${escapehtml(item["key"])}" value="${escapehtml(comparelabel)}"></div><div class="text-xl font-extrabold leading-snug text-white">${tdarendertext(tdaprimary(item,"title"),primarylang,search)}</div>${secondarytitlehtml}<div class="mt-3 text-[15px] leading-7 text-justify text-zinc-300">${tdarenderstructuredtext(tdanormalizeline(tdaprimary(item,"body"),primarylang),primarylang,search)}</div>${comparehtml}</article>`
		}
	}
	innerhtml("#tdarulelist",html,false)
	innertext("#tdacount",String(count)+tdatext("countsuffix"),false)
	let empty=domgetid("tdaempty")
	if(empty){
		if(count==0){
			removeclass(empty,["hidden"])
		}else{
			addclass(empty,["hidden"])
		}
	}
	tdabindjumplink()
	tdabinditemcompare()
}

function tdasetlanguage(lang){
	if(lang!="en"){
		lang="zhtw"
	}
	tdacurrentlang=lang
	weblsset(WEBLSNAME+"tdaruleslanguage",lang)
	tdarender()
}

function tdainitializeformstate(){
	let compare=domgetid("tdacompare")
	if(compare){
		if(weblsget(WEBLSNAME+"tdarulescompare")=="0"){
			compare.checked=false
		}
	}
}

function tdabindtopbutton(){
	let button=domgetid("tdatopbutton")
	if(button){
		button.addEventListener("click",function(){
			if(window.history&&window.history.replaceState){
				window.history.replaceState(null,"",window.location.pathname+window.location.search)
			}
			window.scrollTo({
				"top": 0,
				"behavior": "smooth"
			})
		})
	}
}

function tdajumpfromhash(){
	let hash=window.location.hash||""
	if(hash.indexOf("#tdaitem")==0){
		tdajumptokey(hash.replace("#tdaitem",""),false)
	}
}

let tdasearchinput=domgetid("tdasearch")
if(tdasearchinput){
	tdasearchinput.addEventListener("input",tdahandlesearchchange)
	tdasearchinput.addEventListener("keyup",tdahandlesearchchange)
}
let tdacompareinput=domgetid("tdacompare")
if(tdacompareinput){
	tdacompareinput.addEventListener("change",function(){
		if(tdacompareinput.checked){
			weblsset(WEBLSNAME+"tdarulescompare","1")
		}else{
			weblsset(WEBLSNAME+"tdarulescompare","0")
		}
		tdarenderitemlist()
	})
	tdacompareinput.addEventListener("click",function(){
		if(tdacompareinput.checked){
			weblsset(WEBLSNAME+"tdarulescompare","1")
		}else{
			weblsset(WEBLSNAME+"tdarulescompare","0")
		}
		tdarenderitemlist()
	})
}
window.addEventListener("hashchange",tdajumpfromhash)

tdainitializeformstate()
tdabindtopbutton()
tdarender()
tdajumpfromhash()
