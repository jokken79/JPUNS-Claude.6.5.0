"""add applicant_id to candidates

Revision ID: add_applicant_id_to_candidates
Revises: 2025_11_16_add_ai_budget_table
Create Date: 2025-11-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_applicant_id_to_candidates'
down_revision: Union[str, None] = '2025_11_16_add_ai_budget_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add applicant_id column to candidates table
    op.add_column('candidates', sa.Column('applicant_id', sa.String(length=50), nullable=True))

    # Create index for applicant_id
    op.create_index('ix_candidates_applicant_id', 'candidates', ['applicant_id'], unique=False)


def downgrade() -> None:
    # Drop index first
    op.drop_index('ix_candidates_applicant_id', table_name='candidates')

    # Drop column
    op.drop_column('candidates', 'applicant_id')
