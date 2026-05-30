# sessionplayer.py
# ===========================================================================
# 主辦牌局報名 API
#   * 玩家報名 / 取消 / 查自己的報名清單
#   * 主辦人查自己場次的報名 / 確認 / 取消
# ===========================================================================

import json
import random
from django.http import HttpResponse,HttpResponseRedirect,JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view,renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

# 自創
from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *


def _gettokenuser(request):
	# 取得 token 對應的 user; 失敗回傳 (None, errorresponse)
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

def _num(value,defaultvalue=0):
	try:
		if value is None:
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

def _requireowner(sessionrow,user):
	if sessionrow["userid"]==user["id"] or 4<=int(user["permission"]):
		return True
	return False

def _ranknumber(value):
	try:
		if value is None or value=="":
			return None
		text=str(value)
		num=""
		for i in range(len(text)):
			if text[i].isdigit():
				num=num+text[i]
			elif num!="":
				break
		if num!="":
			return int(num)
	except Exception as error:
		return None
	return None

def _timerprizepool(sessionrow,totalentries):
	configrow=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerconfig" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionrow["id"]],SETTING["dbsetting"])
	if configrow and configrow[0].get("prizepoolmode")=="manual":
		return _num(configrow[0].get("prizepoolmanual"),0)
	return _num(sessionrow.get("buyin"),0)*totalentries

def _payoutamount(sessionrow,place,totalentries):
	if place is None:
		return 0
	payoutrow=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerpayout" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionrow["id"]],SETTING["dbsetting"])
	if not payoutrow:
		return 0
	pool=_timerprizepool(sessionrow,totalentries)
	totalpct=0
	for item in payoutrow:
		totalpct=totalpct+_num(item.get("pct"),0)
	for item in payoutrow:
		rank=_ranknumber(item.get("rank"))
		if rank==place:
			reward=item.get("reward") or ""
			try:
				if reward!="":
					return float(reward)
			except Exception as error:
				pass
			pct=_num(item.get("pct"),0)
			if totalpct<=1.5:
				return round(pool*pct)
			return round(pool*pct/100)
	return 0

def _cost(sessionrow,row):
	if row.get("paymenttype")=="ticket":
		base=_num(row.get("ticketvalue"),0)
		if base<=0:
			base=_num(sessionrow.get("ticketvalue"),0)
	else:
		buyin=_num(row.get("buyin"),0)
		fee=_num(row.get("fee"),0)
		if buyin<=0:
			buyin=_num(sessionrow.get("buyin"),0)
		if fee<=0:
			fee=_num(sessionrow.get("buyinfee"),0)
		base=buyin+fee
	base=base+(_num(sessionrow.get("rebuybuyin"),0)+_num(sessionrow.get("rebuyfee"),0))*_int(row.get("rebuycount"),0)
	base=base+(_num(sessionrow.get("reentrybuyin"),0)+_num(sessionrow.get("reentryfee"),0))*_int(row.get("reentrycount"),0)
	base=base+(_num(sessionrow.get("addonbuyin"),0)+_num(sessionrow.get("addonfee"),0))*_int(row.get("addoncount"),0)
	return base

def _attachfinance(sessionrow,rows):
	totalentries=0
	if sessionrow and sessionrow.get("id"):
		countrow=query(SETTING["dbname"],f"""SELECT COUNT(*) AS count FROM "sessionplayer" WHERE "sessionid"=%s AND "status" IN ('confirmed','advanced') AND "deletetime" IS NULL""",[sessionrow["id"]],SETTING["dbsetting"])
		if countrow and countrow[0]["count"]:
			totalentries=_int(countrow[0]["count"],0)
	for row in rows or []:
		if totalentries==0 and (row["status"]=="confirmed" or row["status"]=="advanced"):
			totalentries=totalentries+1
	if totalentries==0:
		totalentries=len(rows or [])
	for row in rows or []:
		place=_int(row.get("timerplace"),0)
		if place==0:
			place=_int(row.get("place"),0)
		if place==0:
			place=None
		autoprize=_payoutamount(sessionrow,place,totalentries)
		override=row.get("prizeoverride")
		if override is None:
			prize=_num(row.get("prize"),autoprize)
			if prize==0:
				prize=autoprize
		else:
			prize=_num(override,0)
		cost=_cost(sessionrow,row)
		row["timerplace"]=place
		row["autoprize"]=autoprize
		row["finalprize"]=prize
		row["cost"]=cost
		row["profit"]=prize-cost
	return rows or []

