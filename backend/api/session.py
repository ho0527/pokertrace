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

					if 4<=int(tokenuserrow[0]["permission"]):
						row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "deletetime" IS NULL ORDER BY "starttime" DESC""",[],SETTING["dbsetting"])
					else:
						row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL ORDER BY "starttime" DESC""",[tokenuserrow[0]["id"]],SETTING["dbsetting"])

					for session in row:
						clubrow=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[session["clubid"]],SETTING["dbsetting"])
						data.append({
							**session,
							"club": clubrow[0] if clubrow else null,
							"clubname": clubrow[0]["name"] if clubrow else "協會被刪除"
						})

					return Response({
						"success": True,
						"data": data
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
						if tokenuserrow[0]["id"]==row["userid"] or 4<=int(tokenuserrow[0]["permission"]):
							clubrow=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[row["clubid"]],SETTING["dbsetting"])

							return Response({
								"success": True,
								"data": {
									**row,
									"club": clubrow[0] if clubrow else null,
									"clubname": clubrow[0]["name"] if clubrow else "協會被刪除"
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
						"rebuycount": "required|integer",
						"rebuybuyin": "required|integer",
						"winprice": "required|integer",
						"winthing": "required|string",
						"chip": "required|integer",
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
						gametypeid=requestdata["data"].get("gametypeid")
						limittypeid=requestdata["data"].get("limittypeid")
						stacktypeid=requestdata["data"].get("stacktypeid")
						eventtypeid=requestdata["data"].get("eventtypeid")

						row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "gametype"=%s""",[gametype],SETTING["dbsetting"])

						queryinsert(SETTING["dbname"],"session",{
							"token": f"{gametype[:2].upper()}{nowtime().split(' ')[0].split('-')[0]}{(str(len(row)+1)).zfill(4)}",
							"userid": tokenuserrow["id"],
							"gametype": gametype,
							"name": name,
							"clubid": clubid,
							"buyin": buyin,
							"rebuycount": rebuycount,
							"rebuybuyin": rebuybuyin,
							"winprice": winprice,
							"chip": chip,
							"winthing": winthing,
							"starttime": starttime,
							"endtime": endtime,
							"description": description,
							"place": place,
							"totalbuyin": totalbuyin,
							"gametypeid": gametypeid,
							"limittypeid": limittypeid,
							"stacktypeid": stacktypeid,
							"eventtypeid": eventtypeid
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

						requestdata=validate(json.loads(request.body),{
							"name": "required|string",
							"clubid": "required|string",
							"buyin": "required|integer",
							"rebuycount": "required|integer",
							"rebuybuyin": "required|integer",
							"winprice": "required|integer",
							"winthing": "required|string",
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
							starttime=requestdata["data"].get("starttime")
							endtime=requestdata["data"].get("endtime")
							description=requestdata["data"].get("description")
							place=requestdata["data"].get("place")
							totalbuyin=requestdata["data"].get("totalbuyin")
							gametypeid=requestdata["data"].get("gametypeid")
							limittypeid=requestdata["data"].get("limittypeid")
							stacktypeid=requestdata["data"].get("stacktypeid")
							eventtypeid=requestdata["data"].get("eventtypeid")

							queryupdate(SETTING["dbname"],"session",{
								"name": name,
								"clubid": clubid,
								"buyin": buyin,
								"rebuycount": rebuycount,
								"rebuybuyin": rebuybuyin,
								"winprice": winprice,
								"chip": chip,
								"winthing": winthing,
								"starttime": starttime,
								"endtime": endtime,
								"description": description,
								"place": place,
								"totalbuyin": totalbuyin,
								"gametypeid": gametypeid,
								"limittypeid": limittypeid,
								"stacktypeid": stacktypeid,
								"eventtypeid": eventtypeid,
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

						row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "gametype"=%s""",[gametype],SETTING["dbsetting"])

						newsessionid=queryinsert(SETTING["dbname"],"session",{
							"token": f"{gametype[:2].upper()}{nowtime().split(' ')[0].split('-')[0]}{(str(len(row)+1)).zfill(4)}",
							"userid": tokenuserrow["id"],
							"gametype": gametype,
							"name": name,
							"clubid": clubid,
							"buyin": buyin,
							"rebuycount": "0",
							"rebuybuyin": rebuybuyin,
							"winprice": "0",
							"chip": chip,
							"winthing": "N/A",
							"starttime": starttime,
							"endtime": endtime,
							"description": description,
							"place": "0",
							"totalbuyin": "0",
							"gametypeid": gametypeid,
							"limittypeid": limittypeid,
							"stacktypeid": stacktypeid,
							"eventtypeid": eventtypeid
						},SETTING["dbsetting"])

						newsessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s""",[newsessionid],SETTING["dbsetting"])[0]

						tablerow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
						tablecount=0

						for table in tablerow:
							queryinsert(SETTING["dbname"],"table",{
								"token": f"TB{newsessionrow["token"]}{(str(tablecount+1)).zfill(2)}",
								"sessionid": newsessionid,
								"name": table["name"],
								"smallblind": table["smallblind"],
								"bigblind": table["bigblind"],
								"bigblindante": table["bigblindante"],
								"ante": table["ante"],
								"chip": table["chip"],
								"starttime": table["starttime"],
								"endtime": table["endtime"]
							},SETTING["dbsetting"])

							tablecount=tablecount+1

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