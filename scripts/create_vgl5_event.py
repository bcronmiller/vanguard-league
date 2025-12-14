#!/usr/bin/env python3
"""
Ensure the VGL 5 event exists and is set to check-in status.

- Creates or updates the event with the official date/time and venue
- Marks status as CHECK_IN so the admin UI shows it as ready
- Registers all active fighters as entries (unchecked)
"""

import sys
from datetime import datetime, time
from pathlib import Path

# Make backend code importable
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402
from app.models.entry import Entry  # noqa: E402
from app.models.event import Event, EventStatus  # noqa: E402
from app.models.player import Player  # noqa: E402

EVENT_NAME = "VGL Season 1 Finale (Ep 5)"
EVENT_DATE = datetime(2025, 12, 13, 12, 0, 0)
VENUE = "9414 Center Point Ln, Manassas, VA 20110"
FIGHTER_ARRIVAL = time(11, 30)
EVENT_START = time(12, 0)


def ensure_event(db: Session) -> tuple[Event, bool]:
    """Create the event if missing, otherwise update its metadata."""
    event = db.query(Event).filter(Event.name == EVENT_NAME).first()
    created = False

    if not event:
        event = Event(
            name=EVENT_NAME,
            date=EVENT_DATE,
            venue=VENUE,
            status=EventStatus.CHECK_IN,
            fighter_arrival_time=FIGHTER_ARRIVAL,
            event_start_time=EVENT_START,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        created = True
    else:
        event.date = EVENT_DATE
        event.venue = VENUE
        event.status = EventStatus.CHECK_IN
        event.fighter_arrival_time = FIGHTER_ARRIVAL
        event.event_start_time = EVENT_START
        db.commit()
        db.refresh(event)

    return event, created


def ensure_entries(db: Session, event_id: int) -> tuple[int, int]:
    """Register all active fighters for the event (unchecked)."""
    active_fighters = db.query(Player).filter(Player.active == True).all()  # noqa: E712
    added = 0

    for fighter in active_fighters:
        existing = db.query(Entry).filter(
            Entry.event_id == event_id,
            Entry.player_id == fighter.id,
        ).first()

        if existing:
            continue

        entry = Entry(
            event_id=event_id,
            player_id=fighter.id,
            weight_class_id=fighter.weight_class_id,
            checked_in=False,
        )
        db.add(entry)
        added += 1

    db.commit()
    return added, len(active_fighters)


def main():
    db = SessionLocal()
    try:
        event, created = ensure_event(db)
        added, total = ensure_entries(db, event.id)

        print("\n✅ VGL 5 is ready for check-ins")
        print(f"Event ID: {event.id}")
        print(f"Created new event: {created}")
        print(f"Status: {event.status.value}")
        print(f"Venue: {event.venue}")
        print(f"Date/Time: {event.date.isoformat()}")
        print(f"Arrival: {event.fighter_arrival_time}, Start: {event.event_start_time}")
        print(f"Entries added: {added}/{total} active fighters")
        print(f"Check-in URL: http://localhost:3000/events/{event.id}/checkin")
        print(f"Brackets URL: http://localhost:3000/events/{event.id}/brackets")
    finally:
        db.close()


if __name__ == "__main__":
    main()
