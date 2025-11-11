"""
ELO Rating Service

Provides ELO calculation functions for match predictions and rating updates.
"""

import math
from typing import Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.player import Player
from app.models.match import Match, MatchResult

# Belt-based starting ELO ratings
BELT_ELO = {
    "Black": 2000,
    "Brown": 1600,
    "Purple": 1467,
    "Blue": 1333,
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


def get_player_match_count(db: Session, player_id: int) -> int:
    """Get total number of completed matches for a player"""
    count = db.query(Match).filter(
        or_(
            Match.a_player_id == player_id,
            Match.b_player_id == player_id
        ),
        Match.result.isnot(None)
    ).count()
    return count


def preview_elo_changes(
    db: Session,
    player_a_id: int,
    player_b_id: int
) -> dict:
    """
    Preview ELO changes for all possible match outcomes.

    Args:
        db: Database session
        player_a_id: Player A ID
        player_b_id: Player B ID

    Returns:
        Dictionary with ELO changes for each outcome
    """
    player_a = db.query(Player).filter(Player.id == player_a_id).first()
    player_b = db.query(Player).filter(Player.id == player_b_id).first()

    if not player_a or not player_b:
        raise ValueError("One or both players not found")

    # Get current ratings
    rating_a = player_a.elo_rating or get_starting_elo(player_a.bjj_belt_rank)
    rating_b = player_b.elo_rating or get_starting_elo(player_b.bjj_belt_rank)

    # Get match counts for K-factor
    matches_a = get_player_match_count(db, player_a_id)
    matches_b = get_player_match_count(db, player_b_id)

    # Calculate expected scores
    expected_a = calculate_expected_score(rating_a, rating_b)
    expected_b = 1 - expected_a

    # Calculate changes for each outcome
    # Player A wins
    a_win_change_a = calculate_elo_change(rating_a, rating_b, 1.0, matches_a)
    a_win_change_b = calculate_elo_change(rating_b, rating_a, 0.0, matches_b)

    # Player B wins
    b_win_change_a = calculate_elo_change(rating_a, rating_b, 0.0, matches_a)
    b_win_change_b = calculate_elo_change(rating_b, rating_a, 1.0, matches_b)

    # Draw
    draw_change_a = calculate_elo_change(rating_a, rating_b, 0.5, matches_a)
    draw_change_b = calculate_elo_change(rating_b, rating_a, 0.5, matches_b)

    return {
        "player_a": {
            "id": player_a.id,
            "name": player_a.name,
            "current_elo": round(rating_a, 1),
            "matches_played": matches_a,
            "expected_score": round(expected_a * 100, 1),  # As percentage
        },
        "player_b": {
            "id": player_b.id,
            "name": player_b.name,
            "current_elo": round(rating_b, 1),
            "matches_played": matches_b,
            "expected_score": round(expected_b * 100, 1),  # As percentage
        },
        "outcomes": {
            "player_a_wins": {
                "player_a_change": round(a_win_change_a, 1),
                "player_b_change": round(a_win_change_b, 1),
                "player_a_new_elo": round(rating_a + a_win_change_a, 1),
                "player_b_new_elo": round(rating_b + a_win_change_b, 1),
            },
            "player_b_wins": {
                "player_a_change": round(b_win_change_a, 1),
                "player_b_change": round(b_win_change_b, 1),
                "player_a_new_elo": round(rating_a + b_win_change_a, 1),
                "player_b_new_elo": round(rating_b + b_win_change_b, 1),
            },
            "draw": {
                "player_a_change": round(draw_change_a, 1),
                "player_b_change": round(draw_change_b, 1),
                "player_a_new_elo": round(rating_a + draw_change_a, 1),
                "player_b_new_elo": round(rating_b + draw_change_b, 1),
            }
        }
    }


def get_head_to_head(db: Session, player_a_id: int, player_b_id: int) -> dict:
    """
    Get head-to-head record between two players.

    Args:
        db: Database session
        player_a_id: Player A ID
        player_b_id: Player B ID

    Returns:
        Dictionary with head-to-head stats
    """
    # Get all matches between these two players
    matches = db.query(Match).filter(
        or_(
            (Match.a_player_id == player_a_id) & (Match.b_player_id == player_b_id),
            (Match.a_player_id == player_b_id) & (Match.b_player_id == player_a_id)
        ),
        Match.result.isnot(None)
    ).order_by(Match.created_at.desc()).all()

    player_a_wins = 0
    player_b_wins = 0
    draws = 0

    recent_matches = []

    for match in matches:
        # Determine who won from player_a's perspective
        if match.a_player_id == player_a_id:
            # Player A is player_a in this match
            if match.result == MatchResult.PLAYER_A_WIN:
                player_a_wins += 1
                result = "player_a_win"
            elif match.result == MatchResult.PLAYER_B_WIN:
                player_b_wins += 1
                result = "player_b_win"
            else:
                draws += 1
                result = "draw"
        else:
            # Player A is player_b in this match
            if match.result == MatchResult.PLAYER_B_WIN:
                player_a_wins += 1
                result = "player_a_win"
            elif match.result == MatchResult.PLAYER_A_WIN:
                player_b_wins += 1
                result = "player_b_win"
            else:
                draws += 1
                result = "draw"

        recent_matches.append({
            "match_id": match.id,
            "event_id": match.event_id,
            "result": result,
            "method": match.method,
            "duration_seconds": match.duration_seconds,
            "created_at": match.created_at.isoformat() if match.created_at else None
        })

    return {
        "total_matches": len(matches),
        "player_a_wins": player_a_wins,
        "player_b_wins": player_b_wins,
        "draws": draws,
        "recent_matches": recent_matches[:5]  # Last 5 matches
    }
