# import
import json
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

# 自創
from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *
from .authhelper import gettokenuser as commonauthuser
from .hand import sessionaccess,gettableandsession,intval

# 員工工時（打卡）與上桌排班。
#
# ## 為什麼不寫進 staff.py
#
# staff.py 的所有端點包在模組層的 try:（staff.py:100-427）裡、每個 def 縮排一層。
# 往裡面插東西容易改壞縮排，而且定義期一有例外就會讓**整組員工 API 靜默消失**，
# 只留一行 log。而且 staff.py 的語意是「聘用關係」，工時與排班是另一件事。
#
# ## 兩個必須遵守的實作規則
#
# **一、query() 吞掉例外回 None。**（function/sql.py:79）
# 撞到 partial unique index 時 queryinsert 會**靜靜回 None**，端點若不檢查就會回一個
# 看起來成功的 200，而資料根本沒進去。所以每一支寫入端點都要：
#   1. INSERT 前先 SELECT 判斷（才給得出正確的 409 錯誤碼）
#   2. INSERT 後**檢查回傳值**，None 就回 ERROR_database_error
# 兩件都要做：第 1 步給好訊息，第 2 步才是真的防護（並行時只有 DB 索引擋得住）。
#
# **二、時間相減一律交給 SQL。**
# DB 是 timestamptz，psycopg2 回的是 aware datetime；nowtime() 回的是 naive 字串。
# 在 Python 端混算會直接丟例外。所以「幾分鐘」一律用
# EXTRACT(EPOCH FROM (COALESCE("endtime",SQLNOW)-"starttime"))/60 由 SQL 算，
# Python 只負責把分鐘進位成計費分鐘與換算金額。
#
# **三、SQL 裡的「現在」一律用 SQLNOW，不可以寫 NOW()。**
# 全站慣例是把**本地牆上時間**存進 timestamptz，並由前端原樣顯示
# （initialize.js 的 ptformatdatetime 只切掉 "+00:00"，不做時區換算）。
# 寫入端 nowtime() 給的就是本地時間字串。
# SQL 的 NOW() 卻是真 UTC，兩者差一個時區（本機實測 8 小時）。
# 混用的後果不是報錯，是**安靜地算錯**：
#   * COALESCE("endtime",NOW())-"starttime" → 進行中的時數變成負的
#   * "endtime"<=NOW()                      → 補下班卡的「不能補未來」判反
# 已經在 hand.py（延遲播出要等 8 小時才出現）與 contact.py（速率限制視窗
# 變成 8 小時）踩過同一個坑，2026-08-06 一併修掉。
#
# SQLNOW 是**參數化**的，不是 SQL 函式：用到它的查詢必須在對應位置補一個
# nowtime() 參數。刻意不寫成 (NOW() AT TIME ZONE 'Asia/Taipei') 之類的
# SQL 表示式 —— 那會把時區名硬編在第二個地方，跟 nowtime() 讀的機器本地時區
# 分頭漂移。時鐘來源只留 nowtime() 一個。
#
# **四、日後做「這手牌發生時這桌是誰在顧」的回溯查詢，時間欄要用 `hand."createtime"`。**
# hand 那一句 INSERT（hand.py:2176）同時寫了兩個時鐘：
#   "handtime"   <- SQL NOW()   真 UTC
#   "createtime" <- nowtime()   本地（與本檔的 tablestaff."starttime" 同一把尺）
# 拿 handtime 去比 tablestaff."starttime" 會差一個時區，**對到錯的人或對不到人**，
# 而且不會有任何錯誤訊息。正確寫法：
#   WHERE ts."tableid"=%s AND ts."deletetime" IS NULL
#     AND ts."starttime"<=h."createtime"
#     AND (ts."endtime" IS NULL OR h."createtime"<ts."endtime")
SQLNOW="%s::timestamptz"

# 計費單位：不滿 30 分鐘算 30 分鐘（無條件進位）
BILLINGUNITMINUTE=30


def billingminuteof(actualminute):
	"""實際分鐘 → 計費分鐘。不滿一個單位算一個單位；0 分鐘就是 0。"""
	minute=int(actualminute or 0)
	if minute<=0:
		return 0
	unit=(minute+BILLINGUNITMINUTE-1)//BILLINGUNITMINUTE
	return unit*BILLINGUNITMINUTE


def amountof(billingminute,hourlyrate):
	"""計費分鐘 × 時薪 → 金額（四捨五入到整數元）。"""
	rate=hourlyrate
	if rate is None:
		rate=0
	return int(round(float(billingminute)/60.0*float(rate)))


def resolvehourlyrate(sessionid,staffuserid,ownerid):
	"""回傳 (時薪, 來源)。sessionstaff 覆寫優先於 userstaff 預設。

	兩張表的 hourlyrate 都是 nullable 且沒有 DEFAULT：NULL = 沒設定過，0 = 真的無給職。
	所以這裡判的是 IS NOT NULL，不是判真假值 —— 判真假值會把「設定為 0」當成沒設定。
	"""
	sessionrow=query(SETTING["dbname"],"""SELECT "hourlyrate" FROM "sessionstaff" WHERE "sessionid"=%s AND "staffuserid"=%s AND "status"='active' AND "hourlyrate" IS NOT NULL AND "deletetime" IS NULL LIMIT 1""",[sessionid,staffuserid],SETTING["dbsetting"])
	if sessionrow:
		return (sessionrow[0]["hourlyrate"],"sessionstaff")
	userrow=query(SETTING["dbname"],"""SELECT "hourlyrate" FROM "userstaff" WHERE "userid"=%s AND "staffuserid"=%s AND "status"='active' AND "hourlyrate" IS NOT NULL AND "deletetime" IS NULL LIMIT 1""",[ownerid,staffuserid],SETTING["dbsetting"])
	if userrow:
		return (userrow[0]["hourlyrate"],"userstaff")
	return (0,"none")


def activestaffrow(sessionid,ownerid,staffuserid):
	"""這個人是不是這場次的有效員工。是就回 {"role","source"}，不是回 None。

	優先序與 hand.py 的 sessionaccess 一致：sessionstaff 命中就不再查 userstaff。
	"""
	sessionrow=query(SETTING["dbname"],"""SELECT "role" FROM "sessionstaff" WHERE "sessionid"=%s AND "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL LIMIT 1""",[sessionid,staffuserid],SETTING["dbsetting"])
	if sessionrow:
		return {"role": sessionrow[0]["role"],"source": "sessionstaff"}
	userrow=query(SETTING["dbname"],"""SELECT "role" FROM "userstaff" WHERE "userid"=%s AND "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL LIMIT 1""",[ownerid,staffuserid],SETTING["dbsetting"])
	if userrow:
		return {"role": userrow[0]["role"],"source": "userstaff"}
	return None


def staffworkoperate(access,userrow,targetstaffuserid):
	"""回傳 (可不可以操作, 來源標記)。來源標記就是寫進 startsource / endsource 的值。

	這一支**不做任何 SQL** —— 它只是 sessionaccess 結果的純函式解讀，
	所以不會變成專案裡第六份各自為政的權限實作。

	裁判（floor）刻意落到最後一條：只能操作自己。牌桌管理是裁判的事，
	但工時牽涉金錢，使用者定案只有主辦與助理能動別人的。
	"""
	if access["isadmin"]:
		return (True,"admin")
	if access["isown"]:
		return (True,"owner")
	if access["accessrole"]=="assistant":
		return (True,"assistant")
	if access["isstaff"] and userrow["id"]==targetstaffuserid:
		return (True,"self")
	return (False,"")


