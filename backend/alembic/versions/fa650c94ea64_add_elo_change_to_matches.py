"""add_elo_change_to_matches

Revision ID: fa650c94ea64
Revises: 800bb7707cc7
Create Date: 2025-11-10 20:40:50.417948

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa650c94ea64'
down_revision: Union[str, None] = '800bb7707cc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add ELO change columns to matches table
    op.add_column('matches', sa.Column('a_elo_change', sa.Integer(), nullable=True))
    op.add_column('matches', sa.Column('b_elo_change', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove ELO change columns from matches table
    op.drop_column('matches', 'b_elo_change')
    op.drop_column('matches', 'a_elo_change')
