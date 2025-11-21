"""Add AI Usage Log table for tracking API calls and costs

Revision ID: add_ai_usage_log
Revises: add_search_indexes
Create Date: 2025-11-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'add_ai_usage_log'
down_revision = 'add_search_indexes'
branch_labels = None
depends_on = None


def upgrade():
    # Create AIProvider enum if not exists
    ai_provider_enum = postgresql.ENUM(
        'gemini', 'openai', 'claude_api', 'local_cli',
        name='ai_provider',
        create_type=True
    )
    ai_provider_enum.create(op.get_bind(), checkfirst=True)

    # Create ai_usage_logs table
    op.create_table(
        'ai_usage_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider', ai_provider_enum, nullable=False),
        sa.Column('model', sa.String(100), nullable=False),
        sa.Column('prompt_tokens', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('completion_tokens', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('total_tokens', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('estimated_cost', sa.Numeric(precision=10, scale=4), nullable=False, server_default='0'),
        sa.Column('status', sa.String(20), nullable=False, server_default='success'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint('prompt_tokens >= 0', name='check_prompt_tokens_positive'),
        sa.CheckConstraint('completion_tokens >= 0', name='check_completion_tokens_positive'),
        sa.CheckConstraint('total_tokens >= 0', name='check_total_tokens_positive'),
        sa.CheckConstraint('estimated_cost >= 0', name='check_cost_positive'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_ai_usage_logs_user_id', 'ai_usage_logs', ['user_id'], unique=False)
    op.create_index('ix_ai_usage_logs_provider', 'ai_usage_logs', ['provider'], unique=False)
    op.create_index('ix_ai_usage_logs_status', 'ai_usage_logs', ['status'], unique=False)
    op.create_index('ix_ai_usage_logs_created_at', 'ai_usage_logs', ['created_at'], unique=False)

    # Composite index for common queries
    op.create_index('ix_ai_usage_logs_user_created', 'ai_usage_logs', ['user_id', 'created_at'], unique=False)


def downgrade():
    # Drop indexes
    op.drop_index('ix_ai_usage_logs_user_created', table_name='ai_usage_logs')
    op.drop_index('ix_ai_usage_logs_created_at', table_name='ai_usage_logs')
    op.drop_index('ix_ai_usage_logs_status', table_name='ai_usage_logs')
    op.drop_index('ix_ai_usage_logs_provider', table_name='ai_usage_logs')
    op.drop_index('ix_ai_usage_logs_user_id', table_name='ai_usage_logs')

    # Drop table
    op.drop_table('ai_usage_logs')

    # Drop enum
    ai_provider_enum = postgresql.ENUM(
        'gemini', 'openai', 'claude_api', 'local_cli',
        name='ai_provider'
    )
    ai_provider_enum.drop(op.get_bind(), checkfirst=True)
