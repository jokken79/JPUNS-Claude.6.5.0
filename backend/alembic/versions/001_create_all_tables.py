"""Create all tables from models

Revision ID: 001
Revises:
Create Date: 2025-11-10 18:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables using SQLAlchemy Base.metadata"""
    # Import all models to ensure they're registered
    from app.models.models import Base

    # Create all tables
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    """Drop all tables"""
    # Import all models to ensure they're registered
    from app.models.models import Base

    # Drop all tables in reverse order
    Base.metadata.drop_all(bind=op.get_bind())
