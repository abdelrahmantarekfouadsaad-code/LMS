from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LiveSession, Attendance
from .serializers import LiveSessionSerializer, AttendanceSerializer
from accounts.permissions import IsTeacher, IsSuperAdmin, IsSupervisor
from .tasks import create_zoom_meeting_task

class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.role in ['TEACHER', 'SUPER_ADMIN', 'SUPERVISOR'])

class LiveSessionViewSet(viewsets.ModelViewSet):
    """
    Teachers schedule live sessions.
    When created, triggers async Celery task to fetch Zoom API URLs.
    Students can read upcoming sessions for their study groups.
    """
    queryset = LiveSession.objects.all().order_by('-scheduled_time')
    serializer_class = LiveSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return LiveSession.objects.all().order_by('-scheduled_time')
        elif user.role == 'TEACHER':
            return LiveSession.objects.filter(teacher=user).order_by('-scheduled_time')
        elif user.role == 'STUDENT':
            # Only return sessions for the student's enrolled cohorts
            if hasattr(user, 'student_profile'):
                return LiveSession.objects.filter(study_group__in=user.student_profile.study_groups.all()).order_by('scheduled_time')
            return LiveSession.objects.none()
        return LiveSession.objects.none()

    def perform_create(self, serializer):
        # 1. Save the initial session details
        session = serializer.save(teacher=self.request.user)
        
        # 2. Fire the async task to communicate with Zoom
        create_zoom_meeting_task.delay(session.id)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def attend(self, request, pk=None):
        """
        Students hit this endpoint when they click 'Join Zoom Class'
        to track their attendance before being redirected.
        """
        if request.user.role != 'STUDENT':
            return Response({"error": "Only students can mark attendance."}, status=status.HTTP_403_FORBIDDEN)
            
        session = self.get_object()
        
        attendance, created = Attendance.objects.get_or_create(
            session=session,
            student=request.user
        )
        
        return Response(AttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)

class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View attendance records. Teachers see their sessions, Parents see their kids.
    """
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return Attendance.objects.all()
        elif user.role == 'TEACHER':
            return Attendance.objects.filter(session__teacher=user)
        elif user.role == 'PARENT':
            # Assuming parent viewing their children's profiles
            children_users = user.children_profiles.all().values_list('user', flat=True)
            return Attendance.objects.filter(student__in=children_users)
        return Attendance.objects.filter(student=user)
