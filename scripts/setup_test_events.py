#!/usr/bin/env python3
"""
Setup test events for tournament format testing
Creates 3 events (one per weight class) with checked-in players
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import random

from app.models.event import Event
from app.models.entry import Entry
from app.models.player import Player
from app.models.weight_class import WeightClass

# Database connection
DATABASE_URL = "postgresql://vanguard:vanguard2025@localhost:5432/vanguard_league"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def setup_test_events():
    db = SessionLocal()

    try:
        # Get weight classes
        weight_classes = db.query(WeightClass).order_by(WeightClass.min_lbs).all()
        print(f"\nFound {len(weight_classes)} weight classes:")
        for wc in weight_classes:
            print(f"  - {wc.name}: {wc.min_lbs}-{wc.max_lbs} lbs")

        # Get all active players grouped by weight class
        players_by_wc = {}
        for wc in weight_classes:
            players = db.query(Player).filter(
                Player.active == True,
                Player.weight_class_id == wc.id
            ).all()
            players_by_wc[wc.id] = players
            print(f"\n{wc.name} players ({len(players)}):")
            for p in players:
                print(f"  - {p.name} ({p.bjj_belt_rank}, {p.weight} lbs)")

        # Create test events
        test_date = datetime.now() + timedelta(days=7)
        created_events = []

        for wc in weight_classes:
            players = players_by_wc[wc.id]

            if len(players) < 4:
                print(f"\n⚠️  Skipping {wc.name} - need at least 4 players (found {len(players)})")
                continue

            # Create event
            event = Event(
                name=f"TEST - {wc.name} Format Testing",
                date=test_date,
                venue="Local Test Environment"
            )
            db.add(event)
            db.flush()  # Get event ID

            print(f"\n✓ Created event: {event.name} (ID: {event.id})")

            # Randomly select 8 players (or all if less than 8)
            num_players = min(8, len(players))
            selected_players = random.sample(players, num_players)

            print(f"  Adding {num_players} players:")

            # Create entries and check them in
            for player in selected_players:
                entry = Entry(
                    event_id=event.id,
                    player_id=player.id,
                    weight_class_id=wc.id,
                    weight=player.weight,
                    belt_rank=player.bjj_belt_rank,
                    checked_in=True  # Auto check-in for testing
                )
                db.add(entry)
                print(f"    - {player.name} (✓ checked in)")

            created_events.append(event)

        # Commit everything
        db.commit()

        print(f"\n{'='*60}")
        print(f"✅ TEST EVENTS CREATED SUCCESSFULLY!")
        print(f"{'='*60}")
        print(f"\nCreated {len(created_events)} test events:")
        for event in created_events:
            entries = db.query(Entry).filter(Entry.event_id == event.id).count()
            print(f"  - Event ID {event.id}: {event.name}")
            print(f"    {entries} players checked in and ready")
            print(f"    URL: http://localhost:3000/events/{event.id}")

        print(f"\n📋 NEXT STEPS:")
        print(f"  1. Visit http://localhost:3000/events to see test events")
        print(f"  2. Click on each event and generate brackets")
        print(f"  3. Test different formats: Single Elim, Double Elim, Swiss, etc.")
        print(f"  4. Record match results and test round progression")
        print(f"  5. When done, run cleanup: python3 scripts/cleanup_test_events.py")

        # Save event IDs for cleanup
        event_ids = [e.id for e in created_events]
        with open('/tmp/vanguard_test_event_ids.txt', 'w') as f:
            f.write(','.join(map(str, event_ids)))
        print(f"\n💾 Event IDs saved to /tmp/vanguard_test_event_ids.txt for cleanup")

        return created_events

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == '__main__':
    setup_test_events()
