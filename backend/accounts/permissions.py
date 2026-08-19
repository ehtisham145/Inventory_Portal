from rest_framework.permissions import BasePermission

from accounts.models import UserRole


class IsMainAdmin(BasePermission):
    message = "Only the Main Admin can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.MAIN_ADMIN)


class IsMainAdminOrManager(BasePermission):
    message = "You are not authorized to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (UserRole.MAIN_ADMIN, UserRole.MANAGER)
        )


class IsAuthenticatedRole(BasePermission):
    """Base authenticated check; object-level checks happen in get_queryset of each view."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
