"""Add AI Budget table for spending controls

Revision ID: add_ai_budget
Revises: add_ai_usage_log
Create Date: 2025-11-16 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import date


# revision identifiers, used by Alembic.
revision = 'add_ai_budget'
down_revision = 'add_ai_usage_log'
branch_labels = None
depends_on = None


def upgrade():
    # Create ai_budgets table
    op.create_table(
        'ai_budgets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('monthly_budget_usd', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('daily_budget_usd', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('spent_this_month', sa.Numeric(precision=10, scale=4), nullable=False, server_default='0'),
        sa.Column('spent_today', sa.Numeric(precision=10, scale=4), nullable=False, server_default='0'),
        sa.Column('month_reset_date', sa.Date(), nullable=False),
        sa.Column('day_reset_date', sa.Date(), nullable=False),
        sa.Column('alert_threshold', sa.Integer(), nullable=False, server_default='80'),
        sa.Column('webhook_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint('monthly_budget_usd > 0', name='check_monthly_budget_positive'),
        sa.CheckConstraint('daily_budget_usd IS NULL OR daily_budget_usd > 0', name='check_daily_budget_positive'),
        sa.CheckConstraint('spent_this_month >= 0', name='check_spent_month_positive'),
        sa.CheckConstraint('spent_today >= 0', name='check_spent_today_positive'),
        sa.CheckConstraint('alert_threshold >= 0 AND alert_threshold <= 100', name='check_threshold_range'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_user_budget'),
    )

    # Create indexes
    op.create_index('ix_ai_budgets_user_id', 'ai_budgets', ['user_id'], unique=True)
    op.create_index('ix_ai_budgets_is_active', 'ai_budgets', ['is_active'], unique=False)
    op.create_index('ix_ai_budgets_month_reset_date', 'ai_budgets', ['month_reset_date'], unique=False)
    op.create_index('ix_ai_budgets_day_reset_date', 'ai_budgets', ['day_reset_date'], unique=False)


def downgrade():
    # Drop indexes
    op.drop_index('ix_ai_budgets_day_reset_date', table_name='ai_budgets')
    op.drop_index('ix_ai_budgets_month_reset_date', table_name='ai_budgets')
    op.drop_index('ix_ai_budgets_is_active', table_name='ai_budgets')
    op.drop_index('ix_ai_budgets_user_id', table_name='ai_budgets')

    # Drop table
    op.drop_table('ai_budgets')
