# timer_consumer.py
# ===========================================================================
# WebSocket consumer for 主辦計時器同步
#   * URL: ws://host/ws/timer/<sessionid>/
#   * 任何 client 連線後加入 group "timer_<sessionid>", 收到該 session 的所有更新
#   * 連線時自動回傳 DB 內目前狀態 (做 initial sync)
#   * REST 端 savetimer 寫 DB 之後會 broadcast 到 group, 所有 client 自動拿到新狀態
#   * MVP: WebSocket 只負責 read/broadcast, 寫入仍走 REST PUT (有 auth + ownership 檢查)
# ===========================================================================

import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from function.sql import query
from .initialize import SETTING
from .timer import buildtimerstate,hastimerreadpermission
from .hand import sessionaccess,canreadsessionhands,sessionispublicbroadcast
# userbytoken 的封禁複查用得到。**漏了這個 import 會讓所有帶 token 的 WebSocket
# 連線在 connect() 就 NameError → 500**，而畫面上只會顯示「連線重試中」，
# 不會有任何訊息指向這裡。2026-08-09 兩台機器都是壞的。
from .authhelper import getuserbanned


def normalizetimerstate(stateval):
	if stateval is None:
		return {}

	if isinstance(stateval,str):
		try:
			return json.loads(stateval)
		except Exception as error:
			return {}

	return stateval


# hand.timer.local 廣播 state 的結構/型別白名單: key 為欄位名, value 為預期型別
HANDTIMERSTATEFIELDLIST={
	"enabled": "bool",
	"running": "bool",
	"seatno": "int",
	"currentIndex": "int",
	"secondsLeft": "int",
	"durationseconds": "int",
	"remainingseconds": "int",
	"anchorTime": "str",
	"lastSyncTime": "str"
}


def sanitizehandtimerstate(stateval):
	# client 傳來的 state 不可未驗證就廣播給整個 group: 只保留預期欄位與型別, 其餘一律丟棄
	stateval=normalizetimerstate(stateval)
	result={}
	if isinstance(stateval,dict):
		for key in HANDTIMERSTATEFIELDLIST:
			if key in stateval:
				fieldtype=HANDTIMERSTATEFIELDLIST[key]
				value=stateval[key]
				if fieldtype=="bool" and isinstance(value,bool):
					result[key]=value
				elif fieldtype=="int" and isinstance(value,(int,float)) and not isinstance(value,bool):
					result[key]=int(value)
				elif fieldtype=="str" and isinstance(value,str) and len(value)<=100:
					result[key]=value
	return result


def getquerytoken(scope):
	try:
		querystring=scope.get("query_string",b"").decode("utf-8")
		params=parse_qs(querystring)
		token=params.get("token")
		if token and token[0]:
			return token[0]
	except Exception as error:
		return None
	return None


