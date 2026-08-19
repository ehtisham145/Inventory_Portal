from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import User, UserRole
from activity_logs.models import ProposalHistory
from companies.models import Company, CompanyStatus
from proposals.models import Observation, Proposal, ProposalStatus


class Command(BaseCommand):
    help = "Seed the database with demo data for the Al Merak Review & Approval Portal."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")

        admin, _ = User.objects.update_or_create(
            email="admin@almerak.com",
            defaults=dict(
                name="Al Merak Admin",
                role=UserRole.MAIN_ADMIN,
                is_staff=True,
                is_superuser=True,
                phone="+15550000001",
            ),
        )
        admin.set_password("Admin@123")
        admin.save()

        manager, _ = User.objects.update_or_create(
            email="manager@almerak.com",
            defaults=dict(name="Sarah Manager", role=UserRole.MANAGER, phone="+15550000002"),
        )
        manager.set_password("Manager@123")
        manager.save()

        company1, _ = Company.objects.update_or_create(
            company_name="Blue Horizon Trading",
            defaults=dict(
                contact_person="Ahmed Khan",
                email="contact@bluehorizon.example.com",
                phone="+15550001001",
                address="123 Harbor Road, Dubai, UAE",
                status=CompanyStatus.ACTIVE,
            ),
        )
        company2, _ = Company.objects.update_or_create(
            company_name="Nova Construction Group",
            defaults=dict(
                contact_person="Layla Hassan",
                email="contact@novaconstruction.example.com",
                phone="+15550001002",
                address="45 Industrial Ave, Abu Dhabi, UAE",
                status=CompanyStatus.ACTIVE,
            ),
        )

        user1, _ = User.objects.update_or_create(
            email="user1@bluehorizon.example.com",
            defaults=dict(name="Ahmed Khan", role=UserRole.COMPANY_USER, company=company1, phone="+15550002001"),
        )
        user1.set_password("Company@123")
        user1.save()

        user2, _ = User.objects.update_or_create(
            email="user2@novaconstruction.example.com",
            defaults=dict(name="Layla Hassan", role=UserRole.COMPANY_USER, company=company2, phone="+15550002002"),
        )
        user2.set_password("Company@123")
        user2.save()

        proposals_data = [
            dict(
                title="Q3 Supply Agreement Proposal",
                company=company1, company_user=user1, manager=manager,
                message="Please review the attached Q3 supply agreement terms.",
                status=ProposalStatus.DRAFT,
            ),
            dict(
                title="Warehouse Renovation Estimate",
                company=company2, company_user=user2, manager=manager,
                message="Renovation estimate for the north warehouse facility.",
                status=ProposalStatus.SENT,
            ),
            dict(
                title="Annual Maintenance Contract",
                company=company1, company_user=user1, manager=manager,
                message="Annual maintenance contract renewal for review.",
                status=ProposalStatus.PENDING_REVIEW,
            ),
            dict(
                title="Logistics Partnership Proposal",
                company=company2, company_user=user2, manager=manager,
                message="Proposal for a new logistics partnership agreement.",
                status=ProposalStatus.APPROVED,
            ),
            dict(
                title="Equipment Lease Proposal",
                company=company1, company_user=user1, manager=manager,
                message="Lease terms for new heavy equipment.",
                status=ProposalStatus.REJECTED,
            ),
            dict(
                title="Office Fitout Proposal",
                company=company2, company_user=user2, manager=manager,
                message="Fitout proposal for the new regional office.",
                status=ProposalStatus.CHANGES_REQUESTED,
            ),
        ]

        for data in proposals_data:
            status = data.pop("status")
            proposal, created = Proposal.objects.update_or_create(
                title=data["title"], company=data["company"],
                defaults={**data, "created_by": admin, "status": ProposalStatus.DRAFT},
            )
            if not created:
                continue

            proposal.regenerate_review_token(14)
            proposal.status = status
            now = timezone.now()
            if status != ProposalStatus.DRAFT:
                proposal.sent_at = now
            if status == ProposalStatus.APPROVED:
                proposal.approved_at = now
            if status == ProposalStatus.REJECTED:
                proposal.rejected_at = now
            proposal.save()

            ProposalHistory.objects.create(
                proposal=proposal, action="Proposal Created", old_status="",
                new_status=ProposalStatus.DRAFT, performed_by=admin,
            )
            if status != ProposalStatus.DRAFT:
                ProposalHistory.objects.create(
                    proposal=proposal, action="Proposal Sent", old_status=ProposalStatus.DRAFT,
                    new_status=ProposalStatus.SENT, performed_by=manager,
                )
            if status == ProposalStatus.CHANGES_REQUESTED:
                Observation.objects.create(
                    proposal=proposal, submitted_by=proposal.company_user,
                    observation="Please revise the pricing table on page 2 and add payment milestones.",
                )
                ProposalHistory.objects.create(
                    proposal=proposal, action="Changes Requested", old_status=ProposalStatus.PENDING_REVIEW,
                    new_status=ProposalStatus.CHANGES_REQUESTED, performed_by=proposal.company_user,
                )

        self.stdout.write(self.style.SUCCESS("Seed data created successfully."))
        self.stdout.write("")
        self.stdout.write("Demo credentials:")
        self.stdout.write("  Main Admin:   admin@almerak.com / Admin@123")
        self.stdout.write("  Manager:      manager@almerak.com / Manager@123")
        self.stdout.write("  Company User: user1@bluehorizon.example.com / Company@123")
        self.stdout.write("  Company User: user2@novaconstruction.example.com / Company@123")
