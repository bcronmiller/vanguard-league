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
from app.models.player import Player
from app.models.weight_class import WeightClass

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


class CheckInRequest(BaseModel):
    player_id: int
    current_weight: float  # Weight in lbs (renamed for frontend compatibility)
    weight_class_id: Optional[int] = None  # Weight class they want to compete in


class CheckInResponse(BaseModel):
    id: int
    event_id: int
    player_id: int
    weight: float
    weight_class_id: int
    belt_rank: Optional[str]
    checked_in: bool

    class Config:
        from_attributes = True


class EntryResponse(BaseModel):
    id: int
    event_id: int
    player_id: int
    weight_class_id: Optional[int]
    checked_in: bool
    belt_rank: Optional[str]
    weight: Optional[float]
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
    """Create a new event and automatically register all active fighters"""
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

    # Automatically register all active fighters for the event
    from app.models.player import Player
    from app.models.entry import Entry

    active_fighters = db.query(Player).filter(Player.active == True).all()
    for fighter in active_fighters:
        entry = Entry(
            event_id=event.id,
            player_id=fighter.id,
            weight_class_id=fighter.weight_class_id,  # Use their assigned weight class
            checked_in=False
        )
        db.add(entry)

    db.commit()
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


@router.get("/events/{event_id}/entries", response_model=List[EntryResponse])
def get_event_entries(event_id: int, db: Session = Depends(get_db)):
    """Get all entries (registrations) for an event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    entries = db.query(Entry).filter(Entry.event_id == event_id).all()
    return entries


@router.get("/events/{event_id}/checkin-status")
def get_checkin_status(event_id: int, db: Session = Depends(get_db)):
    """
    Get check-in status for all players registered for an event.
    Returns player info with check-in details.

    If the event has no entries, automatically registers all active fighters.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get all entries for this event with player info
    entries = db.query(Entry).filter(Entry.event_id == event_id).all()

    # If no entries exist, automatically register all active fighters
    if len(entries) == 0:
        active_fighters = db.query(Player).filter(Player.active == True).all()
        for fighter in active_fighters:
            entry = Entry(
                event_id=event_id,
                player_id=fighter.id,
                weight_class_id=fighter.weight_class_id,
                checked_in=False
            )
            db.add(entry)

        db.commit()
        # Re-fetch entries after registration
        entries = db.query(Entry).filter(Entry.event_id == event_id).all()

    result = []
    for entry in entries:
        player = entry.player
        weight_class = entry.weight_class

        result.append({
            "id": player.id,
            "name": player.name.replace('*', ''),
            "photo_url": player.photo_url,
            "last_known_weight": player.weight,
            "weight_class_name": weight_class.name if weight_class else None,
            "is_checked_in": entry.checked_in,
            "current_weight": entry.weight,
            "checked_in_at": entry.created_at.isoformat() if entry.checked_in else None
        })

    return result


