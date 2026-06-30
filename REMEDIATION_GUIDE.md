# Nour Al-Nubuwwah LMS — Remediation Guide

**Generated:** 2025-07-25  
**Author:** Lead Solutions Architect & Principal Security Engineer  
**Directive:** READ-ONLY on existing codebase. This file is a NEW creation. Do not modify any other file without testing these snippets in a separate branch first.

> **Pre-requisites:** Apply fixes in a feature branch (`git checkout -b security-remediation`), run the full Django test suite after every batch, and run the Next.js TypeScript compiler (`npm run build` or `npx tsc --noEmit`) before committing.

---

## CRITICAL (5 Issues)

---

### 🔴 CRITICAL-1: Backend Runtime Crashes — ImportError & FieldError in Analytics/Stats Views

**File:** `backend/accounts/views.py`  
**Root Cause:** `SuperAdminStudentStatsView` imports `LiveSession` (does not exist) and later uses `VirtualSession` without importing it. Both `ParentCourseAnalyticsView` and `SuperAdminStudentStatsView` query `Lesson` via a non-existent `week` reverse relationship (`week__course`). The `Lesson` model has `course` (flat) and `unit` (nested) fields, not `week`.

**The Optimal Fix:**
1. Replace `LiveSession` with `VirtualSession` in the local import inside `SuperAdminStudentStatsView`.
2. Replace all `week__course` filters with `Q(course=...) | Q(unit__course=...)` to cover both flat and nested lessons.

**Exact Code Snippets:**

```python
# backend/accounts/views.py
# In SuperAdminStudentStatsView, replace the local import (~line 693):
# ❌ OLD:
# from live.models import Attendance, LiveSession
# ✅ NEW:
from live.models import Attendance, VirtualSession

# Then in the same method, replace the sessions query (~line 703):
# ❌ OLD:
# sessions = VirtualSession.objects.filter(course_group__in=course_groups)
# ✅ NEW: (VirtualSession is now imported, so this line stays the same)
sessions = VirtualSession.objects.filter(course_group__in=course_groups)

# In ParentCourseAnalyticsView (~line 489), replace:
# ❌ OLD:
# total_lessons = Lesson.objects.filter(week__course=course).count()
# ✅ NEW:
from django.db.models import Q
total_lessons = Lesson.objects.filter(
    Q(course=course) | Q(unit__course=course)
).distinct().count()

# In ParentCourseAnalyticsView (~line 494), replace:
# ❌ OLD:
# quiz_results = StudentResult.objects.filter(student=student_user, quiz__lesson__week__course=course)
# ✅ NEW:
quiz_results = StudentResult.objects.filter(
    student=student_user
).filter(
    Q(quiz__lesson__course=course) | Q(quiz__lesson__unit__course=course)
)

# In SuperAdminStudentStatsView (~line 714), replace:
# ❌ OLD:
# total_lessons = Lesson.objects.filter(week__course__groups__in=course_groups).distinct().count()
# ✅ NEW:
total_lessons = Lesson.objects.filter(
    Q(course__groups__in=course_groups) | Q(unit__course__groups__in=course_groups)
).distinct().count()
```

**Post-Fix Actions:**
- `python manage.py test` — run tests targeting `ParentCourseAnalyticsView` and `SuperAdminStudentStatsView`.
- No migration needed.

---

### 🔴 CRITICAL-2: Quiz Submission Race Condition — Attempt Limit Bypass

**File:** `backend/quizzes/views.py`  
**Root Cause:** `existing_attempts` is read outside the `transaction.atomic()` block. Two concurrent requests can both read `count = 1`, both pass `< MAX_ATTEMPTS`, and both insert a new `StudentResult`, yielding 3+ attempts.

**The Optimal Fix:** Move the attempt count read **inside** the atomic transaction and lock the relevant rows with `select_for_update()`.

**Exact Code Snippets:**

```python
# backend/quizzes/views.py
# Inside QuizViewSet.submit action, replace the entire method body:

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        if request.user.role != 'STUDENT':
            return Response({"error": "Only students can submit quizzes."}, status=status.HTTP_403_FORBIDDEN)
            
        quiz = self.get_object()
        answers = request.data.get('answers', {})
        
        if not answers:
            return Response({"error": "No answers provided."}, status=status.HTTP_400_BAD_REQUEST)

        total_questions = quiz.questions.count()
        correct_answers = 0

        with transaction.atomic():
            # 🔒 Lock existing attempts to prevent concurrent insertion
            existing_attempts = StudentResult.objects.select_for_update().filter(
                student=request.user, quiz=quiz
            ).count()
            
            if existing_attempts >= StudentResult.MAX_ATTEMPTS:
                return Response(
                    {"error": f"Maximum {StudentResult.MAX_ATTEMPTS} attempts reached for this quiz."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            for question_id, choice_id in answers.items():
                try:
                    choice = Choice.objects.get(id=choice_id, question_id=question_id)
                    if choice.is_correct:
                        correct_answers += 1
                except Choice.DoesNotExist:
                    continue

            score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
            
            result = StudentResult.objects.create(
                student=request.user,
                quiz=quiz,
                score=score,
                attempt_number=existing_attempts + 1
            )
            
        return Response(StudentResultSerializer(result).data, status=status.HTTP_201_CREATED)
```

**Post-Fix Actions:**
- Write a concurrency test (e.g., using `threading` or `pytest-django` with `TransactionTestCase`) to verify that 10 simultaneous submissions still cap at 2 attempts.
- No migration needed.

---

### 🔴 CRITICAL-3: Unrestricted Project & Project Submission Access (IDOR)

**File:** `backend/learning/views.py`  
**Root Cause:** `ProjectViewSet` uses `queryset = Project.objects.all()` with only `IsAuthenticated`. It lacks `get_queryset`, so any logged-in user lists every project. `ProjectSubmissionViewSet` returns all submissions for any TEACHER/SUPERVISOR/ADMIN without scoping to their assigned groups.

**The Optimal Fix:** Add `get_queryset()` to both viewsets, scoping by role and enrollment.

**Exact Code Snippets:**

```python
# backend/learning/views.py
# In ProjectViewSet, add:

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


# In ProjectSubmissionViewSet, replace get_queryset:

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
```

**Post-Fix Actions:**
- Add unit tests for each role asserting the correct queryset size.
- No migration needed.

---

### 🔴 CRITICAL-4: Message Creation Without Room Participation Verification

**File:** `backend/chat/views.py`  
**Root Cause:** `MessageViewSet.perform_create` only sets `sender = request.user`. It never validates that the sender belongs to the `room` specified in the payload.

**The Optimal Fix:** Override `perform_create` to inspect the validated `room` instance and verify `room.participants` contains the current user before saving.

**Exact Code Snippets:**

