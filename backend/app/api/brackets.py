"""
DEPRECATED: Legacy bracket generation API

This module contains the original, simplified bracket generation logic.
It is kept for backward compatibility but should not be used for new features.

⚠️ DEPRECATION NOTICE ⚠️
This API is deprecated. Use the new Tournament API (app.api.tournament) instead.

The new tournament API provides:
- Full bracket management with BracketFormat and BracketRound models
- Proper round progression and match dependencies
- Complete Swiss system with standings tracking and rematch avoidance
- Full double elimination with complete losers bracket structure
- Rest interval tracking and fighter scheduling
- Auto-generation of subsequent rounds

Migration:
- OLD: POST /api/events/{id}/generate-brackets
- NEW: POST /api/tournaments/brackets + POST /api/tournaments/brackets/{id}/generate

This file will be removed in a future release.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Literal
from pydantic import BaseModel
import random
import warnings

from app.core.database import get_db
from app.models.player import Player
from app.models.event import Event
from app.models.entry import Entry
from app.models.match import Match, MatchResult
from app.models.weight_class import WeightClass


router = APIRouter()

# Emit deprecation warning when module is imported
warnings.warn(
    "app.api.brackets is deprecated. Use app.api.tournament instead.",
    DeprecationWarning,
    stacklevel=2
)


class GenerateBracketsRequest(BaseModel):
    format: Literal["single_elimination", "double_elimination", "swiss"]
    rounds: int | None = None  # For swiss format


class MatchPairing(BaseModel):
    match_number: int
    player_a_id: int
    player_a_name: str
    player_b_id: int
    player_b_name: str
    weight_class: str
    round: int | None = None


class BracketResponse(BaseModel):
    event_id: int
    format: str
    matches: List[MatchPairing]
    total_matches: int


@router.post("/events/{event_id}/generate-brackets", response_model=BracketResponse)
def generate_brackets(
    event_id: int,
    request: GenerateBracketsRequest,
    db: Session = Depends(get_db)
):
    """
    Generate brackets/pairings for an event
    - Groups players by weight class
    - Creates pairings based on format (single elim, double elim, swiss)
    - Creates match records in database
    """
    # Verify event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get all checked-in players
    entries = db.query(Entry).filter(
        Entry.event_id == event_id,
        Entry.checked_in == True
    ).all()

    if len(entries) < 2:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least 2 checked-in players to generate brackets (found {len(entries)})"
        )

    # Group by weight class
    weight_class_groups = {}
    for entry in entries:
        wc_id = entry.weight_class_id
        if wc_id not in weight_class_groups:
            weight_class_groups[wc_id] = []
        weight_class_groups[wc_id].append(entry)

    # Generate pairings for each weight class (but don't add to DB yet)
    weight_class_pairings = {}  # wc_name -> list of pairings

    for wc_id, wc_entries in weight_class_groups.items():
        weight_class = db.query(WeightClass).filter_by(id=wc_id).first()
        wc_name = weight_class.name if weight_class else "Unknown"

        players = [db.query(Player).filter_by(id=e.player_id).first() for e in wc_entries]
        players = [p for p in players if p]  # Filter out any None

        if len(players) < 2:
            continue

        # Generate pairings based on format (with temporary match numbers)
        if request.format == "single_elimination":
            pairings = generate_single_elimination(players, wc_name, 0)
        elif request.format == "double_elimination":
            pairings = generate_single_elimination(players, wc_name, 0)  # Start with single elim
        elif request.format == "swiss":
            rounds = request.rounds or 3
            pairings = generate_swiss_round_robin(players, wc_name, 0, rounds)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown format: {request.format}")

        weight_class_pairings[wc_name] = pairings

    # Interleave matches from different weight classes to alternate between them
    all_pairings = []
    wc_names = list(weight_class_pairings.keys())
    wc_indices = {name: 0 for name in wc_names}  # Track current index for each weight class

    # Keep adding matches, rotating through weight classes
    while any(wc_indices[name] < len(weight_class_pairings[name]) for name in wc_names):
        for wc_name in wc_names:
            if wc_indices[wc_name] < len(weight_class_pairings[wc_name]):
                pairing = weight_class_pairings[wc_name][wc_indices[wc_name]]
                # Update match number to maintain sequence
                pairing["match_number"] = len(all_pairings) + 1
                all_pairings.append(pairing)
                wc_indices[wc_name] += 1

    # Now create match records in database with interleaved order
    for pairing in all_pairings:
        match = Match(
            event_id=event_id,
            a_player_id=pairing["player_a_id"],
            b_player_id=pairing["player_b_id"],
            result=None,
            synced_to_rankade=False
        )
        db.add(match)

    db.commit()

    return BracketResponse(
        event_id=event_id,
        format=request.format,
        matches=[MatchPairing(**p) for p in all_pairings],
        total_matches=len(all_pairings)
    )


def generate_single_elimination(players: List[Player], weight_class: str, start_number: int) -> List[dict]:
    """Generate single elimination bracket"""
    pairings = []
    shuffled = players.copy()
    random.shuffle(shuffled)

    # Pair players sequentially
    for i in range(0, len(shuffled) - 1, 2):
        pairings.append({
            "match_number": start_number + len(pairings),
            "player_a_id": shuffled[i].id,
            "player_a_name": shuffled[i].name,
            "player_b_id": shuffled[i + 1].id,
            "player_b_name": shuffled[i + 1].name,
            "weight_class": weight_class,
            "round": 1
        })

    # If odd number, last person gets a bye (we'll handle this in UI)
    if len(shuffled) % 2 == 1:
        # For now, just note that this player advances
        pass

    return pairings


def generate_swiss_round_robin(players: List[Player], weight_class: str, start_number: int, rounds: int) -> List[dict]:
    """
    Generate Swiss system pairings with rest periods
    - Pairs fighters with similar records (Swiss system)
    - Avoids back-to-back matches when possible
    - Tracks who fought in previous round to give rest
    """
    pairings = []
    match_num = start_number

    # Track match history: player_id -> list of opponent IDs
    match_history = {p.id: [] for p in players}

    # Track who fought in the previous round
    previous_round_fighters = set()

    # Track records: player_id -> (wins, losses, draws)
    records = {p.id: [0, 0, 0] for p in players}

    for round_num in range(1, rounds + 1):
        # Separate players into rested and competed (from last round)
        rested = [p for p in players if p.id not in previous_round_fighters]
        competed = [p for p in players if p.id in previous_round_fighters]

        # Sort by record (wins desc, losses asc) for Swiss pairing
        def sort_key(p):
            w, l, d = records[p.id]
            return (-w, l)  # More wins = better, fewer losses = better

        rested.sort(key=sort_key)
        competed.sort(key=sort_key)

        # Track who fights this round
        current_round_fighters = set()
        available_rested = rested.copy()
        available_competed = competed.copy()

        # Pair rested fighters first (prefer similar records)
        while len(available_rested) >= 2:
            player_a = available_rested.pop(0)

            # Find best opponent: similar record, hasn't fought them before
            opponent = None
            for i, player_b in enumerate(available_rested):
                if player_b.id not in match_history[player_a.id]:
                    opponent = available_rested.pop(i)
                    break

            # If no valid rested opponent, try competed fighters
            if not opponent and available_competed:
                for i, player_b in enumerate(available_competed):
                    if player_b.id not in match_history[player_a.id]:
                        opponent = available_competed.pop(i)
                        break

            # Create pairing if we found opponent
            if opponent:
                pairings.append({
                    "match_number": match_num,
                    "player_a_id": player_a.id,
                    "player_a_name": player_a.name,
                    "player_b_id": opponent.id,
                    "player_b_name": opponent.name,
                    "weight_class": weight_class,
                    "round": round_num
                })
                match_history[player_a.id].append(opponent.id)
                match_history[opponent.id].append(player_a.id)
                current_round_fighters.add(player_a.id)
                current_round_fighters.add(opponent.id)
                match_num += 1

        # If one rested fighter left, pair with competed fighter
        if len(available_rested) == 1 and available_competed:
            player_a = available_rested.pop(0)

            for i, player_b in enumerate(available_competed):
                if player_b.id not in match_history[player_a.id]:
                    opponent = available_competed.pop(i)
                    pairings.append({
                        "match_number": match_num,
                        "player_a_id": player_a.id,
                        "player_a_name": player_a.name,
                        "player_b_id": opponent.id,
                        "player_b_name": opponent.name,
                        "weight_class": weight_class,
                        "round": round_num
                    })
                    match_history[player_a.id].append(opponent.id)
                    match_history[opponent.id].append(player_a.id)
                    current_round_fighters.add(player_a.id)
                    current_round_fighters.add(opponent.id)
                    match_num += 1
                    break

        # Last resort: pair competed fighters if needed
        while len(available_competed) >= 2:
            player_a = available_competed.pop(0)

            opponent = None
            for i, player_b in enumerate(available_competed):
                if player_b.id not in match_history[player_a.id]:
                    opponent = available_competed.pop(i)
                    break

            if opponent:
                pairings.append({
                    "match_number": match_num,
                    "player_a_id": player_a.id,
                    "player_a_name": player_a.name,
                    "player_b_id": opponent.id,
                    "player_b_name": opponent.name,
                    "weight_class": weight_class,
                    "round": round_num
                })
                match_history[player_a.id].append(opponent.id)
                match_history[opponent.id].append(player_a.id)
                current_round_fighters.add(player_a.id)
                current_round_fighters.add(opponent.id)
                match_num += 1

        # Update previous round fighters for next iteration
        previous_round_fighters = current_round_fighters.copy()

    return pairings


@router.get("/events/{event_id}/matches", response_model=List[dict])
def get_event_matches(event_id: int, db: Session = Depends(get_db)):
    """Get all matches for an event"""
    matches = db.query(Match).filter(Match.event_id == event_id).all()

    result = []
    for match in matches:
        player_a = db.query(Player).filter_by(id=match.a_player_id).first()
        player_b = db.query(Player).filter_by(id=match.b_player_id).first()

        result.append({
            "id": match.id,
            "match_number": match.id,  # Using ID as match number for now
            "player_a": {
                "id": player_a.id,
                "name": player_a.name,
                "photo_url": player_a.photo_url
            } if player_a else None,
            "player_b": {
                "id": player_b.id,
                "name": player_b.name,
                "photo_url": player_b.photo_url
            } if player_b else None,
            "result": match.result.value if match.result else None,
            "method": match.method,
            "duration_seconds": match.duration_seconds,
            "synced_to_rankade": match.synced_to_rankade
        })

    return result
