from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
import json
import urllib.request
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, OnboardingSerializer, RegisterSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch', 'put'])
    def update_profile(self, request):
        print("--- DEBUG: INCOMING PAYLOAD ---", request.data) # MUST INCLUDE THIS
        user = request.user
        
        # Security: Strictly strip out role to prevent privilege escalation
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'role' in data:
            try:
                data.pop('role')
            except AttributeError:
                pass
                
        # Allow updating full_name and email
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'email' in data:
            user.email = data['email']
        if 'age_group' in data:
            user.age_group = data['age_group']
        if 'exact_age' in data:
            user.exact_age = data['exact_age']
        user.save()

        if 'parent_email' in data:
            if not hasattr(user, 'student_profile'):
                from .models import StudentProfile
                # Create the missing profile so the data isn't dropped
                StudentProfile.objects.create(user=user)
                
            print("--- DEBUG: PREVIOUS EMAIL ---", user.student_profile.parent_email)
            user.student_profile.parent_email = data['parent_email']
            user.student_profile.save()
            print("--- DEBUG: SAVED EMAIL ---", user.student_profile.parent_email)

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({'error': 'Both current and new passwords are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.check_password(current_password):
            return Response({'error': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password updated successfully.'})

    @action(detail=False, methods=['post'])
    def onboard(self, request):
        """
        One-time onboarding endpoint.
        Validates role selection (STUDENT/GUEST) and optional age data,
        then permanently saves the onboarding state.
        """
        user = request.user

        # Prevent re-onboarding
        if user.is_onboarded:
            return Response(
                {'detail': 'You have already completed onboarding.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data
        user.role = validated['role']
        user.is_onboarded = True

        if validated['role'] == 'STUDENT':
            user.age_group = validated['age_group']
            user.exact_age = validated['exact_age']

        user.save(update_fields=['role', 'is_onboarded', 'age_group', 'exact_age', 'updated_at'])

        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({'detail': 'User registered successfully.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the token using Google's tokeninfo endpoint
            url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                
                email = data.get('email')
                name = data.get('name', 'Google User')
                
                if not email:
                    return Response({'error': 'No email in token'}, status=status.HTTP_400_BAD_REQUEST)
                
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'full_name': name,
                        'role': 'STUDENT',
                        'is_onboarded': False
                    }
                )

                # Generate simplejwt tokens
                refresh = RefreshToken.for_user(user)

                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'role': user.role,
                    'is_onboarded': user.is_onboarded,
                }, status=status.HTTP_200_OK)

        except urllib.error.URLError as e:
            return Response({'error': f'Token verification failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            # Trigger email to the console backend
            subject = 'Password Reset Requested'
            message = f'Your password reset token is: {token}\nCopy this token and paste it into the reset password page.'
            from_email = 'noreply@lms.com'
            recipient_list = [user.email]
            send_mail(subject, message, from_email, recipient_list, fail_silently=False)

            return Response({'message': 'If an account exists, a reset link has been sent.', 'uid': uid}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # We don't want to leak whether the email exists, so we still return 200
            return Response({'message': 'If an account exists, a reset link has been sent.'}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not all([uidb64, token, new_password]):
            return Response({'error': 'Missing parameters'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class ParentVerifyView(APIView):
    """
    Step 1 of Parent Setup: Verify if the provided email
    exists in any StudentProfile.parent_email field.
    Returns:
      - { status: 'needs_password', student_name: '...' } if the email is linked but no User account exists yet.
      - { status: 'already_registered' } if a User with that email already exists.
      - 404 if the email is not found in any StudentProfile.parent_email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from .models import StudentProfile
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if this email is linked in any student profile
        student_profile = StudentProfile.objects.filter(parent_email__iexact=email).first()
        if not student_profile:
            return Response(
                {'error': 'This email is not linked to any student account.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if a User account with this email already exists
        existing_user = User.objects.filter(email__iexact=email).first()
        if existing_user:
            return Response({'status': 'already_registered'}, status=status.HTTP_200_OK)

        return Response({
            'status': 'needs_password',
            'student_name': student_profile.user.full_name,
        }, status=status.HTTP_200_OK)


class ParentCreateView(APIView):
    """
    Step 2 of Parent Setup: Create the Parent user account and link
    it to the student's profile via the ManyToMany 'parents' field.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from .models import StudentProfile
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify again that this email is actually linked
        student_profile = StudentProfile.objects.filter(parent_email__iexact=email).first()
        if not student_profile:
            return Response(
                {'error': 'This email is not linked to any student account.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Prevent duplicate account creation
        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_409_CONFLICT)

        # Create the parent user
        parent_user = User.objects.create_user(
            email=email,
            password=password,
            full_name=f"Parent of {student_profile.user.full_name}",
            role=User.Role.PARENT,
            is_onboarded=True,
        )

        # Link the parent to the student's profile
        student_profile.parents.add(parent_user)

        return Response({'message': 'Parent account created successfully.'}, status=status.HTTP_201_CREATED)

class ParentDashboardView(APIView):
    """
    API endpoint for Parent Dashboard aggregation.
    Returns linked student's info and active courses.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'PARENT':
            return Response(
                {'error': 'Only users with the PARENT role can access this dashboard.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        from .models import StudentProfile
        from payment.models import Subscription
        
        # Find linked student profile
        student_profile = StudentProfile.objects.filter(parents=request.user).first()
        if not student_profile:
            student_profile = StudentProfile.objects.filter(parent_email__iexact=request.user.email).first()
             
        if not student_profile:
            return Response(
                {'error': 'No linked student profile found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        student_user = student_profile.user
        
        # Get active enrolled courses
        active_subs = Subscription.objects.filter(
            user=student_user, 
            status='approved', 
            is_active=True
        )
        enrolled_courses = [
            {
                "id": sub.course.id,
                "title": sub.course.title,
                "description": sub.course.description,
                "color": sub.course.color
            }
            for sub in active_subs
        ]
        
        level = student_user.get_age_group_display() if student_user.age_group else "Unassigned Level"
        
        data = {
            "student_info": {
                "name": student_user.full_name,
                "level": level,
            },
            "enrolled_courses": enrolled_courses,
            "overall_evaluation": "Good" # Placeholder for future expansion
        }
        
        from .serializers import ParentDashboardSerializer
        serializer = ParentDashboardSerializer(data)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
