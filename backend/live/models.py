from django.db import models
from accounts.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class VirtualSession(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'TEACHER'})
    course_group = models.ForeignKey('learning.CourseGroup', related_name='virtual_sessions', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    scheduled_time = models.DateTimeField()
    
    # These fields can be blank initially and populated via Celery
    zoom_join_url = models.URLField(blank=True, null=True, max_length=1000)
    zoom_start_url = models.URLField(blank=True, null=True, max_length=1000)
    zoom_meeting_id = models.CharField(max_length=100, blank=True, null=True)
    zoom_passcode = models.CharField(max_length=50, blank=True, null=True)
    
    meeting_link = models.URLField(blank=True, null=True, max_length=1000)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.course_group.name}"

class Attendance(models.Model):
    session = models.ForeignKey(VirtualSession, related_name='attendances', on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'STUDENT'})
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f"{self.student.full_name} attended {self.session.title}"

class SessionFeedback(models.Model):
    session = models.ForeignKey(VirtualSession, related_name='feedbacks', on_delete=models.CASCADE)
    student = models.ForeignKey(User, related_name='given_feedbacks', on_delete=models.CASCADE, limit_choices_to={'role': 'STUDENT'})
    teacher = models.ForeignKey(User, related_name='received_feedbacks', on_delete=models.CASCADE, limit_choices_to={'role': 'TEACHER'})
    
    q1_rating = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    q2_rating = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    q3_rating = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    q4_rating = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    q5_rating = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    q6_rating = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    q7_rating = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    q8_rating = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    q9_rating = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    text_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.session.title} by {self.student.full_name}"
