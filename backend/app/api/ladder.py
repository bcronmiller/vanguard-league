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
from app.models.weight_class import WeightClass
from app.models.entry import Entry


router = APIRouter()


class OverallLadderEntry(BaseModel):
    player: dict
    wins: int
    losses: int
    draws: int

    class Config:
        from_attributes = True


class LadderEntry(BaseModel):
    rank: int
    player_id: int
    player_name: str
    photo_url: str | None
    belt_rank: str | None
    wins: int
    losses: int
    draws: int
    win_rate: float
    elo_rating: float | None
    initial_elo_rating: float | None

    class Config:
        from_attributes = True


class LadderResponse(BaseModel):
    event_id: int
    event_name: str
    event_date: datetime
    standings: List[LadderEntry]


def get_initial_elo(belt_rank: str | None) -> float:
    """Get starting ELO rating based on belt rank"""
    belt_elos = {
        "Black": 2000.0,
        "Brown": 1600.0,
        "Purple": 1467.0,
        "Blue": 1333.0,
        "White": 1200.0
    }
    return belt_elos.get(belt_rank or "White", 1333.0)  # Default to Blue belt rating


def get_head_to_head_record(player_a_id: int, player_b_id: int, event_id: int, db: Session) -> tuple[int, int]:
    """
    Get head-to-head record between two players for a specific event.
    Returns (player_a_wins, player_b_wins)
    """
    matches = db.query(Match).filter(
        Match.event_id == event_id,
        or_(
            (Match.a_player_id == player_a_id) & (Match.b_player_id == player_b_id),
            (Match.a_player_id == player_b_id) & (Match.b_player_id == player_a_id)
        )
    ).all()

    a_wins = 0
    b_wins = 0

    for match in matches:
        if match.a_player_id == player_a_id:
            if match.result == MatchResult.PLAYER_A_WIN:
                a_wins += 1
            elif match.result == MatchResult.PLAYER_B_WIN:
                b_wins += 1
        else:  # player_a is player_b in match
            if match.result == MatchResult.PLAYER_B_WIN:
                a_wins += 1
            elif match.result == MatchResult.PLAYER_A_WIN:
                b_wins += 1

    return (a_wins, b_wins)


def compare_players(a: dict, b: dict, event_id: int, db: Session) -> int:
    """
    Compare two players for ladder ranking.
    Returns -1 if a should rank higher, 1 if b should rank higher, 0 if tied.

    Ranking order (performance vs. expectations):
    1. ELO gain from starting rating (accounts for belt rank)
    2. Head-to-head record (if tied)
    3. Absolute ELO rating (final tiebreaker)
    """
    # 1. Compare ELO gain (performance vs. expectations)
    a_initial = a.get('initial_elo_rating') or 0
    b_initial = b.get('initial_elo_rating') or 0
    a_current = a.get('elo_rating') or a_initial
    b_current = b.get('elo_rating') or b_initial

    a_gain = a_current - a_initial
    b_gain = b_current - b_initial

    if abs(a_gain - b_gain) > 0.01:  # Account for floating point precision
        return -1 if a_gain > b_gain else 1

    # 2. Check head-to-head if they've played
    a_h2h_wins, b_h2h_wins = get_head_to_head_record(a['player_id'], b['player_id'], event_id, db)

    if a_h2h_wins != b_h2h_wins:
        return -1 if a_h2h_wins > b_h2h_wins else 1

    # 3. Compare absolute ELO ratings (final tiebreaker)
    a_elo = a.get('elo_rating') or 0
    b_elo = b.get('elo_rating') or 0

    if a_elo != b_elo:
        return -1 if a_elo > b_elo else 1

    return 0


