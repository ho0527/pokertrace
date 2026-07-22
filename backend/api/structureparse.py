# structureparse.py
#
# 把使用者從別人網頁複製下來的賽程文字，解析成我們的 schedule 格式：
#   [{ "type": "level", "sb": int, "bb": int, "ante": int, "dur": int, "regCloseAfter": bool },
#    { "type": "break", "dur": int }]
#
# 設計原則（見與使用者討論）：
#   1. 先用「規則解析器」處理，完全免費、零延遲，能 cover 大部分貼上的表格。
#   2. 規則解析不出東西時，才呼叫可插拔的 AI（預設 Gemini 免費層）兜底。
#   3. AI 只是轉換器；最終一律經過 cleanschedule() 嚴格清洗，不直接信任 AI 輸出。
#   4. 前端拿到 schedule 後仍會跑一次 cleanstructlist + 預覽，使用者確認才儲存。

import os
import re
import json
import threading
import time
import urllib.request
import urllib.error

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *
from .authhelper import gettokenuser

MAXTEXTLENGTH=20000
MAXITEMS=200
DEFAULTBREAKDUR=10
# base64 後的長度上限（約 2.5MB base64 ≈ 1.8MB 原圖），避免有人塞超大圖。
# 這個值必須低於 Django 的 DATA_UPLOAD_MAX_MEMORY_SIZE（settings.py 未設定，預設 2621440 = 2.5MB），
# 否則 body 會先被 Django 擋成 400 RequestDataTooBig，永遠走不到下面的檢查，
# 使用者拿到的是 Django 原始 400 而不是乾淨的 errorresponse。留下的差額是給 JSON 外層與 data: 前綴的空間。
MAXIMAGEB64=2500000
ALLOWEDIMAGEMIME=("image/png","image/jpeg","image/jpg","image/webp","image/heic","image/heif")

# parsestructure 會呼叫外部 AI（Gemini），每次都有成本；只驗登入擋不住已登入帳號無限迴圈送圖。
# 比照 gto.py solveratelimited 的模組層 in-memory 限流模式，但此端點一定要登入，
# 所以用 token 對應的 userid 當 key（per-user 比 per-IP 合適，同一 IP 下的不同帳號不會互相排擠）。
# 注意：airatelimitrecord 是模組層 in-memory dict，每個行程（uvicorn 各 worker）各持一份、不共享，
# 所以額度是「每行程獨立」，實際整站上限≈worker 數×AIRATELIMITMAX，而非全站單一 AIRATELIMITMAX。
AIRATELIMITWINDOW=600
AIRATELIMITMAX=20
AIRATELIMITLOCK=threading.Lock()
airatelimitrecord={}


def airatelimited(userid):
	"""回傳該使用者是否已超過解析速率限制；未超過時記下這一次。"""
	key=str(userid)
	now=time.time()
	limited=False
	with AIRATELIMITLOCK:
		# 順手清掉已全部過期的使用者紀錄，避免 dict 無限成長
		for recordkey in list(airatelimitrecord.keys()):
			recentlist=[t for t in airatelimitrecord[recordkey] if now-t<AIRATELIMITWINDOW]
			if recentlist:
				airatelimitrecord[recordkey]=recentlist
			else:
				del airatelimitrecord[recordkey]
		recentlist=airatelimitrecord.get(key,[])
		if len(recentlist)>=AIRATELIMITMAX:
			limited=True
		else:
			recentlist.append(now)
			airatelimitrecord[key]=recentlist
	return limited

# ---- AI 設定（全部走環境變數，金鑰不入庫、不外露到前端）----
AIPROVIDER=os.environ.get("STRUCTURE_AI_PROVIDER","gemini")
AIKEY=os.environ.get("STRUCTURE_AI_KEY","")
AIMODEL=os.environ.get("STRUCTURE_AI_MODEL","gemini-2.5-flash-lite")


def cleanint(value):
	if value is None:
		return None
	digits=re.sub(r"[^0-9]","",str(value))
	if digits=="":
		return None
	return int(digits)


