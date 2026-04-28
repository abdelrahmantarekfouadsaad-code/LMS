from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, StudyGroup, StudentProfile, TeacherProfile

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['email', 'full_name', 'role', 'is_onboarded', 'is_staff']
    list_filter = ['role', 'is_onboarded', 'is_staff', 'is_superuser']
    search_fields = ['email', 'full_name']
    ordering = ['email']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('full_name', 'phone_number', 'role')}),
        ('Onboarding', {'fields': ('is_onboarded', 'age_group', 'exact_age')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'full_name', 'phone_number', 'role', 'is_onboarded'),
        }),
    )

class StudyGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'course', 'primary_teacher', 'created_at']
    list_filter = ['course']
    search_fields = ['name']

admin.site.register(User, CustomUserAdmin)
admin.site.register(StudyGroup, StudyGroupAdmin)
admin.site.register(StudentProfile)
admin.site.register(TeacherProfile)
