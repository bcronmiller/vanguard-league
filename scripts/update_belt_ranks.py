#!/usr/bin/env python3
"""Update belt ranks for all players"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.player import Player
from app.core.config import settings

# Create database session
engine = create_engine(str(settings.DATABASE_URL))
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Belt rank mapping (name -> belt rank)
belt_ranks = {
    "Brian Cronmiller": "Black",
    "Alex Stewart": "Blue",
    "Hussain Samir": "Blue",
    "Josue Chevaz": "Blue",
    "Josh Rivera": "Blue",
    "Nick Newbold": "Blue",
    "Matt Crawford": "Brown",
    "John Michael": "Blue",
    "Edrees Saifi": "Blue",
    "Troy Wittman": "Black",
    "Christian Banghart": "Black"
}

# Brian's weight update
brian_weight = 250.0  # lbs

try:
    print("Updating belt ranks...")
    updated_count = 0

    for name, belt_rank in belt_ranks.items():
        # Try exact match first
        player = db.query(Player).filter(Player.name == name).first()

        # Try with leading asterisk (ghost players)
        if not player:
            player = db.query(Player).filter(Player.name == f"*{name}").first()

        if player:
            player.bjj_belt_rank = belt_rank
            print(f"✓ Updated {player.name}: {belt_rank} belt")

            # Update Brian's weight
            if "Brian" in player.name:
                player.weight = brian_weight
                print(f"  - Also updated weight to {brian_weight} lbs (Heavyweight)")

            updated_count += 1
        else:
            print(f"✗ Player not found: {name}")

    db.commit()
    print(f"\n✅ Successfully updated {updated_count} players")

    # Show summary
    print("\nCurrent player roster with belt ranks:")
    players = db.query(Player).order_by(Player.name).all()
    for p in players:
        weight_class = "Unknown"
        if p.weight:
            if p.weight < 170:
                weight_class = "Lightweight"
            elif p.weight < 185:
                weight_class = "Middleweight"
            else:
                weight_class = "Heavyweight"

        belt = p.bjj_belt_rank or "Unknown"
        weight_str = f"{p.weight} lbs" if p.weight else "No weight"
        print(f"  {p.name}: {belt} belt, {weight_str} ({weight_class})")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
