"""add tax and insurance rates to payroll_settings

Revision ID: add_tax_rates_payroll
Revises: 43b6cf501eed
Create Date: 2025-11-12 19:00:00.000000

This migration adds tax and insurance rate fields to the payroll_settings table:
- income_tax_rate (所得税)
- resident_tax_rate (住民税)
- health_insurance_rate (健康保険)
- pension_rate (厚生年金)
- employment_insurance_rate (雇用保険)
- updated_by_id (audit field)

These fields enable dynamic configuration of tax and insurance rates
from the database, replacing hardcoded values in the codebase.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_tax_rates_payroll'
down_revision = '43b6cf501eed'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add tax and insurance rate columns to payroll_settings table.

    Default values based on Japanese labor law and common practices:
    - Income tax: 10.0%
    - Resident tax: 5.0%
    - Health insurance: 4.75%
    - Pension: 10.0%
    - Employment insurance: 0.3%
    """
    # Add income tax rate (所得税率)
    op.add_column(
        'payroll_settings',
        sa.Column(
            'income_tax_rate',
            sa.Numeric(precision=5, scale=2),
            nullable=False,
            server_default='10.0'
        )
    )

    # Add resident tax rate (住民税率)
    op.add_column(
        'payroll_settings',
        sa.Column(
            'resident_tax_rate',
            sa.Numeric(precision=5, scale=2),
            nullable=False,
            server_default='5.0'
        )
    )

    # Add health insurance rate (健康保険率)
    op.add_column(
        'payroll_settings',
        sa.Column(
            'health_insurance_rate',
            sa.Numeric(precision=5, scale=2),
            nullable=False,
            server_default='4.75'
        )
    )

    # Add pension insurance rate (厚生年金率)
    op.add_column(
        'payroll_settings',
        sa.Column(
            'pension_rate',
            sa.Numeric(precision=5, scale=2),
            nullable=False,
            server_default='10.0'
        )
    )

    # Add employment insurance rate (雇用保険率)
    op.add_column(
        'payroll_settings',
        sa.Column(
            'employment_insurance_rate',
            sa.Numeric(precision=5, scale=2),
            nullable=False,
            server_default='0.3'
        )
    )

    # Add updated_by_id for audit tracking
    op.add_column(
        'payroll_settings',
        sa.Column(
            'updated_by_id',
            sa.Integer(),
            nullable=True
        )
    )

    # Create foreign key constraint to users table
    op.create_foreign_key(
        'fk_payroll_settings_updated_by',
        'payroll_settings',
        'users',
        ['updated_by_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Create index on updated_by_id for better query performance
    op.create_index(
        'ix_payroll_settings_updated_by_id',
        'payroll_settings',
        ['updated_by_id']
    )


def downgrade() -> None:
    """
    Remove tax and insurance rate columns from payroll_settings table.

    This rollback operation removes all the columns added in the upgrade.
    WARNING: This will cause data loss for these fields!
    """
    # Drop index first
    op.drop_index('ix_payroll_settings_updated_by_id', table_name='payroll_settings')

    # Drop foreign key constraint
    op.drop_constraint('fk_payroll_settings_updated_by', 'payroll_settings', type_='foreignkey')

    # Drop columns in reverse order
    op.drop_column('payroll_settings', 'updated_by_id')
    op.drop_column('payroll_settings', 'employment_insurance_rate')
    op.drop_column('payroll_settings', 'pension_rate')
    op.drop_column('payroll_settings', 'health_insurance_rate')
    op.drop_column('payroll_settings', 'resident_tax_rate')
    op.drop_column('payroll_settings', 'income_tax_rate')
