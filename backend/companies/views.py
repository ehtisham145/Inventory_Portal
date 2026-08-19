from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import UserRole
from accounts.permissions import IsMainAdmin, IsMainAdminOrManager
from companies.models import Company
from companies.serializers import CompanySerializer
from companies.services import ensure_company_user, send_invite


class CompanyListCreateView(generics.ListCreateAPIView):
    serializer_class = CompanySerializer

    def get_permissions(self):
        if self.request.method == "POST":
            # Managers can add companies (e.g. a brand-new client they need to send a proposal
            # to); editing/deactivating an existing company stays Main-Admin-only.
            return [IsMainAdminOrManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Company.objects.all()

        if user.role == UserRole.MAIN_ADMIN:
            pass
        elif user.role == UserRole.MANAGER:
            # Managers can view any active company (and add new ones, see get_permissions()),
            # but cannot edit/deactivate an existing one. Without this list scope, a manager
            # with no proposals yet would see an empty list and could never create a proposal.
            qs = qs.filter(status="ACTIVE")
        else:
            qs = qs.none()

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(company_name__icontains=search) | Q(contact_person__icontains=search))
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class CompanyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CompanySerializer
    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsMainAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.MAIN_ADMIN:
            return Company.objects.all()
        if user.role == UserRole.MANAGER:
            # Read-only for managers (write methods are blocked in get_permissions()); they may
            # need to view any company's details while preparing a proposal for it.
            return Company.objects.all()
        return Company.objects.none()

    def perform_destroy(self, instance):
        # Soft delete: deactivate rather than hard-delete.
        instance.status = "INACTIVE"
        instance.save(update_fields=["status"])


class CompanyPermanentDeleteView(APIView):
    """Permanently remove a company. Separate from the default soft-delete (Deactivate) so both
    remain available — this one cannot be undone and cascades to delete all of the company's
    proposals (and their history/observations) too, since Proposal.company is CASCADE."""

    permission_classes = [IsMainAdmin]

    def delete(self, request, pk):
        company = get_object_or_404(Company, pk=pk)
        company.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CompanyBulkPermanentDeleteView(APIView):
    """Delete multiple companies at once, for the Companies list's multi-select checkboxes.
    Cascades to delete each company's proposals too, same as the single-company delete."""

    permission_classes = [IsMainAdmin]

    def post(self, request):
        ids = request.data.get("ids")
        if not isinstance(ids, list) or not ids:
            raise ValidationError({"ids": "Provide a non-empty list of company ids."})
        _, deleted_by_model = Company.objects.filter(id__in=ids).delete()
        deleted_count = deleted_by_model.get("companies.Company", 0)
        deleted_proposals = deleted_by_model.get("proposals.Proposal", 0)
        return Response({
            "detail": f"{deleted_count} compan(y/ies) and {deleted_proposals} associated proposal(s) deleted.",
            "deleted_count": deleted_count,
            "deleted_proposals": deleted_proposals,
        })


class CompanyResendInviteView(APIView):
    """(Re)send the password-setup invite for a company's login. Also doubles as a password
    reset trigger — a fresh link lets the company set a brand-new password at any time."""

    permission_classes = [IsMainAdminOrManager]

    def post(self, request, pk):
        company = get_object_or_404(Company.objects.all(), pk=pk)
        user, _ = ensure_company_user(company)
        send_invite(user)
        return Response({"detail": "Invite email sent."})
