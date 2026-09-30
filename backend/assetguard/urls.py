from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (AssignmentListCreateView, ExpenditureListCreateView, LoginView, 
                    PurchaseListCreateView, BaseListView, EquipmentTypeListView, 
                    TransferListCreateView, DashboardView, InventoryListView, AuditLogListView,
                    UserListCreateView, UserDetailView,)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path(
        'purchases/',
        PurchaseListCreateView.as_view(),
        name='purchases'
    ),
    
    path(
    "bases/",
    BaseListView.as_view(),
    name="bases"
    ),

    path(
    "equipment-types/",
    EquipmentTypeListView.as_view(),
    name="equipment-types"
    ),

    path(
    "transfers/",
    TransferListCreateView.as_view(),
    name="transfers"
    ),

    path(
    "assignments/",
    AssignmentListCreateView.as_view(),
    name="assignments"
    ),

    path(
    "expenditures/",
    ExpenditureListCreateView.as_view(),
    name="expenditures"
    ),

    path(
    "dashboard/",
    DashboardView.as_view(),
    name="dashboard"
    ),

    path(
    "inventory/",
    InventoryListView.as_view(),
    name="inventory"
    ),

    path(
    "audit-logs/",
    AuditLogListView.as_view(),
    name="audit-logs"
    ),

    path(
    "users/",
    UserListCreateView.as_view(),
    name="users"
    ),

    path(
    "users/<int:pk>/",
    UserDetailView.as_view(),
    name="user-detail"
    ),
]