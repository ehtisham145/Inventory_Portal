"""
Each Company has exactly one linked login account (role=COMPANY_USER) instead of admins
manually creating and picking individual users per company. The company sets its own password
via an emailed/WhatsApp'd invite link — nobody else ever sets or sees it.
"""
from django.conf import settings

from accounts.models import User, UserRole
from notifications.services import build_invite_whatsapp_link, send_company_invite_email


def build_invite_url(user):
    return f"{settings.FRONTEND_URL}/setup-password/{user.invite_token}"


def send_invite(user):
    """(Re)send the password-setup invite for a company login and return the notification links."""
    user.generate_invite_token(settings.INVITE_TOKEN_EXPIRY_DAYS)
    user.save(update_fields=["invite_token", "invite_token_expires_at"])
    setup_url = build_invite_url(user)
    send_company_invite_email(user, setup_url)
    whatsapp_link = build_invite_whatsapp_link(user, setup_url)
    return setup_url, whatsapp_link


def ensure_company_user(company, sync_contact_info=True):
    """Get or create the single COMPANY_USER account linked to a company.

    Returns (user, created). A brand-new account has no usable password — the company sets it
    themselves via an invited setup link (sending that invite is the caller's job, via
    send_invite(), so each code path controls exactly when an email goes out). If the linked
    account already exists, keep its name/email/phone in sync with the company's own contact
    info (so editing the company also updates its login).
    """
    user = User.objects.filter(company=company, role=UserRole.COMPANY_USER).order_by("created_at").first()

    if user is None:
        user = User(
            email=company.email,
            name=company.contact_person,
            phone=company.phone,
            role=UserRole.COMPANY_USER,
            company=company,
        )
        user.set_unusable_password()
        user.save()
        return user, True

    if sync_contact_info:
        update_fields = []
        if user.email != company.email:
            user.email = company.email
            update_fields.append("email")
        if user.name != company.contact_person:
            user.name = company.contact_person
            update_fields.append("name")
        if user.phone != company.phone:
            user.phone = company.phone
            update_fields.append("phone")
        if update_fields:
            user.save(update_fields=update_fields)
    return user, False
