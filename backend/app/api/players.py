from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.attributes import flag_modified
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
    match_number: int | None  # Made optional to handle matches without match_number
    # Historical data from this event
    belt_rank: str | None  # Player's belt rank at this event
    weight: float | None  # Player's weight at this event
    weight_class: str | None  # Weight class at this event
    elo_change: int | None  # ELO rating change from this match

    class Config:
        from_attributes = True


class ManualBadgeCreate(BaseModel):
    name: str
    description: str
    icon: str


@router.get("/players", response_model=List[PlayerResponse])
async def get_players(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get list of all active players"""
    from sqlalchemy.orm import joinedload
    players = db.query(Player).options(joinedload(Player.weight_class)).filter(Player.active == True).offset(skip).limit(limit).all()

    # Add weight_class_name to response
    result = []
    for player in players:
        player_dict = {
            "id": player.id,
            "name": player.name,
            "belt": player.belt,
            "team": player.team,
            "academy": player.academy,
            "photo_url": player.photo_url,
            "age": player.age,
            "bjj_belt_rank": player.bjj_belt_rank,
            "weight": player.weight,
            "weight_class_id": player.weight_class_id,
            "elo_rating": player.elo_rating,
            "rankade_ree_score": player.rankade_ree_score,
            "rankade_id": player.rankade_id,
            "active": player.active,
            "created_at": player.created_at,
            "updated_at": player.updated_at,
            "weight_class_name": player.weight_class.name if player.weight_class else None
        }
        result.append(player_dict)

    return result


@router.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get a specific player"""
    from app.services.badges import get_player_badges
    from sqlalchemy.orm import joinedload

    player = db.query(Player).options(joinedload(Player.weight_class)).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Calculate badges for this player
    badges = get_player_badges(player_id, db)

    # Build response dict
    player_dict = {
        "id": player.id,
        "name": player.name,
        "belt": player.belt,
        "team": player.team,
        "academy": player.academy,
        "photo_url": player.photo_url,
        "age": player.age,
        "bjj_belt_rank": player.bjj_belt_rank,
        "weight": player.weight,
        "weight_class_id": player.weight_class_id,
        "elo_rating": player.elo_rating,
        "rankade_ree_score": player.rankade_ree_score,
        "rankade_id": player.rankade_id,
        "active": player.active,
        "created_at": player.created_at,
        "updated_at": player.updated_at,
        "weight_class_name": player.weight_class.name if player.weight_class else None,
        "badges": badges,
        "manual_badges": player.manual_badges or []
    }

    return player_dict


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

    # Get all matches with eager loading to avoid N+1 queries
    matches = db.query(Match).filter(
        or_(Match.a_player_id == player_id, Match.b_player_id == player_id)
    ).options(
        joinedload(Match.player_a),
        joinedload(Match.player_b),
        joinedload(Match.event)
    ).order_by(Match.created_at.desc()).all()

    # Batch fetch all entries for this player and opponents in one query
    event_ids = [match.event_id for match in matches]
    opponent_ids = [
        match.b_player_id if match.a_player_id == player_id else match.a_player_id
        for match in matches
    ]
    all_player_ids = [player_id] + opponent_ids

    entries = db.query(Entry).filter(
        Entry.event_id.in_(event_ids),
        Entry.player_id.in_(all_player_ids)
    ).options(joinedload(Entry.weight_class)).all()

    # Create a lookup dict for quick access: (event_id, player_id) -> entry
    entry_lookup = {(e.event_id, e.player_id): e for e in entries}

    history = []
    for match in matches:
        # Determine opponent
        if match.a_player_id == player_id:
            opponent = match.player_b
            result = "win" if match.result == MatchResult.PLAYER_A_WIN else ("loss" if match.result == MatchResult.PLAYER_B_WIN else "draw")
        else:
            opponent = match.player_a
            result = "win" if match.result == MatchResult.PLAYER_B_WIN else ("loss" if match.result == MatchResult.PLAYER_A_WIN else "draw")

        # Get historical belt rank and weight from entry lookup
        entry = entry_lookup.get((match.event_id, player_id))

        # Get opponent's entry to determine match weight class (only if opponent exists)
        opponent_entry = entry_lookup.get((match.event_id, opponent.id)) if opponent else None

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
            # Get the ELO change for this player
            elo_change = None
            if match.a_player_id == player_id:
                elo_change = match.a_elo_change
            else:
                elo_change = match.b_elo_change

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
                weight_class=match_weight_class,
                elo_change=elo_change
            ))

    return history