def targetstaffuseridof(request,userrow):
	"""body 的 staffuserid，沒帶就是操作自己。"""
	try:
		data=json.loads(request.body or "{}")
	except Exception as error:
		data={}
	value=data.get("staffuserid")
	if value is None or value=="":
		return userrow["id"]
	return intval(value,0)


def sessionandaccessof(request,sessionid,userrow):
	"""共用前置：取場次 + 算權限。回傳 (sessionrow, access, errorresponse)。"""
	sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if not sessionrow:
		return (None,None,errorresponse("ERROR_session_not_found"))
	sessionrow=sessionrow[0]
	access=sessionaccess(sessionrow,userrow)
	return (sessionrow,access,None)


def shiftoperateaccess(callerrow,targetstaffuserid):
	"""誰可以操作這個人的班。回傳 (可不可以, 來源標記)。

	個人班**不綁場次**，所以沒有 sessionrow 可以餵給 sessionaccess。
	改用聘用關係判斷，四種人：

	  self       自己
	  admin      permission>=4
	  owner      目標的僱主（userstaff: userid=呼叫者, staffuserid=目標, active）
	  assistant  同一個僱主底下的助理（那個僱主同時聘了呼叫者當 assistant 與目標）

	裁判（floor）不在名單裡 —— 與場次層的 staffworkoperate 一致：
	牌桌調度是裁判的事，工時牽涉金錢只有主辦與助理能動別人的。
	"""
	if callerrow["id"]==targetstaffuserid:
		return (True,"self")
	if 4<=int(callerrow["permission"]):
		return (True,"admin")
	ownerrow=query(SETTING["dbname"],"""SELECT 1 FROM "userstaff" WHERE "userid"=%s AND "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL LIMIT 1""",[callerrow["id"],targetstaffuserid],SETTING["dbsetting"])
	if ownerrow:
		return (True,"owner")
	assistantrow=query(SETTING["dbname"],"""
		SELECT 1 FROM "userstaff" a
		JOIN "userstaff" b ON b."userid"=a."userid" AND b."staffuserid"=%s AND b."status"='active' AND b."deletetime" IS NULL
		WHERE a."staffuserid"=%s AND a."role"='assistant' AND a."status"='active' AND a."deletetime" IS NULL
		LIMIT 1
	""",[targetstaffuserid,callerrow["id"]],SETTING["dbsetting"])
	if assistantrow:
		return (True,"assistant")
	return (False,"")


def openshiftof(staffuserid):
	row=query(SETTING["dbname"],"""SELECT*FROM "staffworkshift" WHERE "staffuserid"=%s AND "endtime" IS NULL AND "deletetime" IS NULL LIMIT 1""",[staffuserid],SETTING["dbsetting"])
	if row:
		return row[0]
	return None


def opensegmentof(staffuserid):
	row=query(SETTING["dbname"],"""SELECT*FROM "staffworklog" WHERE "staffuserid"=%s AND "endtime" IS NULL AND "deletetime" IS NULL LIMIT 1""",[staffuserid],SETTING["dbsetting"])
	if row:
		return row[0]
	return None


def opentablestaffof(staffuserid):
	row=query(SETTING["dbname"],"""SELECT*FROM "tablestaff" WHERE "staffuserid"=%s AND "endtime" IS NULL AND "deletetime" IS NULL LIMIT 1""",[staffuserid],SETTING["dbsetting"])
	if row:
		return row[0]
	return None


def defaultownerof(staffuserid):
	"""沒有場次歸屬時，段的僱主與時薪從哪來。回傳 (ownerid, rate, ratesource)。

	**只有在這個人剛好只有一個有效僱主時才推定**。有兩個以上僱主時無從得知
	這段時間是替誰工作的，推錯比留白更糟 —— 留白至少在總覽頁上看得出來是未歸屬。
	"""
	rowlist=query(SETTING["dbname"],"""SELECT "userid","hourlyrate" FROM "userstaff" WHERE "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL""",[staffuserid],SETTING["dbsetting"])
	if not rowlist or len(rowlist)!=1:
		return (None,None,"none")
	if rowlist[0]["hourlyrate"] is None:
		return (rowlist[0]["userid"],None,"none")
	return (rowlist[0]["userid"],rowlist[0]["hourlyrate"],"userstaff")


def segmentinsertsql(shiftid,staffuserid,sessionrow,operatorid,source,role):
	"""組出一句「開新工作段」的 INSERT。sessionrow 為 None 就是未歸屬的段。

	場次歸屬決定時薪來源，所以這兩件事一定要一起決定，不能分開寫。
	"""
	if sessionrow:
		ownerid=sessionrow["userid"]
		hourlyrate,ratesource=resolvehourlyrate(sessionrow["id"],staffuserid,ownerid)
		sessionid=sessionrow["id"]
	else:
		sessionid=None
		ownerid,hourlyrate,ratesource=defaultownerof(staffuserid)
	return ["""INSERT INTO "staffworklog"("shiftid","sessionid","staffuserid","ownerid","role","starttime","hourlyrate","ratesource","startoperatorid","startsource","createtime","updatetime")VALUES(%s,%s,%s,%s,%s,"""+SQLNOW+""",%s,%s,%s,%s,"""+SQLNOW+""","""+SQLNOW+""")""",[shiftid,sessionid,staffuserid,ownerid,role or "",nowtime(),hourlyrate,ratesource,operatorid,source,nowtime(),nowtime()]]


def closesegmentsql(segmentid,operatorid,source,endtime=None):
	if endtime:
		return ["""UPDATE "staffworklog" SET "endtime"=%s,"endoperatorid"=%s,"endsource"=%s,"updatetime"="""+SQLNOW+""" WHERE "id"=%s""",[endtime,operatorid,source,nowtime(),segmentid]]
	return ["""UPDATE "staffworklog" SET "endtime"="""+SQLNOW+""","endoperatorid"=%s,"endsource"=%s,"updatetime"="""+SQLNOW+""" WHERE "id"=%s""",[nowtime(),operatorid,source,nowtime(),segmentid]]


def staffroleof(staffuserid):
	row=query(SETTING["dbname"],"""SELECT "role" FROM "userstaff" WHERE "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL LIMIT 1""",[staffuserid],SETTING["dbsetting"])
	if row:
		return row[0]["role"]
	return ""


def shifttargetof(request,callerrow):
	"""要操作誰的班。body 或 query 帶 staffuserid，沒帶就是自己。"""
	value=request.GET.get("staffuserid")
	if not value:
		try:
			data=json.loads(request.body or "{}")
		except Exception as error:
			data={}
		value=data.get("staffuserid")
	if value is None or value=="":
		return callerrow["id"]
	return intval(value,0)


