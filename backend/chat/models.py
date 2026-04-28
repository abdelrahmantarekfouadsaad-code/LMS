import uuid
from django.db import models
from accounts.models import User, StudyGroup

class ChatRoom(models.Model):
    class RoomType(models.TextChoices):
        COMPLAINT = 'COMPLAINT', 'Complaint / Tech Support'
        HOMEWORK = 'HOMEWORK', '1-on-1 Homework'
        COMMUNITY = 'COMMUNITY', 'Global Community Forum'
        TEACHER_FORUM = 'TEACHER_FORUM', 'Teachers-Only Forum'
        # Phase 3: Community Matrix tiers
        AGE_GROUP = 'AGE_GROUP', 'Age-Group Room'
        COURSE = 'COURSE', 'Course-Specific Room'
        PRIVATE = 'PRIVATE', 'Private 1-on-1 Chat'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_type = models.CharField(max_length=20, choices=RoomType.choices)
    participants = models.ManyToManyField(User, related_name='chat_rooms')
    study_group = models.ForeignKey(StudyGroup, on_delete=models.SET_NULL, null=True, blank=True)
    # Phase 3: Multi-tier community targeting fields
    age_group = models.CharField(max_length=20, choices=User.AgeGroup.choices, blank=True, null=True)
    course = models.ForeignKey('learning.Course', on_delete=models.CASCADE, null=True, blank=True, related_name='chat_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.get_room_type_display()} - {self.id}"

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(blank=True)
    file_attachment = models.FileField(upload_to='chat_files/', null=True, blank=True)
    voice_note = models.FileField(upload_to='chat_voice_notes/', null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(User, related_name='read_messages', blank=True)

    def __str__(self):
        return f"Msg from {self.sender.full_name} in {self.room.id}"
