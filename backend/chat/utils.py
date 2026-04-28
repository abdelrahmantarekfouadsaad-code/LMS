"""
Phase 3: Community Matrix Auto-Join Logic.
Called after successful enrollment / payment approval to set up all chat rooms.
"""
from .models import ChatRoom


def setup_student_chat_rooms(student, course):
    """
    Auto-joins a student into all relevant community tiers and
    auto-initiates a private chat with the course teacher.
    
    Tier 1: Global Academy Room (all authenticated users)
    Tier 2: Age-Group Room (based on student's onboarded age_group)
    Tier 3: Course-Specific Room (auto-generated per course)
    Private: 1-on-1 with the course's primary teacher
    """

    # --- Tier 1: Global Community Room ---
    global_room, _ = ChatRoom.objects.get_or_create(
        room_type=ChatRoom.RoomType.COMMUNITY,
        defaults={'is_active': True}
    )
    global_room.participants.add(student)

    # --- Tier 2: Age-Group Room ---
    if student.age_group:
        age_room, _ = ChatRoom.objects.get_or_create(
            room_type=ChatRoom.RoomType.AGE_GROUP,
            age_group=student.age_group,
            defaults={'is_active': True}
        )
        age_room.participants.add(student)

    # --- Tier 3: Course-Specific Room ---
    course_room, _ = ChatRoom.objects.get_or_create(
        room_type=ChatRoom.RoomType.COURSE,
        course=course,
        defaults={'is_active': True}
    )
    course_room.participants.add(student)

    # --- Private 1-on-1 Chat with Teacher ---
    study_group = course.study_groups.first()
    if study_group and study_group.primary_teacher:
        teacher = study_group.primary_teacher
        # Check if a private chat between this student and teacher already exists
        existing = ChatRoom.objects.filter(
            room_type=ChatRoom.RoomType.PRIVATE,
            participants=student
        ).filter(
            participants=teacher
        ).first()

        if not existing:
            private_room = ChatRoom.objects.create(
                room_type=ChatRoom.RoomType.PRIVATE,
                is_active=True
            )
            private_room.participants.add(student, teacher)
