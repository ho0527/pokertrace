# WebSocket 路由
from django.urls import re_path
from api.timerwebsocket import TimerWebsocket,HandWebsocket

websocket_urlpatterns=[
	re_path(r"^ws/timer/(?P<sessionid>[^/]+)/?$",TimerWebsocket.as_asgi()),
	re_path(r"^ws/hand/(?P<sessionid>[^/]+)/?$",HandWebsocket.as_asgi())
]
