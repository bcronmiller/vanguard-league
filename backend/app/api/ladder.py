from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
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
from app.services.elo_service import get_starting_elo


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


def build_head_to_head_lookup(matches: List[Match]) -> dict:
    """
    Build an in-memory lookup for head-to-head records from a list of matches.
    Returns dict keyed by (player_a_id, player_b_id) -> (a_wins, b_wins)
    """
    from collections import defaultdict

    # Store both directions for easy lookup
    h2h = defaultdict(lambda: [0, 0])  # [a_wins, b_wins]

    for match in matches:
        if not match.a_player_id or not match.b_player_id:
            continue
        if match.result == MatchResult.NO_CONTEST:
            continue

        # Normalize key (smaller ID first)
        key = tuple(sorted([match.a_player_id, match.b_player_id]))

        # Determine winner
        if match.result == MatchResult.PLAYER_A_WIN:
            winner = match.a_player_id
        elif match.result == MatchResult.PLAYER_B_WIN:
            winner = match.b_player_id
        else:
            continue  # Skip draws

        # Increment winner's count
        if winner == key[0]:
            h2h[key][0] += 1
        else:
            h2h[key][1] += 1

    return dict(h2h)


def get_head_to_head_from_lookup(player_a_id: int, player_b_id: int, h2h_lookup: dict) -> tuple[int, int]:
    """
    Get head-to-head record between two players from preloaded lookup.
    Returns (player_a_wins, player_b_wins)
    """
    key = tuple(sorted([player_a_id, player_b_id]))
    wins = h2h_lookup.get(key, [0, 0])

    # Return in correct order
    if key[0] == player_a_id:
        return (wins[0], wins[1])
    else:
        return (wins[1], wins[0])


