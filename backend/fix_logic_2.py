import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from learning.models import Lesson, StudentProgress

users = User.objects.all()
lessons = Lesson.objects.all()

for lesson in lessons:
    for user in users:
        # Enrol all users regardless of role for testing purposes
        progress, created = StudentProgress.objects.get_or_create(student=user, lesson=lesson)
        if created:
            print(f"Enrolled {user.email} into {lesson.title}")

print("Logic fix script finished.")
