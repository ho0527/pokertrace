# 統一例外處理 middleware（對應檢查表 1.4）
# 目的：集中攔截未被各 API 自行 try/except 捕捉的例外，避免 stack trace 外洩，
# 並將完整錯誤（含 traceback）只寫進後端 error.log，前端只看到通用錯誤碼。
import json
import logging

from django.http import JsonResponse
from rest_framework import status

logger = logging.getLogger("pokertrace")


class ExceptionMiddleware:
	"""把所有未捕捉的例外標準化成通用錯誤回應。

	- 前端只會收到 {"success": False, "data": "ERROR_unknow_error_pls_tell_the_admin"}，
	  不含任何內部細節或 stack trace。
	- 完整錯誤（含 traceback、請求方法與路徑）寫入 error.log（logger 名稱: pokertrace）。
	"""

	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		return self.get_response(request)

	def process_exception(self, request, exception):
		# 完整細節只進後端 log；exc_info=True 會附上 traceback。
		logger.error(
			"Unhandled exception on %s %s",
			request.method,
			request.get_full_path(),
			exc_info=True,
		)
		return JsonResponse(
			{
				"success": False,
				"data": "ERROR_unknow_error_pls_tell_the_admin",
			},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR,
		)



# 前端會固定每幾秒輪詢一次的唯讀端點：內容重複、統計上沒意義，只會把 apilog 洗成雜訊，
# 蓋過真正該注意的登入/異動紀錄，所以不寫入 apilog（比對 request.path 前綴）。
# - gettimer: display.js 每 10 秒（倒數歸零時每 1 秒）輪詢
# - getsessiontableboard: control.js/tableboard.js 每 15~20 秒輪詢
# - getbroadcasthandlist: broadcast.js 每 15 秒輪詢
# - gettimebank: newedithand.js 每 3 秒輪詢
APILOG_SKIP_PATH_PREFIXES = (
	"/gettimer/",
	"/getsessiontableboard/",
	"/getbroadcasthandlist/",
	"/gettimebank/",
)


class ApiLogMiddleware:
	"""記錄每一次後端 API 請求（供 admin.html 稽核「誰在什麼時間打了哪個 API」）。

	高頻輪詢端點（見 APILOG_SKIP_PATH_PREFIXES）不記錄，避免洗版。
	寫入失敗只記錯誤 log，絕不影響原本的 API 回應。
	"""

	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		response = self.get_response(request)
		try:
			if not request.path.startswith(APILOG_SKIP_PATH_PREFIXES):
				self.writeapilog(request, response)
		except Exception as error:
			logger.error("ApiLogMiddleware write failed: %s", error, exc_info=True)
		return response

	def writeapilog(self, request, response):
		from function.sql import query
		from function.thing import nowtime
		from api.initialize import SETTING

		userid = None
		header = request.headers.get("Authorization")
		if header:
			try:
				token = header.split("Bearer ")[1]
			except Exception:
				token = None
			if token:
				tokenrow = query(SETTING["dbname"], f"""SELECT "userid" FROM "token" WHERE "token"=%s""", [token], SETTING["dbsetting"])
				if tokenrow:
					userid = tokenrow[0]["userid"]

		query(
			SETTING["dbname"],
			f"""INSERT INTO "apilog"("userid","path","method","statuscode","ipaddress","useragent","createtime")VALUES(%s,%s,%s,%s,%s,%s,%s)""",
			[
				userid,
				request.path,
				request.method,
				getattr(response, "status_code", None),
				# 優先取 nginx 設的 X-Real-IP，取不到才 fallback REMOTE_ADDR；本部署兩者都是真實 client IP
				# (uvicorn proxy_headers 預設開啟，已從 X-Forwarded-For 還原真實來源，故 apilog 舊資料
				#  即使只讀 REMOTE_ADDR 也都是公網 IP；nginx 的 X-Real-IP 會覆寫用戶端偽造值)
				request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR") or None,
				request.META.get("HTTP_USER_AGENT") or None,
				nowtime(),
			],
			SETTING["dbsetting"],
		)
