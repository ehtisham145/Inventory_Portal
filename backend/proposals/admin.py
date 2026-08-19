from django.contrib import admin

from proposals.models import Observation, Proposal, ProposalAttachment


class ProposalAttachmentInline(admin.TabularInline):
    model = ProposalAttachment
    extra = 0


class ObservationInline(admin.TabularInline):
    model = Observation
    extra = 0
    readonly_fields = ["submitted_by", "observation", "created_at"]


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ["title", "company", "manager", "company_user", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["title", "company__company_name"]
    inlines = [ProposalAttachmentInline, ObservationInline]
    readonly_fields = ["review_token", "token_expires_at"]
