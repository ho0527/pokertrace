# import
import json
import re
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
from .sessionplayer import _attachfinance,_rankrange,_sessiontotalentriesmapping

# 場次盈虧 / 成本算式 (與 user.py 報表一致, 不含 fee 的成本版本)
# 成本 = 買入 + 重買 + 重入(無值時用買入) + addon
_RAWCOST="""(COALESCE(s."buyin",0) + (COALESCE(s."rebuybuyin",0)*COALESCE(s."rebuycount",0)) + (COALESCE(NULLIF(s."reentrybuyin",0),s."buyin",0)*COALESCE(s."reentrycount",0)) + (COALESCE(s."addonbuyin",0)*COALESCE(s."addoncount",0)))"""
# 主辦場次 (owned) 主辦人不是參賽者, 盈虧/成本一律 0; 只有個人記錄場次 (owned=false) 才真的算。
# 主辦場次的玩家成績是在排行榜用 sessionplayer 計算。
_COSTEXPR="""(CASE WHEN s."owned"=true THEN 0 ELSE """+_RAWCOST+""" END)"""
_PROFITEXPR="""(CASE WHEN s."owned"=true THEN 0 ELSE (COALESCE(s."winprice",0) - """+_RAWCOST+""") END)"""

# main START
def _gettokenuser(request):
	return commonauthuser(request)

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

def _sessiondaylabel(sessionrow):
	text=str((sessionrow or {}).get("name") or "")+" "+str((sessionrow or {}).get("token") or "")
	match=re.search(r"\b(?:day|d)\s*([0-9a-z]+)\b",text,re.IGNORECASE)
	if match:
		return "D"+match.group(1).upper()
	if (sessionrow or {}).get("token"):
		return str(sessionrow.get("token"))
	return str((sessionrow or {}).get("name") or "")

def _rankrewarded(payoutlist,place):
	if place is None:
		return False
	for i in range(len(payoutlist or [])):
		item=payoutlist[i]
		rankstart,rankend=_rankrange(item.get("rank"),i+1)
		if rankstart<=place and place<=rankend:
			return True
	return False

def _advancepath(row,playermapping,sessionmapping):
	path=[]
	visitedsession={}
	current=row
	while current and current.get("status")=="advanced" and _int(current.get("advancetargetid"),0)>0:
		sessionid=_int(current.get("sessionid"),0)
		targetsessionid=_int(current.get("advancetargetid"),0)
		if sessionid in visitedsession:
			current=None
		else:
			visitedsession[sessionid]=True
			label=_sessiondaylabel(sessionmapping.get(sessionid) or {})
			if label and label not in path:
				path.append(label)
			targetlabel=_sessiondaylabel(sessionmapping.get(targetsessionid) or {})
			if targetlabel:
				path.append(targetlabel)
			current=playermapping.get(str(current.get("userid"))+":"+str(targetsessionid))
	return path

def _advancebest(path):
	bestlabel=""
	bestvalue=0
	for i in range(len(path or [])):
		label=str(path[i] or "")
		match=re.match(r"^D([0-9]+)",label,re.IGNORECASE)
		if match:
			value=_int(match.group(1),0)
			if bestvalue<value:
				bestvalue=value
				bestlabel=label
	return {
		"label": bestlabel,
		"value": bestvalue
	}

def _orNone(value):
	if value is None or value=="":
		return None
	return value

def _canseries(seriesid,userrow):
	"""管理權限 (編輯/刪除/管理場次): 僅擁有者或管理員。"""
	seriesrow=query(SETTING["dbname"],f"""SELECT*FROM "series" WHERE "id"=%s AND "deletetime" IS NULL""",[seriesid],SETTING["dbsetting"])
	if not seriesrow:
		return (None,False)
	seriesrow=seriesrow[0]
	if seriesrow["userid"]==userrow["id"] or 4<=int(userrow["permission"]):
		return (seriesrow,True)
	return (seriesrow,False)

def _canviewseries(seriesid,userrow):
	"""檢視權限: 擁有者、管理員, 或非私人系列賽任何登入者皆可檢視。
	回傳 (seriesrow, canview, isowner); isowner 為 True 時前端才顯示編輯/刪除/管理。"""
	seriesrow,isowner=_canseries(seriesid,userrow)
	if not seriesrow:
		return (None,False,False)
	if isowner:
		return (seriesrow,True,True)
	# 非擁有者只能看非私人系列賽
	return (seriesrow,not _bool(seriesrow.get("private")),False)

