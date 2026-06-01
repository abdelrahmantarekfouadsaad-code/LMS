import os
import django
from django.utils import timezone
import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User, StudentProfile, TeacherProfile, StudyGroup
from learning.models import Course, Week, Lesson, StudentProgress, Project, ProjectSubmission
from quizzes.models import Quiz, StudentResult
from live.models import LiveSession, Attendance
from payment.models import Subscription

def seed_targeted_data():
    print("[INFO] Starting targeted parent dashboard database seeder...")

    student_email = "programmerabdulrahmantarek@gmail.com"
    parent_email = "boodyramadan333@gmail.com"

    # 1. Fetch Student User (Do NOT create)
    try:
        student = User.objects.get(email__iexact=student_email)
        print(f"[SUCCESS] Located Student user: {student_email}")
    except User.DoesNotExist:
        print(f"[ERROR] Student user '{student_email}' was not found in the database. Please register or seed this student first.")
        return

    # 2. Fetch Parent User (Do NOT create)
    try:
        parent = User.objects.get(email__iexact=parent_email)
        print(f"[SUCCESS] Located Parent user: {parent_email}")
    except User.DoesNotExist:
        print(f"[ERROR] Parent user '{parent_email}' was not found in the database. Please register or seed this parent first.")
        return

    # Ensure student role is STUDENT and parent role is PARENT
    if student.role != User.Role.STUDENT:
        student.role = User.Role.STUDENT
        student.save(update_fields=['role'])
        print(f"[INFO] Adjusted role of '{student_email}' to STUDENT.")
        
    if parent.role != User.Role.PARENT:
        parent.role = User.Role.PARENT
        parent.save(update_fields=['role'])
        print(f"[INFO] Adjusted role of '{parent_email}' to PARENT.")

    # 3. Create or Update StudentProfile and Link Parent
    student_profile, created_profile = StudentProfile.objects.get_or_create(
        user=student,
        defaults={
            'date_of_birth': datetime.date(2005, 1, 1),
            'parent_email': parent_email
        }
    )
    student_profile.parent_email = parent_email
    student_profile.parents.add(parent)
    student_profile.save()
    print(f"[LINK] Linked parent '{parent_email}' to student '{student_email}' in StudentProfile.")

    # 4. Fetch or Create Teacher for context
    teacher, _ = User.objects.get_or_create(
        email="teacher@noor.edu",
        defaults={
            'full_name': 'Dr. Tariq Al-Suwaidan',
            'role': User.Role.TEACHER,
            'is_onboarded': True
        }
    )
    if _:
        teacher.set_password('password123')
        teacher.save()
        TeacherProfile.objects.get_or_create(user=teacher, specialization='Islamic History')
        print("[SUCCESS] Created Teacher user: teacher@noor.edu")

    # 5. Create premium courses
    # Course A: Unenrolled (Advanced Fiqh 101)
    course_a, created_a = Course.objects.get_or_create(
        title="Advanced Fiqh 101",
        defaults={
            'title_ar': "الفقه المتقدم ١٠١",
            'description': "Deep dive into comparative Islamic jurisprudence rules and contexts.",
            'price': 199.99,
            'instructor': "Sheikh Yousef Al-Qaradawi",
            'duration': "8 Weeks",
            'color': "from-blue-500/20 to-indigo-600/20",
            'is_active': True
        }
    )
    if created_a:
        print("[COURSE] Created Course A (Unenrolled): Advanced Fiqh 101")

    # Course B: Enrolled (Seerah Masterclass)
    course_b, created_b = Course.objects.get_or_create(
        title="Seerah Masterclass",
        defaults={
            'title_ar': "ماستر كلاس السيرة النبوية",
            'description': "Thorough analytical study of the biographical life of the Prophet Muhammad.",
            'price': 149.99,
            'instructor': "Dr. Tariq Al-Suwaidan",
            'duration': "10 Weeks",
            'color': "from-emerald-500/20 to-teal-600/20",
            'is_active': True
        }
    )
    if created_b:
        print("[COURSE] Created Course B (Enrolled): Seerah Masterclass")

    # 6. Enroll Student in Course B
    subscription, created_sub = Subscription.objects.get_or_create(
        user=student,
        course=course_b,
        defaults={
            'status': 'approved',
            'is_active': True
        }
    )
    if created_sub or not subscription.is_active:
        subscription.status = 'approved'
        subscription.is_active = True
        subscription.save()
        print(f"[BILLING] Active Enrollment Subscription approved for '{student_email}' in Seerah Masterclass.")

    # 7. Create Weeks & Lessons for Course B (to calculate progress)
    w1, _ = Week.objects.get_or_create(course=course_b, week_number=1, defaults={'title': 'Birth & Early Life'})
    lesson1, _ = Lesson.objects.get_or_create(
        week=w1, lesson_number=1,
        defaults={'title': 'The Year of the Elephant', 'video_url': 'http://example.com/elephant', 'estimated_minutes': 20}
    )
    lesson2, _ = Lesson.objects.get_or_create(
        week=w1, lesson_number=2,
        defaults={'title': 'Youth and Trade', 'video_url': 'http://example.com/youth', 'estimated_minutes': 25}
    )

    w2, _ = Week.objects.get_or_create(course=course_b, week_number=2, defaults={'title': 'The Revelation'})
    lesson3, _ = Lesson.objects.get_or_create(
        week=w2, lesson_number=1,
        defaults={'title': 'Ghar Hira', 'video_url': 'http://example.com/hira', 'estimated_minutes': 30}
    )
    lesson4, _ = Lesson.objects.get_or_create(
        week=w2, lesson_number=2,
        defaults={'title': 'Secret Propagation', 'video_url': 'http://example.com/secret', 'estimated_minutes': 15}
    )

    # Mark Lesson 1 & Lesson 2 as completed for student
    StudentProgress.objects.get_or_create(
        student=student,
        lesson=lesson1,
        defaults={'is_completed': True, 'completed_at': timezone.now()}
    )
    StudentProgress.objects.get_or_create(
        student=student,
        lesson=lesson2,
        defaults={'is_completed': True, 'completed_at': timezone.now()}
    )
    print("[PROGRESS] Created lessons & progress: 2/4 completed lessons (50% progress).")

    # 8. Create StudyGroup and Live Sessions (Attendance: 8/10)
    study_group, _ = StudyGroup.objects.get_or_create(
        name="Seerah Batch Alpha",
        course=course_b,
        defaults={'primary_teacher': teacher}
    )
    student_profile.study_groups.add(study_group)

    print("[SCHEDULE] Seeding 10 Live Sessions and establishing 8/10 attendance ratio...")
    for i in range(1, 11):
        session_title = f"Live Session {i}: Chapter {i}"
        session, _ = LiveSession.objects.get_or_create(
            teacher=teacher,
            study_group=study_group,
            title=session_title,
            defaults={
                'scheduled_time': timezone.now() - datetime.timedelta(days=(11 - i)),
                'zoom_join_url': f"https://zoom.us/j/mock{i}"
            }
        )
        
        # Attend sessions 1 through 8 (Attendance ratio: 8/10 = 80%)
        if i <= 8:
            Attendance.objects.get_or_create(
                session=session,
                student=student
            )

    print("[METRICS] Attendance ratio: 8/10 successfully mapped in database.")

    # 9. Create Quizzes and StudentResults
    quiz1, _ = Quiz.objects.get_or_create(
        title="Quiz 1: Fundamentals of Seerah",
        defaults={'lesson': lesson1, 'created_by': teacher}
    )
    StudentResult.objects.get_or_create(
        student=student,
        quiz=quiz1,
        attempt_number=1,
        defaults={'score': 90.00}
    )

    quiz2, _ = Quiz.objects.get_or_create(
        title="Midterm Assessment: Early Revelations",
        defaults={'lesson': lesson3, 'created_by': teacher}
    )
    # Attempt 1: failed (60.00), Attempt 2: passed (85.00)
    StudentResult.objects.get_or_create(
        student=student,
        quiz=quiz2,
        attempt_number=1,
        defaults={'score': 60.00}
    )
    StudentResult.objects.get_or_create(
        student=student,
        quiz=quiz2,
        attempt_number=2,
        defaults={'score': 85.00}
    )
    print("[GRADES] Quiz assessment scores (90% & 85% midterm on attempt 2) seeded successfully.")

    # 10. Create Project and Submissions
    project, _ = Project.objects.get_or_create(
        title="Level 1 Capstone Project Research",
        defaults={
            'description': "Prepare a research paper detailing the social construct of Medina post-Hijrah.",
            'course': course_b,
            'due_date': timezone.now() + datetime.timedelta(days=15)
        }
    )
    ProjectSubmission.objects.get_or_create(
        student=student,
        project=project,
        defaults={
            'drive_link': "https://drive.google.com/mock-capstone-link",
            'is_graded': True,
            'grade': "A+"
        }
    )
    print("[PROJECTS] Graded Capstone Project (A+) submission record populated.")

    print(f"[SUCCESS] Database seeding completed successfully. Mapped rich test data to '{student_email}'!")

if __name__ == '__main__':
    seed_targeted_data()
