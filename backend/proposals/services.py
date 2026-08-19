"""
Proposal status workflow, enforced entirely on the backend.

The frontend must never be trusted to set a proposal's status directly;
every transition goes through one of the functions below, which validates
the move, updates timestamps, and writes a ProposalHistory record.
"""
from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from activity_logs.models import ProposalHistory
from notifications.services import build_whatsapp_link, send_proposal_review_email
from proposals.models import Observation, ProposalStatus

# Explicit allow-list of status transitions.
ALLOWED_TRANSITIONS = {
    ProposalStatus.DRAFT: {ProposalStatus.SENT},
    ProposalStatus.SENT: {
        ProposalStatus.PENDING_REVIEW,
        ProposalStatus.APPROVED,
        ProposalStatus.REJECTED,
        ProposalStatus.CHANGES_REQUESTED,
    },
    ProposalStatus.PENDING_REVIEW: {
        ProposalStatus.APPROVED,
        ProposalStatus.REJECTED,
        ProposalStatus.CHANGES_REQUESTED,
    },
    ProposalStatus.CHANGES_REQUESTED: {ProposalStatus.RESUBMITTED},
    ProposalStatus.RESUBMITTED: {ProposalStatus.PENDING_REVIEW},
    ProposalStatus.APPROVED: set(),
    ProposalStatus.REJECTED: set(),
}

REVIEWABLE_STATUSES = {ProposalStatus.SENT, ProposalStatus.PENDING_REVIEW}


def _assert_transition_allowed(old_status, new_status):
    if new_status not in ALLOWED_TRANSITIONS.get(old_status, set()):
        raise ValidationError(
            f"Cannot move proposal from '{old_status}' to '{new_status}'."
        )


def _apply_status(proposal, new_status, action, performed_by, notes="", extra_fields=None):
    old_status = proposal.status
    _assert_transition_allowed(old_status, new_status)
    proposal.status = new_status
    update_fields = ["status", "updated_at"]
    if extra_fields:
        for field, value in extra_fields.items():
            setattr(proposal, field, value)
            update_fields.append(field)
    proposal.save(update_fields=update_fields)
    ProposalHistory.objects.create(
        proposal=proposal,
        action=action,
        old_status=old_status,
        new_status=new_status,
        performed_by=performed_by,
        notes=notes,
    )
    return proposal


def build_review_url(proposal):
    return f"{settings.FRONTEND_URL}/review/{proposal.review_token}"


def _notify(proposal):
    review_url = build_review_url(proposal)
    send_proposal_review_email(proposal, review_url)
    whatsapp_link = build_whatsapp_link(proposal, review_url)
    return review_url, whatsapp_link


def send_proposal(proposal, user):
    """Send a DRAFT proposal, or resubmit one that had CHANGES_REQUESTED."""
    if proposal.status not in (ProposalStatus.DRAFT, ProposalStatus.CHANGES_REQUESTED):
        raise ValidationError("Only draft proposals or proposals with requested changes can be sent.")
    if not proposal.company_user:
        raise ValidationError("Assign a company user before sending this proposal.")
    if not proposal.manager:
        raise ValidationError("Assign a manager before sending this proposal.")

    proposal.regenerate_review_token(settings.REVIEW_TOKEN_EXPIRY_DAYS)

    if proposal.status == ProposalStatus.DRAFT:
        _apply_status(
            proposal, ProposalStatus.SENT, "Proposal Sent", user,
            extra_fields={
                "sent_at": timezone.now(),
                "review_token": proposal.review_token,
                "token_expires_at": proposal.token_expires_at,
            },
        )
    else:
        _apply_status(
            proposal, ProposalStatus.RESUBMITTED, "Proposal Resubmitted", user,
            extra_fields={
                "sent_at": timezone.now(),
                "review_token": proposal.review_token,
                "token_expires_at": proposal.token_expires_at,
            },
        )
        _apply_status(proposal, ProposalStatus.PENDING_REVIEW, "Awaiting Company Review", user)

    review_url, whatsapp_link = _notify(proposal)
    return review_url, whatsapp_link


def resend_proposal(proposal, user):
    if proposal.status not in (ProposalStatus.SENT, ProposalStatus.PENDING_REVIEW):
        raise ValidationError("Only proposals awaiting review can be resent.")

    proposal.regenerate_review_token(settings.REVIEW_TOKEN_EXPIRY_DAYS)
    proposal.save(update_fields=["review_token", "token_expires_at", "updated_at"])
    ProposalHistory.objects.create(
        proposal=proposal,
        action="Review Link Resent",
        old_status=proposal.status,
        new_status=proposal.status,
        performed_by=user,
    )
    return _notify(proposal)


def send_email_now(proposal, user):
    """Re-send the review email for the CURRENT link, without generating a new token
    (unlike resend_proposal). Returns whether the send actually succeeded so the caller can
    give honest feedback instead of assuming success."""
    if proposal.status not in (ProposalStatus.SENT, ProposalStatus.PENDING_REVIEW, ProposalStatus.RESUBMITTED):
        raise ValidationError("This proposal is not awaiting review.")
    if not proposal.review_token or proposal.is_token_expired():
        raise ValidationError("The review link has expired. Use Resend Review Link to generate a new one first.")

    review_url = build_review_url(proposal)
    sent = send_proposal_review_email(proposal, review_url)
    ProposalHistory.objects.create(
        proposal=proposal,
        action="Review Email Sent" if sent else "Review Email Failed to Send",
        old_status=proposal.status,
        new_status=proposal.status,
        performed_by=user,
    )
    return sent


def mark_viewed(proposal):
    if proposal.status == ProposalStatus.SENT:
        _apply_status(proposal, ProposalStatus.PENDING_REVIEW, "Proposal Viewed", proposal.company_user)
    return proposal


def approve_proposal(proposal):
    if proposal.status not in REVIEWABLE_STATUSES:
        raise ValidationError("This proposal is not awaiting review.")
    # The decision is final — expire the link immediately so it can't be reopened or reused.
    # A fresh link is only issued again via Resend/Resubmit.
    return _apply_status(
        proposal, ProposalStatus.APPROVED, "Proposal Approved", proposal.company_user,
        extra_fields={"approved_at": timezone.now(), "token_expires_at": timezone.now()},
    )


def reject_proposal(proposal, reason):
    if proposal.status not in REVIEWABLE_STATUSES:
        raise ValidationError("This proposal is not awaiting review.")
    if not reason or not reason.strip():
        raise ValidationError({"reason": "Please tell us why you are rejecting this proposal."})

    # Same as approval — a rejection is also a final decision, so the link expires immediately.
    proposal = _apply_status(
        proposal, ProposalStatus.REJECTED, "Proposal Rejected", proposal.company_user,
        notes=reason, extra_fields={"rejected_at": timezone.now(), "token_expires_at": timezone.now()},
    )
    Observation.objects.create(
        proposal=proposal, submitted_by=proposal.company_user, observation=f"Rejection reason: {reason}"
    )
    return proposal


def request_changes(proposal, observation_text):
    if proposal.status not in REVIEWABLE_STATUSES:
        raise ValidationError("This proposal is not awaiting review.")
    if not observation_text or not observation_text.strip():
        raise ValidationError({"observation": "Please describe the changes you require."})

    Observation.objects.create(
        proposal=proposal, submitted_by=proposal.company_user, observation=observation_text
    )
    return _apply_status(
        proposal, ProposalStatus.CHANGES_REQUESTED, "Changes Requested", proposal.company_user,
        notes=observation_text,
    )
