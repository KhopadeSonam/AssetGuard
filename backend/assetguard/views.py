from django.db import models, transaction
from django.db.models import Sum

from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    Purchase,
    Inventory,
    Base,
    EquipmentType,
    Transfer,
    Assignment,
    Expenditure,
    AuditLog,
    User,
)

from .serializers import (
    LoginSerializer,
    PurchaseSerializer,
    BaseSerializer,
    EquipmentTypeSerializer,
    TransferSerializer,
    AssignmentSerializer,
    ExpenditureSerializer,
    InventorySerializer,
    AuditLogSerializer,
    UserSerializer
)

from .permissions import (
    IsAdminRole,
    IsAdminOrBaseCommanderOrLogisticsOfficer,
    IsAdminOrBaseCommander,
)

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class PurchaseListCreateView(generics.ListCreateAPIView):

    serializer_class = PurchaseSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminOrBaseCommanderOrLogisticsOfficer
    ]

    def get_queryset(self):
        queryset = Purchase.objects.all().order_by(
            "-created_at"
        )
        user = self.request.user

        if user.role in ["BASE_COMMANDER", "LOGISTICS_OFFICER"]:
            if not user.base_id:
                return Purchase.objects.none()
            return queryset.filter(base_id=user.base_id)

        base = self.request.query_params.get("base")
        equipment_type = self.request.query_params.get(
            "equipment_type"
        )
        date = self.request.query_params.get("date")

        if base:
            queryset = queryset.filter(
                base_id=base
            )

        if equipment_type:
            queryset = queryset.filter(
                equipment_type_id=equipment_type
            )

        if date:
            queryset = queryset.filter(
                purchase_date=date
            )

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        if user.role in ["BASE_COMMANDER", "LOGISTICS_OFFICER"]:
            if not user.base_id:
                raise ValidationError("User has no assigned base.")
            target_base = serializer.validated_data.get("base")
            if target_base and target_base.id != user.base_id:
                raise ValidationError("You can only purchase equipment for your assigned base.")

        # Save purchase
        purchase = serializer.save(
            created_by=user
        )

        # Get or create inventory
        inventory, created = Inventory.objects.get_or_create(
            base=purchase.base,
            equipment_type=purchase.equipment_type,
            defaults={
                "quantity": 0
            }
        )

        # Increase inventory
        inventory.quantity += purchase.quantity
        inventory.save()

        # Create audit log
        AuditLog.objects.create(
            user=user,
            action="PURCHASE",
            base=purchase.base,
            equipment_type=purchase.equipment_type,
            quantity=purchase.quantity,
            details=(
                f"Purchased {purchase.quantity} "
                f"{purchase.equipment_type.name} "
                f"for {purchase.base.name}."
            )
        )


class BaseListView(generics.ListAPIView):

    queryset = Base.objects.all().order_by("name")
    serializer_class = BaseSerializer
    permission_classes = [
        IsAuthenticated
    ]


class EquipmentTypeListView(generics.ListAPIView):

    queryset = EquipmentType.objects.all().order_by("name")
    serializer_class = EquipmentTypeSerializer
    permission_classes = [
        IsAuthenticated
    ]


class TransferListCreateView(generics.ListCreateAPIView):

    serializer_class = TransferSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminOrBaseCommanderOrLogisticsOfficer
    ]

    def get_queryset(self):
        queryset = Transfer.objects.all().order_by(
            "-created_at"
        )
        user = self.request.user

        if user.role in ["BASE_COMMANDER", "LOGISTICS_OFFICER"]:
            if not user.base_id:
                return Transfer.objects.none()
            return queryset.filter(
                models.Q(from_base_id=user.base_id) | models.Q(to_base_id=user.base_id)
            )

        base = self.request.query_params.get("base")
        equipment_type = self.request.query_params.get(
            "equipment_type"
        )
        date = self.request.query_params.get("date")

        if base:
            queryset = queryset.filter(
                models.Q(
                    from_base_id=base
                )
                |
                models.Q(
                    to_base_id=base
                )
            )

        if equipment_type:
            queryset = queryset.filter(
                equipment_type_id=equipment_type
            )

        if date:
            queryset = queryset.filter(
                transfer_date=date
            )

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        from_base = serializer.validated_data["from_base"]
        to_base = serializer.validated_data["to_base"]
        equipment = serializer.validated_data["equipment_type"]
        quantity = serializer.validated_data["quantity"]

        if user.role in ["BASE_COMMANDER", "LOGISTICS_OFFICER"]:
            if not user.base_id:
                raise ValidationError("User has no assigned base.")
            if from_base.id != user.base_id:
                raise ValidationError("You can only initiate transfers from your assigned base.")

        try:
            source_inventory = (
                Inventory.objects
                .select_for_update()
                .get(
                    base=from_base,
                    equipment_type=equipment
                )
            )
        except Inventory.DoesNotExist:
            raise ValidationError(
                "Selected equipment is not "
                "available at the source base."
            )

        if source_inventory.quantity < quantity:
            raise ValidationError(
                f"Insufficient inventory. "
                f"Available quantity: "
                f"{source_inventory.quantity}"
            )

        destination_inventory, created = (
            Inventory.objects
            .select_for_update()
            .get_or_create(
                base=to_base,
                equipment_type=equipment,
                defaults={
                    "quantity": 0
                }
            )
        )

        source_inventory.quantity -= quantity
        destination_inventory.quantity += quantity

        source_inventory.save()
        destination_inventory.save()

        transfer = serializer.save(
            created_by=user
        )

        AuditLog.objects.create(
            user=user,
            action="TRANSFER",
            base=transfer.from_base,
            equipment_type=transfer.equipment_type,
            quantity=transfer.quantity,
            details=(
                f"Transferred {transfer.quantity} "
                f"{transfer.equipment_type.name} "
                f"from {transfer.from_base.name} "
                f"to {transfer.to_base.name}."
            )
        )