@router.get("/ladder/overall", response_model=List[OverallLadderEntry])
def get_overall_ladder(db: Session = Depends(get_db)):
    """Get overall ladder standings across all events, sorted by ELO"""
    # Get all players with matches
    players_with_matches = db.query(Player).join(
        Match,
        or_(Match.a_player_id == Player.id, Match.b_player_id == Player.id)
    ).filter(Match.result.isnot(None)).distinct().all()

    def get_weight_class(weight):
        """Determine weight class from weight"""
        if not weight:
            return None
        if weight < 170:
            return "lightweight"
        elif weight < 185:
            return "middleweight"
        else:
            return "heavyweight"

    standings = []

    for player in players_with_matches:
        player_weight_class = get_weight_class(player.weight)

        # Count wins, losses, draws - only in same weight class matches
        wins = 0
        losses = 0
        draws = 0

        # Matches where player is player_a
        a_matches = db.query(Match).filter(
            Match.a_player_id == player.id,
            Match.result.isnot(None)
        ).all()

        for match in a_matches:
            # Get opponent
            opponent = db.query(Player).filter_by(id=match.b_player_id).first()
            opponent_weight_class = get_weight_class(opponent.weight) if opponent else None

            # Only count if both fighters in same weight class
            if player_weight_class == opponent_weight_class:
                if match.result == MatchResult.PLAYER_A_WIN:
                    wins += 1
                elif match.result == MatchResult.PLAYER_B_WIN:
                    losses += 1
                elif match.result == MatchResult.DRAW:
                    draws += 1

        # Matches where player is player_b
        b_matches = db.query(Match).filter(
            Match.b_player_id == player.id,
            Match.result.isnot(None)
        ).all()

        for match in b_matches:
            # Get opponent
            opponent = db.query(Player).filter_by(id=match.a_player_id).first()
            opponent_weight_class = get_weight_class(opponent.weight) if opponent else None

            # Only count if both fighters in same weight class
            if player_weight_class == opponent_weight_class:
                if match.result == MatchResult.PLAYER_B_WIN:
                    wins += 1
                elif match.result == MatchResult.PLAYER_A_WIN:
                    losses += 1
                elif match.result == MatchResult.DRAW:
                    draws += 1

        # Only include fighters with at least one in-class match
        if wins + losses + draws > 0:
            # Get initial ELO based on weight class
            initial_elo = None
            if player_weight_class == "lightweight":
                initial_elo = player.initial_elo_lightweight
            elif player_weight_class == "middleweight":
                initial_elo = player.initial_elo_middleweight
            elif player_weight_class == "heavyweight":
                initial_elo = player.initial_elo_heavyweight

            standings.append({
                "player": {
                    "id": player.id,
                    "name": player.name,
                    "bjj_belt_rank": player.bjj_belt_rank,
                    "weight": player.weight,
                    "elo_rating": player.elo_rating,
                    "initial_elo_rating": initial_elo,
                    "photo_url": player.photo_url,
                    "academy": player.academy
                },
                "wins": wins,
                "losses": losses,
                "draws": draws
            })

    # Sort by record (wins - losses), then ELO as tiebreaker
    standings.sort(key=lambda x: (
        -(x['wins'] - x['losses']),  # Higher win differential first (negative for descending)
        -(x['player']['elo_rating'] or 0)  # Higher ELO first (negative for descending)
    ))

    return standings


