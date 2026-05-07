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
	def getheadlist(request,tableid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")

		if token:
			tokenrow=query(SETTING["dbname"],"SELECT*FROM `token` WHERE `token`=%s",[token],SETTING["dbsetting"])
			if tokenrow:
				data=[]
				userid=tokenrow[0]["userid"]

				rows=query(SETTING["dbname"],"""
					SELECT
						o.id as head_id,
						o.uuid as head_uuid,
						o.totalprice,
						o.status,
						o.payment,
						o.receiver,
						o.address,
						o.createtime,
						o.updatetime,
						CASE
							WHEN COUNT(oi.id) > 0 THEN
								CONCAT('[',
									GROUP_CONCAT(
										DISTINCT JSON_OBJECT(
											'headitem_id',oi.id,
											'count',oi.count,
											'price',oi.price,
											'product',JSON_OBJECT(
												'id',p.id,
												'name',p.name,
												'description',p.description,
												'imageurl',p.imageurl,
												'tag',p.tag
											)
										)
										SEPARATOR ','
									),
								']')
							ELSE '[]'
						END as items_json
					FROM `head` o
					LEFT JOIN `headitem` oi ON o.id=oi.headid
					LEFT JOIN `product` p ON oi.productid=p.id
					WHERE o.userid=%s AND o.deletetime IS NULL
					GROUP BY o.id,o.uuid,o.totalprice,o.status,o.payment,
							o.receiver,o.address,o.createtime,o.updatetime
					head BY o.createtime DESC
				""",[userid],SETTING["dbsetting"])

				for row in rows:
					data.append({
						"id": row["head_id"],
						"uuid": row["head_uuid"],
						"totalprice": float(row["totalprice"]),
						"status": row["status"],
						"payment": row["payment"],
						"receiver": row["receiver"],
						"address": row["address"],
						"createtime": row["createtime"].strftime("%Y-%m-%d %H:%M:%S") if row["createtime"] else None,
						"updatetime": row["updatetime"].strftime("%Y-%m-%d %H:%M:%S") if row["updatetime"] else None,
						"items": json.loads(row["items_json"]) if row["items_json"] else []
					})

				return Response({
					"success": True,
					"data": data
				},status.HTTP_200_OK)
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["GET"])
	def gethead(request,headid):
		row=query(SETTING["dbname"],"SELECT*FROM `head` WHERE `id`=%s AND `deletetime` IS NULL",[headid],SETTING["dbsetting"])
		if row:
			return Response({
				"success": True,
				"data": row[0]
			},status.HTTP_200_OK)
		else:
			return Response({
				"success": False,
				"data": "ERROR_head_not_found"
			},status.HTTP_404_NOT_FOUND)

	@api_view(["POST"])
	def newhead(request,tableid):
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
					tablerow=query(SETTING["dbname"],f"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
					if tablerow:
						tablerow=tablerow[0]
						sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
						if sessionrow:
							sessionrow=sessionrow[0]
							if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
								requestdata=validate(json.loads(request.body),{
									"dealerseat": "required|integer",
									"selfseating": "required|integer",
									"handcard": "required",
									"handcard.card1": "required|string",
									"handcard.card2": "required|string",
									# "showdowndata": "required",
									"boardcard.flop": "array",
									"boardcard.flop.*": "string",
									"boardcard.turn": "string",
									"boardcard.river": "string|nullable",
									"bittingdata": "required",
									"seatinglist": "required|array",
									# "showdowndata": "",
									"winner": "required|array",
									"winnerprice": "required|array",
									"ps": "string",
									"totalpot": "required|integer",
									"positionpot": "required|array"
								},{
									"required": "ERROR_request_data_not_found",
									"string": "ERROR_request_data_type_error",
									"in": "ERROR_request_data_type_error",
									"integer": "ERROR_request_data_type_error",
									"file": "ERROR_request_data_type_error",
									"mimes": "ERROR_request_mimes_type_error",
									"array": "ERROR_request_mimes_type_error",
								})

								if requestdata["error"] is None:
									dealerseat=requestdata["data"].get("dealerseat")
									selfseating=requestdata["data"].get("selfseating")
									handcard=requestdata["data"].get("handcard")
									boardcard=requestdata["data"].get("boardcard")
									bittingdata=requestdata["data"].get("bittingdata")
									seatinglist=requestdata["data"].get("seatinglist")
									showdowndata=requestdata["data"].get("showdowndata")
									winner=requestdata["data"].get("winner")
									winnerprice=requestdata["data"].get("winnerprice")
									ps=requestdata["data"].get("ps")
									totalpot=requestdata["data"].get("totalpot")
									positionpot=requestdata["data"].get("positionpot")

									handrow=query(SETTING["dbname"],f"""SELECT*FROM "hand" WHERE "tableid"=%s""",[tableid],SETTING["dbsetting"])

									row=query(SETTING["dbname"],f"""INSERT INTO "hand"("token","userid","tableid","dealerseat","selfseating","handcard","boardcard","totalpot","ps","createtime")VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",[f"{tablerow["token"]}{(str(len(handrow)+1)).zfill(4)}",tokenuserrow["id"],tableid,dealerseat,selfseating,json.dumps(handcard),json.dumps(boardcard),totalpot,ps,nowtime()],SETTING["dbsetting"])

									for seatno in range(1,len(seatinglist)):
										if seatinglist[seatno]!=False:
											chip=seatinglist[seatno]["chip"]
											handcard=None
											winnered=True if (seatno<len(winner) and winner[seatno] and winner[seatno]==True) else False
											ppot=positionpot[seatno] if seatno<len(positionpot) and (positionpot[seatno] is not None or positionpot[seatno] is not False) else 0
											wpot=winnerprice[seatno] if seatno<len(winnerprice) and (winnerprice[seatno] is not None or winnerprice[seatno] is not False) else 0

											if (seatno in showdowndata) and (showdowndata[seatno]["shown"]==True):
												handcard={
													"card1": showdowndata[seatno]["card1"],
													"card2": showdowndata[seatno]["card2"]
												}

											query(SETTING["dbname"],f"""INSERT INTO "handseating"("handid","seatno","name","chip","handcard","banned","chipchange","endchip","winnered","createtime")VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",[row,seatno,seatinglist[seatno]["name"],chip,json.dumps(handcard),seatinglist[seatno]["banned"] if ("banned" in seatinglist[seatno] and seatinglist[seatno]["banned"]==True) else False,ppot,chip+wpot-ppot if winnered else chip-ppot,winnered,nowtime()],SETTING["dbsetting"])

									for type in bittingdata:
										for actiondata in bittingdata[type]:
											query(SETTING["dbname"],f"""INSERT INTO "handbittingdata"("handid","type","seatno","action","chip","timebank","blinded","bbed","createtime")VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)""",[row,type,actiondata["seat"],actiondata["action"],actiondata["chip"],actiondata["timebank"] if "timebank" in actiondata else 0,actiondata["isBlind"] if "isBlind" in actiondata else False,actiondata["isSB"] if "isSB" in actiondata else False,nowtime()],SETTING["dbsetting"])

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
						return errorresponse("ERROR_table_not_found")
				else:
					return errorresponse("ERROR_token_error")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["PUT"])
	def edithead(request,headid):
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
			tokenrow=query(SETTING["dbname"],"SELECT*FROM `token` WHERE `token`=%s",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],"SELECT*FROM `user` WHERE `id`=%s",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow and 4<=int(tokenuserrow[0]["permission"]):
					row=query(SETTING["dbname"],"SELECT*FROM `head` WHERE `id`=%s AND `deletetime` IS NULL",[headid],SETTING["dbsetting"])
					if row:
						row=row[0]

						requestdata=validate(request,{
							"name": "required|string",
							"tag": "required|string",
							"stock": "required|regex:^[0-9]+$",
							"image": "nullable|file|mimes:jpg,jpeg,png,gif,webp",
							"description": "required|string"
						},{
							"required": "ERROR_request_data_not_found",
							"string": "ERROR_request_data_type_error",
							"integer": "ERROR_request_data_type_error",
							"file": "ERROR_request_data_type_error",
							"mimes": "ERROR_request_mimes_type_error",
						})

						if requestdata["error"] is None:
							name=requestdata["data"].get("name")
							tag=requestdata["data"].get("tag")
							price=requestdata["data"].get("price")
							stock=requestdata["data"].get("stock")
							image=requestdata["data"].get("image") or None
							filename=row["imageurl"]
							description=requestdata["data"].get("description")

							if image!=None:
								fileextension=os.path.splitext(image.name)[1]

								filename=randomtext(30)+fileextension

								uploadfile("./upload/headimage/",image,filename)

							query(SETTING["dbname"],"UPDATE `head` SET `imageurl`=%s,`name`=%s,`description`=%s,`price`=%s,`stock`=%s,`tag`=%s WHERE `id`=%s",[filename,name,description,price,stock,tag,headid],SETTING["dbsetting"])

							return Response({
								"success": True,
								"data": ""
							},status.HTTP_200_OK)
						else:
							return errorresponse(requestdata["error"])
					else:
						return Response({
							"success": False,
							"data": "ERROR_head_not_found"
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
	def deletehead(request,headid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")

		if token:
			tokenrow=query(SETTING["dbname"],"SELECT*FROM `token` WHERE `token`=%s",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],"SELECT*FROM `user` WHERE `id`=%s",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow and 4<=int(tokenuserrow[0]["permission"]):
					row=query(SETTING["dbname"],"SELECT*FROM `head` WHERE `id`=%s",[headid],SETTING["dbsetting"])
					if row:
						query(SETTING["dbname"],"UPDATE `head` SET `deletetime`=%s WHERE `id`=%s",[nowtime(),headid],SETTING["dbsetting"])
						return Response({
							"success": True,
							"data": ""
						},status.HTTP_200_OK)
					else:
						return errorresponse("ERROR_head_not_found")
				else:
					return errorresponse("ERROR_no_permission")
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