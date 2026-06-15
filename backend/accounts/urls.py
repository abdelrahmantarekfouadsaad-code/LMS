from django.urls import path
from .views import SuperAdminUserListView, SuperAdminRoleUpdateView, SuperAdminStudentStatsView, SuperAdminEnrollStudentView, TeacherStudentSearchView

urlpatterns = [
    path('super-admin/users/', SuperAdminUserListView.as_view(), name='superadmin_users'),
    path('super-admin/users/role-update/', SuperAdminRoleUpdateView.as_view(), name='superadmin_role_update'),
    path('super-admin/students/<int:student_id>/stats/', SuperAdminStudentStatsView.as_view(), name='superadmin_student_stats'),
    path('super-admin/enroll/', SuperAdminEnrollStudentView.as_view(), name='superadmin_enroll_student'),
    path('students/search/', TeacherStudentSearchView.as_view(), name='teacher_student_search'),
]
