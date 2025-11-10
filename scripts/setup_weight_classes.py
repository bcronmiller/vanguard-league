#!/usr/bin/env python3
"""
Setup weight classes and update player weights
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.player import Player
from app.models.weight_class import WeightClass


def setup_weight_classes(db: Session):
    """Create weight classes"""
    print("Creating weight classes...")

    # Check if weight classes already exist
    existing = db.query(WeightClass).all()
    if existing:
        print(f"Found {len(existing)} existing weight classes. Deleting...")
        for wc in existing:
            db.delete(wc)
        db.commit()

    # Create new weight classes
    weight_classes = [
        WeightClass(
            name="Lightweight",
            min_lbs=0,
            max_lbs=170
        ),
        WeightClass(
            name="Middleweight",
            min_lbs=170,
            max_lbs=185
        ),
        WeightClass(
            name="Heavyweight",
            min_lbs=185,
            max_lbs=None  # No upper limit
        )
    ]

    for wc in weight_classes:
        db.add(wc)

    db.commit()
    print(f"✅ Created {len(weight_classes)} weight classes")

    return weight_classes


def update_player_weights(db: Session):
    """Update player weights based on event data"""
    print("\nUpdating player weights...")

    # Weight data from user
    player_weights = {
        "Alex Stewart": 149.7,
        "*Alex Stewart": 149.7,  # Handle ghost player prefix
        "Hussain": 167.8,
        "*Hussain Samir": 167.8,
        "Hussain Samir": 167.8,
        "Josue": 194.9,
        "*Josue Chevaz": 194.9,
        "Josue Chevaz": 194.9,
        "Josh Rivera": 156.1,
        "*Josh Rivera": 156.1,
        "Nick Newbold": 206.6,
        "*Nick Newbold": 206.6,
        "Matt Crawford": 259,
        "*Matt Crawford": 259,
        "JM": 156,
        "*John Michael": 156,  # Assuming JM is John Michael
        "John Michael": 156,
        "Edrees": 207,
        "*Edrees": 207,
        "Edress": 207,  # Alternative spelling
        "*Edress": 207,
        "Troy": 215,
        "*Troy Wittman": 215,
        "Troy Wittman": 215,
        "Christian": 203,
        "*Christian Banghart": 203,
        "Christian Banghart": 203,
    }

    # Get weight classes
    lightweight = db.query(WeightClass).filter_by(name="Lightweight").first()
    middleweight = db.query(WeightClass).filter_by(name="Middleweight").first()
    heavyweight = db.query(WeightClass).filter_by(name="Heavyweight").first()

    # Update players
    players = db.query(Player).all()
    updated_count = 0

    for player in players:
        # Check if we have weight data for this player
        weight = None
        for name_variant, w in player_weights.items():
            if name_variant.lower() in player.name.lower() or player.name.lower() in name_variant.lower():
                weight = w
                break

        if weight:
            player.weight = weight

            # Assign weight class
            if weight < 170:
                player.weight_class_id = lightweight.id
                wc_name = "Lightweight"
            elif weight < 185:
                player.weight_class_id = middleweight.id
                wc_name = "Middleweight"
            else:
                player.weight_class_id = heavyweight.id
                wc_name = "Heavyweight"

            print(f"  ✅ {player.name}: {weight} lbs → {wc_name}")
            updated_count += 1

    db.commit()
    print(f"\n✅ Updated {updated_count} players with weights and weight classes")


def main():
    db = SessionLocal()
    try:
        # Setup weight classes
        setup_weight_classes(db)

        # Update player weights
        update_player_weights(db)

        print("\n🎉 Weight class setup complete!")

    finally:
        db.close()


if __name__ == "__main__":
    main()
