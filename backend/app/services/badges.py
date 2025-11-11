"""
Badge system for fighter achievements based on win/loss streaks
"""
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.match import Match, MatchResult
from app.models.player import Player
from app.models.event import Event


def get_player_match_results(player_id: int, db: Session) -> List[Tuple[str, Match]]:
    """
    Get all match results for a player in chronological order
    Returns list of tuples: (result, match) where result is 'win', 'loss', or 'draw'
    """
    # Get all matches involving this player
    matches_as_a = db.query(Match).filter(Match.a_player_id == player_id).all()
    matches_as_b = db.query(Match).filter(Match.b_player_id == player_id).all()

    results = []

    for match in matches_as_a:
        if match.result == MatchResult.PLAYER_A_WIN:
            results.append(('win', match))
        elif match.result == MatchResult.PLAYER_B_WIN:
            results.append(('loss', match))
        elif match.result == MatchResult.DRAW:
            results.append(('draw', match))

    for match in matches_as_b:
        if match.result == MatchResult.PLAYER_B_WIN:
            results.append(('win', match))
        elif match.result == MatchResult.PLAYER_A_WIN:
            results.append(('loss', match))
        elif match.result == MatchResult.DRAW:
            results.append(('draw', match))

    # Sort by event ID and match number to get chronological order
    # Note: This assumes matches within an event are sequential
    results.sort(key=lambda x: (x[1].event_id, x[1].id))

    return results


def get_player_badges(player_id: int, db: Session) -> List[Dict]:
    """
    Calculate which badges a player has earned based on their match streaks

    Returns a list of badge dicts with: name, description, icon
    """
    badges = []

    # Get match results in chronological order
    results = get_player_match_results(player_id, db)

    if len(results) == 0:
        return badges

    # Extract just the result strings
    result_sequence = [r[0] for r in results]

    # ON FIRE BADGE - 3+ wins in a row (current streak)
    current_streak = 0
    for result in reversed(result_sequence):
        if result == 'win':
            current_streak += 1
        else:
            break

    if current_streak >= 3:
        badges.append({
            "name": "On Fire",
            "description": f"{current_streak} wins in a row",
            "icon": "🔥"
        })

    # COMEBACK KID BADGE - Won after losing 2+ in a row
    comeback_found = False
    loss_streak = 0

    for result in result_sequence:
        if result == 'loss':
            loss_streak += 1
        elif result == 'win':
            if loss_streak >= 2:
                comeback_found = True
                break
            loss_streak = 0
        else:  # draw
            loss_streak = 0

    if comeback_found:
        badges.append({
            "name": "Comeback Kid",
            "description": "Won after losing 2+ matches",
            "icon": "💪"
        })

    # SUBMISSION BADGES - Earned by getting at least one submission of that type
    # Get all wins with submission methods
    submission_methods = []
    for result, match in results:
        if result == 'win' and match.method:
            submission_methods.append(match.method.lower())

    if len(submission_methods) > 0:
        # FOOTSIE - Leg lock submission
        leg_lock_methods = ['heel hook', 'ankle lock', 'toe hold', 'kneebar', 'knee bar']
        if any(any(ll in method for ll in leg_lock_methods) for method in submission_methods):
            badges.append({
                "name": "Footsie",
                "description": "Leg lock submission earned",
                "icon": "🦶"
            })

        # TRIANGLE MASTER - Triangle submission
        triangle_methods = ['triangle']
        if any(any(tm in method for tm in triangle_methods) for method in submission_methods):
            badges.append({
                "name": "Triangle",
                "description": "Triangle submission earned",
                "icon": "▲"
            })

        # DARCE KNIGHT - Darce choke
        if any('darce' in method for method in submission_methods):
            badges.append({
                "name": "Darce Knight",
                "description": "Darce choke submission earned",
                "icon": "🛡️"
            })

        # GUILLOTINE - Guillotine choke
        if any('guillotine' in method for method in submission_methods):
            badges.append({
                "name": "Guillotine",
                "description": "Guillotine submission earned",
                "icon": "⚔️"
            })

        # REAR NAKED CHOKE - RNC
        rnc_methods = ['rear naked', 'rnc']
        if any(any(rnc in method for rnc in rnc_methods) for method in submission_methods):
            badges.append({
                "name": "Chokeout",
                "description": "Rear naked choke earned",
                "icon": "😴"
            })

        # ARMBAR - Armbar submission
        armbar_methods = ['armbar', 'arm bar']
        armbar_count = sum(1 for method in submission_methods if any(ab in method for ab in armbar_methods))

        if armbar_count >= 1:
            badges.append({
                "name": "Armbar",
                "description": "Armbar submission earned",
                "icon": "🦴"  # Bone - breaking the arm!
            })

        # BONE COLLECTOR - 5+ Armbar submissions
        if armbar_count >= 5:
            badges.append({
                "name": "Bone Collector",
                "description": f"{armbar_count} armbar submissions earned",
                "icon": "💀"  # Skull - you collect bones!
            })

    # MULTI-DIVISION FIGHTER - Fought in multiple weight classes
    from app.models.entry import Entry
    weight_classes_fought = set()
    for result, match in results:
        entry = db.query(Entry).filter(
            Entry.event_id == match.event_id,
            Entry.player_id == player_id
        ).first()
        if entry and entry.weight_class:
            weight_classes_fought.add(entry.weight_class)

    if len(weight_classes_fought) > 1:
        badges.append({
            "name": "Multi-Division",
            "description": f"Competed in {len(weight_classes_fought)} weight classes",
            "icon": "⚖️"
        })

    return badges
