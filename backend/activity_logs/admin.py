from django.contrib import admin

from activity_logs.models import ProposalHistory


@admin.register(ProposalHistory)
class ProposalHistoryAdmin(admin.ModelAdmin):
    list_display = ["proposal", "action", "old_status", "new_status", "performed_by", "created_at"]
    list_filter = ["action"]
    search_fields = ["proposal__title"]
