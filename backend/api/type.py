# import
import bcrypt
import hashlib
import json
import random
import re
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
from .authhelper import gettokenuser as commonauthuser

# main START
gametypesettingensured=False

def ensuregametypesetting():
	global gametypesettingensured
	if not gametypesettingensured:
		query(SETTING["dbname"],"""ALTER TABLE public.gametype ADD COLUMN IF NOT EXISTS flowjson text NOT NULL DEFAULT '[]'""",[],SETTING["dbsetting"])
		query(SETTING["dbname"],"""ALTER TABLE public.gametype ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true""",[],SETTING["dbsetting"])
		query(SETTING["dbname"],"""WITH inserted AS (
INSERT INTO public.gametype(id,name,code,description,flowjson,enabled)
SELECT 999,'Other','ZZ','其他','[]',true
WHERE NOT EXISTS(SELECT 1 FROM public.gametype WHERE code='ZZ')
RETURNING id
)
SELECT COALESCE((SELECT COUNT(*) FROM inserted),0) AS inserted""",[],SETTING["dbsetting"])
		gametypesettingensured=True

def superadminerror(tokenuserrow):
	if not (5<=int(tokenuserrow.get("permission") or 0)):
		return errorresponse("ERROR_no_permission")
	return None

def gametypeflowitem(kind,title,detail="",cardcount=0,actionfrom="",condition=""):
	return {
		"kind": kind,
		"title": title,
		"detail": detail,
		"cardcount": cardcount,
		"actionfrom": actionfrom,
		"condition": condition
	}

