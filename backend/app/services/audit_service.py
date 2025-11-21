"""
Audit Service - Comprehensive audit trail tracking for all operations

This service tracks all user actions, state changes, and data modifications
for compliance, debugging, and business intelligence purposes.

Key Features:
- Complete audit trail for all NYUUSHA workflow operations
- Track who did what, when, and what changed
- Store before/after values for data modifications
- Search and filter audit logs by various criteria
- JSON-based flexible log structure
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional
from enum import Enum
from sqlalchemy.orm import Session
from app.models.models import User, AuditLog
from app.core.config import settings

import logging

logger = logging.getLogger(__name__)


class AuditAction(str, Enum):
    """Enumeration of audit-trackable actions in the system."""

    # Candidate-related actions
    CANDIDATE_CREATED = "candidate_created"
    CANDIDATE_UPDATED = "candidate_updated"
    CANDIDATE_APPROVED = "candidate_approved"
    CANDIDATE_REJECTED = "candidate_rejected"
    CANDIDATE_HIRED = "candidate_hired"

    # Request-related actions
    REQUEST_CREATED = "request_created"
    REQUEST_UPDATED = "request_updated"
    REQUEST_EMPLOYEE_DATA_FILLED = "request_employee_data_filled"
    REQUEST_EMPLOYEE_DATA_UPDATED = "request_employee_data_updated"
    REQUEST_APPROVED = "request_approved"
    REQUEST_REJECTED = "request_rejected"
    REQUEST_COMPLETED = "request_completed"

    # Employee-related actions
    EMPLOYEE_CREATED = "employee_created"
    EMPLOYEE_UPDATED = "employee_updated"
    EMPLOYEE_ASSIGNED_FACTORY = "employee_assigned_factory"
    EMPLOYEE_ASSIGNED_APARTMENT = "employee_assigned_apartment"

    # Workflow actions
    NYUUSHA_REQUEST_CREATED = "nyuusha_request_created"
    NYUUSHA_APPROVED = "nyuusha_approved"
    NYUUSHA_EMPLOYEE_CREATED = "nyuusha_employee_created"

    # System actions
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_UPDATED = "user_updated"
    BULK_IMPORT = "bulk_import"
    DATA_EXPORT = "data_export"


class AuditService:
    """Service for managing audit trails and tracking system events."""

    @staticmethod
    def log_action(
        db: Session,
        action: AuditAction | str,
        user_id: int,
        entity_type: str,
        entity_id: int,
        changes: Optional[Dict[str, Any]] = None,
        before_values: Optional[Dict[str, Any]] = None,
        after_values: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Log an action to the audit trail.

        Args:
            db: Database session
            action: The action that was performed (from AuditAction enum)
            user_id: ID of user who performed the action
            entity_type: Type of entity affected (e.g., 'Candidate', 'Request', 'Employee')
            entity_id: ID of the entity affected
            changes: Dictionary of what changed {field: {old, new}}
            before_values: Complete before state of entity
            after_values: Complete after state of entity
            description: Human-readable description of the action
            ip_address: IP address of the request

        Returns:
            Created AuditLog object
        """
        try:
            audit_log = AuditLog(
                action=str(action),
                user_id=user_id,
                entity_type=entity_type,
                entity_id=entity_id,
                changes=changes,
                before_values=before_values,
                after_values=after_values,
                description=description or str(action),
                ip_address=ip_address,
                timestamp=datetime.utcnow(),
            )
            db.add(audit_log)
            db.commit()
            db.refresh(audit_log)
            logger.info(
                f"Audit log created: action={action}, "
                f"user_id={user_id}, entity={entity_type}:{entity_id}"
            )
            return audit_log
        except Exception as e:
            logger.error(f"Error creating audit log: {str(e)}")
            db.rollback()
            raise

    @staticmethod
    def log_candidate_approved(
        db: Session,
        user_id: int,
        candidate_id: int,
        candidate_name: str,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Log when a candidate is approved."""
        return AuditService.log_action(
            db=db,
            action=AuditAction.CANDIDATE_APPROVED,
            user_id=user_id,
            entity_type="Candidate",
            entity_id=candidate_id,
            description=f"Candidate '{candidate_name}' (ID: {candidate_id}) approved",
            ip_address=ip_address,
            after_values={"status": "APPROVED"},
        )

    @staticmethod
    def log_request_created(
        db: Session,
        user_id: int,
        request_id: int,
        request_type: str,
        candidate_id: int,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Log when a request is created."""
        return AuditService.log_action(
            db=db,
            action=AuditAction.REQUEST_CREATED,
            user_id=user_id,
            entity_type="Request",
            entity_id=request_id,
            description=f"Request type='{request_type}' created for candidate_id={candidate_id}",
            ip_address=ip_address,
            after_values={
                "type": request_type,
                "candidate_id": candidate_id,
                "status": "PENDING",
            },
        )

    @staticmethod
    def log_nyuusha_request_created(
        db: Session,
        user_id: int,
        request_id: int,
        candidate_id: int,
        candidate_name: str,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Log when a NYUUSHA request is automatically created."""
        return AuditService.log_action(
            db=db,
            action=AuditAction.NYUUSHA_REQUEST_CREATED,
            user_id=user_id,
            entity_type="Request",
            entity_id=request_id,
            description=f"NYUUSHA request auto-created for candidate '{candidate_name}' (ID: {candidate_id})",
            ip_address=ip_address,
            after_values={
                "type": "NYUUSHA",
                "candidate_id": candidate_id,
                "status": "PENDING",
                "auto_created": True,
            },
        )

    @staticmethod
    def log_employee_data_filled(
        db: Session,
        user_id: int,
        request_id: int,
        candidate_id: int,
        employee_data: Dict[str, Any],
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Log when employee data is filled in a NYUUSHA request."""
        # Extract key employee data for readable log
        key_data = {
            "factory_id": employee_data.get("factory_id"),
            "hire_date": employee_data.get("hire_date"),
            "position": employee_data.get("position"),
            "contract_type": employee_data.get("contract_type"),
            "jikyu": employee_data.get("jikyu"),
        }

        return AuditService.log_action(
            db=db,
            action=AuditAction.REQUEST_EMPLOYEE_DATA_FILLED,
            user_id=user_id,
            entity_type="Request",
            entity_id=request_id,
            description=f"Employee data filled for NYUUSHA request on candidate_id={candidate_id}",
            ip_address=ip_address,
            after_values={
                "employee_data": key_data,
                "fields_filled": list(employee_data.keys()),
                "total_fields": len(employee_data),
            },
        )

    @staticmethod
    def log_nyuusha_approved(
        db: Session,
        user_id: int,
        request_id: int,
        candidate_id: int,
        hakenmoto_id: str,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Log when a NYUUSHA request is approved and employee is created."""
        return AuditService.log_action(
            db=db,
            action=AuditAction.NYUUSHA_APPROVED,
            user_id=user_id,
            entity_type="Request",
            entity_id=request_id,
            description=f"NYUUSHA approved. Employee created with hakenmoto_id={hakenmoto_id} for candidate_id={candidate_id}",
            ip_address=ip_address,
            after_values={
                "status": "COMPLETED",
                "hakenmoto_id": hakenmoto_id,
                "candidate_status": "HIRED",
            },
        )

    @staticmethod
    def log_employee_created(
        db: Session,
        user_id: int,
        employee_id: int,
        hakenmoto_id: str,
        candidate_id: int,
        candidate_name: str,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Log when an employee is created from NYUUSHA approval."""
        return AuditService.log_action(
            db=db,
            action=AuditAction.EMPLOYEE_CREATED,
            user_id=user_id,
            entity_type="Employee",
            entity_id=employee_id,
            description=f"Employee '{candidate_name}' created with hakenmoto_id={hakenmoto_id} from candidate_id={candidate_id}",
            ip_address=ip_address,
            after_values={
                "hakenmoto_id": hakenmoto_id,
                "rirekisho_id": candidate_id,
                "status": "active",
            },
        )

    @staticmethod
    def log_user_login(
        db: Session,
        user_id: int,
        username: str,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Log user login event."""
        return AuditService.log_action(
            db=db,
            action=AuditAction.USER_LOGIN,
            user_id=user_id,
            entity_type="User",
            entity_id=user_id,
            description=f"User '{username}' logged in",
            ip_address=ip_address,
        )

    @staticmethod
    def log_user_logout(
        db: Session,
        user_id: int,
        username: str,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Log user logout event."""
        return AuditService.log_action(
            db=db,
            action=AuditAction.USER_LOGOUT,
            user_id=user_id,
            entity_type="User",
            entity_id=user_id,
            description=f"User '{username}' logged out",
            ip_address=ip_address,
        )

    @staticmethod
    def log_bulk_import(
        db: Session,
        user_id: int,
        entity_type: str,
        count: int,
        source: str,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Log bulk data import event."""
        return AuditService.log_action(
            db=db,
            action=AuditAction.BULK_IMPORT,
            user_id=user_id,
            entity_type=entity_type,
            entity_id=0,  # Not specific to one entity
            description=f"Bulk import of {count} {entity_type}s from {source}",
            ip_address=ip_address,
            after_values={
                "entity_type": entity_type,
                "count": count,
                "source": source,
            },
        )

    @staticmethod
    def get_audit_logs(
        db: Session,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[AuditLog], int]:
        """
        Retrieve audit logs with optional filtering.

        Args:
            db: Database session
            entity_type: Filter by entity type (e.g., 'Candidate', 'Request')
            entity_id: Filter by specific entity ID
            user_id: Filter by user who performed action
            action: Filter by specific action
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (list of audit logs, total count)
        """
        query = db.query(AuditLog)

        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        if entity_id:
            query = query.filter(AuditLog.entity_id == entity_id)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == str(action))

        total = query.count()
        logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).offset(offset).all()

        return logs, total

    @staticmethod
    def get_entity_history(
        db: Session,
        entity_type: str,
        entity_id: int,
    ) -> list[AuditLog]:
        """
        Get complete history of all changes to a specific entity.

        Args:
            db: Database session
            entity_type: Type of entity (e.g., 'Candidate', 'Request', 'Employee')
            entity_id: ID of the entity

        Returns:
            List of audit logs for this entity, ordered by timestamp
        """
        return (
            db.query(AuditLog)
            .filter(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(AuditLog.timestamp.asc())
            .all()
        )

    @staticmethod
    def get_candidate_workflow_history(
        db: Session,
        candidate_id: int,
    ) -> Dict[str, list[AuditLog]]:
        """
        Get complete workflow history for a candidate, including all related requests.

        Args:
            db: Database session
            candidate_id: ID of candidate

        Returns:
            Dictionary with candidate logs and request logs
        """
        # Get all candidate-related logs
        candidate_logs = (
            db.query(AuditLog)
            .filter(
                AuditLog.entity_type == "Candidate",
                AuditLog.entity_id == candidate_id,
            )
            .order_by(AuditLog.timestamp.asc())
            .all()
        )

        # Get all related request logs
        request_logs = (
            db.query(AuditLog)
            .filter(AuditLog.entity_type == "Request")
            .filter(AuditLog.after_values.contains({"candidate_id": candidate_id}))
            .order_by(AuditLog.timestamp.asc())
            .all()
        )

        # Get all related employee logs (created from this candidate)
        employee_logs = (
            db.query(AuditLog)
            .filter(AuditLog.entity_type == "Employee")
            .filter(AuditLog.after_values.contains({"rirekisho_id": candidate_id}))
            .order_by(AuditLog.timestamp.asc())
            .all()
        )

        return {
            "candidate": candidate_logs,
            "requests": request_logs,
            "employees": employee_logs,
        }

    @staticmethod
    def get_user_actions(
        db: Session,
        user_id: int,
        limit: int = 100,
    ) -> list[AuditLog]:
        """
        Get all actions performed by a specific user.

        Args:
            db: Database session
            user_id: ID of user
            limit: Maximum results

        Returns:
            List of audit logs for this user
        """
        return (
            db.query(AuditLog)
            .filter(AuditLog.user_id == user_id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_approval_chain(
        db: Session,
        entity_type: str,
        entity_id: int,
    ) -> list[Dict[str, Any]]:
        """
        Get the complete approval chain for an entity.

        Args:
            db: Database session
            entity_type: Type of entity (e.g., 'Request')
            entity_id: ID of entity

        Returns:
            List of approval-related actions with user and timestamp info
        """
        approval_actions = [
            AuditAction.REQUEST_APPROVED,
            AuditAction.REQUEST_REJECTED,
            AuditAction.NYUUSHA_APPROVED,
            AuditAction.CANDIDATE_APPROVED,
        ]

        logs = (
            db.query(AuditLog)
            .filter(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
                AuditLog.action.in_([str(a) for a in approval_actions]),
            )
            .order_by(AuditLog.timestamp.asc())
            .all()
        )

        result = []
        for log in logs:
            # Get user info
            user = db.query(User).filter(User.id == log.user_id).first()
            result.append({
                "action": log.action,
                "timestamp": log.timestamp,
                "user_id": log.user_id,
                "username": user.username if user else "Unknown",
                "description": log.description,
                "after_values": log.after_values,
            })

        return result

    @staticmethod
    def log_validation_error(
        db: Session,
        user_id: int,
        entity_type: str,
        entity_id: int,
        error_message: str,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Log validation errors for debugging and compliance.

        Args:
            db: Database session
            user_id: User who triggered the error
            entity_type: Type of entity
            entity_id: ID of entity
            error_message: Description of validation error
            ip_address: IP address

        Returns:
            Created AuditLog
        """
        return AuditService.log_action(
            db=db,
            action="validation_error",
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            description=f"Validation error: {error_message}",
            ip_address=ip_address,
            after_values={"error": error_message},
        )


# Singleton instance for convenience
audit_service = AuditService()
