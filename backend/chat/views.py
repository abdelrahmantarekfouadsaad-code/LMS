from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer

class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatRoom.objects.filter(participants=self.request.user)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Allow fetching messages by room if room_id passed
        room_id = self.request.query_params.get('room_id')
        if room_id:
            return Message.objects.filter(room_id=room_id, room__participants=self.request.user).order_by('timestamp')
        return Message.objects.filter(room__participants=self.request.user).order_by('timestamp')

    def perform_create(self, serializer):
        # We assume room ID is passed in the serializer data payload
        serializer.save(sender=self.request.user)
