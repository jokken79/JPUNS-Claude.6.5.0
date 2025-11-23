"""Create all tables from models

Revision ID: 001
Revises:
Create Date: 2025-11-10 18:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all enum types first, then create tables"""

    # Import enum classes from models
    from app.models.models import (
        UserRole,
        CandidateStatus,
        InterviewResult,
        DocumentType,
        RequestType,
        RequestStatus,
        YukyuStatus,
        ShiftType,
        RoomType,
        ApartmentStatus,
        AssignmentStatus,
        ChargeType,
        DeductionStatus,
        AdminActionType,
        ResourceType,
        AIProvider,
        Base
    )

    # Create PostgreSQL enum types explicitly BEFORE creating tables
    # This prevents "invalid input value for enum" errors

    # UserRole enum
    user_role_enum = postgresql.ENUM(
        'SUPER_ADMIN', 'ADMIN', 'KEITOSAN', 'TANTOSHA', 'COORDINATOR',
        'KANRININSHA', 'EMPLOYEE', 'CONTRACT_WORKER',
        name='user_role',
        create_type=False
    )
    user_role_enum.create(op.get_bind(), checkfirst=True)

    # CandidateStatus enum (not currently used in tables but defined in models)
    candidate_status_enum = postgresql.ENUM(
        'pending', 'approved', 'rejected', 'hired',
        name='candidate_status',
        create_type=False
    )
    candidate_status_enum.create(op.get_bind(), checkfirst=True)

    # InterviewResult enum
    interview_result_enum = postgresql.ENUM(
        'passed', 'failed', 'pending',
        name='interviewresult',
        create_type=False
    )
    interview_result_enum.create(op.get_bind(), checkfirst=True)

    # DocumentType enum
    document_type_enum = postgresql.ENUM(
        'rirekisho', 'zairyu_card', 'license', 'contract', 'other',
        name='document_type',
        create_type=False
    )
    document_type_enum.create(op.get_bind(), checkfirst=True)

    # RequestType enum
    request_type_enum = postgresql.ENUM(
        'yukyu', 'hankyu', 'ikkikokoku', 'taisha', 'nyuusha',
        name='request_type',
        create_type=False
    )
    request_type_enum.create(op.get_bind(), checkfirst=True)

    # RequestStatus enum
    request_status_enum = postgresql.ENUM(
        'pending', 'approved', 'rejected', 'completed',
        name='request_status',
        create_type=False
    )
    request_status_enum.create(op.get_bind(), checkfirst=True)

    # YukyuStatus enum
    yukyu_status_enum = postgresql.ENUM(
        'active', 'expired',
        name='yukyu_status',
        create_type=False
    )
    yukyu_status_enum.create(op.get_bind(), checkfirst=True)

    # ShiftType enum
    shift_type_enum = postgresql.ENUM(
        'asa', 'hiru', 'yoru', 'other',
        name='shift_type',
        create_type=False
    )
    shift_type_enum.create(op.get_bind(), checkfirst=True)

    # RoomType enum
    room_type_enum = postgresql.ENUM(
        '1K', '1DK', '1LDK', '2K', '2DK', '2LDK', '3LDK', 'studio', 'other',
        name='room_type',
        create_type=False
    )
    room_type_enum.create(op.get_bind(), checkfirst=True)

    # ApartmentStatus enum
    apartment_status_enum = postgresql.ENUM(
        'active', 'inactive', 'maintenance', 'reserved',
        name='apartment_status',
        create_type=False
    )
    apartment_status_enum.create(op.get_bind(), checkfirst=True)

    # AssignmentStatus enum
    assignment_status_enum = postgresql.ENUM(
        'active', 'ended', 'cancelled', 'transferred',
        name='assignment_status',
        create_type=False
    )
    assignment_status_enum.create(op.get_bind(), checkfirst=True)

    # ChargeType enum
    charge_type_enum = postgresql.ENUM(
        'cleaning', 'repair', 'deposit', 'penalty', 'key_replacement', 'other',
        name='charge_type',
        create_type=False
    )
    charge_type_enum.create(op.get_bind(), checkfirst=True)

    # DeductionStatus enum
    deduction_status_enum = postgresql.ENUM(
        'pending', 'processed', 'paid', 'cancelled',
        name='deduction_status',
        create_type=False
    )
    deduction_status_enum.create(op.get_bind(), checkfirst=True)

    # AdminActionType enum
    admin_action_type_enum = postgresql.ENUM(
        'PAGE_VISIBILITY_CHANGE', 'ROLE_PERMISSION_CHANGE', 'BULK_OPERATION',
        'CONFIG_CHANGE', 'CACHE_CLEAR', 'USER_MANAGEMENT', 'SYSTEM_SETTINGS',
        name='admin_action_type',
        create_type=False
    )
    admin_action_type_enum.create(op.get_bind(), checkfirst=True)

    # ResourceType enum
    resource_type_enum = postgresql.ENUM(
        'PAGE', 'ROLE', 'SYSTEM', 'USER', 'PERMISSION',
        name='resource_type',
        create_type=False
    )
    resource_type_enum.create(op.get_bind(), checkfirst=True)

    # AIProvider enum
    ai_provider_enum = postgresql.ENUM(
        'gemini', 'openai', 'claude_api', 'local_cli',
        name='ai_provider',
        create_type=False
    )
    ai_provider_enum.create(op.get_bind(), checkfirst=True)

    # Now create all tables - enums are already created and available
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    """Drop all tables and enum types"""

    # Import all models to ensure they're registered
    from app.models.models import Base

    # Drop all tables first
    Base.metadata.drop_all(bind=op.get_bind())

    # Drop all enum types in reverse order
    op.execute('DROP TYPE IF EXISTS ai_provider CASCADE')
    op.execute('DROP TYPE IF EXISTS resource_type CASCADE')
    op.execute('DROP TYPE IF EXISTS admin_action_type CASCADE')
    op.execute('DROP TYPE IF EXISTS deduction_status CASCADE')
    op.execute('DROP TYPE IF EXISTS charge_type CASCADE')
    op.execute('DROP TYPE IF EXISTS assignment_status CASCADE')
    op.execute('DROP TYPE IF EXISTS apartment_status CASCADE')
    op.execute('DROP TYPE IF EXISTS room_type CASCADE')
    op.execute('DROP TYPE IF EXISTS shift_type CASCADE')
    op.execute('DROP TYPE IF EXISTS yukyu_status CASCADE')
    op.execute('DROP TYPE IF EXISTS request_status CASCADE')
    op.execute('DROP TYPE IF EXISTS request_type CASCADE')
    op.execute('DROP TYPE IF EXISTS document_type CASCADE')
    op.execute('DROP TYPE IF EXISTS interviewresult CASCADE')
    op.execute('DROP TYPE IF EXISTS candidate_status CASCADE')
    op.execute('DROP TYPE IF EXISTS user_role CASCADE')
