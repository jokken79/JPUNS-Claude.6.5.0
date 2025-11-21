"""Remove redundant employee_id column from timer_cards

Revision ID: 2025_11_12_2000
Revises: 2025_11_12_1900
Create Date: 2025-11-12 20:00:00.000000

This migration removes the redundant employee_id column from timer_cards table.
The hakenmoto_id column should be used instead as it has proper FK constraints.

Changes:
- Drop composite index idx_timer_cards_employee_work_date
- Drop individual index idx_timer_cards_employee_id
- Drop column employee_id

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2025_11_12_2000'
down_revision = 'add_timer_cards_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Remove redundant employee_id column and its indexes"""

    # Drop composite index that includes employee_id
    op.drop_index('idx_timer_cards_employee_work_date', table_name='timer_cards')

    # Drop individual index on employee_id
    op.drop_index('idx_timer_cards_employee_id', table_name='timer_cards')

    # Drop the redundant employee_id column
    op.drop_column('timer_cards', 'employee_id')


def downgrade() -> None:
    """Restore employee_id column and its indexes"""

    # Restore the employee_id column
    op.add_column('timer_cards',
                  sa.Column('employee_id', sa.Integer(), nullable=True))

    # Recreate individual index
    op.create_index('idx_timer_cards_employee_id', 'timer_cards', ['employee_id'])

    # Recreate composite index
    op.create_index('idx_timer_cards_employee_work_date', 'timer_cards',
                    ['employee_id', 'work_date'])