```python
# backend/chat/views.py
from rest_framework.exceptions import PermissionDenied

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room_id')
        if room_id:
            return Message.objects.filter(room_id=room_id, room__participants=self.request.user).order_by('timestamp')
        return Message.objects.filter(room__participants=self.request.user).order_by('timestamp')

    def perform_create(self, serializer):
        room = serializer.validated_data.get('room')
        if room and not room.participants.filter(id=self.request.user.id).exists():
            raise PermissionDenied("You are not a participant of this room.")
        serializer.save(sender=self.request.user)
```

**Post-Fix Actions:**
- Add a test posting a message to a room the user does not belong to; assert `403`.
- No migration needed.

---

### 🔴 CRITICAL-5: Community WebSocket Consumer Lacks Access Control

**File:** `backend/chat/consumers.py`  
**Root Cause:** `CommunityConsumer.connect` accepts any authenticated user and immediately joins `community_{study_group_id}`. It does not verify the user is actually enrolled in that study group / course group.

**The Optimal Fix:** Add a `database_sync_to_async` enrollment check before `accept()`, similar to `HomeworkConsumer`.

**Exact Code Snippets:**

```python
# backend/chat/consumers.py
class CommunityConsumer(BaseChatConsumer):
    """
    Cohort-based real-time group chat.
    """
    async def connect(self):
        self.user = self.scope["user"]
        self.study_group_id = self.scope['url_route']['kwargs']['study_group_id']
        
        if self.user == AnonymousUser():
            await self.close()
            return

        # 🔒 Verify the user is enrolled in this study group
        has_access = await self.verify_study_group_access(self.study_group_id, self.user)
        if not has_access:
            await self.close()
            return

        self.room_group_name = f'community_{self.study_group_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    @database_sync_to_async
    def verify_study_group_access(self, study_group_id, user):
        from learning.models import CourseGroup
        try:
            group = CourseGroup.objects.get(id=study_group_id)
        except CourseGroup.DoesNotExist:
            return False
        
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return True
        if group.primary_teacher == user:
            return True
        if hasattr(user, 'student_profile'):
            return user.student_profile.course_groups.filter(id=study_group_id).exists()
        return False

    # ... rest of the class remains unchanged
```

**Post-Fix Actions:**
- Write a Channels async test that attempts a connection with a wrong `study_group_id`; assert `close()` is called.
- No migration needed.

---

## HIGH (8 Issues)

---

### 🟠 HIGH-1: Teacher Can View All Student Quiz Results

**File:** `backend/quizzes/views.py`  
**Root Cause:** `StudentResultViewSet.get_queryset` returns `StudentResult.objects.all()` for the `TEACHER` role.

**Exact Code Snippets:**

```python
# backend/quizzes/views.py
class StudentResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Students can view their results. Teachers can view results for their students.
    """
    serializer_class = StudentResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPERVISOR']:
            return StudentResult.objects.all()
        if user.role == 'TEACHER':
            return StudentResult.objects.filter(
                quiz__course__groups__primary_teacher=user
            ).distinct()
        return StudentResult.objects.filter(student=user)
```

**Post-Fix Actions:**
- Add a test logging in as a teacher and asserting the returned results only belong to students in their assigned groups.
- No migration needed.

---

### 🟠 HIGH-2: CourseGroup Capacity Race Condition

**File:** `backend/learning/views.py`  
**Root Cause:** `add_student` counts students in Python, then adds the student. Two concurrent requests can both see `count < capacity` and add, exceeding capacity.

**Exact Code Snippets:**

```python
# backend/learning/views.py
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
            # 🔒 Lock the group to prevent concurrent capacity overruns
            locked_group = CourseGroup.objects.select_for_update().get(id=group.id)
            current_students = StudentProfile.objects.filter(course_groups=locked_group).count()
            if current_students >= locked_group.capacity:
                return Response({'error': 'Group is at full capacity'}, status=status.HTTP_400_BAD_REQUEST)
            
            profile.course_groups.add(locked_group)
            
        return Response({'message': 'Student added successfully'}, status=status.HTTP_200_OK)
```

**Post-Fix Actions:**
- Concurrency test: two threads attempt to add the last slot simultaneously; only one should succeed.
- No migration needed.

---

### 🟠 HIGH-3: Attendance & Feedback Without Enrollment Verification

**File:** `backend/live/views.py`  
**Root Cause:** `VirtualSessionViewSet.attend` allows any student to mark attendance for any session. `SessionFeedbackViewSet.perform_create` allows any student to submit feedback for any session, even if they never attended.

**Exact Code Snippets:**

```python
# backend/live/views.py
from rest_framework.exceptions import PermissionDenied

class VirtualSessionViewSet(viewsets.ModelViewSet):
    # ... existing code ...

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def attend(self, request, pk=None):
        if request.user.role != 'STUDENT':
            return Response({"error": "Only students can mark attendance."}, status=status.HTTP_403_FORBIDDEN)
            
        session = self.get_object()
        
        # 🔒 Verify the student is enrolled in the session's course group
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


class SessionFeedbackViewSet(viewsets.ModelViewSet):
    # ... existing code ...

    def perform_create(self, serializer):
        session = serializer.validated_data.get('session')
        
        # 🔒 Verify the student actually attended this session
        if not Attendance.objects.filter(session=session, student=self.request.user).exists():
            raise PermissionDenied("You must attend the session before submitting feedback.")
        
        serializer.save(student=self.request.user, teacher=session.teacher)
```

**Post-Fix Actions:**
- Add tests: a student not in the group attempts to attend → `403`. A student without attendance attempts feedback → `403`.
- No migration needed.

---

### 🟠 HIGH-4: Student Progress Mark-Complete Without Enrollment Check

**File:** `backend/learning/views.py`  
**Root Cause:** `StudentProgressViewSet.mark_complete` allows any authenticated student to mark any lesson as complete, regardless of whether they are subscribed to the parent course.

**Exact Code Snippets:**

```python
# backend/learning/views.py
class StudentProgressViewSet(viewsets.ModelViewSet):
    # ... existing code ...

    @action(detail=False, methods=['post'])
    def mark_complete(self, request):
        lesson_id = request.data.get('lesson_id')
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # 🔒 Determine the parent course
        parent_course = lesson.course if lesson.course else lesson.unit.course if lesson.unit else None
        
        # 🔒 Verify active subscription
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
```

**Post-Fix Actions:**
- Test: an unenrolled student marks a lesson complete → `403`.
- No migration needed.

---

### 🟠 HIGH-5: Parent & Super-Admin Analytics Return Fabricated Mock Data

**File:** `backend/accounts/views.py`  
**Root Cause:** `ParentCourseAnalyticsView` and `SuperAdminStudentStatsView` inject hardcoded fake quiz scores, assignments, and project grades when real data is empty, actively misleading stakeholders.

**Exact Code Snippets:**

