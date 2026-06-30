# Nour Al-Nubuwwah LMS — Full-Stack Security & QA Audit Report

**Audit Date:** 2025-07-25  
**Auditor:** Principal Security Researcher & Senior QA Engineer  
**Scope:** Django 6.0.4 (DRF) Backend + Next.js 14 (React 18 / TypeScript) Frontend  
**Directive:** READ-ONLY — No code modifications were made during this audit.

---

## Executive Summary

The codebase contains **multiple critical production runtime crashes**, **severe race conditions allowing business-rule bypass**, **Insecure Direct Object Reference (IDOR) vulnerabilities**, and **significant data exposure leaks**. Several frontend pages have broken core functionality (non-functional buttons, missing handlers, stale closures). Performance bottlenecks are concentrated in the admin/parent analytics views where N+1 queries and Python-level iteration over large datasets will degrade severely under load.

**Deployment to production is NOT recommended** without addressing at minimum the **CRITICAL** runtime errors and the **CRITICAL/HIGH** security gaps.

---

## Legend

| Severity | Meaning |
|----------|---------|
| 🔴 Critical | Production crash, active exploit, or massive data leak |
| 🟠 High | Active security vulnerability or significant functional breakage |
| 🟡 Medium | Security weakness, logic flaw, or notable performance issue |
| 🟢 Low | Minor UX issue, best-practice deviation, or cleanup needed |

---

## 1. Security Vulnerabilities

### 🔴 CRITICAL-1: Backend Runtime Crashes — ImportError & FieldError in Analytics/Stats Views
- **File:** `backend/accounts/views.py`  
  - `SuperAdminStudentStatsView` line 693: imports `LiveSession` from `live.models` — **that model does not exist** (correct name is `VirtualSession`).  
  - `SuperAdminStudentStatsView` line 703: uses `VirtualSession` without importing it → `NameError`.  
  - `ParentCourseAnalyticsView` line 489: `Lesson.objects.filter(week__course=course)` — `Lesson` has **no `week` field**.  
  - `ParentCourseAnalyticsView` line 494: `StudentResult.objects.filter(quiz__lesson__week__course=course)` — same invalid path.  
  - `SuperAdminStudentStatsView` line 714: `Lesson.objects.filter(week__course__groups__in=course_groups)` — same invalid path.
- **Threat:** Every call to parent dashboard analytics or super-admin student stats will crash with `ImportError` or `FieldError`. These are core features for parents and administrators.
- **Conceptual Fix:**  
  - Import `VirtualSession` instead of `LiveSession`.  
  - Replace all `week__course` lookups with `unit__course` (for nested lessons) or `course` (for flat lessons).

---

### 🔴 CRITICAL-2: Quiz Submission Race Condition — Attempt Limit Bypass
- **File:** `backend/quizzes/views.py` (lines 39–75)
- **Threat:** `existing_attempts` is counted **outside** the `transaction.atomic()` block. Two concurrent requests can both read `count = 1`, both pass `< MAX_ATTEMPTS`, and both create a second record → **3+ attempts allowed** despite the hard limit of 2.
- **Conceptual Fix:** Move the count check **inside** the transaction, and use `select_for_update()` on the quiz or results rows to serialize concurrent submissions.

---

### 🔴 CRITICAL-3: Unrestricted Project & Project Submission Access (IDOR)
- **File:** `backend/learning/views.py` (lines 387–409)
- **Threat:**  
  - `ProjectViewSet` uses only `IsAuthenticated` with **no `get_queryset` override**. Any logged-in user can list every project in the system.  
  - `ProjectSubmissionViewSet` returns all submissions for any TEACHER/SUPERVISOR/ADMIN without scoping to their own groups. Students can see all submissions if they obtain a teacher role (or if frontend accidentally calls it).
- **Conceptual Fix:**  
  - Add `get_queryset` to `ProjectViewSet`: scope by user role (students → enrolled courses; teachers → their groups; admins → all).  
  - Scope `ProjectSubmissionViewSet` to the requesting teacher's `CourseGroup` or course assignments.

