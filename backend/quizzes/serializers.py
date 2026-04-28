from rest_framework import serializers
from .models import Quiz, Question, Choice, StudentResult

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']

    def to_representation(self, instance):
        """ Hide is_correct from students when fetching questions """
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and getattr(request.user, 'role', None) == 'STUDENT':
            ret.pop('is_correct', None)
        return ret

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)
    
    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'choices']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'lesson', 'week', 'created_by', 'created_at', 'questions']
        read_only_fields = ['created_by', 'created_at']

class StudentResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentResult
        fields = ['id', 'student', 'quiz', 'score', 'submitted_at']
        read_only_fields = ['student', 'score', 'submitted_at']
