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


# --- OpenSSL-compatible AES Encryption (crypto-js compatible) ---
def _evp_bytes_to_key(password: bytes, salt: bytes, key_len=32, iv_len=16):
    """Derive key and IV using OpenSSL's EVP_BytesToKey with MD5.
    This matches crypto-js's default passphrase-based key derivation."""
    dtot = b''
    d = b''
    while len(dtot) < key_len + iv_len:
        d = hashlib.md5(d + password + salt).digest()
        dtot += d
    return dtot[:key_len], dtot[key_len:key_len + iv_len]


def encrypt_url(plain_text: str, passphrase: str) -> str:
    """Encrypt a string into a format that crypto-js AES.decrypt(ciphertext, passphrase) can decode.
    Output: Base64("Salted__" + 8-byte-salt + AES-CBC-ciphertext)"""
    salt = os.urandom(8)
    password = passphrase.encode('utf-8')
    key, iv = _evp_bytes_to_key(password, salt)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded = pad(plain_text.encode('utf-8'), AES.block_size)
    encrypted = cipher.encrypt(padded)
    return base64.b64encode(b'Salted__' + salt + encrypted).decode('utf-8')


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
        fields = ['id', 'name', 'zoom_sessions']

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
        if _get_ghost_mode():
            return encrypt_url(obj.video_url, settings.GHOST_SECRET_KEY)
        return obj.video_url

class UnitSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    class Meta:
        model = Unit
        fields = ['id', 'title', 'order', 'lessons']

class CourseSerializer(serializers.ModelSerializer):
    groups = CourseGroupSerializer(many=True, read_only=True)
    units = UnitSerializer(many=True, read_only=True)
    flat_lessons = LessonSerializer(many=True, read_only=True)
    is_ghost_mode = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'title_ar', 'description', 'target_age', 'course_format', 
            'course_structure', 'price', 'thumbnail', 'is_upload_completed', 
            'instructor_name', 'duration', 'color', 'is_active', 'groups', 'units', 
            'flat_lessons', 'created_at', 'is_ghost_mode'
        ]

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
