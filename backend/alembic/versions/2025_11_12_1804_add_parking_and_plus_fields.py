"""Add parking and initial_plus fields to apartments

Revision ID: 002
Revises: 001
Create Date: 2025-11-12 18:04:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = 'add_search_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add three new fields to apartments table:
    - parking_spaces: Number of available parking spaces
    - parking_price_per_unit: Price per parking space in yen
    - initial_plus: Additional initial rental fees (default 5000 yen)
    """
    # Add parking_spaces column
    op.add_column(
        'apartments',
        sa.Column('parking_spaces', sa.Integer(), nullable=True, comment='Number of available parking spaces')
    )
    
    # Add parking_price_per_unit column
    op.add_column(
        'apartments',
        sa.Column('parking_price_per_unit', sa.Integer(), nullable=True, comment='Price per parking space in yen')
    )
    
    # Add initial_plus column with default value of 5000
    op.add_column(
        'apartments',
        sa.Column('initial_plus', sa.Integer(), nullable=True, server_default='5000', comment='Additional initial rental fees in yen')
    )


def downgrade() -> None:
    """
    Remove parking and initial_plus fields from apartments table
    """
    # Remove columns in reverse order
    op.drop_column('apartments', 'initial_plus')
    op.drop_column('apartments', 'parking_price_per_unit')
    op.drop_column('apartments', 'parking_spaces')
