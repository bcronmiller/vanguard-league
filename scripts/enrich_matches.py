#!/usr/bin/env python3
"""
Enrich existing matches with submission methods and durations
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.match import Match
from app.models.player import Player


def parse_time_to_seconds(time_str):
    """Convert time string to seconds"""
    if not time_str:
        return None

    time_str = time_str.strip().lower()

    # Handle formats like "15 secs", "1:30", "2:20", "3 min 20 secs", "7 mins"
    if "sec" in time_str and "min" not in time_str:
        # Just seconds: "15 secs"
        return int(time_str.split()[0])
    elif "min" in time_str and ":" not in time_str:
        # Format: "3 min 20 secs" or "7 mins"
        parts = time_str.split()
        minutes = int(parts[0])
        seconds = 0
        if len(parts) > 2:
            seconds = int(parts[2])
        return minutes * 60 + seconds
    elif ":" in time_str:
        # Format: "1:30", "2:20"
        parts = time_str.split(":")
        minutes = int(parts[0])
        seconds = int(parts[1])
        return minutes * 60 + seconds

    return None


def enrich_matches(db: Session):
    """Add submission methods and durations to existing matches"""
    print("🔄 Enriching matches with submission details...\n")

    # Match details from user (in Rankade order, match #1 is first)
    # Rankade lists newest first, so we need to reverse
    match_details = [
        # Match 1: JM vs Hussain
        {"method": "Ankle Lock", "duration": "15 secs"},
        # Match 2: Christian vs Troy (added later, marked as heavy weight)
        {"method": None, "duration": None},  # Will update if we have details
        # Match 3: Alex vs Josh
        {"method": "Submission", "duration": "15 secs"},
        # Match 4: Josue vs Edrees
        {"method": None, "duration": None},  # Draw
        # Match 5: Matt vs Christian
        {"method": None, "duration": None},  # Draw
        # Match 6: Troy vs Nick
        {"method": "Darce", "duration": "2:20"},
        # Match 7: Alex vs Hussain
        {"method": "Kneebar", "duration": "1:30"},
        # Match 8: JM vs Josh
        {"method": "Triangle", "duration": "1:30"},
        # Match 9: Christian vs Edrees
        {"method": "Guillotine", "duration": "3:20"},
        # Match 10: Troy vs Josue
        {"method": "Head and Arm Choke", "duration": "2:40"},
        # Match 11: Nick vs Matt
        {"method": "Guillotine", "duration": "30 secs"},
        # Match 12: Hussain vs Josh
        {"method": "Heel Hook", "duration": "1 min"},
        # Match 13: Alex vs JM
        {"method": "Triangle", "duration": "1:30"},
        # Match 14: Troy vs Matt
        {"method": "Darce", "duration": "2 min"},
        # Match 15: Christian vs Josue
        {"method": "Rear Naked Choke", "duration": "3:30"},
        # Match 16: Nick vs Edrees
        {"method": "Toe Hold", "duration": "7:30"},
        # Match 17: Matt vs Josue
        {"method": "Americana", "duration": "5 min"},
        # Match 18: Hussain vs Edrees
        {"method": "Head and Arm Choke", "duration": "7 mins"},
    ]

    # Get all matches ordered by created_at (oldest first, matches Rankade's numbering)
    matches = db.query(Match).order_by(Match.created_at).all()

    print(f"Found {len(matches)} matches to enrich\n")

    updated_count = 0

    for i, match in enumerate(matches):
        if i >= len(match_details):
            print(f"⚠️  No details for match {i+1}")
            continue

        details = match_details[i]

        # Get player names
        player_a = db.query(Player).filter_by(id=match.a_player_id).first()
        player_b = db.query(Player).filter_by(id=match.b_player_id).first()

        if not player_a or not player_b:
            print(f"⚠️  Match {i+1}: Players not found")
            continue

        # Update match
        match.method = details["method"]
        if details["duration"]:
            match.duration_seconds = parse_time_to_seconds(details["duration"])

        result_str = "DRAW" if match.result.value == "draw" else f"{player_a.name if match.result.value == 'a_win' else player_b.name} wins"
        method_str = f" by {details['method']}" if details["method"] else ""
        duration_str = f" ({details['duration']})" if details["duration"] else ""

        print(f"✅ Match {i+1}: {player_a.name} vs {player_b.name}: {result_str}{method_str}{duration_str}")
        updated_count += 1

    db.commit()

    print(f"\n📊 Summary:")
    print(f"  ✅ Enriched: {updated_count} matches")
    print(f"\n🎉 Match enrichment complete!")


def main():
    db = SessionLocal()
    try:
        enrich_matches(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
