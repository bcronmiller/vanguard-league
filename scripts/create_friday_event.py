#!/usr/bin/env python3
"""
Create an event for Friday
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.event import Event, EventStatus


def create_friday_event(db: Session):
    """Create Friday's event"""
    # Get next Friday
    today = datetime.now()
    days_until_friday = (4 - today.weekday()) % 7  # 4 = Friday
    if days_until_friday == 0 and today.hour >= 18:  # If it's Friday evening, get next Friday
        days_until_friday = 7

    friday = today + timedelta(days=days_until_friday)
    friday_evening = friday.replace(hour=19, minute=0, second=0, microsecond=0)  # 7 PM

    # Create event
    event = Event(
        name=f"VGI Trench - {friday.strftime('%B %d, %Y')}",
        date=friday_evening,
        venue="Manassas Brazilian Jiu-Jitsu",
        status=EventStatus.REGISTRATION_OPEN
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    print(f"✅ Created event: {event.name}")
    print(f"   Event ID: {event.id}")
    print(f"   Date: {friday_evening.strftime('%A, %B %d, %Y at %I:%M %p')}")
    print(f"   Venue: {event.venue}")
    print(f"   Status: {event.status.value}")
    print(f"\n📋 Check-in page: http://localhost:3000/events/{event.id}/checkin")
    print(f"📋 Brackets page: http://localhost:3000/events/{event.id}/brackets")

    return event


def main():
    db = SessionLocal()
    try:
        create_friday_event(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