# Note: Rankade sync endpoint removed - local ELO system is primary
# Manual player registration is done via POST /players endpoint

@router.get("/players/{player_id}/prize-eligibility")
async def get_prize_eligibility(player_id: int, db: Session = Depends(get_db)):
    """
    Determine which weight class prizes a player is eligible for.

    Division Prize Rules:
    - Must have at least 6 matches in the division
    - Must have the MOST matches in that division (compared to other divisions)
    - If tied for most matches, eligible for all tied divisions

    Overall Prize Pool Rules:
    - Must have attended 5+ events
    - Must have completed 12+ total matches
    """
    from collections import defaultdict
    from app.models.event import Event

    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get all matches
    matches = db.query(Match).filter(
        or_(Match.a_player_id == player_id, Match.b_player_id == player_id)
    ).all()

    # Count matches per division (exclude NO_CONTEST)
    division_match_counts = defaultdict(int)
    valid_matches = []
    for match in matches:
        # Skip NO_CONTEST matches
        if match.result == MatchResult.NO_CONTEST:
            continue
        valid_matches.append(match)
        if match.weight_class_id:
            division_match_counts[match.weight_class_id] += 1

    # Find max match count across all divisions
    max_matches = max(division_match_counts.values()) if division_match_counts else 0

    # Determine eligible divisions
    eligible_divisions = []
    elo_field_map = {
        1: 'Lightweight',
        2: 'Middleweight',
        3: 'Heavyweight'
    }

    for weight_class_id, match_count in division_match_counts.items():
        # Must have 6+ matches AND be tied for or have the most matches
        if match_count >= 6 and match_count == max_matches:
            eligible_divisions.append({
                "weight_class_id": weight_class_id,
                "weight_class_name": elo_field_map.get(weight_class_id, "Unknown"),
                "match_count": match_count
            })

    # Check overall prize pool eligibility (using valid matches only)
    total_matches = len(valid_matches)
    events_attended = set(match.event_id for match in valid_matches)
    overall_eligible = total_matches >= 12 and len(events_attended) >= 5

    return {
        "player_id": player_id,
        "player_name": player.name,
        "overall_prize_eligible": overall_eligible,
        "total_matches": total_matches,
        "events_attended": len(events_attended),
        "division_prize_eligible": eligible_divisions
    }


@router.get("/players/{player_id}/badges")
async def get_badges_endpoint(player_id: int, db: Session = Depends(get_db)):
    """
    Get all achievement badges earned by a player.

    Streak Badges:
    - On Fire 🔥 - 3+ wins in a row (current streak)
    - Comeback Kid 💪 - Won after losing 2+ matches in a row
    - Lightning Strike ⚡ - 5 wins under 30 seconds
    - Unbeatable 🧱 - 5+ draws

    Submission Badges (earned by getting at least one):
    - Footsie 🦶 - Leg lock submission (heel hook, ankle lock, kneebar, toe hold)
    - Triangle 🔺 - Triangle submission
    - Darce Knight 🥷 - Darce choke submission
    - Guillotine ⚔️ - Guillotine submission
    - Chokeout 😴 - Rear naked choke submission
    - Armbar 🦴 - Armbar submission

    Advanced Badges:
    - Bone Collector 💀 - 5+ armbar submissions
    - The Strangler 🐍 - 5+ choke submissions

    Special Badges:
    - Multi-Division ⚖️ - Competed in multiple weight classes
    - The Spoiler 🤯 - Beat someone 2+ belt ranks above you
    - Warrior Spirit ❤️‍🔥 - Most matches in a single event (minimum 3, no ties)
    - Prize Pool 💰 - Eligible for season prize pool (5+ events, 12+ matches)
    """
    from app.services.badges import get_player_badges

    # Check player exists
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    return get_player_badges(player_id, db)


@router.post("/players/{player_id}/badges/manual")
async def add_manual_badge(
    player_id: int,
    badge: ManualBadgeCreate,
    db: Session = Depends(get_db)
):
    """
    Add a manual badge to a player (admin only).

    Manual badges available:
    - 🍑 Buttscooter - Guard puller specialist
    - 🍄 Trippy - Footsweep Assassin
    - 🏆 Fight of the Night - Best fight of the event
    """
    # Check player exists
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Initialize manual_badges if None
    if player.manual_badges is None:
        player.manual_badges = []

    # Check if badge already exists
    badge_dict = {"name": badge.name, "description": badge.description, "icon": badge.icon}
    if badge_dict in player.manual_badges:
        raise HTTPException(status_code=400, detail="Badge already exists")

    # Add badge
    player.manual_badges.append(badge_dict)
    flag_modified(player, "manual_badges")  # Tell SQLAlchemy the JSON field changed
    db.commit()
    db.refresh(player)

    return {"message": "Badge added successfully", "badges": player.manual_badges}


