"""
ASGI config for pokertrace project.

支援 HTTP + WebSocket (channels)
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE","pokertrace.settings")

# Django 必須先 setup 才能 import channels routing
django_asgi_app=get_asgi_application()

from channels.routing import ProtocolTypeRouter,URLRouter
from .routing import websocket_urlpatterns

application=ProtocolTypeRouter({
	"http": django_asgi_app,
	"websocket": URLRouter(websocket_urlpatterns)
})

# 背景排程 (TASK-028)。放在最後、Django setup 之後才 import,
# 因為 schedulerjob 會用到 api.initialize 的 DB 設定。
#
# 這裡每個 uvicorn worker 都會各起一份 (預設 6 個)。重複發送不是靠
# 「只讓一個 worker 起排程」來擋 (那在多行程下本來就做不到),
# 而是靠 session.startnotifiedtime 的原子認領, 見 api/schedulerjob.py 檔頭。
#
# 整段包 try/except: 排程起不來時後端仍要能正常提供服務。
try:
	from api.schedulerjob import startscheduler
	startscheduler()
except Exception as error:
	print("[asgi] scheduler not started: %s"%error)
