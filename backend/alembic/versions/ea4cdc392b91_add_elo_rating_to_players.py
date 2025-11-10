"""add_elo_rating_to_players

Revision ID: ea4cdc392b91
Revises: bc25c8685663
Create Date: 2025-11-09 21:26:41.556369

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ea4cdc392b91'
down_revision: Union[str, None] = 'bc25c8685663'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add elo_rating column to players table
    op.add_column('players', sa.Column('elo_rating', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('players', 'elo_rating')