@api_view(["POST"])
def startstaffshift(request):
	# 上班卡。開一個班 + 開第一段工作。**不綁場次** —— 場次歸屬等上桌時才帶入。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	targetid=shifttargetof(request,tokenuserrow)
	canoperate,source=shiftoperateaccess(tokenuserrow,targetid)
	if not canoperate:
		return errorresponse("ERROR_no_permission")

	# 先查是為了給得出 409 這個正確的錯誤碼；真正防並行的是 staffworkshiftopen 索引，
	# 撞到時下面的 queryinsert 會靜靜回 None，由後面那段接住。
	if openshiftof(targetid):
		return errorresponse("ERROR_staff_already_clockedin")

	# 時間欄一律用 nowtime()（本地牆上時間），與本檔 SQL 端的 SQLNOW 同一個時鐘。
	# 千萬**不要**改成不傳、讓 DB 的 DEFAULT now() 生效 —— 那是真 UTC，
	# 會跟同一個動作寫出來的工作段差一個時區（見檔頭第三條）。
	shiftid=queryinsert(SETTING["dbname"],"staffworkshift",{
		"staffuserid": targetid,
		"starttime": nowtime(),
		"startoperatorid": tokenuserrow["id"],
		"startsource": source,
		"createtime": nowtime(),
		"updatetime": nowtime()
	},SETTING["dbsetting"])
	if shiftid is None:
		return errorresponse("ERROR_database_error")

	# 上班當下若人已經被指派在某張桌上（例如先排班後打卡），第一段就直接帶那一場
	tablerow=opentablestaffof(targetid)
	sessionrow=None
	if tablerow:
		sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
		if sessionrow:
			sessionrow=sessionrow[0]
		else:
			sessionrow=None
	result=querytransaction(SETTING["dbname"],[segmentinsertsql(shiftid,targetid,sessionrow,tokenuserrow["id"],source,staffroleof(targetid))],SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")

	return Response({
		"success": True,
		"data": {
			"shiftid": shiftid,
			"staffuserid": targetid,
			"sessionid": sessionrow["id"] if sessionrow else None,
			"startsource": source
		}
	},status.HTTP_200_OK)


@api_view(["POST"])
def breakstaffshift(request):
	# 休息卡。關掉目前那一段工作，**班還開著**。
	# 「休息中」的定義就是「班開著但沒有未結束的段」—— 不另外開 status 欄，兩份真相會漂移。
	#
	# 刻意**不動上桌指派**：休息時桌子還是掛在這個人名下（現場是別人暫代），
	# 回來就能直接接回去。要真的離桌請按下桌。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	targetid=shifttargetof(request,tokenuserrow)
	canoperate,source=shiftoperateaccess(tokenuserrow,targetid)
	if not canoperate:
		return errorresponse("ERROR_no_permission")

	if not openshiftof(targetid):
		return errorresponse("ERROR_staff_not_clockedin")
	segmentrow=opensegmentof(targetid)
	if not segmentrow:
		return errorresponse("ERROR_staff_already_onbreak")

	result=querytransaction(SETTING["dbname"],[closesegmentsql(segmentrow["id"],tokenuserrow["id"],source)],SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")

	return Response({
		"success": True,
		"data": {
			"staffuserid": targetid,
			"worklogid": segmentrow["id"],
			"endsource": source
		}
	},status.HTTP_200_OK)


@api_view(["POST"])
def resumestaffshift(request):
	# 休息結束，開新的一段。場次歸屬取當下的上桌指派（休息期間沒被移走的話就接回原本那場）。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	targetid=shifttargetof(request,tokenuserrow)
	canoperate,source=shiftoperateaccess(tokenuserrow,targetid)
	if not canoperate:
		return errorresponse("ERROR_no_permission")

	shiftrow=openshiftof(targetid)
	if not shiftrow:
		return errorresponse("ERROR_staff_not_clockedin")
	if opensegmentof(targetid):
		return errorresponse("ERROR_staff_not_onbreak")

	tablerow=opentablestaffof(targetid)
	sessionrow=None
	if tablerow:
		sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
		if sessionrow:
			sessionrow=sessionrow[0]
		else:
			sessionrow=None
	result=querytransaction(SETTING["dbname"],[segmentinsertsql(shiftrow["id"],targetid,sessionrow,tokenuserrow["id"],source,staffroleof(targetid))],SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")

	return Response({
		"success": True,
		"data": {
			"shiftid": shiftrow["id"],
			"staffuserid": targetid,
			"sessionid": sessionrow["id"] if sessionrow else None,
			"startsource": source
		}
	},status.HTTP_200_OK)


@api_view(["POST"])
def endstaffshift(request):
	# 下班卡。關段 + 關班 + 離桌，三件事包在同一個交易。
	# body 可帶 endtime 補登（忘了打下班卡時用），**指定時間需要不是 self 的權限**。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	targetid=shifttargetof(request,tokenuserrow)
	canoperate,source=shiftoperateaccess(tokenuserrow,targetid)
	if not canoperate:
		return errorresponse("ERROR_no_permission")

	shiftrow=openshiftof(targetid)
	if not shiftrow:
		return errorresponse("ERROR_staff_not_clockedin")

	try:
		data=json.loads(request.body or "{}")
	except Exception as error:
		data={}
	endtime=(data.get("endtime") or "").strip()
	if endtime:
		if source=="self":
			return errorresponse("ERROR_no_permission")
		# 補的時間要落在「開班之後、現在之前」。這裡的「現在」用 SQLNOW（本地）——
		# 寫 NOW()（真 UTC）的話，補一個剛才的時間會被當成未來而被擋掉。
		validrow=query(SETTING["dbname"],"""SELECT 1 FROM "staffworkshift" WHERE "id"=%s AND "starttime"<%s::timestamptz AND %s::timestamptz<="""+SQLNOW,[shiftrow["id"],endtime,endtime,nowtime()],SETTING["dbsetting"])
		if not validrow:
			return errorresponse("ERROR_worklog_time_invalid")

	sqllist=[]
	segmentrow=opensegmentof(targetid)
	if segmentrow:
		sqllist.append(closesegmentsql(segmentrow["id"],tokenuserrow["id"],source,endtime or None))
	if endtime:
		sqllist.append(["""UPDATE "staffworkshift" SET "endtime"=%s,"endoperatorid"=%s,"endsource"=%s,"updatetime"="""+SQLNOW+""" WHERE "id"=%s""",[endtime,tokenuserrow["id"],source,nowtime(),shiftrow["id"]]])
		sqllist.append(["""UPDATE "tablestaff" SET "endtime"=%s,"endoperatorid"=%s,"endsource"=%s,"updatetime"="""+SQLNOW+""" WHERE "staffuserid"=%s AND "endtime" IS NULL AND "deletetime" IS NULL""",[endtime,tokenuserrow["id"],source,nowtime(),targetid]])
	else:
		sqllist.append(["""UPDATE "staffworkshift" SET "endtime"="""+SQLNOW+""","endoperatorid"=%s,"endsource"=%s,"updatetime"="""+SQLNOW+""" WHERE "id"=%s""",[nowtime(),tokenuserrow["id"],source,nowtime(),shiftrow["id"]]])
		sqllist.append(["""UPDATE "tablestaff" SET "endtime"="""+SQLNOW+""","endoperatorid"=%s,"endsource"=%s,"updatetime"="""+SQLNOW+""" WHERE "staffuserid"=%s AND "endtime" IS NULL AND "deletetime" IS NULL""",[nowtime(),tokenuserrow["id"],source,nowtime(),targetid]])

	result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")

	return Response({
		"success": True,
		"data": {
			"shiftid": shiftrow["id"],
			"staffuserid": targetid,
			"endsource": source,
			"backfilled": endtime!=""
		}
	},status.HTTP_200_OK)


@api_view(["GET"])
def getstaffshiftstatus(request):
	# 我（或指定員工）現在是什麼狀態：未上班 / 工作中 / 休息中，以及本班累計。
	# 三顆按鈕（上班 / 休息或回來 / 下班）要顯示哪一顆全靠這一支。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	targetid=shifttargetof(request,tokenuserrow)
	canoperate,source=shiftoperateaccess(tokenuserrow,targetid)
	if not canoperate:
		return errorresponse("ERROR_no_permission")

	shiftrow=openshiftof(targetid)
	segmentrow=opensegmentof(targetid)
	tablerow=opentablestaffof(targetid)

	state="off"
	if shiftrow:
		state="working"
		if not segmentrow:
			state="onbreak"

	shiftminute=0
	segmentlist=[]
	if shiftrow:
		rowlist=query(SETTING["dbname"],"""
			SELECT w."id",w."sessionid",w."starttime",w."endtime",w."hourlyrate",w."ratesource",
				s."name" AS sessionname,
				EXTRACT(EPOCH FROM (COALESCE(w."endtime","""+SQLNOW+""")-w."starttime"))/60 AS actualminute
			FROM "staffworklog" w
			LEFT JOIN "session" s ON s."id"=w."sessionid"
			WHERE w."shiftid"=%s AND w."deletetime" IS NULL
			ORDER BY w."starttime" ASC,w."id" ASC
		""",[nowtime(),shiftrow["id"]],SETTING["dbsetting"])
		for row in rowlist or []:
			item=decorateworklog(row)
			shiftminute=shiftminute+item["actualminute"]
			segmentlist.append(item)

	tableinfo=None
	if tablerow:
		tableinfo=query(SETTING["dbname"],"""SELECT t."id",t."no",t."name",s."name" AS sessionname FROM "table" t LEFT JOIN "session" s ON s."id"=t."sessionid" WHERE t."id"=%s""",[tablerow["tableid"]],SETTING["dbsetting"])
		if tableinfo:
			tableinfo=dict(tableinfo[0])
			tableinfo["tablestaffid"]=tablerow["id"]
		else:
			tableinfo=None

	return Response({
		"success": True,
		"data": {
			"staffuserid": targetid,
			"state": state,
			"shiftid": shiftrow["id"] if shiftrow else None,
			"shiftstarttime": shiftrow["starttime"] if shiftrow else None,
			"shiftminute": shiftminute,
			"shiftbillingminute": billingminuteof(shiftminute),
			"segmentlist": segmentlist,
			"table": tableinfo,
			"selfed": targetid==tokenuserrow["id"],
			"operatesource": source
		}
	},status.HTTP_200_OK)


def decorateworklog(row):
	"""把 SQL 算出的實際分鐘補上計費分鐘與金額。

	進位與金額**只在這裡算一次**。寫進 SQL 就會有兩份實作，日後改一邊就靜默不一致。
	進行中的班（endtime 為 NULL）不計金額 —— 否則報表每次重整數字都在跳，
	收班前永遠得不到一個定數。
	"""
	item=dict(row)
	actualminute=int(item.get("actualminute") or 0)
	item["actualminute"]=actualminute
	item["workinged"]=item.get("endtime") is None
	if item["workinged"]:
		item["billingminute"]=0
		item["amount"]=0
	else:
		item["billingminute"]=billingminuteof(actualminute)
		item["amount"]=amountof(item["billingminute"],item.get("hourlyrate"))
	item["selfstarted"]=item.get("startsource")=="self"
	item["crossdayed"]=1440<=actualminute
	return item


def worklogordersql(request):
	"""ORDER BY 的欄位名不能用 %s（那會變成「依這個字串常數排序」＝沒排序），
	只能直接插進 SQL，所以來源**必須**是寫死的清單。照抄 session.py:426-450 的做法。
	後面固定接 "id" DESC 當穩定次鍵，否則同值列在分頁之間會重複或漏掉。
	"""
	orderof={
		"starttime": "\"starttime\"",
		"staffname": "staffname",
		"actualminute": "actualminute",
		"amount": "hourlyrate"
	}
	ordersql="\"starttime\" DESC, \"id\" DESC"
	orderkey=request.GET.get("order") or ""
	if orderkey in orderof:
		direction="ASC"
		if (request.GET.get("direction") or "").lower()=="desc":
			direction="DESC"
		ordersql=orderof[orderkey]+" "+direction+" NULLS LAST, \"id\" DESC"
	return ordersql


@api_view(["GET"])
def getsessionstaffwork(request,sessionid):
	# 單場明細。段數量級小，不分頁，一次全給前端。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	sessionrow,access,accesserror=sessionandaccessof(request,sessionid,tokenuserrow)
	if accesserror:
		return accesserror

	if not (access["isown"] or access["isadmin"] or access["isstaff"]):
		return errorresponse("ERROR_no_permission")

	# 主辦／管理員／助理看全部；其他員工只看得到自己的。
	# 這裡刻意**不回 403** —— 現場員工想知道自己今天做了幾小時是合理的。
	where=["w.\"sessionid\"=%s","w.\"deletetime\" IS NULL"]
	param=[sessionrow["id"]]
	if not (access["isown"] or access["isadmin"] or access["accessrole"]=="assistant"):
		where.append("w.\"staffuserid\"=%s")
		param.append(tokenuserrow["id"])
	staffuserid=request.GET.get("staffuserid") or ""
	if staffuserid:
		where.append("w.\"staffuserid\"=%s")
		param.append(intval(staffuserid,0))
	# 指派給具名變數而不是行內 join：verify:sql 的偵測器是靠變數名去回溯
	# 「被 join 的那個 list 裡 append 了什麼」的，行內寫法它看不到，
	# 而「沒被列出來」跟「檢查過沒問題」在報告上長得一模一樣。
	wheresql=" AND ".join(where)

	rowlist=query(SETTING["dbname"],"""
		SELECT*FROM (
			SELECT w."id",w."sessionid",w."staffuserid",w."role",
				w."starttime",w."endtime",w."hourlyrate",w."ratesource",
				w."startsource",w."endsource",w."ps",
				u."name" AS staffname,u."playerid" AS staffplayerid,
				so."name" AS startoperatorname,eo."name" AS endoperatorname,
				EXTRACT(EPOCH FROM (COALESCE(w."endtime","""+SQLNOW+""")-w."starttime"))/60 AS actualminute
			FROM "staffworklog" w
			JOIN "user" u ON u."id"=w."staffuserid"
			LEFT JOIN "user" so ON so."id"=w."startoperatorid"
			LEFT JOIN "user" eo ON eo."id"=w."endoperatorid"
			WHERE """+wheresql+"""
		) worklog
		ORDER BY """+worklogordersql(request),[nowtime()]+param,SETTING["dbsetting"])
	if rowlist is None:
		return errorresponse("ERROR_database_error")

	itemlist=[]
	staffmap={}
	totalminute=0
	totalamount=0
	openedcount=0
	for row in rowlist:
		item=decorateworklog(row)
		itemlist.append(item)
		totalminute=totalminute+item["actualminute"]
		totalamount=totalamount+item["amount"]
		if item["workinged"]:
			openedcount=openedcount+1
		key=str(item["staffuserid"])
		if key not in staffmap:
			staffmap[key]={
				"staffuserid": item["staffuserid"],
				"staffname": item["staffname"],
				"staffplayerid": item["staffplayerid"],
				"role": item["role"],
				"logcount": 0,
				"actualminute": 0,
				"billingminute": 0,
				"amount": 0
			}
		staffmap[key]["logcount"]=staffmap[key]["logcount"]+1
		staffmap[key]["actualminute"]=staffmap[key]["actualminute"]+item["actualminute"]
		staffmap[key]["billingminute"]=staffmap[key]["billingminute"]+item["billingminute"]
		staffmap[key]["amount"]=staffmap[key]["amount"]+item["amount"]

	staffsummarylist=[]
	for key in staffmap:
		staffsummarylist.append(staffmap[key])

	return Response({
		"success": True,
		"data": {
			"loglist": itemlist,
			"staffsummarylist": staffsummarylist,
			"total": {
				"actualminute": totalminute,
				"amount": totalamount,
				"logcount": len(itemlist),
				"openedcount": openedcount
			},
			"canmanage": access["isown"] or access["isadmin"] or access["accessrole"]=="assistant"
		}
	},status.HTTP_200_OK)


@api_view(["GET"])
def getstaffworkreport(request):
	# 跨場次累計。後端分頁 + 白名單排序 + 日期區間 + 三種分組。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	viewmode=request.GET.get("viewmode") or "owner"
	if viewmode not in ["owner","self"]:
		viewmode="owner"
	groupby=request.GET.get("groupby") or "staff"
	if groupby not in ["staff","session","log"]:
		groupby="staff"

	where=["w.\"deletetime\" IS NULL"]
	param=[]
	if viewmode=="self":
		where.append("w.\"staffuserid\"=%s")
	else:
		where.append("w.\"ownerid\"=%s")
	param.append(tokenuserrow["id"])

	# 日期用**半開區間**：enddate 後端加一天。用 BETWEEN 會漏掉迄日當天的資料。
	startdate=request.GET.get("startdate") or ""
	if startdate:
		where.append("w.\"starttime\">=%s")
		param.append(startdate+" 00:00:00")
	enddate=request.GET.get("enddate") or ""
	if enddate:
		where.append("w.\"starttime\"<(%s::date+INTERVAL '1 day')")
		param.append(enddate)
	staffuserid=request.GET.get("staffuserid") or ""
	if staffuserid:
		where.append("w.\"staffuserid\"=%s")
		param.append(intval(staffuserid,0))
	sessionid=request.GET.get("sessionid") or ""
	if sessionid:
		where.append("w.\"sessionid\"=%s")
		param.append(intval(sessionid,0))
	wheresql=" AND ".join(where)

	page=intval(request.GET.get("page"),1)
	if page<=0:
		page=1
	limit=intval(request.GET.get("limit"),20)
	if limit<=0:
		limit=20
	if 1000000<limit:
		limit=1000000

	# 逐筆模式與分組模式的欄位不同，但都用同一套「明細 + window function 帶總計」的形狀。
	if groupby=="log":
		innersql="""
			SELECT w."id",w."sessionid",w."staffuserid",w."role",w."starttime",w."endtime",
				w."hourlyrate",w."ratesource",w."startsource",w."endsource",
				u."name" AS staffname,u."playerid" AS staffplayerid,s."name" AS sessionname,
				EXTRACT(EPOCH FROM (COALESCE(w."endtime","""+SQLNOW+""")-w."starttime"))/60 AS actualminute
			FROM "staffworklog" w
			JOIN "user" u ON u."id"=w."staffuserid"
			LEFT JOIN "session" s ON s."id"=w."sessionid"
			WHERE """+wheresql+"""
		"""
		ordersql=worklogordersql(request)
	else:
		groupcolumn="w.\"staffuserid\",u.\"name\",u.\"playerid\""
		selectcolumn="w.\"staffuserid\",u.\"name\" AS staffname,u.\"playerid\" AS staffplayerid,NULL::bigint AS sessionid,NULL::varchar AS sessionname"
		if groupby=="session":
			groupcolumn="w.\"sessionid\",s.\"name\""
			selectcolumn="NULL::bigint AS staffuserid,NULL::varchar AS staffname,NULL::varchar AS staffplayerid,w.\"sessionid\",s.\"name\" AS sessionname"
		innersql="""
			SELECT """+selectcolumn+""",
				COUNT(w."id") AS logcount,
				COUNT(DISTINCT w."sessionid") AS sessioncount,
				SUM(CASE WHEN w."endtime" IS NULL THEN 1 ELSE 0 END) AS openedcount,
				SUM(EXTRACT(EPOCH FROM (COALESCE(w."endtime","""+SQLNOW+""")-w."starttime"))/60) AS actualminute,
				MIN(w."starttime") AS firsttime,
				MAX(COALESCE(w."endtime",w."starttime")) AS lasttime
			FROM "staffworklog" w
			JOIN "user" u ON u."id"=w."staffuserid"
			LEFT JOIN "session" s ON s."id"=w."sessionid"
			WHERE """+wheresql+"""
			GROUP BY """+groupcolumn+"""
		"""
		ordersql="actualminute DESC NULLS LAST"

	rowlist=query(SETTING["dbname"],"""
		SELECT*,COUNT(*) OVER() AS totalrows FROM ("""+innersql+""") grouped
		ORDER BY """+ordersql+"""
		LIMIT %s OFFSET %s
	""",[nowtime()]+param+[limit,(page-1)*limit],SETTING["dbsetting"])
	if rowlist is None:
		return errorresponse("ERROR_database_error")

	# 金額不能靠分組後的 SUM 算 —— 進位是逐段做的（每一段各自進位到 30 分鐘），
	# 先加總再進位會少算。所以分組模式另外撈一次逐段資料在 Python 端逐段進位。
	amountmap={}
	openedmap={}
	if groupby!="log":
		keycolumn="\"staffuserid\""
		if groupby=="session":
			keycolumn="\"sessionid\""
		detaillist=query(SETTING["dbname"],"""
			SELECT w."""+keycolumn+""" AS groupkey,w."endtime",w."hourlyrate",
				EXTRACT(EPOCH FROM (COALESCE(w."endtime","""+SQLNOW+""")-w."starttime"))/60 AS actualminute
			FROM "staffworklog" w
			JOIN "user" u ON u."id"=w."staffuserid"
			LEFT JOIN "session" s ON s."id"=w."sessionid"
			WHERE """+wheresql,[nowtime()]+param,SETTING["dbsetting"])
		for row in detaillist or []:
			key=str(row["groupkey"])
			if key not in amountmap:
				amountmap[key]=0
				openedmap[key]=0
			if row["endtime"] is None:
				openedmap[key]=openedmap[key]+1
			else:
				amountmap[key]=amountmap[key]+amountof(billingminuteof(int(row["actualminute"] or 0)),row["hourlyrate"])

	total=0
	itemlist=[]
	grandminute=0
	grandamount=0
	for row in rowlist:
		total=intval(row.get("totalrows"),0)
		item=dict(row)
		del item["totalrows"]
		if groupby=="log":
			item=decorateworklog(item)
		else:
			actualminute=int(item.get("actualminute") or 0)
			item["actualminute"]=actualminute
			key=str(item.get("staffuserid") if groupby=="staff" else item.get("sessionid"))
			item["amount"]=amountmap.get(key,0)
			item["openedcount"]=openedmap.get(key,0)
		grandminute=grandminute+item["actualminute"]
		grandamount=grandamount+item["amount"]
		itemlist.append(item)

	totalpages=(total+limit-1)//limit
	if totalpages<=0:
		totalpages=1

	return Response({
		"success": True,
		"data": {
			"list": itemlist,
			"groupby": groupby,
			"viewmode": viewmode,
			"pageminute": grandminute,
			"pageamount": grandamount,
			"pagination": {
				"page": page,
				"limit": limit,
				"total": total,
				"totalpages": totalpages,
				"hasprev": 1<page,
				"hasnext": page<totalpages
			}
		}
	},status.HTTP_200_OK)


@api_view(["PUT"])
def editstaffworklog(request,worklogid):
	# 修正／補登一段工時。**只有主辦與管理員** —— 助理不行。
	# 按打卡鍵是記錄現況，改時間與時薪是改錢，兩件事的權限不該一樣。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],"""SELECT*FROM "staffworklog" WHERE "id"=%s AND "deletetime" IS NULL""",[worklogid],SETTING["dbsetting"])
	if not row:
		return errorresponse("ERROR_worklog_not_found")
	row=row[0]

	sessionrow,access,accesserror=sessionandaccessof(request,row["sessionid"],tokenuserrow)
	if accesserror:
		return accesserror
	if not (access["isown"] or access["isadmin"]):
		return errorresponse("ERROR_no_permission")

	requestdata=validate(json.loads(request.body or "{}"),{
		"starttime": "string",
		"endtime": "string",
		"hourlyrate": "integer|min:0",
		"ps": "string"
	},{
		"string": "ERROR_request_data_type_error",
		"integer": "ERROR_request_data_type_error",
		"min": "ERROR_request_data_type_error"
	})
	if requestdata["error"] is not None:
		return errorresponse(requestdata["error"])
	data=requestdata["data"]

	update={}
	starttime=(data.get("starttime") or "").strip()
	if starttime:
		update["starttime"]=starttime
	endtime=(data.get("endtime") or "").strip()
	if endtime:
		update["endtime"]=endtime
	if "hourlyrate" in data and data.get("hourlyrate") is not None:
		update["hourlyrate"]=data.get("hourlyrate")
		# 手改過的時薪要標出來，否則總覽頁上「這場這個人時薪不一樣」會找不到原因
		update["ratesource"]="manual"
	if "ps" in data:
		update["ps"]=data.get("ps")
	if not update:
		return errorresponse("ERROR_request_data_not_found")

	# 時間合法性與區間重疊都交給 SQL 判 —— DB 是 timestamptz、nowtime() 是 naive 字串，
	# 在 Python 端比大小遲早會踩到 naive/aware 混算。
	newstart=update.get("starttime")
	newend=update.get("endtime")
	checkrow=query(SETTING["dbname"],"""
		SELECT
			(COALESCE(%s::timestamptz,"starttime")<COALESCE(%s::timestamptz,"endtime","""+SQLNOW+""")) AS orderok,
			(COALESCE(%s::timestamptz,"endtime","""+SQLNOW+""")<="""+SQLNOW+""") AS futureok
		FROM "staffworklog" WHERE "id"=%s
	""",[newstart,newend,nowtime(),newend,nowtime(),nowtime(),worklogid],SETTING["dbsetting"])
	if not checkrow or not checkrow[0]["orderok"] or not checkrow[0]["futureok"]:
		return errorresponse("ERROR_worklog_time_invalid")

	# partial unique index 只擋「兩段都未結束」，擋不了兩段已結束的區間重疊，所以這裡要自己查
	overlaprow=query(SETTING["dbname"],"""
		SELECT 1 FROM "staffworklog" other
		WHERE other."sessionid"=%s AND other."staffuserid"=%s AND other."id"<>%s AND other."deletetime" IS NULL
		  AND other."starttime"<COALESCE(%s::timestamptz,(SELECT COALESCE("endtime","""+SQLNOW+""") FROM "staffworklog" WHERE "id"=%s))
		  AND COALESCE(%s::timestamptz,(SELECT "starttime" FROM "staffworklog" WHERE "id"=%s))<COALESCE(other."endtime","""+SQLNOW+""")
		LIMIT 1
	""",[row["sessionid"],row["staffuserid"],worklogid,newend,nowtime(),worklogid,newstart,worklogid,nowtime()],SETTING["dbsetting"])
	if overlaprow:
		return errorresponse("ERROR_worklog_time_overlap")

	beforedata={
		"starttime": str(row.get("starttime")),
		"endtime": str(row.get("endtime")),
		"hourlyrate": str(row.get("hourlyrate"))
	}
	update["updatetime"]=nowtime()
	result=queryupdate(SETTING["dbname"],"staffworklog",update,{"id": worklogid},SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")
	writeauditlog(SETTING["dbname"],SETTING["dbsetting"],tokenuserrow["id"],"staffworklog","edit",worklogid,beforedata,update,request)

	return Response({
		"success": True,
		"data": ""
	},status.HTTP_200_OK)


@api_view(["DELETE"])
def deletestaffworklog(request,worklogid):
	# 軟刪一段工時。同 editstaffworklog：只有主辦與管理員。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],"""SELECT*FROM "staffworklog" WHERE "id"=%s AND "deletetime" IS NULL""",[worklogid],SETTING["dbsetting"])
	if not row:
		return errorresponse("ERROR_worklog_not_found")
	row=row[0]

	sessionrow,access,accesserror=sessionandaccessof(request,row["sessionid"],tokenuserrow)
	if accesserror:
		return accesserror
	if not (access["isown"] or access["isadmin"]):
		return errorresponse("ERROR_no_permission")

	result=query(SETTING["dbname"],"""UPDATE "staffworklog" SET "deletetime"="""+SQLNOW+""","updatetime"="""+SQLNOW+""" WHERE "id"=%s""",[nowtime(),nowtime(),worklogid],SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")
	writeauditlog(SETTING["dbname"],SETTING["dbsetting"],tokenuserrow["id"],"staffworklog","delete",worklogid,{"staffuserid": row.get("staffuserid"),"starttime": str(row.get("starttime"))},None,request)

	return Response({
		"success": True,
		"data": ""
	},status.HTTP_200_OK)


@api_view(["PUT"])
def editstaffrate(request,staffid):
	# 全域預設時薪（userstaff）。**不回改既有的 staffworklog** —— 快照的意義就在這裡。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],"""SELECT*FROM "userstaff" WHERE "id"=%s AND "deletetime" IS NULL""",[staffid],SETTING["dbsetting"])
	if not row:
		return errorresponse("ERROR_staff_not_found")
	row=row[0]
	if row["userid"]!=tokenuserrow["id"] and 4>int(tokenuserrow["permission"]):
		return errorresponse("ERROR_no_permission")

	return updatehourlyrate(request,"userstaff",staffid)


@api_view(["PUT"])
def editsessionstaffrate(request,sessionstaffid):
	# 單場覆寫時薪（sessionstaff）。傳 null 代表清除覆寫、回去沿用全域預設。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],"""SELECT*FROM "sessionstaff" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionstaffid],SETTING["dbsetting"])
	if not row:
		return errorresponse("ERROR_staff_not_found")
	row=row[0]

	sessionrow,access,accesserror=sessionandaccessof(request,row["sessionid"],tokenuserrow)
	if accesserror:
		return accesserror
	if not (access["isown"] or access["isadmin"]):
		return errorresponse("ERROR_no_permission")

	return updatehourlyrate(request,"sessionstaff",sessionstaffid)


def updatehourlyrate(request,tablename,rowid):
	"""兩支設定時薪的端點共用的寫入。

	hourlyrate 是 nullable 且沒有 DEFAULT：NULL = 沒設定，0 = 無給職。
	所以「清除」要真的寫 NULL，不能寫 0。
	tablename 只可能是這裡寫死的兩個字面值 —— 絕不能讓 request 決定表名。
	"""
	try:
		data=json.loads(request.body or "{}")
	except Exception as error:
		data={}
	value=data.get("hourlyrate")
	update={"updatetime": nowtime()}
	if value is None or value=="":
		update["hourlyrate"]=None
	else:
		rate=intval(value,-1)
		if rate<0:
			return errorresponse("ERROR_request_data_type_error")
		update["hourlyrate"]=rate
	if tablename=="userstaff":
		result=queryupdate(SETTING["dbname"],"userstaff",update,{"id": rowid},SETTING["dbsetting"])
	else:
		result=queryupdate(SETTING["dbname"],"sessionstaff",update,{"id": rowid},SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")
	return Response({
		"success": True,
		"data": {
			"hourlyrate": update["hourlyrate"]
		}
	},status.HTTP_200_OK)


@api_view(["POST"])
def assignstafftable(request,tableid):
	# 上桌。同一個人本來在別桌就是「換桌」（同交易關舊段開新段）。
	# body {"staffuserid":123,"replaceed":false,"autoclockined":true}
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	tablerow,sessionrow=gettableandsession(tableid)
	if not tablerow:
		return errorresponse("ERROR_table_not_found")
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")

	access=sessionaccess(sessionrow,tokenuserrow)
	targetid=targetstaffuseridof(request,tokenuserrow)
	canoperate,source=staffworkoperate(access,tokenuserrow,targetid)
	if not canoperate:
		return errorresponse("ERROR_no_permission")

	try:
		data=json.loads(request.body or "{}")
	except Exception as error:
		data={}
	replaceed=data.get("replaceed")==True
	autoclockined=data.get("autoclockined")!=False

	# role 一律取聘用關係，不從 body 取。role 與 user.type 是綁死的，
	# 讓前端指定只會產生與 user.type 矛盾的歷史資料。
	staffrow=activestaffrow(sessionrow["id"],sessionrow["userid"],targetid)
	if not staffrow:
		return errorresponse("ERROR_staff_not_found")

	sqllist=[]
	# 一、這個人若在別桌（或就在本桌），先關掉那一段 —— 這就是換桌。
	# tablestaffopenstaff 是全域唯一索引，不先關會直接撞索引。
	currentrow=query(SETTING["dbname"],"""SELECT "id","tableid" FROM "tablestaff" WHERE "staffuserid"=%s AND "endtime" IS NULL AND "deletetime" IS NULL LIMIT 1""",[targetid],SETTING["dbsetting"])
	movedfromtableid=None
	if currentrow:
		if str(currentrow[0]["tableid"])==str(tablerow["id"]):
			return errorresponse("ERROR_staff_already_ontable")
		movedfromtableid=currentrow[0]["tableid"]
		sqllist.append(["""UPDATE "tablestaff" SET "endtime"="""+SQLNOW+""","endoperatorid"=%s,"endsource"=%s,"updatetime"="""+SQLNOW+""" WHERE "id"=%s""",[nowtime(),tokenuserrow["id"],source,nowtime(),currentrow[0]["id"]]])

	# 二、本桌同角色若已有人：**不擋**，交接時新舊計分員要能短暫並存。
	# replaceed=true 才真的把舊的關掉；否則照樣寫入並回 warningcode，由前端跳確認。
	warningcode=""
	occupiedrow=query(SETTING["dbname"],"""
		SELECT ts."id",u."name" AS staffname
		FROM "tablestaff" ts JOIN "user" u ON u."id"=ts."staffuserid"
		WHERE ts."tableid"=%s AND ts."role"=%s AND ts."staffuserid"<>%s AND ts."endtime" IS NULL AND ts."deletetime" IS NULL
		LIMIT 1
	""",[tablerow["id"],staffrow["role"],targetid],SETTING["dbsetting"])
	occupiedname=""
	if occupiedrow:
		occupiedname=occupiedrow[0]["staffname"]
		if replaceed:
			sqllist.append(["""UPDATE "tablestaff" SET "endtime"="""+SQLNOW+""","endoperatorid"=%s,"endsource"=%s,"updatetime"="""+SQLNOW+""" WHERE "id"=%s""",[nowtime(),tokenuserrow["id"],source,nowtime(),occupiedrow[0]["id"]]])
		else:
			warningcode="tablestaffoverlap"

	# 三、切段：上桌會改變場次歸屬，所以要把目前那一段收掉、開一段帶新場次的。
	# 「一段 = 一段連續工作且場次歸屬固定」這個不變式就是靠這裡維持的。
	shiftrow=openshiftof(targetid)
	clockined=False
	if not shiftrow and autoclockined:
		# 還沒打卡就被排上桌：順便開一個班，否則會出現「有上桌紀錄卻零時數」
		shiftid=queryinsert(SETTING["dbname"],"staffworkshift",{
			"staffuserid": targetid,
			"starttime": nowtime(),
			"startoperatorid": tokenuserrow["id"],
			"startsource": source,
			"createtime": nowtime(),
			"updatetime": nowtime()
		},SETTING["dbsetting"])
		if shiftid is None:
			return errorresponse("ERROR_database_error")
		shiftrow={"id": shiftid}
		clockined=True

	worklogid=None
	if shiftrow:
		# 休息中（班開著但沒有未結束的段）就不要幫他開新段 —— 那等於幫他結束休息。
		# 只有正在工作中才切段。
		segmentrow=opensegmentof(targetid)
		if segmentrow:
			sqllist.append(closesegmentsql(segmentrow["id"],tokenuserrow["id"],source))
			sqllist.append(segmentinsertsql(shiftrow["id"],targetid,sessionrow,tokenuserrow["id"],source,staffrow["role"]))
		elif clockined:
			sqllist.append(segmentinsertsql(shiftrow["id"],targetid,sessionrow,tokenuserrow["id"],source,staffrow["role"]))

	sqllist.append(["""INSERT INTO "tablestaff"("sessionid","tableid","staffuserid","worklogid","role","starttime","startoperatorid","startsource","createtime","updatetime")VALUES(%s,%s,%s,%s,%s,"""+SQLNOW+""",%s,%s,"""+SQLNOW+""","""+SQLNOW+""")""",[sessionrow["id"],tablerow["id"],targetid,worklogid,staffrow["role"],nowtime(),tokenuserrow["id"],source,nowtime(),nowtime()]])
	result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")

	return Response({
		"success": True,
		"data": {
			"tableid": tablerow["id"],
			"staffuserid": targetid,
			"role": staffrow["role"],
			"worklogid": worklogid,
			"autoclockined": clockined,
			"movedfromtableid": movedfromtableid,
			"warningcode": warningcode,
			"occupiedname": occupiedname,
			"startsource": source
		}
	},status.HTTP_200_OK)


@api_view(["POST"])
def releasestafftable(request,tablestaffid):
	# 下桌。**不動工時** —— 離桌不等於下班（去休息、去支援別的事都可能）。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],"""SELECT*FROM "tablestaff" WHERE "id"=%s AND "endtime" IS NULL AND "deletetime" IS NULL""",[tablestaffid],SETTING["dbsetting"])
	if not row:
		return errorresponse("ERROR_tablestaff_not_found")
	row=row[0]

	sessionrow,access,accesserror=sessionandaccessof(request,row["sessionid"],tokenuserrow)
	if accesserror:
		return accesserror

	canoperate,source=staffworkoperate(access,tokenuserrow,row["staffuserid"])
	if not canoperate:
		return errorresponse("ERROR_no_permission")

	# 下桌一樣要切段：離開牌桌之後那段時間就不屬於任何場次了，
	# 但人還在上班（工時照算），所以是「關掉這一段、開一段未歸屬的」而不是結束工作。
	sqllist=[["""UPDATE "tablestaff" SET "endtime"="""+SQLNOW+""","endoperatorid"=%s,"endsource"=%s,"updatetime"="""+SQLNOW+""" WHERE "id"=%s""",[nowtime(),tokenuserrow["id"],source,nowtime(),row["id"]]]]
	shiftrow=openshiftof(row["staffuserid"])
	if shiftrow:
		segmentrow=opensegmentof(row["staffuserid"])
		if segmentrow:
			sqllist.append(closesegmentsql(segmentrow["id"],tokenuserrow["id"],source))
			sqllist.append(segmentinsertsql(shiftrow["id"],row["staffuserid"],None,tokenuserrow["id"],source,row["role"]))
	result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")

	return Response({
		"success": True,
		"data": {
			"tablestaffid": row["id"],
			"staffuserid": row["staffuserid"],
			"endsource": source
		}
	},status.HTTP_200_OK)


@api_view(["GET"])
def getstaffworkstatus(request,sessionid):
	# 現場狀態：這場每個有效員工的打卡狀態、目前在哪一桌、累計分鐘。
	# tableboard 的桌卡與 session 頁的員工分頁共用這一支。
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	sessionrow,access,accesserror=sessionandaccessof(request,sessionid,tokenuserrow)
	if accesserror:
		return accesserror

	if not (access["isown"] or access["isadmin"] or access["isstaff"]):
		return errorresponse("ERROR_no_permission")

	# sessionstaff 與 userstaff 取聯集，且 sessionstaff 命中的人不再從 userstaff 出現一次
	# （NOT EXISTS 那段），與 sessionaccess 的優先序一致。
	rowlist=query(SETTING["dbname"],"""
		WITH staffsource AS (
			SELECT ss."staffuserid",ss."role",ss."hourlyrate" AS sessionrate,'sessionstaff' AS source,ss."id" AS sessionstaffid
			FROM "sessionstaff" ss
			WHERE ss."sessionid"=%s AND ss."status"='active' AND ss."deletetime" IS NULL
			UNION ALL
			SELECT us."staffuserid",us."role",NULL::numeric AS sessionrate,'userstaff' AS source,NULL::bigint AS sessionstaffid
			FROM "userstaff" us
			WHERE us."userid"=%s AND us."status"='active' AND us."deletetime" IS NULL
			  AND NOT EXISTS(
				SELECT 1 FROM "sessionstaff" x
				WHERE x."sessionid"=%s AND x."staffuserid"=us."staffuserid"
				  AND x."status"='active' AND x."deletetime" IS NULL
			  )
		)
		SELECT s."staffuserid",s."role",s."source",s."sessionstaffid",
			u."name" AS staffname,u."playerid" AS staffplayerid,
			COALESCE(s."sessionrate",us2."hourlyrate") AS hourlyrate,
			CASE WHEN s."sessionrate" IS NOT NULL THEN 'sessionstaff'
				WHEN us2."hourlyrate" IS NOT NULL THEN 'userstaff'
				ELSE 'none' END AS ratesource,
			w."id" AS worklogid,w."starttime" AS workstarttime,w."startsource" AS workstartsource,
			sh."id" AS shiftid,sh."starttime" AS shiftstarttime,
			CASE WHEN sh."id" IS NULL THEN 'off'
				WHEN w."id" IS NULL THEN 'onbreak'
				ELSE 'working' END AS shiftstate,
			ts."id" AS tablestaffid,ts."tableid",ts."starttime" AS tablestarttime,
			t."no" AS tableno,t."name" AS tablename,
			COALESCE(agg."totalminute",0) AS totalminute,
			COALESCE(agg."logcount",0) AS logcount
		FROM staffsource s
		JOIN "user" u ON u."id"=s."staffuserid"
		LEFT JOIN "userstaff" us2 ON us2."userid"=%s AND us2."staffuserid"=s."staffuserid" AND us2."status"='active' AND us2."deletetime" IS NULL
		LEFT JOIN "staffworklog" w ON w."staffuserid"=s."staffuserid" AND w."endtime" IS NULL AND w."deletetime" IS NULL
		LEFT JOIN "staffworkshift" sh ON sh."staffuserid"=s."staffuserid" AND sh."endtime" IS NULL AND sh."deletetime" IS NULL
		LEFT JOIN "tablestaff" ts ON ts."staffuserid"=s."staffuserid" AND ts."endtime" IS NULL AND ts."deletetime" IS NULL
		LEFT JOIN "table" t ON t."id"=ts."tableid" AND t."deletetime" IS NULL
		LEFT JOIN (
			SELECT "staffuserid",
				SUM(EXTRACT(EPOCH FROM (COALESCE("endtime","""+SQLNOW+""")-"starttime"))/60) AS totalminute,
				COUNT(*) AS logcount
			FROM "staffworklog"
			WHERE "sessionid"=%s AND "deletetime" IS NULL
			GROUP BY "staffuserid"
		) agg ON agg."staffuserid"=s."staffuserid"
		ORDER BY s."role" ASC,u."name" ASC
	""",[sessionrow["id"],sessionrow["userid"],sessionrow["id"],sessionrow["userid"],nowtime(),sessionrow["id"]],SETTING["dbsetting"])
	if rowlist is None:
		return errorresponse("ERROR_database_error")

	stafflist=[]
	tablemap={}
	for row in rowlist:
		item=dict(row)
		actualminute=int(item.get("totalminute") or 0)
		item["totalminute"]=actualminute
		item["billingminute"]=billingminuteof(actualminute)
		item["amount"]=amountof(item["billingminute"],item.get("hourlyrate"))
		item["workinged"]=item.get("worklogid") is not None
		item["ontableed"]=item.get("tablestaffid") is not None
		item["selfstarted"]=item.get("workstartsource")=="self"
		# 這一列是不是呼叫者自己。前端靠它決定「只有自己那一列有按鈕」，
		# 由後端標比讓前端自己比對 token 使用者可靠 —— 前端手上不一定有 user id。
		item["selfed"]=item.get("staffuserid")==tokenuserrow["id"]
		stafflist.append(item)
		if item["ontableed"]:
			key=str(item["tableid"])
			if key not in tablemap:
				tablemap[key]=[]
			tablemap[key].append({
				"tablestaffid": item["tablestaffid"],
				"staffuserid": item["staffuserid"],
				"staffname": item["staffname"],
				"role": item["role"],
				"starttime": item["tablestarttime"]
			})

	# **待確認的聘用另外給一份清單，不混進 stafflist。**
	# newsessionstaff / newstaff 建立的列是 status='pending'，要等對方點信裡的連結
	# 才變成 active。上面的 staffsource 只取 active 是對的 —— 未確認的人不該被排班、
	# 也不該出現在 tableboard 的可指派名單裡（tableboard 吃的就是 stafflist）。
	#
	# 但只做到這樣，畫面會變成：按了「指派」→ 跳出「已指派」→ 清單依舊空白、
	# 還是那句「這場沒有可排班的員工」。**使用者沒有任何線索知道在等對方確認。**
	# 所以另外回一份 pendinglist 讓前端顯示「待確認」，語意分開、既有消費者不受影響。
	pendingrowlist=query(SETTING["dbname"],"""
		SELECT ss."staffuserid",ss."role",'sessionstaff' AS source,ss."id" AS sessionstaffid,ss."invitetime",
			u."name" AS staffname,u."playerid" AS staffplayerid
		FROM "sessionstaff" ss
		JOIN "user" u ON u."id"=ss."staffuserid"
		WHERE ss."sessionid"=%s AND ss."status"='pending' AND ss."deletetime" IS NULL
		UNION ALL
		SELECT us."staffuserid",us."role",'userstaff' AS source,NULL::bigint AS sessionstaffid,us."invitetime",
			u."name" AS staffname,u."playerid" AS staffplayerid
		FROM "userstaff" us
		JOIN "user" u ON u."id"=us."staffuserid"
		WHERE us."userid"=%s AND us."status"='pending' AND us."deletetime" IS NULL
		ORDER BY 2 ASC,6 ASC
	""",[sessionrow["id"],sessionrow["userid"]],SETTING["dbsetting"])
	pendinglist=[]
	for row in pendingrowlist or []:
		pendinglist.append(dict(row))

	return Response({
		"success": True,
		"data": {
			"stafflist": stafflist,
			"pendinglist": pendinglist,
			"tablemap": tablemap,
			"canmanage": access["isown"] or access["isadmin"] or access["accessrole"]=="assistant"
		}
	},status.HTTP_200_OK)
