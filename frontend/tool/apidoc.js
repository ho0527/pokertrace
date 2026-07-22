function apidoctext(key){
	if(!TRANSLATE[LANGUAGE]||!TRANSLATE[LANGUAGE]["apidocpage"]){
		return key
	}
	return TRANSLATE[LANGUAGE]["apidocpage"][key]||key
}

function safehtml(value){
	return String(value==null?"":value)
		.replace(/&/g,"&amp;")
		.replace(/</g,"&lt;")
		.replace(/>/g,"&gt;")
		.replace(/"/g,"&quot;")
		.replace(/'/g,"&#39;")
}

// 依目前語系取出文字；可傳入純字串或 { z:中文, e:English } 物件。
function tx(value){
	if(value==null){
		return ""
	}
	if(typeof value=="string"){
		return value
	}
	return ((function(){if(LANGUAGE=="en"){return (value["e"]||value["z"])}return (value["z"]||value["e"])})())||""
}

// ===== 共用認證說明 =====
const AUTHOPEN={ z: "開放端點，無需帶 Token。",e: "Open endpoint — no token required." }
const AUTHTOKEN={ z: "在 Header 帶 <code>Authorization: Bearer &lt;token&gt;</code>，<code>Content-Type: application/json</code>。",e: "Header: <code>Authorization: Bearer &lt;token&gt;</code>, <code>Content-Type: application/json</code>." }
const AUTHADMIN={ z: "需 Bearer Token，且帳號權限需 ≥ 4（管理員）。",e: "Bearer token required, and account permission must be ≥ 4 (admin)." }
const AUTHOWNER={ z: "需 Bearer Token，且須為該場次擁有者或管理員（部分操作開放給已指派的工作人員）。",e: "Bearer token required, and the caller must be the session owner or an admin (some actions are open to assigned staff)." }
const AUTHOWNERSTAFF={ z: "需 Bearer Token，且須為該場次擁有者、管理員（permission ≥ 4）或該場次聘用人員（sessionstaff / userstaff）。",e: "Bearer token required, and the caller must be the session owner, an admin (permission ≥ 4), or staff hired for the session (sessionstaff / userstaff)." }
const AUTHPATHTOKEN={ z: "以網址中的驗證 token 進行驗證，無需 Bearer Token。",e: "Authenticated via the verification token in the URL; no Bearer token needed." }

// ===== 共用錯誤回應 =====
const ETOKEN={ code: "401",data: "ERROR_token_not_found / ERROR_token_error",desc: { z: "Token 缺失或無效。",e: "Token missing or invalid." } }
const EPERM={ code: "403",data: "ERROR_no_permission",desc: { z: "登入者對此資源沒有操作權限。",e: "The caller has no permission for this resource." } }
const EREQ={ code: "400",data: "ERROR_request_data_not_found / ERROR_request_data_type_error",desc: { z: "request body 非合法 JSON，或必填欄位缺失／型別錯誤。",e: "Request body is not valid JSON, or a required field is missing / has the wrong type." } }

function ERR(code,data,z,e){
	return { code: code,data: data,desc: { z: z,e: e } }
}

// 內文欄位建構器：body 參數、回應欄位、子欄位。
function P(name,type,req,z,e,extra){
	let o={ name: name,type: type,req: req,loc: "body",desc: { z: z,e: e } }
	if(extra){
		for(let k in extra){
			o[k]=extra[k]
		}
	}
	return o
}
function R(name,type,z,e,fields,max){
	let o={ name: name,type: type,desc: { z: z,e: e } }
	if(fields){
		o["fields"]=fields
	}
	if(max!=null){
		o["max"]=max
	}
	return o
}
function SUB(name,type,z,e){
	return { name: name,type: type,desc: { z: z,e: e } }
}

function pathparam(name,z,e,ex){
	return { name: name,type: "string",req: true,loc: "path",ex: ex,desc: { z: z,e: e } }
}
function queryparam(name,type,z,e){
	return { name: name,type: type,req: false,loc: "query",desc: { z: z,e: e } }
}
function seatingfields(){
	return [
		SUB("id","int","座位記錄 id。","Seating record id."),
		SUB("tableid","int","牌桌 id。","Table id."),
		SUB("seatno","int","座位號。","Seat number."),
		SUB("type","string","類型：buyin / rebuy / leave。","Type: buyin / rebuy / leave."),
		SUB("name","string","選手名稱。","Player name."),
		SUB("time","string","時間。","Time."),
		SUB("buyin","int","買入金額。","Buy-in amount."),
		SUB("chip","int","計分牌量。","Chip amount."),
		SUB("createtime","string","建立時間。","Creation time."),
		SUB("updatetime","string","更新時間。","Update time.")
	]
}
function paginationfields(){
	return [
		SUB("page","int","目前頁碼。","Current page."),
		SUB("limit","int","每頁筆數。","Page size."),
		SUB("total","int","總筆數。","Total count.")
	]
}
function chipfields(){
	return [
		SUB("id","int","計分牌 id。","Chip id."),
		SUB("shape","string","形狀。","Shape."),
		SUB("value","int","面額。","Denomination value."),
		SUB("color","string","顏色（HEX）。","Color (HEX)."),
		SUB("sortorder","int","排序。","Sort order.")
	]
}
function sessionfields(){
	return [
		SUB("id","int","場次 id。","Session id."),
		SUB("userid","int","主辦人 id。","Organizer user id."),
		SUB("name","string","場次名稱。","Session name."),
		SUB("gametype","string","遊戲類型：cash / tournament / limited。","Game type: cash / tournament / limited."),
		SUB("clubid","int","所屬協會 id。","Owning association id."),
		SUB("token","string","場次分享 token。","Session share token."),
		SUB("starttime","string","開始時間。","Start time."),
		SUB("endtime","string","結束時間。","End time."),
		SUB("buyin","int","買入金額。","Buy-in amount."),
		SUB("buyinfee","int","買入服務費。","Buy-in fee."),
		SUB("chip","int","起始計分牌。","Starting chips."),
		SUB("rebuycount","int","可重買次數。","Allowed rebuy count."),
		SUB("rebuybuyin","int","每次重買金額。","Amount per rebuy."),
		SUB("reentrycount","int","可再入次數。","Allowed re-entry count."),
		SUB("addoncount","int","可加買次數。","Allowed add-on count."),
		SUB("winprice","int","獎金金額。","Prize amount."),
		SUB("winthing","string","獎品。","Prize item."),
		SUB("place","string","名次。","Placement."),
		SUB("totalbuyin","string","總買入。","Total buy-in."),
		SUB("guaranteedprize","int","保底獎金。","Guaranteed prize."),
		SUB("maxseat","int","每桌座位數。","Seats per table."),
		SUB("antemode","string","前注模式：ante / bigblindante。","Ante mode: ante / bigblindante."),
		SUB("openregistration","bool","是否開放自行報名。","Whether self-registration is open."),
		SUB("private","bool","是否為私人場次。","Whether the session is private."),
		SUB("owned","bool","是否為主辦牌局。","Whether it is a hosted session."),
		SUB("unifiedhandrecord","bool","是否啟用統一手牌記錄。","Whether unified hand recording is enabled."),
		SUB("inmoney","bool","是否進入錢圈。","Whether in the money."),
		SUB("inft","bool","是否進入決賽桌。","Whether at the final table."),
		SUB("relationtype","string","關聯類型：normal / satellite / multiday。","Relation type: normal / satellite / multiday."),
		SUB("description","string","說明。","Description.")
	]
}
function relationsessionfields(){
	return [
		SUB("id","int","場次 id。","Session id."),
		SUB("name","string","場次名稱。","Session name."),
		SUB("token","string","場次分享 token。","Session share token."),
		SUB("starttime","string","開始時間。","Start time."),
		SUB("relationtype","string","關聯類型。","Relation type.")
	]
}
function registrationfields(){
	return [
		SUB("id","int","報名 id。","Registration id."),
		SUB("sessionid","int","場次 id。","Session id."),
		SUB("userid","int","選手使用者 id。","Player user id."),
		SUB("status","string","狀態：registered / confirmed / advanced / cancelled。","Status: registered / confirmed / advanced / cancelled."),
		SUB("buyin","int","買入金額。","Buy-in amount."),
		SUB("fee","int","服務費。","Fee."),
		SUB("rebuycount","int","重買次數。","Rebuy count."),
		SUB("reentrycount","int","再入次數。","Re-entry count."),
		SUB("addoncount","int","加買次數。","Add-on count."),
		SUB("prize","int","獎金。","Prize."),
		SUB("prizeoverride","int","獎金覆寫值。","Prize override."),
		SUB("ticketvalue","int","票券價值。","Ticket value."),
		SUB("paymenttype","string","付款方式。","Payment type."),
		SUB("tableid","int","牌桌 id。","Table id."),
		SUB("seatno","int","座位號。","Seat number."),
		SUB("startchip","int","起始計分牌。","Starting chips."),
		SUB("place","string","名次。","Placement."),
		SUB("registertime","string","報名時間。","Registration time."),
		SUB("confirmtime","string","報到時間。","Check-in time.")
	]
}
function handfields(){
	return [
		SUB("id","int","手牌 id。","Hand id."),
		SUB("tableid","int","牌桌 id。","Table id."),
		SUB("token","string","手牌 token。","Hand token."),
		SUB("dealerseat","int","莊家座位。","Dealer seat."),
		SUB("selfseating","int","自家座位。","Own seat."),
		SUB("handcard","string","自家底牌。","Own hole cards."),
		SUB("boardcard","string","公共牌。","Board cards."),
		SUB("gametype","string","遊戲類型。","Game type."),
		SUB("blindlevel","string","級別標籤。","Level label."),
		SUB("smallblind","int","小盲。","Small blind."),
		SUB("bigblind","int","大盲。","Big blind."),
		SUB("ante","int","前注。","Ante."),
		SUB("totalpot","int","總底池。","Total pot."),
		SUB("ps","string","備註。","Notes."),
		SUB("createtime","string","建立時間。","Creation time.")
	]
}
function timerstatefields(){
	return [
		SUB("running","bool","是否運行中。","Whether running."),
		SUB("currentlevel","int","目前級別索引。","Current level index."),
		SUB("clock","int","目前級別剩餘秒數。","Seconds remaining in the current level."),
		R("blindstructures","object[]","盲注結構陣列。","Blind structure array.",[
			SUB("level","int","級別。","Level."),
			SUB("smallblind","int","小盲。","Small blind."),
			SUB("bigblind","int","大盲。","Big blind."),
			SUB("ante","int","前注。","Ante."),
			SUB("duration","int","時長（分）。","Duration (minutes).")
		]),
		R("prizes","object[]","獎金結構陣列。","Prize structure array.",[
			SUB("place","int","名次。","Placement."),
			SUB("prize","int","獎金。","Prize.")
		]),
		R("players","object[]","在線選手陣列。","Live player array.",[
			SUB("playername","string","選手名稱。","Player name."),
			SUB("status","string","淘汰狀態。","Elimination status."),
			SUB("place","int","名次。","Placement.")
		])
	]
}
function stafffields(){
	return [
		SUB("id","int","員工關聯 id。","Staff relation id."),
		SUB("role","string","角色：dealer / floor / assistant。","Role: dealer / floor / assistant."),
		SUB("status","string","狀態：pending / active。","Status: pending / active."),
		SUB("staffname","string","員工名稱。","Staff name."),
		SUB("staffplayerid","string","員工選手代碼。","Staff player code."),
		SUB("staffemail","string","員工 Email。","Staff email."),
		SUB("invitetime","string","邀請時間。","Invite time."),
		SUB("verifytime","string","確認時間（未確認為 null）。","Verification time (null if unverified).")
	]
}
function dataok(z,e){
	return [{ name: "data",type: "string",desc: { z: z||"成功時為空字串。",e: e||"Empty string on success." } }]
}

// ===== 全部端點，依分類分組 =====
const APICATEGORIES=[
	{
		key: "auth",
		title: { z: "登入與帳號",e: "Sign-in & Account" },
		desc: { z: "Firebase 登入換取系統 Token，以及登入狀態查詢。",e: "Exchange a Firebase login for a system token, and check sign-in state." },
		endpoints: [
			{
				id: "signin",method: "POST",path: "/signin",title: { z: "登入",e: "Sign in" },
				desc: { z: "以 Firebase idToken 換取系統 Token。回傳 signup 標記表示此帳號是否已完成註冊。",e: "Exchange a Firebase idToken for a system token. The signup flag indicates whether the account has finished registration." },
				auth: AUTHOPEN,
				params: [P("idtoken","string",true,"Firebase 簽發的 idToken。","The idToken issued by Firebase.",{ ex: "<firebase-id-token>" })],
				response: [
					R("data.token","string","後續 API 使用的 Bearer Token。","The Bearer token for subsequent API calls.",null),
					R("data.signup","bool","true 表示尚未註冊，需呼叫 /signup。","true means the account has not registered yet; call /signup.",null),
					R("data.uid / email / name / picture / language","string","帳號基本資料。","Basic account profile.",null)
				],
				errors: [ERR("400","ERROR_signin_error","idToken 無效或驗證失敗。","idToken is invalid or verification failed.")]
			},
			{
				id: "signup",method: "POST",path: "/signup",title: { z: "註冊",e: "Sign up" },
				desc: { z: "首次登入後補完使用者資料，建立帳號。",e: "Complete the profile after the first sign-in to create the account." },
				auth: AUTHTOKEN,
				params: [
					P("name","string",true,"顯示名稱。","Display name.",{ ex: "Alvin" }),
					P("type","string",true,"身分：player / dealer / floor / assistant。","Role: player / dealer / floor / assistant.",{ ex: "player" }),
					P("language","string",true,"語系：zhtw / en。","Language: zhtw / en.",{ ex: "zhtw" })
				],
				response: dataok(),
				errors: [ETOKEN,ERR("400","ERROR_already_signed_up","帳號已註冊。","Account already registered."),EREQ]
			},
			{
				id: "signout",method: "POST",path: "/signout",title: { z: "登出",e: "Sign out" },
				desc: { z: "註銷目前的系統 Token。",e: "Revoke the current system token." },
				auth: AUTHTOKEN,params: [],response: dataok(),errors: [ETOKEN]
			},
			{
				id: "signincheck",method: "GET",path: "/signincheck",title: { z: "登入狀態檢查",e: "Sign-in check" },
				desc: { z: "驗證目前 Token 是否有效，並回傳使用者 id 與權限等級。",e: "Verify whether the current token is valid and return the user id and permission level." },
				auth: AUTHTOKEN,params: [],
				response: [
					R("data.userid","int","使用者 id。","User id.",null),
					R("data.permission","int","權限等級（≥4 為管理員）。","Permission level (≥4 is admin).",null)
				],
				errors: [ETOKEN,ERR("404","ERROR_user_not_found","找不到使用者。","User not found.")]
			}
		]
	},
	{
		key: "user",
		title: { z: "使用者",e: "User" },
		desc: { z: "個人資料、搜尋、戰績報表與偏好設定。",e: "Profile, search, performance reports and preferences." },
		endpoints: [
			{
				id: "getuser",method: "GET",path: "/getuser",title: { z: "取得個人資料",e: "Get profile" },
				desc: { z: "取得登入者完整資料，含計分牌色票、計分牌組與近期損益統計。",e: "Get the full profile of the signed-in user, including chip colors, chip sets and recent profit stats." },
				auth: AUTHTOKEN,
				params: [queryparam("includefee","string","帶 false/0 時不計入手續費。","Pass false/0 to exclude fees.")],
				response: [
					R("data","object","使用者資料物件。","The user profile object.",[
						SUB("id","int","使用者 id。","User id."),
						SUB("name","string","顯示名稱。","Display name."),
						SUB("playerid","string","選手代碼。","Player code."),
						R("chipcolors","object[]","計分牌色票陣列。","Chip color tickets.",[SUB("name","string","顏色名稱／面額標籤。","Color/denomination label."),SUB("color","string","HEX 色碼。","HEX color.")]),
						R("chipset","object[]","計分牌組陣列。","Chip sets.",[SUB("name","string","組合名稱。","Set name."),R("chips","object[]","計分牌陣列。","Chips.",[SUB("shape","string","形狀。","Shape."),SUB("value","int","面額。","Value."),SUB("color","string","顏色。","Color.")])])
					]),
					R("data.todaytotalprofit / weektotalprofit / monthtotalprofit","int","今日／本週／本月損益。","Today / this week / this month profit.",null),
					R("data.lastweekprofit","int[]","近 7 日損益陣列。","Profit for the last 7 days.",null)
				],
				errors: [ETOKEN,ERR("404","ERROR_user_not_found","找不到使用者。","User not found.")]
			},
			{
				id: "searchusers",method: "GET",path: "/searchusers",title: { z: "搜尋使用者",e: "Search users" },
				desc: { z: "依關鍵字（名稱／playerid／email）搜尋使用者，最多回傳 20 筆；帶 sessionid 時附帶該選手在場次中的報名／工作人員狀態。",e: "Search users by keyword (name / playerid / email), up to 20 rows; when sessionid is given, each result includes that player's registration / staff status in the session." },
				auth: AUTHTOKEN,
				params: [queryparam("keyword","string","名稱、playerid 或 email 關鍵字（必填）。","Name, playerid or email keyword (required)."),queryparam("sessionid","string","可選，附帶場次相關狀態。","Optional; attaches session-related status.")],
				response: [R("data","object[]","使用者陣列。","Array of users.",[
					SUB("id","int","使用者 id。","User id."),
					SUB("name","string","名稱。","Name."),
					SUB("playerid","string","選手代碼。","Player code."),
					SUB("email","string","Email；非管理員（permission < 4）取得的是遮罩格式（前 2 碼***@網域），僅管理員取得完整 email。","Email; non-admins (permission < 4) receive a masked form (first 2 chars***@domain), only admins get the full email."),
					SUB("type","string","帳號身分：player / dealer / floor / assistant。","Account role: player / dealer / floor / assistant."),
					SUB("sessionplayerid","int","在指定場次的報名 id（帶 sessionid 且有報名時）。","Registration id in the given session (when sessionid is set and registered)."),
					SUB("registrationstatus","string","在指定場次的報名狀態（帶 sessionid 時）。","Registration status in the given session (when sessionid is set)."),
					SUB("reentrycount","int","再入次數（帶 sessionid 時）。","Re-entry count (when sessionid is set)."),
					SUB("rebuycount","int","重買次數（帶 sessionid 時）。","Rebuy count (when sessionid is set)."),
					SUB("timerstatus","string","計時器淘汰狀態（帶 sessionid 時）。","Timer elimination status (when sessionid is set)."),
					SUB("isstaff","bool","是否為該場次工作人員。","Whether the user is staff in the session.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_user_not_found","找不到使用者。","User not found.")]
			},
			{
				id: "getuserreport",method: "GET",path: "/getuserreport",title: { z: "戰績報表",e: "Performance report" },
				desc: { z: "取得現金桌、限時桌與錦標賽的彙總戰績（場數、買入、損益、ROI、ITM 等）。",e: "Aggregated results for cash, time-limited and tournament play (count, buy-in, profit, ROI, ITM, etc.)." },
				auth: AUTHTOKEN,
				params: [queryparam("type","string","month / year / all。","month / year / all."),queryparam("year","int","年份。","Year."),queryparam("month","int","月份。","Month."),queryparam("includefee","string","是否計入手續費。","Whether to include fees.")],
				response: [
					R("data.cash / tlt / mtt","object","各類型統計。","Per-type stats.",[
						SUB("count","int","場數。","Number of sessions."),
						SUB("buyin","int","總買入。","Total buy-in."),
						SUB("profit","int","損益。","Profit."),
						SUB("roi / itm / ft / top3","mixed","僅 mtt：投報率與名次相關統計。","mtt only: ROI and placement stats.")
					]),
					R("data.profit","int","總損益。","Total profit.",null)
				],
				errors: [ETOKEN,ERR("404","ERROR_user_not_found","找不到使用者。","User not found."),EREQ]
			},
			{
				id: "edituserlanguage",method: "PUT",path: "/edituserlanguage",title: { z: "修改語系",e: "Update language" },
				desc: { z: "更新使用者介面語系。",e: "Update the user's UI language." },
				auth: AUTHTOKEN,
				params: [P("langkey","string",true,"zhtw / en。","zhtw / en.",{ ex: "en" })],
				response: [R("data","string","更新後的語系。","The updated language.",null)],
				errors: [ETOKEN,EREQ]
			},
			{
				id: "edituserchipcolors",method: "PUT",path: "/edituserchipcolors",title: { z: "修改計分牌色票",e: "Update chip colors" },
				desc: { z: "更新個人化計分牌顏色設定。",e: "Update personalized chip color settings." },
				auth: AUTHTOKEN,
				params: [P("colors","object[]",true,"色票陣列。","Array of color tickets.",{ fields: [
					SUB("name","string","顏色名稱／面額標籤。","Color name / denomination label."),
					SUB("color","string","HEX 色碼，例如 #ff0000。","HEX color, e.g. #ff0000.")
				],ex: [{ name: "100",color: "#000000" },{ name: "500",color: "#ff0000" }] })],
				response: [R("data","object[]","更新後的色票陣列。","The updated color tickets.",[SUB("name","string","顏色名稱／面額標籤。","Color/denomination label."),SUB("color","string","HEX 色碼。","HEX color.")])],
				errors: [ETOKEN,EREQ]
			},
			{
				id: "edituserchipset",method: "PUT",path: "/edituserchipset",title: { z: "修改計分牌組",e: "Update chip sets" },
				desc: { z: "更新個人化計分牌組合（每組含多顆計分牌）。",e: "Update personalized chip sets (each set holds multiple chips)." },
				auth: AUTHTOKEN,
				params: [P("sets","object[]",true,"計分牌組陣列。","Array of chip sets.",{ fields: [
					SUB("name","string","組合名稱。","Set name."),
					SUB("chips","object[]","計分牌陣列 [{ shape, value, color }]。","Chips [{ shape, value, color }].")
				],ex: [{ name: "Tournament",chips: [{ shape: "round",value: 100,color: "#000000" }] }] })],
				response: [R("data","object[]","更新後的計分牌組陣列。","The updated chip sets.",[SUB("name","string","組合名稱。","Set name."),R("chips","object[]","計分牌陣列。","Chips.",[SUB("shape","string","形狀。","Shape."),SUB("value","int","面額。","Value."),SUB("color","string","顏色。","Color.")])])],
				errors: [ETOKEN,EREQ]
			},
			{
				id: "gettoolfavorite",method: "GET",path: "/gettoolfavorite",title: { z: "取得工具最愛",e: "Get tool favorites" },
				desc: { z: "取得登入使用者收藏的小工具頁面清單。",e: "Get the signed-in user's favorite tool page list." },
				auth: AUTHTOKEN,
				params: [],
				response: [R("data","string[]","工具 href 陣列，例如 tool/potodds.html。","Tool href array, e.g. tool/potodds.html.",null)],
				errors: [ETOKEN]
			},
			{
				id: "edittoolfavorite",method: "PUT",path: "/edittoolfavorite",title: { z: "更新工具最愛",e: "Update tool favorites" },
				desc: { z: "更新登入使用者收藏的小工具頁面清單。",e: "Update the signed-in user's favorite tool page list." },
				auth: AUTHTOKEN,
				params: [P("favorites","string[]",true,"工具 href 陣列，允許 tool/*.html、gto.html。","Tool href array; accepts tool/*.html and gto.html.",{ ex: ["tool/potodds.html","tool/icm.html"] })],
				response: [R("data","string[]","更新後的工具 href 陣列。","Updated tool href array.",null)],
				errors: [ETOKEN,EREQ]
			},
			{
				id: "edituser",method: "PUT",path: "/edituser",title: { z: "編輯個人資料",e: "Edit profile" },
				desc: { z: "更新登入者的基本個人資料，只接受 email / name / phone 三個欄位。",e: "Update the signed-in user's basic profile; only email / name / phone are accepted." },
				auth: AUTHTOKEN,
				params: [
					P("email","string",true,"Email。","Email.",{ ex: "alvin@example.com" }),
					P("name","string",true,"顯示名稱。","Display name.",{ ex: "Alvin" }),
					P("phone","string",true,"電話。","Phone.",{ ex: "0912345678" })
				],
				response: [R("data","object","更新後的使用者物件（已排除 token / verifytoken / uid 等敏感欄位）。","The updated user object (sensitive fields token / verifytoken / uid excluded).",[
					SUB("id","int","使用者 id。","User id."),
					SUB("name","string","顯示名稱。","Display name."),
					SUB("email","string","Email。","Email."),
					SUB("phone","string","電話。","Phone."),
					SUB("playerid","string","選手代碼。","Player code."),
					SUB("permission","int","權限等級。","Permission level.")
				])],
				errors: [ETOKEN,EREQ]
			}
		]
	},
	{
		key: "admin",
		title: { z: "帳號管理（管理員）",e: "User Administration (Admin)" },
		desc: { z: "管理員專用的使用者清單、權限與封鎖管理。",e: "Admin-only user listing, permission and block/ban management." },
		endpoints: [
			{
				id: "getuserlist",method: "GET",path: "/getuserlist",title: { z: "使用者清單",e: "User list" },
				desc: { z: "管理員取得所有未刪除的使用者。",e: "Admin lists all non-deleted users." },
				auth: AUTHADMIN,params: [],
				response: [R("data","object[]","使用者陣列。","Array of users.",[
					SUB("id","int","使用者 id。","User id."),
					SUB("name","string","顯示名稱。","Display name."),
					SUB("email","string","Email。","Email."),
					SUB("permission","int","權限等級。","Permission level."),
					SUB("createtime","string","建立時間。","Creation time."),
					SUB("updatetime","string","更新時間。","Update time.")
				])],
				errors: [ETOKEN,EPERM]
			},
			{
				id: "edituserpermission",method: "PUT",path: "/edituserpermission/{userid}",title: { z: "修改使用者權限",e: "Update user permission" },
				desc: { z: "管理員調整指定使用者的權限等級。",e: "Admin adjusts a user's permission level." },
				auth: AUTHADMIN,
				params: [pathparam("userid","使用者 id。","User id.",7),P("permission","string",true,"權限等級：1~5。","Permission level: 1-5.",{ ex: "4" })],
				response: dataok(),errors: [ETOKEN,EPERM,EREQ]
			},
			{
				id: "blockuser",method: "POST",path: "/blockuser/{userid}",title: { z: "封鎖使用者",e: "Block user" },
				desc: { z: "管理員暫時封鎖使用者一段時間。",e: "Admin temporarily blocks a user for a period." },
				auth: AUTHADMIN,
				params: [pathparam("userid","使用者 id。","User id.",7),P("reason","string",true,"封鎖原因。","Block reason.",{ ex: "violation" }),P("blocktime","string",true,"封鎖到期時間。","Block expiry time.",{ ex: "2026-07-01 00:00" })],
				response: dataok(),errors: [ETOKEN,EPERM,EREQ]
			},
			{
				id: "banuser",method: "POST",path: "/banuser/{userid}",title: { z: "永久封鎖使用者",e: "Ban user" },
				desc: { z: "管理員永久封鎖使用者。",e: "Admin permanently bans a user." },
				auth: AUTHADMIN,
				params: [pathparam("userid","使用者 id。","User id.",7),P("reason","string",true,"封鎖原因。","Ban reason.",{ ex: "severe violation" })],
				response: dataok(),errors: [ETOKEN,EPERM,EREQ]
			},
			{
				id: "deleteuser",method: "DELETE",path: "/deleteuser/{userid}",title: { z: "刪除使用者",e: "Delete user" },
				desc: { z: "管理員軟刪除使用者。",e: "Admin soft-deletes a user." },
				auth: AUTHADMIN,params: [pathparam("userid","使用者 id。","User id.",7)],
				response: dataok(),errors: [ETOKEN,EPERM]
			},
			{
				id: "getauditlog",method: "GET",path: "/getauditlog",title: { z: "操作稽核紀錄",e: "Audit log" },
				desc: { z: "管理員查詢資料操作稽核紀錄，最多回傳 200 筆（依 id 遞減）。",e: "Admin queries data-mutation audit log entries, at most 200 rows (ordered by id descending)." },
				auth: AUTHADMIN,
				params: [
					queryparam("userid","string","依操作者使用者 id 過濾。","Filter by the operator's user id."),
					queryparam("tablename","string","依資料表名稱過濾，例如 user、sessionplayer。","Filter by table name, e.g. user, sessionplayer."),
					queryparam("action","string","依操作類型過濾。","Filter by action type."),
					queryparam("recordid","string","依目標資料列 id 過濾。","Filter by the target row id.")
				],
				response: [R("data","object[]","稽核紀錄陣列。","Array of audit log rows.",[
					SUB("id","int","紀錄 id。","Log id."),
					SUB("userid","int","操作者使用者 id。","Operator user id."),
					SUB("username / useremail / userplayerid","string","操作者姓名／Email／選手代碼。","Operator name / email / player code."),
					SUB("tablename","string","資料表名稱。","Table name."),
					SUB("recordid","string","目標資料列 id。","Target row id."),
					SUB("action","string","操作類型。","Action type."),
					SUB("createtime","string","發生時間。","Occurred at.")
				])],
				errors: [ETOKEN,EPERM]
			},
			{
				id: "getapilog",method: "GET",path: "/getapilog",title: { z: "API 呼叫紀錄",e: "API call log" },
				desc: { z: "管理員分頁查詢後端 API 呼叫紀錄（由 ApiLogMiddleware 於每次請求寫入）。",e: "Admin paginated query of backend API call log entries (written by ApiLogMiddleware on every request)." },
				auth: AUTHADMIN,
				params: [
					queryparam("userid","string","依使用者 id 過濾。","Filter by user id."),
					queryparam("keyword","string","比對使用者姓名／Email／選手代碼／API 路徑／方法／IP。","Match against user name / email / player code / API path / method / IP."),
					queryparam("erroronly","string","帶 1 時只列狀態碼非 200 的紀錄（含無狀態碼）。","Pass 1 to list only entries whose status code is not 200 (including missing status codes)."),
					queryparam("page","int","頁碼，預設 1。","Page number, default 1."),
					queryparam("limit","int","每頁筆數，預設 20，上限 200。","Page size, default 20, max 200.")
				],
				response: [
					R("data.logs","object[]","呼叫紀錄陣列。","Array of API call log rows.",[
						SUB("id","int","紀錄 id。","Log id."),
						SUB("userid","int","呼叫者使用者 id（可為 null）。","Caller user id (nullable)."),
						SUB("username / useremail / userplayerid","string","呼叫者姓名／Email／選手代碼。","Caller name / email / player code."),
						SUB("path","string","請求路徑。","Request path."),
						SUB("method","string","HTTP 方法。","HTTP method."),
						SUB("statuscode","int","回應狀態碼。","Response status code."),
						SUB("createtime","string","發生時間。","Occurred at.")
					],"limit"),
					R("data.pagination","object","分頁資訊。","Pagination info.",[
						SUB("page","int","目前頁碼。","Current page."),
						SUB("limit","int","每頁筆數。","Page size."),
						SUB("total","int","總筆數。","Total count."),
						SUB("totalpages","int","總頁數。","Total pages."),
						SUB("hasprev","bool","是否有上一頁。","Whether a previous page exists."),
						SUB("hasnext","bool","是否有下一頁。","Whether a next page exists.")
					])
				],
				errors: [ETOKEN,EPERM]
			}
		]
	},

	{
		key: "contact",
		title: { z: "聯絡訊息",e: "Contact Messages" },
		desc: { z: "訪客留言與後台管理回覆。",e: "Visitor messages and admin-side replies." },
		endpoints: [
			{
				id: "newcontactmessage",method: "POST",path: "/newcontactmessage",title: { z: "送出聯絡訊息",e: "Submit contact message" },
				desc: { z: "訪客送出聯絡表單，無需登入（帶 Token 時會關聯到帳號）。同一 IP 每 10 分鐘最多 3 筆（取不到 IP 時改以 email 計數），超限回 429。",e: "Visitors submit the contact form without signing in (a token, if present, links it to the account). Rate limited to 3 per IP per 10 minutes (falls back to counting by email when no IP), returning 429 when exceeded." },
				auth: AUTHOPEN,
				params: [
					P("name","string",true,"姓名（上限 100 字）。","Name (max 100 chars).",{ ex: "Alvin" }),
					P("email","string",true,"Email（需含 @，上限 150 字）。","Email (must contain @, max 150 chars).",{ ex: "alvin@example.com" }),
					P("subject","string",false,"主旨（上限 150 字）。","Subject (max 150 chars).",{ ex: "Question about pricing" }),
					P("message","string",true,"訊息內容（上限 3000 字）。","Message body (max 3000 chars).",{ ex: "Hello, I have a question." })
				],
				response: dataok(),
				errors: [EREQ,ERR("429","ERROR_too_many_requests","同一 IP 10 分鐘內超過 3 筆。","More than 3 submissions from the same IP within 10 minutes."),ERR("500","ERROR_unknow_error_pls_tell_the_admin","伺服器內部錯誤。","Internal server error.")]
			},
			{
				id: "getcontactmessages",method: "GET",path: "/getcontactmessages",title: { z: "聯絡訊息列表",e: "List contact messages" },
				desc: { z: "後台分頁查詢聯絡訊息，可依狀態過濾。",e: "Admin paginated query of contact messages, filterable by status." },
				auth: AUTHADMIN,
				params: [queryparam("page","int","頁碼，預設 1。","Page number, default 1."),queryparam("limit","int","每頁筆數，預設 20，上限 100。","Page size, default 20, max 100."),queryparam("status","string","new / read / done。","new / read / done.")],
				response: [
					R("data.messages","object[]","訊息陣列。","Array of messages.",[
						SUB("id","int","訊息 id。","Message id."),
						SUB("name / email / subject / message","string","送出者與內容。","Sender and content."),
						SUB("status","string","new / read / done。","new / read / done."),
						SUB("username / userplayerid","string","關聯帳號的名稱／選手代碼（未登入送出為 null）。","Linked account's name / player code (null if submitted anonymously)."),
						SUB("createtime","string","建立時間。","Creation time.")
					],"limit"),
					R("data.pagination","object","分頁資訊。","Pagination info.",[
						SUB("page","int","目前頁碼。","Current page."),
						SUB("limit","int","每頁筆數。","Page size."),
						SUB("total","int","總筆數。","Total count."),
						SUB("totalpages","int","總頁數。","Total pages."),
						SUB("hasprev","bool","是否有上一頁。","Whether a previous page exists."),
						SUB("hasnext","bool","是否有下一頁。","Whether a next page exists.")
					])
				],
				errors: [ETOKEN,EPERM]
			},
			{
				id: "editcontactmessage",method: "PUT",path: "/editcontactmessage/{messageid}",title: { z: "更新訊息狀態",e: "Update message status" },
				desc: { z: "後台變更聯絡訊息的處理狀態。",e: "Admin changes the handling status of a contact message." },
				auth: AUTHADMIN,
				params: [pathparam("messageid","訊息 id。","Message id.",12),P("status","string",true,"new / read / done。","new / read / done.",{ ex: "read" })],
				response: dataok(),errors: [ETOKEN,EPERM,EREQ]
			},
			{
				id: "replycontactmessage",method: "POST",path: "/replycontactmessage/{messageid}",title: { z: "回覆訊息",e: "Reply to message" },
				desc: { z: "後台以 Email 回覆聯絡訊息。",e: "Admin replies to a contact message by email." },
				auth: AUTHADMIN,
				params: [pathparam("messageid","訊息 id。","Message id.",12),P("message","string",true,"回覆內容（上限 5000 字）。","Reply body (max 5000 chars).",{ ex: "Thanks for reaching out." }),P("subject","string",false,"主旨（上限 150 字）。","Subject (max 150 chars).",{ ex: "Re: your question" })],
				response: dataok(),errors: [ETOKEN,EPERM,EREQ]
			}
		]
	},
	{
		key: "type",
		title: { z: "賽事類型",e: "Event Types" },
		desc: { z: "遊戲／買入／結構等賽事模板的增改刪查。",e: "Create, update, delete and read of game / buy-in / structure event templates." },
		endpoints: [
			{
				id: "gettypelist",method: "GET",path: "/gettypelist",title: { z: "類型列表",e: "Type list" },
				desc: { z: "取得登入者的賽事類型，依 game / limit / stack / event 分組。",e: "Get the signed-in user's event types, grouped by game / limit / stack / event." },
				auth: AUTHTOKEN,params: [],
				response: [R("data","object","分組後的類型集合。","Grouped type collection.",[
					R("game","object[]","遊戲類型。","Game types.",[SUB("id","int","類型 id。","Type id."),SUB("name","string","名稱。","Name.")]),
					R("limit","object[]","限注類型。","Limit types.",[SUB("id","int","類型 id。","Type id."),SUB("name","string","名稱。","Name.")]),
					R("stack","object[]","計分牌結構類型。","Stack types.",[SUB("id","int","類型 id。","Type id."),SUB("name","string","名稱。","Name.")]),
					R("event","object[]","賽事類型。","Event types.",[SUB("id","int","類型 id。","Type id."),SUB("name","string","名稱。","Name.")])
				])],
				errors: [ETOKEN,ERR("404","ERROR_user_not_found","找不到使用者。","User not found.")]
			},
			{
				id: "gettype",method: "GET",path: "/gettype/{typeid}",title: { z: "取得類型",e: "Get type" },
				desc: { z: "取得單一賽事類型詳情，含所屬協會。",e: "Get a single event type with its owning association." },
				auth: AUTHTOKEN,params: [pathparam("typeid","類型 id。","Type id.",4)],
				response: [R("data","object","類型物件。","The type object.",[SUB("id","int","類型 id。","Type id."),SUB("gametype","string","遊戲類型。","Game type."),SUB("name","string","名稱。","Name."),SUB("clubid","int","所屬協會 id。","Association id."),SUB("clubname","string","協會名稱。","Association name."),SUB("buyin","int","買入。","Buy-in."),SUB("rebuycount","int","重買次數。","Rebuy count."),SUB("rebuybuyin","int","重買金額。","Rebuy amount."),SUB("winprice","int","獎金。","Prize."),SUB("chip","int","計分牌。","Chips."),SUB("totalbuyin","int","總買入。","Total buy-in."),SUB("winthing","string","獎品。","Prize item."),SUB("starttime","string","開始時間。","Start time."),SUB("endtime","string","結束時間。","End time."),SUB("place","string","地點。","Place."),SUB("description","string","說明。","Description.")])],
				errors: [ETOKEN,ERR("404","ERROR_type_not_found","找不到類型。","Type not found."),EPERM]
			},
			{
				id: "newtype",method: "POST",path: "/newtype",title: { z: "新增類型",e: "Create type" },
				desc: { z: "建立賽事類型模板。",e: "Create an event type template." },
				auth: AUTHTOKEN,
				params: [
					P("gametype","string",true,"遊戲類型：cash / tournament / limited。","Game type: cash / tournament / limited.",{ ex: "tournament" }),
					P("name","string",true,"類型名稱。","Type name.",{ ex: "Daily Deepstack" }),
					P("clubid","string",true,"所屬協會 id。","Owning association id.",{ ex: "3" }),
					P("buyin","int",true,"買入金額。","Buy-in amount.",{ ex: 1000 }),
					P("rebuycount","int",true,"可重買次數。","Allowed rebuy count.",{ ex: 2 }),
					P("rebuybuyin","int",true,"每次重買金額。","Amount per rebuy.",{ ex: 1000 }),
					P("winprice","int",true,"獎金金額。","Prize amount.",{ ex: 5000 }),
					P("chip","int",true,"起始計分牌。","Starting chips.",{ ex: 30000 }),
					P("totalbuyin","int",true,"總買入。","Total buy-in.",{ ex: 1000 }),
					P("winthing","string",true,"獎品。","Prize item.",{ ex: "Trophy" }),
					P("starttime","string",true,"開始時間。","Start time.",{ ex: "2026-07-01 19:00" }),
					P("endtime","string",true,"結束時間。","End time.",{ ex: "2026-07-01 23:00" }),
					P("place","string",true,"地點。","Place.",{ ex: "Taipei" }),
					P("description","string",false,"說明。","Description.",{ ex: "" })
				],
				response: dataok(),errors: [ETOKEN,EREQ,EPERM]
			},
			{
				id: "edittype",method: "PUT",path: "/edittype/{typeid}",title: { z: "編輯類型",e: "Edit type" },
				desc: { z: "更新賽事類型模板（欄位同 /newtype）。",e: "Update an event type template (fields identical to /newtype)." },
				auth: AUTHTOKEN,
				params: [
					pathparam("typeid","類型 id。","Type id.",4),
					P("name","string",true,"類型名稱。","Type name.",{ ex: "Daily Deepstack" }),
					P("clubid","string",true,"所屬協會 id。","Owning association id.",{ ex: "3" }),
					P("buyin","int",true,"買入金額。","Buy-in amount.",{ ex: 1000 }),
					P("rebuycount","int",true,"可重買次數。","Allowed rebuy count.",{ ex: 2 }),
					P("rebuybuyin","int",true,"每次重買金額。","Amount per rebuy.",{ ex: 1000 }),
					P("winprice","int",true,"獎金金額。","Prize amount.",{ ex: 5000 }),
					P("totalbuyin","int",true,"總買入。","Total buy-in.",{ ex: 1000 }),
					P("winthing","string",true,"獎品。","Prize item.",{ ex: "Trophy" }),
					P("starttime","string",true,"開始時間。","Start time.",{ ex: "2026-07-01 19:00" }),
					P("endtime","string",true,"結束時間。","End time.",{ ex: "2026-07-01 23:00" }),
					P("place","string",true,"地點。","Place.",{ ex: "Taipei" }),
					P("description","string",false,"說明。","Description.",{ ex: "" })
				],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_type_not_found","找不到類型。","Type not found."),EREQ,EPERM]
			},
			{
				id: "deletetype",method: "DELETE",path: "/deletetype/{typeid}",title: { z: "刪除類型",e: "Delete type" },
				desc: { z: "軟刪除賽事類型。",e: "Soft-delete an event type." },
				auth: AUTHTOKEN,params: [pathparam("typeid","類型 id。","Type id.",4)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_type_not_found","找不到類型。","Type not found."),EPERM]
			}
		]
	},
	{
		key: "club",
		title: { z: "協會",e: "Associations" },
		desc: { z: "協會資料增改刪查（限擁有者）。",e: "Create, update, delete and read association data (owner only)." },
		endpoints: [
			{
				id: "getclublist",method: "GET",path: "/getclublist",title: { z: "協會列表",e: "Association list" },
				desc: { z: "取得登入者擁有的所有協會。",e: "Get all associations owned by the signed-in user." },
				auth: AUTHTOKEN,params: [],
				response: [R("data","object[]","協會陣列。","Array of associations.",[
					SUB("id","int","協會 id。","Association id."),
					SUB("name","string","名稱。","Name."),
					SUB("address","string","地址。","Address."),
					SUB("ps","string","備註。","Notes.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_user_not_found","找不到使用者。","User not found.")]
			},
			{
				id: "getclub",method: "GET",path: "/getclub/{clubid}",title: { z: "取得協會",e: "Get association" },
				desc: { z: "取得單一協會詳情。",e: "Get a single association." },
				auth: AUTHTOKEN,params: [pathparam("clubid","協會 id。","Association id.",3)],
				response: [R("data","object","協會物件。","The association object.",[
					SUB("id","int","協會 id。","Association id."),
					SUB("name","string","名稱。","Name."),
					SUB("address","string","地址。","Address."),
					SUB("ps","string","備註。","Notes.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_club_not_found","找不到協會。","Association not found."),EPERM]
			},
			{
				id: "newclub",method: "POST",path: "/newclub",title: { z: "新增協會",e: "Create association" },
				desc: { z: "建立協會。",e: "Create an association." },
				auth: AUTHTOKEN,
				params: [P("name","string",true,"名稱。","Name.",{ ex: "Royal Flush Club" }),P("address","string",true,"地址。","Address.",{ ex: "Taipei" }),P("ps","string",false,"備註。","Notes.",{ ex: "" })],
				response: dataok(),errors: [ETOKEN,EREQ,EPERM]
			},
			{
				id: "editclub",method: "PUT",path: "/editclub/{clubid}",title: { z: "編輯協會",e: "Edit association" },
				desc: { z: "更新協會資料。",e: "Update association data." },
				auth: AUTHTOKEN,
				params: [pathparam("clubid","協會 id。","Association id.",3),P("name","string",true,"名稱。","Name.",{ ex: "Royal Flush Club" }),P("address","string",true,"地址。","Address.",{ ex: "Taipei" }),P("ps","string",false,"備註。","Notes.",{ ex: "" })],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_club_not_found","找不到協會。","Association not found."),EREQ,EPERM]
			},
			{
				id: "deleteclub",method: "DELETE",path: "/deleteclub/{clubid}",title: { z: "刪除協會",e: "Delete association" },
				desc: { z: "軟刪除協會。",e: "Soft-delete an association." },
				auth: AUTHTOKEN,params: [pathparam("clubid","協會 id。","Association id.",3)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_club_not_found","找不到協會。","Association not found."),EPERM]
			}
		]
	},
	{
		key: "session",
		title: { z: "場次",e: "Sessions" },
		desc: { z: "場次（賽事／現金桌）的查詢、建立、編輯、複製與關聯設定。",e: "Query, create, edit, copy and link sessions (tournaments / cash games)." },
		endpoints: [
			{
				id: "getsessionlist",method: "GET",path: "/getsessionlist",title: { z: "場次列表",e: "Session list" },
				desc: { z: "分頁查詢場次，支援日期、協會、類型、名稱與快速過濾，並回傳個人統計。",e: "Paginated session query with date, association, type, name and quick filters, plus personal stats." },
				auth: AUTHTOKEN,
				params: [
					queryparam("startdate","string","起始日期。","Start date."),
					queryparam("enddate","string","結束日期。","End date."),
					queryparam("club","string","依協會過濾。","Filter by association."),
					queryparam("gametype","string","依遊戲類型過濾。","Filter by game type."),
					queryparam("name","string","依名稱過濾。","Filter by name."),
					queryparam("quickfilter","string","快速過濾：registerable / owned / joined。","Quick filter: registerable / owned / joined."),
					queryparam("page","int","頁碼，預設 1。","Page number, default 1."),
					queryparam("limit","int","每頁筆數，預設 40。","Page size, default 40.")
				],
				response: [
					R("data.sessions","object[]","場次陣列（每筆另含 myregistration）。","Array of sessions (each also includes myregistration).",sessionfields().concat([R("myregistration","object","登入者在此場次的報名（未報名為 null）。","The signed-in user's registration in this session (null if none).",registrationfields())]),"limit"),
					R("data.stats","object","個人統計。","Personal stats.",[
						SUB("gamecount","int","場數。","Number of games."),
						SUB("totalprofit","int","總損益。","Total profit."),
						SUB("avgduration","int","平均時長（分）。","Average duration (minutes).")
					]),
					R("data.pagination","object","分頁資訊。","Pagination info.",paginationfields())
				],
				errors: [ETOKEN]
			},
			{
				id: "getsession",method: "GET",path: "/getsession/{sessionid}",title: { z: "取得場次",e: "Get session" },
				desc: { z: "取得單一場次完整資訊，含權限、報名狀態、關聯與計時器設定。",e: "Get a full session, including permissions, registration state, relations and timer settings." },
				auth: AUTHTOKEN,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data","object","場次完整物件。","The full session object.",[
					SUB("id","int","場次 id。","Session id."),
					SUB("isown","bool","是否為擁有者。","Whether the caller is the owner."),
					SUB("accessrole","string","存取角色（owner / staff / player…）。","Access role (owner / staff / player…)."),
					R("chips","object[]","計分牌設定。","Chip settings.",chipfields()),
					R("schedule","object","排程設定。","Schedule settings.",[SUB("autostartbytime","bool","是否依時間自動開賽。","Auto-start by time."),SUB("autostarttime","string","自動開賽時間。","Auto-start time.")])
				])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "newsession",method: "POST",path: "/newsession",title: { z: "新增場次",e: "Create session" },
				desc: { z: "建立新場次（錦標賽或現金桌），含完整買入／重買／再入／加買等設定。",e: "Create a new session (tournament or cash game) with full buy-in / rebuy / reentry / addon settings." },
				auth: AUTHTOKEN,
				params: [
					P("gametype","string",true,"遊戲類型：cash / tournament / limited。","Game type: cash / tournament / limited.",{ ex: "tournament" }),
					P("name","string",true,"場次名稱。","Session name.",{ ex: "Friday Main Event" }),
					P("clubid","string",true,"所屬協會 id。","Owning association id.",{ ex: "3" }),
					P("starttime","string",true,"開始時間。","Start time.",{ ex: "2026-07-01 19:00" }),
					P("endtime","string",true,"結束時間。","End time.",{ ex: "2026-07-01 23:00" }),
					P("place","string",true,"地點。","Place.",{ ex: "Taipei" }),
					P("totalbuyin","string",true,"總買入（顯示用字串）。","Total buy-in (display string).",{ ex: "1000" }),
					P("buyin","int",true,"買入金額。","Buy-in amount.",{ ex: 1000 }),
					P("rebuycount","int",true,"可重買次數。","Allowed rebuy count.",{ ex: 2 }),
					P("rebuybuyin","int",true,"每次重買金額。","Amount per rebuy.",{ ex: 1000 }),
					P("winprice","int",true,"獎金金額。","Prize amount.",{ ex: 5000 }),
					P("winthing","string",true,"獎品。","Prize item.",{ ex: "Trophy" }),
					P("buyinfee","int",false,"買入服務費。","Buy-in fee.",{ ex: 100 }),
					P("chip","int",false,"買入起始計分牌。","Starting chips for buy-in.",{ ex: 30000 }),
					P("rebuyfee","int",false,"重買服務費。","Rebuy fee.",{ ex: 100 }),
					P("rebuychip","int",false,"重買計分牌。","Rebuy chips.",{ ex: 30000 }),
					P("reentrycount","int",false,"可再入次數。","Allowed re-entry count.",{ ex: 1 }),
					P("reentrybuyin","int",false,"再入金額。","Re-entry amount.",{ ex: 1000 }),
					P("reentryfee","int",false,"再入服務費。","Re-entry fee.",{ ex: 100 }),
					P("reentrychip","int",false,"再入計分牌。","Re-entry chips.",{ ex: 30000 }),
					P("addoncount","int",false,"可加買次數。","Allowed add-on count.",{ ex: 1 }),
					P("addonbuyin","int",false,"加買金額。","Add-on amount.",{ ex: 1000 }),
					P("addonfee","int",false,"加買服務費。","Add-on fee.",{ ex: 100 }),
					P("addonchip","int",false,"加買計分牌。","Add-on chips.",{ ex: 30000 }),
					P("guaranteedprize","int",false,"保底獎金。","Guaranteed prize.",{ ex: 100000 }),
					P("maxseat","int",false,"每桌座位數，預設 9。","Seats per table, default 9.",{ ex: 9 }),
					P("linkuser","bool",false,"是否連動使用者帳號。","Whether to link user accounts.",{ ex: true }),
					P("private","bool",false,"是否為私人場次。","Whether the session is private.",{ ex: false }),
					P("owned","bool",false,"是否為主辦牌局（主辦人不參賽）。","Whether it is a hosted session (organizer does not play).",{ ex: false }),
					P("openregistration","bool",false,"是否開放選手自行報名。","Whether self-registration is open.",{ ex: true }),
					P("unifiedhandrecord","bool",false,"是否啟用統一手牌記錄。","Whether unified hand recording is enabled.",{ ex: false }),
					P("inmoney","bool",false,"是否進入錢圈。","Whether in the money.",{ ex: false }),
					P("inft","bool",false,"是否進入決賽桌。","Whether at the final table.",{ ex: false }),
					P("antemode","string",false,"前注模式：ante / bigblindante，預設 bigblindante。","Ante mode: ante / bigblindante, default bigblindante.",{ ex: "bigblindante" }),
					P("gametypeid","string",false,"遊戲類型模板 id。","Game-type template id.",{ ex: "" }),
					P("limittypeid","string",false,"限注類型模板 id。","Limit-type template id.",{ ex: "" }),
					P("stacktypeid","string",false,"計分牌結構模板 id。","Stack-type template id.",{ ex: "" }),
					P("eventtypeid","string",false,"賽事類型模板 id。","Event-type template id.",{ ex: "" }),
					P("description","string",false,"說明。","Description.",{ ex: "" })
				],
				response: [R("data","int","新建立的場次 id。","The new session id.",null)],
				errors: [ETOKEN,EREQ,EPERM]
			},
			{
				id: "copysession",method: "POST",path: "/copysession/{sessionid}",title: { z: "複製場次",e: "Copy session" },
				desc: { z: "複製整個場次，含牌桌、計時器級別、計分牌與獎金結構。",e: "Copy an entire session, including tables, timer levels, chips and prize structure." },
				auth: AUTHOWNER,params: [pathparam("sessionid","來源場次 id。","Source session id.",101)],
				response: [R("data","int","複製出的新場次 id。","The new copied session id.",null)],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "editsession",method: "PUT",path: "/editsession/{sessionid}",title: { z: "編輯場次",e: "Edit session" },
				desc: { z: "完整更新場次設定（欄位同 /newsession）。gametypeid / limittypeid / stacktypeid / eventtypeid 四個模板欄位為部分更新：request 未帶時不會清空既有值。",e: "Fully update session settings (fields identical to /newsession). The four template fields gametypeid / limittypeid / stacktypeid / eventtypeid are patched: when absent from the request the existing values are kept." },
				auth: AUTHOWNER,params: [pathparam("sessionid","場次 id。","Session id.",101),P("（同 newsession）","mixed",true,"與新增場次相同的欄位集合；gametypeid / limittypeid / stacktypeid / eventtypeid 未帶時不更新。","The same field set as create session; gametypeid / limittypeid / stacktypeid / eventtypeid are left unchanged when omitted.",null)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EREQ,EPERM]
			},
			{
				id: "editsessionsettings",method: "PUT",path: "/editsessionsettings/{sessionid}",title: { z: "局部更新設定",e: "Patch session settings" },
				desc: { z: "部分更新場次設定（所有欄位皆為選填），可同時更新計分牌與自動開賽設定。",e: "Partially update session settings (all fields optional); can update chips and auto-start together." },
				auth: AUTHOWNER,params: [
					pathparam("sessionid","場次 id。","Session id.",101),
					P("name","string",false,"場次名稱。","Session name.",{ ex: "Friday Main Event" }),
					P("buyin","int",false,"買入金額。","Buy-in amount.",{ ex: 1000 }),
					P("antemode","string",false,"前注模式：ante / bigblindante。","Ante mode: ante / bigblindante.",{ ex: "bigblindante" }),
					P("openregistration","bool",false,"是否開放選手自行報名。","Whether self-registration is open.",{ ex: true }),
					P("chips","object[]",false,"計分牌設定陣列。","Chip settings array.",{ ex: [{ value: 100,color: "#000000" }] }),
					P("autostartbytime","bool",false,"是否依時間自動開賽。屬計時器設定：僅擁有者、管理員或 floor / assistant 可改，dealer 帶此欄位會回 403 ERROR_no_permission。","Whether to auto-start by time. Timer-related: only the owner, admins, or floor / assistant staff may change it; a dealer sending this field gets 403 ERROR_no_permission.",{ ex: false }),
					P("（其餘 /newsession 欄位）","mixed",false,"/newsession 的任一欄位皆可帶入，均為選填。","Any field from /newsession may be sent; all optional.",null)
				],
				response: [R("data","object","更新後的場次物件。","The updated session object.",sessionfields().concat([R("chips","object[]","計分牌設定。","Chip settings.",chipfields()),SUB("autostartbytime","bool","是否依時間自動開賽。","Whether to auto-start by time.")]))],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "editsessionresult",method: "PUT",path: "/editsessionresult/{sessionid}",title: { z: "更新場次結果",e: "Update session result" },
				desc: { z: "登錄場次最終結果（損益、名次、獎品）。",e: "Record the final session result (profit, placement, prize)." },
				auth: AUTHOWNER,
				params: [
					pathparam("sessionid","場次 id。","Session id.",101),
					P("reentrycount","int",true,"再入次數。","Re-entry count.",{ ex: 0 }),
					P("winprice","int",true,"獎金金額。","Prize amount.",{ ex: 5000 }),
					P("winthing","string",true,"獎品。","Prize item.",{ ex: "Trophy" }),
					P("place","string",true,"名次。","Placement.",{ ex: "1" }),
					P("totalbuyin","string",true,"總買入。","Total buy-in.",{ ex: "1000" }),
					P("inmoney","bool",false,"是否進入錢圈。","Whether in the money.",{ ex: true }),
					P("inft","bool",false,"是否進入決賽桌。","Whether at the final table.",{ ex: true })
				],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EREQ,EPERM]
			},
			{
				id: "getsessionrelations",method: "GET",path: "/getsessionrelations/{sessionid}",title: { z: "場次關聯",e: "Session relations" },
				desc: { z: "取得場次的衛星賽／多日賽進出關聯。",e: "Get the satellite / multi-day in/out relations of a session." },
				auth: AUTHOWNER,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data","object","關聯集合。","Relation collection.",[
					R("outgoing","object[]","往外（晉級到的場次）。","Outgoing (sessions advanced to).",relationsessionfields()),
					R("incoming","object[]","往內（從哪些場次晉級來）。","Incoming (sessions advanced from).",relationsessionfields())
				])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "searchsessionrelations",method: "GET",path: "/searchsessionrelations/{sessionid}",title: { z: "搜尋可關聯場次",e: "Search linkable sessions" },
				desc: { z: "搜尋同一擁有者底下可建立關聯的場次。",e: "Search sessions under the same owner that can be linked." },
				auth: AUTHOWNER,
				params: [pathparam("sessionid","場次 id。","Session id.",101),queryparam("keyword","string","名稱或 token。","Name or token."),queryparam("page","int","頁碼，預設 1。","Page number, default 1."),queryparam("limit","int","每頁筆數，預設 10。","Page size, default 10.")],
				response: [R("data","object","搜尋結果。","Search result.",[
					R("sessions","object[]","可關聯場次。","Linkable sessions.",[SUB("id","int","場次 id。","Session id."),SUB("name","string","場次名稱。","Session name."),SUB("token","string","場次 token。","Session token."),SUB("starttime","string","開始時間。","Start time.")],"limit"),
					R("pagination","object","分頁資訊。","Pagination info.",paginationfields())
				])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "editsessionrelations",method: "PUT",path: "/editsessionrelations/{sessionid}",title: { z: "設定場次關聯",e: "Set session relations" },
				desc: { z: "建立或更新多日／衛星賽關聯。",e: "Create or update multi-day / satellite relations." },
				auth: AUTHOWNER,
				params: [pathparam("sessionid","場次 id。","Session id.",101),P("relationtype","string",true,"satellite / multiday。","satellite / multiday.",{ ex: "satellite" }),P("direction","string",false,"outgoing / incoming，預設 outgoing。","outgoing / incoming, default outgoing.",{ ex: "outgoing" }),P("targetids","int[]",false,"目標場次 id 陣列。","Array of target session ids.",{ ex: [102,103] })],
				response: [R("data","object","更新後關聯。","Updated relations.",[R("outgoing","object[]","往外關聯場次。","Outgoing linked sessions.",relationsessionfields()),R("incoming","object[]","往內關聯場次。","Incoming linked sessions.",relationsessionfields())])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EREQ,EPERM]
			},
			{
				id: "deletesession",method: "DELETE",path: "/deletesession/{sessionid}",title: { z: "刪除場次",e: "Delete session" },
				desc: { z: "軟刪除場次，並在同一交易內連動軟刪其 seriessession（系列賽關聯）、sessionstaff（場次工作人員）與 sessionplayer（報名）。僅擁有者或管理員可刪除。",e: "Soft-delete a session, and within the same transaction soft-delete its seriessession (series links), sessionstaff (session staff) and sessionplayer (registrations). Only the owner or an admin may delete." },
				auth: AUTHOWNER,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "batchcreatesessions",method: "POST",path: "/batchcreatesessions",title: { z: "批量建立多日賽",e: "Batch-create multi-day flights" },
				desc: { z: "一次建立多個 flight 場次（主辦、多日賽），並依 advancement 建立場次間的晉級（multiday）關聯，可選擇同時包成系列賽或附加到既有系列賽。最多 64 個 flight。",e: "Create multiple flight sessions (hosted, multi-day) in one call, link them via multiday relations per advancement, and optionally bundle them into a new series or attach to an existing one. Up to 64 flights." },
				auth: AUTHTOKEN,
				params: [
					P("common","object",true,"套用到所有 flight 的共用設定（clubid、starttime、endtime 為必填；其餘欄位同 /newsession，例如 buyin、rebuycount、chip、chips、maxseat 等）。","Shared settings applied to every flight (clubid, starttime, endtime required; other fields same as /newsession, e.g. buyin, rebuycount, chip, chips, maxseat).",{ ex: { clubid: "3",starttime: "2026-07-01 12:00",endtime: "2026-07-03 23:00",buyin: 1000,chip: 30000 } }),
					P("flights","object[]",true,"flight 陣列，每筆需有唯一的 key 與 name；schedule / starttime / endtime / description 可覆寫 common。最多 64 筆。","Array of flights; each needs a unique key and name. schedule / starttime / endtime / description may override common. Up to 64 items.",{ fields: [
						SUB("key","string","此 flight 在本次請求內的唯一代號，供 advancement 參照。","Unique key for this flight within the request, referenced by advancement."),
						SUB("name","string","場次名稱。","Session name."),
						SUB("schedule","object[]","賽程（級別／中場休息），格式同 /parsestructure 的輸出。","Schedule (levels/breaks), same shape as /parsestructure output."),
						SUB("starttime","string","覆寫 common 的開始時間（選填）。","Overrides common's start time (optional)."),
						SUB("endtime","string","覆寫 common 的結束時間（選填）。","Overrides common's end time (optional)."),
						SUB("description","string","覆寫 common 的說明（選填）。","Overrides common's description (optional).")
					],ex: [{ key: "day1a",name: "Day 1A" },{ key: "day1b",name: "Day 1B" },{ key: "day2",name: "Day 2" }] }),
					P("advancement","object[]",false,"晉級關聯陣列，from 需為 flights 的 key 陣列、to 為單一 key，代表 from 晉級到 to。","Array of advancement edges; from is an array of flight keys, to is a single key meaning from advances to to.",{ fields: [
						SUB("from","string[]","來源 flight key 陣列。","Array of source flight keys."),
						SUB("to","string","目標 flight key。","Target flight key.")
					],ex: [{ from: ["day1a","day1b"],to: "day2" }] }),
					P("seriesid","string",false,"附加到既有系列賽的 id（與 createseries 擇一）。","Id of an existing series to attach to (mutually exclusive with createseries).",{ ex: "" }),
					P("createseries","bool",false,"是否同時建立新系列賽並把所有 flight 加入。","Whether to also create a new series containing all flights.",{ ex: true }),
					P("seriesname","string",false,"新系列賽名稱，預設取第一個 flight 名稱。","New series name; defaults to the first flight's name.",{ ex: "Main Event Series" }),
					P("seriesscoringtype","string",false,"新系列賽計分方式：profit / place / points，預設 profit。","New series scoring type: profit / place / points, default profit.",{ ex: "profit" })
				],
				response: [
					R("data.flights","object","建立結果，key 為 flight key，值為新場次 id。","Creation result, keyed by flight key with the new session id as value.",null),
					R("data.flightcount","int","成功建立的 flight 數。","Number of flights created.",null),
					R("data.linkcount","int","建立的晉級關聯數。","Number of advancement links created.",null),
					R("data.seriesid","int","建立或附加的系列賽 id（無則為 null）。","The created or attached series id (null if none).",null)
				],
				errors: [ETOKEN,EREQ,ERR("400","ERROR_request_data_type_error","flight 數超過 64、key 重複、advancement 參照不存在的 key 等。","More than 64 flights, duplicate keys, or advancement referencing an unknown key, etc."),ERR("404","ERROR_series_not_found","指定附加的系列賽不存在。","The series specified to attach to was not found."),EPERM]
			}
		]
	},
	{
		key: "series",
		title: { z: "系列賽",e: "Series" },
		desc: { z: "把多場次組成系列賽，統計總成績並提供排行榜。",e: "Group multiple sessions into a series, aggregate results and provide a leaderboard." },
		endpoints: [
			{
				id: "getserieslist",method: "GET",path: "/getserieslist",title: { z: "系列賽列表",e: "Series list" },
				desc: { z: "取得系列賽列表：一般使用者看得到自己的與非私人的系列賽，管理員看得到全部。每筆含場次數與檢視者本人的盈虧／成本彙總。",e: "List series: regular users see their own plus non-private series; admins see all. Each row includes the session count and the viewer's own profit/cost aggregate." },
				auth: AUTHTOKEN,params: [],
				response: [R("data","object[]","系列賽陣列。","Array of series.",[
					SUB("id","int","系列賽 id。","Series id."),
					SUB("token","string","系列賽流水號。","Series token."),
					SUB("userid","int","建立者使用者 id。","Creator user id."),
					SUB("clubid","int","所屬協會 id。","Owning association id."),
					SUB("name","string","名稱。","Name."),
					SUB("description","string","說明。","Description."),
					SUB("starttime","string","開始時間。","Start time."),
					SUB("endtime","string","結束時間。","End time."),
					SUB("scoringtype","string","計分方式：profit / place / points。","Scoring type: profit / place / points."),
					SUB("private","bool","是否為私人系列賽。","Whether the series is private."),
					SUB("sessioncount","int","場次數。","Number of sessions."),
					SUB("totalprofit","int","檢視者本人的總盈虧。","The viewer's own total profit."),
					SUB("totalcost","int","檢視者本人的總成本。","The viewer's own total cost."),
					SUB("isowner","bool","是否為擁有者或管理員。","Whether the caller is the owner or an admin.")
				])],
				errors: [ETOKEN]
			},
			{
				id: "getseries",method: "GET",path: "/getseries/{seriesid}",title: { z: "取得系列賽",e: "Get series" },
				desc: { z: "取得單一系列賽詳情，含所屬場次清單與彙總成績（以檢視者本人為準）。非擁有者僅能檢視非私人系列賽。",e: "Get a single series, including its session list and aggregate results (from the viewer's own perspective). Non-owners may only view non-private series." },
				auth: AUTHTOKEN,params: [pathparam("seriesid","系列賽 id。","Series id.",5)],
				response: [R("data","object","系列賽完整物件。","The full series object.",[
					SUB("id","int","系列賽 id。","Series id."),
					SUB("name","string","名稱。","Name."),
					SUB("clubname","string","所屬協會名稱。","Owning association name."),
					SUB("isowner","bool","是否為擁有者或管理員。","Whether the caller is the owner or an admin."),
					R("sessions","object[]","所屬場次（含每場 profit / cost）。","Sessions in the series (each with profit / cost).",relationsessionfields().concat([SUB("profit","int","該場盈虧。","This session's profit."),SUB("cost","int","該場成本。","This session's cost.")])),
					R("aggregate","object","彙總成績（以檢視者本人為準）。","Aggregate results (from the viewer's own perspective).",[
						SUB("sessioncount","int","場次數。","Number of sessions."),
						SUB("totalprofit","int","總盈虧。","Total profit."),
						SUB("totalcost","int","總成本。","Total cost."),
						SUB("totalwinprice","int","總獎金。","Total prize."),
						SUB("myentries","int","檢視者本人參賽場次數。","Number of sessions the viewer entered.")
					])
				])],
				errors: [ETOKEN,ERR("404","ERROR_series_not_found","找不到系列賽。","Series not found."),EPERM]
			},
			{
				id: "newseries",method: "POST",path: "/newseries",title: { z: "新增系列賽",e: "Create series" },
				desc: { z: "建立系列賽，可同時指定要加入的場次 id 陣列。",e: "Create a series, optionally with an initial array of session ids to include." },
				auth: AUTHTOKEN,
				params: [
					P("name","string",true,"名稱。","Name.",{ ex: "Summer Series" }),
					P("clubid","string",false,"所屬協會 id。","Owning association id.",{ ex: "3" }),
					P("description","string",false,"說明。","Description.",{ ex: "" }),
					P("starttime","string",false,"開始時間。","Start time.",{ ex: "2026-07-01 00:00" }),
					P("endtime","string",false,"結束時間。","End time.",{ ex: "2026-07-31 23:59" }),
					P("scoringtype","string",false,"計分方式：profit / points / place，預設 profit。","Scoring type: profit / points / place, default profit.",{ ex: "profit" }),
					P("private","bool",false,"是否為私人系列賽。","Whether the series is private.",{ ex: false }),
					P("sessionids","int[]",false,"要加入的場次 id 陣列（僅限本人擁有的場次）。","Array of session ids to include (only sessions owned by the caller).",{ ex: [101,102] })
				],
				response: [R("data","int","新建立的系列賽 id。","The new series id.",null)],
				errors: [ETOKEN,EREQ]
			},
			{
				id: "editseries",method: "PUT",path: "/editseries/{seriesid}",title: { z: "編輯系列賽",e: "Edit series" },
				desc: { z: "更新系列賽基本資料（不含所屬場次，場次請用 /editseriessessions）。",e: "Update series basic info (session membership is managed separately via /editseriessessions)." },
				auth: AUTHTOKEN,
				params: [
					pathparam("seriesid","系列賽 id。","Series id.",5),
					P("name","string",true,"名稱。","Name.",{ ex: "Summer Series" }),
					P("clubid","string",false,"所屬協會 id。","Owning association id.",{ ex: "3" }),
					P("description","string",false,"說明。","Description.",{ ex: "" }),
					P("starttime","string",false,"開始時間。","Start time.",{ ex: "2026-07-01 00:00" }),
					P("endtime","string",false,"結束時間。","End time.",{ ex: "2026-07-31 23:59" }),
					P("scoringtype","string",false,"計分方式：profit / points / place。","Scoring type: profit / points / place.",{ ex: "profit" }),
					P("private","bool",false,"是否為私人系列賽。","Whether the series is private.",{ ex: false })
				],
				response: [R("data","int","系列賽 id。","The series id.",null)],
				errors: [ETOKEN,ERR("404","ERROR_series_not_found","找不到系列賽。","Series not found."),EREQ,EPERM]
			},
			{
				id: "deleteseries",method: "DELETE",path: "/deleteseries/{seriesid}",title: { z: "刪除系列賽",e: "Delete series" },
				desc: { z: "軟刪除系列賽（不影響所屬場次本身）。",e: "Soft-delete a series (does not affect the sessions it contains)." },
				auth: AUTHTOKEN,params: [pathparam("seriesid","系列賽 id。","Series id.",5)],
				response: [R("data","int","系列賽 id。","The series id.",null)],
				errors: [ETOKEN,ERR("404","ERROR_series_not_found","找不到系列賽。","Series not found."),EPERM]
			},
			{
				id: "editseriessessions",method: "PUT",path: "/editseriessessions/{seriesid}",title: { z: "設定系列賽場次",e: "Set series sessions" },
				desc: { z: "把系列賽成員完整取代為指定的場次 id 陣列（僅限本人擁有的場次；不在清單內的既有成員會被移除）。",e: "Replace the series' session membership with the given array of session ids (only sessions owned by the caller; existing members not in the list are removed)." },
				auth: AUTHTOKEN,
				params: [pathparam("seriesid","系列賽 id。","Series id.",5),P("sessionids","int[]",false,"要設定的場次 id 陣列。","Array of session ids to set.",{ ex: [101,102,103] })],
				response: [
					R("data.sessions","object[]","更新後的所屬場次。","Updated session list.",relationsessionfields().concat([SUB("profit","int","該場盈虧。","This session's profit."),SUB("cost","int","該場成本。","This session's cost.")])),
					R("data.aggregate","object","更新後的彙總成績。","Updated aggregate results.",[
						SUB("sessioncount","int","場次數。","Number of sessions."),
						SUB("totalprofit","int","總盈虧。","Total profit."),
						SUB("totalcost","int","總成本。","Total cost."),
						SUB("totalwinprice","int","總獎金。","Total prize.")
					])
				],
				errors: [ETOKEN,ERR("404","ERROR_series_not_found","找不到系列賽。","Series not found."),EPERM]
			},
			{
				id: "getseriesleaderboard",method: "GET",path: "/getseriesleaderboard/{seriesid}",title: { z: "系列賽排行榜",e: "Series leaderboard" },
				desc: { z: "彙總系列賽底下各「主辦」場次的報名選手成績，依系列賽的計分方式排序。",e: "Aggregate registered-player results across the series' hosted sessions, sorted by the series' scoring type." },
				auth: AUTHTOKEN,params: [pathparam("seriesid","系列賽 id。","Series id.",5)],
				response: [
					R("data.scoringtype","string","計分方式：profit / place / points。","Scoring type: profit / place / points.",null),
					R("data.leaderboard","object[]","排行榜陣列。","Leaderboard array.",[
						SUB("userid","int","選手使用者 id。","Player user id."),
						SUB("playername","string","選手名稱。","Player name."),
						SUB("playerplayerid","string","選手代碼。","Player code."),
						SUB("entries","int","參賽場次數。","Number of entries."),
						SUB("totalprize","int","總獎金。","Total prize."),
						SUB("totalcost","int","總成本。","Total cost."),
						SUB("totalprofit","int","總盈虧。","Total profit."),
						SUB("cashes","int","進錢圈次數。","Number of cashes."),
						SUB("points","int","積分（scoringtype=points 時使用）。","Points (used when scoringtype=points)."),
						SUB("bestplace","int","最佳名次（可為 null）。","Best placement (nullable)."),
						SUB("rank","int","排名。","Rank.")
					])
				],
				errors: [ETOKEN,ERR("404","ERROR_series_not_found","找不到系列賽。","Series not found."),EPERM]
			}
		]
	},
	{
		key: "table",
		title: { z: "牌桌",e: "Tables" },
		desc: { z: "場次內牌桌與在桌選手的管理。",e: "Manage tables and seated players within a session." },
		endpoints: [
			{
				id: "gettablelist",method: "GET",path: "/gettablelist/{sessionid}",title: { z: "牌桌列表",e: "Table list" },
				desc: { z: "取得某場次下所有牌桌。",e: "Get all tables under a session." },
				auth: AUTHTOKEN,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data","object[]","牌桌陣列。","Array of tables.",[
					SUB("id","int","牌桌 id。","Table id."),
					SUB("sessionid","int","場次 id。","Session id."),
					SUB("no","int","桌號。","Table number."),
					SUB("name","string","桌名。","Table name."),
					SUB("token","string","牌桌分享 token。","Table share token."),
					SUB("firstdealerplace","int","首莊座位。","First-dealer seat."),
					SUB("selfseating","int","自家座位。","Own seat.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "gettable",method: "GET",path: "/gettable/{tableid}",title: { z: "取得牌桌",e: "Get table" },
				desc: { z: "取得單一牌桌詳情，含座位、在桌選手、可用選手、最新手牌與盲注結構。",e: "Get a single table with seating, current players, available players, latest hand and blind structure." },
				auth: AUTHTOKEN,params: [pathparam("tableid","牌桌 id。","Table id.",55)],
				response: [R("data","object","牌桌物件。","The table object.",[
					R("seating","object[]","座位圖。","Seat map.",[SUB("seatno","int","座位號。","Seat number."),SUB("sessionplayerid","int","報名選手 id。","Registered player id."),SUB("name","string","選手名稱。","Player name."),SUB("chip","int","計分牌量。","Chip amount."),SUB("status","string","狀態。","Status.")]),
					R("currentplayers","object[]","在桌選手。","Seated players.",[SUB("sessionplayerid","int","報名選手 id。","Registered player id."),SUB("name","string","選手名稱。","Player name."),SUB("seatno","int","座位號。","Seat number."),SUB("chip","int","計分牌量。","Chip amount."),SUB("status","string","狀態。","Status.")]),
					R("hand","object","最新手牌。","Latest hand.",handfields()),
					R("blindstructures","object[]","盲注結構。","Blind structures.",[SUB("level","int","級別。","Level."),SUB("smallblind","int","小盲。","Small blind."),SUB("bigblind","int","大盲。","Big blind."),SUB("ante","int","前注。","Ante."),SUB("duration","int","時長（分）。","Duration (minutes).")]),
					R("chips","object[]","計分牌設定。","Chip settings.",chipfields())
				])],
				errors: [ETOKEN,ERR("404","ERROR_table_not_found / ERROR_session_not_found","找不到牌桌或場次。","Table or session not found."),EPERM]
			},
			{
				id: "newtable",method: "POST",path: "/newtable/{sessionid}",title: { z: "新增牌桌",e: "Create table" },
				desc: { z: "在場次下新增一或多張牌桌（可指定編號或範圍）。",e: "Create one or more tables in a session (by number or range)." },
				auth: AUTHOWNER,
				params: [
					pathparam("sessionid","場次 id。","Session id.",101),
					P("no","int",false,"指定單一桌號。","Specific single table number.",{ ex: 1 }),
					P("rangestart","int",false,"批次建立的起始桌號。","Start table number for batch creation.",{ ex: 1 }),
					P("rangeend","int",false,"批次建立的結束桌號。","End table number for batch creation.",{ ex: 5 })
				],
				response: [R("data.count","int","建立的牌桌數量。","Number of tables created.",null)],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EREQ,EPERM]
			},
			{
				id: "edittable",method: "PUT",path: "/edittable/{tableid}",title: { z: "編輯牌桌",e: "Edit table" },
				desc: { z: "更新牌桌編號。",e: "Update the table number." },
				auth: AUTHOWNER,params: [pathparam("tableid","牌桌 id。","Table id.",55),P("no","int",true,"桌號。","Table number.",{ ex: 2 })],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_table_not_found","找不到牌桌。","Table not found."),EREQ,EPERM]
			},
			{
				id: "edittablesetting",method: "PUT",path: "/edittablesetting/{tableid}",title: { z: "牌桌設定",e: "Table setting" },
				desc: { z: "設定牌桌座位數、首莊位置與自家座位。",e: "Set the table's seat count, first-dealer position and own seat." },
				auth: AUTHOWNER,
				params: [pathparam("tableid","牌桌 id。","Table id.",55),P("maxseat","string",true,"6 / 8 / 9 / 10。","6 / 8 / 9 / 10.",{ ex: "9" }),P("firstdealerplace","string",true,"首莊座位（1–10）。","First-dealer seat (1–10).",{ ex: "1" }),P("selfseating","string",true,"自家座位（1–10）。","Own seat (1–10).",{ ex: "5" })],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_table_not_found","找不到牌桌。","Table not found."),EREQ,EPERM]
			},
			{
				id: "savetableplayers",method: "PUT",path: "/savetableplayers/{tableid}",title: { z: "儲存在桌選手",e: "Save table players" },
				desc: { z: "整桌覆寫座位上的選手與計分牌。",e: "Overwrite the whole table's seated players and chips." },
				auth: AUTHOWNER,
				params: [pathparam("tableid","牌桌 id。","Table id.",55),P("players","object[]",true,"在桌選手陣列。","Array of seated players.",{ fields: [
					SUB("seatno","int","座位號。","Seat number."),
					SUB("sessionplayerid","int","報名選手 id（可選）。","Registered player id (optional)."),
					SUB("name","string","選手名稱（可選）。","Player name (optional)."),
					SUB("chip","int","計分牌量（可選）。","Chip amount (optional)."),
					SUB("unknownchip","bool","計分牌未知（可選）。","Chip unknown (optional).")
				],ex: [{ seatno: 1,sessionplayerid: 88,chip: 30000 }] })],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_table_not_found","找不到牌桌。","Table not found."),ERR("404","ERROR_registration_not_found","找不到報名選手。","Registered player not found."),EPERM]
			},
			{
				id: "eliminatetableplayer",method: "POST",path: "/eliminatetableplayer/{tableid}",title: { z: "淘汰在桌選手",e: "Eliminate table player" },
				desc: { z: "將指定座位／選手標記為淘汰。",e: "Mark a given seat / player as eliminated." },
				auth: AUTHOWNER,
				params: [pathparam("tableid","牌桌 id。","Table id.",55),P("sessionplayerid","int",false,"選手報名 id。","Registered player id.",{ ex: 88 }),P("seatno","int",false,"座位號。","Seat number.",{ ex: 1 })],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_table_not_found","找不到牌桌。","Table not found."),EPERM]
			},
			{
				id: "movetableplayer",method: "POST",path: "/movetableplayer/{tableid}",title: { z: "移動選手",e: "Move player" },
				desc: { z: "將選手移動到另一張牌桌。",e: "Move a player to another table." },
				auth: AUTHOWNER,
				params: [
					pathparam("tableid","來源牌桌 id。","Source table id.",55),
					P("targettableid","int",true,"目標牌桌 id。","Target table id.",{ ex: 56 }),
					P("sessionplayerid","int",false,"以報名選手 id 指定要移動的選手。","Identify the player to move by registration id.",{ ex: 88 }),
					P("seatno","int",false,"以座位號指定要移動的選手。","Identify the player to move by seat number.",{ ex: 1 })
				],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_table_not_found","找不到牌桌。","Table not found."),EPERM]
			},
			{
				id: "mergetableplayers",method: "POST",path: "/mergetableplayers/{tableid}",title: { z: "併桌",e: "Merge tables" },
				desc: { z: "將整桌選手併入目標牌桌。",e: "Merge a whole table's players into a target table." },
				auth: AUTHOWNER,
				params: [pathparam("tableid","來源牌桌 id。","Source table id.",55),P("targettableid","int",true,"目標牌桌 id。","Target table id.",{ ex: 56 })],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_table_not_found","找不到牌桌。","Table not found."),EPERM]
			},
			{
				id: "deletetable",method: "DELETE",path: "/deletetable/{tableid}",title: { z: "刪除牌桌",e: "Delete table" },
				desc: { z: "只軟刪指定的那張牌桌，不會連動刪除場次其他牌桌或手牌資料。",e: "Soft-deletes only the specified table; other tables and hand data in the session are untouched." },
				auth: AUTHOWNER,params: [pathparam("tableid","牌桌 id。","Table id.",55)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_table_not_found","找不到牌桌。","Table not found."),EPERM]
			},
			{
				id: "getsessiontableboard",method: "GET",path: "/getsessiontableboard/{sessionid}",title: { z: "多牌桌總覽看板",e: "Multi-table overview board" },
				desc: { z: "一次回傳該場次所有牌桌的人數、空位與在桌選手，供多桌總覽看板使用。擁有者、管理員、工作人員或該場選手皆可讀取。",e: "Return the occupancy, empty seats and seated players for every table in a session in one call, for a multi-table overview board. Readable by the owner, admins, staff, or players registered in the session." },
				auth: AUTHTOKEN,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [
					R("data.sessionid","int","場次 id。","Session id.",null),
					R("data.maxseat","int","每桌座位數。","Seats per table.",null),
					R("data.tablecount","int","牌桌數。","Number of tables.",null),
					R("data.totalplayers","int","在桌選手總數。","Total seated players.",null),
					R("data.tables","object[]","牌桌陣列。","Array of tables.",[
						SUB("id","int","牌桌 id。","Table id."),
						SUB("no","int","桌號。","Table number."),
						SUB("name","string","桌名。","Table name."),
						SUB("token","string","牌桌 token。","Table token."),
						SUB("maxseat","int","座位數。","Seat count."),
						SUB("occupied","int","已入座人數。","Occupied seats."),
						SUB("empty","int","空位數。","Empty seats."),
						R("players","object[]","在桌選手陣列。","Array of seated players.",[
							SUB("seatno","int","座位號。","Seat number."),
							SUB("sessionplayerid","int","報名 id。","Registration id."),
							SUB("name","string","選手名稱。","Player name."),
							SUB("playerid","string","選手代碼。","Player code."),
							SUB("chip","int","計分牌量。","Chip amount.")
						])
					])
				],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			}
		]
	},
	{
		key: "seating",
		title: { z: "買入／座位記錄",e: "Buy-in / Seating Records" },
		desc: { z: "現金桌的買入、重買、離桌等座位異動記錄。",e: "Cash-game seating changes: buy-in, rebuy, leave, etc." },
		endpoints: [
			{
				id: "getseatinglist",method: "GET",path: "/getseatinglist/{tableid}",title: { z: "座位記錄列表",e: "Seating record list" },
				desc: { z: "取得某張牌桌的所有座位異動記錄。僅場次擁有者或管理員可讀取。",e: "Get all seating-change records for a table. Readable only by the session owner or an admin." },
				auth: AUTHOWNER,params: [pathparam("tableid","牌桌 id。","Table id.",55)],
				response: [R("data","object[]","座位記錄陣列。","Array of seating records.",seatingfields())],
				errors: [ETOKEN,ERR("404","ERROR_table_not_found / ERROR_session_not_found","找不到牌桌或場次。","Table or session not found."),EPERM]
			},
			{
				id: "getseating",method: "GET",path: "/getseating/{seatingid}",title: { z: "取得座位記錄",e: "Get seating record" },
				desc: { z: "取得單筆座位記錄詳情，並合併所屬場次欄位與 sessiontoken。僅場次擁有者或管理員可讀取。",e: "Get a single seating record, merged with the owning session's fields plus sessiontoken. Readable only by the session owner or an admin." },
				auth: AUTHOWNER,params: [pathparam("seatingid","座位記錄 id。","Seating record id.",77)],
				response: [R("data","object","座位記錄物件（合併場次欄位），含 sessiontoken。","The seating record object (merged with session fields), including sessiontoken.",seatingfields().concat([SUB("sessiontoken","string","所屬場次的分享 token。","Share token of the owning session.")]))],
				errors: [ETOKEN,ERR("404","ERROR_seating_not_found / ERROR_table_not_found / ERROR_session_not_found","找不到座位記錄、牌桌或場次。","Seating record, table or session not found."),EPERM]
			},
			{
				id: "newseating",method: "POST",path: "/newseating/{tableid}/{seatno}",title: { z: "新增座位記錄",e: "Create seating record" },
				desc: { z: "新增一筆買入／重買／離桌記錄。seatno 必須為 1～maxseat（依牌桌／場次設定）之間的整數。僅場次擁有者或管理員可操作。",e: "Create a buy-in / rebuy / leave record. seatno must be an integer between 1 and maxseat (per the table / session setting). Only the session owner or an admin may call this." },
				auth: AUTHOWNER,
				params: [
					pathparam("tableid","牌桌 id。","Table id.",55),
					pathparam("seatno","座位號（1～maxseat）。","Seat number (1–maxseat).",5),
					P("type","string",true,"記錄類型：buyin / rebuy / leave。","Record type: buyin / rebuy / leave.",{ ex: "buyin" }),
					P("name","string",true,"選手名稱。","Player name.",{ ex: "Alvin" }),
					P("time","string",true,"時間。","Time.",{ ex: "2026-07-01 20:30" }),
					P("buyin","int",false,"買入金額（整數）。","Buy-in amount (integer).",{ ex: 1000 }),
					P("chip","int",false,"計分牌量（整數）。","Chip amount (integer).",{ ex: 30000 })
				],
				response: [R("data","int","新建立的座位記錄 id。","The new seating record id.",null)],
				errors: [ETOKEN,ERR("404","ERROR_seating_not_found / ERROR_session_not_found","找不到牌桌或場次。","Table or session not found."),ERR("400","ERROR_request_data_type_error","seatno 非整數或不在 1～maxseat 範圍。","seatno is not an integer or is outside 1–maxseat."),EREQ,EPERM]
			},
			{
				id: "editseating",method: "PUT",path: "/editseating/{seatingid}",title: { z: "編輯座位記錄",e: "Edit seating record" },
				desc: { z: "更新座位記錄內容；type / name / time 必填，buyin / chip 選填（未帶時保留原值）。僅場次擁有者或管理員可操作。",e: "Update a seating record; type / name / time are required, buyin / chip are optional (kept unchanged when omitted). Only the session owner or an admin may call this." },
				auth: AUTHOWNER,
				params: [
					pathparam("seatingid","座位記錄 id。","Seating record id.",77),
					P("type","string",true,"記錄類型：buyin / rebuy / leave。","Record type: buyin / rebuy / leave.",{ ex: "buyin" }),
					P("name","string",true,"選手名稱。","Player name.",{ ex: "Alvin" }),
					P("time","string",true,"時間。","Time.",{ ex: "2026-07-01 20:30" }),
					P("buyin","int",false,"買入金額（整數，未帶時保留原值）。","Buy-in amount (integer, kept when omitted).",{ ex: 1000 }),
					P("chip","int",false,"計分牌量（整數，未帶時保留原值）。","Chip amount (integer, kept when omitted).",{ ex: 30000 })
				],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_seating_not_found / ERROR_table_not_found / ERROR_session_not_found","找不到座位記錄、牌桌或場次。","Seating record, table or session not found."),EREQ,EPERM]
			},
			{
				id: "deleteseating",method: "DELETE",path: "/deleteseating/{seatingid}",title: { z: "刪除座位記錄",e: "Delete seating record" },
				desc: { z: "軟刪除座位記錄。僅場次擁有者或管理員可操作。",e: "Soft-delete a seating record. Only the session owner or an admin may call this." },
				auth: AUTHOWNER,params: [pathparam("seatingid","座位記錄 id。","Seating record id.",77)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_seating_not_found / ERROR_table_not_found / ERROR_session_not_found","找不到座位記錄、牌桌或場次。","Seating record, table or session not found."),EPERM]
			}
		]
	},
	{
		key: "registration",
		title: { z: "報名與選手",e: "Registration & Players" },
		desc: { z: "選手自行報名，以及主辦方的報名管理、入座與晉級。",e: "Player self-registration, plus organizer-side registration management, seating and advancement." },
		endpoints: [
			{
				id: "registersession",method: "POST",path: "/registersession/{sessionid}",title: { z: "選手報名",e: "Player register" },
				desc: { z: "選手自行報名一個開放報名的場次。",e: "A player registers themselves for an open session." },
				auth: AUTHTOKEN,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data.id","int","新建立的報名 id。","The new registration id.",null)],
				errors: [ETOKEN,ERR("400","ERROR_session_not_open_for_registration / ERROR_already_registered / ERROR_staff_cannot_register","未開放、已報名或工作人員不可報名等。","Not open, already registered, or staff cannot register.")]
			},
			{
				id: "unregistersession",method: "POST",path: "/unregistersession/{sessionid}",title: { z: "取消報名",e: "Unregister" },
				desc: { z: "選手取消自己的報名。",e: "A player cancels their own registration." },
				auth: AUTHTOKEN,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_registration_not_found","找不到報名。","Registration not found."),EPERM]
			},
			{
				id: "getmyregistrations",method: "GET",path: "/getmyregistrations",title: { z: "我的報名",e: "My registrations" },
				desc: { z: "取得登入者所有報名，附帶場次資訊。",e: "Get all of the signed-in user's registrations with session info." },
				auth: AUTHTOKEN,params: [],
				response: [R("data","object[]","報名陣列（每筆另含場次摘要）。","Array of registrations (each also includes a session summary).",registrationfields().concat([SUB("sessionname","string","場次名稱。","Session name."),SUB("starttime","string","場次開始時間。","Session start time."),SUB("gametype","string","遊戲類型。","Game type."),SUB("profit","int","損益。","Profit.")]))],
				errors: [ETOKEN]
			},
			{
				id: "getmyregistrationstatus",method: "GET",path: "/getmyregistrationstatus/{sessionid}",title: { z: "我的報名狀態",e: "My registration status" },
				desc: { z: "查詢登入者在某場次的報名狀態。",e: "Query the signed-in user's registration status in a session." },
				auth: AUTHTOKEN,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data.status","string","null / registered / confirmed / advanced。","null / registered / confirmed / advanced.",null)],
				errors: [ETOKEN]
			},
			{
				id: "getsessionregistrationlist",method: "GET",path: "/getsessionregistrationlist/{sessionid}",title: { z: "場次報名名單",e: "Session registration list" },
				desc: { z: "主辦方查看場次所有報名，含選手資訊與財務。",e: "Organizer view of all registrations with player info and finances." },
				auth: AUTHOWNER,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data","object","名單與統計。","List and stats.",[
					R("stats","object","彙總統計。","Aggregated stats.",[SUB("registered","int","報名人數。","Registered count."),SUB("confirmed","int","報到人數。","Confirmed count."),SUB("advanced","int","晉級人數。","Advanced count."),SUB("total","int","總人數。","Total count."),SUB("totalbuyin","int","總買入。","Total buy-in."),SUB("totalprize","int","總獎金。","Total prize.")]),
					R("tables","object[]","牌桌列表。","Tables.",[SUB("id","int","牌桌 id。","Table id."),SUB("no","int","桌號。","Table number."),SUB("name","string","桌名。","Table name.")]),
					R("advancetargets","object[]","可晉級目標。","Advance targets.",[SUB("id","int","場次 id。","Session id."),SUB("name","string","場次名稱。","Session name."),SUB("token","string","場次 token。","Session token.")]),
					R("registrations","object[]","報名陣列。","Registrations.",registrationfields().concat([SUB("playername","string","選手名稱。","Player name.")]))
				])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "registersessionplayer",method: "POST",path: "/registersessionplayer/{sessionid}",title: { z: "代為報名",e: "Register a player" },
				desc: { z: "主辦方手動將指定選手加入場次（略過待確認）。",e: "Organizer manually adds a player to the session (skips pending confirmation)." },
				auth: AUTHOWNERSTAFF,
				params: [pathparam("sessionid","場次 id。","Session id.",101),P("playerid","string",true,"選手 playerid。","The player's playerid.",{ ex: "P-10293" })],
				response: [R("data.id","int","新建立的報名 id。","The new registration id.",null)],
				errors: [ETOKEN,ERR("400","ERROR_already_registered / ERROR_staff_cannot_register","已報名或不可報名。","Already registered, or cannot register."),EPERM]
			},
			{
				id: "advancesessionplayer",method: "PUT",path: "/advancesessionplayer/{sessionplayerid}",title: { z: "晉級選手",e: "Advance player" },
				desc: { z: "將選手晉級到關聯的目標場次並帶入計分牌。",e: "Advance a player to a linked target session, carrying chips." },
				auth: AUTHOWNERSTAFF,
				params: [pathparam("sessionplayerid","報名 id。","Registration id.",88),P("advancechip","int",false,"帶入的計分牌數。","Chips to carry over.",{ ex: 50000 })],
				response: [R("data","object","晉級結果。","Advance result.",[
					R("target","object","目標場次。","Target session.",relationsessionfields()),
					SUB("advancechip","int","帶入計分牌。","Carried chips."),
					SUB("advancecount","int","晉級人數。","Advance count."),
					SUB("bestchip","int","最高計分牌。","Best chip.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_registration_not_found / ERROR_session_relation_not_found","找不到報名或關聯場次。","Registration or linked session not found."),EPERM]
			},
			{
				id: "confirmsessionplayer",method: "PUT",path: "/confirmsessionplayer/{sessionplayerid}",title: { z: "確認報到",e: "Confirm check-in" },
				desc: { z: "主辦方確認選手報到。",e: "Organizer confirms a player's check-in." },
				auth: AUTHOWNERSTAFF,params: [pathparam("sessionplayerid","報名 id。","Registration id.",88)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_registration_not_found","找不到報名。","Registration not found."),EPERM]
			},
			{
				id: "cancelsessionplayer",method: "PUT",path: "/cancelsessionplayer/{sessionplayerid}",title: { z: "取消報名（主辦）",e: "Cancel registration (organizer)" },
				desc: { z: "主辦方取消一筆報名（未到場），以軟刪除方式處理（保留 deletetime 記錄）。已入座或已淘汰的報名無法取消（回 403）。",e: "Organizer cancels a registration (no-show); handled as a soft delete (deletetime is recorded). Seated or eliminated registrations cannot be cancelled (403)." },
				auth: AUTHOWNERSTAFF,params: [pathparam("sessionplayerid","報名 id。","Registration id.",88)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_registration_not_found","找不到報名。","Registration not found."),EPERM]
			},
			{
				id: "rebuysessionplayer",method: "PUT",path: "/rebuysessionplayer/{sessionplayerid}",title: { z: "重買",e: "Rebuy" },
				desc: { z: "主辦方為選手登記一次 rebuy：重買次數 +1、配發新入場序號，費用由財務欄位自動累加。需場次已開啟 rebuy 功能，且選手狀態須為 confirmed。",e: "Organizer records one rebuy for a player: rebuy count +1, a new entry serial number is assigned, and the fee is added to the finance total automatically. Requires the session to have rebuy enabled and the player's status to be confirmed." },
				auth: AUTHOWNERSTAFF,params: [pathparam("sessionplayerid","報名 id。","Registration id.",88)],
				response: [
					R("data.id","int","報名 id。","Registration id.",null),
					R("data.rebuy","bool","恆為 true。","Always true.",null)
				],
				errors: [ETOKEN,ERR("404","ERROR_registration_not_found","找不到報名。","Registration not found."),ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),ERR("409","ERROR_already_registered","選手狀態非 confirmed，無法重買。","The player's status is not confirmed, so a rebuy is not allowed."),ERR("409","WARNING_rebuycount_exceeded","已達場次設定的重買次數上限。","The session's rebuy count limit has been reached."),EPERM]
			},
			{
				id: "getcheckininfo",method: "GET",path: "/getcheckininfo/{sessionplayerid}",title: { z: "報到核對資訊",e: "Check-in verification info" },
				desc: { z: "報到核對頁用：查單筆報名的顯示資訊（場次／系列賽／協會名稱、名次、獎金等），供列印收據或報到掃碼核對。允許報名本人、場次擁有者／管理員或該場工作人員查看。",e: "For the check-in verification page: look up a single registration's display info (session/series/club name, placement, prize, etc.), for printing receipts or scan-based check-in verification. Viewable by the registrant themselves, the session owner/admin, or session staff." },
				auth: AUTHTOKEN,params: [pathparam("sessionplayerid","報名 id。","Registration id.",88)],
				response: [R("data","object","報到核對資訊。","Check-in verification info.",[
					SUB("playername","string","選手名稱。","Player name."),
					SUB("playerplayerid","string","選手代碼。","Player code."),
					SUB("sessionname","string","場次名稱。","Session name."),
					SUB("seriestitle","string","所屬系列賽名稱（無則為空字串）。","The owning series' name (empty string if none)."),
					SUB("clubname","string","協會名稱。","Association name."),
					SUB("starttime","string","場次開始時間。","Session start time."),
					SUB("serialno","string","入場序號。","Entry serial number."),
					SUB("status","string","報名狀態。","Registration status."),
					SUB("place","int","名次（可為 null）。","Placement (nullable)."),
					SUB("finalprize","int","最終獎金。","Final prize."),
					SUB("autoprize","int","系統試算獎金。","Auto-calculated prize."),
					SUB("canissue","bool","是否可核發（擁有者／管理員／工作人員檢視時為 true）。","Whether the viewer may issue it (true when viewed by the owner/admin/staff)."),
					SUB("tablename","string","桌號或桌 token。","Table number or table token."),
					SUB("seatno","int","座位號。","Seat number."),
					SUB("buyin","int","買入金額（含服務費）。","Buy-in amount (fee included)."),
					SUB("paymenttype","string","付款方式。","Payment type."),
					SUB("reentrycount","int","再入次數。","Re-entry count.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_registration_not_found","找不到報名。","Registration not found."),ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "editsessionplayerfinance",method: "PUT",path: "/editsessionplayerfinance/{sessionplayerid}",title: { z: "編輯選手財務",e: "Edit player finance" },
				desc: { z: "更新選手的買入、重買、獎金與付款方式等財務資訊。",e: "Update a player's buy-in, rebuy, prize and payment information." },
				auth: AUTHOWNERSTAFF,
				params: [
					pathparam("sessionplayerid","報名 id。","Registration id.",88),
					P("buyin","int",false,"買入金額。","Buy-in amount.",{ ex: 1000 }),
					P("fee","int",false,"服務費。","Fee.",{ ex: 100 }),
					P("rebuycount","int",false,"重買次數。","Rebuy count.",{ ex: 1 }),
					P("reentrycount","int",false,"再入次數。","Re-entry count.",{ ex: 0 }),
					P("addoncount","int",false,"加買次數。","Add-on count.",{ ex: 0 }),
					P("prize","int",false,"獎金。","Prize.",{ ex: 5000 }),
					P("prizeoverride","int",false,"獎金覆寫值。","Prize override value.",{ ex: 0 }),
					P("ticketvalue","int",false,"票券價值。","Ticket value.",{ ex: 0 }),
					P("place","int",false,"名次。","Placement.",{ ex: 1 }),
					P("paymenttype","string",false,"付款方式。","Payment type.",{ ex: "cash" })
				],
				response: [R("data.warnings","string[]","如 WARNING_rebuycount_exceeded。","e.g. WARNING_rebuycount_exceeded.",null)],
				errors: [ETOKEN,ERR("404","ERROR_registration_not_found","找不到報名。","Registration not found."),EREQ,EPERM]
			},
			{
				id: "editsessionplayerseat",method: "PUT",path: "/editsessionplayerseat/{sessionplayerid}",title: { z: "指定座位",e: "Assign seat" },
				desc: { z: "指派或更新選手的牌桌與座位。",e: "Assign or update a player's table and seat." },
				auth: AUTHOWNERSTAFF,
				params: [
					pathparam("sessionplayerid","報名 id。","Registration id.",88),
					P("tableid","int",false,"牌桌 id。","Table id.",{ ex: 55 }),
					P("seatno","int",false,"座位號。","Seat number.",{ ex: 1 }),
					P("startchip","int",false,"起始計分牌。","Starting chips.",{ ex: 30000 }),
					P("paymenttype","string",false,"付款方式。","Payment type.",{ ex: "cash" })
				],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_registration_not_found / ERROR_table_not_found","找不到報名或牌桌。","Registration or table not found."),ERR("400","ERROR_player_eliminated / ERROR_already_registered","選手已淘汰或座位衝突。","Player eliminated, or seat conflict."),EPERM]
			},
			{
				id: "randomizesessionplayerseats",method: "PUT",path: "/randomizesessionplayerseats/{sessionid}",title: { z: "隨機排座",e: "Randomize seats" },
				desc: { z: "為選手隨機分配座位（單桌、平衡或指定）。",e: "Randomly assign seats to players (single-table, balanced or selected)." },
				auth: AUTHOWNERSTAFF,
				params: [
					pathparam("sessionid","場次 id。","Session id.",101),
					P("tableid","int",false,"單桌模式的牌桌 id。","Table id for single-table mode.",{ ex: 55 }),
					P("tableids","int[]",false,"指定要排座的牌桌集合。","The set of tables to seat.",{ ex: [55,56] }),
					P("playerids","int[]",false,"指定要排座的選手集合。","The set of players to seat.",{ ex: [88,89] }),
					P("mode","string",false,"排座模式：unseated / selected / balanced。","Seating mode: unseated / selected / balanced.",{ ex: "balanced" }),
					P("startchip","int",false,"起始計分牌。","Starting chips.",{ ex: 30000 })
				],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_session_not_found / ERROR_table_not_found","找不到場次或牌桌。","Session or table not found."),EREQ,EPERM]
			}
		]
	},
	{
		key: "staff",
		title: { z: "工作人員",e: "Staff" },
		desc: { z: "荷官／裁判／助理等工作人員的邀請與管理。",e: "Invite and manage staff such as dealers / floor / assistants." },
		endpoints: [
			{
				id: "getstafflist",method: "GET",path: "/getstafflist",title: { z: "工作人員列表",e: "Staff list" },
				desc: { z: "主辦方列出所有工作人員，依角色分組。",e: "Organizer lists all staff, grouped by role." },
				auth: AUTHTOKEN,params: [],
				response: [R("data","object","依角色分組。","Grouped by role.",[
					R("dealer","object[]","荷官列表。","Dealer list.",stafffields()),
					R("floor","object[]","裁判列表。","Floor list.",stafffields()),
					R("assistant","object[]","助理列表。","Assistant list.",stafffields())
				])],
				errors: [ETOKEN,ERR("404","ERROR_user_not_found","找不到使用者。","User not found.")]
			},
			{
				id: "newstaff",method: "POST",path: "/newstaff",title: { z: "邀請工作人員",e: "Invite staff" },
				desc: { z: "主辦方邀請工作人員（寄送驗證信）。",e: "Organizer invites a staff member (sends a verification email)." },
				auth: AUTHTOKEN,
				params: [P("playerid","string",true,"受邀者 playerid。","Invitee's playerid.",{ ex: "P-10293" }),P("role","string",true,"dealer / floor / assistant。","dealer / floor / assistant.",{ ex: "dealer" })],
				response: [R("data","object","受邀者資訊。","Invitee info.",[
					SUB("staffname","string","姓名。","Name."),
					SUB("staffplayerid","string","選手代碼。","Player code.")
				])],
				errors: [ETOKEN,ERR("400","ERROR_staff_self_invite / ERROR_staff_role_mismatch / ERROR_staff_already_invited","不可邀請自己、角色不符或已邀請。","Cannot invite self, role mismatch, or already invited."),EREQ]
			},
			{
				id: "deletestaff",method: "DELETE",path: "/deletestaff/{staffid}",title: { z: "移除工作人員",e: "Remove staff" },
				desc: { z: "主辦方移除工作人員。",e: "Organizer removes a staff member." },
				auth: AUTHTOKEN,params: [pathparam("staffid","工作人員關聯 id。","Staff relation id.",6)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_staff_not_found","找不到工作人員。","Staff not found."),EPERM]
			},
			{
				id: "verifystaff",method: "GET",path: "/verifystaff/{verifytoken}",title: { z: "確認受邀",e: "Confirm invitation" },
				desc: { z: "工作人員透過信件中的連結確認邀請。",e: "Staff confirms the invitation via the link in the email." },
				auth: AUTHPATHTOKEN,params: [pathparam("verifytoken","驗證 token。","Verification token.","a1b2c3")],
				response: [R("data","string","already_active / user_staff_verified / session_staff_verified。","already_active / user_staff_verified / session_staff_verified.",null)],
				errors: [ERR("400","ERROR_verifytoken_invalid","驗證 token 無效。","Verification token invalid.")]
			},
			{
				id: "getsessionstafflist",method: "GET",path: "/getsessionstafflist/{sessionid}",title: { z: "場次工作人員",e: "Session staff" },
				desc: { z: "列出某場次的工作人員，依角色分組。",e: "List a session's staff, grouped by role." },
				auth: AUTHOWNER,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data","object","依角色分組。","Grouped by role.",[
					R("dealer","object[]","荷官列表。","Dealer list.",stafffields()),
					R("floor","object[]","裁判列表。","Floor list.",stafffields()),
					R("assistant","object[]","助理列表。","Assistant list.",stafffields())
				])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "newsessionstaff",method: "POST",path: "/newstaff/{sessionid}",title: { z: "指派場次工作人員",e: "Assign session staff" },
				desc: { z: "主辦方為特定場次指派工作人員。",e: "Organizer assigns staff to a specific session." },
				auth: AUTHOWNER,
				params: [pathparam("sessionid","場次 id。","Session id.",101),P("playerid","string",true,"受邀者 playerid。","Invitee's playerid.",{ ex: "P-10293" }),P("role","string",true,"dealer / floor / assistant。","dealer / floor / assistant.",{ ex: "dealer" })],
				response: [R("data","object","受邀者資訊。","Invitee info.",[SUB("staffname","string","員工名稱。","Staff name."),SUB("staffplayerid","string","員工選手代碼。","Staff player code.")])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),ERR("400","ERROR_staff_already_invited","已邀請。","Already invited."),EREQ,EPERM]
			},
			{
				id: "deletesessionstaff",method: "DELETE",path: "/deletesessionstaff/{sessionstaffid}",title: { z: "移除場次工作人員",e: "Remove session staff" },
				desc: { z: "從場次移除工作人員。",e: "Remove staff from a session." },
				auth: AUTHOWNER,params: [pathparam("sessionstaffid","場次工作人員 id。","Session-staff id.",6)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_staff_not_found / ERROR_session_not_found","找不到工作人員或場次。","Staff or session not found."),EPERM]
			}
		]
	},
	{
		key: "timer",
		title: { z: "賽事計時器",e: "Tournament Timer" },
		desc: { z: "錦標賽計時器狀態、級別結構、獎金與在線選手。",e: "Tournament timer state, level structure, prizes and live players." },
		endpoints: [
			{
				id: "gettimer",method: "GET",path: "/gettimer/{sessionid}",title: { z: "取得計時器",e: "Get timer" },
				desc: { z: "取得計時器狀態（盲注結構、獎金、目前級別、運行狀態）。公開場次免 Token。",e: "Get timer state (blind structure, prizes, current level, run state). Public sessions need no token." },
				auth: { z: "公開場次免 Token；私人場次需 Bearer Token 且具存取權。",e: "Public sessions need no token; private sessions require a Bearer token with access." },
				params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data","object","計時器資料。","Timer data.",[
					SUB("sessionid","int","場次 id。","Session id."),
					R("state","object","計時器狀態。","Timer state.",timerstatefields()),
					SUB("updatetime","string","最後更新時間。","Last update time.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "savetimer",method: "PUT",path: "/savetimer/{sessionid}",title: { z: "儲存計時器",e: "Save timer" },
				desc: { z: "更新計時器設定與運行狀態（盲注表、獎金、選手）。若寫入內容會改到結構欄位（schedule / payouts / config 相關欄位），需具備結構權限：擁有者、管理員或 floor / assistant（不看 client 傳的 action）。並發寫入衝突（版本不符重試失敗）會回 ERROR_timer_save_conflict。",e: "Update timer settings and run state (blind table, prizes, players). Writes touching structural fields (schedule / payouts / config-related fields) require structure permission: the owner, admins, or floor / assistant staff (regardless of the client-sent action). A concurrent-write conflict (version-retry exhausted) returns ERROR_timer_save_conflict." },
				auth: AUTHOWNER,
				params: [pathparam("sessionid","場次 id。","Session id.",101),P("state","object",true,"完整計時器狀態。","The full timer state.",{ ex: { running: false,currentlevel: 1,blindstructures: [] } }),P("action","string",false,"toggle / item-change / reset / struct-edit。","toggle / item-change / reset / struct-edit.",{ ex: "toggle" })],
				response: [R("data","object","更新後的計時器狀態。","The updated timer state.",timerstatefields())],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),ERR("400","ERROR_request_data_not_found","缺少 state。","Missing state."),ERR("400","ERROR_timer_save_conflict","並發寫入衝突，請重新載入後再儲存。","Concurrent write conflict; reload and save again."),EPERM]
			},
			{
				id: "gettimerplayers",method: "GET",path: "/gettimerplayers/{sessionid}",title: { z: "計時器選手",e: "Timer players" },
				desc: { z: "取得連動選手清單（含淘汰狀態與名次）。公開場次免 Token。",e: "Get the linked player list (with elimination status and placement). Public sessions need no token." },
				auth: { z: "公開場次免 Token；私人場次需 Bearer Token 且具存取權。",e: "Public sessions need no token; private sessions require a Bearer token with access." },
				params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data","object[]","選手陣列。","Array of players.",[
					SUB("status","string","淘汰狀態。","Elimination status."),
					SUB("place","int","名次。","Placement."),
					SUB("playername","string","選手名稱。","Player name.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "edittimerplayer",method: "PUT",path: "/edittimerplayer/{sessionid}/{timerplayerid}",title: { z: "淘汰／復活選手",e: "Eliminate / restore player" },
				desc: { z: "在計時器中淘汰或復活一名選手。",e: "Eliminate or restore a player in the timer." },
				auth: AUTHOWNER,
				params: [pathparam("sessionid","場次 id。","Session id.",101),pathparam("timerplayerid","計時器選手 id。","Timer player id.",2),P("action","string",true,"eliminate / restore。","eliminate / restore.",{ ex: "eliminate" })],
				response: [R("data","object","更新後的計時器狀態。","The updated timer state.",timerstatefields())],
				errors: [ETOKEN,ERR("404","ERROR_timer_player_not_found","找不到選手。","Player not found."),ERR("400","ERROR_request_data_not_found","缺少 action。","Missing action."),EPERM]
			},
			{
				id: "parsestructure",method: "POST",path: "/parsestructure",title: { z: "解析賽事結構",e: "Parse tournament structure" },
				desc: { z: "把貼上的盲注結構文字（或截圖）解析成級別／休息結構。優先用免費規則解析，必要時以 AI 兜底（需設定 AI 金鑰）。mode 為 session 時另解析起始計分牌、買入、開賽時間等場次 metadata。需登入。",e: "Parse pasted blind-structure text (or a screenshot) into a level / break schedule. Free rule-based parsing first, falling back to AI when needed (requires an AI key). When mode is session, it also extracts session metadata such as starting stack, buy-in and start time. Login required." },
				auth: AUTHTOKEN,
				params: [
					P("text","string",false,"盲注結構文字；無 image 時必填。","Blind-structure text; required when no image is given.",{ ex: "1  100/200  20min\n2  200/400  20min\nBreak 10min" }),
					P("image","string",false,"結構截圖（base64 或 data URL，png／jpeg／webp）；有 image 時改走視覺 AI。","A structure screenshot (base64 or data URL, png/jpeg/webp); when present, vision AI is used instead.",{ ex: "data:image/png;base64,iVBORw0KGgo..." }),
					P("mode","string",false,"auto（規則優先、必要時 AI）／ai（強制 AI）／session（整場匯入，含 metadata）。預設 auto。","auto (rules first, AI if needed) / ai (force AI) / session (full import with metadata). Default auto.",{ ex: "auto" })
				],
				response: [
					R("data.schedule","object[]","解析出的級別／休息陣列。","Parsed level / break array.",[
						SUB("type","string","level / break。","level / break."),
						SUB("sb","int","小盲（level 時）。","Small blind (for level)."),
						SUB("bb","int","大盲（level 時）。","Big blind (for level)."),
						SUB("ante","int","前注（level 時）。","Ante (for level)."),
						SUB("dur","int","時長（分）。","Duration (minutes).")
					]),
					R("data.count","int","結構筆數。","Number of schedule items.",null),
					R("data.source","string","解析來源：rule / ai / none。","Parse source: rule / ai / none.",null),
					R("data.aiavailable","bool","後端是否已設定 AI 金鑰。","Whether the backend has an AI key configured.",null),
					R("data.startingStack / buyin / startTime / regCloseLevel / regCloseEndTime","mixed","mode=session 時另回傳的場次 metadata。","Extra session metadata returned when mode=session.",null)
				],
				errors: [ETOKEN,ERR("400","ERROR_request_data_not_found","request body 非合法 JSON，或 text／image 皆缺、圖片格式或大小不符。","Request body is not valid JSON, or both text and image are missing, or the image type/size is invalid.")]
			}
		]
	},
	{
		key: "hand",
		title: { z: "手牌記錄",e: "Hand Records" },
		desc: { z: "手牌的記錄、查詢、編輯與牌局上下文／時間銀行。",e: "Record, query and edit hands, plus hand context / time bank." },
		endpoints: [
			{
				id: "gethandcontext",method: "GET",path: "/gethandcontext/{tableid}",title: { z: "牌局上下文",e: "Hand context" },
				desc: { z: "取得記錄手牌所需的完整上下文：座位圖、計時器級別、計分牌、最新手牌與下一個莊家。",e: "Get the full context needed to record a hand: seat map, timer level, chips, latest hand and next dealer." },
				auth: AUTHTOKEN,params: [pathparam("tableid","牌桌 id。","Table id.",55)],
				response: [R("data","object","上下文資料。","Context data.",[
					R("session","object","場次資訊。","Session info.",sessionfields()),
					R("table","object","牌桌資訊。","Table info.",[SUB("id","int","牌桌 id。","Table id."),SUB("no","int","桌號。","Table number."),SUB("name","string","桌名。","Table name."),SUB("token","string","牌桌 token。","Table token."),SUB("firstdealerplace","int","首莊座位。","First-dealer seat."),SUB("selfseating","int","自家座位。","Own seat.")]),
					R("seatmap","object[]","座位圖。","Seat map.",[SUB("seatno","int","座位號。","Seat number."),SUB("sessionplayerid","int","報名選手 id。","Registered player id."),SUB("name","string","選手名稱。","Player name."),SUB("chip","int","計分牌量。","Chip amount.")]),
					R("timerlevel","object","目前計時器級別。","Current timer level.",[SUB("level","int","級別。","Level."),SUB("smallblind","int","小盲。","Small blind."),SUB("bigblind","int","大盲。","Big blind."),SUB("ante","int","前注。","Ante."),SUB("duration","int","時長（分）。","Duration (minutes).")]),
					R("chips","object[]","計分牌設定。","Chip settings.",chipfields()),
					R("latesthand","object","最新手牌。","Latest hand.",handfields()),
					SUB("nextdealer","int","下一個莊家座位。","Next dealer seat.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_table_not_found / ERROR_session_not_found","找不到牌桌或場次。","Table or session not found."),EPERM]
			},
			{
				id: "gettimebank",method: "GET",path: "/gettimebank/{tableid}",title: { z: "取得時間銀行",e: "Get time bank" },
				desc: { z: "取得牌桌的時間銀行狀態與預設值。",e: "Get a table's time-bank state and defaults." },
				auth: AUTHTOKEN,params: [pathparam("tableid","牌桌 id。","Table id.",55)],
				response: [R("data","object","時間銀行。","Time bank.",[
					R("state","object","目前狀態。","Current state.",[SUB("enabled","bool","是否啟用。","Whether enabled."),SUB("seatno","int","座位號。","Seat number."),SUB("durationseconds","int","秒數。","Seconds."),SUB("running","bool","是否運行中。","Whether running.")]),
					R("defaults","object","預設值。","Defaults.",[SUB("durationseconds","int","預設秒數。","Default seconds."),SUB("count","int","可用次數。","Available count.")])
				])],
				errors: [ETOKEN,ERR("404","ERROR_table_not_found / ERROR_session_not_found","找不到牌桌或場次。","Table or session not found."),EPERM]
			},
			{
				id: "savetimebank",method: "PUT",path: "/savetimebank/{tableid}",title: { z: "儲存時間銀行",e: "Save time bank" },
				desc: { z: "更新牌桌的時間銀行狀態。",e: "Update a table's time-bank state." },
				auth: AUTHOWNER,
				params: [pathparam("tableid","牌桌 id。","Table id.",55),P("state","object",true,"時間銀行狀態。","Time-bank state.",{ fields: [
					SUB("enabled","bool","是否啟用。","Whether enabled."),
					SUB("seatno","int","座位號。","Seat number."),
					SUB("durationseconds","int","秒數。","Seconds.")
				],ex: { enabled: true,seatno: 5,durationseconds: 30 } })],
				response: [R("data","object","時間銀行。","Time bank.",[R("state","object","目前狀態。","Current state.",[SUB("enabled","bool","是否啟用。","Whether enabled."),SUB("seatno","int","座位號。","Seat number."),SUB("durationseconds","int","秒數。","Seconds.")]),R("defaults","object","預設值。","Defaults.",[SUB("durationseconds","int","預設秒數。","Default seconds."),SUB("count","int","可用次數。","Available count.")])])],
				errors: [ETOKEN,ERR("404","ERROR_table_not_found","找不到牌桌。","Table not found."),EREQ,EPERM]
			},
			{
				id: "gethandlist",method: "GET",path: "/gethandlist/{tableid}",title: { z: "牌桌手牌列表",e: "Table hand list" },
				desc: { z: "查詢牌桌手牌，支援座位、選手、日期等過濾。",e: "Query a table's hands with seat, player and date filters." },
				auth: AUTHTOKEN,
				params: [
					pathparam("tableid","牌桌 id。","Table id.",55),
					queryparam("seatno","string","依座位號過濾。","Filter by seat number."),
					queryparam("userid","string","依使用者 id 過濾。","Filter by user id."),
					queryparam("playerid","string","依選手代碼過濾。","Filter by player code."),
					queryparam("datefrom","string","起始日期。","Start date."),
					queryparam("dateto","string","結束日期。","End date.")
				],
				response: [R("data","object[]","手牌陣列。","Array of hands.",[
					R("seatingdata","object[]","座位資料。","Seating data.",[SUB("seatno","int","座位號。","Seat number."),SUB("name","string","選手名稱。","Player name."),SUB("chip","int","計分牌量。","Chip amount."),SUB("sessionplayerid","int","報名選手 id。","Registered player id.")]),
					R("bittingdata","object[]","下注資料。","Betting data.",[SUB("seatno","int","座位號。","Seat number."),SUB("street","string","街道：preflop / flop / turn / river。","Street: preflop / flop / turn / river."),SUB("action","string","動作：fold / call / raise / check / allin。","Action: fold / call / raise / check / allin."),SUB("amount","int","金額。","Amount.")]),
					R("result","object","結果。","Result.",[SUB("winners","int[]","贏家座位號。","Winning seat numbers."),R("winnerprice","object","各贏家分得彩池；以座位號為鍵。","Pot won by each winner, keyed by seat number.",[SUB("<贏家座位號>","int","該座位分得的彩池。","Pot won by that seat.")])]),
					SUB("canedit","bool","是否可編輯。","Whether editable.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_table_not_found / ERROR_session_not_found","找不到牌桌或場次。","Table or session not found."),EPERM]
			},
			{
				id: "getsessionhandlist",method: "GET",path: "/getsessionhandlist/{sessionid}",title: { z: "場次手牌列表",e: "Session hand list" },
				desc: { z: "查詢整個場次的手牌，可依座位過濾。",e: "Query a whole session's hands, filterable by seat." },
				auth: AUTHTOKEN,
				params: [pathparam("sessionid","場次 id。","Session id.",101),queryparam("seatno","string","座位過濾。","Seat filter.")],
				response: [R("data","object[]","手牌陣列。","Array of hands.",handfields())],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "gethand",method: "GET",path: "/gethand/{handid}",title: { z: "取得手牌",e: "Get hand" },
				desc: { z: "取得單一手牌完整詳情。",e: "Get a single hand in full." },
				auth: AUTHTOKEN,params: [pathparam("handid","手牌 id。","Hand id.",9001)],
				response: [R("data","object","手牌完整物件。","The full hand object.",handfields().concat([R("seatinglist","object[]","各座位選手與計分牌。","Players and chips per seat.",[SUB("seatno","int","座位號。","Seat number."),SUB("name","string","選手名稱。","Player name."),SUB("chip","int","計分牌量。","Chip amount.")]),R("bittingdata","object[]","下注動作。","Betting actions.",[SUB("seatno","int","座位號。","Seat number."),SUB("street","string","街道。","Street."),SUB("action","string","動作。","Action."),SUB("amount","int","金額。","Amount.")]),SUB("winners","int[]","贏家座位號。","Winning seat numbers.")]))],
				errors: [ETOKEN,ERR("404","ERROR_hand_not_found / ERROR_session_not_found","找不到手牌或場次。","Hand or session not found."),EPERM]
			},
			{
				id: "newhand",method: "POST",path: "/newhand/{tableid}",title: { z: "新增手牌",e: "Create hand" },
				desc: { z: "建立一筆手牌記錄（座位、下注動作、攤牌與贏家）。",e: "Create a hand record (seating, betting actions, showdown and winner)." },
				auth: AUTHOWNER,
				params: [
					pathparam("tableid","牌桌 id。","Table id.",55),
					P("dealerseat","int",true,"莊家座位。","Dealer seat.",{ ex: 1 }),
					P("selfseating","int",true,"自家座位。","Own seat.",{ ex: 5 }),
					P("seatinglist","object[]",true,"各座位選手與計分牌。","Players and chips per seat.",{ fields: [
						SUB("seatno","int","座位號。","Seat number."),
						SUB("name","string","選手名稱。","Player name."),
						SUB("chip","int","計分牌量。","Chip amount.")
					],ex: [{ seatno: 1,name: "Bob",chip: 30000 },{ seatno: 5,name: "Me",chip: 28000 }] }),
					P("recordtype","string",false,"hand / stackadjustment / brokenhand。","hand / stackadjustment / brokenhand.",{ ex: "hand" }),
					P("exceptiontype","string",false,"recordtype 非 hand 時必填。","Required when recordtype is not hand.",{ ex: "" }),
					P("handcard","object",false,"自家底牌 { card1, card2 }。","Own hole cards { card1, card2 }.",{ ex: { card1: "As",card2: "Kd" } }),
					P("boardcard","object",false,"公共牌 { flop, turn, river }。","Board { flop, turn, river }.",{ ex: { flop: ["Qs","Js","2c"],turn: "",river: "" } }),
					P("bittingdata","object",false,"各街下注動作資料。","Per-street betting action data.",{ ex: {} }),
					P("showdowndata","object",false,"各座位攤牌資料。","Per-seat showdown data.",{ ex: {} }),
					P("winner","object",false,"贏家資料。","Winner data.",{ ex: {} }),
					P("winnerprice","object",false,"各贏家分得的彩池。","Pot won by each winner.",{ ex: {} }),
					P("adjustments","object",false,"計分牌調整資料（stackadjustment 用）。","Chip-adjustment data (for stackadjustment).",{ ex: {} }),
					P("smallblind","int",false,"小盲。","Small blind.",{ ex: 100 }),
					P("bigblind","int",false,"大盲。","Big blind.",{ ex: 200 }),
					P("ante","int",false,"前注。","Ante.",{ ex: 200 }),
					P("levelid","int",false,"計時器級別 id。","Timer level id.",{ ex: 3 }),
					P("totalpot","int",false,"總底池。","Total pot.",{ ex: 4000 }),
					P("ps","string",false,"備註。","Notes.",{ ex: "" }),
					P("note","string",false,"私人筆記。","Private note.",{ ex: "" }),
					P("blindlevel","string",false,"級別標籤。","Level label.",{ ex: "L3" })
				],
				response: [R("data.id","int","新建立的手牌 id。","The new hand id.",null)],
				errors: [ETOKEN,ERR("404","ERROR_table_not_found / ERROR_session_not_found","找不到牌桌或場次。","Table or session not found."),EREQ,EPERM]
			},
			{
				id: "editmyhandcard",method: "PUT",path: "/editmyhandcard/{handid}",title: { z: "編輯自家手牌",e: "Edit my hole cards" },
				desc: { z: "選手於統一記錄模式下編輯自己的底牌。",e: "A player edits their own hole cards in unified-record mode." },
				auth: AUTHTOKEN,
				params: [pathparam("handid","手牌 id。","Hand id.",9001),P("handcard","object",true,"底牌。","Hole cards.",{ fields: [
					SUB("card1","string","第一張牌，例如 As。","First card, e.g. As."),
					SUB("card2","string","第二張牌，例如 Kd。","Second card, e.g. Kd.")
				],ex: { card1: "As",card2: "Kd" } }),P("note","string",false,"備註。","Notes.",{ ex: "" })],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_hand_not_found","找不到手牌。","Hand not found."),EREQ,EPERM]
			},
			{
				id: "edithand",method: "PUT",path: "/edithand/{handid}",title: { z: "編輯手牌",e: "Edit hand" },
				desc: { z: "更新手牌的備註、盲注、牌面與動作。",e: "Update a hand's notes, blinds, board and actions." },
				auth: AUTHOWNER,
				params: [
					pathparam("handid","手牌 id。","Hand id.",9001),
					P("ps","string",false,"備註。","Notes.",{ ex: "" }),
					P("note","string",false,"私人筆記。","Private note.",{ ex: "" }),
					P("blindlevel","string",false,"級別標籤。","Level label.",{ ex: "L3" }),
					P("smallblind","int",false,"小盲。","Small blind.",{ ex: 100 }),
					P("bigblind","int",false,"大盲。","Big blind.",{ ex: 200 }),
					P("ante","int",false,"前注。","Ante.",{ ex: 200 }),
					P("levelid","int",false,"計時器級別 id。","Timer level id.",{ ex: 3 }),
					P("handcard","object",false,"自家底牌 { card1, card2 }。","Own hole cards { card1, card2 }.",{ ex: { card1: "As",card2: "Kd" } }),
					P("boardcard","object",false,"公共牌 { flop, turn, river }。","Board { flop, turn, river }.",{ ex: { flop: ["Qs","Js","2c"],turn: "",river: "" } }),
					P("actionsjson","object",false,"各街下注動作（JSON）。","Per-street betting actions (JSON).",{ ex: {} })
				],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_hand_not_found","找不到手牌。","Hand not found."),ERR("400","ERROR_request_data_not_found","request body 非合法 JSON。","Request body is not valid JSON."),EPERM]
			},
			{
				id: "deletehand",method: "DELETE",path: "/deletehand/{handid}",title: { z: "刪除手牌",e: "Delete hand" },
				desc: { z: "軟刪除手牌及其座位與下注資料。一般手牌只允許刪除同桌最新一筆（quickhand 例外，可任意刪除）；刪除時會還原該手造成的淘汰連動（sessiontimerplayer 還原為 active、sessionplayer 還原回原桌原座位，僅在該選手仍為淘汰且座位仍空著時）。",e: "Soft-delete a hand and its seating and betting data. Only the table's latest hand may be deleted (quickhand records are exempt); deleting also reverts eliminations caused by that hand (sessiontimerplayer back to active, sessionplayer back to its table/seat, only while the player is still eliminated and the seat is still empty)." },
				auth: AUTHOWNER,params: [pathparam("handid","手牌 id。","Hand id.",9001)],
				response: dataok(),errors: [ETOKEN,ERR("404","ERROR_hand_not_found / ERROR_session_not_found","找不到手牌或場次。","Hand or session not found."),ERR("400","ERROR_only_latest_hand_deletable","只能刪除同桌最新一筆手牌。","Only the table's latest hand may be deleted."),ERR("500","ERROR_database_error","資料庫交易失敗。","Database transaction failed."),EPERM]
			},
			{
				id: "getsessionchips",method: "GET",path: "/getsessionchips/{sessionid}",title: { z: "場次計分牌面額",e: "Session chip denominations" },
				desc: { z: "取得場次的計分牌面額與顏色設定，供手牌回放上色使用。",e: "Get the session's chip denominations and colors, for coloring hand replay." },
				auth: AUTHTOKEN,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data","object[]","計分牌設定陣列。","Array of chip settings.",chipfields())],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "getbroadcasthandlist",method: "GET",path: "/getbroadcasthandlist/{sessionid}",title: { z: "場外轉播手牌列表",e: "Public broadcast hand list" },
				desc: { z: "唯讀、免登入端點，僅對開放轉播的公開統一手牌記錄場次生效。依場次設定套用延遲分鐘數或 H4H 逐手放行，並依「是否顯示底牌」遮蔽自家以外的手牌。",e: "Read-only endpoint requiring no login; only works for sessions with public broadcast enabled under unified hand recording. Applies the session's delay minutes or H4H manual release, and masks hole cards per the show-card setting." },
				auth: AUTHOPEN,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [
					R("data","object[]","手牌陣列（依設定套用延遲／放行與遮蔽）。","Array of hands (delay/release and masking applied per settings).",handfields()),
					R("session","object","場次轉播中繼資料。","Session broadcast metadata.",[
						SUB("id","int","場次 id。","Session id."),
						SUB("name","string","場次名稱。","Session name."),
						SUB("unifiedhandrecord","bool","是否啟用統一手牌記錄。","Whether unified hand recording is enabled."),
						SUB("maxseat","int","每桌座位數。","Seats per table."),
						SUB("broadcastdelay","int","延遲分鐘數。","Delay in minutes."),
						SUB("broadcastshowcard","bool","是否顯示底牌。","Whether hole cards are shown."),
						SUB("broadcasth4h","bool","是否為 H4H 手動推進。","Whether H4H manual release is enabled."),
						R("chips","object[]","計分牌設定。","Chip settings.",chipfields())
					])
				],
				errors: [ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "getbroadcastcontrol",method: "GET",path: "/getbroadcastcontrol/{sessionid}",title: { z: "取得轉播控制台",e: "Get broadcast control" },
				desc: { z: "裁判／主辦端 H4H 控制台：回傳已放行／總手數、下一手待放行預覽與各手放行狀態。僅擁有者、管理員或有計時器／記錄權限者可存取。",e: "Referee/host H4H control console: returns released/total counts, a preview of the next pending hand and each hand's release status. Accessible only to the owner, admins, or callers with timer/record permission." },
				auth: AUTHOWNER,params: [pathparam("sessionid","場次 id。","Session id.",101)],
				response: [R("data","object","控制台狀態。","Control console state.",[
					SUB("total","int","總手數。","Total hand count."),
					SUB("released","int","已放行手數。","Number of released hands."),
					SUB("pending","int","待放行手數。","Number of pending hands."),
					SUB("h4h","bool","是否為 H4H 手動推進。","Whether H4H manual release is enabled."),
					R("nexthand","object","下一手待放行預覽（無則為 null）。","Preview of the next pending hand (null if none).",[
						SUB("id","int","手牌 id。","Hand id."),
						SUB("createtime","string","建立時間。","Creation time."),
						SUB("smallblind","int","小盲。","Small blind."),
						SUB("bigblind","int","大盲。","Big blind."),
						SUB("ante","int","前注。","Ante."),
						SUB("tablename","string","桌號。","Table number."),
						SUB("order","int","在放行序列中的序號。","Order within the release sequence.")
					]),
					R("hands","object[]","全部手牌的放行狀態陣列。","Array of all hands with release status.",[
						SUB("id","int","手牌 id。","Hand id."),
						SUB("createtime","string","建立時間。","Creation time."),
						SUB("released","bool","是否已放行。","Whether it has been released."),
						SUB("order","int","序號。","Order.")
					]),
					SUB("name","string","場次名稱。","Session name.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			},
			{
				id: "broadcastrelease",method: "PUT",path: "/broadcastrelease/{sessionid}",title: { z: "放行轉播手牌",e: "Release broadcast hands" },
				desc: { z: "裁判／主辦操作 H4H 逐手放行：advance 推進一手、all 全部放行、back 退回一手。放行後會即時通知轉播觀眾端重新載入。",e: "Referee/host H4H release action: advance releases one more hand, all releases everything, back retracts one hand. Broadcast viewers are notified to reload after the update." },
				auth: AUTHOWNER,
				params: [pathparam("sessionid","場次 id。","Session id.",101),P("action","string",false,"advance / all / back，預設 advance。","advance / all / back, default advance.",{ ex: "advance" })],
				response: [R("data","object","更新後的放行狀態。","Updated release state.",[
					SUB("released","int","已放行手數。","Number of released hands."),
					SUB("total","int","總手數。","Total hand count."),
					SUB("pending","int","待放行手數。","Number of pending hands.")
				])],
				errors: [ETOKEN,ERR("404","ERROR_session_not_found","找不到場次。","Session not found."),EPERM]
			}
		]
	},
	{
		key: "notification",
		title: { z: "通知中心",e: "Notifications" },
		desc: { z: "站內通知的列表、未讀數、已讀與刪除。",e: "List, unread count, mark-as-read and delete for in-app notifications." },
		endpoints: [
			{
				id: "getnotificationlist",method: "GET",path: "/getnotificationlist",title: { z: "通知列表",e: "Notification list" },
				desc: { z: "分頁查詢登入者的站內通知，可依標題／內容關鍵字過濾。",e: "Paginated query of the signed-in user's in-app notifications, filterable by title/message keyword." },
				auth: AUTHTOKEN,
				params: [
					queryparam("page","int","頁碼，預設 1。","Page number, default 1."),
					queryparam("limit","int","每頁筆數，預設 20，上限 200。","Page size, default 20, max 200."),
					queryparam("keyword","string","比對標題／內容。","Match against title/message.")
				],
				response: [
					R("data.list","object[]","通知陣列。","Array of notifications.",[
						SUB("id","int","通知 id。","Notification id."),
						SUB("userid","int","接收者使用者 id。","Recipient user id."),
						SUB("sessionid","int","關聯場次 id（可為 null）。","Related session id (nullable)."),
						SUB("type","string","通知類型。","Notification type."),
						SUB("title","string","標題。","Title."),
						SUB("message","string","內容。","Message body."),
						SUB("readed","bool","是否已讀。","Whether it has been read."),
						SUB("createtime","string","建立時間。","Creation time.")
					],"limit"),
					R("data.pagination","object","分頁資訊。","Pagination info.",[
						SUB("page","int","目前頁碼。","Current page."),
						SUB("limit","int","每頁筆數。","Page size."),
						SUB("total","int","總筆數。","Total count."),
						SUB("totalpages","int","總頁數。","Total pages."),
						SUB("hasprev","bool","是否有上一頁。","Whether a previous page exists."),
						SUB("hasnext","bool","是否有下一頁。","Whether a next page exists.")
					])
				],
				errors: [ETOKEN]
			},
			{
				id: "getnotificationunreadcount",method: "GET",path: "/getnotificationunreadcount",title: { z: "未讀通知數",e: "Unread notification count" },
				desc: { z: "取得登入者未讀通知數，供導覽列小紅點使用。",e: "Get the signed-in user's unread notification count, for a navbar badge." },
				auth: AUTHTOKEN,params: [],
				response: [R("data.unread","int","未讀通知數。","Unread notification count.",null)],
				errors: [ETOKEN]
			},
			{
				id: "readnotification",method: "PUT",path: "/readnotification/{notificationid}",title: { z: "標記已讀",e: "Mark as read" },
				desc: { z: "把單一通知標記為已讀。",e: "Mark a single notification as read." },
				auth: AUTHTOKEN,params: [pathparam("notificationid","通知 id。","Notification id.",1)],
				response: dataok(),errors: [ETOKEN]
			},
			{
				id: "readallnotification",method: "PUT",path: "/readallnotification",title: { z: "全部標記已讀",e: "Mark all as read" },
				desc: { z: "把登入者所有未讀通知標記為已讀。",e: "Mark all of the signed-in user's unread notifications as read." },
				auth: AUTHTOKEN,params: [],
				response: dataok(),errors: [ETOKEN]
			},
			{
				id: "deletenotification",method: "DELETE",path: "/deletenotification/{notificationid}",title: { z: "刪除通知",e: "Delete notification" },
				desc: { z: "軟刪除單一通知。",e: "Soft-delete a single notification." },
				auth: AUTHTOKEN,params: [pathparam("notificationid","通知 id。","Notification id.",1)],
				response: dataok(),errors: [ETOKEN]
			}
		]
	},
	{
		key: "tool",
		title: { z: "撲克工具",e: "Poker Tools" },
		desc: { z: "勝率解算與攤牌贏家判定等開放運算端點。",e: "Open compute endpoints such as equity solving and showdown winner resolution." },
		endpoints: [
			{
				id: "equity",
				method: "POST",
				path: "/equity",
				title: { z: "勝率解算器",e: "Equity solver" },
				desc: { z: "輸入 2~15 手明確手牌、（可選的）公共牌與（可選的）燒牌/棄牌，回傳每一手的勝率、outs 與牌力狀態。支援德州撲克 (HE)、奧馬哈 (OM)、5 張奧馬哈 (O5)、短牌 (SD，36 張牌)。無需登入：Token 選填，未帶時走速率限制（同一 IP 每 60 秒最多 12 次，超限回 429），帶了有效 Token 則略過限流。",e: "Provide 2–15 known hands, an optional board and optional burn/muck (dead) cards to get each hand's equity, outs and status. Supports Hold'em (HE), Omaha (OM), 5-card Omaha (O5) and Short Deck (SD, 36 cards). No login required: the token is optional — without one the call is rate limited (at most 12 per IP per 60 seconds, returning 429 when exceeded); a valid token skips the rate limit." },
				auth: AUTHOPEN,
				params: [
					P("gametype","string",true,"<code>HE</code> 德州（每手 2 張）、<code>OM</code> 奧馬哈（每手 4 張）、<code>O5</code> 5 張奧馬哈（每手 5 張）、<code>SD</code> 短牌（每手 2 張、36 張牌、點數 6~A）。其餘值預設以 HE 處理。","<code>HE</code> Hold'em (2 cards each), <code>OM</code> Omaha (4 each), <code>O5</code> 5-card Omaha (5 each), <code>SD</code> Short Deck (2 each, 36-card deck, ranks 6~A). Other values default to HE.",{ ex: "HE" }),
					P("handlist","string[][]",true,"2~15 手，每手是牌字串陣列（HE/SD 2 張、OM 4 張、O5 5 張）。牌不可重複。亦相容舊欄位 <code>hands</code>。實際可解算手數仍受牌堆限制（手數 × 每手張數 + 公共牌 + 燒牌不得超過牌堆）。","2–15 hands, each an array of card strings (HE/SD 2, OM 4, O5 5). No duplicate cards. The legacy field <code>hands</code> is also accepted. The solvable hand count is still bounded by the deck (hands × cards-per-hand + board + dead must fit the deck).",{ ex: [["As","Ah"],["Ks","Kh"]] }),
					P("board","object",false,"公共牌物件，可空字串、可只填部分；合計最多 5 張。","The board object; values may be empty strings or partial; up to 5 cards total.",{ fields: [
						SUB("flop","string[]","翻牌 3 張，例如 [\"Qs\",\"Js\",\"2c\"]。","Flop, 3 cards, e.g. [\"Qs\",\"Js\",\"2c\"]."),
						SUB("turn","string","轉牌 1 張，可空字串。","Turn, 1 card, may be empty."),
						SUB("river","string","河牌 1 張，可空字串。","River, 1 card, may be empty.")
					],ex: { flop: ["Qs","Js","2c"],turn: "",river: "" } }),
					P("dead","string[]",false,"燒牌 / 棄牌（dead cards）牌字串陣列，可空。這些牌會從牌堆移除，不會出現在任何一手的 outs，也會計入勝率計算。不可與手牌或公共牌重複。亦相容欄位 <code>deadlist</code>。","Burn / muck (dead) cards, an array of card strings, may be empty. These are removed from the deck, never appear in any hand's outs, and are accounted for in equity. Must not duplicate hand or board cards. The field <code>deadlist</code> is also accepted.",{ ex: ["5s","Jd"] })
				],
				notes: [
					{ title: { z: "牌字串格式",e: "Card-string format" },body: { z: "點數 <span class=\"font-mono text-emerald-300\">A K Q J T 9 8 7 6 5 4 3 2</span>（10 用 T）＋花色 <span class=\"font-mono text-emerald-300\">s h d c</span>，例如 As、Td、9h。短牌 (SD) 僅接受點數 6~A。",e: "Rank <span class=\"font-mono text-emerald-300\">A K Q J T 9 8 7 6 5 4 3 2</span> (10 is T) + suit <span class=\"font-mono text-emerald-300\">s h d c</span>, e.g. As, Td, 9h. Short Deck (SD) only accepts ranks 6~A." } },
					{ title: { z: "短牌 (SD) 牌力",e: "Short Deck (SD) ranking" },body: { z: "36 張牌（移除 2~5）。僅同花 &gt; 葫蘆有別於標準，其餘照標準（順子仍 &gt; 三條）；最小順子為 A-6-7-8-9。",e: "36-card deck (2~5 removed). Only flush &gt; full house differs from standard; otherwise standard (straight still &gt; trips); the lowest straight is A-6-7-8-9." } },
					{ title: { z: "燒牌 / 棄牌（dead）",e: "Burn / muck (dead)" },body: { z: "<code>dead</code> 內的牌會在計算前從牌堆移除：因此不會被當成任一手的 out（例如燒掉 <span class=\"font-mono text-emerald-300\">5s</span>，則所有手的 outs/chopoutlist 都不會出現 5s），剩餘牌的抽樣與精算也會排除它們，等同於把那幾張牌「拿出牌堆」。",e: "Cards in <code>dead</code> are removed from the deck before computing: they never count as an out for any hand (e.g. burning <span class=\"font-mono text-emerald-300\">5s</span> means 5s appears in no hand's outs/chopoutlist), and remaining-card sampling/enumeration excludes them — effectively pulling those cards out of the deck." } }
				],
				response: [
					R("data.results / data.resultlist","object[]","兩者內容相同，可擇一使用；每一手一個物件。","Identical content, use either; one object per hand.",[
						SUB("index","int","對應 request handlist 的索引（0 起算）。","Index into the request handlist (0-based)."),
						SUB("gametype","string","本次計算的遊戲類型。","The game type used."),
						SUB("win","float","獲勝勝率（0~100，兩位小數）。","Win equity (0–100, two decimals)."),
						SUB("tie","float","平手勝率（0~100）。敗率 = 100 − win − tie。","Tie equity (0–100). Lose = 100 − win − tie."),
						SUB("outs / outlist","string[]","使該手成為「唯一最佳」的下一張牌。","Next cards that make this hand the sole best."),
						SUB("chopoutlist","string[]","使該手變成「並列最佳（打平）」的下一張牌。","Next cards that make this hand tie for best."),
						SUB("bested","bool","目前公共牌下是否為（並列）最佳高牌。","Whether it is the (tied) best high hand on the current board."),
						SUB("bestcardlist","string[]","目前最佳 5 張牌組合（公共牌 ≥3 張才有）。","The current best 5-card combo (only with board ≥3)."),
						SUB("status","string","牌力狀態，見下方。","Hand status, see below.")
					],6)
				],
				statuslist: [
					{ name: "need_flop",desc: { z: "尚未發翻牌（公共牌少於 3 張）且無法判斷 out。",e: "Flop not dealt yet (board < 3) and outs cannot be determined." } },
					{ name: "ahead",desc: { z: "目前公共牌下已是唯一最佳手。",e: "Currently the sole best hand on the board." } },
					{ name: "win",desc: { z: "已鎖定獨贏（勝率 100%、無平手）。",e: "Locked to win (100% win, no tie)." } },
					{ name: "tie_only",desc: { z: "已確定只能平分（平手 100%）。",e: "Can only chop (100% tie)." } },
					{ name: "out",desc: { z: "落後但有單張 out 可超前（見 outs/outlist）。",e: "Behind but has single-card outs to take the lead (see outs/outlist)." } },
					{ name: "chop_out",desc: { z: "無超前 out，但有單張可打平（見 chopoutlist）。",e: "No outs to take the lead, but single cards can chop (see chopoutlist)." } },
					{ name: "runner_runner",desc: { z: "翻牌圈無單張 out，但有連續兩張（後門）可超前。",e: "No single-card out on the flop, but a backdoor (two running cards) can take the lead." } },
					{ name: "drawing_dead",desc: { z: "無任何牌可超前（聽死牌）。",e: "No card can take the lead (drawing dead)." } }
				],
				errors: [
					ERR("401","ERROR_token_not_found / ERROR_token_error","有帶 <code>Authorization</code> 但 Token 無效；完全不帶 Token 不會有此錯誤（視為匿名，改走限流）。","Sent an <code>Authorization</code> header but the token is invalid; omitting the header entirely does not trigger this — the call is treated as anonymous and rate limited instead."),
					ERR("400","ERROR_request_data_not_found","request body 非合法 JSON。","Request body is not valid JSON."),
					ERR("400","ERROR_request_data_type_error","手數不在 2~15、張數不符、牌重複（含與燒牌/棄牌重複）或運算失敗。","Hand count outside 2–15, wrong card count, duplicate cards (including against dead cards), or computation failed."),
					ERR("429","ERROR_too_many_requests","匿名（未帶 Token）呼叫時，同一 IP 60 秒內超過 12 次。帶有效 Token 則不受此限。","More than 12 anonymous (token-less) calls from the same IP within 60 seconds; calls with a valid token are exempt.")
				],
				requestexample: 'POST /backendapi/equity\nAuthorization: Bearer <token>   (選填 optional：帶了可略過限流 / skips the rate limit)\nContent-Type: application/json\n\n{\n  "gametype": "HE",\n  "handlist": [["As","Ah"], ["Ks","Kh"]],\n  "board": { "flop": ["Qs","Js","2c"], "turn": "", "river": "" },\n  "dead": ["5s","Jd"]\n}',
				responseexample: '{\n  "success": true,\n  "data": {\n    "resultlist": [\n      {\n        "index": 0, "gametype": "HE",\n        "win": 91.2, "tie": 0.0,\n        "outs": [], "outlist": [], "chopoutlist": [],\n        "bested": true, "bestcardlist": ["As","Ah","Qs","Js","2c"],\n        "status": "ahead"\n      },\n      {\n        "index": 1, "gametype": "HE",\n        "win": 8.8, "tie": 0.0,\n        "outs": ["Ks","Kc","Kd","Th","Td"],\n        "chopoutlist": [], "bested": false,\n        "bestcardlist": ["Ks","Kh","Qs","Js","2c"],\n        "status": "out"\n      }\n    ],\n    "results": [ "...與 resultlist 相同..." ]\n  }\n}'
			},
			{
				id: "solvehandwinner",method: "POST",path: "/solvehandwinner",title: { z: "攤牌贏家判定",e: "Showdown winner" },
				desc: { z: "依公共牌與各座位攤牌的底牌，計算贏家座位。需至少 3 張公共牌。",e: "Compute the winning seat(s) from the board and each seat's shown hole cards. At least 3 board cards are required." },
				auth: AUTHTOKEN,
				params: [
					P("boardcard","object",true,"公共牌（≥3 張）。","The board (≥3 cards).",{ fields: [
						SUB("flop","string[]","翻牌 3 張，例如 [\"Ah\",\"Kd\",\"7s\"]。","Flop, 3 cards, e.g. [\"Ah\",\"Kd\",\"7s\"]."),
						SUB("turn","string","轉牌 1 張，可空字串。","Turn, 1 card, may be empty."),
						SUB("river","string","河牌 1 張，可空字串。","River, 1 card, may be empty.")
					],ex: { flop: ["Ah","Kd","7s"],turn: "2c",river: "9h" } }),
					P("handcard","object",false,"自家底牌。","Own hole cards.",{ fields: [
						SUB("card1","string","第一張牌，例如 As。","First card, e.g. As."),
						SUB("card2","string","第二張牌，例如 Kc。","Second card, e.g. Kc.")
					],ex: { card1: "As",card2: "Kc" } }),
					P("selfseating","int",false,"自家座位號。","Own seat number.",{ ex: 5 }),
					P("showdowndata","object",false,"各座位攤牌資料；以座位號為鍵（shown 為 true 才計入）。","Per-seat showdown data, keyed by seat number (only counted when shown is true).",{ fields: [
						R("<座位號>","object","以座位號為鍵的攤牌物件。","Showdown object keyed by seat number.",[SUB("card1","string","第一張牌。","First card."),SUB("card2","string","第二張牌。","Second card."),SUB("shown","bool","是否亮牌（true 才計入）。","Whether shown (only counted when true).")])
					],ex: { "1": { card1: "Qh",card2: "Qc",shown: true },"3": { card1: "Ad",card2: "Kh",shown: true } } })
				],
				response: [
					R("data.winners","int[]","贏家座位號陣列（可能多人平分）。","Winning seat numbers (multiple seats may chop).",null),
					R("data.results","object[]","各座位的牌力分數與底牌。","Per-seat hand score and hole cards.",[
						SUB("seatno","int","座位號。","Seat number."),
						SUB("score","int","牌力分數（越大越強）。","Hand score (higher is stronger)."),
						SUB("handname","string","牌型名稱，例如 Two Pair。","Hand name, e.g. Two Pair."),
						SUB("cards","string[]","用於比牌的底牌。","Hole cards used for comparison.")
					])
				],
				errors: [ETOKEN,ERR("400","ERROR_request_data_not_found / ERROR_request_data_type_error","資料缺失或運算失敗。","Data missing or computation failed.")]
			},
			{
				id: "solveflop",method: "POST",path: "/solveflop",title: { z: "翻牌 GTO 解算器",e: "Flop GTO solver" },
				desc: { z: "輸入翻牌（3 張公共牌）與雙方範圍，以 CFR 近似計算 OOP／IP 的 GTO 策略與 EV。為控制運算量，雙方各最多 400 個 combo、下注尺寸最多 3 檔、迭代次數夾在 100~1500。無需登入，但與 /solvenextstreet 共用速率限制：同一 IP 每 60 秒最多 6 次求解，超限回 429。",e: "Provide a flop (3 board cards) and both ranges to approximate GTO strategies and EV for OOP/IP via CFR. To bound compute, each side is capped at 400 combos, bet sizes at 3 tiers, and iterations clamped to 100–1500. No login required, but rate limited (shared with /solvenextstreet): at most 6 solves per IP per 60 seconds, returning 429 when exceeded." },
				auth: AUTHOPEN,
				params: [
					P("board","string[]",true,"翻牌 3 張，不可重複，例如 [\"As\",\"Kd\",\"7c\"]。","Flop, 3 distinct cards, e.g. [\"As\",\"Kd\",\"7c\"].",{ ex: ["As","Kd","7c"] }),
					P("ooprange","string",true,"OOP（先行動方）範圍字串，例如 \"AA-QQ,AKs\"。","OOP (out-of-position) range string, e.g. \"AA-QQ,AKs\".",{ ex: "AA-QQ,AKs,AQs" }),
					P("iprange","string",true,"IP（後行動方）範圍字串。","IP (in-position) range string.",{ ex: "JJ-99,AJs,KQs" }),
					P("pot","number",false,"底池大小，預設 10。","Pot size, default 10.",{ ex: 10 }),
					P("stack","number",false,"有效計分牌，預設為 pot×10（SPR 10）。","Effective stack, default pot×10 (SPR 10).",{ ex: 100 }),
					P("betsizes","number[]",false,"下注尺寸（佔底池比例），最多 3 檔；相容舊欄位 betsize。預設 [0.66]。","Bet sizes as pot fractions, up to 3 tiers; the legacy field betsize is accepted. Default [0.66].",{ ex: [0.33,0.66,1] }),
					P("raise","bool",false,"是否允許一次加注，預設 true。","Whether one raise is allowed, default true.",{ ex: true }),
					P("raisemult","number",false,"加注倍數，預設 3.0。","Raise multiplier, default 3.0.",{ ex: 3 }),
					P("iters","int",false,"CFR 迭代次數，夾在 100~1500，預設 600。","CFR iterations, clamped to 100–1500, default 600.",{ ex: 600 })
				],
				response: [
					R("data.board","string[]","回傳實際使用的翻牌。","The flop actually used.",null),
					R("data.pot / stack","number","底池與有效計分牌。","Pot and effective stack.",null),
					R("data.betsizes","number[]","實際採用的下注尺寸檔位。","The bet-size tiers actually used.",null),
					R("data.raise","bool","是否允許加注。","Whether raising is allowed.",null),
					R("data.iters","int","實際迭代次數。","Iterations actually run.",null),
					R("data.oopcombos / ipcombos","int","雙方範圍展開後的 combo 數。","Combo counts after expanding each range.",null),
					R("data.evoop / evip","number","OOP／IP 的期望值（以底池為單位）。","Expected value for OOP/IP (in pot units).",null),
					R("data.nodes","object","各決策節點的策略；以節點名稱為鍵。","Per-node strategies, keyed by node name.",[
						SUB("player","string","行動方：OOP / IP。","Acting player: OOP / IP."),
						SUB("actions","string[]","該節點可用動作。","Available actions at the node."),
						SUB("cells","object","各起手組合的動作頻率彙整。","Aggregated action frequencies per starting combo."),
						SUB("ev","object","各起手組合的動作 EV 彙整。","Aggregated action EV per starting combo.")
					])
				],
				errors: [ERR("400","ERROR_request_data_not_found","request body 非合法 JSON。","Request body is not valid JSON."),ERR("400","ERROR_request_data_type_error","翻牌張數／牌面不合法，或範圍為空、超過 400 combo、下注尺寸不合法等。","Invalid flop cards, an empty range, over 400 combos, or invalid bet sizes, etc."),ERR("429","ERROR_too_many_requests","同一 IP 60 秒內超過 6 次求解（與 /solvenextstreet 共用額度）。","More than 6 solves from the same IP within 60 seconds (quota shared with /solvenextstreet).")]
			},
			{
				id: "solvenextstreet",method: "POST",path: "/solvenextstreet",title: { z: "轉牌／河牌現場求解",e: "Turn/river live solve" },
				desc: { z: "承接前一街（3 或 4 張公共牌）的路徑走法，以到達機率為起點，針對使用者實際點出的下一張牌現場重新求解一次（不會把所有可能的下一張牌都算完）。無需登入，但與 /solveflop 共用速率限制：同一 IP 每 60 秒最多 6 次求解，超限回 429。",e: "Continues from the previous street's action path (3 or 4 board cards), using the reach probabilities as a starting point to re-solve live for the specific next card the user picked (does not exhaustively solve every possible next card). No login required, but rate limited (shared with /solveflop): at most 6 solves per IP per 60 seconds, returning 429 when exceeded." },
				auth: AUTHOPEN,
				params: [
					P("board","string[]",true,"前一街的公共牌，3（翻牌）或 4（轉牌）張，不可重複。","The previous street's board, 3 (flop) or 4 (turn) distinct cards.",{ ex: ["As","Kd","7c"] }),
					P("newcard","string",true,"使用者點出的下一張牌，不可與 board 重複。","The next card the user picked; must not duplicate board.",{ ex: "2h" }),
					P("ooprange","string",true,"OOP（先行動方）範圍字串。","OOP (out-of-position) range string.",{ ex: "AA-QQ,AKs,AQs" }),
					P("iprange","string",true,"IP（後行動方）範圍字串。","IP (in-position) range string.",{ ex: "JJ-99,AJs,KQs" }),
					P("path","string[]",true,"前一街走到終局的動作路徑（例如 [\"check\",\"bet66\",\"call\"]），用來還原到達機率。","The action path to the previous street's terminal node (e.g. [\"check\",\"bet66\",\"call\"]), used to recover reach probabilities.",{ ex: ["check","bet66","call"] }),
					P("pot","number",false,"前一街開局底池，預設 10。","Pot at the start of the previous street, default 10.",{ ex: 10 }),
					P("stack","number",false,"有效計分牌，預設為 pot×10（SPR 10）。","Effective stack, default pot×10 (SPR 10).",{ ex: 100 }),
					P("betsizes","number[]",false,"下注尺寸（佔底池比例），最多 3 檔；相容舊欄位 betsize。預設 [0.66]。","Bet sizes as pot fractions, up to 3 tiers; the legacy field betsize is accepted. Default [0.66].",{ ex: [0.33,0.66,1] }),
					P("raise","bool",false,"是否允許一次加注，預設 true。","Whether one raise is allowed, default true.",{ ex: true }),
					P("raisemult","number",false,"加注倍數，預設 3.0。","Raise multiplier, default 3.0.",{ ex: 3 }),
					P("iters","int",false,"CFR 迭代次數，夾在 100~1500，預設 600。","CFR iterations, clamped to 100–1500, default 600.",{ ex: 600 }),
					P("shortdeck","bool",false,"是否為短牌（36 張牌）模式。","Whether short-deck (36-card) mode is used.",{ ex: false })
				],
				response: [
					R("data.board","string[]","加上 newcard 後的新公共牌。","The new board after adding newcard.",null),
					R("data.pot / stack","number","新一街的底池與有效計分牌。","Pot and effective stack for the new street.",null),
					R("data.betsizes","number[]","實際採用的下注尺寸檔位。","The bet-size tiers actually used.",null),
					R("data.raise","bool","是否允許加注。","Whether raising is allowed.",null),
					R("data.iters","int","實際迭代次數。","Iterations actually run.",null),
					R("data.oopcombos / ipcombos","int","雙方範圍展開後的 combo 數（已排除與新公共牌衝突者）。","Combo counts after expanding each range (cards conflicting with the new board removed).",null),
					R("data.evoop / evip","number","OOP／IP 的期望值（以底池為單位）。","Expected value for OOP/IP (in pot units).",null),
					R("data.ooprange / iprange","string","原始範圍字串（供下一次呼叫延續）。","The original range strings (for chaining into the next call).",null),
					R("data.nodes","object","各決策節點的策略；以節點名稱為鍵。","Per-node strategies, keyed by node name.",[
						SUB("player","string","行動方：OOP / IP。","Acting player: OOP / IP."),
						SUB("actions","string[]","該節點可用動作。","Available actions at the node."),
						SUB("cells","object","各起手組合的動作頻率彙整。","Aggregated action frequencies per starting combo."),
						SUB("ev","object","各起手組合的動作 EV 彙整。","Aggregated action EV per starting combo.")
					])
				],
				errors: [ERR("400","ERROR_request_data_not_found","request body 非合法 JSON。","Request body is not valid JSON."),ERR("400","ERROR_request_data_type_error","公共牌／新牌不合法、路徑無法還原到達機率、範圍為空或超過 400 combo 等。","Invalid board/new card, the path fails to recover reach probabilities, an empty range, or over 400 combos, etc."),ERR("429","ERROR_too_many_requests","同一 IP 60 秒內超過 6 次求解（與 /solveflop 共用額度）。","More than 6 solves from the same IP within 60 seconds (quota shared with /solveflop).")]
			}
		]
	},
	{
		key: "system",
		title: { z: "系統文件（Swagger）",e: "System Docs (Swagger)" },
		desc: { z: "自動產生的 OpenAPI 文件端點，僅在後端 DEBUG 模式提供，正式環境一律回 404。",e: "Auto-generated OpenAPI documentation endpoints, only served when the backend runs in DEBUG mode; production always returns 404." },
		endpoints: [
			{
				id: "swaggerui",method: "GET",path: "/swagger/",title: { z: "Swagger UI",e: "Swagger UI" },
				desc: { z: "以 Swagger UI 呈現由 Django URL 樣式自動產生的 API 文件頁（回傳 HTML，非 success/data JSON 包裝）。僅 DEBUG 模式提供，正式環境回 404。",e: "Renders the API docs auto-generated from Django URL patterns in Swagger UI (returns HTML, not the success/data JSON envelope). DEBUG mode only; production returns 404." },
				auth: AUTHOPEN,params: [],
				errors: [ERR("404","（HTML 404）","非 DEBUG 模式一律回 404。","Always 404 outside DEBUG mode.")]
			},
			{
				id: "openapijson",method: "GET",path: "/swagger.json",title: { z: "OpenAPI JSON",e: "OpenAPI JSON" },
				desc: { z: "回傳由全部路由自動產生的 OpenAPI 3.0 規格 JSON（非 success/data 包裝）。僅 DEBUG 模式提供，正式環境回 404。",e: "Returns the OpenAPI 3.0 spec JSON auto-generated from all routes (not wrapped in success/data). DEBUG mode only; production returns 404." },
				auth: AUTHOPEN,params: [],
				errors: [ERR("404","（HTML 404）","非 DEBUG 模式一律回 404。","Always 404 outside DEBUG mode.")]
			}
		]
	}
]

function methodbadgeclass(method){
	if(method=="GET"){
		return "bg-sky-600"
	}
	if(method=="DELETE"){
		return "bg-red-600"
	}
	if(method=="PUT"){
		return "bg-amber-600"
	}
	return "bg-emerald-600"
}

// ===== 範例輸入／輸出自動產生 =====
function samplefortype(type){
	type=String(type||"")
	if(type=="int"){
		return 123
	}
	if(type=="float"){
		return 12.5
	}
	if(type=="bool"){
		return true
	}
	if(type=="int[]"){
		return [1,2,3]
	}
	if(type=="string[]"){
		return ["..."]
	}
	if(type=="string[][]"){
		return [["..."]]
	}
	if(type=="object"){
		return {}
	}
	if(type=="object[]"){
		return [{}]
	}
	if(type=="array"){
		return []
	}
	if(type=="mixed"){
		return "..."
	}
	return "string"
}

function firstname(name){
	return String(name).split(" / ")[0].split(" ")[0].trim()
}

function sampleforfield(row){
	if(row["ex"]!=undefined){
		return row["ex"]
	}
	if(row["fields"]&&row["fields"].length){
		let obj={}
		for(let i=0;i<row["fields"].length;i=i+1){
			let f=row["fields"][i]
			obj[firstname(f["name"])]=sampleforfield(f)
		}
		if(String(row["type"]).indexOf("[]")>=0){
			return [obj]
		}
		return obj
	}
	return samplefortype(row["type"])
}

function setnested(root,dotted,value){
	let parts=dotted.split(".")
	let node=root
	for(let i=0;i<parts.length;i=i+1){
		let key=firstname(parts[i])
		if(i==parts.length-1){
			node[key]=value
		}else{
			if(node[key]==null||typeof node[key]!="object"){
				node[key]={}
			}
			node=node[key]
		}
	}
}

function buildrequestexample(endpoint){
	if(endpoint["requestexample"]){
		return endpoint["requestexample"]
	}
	let params=endpoint["params"]||[]
	let path=endpoint["path"]
	for(let i=0;i<params.length;i=i+1){
		if(params[i]["loc"]=="path"){
			let val=params[i]["ex"]!=(function(){if(undefined){return params[i]["ex"]}return "123"})()
			path=path.replace("{"+params[i]["name"]+"}",val)
		}
	}
	let qparts=[]
	for(let i=0;i<params.length;i=i+1){
		if(params[i]["loc"]=="query"&&qparts.length<3){
			qparts.push(firstname(params[i]["name"])+"="+encodeURIComponent(samplefortype(params[i]["type"])))
		}
	}
	let query=(function(){if(qparts.length){return ("?"+qparts.join("&"))}return ""})()
	let lines=[endpoint["method"]+" /backendapi"+path+query]
	let body={}
	let hasbody=false
	for(let i=0;i<params.length;i=i+1){
		if(params[i]["loc"]=="body"){
			let nm=firstname(params[i]["name"])
			if(nm.indexOf("（")>=0||nm.indexOf("(")>=0){
				continue
			}
			hasbody=true
			body[nm]=sampleforfield(params[i])
		}
	}
	if(endpoint["auth"]!=AUTHOPEN&&endpoint["auth"]!=AUTHPATHTOKEN){
		lines.push("Authorization: Bearer <token>")
	}
	if(hasbody){
		lines.push("Content-Type: application/json")
	}
	let head=lines.join("\n")
	if(hasbody){
		return head+"\n\n"+JSON.stringify(body,null,2)
	}
	return head
}

// ===== Response 以「帶說明的 JSON 結構」呈現 =====
function striphtml(value){
	return String(value==null?"":value).replace(/<[^>]*>/g,"").trim()
}

// 去除 HTML 與結尾句號，作為括號內說明。
function cleandesc(row){
	return striphtml(tx(row["desc"])).replace(/[。.．]+\s*$/,"")
}

// 葉節點 → "type(說明)"；以特殊包裝物件標記，避免與巢狀物件混淆。
function annotleaf(row){
	let d=cleandesc(row)
	let leaf=String(row["type"])
	if(d){
		leaf=String(row["type"])+"("+d+")"
	}
	return { __leaf: leaf }
}

function annotobject(fields){
	let obj={}
	for(let i=0;i<fields.length;i=i+1){
		let f=fields[i]
		let names=String(f["name"]).split(" / ")
		let value=annotvalue(f)
		obj[firstname(names[0])]=value
		for(let k=1;k<names.length;k=k+1){
			obj[names[k].trim()]=value
		}
	}
	return obj
}

function annotvalue(row){
	if(row["fields"]&&row["fields"].length){
		let obj=annotobject(row["fields"])
		if(String(row["type"]).indexOf("[]")>=0){
			return { __arr: obj,desc: cleandesc(row),max: (row["max"]!=(function(){if(null){return row["max"]}return null})()) }
		}
		return obj
	}
	return annotleaf(row)
}

function annotsetnested(root,dotted,value){
	let parts=dotted.split(".")
	let node=root
	for(let i=0;i<parts.length;i=i+1){
		let key=parts[i].trim()
		if(i==parts.length-1){
			node[key]=value
		}else{
			if(node[key]==null||typeof node[key]!="object"||node[key]["__leaf"]){
				node[key]={}
			}
			node=node[key]
		}
	}
}

// 自訂序列化：葉節點輸出原始 type(說明)（不加引號），其餘比照 JSON。
function annotstringify(value,indent){
	let pad=""
	let pad2=""
	for(let i=0;i<indent;i=i+1){ pad=pad+"    " }
	for(let i=0;i<indent+1;i=i+1){ pad2=pad2+"    " }
	if(value==true){ return "true" }
	if(value==false){ return "false" }
	if(value&&typeof value=="object"&&value["__leaf"]!=undefined){
		return value["__leaf"]
	}
	if(value&&typeof value=="object"&&value["__arr"]!=undefined){
		let el=annotstringify(value["__arr"],indent+1)
		let cont=(function(){if((value["max"]!=null)){return ("...<"+value["max"])}return "...inf"})()
		let out="[\n"+pad2+el+",\n"+pad2+cont+"\n"+pad+"]"
		if(value["desc"]){
			out=out+"("+value["desc"]+")"
		}
		return out
	}
	if(Array.isArray(value)){
		if(value.length==0){ return "[]" }
		let items=[]
		for(let i=0;i<value.length;i=i+1){
			items.push(pad2+annotstringify(value[i],indent+1))
		}
		return "[\n"+items.join(",\n")+"\n"+pad+"]"
	}
	let keys=Object.keys(value)
	if(keys.length==0){ return "{}" }
	let lines=[]
	for(let i=0;i<keys.length;i=i+1){
		lines.push(pad2+"\""+keys[i]+"\": "+annotstringify(value[keys[i]],indent+1))
	}
	return "{\n"+lines.join(",\n")+"\n"+pad+"}"
}

function buildannotatedresponse(endpoint){
	let rows=endpoint["response"]||[]
	let root={ success: true }
	let hasdata=false
	for(let i=0;i<rows.length;i=i+1){
		let names=String(rows[i]["name"]).split(" / ")
		let first=names[0].trim()
		if(first.indexOf("[]")==0){
			continue
		}
		if(first.indexOf("data")!=0){
			continue
		}
		hasdata=true
		let value=annotvalue(rows[i])
		annotsetnested(root,first,value)
		let parent=first.split(".").slice(0,-1).join(".")
		for(let k=1;k<names.length;k=k+1){
			let alias=names[k].trim()
			if(alias.indexOf(".")>=0){
				annotsetnested(root,alias,value)
			}else{
				annotsetnested(root,((function(){if(parent){return parent+"."}return ""})())+alias,value)
			}
		}
	}
	if(!hasdata){
		root["data"]=annotleaf({ type: "string",desc: { z: "成功時為空字串。",e: "Empty string on success." } })
	}
	return annotstringify(root,0)
}

function fieldrowshtml(rows,kind){
	let html=""
	for(let i=0;i<rows.length;i=i+1){
		let row=rows[i]
		let sub=""
		if(row["fields"]&&row["fields"].length){
			sub=`<div class="apifield-sub">`+fieldrowshtml(row["fields"],"sub")+`</div>`
		}
		if(kind=="param"){
			let reqclass="opt"
			let reqtext=apidoctext("optional")
			if(row["req"]){
				reqclass="req"
				reqtext=apidoctext("required")
			}
			html=html+`
				<div class="apifield">
					<div class="apifield-top">
						<code class="apifield-name">${safehtml(row["name"])}</code>
						<span class="apifield-type">${safehtml(row["type"])}</span>
						<span class="apifield-req ${reqclass}">${reqtext}</span>
					</div>
					<div class="apifield-desc">${tx(row["desc"])}</div>
					${sub}
				</div>
			`
		}else if(kind=="response"||kind=="sub"){
			html=html+`
				<div class="apifield">
					<div class="apifield-top">
						<code class="apifield-name">${safehtml(row["name"])}</code>
						<span class="apifield-type">${safehtml(row["type"])}</span>
					</div>
					<div class="apifield-desc">${tx(row["desc"])}</div>
					${sub}
				</div>
			`
		}else if(kind=="status"){
			html=html+`
				<div class="apifield">
					<div class="apifield-top"><code class="apifield-name">${safehtml(row["name"])}</code></div>
					<div class="apifield-desc">${tx(row["desc"])}</div>
				</div>
			`
		}else if(kind=="error"){
			html=html+`
				<div class="apifield">
					<div class="apifield-top">
						<span class="apifield-type">${safehtml(row["code"])}</span>
						<code class="apifield-name">${safehtml(row["data"])}</code>
					</div>
					<div class="apifield-desc">${tx(row["desc"])}</div>
				</div>
			`
		}
	}
	return html
}

function noteshtml(notes){
	let html=""
	for(let i=0;i<notes.length;i=i+1){
		html=html+`
			<div class="apinote">
				<div class="apinote-title">${tx(notes[i]["title"])}</div>
				<div class="apinote-body">${tx(notes[i]["body"])}</div>
			</div>
		`
	}
	return html
}

// 將參數依位置（路徑／Query／Request body）分組，各組加上標題。
function paramgroupshtml(params){
	let pathp=[]
	let queryp=[]
	let bodyp=[]
	for(let i=0;i<params.length;i=i+1){
		let loc=params[i]["loc"]
		if(loc=="path"){
			pathp.push(params[i])
		}else if(loc=="query"){
			queryp.push(params[i])
		}else{
			bodyp.push(params[i])
		}
	}
	let html=""
	if(pathp.length){
		html=html+`<div class="apiparam-group">${apidoctext("pathparams")}</div>`+fieldrowshtml(pathp,"param")
	}
	if(queryp.length){
		html=html+`<div class="apiparam-group">${apidoctext("queryparams")}</div>`+fieldrowshtml(queryp,"param")
	}
	if(bodyp.length){
		html=html+`<div class="apiparam-group">${apidoctext("requestbody")}</div>`+fieldrowshtml(bodyp,"param")
	}
	return html
}

function endpointhtml(endpoint){
	let sections=""
	sections=sections+`<p class="apiep-desc">${tx(endpoint["desc"])}</p>`
	if(endpoint["auth"]){
		sections=sections+`<div class="apiep-auth">${tx(endpoint["auth"])}</div>`
	}
	if(endpoint["params"]&&endpoint["params"].length){
		sections=sections+`<div class="apisection-title">${apidoctext("request")}</div>`+paramgroupshtml(endpoint["params"])
	}
	if(endpoint["notes"]&&endpoint["notes"].length){
		sections=sections+`<div class="apinotes">${noteshtml(endpoint["notes"])}</div>`
	}
	if(endpoint["response"]&&endpoint["response"].length){
		sections=sections+`<div class="apisection-title">${apidoctext("response")}</div>`+`<pre class="apicode">${safehtml(buildannotatedresponse(endpoint))}</pre>`
	}
	if(endpoint["statuslist"]&&endpoint["statuslist"].length){
		sections=sections+`<div class="apisection-title">status</div>`+fieldrowshtml(endpoint["statuslist"],"status")
	}
	if(endpoint["errors"]&&endpoint["errors"].length){
		sections=sections+`<div class="apisection-title">${apidoctext("errors")}</div>`+fieldrowshtml(endpoint["errors"],"error")
	}
	sections=sections+`<div class="apisection-title">${apidoctext("example")}</div>`
	sections=sections+`<div class="apicode-label">${apidoctext("requestlabel")}</div><pre class="apicode">${safehtml(buildrequestexample(endpoint))}</pre>`
	if(endpoint["responseexample"]){
		sections=sections+`<div class="apicode-label">${apidoctext("responselabel")}</div><pre class="apicode">${safehtml(endpoint["responseexample"])}</pre>`
	}
	let searchkey=(endpoint["method"]+" "+endpoint["path"]+" "+tx(endpoint["title"])).toLowerCase()
	return `
		<div class="apiep" data-endpoint="${safehtml(endpoint["id"])}" data-search="${safehtml(searchkey)}">
			<div role="button" tabindex="0" class="apiep-head">
				<span class="apiep-method ${methodbadgeclass(endpoint["method"])}">${endpoint["method"]}</span>
				<span class="apiep-path">${safehtml(endpoint["path"])}</span>
				<span class="apiep-titletext">${safehtml(tx(endpoint["title"]))}</span>
				<span class="apiep-chevron">▾</span>
			</div>
			<div class="apiep-body">${sections}</div>
		</div>
	`
}

function categoryhtml(category){
	let inner=""
	for(let i=0;i<category["endpoints"].length;i=i+1){
		inner=inner+endpointhtml(category["endpoints"][i])
	}
	return `
		<section class="apicat collapsed" id="apicat-${category["key"]}" data-cat="${category["key"]}">
			<div role="button" tabindex="0" class="apicat-head">
				<h2 class="apicat-title">${safehtml(tx(category["title"]))}</h2>
				<span class="apicat-count">${category["endpoints"].length}</span>
				<span class="apicat-chevron">▾</span>
			</div>
			<p class="apicat-desc">${safehtml(tx(category["desc"]))}</p>
			<div class="apicat-list space-y-3">${inner}</div>
		</section>
	`
}

function navhtml(){
	let html=""
	for(let i=0;i<APICATEGORIES.length;i=i+1){
		let category=APICATEGORIES[i]
		html=html+`<a href="#apicat-${category["key"]}" class="apinav-link" data-navcat="${category["key"]}">
			<span class="apinav-text">${safehtml(tx(category["title"]))}</span>
			<span class="apinav-count">${category["endpoints"].length}</span>
		</a>`
	}
	return html
}

function renderapidoc(){
	let main=""
	for(let i=0;i<APICATEGORIES.length;i=i+1){
		main=main+categoryhtml(APICATEGORIES[i])
	}
	document.getElementById("apidoc").innerHTML=main
	document.getElementById("apidocnav").innerHTML=navhtml()
	bindendpointtoggles()
	bindcategorytoggles()
	bindnavlinks()
	updatecount()
}

// role="button" 的標題列同時綁 click 與 keydown，鍵盤 Enter / Space 也要能展開收合。
function toggleapiephead(event){
	let toggleed=true
	if(event.type=="keydown"){
		toggleed=(event.key=="Enter"||event.key==" ")
		if(toggleed){
			event.preventDefault()
		}
	}
	if(toggleed){
		this.parentElement.classList.toggle("open")
		saveapidocstate()
	}
}

function toggleapicathead(event){
	let toggleed=true
	if(event.type=="keydown"){
		toggleed=(event.key=="Enter"||event.key==" ")
		if(toggleed){
			event.preventDefault()
		}
	}
	if(toggleed){
		this.parentElement.classList.toggle("collapsed")
		saveapidocstate()
	}
}

function bindendpointtoggles(){
	let items=document.querySelectorAll(".apiep")
	for(let i=0;i<items.length;i=i+1){
		let head=items[i].querySelector(".apiep-head")
		head.addEventListener("click",toggleapiephead)
		head.addEventListener("keydown",toggleapiephead)
	}
}

function bindcategorytoggles(){
	let heads=document.querySelectorAll(".apicat-head")
	for(let i=0;i<heads.length;i=i+1){
		heads[i].addEventListener("click",toggleapicathead)
		heads[i].addEventListener("keydown",toggleapicathead)
	}
}

function bindnavlinks(){
	let links=document.querySelectorAll(".apinav-link")
	for(let i=0;i<links.length;i=i+1){
		links[i].addEventListener("click",function(event){
			event.preventDefault()
			let key=this.getAttribute("data-navcat")
			let target=document.getElementById("apicat-"+key)
			if(target){
				target.classList.remove("collapsed")
				target.scrollIntoView({ behavior: "smooth",block: "start" })
			}
		})
	}
}

function totalendpointcount(){
	let total=0
	for(let i=0;i<APICATEGORIES.length;i=i+1){
		total=total+APICATEGORIES[i]["endpoints"].length
	}
	return total
}

function updatecount(visible){
	let label=document.getElementById("apidoccount")
	if(!label){
		return
	}
	let total=totalendpointcount()
	if(visible==null||visible==total){
		label.textContent=total+" "+apidoctext("endpointsunit")
	}else{
		label.textContent=visible+" / "+total+" "+apidoctext("endpointsunit")
	}
}

function filterendpoints(keyword){
	keyword=(keyword||"").trim().toLowerCase()
	let visible=0
	let categories=document.querySelectorAll(".apicat")
	for(let i=0;i<categories.length;i=i+1){
		let cards=categories[i].querySelectorAll(".apiep")
		let shown=0
		for(let j=0;j<cards.length;j=j+1){
			let match=keyword==""||cards[j].getAttribute("data-search").indexOf(keyword)>=0
			cards[j].style.display=(function(){if(match){return ""}return "none"})()
			if(match){
				shown=shown+1
				visible=visible+1
			}
		}
		categories[i].style.display=(function(){if(shown>0){return ""}return "none"})()
		if(keyword!=""&&shown>0){
			categories[i].classList.remove("collapsed")
		}
	}
	let empty=document.getElementById("apidocempty")
	if(empty){
		empty.style.display=visible==0?"block":"none"
	}
	updatecount(visible)
}

function applyapidoclanguage(){
	document.title=apidoctext("title")+" - PokerTrace"
	innertext("#apidoctitle",apidoctext("title"),false)
	innertext("#apidocback",apidoctext("back"),false)
	innertext("#apidocoverviewtitle",apidoctext("overview"),false)
	innertext("#apidocoverviewdesc",apidoctext("overviewdesc"),false)
	innertext("#apidocendpointslabel",apidoctext("endpoints"),false)
	innertext("#apidocnavtitle",apidoctext("categories"),false)
	value("#apidocexpandall",apidoctext("expandall"))
	value("#apidoccollapseall",apidoctext("collapseall"))
	innertext("#apidocempty",apidoctext("noresults"),false)
	innertext("#apidocbaseurllabel",apidoctext("baseurl"),false)
	innertext("#apidocbaseurlnote",apidoctext("baseurlnote"),false)
	innertext("#apidocauthlabel",apidoctext("authlabel"),false)
	innertext("#apidocauthnote",apidoctext("authnote"),false)
	let search=document.getElementById("apidocsearch")
	if(search){
		search.setAttribute("placeholder",apidoctext("searchplaceholder"))
	}
	setbaseurl()
}

function setbaseurl(){
	let el=document.getElementById("apidocbaseurl")
	if(!el){
		return
	}
	let origin=""
	try{
		origin=window.location.origin
	}catch(e){
		origin=""
	}
	if(!origin||origin.indexOf("http")!=0){
		el.textContent="/backendapi/"
	}else{
		el.textContent=origin+"/backendapi/"
	}
}

onclick("#apidocexpandall",function(){
	let cats=document.querySelectorAll(".apicat")
	for(let i=0;i<cats.length;i=i+1){
		cats[i].classList.remove("collapsed")
	}
	let items=document.querySelectorAll(".apiep")
	for(let i=0;i<items.length;i=i+1){
		items[i].classList.add("open")
	}
	saveapidocstate()
})

onclick("#apidoccollapseall",function(){
	let cats=document.querySelectorAll(".apicat")
	for(let i=0;i<cats.length;i=i+1){
		cats[i].classList.add("collapsed")
	}
	let items=document.querySelectorAll(".apiep")
	for(let i=0;i<items.length;i=i+1){
		items[i].classList.remove("open")
	}
	saveapidocstate()
})

let searchinput=document.getElementById("apidocsearch")
if(searchinput){
	searchinput.addEventListener("input",function(){
		filterendpoints(this.value)
		saveapidocstate()
	})
}

// ===== 重整時保留捲動位置與展開狀態（存於 sessionStorage）=====
const APIDOCSTATEKEY="pokertrace-apidocstate"
let apidocsavetimer=null

function saveapidocstate(){
	try{
		let openCats=[]
		let cats=document.querySelectorAll(".apicat")
		for(let i=0;i<cats.length;i=i+1){
			if(!cats[i].classList.contains("collapsed")){
				openCats.push(cats[i].getAttribute("data-cat"))
			}
		}
		let openEps=[]
		let eps=document.querySelectorAll(".apiep.open")
		for(let i=0;i<eps.length;i=i+1){
			openEps.push(eps[i].getAttribute("data-endpoint"))
		}
		let search=""
		let s=document.getElementById("apidocsearch")
		if(s){
			search=s.value
		}
		let state={ scroll: currentscroll(),openCats: openCats,openEps: openEps,search: search }
		sessionStorage.setItem(APIDOCSTATEKEY,JSON.stringify(state))
	}catch(e){}
}

function currentscroll(){
	let se=document.scrollingElement||document.documentElement
	if(window.scrollY){
		return window.scrollY
	}
	if(window.pageYOffset){
		return window.pageYOffset
	}
	if(se&&se.scrollTop){
		return se.scrollTop
	}
	if(document.body.scrollTop){
		return document.body.scrollTop
	}
	return 0
}

function applyscroll(y){
	try{
		window.scrollTo(0,y)
	}catch(e){}
	let se=document.scrollingElement||document.documentElement
	if(se){
		se.scrollTop=y
	}
	if(document.body){
		document.body.scrollTop=y
	}
}

function scheduleapidocsave(){
	if(apidocsavetimer){
		clearTimeout(apidocsavetimer)
	}
	apidocsavetimer=setTimeout(saveapidocstate,150)
}

function restoreapidocstate(){
	let state=null
	try{
		let raw=sessionStorage.getItem(APIDOCSTATEKEY)
		if(raw){
			state=JSON.parse(raw)
		}
	}catch(e){
		state=null
	}
	if(!state){
		return
	}
	if(state["openCats"]){
		for(let i=0;i<state["openCats"].length;i=i+1){
			let el=document.getElementById("apicat-"+state["openCats"][i])
			if(el){
				el.classList.remove("collapsed")
			}
		}
	}
	if(state["openEps"]){
		// 不用字串拼 querySelector：值來自 sessionStorage，含引號會讓選擇器語法錯誤而中斷還原。
		let eps=document.querySelectorAll(".apiep")
		for(let i=0;i<eps.length;i=i+1){
			if(state["openEps"].indexOf(eps[i].getAttribute("data-endpoint"))>=0){
				eps[i].classList.add("open")
			}
		}
	}
	let s=document.getElementById("apidocsearch")
	if(s&&state["search"]){
		s.value=state["search"]
		filterendpoints(state["search"])
	}
	let y=state["scroll"]||0
	function restore(){
		applyscroll(y)
	}
	restore()
	setTimeout(restore,0)
	setTimeout(restore,150)
	setTimeout(restore,400)
	if(window.requestAnimationFrame){
		window.requestAnimationFrame(function(){
			window.requestAnimationFrame(restore)
		})
	}
}

try{
	if(window.history&&"scrollRestoration" in window.history){
		window.history.scrollRestoration="manual"
	}
}catch(e){}

window.addEventListener("scroll",scheduleapidocsave,{ passive: true })
window.addEventListener("beforeunload",saveapidocstate)

applyapidoclanguage()
renderapidoc()
restoreapidocstate()
