from rest_framework import serializers

from activity_logs.models import ProposalHistory


class ProposalHistorySerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source="performed_by.name", read_only=True, default="System")
    proposal_title = serializers.CharField(source="proposal.title", read_only=True)

    class Meta:
        model = ProposalHistory
        fields = [
            "id", "proposal", "proposal_title", "action", "old_status", "new_status",
            "performed_by", "performed_by_name", "notes", "created_at",
        ]
        read_only_fields = fields
