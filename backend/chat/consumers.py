import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import ChatRoom, Message
from accounts.models import User

class BaseChatConsumer(AsyncWebsocketConsumer):
    """
    Base consumer containing utility methods for DB access and standard event sending.
    """
    @database_sync_to_async
    def save_message(self, room_id, sender, content, attachment_url=None, voice_note_url=None):
        room = ChatRoom.objects.get(id=room_id)
        msg = Message.objects.create(
            room=room,
            sender=sender,
            content=content
        )
        # Note: Actual file uploads via WS are complex and usually handled via HTTP, 
        # but the JSON payload can reference an S3/Media URL uploaded previously via REST.
        return msg

    @database_sync_to_async
    def verify_room_access(self, room_id, user):
        try:
            room = ChatRoom.objects.get(id=room_id)
            return room.participants.filter(id=user.id).exists()
        except ChatRoom.DoesNotExist:
            return False

class ComplaintsConsumer(BaseChatConsumer):
    """
    Routes users to the active complaints support channel.
    """
    async def connect(self):
        self.user = self.scope["user"]
        if self.user == AnonymousUser():
            await self.close()
            return

        # Simple grouping for tech support
        self.room_group_name = 'complaints_queue'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message')
        # In a real system, you'd route to a specific tech agent room dynamically.
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': self.user.full_name
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender']
        }))

class HomeworkConsumer(BaseChatConsumer):
    """
    1-on-1 private Teacher-Student chat handling JSON attachment payloads.
    """
    async def connect(self):
        self.user = self.scope["user"]
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        
        if self.user == AnonymousUser():
            await self.close()
            return
            
        has_access = await self.verify_room_access(self.room_id, self.user)
        if not has_access:
            await self.close()
            return

        self.room_group_name = f'homework_{self.room_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get('message', '')
        attachment_url = data.get('attachment_url')
        voice_note_url = data.get('voice_note_url')

        # Persist to DB
        msg = await self.save_message(self.room_id, self.user, content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': content,
                'attachment_url': attachment_url,
                'voice_note_url': voice_note_url,
                'sender': self.user.full_name,
                'msg_id': msg.id
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'attachment_url': event.get('attachment_url'),
            'voice_note_url': event.get('voice_note_url'),
            'sender': event['sender'],
            'msg_id': event['msg_id']
        }))

class CommunityConsumer(BaseChatConsumer):
    """
    Cohort-based real-time group chat.
    """
    async def connect(self):
        self.user = self.scope["user"]
        self.study_group_id = self.scope['url_route']['kwargs']['study_group_id']
        
        if self.user == AnonymousUser():
            await self.close()
            return

        self.room_group_name = f'community_{self.study_group_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': self.user.full_name
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender']
        }))
