"""
Model Mixins for UNS-ClaudeJP

This module contains reusable mixins for SQLAlchemy models.
"""

from sqlalchemy import Column, DateTime
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime


class SoftDeleteMixin:
    """
    Soft Delete Mixin for models.

    Adds soft delete capability with deleted_at timestamp and helper methods.
    Soft deleted records remain in the database for auditing but are excluded from normal queries.

    Usage:
        class MyModel(Base, SoftDeleteMixin):
            __tablename__ = "my_table"
            id = Column(Integer, primary_key=True)
            name = Column(String)

    Querying:
        # Get only active (non-deleted) records
        active_records = session.query(MyModel).filter(MyModel.deleted_at.is_(None)).all()

        # Get all records including deleted
        all_records = session.query(MyModel).all()

        # Soft delete a record
        record.soft_delete()
        session.commit()

        # Restore a deleted record
        record.restore()
        session.commit()
    """

    deleted_at = Column(DateTime, nullable=True, index=True, doc="Timestamp when record was soft deleted")

    @hybrid_property
    def is_deleted(self):
        """Check if record is soft deleted"""
        return self.deleted_at is not None

    def soft_delete(self):
        """Mark record as deleted with current timestamp"""
        self.deleted_at = datetime.now()

    def restore(self):
        """Restore soft deleted record"""
        self.deleted_at = None


def get_active_query(session, model):
    """
    Helper function to get query for active (non-deleted) records only.

    Args:
        session: SQLAlchemy session
        model: Model class with SoftDeleteMixin

    Returns:
        Query filtered to exclude soft deleted records

    Usage:
        active_candidates = get_active_query(session, Candidate).all()
        active_by_status = get_active_query(session, Candidate).filter(
            Candidate.status == 'approved'
        ).all()
    """
    return session.query(model).filter(model.deleted_at.is_(None))