---

### 🔴 CRITICAL-4: Message Creation Without Room Participation Verification
- **File:** `backend/chat/views.py` (lines 24–26)
- **Threat:** `MessageViewSet.perform_create` sets `sender = request.user` but **never verifies** the sender is a participant of the `room` they post to. Any authenticated user can post messages to any chat room by iterating `room_id` values.
- **Conceptual Fix:** Before `serializer.save()`, validate `room.participants.filter(id=request.user.id).exists()` and return `403` if the user is not a participant.

---

### 🔴 CRITICAL-5: Community WebSocket Consumer Lacks Access Control
- **File:** `backend/chat/consumers.py` (lines 142–156)
- **Threat:** `CommunityConsumer.connect` accepts any authenticated user and immediately joins `community_{study_group_id}`. It **never verifies** the user is actually enrolled in that study group. A student can eavesdrop on or spam any community chat by guessing valid `study_group_id` values.
- **Conceptual Fix:** Add a `database_sync_to_async` check (mirroring `HomeworkConsumer`) that verifies the user is a participant of the study group before calling `accept()`.

---

### 🟠 HIGH-1: Teacher Can View All Student Quiz Results
- **File:** `backend/quizzes/views.py` (line 90)
- **Threat:** `StudentResultViewSet.get_queryset` returns `StudentResult.objects.all()` for the `TEACHER` role. Any teacher can see **every** quiz result for **every** student on the platform.
- **Conceptual Fix:** Filter results by the teacher's assigned `CourseGroup` or `Course` (e.g., `StudentResult.objects.filter(quiz__course__groups__primary_teacher=user)`).

---

### 🟠 HIGH-2: CourseGroup Capacity Race Condition
- **File:** `backend/learning/views.py` (lines 476–498)
- **Threat:** `add_student` counts current students in Python, then adds the student. Two concurrent requests can both observe `current_students < capacity` and add the student, **exceeding the group capacity**.
- **Conceptual Fix:** Use a transaction with `select_for_update()` on the `CourseGroup`, or enforce capacity at the database level with a custom constraint or `Count` annotation.

---

### 🟠 HIGH-3: Attendance & Feedback Without Enrollment Verification
- **File:** `backend/live/views.py` (lines 48–58, 91–93)
- **Threat:**  
  - `VirtualSessionViewSet.attend` allows any student to mark attendance for any session, even if not enrolled in the course group.  
  - `SessionFeedbackViewSet.perform_create` allows any student to submit feedback for any session, even if they never attended it.
- **Conceptual Fix:**  
  - For `attend`: verify `student_profile.course_groups` contains the session's `course_group`.  
  - For `feedback`: additionally verify an `Attendance` record exists for that student and session.

---

### 🟠 HIGH-4: Student Progress Mark-Complete Without Enrollment Check
- **File:** `backend/learning/views.py` (lines 329–344)
- **Threat:** `StudentProgressViewSet.mark_complete` allows any authenticated student to mark any lesson as complete, regardless of subscription. This allows progress spoofing and IDOR.
- **Conceptual Fix:** Before creating `StudentProgress`, verify the user has an active `Subscription` for the `Lesson`'s parent `Course`.

---

### 🟠 HIGH-5: Parent & Super-Admin Analytics Return Fabricated Mock Data
- **File:** `backend/accounts/views.py` (lines 482–542, 506–565)
- **Threat:** `ParentCourseAnalyticsView` and `SuperAdminStudentStatsView` inject **hardcoded fake quiz scores, assignments, and project grades** when real data is empty. This actively misleads parents and administrators into believing a student has completed work they have not.
- **Conceptual Fix:** Remove all mock fallbacks. Return empty arrays or `null` with a clear message that no data exists yet.

---

### 🟠 HIGH-6: PII Leakage in Teacher Student Search
- **File:** `backend/accounts/views.py` (lines 800–831)
- **Threat:** `TeacherStudentSearchView` returns `exact_age` for every matching student. For minors, exact age is sensitive PII. The endpoint returns sequential integer IDs (facilitating enumeration) and has no pagination or rate limiting.
- **Conceptual Fix:** Remove `exact_age` from the teacher response; return only `age_group`. Add DRF pagination and rate-limiting.

