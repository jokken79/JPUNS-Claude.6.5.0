"""add admin audit log table for permission tracking

Revision ID: 2025_11_12_2100
Revises: 642bced75435
Create Date: 2025-11-12 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2025_11_12_2100'
down_revision: Union[str, None] = '2025_11_12_2015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enums for AdminActionType and ResourceType
    admin_action_type_enum = postgresql.ENUM(
        'PAGE_VISIBILITY_CHANGE',
        'ROLE_PERMISSION_CHANGE',
        'BULK_OPERATION',
        'CONFIG_CHANGE',
        'CACHE_CLEAR',
        'USER_MANAGEMENT',
        'SYSTEM_SETTINGS',
        name='adminactiontype',
        create_type=True
    )
    admin_action_type_enum.create(op.get_bind(), checkfirst=True)

    resource_type_enum = postgresql.ENUM(
        'PAGE',
        'ROLE',
        'SYSTEM',
        'USER',
        'PERMISSION',
        name='resourcetype',
        create_type=True
    )
    resource_type_enum.create(op.get_bind(), checkfirst=True)

    # Create admin_audit_logs table
    op.create_table(
        'admin_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_user_id', sa.Integer(), nullable=False),
        sa.Column('action_type', sa.Enum(
            'PAGE_VISIBILITY_CHANGE',
            'ROLE_PERMISSION_CHANGE',
            'BULK_OPERATION',
            'CONFIG_CHANGE',
            'CACHE_CLEAR',
            'USER_MANAGEMENT',
            'SYSTEM_SETTINGS',
            name='adminactiontype'
        ), nullable=False),
        sa.Column('resource_type', sa.Enum(
            'PAGE',
            'ROLE',
            'SYSTEM',
            'USER',
            'PERMISSION',
            name='resourcetype'
        ), nullable=False),
        sa.Column('resource_key', sa.String(length=255), nullable=True),
        sa.Column('previous_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['admin_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(op.f('ix_admin_audit_logs_id'), 'admin_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_admin_user_id'), 'admin_audit_logs', ['admin_user_id'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_action_type'), 'admin_audit_logs', ['action_type'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_resource_type'), 'admin_audit_logs', ['resource_type'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_resource_key'), 'admin_audit_logs', ['resource_key'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_created_at'), 'admin_audit_logs', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_admin_audit_logs_created_at'), table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_resource_key'), table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_resource_type'), table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_action_type'), table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_admin_user_id'), table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_id'), table_name='admin_audit_logs')

    # Drop table
    op.drop_table('admin_audit_logs')

    # Drop enums
    sa.Enum(name='adminactiontype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='resourcetype').drop(op.get_bind(), checkfirst=True)
