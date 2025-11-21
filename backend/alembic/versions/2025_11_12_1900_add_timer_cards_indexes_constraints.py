"""Add indexes and constraints to timer_cards table

Revision ID: 2025_11_12_1900
Revises: 002
Create Date: 2025-11-12 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_timer_cards_indexes'
down_revision = 'add_search_indexes'
branch_labels = None
depends_on = None


def upgrade():
    """Add strategic indexes and constraints to timer_cards table"""

    # ===== INDEXES =====
    # Individual indexes for common queries
    op.create_index('idx_timer_cards_hakenmoto_id', 'timer_cards', ['hakenmoto_id'])
    op.create_index('idx_timer_cards_work_date', 'timer_cards', ['work_date'])
    op.create_index('idx_timer_cards_employee_id', 'timer_cards', ['employee_id'])
    op.create_index('idx_timer_cards_is_approved', 'timer_cards', ['is_approved'])
    op.create_index('idx_timer_cards_factory_id', 'timer_cards', ['factory_id'])

    # Composite indexes for complex queries
    op.create_index(
        'idx_timer_cards_employee_work_date',
        'timer_cards',
        ['employee_id', 'work_date']
    )
    op.create_index(
        'idx_timer_cards_hakenmoto_work_date',
        'timer_cards',
        ['hakenmoto_id', 'work_date']
    )
    op.create_index(
        'idx_timer_cards_work_date_approved',
        'timer_cards',
        ['work_date', 'is_approved']
    )
    op.create_index(
        'idx_timer_cards_factory_work_date',
        'timer_cards',
        ['factory_id', 'work_date']
    )

    # ===== CONSTRAINTS =====
    # UNIQUE constraint: Prevent duplicate entries for same employee on same date
    op.create_unique_constraint(
        'uq_timer_cards_hakenmoto_work_date',
        'timer_cards',
        ['hakenmoto_id', 'work_date']
    )

    # CHECK constraints for data validation
    # 1. Break minutes should be non-negative and reasonable (0-180 minutes = 3 hours max)
    op.create_check_constraint(
        'ck_timer_cards_break_minutes_range',
        'timer_cards',
        'break_minutes >= 0 AND break_minutes <= 180'
    )

    # 2. Overtime minutes should be non-negative
    op.create_check_constraint(
        'ck_timer_cards_overtime_minutes_range',
        'timer_cards',
        'overtime_minutes >= 0'
    )

    # 3. Clock times: Regular shift (clock_in < clock_out) OR overnight shift
    # For overnight shifts: clock_in >= 20:00 AND clock_out <= 06:00
    op.create_check_constraint(
        'ck_timer_cards_clock_times_valid',
        'timer_cards',
        """
        (clock_in IS NULL OR clock_out IS NULL) OR
        (clock_in < clock_out) OR
        (clock_in >= '20:00:00'::time AND clock_out <= '06:00:00'::time)
        """
    )

    # 4. Approval logic: If approved, must have approved_by and approved_at
    op.create_check_constraint(
        'ck_timer_cards_approval_complete',
        'timer_cards',
        """
        (is_approved = false) OR
        (is_approved = true AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
        """
    )

    # 5. Calculated hours should be non-negative
    op.create_check_constraint(
        'ck_timer_cards_hours_non_negative',
        'timer_cards',
        """
        regular_hours >= 0 AND
        overtime_hours >= 0 AND
        night_hours >= 0 AND
        holiday_hours >= 0
        """
    )

    # 6. Work date should not be in the future (allow up to today)
    # Note: This uses PostgreSQL's CURRENT_DATE
    op.create_check_constraint(
        'ck_timer_cards_work_date_not_future',
        'timer_cards',
        'work_date <= CURRENT_DATE'
    )


def downgrade():
    """Remove indexes and constraints from timer_cards table"""

    # Remove constraints
    op.drop_constraint('ck_timer_cards_work_date_not_future', 'timer_cards', type_='check')
    op.drop_constraint('ck_timer_cards_hours_non_negative', 'timer_cards', type_='check')
    op.drop_constraint('ck_timer_cards_approval_complete', 'timer_cards', type_='check')
    op.drop_constraint('ck_timer_cards_clock_times_valid', 'timer_cards', type_='check')
    op.drop_constraint('ck_timer_cards_overtime_minutes_range', 'timer_cards', type_='check')
    op.drop_constraint('ck_timer_cards_break_minutes_range', 'timer_cards', type_='check')
    op.drop_constraint('uq_timer_cards_hakenmoto_work_date', 'timer_cards', type_='unique')

    # Remove composite indexes
    op.drop_index('idx_timer_cards_factory_work_date', table_name='timer_cards')
    op.drop_index('idx_timer_cards_work_date_approved', table_name='timer_cards')
    op.drop_index('idx_timer_cards_hakenmoto_work_date', table_name='timer_cards')
    op.drop_index('idx_timer_cards_employee_work_date', table_name='timer_cards')

    # Remove individual indexes
    op.drop_index('idx_timer_cards_factory_id', table_name='timer_cards')
    op.drop_index('idx_timer_cards_is_approved', table_name='timer_cards')
    op.drop_index('idx_timer_cards_employee_id', table_name='timer_cards')
    op.drop_index('idx_timer_cards_work_date', table_name='timer_cards')
    op.drop_index('idx_timer_cards_hakenmoto_id', table_name='timer_cards')
