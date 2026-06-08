from django.db import models
from accounts.models import User

# --- LEARNING MODULES (STRICT RBAC: Super Admins & Supervisors ONLY) ---
class Course(models.Model):
    class TargetAge(models.TextChoices):
        CHILDREN = 'CHILDREN', 'Children'
        TWEENS = 'TWEENS', 'Tweens'
        TEENS = 'TEENS', 'Teens'
        ALL = 'ALL', 'All Ages'

    class CourseFormat(models.TextChoices):
        ZOOM_ONLY = 'ZOOM_ONLY', 'Zoom Only'
        VIDEO_ONLY = 'VIDEO_ONLY', 'Video Only'
        HYBRID = 'HYBRID', 'Hybrid'

    class CourseStructure(models.TextChoices):
        SHORT_FLAT = 'SHORT_FLAT', 'Short (Flat)'
        LONG_NESTED = 'LONG_NESTED', 'Long (Nested)'

    # Note: django-modeltranslation will gracefully handle translation for 'title' & 'description'
    title = models.CharField(max_length=255)
    title_ar = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField()
    target_age = models.CharField(max_length=20, choices=TargetAge.choices, default=TargetAge.ALL)
    course_format = models.CharField(max_length=20, choices=CourseFormat.choices, default=CourseFormat.VIDEO_ONLY)
    course_structure = models.CharField(max_length=20, choices=CourseStructure.choices, default=CourseStructure.SHORT_FLAT)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    thumbnail = models.URLField(blank=True, null=True)
    is_upload_completed = models.BooleanField(default=False)
    instructor_name = models.CharField(max_length=255, blank=True, null=True, default="أكاديمية نور النبوة")
    duration = models.CharField(max_length=100, blank=True, null=True)
    color = models.CharField(max_length=100, default='from-blue-500/20 to-indigo-600/20')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class CourseGroup(models.Model):
    course = models.ForeignKey(Course, related_name='groups', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    
    def __str__(self):
        return f"{self.course.title} - {self.name}"

class ZoomSession(models.Model):
    course_group = models.ForeignKey(CourseGroup, related_name='zoom_sessions', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    scheduled_time = models.DateTimeField(null=True, blank=True)
    meeting_link = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.course_group.name} - {self.title}"

class Unit(models.Model):
    course = models.ForeignKey(Course, related_name='units', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} - Unit {self.order}: {self.title}"

class Lesson(models.Model):
    course = models.ForeignKey(Course, related_name='flat_lessons', on_delete=models.CASCADE, null=True, blank=True)
    unit = models.ForeignKey(Unit, related_name='lessons', on_delete=models.CASCADE, null=True, blank=True)
    lesson_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    video_url = models.URLField(blank=True, null=True)
    pdf_attachment = models.URLField(blank=True, null=True)
    is_quiz = models.BooleanField(default=False)
    estimated_minutes = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['lesson_number']

    def __str__(self):
        return f"Lesson {self.lesson_number}: {self.title}"

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

