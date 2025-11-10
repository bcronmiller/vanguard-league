#!/usr/bin/env python3
"""
Update academy affiliations for all players.

Everyone is VanGuard Gym except Matt Crawford (MMA).
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/backend')

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.player import Player


def update_academies(db: Session):
    """Update academy affiliations for all players"""
    print("\n=== Updating Player Academies ===\n")

    # Get all active players
    players = db.query(Player).filter(Player.active == True).all()

    updated = 0
    for player in players:
        # Matt Crawford goes to MMA, everyone else to VanGuard Gym
        if "Matt Crawford" in player.name or "Crawford" in player.name:
            player.academy = "MMA"
        else:
            player.academy = "VanGuard Gym"

        print(f"{player.name:<45} → {player.academy}")
        updated += 1

    db.commit()
    print(f"\n✅ Updated {updated} players with academy affiliations")


if __name__ == "__main__":
    db = next(get_db())

    try:
        update_academies(db)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
