# timer.py

import datetime
import json
import threading
from decimal import Decimal
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *
from .authhelper import gettokenuser as commonauthuser

DEFAULTSCHEDULE=[
	{"type": "level","sb": 100,"bb": 200,"ante": 200,"dur": 20},
	{"type": "level","sb": 200,"bb": 400,"ante": 400,"dur": 20},
	{"type": "level","sb": 300,"bb": 600,"ante": 600,"dur": 20},
	{"type": "level","sb": 400,"bb": 800,"ante": 800,"dur": 20},
	{"type": "level","sb": 500,"bb": 1000,"ante": 1000,"dur": 20},
	{"type": "break","dur": 10,"regCloseAfter": True},
	{"type": "level","sb": 800,"bb": 1600,"ante": 1600,"dur": 20},
	{"type": "level","sb": 1200,"bb": 2400,"ante": 2400,"dur": 20},
	{"type": "level","sb": 1500,"bb": 3000,"ante": 3000,"dur": 20},
	{"type": "level","sb": 2000,"bb": 4000,"ante": 4000,"dur": 20},
	{"type": "level","sb": 3000,"bb": 6000,"ante": 6000,"dur": 20}
]

DEFAULTPAYOUTS=[
	{"rank": "1","pct": 1,"cash": 0,"reward": "","color": "#cbd5e1"},
]

DEFAULTMARQUEE=""

# 結構欄位: 寫入內容改到 schedule/payouts/config 這類欄位時, 一律要有 hastimerstructurepermission, 不依賴 client 傳的 action
STRUCTUREFIELDLIST=["schedule","payouts","tournName","subtitle","startingChips","defaultBreakDur","soundOn","vibeOn","prizePoolMode","prizePoolManual","itmMode","itmPct","itmCount","marqueeText","defaultTimebankSeconds","timebankSoundOn","autoStartByTime","otherReward"]

def normalizeotherreward(value):
	# 其他獎勵: 與名次無關的自由標籤獎勵記錄 (例如 Bounty / 首殺獎), 三欄為 label / cash / reward。
	# 存放位置沿用 sessiontimerconfig.otherreward (text), 內容改存 JSON 陣列字串。
	# 這份資料純粹是記錄, 不參與任何自動獎金計算: 不進 sessionplayer._payoutamount,
	# 不列入獎金總和 / 獎池, 也不與名次比對。
	# 相容處理: 舊值是單一純文字 (非 JSON), 為了不丟資料轉成一列 label="其他" 的記錄。
	source=value
	if isinstance(source,str):
		text=source.strip()
		if text=="":
			return []
		try:
			source=json.loads(text)
		except Exception as error:
			return [{"label": "其他","cash": 0,"reward": text}]
	if not isinstance(source,list):
		return []
	output=[]
	for item in source:
		if isinstance(item,dict):
			label=str(item.get("label") or "").strip()
			reward=str(item.get("reward") or "").strip()
			cash=floatval(item.get("cash"),0)
			if label!="" or reward!="" or 0<cash:
				output.append({"label": label,"cash": cash,"reward": reward})
	return output

def normalizetimerstate(stateval):
	if stateval is None:
		return {}
	if isinstance(stateval,str):
		try:
			return json.loads(stateval)
		except Exception as error:
			return {}
	return stateval

def boolval(value):
	if value==True or value==1 or value=="1" or value=="true" or value=="True":
		return True
	return False

def intval(value,defaultvalue=0):
	try:
		return int(value)
	except Exception as error:
		return defaultvalue

def floatval(value,defaultvalue=0):
	try:
		return float(value)
	except Exception as error:
		return defaultvalue

def parsetimervalue(value):
	if not value:
		return None
	if isinstance(value,datetime.datetime):
		return value.replace(tzinfo=None)
	text=str(value).replace("T"," ").replace("Z","")
	if "+" in text:
		text=text.split("+")[0]
	if "." in text:
		text=text.split(".")[0]
	try:
		return datetime.datetime.strptime(text,"%Y-%m-%d %H:%M:%S")
	except Exception as error:
		return None

def timerseconds(item):
	return intval(item.get("dur"),20)*60

def ishandlevel(item):
	# 手數級別: 以手數計算, 不靠倒數時間, 後端不可自動扣秒或換級
	return item.get("type")=="level" and item.get("timemode")=="hands"

def normalizeindex(index,schedule):
	if not schedule:
		return 0
	index=intval(index,0)
	if index<0:
		return 0
	if len(schedule)<=index:
		return len(schedule)-1
	return index

def advanceruntime(runtime,schedule):
	runtime=normalizetimerstate(runtime)
	if not schedule:
		return runtime
	now=nowtime()
	index=normalizeindex(runtime.get("currentIndex"),schedule)
	secondsleft=intval(runtime.get("anchorSecondsLeft"),intval(runtime.get("secondsLeft"),timerseconds(schedule[index])))
	if secondsleft<0:
		secondsleft=0
	running=boolval(runtime.get("running"))
	if running and not ishandlevel(schedule[index]):
		anchortime=parsetimervalue(runtime.get("anchorTime")) or parsetimervalue(runtime.get("lastSyncTime"))
		if anchortime:
			elapsed=int((datetime.datetime.now()-anchortime).total_seconds())
			if 0<elapsed:
				secondsleft=secondsleft-elapsed
		while secondsleft<=0 and index<len(schedule)-1:
			if boolval(schedule[index].get("regCloseAfter")) and not boolval(runtime.get("regCloseHandled")):
				runtime["regClosed"]=True
				runtime["regCloseHandled"]=True
			index=index+1
			secondsleft=secondsleft+timerseconds(schedule[index])
		if secondsleft<=0:
			secondsleft=0
			running=False
	runtime["currentIndex"]=index
	runtime["secondsLeft"]=secondsleft
	runtime["running"]=running
	runtime["anchorSecondsLeft"]=secondsleft
	runtime["anchorTime"]=now
	runtime["lastSyncTime"]=now
	return runtime

def saveregclosedbyindex(runtime,schedule):
	return runtime

ENSURETIMERTABLESLOCK=threading.Lock()
timertablesensured=False

def ensuretimertables():
	# DDL 只需每個行程執行一次, 不要掛在每次 save/get 熱路徑上
	global timertablesensured
	if not timertablesensured:
		with ENSURETIMERTABLESLOCK:
			if not timertablesensured:
				createtimertables()
				timertablesensured=True

