# -*- coding: utf-8 -*-
"""
排程工作 (TASK-028)

架構決策見 ai/artifacts/分析與國際化擴充/architecture-note-排程器.md，重點：

1. 部署是 `uvicorn --workers 6`，所以這裡的排程會有 **6 份同時在跑**。
   正確性不靠「確保只有一個排程器」，而是靠資料層的原子認領：
   `UPDATE ... WHERE startnotifiedtime IS NULL RETURNING id` 在 PostgreSQL 是原子的，
   同一個場次只會有一個 worker 的 UPDATE 拿到那一列，其餘拿到空結果。

   這樣做的好處是它同時也擋住了「服務重啟後重跑」與「鎖逾時後另一個 worker 接手」，
   而分散式鎖只擋得住第一種情況。

2. 排程工作本身包在 try/except 內。比照 notification.py 的 notifyevent()，
   排程失敗不可以拖垮 web 請求處理。
"""

import threading

from apscheduler.schedulers.background import BackgroundScheduler

from function.sql import *
from .initialize import *
from function.thing import printcolorhaveline,nowtime
from .notification import notifyevent,notifyeventbatch


# 每分鐘掃一次。提前量 10 分鐘（人工決策）搭配 1 分鐘間隔，
# 代表使用者實際收到通知的時間會落在開始前 9～10 分鐘之間，誤差可接受。
SCHEDULEINTERVALSECOND=60
STARTNOTIFYLEADMINUTE=10

schedulerstarted=False
schedulerstartlock=threading.Lock()


def claimstartnotify():
	"""
	認領「即將開始且尚未通知」的場次。

	回傳被本次呼叫認領到的場次列（已經把 startnotifiedtime 寫上）。
	沒有認領到任何場次時回傳空 list。

	查詢條件的三個重點：
	- `starttime > 現在`：**不補發**。服務停機期間錯過的場次直接跳過，
	  遲到的「即將開始」只會造成困惑（人工決策）。
	  這裡的「現在」是 nowtime() 傳進來的參數，**不是 SQL 的 NOW()**，
	  理由見下方查詢上的註解。
	- `owned=true`：只有主辦的場次才有報名者與工作人員可以通知。
	- `startnotifiedtime IS NULL`：認領的關鍵條件，見檔頭說明。

	**為什麼用 querytransaction 而不是 query**：`function/sql.py` 的 `query()` 只有在
	SQL 以 select / with 開頭時才 `fetchall()`，其餘一律回傳 `rowcount`；而它在歸還連線前
	會 `rollback()`，所以「以 UPDATE 開頭」拿不到資料列，「用 WITH 包起來」則會被回滾。
	`querytransaction()` 兩者都滿足：`WITH` 走 fetchall，而且最後會 `db.commit()`。

	**外層那個 `AND "startnotifiedtime" IS NULL` 是必要的，不是重複條件**：
	PostgreSQL 預設的 READ COMMITTED 下，兩個交易同時更新同一列時，後到的會先被擋住，
	等前一個提交後**重新檢查 WHERE 條件**。子查詢用的是舊快照，唯有外層這個條件會在
	重新檢查時看到已被寫入的值而跳過該列。少了它，兩個 worker 有可能都認領成功。
	"""
	# **「現在」必須用 nowtime() 傳參數，不可以寫 SQL 的 NOW()。**
	# session.starttime 是使用者輸入的**本地時間字串**（session.py:860 直接取 request body），
	# 而全站慣例就是把本地牆上時間存進 timestamptz、前端原樣顯示。
	# SQL 的 NOW() 是真 UTC，兩者差一個時區（本機 8 小時）。
	# 原本這三行寫 NOW()，時間窗實際落在「真實開始時間的 8 小時後」——
	# 也就是**即將開始的通知永遠不會在該發的時候發出**。
	# 2026-08-06 實測：10 分鐘後開始的場次，用 NOW() 撈到 0 筆、用本地時間撈到 1 筆。
	nowvalue=nowtime()
	result=querytransaction(SETTING["dbname"],[
		[f"""
			WITH claimed AS (
				UPDATE "session"
				   SET "startnotifiedtime"=%s
				 WHERE "id" IN (
					SELECT "id" FROM "session"
					 WHERE "deletetime" IS NULL
					   AND "owned"=true
					   AND "startnotifiedtime" IS NULL
					   AND "starttime" > %s::timestamptz
					   AND "starttime" <= %s::timestamptz + INTERVAL '{STARTNOTIFYLEADMINUTE} minutes'
				 )
				   AND "startnotifiedtime" IS NULL
				RETURNING "id","userid","name","starttime"
			)
			SELECT * FROM claimed
		""",[nowvalue,nowvalue,nowvalue]]
	],SETTING["dbsetting"])
	if not result:
		return []
	row=result[0]
	if not row:
		return []
	return row


