"""add_academy_field

Revision ID: 112b01734ba2
Revises: 501a88bdb199
Create Date: 2025-11-09 21:38:10.567359

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '112b01734ba2'
down_revision: Union[str, None] = '501a88bdb199'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add academy column to players table for gym/academy affiliation
    op.add_column('players', sa.Column('academy', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('players', 'academy')
