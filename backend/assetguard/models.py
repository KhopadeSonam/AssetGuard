from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class Base(models.Model):
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=150)

    def __str__(self):
        return self.name

class User(AbstractUser):

    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('BASE_COMMANDER', 'Base Commander'),
        ('LOGISTICS_OFFICER', 'Logistics Officer'),
    ]

    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default='ADMIN'
    )

    base = models.ForeignKey(
        "Base",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )

    def __str__(self):
        return self.username

class EquipmentType(models.Model):

    CATEGORY_CHOICES = [
        ('VEHICLE', 'Vehicle'),
        ('WEAPON', 'Weapon'),
        ('AMMUNITION', 'Ammunition'),
        ('OTHER', 'Other'),
    ]

    name = models.CharField(max_length=100)

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES
    )

    def __str__(self):
        return self.name

class Inventory(models.Model):

    base = models.ForeignKey(
        Base,
        on_delete=models.CASCADE,
        related_name="inventories"
    )

    equipment_type = models.ForeignKey(
        EquipmentType,
        on_delete=models.CASCADE,
        related_name="inventories"
    )

    quantity = models.PositiveIntegerField(default=0)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["base", "equipment_type"],
                name="unique_base_equipment"
            )
        ]

    def __str__(self):
        return f"{self.base} - {self.equipment_type} - {self.quantity}"

class Purchase(models.Model):

    base = models.ForeignKey(
        Base,
        on_delete=models.CASCADE,
        related_name="purchases"
    )

    equipment_type = models.ForeignKey(
        EquipmentType,
        on_delete=models.CASCADE,
        related_name="purchases"
    )

    quantity = models.PositiveIntegerField()

    purchase_date = models.DateField()

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="purchases"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.base} - {self.equipment_type} - {self.quantity}"

class Transfer(models.Model):

    from_base = models.ForeignKey(
        Base,
        on_delete=models.CASCADE,
        related_name="transfers_out"
    )

    to_base = models.ForeignKey(
        Base,
        on_delete=models.CASCADE,
        related_name="transfers_in"
    )

    equipment_type = models.ForeignKey(
        EquipmentType,
        on_delete=models.CASCADE,
        related_name="transfers"
    )

    quantity = models.PositiveIntegerField()

    transfer_date = models.DateField()

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="transfers"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"{self.from_base} -> {self.to_base} | "
            f"{self.equipment_type} | {self.quantity}"
        )

class Assignment(models.Model):

    base = models.ForeignKey(
        Base,
        on_delete=models.CASCADE,
        related_name="assignments"
    )

    equipment_type = models.ForeignKey(
        EquipmentType,
        on_delete=models.CASCADE,
        related_name="assignments"
    )

    personnel_name = models.CharField(max_length=150)

    quantity = models.PositiveIntegerField()

    assignment_date = models.DateField()

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assignments"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"{self.personnel_name} - "
            f"{self.equipment_type} - {self.quantity}"
        )


class Expenditure(models.Model):

    base = models.ForeignKey(
        Base,
        on_delete=models.CASCADE,
        related_name="expenditures"
    )

    equipment_type = models.ForeignKey(
        EquipmentType,
        on_delete=models.CASCADE,
        related_name="expenditures"
    )

    quantity = models.PositiveIntegerField()

    reason = models.CharField(max_length=255)

    expenditure_date = models.DateField()

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="expenditures"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"{self.base} - "
            f"{self.equipment_type} - {self.quantity}"
        )

class AuditLog(models.Model):

    ACTION_CHOICES = [
        ("PURCHASE", "Purchase"),
        ("TRANSFER", "Transfer"),
        ("ASSIGNMENT", "Assignment"),
        ("EXPENDITURE", "Expenditure"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs"
    )

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES
    )

    base = models.ForeignKey(
        Base,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs"
    )

    equipment_type = models.ForeignKey(
        EquipmentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs"
    )

    quantity = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    details = models.TextField(
        blank=True
    )

    timestamp = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        username = self.user.username if self.user else "Unknown"
        return f"{self.action} - {username}"