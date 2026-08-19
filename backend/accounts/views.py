from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.models import User, UserRole
from accounts.permissions import IsMainAdmin
from accounts.serializers import (
    CustomTokenObtainPairSerializer,
    InviteInfoSerializer,
    SetPasswordSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except TokenError:
            pass
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return UserCreateSerializer if self.request.method == "POST" else UserSerializer

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related("company").all()

        if user.role == UserRole.MAIN_ADMIN:
            pass
        elif user.role == UserRole.MANAGER:
            # Managers can view (read-only) any active company user, so they can assign one when
            # preparing a new proposal — restricting this to companies they already have a
            # proposal with would make it impossible to ever create a *first* proposal for a
            # company. Managers still can never see other managers or admins.
            qs = qs.filter(role=UserRole.COMPANY_USER, is_active=True)
        else:
            qs = qs.none()

        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        company_id = self.request.query_params.get("company")
        if company_id:
            qs = qs.filter(company_id=company_id)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search))
        return qs

    def perform_create(self, serializer):
        if self.request.user.role != UserRole.MAIN_ADMIN:
            raise PermissionDenied("Only the Main Admin can create users.")
        serializer.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    lookup_field = "pk"

    def get_serializer_class(self):
        return UserUpdateSerializer if self.request.method in ("PUT", "PATCH") else UserSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsMainAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related("company").all()
        if user.role == UserRole.MAIN_ADMIN:
            return qs
        if user.role == UserRole.MANAGER:
            return qs.filter(role=UserRole.COMPANY_USER)
        return qs.filter(pk=user.pk)

    def perform_destroy(self, instance):
        # Soft delete: deactivate rather than hard-delete, preserving history integrity.
        if instance.pk == self.request.user.pk:
            raise ValidationError("You cannot deactivate your own account.")
        if instance.role == UserRole.MAIN_ADMIN:
            raise ValidationError("Main Admin accounts cannot be deactivated.")
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class UserPermanentDeleteView(APIView):
    """Permanently remove a user record. Separate from the default soft-delete (Deactivate)
    so both remain available — this one cannot be undone."""

    permission_classes = [IsMainAdmin]

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user.pk == request.user.pk:
            raise ValidationError("You cannot delete your own account.")
        if user.role == UserRole.MAIN_ADMIN:
            raise ValidationError("Main Admin accounts cannot be deleted.")
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserBulkPermanentDeleteView(APIView):
    """Delete multiple users at once, for the Managers list's multi-select checkboxes.
    Own account and Main Admin accounts are silently skipped rather than failing the whole
    request, so a mixed selection still deletes everything it safely can."""

    permission_classes = [IsMainAdmin]

    def post(self, request):
        ids = request.data.get("ids")
        if not isinstance(ids, list) or not ids:
            raise ValidationError({"ids": "Provide a non-empty list of user ids."})

        deletable_ids = list(
            User.objects.filter(id__in=ids)
            .exclude(pk=request.user.pk)
            .exclude(role=UserRole.MAIN_ADMIN)
            .values_list("id", flat=True)
        )
        skipped_count = len(ids) - len(deletable_ids)
        User.objects.filter(id__in=deletable_ids).delete()
        return Response({
            "detail": f"{len(deletable_ids)} deleted, {skipped_count} skipped.",
            "deleted_count": len(deletable_ids),
            "skipped_count": skipped_count,
        })


def _get_user_by_invite_token(token):
    user = get_object_or_404(User, invite_token=token)
    if user.is_invite_token_expired():
        raise ValidationError("This invite link has expired. Please ask Al Merak to resend it.")
    return user


class InviteDetailView(APIView):
    """Public — the company clicks their emailed/WhatsApp'd link to set up their password."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        user = _get_user_by_invite_token(token)
        return Response(InviteInfoSerializer(user).data)


class InviteSetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        user = _get_user_by_invite_token(token)
        serializer = SetPasswordSerializer(data=request.data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data["password"])
        user.invite_token = None
        user.invite_token_expires_at = None
        user.save(update_fields=["password", "invite_token", "invite_token_expires_at"])
        return Response({"detail": "Password set successfully. You can now log in."})