def startnotifyrecipient(sessionid,ownerid):
	"""
	取得一個場次的「場次即將開始」收件人清單，回傳 userid 的 list。

	收件對象（2026-07-28 人工決策）：
	- 報名者：`sessionplayer.status IN ('confirmed','advanced')`
	- 單場聘用人員：`sessionstaff.status='active'`
	- 全域聘用人員：`userstaff.status='active'` 且受僱於這個場次的擁有者

	**去重是這支函式最重要的事**：同一個人可能同時是報名者與聘用人員，
	也可能同時出現在兩張聘用表裡。這裡用 SQL 的 `UNION`（不是 `UNION ALL`）
	讓資料庫做去重，而不是三次查詢後在 Python 端合併——後者很容易漏掉某一組合。

	場次擁有者本人不排除：他既然設定了這場賽事，收到即將開始的提醒是合理的；
	而且他若同時報名或被列為工作人員，UNION 也只會給他一則。
	"""
	row=query(SETTING["dbname"],"""
		SELECT "userid" FROM "sessionplayer"
		 WHERE "sessionid"=%s AND "status" IN ('confirmed','advanced') AND "deletetime" IS NULL
		UNION
		SELECT "staffuserid" AS "userid" FROM "sessionstaff"
		 WHERE "sessionid"=%s AND "status"='active' AND "deletetime" IS NULL
		UNION
		SELECT "staffuserid" AS "userid" FROM "userstaff"
		 WHERE "userid"=%s AND "status"='active' AND "deletetime" IS NULL
	""",[sessionid,sessionid,ownerid],SETTING["dbsetting"])
	if not row:
		return []
	output=[]
	for item in row:
		userid=item.get("userid")
		if userid and userid not in output:
			output.append(userid)
	return output


def notifysessionstart(item):
	"""
	對單一場次發出「即將開始」通知。

	文案沿用 sessionplayer.py 既有的「中文 + 英文」同一則的慣例。
	一律 `email=False`（人工決策：不寄 Email），只建站內通知。
	"""
	sessionid=item.get("id")
	name=str(item.get("name") or "")
	recipient=startnotifyrecipient(sessionid,item.get("userid"))
	if not recipient:
		return 0
	title="賽事即將開始 Event starting soon"
	message="「"+name+"」將在 "+str(STARTNOTIFYLEADMINUTE)+" 分鐘內開始，請準備入座。\""+name+"\" starts in about "+str(STARTNOTIFYLEADMINUTE)+" minutes, please get ready."
	# TASK-054：改用批次寫入。實測 61 名收件人時逐筆 248.5 ms、批次 76.3 ms，
	# 差 3.3 倍；數百人的場次差距更明顯，而那正好發生在開賽前一分鐘。
	# 批次是一個交易，失敗就整批回退，不會出現「有些人收到有些人沒收到」。
	return notifyeventbatch(recipient,sessionid,"sessionstart",title,message)


# 為什麼一定要強制 flush（TASK-030 實測發現，TASK-053 起由 printcolor 統一處理）：
# stdout 被導向 log 檔時是塊狀緩衝的，冷清的機器上排程訊息會卡在緩衝區裡，
# 要等到有 web 請求把緩衝擠出來才會出現在 backend/log/server.log。
# 實測 6 個 worker 啟動後只看到 2 行 "[scheduler] started"，發了 40 個請求之後才變成 6 行。
# 排程失敗訊息看不到等於沒有 log，所以這裡一律強制 flush。
def runstartnotify():
	"""
	排程進入點。認領到場次後交給 TASK-029 的通知邏輯處理。

	整支包在 try/except：排程是背景工作，任何例外都不該冒泡到 APScheduler
	以外的地方，更不該影響同一個行程裡正在處理的 web 請求。
	"""
	try:
		claimed=claimstartnotify()
		if not claimed:
			return
		for item in claimed:
			# 單一場次發送失敗不該讓其餘已認領的場次一起漏掉。
			# 注意該場次的 startnotifiedtime 已經寫上, 失敗就不會再重試——
			# 這是刻意的取捨: 寧可漏一則, 也不要因為重試而讓使用者收到重複通知。
			try:
				sent=notifysessionstart(item)
				printcolorhaveline("green","[scheduler] session %s (%s) start-notify sent to %s user"%(item.get("id"),item.get("name"),sent),"")
			except Exception as error:
				printcolorhaveline("fail","[scheduler] session %s start-notify failed: %s"%(item.get("id"),error),"")
	except Exception as error:
		printcolorhaveline("fail","[scheduler] runstartnotify failed: %s"%error,"")


def startscheduler():
	"""
	啟動排程。由 asgi.py 在應用載入時呼叫。

	用模組層旗標 + Lock 做 double-checked，比照 notification.py 的
	ensurenotificationtable() 既有寫法，確保同一個行程只會啟動一次。
	（跨行程的重複由原子認領處理，不是這裡的責任。）
	"""
	global schedulerstarted
	if schedulerstarted:
		return
	with schedulerstartlock:
		if schedulerstarted:
			return
		try:
			# TASK-053：時區改由 initialize.py 的 PTTIMEZONE 提供（環境變數 PT_TIMEZONE 可覆寫）
			scheduler=BackgroundScheduler(timezone=PTTIMEZONE)
			scheduler.add_job(
				runstartnotify,
				"interval",
				seconds=SCHEDULEINTERVALSECOND,
				id="startnotify",
				# 行程被卡住後醒來時, 不要把積欠的每一次都補跑一遍
				coalesce=True,
				max_instances=1,
				# 啟動當下不要立刻跑, 讓 web 先起來
				misfire_grace_time=30
			)
			scheduler.start()
			schedulerstarted=True
			printcolorhaveline("green","[scheduler] started, interval=%ss lead=%smin timezone=%s"%(SCHEDULEINTERVALSECOND,STARTNOTIFYLEADMINUTE,PTTIMEZONE),"")
		except Exception as error:
			# 排程起不來不可以讓整個後端起不來
			printcolorhaveline("fail","[scheduler] failed to start: %s"%error,"")
