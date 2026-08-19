from rest_framework_simplejwt.views import TokenRefreshView

from django.urls import path

from accounts.views import (
    InviteDetailView,
    InviteSetPasswordView,
    LoginView,
    LogoutView,
    MeView,
    UserBulkPermanentDeleteView,
    UserDetailView,
    UserListCreateView,
    UserPermanentDeleteView,
)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("users/", UserListCreateView.as_view(), name="user-list-create"),
    path("users/bulk-delete/", UserBulkPermanentDeleteView.as_view(), name="user-bulk-delete"),
    path("users/<uuid:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("users/<uuid:pk>/permanent/", UserPermanentDeleteView.as_view(), name="user-permanent-delete"),
    path("invite/<str:token>/", InviteDetailView.as_view(), name="invite-detail"),
    path("invite/<str:token>/set-password/", InviteSetPasswordView.as_view(), name="invite-set-password"),
]
