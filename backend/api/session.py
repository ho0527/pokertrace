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
	return _num(row.get("winprice"),0)-(buyintotal+rebuytotal*_num(row.get("rebuycount"),0))

def _sessionshowmoney(row):
	if row.get("isstaff")==True:
		return False
	if row.get("isown")==False and row.get("owned")==True:
		return row.get("myregistrationstatus")=="confirmed"
	if row.get("isown")==True and row.get("owned")==False:
		return True
	return False

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

def _gettokenuser(request):
	header=request.headers.get("Authorization")
	token=None
	try:
		if header:
			token=header.split("Bearer ")[1]
	except Exception as error:
		return (None,errorresponse("ERROR_token_not_found"))
	if not token:
		return (None,errorresponse("ERROR_token_not_found"))
	tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
	if not tokenrow:
		return (None,errorresponse("ERROR_token_error"))
	userrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s AND "deletetime" IS NULL""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
	if not userrow:
		return (None,errorresponse("ERROR_user_not_found"))
	return (userrow[0],None)

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
	limit=_int(request.GET.get("limit"),40)
	if limit<=0:
		limit=40
	page=_int(request.GET.get("page"),1)
	if page<=0:
		page=1
	offset=(page-1)*limit
	where=["a.\"deletetime\" IS NULL"]
	params=[tokenuserrow["id"],tokenuserrow["id"],tokenuserrow["id"],tokenuserrow["id"],tokenuserrow["id"],tokenuserrow["id"]]
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
	wheresql=" AND ".join(where)
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
			       CASE
			           WHEN sp."id" IS NULL THEN NULL
			           WHEN sp."paymenttype"='ticket' THEN COALESCE(NULLIF(sp."ticketvalue",0),a."ticketvalue",0)
			           ELSE COALESCE(NULLIF(sp."buyin",0),a."buyin",0)+COALESCE(NULLIF(sp."fee",0),a."buyinfee",0)
			       END
			       + (COALESCE(a."rebuybuyin",0)+COALESCE(a."rebuyfee",0))*COALESCE(sp."rebuycount",0)
			       + (COALESCE(a."reentrybuyin",0)+COALESCE(a."reentryfee",0))*COALESCE(sp."reentrycount",0)
			       + (COALESCE(a."addonbuyin",0)+COALESCE(a."addonfee",0))*COALESCE(sp."addoncount",0) AS mycost,
			       COALESCE(sp."prizeoverride",sp."prize",0) AS myfinalprize
			FROM access a
			LEFT JOIN "club" c ON c."id"=a."clubid" AND c."deletetime" IS NULL
			LEFT JOIN "sessionplayer" sp ON sp."sessionid"=a."id" AND sp."userid"=%s AND sp."deletetime" IS NULL
			LEFT JOIN "sessiontimerplayer" tp ON tp."sessionid"=a."id" AND tp."userid"=%s AND tp."deletetime" IS NULL
			WHERE {wheresql}
		),
		scored AS (
			SELECT *,
			       CASE WHEN isstaff=false AND ((isown=false AND owned=true AND myregistrationstatus='confirmed') OR (isown=true AND owned=false)) THEN 1 ELSE 0 END AS statcount,
			       CASE
			           WHEN isstaff=false AND isown=false AND owned=true AND myregistrationstatus='confirmed' THEN COALESCE(myfinalprize,0)-COALESCE(mycost,0)
			           WHEN isstaff=false AND isown=true AND owned=false THEN COALESCE(winprice,0)-((COALESCE(buyin,0)+COALESCE(buyinfee,0))+(COALESCE(rebuybuyin,0)+COALESCE(rebuyfee,0))*COALESCE(rebuycount,0))
			           ELSE 0
			       END AS statprofit,
			       CASE WHEN isstaff=false AND ((isown=false AND owned=true AND myregistrationstatus='confirmed') OR (isown=true AND owned=false)) THEN EXTRACT(EPOCH FROM (endtime-starttime))/60 ELSE NULL END AS statduration
			FROM filtered
		)
		SELECT *, COUNT(*) OVER() AS totalrows, SUM(statcount) OVER() AS statgamecount, SUM(statprofit) OVER() AS stattotalprofit, AVG(statduration) OVER() AS statavgduration
		FROM scored
		ORDER BY "starttime" DESC
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
		myregistration=None
		if item.get("myregistrationid"):
			myregistration={
				"id": item.get("myregistrationid"),
				"status": item.get("myregistrationstatus"),
				"cost": item.get("mycost") or 0,
				"profit": (item.get("myfinalprize") or 0)-(item.get("mycost") or 0),
				"finalprize": item.get("myfinalprize") or 0,
				"timerplace": item.get("mytimerplace"),
				"place": item.get("myplace")
			}
		item["clubname"]=item.get("clubname") or "協會被刪除"
		item["myregistration"]=myregistration
		for key in ["totalrows","statgamecount","stattotalprofit","statavgduration","statcount","statprofit","statduration","myregistrationid","mybuyin","myfee","myrebuycount","myreentrycount","myaddoncount","mypaymenttype","myticketvalue","myprize","myprizeoverride","myplace","mytimerplace","mycost","myfinalprize"]:
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

