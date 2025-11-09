#!/usr/bin/env python3
"""
Rankade Players Sync Script

This script syncs players from Rankade to the local database.

Usage:
    python scripts/sync_players.py
"""
import sys
import asyncio
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.services.rankade import rankade_service
from app.core.database import SessionLocal
from app.models.player import Player


async def sync_players():
    """Sync players from Rankade to local database"""
    print("🔄 Starting player sync...")

    db = SessionLocal()
    try:
        # Get all players from Rankade (handle pagination)
        page = 1
        total_synced = 0
        new_players = 0

        while True:
            print(f"📄 Fetching page {page}...")
            players_data = await rankade_service.get_players(page=page)

            if "success" not in players_data:
                print("❌ Failed to fetch players from Rankade")
                break

            players = players_data["success"].get("players", [])

            if not players:
                print("✅ No more players to sync")
                break

            for rankade_player in players:
                rankade_id = rankade_player.get("id")
                name = rankade_player.get("name")

                if not rankade_id:
                    continue

                # Check if player exists
                player = db.query(Player).filter(
                    Player.rankade_id == rankade_id
                ).first()

                if not player:
                    # Create new player
                    ghost_data = rankade_player.get("ghost", {})
                    player = Player(
                        rankade_id=rankade_id,
                        name=name,
                        photo_url=ghost_data.get("picture"),
                        active=True
                    )
                    db.add(player)
                    new_players += 1
                    print(f"  ➕ New player: {name}")
                else:
                    # Update existing player
                    player.name = name
                    player.active = True
                    if rankade_player.get("ghost", {}).get("picture"):
                        player.photo_url = rankade_player["ghost"]["picture"]
                    print(f"  ♻️ Updated player: {name}")

                total_synced += 1

            db.commit()

            # Check if there are more pages
            if len(players) < 50:  # Assuming 50 per page
                break

            page += 1

        print(f"\n✨ Player sync complete!")
        print(f"   Total processed: {total_synced}")
        print(f"   New players: {new_players}")
        print(f"   Updated: {total_synced - new_players}")

    except Exception as e:
        print(f"❌ Error syncing players: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(sync_players())