def _nextserialno(sessionid):
	row=query(SETTING["dbname"],f"""SELECT COALESCE(MAX("serialno"),0)+1 AS serialno FROM "sessionplayer" WHERE "sessionid"=%s""",[sessionid],SETTING["dbsetting"])
	if row:
		return row[0]["serialno"]
	return 1

def _multidaytargets(sessionid):
	return query(SETTING["dbname"],f"""
		SELECT s.*
		FROM "sessionrelation" sr
		JOIN "session" s ON s."id"=sr."targetid" AND s."deletetime" IS NULL
		WHERE sr."sourceid"=%s AND sr."relationtype"='multiday' AND sr."deletetime" IS NULL
		ORDER BY s."starttime" ASC,s."id" ASC
	""",[sessionid],SETTING["dbsetting"]) or []

def _upsertadvancetarget(sourceplayer,source,targets,chip):
	if not targets:
		return (None,None)
	target=targets[0]
	existing=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s""",[target["id"],sourceplayer["userid"]],SETTING["dbsetting"])
	if existing:
		existing=existing[0]
		currentchip=_num(existing.get("startchip"),0)
		update={
			"status": existing["status"] if existing["status"] in ["registered","confirmed"] else "registered",
			"deletetime": None,
			"updatetime": nowtime(),
			"advancesourceid": source["id"]
		}
		if currentchip<=chip:
			update["startchip"]=chip
		if existing.get("serialno") is None:
			update["serialno"]=_nextserialno(target["id"])
		queryupdate(SETTING["dbname"],"sessionplayer",update,{"id": existing["id"]},SETTING["dbsetting"])
		targetplayerid=existing["id"]
	else:
		targetplayerid=queryinsert(SETTING["dbname"],"sessionplayer",{
			"sessionid": target["id"],
			"userid": sourceplayer["userid"],
			"status": "registered",
			"buyin": target.get("buyin") or 0,
			"fee": target.get("buyinfee") or 0,
			"paymenttype": "ticket" if target.get("ticketenabled") else "cash",
			"ticketvalue": target.get("ticketvalue") or 0,
			"startchip": chip,
			"serialno": _nextserialno(target["id"]),
			"advancesourceid": source["id"],
			"registertime": nowtime()
		},SETTING["dbsetting"])
	countrow=query(SETTING["dbname"],f"""
		SELECT COUNT(*) AS count, MAX(sp."advancechip") AS bestchip
		FROM "sessionrelation" sr
		JOIN "sessionplayer" sp ON sp."sessionid"=sr."sourceid" AND sp."userid"=%s AND sp."deletetime" IS NULL
		WHERE sr."targetid"=%s AND sr."relationtype"='multiday' AND sr."deletetime" IS NULL
		  AND sp."advancetargetid"=%s AND sp."advancetime" IS NOT NULL
	""",[sourceplayer["userid"],target["id"],target["id"]],SETTING["dbsetting"])
	return (target,{
		"targetplayerid": targetplayerid,
		"advancecount": _int(countrow[0].get("count"),0) if countrow else 0,
		"bestchip": _num(countrow[0].get("bestchip"),0) if countrow else chip
	})


# main START
try:
	@api_view(["POST"])
	def registersession(request,sessionid):
		# 玩家報名某個主辦場次
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		# 必須是主辦場次且開放報名
		if not sessionrow["owned"] or not sessionrow.get("linkuser") or not sessionrow.get("openregistration"):
			return errorresponse("ERROR_session_not_open_for_registration")

		# 不能報名自己主辦的場次
		if sessionrow["userid"]==user["id"]:
			return errorresponse("ERROR_cannot_register_own_session")

		# 看是否已有報名紀錄
		existing=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s""",[sessionid,user["id"]],SETTING["dbsetting"])

		if existing:
			existing=existing[0]
			if existing["status"]=="registered" or existing["status"]=="confirmed":
				return errorresponse("ERROR_already_registered")
			# 之前取消過, 重新報名 → 改 status 回 registered
			query(SETTING["dbname"],
				f"""UPDATE "sessionplayer" SET "status"='registered',"registertime"=NOW(),"canceltime"=NULL,"updatetime"=NOW(),"deletetime"=NULL,"buyin"=%s,"fee"=%s,"paymenttype"=%s,"ticketvalue"=%s,"startchip"=%s,"serialno"=COALESCE("serialno",%s),"tableid"=NULL,"seatno"=NULL WHERE "id"=%s""",
				[sessionrow.get("buyin") or 0,sessionrow.get("buyinfee") or 0,"ticket" if sessionrow.get("ticketenabled") else "cash",sessionrow.get("ticketvalue") or 0,sessionrow.get("chip") or 0,_nextserialno(sessionid),existing["id"]],
				SETTING["dbsetting"]
			)
			return Response({
				"success": True,
				"data": {
					"id": existing["id"]
				}
			},status.HTTP_200_OK)

		newid=queryinsert(SETTING["dbname"],"sessionplayer",{
			"sessionid": sessionid,
			"userid": user["id"],
			"status": "registered",
			"buyin": sessionrow.get("buyin") or 0,
			"fee": sessionrow.get("buyinfee") or 0,
			"paymenttype": "ticket" if sessionrow.get("ticketenabled") else "cash",
			"ticketvalue": sessionrow.get("ticketvalue") or 0,
			"startchip": sessionrow.get("chip") or 0,
			"serialno": _nextserialno(sessionid),
			"registertime": nowtime()
		},SETTING["dbsetting"])

		return Response({
			"success": True,
			"data": {
				"id": newid
			}
		},status.HTTP_200_OK)

	@api_view(["POST"])
	def registersessionplayer(request,sessionid):
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]
		if not _requireowner(sessionrow,user):
			return errorresponse("ERROR_no_permission")
		if not sessionrow["owned"] or not sessionrow.get("linkuser"):
			return errorresponse("ERROR_session_not_open_for_registration")

		requestdata=validate(json.loads(request.body),{
			"playerid": "required|string"
		},{
			"required": "ERROR_request_data_not_found",
			"string": "ERROR_request_data_type_error"
		})
		if requestdata["error"] is not None:
			return errorresponse(requestdata["error"])

		playerid=requestdata["data"].get("playerid")
		playerrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "playerid"=%s AND "deletetime" IS NULL""",[playerid],SETTING["dbsetting"])
		if not playerrow:
			return errorresponse("ERROR_user_not_found")
		playerrow=playerrow[0]
		if playerrow["id"]==sessionrow["userid"]:
			return errorresponse("ERROR_cannot_register_own_session")

		existing=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s""",[sessionid,playerrow["id"]],SETTING["dbsetting"])
		if existing:
			existing=existing[0]
			if existing["status"]=="registered" or existing["status"]=="confirmed":
				return errorresponse("ERROR_already_registered")
			query(SETTING["dbname"],
				f"""UPDATE "sessionplayer" SET "status"='confirmed',"registertime"=NOW(),"confirmtime"=NOW(),"canceltime"=NULL,"updatetime"=NOW(),"deletetime"=NULL,"buyin"=%s,"fee"=%s,"paymenttype"=%s,"ticketvalue"=%s,"startchip"=%s,"serialno"=COALESCE("serialno",%s),"tableid"=NULL,"seatno"=NULL WHERE "id"=%s""",
				[sessionrow.get("buyin") or 0,sessionrow.get("buyinfee") or 0,"ticket" if sessionrow.get("ticketenabled") else "cash",sessionrow.get("ticketvalue") or 0,sessionrow.get("chip") or 0,_nextserialno(sessionid),existing["id"]],
				SETTING["dbsetting"]
			)
			return Response({"success": True,"data": {"id": existing["id"]}},status.HTTP_200_OK)

		newid=queryinsert(SETTING["dbname"],"sessionplayer",{
			"sessionid": sessionid,
			"userid": playerrow["id"],
			"status": "confirmed",
			"buyin": sessionrow.get("buyin") or 0,
			"fee": sessionrow.get("buyinfee") or 0,
			"paymenttype": "ticket" if sessionrow.get("ticketenabled") else "cash",
			"ticketvalue": sessionrow.get("ticketvalue") or 0,
			"startchip": sessionrow.get("chip") or 0,
			"serialno": _nextserialno(sessionid),
			"registertime": nowtime(),
			"confirmtime": nowtime()
		},SETTING["dbsetting"])

		return Response({"success": True,"data": {"id": newid}},status.HTTP_200_OK)

	@api_view(["POST"])
	def unregistersession(request,sessionid):
		# 玩家自己取消報名
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],
			f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s AND "deletetime" IS NULL""",
			[sessionid,user["id"]],
			SETTING["dbsetting"]
		)
		if not row:
			return errorresponse("ERROR_registration_not_found")
		row=row[0]

		if row["status"]=="cancelled":
			return errorresponse("ERROR_registration_not_found")

		query(SETTING["dbname"],
			f"""UPDATE "sessionplayer" SET "status"='cancelled',"canceltime"=NOW(),"updatetime"=NOW() WHERE "id"=%s""",
			[row["id"]],
			SETTING["dbsetting"]
		)

		return Response({
			"success": True,
			"data": ""
		},status.HTTP_200_OK)

	@api_view(["GET"])
	def getmyregistrations(request):
		# 玩家看自己的報名清單 (含場次資訊)
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		rows=query(SETTING["dbname"],
			f"""SELECT sp.*,
			       s."name" AS sessionname, s."starttime" AS sessionstart, s."endtime" AS sessionend,
			       s."gametype" AS sessiongametype, s."buyin" AS sessionbuyin, s."buyinfee" AS sessionbuyinfee,
			       s."clubid" AS sessionclubid,
			       u."name" AS ownername, u."playerid" AS ownerplayerid
			    FROM "sessionplayer" sp
			    JOIN "session" s ON s."id"=sp."sessionid" AND s."deletetime" IS NULL
			    JOIN "user" u ON u."id"=s."userid"
			    WHERE sp."userid"=%s AND sp."deletetime" IS NULL
			    ORDER BY s."starttime" DESC""",
			[user["id"]],
			SETTING["dbsetting"]
		)

		return Response({
			"success": True,
			"data": rows or []
		},status.HTTP_200_OK)

	@api_view(["GET"])
	def getsessionregistrationlist(request,sessionid):
		# 主辦人看某場次的所有報名 (含玩家資訊)
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		# 必須是場次擁有人或管理員
		if sessionrow["userid"]!=user["id"] and 4>int(user["permission"]):
			return errorresponse("ERROR_no_permission")

		rows=query(SETTING["dbname"],
			f"""SELECT sp.*,
			       u."name" AS playername, u."playerid" AS playerplayerid, u."email" AS playeremail,
			       tp."place" AS timerplace, tp."status" AS timerstatus,
			       targetsession."name" AS advancetargetname, targetsession."token" AS advancetargettoken,
			       COALESCE(adv."advancecount",0) AS advancecount, COALESCE(adv."bestadvancechip",0) AS bestadvancechip
			    FROM "sessionplayer" sp
			    JOIN "user" u ON u."id"=sp."userid"
			    LEFT JOIN "sessiontimerplayer" tp ON tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."deletetime" IS NULL
			    LEFT JOIN "session" targetsession ON targetsession."id"=sp."advancetargetid"
			    LEFT JOIN (
			       SELECT sourceplayer."userid",COUNT(*) AS advancecount,MAX(sourceplayer."advancechip") AS bestadvancechip
			       FROM "sessionrelation" sr
			       JOIN "sessionplayer" sourceplayer ON sourceplayer."sessionid"=sr."sourceid" AND sourceplayer."deletetime" IS NULL
			       WHERE sr."targetid"=%s AND sr."relationtype"='multiday' AND sr."deletetime" IS NULL
			         AND sourceplayer."advancetargetid"=%s AND sourceplayer."advancetime" IS NOT NULL
			       GROUP BY sourceplayer."userid"
			    ) adv ON adv."userid"=sp."userid"
			    WHERE sp."sessionid"=%s AND sp."deletetime" IS NULL
			    ORDER BY sp."serialno" ASC, sp."registertime" ASC, sp."id" ASC""",
			[sessionid,sessionid,sessionid],
			SETTING["dbsetting"]
		)
		rows=_attachfinance(sessionrow,rows or [])
		tablerows=query(SETTING["dbname"],f"""SELECT "id","name","token" FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "name" ASC""",[sessionid],SETTING["dbsetting"])
		advancetargets=_multidaytargets(sessionid)

		# 順便統計各狀態人數
		stats={
			"registered": 0,
			"confirmed": 0,
			"advanced": 0,
			"cancelled": 0
		}
		for r in rows or []:
			if r["status"] in stats:
				stats[r["status"]]=stats[r["status"]]+1

		return Response({
			"success": True,
			"data": {
				"sessionid": sessionid,
				"sessionname": sessionrow["name"],
				"linkuser": sessionrow.get("linkuser") or False,
				"startchip": sessionrow.get("chip") or 0,
				"maxseat": sessionrow.get("maxseat") or 9,
				"advancetargets": advancetargets,
				"tables": tablerows or [],
				"stats": stats,
				"registrations": rows
			}
		},status.HTTP_200_OK)

	# @api_view(["GET"])
	# def getsessionregistrationlist(request,sessionid):
	# 	return getsessionregistrations(request,sessionid)

	@api_view(["PUT"])
	def advancesessionplayer(request,sessionplayerid):
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionplayerid],SETTING["dbsetting"])
		if not row:
			return errorresponse("ERROR_registration_not_found")
		row=row[0]

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		if sessionrow["userid"]!=user["id"] and 4>int(user["permission"]):
			return errorresponse("ERROR_no_permission")
		if row["status"]!="confirmed" and row["status"]!="advanced":
			return errorresponse("ERROR_registration_not_found")

		requestdata=validate(json.loads(request.body or "{}"),{
			"advancechip": "integer"
		},{
			"integer": "ERROR_request_data_type_error"
		})
		if requestdata["error"] is not None:
			return errorresponse(requestdata["error"])

		targets=_multidaytargets(sessionrow["id"])
		if not targets:
			return errorresponse("ERROR_session_relation_not_found")

		advancechip=_num(requestdata["data"].get("advancechip"),0)
		if advancechip<=0:
			advancechip=_num(row.get("startchip"),0)
		if advancechip<=0:
			return errorresponse("ERROR_request_data_type_error")

		queryupdate(SETTING["dbname"],"sessionplayer",{
			"status": "advanced",
			"advancechip": advancechip,
			"advancetargetid": targets[0]["id"],
			"advancetime": nowtime(),
			"updatetime": nowtime()
		},{"id": sessionplayerid},SETTING["dbsetting"])

		target,summary=_upsertadvancetarget(row,sessionrow,targets,advancechip)

		return Response({
			"success": True,
			"data": {
				"target": {
					"id": target["id"],
					"name": target["name"],
					"token": target["token"]
				},
				"advancechip": advancechip,
				"advancecount": summary["advancecount"],
				"bestchip": summary["bestchip"],
				"targetplayerid": summary["targetplayerid"]
			}
		},status.HTTP_200_OK)

	@api_view(["PUT"])
	def confirmsessionplayer(request,sessionplayerid):
		# 主辦人確認某玩家的報名 (例如報到 / check-in)
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionplayerid],SETTING["dbsetting"])
		if not row:
			return errorresponse("ERROR_registration_not_found")
		row=row[0]

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s""",[row["sessionid"]],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		if sessionrow["userid"]!=user["id"] and 4>int(user["permission"]):
			return errorresponse("ERROR_no_permission")

		query(SETTING["dbname"],
			f"""UPDATE "sessionplayer" SET "status"='confirmed',"confirmtime"=NOW(),"updatetime"=NOW() WHERE "id"=%s""",
			[sessionplayerid],
			SETTING["dbsetting"]
		)

		return Response({
			"success": True,
			"data": ""
		},status.HTTP_200_OK)

	@api_view(["PUT"])
	def cancelsessionplayer(request,sessionplayerid):
		# 主辦人取消某報名 (例如玩家沒到)
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionplayerid],SETTING["dbsetting"])
		if not row:
			return errorresponse("ERROR_registration_not_found")
		row=row[0]

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s""",[row["sessionid"]],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		if sessionrow["userid"]!=user["id"] and 4>int(user["permission"]):
			return errorresponse("ERROR_no_permission")

		query(SETTING["dbname"],
			f"""UPDATE "sessionplayer" SET "status"='cancelled',"canceltime"=NOW(),"tableid"=NULL,"seatno"=NULL,"updatetime"=NOW() WHERE "id"=%s""",
			[sessionplayerid],
			SETTING["dbsetting"]
		)
		query(SETTING["dbname"],
			f"""UPDATE "sessiontimerplayer" SET "status"='active',"eliminatedtime"=NULL,"place"=NULL,"deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionplayerid"=%s""",
			[sessionplayerid],
			SETTING["dbsetting"]
		)

		return Response({
			"success": True,
			"data": ""
		},status.HTTP_200_OK)

	@api_view(["PUT"])
	def editsessionplayerfinance(request,sessionplayerid):
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionplayerid],SETTING["dbsetting"])
		if not row:
			return errorresponse("ERROR_registration_not_found")
		row=row[0]

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		if sessionrow["userid"]!=user["id"] and 4>int(user["permission"]):
			return errorresponse("ERROR_no_permission")

		requestdata=validate(json.loads(request.body),{
			"buyin": "integer",
			"fee": "integer",
			"rebuycount": "integer",
			"reentrycount": "integer",
			"addoncount": "integer",
			"prize": "integer",
			"prizeoverride": "integer",
			"ticketvalue": "integer",
			"paymenttype": "string",
			"place": "string"
		},{
			"integer": "ERROR_request_data_type_error",
			"string": "ERROR_request_data_type_error"
		})

		if requestdata["error"] is not None:
			return errorresponse(requestdata["error"])

		data=requestdata["data"]
		paymenttype=data.get("paymenttype") or row.get("paymenttype") or "cash"
		if paymenttype!="ticket":
			paymenttype="cash"

		newrebuycount=data.get("rebuycount") if data.get("rebuycount") is not None else row.get("rebuycount") or 0
		warnings=[]
		if _int(newrebuycount,0)>_int(sessionrow.get("rebuycount"),0):
			warnings.append("WARNING_rebuycount_exceeded")

		query(SETTING["dbname"],
			f"""UPDATE "sessionplayer" SET "buyin"=%s,"fee"=%s,"rebuycount"=%s,"reentrycount"=%s,"addoncount"=%s,"prize"=%s,"prizeoverride"=%s,"ticketvalue"=%s,"paymenttype"=%s,"place"=%s,"updatetime"=NOW() WHERE "id"=%s""",
			[data.get("buyin") if data.get("buyin") is not None else row.get("buyin") or 0,data.get("fee") if data.get("fee") is not None else row.get("fee") or 0,newrebuycount,data.get("reentrycount") if data.get("reentrycount") is not None else row.get("reentrycount") or 0,data.get("addoncount") if data.get("addoncount") is not None else row.get("addoncount") or 0,data.get("prize") if data.get("prize") is not None else row.get("prize") or 0,data.get("prizeoverride") if data.get("prizeoverride") is not None else row.get("prizeoverride"),data.get("ticketvalue") if data.get("ticketvalue") is not None else row.get("ticketvalue") or 0,paymenttype,data.get("place") if data.get("place") is not None else row.get("place") or "",sessionplayerid],
			SETTING["dbsetting"]
		)

		return Response({
			"success": True,
			"data": {
				"warnings": warnings
			}
		},status.HTTP_200_OK)

	@api_view(["PUT"])
	def editsessionplayerseat(request,sessionplayerid):
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionplayerid],SETTING["dbsetting"])
		if not row:
			return errorresponse("ERROR_registration_not_found")
		row=row[0]

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		if not _requireowner(sessionrow,user):
			return errorresponse("ERROR_no_permission")

		requestdata=validate(json.loads(request.body),{
			"tableid": "integer",
			"seatno": "integer",
			"startchip": "integer",
			"prizeoverride": "integer",
			"paymenttype": "string",
			"ticketvalue": "integer"
		},{
			"integer": "ERROR_request_data_type_error",
			"string": "ERROR_request_data_type_error"
		})

		if requestdata["error"] is not None:
			return errorresponse(requestdata["error"])

		data=requestdata["data"]
		tableid=data.get("tableid") or None
		seatno=data.get("seatno") or None
		if tableid:
			tablerow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "id"=%s AND "sessionid"=%s AND "deletetime" IS NULL""",[tableid,row["sessionid"]],SETTING["dbsetting"])
			if not tablerow:
				return errorresponse("ERROR_table_not_found")
		if tableid and seatno:
			if _int(sessionrow.get("maxseat"),9)<_int(seatno,0):
				return errorresponse("ERROR_request_data_type_error")
			dupe=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "tableid"=%s AND "seatno"=%s AND "id"<>%s AND "status"='confirmed' AND "deletetime" IS NULL""",[row["sessionid"],tableid,seatno,sessionplayerid],SETTING["dbsetting"])
			if dupe:
				return errorresponse("ERROR_already_registered")

		paymenttype=data.get("paymenttype") or row.get("paymenttype") or "cash"
		if paymenttype!="ticket":
			paymenttype="cash"
		prizeoverride=row.get("prizeoverride")
		if data.get("prizeoverride") is not None:
			prizeoverride=data.get("prizeoverride")
		ticketvalue=row.get("ticketvalue") or 0
		if data.get("ticketvalue") is not None:
			ticketvalue=data.get("ticketvalue")

		query(SETTING["dbname"],
			f"""UPDATE "sessionplayer" SET "tableid"=%s,"seatno"=%s,"startchip"=%s,"prizeoverride"=%s,"paymenttype"=%s,"ticketvalue"=%s,"updatetime"=NOW() WHERE "id"=%s""",
			[tableid,seatno,data.get("startchip") or row.get("startchip") or sessionrow.get("chip") or 0,prizeoverride,paymenttype,ticketvalue,sessionplayerid],
			SETTING["dbsetting"]
		)
		if data.get("startchip") is not None:
			query(SETTING["dbname"],f"""UPDATE "sessiontimerconfig" SET "startingchips"=%s,"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[data.get("startchip"),sessionrow["id"]],SETTING["dbsetting"])

		return Response({
			"success": True,
			"data": ""
		},status.HTTP_200_OK)

	@api_view(["PUT"])
	def randomizesessionplayerseats(request,sessionid):
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		if not _requireowner(sessionrow,user):
			return errorresponse("ERROR_no_permission")

		requestdata=validate(json.loads(request.body),{
			"tableid": "integer",
			"tableids": "array",
			"tableids.*": "integer",
			"startchip": "integer",
			"mode": "string",
			"playerids": "array",
			"playerids.*": "integer"
		},{
			"required": "ERROR_request_data_not_found",
			"integer": "ERROR_request_data_type_error",
			"string": "ERROR_request_data_type_error",
			"array": "ERROR_request_data_type_error"
		})

		if requestdata["error"] is not None:
			return errorresponse(requestdata["error"])

		mode=requestdata["data"].get("mode") or "unseated"
		playerids=requestdata["data"].get("playerids") or []
		maxseat=_int(sessionrow.get("maxseat"),9)
		if maxseat<=0:
			maxseat=9
		startchip=requestdata["data"].get("startchip") or sessionrow.get("chip") or 0
		if mode!="selected" and mode!="balanced":
			mode="unseated"
		if mode=="selected" and len(playerids)==0:
			return errorresponse("ERROR_request_data_not_found")
		if mode=="selected":
			rows=[]
			for i in range(len(playerids)):
				itemrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "id"=%s AND "sessionid"=%s AND "status"='confirmed' AND "deletetime" IS NULL""",[playerids[i],sessionid],SETTING["dbsetting"])
				if itemrow:
					rows.append(itemrow[0])
		else:
			rows=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "status"='confirmed' AND ("tableid" IS NULL OR "seatno" IS NULL) AND "deletetime" IS NULL ORDER BY "confirmtime" ASC,"registertime" ASC,"id" ASC""",[sessionid],SETTING["dbsetting"])
		if not rows:
			return Response({
				"success": True,
				"data": ""
			},status.HTTP_200_OK)
		if mode=="balanced":
			tableids=requestdata["data"].get("tableids") or []
			if len(tableids)==0:
				tablerows=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "name" ASC""",[sessionid],SETTING["dbsetting"])
			else:
				tablerows=[]
				for i in range(len(tableids)):
					itemrow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "id"=%s AND "sessionid"=%s AND "deletetime" IS NULL""",[tableids[i],sessionid],SETTING["dbsetting"])
					if itemrow:
						tablerows.append(itemrow[0])
			if len(tablerows)==0:
				return errorresponse("ERROR_table_not_found")
			tabledata=[]
			for i in range(len(tablerows)):
				table=tablerows[i]
				usedrow=query(SETTING["dbname"],f"""SELECT "seatno" FROM "sessionplayer" WHERE "sessionid"=%s AND "tableid"=%s AND "seatno" IS NOT NULL AND "status"='confirmed' AND "deletetime" IS NULL""",[sessionid,table["id"]],SETTING["dbsetting"])
				used=[]
				for j in range(len(usedrow or [])):
					used.append(usedrow[j]["seatno"])
				seats=[]
				for seatno in range(1,maxseat+1):
					if seatno not in used:
						seats.append(seatno)
				random.shuffle(seats)
				tabledata.append({
					"table": table,
					"count": len(used),
					"seats": seats
				})
			random.shuffle(rows)
			for i in range(len(rows or [])):
				best=None
				for j in range(len(tabledata)):
					if len(tabledata[j]["seats"])==0:
						continue
					if best is None or tabledata[j]["count"]<tabledata[best]["count"]:
						best=j
				if best is None:
					break
				seatno=tabledata[best]["seats"].pop(0)
				tabledata[best]["count"]=tabledata[best]["count"]+1
				query(SETTING["dbname"],f"""UPDATE "sessionplayer" SET "tableid"=%s,"seatno"=%s,"startchip"=%s,"updatetime"=NOW() WHERE "id"=%s""",[tabledata[best]["table"]["id"],seatno,startchip,rows[i]["id"]],SETTING["dbsetting"])
			query(SETTING["dbname"],f"""UPDATE "sessiontimerconfig" SET "startingchips"=%s,"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[startchip,sessionrow["id"]],SETTING["dbsetting"])
			return Response({"success": True,"data": ""},status.HTTP_200_OK)

		tableid=requestdata["data"].get("tableid")
		if not tableid:
			return errorresponse("ERROR_table_not_found")
		tablerow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "id"=%s AND "sessionid"=%s AND "deletetime" IS NULL""",[tableid,sessionid],SETTING["dbsetting"])
		if not tablerow:
			return errorresponse("ERROR_table_not_found")
		tablerow=tablerow[0]
		seats=[]
		for i in range(1,maxseat+1):
			seats.append(i)
		usedrow=query(SETTING["dbname"],f"""SELECT "seatno" FROM "sessionplayer" WHERE "sessionid"=%s AND "tableid"=%s AND "seatno" IS NOT NULL AND "status"='confirmed' AND "deletetime" IS NULL""",[sessionid,tableid],SETTING["dbsetting"])
		for i in range(len(usedrow or [])):
			for j in range(len(rows or [])):
				if usedrow[i]["seatno"]==rows[j].get("seatno") and rows[j].get("tableid")==tableid:
					usedrow[i]["seatno"]=None
			if usedrow[i]["seatno"] in seats:
				seats.remove(usedrow[i]["seatno"])
		if mode=="selected" and len(seats)<len(rows):
			return errorresponse("ERROR_request_data_type_error")
		random.shuffle(seats)
		for i in range(len(rows or [])):
			if len(seats)<=i:
				continue
			seatno=seats[i]
			query(SETTING["dbname"],f"""UPDATE "sessionplayer" SET "tableid"=%s,"seatno"=%s,"startchip"=%s,"updatetime"=NOW() WHERE "id"=%s""",[tableid,seatno,startchip,rows[i]["id"]],SETTING["dbsetting"])
		query(SETTING["dbname"],f"""UPDATE "sessiontimerconfig" SET "startingchips"=%s,"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[startchip,sessionrow["id"]],SETTING["dbsetting"])

		return Response({
			"success": True,
			"data": ""
		},status.HTTP_200_OK)

	@api_view(["GET"])
	def getmyregistrationstatus(request,sessionid):
		# 查當前使用者對某場次的報名狀態 (給前端決定顯示「報名」or「取消報名」)
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],
			f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s AND "deletetime" IS NULL""",
			[sessionid,user["id"]],
			SETTING["dbsetting"]
		)

		status_val=None
		if row:
			status_val=row[0]["status"]

		return Response({
			"success": True,
			"data": {
				"status": status_val
			}
		},status.HTTP_200_OK)
except Exception as error:
	printcolorhaveline("fail","[ERROR] "+str(error),"")
