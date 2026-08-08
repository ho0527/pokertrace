# import
import bcrypt
import hashlib
import json
import random
import re
import datetime
# import google.oauth2.id_token
from django.http import HttpResponse,HttpResponseRedirect,JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view,renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
# from google.oauth2 import id_token
# from google.auth.transport import requests

# 自創
from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *
from .sessionplayer import _attachfinance
from .timer import ensuretimertables,buildtimerstate,broadcasttimerupdate,linkedcounts,normalizeaccentcolor,normalizebrandlogourl,normalizehiddenblock,normalizecolumnorder,userdisplaydefault
from .authhelper import gettokenuser as commonauthuser

# main START
def getmyregistrationfinance(sessionrow,userid):
	regrow=query(SETTING["dbname"],
		f"""SELECT sp.*, tp."place" AS timerplace, tp."status" AS timerstatus
		   FROM "sessionplayer" sp
		   LEFT JOIN "sessiontimerplayer" tp ON tp."sessionid"=sp."sessionid" AND tp."userid"=sp."userid" AND tp."deletetime" IS NULL
		   WHERE sp."sessionid"=%s AND sp."userid"=%s AND sp."deletetime" IS NULL""",
		[sessionrow["id"],userid],
		SETTING["dbsetting"]
	)
	if not regrow:
		return None
	regrow=_attachfinance(sessionrow,regrow)
	return regrow[0]

def _num(value,defaultvalue=0):
	try:
		if value is None or value=="":
			return float(defaultvalue or 0)
		return float(value)
	except Exception as error:
		return float(defaultvalue or 0)

def _int(value,defaultvalue=0):
	try:
		if value is None or value=="":
			return defaultvalue
		return int(value)
	except Exception as error:
		return defaultvalue

def _bool(value):
	if value==True or value==1 or value=="1" or value=="true" or value=="True":
		return True
	return False

def _timerplayersended(players):
	if not players:
		return False
	for i in range(len(players)):
		if players[i].get("registrationstatus")!="advanced" and _int(players[i].get("place"),0)<=0:
			return False
	return True

def _timeractivecount(players):
	active=0
	for i in range(len(players)):
		if players[i].get("status")=="active" and players[i].get("registrationstatus")!="advanced":
			active=active+1
	return active

def _sessiontimerendedbyplayers(totalentries,players):
	if _timerplayersended(players):
		return True
	if len(players)<=0 and totalentries<=0:
		return False
	return _timeractivecount(players)<=1

def _sessiontimerstatus(row):
	data={
		"regclosed": False,
		"sessionended": False
	}
	if not row or not _bool(row.get("owned")) or not _bool(row.get("linkuser")):
		return data
	try:
		state=buildtimerstate(row["id"])
		if state:
			data["regclosed"]=_bool(state.get("regClosed"))
			players=state.get("linkedPlayers") or []
			totalentries=_int(state.get("totalEntries"),0)
			data["sessionended"]=_sessiontimerendedbyplayers(totalentries,players)
	except Exception as error:
		printcolorhaveline("fail","[ERROR] sessiontimerstatus "+str(error),"")
	return data

def _sessiondurationminutes(row):
	try:
		return int((row["endtime"]-row["starttime"]).total_seconds()/60)
	except Exception as error:
		return 0

def _sessionprofit(row):
	if row.get("owned")==True and row.get("linkuser")==True and row.get("myregistration"):
		return _num(row["myregistration"].get("profit"),0)
	buyintotal=_num(row.get("buyin"),0)+_num(row.get("buyinfee"),0)
	rebuytotal=_num(row.get("rebuybuyin"),0)+_num(row.get("rebuyfee"),0)
	reentrytotal=_num(row.get("reentrybuyin"),0)+_num(row.get("reentryfee"),0)
	addontotal=_num(row.get("addonbuyin"),0)+_num(row.get("addonfee"),0)
	return _num(row.get("winprice"),0)-(
		buyintotal
		+rebuytotal*_num(row.get("rebuycount"),0)
		+reentrytotal*_num(row.get("reentrycount"),0)
		+addontotal*_num(row.get("addoncount"),0)
	)

def _sessionshowmoney(row):
	if row.get("isstaff")==True:
		return False
	if row.get("isown")==False and row.get("owned")==True:
		return row.get("myregistrationstatus")=="confirmed" or row.get("myregistrationstatus")=="advanced"
	if row.get("isown")==True and row.get("owned")==False:
		return True
	return False

def _multidayremainingcount(sessionid):
	# 晉級進此場的總人數 = 從來源場 (targetid=sessionid) advance 進來且已 advancetime 的玩家。
	# 不可把 sessionid 轉址到它自己的下一日 target: 中間日 (Day2) 既是前一日的 target
	# 也是下一日的 source, 轉址會改去算「晉級進下一日」的人數, 與此場無關。
	row=query(SETTING["dbname"],f"""
		SELECT COUNT(DISTINCT sp."userid") AS count
		FROM "sessionrelation" sr
		JOIN "sessionplayer" sp ON sp."sessionid"=sr."sourceid" AND sp."deletetime" IS NULL
		WHERE sr."targetid"=%s AND sr."relationtype"='multiday' AND sr."deletetime" IS NULL
		  AND sp."advancetargetid"=%s AND sp."advancetime" IS NOT NULL
	""",[sessionid,sessionid],SETTING["dbsetting"])
	if row and row[0].get("count") is not None:
		return _int(row[0].get("count"),0)
	return 0

def _sessiontimerdisplayplace(sessionid,userid,timerstatus,timerplace,playercount,sessionended,activecount):
	# playercount 必須是唯一玩家數(如 timerplayercount), 不能用含 reentry 的總入場次數,
	# 否則會跟 finalizetimerpendingplaces 用的 registeredcount(唯一玩家數) 對不上, 名次會偏掉
	place=_int(timerplace,0)
	if 0<place:
		return place
	if timerstatus=="active" and sessionended and activecount<=1:
		return 1
	if timerstatus!="eliminated" or playercount<=0:
		return None
	try:
		row=query(SETTING["dbname"],f"""
			SELECT COUNT(other."id") AS count
			FROM "sessiontimerplayer" cur
			JOIN "sessiontimerplayer" other ON other."sessionid"=cur."sessionid"
			 AND other."status"='eliminated'
			 AND other."deletetime" IS NULL
			 AND (
			    other."eliminatedtime"<cur."eliminatedtime"
			    OR (other."eliminatedtime"=cur."eliminatedtime" AND other."id"<=cur."id")
			 )
			WHERE cur."sessionid"=%s AND cur."userid"=%s AND cur."status"='eliminated' AND cur."deletetime" IS NULL
		""",[sessionid,userid],SETTING["dbsetting"])
		if row and row[0].get("count"):
			return playercount-_int(row[0].get("count"),0)+1
	except Exception as error:
		printcolorhaveline("fail","[ERROR] sessiontimerdisplayplace "+str(error),"")
	return None

def _filtermatches(row,startdate,enddate,club,gametype,name):
	try:
		if startdate and row["starttime"].date()<datetime.date.fromisoformat(startdate):
			return False
	except Exception as error:
		pass
	try:
		if enddate and row["endtime"].date()>datetime.date.fromisoformat(enddate):
			return False
	except Exception as error:
		pass
	if club and str(row.get("clubid"))!=str(club) and club not in (row.get("clubname") or ""):
		return False
	if gametype and gametype!="all" and row.get("gametype")!=gametype:
		return False
	if name and name.lower() not in (row.get("name") or "").lower():
		return False
	return True

def _sessionrelations(sessionid):
	rows=query(SETTING["dbname"],
		f"""SELECT sr.*, s."name" AS targetname, s."token" AS targettoken, s."starttime" AS targetstarttime
		   FROM "sessionrelation" sr
		   JOIN "session" s ON s."id"=sr."targetid" AND s."deletetime" IS NULL
		   WHERE sr."sourceid"=%s AND sr."deletetime" IS NULL
		   ORDER BY sr."relationtype" ASC, s."starttime" ASC""",
		[sessionid],
		SETTING["dbsetting"]
	)
	return rows or []

def _sessionrelationdata(sessionid):
	data={
		"outgoing": _sessionrelations(sessionid),
		"incoming": query(SETTING["dbname"],
			f"""SELECT sr.*, s."name" AS sourcename, s."token" AS sourcetoken, s."starttime" AS sourcestarttime
			   FROM "sessionrelation" sr
			   JOIN "session" s ON s."id"=sr."sourceid" AND s."deletetime" IS NULL
			   WHERE sr."targetid"=%s AND sr."deletetime" IS NULL
			   ORDER BY sr."relationtype" ASC, s."starttime" ASC""",
			[sessionid],
			SETTING["dbsetting"]
		) or []
	}
	return data

def _sessionchips(sessionid):
	rows=query(SETTING["dbname"],f"""SELECT*FROM "sessionchip" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC,"value" ASC,"id" ASC""",[sessionid],SETTING["dbsetting"])
	if rows:
		return rows
	return [
		{"shape": "circle","value": 100,"color": "#ffffff","sortorder": 1},
		{"shape": "circle","value": 500,"color": "#ef4444","sortorder": 2},
		{"shape": "circle","value": 1000,"color": "#f59e0b","sortorder": 3},
		{"shape": "circle","value": 5000,"color": "#22c55e","sortorder": 4},
		{"shape": "circle","value": 10000,"color": "#3b82f6","sortorder": 5}
	]