def cleanscheduleitem(item):
	itemtype=item.get("type") or "level"
	if itemtype not in ("level","break"):
		itemtype="level"
	output={
		"type": itemtype,
		"dur": cleanint(item.get("dur")) or DEFAULTBREAKDUR
	}
	if itemtype=="level":
		sb=cleanint(item.get("sb")) or 0
		bb=cleanint(item.get("bb")) or 0
		ante=cleanint(item.get("ante"))
		if ante is None:
			ante=0
		if bb<=0 and sb>0:
			bb=sb*2
		output["sb"]=sb
		output["bb"]=bb
		output["ante"]=ante
	if item.get("regCloseAfter"):
		output["regCloseAfter"]=True
	return output


def cleanschedule(rawlist):
	output=[]
	if not isinstance(rawlist,list):
		return output
	for raw in rawlist:
		if not isinstance(raw,dict):
			continue
		item=cleanscheduleitem(raw)
		# level 至少要有一個盲注數字才視為有效，避免雜訊行
		if item["type"]=="level" and item["sb"]<=0 and item["bb"]<=0 and item["ante"]<=0:
			continue
		output.append(item)
		if len(output)>=MAXITEMS:
			break
	return output


# 時長關鍵字：英文 min/mins/minute(s)、中文 分/分鐘、撇號(20')。
# 用關鍵字（而非裸數字）來認時長，才能跟盲注數字區分，也避免誤抓內文。
DURATIONNUM=re.compile(r"(\d+)\s*-?\s*(?:mins?|minutes?|分鐘|分|')",re.IGNORECASE)
BREAKWORDS=("break","休息","colour up","color up","colorup")


def isbreakline(line):
	low=line.lower()
	if not any(word in low for word in BREAKWORDS):
		return False
	# 內文句子常帶句讀（。，！？、；）；表格的休息列不會，用來擋掉中文長句。
	if re.search(r"[。，、！？；]",line):
		return False
	# 表格裡的休息列通常很短（例如 "15-Minute Break"、"休息 15 分鐘"）；
	# 用「去空白後的字數」上限擋掉內文裡剛好出現 break/休息 的長句（跨語言都適用）。
	compact=re.sub(r"\s+","",line)
	return len(compact)<=24


def parsebreakline(line):
	match=DURATIONNUM.search(line)
	dur=int(match.group(1)) if match else DEFAULTBREAKDUR
	return {"type": "break","dur": dur}


# level 行的嚴格判定：開頭是 level 編號，後面跟著一個帶關鍵字的時長。
# 例如 "1\t15 Min\t100\t100\t100"、"9    15分鐘   500   1,000   1,000"。
# 這個形狀在一般敘述文字裡幾乎不會出現，所以即使整篇文章一起掃也很安全。
LEVELLINE=re.compile(r"^\s*\d+\s+.*?\d+\s*-?\s*(?:mins?|minutes?|分鐘|分|')",re.IGNORECASE)


# 數值 token：可帶千分逗號、小數、K/M 縮寫（1K=1000、1.2K=1200、2.5K=2500）。
VALUETOKEN=re.compile(r"\d[\d,]*(?:\.\d+)?\s*[kKmM]?")


def parsevalue(token):
	token=token.strip()
	suffix=token[-1:].lower() if token and token[-1].lower() in ("k","m") else ""
	number=token[:-1] if suffix else token
	number=number.replace(",","").strip()
	if number=="":
		return None
	try:
		value=float(number)
	except Exception as error:
		return None
	if suffix=="k":
		value=value*1000
	elif suffix=="m":
		value=value*1000000
	return int(round(value))


def findvalues(text):
	values=[]
	for token in VALUETOKEN.findall(text):
		value=parsevalue(token)
		if value is not None:
			values.append(value)
	return values


def blindsfromvalues(nums):
	sb=0
	bb=0
	ante=0
	if len(nums)>=3:
		sb,bb,ante=nums[0],nums[1],nums[2]
	elif len(nums)==2:
		sb,bb=nums[0],nums[1]
	elif len(nums)==1:
		sb,bb=nums[0],nums[0]
	return {"sb": sb,"bb": bb,"ante": ante}


