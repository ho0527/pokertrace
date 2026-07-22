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

# main START
@api_view(["GET"])
def gettypelist(request):
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
				gametyperow=query(SETTING["dbname"],f"""SELECT*FROM "gametype" WHERE "deletetime" IS NULL ORDER BY "id" ASC""",[],SETTING["dbsetting"])
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
			else:
				return errorresponse("ERROR_user_not_found")
		else:
			return errorresponse("ERROR_token_error")
	else:
		return errorresponse("ERROR_token_not_found")

@api_view(["GET"])
def gettype(request,typeid):
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
				row=query(SETTING["dbname"],f"""SELECT*FROM "type" WHERE "id"=%s AND "deletetime" IS NULL""",[typeid],SETTING["dbsetting"])
				if row:
					row=row[0]
					if tokenuserrow[0]["id"]==row["userid"] or 4<=int(tokenuserrow[0]["permission"]):
						clubrow=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[row["clubid"]],SETTING["dbsetting"])

						return Response({
							"success": True,
							"data": {
								**row,
								"club": clubrow[0] if clubrow else None,
								"clubname": clubrow[0]["name"] if clubrow else "協會被刪除"
							}
						},status.HTTP_200_OK)
					else:
						return errorresponse("ERROR_no_permission")
				else:
					return errorresponse("ERROR_type_not_found")
			else:
				return errorresponse("ERROR_user_not_found")
		else:
			return errorresponse("ERROR_token_error")
	else:
		return errorresponse("ERROR_token_not_found")

