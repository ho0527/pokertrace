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
from .authhelper import gettokenuser

# main START
try:
	# 五個端點原本各自 inline 驗 token，查 "user" 時都少了 deletetime IS NULL，
	# 加上 user.py 軟刪除使用者時不刪 token 列，導致被停權者的舊 token 在此仍然有效。
	# 一律改用 authhelper.gettokenuser (它有 deletetime IS NULL)，讓檢查一致。
	# newclub / editclub / deleteclub 原本查不到 user row 時回的是 403 ERROR_no_permission，
	# 而不是 getclublist / getclub 的 404 ERROR_user_not_found；helper 只會給後者，
	# 所以這三個寫入端點用下面的 wrapper 把 user 找不到的 case 轉回原本的回應，錯誤碼與狀態碼維持不變。
	def _gettokenuserforwrite(request):
		tokenuserrow,errresp=gettokenuser(request)
		if errresp and errresp.data["data"]=="ERROR_user_not_found":
			errresp=Response({
				"success": False,
				"data": "ERROR_no_permission"
			},status.HTTP_403_FORBIDDEN)
		return (tokenuserrow,errresp)

	@api_view(["GET"])
	def getclublist(request):
		tokenuserrow,errresp=gettokenuser(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "userid"=%s AND "deletetime" IS NULL""",[tokenuserrow["id"]],SETTING["dbsetting"])

		return Response({
			"success": True,
			"data": row
		},status.HTTP_200_OK)

	@api_view(["GET"])
	def getclub(request,clubid):
		tokenuserrow,errresp=gettokenuser(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[clubid],SETTING["dbsetting"])
		if row:
			row=row[0]
			if tokenuserrow["id"]==row["userid"] or 4<=int(tokenuserrow["permission"]):
				return Response({
					"success": True,
					"data": row
				},status.HTTP_200_OK)
			else:
				return errorresponse("ERROR_no_permission")
		else:
			return errorresponse("ERROR_club_not_found")

	@api_view(["POST"])
	def newclub(request):
		tokenuserrow,errresp=_gettokenuserforwrite(request)
		if errresp:
			return errresp

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

	@api_view(["PUT"])
	def editclub(request,clubid):
		tokenuserrow,errresp=_gettokenuserforwrite(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[clubid],SETTING["dbsetting"])
		if row:
			row=row[0]

			if not (tokenuserrow["id"]==row["userid"] or 4<=int(tokenuserrow["permission"])):
				return Response({
					"success": False,
					"data": "ERROR_no_permission"
				},status.HTTP_403_FORBIDDEN)

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

	@api_view(["DELETE"])
	def deleteclub(request,clubid):
		tokenuserrow,errresp=_gettokenuserforwrite(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[clubid],SETTING["dbsetting"])
		if row:
			row=row[0]

			if not (tokenuserrow["id"]==row["userid"] or 4<=int(tokenuserrow["permission"])):
				return Response({
					"success": False,
					"data": "ERROR_no_permission"
				},status.HTTP_403_FORBIDDEN)

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
except Exception as error:
	printcolorhaveline("fail","[ERROR] "+str(error),"")
	Response({
		"success": False,
		"data": "ERROR_unknow_error_pls_tell_the_admin"
	},status.HTTP_500_INTERNAL_SERVER_ERROR)