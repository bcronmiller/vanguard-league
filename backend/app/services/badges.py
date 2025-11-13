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
    Includes both automatic badges (from match data) and manual badges (admin awarded)

    Returns a list of badge dicts with: name, description, icon
    """
    badges = []

    # Get player to access manual badges
    player = db.query(Player).filter(Player.id == player_id).first()

    # Add manual badges first (if any)
    if player and player.manual_badges:
        for badge in player.manual_badges:
            badges.append(badge)

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

    # LIGHTNING STRIKE BADGE - 5 wins under 30 seconds
    quick_wins = 0
    for result, match in results:
        if result == 'win' and match.duration_seconds and match.duration_seconds < 30:
            quick_wins += 1

    if quick_wins >= 5:
        badges.append({
            "name": "Lightning Strike",
            "description": f"{quick_wins} wins in under 30 seconds",
            "icon": "⚡"
        })

    # UNBEATABLE BADGE - 5 draws
    draw_count = sum(1 for result in result_sequence if result == 'draw')

    if draw_count >= 5:
        badges.append({
            "name": "Unbeatable",
            "description": f"Hard to kill - {draw_count} draws",
            "icon": "🧱"
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
                "icon": "🔺"
            })

        # DARCE KNIGHT - Darce choke
        if any('darce' in method for method in submission_methods):
            badges.append({
                "name": "Darce Knight",
                "description": "Darce choke submission earned",
                "icon": "🥷"
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

    # THE STRANGLER BADGE - 5+ choke submissions
    if len(submission_methods) > 0:
        choke_methods = ['rear naked', 'rnc', 'darce', 'guillotine', 'triangle', 'ezekiel', 'anaconda', 'bow and arrow', 'collar choke', 'loop choke', 'baseball choke']
        choke_count = sum(1 for method in submission_methods if any(choke in method for choke in choke_methods))

        if choke_count >= 5:
            badges.append({
                "name": "The Strangler",
                "description": f"{choke_count} choke submissions earned",
                "icon": "🐍"
            })

    # THE SPOILER BADGE - Beat someone 2+ belt ranks above you
    from app.models.entry import Entry

    # Belt rank mapping
    belt_rank_map = {
        'White': 1,
        'Blue': 2,
        'Purple': 3,
        'Brown': 4,
        'Black': 5
    }

    spoiler_earned = False
    for result, match in results:
        if result == 'win':
            # Determine opponent ID
            opponent_id = match.b_player_id if match.a_player_id == player_id else match.a_player_id
            opponent = db.query(Player).filter(Player.id == opponent_id).first()

            if opponent:
                # Get player's belt at this event
                player_entry = db.query(Entry).filter(
                    Entry.event_id == match.event_id,
                    Entry.player_id == player_id
                ).first()
                player_belt = player_entry.belt_rank if (player_entry and player_entry.belt_rank) else player.bjj_belt_rank

                # Get opponent's belt at this event
                opponent_entry = db.query(Entry).filter(
                    Entry.event_id == match.event_id,
                    Entry.player_id == opponent_id
                ).first()
                opponent_belt = opponent_entry.belt_rank if (opponent_entry and opponent_entry.belt_rank) else opponent.bjj_belt_rank

                # Compare belt ranks
                if player_belt and opponent_belt:
                    player_rank = belt_rank_map.get(player_belt, 0)
                    opponent_rank = belt_rank_map.get(opponent_belt, 0)

                    # Award if beat someone 2+ ranks higher
                    if opponent_rank - player_rank >= 2:
                        spoiler_earned = True
                        break

    if spoiler_earned:
        badges.append({
            "name": "The Spoiler",
            "description": "Defeated an opponent two or more belt ranks above you",
            "icon": "🤯"
        })

    # WARRIOR SPIRIT BADGE - Most matches in a single event (no ties)
    from collections import defaultdict
    matches_per_event = defaultdict(int)

    for result, match in results:
        matches_per_event[match.event_id] += 1

    if matches_per_event:
        max_matches = max(matches_per_event.values())
        max_event_id = [event_id for event_id, count in matches_per_event.items() if count == max_matches][0]

        # Check if anyone else had the same count at this event
        all_matches_at_event = db.query(Match).filter(Match.event_id == max_event_id).all()
        player_match_counts = defaultdict(int)

        for match in all_matches_at_event:
            if match.a_player_id:
                player_match_counts[match.a_player_id] += 1
            if match.b_player_id:
                player_match_counts[match.b_player_id] += 1

        # Count how many players have the max count
        players_with_max = sum(1 for count in player_match_counts.values() if count == max_matches)

        # Only award if sole leader
        if players_with_max == 1 and max_matches >= 3:  # Minimum 3 matches to qualify
            event = db.query(Event).filter(Event.id == max_event_id).first()
            event_name = event.name if event else f"Event {max_event_id}"
            badges.append({
                "name": "Warrior Spirit",
                "description": f"Most matches in a single event ({max_matches} at {event_name})",
                "icon": "❤️‍🔥"
            })

    # MULTI-DIVISION FIGHTER - Fought in multiple weight classes
    # Check the actual weight class of each match, not the fighter's assigned weight class
    weight_classes_fought = set()
    for result, match in results:
        if match.weight_class_id:
            weight_classes_fought.add(match.weight_class_id)

    if len(weight_classes_fought) > 1:
        badges.append({
            "name": "Multi-Division",
            "description": f"Competed in {len(weight_classes_fought)} weight classes",
            "icon": "⚖️"
        })

    # PRIZE POOL ELIGIBILITY - Season prize pool participation
    # Requirements: 5+ events attended AND 12+ total matches
    if len(results) >= 12:  # At least 12 matches
        # Count unique events
        events_attended = set()
        for result, match in results:
            events_attended.add(match.event_id)

        if len(events_attended) >= 5:  # At least 5 events
            badges.append({
                "name": "Prize Pool",
                "description": f"Eligible for season prize pool ({len(events_attended)} events, {len(results)} matches)",
                "icon": "💰"
            })

    return badges