def gametypedefaultflow(code):
	code=str(code or "").upper()
	flowlist=[]
	if code=="HE":
		flowlist=[
			gametypeflowitem("deal","發手牌","每位選手先拿 2 張暗牌。",2),
			gametypeflowitem("blind","下盲注","小盲、大盲依按鈕位置投入。",0,"盲注位置"),
			gametypeflowitem("ante","下前注","若結構有 ante 或 BB ante，於翻前收齊。"),
			gametypeflowitem("bet","翻前下注","由槍口開始第一輪下注。",0,"槍口","所有未棄牌選手跟注或加注結束。"),
			gametypeflowitem("board","翻牌","開 3 張公共牌。",3),
			gametypeflowitem("bet","翻牌圈下注","由小盲側第一位仍在牌局中的選手開始。",0,"小盲側"),
			gametypeflowitem("board","轉牌","開第 4 張公共牌。",1),
			gametypeflowitem("bet","轉牌圈下注","仍在牌局中的選手下注。",0,"小盲側"),
			gametypeflowitem("board","河牌","開第 5 張公共牌。",1),
			gametypeflowitem("bet","河牌圈下注","完成最後一輪下注。",0,"小盲側"),
			gametypeflowitem("showdown","攤牌","剩餘選手用最佳 5 張高牌比牌。"),
			gametypeflowitem("win","獲得底池","只剩一名選手未棄牌時直接獲得所有底池；多人攤牌則依牌型與底池資格分配。")
		]
	elif code=="OM" or code=="O5" or code=="O8" or code=="BO":
		cardcount=4
		if code=="O5" or code=="BO":
			cardcount=5
		flowlist=gametypedefaultflow("HE")
		flowlist[0]=gametypeflowitem("deal","發手牌","每位選手先拿 "+str(cardcount)+" 張暗牌。",cardcount)
		flowlist[10]=gametypeflowitem("showdown","攤牌","必須剛好用 2 張手牌與 3 張公共牌組牌。高低玩法分別判定高牌與合格低牌。")
	elif code=="SD":
		flowlist=gametypedefaultflow("HE")
		flowlist.insert(0,gametypeflowitem("rule","短牌牌組","移除 2 到 5，只使用 A、K、Q、J、T、9、8、7、6。"))
	elif code=="SH" or code=="CP":
		flowlist=gametypedefaultflow("HE")
		flowlist[0]=gametypeflowitem("deal","發手牌","每位選手先拿 3 張暗牌。",3)
		if code=="CP":
			flowlist.insert(5,gametypeflowitem("discard","棄一張手牌","翻牌圈下注後，每位仍在牌局中的選手棄掉 1 張手牌。",1))
	elif code=="ST" or code=="RA" or code=="S8":
		flowlist=[
			gametypeflowitem("ante","下前注","所有選手先投入 ante。"),
			gametypeflowitem("deal","三街","每位選手發 2 張暗牌與 1 張明牌。",3),
			gametypeflowitem("bet","三街下注","依明牌規則決定 bring-in 與行動順序。",0,"明牌規則"),
			gametypeflowitem("deal","四街","每位未棄牌選手再發 1 張明牌。",1),
			gametypeflowitem("bet","四街下注","依牌面強弱決定先行動者。",0,"牌面"),
			gametypeflowitem("deal","五街","每位未棄牌選手再發 1 張明牌。",1),
			gametypeflowitem("bet","五街下注","完成五街下注。",0,"牌面"),
			gametypeflowitem("deal","六街","每位未棄牌選手再發 1 張明牌。",1),
			gametypeflowitem("bet","六街下注","完成六街下注。",0,"牌面"),
			gametypeflowitem("deal","七街","每位未棄牌選手發最後 1 張暗牌。",1),
			gametypeflowitem("bet","七街下注","完成最後一輪下注。",0,"牌面"),
			gametypeflowitem("showdown","攤牌","從自己的 7 張牌選最佳 5 張；Razz 比 A-5 低牌，Hi-Lo 另分低牌半池。"),
			gametypeflowitem("win","獲得底池","只剩一名選手未棄牌時直接獲得底池；攤牌依高牌、低牌或分池規則判定。")
		]
	elif code=="BU":
		flowlist=[
			gametypeflowitem("blind","下盲注","依按鈕位置投入盲注。"),
			gametypeflowitem("deal","發手牌","每位選手發 4 張暗牌。",4),
			gametypeflowitem("bet","第一次下注","完成換牌前下注。",0,"大盲左側"),
			gametypeflowitem("draw","第一次換牌","可棄掉 0 到 4 張並補牌；不換牌為 stand pat。"),
			gametypeflowitem("bet","第二次下注","完成第二輪下注。"),
			gametypeflowitem("draw","第二次換牌","再次換牌或 stand pat。"),
			gametypeflowitem("bet","第三次下注","完成第三輪下注。"),
			gametypeflowitem("draw","第三次換牌","最後一次換牌或 stand pat。"),
			gametypeflowitem("bet","最後下注","完成最後一輪下注。"),
			gametypeflowitem("showdown","攤牌","比最佳 Badugi：不同花色、不同點數的低牌組合。"),
			gametypeflowitem("win","獲得底池","最佳 Badugi 或最佳低張組合獲得底池。")
		]
	elif code=="AS" or code=="AD" or code=="AT" or code=="DS" or code=="DD" or code=="DT":
		drawcount=1
		if code=="AD" or code=="DD":
			drawcount=2
		if code=="AT" or code=="DT":
			drawcount=3
		lowrule="A-5 低牌"
		if code=="DS" or code=="DD" or code=="DT":
			lowrule="2-7 低牌"
		flowlist=[
			gametypeflowitem("blind","下盲注","依按鈕位置投入盲注。"),
			gametypeflowitem("deal","發手牌","每位選手發 5 張暗牌。",5),
			gametypeflowitem("bet","換牌前下注","完成第一輪下注。",0,"大盲左側")
		]
		for i in range(drawcount):
			flowlist.append(gametypeflowitem("draw","第 "+str(i+1)+" 次換牌","可棄掉部分手牌並補新牌；不換牌為 stand pat。"))
			flowlist.append(gametypeflowitem("bet","第 "+str(i+1)+" 次換牌下注","完成第 "+str(i+1)+" 次換牌後下注。"))
		flowlist.append(gametypeflowitem("showdown","攤牌","依 "+lowrule+" 判定最低 5 張牌。"))
		flowlist.append(gametypeflowitem("win","獲得底池","最佳低牌獲得底池。"))
	elif code=="DM":
		flowlist=[
			gametypeflowitem("blind","下盲注","依按鈕位置投入盲注。"),
			gametypeflowitem("deal","發手牌","每位選手發 5 張暗牌。",5),
			gametypeflowitem("bet","換牌前下注","完成第一輪下注。"),
			gametypeflowitem("draw","換牌","可棄掉部分手牌並補新牌。"),
			gametypeflowitem("board","翻牌","開 3 張公共牌。",3),
			gametypeflowitem("bet","翻牌圈下注","完成翻牌圈下注。"),
			gametypeflowitem("board","轉牌","開第 4 張公共牌。",1),
			gametypeflowitem("bet","轉牌圈下注","完成轉牌圈下注。"),
			gametypeflowitem("board","河牌","開第 5 張公共牌。",1),
			gametypeflowitem("bet","河牌圈下注","完成最後一輪下注。"),
			gametypeflowitem("showdown","攤牌","通常一半比 Omaha 高牌，一半比 2-7 抽牌低牌。"),
			gametypeflowitem("win","分配底池","依公告的兩半規則分配底池。")
		]
	else:
		flowlist=[
			gametypeflowitem("rule","自訂玩法","請設定發牌、下注、換牌或公共牌流程。"),
			gametypeflowitem("win","勝負判定","請設定獲得底池或分池方式。")
		]
	return flowlist

