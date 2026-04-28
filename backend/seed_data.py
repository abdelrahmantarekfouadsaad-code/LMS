import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User, StudentProfile, TeacherProfile, StudyGroup
from learning.models import Course, Week, Lesson
from quizzes.models import Quiz, Question, Choice

def seed():
    print("Seeding database...")
    
    # 1. Users
    student_email = "student@noor.edu"
    teacher_email = "teacher@noor.edu"
    
    student, _ = User.objects.get_or_create(email=student_email, defaults={
        'full_name': 'Ahmed The Student',
        'role': 'STUDENT',
    })
    if _:
        student.set_password('password123')
        student.save()
        StudentProfile.objects.create(user=student, date_of_birth='2000-01-01')
        print("Created student")

    teacher, _ = User.objects.get_or_create(email=teacher_email, defaults={
        'full_name': 'Dr. Sedky',
        'role': 'TEACHER',
    })
    if _:
        teacher.set_password('password123')
        teacher.save()
        TeacherProfile.objects.create(user=teacher, specialization='Fiqh')
        print("Created teacher")

    # 2. Courses
    course1, _ = Course.objects.get_or_create(title="Fundamentals of Fiqh", defaults={'description': 'Learn the basics of Islamic Jurisprudence.'})
    course2, _ = Course.objects.get_or_create(title="Tajweed Basics", defaults={'description': 'Proper recitation of the Holy Quran.'})
    course3, _ = Course.objects.get_or_create(title="Islamic History", defaults={'description': 'The biography of the Prophet (Seerah).'})
    
    print("Created courses")

    # 3. Weeks & Lessons for Course 1
    w1, _ = Week.objects.get_or_create(course=course1, week_number=1, defaults={'title': 'Introduction to Purity (Taharah)'})
    Lesson.objects.get_or_create(week=w1, lesson_number=1, defaults={'title': 'Types of Water', 'video_url': 'http://example.com/vid1', 'estimated_minutes': 15})
    Lesson.objects.get_or_create(week=w1, lesson_number=2, defaults={'title': 'Najasa (Impure Substances)', 'video_url': 'http://example.com/vid2', 'estimated_minutes': 25})
    Lesson.objects.get_or_create(week=w1, lesson_number=3, defaults={'title': 'Wudu Requirements', 'video_url': 'http://example.com/vid3', 'estimated_minutes': 20})
    Lesson.objects.get_or_create(week=w1, lesson_number=4, defaults={'title': 'Nullifiers of Wudu', 'video_url': 'http://example.com/vid4', 'estimated_minutes': 10})
    Lesson.objects.get_or_create(week=w1, lesson_number=5, defaults={'title': 'Ghusl (Major Bath)', 'video_url': 'http://example.com/vid5', 'estimated_minutes': 30})

    # Weeks & Lessons for Course 2
    w2, _ = Week.objects.get_or_create(course=course2, week_number=1, defaults={'title': 'Makharij (Articulation Points)'})
    Lesson.objects.get_or_create(week=w2, lesson_number=1, defaults={'title': 'The Throat Letters', 'video_url': 'http://example.com/vid6', 'estimated_minutes': 12})
    Lesson.objects.get_or_create(week=w2, lesson_number=2, defaults={'title': 'The Tongue Letters', 'video_url': 'http://example.com/vid7', 'estimated_minutes': 18})

    print("Created lessons")

    # 4. Quizzes
    quiz1, _ = Quiz.objects.get_or_create(title="Taharah Midterm", defaults={'week': w1, 'created_by': teacher})
    q1, _ = Question.objects.get_or_create(quiz=quiz1, text="Which water is permissible for Wudu?", order=1)
    Choice.objects.get_or_create(question=q1, text="Mutlaq Water", is_correct=True)
    Choice.objects.get_or_create(question=q1, text="Musta'mal Water", is_correct=False)

    quiz2, _ = Quiz.objects.get_or_create(title="Makharij Assessment", defaults={'week': w2, 'created_by': teacher})
    q2, _ = Question.objects.get_or_create(quiz=quiz2, text="How many throat letters are there?", order=1)
    Choice.objects.get_or_create(question=q2, text="6", is_correct=True)
    Choice.objects.get_or_create(question=q2, text="4", is_correct=False)
    
    print("Created quizzes")

    print("Database seeding completed successfully.")

if __name__ == '__main__':
    seed()