```python
# backend/accounts/views.py
# In ParentCourseAnalyticsView:
# REMOVE the entire block (~lines 482-542) that reads:
#
#   if expected_count == 0:
#       expected_count = 10
#       attended_count = 8
#
#   if not exams_list:
#       exams_list = [
#           {"name": "Quiz 1: Fundamental Concepts", "score": 90, ...},
#           ...
#       ]
#
#   if not projects_list:
#       projects_list = [
#           {"name": "Level 1 Capstone Project Research", ...}
#       ]
#
#   assignments_list = [ ... hardcoded ... ]
#
# ✅ AFTER REMOVAL, the assignments_list should also be derived from real models.
# If the Assignment model does not exist yet, return an empty list:
assignments_list = []

# Similarly in SuperAdminStudentStatsView:
# REMOVE any hardcoded fallback values. Return the computed metrics as-is.
```

**Post-Fix Actions:**
- Verify all existing tests that assert on these endpoints now expect empty arrays instead of mock data.
- No migration needed.

---

### 🟠 HIGH-6: PII Leakage in Teacher Student Search

**File:** `backend/accounts/views.py`  
**Root Cause:** `TeacherStudentSearchView` returns `exact_age` for minors. It has no pagination or rate limiting, enabling enumeration.

**Exact Code Snippets:**

```python
# backend/accounts/views.py
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class TeacherStudentSearchView(APIView):
    """
    Lightweight student search endpoint for Teachers.
    Returns ONLY id, full_name, age_group — no PII (email, phone, exact_age, etc.).
    Supports ?q= query parameter for searching by name.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        if request.user.role not in ['TEACHER', 'SUPER_ADMIN', 'SUPERVISOR']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        query = request.query_params.get('q', '').strip()
        students = User.objects.filter(role='STUDENT').only('id', 'full_name', 'age_group')

        if query:
            from django.db.models import Q
            students = students.filter(
                Q(full_name__icontains=query) | Q(id__icontains=query)
            )

        paginator = self.pagination_class()
        result_page = paginator.paginate_queryset(students, request)

        data = [
            {
                'id': s.id,
                'full_name': s.full_name,
                'age_group': s.age_group,  # 🔒 Removed exact_age
            }
            for s in result_page
        ]
        return paginator.get_paginated_response(data)
```

**Post-Fix Actions:**
- Add `@ratelimit(key='user', rate='10/m', method='GET')` via `django-ratelimit` if not already installed.
- No migration needed.

---

### 🟠 HIGH-7: Super-Admin User List Leaks Emails & N+1 Query

**File:** `backend/accounts/views.py`  
**Root Cause:** The endpoint returns `email` for every user. It iterates the full queryset in Python without `select_related`, causing N+1 queries. Age is calculated in Python.

**Exact Code Snippets:**

```python
# backend/accounts/views.py
from django.db.models import Q, IntegerField
from django.db.models.functions import ExtractYear
from django.db.models.expressions import ExpressionWrapper, Value
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class SuperAdminUserListView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        if request.user.role != 'SUPER_ADMIN':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        role_filter = request.query_params.get('role', 'All')
        min_age = request.query_params.get('min_age')
        max_age = request.query_params.get('max_age')
        
        # 🔒 Use select_related to avoid N+1; annotate age in DB
        users = User.objects.all().select_related('student_profile').order_by('-created_at')
        if role_filter and role_filter != 'All':
            users = users.filter(role=role_filter)
            
        if min_age is not None or max_age is not None:
            from datetime import date
            today = date.today()
            users = users.annotate(
                computed_age=ExpressionWrapper(
                    Value(today.year) - ExtractYear('student_profile__date_of_birth'),
                    output_field=IntegerField()
                )
            )
            
            if min_age is not None:
                users = users.filter(
                    Q(exact_age__gte=int(min_age)) | Q(computed_age__gte=int(min_age))
                )
            if max_age is not None:
                users = users.filter(
                    Q(exact_age__lte=int(max_age)) | Q(computed_age__lte=int(max_age))
                )

        paginator = self.pagination_class()
        result_page = paginator.paginate_queryset(users, request)
        
        data = []
        for user in result_page:
            age = user.exact_age
            if age is None and hasattr(user, 'student_profile') and user.student_profile.date_of_birth:
                from datetime import date
                today = date.today()
                dob = user.student_profile.date_of_birth
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            
            data.append({
                'id': user.id,
                # 🔒 'email' removed from response
                'full_name': user.full_name,
                'role': user.role,
                'exact_age': age,
                'age_group': user.age_group,
            })
        return paginator.get_paginated_response(data)
```

**Post-Fix Actions:**
- Install `django-ratelimit` and add rate-limiting to this endpoint.
- No migration needed.

---

### 🟠 HIGH-8: ParentCourseAnalyticsView — Multiple Unbatched Queries

**File:** `backend/accounts/views.py`  
**Root Cause:** The view fires separate sequential queries for sessions, attendance, lessons, progress, quizzes, and projects without `prefetch_related` or `select_related`.

**Exact Code Snippets:**

```python
# backend/accounts/views.py
# In ParentCourseAnalyticsView, inside the get() method, replace the data-gathering section with:

        # 1. Get Course
        course = get_object_or_404(Course, id=course_id, is_active=True)
        
        # 2. Get Linked Student
        student_profile = StudentProfile.objects.filter(parents=request.user).select_related('user').first()
        if not student_profile:
            student_profile = StudentProfile.objects.filter(parent_email__iexact=request.user.email).select_related('user').first()
             
        if not student_profile:
            return Response(
                {'error': 'No linked student profile found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        student_user = student_profile.user
        
        # 3. Calculate Attendance Metrics (batched)
        course_groups = student_profile.course_groups.all().prefetch_related('zoom_sessions')
        sessions = VirtualSession.objects.filter(course_group__in=course_groups).select_related('course_group')
        expected_count = sessions.count()
        attended_count = Attendance.objects.filter(session__in=sessions, student=student_user).count()
        attendance_ratio = round((attended_count / expected_count) * 100) if expected_count > 0 else 0
        
        # 4. Overall Progress (batched, using correct ORM path)
        total_lessons = Lesson.objects.filter(
            Q(course=course) | Q(unit__course=course)
        ).distinct().count()
        completed_lessons = StudentProgress.objects.filter(
            student=student_user, is_completed=True
        ).filter(
            Q(lesson__course=course) | Q(lesson__unit__course=course)
        ).distinct().count()
        overall_progress = round((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
        
        # 5. Exams / Quiz Results (batched with select_related)
        quiz_results = StudentResult.objects.filter(
            student=student_user
        ).filter(
            Q(quiz__lesson__course=course) | Q(quiz__lesson__unit__course=course)
        ).select_related('quiz')
        
        exams_list = []
        for result in quiz_results:
            exams_list.append({
                "name": result.quiz.title,
                "score": int(result.score),
                "attempts": f"{result.attempt_number}/2",
                "date": result.submitted_at.strftime("%b %d, %Y") if result.submitted_at else None,
                "attended": True
            })
        
        # 6. Projects (batched with select_related)
        project_submissions = ProjectSubmission.objects.filter(
            student=student_user, project__course=course
        ).select_related('project')
        
        projects_list = []
        for sub in project_submissions:
            projects_list.append({
                "name": sub.project.title,
                "status": "submitted",
                "grade": sub.grade or "Pending",
                "submission_date": sub.submitted_at.strftime("%b %d, %Y") if sub.submitted_at else None
            })
        
        # 7. Assignments (return real data only; empty list if model not yet implemented)
        assignments_list = []
        
        overall_level = "Excellent" if overall_progress >= 90 else ("Very Good" if overall_progress >= 75 else "Good")

        data = {
            "course_title": course.title,
            "overall_progress": overall_progress,
            "overall_level": overall_level,
            "attendance": {
                "attended": attended_count,
                "expected": expected_count,
                "ratio": attendance_ratio
            },
            "exams": exams_list,
            "assignments": assignments_list,
            "projects": projects_list,
        }
        
        return Response(data, status=status.HTTP_200_OK)
```

