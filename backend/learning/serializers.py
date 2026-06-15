import os
import hashlib
import base64

from rest_framework import serializers
from django.conf import settings
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

from .models import (
    Course, CourseGroup, ZoomSession, Unit, Lesson, Resource,
    StudentProgress, StudentMilestone, Certificate, Project,
    ProjectSubmission, Announcement, GlobalSettings
)


def encrypt_url(raw_url):
    if not raw_url:
        return raw_url
    try:
        # Explicit AES-256-CBC with strict IV prepending
        key = hashlib.sha256(settings.GHOST_SECRET_KEY.encode('utf-8')).digest()
        iv = os.urandom(16)
        cipher = AES.new(key, AES.MODE_CBC, iv)
        ct_bytes = cipher.encrypt(pad(raw_url.encode('utf-8'), AES.block_size))
        return base64.b64encode(iv + ct_bytes).decode('utf-8')
    except Exception as e:
        return raw_url


def _get_ghost_mode():
    """Safely check if ghost mode is enabled, with fallback for pre-migration state."""
    try:
        return GlobalSettings.load().ghost_mode_enabled
    except Exception:
        return False


# --- Serializers ---

class ZoomSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZoomSession
        fields = ['id', 'title', 'scheduled_time', 'meeting_link']

class CourseGroupSerializer(serializers.ModelSerializer):
    zoom_sessions = ZoomSessionSerializer(many=True, read_only=True)
    class Meta:
        model = CourseGroup
        fields = ['id', 'name', 'official_day', 'official_time', 'capacity', 'primary_teacher', 'zoom_sessions']

class LessonSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    is_ghost_mode = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'lesson_number', 'title', 'video_url', 'pdf_attachment', 'is_quiz', 'estimated_minutes', 'is_ghost_mode']

    def get_is_ghost_mode(self, obj):
        return _get_ghost_mode()

    def get_video_url(self, obj):
        if not obj.video_url:
            return None

        request = self.context.get('request')
        # Privileged users always get raw URLs to prevent DB corruption on save
        is_privileged = False
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.is_superuser or getattr(request.user, 'role', '') in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER']:
                is_privileged = True

        # ONLY encrypt for regular students when ghost mode is ON
        if _get_ghost_mode() and not is_privileged:
            return encrypt_url(obj.video_url)
        return obj.video_url

class UnitSerializer(serializers.ModelSerializer):
    lessons = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = ['id', 'title', 'order', 'lessons']

    def get_lessons(self, obj):
        return LessonSerializer(obj.lessons.all(), many=True, context=self.context).data

class CourseSerializer(serializers.ModelSerializer):
    groups = CourseGroupSerializer(many=True, read_only=True)
    units = UnitSerializer(many=True, read_only=True)
    flat_lessons = serializers.SerializerMethodField()
    is_ghost_mode = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'title_ar', 'description', 'target_age_min', 'target_age_max', 'course_format', 
            'course_structure', 'price', 'thumbnail', 'is_upload_completed', 
            'instructor_name', 'duration', 'color', 'is_active', 'groups', 'units', 
            'flat_lessons', 'created_at', 'is_ghost_mode'
        ]

    def get_flat_lessons(self, obj):
        return LessonSerializer(obj.flat_lessons.all(), many=True, context=self.context).data

    def get_is_ghost_mode(self, obj):
        return _get_ghost_mode()

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'title', 'course', 'file_attachment', 'uploaded_by', 'created_at']
        read_only_fields = ['uploaded_by', 'created_at']

class StudentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProgress
        fields = ['id', 'student', 'lesson', 'is_completed', 'completed_at']
        read_only_fields = ['student', 'completed_at']


class StudentMilestoneSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default=None)

    class Meta:
        model = StudentMilestone
        fields = [
            'id', 'student', 'course', 'title', 'description',
            'milestone_type', 'milestone_date', 'is_completed',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']

class CertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.full_name', read_only=True)

    class Meta:
        model = Certificate
        fields = ['id', 'student', 'course', 'course_title', 'title', 'description', 'issued_by', 'issued_by_name', 'issued_at', 'certificate_image']
        read_only_fields = ['issued_at', 'issued_by']

class ProjectSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'image', 'course', 'course_title', 'due_date', 'created_at']
        read_only_fields = ['created_at']

class ProjectSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = ProjectSubmission
        fields = ['id', 'student', 'student_name', 'project', 'project_title', 'drive_link', 'submitted_at', 'is_graded', 'grade']
        read_only_fields = ['student', 'submitted_at', 'is_graded', 'grade']

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'image_url', 'is_active', 'created_at']
        read_only_fields = ['created_at']
