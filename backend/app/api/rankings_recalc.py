from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import defaultdict

from app.core.database import get_db
from app.models.player import Player
from app.models.match import Match, MatchResult
from app.models.event import Event
from app.models.weight_class import WeightClass

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

    This maintains:
    - Separate ELO per weight class (elo_lightweight, elo_middleweight, elo_heavyweight)
    - Overall P4P ELO (elo_rating) that considers ALL matches across all divisions

    This should be run after an event is completed to update rankings.
    """
    # Reset all ELO ratings to starting values
    players = db.query(Player).all()
    weight_classes = {wc.id: wc.name.lower() for wc in db.query(WeightClass).all()}

    for player in players:
        starting_elo = get_starting_elo(player.bjj_belt_rank)

        # Reset weight-class-specific ratings
        player.elo_lightweight = starting_elo
        player.elo_middleweight = starting_elo
        player.elo_heavyweight = starting_elo

        # Reset P4P (overall) rating
        player.elo_rating = starting_elo

        # Set initial ratings for tracking gains/losses
        player.initial_elo_lightweight = starting_elo
        player.initial_elo_middleweight = starting_elo
        player.initial_elo_heavyweight = starting_elo

    db.commit()

    # Track match count per player per weight class for K-factor calculation
    # match_counts[player_id][weight_class_name] = count
    match_counts = defaultdict(lambda: defaultdict(int))

    # Also track overall match count for P4P rating
    p4p_match_counts = {player.id: 0 for player in players}

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

        # Determine which weight class this match was fought at
        if not match.weight_class_id:
            # Skip matches without a weight class assignment
            continue

        weight_class_name = weight_classes.get(match.weight_class_id, '').lower()

        if not weight_class_name:
            continue

        # Get current ratings for this weight class
        if weight_class_name == 'lightweight':
            rating_a_wc = player_a.elo_lightweight or get_starting_elo(player_a.bjj_belt_rank)
            rating_b_wc = player_b.elo_lightweight or get_starting_elo(player_b.bjj_belt_rank)
        elif weight_class_name == 'middleweight':
            rating_a_wc = player_a.elo_middleweight or get_starting_elo(player_a.bjj_belt_rank)
            rating_b_wc = player_b.elo_middleweight or get_starting_elo(player_b.bjj_belt_rank)
        elif weight_class_name == 'heavyweight':
            rating_a_wc = player_a.elo_heavyweight or get_starting_elo(player_a.bjj_belt_rank)
            rating_b_wc = player_b.elo_heavyweight or get_starting_elo(player_b.bjj_belt_rank)
        else:
            continue

        # Get current P4P ratings
        rating_a_p4p = player_a.elo_rating or get_starting_elo(player_a.bjj_belt_rank)
        rating_b_p4p = player_b.elo_rating or get_starting_elo(player_b.bjj_belt_rank)

        # Calculate expected scores (using weight-class-specific ratings)
        expected_a = calculate_expected_score(rating_a_wc, rating_b_wc)
        expected_b = calculate_expected_score(rating_b_wc, rating_a_wc)

        # Calculate expected scores for P4P (using P4P ratings)
        expected_a_p4p = calculate_expected_score(rating_a_p4p, rating_b_p4p)
        expected_b_p4p = calculate_expected_score(rating_b_p4p, rating_a_p4p)

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

        # Calculate rating changes for weight-class-specific ELO
        change_a_wc = calculate_elo_change(
            rating_a_wc,
            expected_a,
            actual_a,
            match_counts[player_a.id][weight_class_name]
        )
        change_b_wc = calculate_elo_change(
            rating_b_wc,
            expected_b,
            actual_b,
            match_counts[player_b.id][weight_class_name]
        )

        # Calculate rating changes for P4P ELO
        change_a_p4p = calculate_elo_change(
            rating_a_p4p,
            expected_a_p4p,
            actual_a,
            p4p_match_counts[player_a.id]
        )
        change_b_p4p = calculate_elo_change(
            rating_b_p4p,
            expected_b_p4p,
            actual_b,
            p4p_match_counts[player_b.id]
        )

        # Store ELO changes in match record (using weight-class-specific changes)
        match.a_elo_change = round(change_a_wc)
        match.b_elo_change = round(change_b_wc)

        # Update weight-class-specific ratings
        if weight_class_name == 'lightweight':
            player_a.elo_lightweight = rating_a_wc + change_a_wc
            player_b.elo_lightweight = rating_b_wc + change_b_wc
        elif weight_class_name == 'middleweight':
            player_a.elo_middleweight = rating_a_wc + change_a_wc
            player_b.elo_middleweight = rating_b_wc + change_b_wc
        elif weight_class_name == 'heavyweight':
            player_a.elo_heavyweight = rating_a_wc + change_a_wc
            player_b.elo_heavyweight = rating_b_wc + change_b_wc

        # Update P4P (overall) ratings
        player_a.elo_rating = rating_a_p4p + change_a_p4p
        player_b.elo_rating = rating_b_p4p + change_b_p4p

        # Increment match counts
        match_counts[player_a.id][weight_class_name] += 1
        match_counts[player_b.id][weight_class_name] += 1
        p4p_match_counts[player_a.id] += 1
        p4p_match_counts[player_b.id] += 1

        processed_count += 1

    db.commit()

    # Get updated leaderboard (P4P - overall)
    leaderboard = []
    for player in sorted(players, key=lambda p: p.elo_rating or 0, reverse=True):
        if p4p_match_counts[player.id] > 0:  # Only include fighters with matches
            # Calculate total matches across all weight classes
            total_matches = sum(match_counts[player.id].values())

            leaderboard.append({
                "name": player.name,
                "elo_p4p": round(player.elo_rating or 0, 1),
                "elo_lw": round(player.elo_lightweight or 0, 1) if match_counts[player.id]['lightweight'] > 0 else None,
                "elo_mw": round(player.elo_middleweight or 0, 1) if match_counts[player.id]['middleweight'] > 0 else None,
                "elo_hw": round(player.elo_heavyweight or 0, 1) if match_counts[player.id]['heavyweight'] > 0 else None,
                "matches_total": total_matches,
                "matches_lw": match_counts[player.id]['lightweight'],
                "matches_mw": match_counts[player.id]['middleweight'],
                "matches_hw": match_counts[player.id]['heavyweight'],
                "belt_rank": player.bjj_belt_rank,
                "assigned_weight_class": player.weight_class.name if player.weight_class else None
            })

    return {
        "message": "ELO ratings recalculated successfully",
        "matches_processed": processed_count,
        "fighters_updated": len([p for p in players if p4p_match_counts[p.id] > 0]),
        "leaderboard": leaderboard[:15]  # Top 15
    }