try:
	@api_view(["GET"])
	def getsessionlist(request):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

		if token:
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					data=[]
					tokenuserrow=tokenuserrow[0]
					return _fastsessionlist(request,tokenuserrow)
					rowmap={}

					row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL ORDER BY "starttime" DESC""",[tokenuserrow["id"]],SETTING["dbsetting"])
					for session in row:
						sessiondata=dict(session)
						sessiondata["isown"]=True
						sessiondata["isstaff"]=False
						sessiondata["accessrole"]="owner"
						sessiondata["accesssource"]="owner"
						sessiondata["accessownerid"]=tokenuserrow["id"]
						rowmap[sessiondata["id"]]=sessiondata

					staffrow=query(SETTING["dbname"],
						f"""SELECT s.*, us."role" AS accessrole, us."userid" AS accessownerid
						   FROM "userstaff" us
						   JOIN "session" s ON s."userid"=us."userid"
						   WHERE us."staffuserid"=%s AND us."status"='active' AND us."deletetime" IS NULL AND s."owned"=true AND s."deletetime" IS NULL
						   ORDER BY s."starttime" DESC""",
						[tokenuserrow["id"]],
						SETTING["dbsetting"]
					)
					for session in staffrow:
						if session["id"] not in rowmap:
							sessiondata=dict(session)
							sessiondata["isown"]=False
							sessiondata["isstaff"]=True
							sessiondata["accesssource"]="userstaff"
							rowmap[sessiondata["id"]]=sessiondata

					sessionstaffrow=query(SETTING["dbname"],
						f"""SELECT s.*, ss."role" AS accessrole, s."userid" AS accessownerid
						   FROM "sessionstaff" ss
						   JOIN "session" s ON s."id"=ss."sessionid"
						   WHERE ss."staffuserid"=%s AND ss."status"='active' AND ss."deletetime" IS NULL AND s."owned"=true AND s."deletetime" IS NULL
						   ORDER BY s."starttime" DESC""",
						[tokenuserrow["id"]],
						SETTING["dbsetting"]
					)
					for session in sessionstaffrow:
						if session["id"] not in rowmap:
							sessiondata=dict(session)
							sessiondata["isown"]=False
							sessiondata["isstaff"]=True
							sessiondata["accesssource"]="sessionstaff"
							rowmap[sessiondata["id"]]=sessiondata

					publicrow=query(SETTING["dbname"],
						f"""SELECT*FROM "session"
						   WHERE "owned"=true AND "linkuser"=true AND "userid"<>%s AND "deletetime" IS NULL
						   ORDER BY "starttime" DESC""",
						[tokenuserrow["id"]],
						SETTING["dbsetting"]
					)
					for session in publicrow:
						if session["id"] not in rowmap:
							sessiondata=dict(session)
							sessiondata["isown"]=False
							sessiondata["isstaff"]=False
							sessiondata["accessrole"]=""
							sessiondata["accesssource"]="registration"
							sessiondata["accessownerid"]=session["userid"]
							rowmap[sessiondata["id"]]=sessiondata

					row=list(rowmap.values())
					row.sort(key=lambda item:item["starttime"],reverse=True)

					for session in row:
						clubrow=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[session["clubid"]],SETTING["dbsetting"])
						myregistrationstatus=None
						myregistration=None
						if session["owned"] and session["linkuser"]:
							myregistration=getmyregistrationfinance(session,tokenuserrow["id"])
							if myregistration:
								myregistrationstatus=myregistration["status"]
						data.append({
							**session,
							"club": clubrow[0] if clubrow else null,
							"clubname": clubrow[0]["name"] if clubrow else "協會被刪除",
							"myregistrationstatus": myregistrationstatus,
							"myregistration": myregistration
						})

					startdate=request.GET.get("startdate") or ""
					enddate=request.GET.get("enddate") or ""
					club=request.GET.get("club") or ""
					gametype=request.GET.get("gametype") or ""
					name=request.GET.get("name") or ""
					filtered=[]
					for item in data:
						if _filtermatches(item,startdate,enddate,club,gametype,name):
							filtered.append(item)

					gamecount=0
					totalprofit=0
					totalduration=0
					for item in filtered:
						if _sessionshowmoney(item):
							gamecount=gamecount+1
							totalprofit=totalprofit+_sessionprofit(item)
							totalduration=totalduration+_sessiondurationminutes(item)

					limit=_int(request.GET.get("limit"),40)
					if limit<=0:
						limit=40
					page=_int(request.GET.get("page"),1)
					if page<=0:
						page=1
					total=len(filtered)
					totalpages=(total+limit-1)//limit
					if totalpages<=0:
						totalpages=1
					if totalpages<page:
						page=totalpages
					start=(page-1)*limit
					end=start+limit

					return Response({
						"success": True,
						"data": {
							"sessions": filtered[start:end],
							"stats": {
								"gamecount": gamecount,
								"totalprofit": totalprofit,
								"avgduration": int(totalduration/gamecount) if 0<gamecount else 0
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
				else:
					return errorresponse("ERROR_user_not_found")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["GET"])
	def getsession(request,sessionid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

		if token:
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
					if row:
						row=row[0]
						# 報名功能: 開放 linkuser=true 的場次給所有人看 (任何人都能報名)
						# 否則維持原權限規則 (只有 owner 或 admin 看得到)
						islinkopen=bool(row.get("linkuser"))
						isown=(tokenuserrow[0]["id"]==row["userid"])
						isadmin=(4<=int(tokenuserrow[0]["permission"]))
						access=getsessionstaffaccess(sessionid,tokenuserrow[0]["id"])
						isstaff=access["isstaff"] if access else False
						accessrole=access["accessrole"] if access else ""
						accesssource=access["accesssource"] if access else ""

						if isown or isadmin or isstaff or islinkopen:
							clubrow=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[row["clubid"]],SETTING["dbsetting"])

							# 順便查當前 user 的報名狀態 (沒報過 = None)
							myregistrationstatus=None
							myregistration=getmyregistrationfinance(row,tokenuserrow[0]["id"])
							if myregistration:
								myregistrationstatus=myregistration["status"]

							return Response({
								"success": True,
								"data": {
									**row,
									"club": clubrow[0] if clubrow else null,
									"clubname": clubrow[0]["name"] if clubrow else "協會被刪除",
									"isown": isown,
									"isadmin": isadmin,
									"isstaff": isstaff,
									"accessrole": accessrole,
									"accesssource": accesssource,
									"myregistrationstatus": myregistrationstatus,
									"myregistration": myregistration,
									"relations": _sessionrelations(sessionid),
									"relationdata": _sessionrelationdata(sessionid),
									"chips": _sessionchips(sessionid)
								}
							},status.HTTP_200_OK)
						else:
							return errorresponse("ERROR_no_permission")
					else:
						return errorresponse("ERROR_session_not_found")
				else:
					return errorresponse("ERROR_user_not_found")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["POST"])
	def newsession(request):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

		if token:
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
					data=json.loads(request.body)

					requestdata=validate(data,{
						"gametype": "required|string|in:cash,tournament,limited",
						"name": "required|string",
						"clubid": "required|string",
						"buyin": "required|integer",
						"buyinfee": "integer",
						"chip": "integer",
						"rebuycount": "required|integer",
						"rebuybuyin": "required|integer",
						"rebuyfee": "integer",
						"rebuychip": "integer",
						"reentrycount": "integer",
						"reentrybuyin": "integer",
						"reentryfee": "integer",
						"reentrychip": "integer",
						"addoncount": "integer",
						"addonbuyin": "integer",
						"addonfee": "integer",
						"addonchip": "integer",
						"linkuser": "boolean",
						"winprice": "required|integer",
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
							# 非主辦時, linkuser 與 reentry/addon 系列不適用, 歸預設
							linkuser=False
							rebuychip=0
							reentrycount=0
							reentrybuyin=0
							reentryfee=0
							reentrychip=0
							addoncount=0
							addonbuyin=0
							addonfee=0
							addonchip=0

						if linkuser==True or linkuser==1 or linkuser=="1":
							linkuser=True
						else:
							linkuser=False
						if not linkuser:
							openregistration=False

						if inmoney==True or inmoney==1 or inmoney=="1":
							inmoney=True
						else:
							inmoney=False

						if inft==True or inft==1 or inft=="1":
							inft=True
						else:
							inft=False

						row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "gametype"=%s""",[gametype],SETTING["dbsetting"])

						newsessionid=queryinsert(SETTING["dbname"],"session",{
							"token": f"{gametype[:2].upper()}{nowtime().split(' ')[0].split('-')[0]}{(str(len(row)+1)).zfill(4)}",
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
							"unifiedhandrecord": unifiedhandrecord
						},SETTING["dbsetting"])

						return Response({
							"success": True,
							"data": newsessionid
						},status.HTTP_200_OK)
					else:
						return errorresponse(requestdata["error"])
				else:
					return Response({
						"success": False,
						"data": "ERROR_no_permission"
					},status.HTTP_403_FORBIDDEN)
			else:
				return Response({
					"success": False,
					"data": "ERROR_token_error"
				},status.HTTP_403_FORBIDDEN)
		else:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

	@api_view(["PUT"])
	def editsession(request,sessionid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

		if token:
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
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
							"buyin": "required|integer",
							"buyinfee": "integer",
							"chip": "required|integer",
							"rebuycount": "required|integer",
							"rebuybuyin": "required|integer",
							"rebuyfee": "integer",
							"rebuychip": "integer",
							"reentrycount": "integer",
							"reentrybuyin": "integer",
							"reentryfee": "integer",
							"reentrychip": "integer",
							"addoncount": "integer",
							"addonbuyin": "integer",
							"addonfee": "integer",
							"addonchip": "integer",
							"linkuser": "boolean",
							"winprice": "required|integer",
							"winthing": "required|string",
							"inmoney": "boolean",
							"inft": "boolean",
							"starttime": "required|string",
							"endtime": "required|string",
							"place": "required|string",
							"totalbuyin": "required|string",
							"owned": "boolean",
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
								rebuychip=0
								reentrycount=0
								reentrybuyin=0
								reentryfee=0
								reentrychip=0
								addoncount=0
								addonbuyin=0
								addonfee=0
								addonchip=0

							if linkuser==True or linkuser==1 or linkuser=="1":
								linkuser=True
							else:
								linkuser=False

							if inmoney==True or inmoney==1 or inmoney=="1":
								inmoney=True
							else:
								inmoney=False

							if inft==True or inft==1 or inft=="1":
								inft=True
							else:
								inft=False

							queryupdate(SETTING["dbname"],"session",{
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
								"updatetime": nowtime()
							},{
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
				else:
					return Response({
						"success": False,
						"data": "ERROR_no_permission"
					},status.HTTP_403_FORBIDDEN)
			else:
				return Response({
					"success": False,
					"data": "ERROR_token_error"
				},status.HTTP_403_FORBIDDEN)
		else:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

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
			"buyin": "integer",
			"buyinfee": "integer",
			"chip": "integer",
			"rebuycount": "integer",
			"rebuybuyin": "integer",
			"rebuyfee": "integer",
			"rebuychip": "integer",
			"reentrycount": "integer",
			"reentrybuyin": "integer",
			"reentryfee": "integer",
			"reentrychip": "integer",
			"addoncount": "integer",
			"addonbuyin": "integer",
			"addonfee": "integer",
			"addonchip": "integer",
			"linkuser": "boolean",
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
			"ticketenabled": "boolean",
			"ticketvalue": "integer",
			"openregistration": "boolean",
			"maxseat": "integer",
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
		update={}
		for key in ["name","clubid","buyin","buyinfee","chip","rebuycount","rebuybuyin","rebuyfee","rebuychip","reentrycount","reentrybuyin","reentryfee","reentrychip","addoncount","addonbuyin","addonfee","addonchip","linkuser","owned","starttime","endtime","description","gametypeid","limittypeid","stacktypeid","eventtypeid","ticketenabled","ticketvalue","openregistration","maxseat"]:
			if key in data:
				update[key]=data.get(key)
		if "antemode" in data:
			update["antemode"]="ante" if data.get("antemode")=="ante" else "bigblindante"
		if "unifiedhandrecord" in data:
			update["unifiedhandrecord"]=_bool(data.get("unifiedhandrecord"))
		if "owned" in update and not _bool(update["owned"]):
			update["linkuser"]=False
			update["openregistration"]=False
		if "linkuser" in update and not _bool(update["linkuser"]):
			update["openregistration"]=False
		update["updatetime"]=nowtime()
		queryupdate(SETTING["dbname"],"session",update,{"id": sessionid},SETTING["dbsetting"])
		if "chips" in data:
			_savesessionchips(sessionid,data.get("chips") or [])
		row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s""",[sessionid],SETTING["dbsetting"])
		payload=row[0] if row else {}
		payload["chips"]=_sessionchips(sessionid)
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
			"rebuycount": "required|integer",
			"winprice": "required|integer",
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
			"rebuycount": data.get("rebuycount"),
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
		sessionrow,allowed=_cansessionsetting(sessionid,userrow)
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		if not allowed:
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
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

		if token:
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
					row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
					if row:
						row=row[0]
						isadmin=(4<=int(tokenuserrow["permission"]))
						if not (isadmin or row["userid"]==tokenuserrow["id"]):
							return errorresponse("ERROR_no_permission")

						query(SETTING["dbname"],f"""UPDATE "session" SET "deletetime"=NOW() WHERE "id"=%s""",[sessionid],SETTING["dbsetting"])

						return Response({
							"success": True,
							"data": ""
						},status.HTTP_200_OK)
					else:
						return Response({
							"success": False,
							"data": "ERROR_session_not_found"
						},status.HTTP_404_NOT_FOUND)
				else:
					return Response({
						"success": False,
						"data": "ERROR_no_permission"
					},status.HTTP_403_FORBIDDEN)
			else:
				return Response({
					"success": False,
					"data": "ERROR_token_error"
				},status.HTTP_403_FORBIDDEN)
		else:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

	@api_view(["POST"])
	def copysession(request,sessionid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

		if token:
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
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
						maxseat=row.get("maxseat") or 9

						row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "gametype"=%s""",[gametype],SETTING["dbsetting"])

						newsessionid=queryinsert(SETTING["dbname"],"session",{
							"token": f"{gametype[:2].upper()}{nowtime().split(' ')[0].split('-')[0]}{(str(len(row)+1)).zfill(4)}",
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

						tablerow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
						tablecount=0

						for table in tablerow:
							queryinsert(SETTING["dbname"],"table",{
								"token": f"TB{newsessionrow["token"]}{(str(tablecount+1)).zfill(2)}",
								"sessionid": newsessionid,
								"name": table["name"]
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
								"marqueetext": timerconfig.get("marqueetext") or ""
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
				else:
					return Response({
						"success": False,
						"data": "ERROR_no_permission"
					},status.HTTP_403_FORBIDDEN)
			else:
				return Response({
					"success": False,
					"data": "ERROR_token_error"
				},status.HTTP_403_FORBIDDEN)
		else:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)
except Exception as error:
	printcolorhaveline("fail","[ERROR] "+str(error),"")
	Response({
		"success": False,
		"data": "ERROR_unknow_error_pls_tell_the_admin:\n"+str(error)
	},status.HTTP_500_INTERNAL_SERVER_ERROR)
