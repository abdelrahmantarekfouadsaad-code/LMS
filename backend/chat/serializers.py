from rest_framework import serializers
from .models import ChatRoom, Message
from accounts.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'sender_details', 'content', 'file_attachment', 'voice_note', 'timestamp']
        read_only_fields = ['sender', 'timestamp']

class ChatRoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True, default=None)
    participant_names = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'room_type', 'study_group', 'age_group', 'course',
            'course_title', 'participant_names', 'created_at', 'is_active', 'messages'
        ]

    def get_participant_names(self, obj):
        return list(obj.participants.values_list('full_name', flat=True))
