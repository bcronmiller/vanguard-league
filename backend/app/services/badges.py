"""
Fighter Badge System

Calculates and awards achievement badges based on performance metrics.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Dict
from app.models.player import Player
from app.models.match import Match, MatchResult


class Badge:
    """Represents an achievement badge"""
    def __init__(self, id: str, name: str, emoji: str, description: str, tier: str = "standard"):
        self.id = id
        self.name = name
        self.emoji = emoji
        self.description = description
        self.tier = tier  # standard, elite, legendary


def get_player_matches(player_id: int, db: Session):
    """Get all completed matches for a player"""
    return db.query(Match).filter(
        and_(
            or_(Match.a_player_id == player_id, Match.b_player_id == player_id),
            Match.result.isnot(None)
        )
    ).order_by(Match.match_number).all()


def calculate_win_streak(player_id: int, db: Session) -> int:
    """Calculate current win streak"""
    matches = get_player_matches(player_id, db)

    streak = 0
    for match in reversed(matches):  # Most recent first
        is_a_player = match.a_player_id == player_id

        if is_a_player and match.result == MatchResult.PLAYER_A_WIN:
            streak += 1
        elif not is_a_player and match.result == MatchResult.PLAYER_B_WIN:
            streak += 1
        else:
            break  # Streak ends

    return streak


def get_fastest_finish(player_id: int, db: Session) -> float:
    """Get fastest finish time in seconds (wins only)"""
    matches = get_player_matches(player_id, db)

    fastest = None
    for match in matches:
        is_a_player = match.a_player_id == player_id
        won = (is_a_player and match.result == MatchResult.PLAYER_A_WIN) or \
              (not is_a_player and match.result == MatchResult.PLAYER_B_WIN)

        if won and match.duration_seconds:
            if fastest is None or match.duration_seconds < fastest:
                fastest = match.duration_seconds

    return fastest


def get_player_record(player_id: int, db: Session) -> dict:
    """Get W-L-D record"""
    matches = get_player_matches(player_id, db)

    wins = 0
    losses = 0
    draws = 0

    for match in matches:
        is_a_player = match.a_player_id == player_id

        if match.result == MatchResult.DRAW:
            draws += 1
        elif (is_a_player and match.result == MatchResult.PLAYER_A_WIN) or \
             (not is_a_player and match.result == MatchResult.PLAYER_B_WIN):
            wins += 1
        else:
            losses += 1

    return {"wins": wins, "losses": losses, "draws": draws, "total": len(matches)}


def get_submission_variety(player_id: int, db: Session) -> int:
    """Count unique submission methods used"""
    matches = get_player_matches(player_id, db)

    methods = set()
    for match in matches:
        is_a_player = match.a_player_id == player_id
        won = (is_a_player and match.result == MatchResult.PLAYER_A_WIN) or \
              (not is_a_player and match.result == MatchResult.PLAYER_B_WIN)

        if won and match.method:
            methods.add(match.method.lower())

    return len(methods)


def get_weight_classes_competed(player_id: int, db: Session) -> int:
    """Count how many weight classes fighter has competed in"""
    # For now, we'll check their entries across different events
    # This would need to be enhanced when we track weight class per match
    from app.models.entry import Entry

    entries = db.query(Entry).filter(Entry.player_id == player_id).all()
    weight_classes = set(e.weight_class_id for e in entries if e.weight_class_id)

    return len(weight_classes)


def calculate_badges(player_id: int, db: Session) -> List[Badge]:
    """Calculate all badges earned by a player"""
    badges = []

    record = get_player_record(player_id, db)
    streak = calculate_win_streak(player_id, db)
    fastest = get_fastest_finish(player_id, db)
    variety = get_submission_variety(player_id, db)
    weight_classes = get_weight_classes_competed(player_id, db)

    total_matches = record["total"]
    wins = record["wins"]
    losses = record["losses"]
    win_rate = wins / total_matches if total_matches > 0 else 0

    # WINNING STREAK BADGES
    if streak >= 5:
        badges.append(Badge(
            "streak_5", "🔥 Hot Streak", "🔥",
            f"Current {streak}-fight win streak",
            "elite"
        ))
    elif streak >= 3:
        badges.append(Badge(
            "streak_3", "🔥 Win Streak", "🔥",
            f"Current {streak}-fight win streak",
            "standard"
        ))

    # UNDEFEATED
    if total_matches >= 3 and losses == 0:
        badges.append(Badge(
            "undefeated", "🛡️ Undefeated", "🛡️",
            f"Perfect {wins}-0-{record['draws']} record",
            "legendary"
        ))

    # FASTEST FINISH BADGES
    if fastest:
        if fastest <= 60:
            badges.append(Badge(
                "lightning_fast", "⚡ Lightning Fast", "⚡",
                f"Fastest finish: {int(fastest)}s",
                "elite"
            ))
        elif fastest <= 120:
            badges.append(Badge(
                "quick_finisher", "⚡ Quick Finisher", "⚡",
                f"Fastest finish: {int(fastest)}s",
                "standard"
            ))

    # WIN RATE BADGES
    if total_matches >= 5:
        if win_rate >= 0.8:
            badges.append(Badge(
                "elite_win_rate", "🎯 Elite", "🎯",
                f"{int(win_rate * 100)}% win rate",
                "legendary"
            ))
        elif win_rate >= 0.7:
            badges.append(Badge(
                "high_win_rate", "🎯 Sharpshooter", "🎯",
                f"{int(win_rate * 100)}% win rate",
                "elite"
            ))

    # EXPERIENCE BADGES
    if total_matches >= 15:
        badges.append(Badge(
            "veteran", "🎖️ Veteran", "🎖️",
            f"{total_matches} matches competed",
            "elite"
        ))
    elif total_matches >= 10:
        badges.append(Badge(
            "seasoned", "💪 Seasoned", "💪",
            f"{total_matches} matches competed",
            "standard"
        ))

    # MOST WINS
    if wins >= 10:
        badges.append(Badge(
            "most_wins_10", "👑 Champion", "👑",
            f"{wins} career victories",
            "legendary"
        ))
    elif wins >= 5:
        badges.append(Badge(
            "most_wins_5", "🏆 Contender", "🏆",
            f"{wins} career victories",
            "elite"
        ))

    # SUBMISSION VARIETY
    if variety >= 5:
        badges.append(Badge(
            "submission_master", "🥋 Submission Master", "🥋",
            f"{variety} different submission types",
            "elite"
        ))
    elif variety >= 3:
        badges.append(Badge(
            "submission_artist", "🥋 Submission Artist", "🥋",
            f"{variety} different submission types",
            "standard"
        ))

    # MULTI-DIVISION
    if weight_classes >= 2:
        badges.append(Badge(
            "multi_division", "⚖️ Multi-Division Fighter", "⚖️",
            f"Competed in {weight_classes} weight classes",
            "elite"
        ))

    # IRON MAN (Most total fight time)
    matches = get_player_matches(player_id, db)
    total_time = sum(m.duration_seconds for m in matches if m.duration_seconds)
    if total_time >= 1800:  # 30+ minutes
        badges.append(Badge(
            "iron_man", "⏱️ Iron Man", "⏱️",
            f"{int(total_time / 60)} minutes in competition",
            "elite"
        ))

    # FIRST MATCH (Rookie badge)
    if total_matches == 1:
        badges.append(Badge(
            "rookie", "🌟 Rookie", "🌟",
            "First competition complete",
            "standard"
        ))

    return badges


def get_badge_dict(player_id: int, db: Session) -> List[Dict]:
    """Get badges as dictionary for API response"""
    badges = calculate_badges(player_id, db)
    return [
        {
            "id": b.id,
            "name": b.name,
            "emoji": b.emoji,
            "description": b.description,
            "tier": b.tier
        }
        for b in badges
    ]