class AssignmentListCreateView(generics.ListCreateAPIView):

    serializer_class = AssignmentSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminOrBaseCommander
    ]

    def get_queryset(self):
        queryset = Assignment.objects.all().order_by(
            "-created_at"
        )
        user = self.request.user

        if user.role == "BASE_COMMANDER":
            if not user.base_id:
                return Assignment.objects.none()
            return queryset.filter(base_id=user.base_id)

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        base = serializer.validated_data["base"]
        equipment = serializer.validated_data["equipment_type"]
        quantity = serializer.validated_data["quantity"]

        if user.role == "BASE_COMMANDER":
            if not user.base_id:
                raise ValidationError("User has no assigned base.")
            if base.id != user.base_id:
                raise ValidationError("You can only assign assets for your assigned base.")

        try:
            inventory = (
                Inventory.objects
                .select_for_update()
                .get(
                    base=base,
                    equipment_type=equipment
                )
            )
        except Inventory.DoesNotExist:
            raise ValidationError(
                "Selected equipment is not "
                "available at this base."
            )

        if inventory.quantity < quantity:
            raise ValidationError(
                f"Insufficient inventory. "
                f"Available quantity: "
                f"{inventory.quantity}"
            )

        inventory.quantity -= quantity
        inventory.save()

        assignment = serializer.save(
            created_by=user
        )

        AuditLog.objects.create(
            user=user,
            action="ASSIGNMENT",
            base=assignment.base,
            equipment_type=assignment.equipment_type,
            quantity=assignment.quantity,
            details=(
                f"Assigned {assignment.quantity} "
                f"{assignment.equipment_type.name} "
                f"to {assignment.personnel_name} "
                f"at {assignment.base.name}."
            )
        )


class ExpenditureListCreateView(generics.ListCreateAPIView):

    serializer_class = ExpenditureSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminOrBaseCommander
    ]

    def get_queryset(self):
        queryset = Expenditure.objects.all().order_by(
            "-created_at"
        )
        user = self.request.user

        if user.role == "BASE_COMMANDER":
            if not user.base_id:
                return Expenditure.objects.none()
            return queryset.filter(base_id=user.base_id)

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        base = serializer.validated_data["base"]
        equipment = serializer.validated_data["equipment_type"]
        quantity = serializer.validated_data["quantity"]

        if user.role == "BASE_COMMANDER":
            if not user.base_id:
                raise ValidationError("User has no assigned base.")
            if base.id != user.base_id:
                raise ValidationError("You can only record expenditures for your assigned base.")

        try:
            inventory = (
                Inventory.objects
                .select_for_update()
                .get(
                    base=base,
                    equipment_type=equipment
                )
            )
        except Inventory.DoesNotExist:
            raise ValidationError(
                "Selected equipment is not "
                "available at this base."
            )

        if inventory.quantity < quantity:
            raise ValidationError(
                f"Insufficient inventory. "
                f"Available quantity: "
                f"{inventory.quantity}"
            )

        inventory.quantity -= quantity
        inventory.save()

        expenditure = serializer.save(
            created_by=user
        )

        AuditLog.objects.create(
            user=user,
            action="EXPENDITURE",
            base=expenditure.base,
            equipment_type=expenditure.equipment_type,
            quantity=expenditure.quantity,
            details=(
                f"Expended {expenditure.quantity} "
                f"{expenditure.equipment_type.name} "
                f"at {expenditure.base.name}. "
                f"Reason: {expenditure.reason}"
            )
        )


