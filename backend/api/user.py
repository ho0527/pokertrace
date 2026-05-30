# import
import bcrypt
import hashlib
import json
import random
import re
import threading
# Google Identity Services (取代 firebase_admin.auth, 解決跨域 storage 問題)
from decimal import Decimal
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from django.http import HttpResponse,HttpResponseRedirect,JsonResponse
from django.views.decorators.http import require_http_methods
# from firebase_admin import auth  # 已停用, 改 GIS
from rest_framework import status
from rest_framework.decorators import api_view,renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from django.core.mail import send_mail

# Google OAuth Web Client ID (跟 frontend signin.js 的 client_id 必須一致)
GOOGLE_CLIENT_ID="676058961600-uo2cec3c18kiuipfci2tet1l67c8dmbl.apps.googleusercontent.com"
GOOGLE_CLOCK_SKEW_SECONDS=30

# 自創
from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *
from .sessionplayer import _attachfinance

# main START

def async_send_mail(*args,**kwargs):
	threading.Thread(target=send_mail,args=args,kwargs=kwargs).start()

def defaultchipcolors():
	return [
		{"name": "白色","color": "#ffffff"},
		{"name": "紅色","color": "#ff0000"},
		{"name": "藍色","color": "#0000ff"},
		{"name": "綠色","color": "#008000"},
		{"name": "黑色","color": "#000000"},
		{"name": "黃色","color": "#ffff00"},
		{"name": "橘色","color": "#ffa500"},
		{"name": "紫色","color": "#800080"},
		{"name": "粉紅色","color": "#ffc0cb"},
		{"name": "灰色","color": "#808080"}
	]

def parsechipcolors(value):
	try:
		row=json.loads(value or "[]")
		if isinstance(row,list) and len(row)>0:
			return row
	except Exception as error:
		pass
	return defaultchipcolors()