---

### 🟠 HIGH-7: Super-Admin User List Leaks Emails & N+1 Query
- **File:** `backend/accounts/views.py` (lines 586–632)
- **Threat:** The endpoint returns `email` for every user. It has no pagination and performs an N+1 query by iterating the full `User` queryset in Python, accessing `user.student_profile` without `select_related`.
- **Conceptual Fix:** Use DRF pagination. Add `select_related('student_profile')` and calculate age via DB annotations (`ExtractYear` or `F` expressions) rather than Python loops.

---

### 🟡 MEDIUM-1: Ghost Mode Encryption Key Derivation Mismatch
- **File:** `backend/learning/serializers.py` (lines 22–28) vs `backend/test_crypto.py`
- **Threat:** The production serializer uses `hashlib.sha256(key).digest()` directly as the AES key. The standalone `test_crypto.py` script uses OpenSSL EVP key derivation (`_evp_bytes_to_key` with MD5), producing a **different key**. Ciphertexts from the script are incompatible with the live system, making debugging impossible and risking misconfiguration.
- **Conceptual Fix:** Update `test_crypto.py` to use the exact same SHA256-based key derivation as the production serializer.

---

### 🟡 MEDIUM-2: Frontend Course Enrollment Check Broken
- **File:** `frontend/src/app/(dashboard)/learning/page.tsx` (line 184)
- **Threat:** The frontend checks `course.is_enrolled`, but `CourseSerializer` does **not** expose an `is_enrolled` field. The check always evaluates to `undefined`, so enrolled students are not correctly shown as enrolled in the catalog UI.
- **Conceptual Fix:** Add a `SerializerMethodField` `is_enrolled` to `CourseSerializer` that checks the requesting user's active `Subscription`.

---

### 🟡 MEDIUM-3: URL Gating Logic Bypassable
- **File:** `frontend/src/app/(dashboard)/learning/[courseId]/page.tsx` (lines 313–316)
- **Threat:** The video player gates URLs using `cleanUrl.includes('youtube.com')`. An attacker could host a malicious URL containing that substring (e.g., `https://evil.com/youtube.com/...`) and it would pass the gate.
- **Conceptual Fix:** Parse the URL with the `URL` API and validate `hostname` against an explicit allow-list (`youtube.com`, `youtu.be`).

---

### 🟡 MEDIUM-4: Google Login Missing Email Verification Check
- **File:** `backend/accounts/views.py` (lines 140–144)
- **Threat:** `GoogleLoginView` does not verify `email_verified` in the Google token payload. A user with an unverified email on their Google account could be granted access.
- **Conceptual Fix:** Check `data.get('email_verified')` is `True` before creating or retrieving the user.

---

### 🟡 MEDIUM-5: Certificate ViewSet Leaks All Certificates to Teachers
- **File:** `backend/learning/views.py` (lines 374–385)
- **Threat:** `CertificateViewSet.get_queryset` returns `Certificate.objects.all()` for any `TEACHER`. There is no scoping to certificates issued by that teacher or for their courses.
- **Conceptual Fix:** Filter by `course__groups__primary_teacher=user` or `issued_by=user`.

---

### 🟢 LOW-1: Silent Error Swallowing in Security Toggle
- **File:** `frontend/src/components/ui/SecurityToggle.tsx` (line 15)
- **Threat:** The `axios.get` catch block is empty (`catch(() => {})`). If the API fails, the toggle silently fails and the user sees no error state.
- **Conceptual Fix:** Display a toast or error message when the API request fails.

---

### 🟢 LOW-2: Resource & Certificate File Downloads Unprotected
- **File:** `backend/learning/models.py` (lines 113, 163)
- **Threat:** `Resource.file_attachment` and `Certificate.certificate_image` use `FileField`/`ImageField`. If Django is serving files directly without a protected view, any user who knows the URL can download them regardless of enrollment.
- **Conceptual Fix:** Serve files through a DRF view that checks `IsAuthenticated` and enrollment before returning the file.