@router.delete("/players/{player_id}/badges/manual/{badge_name}")
async def remove_manual_badge(
    player_id: int,
    badge_name: str,
    db: Session = Depends(get_db)
):
    """
    Remove a manual badge from a player (admin only).
    """
    # Check player exists
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Check if player has manual badges
    if not player.manual_badges:
        raise HTTPException(status_code=404, detail="No manual badges found")

    # Find and remove badge
    original_length = len(player.manual_badges)
    player.manual_badges = [b for b in player.manual_badges if b.get("name") != badge_name]

    if len(player.manual_badges) == original_length:
        raise HTTPException(status_code=404, detail="Badge not found")

    flag_modified(player, "manual_badges")  # Tell SQLAlchemy the JSON field changed
    db.commit()
    db.refresh(player)

    return {"message": "Badge removed successfully", "badges": player.manual_badges}


@router.get("/players/{player_id}/divisions")
async def get_player_divisions(player_id: int, db: Session = Depends(get_db)):
    """
    Get weight-class-specific records and ELO ratings for a player.
    Returns a list of divisions the player has competed in with their record and ELO.
    """
    from app.models.weight_class import WeightClass
    from collections import defaultdict

    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get ALL matches (including those without weight class)
    matches = db.query(Match).filter(
        or_(Match.a_player_id == player_id, Match.b_player_id == player_id)
    ).options(joinedload(Match.weight_class)).all()

    # Track overall stats AND division-specific stats
    overall_stats = {"wins": 0, "losses": 0, "draws": 0}
    division_stats = defaultdict(lambda: {"wins": 0, "losses": 0, "draws": 0})

    for match in matches:
        weight_class_id = match.weight_class_id

        # Skip NO_CONTEST matches (don't count in records)
        if match.result == MatchResult.NO_CONTEST:
            continue

        # Determine result
        result_type = None
        if match.a_player_id == player_id:
            if match.result == MatchResult.PLAYER_A_WIN:
                result_type = "wins"
            elif match.result == MatchResult.PLAYER_B_WIN:
                result_type = "losses"
            elif match.result == MatchResult.DRAW:
                result_type = "draws"
        else:  # player_id == match.b_player_id
            if match.result == MatchResult.PLAYER_B_WIN:
                result_type = "wins"
            elif match.result == MatchResult.PLAYER_A_WIN:
                result_type = "losses"
            elif match.result == MatchResult.DRAW:
                result_type = "draws"

        # Count in overall stats
        if result_type:
            overall_stats[result_type] += 1

        # Count in division stats (only if weight class is assigned)
        if weight_class_id and result_type:
            division_stats[weight_class_id][result_type] += 1

    # Build response with ELO ratings
    divisions = []
    elo_field_map = {
        1: ('elo_lightweight', 'initial_elo_lightweight', 'Lightweight'),
        2: ('elo_middleweight', 'initial_elo_middleweight', 'Middleweight'),
        3: ('elo_heavyweight', 'initial_elo_heavyweight', 'Heavyweight')
    }

    for weight_class_id, stats in division_stats.items():
        if weight_class_id in elo_field_map:
            elo_field, initial_elo_field, weight_class_name = elo_field_map[weight_class_id]
            current_elo = getattr(player, elo_field, None)
            initial_elo = getattr(player, initial_elo_field, None)

            divisions.append({
                "weight_class_id": weight_class_id,
                "weight_class_name": weight_class_name,
                "wins": stats["wins"],
                "losses": stats["losses"],
                "draws": stats["draws"],
                "elo_rating": current_elo,
                "initial_elo_rating": initial_elo,
                "elo_change": (current_elo - initial_elo) if (current_elo and initial_elo) else 0
            })

    # Sort by weight class ID
    divisions.sort(key=lambda x: x["weight_class_id"])

    # Use actual overall stats (includes matches with null weight_class_id)
    result = {
        "player_id": player_id,
        "player_name": player.name,
        "overall": {
            "wins": overall_stats["wins"],
            "losses": overall_stats["losses"],
            "draws": overall_stats["draws"],
            "elo_rating": player.elo_rating,
            "elo_change": (player.elo_rating - player.initial_p4p_elo) if (player.elo_rating and player.initial_p4p_elo) else 0
        },
        "divisions": divisions
    }

    return result
