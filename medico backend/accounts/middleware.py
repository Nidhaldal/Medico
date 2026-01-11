import logging
from urllib.parse import parse_qs
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)

# -----------------------------
# Lazy DB helper
# -----------------------------
@database_sync_to_async
def get_user(user_id: int):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None


# -----------------------------
# JWT Auth Middleware
# -----------------------------
class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        from django.contrib.auth.models import AnonymousUser
        from rest_framework_simplejwt.tokens import AccessToken, TokenError

        token = None
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)

        if "token" in query_params:
            token = query_params["token"][0]

        user = None
        if token:
            try:
                access_token = AccessToken(token)
                user_id = access_token["user_id"]
                user = await get_user(user_id)
                if user is None:
                    logger.warning(f"JWTAuthMiddleware: User {user_id} not found")
                else:
                    logger.info(f"JWTAuthMiddleware: Authenticated user {user_id}")
            except TokenError as e:
                logger.warning(f"JWTAuthMiddleware: Invalid token → {str(e)}")
            except Exception as e:
                logger.error(f"JWTAuthMiddleware: Unexpected error → {str(e)}")
        else:
            logger.info("JWTAuthMiddleware: No token provided in query string")

        if not user:
            user = AnonymousUser()
            logger.info("JWTAuthMiddleware: Using AnonymousUser")

        scope["user"] = user

        logger.info(f"JWTAuthMiddleware: WS connect attempt for user {getattr(user, 'id', 'Anonymous')}")

        return await self.app(scope, receive, send)
