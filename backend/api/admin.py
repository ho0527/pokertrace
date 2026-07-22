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
from function.sql import *
from function.thing import *
from .initialize import *

# main START
try:
	@api_view(["GET"])
	def getuserlist(request):
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
				row=query(SETTING["dbname"],"SELECT*FROM `user` WHERE `deletetime` IS NULL",SETTING["dbsetting"])

				return Response({
					"success": True,
					"data": row
				},status.HTTP_200_OK)
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

	@api_view(["GET"])
	def getuser(request,userid):
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
				row=query(SETTING["dbname"],"SELECT*FROM `user` WHERE `id`=%s AND `deletetime` IS NULL",[userid],SETTING["dbsetting"])
				if row:
					row=row[0]

					return Response({
						"success": True,
						"data": row
					},status.HTTP_200_OK)
				else:
					return Response({
						"success": False,
						"data": "ERROR_user_not_found"
					},status.HTTP_404_NOT_FOUND)
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
	def blockuser(request,userid):
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
				tokenuserid=tokenrow[0]["userid"]
				tokenuserrow=query(SETTING["dbname"],"SELECT*FROM `user` WHERE `id`=%s",[tokenuserid],SETTING["dbsetting"])
				if 4<=tokenuserrow[0]["permission"]:
					data=json.loads(request.body)
					reason=data.get("reason")
					blocktime=data.get("blocktime")
					if reason and blocktime:
						query(SETTING["dbname"],"INSERT INTO `blockbanuser`(`userid`,`blockbanuserid`,`reason`,`type`,`time`,`createtime`)VALUES(%s,%s,%s,%s,%s,%s)",[tokenrow,userid,reason,"block",blocktime,nowtime()],SETTING["dbsetting"])
						return Response({
							"success": True,
							"data": ""
						},status.HTTP_200_OK)
					else:
						return Response({
							"success": False,
							"data": "ERROR_request_data_not_found"
						},status.HTTP_400_BAD_REQUEST)
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
	def banuser(request,userid):
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
				tokenuserid=tokenrow[0]["userid"]
				tokenuserrow=query(SETTING["dbname"],"SELECT*FROM `user` WHERE `id`=%s",[tokenuserid],SETTING["dbsetting"])
				if 4<=tokenuserrow[0]["permission"]:
					data=json.loads(request.body)
					reason=data.get("reason")
					if reason:
						query(SETTING["dbname"],"INSERT INTO `blockbanuser`(`userid`,`blockbanuserid`,`reason`,`type`,`time`,`createtime`)VALUES(%s,%s,%s,%s,%s,%s)",[tokenrow,userid,reason,"block","inf",nowtime()],SETTING["dbsetting"])
						return Response({
							"success": True,
							"data": ""
						},status.HTTP_200_OK)
					else:
						return Response({
							"success": False,
							"data": "ERROR_request_data_not_found"
						},status.HTTP_400_BAD_REQUEST)
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
	def edituser(request,userid):
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
				data=json.loads(request.body)
				rootlink=data.get("rootlink")
				title=data.get("title")
				description=data.get("description")
				permission=data.get("permission")
				type=data.get("type")

				if rootlink and title and description and permission and type:
					row=query(SETTING["dbname"],"SELECT*FROM `user` WHERE `id`=%s",[userid],SETTING["dbsetting"])
					if row:
						if True:
							row=query(SETTING["dbname"],"UPDATE `user` SET `rootlink`=%s,`title`=%s,`description`=%s,`permission`=%s,`type`=%s,`updatetime`=%s WHERE `id`=%s",[rootlink,title,description,permission,type,nowtime(),userid],SETTING["dbsetting"])
							return Response({
								"success": True,
								"data": row
							},status.HTTP_200_OK)
						else:
							return Response({
								"success": False,
								"data": "ERROR_no_permission"
							},status.HTTP_403_FORBIDDEN)
					else:
						return Response({
							"success": False,
							"data": "ERROR_request_data_not_found"
						},status.HTTP_401_UNAUTHORIZED)
				else:
					return Response({
						"success": False,
						"data": "ERROR_api_not_found"
					},status.HTTP_400_BAD_REQUEST)
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
	def edituserpermission(request,userid):
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
				data=json.loads(request.body)
				rootlink=data.get("rootlink")
				title=data.get("title")
				description=data.get("description")
				permission=data.get("permission")
				type=data.get("type")

				if rootlink and title and description and permission and type:
					row=query(SETTING["dbname"],"SELECT*FROM `user` WHERE `id`=%s",[userid],SETTING["dbsetting"])
					if row:
						if True:
							row=query(SETTING["dbname"],"UPDATE `user` SET `rootlink`=%s,`title`=%s,`description`=%s,`permission`=%s,`type`=%s,`updatetime`=%s WHERE `id`=%s",[rootlink,title,description,permission,type,nowtime(),userid],SETTING["dbsetting"])
							return Response({
								"success": True,
								"data": row
							},status.HTTP_200_OK)
						else:
							return Response({
								"success": False,
								"data": "ERROR_no_permission"
							},status.HTTP_403_FORBIDDEN)
					else:
						return Response({
							"success": False,
							"data": "ERROR_request_data_not_found"
						},status.HTTP_401_UNAUTHORIZED)
				else:
					return Response({
						"success": False,
						"data": "ERROR_api_not_found"
					},status.HTTP_400_BAD_REQUEST)
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
	def deleteuser(request,userid):
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
				row=query(SETTING["dbname"],"SELECT*FROM `user` WHERE `id`=%s",[userid],SETTING["dbsetting"])
				if row:
					if True:
						query(SETTING["dbname"],"UPDATE `user` SET `deletetime`=%s WHERE `id`=%s",[nowtime(),userid],SETTING["dbsetting"])
						return Response({
							"success": True,
							"data": ""
						},status.HTTP_200_OK)
					else:
						return Response({
							"success": False,
							"data": "ERROR_no_permission"
						},status.HTTP_403_FORBIDDEN)
				else:
					return Response({
						"success": False,
						"data": "ERROR_api_not_found"
					},status.HTTP_400_BAD_REQUEST)
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
		"data": "ERROR_unknow_error_pls_tell_the_admin"
	},status.HTTP_500_INTERNAL_SERVER_ERROR)