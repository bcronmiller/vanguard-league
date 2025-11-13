"""Add initial_p4p_elo column to players

Revision ID: 51ac8b77e894
Revises: 50755640438c
Create Date: 2025-11-13 21:04:44.450050

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '51ac8b77e894'
down_revision: Union[str, None] = '50755640438c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add initial_p4p_elo column
    op.add_column('players', sa.Column('initial_p4p_elo', sa.Float(), nullable=True))

    # Populate with belt-based starting ELO for existing players
    # Belt ELO map: White=1200, Blue=1400, Purple=1600, Brown=1800, Black=2000
    op.execute("""
        UPDATE players
        SET initial_p4p_elo = CASE
            WHEN bjj_belt_rank = 'White' THEN 1200
            WHEN bjj_belt_rank = 'Blue' THEN 1400
            WHEN bjj_belt_rank = 'Purple' THEN 1600
            WHEN bjj_belt_rank = 'Brown' THEN 1800
            WHEN bjj_belt_rank = 'Black' THEN 2000
            ELSE 1400  -- Default to Blue belt baseline
        END
        WHERE initial_p4p_elo IS NULL
    """)


def downgrade() -> None:
    op.drop_column('players', 'initial_p4p_elo')
