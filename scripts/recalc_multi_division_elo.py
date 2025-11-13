#!/usr/bin/env python3
"""
Recalculate multi-division ELO ratings.

Each fighter tracks separate ELO ratings for each weight class they compete in,
plus an overall P4P rating.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/backend')

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.player import Player
from app.models.match import Match, MatchResult
from app.models.weight_class import WeightClass
from sqlalchemy import or_
import math

# Belt-based starting ELO ratings
BELT_ELO = {
    "Black": 2000,
    "Brown": 1800,
    "Purple": 1600,
    "Blue": 1400,
    "White": 1200
}

def get_starting_elo(belt_rank: str | None) -> float:
    belt = (belt_rank or "Blue").strip().capitalize()
    return BELT_ELO.get(belt, 1400)

def calculate_expected_score(rating_a: float, rating_b: float) -> float:
    return 1 / (1 + math.pow(10, (rating_b - rating_a) / 400))

def calculate_elo_change(rating: float, opponent_rating: float, actual_score: float, matches_played: int) -> float:
    k_factor = 32 if matches_played < 10 else 24
    expected = calculate_expected_score(rating, opponent_rating)
    return k_factor * (actual_score - expected)

def main():
    db = next(get_db())

    # Initialize all players with starting ELO for each weight class
    players = db.query(Player).filter(Player.active == True).all()

    print("\n=== Initializing Multi-Division ELO Ratings ===\n")

    for player in players:
        starting_elo = get_starting_elo(player.bjj_belt_rank)

        # Set starting ELO for each weight class
        player.elo_lightweight = starting_elo
        player.elo_middleweight = starting_elo
        player.elo_heavyweight = starting_elo
        player.elo_rating = starting_elo  # P4P overall

        # Track initial values
        player.initial_elo_lightweight = starting_elo
        player.initial_elo_middleweight = starting_elo
        player.initial_elo_heavyweight = starting_elo

        print(f"{player.name:40} | {player.bjj_belt_rank or 'Unknown':8} → {starting_elo:.0f}")

    db.commit()

    # Get all matches from VGL 1, ordered chronologically
    matches = db.query(Match).filter(
        Match.event_id == 1,
        Match.result.isnot(None),
        Match.weight_class_id.isnot(None)
    ).order_by(Match.id).all()

    # Track match counts per weight class for each player
    match_counts = {}  # {player_id: {weight_class_id: count}}

    print(f"\n=== Processing {len(matches)} VGL 1 Matches ===\n")

    for match in matches:
        wc = db.query(WeightClass).filter(WeightClass.id == match.weight_class_id).first()
        wc_name = wc.name if wc else "Unknown"

        player_a = match.player_a
        player_b = match.player_b

        if not player_a or not player_b:
            continue

        # Initialize match counts
        if player_a.id not in match_counts:
            match_counts[player_a.id] = {1: 0, 2: 0, 3: 0}
        if player_b.id not in match_counts:
            match_counts[player_b.id] = {1: 0, 2: 0, 3: 0}

        # Get current ELO for this weight class
        elo_field_map = {
            1: 'elo_lightweight',
            2: 'elo_middleweight',
            3: 'elo_heavyweight'
        }

        elo_field = elo_field_map.get(match.weight_class_id, 'elo_rating')

        rating_a = getattr(player_a, elo_field)
        rating_b = getattr(player_b, elo_field)

        # Determine actual scores
        if match.result == MatchResult.PLAYER_A_WIN:
            score_a, score_b = 1.0, 0.0
            result_str = f"{player_a.name} def. {player_b.name}"
        elif match.result == MatchResult.PLAYER_B_WIN:
            score_a, score_b = 0.0, 1.0
            result_str = f"{player_b.name} def. {player_a.name}"
        else:  # DRAW
            score_a, score_b = 0.5, 0.5
            result_str = f"{player_a.name} vs {player_b.name} (DRAW)"

        # Calculate ELO changes for this weight class
        matches_a = match_counts[player_a.id][match.weight_class_id]
        matches_b = match_counts[player_b.id][match.weight_class_id]

        change_a = calculate_elo_change(rating_a, rating_b, score_a, matches_a)
        change_b = calculate_elo_change(rating_b, rating_a, score_b, matches_b)

        # Update weight-class-specific ELO
        setattr(player_a, elo_field, rating_a + change_a)
        setattr(player_b, elo_field, rating_b + change_b)

        # Also update overall P4P rating
        player_a.elo_rating += change_a
        player_b.elo_rating += change_b

        # Store ELO change in match
        match.a_elo_change = int(round(change_a))
        match.b_elo_change = int(round(change_b))

        # Increment match counts
        match_counts[player_a.id][match.weight_class_id] += 1
        match_counts[player_b.id][match.weight_class_id] += 1

        print(f"{wc_name:12} | {result_str:60} | A: {change_a:+.0f}  B: {change_b:+.0f}")

    db.commit()

    # Display final ratings
    print("\n=== Final Multi-Division ELO Ratings ===\n")

    for player in players:
        divisions_competed = []

        if player.id in match_counts:
            if match_counts[player.id][1] > 0:
                divisions_competed.append(f"LW: {player.elo_lightweight:.0f}")
            if match_counts[player.id][2] > 0:
                divisions_competed.append(f"MW: {player.elo_middleweight:.0f}")
            if match_counts[player.id][3] > 0:
                divisions_competed.append(f"HW: {player.elo_heavyweight:.0f}")

        if divisions_competed:
            print(f"{player.name:40} | P4P: {player.elo_rating:.0f} | {' | '.join(divisions_competed)}")

    print("\n✅ Multi-division ELO calculation complete!")

if __name__ == "__main__":
    main()
