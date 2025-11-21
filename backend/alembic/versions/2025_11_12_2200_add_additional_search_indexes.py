"""Add additional search indexes for performance optimization

Revision ID: add_additional_indexes
Revises: 2025_11_12_2015_add_timer_card_consistency_triggers
Create Date: 2025-11-12 22:00:00.000000

This migration adds search indexes for frequently queried fields across multiple tables
to improve query performance, especially for searches with 1M+ records.

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_additional_indexes'
down_revision = '2025_11_12_2100'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add search indexes for performance optimization.

    Indexes are added for:
    - Factories: Frequently searched and filtered fields
    - Timer Cards: Date ranges and employee lookups
    - Users: Email and username lookups
    - Requests: Status and employee filters
    - Salary Calculations: Month/year and employee lookups
    """

    # ===== FACTORIES TABLE =====
    # Index for factory name search
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_factory_name_trgm
        ON factories USING gin (name gin_trgm_ops)
    """)

    # Index for factory code (unique identifier)
    op.create_index(
        'idx_factory_code',
        'factories',
        ['code'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Index for active factories (excluding deleted)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_factory_active
        ON factories(is_active)
        WHERE deleted_at IS NULL
    """)

    # ===== TIMER_CARDS TABLE =====
    # Composite index for employee + date range queries
    op.create_index(
        'idx_timer_card_employee_date',
        'timer_cards',
        ['employee_id', 'work_date'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Index for work_date for date range filtering
    op.create_index(
        'idx_timer_card_work_date',
        'timer_cards',
        ['work_date'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Index for status filtering
    op.create_index(
        'idx_timer_card_status',
        'timer_cards',
        ['status'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Composite index for factory + date range
    op.create_index(
        'idx_timer_card_factory_date',
        'timer_cards',
        ['factory_id', 'work_date'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # ===== USERS TABLE =====
    # Index for email lookups (duplicate checking, login)
    op.create_index(
        'idx_user_email',
        'users',
        ['email'],
        unique=True,
        postgresql_if_not_exists=True
    )

    # Index for username lookups (login)
    op.create_index(
        'idx_user_username',
        'users',
        ['username'],
        unique=True,
        postgresql_if_not_exists=True
    )

    # Index for role filtering
    op.create_index(
        'idx_user_role',
        'users',
        ['role'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Index for active users
    op.create_index(
        'idx_user_active',
        'users',
        ['is_active'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # ===== REQUESTS TABLE =====
    # Index for employee_id lookups
    op.create_index(
        'idx_request_employee_id',
        'requests',
        ['employee_id'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Index for status filtering
    op.create_index(
        'idx_request_status',
        'requests',
        ['status'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Index for request_type filtering
    op.create_index(
        'idx_request_type',
        'requests',
        ['request_type'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Composite index for employee + status
    op.create_index(
        'idx_request_employee_status',
        'requests',
        ['employee_id', 'status'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Index for created_at (for sorting and date filtering)
    op.create_index(
        'idx_request_created_at',
        'requests',
        ['created_at'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # ===== SALARY_CALCULATIONS TABLE =====
    # Composite index for employee + month/year
    op.create_index(
        'idx_salary_employee_month_year',
        'salary_calculations',
        ['employee_id', 'calculation_month', 'calculation_year'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Index for calculation_month
    op.create_index(
        'idx_salary_calculation_month',
        'salary_calculations',
        ['calculation_month'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Index for calculation_year
    op.create_index(
        'idx_salary_calculation_year',
        'salary_calculations',
        ['calculation_year'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # ===== APARTMENTS TABLE =====
    # Index for apartment_number
    op.create_index(
        'idx_apartment_number',
        'apartments',
        ['apartment_number'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Index for is_occupied
    op.create_index(
        'idx_apartment_occupied',
        'apartments',
        ['is_occupied'],
        unique=False,
        postgresql_if_not_exists=True
    )

    # Partial index for available apartments
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_apartment_available
        ON apartments(is_occupied)
        WHERE is_occupied = false AND deleted_at IS NULL
    """)


def downgrade():
    """Remove all added indexes."""

    # Factories
    op.execute("DROP INDEX IF EXISTS idx_factory_name_trgm")
    op.drop_index('idx_factory_code', table_name='factories', if_exists=True)
    op.execute("DROP INDEX IF EXISTS idx_factory_active")

    # Timer Cards
    op.drop_index('idx_timer_card_employee_date', table_name='timer_cards', if_exists=True)
    op.drop_index('idx_timer_card_work_date', table_name='timer_cards', if_exists=True)
    op.drop_index('idx_timer_card_status', table_name='timer_cards', if_exists=True)
    op.drop_index('idx_timer_card_factory_date', table_name='timer_cards', if_exists=True)

    # Users
    op.drop_index('idx_user_email', table_name='users', if_exists=True)
    op.drop_index('idx_user_username', table_name='users', if_exists=True)
    op.drop_index('idx_user_role', table_name='users', if_exists=True)
    op.drop_index('idx_user_active', table_name='users', if_exists=True)

    # Requests
    op.drop_index('idx_request_employee_id', table_name='requests', if_exists=True)
    op.drop_index('idx_request_status', table_name='requests', if_exists=True)
    op.drop_index('idx_request_type', table_name='requests', if_exists=True)
    op.drop_index('idx_request_employee_status', table_name='requests', if_exists=True)
    op.drop_index('idx_request_created_at', table_name='requests', if_exists=True)

    # Salary Calculations
    op.drop_index('idx_salary_employee_month_year', table_name='salary_calculations', if_exists=True)
    op.drop_index('idx_salary_calculation_month', table_name='salary_calculations', if_exists=True)
    op.drop_index('idx_salary_calculation_year', table_name='salary_calculations', if_exists=True)

    # Apartments
    op.drop_index('idx_apartment_number', table_name='apartments', if_exists=True)
    op.drop_index('idx_apartment_occupied', table_name='apartments', if_exists=True)
    op.execute("DROP INDEX IF EXISTS idx_apartment_available")
