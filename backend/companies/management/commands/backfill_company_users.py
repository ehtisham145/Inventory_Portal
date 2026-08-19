from django.core.management.base import BaseCommand

from accounts.models import UserRole
from companies.models import Company
from companies.services import ensure_company_user, send_invite


class Command(BaseCommand):
    help = (
        "Create the single login account (and send its password-setup invite) for any "
        "existing company that doesn't have one yet."
    )

    def handle(self, *args, **options):
        created = []
        for company in Company.objects.all():
            already_has_one = company.users.filter(role=UserRole.COMPANY_USER).exists()
            if already_has_one:
                continue
            user, was_created = ensure_company_user(company)
            if was_created:
                send_invite(user)
                created.append((company.company_name, user.email))

        if not created:
            self.stdout.write(self.style.SUCCESS("Every company already has a login account. Nothing to do."))
            return

        self.stdout.write(self.style.SUCCESS(f"Created {len(created)} company login account(s) and sent invites:"))
        for company_name, email in created:
            self.stdout.write(f"  {company_name}: {email}")
