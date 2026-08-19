from rest_framework import serializers

from accounts.models import UserRole
from companies.serializers import CompanySerializer
from companies.services import ensure_company_user, send_invite
from notifications.services import build_whatsapp_link
from proposals.models import Observation, Proposal, ProposalAttachment, ProposalStatus
from proposals.services import build_review_url


class ProposalAttachmentSerializer(serializers.ModelSerializer):
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = ProposalAttachment
        fields = ["id", "file", "file_name", "uploaded_at"]
        read_only_fields = fields

    def get_file_name(self, obj):
        return obj.file.name.split("/")[-1] if obj.file else ""


class ObservationSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source="submitted_by.name", read_only=True, default="")

    class Meta:
        model = Observation
        fields = ["id", "proposal", "submitted_by", "submitted_by_name", "observation", "created_at"]
        read_only_fields = ["id", "proposal", "submitted_by", "submitted_by_name", "created_at"]


class ProposalSerializer(serializers.ModelSerializer):
    company_detail = CompanySerializer(source="company", read_only=True)
    company_user_name = serializers.CharField(source="company_user.name", read_only=True, default=None)
    company_user_email = serializers.CharField(source="company_user.email", read_only=True, default=None)
    manager_name = serializers.CharField(source="manager.name", read_only=True, default=None)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True, default=None)
    attachments = ProposalAttachmentSerializer(many=True, read_only=True)
    review_url = serializers.SerializerMethodField()
    whatsapp_link = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            "id", "title", "company", "company_detail", "company_user", "company_user_name",
            "company_user_email", "manager", "manager_name", "message", "status",
            "created_by", "created_by_name", "attachments", "review_url", "whatsapp_link",
            "created_at", "updated_at", "sent_at", "approved_at", "rejected_at",
        ]
        read_only_fields = [
            "id", "status", "created_by", "created_at", "updated_at",
            "sent_at", "approved_at", "rejected_at",
        ]

    def get_review_url(self, obj):
        # Only expose the link once the proposal has actually been sent (token_expires_at is
        # set at that point), and only while it hasn't expired — an expired link should be
        # refreshed via Resend rather than manually copied.
        if not obj.token_expires_at or obj.is_token_expired():
            return None
        return build_review_url(obj)

    def get_whatsapp_link(self, obj):
        if not obj.token_expires_at or obj.is_token_expired():
            return None
        return build_whatsapp_link(obj, build_review_url(obj))


class ProposalCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ["id", "title", "company", "manager", "message"]
        read_only_fields = ["id"]

    def validate_manager(self, value):
        if value and value.role != UserRole.MANAGER:
            raise serializers.ValidationError("Selected user must have the Manager role.")
        return value

    def create(self, validated_data):
        # Each company has exactly one linked login account; the frontend no longer picks a
        # "company user" manually — it's always resolved from the chosen company.
        user, created = ensure_company_user(validated_data["company"])
        if created:
            send_invite(user)
        validated_data["company_user"] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if instance.status not in (ProposalStatus.DRAFT, ProposalStatus.CHANGES_REQUESTED):
            raise serializers.ValidationError(
                "Only draft proposals or proposals with requested changes can be edited."
            )
        if "company" in validated_data:
            user, created = ensure_company_user(validated_data["company"])
            if created:
                send_invite(user)
            validated_data["company_user"] = user
        return super().update(instance, validated_data)


class ReviewProposalSerializer(serializers.ModelSerializer):
    """Public-facing serializer for the /review/{token}/ page. No internal admin data."""
    company_name = serializers.CharField(source="company.company_name", read_only=True)
    contact_person = serializers.CharField(source="company.contact_person", read_only=True)
    phone = serializers.CharField(source="company.phone", read_only=True)
    attachments = ProposalAttachmentSerializer(many=True, read_only=True)
    observations = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            "id", "title", "company_name", "contact_person", "phone", "message", "status",
            "attachments", "observations", "sent_at",
        ]
        read_only_fields = fields

    def get_observations(self, obj):
        return ObservationSerializer(obj.observations.all(), many=True).data
