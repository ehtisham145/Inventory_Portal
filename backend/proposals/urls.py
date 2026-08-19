from django.urls import path

from proposals.views import (
    ProposalAttachmentsView,
    ProposalBulkDeleteView,
    ProposalDetailView,
    ProposalHistoryView,
    ProposalListCreateView,
    ProposalObservationsView,
    ProposalResendView,
    ProposalSendEmailView,
    ProposalSendView,
    ReviewApproveView,
    ReviewChangesView,
    ReviewDetailView,
    ReviewRejectView,
)

urlpatterns = [
    path("proposals/", ProposalListCreateView.as_view(), name="proposal-list-create"),
    path("proposals/bulk-delete/", ProposalBulkDeleteView.as_view(), name="proposal-bulk-delete"),
    path("proposals/<uuid:pk>/", ProposalDetailView.as_view(), name="proposal-detail"),
    path("proposals/<uuid:pk>/send/", ProposalSendView.as_view(), name="proposal-send"),
    path("proposals/<uuid:pk>/resend/", ProposalResendView.as_view(), name="proposal-resend"),
    path("proposals/<uuid:pk>/send-email/", ProposalSendEmailView.as_view(), name="proposal-send-email"),
    path("proposals/<uuid:pk>/history/", ProposalHistoryView.as_view(), name="proposal-history"),
    path("proposals/<uuid:pk>/observations/", ProposalObservationsView.as_view(), name="proposal-observations"),
    path("proposals/<uuid:pk>/attachments/", ProposalAttachmentsView.as_view(), name="proposal-attachments"),
    path("review/<str:token>/", ReviewDetailView.as_view(), name="review-detail"),
    path("review/<str:token>/approve/", ReviewApproveView.as_view(), name="review-approve"),
    path("review/<str:token>/reject/", ReviewRejectView.as_view(), name="review-reject"),
    path("review/<str:token>/changes/", ReviewChangesView.as_view(), name="review-changes"),
]