---

### 🟢 LOW-3: Unvalidated `room_id` in Message Queryset
- **File:** `backend/chat/views.py` (line 21)
- **Threat:** `room_id` is taken directly from query params and used in `filter(room_id=room_id)`. A non-integer value can cause an unhandled exception or unexpected type coercion.
- **Conceptual Fix:** Validate `room_id` with `int()` and catch `ValueError` to return `400`.

---

### 🟢 LOW-4: Frontend `learning/page.tsx` Translation Namespace Misuse
- **File:** `frontend/src/app/(dashboard)/learning/page.tsx` (line 97)
- **Threat:** `const t = dict.parent;` is assigned unconditionally. If `dict.parent` is missing keys used in non-parent contexts, it could cause runtime errors or undefined strings.
- **Conceptual Fix:** Use a conditional assignment or separate translation hook calls.

---

### 🟢 LOW-5: Quiz Start Button Non-Functional
- **File:** `frontend/src/app/(dashboard)/quizzes/page.tsx` (line 210)
- **Threat:** The "Start Exam" button has no `onClick` handler. It is rendered as a clickable button that does nothing, leading to a broken user experience.
- **Conceptual Fix:** Add an `onClick` handler that navigates to the quiz player or opens the exam.

---

### 🟢 LOW-6: Placeholder Components in Production Routes
- **Files:** `frontend/src/app/(dashboard)/chat/page.tsx`, `frontend/src/app/(dashboard)/super-admin/chats/page.tsx`, `frontend/src/app/(dashboard)/payment/page.tsx`
- **Threat:** These routes display "under development" messages but are accessible in production. Users may be confused.
- **Conceptual Fix:** Return `null` with a redirect, or gate them behind a feature flag.

---

## 2. Logic Bugs & Race Conditions

### 🔴 CRITICAL: Quiz Submission Race Condition (Duplicate)
- **Reference:** See Security section **CRITICAL-2**.

---

### 🟠 HIGH: CourseGroup Capacity Race Condition (Duplicate)
- **Reference:** See Security section **HIGH-2**.

---

### 🟡 MEDIUM: WebSocket Reconnect Race Condition
- **File:** `frontend/src/hooks/useWebSocket.ts` (lines 42–47)
- **Bug:** If the component unmounts after the WebSocket closes but before the 3-second reconnect timeout fires, the timeout persists and attempts to reconnect on a destroyed scope. Rapid mount/unmount can create multiple concurrent connections.
- **Conceptual Fix:** Track a `mounted` ref and clear the timeout in the effect cleanup. Also use a `connecting` flag to prevent duplicate connection attempts.

---

### 🟡 MEDIUM: Course Player Controls Stale Closure
- **File:** `frontend/src/app/(dashboard)/learning/[courseId]/page.tsx` (lines 145–151, 165)
- **Bug:** `handleControlsVisibility` is redefined on every render and references `isPlaying` and `isBuffering` from closure. It is called inside `useEffect` hooks that do not list it in dependency arrays, meaning it may use stale state values.
- **Conceptual Fix:** Wrap `handleControlsVisibility` in `useCallback` with `[isPlaying, isBuffering]` as dependencies, and include it in the `useEffect` dependency arrays.

---

### 🟡 MEDIUM: Post-Session Feedback Hardcoded Question Mapping
- **File:** `frontend/src/components/learning/PostSessionFeedbackModal.tsx` (lines 14–24, 60–73)
- **Bug:** The `QUESTIONS` array is hardcoded to 9 items. If the backend model changes (e.g., adds `q10_rating`), the frontend will fail to submit the new field or will submit `undefined` values.
- **Conceptual Fix:** Fetch the question schema from the backend or dynamically map the ratings array to `q{i}_rating` fields.

---