def parselevelline(line):
	# 整齊格式（單行）："1\t15 Min\t100\t100\t100"。
	match=DURATIONNUM.search(line)
	if not match:
		return None
	dur=int(match.group(1))
	# 把時長片段挖掉、去掉開頭 level 編號，剩下的數字才是盲注
	removed=line[:match.start()]+" "+line[match.end():]
	lead=re.match(r"^\s*\d+\b",removed)
	rest=removed[lead.end():] if lead else removed
	nums=findvalues(rest)
	if len(nums)==0:
		return None
	item={"type": "level","dur": dur}
	item.update(blindsfromvalues(nums))
	return item


def isdurationonly(line):
	# 只有時長、沒有盲注的獨立一行（堆疊格式）："10 minutes"。
	match=DURATIONNUM.search(line)
	if not match:
		return False
	removed=line[:match.start()]+" "+line[match.end():]
	return len(findvalues(removed))==0


# 盲注行（堆疊格式）："100 / 200 (200)"、"500 / 1K (1K)"、"100/200/200"。
# 以斜線當錨點，避免把一般含數字的行誤判為盲注。
def parseblindsline(line):
	if "/" not in line:
		return None
	nums=findvalues(line)
	if len(nums)<2:
		return None
	item={"type": "level"}
	item.update(blindsfromvalues(nums))
	return item


def ruleparse(text):
	schedule=[]
	pendingdur=20
	for raw in text.split("\n"):
		line=raw.strip()
		if not line:
			continue
		if isbreakline(line):
			schedule.append(parsebreakline(line))
		elif LEVELLINE.match(line):
			# 單行整齊格式：級數 + 時長關鍵字 + 盲注全在一行
			item=parselevelline(line)
			if item:
				pendingdur=item["dur"]
				schedule.append(item)
		elif isdurationonly(line):
			# 堆疊格式的時長行，記著給下一個盲注行用
			pendingdur=int(DURATIONNUM.search(line).group(1))
		else:
			# 堆疊格式的盲注行
			item=parseblindsline(line)
			if item:
				item["dur"]=pendingdur
				schedule.append(item)
		if len(schedule)>=MAXITEMS:
			break
	return cleanschedule(schedule)


def aiprompt(text):
	return (
		"You convert a poker tournament blind structure pasted from a website into JSON. "
		"Return ONLY a JSON array, no prose. Each element is one row in order:\n"
		'{"type":"level","sb":<int small blind>,"bb":<int big blind>,"ante":<int ante>,"dur":<int minutes>}\n'
		'or for a break: {"type":"break","dur":<int minutes>}.\n'
		"Normalize all numbers to plain integers: remove thousands separators (1,000 -> 1000) and "
		"expand K/M suffixes (1K -> 1000, 1.2K -> 1200, 2.5K -> 2500, 1M -> 1000000). "
		"Blinds may appear as 'SB / BB (Ante)' with the ante in parentheses, or as sb/bb/ante. "
		"Rows may be split across multiple lines (level number, duration, then blinds each on their own line) - "
		"combine them into one row. If a row marks registration closing, "
		'add "regCloseAfter":true to that row. Ignore everything that is not the level/break table.\n\n'
		"TEXT:\n"+text
	)


IMAGEPROMPT=(
	"The attached image is a screenshot of a poker tournament blind structure. "
	"Read the levels/breaks table from the image and return ONLY a JSON array, no prose. "
	"Each element is one row in order:\n"
	'{"type":"level","sb":<int small blind>,"bb":<int big blind>,"ante":<int ante>,"dur":<int minutes>}\n'
	'or for a break: {"type":"break","dur":<int minutes>}.\n'
	"Normalize all numbers to plain integers: remove thousands separators (1,000 -> 1000) and "
	"expand K/M suffixes (1K -> 1000, 1.2K -> 1200, 2.5K -> 2500, 1M -> 1000000). "
	"Blinds may appear as 'SB / BB (Ante)' with the ante in parentheses. "
	'If a row marks registration closing, add "regCloseAfter":true to that row. '
	"Ignore everything that is not the level/break table."
)