def _seriessessions(seriesid):
	"""回傳系列賽底下的場次 (含每場盈虧 profit / 成本 cost), 依排序與開始時間排列。"""
	rows=query(SETTING["dbname"],f"""
		SELECT s.*, ss."sortorder",
			{_PROFITEXPR} AS profit,
			{_COSTEXPR} AS cost
		FROM "seriessession" ss
		JOIN "session" s ON s."id"=ss."sessionid" AND s."deletetime" IS NULL
		WHERE ss."seriesid"=%s AND ss."deletetime" IS NULL
		ORDER BY ss."sortorder" ASC, s."starttime" ASC
	""",[seriesid],SETTING["dbsetting"])
	return rows or []

def _aggregate(sessions):
	"""把場次清單彙總成系列賽總成績。"""
	totalprofit=0
	totalcost=0
	totalwinprice=0
	for i in range(len(sessions)):
		totalprofit=totalprofit+float(sessions[i].get("profit") or 0)
		totalcost=totalcost+float(sessions[i].get("cost") or 0)
		totalwinprice=totalwinprice+float(sessions[i].get("winprice") or 0)
	return {
		"sessioncount": len(sessions),
		"totalprofit": totalprofit,
		"totalcost": totalcost,
		"totalwinprice": totalwinprice
	}

def _vieweraggmapping(seriesrowlist,userid):
	"""批次版 _vieweragg: 以 IN (...) 一次查完多個系列賽的個人盈虧, 回傳 {seriesid: agg}。
	把原本「每個系列賽 × 每個 owned 場次」的逐筆查詢降為常數次查詢, 計算邏輯與回傳形狀不變。"""
	mapping={}
	seriesidlist=[]
	for i in range(len(seriesrowlist)):
		mapping[seriesrowlist[i]["id"]]={
			"totalprofit": 0.0,
			"totalcost": 0.0,
			"totalwinprice": 0.0,
			"entries": 0
		}
		seriesidlist.append(seriesrowlist[i]["id"])
	if not seriesidlist:
		return mapping
	placeholders=",".join(["%s"]*len(seriesidlist))
	# 主辦場次 (owned): 一次撈出所有系列賽底下的場次
	ownedsessions=query(SETTING["dbname"],f"""
		SELECT ss."seriesid" AS aggseriesid, s.*
		FROM "seriessession" ss
		JOIN "session" s ON s."id"=ss."sessionid" AND s."deletetime" IS NULL AND s."owned"=true
		WHERE ss."seriesid" IN ({placeholders}) AND ss."deletetime" IS NULL
	""",seriesidlist,SETTING["dbsetting"]) or []
	sessionidlist=[]
	for s in ownedsessions:
		if s["id"] not in sessionidlist:
			sessionidlist.append(s["id"])
	# 該使用者在這些場次的報名紀錄一次查完, 再依 sessionid 分組
	playerrowmapping={}
	if sessionidlist:
		sessionplaceholders=",".join(["%s"]*len(sessionidlist))
		playerrowlist=query(SETTING["dbname"],f"""
			SELECT sp.*, tp."place" AS timerplace, tp."status" AS timerstatus
			FROM "sessionplayer" sp
			LEFT JOIN "sessiontimerplayer" tp ON tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."deletetime" IS NULL
			WHERE sp."sessionid" IN ({sessionplaceholders}) AND sp."userid"=%s AND sp."status" IN ('registered','confirmed','advanced') AND sp."deletetime" IS NULL
		""",sessionidlist+[userid],SETTING["dbsetting"]) or []
		for prow in playerrowlist:
			if prow["sessionid"] not in playerrowmapping:
				playerrowmapping[prow["sessionid"]]=[]
			playerrowmapping[prow["sessionid"]].append(prow)
	totalentriesmapping=_sessiontotalentriesmapping(sessionidlist)
	for s in ownedsessions:
		agg=mapping.get(s["aggseriesid"])
		if agg is None:
			continue
		prows=_attachfinance(s,playerrowmapping.get(s["id"]) or [],totalentriesmapping.get(s["id"],0))
		for r in prows:
			agg["totalprofit"]=agg["totalprofit"]+float(r.get("profit") or 0)
			agg["totalcost"]=agg["totalcost"]+float(r.get("cost") or 0)
			agg["totalwinprice"]=agg["totalwinprice"]+float(r.get("finalprize") or 0)
			agg["entries"]=agg["entries"]+1
	# 個人記錄場次 (owned=false) 也一次查完
	personal=query(SETTING["dbname"],f"""
		SELECT ss."seriesid" AS aggseriesid, {_PROFITEXPR} AS profit, {_COSTEXPR} AS cost, COALESCE(s."winprice",0) AS winprice
		FROM "seriessession" ss
		JOIN "session" s ON s."id"=ss."sessionid" AND s."deletetime" IS NULL AND s."owned"=false
		WHERE ss."seriesid" IN ({placeholders}) AND ss."deletetime" IS NULL AND s."userid"=%s
	""",seriesidlist+[userid],SETTING["dbsetting"]) or []
	for r in personal:
		agg=mapping.get(r["aggseriesid"])
		if agg is None:
			continue
		agg["totalprofit"]=agg["totalprofit"]+float(r.get("profit") or 0)
		agg["totalcost"]=agg["totalcost"]+float(r.get("cost") or 0)
		agg["totalwinprice"]=agg["totalwinprice"]+float(r.get("winprice") or 0)
		agg["entries"]=agg["entries"]+1
	return mapping