def createtimertables():
	query(SETTING["dbname"],"""ALTER TABLE public."table" ADD COLUMN IF NOT EXISTS no integer""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""
		DO $$
		BEGIN
			IF EXISTS(
				SELECT 1 FROM information_schema.columns
				WHERE table_schema='public' AND table_name='table' AND column_name='name'
			) THEN
				EXECUTE 'UPDATE public."table" SET no=CASE WHEN name ~ ''^[0-9]+$'' THEN name::integer ELSE id::integer END WHERE no IS NULL';
			ELSE
				UPDATE public."table" SET no=id::integer WHERE no IS NULL;
			END IF;
		END $$;
	""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""
		CREATE TABLE IF NOT EXISTS public.sessiontimerconfig(
			id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
			sessionid bigint NOT NULL UNIQUE,
			tournname varchar(200) NOT NULL DEFAULT '',
			subtitle varchar(200) NOT NULL DEFAULT '',
			startingchips bigint NOT NULL DEFAULT 0,
			buyin bigint NOT NULL DEFAULT 0,
			fee bigint NOT NULL DEFAULT 0,
			defaultbreakdur integer NOT NULL DEFAULT 10,
			soundon boolean NOT NULL DEFAULT true,
			vibeon boolean NOT NULL DEFAULT true,
			prizepoolmode varchar(20) NOT NULL DEFAULT 'auto',
			prizepoolmanual bigint NOT NULL DEFAULT 0,
			itmmode varchar(20) NOT NULL DEFAULT 'pct',
			itmpct numeric NOT NULL DEFAULT 15,
			itmcount integer NOT NULL DEFAULT 7,
			marqueetext text NOT NULL DEFAULT '',
			defaulttimebankseconds integer NOT NULL DEFAULT 15,
			timebanksoundon boolean NOT NULL DEFAULT true,
			autostartbytime boolean NOT NULL DEFAULT false,
			otherreward text NOT NULL DEFAULT '',
			createtime timestamp with time zone NOT NULL DEFAULT now(),
			updatetime timestamp with time zone NOT NULL DEFAULT now(),
			deletetime timestamp with time zone
		)
	""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public.sessiontimerconfig ADD COLUMN IF NOT EXISTS defaulttimebankseconds integer NOT NULL DEFAULT 15""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public.sessiontimerconfig ADD COLUMN IF NOT EXISTS timebanksoundon boolean NOT NULL DEFAULT true""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public.sessiontimerconfig ADD COLUMN IF NOT EXISTS autostartbytime boolean NOT NULL DEFAULT false""",[],SETTING["dbsetting"])
	# 非名次獎勵(例如 bounty)的純文字記錄欄位, 不參與任何獎金自動計算
	query(SETTING["dbname"],"""ALTER TABLE public.sessiontimerconfig ADD COLUMN IF NOT EXISTS otherreward text NOT NULL DEFAULT ''""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""
		CREATE TABLE IF NOT EXISTS public.sessiontimerlevel(
			id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
			sessionid bigint NOT NULL,
			sortorder integer NOT NULL,
			type varchar(20) NOT NULL DEFAULT 'level',
			smallblind bigint NOT NULL DEFAULT 0,
			bigblind bigint NOT NULL DEFAULT 0,
			ante bigint NOT NULL DEFAULT 0,
			durationminutes integer NOT NULL DEFAULT 20,
			timemode varchar(20) NOT NULL DEFAULT 'time',
			handtargetcount integer NOT NULL DEFAULT 0,
			handcount integer NOT NULL DEFAULT 0,
			regcloseafter boolean NOT NULL DEFAULT false,
			chipraisevalues text NOT NULL DEFAULT '[]',
			createtime timestamp with time zone NOT NULL DEFAULT now(),
			updatetime timestamp with time zone NOT NULL DEFAULT now(),
			deletetime timestamp with time zone
		)
	""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public.sessiontimerlevel ADD COLUMN IF NOT EXISTS chipraisevalues text NOT NULL DEFAULT '[]'""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public.sessiontimerlevel ADD COLUMN IF NOT EXISTS timemode varchar(20) NOT NULL DEFAULT 'time'""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public.sessiontimerlevel ADD COLUMN IF NOT EXISTS handtargetcount integer NOT NULL DEFAULT 0""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public.sessiontimerlevel ADD COLUMN IF NOT EXISTS handcount integer NOT NULL DEFAULT 0""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""
		CREATE TABLE IF NOT EXISTS public.sessiontimerpayout(
			id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
			sessionid bigint NOT NULL,
			sortorder integer NOT NULL,
			rank varchar(50) NOT NULL DEFAULT '',
			pct numeric NOT NULL DEFAULT 0,
			cash numeric NOT NULL DEFAULT 0,
			reward text NOT NULL DEFAULT '',
			color varchar(20) NOT NULL DEFAULT '#888',
			createtime timestamp with time zone NOT NULL DEFAULT now(),
			updatetime timestamp with time zone NOT NULL DEFAULT now(),
			deletetime timestamp with time zone
		)
	""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public.sessiontimerpayout ADD COLUMN IF NOT EXISTS reward text NOT NULL DEFAULT ''""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public.sessiontimerpayout ADD COLUMN IF NOT EXISTS cash numeric NOT NULL DEFAULT 0""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""
		CREATE TABLE IF NOT EXISTS public.sessiontimerplayer(
			id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
			sessionid bigint NOT NULL,
			sessionplayerid bigint NOT NULL,
			userid bigint NOT NULL,
			status varchar(20) NOT NULL DEFAULT 'active',
			eliminatedtime timestamp with time zone,
			place integer,
			createtime timestamp with time zone NOT NULL DEFAULT now(),
			updatetime timestamp with time zone NOT NULL DEFAULT now(),
			deletetime timestamp with time zone,
			UNIQUE(sessionid,sessionplayerid)
		)
	""",[],SETTING["dbsetting"])

def gettimerpermissionuser(request):
	return commonauthuser(request)

def gettimerreaduser(request):
	header=request.headers.get("Authorization")
	token=None
	try:
		if header:
			token=header.split("Bearer ")[1]
	except Exception as error:
		return (None,errorresponse("ERROR_token_not_found"))
	if not token:
		return (None,None)
	tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
	if not tokenrow:
		return (None,errorresponse("ERROR_token_error"))
	userrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s AND "deletetime" IS NULL""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
	if not userrow:
		return (None,errorresponse("ERROR_user_not_found"))
	return (userrow[0],None)

def hastimerreadpermission(sessionrow,userrow):
	if not sessionrow:
		return False
	# 公開顯示(display.html 匿名可看)只開放給「主辦賽事(owned)且非私人」的場次;
	# 個人紀錄場(owned=false)或私人場一律要登入且具權限, 不對外公開計時器
	if boolval(sessionrow.get("owned")) and not boolval(sessionrow.get("private")):
		return True
	if not userrow:
		return False
	if sessionrow["userid"]==userrow["id"]:
		return True
	if 4<=int(userrow["permission"]):
		return True
	staffrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionstaff" WHERE "sessionid"=%s AND "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL""",[sessionrow["id"],userrow["id"]],SETTING["dbsetting"])
	if staffrow:
		return True
	staffrow=query(SETTING["dbname"],f"""SELECT*FROM "userstaff" WHERE "userid"=%s AND "staffuserid"=%s AND "status"='active' AND "deletetime" IS NULL""",[sessionrow["userid"],userrow["id"]],SETTING["dbsetting"])
	if staffrow:
		return True
	regrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s AND "deletetime" IS NULL""",[sessionrow["id"],userrow["id"]],SETTING["dbsetting"])
	if regrow:
		return True
	return False

def hastimercontrolpermission(sessionrow,userrow):
	if not userrow:
		return False
	if sessionrow["userid"]==userrow["id"]:
		return True
	if 4<=int(userrow["permission"]):
		return True
	staffrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionstaff" WHERE "sessionid"=%s AND "staffuserid"=%s AND "role" IN ('floor','assistant') AND "status"='active' AND "deletetime" IS NULL""",[sessionrow["id"],userrow["id"]],SETTING["dbsetting"])
	if staffrow:
		return True
	staffrow=query(SETTING["dbname"],f"""SELECT*FROM "userstaff" WHERE "userid"=%s AND "staffuserid"=%s AND "role" IN ('floor','assistant') AND "status"='active' AND "deletetime" IS NULL""",[sessionrow["userid"],userrow["id"]],SETTING["dbsetting"])
	if staffrow:
		return True
	return False

def hastimerstructurepermission(sessionrow,userrow):
	if not userrow:
		return False
	if sessionrow["userid"]==userrow["id"]:
		return True
	if 4<=int(userrow["permission"]):
		return True
	staffrow=query(SETTING["dbname"],f"""SELECT*FROM "sessionstaff" WHERE "sessionid"=%s AND "staffuserid"=%s AND "role" IN ('floor','assistant') AND "status"='active' AND "deletetime" IS NULL""",[sessionrow["id"],userrow["id"]],SETTING["dbsetting"])
	if staffrow:
		return True
	staffrow=query(SETTING["dbname"],f"""SELECT*FROM "userstaff" WHERE "userid"=%s AND "staffuserid"=%s AND "role" IN ('floor','assistant') AND "status"='active' AND "deletetime" IS NULL""",[sessionrow["userid"],userrow["id"]],SETTING["dbsetting"])
	if staffrow:
		return True
	return False

