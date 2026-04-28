import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError

class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.SUPER_ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Core User Model implementing the 6-tier RBAC system.
    """
    class Role(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
        TECH_SUPPORT = 'TECH_SUPPORT', 'Technical Support'
        SUPERVISOR = 'SUPERVISOR', 'Supervisor'
        TEACHER = 'TEACHER', 'Teacher'
        STUDENT = 'STUDENT', 'Student'
        PARENT = 'PARENT', 'Parent'
        GUEST = 'GUEST', 'Guest'

    class AgeGroup(models.TextChoices):
        CHILDREN = 'CHILDREN', '6-10 years (أطفال)'
        TWEENS = 'TWEENS', '11-12 years (البراعم الناضجة)'
        TEENS = 'TEENS', '13-20 years (البالغون)'

    # Remove the username field in favor of email
    username = None
    email = models.EmailField(unique=True, db_index=True)
    
    # Core RBAC Role Assignment
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT, db_index=True)
    
    # Onboarding Fields
    is_onboarded = models.BooleanField(default=False)
    age_group = models.CharField(max_length=20, choices=AgeGroup.choices, blank=True, null=True)
    exact_age = models.PositiveIntegerField(blank=True, null=True)
    
    # Universal Fields
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()})"

    @property
    def is_teacher(self):
        return self.role == self.Role.TEACHER

    @property
    def is_student(self):
        return self.role == self.Role.STUDENT

    @property
    def is_supervisor(self):
        return self.role in [self.Role.SUPERVISOR, self.Role.SUPER_ADMIN]


class StudyGroup(models.Model):
    """
    Represents a Cohort/Class mapping a Teacher to multiple Students.
    """
    name = models.CharField(max_length=100) # e.g., "Noor Al-Bayan - Batch 1"
    course = models.ForeignKey(
        'learning.Course', # Lazy reference to Course model in 'learning' app
        on_delete=models.CASCADE, 
        related_name='study_groups'
    )
    primary_teacher = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        limit_choices_to={'role': User.Role.TEACHER}, 
        related_name='assigned_groups'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class StudentProfile(models.Model):
    """
    Strictly isolated profile for Student specific data.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    parents = models.ManyToManyField(
        User, 
        related_name='children_profiles', 
        limit_choices_to={'role': User.Role.PARENT},
        blank=True
    )
    study_groups = models.ManyToManyField(StudyGroup, related_name='students', blank=True)
    parent_email = models.EmailField(blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)

    # NOTE FOR DRF SERIALIZATION: 
    # When creating a Teacher's view for their students, the serializer MUST ONLY
    # access `StudentProfile.user.full_name`. Do NOT serialize `user.email` or `user.phone_number`.

    def __str__(self):
        return f"Student: {self.user.full_name}"


class TeacherProfile(models.Model):
    """
    Profile for Teacher specific public and private data.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    bio = models.TextField(blank=True)
    specialization = models.CharField(max_length=100)
    
    def __str__(self):
        return f"Teacher: {self.user.full_name}"
