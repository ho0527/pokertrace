# batch.py
#
# 批量建立多日賽：一次建好多個 flight 場次 + multiday 晉級關聯 + (選用) 包成系列賽。
# 設計：後端只吃一份「明確的 spec」(common + flights[] + advancement[])，不綁任何賽制；
# 前端的「範本」或「自訂每層」都先在前端攤平成這份 spec，後端純粹照建，保持通用。

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
from .timer import savesplitstate
from .series import _setseriessessions,_appendseriessessions
from .session import _savesessionchips
from .follow import notifyfollowernewsession

MAXFLIGHTS=64

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

def _orempty(value):
	return value if value is not None else ""

def _cleanschedule(rawlist):
	"""把前端送來的 schedule 洗成乾淨的 level/break 陣列 (與 structureparse 的格式一致)。"""
	output=[]
	if not isinstance(rawlist,list):
		return output
	for raw in rawlist:
		if not isinstance(raw,dict):
			continue
		itemtype=raw.get("type") or "level"
		if itemtype not in ("level","break"):
			itemtype="level"
		item={"type": itemtype,"dur": _int(raw.get("dur"),0) or 10}
		if itemtype=="level":
			item["sb"]=_int(raw.get("sb"),0)
			item["bb"]=_int(raw.get("bb"),0)
			item["ante"]=_int(raw.get("ante"),0)
			if item["bb"]<=0 and item["sb"]>0:
				item["bb"]=item["sb"]*2
			if item["sb"]<=0 and item["bb"]<=0 and item["ante"]<=0:
				continue
			if _bool(raw.get("regCloseAfter")):
				item["regCloseAfter"]=True
			chipraise=raw.get("chipRaiseValues")
			if isinstance(chipraise,list) and chipraise:
				item["chipRaiseValues"]=chipraise
		else:
			chipraise=raw.get("chipRaiseValues")
			if isinstance(chipraise,list) and chipraise:
				item["chipRaiseValues"]=chipraise
		output.append(item)
	return output

