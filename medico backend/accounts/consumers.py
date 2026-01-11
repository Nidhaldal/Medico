import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync , sync_to_async
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Thread, Message, UserLink
from .serializers import MessageSerializer

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        self.thread_id = self.scope["url_route"]["kwargs"]["thread_id"]

        print(f"🔌 [CONNECT] Attempting connection for thread {self.thread_id} by user {self.user}")

        if not self.user or self.user.is_anonymous:
            print("❌ [CONNECT] Rejected: Anonymous or unauthenticated user")
            await self.close()
            return

        self.thread = await sync_to_async(self.get_thread)()
        if not self.thread:
            print(f"❌ [CONNECT] Rejected: Thread {self.thread_id} not found")
            await self.close()
            return

        if not await sync_to_async(self.is_participant)():
            print(f"❌ [CONNECT] Rejected: {self.user} not participant in thread {self.thread_id}")
            await self.close()
            return

        if not await sync_to_async(self.has_accepted_link)():
            print(f"❌ [CONNECT] Rejected: Link not accepted between participants in thread {self.thread_id}")
            await self.close()
            return

        self.room_group_name = f"chat_{self.thread_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        print(f"✅ [CONNECT] {self.user} connected to {self.room_group_name}")

        unread_messages = await sync_to_async(
            lambda: list(self.thread.messages.exclude(read_by=self.user))
        )()

        print(f"📨 [UNREAD] Sending {len(unread_messages)} unread messages to {self.user}")

        for msg in unread_messages:
            read_by_ids = await sync_to_async(lambda: list(msg.read_by.values_list("id", flat=True)))()
            await self.send(
                text_data=json.dumps({
                    "id": msg.id,
                    "thread": msg.thread.id,
                    "sender_id": await sync_to_async(lambda: msg.sender.id)(),
                    "sender_username": await sync_to_async(lambda: msg.sender.username)(),
                    "message": msg.text,
                    "created_at": msg.created_at.isoformat(),
                    "read_by": read_by_ids,
                    "tempId": None,
                })
            )

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            print(f"🔌 [DISCONNECT] {self.user} disconnected from {self.room_group_name}")
        else:
            print("⚠️ [DISCONNECT] No room group to discard (probably failed early connect)")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_text = data.get("message", "").strip()
            temp_id = data.get("tempId")
        except Exception as e:
            print(f"❌ [RECEIVE] Invalid JSON: {e}")
            return

        if not message_text:
            print("⚠️ [RECEIVE] Empty message ignored")
            return

        print(f"💬 [RECEIVE] Message from {self.user}: {message_text}")

        message = await sync_to_async(self.save_message)(message_text)

        read_by_ids = await sync_to_async(lambda: list(message.read_by.values_list("id", flat=True)))()

        serialized_message = {
            "id": message.id,
            "thread": message.thread.id,
            "sender_id": message.sender.id,
            "sender_username": message.sender.username,
            "message": message.text,
            "created_at": message.created_at.isoformat(),
            "read_by": read_by_ids,
            "tempId": temp_id,
        }

        print(f"📤 [BROADCAST] Message {message.id} from {self.user} to group {self.room_group_name}")

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat_message", "message": serialized_message},
        )

    async def chat_message(self, event):
        message = event["message"]
        print(f"📩 [SEND] Sending message {message['id']} to {self.user}")
        await self.send(text_data=json.dumps(message))

    async def read_receipt(self, event):
        print(f"👁 [READ] User {event['user_id']} read messages {event['message_ids']}")
        await self.send(text_data=json.dumps({
            "type": "read_receipt",
            "user_id": event["user_id"],
            "message_ids": event["message_ids"],
        }))

    def get_thread(self):
        try:
            return Thread.objects.get(id=self.thread_id)
        except Thread.DoesNotExist:
            return None

    def is_participant(self):
        return self.user in self.thread.participants.all()

    def has_accepted_link(self):
        other_users = self.thread.participants.exclude(id=self.user.id)
        for other in other_users:
            if not UserLink.objects.filter(
                Q(from_user=self.user, to_user=other) | Q(from_user=other, to_user=self.user),
                status="accepted",
            ).exists():
                return False
        return True

    def save_message(self, text):
        msg = Message.objects.create(thread=self.thread, sender=self.user, text=text)
        msg.read_by.add(self.user)
        return msg
      
class AppointmentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or user.is_anonymous:
            await self.close()
            return

        self.group_name = f"appointments_user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()
        await self.send(json.dumps({
            "message": f"Connected to appointment notifications for user {user.id}!"
        }))

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def appointment_event(self, event):
        # Send event to client
        await self.send(json.dumps({
            "event": event["event"],
            "appointment": event["appointment"],
            "target": event.get("target", "unknown"),
        }))



def notify_appointment(user_id, event_type, appointment_data, target=None):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"appointments_user_{user_id}",
        {
            "type": "appointment_event",
            "event": event_type,
            "appointment": appointment_data,
            "target": target or "user",  # patient | doctor
        }
    )
