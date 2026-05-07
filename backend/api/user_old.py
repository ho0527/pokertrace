# import
import bcrypt
import hashlib
import json
import random
import re
import threading
# import google.oauth2.id_token
from django.http import HttpResponse,HttpResponseRedirect,JsonResponse
from django.views.decorators.http import require_http_methods
from firebase_admin import auth
from rest_framework import status
from rest_framework.decorators import api_view,renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from django.core.mail import send_mail

# 自創
from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *

# main START

def async_send_mail(*args,**kwargs):
	threading.Thread(target=send_mail,args=args,kwargs=kwargs).start()

try:
	@api_view(["POST"])
	def signin(request):
		try:
			data=json.loads(request.body)
			idtoken=data.get("idtoken")

			# 驗證 Firebase ID Token
			decodedtoken=auth.verify_id_token(idtoken)

			# 取得使用者資訊
			uid=decodedtoken.get("uid")
			email=decodedtoken.get("email")
			name=decodedtoken.get("name")
			picture=decodedtoken.get("picture")

			row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "uid"=%s AND "deletetime" IS NULL""",[uid],SETTING["dbsetting"])

			if not row:
				query(SETTING["dbname"],f"""INSERT INTO "user"("token","uid","name","email","avatarurl","permission","verifytoken","createtime")VALUES(gen_random_uuid(),%s,%s,%s,%s,%s,%s,%s)""",[uid,name,email,picture,"1","0",nowtime()],SETTING["dbsetting"])
				row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "uid"=%s AND "deletetime" IS NULL""",[uid],SETTING["dbsetting"])

			token=randomtext()

			query(SETTING["dbname"],f"""INSERT INTO "token"("userid","token","createtime")VALUES(%s,%s,%s)""",[row[0]["id"],token,nowtime()],SETTING["dbsetting"])

			return Response({
				"success": True,
				"data": {
					"token": token,
					"uid": uid,
					"email": email,
					"name": name,
					"picture": picture
				}
			},status.HTTP_200_OK)
		except Exception as e:
			print(str(e))
			return errorresponse("ERROR_signin_error")

	# @api_view(["POST"])
	# def signin(request):
	# 	data=json.loads(request.body)

	# 	requestdata=validate(data,{
	# 		"username": "required|string",
	# 		"password": "required|string"
	# 	},{
	# 		"required": "ERROR_request_data_not_found",
	# 		"string": "ERROR_request_data_type_error",
	# 	})

	# 	if requestdata["error"] is None:
	# 		username=requestdata["data"].get("username")
	# 		password=requestdata["data"].get("password")

	# 		row=query(SETTING["dbname"],f""f"""SELECT*FROM "user" WHERE "username"=%s AND "verified"=true AND "deletetime" IS NULL""",[username],SETTING["dbsetting"])
	# 		if row:
	# 			if checkpassword(password,row[0]["password"]):
	# 				token=randomtext()
	# 				query(SETTING["dbname"],f"""INSERT INTO "token"("userid","token","createtime")VALUES(%s,%s,%s)""",[row[0]["id"],token,nowtime()],SETTING["dbsetting"])
	# 				# query(SETTING["dbname"],"INSERT INTO "log"("userid","move","movetime")VALUES(%s,%s,%s)",[row[0]["id"],"使用者登入",nowtime()],SETTING["dbsetting"])

	# 				return Response({
	# 					"success": True,
	# 					"data": {
	# 						"token": token,
	# 						"userid": row[0]["id"],
	# 						"permission": row[0]["permission"],
	# 						"name": row[0]["name"]
	# 					}
	# 				},status.HTTP_200_OK)
	# 			else:
	# 				return errorresponse("ERROR_password_error")
	# 		else:
	# 			return errorresponse("ERROR_username_error")
	# 	else:
	# 		return errorresponse(requestdata["error"])

	@api_view(["POST"])
	def signup(request):
		data=json.loads(request.body)

		requestdata=validate(data,{
			"username": "required|string",
			"email": "required|string",
			"name": "required|string",
			"phone": "required|string",
			"password": "required|string"
		},{
			"required": "ERROR_request_data_not_found",
			"string": "ERROR_request_data_type_error",
		})

		if requestdata["error"] is None:
			username=requestdata["data"].get("username")
			email=requestdata["data"].get("email")
			name=requestdata["data"].get("name")
			phone=requestdata["data"].get("phone")
			password=requestdata["data"].get("password")

			row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "email"=%s AND "deletetime" IS NULL""",[email],SETTING["dbsetting"])
			if not row:
				row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "phone"=%s AND "deletetime" IS NULL""",[phone],SETTING["dbsetting"])
				if not row:
					# 產生 email 驗證 token
					verifytoken=randomtext(25)
					# 新增 verified 欄位，預設 False
					query(SETTING["dbname"],f"""INSERT INTO "user"("token","username","password","name","email","phone","permission","verifytoken","createtime")VALUES(gen_random_uuid(),%s,%s,%s,%s,%s,%s,%s,%s)""",[username,hashpassword(password),name,email,phone,"1",verifytoken,nowtime()],SETTING["dbsetting"])

					# 寄送驗證信
					async_send_mail(
						subject="請驗證您的 Email",
						message="請使用支援 HTML 的郵件軟體查看此信件。",
						html_message=f"""
							您好 {name}，<br>
							請點擊以下連結完成 Email 驗證：<br>
							<a href="{BASERUL}emailverify.html?token={verifytoken}">{BASERUL}emailverify.html?token={verifytoken}</a><br>
							皓群商城,<br>
							敬上
						""",
						from_email="chris960527ho@gmail.com",
						recipient_list=[email],
						fail_silently=True
					)

					return Response({
						"success": True,
						"data": ""
					},status.HTTP_200_OK)
				else:
					return errorresponse("ERROR_phone_exist")
			else:
				return errorresponse("ERROR_email_exist")
		else:
			return errorresponse(requestdata["error"])

	@api_view(["GET"])
	def emailverify(request):
		token=request.GET.get("token")
		if not token:
			return Response({
				"success": False,
				"data": "ERROR_request_data_not_found"
			},status.HTTP_400_BAD_REQUEST)

		row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "verifytoken"=%s AND "deletetime" IS NULL""",[token],SETTING["dbsetting"])
		if row:
			user=row[0]
			if not user["verified"]:
				query(SETTING["dbname"],f"""UPDATE "user" SET "verified"=%s WHERE "id"=%s""",[True,user["id"]],SETTING["dbsetting"])
				return Response({
					"success": True,
					"data": ""
				},status.HTTP_200_OK)
			else:
				return Response({
					"success": False,
					"data": "ERROR_user_verified"
				},status.HTTP_400_BAD_REQUEST)
		else:
			return Response({
				"success": False,
				"data": "ERROR_user_not_found"
			},status.HTTP_404_NOT_FOUND)

	@api_view(["POST"])
	def signout(request):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")

		if token:
			row=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if row:
				query(SETTING["dbname"],f"""DELETE FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
				# query(SETTING["dbname"],"INSERT INTO "log"("userid","move","movetime")VALUES(%s,%s,%s)",[row[0][1],"使用者登出",nowtime()],SETTING["dbsetting"])
				return Response({
					"success": True,
					"data": ""
				},status.HTTP_200_OK)
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["GET"])
	def signincheck(request):
		header=request.headers.get("Authorization")

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

		row=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
		if row:
			userrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[row[0][1]])[0,SETTING["dbsetting"]]
			return Response({
				"success": True,
				"data": {
					"userid": userrow[0],
					"permission": userrow[4],
				}
			},status.HTTP_200_OK)
		else:
			return Response({
				"success": True,
				"data": ""
			},status.HTTP_200_OK)

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
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserid=tokenrow[0]["userid"]
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenuserid],SETTING["dbsetting"])
				if 4<=int(tokenuserrow[0]["permission"]):
					data=[]
					row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "deletetime" IS NULL""",SETTING["dbsetting"])

					for i in range(len(row)):
						data.append({
							"id": row[i]["id"],
							"token": row[i]["token"],
							"name": row[i]["name"],
							"username": row[i]["username"],
							"permission": row[i]["permission"],
							"createtime": row[i]["createtime"],
							"updatetime": row[i]["updatetime"]
						})

					return Response({
						"success": True,
						"data": data
					},status.HTTP_200_OK)
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

	@api_view(["GET"])
	def getuser(request):
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
				tokenrow=tokenrow[0]
				row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s AND "deletetime" IS NULL""",[tokenrow["userid"]],SETTING["dbsetting"])
				if row:
					row=row[0]

					# 取得當前時間
					now=datetime.datetime.now()
					today_start=now.replace(hour=0,minute=0,second=0,microsecond=0)
					# 本週的開始(週一)和結束(週日)
					week_start=(now-timedelta(days=now.weekday())).replace(hour=0,minute=0,second=0,microsecond=0)
					week_end=(week_start+timedelta(days=6)).replace(hour=23,minute=59,second=59,microsecond=999999)
					# 本月的開始(1號)和結束(最後一天)
					month_start=now.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
					next_month=month_start+timedelta(days=32)  # 跳到下個月
					month_end=(next_month.replace(day=1)-timedelta(days=1)).replace(hour=23,minute=59,second=59,microsecond=999999)
					# 最近7天（含今天）
					last_seven_days_start=today_start-timedelta(days=6)  # 往前推6天(加上今天共7天)

					# 計算今日盈利
					today_end=today_start.replace(hour=23,minute=59,second=59,microsecond=999999)
					today_sessions=query(SETTING["dbname"],
						"""SELECT winprice, buyin, rebuybuyin, rebuycount
						   FROM session
						   WHERE userid=%s AND deletetime IS NULL
						   AND %s<=starttime AND starttime <= %s""",
						[row["id"],today_start.strftime("%Y-%m-%d %H:%M:%S"),today_end.strftime("%Y-%m-%d %H:%M:%S")],
						SETTING["dbsetting"]
					)

					# 計算各時段的盈利
					today_profit=0
					for s in today_sessions:
						today_profit=today_profit+(s["winprice"]-(s["buyin"]+(s["rebuybuyin"]*s["rebuycount"])))

					# 計算本週盈利 (週一到週日)
					week_sessions=query(SETTING["dbname"],
						"""SELECT winprice, buyin, rebuybuyin, rebuycount
						   FROM session
						   WHERE userid=%s AND deletetime IS NULL
						   AND starttime >= %s AND starttime <= %s""",
						[row["id"],
						 week_start.strftime("%Y-%m-%d %H:%M:%S"),
						 week_end.strftime("%Y-%m-%d %H:%M:%S")],
						SETTING["dbsetting"]
					)
					week_profit=0
					for s in week_sessions:
						week_profit=week_profit+s["winprice"]-(s["buyin"]+(s["rebuybuyin"]*s["rebuycount"]))

					# 計算本月盈利 (1號到月底)
					month_sessions=query(SETTING["dbname"],
						"""SELECT winprice, buyin, rebuybuyin, rebuycount
						   FROM session
						   WHERE userid=%s AND deletetime IS NULL
						   AND starttime >= %s AND starttime <= %s""",
						[row["id"],
						 month_start.strftime("%Y-%m-%d %H:%M:%S"),
						 month_end.strftime("%Y-%m-%d %H:%M:%S")],
						SETTING["dbsetting"]
					)
					month_profit=0
					for s in month_sessions:
						month_profit=month_profit+s["winprice"]-(s["buyin"]+(s["rebuybuyin"]*s["rebuycount"]))

					# 計算最近7天盈利 (含今天)
					last_week_sessions=query(SETTING["dbname"],
						"""SELECT DATE(starttime) as date,
						   winprice, buyin, rebuybuyin, rebuycount
						   FROM session
						   WHERE userid=%s AND deletetime IS NULL
						   AND starttime >= %s AND starttime <= %s
						   ORDER BY starttime ASC""",
						[row["id"],
						 last_seven_days_start.strftime("%Y-%m-%d %H:%M:%S"),
						 today_start.strftime("%Y-%m-%d 23:59:59.999999")],
						SETTING["dbsetting"]
					)

					# 將最近7天數據轉換為陣列 [前6天,前5天,前4天,前3天,前2天,前1天,今天]
					last_week_daily=[0]*7
					for session in last_week_sessions:
						session_date=datetime.datetime.strptime(str(session["date"]),"%Y-%m-%d").date()
						days_ago=(today_start.date()-session_date).days
						if 0 <= days_ago < 7:  # 確保日期在最近7天內
							array_index=6-days_ago  # 反轉索引,使今天在最後
							profit=session["winprice"]-(session["buyin"]+(session["rebuybuyin"]*session["rebuycount"]))
							last_week_daily[array_index] += profit

					return Response({
						"success": True,
						"data": {
							**row,
							"todaytotalprofit": float(today_profit),
							"weektotalprofit": float(week_profit),
							"lastweekprofit": last_week_daily,
							"monthtotalprofit": float(month_profit),
						}
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
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserid=tokenrow[0]["userid"]
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenuserid],SETTING["dbsetting"])
				if 4<=int(tokenuserrow[0]["permission"]):
					data=json.loads(request.body)
					reason=data.get("reason")
					blocktime=data.get("blocktime")
					if reason and blocktime:
						query(SETTING["dbname"],f"""INSERT INTO "blockbanuser"("userid","blockbanuserid","reason","type","time","createtime")VALUES(%s,%s,%s,%s,%s,%s)""",[tokenrow,userid,reason,"block",blocktime,nowtime()],SETTING["dbsetting"])
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
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserid=tokenrow[0]["userid"]
				tokenuserrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenuserid],SETTING["dbsetting"])
				if 4<=int(tokenuserrow[0]["permission"]):
					data=json.loads(request.body)
					reason=data.get("reason")
					if reason:
						query(SETTING["dbname"],f"""INSERT INTO "blockbanuser"("userid","blockbanuserid","reason","type","time","createtime")VALUES(%s,%s,%s,%s,%s,%s)""",[tokenrow,userid,reason,"block","inf",nowtime()],SETTING["dbsetting"])
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
	def edituser(request):
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
				tokenrow=tokenrow[0]
				data=json.loads(request.body)

				requestdata=validate(data,{
					"email": "required|string",
					"name": "required|string",
					"phone": "required|string",
					"birthday": "required|string",
					"address": "required|string"
				},{
					"required": "ERROR_request_data_not_found",
					"string": "ERROR_request_data_type_error",
				})

				if requestdata["error"] is None:
					email=requestdata["data"].get("email")
					name=requestdata["data"].get("name")
					phone=requestdata["data"].get("phone")
					birthday=requestdata["data"].get("birthday")
					address=requestdata["data"].get("address")

					row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow["userid"]],SETTING["dbsetting"])
					if row:
						query(SETTING["dbname"],f"""UPDATE "user" SET "email"=%s,"name"=%s,"phone"=%s,"birthday"=%s,"address"=%s,"updatetime"=%s WHERE "id"=%s""",[email,name,phone,birthday,address,nowtime(),tokenrow["userid"]],SETTING["dbsetting"])

						row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow["userid"]],SETTING["dbsetting"])

						return Response({
							"success": True,
							"data": row[0]
						},status.HTTP_200_OK)
					else:
						return Response({
							"success": False,
							"data": "ERROR_request_data_not_found"
						},status.HTTP_401_UNAUTHORIZED)
				else:
					return errorresponse(requestdata["error"])
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
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				data=json.loads(request.body)
				validateresponse=validate(json.loads(request.body),{
					"permission": "required|string|in:1,2,3,4,5"
				},{
					"required": "ERROR_request_data_not_found",
					"string": "ERROR_request_data_type_error",
					"in": "ERROR_request_data_type_error",
				})


				if validateresponse["success"]:
					row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[userid],SETTING["dbsetting"])
					if row:
						row=row[0]
						if 4<=int(row["permission"]):
							data=validateresponse["data"]
							row=query(SETTING["dbname"],f"""UPDATE "user" SET "permission"=%s,"updatetime"=%s WHERE "id"=%s""",[data["permission"],nowtime(),userid],SETTING["dbsetting"])

							return Response({
								"success": True,
								"data": row
							},status.HTTP_200_OK)
						else:
							return errorresponse("ERROR_no_permission")
					else:
						return errorresponse("ERROR_user_not_found")
				else:
					return errorresponse(validateresponse["error"])
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

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
			tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[userid],SETTING["dbsetting"])
				if row:
					if True:
						query(SETTING["dbname"],f"""UPDATE "user" SET "deletetime"=%s WHERE "id"=%s""",[nowtime(),userid],SETTING["dbsetting"])
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
		"data": "ERROR_unknow_error_pls_tell_the_admin:\n"+str(error)
	},status.HTTP_500_INTERNAL_SERVER_ERROR)