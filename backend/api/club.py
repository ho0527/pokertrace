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
	def getclublist(request):
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
					row=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "userid"=%s AND "deletetime" IS NULL""",[tokenuserrow[0]["id"]],SETTING["dbsetting"])

					return Response({
						"success": True,
						"data": row
					},status.HTTP_200_OK)
				else:
					return errorresponse("ERROR_user_not_found")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["GET"])
	def getclub(request,clubid):
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
					row=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[clubid],SETTING["dbsetting"])
					if row:
						row=row[0]
						if tokenuserrow[0]["id"]==row["userid"] or 4<=int(tokenuserrow[0]["permission"]):
							return Response({
								"success": True,
								"data": row
							},status.HTTP_200_OK)
						else:
							return errorresponse("ERROR_no_permission")
					else:
						return errorresponse("ERROR_club_not_found")
				else:
					return errorresponse("ERROR_user_not_found")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["POST"])
	def newclub(request):
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
						"name": "required|string",
						"address": "required|string",
						"ps": "string"
					},{
						"required": "ERROR_request_data_not_found",
						"string": "ERROR_request_data_type_error",
						"integer": "ERROR_request_data_type_error"
					})

					if requestdata["error"] is None:
						name=requestdata["data"].get("name")
						address=requestdata["data"].get("address")
						ps=requestdata["data"].get("ps")

						query(SETTING["dbname"],f"""INSERT INTO "club"("userid","name","address","ps")VALUES(%s,%s,%s,%s)""",[tokenuserrow["id"],name,address,ps],SETTING["dbsetting"])

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
	def editclub(request,clubid):
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
					row=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[clubid],SETTING["dbsetting"])
					if row:
						row=row[0]

						requestdata=validate(json.loads(request.body),{
							"name": "required|string",
							"address": "required|string",
							"ps": "string"
						},{
							"required": "ERROR_request_data_not_found",
							"string": "ERROR_request_data_type_error",
							"integer": "ERROR_request_data_type_error"
						})

						if requestdata["error"] is None:
							name=requestdata["data"].get("name")
							address=requestdata["data"].get("address")
							ps=requestdata["data"].get("ps")

							query(SETTING["dbname"],f"""UPDATE "club" SET "name"=%s,"address"=%s,"ps"=%s,"updatetime"=%s WHERE "id"=%s""",[name,address,ps,nowtime(),clubid],SETTING["dbsetting"])

							return Response({
								"success": True,
								"data": ""
							},status.HTTP_200_OK)
						else:
							return errorresponse(requestdata["error"])
					else:
						return Response({
							"success": False,
							"data": "ERROR_club_not_found"
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
	def deleteclub(request,clubid):
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
					row=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[clubid],SETTING["dbsetting"])
					if row:
						row=row[0]

						query(SETTING["dbname"],f"""UPDATE "club" SET "deletetime"=NOW() WHERE "id"=%s""",[clubid],SETTING["dbsetting"])

						return Response({
							"success": True,
							"data": ""
						},status.HTTP_200_OK)
					else:
						return Response({
							"success": False,
							"data": "ERROR_club_not_found"
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