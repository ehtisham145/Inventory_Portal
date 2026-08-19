import secrets
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    MAIN_ADMIN = "MAIN_ADMIN", "Main Admin"
    MANAGER = "MANAGER", "Manager"
    COMPANY_USER = "COMPANY_USER", "Company User"


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.COMPANY_USER)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.MAIN_ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("name", "System Administrator")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=32, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.COMPANY_USER)
    company = models.ForeignKey(
        "companies.Company",
        # A COMPANY_USER account only exists to log in to its company's proposals — deleting
        # the company should delete its login too, not leave an orphaned account that silently
        # blocks that email from ever being reused by a new company.
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="users",
        help_text="Required for COMPANY_USER role.",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    invite_token = models.CharField(max_length=64, unique=True, null=True, blank=True, db_index=True)
    invite_token_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.role})"

    @property
    def is_main_admin(self):
        return self.role == UserRole.MAIN_ADMIN

    @property
    def is_manager(self):
        return self.role == UserRole.MANAGER

    @property
    def is_company_user(self):
        return self.role == UserRole.COMPANY_USER

    def is_invite_token_expired(self):
        return bool(self.invite_token_expires_at and self.invite_token_expires_at < timezone.now())

    def generate_invite_token(self, expiry_days):
        self.invite_token = secrets.token_urlsafe(32)
        self.invite_token_expires_at = timezone.now() + timezone.timedelta(days=expiry_days)