def _vieweragg(seriesrow,userid):
	"""某位使用者在這個系列賽的「個人」盈虧 (成本/彩金/盈虧/參賽場次)。
	- 主辦場次 (owned): 用該使用者自己的報名紀錄 (含 registered/confirmed/advanced) 以參賽者身分計算, 與場次內結算一致。
	- 個人記錄場次 (owned=false) 且為該使用者建立: 直接用場次的盈虧/成本。
	這樣主辦人看自己的主辦系列賽會是 0 (沒下場), 參賽者看則是自己真正的買入盈虧。"""
	return _vieweraggmapping([seriesrow],userid)[seriesrow["id"]]

@api_view(["GET"])
def getserieslist(request):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	isadmin=4<=int(userrow["permission"])
	# 管理員看得到全部; 一般使用者看得到自己的 + 其他人非私人的系列賽
	if isadmin:
		wherecl="""se."deletetime" IS NULL"""
		params=[]
	else:
		wherecl="""(se."userid"=%s OR COALESCE(se."private",false)=false) AND se."deletetime" IS NULL"""
		params=[userrow["id"]]
	rows=query(SETTING["dbname"],f"""
		SELECT se.*,
			COUNT(s."id") AS sessioncount
		FROM "series" se
		LEFT JOIN "seriessession" ss ON ss."seriesid"=se."id" AND ss."deletetime" IS NULL
		LEFT JOIN "session" s ON s."id"=ss."sessionid" AND s."deletetime" IS NULL
		WHERE {wherecl}
		GROUP BY se."id"
		ORDER BY se."createtime" DESC
	""",params,SETTING["dbsetting"])
	rows=rows or []
	# 卡片的盈虧/成本以檢視者本人為準 (自己報名的買入盈虧); 主辦人看自己主辦的系列賽為 0。用批次版一次算完所有系列賽。
	vamapping=_vieweraggmapping(rows,userrow["id"])
	for i in range(len(rows)):
		rows[i]["sessioncount"]=_int(rows[i].get("sessioncount"),0)
		rows[i]["isowner"]=(rows[i].get("userid")==userrow["id"]) or isadmin
		va=vamapping[rows[i]["id"]]
		rows[i]["totalprofit"]=va["totalprofit"]
		rows[i]["totalcost"]=va["totalcost"]
	return Response({"success": True,"data": rows},status.HTTP_200_OK)