def _savesessionchips(sessionid,chips):
	query(SETTING["dbname"],f"""UPDATE "sessionchip" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	for i in range(len(chips or [])):
		item=chips[i]
		value=_int(item.get("value"),0)
		if value<=0:
			continue
		shape=item.get("shape") or "circle"
		if shape!="square":
			shape="circle"
		color=item.get("color") or "#888888"
		queryinsert(SETTING["dbname"],"sessionchip",{
			"sessionid": sessionid,
			"shape": shape,
			"value": value,
			"color": color,
			"sortorder": i+1
		},SETTING["dbsetting"])

def _sessiontimerautostart(sessionid):
	try:
		ensuretimertables()
		row=query(SETTING["dbname"],f"""SELECT "autostartbytime" FROM "sessiontimerconfig" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if row:
			return _bool(row[0].get("autostartbytime"))
	except Exception as error:
		printcolorhaveline("fail","[ERROR] sessiontimerautostart "+str(error),"")
	return False

def _sessionschedule(sessionid):
	try:
		rows=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerlevel" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionid],SETTING["dbsetting"])
	except Exception as error:
		return []
	schedule=[]
	for i in range(len(rows or [])):
		row=rows[i]
		item={
			"type": row.get("type") or "level",
			"dur": _int(row.get("durationminutes"),20)
		}
		if item["type"]=="level":
			item["sb"]=_int(row.get("smallblind"),0)
			item["bb"]=_int(row.get("bigblind"),0)
			item["ante"]=_int(row.get("ante"),0)
			item["timemode"]=row.get("timemode") or "time"
			item["handTargetCount"]=_int(row.get("handtargetcount"),0)
			item["handCount"]=_int(row.get("handcount"),0)
		if _bool(row.get("regcloseafter")):
			item["regCloseAfter"]=True
		try:
			item["chipRaiseValues"]=json.loads(row.get("chipraisevalues") or "[]")
		except Exception as error:
			item["chipRaiseValues"]=[]
		schedule.append(item)
	return schedule

def _savesessiontimerautostart(sessionid,value,name):
	try:
		ensuretimertables()
		row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerconfig" WHERE "sessionid"=%s""",[sessionid],SETTING["dbsetting"])
		data={
			"autostartbytime": _bool(value),
			"updatetime": nowtime(),
			"deletetime": None
		}
		if row:
			queryupdate(SETTING["dbname"],"sessiontimerconfig",data,{"sessionid": sessionid},SETTING["dbsetting"])
		else:
			data["sessionid"]=sessionid
			data["tournname"]=name or ""
			queryinsert(SETTING["dbname"],"sessiontimerconfig",data,SETTING["dbsetting"])
		state=buildtimerstate(sessionid)
		if state:
			broadcasttimerupdate(sessionid,state)
	except Exception as error:
		printcolorhaveline("fail","[ERROR] savesessiontimerautostart "+str(error),"")

def _syncsessiontimername(sessionid,name):
	if not name:
		return
	try:
		ensuretimertables()
		row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerconfig" WHERE "sessionid"=%s""",[sessionid],SETTING["dbsetting"])
		if row:
			queryupdate(SETTING["dbname"],"sessiontimerconfig",{
				"tournname": name,
				"updatetime": nowtime(),
				"deletetime": None
			},{"sessionid": sessionid},SETTING["dbsetting"])
		else:
			queryinsert(SETTING["dbname"],"sessiontimerconfig",{
				"sessionid": sessionid,
				"tournname": name,
				"subtitle": "",
				"updatetime": nowtime()
			},SETTING["dbsetting"])
		state=buildtimerstate(sessionid)
		if state:
			broadcasttimerupdate(sessionid,state)
	except Exception as error:
		printcolorhaveline("fail","[ERROR] syncsessiontimername "+str(error),"")

def _gettokenuser(request):
	return commonauthuser(request)

sessionsettingcolumnsensured=False

def ensuresessionsettingcolumns():
	# 顯示端品牌與轉播設定欄位 (檢查表 3.3): ADD COLUMN IF NOT EXISTS 雖冪等, 但每次請求都跑會反覆對 session 表取鎖,
	# 比照 timer.py ensuretimertables 的 ensure 模式再加模組層旗標, 每個行程只執行一次
	global sessionsettingcolumnsensured
	if sessionsettingcolumnsensured:
		return
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS brandname varchar(120) DEFAULT ''""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS brandcolor varchar(20) DEFAULT ''""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS brandlogo text DEFAULT ''""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS displayfields varchar(300) DEFAULT ''""",[],SETTING["dbsetting"])
	# 三欄順序 (TASK-022)。既有品牌設定只做到顯示/隱藏, 沒有順序。
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS columnorder varchar(50) DEFAULT ''""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS raisecap bigint NOT NULL DEFAULT 4""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS broadcastopen boolean NOT NULL DEFAULT false""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS broadcastdelay integer NOT NULL DEFAULT 0""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS broadcastshowcard boolean NOT NULL DEFAULT true""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS broadcasth4h boolean NOT NULL DEFAULT false""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."session" ADD COLUMN IF NOT EXISTS broadcastreleasedcount integer NOT NULL DEFAULT 0""",[],SETTING["dbsetting"])
	sessionsettingcolumnsensured=True

def _cansessionsetting(sessionid,userrow):
	sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if not sessionrow:
		return (None,False)
	sessionrow=sessionrow[0]
	access=getsessionstaffaccess(sessionid,userrow["id"])
	if sessionrow["userid"]==userrow["id"] or 4<=int(userrow["permission"]) or (access and (access["isown"] or access["isstaff"])):
		return (sessionrow,True)
	return (sessionrow,False)