def gametypeflowvalue(row):
	value=row.get("flowjson") or "[]"
	try:
		flow=json.loads(value)
	except Exception:
		flow=[]
	if not isinstance(flow,list) or len(flow)<1:
		flow=gametypedefaultflow(row.get("code"))
	return flow

def cleangametypeflow(value):
	output=[]
	if isinstance(value,list):
		for item in value:
			if isinstance(item,dict):
				output.append({
					"kind": str(item.get("kind") or "rule")[:30],
					"title": str(item.get("title") or "")[:80],
					"detail": str(item.get("detail") or "")[:500],
					"cardcount": 0,
					"actionfrom": str(item.get("actionfrom") or "")[:80],
					"condition": str(item.get("condition") or "")[:160]
				})
				try:
					output[-1]["cardcount"]=int(item.get("cardcount") or 0)
				except Exception:
					output[-1]["cardcount"]=0
	if len(output)<1:
		output=gametypedefaultflow("")
	return output

#
# 這個檔案原本還有 gettype / newtype / edittype / deletetype 四支端點，
# 它們操作一張叫 "type" 的資料表。**那張表不存在，而且從來沒有存在過**
# （git 歷史裡 dbinitialize.py 沒有任何 CREATE TABLE type）。
# 因為 function/sql.py 的 query() 吞掉例外回 None，那四支的失敗一直被
# 當成「查不到」回 404，看起來像正常的找不到資料。
#
# 2026-08-06（TASK-104）查清方向後移除，備份 type_old_t1.py：
# 把 newtype 的 INSERT 欄位（token / userid / gametype / name / clubid / buyin /
# rebuycount / rebuybuyin / winprice / chip / winthing / starttime / endtime /
# description / place / totalbuyin）拿去比 session 表 —— **16 個全部都在**。
# 也就是 "type" 就是後來的 "session"，那四支是 session.py 的前身殘骸。
# 依 AGENTS.md 的慣例：沒被使用的殘渣該刪，不該接回去。
#
# **留下來的 gettypelist 是好的**，它讀的是 gametype / limittype / stacktype /
# eventtype 四張真實存在的表，與 "type" 無關，batchcreate / newedithand /
# newsession / session / sessionlist 五個頁面都在用。
@api_view(["GET"])
def gettypelist(request):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	ensuregametypesetting()
	gametyperow=query(SETTING["dbname"],"""SELECT*FROM "gametype" WHERE "deletetime" IS NULL AND "enabled"=true ORDER BY "id" ASC""",[],SETTING["dbsetting"])
	limittyperow=query(SETTING["dbname"],f"""SELECT*FROM "limittype" WHERE "deletetime" IS NULL ORDER BY "id" ASC""",[],SETTING["dbsetting"])
	stacktyperow=query(SETTING["dbname"],f"""SELECT*FROM "stacktype" WHERE "deletetime" IS NULL ORDER BY "id" ASC""",[],SETTING["dbsetting"])
	eventtyperow=query(SETTING["dbname"],f"""SELECT*FROM "eventtype" WHERE "deletetime" IS NULL ORDER BY "id" ASC""",[],SETTING["dbsetting"])

	return Response({
		"success": True,
		"data": {
			"game": gametyperow,
			"limit": limittyperow,
			"stack": stacktyperow,
			"event": eventtyperow
		}
	},status.HTTP_200_OK)

@api_view(["GET"])
def getgametypesettinglist(request):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror
	permissionerror=superadminerror(tokenuserrow)
	if permissionerror:
		return permissionerror

	ensuregametypesetting()
	row=query(SETTING["dbname"],"""SELECT*FROM "gametype" WHERE "deletetime" IS NULL ORDER BY CASE WHEN "code"='ZZ' THEN 999 ELSE "id" END ASC""",[],SETTING["dbsetting"]) or []
	for item in row:
		item["flow"]=gametypeflowvalue(item)
	return Response({
		"success": True,
		"data": row
	},status.HTTP_200_OK)