def _createflight(userrow,common,flight):
	"""建立單一 flight 場次 (主辦多日賽), 並寫入賽程。回傳新場次 id。
	買入結構 (重買/重入/加買) 取自 common; 開始/結束時間與備註可由 flight 覆寫 common。"""
	name=flight["name"]
	schedule=flight.get("schedule") or []
	chip=_int(common.get("chip"),3000)
	# token: TO + 年份 + 6 碼序號。序號取同前綴既有 token 數字部分最大值 +1（含軟刪列），
	# 不用列數避免重號；同批多 flight 因每次 INSERT 都已提交，下一次 MAX 會看到前一筆，序號自然遞增不重號
	tokenprefix=f"TO{nowtime().split(' ')[0].split('-')[0]}"
	tokenrow=query(SETTING["dbname"],"""SELECT COALESCE(MAX(CAST(SUBSTR("token",%s) AS integer)),0)+1 AS nextno FROM "session" WHERE "gametype"='tournament' AND "token" LIKE %s AND SUBSTR("token",%s)~'^[0-9]+$'""",[len(tokenprefix)+1,tokenprefix+"%",len(tokenprefix)+1],SETTING["dbsetting"])
	nextno=1
	if tokenrow:
		nextno=_int(tokenrow[0].get("nextno"),1)
	token=tokenprefix+str(nextno).zfill(6)
	sessionid=queryinsert(SETTING["dbname"],"session",{
		"token": token,
		"userid": userrow["id"],
		"gametype": "tournament",
		"name": name,
		"clubid": common.get("clubid"),
		"buyin": _int(common.get("buyin"),0),
		"buyinfee": _int(common.get("buyinfee"),0),
		"chip": chip,
		"rebuycount": _int(common.get("rebuycount"),0),
		"rebuybuyin": _int(common.get("rebuybuyin"),0),
		"rebuyfee": _int(common.get("rebuyfee"),0),
		"rebuychip": _int(common.get("rebuychip"),0),
		"reentrycount": _int(common.get("reentrycount"),0),
		"reentrybuyin": _int(common.get("reentrybuyin"),0),
		"reentryfee": _int(common.get("reentryfee"),0),
		"reentrychip": _int(common.get("reentrychip"),0),
		"addoncount": _int(common.get("addoncount"),0),
		"addonbuyin": _int(common.get("addonbuyin"),0),
		"addonfee": _int(common.get("addonfee"),0),
		"addonchip": _int(common.get("addonchip"),0),
		"linkuser": True,
		"guaranteedprize": _int(common.get("guaranteedprize"),0),
		"private": _bool(common.get("private")),
		"winprice": 0,"winthing": "N/A","inmoney": False,"inft": False,
		"starttime": flight.get("starttime") or common.get("starttime"),
		"endtime": flight.get("endtime") or common.get("endtime"),
		"description": _orempty(flight.get("description") if flight.get("description") is not None else common.get("description")),
		"place": "0","totalbuyin": "0",
		"gametypeid": _int(common.get("gametypeid"),1),
		"limittypeid": _int(common.get("limittypeid"),1),
		"stacktypeid": _int(common.get("stacktypeid"),1),
		"eventtypeid": _int(common.get("eventtypeid"),1),
		"owned": True,
		"openregistration": _bool(common.get("openregistration")),
		"maxseat": _int(common.get("maxseat"),9),
		"antemode": "bigblindante",
		"unifiedhandrecord": False
	},SETTING["dbsetting"])
	if not sessionid:
		return None
	# 寫入賽程 (沿用 timer 的 savesplitstate, 確保 sessiontimerconfig/level 與正常存檔一致)
	sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s""",[sessionid],SETTING["dbsetting"])
	if sessionrow and schedule:
		savesplitstate(sessionrow[0],{
			"tournName": name,
			"startingChips": chip,
			"defaultBreakDur": 10,
			"schedule": schedule
		})
	chips=common.get("chips")
	if isinstance(chips,list) and chips:
		_savesessionchips(sessionid,chips)
	return sessionid

def _createseries(userrow,common,name,scoringtype,flightids):
	existing=query(SETTING["dbname"],f"""SELECT COUNT(*) AS count FROM "series" WHERE 1=1""",[],SETTING["dbsetting"])
	seq=_int(existing[0].get("count"),0)+1 if existing else 1
	seriesid=queryinsert(SETTING["dbname"],"series",{
		"token": f"SE{nowtime().split(' ')[0].split('-')[0]}{str(seq).zfill(6)}",
		"userid": userrow["id"],
		"clubid": common.get("clubid"),
		"name": name,
		"scoringtype": scoringtype if scoringtype in ("profit","place","points") else "profit",
		"private": _bool(common.get("private"))
	},SETTING["dbsetting"])
	if seriesid and flightids:
		_setseriessessions(seriesid,flightids,userrow["id"])
	return seriesid

@api_view(["POST"])
def batchcreatesessions(request):
	userrow,errresp=_gettokenuser(request)
	if errresp:
		return errresp
	try:
		data=json.loads(request.body)
	except Exception as error:
		return errorresponse("ERROR_request_data_not_found")

	common=data.get("common") or {}
	flights=data.get("flights") or []
	advancement=data.get("advancement") or []
	attachseriesid=data.get("seriesid")

	# --- 基本驗證 (建任何東西前先擋掉) ---
	if not isinstance(flights,list) or len(flights)<=0:
		return errorresponse("ERROR_request_data_not_found")
	if len(flights)>MAXFLIGHTS:
		return errorresponse("ERROR_request_data_type_error")
	if not common.get("clubid"):
		return errorresponse("ERROR_request_data_not_found")
	if not common.get("starttime") or not common.get("endtime"):
		return errorresponse("ERROR_request_data_not_found")
	# club 必須屬於本人 (或管理員)
	clubrow=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[common.get("clubid")],SETTING["dbsetting"])
	if not clubrow:
		return errorresponse("ERROR_request_data_not_found")
	if clubrow[0]["userid"]!=userrow["id"] and 4>int(userrow["permission"]):
		return errorresponse("ERROR_no_permission")
	# 若指定要附加到既有系列賽, 先確認系列賽存在且屬於本人
	seriesrow=None
	if attachseriesid:
		seriesrow=query(SETTING["dbname"],f"""SELECT*FROM "series" WHERE "id"=%s AND "deletetime" IS NULL""",[attachseriesid],SETTING["dbsetting"])
		if not seriesrow:
			return errorresponse("ERROR_series_not_found")
		if seriesrow[0]["userid"]!=userrow["id"] and 4>int(userrow["permission"]):
			return errorresponse("ERROR_no_permission")

	keys={}
	cleanflights=[]
	for i in range(len(flights)):
		f=flights[i]
		if not isinstance(f,dict):
			return errorresponse("ERROR_request_data_type_error")
		key=str(f.get("key") or "").strip()
		name=str(f.get("name") or "").strip()
		if not key or not name:
			return errorresponse("ERROR_request_data_not_found")
		if key in keys:
			return errorresponse("ERROR_request_data_type_error")
		keys[key]=True
		cleanflights.append({
			"key": key,
			"name": name[:100],
			"schedule": _cleanschedule(f.get("schedule")),
			"starttime": f.get("starttime"),
			"endtime": f.get("endtime")
		})
	# 晉級邊的 from/to 都必須對得到 flight key
	for i in range(len(advancement)):
		edge=advancement[i]
		if not isinstance(edge,dict):
			return errorresponse("ERROR_request_data_type_error")
		target=str(edge.get("to") or "").strip()
		sources=edge.get("from") or []
		if not target or target not in keys or not isinstance(sources,list):
			return errorresponse("ERROR_request_data_type_error")
		for s in sources:
			if str(s).strip() not in keys:
				return errorresponse("ERROR_request_data_type_error")

	# --- 開始建立 ---
	# 單一 flight 的賽程寫入沿用共用的 savesplitstate 流程，無法把整批寫入包成單一交易；
	# 改採補償式：任一 flight 建立失敗即停止，把本批已建立的場次全部軟刪除後回報錯誤，避免殘留半套多日賽
	idbykey={}
	createdidlist=[]
	createfailed=False
	for f in cleanflights:
		sid=None
		try:
			sid=_createflight(userrow,common,f)
		except Exception as error:
			printcolorhaveline("fail","[ERROR] batchcreatesessions createflight "+str(error),"")
		if not sid:
			createfailed=True
			break
		idbykey[f["key"]]=sid
		createdidlist.append(sid)

	# 晉級關聯集中成單一 querytransaction，避免建到一半殘留部分關聯；
	# 本批場次都是全新 id，不會有既有 multiday 關聯列，直接 INSERT 即可（同對來源/目標在 Python 端去重）
	linkfailed=False
	linkcount=0
	if createfailed==False:
		linksqllist=[]
		linkedpairlist=[]
		for edge in advancement:
			target=str(edge.get("to")).strip()
			for s in (edge.get("from") or []):
				sourceid=idbykey[str(s).strip()]
				targetid=idbykey[target]
				if str(sourceid)==str(targetid):
					continue
				pair=str(sourceid)+"-"+str(targetid)
				if pair in linkedpairlist:
					continue
				linkedpairlist.append(pair)
				linksqllist.append(["""INSERT INTO "sessionrelation"("sourceid","targetid","relationtype")VALUES(%s,%s,'multiday')""",[sourceid,targetid]])
		if linksqllist:
			linkresult=querytransaction(SETTING["dbname"],linksqllist,SETTING["dbsetting"])
			if linkresult is None:
				linkfailed=True
			else:
				linkcount=len(linksqllist)

	if createfailed or linkfailed:
		# 補償：把本批已建立的場次連同 _createflight 寫出的關聯列一起軟刪除（關聯交易失敗時已整批回滾，不會殘留）；
		# sessiontimerconfig/sessiontimerlevel/sessiontimerpayout/sessionchip/sessiontimer 都有 deletetime 欄，
		# 一律軟刪不硬刪，寫法比照 session.py deletesession 的連動軟刪；每個場次各自一個 querytransaction，
		# 任一場次補償失敗仍繼續補償其餘場次，避免第一個失敗就整批殘留
		for sid in createdidlist:
			cleanresult=querytransaction(SETTING["dbname"],[
				["""UPDATE "session" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "id"=%s""",[sid]],
				["""UPDATE "sessiontimerconfig" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sid]],
				["""UPDATE "sessiontimerlevel" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sid]],
				["""UPDATE "sessiontimerpayout" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sid]],
				["""UPDATE "sessionchip" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sid]],
				["""UPDATE "sessiontimer" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sid]]
			],SETTING["dbsetting"])
			if cleanresult is None:
				printcolorhaveline("fail","[ERROR] batchcreatesessions compensate session "+str(sid),"")
		return errorresponse("ERROR_database_error")

	seriesid=None
	if attachseriesid:
		# 附加到既有系列賽 (一個系列賽可含多個多日賽事)
		_appendseriessessions(attachseriesid,list(idbykey.values()),userrow["id"])
		seriesid=attachseriesid
	elif _bool(data.get("createseries")):
		seriesname=str(data.get("seriesname") or "").strip() or cleanflights[0]["name"]
		seriesid=_createseries(userrow,common,seriesname[:100],data.get("seriesscoringtype") or "profit",list(idbykey.values()))

	# 通知追隨這位主辦者的人。掛在這裡而**不是** _createflight 裡面：
	#   * 一個多日賽一次可以建到 MAXFLIGHTS 場, 掛在裡面等於一次推 N 則
	#   * 上面的補償路徑失敗時會把整批軟刪, 掛在裡面會出現「通知已發、場次已刪」
	# 只用第一場的 id 發一則, 名稱後面補上這一則涵蓋幾場。
	createdsessionidlist=list(idbykey.values())
	if createdsessionidlist:
		firstsessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s""",[createdsessionidlist[0]],SETTING["dbsetting"])
		if firstsessionrow:
			namesuffix=""
			if 1<len(createdsessionidlist):
				namesuffix="（共 "+str(len(createdsessionidlist))+" 個 Day）"
			notifyfollowernewsession(firstsessionrow[0],namesuffix)

	return Response({"success": True,"data": {
		"flights": idbykey,
		"flightcount": len(idbykey),
		"linkcount": linkcount,
		"seriesid": seriesid
	}},status.HTTP_200_OK)