### 🟢 LOW: CoursePlayer DevTools Interval Performance
- **File:** `frontend/src/app/(dashboard)/learning/[courseId]/page.tsx` (lines 214–216)
- **Bug:** `setInterval(() => Function('debugger')(), 50)` runs every 50ms when Ghost Mode is on. It is easily bypassed and wastes CPU.
- **Conceptual Fix:** Remove or replace with a more robust server-side streaming control (e.g., signed URLs with short expiry).

---

## 3. Edge Cases

### 🔴 HIGH: Backend Analytics Views Crash on Missing `week` Field
- **File:** `backend/accounts/views.py` (lines 489, 494, 714)
- **Edge Case:** `Lesson` has no `week` field. Any request to parent analytics or super-admin stats will raise a `FieldError` and return `500`.
- **Conceptual Fix:** Correct the ORM path to `unit__course` or `course` depending on structure.

---

### 🔴 HIGH: Backend Analytics Views Import Non-Existent Model
- **File:** `backend/accounts/views.py` (line 693)
- **Edge Case:** `LiveSession` is imported but does not exist in `live.models`. The view crashes with `ImportError`.
- **Conceptual Fix:** Import `VirtualSession` instead.

---

### 🟡 MEDIUM: VirtualSession Timezone Parsing with Naive Datetimes
- **File:** `backend/live/views.py` (lines 38–40)
- **Edge Case:** `scheduled_time` might be naive (no timezone). `astimezone(cairo_tz)` assumes UTC for naive datetimes, which may cause sessions to be scheduled on the wrong day if the client's local timezone is not UTC.
- **Conceptual Fix:** Ensure `scheduled_time` is timezone-aware before converting, or explicitly treat it as `Africa/Cairo` local time.

---

### 🟡 MEDIUM: Frontend Cart Cleanup Missing Dependency
- **File:** `frontend/src/app/(dashboard)/learning/page.tsx` (lines 120–128)
- **Edge Case:** The `useEffect` calls `removeFromCart` but does not include it in dependencies (suppressed by `eslint-disable-line`). If the store action reference changes, the effect may use a stale function.
- **Conceptual Fix:** Include `removeFromCart` in the dependency array or use a stable Zustand action selector.

---

### 🟢 LOW: Invalid Date Handling in Community Chat
- **File:** `frontend/src/app/(dashboard)/community/page.tsx` (line 229)
- **Edge Case:** If `msg.timestamp` is `null` or malformed, `new Date(...)` returns `Invalid Date`, which `toLocaleTimeString` will throw on or display poorly.
- **Conceptual Fix:** Validate the timestamp before formatting.

---

### 🟢 LOW: Announcement Image URL Rendering
- **File:** `frontend/src/app/(dashboard)/super-admin/news/page.tsx` (line 116)
- **Edge Case:** `src={ann.image_url}` is rendered directly. If a malicious URL is stored (e.g., `javascript:alert(1)`), modern browsers block it, but it remains an XSS vector.
- **Conceptual Fix:** Sanitize the URL with a URL parser or an allow-list before rendering.

---

### 🟢 LOW: Hardcoded WhatsApp Number
- **File:** `frontend/src/app/(dashboard)/learning/page.tsx` (line 66)
- **Edge Case:** The WhatsApp number is hardcoded. If the business number changes, the link breaks.
- **Conceptual Fix:** Move the number to an environment variable or backend config.

---

## 4. Performance Bottlenecks

### 🟠 HIGH: SuperAdmin User List — N+1 Query & Python Iteration
- **File:** `backend/accounts/views.py` (lines 597–632)
- **Bottleneck:** The endpoint iterates over the full `User` queryset in Python, accessing `user.student_profile` without `select_related`. This causes one query per user. It also calculates age in Python instead of the DB.
- **Conceptual Fix:** Use `select_related('student_profile')` and `annotate` with `F` expressions or `ExtractYear` to compute age in SQL.

---

### 🟠 HIGH: ParentCourseAnalyticsView — Multiple Unbatched Queries
- **File:** `backend/accounts/views.py` (lines 445–582)
- **Bottleneck:** The view fires separate queries for sessions, attendance, lessons, progress, quizzes, and projects. No `prefetch_related` or `select_related` is used.
- **Conceptual Fix:** Use `prefetch_related` on the student's course groups, and aggregate counts with `Count` annotations rather than Python loops.

