from django.db import models
from accounts.models import User

# --- LEARNING MODULES (STRICT RBAC: Super Admins & Supervisors ONLY) ---
class Course(models.Model):
    # Note: django-modeltranslation will gracefully handle translation for 'title' & 'description'
    title = models.CharField(max_length=255)
    title_ar = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    instructor = models.CharField(max_length=255, blank=True, null=True)
    duration = models.CharField(max_length=100, blank=True, null=True)
    color = models.CharField(max_length=100, default='from-blue-500/20 to-indigo-600/20')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Week(models.Model):
    course = models.ForeignKey(Course, related_name='weeks', on_delete=models.CASCADE)
    week_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)

    class Meta:
        ordering = ['week_number']
        unique_together = ('course', 'week_number')

    def __str__(self):
        return f"{self.course.title} - Week {self.week_number}: {self.title}"

class Lesson(models.Model):
    week = models.ForeignKey(Week, related_name='lessons', on_delete=models.CASCADE)
    lesson_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    video_url = models.URLField()
    estimated_minutes = models.PositiveIntegerField()

    class Meta:
        ordering = ['lesson_number']
        unique_together = ('week', 'lesson_number')

    def __str__(self):
        return f"{self.week.title} - Lesson {self.lesson_number}: {self.title}"

class StudentProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'STUDENT'})
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('student', 'lesson')

    def __str__(self):
        return f"{self.student.full_name} - {self.lesson.title} ({'Done' if self.is_completed else 'Pending'})"

# --- RESOURCES MODULE ---
class Resource(models.Model):
    title = models.CharField(max_length=255)
    course = models.ForeignKey(Course, related_name='resources', on_delete=models.CASCADE, null=True, blank=True)
    file_attachment = models.FileField(upload_to='resources/')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, limit_choices_to={'role__in': ['SUPER_ADMIN', 'SUPERVISOR']})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# --- EVALUATION TIMELINE (الغصون) ---
class StudentMilestone(models.Model):
    """Supervisor-created milestones for the Evaluation Timeline (الغصون).
    Each branch on the timeline represents a milestone tailored by the Supervisor."""
    class MilestoneType(models.TextChoices):
        ACHIEVEMENT = 'ACHIEVEMENT', 'Achievement'
        ASSESSMENT = 'ASSESSMENT', 'Assessment'
        CHECKPOINT = 'CHECKPOINT', 'Checkpoint'
        NOTE = 'NOTE', 'Supervisor Note'

    student = models.ForeignKey(User, on_delete=models.CASCADE,
                                related_name='milestones',
                                limit_choices_to={'role': 'STUDENT'})
    course = models.ForeignKey(Course, on_delete=models.CASCADE,
                               related_name='milestones')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    milestone_type = models.CharField(max_length=20,
                                      choices=MilestoneType.choices,
                                      default=MilestoneType.CHECKPOINT)
    milestone_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='created_milestones',
                                   limit_choices_to={'role__in': ['SUPERVISOR', 'SUPER_ADMIN']})
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['milestone_date']

    def __str__(self):
        return f"{self.student.full_name} - {self.title} ({'✅' if self.is_completed else '⏳'})"


# --- CERTIFICATES MODULE ---
class Certificate(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates', limit_choices_to={'role': 'STUDENT'})
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificates')
    title = models.CharField(max_length=255)
    description = models.TextField()
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='issued_certificates')
    issued_at = models.DateTimeField(auto_now_add=True)
    certificate_image = models.FileField(upload_to='certificates/', null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.student.full_name}"


# --- PROJECTS MODULE ---
class Project(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='projects/', null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ProjectSubmission(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_submissions', limit_choices_to={'role': 'STUDENT'})
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='submissions')
    drive_link = models.URLField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_graded = models.BooleanField(default=False)
    grade = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        unique_together = ('student', 'project')

    def __str__(self):
        return f"{self.student.full_name} - {self.project.title}"
