"""add_belt_and_weight_to_entries

Revision ID: bc25c8685663
Revises: c4b4399033aa
Create Date: 2025-11-09 21:09:36.975430

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc25c8685663'
down_revision: Union[str, None] = 'c4b4399033aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add belt_rank and weight columns to entries table to snapshot at event time
    op.add_column('entries', sa.Column('belt_rank', sa.String(), nullable=True))
    op.add_column('entries', sa.Column('weight', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('entries', 'weight')
    op.drop_column('entries', 'belt_rank')
