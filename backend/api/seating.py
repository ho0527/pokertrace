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
	def getseatinglist(request,sessionid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")

		if token:
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
					row=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
					if row:
						row=row[0]
						if tokenuserrow["id"]==row["userid"] or 4<=int(tokenuserrow["permission"]):
							row=query(SETTING["dbname"],f"""SELECT*FROM "seating" WHERE "sessionid"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])

							return Response({
								"success": True,
								"data": row
							},status.HTTP_200_OK)
						else:
							return errorresponse("ERROR_no_permission")
					else:
						return errorresponse("ERROR_session_not_found")
				else:
					return errorresponse("ERROR_token_error")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["GET"])
	def getseating(request,seatingid):
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
					row=query(SETTING["dbname"],f"""SELECT*FROM "seating" WHERE "id"=%s AND "deletetime" IS NULL""",[seatingid],SETTING["dbsetting"])
					if row:
						row=row[0]
						sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])[0]
						if tokenuserrow[0]["id"]==sessionrow["userid"] or 4<=int(tokenuserrow[0]["permission"]):
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
				else:
					return errorresponse("ERROR_user_not_found")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["POST"])
	def newseating(request,tableid,seatno):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")

		if token:
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
					row=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
					if row:
						row=row[0]
						sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
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
									"integer": "ERROR_request_data_type_error"
								})

								if requestdata["error"] is None:
									type=requestdata["data"].get("type")
									name=requestdata["data"].get("name")
									time=requestdata["data"].get("time")
									buyin=requestdata["data"].get("buyin")
									chip=requestdata["data"].get("chip")

									row=query(SETTING["dbname"],f"""INSERT INTO "seating"("tableid","seatno","buyin","time","name","type","chip")VALUES(%s,%s,%s,%s,%s,%s,%s)""",[tableid,seatno,buyin,time,name,type,chip],SETTING["dbsetting"])

									return Response({
										"success": True,
										"data": row
									},status.HTTP_200_OK)
								else:
									return errorresponse(requestdata["error"])
							else:
								return errorresponse("ERROR_no_permission")
						else:
							return errorresponse("ERROR_session_not_found")
					else:
						return errorresponse("ERROR_seating_not_found")
				else:
					return errorresponse("ERROR_token_error")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["PUT"])
	def editseating(request,seatingid):
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
					row=query(SETTING["dbname"],f"""SELECT*FROM "seating" WHERE "id"=%s AND "deletetime" IS NULL""",[seatingid],SETTING["dbsetting"])
					if row:
						row=row[0]
						sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
						if sessionrow:
							sessionrow=sessionrow[0]
							if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
								requestdata=validate(json.loads(request.body),{
									"maxseat": "required|string|in:6,8,9,10",
									"firstdealerplace": "required|string|in:1,2,3,4,5,6,7,8,9,10"
								},{
									"required": "ERROR_request_data_not_found",
									"string": "ERROR_request_data_type_error",
									"in": "ERROR_request_data_type_error"
								})

								if requestdata["error"] is None:
									maxseat=requestdata["data"].get("maxseat")
									firstdealerplace=requestdata["data"].get("firstdealerplace")

									query(SETTING["dbname"],f"""UPDATE "seating" SET "maxseat"=%s,"firstdealerplace"=%s WHERE "id"=%s""",[maxseat,firstdealerplace,seatingid],SETTING["dbsetting"])

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
				else:
					return errorresponse("ERROR_token_error")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["DELETE"])
	def deleteseating(request,seatingid):
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
				else:
					return errorresponse("ERROR_token_error")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")
except Exception as error:
	printcolorhaveline("fail","[ERROR] "+str(error),"")
	Response({
		"success": False,
		"data": "ERROR_unknow_error_pls_tell_the_admin:\n"+str(error)
	},status.HTTP_500_INTERNAL_SERVER_ERROR)