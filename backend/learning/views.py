from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from .models import Course, CourseGroup, ZoomSession, Unit, Resource, StudentProgress, Lesson, StudentMilestone, Certificate, Project, ProjectSubmission, Announcement, GlobalSettings
from .serializers import CourseSerializer, ResourceSerializer, StudentProgressSerializer, StudentMilestoneSerializer, CertificateSerializer, ProjectSerializer, ProjectSubmissionSerializer, AnnouncementSerializer, _get_ghost_mode
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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['ghost_mode_enabled'] = _get_ghost_mode()
        return context

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        if user.role == 'TEACHER':
            # Teachers ONLY see courses where they are assigned as primary_teacher in a CourseGroup
            qs = qs.filter(groups__primary_teacher=user).distinct()
        elif user.role == 'STUDENT':
            from datetime import date
            today = date.today()
            dob = user.student_profile.date_of_birth if hasattr(user, 'student_profile') else None
            age = user.exact_age
            if dob:
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                
            if age is not None:
                from django.db.models import Q
                qs = qs.filter(Q(target_age_min__lte=age) & Q(target_age_max__gte=age))
                
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
            if not data.get('description') or not str(data.get('description')).strip():
                return Response({'error': 'Description is required and cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
                
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
                    target_age_min=data.get('target_age_min', 0),
                    target_age_max=data.get('target_age_max', 99),
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
            zoom_sessions_to_create = []
            for group_data in groups_data:
                # Resolve teacher by email instead of raw ID
                teacher_id = None
                teacher_email = group_data.get('primary_teacher_email')
                if teacher_email and str(teacher_email).strip():
                    from accounts.models import User
                    try:
                        teacher_user = User.objects.get(email__iexact=teacher_email.strip(), role='TEACHER')
                        teacher_id = teacher_user.id
                    except User.DoesNotExist:
                        return Response(
                            {'error': f'No teacher found with email "{teacher_email}". Ensure the email belongs to a user with the TEACHER role.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    # Backward compatibility: fall back to raw ID if provided
                    teacher_id = group_data.get('primary_teacher') or None

                group = CourseGroup.objects.create(
                    course=course, 
                    name=group_data.get('name'),
                    official_day=group_data.get('official_day', 0),
                    official_time=group_data.get('official_time'),
                    capacity=group_data.get('capacity', 25),
                    primary_teacher_id=teacher_id
                )
                for session_data in group_data.get('zoom_sessions', []):
                    zoom_sessions_to_create.append(ZoomSession(
                        course_group=group,
                        title=session_data.get('title'),
                        scheduled_time=session_data.get('scheduled_time'),
                        meeting_link=session_data.get('meeting_link')
                    ))
            if zoom_sessions_to_create:
                ZoomSession.objects.bulk_create(zoom_sessions_to_create)

            # Create Units & Lessons based on structure
            if course.course_structure == 'LONG_NESTED':
                units_data = data.get('units', [])
                for idx, unit_data in enumerate(units_data):
                    unit = Unit.objects.create(
                        course=course, 
                        title=unit_data.get('title'), 
                        order=idx + 1
                    )
                    lessons_to_create = []
                    for lesson_idx, lesson_data in enumerate(unit_data.get('lessons', [])):
                        lessons_to_create.append(Lesson(
                            unit=unit,
                            lesson_number=lesson_idx + 1,
                            title=lesson_data.get('title'),
                            video_url=lesson_data.get('video_url'),
                            pdf_attachment=lesson_data.get('pdf_attachment'),
                            is_quiz=lesson_data.get('is_quiz', False),
                            estimated_minutes=lesson_data.get('estimated_minutes', 0)
                        ))
                    if lessons_to_create:
                        Lesson.objects.bulk_create(lessons_to_create)
            else: # SHORT_FLAT
                flat_lessons_data = data.get('flat_lessons', [])
                flat_lessons_to_create = []
                for lesson_idx, lesson_data in enumerate(flat_lessons_data):
                    flat_lessons_to_create.append(Lesson(
                        course=course,
                        lesson_number=lesson_idx + 1,
                        title=lesson_data.get('title'),
                        video_url=lesson_data.get('video_url'),
                        pdf_attachment=lesson_data.get('pdf_attachment'),
                        is_quiz=lesson_data.get('is_quiz', False),
                        estimated_minutes=lesson_data.get('estimated_minutes', 0)
                    ))
                if flat_lessons_to_create:
                    Lesson.objects.bulk_create(flat_lessons_to_create)
            groups_data = data.get('groups', [])
            for group_data in groups_data:
                # Resolve teacher by email instead of raw ID
                teacher_id = None
                teacher_email = group_data.get('primary_teacher_email')
                if teacher_email and str(teacher_email).strip():
                    from accounts.models import User
                    try:
                        teacher_user = User.objects.get(email__iexact=teacher_email.strip(), role='TEACHER')
                        teacher_id = teacher_user.id
                    except User.DoesNotExist:
                        return Response(
                            {'error': f'No teacher found with email "{teacher_email}". Ensure the email belongs to a user with the TEACHER role.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    # Backward compatibility: fall back to raw ID if provided
                    teacher_id = group_data.get('primary_teacher') or None

                group = CourseGroup.objects.create(
                    course=course, 
                    name=group_data.get('name'),
                    official_day=group_data.get('official_day', 0),
                    official_time=group_data.get('official_time'),
                    capacity=group_data.get('capacity', 25),
                    primary_teacher_id=teacher_id
                )
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
            desc_val = data.get('description', course.description)
            if not desc_val or not str(desc_val).strip():
                return Response({'error': 'Description is required and cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
                
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
                course.target_age_min = data.get('target_age_min', course.target_age_min)
                course.target_age_max = data.get('target_age_max', course.target_age_max)
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
                zoom_sessions_to_create = []
                for group_data in groups_data:
                    # Resolve teacher by email instead of raw ID
                    teacher_id = None
                    teacher_email = group_data.get('primary_teacher_email')
                    if teacher_email and str(teacher_email).strip():
                        from accounts.models import User as AccountUser
                        try:
                            teacher_user = AccountUser.objects.get(email__iexact=teacher_email.strip(), role='TEACHER')
                            teacher_id = teacher_user.id
                        except AccountUser.DoesNotExist:
                            return Response(
                                {'error': f'No teacher found with email "{teacher_email}". Ensure the email belongs to a user with the TEACHER role.'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    else:
                        # Backward compatibility: fall back to raw ID if provided
                        teacher_id = group_data.get('primary_teacher') or None

                    group = CourseGroup.objects.create(
                        course=course, 
                        name=group_data.get('name'),
                        official_day=group_data.get('official_day', 0),
                        official_time=group_data.get('official_time'),
                        capacity=group_data.get('capacity', 25),
                        primary_teacher_id=teacher_id
                    )
                    for session_data in group_data.get('zoom_sessions', []):
                        zoom_sessions_to_create.append(ZoomSession(
                            course_group=group,
                            title=session_data.get('title'),
                            scheduled_time=session_data.get('scheduled_time'),
                            meeting_link=session_data.get('meeting_link')
                        ))
                if zoom_sessions_to_create:
                    ZoomSession.objects.bulk_create(zoom_sessions_to_create)

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
                        lessons_to_create = []
                        for lesson_idx, lesson_data in enumerate(unit_data.get('lessons', [])):
                            lessons_to_create.append(Lesson(
                                unit=unit,
                                lesson_number=lesson_idx + 1,
                                title=lesson_data.get('title'),
                                video_url=lesson_data.get('video_url'),
                                pdf_attachment=lesson_data.get('pdf_attachment'),
                                is_quiz=lesson_data.get('is_quiz', False),
                                estimated_minutes=lesson_data.get('estimated_minutes', 0)
                            ))
                        if lessons_to_create:
                            Lesson.objects.bulk_create(lessons_to_create)
                else:
                    flat_lessons_data = data.get('flat_lessons', [])
                    flat_lessons_to_create = []
                    for lesson_idx, lesson_data in enumerate(flat_lessons_data):
                        flat_lessons_to_create.append(Lesson(
                            course=course,
                            lesson_number=lesson_idx + 1,
                            title=lesson_data.get('title'),
                            video_url=lesson_data.get('video_url'),
                            pdf_attachment=lesson_data.get('pdf_attachment'),
                            is_quiz=lesson_data.get('is_quiz', False),
                            estimated_minutes=lesson_data.get('estimated_minutes', 0)
                        ))
                    if flat_lessons_to_create:
                        Lesson.objects.bulk_create(flat_lessons_to_create)
                groups_data = data.get('groups', [])
                for group_data in groups_data:
                    # Resolve teacher by email instead of raw ID
                    teacher_id = None
                    teacher_email = group_data.get('primary_teacher_email')
                    if teacher_email and str(teacher_email).strip():
                        from accounts.models import User as AccountUser
                        try:
                            teacher_user = AccountUser.objects.get(email__iexact=teacher_email.strip(), role='TEACHER')
                            teacher_id = teacher_user.id
                        except AccountUser.DoesNotExist:
                            return Response(
                                {'error': f'No teacher found with email "{teacher_email}". Ensure the email belongs to a user with the TEACHER role.'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    else:
                        # Backward compatibility: fall back to raw ID if provided
                        teacher_id = group_data.get('primary_teacher') or None

                    group = CourseGroup.objects.create(
                        course=course, 
                        name=group_data.get('name'),
                        official_day=group_data.get('official_day', 0),
                        official_time=group_data.get('official_time'),
                        capacity=group_data.get('capacity', 25),
                        primary_teacher_id=teacher_id
                    )
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
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Determine the parent course
        parent_course = lesson.course if lesson.course else lesson.unit.course if lesson.unit else None
        
        # Verify active subscription
        if parent_course:
            from payment.models import Subscription
            has_access = Subscription.objects.filter(
                user=request.user,
                course=parent_course,
                status='approved',
                is_active=True
            ).exists()
            if not has_access and request.user.role not in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER']:
                return Response(
                    {'error': 'You are not enrolled in this course.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        progress, created = StudentProgress.objects.get_or_create(
            student=request.user, 
            lesson=lesson
        )
        if not progress.is_completed:
            progress.is_completed = True
            progress.completed_at = timezone.now()
            progress.save()
        return Response({'status': 'completed'}, status=status.HTTP_200_OK)


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
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return Certificate.objects.all()
        if user.role == 'TEACHER':
            return Certificate.objects.filter(
                course__groups__primary_teacher=user
            ).distinct()
        return Certificate.objects.filter(student=user)

class ProjectViewSet(viewsets.ModelViewSet):
    """
    Projects for students. Only Admin/Supervisor/Teacher can create/edit.
    """
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return Project.objects.all()
        elif user.role == 'TEACHER':
            return Project.objects.filter(course__groups__primary_teacher=user).distinct()
        elif user.role == 'STUDENT':
            from payment.models import Subscription
            return Project.objects.filter(
                course__subscriptions__user=user,
                course__subscriptions__status='approved',
                course__subscriptions__is_active=True
            ).distinct()
        return Project.objects.none()


class ProjectSubmissionViewSet(viewsets.ModelViewSet):
    """
    Project Submissions.
    """
    serializer_class = ProjectSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return ProjectSubmission.objects.all()
        elif user.role == 'TEACHER':
            return ProjectSubmission.objects.filter(
                project__course__groups__primary_teacher=user
            ).distinct()
        return ProjectSubmission.objects.filter(student=user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    Announcements for the dynamic hero slider.
    Only SuperAdmin/Supervisor can create/edit.
    Students/Guests can read active announcements.
    """
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdminOrSupervisorOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not (user and user.is_authenticated and user.role in ['SUPER_ADMIN', 'SUPERVISOR']):
            qs = qs.filter(is_active=True)
        return qs


class GhostModeView(APIView):
    """Super Admin endpoint to read/toggle the Ghost Player security system."""
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        gs = GlobalSettings.load()
        return Response({'ghost_mode_enabled': gs.ghost_mode_enabled})

    def put(self, request):
        gs = GlobalSettings.load()
        ghost_mode = request.data.get('ghost_mode_enabled')
        if ghost_mode is not None:
            gs.ghost_mode_enabled = bool(ghost_mode)
            gs.save()
        return Response({'ghost_mode_enabled': gs.ghost_mode_enabled})

class CourseGroupViewSet(viewsets.ModelViewSet):
    queryset = CourseGroup.objects.all()
    from .serializers import CourseGroupSerializer
    serializer_class = CourseGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return CourseGroup.objects.filter(primary_teacher=user).select_related('course')
        return CourseGroup.objects.all()

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """List students enrolled in this CourseGroup."""
        if request.user.role not in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        group = self.get_object()
        from accounts.models import StudentProfile
        student_profiles = StudentProfile.objects.filter(course_groups=group).select_related('user')
        data = [
            {
                'id': sp.user.id,
                'full_name': sp.user.full_name,
                'exact_age': getattr(sp.user, 'exact_age', None),
                'date_of_birth': sp.date_of_birth.isoformat() if sp.date_of_birth else None,
            }
            for sp in student_profiles
        ]
        return Response(data)

    @action(detail=True, methods=['post'])
    def add_student(self, request, pk=None):
        if request.user.role not in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        group = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            from accounts.models import User
            student = User.objects.get(id=user_id, role='STUDENT')
            profile = student.student_profile
        except Exception:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if profile.course_groups.filter(id=group.id).exists():
            return Response({'error': 'Student already in group'}, status=status.HTTP_400_BAD_REQUEST)
            
        with transaction.atomic():
            # Lock the group to prevent concurrent capacity overruns
            locked_group = CourseGroup.objects.select_for_update().get(id=group.id)
            current_students = StudentProfile.objects.filter(course_groups=locked_group).count()
            if current_students >= locked_group.capacity:
                return Response({'error': 'Group is at full capacity'}, status=status.HTTP_400_BAD_REQUEST)
            
            profile.course_groups.add(locked_group)
            
        return Response({'message': 'Student added successfully'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def remove_student(self, request, pk=None):
        if request.user.role not in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        group = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            from accounts.models import User
            student = User.objects.get(id=user_id, role='STUDENT')
            student.student_profile.course_groups.remove(group)
        except Exception:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
            
        return Response({'message': 'Student removed successfully'}, status=status.HTTP_200_OK)


from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404

class ProtectedResourceDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, resource_id):
        resource = get_object_or_404(Resource, id=resource_id)
        from payment.models import Subscription
        is_authorized = (
            request.user.role in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER'] or
            Subscription.objects.filter(
                user=request.user,
                course=resource.course,
                status='approved',
                is_active=True
            ).exists()
        )
        if not is_authorized:
            return Response({'error': 'Not enrolled in this course.'}, status=status.HTTP_403_FORBIDDEN)
        
        return FileResponse(resource.file_attachment.open(), as_attachment=True)


class ProtectedCertificateDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, certificate_id):
        certificate = get_object_or_404(Certificate, id=certificate_id)
        if certificate.student != request.user and request.user.role not in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        if not certificate.certificate_image:
            raise Http404("No certificate file available.")
        return FileResponse(certificate.certificate_image.open(), as_attachment=True)

