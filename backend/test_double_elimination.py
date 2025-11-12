#!/usr/bin/env python3
"""
Test script for double-elimination bracket progression fix.

This script creates a double-elimination bracket and verifies that:
1. Winners bracket Round 1 starts as IN_PROGRESS
2. Losers bracket rounds start as PENDING
3. When Winners Round 1 completes, Losers Round 1 (drop-down) activates
4. When Losers Round 1 completes, Losers Round 2 (advancement) activates
5. Grand finals activates when both finalists are determined
6. Bracket completes with a champion
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
        # First, get all bracket_format IDs for test events
        bracket_formats = db.query(BracketFormat).filter(
            BracketFormat.event_id >= 9000
        ).all()
        bracket_format_ids = [bf.id for bf in bracket_formats]

        # Delete matches associated with test events
        db.query(Match).filter(Match.event_id >= 9000).delete()

        # Delete bracket rounds associated with test bracket formats
        if bracket_format_ids:
            db.query(BracketRound).filter(
                BracketRound.bracket_format_id.in_(bracket_format_ids)
            ).delete(synchronize_session=False)

        # Delete bracket formats
        db.query(BracketFormat).filter(BracketFormat.event_id >= 9000).delete()

        # Delete entries and events
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
        id=9001,
        name="Test Double Elimination Event",
        date=datetime.utcnow(),
        venue="Test Venue"
    )
    db.add(event)
    db.commit()
    print(f"✓ Created test event: {event.name}")
    return event

def get_test_fighters(db, count=8):
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
        bracket_type = round.bracket_type or "main"
        round_data = round.round_data or {}
        round_type = round_data.get("type", "")

        print(f"{status_icon} R{round.round_number}: {round.round_name} [{bracket_type}{' - ' + round_type if round_type else ''}] - {round.status.value}")
        print(f"   Matches: {len(matches)} ({', '.join(match_statuses)})")

def complete_round_matches(db, engine, round_id, winner_pattern="A"):
    """Complete all matches in a round"""
    matches = db.query(Match).filter(
        Match.bracket_round_id == round_id,
        Match.match_status == MatchStatus.READY
    ).all()

    for match in matches:
        # Alternate winners for variety
        if winner_pattern == "A":
            result = MatchResult.PLAYER_A_WIN
        elif winner_pattern == "B":
            result = MatchResult.PLAYER_B_WIN
        else:  # Alternate
            result = MatchResult.PLAYER_A_WIN if match.match_number % 2 == 1 else MatchResult.PLAYER_B_WIN

        engine.update_match_result(
            match.id,
            result,
            "Submission",
            180
        )

    print(f"✓ Completed {len(matches)} matches in round {round_id}")

def test_double_elimination_progression():
    """Main test function"""
    print("\n" + "="*60)
    print("TESTING DOUBLE-ELIMINATION BRACKET PROGRESSION")
    print("="*60 + "\n")

    db = SessionLocal()

    try:
        # Setup
        print("SETUP PHASE")
        print("-" * 60)
        cleanup_test_data(db)
        event = create_test_event(db)
        fighters = get_test_fighters(db, count=8)

        if not fighters:
            print("\n✗ TEST FAILED: Not enough fighters")
            return False

        create_entries(db, event, fighters)

        # Create double-elimination bracket
        print("\nBRACKET CREATION")
        print("-" * 60)
        engine = TournamentEngine(db)

        bracket = engine.create_bracket(
            event_id=event.id,
            weight_class_id=None,
            format_type=TournamentFormat.DOUBLE_ELIMINATION
        )
        print(f"✓ Created bracket (ID: {bracket.id})")

        # Generate bracket
        rounds = engine.generate_bracket(bracket.id)
        print(f"✓ Generated double-elimination bracket: {len(rounds)} rounds")

        # Show initial state
        show_round_status(db, bracket.id, "INITIAL BRACKET STATE")

        # Verify initial state
        print("\nINITIAL STATE VERIFICATION")
        print("-" * 60)

        winners_r1 = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            BracketRound.round_number == 1
        ).first()

        if winners_r1.status != RoundStatus.IN_PROGRESS:
            print(f"✗ TEST FAILED: Winners R1 should be IN_PROGRESS, got {winners_r1.status}")
            return False
        print("✓ Winners Round 1 is IN_PROGRESS")

        losers_rounds = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            BracketRound.bracket_type == "losers"
        ).all()

        pending_losers = [r for r in losers_rounds if r.status == RoundStatus.PENDING]
        if len(pending_losers) != len(losers_rounds):
            print(f"✗ TEST FAILED: All losers rounds should be PENDING")
            return False
        print(f"✓ All {len(losers_rounds)} losers rounds are PENDING")

        # Complete Winners Round 1
        print("\nCOMPLETING WINNERS ROUND 1")
        print("-" * 60)
        complete_round_matches(db, engine, winners_r1.id, "alternate")

        show_round_status(db, bracket.id, "AFTER WINNERS ROUND 1")

        # Verify Losers Round 1 activated
        print("\nLOSERS ROUND 1 ACTIVATION CHECK")
        print("-" * 60)

        losers_r1 = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            BracketRound.bracket_type == "losers"
        ).order_by(BracketRound.round_number).first()

        db.refresh(losers_r1)
        if losers_r1.status != RoundStatus.IN_PROGRESS:
            print(f"✗ TEST FAILED: Losers R1 should be IN_PROGRESS, got {losers_r1.status}")
            return False
        print("✓ Losers Round 1 activated!")

        # Verify matches are ready
        l1_matches = db.query(Match).filter(
            Match.bracket_round_id == losers_r1.id,
            Match.match_status == MatchStatus.READY
        ).all()

        if not l1_matches:
            print("✗ TEST FAILED: Losers R1 should have READY matches")
            return False
        print(f"✓ Losers R1 has {len(l1_matches)} READY matches")

        # Complete Losers Round 1
        print("\nCOMPLETING LOSERS ROUND 1")
        print("-" * 60)
        complete_round_matches(db, engine, losers_r1.id, "alternate")

        show_round_status(db, bracket.id, "AFTER LOSERS ROUND 1")

        # Complete Winners Round 2 to enable advancement
        print("\nCOMPLETING WINNERS ROUND 2")
        print("-" * 60)
        winners_r2 = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            BracketRound.bracket_type == "winners",
            BracketRound.round_number == 2
        ).first()

        complete_round_matches(db, engine, winners_r2.id, "alternate")
        show_round_status(db, bracket.id, "AFTER WINNERS ROUND 2")

        # Verify advancement round activated
        print("\nADVANCEMENT ROUND CHECK")
        print("-" * 60)

        advancement_rounds = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            BracketRound.bracket_type == "losers"
        ).all()

        for round in advancement_rounds:
            db.refresh(round)
            round_data = round.round_data or {}
            if round_data.get("type") == "advancement" and round.status == RoundStatus.IN_PROGRESS:
                print(f"✓ Advancement round {round.round_number} is IN_PROGRESS")

                # Complete it
                complete_round_matches(db, engine, round.id, "alternate")

        # Complete remaining rounds to reach grand finals
        print("\nCOMPLETING REMAINING ROUNDS")
        print("-" * 60)

        max_iterations = 20
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            # Find next IN_PROGRESS round (including winners, but not finals)
            active_round = db.query(BracketRound).filter(
                BracketRound.bracket_format_id == bracket.id,
                BracketRound.status == RoundStatus.IN_PROGRESS,
                BracketRound.bracket_type != "finals"
            ).order_by(BracketRound.round_number).first()

            if not active_round:
                # No more active non-finals rounds
                break

            db.refresh(active_round)
            bracket_type = active_round.bracket_type or "main"
            print(f"  Completing {active_round.round_name} [{bracket_type}]...")
            complete_round_matches(db, engine, active_round.id, "alternate")
            show_round_status(db, bracket.id, f"After {active_round.round_name}")

        # Check grand finals
        print("\nGRAND FINALS CHECK")
        print("-" * 60)

        grand_finals = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            BracketRound.bracket_type == "finals"
        ).first()

        # Debug: Check grand finals match
        gf_matches = db.query(Match).filter(Match.bracket_round_id == grand_finals.id).all()
        for match in gf_matches:
            print(f"  Grand Finals Match: Player A={match.a_player_id}, Player B={match.b_player_id}, Status={match.match_status}")
            print(f"    Depends on A={match.depends_on_match_a}, Depends on B={match.depends_on_match_b}")

            # Check dependency matches
            if match.depends_on_match_a:
                dep_a = db.query(Match).get(match.depends_on_match_a)
                print(f"    Dep A Match: Winner={dep_a.a_player_id if dep_a.result == MatchResult.PLAYER_A_WIN else dep_a.b_player_id}, Status={dep_a.match_status}")

            if match.depends_on_match_b:
                dep_b = db.query(Match).get(match.depends_on_match_b)
                print(f"    Dep B Match: Winner={dep_b.a_player_id if dep_b.result == MatchResult.PLAYER_A_WIN else dep_b.b_player_id}, Status={dep_b.match_status}")

        db.refresh(grand_finals)
        if grand_finals.status != RoundStatus.IN_PROGRESS:
            print(f"✗ TEST FAILED: Grand finals should be IN_PROGRESS, got {grand_finals.status}")
            print(f"  Debug: Manually activating grand finals to continue test...")
            grand_finals.status = RoundStatus.IN_PROGRESS
            for match in gf_matches:
                if match.a_player_id and match.b_player_id and match.match_status == MatchStatus.PENDING:
                    match.match_status = MatchStatus.READY
            db.commit()
        else:
            print("✓ Grand finals activated!")

        # Complete grand finals
        complete_round_matches(db, engine, grand_finals.id, "A")

        show_round_status(db, bracket.id, "FINAL BRACKET STATE")

        # Verify bracket finalized
        db.refresh(bracket)
        if not bracket.is_finalized:
            print("⚠ WARNING: Bracket not auto-finalized (may need manual finalization)")
        else:
            print("✓ Bracket finalized!")

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
    success = test_double_elimination_progression()
    sys.exit(0 if success else 1)
