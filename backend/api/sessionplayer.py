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
from .authhelper import gettokenuser as commonauthuser
from .timer import synctimerplayers,linkedcounts,buildtimerstate,broadcasttimerupdate,latestsessionchips,intval,expectedchiptotal
from .notification import notifyevent


def _gettokenuser(request):
	return commonauthuser(request)

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

def _sessionstaffed(sessionrow,user):
	sessionstaffrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionstaff" WHERE "sessionid"=%s AND "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL""",[sessionrow["id"],user["id"]],SETTING["dbsetting"])
	if sessionstaffrow:
		return True
	userstaffrow=query(SETTING["dbname"],f"""SELECT*FROM "userstaff" WHERE "userid"=%s AND "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL""",[sessionrow["userid"],user["id"]],SETTING["dbsetting"])
	if userstaffrow:
		return True
	return False

def _caneditsession(sessionrow,user):
	# 編輯類操作 (報名/確認/取消/晉級/財務/座位): 擁有者、管理員或該場次聘用人員 (sessionstaff/userstaff) 皆可操作。
	# 刪除/複製類操作不適用本函式, 仍限擁有者/管理員 (_requireowner)。
	if _requireowner(sessionrow,user):
		return True
	return _sessionstaffed(sessionrow,user)

def _sessionended(sessionrow):
	if not _bool(sessionrow.get("linkuser")):
		return False
	state=buildtimerstate(sessionrow["id"])
	if not state:
		return False
	players=state.get("linkedPlayers") or []
	if players:
		ended=True
		for i in range(len(players)):
			if players[i].get("registrationstatus")!="advanced" and _int(players[i].get("place"),0)<=0:
				ended=False
		if ended:
			return True
	if not _bool(state.get("regClosed")):
		return False
	synctimerplayers(sessionrow)
	counts=linkedcounts(sessionrow["id"])
	if _int(counts[1],0)<=0:
		return False
	if _int(counts[0],0)<=1:
		return True
	return False

def _sessionregistrationclosed(sessionrow):
	if not _bool(sessionrow.get("linkuser")):
		return True
	state=buildtimerstate(sessionrow["id"])
	if state and _bool(state.get("regClosed")):
		return True
	return False

def _deleteregistration(sessionrow,sessionplayerid):
	# 取消報名採全站慣例的軟刪 (deletetime); 重新報名時由 _reviveregistration 復活同一列 (sessionplayer 有 (sessionid,userid) 唯一鍵, 不能新增第二列)。
	query(SETTING["dbname"],f"""UPDATE "sessiontimerplayer" SET "deletetime"=NOW(),"updatetime"=NOW() WHERE "sessionplayerid"=%s AND "deletetime" IS NULL""",[sessionplayerid],SETTING["dbsetting"])
	# canceltime 是**語意時間欄**（會顯示、可能被拿去排序），一律用 nowtime()（本地牆上時間），
	# 不可以寫 SQL 的 NOW()（真 UTC，差一個時區）。見 AGENTS.md「時間欄」。
	# deletetime / updatetime 只用來判 IS NULL、不顯示也不比較，維持 NOW() 不動。
	query(SETTING["dbname"],f"""UPDATE "sessionplayer" SET "canceltime"=%s,"deletetime"=NOW(),"updatetime"=NOW() WHERE "id"=%s AND "deletetime" IS NULL""",[nowtime(),sessionplayerid],SETTING["dbsetting"])
	_broadcastsessiontimer(sessionrow)

def _reviveregistration(sessionrow,sessionplayerrow,newstatus):
	# 復活先前取消 (軟刪) 的報名列: 重設為全新報名的狀態; 確認報名 (confirmed) 時直接配發新序號。
	serialno=None
	confirmtime=None
	if newstatus=="confirmed":
		serialno=_nextserialno(sessionrow["id"])
		confirmtime=nowtime()
	# **這句原本一句裡用了兩個時鐘**：registertime 走 SQL NOW()（真 UTC）、
	# confirmtime 走 nowtime()（本地），兩者差 8 小時 —— 而排座正是依
	# 「confirmtime → registertime → id」排序，等於拿兩把不同的尺量同一件事。
	# 2026-08-06 實測測試庫：confirmtime 有 28 列本地 / 55 列真 UTC，
	# 4 個場次裡兩種並存，本地那列一律被排到最後（真實時間其實最早）。
	query(SETTING["dbname"],
		f"""UPDATE "sessionplayer" SET "status"=%s,"buyin"=%s,"fee"=%s,"paymenttype"=%s,"ticketvalue"=%s,"startchip"=%s,"serialno"=%s,"tableid"=NULL,"seatno"=NULL,"rebuycount"=0,"reentrycount"=0,"addoncount"=0,"prize"=0,"prizeoverride"=NULL,"place"=NULL,"note"='',"advancechip"=NULL,"advancetargetid"=NULL,"advancesourceid"=NULL,"advancetime"=NULL,"registertime"=%s,"confirmtime"=%s,"canceltime"=NULL,"deletetime"=NULL,"updatetime"=NOW() WHERE "id"=%s""",
		[newstatus,sessionrow.get("buyin") or 0,sessionrow.get("buyinfee") or 0,"ticket" if sessionrow.get("ticketenabled") else "cash",sessionrow.get("ticketvalue") or 0,_sessionplayerstartchip(sessionrow),serialno,nowtime(),confirmtime,sessionplayerrow["id"]],
		SETTING["dbsetting"]
	)
	# 舊的 sessiontimerplayer 列是軟刪的, 但仍留著上次的 eliminated/place; synctimerplayers 復活該列時只清 deletetime, 不會重設狀態,
	# 會讓「淘汰 → 取消報名 → 重新報名」的玩家一進來就顯示為上次的淘汰名次。這裡一併重設成 synctimerplayers 新增新玩家時的初始值。
	# deletetime 不在這裡動: 交給 synctimerplayers 依 sessionplayer 狀態決定 (registered 尚未確認時不該有生效中的計時器列)。
	query(SETTING["dbname"],
		f"""UPDATE "sessiontimerplayer" SET "status"='active',"eliminatedtime"=NULL,"place"=NULL,"updatetime"=NOW() WHERE "sessionid"=%s AND "sessionplayerid"=%s""",
		[sessionrow["id"],sessionplayerrow["id"]],
		SETTING["dbsetting"]
	)
	return sessionplayerrow["id"]

