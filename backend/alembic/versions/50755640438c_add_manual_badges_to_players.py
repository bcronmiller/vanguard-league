"""add_manual_badges_to_players

Revision ID: 50755640438c
Revises: 781120c01863
Create Date: 2025-11-11 18:45:21.250359

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50755640438c'
down_revision: Union[str, None] = '781120c01863'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add manual_badges JSON field to players table
    op.add_column('players', sa.Column('manual_badges', sa.JSON(), nullable=True, server_default='[]'))


def downgrade() -> None:
    # Remove manual_badges field
    op.drop_column('players', 'manual_badges')