@router.get("/ladder/{event_id}", response_model=LadderResponse)
async def get_ladder(event_id: int, db: Session = Depends(get_db)):
    """
    Get ladder standings for an event.

    Rankings determined by:
    1. Win-Loss record (wins - losses)
    2. Head-to-head record (if tied)
    3. ELO rating (final tiebreaker)
    """
    # Get event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get all matches for this event
    matches = db.query(Match).filter(Match.event_id == event_id).all()

    # Calculate records for each player
    player_records = {}

    for match in matches:
        # Initialize player A if not seen
        if match.a_player_id not in player_records:
            player_a = db.query(Player).filter(Player.id == match.a_player_id).first()
            if player_a:
                initial_elo = get_initial_elo(player_a.bjj_belt_rank)
                player_records[match.a_player_id] = {
                    'player_id': player_a.id,
                    'player_name': player_a.name,
                    'photo_url': player_a.photo_url,
                    'belt_rank': player_a.bjj_belt_rank,
                    'elo_rating': player_a.elo_rating,
                    'initial_elo_rating': initial_elo,
                    'wins': 0,
                    'losses': 0,
                    'draws': 0
                }

        # Initialize player B if not seen
        if match.b_player_id not in player_records:
            player_b = db.query(Player).filter(Player.id == match.b_player_id).first()
            if player_b:
                initial_elo = get_initial_elo(player_b.bjj_belt_rank)
                player_records[match.b_player_id] = {
                    'player_id': player_b.id,
                    'player_name': player_b.name,
                    'photo_url': player_b.photo_url,
                    'belt_rank': player_b.bjj_belt_rank,
                    'elo_rating': player_b.elo_rating,
                    'initial_elo_rating': initial_elo,
                    'wins': 0,
                    'losses': 0,
                    'draws': 0
                }

        # Update records
        if match.result == MatchResult.PLAYER_A_WIN:
            player_records[match.a_player_id]['wins'] += 1
            player_records[match.b_player_id]['losses'] += 1
        elif match.result == MatchResult.PLAYER_B_WIN:
            player_records[match.b_player_id]['wins'] += 1
            player_records[match.a_player_id]['losses'] += 1
        else:  # Draw
            player_records[match.a_player_id]['draws'] += 1
            player_records[match.b_player_id]['draws'] += 1

    # Sort players by record (wins - losses), head-to-head, then ELO
    sorted_players = sorted(
        player_records.values(),
        key=lambda x: (
            -(x['wins'] - x['losses']),  # Higher win differential first (negative for descending)
            -(x.get('elo_rating') or 0)   # Higher ELO first (negative for descending)
        )
    )

    # Apply head-to-head tiebreaker for players with same record
    # This is a simplified implementation - a full implementation would need
    # to handle complex multi-way ties
    from functools import cmp_to_key

    sorted_players = sorted(
        player_records.values(),
        key=cmp_to_key(lambda a, b: compare_players(a, b, event_id, db))
    )

    # Build ladder entries with ranks
    standings = []
    for i, player_data in enumerate(sorted_players, 1):
        total_matches = player_data['wins'] + player_data['losses'] + player_data['draws']
        win_rate = player_data['wins'] / total_matches if total_matches > 0 else 0.0

        standings.append(LadderEntry(
            rank=i,
            player_id=player_data['player_id'],
            player_name=player_data['player_name'],
            photo_url=player_data['photo_url'],
            belt_rank=player_data['belt_rank'],
            wins=player_data['wins'],
            losses=player_data['losses'],
            draws=player_data['draws'],
            win_rate=win_rate,
            elo_rating=player_data['elo_rating'],
            initial_elo_rating=player_data.get('initial_elo_rating')
        ))

    return LadderResponse(
        event_id=event.id,
        event_name=event.name,
        event_date=event.date,
        standings=standings
    )


@router.get("/ladder", response_model=List[LadderResponse])
async def get_all_ladders(db: Session = Depends(get_db)):
    """Get ladder standings for all events"""
    events = db.query(Event).order_by(Event.date.desc()).all()

    ladders = []
    for event in events:
        ladder = await get_ladder(event.id, db)
        ladders.append(ladder)

    return ladders


