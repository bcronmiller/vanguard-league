from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, time
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.event import Event, EventStatus
from app.models.entry import Entry
from app.models.match import Match
from app.models.weigh_in import WeighIn

router = APIRouter()


# Schemas
class EventCreate(BaseModel):
    name: str
    date: datetime
    venue: str = "VGI Trench"
    status: EventStatus = EventStatus.REGISTRATION_OPEN
    fighter_arrival_time: Optional[time] = time(19, 30)  # 7:30 PM default
    event_start_time: Optional[time] = time(20, 0)  # 8:00 PM default


class EventResponse(BaseModel):
    id: int
    name: str
    date: datetime
    venue: str
    status: EventStatus
    fighter_arrival_time: Optional[time]
    event_start_time: Optional[time]
    created_at: datetime

    class Config:
        from_attributes = True


# Endpoints
@router.get("/events", response_model=List[EventResponse])
def list_events(db: Session = Depends(get_db)):
    """Get all events"""
    events = db.query(Event).order_by(Event.date.desc()).all()
    return events


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Get a specific event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/events", response_model=EventResponse)
def create_event(event_data: EventCreate, db: Session = Depends(get_db)):
    """Create a new event"""
    event = Event(
        name=event_data.name,
        date=event_data.date,
        venue=event_data.venue,
        status=event_data.status,
        fighter_arrival_time=event_data.fighter_arrival_time,
        event_start_time=event_data.event_start_time
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/events/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event_data: EventCreate, db: Session = Depends(get_db)):
    """Update an event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.name = event_data.name
    event.date = event_data.date
    event.venue = event_data.venue
    event.status = event_data.status
    event.fighter_arrival_time = event_data.fighter_arrival_time
    event.event_start_time = event_data.event_start_time

    db.commit()
    db.refresh(event)
    return event


@router.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    """
    Safely delete an event and all associated records.

    This will remove:
    - All matches from this event
    - All entries (check-ins) for this event
    - All weigh-ins for this event
    - The event itself

    Note: This does NOT delete the fighters themselves, only their participation in this event.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Count records to be deleted for reporting
    matches_count = db.query(Match).filter(Match.event_id == event_id).count()
    entries_count = db.query(Entry).filter(Entry.event_id == event_id).count()
    weighins_count = db.query(WeighIn).filter(WeighIn.event_id == event_id).count()

    # Delete all matches for this event
    db.query(Match).filter(Match.event_id == event_id).delete()

    # Delete all entries for this event
    db.query(Entry).filter(Entry.event_id == event_id).delete()

    # Delete all weigh-ins for this event
    db.query(WeighIn).filter(WeighIn.event_id == event_id).delete()

    # Finally, delete the event itself
    db.delete(event)
    db.commit()

    return {
        "message": "Event deleted successfully",
        "event_name": event.name,
        "deleted": {
            "matches": matches_count,
            "entries": entries_count,
            "weigh_ins": weighins_count
        }
    }