**Post-Fix Actions:**
- Use Django Debug Toolbar or Silk to verify query count dropped from ~15+ to ~6.
- No migration needed.

---

## MEDIUM (13 Issues)

---

### 🟡 MEDIUM-1: Ghost Mode Encryption Key Derivation Mismatch

**File:** `backend/test_crypto.py` vs `backend/learning/serializers.py`  
**Root Cause:** `test_crypto.py` uses OpenSSL EVP key derivation (`_evp_bytes_to_key` with MD5). The production serializer uses `hashlib.sha256(key).digest()`. These produce incompatible keys.

**Exact Code Snippets:**

```python
# backend/test_crypto.py
# Replace the entire file content with this test utility that matches production:

import os
import hashlib
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

GHOST_SECRET_KEY = 'ghost-player-secret-2024'

def encrypt_url(raw_url):
    if not raw_url:
        return raw_url
    key = hashlib.sha256(GHOST_SECRET_KEY.encode('utf-8')).digest()
    iv = os.urandom(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ct_bytes = cipher.encrypt(pad(raw_url.encode('utf-8'), AES.block_size))
    return base64.b64encode(iv + ct_bytes).decode('utf-8')

def decrypt_url(encrypted_url):
    if not encrypted_url or encrypted_url.startswith('http'):
        return encrypted_url
    key = hashlib.sha256(GHOST_SECRET_KEY.encode('utf-8')).digest()
    payload = base64.b64decode(encrypted_url)
    iv = payload[:16]
    ct = payload[16:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    pt = unpad(cipher.decrypt(ct), AES.block_size)
    return pt.decode('utf-8')

if __name__ == '__main__':
    test_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    enc = encrypt_url(test_url)
    dec = decrypt_url(enc)
    assert dec == test_url, f"Mismatch: {dec}"
    print("Encryption round-trip successful.")
```

**Post-Fix Actions:**
- Run `python backend/test_crypto.py` and verify it succeeds.
- No migration needed.

---

### 🟡 MEDIUM-2: Frontend Course Enrollment Check Broken

**File:** `backend/learning/serializers.py` + `frontend/src/app/(dashboard)/learning/page.tsx`  
**Root Cause:** `CourseSerializer` does not expose `is_enrolled`. The frontend checks `course.is_enrolled` which is always `undefined`.

**Exact Code Snippets:**

```python
# backend/learning/serializers.py
class CourseSerializer(serializers.ModelSerializer):
    groups = CourseGroupSerializer(many=True, read_only=True)
    units = UnitSerializer(many=True, read_only=True)
    flat_lessons = serializers.SerializerMethodField()
    is_ghost_mode = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()  # ✅ NEW

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'title_ar', 'description', 'target_age_min', 'target_age_max', 
            'course_format', 'course_structure', 'price', 'thumbnail', 'is_upload_completed', 
            'instructor_name', 'duration', 'color', 'is_active', 'groups', 'units', 
            'flat_lessons', 'created_at', 'is_ghost_mode', 'is_enrolled'  # ✅ ADDED
        ]

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            from payment.models import Subscription
            return Subscription.objects.filter(
                user=request.user,
                course=obj,
                status='approved',
                is_active=True
            ).exists()
        return False
```

```python
# backend/learning/views.py
# In CourseViewSet, add get_serializer_context to pass request into the serializer:
class CourseViewSet(viewsets.ModelViewSet):
    # ... existing code ...
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
```

**Post-Fix Actions:**
- The frontend line `course.is_enrolled` will now receive a real boolean.
- No migration needed.

---

### 🟡 MEDIUM-3: URL Gating Logic Bypassable

**File:** `frontend/src/app/(dashboard)/learning/[courseId]/page.tsx`  
**Root Cause:** The player uses `cleanUrl.includes('youtube.com')`, which can be bypassed by a malicious hostname containing that substring.

**Exact Code Snippets:**

```typescript
// frontend/src/app/(dashboard)/learning/[courseId]/page.tsx
// Replace the URL gating block (~lines 313-316) with:

    // 2. Sanitize and Normalize
    let cleanUrl = urlToProcess.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
    if (cleanUrl.includes('youtu.be/')) {
        const id = cleanUrl.split('youtu.be/')[1].split('?')[0].substring(0, 11);
        cleanUrl = `https://www.youtube.com/watch?v=${id}`;
    }

    // 3. Gate the Mount: Only allow explicitly approved hostnames
    try {
      const urlObj = new URL(cleanUrl);
      const allowedHosts = ['youtube.com', 'www.youtube.com', 'youtu.be'];
      if (!allowedHosts.includes(urlObj.hostname)) {
        console.error("Blocked non-YouTube URL:", urlObj.hostname);
        return;
      }
      setFinalVideoUrl(cleanUrl);
    } catch (e) {
      console.error("Invalid URL format:", cleanUrl);
      return;
    }
```

**Post-Fix Actions:**
- `npm run build` to verify TypeScript compiles.
- No package installation needed.

---

### 🟡 MEDIUM-4: Google Login Missing Email Verification Check

**File:** `backend/accounts/views.py`  
**Root Cause:** `GoogleLoginView` does not check `email_verified` in the Google token payload.

**Exact Code Snippets:**

```python
# backend/accounts/views.py
class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                
                email = data.get('email')
                name = data.get('name', 'Google User')
                
                if not email:
                    return Response({'error': 'No email in token'}, status=status.HTTP_400_BAD_REQUEST)
                
                # ✅ NEW: Verify email is confirmed with Google
                if not data.get('email_verified'):
                    return Response(
                        {'error': 'Email not verified with Google. Please verify your email and try again.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'full_name': name,
                        'role': 'STUDENT',
                        'is_onboarded': False
                    }
                )
                # ... rest of the method remains unchanged
