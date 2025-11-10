"""
Badge system for fighter achievements
"""
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.match import Match, MatchResult
from app.models.player import Player


def get_player_badges(player_id: int, db: Session) -> List[Dict]:
    """
    Calculate which badges a player has earned based on their match history

    Returns a list of badge dicts with: name, description, icon
    """
    badges = []

    # Get all wins for this player
    wins_as_a = db.query(Match).filter(
        Match.a_player_id == player_id,
        Match.result == MatchResult.PLAYER_A_WIN,
        Match.method.isnot(None)
    ).all()

    wins_as_b = db.query(Match).filter(
        Match.b_player_id == player_id,
        Match.result == MatchResult.PLAYER_B_WIN,
        Match.method.isnot(None)
    ).all()

    all_wins = wins_as_a + wins_as_b

    if len(all_wins) == 0:
        return badges

    # Extract submission methods
    methods = [w.method for w in all_wins if w.method]

    if len(methods) == 0:
        return badges

    # FOOTSIE BADGE - All wins via leg locks
    leg_lock_methods = ['heel hook', 'ankle lock', 'toe hold', 'kneebar', 'knee bar']
    all_leg_locks = all([
        any(ll in method.lower() for ll in leg_lock_methods)
        for method in methods
    ])

    if all_leg_locks and len(methods) >= 2:  # Minimum 2 wins to earn badge
        badges.append({
            "name": "Footsie",
            "description": f"All {len(methods)} wins by leg locks",
            "icon": "🦶"
        })

    # DARCE KNIGHT BADGE - All wins via Darce choke (Dark Knight!)
    all_darce = all(['darce' in method.lower() for method in methods])

    if all_darce and len(methods) >= 3:  # Minimum 3 wins
        badges.append({
            "name": "Darce Knight",
            "description": f"All {len(methods)} wins by Darce choke",
            "icon": "🛡️"  # Knight's shield/armor
        })

    # SUBMISSION SPECIALIST - 5+ submission wins
    if len(methods) >= 5:
        badges.append({
            "name": "Submission Specialist",
            "description": f"{len(methods)} submission victories",
            "icon": "🥋"
        })

    # TRIANGLE MASTER - All wins via triangle variations
    triangle_methods = ['triangle', 'arm triangle']
    all_triangles = all([
        any(tm in method.lower() for tm in triangle_methods)
        for method in methods
    ])

    if all_triangles and len(methods) >= 2:
        badges.append({
            "name": "Triangle Master",
            "description": f"All {len(methods)} wins by triangle chokes",
            "icon": "🔺"
        })

    # GUILLOTINE GURU - All wins via guillotine
    all_guillotine = all(['guillotine' in method.lower() for method in methods])

    if all_guillotine and len(methods) >= 2:
        badges.append({
            "name": "Guillotine Guru",
            "description": f"All {len(methods)} wins by guillotine",
            "icon": "⚔️"
        })

    return badges
