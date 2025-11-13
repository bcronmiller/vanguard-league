#!/usr/bin/env python3
"""
Run a full double-elimination tournament with heavyweight fighters.
Leaves data in database for review.
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
from app.models.weight_class import WeightClass
from datetime import datetime
import random

def cleanup_previous_test(db):
    """Clean up previous test tournament"""
    try:
        bracket_formats = db.query(BracketFormat).filter(
            BracketFormat.event_id == 9500
        ).all()
        bracket_format_ids = [bf.id for bf in bracket_formats]

        db.query(Match).filter(Match.event_id == 9500).delete()

        if bracket_format_ids:
            db.query(BracketRound).filter(
                BracketRound.bracket_format_id.in_(bracket_format_ids)
            ).delete(synchronize_session=False)

        db.query(BracketFormat).filter(BracketFormat.event_id == 9500).delete()
        db.query(Entry).filter(Entry.event_id == 9500).delete()
        db.query(Event).filter(Event.id == 9500).delete()

        db.commit()
        print("✓ Cleaned up previous test")
    except Exception as e:
        db.rollback()
        print(f"⚠ Cleanup warning: {e}")

def create_tournament_event(db):
    """Create tournament event"""
    event = Event(
        id=9500,
        name="Heavyweight Double-Elimination Test Tournament",
        date=datetime.utcnow(),
        venue="Test Arena"
    )
    db.add(event)
    db.commit()
    print(f"✓ Created event: {event.name}")
    return event

def get_heavyweight_fighters(db):
    """Get all heavyweight fighters"""
    hw_class = db.query(WeightClass).filter(WeightClass.name == "Heavyweight").first()

    fighters = db.query(Player).filter(
        Player.weight_class_id == hw_class.id,
        Player.active == True
    ).all()

    print(f"\n✓ Found {len(fighters)} heavyweight fighters:")
    for f in fighters:
        print(f"  - {f.name} ({f.bjj_belt_rank}, {f.weight}lbs)")

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

def simulate_match_result(match, fighters_by_id):
    """Simulate a realistic match result based on belt ranks"""
    player_a = fighters_by_id.get(match.a_player_id)
    player_b = fighters_by_id.get(match.b_player_id)

    # Belt rank weights for probability
    belt_weights = {
        "Black": 5,
        "Brown": 4,
        "Purple": 3,
        "Blue": 2,
        "White": 1
    }

    # Calculate win probability based on belt ranks
    a_weight = belt_weights.get(player_a.bjj_belt_rank, 3)
    b_weight = belt_weights.get(player_b.bjj_belt_rank, 3)

    # Add some randomness (upsets happen!)
    total_weight = a_weight + b_weight
    a_prob = (a_weight / total_weight) * 0.8 + 0.1  # 10-90% range

    if random.random() < a_prob:
        result = MatchResult.PLAYER_A_WIN
        winner_name = player_a.name
    else:
        result = MatchResult.PLAYER_B_WIN
        winner_name = player_b.name

    # Random submission types
    methods = [
        "Rear Naked Choke",
        "Armbar",
        "Triangle Choke",
        "Guillotine",
        "Kimura",
        "Heel Hook",
        "Darce Choke",
        "Anaconda Choke"
    ]

    method = random.choice(methods)
    duration = random.randint(60, 300)  # 1-5 minutes

    return result, method, duration, winner_name

def show_bracket_tree(db, bracket_id):
    """Display the bracket in tree format"""
    print("\n" + "="*80)
    print("BRACKET TREE")
    print("="*80)

    rounds = db.query(BracketRound).filter(
        BracketRound.bracket_format_id == bracket_id
    ).order_by(BracketRound.round_number).all()

    for round in rounds:
        bracket_type = round.bracket_type or "main"
        print(f"\n{round.round_name} [{bracket_type.upper()}] - {round.status.value}")
        print("-" * 80)

        matches = db.query(Match).filter(
            Match.bracket_round_id == round.id
        ).order_by(Match.match_number).all()

        for match in matches:
            player_a = db.query(Player).get(match.a_player_id) if match.a_player_id else None
            player_b = db.query(Player).get(match.b_player_id) if match.b_player_id else None

            a_name = player_a.name if player_a else "TBD"
            b_name = player_b.name if player_b else "TBD"

            if match.match_status == MatchStatus.COMPLETED:
                if match.result == MatchResult.PLAYER_A_WIN:
                    winner_mark = "✓"
                    loser_mark = "✗"
                elif match.result == MatchResult.PLAYER_B_WIN:
                    winner_mark = "✗"
                    loser_mark = "✓"
                else:
                    winner_mark = loser_mark = "="

                print(f"  Match {match.match_number}: {winner_mark} {a_name:<30} vs {loser_mark} {b_name:<30}")
                print(f"              Result: {match.method} at {match.duration_seconds}s")
            else:
                print(f"  Match {match.match_number}: {a_name:<30} vs {b_name:<30} [{match.match_status.value}]")

def run_tournament():
    """Main tournament execution"""
    print("\n" + "="*80)
    print("HEAVYWEIGHT DOUBLE-ELIMINATION TOURNAMENT")
    print("="*80 + "\n")

    db = SessionLocal()

    try:
        # Setup
        print("SETUP")
        print("-" * 80)
        cleanup_previous_test(db)
        event = create_tournament_event(db)
        fighters = get_heavyweight_fighters(db)

        if len(fighters) < 4:
            print(f"\n✗ Need at least 4 fighters, found {len(fighters)}")
            return

        # Create lookup dictionary
        fighters_by_id = {f.id: f for f in fighters}

        create_entries(db, event, fighters)

        # Create bracket
        print("\nBRACKET CREATION")
        print("-" * 80)
        engine = TournamentEngine(db)

        bracket = engine.create_bracket(
            event_id=event.id,
            weight_class_id=fighters[0].weight_class_id,
            format_type=TournamentFormat.DOUBLE_ELIMINATION
        )
        print(f"✓ Created double-elimination bracket (ID: {bracket.id})")

        rounds = engine.generate_bracket(bracket.id)
        print(f"✓ Generated bracket: {len(rounds)} rounds")

        # Run tournament
        print("\nRUNNING TOURNAMENT")
        print("-" * 80)

        iteration = 0
        max_iterations = 50

        while iteration < max_iterations:
            iteration += 1

            # Find any active rounds with ready matches
            all_active_rounds = db.query(BracketRound).filter(
                BracketRound.bracket_format_id == bracket.id,
                BracketRound.status == RoundStatus.IN_PROGRESS
            ).order_by(BracketRound.round_number).all()

            if not all_active_rounds:
                # No active rounds - tournament complete
                break

            # First, handle any bye matches (pending matches with no opponent)
            for active_round in all_active_rounds:
                bye_matches = db.query(Match).filter(
                    Match.bracket_round_id == active_round.id,
                    Match.match_status == MatchStatus.PENDING,
                    Match.b_player_id == None
                ).all()

                for bye_match in bye_matches:
                    player_a = fighters_by_id.get(bye_match.a_player_id)
                    if player_a:
                        print(f"\nBye Match: {player_a.name} advances (no opponent)")
                        engine.update_match_result(
                            bye_match.id,
                            MatchResult.PLAYER_A_WIN,
                            "Bye",
                            0
                        )

            # Check all active rounds for ready matches
            found_ready_match = False
            for active_round in all_active_rounds:
                # Get ready matches
                ready_matches = db.query(Match).filter(
                    Match.bracket_round_id == active_round.id,
                    Match.match_status == MatchStatus.READY
                ).all()

                if not ready_matches:
                    continue

                found_ready_match = True

                bracket_type = active_round.bracket_type or "main"
                print(f"\n{active_round.round_name} [{bracket_type.upper()}]")

                # Complete all ready matches in this round
                for match in ready_matches:
                    # Skip bye matches (already auto-completed)
                    if not match.b_player_id:
                        player_a = fighters_by_id.get(match.a_player_id)
                        if player_a:
                            print(f"  Bye Match: {player_a.name} advances")
                        continue

                    result, method, duration, winner_name = simulate_match_result(match, fighters_by_id)

                    player_a = fighters_by_id[match.a_player_id]
                    player_b = fighters_by_id[match.b_player_id]

                    print(f"  Match {match.match_number}: {player_a.name} vs {player_b.name}")
                    print(f"    → {winner_name} wins by {method} at {duration}s")

                    engine.update_match_result(
                        match.id,
                        result,
                        method,
                        duration
                    )

            # Break if no ready matches found anywhere
            if not found_ready_match:
                break

        # Show final bracket
        show_bracket_tree(db, bracket.id)

        # Determine champion
        print("\n" + "="*80)
        print("TOURNAMENT RESULTS")
        print("="*80)

        grand_finals = db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            BracketRound.bracket_type == "finals"
        ).first()

        if grand_finals:
            gf_match = db.query(Match).filter(
                Match.bracket_round_id == grand_finals.id
            ).first()

            if gf_match and gf_match.match_status == MatchStatus.COMPLETED:
                if gf_match.result == MatchResult.PLAYER_A_WIN:
                    champion = db.query(Player).get(gf_match.a_player_id)
                    runner_up = db.query(Player).get(gf_match.b_player_id)
                else:
                    champion = db.query(Player).get(gf_match.b_player_id)
                    runner_up = db.query(Player).get(gf_match.a_player_id)

                print(f"\n🏆 CHAMPION: {champion.name} ({champion.bjj_belt_rank})")
                print(f"🥈 RUNNER-UP: {runner_up.name} ({runner_up.bjj_belt_rank})")

        # Show match statistics
        print("\nMATCH STATISTICS")
        print("-" * 80)

        all_matches = db.query(Match).join(BracketRound).filter(
            BracketRound.bracket_format_id == bracket.id,
            Match.match_status == MatchStatus.COMPLETED
        ).all()

        print(f"Total matches: {len(all_matches)}")

        # Fighter records
        records = {}
        for fighter in fighters:
            records[fighter.id] = {"wins": 0, "losses": 0, "name": fighter.name}

        for match in all_matches:
            if match.result == MatchResult.PLAYER_A_WIN:
                records[match.a_player_id]["wins"] += 1
                if match.b_player_id:
                    records[match.b_player_id]["losses"] += 1
            elif match.result == MatchResult.PLAYER_B_WIN:
                records[match.b_player_id]["wins"] += 1
                if match.a_player_id:
                    records[match.a_player_id]["losses"] += 1

        print("\nFIGHTER RECORDS:")
        for fighter_id, record in sorted(records.items(), key=lambda x: (-x[1]["wins"], x[1]["losses"])):
            if record["wins"] > 0 or record["losses"] > 0:
                print(f"  {record['name']:<30} {record['wins']}-{record['losses']}")

        print("\n" + "="*80)
        print(f"✓ Tournament data saved with Event ID: {event.id}")
        print(f"✓ Bracket ID: {bracket.id}")
        print(f"✓ View in database to examine bracket structure")
        print("="*80 + "\n")

    except Exception as e:
        print(f"\n✗ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_tournament()
