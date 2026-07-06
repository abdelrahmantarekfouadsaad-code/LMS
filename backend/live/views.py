from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VirtualSession, Attendance, SessionFeedback
from .serializers import VirtualSessionSerializer, AttendanceSerializer, SessionFeedbackSerializer
from accounts.permissions import IsTeacher, IsSuperAdmin, IsSupervisor

class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.role in ['TEACHER', 'SUPER_ADMIN', 'SUPERVISOR'])

from rest_framework.exceptions import PermissionDenied

class VirtualSessionViewSet(viewsets.ModelViewSet):
    queryset = VirtualSession.objects.all().order_by('-scheduled_time')
    serializer_class = VirtualSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return VirtualSession.objects.all().order_by('-scheduled_time')
        elif user.role == 'TEACHER':
            return VirtualSession.objects.filter(teacher=user).order_by('-scheduled_time')
        elif user.role == 'STUDENT':
            if hasattr(user, 'student_profile'):
                return VirtualSession.objects.filter(course_group__in=user.student_profile.course_groups.all()).order_by('scheduled_time')
            return VirtualSession.objects.none()
        return VirtualSession.objects.none()

    def perform_create(self, serializer):
        course_group = serializer.validated_data.get('course_group')
        scheduled_time = serializer.validated_data.get('scheduled_time')
        
        if course_group and scheduled_time:
            import pytz
            from django.utils import timezone
            cairo_tz = pytz.timezone("Africa/Cairo")
            
            # Ensure scheduled_time is timezone-aware before converting
            if timezone.is_naive(scheduled_time):
                scheduled_time = cairo_tz.localize(scheduled_time)
            
            local_time = scheduled_time.astimezone(cairo_tz)
            if local_time.weekday() != course_group.official_day:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"scheduled_time": f"Session must be scheduled on {course_group.get_official_day_display()} in Africa/Cairo time."})

        session = serializer.save(teacher=self.request.user)
        
        # Generate Jitsi Link natively
        import uuid
        jitsi_link = f"https://meet.jit.si/NourAlNubuwwah_{session.course_group.id}_{uuid.uuid4().hex[:8]}"
        session.meeting_link = jitsi_link
        session.save(update_fields=['meeting_link'])

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start_jitsi(self, request, pk=None):
        session = self.get_object()
        
        if request.user != session.teacher and request.user.role not in ['SUPER_ADMIN', 'SUPERVISOR']:
            return Response({"error": "Only the assigned teacher can start this session."}, status=status.HTTP_403_FORBIDDEN)
            
        # Generate Jitsi Link natively
        import uuid
        jitsi_link = f"https://meet.jit.si/NourAlNubuwwah_{session.course_group.id}_Session_{session.id}"
        session.meeting_link = jitsi_link
        session.save(update_fields=['meeting_link'])
        
        return Response({"meeting_link": jitsi_link}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def attend(self, request, pk=None):
        if request.user.role != 'STUDENT':
            return Response({"error": "Only students can mark attendance."}, status=status.HTTP_403_FORBIDDEN)
            
        session = self.get_object()
        
        # Verify the student is enrolled in the session's course group
        if not hasattr(request.user, 'student_profile') or \
           not request.user.student_profile.course_groups.filter(id=session.course_group.id).exists():
            return Response(
                {"error": "You are not enrolled in this course group."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        attendance, created = Attendance.objects.get_or_create(
            session=session,
            student=request.user
        )
        
        return Response(AttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)

class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return Attendance.objects.all()
        elif user.role == 'TEACHER':
            return Attendance.objects.filter(session__teacher=user)
        elif user.role == 'PARENT':
            children_users = user.children_profiles.all().values_list('user', flat=True)
            return Attendance.objects.filter(student__in=children_users)
        return Attendance.objects.filter(student=user)

class SessionFeedbackViewSet(viewsets.ModelViewSet):
    queryset = SessionFeedback.objects.all()
    serializer_class = SessionFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return SessionFeedback.objects.all()
        elif user.role == 'TEACHER':
            return SessionFeedback.objects.filter(teacher=user)
        elif user.role == 'STUDENT':
            return SessionFeedback.objects.filter(student=user)
        return SessionFeedback.objects.none()

    def perform_create(self, serializer):
        session = serializer.validated_data.get('session')
        
        # Verify the student actually attended this session
        if not Attendance.objects.filter(session=session, student=self.request.user).exists():
            raise PermissionDenied("You must attend the session before submitting feedback.")
        
        serializer.save(student=self.request.user, teacher=session.teacher)
