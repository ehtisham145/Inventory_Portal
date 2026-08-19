from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import User, UserRole


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["name"] = user.name
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        data["user"] = UserSerializer(self.user).data
        return data


class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.company_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "name", "email", "phone", "role", "company", "company_name",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "name", "email", "phone", "role", "company", "password", "is_active"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        role = attrs.get("role")
        company = attrs.get("company")
        if role == UserRole.COMPANY_USER and not company:
            raise serializers.ValidationError({"company": "Company is required for company users."})
        if role in (UserRole.MAIN_ADMIN, UserRole.MANAGER) and company:
            raise serializers.ValidationError({"company": "Admins and managers must not be linked to a company."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["name", "email", "phone", "role", "company", "password", "is_active"]

    def update(self, instance, validated_data):
        if instance.role == UserRole.MAIN_ADMIN and validated_data.get("is_active") is False:
            raise serializers.ValidationError({"is_active": "Main Admin accounts cannot be deactivated."})
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class InviteInfoSerializer(serializers.ModelSerializer):
    """Public-facing serializer for the /setup-password/{token} page. No internal admin data."""
    company_name = serializers.CharField(source="company.company_name", read_only=True, default=None)

    class Meta:
        model = User
        fields = ["name", "email", "company_name"]
        read_only_fields = fields


class SetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        validate_password(value, user=self.context.get("user"))
        return value
