# import
import json
import threading
from django.http import HttpResponse,HttpResponseRedirect,JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view,renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

# 自創
from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *
from .authhelper import gettokenuser as commonauthuser

# 員工 role 必須跟 user.type 對齊的有效值
STAFFROLES=[
	"dealer",
	"floor",
	"assistant"
]

def asyncsendmail(*args,**kwargs):
	threading.Thread(target=send_mail,args=args,kwargs=kwargs).start()

def buildverifyemail(ownername,staffname,role,token,sessioninfo=None):
	"""員工邀請信（TASK-070：中英並列）。

	文案慣例沿用 sessionplayer.py 的站內通知：**同一封信裡中英並列，不做語系分流**。
	收件人的語系偏好目前沒有存在資料庫裡，要分流得先加欄位，那是另一個題目。

	多行的信不像通知標題那樣把英文接在中文後面，而是**中文整段之後再接英文整段**，
	因為逐行夾雜會讓 email 幾乎沒辦法讀。中文內容一字未改。

	`ownername` / `staffname` 允許傳入空值，替代文字在這裡決定 ——
	中文段用「主辦人」「您」，英文段用 "the host" "there"。
	以前是在兩個呼叫端各寫一次 `or "主辦人"`，那樣英文段只能拿到中文的替代字。
	"""
	rolelabel="員工"
	rolelabelen="Staff"
	# Assistant 是母音開頭，冠詞要 an —— 一起帶著走，不要在句子裡硬寫 a
	rolearticle="a"
	if role=="dealer":
		rolelabel="計分員(Dealer)"
		rolelabelen="Dealer"
	if role=="floor":
		rolelabel="裁判(Floor)"
		rolelabelen="Floor"
	if role=="assistant":
		rolelabel="助理(Assistant)"
		rolelabelen="Assistant"
		rolearticle="an"

	ownershow=ownername or "主辦人"
	ownershowen=ownername or "The host"
	staffshow=staffname or "您"
	staffshowen=staffname or "there"

	subject=f"[PokerTrace] {ownershow} 邀請您擔任 {rolelabel} / invites you to be {rolearticle} {rolelabelen}"
	verifyurl=f"{BASERUL}staffverify.html?token={token}"

	context=""
	contexten=""
	if sessioninfo:
		context=f"\n本邀請僅限於場次「{sessioninfo}」, 不影響其他場次。\n"
		contexten=f"\nThis invitation applies only to the session \"{sessioninfo}\" and does not affect any other session.\n"

	body=f"""親愛的 {staffshow}，

{ownershow} 邀請您加入旗下擔任「{rolelabel}」。
{context}
請點擊下方連結確認此邀請:
{verifyurl}

如果您不認識邀請者, 請忽略此 email。

PokerTrace 系統信件

---

Hi {staffshowen},

{ownershowen} has invited you to join as {rolearticle} {rolelabelen}.
{contexten}
Please confirm the invitation with the link below:
{verifyurl}

If you do not recognise the sender, please ignore this email.

PokerTrace system mail
"""

	return (subject,body)