@api_view(["POST"])
def savegametypesetting(request):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror
	permissionerror=superadminerror(tokenuserrow)
	if permissionerror:
		return permissionerror

	ensuregametypesetting()
	data=json.loads(request.body or "{}")
	rowid=str(data.get("id") or "").strip()
	code=str(data.get("code") or "").strip().upper()
	name=str(data.get("name") or "").strip()
	description=str(data.get("description") or "").strip()
	enabled=True
	if data.get("enabled")==False or data.get("enabled")=="false" or data.get("enabled")=="0":
		enabled=False
	if code=="ZZ":
		enabled=True
		name=name or "Other"
	if not re.match(r"^[A-Z0-9]{1,20}$",code):
		return errorresponse("ERROR_invalid_gametype_code")
	if name=="":
		return errorresponse("ERROR_request_data_not_found")
	flow=cleangametypeflow(data.get("flow"))
	flowjson=json.dumps(flow,ensure_ascii=False)
	now=nowtime()
	if rowid:
		conflict=query(SETTING["dbname"],"""SELECT*FROM "gametype" WHERE "code"=%s AND "id"<>%s AND "deletetime" IS NULL""",[code,rowid],SETTING["dbsetting"]) or []
		if len(conflict)>0:
			return errorresponse("ERROR_duplicate_gametype_code")
		before=query(SETTING["dbname"],"""SELECT*FROM "gametype" WHERE "id"=%s AND "deletetime" IS NULL""",[rowid],SETTING["dbsetting"]) or []
		if len(before)<1:
			return errorresponse("ERROR_type_not_found")
		query(SETTING["dbname"],"""UPDATE "gametype" SET "name"=%s,"code"=%s,"description"=%s,"flowjson"=%s,"enabled"=%s,"updatetime"=%s WHERE "id"=%s""",[name,code,description,flowjson,enabled,now,rowid],SETTING["dbsetting"])
		writeauditlog(SETTING["dbname"],SETTING["dbsetting"],tokenuserrow["id"],"gametype","edit",rowid,{"code": before[0].get("code"),"name": before[0].get("name")},{"code": code,"name": name},request)
	else:
		existing=query(SETTING["dbname"],"""SELECT*FROM "gametype" WHERE "code"=%s AND "deletetime" IS NULL""",[code],SETTING["dbsetting"]) or []
		if len(existing)>0:
			return errorresponse("ERROR_duplicate_gametype_code")
		idrow=query(SETTING["dbname"],"""SELECT COALESCE(MAX("id") FILTER (WHERE "id"<900),0)+1 AS "id" FROM "gametype" """,[],SETTING["dbsetting"]) or [{"id": 1}]
		newid=idrow[0]["id"]
		result=query(SETTING["dbname"],"""WITH inserted AS (
INSERT INTO "gametype"("id","name","code","description","flowjson","enabled","createtime","updatetime")
VALUES(%s,%s,%s,%s,%s,%s,%s,%s)
RETURNING "id"
)
SELECT "id" FROM inserted""",[newid,name,code,description,flowjson,enabled,now,now],SETTING["dbsetting"])
		rowid=newid
		if result:
			rowid=result[0]["id"]
		writeauditlog(SETTING["dbname"],SETTING["dbsetting"],tokenuserrow["id"],"gametype","new",rowid,None,{"code": code,"name": name},request)
	return Response({
		"success": True,
		"data": {
			"id": rowid
		}
	},status.HTTP_200_OK)

@api_view(["POST"])
def deletegametypesetting(request,gametypeid):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror
	permissionerror=superadminerror(tokenuserrow)
	if permissionerror:
		return permissionerror

	ensuregametypesetting()
	row=query(SETTING["dbname"],"""SELECT*FROM "gametype" WHERE "id"=%s AND "deletetime" IS NULL""",[gametypeid],SETTING["dbsetting"]) or []
	if len(row)<1:
		return errorresponse("ERROR_type_not_found")
	if row[0].get("code")=="ZZ":
		return errorresponse("ERROR_zz_required")
	result=query(SETTING["dbname"],"""UPDATE "gametype" SET "deletetime"=%s,"updatetime"=%s WHERE "id"=%s""",[nowtime(),nowtime(),gametypeid],SETTING["dbsetting"])
	writeauditlog(SETTING["dbname"],SETTING["dbsetting"],tokenuserrow["id"],"gametype","delete",gametypeid,{"code": row[0].get("code"),"name": row[0].get("name")},None,request)
	return Response({
		"success": True,
		"data": result
	},status.HTTP_200_OK)