@api_view(["GET"])
def getseries(request,seriesid):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	seriesrow,canview,isowner=_canviewseries(seriesid,userrow)
	if not seriesrow:
		return errorresponse("ERROR_series_not_found")
	if not canview:
		return errorresponse("ERROR_no_permission")
	clubname=None
	if seriesrow.get("clubid"):
		clubrow=query(SETTING["dbname"],f"""SELECT "name" FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[seriesrow["clubid"]],SETTING["dbsetting"])
		if clubrow:
			clubname=clubrow[0]["name"]
	sessions=_seriessessions(seriesid)
	# 總覽的盈虧/成本/彩金以「檢視者本人」為準: 參賽者看到自己的買入盈虧, 主辦人看主辦系列賽為 0。
	agg=_aggregate(sessions)
	va=_vieweragg(seriesrow,userrow["id"])
	agg["totalprofit"]=va["totalprofit"]
	agg["totalcost"]=va["totalcost"]
	agg["totalwinprice"]=va["totalwinprice"]
	agg["myentries"]=va["entries"]
	return Response({"success": True,"data": {
		**seriesrow,
		"clubname": clubname,
		"isowner": isowner,
		"sessions": sessions,
		"aggregate": agg
	}},status.HTTP_200_OK)

@api_view(["POST"])
def newseries(request):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	requestdata=validate(json.loads(request.body),{
		"name": "required|string",
		"clubid": "string",
		"description": "string",
		"starttime": "string",
		"endtime": "string",
		"scoringtype": "string|in:profit,points,place",
		"private": "boolean",
		"sessionids": "array",
		"sessionids.*": "integer"
	},{
		"required": "ERROR_request_data_not_found",
		"string": "ERROR_request_data_type_error",
		"boolean": "ERROR_request_data_type_error",
		"array": "ERROR_request_data_type_error",
		"integer": "ERROR_request_data_type_error",
		"in": "ERROR_request_data_type_error"
	})
	if requestdata["error"] is not None:
		return errorresponse(requestdata["error"])
	data=requestdata["data"]
	scoringtype=data.get("scoringtype") or "profit"
	# 系列賽流水號 token: SE + 年份 + 6 碼序號
	# 以既有 token 的序號最大值 +1 當種子 (含軟刪列, 不能過濾 deletetime), 避免 COUNT(*) 在併發或刪除後產生重號
	existing=query(SETTING["dbname"],f"""SELECT COALESCE(MAX(CAST(RIGHT("token",6) AS INTEGER)),0)+1 AS seq FROM "series" WHERE "token" ~ '^SE[0-9]+$'""",[],SETTING["dbsetting"])
	seq=_int(existing[0].get("seq"),1) if existing else 1
	seriesid=queryinsert(SETTING["dbname"],"series",{
		"token": f"SE{nowtime().split(' ')[0].split('-')[0]}{str(seq).zfill(6)}",
		"userid": userrow["id"],
		"clubid": _orNone(data.get("clubid")),
		"name": data.get("name"),
		"description": data.get("description"),
		"starttime": _orNone(data.get("starttime")),
		"endtime": _orNone(data.get("endtime")),
		"scoringtype": scoringtype,
		"private": _bool(data.get("private"))
	},SETTING["dbsetting"])
	# 建立時可一併掛入場次
	sessionids=data.get("sessionids") or []
	if sessionids:
		_setseriessessions(seriesid,sessionids,userrow["id"])
	return Response({"success": True,"data": seriesid},status.HTTP_200_OK)

@api_view(["PUT"])
def editseries(request,seriesid):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	seriesrow,allowed=_canseries(seriesid,userrow)
	if not seriesrow:
		return errorresponse("ERROR_series_not_found")
	if not allowed:
		return errorresponse("ERROR_no_permission")
	requestdata=validate(json.loads(request.body),{
		"name": "required|string",
		"clubid": "string",
		"description": "string",
		"starttime": "string",
		"endtime": "string",
		"scoringtype": "string|in:profit,points,place",
		"private": "boolean"
	},{
		"required": "ERROR_request_data_not_found",
		"string": "ERROR_request_data_type_error",
		"boolean": "ERROR_request_data_type_error",
		"in": "ERROR_request_data_type_error"
	})
	if requestdata["error"] is not None:
		return errorresponse(requestdata["error"])
	data=requestdata["data"]
	queryupdate(SETTING["dbname"],"series",{
		"name": data.get("name"),
		"clubid": _orNone(data.get("clubid")),
		"description": data.get("description"),
		"starttime": _orNone(data.get("starttime")),
		"endtime": _orNone(data.get("endtime")),
		"scoringtype": data.get("scoringtype") or "profit",
		"private": _bool(data.get("private")),
		"updatetime": nowtime()
	},{"id": seriesid},SETTING["dbsetting"])
	return Response({"success": True,"data": seriesid},status.HTTP_200_OK)

@api_view(["DELETE"])
def deleteseries(request,seriesid):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	seriesrow,allowed=_canseries(seriesid,userrow)
	if not seriesrow:
		return errorresponse("ERROR_series_not_found")
	if not allowed:
		return errorresponse("ERROR_no_permission")
	query(SETTING["dbname"],f"""UPDATE "series" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "id"=%s AND "deletetime" IS NULL""",[seriesid],SETTING["dbsetting"])
	query(SETTING["dbname"],f"""UPDATE "seriessession" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "seriesid"=%s AND "deletetime" IS NULL""",[seriesid],SETTING["dbsetting"])
	return Response({"success": True,"data": seriesid},status.HTTP_200_OK)

def _setseriessessions(seriesid,sessionids,ownerid):
	"""把系列賽成員設成指定的 sessionids (僅限該使用者自己的場次)。
	既有但不在清單內的成員軟刪除; 清單內的成員重新啟用或新增, 並依清單順序寫入 sortorder。"""
	# 先把目前所有成員軟刪除, 後面再對清單內的逐一復活/新增
	query(SETTING["dbname"],f"""UPDATE "seriessession" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "seriesid"=%s AND "deletetime" IS NULL""",[seriesid],SETTING["dbsetting"])
	order=0
	for i in range(len(sessionids)):
		sessionid=sessionids[i]
		ownrow=query(SETTING["dbname"],f"""SELECT "id" FROM "session" WHERE "id"=%s AND "userid"=%s AND "deletetime" IS NULL""",[sessionid,ownerid],SETTING["dbsetting"])
		if not ownrow:
			continue
		oldrow=query(SETTING["dbname"],f"""SELECT "id" FROM "seriessession" WHERE "seriesid"=%s AND "sessionid"=%s""",[seriesid,sessionid],SETTING["dbsetting"])
		if oldrow:
			query(SETTING["dbname"],f"""UPDATE "seriessession" SET "deletetime"=NULL,"sortorder"=%s,"updatetime"=NOW() WHERE "id"=%s""",[order,oldrow[0]["id"]],SETTING["dbsetting"])
		else:
			queryinsert(SETTING["dbname"],"seriessession",{
				"seriesid": seriesid,
				"sessionid": sessionid,
				"sortorder": order
			},SETTING["dbsetting"])
		order=order+1

def _serieleaderboard(seriesrow):
	"""跨系列賽底下各場次, 把每位玩家的成績彙總成排行榜。
	統計主辦場次 (owned) 裡狀態為 registered/confirmed/advanced 的報名玩家 (含自行報名但尚未報到者, 買入成本一樣算);
	每場用 _attachfinance 算出該玩家的 finalprize / cost / profit, 與場次內結算完全一致。"""
	sessionrows=query(SETTING["dbname"],f"""
		SELECT s.*
		FROM "seriessession" ss
		JOIN "session" s ON s."id"=ss."sessionid" AND s."deletetime" IS NULL
		WHERE ss."seriesid"=%s AND ss."deletetime" IS NULL AND s."owned"=true
		ORDER BY s."starttime" ASC
	""",[seriesrow["id"]],SETTING["dbsetting"]) or []
	players={}
	# 批次撈出所有場次的報名紀錄與人次統計, 再於 Python 端依 sessionid 分組, 避免每場各跑 3 次查詢 (N+1)
	sessionidlist=[]
	sessionmapping={}
	for sessionrow in sessionrows:
		if sessionrow["id"] not in sessionidlist:
			sessionidlist.append(sessionrow["id"])
		sessionmapping[sessionrow["id"]]=sessionrow
	playerrowmapping={}
	playermapping={}
	entriesmapping={}
	payoutmapping={}
	if sessionidlist:
		placeholders=",".join(["%s"]*len(sessionidlist))
		playerrowlist=query(SETTING["dbname"],f"""
			SELECT sp.*, u."name" AS playername, u."playerid" AS playerplayerid,
			       tp."place" AS timerplace, tp."status" AS timerstatus
			FROM "sessionplayer" sp
			JOIN "user" u ON u."id"=sp."userid"
			LEFT JOIN "sessiontimerplayer" tp ON tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."deletetime" IS NULL
			WHERE sp."sessionid" IN ({placeholders}) AND sp."status" IN ('registered','confirmed','advanced') AND sp."deletetime" IS NULL
		""",sessionidlist,SETTING["dbsetting"]) or []
		for prow in playerrowlist:
			if prow["sessionid"] not in playerrowmapping:
				playerrowmapping[prow["sessionid"]]=[]
			playerrowmapping[prow["sessionid"]].append(prow)
			playermapping[str(prow["userid"])+":"+str(prow["sessionid"])]=prow
		# 該場總人次 (含重買/重入), 用來算「擊敗人數」積分: 每場積分 = 總人次 - 名次
		entriesrowlist=query(SETTING["dbname"],f"""SELECT "sessionid",SUM(1+COALESCE("rebuycount",0)+COALESCE("reentrycount",0)) AS count FROM "sessionplayer" WHERE "sessionid" IN ({placeholders}) AND "status" IN ('registered','confirmed','advanced') AND "deletetime" IS NULL GROUP BY "sessionid" """,sessionidlist,SETTING["dbsetting"]) or []
		for item in entriesrowlist:
			entriesmapping[item["sessionid"]]=_int(item["count"],0)
		payoutrowlist=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerpayout" WHERE "sessionid" IN ({placeholders}) AND "deletetime" IS NULL ORDER BY "sessionid" ASC,"sortorder" ASC""",sessionidlist,SETTING["dbsetting"]) or []
		for item in payoutrowlist:
			if item["sessionid"] not in payoutmapping:
				payoutmapping[item["sessionid"]]=[]
			payoutmapping[item["sessionid"]].append(item)
	totalentriesmapping=_sessiontotalentriesmapping(sessionidlist)
	for sessionrow in sessionrows:
		rows=_attachfinance(sessionrow,playerrowmapping.get(sessionrow["id"]) or [],totalentriesmapping.get(sessionrow["id"],0))
		totalentries=entriesmapping.get(sessionrow["id"],0)
		if totalentries==0:
			totalentries=len(rows)
		for row in rows:
			userid=row["userid"]
			agg=players.get(userid)
			if agg is None:
				agg={
					"userid": userid,
					"playername": row.get("playername"),
					"playerplayerid": row.get("playerplayerid"),
					"entries": 0,
					"totalprize": 0,
					"totalcost": 0,
					"totalprofit": 0,
					"cashes": 0,
					"points": 0,
					"bestplace": None,
					"bestadvancelevel": "",
					"bestadvancevalue": 0
				}
				players[userid]=agg
			agg["entries"]=agg["entries"]+1
			agg["totalprize"]=agg["totalprize"]+float(row.get("finalprize") or 0)
			agg["totalcost"]=agg["totalcost"]+float(row.get("cost") or 0)
			agg["totalprofit"]=agg["totalprofit"]+float(row.get("profit") or 0)
			place=_int(row.get("timerplace"),0)
			if place<=0:
				place=_int(row.get("place"),0)
			if _rankrewarded(payoutmapping.get(sessionrow["id"]) or [],place if place>0 else None):
				agg["cashes"]=agg["cashes"]+1
			if place>0 and (agg["bestplace"] is None or place<agg["bestplace"]):
				agg["bestplace"]=place
			advancepath=_advancepath(row,playermapping,sessionmapping)
			advancebest=_advancebest(advancepath)
			if agg["bestadvancevalue"]<advancebest["value"]:
				agg["bestadvancelevel"]=advancebest["label"]
				agg["bestadvancevalue"]=advancebest["value"]
			# 擊敗人數積分: 名次越前、人數越多分數越高; 沒名次給 0
			if place>0 and totalentries>place:
				agg["points"]=agg["points"]+(totalentries-place)
	board=list(players.values())
	scoringtype=seriesrow.get("scoringtype") or "profit"
	if scoringtype=="place":
		# 名次優先 (越小越前), 沒名次的排後面, 同名次再看盈虧
		board.sort(key=lambda x: (x["bestplace"] if x["bestplace"] is not None else 1000000,-x["bestadvancevalue"],-x["totalprofit"]))
	elif scoringtype=="points":
		# 擊敗人數積分高者在前, 同分再看盈虧
		board.sort(key=lambda x: (-x["points"],-x["totalprofit"]))
	else:
		board.sort(key=lambda x: -x["totalprofit"])
	for i in range(len(board)):
		board[i]["rank"]=i+1
	return board

