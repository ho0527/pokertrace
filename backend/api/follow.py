# follow.py
# ===========================================================================
# 追隨主辦者（含地點粒度）
#
#   * 追隨的對象是「主辦者」(session.userid)，可再縮到單一協會地點 (session.clubid)
#   * userfollow.clubid IS NULL = 追這個主辦者的全部地點；有值 = 只追那一個地點
#   * 追隨的主辦者建立新場次時發站內通知 (notifyfollowernewsession)
#
# 【完全私密 —— 這是硬規則，不是偏好】
# 主辦者不可以知道誰追隨他，也不可以知道有幾人。所以：
#   * 沒有任何端點以 followuserid 為查詢主體、把結果回給那個人
#   * 沒有任何 COUNT / 追隨人數欄位
#   * editfollow / deletefollow 連 permission>=4 的管理員都不放行
#     （club.py 的 getclub 那種 `or 4<=int(permission)` 的形狀刻意不抄過來）
# 唯一以 followuserid 查的地方是 notifyfollowernewsession 的收件人查詢，
# 那個結果只會變成收件人自己的 notification 列，不回給主辦者。
#
# 【API 不回主辦者姓名】
# 全站目前沒有任何地方顯示「這場是誰主辦的」（getsession 只回 clubname），
# 這個性質要保持。畫面上的標籤一律由協會名稱組出來。
# ===========================================================================

import json

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *
from .authhelper import gettokenuser as commonauthuser
from .notification import notifyeventbatch

# 「這個使用者看得到哪些**別人的**場次」。
#
# 與 session.py:459-474 accessraw 的後三支 (registration / userstaff / sessionstaff) 等價，
# 只是改寫成 EXISTS。這條同時是「可追隨清單」的來源、也是 newfollow 的授權判準 ——
# 兩者共用同一份定義，才不會出現「追得到，但『追隨中』永遠篩不出東西」。
#
# 參數順序：userid(不是自己), userid(已報名), userid(全域員工), userid(單場員工)
VISIBLEOTHERSESSIONSQL="""
	s."deletetime" IS NULL AND s."owned"=true AND s."userid"<>%s
	AND (
		(
			s."linkuser"=true
			AND (
				COALESCE(s."private",false)=false
				OR EXISTS(SELECT 1 FROM "sessionplayer" p WHERE p."sessionid"=s."id" AND p."userid"=%s AND p."deletetime" IS NULL)
			)
		)
		OR EXISTS(SELECT 1 FROM "userstaff" us WHERE us."userid"=s."userid" AND us."staffuserid"=%s AND us."status"='active' AND us."deletetime" IS NULL)
		OR EXISTS(SELECT 1 FROM "sessionstaff" ss WHERE ss."sessionid"=s."id" AND ss."staffuserid"=%s AND ss."status"='active' AND ss."deletetime" IS NULL)
	)
"""

TARGETLIMITDEFAULT=100
TARGETLIMITMAX=200


def followint(value,fallback=0):
	try:
		return int(value)
	except Exception as error:
		return fallback


def followbool(value):
	"""與 session.py 的 _bool 同一套判定。

	**不可以用 Python 的 bool()** —— validate 的 boolean 規則放行字串 "0"，
	而 bool("0") 是 True，通知開關會變成關不掉。
	"""
	if value==True or value==1 or value=="1" or value=="true" or value=="True":
		return True
	return False


def visibleclubrow(userid,followuserid=0):
	"""使用者看得到的「主辦者 + 地點」組合，附最近一場的時間。

	club 用 INNER JOIN：已軟刪的地點不該出現在可追隨清單裡。
	followuserid 給 0 表示不限定主辦者。
	"""
	param=[userid,userid,userid,userid]
	wheresql=VISIBLEOTHERSESSIONSQL
	if followuserid:
		wheresql=wheresql+""" AND s."userid"=%s"""
		param.append(followuserid)
	return query(SETTING["dbname"],f"""
		SELECT s."userid" AS "followuserid",s."clubid",c."name" AS "clubname",MAX(s."starttime") AS "lastsessiontime"
		FROM "session" s
		JOIN "club" c ON c."id"=s."clubid" AND c."deletetime" IS NULL
		WHERE {wheresql}
		GROUP BY s."userid",s."clubid",c."name"
		ORDER BY MAX(s."starttime") DESC
	""",param,SETTING["dbsetting"]) or []


def myfollowrow(userid,followuserid=0):
	param=[userid]
	wheresql=""""userid"=%s AND "deletetime" IS NULL"""
	if followuserid:
		wheresql=wheresql+""" AND "followuserid"=%s"""
		param.append(followuserid)
	return query(SETTING["dbname"],f"""SELECT "id","followuserid","clubid","notifyed" FROM "userfollow" WHERE {wheresql} ORDER BY "id" """,param,SETTING["dbsetting"]) or []


