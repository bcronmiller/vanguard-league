#!/usr/bin/env python3
"""
Initialize ELO ratings for all players based on their belt rank.

Starting ELO ratings (200pt increments):
- Black belt: 2000
- Brown belt: 1800
- Purple belt: 1600
- Blue belt: 1400
- White belt: 1200
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/backend')

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.player import Player
from app.models.match import Match, MatchResult
from app.models.event import Event
from sqlalchemy import or_
import math

# Belt-based starting ELO ratings (200pt increments)
BELT_ELO = {
    "Black": 2000,
    "Brown": 1800,
    "Purple": 1600,
    "Blue": 1400,
    "White": 1200
}


def get_starting_elo(belt_rank: str | None) -> float:
    """Get starting ELO rating based on belt rank"""
    if not belt_rank:
        return BELT_ELO["Blue"]  # Default to Blue belt

    # Normalize belt rank (capitalize first letter)
    belt = belt_rank.strip().capitalize()
    return BELT_ELO.get(belt, BELT_ELO["Blue"])


def calculate_expected_score(rating_a: float, rating_b: float) -> float:
    """
    Calculate expected score for player A using standard ELO formula.
    Returns probability that player A will win (0.0 to 1.0)
    """
    return 1 / (1 + math.pow(10, (rating_b - rating_a) / 400))


def calculate_elo_change(
    rating: float,
    opponent_rating: float,
    actual_score: float,
    matches_played: int
) -> float:
    """
    Calculate ELO rating change after a match.

    Args:
        rating: Player's current ELO rating
        opponent_rating: Opponent's current ELO rating
        actual_score: 1.0 for win, 0.5 for draw, 0.0 for loss
        matches_played: Number of matches player has played (for K-factor)

    Returns:
        Change in ELO rating (positive or negative)
    """
    # K-factor: 32 for new players (<10 matches), 24 for established players
    k_factor = 32 if matches_played < 10 else 24

    expected = calculate_expected_score(rating, opponent_rating)
    return k_factor * (actual_score - expected)


def initialize_player_elos(db: Session):
    """Initialize all players with belt-based starting ELO"""
    players = db.query(Player).filter(Player.active == True).all()

    print("\n=== Initializing Player ELO Ratings ===\n")

    for player in players:
        starting_elo = get_starting_elo(player.bjj_belt_rank)
        player.elo_rating = starting_elo

        # Set weight-class-specific initial ELO for tracking gain/loss
        player.initial_elo_lightweight = starting_elo
        player.initial_elo_middleweight = starting_elo
        player.initial_elo_heavyweight = starting_elo

        print(f"{player.name:25} | {player.bjj_belt_rank or 'Unknown':8} belt → ELO: {starting_elo:.0f}")

    db.commit()
    print(f"\n✅ Initialized ELO ratings for {len(players)} players")


def process_vgl1_matches(db: Session):
    """Process VGL 1 matches chronologically to calculate ELO ratings"""

    # Get VGL 1 event
    vgl1 = db.query(Event).filter(Event.name == "VGL 1").first()
    if not vgl1:
        print("❌ VGL 1 event not found")
        return

    # Get all VGL 1 matches
    matches = db.query(Match).filter(
        Match.event_id == vgl1.id
    ).order_by(Match.created_at.asc()).all()

    if not matches:
        print("❌ No matches found for VGL 1")
        return

    print(f"\n=== Processing {len(matches)} VGL 1 Matches ===\n")

    # Track matches played per player for K-factor calculation
    matches_played = {}

    for match in matches:
        player_a = db.query(Player).filter(Player.id == match.a_player_id).first()
        player_b = db.query(Player).filter(Player.id == match.b_player_id).first()

        if not player_a or not player_b:
            print(f"⚠️  Skipping match {match.id}: Missing player")
            continue

        # Get current match count for each player
        a_matches = matches_played.get(player_a.id, 0)
        b_matches = matches_played.get(player_b.id, 0)

        # Get current ratings
        rating_a = player_a.elo_rating or get_starting_elo(player_a.bjj_belt_rank)
        rating_b = player_b.elo_rating or get_starting_elo(player_b.bjj_belt_rank)

        # Determine actual scores
        if match.result == MatchResult.PLAYER_A_WIN:
            score_a, score_b = 1.0, 0.0
            result_str = f"{player_a.name} def. {player_b.name}"
        elif match.result == MatchResult.PLAYER_B_WIN:
            score_a, score_b = 0.0, 1.0
            result_str = f"{player_b.name} def. {player_a.name}"
        else:  # Draw
            score_a, score_b = 0.5, 0.5
            result_str = f"{player_a.name} vs {player_b.name} (Draw)"

        # Calculate ELO changes
        change_a = calculate_elo_change(rating_a, rating_b, score_a, a_matches)
        change_b = calculate_elo_change(rating_b, rating_a, score_b, b_matches)

        # Update ratings
        new_rating_a = rating_a + change_a
        new_rating_b = rating_b + change_b

        player_a.elo_rating = new_rating_a
        player_b.elo_rating = new_rating_b

        # Update match counts
        matches_played[player_a.id] = a_matches + 1
        matches_played[player_b.id] = b_matches + 1

        # Display result
        print(f"Match {match.id}: {result_str}")
        print(f"  {player_a.name:20} {rating_a:7.1f} → {new_rating_a:7.1f} ({change_a:+6.1f})")
        print(f"  {player_b.name:20} {rating_b:7.1f} → {new_rating_b:7.1f} ({change_b:+6.1f})")
        print()

    db.commit()
    print(f"✅ Processed {len(matches)} matches")


def display_final_ratings(db: Session):
    """Display final ELO ratings for all players"""
    players = db.query(Player).filter(
        Player.active == True,
        Player.elo_rating.isnot(None)
    ).order_by(Player.elo_rating.desc()).all()

    print("\n=== Final ELO Ratings ===\n")
    print(f"{'Rank':<6} {'Player':<25} {'Belt':<8} {'ELO':<8}")
    print("-" * 55)

    for i, player in enumerate(players, 1):
        print(f"{i:<6} {player.name:<25} {player.bjj_belt_rank or 'Unknown':<8} {player.elo_rating:7.1f}")

    print()


if __name__ == "__main__":
    db = next(get_db())

    try:
        # Step 1: Initialize all players with belt-based starting ELO
        initialize_player_elos(db)

        # Step 2: Process VGL 1 matches to update ratings
        process_vgl1_matches(db)

        # Step 3: Display final ratings
        display_final_ratings(db)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