@api_view(["POST"])
def newtype(request):
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
					"buyin": "required|integer|min:0",
					"rebuycount": "required|integer|min:0",
					"rebuybuyin": "required|integer|min:0",
					"winprice": "required|integer|min:0",
					"winthing": "required|string",
					"chip": "required|integer|min:0",
					"starttime": "required|string",
					"endtime": "required|string",
					"place": "required|string",
					"totalbuyin": "required|string",
					"description": "string"
				},{
					"required": "ERROR_request_data_not_found",
					"string": "ERROR_request_data_type_error",
					"integer": "ERROR_request_data_type_error"
				})

				if requestdata["error"] is None:
					gametype=requestdata["data"].get("gametype")
					name=requestdata["data"].get("name")
					clubid=requestdata["data"].get("clubid")
					buyin=requestdata["data"].get("buyin")
					rebuycount=requestdata["data"].get("rebuycount")
					rebuybuyin=requestdata["data"].get("rebuybuyin")
					winprice=requestdata["data"].get("winprice")
					chip=requestdata["data"].get("chip")
					starttime=requestdata["data"].get("starttime")
					endtime=requestdata["data"].get("endtime")
					description=requestdata["data"].get("description")
					place=requestdata["data"].get("place")
					totalbuyin=requestdata["data"].get("totalbuyin")
					winthing=requestdata["data"].get("winthing")

					serialrow=query(SETTING["dbname"],f"""SELECT COALESCE(MAX(CAST(SUBSTRING("token" FROM 7) AS BIGINT)),0)+1 AS serial FROM "type" WHERE "gametype"=%s AND "token"~'^[A-Z]{{2}}[0-9]{{4}}[0-9]+$'""",[gametype],SETTING["dbsetting"])
					# "type" 資料表目前不存在於 schema，query 失敗會回 None；擋下避免直接 500
					if serialrow is None:
						return errorresponse("ERROR_database_error")
					serial=serialrow[0]["serial"]
					# 巢狀同引號 f-string 拆成變數先取值, 避免同引號 f-string 解析問題
					yearpart=nowtime().split(" ")[0].split("-")[0]
					typeprefix=gametype[:2].upper()
					typetoken=f"{typeprefix}{yearpart}{str(serial).zfill(4)}"

					query(SETTING["dbname"],f"""INSERT INTO "type"("token","userid","gametype","name","clubid","buyin","rebuycount","rebuybuyin","winprice","chip","winthing","starttime","endtime","description","place","totalbuyin")VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",[typetoken,tokenuserrow["id"],gametype,name,clubid,buyin,rebuycount,rebuybuyin,winprice,chip,winthing,starttime,endtime,description,place,totalbuyin],SETTING["dbsetting"])

					return Response({
						"success": True,
						"data": ""
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
def edittype(request,typeid):
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
				row=query(SETTING["dbname"],f"""SELECT*FROM "type" WHERE "id"=%s AND "deletetime" IS NULL""",[typeid],SETTING["dbsetting"])
				if row:
					row=row[0]

					if not (tokenuserrow["id"]==row["userid"] or 4<=int(tokenuserrow["permission"])):
						return Response({
							"success": False,
							"data": "ERROR_no_permission"
						},status.HTTP_403_FORBIDDEN)

					requestdata=validate(json.loads(request.body),{
						"name": "required|string",
						"clubid": "required|string",
						"buyin": "required|integer|min:0",
						"rebuycount": "required|integer|min:0",
						"rebuybuyin": "required|integer|min:0",
						"winprice": "required|integer|min:0",
						"winthing": "required|string",
						"chip": "integer",
						"starttime": "required|string",
						"endtime": "required|string",
						"place": "required|string",
						"totalbuyin": "required|string",
						"description": "string"
					},{
						"required": "ERROR_request_data_not_found",
						"string": "ERROR_request_data_type_error",
						"integer": "ERROR_request_data_type_error"
					})

					if requestdata["error"] is None:
						name=requestdata["data"].get("name")
						clubid=requestdata["data"].get("clubid")
						buyin=requestdata["data"].get("buyin")
						rebuycount=requestdata["data"].get("rebuycount")
						winprice=requestdata["data"].get("winprice")
						winthing=requestdata["data"].get("winthing")
						rebuybuyin=requestdata["data"].get("rebuybuyin")
						chip=requestdata["data"].get("chip")
						if chip is None:
							chip=row["chip"]
						starttime=requestdata["data"].get("starttime")
						endtime=requestdata["data"].get("endtime")
						description=requestdata["data"].get("description")
						place=requestdata["data"].get("place")
						totalbuyin=requestdata["data"].get("totalbuyin")

						query(SETTING["dbname"],f"""UPDATE "type" SET "name"=%s,"clubid"=%s,"buyin"=%s,"rebuycount"=%s,"rebuybuyin"=%s,"winprice"=%s,"winthing"=%s,"chip"=%s,"starttime"=%s,"endtime"=%s,"description"=%s,"place"=%s,"totalbuyin"=%s,"updatetime"=%s WHERE "id"=%s""",[name,clubid,buyin,rebuycount,rebuybuyin,winprice,winthing,chip,starttime,endtime,description,place,totalbuyin,nowtime(),typeid],SETTING["dbsetting"])

						return Response({
							"success": True,
							"data": ""
						},status.HTTP_200_OK)
					else:
						return errorresponse(requestdata["error"])
				else:
					return Response({
						"success": False,
						"data": "ERROR_type_not_found"
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

@api_view(["DELETE"])
def deletetype(request,typeid):
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
				row=query(SETTING["dbname"],f"""SELECT*FROM "type" WHERE "id"=%s AND "deletetime" IS NULL""",[typeid],SETTING["dbsetting"])
				if row:
					row=row[0]

					if not (tokenuserrow["id"]==row["userid"] or 4<=int(tokenuserrow["permission"])):
						return Response({
							"success": False,
							"data": "ERROR_no_permission"
						},status.HTTP_403_FORBIDDEN)

					query(SETTING["dbname"],f"""UPDATE "type" SET "deletetime"=NOW() WHERE "id"=%s""",[typeid],SETTING["dbsetting"])

					return Response({
						"success": True,
						"data": ""
					},status.HTTP_200_OK)
				else:
					return Response({
						"success": False,
						"data": "ERROR_type_not_found"
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