def _fastsessionlist(request,tokenuserrow):
	startdate=request.GET.get("startdate") or ""
	enddate=request.GET.get("enddate") or ""
	club=request.GET.get("club") or ""
	gametype=request.GET.get("gametype") or ""
	name=request.GET.get("name") or ""
	quickfilter=request.GET.get("quickfilter") or ""
	if quickfilter not in ["registerable","owned","joined"]:
		quickfilter=""
	limit=_int(request.GET.get("limit"),40)
	if limit<=0:
		limit=40
	page=_int(request.GET.get("page"),1)
	if page<=0:
		page=1
	offset=(page-1)*limit
	where=["a.\"deletetime\" IS NULL"]
	params=[tokenuserrow["id"],tokenuserrow["id"],tokenuserrow["id"],tokenuserrow["id"],tokenuserrow["id"],tokenuserrow["id"],tokenuserrow["id"]]
	if startdate:
		where.append("DATE(a.\"starttime\") >= %s")
		params.append(startdate)
	if enddate:
		where.append("DATE(a.\"endtime\") <= %s")
		params.append(enddate)
	if club:
		where.append("(CAST(a.\"clubid\" AS TEXT)=%s OR COALESCE(c.\"name\",'') ILIKE %s)")
		params.append(str(club))
		params.append("%"+club+"%")
	if gametype and gametype!="all":
		where.append("a.\"gametype\"=%s")
		params.append(gametype)
	if name:
		where.append("a.\"name\" ILIKE %s")
		params.append("%"+name+"%")
	if quickfilter=="registerable":
		where.append("""a."owned"=true AND a."linkuser"=true AND a."openregistration"=true
			AND a.isown=false AND a.isstaff=false
			AND LOWER(COALESCE(tr."state"->>'regClosed','false'))<>'true'
			AND COALESCE(sp."status",'')<>'advanced'
			AND NOT (
				(COALESCE(ta."timerplayercount",0)>0 AND COALESCE(ta."timernotplacedcount",0)<=0)
				OR ((COALESCE(ta."timertotalentries",0)>0 OR COALESCE(ta."timerplayercount",0)>0) AND COALESCE(ta."timeractivecount",0)<=1)
			)""")
	if quickfilter=="owned":
		where.append("""a.isown=true AND a."owned"=true""")
	if quickfilter=="joined":
		where.append("""(
			COALESCE(sp."status",'') IN ('registered','confirmed','advanced')
			OR a.isstaff=true
			OR (a.isown=true AND a."owned"=false)
		)""")
	wheresql=" AND ".join(where)

	# 排序（?order=&direction=）。
	#
	# **ORDER BY 的欄位名不能用 %s**（那會變成「依這個字串常數排序」，等於沒排），
	# 所以只能直接插進 SQL —— 也就是說它**必須來自寫死的清單**，
	# 絕不能拿 request 的值去組。request 只能決定「用清單裡的哪一個」。
	#
	# 只開放**顯示值與 SQL 欄位一對一**的三欄。
	# 前端表格還有「買入」與「名次」兩欄，但那兩個顯示值是前端由多個欄位算出來的
	# （getprofitdata），拿任何單一 SQL 欄位去排都會排出與畫面不一致的順序 ——
	# 那種錯不會報，只會讓使用者看到「排序怪怪的」。所以刻意不開放。
	orderof={
		"starttime": "\"starttime\"",
		"name": "\"name\"",
		"profit": "statprofit"
	}
	ordersql="\"starttime\" DESC, \"id\" DESC"
	orderkey=request.GET.get("order") or ""
	if orderkey in orderof:
		direction="ASC"
		if (request.GET.get("direction") or "").lower()=="desc":
			direction="DESC"
		# NULLS LAST 與前端 ptsortcompare 一致（取不到值一律排最後）；
		# 補 "id" DESC 當穩定的次要排序鍵，否則同值的列在分頁之間順序未定義，
		# 同一筆可能在兩頁都出現、也可能兩頁都沒有。
		ordersql=orderof[orderkey]+" "+direction+" NULLS LAST, \"id\" DESC"

	params.append(limit)
	params.append(offset)
	row=query(SETTING["dbname"],f"""
		SELECT * FROM (
		WITH accessraw AS (
			SELECT s.*, true AS isown, false AS isstaff, 'owner' AS accessrole, 'owner' AS accesssource, s."userid" AS accessownerid, 1 AS accesspriority
			FROM "session" s
			WHERE s."userid"=%s AND s."deletetime" IS NULL
			UNION ALL
			SELECT s.*, false AS isown, true AS isstaff, us."role" AS accessrole, 'userstaff' AS accesssource, us."userid" AS accessownerid, 2 AS accesspriority
			FROM "userstaff" us
			JOIN "session" s ON s."userid"=us."userid"
			WHERE us."staffuserid"=%s AND us."status"='active' AND us."deletetime" IS NULL AND s."owned"=true AND s."deletetime" IS NULL
			UNION ALL
			SELECT s.*, false AS isown, true AS isstaff, ss."role" AS accessrole, 'sessionstaff' AS accesssource, s."userid" AS accessownerid, 3 AS accesspriority
			FROM "sessionstaff" ss
			JOIN "session" s ON s."id"=ss."sessionid"
			WHERE ss."staffuserid"=%s AND ss."status"='active' AND ss."deletetime" IS NULL AND s."owned"=true AND s."deletetime" IS NULL
			UNION ALL
			SELECT s.*, false AS isown, false AS isstaff, '' AS accessrole, 'registration' AS accesssource, s."userid" AS accessownerid, 4 AS accesspriority
			FROM "session" s
			WHERE s."owned"=true AND s."linkuser"=true AND s."userid"<>%s AND s."deletetime" IS NULL
			  AND (COALESCE(s."private",false)=false OR EXISTS(SELECT 1 FROM "sessionplayer" p WHERE p."sessionid"=s."id" AND p."userid"=%s AND p."deletetime" IS NULL))
		),
		access AS (
			SELECT DISTINCT ON ("id") *
			FROM accessraw
			ORDER BY "id", accesspriority
		),
		filtered AS (
			SELECT a.*, c."name" AS clubname,
			       sp."id" AS myregistrationid, sp."status" AS myregistrationstatus, sp."buyin" AS mybuyin, sp."fee" AS myfee,
			       sp."rebuycount" AS myrebuycount, sp."reentrycount" AS myreentrycount, sp."addoncount" AS myaddoncount,
			       sp."paymenttype" AS mypaymenttype, sp."ticketvalue" AS myticketvalue, sp."prize" AS myprize,
			       sp."prizeoverride" AS myprizeoverride, sp."place" AS myplace, tp."place" AS mytimerplace,
			       tp."status" AS mytimerstatus,
			       CASE WHEN LOWER(COALESCE(tr."state"->>'regClosed','false'))='true' THEN true ELSE false END AS timerregclosed,
			       COALESCE(ta."timerplayercount",0) AS timerplayercount,
			       COALESCE(ta."timernotplacedcount",0) AS timernotplacedcount,
			       COALESCE(ta."timeractivecount",0) AS timeractivecount,
			       COALESCE(ta."timertotalentries",0) AS timertotalentries,
			       COALESCE(ra."realtotalentries",0) AS realtotalentries,
			       CASE
			           WHEN sp."id" IS NULL THEN NULL
			           WHEN sp."paymenttype"='ticket' THEN COALESCE(a."ticketvalue",0)*(1+COALESCE(sp."reentrycount",0))
			           ELSE COALESCE(a."buyin",0)+COALESCE(a."buyinfee",0)
			       END
			       + (COALESCE(a."rebuybuyin",0)+COALESCE(a."rebuyfee",0))*COALESCE(sp."rebuycount",0)
			       + (COALESCE(a."reentrybuyin",0)+COALESCE(a."reentryfee",0))*COALESCE(sp."reentrycount",0)
			       + (COALESCE(a."addonbuyin",0)+COALESCE(a."addonfee",0))*COALESCE(sp."addoncount",0) AS mycost,
			       COALESCE(sp."prizeoverride",sp."prize",0) AS myfinalprize
			FROM access a
			LEFT JOIN "club" c ON c."id"=a."clubid" AND c."deletetime" IS NULL
			LEFT JOIN "sessionplayer" sp ON sp."sessionid"=a."id" AND sp."userid"=%s AND sp."deletetime" IS NULL
			LEFT JOIN "sessiontimerplayer" tp ON tp."sessionid"=a."id" AND tp."userid"=%s AND tp."deletetime" IS NULL
			LEFT JOIN "sessiontimer" tr ON tr."sessionid"=a."id" AND tr."deletetime" IS NULL
			LEFT JOIN (
				SELECT tp."sessionid",
				       COUNT(tp."id") AS timerplayercount,
				       SUM(CASE WHEN sp."status"<>'advanced' AND COALESCE(tp."place",0)<=0 THEN 1 ELSE 0 END) AS timernotplacedcount,
				       SUM(CASE WHEN tp."status"='active' AND sp."status"<>'advanced' THEN 1 ELSE 0 END) AS timeractivecount,
				       SUM(1+COALESCE(sp."reentrycount",0)) AS timertotalentries
				FROM "sessiontimerplayer" tp
				JOIN "sessionplayer" sp ON sp."id"=tp."sessionplayerid"
				WHERE tp."deletetime" IS NULL AND sp."status" IN ('confirmed','advanced') AND sp."deletetime" IS NULL
				GROUP BY tp."sessionid"
			) ta ON ta."sessionid"=a."id"
			LEFT JOIN (
				SELECT sp."sessionid", SUM(1+COALESCE(sp."reentrycount",0)) AS realtotalentries
				FROM "sessionplayer" sp
				WHERE sp."status" IN ('confirmed','advanced') AND sp."deletetime" IS NULL
				GROUP BY sp."sessionid"
			) ra ON ra."sessionid"=a."id"
			WHERE {wheresql}
		),
		scored AS (
			SELECT *,
			       CASE WHEN isstaff=false AND ((isown=false AND owned=true AND myregistrationstatus IN ('confirmed','advanced')) OR (isown=true AND owned=false)) THEN 1 ELSE 0 END AS statcount,
			       CASE
			           WHEN isstaff=false AND isown=false AND owned=true AND myregistrationstatus IN ('confirmed','advanced') THEN COALESCE(myfinalprize,0)-COALESCE(mycost,0)
			           WHEN isstaff=false AND isown=true AND owned=false THEN COALESCE(winprice,0)-(
			               (COALESCE(buyin,0)+COALESCE(buyinfee,0))
			               +((COALESCE(rebuybuyin,0)+COALESCE(rebuyfee,0))*COALESCE(rebuycount,0))
			               +((COALESCE(reentrybuyin,0)+COALESCE(reentryfee,0))*COALESCE(reentrycount,0))
			               +((COALESCE(addonbuyin,0)+COALESCE(addonfee,0))*COALESCE(addoncount,0))
			           )
			           ELSE 0
			       END AS statprofit,
			       CASE WHEN isstaff=false AND ((isown=false AND owned=true AND myregistrationstatus IN ('confirmed','advanced')) OR (isown=true AND owned=false)) THEN EXTRACT(EPOCH FROM (endtime-starttime))/60 ELSE NULL END AS statduration
			FROM filtered
		)
		SELECT *, COUNT(*) OVER() AS totalrows, SUM(statcount) OVER() AS statgamecount, SUM(statprofit) OVER() AS stattotalprofit, AVG(statduration) OVER() AS statavgduration
		FROM scored
		ORDER BY {ordersql}
		LIMIT %s OFFSET %s
		) fastsessions
	""",params,SETTING["dbsetting"])
	total=0
	gamecount=0
	totalprofit=0
	avgduration=0
	sessions=[]
	for item in row or []:
		total=_int(item.get("totalrows"),total)
		gamecount=_int(item.get("statgamecount"),gamecount)
		totalprofit=_num(item.get("stattotalprofit"),totalprofit)
		avgduration=_int(item.get("statavgduration"),avgduration)
		regclosed=_bool(item.get("timerregclosed"))
		sessionended=False
		timeractivecount=0
		timertotalentries=0
		timerplayercount=0
		displaytotalbuyin=item.get("totalbuyin")
		if _bool(item.get("owned")) and _bool(item.get("linkuser")):
			timerplayercount=_int(item.get("timerplayercount"),0)
			timernotplacedcount=_int(item.get("timernotplacedcount"),0)
			timeractivecount=_int(item.get("timeractivecount"),0)
			timertotalentries=_int(item.get("timertotalentries"),0)
			realtotalentries=_int(item.get("realtotalentries"),0)
			if 0<timerplayercount and timernotplacedcount<=0:
				sessionended=True
			elif (0<timertotalentries or 0<timerplayercount) and timeractivecount<=1:
				sessionended=True
			# 總入場次數優先用 sessionplayer 的實際報名數(realtotalentries), 不依賴計時器是否已同步過(sessiontimerplayer 可能還沒任何資料)
			if 0<realtotalentries:
				displaytotalbuyin=realtotalentries
			elif 0<timertotalentries:
				displaytotalbuyin=timertotalentries
		myregistration=None
		displayplace=None
		if item.get("myregistrationid"):
			displayplace=_sessiontimerdisplayplace(
				item["id"],
				tokenuserrow["id"],
				item.get("mytimerstatus"),
				item.get("mytimerplace"),
				timerplayercount,
				sessionended,
				timeractivecount
			)
			myregistration={
				"id": item.get("myregistrationid"),
				"status": item.get("myregistrationstatus"),
				"rebuycount": item.get("myrebuycount") or 0,
				"reentrycount": item.get("myreentrycount") or 0,
				"addoncount": item.get("myaddoncount") or 0,
				"cost": item.get("mycost") or 0,
				"profit": (item.get("myfinalprize") or 0)-(item.get("mycost") or 0),
				"finalprize": item.get("myfinalprize") or 0,
				"timerplace": displayplace,
				"timerstatus": item.get("mytimerstatus"),
				"place": item.get("myplace")
			}
		item["clubname"]=item.get("clubname") or "協會被刪除"
		item["myregistration"]=myregistration
		item["regclosed"]=regclosed
		item["sessionended"]=sessionended
		item["displayplace"]=displayplace
		item["displaytotalbuyin"]=displaytotalbuyin
		for key in ["totalrows","statgamecount","stattotalprofit","statavgduration","statcount","statprofit","statduration","myregistrationid","mybuyin","myfee","myrebuycount","myreentrycount","myaddoncount","mypaymenttype","myticketvalue","myprize","myprizeoverride","myplace","mytimerplace","mytimerstatus","mycost","myfinalprize","timerregclosed","timerplayercount","timernotplacedcount","timeractivecount","timertotalentries","realtotalentries"]:
			if key in item:
				del item[key]
		sessions.append(item)
	totalpages=(total+limit-1)//limit
	if totalpages<=0:
		totalpages=1
	if totalpages<page:
		page=totalpages
	return Response({
		"success": True,
		"data": {
			"sessions": sessions,
			"stats": {
				"gamecount": gamecount,
				"totalprofit": totalprofit,
				"avgduration": avgduration
			},
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

def getsessionstaffaccess(sessionid,userid):
	sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if not sessionrow:
		return None
	sessionrow=sessionrow[0]

	access={
		"isown": False,
		"isstaff": False,
		"accessrole": "",
		"accessownerid": sessionrow["userid"],
		"accesssource": ""
	}

	if sessionrow["userid"]==userid:
		access["isown"]=True
		access["accessrole"]="owner"
		access["accesssource"]="owner"
		return access

	sessionstaffrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionstaff" WHERE "sessionid"=%s AND "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL""",[sessionid,userid],SETTING["dbsetting"])
	if sessionstaffrow:
		access["isstaff"]=True
		access["accessrole"]=sessionstaffrow[0]["role"]
		access["accesssource"]="sessionstaff"
		return access

	userstaffrow=query(SETTING["dbname"],f"""SELECT*FROM "userstaff" WHERE "userid"=%s AND "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL""",[sessionrow["userid"],userid],SETTING["dbsetting"])
	if userstaffrow:
		access["isstaff"]=True
		access["accessrole"]=userstaffrow[0]["role"]
		access["accesssource"]="userstaff"
		return access

	return access

def canviewsessiondetail(sessionrow,userrow):
	isown=(userrow["id"]==sessionrow["userid"])
	isadmin=(4<=int(userrow["permission"]))
	access=getsessionstaffaccess(sessionrow["id"],userrow["id"])
	isstaff=access["isstaff"] if access else False
	myregistration=getmyregistrationfinance(sessionrow,userrow["id"])
	islinkopen=bool(sessionrow.get("linkuser"))
	privateed=_bool(sessionrow.get("private"))
	if privateed and not (isown or isadmin or isstaff or myregistration):
		islinkopen=False
	if isown or isadmin or isstaff or islinkopen:
		return True
	return False

@api_view(["GET"])
def getsessionlist(request):
	tokenuserrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	return _fastsessionlist(request,tokenuserrow)

@api_view(["GET"])
def getsession(request,sessionid):
	tokenuserrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if not row:
		return errorresponse("ERROR_session_not_found")
	row=row[0]
	islinkopen=bool(row.get("linkuser"))
	isown=(tokenuserrow["id"]==row["userid"])
	isadmin=(4<=int(tokenuserrow["permission"]))
	access=getsessionstaffaccess(sessionid,tokenuserrow["id"])
	isstaff=access["isstaff"] if access else False
	accessrole=access["accessrole"] if access else ""
	accesssource=access["accesssource"] if access else ""
	# 先跑 timerstatus(內部會 finalizetimerpendingplaces 補齊名次), 再讀 myregistration 才不會拿到補名次前的舊資料
	timerstatus=_sessiontimerstatus(row)
	myregistration=getmyregistrationfinance(row,tokenuserrow["id"])
	privateed=_bool(row.get("private"))
	if privateed and not (isown or isadmin or isstaff or myregistration):
		islinkopen=False
	if not (isown or isadmin or isstaff or islinkopen):
		return errorresponse("ERROR_no_permission")
	clubrow=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[row["clubid"]],SETTING["dbsetting"])
	myregistrationstatus=None
	if myregistration:
		myregistrationstatus=myregistration["status"]
	displayplace=None
	displaytotalbuyin=None
	if _bool(row.get("owned")) and _bool(row.get("linkuser")):
		# 總入場次數優先用 sessionplayer 的實際報名數, 不依賴計時器是否已同步過(sessiontimerplayer 可能還沒任何資料)
		realtotalentriesrow=query(SETTING["dbname"],f"""SELECT SUM(1+COALESCE("reentrycount",0)) AS count FROM "sessionplayer" WHERE "sessionid"=%s AND "status" IN ('confirmed','advanced') AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		realtotalentries=_int(realtotalentriesrow[0].get("count"),0) if realtotalentriesrow else 0
		active,total,timerrows=linkedcounts(sessionid)
		if 0<realtotalentries:
			displaytotalbuyin=realtotalentries
		elif 0<total:
			displaytotalbuyin=total
		if myregistration:
			playercount=len(timerrows)
			displayplace=_sessiontimerdisplayplace(
				sessionid,
				tokenuserrow["id"],
				myregistration.get("timerstatus"),
				myregistration.get("timerplace"),
				playercount,
				timerstatus["sessionended"],
				active
			)
			myregistration["timerplace"]=displayplace
	clubdata=None
	clubname="協會被刪除"
	if clubrow:
		clubdata=clubrow[0]
		clubname=clubrow[0]["name"]
	return Response({
		"success": True,
		"data": {
			**row,
			"club": clubdata,
			"clubname": clubname,
			"isown": isown,
			"isadmin": isadmin,
			"isstaff": isstaff,
			"accessrole": accessrole,
			"accesssource": accesssource,
			"myregistrationstatus": myregistrationstatus,
			"myregistration": myregistration,
			"displayplace": displayplace,
			"displaytotalbuyin": displaytotalbuyin,
			"regclosed": timerstatus["regclosed"],
			"sessionended": timerstatus["sessionended"],
			"relations": _sessionrelations(sessionid),
			"relationdata": _sessionrelationdata(sessionid),
			"multidayremaining": _multidayremainingcount(sessionid),
			"chips": _sessionchips(sessionid),
			"schedule": _sessionschedule(sessionid),
			"autostartbytime": _sessiontimerautostart(sessionid)
		}
	},status.HTTP_200_OK)

@api_view(["POST"])
def newsession(request):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	data=json.loads(request.body)

	requestdata=validate(data,{
		"gametype": "required|string|in:cash,tournament,limited",
		"name": "required|string",
		"clubid": "required|string",
		"buyin": "required|integer|min:0",
		"buyinfee": "integer|min:0",
		"chip": "integer|min:0",
		"rebuycount": "required|integer|min:0",
		"rebuybuyin": "required|integer|min:0",
		"rebuyfee": "integer|min:0",
		"rebuychip": "integer|min:0",
		"reentrycount": "integer|min:0",
		"reentrybuyin": "integer|min:0",
		"reentryfee": "integer|min:0",
		"reentrychip": "integer|min:0",
		"addoncount": "integer|min:0",
		"addonbuyin": "integer|min:0",
		"addonfee": "integer|min:0",
		"addonchip": "integer|min:0",
		"linkuser": "boolean",
		"guaranteedprize": "integer|min:0",
		"private": "boolean",
		"winprice": "required|integer|min:0",
		"winthing": "required|string",
		"inmoney": "boolean",
		"inft": "boolean",
		"starttime": "required|string",
		"endtime": "required|string",
		"place": "required|string",
		"totalbuyin": "required|string",
		"owned": "boolean",
		"openregistration": "boolean",
		"maxseat": "integer",
		"antemode": "string",
		"unifiedhandrecord": "boolean",
		"gametypeid": "string",
		"limittypeid": "string",
		"stacktypeid": "string",
		"eventtypeid": "string",
		"description": "string"
	},{
		"required": "ERROR_request_data_not_found",
		"string": "ERROR_request_data_type_error",
		"integer": "ERROR_request_data_type_error",
		"boolean": "ERROR_request_data_type_error"
	})

	if requestdata["error"] is None:
		gametype=requestdata["data"].get("gametype")
		name=requestdata["data"].get("name")
		clubid=requestdata["data"].get("clubid")
		buyin=requestdata["data"].get("buyin")
		buyinfee=requestdata["data"].get("buyinfee") or 0
		chip=requestdata["data"].get("chip") or 0
		rebuycount=requestdata["data"].get("rebuycount")
		rebuybuyin=requestdata["data"].get("rebuybuyin")
		rebuyfee=requestdata["data"].get("rebuyfee") or 0
		rebuychip=requestdata["data"].get("rebuychip") or 0
		reentrycount=requestdata["data"].get("reentrycount") or 0
		reentrybuyin=requestdata["data"].get("reentrybuyin") or 0
		reentryfee=requestdata["data"].get("reentryfee") or 0
		reentrychip=requestdata["data"].get("reentrychip") or 0
		addoncount=requestdata["data"].get("addoncount") or 0
		addonbuyin=requestdata["data"].get("addonbuyin") or 0
		addonfee=requestdata["data"].get("addonfee") or 0
		addonchip=requestdata["data"].get("addonchip") or 0
		linkuser=requestdata["data"].get("linkuser")
		guaranteedprize=requestdata["data"].get("guaranteedprize") or 0
		privateed=_bool(requestdata["data"].get("private"))
		winprice=requestdata["data"].get("winprice")
		winthing=requestdata["data"].get("winthing")
		inmoney=requestdata["data"].get("inmoney")
		inft=requestdata["data"].get("inft")
		starttime=requestdata["data"].get("starttime")
		endtime=requestdata["data"].get("endtime")
		description=requestdata["data"].get("description")
		place=requestdata["data"].get("place")
		totalbuyin=requestdata["data"].get("totalbuyin")
		gametypeid=requestdata["data"].get("gametypeid")
		limittypeid=requestdata["data"].get("limittypeid")
		stacktypeid=requestdata["data"].get("stacktypeid")
		eventtypeid=requestdata["data"].get("eventtypeid")
		owned=requestdata["data"].get("owned")
		openregistration=_bool(requestdata["data"].get("openregistration"))
		maxseat=requestdata["data"].get("maxseat") or 9
		antemode=requestdata["data"].get("antemode") or "bigblindante"
		unifiedhandrecord=_bool(requestdata["data"].get("unifiedhandrecord"))
		if antemode!="ante":
			antemode="bigblindante"

		# 主辦牌局: 主辦人不參賽, 把「個人成績」欄位歸 0 (主辦設定欄位照填)
		# 個人牌局: 把「主辦設定」相關歸預設, 個人成績欄位照填
		if owned==True or owned==1 or owned=="1":
			owned=True
			# 個人成績歸 0
			winprice=0
			winthing="N/A"
			place="0"
			totalbuyin="0"
			inmoney=False
			inft=False
		else:
			owned=False
			# 非主辦時, 僅保留個人成績需要的再入資訊
			linkuser=False
			rebuycount=0
			rebuybuyin=0
			rebuyfee=0
			rebuychip=0
			reentrychip=0
			addoncount=0
			addonbuyin=0
			addonfee=0
			addonchip=0
			guaranteedprize=0
			privateed=False

		if linkuser==True or linkuser==1 or linkuser=="1":
			linkuser=True
		else:
			linkuser=False
		if not linkuser:
			openregistration=False
			privateed=False

		if inmoney==True or inmoney==1 or inmoney=="1":
			inmoney=True
		else:
			inmoney=False

		if inft==True or inft==1 or inft=="1":
			inft=True
		else:
			inft=False

		# 網路差時 client 端可能在逾時後自動或由使用者重試, 造成同一場次被連續送出多次 insert 成多筆。
		# insert 前先查同一使用者短時間內(10 秒)是否已建立過完全相同的場次(名稱/協會/類型/起訖時間一致且未刪除),
		# 有就直接回傳既有的 sessionid, 不再新增, 讓建立動作對重試具備冪等性。
		#
		# 這裡的 NOW() 是**刻意**的, 不是時鐘混用(clockmix-ok):
		# session.createtime 走的是 CREATE TABLE 的 DEFAULT now(), 存的是真 UTC,
		# 拿它去比 SQL 的 NOW() 兩邊同一個時鐘, 結果正確。
		# 注意 starttime/endtime 就**不是**同一回事 —— 那兩個是使用者輸入的本地時間,
		# 這裡只拿它們做等值比對, 沒有跟 NOW() 比, 所以不受影響。
		duplicaterow=query(SETTING["dbname"],f"""SELECT "id" FROM "session"
			WHERE "userid"=%s AND "name"=%s AND CAST("clubid" AS TEXT)=%s AND "gametype"=%s
			  AND "starttime"=%s::timestamptz AND "endtime"=%s::timestamptz
			  AND "deletetime" IS NULL AND "createtime">=NOW()-INTERVAL '10 seconds' -- clockmix-ok
			ORDER BY "id" DESC LIMIT 1""",
			[tokenuserrow["id"],name,str(clubid),gametype,starttime,endtime],SETTING["dbsetting"])
		if duplicaterow:
			return Response({
				"success": True,
				"data": duplicaterow[0]["id"]
			},status.HTTP_200_OK)

		# token 流水號: 以既有 token 數字部分(第 7 碼起, 前 6 碼為 2 碼類型+4 碼年份)的最大值+1,
		# 含已軟刪列避免重號; 不用 len(rows)+1 才不會因軟刪或並發錯位。
		# 注意: SELECT MAX 與 INSERT 不在同一交易, 高併發下仍有極小的重號視窗 (可接受)。
		serialrow=query(SETTING["dbname"],"""SELECT COALESCE(MAX(CAST(SUBSTRING("token" FROM 7) AS BIGINT)),0)+1 AS serial FROM "session" WHERE "gametype"=%s AND "token"~'^[A-Z]{2}[0-9]{4}[0-9]+$'""",[gametype],SETTING["dbsetting"])
		serial=1
		if serialrow:
			serial=_int(serialrow[0].get("serial"),1)

		ensuresessionsettingcolumns()
		brandsdefault=userdisplaydefault(tokenuserrow["id"])

		newsessionid=queryinsert(SETTING["dbname"],"session",{
			"token": f"{gametype[:2].upper()}{nowtime().split(' ')[0].split('-')[0]}{str(serial).zfill(6)}",
			"userid": tokenuserrow["id"],
			"gametype": gametype,
			"name": name,
			"clubid": clubid,
			"buyin": buyin,
			"buyinfee": buyinfee,
			"chip": chip,
			"rebuycount": rebuycount,
			"rebuybuyin": rebuybuyin,
			"rebuyfee": rebuyfee,
			"rebuychip": rebuychip,
			"reentrycount": reentrycount,
			"reentrybuyin": reentrybuyin,
			"reentryfee": reentryfee,
			"reentrychip": reentrychip,
			"addoncount": addoncount,
			"addonbuyin": addonbuyin,
			"addonfee": addonfee,
			"addonchip": addonchip,
			"linkuser": linkuser,
			"guaranteedprize": guaranteedprize,
			"private": privateed,
			"winprice": winprice,
			"winthing": winthing,
			"inmoney": inmoney,
			"inft": inft,
			"starttime": starttime,
			"endtime": endtime,
			"description": description,
			"place": place,
			"totalbuyin": totalbuyin,
			"gametypeid": gametypeid,
			"limittypeid": limittypeid,
			"stacktypeid": stacktypeid,
			"eventtypeid": eventtypeid,
			"owned": owned,
			"openregistration": openregistration,
			"maxseat": maxseat,
			"antemode": antemode,
			"unifiedhandrecord": unifiedhandrecord,
			# 大螢幕品牌設定的初值來自建立者的個人預設 (feature-spec-display FR-7)。
			# 沒設過就整組空字串 = 沒有品牌, 大螢幕維持原本的樣子。
			# 之後在單場改動只會寫到 session 這一列, 不會回寫個人預設 (FR-8)。
			"brandname": brandsdefault["brandname"],
			"brandcolor": brandsdefault["brandcolor"],
			"brandlogo": brandsdefault["brandlogo"],
			"displayfields": brandsdefault["displayfields"],
			"columnorder": brandsdefault["columnorder"]
		},SETTING["dbsetting"])

		return Response({
			"success": True,
			"data": newsessionid
		},status.HTTP_200_OK)
	else:
		return errorresponse(requestdata["error"])

@api_view(["PUT"])
def editsession(request,sessionid):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if row:
		row=row[0]
		isadmin=(4<=int(tokenuserrow["permission"]))
		access=getsessionstaffaccess(sessionid,tokenuserrow["id"])
		if not (isadmin or (access and (access["isown"] or access["isstaff"]))):
			return errorresponse("ERROR_no_permission")

		requestdata=validate(json.loads(request.body),{
			"name": "required|string",
			"clubid": "required|string",
			"buyin": "required|integer|min:0",
			"buyinfee": "integer|min:0",
			"chip": "required|integer|min:0",
			"rebuycount": "required|integer|min:0",
			"rebuybuyin": "required|integer|min:0",
			"rebuyfee": "integer|min:0",
			"rebuychip": "integer|min:0",
			"reentrycount": "integer|min:0",
			"reentrybuyin": "integer|min:0",
			"reentryfee": "integer|min:0",
			"reentrychip": "integer|min:0",
			"addoncount": "integer|min:0",
			"addonbuyin": "integer|min:0",
			"addonfee": "integer|min:0",
			"addonchip": "integer|min:0",
			"linkuser": "boolean",
			"guaranteedprize": "integer|min:0",
			"private": "boolean",
			"winprice": "required|integer|min:0",
			"winthing": "required|string",
			"inmoney": "boolean",
			"inft": "boolean",
			"starttime": "required|string",
			"endtime": "required|string",
			"place": "required|string",
			"totalbuyin": "required|string",
			"owned": "boolean",
			"gametypeid": "string",
			"limittypeid": "string",
			"stacktypeid": "string",
			"eventtypeid": "string",
			"description": "string"
		},{
			"required": "ERROR_request_data_not_found",
			"string": "ERROR_request_data_type_error",
			"integer": "ERROR_request_data_type_error",
			"boolean": "ERROR_request_data_type_error"
		})

		if requestdata["error"] is None:
			name=requestdata["data"].get("name")
			clubid=requestdata["data"].get("clubid")
			buyin=requestdata["data"].get("buyin")
			buyinfee=requestdata["data"].get("buyinfee") or 0
			chip=requestdata["data"].get("chip")
			rebuycount=requestdata["data"].get("rebuycount")
			rebuybuyin=requestdata["data"].get("rebuybuyin")
			rebuyfee=requestdata["data"].get("rebuyfee") or 0
			rebuychip=requestdata["data"].get("rebuychip") or 0
			reentrycount=requestdata["data"].get("reentrycount") or 0
			reentrybuyin=requestdata["data"].get("reentrybuyin") or 0
			reentryfee=requestdata["data"].get("reentryfee") or 0
			reentrychip=requestdata["data"].get("reentrychip") or 0
			addoncount=requestdata["data"].get("addoncount") or 0
			addonbuyin=requestdata["data"].get("addonbuyin") or 0
			addonfee=requestdata["data"].get("addonfee") or 0
			addonchip=requestdata["data"].get("addonchip") or 0
			linkuser=requestdata["data"].get("linkuser")
			guaranteedprize=requestdata["data"].get("guaranteedprize") or 0
			privateed=_bool(requestdata["data"].get("private"))
			winprice=requestdata["data"].get("winprice")
			winthing=requestdata["data"].get("winthing")
			inmoney=requestdata["data"].get("inmoney")
			inft=requestdata["data"].get("inft")
			starttime=requestdata["data"].get("starttime")
			endtime=requestdata["data"].get("endtime")
			description=requestdata["data"].get("description")
			place=requestdata["data"].get("place")
			totalbuyin=requestdata["data"].get("totalbuyin")
			owned=requestdata["data"].get("owned")

			# 主辦牌局: 主辦人不參賽, 把「個人成績」歸 0; 主辦設定欄位照填
			if owned==True or owned==1 or owned=="1":
				owned=True
				winprice=0
				winthing="N/A"
				place="0"
				totalbuyin="0"
				inmoney=False
				inft=False
			else:
				owned=False
				linkuser=False
				rebuycount=0
				rebuybuyin=0
				rebuyfee=0
				rebuychip=0
				reentrychip=0
				addoncount=0
				addonbuyin=0
				addonfee=0
				addonchip=0
				guaranteedprize=0
				privateed=False

			if linkuser==True or linkuser==1 or linkuser=="1":
				linkuser=True
			else:
				linkuser=False
			if not linkuser:
				privateed=False

			if inmoney==True or inmoney==1 or inmoney=="1":
				inmoney=True
			else:
				inmoney=False

			if inft==True or inft==1 or inft=="1":
				inft=True
			else:
				inft=False

			updatedata={
				"name": name,
				"clubid": clubid,
				"buyin": buyin,
				"buyinfee": buyinfee,
				"chip": chip,
				"rebuycount": rebuycount,
				"rebuybuyin": rebuybuyin,
				"rebuyfee": rebuyfee,
				"rebuychip": rebuychip,
				"reentrycount": reentrycount,
				"reentrybuyin": reentrybuyin,
				"reentryfee": reentryfee,
				"reentrychip": reentrychip,
				"addoncount": addoncount,
				"addonbuyin": addonbuyin,
				"addonfee": addonfee,
				"addonchip": addonchip,
				"linkuser": linkuser,
				"guaranteedprize": guaranteedprize,
				"private": privateed,
				"winprice": winprice,
				"winthing": winthing,
				"inmoney": inmoney,
				"inft": inft,
				"starttime": starttime,
				"endtime": endtime,
				"description": description,
				"place": place,
				"totalbuyin": totalbuyin,
				"owned": owned,
				"updatetime": nowtime()
			}
			# gametypeid/limittypeid/stacktypeid/eventtypeid 這四欄 client 不一定會帶,
			# 只在 request 有帶該 key 時才更新, 避免 data.get() 回 None 把既有值覆蓋成 NULL
			for key in ["gametypeid","limittypeid","stacktypeid","eventtypeid"]:
				if key in requestdata["data"]:
					updatedata[key]=requestdata["data"].get(key)

			queryupdate(SETTING["dbname"],"session",updatedata,{
				"id": sessionid
			},SETTING["dbsetting"])

			return Response({
				"success": True,
				"data": ""
			},status.HTTP_200_OK)
		else:
			return errorresponse(requestdata["error"])
	else:
		return Response({
			"success": False,
			"data": "ERROR_session_not_found"
		},status.HTTP_404_NOT_FOUND)

@api_view(["PUT"])
def editsessionsettings(request,sessionid):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	sessionrow,allowed=_cansessionsetting(sessionid,userrow)
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")
	if not allowed:
		return errorresponse("ERROR_no_permission")
	requestdata=validate(json.loads(request.body),{
		"name": "string",
		"clubid": "string",
		"buyin": "integer|min:0",
		"buyinfee": "integer|min:0",
		"chip": "integer|min:0",
		"rebuycount": "integer|min:0",
		"rebuybuyin": "integer|min:0",
		"rebuyfee": "integer|min:0",
		"rebuychip": "integer|min:0",
		"reentrycount": "integer|min:0",
		"reentrybuyin": "integer|min:0",
		"reentryfee": "integer|min:0",
		"reentrychip": "integer|min:0",
		"addoncount": "integer|min:0",
		"addonbuyin": "integer|min:0",
		"addonfee": "integer|min:0",
		"addonchip": "integer|min:0",
		"linkuser": "boolean",
		"guaranteedprize": "integer|min:0",
		"private": "boolean",
		"owned": "boolean",
		"starttime": "string",
		"endtime": "string",
		"description": "string",
		"gametypeid": "string",
		"limittypeid": "string",
		"stacktypeid": "string",
		"eventtypeid": "string",
		"antemode": "string",
		"unifiedhandrecord": "boolean",
		"broadcastopen": "boolean",
		"broadcastdelay": "integer|min:0",
		"broadcastshowcard": "boolean",
		"broadcasth4h": "boolean",
		"ticketenabled": "boolean",
		"ticketvalue": "integer|min:0",
		"openregistration": "boolean",
		"autostartbytime": "boolean",
		"maxseat": "integer",
		"raisecap": "integer|min:1",
		"brandname": "string",
		"brandcolor": "string",
		"brandlogo": "string",
		"displayfields": "string",
		"columnorder": "string",
		"chips": "array"
	},{
		"string": "ERROR_request_data_type_error",
		"integer": "ERROR_request_data_type_error",
		"boolean": "ERROR_request_data_type_error",
		"array": "ERROR_request_data_type_error"
	})
	if requestdata["error"] is not None:
		return errorresponse(requestdata["error"])
	data=requestdata["data"]
	# 計分員不可操作計時器: dealer 不可改計時器相關設定 (比照 timer.py 的 role IN ('floor','assistant') 判斷)
	if "autostartbytime" in data:
		access=getsessionstaffaccess(sessionid,userrow["id"])
		isadmin=(4<=int(userrow["permission"]))
		istimerstaff=(access and access["isstaff"] and access["accessrole"] in ["floor","assistant"])
		if not (isadmin or (access and access["isown"]) or istimerstaff):
			return errorresponse("ERROR_no_permission")
	ensuresessionsettingcolumns()
	update={}
	for key in ["name","clubid","buyin","buyinfee","chip","rebuycount","rebuybuyin","rebuyfee","rebuychip","reentrycount","reentrybuyin","reentryfee","reentrychip","addoncount","addonbuyin","addonfee","addonchip","linkuser","guaranteedprize","private","owned","starttime","endtime","description","gametypeid","limittypeid","stacktypeid","eventtypeid","ticketenabled","ticketvalue","openregistration","maxseat","raisecap","brandname","brandcolor","brandlogo","displayfields","broadcastdelay"]:
		if key in data:
			update[key]=data.get(key)
	# 大螢幕品牌設定：上面的通用迴圈是原封不動寫進 DB, 這幾個欄位的 validate 規則只寫 "string",
	# 等於 javascript:/data: 協定與任意 CSS 值都會被存下來, 之後在大螢幕上算繪(TASK-022 修正)。
	# 這裡覆寫成正規化後的值; 正規化拒絕的輸入一律變成空字串 = 沒有設定, 不會讓畫面壞掉。
	if "brandname" in data:
		update["brandname"]=str(data.get("brandname") or "")[:120]
	if "brandcolor" in data:
		update["brandcolor"]=normalizeaccentcolor(data.get("brandcolor"))
	if "brandlogo" in data:
		update["brandlogo"]=normalizebrandlogourl(data.get("brandlogo"))
	if "displayfields" in data:
		update["displayfields"]=normalizehiddenblock(data.get("displayfields"))
	if "columnorder" in data:
		update["columnorder"]=normalizecolumnorder(data.get("columnorder"))
	if "antemode" in data:
		update["antemode"]="ante" if data.get("antemode")=="ante" else "bigblindante"
	if "unifiedhandrecord" in data:
		update["unifiedhandrecord"]=_bool(data.get("unifiedhandrecord"))
	if "broadcastopen" in data:
		update["broadcastopen"]=_bool(data.get("broadcastopen"))
	if "broadcastshowcard" in data:
		update["broadcastshowcard"]=_bool(data.get("broadcastshowcard"))
	if "broadcasth4h" in data:
		newh4h=_bool(data.get("broadcasth4h"))
		update["broadcasth4h"]=newh4h
		# 開啟 H4H 當下: 既有手牌全部視為已放行, 只有之後的新手牌需要裁判逐手推進
		if newh4h and not _bool(sessionrow.get("broadcasth4h")):
			cnt=query(SETTING["dbname"],f"""SELECT count(*) AS c FROM "hand" h JOIN "table" t ON t."id"=h."tableid" WHERE t."sessionid"=%s AND h."deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
			update["broadcastreleasedcount"]=int(cnt[0]["c"]) if cnt else 0
	if "owned" in update and not _bool(update["owned"]):
		update["linkuser"]=False
		update["openregistration"]=False
		update["private"]=False
		update["guaranteedprize"]=0
	if "linkuser" in update and not _bool(update["linkuser"]):
		update["openregistration"]=False
		update["private"]=False
	if "private" in update:
		update["private"]=_bool(update["private"])
	update["updatetime"]=nowtime()
	queryupdate(SETTING["dbname"],"session",update,{"id": sessionid},SETTING["dbsetting"])
	if "chips" in data:
		_savesessionchips(sessionid,data.get("chips") or [])
	if "autostartbytime" in data:
		_savesessiontimerautostart(sessionid,data.get("autostartbytime"),update.get("name") or sessionrow.get("name"))
	row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s""",[sessionid],SETTING["dbsetting"])
	payload=row[0] if row else {}
	payload["chips"]=_sessionchips(sessionid)
	payload["autostartbytime"]=_sessiontimerautostart(sessionid)
	if "name" in data:
		_syncsessiontimername(sessionid,payload.get("name") or data.get("name"))
	return Response({"success": True,"data": payload},status.HTTP_200_OK)

@api_view(["PUT"])
def editsessionresult(request,sessionid):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	sessionrow,allowed=_cansessionsetting(sessionid,userrow)
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")
	if not allowed:
		return errorresponse("ERROR_no_permission")
	requestdata=validate(json.loads(request.body),{
		"reentrycount": "required|integer|min:0",
		"winprice": "required|integer|min:0",
		"winthing": "required|string",
		"place": "required|string",
		"totalbuyin": "required|string",
		"inmoney": "boolean",
		"inft": "boolean"
	},{
		"required": "ERROR_request_data_not_found",
		"string": "ERROR_request_data_type_error",
		"integer": "ERROR_request_data_type_error",
		"boolean": "ERROR_request_data_type_error"
	})
	if requestdata["error"] is not None:
		return errorresponse(requestdata["error"])
	data=requestdata["data"]
	queryupdate(SETTING["dbname"],"session",{
		"reentrycount": data.get("reentrycount"),
		"winprice": data.get("winprice"),
		"winthing": data.get("winthing"),
		"place": data.get("place"),
		"totalbuyin": data.get("totalbuyin"),
		"inmoney": _bool(data.get("inmoney")),
		"inft": _bool(data.get("inft")),
		"updatetime": nowtime()
	},{"id": sessionid},SETTING["dbsetting"])
	return Response({"success": True,"data": ""},status.HTTP_200_OK)

@api_view(["PUT"])
def editsessionrelations(request,sessionid):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	sessionrow,allowed=_cansessionsetting(sessionid,userrow)
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")
	if not allowed:
		return errorresponse("ERROR_no_permission")
	requestdata=validate(json.loads(request.body),{
		"relationtype": "required|string|in:satellite,multiday",
		"direction": "string|in:outgoing,incoming",
		"targetids": "array",
		"targetids.*": "integer"
	},{
		"required": "ERROR_request_data_not_found",
		"string": "ERROR_request_data_type_error",
		"integer": "ERROR_request_data_type_error",
		"array": "ERROR_request_data_type_error",
		"in": "ERROR_request_data_type_error"
	})
	if requestdata["error"] is not None:
		return errorresponse(requestdata["error"])
	relationtype=requestdata["data"].get("relationtype")
	direction=requestdata["data"].get("direction") or "outgoing"
	targetids=requestdata["data"].get("targetids") or []
	sourcefield="sourceid"
	targetfield="targetid"
	if direction=="incoming":
		sourcefield="targetid"
		targetfield="sourceid"
	query(SETTING["dbname"],f"""UPDATE "sessionrelation" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "{sourcefield}"=%s AND "relationtype"=%s AND "deletetime" IS NULL""",[sessionid,relationtype],SETTING["dbsetting"])
	if direction=="outgoing" and relationtype=="multiday" and 1<len(targetids):
		targetids=[targetids[0]]
	for i in range(len(targetids)):
		targetid=targetids[i]
		if str(targetid)==str(sessionid):
			continue
		targetrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "userid"=%s AND "deletetime" IS NULL""",[targetid,sessionrow["userid"]],SETTING["dbsetting"])
		if targetrow:
			sourceid=sessionid
			targetsessionid=targetid
			if direction=="incoming":
				sourceid=targetid
				targetsessionid=sessionid
			oldrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionrelation" WHERE "sourceid"=%s AND "targetid"=%s AND "relationtype"=%s""",[sourceid,targetsessionid,relationtype],SETTING["dbsetting"])
			if oldrow:
				query(SETTING["dbname"],f"""UPDATE "sessionrelation" SET "deletetime"=NULL,"updatetime"=NOW() WHERE "id"=%s""",[oldrow[0]["id"]],SETTING["dbsetting"])
			else:
				queryinsert(SETTING["dbname"],"sessionrelation",{
					"sourceid": sourceid,
					"targetid": targetsessionid,
					"relationtype": relationtype
				},SETTING["dbsetting"])
	return Response({"success": True,"data": _sessionrelationdata(sessionid)},status.HTTP_200_OK)