@router.delete("/events/{event_id}/checkin/{player_id}")
def undo_checkin(event_id: int, player_id: int, db: Session = Depends(get_db)):
    """Undo a fighter's check-in"""
    entry = db.query(Entry).filter(
        Entry.event_id == event_id,
        Entry.player_id == player_id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Reset check-in fields
    entry.checked_in = False
    entry.weight = None
    entry.weight_class_id = None
    entry.belt_rank = None

    # Also delete the weigh-in record
    db.query(WeighIn).filter(
        WeighIn.event_id == event_id,
        WeighIn.player_id == player_id
    ).delete()

    db.commit()
    return {"message": "Check-in undone successfully"}


@router.delete("/events/{event_id}/checkin-all")
def undo_all_checkins(event_id: int, db: Session = Depends(get_db)):
    """Undo all check-ins for an event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Reset all entries
    entries = db.query(Entry).filter(Entry.event_id == event_id).all()
    count = 0
    for entry in entries:
        if entry.checked_in:
            entry.checked_in = False
            entry.weight = None
            entry.weight_class_id = None
            entry.belt_rank = None
            count += 1

    # Delete all weigh-ins for this event
    db.query(WeighIn).filter(WeighIn.event_id == event_id).delete()

    db.commit()
    return {"message": "All check-ins undone", "count": count}


@router.post("/events/{event_id}/checkin", response_model=CheckInResponse)
def check_in_fighter(
    event_id: int,
    check_in: CheckInRequest,
    db: Session = Depends(get_db)
):
    """
    Check in a fighter for an event.

    This records:
    - The fighter's actual weight at time of event
    - The weight class they are competing in (can be their natural class or heavier - fighting up)
    - A snapshot of their current belt rank

    Validation: Fighters can only compete in their natural weight class or heavier (no cutting down).

    Weight Classes:
    - Lightweight: 170 lbs and below
    - Middleweight: 171-200 lbs
    - Heavyweight: Over 200 lbs
    """
    # Verify event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get player
    player = db.query(Player).filter(Player.id == check_in.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Determine natural weight class based on weight
    all_weight_classes = db.query(WeightClass).order_by(WeightClass.min_lbs).all()
    natural_weight_class = None
    for wc in all_weight_classes:
        if wc.max_lbs is None:  # Open-ended upper limit
            if wc.min_lbs is None or check_in.current_weight >= wc.min_lbs:
                natural_weight_class = wc
                break
        elif wc.min_lbs is None:  # Open-ended lower limit
            if check_in.current_weight <= wc.max_lbs:
                natural_weight_class = wc
                break
        else:  # Both limits defined
            if wc.min_lbs <= check_in.current_weight <= wc.max_lbs:
                natural_weight_class = wc
                break

    if not natural_weight_class:
        raise HTTPException(status_code=400, detail=f"No weight class found for weight {check_in.current_weight} lbs")

    # If weight_class_id provided, validate it; otherwise use natural class
    if check_in.weight_class_id:
        selected_weight_class = db.query(WeightClass).filter(WeightClass.id == check_in.weight_class_id).first()
        if not selected_weight_class:
            raise HTTPException(status_code=404, detail="Weight class not found")

        # Validate: Can only fight in natural class or heavier (fighting up)
        # This means selected max_lbs must be >= natural max_lbs
        if selected_weight_class.max_lbs is not None and natural_weight_class.max_lbs is not None:
            if selected_weight_class.max_lbs < natural_weight_class.max_lbs:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot compete in {selected_weight_class.name} ({selected_weight_class.max_lbs} lbs max). "
                           f"Your weight ({check_in.current_weight} lbs) places you in {natural_weight_class.name}. "
                           f"You can only compete in your natural class or heavier (fighting up)."
                )
        final_weight_class_id = check_in.weight_class_id
    else:
        # Auto-assign to natural weight class
        final_weight_class_id = natural_weight_class.id

    # Find or create entry
    entry = db.query(Entry).filter(
        Entry.event_id == event_id,
        Entry.player_id == check_in.player_id
    ).first()

    if not entry:
        # Create new entry
        entry = Entry(
            event_id=event_id,
            player_id=check_in.player_id
        )
        db.add(entry)

    # Update entry with check-in data
    entry.weight = check_in.current_weight
    entry.weight_class_id = final_weight_class_id
    entry.belt_rank = player.bjj_belt_rank
    entry.checked_in = True

    # Create weigh-in record
    weigh_in = WeighIn(
        event_id=event_id,
        player_id=check_in.player_id,
        weight=check_in.current_weight,
        weighed_at=datetime.utcnow()
    )
    db.add(weigh_in)

    db.commit()
    db.refresh(entry)

    return entry


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


@router.post("/events/{event_id}/register-all")
async def register_all_active_players(event_id: int, db: Session = Depends(get_db)):
    """Register all active players for an event"""
    # Verify event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get all active players
    active_fighters = db.query(Player).filter(Player.active == True).all()

    registered_count = 0
    skipped_count = 0

    for fighter in active_fighters:
        # Check if already registered
        existing = db.query(Entry).filter(
            Entry.event_id == event.id,
            Entry.player_id == fighter.id
        ).first()

        if existing:
            skipped_count += 1
            continue

        entry = Entry(
            event_id=event.id,
            player_id=fighter.id,
            weight_class_id=fighter.weight_class_id,
            checked_in=False
        )
        db.add(entry)
        registered_count += 1

    db.commit()

    return {
        "message": f"Registration complete",
        "registered": registered_count,
        "skipped": skipped_count,
        "total_active_players": len(active_fighters)
    }


@router.get("/events/{event_id}/brackets")
async def get_event_brackets(event_id: int, db: Session = Depends(get_db)):
    """Get all brackets for an event with full match and player details"""
    from app.models.bracket_format import BracketFormat
    from app.models.bracket_round import BracketRound
    from sqlalchemy.orm import joinedload

    # Get event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get all brackets for this event
    brackets = db.query(BracketFormat).filter(
        BracketFormat.event_id == event_id
    ).all()

    result = []
    for bracket in brackets:
        # Get all rounds for this bracket
        rounds = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id
        ).order_by(BracketRound.round_number).all()

        rounds_data = []
        for round in rounds:
            # Get all matches for this round with player data
            matches = db.query(Match).filter(
                Match.bracket_round_id == round.id
            ).options(
                joinedload(Match.player_a),
                joinedload(Match.player_b)
            ).order_by(Match.match_number).all()

            matches_data = []
            for match in matches:
                match_dict = {
                    "id": match.id,
                    "match_number": match.match_number,
                    "a_player_id": match.a_player_id,
                    "b_player_id": match.b_player_id,
                    "result": match.result.value if match.result else None,
                    "method": match.method,
                    "duration_seconds": match.duration_seconds,
                    "match_status": match.match_status.value,
                }

                # Add player details
                if match.player_a:
                    match_dict["player_a"] = {
                        "id": match.player_a.id,
                        "name": match.player_a.name
                    }

                if match.player_b:
                    match_dict["player_b"] = {
                        "id": match.player_b.id,
                        "name": match.player_b.name
                    }

                matches_data.append(match_dict)

            rounds_data.append({
                "id": round.id,
                "round_number": round.round_number,
                "round_name": round.round_name,
                "bracket_type": round.bracket_type,
                "status": round.status.value,
                "matches": matches_data
            })

        result.append({
            "id": bracket.id,
            "format_type": bracket.format_type.value,
            "weight_class_id": bracket.weight_class_id,
            "is_finalized": bracket.is_finalized,
            "rounds": rounds_data
        })

    return result