def groupfollowstate(followrow):
	"""把追隨列收攏成「以主辦者為單位」的狀態。

	畫面是一位主辦者一張卡，所以資料也要以主辦者為單位；
	notifyed 在同一位主辦者底下一律保持一致（newfollow 會整組寫同一個值）。
	"""
	state={}
	for item in followrow:
		key=item["followuserid"]
		if key not in state:
			state[key]={"allclubed": False,"notifyed": True,"clubidlist": [],"followidlist": []}
		state[key]["followidlist"].append(item["id"])
		state[key]["notifyed"]=bool(item["notifyed"])
		if item["clubid"] is None:
			state[key]["allclubed"]=True
		else:
			state[key]["clubidlist"].append(item["clubid"])
	return state


@api_view(["GET"])
def getfollowtargetlist(request):
	"""可追隨的主辦者與他們的地點。

	刻意**不**從 club 表或 user 表列舉 —— 從「使用者本來就看得到的場次」反推，
	所以清單裡不會出現任何他看不到的東西，也不會變成「這個帳號存不存在」的探測介面。
	"""
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	limit=followint(request.GET.get("limit"),TARGETLIMITDEFAULT)
	if limit<=0 or TARGETLIMITMAX<limit:
		limit=TARGETLIMITDEFAULT
	keyword=request.GET.get("keyword") or ""

	clubrow=visibleclubrow(tokenuserrow["id"])
	state=groupfollowstate(myfollowrow(tokenuserrow["id"]))

	targetof={}
	orderlist=[]
	for item in clubrow:
		if keyword and keyword.lower() not in (item["clubname"] or "").lower():
			continue
		key=item["followuserid"]
		if key not in targetof:
			followstate=state.get(key) or {"allclubed": False,"notifyed": True,"clubidlist": [],"followidlist": []}
			targetof[key]={
				"followuserid": key,
				"followed": 0<len(followstate["followidlist"]),
				"allclubed": followstate["allclubed"],
				"notifyed": followstate["notifyed"],
				"followclubidlist": followstate["clubidlist"],
				"clublist": [],
				"lastsessiontime": item["lastsessiontime"]
			}
			orderlist.append(key)
		targetof[key]["clublist"].append({
			"clubid": item["clubid"],
			"clubname": item["clubname"],
			"lastsessiontime": item["lastsessiontime"]
		})

	targetlist=[]
	for key in orderlist:
		if len(targetlist)<limit:
			targetlist.append(targetof[key])

	return Response({
		"success": True,
		"data": {"followtargetlist": targetlist}
	},status.HTTP_200_OK)


@api_view(["GET"])
def getfollowlist(request):
	"""我的追隨清單，以主辦者為單位。

	user 用 INNER JOIN：對方帳號已軟刪就不顯示（列留著不動，沒有意義但也不急著清）。
	"""
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	followrow=query(SETTING["dbname"],f"""
		SELECT f."id",f."followuserid",f."clubid",f."notifyed"
		FROM "userfollow" f
		JOIN "user" u ON u."id"=f."followuserid" AND u."deletetime" IS NULL
		WHERE f."userid"=%s AND f."deletetime" IS NULL
		ORDER BY f."id"
	""",[tokenuserrow["id"]],SETTING["dbsetting"]) or []
	state=groupfollowstate(followrow)

	# 標籤與地點勾選都要用「我看得到的地點」，不能用 club 表全表
	clubrow=visibleclubrow(tokenuserrow["id"])
	clubof={}
	for item in clubrow:
		key=item["followuserid"]
		if key not in clubof:
			clubof[key]=[]
		clubof[key].append({"clubid": item["clubid"],"clubname": item["clubname"]})

	followlist=[]
	for key in state:
		item=state[key]
		followlist.append({
			"followuserid": key,
			"allclubed": item["allclubed"],
			"notifyed": item["notifyed"],
			"followclubidlist": item["clubidlist"],
			"clublist": clubof.get(key) or []
		})

	return Response({
		"success": True,
		"data": {"followlist": followlist}
	},status.HTTP_200_OK)


