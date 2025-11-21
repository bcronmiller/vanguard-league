#!/usr/bin/env python3
import json
import requests
import sys

def fetch_player_data(player_id):
    """Fetch all data for a player and combine into one object"""
    base_url = "http://localhost:8000"

    # Fetch basic player data
    player_resp = requests.get(f"{base_url}/api/players/{player_id}")
    if player_resp.status_code != 200:
        print(f"Failed to fetch player {player_id}: {player_resp.status_code}")
        return None

    player = player_resp.json()

    # Fetch matches
    matches_resp = requests.get(f"{base_url}/api/players/{player_id}/matches")
    if matches_resp.status_code == 200:
        player['matches'] = matches_resp.json()
    else:
        player['matches'] = []

    # Fetch divisions
    divisions_resp = requests.get(f"{base_url}/api/players/{player_id}/divisions")
    if divisions_resp.status_code == 200:
        player['divisions'] = divisions_resp.json()
    else:
        player['divisions'] = {
            "player_id": player_id,
            "player_name": player['name'],
            "overall": {
                "wins": 0,
                "losses": 0,
                "draws": 0,
                "elo_rating": player.get('elo_rating', 1200),
                "elo_change": 0
            },
            "divisions": []
        }

    return player

def main():
    # Fetch all players
    players_resp = requests.get("http://localhost:8000/api/players")
    if players_resp.status_code != 200:
        print(f"Failed to fetch players list: {players_resp.status_code}")
        sys.exit(1)

    players = players_resp.json()

    for player in players:
        player_id = player['id']
        print(f"Processing player {player_id}: {player['name']}...")

        # Fetch complete player data
        full_player = fetch_player_data(player_id)

        if full_player:
            # Write to file
            filename = f"public/data/player-{player_id}.json"
            with open(filename, 'w') as f:
                json.dump(full_player, f, indent=2)

            match_count = len(full_player.get('matches', []))
            wins = full_player.get('divisions', {}).get('overall', {}).get('wins', 0)
            losses = full_player.get('divisions', {}).get('overall', {}).get('losses', 0)
            draws = full_player.get('divisions', {}).get('overall', {}).get('draws', 0)

            print(f"  ✓ {filename}: {wins}-{losses}-{draws} ({match_count} matches)")

if __name__ == "__main__":
    main()