def schedulestructurevalue(schedule):
	# 比較盲注結構是否被修改用: handCount 是手數級別的運行期欄位, 由計時操作與紀錄手牌更新, 不算結構修改
	result=[]
	for item in (schedule or []):
		if isinstance(item,dict):
			copyitem={}
			for key in item:
				if key!="handCount":
					copyitem[key]=item[key]
			result.append(copyitem)
		else:
			result.append(item)
	return result

def broadcasttimerupdate(sessionid,state):
	try:
		layer=get_channel_layer()
		if layer:
			async_to_sync(layer.group_send)("timer_"+str(sessionid),{
				"type": "timer.update",
				"state": state
			})
	except Exception as error:
		printcolorhaveline("fail","[ERROR] broadcasttimerupdate "+str(error),"")

def getconfirmedregistrations(sessionid):
	row=query(SETTING["dbname"],
		f"""SELECT sp.*, u."name" AS playername, u."playerid" AS playerplayerid
		   FROM "sessionplayer" sp
		   JOIN "user" u ON u."id"=sp."userid"
		   WHERE sp."sessionid"=%s AND sp."status" IN ('confirmed','advanced') AND sp."deletetime" IS NULL
		   ORDER BY sp."confirmtime" ASC, sp."registertime" ASC, sp."id" ASC""",
		[sessionid],
		SETTING["dbsetting"]
	)
	return row or []

def synctimerplayers(sessionrow):
	if not boolval(sessionrow.get("linkuser")):
		return
	registrations=getconfirmedregistrations(sessionrow["id"])
	existingrow=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerplayer" WHERE "sessionid"=%s""",[sessionrow["id"]],SETTING["dbsetting"])
	existing={}
	for i in range(len(existingrow or [])):
		existing[existingrow[i]["sessionplayerid"]]=existingrow[i]
	updateids=[]
	insertrows=[]
	for item in registrations:
		row=existing.get(item["id"])
		if row:
			updateids.append(row["id"])
		else:
			insertrows.append({
				"sessionid": sessionrow["id"],
				"sessionplayerid": item["id"],
				"userid": item["userid"],
				"status": "active"
			})
	if updateids:
		placeholders=",".join(["%s"]*len(updateids))
		query(SETTING["dbname"],f"""UPDATE "sessiontimerplayer" SET "deletetime"=NULL,"updatetime"=NOW() WHERE "id" IN ({placeholders})""",updateids,SETTING["dbsetting"])
	if insertrows:
		queryinsert(SETTING["dbname"],"sessiontimerplayer",insertrows,SETTING["dbsetting"])
	query(SETTING["dbname"],
		f"""UPDATE "sessionplayer" sp
		   SET "tableid"=NULL,"seatno"=NULL,"updatetime"=NOW()
		   FROM "sessiontimerplayer" tp
		   WHERE tp."sessionplayerid"=sp."id"
		     AND tp."sessionid"=%s
		     AND tp."status"='eliminated'
		     AND tp."deletetime" IS NULL
		     AND sp."deletetime" IS NULL
		     AND (sp."tableid" IS NOT NULL OR sp."seatno" IS NOT NULL)""",
		[sessionrow["id"]],
		SETTING["dbsetting"]
	)

def gettimerplayerrows(sessionid):
	row=query(SETTING["dbname"],
		f"""SELECT tp.*, sp."status" AS registrationstatus, sp."tableid", sp."seatno",
		          sp."serialno", sp."registertime", sp."confirmtime",
		          sp."rebuycount", sp."reentrycount", sp."addoncount", sp."startchip", sp."advancechip",
		          sp."prizeoverride", sp."prize",
		          u."name" AS playername, u."playerid" AS playerplayerid,
		          u."avatarurl" AS playeravatarurl,
		          t."no" AS tablename, t."token" AS tabletoken
		   FROM "sessiontimerplayer" tp
		   JOIN "sessionplayer" sp ON sp."id"=tp."sessionplayerid"
		   JOIN "user" u ON u."id"=tp."userid"
		   LEFT JOIN "table" t ON t."id"=sp."tableid" AND t."deletetime" IS NULL
		   WHERE tp."sessionid"=%s AND tp."deletetime" IS NULL AND sp."status" IN ('confirmed','advanced') AND sp."deletetime" IS NULL
		   ORDER BY tp."status" ASC, t."no" ASC, sp."seatno" ASC, sp."serialno" ASC, tp."id" ASC""",
		[sessionid],
		SETTING["dbsetting"]
	)
	return row or []

def serializetimerplayers(row):
	data=[]
	for i in range(len(row)):
		item={}
		for key in row[i]:
			value=row[i][key]
			if "time" in key and value is not None:
				item[key]=str(value)
			elif isinstance(value,Decimal):
				if value==value.to_integral_value():
					item[key]=int(value)
				else:
					item[key]=float(value)
			else:
				item[key]=value
		data.append(item)
	return data

def linkedcounts(sessionid):
	row=gettimerplayerrows(sessionid)
	total=0
	active=0
	for i in range(len(row)):
		total=total+1+intval(row[i].get("rebuycount"),0)+intval(row[i].get("reentrycount"),0)
		if row[i]["status"]=="active" and row[i].get("registrationstatus")!="advanced":
			active=active+1
	return (active,total,row)

def sessionknockoutcounts(sessionid):
	# 從牌局推算淘汰數（殺人數）：同一手牌中計分牌歸 0 被淘汰的玩家（victim），
	# 由該手贏家（killer）記一次淘汰。雙殺會正確計兩次；分池同時爆掉的罕見情形可能重複計，屬可接受誤差。
	row=query(SETTING["dbname"],"""
		SELECT killer."sessionplayerid" AS killerid, COUNT(*) AS knockouts
		FROM "hand" h
		JOIN "table" t ON t."id"=h."tableid" AND t."deletetime" IS NULL
		JOIN "handseating" killer ON killer."handid"=h."id" AND killer."winnered"=true
			AND killer."sessionplayerid" IS NOT NULL AND killer."deletetime" IS NULL
		JOIN "handseating" victim ON victim."handid"=h."id" AND victim."winnered"=false
			AND victim."sessionplayerid" IS NOT NULL AND victim."deletetime" IS NULL
			AND COALESCE(victim."endchip",0)<=0
			AND POSITION('UNKNOWN_CHIP' IN COALESCE(victim."specialbutton",''))=0
		WHERE t."sessionid"=%s AND h."recordtype"='hand' AND h."deletetime" IS NULL
		GROUP BY killer."sessionplayerid"
	""",[sessionid],SETTING["dbsetting"])
	counts={}
	for i in range(len(row or [])):
		counts[intval(row[i].get("killerid"))]=intval(row[i].get("knockouts"),0)
	return counts

def attachknockouts(sessionid,playerlist):
	counts=sessionknockoutcounts(sessionid)
	for i in range(len(playerlist or [])):
		playerlist[i]["knockouts"]=intval(counts.get(intval(playerlist[i].get("sessionplayerid"))),0)
	return playerlist

