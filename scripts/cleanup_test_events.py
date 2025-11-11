#!/usr/bin/env python3
"""
Cleanup test events and all associated data
Removes events, entries, matches, brackets, rounds - everything from testing
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.event import Event
from app.models.entry import Entry
from app.models.match import Match
from app.models.bracket_format import BracketFormat
from app.models.bracket_round import BracketRound
from app.models.weigh_in import WeighIn

# Database connection
DATABASE_URL = "postgresql://vanguard:vanguard2025@localhost:5432/vanguard_league"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def cleanup_test_events():
    db = SessionLocal()

    try:
        # Read saved event IDs
        try:
            with open('/tmp/vanguard_test_event_ids.txt', 'r') as f:
                event_ids = [int(x) for x in f.read().strip().split(',')]
            print(f"\n📋 Found {len(event_ids)} test events to clean up")
        except FileNotFoundError:
            print("\n⚠️  No test event IDs found. Looking for events with 'TEST' in name...")
            test_events = db.query(Event).filter(Event.name.like('%TEST%')).all()
            event_ids = [e.id for e in test_events]

            if not event_ids:
                print("❌ No test events found to clean up!")
                return

        # Get event details before deletion
        events = db.query(Event).filter(Event.id.in_(event_ids)).all()

        print(f"\n🗑️  CLEANING UP TEST EVENTS:")
        print(f"{'='*60}")

        for event in events:
            print(f"\nEvent ID {event.id}: {event.name}")

            # Count what will be deleted
            entries_count = db.query(Entry).filter(Entry.event_id == event.id).count()
            matches_count = db.query(Match).filter(Match.event_id == event.id).count()
            brackets_count = db.query(BracketFormat).filter(BracketFormat.event_id == event.id).count()
            weighins_count = db.query(WeighIn).filter(WeighIn.event_id == event.id).count()

            # Get bracket rounds (through brackets)
            brackets = db.query(BracketFormat).filter(BracketFormat.event_id == event.id).all()
            rounds_count = 0
            for bracket in brackets:
                rounds_count += db.query(BracketRound).filter(BracketRound.bracket_format_id == bracket.id).count()

            print(f"  - {entries_count} entries")
            print(f"  - {matches_count} matches")
            print(f"  - {brackets_count} brackets")
            print(f"  - {rounds_count} rounds")
            print(f"  - {weighins_count} weigh-ins")

        # Confirm deletion
        print(f"\n{'='*60}")
        response = input("⚠️  Delete all this test data? (yes/no): ").strip().lower()

        if response != 'yes':
            print("❌ Cleanup cancelled")
            return

        # Delete in correct order (respecting foreign keys)
        deleted_counts = {
            'rounds': 0,
            'brackets': 0,
            'matches': 0,
            'entries': 0,
            'weighins': 0,
            'events': 0
        }

        for event_id in event_ids:
            # Delete rounds first (depend on brackets)
            brackets = db.query(BracketFormat).filter(BracketFormat.event_id == event_id).all()
            for bracket in brackets:
                rounds = db.query(BracketRound).filter(BracketRound.bracket_format_id == bracket.id).all()
                for round in rounds:
                    db.delete(round)
                    deleted_counts['rounds'] += 1

            # Delete brackets
            for bracket in brackets:
                db.delete(bracket)
                deleted_counts['brackets'] += 1

            # Delete matches
            matches = db.query(Match).filter(Match.event_id == event_id).all()
            for match in matches:
                db.delete(match)
                deleted_counts['matches'] += 1

            # Delete weigh-ins
            weighins = db.query(WeighIn).filter(WeighIn.event_id == event_id).all()
            for weighin in weighins:
                db.delete(weighin)
                deleted_counts['weighins'] += 1

            # Delete entries
            entries = db.query(Entry).filter(Entry.event_id == event_id).all()
            for entry in entries:
                db.delete(entry)
                deleted_counts['entries'] += 1

            # Delete event
            event = db.query(Event).filter(Event.id == event_id).first()
            if event:
                db.delete(event)
                deleted_counts['events'] += 1

        # Commit deletion
        db.commit()

        print(f"\n✅ CLEANUP COMPLETE!")
        print(f"{'='*60}")
        print(f"Deleted:")
        print(f"  - {deleted_counts['events']} events")
        print(f"  - {deleted_counts['entries']} entries")
        print(f"  - {deleted_counts['matches']} matches")
        print(f"  - {deleted_counts['brackets']} brackets")
        print(f"  - {deleted_counts['rounds']} rounds")
        print(f"  - {deleted_counts['weighins']} weigh-ins")

        # Remove saved IDs file
        try:
            os.remove('/tmp/vanguard_test_event_ids.txt')
            print(f"\n💾 Removed saved event IDs file")
        except:
            pass

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during cleanup: {e}")
        raise
    finally:
        db.close()

if __name__ == '__main__':
    cleanup_test_events()