def get_head_to_head_record(player_a_id: int, player_b_id: int, event_id: int, db: Session) -> tuple[int, int]:
    """
    DEPRECATED: Use build_head_to_head_lookup() and get_head_to_head_from_lookup() instead.
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
        if match.result == MatchResult.NO_CONTEST:
            continue
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


def compare_players(a: dict, b: dict, h2h_lookup: dict = None, event_id: int = None, db: Session = None) -> int:
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
    if h2h_lookup is not None:
        # Use optimized lookup
        a_h2h_wins, b_h2h_wins = get_head_to_head_from_lookup(a['player_id'], b['player_id'], h2h_lookup)
    elif event_id and db:
        # Fallback to database query (deprecated)
        a_h2h_wins, b_h2h_wins = get_head_to_head_record(a['player_id'], b['player_id'], event_id, db)
    else:
        a_h2h_wins, b_h2h_wins = 0, 0

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
    # Get all players with their weight class eager loaded
    players = db.query(Player).options(
        joinedload(Player.weight_class)
    ).all()

    # Create a player lookup dict
    player_lookup = {p.id: p for p in players}

    # Get all matches with results in one query
    matches = db.query(Match).filter(Match.result.isnot(None)).all()

    # Calculate records for all players in memory
    player_records = {}

    for match in matches:
        # Track player A
        if match.a_player_id not in player_records:
            player_records[match.a_player_id] = {'wins': 0, 'losses': 0, 'draws': 0}

        # Track player B
        if match.b_player_id not in player_records:
            player_records[match.b_player_id] = {'wins': 0, 'losses': 0, 'draws': 0}

        # Update records
        if match.result == MatchResult.PLAYER_A_WIN:
            player_records[match.a_player_id]['wins'] += 1
            player_records[match.b_player_id]['losses'] += 1
        elif match.result == MatchResult.PLAYER_B_WIN:
            player_records[match.b_player_id]['wins'] += 1
            player_records[match.a_player_id]['losses'] += 1
        elif match.result == MatchResult.DRAW:
            player_records[match.a_player_id]['draws'] += 1
            player_records[match.b_player_id]['draws'] += 1

    # Build standings from players with matches
    standings = []

    for player_id, record in player_records.items():
        if player_id not in player_lookup:
            continue

        player = player_lookup[player_id]

        # Get weight class name
        weight_class_name = None
        if player.weight_class:
            weight_class_name = player.weight_class.name

        # For P4P (overall), use belt-based starting ELO
        initial_elo = get_starting_elo(player.bjj_belt_rank)

        standings.append({
            "player": {
                "id": player.id,
                "name": player.name,
                "bjj_belt_rank": player.bjj_belt_rank,
                "weight": player.weight,
                "weight_class_name": weight_class_name,
                "elo_rating": player.elo_rating,
                "initial_elo_rating": initial_elo,
                "photo_url": player.photo_url,
                "academy": player.academy
            },
            "wins": record['wins'],
            "losses": record['losses'],
            "draws": record['draws']
        })

    # Build head-to-head lookup from all matches (O(n) instead of O(n²))
    h2h_lookup = build_head_to_head_lookup(matches)

    # Convert standings to player_records format for compare_players
    player_records = []
    for standing in standings:
        player_records.append({
            'player_id': standing['player']['id'],
            'player_name': standing['player']['name'],
            'photo_url': standing['player']['photo_url'],
            'belt_rank': standing['player']['bjj_belt_rank'],
            'elo_rating': standing['player']['elo_rating'],
            'initial_elo_rating': standing['player']['initial_elo_rating'],
            'wins': standing['wins'],
            'losses': standing['losses'],
            'draws': standing['draws']
        })

    # Sort by ELO gain (performance vs. expectations), head-to-head, then absolute ELO
    from functools import cmp_to_key
    sorted_players = sorted(
        player_records,
        key=cmp_to_key(lambda a, b: compare_players(a, b, h2h_lookup=h2h_lookup))
    )

    # Rebuild standings in correct order
    final_standings = []
    for player_data in sorted_players:
        final_standings.append({
            "player": {
                "id": player_data['player_id'],
                "name": player_data['player_name'],
                "bjj_belt_rank": player_data['belt_rank'],
                "weight": next(s['player']['weight'] for s in standings if s['player']['id'] == player_data['player_id']),
                "weight_class_name": next(s['player']['weight_class_name'] for s in standings if s['player']['id'] == player_data['player_id']),
                "elo_rating": player_data['elo_rating'],
                "initial_elo_rating": player_data['initial_elo_rating'],
                "photo_url": player_data['photo_url'],
                "academy": next(s['player']['academy'] for s in standings if s['player']['id'] == player_data['player_id'])
            },
            "wins": player_data['wins'],
            "losses": player_data['losses'],
            "draws": player_data['draws']
        })

    return final_standings


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

    # Get all matches for this event with players eager loaded
    matches = db.query(Match).filter(
        Match.event_id == event_id
    ).options(
        joinedload(Match.player_a),
        joinedload(Match.player_b)
    ).all()

    # Calculate records for each player
    player_records = {}

    for match in matches:
        # Initialize player A if not seen
        if match.a_player_id not in player_records and match.player_a:
            player_a = match.player_a
            initial_elo = get_starting_elo(player_a.bjj_belt_rank)
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
        if match.b_player_id not in player_records and match.player_b:
            player_b = match.player_b
            initial_elo = get_starting_elo(player_b.bjj_belt_rank)
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

        # Update records (skip if either player is None - byes or TBD matches)
        if match.a_player_id is None or match.b_player_id is None:
            continue

        # Skip NO_CONTEST matches
        if match.result == MatchResult.NO_CONTEST:
            continue

        if match.result == MatchResult.PLAYER_A_WIN:
            player_records[match.a_player_id]['wins'] += 1
            player_records[match.b_player_id]['losses'] += 1
        elif match.result == MatchResult.PLAYER_B_WIN:
            player_records[match.b_player_id]['wins'] += 1
            player_records[match.a_player_id]['losses'] += 1
        elif match.result == MatchResult.DRAW:
            player_records[match.a_player_id]['draws'] += 1
            player_records[match.b_player_id]['draws'] += 1

    # Build head-to-head lookup from matches (O(n) instead of O(n²))
    h2h_lookup = build_head_to_head_lookup(matches)

    # Sort players using head-to-head tiebreaker
    from functools import cmp_to_key

    sorted_players = sorted(
        player_records.values(),
        key=cmp_to_key(lambda a, b: compare_players(a, b, h2h_lookup=h2h_lookup))
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


@router.get("/ladder/weight-class/{weight_class_name}", response_model=LadderResponse)
async def get_cumulative_ladder_by_weight_class(
    weight_class_name: str,
    db: Session = Depends(get_db)
):
    """
    Get cumulative ladder standings for a specific weight class across ALL events.

    Only includes fighters who competed in this weight class across any event.
    Rankings determined by:
    1. ELO gain from starting rating (performance vs. expectations)
    2. Head-to-head record (if tied)
    3. Absolute ELO rating (final tiebreaker)
    """
    # Get weight class
    weight_class = db.query(WeightClass).filter(WeightClass.name == weight_class_name).first()
    if not weight_class:
        raise HTTPException(status_code=404, detail="Weight class not found")

    # Get all matches fought at this weight class across ALL events with players eager loaded
    matches = db.query(Match).filter(
        Match.weight_class_id == weight_class.id,
        Match.result.isnot(None)
    ).options(
        joinedload(Match.player_a),
        joinedload(Match.player_b)
    ).all()

    if not matches:
        # Return empty standings if no matches in this weight class
        # Use first event or create placeholder
        first_event = db.query(Event).order_by(Event.date.asc()).first()
        return LadderResponse(
            event_id=first_event.id if first_event else 0,
            event_name=f"All Events - {weight_class_name}",
            event_date=first_event.date if first_event else datetime.now(),
            standings=[]
        )

    # Determine which ELO field to use for this weight class
    elo_field_map = {
        'Lightweight': ('elo_lightweight', 'initial_elo_lightweight'),
        'Middleweight': ('elo_middleweight', 'initial_elo_middleweight'),
        'Heavyweight': ('elo_heavyweight', 'initial_elo_heavyweight')
    }
    elo_field, initial_elo_field = elo_field_map.get(weight_class_name, ('elo_rating', None))

    # Calculate records for each player in this weight class
    player_records = {}

    for match in matches:
        # Initialize player A if not seen
        if match.a_player_id not in player_records and match.player_a:
            player_a = match.player_a
            current_elo = getattr(player_a, elo_field, None) or get_starting_elo(player_a.bjj_belt_rank)
            initial_elo = getattr(player_a, initial_elo_field, None) if initial_elo_field else get_starting_elo(player_a.bjj_belt_rank)
            player_records[match.a_player_id] = {
                'player_id': player_a.id,
                'player_name': player_a.name,
                'photo_url': player_a.photo_url,
                'belt_rank': player_a.bjj_belt_rank,
                'elo_rating': current_elo,
                'initial_elo_rating': initial_elo,
                'wins': 0,
                'losses': 0,
                'draws': 0
            }

        # Initialize player B if not seen
        if match.b_player_id not in player_records and match.player_b:
            player_b = match.player_b
            current_elo = getattr(player_b, elo_field, None) or get_starting_elo(player_b.bjj_belt_rank)
            initial_elo = getattr(player_b, initial_elo_field, None) if initial_elo_field else get_starting_elo(player_b.bjj_belt_rank)
            player_records[match.b_player_id] = {
                'player_id': player_b.id,
                'player_name': player_b.name,
                'photo_url': player_b.photo_url,
                'belt_rank': player_b.bjj_belt_rank,
                'elo_rating': current_elo,
                'initial_elo_rating': initial_elo,
                'wins': 0,
                'losses': 0,
                'draws': 0
            }

        # Update records (skip if either player is None - byes or TBD matches)
        if match.a_player_id is None or match.b_player_id is None:
            continue

        # Skip NO_CONTEST matches
        if match.result == MatchResult.NO_CONTEST:
            continue

        if match.result == MatchResult.PLAYER_A_WIN:
            player_records[match.a_player_id]['wins'] += 1
            player_records[match.b_player_id]['losses'] += 1
        elif match.result == MatchResult.PLAYER_B_WIN:
            player_records[match.b_player_id]['wins'] += 1
            player_records[match.a_player_id]['losses'] += 1
        elif match.result == MatchResult.DRAW:
            player_records[match.a_player_id]['draws'] += 1
            player_records[match.b_player_id]['draws'] += 1

    # Build head-to-head lookup from matches (O(n) instead of O(n²))
    h2h_lookup = build_head_to_head_lookup(matches)

    # Sort players by ELO gain, head-to-head, then absolute ELO
    from functools import cmp_to_key

    sorted_players = sorted(
        player_records.values(),
        key=cmp_to_key(lambda a, b: compare_players(a, b, h2h_lookup=h2h_lookup))
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

    # Use most recent event for metadata
    most_recent_event = db.query(Event).order_by(Event.date.desc()).first()

    return LadderResponse(
        event_id=0,  # Use 0 to indicate this is cumulative across all events
        event_name=f"All Events - {weight_class_name}",
        event_date=most_recent_event.date if most_recent_event else datetime.now(),
        standings=standings
    )


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

    # Get all matches for this event fought at this weight class with players eager loaded
    matches = db.query(Match).filter(
        Match.event_id == event_id,
        Match.weight_class_id == weight_class.id,
        Match.result.isnot(None)
    ).options(
        joinedload(Match.player_a),
        joinedload(Match.player_b)
    ).all()

    if not matches:
        # Return empty standings if no matches in this weight class
        return LadderResponse(
            event_id=event.id,
            event_name=f"{event.name} - {weight_class_name}",
            event_date=event.date,
            standings=[]
        )

    # Determine which ELO field to use for this weight class
    elo_field_map = {
        'Lightweight': ('elo_lightweight', 'initial_elo_lightweight'),
        'Middleweight': ('elo_middleweight', 'initial_elo_middleweight'),
        'Heavyweight': ('elo_heavyweight', 'initial_elo_heavyweight')
    }
    elo_field, initial_elo_field = elo_field_map.get(weight_class_name, ('elo_rating', None))

    # Calculate records for each player in this weight class
    player_records = {}

    for match in matches:

        # Initialize player A if not seen
        if match.a_player_id not in player_records and match.player_a:
            player_a = match.player_a
            current_elo = getattr(player_a, elo_field, None) or get_starting_elo(player_a.bjj_belt_rank)
            initial_elo = getattr(player_a, initial_elo_field, None) if initial_elo_field else get_starting_elo(player_a.bjj_belt_rank)
            player_records[match.a_player_id] = {
                'player_id': player_a.id,
                'player_name': player_a.name,
                'photo_url': player_a.photo_url,
                'belt_rank': player_a.bjj_belt_rank,
                'elo_rating': current_elo,
                'initial_elo_rating': initial_elo,
                'wins': 0,
                'losses': 0,
                'draws': 0
            }

        # Initialize player B if not seen
        if match.b_player_id not in player_records and match.player_b:
            player_b = match.player_b
            current_elo = getattr(player_b, elo_field, None) or get_starting_elo(player_b.bjj_belt_rank)
            initial_elo = getattr(player_b, initial_elo_field, None) if initial_elo_field else get_starting_elo(player_b.bjj_belt_rank)
            player_records[match.b_player_id] = {
                'player_id': player_b.id,
                'player_name': player_b.name,
                'photo_url': player_b.photo_url,
                'belt_rank': player_b.bjj_belt_rank,
                'elo_rating': current_elo,
                'initial_elo_rating': initial_elo,
                'wins': 0,
                'losses': 0,
                'draws': 0
            }

        # Update records (skip if either player is None - byes or TBD matches)
        if match.a_player_id is None or match.b_player_id is None:
            continue

        # Skip NO_CONTEST matches
        if match.result == MatchResult.NO_CONTEST:
            continue

        if match.result == MatchResult.PLAYER_A_WIN:
            player_records[match.a_player_id]['wins'] += 1
            player_records[match.b_player_id]['losses'] += 1
        elif match.result == MatchResult.PLAYER_B_WIN:
            player_records[match.b_player_id]['wins'] += 1
            player_records[match.a_player_id]['losses'] += 1
        elif match.result == MatchResult.DRAW:
            player_records[match.a_player_id]['draws'] += 1
            player_records[match.b_player_id]['draws'] += 1

    # Build head-to-head lookup from matches (O(n) instead of O(n²))
    h2h_lookup = build_head_to_head_lookup(matches)

    # Sort players by record, head-to-head, then ELO
    from functools import cmp_to_key

    sorted_players = sorted(
        player_records.values(),
        key=cmp_to_key(lambda a, b: compare_players(a, b, h2h_lookup=h2h_lookup))
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