# main START
try:
	@api_view(["GET"])
	def getstafflist(request):
		# 主辦人查自己 userstaff 清單 (含員工的 name 與 playerid)
		tokenuserrow,autherror=commonauthuser(request)
		if autherror:
			return autherror

		stafflist=query(SETTING["dbname"],
			f"""SELECT us.*, u."name" AS staffname, u."playerid" AS staffplayerid, u."email" AS staffemail
			   FROM "userstaff" us
			   JOIN "user" u ON u."id"=us."staffuserid"
			   WHERE us."userid"=%s AND us."deletetime" IS NULL
			   ORDER BY us."createtime" DESC""",
			[tokenuserrow["id"]],
			SETTING["dbsetting"]
		)

		# 依 role 分組回傳, 方便前端 render 三張卡片
		grouped={
			"dealer": [],
			"floor": [],
			"assistant": []
		}
		for s in stafflist:
			if s["role"] in grouped:
				grouped[s["role"]].append(s)

		return Response({
			"success": True,
			"data": grouped
		},status.HTTP_200_OK)

	@api_view(["POST"])
	def newstaff(request):
		# 主辦人新增員工到自己旗下 (跨所有場次)
		tokenuserrow,autherror=commonauthuser(request)
		if autherror:
			return autherror

		requestdata=validate(json.loads(request.body),{
			"playerid": "required|string",
			"role": "required|string|in:dealer,floor,assistant"
		},{
			"required": "ERROR_request_data_not_found",
			"string": "ERROR_request_data_type_error",
			"in": "ERROR_request_data_type_error"
		})

		if requestdata["error"] is None:
			playerid=requestdata["data"].get("playerid")
			role=requestdata["data"].get("role")

			# 找該 playerid 對應的員工
			staffrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "playerid"=%s AND "deletetime" IS NULL""",[playerid],SETTING["dbsetting"])
			if not staffrow:
				return errorresponse("ERROR_user_not_found")

			staffrow=staffrow[0]

			# 防護: 不能邀請自己
			if staffrow["id"]==tokenuserrow["id"]:
				return errorresponse("ERROR_staff_self_invite")

			# 確認該員工的 type 跟指定 role 一致
			if staffrow["type"]!=role:
				return errorresponse("ERROR_staff_role_mismatch")

			# 防護: 是否已經邀請過 (不論狀態)
			existing=query(SETTING["dbname"],
				f"""SELECT*FROM "userstaff" WHERE "userid"=%s AND "staffuserid"=%s AND "role"=%s AND "deletetime" IS NULL""",
				[tokenuserrow["id"],staffrow["id"],role],
				SETTING["dbsetting"]
			)
			if existing:
				return errorresponse("ERROR_staff_already_invited")

			# 建立 verifytoken
			verifytoken=randomtext(40)

			queryinsert(SETTING["dbname"],"userstaff",{
				"userid": tokenuserrow["id"],
				"staffuserid": staffrow["id"],
				"role": role,
				"status": "pending",
				"verifytoken": verifytoken,
				"invitetime": nowtime()
			},SETTING["dbsetting"])

			# 寄 email 給員工 (背景, 不阻塞回應)
			# 名字的替代文字交給 buildverifyemail 決定 —— 中英兩段各有各的替代字
			subject,body=buildverifyemail(
				tokenuserrow["name"],
				staffrow["name"],
				role,
				verifytoken
			)
			try:
				asyncsendmail(subject,body,None,[staffrow["email"]],fail_silently=True)
			except Exception as error:
				printcolorhaveline("fail","[ERROR] send_mail "+str(error),"")

			return Response({
				"success": True,
				"data": {
					"staffname": staffrow["name"],
					"staffplayerid": staffrow["playerid"]
				}
			},status.HTTP_200_OK)
		else:
			return errorresponse(requestdata["error"])

	@api_view(["DELETE"])
	def deletestaff(request,staffid):
		# 主辦人刪除自己旗下某員工
		tokenuserrow,autherror=commonauthuser(request)
		if autherror:
			return autherror

		row=query(SETTING["dbname"],f"""SELECT*FROM "userstaff" WHERE "id"=%s AND "deletetime" IS NULL""",[staffid],SETTING["dbsetting"])
		if not row:
			return errorresponse("ERROR_staff_not_found")
		row=row[0]

		# 只有此員工的主辦人能刪
		if row["userid"]!=tokenuserrow["id"]:
			return errorresponse("ERROR_no_permission")

		query(SETTING["dbname"],f"""UPDATE "userstaff" SET "deletetime"=NOW() WHERE "id"=%s""",[staffid],SETTING["dbsetting"])
		return Response({
			"success": True,
			"data": ""
		},status.HTTP_200_OK)

	@api_view(["GET"])
	def verifystaff(request,verifytoken):
		# 員工點 email 連結 → 把 status 設為 active
		# 此端點不需 Authorization, 只認 verifytoken
		row=query(SETTING["dbname"],f"""SELECT*FROM "userstaff" WHERE "verifytoken"=%s AND "deletetime" IS NULL""",[verifytoken],SETTING["dbsetting"])
		if not row:
			# 也可能是 sessionstaff 的 token
			row=query(SETTING["dbname"],f"""SELECT*FROM "sessionstaff" WHERE "verifytoken"=%s AND "deletetime" IS NULL""",[verifytoken],SETTING["dbsetting"])
			if not row:
				return errorresponse("ERROR_verifytoken_invalid")

			row=row[0]
			if row["status"]=="active":
				return Response({
					"success": True,
					"data": "already_active"
				},status.HTTP_200_OK)

			query(SETTING["dbname"],
				f"""UPDATE "sessionstaff" SET "status"='active', "verifytime"=NOW(), "verifytoken"=NULL, "updatetime"=NOW() WHERE "id"=%s""",
				[row["id"]],
				SETTING["dbsetting"]
			)
			return Response({
				"success": True,
				"data": "session_staff_verified"
			},status.HTTP_200_OK)

		row=row[0]
		if row["status"]=="active":
			return Response({
				"success": True,
				"data": "already_active"
			},status.HTTP_200_OK)

		query(SETTING["dbname"],
			f"""UPDATE "userstaff" SET "status"='active', "verifytime"=NOW(), "verifytoken"=NULL, "updatetime"=NOW() WHERE "id"=%s""",
			[row["id"]],
			SETTING["dbsetting"]
		)
		return Response({
			"success": True,
			"data": "user_staff_verified"
		},status.HTTP_200_OK)

	@api_view(["GET"])
	def getsessionstafflist(request,sessionid):
		# 主辦人查某場次的員工清單
		tokenuserrow,autherror=commonauthuser(request)
		if autherror:
			return autherror

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		# 只有場次主人 (或 4+ 權限) 能看
		if sessionrow["userid"]!=tokenuserrow["id"] and 4>int(tokenuserrow["permission"]):
			return errorresponse("ERROR_no_permission")

		stafflist=query(SETTING["dbname"],
			f"""SELECT ss.*, u."name" AS staffname, u."playerid" AS staffplayerid, u."email" AS staffemail
			   FROM "sessionstaff" ss
			   JOIN "user" u ON u."id"=ss."staffuserid"
			   WHERE ss."sessionid"=%s AND ss."deletetime" IS NULL
			   ORDER BY ss."createtime" DESC""",
			[sessionid],
			SETTING["dbsetting"]
		)

		grouped={
			"dealer": [],
			"floor": [],
			"assistant": []
		}
		for s in stafflist:
			if s["role"] in grouped:
				grouped[s["role"]].append(s)

		return Response({
			"success": True,
			"data": grouped
		},status.HTTP_200_OK)

	@api_view(["POST"])
	def newsessionstaff(request,sessionid):
		# 主辦人在場次新增員工 (限定該場次)
		tokenuserrow,autherror=commonauthuser(request)
		if autherror:
			return autherror

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		# 只有場次主人 (或 4+ 權限) 能加
		if sessionrow["userid"]!=tokenuserrow["id"] and 4>int(tokenuserrow["permission"]):
			return errorresponse("ERROR_no_permission")

		requestdata=validate(json.loads(request.body),{
			"playerid": "required|string",
			"role": "required|string|in:dealer,floor,assistant"
		},{
			"required": "ERROR_request_data_not_found",
			"string": "ERROR_request_data_type_error",
			"in": "ERROR_request_data_type_error"
		})

		if requestdata["error"] is None:
			playerid=requestdata["data"].get("playerid")
			role=requestdata["data"].get("role")

			staffrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "playerid"=%s AND "deletetime" IS NULL""",[playerid],SETTING["dbsetting"])
			if not staffrow:
				return errorresponse("ERROR_user_not_found")
			staffrow=staffrow[0]

			if staffrow["id"]==tokenuserrow["id"]:
				return errorresponse("ERROR_staff_self_invite")

			if staffrow["type"]!=role:
				return errorresponse("ERROR_staff_role_mismatch")

			existing=query(SETTING["dbname"],
				f"""SELECT*FROM "sessionstaff" WHERE "sessionid"=%s AND "staffuserid"=%s AND "role"=%s AND "deletetime" IS NULL""",
				[sessionid,staffrow["id"],role],
				SETTING["dbsetting"]
			)
			if existing:
				return errorresponse("ERROR_staff_already_invited")

			verifytoken=randomtext(40)

			queryinsert(SETTING["dbname"],"sessionstaff",{
				"sessionid": sessionid,
				"staffuserid": staffrow["id"],
				"role": role,
				"status": "pending",
				"verifytoken": verifytoken,
				"invitetime": nowtime()
			},SETTING["dbsetting"])

			# 名字的替代文字交給 buildverifyemail 決定 —— 中英兩段各有各的替代字
			subject,body=buildverifyemail(
				tokenuserrow["name"],
				staffrow["name"],
				role,
				verifytoken,
				sessioninfo=sessionrow["name"]
			)
			try:
				asyncsendmail(subject,body,None,[staffrow["email"]],fail_silently=True)
			except Exception as error:
				printcolorhaveline("fail","[ERROR] send_mail "+str(error),"")

			return Response({
				"success": True,
				"data": {
					"staffname": staffrow["name"],
					"staffplayerid": staffrow["playerid"]
				}
			},status.HTTP_200_OK)
		else:
			return errorresponse(requestdata["error"])

	@api_view(["DELETE"])
	def deletesessionstaff(request,sessionstaffid):
		# 主辦人從場次移除員工
		tokenuserrow,autherror=commonauthuser(request)
		if autherror:
			return autherror

		row=query(SETTING["dbname"],f"""SELECT*FROM "sessionstaff" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionstaffid],SETTING["dbsetting"])
		if not row:
			return errorresponse("ERROR_staff_not_found")
		row=row[0]

		sessionrow=query(SETTING["dbname"],f"""SELECT*FROM "session" WHERE "id"=%s""",[row["sessionid"]],SETTING["dbsetting"])
		if not sessionrow:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrow[0]

		# 只有場次主人 (或 4+ 權限) 能移除
		if sessionrow["userid"]!=tokenuserrow["id"] and 4>int(tokenuserrow["permission"]):
			return errorresponse("ERROR_no_permission")

		query(SETTING["dbname"],f"""UPDATE "sessionstaff" SET "deletetime"=NOW() WHERE "id"=%s""",[sessionstaffid],SETTING["dbsetting"])
		return Response({
			"success": True,
			"data": ""
		},status.HTTP_200_OK)
except Exception as error:
	printcolorhaveline("fail","[ERROR] "+str(error),"")
