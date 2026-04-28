from rest_framework import serializers
from .models import PaymentMethod, Subscription

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name', 'description', 'instructions', 'icon', 'is_active']

class SubscriptionSerializer(serializers.ModelSerializer):
    payment_method_details = PaymentMethodSerializer(source='payment_method', read_only=True)
    course_name = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'user', 'course', 'course_name', 'payment_method', 'payment_method_details', 'transaction_id', 'receipt_image', 'status', 'is_active', 'created_at']
        read_only_fields = ['user', 'status', 'is_active']

    def create(self, validated_data):
        request_user = self.context['request'].user
        
        if request_user.role == 'PARENT':
            from accounts.models import StudentProfile
            from rest_framework.exceptions import ValidationError
            
            student_profile = StudentProfile.objects.filter(parents=request_user).first()
            if not student_profile:
                student_profile = StudentProfile.objects.filter(parent_email__iexact=request_user.email).first()
                
            if not student_profile:
                raise ValidationError({"detail": "No student profile found linked to this parent account."})
                
            target_user = student_profile.user
        else:
            target_user = request_user
            
        validated_data['user'] = target_user
        return super().create(validated_data)
