from django.urls import path

from companies.views import (
    CompanyBulkPermanentDeleteView,
    CompanyDetailView,
    CompanyListCreateView,
    CompanyPermanentDeleteView,
    CompanyResendInviteView,
)

urlpatterns = [
    path("companies/", CompanyListCreateView.as_view(), name="company-list-create"),
    path("companies/bulk-delete/", CompanyBulkPermanentDeleteView.as_view(), name="company-bulk-delete"),
    path("companies/<uuid:pk>/", CompanyDetailView.as_view(), name="company-detail"),
    path("companies/<uuid:pk>/permanent/", CompanyPermanentDeleteView.as_view(), name="company-permanent-delete"),
    path("companies/<uuid:pk>/resend-invite/", CompanyResendInviteView.as_view(), name="company-resend-invite"),
]