def latestsessionchips(sessionid):
	latestrow=query(SETTING["dbname"],"""
		SELECT DISTINCT ON (h."tableid") h."id"
		FROM "hand" h
		JOIN "table" t ON t."id"=h."tableid" AND t."deletetime" IS NULL
		WHERE t."sessionid"=%s AND h."deletetime" IS NULL
		ORDER BY h."tableid",h."createtime" DESC,h."id" DESC
	""",[sessionid],SETTING["dbsetting"])
	if not latestrow:
		return {}
	handids=[]
	for i in range(len(latestrow)):
		handids.append(latestrow[i]["id"])
	placeholders=",".join(["%s"]*len(handids))
	seatingrow=query(SETTING["dbname"],f"""SELECT*FROM "handseating" WHERE "handid" IN ({placeholders}) AND "deletetime" IS NULL""",handids,SETTING["dbsetting"])
	chips={}
	for i in range(len(seatingrow or [])):
		item=seatingrow[i]
		chip=item.get("endchip") or item.get("chip") or 0
		if item.get("sessionplayerid"):
			chips["sp:"+str(item["sessionplayerid"])]=chip
		elif item.get("userid"):
			chips["u:"+str(item["userid"])]=chip
		elif item.get("name"):
			chips["n:"+str(item["name"])]=chip
	return chips

def timerplayerchip(sessionrow,item,latestchips):
	key=""
	if item.get("sessionplayerid"):
		key="sp:"+str(item["sessionplayerid"])
	elif item.get("userid"):
		key="u:"+str(item["userid"])
	elif item.get("playername"):
		key="n:"+str(item["playername"])
	if key and key in latestchips and 0<=intval(latestchips[key],-1):
		return intval(latestchips[key],0)
	chip=intval(item.get("startchip"),0)
	if chip<=0:
		chip=intval(item.get("advancechip"),0)
	if chip<=0:
		chip=intval(sessionrow.get("chip"),0)
	return chip

def linkedchiptotal(sessionrow,row):
	latestchips=latestsessionchips(sessionrow["id"])
	total=0
	active=0
	for i in range(len(row)):
		if row[i]["status"]=="active" and row[i].get("registrationstatus")!="advanced":
			total=total+timerplayerchip(sessionrow,row[i],latestchips)
			active=active+1
	if active==0:
		return 0
	return total

def linkedchipgrandtotal(sessionrow,row,latestchips=None):
	# 全場總計分牌: 在場玩家(active 非 advanced)用最新計分牌, 已晉級玩家用晉級計分牌(advancechip)
	if latestchips is None:
		latestchips=latestsessionchips(sessionrow["id"])
	total=0
	for i in range(len(row)):
		if row[i].get("registrationstatus")=="advanced":
			total=total+intval(row[i].get("advancechip"),0)
		elif row[i]["status"]=="active":
			total=total+timerplayerchip(sessionrow,row[i],latestchips)
	return total

def finalizetimerpendingplaces(sessionid):
	registeredcount=len(gettimerplayerrows(sessionid))
	row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerplayer" WHERE "sessionid"=%s AND "status"='eliminated' AND "deletetime" IS NULL ORDER BY "eliminatedtime" ASC, "id" ASC""",[sessionid],SETTING["dbsetting"])
	for i in range(len(row or [])):
		if row[i]["place"] is None:
			place=registeredcount-i
			query(SETTING["dbname"],f"""UPDATE "sessiontimerplayer" SET "place"=%s,"updatetime"=NOW() WHERE "id"=%s""",[place,row[i]["id"]],SETTING["dbsetting"])

def timerregclosed(sessionid):
	row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimer" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if not row:
		return False
	stateval=normalizetimerstate(row[0]["state"])
	return boolval(stateval.get("regClosed"))

def multidaycarryover(sessionid):
	try:
		from .sessionplayer import _multidaycarryover
		return _multidaycarryover(sessionid)
	except Exception as error:
		printcolorhaveline("fail","[ERROR] multidaycarryover "+str(error),"")
	return 0

def multidayremaining(sessionid):
	try:
		from .session import _multidayremainingcount
		return _multidayremainingcount(sessionid)
	except Exception as error:
		printcolorhaveline("fail","[ERROR] multidayremaining "+str(error),"")
	return 0

def multidaytodayentries(sessionid):
	# 本日進場次數 = 此場的總入場次數 (1+rebuy+reentry, confirmed/advanced), 即 _sessiontotalentries。
	# 顯示端分母用這個, 不用 multidayremaining(只算前一日晉級進來的人)——否則 Day2 有 re-entry /
	# 直接報名時, 在場人數會超過晉級人數而出現 13/12 的矛盾畫面。
	# 這裡數「入場次數」不是「人數」: 同一人 re-entry 一次, 分母 +1(13->14), 與「總入場」的 +1 對齊,
	# 例: 12 晉級 + 1 人本日進場 = 13, 該人爆掉再 re-entry -> 分母 14、總數 +1。
	# status 含 advanced: 已晉級去下一日的人今天仍算「本日進場」過, 計入分母; 在場人數(numerator)才排除 advanced。
	try:
		from .sessionplayer import _sessiontotalentries
		return _sessiontotalentries(sessionid)
	except Exception as error:
		printcolorhaveline("fail","[ERROR] multidaytodayentries "+str(error),"")
	return 0

def hasmultidayincoming(sessionid):
	# 此場是否有玩家從前一日晉級進來 (即此場是某條 multiday 關係的 target)。
	# 不可用 multidaytargetid 轉址: 中間日 (Day2) 同時是前一日的 target 與下一日的 source,
	# 轉址會把它誤判成 source 而漏判, 直接以 sessionid 當 target 查即可。
	row=query(SETTING["dbname"],f"""
		SELECT COUNT(*) AS count
		FROM "sessionrelation"
		WHERE "relationtype"='multiday' AND "deletetime" IS NULL
		  AND "targetid"=%s
	""",[sessionid],SETTING["dbsetting"])
	if row and row[0].get("count") is not None:
		return 0<intval(row[0].get("count"),0)
	return False

def multidaysourcetotalentries(sessionid):
	# 整個多日賽的參賽總入場次數 = 走遍同一多日賽的所有場次, 每場加總「本場入場次數 − 本場晉級承接列數」。
	#   本場入場次數 = _sessiontotalentries = SUM(1+rebuy+reentry)（confirmed/advanced）。
	#   本場晉級承接列數 = 本場 sessionplayer 中 advancesourceid 有值的列(從前一日晉級進來那幾筆)。
	#   減掉承接列的「基本入場」= 前一日已算過的重複; 他們在本場的 rebuy/reentry 與本場全新報名保留。
	#   用 target 端承接列數而非來源端晉級人數(_multidayremainingcount): 要扣的正是本場那幾筆重複基本入場,
	#   target 端一一對應最準; 來源端在多來源或晉級後又異動時可能多扣/少扣(曾出現 14/14 但總數多算 2)。
	#   例: Day1=127, Day2 有 12 人晉級 + 2 人 Day2 才買進 → _sessiontotalentries(Day2)=14、承接列=12,
	#       Day2 貢獻 14−12=2, 總計 127+2=129。
	# 舊版只加總「根場次(第一日)」的報名數, 因此 Day2 之後的 re-entry / 直接報名一律漏算(總數卡在 127)。
	# 走整張圖(往上找來源、往下找目標)而非只找根, 才能把每一天的新入場都納入; visited 防環、去重。
	try:
		from .sessionplayer import _sessiontotalentries
	except Exception as error:
		printcolorhaveline("fail","[ERROR] multidaysourcetotalentries import "+str(error),"")
		return 0
	visited=set()
	stack=[sessionid]
	while stack:
		currentid=stack.pop()
		if currentid in visited:
			continue
		visited.add(currentid)
		# 往上: 誰是 currentid 的來源(sourceid, targetid=current)
		# 往下: currentid 是誰的來源(targetid, sourceid=current)
		neighbours=query(SETTING["dbname"],f"""
			SELECT sr."sourceid" AS sid, sr."targetid" AS tid
			FROM "sessionrelation" sr
			WHERE (sr."targetid"=%s OR sr."sourceid"=%s) AND sr."relationtype"='multiday' AND sr."deletetime" IS NULL
		""",[currentid,currentid],SETTING["dbsetting"])
		for i in range(len(neighbours or [])):
			sid=neighbours[i]["sid"]
			tid=neighbours[i]["tid"]
			if sid is not None and sid not in visited:
				stack.append(sid)
			if tid is not None and tid not in visited:
				stack.append(tid)
	total=0
	for dayid in visited:
		# 本場晉級承接列數 = advancesourceid 有值的列(從前一日承接進來那幾筆)。
		# 扣掉這些列的「基本入場」(前一日已算過的重複); 他們在本場的 rebuy/reentry 與本場全新報名保留。
		carryrow=query(SETTING["dbname"],f"""SELECT COUNT(*) AS count FROM "sessionplayer" WHERE "sessionid"=%s AND "advancesourceid" IS NOT NULL AND "status" IN ('confirmed','advanced') AND "deletetime" IS NULL""",[dayid],SETTING["dbsetting"])
		carry=intval(carryrow[0].get("count"),0) if carryrow else 0
		total=total+_sessiontotalentries(dayid)-carry
	return total

