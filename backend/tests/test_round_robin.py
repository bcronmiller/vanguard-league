#!/usr/bin/env python3
"""
Test script for round robin bracket progression fix.

This script creates a round robin bracket and verifies that:
1. Round 1 is generated as IN_PROGRESS with READY matches
2. All other rounds are PENDING with PENDING matches
3. When Round 1 completes, Round 2 auto-activates
4. When Round 2 completes, Round 3 auto-activates
5. All fighters play all other fighters exactly once
6. Bracket finalizes after last round
"""

import sys
sys.path.insert(0, '/home/bc/vanguard-league-platform/backend')

from app.core.database import SessionLocal
from app.services.tournament_engine import TournamentEngine
from app.models.bracket_format import BracketFormat, TournamentFormat
from app.models.bracket_round import BracketRound, RoundStatus
from app.models.match import Match, MatchStatus, MatchResult
from app.models.player import Player
from app.models.event import Event
from app.models.entry import Entry
from datetime import datetime

def cleanup_test_data(db):
    """Clean up any existing test data"""
    try:
        # Delete in correct order due to foreign keys
        bracket_formats = db.query(BracketFormat).filter(
            BracketFormat.event_id >= 9000
        ).all()
        bracket_format_ids = [bf.id for bf in bracket_formats]

        db.query(Match).filter(Match.event_id >= 9000).delete()

        if bracket_format_ids:
            db.query(BracketRound).filter(
                BracketRound.bracket_format_id.in_(bracket_format_ids)
            ).delete(synchronize_session=False)

        db.query(BracketFormat).filter(BracketFormat.event_id >= 9000).delete()
        db.query(Entry).filter(Entry.event_id >= 9000).delete()
        db.query(Event).filter(Event.id >= 9000).delete()

        db.commit()
        print("✓ Cleaned up test data")
    except Exception as e:
        db.rollback()
        print(f"⚠ Cleanup warning: {e}")

def create_test_event(db):
    """Create a test event"""
    event = Event(
        id=9002,
        name="Test Round Robin Event",
        date=datetime.utcnow(),
        venue="Test Venue"
    )
    db.add(event)
    db.commit()
    print(f"✓ Created test event: {event.name}")
    return event

def get_test_fighters(db, count=6):
    """Get existing fighters for testing"""
    fighters = db.query(Player).filter(Player.active == True).limit(count).all()
    if len(fighters) < count:
        print(f"✗ Need at least {count} fighters, found {len(fighters)}")
        return None
    print(f"✓ Using {len(fighters)} fighters:")
    for f in fighters:
        print(f"  - {f.name} (ID: {f.id})")
    return fighters

def create_entries(db, event, fighters):
    """Create entries for fighters"""
    for fighter in fighters:
        entry = Entry(
            event_id=event.id,
            player_id=fighter.id,
            weight_class_id=fighter.weight_class_id
        )
        db.add(entry)
    db.commit()
    print(f"✓ Created {len(fighters)} entries")

def show_round_status(db, bracket_id, title):
    """Display status of all rounds in the bracket"""
    print(f"\n{title}")
    print("-" * 60)

    rounds = db.query(BracketRound).filter(
        BracketRound.bracket_format_id == bracket_id
    ).order_by(BracketRound.round_number).all()

    for round in rounds:
        matches = db.query(Match).filter(Match.bracket_round_id == round.id).all()
        match_statuses = [m.match_status.value for m in matches]

        status_icon = "✓" if round.status == RoundStatus.IN_PROGRESS else ("✗" if round.status == RoundStatus.COMPLETED else "⏸")

        print(f"{status_icon} R{round.round_number}: {round.round_name} - {round.status.value}")
        print(f"   Matches: {len(matches)} ({', '.join(match_statuses)})")

def complete_round_matches(db, engine, round_id):
    """Complete all matches in a round"""
    matches = db.query(Match).filter(
        Match.bracket_round_id == round_id,
        Match.match_status == MatchStatus.READY
    ).all()

    for match in matches:
        # Alternate winners for variety
        result = MatchResult.PLAYER_A_WIN if match.match_number % 2 == 1 else MatchResult.PLAYER_B_WIN

        engine.update_match_result(
            match.id,
            result,
            "Submission",
            180
        )

    print(f"✓ Completed {len(matches)} matches in round {round_id}")

