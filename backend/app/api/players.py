from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.models.player import Player
from app.models.match import Match, MatchResult
from app.models.event import Event
from app.models.entry import Entry
from app.schemas.player import PlayerCreate, PlayerResponse, PlayerUpdate

router = APIRouter()


# Schema for match history
class OpponentInfo(BaseModel):
    id: int
    name: str
    photo_url: str | None

    class Config:
        from_attributes = True


class MatchHistoryItem(BaseModel):
    match_id: int
    event_id: int
    event_name: str
    event_date: datetime
    opponent: OpponentInfo
    result: str  # "win", "loss", "draw"
    method: str | None
    duration_seconds: int | None
    match_number: int
    # Historical data from this event
    belt_rank: str | None  # Player's belt rank at this event
    weight: float | None  # Player's weight at this event
    weight_class: str | None  # Weight class at this event

    class Config:
        from_attributes = True


@router.get("/players", response_model=List[PlayerResponse])
async def get_players(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get list of players"""
    players = db.query(Player).filter(Player.active == True).offset(skip).limit(limit).all()
    return players


@router.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get a specific player"""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.post("/players", response_model=PlayerResponse)
async def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    """Create a new player"""
    # Check if player already exists
    existing = db.query(Player).filter(Player.name == player.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Player already exists")

    db_player = Player(**player.model_dump())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


@router.put("/players/{player_id}", response_model=PlayerResponse)
async def update_player(
    player_id: int,
    player_update: PlayerUpdate,
    db: Session = Depends(get_db)
):
    """Update a player"""
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")

    for field, value in player_update.model_dump(exclude_unset=True).items():
        setattr(db_player, field, value)

    db.commit()
    db.refresh(db_player)
    return db_player


@router.get("/players/{player_id}/matches", response_model=List[MatchHistoryItem])
async def get_player_match_history(player_id: int, db: Session = Depends(get_db)):
    """Get a player's complete match history"""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get all matches where this player participated
    matches = db.query(Match).filter(
        or_(Match.a_player_id == player_id, Match.b_player_id == player_id)
    ).order_by(Match.created_at.desc()).all()

    history = []
    for match in matches:
        # Determine opponent
        if match.a_player_id == player_id:
            opponent = match.player_b
            result = "win" if match.result == MatchResult.PLAYER_A_WIN else ("loss" if match.result == MatchResult.PLAYER_B_WIN else "draw")
        else:
            opponent = match.player_a
            result = "win" if match.result == MatchResult.PLAYER_B_WIN else ("loss" if match.result == MatchResult.PLAYER_A_WIN else "draw")

        # Get historical belt rank and weight from entry at this event
        entry = db.query(Entry).filter(
            Entry.event_id == match.event_id,
            Entry.player_id == player_id
        ).first()

        # Get opponent's entry to determine match weight class
        opponent_entry = db.query(Entry).filter(
            Entry.event_id == match.event_id,
            Entry.player_id == opponent.id
        ).first()

        # Determine match weight class - use the heavier fighter's weight class
        match_weight_class = None
        if entry and opponent_entry:
            player_weight = entry.weight or player.weight
            opponent_weight = opponent_entry.weight or opponent.weight

            if player_weight and opponent_weight:
                # Use the heavier weight to determine class
                heavier_weight = max(player_weight, opponent_weight)
                if heavier_weight < 170:
                    match_weight_class = "Lightweight"
                elif heavier_weight <= 200:
                    match_weight_class = "Middleweight"
                else:
                    match_weight_class = "Heavyweight"
            elif entry and entry.weight_class:
                match_weight_class = entry.weight_class.name
        elif entry and entry.weight_class:
            match_weight_class = entry.weight_class.name

        if opponent:  # Only include if opponent exists
            history.append(MatchHistoryItem(
                match_id=match.id,
                event_id=match.event_id,
                event_name=match.event.name if match.event else "Unknown Event",
                event_date=match.event.date if match.event else match.created_at,
                opponent=OpponentInfo(
                    id=opponent.id,
                    name=opponent.name,
                    photo_url=opponent.photo_url
                ),
                result=result,
                method=match.method,
                duration_seconds=match.duration_seconds,
                match_number=getattr(match, 'match_number', match.id),
                belt_rank=entry.belt_rank if entry else player.bjj_belt_rank,
                weight=entry.weight if entry else player.weight,
                weight_class=match_weight_class
            ))

    return history



# Note: Rankade sync endpoint removed - local ELO system is primary
# Manual player registration is done via POST /players endpoint

@router.get("/players/{player_id}/badges")
async def get_badges_endpoint(player_id: int, db: Session = Depends(get_db)):
    """
    Get all achievement badges earned by a player.

    Badges include:
    - Footsie 🦶 - All wins by leg locks (heel hook, ankle lock, kneebar, toe hold)
    - Darce Knight 🦇 - All wins by Darce choke (3+ wins)
    - Triangle Master 🔺 - All wins by triangle chokes
    - Guillotine Guru ⚔️ - All wins by guillotine
    - Submission Specialist 🥋 - 5+ submission victories
    """
    from app.services.badges import get_player_badges

    # Check player exists
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    return get_player_badges(player_id, db)