def _eliminatedtimerplayer(sessionid,sessionplayerid):
	row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerplayer" WHERE "sessionid"=%s AND "sessionplayerid"=%s AND "status"='eliminated' AND "deletetime" IS NULL""",[sessionid,sessionplayerid],SETTING["dbsetting"])
	if row:
		return row[0]
	return None

def _featureallowed(sessionrow,prefix):
	# 場次是否有開放某項加購功能 (rebuy / addon)：次數、買入或計分牌任一大於 0 即視為開放
	count=_num(sessionrow.get(prefix+"count"),0)
	buyin=_num(sessionrow.get(prefix+"buyin"),0)
	chip=_num(sessionrow.get(prefix+"chip"),0)
	return 0<count or 0<buyin or 0<chip

def _canreentry(sessionrow,sessionplayerrow):
	if not _eliminatedtimerplayer(sessionrow["id"],sessionplayerrow["id"]):
		return False
	maxreentry=_int(sessionrow.get("reentrycount"),0)
	if maxreentry<=0:
		return False
	if maxreentry<=_int(sessionplayerrow.get("reentrycount"),0):
		return False
	return True

def _sessionplayerstartchip(sessionrow,sessionplayerrow=None):
	if sessionplayerrow:
		startchip=_num(sessionplayerrow.get("startchip"),0)
		if 0<startchip:
			return startchip
		advancechip=_num(sessionplayerrow.get("advancechip"),0)
		if 0<advancechip:
			return advancechip
	return _num(sessionrow.get("chip"),0)

def _reentrychip(sessionrow,sessionplayerrow=None):
	chip=_num(sessionrow.get("reentrychip"),0)
	if chip<=0:
		chip=_sessionplayerstartchip(sessionrow,sessionplayerrow)
	return chip

def _restorereentry(sessionrow,sessionplayerrow):
	# Reentry 是一次新的 entry：配發新的入場編號（累計 +1），不沿用原本的舊號。
	query(SETTING["dbname"],
		# confirmtime 用 nowtime()（本地），與排座排序的另一把尺 registertime 對齊。見 AGENTS.md「時間欄」。
		f"""UPDATE "sessionplayer" SET "status"='confirmed',"serialno"=%s,"confirmtime"=%s,"canceltime"=NULL,"updatetime"=NOW(),"deletetime"=NULL,"reentrycount"=COALESCE("reentrycount",0)+1,"startchip"=%s,"tableid"=NULL,"seatno"=NULL WHERE "id"=%s""",
		[_nextserialno(sessionrow["id"]),nowtime(),_reentrychip(sessionrow,sessionplayerrow),sessionplayerrow["id"]],
		SETTING["dbsetting"]
	)
	query(SETTING["dbname"],
		f"""UPDATE "sessiontimerplayer" SET "status"='active',"eliminatedtime"=NULL,"place"=NULL,"deletetime"=NULL,"updatetime"=NOW() WHERE "sessionid"=%s AND "sessionplayerid"=%s""",
		[sessionrow["id"],sessionplayerrow["id"]],
		SETTING["dbsetting"]
	)
	state=buildtimerstate(sessionrow["id"])
	if state is not None:
		broadcasttimerupdate(sessionrow["id"],state)
	return Response({
		"success": True,
		"data": {
			"id": sessionplayerrow["id"],
			"reentry": True
		}
	},status.HTTP_200_OK)

def _broadcastsessiontimer(sessionrow):
	if not sessionrow or not _bool(sessionrow.get("linkuser")):
		return
	state=buildtimerstate(sessionrow["id"])
	if state is not None:
		broadcasttimerupdate(sessionrow["id"],state)

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

def _rankrange(value,fallback):
	try:
		if value is None or value=="":
			return fallback,fallback
		text=str(value).replace("－","-").replace("–","-").replace("—","-")
		parts=text.split("-")
		if 2<=len(parts):
			start=_ranknumber(parts[0])
			end=_ranknumber(parts[1])
			if start is not None and end is not None:
				if end<start:
					temp=start
					start=end
					end=temp
				return start,end
		rank=_ranknumber(text)
		if rank is not None:
			return rank,rank
	except Exception as error:
		return fallback,fallback
	return fallback,fallback

def _payoutcashtotal(sessionrow,pool):
	payoutrow=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerpayout" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionrow["id"]],SETTING["dbsetting"])
	totalpct=0
	total=0
	for item in payoutrow or []:
		totalpct=totalpct+_num(item.get("pct"),0)
	for item in payoutrow or []:
		# cash 制優先：payoutedit 現金獎金直接是絕對金額，不乘獎池 (對齊前端 payoutCashAmount)
		cash=_num(item.get("cash"),0)
		if 0<cash:
			total=total+round(cash)
		else:
			reward=item.get("reward") or ""
			if reward!="":
				rewardtext=str(reward).replace(",","").replace("$","").strip()
				try:
					total=total+round(float(rewardtext))
				except Exception as error:
					total=total+0
			else:
				pct=_num(item.get("pct"),0)
				if totalpct<=1.5:
					total=total+round(pool*pct)
				else:
					total=total+round(pool*pct/100)
	return total

