/*
	製作人員: 賀皓群(小賀) / dc: chris0527 / line: ho960527 / email: chris960527ho@gmail.com / 電話: 0906585605

		|-------    -----    -                     -     -----  -----  -----   -------|
	   |-------    -        -            - - -          -                     -------|
	  |-------    -        -------    -          -     -----    --       --  -------|
	 |-------    -        -     -    -          -         -      --     --  -------|
	|-------    -----    -     -    -          -     -----         -----  -------|

	無授權禁止拷貝使用!
*/

const TRANSLATE={
	"zhtw": {
		"sessionresult": {
			"title": "我的成績",
			"description": "登錄自己在本場次的獎金、獎品與名次，會同步反映在總覽的盈虧統計。",
			"winprice": "獲獎金額",
			"place": "名次",
			"winthing": "獲獎獎品",
			"winthingplaceholder": "如無獎品可填 N/A",
			"save": "儲存我的成績",
			"savesuccess": "儲存成功",
			"savefail": "儲存失敗",
			"winpricenegative": "獲獎金額不得為負數",
			"placenegative": "名次不得為負數"
		},
		"toolseo": {
			"addonevtitle": "Add-on 該不該買？怎麼判斷划不划算",
			"addonevbody": "Add-on 是比賽中一次性加買計分牌的選項。判斷值不值得買，最直接的方式是比較「每千計分牌成本」：把 add-on 的價格除以拿到的計分牌量，再跟原始買入的每計分牌成本比較。通常 add-on 的計分牌單價比買入便宜、而且你的計分牌偏短時，加買的價值最高。這個工具直接算出兩邊的單位成本與差異，現場幾秒鐘就能做決定。",
			"apidoctitle": "PokerTrace 公開 API 說明",
			"apidocbody": "PokerTrace 的部分小工具提供公開 API，可以在你自己的程式裡直接呼叫。",
			"avgstacktitle": "平均計分牌怎麼算？",
			"avgstackbody": "平均計分牌 = 全場總計分牌 ÷ 剩餘人數，再除以目前大盲就是平均 BB 深度。它是判斷比賽節奏最快的指標：你的計分牌相對平均值的位置，會直接影響該打得更積極還是更保守。輸入總計分牌、剩餘人數與目前盲注，即可同時得到平均計分牌與平均 BB。",
			"bankrolltitle": "打比賽需要多少 Bankroll？",
			"bankrollbody": "資金管理是長期贏家的基本功。一般建議：MTT 至少準備 100 個買入、高變異的快速賽更多、單桌 SNG 約 50 個買入，現金桌則以 20 到 40 個買入為常見區間。這個工具依你選的賽制與波動程度，估算建議的資金規模與單場買入上限。",
			"bbantetitle": "BB Ante 和傳統前注怎麼換算？",
			"bbantebody": "現代比賽多改用 BB Ante：由大盲位一人代付整桌前注，取代每人各投一顆的傳統 ante，加快發牌速度。換算原則是讓每圈進入底池的前注總量大致相同：BB Ante 通常等於一個大盲，約等於傳統 ante 乘上人數。這個工具幫你在兩種格式之間對齊結構，改結構表時不會失真。",
			"betsizetitle": "下注尺寸與對手所需勝率",
			"betsizebody": "下注大小決定對手跟注需要的勝率：下注 1/2 pot 時對手需要 25% 勝率才夠本，下注滿 pot 需要 33%。這個工具列出常見 pot 比例對應的對手所需勝率，以及你詐唬時的損益平衡棄牌率，幫你在價值下注與詐唬之間選出合理尺寸。",
			"blindcatchuptitle": "還有幾級會變短碼？",
			"blindcatchupbody": "盲注每級上升，計分牌不動就等於變相縮水。輸入目前計分牌與盲注結構，工具會推算幾級之後你會掉到 20 BB、10 BB 等關鍵深度，幫你提早規劃該在哪個級別開始加壓或尋找全下機會。",
			"blinddefensetitle": "大盲該防守多寬？",
			"blinddefensebody": "大盲位已經投入一個盲注，跟注的底池賠率比其他位置好，因此可以用比想像中寬的範圍防守。面對不同位置的 open——例如按鈕位的寬範圍或槍口位的緊範圍——合理的防守範圍差異很大。這張參考卡整理面對各位置加注時建議的防守與 3-bet 範圍。",
			"blufftitle": "詐唬頻率怎麼平衡？",
			"bluffbody": "GTO 概念中，下注尺寸決定價值與詐唬的平衡比例：下注滿 pot 時約 2:1（67% 價值、33% 詐唬），下注 1/2 pot 約 3:1。這個工具依你的下注大小算出不被剝削的詐唬比例，讓你的下注範圍不會被對手用全跟或全棄的簡單策略擊敗。",
			"bountytitle": "賞金值多少計分牌？",
			"bountybody": "在賞金賽（尤其 PKO）裡，跟注全下時不只算底池賠率，還要把對手頭上的賞金換算成計分牌價值。常用估算是把賞金金額換算成等值的起始計分牌加進底池。這個工具幫你把一般與 PKO 賞金換算成額外賠率，判斷搶賞金的跟注划不划算。",
			"bountypooltitle": "賞金池與 PKO 頭上金額估算",
			"bountypoolbody": "輸入報名人數、買入拆分與賞金比例，工具會算出總賞金池、每人初始頭上賞金，以及 PKO 模式下滾動累積的預期金額，方便主辦設定結構、選手評估賞金賽的實際價值分布。",
			"breakeventitle": "辦一場比賽要多少人才回本？",
			"breakevenbody": "主辦成本包含場地、人力、設備與保底獎池的風險。這個工具由固定成本、每人變動成本與抽成設定，反推損益兩平所需的報名人數，並顯示不同人數下的盈虧，讓你在公告保底前就知道自己承擔多少風險。",
			"breakschedtitle": "休息時間排程表",
			"breakschedbody": "輸入開賽時間、每級長度與休息規則（例如每 4 級休息 10 分鐘），工具會列出整場比賽每次 break 的實際時刻，方便主辦公告時程、選手安排用餐與休息。",
			"bubblepressuretitle": "泡沫期的 ICM 壓力有多大？",
			"bubblepressurebody": "接近獎圈時，計分牌的現金價值不再線性：短碼多活一名就多一份獎金，大碼則可以利用這一點大量施壓。這個工具依剩餘人數、獎勵名額與你的計分牌相對位置，給出目前 ICM 壓力的量化提示，幫你判斷該收緊還是該加壓。",
			"bustratetitle": "淘汰速率與 Final Table 時間預估",
			"bustratebody": "輸入目前人數、平均每級淘汰數或歷史節奏，工具會推估到達獎圈與決賽桌的大約時間和級別，讓主辦能預估收場時間、選手能安排體力分配。",
			"buyinsplittitle": "報名費怎麼拆：獎池、行政費、賞金",
			"buyinsplitbody": "一筆買入通常拆成進入獎池的部分、主辦行政費，賞金賽還要再拆出 bounty。這個工具輸入買入金額與各項比例，立即算出每個部分的金額與全場總額，公告結構時清楚透明。",
			"cashreconciletitle": "現場收款對帳",
			"cashreconcilebody": "賽事收尾最怕帳對不上。輸入報名數、重購、add-on 與各種收費，工具算出應收總額，再與實際點收金額比對差額，快速定位漏收或多收，讓主辦收場更輕鬆。",
			"cbettitle": "C-bet 頻率與尺寸參考",
			"cbetbody": "翻牌圈持續下注不是每個牌面都該做：乾燥高張面適合高頻小注，濕潤連張面則要降低頻率、加大尺寸。這張參考卡依牌面質地整理建議的 c-bet 頻率與大小，幫你避免在錯的牌面自動下注。",
			"checklisttitle": "賽事主辦檢查清單",
			"checklistbody": "從賽前的計分牌、結構表、座位卡，到賽中的重購登記與獎池公告，再到收場的對帳與獎金發放——這份可勾選的清單把主辦一場比賽的每個環節列出來，避免現場手忙腳亂漏掉關鍵步驟。",
			"chipaudittitle": "計分牌總量稽核",
			"chipauditbody": "全場計分牌應該等於起始計分牌乘以參賽人次，加上重購與 add-on 發出的量。這個工具算出理論總量，與各桌清點結果比對，快速發現少計分牌或多計分牌的異常，是比賽中場與收場的必要檢查。",
			"chipcolortitle": "撲克計分牌顏色與面額對照",
			"chipcolorbody": "白 1、紅 5、綠 25、黑 100 是最常見的現金桌配置，比賽計分牌則常用 25、100、500、1000、5000 的組合。本頁整理常見計分牌顏色與面額慣例，佈置新場地或採購計分牌時可直接參考。",
			"chipcounttitle": "點碼計算機",
			"chipcountbody": "輸入每種面額的顆數，即時加總出總計分牌量。適合比賽中場清點、all-in 時快速核對雙方計分牌，或收場時逐桌對帳，比心算快也不會出錯。",
			"chipinventorytitle": "整場比賽需要準備多少計分牌？",
			"chipinventorybody": "依報名上限、起始計分牌配置、重購與換色規劃，工具會算出每種面額全場需要準備的總顆數，並預留 color up 所需的備量，讓主辦採購與備碼一次到位。",
			"chipracetitle": "Chip Race 怎麼做？",
			"chipracebody": "移除小面額時，湊不滿一顆大計分牌的零頭傳統上用發牌比大小（chip race）決定歸屬。這個工具以全桌口徑幫你算出可整除換成的大計分牌總數，以及全桌剩餘的餘值，並依「一人最多得一顆、不會因 race 出局」等標準規則提示處理方式。",
			"chipsetuptitle": "起始計分牌怎麼配？",
			"chipsetupbody": "起始計分牌的面額配置要讓前期下注方便、後期換色次數少。輸入每人起始總量與可用面額，工具會建議各面額的顆數組合，並算出全場總需求，開賽備碼不用再用猜的。",
			"coloruptitle": "計分牌換色（Color Up）計算",
			"colorupbody": "盲注升高後小面額失去作用，就要把它們換成大面額。輸入要移除的面額與各選手持有量，工具算出每人應換得的大計分牌與剩餘零頭，配合 chip race 或無條件進位規則快速完成換色。",
			"countdowntitle": "倒數計時器",
			"countdownbody": "設定目標時刻或倒數長度，全螢幕顯示剩餘時間。適合晚到報名截止、休息結束倒數、衛星賽開打提醒等現場情境，不用登入、開著就能用。",
			"dealersoptitle": "發牌員標準流程速查",
			"dealersopbody": "從洗牌、切牌、發牌順序，到燒牌、開公共牌與收注的標準動作，加上常見失誤（先開牌、發錯家、掉牌）的處理原則——這份速查表讓新手發牌員快速上手，也讓主辦有一致的執法依據。",
			"depthstrategytitle": "不同計分牌深度該怎麼打？",
			"depthstrategybody": "100 BB 的深計分牌可以打隱含賠率與多街操作，40 BB 進入 3-bet 全下的範疇，20 BB 以下 push/fold 成為主軸，10 BB 幾乎只剩全下或棄牌。輸入你的 BB 數，工具給出該深度的策略重點與該避免的錯誤。",
			"drawoutstitle": "聽牌有幾張補牌？成牌率多少？",
			"drawoutsbody": "同花聽牌 9 張補牌、兩頭順 8 張、卡順 4 張。快速估算法是「4-2 法則」：翻牌到河牌約為補牌數 ×4%，轉牌到河牌約 ×2%。這張表整理常見聽牌的 outs 與各街成牌機率，配合底池賠率就能決定跟不跟。",
			"durationtitle": "比賽會打多久？",
			"durationbody": "由起始計分牌、盲注結構與報名人數，可以推估總發碼量會在哪一級被盲注消化完。工具據此估算整場時長與大約結束級別，主辦排場地時間、選手排行程都用得上。",
			"effstacktitle": "有效計分牌是什麼？",
			"effstackbody": "兩人對戰時，實際能贏能輸的最大量由較短的一方決定，這就是有效計分牌。所有尺寸與策略決策都應該以有效計分牌（換算成 BB）為基準，而不是自己的總計分牌。輸入雙方計分牌與盲注，立即得到有效深度。",
			"equitytitle": "德州撲克勝率計算器",
			"equitybody": "輸入你和對手的手牌（支援德州與奧馬哈）與公共牌，工具即時計算各家勝率、平手率與剩餘 outs。可以用來複盤關鍵手牌、驗證全下決策，或單純弄清楚 AK 對 QQ 到底是幾比幾。",
			"evenchoptitle": "平分獎金（Even Chop）計算",
			"evenchopbody": "談 deal 時最簡單的方案：剩餘獎金依人數均分。工具算出每人可得金額與跟原本名次獎金的差異，讓每位選手清楚知道自己在這筆交易裡是賺是虧。",
			"glossarytitle": "撲克中英術語對照表",
			"glossarybody": "從 UTG、cutoff、float 到 run it twice，撲克圈慣用大量英文術語。這份可搜尋的對照表收錄常見術語的中英對照與簡短解釋，看國外教學影片或跟外國選手同桌時隨查隨懂。",
			"handrankingtitle": "撲克牌型大小順序",
			"handrankingbody": "皇家同花順、同花順、四條、葫蘆、同花、順子、三條、兩對、一對、高牌——十種牌型由大到小的完整排序與範例。新手最常搞混的「同花 vs 順子」「葫蘆 vs 同花」在這裡一目瞭然。",
			"handsesttitle": "每小時能打幾手牌？",
			"handsestbody": "現場一桌一位發牌員每小時大約 25 到 35 手，人數、選手速度與洗牌方式都會影響。輸入桌數與條件，工具估算全場每小時手數，是估算比賽節奏與現金桌抽水收入的基礎數字。",
			"hostcosttitle": "主辦一場比賽的財務試算",
			"hostcostbody": "把場地、發牌員、設備等成本，與買入、抽成、保底設定放在同一張試算表：工具算出不同報名人數下的獎池、收入與盈虧，讓你在公告保底前就知道自己承擔多少風險。",
			"icmtitle": "ICM 是什麼？拆彩金怎麼算？",
			"icmbody": "ICM（獨立計分牌模型）把每個人的計分牌換算成獎金的期望值：計分牌價值不是線性的，短碼的每一顆計分牌比大碼的更值錢。談 deal 拆彩金時，輸入各家計分牌與獎金結構，工具同時給出 ICM 期望值與 chip-chop 兩種拆法的金額，讓談判有客觀依據。",
			"impliedoddstitle": "隱含賠率怎麼算？",
			"impliedoddsbody": "聽牌時就算當下底池賠率不夠，若中牌後還能從對手身上贏到額外計分牌，跟注仍可能有利可圖——這就是隱含賠率。工具讓你輸入預估的後續可贏金額，算出考慮隱含賠率後實際需要的勝率門檻。",
			"investtrackertitle": "單場投入與淨利追蹤",
			"investtrackerbody": "買入、重購、add-on、小費加起來才是你這場真正的投入。輸入各項支出與最終獎金，工具算出單場淨利與投報率，誠實面對自己的成績，不再只記得贏的那幾場。",
			"kpititle": "賽事營運 KPI 摘要",
			"kpibody": "報名人次、重購率、抽水率、每桌小時成本、淨利率——這個工具把一場比賽的關鍵營運指標整理成一頁摘要，讓主辦用數字檢討每一場，找出值得複製或需要修正的地方。",
			"lateregtitle": "晚到報名什麼時候截止？",
			"lateregbody": "輸入開賽時間、每級長度、休息規則與開放晚到報名的級數，工具算出報名截止的實際時刻，方便主辦公告、選手掐點進場。",
			"levelclocktitle": "盲注級數時刻表",
			"levelclockbody": "把整份盲注結構展開成時刻表：每一級的開始時間、盲注大小與休息時段一目瞭然。主辦可以直接拿來公告，選手也能預估自己短碼化的時間點。",
			"matchuptitle": "常見全下對決勝率表",
			"matchupbody": "AA 對 KK 約 82:18、對子對兩高張約 55:45、AK 對 QQ 約 43:57——這張表整理翻前常見對決的勝率，讓你對「翻前跑馬」的期望值有正確直覺，不再高估或低估自己的牌。",
			"mincashtitle": "Min Cash 是買入的幾倍？",
			"mincashbody": "最小獎金通常是買入的 1.5 到 2 倍。輸入買入與獎金結構，工具算出 min cash 倍率與你需要多高的 ITM 率才能靠混獎圈打平，順便戳破「常常進錢圈就會賺」的迷思。",
			"namegentitle": "比賽名稱靈感產生器",
			"namegenbody": "用時段、賽制、buy-in 等模板元素組合出賽事名稱靈感，例如「週五深計分牌保底賽」「月底主賽事」。取名卡關時點幾下，比空想快得多。",
			"oddsconvtitle": "賠率與勝率換算",
			"oddsconvbody": "3:1 的賠率等於 25% 勝率，2.5 倍的歐式賠率等於 40%。這個工具在比例賠率、歐式賠率與勝率百分比之間即時換算，是理解底池賠率與期望值的基本功。",
			"partnersplittitle": "合夥收益怎麼分？",
			"partnersplitbody": "多人合資主辦或合夥經營時，輸入總收益與各自的出資或分潤比例，工具算出每個人應得的金額，分帳清楚透明，避免口頭約定造成的糾紛。",
			"payouttabletitle": "獎金分配表產生器",
			"payouttablebody": "輸入總獎池、獎勵名額與分配曲線，工具產生各名次的獎金金額，總和自動對齊獎池。主辦可直接公告，選手也能在泡沫期算清楚每爬一名值多少錢。",
			"playerstatstitle": "選手成績統計：ROI 與 ITM",
			"playerstatsbody": "輸入參賽場次、買入與獎金紀錄，工具算出 ROI（投資報酬率）、ITM 率（進錢圈比例）與總淨利。長期追蹤這三個數字，比記憶更誠實地告訴你打得好不好。",
			"positionstitle": "撲克桌位置介紹",
			"positionsbody": "UTG、MP、CO、BTN、SB、BB——位置決定資訊量，也決定該打多寬。這頁整理 9 人桌各位置的名稱、順序與打法重點：越後面的位置資訊越多，開牌範圍就能越寬。",
			"potbuildertitle": "底池會長到多大？",
			"potbuilderbody": "從翻前加注開始，每條街的下注都會讓底池以倍數成長。輸入各街的下注比例，工具模擬到河牌時的底池與剩餘計分牌，幫你預判 SPR 走向，避免「不小心把自己套死」的尺寸失誤。",
			"potoddstitle": "底池賠率怎麼算？",
			"potoddsbody": "對手下注後，你需要的勝率 = 跟注額 ÷（底池 + 下注 + 跟注額）。例如對手在 100 的底池下注 50，你跟 50 需要 25% 勝率。輸入底池與下注金額，工具立即算出所需勝率，配合補牌表就能做出正確的跟棄決定。",
			"prefloptitle": "翻前決策卡：開牌、加注與 push/fold",
			"preflopbody": "把翻前最常用的三張表放在一起：各位置建議開牌範圍、常用加注尺寸，以及短碼的 push/fold 參考。比賽中盲注升快、思考時間短，這張卡讓你的翻前決策有一致的框架。",
			"preflopoddstitle": "起手牌機率表",
			"preflopoddsbody": "拿到口袋對子的機率約 5.9%、AK 約 1.2%、翻牌中一對約 32%、口袋對翻牌中 set 約 12%。這頁整理起手牌與翻牌互動的常見機率，建立對「多常發生」的正確直覺。",
			"preflopsizetitle": "翻前加注該加多大？",
			"preflopsizebody": "常見基準：open 2.2–2.5 BB（現場常用 3 BB 以上）、3-bet 為 open 的 3 倍（位置外再大一點）、4-bet 約 3-bet 的 2.2–2.5 倍。輸入盲注與前面的動作，工具給出建議尺寸區間，讓你的加注大小不再憑感覺。",
			"raketitle": "抽水怎麼算？",
			"rakebody": "現金桌常見抽水為底池的 5% 並設上限（cap）。輸入抽水比例、cap 與底池大小，工具算出實際抽走金額與選手實拿，也能估算整晚的抽水總量，對主辦與選手都透明。",
			"refundtitle": "退賽退費計算",
			"refundbody": "開賽前退賽退全額、打了幾手後只退獎池部分、行政費不退——各家政策不同。輸入你的退費規則與選手狀態，工具算出應退金額，現場處理退賽不用翻規則吵架。",
			"regpacetitle": "報名配速：達標還差多少？",
			"regpacebody": "設定目標人數與截止時間，輸入目前報名數，工具算出剩餘時間需要的每小時報名速度，並提示目前進度超前還是落後，讓主辦提早決定要不要加強宣傳或延長報名。",
			"regprogresstitle": "報名與獎池進度即時看板",
			"regprogressbody": "輸入目前報名人次與買入設定，工具顯示獎池累積進度條、距離保底還差多少人，以及主辦目前承擔的保底缺口，適合開賽前掛在螢幕上即時更新。",
			"riverbettitle": "河牌該下多大？",
			"riverbetbody": "到了河牌沒有後續街道，下注就是純價值或純詐唬。價值注要選對手範圍付得起的最大尺寸；詐唬則要讓故事合理、頻率符合尺寸給出的賠率。這張參考卡整理河牌常見情境的尺寸與頻率建議。",
			"roitargettitle": "要達成目標 ROI，每場要贏多少？",
			"roitargetbody": "設定目標 ROI 與參賽計畫（場次、平均買入），工具反推每場平均需要拿回的獎金與需要的深入名次頻率，把「我要變成贏家」翻譯成可以檢核的數字。",
			"rulestitle": "常見賽事規則速查",
			"rulesbody": "口頭宣告有效、計分牌前推算注、all-in 必須亮牌、單挑時按鈕是小盲——這頁整理現場最常引起爭議的規則重點與通行裁決原則，主辦與選手吵起來之前先查一下。",
			"satellitetitle": "衛星賽能送出幾個席位？",
			"satellitebody": "衛星賽的獎池不發現金，而是換成目標賽事的門票。輸入報名數、買入與目標賽事門票價格，工具算出可送出的席位數與剩餘找零獎金，主辦公告與選手評估都一清二楚。",
			"seatdrawtitle": "座位抽籤",
			"seatdrawbody": "輸入選手名單與桌數，工具隨機分配桌號與座位，支援平均分桌與每桌人數上限。開賽前一鍵完成抽籤，公平、快速、不用撕紙條。",
			"sidepottitle": "邊池怎麼分？",
			"sidepotbody": "多人 all-in 時，每個人只能贏自己有跟到的部分：最短計分牌組成主池，超出的部分依序組成邊池。輸入各家投入量，工具自動算出主池與各邊池的金額和參與者，攤牌時照表分錢不出錯。",
			"splitpottitle": "平分彩池與零頭計分牌",
			"splitpotbody": "兩家以上攤牌同牌力時底池均分，除不盡的零頭（odd chip）通常給最接近按鈕左邊的選手。輸入底池與人數，工具算出每人分得金額與零頭歸屬，處理 split pot 快又標準。",
			"sprtitle": "SPR 是什麼？怎麼用？",
			"sprbody": "SPR（底池計分牌比）= 有效計分牌 ÷ 翻牌時底池。SPR 3 以下適合頂對就打全下的承諾底池，10 以上則要更多操作空間與更強的成手。輸入計分牌與底池，工具算出 SPR 並給出對應的承諾度提示。",
			"stackcalctitle": "計分牌量換算：BB 與 M 值",
			"stackcalcbody": "同樣 30000 計分牌，在盲注 100/200 是 150 BB 的深計分牌，在 1000/2000 只剩 15 BB。輸入計分牌與盲注（含前注），工具算出 BB 數與 M 值，讓你隨時知道自己真正的深度，而不是被計分牌面額迷惑。",
			"staffingtitle": "比賽現場要配多少人力？",
			"staffingbody": "依桌數與賽制估算需要的發牌員（含輪替）、floor 與行政助理人數。輸入桌數、是否輪替與服務範圍，工具給出建議配置，讓你不會開賽當天才發現人手不夠。",
			"staffpaytitle": "工作人員薪資試算",
			"staffpaybody": "輸入每位工作人員的時薪、工時、獎金與交通補貼，工具算出個別與總計的人事成本，是主辦財務試算裡最常被低估的一塊。",
			"stakingmarkuptitle": "賣股與 Markup 怎麼算？",
			"stakingmarkupbody": "賣出比賽股份時常加收 markup：例如 1.2 的 markup 表示買家用 1.2 倍價格買你的股份。輸入買入、出售比例與 markup，工具算出買家成本、你鎖定的利潤與各種結果下的分配，讓賣股條件雙方都算得清楚。",
			"structurechecktitle": "盲注結構會不會太快？",
			"structurecheckbody": "健康的結構通常每級盲注成長 25%–50%，成長過快會讓比賽變成運氣抽獎。貼上你的結構，工具檢查每級與每小時的成長率，標出跳太快的級別，公告前先自我檢查。",
			"structuregentitle": "盲注結構產生器",
			"structuregenbody": "輸入起始計分牌、目標時長、每級分鐘數與人數，工具自動產生一份成長平滑的盲注結構表，可以直接匯出 JSON 給 PokerTrace 計時器使用，也能微調後再輸出，幾分鐘完成過去要調半天的結構設計。",
			"tablebalancetitle": "桌位平衡怎麼調？",
			"tablebalancebody": "比賽規則通常要求各桌人數差距不超過一人。輸入各桌目前人數，工具算出該從哪桌移多少人到哪桌，並提示合併時機，讓 floor 平衡桌位有依據、選手沒話說。",
			"tablefeetitle": "桌費與時租分攤",
			"tablefeebody": "包桌或租場地時，輸入每桌時租、桌數與時數，工具算出總成本與每人分攤金額，自組局收費有憑有據。",
			"tdarulestitle": "TDA 撲克比賽規則（2024）",
			"tdarulesbody": "TDA（Tournament Directors Association）規則是全球撲克比賽最通用的裁決標準，多數大型賽事都以它為基礎。本頁提供 2024 版 TDA 規則 PDF 的線上預覽（含中文版），主辦裁決、選手申訴都能引用同一份標準。",
			"threebetrangetitle": "3-bet / 4-bet 範圍參考",
			"threebetrangebody": "3-bet 範圍要由價值牌與合適的詐唬牌（如 A5s 這類阻斷牌）組成，而不是只用強牌。這張卡整理不同位置對抗下常用的 3-bet / 4-bet 價值與詐唬組合，幫你建立不好剝削的再加注範圍。",
			"timebankdrilltitle": "決策時間練習器",
			"timebankdrillbody": "線上打慣的選手到現場常被時間壓力影響決策。這個工具模擬不同時限的決策情境，點一下開始/暫停，練習在時間壓力下維持穩定的思考流程。",
			"tipsharetitle": "小費怎麼分？",
			"tipsharebody": "輸入小費總額、floor 抽成比例與發牌員的工時或桌數權重，工具算出每個人分得的金額，收場分小費快速又公平。",
			"waitlisttitle": "候補要等多久？",
			"waitlistbody": "輸入目前候補人數、桌數與平均離場速度，工具估算大約的等待時間與消化速度，讓候補選手心裡有數，也讓主辦決定要不要加開新桌。",
			"winprobtitle": "計分牌領先等於幾成冠軍機率？",
			"winprobbody": "在同等技術假設下，奪冠機率約等於你佔全場計分牌的比例——這也是 ICM 的基礎假設。輸入你的計分牌與全場總量，工具算出簡易奪冠機率估計，別把 2 倍平均碼當成穩進決賽桌。",
			"winratetitle": "現金桌時薪怎麼估？",
			"winratebody": "bb/100（每百手贏多少大盲）是現金桌勝率的標準單位。輸入你的 bb/100、盲注級別與每小時手數，工具換算出期望時薪，讓你用數字決定該打哪個級別、要不要多開一桌。"
		},
		"broadcastpage": {
			"title": "現場轉播 - PokerTrace",
			"kicker": "現場轉播 · LIVE BROADCAST",
			"latesttitle": "最新一手",
			"listtitle": "近期手牌",
			"foot": "唯讀觀看 · 手牌紀錄同步自主辦端",
			"skinclassic": "經典藍",
			"skincrimson": "緋紅",
			"skinmidnight": "午夜綠",
			"statusconnecting": "連線中…",
			"statuslive": "轉播中",
			"statusreconnect": "重新連線中…",
			"statusoffline": "離線",
			"statusnosession": "無場次",
			"noticeclosed": "此場次未開放現場轉播（僅公開的統一手牌紀錄場次可轉播），或場次不存在。",
			"noticenosession": "缺少場次參數，無法載入轉播。",
			"noticeh4h": "H4H 手動推進中，等待裁判放行手牌…",
			"unnamed": "未命名場次",
			"delaypre": "延遲 ",
			"delaypost": " 分",
			"badgemask": "底牌隱藏",
			"badgeh4h": "H4H 手動推進",
			"blind": "盲注",
			"pot": "底池",
			"emptyseat": "空位",
			"nohands": "尚無手牌",
			"onlyone": "目前只有一手",
			"actionallin": "全下",
			"actionfold": "蓋牌",
			"actionraise": "加注",
			"actionbet": "下注",
			"actioncall": "跟注",
			"actioncheck": "過牌",
			"actionante": "前注",
			"actionsb": "小盲",
			"actionbb": "大盲"
		},
		"broadcastcontrolpage": {
			"title": "轉播控制 (H4H) - PokerTrace",
			"kicker": "H4H · 手動推進控制台",
			"heading": "動畫回放控制台",
			"subtitle": "場內即時記錄，場外只看到你放行的手牌。逐手推進以控制轉播節奏。",
			"released": "已放行",
			"pending": "待放行",
			"total": "總手數",
			"nexttitle": "下一手待放行",
			"advance": "▶ 推進下一手",
			"back": "退回一手",
			"all": "全部放行 →",
			"listtitle": "手牌放行進度",
			"tagreleased": "已放行",
			"tagpending": "待放行",
			"handpre": "第 ",
			"handpost": " 手",
			"blind": "盲注",
			"nohands": "尚無手牌",
			"allreleased": "目前沒有待放行的手牌（已全部放行）",
			"noticenoth4h": "此場次尚未開啟「H4H 手動推進」。可到場次設定開啟後再回來控制。",
			"noticeloadfail": "無法載入控制台（可能無權限或場次不存在）。",
			"noticenosession": "缺少場次參數，無法載入控制台。",
			"noticelogin": "請先登入再操作轉播控制台。",
			"toastok": "已更新放行進度",
			"toastfail": "操作失敗",
			"confirmall": "確定要一次放行所有待放行的手牌嗎？",
			"unnamed": "未命名場次",
			"noticewsdown": "轉播連線中斷，重新連線中…"
		},
		"handreplaypage": {
			"openbtn": "▶ 動畫回放",
			"title": "動畫回放",
			"deal": "發牌",
			"preflop": "翻牌前",
			"flop": "翻牌",
			"turn": "轉牌",
			"river": "河牌",
			"showdown": "攤牌",
			"payout": "派彩",
			"allin": "全下",
			"fold": "蓋牌",
			"raise": "加注",
			"bet": "下注",
			"call": "跟注",
			"check": "過牌",
			"ante": "前注",
			"sb": "小盲",
			"bb": "大盲",
			"emptyseat": "空位",
			"pot": "底池",
			"burn": "燒牌",
			"mainpot": "主池",
			"sidepot": "邊池",
			"potchips": "底池計分牌",
			"decktitle": "牌面牌背樣式（長按牌桌）",
			"scrubhint": "長按牌桌左右拖曳可移動時間軸",
			"play": "▶ 播放",
			"pause": "⏸ 暫停",
			"revealall": "顯示所有底牌",
			"closearia": "關閉回放",
			"prevaria": "上一步",
			"nextaria": "下一步",
			"skinclassic": "經典藍",
			"skincrimson": "緋紅",
			"skinmidnight": "午夜綠"
		},
		"common": {
			"leaveconfirm": "表單資料尚未保存，確定要離開嗎？",
			"confirmtitle": "確認操作",
			"cancel": "取消",
			"confirm": "確認",
			"back": "回上一頁",
			"loading": "載入中",
			"timeout": "連線逾時，請檢查網路後重試",
			"emptynext": "請從下方建議的下一步繼續"
		},
		"pwa": {
			"install": "安裝 App",
			"installhint": "將 PokerTrace 加入主畫面，離線也能用",
			"installed": "已加入主畫面",
			"dismiss": "略過"
		},
		"shakecontact": {
			"title": "遇到問題嗎？",
			"body": "偵測到你搖晃了手機，需要幫忙嗎？歡迎透過「聯絡我們」告訴我們你遇到的狀況。",
			"contact": "聯絡我們",
			"close": "關閉",
			"disable": "關閉搖一搖功能",
			"disabledtoast": "已關閉搖一搖，可到個人資料的偏好設定重新開啟",
			"asktitle": "開啟搖一搖回報？",
			"askbody": "允許動作感應後，遇到問題時搖晃手機就能快速聯絡我們",
			"askallow": "允許",
			"asklater": "先不要",
			"askgranted": "已開啟搖一搖回報",
			"askdenied": "未取得動作感應權限，之後可到個人資料的偏好設定再開啟"
		},
		"onboarding": {
			"skip": "略過導覽",
			"next": "下一步",
			"prev": "上一步",
			"done": "開始使用",
			"hoststeps": [
				{"title": "歡迎使用 PokerTrace", "body": "這是給主辦者的快速導覽，帶你認識建立場次到現場營運的流程。"},
				{"title": "建立協會與場次", "body": "先在「協會管理」建立你的協會，再到「場次列表」新增場次與賽制結構。"},
				{"title": "現場營運", "body": "用計時器、多牌桌總覽看板與座位平衡，掌握全場狀態。"},
				{"title": "報表與通知", "body": "場次結束後可在報表查看盈虧並匯出 CSV，重要事件會發送通知。"}
			],
			"playersteps": [
				{"title": "歡迎使用 PokerTrace", "body": "這是給選手的快速導覽，帶你認識報名到查看成績的流程。"},
				{"title": "報名場次", "body": "在「場次列表」找到想參加的場次並報名，報名確認會發送通知。"},
				{"title": "查看成績與盈虧", "body": "在「個人資料」與「進階報表」查看你的盈虧趨勢，並可匯出 CSV。"}
			]
		},
		"api": {
			"signin": {
				"success": "登入成功"
			},
			"signup": {
				"success": "註冊成功"
			},
			"signout": {
				"success": "登出成功"
			}
		},
		"adminuser": {
			"name": "名稱",
			"permission": "權限",
			"function": "功能區",
			"ban": "封禁",
			"delete": "刪除",
			"editpermission": "修改權限"
		},
		"pagination": {
			"total": "共 %s 筆"
		},
		"navigationbar": {
			"index": "首頁摘要",
			"signin": "登入",
			"signup": "註冊",
			"signout": "登出",
			"profile": "個人資料",
			"club": "協會管理",
			"session": "場次列表",
			"series": "系列賽",
			"notification": "通知中心",
			"benefit": "進階報表",
			"back": "返回",
			"main": "專案主頁",
			"adminuser": "使用者管理",
			"newproject": "新增專案",
			"contactadmin": "聯絡訊息",
			"phone": {
				"index": "主頁",
				"signin": "登入",
				"signup": "註冊",
				"signout": "登出",
				"profile": "個人",
				"club": "協會",
				"session": "場次",
				"series": "系列賽",
				"notification": "通知",
				"benefit": "收益",
				"back": "返回",
				"main": "專案主頁",
				"adminuser": "使用者管理"
			}
		},
		"footer": {
			"privacy": "隱私權政策",
			"terms": "服務條款",
			"contact": "聯絡我們"
		},
		"series": {
			"title": "系列賽管理",
			"eyebrow": "Series",
			"newseries": "新增系列賽",
			"name": "系列賽名稱",
			"nameplaceholder": "請輸入系列賽名稱",
			"description": "說明",
			"descriptionplaceholder": "選填",
			"scoringtype": "排名依據",
			"scoring_profit": "盈虧",
			"scoring_place": "名次",
			"scoring_points": "積分",
			"starttime": "開始日期",
			"endtime": "結束日期",
			"private": "私人系列賽",
			"create": "建立",
			"creating": "建立中...",
			"save": "儲存",
			"saving": "儲存中...",
			"edit": "編輯",
			"delete": "刪除",
			"cancel": "取消",
			"deleteconfirm": "確定要刪除這個系列賽嗎？場次本身不會被刪除。",
			"sessioncount": "場次數",
			"totalprofit": "總盈虧",
			"totalcost": "總買入",
			"totalwinprice": "總獎金",
			"myprofit": "我的盈虧",
			"mycost": "我的買入",
			"myprize": "我的獎金",
			"empty": "還沒有任何系列賽",
			"emptyhint": "把多個場次歸成一包，做彙總統計與排名",
			"back": "返回系列賽列表",
			"overview": "總覽",
			"sessions": "場次",
			"leaderboard": "排行榜",
			"managesessions": "管理場次",
			"addsessions": "加入場次",
			"searchsession": "搜尋我的場次（名稱或代碼）",
			"add": "加入",
			"remove": "移除",
			"done": "完成",
			"nosessions": "尚未加入任何場次",
			"nosessionhint": "點「管理場次」把場次加進這個系列賽",
			"rank": "排名",
			"player": "選手",
			"entries": "參賽場次",
			"prize": "總獎金",
			"cost": "總買入",
			"profit": "盈虧",
			"bestplace": "最佳名次",
			"cashes": "進錢次數",
			"noleaderboard": "此系列賽尚無主辦場次的排名資料",
			"noleaderboardhint": "排行榜僅統計「主辦場次」中已報到的選手",
			"created": "已建立系列賽",
			"saved": "已儲存",
			"deleted": "已刪除系列賽",
			"sessionssaved": "場次已更新",
			"requiredname": "請輸入系列賽名稱",
			"notfound": "找不到系列賽",
			"networkerror": "網路連線錯誤",
			"unknownerror": "發生未知錯誤",
			"notitle": "未命名系列賽",
			"shared": "他人公開",
			"attachtitle": "加入系列賽",
			"attachhint": "把這個場次歸到某個系列賽，一起做彙總統計與排名",
			"attachselect": "選擇系列賽",
			"attachbtn": "加入",
			"attaching": "加入中...",
			"attached": "已加入系列賽",
			"alreadyin": "此場次已在該系列賽中",
			"noseries": "你還沒有任何系列賽，請先到系列賽頁面建立",
			"goseries": "前往系列賽",
			"batchcreate": "批量建立多日賽"
		},
		"batch": {
			"title": "批量建立多日賽",
			"hint": "填一次設定，一鍵建好整棵晉級樹的所有場次，並自動包成系列賽。",
			"basic": "基本設定",
			"blind": "盲注結構",
			"bracket": "賽制 / 晉級樹",
			"preview": "預覽",
			"seriesname": "系列賽名稱",
			"club": "協會",
			"buyin": "買入",
			"buyinfee": "手續費",
			"chip": "起始碼",
			"maxseat": "每桌人數",
			"startdate": "開始日期",
			"scoringtype": "系列賽排名依據",
			"gametype": "計分牌遊戲類型",
			"limittype": "限注類型",
			"stacktype": "計分牌類型",
			"eventtype": "賽事細項",
			"prevstep": "上一步",
			"nextstep": "下一步",
			"structure": "報名 / 買入結構",
			"structcount": "次數",
			"structbuyin": "買入",
			"structfee": "手續費",
			"structchip": "計分牌",
			"rebuy": "重買",
			"reentry": "重入",
			"addon": "加買",
			"note": "備註（套用到每一場）",
			"start": "開始時間",
			"interval": "每場間隔（分）",
			"customtime": "每場自訂開始時間",
			"blindhint": "貼上盲注 JSON（盲注生成器輸出）或上傳 JSON 檔；也可貼純文字（每行：級數 時長 SB BB Ante）按解析。休息由下方規則自動插入。可切換匯入目標，分別匯入一般與 Turbo 結構。",
			"structph": "貼 JSON（例如 [{\"sb\":10,\"bb\":20,\"ante\":20,\"dur\":25}, ...]）或純文字盲注表",
			"structnormal": "一般結構",
			"structturbo": "Turbo 結構",
			"parse": "讀取 / 解析",
			"upload": "上傳 JSON 檔",
			"parsing": "解析中...",
			"parsed": "已讀到 {n} 個級別",
			"parsed2": "一般 {n} 級 · Turbo {m} 級",
			"parsednone": "沒有讀到任何級別",
			"turbofallback": "Turbo 場次尚未匯入專用結構，將沿用一般結構",
			"jsoninvalid": "JSON 格式不正確",
			"intoseries": "建立到系列賽：{n}",
			"savecfg": "儲存設定 JSON",
			"loadcfg": "載入設定 JSON",
			"cfgloaded": "已載入設定",
			"structempty": "請先貼上盲注結構或上傳 JSON",
			"breakevery": "每幾級休息",
			"breakdur": "休息分鐘",
			"regclose": "截止買入級別",
			"colorups": "Color up (級=面額)",
			"prefix": "代號",
			"count": "場次數",
			"fromlv": "起始級別",
			"tolv": "結束級別",
			"dur": "每級分鐘",
			"turbo": "Turbo 場次（打勾＝該場為 Turbo，套用 Turbo 結構）",
			"sources": "晉級來源（哪些上一層場次併入）",
			"sourcesph": "例如 D1A,D1B,D1C,D1D",
			"addround": "+ 新增一層",
			"removeround": "− 刪除最後一層",
			"refresh": "重新整理預覽",
			"create": "建立全部",
			"creating": "建立中...",
			"noround": "尚未設定任何層級",
			"flightsunit": "場",
			"previewflights": "共 {n} 場",
			"previewedges": "{n} 條晉級關聯",
			"needparse": "請先解析盲注結構",
			"needclub": "請選擇協會",
			"needstart": "請選擇開始日期",
			"created": "已建立 {n} 場並包成系列賽",
			"createfail": "建立失敗",
			"networkerror": "網路連線錯誤",
			"chiplist": "計分牌清單（寫入每一場的場次設定）",
			"chiplisthint": "會寫進每個新建場次的計分牌清單（場次設定裡看得到），與上面的起始碼／Color up 分開設定。",
			"chipadd": "+ 新增面額",
			"chipsetunnamed": "未命名組合",
			"chipsetdenomcount": "{n} 種面額",
			"pickchipset": "選擇要載入的計分牌組合",
			"pickchipsethint": "個人資料有多組計分牌，請選擇要套用的類別。",
			"pickcancel": "取消",
			"chipsloaded": "已從個人資料載入 {n} 種面額"
		},
		"index": {
			"index": "首頁",
			"signin": "登入",
			"signup": "註冊",
			"adminuser": "管理使用者"
		},
		"gametype": {
			"cash": "現金局",
			"tournament": "錦標賽",
			"limited": "限時錦標賽"
		},
		"seatingtype": {
			"buyin": "買入",
			"rebuy": "重新買入",
			"leave": "離席"
		},
		"seating": {
			"CO": "關煞(CO)",
			"HJ": "劫位(HJ)",
			"BTN": "莊家(BTN)",
			"SB": "小盲",
			"BB": "大盲",
			"UTG": "槍口(UTG)",
			"UTG+1": "槍口+1",
			"UTG+2": "槍口+2",
			"MP": "中位(MP)",
			"MP+1": "中位+1"
		},
		"projectandapi": {
			"newapi": "新增api",
			"back": "返回",
			"index": "首頁",
			"signout": "登出",
			"copyrootlink": "複製根目錄連結",
			"editproject": "修改專案",
			"deleteproject": "刪除專案",
			"copylink": "複製連結",
			"editapi": "修改api",
			"deleteapi": "刪除api",
			"newproject": "新增專案",
			"projecttitle": "專案名稱",
			"projectdescription": "專案描述",
			"projectrootlink": "專案根目錄",
			"projectpermission": "專案權限",
			"projectpermissionpublic": "公開",
			"projectpermissioninvite": "邀請",
			"projectpermissionprivate": "私人",
			"projecttype": "專案權限類型",
			"projecttypeedit": "編輯",
			"projecttypeadd": "新增",
			"projecttypeview": "查看",
			"testapi": "發送測試",
			"setpermission": "設定權限"
		},
		"errorlist": {
			"ERROR_request_mimes_type_error": "檔案需為圖片",
			"ERROR_request_data_not_found": "請確認必填欄位",
			"ERROR_request_data_type_error": "欄位格式不正確",
			"ERROR_username_error": "使用者名稱錯誤",
			"ERROR_token_error": "登入狀態已失效，請重新登入",
			"ERROR_token_not_found": "登入狀態已失效，請重新登入",
			"ERROR_no_permission": "沒有操作權限",
			"ERROR_user_not_found": "找不到使用者",
			"ERROR_session_not_found": "找不到賽事",
			"ERROR_product_not_found": "找不到此商品",
			"ERROR_phone_exist": "手機號碼已存在",
			"ERROR_email_exist": "電子郵件已存在",
			"NETWORK_ERROR": "網路不佳，請檢查連線後再試一次",
			"GOOGLE_CREDENTIAL_MISSING": "Google 登入沒有取得憑證，請重新嘗試",
			"GOOGLE_SIGNIN_FAILED": "Google 登入流程失敗，請關閉彈窗後再試一次",
			"BACKEND_SIGNIN_FAILED": "登入驗證失敗，請重新登入",
			"ERROR_table_not_found": "找不到牌桌",
			"ERROR_request_timeout": "連線逾時，請檢查網路後重試",
			"ERROR_only_latest_hand_deletable": "只能刪除最新一筆紀錄，以免後面手牌的計分牌錯亂",
			"ERROR_already_registered": "此選手已報名",
			"ERROR_registration_not_found": "找不到報名資料",
			"ERROR_session_relation_not_found": "此賽事尚未設定下一場多日賽",
			"ERROR_session_not_open_for_registration": "此賽事未開放報名",
			"ERROR_cannot_register_own_session": "不能報名自己主辦的賽事",
			"WARNING_rebuycount_exceeded": "重購次數已超過賽事設定，請再次確認",
			"WARNING_addoncount_exceeded": "增購次數已超過賽事設定，請再次確認",
			"ERROR_too_many_requests": "操作太頻繁，請稍後再試",
			"ERROR_database_error": "資料寫入失敗，請稍後再試",
			"ERROR_timer_save_conflict": "計時器狀態已被其他人更新，請重試",
			"ERROR_session_ended": "賽事已結束",
			"ERROR_player_eliminated": "選手已淘汰",
			"ERROR_hand_not_found": "找不到手牌",
			"ERROR_club_not_found": "此協會不存在",
			"ERROR_series_not_found": "查無系列賽",
			"ERROR_already_signed_up": "帳號已註冊",
			"ERROR_signin_error": "登入驗證失敗",
			"ERROR_timer_player_not_found": "找不到計時器選手",
			"ERROR_api_not_found": "找不到 API",
			"ERROR_type_not_found": "查無類型",
			"ERROR_unknow_error_pls_tell_the_admin": "發生未知錯誤，請聯絡管理員"
		},
		"breadcrumb": {
			"index": "專案主頁",
			"newapi": "新增API"
		},
		"warning": {
			"exitpage": "確定要離開嗎,將丟失未儲存的內容"
		},
		"type": {
			"game": {
				"HE": "德州撲克",
				"OM": "奧馬哈",
				"ST": "7張梭哈",
				"MX": "混合遊戲",
				"O8": "奧馬哈高低",
				"O5": "5張奧馬哈",
				"BO": "5張奧馬哈高低",
				"RA": "7張梭哈低牌",
				"S8": "7張梭哈高低",
				"CP": "瘋狂菠蘿",
				"SH": "超級德州(三卡賽)",
				"BU": "巴杜基",
				"AS": "A-5單次換牌",
				"AD": "A-5兩次換牌",
				"AT": "A-5三次換牌",
				"DS": "2-7單次換牌",
				"DD": "2-7兩次換牌",
				"DT": "2-7三次換牌",
				"SD": "短牌",
				"ZZ": "其他(Other) "
			},
			"limit": {
				"NL": "無限注",
				"PL": "底池限注",
				"FL": "固定注"
			},
			"stack": {
				"N": "正常",
				"D": "深籌",
				"L": "深籌",
				"S": "極深籌",
				"M": "巨籌",
				"U": "極巨籌"
			},
			"event": {
				"OD": "單日賽",
				"SA": "衛星賽",
				"MS": "里程碑衛星賽",
				"ND": "多日賽"
			}
		},
		"mainpage": {
			"title": "主儀表板",
			"todayprofit": "今日盈虧",
			"weekprofit": "本週盈虧",
			"monthprofit": "本月盈虧",
			"weeklytrend": "個人前週盈虧趨勢圖",
			"profit": "盈虧",
			"networkerror": "網路不佳，請重新嘗試",
			"summarytitle": "收益摘要",
			"summarydesc": "這裡會放最常用的入口、角色提示與近期狀態。",
			"quicktitle": "快速入口",
			"recenttitle": "上次操作頁",
			"recentdesc": "可快速回到你前次中斷的工作頁面",
			"recentempty": "目前沒有可返回的上次頁面",
			"sessionentrytitle": "場次列表",
			"sessionentrydesc": "查看可報名、主辦或已參與的場次",
			"profileentrytitle": "個人資料",
			"profileentrydesc": "管理個人資料、角色、受聘與個人摘要",
			"benefitentrytitle": "收益分析",
			"benefitentrydesc": "查看收益走勢圖，適合回顧而不是首頁替代",
			"staffentrytitle": "受聘與角色",
			"staffentrydesc": "查看你目前的角色分工與聘用關係",
			"timerentrytitle": "計時器工作",
			"timerentrydesc": "裁判與助理可快速前往可操作的場次計時器",
			"playerrole": "選手 / 主辦者",
			"dealerrole": "發牌員",
			"floorrole": "裁判",
			"assistantrole": "助理",
			"nextstepstitle": "建議下一步",
			"nosummary": "目前沒有近期統計資料，可先去場次列表或個人資料開始。"
		},
		"profile": {
			"title": "個人資料",
			"playerid": "選手 ID",
			"monthreport": "月報表",
			"yearreport": "年報表",
			"allreport": "生涯報表",
			"selectmonth": "選擇年月：",
			"selectyear": "選擇年份：",
			"includefee": "盈虧計算包含服務費",
			"includefeedesc": "取消勾選後，盈虧只算買入金額本身",
			"cash": "現金桌",
			"tlt": "限時錦標賽",
			"mtt": "錦標賽",
			"games": "局數",
			"sessions": "場次",
			"totalbuyin": "總買入",
			"totalprofit": "總收益",
			"buyincount": "總組數",
			"reporttotal": "總盈虧",
			"exportcsv": "匯出 CSV",
			"exportdone": "已匯出 CSV",
			"exportnodata": "目前沒有可匯出的資料",
			"excludefee": "盈虧計算不含服務費",
			"exportcoltype": "類型",
			"exportcolgames": "局數／場次",
			"exportcolbuyincount": "總組數",
			"staff": "聘用人員",
			"employed": "已聘用",
			"dealer": "發牌員",
			"floor": "裁判",
			"assistant": "助理",
			"manage": "管理",
			"language": "選擇語言",
			"chinese": "中文",
			"english": "英文",
			"localtimer": "簡易本地計時器",
			"refereecontrol": "裁判控制台",
			"staffmodalcurrent": "目前名單",
			"staffmodaladd": "新增",
			"staffmodalclose": "關閉",
			"staffinputplaceholder": "輸入使用者 ID（e.g. 00000099）",
			"empty": "尚無成員",
			"unemployed": "目前尚未被任何選手聘用。",
			"unnamed": "未命名選手",
			"pending": "待確認",
			"tokenexpired": "權杖已失效，請重新登入",
			"networkerror": "網路不佳，請重新嘗試",
			"invitesent": "已寄出邀請信給 ",
			"targetuser": "該使用者",
			"usernotfound": "找不到該使用者",
			"rolemismatch": "該使用者的帳號類型與此職位不符",
			"alreadyinvited": "此使用者已經在名單中",
			"selfinvite": "不能邀請自己",
			"unknownerror": "未知錯誤",
			"removeconfirm": "確定要移除此員工嗎?",
			"signoutconfirmtitle": "確認登出",
			"signoutconfirmmessage": "確定要登出目前帳號嗎?",
			"signouting": "登出中...",
			"toolssectiontitle": "小工具",
			"toolssectiondesc": "現場與練習常用的快速工具",
			"toolequitytitle": "勝率解算器",
			"toolequitydesc": "德州 / 奧馬哈 手牌勝率與 out",
			"tooltbtitle": "Timebank 計時器",
			"tooltbdesc": "多情境時間、點一下開始/暫停",
			"toolpotitle": "底池賠率",
			"toolpodesc": "底池賠率與所需勝率",
			"toolicmtitle": "ICM / 拆彩金",
			"toolicmdesc": "ICM 期望值與 chip-chop",
			"toolsctitle": "計分牌量換算",
			"toolscdesc": "BB 數與 M 值",
			"toolsptitle": "邊池計算",
			"toolspdesc": "多人 all-in 主池與邊池分配",
			"toolhctitle": "主辦財務試算",
			"toolhcdesc": "成本、獎池、保底 overlay 與盈虧",
			"toolbstitle": "下注大小",
			"toolbsdesc": "各種 pot 比例與對手所需勝率",
			"toolspltitle": "平分彩池",
			"toolspldesc": "平分彩池與 odd chips 分配",
			"toolrktitle": "抽水計算",
			"toolrkdesc": "現金桌抽水、cap 與實拿",
			"toolpftitle": "Preflop 決策卡",
			"toolpfdesc": "開牌範圍、加注尺寸、push/fold",
			"toolgtotitle": "GTO 範圍",
			"toolgtodesc": "翻前 push/fold／RFI 範圍 + 翻牌 CFR 求解器（eval7 自算）",
			"toolfstitle": "翻後 GTO 求解器",
			"toolfsdesc": "自製 CFR 即時求解翻牌局面策略",
			"toolcstitle": "起始計分牌配置",
			"toolcsdesc": "依面額自動建議每人計分牌顆數",
			"toolsgtitle": "結構產生器",
			"toolsgdesc": "即時盲注結構＋自動換籌＋匯出 JSON",
			"tooldutitle": "賽事時長估算",
			"tooldudesc": "估算總時長與級數",
			"toolastitle": "平均計分牌",
			"toolasdesc": "平均計分牌與平均 BB",
			"toolcrtitle": "Chip Race",
			"toolcrdesc": "移除小面額換計分牌與餘值",
			"toolcutitle": "計分牌換色",
			"toolcudesc": "把金額拆成計分牌顆數",
			"toolbptitle": "報名費拆分",
			"toolbpdesc": "獎池 / 手續費 / bounty 拆分",
			"toollrtitle": "Late Reg 截止",
			"toollrdesc": "算出報名截止時刻",
			"toolbktitle": "Break 排程",
			"toolbkdesc": "各次休息的時刻表",
			"toolsdtitle": "座位抽籤",
			"toolsddesc": "隨機分配桌號與座位",
			"toolpstitle": "選手成績",
			"toolpsdesc": "ROI、ITM 率與淨利",
			"toolmctitle": "Min Cash 倍率",
			"toolmcdesc": "買入倍率與損益兩平 ITM",
			"toolbotitle": "Bounty 價值",
			"toolbodesc": "一般 / PKO 賞金入袋估算",
			"toolsprtitle": "SPR 計算器",
			"toolsprdesc": "底池計分牌比與承諾度",
			"toolectitle": "Even Chop",
			"toolecdesc": "剩餘獎金平均拆分",
			"tooltftitle": "桌費／時租",
			"tooltfdesc": "桌數時租總成本與分攤",
			"toolsttitle": "工作人員薪資",
			"toolstdesc": "時薪、獎金、交通試算",
			"toolbftitle": "Bluff 平衡頻率",
			"toolbfdesc": "下注大小對應詐唬比例",
			"toolmutitle": "全下對戰勝率表",
			"toolmudesc": "常見 preflop 對戰參考",
			"toolgltitle": "中英術語對照",
			"toolgldesc": "可搜尋的撲克術語表",
			"toolrutitle": "規則速查",
			"toolrudesc": "常見賽事規則重點",
			"toolhrtitle": "牌型排名",
			"toolhrdesc": "10 種牌型大小排序",
			"toolpztitle": "位置參考",
			"toolpzdesc": "9 人桌位置與打法",
			"tooldotitle": "聽牌補牌表",
			"tooldodesc": "常見聽牌 outs 與成牌率",
			"toolrgtitle": "報名 / 獎池進度",
			"toolrgdesc": "進度條與距保底差額",
			"tooldstitle": "計分牌深度策略",
			"tooldsdesc": "依 BB 數給打法建議",
			"toolpptitle": "起手牌機率",
			"toolppdesc": "常見起手與翻牌機率",
			"tooloctitle": "賠率換算",
			"toolocdesc": "勝率、對賠與隱含勝率",
			"toolcctitle": "計分牌顏色對照",
			"toolccdesc": "常見計分牌配色面額",
			"toolhetitle": "手數估算",
			"toolhedesc": "每小時與每級手數",
			"toolestitle": "有效計分牌",
			"toolesdesc": "雙方較小計分牌與 BB 數",
			"toolbrtitle": "Bankroll 建議",
			"toolbrdesc": "依賽制建議買入數",
			"tooltstitle": "小費分配",
			"tooltsdesc": "floor 抽成與發牌員分配",
			"toollctitle": "級數時刻表",
			"toollcdesc": "每級與休息的時刻",
			"toolcntitle": "點碼計算",
			"toolcndesc": "各面額顆數即時加總",
			"toolcbtitle": "C-bet 參考卡",
			"toolcbdesc": "依牌面頻率與尺寸",
			"toolbdtitle": "大盲防守參考",
			"toolbddesc": "面對各位置 open 的防守",
			"toolcktitle": "主辦 Checklist",
			"toolckdesc": "賽前/賽中/收場勾選",
			"toolngtitle": "賽事命名建議",
			"toolngdesc": "模板組合命名靈感",
			"toolwrtitle": "現金桌時薪估算",
			"toolwrdesc": "bb/100 換算期望時薪",
			"toolaetitle": "Add-on 划算嗎",
			"toolaedesc": "每計分牌成本比較",
			"toolcdtitle": "倒數計時器",
			"toolcddesc": "倒數到指定時刻",
			"toolsftitle": "現場人力配置",
			"toolsfdesc": "桌數/dealer/floor/助理",
			"toolrstitle": "翻牌前加注尺寸",
			"toolrsdesc": "open/3bet/4bet 尺寸卡",
			"toolwptitle": "計分牌奪冠機率",
			"toolwpdesc": "依計分牌占比簡易估算",
			"toolbatitle": "BB Ante 換算",
			"toolbadesc": "傳統前注與 BB ante 對齊",
			"toolbutitle": "淘汰速率估算",
			"toolbudesc": "淘汰速率與 FT 預估",
			"toolrttitle": "ROI 目標反推",
			"toolrtdesc": "每場需回收金額",
			"tooltbtitle2": "桌位平衡建議",
			"tooltbdesc2": "各桌人數平衡提示",
			"toolittitle": "選手投入追蹤",
			"toolitdesc": "單場投入與淨利",
			"toolsktitle": "結構快慢檢查",
			"toolskdesc": "每小時盲注成長評估",
			"toolbetitle": "主辦損益平衡",
			"toolbedesc": "回本所需報名人數",
			"toolsatitle": "衛星賽席位換算",
			"toolsadesc": "獎池換算晉級席位數",
			"tooliotitle": "隱含賠率",
			"tooliodesc": "含後續可贏的所需勝率",
			"toolsmtitle": "賣股 / Markup",
			"toolsmdesc": "賣股成本與鎖定利潤",
			"toolcititle": "全場計分牌需求",
			"toolcidesc": "各面額全場備量",
			"toolbntitle": "賞金池估算",
			"toolbndesc": "總賞金池與 PKO 頭上",
			"toolbctitle": "盲注追上估算",
			"toolbcdesc": "幾級後進入短碼",
			"tooltrtitle": "3-bet / 4-bet 範圍卡",
			"tooltrdesc": "價值與詐唬範圍參考",
			"toolrvtitle": "河牌下注參考",
			"toolrvdesc": "價值/詐唬頻率與尺寸",
			"tooloptitle": "發牌流程速查",
			"toolopdesc": "發牌與錯誤處理重點",
			"toolbztitle": "泡沫壓力指數",
			"toolbzdesc": "接近獎圈的 ICM 壓力提示",
			"toolrctitle": "現場收款對帳",
			"toolrcdesc": "應收 vs 實收差額",
			"toolrftitle": "退賽退費試算",
			"toolrfdesc": "依政策算可退金額",
			"toolrptitle": "報名進度配速",
			"toolrpdesc": "達標所需報名配速",
			"toolwltitle": "候補等待估算",
			"toolwldesc": "候補等待與消化時間",
			"toolkptitle": "賽事 KPI 摘要",
			"toolkpdesc": "抽水率、淨利率等指標",
			"toolpbtitle": "底池成長試算",
			"toolpbdesc": "多街下注後的底池",
			"toolcatitle": "計分牌總量稽核",
			"toolcadesc": "應有 vs 清點差異",
			"toolpntitle": "收益夥伴分配",
			"toolpndesc": "依比例分配收益",
			"toolpttitle": "獎金分配表",
			"toolptdesc": "總獎池→各名次獎金",
			"toolapidoctitle": "公開 API 文件",
			"toolapidocdesc": "小工具的公開 API 說明",
			"playerviewdesc": "管理個人摘要、報表與聘用人員。",
			"staffviewdesc": "查看你被哪位選手聘用，以及目前的角色分工。",
			"eyebrow": "Profile",
			"name": "名稱",
			"role": "角色",
			"email": "電子信箱",
			"playerrole": "選手 / 主辦者",
			"focusprofile": "個人資料",
			"focusreport": "摘要報表",
			"focusstaffmanage": "聘用管理",
			"focuspreferences": "偏好設定",
			"focusrelation": "受聘關聯",
			"focusrole": "角色資訊",
			"basicsectiontitle": "基本資料",
			"basicsectiondesc": "確認目前帳號角色與聯絡資訊。",
			"reportsectiontitle": "個人摘要報表",
			"reportsectiondesc": "這裡保留高頻摘要，長期走勢請前往進階報表。",
			"reportsectionstaffdesc": "員工帳號也能查看摘要，但主要工作重點通常在受聘關聯與角色資訊。",
			"reportpositionnote": "摘要報表適合快速查看本月、本年與生涯結果，不取代首頁摘要。",
			"advancedreportentry": "前往進階報表",
			"staffsectiontitle": "聘用關聯",
			"staffsectiondesc": "選手可管理全域聘用名單，快速掌握各角色狀態。",
			"employmentsectiontitle": "受聘關聯",
			"employmentsectiondesc": "查看你目前服務的主辦者與對應角色。",
			"preferencessectiontitle": "偏好設定",
			"preferencessectiondesc": "集中管理語言與個人常用計分牌設定。",
			"languagecardtitle": "語言",
			"languagecarddesc": "切換介面語言。",
			"chipcolorcardtitle": "計分牌顏色種類",
			"chipcolorcarddesc": "整理場次設定可用的顏色名稱。",
			"chipsetcardtitle": "常用計分牌組合",
			"chipsetcarddesc": "儲存常用面額組合，供場次快速匯入。",
			"shakecardtitle": "搖一搖回報問題",
			"shakecarddesc": "在手機上搖晃裝置，快速開啟「聯絡我們」視窗。",
			"shakeon": "已開啟（點擊關閉）",
			"shakeoff": "已關閉（點擊開啟）",
			"shakeenabled": "已開啟搖一搖回報",
			"shakedisabled": "已關閉搖一搖回報",
			"shakepermissiondenied": "未取得裝置動作感應權限，無法使用搖一搖",
			"deleteaccountcardtitle": "刪除帳號",
			"deleteaccountcarddesc": "永久刪除此帳號與所有相關資料，此操作無法復原。",
			"deleteaccountstep1title": "確認刪除帳號",
			"deleteaccountstep1message": "此操作「無法復原」，將會「真刪除」所有跟這個帳號有關的資料，包含場次、手牌、報名、聘用、通知與個人設定。確定要繼續嗎？",
			"deleteaccountstep1confirm": "我了解，繼續",
			"deleteaccountstep2title": "最後確認",
			"deleteaccountstep2message": "此操作「無法復原」，所有資料將被「真刪除」且無法找回。請輸入你的選手 ID 以確認永久刪除帳號。",
			"deleteaccountinputplaceholder": "選手 ID",
			"deleteaccountfinalbutton": "永久刪除帳號",
			"deleteaccountmismatch": "選手 ID 不符，請再確認",
			"deleteaccountdeleting": "刪除中...",
			"deleteaccountsuccess": "帳號已刪除",
			"emptychipsetpreview": "尚未設定常用計分牌組合",
			"staffcountprefix": "目前 ",
			"staffcountsuffix": " 位",
			"active": "已啟用",
			"remove": "移除",
			"removesuccess": "已移除",
			"languagesaved": "語言設定已更新",
			"nochipcolors": "尚未設定計分牌顏色",
			"chipsetdefaultname": "新計分牌組合",
			"chipcolornameplaceholder": "名稱",
			"chipsetnameplaceholder": "組合名稱",
			"chipshape_circle": "圓形",
			"chipshape_square": "方形",
			"chipcolormodaldesc": "這些顏色會出現在場次設定的計分牌顏色選單中。",
			"chipcolornameheader": "顏色名稱",
			"chipcolorheader": "顏色",
			"addcolor": "新增顏色",
			"newcolor": "新顏色",
			"save": "儲存",
			"savesuccess": "儲存成功",
			"chipsetmodaldesc": "儲存後可在場次設定快速匯入面額組合。",
			"addset": "新增組合",
			"addchip": "新增計分牌",
			"toollistentry": "查看全部工具"
		},
		"clublist": {
			"title": "協會管理",
			"searchplaceholder": "搜尋協會名稱 / 地址 / 註解",
			"search": "搜尋",
			"addclub": "新增協會",
			"name": "協會名稱",
			"address": "協會地址",
			"note": "註解",
			"action": "操作",
			"stats": "協會統計",
			"totalclubs": "總協會數",
			"displaycount": "顯示數量",
			"edit": "編輯",
			"delete": "刪除",
			"cancel": "取消",
			"editclub": "編輯協會",
			"deleteconfirm": "確定刪除此協會?",
			"deletesuccess": "刪除成功",
			"deletefail": "刪除失敗",
			"addsuccess": "新增成功",
			"editsuccess": "修改成功",
			"operationfail": "操作失敗",
			"tokenexpired": "權限已失效,請重新登入",
			"unknownerror": "未知錯誤",
			"emptyall": "目前還沒有場地 / 協會資料",
			"emptysearch": "沒有符合篩選條件的場地 / 協會",
			"nextadd": "可以先新增一個常用場地，方便後續建立場次。",
			"deletenext": "該場地已從列表移除，你可以繼續整理其他場地。",
			"clear": "清空"
		},
		"sessionlist": {
			"title": "場次管理",
			"startdate": "開始日期",
			"enddate": "結束日期",
			"selectclub": "-- 請選擇 --",
			"allgametype": "全部遊戲類型",
			"name": "名稱",
			"search": "搜尋",
			"newsession": "新增場次",
			"stats": "場次統計預覽",
			"gamecount": "總場次",
			"totalprofit": "總盈虧",
			"avgduration": "平均時長",
			"time": "時間",
			"buyin": "買入",
			"place": "名次",
			"totalregister": "總報名",
			"profit": "盈虧",
			"action": "操作",
			"entryfee": "入場費",
			"owner": "主辦",
			"staff": "已聘用",
			"registered": "已報名",
			"confirmed": "已確認",
			"registerable": "可報名",
			"running": "進行中",
			"ended": "已結束",
			"unregister": "取消報名",
			"register": "報名此場次",
			"displaytimer": "顯示計時器",
			"structure": "查看結構",
			"timer": "計時器",
			"copy": "複製",
			"edit": "編輯",
			"delete": "刪除",
			"minute": "分鐘",
			"hour": "小時",
			"registersuccess": "報名成功, 等待主辦確認",
			"alreadyregistered": "您已經報名過了",
			"cannotown": "不能報名自己主辦的場次",
			"notopen": "此場次未開放報名",
			"unknownerror": "未知錯誤",
			"unregisterconfirm": "確定要取消報名嗎?",
			"unregistersuccess": "已取消報名",
			"deleteconfirm": "確定刪除?",
			"deletesuccess": "刪除成功",
			"tokenexpired": "權限已失效，請重新登入",
			"networkerror": "網路不佳，請重新嘗試",
			"quickfilters": "快速篩選",
			"exportcsv": "匯出 CSV",
			"exportdone": "已匯出 CSV",
			"exportnodata": "目前沒有可匯出的場次",
			"colname": "場次名稱",
			"colcode": "代碼",
			"colstart": "開始時間",
			"colend": "結束時間",
			"colbuyin": "買入",
			"colplace": "名次/總買入",
			"colprofit": "盈虧",
			"onlyregisterable": "可報名",
			"onlyowned": "主辦",
			"onlyjoined": "有參與",
			"emptyall": "目前還沒有可顯示的場次",
			"emptysearch": "沒有符合篩選條件的場次",
			"nextnewsession": "可以先建立新場次，或放寬篩選條件再查看。",
			"nextdetail": "你可以繼續查看場次詳情或調整篩選條件。",
			"clearfilter": "清空條件",
			"clearsearch": "清空",
			"filteropen": "展開",
			"filterclose": "收合",
			"filtertitle": "篩選搜尋",
			"eliminated": "已淘汰"
		},
		"benefit": {
			"title": "進階報表",
			"startdate": "開始日期",
			"enddate": "結束日期",
			"search": "查詢",
			"reset": "重置",
			"dailyprofit": "當日收益",
			"cumulativeprofit": "累計收益",
			"date": "日期",
			"amount": "金額",
			"minute": "分鐘",
			"hour": "小時",
			"networkerror": "網路不佳，請重新嘗試",
			"positiondesc": "",
			"emptychart": "目前沒有可生成收益趨勢的資料",
			"eyebrow": "Advanced Report",
			"backtoprofile": "回個人資料",
			"filtertitle": "日期篩選",
			"filterdesc": "依區間檢視累積收益走勢與結果摘要。",
			"summaryrangetitle": "查詢區間",
			"summarytotaltitle": "累積收益",
			"summarycounttitle": "日期筆數",
			"resultdescprefix": "顯示",
			"to": "到",
			"resultdescsuffix": "的累積收益趨勢。",
			"emptyresultdesc": "目前範圍內沒有可顯示的收益資料，請調整日期或先回場次列表累積資料。",
			"emptychartdesc": "調整日期區間或先回場次列表累積資料。"
		},
		"cancel": "取消",
		"default": "預設模式",
		"coding": "程式碼模式",
		"clearall": "清空全部",
		"reset": "重設",
		"back": "返回",
		"signout": "登出",
		"submit": "送出",
		"confirm": "確認",
		"clearallconfirm": "確認清空全部?",
		"clearallconfirmdescription": "此操作將清空所有內容並不能復原,請確認是否繼續?",
		"resetconfirm": "確認重設?",
		"resetconfirmdescription": "此操作將重設所有內容並不能復原,請確認是否繼續?",
		"deleteconfirm": "確認刪除",
		"deleteconfirmdescription": "此操作將刪除該項目",
		"copyed": "已複製",
		"auth": {
			"reauth": "請重新登入後再繼續",
			"ERROR_token_not_found": "登入狀態已失效，系統沒有找到登入資料。",
			"ERROR_token_error": "登入狀態已失效，登入憑證已無法通過驗證。",
			"ERROR_no_permission": "你目前沒有進入此頁或操作此功能的權限。",
			"NETWORK_ERROR": "網路不佳，請檢查連線後再試一次",
			"GOOGLE_CREDENTIAL_MISSING": "Google 登入沒有取得憑證，請重新嘗試",
			"GOOGLE_SIGNIN_FAILED": "Google 登入流程失敗，請關閉彈窗後再試一次",
			"BACKEND_SIGNIN_FAILED": "登入驗證失敗，請重新登入"
		},
		"signinpage": {
			"title": "登入",
			"heading": "歡迎回來",
			"subheading": "使用 Google 登入 PokerTrace，繼續你的場次與工作流程。",
			"googlebutton": "使用 Google 登入",
			"googlefallbackhint": "若沒有跳出視窗，請改用下方按鈕登入。",
			"errorbox": "登入狀態說明",
			"commonreasons": "常見失敗原因",
			"reasongoogle": "Google 彈窗被關閉，或 Google 沒有成功回傳登入憑證。",
			"reasonnetwork": "網路不穩定、後端沒有回應，或你目前無法連到服務。",
			"reasonbackend": "Google 登入成功，但後端 token 驗證失敗或權限已失效。",
			"retryhint": "若無法登入，請先重新登入，必要時可重新整理頁面再試。",
			"firsttitle": "首次登入說明",
			"firstdesc": "首次登入後，系統會請你補齊角色與語言資料，完成後就能回到上一頁繼續。",
			"backtooriginal": "登入後將嘗試回到原本頁面。",
			"retrybutton": "重新嘗試"
		},
		"staffverifypage": {
			"title": "員工邀請確認",
			"eyebrow": "Staff Invite",
			"loadingtitle": "驗證中...",
			"loadingdesc": "正在處理您的邀請確認",
			"successtitle": "確認成功！",
			"successuser": "您已成功加入該主辦的員工名單。",
			"successsession": "您已成功加入該場次的員工名單。",
			"alreadytitle": "已確認過",
			"alreadydesc": "您先前已確認過此邀請。",
			"failedtitle": "驗證失敗",
			"faileddesc": "此連結無效或已過期。",
			"signin": "前往登入",
			"home": "回首頁",
			"timeout": "驗證時間較久，請檢查連線後重試",
			"timeoutlong": "驗證時間較久，請檢查連線後重試，或重新整理頁面 / 回首頁",
			"missing": "缺少驗證連結，請從邀請信件點選連結",
			"invalid": "驗證連結無效或已過期"
		},
		"signuppage": {
			"welcometitle": "感謝您註冊PokerTrace！",
			"welcomesub": "Welcome to the PokerTrace · 建立您的帳號以開始使用",
			"usernamelabel": "顯示名稱",
			"usernamelabelhint": "Display Name",
			"usernameplaceholder": "請輸入您的名稱…",
			"usernameerror": "⚠ 請輸入名稱",
			"languagelabel": "語言偏好",
			"languagelabelhint": "Language",
			"rolelabel": "帳號類型",
			"rolelabelhint": "Account Type",
			"rolewarning": "請注意，帳號類型選擇後無法再修改，請謹慎選擇",
			"roleerror": "⚠ 請選擇帳號類型",
			"roleplayer": "Player 選手",
			"roledealer": "Dealer 發牌員",
			"rolefloor": "Floor 裁判",
			"roleassistant": "Assistant 助理",
			"languagenamezhtw": "中文",
			"languagenameen": "English",
			"submitbutton": "確認送出 Submit",
			"submitting": "送出中…",
			"successtitle": "註冊成功！",
			"successwelcomeprefix": "歡迎，",
			"successwelcomesuffix": "！",
			"successrolelabel": "帳號類型：",
			"successlanglabel": "語言：",
			"successgomain": "前往主頁 →",
			"unknownerror": "未知錯誤"
		},
		"indexpage": {
			"title": "PokerTrace",
			"badge": "最強大、最簡單、最方便的德州撲克紀錄工具",
			"heroname": "PokerTrace",
			"herotagline": "任何選手都可以很輕鬆的使用（應該吧",
			"herodesc": "PokerTrace 主打選手即主辦者、完全免費、無廣告，程式碼全公開可自由使用。從建立賽事、報名清單、排座位、計時器控制，到多日賽晉級與收益統計，都能在同一個地方完成。",
			"step1title": "建立賽事",
			"step1desc": "不用付費、不看廣告，直接設定買入、重購、座位、計分牌面額與報名規則。",
			"step2title": "管理現場",
			"step2desc": "把報名、確認選手、平均排座、計時器與淘汰名單集中管理，減少現場混亂。",
			"step3title": "追蹤結果",
			"step3desc": "留下收益、ITM、Final Table、多日賽晉級與重複晉級紀錄，賽後也能回查。",
			"problemtitle": "它解決什麼問題？",
			"problemdesc": "許多小型賽事只能靠試算表、聊天群、紙本名單和臨時計時器撐住現場。PokerTrace 希望提供一個開源、可自架、沒有廣告干擾的選擇，讓主辦少切換工具，也讓選手資料更容易回查。",
			"feat1title": "完全免費",
			"feat1desc": "核心功能不收費，適合社群、朋友局與想自己管理資料的主辦。",
			"feat2title": "無廣告干擾",
			"feat2desc": "頁面專注在報名、座位、計時器與結果紀錄，不用在操作中被廣告打斷。",
			"feat3title": "開源透明",
			"feat3desc": "可以從 GitHub 查看原始碼，可自行部署，也能依照自己的賽事流程調整。",
			"feat4title": "賽事設定",
			"feat4desc": "主辦牌局、使用者連結、開放報名、買入與重購設定集中管理。",
			"feat5title": "報名清單",
			"feat5desc": "8 格選手 ID 搜尋、模糊查詢、直接報名、序號與狀態追蹤。",
			"feat6title": "座位安排",
			"feat6desc": "支援未入座補位、選取選手重排，以及全部桌平均排座。",
			"feat7title": "多日賽晉級",
			"feat7desc": "Day1 到 Day2/Day3 的關聯、晉級計分牌與重複晉級次數。",
			"feat8title": "計時器",
			"feat8desc": "盲注級別、休息、報名截止與顯示端同步。",
			"feat9title": "現場轉播與回放",
			"feat9desc": "公開賽事的統一手牌可即時串流到場外;手牌詳情也能動畫回放。",
			"feat10title": "工具百寶箱",
			"feat10desc": "勝率計算、ICM、計分牌稽核等數個小工具集中一站，不用切網站即可使用。",
			"feat11title": "多語言介面",
			"feat11desc": "介面支援中文與英文切換，方便跨地區選手社群使用。",
			"feat12title": "資料自主可自行架設",
			"feat12desc": "開源架構可部署在自己的伺服器，賽事資料自己保管。",
			"shot1title": "報名與排座",
			"shot1desc": "支援選手搜尋、全選操作、隨機入座、平均分桌與每桌座位數設定。",
			"shot2title": "計時器與顯示端",
			"shot2desc": "控制盲注結構、休息時間、報名截止、獎金分配與連動選手淘汰狀態。",
			"shotplaceholder": "截圖即將補上",
			"contactkicker": "一起讓 PokerTrace 更好",
			"contacttitle": "有任何建議都可以聯絡我們",
			"contactdesc": "功能想法、使用問題、賽事流程需求、錯誤回報都歡迎送出。PokerTrace 是開源專案，會依實際使用情境持續調整。",
			"contactbtn": "聯絡我們",
			"bottomtitle": "開始使用 PokerTrace",
			"bottomdesc": "完全免費開始使用；也可以到 GitHub 查看原始碼、回報問題或一起改進。",
			"actionsessionlist": "場次列表",
			"actionsignin": "登入",
			"actionnewsession": "新增賽事",
			"actionsignup": "註冊",
			"actionguide": "操作說明",
			"actiongithub": "GitHub",
			"actiondownloadpdf": "下載介紹 PDF",
			"navmobilesignin": "登入",
			"navmobilehome": "主頁",
			"toolstitle": "免費小工具",
			"toolssubtitle": "不用登入就能用的撲克現場與練習工具：勝率解算、GTO 參考、計時器、底池賠率、ICM、計分牌量換算。",
			"toolequitytitle": "勝率解算器",
			"toolequitydesc": "德州 / 奧馬哈 / 短牌 手牌勝率與 outs",
			"tooltbtitle": "Timebank 計時器",
			"tooltbdesc": "多情境時間、點一下開始/暫停",
			"toolpotitle": "底池賠率",
			"toolpodesc": "底池賠率與所需勝率",
			"toolicmtitle": "ICM / 拆彩金",
			"toolicmdesc": "ICM 期望值與 chip-chop",
			"toolsctitle": "計分牌量換算",
			"toolscdesc": "BB 數與 M 值",
			"toolsptitle": "邊池計算",
			"toolspdesc": "多人 all-in 主池與邊池分配",
			"toolhctitle": "主辦財務試算",
			"toolhcdesc": "成本、獎池、保底 overlay 與盈虧",
			"toolbstitle": "下注大小",
			"toolbsdesc": "各種 pot 比例與對手所需勝率",
			"toolspltitle": "平分彩池",
			"toolspldesc": "平分彩池與 odd chips 分配",
			"toolrktitle": "抽水計算",
			"toolrkdesc": "現金桌抽水、cap 與實拿",
			"toolpftitle": "Preflop 決策卡",
			"toolpfdesc": "開牌範圍、加注尺寸、push/fold",
			"toolgtotitle": "GTO 範圍",
			"toolgtodesc": "範圍參考策略",
			"tooltdaruletitle": "TDA規則手冊",
			"tooltdaruledesc": "2024 TDA 撲克賽事規則 PDF 預覽",
			"toolfstitle": "翻後 GTO 求解器",
			"toolfsdesc": "自製 CFR 即時求解翻牌局面策略",
			"toolcstitle": "起始計分牌配置",
			"toolcsdesc": "依面額自動建議每人計分牌顆數",
			"toolsgtitle": "結構產生器",
			"toolsgdesc": "即時盲注結構＋自動換籌＋匯出 JSON",
			"tooldutitle": "賽事時長估算",
			"tooldudesc": "估算總時長與級數",
			"toolastitle": "平均計分牌",
			"toolasdesc": "平均計分牌與平均 BB",
			"toolcrtitle": "Chip Race",
			"toolcrdesc": "移除小面額換計分牌與餘值",
			"toolcutitle": "計分牌換色",
			"toolcudesc": "把金額拆成計分牌顆數",
			"toolbptitle": "報名費拆分",
			"toolbpdesc": "獎池 / 手續費 / bounty 拆分",
			"toollrtitle": "Late Reg 截止",
			"toollrdesc": "算出報名截止時刻",
			"toolbktitle": "Break 排程",
			"toolbkdesc": "各次休息的時刻表",
			"toolsdtitle": "座位抽籤",
			"toolsddesc": "隨機分配桌號與座位",
			"toolpstitle": "選手成績",
			"toolpsdesc": "ROI、ITM 率與淨利",
			"toolmctitle": "Min Cash 倍率",
			"toolmcdesc": "買入倍率與損益兩平 ITM",
			"toolbotitle": "Bounty 價值",
			"toolbodesc": "一般 / PKO 賞金入袋估算",
			"toolsprtitle": "SPR 計算器",
			"toolsprdesc": "底池計分牌比與承諾度",
			"toolectitle": "Even Chop",
			"toolecdesc": "剩餘獎金平均拆分",
			"tooltftitle": "桌費／時租",
			"tooltfdesc": "桌數時租總成本與分攤",
			"toolsttitle": "工作人員薪資",
			"toolstdesc": "時薪、獎金、交通試算",
			"toolbftitle": "Bluff 平衡頻率",
			"toolbfdesc": "下注大小對應詐唬比例",
			"toolmutitle": "全下對戰勝率表",
			"toolmudesc": "常見 preflop 對戰參考",
			"toolgltitle": "中英術語對照",
			"toolgldesc": "可搜尋的撲克術語表",
			"toolrutitle": "規則速查",
			"toolrudesc": "常見賽事規則重點",
			"toolhrtitle": "牌型排名",
			"toolhrdesc": "10 種牌型大小排序",
			"toolpztitle": "位置參考",
			"toolpzdesc": "9 人桌位置與打法",
			"tooldotitle": "聽牌補牌表",
			"tooldodesc": "常見聽牌 outs 與成牌率",
			"toolrgtitle": "報名 / 獎池進度",
			"toolrgdesc": "進度條與距保底差額",
			"tooldstitle": "計分牌深度策略",
			"tooldsdesc": "依 BB 數給打法建議",
			"toolpptitle": "起手牌機率",
			"toolppdesc": "常見起手與翻牌機率",
			"tooloctitle": "賠率換算",
			"toolocdesc": "勝率、對賠與隱含勝率",
			"toolcctitle": "計分牌顏色對照",
			"toolccdesc": "常見計分牌配色面額",
			"toolhetitle": "手數估算",
			"toolhedesc": "每小時與每級手數",
			"toolestitle": "有效計分牌",
			"toolesdesc": "雙方較小計分牌與 BB 數",
			"toolbrtitle": "Bankroll 建議",
			"toolbrdesc": "依賽制建議買入數",
			"tooltstitle": "小費分配",
			"tooltsdesc": "floor 抽成與發牌員分配",
			"toollctitle": "級數時刻表",
			"toollcdesc": "每級與休息的時刻",
			"toolcntitle": "點碼計算",
			"toolcndesc": "各面額顆數即時加總",
			"toolcbtitle": "C-bet 參考卡",
			"toolcbdesc": "依牌面頻率與尺寸",
			"toolbdtitle": "大盲防守參考",
			"toolbddesc": "面對各位置 open 的防守",
			"toolcktitle": "主辦 Checklist",
			"toolckdesc": "賽前/賽中/收場勾選",
			"toolngtitle": "賽事命名建議",
			"toolngdesc": "模板組合命名靈感",
			"toolwrtitle": "現金桌時薪估算",
			"toolwrdesc": "bb/100 換算期望時薪",
			"toolaetitle": "Add-on 划算嗎",
			"toolaedesc": "每計分牌成本比較",
			"toolcdtitle": "倒數計時器",
			"toolcddesc": "倒數到指定時刻",
			"toolsftitle": "現場人力配置",
			"toolsfdesc": "桌數/dealer/floor/助理",
			"toolrstitle": "翻牌前加注尺寸",
			"toolrsdesc": "open/3bet/4bet 尺寸卡",
			"toolwptitle": "計分牌奪冠機率",
			"toolwpdesc": "依計分牌占比簡易估算",
			"toolbatitle": "BB Ante 換算",
			"toolbadesc": "傳統前注與 BB ante 對齊",
			"toolbutitle": "淘汰速率估算",
			"toolbudesc": "淘汰速率與 FT 預估",
			"toolrttitle": "ROI 目標反推",
			"toolrtdesc": "每場需回收金額",
			"tooltbtitle2": "桌位平衡建議",
			"tooltbdesc2": "各桌人數平衡提示",
			"toolittitle": "選手投入追蹤",
			"toolitdesc": "單場投入與淨利",
			"toolsktitle": "結構快慢檢查",
			"toolskdesc": "每小時盲注成長評估",
			"toolbetitle": "主辦損益平衡",
			"toolbedesc": "回本所需報名人數",
			"toolsatitle": "衛星賽席位換算",
			"toolsadesc": "獎池換算晉級席位數",
			"tooliotitle": "隱含賠率",
			"tooliodesc": "含後續可贏的所需勝率",
			"toolsmtitle": "賣股 / Markup",
			"toolsmdesc": "賣股成本與鎖定利潤",
			"toolcititle": "全場計分牌需求",
			"toolcidesc": "各面額全場備量",
			"toolbntitle": "賞金池估算",
			"toolbndesc": "總賞金池與 PKO 頭上",
			"toolbctitle": "盲注追上估算",
			"toolbcdesc": "幾級後進入短碼",
			"tooltrtitle": "3-bet / 4-bet 範圍卡",
			"tooltrdesc": "價值與詐唬範圍參考",
			"toolrvtitle": "河牌下注參考",
			"toolrvdesc": "價值/詐唬頻率與尺寸",
			"tooloptitle": "發牌流程速查",
			"toolopdesc": "發牌與錯誤處理重點",
			"toolbztitle": "泡沫壓力指數",
			"toolbzdesc": "接近獎圈的 ICM 壓力提示",
			"toolrctitle": "現場收款對帳",
			"toolrcdesc": "應收 vs 實收差額",
			"toolrftitle": "退賽退費試算",
			"toolrfdesc": "依政策算可退金額",
			"toolrptitle": "報名進度配速",
			"toolrpdesc": "達標所需報名配速",
			"toolwltitle": "候補等待估算",
			"toolwldesc": "候補等待與消化時間",
			"toolkptitle": "賽事 KPI 摘要",
			"toolkpdesc": "抽水率、淨利率等指標",
			"toolpbtitle": "底池成長試算",
			"toolpbdesc": "多街下注後的底池",
			"toolcatitle": "計分牌總量稽核",
			"toolcadesc": "應有 vs 清點差異",
			"toolpntitle": "收益夥伴分配",
			"toolpndesc": "依比例分配收益",
			"toolpttitle": "獎金分配表",
			"toolptdesc": "總獎池→各名次獎金",
			"toolapidoctitle": "公開 API 文件",
			"toolapidocdesc": "小工具的公開 API 說明"
		},
		"equitypage": {
			"title": "勝率解算器",
			"back": "回上一頁",
			"gametype": "遊戲類型",
			"gametypeswitchconfirm": "切換遊戲類型會移除目前不相容或多餘的牌，是否繼續?",
			"holdem": "德州撲克",
			"omaha": "奧馬哈",
			"omaha5": "奧馬哈 5",
			"shortdeck": "短牌",
			"handlist": "選手手牌",
			"hand": "手牌",
			"addhand": "新增選手",
			"remove": "刪除",
			"board": "公共牌",
			"dead": "燒牌 / 棄牌",
			"deadhint": "這些牌會從牌堆中移除，不計入勝率計算",
			"solve": "解算勝率",
			"clear": "清空",
			"close": "關閉",
			"confirm": "確認",
			"cancel": "取消",
			"win": "獲勝",
			"tie": "平手",
			"outlabel": "Out",
			"chopoutlabel": "Chop out",
			"needflop": "需要翻牌",
			"runnerrunner": "後門聽牌",
			"drawingdead": "聽死牌",
			"ahead": "領先",
			"winlocked": "獲勝",
			"tieonly": "平分底池",
			"minhand": "至少需要 2 手",
			"solvefail": "解算失敗，請稍後再試"
		},
		"timebankdrillpage": {
			"title": "Timebank 計時器",
			"back": "回上一頁",
			"presets": "時間情況設定",
			"seconds": "秒數",
			"label": "標籤",
			"add": "新增",
			"remove": "刪除",
			"taptostart": "點一下開始",
			"taptopause": "點一下暫停",
			"taptoresume": "點一下繼續",
			"timeup": "時間到",
			"badseconds": "秒數需大於 0"
		},
		"potoddspage": {
			"title": "底池賠率",
			"back": "回上一頁",
			"pot": "目前底池",
			"call": "要跟的注",
			"ratio": "底池賠率",
			"need": "所需勝率",
			"outstitle": "Outs → 勝率（4/2 法則）",
			"outs": "Outs 數",
			"flopodds": "翻牌看兩張 ≈",
			"turnodds": "轉牌看一張 ≈",
			"mdf": "最小防守頻率 MDF",
			"evtitle": "跟注 EV",
			"eq": "預估勝率 (%)",
			"ev": "跟注 EV",
			"advice": "建議",
			"evnote": "EV = 勝率 × 底池 −（1 − 勝率）× 跟注額。EV 為正代表長期跟注有利。",
			"callit": "該跟",
			"foldit": "該棄",
			"breakeven": "打平"
		},
		"sidepotpage": {
			"title": "邊池計算",
			"back": "回上一頁",
			"playerstitle": "選手投入",
			"player": "選手",
			"name": "名稱",
			"chips": "投入計分牌",
			"showdown": "攤牌",
			"remove": "刪除",
			"note": "取消「攤牌」表示該選手已棄牌：他投入的計分牌仍計入彩池，但不能贏得彩池。",
			"resulttitle": "彩池分配",
			"total": "總彩池",
			"mainpot": "主池",
			"sidepot": "邊池",
			"eligible": "可贏得",
			"noeligible": "—（無人攤牌）",
			"empty": "尚無投入",
			"minplayer": "至少需要 2 位選手"
		},
		"hostcostpage": {
			"title": "主辦財務試算",
			"back": "回上一頁",
			"inputtitle": "場次設定",
			"entries": "報名人數",
			"buyin": "買入（進獎池）",
			"fee": "手續費（進主辦）",
			"rebuycount": "Rebuy 次數",
			"rebuyamt": "Rebuy 金額",
			"reentrycount": "Re-entry 次數",
			"addoncount": "Addon 次數",
			"addonamt": "Addon 金額",
			"guarantee": "保底獎池",
			"cost": "固定成本（場租＋人事）",
			"note": "Rebuy／Re-entry 與買入同樣收手續費（進主辦）；買入／rebuy／addon 金額及 re-entry（視同重新買入）皆進獎池。可依實際規則調整。",
			"pool": "累積獎池",
			"payout": "實際發出獎池",
			"overlay": "主辦補貼 Overlay",
			"revenue": "主辦毛收入",
			"costtotal": "固定成本",
			"profit": "主辦淨利",
			"overlaywarn": "未達保底，主辦需補貼 {amount} overlay。",
			"overlayok": "已超過保底 {amount}，無 overlay。"
		},
		"betsizepage": {
			"title": "下注大小",
			"back": "回上一頁",
			"pot": "目前底池",
			"overbet": "Overbet 倍數",
			"hfraction": "下注比例",
			"hamount": "下注金額",
			"hneed": "對手所需勝率",
			"potlabel": "Pot 滿池",
			"note": "對手所需勝率 = 下注額 ÷（底池 + 2 × 下注額），即他跟注要划算所需的最低勝率。"
		},
		"splitpotpage": {
			"title": "平分彩池",
			"back": "回上一頁",
			"pot": "彩池",
			"ways": "平分人數",
			"chip": "最小面額",
			"base": "每人基本",
			"odd": "零頭計分牌（odd chips）",
			"remainder": "不可分配餘額",
			"seat": "座位",
			"note": "每人先拿可整除最小面額的相同金額，剩下無法均分的計分牌（odd chips）依習慣分給距離莊家左手最近的選手。底池無法被最小面額整除時，低於面額的部分會列為「不可分配餘額」，需另行處理（換籌或退還）。"
		},
		"rakepage": {
			"title": "抽水計算",
			"back": "回上一頁",
			"pot": "底池",
			"pct": "抽水 %",
			"cap": "上限 Cap（0=無）",
			"rake": "實際抽水",
			"win": "贏家實拿",
			"eff": "有效抽水率",
			"note": "實際抽水 = min(底池 × 抽水%, 上限)。有上限時大底池的有效抽水率會低於名目 %。"
		},
		"prefloppage": {
			"title": "Preflop 決策卡",
			"back": "回上一頁",
			"postitle": "位置（9-max 開牌 RFI）",
			"gridtitle": "開牌範圍",
			"percentlabel": "範圍佔比",
			"suitednote": "右上三角為同花（s），左下為不同花（o），對角線為口袋對。",
			"sizetitle": "加注尺寸建議",
			"sizebody": "9-max 標準開牌 2.2–2.5bb；有 ante 時 2.5–3bb。每有一位 limper 多加 1bb。SB 開牌可略大（3bb）以彌補位置劣勢。面對 3-bet 時 IP 約 3x、OOP 約 4x。",
			"pushtitle": "短碼 Push / Fold 參考",
			"pushbody": "≤10bb 後位（BTN/CO）：22+、A2s+、A7o+、K9s+、KTo+、Q9s+、JTs 可直接全下。≤8bb 範圍再放寬約一成。≤15bb 前位偏緊：88+、ATs+、AQo+。被先全下時跟注範圍要明顯收緊。",
			"disclaimer": "本表為 9-max 常見參考範圍，實戰需依對手、抽水、獎勵結構調整。"
		},
		"registerpage": {
			"csv_none": "目前沒有可匯出的報名資料",
			"csv_done": "已匯出 CSV",
			"csv_btn": "匯出 CSV",
			"csv_header": "序號|選手|選手ID|報名時間|狀態|成本|名次|獎金|收益"
		},
		"gtopage": {
			"title": "建議範圍參考",
			"subtitle": "翻前／翻後 GTO 參考：push/fold・RFI・對戰樹（2–10 人・NL/PL/FL・可加 ante）",
			"guidetitle": "使用說明（點開）",
			"back": "回上一頁",
			"street_preflop": "翻前",
			"street_flop": "翻後",
			"perseatlabel": "每座位不同計分牌（MTT，chip-EV 參考）",
			"streetnote": "轉牌／河牌：在「翻後」載入後於攤牌處往下抽",
			"guidehtml": "<div class='space-y-3 text-sm text-zinc-300'><p><b class='text-zinc-100'>這是什麼</b>：查詢翻前與翻後 GTO 參考策略的工具。先選<b>下注結構</b>與<b>遊戲類型</b>，再依控制列選人數／情境／ante／計分牌／位置，下方矩陣就顯示對應策略。</p><div><p><b class='text-zinc-100'>① 下注結構（NL／PL／FL）</b></p><ul class='list-disc pl-5 space-y-0.5'><li><b>無限注 NL</b>：可隨時全下。翻前 push/fold、深碼 RFI 與對戰樹都在此。</li><li><b>底池限注 PL</b>：下注上限＝底池。翻前開牌／3bet／全下的<b>範圍</b>與 NL 幾乎相同（沿用 NL 資料），差別在深碼多街尺寸受限；短碼一個底池加注≈全下。</li><li><b>限注 FL</b>：單注封頂、翻前只加固定額，<b>沒有全下</b>，所以沒有 push/fold／對戰樹；改用限注專屬翻前參考範圍（依位置群組）。限注偏緊、重牌力與高張、位置影響較小。</li></ul></div><div><p><b class='text-zinc-100'>② 遊戲類型（德州撲克 vs 短牌，分開說明）</b></p><ul class='list-disc pl-5 space-y-0.5'><li><b>德州撲克（Hold'em）</b>：標準 52 張、13×13 起手牌矩陣（C(52,2)=1326 種組合）。牌型由大到小：同花順＞四條＞葫蘆＞同花＞順子＞三條＞兩對＞一對＞高牌。</li><li><b>短牌 6+（Short Deck）</b>：拿掉 2–5，只剩 36 張、9×9 矩陣（C(36,2)=630 種組合）。牌型不同：<b>同花大於葫蘆</b>、<b>三條大於順子</b>（因少了 16 張，同花更難成、順子更易成）；A 可當 5 用，最小順子為 A-6-7-8-9。因各手 equity 更接近，翻前範圍普遍更寬、跟注更多。</li></ul></div><div><p><b class='text-zinc-100'>③ 人數（2–10）</b></p><p class='pl-1'>用 −／＋ 或直接輸入 2 到 10 人。系統依人數自動排座位（早位到盲注），並用「後面還有幾人」對應正確的開蓋範圍：人越多、位置越早 → 開得越緊。2 人＝單挑（SB vs BB）。</p></div><div><p><b class='text-zinc-100'>④ Ante（僅 NL／PL 的 push/fold）</b></p><p class='pl-1'>兩種模式：<b>每人</b>＝每人 ante 佔大盲的百分比（總 ante＝每人% × 人數）；<b>大盲 BBA</b>＝只有大盲位固定放一份 ante（輸入 BB 數，全桌一份、與人數無關，最常見 1bb）。ante 是死錢、會讓底池變大 → 全下與跟注都變寬。系統把總 ante 貼到最近的已算檔位（右側顯示）。無 ante 就填 0。</p></div><div><p><b class='text-zinc-100'>⑤ 情境</b></p><ul class='list-disc pl-5 space-y-0.5'><li><b>短碼全下</b>：短碼 push/fold 對戰樹。從最早位照順序點每人動作（全下／棄牌／跟注）；<b>點上方任一座位可直接跳到該位（前面全部蓋牌）</b>。勾「每座位不同計分牌」可做 MTT（chip-EV 參考，非 ICM）。</li><li><b>加注 & 抵抗</b>：深碼 open → 3bet → 面對 3bet（4bet）→ 面對 4bet（5bet）一路點，系統自動接對位範圍；<b>開池那一步就是 RFI 開牌範圍</b>。同樣可點座位跳位。</li><li><b>限注情境（FL）</b>：限注開牌（依早／中／晚／盲群組）與限注大盲防守。</li></ul></div><div><p><b class='text-zinc-100'>⑥ 怎麼讀矩陣</b></p><ul class='list-disc pl-5 space-y-0.5'><li>右上三角＝同花（s）、左下＝不同花（o）、對角線＝口袋對。</li><li>格子的<b>顏色比例</b>＝該手各動作的混合頻率（看下方動作圖例）。</li><li><b>點任一格</b>：看該手建議動作、混合頻率與 EV。</li><li>對戰樹上方的<b>大色塊</b>＝目前行動者整體動作佔比與 combo 數。</li></ul></div><div><p><b class='text-zinc-100'>⑦ 翻後流程</b></p><p class='pl-1'>切到「翻後」：選開池方位置＋對位＋點翻牌 → 翻後策略矩陣與大色塊 → 點動作往下走 → 攤牌時按<b>「抽轉牌／抽河牌」</b>選一張牌現算下一街。</p></div><p class='text-zinc-500 border-t border-zinc-800 pt-2'>所有範圍為教學參考（eval7 自算、含 ante 重算，或規則生成），非商業 solver 精解；PL 沿用 NL 範圍、FL 為規則生成參考。實戰需依 rake、賽制、對手傾向自行調整。</p></div>",
			"structurelabel": "下注結構",
			"struct_NL": "無限注",
			"struct_PL": "底池限注",
			"struct_FL": "限注",
			"gametypelabel": "遊戲類型",
			"game_HE": "德州撲克",
			"game_SD": "短牌 6+",
			"tabletypelabel": "人數",
			"playersuffix": "人",
			"spotlabel": "情境",
			"stacklabel": "有效計分牌",
			"antelabel": "Ante",
			"ante_mode_each": "每人",
			"ante_mode_bba": "大盲 BBA",
			"ante_suffix_each": "% BB／人",
			"ante_suffix_bba": "BB（大盲 ante）",
			"ante_none": "無 ante",
			"ante_total": "≈ 總 ante {bb}bb",
			"poslabel": "Hero 位置",
			"gridtitle": "起手牌矩陣",
			"percentlabel": "出手佔比",
			"legendtitle": "動作圖例",
			"detailtitle": "手牌詳情",
			"detailhint": "點選矩陣中的格子，這裡會顯示該手牌的建議動作與混合頻率。",
			"detailpure": "此情境下為單一動作，無混合頻率。",
			"ev_label": "全下相對棄牌 EV",
			"ev_indiff": "≈0 無差異（所以混合）",
			"ev_plus": "→ 該全下",
			"ev_minus": "→ 該棄牌",
			"suitednote": "右上三角為同花（s），左下為不同花（o），對角線為口袋對。點格子看詳情。",
			"summary": "{stack}bb 在 {position}，情境：{spot}",
			"versionlabel": "資料版本",
			"disclaimer": "本工具提供策略參考，不代表唯一最佳打法。所有範圍皆由 eval7 自算：SB 開蓋為精確 heads-up Nash，UTG~BTN 開蓋為多人桌 chip-EV 模型，面對全下的跟注為 equity vs 對手範圍 + 底池賠率；皆非商業 solver 輸出。實戰需依抽水、ante、計分牌深度、對手傾向、賽制與獎金結構調整。",
			"spot_PUSHFOLD": "Push / Fold（短碼全下）",
			"spot_PFTREE": "短碼全下",
			"spot_RFI": "RFI 開牌（深碼參考）",
			"spot_DEEPTREE": "加注 & 抵抗",
			"spot_FLRFI": "限注開牌（RFI 參考）",
			"spot_FLBBDEF": "限注大盲防守",
			"pl_disclaimer": "底池限注（PL）：翻前開牌／3bet／全下的「範圍」與無限注幾乎相同，差別在下注上限為底池、深碼多街打法不同。此處範圍沿用 NL 資料；短碼 pot 加注≈全下。實戰依尺寸限制調整。",
			"fl_disclaimer": "★限注（FL）沒有全下：單注封頂、翻前只加固定額，所以沒有 push/fold／對戰樹。這裡是 PokerTrace 自製的限注翻前參考範圍（規則生成、非 solver）★。限注偏緊、重牌力與高張、位置影響較小；依位置群組（早/中/晚/盲）給範圍。",
			"rfi_version": "reference-v1",
			"rfi_source": "教學參考（非 solver 自算）",
			"rfi_disclaimer": "★深碼 RFI 開牌為 PokerTrace 自製標準參考範圍，非 eval7／solver 精算★（深碼開牌由翻後可玩性決定，需完整翻前 solver 才能精算）。100bb 為手寫錨點，其餘計分牌檔以 100bb 為基準外插：變淺砍投機牌、補高張雜色；變深補同花踢腳與小對子。可自由使用，但請當作教學參考、依對手與情境調整。",
			"tbet_disclaimer": "★深碼 3bet／4bet／5bet 範圍為 PokerTrace 自製標準參考（含價值＋詐唬如 A5s/A4s），非 eval7／solver 精算★。依對位與對手調整。",
			"tree_title": "對戰樹",
			"tree_hint": "沿翻前順序選每位玩家的動作；一旦有人全下，後面就改成跟注 / 棄牌。矩陣顯示「目前行動者」的範圍。點上方座位可直接跳到該位（前面全部蓋牌）。",
			"tree_jumphint": "點此＝前面全部蓋牌、跳到此位",
			"tree_open": "{seat} 行動：全下 或 棄牌",
			"tree_facing": "{seat} 面對 {jammer} 的全下：跟注 或 棄牌",
			"tree_bbwin": "翻前蓋到大盲，BB 直接收下盲注（無需決策）。",
			"tree_jamwin": "{jammer} 全下後全部棄牌，收下底池。",
			"tree_showdown": "出現跟注 → 進入攤牌。可送到 Equity Solver 比較雙方勝率。",
			"tree_showdown_multi": "{n} 人全下進入攤牌（多人池）。第二位以後的跟注範圍已依人數粗略收緊（啟發式估計，非嚴謹多人精算）。",
			"tree_facing_callers": "（前面已 {n} 人跟注，範圍已依多人池粗略收緊；啟發式估計，非嚴謹多人精算）",
			"tree_facing_exact3": "（3 人全下池：overcall 範圍為 eval7 對戰兩家範圍實算）",
			"tree_toact": "行動中",
			"tree_pending": "待行動",
			"tree_hero": "你",
			"tree_linestart": "（尚未行動）",
			"tree_gotoequity": "開 Equity Solver",
			"tree_back": "上一步",
			"tree_reset": "重設",
			"act_jam": "全下",
			"act_call": "跟注",
			"act_fold": "棄牌",
			"deep_bbwin": "沒有人加注，大盲直接收走盲注",
			"deep_allfold": "大家都棄牌",
			"deep_openerwins": "{pos} 加注後無人跟，直接贏得底池",
			"deep_threebettorwins": "{pos} 再加注後無人跟，直接贏得底池",
			"deep_flop": "翻牌前行動結束，{n} 人看翻牌",
			"deep_allin": "全下，直接比大小",
			"deep_limpflop": "{n} 人跟注入池，直接進翻牌",
			"deep_isoraise": "{pos} 加注；跟注者需個別回應（跟／棄／再加注），本工具此線僅顯示加注範圍",
			"deep_bbfacelimp": "大盲面對 {n} 個跟注：過牌 或 加注",
			"deep_open": "輪到 {pos} 行動（加注／跟注／棄牌）",
			"deep_facing": "輪到 {pos}，面對 {opener} 的加注",
			"deep_opener3bet": "{opener} 面對 {threebettor} 的加注",
			"deep_3bettorfacing4bet": "{threebettor} 面對 {opener} 的加注",
			"deep_gotoflop": "前往翻牌 wizard",
			"deepact_fold": "棄牌",
			"deepact_call": "跟注",
			"deepact_check": "過牌",
			"deepact_raise": "加注",
			"deepact_allin": "全下",
			"action_jam": "全下 Jam",
			"action_raise": "加注 Raise",
			"action_limp": "跟注 Call",
			"action_call": "跟注 Call",
			"action_check": "過牌 Check",
			"action_mix": "混合 Mix",
			"action_fold": "棄牌 Fold",
			"metasource": "PokerTrace 自製｜eval7 自算（含混合頻率）",
			"fs_title": "翻後 GTO 求解器",
			"fs_subtitle": "自製 CFR 即時求解翻牌局面（eval7，免費）",
			"fs_boardlabel": "翻牌",
			"fs_potlabel": "底池",
			"fs_stacklabel": "有效後手計分牌",
			"fs_ooplabel": "OOP 範圍（先行動）",
			"fs_iplabel": "IP 範圍（後行動）",
			"fs_betlabel": "下注尺寸",
			"fs_random": "隨機翻牌",
			"fs_solve": "求解",
			"fs_solving": "求解中…",
			"fs_allowraise": "允許加注",
			"fs_hint": "輸入翻牌、雙方範圍與下注尺寸後按「求解」。後端用 CFR 迭代到均衡（約 2 秒）。",
			"fs_suitednote": "右上同花、左下不同花、對角對子。格子顏色＝該手在此節點的動作頻率；灰色＝不在範圍。",
			"fs_disclaimer": "本工具為自製 CFR 求解器（flop 子局面、turn/river 以精確 showdown equity 結算），非完整多街 solver；屬真算策略參考，實戰需自行判斷。",
			"fs_detailhint": "點上方矩陣任一格，看該手牌各動作的 EV 與偏離 EV。",
			"fs_detailnotinrange": "不在此節點範圍。",
			"fs_detailnote": "GTO 會混合到各動作 EV 相等（無差異）。「偏離」＝固定只打該動作會比 GTO 少賺多少。",
			"fs_theoev": "理論 EV（GTO 混合）",
			"fs_colaction": "動作",
			"fs_colfreq": "頻率",
			"fs_colloss": "偏離 EV",
			"fs_errboard": "請選 3 張不重複的翻牌",
			"fs_errrange": "請填寫雙方範圍",
			"fs_errfail": "求解失敗，請確認後端與輸入",
			"fs_fslibtitle": "本地批次結果（gtoworker.py 算好的）",
			"fs_fslibopenerlabel": "開池方位置",
			"fs_fslibscenariolabel": "對位",
			"fs_fslibhint": "選位置對位、點翻牌選牌，選好會自動載入已經算好的策略，不用重新求解。",
			"fs_fslibempty": "目前沒有離線批次結果，請先在本地執行 gtoworker.py。",
			"fs_fslibfail": "讀取失敗",
			"fs_fslibnotready": "這組位置對位還沒算到這張翻牌，稍後 gtoworker.py 跑完再回來看。",
			"fs_thirdlabel": "背景玩家範圍（多人池，選填，最多 7 家）",
			"fs_thirdplaceholder": "留空＝雙人求解；每填一格＝多一個背景玩家（固定範圍、一般下注會跟、一被加注就當作蓋牌，非嚴謹多人均衡）",
			"fs_bgadd": "＋ 加一家",
			"fs_bgcount": "共 {n} 家（OOP＋IP＋{k} 個背景玩家）",
			"fs_multiwaynote": "簡化多人模型：背景玩家固定範圍、一般下注會跟、但一被加注就視為蓋牌；非嚴謹多人 Nash 均衡，僅供參考。",
			"fs_street_flop": "翻牌",
			"fs_street_turn": "轉牌",
			"fs_street_river": "河牌",
			"fs_deal_turn": "抽轉牌",
			"fs_deal_river": "抽河牌",
			"fs_term_fold": "這步棄牌，對手直接贏得底池，行動結束。",
			"fs_term_call": "這步跟注，雙方直接攤牌比大小，行動結束。",
			"fs_term_check": "雙方都過牌，直接攤牌比大小，行動結束。",
			"fs_term_end": "行動結束。",
			"fs_wizard_start": "從翻牌後 OOP 先行動開始",
			"fs_wizard_back": "上一步",
			"fs_wizard_reset": "重設",
			"fs_nl_check": "過牌",
			"fs_nl_raise": "加注",
			"fs_nl_allin": "全下",
			"fs_nl_bet": "下注",
			"fs_betprefix": "下注 ",
			"fs_kind_srp": "單加注池",
			"fs_kind_3bet": "3bet 池",
			"fs_close": "關閉",
			"fs_cancel": "取消",
			"fs_confirm": "確定",
			"fs_action_check": "過牌",
			"fs_action_bet": "下注",
			"fs_action_fold": "棄牌",
			"fs_action_call": "跟注",
			"fs_action_raise": "加注",
			"fs_nodetab_oop_root": "OOP 開蓋"
		},
		"chipsetuppage": {
			"title": "起始計分牌配置",
			"back": "回上一頁",
			"stack": "起始計分牌量",
			"auto": "自動配置",
			"denomtitle": "面額與顆數",
			"denom": "面額",
			"count": "每人顆數",
			"sub": "小計",
			"remove": "刪除",
			"total": "每人總額",
			"chips": "每人總顆數",
			"diff": "與目標差額",
			"minrow": "至少需要 1 種面額",
			"note": "「自動配置」會先保留足夠的小面額計分牌（方便前幾級下注與找零），剩餘額度再用大面額補足。可手動調整顆數，總額需等於起始計分牌量。"
		},
		"durationpage": {
			"title": "賽事時長估算",
			"back": "回上一頁",
			"inputtitle": "場次與結構",
			"entries": "報名人數",
			"stack": "起始計分牌",
			"factor": "Rebuy/Addon 倍數",
			"startbb": "起始大盲",
			"mult": "升盲倍數",
			"levelmin": "每級分鐘",
			"breakevery": "每幾級休息",
			"breakmin": "休息分鐘",
			"target": "打到",
			"champion": "冠軍",
			"ft": "決賽桌（9 人）",
			"finishbb": "結束平均碼量 (BB)",
			"totalchips": "總計分牌量",
			"levels": "預估級數",
			"endbb": "結束盲注",
			"total": "預估總時長",
			"hour": "小時",
			"min": "分",
			"note": "估算模型：總計分牌 ÷ 結束時人數 ÷ 結束平均碼量 = 結束時大盲，反推需要幾級。為粗估，實際受 late reg、打法、單挑長度影響。"
		},
		"avgstackpage": {
			"title": "平均計分牌",
			"back": "回上一頁",
			"total": "總計分牌量",
			"players": "剩餘人數",
			"bb": "目前大盲（選填）",
			"avg": "平均計分牌",
			"avgbb": "平均 BB",
			"note": "平均計分牌 = 總計分牌量 ÷ 剩餘人數；平均 BB = 平均計分牌 ÷ 目前大盲。可快速判斷全場深淺。"
		},
		"chipracepage": {
			"title": "Chip Race",
			"back": "回上一頁",
			"small": "移除面額",
			"count": "桌上該面額總顆數",
			"newdenom": "換發面額",
			"value": "移除總值",
			"newchips": "換出新計分牌",
			"remain": "餘值（高牌 race）",
			"note": "移除總值 = 移除面額 × 顆數。這裡算的是全桌總量：可整除部分換成新面額計分牌，剩下不足一顆新計分牌的是全桌餘值。實際 chip race 是各家先自行換到最大整數，再用各自剩下的零頭發牌比高牌決定進位計分牌，因此各家零頭加總通常會大於這裡的全桌餘值。"
		},
		"structuregenpage": {
			"title": "結構產生器",
			"back": "回上一頁",
			"chipslabel": "桌上使用的計分牌面額",
			"addchip": "新增面額",
			"selectall": "全選",
			"deselectall": "取消全選",
			"chipplaceholder": "自訂面額",
			"chipshint": "點擊切換哪些面額在桌上。最小的可用面額用來判斷何時需要換籌（chip race）。",
			"genlabel": "結構產生器",
			"startsb": "起始小盲",
			"mult": "升盲倍數",
			"leveldur": "每級分鐘",
			"levels": "級數",
			"breakevery": "每幾級休息（0=不插）",
			"breakdur": "休息分鐘",
			"ante": "BB ante",
			"genhint": "依起始小盲逐級乘上倍數產生盲注，數值會自動取整成漂亮的計分牌，並對齊最小可用面額。產生後可在下方逐項手動編輯。",
			"fromprofile": "從個人資料載入面額",
			"structlabel": "結構（可編輯）",
			"addlevel": "+ 級",
			"addbreak": "+ 休息",
			"regen": "重新產生",
			"copyjson": "複製 JSON",
			"exportjson": "匯出 JSON",
			"importjson": "匯入 JSON",
			"edithint": "每一級的盲注與分鐘都可直接修改（FT 各級分鐘可不同）。勾「截買」表示報名在該級之後截止，之後的級數會標為「截買後」。修改生成器參數或計分牌會重新產生並覆蓋手動編輯。",
			"sumlevels": "級數",
			"sumtime": "總時長",
			"sumbreaks": "休息次數",
			"sumraces": "換籌次數",
			"thlevel": "級",
			"thsb": "小盲",
			"thbb": "大盲",
			"thante": "Ante",
			"thdur": "分鐘",
			"threg": "截買",
			"thaction": "操作",
			"thnote": "備註",
			"breaklabel": "休息",
			"breakraced": "休息（可移除 {d}）",
			"breakrow": "休息 {m} 分鐘",
			"racetag": "可移除 {d}",
			"switchtype": "切換類型（休息／級）",
			"regbefore": "截買前",
			"regafter": "截買後",
			"noraise": "不換籌",
			"unithr": "小時",
			"unitmin": "分",
			"invalid": "請輸入正確的起始小盲、級數、時長與倍數",
			"leveltruncated": "級數上限 {n} 級，已自動截斷",
			"badchip": "請輸入正確的面額",
			"atleastone": "至少要保留一個項目",
			"needsignin": "請先登入才能讀取個人資料計分牌",
			"profilefail": "讀取個人資料失敗",
			"noprofilechips": "個人資料沒有設定計分牌面額",
			"profileloaded": "已從個人資料載入 {n} 種面額",
			"copied": "已複製 JSON",
			"copymanual": "已顯示 JSON，請手動複製",
			"exported": "已匯出並下載 JSON",
			"imported": "已匯入 {n} 個項目",
			"importfail": "JSON 格式錯誤，無法匯入",
			"importempty": "JSON 沒有可用的結構項目",
			"pickchipset": "選擇要載入的計分牌組合",
			"pickchipsethint": "個人資料有多組計分牌，請選擇要套用的類別。",
			"pickcancel": "取消",
			"chipsetunnamed": "未命名組合",
			"chipsetdenomcount": "{n} 種面額",
			"parsetitle": "貼上解析",
			"parsehint": "把從別的網站複製下來的賽程文字貼上後按「解析」，結果會自動填進下方結構表，確認無誤再使用。",
			"parseplaceholder": "在這裡貼上比賽的結構文字…",
			"parsebtn": "解析",
			"parseempty": "請先貼上要解析的文字",
			"parsing": "解析中…",
			"parsingimage": "AI 讀取圖片中…",
			"parseimagebtn": "從圖片解析（AI）",
			"aidisabled": "後端尚未設定 AI 金鑰，無法使用 AI 解析",
			"parsefail": "解析不出結構，請確認貼上的內容包含級別表格",
			"parsesuccessprefix": "已解析出 ",
			"parsesuccesssuffix": " 個項目，請於下方確認",
			"showaiprompt": "解析不出來？用外部 AI 手動解析",
			"aiprompthint": "如果內建解析吃不下你的結構，請複製下方提示詞，貼到任一個 AI（ChatGPT / Gemini / Claude）讓它轉成 JSON，再把得到的 JSON 貼進下方「匯入 JSON」框並按匯入。",
			"copyaiprompt": "複製提示詞",
			"aipromptcopied": "提示詞已複製，貼到 AI 後把回傳的 JSON 匯入即可",
			"aipromptstructlabel": "要轉換的結構：",
			"aipromptplaceholder": "<在這裡貼上你的結構文字>",
			"networkfail": "網路不佳，請重新嘗試",
			"signinagain": "請重新登入"
		},
		"coloruppage": {
			"title": "計分牌換色",
			"back": "回上一頁",
			"amount": "要換的金額",
			"denomlabel": "可用面額（逗號分隔）",
			"denomtitle": "換色明細（大到小）",
			"pieces": "顆",
			"chips": "總計分牌數",
			"covered": "可換金額",
			"remain": "無法整除餘額",
			"note": "由大面額往小面額貪婪換色，列出每種面額所需顆數。最後若有不足最小面額的餘額，需另以 chip race 處理。"
		},
		"buyinsplitpage": {
			"title": "報名費拆分",
			"back": "回上一頁",
			"total": "報名總額",
			"fee": "手續費",
			"bounty": "Bounty",
			"entries": "報名人數",
			"prize": "每人進獎池",
			"pct": "獎池占比",
			"pool": "總獎池",
			"host": "主辦手續費收入",
			"warn": "手續費 + Bounty 已超過報名總額，進獎池為負。",
			"note": "每人進獎池 = 報名總額 − 手續費 − Bounty。總獎池 = 每人進獎池 × 報名人數（bounty 池另計）。"
		},
		"lateregpage": {
			"title": "Late Reg 截止",
			"back": "回上一頁",
			"start": "開賽時間",
			"levelmin": "每級分鐘",
			"clevel": "截止級數",
			"breakevery": "每幾級休息",
			"breakmin": "休息分鐘",
			"close": "Late Reg 截止時刻",
			"elapsed": "累計歷時",
			"breaks": "期間休息次數",
			"hour": "小時",
			"min": "分",
			"note": "截止時刻 = 開賽時間 + 截止級數所有級時長 + 期間休息時間。報名通常在指定級數結束時截止。"
		},
		"breakschedpage": {
			"title": "Break 排程",
			"back": "回上一頁",
			"start": "開賽時間",
			"levelmin": "每級分鐘",
			"total": "總級數",
			"every": "每幾級休息",
			"dur": "休息分鐘",
			"hno": "休息",
			"hafter": "在第幾級後",
			"htime": "時刻",
			"after": "後",
			"none": "依設定無休息",
			"note": "列出每次休息開始的時刻（已累計先前休息時間）。addon 截止通常設在某次休息，可對照此表安排。"
		},
		"seatdrawpage": {
			"title": "座位抽籤",
			"back": "回上一頁",
			"players": "選手數",
			"seats": "每桌座位數",
			"draw": "重新抽籤",
			"summary": "桌數",
			"table": "桌",
			"seat": "座位",
			"tablesunit": "桌",
			"playersunit": "人",
			"note": "以輪流方式平均分配，各桌人數差距不超過 1 人。每次按「重新抽籤」會產生新的隨機座位。"
		},
		"playerstatspage": {
			"title": "選手成績",
			"back": "回上一頁",
			"sessions": "總場次",
			"itm": "進錢次數",
			"buyin": "總買入",
			"win": "總獎金",
			"profit": "總淨利",
			"roi": "ROI",
			"itmrate": "ITM 率",
			"avg": "平均每場損益",
			"note": "ROI = 總淨利 ÷ 總買入；ITM 率 = 進錢次數 ÷ 總場次。淨利為正代表長期獲利。"
		},
		"mincashpage": {
			"title": "Min Cash 倍率",
			"back": "回上一頁",
			"buyin": "買入",
			"pay": "Min Cash 獎金",
			"mult": "Min Cash 倍率",
			"breakeven": "損益兩平 ITM 率",
			"net": "min cash 淨利",
			"note": "倍率 = Min Cash 獎金 ÷ 買入。損益兩平 ITM 率 = 買入 ÷ Min Cash 獎金，代表「每次都只拿 min cash」時需要的最低進錢率才不虧。"
		},
		"bountypage": {
			"title": "Bounty 價值",
			"back": "回上一頁",
			"head": "每顆賞金",
			"mode": "賞金模式",
			"modenormal": "一般 Bounty（全額入袋）",
			"modepko": "PKO（一半入袋、一半進頭上）",
			"kos": "擊倒數",
			"per": "每次擊倒入袋",
			"cash": "累計入袋現金",
			"headgrow": "你頭上賞金成長",
			"note": "PKO 模式：每次擊倒對手，其賞金一半立刻入袋、一半加到你自己頭上（讓你成為更值錢的擊倒目標）。一般模式：賞金全額入袋。"
		},
		"sprpage": {
			"title": "SPR 計算器",
			"back": "回上一頁",
			"stack": "有效計分牌",
			"pot": "底池",
			"value": "SPR",
			"zone": "承諾度",
			"zonelow": "低 SPR · 易承諾",
			"zonemid": "中 SPR",
			"zonehigh": "高 SPR · 需謹慎",
			"guidelow": "SPR < 3：頂對或超對通常足以全下，翻牌中強牌即可把計分牌投入。",
			"guidemid": "SPR 4–6：需要強成牌或強聽牌才承諾，避免只用頂對打超大底池。",
			"guidehigh": "SPR > 6：頂對頂踢腳也可能不夠，傾向控制底池、用堅果級牌力才打大。",
			"guidenone": "請輸入底池與有效計分牌。",
			"note": "SPR = 有效計分牌 ÷ 底池。SPR 越低越容易為一手好牌全下；越高越需要謹慎，頂對頂踢腳也可能不夠。"
		},
		"evenchoppage": {
			"title": "Even Chop",
			"back": "回上一頁",
			"prize": "剩餘總獎金",
			"players": "剩餘人數",
			"reserve": "保留給冠軍（選填）",
			"each": "每人均分",
			"winner": "冠軍合計",
			"note": "純 even chop 不看計分牌，剩餘獎金平均分配。若有「保留給冠軍」，先扣起該金額平分其餘，冠軍再額外拿到保留額。"
		},
		"tablefeepage": {
			"title": "桌費／時租試算",
			"back": "回上一頁",
			"tables": "桌數",
			"rate": "每桌每小時",
			"hours": "時數",
			"people": "分攤人數",
			"total": "總成本",
			"pertable": "每桌成本",
			"perhead": "每人分攤",
			"note": "總成本 = 桌數 × 每桌每小時 × 時數。每人分攤 = 總成本 ÷ 分攤人數，可用於估算現金桌時租或場地分攤。"
		},
		"staffpaypage": {
			"title": "工作人員薪資",
			"back": "回上一頁",
			"hourly": "時薪",
			"hours": "時數",
			"bonus": "場次獎金",
			"transport": "交通補貼",
			"count": "人數",
			"per": "每人應付",
			"base": "其中時薪部分",
			"total": "全體合計",
			"note": "每人應付 = 時薪 × 時數 + 場次獎金 + 交通補貼。全體合計 = 每人應付 × 人數（假設條件相同，可逐人重算）。"
		},
		"bluffpage": {
			"title": "Bluff 平衡頻率",
			"back": "回上一頁",
			"pot": "底池",
			"bet": "下注額",
			"value": "價值組合數（選填）",
			"size": "下注佔底池",
			"frac": "詐唬佔下注比例",
			"ratio": "價值 : 詐唬",
			"combo": "建議詐唬組合",
			"note": "平衡時，詐唬佔下注範圍比例 = 下注額 ÷（底池 + 2 × 下注額）。價值:詐唬比 =（底池 + 下注額）:下注額。建議詐唬組合 = 價值組合 × 下注額 ÷（底池 + 下注額）。"
		},
		"matchuppage": {
			"title": "全下對戰勝率表",
			"back": "回上一頁",
			"hcase": "對戰類型",
			"hexample": "範例",
			"hequity": "勝率",
			"note": "為翻牌前全下的近似勝率（百搭情況略有差異）。同花會比不同花高約 2–4%。實際數字可用「勝率解算器」精算。"
		},
		"glossarypage": {
			"title": "中英術語對照",
			"back": "回上一頁",
			"search": "搜尋中文 / English / 關鍵字",
			"terms": "個術語",
			"noresult": "找不到符合的術語"
		},
		"rulespage": {
			"title": "規則速查",
			"back": "回上一頁",
			"search": "搜尋規則關鍵字",
			"noresult": "找不到符合的規則",
			"note": "為常見賽事規則重點整理，僅供現場快速參考；正式判決以該場規則與 floor 裁定為準。"
		},
			"tdarulespage": {
				"title": "TDA規則手冊",
				"back": "回上一頁",
				"opennewtab": "在新分頁開啟",
				"zhtw": "中文",
				"en": "English",
				"note": "本手冊為 2024 Poker TDA（Tournament Directors Association）規則；中文為翻譯版，正式判決以英文原文與現場 floor 裁定為準。"
			},
"handrankingpage": {
			"title": "牌型排名",
			"back": "回上一頁",
			"note": "由大到小排列。同牌型時比較關鍵牌（kicker）。"
		},
		"positionspage": {
			"title": "位置參考",
			"back": "回上一頁",
			"note": "以 9 人桌為例，由前位到後位排列。越後位資訊越多、可玩範圍越寬。"
		},
		"drawoutspage": {
			"title": "聽牌補牌表",
			"back": "回上一頁",
			"hdraw": "聽牌",
			"houts": "Outs",
			"hturn": "轉牌",
			"hriver": "轉+河",
			"note": "轉牌 = 看一張的成牌機率（≈ outs ×2）；轉+河 = 翻牌後看兩張（≈ outs ×4）。為近似值。"
		},
		"regprogresspage": {
			"title": "報名 / 獎池進度",
			"back": "回上一頁",
			"current": "目前報名",
			"target": "目標人數",
			"per": "每人進獎池",
			"guarantee": "保底獎池",
			"bar": "報名進度",
			"pool": "目前獎池",
			"gap": "距保底差額",
			"need": "還需報名",
			"note": "目前獎池 = 目前報名 × 每人進獎池。距保底差額為正代表尚未達標（可能 overlay），需再 N 人報名才能補足。"
		},
		"depthstrategypage": {
			"title": "計分牌深度策略",
			"back": "回上一頁",
			"stack": "計分牌",
			"bb": "目前大盲",
			"bbcount": "大盲數",
			"zonelabel": "所在區間",
			"zonedeep": "深籌（>100 BB）",
			"zonenormal": "標準（40–100 BB）",
			"zonemid": "中短（25–40 BB）",
			"zoneshort": "短碼（15–25 BB）",
			"zonepush": "全下區（<15 BB）",
			"advicedeep": "可玩投機牌、深籌博弈；重視翻牌後操作與隱含賠率，避免無謂打爆。",
			"advicenormal": "標準錦標賽深度，開池加注與 3-bet 平衡，後位放寬。",
			"advicemid": "縮小投機牌，重視位置；面對加注以 3-bet 或棄牌為主，少跟注。",
			"adviceshort": "進入 push/fold 與淺籌博弈；多以加注全下施壓，慎選跟注全下。",
			"advicepush": "以 open-shove / 棄牌為主，依位置與 BB 數查 push/fold 範圍。",
			"advicenone": "請輸入大盲。",
			"note": "以大盲數判斷打法區間：>100 深籌、40–100 標準、25–40 中短、15–25 短碼、<15 全下/棄牌為主。"
		},
		"preflopoddspage": {
			"title": "起手牌機率",
			"back": "回上一頁",
			"note": "常見翻牌前 / 翻牌成牌機率參考值（近似）。"
		},
		"oddsconvpage": {
			"title": "賠率換算",
			"back": "回上一頁",
			"sec1": "由勝率 → 賠率",
			"pct": "勝率 (%)",
			"against": "對賠（against）",
			"decimal": "歐式賠率",
			"sec2": "由賠率 → 勝率",
			"oddsa": "賠率 A（贏）",
			"oddsb": "賠率 B（賭注）",
			"implied": "隱含勝率",
			"note": "對賠 = (1 − 勝率) ÷ 勝率，寫成「X : 1」。隱含勝率 = B ÷ (A + B)。"
		},
		"chipcolorpage": {
			"title": "計分牌顏色對照",
			"back": "回上一頁",
			"note": "為常見賭場現金桌計分牌配色，僅供參考；各場館與錦標賽用色可能不同，以現場公告為準。"
		},
		"handsestpage": {
			"title": "每小時手數估算",
			"back": "回上一頁",
			"sec": "每手平均秒數",
			"level": "每級分鐘",
			"hour": "每小時手數",
			"levelhands": "每級手數",
			"note": "每小時手數 = 3600 ÷ 每手秒數。實體桌常見約 25–30 手/小時（每手約 120–140 秒），人少或發牌快會更多。"
		},
		"effstackpage": {
			"title": "有效計分牌",
			"back": "回上一頁",
			"you": "你的計分牌",
			"opp": "對手計分牌",
			"bb": "大盲（選填）",
			"eff": "有效計分牌",
			"bbcount": "有效大盲數",
			"note": "有效計分牌 = 雙方計分牌較小者，即這手牌最多能贏或輸的量。多人底池時取你與各對手的較小值分別計算。"
		},
		"bankrollpage": {
			"title": "Bankroll 建議",
			"back": "回上一頁",
			"type": "遊戲類型",
			"buyin": "平均買入",
			"cons": "保守（買入數）",
			"std": "標準",
			"agg": "積極",
			"opt_mtt": "MTT 錦標賽",
			"opt_pko": "PKO 賞金賽",
			"opt_sng": "SNG / 單桌",
			"opt_cash": "現金桌",
			"note": "不同賽制變異不同，建議 bankroll 以買入數計：保守 / 標準 / 積極。MTT 變異最大需最多買入。為一般參考，非投資建議。"
		},
		"tipsharepage": {
			"title": "小費分配",
			"back": "回上一頁",
			"total": "總小費",
			"dealers": "發牌員人數",
			"floor": "Floor 抽成 (%)",
			"floorcut": "Floor 分得",
			"pool": "發牌員池",
			"each": "每位發牌員",
			"note": "Floor 分得 = 總小費 × 抽成%。其餘平均分給發牌員。可依實際分配規則調整抽成。"
		},
		"levelclockpage": {
			"title": "級數時刻表",
			"back": "回上一頁",
			"start": "開賽時間",
			"levelmin": "每級分鐘",
			"total": "總級數",
			"every": "每幾級休息",
			"breakmin": "休息分鐘",
			"hitem": "項目",
			"hstart": "開始時刻",
			"hend": "結束時刻",
			"breaklabel": "休息",
			"note": "列出每一級與休息的開始／結束時刻（已累計休息時間）。可印出貼在賽務台。"
		},
		"chipcountpage": {
			"title": "點碼計算",
			"back": "回上一頁",
			"denom": "面額",
			"count": "顆數",
			"sub": "小計",
			"total": "總額",
			"chips": "總顆數",
			"note": "輸入各面額顆數即時加總，適合清點單一選手計分牌或結算現場計分牌。面額可自行修改。"
		},
		"cbetpage": {
			"title": "C-bet 參考卡",
			"back": "回上一頁",
			"note": "翻牌持續下注（c-bet）建議頻率與尺寸隨牌面結構而變，為一般原則，實戰需配合對手與範圍調整。"
		},
		"blinddefensepage": {
			"title": "大盲防守參考",
			"back": "回上一頁",
			"hpos": "加注位置",
			"hdefend": "防守範圍",
			"hnote": "說明",
			"note": "大盲面對 2–2.5bb 開池、單跳的概略防守參考（含跟注與 3-bet）。位置越後、底池賠率越好，防守越寬。"
		},
		"checklistpage": {
			"title": "主辦 Checklist",
			"back": "回上一頁",
			"progress": "完成度",
			"reset": "重置",
			"note": "勾選後會保存在此裝置，適合主辦當天追蹤開賽前、進行中與收場後事項。"
		},
		"namegenpage": {
			"title": "賽事命名建議",
			"back": "回上一頁",
			"day": "時段",
			"tier": "買入級距",
			"format": "賽制",
			"flavor": "風格",
			"note": "依選項即時組合多組命名建議，純模板組合（非 AI）。可直接取用或當靈感修改。"
		},
		"winratepage": {
			"title": "現金桌時薪估算",
			"back": "回上一頁",
			"winrate": "勝率 (bb/100)",
			"bb": "大盲金額",
			"hands": "每小時手數",
			"hours": "時數",
			"per100": "每 100 手期望",
			"hourly": "期望時薪",
			"session": "本場期望",
			"note": "期望時薪 = (bb/100 ÷ 100) × 大盲金額 × 每小時手數。為長期期望值，短期受變異影響極大。"
		},
		"addonevpage": {
			"title": "Add-on 划算嗎",
			"back": "回上一頁",
			"buyin": "初始買入金額",
			"start": "初始計分牌",
			"fee": "Addon 費用",
			"chips": "Addon 計分牌",
			"basecost": "初始每計分牌成本",
			"addoncost": "Addon 每計分牌成本",
			"verdict": "建議",
			"good": "划算",
			"bad": "不划算",
			"equal": "相同",
			"note": "每計分牌成本越低代表 CP 值越高。Addon 每計分牌成本低於初始買入時，純就計分牌價值通常划算；實戰仍需考慮 ICM 與剩餘計分牌深度。"
		},
		"countdownpage": {
			"title": "倒數計時器",
			"back": "回上一頁",
			"target": "目標時刻",
			"remain": "剩餘時間",
			"counting": "倒數中",
			"passed": "已超過目標時刻",
			"note": "倒數至今天的目標時刻；若已過則顯示已超過的時間。可用於開賽、late reg 截止、休息結束等倒數。"
		},
		"staffingpage": {
			"title": "現場人力配置",
			"back": "回上一頁",
			"players": "選手數",
			"seats": "每桌座位",
			"relief": "輪替比例 (%)",
			"tables": "桌數",
			"dealers": "發牌員",
			"floor": "Floor",
			"assist": "助理",
			"note": "發牌員 = 桌數 ×（1 + 輪替比例）；Floor ≈ 每 8 桌 1 位（至少 1）；助理 ≈ 每 6 桌 1 位（至少 1）。為概略建議，依場館流程調整。"
		},
		"preflopsizepage": {
			"title": "翻牌前加注尺寸",
			"back": "回上一頁",
			"note": "翻牌前各情境的概略加注尺寸參考。線上常用較小、實體較大；有 ante 時整體略加大。為一般原則，依場況調整。"
		},
		"winprobpage": {
			"title": "計分牌奪冠機率",
			"back": "回上一頁",
			"stacks": "各家計分牌（逗號分隔）",
			"total": "總計分牌",
			"players": "人",
			"seat": "座位",
			"empty": "請輸入至少一筆計分牌",
			"note": "簡易模型：奪冠機率 ≈ 計分牌占比（chip-chop）。未考慮技術差距與名次獎金 ICM，僅供快速參考。"
		},
		"bbantepage": {
			"title": "BB Ante 換算",
			"back": "回上一頁",
			"bb": "大盲",
			"players": "人數",
			"ante": "傳統前注（每人）",
			"tradtotal": "傳統前注每手總額",
			"bbante": "BB ante 每手總額",
			"equiv": "等效每人前注",
			"note": "傳統前注每手總額 = 每人前注 × 人數。BB ante 由大盲位投入一個大盲，每手總額 = 大盲。等效每人前注 = 大盲 ÷ 人數，可用來對齊兩種結構的前注量。"
		},
		"bustratepage": {
			"title": "淘汰速率估算",
			"back": "回上一頁",
			"start": "起始人數",
			"current": "目前人數",
			"elapsed": "已歷時（分鐘）",
			"target": "目標剩餘人數",
			"rate": "淘汰速率",
			"eta": "預估還需",
			"total": "預估總時長",
			"perhour": "人/小時",
			"reached": "已達目標",
			"hour": "小時",
			"min": "分",
			"note": "淘汰速率 = (起始 − 目前) ÷ 已歷時。預估還需 = (目前 − 目標) ÷ 速率。實際後期淘汰會放慢，僅供概估。"
		},
		"roitargetpage": {
			"title": "ROI 目標反推",
			"back": "回上一頁",
			"buyin": "買入（含手續費）",
			"roi": "目標 ROI (%)",
			"games": "場次數",
			"avg": "平均每場需回收",
			"totalbuyin": "總投入",
			"totalcash": "總需回收",
			"note": "平均每場需回收 = 買入 ×（1 + 目標 ROI%）。即長期平均每場獎金需達到此數，才能達成目標 ROI。"
		},
		"tablebalancepage": {
			"title": "桌位平衡建議",
			"back": "回上一頁",
			"counts": "各桌人數（逗號分隔）",
			"summary": "總人數",
			"tablesunit": "桌",
			"table": "桌",
			"over": "偏多",
			"under": "偏少",
			"ok": "適中",
			"empty": "請輸入各桌人數",
			"balanced": "目前已平衡（各桌差距 ≤ 1）。",
			"targetprefix": "理想每桌 ",
			"targetsuffix": " 人",
			"moveprefix": "建議從多人桌搬出約 ",
			"movesuffix": " 人到少人桌",
			"note": "理想各桌人數差距不超過 1 人。標記人數偏多／偏少的桌，提示從多人桌搬至少人桌以平衡。"
		},
		"investtrackerpage": {
			"title": "選手投入追蹤",
			"back": "回上一頁",
			"buyin": "買入金額",
			"rebuycount": "Rebuy 次數",
			"rebuyamt": "Rebuy 金額",
			"addon": "Addon 金額",
			"fee": "手續費合計",
			"win": "獲得獎金",
			"total": "總投入",
			"profit": "本場淨利",
			"roi": "本場 ROI",
			"note": "總投入 = 買入 + rebuy 次數 × rebuy 金額 + addon + 手續費。本場淨利 = 獎金 − 總投入。可即時追蹤單場帳。"
		},
		"structurecheckpage": {
			"title": "結構快慢檢查",
			"back": "回上一頁",
			"mult": "升盲倍數",
			"levelmin": "每級分鐘",
			"levelshr": "每小時級數",
			"growth": "每小時盲注成長",
			"verdict": "評估",
			"slow": "偏慢（深籌）",
			"standard": "標準",
			"fast": "偏快（渦輪）",
			"note": "每小時盲注成長 = 升盲倍數 ^（每小時級數）。約 < 2× 偏慢（深籌）、2–4× 標準、> 4× 偏快（渦輪）。"
		},
		"breakevenpage": {
			"title": "主辦損益平衡",
			"back": "回上一頁",
			"cost": "固定成本",
			"fee": "每人手續費",
			"per": "每人進獎池",
			"guarantee": "保底獎池",
			"be": "損益平衡人數",
			"guar": "達保底人數",
			"overlay": "未達保底每差 1 人補貼",
			"people": "人",
			"never": "無法達成",
			"note": "未達保底時，主辦每多 1 人可減少 overlay（每人進獎池）。損益平衡人數同時考慮手續費收入與 overlay 補貼。"
		},
		"satellitepage": {
			"title": "衛星賽席位換算",
			"back": "回上一頁",
			"entries": "報名人數",
			"buyin": "每人進獎池",
			"seat": "每席價值（目標買入）",
			"pool": "總獎池",
			"seats": "席位數",
			"cash": "剩餘現金",
			"ratio": "每席報名數",
			"note": "席位數 = 總獎池 ÷ 每席價值（取整）。剩餘現金通常發給泡沫名次。每席報名數 = 報名人數 ÷ 席位數，越多代表越難晉級。"
		},
		"impliedoddspage": {
			"title": "隱含賠率",
			"back": "回上一頁",
			"pot": "目前底池",
			"call": "要跟的注",
			"future": "預估後續可贏",
			"eq": "你的勝率 (%)",
			"direct": "直接所需勝率",
			"implied": "含隱含所需勝率",
			"verdict": "建議",
			"callit": "該跟",
			"foldit": "該棄",
			"note": "直接所需勝率 = 跟注 ÷（底池 + 跟注）。含隱含 = 跟注 ÷（底池 + 跟注 + 後續可贏）。你的勝率達到含隱含門檻即可跟注。"
		},
		"stakingmarkuppage": {
			"title": "賣股 / Markup 試算",
			"back": "回上一頁",
			"buyin": "總買入",
			"sold": "賣出比例 (%)",
			"markup": "Markup 倍率",
			"paid": "買家支付",
			"cost": "你的實付成本",
			"keep": "你保留權益",
			"locked": "Markup 鎖定利潤",
			"note": "買家支付 = 買入 × 賣出% × markup。你的實付成本 = 買入 − 買家支付。買家可分得賣出%的獎金，你保留其餘。Markup 鎖定利潤 = 買入 × 賣出% ×（markup − 1）。"
		},
		"chipinventorypage": {
			"title": "全場計分牌需求",
			"back": "回上一頁",
			"entries": "報名人數",
			"denom": "面額",
			"per": "每人顆數",
			"total": "全場需求",
			"chips": "全場總顆數",
			"value": "全場總面值",
			"note": "全場需求 = 每人顆數 × 報名人數。用於估算需準備多少各面額計分牌（建議再多備一成因應 rebuy/換色）。"
		},
		"bountypoolpage": {
			"title": "賞金池估算",
			"back": "回上一頁",
			"entries": "報名 / 買入次數",
			"head": "每人賞金",
			"mode": "賞金模式",
			"modenormal": "一般 Bounty",
			"modepko": "PKO（半入袋半進頭上）",
			"total": "總賞金池",
			"start": "起始頭上賞金",
			"pocket": "每淘汰立即入袋",
			"note": "總賞金池 = 報名次數 × 每人賞金。PKO：起始頭上 = 每人賞金 ÷ 2，擊倒時一半入袋、一半加到自己頭上。一般：擊倒全額入袋。"
		},
		"blindcatchuppage": {
			"title": "盲注追上估算",
			"back": "回上一頁",
			"stack": "目前計分牌",
			"bb": "目前大盲",
			"mult": "升盲倍數",
			"levelmin": "每級分鐘",
			"threshold": "短碼門檻 (BB)",
			"now": "目前大盲數",
			"levelsto": "再過幾級進入短碼",
			"time": "約多久",
			"then": "屆時大盲數",
			"levels": "級",
			"already": "已在短碼",
			"hour": "小時",
			"min": "分",
			"note": "假設計分牌不變、僅盲注上升。每升一級大盲 ×倍數，計算還有幾級／多久後大盲數低於短碼門檻，提示何時進入 push/fold。"
		},
		"threebetrangepage": {
			"title": "3-bet / 4-bet 範圍卡",
			"back": "回上一頁",
			"note": "概略 3-bet / 4-bet 價值與詐唬範圍參考。價值牌求被跟，詐唬牌選有阻擋牌（如 A、K）的手。依對手與深度調整。"
		},
		"riverbetpage": {
			"title": "河牌下注參考",
			"back": "回上一頁",
			"note": "河牌已無後續街，價值與詐唬呈兩極化。下注越大，詐唬可帶越多但需更強價值支撐；薄價值多用小注。"
		},
		"dealersoppage": {
			"title": "發牌流程速查",
			"back": "回上一頁",
			"note": "常見發牌流程與錯誤處理重點，供新手發牌員參考；正式判定以該場規則與 floor 裁定為準。"
		},
		"bubblepressurepage": {
			"title": "泡沫壓力指數",
			"back": "回上一頁",
			"remain": "剩餘人數",
			"paid": "獎圈名次",
			"stack": "你的計分牌",
			"avg": "平均計分牌",
			"dist": "距離獎圈",
			"rel": "相對碼量",
			"level": "壓力等級",
			"people": "人",
			"inmoney": "已進獎圈",
			"lvnone": "已解除",
			"lvlow": "低",
			"lvmed": "中",
			"lvhigh": "高",
			"lvextreme": "極高",
			"advnone": "已進獎圈，可放開打、追求更高名次。",
			"advlow": "你是大碼，可施壓中短碼，逼他們為了保命棄牌。",
			"advmed": "標準泡沫期，挑對位置與對手施壓，避免無謂對抗大碼。",
			"advhigh": "接近泡沫且計分牌不深，跟注全下要更謹慎，優先保命進獎圈。",
			"advextreme": "泡沫邊緣且短碼，ICM 壓力極大；非極強牌避免被淘汰，等對手先出局。",
			"note": "越接近獎圈、計分牌越短，ICM 壓力越大（保命優先）；大碼則可施壓中短碼。為概略提示，非精算 ICM。"
		},
		"cashreconcilepage": {
			"title": "現場收款對帳",
			"back": "回上一頁",
			"entries": "報名數",
			"entryfee": "報名費",
			"rebuycount": "Rebuy 數",
			"rebuyamt": "Rebuy 額",
			"addoncount": "Addon 數",
			"addonamt": "Addon 額",
			"refund": "退費總額",
			"actual": "實收現金",
			"due": "應收總額",
			"got": "實收",
			"diff": "差額",
			"note": "應收 = 報名×報名費 + rebuy×額 + addon×額 − 退費。差額 = 實收 − 應收：正為溢收、負為短收，0 表示對平。"
		},
		"refundpage": {
			"title": "退賽退費試算",
			"back": "回上一頁",
			"paid": "已付金額",
			"fee": "其中手續費",
			"policy": "退費政策",
			"opt_full": "全額退",
			"opt_fee": "扣手續費後退",
			"opt_none": "不退",
			"opt_half": "退一半",
			"refund": "可退金額",
			"keep": "主辦保留",
			"note": "依退費政策計算：全額退＝全退；扣手續費＝退（已付 − 手續費）；不退＝0；退一半＝已付 ÷ 2。實際以該場規則為準。"
		},
		"regpacepage": {
			"title": "報名進度配速",
			"back": "回上一頁",
			"current": "目前報名",
			"target": "目標報名",
			"open": "已開放分鐘",
			"left": "剩餘分鐘",
			"pace": "目前配速",
			"need": "達標所需配速",
			"proj": "線性預估最終",
			"perhour": "人/小時",
			"people": "人",
			"reached": "已達標",
			"note": "目前配速 = 目前報名 ÷ 已開放時間。達標所需配速 = 還需人數 ÷ 剩餘時間。線性預估 = 目前 + 目前配速 × 剩餘時間。"
		},
		"waitlistpage": {
			"title": "候補等待估算",
			"back": "回上一頁",
			"list": "候補總人數",
			"pos": "你的序位",
			"rate": "每小時空出座位",
			"you": "你預估等待",
			"all": "全部消化時間",
			"never": "無法估算",
			"hour": "小時",
			"min": "分",
			"note": "你預估等待 = 你的序位 ÷ 每小時空位率。全部消化 = 候補總人數 ÷ 空位率。空位率受場況波動，僅供概估。"
		},
		"kpipage": {
			"title": "賽事 KPI 摘要",
			"back": "回上一頁",
			"entries": "報名人數",
			"revenue": "總收入",
			"pool": "總獎池",
			"cost": "主辦成本",
			"per": "人均收入",
			"rake": "抽水率",
			"share": "獎池佔比",
			"profit": "主辦淨利",
			"margin": "淨利率",
			"note": "抽水率 =（總收入 − 總獎池）÷ 總收入。主辦淨利 = 總收入 − 總獎池 − 成本（假設獎池由收入支出）。淨利率 = 淨利 ÷ 總收入。"
		},
		"potbuilderpage": {
			"title": "底池成長試算",
			"back": "回上一頁",
			"start": "翻牌前底池",
			"flop": "翻牌下注 (% 底池)",
			"turn": "轉牌下注 (% 底池)",
			"river": "河牌下注 (% 底池)",
			"pflop": "翻牌後底池",
			"pturn": "轉牌後底池",
			"priver": "河牌後底池",
			"growth": "總成長倍數",
			"note": "假設每街單一下注且對手跟注：下注額 = 當前底池 × 比例，底池增加 2 倍下注額（雙方投入）。可快速估算各街底池與最終底池。"
		},
		"chipauditpage": {
			"title": "計分牌總量稽核",
			"back": "回上一頁",
			"entries": "報名人數",
			"start": "起始計分牌",
			"rebuycount": "Rebuy 數",
			"rebuychip": "Rebuy 計分牌",
			"addoncount": "Addon 數",
			"addonchip": "Addon 計分牌",
			"actual": "實際清點",
			"expected": "應有總計分牌",
			"counted": "實際清點",
			"diff": "差異",
			"note": "應有總計分牌 = 報名×起始 + rebuy 數×rebuy 計分牌 + addon 數×addon 計分牌。差異 = 實際 − 應有，非 0 表示有多發/短發或清點誤差。"
		},
		"partnersplitpage": {
			"title": "收益夥伴分配",
			"back": "回上一頁",
			"total": "總金額",
			"shares": "分配比例 (% 逗號分隔)",
			"sum": "比例總和",
			"partner": "夥伴",
			"empty": "請輸入分配比例",
			"negative": "分配比例不可為負數，請輸入 0 或正數。",
			"note": "依輸入比例分配總金額給各夥伴。比例總和應為 100%；不為 100% 時仍按比例正規化分配並提示。"
		},
		"payouttablepage": {
			"title": "獎金分配表",
			"back": "回上一頁",
			"pool": "總獎池",
			"places": "名次數",
			"steep": "集中度",
			"round": "現金取整",
			"hrank": "名次",
			"hcash": "獎金",
			"hpct": "佔比",
			"note": "依集中度（幾何衰減）自動鋪一條前重後輕的獎金曲線，補尾差到冠軍使總和等於總獎池。集中度越小越集中於前段。",
			"cutoff": "（此集中度與取整下僅能發到第 {n} 名。）"
		},
		"icmpage": {
			"title": "ICM / 拆彩金",
			"back": "回上一頁",
			"stacks": "各家計分牌",
			"payouts": "獎金結構",
			"result": "期望值",
			"player": "選手",
			"rank": "名次",
			"remove": "刪除",
			"minstack": "至少需要 2 位選手",
			"minpayout": "至少需要 1 個名次",
			"icmev": "ICM 期望值",
			"chipchop": "Chip-Chop",
			"note": "ICM 以 Malmuth–Harville 模型計算；Chip-Chop 為依計分牌比例分配總獎金。"
		},
		"stackcalcpage": {
			"title": "計分牌量換算",
			"back": "回上一頁",
			"stack": "計分牌",
			"sb": "小盲",
			"bb": "大盲",
			"ante": "Ante",
			"players": "人數",
			"bbcount": "大盲數 (BB)",
			"m": "M 值",
			"effm": "Effective M",
			"ante_bba": "大盲BBA",
				"ante_each": "每人",
				"ante_none": "無 ante",
				"deductorbit": "扣掉本次大小盲",
				"note": "大盲BBA＝全桌只有一份 ante（現代錦標賽標準）：M = 計分牌 ÷ (小盲 + 大盲 + Ante)。每人 ante：M = 計分牌 ÷ (小盲 + 大盲 + Ante × 人數)。無 ante：M = 計分牌 ÷ (小盲 + 大盲)。Effective M = M × (人數 ÷ 10)"
		},
		"contactpage": {
			"title": "聯絡我們",
			"heading": "聯絡我們",
			"desc": "有任何功能建議、錯誤回報、使用問題或合作想法，都可以從這裡送出。你的回饋會進入後台，由管理者查看與處理。",
			"reporttitle": "適合回報的內容",
			"reportdesc": "賽事流程建議、報名或座位操作問題、計時器需求、開源部署問題、畫面錯誤、翻譯問題、資料統計異常。",
			"name": "姓名",
			"subject": "主旨",
			"subjectplaceholder": "例如：報名清單建議",
			"message": "內容",
			"submit": "送出訊息",
			"submitting": "送出中...",
			"requiredwarning": "請填寫姓名、Email 與內容",
			"success": "已收到你的訊息，謝謝你的建議",
			"fail": "送出失敗",
			"namerequired": "請填寫姓名",
			"emailrequired": "請填寫 Email",
			"emailinvalid": "Email 格式不正確",
			"messagerequired": "請填寫內容"
		},
		"contactadminpage": {
			"title": "聯絡訊息後台",
			"heading": "聯絡訊息後台",
			"filterlabel": "篩選訊息狀態",
			"allstatus": "全部狀態",
			"new": "新訊息",
			"read": "已讀",
			"done": "已處理",
			"reload": "重新整理",
			"nosubject": "未填主旨",
			"linkeduser": "登入使用者：",
			"unlinkeduser": "未綁定登入使用者",
			"replied": "已回覆",
			"replyto": "回覆到",
			"replysubjectprefix": "Re: ",
			"replysubjectdefault": "Re: PokerTrace 聯絡我們",
			"replyplaceholder": "輸入要回覆給使用者的內容",
			"replysend": "寄出回覆",
			"replysending": "寄出中...",
			"empty": "目前沒有聯絡訊息",
			"prev": "上一頁",
			"next": "下一頁",
			"pageprefix": "第",
			"pageslash": "頁 / 共",
			"pagesuffix": "頁",
			"loadfail": "讀取失敗",
			"statussaved": "已更新狀態",
			"statussavefail": "更新失敗",
			"replyrequired": "請輸入回覆內容",
			"replysuccess": "已寄出回覆",
			"replyfail": "寄出失敗"
		},
		"notificationpage": {
			"eyebrow": "Notification",
			"title": "通知中心",
			"refresh": "重新整理",
			"readall": "全部已讀",
			"empty": "目前沒有通知",
			"markread": "標為已讀",
			"delete": "刪除",
			"unread": "未讀",
			"loadfail": "載入失敗",
			"deleteconfirm": "確定要刪除這則通知嗎？",
			"search": "搜尋",
			"searchplaceholder": "搜尋標題或內容"
		},
		"adminlogpage": {
			"title": "系統 API 紀錄",
			"heading": "系統 API 紀錄",
			"searchplaceholder": "搜尋使用者姓名/信箱/選手編號/API/方法/IP",
			"search": "搜尋",
			"erroronly": "只看非 200",
			"reload": "重新整理",
			"coltime": "時間",
			"coluser": "使用者",
			"colmethod": "方法",
			"colpath": "API",
			"colstatus": "狀態碼",
			"colip": "IP",
			"colagent": "裝置/瀏覽器",
			"detailtitle": "詳細訊息",
			"unknownuser": "未知使用者",
			"anonymous": "未登入",
			"empty": "目前沒有紀錄",
			"loadfail": "讀取失敗",
			"eyebrow": "API Access Log"
		},
		"adminuserpage": {
			"tablog": "紀錄",
			"tabuser": "使用者",
			"eyebrow": "User Management",
			"heading": "使用者管理",
			"searchplaceholder": "搜尋姓名/信箱/選手編號",
			"search": "搜尋",
			"reload": "重新整理",
			"colname": "姓名",
			"colplayerid": "P-編號",
			"colemail": "Email",
			"colpermission": "權限",
			"colstatus": "狀態",
			"colcreatetime": "建立時間",
			"colaction": "操作",
			"adminhint": "Lv4 以上為管理員",
			"statusactive": "正常",
			"statusblocked": "限時封鎖中",
			"statusbanned": "永久停權",
			"expirylabel": "到期",
			"reasonlabel": "原因",
			"selftag": "本人",
			"block": "限時封鎖",
			"ban": "永久停權",
			"unban": "解除",
			"empty": "目前沒有使用者",
			"loadfail": "讀取失敗",
			"blockmodaltitle": "限時封鎖使用者",
			"blockreasonlabel": "封鎖原因",
			"blockreasonplaceholder": "請輸入封鎖原因",
			"blockdurationlabel": "封鎖時長",
			"duration1hour": "1 小時",
			"duration1day": "1 天",
			"duration3day": "3 天",
			"duration7day": "7 天",
			"duration30day": "30 天",
			"banmodaltitle": "永久停權使用者",
			"banreasonlabel": "停權原因",
			"banreasonplaceholder": "請輸入停權原因",
			"banconfirm": "確認永久停權？此操作會踢除該使用者所有登入。",
			"unbanconfirm": "確認解除此使用者的封鎖/停權？",
			"cancel": "取消",
			"submit": "送出",
			"reasonrequired": "請輸入原因",
			"permissionupdated": "權限已更新",
			"blocksuccess": "已封鎖使用者",
			"bansuccess": "已停權使用者",
			"unbansuccess": "已解除",
			"actionfail": "操作失敗",
			"selfprotect": "無法對自己執行此操作"
		},
		"guidepage": {
			"title": "操作說明",
			"description": "PokerTrace 操作說明，涵蓋場次、報名座位、計時器、手牌紀錄、統計名次、系列賽、轉播回放、聘用人員、現場報到與工具中心。",
			"heading": "操作說明",
			"lead": "這裡整理 PokerTrace 的完整操作流程。你可以依照現場角色與需求直接跳到對應段落：從建場、報名座位、計時器、手牌紀錄、統計名次，到系列賽、轉播回放、聘用人員、現場報到收據與工具中心，都能快速找到操作重點。",
			"chapterlabel": "章節",
			"position": "定位本段",
			"copylink": "複製連結",
			"chapterlink": "章節連結",
			"downloadpdf": "下載介紹 PDF",
			"chaptereyebrow": "操作章節",
			"copysuccess": "已複製說明連結",
			"copyfail": "複製失敗，請手動複製網址",
			"copyunsupported": "目前瀏覽器不支援自動複製",
			"pagefallback": "前往頁面",
			"expandall": "全部展開",
			"collapseall": "全部收合",
			"stepslabel": "操作步驟",
			"toolslabel": "功能說明",
			"tiplabel": "提示",
			"chapters": [
				{
					"id": "start",
					"title": "快速開始",
					"lead": "第一次使用 PokerTrace 時，建議先完成帳號登入與個人資料設定，系統會自動為你建立專屬選手編號。完成基本設定後，再依你的現場角色（主辦／裁判 或 一般選手）選擇對應的操作流程，可大幅縮短上手時間。",
					"items": [
						{
							"id": "start-signin",
							"title": "登入或註冊",
							"desc": "PokerTrace 採用一站式登入：第一次登入時系統會自動建立帳號，不需另外填寫冗長的註冊表單。登入後你的所有場次、手牌與報表都會綁定到這個帳號，跨裝置都能延續同一份資料。",
							"steps": [
								"從首頁點選右上角的「登入」進入登入頁。",
								"輸入帳號資訊並送出，首次登入系統會自動建立你的帳號。",
								"登入成功後會導向主儀表板，並產生專屬的選手編號（Player ID）。",
								"建議立即前往個人資料，確認選手編號並補齊基本設定。"
							],
							"tip": "選手編號是其他主辦者搜尋並關聯到你的依據，請記下來方便日後報名時提供。",
							"tools": [
								{
									"name": "Google 登入",
									"use": "點擊使用 Google 帳號一鍵登入；首次登入會自動建立帳號，不需填寫註冊表單。"
								},
								{
									"name": "備用登入按鈕",
									"use": "若 Google 視窗沒有跳出，改點頁面下方的備用按鈕完成登入。"
								},
								{
									"name": "登入錯誤提示",
									"use": "驗證失敗時會在頁面顯示錯誤訊息，依提示重試或更換帳號。"
								}
							],
							"pageurl": "signin.html",
							"pagelabel": "前往登入頁"
						},
						{
							"id": "start-dashboard",
							"title": "回到主儀表板安排下一步",
							"desc": "主儀表板是登入後的首頁，會依你目前的資料狀態給出建議的下一步動作，並提供前往各主要功能的捷徑，避免在多個頁面間來回尋找。",
							"steps": [
								"查看上方的建議下一步卡片，依提示完成尚未設定的項目。",
								"需要開賽時，點選「建立場次」進入新增場次流程。",
								"想找既有場次時，點選「場次列表」用篩選條件快速定位。",
								"只想記錄個人成績時，可直接從捷徑進入個人成績補登。"
							],
							"tip": "若不確定該從哪裡開始，依主儀表板的建議卡片操作即可走完最常見的流程。",
							"tools": [
								{
									"name": "收益摘要卡",
									"use": "顯示今日／本週／本月盈虧，綠色為正、紅色為負，一眼掌握近況。"
								},
								{
									"name": "累積走勢圖",
									"use": "近 7 日盈虧趨勢線圖，適合快速回顧最近的表現。"
								},
								{
									"name": "建議下一步",
									"use": "依你的角色列出建議動作（建場、報名、計時器等），點卡片直接前往對應頁。"
								},
								{
									"name": "快速入口",
									"use": "場次列表、個人資料、上次操作頁等捷徑，點擊即跳轉到該功能。"
								}
							],
							"pageurl": "main.html",
							"pagelabel": "前往主儀表板"
						},
						{
							"id": "start-profile",
							"title": "先補齊個人設定",
							"desc": "個人資料頁集中管理你的身分、報表與常用設定。先把常用計分牌顏色與計分牌組合設定好，之後在牌桌與手牌頁就能快速套用，不必每次重新輸入。",
							"steps": [
								"確認選手編號（Player ID）是否正確，必要時提供給主辦者。",
								"設定常用的計分牌顏色與面額，建立至少一組常用計分牌組合。",
								"檢視月報表、年報表與生涯報表，確認資料正常顯示。",
								"如需助理或裁判協助，可在此維護聘用人員清單。"
							],
							"tip": "計分牌組合設定完成後，計分牌校正與手牌紀錄會更快速，建議優先完成。",
							"tools": [
								{
									"name": "選手 ID",
									"use": "顯示你的專屬編號，可提供給主辦者用於關聯報名。"
								},
								{
									"name": "語言",
									"use": "點「中文／English」即時切換整個介面的語言。"
								},
								{
									"name": "計分牌顏色種類",
									"use": "點「管理」開啟編輯視窗，維護場次可用的計分牌顏色名稱。"
								},
								{
									"name": "常用計分牌組合",
									"use": "點「管理」儲存常用面額組合，建立場次時可一鍵匯入。"
								},
								{
									"name": "個人摘要報表",
									"use": "切換月／年／生涯報表，並可「匯出 CSV」或前往進階報表。"
								},
								{
									"name": "小工具",
									"use": "提供勝率解算、底池賠率、ICM、結構產生器等現場常用工具。"
								}
							],
							"pageurl": "profile.html",
							"pagelabel": "前往個人資料"
						}
					]
				},
				{
					"id": "host",
					"title": "主辦版快速上手",
					"lead": "主辦（或裁判、賽務）流程建議依序完成：建立場次 → 進入場次詳情主控 → 開啟計時器控制端 → 管理牌桌座位與手牌。以下四步涵蓋一場賽事從開賽到結束最常用的操作，按順序走完即可順利收尾。",
					"items": [
						{
							"id": "host-create-session",
							"title": "1. 建立主辦場次",
							"desc": "建立場次是所有後續資料的起點。先選好正確的牌局模式（錦標賽／限時錦標賽／現金桌），系統會依模式顯示對應欄位，再分段填入報名規則、費用與進階設定，避免一次填寫過多而出錯。",
							"steps": [
								"進入新增場次，選擇「主辦牌局」模式。",
								"填寫基本資料：場次名稱、日期時間、地點與牌局型態。",
								"設定報名規則：開放報名、私人牌局、rebuy／reentry／addon。",
								"補上費用與保底獎金等進階設定後儲存。"
							],
							"tip": "牌局模式建立後會影響可用欄位與報表，請在儲存前再次確認選擇正確。",
							"pageurl": "newsession.html",
							"pagelabel": "前往新增場次"
						},
						{
							"id": "host-manage-session",
							"title": "2. 進入場次詳情做主控",
							"desc": "場次建立後，場次詳情頁就是整場賽事的中控台。你可以在這裡切換總覽、牌桌、手牌、名次與其他設定等頁籤，所有現場資料都從這個入口延伸。",
							"steps": [
								"從場次列表找到剛建立的場次並點入詳情。",
								"在「總覽」確認基本資料、報名狀態與動作按鈕。",
								"依需求切換到牌桌、手牌或名次頁籤處理對應資料。",
								"把此頁加入書籤，現場隨時可回到中控台。"
							],
							"tip": "場次詳情是主辦流程的中心頁，遇到不確定要去哪裡時，先回到這裡再分流。",
							"pageurl": "sessionlist.html",
							"pagelabel": "前往場次列表"
						},
						{
							"id": "host-run-timer",
							"title": "3. 開啟計時器控制端",
							"desc": "控制端是現場控時與賽務的主要操作介面，裁判與助理多數動作都集中在這裡完成，並會即時同步到顯示端供選手觀看。",
							"steps": [
								"從場次或主辦工具進入控制端。",
								"確認盲注結構與目前 level，按需要開始或暫停計時。",
								"在適當時機關閉報名、插入休息或調整剩餘時間。",
								"處理淘汰、剩餘人數、名次與跑馬燈公告。"
							],
							"tip": "控制端與顯示端共用同一場次資料，控制端的每次調整都會即時反映到大螢幕。",
							"pageurl": "control.html",
							"pagelabel": "前往控制端"
						},
						{
							"id": "host-table-flow",
							"title": "4. 管理座位與手牌",
							"desc": "當你需要更細緻的現場資料（座位安排、換桌、手牌品質）時，進到牌桌詳情處理。這裡可視覺化管理座位流，並串接手牌紀錄與統計。",
							"steps": [
								"從場次詳情進入指定牌桌的牌桌詳情。",
								"設定最大座位數、第一莊家與本人座位後儲存。",
								"需要時做計分牌校正，讓下一手承接正確碼量。",
								"新增手牌或檢視手牌列表，查看統計與 EV 圖。"
							],
							"tip": "錦標賽需要併桌時，可在牌桌詳情把整桌併入目標牌桌，座位事件流會完整保留。",
							"pageurl": "table.html",
							"pagelabel": "前往牌桌詳情"
						}
					]
				},
				{
					"id": "player",
					"title": "選手版快速上手",
					"lead": "選手流程比主辦流程精簡許多，主要圍繞三件事：找到想參加的場次並報名、在個人資料追蹤自己的成績、以及在沒有主辦資料時自行補登參賽結果。你不需要處理計時器或牌桌等主辦端設定。",
					"items": [
						{
							"id": "player-join-session",
							"title": "1. 從場次列表找可參加的場次",
							"desc": "場次列表彙整了所有與你相關的場次，並提供多種篩選方式，讓你在大量場次中快速找到目標。狀態分頁可區分可報名、你主辦的，以及你已參與的場次。",
							"steps": [
								"進入場次列表，使用日期、地點或名稱搜尋目標場次。",
								"善用快速篩選切換「可報名／已主辦／已參與」狀態。",
								"點入場次詳情確認規則、費用與報名是否開放。",
								"確認無誤後依主辦指示完成報名（或提供你的選手編號）。"
							],
							"tip": "若找不到某場次，先確認該場是否為私人牌局或尚未開放報名。",
							"pageurl": "sessionlist.html",
							"pagelabel": "前往場次列表"
						},
						{
							"id": "player-check-profile",
							"title": "2. 在個人資料查看報表",
							"desc": "個人資料頁是你追蹤長期表現的地方，會自動彙整不同時間範圍與遊戲類型的成績，不需手動計算就能掌握盈虧趨勢。",
							"steps": [
								"進入個人資料，切換月報表、年報表與生涯報表。",
								"依遊戲類型查看總買入、收益與 ROI 等指標。",
								"確認聘用人員與常用計分牌設定是否正確。",
								"如發現某場成績缺漏，前往補登流程補上。"
							],
							"tip": "報表會即時反映新登錄的場次成績，補登後回到這裡即可看到更新後的數字。",
							"pageurl": "profile.html",
							"pagelabel": "前往個人資料"
						},
						{
							"id": "player-record-result",
							"title": "3. 補登自己的參賽成績",
							"desc": "若你參加的是別人主辦、PokerTrace 上沒有完整資料的場次，可用個人成績補登模式只記錄自己的結果，讓報表保持完整，而不必建立整場賽事。",
							"steps": [
								"進入新增場次，選擇「個人成績補登」模式。",
								"填寫場次名稱、日期、地點與遊戲類型。",
								"輸入你的買入、重購／增購、最終名次與獎金。",
								"儲存後到個人資料確認報表已納入這筆成績。"
							],
							"tip": "補登模式只記錄你自己的資料，不會影響其他選手，適合外部賽事的個人留存。",
							"pageurl": "newsession.html",
							"pagelabel": "前往成績補登"
						}
					]
				},
				{
					"id": "session",
					"title": "場次管理",
					"lead": "場次是 PokerTrace 所有資料的核心容器：牌桌、報名、計時器、手牌與統計全部都掛在場次之下。把場次的模式、規則與關聯設定好，後續流程才能正確串接，報表也才會準確。",
					"items": [
						{
							"id": "session-create",
							"title": "建立與分類場次",
							"desc": "場次模式決定了可填的欄位與報表呈現方式，是建立時最關鍵的選擇。錦標賽、限時錦標賽與現金桌各有不同的計分與獎勵邏輯，務必依實際牌局選對。",
							"steps": [
								"進入新增場次，先決定錦標賽、限時錦標賽或現金桌。",
								"選擇牌局型態（如德州撲克、Omaha 等）。",
								"填寫名稱、日期時間與地點等基本資料。",
								"確認模式無誤後儲存，再進入細項設定。"
							],
							"tip": "模式一旦影響到報表結構，建議在開賽前就確定；不確定時優先依實際計分方式選擇。",
							"tools": [
								{
									"name": "模式選擇",
									"use": "在「主辦牌局／個人成績補登」兩張卡片擇一，決定後續會出現哪些欄位。"
								},
								{
									"name": "牌局型態",
									"use": "下拉選擇錦標賽／限時錦標賽／現金局，會連動可填欄位與報表呈現。"
								},
								{
									"name": "步驟導航",
									"use": "依「基本資料→報名與規則→費用與獎勵→進階設定」逐步填寫，每步會驗證。"
								},
								{
									"name": "基本資料",
									"use": "填寫場次名稱、地點、開始日期與起訖時間等必填欄位。"
								},
								{
									"name": "AI 匯入賽事",
									"use": "貼上其他網站的賽事文字，點「解析並填入」自動帶入名稱、買入與結構。"
								},
								{
									"name": "建立場次",
									"use": "在最後一步點擊送出，正式建立場次。"
								}
							],
							"pageurl": "newsession.html",
							"pagelabel": "前往建立場次"
						},
						{
							"id": "session-overview",
							"title": "場次詳情總覽",
							"desc": "總覽頁是場次的門面，集中顯示基本資料、即時資訊、備註與主要動作按鈕，同時也是進入牌桌、手牌與名次等子頁的入口。",
							"steps": [
								"進入場次詳情，於總覽確認基本資料與目前狀態。",
								"在備註區記錄現場注意事項或特別規則。",
								"使用動作按鈕快速開賽、關閉報名或調整設定。",
								"透過頁籤切換到牌桌、手牌或名次做後續處理。"
							],
							"tip": "備註欄適合寫下臨時規則或現場約定，方便賽務交接時對齊資訊。",
							"tools": [
								{
									"name": "主頁籤",
									"use": "總覽／牌桌／手牌／名次／其他，切換場次的各功能區（名次為主辦可見）。"
								},
								{
									"name": "總覽子頁",
									"use": "一般（資訊卡與動作區）、資訊（賽制細項）、備註三個子頁切換。"
								},
								{
									"name": "資訊卡",
									"use": "顯示預估人數、選手型態、目前狀態與報名截止級別／時間。"
								},
								{
									"name": "設定徽章",
									"use": "報名截止、使用者連結、開放報名、私人牌局等狀態以「是／否」一覽。"
								},
								{
									"name": "動作按鈕",
									"use": "依角色顯示報名工作台、計時器控制台、顯示頁或「立即報名」。"
								},
								{
									"name": "備註子頁",
									"use": "顯示場次說明與現場注意事項的完整文字。"
								}
							],
							"pageurl": "session.html",
							"pagelabel": "前往場次詳情"
						},
						{
							"id": "session-hosted-rules",
							"title": "主辦牌局規則",
							"desc": "主辦牌局提供完整的規則設定，從報名開放方式到買入結構都能細調。這些設定會直接影響報名管理與獎池計算，請依賽事章程設定。",
							"steps": [
								"在規則設定決定是否開放報名或設為私人牌局。",
								"設定使用者連結方式，讓選手能關聯到實際帳號。",
								"開啟並設定 rebuy、reentry、addon 的條件與費用。",
								"填入保底獎金（Guarantee）等獎勵設定後儲存。"
							],
							"tip": "私人牌局不會公開於可報名清單，適合僅限受邀選手參加的場次。",
							"tools": [
								{
									"name": "使用者連結",
									"use": "勾選後選手才能把場次關聯到自己的帳號，是開放報名的前置條件。"
								},
								{
									"name": "開放報名",
									"use": "勾選讓選手可從場次列表自行報名（需先開啟使用者連結）。"
								},
								{
									"name": "私人牌局",
									"use": "勾選後不公開於可報名清單，僅限受邀選手參加。"
								},
								{
									"name": "Rebuy／Reentry／Addon 次數",
									"use": "各自輸入可重購、再入、增購的次數（0 表示不開放）。"
								},
								{
									"name": "費用與計分牌",
									"use": "為買入及各 rebuy／reentry／addon 設定費用、服務費與對應計分牌。"
								},
								{
									"name": "保底獎金",
									"use": "輸入保底獎池金額（Guarantee），用於計算最終獎池。"
								}
							],
							"pageurl": "newsession.html",
							"pagelabel": "前往規則設定"
						},
						{
							"id": "session-relations",
							"title": "關聯與延伸賽事",
							"desc": "在其他設定頁籤可以把多場相關賽事串起來，例如衛星賽晉級到主賽、或同一系列的多日賽，方便追蹤與彙整。",
							"steps": [
								"進入場次的「其他設定」頁籤。",
								"建立與其他場次的關聯（如衛星賽對應主賽）。",
								"補充延伸資訊與進階設定。",
								"儲存後可在相關場次間互相追蹤。"
							],
							"tip": "多日賽或系列賽建議先建立關聯，賽後彙整成績與晉級名單時會更輕鬆。",
							"tools": [
								{
									"name": "設定子頁",
									"use": "一般設定、牌局設定，以及刪除賽事（紅字危險操作）。"
								},
								{
									"name": "關聯子頁",
									"use": "建立衛星賽傳入／傳出、多日傳入／傳出等賽事關聯。"
								},
								{
									"name": "資訊子頁",
									"use": "顯示場次 id 與 querykey 等中繼資料，方便對帳與回報問題。"
								},
								{
									"name": "牌局設定",
									"use": "進入賽制編輯，調整盲注級別、前注與時間結構。"
								}
							],
							"pageurl": "session.html",
							"pagelabel": "前往其他設定"
						}
					]
				},
				{
					"id": "players",
					"title": "報名與座位",
					"lead": "報名負責「誰參加」，座位負責「坐在哪」。把選手關聯到實際帳號後，座位頁會以牌桌視覺化方式呈現位置，並完整保留入座、換桌、淘汰等事件流，讓現場與賽後報表一致。",
					"items": [
						{
							"id": "players-registration",
							"title": "報名管理",
							"desc": "報名管理讓主辦者掌握每位選手的買入狀態。除了確認與取消，還能恢復誤刪的報名，並逐筆記錄買入結構，作為獎池與報表的計算基礎。",
							"steps": [
								"在場次詳情的報名區查看目前報名名單。",
								"確認新報名，或取消／恢復既有報名。",
								"逐筆記錄買入、服務費、重購、再入與增購。",
								"如有票券（Ticket）入場，一併登記票券資訊。"
							],
							"tip": "重購與再入會影響總入場數與獎池，每次發生時即時登記可避免賽後對帳困難。",
							"tools": [
								{
									"name": "報名工作台",
									"use": "從場次詳情進入，集中管理整場的報名名單與買入。"
								},
								{
									"name": "確認／取消／恢復",
									"use": "對每位選手切換報名狀態；誤刪的報名可按「恢復」救回。"
								},
								{
									"name": "買入結構欄位",
									"use": "逐筆登記買入、服務費、重購、再入與增購，作為獎池計算依據。"
								},
								{
									"name": "票券資訊",
									"use": "選手以票券（Ticket）入場時，登記票券價值。"
								},
								{
									"name": "座位子頁",
									"use": "以視覺化牌桌檢視已關聯選手的座位，並標出「我的座位」。"
								}
							],
							"pageurl": "session.html",
							"pagelabel": "前往場次詳情"
						},
						{
							"id": "players-seating",
							"title": "座位與換桌",
							"desc": "牌桌詳情頁用視覺化版面管理座位。你可以設定牌桌容量與莊家，調整每個座位的狀態，錦標賽收桌時也能把整桌選手併到其他牌桌。",
							"steps": [
								"進入牌桌詳情，設定最大座位數與第一莊家。",
								"設定本人座位，方便後續手牌標記 Hero。",
								"於各座位處理入座、換人、離席等事件。",
								"需要收桌時，使用併桌把整桌併入目標牌桌並儲存。"
							],
							"tip": "每個座位都會記錄完整事件歷史，支援錦標賽換桌與補位，不必擔心覆蓋舊資料。",
							"tools": [
								{
									"name": "最大座位數",
									"use": "下拉選 6／8／9／10 人桌，決定顯示的座位列數。"
								},
								{
									"name": "第一莊家",
									"use": "下拉設定莊家座位，其餘座位會依此重新排列。"
								},
								{
									"name": "本人座位",
									"use": "下拉標記自己的座位，供手牌紀錄標記 Hero。"
								},
								{
									"name": "選手／計分牌欄",
									"use": "每個座位指定選手並輸入起始計分牌，碼量不明時可勾選「未知計分牌」。"
								},
								{
									"name": "清空",
									"use": "把座位上的選手移除，但不記為淘汰。"
								},
								{
									"name": "淘汰",
									"use": "將該座位選手淘汰並記錄，座位空出。"
								},
								{
									"name": "換桌",
									"use": "選擇目標牌桌後，把該選手移動過去。"
								},
								{
									"name": "併到指定桌",
									"use": "把整桌選手併入選定的目標牌桌，用於錦標賽收桌。"
								},
								{
									"name": "儲存座位",
									"use": "保存所有座位指派與計分牌設定。"
								}
							],
							"pageurl": "table.html",
							"pagelabel": "前往牌桌座位"
						},
						{
							"id": "players-seat-order",
							"title": "Dealer 與座位順序",
							"desc": "理解座位排列邏輯能讓你更快對應現場與系統畫面。版面以 Dealer 為基準順時針編號，空位也會保留位置，維持牌桌的視覺一致性。",
							"steps": [
								"Dealer（莊家）固定顯示在版面中間下方。",
								"Seat 1 從 Dealer 左側開始，順時針依序排列。",
								"空位會保留為 EMPTY 類型的視覺位置。",
								"對照現場實際座位確認編號是否一致。"
							],
							"tip": "若座位順序與現場對不上，先確認第一莊家設定是否正確，其餘座位會跟著重排。",
							"tools": [
								{
									"name": "Dealer 標記",
									"use": "莊家（Dealer）固定顯示在版面中間下方，作為座位排列的基準。"
								},
								{
									"name": "座位編號",
									"use": "Seat 1 從 Dealer 左側開始，順時針依序編號。"
								},
								{
									"name": "EMPTY 空位",
									"use": "空位保留為 EMPTY 視覺位置，維持牌桌版面一致。"
								},
								{
									"name": "座位徽章",
									"use": "座位卡上以 DEALER／HERO／SB／BB 標示莊家、本人與盲注位置。"
								}
							],
							"pageurl": "table.html",
							"pagelabel": "查看牌桌版面"
						},
						{
							"id": "players-elimination",
							"title": "淘汰與保留名次",
							"desc": "淘汰處理同時兼顧現場畫面與報表正確性。選手被淘汰後會從座位移除以保持牌桌乾淨，但其名次與 payout 仍完整保留，賽後報表不會遺漏。",
							"steps": [
								"在控制端或牌桌處理選手淘汰。",
								"系統會將該選手從牌桌座位上移除。",
								"其最終名次與 payout 會自動保留。",
								"於名次頁確認淘汰順序與獎金正確。"
							],
							"tip": "淘汰只影響座位顯示，不會刪除成績；若誤淘汰可在名次資料中查回該選手。",
							"tools": [
								{
									"name": "淘汰按鈕（— 淘汰）",
									"use": "在控制端淘汰一名選手，剩餘人數會連動減一。"
								},
								{
									"name": "關聯選手淘汰視窗",
									"use": "連結模式下以姓名／ID／座位搜尋指定選手，再按淘汰或復原。"
								},
								{
									"name": "名次保留",
									"use": "淘汰後名次與 payout 自動保留，可在名次頁查看。"
								},
								{
									"name": "+1 入場",
									"use": "若報名仍開放，可補登一位新入場選手（報名已截止會先提示）。"
								}
							],
							"pageurl": "control.html",
							"pagelabel": "前往淘汰控制"
						}
					]
				},
				{
					"id": "timer",
					"title": "計時器",
					"lead": "計時器分為兩個畫面：控制端（control）給賽務操作，顯示端（display）投放給選手觀看。兩者共用同一場次資料並即時同步，因此你只需在控制端操作，大螢幕就會自動更新，不必兩邊各自維護。",
					"items": [
						{
							"id": "timer-control",
							"title": "控制端主操作",
							"desc": "控制端整合了賽事進行中的所有控制項，是裁判的主操作面板。從比賽名稱、盲注結構到公告與獎池都能在這裡設定，調整後即時同步到顯示端。",
							"steps": [
								"設定比賽名稱與盲注結構。",
								"開始計時，依進度暫停或恢復。",
								"在規定時間關閉報名（報名截止）。",
								"發布跑馬燈公告、維護獎池與淘汰名次。"
							],
							"tip": "現場多數動作都集中在控制端完成，建議由固定一人操作以避免重複調整。",
							"tools": [
								{
									"name": "賽事名稱／副標題",
									"use": "點標題或「編輯標題」開視窗，修改主標題與副標題。"
								},
								{
									"name": "暫停／繼續計時",
									"use": "切換計時器的開始與暫停。"
								},
								{
									"name": "報名狀態徽章",
									"use": "點 REG OPEN／CLOSED 切換報名開放或截止狀態。"
								},
								{
									"name": "跑馬燈訊息",
									"use": "輸入公告文字（用 | 分隔多則），點「儲存並廣播」送到所有顯示端。"
								},
								{
									"name": "設定",
									"use": "開啟設定視窗，調整音效、震動、依時間自動開始與時間銀行秒數。"
								},
								{
									"name": "完全重置",
									"use": "在設定視窗把計時器狀態重設為預設值（需二次確認）。"
								},
								{
									"name": "同步狀態",
									"use": "底部燈號顯示與顯示端的連線狀態，並標出最後一次操作。"
								}
							],
							"pageurl": "control.html",
							"pagelabel": "前往控制端"
						},
						{
							"id": "timer-levels",
							"title": "盲注級別與休息",
							"desc": "盲注級別（Level）控制比賽節奏。系統從 Level 1 開始計算，休息不佔用 level 編號，且可彈性跳關或插入休息，因應現場臨時狀況。",
							"steps": [
								"確認目前 Level 與對應的小盲、大盲與前注。",
								"需要時可往前或往後跳關，調整比賽節奏。",
								"可直接結束本項，提早進入下一關。",
								"在適當時機插入休息，並調整休息剩餘時間。"
							],
							"tip": "休息時間不會被算成一個 level，因此跳關或插入休息都不會打亂盲注級別的編號。",
							"tools": [
								{
									"name": "時間微調",
									"use": "−5m～+1m 等按鈕，快速增減本項剩餘時間。"
								},
								{
									"name": "設定時間",
									"use": "輸入 MM:SS 或秒數後套用，直接指定本項剩餘時間。"
								},
								{
									"name": "重設本項時間／結束本項",
									"use": "還原本關全長，或立即結束本項進入下一項。"
								},
								{
									"name": "上一項／下一項",
									"use": "往前或往後切換到上一個／下一個級別或休息。"
								},
								{
									"name": "跳到 L",
									"use": "輸入級別號直接跳到該 level（跳轉時會略過休息）。"
								},
								{
									"name": "級別結構列表",
									"use": "點清單中任一級別或休息，即可跳到該項。"
								},
								{
									"name": "插入休息／結束本次休息",
									"use": "在目前項目後插入休息，或提早結束休息並可微調休息時間。"
								},
								{
									"name": "查看／編輯賽制",
									"use": "開啟賽制頁檢視全表，或新增、編輯、刪除級別與休息。"
								}
							],
							"pageurl": "control.html",
							"pagelabel": "前往關卡控制"
						},
						{
							"id": "timer-players",
							"title": "人數、名次與獎池",
							"desc": "控制端也負責即時的人數與獎勵管理。剩餘人數、總入場數與 ITM 人數會連動獎池與 payout，並支援泡泡圈（bubble）這類關鍵時刻的特別處理。",
							"steps": [
								"即時更新剩餘人數與總入場數。",
								"設定 ITM（進入獎勵圈）人數。",
								"處理淘汰選手，系統會連動名次。",
								"接近獎勵圈時切換泡泡圈模式並維護 payout。"
							],
							"tip": "總入場數含重購與再入，調整時請與報名管理的紀錄對齊，確保獎池計算正確。",
							"tools": [
								{
									"name": "剩餘人數 −／+",
									"use": "用減號／加號即時增減剩餘選手數。"
								},
								{
									"name": "編輯人數",
									"use": "開視窗手動修改剩餘人數、總入場數與起始計分牌。"
								},
								{
									"name": "淘汰／+1 入場",
									"use": "淘汰一名選手，或在報名開放時補登一位入場。"
								},
								{
									"name": "獎池 Auto／Manual",
									"use": "切換自動（買入×入場）或手動輸入獎池金額後套用。"
								},
								{
									"name": "ITM 百分比／人數",
									"use": "以百分比或直接人數設定進錢圈，系統會即時換算另一個數值。"
								},
								{
									"name": "智能分配",
									"use": "依目前 ITM 人數自動產生 payout 結構（需確認）。"
								},
								{
									"name": "名次預覽／編輯獎金",
									"use": "預覽各名次獎金，或開頁手動編輯名次範圍與金額。"
								},
								{
									"name": "快速預設",
									"use": "泡泡圈、同步發牌、Final Table、計分牌汰換等一鍵廣播到顯示端。"
								}
							],
							"pageurl": "control.html",
							"pagelabel": "前往人數管理"
						},
						{
							"id": "timer-display",
							"title": "顯示端用途",
							"desc": "顯示端是給選手看的對外畫面，介面以清晰大字呈現賽事關鍵資訊，適合接上投影機或現場大螢幕，內容會跟著控制端即時更新。",
							"steps": [
								"在大螢幕或投影裝置開啟顯示端。",
								"確認目前 level、剩餘時間與盲注正確顯示。",
								"檢查名次與公告是否同步呈現。",
								"開賽後保持此頁開啟，由控制端統一更新。"
							],
							"tip": "顯示端只負責呈現、不需操作；所有變更都從控制端發出並自動同步。",
							"tools": [
								{
									"name": "中央計時面板",
									"use": "大字顯示倒數時間或手數，附進度條與 LEVEL／BREAK 標籤。"
								},
								{
									"name": "盲注資訊",
									"use": "顯示目前小盲／大盲與 BB Ante。"
								},
								{
									"name": "剩餘人數卡",
									"use": "顯示剩餘／總入場數，以及泡泡圈狀態。"
								},
								{
									"name": "平均計分牌卡",
									"use": "顯示平均碼量與對應的 BB 倍率。"
								},
								{
									"name": "報名倒數卡",
									"use": "顯示距報名截止的時間，截止後顯示 CLOSED。"
								},
								{
									"name": "下一盲注／下一休息卡",
									"use": "預告下一級別的盲注與下一次休息的時間。"
								},
								{
									"name": "獎金區",
									"use": "列出名次與獎金並顯示總獎池，進錢圈名次會以綠色強調。"
								},
								{
									"name": "跑馬燈",
									"use": "橫向捲動顯示控制端送出的公告訊息。"
								}
							],
							"pageurl": "display.html",
							"pagelabel": "前往顯示端"
						}
					]
				},
				{
					"id": "hands",
					"title": "手牌紀錄",
					"lead": "手牌紀錄採三步式流程：先確認位置資訊（牌桌、盲注、座位），再依座位順序記錄每位選手的行動，最後檢查例外與贏家後送出。依序操作能確保每手牌資料完整、可用於後續 EV 與統計分析。",
					"items": [
						{
							"id": "hands-new-hand",
							"title": "從牌桌新增手牌",
							"desc": "手牌都從牌桌詳情起手。新增前可先做計分牌校正，把每位選手的碼量更新到實際狀態，下一手就能承接正確的計分牌與座位，避免曲線失真。",
							"steps": [
								"進入牌桌詳情，確認目前座位與碼量。",
								"如有誤差，先執行計分牌校正更新各座位碼量。",
								"點選「新增手牌」開始記錄一手新牌。",
								"系統會帶入當前座位狀態作為起始資料。"
							],
							"tip": "養成每隔幾手做一次計分牌校正的習慣，EV 圖與統計會更貼近真實。",
							"tools": [
								{
									"name": "新增手牌",
									"use": "進入手牌編輯頁，開始記錄一手新牌。"
								},
								{
									"name": "計分牌校正",
									"use": "進入校正頁，把各座位碼量更新到實際狀態。"
								},
								{
									"name": "篩選列",
									"use": "以選手 ID、座位、起訖日期過濾手牌列表，點「清除」還原全部。"
								},
								{
									"name": "編輯／刪除",
									"use": "對列表中的手牌進行編輯或刪除（需具備權限）。"
								},
								{
									"name": "分頁",
									"use": "以上一頁／下一頁瀏覽手牌列表，並顯示目前範圍與總數。"
								}
							],
							"pageurl": "table.html",
							"pagelabel": "前往手牌入口"
						},
						{
							"id": "hands-position",
							"title": "先確認位置資訊",
							"desc": "位置資訊是手牌的基礎，錯了會影響後續所有行動判讀。建立手牌的第一步，務必先把盲注結構與關鍵座位確認清楚。",
							"steps": [
								"確認牌桌與目前的盲注級別（Level）。",
								"檢查小盲、大盲、前注與 BB Ante 的數值。",
								"指定 Dealer（莊家）與 Hero（本人）座位。",
								"如有特殊位置（straddle 等）一併設定。"
							],
							"tip": "Hero 座位設定正確後，閱讀手牌時會以你的視角標記，回顧自己的決策更直覺。",
							"tools": [
								{
									"name": "遊戲類型",
									"use": "下拉選擇德州撲克、奧馬哈等牌型。"
								},
								{
									"name": "盲注級別",
									"use": "從賽制選一個級別自動帶入盲注，或選「自填」手動輸入。"
								},
								{
									"name": "小盲／大盲／Ante",
									"use": "輸入盲注與前注金額（Ante 標籤會依前注模式變動）。"
								},
								{
									"name": "Dealer／Hero 座位",
									"use": "下拉指定莊家座位與本人（Hero）座位。"
								},
								{
									"name": "空 button／獨立大盲",
									"use": "單挑沒有空莊、或沒有小盲（straddle）時勾選對應選項。"
								},
								{
									"name": "重建預設下注",
									"use": "依在座選手自動產生 preflop 的盲注與前注下注。"
								},
								{
									"name": "座位列表",
									"use": "視覺化顯示各座位計分牌與 DEALER／HERO／SB／BB 徽章。"
								},
								{
									"name": "步驟導航／清空暫存",
									"use": "在三步驟間切換，或清除尚未儲存的手牌資料。"
								}
							],
							"pageurl": "newedithand.html",
							"pagelabel": "前往手牌編輯"
						},
						{
							"id": "hands-actions",
							"title": "依流程記錄行動",
							"desc": "進入行動記錄後，系統會引導你依座位順序逐一輸入。預設盲注與 ante 會先自動建立，你只需從第一個該行動的座位開始記錄即可。",
							"steps": [
								"系統先自動建立預設盲注與 ante。",
								"依座位順序，系統會提示下一個該行動的 Seat。",
								"選擇 fold／call／check，或在 raise 時於輸入框填入金額。",
								"逐街（preflop／flop／turn／river）完成所有行動。"
							],
							"tip": "all-in 會在閱讀畫面上特別標記，方便日後快速找出關鍵全下的手牌。",
							"tools": [
								{
									"name": "Hub 按鈕",
									"use": "新增我的手牌／公共牌／下注管理／攤牌結果四個區塊切換。"
								},
								{
									"name": "街別",
									"use": "下拉切 preflop／flop／turn／river，隨手牌進度自動推進。"
								},
								{
									"name": "Fold／Check・Call",
									"use": "一鍵記錄棄牌，或過牌／跟注，並自動換到下一位行動者。"
								},
								{
									"name": "Bet／Raise",
									"use": "開下注視窗，用計分牌計算機（倍率預設、面額鍵、數字鍵）輸入金額，可勾 All-in。"
								},
								{
									"name": "公共牌編輯",
									"use": "設定 flop／turn／river 三街的公共牌，以及各街的燒牌。"
								},
								{
									"name": "選牌視窗",
									"use": "以花色 × 點數網格挑牌，已用過的牌會反灰不可選。"
								},
								{
									"name": "行動列表",
									"use": "顯示已記錄的每筆行動，可逐列移除以更正。"
								},
								{
									"name": "時間銀行",
									"use": "若場次有設定，可對當前行動者開始、暫停或重設倒數。"
								}
							],
							"pageurl": "newedithand.html",
							"pagelabel": "前往行動記錄"
						},
						{
							"id": "hands-review",
							"title": "送出前檢查例外",
							"desc": "最後一步是補上攤牌結果並做完整性檢查。系統會在資料缺漏或不連貫時主動提醒，但仍保留彈性讓你在確認後強制送出特殊情況的手牌。",
							"steps": [
								"記錄攤牌的 show 或 muck。",
								"如有燒牌（burn）等例外狀況一併登記。",
								"指定本手的贏家與分配。",
								"儲存；若系統提醒缺漏，確認後可選擇強制送出。"
							],
							"tip": "提醒不代表錯誤——遇到特殊牌局（如棄牌贏池）確認後強制送出即可，資料仍會保留。",
							"tools": [
								{
									"name": "攤牌列（show／muck）",
									"use": "為每個座位設定亮牌（show）或蓋牌（muck）。"
								},
								{
									"name": "贏家與分配",
									"use": "勾選贏家座位並輸入該座位贏得的金額（可多位分池）。"
								},
								{
									"name": "檢查提醒區",
									"use": "列出缺漏或不連貫的錯誤（紅）與提醒（黃），全部通過會顯示可送出。"
								},
								{
									"name": "摘要框",
									"use": "顯示在座人數、底池、贏家數與已分配金額，送出前快速核對。"
								},
								{
									"name": "備註",
									"use": "記錄裁決或特殊狀況的文字說明。"
								},
								{
									"name": "送出／送出並新增下手牌",
									"use": "儲存手牌；首次若有提醒會停下，再點一次可強制送出，或直接接續記錄同桌下一手。"
								},
								{
									"name": "匯出 JSON／編輯",
									"use": "在手牌詳情頁匯出完整紀錄，或回到編輯頁修改這手牌。"
								}
							],
							"pageurl": "handdetail.html",
							"pagelabel": "查看手牌詳情"
						}
					]
				},
				{
					"id": "reports",
					"title": "統計與名次",
					"lead": "統計資料分三個層級：牌桌層級專注單桌、場次層級彙整全場所有牌桌、個人資料則跨場整理你自己的長期表現。名次與 payout 則記錄賽事結果並驅動獎金分配。依需求選對層級，就能快速找到要看的數字。",
					"items": [
						{
							"id": "reports-session",
							"title": "場次統計與手牌列表",
							"desc": "場次層級的統計彙整了該場所有牌桌的手牌，是賽後回顧整場的主要入口。手牌區提供完整的查詢與視覺化工具，方便從大量資料中找出重點。",
							"steps": [
								"進入場次詳情的手牌區。",
								"用篩選條件（選手、座位、日期）縮小範圍。",
								"以分頁瀏覽手牌列表，逐手檢視。",
								"查看 EV 圖與統計卡片掌握整場趨勢。"
							],
							"tip": "場次統計會合併所有牌桌，想看單一桌的細節時改用牌桌統計更聚焦。",
							"tools": [
								{
									"name": "手牌子頁",
									"use": "總覽（手牌列表）、圖表、統計三個子頁切換。"
								},
								{
									"name": "篩選列",
									"use": "以牌桌／選手／座位與起訖日期過濾手牌，點「清除」還原。"
								},
								{
									"name": "選手選擇器",
									"use": "多名選手時，可選特定選手查看其圖表與統計。"
								},
								{
									"name": "摘要卡",
									"use": "顯示高點、低點與最終計分牌等彙整數字。"
								},
								{
									"name": "累積計分牌圖",
									"use": "以手牌序累積的計分牌折線圖，掌握整場走勢。"
								},
								{
									"name": "分頁",
									"use": "以上一頁／下一頁瀏覽手牌列表。"
								}
							],
							"pageurl": "session.html",
							"pagelabel": "前往場次統計"
						},
						{
							"id": "reports-table",
							"title": "牌桌統計與 EV 圖",
							"desc": "牌桌層級的統計聚焦單一桌的選手與手牌，適合分析特定桌的手牌品質與計分牌走勢，EV 圖能直觀呈現碼量隨手牌累積的變化。",
							"steps": [
								"進入指定牌桌的牌桌詳情。",
								"切換選手、手牌、統計與 EV 圖等頁籤。",
								"在 EV 圖觀察計分牌曲線（左舊右新）。",
								"對照統計數據評估該桌的手牌品質。"
							],
							"tip": "EV 圖以實際手牌結果累積，左側為最舊、右側為最新，搭配計分牌校正會更準確。",
							"tools": [
								{
									"name": "統計頁",
									"use": "顯示手牌數、淨利、勝率、AVG、BEST、WORST 與 All-in 手數等卡片。"
								},
								{
									"name": "EV 圖",
									"use": "計分牌變化折線圖（左舊右新），滑鼠懸停可看各點精確值。"
								},
								{
									"name": "選手／手牌頁",
									"use": "檢視該桌選手清單與每一手牌的明細。"
								}
							],
							"pageurl": "table.html",
							"pagelabel": "前往牌桌統計"
						},
						{
							"id": "reports-payout",
							"title": "名次與 payout",
							"desc": "名次頁管理賽事的最終排名與獎金分配。可用範圍方式批次設定 payout，並且控制端與場次名次頁的資料互通，現場與賽後都能維護。",
							"steps": [
								"進入場次名次頁或從控制端調整名次。",
								"以範圍設定 payout，例如 1-10 晉級。",
								"為固定獎金名次設定金額，例如 11-12 固定獎金。",
								"確認名次與金額後儲存，供報表引用。"
							],
							"tip": "控制端與名次頁共用同一份 payout，現場淘汰時即時調整就會反映到最終報表。",
							"tools": [
								{
									"name": "名次頁籤",
									"use": "顯示總獎金、原獎池與 Entries（總入場）摘要。"
								},
								{
									"name": "搜尋",
									"use": "以選手名或座位查詢特定名次列。"
								},
								{
									"name": "名次列表",
									"use": "顯示名次、選手、座位與對應獎金。"
								},
								{
									"name": "payout 編輯器",
									"use": "以範圍設定名次與金額，例如 1-10 晉級、11-12 固定獎金。"
								},
								{
									"name": "控制端名次",
									"use": "也可在控制端即時調整 payout，兩處資料互通同步。"
								}
							],
							"pageurl": "session.html",
							"pagelabel": "前往名次頁"
						},
						{
							"id": "reports-profile",
							"title": "個人報表",
							"desc": "個人報表跨越所有場次，彙整你的長期成績。系統依時間範圍與遊戲類型自動計算關鍵指標，讓你不必手動整理就能評估自己的表現。",
							"steps": [
								"進入個人資料，切換月／年／生涯報表。",
								"依遊戲類型檢視總買入與總收益。",
								"參考 ROI 等指標評估投資報酬。",
								"如發現缺漏，回到成績補登補上資料。"
							],
							"tip": "個人報表會把主辦場次與個人補登的成績一併納入，建議兩種來源都保持登錄完整。",
							"tools": [
								{
									"name": "報表頁籤",
									"use": "月報表／年報表／生涯報表切換。"
								},
								{
									"name": "年月選擇",
									"use": "月報表選年月、年報表選年份，鎖定要看的區間。"
								},
								{
									"name": "包含服務費",
									"use": "勾選切換盈虧計算是否計入服務費。"
								},
								{
									"name": "類型卡片",
									"use": "現金桌／限時錦標賽／錦標賽分別顯示買入、收益與 ROI（含 ITM／FT／Top3）。"
								},
								{
									"name": "盈虧比較圖",
									"use": "以長條圖比較各遊戲類型的盈虧。"
								},
								{
									"name": "匯出 CSV／進階報表",
									"use": "匯出報表資料，或前往進階報表頁做更深入的分析。"
								}
							],
							"pageurl": "profile.html",
							"pagelabel": "前往個人報表"
						}
					]
				},
				{
					"id": "series",
					"title": "系列賽",
					"lead": "系列賽可以把多個場次歸成一包，做跨場次的彙總統計與選手排行榜，適合一連串相關賽事（例如週賽、月賽或一檔錦標賽系列）。你不必逐場手動加總，就能看到整個系列的總盈虧與名次。系列賽只整理你自己的場次，不會更動各場次本身的設定與結算。",
					"items": [
						{
							"id": "series-create",
							"title": "建立與管理系列賽",
							"desc": "從導覽列的「系列賽」進入系列賽管理頁，可以建立新的系列賽、設定排名依據，並查看每個系列賽的場次數與總盈虧。系列賽是個人層級的彙整工具，只會收錄你自己建立的場次。",
							"steps": [
								"從上方導覽列（手機版為底部導覽列）點「系列賽」進入系列賽管理頁。",
								"點「新增系列賽」，填寫系列賽名稱（必填），可再填說明、開始與結束日期。",
								"在「排名依據」選擇盈虧、名次或積分，決定排行榜的排序方式。",
								"視需要開啟「私人系列賽」，建立後即可在列表看到場次數與總盈虧等彙總。"
							],
							"tip": "刪除系列賽只會解除這個分組，底下的場次本身不會被刪除，可以放心整理。",
							"tools": [
								{
									"name": "新增系列賽",
									"use": "建立一個新的系列賽，填名稱、說明、起訖日期與排名依據。"
								},
								{
									"name": "排名依據",
									"use": "選擇盈虧（比總盈虧）、名次（比最佳名次）或積分（比擊敗人數），決定排行榜排序。"
								},
								{
									"name": "私人系列賽",
									"use": "標記為私人，作為個人整理用途。"
								},
								{
									"name": "編輯／刪除",
									"use": "修改系列賽資料，或刪除分組（不會刪除底下場次）。"
								}
							],
							"pageurl": "serieslist.html",
							"pagelabel": "前往系列賽"
						},
						{
							"id": "series-sessions",
							"title": "加入場次與彙總統計",
							"desc": "進入某個系列賽後，可以管理它收錄哪些場次，系統會即時把這些場次的盈虧、買入與獎金加總起來。只有你自己的場次可以被加入。",
							"steps": [
								"在系列賽列表點任一系列賽進入詳情頁。",
								"點「管理場次」，用名稱或代碼搜尋你自己的場次。",
								"對要納入的場次點「加入」、要移除的點「移除」，完成後儲存。",
								"回到「總覽」即可看到場次數、總盈虧、總買入與總獎金等彙總數字。"
							],
							"tip": "也可以從場次詳情頁的「加入系列賽」區塊，直接把當前場次掛進某個系列賽，不必回到系列賽頁。",
							"tools": [
								{
									"name": "管理場次",
									"use": "搜尋並勾選要納入此系列賽的場次，可調整順序與移除。"
								},
								{
									"name": "總覽彙總",
									"use": "顯示場次數、總盈虧、總買入與總獎金。"
								},
								{
									"name": "場次詳情：加入系列賽",
									"use": "在場次詳情頁直接把這個場次加入你的某個系列賽。"
								}
							],
							"pageurl": "serieslist.html",
							"pagelabel": "前往系列賽"
						},
						{
							"id": "series-leaderboard",
							"title": "選手排行榜",
							"desc": "系列賽詳情的「排行榜」會跨系列底下的「主辦場次」，把每位已報到選手的成績彙整成排名，依你設定的排名依據排序，適合長期賽季或會員積分賽。",
							"steps": [
								"進入系列賽詳情，切到「排行榜」頁籤。",
								"系統會彙整各主辦場次中狀態為已確認／已晉級的選手。",
								"依排名依據（盈虧／名次／積分）查看排名、參賽場次、總獎金、盈虧、最佳名次與進錢次數。",
								"想改變排序時，回系列賽設定調整「排名依據」即可。"
							],
							"tip": "排行榜只統計「主辦場次」中已報到的選手；純個人成績補登的場次不會出現在排行榜，但仍會計入總覽的盈虧彙總。",
							"tools": [
								{
									"name": "排行榜頁籤",
									"use": "顯示選手排名、參賽場次、總獎金、總買入、盈虧、最佳名次與進錢次數。"
								},
								{
									"name": "積分制",
									"use": "以「擊敗人數」累積積分：每場積分＝該場總人次−名次，名次越前、人數越多分數越高。"
								},
								{
									"name": "名次制／盈虧制",
									"use": "名次制比最佳名次（越小越前）；盈虧制比總盈虧（越高越前）。"
								}
							],
							"pageurl": "serieslist.html",
							"pagelabel": "前往系列賽"
						},
						{
							"id": "series-batch",
							"title": "批量建立多日賽",
							"desc": "批量建立多日賽是一個五步驟精靈，填一次設定就能一鍵建好整棵晉級樹（例如 8 場 Day1 → 2 場 Day2 → 決賽）的所有場次，場次之間自動以多日賽晉級關聯串接，並自動包成系列賽。",
							"steps": [
								"在系列賽詳情頁點「批量建立多日賽」（或直接開啟 batchcreate.html）。",
								"步驟 1「基本設定」填協會、開始日期與賽事類型；步驟 2「買入結構」填買入、手續費、起始碼與重買／重入／加買。",
								"步驟 3「盲注結構」可貼上文字用「讀取 / 解析」自動轉成結構，或上傳 JSON 檔。",
								"步驟 4「賽制 / 晉級樹」用快速範本（3→1、5→1、6→1、8→2→1）或自訂每層場次數與時間；步驟 5「預覽」確認後點「建立全部」。"
							],
							"tip": "頁面頂部的「儲存設定 JSON」可把整份精靈設定存成檔案，下次「載入設定 JSON」即可重用，適合每週固定賽程。",
							"tools": [
								{
									"name": "快速範本",
									"use": "一鍵套用 3→1、5→1、6→1、8→2→1 等常見晉級樹。"
								},
								{
									"name": "盲注結構解析",
									"use": "貼上其他網站複製的賽程文字自動解析，或上傳 JSON。"
								},
								{
									"name": "設定 JSON 存取",
									"use": "儲存／載入整份精靈設定，重複賽程免重填。"
								}
							],
							"pageurl": "batchcreate.html",
							"pagelabel": "前往批量建立"
						}
					]
				},
				{
					"id": "broadcast",
					"title": "轉播與回放",
					"lead": "現場轉播讓場外觀眾即時觀看公開場次的手牌紀錄：主辦在場內照常記錄，觀眾端只會看到已放行的手牌，並可設定延遲播出與底牌遮罩。手牌詳情頁另提供動畫回放，把整手牌從發牌到派彩逐步重演，適合賽後檢討與分享。",
					"items": [
						{
							"id": "broadcast-open",
							"title": "開啟現場轉播與觀眾端",
							"desc": "只有「統一手牌紀錄＋公開」的主辦場次可以轉播。開啟後場次手牌分頁會出現「現場轉播」按鈕，任何人（免登入）都可用該連結唯讀觀看最新一手與近期手牌，透過 WebSocket 即時同步。",
							"steps": [
								"到場次詳情「其他 → 設定」，先確認已勾選「統一紀錄手牌」。",
								"在「現場轉播」設定區開啟「開放場外轉播」，視需要設定「顯示底牌」、「延遲播出(分鐘)」與「H4H 手動推進」。",
								"回到「手牌」分頁點「現場轉播」，即可把唯讀觀看連結分享給場外觀眾。",
								"觀眾端右上可切換 BB 單位與牌面樣式（經典藍／緋紅／午夜綠）。"
							],
							"tip": "僅「統一手牌紀錄＋主辦制＋開放連結＋非私人」的場次可轉播；不符合條件時觀眾端會顯示未開放提示。",
							"tools": [
								{
									"name": "延遲播出",
									"use": "設定分鐘數，場外畫面延後顯示，防止即時資訊影響賽事。"
								},
								{
									"name": "底牌遮罩",
									"use": "關閉「顯示底牌」後觀眾只看得到動作與公共牌。"
								},
								{
									"name": "連線狀態",
									"use": "觀眾端顯示 LIVE 燈號，斷線會自動重連並每 15 秒輪詢。"
								}
							],
							"pageurl": "session.html",
							"pagelabel": "前往場次詳情"
						},
						{
							"id": "broadcast-h4h",
							"title": "H4H 逐手放行控制",
							"desc": "H4H（hand-for-hand 式手動推進）讓裁判逐手控制轉播節奏：場內即時記錄，場外只看到已放行的手牌。適合決賽桌或需要嚴格控管資訊的賽事。",
							"steps": [
								"在場次設定的「現場轉播」區開啟「H4H 手動推進」（開啟當下既有手牌視為已放行）。",
								"由場次頁點「轉播控制」進入 H4H 控制台，查看「已放行／待放行／總手數」。",
								"每記錄完一手，點「▶ 推進下一手」放行給觀眾端；點錯可「退回一手」。",
								"賽事結束或不需控管時點「全部放行 →」一次放行所有手牌。"
							],
							"tip": "轉播控制台限場次擁有者與受聘的裁判／助理／發牌員操作；觀眾端會即時收到放行事件自動更新。",
							"tools": [
								{
									"name": "推進下一手",
									"use": "放行下一手給觀眾端。"
								},
								{
									"name": "退回一手",
									"use": "收回最近放行的一手。"
								},
								{
									"name": "全部放行",
									"use": "確認後一次放行所有待放行手牌。"
								}
							],
							"pageurl": "session.html",
							"pagelabel": "前往場次詳情"
						},
						{
							"id": "broadcast-replay",
							"title": "手牌動畫回放",
							"desc": "手牌詳情頁的「▶ 動畫回放」把整手牌在橢圓牌桌上逐步重演：發牌、各街下注、翻公共牌、攤牌到派彩，全押時並顯示各家勝率與補牌，適合賽後檢討。",
							"steps": [
								"開啟任一手牌的手牌詳情頁，點「▶ 動畫回放」（一般手牌且有座位資料才會顯示）。",
								"用播放／暫停、上一步／下一步或拖曳時間軸控制進度；速度可選 0.5×～4×。",
								"視需要勾選「顯示所有底牌」、「底池計分牌」或「BB」（金額改以大盲為單位）。",
								"鍵盤左右鍵切幀、空白鍵播放暫停、Esc 關閉；長按牌桌可換牌背樣式。"
							],
							"tip": "回放與現場轉播共用牌背樣式設定（經典藍／緋紅／午夜綠），全押勝率由後端即時計算。",
							"tools": [
								{
									"name": "時間軸",
									"use": "拖曳跳到任一步；長按牌桌後左右拖曳也可捲動。"
								},
								{
									"name": "速度",
									"use": "0.5×／1×／2×／4× 播放速度。"
								},
								{
									"name": "顯示所有底牌",
									"use": "預設只亮 Hero 與攤牌者，勾選後全亮。"
								}
							],
							"pageurl": "handdetail.html",
							"pagelabel": "前往手牌詳情"
						}
					]
				},
				{
					"id": "staff",
					"title": "聘用人員與權限",
					"lead": "PokerTrace 的帳號分為選手（player）、發牌員（dealer）、裁判（floor）與助理（assistant）四種類型。主辦者可以在個人資料聘用人員，受邀者透過邀請信確認後，就會看到相關場次並依角色取得對應的操作權限。先弄懂角色分工，再建立聘用關聯，現場分工會更順暢。",
					"items": [
						{
							"id": "staff-roles",
							"title": "角色與權限總覽",
							"desc": "每種角色能做的事不同。聘用人員可以看到並編輯受聘的相關場次，但不能刪除或複製場次，這些場次也不會計入他自己的盈虧統計；計時器只開放給裁判與助理操作，發牌員專注在手牌紀錄。",
							"steps": [
								"確認自己的帳號類型：選手、發牌員、裁判或助理。",
								"選手（主辦者）對自己的場次有完整操作權限。",
								"裁判與助理可操作計時器控制端；發牌員不可操作計時器。",
								"受聘場次會標示「已聘用」，且不計入聘用人員自己的盈虧報表。"
							],
							"tip": "前端按鈕顯示只是輔助，實際權限由後端檢查；看不到某功能時，先確認自己的角色與聘用狀態。",
							"tools": [
								{
									"name": "選手（player）",
									"use": "可建立並主辦場次，是場次擁有者，也可聘用其他人員。"
								},
								{
									"name": "發牌員（dealer）",
									"use": "負責手牌紀錄與現場資料輸入，不可操作計時器。"
								},
								{
									"name": "裁判（floor）",
									"use": "可操作計時器與現場賽務，負責控場與裁決。"
								},
								{
									"name": "助理（assistant）",
									"use": "與裁判同樣可操作計時器，協助現場庶務。"
								}
							],
							"pageurl": "profile.html",
							"pagelabel": "前往個人資料"
						},
						{
							"id": "staff-hire",
							"title": "在個人資料聘用人員",
							"desc": "主辦者的個人資料有「聘用關聯」區，分成發牌員、裁判、助理三張卡片，各自顯示目前人數。輸入對方的使用者 ID（P- 開頭）送出邀請，對方確認後就會納入你的全域人員名單。",
							"steps": [
								"進入個人資料，捲動到「聘用關聯」區。",
								"在發牌員／裁判／助理卡片點「管理」開啟名單視窗。",
								"輸入對方的使用者 ID（例如 P-00099）後點「新增」送出邀請。",
								"對方確認前狀態顯示「待確認」，確認後轉為「啟用」；不再合作時可按「移除」。"
							],
							"tip": "使用者 ID 可請對方到個人資料的基本資料區查看；聘用邀請是輸入 ID，不是掃碼。",
							"tools": [
								{
									"name": "員工卡片",
									"use": "發牌員／裁判／助理三張卡各顯示人數與「管理」按鈕。"
								},
								{
									"name": "名單視窗",
									"use": "顯示已聘用與待確認名單，可新增或移除人員。"
								},
								{
									"name": "待確認狀態",
									"use": "邀請送出後顯示待確認，等對方點信件連結完成確認。"
								}
							],
							"pageurl": "profile.html",
							"pagelabel": "前往聘用管理"
						},
						{
							"id": "staff-verify",
							"title": "受邀者確認邀請",
							"desc": "聘用邀請會寄出確認信給受邀者，點開信中連結會進入員工邀請確認頁，系統自動驗證後顯示結果。確認成功後就正式加入該主辦（或該場次）的人員名單。",
							"steps": [
								"收到邀請信後，點擊信中的確認連結。",
								"頁面會自動驗證，成功時顯示「確認成功」。",
								"若先前已確認過，會顯示「已確認過」。",
								"連結無效或已過期時顯示「驗證失敗」，請主辦者重新發送邀請。"
							],
							"tip": "確認頁從信件連結進入即可完成，不需先登入；確認後登入就能在個人資料看到聘用關聯。",
							"tools": [
								{
									"name": "前往登入",
									"use": "確認成功後點擊即可登入開始工作。"
								},
								{
									"name": "逾時提醒",
									"use": "驗證逾時會提示重試，請確認網路後重新開啟連結。"
								}
							],
							"pageurl": "signin.html",
							"pagelabel": "前往登入"
						},
						{
							"id": "staff-worker",
							"title": "受聘人員的日常視角",
							"desc": "受聘人員登入後，主儀表板與個人資料會依角色調整內容：個人資料顯示你受哪些主辦聘用，場次列表列出相關場次並標示「已聘用」，這些場次的成績不會計入你自己的盈虧。",
							"steps": [
								"登入後在個人資料查看「聘用關聯」，確認受聘的主辦與角色。",
								"到場次列表查看標示「已聘用」的相關場次。",
								"依角色開始工作：裁判／助理進控制端，發牌員進牌桌記錄手牌。",
								"個人報表只計入你以選手身分參加的場次。"
							],
							"tip": "已聘用場次可編輯但不可刪除或複製；需要調整場次設定時，請聯絡場次擁有者。",
							"tools": [
								{
									"name": "聘用關聯卡",
									"use": "顯示聘用你的主辦名稱、編號與你的角色徽章。"
								},
								{
									"name": "已聘用標示",
									"use": "場次列表以徽章標出受聘場次，並隱藏個人買入與盈虧。"
								},
								{
									"name": "建議下一步",
									"use": "主儀表板依角色給出計時器或手牌紀錄等入口。"
								}
							],
							"pageurl": "sessionlist.html",
							"pagelabel": "前往場次列表"
						}
					]
				},
				{
					"id": "checkin",
					"title": "現場報到與收據",
					"lead": "報名工作台是現場報到的指揮中心：批次確認、排座與晉級都在這裡完成；搭配掃描 QR 與報到核對頁，可以快速核對選手身分並列印收據。這一章整理從報名名單到收據列印的完整現場流程。",
					"items": [
						{
							"id": "checkin-register",
							"title": "報名工作台批次操作",
							"desc": "報名清單頁集中管理單一場次的所有報名，上方四格統計即時顯示已報名、已確認、已取消與總計分牌數，並提供批次確認、排座、晉級與 Reentry 等工具列操作，名單會即時同步更新。",
							"steps": [
								"從場次詳情進入報名清單（報名工作台）。",
								"搜尋或新增選手，選擇現金或票券入場。",
								"勾選多位選手後用工具列批次「確認」，再進行排座。",
								"現場再處理 Reentry／Rebuy／Addon、晉級與收益修正，最後可匯出 CSV 或列印名單。"
							],
							"tip": "報名狀態以顏色區分：已報名（黃）、已確認（綠）、已晉級（藍）、已取消（灰）；批次操作後記得查看結果摘要。",
							"tools": [
								{
									"name": "統計四格",
									"use": "已報名／已確認／已取消／總計分牌數一目了然。"
								},
								{
									"name": "批次工具列",
									"use": "勾選選手後批次確認、排座（補未入座／重排／平均）、晉級。"
								},
								{
									"name": "單筆操作",
									"use": "每列可處理 Reentry／Rebuy／Addon、取消、收益修正與列印收據。"
								},
								{
									"name": "操作說明摺疊區",
									"use": "頁面內建操作說明、狀態說明與新手引導三欄，可隨時展開查閱。"
								},
								{
									"name": "匯出與列印",
									"use": "「匯出 CSV」與「列印名單」保存賽後資料。"
								}
							],
							"pageurl": "session.html",
							"pagelabel": "前往場次詳情"
						},
						{
							"id": "checkin-scan",
							"title": "掃描收據 QR",
							"desc": "掃碼頁使用瀏覽器內建的條碼辨識與相機，把選手收據上的 QR 對準畫面就會自動開啟該筆報到核對頁；相機無法使用時也能手動輸入報名編號查詢。",
							"steps": [
								"在報名清單右上點「掃描 QR」開啟掃碼頁。",
								"將收據 QR 對準畫面中的綠色對準框。",
								"辨識成功後自動跳轉到該筆報到核對頁。",
								"相機不能用時，改在下方輸入報名編號後點「查詢」。"
							],
							"tip": "掃碼使用瀏覽器內建辨識，不需安裝任何 App；沒有相機權限時會顯示警告並保留手動查詢。",
							"tools": [
								{
									"name": "相機預覽",
									"use": "即時顯示相機畫面與綠色對準框。"
								},
								{
									"name": "重新啟動相機",
									"use": "相機中斷時重新取得畫面。"
								},
								{
									"name": "手動備援",
									"use": "輸入收據上的報名編號直接查詢該筆報到。"
								}
							],
							"pageurl": "scan.html",
							"pagelabel": "前往掃碼頁"
						},
						{
							"id": "checkin-verify",
							"title": "報到核對與獎金收據",
							"desc": "報到核對頁顯示該筆報名的完整資訊：場次、選手、狀態、入場編號、牌桌座位與買入結構，供現場人員快速核對身分；具發放權限時還能直接列印獎金收據。",
							"steps": [
								"掃描收據 QR 或輸入報名編號進入報到核對頁。",
								"核對選手名稱、選手 ID、狀態徽章與入場編號。",
								"確認牌桌、座位、買入（現金／票券）與 Reentry 是否一致。",
								"具權限的人員可對有獎金的選手點「列印獎金收據」。"
							],
							"tip": "收據採 80mm 四聯單版面（店家／選手／發牌／桌面聯），使用熱感式印表機列印。",
							"tools": [
								{
									"name": "核對卡",
									"use": "顯示系列賽／場次名、狀態徽章與選手資訊。"
								},
								{
									"name": "列印獎金收據",
									"use": "僅具發放權限且該選手有獎金時顯示。"
								},
								{
									"name": "場次詳情",
									"use": "一鍵回到該場次的詳情頁繼續其他作業。"
								}
							],
							"pageurl": "scan.html",
							"pagelabel": "前往掃碼頁"
						}
					]
				},
				{
					"id": "livetools",
					"title": "現場牌桌工具",
					"lead": "除了牌桌詳情，現場還有三個常用的牌桌輔助頁：多牌桌總覽用來掌握各桌人數並自動平衡入座；快速手牌讓你不綁定場次流程也能記錄單手牌；計分牌校正把各座位碼量更新到實際狀態。三者都從場次或牌桌頁進入。",
					"items": [
						{
							"id": "livetools-tableboard",
							"title": "多牌桌總覽與自動平衡",
							"desc": "多牌桌總覽把場次內所有牌桌以卡片並列，顯示每桌座位占用與選手碼量，並定時自動刷新；人數不均時會給出平衡建議，主辦可一鍵自動平衡入座。",
							"steps": [
								"從場次詳情（或控制端的並桌提醒）進入多牌桌總覽。",
								"查看牌桌、在場選手與平均每桌三格統計。",
								"依平衡建議（偏多／偏少）決定是否調整。",
								"點「自動平衡入座」並確認，系統會自動把選手平均分配到各桌。"
							],
							"tip": "控制端的「並桌提醒」會在人數可以收桌時提示建議掉桌數，點擊即可跳到多牌桌總覽操作。",
							"tools": [
								{
									"name": "統計三格",
									"use": "顯示牌桌數、在場選手與平均每桌人數。"
								},
								{
									"name": "牌桌卡片",
									"use": "顯示占用／最大座位、空位數與每位選手碼量。"
								},
								{
									"name": "徽章提示",
									"use": "「可併桌（無人）」與「人數不均」標記需要處理的牌桌。"
								},
								{
									"name": "自動平衡入座",
									"use": "確認後自動把可調整的選手平均分配到各桌。"
								}
							],
							"pageurl": "session.html",
							"pagelabel": "前往場次詳情"
						},
						{
							"id": "livetools-quickhand",
							"title": "快速手牌紀錄",
							"desc": "快速手牌與正式手牌編輯共用同一套三步驟流程，但記錄的是一手獨立牌局：可自由設定遊戲類型、盲注與座位，不與場次其他手牌連動，適合臨時記錄或單獨留存精彩手牌。",
							"steps": [
								"從牌桌頁開啟快速手牌。",
								"步驟一設定位置與盲注、Dealer、Hero 與各座位碼量。",
								"步驟二依序記錄行動、公共牌與攤牌結果。",
								"步驟三檢查警告與摘要後送出，可連續「送出，並新增下手牌」。"
							],
							"tip": "快速手牌日後仍可自由編輯，不影響其他手牌的計分牌銜接。",
							"tools": [
								{
									"name": "三步導覽",
									"use": "位置資訊→紀錄手牌→檢查送出，與正式手牌編輯相同。"
								},
								{
									"name": "清空暫存",
									"use": "放棄尚未儲存的輸入，重新開始記錄。"
								},
								{
									"name": "Timebank",
									"use": "下注管理內可對當前行動者開始、暫停或重設倒數。"
								}
							],
							"pageurl": "table.html",
							"pagelabel": "前往牌桌詳情"
						},
						{
							"id": "livetools-stackadjust",
							"title": "計分牌校正",
							"desc": "計分牌校正把牌桌上每個座位的碼量增減記錄成一筆特殊紀錄，下一手會直接承接校正後的碼量。校正需選擇原因並填寫備註，方便日後追查每次調整的來由。",
							"steps": [
								"從牌桌頁點「計分牌校正」進入。",
								"選擇校正原因：現場點數校正、換色 Race off、罰碼補碼、座位資料修正或其他。",
								"對每個座位輸入增減量，狀態列會即時顯示總增減與場上總碼量變化。",
								"填寫備註後點「儲存校正」，完成後回到牌桌頁。"
							],
							"tip": "只有最新一筆校正可以修改碼量；編輯較舊的校正時碼量會鎖定，僅能修改備註。",
							"tools": [
								{
									"name": "校正原因",
									"use": "下拉選擇本次調整的原因分類。"
								},
								{
									"name": "座位增減卡",
									"use": "顯示目前計分牌與校正後結果，可輸入正負增減值。"
								},
								{
									"name": "狀態列",
									"use": "即時顯示總增減與場上總碼量的變化前後值。"
								}
							],
							"pageurl": "table.html",
							"pagelabel": "前往牌桌詳情"
						}
					]
				},
				{
					"id": "toolcenter",
					"title": "工具中心",
					"lead": "工具中心收錄數十個免費撲克小工具，從現場賽務（座位抽籤、收款對帳）、計分牌計算、獎金分配到策略學習一應俱全，全部免登入即可使用。可搜尋、依分類篩選，並把常用工具加入最愛。",
					"items": [
						{
							"id": "toolcenter-browse",
							"title": "瀏覽與搜尋工具",
							"desc": "工具總覽以卡片列出所有工具，上方提供關鍵字搜尋與分類籤，分類涵蓋現場、計分牌、獎金、策略、營運、學習與開發；點卡片即可開啟工具，系統會自動記錄最近使用。",
							"steps": [
								"從個人資料「查看全部工具」或首頁進入工具總覽。",
								"輸入關鍵字（例如 ICM、座位、計分牌）搜尋工具。",
								"或用分類籤（全部／最近／最愛／常用／現場／計分牌／獎金／策略／營運／學習／開發）篩選。",
								"點工具卡開啟；常用的按「加入最愛」，之後在「最愛」分類快速找到。"
							],
							"tip": "工具全部免登入、無廣告；卡片標示「維護中」的工具尚未開放，會陸續上線。",
							"tools": [
								{
									"name": "搜尋框",
									"use": "以關鍵字即時過濾工具清單。"
								},
								{
									"name": "分類籤",
									"use": "依用途切換分類，並顯示各分類的工具數量。"
								},
								{
									"name": "最愛／最近",
									"use": "收藏常用工具，並自動記錄最近開啟的工具。"
								}
							],
							"pageurl": "toollist.html",
							"pagelabel": "前往工具總覽"
						},
						{
							"id": "toolcenter-featured",
							"title": "代表性工具",
							"desc": "工具中心的內容持續擴充，目前已開放的代表性工具包括勝率解算器、盲注結構產生器、TDA 規則手冊與公開 API 文件，其餘工具會依維護進度陸續開放。",
							"steps": [
								"勝率解算器：輸入各家手牌與公共牌，計算勝率（equity）。",
								"結構產生器：依人數與目標時長自動產生盲注結構。",
								"TDA 規則手冊：查閱錦標賽裁決常用的 TDA 規則。",
								"公開 API 文件：查詢 PokerTrace 全部 API 端點的說明與範例。"
							],
							"tip": "公開 API 文件列出所有 JSON 端點與授權方式，想自行串接資料的開發者可從這裡開始。",
							"tools": [
								{
									"name": "勝率解算器",
									"use": "現場快速計算牌力對比與勝率。"
								},
								{
									"name": "結構產生器",
									"use": "產生可直接匯入場次的盲注結構。"
								},
								{
									"name": "TDA 規則手冊",
									"use": "現場裁決時快速查閱規則條文。"
								},
								{
									"name": "公開 API 文件",
									"use": "開發者串接 PokerTrace 資料的入口文件。"
								}
							],
							"pageurl": "toollist.html",
							"pagelabel": "前往工具總覽"
						}
					]
				},
				{
					"id": "account",
					"title": "帳號與其他功能",
					"lead": "除了賽事流程，PokerTrace 還提供幾個帳號層級的輔助功能：通知中心集中站內訊息、協會管理維護你常用的撲克協會、進階報表以圖表呈現收益趨勢、聯絡我們則負責回報問題與建議。",
					"items": [
						{
							"id": "account-notification",
							"title": "通知中心",
							"desc": "通知中心列出所有站內通知，未讀會以綠點標示。支援關鍵字搜尋、調整每頁筆數與分頁瀏覽，可逐則標為已讀、刪除，或一鍵全部已讀。",
							"steps": [
								"從導覽列點「通知」進入通知中心。",
								"未讀通知有綠點與「未讀」標籤，點「標為已讀」處理。",
								"需要時輸入關鍵字搜尋標題或內容。",
								"用「全部已讀」一次清空未讀，或刪除不需要的通知。"
							],
							"tip": "聘用邀請、場次相關事件等都會發送通知，建議定期查看避免漏掉待處理事項。",
							"tools": [
								{
									"name": "搜尋列",
									"use": "搜尋標題或內容，並可調整每頁 10～100 筆。"
								},
								{
									"name": "標為已讀／刪除",
									"use": "逐則處理通知，刪除前會先確認。"
								},
								{
									"name": "全部已讀",
									"use": "一鍵把所有未讀通知標為已讀。"
								}
							],
							"pageurl": "notification.html",
							"pagelabel": "前往通知中心"
						},
						{
							"id": "account-club",
							"title": "協會管理",
							"desc": "協會管理維護你名下的撲克協會（俱樂部）清單，包含名稱、地址與註解；地址會自動連到 Google Maps，方便選手辨識舉辦單位與地點。",
							"steps": [
								"從導覽列點「協會」進入協會管理。",
								"點「新增協會」填寫名稱與地址（必填）及註解。",
								"用搜尋框以名稱、地址或註解快速過濾。",
								"對既有協會執行編輯或刪除。"
							],
							"tip": "協會統計區顯示總協會數與目前顯示數量，清單過長時善用搜尋。",
							"tools": [
								{
									"name": "新增協會",
									"use": "填寫協會名稱、地址與註解建立資料。"
								},
								{
									"name": "地址連結",
									"use": "點地址直接開啟 Google Maps 查看位置。"
								},
								{
									"name": "編輯／刪除",
									"use": "維護既有協會資料，刪除前會先確認。"
								}
							],
							"pageurl": "clublist.html",
							"pagelabel": "前往協會管理"
						},
						{
							"id": "account-benefit",
							"title": "進階報表",
							"desc": "進階報表以折線圖呈現指定日期區間的累積收益趨勢，預設顯示近 30 天。統計只計入你以選手身分參加的場次，主辦與受聘場次不會影響曲線。",
							"steps": [
								"從個人資料點「前往進階報表」。",
								"設定開始與結束日期後點「查詢」。",
								"查看查詢區間、累積收益與日期筆數三格摘要。",
								"觀察折線圖判讀收益趨勢；點「重置」回到近 30 天。"
							],
							"tip": "累積收益為正時以綠色顯示、為負時紅色，趨勢圖適合檢視一段期間的整體表現。",
							"tools": [
								{
									"name": "日期篩選",
									"use": "自訂起訖日期，查詢任意區間的收益。"
								},
								{
									"name": "摘要三格",
									"use": "顯示查詢區間、累積收益與日期筆數。"
								},
								{
									"name": "趨勢圖",
									"use": "按日累積的收益折線圖，滑鼠懸停可看單日數值。"
								}
							],
							"pageurl": "benefit.html",
							"pagelabel": "前往進階報表"
						},
						{
							"id": "account-contact",
							"title": "聯絡我們",
							"desc": "功能建議、錯誤回報或合作詢問都可以透過聯絡我們表單送出。已登入時會自動帶入姓名與 Email，填寫主旨與內容送出即可，訊息會直接進入後台由管理者處理。",
							"steps": [
								"從頁尾「聯絡我們」或首頁進入表單。",
								"確認姓名與 Email（登入時自動帶入）。",
								"填寫主旨與內容（最多 3000 字）。",
								"點「送出訊息」，成功後表單會自動清空。"
							],
							"tip": "在個人資料開啟「搖一搖回報問題」後，手機搖一搖就會彈出聯絡視窗，現場遇到問題可即時回報。",
							"tools": [
								{
									"name": "自動帶入",
									"use": "登入狀態下自動填入你的姓名與 Email。"
								},
								{
									"name": "內容驗證",
									"use": "姓名、Email 格式與內容為必填，送出前會檢查。"
								},
								{
									"name": "搖一搖回報",
									"use": "偏好設定開啟後，搖動手機即可快速開啟回報視窗。"
								}
							],
							"pageurl": "contact.html",
							"pagelabel": "前往聯絡我們"
						}
					]
				}
			]
		},
		"tablepage": {
			"title": "桌次詳情",
			"heading": "桌次詳情",
			"back": "上一頁",
			"guidekicker": "對應操作說明",
			"guidedesc": "牌桌頁最常處理座位事件流、手牌與統計，可直接跳回座位與手牌說明段落。",
			"guideseat": "座位流程說明",
			"guidehand": "手牌紀錄說明",
			"taboverview": "總覽",
			"tabplayers": "選手",
			"tabhands": "手牌",
			"tabstats": "統計",
			"tabev": "EV圖",
			"overviewhandsummary": "手牌摘要",
			"descriptiontitle": "備註",
			"maxseat": "最大座位數：",
			"seat6": "6人桌",
			"seat8": "8人桌",
			"seat9": "9人桌",
			"seat10": "10人桌",
			"seatn": "{n}人桌",
			"firstdealer": "第一莊家：",
			"selfseat": "本人座位：",
			"save": "儲存",
			"currentseat": "目前座位",
			"mergetablearia": "選擇要併入的目標牌桌",
			"merge": "併到指定桌",
			"saveplayers": "儲存座位",
			"seat": "座位",
			"history": "事件流",
			"seatnote": "* 每個座位可多次入座/換人/重新買入/離席，完整記錄事件歷史，支援錦標賽換桌與補位。",
			"handrecord": "手牌紀錄",
			"newhand": "新增手牌",
			"stackadjust": "計分牌校正",
			"filterplayeraria": "依選手 ID 篩選手牌",
			"filterplayerplaceholder": "選手 ID",
			"filterseataria": "依座位篩選手牌",
			"filterseatplaceholder": "座位",
			"filterfromaria": "篩選起始日期",
			"filtertoaria": "篩選結束日期",
			"filterclear": "清除",
			"table": "牌桌",
			"player": "選手",
			"blind": "盲注",
			"hand": "手牌",
			"result": "結果",
			"createinfo": "建立資訊",
			"action": "操作",
			"stats": "統計數據",
			"evtitle": "計分牌變化圖",
			"evdesc": "目前以實際手牌結果累積，左側為最舊手牌、右側為最新手牌。",
			"unknown": "未知",
			"currentplayers": "目前選手",
			"linkedplayernote": "使用已確認報名名單，手牌紀錄可持續關聯到實際帳號。",
			"genericplayernote": "一般紀錄模式，可直接輸入選手名稱。",
			"emptyseat": "空位",
			"othertable": "其他牌桌",
			"playernameplaceholder": "選手名稱",
			"unknownstack": "未知計分牌",
			"clearseat": "清空",
			"bustseat": "淘汰",
			"moveseat": "換桌",
			"moveplaceholder": "換桌...",
			"selecttargettable": "選擇目標牌桌",
			"selecttargettableerror": "請選擇目標牌桌",
			"targettable": "目標牌桌",
			"mergeconfirm": "確定要把本桌所有選手併到「{table}」嗎？併桌後本桌座位會清空。",
			"mergesuccess": "已完成併桌",
			"mergefail": "併桌失敗",
			"thisplayer": "此選手",
			"bustconfirm": "確定淘汰座位 {seat}「{player}」嗎？選手會從本桌移除。",
			"bustsuccess": "已淘汰選手",
			"bustfail": "淘汰失敗",
			"movesuccess": "已移動選手",
			"movefail": "移動失敗",
			"noseats": "尚無座位",
			"startchip": "起始計分牌",
			"time": "時間",
			"place": "地點",
			"nodescription": "<i>無備註</i>",
			"handcount": "手牌數",
			"netprofit": "淨利",
			"winrate": "勝率",
			"allincount": "All-in 手數",
			"profit": "盈虧",
			"sessionnotfound": "查無指定場次",
			"savesuccess": "已儲存",
			"savefail": "儲存失敗",
			"saving": "儲存中...",
			"edit": "編輯",
			"delete": "刪除",
			"nohands": "尚無手牌",
			"sorttime": "時間",
			"deletehandconfirm": "確定刪除這手牌嗎？",
			"deletehandconfirmdetail": "此動作無法復原。",
			"deletesuccess": "已刪除",
			"deletefail": "刪除失敗",
			"loadhandfail": "讀取手牌失敗",
			"displayrange": "顯示",
			"prev": "上一頁",
			"next": "下一頁"
		},
		"newtablepage": {
			"rangeerror": "請輸入正確的牌桌編號範圍",
			"rangelimit": "一次最多新增 100 個牌桌",
			"tablenorequired": "請輸入牌桌編號",
			"addsuccess": "新增成功",
			"unknownerror": "未知錯誤",
			"sessionnotfound": "查無指定場次"
		},
		"edittablepage": {
			"tablenotfound": "查無指定牌桌",
			"tablenorequired": "請輸入牌桌編號",
			"editsuccess": "修改成功",
			"unknownerror": "未知錯誤"
		},
		"tableboardpage": {
			"title": "多牌桌總覽",
			"back": "回場次",
			"refresh": "重新整理",
			"autobalance": "自動平衡入座",
			"tables": "牌桌",
			"players": "在場選手",
			"avg": "平均每桌",
			"empty": "此場次尚無牌桌",
			"seatempty": "空位",
			"needmerge": "可併桌（無人）",
			"unbalanced": "人數不均",
			"hintprefix": "平衡建議：",
			"over": "偏多：",
			"under": "偏少：",
			"confirmbalance": "確定要自動把未入座／可調整的選手平衡到各桌嗎？",
			"balancedone": "已套用平衡",
			"balancefail": "平衡失敗",
			"nosession": "缺少場次 ID",
			"loadfail": "載入失敗",
			"noperm": "沒有權限檢視此看板"
		},
		"controlpage": {
			"title": "裁判控制台",
			"heading": "賽事控制台",
			"back": "返回上頁",
			"edittitle": "✎ 標題",
			"regbadgetitle": "點擊切換",
			"mainpause": "⏸ 暫停計時",
			"mainresume": "▶ 繼續計時",
			"timeadjust": "時間微調",
			"timeadjusthint": "適合泡泡圈快速調整",
			"setto": "設定為",
			"apply": "套用",
			"resettime": "↺ 重設本項時間",
			"enditem": "⏭ 立即結束本項",
			"levelcontrol": "關卡控制",
			"previtem": "◀ 上一項",
			"nextitem": "下一項 ▶",
			"jumptol": "跳到 L",
			"jumpplaceholder": "關卡編號",
			"jump": "跳轉",
			"jumphint": "輸入「關卡編號」(只算 Level，跳過休息)",
			"breakcontrol": "休息控制",
			"insertbreak": "☕ 立即插入休息",
			"endbreak": "⏹ 結束本次休息",
			"defaultduration": "預設時長",
			"minuteunit": "分鐘",
			"breakhint": "休息已是獨立項目，在「賽程結構」可任意位置加入或移除",
			"playermanage": "人數管理",
			"totalentries": "總入場",
			"avgchips": "平均碼量",
			"bust": " 淘汰",
			"addentry": "+ 加入",
			"manualedit": "手動編輯",
			"managelinkedplayers": "管理報名選手",
			"prizeitm": "獎池 / ITM",
			"cashprize": "現金總獎金",
			"auto": "自動計算",
			"manual": "手動修正",
			"manualamount": "手動金額",
			"itmsetting": "ITM 前圈設定",
			"pctmode": "百分比",
			"countmode": "直接指定人數",
			"itmpctaria": "ITM 前圈百分比",
			"count": "人數",
			"smartpayout": "✨ 智能分配獎金 (依 ITM 人數)",
			"rankpreview": "名次預覽",
			"editpayout": "⚙ 編輯名次/範圍/獎項",
			"otherreward": "其他獎勵",
			"quickpreset": "快速預設",
			"bubblemode": "🫧 泡泡圈模式",
			"handforhand": "🃏 同步發牌",
			"colorup": "🪙 計分牌汰換提示",
			"presethint1": "泡泡圈：暫停計時 + 廣播訊息",
			"presethint2": "同步發牌：自動暫停並標記為 hand-for-hand",
			"structuretitle": "賽程結構",
			"structurehint": "點擊跳轉",
			"viewstructure": "查看結構",
			"editstructure": "編輯結構",
			"marquee": "跑馬燈訊息",
			"marqueeplaceholder": "輸入跑馬燈內容，用 | 分隔多則訊息",
			"marqueearia": "跑馬燈訊息內容",
			"marqueereset": "↺ 預設文字",
			"marqueesave": "儲存並廣播",
			"syncok": "前台同步中",
			"syncretry": "連線重試中",
			"ready": "就緒",
			"settings": "⚙ 設定",
			"modaltitle": "編輯標題",
			"maintitle": "主標題",
			"subtitle": "副標題",
			"subtitleplaceholder": "例：主賽事",
			"save": "儲存",
			"modalplayers": "編輯人數",
			"remainingplayers": "剩餘人數",
			"startingchips": "起始計分牌",
			"modallinkedplayers": "關聯選手淘汰",
			"search": "搜尋",
			"playersearchplaceholder": "選手名稱 / ID",
			"table": "桌號",
			"tablesearchplaceholder": "桌名 / 桌號",
			"seat": "座位",
			"modalsettings": "設定",
			"buyin": "報名費",
			"fee": "服務費",
			"sessionfeehint": "報名費與服務費綁定場次資料，請到編輯場次調整。",
			"sound": "音效",
			"vibration": "震動",
			"autostart": "依照時間自動開始",
			"timebankdefault": "Timebank 預設秒數",
			"timebanksound": "Timebank 音效",
			"on": "開啟",
			"off": "關閉",
			"resetall": "⚠ 完全重置",
			"confirmtitle": "確認操作",
			"cancel": "取消",
			"confirm": "確認",
			"guide": "現場引導",
			"guidecollapse": "展開 / 收合",
			"guideheading1": "第一次使用先看這裡",
			"guideline1": "1. 先確認目前關卡、報名狀態與剩餘人數。",
			"guideline2": "2. 一般調整先用時間微調、休息控制與人數管理。",
			"guideline3": "3. 會改變整場狀態的動作，請到危險操作區再執行。",
			"guideheading2": "關鍵動作影響",
			"guideimpact1": "+1 入場 會改變總入場與獎池估算。",
			"guideimpact2": "REG 關閉 會直接影響報名工作台。",
			"guideimpact3": "智能分配獎金 會覆蓋目前 payout 設定。",
			"danger": "危險操作",
			"dangercopy": "這區的動作會直接影響整場狀態、報名或目前關卡。執行前請先確認現場是否真的需要。",
			"dangerenditem": "立即結束本項",
			"dangerregtoggle": "切換 REG 狀態",
			"dangerautoitm": "覆蓋獎金分配",
			"dangerreset": "完全重置控制台",
			"recentactions": "最近操作",
			"nohistory": "尚無操作紀錄",
			"runningstatus": "▶ 計時中",
			"pausedstatus": "⏸ 已暫停",
			"countdownstatus": "▶ 倒數中",
			"breakstage": "休息中",
			"regclosed": "已關閉",
			"regopen": "開放中",
			"prizesummarysuffix": " 名",
			"synchealthy": "同步正常",
			"reconnecting": "重連中",
			"unnamedplayer": "未命名選手",
			"noplayers": "沒有符合的選手",
			"stillin": "仍在場",
			"eliminated": "已淘汰",
			"restore": "復原",
			"handmode": "✋ 手數計算",
			"handlabel": "手數",
			"handcontroltitle": "手數控制",
			"handplus": "+1 手",
			"handminus": "−1 手",
			"handreset": "↺ 重設手數",
			"handhint": "此級別以手數計算，不倒數時間。到達目標手數後請按「下一項」換級。",
			"handtargetreached": "已達目標手數",
			"handactionprefix": "手數 ",
			"tablemanage": "牌桌管理",
			"tablecountlabel": "牌桌數",
			"tableseatedlabel": "在桌選手",
			"tableavglabel": "平均每桌",
			"tablemergetitle": "🪑 並桌提醒",
			"tablemergehintprefix": "剩 ",
			"tablemergehintmid1": " 人、共 ",
			"tablemergehintmid2": " 桌 — 可併至 ",
			"tablemergehintmid3": " 桌，建議掉 ",
			"tablemergehintsuffix": " 桌。點擊前往多牌桌總覽操作並桌。",
			"tablemergecandidates": "建議優先掉桌：",
			"tablemergejoin": "、",
			"tablemergetoast": "🪑 人數已可並桌，請確認掉桌",
			"tablemergenone": "目前無並桌需求",
			"tablenotables": "此場次尚未建立牌桌",
			"tableboardlink": "🪑 並桌 / 牌桌總覽",
			"reglistlink": "📋 報名清單",
			"tablelinkhint": "並桌與自動平衡到「牌桌總覽」操作；報名與座位詳情看「報名清單」。",
			"defaultmarquee": "⚠ 下一個級別將進行計分牌顏色汰換，請注意自身計分牌數量 | 歡迎參加本場賽事，祝各位選手順利晉級！ | 請留意主辦單位現場公告 | 請遵守賽場規則，保持良好競賽風格"
		},
		"structurepage": {
			"title": "賽程結構",
			"heading": "賽程結構",
			"back": "返回上一頁",
			"edit": "編輯結構",
			"sectiontitle": "賽程結構",
			"summarytitle": "摘要",
			"totalduration": "總時長",
			"loading": "讀取中",
			"ready": "就緒",
			"missingid": "缺少 sessionid 參數",
			"loadfail": "讀取失敗",
			"networkfail": "網路不佳，請重新嘗試",
			"syncok": "已同步",
			"syncloading": "讀取中",
			"syncfail": "讀取失敗",
			"syncnetwork": "網路不佳",
			"subtitledefault": "STRUCTURE VIEW",
			"regclosed": "REG CLOSED",
			"regopen": "REG OPEN",
			"break": "休息",
			"breaktime": "休息時間",
			"chiprace": "換籌",
			"starttime": "開始",
			"regcloseprefix": "報名關閉點：",
			"regclosesuffix": " 結束時自動關閉",
			"regclosenone": "尚未設定自動報名關閉點"
		},
		"structureeditpage": {
			"title": "編輯賽程結構",
			"heading": "編輯賽程結構",
			"back": "返回上一頁",
			"view": "查看結構",
			"save": "儲存結構",
			"addlevel": "+ Level",
			"addbreak": "+ 休息",
			"quicktitle": "快速套用",
			"leveldur": "Level 時長",
			"apply": "套用",
			"breakdur": "休息時長",
			"edittitle": "編輯項目",
			"item": "項目",
			"type": "類型",
			"minute": "分鐘",
			"action": "操作",
			"reghint": "REG 勾選代表該項目結束時自動截止報名。休息列只需要填分鐘。",
			"parsetitle": "貼上解析",
			"parsehint": "把從別的網站複製下來的賽程文字貼上後按「解析」，結果會自動填進下方編輯區，確認無誤再儲存。",
			"parseplaceholder": "在這裡貼上比賽的結構文字…",
			"parsearia": "外部賽程文字",
			"parsebtn": "解析",
			"parseaibtn": "用 AI 解析",
			"parseempty": "請先貼上要解析的文字",
			"parsing": "解析中…",
			"parsingai": "AI 解析中…",
			"parsingimage": "AI 讀取圖片中…",
			"parseimagebtn": "從圖片解析（AI）",
			"aidisabled": "後端尚未設定 AI 金鑰，無法使用 AI 解析",
			"parsefail": "解析不出結構，請確認貼上的內容包含級別表格",
			"parsesuccessprefix": "已解析出 ",
			"parsesuccesssuffix": " 個項目，請於下方確認",
			"showaiprompt": "解析不出來？用外部 AI 手動解析",
			"aiprompthint": "如果內建解析吃不下你的結構，請複製下方提示詞，貼到任一個 AI（ChatGPT / Gemini / Claude）讓它轉成 JSON，再把得到的 JSON 貼進下方「匯入 JSON」框並按匯入。",
			"copyaiprompt": "複製提示詞",
			"aipromptcopied": "提示詞已複製，貼到 AI 後把回傳的 JSON 匯入即可",
			"aipromptstructlabel": "要轉換的結構：",
			"aipromptplaceholder": "<在這裡貼上你的結構文字>",
			"ioutitle": "匯入匯出",
			"exportjson": "匯出 JSON",
			"importjson": "匯入 JSON",
			"importfile": "匯入檔案",
			"jsonplaceholder": "匯出的盲注結構 JSON 會顯示在這裡，也可以貼上 JSON 後按匯入。",
			"jsonaria": "盲注結構 JSON",
			"loading": "讀取中",
			"ready": "就緒",
			"confirmtitle": "確認操作",
			"cancel": "取消",
			"confirm": "確認",
			"noraise": "不升",
			"subtitledefault": "STRUCTURE EDIT",
			"regclosed": "REG CLOSED",
			"regopen": "REG OPEN",
			"jsonerror": "JSON 格式錯誤",
			"jsonempty": "找不到可匯入的盲注結構",
			"importsuccessprefix": "已匯入 ",
			"importsuccesssuffix": " 個項目",
			"break": "休息",
			"moveup": "上移",
			"movedown": "下移",
			"insertabove": "上方插入級別",
			"copy": "複製",
			"delete": "刪除",
			"atleastone": "至少要有一項",
			"deleteitem": "刪除此項？",
			"addeditemprefix": "已新增 ",
			"copieditemprefix": "已複製 ",
			"moveditemupprefix": "已上移 ",
			"moveditemdownprefix": "已下移 ",
			"deleteditemprefix": "已刪除 ",
			"leveldurapplied": "已套用 Level 時長",
			"breakdurapplied": "已套用休息時長",
			"syncloading": "讀取中",
			"syncok": "已同步",
			"syncfail": "讀取失敗",
			"loadfail": "讀取失敗",
			"syncnetwork": "網路不佳",
			"networkfail": "網路不佳，請重新嘗試",
			"signinagain": "請重新登入",
			"savesync": "儲存中",
			"savesuccess": "結構已儲存",
			"savefail": "儲存失敗",
			"exportsuccess": "已匯出並下載 JSON",
			"badleveldur": "請輸入正確 Level 時長",
			"badbreakdur": "請輸入正確休息時長",
			"levelhands": "Level（手數）",
			"handtargetunit": "手",
			"handhint": "「Level（手數）」以手數計算：數字欄填「目標手數」(0 = 不設目標)，現場由裁判按手數推進，不靠倒數時間。",
			"sumlevels": "級數",
			"sumbreaks": "休息",
			"sumduration": "計時總長",
			"sumhour": "時",
			"summin": "分",
			"sumreg": "Late reg 截止",
			"sumregnone": "未設定",
			"sumlevelword": "LV",
			"sumhandsprefix": "含 ",
			"sumhandssuffix": " 個手數級別未計時",
			"warntitle": "結構檢查",
			"warndecrease": "盲注下降",
			"warndecreasemsg": "比上一級小，可能是貼錯或打錯",
			"warnrace": "換籌過早",
			"warnracemsg": "換掉面額 {chip}，但之後 {level} 仍會用到這個面額",
			"warnante": "Ante 不一致",
			"warnantemsg": "沒有 ante，但前面的級別已經開始收 ante",
			"warnlevelword": "L",
			"warnbreakword": "休息"
		},
		"payouteditpage": {
			"title": "編輯名次",
			"heading": "編輯名次",
			"subtitledefault": "PAYOUT EDIT",
			"regclosed": "REG CLOSED",
			"regopen": "REG OPEN",
			"back": "返回控制台",
			"save": "儲存名次",
			"quicktitle": "快速新增",
			"quickranklabel": "名次範圍",
			"quickrankplaceholder": "1 或 1-10",
			"quickrankaria": "名次範圍",
			"add": "新增",
			"quickcashlabel": "獎金",
			"quickcashplaceholder": "獎金金額",
			"quickcasharia": "獎金",
			"quickrewardplaceholder": "獎項（可留空）",
			"quickrewardaria": "獎項",
			"quickhint": "可輸入單一名次或範圍，例如 1-10。獎金為現金金額，會列入總和；獎項可留空，若填了會與獎金一起顯示成「獎金＋獎項」。",
			"gentitle": "快速產生",
			"genplaceslabel": "獲獎名次",
			"genplacesaria": "獲獎名次數",
			"genpoollabel": "總獎池（選填）",
			"genpoolaria": "總獎池",
			"gensteeplabel": "集中度",
			"gensteeparia": "集中度",
			"genroundlabel": "現金取整",
			"genroundaria": "現金取整",
			"genminlabel": "最低獎金",
			"genminaria": "最低獎金",
			"genbtn": "產生獎金分配",
			"genhint": "依名次數自動鋪一條前重後輕的獎金曲線。總獎池預設帶入控制台計算出的獎池，可自行覆蓋。集中度越小越集中於前段（例如 0.6 冠軍佔比更高）。填總獎池時自動換算現金填入獎金並補足尾差到冠軍；留空則只建立名次、不填獎金。最低獎金可設定墊底名次的下限（例如 2000），低於此值的名次會拉到最低，差額由其餘名次重新分攤。產生會取代目前所有名次。",
			"edittitle": "名次設定",
			"headrank": "名次",
			"headcash": "獎金",
			"headreward": "獎項",
			"headaction": "操作",
			"ioutitle": "匯入匯出",
			"exportjson": "匯出 JSON",
			"importjson": "匯入 JSON",
			"importfile": "匯入檔案",
			"jsonplaceholder": "匯出的名次 JSON 會顯示在這裡，也可以貼上 JSON 後按匯入。",
			"jsonaria": "名次 JSON",
			"loading": "讀取中",
			"ready": "就緒",
			"rowrankplaceholder": "1 或 1-10",
			"rowcashplaceholder": "獎金",
			"rowrewardplaceholder": "晉級 / 獲票（可留空）",
			"moveup": "上移",
			"movedown": "下移",
			"copy": "複製",
			"delete": "刪除",
			"emptylist": "尚無名次設定。",
			"otherrewardtitle": "其他獎勵",
			"otherrewardadd": "新增一列",
			"otherrewardempty": "尚無其他獎勵。",
			"otherrewardhint": "用來記錄與名次無關的獎勵，例如賞金（bounty）、首殺獎、幸運獎。「名次」那格請自行填寫標籤文字。這裡填的獎金會計入場次頁的總獎金，但不會與名次比對，也不會自動分配給特定選手。",
			"otherrewardlabelplaceholder": "Bounty",
			"otherrewardrewardplaceholder": "獎品（可留空）",
			"otherrewardlegacylabel": "其他",
			"sumprefix": "獎金總和：$",
			"previewplacesprefix": "獲獎 ",
			"previewplacessuffix": " 名",
			"previewcashprefix": "現金合計 $",
			"previewchampionprefix": "冠軍 ",
			"previewnoncashprefix": "含 ",
			"previewnoncashsuffix": " 名純獎項",
			"jsonerror": "JSON 格式錯誤",
			"jsonempty": "找不到可匯入的名次設定",
			"importsuccessprefix": "已匯入 ",
			"importsuccesssuffix": " 筆名次",
			"syncloading": "讀取中",
			"syncok": "已同步",
			"syncfail": "讀取失敗",
			"loadfail": "讀取失敗",
			"syncnetwork": "網路不佳",
			"networkfail": "網路不佳，請重新嘗試",
			"signinagain": "請重新登入",
			"savesync": "儲存中",
			"savesuccess": "名次已儲存",
			"savefail": "儲存失敗",
			"genplacesrequired": "請輸入獲獎名次數",
			"genconfirm": "產生新分配會覆蓋目前所有名次，確定嗎？",
			"gensuccessprefix": "已產生 ",
			"gensuccesssuffix": " 筆名次，記得儲存",
			"exportsuccess": "已匯出並下載 JSON"
		},
		"apidocpage": {
			"title": "公開 API 文件",
			"back": "回上一頁",
			"overview": "總覽",
			"overviewdesc": "以下為 PokerTrace 全部 API 端點的公開文件。所有端點皆為 JSON 介面。多數端點需在 Header 帶 Bearer Token；少數工具與登入端點開放使用，各端點的「標頭」欄位另有標示。",
			"endpoints": "端點",
			"endpointsunit": "個",
			"categories": "分類",
			"searchplaceholder": "搜尋路徑、名稱或方法（GET / POST…）",
			"noresults": "查無符合的端點。",
			"expandall": "全部展開",
			"collapseall": "全部收合",
			"request": "Request 參數",
			"pathparams": "路徑參數（Path params）",
			"queryparams": "查詢參數（Query params）",
			"requestbody": "請求內容（Request body）",
			"response": "Response",
			"errors": "錯誤回應",
			"example": "範例",
			"requestlabel": "Request 範例",
			"responselabel": "Response 範例",
			"required": "必填",
			"optional": "選填",
			"baseurl": "Base URL",
			"baseurlnote": "系統會自動補上目前網域，例如 https://pokertrace.net/backendapi/",
			"authlabel": "標頭",
			"authnote": "部分工具與登入端點免 Token"
		},
		"toollistpage": {
		    "title": "工具總覽",
		    "eyebrow": "Tool Center",
		    "desc": "依用途快速找到現場、練習、計分牌、獎金與營運工具。",
		    "back": "回上一頁",
		    "searchlabel": "搜尋工具",
		    "searchplaceholder": "輸入關鍵字，例如 ICM、座位、計分牌",
		    "countlabel": "顯示",
		    "empty": "找不到符合條件的工具",
		    "all": "全部",
		    "featured": "常用",
		    "live": "現場",
		    "chip": "計分牌",
		    "payout": "獎金",
		    "strategy": "策略",
		    "operation": "營運",
		    "learn": "學習",
		    "develop": "開發",
		    "favorite": "最愛",
		    "recent": "最近",
		    "favoriteadd": "加入最愛",
		    "favoriteremove": "已收藏",
		    "favoriteempty": "尚未收藏工具",
		    "recentempty": "尚未使用任何工具"
		},
		"legalpage": {
			"backtohome": "返回首頁",
			"backtodashboard": "返回主頁"
		},
		"pageauto": {
		    "display.html": {
		        "title": "賽事顯示",
		        "attrtitle": {
		            "#syncDot": "與裁判台同步中"
		        },
		        "text": {
		            ".payout-card > .lbl": "獎金",
		            ".prize-pool-card .lbl": "總獎池",
		            "#bubbleBanner": "泡泡圈",
		            "#h4hBanner": "同步發牌",
		            "#tagLabel": "LEVEL",
		            ".break-title": "休息時間",
		            ".blind-label": "盲注",
		            ".ante-label": "BB Ante",
		            "#regCountdownCard .lbl": "報名截止",
		            ".players-card .lbl": "剩餘選手",
		            ".avg-card .lbl": "平均計分牌",
		            "#breakCountdownCard .lbl": "下次休息",
		            "#nextBlindsCard .lbl": "下個盲注",
		            ".schedule-card .lbl": "賽程",
		            ".mobile-prize-card .lbl": "總現金獎金"
		        }
		    },
		    "editsession.html": {
		        "title": "編輯場次"
		    },
		    "edittable.html": {
		        "title": "修改牌桌",
		        "text": {
		            ".mb-6 p": "Edit Table",
		            ".mb-6 h1": "編輯牌桌",
		            "label[for=\"no\"]": "牌桌編號"
		        },
		        "value": {
		            "#back": "返回",
		            "#submit": "送出"
		        }
		    },
		    "handdetail.html": {
		        "title": "手牌詳情",
		        "text": {
		            "h1": "手牌詳情",
		            "#back": "上一頁",
		            "#gtoreflink": "GTO 參考"
		        }
		    },
		    "newedithand.html": {
		        "title": "新增 / 編輯手牌"
		    },
		    "newtable.html": {
		        "title": "新增牌桌"
		    },
		    "payoutedit.html": {
		        "title": "編輯獎金"
		    },
		    "privacy.html": {
		        "title": "隱私權政策"
		    },
		    "register.html": {
		        "title": "報名清單",
		        "text": {
		            "h1": "報名清單",
		            "#back": "返回場次",
		            ".mb-6 .grid div:nth-child(1) .text-sm": "已報名",
		            ".mb-6 .grid div:nth-child(2) .text-sm": "已確認",
		            ".mb-6 .grid div:nth-child(3) .text-sm": "已取消",
		            "details summary .text-lg": "操作說明 / 狀態說明 / 新手引導",
		            "details summary > div:last-child": "展開 / 收合",
		            "#registrationlisteyebrow": "List",
		            "#registrationlistheading": "報名名單",
		            "#registrationlistnote": "點欄位排序、勾選後可批次操作；右側可匯出目前篩選結果。",
		            "th:nth-child(1)": "選取",
		            "th:nth-child(2)": "選手",
		            "th:nth-child(3)": "報名時間",
		            "th:nth-child(4)": "狀態",
		            "th:nth-child(5)": "座位",
		            "th:nth-child(6)": "收益",
		            "th:nth-child(7)": "修正",
		            "th:nth-child(8)": "操作",
		            "#empty": "尚無報名紀錄",
		            "#emptymobile": "尚無報名紀錄"
		        }
		    },
		    "signup.html": {
		        "title": "註冊"
		    },
		    "stackadjust.html": {
		        "title": "計分牌校正"
		    },
		    "staffverify.html": {
		        "title": "員工邀請確認"
		    },
		    "terms.html": {
		        "title": "服務條款"
		    },
		    "toollist.html": {
		        "title": "工具總覽",
		        "text": {
		            "#toollisteyebrow": "Tool Center",
		            "#toollisttitle": "工具總覽",
		            "#toollistdesc": "依用途快速找到現場、練習、計分牌、獎金與營運工具。",
		            "#toollistback": "回上一頁",
		            "#toollistsearchlabel": "搜尋工具",
		            "#toollistcountlabel": "顯示",
		            "#toollistempty": "找不到符合條件的工具"
		        },
		        "placeholder": {
		            "#toollistsearch": "輸入關鍵字，例如 ICM、座位、計分牌"
		        }
		    }
		}
	},
	"en": {
		"sessionresult": {
			"title": "My Result",
			"description": "Record your prize, item and place for this session. It updates the profit stats on the overview tab.",
			"winprice": "Prize Amount",
			"place": "Place",
			"winthing": "Prize Item",
			"winthingplaceholder": "Enter N/A if there is no prize",
			"save": "Save My Result",
			"savesuccess": "Saved",
			"savefail": "Save failed",
			"winpricenegative": "Prize amount cannot be negative",
			"placenegative": "Place cannot be negative"
		},
		"toolseo": {
			"addonevtitle": "Should you take the add-on?",
			"addonevbody": "Compare the cost per chip of the add-on against your original buy-in. When the add-on offers cheaper chips and your stack is short, it is usually worth taking. This tool computes both unit costs instantly.",
			"apidoctitle": "PokerTrace public API reference",
			"apidocbody": "Selected PokerTrace tools expose a free public API you can call from your own site, Discord bot, or spreadsheet. This page documents endpoints, parameters, and response formats. No API key required.",
			"avgstacktitle": "How to calculate the average stack",
			"avgstackbody": "Average stack = total chips in play divided by players remaining; divide by the big blind for average depth in BB. Enter totals and blinds to get both instantly.",
			"bankrolltitle": "How big should your poker bankroll be?",
			"bankrollbody": "Common guidelines: 100+ buy-ins for MTTs, about 50 for sit-and-gos, 20 to 40 for cash games. This tool suggests a bankroll size and maximum buy-in based on format and variance.",
			"bbantetitle": "Converting between BB ante and traditional antes",
			"bbantebody": "A BB ante equal to one big blind roughly matches a traditional ante times the number of players. This tool aligns both formats so your structure keeps the same pot contribution per orbit.",
			"betsizetitle": "Bet sizing and required equity",
			"betsizebody": "A half-pot bet gives your opponent 25% required equity; a full-pot bet gives 33%. This tool lists required equity and break-even bluff fold rates for common bet sizes.",
			"blindcatchuptitle": "When will the blinds catch up to your stack?",
			"blindcatchupbody": "Enter your stack and the blind structure to see how many levels until you hit 20 BB or 10 BB, so you can plan when to start pushing.",
			"blinddefensetitle": "How wide should you defend the big blind?",
			"blinddefensebody": "The big blind gets a discount to call, so you can defend wider than you think. This card shows suggested defense and 3-bet ranges against opens from each position.",
			"blufftitle": "Balancing your bluff frequency",
			"bluffbody": "Bet size sets the balanced value-to-bluff ratio: about 2:1 for a pot-sized bet, 3:1 for half pot. This tool computes the unexploitable bluff ratio for any size.",
			"bountytitle": "How many chips is a bounty worth?",
			"bountybody": "In bounty and PKO events, convert the bounty into starting-chip value and add it to the pot before computing your calling odds. This tool does that conversion for you.",
			"bountypooltitle": "Estimating the bounty pool",
			"bountypoolbody": "Enter entries, buy-in split, and bounty share to get the total bounty pool, starting head bounty, and expected PKO accumulation.",
			"breakeventitle": "How many entries does the host need to break even?",
			"breakevenbody": "From fixed costs, per-entry costs, and the fee structure, this tool computes the break-even entry count and profit or loss at each field size.",
			"breakschedtitle": "Break schedule planner",
			"breakschedbody": "Enter start time, level length, and break rules to get the clock time of every break in the tournament.",
			"bubblepressuretitle": "How much ICM pressure is on the bubble?",
			"bubblepressurebody": "Near the money, chips stop being linear: short stacks must survive while big stacks can apply pressure. This tool quantifies the ICM pressure for your stack position.",
			"bustratetitle": "Bust rate and final table ETA",
			"bustratebody": "From the current field and elimination pace, estimate when the money bubble and final table will arrive.",
			"buyinsplittitle": "Splitting the buy-in: prize pool, fee, bounty",
			"buyinsplitbody": "Enter the buy-in and split percentages to see exactly how much goes to the prize pool, the house fee, and the bounty pool.",
			"cashreconciletitle": "Cash reconciliation for live events",
			"cashreconcilebody": "Compute expected receipts from entries, rebuys, and add-ons, then compare against counted cash to find any discrepancy fast.",
			"cbettitle": "C-bet frequency and sizing by board texture",
			"cbetbody": "Dry, high-card boards favor frequent small c-bets; wet, connected boards call for lower frequency and bigger sizing. This card summarizes both by texture.",
			"checklisttitle": "Tournament host checklist",
			"checklistbody": "A tickable checklist covering setup, in-game admin, and closing duties so nothing gets missed on event day.",
			"chipaudittitle": "Auditing total chips in play",
			"chipauditbody": "Total chips should equal starting stacks times entries plus rebuys and add-ons. Compare the theoretical total against table counts to catch discrepancies.",
			"chipcolortitle": "Standard poker chip colors and values",
			"chipcolorbody": "White 1, red 5, green 25, black 100 for cash games; 25 / 100 / 500 / 1000 / 5000 for tournaments. A quick reference for outfitting a new game.",
			"chipcounttitle": "Chip count calculator",
			"chipcountbody": "Enter the number of chips of each denomination and get the total instantly. Handy for all-in counts and end-of-day reconciliation.",
			"chipinventorytitle": "How many chips does the venue need?",
			"chipinventorybody": "From max entries, starting stack composition, and rebuy plans, compute the total chips needed per denomination, including color-up reserves.",
			"chipracetitle": "How to run a chip race",
			"chipracebody": "When racing off small denominations, this tool works at table-wide scope: it computes how many new chips convert cleanly and the table-wide leftover, following standard rules like one chip max per player.",
			"chipsetuptitle": "Designing the starting chip setup",
			"chipsetupbody": "Enter the starting stack and available denominations to get a suggested per-player chip breakdown and the venue-wide total.",
			"coloruptitle": "Color-up calculator",
			"colorupbody": "When retiring a denomination, compute each player's exchange into larger chips and the leftover for the chip race or round-up rule.",
			"countdowntitle": "Countdown timer",
			"countdownbody": "Set a target time or duration and display the remaining time full-screen. Perfect for late-reg cutoffs and break countdowns.",
			"dealersoptitle": "Dealer standard operating procedures",
			"dealersopbody": "Shuffle, cut, dealing order, burn cards, and how to handle common errors like exposed or misdealt cards, in one quick reference.",
			"depthstrategytitle": "Strategy by stack depth",
			"depthstrategybody": "At 100 BB you play implied odds; at 40 BB 3-bet shoves appear; below 20 BB push/fold dominates. Enter your depth for the key adjustments.",
			"drawoutstitle": "Outs and odds for common draws",
			"drawoutsbody": "A flush draw has 9 outs, an open-ender 8, a gutshot 4. Use the rule of 4 and 2 to estimate hit chances. This table lists outs and odds for every common draw.",
			"durationtitle": "How long will the tournament run?",
			"durationbody": "From starting stacks, structure, and field size, estimate the total duration and the level where the event should finish.",
			"effstacktitle": "What is the effective stack?",
			"effstackbody": "The shorter stack caps what can be won or lost, so every decision should be based on the effective stack in BB, not your total. Enter both stacks to get it.",
			"equitytitle": "Poker equity calculator",
			"equitybody": "Enter hole cards (Hold'em or Omaha) and board cards to get each hand's win and tie equity plus live outs. Great for reviewing key hands and all-in decisions.",
			"evenchoptitle": "Even chop calculator",
			"evenchopbody": "The simplest deal: split remaining prizes equally. See each player's share and how it compares to the scheduled payouts.",
			"glossarytitle": "Poker glossary (Chinese-English)",
			"glossarybody": "A searchable glossary of common poker terms with Chinese translations and short explanations, from UTG to run it twice.",
			"handrankingtitle": "Poker hand rankings",
			"handrankingbody": "All ten hand categories from royal flush down to high card, with examples. Settles the classic flush-versus-straight confusion at a glance.",
			"handsesttitle": "Hands per hour estimate",
			"handsestbody": "A live table deals roughly 25 to 35 hands per hour. Estimate venue-wide hands per hour from table count and conditions - the basis for pace and rake projections.",
			"hostcosttitle": "Host cost and profit calculator",
			"hostcostbody": "Put venue, staff, and equipment costs against buy-ins, fees, and the guarantee to see prize pool and profit or loss at each field size.",
			"icmtitle": "What is ICM and how do you chop the prizes?",
			"icmbody": "ICM converts stacks into prize-money equity, reflecting that chips are worth less as you accumulate them. Enter stacks and payouts to compare ICM and chip-chop deal numbers.",
			"impliedoddstitle": "How implied odds work",
			"impliedoddsbody": "A draw can be profitable even with bad direct pot odds if you win more when you hit. Enter the extra amount you expect to win to get the true required equity.",
			"investtrackertitle": "Per-event investment tracker",
			"investtrackerbody": "Buy-in, rebuys, add-on, and tips make up your real investment. Enter them with your cash to get honest net profit and ROI for the event.",
			"kpititle": "Tournament KPI summary",
			"kpibody": "Entries, rebuy rate, effective rake, cost per table-hour, and margin in one summary so hosts can review every event with numbers.",
			"lateregtitle": "When does late registration close?",
			"lateregbody": "Enter start time, level length, breaks, and the late-reg level count to get the exact clock time registration closes.",
			"levelclocktitle": "Blind level timetable",
			"levelclockbody": "Expand the blind structure into a clock-time schedule showing when each level and break starts.",
			"matchuptitle": "Common all-in matchup equities",
			"matchupbody": "AA vs KK is about 82:18; a pair vs two overcards about 55:45. This table lists the classic preflop matchups so your intuition matches the math.",
			"mincashtitle": "How many buy-ins is a min cash?",
			"mincashbody": "Min cash is typically 1.5 to 2 buy-ins. Compute the multiple and the ITM rate you would need to break even by min-cashing alone.",
			"namegentitle": "Tournament name generator",
			"namegenbody": "Combine schedule, format, and stake elements into event name ideas when you are stuck naming your next tournament.",
			"oddsconvtitle": "Odds and equity converter",
			"oddsconvbody": "Convert between ratio odds, decimal odds, and equity percentages instantly - 3:1 equals 25%, decimal 2.5 equals 40%.",
			"partnersplittitle": "Partner profit split",
			"partnersplitbody": "Enter total profit and each partner's share to get everyone's exact cut, keeping the settlement transparent.",
			"payouttabletitle": "Payout table generator",
			"payouttablebody": "Enter the prize pool, paid places, and curve to generate per-place payouts that sum exactly to the pool.",
			"playerstatstitle": "Player stats: ROI and ITM",
			"playerstatsbody": "From your events, buy-ins, and cashes, compute ROI, in-the-money rate, and net profit - the three numbers that tell you how you are really running.",
			"positionstitle": "Poker table positions explained",
			"positionsbody": "UTG through the button: position determines information and how wide you can open. A 9-max reference with notes for each seat.",
			"potbuildertitle": "How big will the pot get?",
			"potbuilderbody": "Enter bet fractions street by street to simulate the pot and remaining stacks by the river, and spot commitment problems before they happen.",
			"potoddstitle": "How to calculate pot odds",
			"potoddsbody": "Required equity = call amount divided by (pot + bet + call). Facing a half-pot bet you need 25%. Enter the numbers and pair the result with your outs to decide.",
			"prefloptitle": "Preflop decision card",
			"preflopbody": "Opening ranges by position, standard raise sizes, and short-stack push/fold guidance on one card for fast, consistent preflop decisions.",
			"preflopoddstitle": "Starting hand probabilities",
			"preflopoddsbody": "A pocket pair comes 5.9% of the time, AK 1.2%; you flop a pair about 32% and a set about 12%. The common preflop and flop probabilities in one table.",
			"preflopsizetitle": "Preflop raise sizing",
			"preflopsizebody": "Standard baselines: open 2.2-2.5 BB, 3-bet about 3x the open (bigger out of position), 4-bet about 2.2-2.5x the 3-bet. Get a suggested size for any spot.",
			"raketitle": "How rake works",
			"rakebody": "Cash games typically take 5% of the pot up to a cap. Enter rate, cap, and pot size to see the exact rake and net winnings, or project a session's total.",
			"refundtitle": "Withdrawal refund calculator",
			"refundbody": "Refund policies differ - full before the start, prize-pool share only after cards are dealt. Enter your policy to get the exact refund amount.",
			"regpacetitle": "Registration pace tracker",
			"regpacebody": "Set a target field and deadline, enter current entries, and see the hourly pace needed and whether you are ahead or behind.",
			"regprogresstitle": "Registration and prize pool progress",
			"regprogressbody": "A live progress board showing the prize pool, the gap to the guarantee, and how many more entries close it.",
			"riverbettitle": "River bet sizing",
			"riverbetbody": "On the river every bet is pure value or pure bluff. Size value bets to what worse hands can pay, and keep bluff frequency consistent with the odds your size offers.",
			"roitargettitle": "Working backward from an ROI target",
			"roitargetbody": "Set a target ROI and your playing schedule to see the average return per event you need - turning a vague goal into checkable numbers.",
			"rulestitle": "Common tournament rules quick reference",
			"rulesbody": "Verbal declarations bind, all-ins get tabled, the button is the small blind heads-up - the rules that cause the most floor calls, in one page.",
			"satellitetitle": "How many satellite seats?",
			"satellitebody": "Convert the satellite prize pool into target-event seats plus leftover cash, from entries, buy-in, and ticket price.",
			"seatdrawtitle": "Random seat draw",
			"seatdrawbody": "Enter the player list and table count to randomly assign tables and seats, with balanced tables and per-table caps. No paper slips needed.",
			"sidepottitle": "How side pots work",
			"sidepotbody": "With multiple all-ins, the shortest stack forms the main pot and the excess forms side pots. Enter each player's contribution to get every pot's size and eligible players.",
			"splitpottitle": "Splitting the pot and the odd chip",
			"splitpotbody": "Tied hands split the pot; the odd chip usually goes to the first seat left of the button. Enter pot and players to settle it by the book.",
			"sprtitle": "What is SPR and how to use it",
			"sprbody": "SPR = effective stack divided by the flop pot. Below 3 you can commit with top pair; above 10 you need stronger hands or more maneuvering. Compute it instantly.",
			"stackcalctitle": "Stack depth in BB and M",
			"stackcalcbody": "The same 30,000 chips is 150 BB at 100/200 but only 15 BB at 1000/2000. Enter stack and blinds (with antes) for your BB count and M ratio.",
			"staffingtitle": "How much staff does the event need?",
			"staffingbody": "Estimate dealers (with rotation), floor staff, and assistants from table count and format, before event day surprises you.",
			"staffpaytitle": "Staff pay calculator",
			"staffpaybody": "Enter hourly rates, hours, bonuses, and travel for each staff member to get individual and total labor costs.",
			"stakingmarkuptitle": "Staking and markup explained",
			"stakingmarkupbody": "A 1.2 markup means backers pay 1.2x face value for your action. Enter buy-in, percentage sold, and markup to see backer cost, locked profit, and payout splits.",
			"structurechecktitle": "Is your blind structure too fast?",
			"structurecheckbody": "Healthy structures grow 25-50% per level. Paste yours to check per-level and hourly growth and flag the jumps that are too steep.",
			"structuregentitle": "Blind structure generator",
			"structuregenbody": "Enter starting stack, target duration, level length, and field size to generate a smooth blind structure, exportable as JSON for the PokerTrace timer.",
			"tablebalancetitle": "Balancing the tables",
			"tablebalancebody": "Rules require table sizes within one player of each other. Enter current counts to see exactly who moves where and when to break a table.",
			"tablefeetitle": "Table fee and rental split",
			"tablefeebody": "Enter hourly rate, tables, and hours to get the total cost and each player's share for a private game.",
			"tdarulestitle": "TDA tournament rules (2024)",
			"tdarulesbody": "The TDA rules are the global standard for tournament rulings. Preview the 2024 rulebook PDF online, including the Chinese translation.",
			"threebetrangetitle": "3-bet and 4-bet range reference",
			"threebetrangebody": "Good 3-bet ranges mix value with blocker bluffs like A5s. This card shows common value and bluff combos for 3-bets and 4-bets by position.",
			"timebankdrilltitle": "Decision timing drill",
			"timebankdrillbody": "Practice making decisions under a live-style clock with configurable time limits and one-tap start/pause.",
			"tipsharetitle": "Tip pool distribution",
			"tipsharebody": "Enter the tip total, floor share, and dealer weights to split the pool fairly in seconds.",
			"waitlisttitle": "How long is the waitlist?",
			"waitlistbody": "From waitlist length, tables, and seat turnover, estimate the expected wait and whether it is time to open another table.",
			"winprobtitle": "Chip share and win probability",
			"winprobbody": "With equal skill, your chance of winning roughly equals your share of the chips in play - the core ICM assumption. Enter your stack and the total to see it.",
			"winratetitle": "Estimating your cash game hourly rate",
			"winratebody": "bb/100 is the standard cash-game winrate unit. Enter yours with stakes and hands per hour to convert it into an expected hourly rate."
		},
		"broadcastpage": {
			"title": "Live Broadcast - PokerTrace",
			"kicker": "LIVE BROADCAST",
			"latesttitle": "Latest hand",
			"listtitle": "Recent hands",
			"foot": "Read-only · hands synced from the host",
			"skinclassic": "Classic",
			"skincrimson": "Crimson",
			"skinmidnight": "Midnight",
			"statusconnecting": "Connecting…",
			"statuslive": "Live",
			"statusreconnect": "Reconnecting…",
			"statusoffline": "Offline",
			"statusnosession": "No session",
			"noticeclosed": "This event isn't open for broadcast (only public unified-hand events can broadcast), or it doesn't exist.",
			"noticenosession": "Missing session parameter; cannot load the broadcast.",
			"noticeh4h": "Hand-for-hand in progress; waiting for the floor to release hands…",
			"unnamed": "Untitled event",
			"delaypre": "Delay ",
			"delaypost": " min",
			"badgemask": "Hole cards hidden",
			"badgeh4h": "Hand-for-hand",
			"blind": "Blinds",
			"pot": "Pot",
			"emptyseat": "Empty",
			"nohands": "No hands yet",
			"onlyone": "Only one hand so far",
			"actionallin": "All-in",
			"actionfold": "Fold",
			"actionraise": "Raise",
			"actionbet": "Bet",
			"actioncall": "Call",
			"actioncheck": "Check",
			"actionante": "Ante",
			"actionsb": "SB",
			"actionbb": "BB"
		},
		"broadcastcontrolpage": {
			"title": "Broadcast Control (H4H) - PokerTrace",
			"kicker": "HAND-FOR-HAND · CONTROL",
			"heading": "Replay control console",
			"subtitle": "Hands are recorded live; spectators only see what you release. Advance hand by hand to pace the broadcast.",
			"released": "Released",
			"pending": "Pending",
			"total": "Total",
			"nexttitle": "Next to release",
			"advance": "▶ Release next",
			"back": "Undo one",
			"all": "Release all →",
			"listtitle": "Release progress",
			"tagreleased": "Released",
			"tagpending": "Pending",
			"handpre": "Hand ",
			"handpost": "",
			"blind": "Blinds",
			"nohands": "No hands yet",
			"allreleased": "Nothing left to release (all released).",
			"noticenoth4h": "Hand-for-hand isn't enabled for this event. Enable it in event settings, then come back here.",
			"noticeloadfail": "Cannot load the console (no permission or event not found).",
			"noticenosession": "Missing session parameter; cannot load the console.",
			"noticelogin": "Please sign in to use the broadcast console.",
			"toastok": "Release progress updated",
			"toastfail": "Action failed",
			"confirmall": "Release all pending hands at once?",
			"unnamed": "Untitled event",
			"noticewsdown": "Connection lost, reconnecting…"
		},
		"handreplaypage": {
			"openbtn": "▶ Hand Replay",
			"title": "Hand Replay",
			"deal": "Deal",
			"preflop": "Preflop",
			"flop": "Flop",
			"turn": "Turn",
			"river": "River",
			"showdown": "Showdown",
			"payout": "Payout",
			"allin": "All-in",
			"fold": "Fold",
			"raise": "Raise",
			"bet": "Bet",
			"call": "Call",
			"check": "Check",
			"ante": "Ante",
			"sb": "SB",
			"bb": "BB",
			"emptyseat": "Empty",
			"pot": "Pot",
			"burn": "Burn",
			"mainpot": "Main",
			"sidepot": "Side",
			"potchips": "Pot chips",
			"decktitle": "Card style (long-press table)",
			"scrubhint": "Long-press the table and drag to scrub",
			"play": "▶ Play",
			"pause": "⏸ Pause",
			"revealall": "Show all cards",
			"closearia": "Close replay",
			"prevaria": "Previous",
			"nextaria": "Next",
			"skinclassic": "Classic",
			"skincrimson": "Crimson",
			"skinmidnight": "Midnight"
		},
		"common": {
			"leaveconfirm": "You have unsaved changes. Are you sure you want to leave?",
			"confirmtitle": "Confirm Action",
			"cancel": "Cancel",
			"confirm": "Confirm",
			"back": "Back",
			"loading": "Loading",
			"timeout": "Connection timed out. Check your network and try again.",
			"emptynext": "Continue with one of the suggested next steps below."
		},
		"pwa": {
			"install": "Install App",
			"installhint": "Add PokerTrace to your home screen for offline use",
			"installed": "Added to home screen",
			"dismiss": "Dismiss"
		},
		"shakecontact": {
			"title": "Having trouble?",
			"body": "We noticed you shook your phone. Need a hand? Let us know what happened through Contact Us.",
			"contact": "Contact Us",
			"close": "Close",
			"disable": "Turn off shake detection",
			"disabledtoast": "Shake detection is off. You can re-enable it in Profile > Preferences.",
			"asktitle": "Enable shake to report?",
			"askbody": "Allow motion access, then shake your phone anytime to contact us quickly",
			"askallow": "Allow",
			"asklater": "Not now",
			"askgranted": "Shake to report enabled",
			"askdenied": "Motion permission not granted. You can enable it later in Profile > Preferences."
		},
		"onboarding": {
			"skip": "Skip tour",
			"next": "Next",
			"prev": "Back",
			"done": "Get started",
			"hoststeps": [
				{"title": "Welcome to PokerTrace", "body": "A quick tour for hosts, covering everything from creating a session to running the floor."},
				{"title": "Create a club and session", "body": "Create your club under Clubs, then add sessions and blind structures under Sessions."},
				{"title": "Run the floor", "body": "Use the timer, multi-table board and seat balancing to keep the whole room in sync."},
				{"title": "Reports and notifications", "body": "After a session, review profit/loss and export CSV; key events trigger notifications."}
			],
			"playersteps": [
				{"title": "Welcome to PokerTrace", "body": "A quick tour for players, from registering to checking your results."},
				{"title": "Register for a session", "body": "Find a session under Sessions and register; you'll get a confirmation notification."},
				{"title": "Track your results", "body": "Check your profit trend under Profile and Reports, and export CSV anytime."}
			]
		},
		"api": {
			"signin": {
				"success": "signin successful"
			},
			"signup": {
				"success": "signup successful"
			},
			"signout": {
				"success": "signout successful"
			}
		},
		"adminuser": {
			"name": "Name",
			"permission": "Permission",
			"function": "Function",
			"ban": "Ban",
			"delete": "Delete",
			"editpermission": "Edit Permission"
		},
		"pagination": {
			"total": "%s total"
		},
		"navigationbar": {
			"index": "Home Summary",
			"signin": "SignIn",
			"signup": "SignUp",
			"signout": "SignOut",
			"profile": "Profile",
			"club": "Club",
			"session": "Session",
			"series": "Series",
			"notification": "Notifications",
			"benefit": "Advanced Report",
			"back": "Back",
			"main": "Project Home",
			"adminuser": "User Management",
			"newproject": "New Project",
			"contactadmin": "Contact Messages",
			"phone": {
				"index": "Home",
				"signin": "Sign In",
				"signup": "Sign Up",
				"signout": "Sign Out",
				"profile": "Profile",
				"club": "Club",
				"session": "Session",
				"series": "Series",
				"notification": "Notifications",
				"benefit": "Report",
				"back": "Back",
				"main": "Project",
				"adminuser": "Users"
			}
		},
		"footer": {
			"privacy": "Privacy Policy",
			"terms": "Terms of Service",
			"contact": "Contact Us"
		},
		"series": {
			"title": "Series",
			"eyebrow": "Series",
			"newseries": "New Series",
			"name": "Series Name",
			"nameplaceholder": "Enter a series name",
			"description": "Description",
			"descriptionplaceholder": "Optional",
			"scoringtype": "Ranking By",
			"scoring_profit": "Profit",
			"scoring_place": "Place",
			"scoring_points": "Points",
			"starttime": "Start Date",
			"endtime": "End Date",
			"private": "Private Series",
			"create": "Create",
			"creating": "Creating...",
			"save": "Save",
			"saving": "Saving...",
			"edit": "Edit",
			"delete": "Delete",
			"cancel": "Cancel",
			"deleteconfirm": "Delete this series? The sessions themselves will not be deleted.",
			"sessioncount": "Sessions",
			"totalprofit": "Total Profit",
			"totalcost": "Total Buy-in",
			"totalwinprice": "Total Prize",
			"myprofit": "My P/L",
			"mycost": "My Buy-in",
			"myprize": "My Prize",
			"empty": "No series yet",
			"emptyhint": "Group multiple sessions into one series for combined stats and ranking",
			"back": "Back to series list",
			"overview": "Overview",
			"sessions": "Sessions",
			"leaderboard": "Leaderboard",
			"managesessions": "Manage Sessions",
			"addsessions": "Add Sessions",
			"searchsession": "Search my sessions (name or code)",
			"add": "Add",
			"remove": "Remove",
			"done": "Done",
			"nosessions": "No sessions added yet",
			"nosessionhint": "Click \"Manage Sessions\" to add sessions to this series",
			"rank": "Rank",
			"player": "Player",
			"entries": "Entries",
			"prize": "Total Prize",
			"cost": "Total Buy-in",
			"profit": "Profit",
			"bestplace": "Best Place",
			"cashes": "Cashes",
			"noleaderboard": "No ranking data from hosted sessions yet",
			"noleaderboardhint": "The leaderboard only counts checked-in players in hosted sessions",
			"created": "Series created",
			"saved": "Saved",
			"deleted": "Series deleted",
			"sessionssaved": "Sessions updated",
			"requiredname": "Please enter a series name",
			"notfound": "Series not found",
			"networkerror": "Network error",
			"unknownerror": "Unknown error",
			"notitle": "Untitled series",
			"shared": "Shared",
			"attachtitle": "Add to Series",
			"attachhint": "Group this session into a series for combined stats and ranking",
			"attachselect": "Select a series",
			"attachbtn": "Add",
			"attaching": "Adding...",
			"attached": "Added to series",
			"alreadyin": "This session is already in that series",
			"noseries": "You have no series yet — create one on the Series page first",
			"goseries": "Go to Series",
			"batchcreate": "Batch-create Multi-day"
		},
		"batch": {
			"title": "Batch-create Multi-day Event",
			"hint": "Set it up once and create every flight in the whole bracket at once, auto-bundled into a series.",
			"basic": "Basics",
			"blind": "Blind Structure",
			"bracket": "Format / Bracket",
			"preview": "Preview",
			"seriesname": "Series Name",
			"club": "Club",
			"buyin": "Buy-in",
			"buyinfee": "Fee",
			"chip": "Starting Stack",
			"maxseat": "Seats / Table",
			"startdate": "Start Date",
			"scoringtype": "Series Ranking By",
			"gametype": "Chip Game Type",
			"limittype": "Limit Type",
			"stacktype": "Chip Type",
			"eventtype": "Event Detail",
			"prevstep": "Previous",
			"nextstep": "Next",
			"structure": "Registration / Buy-in",
			"structcount": "Count",
			"structbuyin": "Buy-in",
			"structfee": "Fee",
			"structchip": "Chips",
			"rebuy": "Rebuy",
			"reentry": "Re-entry",
			"addon": "Add-on",
			"note": "Note (applied to every flight)",
			"start": "Start time",
			"interval": "Interval (min)",
			"customtime": "Custom start time per flight",
			"blindhint": "Paste blind JSON (from your blind generator) or upload a JSON file; or paste plain text (per line: level, duration, SB, BB, ante) and click Parse. Breaks are auto-inserted by the rules below. Switch the import target to load the regular and turbo structures separately.",
			"structph": "Paste JSON (e.g. [{\"sb\":10,\"bb\":20,\"ante\":20,\"dur\":25}, ...]) or a plain-text blind table",
			"structnormal": "Regular structure",
			"structturbo": "Turbo structure",
			"parse": "Load / Parse",
			"upload": "Upload JSON",
			"parsing": "Parsing...",
			"parsed": "Loaded {n} levels",
			"parsed2": "Regular {n} levels · Turbo {m} levels",
			"parsednone": "No levels found",
			"turbofallback": "No turbo structure imported yet; turbo flights will use the regular structure",
			"jsoninvalid": "Invalid JSON",
			"intoseries": "Adding to series: {n}",
			"savecfg": "Save config JSON",
			"loadcfg": "Load config JSON",
			"cfgloaded": "Config loaded",
			"structempty": "Paste a blind structure or upload JSON first",
			"breakevery": "Break every N levels",
			"breakdur": "Break minutes",
			"regclose": "Reg-close level",
			"colorups": "Color up (level=denom)",
			"prefix": "Code",
			"count": "Flights",
			"fromlv": "From level",
			"tolv": "To level",
			"dur": "Min / level",
			"turbo": "Turbo flights (tick = that flight is turbo and uses the turbo structure)",
			"sources": "Advance from (which previous flights merge in)",
			"sourcesph": "e.g. D1A,D1B,D1C,D1D",
			"addround": "+ Add a round",
			"removeround": "− Remove last round",
			"refresh": "Refresh preview",
			"create": "Create all",
			"creating": "Creating...",
			"noround": "No rounds configured yet",
			"flightsunit": "flights",
			"previewflights": "{n} flights",
			"previewedges": "{n} advancement links",
			"needparse": "Parse the blind structure first",
			"needclub": "Select a club",
			"needstart": "Select a start date",
			"created": "Created {n} flights and bundled into a series",
			"createfail": "Create failed",
			"networkerror": "Network error",
			"chiplist": "Chip list (written to every flight's session settings)",
			"chiplisthint": "Saved into each new flight's chip list (visible in session settings) — separate from the starting stack / color-up above.",
			"chipadd": "+ Add denomination",
			"chipsetunnamed": "Unnamed set",
			"chipsetdenomcount": "{n} denominations",
			"pickchipset": "Choose a chip set to load",
			"pickchipsethint": "Your profile has multiple chip sets. Pick which one to apply.",
			"pickcancel": "Cancel",
			"chipsloaded": "Loaded {n} denominations from profile"
		},
		"index": {
			"index": "Home",
			"signin": "SignIn",
			"signup": "SignUp",
			"adminuser": "User Management"
		},
		"gametype": {
			"cash": "Cash Game",
			"tournament": "Tournament",
			"limited": "Time Limited Tournament"
		},
		"seatingtype": {
			"buyin": "Buy In",
			"rebuy": "Rebuy",
			"leave": "Leave"
		},
		"seating": {
			"CO": "CO",
			"HJ": "HJ",
			"BTN": "BTN",
			"SB": "SB",
			"BB": "BB",
			"UTG": "UTG",
			"UTG+1": "UTG+1",
			"UTG+2": "UTG+2",
			"MP": "MP",
			"MP+1": "MP+1"
		},
		"projectandapi": {
			"newapi": "New API",
			"back": "Back",
			"index": "Home",
			"signout": "Sign Out",
			"copyrootlink": "Copy Root Link",
			"editproject": "Edit Project",
			"deleteproject": "Delete Project",
			"copylink": "Copy Link",
			"editapi": "Edit API",
			"deleteapi": "Delete API",
			"newproject": "New Project",
			"projecttitle": "Project Name",
			"projectdescription": "Project Description",
			"projectrootlink": "Project Root",
			"projectpermission": "Project Permission",
			"projectpermissionpublic": "Public",
			"projectpermissioninvite": "Invite",
			"projectpermissionprivate": "Private",
			"projecttype": "Project Permission Type",
			"projecttypeedit": "Edit",
			"projecttypeadd": "Add",
			"projecttypeview": "View",
			"testapi": "Send Test",
			"setpermission": "Set Permission"
		},
		"errorlist": {
			"ERROR_request_mimes_type_error": "File must be an image",
			"ERROR_request_data_not_found": "Please check the required fields",
			"ERROR_request_data_type_error": "Field format is invalid",
			"ERROR_username_error": "Username error",
			"ERROR_token_error": "Your sign-in state expired. Please sign in again.",
			"ERROR_token_not_found": "Your sign-in state expired. Please sign in again.",
			"ERROR_no_permission": "No permission for this action",
			"ERROR_user_not_found": "User not found",
			"ERROR_session_not_found": "Session not found",
			"ERROR_product_not_found": "Product not found",
			"ERROR_phone_exist": "Phone number already exists",
			"ERROR_email_exist": "Email already exists",
			"NETWORK_ERROR": "The network connection is unstable. Please try again.",
			"GOOGLE_CREDENTIAL_MISSING": "Google sign-in did not return a credential. Please try again.",
			"GOOGLE_SIGNIN_FAILED": "The Google sign-in flow failed. Please close the popup and try again.",
			"BACKEND_SIGNIN_FAILED": "Sign-in verification failed. Please sign in again.",
			"ERROR_table_not_found": "Table not found",
			"ERROR_request_timeout": "Connection timed out. Check your network and try again.",
			"ERROR_only_latest_hand_deletable": "Only the latest record can be deleted, to keep later hand stacks consistent.",
			"ERROR_already_registered": "This player has already registered",
			"ERROR_registration_not_found": "Registration not found",
			"ERROR_session_relation_not_found": "This event has no next multi-day session configured",
			"ERROR_session_not_open_for_registration": "This event is not open for registration",
			"ERROR_cannot_register_own_session": "You cannot register for your own event",
			"WARNING_rebuycount_exceeded": "Re-buy count exceeds the event settings. Please confirm again.",
			"WARNING_addoncount_exceeded": "Add-on count exceeds the event settings. Please confirm again.",
			"ERROR_too_many_requests": "Too many requests. Please try again later.",
			"ERROR_database_error": "Database error. Please try again later.",
			"ERROR_timer_save_conflict": "Timer state was updated by someone else. Please retry.",
			"ERROR_session_ended": "This event has already ended",
			"ERROR_player_eliminated": "This player has been eliminated",
			"ERROR_hand_not_found": "Hand not found",
			"ERROR_club_not_found": "Club not found",
			"ERROR_series_not_found": "Series not found",
			"ERROR_already_signed_up": "This account is already registered",
			"ERROR_signin_error": "Sign-in verification failed. Please sign in again.",
			"ERROR_timer_player_not_found": "Timer player not found",
			"ERROR_api_not_found": "API not found",
			"ERROR_type_not_found": "Type not found",
			"ERROR_unknow_error_pls_tell_the_admin": "An unknown error occurred. Please contact the administrator."
		},
		"breadcrumb": {
			"index": "Project Home",
			"newapi": "New API"
		},
		"warning": {
			"exitpage": "Are you sure to leave? Unsaved content will be lost."
		},
		"type": {
			"game": {
				"HE": "Texas Hold'em",
				"OM": "Omaha",
				"ST": "Seven Card Stud",
				"MX": "Mixed Game",
				"O8": "Omaha Hi-Lo",
				"O5": "5 Card Omaha",
				"BO": "5 Card Omaha Hi-Lo",
				"RA": "Razz",
				"S8": "Seven Card Stud Hi-Lo",
				"CP": "Crazy Pineapple",
				"SH": "Super Hold'em (3-Card)",
				"BU": "Badugi",
				"AS": "A-5 Single Draw",
				"AD": "A-5 Double Draw",
				"AT": "A-5 Triple Draw",
				"DS": "2-7 Single Draw",
				"DD": "2-7 Double Draw",
				"DT": "2-7 Triple Draw",
				"SD": "Short Deck",
				"ZZ": "Other"
			},
			"limit": {
				"NL": "No limit",
				"PL": "Pot limit",
				"FL": "Fixed limit"
			},
			"stack": {
				"N": "Normal",
				"D": "Deep",
				"L": "Moster",
				"S": "Super",
				"M": "Mega",
				"U": "Ultra"
			},
			"event": {
				"OD": "Single Day",
				"SA": "Satellite",
				"MS": "Milestone Satellite",
				"ND": "Multiple Day"
			}
		},
		"mainpage": {
			"title": "Dashboard",
			"todayprofit": "Today Profit",
			"weekprofit": "This Week Profit",
			"monthprofit": "This Month Profit",
			"weeklytrend": "Personal Weekly Profit Trend",
			"profit": "Profit",
			"networkerror": "Network error, please try again",
			"summarytitle": "Earnings Summary",
			"summarydesc": "This page highlights your most common entry points, role hints, and recent status.",
			"quicktitle": "Quick Links",
			"recenttitle": "Last Page",
			"recentdesc": "Jump back to the page you were using before",
			"recentempty": "There is no previous page to return to yet",
			"sessionentrytitle": "Session List",
			"sessionentrydesc": "View sessions you can join, host, or already participate in",
			"profileentrytitle": "Profile",
			"profileentrydesc": "Manage your profile, role, employment, and summary",
			"benefitentrytitle": "Benefit Analysis",
			"benefitentrydesc": "Review profit trends here instead of treating it as the home page",
			"staffentrytitle": "Employment & Role",
			"staffentrydesc": "Review your current role assignment and employment relationship",
			"timerentrytitle": "Timer Work",
			"timerentrydesc": "Floor and assistants can jump into timer-related work quickly",
			"playerrole": "Player / Host",
			"dealerrole": "Dealer",
			"floorrole": "Floor",
			"assistantrole": "Assistant",
			"nextstepstitle": "Suggested Next Steps",
			"nosummary": "There is no recent summary data yet. Start with the session list or profile."
		},
		"profile": {
			"title": "Profile",
			"playerid": "Player ID",
			"monthreport": "Monthly",
			"yearreport": "Yearly",
			"allreport": "Career",
			"selectmonth": "Select month:",
			"selectyear": "Select year:",
			"includefee": "Include service fees in profit",
			"includefeedesc": "When unchecked, profit only uses buy-in amounts",
			"cash": "Cash Game",
			"tlt": "Time Limited Tournament",
			"mtt": "Tournament",
			"games": "Games",
			"sessions": "Sessions",
			"totalbuyin": "Total Buy-in",
			"totalprofit": "Total Profit",
			"buyincount": "Total Entries",
			"reporttotal": "Total Profit",
			"exportcsv": "Export CSV",
			"exportdone": "CSV exported",
			"exportnodata": "No data to export",
			"excludefee": "Profit excludes service fees",
			"exportcoltype": "Type",
			"exportcolgames": "Games/Events",
			"exportcolbuyincount": "Total Entries",
			"staff": "Staff",
			"employed": "Employed By",
			"dealer": "Dealer",
			"floor": "Floor",
			"assistant": "Assistant",
			"manage": "Manage",
			"language": "Language",
			"chinese": "Chinese",
			"english": "English",
			"localtimer": "Local Timer",
			"refereecontrol": "Referee Control Panel",
			"staffmodalcurrent": "Current List",
			"staffmodaladd": "Add",
			"staffmodalclose": "Close",
			"staffinputplaceholder": "Enter user ID (e.g. P-00099)",
			"empty": "No members",
			"unemployed": "This user is not employed by any player yet.",
			"unnamed": "Unnamed player",
			"pending": "Pending",
			"tokenexpired": "Token expired, please sign in again",
			"networkerror": "Network error, please try again",
			"invitesent": "Invitation sent to ",
			"targetuser": "this user",
			"usernotfound": "User not found",
			"rolemismatch": "This user's account type does not match this role",
			"alreadyinvited": "This user is already on the list",
			"selfinvite": "You cannot invite yourself",
			"unknownerror": "Unknown error",
			"removeconfirm": "Remove this staff member?",
			"signoutconfirmtitle": "Confirm Sign Out",
			"signoutconfirmmessage": "Sign out of the current account?",
			"signouting": "Signing out...",
			"toolssectiontitle": "Tools",
			"toolssectiondesc": "Quick tools for live play and practice",
			"toolequitytitle": "Equity Solver",
			"toolequitydesc": "Hold'em / Omaha hand equity & out",
			"tooltbtitle": "Timebank Timer",
			"tooltbdesc": "Multi-preset times, tap to start/pause",
			"toolpotitle": "Pot Odds",
			"toolpodesc": "Pot odds & required equity",
			"toolicmtitle": "ICM / Deal",
			"toolicmdesc": "ICM equity & chip-chop",
			"toolsctitle": "Stack Calculator",
			"toolscdesc": "Big blinds & M-ratio",
			"toolsptitle": "Side Pots",
			"toolspdesc": "Main and side pot split for all-ins",
			"toolhctitle": "Host P/L",
			"toolhcdesc": "Costs, prize pool, guarantee overlay and profit",
			"toolbstitle": "Bet Sizing",
			"toolbsdesc": "Pot fractions and villain equity needed",
			"toolspltitle": "Split Pot",
			"toolspldesc": "Even split with odd-chip handling",
			"toolrktitle": "Rake Calculator",
			"toolrkdesc": "Cash-game rake, cap and net",
			"toolpftitle": "Preflop Card",
			"toolpfdesc": "Ranges, raise sizing, push/fold",
			"toolgtotitle": "GTO Ranges",
			"toolgtodesc": "Preflop push/fold & RFI ranges + flop CFR solver (eval7)",
			"toolfstitle": "Postflop GTO Solver",
			"toolfsdesc": "In-house CFR, solves flop spots in real time",
			"toolcstitle": "Starting Chip Setup",
			"toolcsdesc": "Auto-suggest chip counts per player",
			"toolsgtitle": "Structure Generator",
			"toolsgdesc": "Live blind structure, auto chip race, export JSON",
			"tooldutitle": "Duration Estimator",
			"tooldudesc": "Estimate total length and levels",
			"toolastitle": "Average Stack",
			"toolasdesc": "Average stack and big blinds",
			"toolcrtitle": "Chip Race",
			"toolcrdesc": "Race off small chips and remainder",
			"toolcutitle": "Color Up",
			"toolcudesc": "Break an amount into chip counts",
			"toolbptitle": "Buy-in Split",
			"toolbpdesc": "Prize / fee / bounty split",
			"toollrtitle": "Late Reg Close",
			"toollrdesc": "Compute the reg close time",
			"toolbktitle": "Break Schedule",
			"toolbkdesc": "Clock times for each break",
			"toolsdtitle": "Seat Draw",
			"toolsddesc": "Random table and seat assignment",
			"toolpstitle": "Player Results",
			"toolpsdesc": "ROI, ITM rate and net",
			"toolmctitle": "Min Cash Multiple",
			"toolmcdesc": "Buy-in multiple and break-even ITM",
			"toolbotitle": "Bounty Value",
			"toolbodesc": "Normal / PKO bounty pocketed",
			"toolsprtitle": "SPR Calculator",
			"toolsprdesc": "Stack-to-pot ratio and commitment",
			"toolectitle": "Even Chop",
			"toolecdesc": "Split remaining prize evenly",
			"tooltftitle": "Table Fee / Hourly",
			"tooltfdesc": "Total table cost and sharing",
			"toolsttitle": "Staff Pay",
			"toolstdesc": "Hourly, bonus, transport",
			"toolbftitle": "Bluff Balance",
			"toolbfdesc": "Bet size to bluff ratio",
			"toolmutitle": "All-in Matchups",
			"toolmudesc": "Common preflop matchups",
			"toolgltitle": "Poker Glossary",
			"toolgldesc": "Searchable poker terms",
			"toolrutitle": "Rules Reference",
			"toolrudesc": "Common tournament rules",
			"toolhrtitle": "Hand Rankings",
			"toolhrdesc": "Order of the 10 hand types",
			"toolpztitle": "Positions",
			"toolpzdesc": "9-handed seats and play",
			"tooldotitle": "Draws & Outs",
			"tooldodesc": "Common draw outs and odds",
			"toolrgtitle": "Reg / Prize Progress",
			"toolrgdesc": "Progress bar and overlay gap",
			"tooldstitle": "Stack Depth Strategy",
			"tooldsdesc": "Advice by big blinds",
			"toolpptitle": "Preflop Odds",
			"toolppdesc": "Common preflop/flop odds",
			"tooloctitle": "Odds Converter",
			"toolocdesc": "Equity, odds, implied",
			"toolcctitle": "Chip Colors",
			"toolccdesc": "Common chip color values",
			"toolhetitle": "Hands Estimator",
			"toolhedesc": "Hands per hour and level",
			"toolestitle": "Effective Stack",
			"toolesdesc": "Smaller stack and BB count",
			"toolbrtitle": "Bankroll Guide",
			"toolbrdesc": "Buy-ins by format",
			"tooltstitle": "Tip Share",
			"tooltsdesc": "Floor cut and dealer split",
			"toollctitle": "Level Clock Sheet",
			"toollcdesc": "Clock time per level/break",
			"toolcntitle": "Chip Count",
			"toolcndesc": "Live total by denomination",
			"toolcbtitle": "C-bet Reference",
			"toolcbdesc": "Frequency and sizing by board",
			"toolbdtitle": "Big Blind Defense",
			"toolbddesc": "Defense vs each position open",
			"toolcktitle": "Host Checklist",
			"toolckdesc": "Before/during/after checks",
			"toolngtitle": "Event Name Ideas",
			"toolngdesc": "Template name inspiration",
			"toolwrtitle": "Cash Hourly Estimator",
			"toolwrdesc": "bb/100 to expected hourly",
			"toolaetitle": "Is the Add-on Worth It",
			"toolaedesc": "Cost per chip comparison",
			"toolcdtitle": "Countdown Timer",
			"toolcddesc": "Counts down to a set time",
			"toolsftitle": "Staffing Plan",
			"toolsfdesc": "Tables/dealer/floor/assistant",
			"toolrstitle": "Preflop Raise Sizing",
			"toolrsdesc": "Open/3bet/4bet size card",
			"toolwptitle": "Chip Win Probability",
			"toolwpdesc": "Simple estimate by chip share",
			"toolbatitle": "BB Ante Converter",
			"toolbadesc": "Align traditional and BB ante",
			"toolbutitle": "Bust Rate Estimator",
			"toolbudesc": "Bust rate and FT estimate",
			"toolrttitle": "ROI Target Backsolve",
			"toolrtdesc": "Cash needed per event",
			"tooltbtitle2": "Table Balance Advisor",
			"tooltbdesc2": "Balance players across tables",
			"toolittitle": "Investment Tracker",
			"toolitdesc": "Single-event spend and net",
			"toolsktitle": "Structure Speed Check",
			"toolskdesc": "Blind growth per hour",
			"toolbetitle": "Host Break-even",
			"toolbedesc": "Entries to break even",
			"toolsatitle": "Satellite Seats",
			"toolsadesc": "Prize pool to qualifying seats",
			"tooliotitle": "Implied Odds",
			"tooliodesc": "Equity needed with future",
			"toolsmtitle": "Staking / Markup",
			"toolsmdesc": "Sold cost and locked profit",
			"toolcititle": "Room Chip Inventory",
			"toolcidesc": "Chips to prepare by denom",
			"toolbntitle": "Bounty Pool",
			"toolbndesc": "Total pool and PKO head",
			"toolbctitle": "Blinds Catch-up",
			"toolbcdesc": "Levels until short",
			"tooltrtitle": "3-bet / 4-bet Ranges",
			"tooltrdesc": "Value and bluff range ref",
			"toolrvtitle": "River Betting",
			"toolrvdesc": "Value/bluff freq and size",
			"tooloptitle": "Dealer Procedure",
			"toolopdesc": "Dealing and error handling",
			"toolbztitle": "Bubble Pressure",
			"toolbzdesc": "ICM pressure near the money",
			"toolrctitle": "Cash Reconciliation",
			"toolrcdesc": "Due vs collected difference",
			"toolrftitle": "Refund Calculator",
			"toolrfdesc": "Refund by policy",
			"toolrptitle": "Registration Pace",
			"toolrpdesc": "Pace needed to hit target",
			"toolwltitle": "Waitlist Estimator",
			"toolwldesc": "Wait and clear times",
			"toolkptitle": "Event KPI Summary",
			"toolkpdesc": "Rake rate, margin and more",
			"toolpbtitle": "Pot Growth",
			"toolpbdesc": "Pot after multi-street bets",
			"toolcatitle": "Chip Total Audit",
			"toolcadesc": "Expected vs counted",
			"toolpntitle": "Partner Split",
			"toolpndesc": "Split profit by share",
			"toolpttitle": "Payout Table",
			"toolptdesc": "Prize pool to payouts",
			"toolapidoctitle": "Public API Docs",
			"toolapidocdesc": "Public API reference for the tools",
			"playerviewdesc": "Manage your personal summary, reports, and hired staff.",
			"staffviewdesc": "See who employs you and what role you currently handle.",
			"eyebrow": "Profile",
			"name": "Name",
			"role": "Role",
			"email": "Email",
			"playerrole": "Player / Host",
			"focusprofile": "Profile",
			"focusreport": "Summary Report",
			"focusstaffmanage": "Staff Management",
			"focuspreferences": "Preferences",
			"focusrelation": "Employment",
			"focusrole": "Role Info",
			"basicsectiontitle": "Basic Info",
			"basicsectiondesc": "Review your current account role and contact details.",
			"reportsectiontitle": "Personal Summary Report",
			"reportsectiondesc": "Keep quick summaries here and use the advanced report for long-term trends.",
			"reportsectionstaffdesc": "Staff accounts can still review summaries here, but the main focus is usually employment and role context.",
			"reportpositionnote": "This section is for quick monthly, yearly, and career summaries. It does not replace the home summary.",
			"advancedreportentry": "Open Advanced Report",
			"staffsectiontitle": "Employment",
			"staffsectiondesc": "Players can manage global staff lists and review each role quickly.",
			"employmentsectiontitle": "Employed By",
			"employmentsectiondesc": "Review which hosts you currently work with and in what role.",
			"preferencessectiontitle": "Preferences",
			"preferencessectiondesc": "Manage language and saved chip settings in one place.",
			"languagecardtitle": "Language",
			"languagecarddesc": "Change the interface language.",
			"chipcolorcardtitle": "Chip Colors",
			"chipcolorcarddesc": "Manage the color names available in session setup.",
			"chipsetcardtitle": "Saved Chip Sets",
			"chipsetcarddesc": "Store common denomination sets for quick import.",
			"shakecardtitle": "Shake to Report",
			"shakecarddesc": "Shake your phone to quickly open the Contact Us dialog.",
			"shakeon": "On (tap to turn off)",
			"shakeoff": "Off (tap to turn on)",
			"shakeenabled": "Shake to report enabled",
			"shakedisabled": "Shake to report disabled",
			"shakepermissiondenied": "Motion sensor permission denied; shake detection is unavailable",
			"deleteaccountcardtitle": "Delete Account",
			"deleteaccountcarddesc": "Permanently delete this account and all related data. This cannot be undone.",
			"deleteaccountstep1title": "Confirm Account Deletion",
			"deleteaccountstep1message": "This action CANNOT be undone. All data related to this account will be permanently deleted, including sessions, hands, registrations, staff relations, notifications and preferences. Continue?",
			"deleteaccountstep1confirm": "I understand, continue",
			"deleteaccountstep2title": "Final Confirmation",
			"deleteaccountstep2message": "This action CANNOT be undone and all data will be permanently deleted. Enter your Player ID to confirm account deletion.",
			"deleteaccountinputplaceholder": "Player ID",
			"deleteaccountfinalbutton": "Delete Account Permanently",
			"deleteaccountmismatch": "Player ID does not match",
			"deleteaccountdeleting": "Deleting...",
			"deleteaccountsuccess": "Account deleted",
			"emptychipsetpreview": "No saved chip sets yet",
			"staffcountprefix": "",
			"staffcountsuffix": " members",
			"active": "Active",
			"remove": "Remove",
			"removesuccess": "Removed",
			"languagesaved": "Language updated",
			"nochipcolors": "No chip colors configured yet",
			"chipsetdefaultname": "New Chip Set",
			"chipcolornameplaceholder": "Name",
			"chipsetnameplaceholder": "Set name",
			"chipshape_circle": "Circle",
			"chipshape_square": "Square",
			"chipcolormodaldesc": "These colors will appear in the session chip color dropdown.",
			"chipcolornameheader": "Color name",
			"chipcolorheader": "Color",
			"addcolor": "Add Color",
			"newcolor": "New Color",
			"save": "Save",
			"savesuccess": "Saved",
			"chipsetmodaldesc": "Saved sets can be imported quickly during session setup.",
			"addset": "Add Set",
			"addchip": "Add Chip",
			"toollistentry": "View All Tools"
		},
		"clublist": {
			"title": "Club Management",
			"searchplaceholder": "Search club name / address / note",
			"search": "Search",
			"addclub": "Add Club",
			"name": "Club Name",
			"address": "Club Address",
			"note": "Note",
			"action": "Actions",
			"stats": "Club Stats",
			"totalclubs": "Total Clubs",
			"displaycount": "Displayed",
			"edit": "Edit",
			"delete": "Delete",
			"cancel": "Cancel",
			"editclub": "Edit Club",
			"deleteconfirm": "Delete this club?",
			"deletesuccess": "Deleted",
			"deletefail": "Delete failed",
			"addsuccess": "Added",
			"editsuccess": "Updated",
			"operationfail": "Operation failed",
			"tokenexpired": "Permission expired, please sign in again",
			"unknownerror": "Unknown error",
			"emptyall": "No clubs or venues have been added yet",
			"emptysearch": "No clubs match the current filters",
			"nextadd": "Add a venue first so session setup is easier later.",
			"deletenext": "This venue was removed from the list. You can keep organizing the rest.",
			"clear": "Clear"
		},
		"sessionlist": {
			"title": "Session List",
			"startdate": "Start Date",
			"enddate": "End Date",
			"selectclub": "-- Select --",
			"allgametype": "All Game Types",
			"name": "Name",
			"search": "Search",
			"newsession": "New Session",
			"stats": "Session Stats",
			"gamecount": "Total Sessions",
			"totalprofit": "Total Profit",
			"avgduration": "Average Duration",
			"time": "Time",
			"buyin": "Buy-in",
			"place": "Place",
			"totalregister": "Total Entries",
			"profit": "Profit",
			"action": "Actions",
			"entryfee": "Entry Fee",
			"owner": "Owner",
			"staff": "Employed",
			"registered": "Registered",
			"confirmed": "Confirmed",
			"registerable": "Open",
			"running": "Running",
			"ended": "Ended",
			"unregister": "Cancel Registration",
			"register": "Register",
			"displaytimer": "Display Timer",
			"timer": "Timer",
			"structure": "View Structure",
			"copy": "Copy",
			"edit": "Edit",
			"delete": "Delete",
			"minute": "min",
			"hour": "hr",
			"registersuccess": "Registered, waiting for host confirmation",
			"alreadyregistered": "You have already registered",
			"cannotown": "You cannot register for your own session",
			"notopen": "This session is not open for registration",
			"unknownerror": "Unknown error",
			"unregisterconfirm": "Cancel this registration?",
			"unregistersuccess": "Registration cancelled",
			"deleteconfirm": "Delete this session?",
			"deletesuccess": "Deleted",
			"tokenexpired": "Permission expired, please sign in again",
			"networkerror": "Network error, please try again",
			"quickfilters": "Quick Filters",
			"exportcsv": "Export CSV",
			"exportdone": "CSV exported",
			"exportnodata": "No sessions to export",
			"colname": "Session",
			"colcode": "Code",
			"colstart": "Start",
			"colend": "End",
			"colbuyin": "Buy-in",
			"colplace": "Place/Total Buy-in",
			"colprofit": "Profit",
			"onlyregisterable": "Only sessions I can join",
			"onlyowned": "Only sessions I host",
			"onlyjoined": "Only sessions I joined",
			"emptyall": "There are no sessions to show yet",
			"emptysearch": "No sessions match the current filters",
			"nextnewsession": "Create a new session or loosen the filters to keep going.",
			"nextdetail": "You can continue to a session detail page or adjust the filters.",
			"clearfilter": "Clear Filters",
			"clearsearch": "Clear",
			"filteropen": "Open",
			"filterclose": "Close",
			"filtertitle": "Filters",
			"eliminated": "Eliminated"
		},
		"benefit": {
			"title": "Advanced Report",
			"startdate": "Start Date",
			"enddate": "End Date",
			"search": "Search",
			"reset": "Reset",
			"dailyprofit": "Daily Profit",
			"cumulativeprofit": "Cumulative Profit",
			"date": "Date",
			"amount": "Amount",
			"minute": "min",
			"hour": "hr",
			"networkerror": "Network error, please try again",
			"positiondesc": "",
			"emptychart": "There is not enough data to generate a trend chart yet",
			"eyebrow": "Advanced Report",
			"backtoprofile": "Back to Profile",
			"filtertitle": "Date Filter",
			"filterdesc": "Review cumulative profit trends and summary results by range.",
			"summaryrangetitle": "Range",
			"summarytotaltitle": "Cumulative Profit",
			"summarycounttitle": "Date Count",
			"resultdescprefix": "Showing the cumulative profit trend from",
			"to": "to",
			"resultdescsuffix": "",
			"emptyresultdesc": "There is no profit data in this range yet. Adjust the dates or build more session data first.",
			"emptychartdesc": "Adjust the date range or go back to the session list to accumulate more data."
		},
		"cancel": "Cancel",
		"default": "Default Mode",
		"coding": "Coding Mode",
		"clearall": "Clear All",
		"signout": "Sign Out",
		"reset": "Reset",
		"back": "Back",
		"submit": "Submit",
		"confirm": "Confirm",
		"clearallconfirm": "Confirm Clear All?",
		"clearallconfirmdescription": "This action will clear all content and cannot be undone. Please confirm if you wish to continue?",
		"resetconfirm": "Confirm Reset?",
		"resetconfirmdescription": "This action will reset all content and cannot be undone. Please confirm if you wish to continue?",
		"deleteconfirm": "Confirm Delete",
		"deleteconfirmdescription": "This action will delete the item",
		"copyed": "Copied",
		"auth": {
			"reauth": "Please sign in again to continue",
			"ERROR_token_not_found": "Your sign-in state expired because no sign-in data was found.",
			"ERROR_token_error": "Your sign-in state expired because the credential could not be verified.",
			"ERROR_no_permission": "You do not have permission to access this page or action.",
			"NETWORK_ERROR": "The network connection is unstable. Please try again.",
			"GOOGLE_CREDENTIAL_MISSING": "Google sign-in did not return a credential.",
			"GOOGLE_SIGNIN_FAILED": "The Google sign-in flow failed. Please close the popup and try again.",
			"BACKEND_SIGNIN_FAILED": "Backend sign-in verification failed. Please sign in again."
		},
		"signinpage": {
			"title": "Sign In",
			"heading": "Welcome Back",
			"subheading": "Use Google to sign in to PokerTrace and continue your workflow.",
			"googlebutton": "Sign in with Google",
			"googlefallbackhint": "If no window appears, use the button below to sign in.",
			"errorbox": "Sign-in Status",
			"commonreasons": "Common failure reasons",
			"reasongoogle": "The Google popup was closed, or Google did not return a credential.",
			"reasonnetwork": "The network is unstable, the backend did not respond, or the service is unreachable.",
			"reasonbackend": "Google sign-in succeeded, but backend token verification failed or access expired.",
			"retryhint": "If sign-in fails, try again first and refresh the page if needed.",
			"firsttitle": "First Sign-in",
			"firstdesc": "After the first sign-in, you will be asked to complete your role and language settings before returning.",
			"backtooriginal": "After sign-in, we will try to return you to the previous page.",
			"retrybutton": "Try Again"
		},
		"staffverifypage": {
			"title": "Staff Invitation",
			"eyebrow": "Staff Invite",
			"loadingtitle": "Verifying...",
			"loadingdesc": "We are processing your staff invitation.",
			"successtitle": "Confirmed",
			"successuser": "You have joined this host's staff list.",
			"successsession": "You have joined this session's staff list.",
			"alreadytitle": "Already Confirmed",
			"alreadydesc": "You have already confirmed this invitation.",
			"failedtitle": "Verification Failed",
			"faileddesc": "This link is invalid or expired.",
			"signin": "Go to Sign In",
			"home": "Back to Home",
			"timeout": "Verification is taking longer than usual. Check your connection and try again.",
			"timeoutlong": "Verification is taking longer than usual. Check your connection and try again, or refresh the page / go back home.",
			"missing": "Missing verification link. Please open the link from the invitation email.",
			"invalid": "The verification link is invalid or expired."
		},
		"signuppage": {
			"welcometitle": "Thank you for signing up for PokerTrace!",
			"welcomesub": "Welcome to PokerTrace · Create your account to get started",
			"usernamelabel": "Display Name",
			"usernamelabelhint": "",
			"usernameplaceholder": "Enter your name…",
			"usernameerror": "⚠ Please enter a name",
			"languagelabel": "Language",
			"languagelabelhint": "",
			"rolelabel": "Account Type",
			"rolelabelhint": "",
			"rolewarning": "Note: the account type cannot be changed after sign-up. Please choose carefully.",
			"roleerror": "⚠ Please select an account type",
			"roleplayer": "Player",
			"roledealer": "Dealer",
			"rolefloor": "Floor",
			"roleassistant": "Assistant",
			"languagenamezhtw": "Chinese",
			"languagenameen": "English",
			"submitbutton": "Submit",
			"submitting": "Submitting…",
			"successtitle": "Registration complete!",
			"successwelcomeprefix": "Welcome, ",
			"successwelcomesuffix": "!",
			"successrolelabel": "Account type: ",
			"successlanglabel": "Language: ",
			"successgomain": "Go to Main →",
			"unknownerror": "Unknown error"
		},
		"indexpage": {
			"title": "PokerTrace",
			"badge": "The most powerful, simplest, and most convenient Texas Hold'em tracking tool",
			"heroname": "PokerTrace",
			"herotagline": "Any player can use it easily (probably",
			"herodesc": "PokerTrace is built around players running their own events — completely free, ad-free, and fully open source. From creating events, registration lists, seating, and timer control to multi-day advancement and profit tracking, everything happens in one place.",
			"step1title": "Create an Event",
			"step1desc": "No fees, no ads. Set buy-ins, re-entries, seating, chip denominations, and registration rules directly.",
			"step2title": "Run the Floor",
			"step2desc": "Manage registration, player check-in, balanced seating, the timer, and the bust-out list in one place to reduce chaos on site.",
			"step3title": "Track Results",
			"step3desc": "Keep records of profit, ITM, the final table, multi-day advancement, and re-entry counts to review after the event.",
			"problemtitle": "What problem does it solve?",
			"problemdesc": "Many small events rely on spreadsheets, chat groups, paper lists, and ad-hoc timers to get through the night. PokerTrace aims to offer an open-source, self-hostable, ad-free option so hosts switch tools less and player data is easier to look up.",
			"feat1title": "Completely Free",
			"feat1desc": "Core features cost nothing — great for communities, home games, small tournaments, and hosts who want to manage their own data.",
			"feat2title": "Ad-Free",
			"feat2desc": "The pages focus on registration, seating, the timer, and result tracking, with no ads interrupting your work.",
			"feat3title": "Open & Transparent",
			"feat3desc": "Read the source on GitHub, self-host it, and adapt it to your own event workflow.",
			"feat4title": "Event Setup",
			"feat4desc": "Host games, link users, open registration, and manage buy-in and re-entry settings in one place.",
			"feat5title": "Registration List",
			"feat5desc": "8-slot player ID search, fuzzy lookup, direct registration, and serial number plus status tracking.",
			"feat6title": "Seating",
			"feat6desc": "Supports seating waiting players, reshuffling selected players, and balancing all tables.",
			"feat7title": "Multi-Day Advancement",
			"feat7desc": "Links Day 1 to Day 2/Day 3, advancement stacks, and re-entry counts.",
			"feat8title": "Timer",
			"feat8desc": "Blind levels, breaks, chip race, registration close, and display-end sync.",
			"feat9title": "Live Broadcast & Replay",
			"feat9desc": "Stream unified hands from public events to spectators (oval table view, delay, hand-for-hand release); replay any hand as an animation.",
			"feat10title": "Tool Collection",
			"feat10desc": "Equity calculator, ICM, chip audit and more mini tools in one place — no need to switch sites.",
			"feat11title": "Multilingual Interface",
			"feat11desc": "The interface switches between Chinese and English, convenient for player communities across regions.",
			"feat12title": "Own Your Data, Self-Hostable",
			"feat12desc": "The open-source stack can be deployed on your own server, keeping event data in your own hands.",
			"shot1title": "Registration & Seating",
			"shot1desc": "Supports player search, select-all actions, random seating, balanced tables, and per-table seat counts.",
			"shot2title": "Timer & Display",
			"shot2desc": "Control the blind structure, breaks, registration close, prize payouts, and linked player bust-out status.",
			"shotplaceholder": "Screenshot coming soon",
			"contactkicker": "Help make PokerTrace better",
			"contacttitle": "Reach out with any suggestions",
			"contactdesc": "Feature ideas, usage questions, event workflow needs, and bug reports are all welcome. PokerTrace is open source and keeps evolving based on real use.",
			"contactbtn": "Contact Us",
			"bottomtitle": "Get started with PokerTrace",
			"bottomdesc": "Start for free; you can also view the source, report issues, or contribute on GitHub.",
			"actionsessionlist": "Session List",
			"actionsignin": "Sign In",
			"actionnewsession": "New Event",
			"actionsignup": "Sign Up",
			"actionguide": "Guide",
			"actiongithub": "GitHub",
			"actiondownloadpdf": "Download Intro PDF",
			"navmobilesignin": "Sign In",
			"navmobilehome": "Home",
			"toolstitle": "Free Mini Tools",
			"toolssubtitle": "Poker live and practice tools you can use without signing in: equity solver, GTO reference, timer, pot odds, ICM, and stack calculator.",
			"toolequitytitle": "Equity Solver",
			"toolequitydesc": "Hold'em / Omaha / Short Deck equity and outs",
			"tooltbtitle": "Timebank Timer",
			"tooltbdesc": "Multiple time presets, tap to start/pause",
			"toolpotitle": "Pot Odds",
			"toolpodesc": "Pot odds and required equity",
			"toolicmtitle": "ICM / Chop",
			"toolicmdesc": "ICM equity and chip-chop",
			"toolsctitle": "Stack Calculator",
			"toolscdesc": "Big blinds and M-ratio",
			"toolsptitle": "Side Pots",
			"toolspdesc": "Main and side pot split for all-ins",
			"toolhctitle": "Host P/L",
			"toolhcdesc": "Costs, prize pool, guarantee overlay and profit",
			"toolbstitle": "Bet Sizing",
			"toolbsdesc": "Pot fractions and villain equity needed",
			"toolspltitle": "Split Pot",
			"toolspldesc": "Even split with odd-chip handling",
			"toolrktitle": "Rake Calculator",
			"toolrkdesc": "Cash-game rake, cap and net",
			"toolpftitle": "Preflop Card",
			"toolpfdesc": "Ranges, raise sizing, push/fold",
			"toolgtotitle": "GTO Ranges",
			"toolgtodesc": "Preflop push/fold & RFI ranges + flop CFR solver (eval7)",
			"tooltdaruletitle": "TDA Rulebook",
			"tooltdaruledesc": "2024 TDA poker tournament rules PDF preview",
			"toolfstitle": "Postflop GTO Solver",
			"toolfsdesc": "In-house CFR, solves flop spots in real time",
			"toolcstitle": "Starting Chip Setup",
			"toolcsdesc": "Auto-suggest chip counts per player",
			"toolsgtitle": "Structure Generator",
			"toolsgdesc": "Live blind structure, auto chip race, export JSON",
			"tooldutitle": "Duration Estimator",
			"tooldudesc": "Estimate total length and levels",
			"toolastitle": "Average Stack",
			"toolasdesc": "Average stack and big blinds",
			"toolcrtitle": "Chip Race",
			"toolcrdesc": "Race off small chips and remainder",
			"toolcutitle": "Color Up",
			"toolcudesc": "Break an amount into chip counts",
			"toolbptitle": "Buy-in Split",
			"toolbpdesc": "Prize / fee / bounty split",
			"toollrtitle": "Late Reg Close",
			"toollrdesc": "Compute the reg close time",
			"toolbktitle": "Break Schedule",
			"toolbkdesc": "Clock times for each break",
			"toolsdtitle": "Seat Draw",
			"toolsddesc": "Random table and seat assignment",
			"toolpstitle": "Player Results",
			"toolpsdesc": "ROI, ITM rate and net",
			"toolmctitle": "Min Cash Multiple",
			"toolmcdesc": "Buy-in multiple and break-even ITM",
			"toolbotitle": "Bounty Value",
			"toolbodesc": "Normal / PKO bounty pocketed",
			"toolsprtitle": "SPR Calculator",
			"toolsprdesc": "Stack-to-pot ratio and commitment",
			"toolectitle": "Even Chop",
			"toolecdesc": "Split remaining prize evenly",
			"tooltftitle": "Table Fee / Hourly",
			"tooltfdesc": "Total table cost and sharing",
			"toolsttitle": "Staff Pay",
			"toolstdesc": "Hourly, bonus, transport",
			"toolbftitle": "Bluff Balance",
			"toolbfdesc": "Bet size to bluff ratio",
			"toolmutitle": "All-in Matchups",
			"toolmudesc": "Common preflop matchups",
			"toolgltitle": "Poker Glossary",
			"toolgldesc": "Searchable poker terms",
			"toolrutitle": "Rules Reference",
			"toolrudesc": "Common tournament rules",
			"toolhrtitle": "Hand Rankings",
			"toolhrdesc": "Order of the 10 hand types",
			"toolpztitle": "Positions",
			"toolpzdesc": "9-handed seats and play",
			"tooldotitle": "Draws & Outs",
			"tooldodesc": "Common draw outs and odds",
			"toolrgtitle": "Reg / Prize Progress",
			"toolrgdesc": "Progress bar and overlay gap",
			"tooldstitle": "Stack Depth Strategy",
			"tooldsdesc": "Advice by big blinds",
			"toolpptitle": "Preflop Odds",
			"toolppdesc": "Common preflop/flop odds",
			"tooloctitle": "Odds Converter",
			"toolocdesc": "Equity, odds, implied",
			"toolcctitle": "Chip Colors",
			"toolccdesc": "Common chip color values",
			"toolhetitle": "Hands Estimator",
			"toolhedesc": "Hands per hour and level",
			"toolestitle": "Effective Stack",
			"toolesdesc": "Smaller stack and BB count",
			"toolbrtitle": "Bankroll Guide",
			"toolbrdesc": "Buy-ins by format",
			"tooltstitle": "Tip Share",
			"tooltsdesc": "Floor cut and dealer split",
			"toollctitle": "Level Clock Sheet",
			"toollcdesc": "Clock time per level/break",
			"toolcntitle": "Chip Count",
			"toolcndesc": "Live total by denomination",
			"toolcbtitle": "C-bet Reference",
			"toolcbdesc": "Frequency and sizing by board",
			"toolbdtitle": "Big Blind Defense",
			"toolbddesc": "Defense vs each position open",
			"toolcktitle": "Host Checklist",
			"toolckdesc": "Before/during/after checks",
			"toolngtitle": "Event Name Ideas",
			"toolngdesc": "Template name inspiration",
			"toolwrtitle": "Cash Hourly Estimator",
			"toolwrdesc": "bb/100 to expected hourly",
			"toolaetitle": "Is the Add-on Worth It",
			"toolaedesc": "Cost per chip comparison",
			"toolcdtitle": "Countdown Timer",
			"toolcddesc": "Counts down to a set time",
			"toolsftitle": "Staffing Plan",
			"toolsfdesc": "Tables/dealer/floor/assistant",
			"toolrstitle": "Preflop Raise Sizing",
			"toolrsdesc": "Open/3bet/4bet size card",
			"toolwptitle": "Chip Win Probability",
			"toolwpdesc": "Simple estimate by chip share",
			"toolbatitle": "BB Ante Converter",
			"toolbadesc": "Align traditional and BB ante",
			"toolbutitle": "Bust Rate Estimator",
			"toolbudesc": "Bust rate and FT estimate",
			"toolrttitle": "ROI Target Backsolve",
			"toolrtdesc": "Cash needed per event",
			"tooltbtitle2": "Table Balance Advisor",
			"tooltbdesc2": "Balance players across tables",
			"toolittitle": "Investment Tracker",
			"toolitdesc": "Single-event spend and net",
			"toolsktitle": "Structure Speed Check",
			"toolskdesc": "Blind growth per hour",
			"toolbetitle": "Host Break-even",
			"toolbedesc": "Entries to break even",
			"toolsatitle": "Satellite Seats",
			"toolsadesc": "Prize pool to qualifying seats",
			"tooliotitle": "Implied Odds",
			"tooliodesc": "Equity needed with future",
			"toolsmtitle": "Staking / Markup",
			"toolsmdesc": "Sold cost and locked profit",
			"toolcititle": "Room Chip Inventory",
			"toolcidesc": "Chips to prepare by denom",
			"toolbntitle": "Bounty Pool",
			"toolbndesc": "Total pool and PKO head",
			"toolbctitle": "Blinds Catch-up",
			"toolbcdesc": "Levels until short",
			"tooltrtitle": "3-bet / 4-bet Ranges",
			"tooltrdesc": "Value and bluff range ref",
			"toolrvtitle": "River Betting",
			"toolrvdesc": "Value/bluff freq and size",
			"tooloptitle": "Dealer Procedure",
			"toolopdesc": "Dealing and error handling",
			"toolbztitle": "Bubble Pressure",
			"toolbzdesc": "ICM pressure near the money",
			"toolrctitle": "Cash Reconciliation",
			"toolrcdesc": "Due vs collected difference",
			"toolrftitle": "Refund Calculator",
			"toolrfdesc": "Refund by policy",
			"toolrptitle": "Registration Pace",
			"toolrpdesc": "Pace needed to hit target",
			"toolwltitle": "Waitlist Estimator",
			"toolwldesc": "Wait and clear times",
			"toolkptitle": "Event KPI Summary",
			"toolkpdesc": "Rake rate, margin and more",
			"toolpbtitle": "Pot Growth",
			"toolpbdesc": "Pot after multi-street bets",
			"toolcatitle": "Chip Total Audit",
			"toolcadesc": "Expected vs counted",
			"toolpntitle": "Partner Split",
			"toolpndesc": "Split profit by share",
			"toolpttitle": "Payout Table",
			"toolptdesc": "Prize pool to payouts",
			"toolapidoctitle": "Public API Docs",
			"toolapidocdesc": "Public API reference for the tools"
		},
		"equitypage": {
			"title": "Equity Solver",
			"back": "Back",
			"gametype": "Game Type",
			"gametypeswitchconfirm": "Switching game type will remove cards that are incompatible or no longer fit. Continue?",
			"holdem": "Hold'em",
			"omaha": "Omaha",
			"omaha5": "Omaha 5",
			"shortdeck": "Short Deck",
			"handlist": "Player Hands",
			"hand": "Hand",
			"addhand": "Add Hand",
			"remove": "Remove",
			"board": "Board",
			"dead": "Burn / Muck",
			"deadhint": "These cards are removed from the deck and excluded from equity",
			"solve": "Solve Equity",
			"clear": "Clear",
			"close": "Close",
			"confirm": "Confirm",
			"cancel": "Cancel",
			"win": "Win",
			"tie": "Tie",
			"outlabel": "Out:",
			"chopoutlabel": "Chop out",
			"needflop": "Need flop",
			"runnerrunner": "Runner runner",
			"drawingdead": "Drawing dead",
			"ahead": "Ahead",
			"winlocked": "Win",
			"tieonly": "Tie",
			"minhand": "At least 2 hands required",
			"solvefail": "Solve failed, please try again"
		},
		"timebankdrillpage": {
			"title": "Timebank Timer",
			"back": "Back",
			"presets": "Time Presets",
			"seconds": "Seconds",
			"label": "Label",
			"add": "Add",
			"remove": "Remove",
			"taptostart": "Tap to start",
			"taptopause": "Tap to pause",
			"taptoresume": "Tap to resume",
			"timeup": "Time up",
			"badseconds": "Seconds must be > 0"
		},
		"potoddspage": {
			"title": "Pot Odds",
			"back": "Back",
			"pot": "Current Pot",
			"call": "Amount to Call",
			"ratio": "Pot Odds",
			"need": "Required Equity",
			"outstitle": "Outs → Equity (Rule of 4/2)",
			"outs": "Outs",
			"flopodds": "Flop (2 cards) ≈",
			"turnodds": "Turn (1 card) ≈",
			"mdf": "Min Defense Freq (MDF)",
			"evtitle": "Call EV",
			"eq": "Estimated Equity (%)",
			"ev": "Call EV",
			"advice": "Advice",
			"evnote": "EV = equity × pot − (1 − equity) × call. A positive EV means calling is profitable long-term.",
			"callit": "Call",
			"foldit": "Fold",
			"breakeven": "Break-even"
		},
		"sidepotpage": {
			"title": "Side Pots",
			"back": "Back",
			"playerstitle": "Player Contributions",
			"player": "Player",
			"name": "Name",
			"chips": "Chips In",
			"showdown": "Showdown",
			"remove": "Remove",
			"note": "Unchecking \"Showdown\" means the player folded: their chips still count toward the pot but they cannot win it.",
			"resulttitle": "Pot Distribution",
			"total": "Total Pot",
			"mainpot": "Main Pot",
			"sidepot": "Side Pot",
			"eligible": "Eligible",
			"noeligible": "— (no showdown)",
			"empty": "No contributions yet",
			"minplayer": "At least 2 players required"
		},
		"hostcostpage": {
			"title": "Host P/L Calculator",
			"back": "Back",
			"inputtitle": "Event Setup",
			"entries": "Entries",
			"buyin": "Buy-in (to prize pool)",
			"fee": "Fee (to host)",
			"rebuycount": "Rebuy Count",
			"rebuyamt": "Rebuy Amount",
			"reentrycount": "Re-entry Count",
			"addoncount": "Addon Count",
			"addonamt": "Addon Amount",
			"guarantee": "Guarantee",
			"cost": "Fixed Cost (venue + staff)",
			"note": "Rebuys/Re-entries are charged the same fee as buy-ins (to host); buy-in/rebuy/addon amounts and re-entries (treated as fresh buy-ins) all go to the prize pool. Adjust to your structure.",
			"pool": "Accumulated Pool",
			"payout": "Actual Payout Pool",
			"overlay": "Host Overlay",
			"revenue": "Host Gross Revenue",
			"costtotal": "Fixed Cost",
			"profit": "Host Net Profit",
			"overlaywarn": "Below guarantee — host must cover {amount} overlay.",
			"overlayok": "{amount} above guarantee — no overlay."
		},
		"betsizepage": {
			"title": "Bet Sizing",
			"back": "Back",
			"pot": "Current Pot",
			"overbet": "Overbet Factor",
			"hfraction": "Bet Fraction",
			"hamount": "Bet Amount",
			"hneed": "Villain Equity Needed",
			"potlabel": "Pot",
			"note": "Villain equity needed = bet / (pot + 2 x bet), the minimum equity for their call to break even."
		},
		"splitpotpage": {
			"title": "Split Pot",
			"back": "Back",
			"pot": "Pot",
			"ways": "Split Ways",
			"chip": "Min Denomination",
			"base": "Base Each",
			"odd": "Odd Chips",
			"remainder": "Unallocatable Remainder",
			"seat": "Seat",
			"note": "Each player first takes an equal amount divisible by the minimum denomination; leftover odd chips go to the players closest to the dealer's left by convention. If the pot is not divisible by the minimum denomination, the sub-denomination amount is listed as an unallocatable remainder and must be handled separately."
		},
		"rakepage": {
			"title": "Rake Calculator",
			"back": "Back",
			"pot": "Pot",
			"pct": "Rake %",
			"cap": "Cap (0 = none)",
			"rake": "Rake Taken",
			"win": "Winner Keeps",
			"eff": "Effective Rake",
			"note": "Rake = min(pot x rake%, cap). With a cap, big pots have an effective rake below the nominal %."
		},
		"prefloppage": {
			"title": "Preflop Card",
			"back": "Back",
			"postitle": "Position (9-max RFI)",
			"gridtitle": "Opening Range",
			"percentlabel": "Range %",
			"suitednote": "Upper-right triangle is suited (s), lower-left is offsuit (o), diagonal is pocket pairs.",
			"sizetitle": "Raise Size Guide",
			"sizebody": "Standard 9-max open 2.2-2.5bb; 2.5-3bb with antes. Add 1bb per limper. SB can open slightly larger (3bb) to offset position. Vs 3-bet: ~3x in position, ~4x out of position.",
			"pushtitle": "Short-Stack Push / Fold",
			"pushbody": "<=10bb late (BTN/CO): 22+, A2s+, A7o+, K9s+, KTo+, Q9s+, JTs can open-shove. <=8bb widens ~10%. <=15bb early stays tight: 88+, ATs+, AQo+. Tighten calling ranges noticeably when facing a shove.",
			"disclaimer": "A common 9-max reference; adjust for opponents, rake, and reward structure in practice."
		},
		"registerpage": {
			"csv_none": "No registrations to export",
			"csv_done": "CSV exported",
			"csv_btn": "Export CSV",
			"csv_header": "No.|Player|Player ID|Register Time|Status|Cost|Place|Prize|Profit"
		},
		"gtopage": {
			"title": "Suggested Range Reference",
			"subtitle": "Preflop & postflop GTO reference: push/fold, RFI, trees (2–10 players, NL/PL/FL, antes)",
			"guidetitle": "How to use (expand)",
			"back": "Back",
			"street_preflop": "Preflop",
			"street_flop": "Postflop",
			"perseatlabel": "Per-seat stacks (MTT, chip-EV reference)",
			"streetnote": "Turn/river: deal them at showdown after loading a flop",
			"guidehtml": "<div class='space-y-3 text-sm text-zinc-300'><p><b class='text-zinc-100'>What this is</b>: a preflop &amp; postflop GTO reference lookup. Pick a <b>betting structure</b> and <b>game</b>, then use the controls (players / spot / ante / stack / position) — the matrix below shows the matching strategy.</p><div><p><b class='text-zinc-100'>1. Betting structure (NL / PL / FL)</b></p><ul class='list-disc pl-5 space-y-0.5'><li><b>No Limit</b>: can jam anytime. Push/fold, deep RFI and the action trees live here.</li><li><b>Pot Limit</b>: max bet = the pot. Preflop open / 3bet / all-in <b>ranges</b> are nearly identical to NL (ranges reuse the NL data); the difference is capped deep-street sizing. A short-stack pot-raise ≈ all-in.</li><li><b>Fixed Limit</b>: capped bets, preflop only raises a fixed amount, <b>no all-in</b> — so no push/fold or action tree; instead a Limit-specific preflop reference (by position group). Limit play is tighter, high-card/pair oriented, position matters less.</li></ul></div><div><p><b class='text-zinc-100'>2. Game (Hold'em vs Short Deck, explained separately)</b></p><ul class='list-disc pl-5 space-y-0.5'><li><b>Hold'em</b>: standard 52 cards, 13×13 matrix (C(52,2)=1326 combos). Ranking high→low: straight flush &gt; quads &gt; full house &gt; flush &gt; straight &gt; trips &gt; two pair &gt; pair &gt; high card.</li><li><b>Short Deck 6+</b>: remove 2–5, leaving 36 cards, 9×9 matrix (C(36,2)=630 combos). Different rankings: <b>flush beats full house</b> and <b>trips beat a straight</b> (16 fewer cards make flushes harder, straights easier); A plays as a 5, lowest straight is A-6-7-8-9. Equities run closer, so preflop ranges are wider and calling is looser.</li></ul></div><div><p><b class='text-zinc-100'>3. Players (2–10)</b></p><p class='pl-1'>Use −/+ or type 2–10. Seats are laid out automatically (early to blinds), and each seat maps to the correct open range by <b>how many players are still behind</b>: more players / earlier position → tighter opens. 2 players = heads up (SB vs BB).</p></div><div><p><b class='text-zinc-100'>4. Ante (NL/PL push/fold only)</b></p><p class='pl-1'>Two modes: <b>Per player</b> = each player's ante as % of the big blind (total = ante% × players); <b>Big-blind (BBA)</b> = only the big blind posts one fixed ante for the whole table (enter it in BB, independent of player count; 1bb is most common). Antes are dead money that grow the pot → jamming and calling both widen. Total ante snaps to the nearest baked level (shown on the right). Use 0 for none.</p></div><div><p><b class='text-zinc-100'>5. Spots</b></p><ul class='list-disc pl-5 space-y-0.5'><li><b>Short-stack push/fold</b>: the push/fold action tree. Click each seat's action in order (jam / fold / call); <b>click any seat above to jump straight to it (everyone before folds)</b>. Tick per-seat stacks for MTT (chip-EV reference, not ICM).</li><li><b>Open & defend</b>: deep open → 3bet → vs 3bet (4bet) → vs 4bet (5bet); ranges auto-linked; <b>the open step is the RFI opening range</b>. Seat-jump works here too.</li><li><b>Limit spots (FL)</b>: Limit open (by early/mid/late/blinds group) and Limit BB defense.</li></ul></div><div><p><b class='text-zinc-100'>6. Reading the matrix</b></p><ul class='list-disc pl-5 space-y-0.5'><li>Upper-right = suited (s), lower-left = offsuit (o), diagonal = pocket pairs.</li><li>Each cell's <b>color split</b> = that hand's mixed action frequencies (see the legend).</li><li><b>Click a cell</b> for its recommended action, mix and EV.</li><li>In tree mode the <b>big tiles</b> show the current player's overall action share and combo count.</li></ul></div><div><p><b class='text-zinc-100'>7. Postflop flow</b></p><p class='pl-1'>Switch to Postflop: pick opener position + matchup + click the flop → strategy matrix and big action tiles → click actions to walk down → at showdown press <b>Deal turn/river</b> to pick a card and solve the next street live.</p></div><p class='text-zinc-500 border-t border-zinc-800 pt-2'>All ranges are educational reference (computed with eval7 incl. ante re-solve, or rule-generated), not commercial-solver output; PL reuses NL ranges and FL is a rule-generated reference. Adjust for rake, format and opponent tendencies in practice.</p></div>",
			"structurelabel": "Betting structure",
			"struct_NL": "No Limit",
			"struct_PL": "Pot Limit",
			"struct_FL": "Fixed Limit",
			"gametypelabel": "Game",
			"game_HE": "Hold'em",
			"game_SD": "Short Deck 6+",
			"tabletypelabel": "Players",
			"playersuffix": "players",
			"spotlabel": "Spot",
			"stacklabel": "Eff. Stack",
			"antelabel": "Ante",
			"ante_mode_each": "Per player",
			"ante_mode_bba": "Big-blind",
			"ante_suffix_each": "% BB / player",
			"ante_suffix_bba": "BB (big-blind ante)",
			"ante_none": "no ante",
			"ante_total": "≈ {bb}bb total ante",
			"poslabel": "Hero Position",
			"gridtitle": "Starting-Hand Matrix",
			"percentlabel": "Action %",
			"legendtitle": "Action Legend",
			"detailtitle": "Hand Detail",
			"detailhint": "Click a cell in the matrix to see its recommended action and mixed frequencies here.",
			"detailpure": "Pure action in this spot, no mixed frequency.",
			"ev_label": "Jam EV over fold",
			"ev_indiff": "≈0 indifferent (so it mixes)",
			"ev_plus": "→ jam",
			"ev_minus": "→ fold",
			"suitednote": "Upper-right triangle is suited (s), lower-left is offsuit (o), diagonal is pocket pairs. Click a cell for details.",
			"summary": "{stack}bb at {position}, spot: {spot}",
			"versionlabel": "Data version",
			"disclaimer": "This tool provides strategy reference only and is not the single best play. All ranges are computed with eval7: SB opens are exact heads-up Nash, UTG-BTN opens use a multiway chip-EV model, and call-vs-jam is equity vs the opponent's range + pot odds. None is commercial solver output. Adjust for rake, antes, stack depth, opponent tendencies, format and payout structure in practice.",
			"spot_PUSHFOLD": "Push / Fold (short-stack shove)",
			"spot_PFTREE": "Short-stack push/fold",
			"spot_RFI": "RFI open (deep, reference)",
			"spot_DEEPTREE": "Open & defend",
			"spot_FLRFI": "Limit open (RFI, reference)",
			"spot_FLBBDEF": "Limit BB defense",
			"pl_disclaimer": "Pot Limit (PL): preflop open / 3bet / all-in RANGES are nearly identical to No Limit; the difference is the max bet is the pot and deep multi-street play differs. Ranges here reuse the NL data; short-stack pot-raise ≈ all-in. Adjust for sizing constraints in practice.",
			"fl_disclaimer": "★Fixed Limit (FL) has no all-in: bets are capped and preflop only raises a fixed amount, so there is no push/fold or action tree. These are PokerTrace in-house Limit preflop reference ranges (rule-generated, not solver output)★. Limit play is tighter, high-card/pair oriented, and position matters less; ranges are given by position group (early/mid/late/blinds).",
			"rfi_version": "reference-v1",
			"rfi_source": "reference chart (not solver-computed)",
			"rfi_disclaimer": "★Deep-stack RFI opens are PokerTrace standard reference ranges, NOT eval7/solver output★ (deep opens depend on postflop playability and need a full preflop solver to compute exactly). 100bb is the hand-written anchor; other stack depths are extrapolated from it: shallower cuts speculative hands and adds high-card offsuit, deeper adds suited kickers and small pairs. Free to use, but treat as a teaching reference and adjust to opponents and context.",
			"tbet_disclaimer": "★Deep-stack 3bet/4bet/5bet ranges are PokerTrace standard reference (value + bluffs like A5s/A4s), NOT eval7/solver output★. Adjust to the matchup and opponents.",
			"tree_title": "Action Tree",
			"tree_hint": "Pick each player's action in preflop order; once someone jams, later seats switch to call / fold. The matrix shows the current actor's range. Click a seat above to jump straight to it (everyone before folds).",
			"tree_jumphint": "Click: fold everyone before this seat and jump here",
			"tree_open": "{seat} to act: jam or fold",
			"tree_facing": "{seat} faces {jammer}'s jam: call or fold",
			"tree_bbwin": "Folded to the big blind — BB takes the blinds (no decision).",
			"tree_jamwin": "Everyone folded to {jammer}'s jam; {jammer} takes the pot.",
			"tree_showdown": "A call appears → showdown. Send to the Equity Solver to compare equities.",
				"tree_showdown_multi": "{n}-way all-in to showdown (multiway pot). Call ranges from the 2nd caller on are roughly tightened per player count (heuristic estimate, not a rigorous multiway solve).",
				"tree_facing_callers": " ({n} already called — range roughly tightened for the multiway pot; heuristic estimate, not a rigorous multiway solve)",
				"tree_facing_exact3": " (3-way all-in: overcall range computed with eval7 vs both prior ranges)",
			"tree_toact": "to act",
			"tree_pending": "pending",
			"tree_hero": "You",
			"tree_linestart": "(no action yet: folded to Hero)",
			"tree_gotoequity": "Open Equity Solver",
			"tree_back": "Back",
			"tree_reset": "Reset",
			"act_jam": "Jam",
			"act_call": "Call",
			"act_fold": "Fold",
			"deep_bbwin": "Nobody opened — BB takes the blinds",
			"deep_allfold": "Everyone folded",
			"deep_openerwins": "{pos} (opener) takes the pot",
			"deep_threebettorwins": "{pos} (3bettor) takes the pot",
			"deep_flop": "Preflop action over — {n}-way to the flop",
			"deep_allin": "All-in — running it out",
			"deep_limpflop": "{n}-way limped pot — to the flop",
			"deep_isoraise": "{pos} iso-raises — limpers respond individually (call/fold/3bet); this line only shows the iso range",
			"deep_bbfacelimp": "BB faces {n} limp(s): check or iso-raise",
			"deep_open": "Action on {pos} to act (open / call / fold)",
			"deep_facing": "Action on {pos} facing {opener}'s open",
			"deep_opener3bet": "Opener {opener} facing {threebettor}'s 3bet",
			"deep_3bettorfacing4bet": "3bettor {threebettor} facing {opener}'s 4bet",
			"deep_gotoflop": "Go to flop wizard",
			"deepact_fold": "Fold",
			"deepact_call": "Call",
			"deepact_check": "Check",
			"deepact_raise": "Raise",
			"deepact_allin": "all-in",
			"action_jam": "Jam (all-in)",
			"action_raise": "Raise",
			"action_limp": "Call",
			"action_call": "Call",
			"action_check": "Check",
			"action_mix": "Mixed",
			"action_fold": "Fold",
			"metasource": "PokerTrace in-house | computed via eval7 (with mixed freqs)",
			"fs_title": "Postflop GTO Solver",
			"fs_subtitle": "In-house CFR, solves flop spots in real time (eval7, free)",
			"fs_boardlabel": "Flop",
			"fs_potlabel": "Pot",
			"fs_stacklabel": "Eff. stack behind",
			"fs_ooplabel": "OOP range (acts first)",
			"fs_iplabel": "IP range (acts last)",
			"fs_betlabel": "Bet size",
			"fs_random": "Random flop",
			"fs_solve": "Solve",
			"fs_solving": "Solving…",
			"fs_allowraise": "Allow raise",
			"fs_hint": "Enter the flop, both ranges and a bet size, then Solve. The backend runs CFR to equilibrium (~2s).",
			"fs_suitednote": "Upper-right suited, lower-left offsuit, diagonal pairs. Cell color = action frequency at this node; grey = not in range.",
			"fs_disclaimer": "In-house CFR solver (flop subgame; turn/river settled by exact showdown equity), not a full multi-street solver; a computed reference, use judgment in practice.",
			"fs_detailhint": "Click any cell above to see each action's EV and EV-loss for that hand.",
			"fs_detailnotinrange": "Not in this node's range.",
			"fs_detailnote": "GTO mixes until each action's EV is equal (indifference). \"EV-loss\" = how much always taking that one action loses vs GTO.",
			"fs_theoev": "Theoretical EV (GTO mix)",
			"fs_colaction": "Action",
			"fs_colfreq": "Freq",
			"fs_colloss": "EV-loss",
			"fs_errboard": "Pick 3 distinct flop cards",
			"fs_errrange": "Fill in both ranges",
			"fs_errfail": "Solve failed — check backend and inputs",
			"fs_fslibtitle": "Local batch results (from gtoworker.py)",
			"fs_fslibopenerlabel": "Opener position",
			"fs_fslibscenariolabel": "Matchup",
			"fs_fslibhint": "Pick a matchup and click the flop to pick cards — it loads the already-solved strategy automatically, no re-solving.",
			"fs_fslibempty": "No offline batch results yet — run gtoworker.py locally first.",
			"fs_fslibfail": "Failed to load",
			"fs_fslibnotready": "This matchup hasn't reached this flop yet — check back once gtoworker.py has run further.",
			"fs_thirdlabel": "Background player ranges (multiway, optional, up to 7)",
			"fs_thirdplaceholder": "Leave empty for a heads-up solve. Each box adds one background player (fixed range that calls a normal bet but is assumed to fold to any raise — not a rigorous multiway equilibrium).",
			"fs_bgadd": "＋ Add player",
			"fs_bgcount": "{n} players total (OOP + IP + {k} background)",
			"fs_multiwaynote": "Simplified multiway model: background players have fixed ranges that call normal bets but are assumed to fold to any raise — not a rigorous multiway Nash equilibrium, reference only.",
			"fs_street_flop": "flop",
			"fs_street_turn": "turn",
			"fs_street_river": "river",
			"fs_deal_turn": "Deal turn",
			"fs_deal_river": "Deal river",
			"fs_term_fold": "Folded here — opponent takes the pot immediately.",
			"fs_term_call": "Called here — hands go to showdown.",
			"fs_term_check": "Both checked through — straight to showdown.",
			"fs_term_end": "End of the action.",
			"fs_wizard_start": "Start: OOP acts first on the flop",
			"fs_wizard_back": "Back",
			"fs_wizard_reset": "Reset",
			"fs_nl_check": "check",
			"fs_nl_raise": "raise",
			"fs_nl_allin": "all-in",
			"fs_nl_bet": "bet",
			"fs_betprefix": "Bet ",
			"fs_kind_srp": "SRP",
			"fs_kind_3bet": "3bet pot",
			"fs_close": "Close",
			"fs_cancel": "Cancel",
			"fs_confirm": "Confirm",
			"fs_action_check": "Check",
			"fs_action_bet": "Bet",
			"fs_action_fold": "Fold",
			"fs_action_call": "Call",
			"fs_action_raise": "Raise",
			"fs_nodetab_oop_root": "OOP open"
		},
		"chipsetuppage": {
			"title": "Starting Chip Setup",
			"back": "Back",
			"stack": "Starting Stack",
			"auto": "Auto Fill",
			"denomtitle": "Denominations & Counts",
			"denom": "Denomination",
			"count": "Count Each",
			"sub": "Subtotal",
			"remove": "Remove",
			"total": "Total Each",
			"chips": "Chips Each",
			"diff": "Diff vs Target",
			"minrow": "At least 1 denomination required",
			"note": "Auto Fill reserves enough small chips for early betting and change, then fills the rest with larger denominations. Adjust counts manually; the total must equal the starting stack."
		},
		"durationpage": {
			"title": "Duration Estimator",
			"back": "Back",
			"inputtitle": "Event & Structure",
			"entries": "Entries",
			"stack": "Starting Stack",
			"factor": "Rebuy/Addon Factor",
			"startbb": "Starting BB",
			"mult": "Raise Factor",
			"levelmin": "Level Minutes",
			"breakevery": "Break Every",
			"breakmin": "Break Minutes",
			"target": "Play To",
			"champion": "Winner",
			"ft": "Final Table (9)",
			"finishbb": "Finish Avg Stack (BB)",
			"totalchips": "Total Chips",
			"levels": "Est. Levels",
			"endbb": "Finish Blind",
			"total": "Est. Duration",
			"hour": "h",
			"min": "min",
			"note": "Model: total chips / players left / finish avg stack = finishing big blind, then back out the level count. A rough estimate affected by late reg, play style, and heads-up length."
		},
		"avgstackpage": {
			"title": "Average Stack",
			"back": "Back",
			"total": "Total Chips",
			"players": "Players Left",
			"bb": "Current BB (optional)",
			"avg": "Average Stack",
			"avgbb": "Average BB",
			"note": "Average stack = total chips / players left; average BB = average stack / current big blind. A quick read on overall depth."
		},
		"chipracepage": {
			"title": "Chip Race",
			"back": "Back",
			"small": "Denomination Removed",
			"count": "Total Count on Table",
			"newdenom": "Race To",
			"value": "Total Value Removed",
			"newchips": "New Chips",
			"remain": "Remainder (high-card race)",
			"note": "Total value = denomination x count. These figures are table-wide: how many new chips to prepare and the table-wide leftover. In a real chip race each player first exchanges as many whole new chips as possible and only their own remainder is raced by high card, so the sum of player remainders is usually larger than the table-wide leftover shown here."
		},
		"structuregenpage": {
			"title": "Structure Generator",
			"back": "Back",
			"chipslabel": "Chip denominations in play",
			"addchip": "Add denom",
			"selectall": "Select all",
			"deselectall": "Deselect all",
			"chipplaceholder": "Custom denom",
			"chipshint": "Tap to toggle which denominations are on the table. The smallest active chip is used to detect when a chip race is needed.",
			"genlabel": "Structure Generator",
			"startsb": "Starting SB",
			"mult": "Raise factor",
			"leveldur": "Minutes / level",
			"levels": "Levels",
			"breakevery": "Break every (0=off)",
			"breakdur": "Break minutes",
			"ante": "BB ante",
			"genhint": "Builds blinds by multiplying the starting small blind each level, rounded to clean chip values and aligned to the smallest active denomination. After generating, edit each item by hand below.",
			"fromprofile": "Load denoms from profile",
			"structlabel": "Structure (editable)",
			"addlevel": "+ Level",
			"addbreak": "+ Break",
			"regen": "Regenerate",
			"copyjson": "Copy JSON",
			"exportjson": "Export JSON",
			"importjson": "Import JSON",
			"edithint": "Every level's blinds and minutes are editable (FT levels can run longer). Checking REG closes registration after that level; later levels are tagged Reg Closed. Changing generator inputs or chips regenerates and overwrites manual edits.",
			"sumlevels": "Levels",
			"sumtime": "Total time",
			"sumbreaks": "Breaks",
			"sumraces": "Chip races",
			"thlevel": "LV",
			"thsb": "SB",
			"thbb": "BB",
			"thante": "Ante",
			"thdur": "Min",
			"threg": "REG",
			"thaction": "Action",
			"thnote": "Note",
			"breaklabel": "Break",
			"breakraced": "Break (race off {d})",
			"breakrow": "Break {m} min",
			"racetag": "race off {d}",
			"switchtype": "Switch type (break/level)",
			"regbefore": "Reg Open",
			"regafter": "Reg Closed",
			"noraise": "No race",
			"unithr": "h",
			"unitmin": "m",
			"invalid": "Enter a valid starting SB, levels, duration and raise factor",
			"leveltruncated": "Capped at {n} levels",
			"badchip": "Enter a valid denomination",
			"atleastone": "Keep at least one item",
			"needsignin": "Sign in to load profile chips",
			"profilefail": "Failed to load profile",
			"noprofilechips": "No chip denominations set in profile",
			"profileloaded": "Loaded {n} denominations from profile",
			"copied": "JSON copied",
			"copymanual": "JSON shown, copy it manually",
			"exported": "Exported and downloaded JSON",
			"imported": "Imported {n} items",
			"importfail": "Invalid JSON, could not import",
			"importempty": "JSON has no usable structure items",
			"pickchipset": "Choose a chip set to load",
			"pickchipsethint": "Your profile has multiple chip sets. Pick which one to apply.",
			"pickcancel": "Cancel",
			"chipsetunnamed": "Unnamed set",
			"chipsetdenomcount": "{n} denominations",
			"parsetitle": "Paste & Parse",
			"parsehint": "Paste a blind structure copied from another site, then click Parse. The result fills the structure table below for you to review before using.",
			"parseplaceholder": "Paste the tournament structure text here…",
			"parsebtn": "Parse",
			"parseempty": "Please paste some text to parse first",
			"parsing": "Parsing…",
			"parsingimage": "AI is reading the image…",
			"parseimagebtn": "Parse from image (AI)",
			"aidisabled": "AI key is not configured on the backend yet",
			"parsefail": "Could not parse a structure. Make sure the pasted text contains a levels table.",
			"parsesuccessprefix": "Parsed ",
			"parsesuccesssuffix": " items — please review below",
			"showaiprompt": "Can't parse? Use an external AI",
			"aiprompthint": "If the built-in parser can't handle your structure, copy the prompt below, paste it into any AI (ChatGPT / Gemini / Claude) to turn it into JSON, then paste that JSON into the \"Import JSON\" box below and click import.",
			"copyaiprompt": "Copy prompt",
			"aipromptcopied": "Prompt copied — paste it into an AI, then import the JSON it returns",
			"aipromptstructlabel": "Structure to convert:",
			"aipromptplaceholder": "<paste your structure text here>",
			"networkfail": "Network unstable. Please try again.",
			"signinagain": "Please sign in again"
		},
		"coloruppage": {
			"title": "Color Up",
			"back": "Back",
			"amount": "Amount to Convert",
			"denomlabel": "Available Denominations (comma)",
			"denomtitle": "Breakdown (high to low)",
			"pieces": "pcs",
			"chips": "Total Chips",
			"covered": "Amount Covered",
			"remain": "Indivisible Remainder",
			"note": "Greedy color up from largest to smallest, listing chip counts per denomination. Any leftover below the smallest denomination must be handled by a chip race."
		},
		"buyinsplitpage": {
			"title": "Buy-in Split",
			"back": "Back",
			"total": "Total Buy-in",
			"fee": "Fee",
			"bounty": "Bounty",
			"entries": "Entries",
			"prize": "Prize Pool Each",
			"pct": "Prize Pool %",
			"pool": "Total Prize Pool",
			"host": "Host Fee Revenue",
			"warn": "Fee + Bounty exceeds the buy-in; prize pool is negative.",
			"note": "Prize pool each = total buy-in - fee - bounty. Total prize pool = prize each x entries (bounty pool counted separately)."
		},
		"lateregpage": {
			"title": "Late Reg Close",
			"back": "Back",
			"start": "Start Time",
			"levelmin": "Level Minutes",
			"clevel": "Close After Level",
			"breakevery": "Break Every",
			"breakmin": "Break Minutes",
			"close": "Late Reg Closes At",
			"elapsed": "Elapsed",
			"breaks": "Breaks Within",
			"hour": "h",
			"min": "min",
			"note": "Close time = start + all level durations up to the close level + breaks within. Registration usually closes at the end of the chosen level."
		},
		"breakschedpage": {
			"title": "Break Schedule",
			"back": "Back",
			"start": "Start Time",
			"levelmin": "Level Minutes",
			"total": "Total Levels",
			"every": "Break Every",
			"dur": "Break Minutes",
			"hno": "Break",
			"hafter": "After Level",
			"htime": "Clock Time",
			"after": "",
			"none": "No breaks for this setup",
			"note": "Lists the clock time each break starts (prior breaks accumulated). Addon deadlines are usually set at a break; cross-reference this table."
		},
		"seatdrawpage": {
			"title": "Seat Draw",
			"back": "Back",
			"players": "Players",
			"seats": "Seats per Table",
			"draw": "Redraw",
			"summary": "Tables",
			"table": "Table",
			"seat": "Seat",
			"tablesunit": "tables",
			"playersunit": "players",
			"note": "Balanced round-robin assignment; table sizes differ by at most one. Press Redraw for a fresh random seating."
		},
		"playerstatspage": {
			"title": "Player Results",
			"back": "Back",
			"sessions": "Total Sessions",
			"itm": "ITM Count",
			"buyin": "Total Buy-in",
			"win": "Total Winnings",
			"profit": "Net Profit",
			"roi": "ROI",
			"itmrate": "ITM Rate",
			"avg": "Avg per Session",
			"note": "ROI = net profit / total buy-in; ITM rate = ITM count / total sessions. Positive profit means long-term winning."
		},
		"mincashpage": {
			"title": "Min Cash Multiple",
			"back": "Back",
			"buyin": "Buy-in",
			"pay": "Min Cash Payout",
			"mult": "Min Cash Multiple",
			"breakeven": "Break-even ITM Rate",
			"net": "Min Cash Net",
			"note": "Multiple = min cash payout / buy-in. Break-even ITM rate = buy-in / min cash payout, the minimum cash rate needed if you only ever min-cash."
		},
		"bountypage": {
			"title": "Bounty Value",
			"back": "Back",
			"head": "Bounty per Head",
			"mode": "Bounty Mode",
			"modenormal": "Normal Bounty (full to pocket)",
			"modepko": "PKO (half pocket, half on head)",
			"kos": "Knockouts",
			"per": "Pocket per KO",
			"cash": "Total Cash Pocketed",
			"headgrow": "Your Head Bounty Growth",
			"note": "PKO mode: when you knock someone out, half of their bounty is pocketed and half is added to your own head (making you a richer target). Normal mode: the full bounty is pocketed."
		},
		"sprpage": {
			"title": "SPR Calculator",
			"back": "Back",
			"stack": "Effective Stack",
			"pot": "Pot",
			"value": "SPR",
			"zone": "Commitment",
			"zonelow": "Low SPR - committed",
			"zonemid": "Medium SPR",
			"zonehigh": "High SPR - cautious",
			"guidelow": "SPR < 3: top pair or an overpair is usually enough to stack off; commit with strong flopped hands.",
			"guidemid": "SPR 4-6: need a strong made hand or strong draw to commit; avoid playing a huge pot with just top pair.",
			"guidehigh": "SPR > 6: even top pair top kicker may not be enough; favor pot control and commit with near-nut strength.",
			"guidenone": "Enter the pot and effective stack.",
			"note": "SPR = effective stack / pot. Lower SPR makes it easier to commit a good hand; higher SPR demands caution, as top pair top kicker may not be enough."
		},
		"evenchoppage": {
			"title": "Even Chop",
			"back": "Back",
			"prize": "Remaining Prize",
			"players": "Players Left",
			"reserve": "Reserve for Winner (optional)",
			"each": "Each Player",
			"winner": "Winner Total",
			"note": "A pure even chop ignores chip counts and splits remaining prize equally. With a winner reserve, that amount is set aside, the rest is split, and the winner also takes the reserve."
		},
		"tablefeepage": {
			"title": "Table Fee / Hourly",
			"back": "Back",
			"tables": "Tables",
			"rate": "Per Table per Hour",
			"hours": "Hours",
			"people": "People Sharing",
			"total": "Total Cost",
			"pertable": "Per Table",
			"perhead": "Per Person",
			"note": "Total cost = tables x per-table hourly x hours. Per person = total cost / people sharing. Useful for cash-game time charges or venue cost sharing."
		},
		"staffpaypage": {
			"title": "Staff Pay",
			"back": "Back",
			"hourly": "Hourly Rate",
			"hours": "Hours",
			"bonus": "Event Bonus",
			"transport": "Transport Allowance",
			"count": "Headcount",
			"per": "Per Person",
			"base": "Hourly Portion",
			"total": "Grand Total",
			"note": "Per person = hourly x hours + event bonus + transport. Grand total = per person x headcount (assumes identical terms; recompute per person as needed)."
		},
		"bluffpage": {
			"title": "Bluff Balance",
			"back": "Back",
			"pot": "Pot",
			"bet": "Bet Size",
			"value": "Value Combos (optional)",
			"size": "Bet vs Pot",
			"frac": "Bluff Share of Bets",
			"ratio": "Value : Bluff",
			"combo": "Suggested Bluff Combos",
			"note": "At balance, the bluff share of the betting range = bet / (pot + 2 x bet). Value:bluff ratio = (pot + bet):bet. Suggested bluff combos = value combos x bet / (pot + bet)."
		},
		"matchuppage": {
			"title": "All-in Matchup Table",
			"back": "Back",
			"hcase": "Matchup Type",
			"hexample": "Example",
			"hequity": "Equity",
			"note": "Approximate preflop all-in equities (varies a little by exact cards). Suited adds about 2-4%. Use the Equity Solver for exact numbers."
		},
		"glossarypage": {
			"title": "Poker Glossary",
			"back": "Back",
			"search": "Search Chinese / English / keyword",
			"terms": "terms",
			"noresult": "No matching term"
		},
		"rulespage": {
			"title": "Rules Quick Reference",
			"back": "Back",
			"search": "Search rule keyword",
			"noresult": "No matching rule",
			"note": "A summary of common tournament rules for quick on-floor reference; official rulings follow the house rules and the floor's decision."
		},
			"tdarulespage": {
				"title": "TDA Rulebook",
				"back": "Back",
				"opennewtab": "Open in New Tab",
				"zhtw": "中文",
				"en": "English",
				"note": "The 2024 Poker TDA (Tournament Directors Association) rules. The Chinese edition is a translation; the English original and the on-site floor ruling are authoritative."
			},
"handrankingpage": {
			"title": "Hand Rankings",
			"back": "Back",
			"note": "Highest to lowest. Within the same category, the kicker decides."
		},
		"positionspage": {
			"title": "Positions",
			"back": "Back",
			"note": "Shown for a 9-handed table, early to late. Later positions see more info and open wider."
		},
		"drawoutspage": {
			"title": "Draws & Outs",
			"back": "Back",
			"hdraw": "Draw",
			"houts": "Outs",
			"hturn": "Turn",
			"hriver": "Turn+River",
			"note": "Turn = chance to hit on one card (≈ outs x2); Turn+River = two cards from the flop (≈ outs x4). Approximate."
		},
		"regprogresspage": {
			"title": "Registration / Prize Progress",
			"back": "Back",
			"current": "Current Entries",
			"target": "Target Entries",
			"per": "Prize Pool per Entry",
			"guarantee": "Guarantee",
			"bar": "Registration Progress",
			"pool": "Current Prize Pool",
			"gap": "Gap to Guarantee",
			"need": "Entries Needed",
			"note": "Current pool = current entries x prize per entry. A positive gap means the guarantee is not met yet (possible overlay); N more entries are needed."
		},
		"depthstrategypage": {
			"title": "Stack Depth Strategy",
			"back": "Back",
			"stack": "Stack",
			"bb": "Current BB",
			"bbcount": "Big Blinds",
			"zonelabel": "Zone",
			"zonedeep": "Deep (>100 BB)",
			"zonenormal": "Standard (40-100 BB)",
			"zonemid": "Medium-short (25-40 BB)",
			"zoneshort": "Short (15-25 BB)",
			"zonepush": "Push/Fold (<15 BB)",
			"advicedeep": "Play speculative hands and deep-stack pots; value postflop play and implied odds, avoid stacking off light.",
			"advicenormal": "Standard tournament depth; balance opens and 3-bets, widen in late position.",
			"advicemid": "Tighten speculative hands, value position; 3-bet or fold to raises, call less.",
			"adviceshort": "Enter push/fold and shallow play; apply pressure with raise-shoves, pick call-offs carefully.",
			"advicepush": "Mostly open-shove or fold; consult push/fold ranges by position and BB count.",
			"advicenone": "Enter the big blind.",
			"note": "Zones by big blinds: >100 deep, 40-100 standard, 25-40 medium-short, 15-25 short, <15 push/fold."
		},
		"preflopoddspage": {
			"title": "Preflop Odds",
			"back": "Back",
			"note": "Common preflop / flop probability references (approximate)."
		},
		"oddsconvpage": {
			"title": "Odds Converter",
			"back": "Back",
			"sec1": "Equity -> Odds",
			"pct": "Equity (%)",
			"against": "Odds Against",
			"decimal": "Decimal Odds",
			"sec2": "Odds -> Equity",
			"oddsa": "Odds A (win)",
			"oddsb": "Odds B (stake)",
			"implied": "Implied Equity",
			"note": "Odds against = (1 - equity) / equity, written as X : 1. Implied equity = B / (A + B)."
		},
		"chipcolorpage": {
			"title": "Chip Color Reference",
			"back": "Back",
			"note": "Common cash-game chip colors for reference only; venues and tournaments vary, follow the on-site posting."
		},
		"handsestpage": {
			"title": "Hands Estimate",
			"back": "Back",
			"sec": "Avg Seconds per Hand",
			"level": "Level Minutes",
			"hour": "Hands per Hour",
			"levelhands": "Hands per Level",
			"note": "Hands per hour = 3600 / seconds per hand. Live tables commonly run ~25-30/hour (~120-140s per hand); fewer players or faster dealing run more."
		},
		"effstackpage": {
			"title": "Effective Stack",
			"back": "Back",
			"you": "Your Stack",
			"opp": "Opponent Stack",
			"bb": "Big Blind (optional)",
			"eff": "Effective Stack",
			"bbcount": "Effective BB",
			"note": "Effective stack = the smaller of the two stacks, i.e. the most you can win or lose this hand. Multiway, take the smaller of you vs each opponent."
		},
		"bankrollpage": {
			"title": "Bankroll Guide",
			"back": "Back",
			"type": "Game Type",
			"buyin": "Average Buy-in",
			"cons": "Conservative (buy-ins)",
			"std": "Standard",
			"agg": "Aggressive",
			"opt_mtt": "MTT",
			"opt_pko": "PKO Bounty",
			"opt_sng": "SNG / Single Table",
			"opt_cash": "Cash Game",
			"note": "Variance differs by format; bankroll is given in buy-ins: conservative / standard / aggressive. MTTs have the highest variance and need the most buy-ins. General reference, not investment advice."
		},
		"tipsharepage": {
			"title": "Tip Share",
			"back": "Back",
			"total": "Total Tips",
			"dealers": "Dealer Count",
			"floor": "Floor Cut (%)",
			"floorcut": "Floor Share",
			"pool": "Dealer Pool",
			"each": "Per Dealer",
			"note": "Floor share = total tips x cut%. The rest is split evenly among dealers. Adjust the cut to your house policy."
		},
		"levelclockpage": {
			"title": "Level Clock Sheet",
			"back": "Back",
			"start": "Start Time",
			"levelmin": "Level Minutes",
			"total": "Total Levels",
			"every": "Break Every",
			"breakmin": "Break Minutes",
			"hitem": "Item",
			"hstart": "Start",
			"hend": "End",
			"breaklabel": "Break",
			"note": "Lists the start/end clock time of each level and break (breaks accumulated). Print and post at the tournament desk."
		},
		"chipcountpage": {
			"title": "Chip Count",
			"back": "Back",
			"denom": "Denomination",
			"count": "Count",
			"sub": "Subtotal",
			"total": "Total Value",
			"chips": "Total Chips",
			"note": "Enter chip counts per denomination for a live total; handy for counting a stack or reconciling chips. Denominations are editable."
		},
		"cbetpage": {
			"title": "C-bet Reference",
			"back": "Back",
			"note": "Continuation-bet frequency and sizing vary by board texture. These are general principles; adjust to opponents and ranges in practice."
		},
		"blinddefensepage": {
			"title": "Big Blind Defense",
			"back": "Back",
			"hpos": "Raiser Position",
			"hdefend": "Defend Range",
			"hnote": "Notes",
			"note": "Rough big-blind defense vs a 2-2.5bb single raise (calls plus 3-bets). Later positions and better pot odds mean wider defense."
		},
		"checklistpage": {
			"title": "Host Checklist",
			"back": "Back",
			"progress": "Completion",
			"reset": "Reset",
			"note": "Checked items are saved on this device, useful for tracking before-start, in-game, and closing tasks on event day."
		},
		"namegenpage": {
			"title": "Event Name Ideas",
			"back": "Back",
			"day": "Slot",
			"tier": "Buy-in Tier",
			"format": "Format",
			"flavor": "Flavor",
			"note": "Combines your selections into name ideas live; pure templates (not AI). Use directly or as inspiration."
		},
		"winratepage": {
			"title": "Cash Hourly Estimator",
			"back": "Back",
			"winrate": "Win Rate (bb/100)",
			"bb": "Big Blind ($)",
			"hands": "Hands per Hour",
			"hours": "Hours",
			"per100": "Per 100 Hands",
			"hourly": "Expected Hourly",
			"session": "Session Expectation",
			"note": "Expected hourly = (bb/100 / 100) x big blind x hands per hour. A long-run expectation; short-term swings are large."
		},
		"addonevpage": {
			"title": "Is the Add-on Worth It",
			"back": "Back",
			"buyin": "Initial Buy-in",
			"start": "Starting Chips",
			"fee": "Add-on Cost",
			"chips": "Add-on Chips",
			"basecost": "Initial Cost per Chip",
			"addoncost": "Add-on Cost per Chip",
			"verdict": "Verdict",
			"good": "Worth it",
			"bad": "Not worth it",
			"equal": "Same",
			"note": "A lower cost per chip is better value. When the add-on's cost per chip is below the initial buy-in, it is usually good value chip-wise; still consider ICM and remaining depth."
		},
		"countdownpage": {
			"title": "Countdown Timer",
			"back": "Back",
			"target": "Target Time",
			"remain": "Time Remaining",
			"counting": "Counting down",
			"passed": "Past the target time",
			"note": "Counts down to the target time today; if past, shows the elapsed overrun. Use for start, late reg close, break end, etc."
		},
		"staffingpage": {
			"title": "Staffing Plan",
			"back": "Back",
			"players": "Players",
			"seats": "Seats per Table",
			"relief": "Relief Ratio (%)",
			"tables": "Tables",
			"dealers": "Dealers",
			"floor": "Floor",
			"assist": "Assistants",
			"note": "Dealers = tables x (1 + relief ratio); Floor ~ 1 per 8 tables (min 1); Assistants ~ 1 per 6 tables (min 1). Rough guidance; adjust to your operation."
		},
		"preflopsizepage": {
			"title": "Preflop Raise Sizing",
			"back": "Back",
			"note": "Rough preflop raise sizing by situation. Online tends smaller, live larger; sizes go up slightly with antes. General principles; adjust to the table."
		},
		"winprobpage": {
			"title": "Chip Win Probability",
			"back": "Back",
			"stacks": "Stacks (comma separated)",
			"total": "Total Chips",
			"players": "players",
			"seat": "Seat",
			"empty": "Enter at least one stack",
			"note": "Simplified model: win probability ~ chip share (chip-chop). Ignores skill edge and payout ICM; quick reference only."
		},
		"bbantepage": {
			"title": "BB Ante Converter",
			"back": "Back",
			"bb": "Big Blind",
			"players": "Players",
			"ante": "Traditional Ante (each)",
			"tradtotal": "Traditional Ante per Hand",
			"bbante": "BB Ante per Hand",
			"equiv": "Equivalent Ante per Player",
			"note": "Traditional ante per hand = ante each x players. The BB ante posts one big blind, so per hand equals the big blind. Equivalent per-player ante = big blind / players, to align the two structures."
		},
		"bustratepage": {
			"title": "Bust Rate Estimator",
			"back": "Back",
			"start": "Starting Players",
			"current": "Current Players",
			"elapsed": "Elapsed (minutes)",
			"target": "Target Players Left",
			"rate": "Bust Rate",
			"eta": "Est. Remaining",
			"total": "Est. Total Time",
			"perhour": "players/hr",
			"reached": "Target reached",
			"hour": "h",
			"min": "min",
			"note": "Bust rate = (start - current) / elapsed. Est. remaining = (current - target) / rate. Late-stage busts slow down; rough estimate only."
		},
		"roitargetpage": {
			"title": "ROI Target Backsolve",
			"back": "Back",
			"buyin": "Buy-in (incl. fee)",
			"roi": "Target ROI (%)",
			"games": "Number of Events",
			"avg": "Avg Cash Needed per Event",
			"totalbuyin": "Total Invested",
			"totalcash": "Total Cash Needed",
			"note": "Avg cash needed per event = buy-in x (1 + target ROI%). The long-run average cash per event must reach this to hit the target ROI."
		},
		"tablebalancepage": {
			"title": "Table Balance Advisor",
			"back": "Back",
			"counts": "Players per Table (comma)",
			"summary": "Total Players",
			"tablesunit": "tables",
			"table": "Table",
			"over": "Over",
			"under": "Under",
			"ok": "OK",
			"empty": "Enter players per table",
			"balanced": "Already balanced (tables within 1).",
			"targetprefix": "Ideal ",
			"targetsuffix": " per table",
			"moveprefix": "move about ",
			"movesuffix": " from full tables to short ones",
			"note": "Ideal table sizes differ by at most one. Flags over/under tables and suggests moving from full tables to short ones."
		},
		"investtrackerpage": {
			"title": "Player Investment Tracker",
			"back": "Back",
			"buyin": "Buy-in",
			"rebuycount": "Rebuy Count",
			"rebuyamt": "Rebuy Amount",
			"addon": "Add-on Amount",
			"fee": "Total Fees",
			"win": "Winnings",
			"total": "Total Invested",
			"profit": "Event Net",
			"roi": "Event ROI",
			"note": "Total invested = buy-in + rebuy count x rebuy amount + add-on + fees. Event net = winnings - total invested. Track a single event live."
		},
		"structurecheckpage": {
			"title": "Structure Speed Check",
			"back": "Back",
			"mult": "Raise Factor",
			"levelmin": "Level Minutes",
			"levelshr": "Levels per Hour",
			"growth": "Blind Growth per Hour",
			"verdict": "Verdict",
			"slow": "Slow (deepstack)",
			"standard": "Standard",
			"fast": "Fast (turbo)",
			"note": "Blind growth per hour = raise factor ^ (levels per hour). Roughly < 2x slow (deep), 2-4x standard, > 4x fast (turbo)."
		},
		"breakevenpage": {
			"title": "Host Break-even",
			"back": "Back",
			"cost": "Fixed Cost",
			"fee": "Fee per Entry",
			"per": "Prize per Entry",
			"guarantee": "Guarantee",
			"be": "Break-even Entries",
			"guar": "Entries to Cover Guarantee",
			"overlay": "Overlay per Missing Entry",
			"people": "entries",
			"never": "Not achievable",
			"note": "Below the guarantee, each extra entry reduces overlay (by the prize per entry). Break-even considers both fee revenue and overlay coverage."
		},
		"satellitepage": {
			"title": "Satellite Seat Calculator",
			"back": "Back",
			"entries": "Entries",
			"buyin": "Prize per Entry",
			"seat": "Seat Value (target buy-in)",
			"pool": "Total Prize Pool",
			"seats": "Seats",
			"cash": "Leftover Cash",
			"ratio": "Entries per Seat",
			"note": "Seats = prize pool / seat value (rounded down). Leftover cash usually goes to the bubble. Entries per seat = entries / seats; higher means harder to qualify."
		},
		"impliedoddspage": {
			"title": "Implied Odds",
			"back": "Back",
			"pot": "Current Pot",
			"call": "Amount to Call",
			"future": "Est. Future Winnings",
			"eq": "Your Equity (%)",
			"direct": "Direct Equity Needed",
			"implied": "Equity Needed with Implied",
			"verdict": "Advice",
			"callit": "Call",
			"foldit": "Fold",
			"note": "Direct equity needed = call / (pot + call). With implied = call / (pot + call + future winnings). If your equity meets the implied threshold, calling is fine."
		},
		"stakingmarkuppage": {
			"title": "Staking / Markup",
			"back": "Back",
			"buyin": "Total Buy-in",
			"sold": "Percent Sold (%)",
			"markup": "Markup Multiple",
			"paid": "Backer Pays",
			"cost": "Your Net Cost",
			"keep": "Your Retained Equity",
			"locked": "Markup Locked Profit",
			"note": "Backer pays = buy-in x sold% x markup. Your net cost = buy-in - backer payment. The backer gets sold% of winnings; you keep the rest. Markup locked profit = buy-in x sold% x (markup - 1)."
		},
		"chipinventorypage": {
			"title": "Room Chip Inventory",
			"back": "Back",
			"entries": "Entries",
			"denom": "Denomination",
			"per": "Count Each",
			"total": "Room Total",
			"chips": "Total Chips Needed",
			"value": "Total Face Value",
			"note": "Room total = count each x entries. Estimates how many chips of each denomination to prepare (keep ~10% extra for rebuys/color-ups)."
		},
		"bountypoolpage": {
			"title": "Bounty Pool Estimator",
			"back": "Back",
			"entries": "Entries / Buy-ins",
			"head": "Bounty per Head",
			"mode": "Bounty Mode",
			"modenormal": "Normal Bounty",
			"modepko": "PKO (half pocket, half head)",
			"total": "Total Bounty Pool",
			"start": "Starting Head Bounty",
			"pocket": "Pocketed per KO",
			"note": "Total bounty pool = entries x bounty per head. PKO: starting head = bounty / 2; a knockout pockets half and adds half to your head. Normal: a knockout pockets the full bounty."
		},
		"blindcatchuppage": {
			"title": "Blinds Catch-up",
			"back": "Back",
			"stack": "Current Stack",
			"bb": "Current Big Blind",
			"mult": "Raise Factor",
			"levelmin": "Level Minutes",
			"threshold": "Short-stack Threshold (BB)",
			"now": "Current BB Count",
			"levelsto": "Levels Until Short",
			"time": "Approx Time",
			"then": "BB Count Then",
			"levels": "levels",
			"already": "Already short",
			"hour": "h",
			"min": "min",
			"note": "Assumes the stack stays fixed and only blinds rise. Each level the big blind x factor; computes how many levels/how long until your BB count drops below the threshold (push/fold zone)."
		},
		"threebetrangepage": {
			"title": "3-bet / 4-bet Ranges",
			"back": "Back",
			"note": "Rough 3-bet / 4-bet value and bluff range reference. Value hands want calls; bluffs pick blocker hands (with an A or K). Adjust to opponents and depth."
		},
		"riverbetpage": {
			"title": "River Betting Reference",
			"back": "Back",
			"note": "On the river there is no later street, so value and bluffs are polarized. Bigger bets allow more bluffs but need stronger value backing; thin value uses small sizes."
		},
		"dealersoppage": {
			"title": "Dealer Procedure",
			"back": "Back",
			"note": "Common dealing procedure and error handling for new dealers; official rulings follow the house rules and the floor decision."
		},
		"bubblepressurepage": {
			"title": "Bubble Pressure",
			"back": "Back",
			"remain": "Players Left",
			"paid": "Paid Spots",
			"stack": "Your Stack",
			"avg": "Average Stack",
			"dist": "From the Money",
			"rel": "Relative Stack",
			"level": "Pressure Level",
			"people": "to go",
			"inmoney": "In the money",
			"lvnone": "Released",
			"lvlow": "Low",
			"lvmed": "Medium",
			"lvhigh": "High",
			"lvextreme": "Extreme",
			"advnone": "Already in the money; open up and play for a higher finish.",
			"advlow": "You are a big stack; pressure the mid and short stacks who must fold to survive.",
			"advmed": "Standard bubble; pressure the right spots and opponents, avoid clashing with big stacks for no reason.",
			"advhigh": "Near the bubble and not deep; be more careful calling all-ins, prioritize cashing.",
			"advextreme": "On the bubble and short; ICM pressure is extreme; avoid busting without a premium and let others go first.",
			"note": "Closer to the money and shorter stacks mean more ICM pressure (survival first); big stacks can pressure mid/short stacks. A rough hint, not exact ICM."
		},
		"cashreconcilepage": {
			"title": "Cash Reconciliation",
			"back": "Back",
			"entries": "Entries",
			"entryfee": "Entry Fee",
			"rebuycount": "Rebuy Count",
			"rebuyamt": "Rebuy Amount",
			"addoncount": "Addon Count",
			"addonamt": "Addon Amount",
			"refund": "Total Refunds",
			"actual": "Cash Collected",
			"due": "Total Due",
			"got": "Collected",
			"diff": "Difference",
			"note": "Due = entries x fee + rebuy x amount + addon x amount - refunds. Difference = collected - due: positive is over, negative is short, 0 balances."
		},
		"refundpage": {
			"title": "Refund Calculator",
			"back": "Back",
			"paid": "Amount Paid",
			"fee": "Of Which Fee",
			"policy": "Refund Policy",
			"opt_full": "Full refund",
			"opt_fee": "Refund minus fee",
			"opt_none": "No refund",
			"opt_half": "Half refund",
			"refund": "Refund Amount",
			"keep": "Host Keeps",
			"note": "By policy: full = all back; minus fee = paid - fee; none = 0; half = paid / 2. Actual terms follow the house rules."
		},
		"regpacepage": {
			"title": "Registration Pace",
			"back": "Back",
			"current": "Current Entries",
			"target": "Target Entries",
			"open": "Minutes Open",
			"left": "Minutes Left",
			"pace": "Current Pace",
			"need": "Pace to Hit Target",
			"proj": "Linear Projection",
			"perhour": "per hour",
			"people": "entries",
			"reached": "Target reached",
			"note": "Current pace = current entries / time open. Pace to target = entries needed / time left. Linear projection = current + current pace x time left."
		},
		"waitlistpage": {
			"title": "Waitlist Estimator",
			"back": "Back",
			"list": "Waitlist Size",
			"pos": "Your Position",
			"rate": "Seats Open per Hour",
			"you": "Your Est. Wait",
			"all": "Time to Clear All",
			"never": "Cannot estimate",
			"hour": "h",
			"min": "min",
			"note": "Your est. wait = your position / seats-per-hour rate. Time to clear = waitlist size / rate. Seat rate fluctuates; rough estimate only."
		},
		"kpipage": {
			"title": "Event KPI Summary",
			"back": "Back",
			"entries": "Entries",
			"revenue": "Total Revenue",
			"pool": "Prize Pool",
			"cost": "Host Cost",
			"per": "Revenue per Entry",
			"rake": "Rake Rate",
			"share": "Prize Pool Share",
			"profit": "Host Profit",
			"margin": "Profit Margin",
			"note": "Rake rate = (revenue - prize pool) / revenue. Host profit = revenue - prize pool - cost (assuming the pool is paid from revenue). Margin = profit / revenue."
		},
		"potbuilderpage": {
			"title": "Pot Growth",
			"back": "Back",
			"start": "Preflop Pot",
			"flop": "Flop Bet (% pot)",
			"turn": "Turn Bet (% pot)",
			"river": "River Bet (% pot)",
			"pflop": "Pot After Flop",
			"pturn": "Pot After Turn",
			"priver": "Pot After River",
			"growth": "Total Growth",
			"note": "Assumes one bet per street that is called: bet = current pot x fraction, pot grows by 2x the bet (both players). Quickly estimates the pot on each street and the final pot."
		},
		"chipauditpage": {
			"title": "Chip Total Audit",
			"back": "Back",
			"entries": "Entries",
			"start": "Starting Chips",
			"rebuycount": "Rebuy Count",
			"rebuychip": "Rebuy Chips",
			"addoncount": "Addon Count",
			"addonchip": "Addon Chips",
			"actual": "Counted Total",
			"expected": "Expected Total",
			"counted": "Counted Total",
			"diff": "Difference",
			"note": "Expected total = entries x start + rebuy count x rebuy chips + addon count x addon chips. Difference = counted - expected; non-zero means over/under issuance or a counting error."
		},
		"partnersplitpage": {
			"title": "Profit Partner Split",
			"back": "Back",
			"total": "Total Amount",
			"shares": "Shares (% comma separated)",
			"sum": "Sum of Shares",
			"partner": "Partner",
			"empty": "Enter the shares",
			"negative": "Shares cannot be negative. Enter 0 or a positive number.",
			"note": "Splits the total amount by the given shares. Shares should sum to 100%; if not, it still normalizes by ratio and flags it."
		},
		"payouttablepage": {
			"title": "Payout Table",
			"back": "Back",
			"pool": "Prize Pool",
			"places": "Paid Places",
			"steep": "Concentration",
			"round": "Round Cash To",
			"hrank": "Rank",
			"hcash": "Payout",
			"hpct": "Share",
			"note": "Builds a top-heavy payout curve by concentration (geometric decay), adding the rounding remainder to first so the total equals the prize pool. Lower concentration is more top-heavy.",
			"cutoff": "(At this concentration and rounding, only {n} places can be paid.)"
		},
		"icmpage": {
			"title": "ICM / Deal",
			"back": "Back",
			"stacks": "Stacks",
			"payouts": "Payouts",
			"result": "Expected Value",
			"player": "Player",
			"rank": "Rank",
			"remove": "Remove",
			"minstack": "At least 2 players required",
			"minpayout": "At least 1 payout required",
			"icmev": "ICM EV",
			"chipchop": "Chip-Chop",
			"note": "ICM uses the Malmuth–Harville model; Chip-Chop splits the total prize by chip share."
		},
		"stackcalcpage": {
			"title": "Stack Calculator",
			"back": "Back",
			"stack": "Stack",
			"sb": "Small Blind",
			"bb": "Big Blind",
			"ante": "Ante",
			"players": "Players",
			"bbcount": "Big Blinds (BB)",
			"m": "M-ratio",
			"effm": "Effective M",
			"ante_bba": "Big-blind ante",
				"ante_each": "Per player",
				"ante_none": "No ante",
				"deductorbit": "Deduct this orbit",
				"note": "Big-blind ante = one ante for the whole table (modern tournament standard): M = stack / (SB + BB + ante). Per-player ante: M = stack / (SB + BB + ante x players). No ante: M = stack / (SB + BB). Effective M = M x (players / 10)"
		},
		"contactpage": {
			"title": "Contact Us",
			"heading": "Contact Us",
			"desc": "Send us feature ideas, bug reports, usage questions, or collaboration thoughts here. Your feedback goes into the admin inbox for follow-up.",
			"reporttitle": "Good things to report here",
			"reportdesc": "Tournament flow suggestions, registration or seating issues, timer requests, open-source deployment problems, UI bugs, translation issues, and stats anomalies.",
			"name": "Name",
			"subject": "Subject",
			"subjectplaceholder": "Example: Registration list suggestion",
			"message": "Message",
			"submit": "Send Message",
			"submitting": "Sending...",
			"requiredwarning": "Please fill in name, email, and message",
			"success": "Your message was received. Thank you for the feedback.",
			"fail": "Send failed",
			"namerequired": "Please fill in your name",
			"emailrequired": "Please fill in your email",
			"emailinvalid": "Email format is invalid",
			"messagerequired": "Please fill in your message"
		},
		"contactadminpage": {
			"title": "Contact Admin",
			"heading": "Contact Admin",
			"filterlabel": "Filter message status",
			"allstatus": "All Statuses",
			"new": "New",
			"read": "Read",
			"done": "Done",
			"reload": "Reload",
			"nosubject": "No subject",
			"linkeduser": "Signed-in user: ",
			"unlinkeduser": "No linked signed-in user",
			"replied": "Replied",
			"replyto": "Reply to",
			"replysubjectprefix": "Re: ",
			"replysubjectdefault": "Re: PokerTrace Contact",
			"replyplaceholder": "Write the reply you want to send to the user",
			"replysend": "Send Reply",
			"replysending": "Sending...",
			"empty": "There are no contact messages right now",
			"prev": "Previous",
			"next": "Next",
			"pageprefix": "Page",
			"pageslash": "/",
			"pagesuffix": "",
			"loadfail": "Load failed",
			"statussaved": "Status updated",
			"statussavefail": "Update failed",
			"replyrequired": "Please enter a reply",
			"replysuccess": "Reply sent",
			"replyfail": "Send failed"
		},
		"notificationpage": {
			"eyebrow": "Notification",
			"title": "Notifications",
			"refresh": "Refresh",
			"readall": "Mark all read",
			"empty": "No notifications",
			"markread": "Mark read",
			"delete": "Delete",
			"unread": "Unread",
			"loadfail": "Load failed",
			"deleteconfirm": "Delete this notification?",
			"search": "Search",
			"searchplaceholder": "Search title or message"
		},
		"adminlogpage": {
			"title": "System API Log",
			"heading": "System API Log",
			"searchplaceholder": "Search by name/email/player ID/API/method/IP",
			"search": "Search",
			"erroronly": "Non-200 only",
			"reload": "Reload",
			"coltime": "Time",
			"coluser": "User",
			"colmethod": "Method",
			"colpath": "API",
			"colstatus": "Status",
			"colip": "IP",
			"colagent": "Device/Browser",
			"detailtitle": "Details",
			"unknownuser": "Unknown user",
			"anonymous": "Not signed in",
			"empty": "There are no records right now",
			"loadfail": "Load failed",
			"eyebrow": "API Access Log"
		},
		"adminuserpage": {
			"tablog": "Records",
			"tabuser": "Users",
			"eyebrow": "User Management",
			"heading": "User Management",
			"searchplaceholder": "Search by name/email/player ID",
			"search": "Search",
			"reload": "Reload",
			"colname": "Name",
			"colplayerid": "Player ID",
			"colemail": "Email",
			"colpermission": "Permission",
			"colstatus": "Status",
			"colcreatetime": "Created",
			"colaction": "Actions",
			"adminhint": "Lv4 and above are administrators",
			"statusactive": "Active",
			"statusblocked": "Temporarily blocked",
			"statusbanned": "Permanently banned",
			"expirylabel": "Expires",
			"reasonlabel": "Reason",
			"selftag": "You",
			"block": "Temporary block",
			"ban": "Permanent ban",
			"unban": "Unblock",
			"empty": "There are no users right now",
			"loadfail": "Load failed",
			"blockmodaltitle": "Temporarily block user",
			"blockreasonlabel": "Block reason",
			"blockreasonplaceholder": "Enter a reason",
			"blockdurationlabel": "Block duration",
			"duration1hour": "1 hour",
			"duration1day": "1 day",
			"duration3day": "3 days",
			"duration7day": "7 days",
			"duration30day": "30 days",
			"banmodaltitle": "Permanently ban user",
			"banreasonlabel": "Ban reason",
			"banreasonplaceholder": "Enter a reason",
			"banconfirm": "Confirm permanent ban? This will sign the user out everywhere.",
			"unbanconfirm": "Remove this user's block/ban?",
			"cancel": "Cancel",
			"submit": "Submit",
			"reasonrequired": "Please enter a reason",
			"permissionupdated": "Permission updated",
			"blocksuccess": "User blocked",
			"bansuccess": "User banned",
			"unbansuccess": "Unblocked",
			"actionfail": "Action failed",
			"selfprotect": "You cannot perform this action on yourself"
		},
		"guidepage": {
			"title": "Guide",
			"description": "PokerTrace guide covering sessions, registration and seating, the timer, hand logging, stats and payouts, series, broadcast and replay, staff hiring, on-site check-in, and the tool center.",
			"heading": "Guide",
			"lead": "This page organizes the complete PokerTrace workflows. Jump straight to the section that matches your role and what you need right now — from session setup, registration and seating, the timer, hand logging, and stats and payouts, to series, broadcast and replay, staff hiring, on-site check-in and receipts, and the tool center.",
			"chapterlabel": "Chapters",
			"position": "Jump to This Part",
			"copylink": "Copy Link",
			"chapterlink": "Chapter Link",
			"downloadpdf": "Download Intro PDF",
			"chaptereyebrow": "Workflow Chapter",
			"copysuccess": "Guide link copied",
			"copyfail": "Copy failed. Please copy the URL manually.",
			"copyunsupported": "This browser does not support automatic copy",
			"pagefallback": "Open Page",
			"expandall": "Expand All",
			"collapseall": "Collapse All",
			"stepslabel": "Steps",
			"toolslabel": "Tools",
			"tiplabel": "Tip",
			"chapters": [
				{
					"id": "start",
					"title": "Quick Start",
					"lead": "On your first visit to PokerTrace, sign in and finish your profile first — the system automatically creates a dedicated player ID for you. Once the basics are set, choose the flow that matches your on-site role (host/floor or player) to get up to speed faster.",
					"items": [
						{
							"id": "start-signin",
							"title": "Sign In or Sign Up",
							"desc": "PokerTrace uses one-step sign-in: the first time you sign in, the system creates your account automatically — no lengthy registration form. Everything (sessions, hands, reports) is tied to this account, so your data carries across devices.",
							"steps": [
								"From the home page, click \"Sign in\" at the top right to open the sign-in page.",
								"Enter your credentials and submit; the first sign-in creates your account automatically.",
								"After success you land on the dashboard and a dedicated player ID is generated.",
								"Go to your profile right away to confirm the player ID and finish basic settings."
							],
							"tip": "Your player ID is how other hosts find and link to you, so note it down for future registrations.",
							"tools": [
								{
									"name": "Google sign-in",
									"use": "Click to sign in with your Google account; the first sign-in creates your account automatically — no registration form."
								},
								{
									"name": "Fallback sign-in button",
									"use": "If the Google popup doesn't appear, use the fallback button lower on the page."
								},
								{
									"name": "Sign-in error message",
									"use": "On authentication failure, an error shows on the page — retry or switch accounts per the message."
								}
							],
							"pageurl": "signin.html",
							"pagelabel": "Open Sign-in Page"
						},
						{
							"id": "start-dashboard",
							"title": "Return to the dashboard for your next step",
							"desc": "The dashboard is your home after sign-in. It suggests the next action based on your current data and offers shortcuts to every major feature, so you don't have to hunt across pages.",
							"steps": [
								"Check the suggested-next-step cards at the top and finish anything still pending.",
								"To run an event, click \"Create session\" to start the new-session flow.",
								"To find an existing event, click \"Session list\" and use filters to locate it.",
								"To log only your own result, jump straight to personal result backfill."
							],
							"tip": "If you're unsure where to begin, just follow the dashboard's suggestion cards to walk the most common flow.",
							"tools": [
								{
									"name": "Profit summary cards",
									"use": "Show today / this week / this month profit and loss — green for gains, red for losses."
								},
								{
									"name": "Trend chart",
									"use": "A 7-day profit trend line for a quick look at recent performance."
								},
								{
									"name": "Suggested next steps",
									"use": "Lists recommended actions by your role (create, register, timer); click a card to go straight there."
								},
								{
									"name": "Quick access",
									"use": "Shortcuts to the session list, profile, and last-visited page — click to jump."
								}
							],
							"pageurl": "main.html",
							"pagelabel": "Open Dashboard"
						},
						{
							"id": "start-profile",
							"title": "Finish your personal settings first",
							"desc": "The profile page centralizes your identity, reports, and frequently used settings. Set up your chip colors and chip sets first so you can apply them quickly later in tables and hands without re-entering them.",
							"steps": [
								"Confirm your player ID is correct, and share it with hosts when needed.",
								"Set your common chip colors and denominations, and create at least one chip set.",
								"Review the monthly, yearly, and career reports to confirm data shows correctly.",
								"Maintain your hired staff list here if you work with assistants or floor staff."
							],
							"tip": "With chip sets configured, chip adjustments and hand logging go faster — do this first.",
							"tools": [
								{
									"name": "Player ID",
									"use": "Shows your dedicated ID, which you can give to hosts to link your registration."
								},
								{
									"name": "Language",
									"use": "Click \"中文 / English\" to switch the whole interface language instantly."
								},
								{
									"name": "Chip colors",
									"use": "Click \"Manage\" to open the editor and maintain the chip color names available to sessions."
								},
								{
									"name": "Chip sets",
									"use": "Click \"Manage\" to save common denomination sets for one-click import when creating sessions."
								},
								{
									"name": "Personal summary report",
									"use": "Switch monthly / yearly / career reports, and export CSV or open advanced reports."
								},
								{
									"name": "Tools",
									"use": "Provides on-site utilities like equity solver, pot odds, ICM, and a structure generator."
								}
							],
							"pageurl": "profile.html",
							"pagelabel": "Open Profile"
						}
					]
				},
				{
					"id": "host",
					"title": "Host Quick Flow",
					"lead": "The host (or floor/event-staff) flow follows four steps in order: create the session → use session detail as your hub → launch the timer control page → manage table seating and hands. These cover the most common operations from kickoff to wrap-up — follow them in sequence for a smooth event.",
					"items": [
						{
							"id": "host-create-session",
							"title": "1. Create a hosted session",
							"desc": "Creating the session is the starting point for all later data. Pick the correct game mode first (tournament / timed tournament / cash game) — the system shows the matching fields — then fill registration rules, fees, and advanced options in stages to avoid mistakes.",
							"steps": [
								"Open new session and choose \"Hosted game\" mode.",
								"Enter the basics: session name, date/time, location, and game format.",
								"Set registration rules: open registration, private game, rebuy/re-entry/addon.",
								"Add fees and guaranteed-prize advanced settings, then save."
							],
							"tip": "The game mode affects available fields and reports, so double-check it before you save.",
							"pageurl": "newsession.html",
							"pagelabel": "Open New Session"
						},
						{
							"id": "host-manage-session",
							"title": "2. Use session detail as your control hub",
							"desc": "Once created, the session detail page becomes the control hub for the whole event. Switch between overview, tables, hands, rankings, and other settings here — all on-site data branches from this entry point.",
							"steps": [
								"Open the session you just created from the session list.",
								"On \"Overview\", confirm basic info, registration status, and action buttons.",
								"Switch to the tables, hands, or rankings tabs as needed.",
								"Bookmark this page so you can return to the hub anytime on site."
							],
							"tip": "Session detail is the center of the host flow — when unsure where to go, return here first.",
							"pageurl": "sessionlist.html",
							"pagelabel": "Open Session List"
						},
						{
							"id": "host-run-timer",
							"title": "3. Launch the timer control page",
							"desc": "The control page is the main interface for live timing and event staff. Most floor actions happen here, and every change syncs in real time to the display page for players.",
							"steps": [
								"Open the control page from the session or host tools.",
								"Confirm the blind structure and current level, then start or pause the clock.",
								"Close registration, insert breaks, or adjust remaining time when appropriate.",
								"Handle bust-outs, remaining players, rankings, and marquee announcements."
							],
							"tip": "Control and display share the same session data, so every adjustment on control instantly appears on the big screen.",
							"pageurl": "control.html",
							"pagelabel": "Open Control Page"
						},
						{
							"id": "host-table-flow",
							"title": "4. Manage seating and hands",
							"desc": "When you need finer on-site data (seating, table moves, hand quality), go into table detail. Here you manage seat flow visually and connect it to hand logging and stats.",
							"steps": [
								"Open a specific table's detail from session detail.",
								"Set the max seats, first dealer, and your own seat, then save.",
								"Run a chip adjustment when needed so the next hand starts from the right stacks.",
								"Add a hand or review the hand list, stats, and EV chart."
							],
							"tip": "When a tournament needs to break a table, merge the whole table into a target one in table detail — seat history is fully preserved.",
							"pageurl": "table.html",
							"pagelabel": "Open Table Detail"
						}
					]
				},
				{
					"id": "player",
					"title": "Player Quick Flow",
					"lead": "The player flow is much leaner than the host flow and revolves around three things: finding and registering for sessions, tracking your results in your profile, and backfilling your own finishes when there's no host data. You never touch the timer or table setup.",
					"items": [
						{
							"id": "player-join-session",
							"title": "1. Find joinable sessions from the list",
							"desc": "The session list gathers every session relevant to you and offers several ways to filter, so you can quickly find your target among many events. Status tabs separate joinable, hosted-by-you, and already-joined sessions.",
							"steps": [
								"Open the session list and search by date, location, or title.",
								"Use quick filters to switch between joinable / hosted / already joined.",
								"Open the session detail to confirm rules, fees, and whether registration is open.",
								"When ready, register per the host's instructions (or provide your player ID)."
							],
							"tip": "If you can't find a session, check whether it's a private game or registration hasn't opened yet.",
							"pageurl": "sessionlist.html",
							"pagelabel": "Open Session List"
						},
						{
							"id": "player-check-profile",
							"title": "2. Review reports in your profile",
							"desc": "Your profile is where you track long-term performance. It automatically summarizes results across time ranges and game types, so you can see your profit trend without manual calculation.",
							"steps": [
								"Open your profile and switch between monthly, yearly, and career reports.",
								"View total buy-ins, profit, and ROI by game type.",
								"Confirm your hired staff and saved chip settings are correct.",
								"If a result is missing, head to the backfill flow to add it."
							],
							"tip": "Reports update instantly with newly logged results — backfill, then return here to see the refreshed numbers.",
							"pageurl": "profile.html",
							"pagelabel": "Open Profile"
						},
						{
							"id": "player-record-result",
							"title": "3. Backfill your own event results",
							"desc": "If you played an event hosted elsewhere with no full data in PokerTrace, use personal result mode to record only your own finish — keeping your reports complete without building the entire event.",
							"steps": [
								"Open new session and choose \"Personal result backfill\" mode.",
								"Fill in the session name, date, location, and game type.",
								"Enter your buy-ins, rebuys/addons, final place, and prize.",
								"Save, then check your profile to confirm the result is included."
							],
							"tip": "Backfill mode records only your own data and never affects other players — ideal for keeping personal records of outside events.",
							"pageurl": "newsession.html",
							"pagelabel": "Open Result Backfill"
						}
					]
				},
				{
					"id": "session",
					"title": "Session Management",
					"lead": "Sessions are the core container for everything in PokerTrace: tables, registration, timer, hands, and reports all hang under a session. Set the mode, rules, and links correctly and the rest of the flow connects properly — and your reports stay accurate.",
					"items": [
						{
							"id": "session-create",
							"title": "Create and classify sessions",
							"desc": "The session mode determines which fields you can fill and how reports are presented — the most important choice at creation. Tournament, timed tournament, and cash game each have different scoring and prize logic, so match it to the real game.",
							"steps": [
								"Open new session and decide: tournament, timed tournament, or cash game.",
								"Choose the game format (e.g. Hold'em, Omaha).",
								"Fill in the name, date/time, and location basics.",
								"Confirm the mode is correct, save, then move on to detail settings."
							],
							"tip": "Since the mode shapes the report structure, lock it in before kickoff; when unsure, choose by the actual scoring method.",
							"tools": [
								{
									"name": "Mode selection",
									"use": "Pick one of the \"Hosted game / Personal result backfill\" cards — it decides which fields appear next."
								},
								{
									"name": "Game format",
									"use": "Dropdown for tournament / timed tournament / cash game; drives the available fields and reports."
								},
								{
									"name": "Step navigation",
									"use": "Fill in order: Basics → Registration & rules → Costs & rewards → Advanced; each step validates."
								},
								{
									"name": "Basic info",
									"use": "Enter the required session name, venue, start date, and start/end times."
								},
								{
									"name": "AI event import",
									"use": "Paste event text from another site and click \"Parse and fill\" to auto-fill name, buy-in, and structure."
								},
								{
									"name": "Create session",
									"use": "Submit on the final step to officially create the session."
								}
							],
							"pageurl": "newsession.html",
							"pagelabel": "Open Session Creation"
						},
						{
							"id": "session-overview",
							"title": "Session detail overview",
							"desc": "The overview is the face of the session, showing key info, live status, notes, and the main action buttons. It's also the entry point into the tables, hands, and rankings sub-pages.",
							"steps": [
								"Open session detail and confirm the basics and current status on the overview.",
								"Use the notes area to record on-site reminders or special rules.",
								"Use the action buttons to start play, close registration, or adjust settings.",
								"Switch tabs to handle tables, hands, or rankings."
							],
							"tip": "The notes field is great for ad-hoc rules or on-site agreements — handy when handing off to other staff.",
							"tools": [
								{
									"name": "Main tabs",
									"use": "Overview / Tables / Hands / Rankings / Other to switch the session's function areas (Rankings is host-only)."
								},
								{
									"name": "Overview sub-tabs",
									"use": "General (info cards and action area), Info (structure details), and Notes."
								},
								{
									"name": "Info cards",
									"use": "Show estimated players, player type, current status, and the registration-close level/time."
								},
								{
									"name": "Setting badges",
									"use": "Registration closed, user linking, open registration, private game, etc. shown at a glance as yes/no."
								},
								{
									"name": "Action buttons",
									"use": "By role: registration console, timer control, display page, or \"Register now.\""
								},
								{
									"name": "Notes sub-tab",
									"use": "Shows the full session description and on-site reminders."
								}
							],
							"pageurl": "session.html",
							"pagelabel": "Open Session Detail"
						},
						{
							"id": "session-hosted-rules",
							"title": "Hosted game rules",
							"desc": "Hosted games offer full rule configuration, from how registration opens to the buy-in structure. These settings directly affect registration management and prize-pool calculation, so set them per your event's rules.",
							"steps": [
								"In rule setup, decide whether to open registration or make it a private game.",
								"Set the user-linking method so players can connect to real accounts.",
								"Enable and configure rebuy, re-entry, and addon conditions and fees.",
								"Enter guaranteed-prize (guarantee) settings, then save."
							],
							"tip": "A private game won't appear in the public joinable list — ideal for invite-only sessions.",
							"tools": [
								{
									"name": "User linking",
									"use": "Check to let players link the session to their accounts — a prerequisite for open registration."
								},
								{
									"name": "Open registration",
									"use": "Check to let players self-register from the session list (requires user linking first)."
								},
								{
									"name": "Private game",
									"use": "Check to hide the session from the public joinable list, limiting it to invited players."
								},
								{
									"name": "Rebuy / Re-entry / Addon counts",
									"use": "Enter how many rebuys, re-entries, and addons are allowed (0 means disabled)."
								},
								{
									"name": "Fees and chips",
									"use": "Set the fee, service fee, and chips for the buy-in and each rebuy/re-entry/addon."
								},
								{
									"name": "Guaranteed prize",
									"use": "Enter the guaranteed prize-pool amount used in the final prize-pool calculation."
								}
							],
							"pageurl": "newsession.html",
							"pagelabel": "Open Rule Setup"
						},
						{
							"id": "session-relations",
							"title": "Linked and extended events",
							"desc": "In the other-settings tab you can link related events together — for example a satellite advancing to a main event, or multiple days of one series — making them easy to track and roll up.",
							"steps": [
								"Open the session's \"Other settings\" tab.",
								"Create links to other sessions (e.g. satellite to main event).",
								"Add supplementary information and advanced options.",
								"Save, then track between the related sessions."
							],
							"tip": "For multi-day or series events, set up links first — rolling up results and advancement lists afterward becomes much easier.",
							"tools": [
								{
									"name": "Settings sub-tab",
									"use": "General settings, game settings, and delete session (a destructive action in red)."
								},
								{
									"name": "Relations sub-tab",
									"use": "Create satellite in/out and multi-day in/out links between events."
								},
								{
									"name": "Info sub-tab",
									"use": "Shows metadata like session id and querykey for reconciliation and bug reports."
								},
								{
									"name": "Game settings",
									"use": "Open the structure editor to adjust blind levels, antes, and timing."
								}
							],
							"pageurl": "session.html",
							"pagelabel": "Open Other Settings"
						}
					]
				},
				{
					"id": "players",
					"title": "Registration and Seating",
					"lead": "Registration handles \"who plays\" and seating handles \"where they sit.\" Once players are linked to real accounts, the seating page visualizes positions and fully preserves the event flow — sit-ins, table moves, eliminations — keeping on-site status and post-event reports in sync.",
					"items": [
						{
							"id": "players-registration",
							"title": "Registration management",
							"desc": "Registration management lets the host track each player's buy-in status. Beyond confirm and cancel, you can restore a mistakenly removed entry and log the buy-in structure line by line — the basis for prize-pool and report calculations.",
							"steps": [
								"View the current registration list in the session detail registration area.",
								"Confirm new registrations, or cancel / restore existing ones.",
								"Record buy-ins, fees, rebuys, re-entries, and addons line by line.",
								"Log ticket information for any ticket entries."
							],
							"tip": "Rebuys and re-entries affect total entries and the prize pool — logging each as it happens avoids reconciliation headaches afterward.",
							"tools": [
								{
									"name": "Registration console",
									"use": "Reached from session detail; the central place to manage the whole registration list and buy-ins."
								},
								{
									"name": "Confirm / Cancel / Restore",
									"use": "Toggle each player's registration status; a mistakenly removed entry can be brought back with Restore."
								},
								{
									"name": "Buy-in structure fields",
									"use": "Log buy-ins, fees, rebuys, re-entries, and addons line by line as the basis for prize-pool math."
								},
								{
									"name": "Ticket info",
									"use": "Record the ticket value when a player enters with a ticket."
								},
								{
									"name": "Seating sub-tab",
									"use": "Visualize linked players' seats on the table layout and highlight \"my seat.\""
								}
							],
							"pageurl": "session.html",
							"pagelabel": "Open Session Detail"
						},
						{
							"id": "players-seating",
							"title": "Seating and table moves",
							"desc": "The table detail page manages seating with a visual layout. You can set the table capacity and dealer, adjust each seat's state, and merge a whole table into another when breaking tables in a tournament.",
							"steps": [
								"Open table detail and set the max seats and first dealer.",
								"Set your own seat so hands can mark Hero later.",
								"Handle sit-in, swap, and leave events on each seat.",
								"To break a table, merge the whole table into a target table and save."
							],
							"tip": "Each seat keeps a full event history and supports tournament moves and fills, so you never overwrite old data.",
							"tools": [
								{
									"name": "Max seats",
									"use": "Dropdown for a 6/8/9/10-handed table; sets how many seat rows show."
								},
								{
									"name": "First dealer",
									"use": "Dropdown to set the dealer seat; the other seats reorder from it."
								},
								{
									"name": "Self seat",
									"use": "Dropdown to mark your own seat so hands can tag Hero."
								},
								{
									"name": "Player / chip fields",
									"use": "Assign a player and enter the starting stack per seat; tick \"Unknown stack\" when the count isn't known."
								},
								{
									"name": "Clear",
									"use": "Remove the player from a seat without recording an elimination."
								},
								{
									"name": "Bust",
									"use": "Eliminate the player in that seat and record it, freeing the seat."
								},
								{
									"name": "Move",
									"use": "Pick a target table to move that player to."
								},
								{
									"name": "Merge to table",
									"use": "Merge the whole table's players into a chosen target table, for breaking tables."
								},
								{
									"name": "Save seating",
									"use": "Persist all seat assignments and chip settings."
								}
							],
							"pageurl": "table.html",
							"pagelabel": "Open Table Seating"
						},
						{
							"id": "players-seat-order",
							"title": "Dealer and seat order",
							"desc": "Understanding the seating logic helps you map the on-site table to the system view faster. The layout numbers clockwise from the dealer, and empty seats keep their place to maintain a consistent visual.",
							"steps": [
								"The dealer is always shown at the center bottom of the layout.",
								"Seat 1 starts on the dealer's left and continues clockwise.",
								"Empty seats are kept as EMPTY-type visual positions.",
								"Cross-check the numbering against the real on-site seats."
							],
							"tip": "If the seat order doesn't match the floor, check the first-dealer setting first — the other seats reorder from it.",
							"tools": [
								{
									"name": "Dealer marker",
									"use": "The dealer is fixed at the center bottom of the layout as the seating baseline."
								},
								{
									"name": "Seat numbering",
									"use": "Seat 1 starts on the dealer's left and numbers clockwise."
								},
								{
									"name": "EMPTY seats",
									"use": "Empty seats are kept as EMPTY visual positions to keep the layout consistent."
								},
								{
									"name": "Seat badges",
									"use": "Seat cards show DEALER / HERO / SB / BB to mark the dealer, you, and the blind positions."
								}
							],
							"pageurl": "table.html",
							"pagelabel": "View Table Layout"
						},
						{
							"id": "players-elimination",
							"title": "Elimination and kept rankings",
							"desc": "Elimination handling balances the live view with report accuracy. A busted player is removed from the seat to keep the table clean, but their placement and payout are fully preserved so post-event reports lose nothing.",
							"steps": [
								"Process a player's elimination on the control page or table.",
								"The system removes that player from the table seat.",
								"Their final placement and payout are kept automatically.",
								"Confirm the bust order and prizes on the rankings page."
							],
							"tip": "Elimination only affects the seat display, not the result; if you bust someone by mistake you can recover them in the ranking data.",
							"tools": [
								{
									"name": "Eliminate button (— Bust)",
									"use": "Bust one player from the control page; the remaining-player count drops by one."
								},
								{
									"name": "Linked-player bust dialog",
									"use": "In linked mode, search by name/ID/seat to pick a specific player, then bust or restore."
								},
								{
									"name": "Kept rankings",
									"use": "After a bust, the placement and payout are preserved automatically and viewable on the rankings page."
								},
								{
									"name": "+1 entry",
									"use": "Add one new entry when registration is still open (it prompts if registration is closed)."
								}
							],
							"pageurl": "control.html",
							"pagelabel": "Open Bust-out Control"
						}
					]
				},
				{
					"id": "timer",
					"title": "Timer",
					"lead": "The timer has two screens: the control page for staff to operate, and the display page projected for players. Both share the same session data and sync in real time, so you only operate the control page and the big screen updates itself — no need to maintain both.",
					"items": [
						{
							"id": "timer-control",
							"title": "Main control-page actions",
							"desc": "The control page bundles every control needed during play — it's the floor's main panel. From the event name and blind structure to announcements and the prize pool, everything is set here and syncs instantly to the display.",
							"steps": [
								"Set the event name and blind structure.",
								"Start the clock, then pause or resume as play progresses.",
								"Close registration at the scheduled time.",
								"Publish marquee announcements and maintain the prize pool and bust-out rankings."
							],
							"tip": "Most on-site actions happen on the control page — have one fixed person operate it to avoid duplicate adjustments.",
							"tools": [
								{
									"name": "Event name / subtitle",
									"use": "Click the title or \"Edit title\" to open a dialog and change the main title and subtitle."
								},
								{
									"name": "Pause / Resume clock",
									"use": "Toggle the timer between running and paused."
								},
								{
									"name": "Registration badge",
									"use": "Click REG OPEN / CLOSED to toggle whether registration is open or closed."
								},
								{
									"name": "Marquee message",
									"use": "Type announcement text (use | to separate multiple), then \"Save and broadcast\" to all displays."
								},
								{
									"name": "Settings",
									"use": "Open the settings dialog for sound, vibration, auto-start by time, and timebank seconds."
								},
								{
									"name": "Full reset",
									"use": "Reset the timer state to defaults from the settings dialog (with confirmation)."
								},
								{
									"name": "Sync status",
									"use": "A bottom indicator shows the connection to displays and the most recent action."
								}
							],
							"pageurl": "control.html",
							"pagelabel": "Open Control Page"
						},
						{
							"id": "timer-levels",
							"title": "Blind levels and breaks",
							"desc": "Blind levels control the pace of play. The system counts from Level 1, breaks don't take a level number, and you can flexibly jump levels or insert breaks for on-site situations.",
							"steps": [
								"Confirm the current level and its small blind, big blind, and ante.",
								"Jump forward or backward as needed to adjust pace.",
								"End the current item directly to advance early.",
								"Insert a break when appropriate and adjust its remaining time."
							],
							"tip": "Breaks are never counted as a level, so jumping levels or inserting breaks won't disrupt the blind-level numbering.",
							"tools": [
								{
									"name": "Time fine-tune",
									"use": "Buttons like −5m to +1m quickly add or subtract from the current level's remaining time."
								},
								{
									"name": "Set time",
									"use": "Enter MM:SS or seconds and apply to set the remaining time directly."
								},
								{
									"name": "Reset / End item",
									"use": "Restore the level to full length, or end it immediately to advance to the next item."
								},
								{
									"name": "Previous / Next item",
									"use": "Move back or forward to the previous/next level or break."
								},
								{
									"name": "Jump to L",
									"use": "Enter a level number to jump straight to it (breaks are skipped when jumping)."
								},
								{
									"name": "Structure list",
									"use": "Tap any level or break in the list to jump to it."
								},
								{
									"name": "Insert / End break",
									"use": "Insert a break after the current item, or end the break early, with time fine-tuning."
								},
								{
									"name": "View / Edit structure",
									"use": "Open the structure page to view the full table, or add, edit, and delete levels and breaks."
								}
							],
							"pageurl": "control.html",
							"pagelabel": "Open Level Control"
						},
						{
							"id": "timer-players",
							"title": "Players, payouts, and prize pool",
							"desc": "The control page also handles live player and prize management. Remaining players, total entries, and ITM count drive the prize pool and payouts, with special handling for key moments like the bubble.",
							"steps": [
								"Update remaining players and total entries in real time.",
								"Set the ITM (in-the-money) count.",
								"Process bust-outs; the system links them to rankings.",
								"Switch to bubble mode near the money and maintain payouts."
							],
							"tip": "Total entries include rebuys and re-entries — align them with the registration records so the prize-pool math stays correct.",
							"tools": [
								{
									"name": "Remaining −/+",
									"use": "Use minus/plus to adjust the remaining player count in real time."
								},
								{
									"name": "Edit counts",
									"use": "Open a dialog to manually set remaining players, total entries, and starting chips."
								},
								{
									"name": "Bust / +1 entry",
									"use": "Bust a player, or add one entry while registration is open."
								},
								{
									"name": "Prize pool Auto/Manual",
									"use": "Switch between auto (buy-in × entries) and a manually entered pool, then apply."
								},
								{
									"name": "ITM percent / count",
									"use": "Set in-the-money by percentage or direct count; the other value is calculated live."
								},
								{
									"name": "Smart split",
									"use": "Auto-generate a payout structure from the current ITM count (with confirmation)."
								},
								{
									"name": "Payout preview / Edit prizes",
									"use": "Preview each place's prize, or open a page to edit ranges and amounts by hand."
								},
								{
									"name": "Quick presets",
									"use": "Bubble, hand-for-hand, final table, and color-up — one-click broadcasts to the display."
								}
							],
							"pageurl": "control.html",
							"pagelabel": "Open Player Control"
						},
						{
							"id": "timer-display",
							"title": "Display-page purpose",
							"desc": "The display page is the outward-facing screen for players, presenting key event info in clear, large type. It's made for projectors or venue screens, and its content updates live with the control page.",
							"steps": [
								"Open the display page on a big screen or projector.",
								"Confirm the current level, remaining time, and blinds show correctly.",
								"Check that placements and announcements appear in sync.",
								"Keep this page open during play; update everything from the control page."
							],
							"tip": "The display page only presents — no operation needed; every change comes from the control page and syncs automatically.",
							"tools": [
								{
									"name": "Central timer panel",
									"use": "Large countdown or hand count, with a progress bar and a LEVEL/BREAK tag."
								},
								{
									"name": "Blind info",
									"use": "Shows the current small/big blind and BB ante."
								},
								{
									"name": "Players card",
									"use": "Shows remaining / total entries and the bubble status."
								},
								{
									"name": "Average stack card",
									"use": "Shows the average stack and its BB ratio."
								},
								{
									"name": "Registration countdown card",
									"use": "Shows the time until registration closes, or CLOSED once shut."
								},
								{
									"name": "Next blinds / Next break cards",
									"use": "Preview the next level's blinds and the time to the next break."
								},
								{
									"name": "Payout area",
									"use": "Lists places and prizes with the total pool; in-the-money places are highlighted green."
								},
								{
									"name": "Marquee",
									"use": "Horizontally scrolls the announcement sent from the control page."
								}
							],
							"pageurl": "display.html",
							"pagelabel": "Open Display Page"
						}
					]
				},
				{
					"id": "hands",
					"title": "Hand Logging",
					"lead": "Hand logging follows a three-step flow: confirm position information (table, blinds, seats), record each player's action in seat order, then review exceptions and the winner before submitting. Following the order keeps every hand complete and usable for later EV and stats analysis.",
					"items": [
						{
							"id": "hands-new-hand",
							"title": "Create a hand from table detail",
							"desc": "Every hand starts from table detail. Before creating one, run a chip adjustment to update each player's stack to the real state, so the next hand inherits the correct chips and seating and the curve stays accurate.",
							"steps": [
								"Open table detail and confirm the current seats and stacks.",
								"If there's any drift, run a chip adjustment to update each seat's stack.",
								"Click \"New hand\" to start recording a fresh hand.",
								"The system carries over the current seat state as the starting data."
							],
							"tip": "Make it a habit to run a chip adjustment every few hands — the EV chart and stats will track reality more closely.",
							"tools": [
								{
									"name": "New hand",
									"use": "Open the hand editor to start recording a new hand."
								},
								{
									"name": "Chip adjustment",
									"use": "Open the adjustment page to update each seat's stack to its real state."
								},
								{
									"name": "Filter bar",
									"use": "Filter the hand list by player ID, seat, and date range; \"Clear\" restores the full list."
								},
								{
									"name": "Edit / Delete",
									"use": "Edit or delete a hand from the list (requires permission)."
								},
								{
									"name": "Pagination",
									"use": "Browse the hand list with previous/next and a current-range / total readout."
								}
							],
							"pageurl": "table.html",
							"pagelabel": "Open Hand Entry"
						},
						{
							"id": "hands-position",
							"title": "Confirm position information first",
							"desc": "Position information is the foundation of a hand; getting it wrong skews how every action reads. As the first step, confirm the blind structure and key seats clearly.",
							"steps": [
								"Confirm the table and the current blind level.",
								"Check the small blind, big blind, ante, and BB ante values.",
								"Assign the Dealer and the Hero (your own) seat.",
								"Set any special positions (straddle, etc.)."
							],
							"tip": "With the Hero seat set correctly, hands are marked from your perspective — reviewing your own decisions is much more intuitive.",
							"tools": [
								{
									"name": "Game type",
									"use": "Dropdown to choose Hold'em, Omaha, etc."
								},
								{
									"name": "Blind level",
									"use": "Pick a level from the structure to auto-fill blinds, or choose \"Custom\" to type them."
								},
								{
									"name": "Small / Big blind / Ante",
									"use": "Enter the blind and ante amounts (the Ante label changes with the ante mode)."
								},
								{
									"name": "Dealer / Hero seat",
									"use": "Dropdowns to assign the dealer seat and your own (Hero) seat."
								},
								{
									"name": "Empty button / Dead small blind",
									"use": "Tick when heads-up has no empty button, or there's no small blind (straddle)."
								},
								{
									"name": "Rebuild default bets",
									"use": "Auto-generate the preflop blind and ante posts for the active seats."
								},
								{
									"name": "Seat list",
									"use": "Visualizes each seat's chips with DEALER / HERO / SB / BB badges."
								},
								{
									"name": "Step nav / Clear cache",
									"use": "Switch between the three steps, or clear unsaved hand data."
								}
							],
							"pageurl": "newedithand.html",
							"pagelabel": "Open Hand Editor"
						},
						{
							"id": "hands-actions",
							"title": "Record actions in order",
							"desc": "Once in action recording, the system guides you seat by seat in order. Default blind and ante actions are created automatically, so you just start from the first seat to act.",
							"steps": [
								"The system auto-creates the default blind and ante actions.",
								"In seat order, the system prompts the next seat to act.",
								"Choose fold/call/check, or enter an amount in the input on a raise.",
								"Complete every action street by street (preflop/flop/turn/river)."
							],
							"tip": "All-ins are marked distinctly in the review view, making it easy to find key all-in hands later.",
							"tools": [
								{
									"name": "Hub buttons",
									"use": "Switch between Add my hand / Board / Betting / Showdown result areas."
								},
								{
									"name": "Street",
									"use": "Dropdown for preflop / flop / turn / river; advances automatically with the hand."
								},
								{
									"name": "Fold / Check·Call",
									"use": "One-click to record a fold, or a check/call, and auto-advance to the next actor."
								},
								{
									"name": "Bet / Raise",
									"use": "Open the bet dialog and enter an amount with the chip calculator (multipliers, denomination keys, numpad); tick All-in."
								},
								{
									"name": "Board editor",
									"use": "Set the flop / turn / river community cards and each street's burn card."
								},
								{
									"name": "Card picker",
									"use": "Pick cards from a suit × rank grid; already-used cards are greyed out."
								},
								{
									"name": "Action list",
									"use": "Shows every recorded action; remove any row to correct it."
								},
								{
									"name": "Timebank",
									"use": "If configured, start / pause / reset the countdown for the current actor."
								}
							],
							"pageurl": "newedithand.html",
							"pagelabel": "Open Action Recording"
						},
						{
							"id": "hands-review",
							"title": "Review exceptions before submit",
							"desc": "The final step adds the showdown result and runs a completeness check. The system warns you when data is missing or inconsistent, but still gives you the flexibility to force-submit special hands after confirming.",
							"steps": [
								"Record the showdown's show or muck.",
								"Log any exceptions such as burned cards.",
								"Assign the winner and the pot distribution.",
								"Save; if the system flags a gap, confirm and you can force-submit."
							],
							"tip": "A warning isn't an error — for special hands (like winning by everyone folding), confirm and force-submit; the data is still kept.",
							"tools": [
								{
									"name": "Showdown rows (show/muck)",
									"use": "Set show or muck for each seat at showdown."
								},
								{
									"name": "Winner and distribution",
									"use": "Tick the winning seat(s) and enter the amount each wins (supports split pots)."
								},
								{
									"name": "Warnings area",
									"use": "Lists blocking errors (red) and reminders (yellow); when all pass it shows ready to submit."
								},
								{
									"name": "Summary box",
									"use": "Shows active players, pot, winner count, and total distributed for a final check."
								},
								{
									"name": "Notes",
									"use": "Record rulings or special situations in text."
								},
								{
									"name": "Submit / Submit and add next",
									"use": "Save the hand; the first submit stops on warnings, a second forces it, or continue straight into the next hand on the same table."
								},
								{
									"name": "Export JSON / Edit",
									"use": "Export the full record from the hand detail page, or return to the editor to revise it."
								}
							],
							"pageurl": "handdetail.html",
							"pagelabel": "Open Hand Detail"
						}
					]
				},
				{
					"id": "reports",
					"title": "Reports and Placements",
					"lead": "Reports come at three levels: table level focuses on one table, session level rolls up every table in the event, and your profile aggregates your own long-term performance across events. Placements and payouts record the result and drive prize distribution. Pick the right level and you'll find the numbers you need fast.",
					"items": [
						{
							"id": "reports-session",
							"title": "Session stats and hand list",
							"desc": "Session-level stats roll up the hands from every table in the event — the main entry for reviewing the whole event afterward. The hand area offers full filtering and visualization to surface what matters from a large dataset.",
							"steps": [
								"Open the hand area in session detail.",
								"Narrow the range with filters (player, seat, date).",
								"Browse the hand list with pagination, hand by hand.",
								"Check the EV chart and stat cards for the event-wide trend."
							],
							"tip": "Session stats merge all tables; to inspect a single table's details, use table stats for a tighter focus.",
							"tools": [
								{
									"name": "Hand sub-tabs",
									"use": "Switch between Overview (hand list), Chart, and Stats."
								},
								{
									"name": "Filter bar",
									"use": "Filter hands by table / player / seat and date range; \"Clear\" restores all."
								},
								{
									"name": "Player selector",
									"use": "With multiple players, pick one to view their chart and stats."
								},
								{
									"name": "Summary cards",
									"use": "Show aggregate numbers like peak, low, and final chips."
								},
								{
									"name": "Cumulative stack chart",
									"use": "A chip line chart by hand sequence for the event-wide trend."
								},
								{
									"name": "Pagination",
									"use": "Browse the hand list with previous/next."
								}
							],
							"pageurl": "session.html",
							"pagelabel": "Open Session Stats"
						},
						{
							"id": "reports-table",
							"title": "Table stats and EV chart",
							"desc": "Table-level stats focus on one table's players and hands — ideal for analyzing a specific table's hand quality and stack trend. The EV chart visualizes how stacks change as hands accumulate.",
							"steps": [
								"Open the detail of a specific table.",
								"Switch between the players, hands, stats, and EV chart tabs.",
								"Read the stack curve on the EV chart (oldest left, newest right).",
								"Cross-reference the stats to judge the table's hand quality."
							],
							"tip": "The EV chart accumulates from actual hand results — oldest on the left, newest on the right — and is more accurate alongside chip adjustments.",
							"tools": [
								{
									"name": "Stats tab",
									"use": "Cards for total hands, net profit, win rate, AVG, BEST, WORST, and all-in count."
								},
								{
									"name": "EV chart",
									"use": "A chip-change line chart (oldest left, newest right); hover for exact values."
								},
								{
									"name": "Players / Hands tabs",
									"use": "Review the table's player list and the details of each hand."
								}
							],
							"pageurl": "table.html",
							"pagelabel": "Open Table Stats"
						},
						{
							"id": "reports-payout",
							"title": "Placements and payouts",
							"desc": "The placement page manages the event's final ranking and prize distribution. You can set payouts in batches by range, and the control page and session placement page share data, so you can maintain it on site and afterward.",
							"steps": [
								"Open the session placement page or adjust placements from control.",
								"Set payouts by range, e.g. places 1-10 advancing.",
								"Set fixed amounts for fixed-prize places, e.g. places 11-12.",
								"Confirm placements and amounts, then save for reports to reference."
							],
							"tip": "Control and the placement page share the same payouts — adjusting live during bust-outs flows straight into the final report.",
							"tools": [
								{
									"name": "Rankings tab",
									"use": "Shows the total prize, base pool, and entries summary."
								},
								{
									"name": "Search",
									"use": "Find a specific placement row by player name or seat."
								},
								{
									"name": "Placement list",
									"use": "Shows place, player, seat, and the corresponding prize."
								},
								{
									"name": "Payout editor",
									"use": "Set places and amounts by range, e.g. 1-10 advancing, 11-12 fixed prize."
								},
								{
									"name": "Control-page rankings",
									"use": "You can also adjust payouts live from the control page; both stay in sync."
								}
							],
							"pageurl": "session.html",
							"pagelabel": "Open Placement Page"
						},
						{
							"id": "reports-profile",
							"title": "Personal reports",
							"desc": "Personal reports span all your sessions to aggregate your long-term results. The system computes key metrics by time range and game type automatically, so you can assess your performance without manual bookkeeping.",
							"steps": [
								"Open your profile and switch between monthly / yearly / career reports.",
								"View total buy-ins and total profit by game type.",
								"Reference metrics like ROI to assess your return.",
								"If something's missing, go back to result backfill to add it."
							],
							"tip": "Personal reports include both hosted sessions and your own backfilled results — keep both sources fully logged for accuracy.",
							"tools": [
								{
									"name": "Report tabs",
									"use": "Switch between monthly / yearly / career reports."
								},
								{
									"name": "Period picker",
									"use": "Pick the month for monthly, or the year for yearly, to lock the range you want."
								},
								{
									"name": "Include fee",
									"use": "Tick to toggle whether profit/loss counts the service fee."
								},
								{
									"name": "Type cards",
									"use": "Cash / timed tournament / tournament each show buy-ins, profit, and ROI (with ITM/FT/Top3)."
								},
								{
									"name": "Comparison chart",
									"use": "A bar chart comparing profit and loss across game types."
								},
								{
									"name": "Export CSV / Advanced reports",
									"use": "Export the report data, or open the advanced reports page for deeper analysis."
								}
							],
							"pageurl": "profile.html",
							"pagelabel": "Open Personal Reports"
						}
					]
				},
				{
					"id": "series",
					"title": "Series",
					"lead": "A series bundles several sessions together for cross-session aggregate stats and a player leaderboard. It suits a run of related events (a weekly, monthly or one tournament series): you see the whole series' total profit and rankings without adding sessions up by hand. A series only organizes your own sessions and never changes each session's own settings or settlement.",
					"items": [
						{
							"id": "series-create",
							"title": "Create and manage a series",
							"desc": "Open the Series page from the navigation bar to create a new series, set its ranking basis, and see each series' session count and total profit. A series is a personal grouping tool and only includes sessions you created.",
							"steps": [
								"Click “Series” in the top navigation bar (bottom bar on mobile) to open Series management.",
								"Click “New Series”, enter a series name (required); optionally add a description and start/end dates.",
								"Choose a ranking basis — Profit, Place or Points — to control how the leaderboard sorts.",
								"Turn on “Private series” if you wish; after creating, the list shows session count and total profit."
							],
							"tip": "Deleting a series only removes the grouping — the sessions themselves are not deleted, so you can reorganize safely.",
							"tools": [
								{
									"name": "New Series",
									"use": "Create a new series with name, description, start/end dates and ranking basis."
								},
								{
									"name": "Ranking basis",
									"use": "Pick Profit (by total profit), Place (by best finish) or Points (by players beaten) to sort the leaderboard."
								},
								{
									"name": "Private series",
									"use": "Mark the series as private, for personal organization."
								},
								{
									"name": "Edit / Delete",
									"use": "Edit series details, or delete the grouping (member sessions are kept)."
								}
							],
							"pageurl": "serieslist.html",
							"pagelabel": "Open Series"
						},
						{
							"id": "series-sessions",
							"title": "Add sessions and aggregate stats",
							"desc": "Inside a series you choose which sessions it contains, and the system instantly sums their profit, buy-ins and prizes. Only your own sessions can be added.",
							"steps": [
								"Click any series in the list to open its detail page.",
								"Click “Manage sessions” and search your own sessions by name or code.",
								"Click “Add” on sessions to include and “Remove” on those to drop, then save.",
								"Back on “Overview” you see session count, total profit, total buy-in and total prize."
							],
							"tip": "You can also attach the current session to a series directly from the “Add to series” panel on the session detail page.",
							"tools": [
								{
									"name": "Manage sessions",
									"use": "Search and pick the sessions to include; reorder and remove."
								},
								{
									"name": "Overview totals",
									"use": "Show session count, total profit, total buy-in and total prize."
								},
								{
									"name": "Session detail: Add to series",
									"use": "Attach the current session to one of your series from its detail page."
								}
							],
							"pageurl": "serieslist.html",
							"pagelabel": "Open Series"
						},
						{
							"id": "series-leaderboard",
							"title": "Player leaderboard",
							"desc": "The series “Leaderboard” spans the hosted sessions in the series, aggregating every checked-in player's results into a ranking sorted by your chosen basis — ideal for a long season or a members' points race.",
							"steps": [
								"Open the series detail and switch to the “Leaderboard” tab.",
								"The system aggregates players whose status is confirmed/advanced across the hosted sessions.",
								"By the ranking basis (Profit / Place / Points), view rank, entries, total prize, profit, best place and cashes.",
								"To change the order, go back to series settings and adjust “Ranking basis”."
							],
							"tip": "The leaderboard only counts checked-in players in “hosted” sessions; personal-result sessions don't appear on it, but still count toward the Overview profit totals.",
							"tools": [
								{
									"name": "Leaderboard tab",
									"use": "Shows player rank, entries, total prize, total buy-in, profit, best place and cashes."
								},
								{
									"name": "Points mode",
									"use": "Accumulates “players beaten” points: per-session points = total entries − finishing place; earlier finishes in bigger fields score more."
								},
								{
									"name": "Place / Profit mode",
									"use": "Place mode ranks by best finish (smaller is better); Profit mode ranks by total profit (higher is better)."
								}
							],
							"pageurl": "serieslist.html",
							"pagelabel": "Open Series"
						},
						{
							"id": "series-batch",
							"title": "Batch-create a multi-day event",
							"desc": "Batch create is a five-step wizard: fill the settings once and it builds every session of a whole advancement tree (e.g. 8 Day-1 flights → 2 Day-2 → Final), links them with multi-day advancement, and wraps them into a series automatically.",
							"steps": [
								"Click “Batch create multi-day” on the series detail page (or open batchcreate.html).",
								"Step 1 “Basics” sets club, start date and event type; step 2 “Buy-in” sets buy-in, fee, starting stack and rebuy/re-entry/add-on.",
								"Step 3 “Blind structure” parses pasted text via “Parse”, or uploads a JSON file.",
								"Step 4 “Format / tree” applies quick templates (3→1, 5→1, 6→1, 8→2→1) or custom layers; step 5 “Preview” then “Create all”."
							],
							"tip": "Use “Save settings JSON” at the top to store the whole wizard as a file and “Load settings JSON” to reuse it — ideal for weekly recurring schedules.",
							"tools": [
								{
									"name": "Quick templates",
									"use": "One-click advancement trees such as 3→1, 5→1, 6→1, 8→2→1."
								},
								{
									"name": "Structure parsing",
									"use": "Parse a pasted blind schedule from another site, or import JSON."
								},
								{
									"name": "Settings JSON",
									"use": "Save/load the full wizard setup so recurring events need no retyping."
								}
							],
							"pageurl": "batchcreate.html",
							"pagelabel": "Open Batch Create"
						}
					]
				},
				{
					"id": "broadcast",
					"title": "Broadcast & Replay",
					"lead": "Live broadcast lets off-site viewers watch a public session's hand records in real time: the host records as usual while viewers only see released hands, with optional delay and hole-card masking. The hand detail page also offers an animated replay that re-plays a whole hand from deal to payout — great for post-game review and sharing.",
					"items": [
						{
							"id": "broadcast-open",
							"title": "Enable broadcast and the viewer page",
							"desc": "Only hosted sessions with unified hand recording and public access can broadcast. Once enabled, the session's Hands tab shows a “Live broadcast” button; anyone (no sign-in needed) can watch the latest and recent hands read-only, synced via WebSocket.",
							"steps": [
								"In session detail “Other → Settings”, make sure “Unified hand recording” is on.",
								"In the “Live broadcast” settings, enable “Open broadcast”; optionally set “Show hole cards”, “Delay (minutes)” and “H4H manual advance”.",
								"Back on the “Hands” tab, click “Live broadcast” and share the read-only link with viewers.",
								"Viewers can toggle BB units and deck skins (Classic Blue / Crimson / Midnight Green) at top right."
							],
							"tip": "Only unified-recording + hosted + linked + non-private sessions can broadcast; otherwise the viewer page shows a not-available notice.",
							"tools": [
								{
									"name": "Delay",
									"use": "Delays the off-site view by N minutes to protect live information."
								},
								{
									"name": "Hole-card mask",
									"use": "Turn off “Show hole cards” so viewers only see actions and board."
								},
								{
									"name": "Connection status",
									"use": "A LIVE indicator with auto-reconnect and a 15s fallback poll."
								}
							],
							"pageurl": "session.html",
							"pagelabel": "Open Session Detail"
						},
						{
							"id": "broadcast-h4h",
							"title": "H4H hand-by-hand release",
							"desc": "H4H (hand-for-hand style manual advance) lets the floor control broadcast pace hand by hand: record live on-site while off-site viewers only see released hands. Ideal for final tables or information-sensitive events.",
							"steps": [
								"Enable “H4H manual advance” in the session's broadcast settings (existing hands count as released).",
								"Open “Broadcast control” from the session page to see Released / Pending / Total counts.",
								"After each recorded hand, click “▶ Advance next hand” to release it; use “Back one hand” to undo.",
								"Click “Release all →” to release everything at once when control is no longer needed."
							],
							"tip": "The control panel is limited to the session owner and hired floor/assistant/dealer; the viewer page updates instantly on each release.",
							"tools": [
								{
									"name": "Advance next hand",
									"use": "Release the next hand to viewers."
								},
								{
									"name": "Back one hand",
									"use": "Withdraw the most recently released hand."
								},
								{
									"name": "Release all",
									"use": "Release every pending hand after confirmation."
								}
							],
							"pageurl": "session.html",
							"pagelabel": "Open Session Detail"
						},
						{
							"id": "broadcast-replay",
							"title": "Animated hand replay",
							"desc": "“▶ Replay” on the hand detail page re-plays the whole hand on an oval table: dealing, betting street by street, board cards, showdown and payout — with all-in equity and outs shown when applicable.",
							"steps": [
								"Open any hand's detail page and click “▶ Replay” (shown for normal hands with seating data).",
								"Control progress with play/pause, step buttons or the timeline slider; speeds 0.5×–4×.",
								"Optionally toggle “Show all hole cards”, “Pot chips” or “BB” (amounts in big blinds).",
								"Keyboard: arrow keys step, space plays/pauses, Esc closes; long-press the table to change deck skin."
							],
							"tip": "Replay shares deck-skin settings with live broadcast (Classic Blue / Crimson / Midnight Green); all-in equity is computed on the backend.",
							"tools": [
								{
									"name": "Timeline",
									"use": "Drag to any step; long-press then drag on the table also scrubs."
								},
								{
									"name": "Speed",
									"use": "0.5× / 1× / 2× / 4× playback."
								},
								{
									"name": "Show all hole cards",
									"use": "By default only Hero and showdown hands are revealed."
								}
							],
							"pageurl": "handdetail.html",
							"pagelabel": "Open Hand Detail"
						}
					]
				},
				{
					"id": "staff",
					"title": "Staff & Permissions",
					"lead": "PokerTrace accounts come in four types: player, dealer, floor, and assistant. Hosts hire staff from the profile page; once an invitee confirms via the invitation email, they can see the related sessions and get permissions matching their role. Understand the role split first, then set up hiring links for smoother on-site teamwork.",
					"items": [
						{
							"id": "staff-roles",
							"title": "Roles and permissions overview",
							"desc": "Each role can do different things. Hired staff can view and edit the sessions they work, but cannot delete or copy them, and those sessions never count into their own profit stats. The timer is only operable by floor and assistant roles; dealers focus on hand logging.",
							"steps": [
								"Confirm your account type: player, dealer, floor, or assistant.",
								"Players (hosts) have full control over their own sessions.",
								"Floor and assistant roles can operate the timer control panel; dealers cannot.",
								"Hired sessions are badged as staffed and excluded from the staff member's own profit reports."
							],
							"tip": "Frontend button visibility is only a hint — real permissions are checked on the backend. If a feature is missing, check your role and hiring status first.",
							"tools": [
								{
									"name": "Player",
									"use": "Can create and host sessions as the owner, and hire other staff."
								},
								{
									"name": "Dealer",
									"use": "Handles hand logging and on-site data entry; cannot operate the timer."
								},
								{
									"name": "Floor",
									"use": "Operates the timer and tournament operations, handling rulings."
								},
								{
									"name": "Assistant",
									"use": "Can operate the timer like a floor, assisting with on-site chores."
								}
							],
							"pageurl": "profile.html",
							"pagelabel": "Open Profile"
						},
						{
							"id": "staff-hire",
							"title": "Hire staff from your profile",
							"desc": "A host's profile page has an employment section with three cards — dealer, floor, and assistant — each showing the current headcount. Enter the other person's user ID (starting with P-) to send an invitation; once confirmed, they join your global staff list.",
							"steps": [
								"Open your profile and scroll to the employment section.",
								"Click \"Manage\" on the dealer / floor / assistant card to open the roster.",
								"Enter the person's user ID (e.g. P-00099) and click \"Add\" to send the invite.",
								"The entry shows \"pending\" until confirmed, then turns active; click \"Remove\" when you stop working together."
							],
							"tip": "Ask the person to check their user ID in the basic info area of their profile; hiring is done by entering the ID, not by scanning a code.",
							"tools": [
								{
									"name": "Staff cards",
									"use": "Dealer / floor / assistant cards each show headcount and a \"Manage\" button."
								},
								{
									"name": "Roster modal",
									"use": "Shows hired and pending staff; add or remove members here."
								},
								{
									"name": "Pending status",
									"use": "After sending, the invite shows pending until the recipient confirms via the email link."
								}
							],
							"pageurl": "profile.html",
							"pagelabel": "Open Staff Management"
						},
						{
							"id": "staff-verify",
							"title": "Confirming an invitation",
							"desc": "A hiring invitation emails a confirmation link to the invitee. Opening the link lands on the staff verification page, which validates automatically and shows the result. Once confirmed, the invitee officially joins that host's (or that session's) staff list.",
							"steps": [
								"After receiving the invitation email, click the confirmation link inside.",
								"The page verifies automatically and shows \"Confirmed!\" on success.",
								"If you confirmed before, it shows an already-confirmed notice.",
								"An invalid or expired link shows a verification failure — ask the host to resend the invite."
							],
							"tip": "The confirmation works straight from the email link without signing in first; after confirming, sign in to see the employment link in your profile.",
							"tools": [
								{
									"name": "Go to sign-in",
									"use": "After confirming, click through to sign in and start working."
								},
								{
									"name": "Timeout notice",
									"use": "If verification times out, check your network and reopen the link."
								}
							],
							"pageurl": "signin.html",
							"pagelabel": "Open Sign-in"
						},
						{
							"id": "staff-worker",
							"title": "The staff member's view",
							"desc": "After signing in, the dashboard and profile adapt to a staff member's role: the profile shows which hosts hired you, and the session list shows related sessions with a staffed badge. Results from those sessions never count into your own profit.",
							"steps": [
								"Sign in and check the employment section in your profile to confirm hosts and roles.",
								"Open the session list to see sessions badged as staffed.",
								"Work by role: floor / assistant open the control panel, dealers log hands at tables.",
								"Your personal reports only include sessions you played as a player."
							],
							"tip": "Staffed sessions can be edited but not deleted or copied; contact the session owner when settings need changing.",
							"tools": [
								{
									"name": "Employment cards",
									"use": "Show each hiring host's name, ID, and your role badge."
								},
								{
									"name": "Staffed badge",
									"use": "The session list badges staffed sessions and hides personal buy-in and profit."
								},
								{
									"name": "Suggested next steps",
									"use": "The dashboard offers timer or hand-logging entry points by role."
								}
							],
							"pageurl": "sessionlist.html",
							"pagelabel": "Open Session List"
						}
					]
				},
				{
					"id": "checkin",
					"title": "Check-in & Receipts",
					"lead": "The registration workbench is the command center for on-site check-in: batch confirmation, seating, and advancement all happen there. Combined with QR scanning and the check-in verification page, you can quickly verify player identity and print receipts. This chapter walks the full on-site flow from the registration list to receipt printing.",
					"items": [
						{
							"id": "checkin-register",
							"title": "Batch operations on the registration workbench",
							"desc": "The registration list page manages every registration of a single session. Four stat tiles show registered, confirmed, cancelled, and total chips in real time, and the toolbar offers batch confirm, seating, advancement, and reentry operations, with the list syncing live.",
							"steps": [
								"Open the registration list (workbench) from the session detail page.",
								"Search or add players and choose cash or ticket entry.",
								"Select multiple players and batch \"Confirm\" from the toolbar, then assign seats.",
								"Handle reentry / rebuy / addon, advancement, and profit corrections on site, then export CSV or print the list."
							],
							"tip": "Registration statuses are color-coded: registered (yellow), confirmed (green), advanced (blue), cancelled (gray). Review the result summary after each batch operation.",
							"tools": [
								{
									"name": "Stat tiles",
									"use": "Registered / confirmed / cancelled / total chips at a glance."
								},
								{
									"name": "Batch toolbar",
									"use": "Select players, then batch confirm, seat (fill / reshuffle / balance), or advance."
								},
								{
									"name": "Row actions",
									"use": "Per row: reentry / rebuy / addon, cancel, profit correction, and receipt printing."
								},
								{
									"name": "Collapsible help",
									"use": "Built-in operation guide, status legend, and beginner walkthrough — expand anytime."
								},
								{
									"name": "Export & print",
									"use": "\"Export CSV\" and \"Print list\" preserve post-event records."
								}
							],
							"pageurl": "session.html",
							"pagelabel": "Open Session Detail"
						},
						{
							"id": "checkin-scan",
							"title": "Scanning receipt QR codes",
							"desc": "The scan page uses the browser's built-in barcode detection with the camera. Aim a player's receipt QR at the frame and the matching check-in verification page opens automatically; if the camera is unavailable, enter the registration number manually.",
							"steps": [
								"Click \"Scan QR\" at the top right of the registration list to open the scanner.",
								"Aim the receipt QR at the green targeting frame.",
								"On recognition, the page jumps to that registration's check-in verification page.",
								"If the camera fails, enter the registration number below and click \"Look up\"."
							],
							"tip": "Scanning relies on the browser's built-in detector — no app install needed. Without camera permission a warning shows and manual lookup remains available.",
							"tools": [
								{
									"name": "Camera preview",
									"use": "Live camera view with a green targeting frame."
								},
								{
									"name": "Restart camera",
									"use": "Re-acquire the camera feed if it drops."
								},
								{
									"name": "Manual fallback",
									"use": "Enter the registration number from the receipt to look it up directly."
								}
							],
							"pageurl": "scan.html",
							"pagelabel": "Open Scanner"
						},
						{
							"id": "checkin-verify",
							"title": "Check-in verification and prize receipts",
							"desc": "The check-in verification page shows the registration's full details — session, player, status, entry number, table, seat, and buy-in structure — so staff can verify identity fast. Staff with issuing permission can also print prize receipts directly.",
							"steps": [
								"Open the page by scanning a receipt QR or entering the registration number.",
								"Verify player name, player ID, status badge, and entry number.",
								"Confirm the table, seat, buy-in (cash / ticket), and reentry counts match.",
								"Authorized staff can click \"Print prize receipt\" for players with winnings."
							],
							"tip": "Receipts use an 80mm four-copy layout (house / player / dealer / table) printed on a thermal printer.",
							"tools": [
								{
									"name": "Verification card",
									"use": "Shows series / session name, status badge, and player info."
								},
								{
									"name": "Print prize receipt",
									"use": "Shown only to staff with issuing permission when the player has a prize."
								},
								{
									"name": "Session detail",
									"use": "One click back to the session detail page for other work."
								}
							],
							"pageurl": "scan.html",
							"pagelabel": "Open Scanner"
						}
					]
				},
				{
					"id": "livetools",
					"title": "Live Table Tools",
					"lead": "Beyond table detail, three helper pages see heavy on-site use: the table board tracks headcounts across tables and auto-balances seating; quick hand lets you log a standalone hand outside the session flow; and stack adjustment brings every seat's chip count back in line with reality. All three are reached from the session or table pages.",
					"items": [
						{
							"id": "livetools-tableboard",
							"title": "Table board and auto-balance",
							"desc": "The table board lays out every table of a session as cards showing seat occupancy and player stacks, refreshing automatically. When headcounts drift apart it suggests rebalancing, and hosts can auto-balance seating in one click.",
							"steps": [
								"Open the table board from session detail (or the merge reminder on the control panel).",
								"Check the three stat tiles: tables, seated players, and average per table.",
								"Review the balance hints (over / under) to decide whether to adjust.",
								"Click \"Auto-balance seating\" and confirm; players are spread evenly across tables."
							],
							"tip": "The control panel's merge reminder fires when the field can consolidate tables, suggesting how many to break — click through to the table board to act on it.",
							"tools": [
								{
									"name": "Stat tiles",
									"use": "Tables, seated players, and average players per table."
								},
								{
									"name": "Table cards",
									"use": "Show occupancy vs. max seats, empty seats, and each player's stack."
								},
								{
									"name": "Badges",
									"use": "\"Mergeable (empty)\" and \"Unbalanced\" flag tables needing attention."
								},
								{
									"name": "Auto-balance seating",
									"use": "After confirmation, spreads movable players evenly across tables."
								}
							],
							"pageurl": "session.html",
							"pagelabel": "Open Session Detail"
						},
						{
							"id": "livetools-quickhand",
							"title": "Quick hand logging",
							"desc": "Quick hand shares the same three-step flow as the regular hand editor but records a standalone hand: game type, blinds, and seats are freely configurable, and it doesn't chain into the session's other hands — ideal for ad-hoc records or preserving a memorable hand on its own.",
							"steps": [
								"Open quick hand from the table page.",
								"Step 1: set position and blinds, dealer, hero, and each seat's stack.",
								"Step 2: record actions, board cards, and showdown in order.",
								"Step 3: review warnings and the summary, then submit — or \"Submit and start next hand\" to continue."
							],
							"tip": "Quick hands stay freely editable later and never affect chip continuity of other hands.",
							"tools": [
								{
									"name": "Three-step nav",
									"use": "Position info → record hand → review and submit, same as the regular editor."
								},
								{
									"name": "Clear draft",
									"use": "Discard unsaved input and start over."
								},
								{
									"name": "Timebank",
									"use": "Start, pause, or reset a countdown for the current actor from bet management."
								}
							],
							"pageurl": "table.html",
							"pagelabel": "Open Table Detail"
						},
						{
							"id": "livetools-stackadjust",
							"title": "Stack adjustment",
							"desc": "Stack adjustment records each seat's chip delta as a special entry, and the next hand picks up the corrected stacks directly. Every adjustment requires a reason and a note, so later audits can trace why each change was made.",
							"steps": [
								"Click \"Stack adjustment\" on the table page.",
								"Choose the reason: on-site count correction, color-up race off, penalty / top-up, seat data fix, or other.",
								"Enter the delta per seat; the status bar shows the total change and table-wide chips live.",
								"Fill in the note and click \"Save adjustment\" to return to the table page."
							],
							"tip": "Only the latest adjustment's chip values can be modified; editing an older one locks the amounts and only the note stays editable.",
							"tools": [
								{
									"name": "Reason selector",
									"use": "Dropdown categorizing why this adjustment happened."
								},
								{
									"name": "Seat delta cards",
									"use": "Show current vs. adjusted chips, accepting positive or negative deltas."
								},
								{
									"name": "Status bar",
									"use": "Live totals: net change and table chips before → after."
								}
							],
							"pageurl": "table.html",
							"pagelabel": "Open Table Detail"
						}
					]
				},
				{
					"id": "toolcenter",
					"title": "Tool Center",
					"lead": "The tool center collects dozens of free poker utilities — on-site operations (seat draw, cash reconciliation), chip math, payout planning, and strategy learning — all usable without signing in. Search, filter by category, and pin favorites for quick access.",
					"items": [
						{
							"id": "toolcenter-browse",
							"title": "Browsing and searching tools",
							"desc": "The tool list lays out every tool as a card, with keyword search and category tabs on top covering live, chips, payout, strategy, operations, learning, and development. Click a card to open the tool; recently used tools are tracked automatically.",
							"steps": [
								"Open the tool list from \"View all tools\" in your profile or from the home page.",
								"Type a keyword (e.g. ICM, seat, chips) to search.",
								"Or filter with the category tabs (all / recent / favorites / featured / live / chips / payout / strategy / operations / learning / development).",
								"Click a card to open it; hit \"Add to favorites\" on frequent tools to find them fast under Favorites."
							],
							"tip": "All tools are free, ad-free, and need no sign-in; cards marked as under maintenance aren't open yet and will roll out over time.",
							"tools": [
								{
									"name": "Search box",
									"use": "Filters the tool list live by keyword."
								},
								{
									"name": "Category tabs",
									"use": "Switch categories by purpose, each showing its tool count."
								},
								{
									"name": "Favorites / recent",
									"use": "Pin frequent tools and auto-track recently opened ones."
								}
							],
							"pageurl": "toollist.html",
							"pagelabel": "Open Tool List"
						},
						{
							"id": "toolcenter-featured",
							"title": "Notable tools",
							"desc": "The tool center keeps expanding. Notable tools already open include the equity solver, blind structure generator, TDA rules handbook, and public API docs; the rest roll out as maintenance completes.",
							"steps": [
								"Equity solver: enter each player's hand and the board to compute equity.",
								"Structure generator: auto-build a blind structure from player count and target duration.",
								"TDA rules handbook: look up the TDA rules commonly cited in tournament rulings.",
								"Public API docs: browse descriptions and examples for every PokerTrace API endpoint."
							],
							"tip": "The public API docs list every JSON endpoint and its auth requirements — the starting point for developers integrating with PokerTrace data.",
							"tools": [
								{
									"name": "Equity solver",
									"use": "Fast on-site equity and matchup calculations."
								},
								{
									"name": "Structure generator",
									"use": "Produces blind structures importable straight into a session."
								},
								{
									"name": "TDA rules handbook",
									"use": "Quick rule lookups during on-site rulings."
								},
								{
									"name": "Public API docs",
									"use": "The entry point for developers integrating PokerTrace data."
								}
							],
							"pageurl": "toollist.html",
							"pagelabel": "Open Tool List"
						}
					]
				},
				{
					"id": "account",
					"title": "Account & More",
					"lead": "Beyond the event workflow, PokerTrace offers several account-level helpers: the notification center gathers in-app messages, club management maintains your poker clubs, advanced reports chart your profit trend, and the contact form handles bug reports and suggestions.",
					"items": [
						{
							"id": "account-notification",
							"title": "Notification center",
							"desc": "The notification center lists every in-app notification, with unread ones marked by a green dot. It supports keyword search, adjustable page size, and pagination; mark items read, delete them, or clear everything with mark-all-read.",
							"steps": [
								"Open the notification center from the navigation bar.",
								"Unread items carry a green dot and an unread label — click \"Mark as read\" to handle them.",
								"Search titles or content by keyword when needed.",
								"Use \"Mark all read\" to clear unread items at once, or delete notifications you no longer need."
							],
							"tip": "Hiring invitations and session events all arrive as notifications — check regularly so pending items don't slip by.",
							"tools": [
								{
									"name": "Search bar",
									"use": "Search titles or content, with 10–100 items per page."
								},
								{
									"name": "Mark read / delete",
									"use": "Handle notifications one by one; deletion asks for confirmation."
								},
								{
									"name": "Mark all read",
									"use": "Clears every unread notification in one click."
								}
							],
							"pageurl": "notification.html",
							"pagelabel": "Open Notifications"
						},
						{
							"id": "account-club",
							"title": "Club management",
							"desc": "Club management maintains the list of poker clubs under your name — name, address, and notes — with addresses linking straight to Google Maps so players can identify the venue and organizer.",
							"steps": [
								"Open club management from the navigation bar.",
								"Click \"Add club\" and fill in the name and address (required) plus notes.",
								"Use the search box to filter by name, address, or note.",
								"Edit or delete existing clubs as needed."
							],
							"tip": "The stats area shows total clubs and how many are displayed — lean on search when the list grows long.",
							"tools": [
								{
									"name": "Add club",
									"use": "Create a club record with name, address, and notes."
								},
								{
									"name": "Address link",
									"use": "Click an address to open it in Google Maps."
								},
								{
									"name": "Edit / delete",
									"use": "Maintain existing club records; deletion asks for confirmation."
								}
							],
							"pageurl": "clublist.html",
							"pagelabel": "Open Club Management"
						},
						{
							"id": "account-benefit",
							"title": "Advanced reports",
							"desc": "Advanced reports chart your cumulative profit over a chosen date range as a line graph, defaulting to the last 30 days. Only sessions you played as a player count — hosting and staffed sessions never affect the curve.",
							"steps": [
								"Click \"Open advanced reports\" from your profile.",
								"Set the start and end dates and click \"Query\".",
								"Review the three summary tiles: date range, cumulative profit, and day count.",
								"Read the trend from the line chart; click \"Reset\" to return to the last 30 days."
							],
							"tip": "Cumulative profit shows green when positive and red when negative — the trend chart suits reviewing overall performance across a period.",
							"tools": [
								{
									"name": "Date filter",
									"use": "Query any custom date range."
								},
								{
									"name": "Summary tiles",
									"use": "Date range, cumulative profit, and day count."
								},
								{
									"name": "Trend chart",
									"use": "Daily cumulative profit line; hover for exact values."
								}
							],
							"pageurl": "benefit.html",
							"pagelabel": "Open Advanced Reports"
						},
						{
							"id": "account-contact",
							"title": "Contact us",
							"desc": "Feature suggestions, bug reports, and partnership inquiries all go through the contact form. When signed in, your name and email fill in automatically — just add a subject and message, and it lands in the admin backend for handling.",
							"steps": [
								"Open the form from the \"Contact us\" footer link or the home page.",
								"Confirm your name and email (auto-filled when signed in).",
								"Write the subject and message (up to 3000 characters).",
								"Click \"Send message\"; the form clears itself on success."
							],
							"tip": "Enable \"Shake to report\" in your profile preferences and shaking your phone pops up the contact dialog — handy for reporting issues on the spot.",
							"tools": [
								{
									"name": "Auto-fill",
									"use": "Your name and email fill in automatically while signed in."
								},
								{
									"name": "Validation",
									"use": "Name, a valid email, and message content are required before sending."
								},
								{
									"name": "Shake to report",
									"use": "With the preference on, shaking your phone opens the report dialog instantly."
								}
							],
							"pageurl": "contact.html",
							"pagelabel": "Open Contact"
						}
					]
				}
			]
		},
		"tablepage": {
			"title": "Table Detail",
			"heading": "Table Detail",
			"back": "Back",
			"guidekicker": "Related Guide",
			"guidedesc": "This page is mostly used for seating flow, hand records, and table stats. Jump back to the seating and hand guide sections when needed.",
			"guideseat": "Seating Guide",
			"guidehand": "Hand Guide",
			"taboverview": "Overview",
			"tabplayers": "Players",
			"tabhands": "Hands",
			"tabstats": "Stats",
			"tabev": "EV Chart",
			"overviewhandsummary": "Hand Summary",
			"descriptiontitle": "Notes",
			"maxseat": "Max Seats:",
			"seat6": "6-max",
			"seat8": "8-max",
			"seat9": "9-max",
			"seat10": "10-max",
			"seatn": "{n}-max",
			"firstdealer": "First Dealer:",
			"selfseat": "Your Seat:",
			"save": "Save",
			"currentseat": "Current Seats",
			"mergetablearia": "Choose a target table to merge into",
			"merge": "Merge into Target",
			"saveplayers": "Save Seats",
			"seat": "Seat",
			"history": "History",
			"seatnote": "* Every seat can record multiple joins, player swaps, rebuys, and leaves. Full seat history is kept and supports tournament moves and fills.",
			"handrecord": "Hand Records",
			"newhand": "New Hand",
			"stackadjust": "Stack Adjust",
			"filterplayeraria": "Filter hands by player ID",
			"filterplayerplaceholder": "Player ID",
			"filterseataria": "Filter hands by seat",
			"filterseatplaceholder": "Seat",
			"filterfromaria": "Filter start date",
			"filtertoaria": "Filter end date",
			"filterclear": "Clear",
			"table": "Table",
			"player": "Player",
			"blind": "Blinds",
			"hand": "Hand",
			"result": "Result",
			"createinfo": "Created",
			"action": "Action",
			"stats": "Stats",
			"evtitle": "Stack Trend",
			"evdesc": "This chart currently accumulates real hand results from oldest on the left to newest on the right.",
			"unknown": "Unknown",
			"currentplayers": "Players",
			"linkedplayernote": "Use confirmed registrations so hand records can stay linked to real accounts.",
			"genericplayernote": "Generic record mode. Enter player names directly.",
			"emptyseat": "Empty",
			"othertable": "Other Table",
			"playernameplaceholder": "Player name",
			"unknownstack": "Unknown Stack",
			"clearseat": "Clear",
			"bustseat": "Bust",
			"moveseat": "Move",
			"moveplaceholder": "Move...",
			"selecttargettable": "Select target table",
			"selecttargettableerror": "Please select a target table",
			"targettable": "target table",
			"mergeconfirm": "Merge every player on this table into \"{table}\"? Seats on this table will be cleared after merging.",
			"mergesuccess": "Table merged",
			"mergefail": "Merge failed",
			"thisplayer": "this player",
			"bustconfirm": "Bust Seat {seat} \"{player}\"? The player will be removed from this table.",
			"bustsuccess": "Player busted",
			"bustfail": "Bust failed",
			"movesuccess": "Player moved",
			"movefail": "Move failed",
			"noseats": "No Seats",
			"startchip": "Starting Stack",
			"time": "Time",
			"place": "Venue",
			"nodescription": "<i>No notes</i>",
			"handcount": "Hands",
			"netprofit": "Net Profit",
			"winrate": "Win Rate",
			"allincount": "All-in Hands",
			"profit": "Profit",
			"sessionnotfound": "The requested session was not found",
			"savesuccess": "Saved",
			"savefail": "Save failed",
			"saving": "Saving...",
			"edit": "Edit",
			"delete": "Delete",
			"nohands": "No hands yet",
			"sorttime": "Time",
			"deletehandconfirm": "Delete this hand?",
			"deletehandconfirmdetail": "This action cannot be undone.",
			"deletesuccess": "Deleted",
			"deletefail": "Delete failed",
			"loadhandfail": "Failed to load hands",
			"displayrange": "Showing",
			"prev": "Previous",
			"next": "Next"
		},
		"newtablepage": {
			"rangeerror": "Please enter a valid table number range",
			"rangelimit": "You can add at most 100 tables at a time",
			"tablenorequired": "Please enter a table number",
			"addsuccess": "Added successfully",
			"unknownerror": "Unknown error",
			"sessionnotfound": "Session not found"
		},
		"edittablepage": {
			"tablenotfound": "Table not found",
			"tablenorequired": "Please enter a table number",
			"editsuccess": "Updated successfully",
			"unknownerror": "Unknown error"
		},
		"tableboardpage": {
			"title": "Table Board",
			"back": "Back to Session",
			"refresh": "Refresh",
			"autobalance": "Auto-balance Seating",
			"tables": "Tables",
			"players": "Players",
			"avg": "Avg / Table",
			"empty": "No tables in this session",
			"seatempty": "empty",
			"needmerge": "Mergeable (empty)",
			"unbalanced": "Unbalanced",
			"hintprefix": "Balance suggestion: ",
			"over": "Over: ",
			"under": "Under: ",
			"confirmbalance": "Auto-balance seating across all tables now?",
			"balancedone": "Balance applied",
			"balancefail": "Balance failed",
			"nosession": "Missing session ID",
			"loadfail": "Load failed",
			"noperm": "No permission to view this board"
		},
		"controlpage": {
			"title": "Referee Control",
			"heading": "Event Control",
			"back": "Back",
			"edittitle": "✎ Title",
			"regbadgetitle": "Click to toggle",
			"mainpause": "⏸ Pause Timer",
			"mainresume": "▶ Resume Timer",
			"timeadjust": "Time Adjust",
			"timeadjusthint": "Useful for quick bubble-time changes",
			"setto": "Set To",
			"apply": "Apply",
			"resettime": "↺ Reset Current Time",
			"enditem": "⏭ End Current Item",
			"levelcontrol": "Level Control",
			"previtem": "◀ Previous",
			"nextitem": "Next ▶",
			"jumptol": "Jump to L",
			"jumpplaceholder": "Level number",
			"jump": "Jump",
			"jumphint": "Enter a level number only. Breaks are skipped.",
			"breakcontrol": "Break Control",
			"insertbreak": "☕ Insert Break Now",
			"endbreak": "⏹ End This Break",
			"defaultduration": "Default Duration",
			"minuteunit": "Minutes",
			"breakhint": "Breaks are standalone items. You can insert or remove them anywhere in Structure.",
			"playermanage": "Player Management",
			"totalentries": "Total Entries",
			"avgchips": "Average Stack",
			"bust": " Bust",
			"addentry": "+ Add Entry",
			"manualedit": "Manual Edit",
			"managelinkedplayers": "Manage Registered Players",
			"prizeitm": "Prize Pool / ITM",
			"cashprize": "Cash Prize Pool",
			"auto": "Auto",
			"manual": "Manual",
			"manualamount": "Manual Amount",
			"itmsetting": "ITM Setting",
			"pctmode": "Percentage",
			"countmode": "Direct Count",
			"itmpctaria": "ITM percentage",
			"count": "Count",
			"smartpayout": "✨ Smart Prize Split (by ITM count)",
			"rankpreview": "Placement Preview",
			"editpayout": "⚙ Edit Places / Range / Prize",
			"otherreward": "Other Rewards",
			"quickpreset": "Quick Presets",
			"bubblemode": "🫧 Bubble Mode",
			"handforhand": "🃏 Hand-for-Hand",
			"colorup": "🪙 Color-Up Notice",
			"presethint1": "Bubble mode: pauses the timer and broadcasts a message.",
			"presethint2": "Hand-for-hand: pauses automatically and marks the state as hand-for-hand.",
			"structuretitle": "Structure",
			"structurehint": "Tap to jump",
			"viewstructure": "View Structure",
			"editstructure": "Edit Structure",
			"marquee": "Marquee Message",
			"marqueeplaceholder": "Enter marquee text. Use | to separate multiple messages.",
			"marqueearia": "Marquee message content",
			"marqueereset": "↺ Default Text",
			"marqueesave": "Save and Broadcast",
			"syncok": "Display synced",
			"syncretry": "Retrying connection",
			"ready": "Ready",
			"settings": "⚙ Settings",
			"modaltitle": "Edit Title",
			"maintitle": "Main Title",
			"subtitle": "Subtitle",
			"subtitleplaceholder": "Example: Main Event",
			"save": "Save",
			"modalplayers": "Edit Players",
			"remainingplayers": "Remaining Players",
			"startingchips": "Starting Chips",
			"modallinkedplayers": "Linked Player Elimination",
			"search": "Search",
			"playersearchplaceholder": "Player name / ID",
			"table": "Table",
			"tablesearchplaceholder": "Table name / number",
			"seat": "Seat",
			"modalsettings": "Settings",
			"buyin": "Buy-in",
			"fee": "Fee",
			"sessionfeehint": "Buy-in and fee come from the session. Edit them from the session page.",
			"sound": "Sound",
			"vibration": "Vibration",
			"autostart": "Auto-start by time",
			"timebankdefault": "Default Timebank Seconds",
			"timebanksound": "Timebank Sound",
			"on": "On",
			"off": "Off",
			"resetall": "⚠ Full Reset",
			"confirmtitle": "Confirm Action",
			"cancel": "Cancel",
			"confirm": "Confirm",
			"guide": "On-site Guide",
			"guidecollapse": "Expand / Collapse",
			"guideheading1": "Read this first if it's your first time",
			"guideline1": "1. Confirm the current level, registration status, and remaining players first.",
			"guideline2": "2. Use time adjust, break control, and player management for normal changes.",
			"guideline3": "3. For actions that change the whole event state, use the danger section.",
			"guideheading2": "High-impact actions",
			"guideimpact1": "+1 Entry changes total entries and prize-pool estimates.",
			"guideimpact2": "REG Closed directly affects the registration desk.",
			"guideimpact3": "Smart Prize Split overwrites the current payout setup.",
			"danger": "Danger Zone",
			"dangercopy": "Actions here directly change the whole event state, registration, or current level. Double-check before using them.",
			"dangerenditem": "End Current Item",
			"dangerregtoggle": "Toggle REG Status",
			"dangerautoitm": "Overwrite Payouts",
			"dangerreset": "Full Control Reset",
			"recentactions": "Recent Actions",
			"nohistory": "No action history yet",
			"runningstatus": "▶ Running",
			"pausedstatus": "⏸ Paused",
			"countdownstatus": "▶ Counting Down",
			"breakstage": "On Break",
			"regclosed": "Closed",
			"regopen": "Open",
			"prizesummarysuffix": " places",
			"synchealthy": "Sync Healthy",
			"reconnecting": "Reconnecting",
			"unnamedplayer": "Unnamed player",
			"noplayers": "No matching players",
			"stillin": "Still In",
			"eliminated": "Eliminated",
			"restore": "Restore",
			"handmode": "✋ By Hands",
			"handlabel": "Hands",
			"handcontroltitle": "Hand Count",
			"handplus": "+1 Hand",
			"handminus": "−1 Hand",
			"handreset": "↺ Reset Hands",
			"handhint": "This level is counted by hands, not by a countdown. Press \"Next item\" to advance once the target is reached.",
			"handtargetreached": "Hand target reached",
			"handactionprefix": "Hands ",
			"tablemanage": "Table Management",
			"tablecountlabel": "Tables",
			"tableseatedlabel": "Seated",
			"tableavglabel": "Avg / Table",
			"tablemergetitle": "🪑 Table Merge Reminder",
			"tablemergehintprefix": "Players left ",
			"tablemergehintmid1": " across ",
			"tablemergehintmid2": " tables — can merge into ",
			"tablemergehintmid3": " tables, tables to break: ",
			"tablemergehintsuffix": ". Tap to open the table board and merge.",
			"tablemergecandidates": "Break first: ",
			"tablemergejoin": ", ",
			"tablemergetoast": "🪑 Tables can now be merged — consider breaking a table",
			"tablemergenone": "No table merge needed right now",
			"tablenotables": "No tables in this session yet",
			"tableboardlink": "🪑 Merge / Table Board",
			"reglistlink": "📋 Registration List",
			"tablelinkhint": "Use Table Board for merging and auto-balance; open Registration List for entries and seat details.",
			"defaultmarquee": "⚠ Chip color-up is coming at the next level, please verify your stack size | Welcome to today's event and good luck to all players | Please watch for on-site organizer announcements | Please follow the house rules and keep strong sportsmanship"
		},
		"structurepage": {
			"title": "Structure",
			"heading": "Structure",
			"back": "Back",
			"edit": "Edit Structure",
			"sectiontitle": "Structure",
			"summarytitle": "Summary",
			"totalduration": "Total Duration",
			"loading": "Loading",
			"ready": "Ready",
			"missingid": "Missing sessionid parameter",
			"loadfail": "Load failed",
			"networkfail": "Network unstable. Please try again.",
			"syncok": "Synced",
			"syncloading": "Loading",
			"syncfail": "Load failed",
			"syncnetwork": "Network unstable",
			"subtitledefault": "STRUCTURE VIEW",
			"regclosed": "REG CLOSED",
			"regopen": "REG OPEN",
			"break": "Break",
			"breaktime": "Break Time",
			"chiprace": "Chip Race",
			"starttime": "Start",
			"regcloseprefix": "Registration closes after: ",
			"regclosesuffix": "",
			"regclosenone": "No automatic registration close point set yet"
		},
		"structureeditpage": {
			"title": "Edit Structure",
			"heading": "Edit Structure",
			"back": "Back",
			"view": "View Structure",
			"save": "Save Structure",
			"addlevel": "+ Level",
			"addbreak": "+ Break",
			"quicktitle": "Quick Apply",
			"leveldur": "Level Duration",
			"apply": "Apply",
			"breakdur": "Break Duration",
			"edittitle": "Edit Items",
			"item": "Item",
			"type": "Type",
			"minute": "Minutes",
			"action": "Action",
			"reghint": "Checking REG means registration closes automatically after that item. Break rows only need minutes.",
			"parsetitle": "Paste & Parse",
			"parsehint": "Paste a blind structure copied from another site, then click Parse. The result fills the editor below for you to review before saving.",
			"parseplaceholder": "Paste the tournament structure text here…",
			"parsearia": "External structure text",
			"parsebtn": "Parse",
			"parseaibtn": "Parse with AI",
			"parseempty": "Please paste some text to parse first",
			"parsing": "Parsing…",
			"parsingai": "Parsing with AI…",
			"parsingimage": "AI is reading the image…",
			"parseimagebtn": "Parse from image (AI)",
			"aidisabled": "AI key is not configured on the backend yet",
			"parsefail": "Could not parse a structure. Make sure the pasted text contains a levels table.",
			"parsesuccessprefix": "Parsed ",
			"parsesuccesssuffix": " items — please review below",
			"showaiprompt": "Can't parse? Use an external AI",
			"aiprompthint": "If the built-in parser can't handle your structure, copy the prompt below, paste it into any AI (ChatGPT / Gemini / Claude) to turn it into JSON, then paste that JSON into the \"Import JSON\" box below and click import.",
			"copyaiprompt": "Copy prompt",
			"aipromptcopied": "Prompt copied — paste it into an AI, then import the JSON it returns",
			"aipromptstructlabel": "Structure to convert:",
			"aipromptplaceholder": "<paste your structure text here>",
			"ioutitle": "Import / Export",
			"exportjson": "Export JSON",
			"importjson": "Import JSON",
			"importfile": "Import File",
			"jsonplaceholder": "Exported blind structure JSON will appear here, or paste JSON and click import.",
			"jsonaria": "Blind structure JSON",
			"loading": "Loading",
			"ready": "Ready",
			"confirmtitle": "Confirm Action",
			"cancel": "Cancel",
			"confirm": "Confirm",
			"noraise": "No Raise",
			"subtitledefault": "STRUCTURE EDIT",
			"regclosed": "REG CLOSED",
			"regopen": "REG OPEN",
			"jsonerror": "Invalid JSON format",
			"jsonempty": "No blind structure found to import",
			"importsuccessprefix": "Imported ",
			"importsuccesssuffix": " items",
			"break": "Break",
			"moveup": "Move Up",
			"movedown": "Move Down",
			"insertabove": "Insert level above",
			"copy": "Copy",
			"delete": "Delete",
			"atleastone": "At least one item is required",
			"deleteitem": "Delete this item?",
			"addeditemprefix": "Added ",
			"copieditemprefix": "Copied ",
			"moveditemupprefix": "Moved up ",
			"moveditemdownprefix": "Moved down ",
			"deleteditemprefix": "Deleted ",
			"leveldurapplied": "Level duration applied",
			"breakdurapplied": "Break duration applied",
			"syncloading": "Loading",
			"syncok": "Synced",
			"syncfail": "Load failed",
			"loadfail": "Load failed",
			"syncnetwork": "Network unstable",
			"networkfail": "Network unstable. Please try again.",
			"signinagain": "Please sign in again",
			"savesync": "Saving",
			"savesuccess": "Structure saved",
			"savefail": "Save failed",
			"exportsuccess": "JSON exported and downloaded",
			"badleveldur": "Please enter a valid level duration",
			"badbreakdur": "Please enter a valid break duration",
			"levelhands": "Level (by hands)",
			"handtargetunit": "hands",
			"handhint": "\"Level (by hands)\" is counted by hands: put the target hand count in the number field (0 = no target). The floor advances it by hand count instead of a countdown.",
			"sumlevels": "Levels",
			"sumbreaks": "Breaks",
			"sumduration": "Clock time",
			"sumhour": "h",
			"summin": "m",
			"sumreg": "Late reg ends",
			"sumregnone": "Not set",
			"sumlevelword": "LV",
			"sumhandsprefix": "incl. ",
			"sumhandssuffix": " hand-based level(s), untimed",
			"warntitle": "Structure check",
			"warndecrease": "Blinds go down",
			"warndecreasemsg": "smaller than the previous level — likely a typo or paste error",
			"warnrace": "Colour-up too early",
			"warnracemsg": "removes the {chip} denomination, but {level} still needs it afterwards",
			"warnante": "Inconsistent ante",
			"warnantemsg": "has no ante even though earlier levels already collect one",
			"warnlevelword": "L",
			"warnbreakword": "Break"
		},
		"payouteditpage": {
			"title": "Edit Payout",
			"heading": "Edit Payout",
			"subtitledefault": "PAYOUT EDIT",
			"regclosed": "REG CLOSED",
			"regopen": "REG OPEN",
			"back": "Back to Control",
			"save": "Save Payout",
			"quicktitle": "Quick Add",
			"quickranklabel": "Rank Range",
			"quickrankplaceholder": "1 or 1-10",
			"quickrankaria": "Rank range",
			"add": "Add",
			"quickcashlabel": "Cash",
			"quickcashplaceholder": "Cash amount",
			"quickcasharia": "Cash",
			"quickrewardplaceholder": "Reward (optional)",
			"quickrewardaria": "Reward",
			"quickhint": "Enter a single rank or a range like 1-10. Cash counts into the total; reward is optional and shows together with cash as \"cash + reward\" when filled.",
			"gentitle": "Quick Generate",
			"genplaceslabel": "Paid Places",
			"genplacesaria": "Number of paid places",
			"genpoollabel": "Prize Pool (optional)",
			"genpoolaria": "Prize pool",
			"gensteeplabel": "Steepness",
			"gensteeparia": "Steepness",
			"genroundlabel": "Cash Rounding",
			"genroundaria": "Cash rounding",
			"genminlabel": "Minimum Cash",
			"genminaria": "Minimum cash",
			"genbtn": "Generate Payouts",
			"genhint": "Lays a front-heavy payout curve by the number of places. Prize pool defaults to the pool computed on the control page and can be overridden. Smaller steepness concentrates more on the top (e.g. 0.6 gives the champion a larger share). With a prize pool, cash is filled in automatically and the rounding remainder goes to the champion; leave it empty to create ranks only. Minimum cash sets a floor for bottom places (e.g. 2000); places below it are raised to the floor and the difference is redistributed among the rest. Generating replaces all current payouts.",
			"edittitle": "Payout Settings",
			"headrank": "Rank",
			"headcash": "Cash",
			"headreward": "Reward",
			"headaction": "Action",
			"ioutitle": "Import / Export",
			"exportjson": "Export JSON",
			"importjson": "Import JSON",
			"importfile": "Import File",
			"jsonplaceholder": "Exported payout JSON will appear here, or paste JSON and click import.",
			"jsonaria": "Payout JSON",
			"loading": "Loading",
			"ready": "Ready",
			"rowrankplaceholder": "1 or 1-10",
			"rowcashplaceholder": "Cash",
			"rowrewardplaceholder": "Advance / ticket (optional)",
			"moveup": "Move Up",
			"movedown": "Move Down",
			"copy": "Copy",
			"delete": "Delete",
			"emptylist": "No payouts set yet.",
			"otherrewardtitle": "Other Rewards",
			"otherrewardadd": "Add Row",
			"otherrewardempty": "No other rewards yet.",
			"otherrewardhint": "For rewards that are not tied to a finishing place, such as bounties, first-blood prizes, or lucky draws. Fill in your own label text in the \"Rank\" cell. Cash entered here counts toward the total prize on the session page, but it is not matched to any rank and is not assigned to a specific player automatically.",
			"otherrewardlabelplaceholder": "Bounty",
			"otherrewardrewardplaceholder": "Prize (optional)",
			"otherrewardlegacylabel": "Other",
			"sumprefix": "Cash total: $",
			"previewplacesprefix": "Pays ",
			"previewplacessuffix": " places",
			"previewcashprefix": "Total cash $",
			"previewchampionprefix": "Champion ",
			"previewnoncashprefix": "Includes ",
			"previewnoncashsuffix": " reward-only places",
			"jsonerror": "Invalid JSON format",
			"jsonempty": "No payouts found to import",
			"importsuccessprefix": "Imported ",
			"importsuccesssuffix": " payouts",
			"syncloading": "Loading",
			"syncok": "Synced",
			"syncfail": "Load failed",
			"loadfail": "Load failed",
			"syncnetwork": "Network unstable",
			"networkfail": "Network unstable. Please try again.",
			"signinagain": "Please sign in again",
			"savesync": "Saving",
			"savesuccess": "Payouts saved",
			"savefail": "Save failed",
			"genplacesrequired": "Please enter the number of paid places",
			"genconfirm": "Generating will replace all current payouts. Continue?",
			"gensuccessprefix": "Generated ",
			"gensuccesssuffix": " payouts — remember to save",
			"exportsuccess": "JSON exported and downloaded"
		},
		"apidocpage": {
			"title": "Public API Docs",
			"back": "Back",
			"overview": "Overview",
			"overviewdesc": "Public documentation for all PokerTrace API endpoints. All endpoints are JSON. Most require a Bearer token in the header; a few tool and sign-in endpoints are open — see each endpoint's Auth field.",
			"endpoints": "Endpoints",
			"endpointsunit": "endpoints",
			"categories": "Categories",
			"searchplaceholder": "Search path, name or method (GET / POST…)",
			"noresults": "No matching endpoints.",
			"expandall": "Expand all",
			"collapseall": "Collapse all",
			"request": "Request",
			"pathparams": "Path params",
			"queryparams": "Query params",
			"requestbody": "Request body",
			"response": "Response",
			"errors": "Errors",
			"example": "Example",
			"requestlabel": "Request example",
			"responselabel": "Response example",
			"required": "required",
			"optional": "optional",
			"baseurl": "Base URL",
			"baseurlnote": "The current origin is prepended automatically, e.g. https://pokertrace.net/backendapi/",
			"authlabel": "Authentication",
			"authnote": "Some tool and sign-in endpoints need no token"
		},
		"toollistpage": {
		    "title": "Tool List",
		    "eyebrow": "Tool Center",
		    "desc": "Find live, practice, chip, payout, and operation tools quickly.",
		    "back": "Back",
		    "searchlabel": "Search tools",
		    "searchplaceholder": "Type keywords like ICM, seat, chip",
		    "countlabel": "Showing",
		    "empty": "No matching tools",
		    "all": "All",
		    "featured": "Featured",
		    "live": "Live",
		    "chip": "Chip",
		    "payout": "Payout",
		    "strategy": "Strategy",
		    "operation": "Operation",
		    "learn": "Learn",
		    "develop": "Developer",
		    "favorite": "Favorite",
		    "recent": "Recent",
		    "favoriteadd": "Add Favorite",
		    "favoriteremove": "Saved",
		    "favoriteempty": "No favorite tools yet",
		    "recentempty": "No recent tools yet"
		},
		"legalpage": {
			"backtohome": "Back to Home",
			"backtodashboard": "Back to Dashboard"
		},
		"pageauto": {
		    "display.html": {
		        "title": "Tournament Display",
		        "attrtitle": {
		            "#syncDot": "Syncing with control"
		        },
		        "text": {
		            ".payout-card > .lbl": "Payouts",
		            ".prize-pool-card .lbl": "Total Prize Pool",
		            "#bubbleBanner": "BUBBLE TIME",
		            "#h4hBanner": "HAND-FOR-HAND",
		            "#tagLabel": "LEVEL",
		            ".break-title": "Break Time",
		            ".blind-label": "Blinds",
		            ".ante-label": "BB Ante",
		            "#regCountdownCard .lbl": "Registration Close",
		            ".players-card .lbl": "Players Remaining",
		            ".avg-card .lbl": "Avg Stack",
		            "#breakCountdownCard .lbl": "Next Break",
		            "#nextBlindsCard .lbl": "Next Blinds",
		            ".schedule-card .lbl": "Schedule",
		            ".mobile-prize-card .lbl": "Total Cash Prize"
		        }
		    },
		    "editsession.html": {
		        "title": "Edit Session"
		    },
		    "edittable.html": {
		        "title": "Edit Table",
		        "text": {
		            ".mb-6 p": "Edit Table",
		            ".mb-6 h1": "Edit Table",
		            "label[for=\"no\"]": "Table No."
		        },
		        "value": {
		            "#back": "Back",
		            "#submit": "Submit"
		        }
		    },
		    "handdetail.html": {
		        "title": "Hand Detail",
		        "text": {
		            "h1": "Hand Detail",
		            "#back": "Back",
		            "#gtoreflink": "GTO Reference"
		        }
		    },
		    "newedithand.html": {
		        "title": "New / Edit Hand"
		    },
		    "newtable.html": {
		        "title": "New Table"
		    },
		    "payoutedit.html": {
		        "title": "Edit Payout"
		    },
		    "privacy.html": {
		        "title": "Privacy Policy",
		        "text": {
		            ".mb-6 > p:nth-of-type(1)": "Privacy",
		            "h1": "Privacy Policy",
		            ".mb-6 > p:nth-of-type(2)": "PokerTrace values the protection of user data, session data, and tournament management data. This policy explains how we may collect, use, store, and protect information when providing account, session, registration, staff, table, timer, and reporting features.",
		            ".space-y-5 section:nth-child(1) h2": "1. Scope",
		            ".space-y-5 section:nth-child(1) p": "This policy applies to data generated or provided when you use the PokerTrace website, system features, APIs, timers, and related pages. If you use a self-hosted deployment, storage location, management methods, and permissions may be determined by that deployer. Please also refer to the deployer's own documentation.",
		            ".space-y-5 section:nth-child(2) h2": "2. Information We May Collect",
		            ".space-y-5 section:nth-child(2) p": "When you register, sign in, or use PokerTrace, the system may store account information, display name, email, player ID, avatar, permission role, session data, registration data, seating data, tables and hand records, buy-in and result statistics, staff relationship data, timer settings, operation records, sign-in state, and device or browser information needed to provide the service.",
		            ".space-y-5 section:nth-child(3) h2": "3. Purpose of Use",
		            ".space-y-5 section:nth-child(3) p": "We use data to provide account sign-in, identity verification, session creation and management, registration and seating, permission checks, staff management, timer synchronization, personal and session statistics, troubleshooting, security maintenance, support replies, system improvement, and necessary record keeping. We do not sell your personal data to third parties or use it for advertising unrelated to PokerTrace.",
		            ".space-y-5 section:nth-child(4) h2": "4. Sharing and Disclosure",
		            ".space-y-5 section:nth-child(4) p": "Within the scope needed to provide the service, some data may be visible to session owners, registered players, hired staff, or administrators according to roles and permissions. Examples include session rosters, seating, staff relationships, and necessary statistics. Except for legal requirements, system security, dispute handling, user protection, or your consent, we do not arbitrarily publish or provide your personal data.",
		            ".space-y-5 section:nth-child(5) h2": "5. Retention and Deletion",
		            ".space-y-5 section:nth-child(5) p": "Data is retained for periods needed for service operation, backup, auditing, security maintenance, and dispute handling. When data is no longer needed, or when a user makes a reasonable deletion request and permissions are confirmed, we will assist with deletion or anonymization according to the actual system state. Some data may need to remain for backups, legal obligations, accounting records, or abuse prevention.",
		            ".space-y-5 section:nth-child(6) h2": "6. Data Security",
		            ".space-y-5 section:nth-child(6) p": "We use reasonable methods to protect data, such as permission controls, sign-in verification, database management, system maintenance, and necessary security checks. However, network transmission and information systems cannot be guaranteed absolutely secure. Users should also protect accounts, passwords, and sign-in credentials and avoid sharing accounts with others.",
		            ".space-y-5 section:nth-child(7) h2": "7. Cookies and Local Storage",
		            ".space-y-5 section:nth-child(7) p": "PokerTrace may use browser local storage, tokens, or similar technologies to store sign-in state, language preference, interface settings, and necessary usage state. These are mainly used to maintain service functionality and improve the user experience. If you clear browser data, some sign-in state or settings may be reset.",
		            ".space-y-5 section:nth-child(8) h2": "8. Third-Party Services",
		            ".space-y-5 section:nth-child(8) p": "The service may reference third-party resources or tools, such as frontend styling, JavaScript libraries, servers, databases, email services, or deployment platforms. Third-party services may process necessary connection, technical, or log data according to their own policies. If you self-host PokerTrace, please confirm how the third-party services you use handle data.",
		            ".space-y-5 section:nth-child(9) h2": "9. Open Source and Self-Hosting Responsibility",
		            ".space-y-5 section:nth-child(9) p": "PokerTrace supports open-source and self-hosted use. Self-hosting deployers are responsible for database location, backup policy, administrator permissions, server security, access control, log retention, and user notice obligations. If you use a non-official deployment, please confirm with that deployer how your data is stored, used, and deleted.",
		            ".space-y-5 section:nth-child(10) h2": "10. User Rights",
		            ".space-y-5 section:nth-child(10) p": "Depending on the situation, you may request access, correction, deletion, or suspension of use of your personal data. To protect data security, we may need to confirm your identity, account permissions, and request scope before processing. If data involves other users, session records, legal retention obligations, or system security needs, a request may not be executed immediately or completely.",
		            ".space-y-5 section:nth-child(11) h2": "11. Policy Updates and Contact",
		            ".space-y-5 section:nth-child(11) p": "We may revise this privacy policy due to feature changes, legal updates, security needs, or service policy changes. Updated content will be posted on this page and takes effect when published. If you want to access, correct, or delete data, or have questions about this policy, you may submit a request through the Contact page."
		        }
		    },
		    "register.html": {
		        "title": "Registration List",
		        "text": {
		            "h1": "Registration List",
		            "#back": "Back to Session",
		            ".mb-6 .grid div:nth-child(1) .text-sm": "Registered",
		            ".mb-6 .grid div:nth-child(2) .text-sm": "Confirmed",
		            ".mb-6 .grid div:nth-child(3) .text-sm": "Cancelled",
		            "details summary .text-lg": "Operation Guide / Status Guide / Beginner Guide",
		            "details summary > div:last-child": "Expand / Collapse",
		            "#registrationlisteyebrow": "List",
		            "#registrationlistheading": "Registration List",
		            "#registrationlistnote": "Click a column to sort; select rows for batch actions; export the current filtered result on the right.",
		            "th:nth-child(1)": "Select",
		            "th:nth-child(2)": "Player",
		            "th:nth-child(3)": "Registered At",
		            "th:nth-child(4)": "Status",
		            "th:nth-child(5)": "Seat",
		            "th:nth-child(6)": "Result",
		            "th:nth-child(7)": "Adjust",
		            "th:nth-child(8)": "Action",
		            "#empty": "No registration records yet",
		            "#emptymobile": "No registration records yet"
		        }
		    },
		    "signup.html": {
		        "title": "Sign Up"
		    },
		    "stackadjust.html": {
		        "title": "Stack Adjustment"
		    },
		    "staffverify.html": {
		        "title": "Staff Invitation"
		    },
		    "terms.html": {
		        "title": "Terms of Service",
		        "text": {
		            ".mb-6 > p:nth-of-type(1)": "Terms",
		            "h1": "Terms of Service",
		            ".mb-6 > p:nth-of-type(2)": "Welcome to PokerTrace. To protect users, hosts, and hired staff, please read the following terms before using this service. By registering, signing in, creating sessions, registering for sessions, managing data, or using timer features, you indicate that you understand and agree to this page.",
		            ".space-y-5 section:nth-child(1) h2": "1. Nature of the Service",
		            ".space-y-5 section:nth-child(1) p": "PokerTrace is a poker session and tournament management tool. Features include session creation, registration management, seating, table records, staff management, tournament timers, and personal statistics. The service helps users organize and present event data, but does not mean the platform directly hosts, participates in, represents, guarantees, or endorses any real-world event.",
		            ".space-y-5 section:nth-child(2) h2": "2. Lawful Use Responsibility",
		            ".space-y-5 section:nth-child(2) p": "Users, hosts, and hired staff are responsible for confirming local laws, venue rules, event rules, tax requirements, payment handling, and related administrative obligations. Any event created or managed through PokerTrace remains the responsibility of the actual event operator. This service does not provide legal, tax, financial, or gambling compliance advice.",
		            ".space-y-5 section:nth-child(3) h2": "3. Account and Data Management",
		            ".space-y-5 section:nth-child(3) p": "Users should properly protect accounts, passwords, and sign-in credentials, and ensure that personal data, session data, registration data, staff data, and statistics entered into the system are truthful and manageable. Losses or disputes caused by shared accounts, leaked credentials, incorrect data entry, or delayed updates are the responsibility of the account user or actual manager.",
		            ".space-y-5 section:nth-child(4) h2": "4. Data Accuracy and On-Site Confirmation",
		            ".space-y-5 section:nth-child(4) p": "PokerTrace attempts to store, sync, and display system data reliably, but data may still be inconsistent or delayed due to network conditions, device environments, operation delays, browser differences, permission settings, or system maintenance. Hosts should confirm important information on site, including registration lists, seating, chips, buy-in records, payouts, advancement, and elimination results.",
		            ".space-y-5 section:nth-child(5) h2": "5. Payments and Transactions",
		            ".space-y-5 section:nth-child(5) p": "The service only provides record keeping and management assistance. It does not collect payments, hold funds, process settlement, or participate in money transfers between users. If an event involves entry fees, prizes, cost sharing, wages, or other payments, the related parties must confirm amounts, payment methods, receipts, records, and legal responsibility themselves.",
		            ".space-y-5 section:nth-child(6) h2": "6. System Availability",
		            ".space-y-5 section:nth-child(6) p": "We work to maintain system stability and data security, but do not guarantee that the service will be uninterrupted, error-free, or fully suitable for a specific purpose at all times, on all devices, or in all network environments. During maintenance, feature changes, third-party service issues, force majeure, or security risks, we may suspend, limit, or adjust parts of the service.",
		            ".space-y-5 section:nth-child(7) h2": "7. Open Source and Self-Hosted Environments",
		            ".space-y-5 section:nth-child(7) p": "PokerTrace treats open-source and self-hosted use as an important direction. If you deploy or modify this project yourself, you are responsible for servers, databases, backups, permissions, security, third-party packages, and version updates. Data loss, security incidents, misconfiguration, or service interruptions in self-hosted environments are outside the scope of official responsibility.",
		            ".space-y-5 section:nth-child(8) h2": "8. Intellectual Property and Content Use",
		            ".space-y-5 section:nth-child(8) p": "Event content, names, descriptions, images, and other data created or uploaded by users remain owned by the original rights holders or providers according to their rights status. Users should ensure their content does not infringe copyrights, trademarks, image rights, privacy rights, or other lawful rights, and agree that the service may process and display such content within the scope needed to provide features.",
		            ".space-y-5 section:nth-child(9) h2": "9. Updates to These Terms",
		            ".space-y-5 section:nth-child(9) p": "We may revise these terms due to feature updates, maintenance needs, legal changes, or service policy adjustments. Updated content will be posted on this page and takes effect when published. Users are encouraged to review this page regularly to understand the latest service rules and responsibility scope."
		        }
		    },
		    "toollist.html": {
		        "title": "Tool List",
		        "text": {
		            "#toollisteyebrow": "Tool Center",
		            "#toollisttitle": "Tool List",
		            "#toollistdesc": "Find live, practice, chip, payout, and operation tools quickly.",
		            "#toollistback": "Back",
		            "#toollistsearchlabel": "Search tools",
		            "#toollistcountlabel": "Showing",
		            "#toollistempty": "No matching tools"
		        },
		        "placeholder": {
		            "#toollistsearch": "Type keywords like ICM, seat, chip"
		        }
		    }
		}
	}
}
