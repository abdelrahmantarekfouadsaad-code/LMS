from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import UserViewSet, RegisterView, GoogleLoginView, ForgotPasswordView, ResetPasswordView, ParentVerifyView, ParentCreateView, ParentDashboardView
from learning.views import CourseViewSet, ResourceViewSet, StudentProgressViewSet, StudentMilestoneViewSet, CertificateViewSet, ProjectViewSet, ProjectSubmissionViewSet
from quizzes.views import QuizViewSet, StudentResultViewSet
from live.views import LiveSessionViewSet, AttendanceViewSet
from support.views import SupportTicketViewSet
from chat.views import ChatRoomViewSet, MessageViewSet

router = DefaultRouter()
# Accounts endpoints
router.register(r'accounts', UserViewSet, basename='account')

# Learning endpoints
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'progress', StudentProgressViewSet, basename='progress')
router.register(r'milestones', StudentMilestoneViewSet, basename='milestone')
router.register(r'certificates', CertificateViewSet, basename='certificate')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'project-submissions', ProjectSubmissionViewSet, basename='projectsubmission')
# Quizzes endpoints
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'results', StudentResultViewSet, basename='result')

# Live endpoints
router.register(r'sessions', LiveSessionViewSet, basename='livesession')
router.register(r'attendance', AttendanceViewSet, basename='attendance')

# Support endpoints
router.register(r'support', SupportTicketViewSet, basename='support-ticket')

# Chat endpoints
router.register(r'community', ChatRoomViewSet, basename='chatroom')
router.register(r'messages', MessageViewSet, basename='message')

from payment.views import PaymentMethodViewSet, SubscriptionViewSet

# Payment endpoints
router.register(r'payments/methods', PaymentMethodViewSet, basename='paymentmethod')
router.register(r'payments/subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth Endpoints
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/google/', GoogleLoginView.as_view(), name='auth_google'),
    path('api/auth/forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('api/auth/reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),
    path('api/auth/parent-verify/', ParentVerifyView.as_view(), name='auth_parent_verify'),
    path('api/auth/parent-create/', ParentCreateView.as_view(), name='auth_parent_create'),
    path('api/parents/dashboard/', ParentDashboardView.as_view(), name='parent_dashboard'),

    
    # Core API Routers
    path('api/', include(router.urls)),
]
