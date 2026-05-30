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
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from function.sql import query
from .initialize import SETTING
from .timer import buildtimerstate


def normalizetimerstate(stateval):
	if stateval is None:
		return {}

	if isinstance(stateval,str):
		try:
			return json.loads(stateval)
		except Exception as error:
			return {}

	return stateval


class TimerWebsocket(AsyncWebsocketConsumer):
	async def connect(self):
		self.sessionid=self.scope["url_route"]["kwargs"]["sessionid"]
		self.groupname="timer_"+str(self.sessionid)

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
		state=buildtimerstate(self.sessionid)
		if state:
			return state
		return {}
