import uuid
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from .models import User, StudentProfile, TeacherProfile, StudyGroup


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['session_version'] = str(user.session_version)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        self.user.session_version = uuid.uuid4()
        self.user.save(update_fields=['session_version'])
        
        refresh = self.get_token(self.user)
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        
        return data


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework.exceptions import AuthenticationFailed
        
        try:
            refresh_token = RefreshToken(attrs['refresh'])
            session_version = refresh_token.get('session_version')
            user_id = refresh_token.get('user_id')
        except Exception:
            raise AuthenticationFailed('Invalid refresh token.')
            
        if not session_version or not user_id:
            raise AuthenticationFailed('Invalid token claims.')
            
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found.')
            
        if str(user.session_version) != str(session_version):
            raise AuthenticationFailed('Session expired. Logged in from another device.')
            
        data = super().validate(attrs)
        return data



class UserSerializer(serializers.ModelSerializer):
    parent_email = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'is_onboarded', 'age_group', 'exact_age', 'parent_email']
        read_only_fields = ['role']

    def get_parent_email(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.parent_email
        return None


class OnboardingSerializer(serializers.Serializer):
    """
    Validates onboarding payload.
    - Guest: only role required
    - Student: role + age_group + exact_age required, with range validation
    """
    role = serializers.ChoiceField(choices=['STUDENT', 'GUEST'])
    age_group = serializers.ChoiceField(
        choices=User.AgeGroup.choices,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    exact_age = serializers.IntegerField(required=False, allow_null=True)

    # Age ranges per group for validation
    AGE_RANGES = {
        'CHILDREN': (6, 10),
        'TWEENS': (11, 12),
        'TEENS': (13, 20),
    }

    def validate(self, data):
        role = data.get('role')

        if role == 'STUDENT':
            age_group = data.get('age_group')
            exact_age = data.get('exact_age')

            if not age_group:
                raise serializers.ValidationError({'age_group': 'Age group is required for students.'})
            if exact_age is None:
                raise serializers.ValidationError({'exact_age': 'Exact age is required for students.'})

            min_age, max_age = self.AGE_RANGES.get(age_group, (0, 0))
            if not (min_age <= exact_age <= max_age):
                raise serializers.ValidationError({
                    'exact_age': f'Age must be between {min_age} and {max_age} for the selected group.'
                })

        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    class Meta:
        model = User
        fields = ('full_name', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            role='STUDENT',
            is_onboarded=False
        )
        return user

class EnrolledCourseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    color = serializers.CharField(required=False)

class StudentInfoSerializer(serializers.Serializer):
    name = serializers.CharField()
    level = serializers.CharField()

class ParentDashboardSerializer(serializers.Serializer):
    student_info = StudentInfoSerializer()
    enrolled_courses = EnrolledCourseSerializer(many=True)
    overall_evaluation = serializers.CharField()
