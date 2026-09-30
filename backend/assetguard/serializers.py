from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers

from .models import Purchase, Base, EquipmentType, Transfer, Assignment, Expenditure, Inventory, AuditLog, User

class LoginSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'base': self.user.base.id if self.user.base else None,
            'base_name': self.user.base.name if self.user.base else None,
        }

        return data

class PurchaseSerializer(serializers.ModelSerializer):

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    base_name = serializers.CharField(
        source="base.name",
        read_only=True
    )

    equipment_name = serializers.CharField(
        source="equipment_type.name",
        read_only=True
    )

    class Meta:
        model = Purchase

        fields = [
            "id",
            "base",
            "base_name",
            "equipment_type",
            "equipment_name",
            "quantity",
            "purchase_date",
            "created_by",
            "created_by_username",
            "created_at",
        ]

        read_only_fields = [
            "created_by",
            "created_at"
        ]

class BaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Base
        fields = ["id", "name", "location"]


class EquipmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentType
        fields = ["id", "name", "category"]

class TransferSerializer(serializers.ModelSerializer):

    from_base_name = serializers.CharField(
        source="from_base.name",
        read_only=True
    )

    to_base_name = serializers.CharField(
        source="to_base.name",
        read_only=True
    )

    equipment_name = serializers.CharField(
        source="equipment_type.name",
        read_only=True
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = Transfer

        fields = [
            "id",
            "from_base",
            "from_base_name",
            "to_base",
            "to_base_name",
            "equipment_type",
            "equipment_name",
            "quantity",
            "transfer_date",
            "created_by",
            "created_by_username",
            "created_at",
        ]

        read_only_fields = [
            "created_by",
            "created_at",
        ]

    def validate(self, data):

        if data["from_base"] == data["to_base"]:
            raise serializers.ValidationError(
                "Source and destination bases cannot be the same."
            )

        if data["quantity"] <= 0:
            raise serializers.ValidationError(
                "Transfer quantity must be greater than zero."
            )

        return data

class AssignmentSerializer(serializers.ModelSerializer):

    base_name = serializers.CharField(
        source="base.name",
        read_only=True
    )

    equipment_name = serializers.CharField(
        source="equipment_type.name",
        read_only=True
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = Assignment

        fields = [
            "id",
            "base",
            "base_name",
            "equipment_type",
            "equipment_name",
            "personnel_name",
            "quantity",
            "assignment_date",
            "created_by",
            "created_by_username",
            "created_at",
        ]

        read_only_fields = [
            "created_by",
            "created_at",
        ]


class ExpenditureSerializer(serializers.ModelSerializer):

    base_name = serializers.CharField(
        source="base.name",
        read_only=True
    )

    equipment_name = serializers.CharField(
        source="equipment_type.name",
        read_only=True
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = Expenditure

        fields = [
            "id",
            "base",
            "base_name",
            "equipment_type",
            "equipment_name",
            "quantity",
            "reason",
            "expenditure_date",
            "created_by",
            "created_by_username",
            "created_at",
        ]

        read_only_fields = [
            "created_by",
            "created_at",
        ]

class InventorySerializer(serializers.ModelSerializer):

    base_name = serializers.CharField(
        source="base.name",
        read_only=True
    )

    equipment_name = serializers.CharField(
        source="equipment_type.name",
        read_only=True
    )

    equipment_category = serializers.CharField(
        source="equipment_type.category",
        read_only=True
    )

    class Meta:
        model = Inventory

        fields = [
            "id",
            "base",
            "base_name",
            "equipment_type",
            "equipment_name",
            "equipment_category",
            "quantity",
            "updated_at",
        ]

class AuditLogSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    base_name = serializers.CharField(
        source="base.name",
        read_only=True
    )

    equipment_name = serializers.CharField(
        source="equipment_type.name",
        read_only=True
    )

    class Meta:
        model = AuditLog

        fields = [
            "id",
            "user",
            "username",
            "action",
            "base",
            "base_name",
            "equipment_type",
            "equipment_name",
            "quantity",
            "details",
            "timestamp",
        ]

        read_only_fields = fields

class UserSerializer(serializers.ModelSerializer):

    base_name = serializers.CharField(
        source="base.name",
        read_only=True
    )

    password = serializers.CharField(
        write_only=True,
        required=False
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "password",
            "role",
            "base",
            "base_name",
            "is_active",
            "date_joined",
        ]

        read_only_fields = [
            "id",
            "date_joined",
        ]

    def create(self, validated_data):

        password = validated_data.pop(
            "password",
            None
        )

        user = User(**validated_data)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save()

        return user


    def update(self, instance, validated_data):

        password = validated_data.pop(
            "password",
            None
        )

        for attribute, value in validated_data.items():
            setattr(
                instance,
                attribute,
                value
            )

        if password:
            instance.set_password(password)

        instance.save()

        return instance

    def validate(self, attrs):

        role = attrs.get(
            "role",
            getattr(
                self.instance,
                "role",
                None
            )
        )

        base = attrs.get(
            "base",
            getattr(
                self.instance,
                "base",
                None
            )
        )

        if role in [
            "BASE_COMMANDER",
            "LOGISTICS_OFFICER"
        ] and not base:

            raise serializers.ValidationError({
                "base":
                    "A base is required for this role."
            })

        return attrs