@api_view(["POST"])
def newfollow(request):
	"""建立或更新對某位主辦者的追隨範圍。

	這一支是**整組取代**：body 描述的是「我對這位主辦者最終想要的範圍」，
	不是「再加一筆」。所以它同時是新增與改範圍，重送也不會產生第二筆
	（配合 userfollow 的兩個部分唯一索引，連點也只會有一組）。

	body:
	  followuserid  必填
	  allclubed     true = 全部地點；false = 只追 clubidlist 裡的地點
	  clubidlist    allclubed 為 false 時必填，至少一個
	  notifyed      這位主辦者開新場次時要不要通知（整組同一個值）
	"""
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	requestdata=validate(json.loads(request.body),{
		"followuserid": "required|string",
		"allclubed": "boolean",
		"notifyed": "boolean"
	},{
		"required": "ERROR_request_data_not_found",
		"string": "ERROR_request_data_type_error",
		"boolean": "ERROR_request_data_type_error",
		"integer": "ERROR_request_data_type_error"
	})
	if requestdata["error"] is not None:
		return errorresponse(requestdata["error"])

	data=requestdata["data"]
	followuserid=followint(data.get("followuserid"))
	allclubed=True
	if data.get("allclubed") is not None:
		allclubed=followbool(data.get("allclubed"))
	notifyed=True
	if data.get("notifyed") is not None:
		notifyed=followbool(data.get("notifyed"))

	clubidlist=[]
	rawclubidlist=data.get("clubidlist")
	if isinstance(rawclubidlist,list):
		for item in rawclubidlist:
			clubid=followint(item)
			if clubid and clubid not in clubidlist:
				clubidlist.append(clubid)

	if followuserid<=0:
		return errorresponse("ERROR_request_data_type_error")
	if followuserid==tokenuserrow["id"]:
		return errorresponse("ERROR_cannot_follow_self")
	if not allclubed and not clubidlist:
		return errorresponse("ERROR_request_data_not_found")

	# 這一步同時擋掉「追不存在的人」「追已軟刪的帳號」「追一個我看不到的地點」三件事。
	# 刻意不去查 user / club 表 —— 查了就會讓「這個 id 存不存在」變成可探測的資訊。
	visiblerow=visibleclubrow(tokenuserrow["id"],followuserid)
	if not visiblerow:
		return errorresponse("ERROR_follow_target_not_found")
	visibleclubidlist=[]
	for item in visiblerow:
		visibleclubidlist.append(item["clubid"])
	for clubid in clubidlist:
		if clubid not in visibleclubidlist:
			return errorresponse("ERROR_follow_target_not_found")

	existrow=myfollowrow(tokenuserrow["id"],followuserid)
	keepidlist=[]
	sqllist=[]
	if allclubed:
		# 追全部地點時，同一位主辦者底下的地點粒度列全部被涵蓋，一律收掉
		allrowid=0
		for item in existrow:
			if item["clubid"] is None and not allrowid:
				allrowid=item["id"]
			else:
				sqllist.append(["""UPDATE "userfollow" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "id"=%s""",[item["id"]]])
		if allrowid:
			sqllist.append(["""UPDATE "userfollow" SET "notifyed"=%s,"updatetime"=NOW() WHERE "id"=%s""",[notifyed,allrowid]])
			keepidlist.append(allrowid)
		else:
			sqllist.append(["""INSERT INTO "userfollow"("userid","followuserid","clubid","notifyed")VALUES(%s,%s,NULL,%s)""",[tokenuserrow["id"],followuserid,notifyed]])
	else:
		existclubidlist=[]
		for item in existrow:
			if item["clubid"] is None or item["clubid"] not in clubidlist or item["clubid"] in existclubidlist:
				sqllist.append(["""UPDATE "userfollow" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "id"=%s""",[item["id"]]])
			else:
				existclubidlist.append(item["clubid"])
				sqllist.append(["""UPDATE "userfollow" SET "notifyed"=%s,"updatetime"=NOW() WHERE "id"=%s""",[notifyed,item["id"]]])
				keepidlist.append(item["id"])
		for clubid in clubidlist:
			if clubid not in existclubidlist:
				sqllist.append(["""INSERT INTO "userfollow"("userid","followuserid","clubid","notifyed")VALUES(%s,%s,%s,%s)""",[tokenuserrow["id"],followuserid,clubid,notifyed]])

	result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")

	return Response({
		"success": True,
		"data": {"followuserid": followuserid,"allclubed": allclubed,"notifyed": notifyed}
	},status.HTTP_200_OK)


