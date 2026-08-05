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
@api_view(["GET"])
def getseatinglist(request,tableid):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	tablerow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	if tablerow:
		tablerow=tablerow[0]
		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
		if sessionrow:
			sessionrow=sessionrow[0]
			if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
				row=query(SETTING["dbname"],f"""SELECT*FROM "seating" WHERE "tableid"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])

				return Response({
					"success": True,
					"data": row
				},status.HTTP_200_OK)
			else:
				return errorresponse("ERROR_no_permission")
		else:
			return errorresponse("ERROR_session_not_found")
	else:
		return errorresponse("ERROR_table_not_found")

@api_view(["GET"])
def getseating(request,seatingid):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],f"""SELECT*FROM "seating" WHERE "id"=%s AND "deletetime" IS NULL""",[seatingid],SETTING["dbsetting"])
	if row:
		row=row[0]
		tablerow=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[row["tableid"]],SETTING["dbsetting"])
		if not tablerow:
			return errorresponse("ERROR_table_not_found")
		sessionrowlist=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow[0]["sessionid"]],SETTING["dbsetting"])
		if not sessionrowlist:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrowlist[0]
		if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
			return Response({
				"success": True,
				"data": {
					**sessionrow,
					**row,
					"sessiontoken": sessionrow["token"]
				}
			},status.HTTP_200_OK)
		else:
			return errorresponse("ERROR_no_permission")
	else:
		return errorresponse("ERROR_seating_not_found")

@api_view(["POST"])
def newseating(request,tableid,seatno):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	if row:
		row=row[0]
		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
		if sessionrow:
			sessionrow=sessionrow[0]
			if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
				# 已關閉的桌不再收新的入座記錄 (buyin/rebuy); 離席記錄不擋, 讓既有選手仍可記離開
				if row.get("closedtime"):
					requestbody=json.loads(request.body or "{}")
					if requestbody.get("type")!="leave":
						return errorresponse("ERROR_table_closed")
				requestdata=validate(json.loads(request.body),{
					"type": "required|string|in:buyin,rebuy,leave",
					"name": "required|string",
					"time": "required|string",
					"buyin": "integer",
					"chip": "integer",
				},{
					"required": "ERROR_request_data_not_found",
					"string": "ERROR_request_data_type_error",
					"integer": "ERROR_request_data_type_error"
				})

				if requestdata["error"] is None:
					# seatno 來自 URL，先做整數與範圍檢查（依牌桌／場次 maxseat）
					try:
						seatno=int(seatno)
					except Exception as error:
						return errorresponse("ERROR_request_data_type_error")
					maxseat=int(row.get("maxseat") or sessionrow.get("maxseat") or 9)
					if seatno<1 or maxseat<seatno:
						return errorresponse("ERROR_request_data_type_error")

					type=requestdata["data"].get("type")
					name=requestdata["data"].get("name")
					time=requestdata["data"].get("time")
					buyin=requestdata["data"].get("buyin")
					chip=requestdata["data"].get("chip")
					# live DB: seating.buyin 是 NOT NULL 無 default, 省略時 INSERT NULL 會失敗;
					# buyin 未帶就補 0。chip 欄位可為 NULL, 未帶就維持 NULL。
					if buyin is None:
						buyin=0

					insertrow=query(SETTING["dbname"],f"""INSERT INTO "seating"("tableid","seatno","buyin","time","name","type","chip")VALUES(%s,%s,%s,%s,%s,%s,%s)""",[tableid,seatno,buyin,time,name,type,chip],SETTING["dbsetting"])
					# query 會吞例外回 None; INSERT 失敗時要回 500, 不能假裝 success
					if insertrow is None:
						return errorresponse("ERROR_database_error")

					return Response({
						"success": True,
						"data": insertrow
					},status.HTTP_200_OK)
				else:
					return errorresponse(requestdata["error"])
			else:
				return errorresponse("ERROR_no_permission")
		else:
			return errorresponse("ERROR_session_not_found")
	else:
		return errorresponse("ERROR_seating_not_found")

@api_view(["PUT"])
def editseating(request,seatingid):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],f"""SELECT*FROM "seating" WHERE "id"=%s AND "deletetime" IS NULL""",[seatingid],SETTING["dbsetting"])
	if row:
		row=row[0]
		tablerow=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[row["tableid"]],SETTING["dbsetting"])
		if not tablerow:
			return errorresponse("ERROR_table_not_found")
		tablerow=tablerow[0]
		sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
		if sessionrow:
			sessionrow=sessionrow[0]
			if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
				requestdata=validate(json.loads(request.body),{
					"type": "required|string|in:buyin,rebuy,leave",
					"name": "required|string",
					"time": "required|string",
					"buyin": "integer",
					"chip": "integer",
				},{
					"required": "ERROR_request_data_not_found",
					"string": "ERROR_request_data_type_error",
					"in": "ERROR_request_data_type_error",
					"integer": "ERROR_request_data_type_error"
				})

				if requestdata["error"] is None:
					type=requestdata["data"].get("type")
					name=requestdata["data"].get("name")
					time=requestdata["data"].get("time")
					buyin=requestdata["data"].get("buyin")
					chip=requestdata["data"].get("chip")
					if buyin is None:
						buyin=row["buyin"]
					if chip is None:
						chip=row["chip"]

					query(SETTING["dbname"],"""UPDATE "seating" SET "type"=%s,"name"=%s,"time"=%s,"buyin"=%s,"chip"=%s,"updatetime"=NOW() WHERE "id"=%s""",[type,name,time,buyin,chip,seatingid],SETTING["dbsetting"])

					return Response({
						"success": True,
						"data": ""
					},status.HTTP_200_OK)
				else:
					return errorresponse(requestdata["error"])
			else:
				return errorresponse("ERROR_no_permission")
		else:
			return errorresponse("ERROR_session_not_found")
	else:
		return errorresponse("ERROR_seating_not_found")

@api_view(["DELETE"])
def deleteseating(request,seatingid):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],f"""SELECT*FROM "seating" WHERE "id"=%s AND "deletetime" IS NULL""",[seatingid],SETTING["dbsetting"])
	if row:
		row=row[0]
		tablerow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[row["tableid"]],SETTING["dbsetting"])
		if tablerow:
			tablerow=tablerow[0]
			sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
			if sessionrow:
				sessionrow=sessionrow[0]
				if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
					query(SETTING["dbname"],f"""UPDATE "seating" SET "deletetime"=NOW() WHERE "id"=%s""",[seatingid],SETTING["dbsetting"])

					return Response({
						"success": True,
						"data": ""
					},status.HTTP_200_OK)
				else:
					return errorresponse("ERROR_no_permission")
			else:
				return errorresponse("ERROR_session_not_found")
		else:
			return errorresponse("ERROR_table_not_found")
	else:
		return errorresponse("ERROR_seating_not_found")
