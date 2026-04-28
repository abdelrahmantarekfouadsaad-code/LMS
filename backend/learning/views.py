from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Course, Resource, StudentProgress, Lesson, StudentMilestone, Certificate, Project, ProjectSubmission
from .serializers import CourseSerializer, ResourceSerializer, StudentProgressSerializer, StudentMilestoneSerializer, CertificateSerializer, ProjectSerializer, ProjectSubmissionSerializer
from accounts.permissions import IsSuperAdmin, IsSupervisor

class IsAdminOrSupervisorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.role in ['SUPER_ADMIN', 'SUPERVISOR'])

class CourseViewSet(viewsets.ModelViewSet):
    """
    Course management. Only SuperAdmin/Supervisor can create/update.
    Students/Teachers can read.
    """
    queryset = Course.objects.prefetch_related('weeks__lessons').filter(is_active=True)
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSupervisorOrReadOnly]

class ResourceViewSet(viewsets.ModelViewSet):
    """
    Resources management. Only SuperAdmin/Supervisor can upload.
    Students/Teachers can read/download.
    """
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSupervisorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

class StudentProgressViewSet(viewsets.ModelViewSet):
    """
    Students mark lessons as completed.
    """
    queryset = StudentProgress.objects.all()
    serializer_class = StudentProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users only see their own progress, admins see all
        if self.request.user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return StudentProgress.objects.all()
        return StudentProgress.objects.filter(student=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_complete(self, request):
        lesson_id = request.data.get('lesson_id')
        try:
            lesson = Lesson.objects.get(id=lesson_id)
            progress, created = StudentProgress.objects.get_or_create(
                student=request.user, 
                lesson=lesson
            )
            if not progress.is_completed:
                progress.is_completed = True
                progress.completed_at = timezone.now()
                progress.save()
            return Response({'status': 'completed'}, status=status.HTTP_200_OK)
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)


class StudentMilestoneViewSet(viewsets.ModelViewSet):
    """
    Supervisors create and manage milestones for students' Evaluation Timeline (الغصون).
    Students can only read their own milestones.
    """
    serializer_class = StudentMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = StudentMilestone.objects.select_related('student', 'course', 'created_by')

        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            qs = qs.all()
        else:
            qs = qs.filter(student=user)

        # Allow filtering by course
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class CertificateViewSet(viewsets.ModelViewSet):
    """
    Certificates for students.
    """
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER']:
            return Certificate.objects.all()
        return Certificate.objects.filter(student=user)

class ProjectViewSet(viewsets.ModelViewSet):
    """
    Projects for students. Only Admin/Supervisor/Teacher can create/edit.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProjectSubmissionViewSet(viewsets.ModelViewSet):
    """
    Project Submissions.
    """
    serializer_class = ProjectSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER']:
            return ProjectSubmission.objects.all()
        return ProjectSubmission.objects.filter(student=user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)
