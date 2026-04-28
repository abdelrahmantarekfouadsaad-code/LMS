"""
DATABASE WIPE SCRIPT
Deletes all records from content models while keeping User accounts.
Run: python wipe_data.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from learning.models import Course, Week, Lesson, StudentProgress, Resource
from quizzes.models import Quiz, Question, Choice, StudentResult
from chat.models import ChatRoom, Message
from support.models import SupportTicket

def wipe():
    print("=" * 60)
    print("  DATABASE WIPE - Removing all mock/seed data")
    print("=" * 60)
    
    # Order matters: delete children before parents to avoid FK issues
    models_to_wipe = [
        ("StudentProgress", StudentProgress),
        ("StudentResult", StudentResult),
        ("Choice", Choice),
        ("Question", Question),
        ("Quiz", Quiz),
        ("Resource", Resource),
        ("Lesson", Lesson),
        ("Week", Week),
        ("Course", Course),
        ("Message (ChatMessage)", Message),
        ("ChatRoom", ChatRoom),
        ("SupportTicket", SupportTicket),
    ]
    
    for name, model in models_to_wipe:
        count = model.objects.count()
        if count > 0:
            model.objects.all().delete()
            print(f"  [DELETED] {name}: {count} records removed")
        else:
            print(f"  [EMPTY]   {name}: 0 records (already clean)")
    
    print()
    print("=" * 60)
    print("  WIPE COMPLETE. All content tables are now empty.")
    print("  User accounts have been preserved.")
    print("=" * 60)

if __name__ == '__main__':
    wipe()