def userbytoken(token):
	if not token:
		return None
	tokenrow=query(SETTING["dbname"],"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
	if not tokenrow:
		return None
	userrow=query(SETTING["dbname"],"""SELECT*FROM "user" WHERE "id"=%s AND "deletetime" IS NULL""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
	if not userrow:
		return None
	# 縱深防禦：與 authhelper.gettokenuser 同一個理由。
	# 這裡收的是 token 字串（WebSocket 沒有 Django 的 request 物件），
	# 所以沒辦法直接委派給 gettokenuser，只能自己補這一層。
	# 少了它的話，被封禁的使用者只要 WebSocket 還連著、或手上的 token 沒被撤，
	# 就能繼續寫手牌與操作計時器。
	if getuserbanned(userrow[0]["id"]):
		return None
	return userrow[0]


def handwriteallowed(sessionid,token):
	userrow=userbytoken(token)
	if not userrow:
		return False
	sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if not sessionrow:
		return False
	access=sessionaccess(sessionrow[0],userrow)
	if access["canrecord"] or access["cantimer"] or access["isown"] or access["isadmin"]:
		return True
	return False


def handreadallowed(sessionid,token):
	sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if not sessionrow:
		return False
	userrow=userbytoken(token)
	if userrow:
		access=sessionaccess(sessionrow[0],userrow)
		if canreadsessionhands(sessionrow[0],userrow,access):
			return True
	# 公開的統一手牌紀錄場次允許匿名觀眾連線(唯讀轉播), 私人場仍需登入且具權限
	if sessionispublicbroadcast(sessionrow[0]):
		return True
	return False


class TimerWebsocket(AsyncWebsocketConsumer):
	async def connect(self):
		self.sessionid=self.scope["url_route"]["kwargs"]["sessionid"]
		self.groupname="timer_"+str(self.sessionid)
		self.token=getquerytoken(self.scope)
		self.readallowed=await self._checkreadallowed(self.token)
		if not self.readallowed:
			await self.close()
			return

		# 加入 group
		await self.channel_layer.group_add(self.groupname,self.channel_name)
		await self.accept()

		# 連線時送一次目前 DB 的 state 給這個 client
		state=await self._fetchstate()
		await self.send(text_data=json.dumps({
			"type": "init",
			"state": state
		}))

	async def disconnect(self,closecode):
		await self.channel_layer.group_discard(self.groupname,self.channel_name)

	async def receive(self,text_data=None,bytes_data=None):
		# 暫不開放從 WS 直接寫 (避免繞過 ownership 檢查)
		# 之後需要 collaborative 編輯時可在這收 messages
		pass

	# group 廣播事件 handler (REST savetimer 寫完後會 group_send "timer.update")
	async def timer_update(self,event):
		await self.send(text_data=json.dumps({
			"type": "update",
			"state": event["state"]
		}))

	@database_sync_to_async
	def _fetchstate(self):
		state=buildtimerstate(self.sessionid,True)
		if state:
			return state
		return {}

	@database_sync_to_async
	def _checkreadallowed(self,token):
		userrow=userbytoken(token)
		sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[self.sessionid],SETTING["dbsetting"])
		if not sessionrow:
			return False
		return hastimerreadpermission(sessionrow[0],userrow)


class HandWebsocket(AsyncWebsocketConsumer):
	async def connect(self):
		self.sessionid=self.scope["url_route"]["kwargs"]["sessionid"]
		self.groupname="hand_"+str(self.sessionid)
		self.token=getquerytoken(self.scope)
		# 先驗證讀取權限再加入 group，避免匿名連線收到該 session 的廣播事件
		self.readallowed=await self._checkreadallowed(self.token)
		if not self.readallowed:
			await self.close()
			return
		self.writeallowed=await self._checkwriteallowed(self.token)
		await self.channel_layer.group_add(self.groupname,self.channel_name)
		await self.accept()
		await self.send(text_data=json.dumps({
			"type": "init",
			"state": {}
		}))

	async def disconnect(self,closecode):
		await self.channel_layer.group_discard(self.groupname,self.channel_name)

	async def receive(self,text_data=None,bytes_data=None):
		try:
			data=json.loads(text_data or "{}")
		except Exception as error:
			data={}
		if data.get("type")=="hand.timer.local":
			token=data.get("token") or self.token
			allowed=self.writeallowed
			if token!=self.token:
				allowed=await self._checkwriteallowed(token)
			if not allowed:
				await self.send(text_data=json.dumps({
					"type": "error",
					"event": "ERROR_no_permission"
				}))
				return
			await self.channel_layer.group_send(self.groupname,{
				"type": "hand.update",
				"event": "hand.timer.updated",
				"handid": None,
				"state": sanitizehandtimerstate(data.get("state"))
			})

	@database_sync_to_async
	def _checkwriteallowed(self,token):
		return handwriteallowed(self.sessionid,token)

	@database_sync_to_async
	def _checkreadallowed(self,token):
		return handreadallowed(self.sessionid,token)

	async def hand_update(self,event):
		await self.send(text_data=json.dumps({
			"type": "update",
			"event": event.get("event"),
			"handid": event.get("handid"),
			"state": event.get("state") or {}
		}))