def defaultconfig(sessionrow,players,totalentries):
	return {
		"tournName": sessionrow["name"] or "Poker Tournament",
		"subtitle": "",
		"startingChips": intval(sessionrow.get("chip"),40000),
		"buyin": intval(sessionrow.get("buyin"),0),
		"fee": intval(sessionrow.get("buyinfee"),0),
		"defaultBreakDur": 10,
		"soundOn": True,
		"vibeOn": True,
		"prizePoolMode": "auto",
		"prizePoolManual": intval(sessionrow.get("buyin"),0)*totalentries,
		"prizePoolCarryover": intval(multidaycarryover(sessionrow["id"]),0),
		"guaranteedPrize": intval(sessionrow.get("guaranteedprize"),0),
		"itmMode": "pct",
		"itmPct": 15,
		"itmCount": 7,
		"marqueeText": DEFAULTMARQUEE,
		"defaultTimebankSeconds": 15,
		"timebankSoundOn": True,
		"autoStartByTime": False,
		"otherReward": []
	}

def legacytimerstate(sessionid):
	row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimer" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if row:
		return normalizetimerstate(row[0]["state"])
	return {}

def defaultstate(sessionrow,syncplayersed=True):
	players=52
	totalentries=52
	if boolval(sessionrow.get("linkuser")) and syncplayersed:
		synctimerplayers(sessionrow)
		counts=linkedcounts(sessionrow["id"])
		players=counts[0]
		totalentries=counts[1]
	return {
		"currentIndex": 0,
		"secondsLeft": DEFAULTSCHEDULE[0]["dur"]*60,
		"anchorSecondsLeft": DEFAULTSCHEDULE[0]["dur"]*60,
		"anchorTime": nowtime(),
		"running": False,
		"players": players,
		"totalEntries": totalentries,
		"regClosed": False,
		"handForHand": False,
		"bubbleMode": False,
		"playerMode": "linked" if boolval(sessionrow.get("linkuser")) else "manual",
		"lastSyncTime": nowtime()
	}

def readconfig(sessionrow,players,totalentries,readonly=False):
	row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerconfig" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionrow["id"]],SETTING["dbsetting"])
	if not row:
		config=defaultconfig(sessionrow,players,totalentries)
		legacy=legacytimerstate(sessionrow["id"])
		for key in config:
			if key in legacy:
				config[key]=legacy[key]
		if readonly:
			return config
		queryinsert(SETTING["dbname"],"sessiontimerconfig",{
			"sessionid": sessionrow["id"],
			"tournname": config["tournName"],
			"subtitle": config["subtitle"],
			"startingchips": config["startingChips"],
			"buyin": config["buyin"],
			"fee": config["fee"],
			"defaultbreakdur": config["defaultBreakDur"],
			"soundon": config["soundOn"],
			"vibeon": config["vibeOn"],
			"prizepoolmode": config["prizePoolMode"],
			"prizepoolmanual": config["prizePoolManual"],
			"itmmode": config["itmMode"],
			"itmpct": config["itmPct"],
			"itmcount": config["itmCount"],
			"marqueetext": config["marqueeText"],
			"defaulttimebankseconds": intval(config.get("defaultTimebankSeconds"),15),
			"timebanksoundon": boolval(config.get("timebankSoundOn")),
			"autostartbytime": boolval(config.get("autoStartByTime")),
			"otherreward": json.dumps(normalizeotherreward(config.get("otherReward")))
		},SETTING["dbsetting"])
		return config
	row=row[0]
	return {
		"tournName": row["tournname"],
		"subtitle": row["subtitle"],
		"startingChips": intval(row["startingchips"],40000),
		"buyin": intval(sessionrow.get("buyin"),0),
		"fee": intval(sessionrow.get("buyinfee"),0),
		"defaultBreakDur": intval(row["defaultbreakdur"],10),
		"soundOn": boolval(row["soundon"]),
		"vibeOn": boolval(row["vibeon"]),
		"prizePoolMode": row["prizepoolmode"],
		"prizePoolManual": intval(row["prizepoolmanual"],0),
		"prizePoolCarryover": intval(multidaycarryover(sessionrow["id"]),0),
		"guaranteedPrize": intval(sessionrow.get("guaranteedprize"),0),
		"itmMode": row["itmmode"],
		"itmPct": floatval(row["itmpct"],15),
		"itmCount": intval(row["itmcount"],7),
		"marqueeText": row["marqueetext"],
		"defaultTimebankSeconds": intval(row.get("defaulttimebankseconds"),15),
		"timebankSoundOn": boolval(row.get("timebanksoundon")),
		"autoStartByTime": boolval(row.get("autostartbytime")),
		"otherReward": normalizeotherreward(row.get("otherreward"))
	}

def readlevels(sessionid,readonly=False):
	row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerlevel" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionid],SETTING["dbsetting"])
	if not row:
		legacy=legacytimerstate(sessionid)
		if readonly:
			if "schedule" in legacy and isinstance(legacy["schedule"],list) and 0<len(legacy["schedule"]):
				return legacy["schedule"]
			return DEFAULTSCHEDULE
		if "schedule" in legacy and isinstance(legacy["schedule"],list) and 0<len(legacy["schedule"]):
			for i in range(len(legacy["schedule"])):
				item=legacy["schedule"][i]
				queryinsert(SETTING["dbname"],"sessiontimerlevel",{
					"sessionid": sessionid,
					"sortorder": i,
					"type": item.get("type") or "level",
					"smallblind": intval(item.get("sb"),0),
					"bigblind": intval(item.get("bb"),0),
					"ante": intval(item.get("ante"),0),
					"durationminutes": intval(item.get("dur"),20),
					"regcloseafter": boolval(item.get("regCloseAfter"))
				},SETTING["dbsetting"])
			row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerlevel" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionid],SETTING["dbsetting"])
		if row:
			pass
		else:
			tablerow=[]
			if tablerow:
				for i in range(len(tablerow)):
					queryinsert(SETTING["dbname"],"sessiontimerlevel",{
						"sessionid": sessionid,
						"sortorder": i,
						"type": "level",
						"smallblind": intval(tablerow[i].get("smallblind"),0),
						"bigblind": intval(tablerow[i].get("bigblind"),0),
						"ante": intval(tablerow[i].get("bigblindante"),0),
						"durationminutes": 20,
						"regcloseafter": False
					},SETTING["dbsetting"])
			else:
				for i in range(len(DEFAULTSCHEDULE)):
					item=DEFAULTSCHEDULE[i]
					queryinsert(SETTING["dbname"],"sessiontimerlevel",{
						"sessionid": sessionid,
						"sortorder": i,
						"type": item["type"],
						"smallblind": item["sb"] if "sb" in item else 0,
						"bigblind": item["bb"] if "bb" in item else 0,
						"ante": item["ante"] if "ante" in item else 0,
						"durationminutes": item["dur"],
						"regcloseafter": item["regCloseAfter"] if "regCloseAfter" in item else False
					},SETTING["dbsetting"])
			row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerlevel" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionid],SETTING["dbsetting"])
	schedule=[]
	for i in range(len(row or [])):
		item={
			"type": row[i]["type"],
			"dur": intval(row[i]["durationminutes"],20)
		}
		if row[i]["type"]=="level":
			item["sb"]=intval(row[i]["smallblind"],0)
			item["bb"]=intval(row[i]["bigblind"],0)
			item["ante"]=intval(row[i]["ante"],0)
			item["timemode"]=row[i].get("timemode") or "time"
			item["handTargetCount"]=intval(row[i].get("handtargetcount"),0)
			item["handCount"]=intval(row[i].get("handcount"),0)
		if boolval(row[i]["regcloseafter"]):
			item["regCloseAfter"]=True
		try:
			item["chipRaiseValues"]=json.loads(row[i].get("chipraisevalues") or "[]")
		except Exception as error:
			item["chipRaiseValues"]=[]
		schedule.append(item)
	return schedule