```

**Post-Fix Actions:**
- Add a test that simulates a Google payload with `"email_verified": false` and asserts `400`.
- No migration needed.

---

### 🟡 MEDIUM-5: Certificate ViewSet Leaks All Certificates to Teachers

**File:** `backend/learning/views.py`  
**Root Cause:** `CertificateViewSet.get_queryset` returns `Certificate.objects.all()` for any `TEACHER`.

**Exact Code Snippets:**

```python
# backend/learning/views.py
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
```

**Post-Fix Actions:**
- Test: a teacher with 1 course group only sees certificates for students in that group.
- No migration needed.

---

### 🟡 MEDIUM-6: WebSocket Reconnect Race Condition

**File:** `frontend/src/hooks/useWebSocket.ts`  
**Root Cause:** If the component unmounts after `onclose` but before the 3-second reconnect fires, the timeout leaks and may attempt to connect on a destroyed scope. Rapid mount/unmount can create multiple connections.

**Exact Code Snippets:**

```typescript
// frontend/src/hooks/useWebSocket.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  message?: string;
  attachment_url?: string;
  voice_note_url?: string;
  sender?: string;
  msg_id?: string;
}

export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);        // ✅ NEW
  const connectingRef = useRef(false);      // ✅ NEW

  const connect = useCallback(() => {
    if (!mountedRef.current || connectingRef.current) return;
    connectingRef.current = true;
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        connectingRef.current = false;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          setMessages((prev) => [...prev, data]);
        } catch (error) {
          console.error("Error parsing WS message:", error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        connectingRef.current = false;
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("WS Error:", error);
        ws.close();
      };
    } catch (error) {
      connectingRef.current = false;
      console.error("Failed to establish WS:", error);
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((payload: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      console.warn("Cannot send message, WS not connected.");
    }
  }, []);

  return { messages, isConnected, sendMessage };
}
```

**Post-Fix Actions:**
- `npm run build` to verify TypeScript.
- No package installation needed.

---

### 🟡 MEDIUM-7: Course Player Controls Stale Closure

**File:** `frontend/src/app/(dashboard)/learning/[courseId]/page.tsx`  
**Root Cause:** `handleControlsVisibility` is redefined on every render and used in `useEffect` hooks without being listed in dependency arrays, causing stale closure reads of `isPlaying` and `isBuffering`.

**Exact Code Snippets:**

```typescript
// frontend/src/app/(dashboard)/learning/[courseId]/page.tsx
// Replace the handler definition and the effects that depend on it:

  const handleControlsVisibility = useCallback((forceShow = false) => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    if (!forceShow && isPlaying && !isBuffering) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 10000);
    }
  }, [isPlaying, isBuffering]);  // ✅ ADDED deps

  // Then update the effects to include it in the dependency array:
  useEffect(() => {
    handleControlsVisibility(isBuffering || !isPlaying);
  }, [isPlaying, isBuffering, handleControlsVisibility]);  // ✅ ADDED handleControlsVisibility

  useEffect(() => {
    if (!isStagnant && !isBuffering && isPlaying) {
      handleControlsVisibility(false);
    }
  }, [isStagnant, isBuffering, isPlaying, handleControlsVisibility]);  // ✅ ADDED handleControlsVisibility
```

**Post-Fix Actions:**
- `npm run build` to verify no missing dependencies.
- No package installation needed.

---

### 🟡 MEDIUM-8: Post-Session Feedback Hardcoded Question Mapping

**File:** `frontend/src/components/learning/PostSessionFeedbackModal.tsx`  
**Root Cause:** The `QUESTIONS` array is hardcoded to 9 items. If the backend model changes, the frontend breaks.

**Exact Code Snippets:**

```typescript
// frontend/src/components/learning/PostSessionFeedbackModal.tsx
// Replace the handleSubmit block with dynamic mapping:

  const handleSubmit = async () => {
    if (ratings.includes(0)) {
      alert("Please provide a rating for all questions.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        session: sessionId,
        teacher: teacherId,
        text_comment: textComment
      };
      
      // ✅ Dynamically map ratings to qX_rating fields
      ratings.forEach((rating, index) => {
        payload[`q${index + 1}_rating`] = rating;
      });
      
      await axios.post('/feedbacks/', payload);
      alert("Thank you for your feedback!");
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
```

**Post-Fix Actions:**
- `npm run build` to verify.
- No package installation needed.

---

### 🟡 MEDIUM-9: VirtualSession Timezone Parsing with Naive Datetimes

**File:** `backend/live/views.py`  
**Root Cause:** `scheduled_time` might be naive. `astimezone(cairo_tz)` assumes UTC for naive datetimes, causing the weekday check to be wrong.

**Exact Code Snippets:**

```python
# backend/live/views.py
from django.utils import timezone

class VirtualSessionViewSet(viewsets.ModelViewSet):
    # ... existing code ...

    def perform_create(self, serializer):
        course_group = serializer.validated_data.get('course_group')
        scheduled_time = serializer.validated_data.get('scheduled_time')
        
        if course_group and scheduled_time:
            import pytz
            cairo_tz = pytz.timezone("Africa/Cairo")
            
            # ✅ Ensure scheduled_time is timezone-aware before converting
            if timezone.is_naive(scheduled_time):
                scheduled_time = cairo_tz.localize(scheduled_time)
            
            local_time = scheduled_time.astimezone(cairo_tz)
            if local_time.weekday() != course_group.official_day:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"scheduled_time": f"Session must be scheduled on {course_group.get_official_day_display()} in Africa/Cairo time."})

        session = serializer.save(teacher=self.request.user)
        create_zoom_meeting_task.delay(session.id)
```

**Post-Fix Actions:**
- Add a test with a naive datetime string and assert the correct weekday is evaluated.
- No migration needed.

---

### 🟡 MEDIUM-10: Frontend Cart Cleanup Missing Dependency

**File:** `frontend/src/app/(dashboard)/learning/page.tsx`  
**Root Cause:** The `useEffect` cleanup calls `removeFromCart` but suppresses it from the dependency array with `eslint-disable-line`, risking stale closure usage.

**Exact Code Snippets:**

```typescript
// frontend/src/app/(dashboard)/learning/page.tsx
// Replace the cart cleanup effect:

  useEffect(() => {
    if (!mounted || !Array.isArray(courses)) return;
    const validIds = new Set(courses.map((c: any) => String(c.id)));
    const staleItems = cartItems.filter(item => !validIds.has(String(item.id)));
    if (staleItems.length > 0) {
      staleItems.forEach(item => removeFromCart(item.id));
    }
  }, [mounted, courses, cartItems, removeFromCart]);  // ✅ ADDED removeFromCart
