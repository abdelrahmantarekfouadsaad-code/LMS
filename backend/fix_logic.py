import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from chat.models import ChatRoom
from learning.models import Lesson, StudentProgress

print("Starting logic fix script...")

users = User.objects.all()

# 1. ChatRoom Mapping
rooms = ChatRoom.objects.all()
if not rooms.exists():
    print("No ChatRooms found. Creating one...")
    room, _ = ChatRoom.objects.get_or_create(room_type='COMMUNITY')
    rooms = [room]

for room in rooms:
    for user in users:
        room.participants.add(user)
        print(f"Added user {user.email} to room {room.id}")

# 2. Enrolling all users into lessons
lessons = Lesson.objects.all()
for lesson in lessons:
    # Set empty video URL to trigger native player fallback
    lesson.video_url = ""
    lesson.save()

    for user in users:
        # Enrol users if role == 'STUDENT' or maybe all users
        if user.role == 'STUDENT':
            progress, created = StudentProgress.objects.get_or_create(student=user, lesson=lesson)
            if created:
                print(f"Enrolled {user.email} into {lesson.title}")

print("Logic fix script finished.")
