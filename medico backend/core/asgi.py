import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.middleware import BaseMiddleware
from django.core.asgi import get_asgi_application

# 1️⃣ Configure settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

# 2️⃣ Initialize Django apps
django.setup()

# 3️⃣ Lazy imports after setup
from accounts.routing import websocket_urlpatterns
from accounts.middleware import JWTAuthMiddleware

# 4️⃣ ASGI application
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": BaseMiddleware(
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
