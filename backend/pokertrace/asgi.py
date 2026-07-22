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
