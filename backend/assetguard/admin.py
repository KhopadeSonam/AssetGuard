from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (Transfer, User, Base, EquipmentType, Inventory, Purchase,  
                     Assignment, Expenditure, AuditLog)

# Register your models here.
@admin.register(User)
class CustomUserAdmin(UserAdmin):

    fieldsets = UserAdmin.fieldsets + (
        ('AssetGuard Role', {
            'fields': ('role', 'base')
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('AssetGuard Role', {
            'fields': ('role', 'base')
        }),
    )

@admin.register(Base)
class BaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'location')


@admin.register(EquipmentType)
class EquipmentTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category')


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'base',
        'equipment_type',
        'quantity',
        'updated_at'
    )

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'base',
        'equipment_type',
        'quantity',
        'purchase_date',
        'created_by',
        'created_at'
    )

    list_filter = (
        'base',
        'equipment_type',
        'purchase_date'
    )

@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "from_base",
        "to_base",
        "equipment_type",
        "quantity",
        "transfer_date",
        "created_by",
        "created_at",
    )

    list_filter = (
        "from_base",
        "to_base",
        "equipment_type",
        "transfer_date",
    )

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "base",
        "equipment_type",
        "personnel_name",
        "quantity",
        "assignment_date",
        "created_by",
    )

    list_filter = (
        "base",
        "equipment_type",
        "assignment_date",
    )


@admin.register(Expenditure)
class ExpenditureAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "base",
        "equipment_type",
        "quantity",
        "reason",
        "expenditure_date",
        "created_by",
    )

    list_filter = (
        "base",
        "equipment_type",
        "expenditure_date",
    )

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "action",
        "base",
        "equipment_type",
        "quantity",
        "timestamp",
    )

    list_filter = (
        "action",
        "base",
        "equipment_type",
    )

    search_fields = (
        "user__username",
        "details",
    )

    readonly_fields = (
        "user",
        "action",
        "base",
        "equipment_type",
        "quantity",
        "details",
        "timestamp",
    )

    ordering = (
        "-timestamp",
    )