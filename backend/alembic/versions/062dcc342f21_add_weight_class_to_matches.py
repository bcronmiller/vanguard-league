"""add_weight_class_to_matches

Revision ID: 062dcc342f21
Revises: fa650c94ea64
Create Date: 2025-11-10 23:41:02.561146

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '062dcc342f21'
down_revision: Union[str, None] = 'fa650c94ea64'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add weight_class_id column to matches table
    op.add_column('matches', sa.Column('weight_class_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_matches_weight_class', 'matches', 'weight_classes', ['weight_class_id'], ['id'])


def downgrade() -> None:
    # Remove weight_class_id column from matches table
    op.drop_constraint('fk_matches_weight_class', 'matches', type_='foreignkey')
    op.drop_column('matches', 'weight_class_id')
