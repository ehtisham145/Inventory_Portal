from django.db import IntegrityError, transaction
from rest_framework import serializers

from companies.models import Company
from companies.services import ensure_company_user, send_invite


class CompanySerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()
    login_email = serializers.SerializerMethodField()
    login_status = serializers.SerializerMethodField()
    proposal_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id", "company_name", "contact_person", "email", "phone", "address",
            "status", "user_count", "login_email", "login_status", "proposal_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_user_count(self, obj):
        return obj.users.count()

    def get_proposal_count(self, obj):
        return obj.proposals.count()

    def _linked_user(self, obj):
        return obj.users.filter(role="COMPANY_USER").order_by("created_at").first()

    def get_login_email(self, obj):
        user = self._linked_user(obj)
        return user.email if user else None

    def get_login_status(self, obj):
        user = self._linked_user(obj)
        if not user:
            return "none"
        return "active" if user.has_usable_password() else "invite_pending"

    def create(self, validated_data):
        try:
            with transaction.atomic():
                company = super().create(validated_data)
                user, created = ensure_company_user(company)
        except IntegrityError:
            raise serializers.ValidationError(
                {"email": "This email is already used by another account. Choose a different one."}
            )
        if created:
            send_invite(user)
        return company

    def update(self, instance, validated_data):
        try:
            with transaction.atomic():
                company = super().update(instance, validated_data)
                user, created = ensure_company_user(company)
        except IntegrityError:
            raise serializers.ValidationError(
                {"email": "This email is already used by another account. Choose a different one."}
            )
        if created:
            send_invite(user)
        return company