@api_view(["GET"])
def getsessionrelations(request,sessionid):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")
	sessionrow=sessionrow[0]
	if not canviewsessiondetail(sessionrow,userrow):
		return errorresponse("ERROR_no_permission")
	return Response({"success": True,"data": _sessionrelationdata(sessionid)},status.HTTP_200_OK)

@api_view(["GET"])
def searchsessionrelations(request,sessionid):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	sessionrow,allowed=_cansessionsetting(sessionid,userrow)
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")
	if not allowed:
		return errorresponse("ERROR_no_permission")
	keyword=request.GET.get("keyword") or ""
	page=_int(request.GET.get("page"),1)
	if page<=0:
		page=1
	limit=_int(request.GET.get("limit"),10)
	if limit<=0:
		limit=10
	params=[sessionrow["userid"],sessionid]
	where="""WHERE s."userid"=%s AND s."id"<>%s AND s."deletetime" IS NULL"""
	if keyword:
		where=where+""" AND (s."name" ILIKE %s OR s."token" ILIKE %s)"""
		params.append("%"+keyword+"%")
		params.append("%"+keyword+"%")
	params.append(limit)
	params.append((page-1)*limit)
	rows=query(SETTING["dbname"],f"""SELECT s."id",s."name",s."token",s."starttime",COUNT(*) OVER() AS totalrows FROM "session" s {where} ORDER BY s."starttime" DESC LIMIT %s OFFSET %s""",params,SETTING["dbsetting"])
	total=0
	for i in range(len(rows or [])):
		total=_int(rows[i].get("totalrows"),total)
		del rows[i]["totalrows"]
	totalpages=(total+limit-1)//limit
	if totalpages<=0:
		totalpages=1
	return Response({"success": True,"data": {
		"sessions": rows or [],
		"pagination": {
			"page": page,
			"limit": limit,
			"total": total,
			"totalpages": totalpages,
			"hasprev": 1<page,
			"hasnext": page<totalpages
		}
	}},status.HTTP_200_OK)

