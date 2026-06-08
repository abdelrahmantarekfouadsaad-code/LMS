from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from .models import Course, CourseGroup, ZoomSession, Unit, Resource, StudentProgress, Lesson, StudentMilestone, Certificate, Project, ProjectSubmission
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
    queryset = Course.objects.prefetch_related('groups__zoom_sessions', 'units__lessons', 'flat_lessons').filter(is_active=True)
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSupervisorOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        if user.role == 'STUDENT':
            # Assuming the user model has an `age_group` field
            age_group = getattr(user, 'age_group', None)
            if age_group:
                from django.db.models import Q
                qs = qs.filter(Q(target_age=age_group) | Q(target_age='ALL'))
            else:
                qs = qs.filter(target_age='ALL')
                
        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        
        if user.role == 'STUDENT':
            from payment.models import Subscription
            has_access = Subscription.objects.filter(
                user=user,
                course=instance,
                status='approved',
                is_active=True
            ).exists()
            
            if not has_access:
                return Response(
                    {"detail": "Content Locked - Please Subscribe", "code": "content_locked"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def enrolled(self, request):
        from payment.models import Subscription
        active_subs = Subscription.objects.filter(
            user=request.user,
            status='approved',
            is_active=True
        )
        enrolled_course_ids = active_subs.values_list('course_id', flat=True)
        courses = self.get_queryset().filter(id__in=enrolled_course_ids)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        data = request.data
        
        try:
            with transaction.atomic():
                # Handle potential empty strings from frontend
                price_val = data.get('price')
                if price_val in [None, '', '0']:
                    price_val = 0

                thumbnail_val = data.get('thumbnail')
                if not thumbnail_val:
                    thumbnail_val = None

                # Create Course
                course = Course.objects.create(
                    title=data.get('title'),
                    title_ar=data.get('title_ar'),
                    description=data.get('description'),
                    target_age=data.get('target_age', 'ALL'),
                    course_format=data.get('course_format', 'VIDEO_ONLY'),
                    course_structure=data.get('course_structure', 'SHORT_FLAT'),
                    price=price_val,
                    thumbnail=thumbnail_val,
                    instructor_name=data.get('instructor_name'),
                    duration=data.get('duration'),
                    color=data.get('color', 'from-blue-500/20 to-indigo-600/20')
                )

            # Create Groups & Zoom Sessions if any
            groups_data = data.get('groups', [])
            for group_data in groups_data:
                group = CourseGroup.objects.create(course=course, name=group_data.get('name'))
                for session_data in group_data.get('zoom_sessions', []):
                    ZoomSession.objects.create(
                        course_group=group,
                        title=session_data.get('title'),
                        scheduled_time=session_data.get('scheduled_time'),
                        meeting_link=session_data.get('meeting_link')
                    )

            # Create Units & Lessons based on structure
            if course.course_structure == 'LONG_NESTED':
                units_data = data.get('units', [])
                for idx, unit_data in enumerate(units_data):
                    unit = Unit.objects.create(
                        course=course, 
                        title=unit_data.get('title'), 
                        order=idx + 1
                    )
                    for lesson_idx, lesson_data in enumerate(unit_data.get('lessons', [])):
                        Lesson.objects.create(
                            unit=unit,
                            lesson_number=lesson_idx + 1,
                            title=lesson_data.get('title'),
                            video_url=lesson_data.get('video_url'),
                            pdf_attachment=lesson_data.get('pdf_attachment'),
                            is_quiz=lesson_data.get('is_quiz', False),
                            estimated_minutes=lesson_data.get('estimated_minutes', 0)
                        )
            else: # SHORT_FLAT
                flat_lessons_data = data.get('flat_lessons', [])
                for lesson_idx, lesson_data in enumerate(flat_lessons_data):
                    Lesson.objects.create(
                        course=course,
                        lesson_number=lesson_idx + 1,
                        title=lesson_data.get('title'),
                        video_url=lesson_data.get('video_url'),
                        pdf_attachment=lesson_data.get('pdf_attachment'),
                        is_quiz=lesson_data.get('is_quiz', False),
                        estimated_minutes=lesson_data.get('estimated_minutes', 0)
                    )

            serializer = self.get_serializer(course)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        course = self.get_object()
        data = request.data
        
        try:
            with transaction.atomic():
                price_val = data.get('price', course.price)
                if price_val in [None, '', '0']:
                    price_val = 0

                thumbnail_val = data.get('thumbnail', course.thumbnail)
                if not thumbnail_val:
                    thumbnail_val = None

                course.title = data.get('title', course.title)
                course.title_ar = data.get('title_ar', course.title_ar)
                course.description = data.get('description', course.description)
                course.target_age = data.get('target_age', course.target_age)
                course.course_format = data.get('course_format', course.course_format)
                course.course_structure = data.get('course_structure', course.course_structure)
                course.price = price_val
                course.thumbnail = thumbnail_val
                course.instructor_name = data.get('instructor_name', course.instructor_name)
                course.duration = data.get('duration', course.duration)
                course.color = data.get('color', course.color)
                course.is_upload_completed = data.get('is_upload_completed', course.is_upload_completed)
                course.save()

                course.groups.all().delete()
                groups_data = data.get('groups', [])
                for group_data in groups_data:
                    group = CourseGroup.objects.create(course=course, name=group_data.get('name'))
                    for session_data in group_data.get('zoom_sessions', []):
                        ZoomSession.objects.create(
                            course_group=group,
                            title=session_data.get('title'),
                            scheduled_time=session_data.get('scheduled_time'),
                            meeting_link=session_data.get('meeting_link')
                        )

                course.units.all().delete()
                course.flat_lessons.all().delete()
                
                if course.course_structure == 'LONG_NESTED':
                    units_data = data.get('units', [])
                    for idx, unit_data in enumerate(units_data):
                        unit = Unit.objects.create(
                            course=course, 
                            title=unit_data.get('title'), 
                            order=idx + 1
                        )
                        for lesson_idx, lesson_data in enumerate(unit_data.get('lessons', [])):
                            Lesson.objects.create(
                                unit=unit,
                                lesson_number=lesson_idx + 1,
                                title=lesson_data.get('title'),
                                video_url=lesson_data.get('video_url'),
                                pdf_attachment=lesson_data.get('pdf_attachment'),
                                is_quiz=lesson_data.get('is_quiz', False),
                                estimated_minutes=lesson_data.get('estimated_minutes', 0)
                            )
                else:
                    flat_lessons_data = data.get('flat_lessons', [])
                    for lesson_idx, lesson_data in enumerate(flat_lessons_data):
                        Lesson.objects.create(
                            course=course,
                            lesson_number=lesson_idx + 1,
                            title=lesson_data.get('title'),
                            video_url=lesson_data.get('video_url'),
                            pdf_attachment=lesson_data.get('pdf_attachment'),
                            is_quiz=lesson_data.get('is_quiz', False),
                            estimated_minutes=lesson_data.get('estimated_minutes', 0)
                        )

            serializer = self.get_serializer(course)
            return Response(serializer.data)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