def readpayouts(sessionid,readonly=False):
	row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerpayout" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionid],SETTING["dbsetting"])
	if not row:
		legacy=legacytimerstate(sessionid)
		payoutsource=DEFAULTPAYOUTS
		if "payouts" in legacy and isinstance(legacy["payouts"],list) and 0<len(legacy["payouts"]):
			payoutsource=legacy["payouts"]
		if readonly:
			return payoutsource
		for i in range(len(payoutsource)):
			queryinsert(SETTING["dbname"],"sessiontimerpayout",{
				"sessionid": sessionid,
				"sortorder": i,
				"rank": payoutsource[i]["rank"],
				"pct": payoutsource[i]["pct"],
				"cash": floatval(payoutsource[i].get("cash"),0),
				"reward": payoutsource[i].get("reward") or "",
				"color": payoutsource[i]["color"]
			},SETTING["dbsetting"])
		row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerpayout" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionid],SETTING["dbsetting"])
	payouts=[]
	for i in range(len(row or [])):
		payouts.append({
			"rank": row[i]["rank"],
			"pct": floatval(row[i]["pct"],0),
			"cash": floatval(row[i]["cash"],0) if "cash" in row[i] else 0,
			"reward": row[i]["reward"] if "reward" in row[i] else "",
			"color": row[i]["color"]
		})
	return payouts

def readsessionchips(sessionid):
	row=query(SETTING["dbname"],f"""SELECT "shape","value","color","sortorder" FROM "sessionchip" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC,"value" ASC""",[sessionid],SETTING["dbsetting"])
	if row:
		return row
	return [
		{"shape": "circle","value": 100,"color": "#ffffff","sortorder": 1},
		{"shape": "circle","value": 500,"color": "#ef4444","sortorder": 2},
		{"shape": "circle","value": 1000,"color": "#f59e0b","sortorder": 3},
		{"shape": "circle","value": 5000,"color": "#22c55e","sortorder": 4},
		{"shape": "circle","value": 10000,"color": "#3b82f6","sortorder": 5}
	]

def applyautostartbytime(sessionrow,runtime,schedule,autostarted):
	if not autostarted or not schedule:
		return runtime
	if boolval(runtime.get("running")) or boolval(runtime.get("autoStartTriggered")):
		return runtime
	starttime=parsetimervalue(sessionrow.get("starttime"))
	if not starttime:
		return runtime
	now=datetime.datetime.now()
	if now<starttime:
		return runtime
	index=normalizeindex(runtime.get("currentIndex"),schedule)
	runtime["currentIndex"]=index
	runtime["anchorSecondsLeft"]=intval(runtime.get("secondsLeft"),timerseconds(schedule[index]))
	runtime["anchorTime"]=str(sessionrow.get("starttime"))
	runtime["running"]=True
	runtime["autoStartTriggered"]=True
	return runtime

def readruntime(sessionrow,players,totalentries,schedule,autostarted,readonly=False):
	row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimer" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionrow["id"]],SETTING["dbsetting"])
	if not row:
		runtime=defaultstate(sessionrow,not readonly)
		runtime=applyautostartbytime(sessionrow,runtime,schedule,autostarted)
		runtime=advanceruntime(runtime,schedule)
		if readonly:
			return runtime
		queryinsert(SETTING["dbname"],"sessiontimer",{
			"sessionid": sessionrow["id"],
			"state": json.dumps(runtime)
		},SETTING["dbsetting"])
		return runtime
	runtime=normalizetimerstate(row[0]["state"])
	runtime=applyautostartbytime(sessionrow,runtime,schedule,autostarted)
	runtime=advanceruntime(runtime,schedule)
	if boolval(sessionrow.get("linkuser")):
		runtime["players"]=players
		runtime["totalEntries"]=totalentries
		runtime["playerMode"]="linked"
	else:
		runtime["playerMode"]="manual"
		if "players" not in runtime:
			runtime["players"]=players
		if "totalEntries" not in runtime:
			runtime["totalEntries"]=totalentries
	if "lastSyncTime" not in runtime:
		runtime["lastSyncTime"]=str(row[0]["updatetime"])
	if readonly:
		return runtime
	# 回寫推進後的 runtime 改成單一原子條件式 UPDATE: updatetime 變了代表期間有其他寫入, 放棄本次回寫避免蓋掉較新狀態
	query(SETTING["dbname"],f"""UPDATE "sessiontimer" SET "state"=%s::jsonb, "updatetime"=NOW(), "deletetime"=NULL WHERE "sessionid"=%s AND "updatetime"=%s""",[json.dumps(runtime),sessionrow["id"],row[0]["updatetime"]],SETTING["dbsetting"])
	return runtime

def buildtimerstate(sessionid,readonly=False):
	if not readonly:
		ensuretimertables()
	sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if not sessionrow:
		return None
	sessionrow=sessionrow[0]
	if boolval(sessionrow.get("linkuser")):
		if not readonly:
			synctimerplayers(sessionrow)
		counts=linkedcounts(sessionid)
		players=counts[0]
		totalentries=counts[1]
		playerlist=attachknockouts(sessionid,serializetimerplayers(counts[2]))
		averagechiptotal=linkedchiptotal(sessionrow,counts[2])
		totalchipcount=linkedchipgrandtotal(sessionrow,counts[2])
	else:
		players=0
		totalentries=0
		playerlist=[]
		averagechiptotal=0
		totalchipcount=0
	config=readconfig(sessionrow,players,totalentries,readonly)
	schedule=readlevels(sessionid,readonly)
	payouts=readpayouts(sessionid,readonly)
	runtime=readruntime(sessionrow,players,totalentries,schedule,boolval(config.get("autoStartByTime")),readonly)
	if not readonly and boolval(sessionrow.get("linkuser")) and boolval(runtime.get("regClosed")):
		finalizetimerpendingplaces(sessionid)
		counts=linkedcounts(sessionid)
		players=counts[0]
		totalentries=counts[1]
		playerlist=attachknockouts(sessionid,serializetimerplayers(counts[2]))
		averagechiptotal=linkedchiptotal(sessionrow,counts[2])
		totalchipcount=linkedchipgrandtotal(sessionrow,counts[2])
	state={}
	state.update(config)
	state.update(runtime)
	state["schedule"]=schedule
	state["payouts"]=payouts
	state["chips"]=readsessionchips(sessionid)
	state["startTime"]=str(sessionrow.get("starttime") or "")
	state["linkedPlayers"]=playerlist
	state["playerMode"]="linked" if boolval(sessionrow.get("linkuser")) else "manual"
	state["showMultidayRemaining"]=hasmultidayincoming(sessionid)
	state["multidayRemaining"]=multidayremaining(sessionid)
	state["multidayTodayEntries"]=multidaytodayentries(sessionid)
	state["multidaySourceTotalEntries"]=multidaysourcetotalentries(sessionid)
	state["averageStackTotal"]=averagechiptotal
	state["totalChipCount"]=totalchipcount
	# 顯示端品牌設定（檢查表 3.3）；欄位若尚未建立，get 會回 None
	state["brandName"]=sessionrow.get("brandname") or ""
	state["brandColor"]=sessionrow.get("brandcolor") or ""
	state["brandLogo"]=sessionrow.get("brandlogo") or ""
	state["displayFields"]=sessionrow.get("displayfields") or ""
	if boolval(sessionrow.get("linkuser")):
		state["players"]=players
		state["totalEntries"]=totalentries
	return state

