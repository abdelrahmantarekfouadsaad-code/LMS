from rest_framework import serializers
from .models import VirtualSession, Attendance, SessionFeedback

class VirtualSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualSession
        fields = [
            'id', 'teacher', 'course_group', 'title', 'scheduled_time', 
            'zoom_join_url', 'zoom_start_url', 'zoom_meeting_id', 
            'zoom_passcode', 'created_at'
        ]
        read_only_fields = ['teacher', 'zoom_join_url', 'zoom_start_url', 'zoom_meeting_id', 'zoom_passcode', 'created_at']

    def to_representation(self, instance):
        """ Ensure students cannot see the zoom_start_url which is meant for the host """
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and getattr(request.user, 'role', None) == 'STUDENT':
            ret.pop('zoom_start_url', None)
        return ret

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'session', 'student', 'joined_at']
        read_only_fields = ['student', 'joined_at']

class SessionFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionFeedback
        fields = '__all__'
        read_only_fields = ['student', 'teacher', 'created_at']
