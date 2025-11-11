#!/usr/bin/env python3
"""Check Josue's Entry record and weight class assignment"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import SessionLocal
from app.models.player import Player
from app.models.entry import Entry
from app.models.weight_class import WeightClass

def main():
    db = SessionLocal()
    try:
        # Find Josue
        josue = db.query(Player).filter(Player.name.like('%Josue%')).first()
        if not josue:
            print("Josue not found!")
            return

        print(f"Player: {josue.name} (ID: {josue.id})")
        print(f"  Weight: {josue.weight} lbs")
        print(f"  Player weight_class_id: {josue.weight_class_id}")

        # Get weight class name
        if josue.weight_class_id:
            wc = db.query(WeightClass).filter(WeightClass.id == josue.weight_class_id).first()
            print(f"  Player weight class: {wc.name if wc else 'Unknown'}")

        print("\nEntry records for VGL 1 (event_id=1):")
        entries = db.query(Entry).filter(Entry.player_id == josue.id, Entry.event_id == 1).all()

        for entry in entries:
            wc = db.query(WeightClass).filter(WeightClass.id == entry.weight_class_id).first()
            print(f"  Entry ID: {entry.id}")
            print(f"    weight_class_id: {entry.weight_class_id}")
            print(f"    weight_class name: {wc.name if wc else 'Unknown'}")
            print(f"    weight at entry: {entry.weight}")

        print("\nAll weight classes:")
        weight_classes = db.query(WeightClass).all()
        for wc in weight_classes:
            print(f"  {wc.id}: {wc.name} (min: {wc.min_lbs}, max: {wc.max_lbs})")

    finally:
        db.close()

if __name__ == "__main__":
    main()