try:
	@api_view(["POST"])
	def signin(request):
		try:
			data=json.loads(request.body)
			idtoken=data.get("idtoken")

			# 驗證 Google ID Token (GIS), 返回 decoded payload
			decodedtoken=id_token.verify_oauth2_token(
				idtoken,
				grequests.Request(),
				GOOGLE_CLIENT_ID,
				clock_skew_in_seconds=GOOGLE_CLOCK_SKEW_SECONDS
			)

			# Google id_token 的欄位:
			#   sub      = Google 帳號的 unique user id (對應原本 Firebase 的 uid)
			#   email    = 信箱
			#   name     = 顯示名稱
			#   picture  = 頭像 URL
			uid=decodedtoken.get("sub")
			email=decodedtoken.get("email")
			name=decodedtoken.get("name")
			picture=decodedtoken.get("picture")
			signup=False

			# 先用 uid 找 (新註冊或已遷移過的使用者)
			row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "uid"=%s AND "deletetime" IS NULL""",[uid],SETTING["dbsetting"])

			if not row:
				# 遷移處理: 原本 Firebase 使用者的 uid 是 Firebase uid (不是 Google sub)
				# 用 email 找看看, 找到就把 uid 更新為 Google sub
				emailrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "email"=%s AND "deletetime" IS NULL""",[email],SETTING["dbsetting"])
				if emailrow:
					query(SETTING["dbname"],f"""UPDATE "user" SET "uid"=%s,"updatetime"=%s WHERE "id"=%s""",[uid,nowtime(),emailrow[0]["id"]],SETTING["dbsetting"])
					row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[emailrow[0]["id"]],SETTING["dbsetting"])

			if not row:
				signup=True
				while True:
					# 產生 8 碼隨機數字
					playerid=str(random.randint(10000000,99999999))

					# 判斷是否「沒有」在裡面 (檢查 playerid 唯一性)
					if not query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "playerid"=%s""",[playerid],SETTING["dbsetting"]):
						break

				# type 留空字串, signup 流程完成才會寫入實際類型
				query(SETTING["dbname"],f"""INSERT INTO "user"("token","uid","name","email","avatarurl","permission","verifytoken","createtime","playerid","type")VALUES(gen_random_uuid(),%s,%s,%s,%s,%s,%s,%s,%s,%s)""",[uid,name,email,picture,"1","0",nowtime(),playerid,""],SETTING["dbsetting"])
				row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "uid"=%s AND "deletetime" IS NULL""",[uid],SETTING["dbsetting"])
			else:
				# 已存在但 type 還沒設定 → 視同需要 signup
				if not row[0]["type"]:
					signup=True

			token=randomtext()

			query(SETTING["dbname"],f"""INSERT INTO "token"("userid","token","createtime")VALUES(%s,%s,%s)""",[row[0]["id"],token,nowtime()],SETTING["dbsetting"])

			return Response({
				"success": True,
				"data": {
					"signup": signup,
					"token": token,
					"uid": uid,
					"email": email,
					"name": name,
					"picture": picture,
					"language": row[0]["language"]
				}
			},status.HTTP_200_OK)
		except Exception as e:
			print("signin error:",str(e))
			return errorresponse("ERROR_signin_error")


	@api_view(["POST"])
	def signup(request):
		# signup 流程: 使用者首次 Firebase 登入後, 補完顯示名稱 / 帳號類型 / 語言
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
				tokenrow=tokenrow[0]
				row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s AND "deletetime" IS NULL""",[tokenrow["userid"]],SETTING["dbsetting"])
				if row:
					row=row[0]

					# 防護: type 已設定就不能再改
					if row["type"]:
						return errorresponse("ERROR_already_signed_up")

					requestdata=validate(json.loads(request.body),{
						"name": "required|string",
						"type": "required|string|in:player,dealer,floor,assistant",
						"language": "required|string|in:zhtw,en"
					},{
						"required": "ERROR_request_data_not_found",
						"string": "ERROR_request_data_type_error",
						"in": "ERROR_request_data_type_error"
					})

					if requestdata["error"] is None:
						name=requestdata["data"].get("name")
						usertype=requestdata["data"].get("type")
						language=requestdata["data"].get("language")

						queryupdate(SETTING["dbname"],"user",{
							"name": name,
							"type": usertype,
							"language": language,
							"updatetime": nowtime()
						},{
							"id": row["id"]
						},SETTING["dbsetting"])

						return Response({
							"success": True,
							"data": ""
						},status.HTTP_200_OK)
					else:
						return errorresponse(requestdata["error"])
				else:
					return errorresponse("ERROR_user_not_found")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

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

					# includefee toggle (預設 true=含服務費)
					includefee=True
					includefeeparam=request.GET.get("includefee")
					if includefeeparam=="false" or includefeeparam=="0":
						includefee=False

					# 計算個人成本的內部函式 (依 includefee 決定是否加 fee)
					def calccost(s):
						# 用 .get 寬容處理舊資料沒 fee 欄位的情況
						bf=s.get("buyinfee") or 0
						rf=s.get("rebuyfee") or 0
						if includefee:
							return s["buyin"]+bf+(s["rebuybuyin"]+rf)*s["rebuycount"]
						else:
							return s["buyin"]+s["rebuybuyin"]*s["rebuycount"]

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

					# 計算今日盈利 (主辦牌局不計入個人盈虧)
					today_end=today_start.replace(hour=23,minute=59,second=59,microsecond=999999)
					today_sessions=query(SETTING["dbname"],
						"""SELECT winprice, buyin, buyinfee, rebuybuyin, rebuyfee, rebuycount
						   FROM session
						   WHERE userid=%s AND deletetime IS NULL AND owned=false
						   AND %s<=starttime AND starttime <= %s""",
						[row["id"],today_start.strftime("%Y-%m-%d %H:%M:%S"),today_end.strftime("%Y-%m-%d %H:%M:%S")],
						SETTING["dbsetting"]
					)

					# 計算各時段的盈利
					today_profit=0
					for s in today_sessions:
						today_profit=today_profit+(s["winprice"]-calccost(s))

					# 計算本週盈利 (週一到週日, 主辦牌局不計入個人盈虧)
					week_sessions=query(SETTING["dbname"],
						"""SELECT winprice, buyin, buyinfee, rebuybuyin, rebuyfee, rebuycount
						   FROM session
						   WHERE userid=%s AND deletetime IS NULL AND owned=false
						   AND starttime >= %s AND starttime <= %s""",
						[row["id"],
						 week_start.strftime("%Y-%m-%d %H:%M:%S"),
						 week_end.strftime("%Y-%m-%d %H:%M:%S")],
						SETTING["dbsetting"]
					)
					week_profit=0
					for s in week_sessions:
						week_profit=week_profit+(s["winprice"]-calccost(s))

					# 計算本月盈利 (1號到月底, 主辦牌局不計入個人盈虧)
					month_sessions=query(SETTING["dbname"],
						"""SELECT winprice, buyin, buyinfee, rebuybuyin, rebuyfee, rebuycount
						   FROM session
						   WHERE userid=%s AND deletetime IS NULL AND owned=false
						   AND starttime >= %s AND starttime <= %s""",
						[row["id"],
						 month_start.strftime("%Y-%m-%d %H:%M:%S"),
						 month_end.strftime("%Y-%m-%d %H:%M:%S")],
						SETTING["dbsetting"]
					)
					month_profit=0
					for s in month_sessions:
						month_profit=month_profit+(s["winprice"]-calccost(s))

					# 計算最近7天盈利 (含今天, 主辦牌局不計入個人盈虧)
					last_week_sessions=query(SETTING["dbname"],
						"""SELECT DATE(starttime) as date,
						   winprice, buyin, buyinfee, rebuybuyin, rebuyfee, rebuycount
						   FROM session
						   WHERE userid=%s AND deletetime IS NULL AND owned=false
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
							profit=session["winprice"]-calccost(session)
							last_week_daily[array_index] += profit

					employedby=[]
					if row["type"]!="player":
						employedby=query(SETTING["dbname"],
							f"""SELECT us.*, u."name" AS ownername, u."playerid" AS ownerplayerid, u."email" AS owneremail
							   FROM "userstaff" us
							   JOIN "user" u ON u."id"=us."userid"
							   WHERE us."staffuserid"=%s AND us."status"='active' AND us."deletetime" IS NULL
							   ORDER BY us."createtime" DESC""",
							[row["id"]],
							SETTING["dbsetting"]
						)

					return Response({
						"success": True,
						"data": {
							**row,
							"chipcolors": parsechipcolors(row.get("chipcolors")),
							"todaytotalprofit": float(today_profit),
							"weektotalprofit": float(week_profit),
							"lastweekprofit": last_week_daily,
							"monthtotalprofit": float(month_profit),
							"employedby": employedby
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

	@api_view(["GET"])
	def searchusers(request):
		header=request.headers.get("Authorization")
		token=None
		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")
		if not token:
			return errorresponse("ERROR_token_not_found")
		tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
		if not tokenrow:
			return errorresponse("ERROR_token_error")
		keyword=(request.GET.get("keyword") or "").strip()
		sessionid=request.GET.get("sessionid") or ""
		if len(keyword)<1:
			return Response({"success": True,"data": []},status.HTTP_200_OK)
		like="%"+keyword+"%"
		rows=query(SETTING["dbname"],
			f"""SELECT u."id",u."name",u."playerid",u."email",u."type",
			       sp."id" AS sessionplayerid,sp."status" AS registrationstatus
			   FROM "user" u
			   LEFT JOIN "sessionplayer" sp ON sp."userid"=u."id" AND sp."sessionid"=%s AND sp."deletetime" IS NULL
			   WHERE u."deletetime" IS NULL
			     AND (u."playerid" ILIKE %s OR u."name" ILIKE %s OR u."email" ILIKE %s)
			   ORDER BY u."playerid" ASC
			   LIMIT 20""",
			[sessionid,like,like,like],
			SETTING["dbsetting"]
		)
		return Response({"success": True,"data": rows or []},status.HTTP_200_OK)

	@api_view(["GET"])
	def getuserreport(request):
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
					data=request.GET.dict()

					requestdata=validate(data,{
						"type": "string|in:month,year,all",
						"year": "string",
						"month": "string"
					},{
						"string": "ERROR_request_data_type_error",
						"in": "ERROR_request_data_type_error"
					})

					if requestdata["error"] is None:
						type=requestdata["data"].get("type") if requestdata["data"].get("type") else "month"
						year=requestdata["data"].get("year") if requestdata["data"].get("year") else str(datetime.datetime.now().year)
						month=requestdata["data"].get("month") if requestdata["data"].get("month") else str(datetime.datetime.now().month)

						# includefee toggle (預設 true=含服務費)
						includefee=True
						includefeeparam=request.GET.get("includefee")
						if includefeeparam=="false" or includefeeparam=="0":
							includefee=False

						# 1. 先計算時間區間 (保持不變或優化)
						if type=="month":
							startdate=f"{year}-{month}-01 00:00:00"
							nextmonthdate=(datetime.datetime.strptime(startdate,"%Y-%m-%d %H:%M:%S")+timedelta(days=32)).replace(day=1)
							startdate=f"{year}-{month}-01 00:00:00+08"
							enddate=(nextmonthdate-timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")+"+08"
						elif type=="year":
							startdate=f"{year}-01-01 00:00:00+08"
							enddate=f"{year}-12-31 23:59:59+08"
						else:
							startdate="1000-01-01 00:00:00+08"
							enddate="3000-12-31 23:59:59+08"
						# 2. 執行一條彙總查詢 (主辦牌局不計入個人盈虧)
						# 依 includefee 決定 cost 公式是否加 buyinfee + rebuyfee
						if includefee:
							summary_sql = """
								SELECT
									"gametype",
									COUNT(*) as count,
									SUM(COALESCE("buyin", 0) + COALESCE("buyinfee", 0) + (COALESCE("rebuybuyin", 0) + COALESCE("rebuyfee", 0)) * COALESCE("rebuycount", 0)) as buyin,
									SUM(COALESCE("winprice", 0) - (COALESCE("buyin", 0) + COALESCE("buyinfee", 0) + (COALESCE("rebuybuyin", 0) + COALESCE("rebuyfee", 0)) * COALESCE("rebuycount", 0))) as profit
								FROM "session"
								WHERE "userid" = %s AND "deletetime" IS NULL AND "owned"=false AND "starttime" >= %s AND "starttime" <= %s
								GROUP BY "gametype"
							"""
						else:
							summary_sql = """
								SELECT
									"gametype",
									COUNT(*) as count,
									SUM(COALESCE("buyin", 0)+COALESCE("rebuybuyin", 0)*COALESCE("rebuycount", 0)) as buyin,
									SUM(COALESCE("winprice", 0) - (COALESCE("buyin", 0) + (COALESCE("rebuybuyin", 0) * COALESCE("rebuycount", 0)))) as profit
								FROM "session"
								WHERE "userid" = %s AND "deletetime" IS NULL AND "owned"=false AND "starttime" >= %s AND "starttime" <= %s
								GROUP BY "gametype"
							"""
						raw_data = query(SETTING["dbname"], summary_sql, [row["id"], startdate, enddate], SETTING["dbsetting"])

						# 3. 整理成需要的格式
						stats = {
							"cash": {"count": 0, "buyin": 0, "profit": 0},
							"limited": {"count": 0, "buyin": 0, "profit": 0}, # 對應你原本的 tlt
							"tournament": {"count": 0, "buyin": 0, "profit": 0} # 對應你原本的 mtt
						}
						total_profit = 0

						for item in raw_data:
							g_type = item["gametype"]
							if g_type in stats:
								stats[g_type]["count"] = item["count"]
								stats[g_type]["buyin"] = float(item["buyin"] or 0)
								stats[g_type]["profit"] = float(item["profit"] or 0)
								total_profit=total_profit+float(item["profit"] or 0)

						regsessionrow=query(SETTING["dbname"],
							"""SELECT DISTINCT s.*
							   FROM "sessionplayer" sp
							   JOIN "session" s ON s."id"=sp."sessionid" AND s."deletetime" IS NULL
							   WHERE sp."userid"=%s AND sp."deletetime" IS NULL AND sp."status"='confirmed' AND s."starttime">=%s AND s."starttime"<=%s""",
							[row["id"],startdate,enddate],
							SETTING["dbsetting"]
						)
						for regsession in regsessionrow:
							regrow=query(SETTING["dbname"],
								"""SELECT sp.*, tp."place" AS timerplace, tp."status" AS timerstatus
								   FROM "sessionplayer" sp
								   LEFT JOIN "sessiontimerplayer" tp ON tp."sessionid"=sp."sessionid" AND tp."userid"=sp."userid" AND tp."deletetime" IS NULL
								   WHERE sp."userid"=%s AND sp."sessionid"=%s AND sp."deletetime" IS NULL AND sp."status"='confirmed'""",
								[row["id"],regsession["id"]],
								SETTING["dbsetting"]
							)
							regrow=_attachfinance(regsession,regrow)
							for item in regrow:
								g_type=regsession["gametype"]
								if g_type in stats:
									cost=item["cost"] or 0
									if not includefee and item.get("paymenttype")!="ticket":
										cost=cost-float(item.get("fee") or 0)
										cost=cost-(float(regsession.get("rebuyfee") or 0)*(item.get("rebuycount") or 0))
										cost=cost-(float(regsession.get("reentryfee") or 0)*(item.get("reentrycount") or 0))
										cost=cost-(float(regsession.get("addonfee") or 0)*(item.get("addoncount") or 0))
									profit=(item["finalprize"] or 0)-cost
									stats[g_type]["count"]=stats[g_type]["count"]+1
									stats[g_type]["buyin"]=stats[g_type]["buyin"]+cost
									stats[g_type]["profit"]=stats[g_type]["profit"]+profit
									total_profit=total_profit+profit

						# cashcount=query(SETTING["dbname"],"""SELECT COUNT(*) as count FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL AND "gametype"='cash' AND %s<="starttime" AND "starttime"<=%s""",[row["id"],startdate,enddate],SETTING["dbsetting"])
						# cashbuyin=query(SETTING["dbname"],"""SELECT SUM("buyin") as count FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL AND "gametype"='cash' AND %s<="starttime" AND "starttime"<=%s""",[row["id"],startdate,enddate],SETTING["dbsetting"])
						# cashprofit=query(SETTING["dbname"],"""SELECT SUM("winprice"-("buyin"+("rebuybuyin"*"rebuycount"))) as count FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL AND "gametype"='cash' AND %s<="starttime" AND "starttime"<=%s""",[row["id"],startdate,enddate],SETTING["dbsetting"])

						# tltcount=query(SETTING["dbname"],"""SELECT COUNT(*) as count FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL AND "gametype"='limited' AND %s<="starttime" AND "starttime"<=%s""",[row["id"],startdate,enddate],SETTING["dbsetting"])
						# tltbuyin=query(SETTING["dbname"],"""SELECT SUM("buyin") as count FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL AND "gametype"='limited' AND %s<="starttime" AND "starttime"<=%s""",[row["id"],startdate,enddate],SETTING["dbsetting"])
						# tltprofit=query(SETTING["dbname"],"""SELECT SUM("winprice"-("buyin"+("rebuybuyin"*"rebuycount"))) as count FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL AND "gametype"='limited' AND %s<="starttime" AND "starttime"<=%s""",[row["id"],startdate,enddate],SETTING["dbsetting"])

						mttbuyincount=query(SETTING["dbname"],"""SELECT SUM(1+COALESCE("rebuycount", 0)) as count FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL AND "owned"=false AND "gametype"='tournament' AND %s<="starttime" AND "starttime"<=%s""",[row["id"],startdate,enddate],SETTING["dbsetting"])
						regmttbuyincount=query(SETTING["dbname"],"""SELECT SUM(1+COALESCE(sp."rebuycount",0)+COALESCE(sp."reentrycount",0)+COALESCE(sp."addoncount",0)) as count FROM "sessionplayer" sp JOIN "session" s ON s."id"=sp."sessionid" AND s."deletetime" IS NULL WHERE sp."userid"=%s AND sp."deletetime" IS NULL AND sp."status"='confirmed' AND s."gametype"='tournament' AND %s<=s."starttime" AND s."starttime"<=%s""",[row["id"],startdate,enddate],SETTING["dbsetting"])
						stats["tournament"]["buyincount"]=(mttbuyincount[0]["count"] if mttbuyincount[0]["count"] else 0)+(regmttbuyincount[0]["count"] if regmttbuyincount and regmttbuyincount[0]["count"] else 0)

						# MTT 進階統計: ROI% / ITM% / ft% / Top3%
						mttstats=query(SETTING["dbname"],
							"""SELECT
								COUNT(CASE WHEN "inmoney"=true THEN 1 END) AS itm,
								COUNT(CASE WHEN "inft"=true THEN 1 END) AS ft,
								COUNT(CASE WHEN "place" IN ('1','2','3') THEN 1 END) AS top3
							FROM "session"
							WHERE "userid"=%s AND "deletetime" IS NULL AND "owned"=false
							AND "gametype"='tournament' AND %s<="starttime" AND "starttime"<=%s""",
							[row["id"],startdate,enddate],
							SETTING["dbsetting"]
						)

						mttcount=stats["tournament"]["count"] or 0
						mttbuyinval=stats["tournament"]["buyin"] or 0
						mttprofitval=stats["tournament"]["profit"] or 0
						itmcount=(mttstats[0]["itm"] if mttstats and mttstats[0]["itm"] else 0) or 0
						ftcount=(mttstats[0]["ft"] if mttstats and mttstats[0]["ft"] else 0) or 0
						top3count=(mttstats[0]["top3"] if mttstats and mttstats[0]["top3"] else 0) or 0

						# 算百分比, 沒場次的話一律 0
						if 0<mttcount:
							itmpct=round((float(itmcount)/float(mttcount))*100,2)
							ftpct=round((float(ftcount)/float(mttcount))*100,2)
							top3pct=round((float(top3count)/float(mttcount))*100,2)
						else:
							itmpct=0
							ftpct=0
							top3pct=0

						if 0<float(mttbuyinval):
							roipct=round((float(mttprofitval)/float(mttbuyinval))*100,2)
						else:
							roipct=0

						stats["tournament"]["roi"]=roipct
						stats["tournament"]["itm"]=itmpct
						stats["tournament"]["ft"]=ftpct
						stats["tournament"]["top3"]=top3pct

						# 總盈虧 (依 includefee 決定 cost 是否含 fee)
						if includefee:
							profitsql="""SELECT SUM(COALESCE("winprice", 0) - (COALESCE("buyin", 0) + COALESCE("buyinfee", 0) + (COALESCE("rebuybuyin", 0) + COALESCE("rebuyfee", 0)) * COALESCE("rebuycount", 0))) as count FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL AND "owned"=false AND %s<="starttime" AND "starttime"<=%s"""
						else:
							profitsql="""SELECT SUM("winprice"-("buyin"+("rebuybuyin"*"rebuycount"))) as count FROM "session" WHERE "userid"=%s AND "deletetime" IS NULL AND "owned"=false AND %s<="starttime" AND "starttime"<=%s"""
						profit=query(SETTING["dbname"],profitsql,[row["id"],startdate,enddate],SETTING["dbsetting"])
						totalprofit=(profit[0]["count"] if profit[0]["count"] else Decimal("0")) + (Decimal(str(total_profit)) - (profit[0]["count"] if profit[0]["count"] else Decimal("0")))

						# return Response({
						# 	"success": True,
						# 	"data": {
						# 		"cash": {
						# 			"count": cashcount[0]["count"],
						# 			"buyin": cashbuyin[0]["count"] if cashbuyin[0]["count"] else 0,
						# 			"profit": cashprofit[0]["count"] if cashprofit[0]["count"] else 0,
						# 		},
						# 		"tlt": {
						# 			"count": tltcount[0]["count"],
						# 			"buyin": tltbuyin[0]["count"] if tltbuyin[0]["count"] else 0,
						# 			"profit": tltprofit[0]["count"] if tltprofit[0]["count"] else 0,
						# 		},
						# 		"mtt": {
						# 			"count": mttcount[0]["count"],
						# 			"buyin": mttbuyin[0]["count"] if mttbuyin[0]["count"] else 0,
						# 			"profit": mttprofit[0]["count"] if mttprofit[0]["count"] else 0,
						# 		},
						# 		"profit": profit[0]["count"] if profit[0]["count"] else 0,
						# 	}
						# },status.HTTP_200_OK)
						return Response({
							"success": True,
							"data": {
								"cash": stats["cash"],
								"tlt": stats["limited"],
								"mtt": stats["tournament"],
								"profit": totalprofit,
							}
						},status.HTTP_200_OK)
					else:
						return errorresponse(requestdata["error"])


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
	def edituserlanguage(request):
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
					"langkey": "required|string|in:zhtw,en"
				},{
					"required": "ERROR_request_data_not_found",
					"string": "ERROR_request_data_type_error",
				})

				if requestdata["error"] is None:
					langkey=requestdata["data"].get("langkey")

					row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow["userid"]],SETTING["dbsetting"])
					if row:
						query(SETTING["dbname"],f"""UPDATE "user" SET "language"=%s,"updatetime"=%s WHERE "id"=%s""",[langkey,nowtime(),tokenrow["userid"]],SETTING["dbsetting"])
						# row=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow["userid"]],SETTING["dbsetting"])

						return Response({
							"success": True,
							"data": langkey
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
	def edituserchipcolors(request):
		header=request.headers.get("Authorization")
		token=None
		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")
		if not token:
			return errorresponse("ERROR_token_not_found")
		tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
		if not tokenrow:
			return errorresponse("ERROR_token_error")
		data=json.loads(request.body)
		colors=data.get("colors")
		if not isinstance(colors,list):
			return errorresponse("ERROR_request_data_type_error")
		output=[]
		for i in range(len(colors)):
			item=colors[i]
			if not isinstance(item,dict):
				continue
			name=str(item.get("name") or "").strip()
			color=str(item.get("color") or "").strip()
			if not re.match(r"^#[0-9a-fA-F]{6}$",color):
				continue
			if name=="":
				name=color
			output.append({
				"name": name[:20],
				"color": color.lower()
			})
		if len(output)==0:
			output=defaultchipcolors()
		query(SETTING["dbname"],f"""UPDATE "user" SET "chipcolors"=%s,"updatetime"=%s WHERE "id"=%s""",[json.dumps(output,ensure_ascii=False),nowtime(),tokenrow[0]["userid"]],SETTING["dbsetting"])
		return Response({
			"success": True,
			"data": output
		},status.HTTP_200_OK)

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