class DashboardView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdminOrBaseCommanderOrLogisticsOfficer
    ]

    def get(self, request):
        user = request.user
        base_id = request.query_params.get("base")

        if user.role in ["BASE_COMMANDER", "LOGISTICS_OFFICER"]:
            if user.base_id:
                base_id = user.base_id
            else:
                base_id = -1

        equipment_id = request.query_params.get("equipment_type")
        date = request.query_params.get("date")

        inventory_qs = Inventory.objects.all()

        if base_id:
            inventory_qs = inventory_qs.filter(
                base_id=base_id
            )

        if equipment_id:
            inventory_qs = inventory_qs.filter(
                equipment_type_id=equipment_id
            )

        closing_balance = (
            inventory_qs.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        purchase_qs = Purchase.objects.all()

        if base_id:
            purchase_qs = purchase_qs.filter(
                base_id=base_id
            )

        if equipment_id:
            purchase_qs = purchase_qs.filter(
                equipment_type_id=equipment_id
            )

        if date:
            purchase_qs = purchase_qs.filter(
                purchase_date=date
            )

        purchases = (
            purchase_qs.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        transfer_in_qs = Transfer.objects.all()

        if base_id:
            transfer_in_qs = transfer_in_qs.filter(
                to_base_id=base_id
            )

        if equipment_id:
            transfer_in_qs = transfer_in_qs.filter(
                equipment_type_id=equipment_id
            )

        if date:
            transfer_in_qs = transfer_in_qs.filter(
                transfer_date=date
            )

        transfer_in = (
            transfer_in_qs.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        transfer_out_qs = Transfer.objects.all()

        if base_id:
            transfer_out_qs = transfer_out_qs.filter(
                from_base_id=base_id
            )

        if equipment_id:
            transfer_out_qs = transfer_out_qs.filter(
                equipment_type_id=equipment_id
            )

        if date:
            transfer_out_qs = transfer_out_qs.filter(
                transfer_date=date
            )

        transfer_out = (
            transfer_out_qs.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        assignment_qs = Assignment.objects.all()

        if base_id:
            assignment_qs = assignment_qs.filter(
                base_id=base_id
            )

        if equipment_id:
            assignment_qs = assignment_qs.filter(
                equipment_type_id=equipment_id
            )

        if date:
            assignment_qs = assignment_qs.filter(
                assignment_date=date
            )

        assigned = (
            assignment_qs.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        expenditure_qs = Expenditure.objects.all()

        if base_id:
            expenditure_qs = expenditure_qs.filter(
                base_id=base_id
            )

        if equipment_id:
            expenditure_qs = expenditure_qs.filter(
                equipment_type_id=equipment_id
            )

        if date:
            expenditure_qs = expenditure_qs.filter(
                expenditure_date=date
            )

        expended = (
            expenditure_qs.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        net_movement = (
            purchases
            + transfer_in
            - transfer_out
        )

        opening_balance = (
            closing_balance
            - net_movement
            + assigned
            + expended
        )

        return Response({
            "opening_balance": opening_balance,
            "closing_balance": closing_balance,
            "net_movement": net_movement,
            "purchases": purchases,
            "transfer_in": transfer_in,
            "transfer_out": transfer_out,
            "assigned": assigned,
            "expended": expended,
        })


class InventoryListView(generics.ListAPIView):

    serializer_class = InventorySerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminOrBaseCommanderOrLogisticsOfficer
    ]

    def get_queryset(self):
        queryset = Inventory.objects.all().order_by(
            "base__name",
            "equipment_type__name"
        )
        user = self.request.user

        if user.role in ["BASE_COMMANDER", "LOGISTICS_OFFICER"]:
            if not user.base_id:
                return Inventory.objects.none()
            return queryset.filter(base_id=user.base_id)

        base = self.request.query_params.get("base")
        equipment_type = self.request.query_params.get(
            "equipment_type"
        )

        if base:
            queryset = queryset.filter(
                base_id=base
            )

        if equipment_type:
            queryset = queryset.filter(
                equipment_type_id=equipment_type
            )

        return queryset


class AuditLogListView(generics.ListAPIView):

    serializer_class = AuditLogSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminOrBaseCommanderOrLogisticsOfficer
    ]

    def get_queryset(self):
        queryset = (
            AuditLog.objects
            .select_related(
                "user",
                "base",
                "equipment_type"
            )
            .order_by("-timestamp")
        )
        user = self.request.user

        if user.role in ["BASE_COMMANDER", "LOGISTICS_OFFICER"]:
            if not user.base_id:
                return AuditLog.objects.none()
            return queryset.filter(base_id=user.base_id)

        action = self.request.query_params.get("action")
        base = self.request.query_params.get("base")
        equipment_type = self.request.query_params.get(
            "equipment_type"
        )

        if action:
            queryset = queryset.filter(
                action=action
            )

        if base:
            queryset = queryset.filter(
                base_id=base
            )

        if equipment_type:
            queryset = queryset.filter(
                equipment_type_id=equipment_type
            )

        return queryset


class UserListCreateView(generics.ListCreateAPIView):

    serializer_class = UserSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminRole
    ]

    def get_queryset(self):
        queryset = (
            User.objects
            .select_related("base")
            .all()
            .order_by("-date_joined")
        )

        role = self.request.query_params.get("role")
        base = self.request.query_params.get("base")

        if role:
            queryset = queryset.filter(
                role=role
            )

        if base:
            queryset = queryset.filter(
                base_id=base
            )

        return queryset


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):

    queryset = (
        User.objects
        .select_related("base")
        .all()
    )

    serializer_class = UserSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminRole
    ]

    def perform_update(self, serializer):
        user = self.get_object()
        is_active = serializer.validated_data.get("is_active")

        if (
            user.id == self.request.user.id
            and is_active is False
        ):
            raise ValidationError(
                "You cannot deactivate your own account."
            )

        serializer.save()

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            raise ValidationError(
                "You cannot delete your own account."
            )

        instance.delete()