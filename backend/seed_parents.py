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

def seed_parents_data():
    print("[INFO] Starting parent dashboard database seeder...")

    # 1. Fetch or create Student user
    student, created_student = User.objects.get_or_create(
        email="student@noor.edu",
        defaults={
            'full_name': 'Ahmed The Student',
            'role': User.Role.STUDENT,
            'is_onboarded': True,
            'age_group': User.AgeGroup.TEENS,
            'exact_age': 16
        }
    )
    if created_student:
        student.set_password('password123')
        student.save()
        print("[SUCCESS] Created Student user: student@noor.edu")
        
    student_profile, _ = StudentProfile.objects.get_or_create(
        user=student,
        defaults={
            'date_of_birth': datetime.date(2010, 1, 1),
            'parent_email': 'parent@noor.edu'
        }
    )
    # Ensure parent_email is correct
    student_profile.parent_email = 'parent@noor.edu'
    student_profile.save()

    # 2. Fetch or create Parent user
    parent, created_parent = User.objects.get_or_create(
        email="parent@noor.edu",
        defaults={
            'full_name': 'Parent of Ahmed The Student',
            'role': User.Role.PARENT,
            'is_onboarded': True
        }
    )
    if created_parent:
        parent.set_password('password123')
        parent.save()
        print("[SUCCESS] Created Parent user: parent@noor.edu")

    # Link Parent to Student's profile
    student_profile.parents.add(parent)
    print("[LINK] Linked parent@noor.edu to student Ahmed in StudentProfile parents field.")

    # 3. Create Teacher for seeder context
    teacher, created_teacher = User.objects.get_or_create(
        email="teacher@noor.edu",
        defaults={
            'full_name': 'Dr. Tariq Al-Suwaidan',
            'role': User.Role.TEACHER,
            'is_onboarded': True
        }
    )
    if created_teacher:
        teacher.set_password('password123')
        teacher.save()
        TeacherProfile.objects.get_or_create(user=teacher, specialization='Islamic History')
        print("[SUCCESS] Created Teacher user: teacher@noor.edu")

    # 4. Create premium courses
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

    # 5. Enroll student in Course B
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
        print("[BILLING] Active Enrollment Subscription approved for Ahmed in Seerah Masterclass.")

    # 6. Create Weeks & Lessons for Course B (to calculate progress)
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

    # Mark Lesson 1 & Lesson 2 as completed for Ahmed
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

    # 7. Create StudyGroup and Live Sessions (Attendance: 8/10)
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

    # 8. Create Quizzes and StudentResults (Grades / Attempt calculations)
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

    # 9. Create Project and Submissions
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

    print("[SUCCESS] Database seeding completed successfully. Parent Supervisory Portal is fully populated with test data!")

if __name__ == '__main__':
    seed_parents_data()