def _sessiontotalentries(sessionid):
	countrow=query(SETTING["dbname"],f"""SELECT SUM(1+COALESCE("rebuycount",0)+COALESCE("reentrycount",0)) AS count FROM "sessionplayer" WHERE "sessionid"=%s AND "status" IN ('confirmed','advanced') AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if countrow and countrow[0]["count"]:
		return _int(countrow[0]["count"],0)
	return 0

def _multidaycarryover(sessionid,visited=None):
	if visited is None:
		visited=[]
	if str(sessionid) in visited:
		return 0
	nextvisited=visited+[str(sessionid)]
	rows=query(SETTING["dbname"],f"""
		SELECT s.*
		FROM "sessionrelation" sr
		JOIN "session" s ON s."id"=sr."sourceid" AND s."deletetime" IS NULL
		WHERE sr."targetid"=%s AND sr."relationtype"='multiday' AND sr."deletetime" IS NULL
		ORDER BY s."starttime" ASC,s."id" ASC
	""",[sessionid],SETTING["dbsetting"])
	total=0
	for row in rows or []:
		sourceentries=_sessiontotalentries(row["id"])
		sourcepool=_timerprizepool(row,sourceentries,nextvisited)
		paid=_payoutcashtotal(row,sourcepool)
		left=sourcepool-paid
		if 0<left:
			total=total+left
	return total

def _timerprizepool(sessionrow,totalentries,visited=None):
	configrow=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerconfig" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionrow["id"]],SETTING["dbsetting"])
	if configrow and configrow[0].get("prizepoolmode")=="manual":
		return _num(configrow[0].get("prizepoolmanual"),0)
	pool=_num(sessionrow.get("buyin"),0)*totalentries+_multidaycarryover(sessionrow["id"],visited)
	guaranteedprize=_num(sessionrow.get("guaranteedprize"),0)
	if pool<guaranteedprize:
		pool=guaranteedprize
	return pool

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
	for i in range(len(payoutrow)):
		item=payoutrow[i]
		rankstart,rankend=_rankrange(item.get("rank"),i+1)
		if rankstart<=place and place<=rankend:
			# cash 制優先：payoutedit 現金獎金直接是該名次的絕對金額，不乘獎池 (對齊前端 payoutCashAmount)
			cash=_num(item.get("cash"),0)
			if 0<cash:
				return round(cash)
			reward=item.get("reward") or ""
			if reward!="":
				try:
					rewardtext=str(reward).replace(",","").replace("$","").strip()
					return float(rewardtext)
				except Exception as error:
					return 0
			pct=_num(item.get("pct"),0)
			if totalpct<=1.5:
				return round(pool*pct)
			return round(pool*pct/100)
	return 0

def _cost(sessionrow,row):
	buyin=_num(sessionrow.get("buyin"),0)
	fee=_num(sessionrow.get("buyinfee"),0)
	reentrycount=_int(row.get("reentrycount"),0)
	if row.get("paymenttype")=="ticket":
		ticketvalue=_num(sessionrow.get("ticketvalue"),0)
		base=ticketvalue*(1+reentrycount)
	else:
		reentrybuyin=_num(sessionrow.get("reentrybuyin"),0)
		reentryfee=_num(sessionrow.get("reentryfee"),0)
		if reentrybuyin<=0:
			reentrybuyin=buyin
		if reentryfee<=0:
			reentryfee=fee
		base=buyin+fee+(reentrybuyin+reentryfee)*reentrycount
	# rebuy 比照 reentry 補 fallback：欄位未設(<=0)時退回基本買入 / 服務費，避免 rebuy 後費用沒累加。
	rebuybuyin=_num(sessionrow.get("rebuybuyin"),0)
	rebuyfee=_num(sessionrow.get("rebuyfee"),0)
	if rebuybuyin<=0:
		rebuybuyin=buyin
	if rebuyfee<=0:
		rebuyfee=fee
	base=base+(rebuybuyin+rebuyfee)*_int(row.get("rebuycount"),0)
	# addon 維持用自己設定的價格，不 fallback（addon 通常另有價格）。
	base=base+(_num(sessionrow.get("addonbuyin"),0)+_num(sessionrow.get("addonfee"),0))*_int(row.get("addoncount"),0)
	return base

def _sessiontotalentriesmapping(sessionidlist):
	# 批次版總入場次數: 以 IN (...) 一次查多個場次的 entry 數 (1+rebuy+reentry), 回傳 {sessionid: count}。
	# 迴圈對多場呼叫 _attachfinance 前先用這個算好, 再以 totalentries 參數傳入, 避免每場各跑一次 COUNT (N+1)。
	mapping={}
	if not sessionidlist:
		return mapping
	placeholders=",".join(["%s"]*len(sessionidlist))
	countrow=query(SETTING["dbname"],f"""SELECT "sessionid",SUM(1+COALESCE("rebuycount",0)+COALESCE("reentrycount",0)) AS count FROM "sessionplayer" WHERE "sessionid" IN ({placeholders}) AND "status" IN ('confirmed','advanced') AND "deletetime" IS NULL GROUP BY "sessionid" """,sessionidlist,SETTING["dbsetting"])
	for item in countrow or []:
		mapping[item["sessionid"]]=_int(item["count"],0)
	return mapping

def _attachfinance(sessionrow,rows,totalentries=None):
	# totalentries 可由批次呼叫端 (_sessiontotalentriesmapping) 預先算好傳入; 單筆呼叫不帶參數時維持原本自查。
	if totalentries is None:
		totalentries=0
		if sessionrow and sessionrow.get("id"):
			countrow=query(SETTING["dbname"],f"""SELECT SUM(1+COALESCE("rebuycount",0)+COALESCE("reentrycount",0)) AS count FROM "sessionplayer" WHERE "sessionid"=%s AND "status" IN ('confirmed','advanced') AND "deletetime" IS NULL""",[sessionrow["id"]],SETTING["dbsetting"])
			if countrow and countrow[0]["count"]:
				totalentries=_int(countrow[0]["count"],0)
	for row in rows or []:
		if totalentries==0 and (row["status"]=="confirmed" or row["status"]=="advanced"):
			totalentries=totalentries+1+_int(row.get("rebuycount"),0)+_int(row.get("reentrycount"),0)
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
			"status": "confirmed",
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
			"status": "confirmed",
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

# 報到核對查詢的共用 SELECT; 後面接不同的 WHERE 條件 (掃 QR 用 sp."id", 手動輸入用 sp."sessionid"+sp."serialno")。
CHECKININFOSELECT="""SELECT sp.*,
       u."name" AS playername, u."playerid" AS playerplayerid,
       tp."place" AS timerplace, tp."status" AS timerstatus,
       t."no" AS tableno, t."token" AS tabletoken
    FROM "sessionplayer" sp
    JOIN "user" u ON u."id"=sp."userid"
    LEFT JOIN "sessiontimerplayer" tp ON tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."deletetime" IS NULL
    LEFT JOIN "table" t ON t."id"=sp."tableid" AND t."deletetime" IS NULL
    WHERE sp."deletetime" IS NULL AND """

# 沿晉級鏈往後追的最大步數; 正常多日賽不會超過這個層數, 純粹當防呆上限。
ADVANCECHAINMAX=20

def _advancechainfinal(row):
	# Day1 收據晉級沿用: 掃到的那筆若已晉級 (status='advanced'), 就沿著
	# advancetargetid(目標場次 id) + 同一個 userid 往後找, 一路追到最後一筆報名。
	# 中間日同時是 target 也是 source, 所以是迴圈追蹤而不是只追一層。
	# 防環: visitedplayer / visitedsession 記錄走過的 sessionplayer.id 與 sessionid,
	# 走回頭就停; 另外用 ADVANCECHAINMAX 當硬上限。
	# 目標列不存在 (資料不完整) 時就停在目前這筆, 由呼叫端照原樣顯示。
	finalrow=row
	visitedplayer=set()
	visitedsession=set()
	visitedplayer.add(row["id"])
	visitedsession.add(row["sessionid"])
	for step in range(ADVANCECHAINMAX):
		targetsessionid=_int(finalrow.get("advancetargetid"),0)
		if finalrow.get("status")!="advanced" or targetsessionid<=0 or targetsessionid in visitedsession:
			break
		nextrow=query(SETTING["dbname"],CHECKININFOSELECT+"""sp."sessionid"=%s AND sp."userid"=%s""",[targetsessionid,finalrow["userid"]],SETTING["dbsetting"])
		if not nextrow:
			break
		nextrow=nextrow[0]
		if nextrow["id"] in visitedplayer:
			break
		visitedplayer.add(nextrow["id"])
		visitedsession.add(targetsessionid)
		finalrow=nextrow
	return finalrow

def _checkininfodata(user,row):
	# 報到核對頁的顯示資料組裝, 給 getcheckininfo 與 getcheckininfobyentry 共用。
	# 回傳 (data,errorcode); 有 errorcode 時 data 為 None。
	# 權限: 本人、場次擁有者 / 管理員、該場員工 (玩家掃自己的收據不會被權限擋)。
	# 已晉級時改顯示鏈上最後一筆 (Day1 收據可沿用到 Day2/Day3), 權限一律以「最後顯示的那一場」判定,
	# 避免只有舊場次權限的人靠舊收據看到新場次資料。
	sourcerow=row
	row=_advancechainfinal(row)
	followedadvanceed=row["id"]!=sourcerow["id"]

	sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
	if not sessionrow:
		return None,"ERROR_session_not_found"
	sessionrow=sessionrow[0]

	isstaffview=_requireowner(sessionrow,user) or _sessionstaffed(sessionrow,user)
	allowed=isstaffview or row["userid"]==user["id"]
	if not allowed:
		return None,"ERROR_no_permission"

	advancedfrom=""
	advancedfromsessionid=None
	if followedadvanceed:
		advancedfromsessionid=sourcerow["sessionid"]
		sourcesessionrow=query(SETTING["dbname"],f"""SELECT "name" FROM "session" WHERE "id"=%s""",[sourcerow["sessionid"]],SETTING["dbsetting"])
		if sourcesessionrow:
			advancedfrom=sourcesessionrow[0].get("name") or ""

	# 算名次 / 獎金 (供列印獎金收據)
	_attachfinance(sessionrow,[row])

	clubname=""
	if sessionrow.get("clubid"):
		clubrow=query(SETTING["dbname"],f"""SELECT "name" FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionrow["clubid"]],SETTING["dbsetting"])
		if clubrow:
			clubname=clubrow[0].get("name") or ""
	seriestitle=""
	seriesrow=query(SETTING["dbname"],f"""SELECT se."name" AS name FROM "seriessession" ss JOIN "series" se ON se."id"=ss."seriesid" AND se."deletetime" IS NULL WHERE ss."sessionid"=%s AND ss."deletetime" IS NULL ORDER BY ss."id" ASC LIMIT 1""",[row["sessionid"]],SETTING["dbsetting"])
	if seriesrow:
		seriestitle=seriesrow[0].get("name") or ""

	tablename=row.get("tableno")
	if tablename is None or tablename=="":
		tablename=row.get("tabletoken") or ""

	return {
		"playername": row.get("playername"),
		"playerplayerid": row.get("playerplayerid"),
		"sessionid": row.get("sessionid"),
		"sessionplayerid": row.get("id"),
		"sessionname": sessionrow["name"],
		"seriestitle": seriestitle,
		"clubname": clubname,
		"starttime": sessionrow.get("starttime"),
		"serialno": row.get("serialno"),
		"status": row.get("status"),
		"place": row.get("timerplace"),
		"finalprize": row.get("finalprize"),
		"autoprize": row.get("autoprize"),
		"canissue": isstaffview,
		"tablename": tablename,
		"seatno": row.get("seatno"),
		"buyin": (row.get("buyin") or 0)+(row.get("fee") or 0),
		"paymenttype": row.get("paymenttype"),
		"reentrycount": row.get("reentrycount") or 0,
		"followedadvanceed": followedadvanceed,
		"advancedfrom": advancedfrom,
		"advancedfromsessionid": advancedfromsessionid,
		"currentsessionname": sessionrow["name"],
		"currentsessionid": row.get("sessionid")
	},None


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
		if _sessionregistrationclosed(sessionrow):
			return errorresponse("ERROR_session_not_open_for_registration")

		# 不能報名自己主辦的場次
		if sessionrow["userid"]==user["id"]:
			return errorresponse("ERROR_cannot_register_own_session")

		if _sessionstaffed(sessionrow,user):
			return errorresponse("ERROR_staff_cannot_register")


		# 看是否已有報名紀錄
		existing=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s AND "deletetime" IS NULL""",[sessionid,user["id"]],SETTING["dbsetting"])

		if existing:
			existing=existing[0]
			if existing["status"]=="registered" or existing["status"]=="confirmed":
				if existing["status"]=="confirmed" and _eliminatedtimerplayer(sessionrow["id"],existing["id"]):
					if _canreentry(sessionrow,existing):
						return _restorereentry(sessionrow,existing)
					return errorresponse("WARNING_rebuycount_exceeded")
				return errorresponse("ERROR_already_registered")
			if _sessionended(sessionrow):
				return errorresponse("ERROR_session_ended")
			# 其他啟用中狀態 (如已晉級 advanced) 一律視為已有報名, 不能重複報名; 之前取消的報名是軟刪列, 由下方復活流程處理
			return errorresponse("ERROR_already_registered")

		if _sessionended(sessionrow):
			return errorresponse("ERROR_session_ended")

		# 之前取消過 (軟刪) 的報名: 復活同一列並重設為全新報名, 不新增第二列 ((sessionid,userid) 有唯一鍵)
		deletedrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s AND "deletetime" IS NOT NULL""",[sessionid,user["id"]],SETTING["dbsetting"])
		if deletedrow:
			newid=_reviveregistration(sessionrow,deletedrow[0],"registered")
		else:
			# 自己報名時先不配序號；序號在主辦「確認 / 報到」時才依報到順序配發。
			newid=queryinsert(SETTING["dbname"],"sessionplayer",{
				"sessionid": sessionid,
				"userid": user["id"],
				"status": "registered",
				"buyin": sessionrow.get("buyin") or 0,
				"fee": sessionrow.get("buyinfee") or 0,
				"paymenttype": "ticket" if sessionrow.get("ticketenabled") else "cash",
				"ticketvalue": sessionrow.get("ticketvalue") or 0,
				"startchip": _sessionplayerstartchip(sessionrow),
				"registertime": nowtime()
			},SETTING["dbsetting"])
		_broadcastsessiontimer(sessionrow)

		notifyevent(user["id"],sessionid,"registration",
			"報名確認 Registration confirmed",
			"你已成功報名「"+str(sessionrow.get("name") or "")+"」。You have registered for \""+str(sessionrow.get("name") or "")+"\".",
			email=True)

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
		if not _caneditsession(sessionrow,user):
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
		if _sessionstaffed(sessionrow,playerrow):
			return errorresponse("ERROR_staff_cannot_register")

		existing=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s AND "deletetime" IS NULL""",[sessionid,playerrow["id"]],SETTING["dbsetting"])
		if existing:
			existing=existing[0]
			if existing["status"]=="registered" or existing["status"]=="confirmed":
				if existing["status"]=="confirmed" and _eliminatedtimerplayer(sessionrow["id"],existing["id"]):
					if _canreentry(sessionrow,existing):
						return _restorereentry(sessionrow,existing)
					return errorresponse("WARNING_rebuycount_exceeded")
				return errorresponse("ERROR_already_registered")
			return errorresponse("ERROR_already_registered")

		# 之前取消過 (軟刪) 的報名: 復活同一列並重設為全新報名, 不新增第二列 ((sessionid,userid) 有唯一鍵)
		deletedrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s AND "deletetime" IS NOT NULL""",[sessionid,playerrow["id"]],SETTING["dbsetting"])
		if deletedrow:
			newid=_reviveregistration(sessionrow,deletedrow[0],"confirmed")
		else:
			newid=queryinsert(SETTING["dbname"],"sessionplayer",{
				"sessionid": sessionid,
				"userid": playerrow["id"],
				"status": "confirmed",
				"buyin": sessionrow.get("buyin") or 0,
				"fee": sessionrow.get("buyinfee") or 0,
				"paymenttype": "ticket" if sessionrow.get("ticketenabled") else "cash",
				"ticketvalue": sessionrow.get("ticketvalue") or 0,
				"startchip": _sessionplayerstartchip(sessionrow),
				"serialno": _nextserialno(sessionid),
				"registertime": nowtime(),
				"confirmtime": nowtime()
			},SETTING["dbsetting"])
		_broadcastsessiontimer(sessionrow)

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

		if row.get("tableid") and row.get("seatno"):
			return errorresponse("ERROR_no_permission")
		if _eliminatedtimerplayer(sessionid,row["id"]):
			return errorresponse("ERROR_no_permission")
		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		_deleteregistration(sessionrow[0],row["id"])

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

		# 擁有者、管理員或該場次聘用人員皆可檢視報名清單 (與 confirm/cancel/rebuy/finance/seat/randomize 等編輯端點一致)
		if not _caneditsession(sessionrow,user):
			return errorresponse("ERROR_no_permission")

		synctimerplayers(sessionrow)

		rows=query(SETTING["dbname"],
			f"""SELECT sp.*,
			       u."name" AS playername, u."playerid" AS playerplayerid, u."email" AS playeremail,
			       tp."id" AS timerplayerid, tp."place" AS timerplace, tp."status" AS timerstatus,
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
		# 每位玩家最新一手的紀錄計分牌(endchip), 供「總計分牌數」與統一紀錄手牌的晉級預設計分牌帶入
		latestchips=latestsessionchips(sessionid)
		unifiedhandrecord=bool(sessionrow.get("unifiedhandrecord"))
		totalchipcount=0
		for r in rows:
			latestchip=intval(latestchips.get("sp:"+str(r["id"])),0)
			r["latestchip"]=latestchip
			if r["status"]=="advanced":
				totalchipcount=totalchipcount+intval(r.get("advancechip"),0)
			elif r["status"]=="confirmed" and r.get("timerstatus")!="eliminated":
				totalchipcount=totalchipcount+(latestchip if latestchip>0 else intval(r.get("startchip"),0))
		# 應有總計分牌: 這場實際發出去多少碼。與 totalchipcount(存活者身上目前有多少碼)
		# 相減就是誤差 —— 錦標賽的計分牌是守恆的, 淘汰者的碼會轉到存活者身上,
		# 所以兩者本來就該相等; 不相等表示有多發/短發, 或是還沒把碼量記錄上來。
		# 用共用的 expectedchiptotal, 與大螢幕平均碼量的分母同一套公式, 不會兩邊算出不同答案。
		expectedchipcount=expectedchiptotal(sessionrow,rows)
		tablerows=query(SETTING["dbname"],f"""SELECT "id","no","token","closedtime" FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "no" ASC""",[sessionid],SETTING["dbsetting"])
		advancetargets=_multidaytargets(sessionid)

		# 收據抬頭用：場地名稱、系列賽名稱（若此場次被系列賽包住）、開賽時間
		clubname=""
		if sessionrow.get("clubid"):
			clubrow=query(SETTING["dbname"],f"""SELECT "name" FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionrow["clubid"]],SETTING["dbsetting"])
			if clubrow:
				clubname=clubrow[0].get("name") or ""
		seriestitle=""
		seriesrow=query(SETTING["dbname"],f"""SELECT se."name" AS name FROM "seriessession" ss JOIN "series" se ON se."id"=ss."seriesid" AND se."deletetime" IS NULL WHERE ss."sessionid"=%s AND ss."deletetime" IS NULL ORDER BY ss."id" ASC LIMIT 1""",[sessionid],SETTING["dbsetting"])
		if seriesrow:
			seriestitle=seriesrow[0].get("name") or ""

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
				"seriestitle": seriestitle,
				"clubname": clubname,
				"starttime": sessionrow.get("starttime"),
				"linkuser": sessionrow.get("linkuser") or False,
				"startchip": sessionrow.get("chip") or 0,
				"maxseat": sessionrow.get("maxseat") or 9,
				"reentrycount": sessionrow.get("reentrycount") or 0,
				"rebuycount": sessionrow.get("rebuycount") or 0,
				"addoncount": sessionrow.get("addoncount") or 0,
				"rebuyallowed": _featureallowed(sessionrow,"rebuy"),
				"addonallowed": _featureallowed(sessionrow,"addon"),
				"advancetargets": advancetargets,
				"unifiedhandrecord": unifiedhandrecord,
				"totalchipcount": totalchipcount,
				"expectedchipcount": expectedchipcount,
				"tables": tablerows or [],
				"stats": stats,
				"registrations": rows
			}
		},status.HTTP_200_OK)

	# @api_view(["GET"])
	# def getsessionregistrationlist(request,sessionid):
	# 	return getsessionregistrations(request,sessionid)

	@api_view(["GET"])
	def getcheckininfo(request,sessionplayerid):
		# 報到核對頁用：掃收據 QR 進來, 用 sessionplayer.id 查單筆報名的顯示資訊。
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		if _int(sessionplayerid,0)<=0:
			return errorresponse("ERROR_registration_not_found")

		row=query(SETTING["dbname"],CHECKININFOSELECT+"""sp."id"=%s""",[_int(sessionplayerid,0)],SETTING["dbsetting"])
		if not row:
			return errorresponse("ERROR_registration_not_found")

		data,errorcode=_checkininfodata(user,row[0])
		if errorcode:
			return errorresponse(errorcode)

		return Response({
			"success": True,
			"data": data
		},status.HTTP_200_OK)

	@api_view(["GET"])
	def getcheckininfobyentry(request,sessionid,entryno):
		# 報到核對頁用：工作人員照收據手動輸入時, 用 場次 + 入場編號 (sessionplayer.serialno) 查。
		# 入場編號只在單一場次內唯一, 所以一定要帶 sessionid; 回傳結構與 getcheckininfo 完全相同。
		user,errresp=_gettokenuser(request)
		if errresp:
			return errresp

		if _int(sessionid,0)<=0:
			return errorresponse("ERROR_session_not_found")
		if _int(entryno,0)<=0:
			return errorresponse("ERROR_registration_not_found")

		row=query(SETTING["dbname"],CHECKININFOSELECT+"""sp."sessionid"=%s AND sp."serialno"=%s""",[_int(sessionid,0),_int(entryno,0)],SETTING["dbsetting"])
		if not row:
			return errorresponse("ERROR_registration_not_found")

		data,errorcode=_checkininfodata(user,row[0])
		if errorcode:
			return errorresponse(errorcode)

		return Response({
			"success": True,
			"data": data
		},status.HTTP_200_OK)

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

		if not _caneditsession(sessionrow,user):
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
		if 1<len(targets):
			return errorresponse("此賽事有多個晉級目標，請先整理關聯設定")

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
		_broadcastsessiontimer(sessionrow)

		notifyevent(row["userid"],sessionrow["id"],"advancement",
			"晉級通知 Advanced",
			"恭喜！你在「"+str(sessionrow.get("name") or "")+"」已晉級至「"+str(target.get("name") or "")+"」。You advanced to \""+str(target.get("name") or "")+"\".",
			email=True)

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

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		if not _caneditsession(sessionrow,user):
			return errorresponse("ERROR_no_permission")

		# 序號在確認 / 報到時才配發，依報到順序；若這筆已有序號則沿用。
		serialno=row.get("serialno")
		if serialno is None:
			serialno=_nextserialno(row["sessionid"])
		query(SETTING["dbname"],
			# confirmtime 用 nowtime()（本地）。這是最常走的一條路徑（報到確認），
			# 原本寫 NOW() 就是測試庫那 55 列真 UTC 的來源。見 AGENTS.md「時間欄」。
			f"""UPDATE "sessionplayer" SET "status"='confirmed',"serialno"=%s,"confirmtime"=%s,"updatetime"=NOW() WHERE "id"=%s""",
			[serialno,nowtime(),sessionplayerid],
			SETTING["dbsetting"]
		)
		_broadcastsessiontimer(sessionrow)

		notifyevent(row["userid"],sessionrow["id"],"confirmation",
			"已報到 Checked in",
			"你在「"+str(sessionrow.get("name") or "")+"」的報名已被確認報到。Your entry to \""+str(sessionrow.get("name") or "")+"\" has been confirmed.",
			email=False)

		return Response({
			"success": True,
			"data": ""
		},status.HTTP_200_OK)

	@api_view(["PUT"])
	def rebuysessionplayer(request,sessionplayerid):
		# Rebuy：把一次 rebuy 當成新的 entry。rebuycount+1、配新入場序號，費用由 _cost 自動累加。
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

		if not _caneditsession(sessionrow,user):
			return errorresponse("ERROR_no_permission")
		if not _featureallowed(sessionrow,"rebuy"):
			return errorresponse("ERROR_no_permission")
		if row["status"]!="confirmed":
			return errorresponse("ERROR_already_registered")
		maxrebuy=_int(sessionrow.get("rebuycount"),0)
		if 0<maxrebuy and _int(row.get("rebuycount"),0)>=maxrebuy:
			return errorresponse("WARNING_rebuycount_exceeded")

		query(SETTING["dbname"],
			f"""UPDATE "sessionplayer" SET "rebuycount"=COALESCE("rebuycount",0)+1,"serialno"=%s,"updatetime"=NOW() WHERE "id"=%s""",
			[_nextserialno(row["sessionid"]),sessionplayerid],
			SETTING["dbsetting"]
		)
		_broadcastsessiontimer(sessionrow)

		return Response({
			"success": True,
			"data": {
				"id": sessionplayerid,
				"rebuy": True
			}
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

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		if not _caneditsession(sessionrow,user):
			return errorresponse("ERROR_no_permission")
		if row.get("tableid") and row.get("seatno"):
			return errorresponse("ERROR_no_permission")
		if _eliminatedtimerplayer(sessionrow["id"],sessionplayerid):
			return errorresponse("ERROR_no_permission")

		_deleteregistration(sessionrow,sessionplayerid)

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

		if not _caneditsession(sessionrow,user):
			return errorresponse("ERROR_no_permission")

		requestdata=validate(json.loads(request.body),{
			"buyin": "integer|min:0",
			"fee": "integer|min:0",
			"rebuycount": "integer|min:0",
			"reentrycount": "integer|min:0",
			"addoncount": "integer|min:0",
			"prize": "integer|min:0",
			"prizeoverride": "integer|min:0",
			"ticketvalue": "integer|min:0",
			"paymenttype": "string",
			"place": "string"
		},{
			"integer": "ERROR_request_data_type_error",
			"string": "ERROR_request_data_type_error"
		})

		if requestdata["error"] is not None:
			return errorresponse(requestdata["error"])

		data=requestdata["data"]
		# prizeoverride 是「可清空」欄位：前端清空時會明確送 null，代表改回自動獎金。
		# 這裡必須用 key 有沒有送來判斷，不能用 is not None ——
		# 否則送 null（清空）會跟沒送這個欄位混為一談，把舊值原樣寫回，變成靜默的假成功。
		# validate() 會保留送來的 null key、並省略未送的 key，所以 in 判斷是可靠的。
		if "prizeoverride" in data:
			newprizeoverride=data["prizeoverride"]
		else:
			newprizeoverride=row.get("prizeoverride")
		paymenttype=data.get("paymenttype") or row.get("paymenttype") or "cash"
		if paymenttype!="ticket":
			paymenttype="cash"

		newrebuycount=data.get("rebuycount") if data.get("rebuycount") is not None else row.get("rebuycount") or 0
		newaddoncount=data.get("addoncount") if data.get("addoncount") is not None else row.get("addoncount") or 0
		warnings=[]
		if _int(newrebuycount,0)>_int(sessionrow.get("rebuycount"),0):
			warnings.append("WARNING_rebuycount_exceeded")
		if _int(newaddoncount,0)>_int(sessionrow.get("addoncount"),0):
			warnings.append("WARNING_addoncount_exceeded")

		query(SETTING["dbname"],
			f"""UPDATE "sessionplayer" SET "buyin"=%s,"fee"=%s,"rebuycount"=%s,"reentrycount"=%s,"addoncount"=%s,"prize"=%s,"prizeoverride"=%s,"ticketvalue"=%s,"paymenttype"=%s,"place"=%s,"updatetime"=NOW() WHERE "id"=%s""",
			[data.get("buyin") if data.get("buyin") is not None else row.get("buyin") or 0,data.get("fee") if data.get("fee") is not None else row.get("fee") or 0,newrebuycount,data.get("reentrycount") if data.get("reentrycount") is not None else row.get("reentrycount") or 0,newaddoncount,data.get("prize") if data.get("prize") is not None else row.get("prize") or 0,newprizeoverride,data.get("ticketvalue") if data.get("ticketvalue") is not None else row.get("ticketvalue") or 0,paymenttype,data.get("place") if data.get("place") is not None else row.get("place") or "",sessionplayerid],
			SETTING["dbsetting"]
		)

		# 稽核：記錄金額／名次異動的前後值（檢查表 1.7）
		writeauditlog(SETTING["dbname"],SETTING["dbsetting"],user["id"],"sessionplayer","editfinance",sessionplayerid,
			{"buyin": row.get("buyin"),"fee": row.get("fee"),"prize": row.get("prize"),"place": row.get("place")},
			{"buyin": data.get("buyin"),"fee": data.get("fee"),"prize": data.get("prize"),"place": data.get("place")},
			request)

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

		if not _caneditsession(sessionrow,user):
			return errorresponse("ERROR_no_permission")

		requestdata=validate(json.loads(request.body),{
			"tableid": "integer",
			"seatno": "integer",
			"startchip": "integer|min:0",
			"prizeoverride": "integer|min:0",
			"paymenttype": "string",
			"ticketvalue": "integer|min:0"
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
			if _eliminatedtimerplayer(sessionrow["id"],sessionplayerid):
				return errorresponse("ERROR_player_eliminated")
			dupe=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" sp WHERE sp."sessionid"=%s AND sp."tableid"=%s AND sp."seatno"=%s AND sp."id"<>%s AND sp."status"='confirmed' AND sp."deletetime" IS NULL AND NOT EXISTS(SELECT 1 FROM "sessiontimerplayer" tp WHERE tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."status"='eliminated' AND tp."deletetime" IS NULL)""",[row["sessionid"],tableid,seatno,sessionplayerid],SETTING["dbsetting"])
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
		_broadcastsessiontimer(sessionrow)

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

		if not _caneditsession(sessionrow,user):
			return errorresponse("ERROR_no_permission")

		requestdata=validate(json.loads(request.body),{
			"tableid": "integer",
			"tableids": "array",
			"tableids.*": "integer",
			"startchip": "integer|min:0",
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
		if mode!="selected" and mode!="balanced" and mode!="unseatall":
			mode="unseated"
		if not _bool(sessionrow.get("linkuser")) and mode!="unseatall":
			# 手動場次 (linkuser=false) 的座位存在 seating 表, 隨機入座各模式目前只支援串接場次;
			# 直接回明確錯誤, 不做只改 sessionplayer 欄位、畫面看不到效果的假成功
			return errorresponse("ERROR_request_data_type_error")
		if mode=="unseatall" and not _bool(sessionrow.get("linkuser")):
			# 手動場次: 座位是 seating 流水 (tablecurrentplayers 非 linkuser 分支),
			# 比照 mergetableplayers 非 linkuser 的清桌作法, 把該場次所有牌桌 (含已關閉桌) 的 seating rows 軟刪
			from .table import tablecurrentplayers
			tablerows=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "no" ASC,"id" ASC""",[sessionid],SETTING["dbsetting"]) or []
			unseatedcount=0
			sqllist=[]
			for i in range(len(tablerows)):
				currentplayers=tablecurrentplayers(sessionrow,tablerows[i]["id"])
				seatedcount=0
				for j in range(len(currentplayers)):
					if currentplayers[j].get("player"):
						seatedcount=seatedcount+1
				if seatedcount>0:
					unseatedcount=unseatedcount+seatedcount
					sqllist.append([f"""UPDATE "seating" SET "deletetime"=NOW() WHERE "tableid"=%s AND "deletetime" IS NULL""",[tablerows[i]["id"]]])
			if len(sqllist)>0:
				transactionresult=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
				if transactionresult is None:
					return errorresponse("ERROR_database_error")
			return Response({
				"success": True,
				"data": {
					"unseatedcount": unseatedcount
				}
			},status.HTTP_200_OK)
		if mode=="unseatall":
			# 打散 (重新抽桌): 把該場次所有在場選手 (confirmed、未淘汰) 全部退座, 之後再用既有隨機入座重抽
			# 已關閉桌上的選手一樣要清 (他們正是要被打散的), 所以不看 table.closedtime
			unseatrows=query(SETTING["dbname"],f"""SELECT sp."id" FROM "sessionplayer" sp WHERE sp."sessionid"=%s AND sp."status"='confirmed' AND (sp."tableid" IS NOT NULL OR sp."seatno" IS NOT NULL) AND sp."deletetime" IS NULL AND NOT EXISTS(SELECT 1 FROM "sessiontimerplayer" tp WHERE tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."status"='eliminated' AND tp."deletetime" IS NULL)""",[sessionid],SETTING["dbsetting"])
			unseatidlist=[]
			for i in range(len(unseatrows or [])):
				unseatidlist.append(unseatrows[i]["id"])
			if len(unseatidlist)>0:
				sqllist=[]
				for i in range(len(unseatidlist)):
					sqllist.append([f"""UPDATE "sessionplayer" SET "tableid"=NULL,"seatno"=NULL,"updatetime"=NOW() WHERE "id"=%s""",[unseatidlist[i]]])
				transactionresult=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
				if transactionresult is None:
					return errorresponse("ERROR_database_error")
			_broadcastsessiontimer(sessionrow)
			return Response({
				"success": True,
				"data": {
					"unseatedcount": len(unseatidlist)
				}
			},status.HTTP_200_OK)
		if mode=="selected" and len(playerids)==0:
			return errorresponse("ERROR_request_data_not_found")
		if mode=="selected":
			rows=[]
			for i in range(len(playerids)):
				itemrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" sp WHERE sp."id"=%s AND sp."sessionid"=%s AND sp."status"='confirmed' AND sp."deletetime" IS NULL AND NOT EXISTS(SELECT 1 FROM "sessiontimerplayer" tp WHERE tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."status"='eliminated' AND tp."deletetime" IS NULL)""",[playerids[i],sessionid],SETTING["dbsetting"])
				if itemrow:
					rows.append(itemrow[0])
		else:
			rows=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" sp WHERE sp."sessionid"=%s AND sp."status"='confirmed' AND (sp."tableid" IS NULL OR sp."seatno" IS NULL) AND sp."deletetime" IS NULL AND NOT EXISTS(SELECT 1 FROM "sessiontimerplayer" tp WHERE tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."status"='eliminated' AND tp."deletetime" IS NULL) ORDER BY sp."confirmtime" ASC,sp."registertime" ASC,sp."id" ASC""",[sessionid],SETTING["dbsetting"])
		if not rows:
			_broadcastsessiontimer(sessionrow)
			return Response({
				"success": True,
				"data": ""
			},status.HTTP_200_OK)
		if mode=="balanced":
			tableids=requestdata["data"].get("tableids") or []
			# 平均排座屬於自動挑桌: 已關閉 (closedtime 有值) 的桌一律排除, 即使呼叫端明確列出也不塞人進去
			if len(tableids)==0:
				tablerows=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL AND "closedtime" IS NULL ORDER BY "no" ASC""",[sessionid],SETTING["dbsetting"])
			else:
				tablerows=[]
				for i in range(len(tableids)):
					itemrow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "id"=%s AND "sessionid"=%s AND "deletetime" IS NULL AND "closedtime" IS NULL""",[tableids[i],sessionid],SETTING["dbsetting"])
					if itemrow:
						tablerows.append(itemrow[0])
			if len(tablerows)==0:
				return errorresponse("ERROR_table_not_found")
			tabledata=[]
			for i in range(len(tablerows)):
				table=tablerows[i]
				usedrow=query(SETTING["dbname"],f"""SELECT sp."seatno" FROM "sessionplayer" sp WHERE sp."sessionid"=%s AND sp."tableid"=%s AND sp."seatno" IS NOT NULL AND sp."status"='confirmed' AND sp."deletetime" IS NULL AND NOT EXISTS(SELECT 1 FROM "sessiontimerplayer" tp WHERE tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."status"='eliminated' AND tp."deletetime" IS NULL)""",[sessionid,table["id"]],SETTING["dbsetting"])
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
			# **選手順序刻意不洗牌**：上面那句 SQL 已經依
			# confirmtime -> registertime -> id 排好，也就是「先報名的先上桌」。
			# 這裡原本有一句 random.shuffle(rows) 會把那個順序整個打散，
			# 結果變成「隨機一個人隨機位置」。2026-08-06 依使用者要求移除：
			# 要隨機的是**位置**（每桌空位池 random.shuffle(seats)）與**分到哪一桌**
			# （人數並列最少時 random.choice(candidates)），不是誰先上。
			for i in range(len(rows or [])):
				# 找出目前人數最少的桌; 有多桌並列最少時「隨機」挑一桌,
				# 避免固定選 index 最小的桌造成 A,B,A,B 輪流入座的「排隊」感(真正隨機分桌)
				mincount=None
				candidates=[]
				for j in range(len(tabledata)):
					if len(tabledata[j]["seats"])==0:
						continue
					if mincount is None or tabledata[j]["count"]<mincount:
						mincount=tabledata[j]["count"]
						candidates=[j]
					elif tabledata[j]["count"]==mincount:
						candidates.append(j)
				if not candidates:
					break
				best=random.choice(candidates)
				seatno=tabledata[best]["seats"].pop(0)
				tabledata[best]["count"]=tabledata[best]["count"]+1
				query(SETTING["dbname"],f"""UPDATE "sessionplayer" SET "tableid"=%s,"seatno"=%s,"startchip"=%s,"updatetime"=NOW() WHERE "id"=%s""",[tabledata[best]["table"]["id"],seatno,startchip,rows[i]["id"]],SETTING["dbsetting"])
			query(SETTING["dbname"],f"""UPDATE "sessiontimerconfig" SET "startingchips"=%s,"updatetime"=NOW() WHERE "sessionid"=%s AND "deletetime" IS NULL""",[startchip,sessionrow["id"]],SETTING["dbsetting"])
			_broadcastsessiontimer(sessionrow)
			return Response({"success": True,"data": ""},status.HTTP_200_OK)

		tableid=requestdata["data"].get("tableid")
		if not tableid:
			return errorresponse("ERROR_table_not_found")
		tablerow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "id"=%s AND "sessionid"=%s AND "deletetime" IS NULL""",[tableid,sessionid],SETTING["dbsetting"])
		if not tablerow:
			return errorresponse("ERROR_table_not_found")
		tablerow=tablerow[0]
		# 未入座補位/重排選取屬於整批自動排座: 已關閉的桌不可再塞新選手 (比照 mergetableplayers 對關閉目標桌回錯誤)
		if tablerow.get("closedtime"):
			return errorresponse("ERROR_table_closed")
		seats=[]
		for i in range(1,maxseat+1):
			seats.append(i)
		usedrow=query(SETTING["dbname"],f"""SELECT sp."seatno" FROM "sessionplayer" sp WHERE sp."sessionid"=%s AND sp."tableid"=%s AND sp."seatno" IS NOT NULL AND sp."status"='confirmed' AND sp."deletetime" IS NULL AND NOT EXISTS(SELECT 1 FROM "sessiontimerplayer" tp WHERE tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."status"='eliminated' AND tp."deletetime" IS NULL)""",[sessionid,tableid],SETTING["dbsetting"])
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
		_broadcastsessiontimer(sessionrow)

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