@router.get("/ladder/{event_id}/weight-class/{weight_class_name}", response_model=LadderResponse)
async def get_ladder_by_weight_class(
    event_id: int,
    weight_class_name: str,
    db: Session = Depends(get_db)
):
    """
    Get ladder standings for a specific weight class at an event.

    Only includes fighters who competed in this weight class at this event.
    Rankings determined by:
    1. Win-Loss record (wins - losses)
    2. Head-to-head record (if tied)
    3. ELO rating (final tiebreaker)
    """
    # Get event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get weight class
    weight_class = db.query(WeightClass).filter(WeightClass.name == weight_class_name).first()
    if not weight_class:
        raise HTTPException(status_code=404, detail="Weight class not found")

    # Get all entries for this event in this weight class
    entries = db.query(Entry).filter(
        Entry.event_id == event_id,
        Entry.weight_class_id == weight_class.id
    ).all()

    if not entries:
        # Return empty standings if no one competed in this weight class
        return LadderResponse(
            event_id=event.id,
            event_name=f"{event.name} - {weight_class_name}",
            event_date=event.date,
            standings=[]
        )

    # Get player IDs who competed in this weight class
    weight_class_player_ids = {entry.player_id for entry in entries}

    # Get all matches for this event
    matches = db.query(Match).filter(Match.event_id == event_id).all()

    # Calculate records for each player in this weight class
    player_records = {}

    for match in matches:
        # Only include matches where both players are in this weight class
        if match.a_player_id not in weight_class_player_ids or match.b_player_id not in weight_class_player_ids:
            continue

        # Initialize player A if not seen
        if match.a_player_id not in player_records:
            player_a = db.query(Player).filter(Player.id == match.a_player_id).first()
            if player_a:
                initial_elo = get_initial_elo(player_a.bjj_belt_rank)
                player_records[match.a_player_id] = {
                    'player_id': player_a.id,
                    'player_name': player_a.name,
                    'photo_url': player_a.photo_url,
                    'belt_rank': player_a.bjj_belt_rank,
                    'elo_rating': player_a.elo_rating,
                    'initial_elo_rating': initial_elo,
                    'wins': 0,
                    'losses': 0,
                    'draws': 0
                }

        # Initialize player B if not seen
        if match.b_player_id not in player_records:
            player_b = db.query(Player).filter(Player.id == match.b_player_id).first()
            if player_b:
                initial_elo = get_initial_elo(player_b.bjj_belt_rank)
                player_records[match.b_player_id] = {
                    'player_id': player_b.id,
                    'player_name': player_b.name,
                    'photo_url': player_b.photo_url,
                    'belt_rank': player_b.bjj_belt_rank,
                    'elo_rating': player_b.elo_rating,
                    'initial_elo_rating': initial_elo,
                    'wins': 0,
                    'losses': 0,
                    'draws': 0
                }

        # Update records
        if match.result == MatchResult.PLAYER_A_WIN:
            player_records[match.a_player_id]['wins'] += 1
            player_records[match.b_player_id]['losses'] += 1
        elif match.result == MatchResult.PLAYER_B_WIN:
            player_records[match.b_player_id]['wins'] += 1
            player_records[match.a_player_id]['losses'] += 1
        else:  # Draw
            player_records[match.a_player_id]['draws'] += 1
            player_records[match.b_player_id]['draws'] += 1

    # Sort players by record, head-to-head, then ELO
    from functools import cmp_to_key

    sorted_players = sorted(
        player_records.values(),
        key=cmp_to_key(lambda a, b: compare_players(a, b, event_id, db))
    )

    # Build ladder entries with ranks
    standings = []
    for i, player_data in enumerate(sorted_players, 1):
        total_matches = player_data['wins'] + player_data['losses'] + player_data['draws']
        win_rate = player_data['wins'] / total_matches if total_matches > 0 else 0.0

        standings.append(LadderEntry(
            rank=i,
            player_id=player_data['player_id'],
            player_name=player_data['player_name'],
            photo_url=player_data['photo_url'],
            belt_rank=player_data['belt_rank'],
            wins=player_data['wins'],
            losses=player_data['losses'],
            draws=player_data['draws'],
            win_rate=win_rate,
            elo_rating=player_data['elo_rating'],
            initial_elo_rating=player_data.get('initial_elo_rating')
        ))

    return LadderResponse(
        event_id=event.id,
        event_name=f"{event.name} - {weight_class_name}",
        event_date=event.date,
        standings=standings
    )