def _pagination(total,page,limit):
	if page<=0:
		page=1
	if limit<=0:
		limit=20
	if 100<limit:
		limit=100
	totalpages=(total+limit-1)//limit
	if totalpages<=0:
		totalpages=1
	if totalpages<page:
		page=totalpages
	return {
		"page": page,
		"limit": limit,
		"total": total,
		"totalpages": totalpages,
		"hasprev": 1<page,
		"hasnext": page<totalpages
	}

@api_view(["GET"])
def getseriesleaderboard(request,seriesid):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	seriesrow,canview,isowner=_canviewseries(seriesid,userrow)
	if not seriesrow:
		return errorresponse("ERROR_series_not_found")
	if not canview:
		return errorresponse("ERROR_no_permission")
	page=_int(request.GET.get("page"),1)
	limit=_int(request.GET.get("limit"),20)
	board=_serieleaderboard(seriesrow)
	pagination=_pagination(len(board),page,limit)
	start=(pagination["page"]-1)*pagination["limit"]
	end=start+pagination["limit"]
	return Response({"success": True,"data": {
		"scoringtype": seriesrow.get("scoringtype") or "profit",
		"leaderboard": board[start:end],
		"pagination": pagination
	}},status.HTTP_200_OK)

def _appendseriessessions(seriesid,sessionids,ownerid):
	"""把場次「附加」到既有系列賽 (不動原本成員)。一個系列賽可含多個多日賽事時用這個。
	既有(被軟刪)的成員會復活, 新的接在現有 sortorder 之後。"""
	maxrow=query(SETTING["dbname"],f"""SELECT COALESCE(MAX("sortorder"),-1) AS maxorder FROM "seriessession" WHERE "seriesid"=%s AND "deletetime" IS NULL""",[seriesid],SETTING["dbsetting"])
	order=_int(maxrow[0].get("maxorder"),-1)+1 if maxrow else 0
	for i in range(len(sessionids)):
		sessionid=sessionids[i]
		ownrow=query(SETTING["dbname"],f"""SELECT "id" FROM "session" WHERE "id"=%s AND "userid"=%s AND "deletetime" IS NULL""",[sessionid,ownerid],SETTING["dbsetting"])
		if not ownrow:
			continue
		oldrow=query(SETTING["dbname"],f"""SELECT "id","deletetime" FROM "seriessession" WHERE "seriesid"=%s AND "sessionid"=%s""",[seriesid,sessionid],SETTING["dbsetting"])
		if oldrow:
			if oldrow[0].get("deletetime") is not None:
				query(SETTING["dbname"],f"""UPDATE "seriessession" SET "deletetime"=NULL,"sortorder"=%s,"updatetime"=NOW() WHERE "id"=%s""",[order,oldrow[0]["id"]],SETTING["dbsetting"])
				order=order+1
		else:
			queryinsert(SETTING["dbname"],"seriessession",{
				"seriesid": seriesid,
				"sessionid": sessionid,
				"sortorder": order
			},SETTING["dbsetting"])
			order=order+1

@api_view(["PUT"])
def editseriessessions(request,seriesid):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	seriesrow,allowed=_canseries(seriesid,userrow)
	if not seriesrow:
		return errorresponse("ERROR_series_not_found")
	if not allowed:
		return errorresponse("ERROR_no_permission")
	requestdata=validate(json.loads(request.body),{
		"sessionids": "array",
		"sessionids.*": "integer"
	},{
		"array": "ERROR_request_data_type_error",
		"integer": "ERROR_request_data_type_error"
	})
	if requestdata["error"] is not None:
		return errorresponse(requestdata["error"])
	sessionids=requestdata["data"].get("sessionids") or []
	_setseriessessions(seriesid,sessionids,seriesrow["userid"])
	sessions=_seriessessions(seriesid)
	return Response({"success": True,"data": {
		"sessions": sessions,
		"aggregate": _aggregate(sessions)
	}},status.HTTP_200_OK)
