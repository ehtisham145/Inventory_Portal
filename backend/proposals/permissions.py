from rest_framework.permissions import BasePermission

from accounts.models import UserRole


class CanAccessProposal(BasePermission):
    """Main Admin: full access. Manager: only assigned proposals. Company User: only own."""

    message = "You cannot access this proposal."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == UserRole.MAIN_ADMIN:
            return True
        if user.role == UserRole.MANAGER:
            return obj.manager_id == user.id
        if user.role == UserRole.COMPANY_USER:
            return obj.company_user_id == user.id
        return False
