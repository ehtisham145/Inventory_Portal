"""
Modular notification services.

Email is sent via SMTP today. WhatsApp uses a wa.me click-to-chat URL for
the MVP; both are wrapped behind simple functions so a future WhatsApp
Business API integration can replace `build_whatsapp_link` without touching
call sites.
"""
import logging
from urllib.parse import quote

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_proposal_review_email(proposal, review_url):
    """Send the 'ready for review' email to the proposal's company user."""
    company_user = proposal.company_user
    if not company_user or not company_user.email:
        logger.warning("Cannot send review email: proposal %s has no company user email.", proposal.id)
        return False

    context = {
        "company_user_name": company_user.name,
        "proposal_title": proposal.title,
        "review_url": review_url,
    }
    subject = "Your Proposal is Ready for Review"
    html_body = render_to_string("emails/proposal_review.html", context)
    text_body = (
        f"Hello {company_user.name},\n\n"
        f"Your proposal is ready for review.\n\n"
        f"Please review the proposal using the link below:\n{review_url}\n\n"
        "If everything is correct, please approve it.\n"
        "If changes are required, use the \"Request Changes\" option and provide your observations.\n\n"
        "Thank you,\nAl Merak"
    )

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[company_user.email],
    )
    message.attach_alternative(html_body, "text/html")
    try:
        message.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send review email for proposal %s to %s", proposal.id, company_user.email)
        return False
    return True


def send_company_invite_email(user, setup_url):
    """Send the 'set up your password' email to a newly invited company login."""
    if not user.email:
        logger.warning("Cannot send invite email: user %s has no email.", user.id)
        return False

    context = {
        "name": user.name,
        "company_name": user.company.company_name if user.company else user.name,
        "setup_url": setup_url,
    }
    subject = "Set Up Your Al Merak Review Portal Account"
    html_body = render_to_string("emails/company_invite.html", context)
    text_body = (
        f"Hello {user.name},\n\n"
        f"An account has been created for {context['company_name']} on the Al Merak Review & Approval Portal.\n\n"
        f"Set up your password to log in:\n{setup_url}\n\n"
        "Once your password is set, you can log in anytime to review and act on your proposals.\n\n"
        "Thank you,\nAl Merak"
    )

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    message.attach_alternative(html_body, "text/html")
    try:
        message.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send invite email for user %s to %s", user.id, user.email)
        return False
    return True


def build_invite_whatsapp_link(user, setup_url):
    """Build a wa.me click-to-chat URL inviting a company login to set up their password."""
    if not user.phone:
        return None

    phone = "".join(ch for ch in user.phone if ch.isdigit())
    if not phone:
        return None

    company_name = user.company.company_name if user.company else user.name
    message = (
        f"Hello {user.name},\n\n"
        f"An account has been created for {company_name} on the Al Merak Review & Approval Portal.\n\n"
        f"Set up your password here:\n{setup_url}\n\n"
        "Al Merak"
    )
    return f"https://wa.me/{phone}?text={quote(message)}"


def build_whatsapp_link(proposal, review_url):
    """Build a wa.me click-to-chat URL for the proposal's company user. Phone is never hardcoded."""
    company_user = proposal.company_user
    if not company_user or not company_user.phone:
        return None

    phone = "".join(ch for ch in company_user.phone if ch.isdigit())
    if not phone:
        return None

    message = (
        f"Hello {company_user.name},\n\n"
        "Your proposal is ready for review.\n\n"
        f"Please review it here:\n{review_url}\n\n"
        "If everything is correct, please approve it.\n"
        "If changes are required, please submit your observations.\n\n"
        "Al Merak"
    )
    return f"https://wa.me/{phone}?text={quote(message)}"
