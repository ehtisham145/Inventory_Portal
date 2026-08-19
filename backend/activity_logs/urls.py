from django.urls import path

from activity_logs.views import (
    ActivityListView,
    AdminDashboardView,
    CompanyDashboardView,
    ManagerDashboardView,
)

urlpatterns = [
    path("dashboard/admin/", AdminDashboardView.as_view(), name="dashboard-admin"),
    path("dashboard/manager/", ManagerDashboardView.as_view(), name="dashboard-manager"),
    path("dashboard/company/", CompanyDashboardView.as_view(), name="dashboard-company"),
    path("activity/", ActivityListView.as_view(), name="activity-list"),
]
