from django.db import models
from accounts.models import User, StudyGroup

class LiveSession(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'TEACHER'})
    study_group = models.ForeignKey(StudyGroup, related_name='live_sessions', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    scheduled_time = models.DateTimeField()
    
    # These fields can be blank initially and populated via Celery
    zoom_join_url = models.URLField(blank=True, null=True, max_length=1000)
    zoom_start_url = models.URLField(blank=True, null=True, max_length=1000)
    zoom_meeting_id = models.CharField(max_length=100, blank=True, null=True)
    zoom_passcode = models.CharField(max_length=50, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.study_group.name}"

class Attendance(models.Model):
    session = models.ForeignKey(LiveSession, related_name='attendances', on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'STUDENT'})
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f"{self.student.full_name} attended {self.session.title}"
