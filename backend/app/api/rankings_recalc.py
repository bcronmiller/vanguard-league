from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.player import Player
from app.models.match import Match, MatchResult
from app.models.event import Event

router = APIRouter()


def get_starting_elo(belt_rank: str | None) -> float:
    """Get starting ELO based on belt rank"""
    belt_elo = {
        'Black': 2000.0,
        'Brown': 1600.0,
        'Purple': 1466.67,
        'Blue': 1333.33,
        'White': 1200.0
    }
    return belt_elo.get(belt_rank or 'White', 1200.0)


def calculate_expected_score(rating_a: float, rating_b: float) -> float:
    """Calculate expected score for player A using standard ELO formula"""
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))


def calculate_elo_change(
    rating: float,
    expected: float,
    actual: float,
    matches_played: int
) -> float:
    """
    Calculate ELO rating change.
    K-factor: 32 for new players (<10 matches), 24 for established players
    """
    k_factor = 32 if matches_played < 10 else 24
    return k_factor * (actual - expected)


@router.post("/recalculate-elo")
def recalculate_all_elo(db: Session = Depends(get_db)):
    """
    Recalculate all ELO ratings from scratch by processing all matches chronologically.
    This should be run after an event is completed to update rankings.
    """
    # Reset all ELO ratings to starting values
    players = db.query(Player).all()

    for player in players:
        player.elo_rating = get_starting_elo(player.bjj_belt_rank)

    db.commit()

    # Track match count per player for K-factor calculation
    match_counts = {player.id: 0 for player in players}

    # Get all completed matches, ordered by event date and match ID
    matches = db.query(Match).join(Event).filter(
        Match.result.isnot(None)
    ).order_by(Event.date, Match.id).all()

    processed_count = 0

    for match in matches:
        player_a = db.query(Player).filter_by(id=match.a_player_id).first()
        player_b = db.query(Player).filter_by(id=match.b_player_id).first()

        if not player_a or not player_b:
            continue

        # Get current ratings
        rating_a = player_a.elo_rating or get_starting_elo(player_a.bjj_belt_rank)
        rating_b = player_b.elo_rating or get_starting_elo(player_b.bjj_belt_rank)

        # Calculate expected scores
        expected_a = calculate_expected_score(rating_a, rating_b)
        expected_b = calculate_expected_score(rating_b, rating_a)

        # Determine actual scores based on result
        if match.result == MatchResult.PLAYER_A_WIN:
            actual_a = 1.0
            actual_b = 0.0
        elif match.result == MatchResult.PLAYER_B_WIN:
            actual_a = 0.0
            actual_b = 1.0
        else:  # DRAW
            actual_a = 0.5
            actual_b = 0.5

        # Calculate rating changes
        change_a = calculate_elo_change(
            rating_a,
            expected_a,
            actual_a,
            match_counts[player_a.id]
        )
        change_b = calculate_elo_change(
            rating_b,
            expected_b,
            actual_b,
            match_counts[player_b.id]
        )

        # Store ELO changes in match record
        match.a_elo_change = round(change_a)
        match.b_elo_change = round(change_b)

        # Update ratings
        player_a.elo_rating = rating_a + change_a
        player_b.elo_rating = rating_b + change_b

        # Increment match counts
        match_counts[player_a.id] += 1
        match_counts[player_b.id] += 1

        processed_count += 1

    db.commit()

    # Get updated leaderboard
    leaderboard = []
    for player in sorted(players, key=lambda p: p.elo_rating or 0, reverse=True):
        if match_counts[player.id] > 0:  # Only include fighters with matches
            leaderboard.append({
                "name": player.name,
                "elo_rating": round(player.elo_rating or 0, 1),
                "matches": match_counts[player.id],
                "belt_rank": player.bjj_belt_rank,
                "weight_class": player.weight_class.name if player.weight_class else None
            })

    return {
        "message": "ELO ratings recalculated successfully",
        "matches_processed": processed_count,
        "fighters_updated": len([p for p in players if match_counts[p.id] > 0]),
        "leaderboard": leaderboard[:10]  # Top 10
    }