---

### 🟡 MEDIUM: SuperAdminStudentStatsView — Similar N+1 Pattern
- **File:** `backend/accounts/views.py` (lines 686–738)
- **Bottleneck:** Queries for `course_groups`, `VirtualSession`, `Attendance`, `Lesson`, `StudentProgress`, `StudentResult`, and `ProjectSubmission` are executed sequentially without prefetching.
- **Conceptual Fix:** Aggregate with `Count` and `Prefetch` where possible.

---

### 🟡 MEDIUM: CourseViewSet.create/update — Manual Object Creation Without Bulk Insert
- **File:** `backend/learning/views.py` (lines 82–301)
- **Bottleneck:** The `create` and `update` methods loop over groups, sessions, units, and lessons, creating objects one by one. For large courses, this is slow.
- **Conceptual Fix:** Use `bulk_create` for `ZoomSession`, `Unit`, and `Lesson` objects after building the list in memory.

---

### 🟡 MEDIUM: CourseSerializer Deep Nesting Re-evaluates Ghost Mode
- **File:** `backend/learning/serializers.py` (lines 66–90, 102–121)
- **Bottleneck:** `_get_ghost_mode()` is called inside `LessonSerializer.get_video_url` for every lesson. It hits the DB (or a cached singleton) per lesson. If a course has 100 lessons, that is 100 DB calls.
- **Conceptual Fix:** Cache `_get_ghost_mode()` in the serializer context or as a module-level singleton with a short TTL.

---

### 🟢 LOW: Frontend Cart Cleanup — Multiple State Updates
- **File:** `frontend/src/app/(dashboard)/learning/page.tsx` (lines 120–128)
- **Bottleneck:** `cartItems.forEach(item => removeFromCart(item.id))` triggers one Zustand state update per stale item.
- **Conceptual Fix:** Add a `removeManyFromCart` action that accepts an array of IDs and updates state once.

---

### 🟢 LOW: TeacherStudentSearchView Slicing Before Serialization
- **File:** `backend/accounts/views.py` (line 821)
- **Bottleneck:** `students = students[:50]` limits results, but the queryset is still fully evaluated and serialized in Python before slicing. The response is a raw list, not a paginated DRF response.
- **Conceptual Fix:** Use DRF's built-in `Pagination` class to limit at the DB level and return a standard paginated response.

---

## 5. Appendix: File Inventory Audited

### Backend (Django/DRF)
- `backend/config/settings.py`
- `backend/config/urls.py`
- `backend/config/asgi.py`
- `backend/config/wsgi.py`
- `backend/config/celery.py`
- `backend/accounts/models.py`
- `backend/accounts/views.py`
- `backend/accounts/serializers.py`
- `backend/accounts/permissions.py`
- `backend/accounts/authentication.py`
- `backend/accounts/admin.py`
- `backend/accounts/urls.py`
- `backend/accounts/apps.py`
- `backend/learning/models.py`
- `backend/learning/views.py`
- `backend/learning/serializers.py`
- `backend/learning/apps.py`
- `backend/live/models.py`
- `backend/live/views.py`
- `backend/live/serializers.py`
- `backend/live/tasks.py`
- `backend/live/apps.py`
- `backend/quizzes/models.py`
- `backend/quizzes/views.py`
- `backend/quizzes/serializers.py`
- `backend/quizzes/apps.py`
- `backend/chat/models.py`
- `backend/chat/views.py`
- `backend/chat/serializers.py`
- `backend/chat/consumers.py`
- `backend/chat/utils.py`
- `backend/chat/routing.py`
- `backend/chat/apps.py`
- `backend/support/models.py`
- `backend/support/views.py`
- `backend/support/serializers.py`
- `backend/support/apps.py`
- `backend/payment/models.py`
- `backend/payment/views.py`
- `backend/payment/serializers.py`
- `backend/payment/apps.py`
- `backend/test_crypto.py`
- `backend/create_room.py`
- `backend/fix_logic.py`
- `backend/fix_logic_2.py`
- `backend/requirements.txt`