def savesplitstate(sessionrow,stateval,stateversion=None):
	# stateversion: 呼叫端讀取合併時 sessiontimer.updatetime 的樂觀鎖版本; None 表示照舊無條件寫入
	# 回傳 True 表示寫入成功, False 表示樂觀鎖衝突 (已被其他控制端搶先寫入), 呼叫端應重讀重算
	ensuretimertables()
	if boolval(sessionrow.get("linkuser")):
		synctimerplayers(sessionrow)
		counts=linkedcounts(sessionrow["id"])
		stateval["players"]=counts[0]
		stateval["totalEntries"]=counts[1]
		stateval["playerMode"]="linked"
	else:
		stateval["playerMode"]="manual"
	# 樂觀鎖版本檢查前移: 先算出 runtime 並搶下 sessiontimer.state 的寫入權, 確認贏了才去重寫
	# config/schedule/payout 三張結構表。之前的順序是結構表先寫再檢查版本, 導致衝突回
	# ERROR_timer_save_conflict 的輸家其實已經把 schedule/payouts/config 寫進 DB, 與保留下來的 state 不一致。
	runtime={
		"currentIndex": intval(stateval.get("currentIndex"),0),
		"secondsLeft": intval(stateval.get("secondsLeft"),0),
		"anchorSecondsLeft": intval(stateval.get("secondsLeft"),0),
		"anchorTime": nowtime(),
		"running": boolval(stateval.get("running")),
		"players": intval(stateval.get("players"),0),
		"totalEntries": intval(stateval.get("totalEntries"),0),
		"regClosed": boolval(stateval.get("regClosed")),
		"regCloseHandled": boolval(stateval.get("regCloseHandled")) or boolval(stateval.get("regClosed")),
		"handForHand": boolval(stateval.get("handForHand")),
		"bubbleMode": boolval(stateval.get("bubbleMode")),
		"playerMode": stateval.get("playerMode") or "manual",
		"autoStartTriggered": boolval(stateval.get("autoStartTriggered")),
		"lastSyncTime": nowtime()
	}
	runtime=saveregclosedbyindex(runtime,stateval.get("schedule") or [])
	timerrow=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimer" WHERE "sessionid"=%s""",[sessionrow["id"]],SETTING["dbsetting"])
	if timerrow:
		if stateversion is None:
			query(SETTING["dbname"],f"""UPDATE "sessiontimer" SET "state"=%s::jsonb, "updatetime"=NOW(), "deletetime"=NULL WHERE "sessionid"=%s""",[json.dumps(runtime),sessionrow["id"]],SETTING["dbsetting"])
		else:
			# 樂觀鎖: SELECT FOR UPDATE 與條件式 UPDATE 放同一交易, updatetime 不符代表已被其他控制端搶先寫入
			result=querytransaction(SETTING["dbname"],[
				[f"""SELECT "id" FROM "sessiontimer" WHERE "sessionid"=%s FOR UPDATE""",[sessionrow["id"]]],
				[f"""UPDATE "sessiontimer" SET "state"=%s::jsonb, "updatetime"=NOW(), "deletetime"=NULL WHERE "sessionid"=%s AND "updatetime"=%s""",[json.dumps(runtime),sessionrow["id"],stateversion]]
			],SETTING["dbsetting"])
			if result is None or intval(result[1],0)<1:
				# 輸家在這裡就退出, 此時尚未動過任何結構表, 呼叫端重讀重算後重試
				return False
	else:
		queryinsert(SETTING["dbname"],"sessiontimer",{
			"sessionid": sessionrow["id"],
			"state": json.dumps(runtime)
		},SETTING["dbsetting"])
	if boolval(sessionrow.get("linkuser")) and boolval(runtime.get("regClosed")):
		finalizetimerpendingplaces(sessionrow["id"])
	configrow=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerconfig" WHERE "sessionid"=%s""",[sessionrow["id"]],SETTING["dbsetting"])
	configdata={
		"tournname": stateval.get("tournName") or sessionrow["name"],
		"subtitle": stateval.get("subtitle") or "",
		"startingchips": intval(stateval.get("startingChips"),40000),
		"buyin": intval(sessionrow.get("buyin"),0),
		"fee": intval(sessionrow.get("buyinfee"),0),
		"defaultbreakdur": intval(stateval.get("defaultBreakDur"),10),
		"soundon": boolval(stateval.get("soundOn")),
		"vibeon": boolval(stateval.get("vibeOn")),
		"prizepoolmode": stateval.get("prizePoolMode") or "auto",
		"prizepoolmanual": intval(stateval.get("prizePoolManual"),0),
		"itmmode": stateval.get("itmMode") or "pct",
		"itmpct": floatval(stateval.get("itmPct"),15),
		"itmcount": intval(stateval.get("itmCount"),7),
		"marqueetext": stateval.get("marqueeText") or "",
		"defaulttimebankseconds": intval(stateval.get("defaultTimebankSeconds"),15),
		"timebanksoundon": boolval(stateval.get("timebankSoundOn")),
		"autostartbytime": boolval(stateval.get("autoStartByTime")),
		"otherreward": json.dumps(normalizeotherreward(stateval.get("otherReward"))),
		"updatetime": nowtime(),
		"deletetime": None
	}
	if configrow:
		queryupdate(SETTING["dbname"],"sessiontimerconfig",configdata,{"sessionid": sessionrow["id"]},SETTING["dbsetting"])
	else:
		configdata["sessionid"]=sessionrow["id"]
		queryinsert(SETTING["dbname"],"sessiontimerconfig",configdata,SETTING["dbsetting"])
	query(SETTING["dbname"],f"""UPDATE "sessiontimerlevel" SET "deletetime"=NOW() WHERE "sessionid"=%s""",[sessionrow["id"]],SETTING["dbsetting"])
	schedule=stateval.get("schedule") or []
	for i in range(len(schedule)):
		item=schedule[i]
		queryinsert(SETTING["dbname"],"sessiontimerlevel",{
			"sessionid": sessionrow["id"],
			"sortorder": i,
			"type": item.get("type") or "level",
			"smallblind": intval(item.get("sb"),0),
			"bigblind": intval(item.get("bb"),0),
			"ante": intval(item.get("ante"),0),
			"durationminutes": intval(item.get("dur"),20),
			"timemode": item.get("timemode") or "time",
			"handtargetcount": intval(item.get("handTargetCount"),0),
			"handcount": intval(item.get("handCount"),0),
			"regcloseafter": boolval(item.get("regCloseAfter")),
			"chipraisevalues": json.dumps((item.get("chipRaiseValues") or [])[:3])
		},SETTING["dbsetting"])
	query(SETTING["dbname"],f"""UPDATE "sessiontimerpayout" SET "deletetime"=NOW() WHERE "sessionid"=%s""",[sessionrow["id"]],SETTING["dbsetting"])
	payouts=stateval.get("payouts") or []
	for i in range(len(payouts)):
		item=payouts[i]
		queryinsert(SETTING["dbname"],"sessiontimerpayout",{
			"sessionid": sessionrow["id"],
			"sortorder": i,
			"rank": item.get("rank") or "",
			"pct": floatval(item.get("pct"),0),
			"cash": floatval(item.get("cash"),0),
			"reward": item.get("reward") or "",
			"color": item.get("color") or "#888"
		},SETTING["dbsetting"])
	return True

