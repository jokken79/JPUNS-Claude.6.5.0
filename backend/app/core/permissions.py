"""
Role-Based Access Control (RBAC) Configuration

Defines the role hierarchy and permission system for UNS-ClaudeJP.
"""
from typing import Dict, List
from app.models.models import UserRole


# ============================================
# ROLE HIERARCHY DEFINITION
# ============================================

# Role hierarchy: Higher number = more permissions
# This defines the complete hierarchy including legacy roles
ROLE_HIERARCHY: Dict[UserRole, int] = {
    UserRole.SUPER_ADMIN: 100,     # Full system control
    UserRole.ADMIN: 80,              # Administrative access
    UserRole.KEITOSAN: 70,           # Finance/Accounting management (経理管理) - LEGACY but integrated
    UserRole.TANTOSHA: 60,           # HR/Operations personnel (担当者) - LEGACY but integrated
    UserRole.COORDINATOR: 50,        # Coordination tasks
    UserRole.KANRININSHA: 40,        # Manager (管理人者)
    UserRole.EMPLOYEE: 20,           # Employee access (派遣社員)
    UserRole.CONTRACT_WORKER: 10,    # Contract worker access (請負)
}


# ============================================
# ROLE COMPARISON FUNCTIONS
# ============================================

def role_has_permission(user_role: UserRole, required_role: UserRole) -> bool:
    """
    Check if a user's role has sufficient permissions.

    Args:
        user_role: The user's current role
        required_role: The minimum required role

    Returns:
        bool: True if user has sufficient permissions, False otherwise

    Examples:
        >>> role_has_permission(UserRole.ADMIN, UserRole.COORDINATOR)
        True  # ADMIN (80) >= COORDINATOR (50)

        >>> role_has_permission(UserRole.EMPLOYEE, UserRole.ADMIN)
        False  # EMPLOYEE (20) < ADMIN (80)

        >>> role_has_permission(UserRole.KEITOSAN, UserRole.COORDINATOR)
        True  # KEITOSAN (70) >= COORDINATOR (50)
    """
    return ROLE_HIERARCHY.get(user_role, 0) >= ROLE_HIERARCHY.get(required_role, 0)


def get_role_level(role: UserRole) -> int:
    """
    Get the numeric permission level for a role.

    Args:
        role: The role to check

    Returns:
        int: Permission level (0 if role not found)
    """
    return ROLE_HIERARCHY.get(role, 0)


def get_roles_with_minimum_level(min_level: int) -> List[UserRole]:
    """
    Get all roles that have at least the specified permission level.

    Args:
        min_level: Minimum permission level

    Returns:
        List[UserRole]: List of roles with sufficient permissions

    Examples:
        >>> roles = get_roles_with_minimum_level(50)
        >>> UserRole.COORDINATOR in roles
        True
        >>> UserRole.ADMIN in roles
        True
        >>> UserRole.EMPLOYEE in roles
        False
    """
    return [role for role, level in ROLE_HIERARCHY.items() if level >= min_level]


def get_admin_roles() -> List[UserRole]:
    """
    Get all roles with administrative privileges (ADMIN level and above).

    Returns:
        List[UserRole]: [SUPER_ADMIN, ADMIN, KEITOSAN, TANTOSHA]
    """
    return get_roles_with_minimum_level(60)  # TANTOSHA level and above


def get_manager_roles() -> List[UserRole]:
    """
    Get all roles with manager privileges (COORDINATOR level and above).

    Returns:
        List[UserRole]: [SUPER_ADMIN, ADMIN, KEITOSAN, TANTOSHA, COORDINATOR]
    """
    return get_roles_with_minimum_level(50)  # COORDINATOR level and above


# ============================================
# LEGACY ROLE NOTES
# ============================================

"""
LEGACY ROLES INTEGRATION:

- KEITOSAN (経理管理): Finance/Accounting management
  * Positioned between ADMIN and TANTOSHA (level 70)
  * Has full access to financial data and salary calculations
  * Cannot manage system settings (requires ADMIN)

- TANTOSHA (担当者): HR/Operations personnel
  * Positioned between KEITOSAN and COORDINATOR (level 60)
  * Has access to employee management and operational tasks
  * Cannot manage financial data (requires KEITOSAN or higher)

These roles are marked as LEGACY but fully integrated into the hierarchy.
They are positioned based on their functional responsibilities:

SUPER_ADMIN (100) - System administration
    ↓
ADMIN (80) - Full administrative access
    ↓
KEITOSAN (70) - Finance/Accounting
    ↓
TANTOSHA (60) - HR/Operations
    ↓
COORDINATOR (50) - Coordination
    ↓
KANRININSHA (40) - Manager
    ↓
EMPLOYEE (20) - Employee
    ↓
CONTRACT_WORKER (10) - Contract worker
"""
