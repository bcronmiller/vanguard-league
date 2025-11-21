from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.player import Player
from app.models.event import Event
from app.models.entry import Entry
from app.models.weigh_in import WeighIn
from app.models.weight_class import WeightClass
from pydantic import BaseModel


router = APIRouter()


class CheckInRequest(BaseModel):
    player_id: int
    current_weight: float  # in lbs


class CheckInResponse(BaseModel):
    player_id: int
    player_name: str
    current_weight: float
    previous_weight: float | None
    weight_class_id: int
    weight_class_name: str
    checked_in_at: datetime

    class Config:
        from_attributes = True


class PlayerCheckInStatus(BaseModel):
    id: int
    name: str
    photo_url: str | None
    last_known_weight: float | None
    weight_class_id: int | None
    weight_class_name: str | None
    is_checked_in: bool
    current_weight: float | None
    checked_in_at: datetime | None

    class Config:
        from_attributes = True


@router.post("/events/{event_id}/checkin", response_model=CheckInResponse)
def check_in_player(
    event_id: int,
    checkin: CheckInRequest,
    db: Session = Depends(get_db)
):
    """
    Check in a player for an event
    - Records their current weight
    - Auto-assigns weight class based on current weight
    - Creates entry if doesn't exist
    """
    # Verify event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Verify player exists
    player = db.query(Player).filter(Player.id == checkin.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Determine weight class based on current weight
    weight_class = None
    if checkin.current_weight < 170:
        weight_class = db.query(WeightClass).filter_by(name="Lightweight").first()
    elif checkin.current_weight <= 200:
        weight_class = db.query(WeightClass).filter_by(name="Middleweight").first()
    else:
        weight_class = db.query(WeightClass).filter_by(name="Heavyweight").first()

    if not weight_class:
        raise HTTPException(status_code=500, detail="Weight class not found")

    # Update player's weight and weight class
    previous_weight = player.weight
    player.weight = checkin.current_weight
    player.weight_class_id = weight_class.id

    # Create or update entry
    entry = db.query(Entry).filter(
        Entry.event_id == event_id,
        Entry.player_id == checkin.player_id
    ).first()

    if not entry:
        entry = Entry(
            event_id=event_id,
            player_id=checkin.player_id,
            weight_class_id=weight_class.id,
            checked_in=True,
            belt_rank=player.bjj_belt_rank,  # Snapshot belt rank at check-in
            weight=checkin.current_weight  # Snapshot weight at check-in
        )
        db.add(entry)
    else:
        entry.checked_in = True
        entry.weight_class_id = weight_class.id
        entry.belt_rank = player.bjj_belt_rank  # Update snapshot if re-checking in
        entry.weight = checkin.current_weight  # Update snapshot if re-checking in

    # Record weigh-in
    weigh_in = WeighIn(
        event_id=event_id,
        player_id=checkin.player_id,
        weight=checkin.current_weight,
        weighed_at=datetime.utcnow()
    )
    db.add(weigh_in)

    db.commit()
    db.refresh(entry)

    return CheckInResponse(
        player_id=player.id,
        player_name=player.name,
        current_weight=checkin.current_weight,
        previous_weight=previous_weight,
        weight_class_id=weight_class.id,
        weight_class_name=weight_class.name,
        checked_in_at=weigh_in.weighed_at
    )


@router.get("/events/{event_id}/checkin-status", response_model=List[PlayerCheckInStatus])
def get_checkin_status(event_id: int, db: Session = Depends(get_db)):
    """
    Get check-in status for all players for an event
    """
    # Verify event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get all active players
    players = db.query(Player).filter(Player.active == True).all()
    player_ids = [p.id for p in players]

    # Batch load all entries for this event (single query instead of N)
    entries = db.query(Entry).filter(
        Entry.event_id == event_id,
        Entry.player_id.in_(player_ids)
    ).all()
    entries_by_player = {e.player_id: e for e in entries}

    # Batch load all weigh-ins for this event (single query instead of N)
    weigh_ins = db.query(WeighIn).filter(
        WeighIn.event_id == event_id,
        WeighIn.player_id.in_(player_ids)
    ).order_by(WeighIn.weighed_at.desc()).all()
    # Keep only most recent weigh-in per player
    weigh_ins_by_player = {}
    for wi in weigh_ins:
        if wi.player_id not in weigh_ins_by_player:
            weigh_ins_by_player[wi.player_id] = wi

    # Batch load all weight classes (single query instead of N)
    weight_class_ids = set(p.weight_class_id for p in players if p.weight_class_id)
    weight_classes = db.query(WeightClass).filter(WeightClass.id.in_(weight_class_ids)).all()
    wc_by_id = {wc.id: wc.name for wc in weight_classes}

    result = []
    for player in players:
        entry = entries_by_player.get(player.id)
        weigh_in = weigh_ins_by_player.get(player.id)
        weight_class_name = wc_by_id.get(player.weight_class_id)

        result.append(PlayerCheckInStatus(
            id=player.id,
            name=player.name,
            photo_url=player.photo_url,
            last_known_weight=player.weight,
            weight_class_id=player.weight_class_id,
            weight_class_name=weight_class_name,
            is_checked_in=entry.checked_in if entry else False,
            current_weight=weigh_in.weight if weigh_in else None,
            checked_in_at=weigh_in.weighed_at if weigh_in else None
        ))

    return result


@router.delete("/events/{event_id}/checkin/{player_id}")
def undo_checkin(event_id: int, player_id: int, db: Session = Depends(get_db)):
    """
    Undo a player's check-in (in case of mistake)
    """
    entry = db.query(Entry).filter(
        Entry.event_id == event_id,
        Entry.player_id == player_id
    ).first()

    if entry:
        entry.checked_in = False
        db.commit()

    return {"message": "Check-in undone"}


@router.delete("/events/{event_id}/checkin-all")
def undo_all_checkins(event_id: int, db: Session = Depends(get_db)):
    """
    Undo all check-ins for an event (reset check-in process)
    """
    # Get event to verify it exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Undo all check-ins for this event
    entries = db.query(Entry).filter(Entry.event_id == event_id).all()
    count = 0
    for entry in entries:
        if entry.checked_in:
            entry.checked_in = False
            count += 1

    db.commit()

    return {"message": f"Undone {count} check-ins", "count": count}