try:
	@api_view(["GET"])
	def gettimer(request,sessionid):
		userrow,errresp=gettimerreaduser(request)
		if errresp:
			return errresp
		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]
		if not hastimerreadpermission(sessionrow,userrow):
			return errorresponse("ERROR_no_permission")
		state=buildtimerstate(sessionid,True)
		return Response({
			"success": True,
			"data": {
				"sessionid": sessionid,
				"state": state,
				"updatetime": state.get("lastSyncTime")
			}
		},status.HTTP_200_OK)

	@api_view(["PUT"])
	def savetimer(request,sessionid):
		userrow,errresp=gettimerpermissionuser(request)
		if errresp:
			return errresp
		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]
		if not hastimercontrolpermission(sessionrow,userrow):
			return errorresponse("ERROR_no_permission")
		try:
			data=json.loads(request.body)
		except Exception as error:
			return errorresponse("ERROR_request_data_not_found")
		stateval=data.get("state")
		if stateval is None:
			return errorresponse("ERROR_request_data_not_found")
		action=data.get("action") or ""
		# 結構權限不依賴 client 傳的 action: 這裡先算一次權限結果, 後面再以實際寫入內容判斷
		structureallowed=hastimerstructurepermission(sessionrow,userrow)
		if action=="struct-edit" and not structureallowed:
			return errorresponse("ERROR_no_permission")
		clientstate=normalizetimerstate(stateval)

		# read-modify-write 以 sessiontimer.updatetime 做樂觀鎖: 寫入被其他控制端搶先就整段重讀重算
		saved=False
		for saveattempt in range(3):
			# 判斷是否為局部更新: 如果只包含非時間相關欄位，則先讀完整 state 再合併
			fullstate=buildtimerstate(sessionid)
			if fullstate is None:
				return errorresponse("ERROR_session_not_found")
			versionrow=query(SETTING["dbname"],f"""SELECT "updatetime" FROM "sessiontimer" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
			stateversion=None
			if versionrow:
				stateversion=versionrow[0]["updatetime"]
			originalstructure={}
			for key in STRUCTUREFIELDLIST:
				originalstructure[key]=fullstate.get(key)
			recvfields=set(clientstate.keys())
			fullfields=set(fullstate.keys())

			if action=="toggle":
				fullstate["running"]=boolval(clientstate.get("running"))
				stateval=fullstate
			elif action=="item-change":
				stateval=fullstate
			elif action=="reset":
				oldstartingchips=intval(fullstate.get("startingChips"),intval(sessionrow.get("chip"),40000))
				oldbuyin=intval(fullstate.get("buyin"),intval(sessionrow.get("buyin"),0))
				oldfee=intval(fullstate.get("fee"),intval(sessionrow.get("buyinfee"),0))
				fullstate.update(clientstate)
				fullstate["startingChips"]=oldstartingchips
				fullstate["buyin"]=oldbuyin
				fullstate["fee"]=oldfee
				stateval=fullstate
			elif recvfields!=fullfields:
				# 這是非時間相關的局部更新，需要先讀完整狀態再合併
				fullstate.update(clientstate)
				stateval=fullstate
			else:
				stateval=dict(clientstate)

			# 寫入內容會改到 schedule/payouts/config 這類結構欄位時, 一律要有結構權限, 不看 client 傳的 action
			if not structureallowed:
				for key in STRUCTUREFIELDLIST:
					newvalue=stateval.get(key)
					oldvalue=originalstructure.get(key)
					if key=="schedule":
						newvalue=schedulestructurevalue(newvalue)
						oldvalue=schedulestructurevalue(oldvalue)
					if newvalue!=oldvalue:
						return errorresponse("ERROR_no_permission")

			saved=savesplitstate(sessionrow,stateval,stateversion)
			if saved:
				break
		if not saved:
			return errorresponse("ERROR_timer_save_conflict")
		state=buildtimerstate(sessionid)
		broadcasttimerupdate(sessionid,state)
		return Response({
			"success": True,
			"data": state,
			"action": action
		},status.HTTP_200_OK)

	@api_view(["GET"])
	def gettimerplayers(request,sessionid):
		userrow,errresp=gettimerreaduser(request)
		if errresp:
			return errresp
		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]
		if not hastimerreadpermission(sessionrow,userrow):
			return errorresponse("ERROR_no_permission")
		# 先驗證身分與權限再 ensure, 未授權請求不可觸發 DDL
		ensuretimertables()
		if not boolval(sessionrow.get("linkuser")):
			return Response({"success": True,"data": []},status.HTTP_200_OK)
		synctimerplayers(sessionrow)
		return Response({"success": True,"data": serializetimerplayers(gettimerplayerrows(sessionid))},status.HTTP_200_OK)

	@api_view(["PUT"])
	def edittimerplayer(request,sessionid,timerplayerid):
		userrow,errresp=gettimerpermissionuser(request)
		if errresp:
			return errresp
		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]
		if not hastimercontrolpermission(sessionrow,userrow):
			return errorresponse("ERROR_no_permission")
		try:
			data=json.loads(request.body)
		except Exception as error:
			return errorresponse("ERROR_request_data_not_found")
		action=data.get("action")
		row=query(SETTING["dbname"],f"""SELECT*FROM "sessiontimerplayer" WHERE "id"=%s AND "sessionid"=%s AND "deletetime" IS NULL""",[timerplayerid,sessionid],SETTING["dbsetting"])
		if not row:
			return errorresponse("ERROR_timer_player_not_found")
		row=row[0]
		if action=="eliminate":
			counts=linkedcounts(sessionid)
			place=None
			if timerregclosed(sessionid):
				finalizetimerpendingplaces(sessionid)
				place=counts[0]
			query(SETTING["dbname"],f"""UPDATE "sessiontimerplayer" SET "status"='eliminated',"eliminatedtime"=NOW(),"place"=%s,"updatetime"=NOW() WHERE "id"=%s""",[place,timerplayerid],SETTING["dbsetting"])
			query(SETTING["dbname"],f"""UPDATE "sessionplayer" SET "tableid"=NULL,"seatno"=NULL,"updatetime"=NOW() WHERE "id"=%s""",[row["sessionplayerid"]],SETTING["dbsetting"])
		elif action=="restore":
			query(SETTING["dbname"],f"""UPDATE "sessiontimerplayer" SET "status"='active',"eliminatedtime"=NULL,"place"=NULL,"updatetime"=NOW() WHERE "id"=%s""",[timerplayerid],SETTING["dbsetting"])
		else:
			return errorresponse("ERROR_request_data_not_found")
		state=buildtimerstate(sessionid)
		savesplitstate(sessionrow,state)
		state=buildtimerstate(sessionid)
		broadcasttimerupdate(sessionid,state)
		return Response({"success": True,"data": state},status.HTTP_200_OK)
except Exception as error:
	printcolorhaveline("fail","[ERROR] "+str(error),"")
