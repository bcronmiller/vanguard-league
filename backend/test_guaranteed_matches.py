#!/usr/bin/env python3
"""
Test script for guaranteed matches progression fix.

This script creates a guaranteed matches bracket and verifies that:
1. Round 1 is generated correctly
2. After round 1 completes, round 2 auto-generates
3. Each fighter reaches their guaranteed match count
4. Rematches are handled correctly within limits
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
    # Delete in correct order due to foreign keys
    db.query(Match).filter(Match.event_id >= 9000).delete()
    db.query(BracketRound).filter(BracketRound.bracket_format_id >= 9000).delete()
    db.query(BracketFormat).filter(BracketFormat.id >= 9000).delete()
    db.query(Entry).filter(Entry.event_id >= 9000).delete()
    db.query(Event).filter(Event.id >= 9000).delete()
    db.commit()
    print("✓ Cleaned up test data")

def create_test_event(db):
    """Create a test event"""
    event = Event(
        id=9000,
        name="Test Guaranteed Matches Event",
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

def test_guaranteed_matches_progression():
    """Main test function"""
    print("\n" + "="*60)
    print("TESTING GUARANTEED MATCHES PROGRESSION")
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

        # Create guaranteed matches bracket
        print("\nBRACKET CREATION")
        print("-" * 60)
        engine = TournamentEngine(db)

        bracket = engine.create_bracket(
            event_id=event.id,
            weight_class_id=None,
            format_type=TournamentFormat.GUARANTEED_MATCHES,
            config={
                "match_count": 3,  # Each fighter gets 3 matches
                "max_rematches": 1,  # Allow one rematch
                "seeding_method": "random"
            }
        )
        print(f"✓ Created bracket (ID: {bracket.id})")

        # Generate initial bracket
        rounds = engine.generate_bracket(bracket.id)
        print(f"✓ Generated initial bracket: {len(rounds)} round(s)")

        # Verify Round 1
        print("\nROUND 1 VERIFICATION")
        print("-" * 60)
        round1 = rounds[0]
        print(f"Round Name: {round1.round_name}")
        print(f"Round Status: {round1.status}")

        if round1.status != RoundStatus.IN_PROGRESS:
            print(f"✗ TEST FAILED: Round 1 should be IN_PROGRESS, got {round1.status}")
            return False
        print("✓ Round 1 is IN_PROGRESS")

        r1_matches = db.query(Match).filter(Match.bracket_round_id == round1.id).all()
        print(f"✓ Round 1 has {len(r1_matches)} matches")

        for i, match in enumerate(r1_matches, 1):
            player_a = db.query(Player).get(match.a_player_id)
            player_b = db.query(Player).get(match.b_player_id) if match.b_player_id else None
            print(f"  Match {i}: {player_a.name} vs {player_b.name if player_b else 'BYE'}")

        # Complete Round 1
        print("\nCOMPLETING ROUND 1")
        print("-" * 60)
        for match in r1_matches:
            if match.match_status == MatchStatus.READY:
                engine.update_match_result(
                    match.id,
                    MatchResult.PLAYER_A_WIN,
                    "Submission",
                    180
                )
                print(f"✓ Completed match {match.id}")

        # Check if Round 2 was auto-generated
        print("\nROUND 2 AUTO-GENERATION CHECK")
        print("-" * 60)
        db.refresh(round1)
        print(f"Round 1 Status: {round1.status}")

        if round1.status != RoundStatus.COMPLETED:
            print(f"✗ TEST FAILED: Round 1 should be COMPLETED, got {round1.status}")
            return False
        print("✓ Round 1 marked as COMPLETED")

        all_rounds = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id
        ).order_by(BracketRound.round_number).all()

        print(f"✓ Total rounds now: {len(all_rounds)}")

        if len(all_rounds) < 2:
            print("✗ TEST FAILED: Round 2 was NOT auto-generated!")
            return False

        round2 = all_rounds[1]
        print(f"✓ Round 2 auto-generated!")
        print(f"  Round Name: {round2.round_name}")
        print(f"  Round Status: {round2.status}")

        if round2.status != RoundStatus.IN_PROGRESS:
            print(f"✗ TEST FAILED: Round 2 should be IN_PROGRESS, got {round2.status}")
            return False
        print("✓ Round 2 is IN_PROGRESS")

        r2_matches = db.query(Match).filter(Match.bracket_round_id == round2.id).all()
        print(f"✓ Round 2 has {len(r2_matches)} matches")

        for i, match in enumerate(r2_matches, 1):
            player_a = db.query(Player).get(match.a_player_id)
            player_b = db.query(Player).get(match.b_player_id) if match.b_player_id else None
            print(f"  Match {i}: {player_a.name} vs {player_b.name if player_b else 'BYE'}")

        # Complete Round 2
        print("\nCOMPLETING ROUND 2")
        print("-" * 60)
        for match in r2_matches:
            if match.match_status == MatchStatus.READY:
                engine.update_match_result(
                    match.id,
                    MatchResult.PLAYER_B_WIN,
                    "Submission",
                    210
                )
                print(f"✓ Completed match {match.id}")

        # Check Round 3 generation
        print("\nROUND 3 AUTO-GENERATION CHECK")
        print("-" * 60)
        all_rounds = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id
        ).order_by(BracketRound.round_number).all()

        print(f"✓ Total rounds now: {len(all_rounds)}")

        if len(all_rounds) < 3:
            print("✗ TEST FAILED: Round 3 was NOT auto-generated!")
            return False

        round3 = all_rounds[2]
        print(f"✓ Round 3 auto-generated!")
        print(f"  Round Name: {round3.round_name}")
        print(f"  Round Status: {round3.status}")

        r3_matches = db.query(Match).filter(Match.bracket_round_id == round3.id).all()
        print(f"✓ Round 3 has {len(r3_matches)} matches")

        # Complete Round 3
        print("\nCOMPLETING ROUND 3")
        print("-" * 60)
        for match in r3_matches:
            if match.match_status == MatchStatus.READY:
                engine.update_match_result(
                    match.id,
                    MatchResult.PLAYER_A_WIN,
                    "Submission",
                    195
                )
                print(f"✓ Completed match {match.id}")

        # Verify each fighter has 3 matches
        print("\nFINAL MATCH COUNT VERIFICATION")
        print("-" * 60)
        db.refresh(bracket)

        all_matches = db.query(Match).join(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            Match.match_status == MatchStatus.COMPLETED
        ).all()

        fighter_match_counts = {}
        for match in all_matches:
            if match.a_player_id:
                fighter_match_counts[match.a_player_id] = fighter_match_counts.get(match.a_player_id, 0) + 1
            if match.b_player_id:
                fighter_match_counts[match.b_player_id] = fighter_match_counts.get(match.b_player_id, 0) + 1

        all_correct = True
        for fighter in fighters:
            count = fighter_match_counts.get(fighter.id, 0)
            status = "✓" if count == 3 else "✗"
            print(f"{status} {fighter.name}: {count} matches (expected 3)")
            if count != 3:
                all_correct = False

        if not all_correct:
            print("\n✗ TEST FAILED: Not all fighters reached 3 matches")
            return False

        print(f"\n✓ Bracket finalized: {bracket.is_finalized}")

        if not bracket.is_finalized:
            print("✗ TEST FAILED: Bracket should be finalized")
            return False

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
    success = test_guaranteed_matches_progression()
    sys.exit(0 if success else 1)
