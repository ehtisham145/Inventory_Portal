import uuid

from django.db import models


class ProposalHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal = models.ForeignKey(
        "proposals.Proposal", on_delete=models.CASCADE, related_name="history"
    )
    action = models.CharField(max_length=255)
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20, blank=True)
    performed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Proposal history"

    def __str__(self):
        return f"{self.action} - {self.proposal_id}"
