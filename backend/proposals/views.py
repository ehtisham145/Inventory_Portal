from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import UserRole
from accounts.permissions import IsMainAdmin, IsMainAdminOrManager
from activity_logs.models import ProposalHistory
from activity_logs.serializers import ProposalHistorySerializer
from proposals import services
from proposals.models import Observation, Proposal, ProposalAttachment, ProposalStatus
from proposals.permissions import CanAccessProposal
from proposals.serializers import (
    ObservationSerializer,
    ProposalAttachmentSerializer,
    ProposalCreateUpdateSerializer,
    ProposalSerializer,
    ReviewProposalSerializer,
)


def _scope_proposals(user):
    qs = Proposal.objects.select_related("company", "company_user", "manager", "created_by")
    if user.role == UserRole.MAIN_ADMIN:
        return qs
    if user.role == UserRole.MANAGER:
        return qs.filter(manager=user)
    if user.role == UserRole.COMPANY_USER:
        return qs.filter(company_user=user)
    return qs.none()


class ProposalListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        return ProposalCreateUpdateSerializer if self.request.method == "POST" else ProposalSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsMainAdminOrManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = _scope_proposals(self.request.user)
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status__in=[s.strip() for s in status_param.split(",") if s.strip()])
        company_id = self.request.query_params.get("company")
        if company_id:
            qs = qs.filter(company_id=company_id)
        manager_id = self.request.query_params.get("manager")
        if manager_id:
            qs = qs.filter(manager_id=manager_id)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(company__company_name__icontains=search))
        return qs

    def perform_create(self, serializer):
        proposal = serializer.save(created_by=self.request.user)
        ProposalHistory.objects.create(
            proposal=proposal,
            action="Proposal Created",
            old_status="",
            new_status=ProposalStatus.DRAFT,
            performed_by=self.request.user,
        )


class ProposalDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, CanAccessProposal]

    def get_serializer_class(self):
        return ProposalCreateUpdateSerializer if self.request.method in ("PUT", "PATCH") else ProposalSerializer

    def get_queryset(self):
        return _scope_proposals(self.request.user)

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method in ("PUT", "PATCH", "DELETE") and request.user.role == UserRole.COMPANY_USER:
            raise PermissionDenied("Company users cannot modify proposals.")

    def perform_update(self, serializer):
        proposal = serializer.save()
        ProposalHistory.objects.create(
            proposal=proposal,
            action="Proposal Updated",
            old_status=proposal.status,
            new_status=proposal.status,
            performed_by=self.request.user,
        )

    def perform_destroy(self, instance):
        if self.request.user.role != UserRole.MAIN_ADMIN:
            raise PermissionDenied("Only the Main Admin can delete proposals.")
        instance.delete()


class ProposalBulkDeleteView(APIView):
    """Delete multiple proposals at once, for the admin list's multi-select checkboxes."""

    permission_classes = [permissions.IsAuthenticated, IsMainAdmin]

    def post(self, request):
        ids = request.data.get("ids")
        if not isinstance(ids, list) or not ids:
            raise ValidationError({"ids": "Provide a non-empty list of proposal ids."})
        _, deleted_by_model = Proposal.objects.filter(id__in=ids).delete()
        deleted_count = deleted_by_model.get("proposals.Proposal", 0)
        return Response({"detail": f"{deleted_count} proposal(s) deleted.", "deleted_count": deleted_count})


class ProposalSendView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsMainAdminOrManager]

    def post(self, request, pk):
        proposal = get_object_or_404(_scope_proposals(request.user), pk=pk)
        review_url, whatsapp_link = services.send_proposal(proposal, request.user)
        return Response({
            "detail": "Proposal sent successfully.",
            "review_url": review_url,
            "whatsapp_link": whatsapp_link,
            "proposal": ProposalSerializer(proposal).data,
        })


class ProposalResendView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsMainAdminOrManager]

    def post(self, request, pk):
        proposal = get_object_or_404(_scope_proposals(request.user), pk=pk)
        review_url, whatsapp_link = services.resend_proposal(proposal, request.user)
        return Response({
            "detail": "Review link resent successfully.",
            "review_url": review_url,
            "whatsapp_link": whatsapp_link,
            "proposal": ProposalSerializer(proposal).data,
        })


class ProposalSendEmailView(APIView):
    """Re-send the review email for the current link (no new token) — used by the 'Send via
    Email' button so it works reliably from the server instead of depending on the browser
    having a default mail app configured, with real success/failure feedback."""

    permission_classes = [permissions.IsAuthenticated, IsMainAdminOrManager]

    def post(self, request, pk):
        proposal = get_object_or_404(_scope_proposals(request.user), pk=pk)
        sent = services.send_email_now(proposal, request.user)
        if not sent:
            return Response(
                {"error": {"message": "Could not send the email. Check the SMTP configuration and try again.", "details": None}},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"detail": "Email sent successfully."})


class ProposalHistoryView(generics.ListAPIView):
    serializer_class = ProposalHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        proposal = get_object_or_404(_scope_proposals(self.request.user), pk=self.kwargs["pk"])
        return proposal.history.select_related("performed_by")


class ProposalObservationsView(generics.ListAPIView):
    serializer_class = ObservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        proposal = get_object_or_404(_scope_proposals(self.request.user), pk=self.kwargs["pk"])
        return proposal.observations.select_related("submitted_by")


class ProposalAttachmentsView(generics.ListCreateAPIView):
    serializer_class = ProposalAttachmentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsMainAdminOrManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        proposal = get_object_or_404(_scope_proposals(self.request.user), pk=self.kwargs["pk"])
        return proposal.attachments.all()

    def perform_create(self, serializer):
        proposal = get_object_or_404(_scope_proposals(self.request.user), pk=self.kwargs["pk"])
        serializer.save(proposal=proposal, uploaded_by=self.request.user)


# ---------------------------------------------------------------------------
# Public review endpoints — accessed via the secure token, no authentication.
# ---------------------------------------------------------------------------

def _get_proposal_by_token(token):
    proposal = get_object_or_404(Proposal, review_token=token)
    if proposal.is_token_expired():
        raise ValidationError("This review link has expired. Please contact Al Merak for a new link.")
    return proposal


class ReviewDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        proposal = _get_proposal_by_token(token)
        services.mark_viewed(proposal)
        return Response(ReviewProposalSerializer(proposal).data)


class ReviewApproveView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        proposal = _get_proposal_by_token(token)
        services.approve_proposal(proposal)
        return Response({"detail": "Proposal approved successfully."})


class ReviewRejectView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        proposal = _get_proposal_by_token(token)
        reason = request.data.get("reason", "")
        services.reject_proposal(proposal, reason)
        return Response({"detail": "Proposal rejected."})


class ReviewChangesView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        proposal = _get_proposal_by_token(token)
        observation = request.data.get("observation", "")
        services.request_changes(proposal, observation)
        return Response({"detail": "Your change request has been submitted successfully."})