@api_view(["DELETE"])
def deletesession(request,sessionid):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if row:
		row=row[0]
		isadmin=(4<=int(tokenuserrow["permission"]))
		if not (isadmin or row["userid"]==tokenuserrow["id"]):
			return errorresponse("ERROR_no_permission")

		# 連動軟刪所有「有 sessionid 欄且有 deletetime 欄」的子表，避免留下孤兒；
		# 用 querytransaction 在單一交易內執行，任一失敗整批 rollback。
		#
		# 2026-07-30（TASK-089）：原本只列 seriessession / sessionstaff / sessionplayer 三張，
		# 但資料庫裡符合條件的表一共 14 張。實測測試機已經累積出殘留 ——
		# sessiontimerlevel 有 170 筆有效列，其中 137 筆的父場次早就刪了或根本不存在。
		# 用 backend/tool/sessioncascade.py 可以隨時算出「還缺哪幾張」的差集。
		#
		# 刻意**不**連動的兩張，都是語意問題不是漏掉：
		#   table  —— deletetable 明文只軟刪那一張牌桌、不連動手牌（apidoc 也是這樣寫的）。
		#             從場次刪下來要不要連 hand / handseating / handplayercard /
		#             handbittingdata / handpot / communitycard 整棵一起刪，是獨立的決策，
		#             只刪 table 不刪 hand 反而會製造新的不一致。
		#   notification —— 它有 sessionid，但通知是**使用者的紀錄**。場次被刪就把使用者收到的
		#             「你報名的場次…」通知一起刪掉可能是錯的，需要產品決策。
		result=querytransaction(SETTING["dbname"],[
			["""UPDATE "session" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "id"=%s""",[sessionid]],
			["""UPDATE "seriessession" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "sessionstaff" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "sessionplayer" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "sessionchip" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "sessiontimer" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "sessiontimerconfig" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "sessiontimerlevel" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "sessiontimerpayout" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "sessiontimerplayer" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "sessiontimebank" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "blindstructure" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			["""UPDATE "playerstatistic" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid]],
			# 2026-08-06：員工工時功能的兩張表。兩者的處理**刻意不一樣**——
			#
			# tablestaff（上桌指派）：連動軟刪，並把未結束的段一併關掉。
			#   桌都跟著場次沒了，「還在這張桌上值班」是不可能成立的狀態；
			#   留著會讓總覽頁出現查不出原因的鬼資料，也會卡住 tablestaffopenstaff
			#   那個「一人同時只能在一張桌」的唯一索引，害那個人再也上不了別的桌。
			#
			# staffworklog（工時）：**只關掉未結束的段，不軟刪**。
			#   工時是**已經發生的事實**，人真的做了那些小時、要照付。
			#   場次刪除是主辦端的行為，不該讓員工白做工，所以歷史列一律留著。
			#   但未結束的段要收掉，否則 COALESCE(endtime,現在) 會讓它一直長。
			#   （因此 backend/tool/sessioncascade.py 仍會把 staffworklog 列為
			#    「缺漏」——那是刻意的，不是漏掉。）
			#
			# 時間欄一律用 nowtime()（本地牆上時間），不可以寫 NOW()，見 AGENTS.md「時間欄」。
			["""UPDATE "tablestaff" SET "endtime"=COALESCE("endtime",%s::timestamptz),"endsource"=COALESCE("endsource",'autoclose'),"deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[nowtime(),sessionid]],
			["""UPDATE "staffworklog" SET "endtime"=%s::timestamptz,"endsource"=COALESCE("endsource",'autoclose'),"updatetime"=NOW() WHERE "sessionid"=%s AND "endtime" IS NULL AND "deletetime" IS NULL""",[nowtime(),sessionid]]
		],SETTING["dbsetting"])
		if result is None:
			return Response({
				"success": False,
				"data": "ERROR_unknow_error_pls_tell_the_admin"
			},status.HTTP_500_INTERNAL_SERVER_ERROR)

		return Response({
			"success": True,
			"data": ""
		},status.HTTP_200_OK)
	else:
		return Response({
			"success": False,
			"data": "ERROR_session_not_found"
		},status.HTTP_404_NOT_FOUND)

@api_view(["POST"])
def copysession(request,sessionid):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if row:
		row=row[0]
		isadmin=(4<=int(tokenuserrow["permission"]))
		if not (isadmin or row["userid"]==tokenuserrow["id"]):
			return errorresponse("ERROR_no_permission")

		gametype=row["gametype"]
		name=row["name"]
		clubid=row["clubid"]
		buyin=row["buyin"]
		rebuycount=row["rebuycount"]
		winprice=row["winprice"]
		winthing=row["winthing"]
		rebuybuyin=row["rebuybuyin"]
		chip=row["chip"]
		starttime=row["starttime"]
		endtime=row["endtime"]
		description=row["description"]
		place=row["place"]
		totalbuyin=row["totalbuyin"]
		gametypeid=row["gametypeid"]
		limittypeid=row["limittypeid"]
		stacktypeid=row["stacktypeid"]
		eventtypeid=row["eventtypeid"]
		owned=row["owned"]
		# 新主辦設定欄位 (用 .get 寬容處理可能還沒有此欄位的舊資料)
		buyinfee=row.get("buyinfee") or 0
		rebuyfee=row.get("rebuyfee") or 0
		rebuychip=row.get("rebuychip") or 0
		reentrycount=row.get("reentrycount") or 0
		reentrybuyin=row.get("reentrybuyin") or 0
		reentryfee=row.get("reentryfee") or 0
		reentrychip=row.get("reentrychip") or 0
		addoncount=row.get("addoncount") or 0
		addonbuyin=row.get("addonbuyin") or 0
		addonfee=row.get("addonfee") or 0
		addonchip=row.get("addonchip") or 0
		linkuser=row.get("linkuser") or False
		openregistration=row.get("openregistration") or False
		guaranteedprize=row.get("guaranteedprize") or 0
		privateed=row.get("private") or False
		maxseat=row.get("maxseat") or 9

		# token 流水號: 與 newsession 同一規則, 統一補滿 6 碼 (原本此處為 zfill(4), 與 newsession 不一致),
		# 以既有 token 數字部分的最大值+1 (含已軟刪列避免重號); MAX 與 INSERT 不在同一交易, 高併發下仍有極小重號視窗 (可接受)。
		serialrow=query(SETTING["dbname"],"""SELECT COALESCE(MAX(CAST(SUBSTRING("token" FROM 7) AS BIGINT)),0)+1 AS serial FROM "session" WHERE "gametype"=%s AND "token"~'^[A-Z]{2}[0-9]{4}[0-9]+$'""",[gametype],SETTING["dbsetting"])
		serial=1
		if serialrow:
			serial=_int(serialrow[0].get("serial"),1)

		newsessionid=queryinsert(SETTING["dbname"],"session",{
			"token": f"{gametype[:2].upper()}{nowtime().split(' ')[0].split('-')[0]}{str(serial).zfill(6)}",
			"userid": tokenuserrow["id"],
			"gametype": gametype,
			"name": name,
			"clubid": clubid,
			"buyin": buyin,
			"buyinfee": buyinfee,
			"rebuycount": "0",
			"rebuybuyin": rebuybuyin,
			"rebuyfee": rebuyfee,
			"rebuychip": rebuychip,
			"reentrycount": reentrycount,
			"reentrybuyin": reentrybuyin,
			"reentryfee": reentryfee,
			"reentrychip": reentrychip,
			"addoncount": addoncount,
			"addonbuyin": addonbuyin,
			"addonfee": addonfee,
			"addonchip": addonchip,
			"linkuser": linkuser,
			"openregistration": openregistration,
			"guaranteedprize": guaranteedprize,
			"private": privateed,
			"maxseat": maxseat,
			"winprice": "0",
			"chip": chip,
			"winthing": "N/A",
			"inmoney": False,
			"inft": False,
			"starttime": starttime,
			"endtime": endtime,
			"description": description,
			"place": "0",
			"totalbuyin": "0",
			"gametypeid": gametypeid,
			"limittypeid": limittypeid,
			"stacktypeid": stacktypeid,
			"eventtypeid": eventtypeid,
			"owned": owned
		},SETTING["dbsetting"])

		newsessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s""",[newsessionid],SETTING["dbsetting"])[0]
		# 先取出 token 再組字串, 避免 f-string 內巢狀同引號 (僅 Python 3.12+ 可解析)
		newsessiontoken=newsessionrow["token"]

		tablerow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		tablecount=0

		for table in tablerow:
			queryinsert(SETTING["dbname"],"table",{
				"token": f"TB{newsessiontoken}{(str(tablecount+1)).zfill(2)}",
				"sessionid": newsessionid,
				"no": table.get("no") or tablecount+1
			},SETTING["dbsetting"])

			tablecount=tablecount+1

		timerconfigrow=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerconfig" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if timerconfigrow:
			timerconfig=timerconfigrow[0]
			queryinsert(SETTING["dbname"],"sessiontimerconfig",{
				"sessionid": newsessionid,
				"tournname": timerconfig.get("tournname") or name,
				"subtitle": timerconfig.get("subtitle") or "",
				"startingchips": timerconfig.get("startingchips") or chip or 0,
				"buyin": timerconfig.get("buyin") or buyin or 0,
				"fee": timerconfig.get("fee") or buyinfee or 0,
				"defaultbreakdur": timerconfig.get("defaultbreakdur") or 10,
				"soundon": timerconfig.get("soundon"),
				"vibeon": timerconfig.get("vibeon"),
				"prizepoolmode": timerconfig.get("prizepoolmode") or "auto",
				"prizepoolmanual": timerconfig.get("prizepoolmanual") or 0,
				"itmmode": timerconfig.get("itmmode") or "pct",
				"itmpct": timerconfig.get("itmpct") or 15,
				"itmcount": timerconfig.get("itmcount") or 7,
				"marqueetext": timerconfig.get("marqueetext") or "",
				"autostartbytime": timerconfig.get("autostartbytime") or False
			},SETTING["dbsetting"])

		timerlevelrow=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerlevel" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionid],SETTING["dbsetting"])
		for level in timerlevelrow or []:
			queryinsert(SETTING["dbname"],"sessiontimerlevel",{
				"sessionid": newsessionid,
				"sortorder": level.get("sortorder") or 0,
				"type": level.get("type") or "level",
				"smallblind": level.get("smallblind") or 0,
				"bigblind": level.get("bigblind") or 0,
				"ante": level.get("ante") or 0,
				"durationminutes": level.get("durationminutes") or 20,
				"regcloseafter": level.get("regcloseafter") or False,
				"chipraisevalues": level.get("chipraisevalues") or "[]"
			},SETTING["dbsetting"])

		chiprow=query(SETTING["dbname"],f"""SELECT*FROM "sessionchip" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC,"value" ASC""",[sessionid],SETTING["dbsetting"])
		for chipitem in chiprow or []:
			queryinsert(SETTING["dbname"],"sessionchip",{
				"sessionid": newsessionid,
				"shape": chipitem.get("shape") or "circle",
				"value": chipitem.get("value") or 0,
				"color": chipitem.get("color") or "#888888",
				"sortorder": chipitem.get("sortorder") or 0
			},SETTING["dbsetting"])

		timerpayoutrow=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerpayout" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionid],SETTING["dbsetting"])
		for payout in timerpayoutrow or []:
			queryinsert(SETTING["dbname"],"sessiontimerpayout",{
				"sessionid": newsessionid,
				"sortorder": payout.get("sortorder") or 0,
				"rank": payout.get("rank") or "",
				"pct": payout.get("pct") or 0,
				"cash": payout.get("cash") or 0,
				"reward": payout.get("reward") or "",
				"color": payout.get("color") or "#888"
			},SETTING["dbsetting"])

		return Response({
			"success": True,
			"data": newsessionid
		},status.HTTP_200_OK)
	else:
		return Response({
			"success": False,
			"data": "ERROR_session_not_found"
		},status.HTTP_404_NOT_FOUND)
