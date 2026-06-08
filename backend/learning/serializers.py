from rest_framework import serializers
from .models import Course, CourseGroup, ZoomSession, Unit, Lesson, Resource, StudentProgress, StudentMilestone, Certificate, Project, ProjectSubmission

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
    class Meta:
        model = Lesson
        fields = ['id', 'lesson_number', 'title', 'video_url', 'pdf_attachment', 'is_quiz', 'estimated_minutes']

class UnitSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    class Meta:
        model = Unit
        fields = ['id', 'title', 'order', 'lessons']

class CourseSerializer(serializers.ModelSerializer):
    groups = CourseGroupSerializer(many=True, read_only=True)
    units = UnitSerializer(many=True, read_only=True)
    flat_lessons = LessonSerializer(many=True, read_only=True)
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'title_ar', 'description', 'target_age', 'course_format', 
            'course_structure', 'price', 'thumbnail', 'is_upload_completed', 
            'instructor_name', 'duration', 'color', 'is_active', 'groups', 'units', 
            'flat_lessons', 'created_at'
        ]

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
