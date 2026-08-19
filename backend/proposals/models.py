import secrets
import uuid

from django.db import models
from django.utils import timezone


class ProposalStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SENT = "SENT", "Sent"
    PENDING_REVIEW = "PENDING_REVIEW", "Pending Review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    CHANGES_REQUESTED = "CHANGES_REQUESTED", "Changes Requested"
    RESUBMITTED = "RESUBMITTED", "Resubmitted"


def generate_review_token():
    return secrets.token_urlsafe(32)


class Proposal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE, related_name="proposals", db_index=True
    )
    company_user = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_proposals", db_index=True,
    )
    manager = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="managed_proposals", db_index=True,
    )
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=ProposalStatus.choices, default=ProposalStatus.DRAFT, db_index=True
    )
    review_token = models.CharField(max_length=64, unique=True, db_index=True, default=generate_review_token)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="created_proposals"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def is_token_expired(self):
        return bool(self.token_expires_at and self.token_expires_at < timezone.now())

    def regenerate_review_token(self, expiry_days):
        self.review_token = generate_review_token()
        self.token_expires_at = timezone.now() + timezone.timedelta(days=expiry_days)


class ProposalAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="proposal_attachments/%Y/%m/")
    uploaded_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.file.name


class Observation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name="observations")
    submitted_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="observations"
    )
    observation = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Observation on {self.proposal_id}"