```

**Post-Fix Actions:**
- Remove the `eslint-disable-line` comment above this effect.
- `npm run build` to verify.

---

### 🟡 MEDIUM-11: SuperAdminStudentStatsView — N+1 Query Pattern

**File:** `backend/accounts/views.py`  
**Root Cause:** Sequential queries for `course_groups`, `VirtualSession`, `Attendance`, `Lesson`, `StudentProgress`, `StudentResult`, and `ProjectSubmission` without `prefetch_related` or `select_related`.

**Exact Code Snippets:**

```python
# backend/accounts/views.py
class SuperAdminStudentStatsView(APIView):
    # ... existing code ...

    def get(self, request, student_id):
        if request.user.role != 'SUPER_ADMIN':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        from .models import StudentProfile
        from learning.models import StudentProgress, Lesson, ProjectSubmission
        from quizzes.models import StudentResult
        from live.models import Attendance, VirtualSession
        from django.db.models import Count, Avg, Q
        
        try:
            target_user = User.objects.get(id=student_id, role='STUDENT')
            student_profile = target_user.student_profile
        except (User.DoesNotExist, StudentProfile.DoesNotExist):
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)
            
        course_groups = student_profile.course_groups.all().prefetch_related('zoom_sessions', 'course')
        sessions = VirtualSession.objects.filter(course_group__in=course_groups).select_related('course_group')
        expected_count = sessions.count()
        attended_count = Attendance.objects.filter(session__in=sessions, student=target_user).count()
        attendance_ratio = round((attended_count / expected_count) * 100) if expected_count > 0 else 0
        
        quiz_results = StudentResult.objects.filter(student=target_user)
        exam_scores_avg = round(
            quiz_results.aggregate(avg=Avg('score'))['avg'] or 0, 2
        )
        
        total_lessons = Lesson.objects.filter(
            Q(course__groups__in=course_groups) | Q(unit__course__groups__in=course_groups)
        ).distinct().count()
        completed_lessons = StudentProgress.objects.filter(
            student=target_user, is_completed=True
        ).filter(
            Q(lesson__course__groups__in=course_groups) | Q(lesson__unit__course__groups__in=course_groups)
        ).distinct().count()
        overall_progress = round((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
        
        submitted_projects_count = ProjectSubmission.objects.filter(student=target_user).count()
        
        enrolled_courses = []
        for sg in course_groups:
            if sg.course not in [c.get('course') for c in enrolled_courses]:
                enrolled_courses.append({
                    'id': sg.course.id,
                    'title': sg.course.title,
                    'color': sg.course.color
                })
                
        data = {
            'attendance_ratio': attendance_ratio,
            'exam_scores_avg': exam_scores_avg,
            'overall_progress': overall_progress,
            'submitted_projects_count': submitted_projects_count,
            'enrolled_courses': enrolled_courses
        }
        
        return Response(data, status=status.HTTP_200_OK)
```

**Post-Fix Actions:**
- Use Django Debug Toolbar to verify the query count dropped.
- No migration needed.

---

### 🟡 MEDIUM-12: CourseViewSet.create/update — Manual Object Creation Without Bulk Insert

**File:** `backend/learning/views.py`  
**Root Cause:** The `create` and `update` methods create `ZoomSession`, `Unit`, and `Lesson` objects one-by-one inside nested loops.

**Exact Code Snippets:**

```python
# backend/learning/views.py
# In the create() method, after creating groups, use bulk_create for zoom sessions:

            zoom_sessions_to_create = []
            for group_data in groups_data:
                # ... group creation code ...
                group = CourseGroup.objects.create(...)
                
                for session_data in group_data.get('zoom_sessions', []):
                    zoom_sessions_to_create.append(ZoomSession(
                        course_group=group,
                        title=session_data.get('title'),
                        scheduled_time=session_data.get('scheduled_time'),
                        meeting_link=session_data.get('meeting_link')
                    ))
            
            if zoom_sessions_to_create:
                ZoomSession.objects.bulk_create(zoom_sessions_to_create)

# Similarly for flat lessons in SHORT_FLAT mode:
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

# NOTE: For LONG_NESTED units, lessons depend on the unit IDs, so bulk_create
# is less straightforward. Keep sequential creation for nested units, but
# apply bulk_create for the lessons once unit IDs are known.
```

**Post-Fix Actions:**
- Profile the endpoint before/after with a course containing 50+ lessons.
- No migration needed.

---

### 🟡 MEDIUM-13: CourseSerializer Deep Nesting Re-evaluates Ghost Mode

**File:** `backend/learning/serializers.py`  
**Root Cause:** `_get_ghost_mode()` is called inside `LessonSerializer.get_video_url` for every single lesson, hitting the DB (or a cached singleton) per lesson.

**Exact Code Snippets:**

```python
# backend/learning/serializers.py
class LessonSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    is_ghost_mode = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'lesson_number', 'title', 'video_url', 'pdf_attachment', 'is_quiz', 'estimated_minutes', 'is_ghost_mode']

    def get_is_ghost_mode(self, obj):
        # ✅ Read from context instead of calling DB again
        return self.context.get('ghost_mode_enabled', False)

    def get_video_url(self, obj):
        if not obj.video_url:
            return None

        request = self.context.get('request')
        is_privileged = False
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.is_superuser or getattr(request.user, 'role', '') in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER']:
                is_privileged = True

        # ✅ Read from context instead of calling DB again
        ghost_mode = self.context.get('ghost_mode_enabled', False)
        if ghost_mode and not is_privileged:
            return encrypt_url(obj.video_url)
        return obj.video_url


class CourseSerializer(serializers.ModelSerializer):
    # ... existing fields ...
    is_ghost_mode = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            # ... existing fields ...
            'is_ghost_mode'
        ]

    def get_is_ghost_mode(self, obj):
        return self.context.get('ghost_mode_enabled', False)

    def get_flat_lessons(self, obj):
        return LessonSerializer(
            obj.flat_lessons.all(), 
            many=True, 
            context=self.context
        ).data
```

```python
# backend/learning/views.py
class CourseViewSet(viewsets.ModelViewSet):
    # ... existing code ...

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # ✅ Cache ghost mode once per request
        context['ghost_mode_enabled'] = _get_ghost_mode()
        return context
```

**Post-Fix Actions:**
- Verify with Django Debug Toolbar that `_get_ghost_mode` is called exactly once per API request, not once per lesson.
- No migration needed.

---

## LOW (12 Issues)

---

### 🟢 LOW-1: Silent Error Swallowing in Security Toggle

**File:** `frontend/src/components/ui/SecurityToggle.tsx`  
**Root Cause:** The `axios.get` catch block is empty. The user is never informed if the API fails.

**Exact Code Snippets:**

```typescript
// frontend/src/components/ui/SecurityToggle.tsx
  useEffect(() => {
    axios.get('/admin/settings/ghost-mode/')
      .then(res => {
        setEnabled(res.data.ghost_mode_enabled);
      })
      .catch((err) => {
        console.error("Failed to load ghost mode setting:", err);
        // Optionally: setEnabled(false);
      })
      .finally(() => setLoading(false));
  }, []);
```

**Post-Fix Actions:**
- `npm run build`.
- No package installation needed.

---

### 🟢 LOW-2: Resource & Certificate File Downloads Unprotected

**File:** `backend/learning/models.py` + new view  
**Root Cause:** `FileField`/`ImageField` are served directly. Any user with the URL can download them.

**Exact Code Snippets:**

```python
# backend/learning/views.py
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

class ProtectedResourceDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, resource_id):
        resource = get_object_or_404(Resource, id=resource_id)
        # Verify enrollment or admin/teacher role
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
            return Response({'error': 'Not enrolled in this course.'}, status=403)
        
        return FileResponse(resource.file_attachment.open(), as_attachment=True)


class ProtectedCertificateDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, certificate_id):
        certificate = get_object_or_404(Certificate, id=certificate_id)
        if certificate.student != request.user and request.user.role not in ['SUPER_ADMIN', 'SUPERVISOR', 'TEACHER']:
            return Response({'error': 'Unauthorized'}, status=403)
        if not certificate.certificate_image:
            raise Http404("No certificate file available.")
        return FileResponse(certificate.certificate_image.open(), as_attachment=True)
```

**Post-Fix Actions:**
- Wire these views into `backend/learning/urls.py` with paths like `resources/<int:resource_id>/download/` and `certificates/<int:certificate_id>/download/`.
- Update frontend `<a>` tags to use the new protected endpoints instead of raw `file_attachment` URLs.
- No migration needed.

---

### 🟢 LOW-3: Unvalidated `room_id` in Message Queryset

**File:** `backend/chat/views.py`  
**Root Cause:** `room_id` is taken directly from query params and passed into `filter(room_id=room_id)` without type validation.

**Exact Code Snippets:**

```python
# backend/chat/views.py
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room_id')
        if room_id:
            try:
                room_id = int(room_id)
            except (ValueError, TypeError):
                return Message.objects.none()
            return Message.objects.filter(room_id=room_id, room__participants=self.request.user).order_by('timestamp')
        return Message.objects.filter(room__participants=self.request.user).order_by('timestamp')
```

**Post-Fix Actions:**
- Add a test with `?room_id=abc` and assert empty queryset / no exception.
- No migration needed.

---

### 🟢 LOW-4: Frontend `learning/page.tsx` Translation Namespace Misuse

**File:** `frontend/src/app/(dashboard)/learning/page.tsx`  
**Root Cause:** `const t = dict.parent;` is assigned unconditionally, yet non-parent contexts may try to access keys from it.

**Exact Code Snippets:**

```typescript
// frontend/src/app/(dashboard)/learning/page.tsx
// Replace the unconditional assignment (~line 97) with:
const tParent = isParent ? dict.parent : {};
const t = dict.learning || {};

// Then replace all usages:
// - Use tParent.enrolledBadge, tParent.unlockCourse, etc. inside the isParent branches.
// - Use t.title, t.subtitle, etc. for the general learning page strings.
```

**Post-Fix Actions:**
- `npm run build` to verify no missing keys.
- No package installation needed.

---

### 🟢 LOW-5: Quiz Start Button Non-Functional

**File:** `frontend/src/app/(dashboard)/quizzes/page.tsx`  
**Root Cause:** The "Start Exam" button is rendered without an `onClick` handler.

**Exact Code Snippets:**

```typescript
// frontend/src/app/(dashboard)/quizzes/page.tsx
// Inside the quizzes.map() render, add onClick to the button:
import { useRouter } from 'next/navigation';

// At the top of the QuizzesPage component:
const router = useRouter();

// Then inside the button:
<button 
  onClick={() => router.push(`/quizzes/${quiz.id}`)}
  disabled={isExhausted}
  className={`...`}
>
  {isExhausted 
    ? (locale === 'ar' ? 'تم استنفاد المحاولات' : 'Attempts Exhausted') 
    : <>{t.startExam} {idx === 0 && <ArrowRight size={16} />}</>
  }
</button>
```

**Post-Fix Actions:**
- Ensure a `/quizzes/[quizId]` page exists to handle the navigation.
- `npm run build`.

---

### 🟢 LOW-6: Placeholder Components in Production Routes

**File:** `frontend/src/app/(dashboard)/chat/page.tsx`, `frontend/src/app/(dashboard)/super-admin/chats/page.tsx`, `frontend/src/app/(dashboard)/payment/page.tsx`  
**Root Cause:** These routes display "under development" messages but are accessible in production.

**Exact Code Snippets:**

```typescript
// Example for frontend/src/app/(dashboard)/chat/page.tsx
import { redirect } from 'next/navigation';

export default function ChatPage() {
  redirect('/dashboard');
}
```

Or, if you prefer to keep the route but hide it behind a feature flag:

```typescript
// frontend/src/app/(dashboard)/chat/page.tsx
import { notFound } from 'next/navigation';

export default function ChatPage() {
  const isChatEnabled = process.env.NEXT_PUBLIC_FEATURE_CHAT === 'true';
  if (!isChatEnabled) {
    notFound();
  }
  // ... existing placeholder JSX ...
}
```

**Post-Fix Actions:**
- Add `NEXT_PUBLIC_FEATURE_CHAT=true` to `.env.local` when ready to launch.
- `npm run build`.

---

### 🟢 LOW-7: CoursePlayer DevTools Interval Performance

**File:** `frontend/src/app/(dashboard)/learning/[courseId]/page.tsx`  
**Root Cause:** `setInterval(() => Function('debugger')(), 50)` runs every 50ms when Ghost Mode is active, wasting CPU and being easily bypassed.

**Exact Code Snippets:**

```typescript
// frontend/src/app/(dashboard)/learning/[courseId]/page.tsx
// In the useEffect that handles ghost mode (~lines 214-216), remove the interval entirely:

  useEffect(() => {
    if (!course?.is_ghost_mode) return;

    const disableShortcuts = (e: KeyboardEvent) => {
      if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault();
      }
    };
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', disableShortcuts);
    window.addEventListener('contextmenu', disableContextMenu);

    // ❌ REMOVED: const devToolsTrap = setInterval(() => { Function('debugger')(); }, 50);

    return () => {
      window.removeEventListener('keydown', disableShortcuts);
      window.removeEventListener('contextmenu', disableContextMenu);
      // ❌ REMOVED: clearInterval(devToolsTrap);
    };
  }, [course?.is_ghost_mode]);
```

**Post-Fix Actions:**
- For stronger protection, switch to server-side signed URLs with short expiry (e.g., AWS CloudFront signed URLs or Django `django-private-storage`). This is architecture-level and beyond a single file fix.
- `npm run build`.

---

### 🟢 LOW-8: Invalid Date Handling in Community Chat

**File:** `frontend/src/app/(dashboard)/community/page.tsx`  
**Root Cause:** `msg.timestamp` may be `null` or malformed, causing `new Date(...)` to return `Invalid Date`.

**Exact Code Snippets:**

```typescript
// frontend/src/app/(dashboard)/community/page.tsx
// In the message rendering block (~line 229), replace:

<span className="text-xs text-slate-500">
  {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime())
    ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    : ''}
