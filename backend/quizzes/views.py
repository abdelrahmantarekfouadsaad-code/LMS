from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Quiz, Question, Choice, StudentResult
from .serializers import QuizSerializer, StudentResultSerializer
from accounts.permissions import IsTeacher, IsSuperAdmin, IsSupervisor

class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.role in ['TEACHER', 'SUPER_ADMIN', 'SUPERVISOR'])

class QuizViewSet(viewsets.ModelViewSet):
    """
    Teachers can create quizzes.
    Students can read and submit answers.
    """
    queryset = Quiz.objects.prefetch_related('questions__choices').all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        """
        Students submit a dictionary of {question_id: choice_id} to get auto-graded.
        Maximum 2 attempts per quiz.
        """
        if request.user.role != 'STUDENT':
            return Response({"error": "Only students can submit quizzes."}, status=status.HTTP_403_FORBIDDEN)
            
        quiz = self.get_object()
        
        # Phase 3: Enforce maximum 2 attempts
        existing_attempts = StudentResult.objects.filter(
            student=request.user, quiz=quiz
        ).count()
        
        if existing_attempts >= StudentResult.MAX_ATTEMPTS:
            return Response(
                {"error": f"Maximum {StudentResult.MAX_ATTEMPTS} attempts reached for this quiz."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        answers = request.data.get('answers', {})
        
        if not answers:
            return Response({"error": "No answers provided."}, status=status.HTTP_400_BAD_REQUEST)

        total_questions = quiz.questions.count()
        correct_answers = 0

        with transaction.atomic():
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
            # Simplified: In reality, filter by Teacher's StudyGroups
            return StudentResult.objects.all() 
        return StudentResult.objects.filter(student=user)