@api_view(["PUT"])
def editfollow(request,followuserid):
	"""只改通知開關。

	畫面是一位主辦者一張卡、一顆通知開關，所以這裡也以主辦者為單位：
	同一位主辦者底下的每一列都改成同一個值，資料才不會出現
	「台北館會通知、板橋館不會」這種卡片顯示不出來的狀態。
	"""
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	requestdata=validate(json.loads(request.body),{
		"notifyed": "boolean"
	},{
		"required": "ERROR_request_data_not_found",
		"string": "ERROR_request_data_type_error",
		"boolean": "ERROR_request_data_type_error"
	})
	if requestdata["error"] is not None:
		return errorresponse(requestdata["error"])

	notifyed=followbool(requestdata["data"].get("notifyed"))
	targetid=followint(followuserid)
	existrow=myfollowrow(tokenuserrow["id"],targetid)
	if not existrow:
		return errorresponse("ERROR_follow_not_found")

	query(SETTING["dbname"],f"""UPDATE "userfollow" SET "notifyed"=%s,"updatetime"=NOW() WHERE "userid"=%s AND "followuserid"=%s AND "deletetime" IS NULL""",[notifyed,tokenuserrow["id"],targetid],SETTING["dbsetting"])

	return Response({
		"success": True,
		"data": {"followuserid": targetid,"notifyed": notifyed}
	},status.HTTP_200_OK)


@api_view(["DELETE"])
def deletefollow(request,followuserid):
	"""取消追隨這位主辦者（他底下的每一列都軟刪）。"""
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	targetid=followint(followuserid)
	existrow=myfollowrow(tokenuserrow["id"],targetid)
	if not existrow:
		return errorresponse("ERROR_follow_not_found")

	query(SETTING["dbname"],f"""UPDATE "userfollow" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "userid"=%s AND "followuserid"=%s AND "deletetime" IS NULL""",[tokenuserrow["id"],targetid],SETTING["dbsetting"])

	return Response({
		"success": True,
		"data": ""
	},status.HTTP_200_OK)


def notifyfollowernewsession(sessionrow,namesuffix=""):
	"""追隨的主辦者建立新場次時通知追隨者。回傳實際寫入的通知筆數。

	整支包 try/except：通知失敗絕不可以讓建立場次的請求失敗（比照 notification.py 的 notifyevent）。

	namesuffix 給批次建立多日賽用（例如「(3 個 Day)」）：一次建 N 場只發一則，
	所以要在賽事名後面說清楚這一則涵蓋幾場。
	"""
	try:
		if not sessionrow:
			return 0
		sessionid=sessionrow.get("id")
		ownerid=sessionrow.get("userid")
		clubid=sessionrow.get("clubid")
		if not sessionid or not ownerid:
			return 0

		# 可見性守門：這三種情況別人根本打不開這個場次
		# （session.py 的 access CTE 與 getsession 的權限判定），
		# 發了等於送出一個點進去會拿到 ERROR_no_permission 的連結。
		# private 場次的可見條件是「已報名」，而剛建立的場次沒有任何報名者，
		# 所以合法收件人必然是 0 個。
		if not sessionrow.get("owned"):
			return 0
		if not sessionrow.get("linkuser"):
			return 0
		if sessionrow.get("private"):
			return 0

		# 去重守門：一個場次一輩子只發一次「新場次」通知。
		# 涵蓋「同一個 sessionid 被兩條路徑各掛一次」與重試。
		doner=query(SETTING["dbname"],f"""SELECT 1 FROM "notification" WHERE "sessionid"=%s AND "type"='sessionnew' LIMIT 1""",[sessionid],SETTING["dbsetting"])
		if doner:
			return 0

		# 收件人。最後那個 clubid 條件與 session.py 的 quickfilter=followed
		# **是同一個形狀，兩處必須永遠一致**。
		recipientrow=query(SETTING["dbname"],f"""
			SELECT DISTINCT f."userid"
			FROM "userfollow" f
			JOIN "user" u ON u."id"=f."userid" AND u."deletetime" IS NULL
			WHERE f."followuserid"=%s
			  AND f."deletetime" IS NULL
			  AND f."notifyed"=true
			  AND f."userid"<>%s
			  AND (f."clubid" IS NULL OR f."clubid"=%s)
		""",[ownerid,ownerid,clubid],SETTING["dbsetting"]) or []
		recipientlist=[]
		for item in recipientrow:
			recipientlist.append(item["userid"])
		if not recipientlist:
			return 0

		# 標籤用協會名稱不用主辦者姓名：全站沒有任何地方顯示「這場是誰主辦的」
		clubname=""
		clubrow=query(SETTING["dbname"],f"""SELECT "name" FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[clubid],SETTING["dbsetting"])
		if clubrow:
			clubname=clubrow[0]["name"] or ""
		sessionname=(sessionrow.get("name") or "")+namesuffix

		# 中英寫在同一則，比照 schedulerjob.py 的場次即將開始通知
		title="追隨的主辦單位發布新賽事 New event from an organizer you follow"
		message="「"+clubname+"」發布了新賽事「"+sessionname+"」。\""+clubname+"\" posted a new event \""+sessionname+"\"."
		return notifyeventbatch(recipientlist,sessionid,"sessionnew",title,message)
	except Exception as error:
		return 0