def geminirequest(parts,unwrapschedule=True):
	# 金鑰用 x-goog-api-key header 帶（Google 現行建議做法，新舊格式 key 都支援；
	# 也避免 key 出現在網址或 log 裡）。
	# unwrapschedule：結構解析時 AI 偶爾會把陣列包成 {"schedule":[...]}，預設拆開只回陣列；
	# 整場匯入(session)要保留整個物件，呼叫端會傳 False。
	url="https://generativelanguage.googleapis.com/v1beta/models/"+AIMODEL+":generateContent"
	body={
		"contents": [{"parts": parts}],
		"generationConfig": {"response_mime_type": "application/json","temperature": 0}
	}
	data=json.dumps(body).encode("utf-8")
	# 503（暫時性高負載）會自動重試幾次；其他錯誤直接拋出。
	lasterror=None
	for attempt in range(3):
		request=urllib.request.Request(url,data=data,headers={
			"Content-Type": "application/json",
			"x-goog-api-key": AIKEY
		})
		try:
			response=urllib.request.urlopen(request,timeout=60)
			payload=json.loads(response.read().decode("utf-8"))
			parts=payload["candidates"][0]["content"]["parts"]
			rawtext="".join([part.get("text","") for part in parts])
			parsed=json.loads(rawtext)
			if unwrapschedule and isinstance(parsed,dict) and isinstance(parsed.get("schedule"),list):
				parsed=parsed["schedule"]
			return parsed
		except urllib.error.HTTPError as error:
			lasterror=error
			if error.code==503 and attempt<2:
				time.sleep(1.5)
				continue
			raise
	if lasterror:
		raise lasterror
	return None


def callgemini(text):
	return geminirequest([{"text": aiprompt(text)}])


def callgeminiimage(imagedata,mimetype):
	return geminirequest([
		{"text": IMAGEPROMPT},
		{"inline_data": {"mime_type": mimetype,"data": imagedata}}
	])


def aiparse(text):
	if not AIKEY:
		return None
	try:
		if AIPROVIDER=="gemini":
			return cleanschedule(callgemini(text))
	except Exception as error:
		printcolorhaveline("fail","[ERROR] structureparse aiparse "+str(error),"")
	return None


def aiparseimage(imagedata,mimetype):
	if not AIKEY:
		return None
	try:
		if AIPROVIDER=="gemini":
			return cleanschedule(callgeminiimage(imagedata,mimetype))
	except Exception as error:
		printcolorhaveline("fail","[ERROR] structureparse aiparseimage "+str(error),"")
	return None


# ---- 整場賽事匯入（新增場次用）----------------------------------------
# 跟「只解析結構」不同：這裡還要把賽事名稱、起始計分牌、買入、開始時間、報名截止
# 這些 metadata 一起抽出來，讓使用者貼一坨賽事頁就能把新增場次表單填好。
# AI 只負責「把文字抽成欄位」；時間相關的算術一律在後端用程式 deterministic 算，
# 不讓 AI 自己編開始時間（容易幻覺）。

def sessionaiprompt(text):
	return (
		"You extract poker tournament metadata from text pasted from a tournament website. "
		"Return ONLY a JSON object (no prose) with these keys:\n"
		'{"name": <event title string or null>,'
		' "startingStack": <int starting stack or null>,'
		' "buyin": <int buy-in amount or null>,'
		' "startTime": <"HH:MM" 24h start time, or null if not explicitly stated>,'
		' "regCloseEndTime": <"HH:MM" 24h time registration closes/ends, or null>,'
		' "regCloseLevel": <int level number after which registration closes, or null>,'
		' "schedule": [ {"type":"level","sb":<int>,"bb":<int>,"ante":<int>,"dur":<int minutes>}'
		' or {"type":"break","dur":<int minutes>} ]}\n'
		"Rules:\n"
		"- Normalize all numbers to plain integers: remove thousands separators (1,000 -> 1000) "
		"and expand K/M suffixes (1K -> 1000, 2.5K -> 2500, 1M -> 1000000).\n"
		'- If the event is a freeroll (no buy-in), set "buyin" to 0.\n'
		'- IMPORTANT: do NOT guess or compute "startTime". Only fill it if the text literally states a start time. '
		"Otherwise leave it null.\n"
		'- Only set "regCloseLevel" if the text marks a specific level as the late-registration/'
		'registration-close level (e.g. a "REG X" / "Late reg" / "Reg close" marker on a level). Otherwise null.\n'
		"- The schedule is the levels/breaks table, in order. Breaks may appear between levels.\n"
		"- Use null for anything not present. Ignore prize/rules/notes prose.\n\n"
		"TEXT:\n"+text
	)