### Frontend (Next.js / React / TypeScript)
- `frontend/src/middleware.ts`
- `frontend/src/lib/axios.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/auth.ts`
- `frontend/src/lib/api-config.ts`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/api/auth/[...nextauth]/route.ts`
- `frontend/src/app/(dashboard)/page.tsx`
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `frontend/src/app/(dashboard)/learning/page.tsx`
- `frontend/src/app/(dashboard)/learning/[courseId]/page.tsx`
- `frontend/src/app/(dashboard)/schedule/page.tsx`
- `frontend/src/app/(dashboard)/sessions/page.tsx`
- `frontend/src/app/(dashboard)/parent-dashboard/page.tsx`
- `frontend/src/app/(dashboard)/parent/courses/[courseId]/analytics/page.tsx`
- `frontend/src/app/(dashboard)/super-admin/layout.tsx`
- `frontend/src/app/(dashboard)/super-admin/users/page.tsx`
- `frontend/src/app/(dashboard)/super-admin/courses/page.tsx`
- `frontend/src/app/(dashboard)/super-admin/settings/page.tsx`
- `frontend/src/app/(dashboard)/super-admin/news/page.tsx`
- `frontend/src/app/(dashboard)/super-admin/chats/page.tsx`
- `frontend/src/app/(dashboard)/super-admin/finance/page.tsx`
- `frontend/src/app/(dashboard)/teacher/page.tsx`
- `frontend/src/app/(dashboard)/teacher/courses/page.tsx`
- `frontend/src/app/(dashboard)/teacher/layout.tsx`
- `frontend/src/app/(dashboard)/settings/page.tsx`
- `frontend/src/app/(dashboard)/chat/page.tsx`
- `frontend/src/app/(dashboard)/community/page.tsx`
- `frontend/src/app/(dashboard)/quizzes/page.tsx`
- `frontend/src/app/(dashboard)/projects/page.tsx`
- `frontend/src/app/(dashboard)/certificates/page.tsx`
- `frontend/src/app/(dashboard)/resources/page.tsx`
- `frontend/src/app/(dashboard)/payment/page.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/register/page.tsx`
- `frontend/src/app/onboarding/page.tsx`
- `frontend/src/app/parent-setup/page.tsx`
- `frontend/src/app/forgot-password/page.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/learning/CoursePlayer.tsx`
- `frontend/src/components/learning/AIAnalysisHelper.tsx`
- `frontend/src/components/learning/CohortSelectionModal.tsx`
- `frontend/src/components/learning/PostSessionFeedbackModal.tsx`
- `frontend/src/components/chat/ChatWindow.tsx`
- `frontend/src/components/chat/ChatInput.tsx`
- `frontend/src/components/chat/MessageBubble.tsx`
- `frontend/src/components/auth/SingleTabEnforcer.tsx`
- `frontend/src/components/quizzes/QuizPlayer.tsx`
- `frontend/src/components/guest/GuestDashboard.tsx`
- `frontend/src/components/guest/GuestRestrictionPopup.tsx`
- `frontend/src/components/guest/NewsCarousel.tsx`
- `frontend/src/components/shared/RestrictionModal.tsx`
- `frontend/src/components/ui/SecurityToggle.tsx`
- `frontend/src/components/ui/Toast.tsx`
- `frontend/src/components/ui/EmptyState.tsx`
- `frontend/src/components/providers/ThemeProvider.tsx`
- `frontend/src/hooks/useUserRole.ts`
- `frontend/src/hooks/useWebSocket.ts`
- `frontend/src/hooks/useLocale.ts`
- `frontend/src/store/cartStore.ts`
- `frontend/src/i18n/TranslationContext.tsx`
- `frontend/src/providers/AuthProvider.tsx`
- `frontend/src/types/next-auth.d.ts`

---

*End of Report.*
