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
from .clubhelper import getuserclublist

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

		row=getuserclublist(tokenuserrow["id"])
		if row is None:
			return errorresponse("ERROR_database_error")

		return Response({
			"success": True,
			"data": row
		},status.HTTP_200_OK,headers={"Cache-Control": "no-store"})

	@api_view(["PUT"])
	def editcluborder(request):
		tokenuserrow,autherror=gettokenuser(request)
		if autherror:
			return autherror

		try:
			data=json.loads(request.body)
		except (ValueError,UnicodeDecodeError):
			return errorresponse("ERROR_request_data_type_error")
		if not isinstance(data,dict):
			return errorresponse("ERROR_request_data_type_error")
		clubidlist=data.get("clubidlist")
		previousidlist=data.get("previousidlist")
		for itemlist in [clubidlist,previousidlist]:
			if not isinstance(itemlist,list) or not itemlist:
				return errorresponse("ERROR_request_data_type_error")
			for item in itemlist:
				if type(item)!=int or item<1 or item>9223372036854775807:
					return errorresponse("ERROR_request_data_type_error")
			if len(set(itemlist))!=len(itemlist):
				return errorresponse("ERROR_request_data_type_error")
		if set(clubidlist)!=set(previousidlist):
			return errorresponse("ERROR_request_data_type_error")
		if getuserclublist(tokenuserrow["id"]) is None:
			return errorresponse("ERROR_database_error")

		# 先取擁有者鎖，再用下一句的新快照核對完整原順序；新增／刪除也取同一把鎖。
		result=querytransaction(SETTING["dbname"],[
			["""SELECT "id" FROM "user" WHERE "id"=%s AND "deletetime" IS NULL FOR UPDATE""",[tokenuserrow["id"]]],
			["""WITH currentlist AS MATERIALIZED (
				SELECT c."id",uc."sortorder" FROM "userclub" uc JOIN "club" c ON c."id"=uc."clubid" AND c."deletetime" IS NULL WHERE uc."userid"=%s
			), updated AS (
				UPDATE "userclub" AS club SET "sortorder"=ordered.position,"updatetime"=%s
				FROM unnest(%s::bigint[]) WITH ORDINALITY AS ordered(id,position)
				WHERE club."clubid"=ordered.id AND club."userid"=%s
				AND (SELECT array_agg("id" ORDER BY "sortorder","id") FROM currentlist)=%s::bigint[]
				AND EXISTS (SELECT 1 FROM "user" WHERE "id"=%s AND "deletetime" IS NULL)
				RETURNING club."clubid",club."sortorder"
			), ownerupdated AS (
                UPDATE "club" c SET "sortorder"=u."sortorder","updatetime"=%s FROM updated u
                WHERE c."id"=u."clubid" AND c."userid"=%s RETURNING c."id"
            ) SELECT * FROM updated """,
				[tokenuserrow["id"],nowtime(),clubidlist,tokenuserrow["id"],previousidlist,tokenuserrow["id"],nowtime(),tokenuserrow["id"]]]
		],SETTING["dbsetting"])
		if result is None:
			return errorresponse("ERROR_database_error")
		if not result[0]:
			return errorresponse("ERROR_no_permission")
		if len(result[1])!=len(clubidlist):
			return Response({"success": False,"data": "ERROR_club_order_conflict"},status.HTTP_409_CONFLICT)
		return Response({"success": True,"data": getuserclublist(tokenuserrow["id"])},status.HTTP_200_OK,headers={"Cache-Control": "no-store"})

	@api_view(["GET"])
	def getclub(request,clubid):
		tokenuserrow,errresp=gettokenuser(request)
		if errresp:
			return errresp

		row=query(SETTING["dbname"],f"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[clubid],SETTING["dbsetting"])
		if row:
			row=row[0]
			member=query(SETTING["dbname"],'SELECT "ps","sortorder" FROM "userclub" WHERE "userid"=%s AND "clubid"=%s',[tokenuserrow["id"],row["id"]],SETTING["dbsetting"],errorredacted=True)
			if tokenuserrow["id"]==row["userid"] or member or 4<=int(tokenuserrow["permission"]):
				row["owned"]=tokenuserrow["id"]==row["userid"]
				if not row["owned"] and member:
					row["ps"]=member[0]["ps"]
					row["sortorder"]=member[0]["sortorder"]
				return Response({
					"success": True,
					"data": row
				},status.HTTP_200_OK,headers={"Cache-Control": "no-store"})
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

			result=querytransaction(SETTING["dbname"],[
				["""SELECT "id" FROM "user" WHERE "id"=%s AND "deletetime" IS NULL FOR UPDATE""",[tokenuserrow["id"]]],
				["""WITH inserted AS (
					INSERT INTO "club"("userid","name","address","ps","sortorder","createtime","updatetime")
					SELECT %s,%s,%s,%s,COALESCE(MAX("sortorder"),0)+1,%s,%s FROM "club"
					WHERE "userid"=%s AND "deletetime" IS NULL
					HAVING EXISTS (SELECT 1 FROM "user" WHERE "id"=%s AND "deletetime" IS NULL)
					RETURNING "id"
				) SELECT "id" FROM inserted""",[tokenuserrow["id"],name,address,ps or "",nowtime(),nowtime(),tokenuserrow["id"],tokenuserrow["id"]]]
			],SETTING["dbsetting"])
			if result is None:
				return errorresponse("ERROR_database_error")
			if not result[0] or not result[1]:
				return errorresponse("ERROR_no_permission")

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

			# 這個地點沒了, 綁在它上面的「只追這個地點」也就沒有意義, 一併軟刪。
			# clubid IS NULL 的「追全部地點」**不動** —— 那是追人不是追地點,
			# 主辦者換個場地繼續辦, 追隨關係應該延續。
			result=querytransaction(SETTING["dbname"],[
				["""SELECT "id" FROM "user" WHERE "id"=%s FOR UPDATE""",[row["userid"]]],
				["""UPDATE "club" SET "deletetime"=%s WHERE "id"=%s AND "deletetime" IS NULL""",[nowtime(),clubid]],
				["""UPDATE "userfollow" SET "deletetime"=%s,"updatetime"=%s WHERE "clubid"=%s AND "deletetime" IS NULL""",[nowtime(),nowtime(),clubid]]
			],SETTING["dbsetting"])
			if result is None:
				return errorresponse("ERROR_database_error")
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


@api_view(["PUT"])
def editclubnote(request,clubid):
    user,autherror=gettokenuser(request)
    if autherror:
        autherror["Cache-Control"]="no-store"
        return autherror
    try:
        data=json.loads(request.body)
    except (ValueError,UnicodeDecodeError):
        return errorresponse("ERROR_request_data_type_error")
    if not isinstance(data,dict) or set(data)!={"ps"} or not isinstance(data["ps"],str) or len(data["ps"])>1000 or "\x00" in data["ps"]:
        return errorresponse("ERROR_request_data_type_error")
    try:
        data["ps"].encode("utf-8")
    except UnicodeEncodeError:
        return errorresponse("ERROR_request_data_type_error")
    if getuserclublist(user["id"]) is None:
        return errorresponse("ERROR_database_error")
    if re.fullmatch(r"[1-9][0-9]{0,18}",str(clubid)) is None or int(clubid)>9223372036854775807:
        return errorresponse("ERROR_request_data_type_error")
    result=querytransaction(SETTING["dbname"],[["""WITH updated AS (
        UPDATE "userclub" SET "ps"=%s,"updatetime"=%s WHERE "userid"=%s AND "clubid"=%s
        AND EXISTS(SELECT 1 FROM "club" WHERE "id"=%s AND "userid"!=%s AND "deletetime" IS NULL) RETURNING "clubid"
        ) SELECT * FROM updated""",[data["ps"],nowtime(),user["id"],clubid,clubid,user["id"]]]],SETTING["dbsetting"],errorredacted=True)
    if result is None:
        return errorresponse("ERROR_database_error")
    if not result[0]:
        return errorresponse("ERROR_no_permission")
    return Response({"success": True,"data": ""},headers={"Cache-Control": "no-store"})