def callgeminisession(text):
	return geminirequest([{"text": sessionaiprompt(text)}],unwrapschedule=False)


def parseclock(value):
	# "HH:MM"（可含秒，忽略秒）-> 一天內的分鐘數；失敗回 None
	if value is None:
		return None
	match=re.match(r"^\s*(\d{1,2})\s*:\s*(\d{2})",str(value))
	if not match:
		return None
	hour=int(match.group(1))
	minute=int(match.group(2))
	if hour>23 or minute>59:
		return None
	return hour*60+minute


def formatclock(minutes):
	minutes=minutes%(24*60)
	return "%02d:%02d"%(minutes//60,minutes%60)


def validclock(value):
	total=parseclock(value)
	if total is None:
		return None
	return formatclock(total)


def minutestoendoflevel(schedule,levelnumber):
	# 從開賽到「第 levelnumber 個 level 結束」累計幾分鐘（含中間的休息）。
	count=0
	total=0
	for item in schedule:
		total=total+(cleanint(item.get("dur")) or 0)
		if item.get("type")=="level":
			count=count+1
			if count==levelnumber:
				return total
	return None


def markregcloselevel(schedule,levelnumber):
	count=0
	for item in schedule:
		if item.get("type")=="level":
			count=count+1
			if count==levelnumber:
				item["regCloseAfter"]=True
				return True
	return False


def cleansessionresult(raw):
	output={
		"name": "",
		"startingStack": None,
		"buyin": None,
		"startTime": None,
		"regCloseEndTime": None,
		"regCloseLevel": None,
		"schedule": []
	}
	if not isinstance(raw,dict):
		return output
	name=raw.get("name")
	if isinstance(name,str):
		output["name"]=name.strip()[:200]
	output["startingStack"]=cleanint(raw.get("startingStack"))
	buyin=cleanint(raw.get("buyin"))
	# freeroll 抽出來會是 0；cleanint(0) 也是 0，保留 0 與 None 的差別。
	output["buyin"]=buyin if buyin is not None else (0 if raw.get("buyin")==0 else None)
	output["startTime"]=validclock(raw.get("startTime"))
	output["regCloseEndTime"]=validclock(raw.get("regCloseEndTime"))
	output["regCloseLevel"]=cleanint(raw.get("regCloseLevel"))
	output["schedule"]=cleanschedule(raw.get("schedule"))
	return output


def computesessiontimes(result):
	# deterministic：把能算的時間/級別補齊，AI 沒給的不硬填。
	schedule=result.get("schedule") or []
	regcloselevel=result.get("regCloseLevel")
	regcloseend=parseclock(result.get("regCloseEndTime"))
	starttime=parseclock(result.get("startTime"))
	result["startTimeDerived"]=False
	# 報名截止級別有了就在結構上標記 regCloseAfter
	if regcloselevel:
		markregcloselevel(schedule,regcloselevel)
	# 沒有明文開始時間，但有「報名截止時間 + 截止級別」就回推開始時間
	if starttime is None and regcloseend is not None and regcloselevel:
		offset=minutestoendoflevel(schedule,regcloselevel)
		if offset is not None:
			result["startTime"]=formatclock(regcloseend-offset)
			result["startTimeDerived"]=True
	# 反過來：有開始時間 + 報名截止時間，但不知道截止級別 -> 找出對應級別
	elif starttime is not None and regcloseend is not None and not regcloselevel:
		want=(regcloseend-starttime)%(24*60)
		count=0
		total=0
		for item in schedule:
			total=total+(cleanint(item.get("dur")) or 0)
			if item.get("type")=="level":
				count=count+1
				if total==want:
					item["regCloseAfter"]=True
					result["regCloseLevel"]=count
					break
	return result


try:
	@api_view(["POST"])
	def parsestructure(request):
		# 需要登入才可用，避免被匿名濫用一直打 AI。
		userrow,errresp=gettokenuser(request)
		if errresp:
			return errresp
		# 登入不等於可以無限打 AI；同一使用者每 AIRATELIMITWINDOW 秒最多 AIRATELIMITMAX 次，超限回 429。
		if airatelimited(userrow["id"]):
			return Response({
				"success": False,
				"data": "ERROR_too_many_requests"
			},status.HTTP_429_TOO_MANY_REQUESTS)
		try:
			data=json.loads(request.body)
		except Exception as error:
			return errorresponse("ERROR_request_data_not_found")

		# 圖片解析：有 image 就走視覺 AI（圖片沒有免費規則兜底）。
		image=data.get("image")
		if isinstance(image,str) and image.strip()!="":
			mimetype="image/png"
			if image.startswith("data:"):
				header,_,b64=image.partition(",")
				match=re.match(r"data:([^;]+)",header)
				if match:
					mimetype=match.group(1).lower()
				image=b64
			image=image.strip()
			if mimetype not in ALLOWEDIMAGEMIME:
				return errorresponse("ERROR_request_data_not_found")
			if len(image)>MAXIMAGEB64:
				return errorresponse("ERROR_request_data_not_found")
			if not AIKEY:
				return Response({
					"success": True,
					"data": {"schedule": [],"count": 0,"source": "none","aiavailable": False}
				},status.HTTP_200_OK)
			schedule=aiparseimage(image,mimetype) or []
			return Response({
				"success": True,
				"data": {
					"schedule": schedule,
					"count": len(schedule),
					"source": "ai" if len(schedule)>0 else "none",
					"aiavailable": True
				}
			},status.HTTP_200_OK)

		text=data.get("text") or ""
		if not isinstance(text,str) or text.strip()=="":
			return errorresponse("ERROR_request_data_not_found")
		if len(text)>MAXTEXTLENGTH:
			text=text[:MAXTEXTLENGTH]
		mode=data.get("mode") or "auto"

		if mode=="session":
			# 整場匯入：結構優先用免費規則解析（較穩），metadata 交給 AI。
			ruleschedule=ruleparse(text)
			result=cleansessionresult(None)
			source="rule" if len(ruleschedule)>0 else "none"
			if AIKEY:
				airaw=None
				try:
					if AIPROVIDER=="gemini":
						airaw=callgeminisession(text)
				except Exception as error:
					printcolorhaveline("fail","[ERROR] structureparse session "+str(error),"")
				result=cleansessionresult(airaw)
				# 規則解析有結果就用規則的（deterministic）；沒有才用 AI 抽出來的結構。
				if len(ruleschedule)>0:
					result["schedule"]=ruleschedule
				elif len(result["schedule"])>0:
					source="ai"
			else:
				result["schedule"]=ruleschedule
			result=computesessiontimes(result)
			result["count"]=len(result["schedule"])
			result["source"]=source if len(result["schedule"])>0 else "none"
			result["aiavailable"]=bool(AIKEY)
			return Response({"success": True,"data": result},status.HTTP_200_OK)

		if mode=="ai":
			# 使用者明確要求用 AI（通常是規則解析結果不對時）。
			schedule=aiparse(text) or []
			source="ai" if len(schedule)>0 else "none"
		else:
			schedule=ruleparse(text)
			source="rule"
			# auto 模式：規則解析不出東西，且有設定 AI 金鑰時才兜底，控制成本。
			if len(schedule)==0:
				aischedule=aiparse(text)
				if aischedule:
					schedule=aischedule
					source="ai"

		return Response({
			"success": True,
			"data": {
				"schedule": schedule,
				"count": len(schedule),
				"source": source if len(schedule)>0 else "none",
				"aiavailable": bool(AIKEY)
			}
		},status.HTTP_200_OK)
except Exception as error:
	printcolorhaveline("fail","[ERROR] "+str(error),"")
