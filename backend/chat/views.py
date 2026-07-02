from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
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
            try:
                room_id = int(room_id)
            except (ValueError, TypeError):
                return Message.objects.none()
            return Message.objects.filter(room_id=room_id, room__participants=self.request.user).order_by('timestamp')
        return Message.objects.filter(room__participants=self.request.user).order_by('timestamp')

    def perform_create(self, serializer):
        room = serializer.validated_data.get('room')
        if room and not room.participants.filter(id=self.request.user.id).exists():
            raise PermissionDenied("You are not a participant of this room.")
        serializer.save(sender=self.request.user)