def test_round_robin_progression():
    """Main test function"""
    print("\n" + "="*60)
    print("TESTING ROUND ROBIN BRACKET PROGRESSION")
    print("="*60 + "\n")

    db = SessionLocal()

    try:
        # Setup
        print("SETUP PHASE")
        print("-" * 60)
        cleanup_test_data(db)
        event = create_test_event(db)
        fighters = get_test_fighters(db, count=6)

        if not fighters:
            print("\n✗ TEST FAILED: Not enough fighters")
            return False

        create_entries(db, event, fighters)

        # Create round robin bracket
        print("\nBRACKET CREATION")
        print("-" * 60)
        engine = TournamentEngine(db)

        bracket = engine.create_bracket(
            event_id=event.id,
            weight_class_id=None,
            format_type=TournamentFormat.ROUND_ROBIN
        )
        print(f"✓ Created bracket (ID: {bracket.id})")

        # Generate bracket
        rounds = engine.generate_bracket(bracket.id)
        print(f"✓ Generated round robin bracket: {len(rounds)} rounds")

        # Show initial state
        show_round_status(db, bracket.id, "INITIAL BRACKET STATE")

        # Verify initial state
        print("\nINITIAL STATE VERIFICATION")
        print("-" * 60)

        round1 = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            BracketRound.round_number == 1
        ).first()

        if round1.status != RoundStatus.IN_PROGRESS:
            print(f"✗ TEST FAILED: Round 1 should be IN_PROGRESS, got {round1.status}")
            return False
        print("✓ Round 1 is IN_PROGRESS")

        r1_matches = db.query(Match).filter(Match.bracket_round_id == round1.id).all()
        ready_matches = [m for m in r1_matches if m.match_status == MatchStatus.READY]

        if len(ready_matches) != len(r1_matches):
            print(f"✗ TEST FAILED: All Round 1 matches should be READY")
            return False
        print(f"✓ Round 1 has {len(ready_matches)} READY matches")

        pending_rounds = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            BracketRound.status == RoundStatus.PENDING
        ).all()

        if len(pending_rounds) != len(rounds) - 1:
            print(f"✗ TEST FAILED: All other rounds should be PENDING")
            return False
        print(f"✓ {len(pending_rounds)} other rounds are PENDING")

        # Complete rounds and verify auto-advancement
        for round_num in range(1, len(rounds) + 1):
            print(f"\nCOMPLETING ROUND {round_num}")
            print("-" * 60)

            current_round = db.query(BracketRound).filter(
                BracketRound.bracket_format_id == bracket.id,
                BracketRound.round_number == round_num
            ).first()

            complete_round_matches(db, engine, current_round.id)

            show_round_status(db, bracket.id, f"AFTER ROUND {round_num}")

            # Verify round completed
            db.refresh(current_round)
            if current_round.status != RoundStatus.COMPLETED:
                print(f"✗ TEST FAILED: Round {round_num} should be COMPLETED, got {current_round.status}")
                return False
            print(f"✓ Round {round_num} marked as COMPLETED")

            # Check if next round activated (if not the last round)
            if round_num < len(rounds):
                next_round = db.query(BracketRound).filter(
                    BracketRound.bracket_format_id == bracket.id,
                    BracketRound.round_number == round_num + 1
                ).first()

                db.refresh(next_round)
                if next_round.status != RoundStatus.IN_PROGRESS:
                    print(f"✗ TEST FAILED: Round {round_num + 1} should be IN_PROGRESS, got {next_round.status}")
                    return False
                print(f"✓ Round {round_num + 1} auto-activated!")

                # Verify matches are ready
                next_matches = db.query(Match).filter(
                    Match.bracket_round_id == next_round.id,
                    Match.match_status == MatchStatus.READY
                ).all()

                all_matches = db.query(Match).filter(
                    Match.bracket_round_id == next_round.id
                ).all()

                if len(next_matches) != len(all_matches):
                    print(f"✗ TEST FAILED: Round {round_num + 1} should have all matches READY")
                    return False
                print(f"✓ Round {round_num + 1} has {len(next_matches)} READY matches")

        # Verify bracket finalized
        print("\nFINAL VERIFICATION")
        print("-" * 60)

        db.refresh(bracket)
        if not bracket.is_finalized:
            print("✗ TEST FAILED: Bracket should be finalized")
            return False
        print("✓ Bracket finalized!")

        # Verify all fighters played each other once
        all_matchups = set()
        all_matches = db.query(Match).join(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            Match.match_status == MatchStatus.COMPLETED
        ).all()

        for match in all_matches:
            pair = tuple(sorted([match.a_player_id, match.b_player_id]))
            all_matchups.add(pair)

        num_fighters = len(fighters)
        expected_matchups = num_fighters * (num_fighters - 1) // 2

        if len(all_matchups) != expected_matchups:
            print(f"✗ TEST FAILED: Expected {expected_matchups} unique matchups, got {len(all_matchups)}")
            return False
        print(f"✓ All {expected_matchups} unique matchups completed (everyone played everyone once)")

        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
        return True

    except Exception as e:
        print(f"\n✗ TEST FAILED WITH EXCEPTION:")
        print(f"  {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        print("\nCLEANUP")
        print("-" * 60)
        cleanup_test_data(db)
        db.close()

if __name__ == "__main__":
    success = test_round_robin_progression()
    sys.exit(0 if success else 1)
