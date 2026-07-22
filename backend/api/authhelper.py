from function.sql import *
from function.function import *
from .initialize import *


# 依 RFC 7235 拆 "Authorization: <scheme> <credentials>"：只切第一個空白，並驗證 scheme 必須是 Bearer。
# 舊寫法 header.split("Bearer ")[1] 沒驗 scheme 也沒 strip，"XBearer abc" 會被當成合法、
# "Bearer a Bearer b" 會取到帶尾空白的 "a "。scheme 依 RFC 為不分大小寫，正常的 "Bearer <token>" 行為不變。
def getbearertoken(request):
	header=request.headers.get("Authorization")
	if not header:
		return None
	try:
		parts=header.split(None,1)
		if len(parts)<2:
			return None
		if parts[0].lower()!="bearer":
			return None
		token=parts[1].strip()
		if not token:
			return None
		return token
	except Exception as error:
		return None


# 封禁判定：查 blockbanuser 是否有針對該使用者、且仍有效的封禁紀錄。
# 注意欄位語意：blockbanuser."userid" 是「操作的管理員」，"blockbanuserid" 才是「被封禁者」，
# 所以這裡一定要用 "blockbanuserid" 比對，用 "userid" 會反過來擋到管理員。
#
# 判定兩種封禁：
#   type='ban'   永久停權，banuser 固定寫 time='inf'。
#   type='block' 限時封鎖，blocktime 統一為到期時間戳，格式同 nowtime()＝'YYYY-MM-DD HH:MM:SS'（19 字元）。
# block 的到期判定直接用字典序字串比較：同一固定寬度格式下，字串大小＝時間先後，
# 因此 "time > nowtime()" 即「尚未到期」，不需在 Python 端 parse、也不會因 cast 垃圾值而丟例外。
# char_length(time)=19 是防呆：舊資料若殘留非時間戳的值（例 '60'、'inf'）會被這個條件排除，
# 不會被字典序誤判成永久有效（'6...' > '2026...'）。ban 的 'inf' 走前半段條件、不受影響。
#
# blockbanuser 若線上尚未建表，先確認表存在再查：query() 會吃掉例外回 None，但失敗的連線會被
# 連線池關閉重建，等於每次呼叫白丟一條連線並洗 error log。表不存在時一律視為未封禁。
def getuserbanned(userid):
	tableexist=query(SETTING["dbname"],"""SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='blockbanuser'""",[],SETTING["dbsetting"])
	banned=False
	if tableexist:
		banrow=query(SETTING["dbname"],f"""SELECT 1 FROM "blockbanuser" WHERE "blockbanuserid"=%s AND ("type"='ban' OR ("type"='block' AND char_length("time")=19 AND "time">%s)) LIMIT 1""",[userid,nowtime()],SETTING["dbsetting"])
		if banrow:
			banned=True
	return banned


def gettokenuser(request):
	token=getbearertoken(request)
	if not token:
		return (None,errorresponse("ERROR_token_not_found"))
	tokenrow=query(SETTING["dbname"],f"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
	if not tokenrow:
		return (None,errorresponse("ERROR_token_error"))
	userrow=query(SETTING["dbname"],f"""SELECT*FROM "user" WHERE "id"=%s AND "deletetime" IS NULL""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
	if not userrow:
		return (None,errorresponse("ERROR_user_not_found"))
	# 縱深防禦：封禁時已撤銷 token，這裡再擋一次，避免封禁後才發出的 token 或漏撤的舊 token 仍可用。
	if getuserbanned(userrow[0]["id"]):
		return (None,errorresponse("ERROR_no_permission"))
	return (userrow[0],None)
