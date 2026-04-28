import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from chat.models import ChatRoom

student = User.objects.get(email="student@noor.edu")
teacher = User.objects.get(email="teacher@noor.edu")

room, _ = ChatRoom.objects.get_or_create(room_type='COMMUNITY')
room.participants.add(student, teacher)
print("ChatRoom created/updated:", room.id)
