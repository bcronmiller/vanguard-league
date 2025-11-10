"""add_rankade_ree_score

Revision ID: 501a88bdb199
Revises: ea4cdc392b91
Create Date: 2025-11-09 21:30:37.346478

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '501a88bdb199'
down_revision: Union[str, None] = 'ea4cdc392b91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add rankade_ree_score column to players table for reference only
    op.add_column('players', sa.Column('rankade_ree_score', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('players', 'rankade_ree_score')
