#!/usr/bin/env python3
"""
Sync matches from Rankade to local database
This pulls down all matches from Rankade and stores them locally
"""
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.player import Player
from app.models.event import Event
from app.models.match import Match, MatchResult
from app.services.rankade import RankadeService
import asyncio


async def get_or_create_default_event(db: Session) -> Event:
    """Get or create a default event for synced matches"""
    event = db.query(Event).filter_by(name="VGI Trench November 2025").first()

    if not event:
        print("Creating default event for synced matches...")
        event = Event(
            name="VGI Trench November 2025",
            date=datetime(2025, 11, 9),
            venue="Manassas Brazilian Jiu-Jitsu",
            status="completed"
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        print(f"✅ Created event: {event.name}")

    return event


async def sync_matches_from_rankade(db: Session):
    """Sync all matches from Rankade to local database"""
    print("🔄 Syncing matches from Rankade...\n")

    rankade = RankadeService()

    # Get matches from Rankade
    print("Fetching matches from Rankade...")
    matches_data = await rankade.get_matches()

    if not matches_data or "success" not in matches_data:
        print("❌ Failed to fetch matches from Rankade")
        print(f"Response: {matches_data}")
        return

    matches = matches_data["success"].get("data", [])
    print(f"Found {len(matches)} matches in Rankade\n")

    if not matches:
        print("No matches to sync")
        return

    # Get or create default event
    event = await get_or_create_default_event(db)

    # Build player lookup by rankade_id
    players = db.query(Player).all()
    player_lookup = {p.rankade_id: p for p in players if p.rankade_id}
    print(f"Player lookup has {len(player_lookup)} players\n")

    synced_count = 0
    skipped_count = 0
    error_count = 0

    for match_data in matches:
        rankade_match_id = match_data.get("id")

        # Check if match already exists
        existing_match = db.query(Match).filter_by(rankade_match_id=rankade_match_id).first()
        if existing_match:
            print(f"⏭️  Match {rankade_match_id} already exists, skipping...")
            skipped_count += 1
            continue

        # Get match details
        factions = match_data.get("factions", [])
        if len(factions) != 2:
            print(f"⚠️  Match {rankade_match_id} has {len(factions)} factions, expected 2. Skipping...")
            error_count += 1
            continue

        # Get player IDs
        faction_a = factions[0]
        faction_b = factions[1]

        player_a_rankade_id = faction_a.get("players", [{}])[0].get("id") if faction_a.get("players") else None
        player_b_rankade_id = faction_b.get("players", [{}])[0].get("id") if faction_b.get("players") else None

        if not player_a_rankade_id or not player_b_rankade_id:
            print(f"⚠️  Match {rankade_match_id} missing player IDs. Skipping...")
            error_count += 1
            continue

        # Lookup local players
        player_a = player_lookup.get(player_a_rankade_id)
        player_b = player_lookup.get(player_b_rankade_id)

        if not player_a or not player_b:
            print(f"⚠️  Match {rankade_match_id}: Players not found locally")
            print(f"    Player A ({player_a_rankade_id}): {'Found' if player_a else 'NOT FOUND'}")
            print(f"    Player B ({player_b_rankade_id}): {'Found' if player_b else 'NOT FOUND'}")
            error_count += 1
            continue

        # Determine result
        rank_a = faction_a.get("rank", 1)
        rank_b = faction_b.get("rank", 1)

        if rank_a == rank_b:
            result = MatchResult.DRAW
        elif rank_a < rank_b:  # Lower rank wins
            result = MatchResult.PLAYER_A_WIN
        else:
            result = MatchResult.PLAYER_B_WIN

        # Create match
        match = Match(
            event_id=event.id,
            a_player_id=player_a.id,
            b_player_id=player_b.id,
            result=result,
            method=None,  # Rankade doesn't store submission method
            duration_seconds=None,  # Rankade doesn't store duration
            rankade_match_id=rankade_match_id,
            synced_to_rankade=True,  # Already in Rankade
            created_at=datetime.utcnow()
        )

        db.add(match)
        synced_count += 1

        result_str = "DRAW" if result == MatchResult.DRAW else f"{player_a.name if result == MatchResult.PLAYER_A_WIN else player_b.name} wins"
        print(f"✅ {player_a.name} vs {player_b.name}: {result_str}")

    db.commit()

    print(f"\n📊 Sync Summary:")
    print(f"  ✅ Synced: {synced_count} matches")
    print(f"  ⏭️  Skipped: {skipped_count} (already exist)")
    print(f"  ❌ Errors: {error_count}")
    print(f"\n🎉 Match sync complete!")


async def main():
    db = SessionLocal()
    try:
        await sync_matches_from_rankade(db)
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