</span>
```

**Post-Fix Actions:**
- `npm run build`.
- No package installation needed.

---

### 🟢 LOW-9: Announcement Image URL Rendering

**File:** `frontend/src/app/(dashboard)/super-admin/news/page.tsx`  
**Root Cause:** `src={ann.image_url}` is rendered directly. A stored malicious URL (e.g., `javascript:alert(1)`) is an XSS vector.

**Exact Code Snippets:**

```typescript
// frontend/src/app/(dashboard)/super-admin/news/page.tsx
// Before rendering the <img>, validate the URL:

const isValidImageUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Then in the JSX:
{isValidImageUrl(ann.image_url) && (
  <img
    src={ann.image_url}
    alt="Announcement"
    className="w-full h-full object-cover"
    onError={(e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = `data:image/svg+xml;utf8,<svg ...>`;
    }}
  />
)}
```

**Post-Fix Actions:**
- `npm run build`.
- No package installation needed.

---

### 🟢 LOW-10: Hardcoded WhatsApp Number

**File:** `frontend/src/app/(dashboard)/learning/page.tsx`  
**Root Cause:** The WhatsApp number `201062582736` is hardcoded in the JSX.

**Exact Code Snippets:**

```typescript
// .env.local (create at frontend root)
NEXT_PUBLIC_WHATSAPP_NUMBER=201062582736
```

```typescript
// frontend/src/app/(dashboard)/learning/page.tsx
// Replace the hardcoded href:
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201062582736';
const whatsappUrl = `https://wa.me/${whatsappNumber}`;

// In the JSX:
<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" ...>
```

**Post-Fix Actions:**
- Restart the Next.js dev server so `.env.local` is loaded.
- `npm run build`.

---

### 🟢 LOW-11: Frontend Cart Cleanup — Multiple State Updates

**File:** `frontend/src/app/(dashboard)/learning/page.tsx` + `frontend/src/store/cartStore.ts`  
**Root Cause:** `cartItems.forEach(item => removeFromCart(item.id))` triggers one Zustand state update per stale item.

**Exact Code Snippets:**

```typescript
// frontend/src/store/cartStore.ts
// Add a batch removal action:
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartItems: [],
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      addToCart: (course) => set((state) => {
        if (state.cartItems.find((c) => c.id === course.id)) return state;
        return { cartItems: [...state.cartItems, course] };
      }),
      removeFromCart: (courseId) => set((state) => ({
        cartItems: state.cartItems.filter((c) => c.id !== courseId),
      })),
      // ✅ NEW: batch removal
      removeManyFromCart: (ids) => set((state) => ({
        cartItems: state.cartItems.filter((c) => !ids.includes(c.id)),
      })),
      clearCart: () => set({ cartItems: [] }),
    }),
    { name: 'lms-cart-storage', onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); } }
  )
);
```

```typescript
// frontend/src/app/(dashboard)/learning/page.tsx
// In the LearningPage component, destructure the new action:
const { cartItems, addToCart, removeFromCart, removeManyFromCart } = useCartStore();

// Replace the cleanup effect:
  useEffect(() => {
    if (!mounted || !Array.isArray(courses)) return;
    const validIds = new Set(courses.map((c: any) => String(c.id)));
    const staleIds = cartItems.filter(item => !validIds.has(String(item.id))).map(item => item.id);
    if (staleIds.length > 0) {
      removeManyFromCart(staleIds);
    }
  }, [mounted, courses, cartItems, removeManyFromCart]);
```

**Post-Fix Actions:**
- `npm run build`.
- No package installation needed.

---

### 🟢 LOW-12: TeacherStudentSearchView Slicing Before Serialization

**File:** `backend/accounts/views.py`  
**Root Cause:** `students = students[:50]` limits results but still evaluates the full queryset in Python. No DRF pagination is used.

**Exact Code Snippets:**

```python
# backend/accounts/views.py
from rest_framework.pagination import PageNumberPagination

class TeacherResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class TeacherStudentSearchView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = TeacherResultsSetPagination

    def get(self, request):
        if request.user.role not in ['TEACHER', 'SUPER_ADMIN', 'SUPERVISOR']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        query = request.query_params.get('q', '').strip()
        students = User.objects.filter(role='STUDENT').only('id', 'full_name', 'age_group')

        if query:
            from django.db.models import Q
            students = students.filter(
                Q(full_name__icontains=query) | Q(id__icontains=query)
            )

        # ✅ Use DRF pagination instead of Python slicing
        paginator = self.pagination_class()
        result_page = paginator.paginate_queryset(students, request)

        data = [
            {
                'id': s.id,
                'full_name': s.full_name,
                'age_group': s.age_group,
            }
            for s in result_page
        ]
        return paginator.get_paginated_response(data)
```

**Post-Fix Actions:**
- Update any frontend code calling this endpoint to handle the paginated response shape (`results`, `count`, `next`, `previous`).
- No migration needed.

---

## Final Checklist

| Step | Action | Files |
|------|--------|-------|
| 1 | Fix all CRITICAL runtime crashes (CRITICAL-1) | `backend/accounts/views.py` |
| 2 | Fix all race conditions (CRITICAL-2, HIGH-2) | `backend/quizzes/views.py`, `backend/learning/views.py` |
| 3 | Fix all IDOR / unauthorized access (CRITICAL-3, CRITICAL-4, CRITICAL-5, HIGH-1, HIGH-3, HIGH-4, HIGH-6, MEDIUM-5) | `backend/learning/views.py`, `backend/chat/views.py`, `backend/chat/consumers.py`, `backend/quizzes/views.py` |
| 4 | Remove all mock data fallbacks (HIGH-5) | `backend/accounts/views.py` |
| 5 | Fix all N+1 / performance issues (HIGH-7, HIGH-8, MEDIUM-11, MEDIUM-12, MEDIUM-13, LOW-12) | `backend/accounts/views.py`, `backend/learning/views.py`, `backend/learning/serializers.py` |
| 6 | Fix all frontend runtime / UX issues (MEDIUM-2, MEDIUM-3, MEDIUM-6, MEDIUM-7, MEDIUM-8, MEDIUM-10, LOW-1, LOW-4, LOW-5, LOW-6, LOW-7, LOW-8, LOW-9, LOW-10, LOW-11) | `frontend/src/**/*.tsx` |
| 7 | Fix encryption mismatch (MEDIUM-1) | `backend/test_crypto.py` |
| 8 | Add protected file downloads (LOW-2) | `backend/learning/views.py` |
| 9 | Run `python manage.py makemigrations` + `migrate` if any model changes were made (none in this guide). | — |
| 10 | Run full backend test suite (`pytest` or `python manage.py test`) | — |
| 11 | Run `npx tsc --noEmit` and `npm run build` in `frontend/` | — |
| 12 | Run security-focused end-to-end smoke tests on parent dashboard, super-admin stats, quiz submission, and chat. | — |

---

*End of Remediation Guide.*
