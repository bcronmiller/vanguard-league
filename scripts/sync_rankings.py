#!/usr/bin/env python3
"""
Rankade Rankings Sync Script

This script syncs rankings from Rankade to the local database.
Run this periodically (e.g., via cron) to keep rankings up-to-date.

Usage:
    python scripts/sync_rankings.py [--subset SUBSET_ID]
"""
import sys
import asyncio
import argparse
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.services.rankade import rankade_service
from app.core.database import SessionLocal
from app.models.player import Player


async def sync_rankings(subset_id: str = None):
    """Sync rankings from Rankade"""
    print("🔄 Starting rankings sync...")

    try:
        # Get rankings from Rankade
        print(f"📊 Fetching rankings from Rankade (subset: {subset_id or 'main'})...")
        rankings_data = await rankade_service.get_rankings(subset=subset_id)

        if "success" not in rankings_data:
            print("❌ Failed to fetch rankings from Rankade")
            return

        rankings = rankings_data["success"].get("rankings", [])
        print(f"✅ Retrieved {len(rankings)} ranking entries")

        # Update local database
        db = SessionLocal()
        try:
            updated = 0
            for rank_entry in rankings:
                player_data = rank_entry.get("player", {})
                rankade_id = player_data.get("id")

                if not rankade_id:
                    continue

                # Find player in local DB
                player = db.query(Player).filter(
                    Player.rankade_id == rankade_id
                ).first()

                if player:
                    # Update player metadata from Rankade
                    player.name = player_data.get("name", player.name)
                    if player_data.get("ghost", {}).get("picture"):
                        player.photo_url = player_data["ghost"]["picture"]
                    updated += 1

            db.commit()
            print(f"✅ Updated {updated} players")

        finally:
            db.close()

        print("✨ Rankings sync complete!")

    except Exception as e:
        print(f"❌ Error syncing rankings: {e}")
        raise


async def sync_all_subsets():
    """Sync rankings for all subsets (weight classes)"""
    print("🔄 Syncing all subsets...")

    try:
        # Get all subsets
        subsets_data = await rankade_service.get_subsets()
        subsets = subsets_data.get("success", {}).get("subsets", [])

        print(f"📋 Found {len(subsets)} subsets")

        for subset in subsets:
            subset_id = subset.get("id")
            subset_name = subset.get("name")
            print(f"\n🔄 Syncing subset: {subset_name} ({subset_id})")
            await sync_rankings(subset_id)

    except Exception as e:
        print(f"❌ Error syncing subsets: {e}")
        raise


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Sync rankings from Rankade")
    parser.add_argument(
        "--subset",
        type=str,
        help="Specific subset ID to sync (default: sync all)"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Sync all subsets"
    )

    args = parser.parse_args()

    if args.subset:
        await sync_rankings(args.subset)
    elif args.all:
        await sync_all_subsets()
    else:
        # Default: sync main rankings
        await sync_rankings()


if __name__ == "__main__":
    asyncio.run(main())
