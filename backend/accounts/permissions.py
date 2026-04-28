from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to Super Admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == request.user.Role.SUPER_ADMIN
        )


class IsSupervisor(permissions.BasePermission):
    """
    Allows access to Supervisors OR Super Admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in [request.user.Role.SUPERVISOR, request.user.Role.SUPER_ADMIN]
        )


class IsTeacher(permissions.BasePermission):
    """
    Allows access to Teachers. Does not inherently allow SuperAdmins
    unless explicitly combined (e.g. IsTeacher | IsSuperAdmin).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == request.user.Role.TEACHER
        )


class IsParent(permissions.BasePermission):
    """
    Allows access to Parents.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == request.user.Role.PARENT
        )


class IsTechSupport(permissions.BasePermission):
    """
    Allows access to Tech Support or Super Admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in [request.user.Role.TECH_SUPPORT, request.user.Role.SUPER_ADMIN]
        )

# --- Object Level Permissions (To be used in ViewSets) ---

class IsStudentProfileOwner(permissions.BasePermission):
    """
    Custom permission to only allow students to edit their own profile/progress.
    """
    def has_object_permission(self, request, view, obj):
        # Assumes obj has a 'user' attribute that maps to CustomUser
        # Adjust 'obj.user' to 'obj.student' based on specific models (like StudentProgress)
        user_field = getattr(obj, 'user', None) or getattr(obj, 'student', None)
        return bool(
            request.user and 
            request.user.is_authenticated and 
            user_field == request.user
        )

class IsTeacherForStudyGroup(permissions.BasePermission):
    """
    Custom permission for Teacher to access only data linked to their assigned StudyGroups.
    Requires implementation in the ViewSet `get_queryset` ideally, but provided here as object perm.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == request.user.Role.SUPER_ADMIN:
            return True
            
        # Example for accessing a StudyGroup object directly
        if hasattr(obj, 'primary_teacher'):
            return obj.primary_teacher == request.user
            
        return False
