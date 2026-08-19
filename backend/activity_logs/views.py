from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User, UserRole
from accounts.permissions import IsMainAdmin
from activity_logs.models import ProposalHistory
from activity_logs.serializers import ProposalHistorySerializer
from companies.models import Company
from proposals.models import Proposal, ProposalStatus


class AdminDashboardView(APIView):
    permission_classes = [IsMainAdmin]

    def get(self, request):
        proposals = Proposal.objects.all()
        data = {
            "total_companies": Company.objects.count(),
            "total_managers": User.objects.filter(role=UserRole.MANAGER).count(),
            "total_company_users": User.objects.filter(role=UserRole.COMPANY_USER).count(),
            "total_proposals": proposals.count(),
            "pending_review": proposals.filter(
                status__in=[ProposalStatus.SENT, ProposalStatus.PENDING_REVIEW, ProposalStatus.RESUBMITTED]
            ).count(),
            "approved": proposals.filter(status=ProposalStatus.APPROVED).count(),
            "rejected": proposals.filter(status=ProposalStatus.REJECTED).count(),
            "changes_requested": proposals.filter(status=ProposalStatus.CHANGES_REQUESTED).count(),
            "recent_activity": ProposalHistorySerializer(
                ProposalHistory.objects.select_related("proposal", "performed_by")[:10], many=True
            ).data,
        }
        return Response(data)


class ManagerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != UserRole.MANAGER:
            return Response({"error": {"message": "Only managers can access this dashboard."}}, status=403)

        proposals = Proposal.objects.filter(manager=request.user)
        data = {
            "my_proposals": proposals.count(),
            "pending_review": proposals.filter(
                status__in=[ProposalStatus.SENT, ProposalStatus.PENDING_REVIEW, ProposalStatus.RESUBMITTED]
            ).count(),
            "approved": proposals.filter(status=ProposalStatus.APPROVED).count(),
            "rejected": proposals.filter(status=ProposalStatus.REJECTED).count(),
            "changes_requested": proposals.filter(status=ProposalStatus.CHANGES_REQUESTED).count(),
            "recent_activity": ProposalHistorySerializer(
                ProposalHistory.objects.filter(proposal__manager=request.user).select_related(
                    "proposal", "performed_by"
                )[:10],
                many=True,
            ).data,
        }
        return Response(data)


class CompanyDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != UserRole.COMPANY_USER:
            return Response({"error": {"message": "Only company users can access this dashboard."}}, status=403)

        proposals = Proposal.objects.filter(company_user=request.user)
        data = {
            "pending_review": proposals.filter(
                status__in=[ProposalStatus.SENT, ProposalStatus.PENDING_REVIEW, ProposalStatus.RESUBMITTED]
            ).count(),
            "approved": proposals.filter(status=ProposalStatus.APPROVED).count(),
            "rejected": proposals.filter(status=ProposalStatus.REJECTED).count(),
            "changes_requested": proposals.filter(status=ProposalStatus.CHANGES_REQUESTED).count(),
        }
        return Response(data)


class ActivityListView(generics.ListAPIView):
    serializer_class = ProposalHistorySerializer
    permission_classes = [IsMainAdmin]
    queryset = ProposalHistory.objects.select_related("proposal", "performed_by").all()
