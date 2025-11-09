# Vanguard League Scripts

Utility scripts for syncing data with Rankade and other maintenance tasks.

## Available Scripts

### sync_players.py

Syncs players from Rankade to the local database.

```bash
cd /home/bc/vanguard-league-platform
source backend/venv/bin/activate
python scripts/sync_players.py
```

**Features:**
- Fetches all players from Rankade (handles pagination)
- Creates new players in local database
- Updates existing player information
- Updates player photos from Rankade

**When to run:**
- Initially to populate player database
- After adding new members via Rankade webapp
- Periodically to keep player data in sync

### sync_rankings.py

Syncs rankings from Rankade to refresh leaderboards.

```bash
cd /home/bc/vanguard-league-platform
source backend/venv/bin/activate

# Sync main rankings
python scripts/sync_rankings.py

# Sync specific subset (weight class)
python scripts/sync_rankings.py --subset SUBSET_ID

# Sync all subsets
python scripts/sync_rankings.py --all
```

**Features:**
- Fetches current rankings from Rankade
- Updates player metadata from rankings
- Can target specific subsets or sync all

**When to run:**
- After matches are processed by Rankade
- Before displaying leaderboards
- Periodically (e.g., every hour) via cron

## Setting up Cron Jobs

To automate syncing, add these to your crontab:

```bash
# Edit crontab
crontab -e

# Add these lines (adjust paths as needed):

# Sync players daily at 3 AM
0 3 * * * cd /home/bc/vanguard-league-platform && source backend/venv/bin/activate && python scripts/sync_players.py >> /var/log/vanguard/sync_players.log 2>&1

# Sync rankings every hour
0 * * * * cd /home/bc/vanguard-league-platform && source backend/venv/bin/activate && python scripts/sync_rankings.py --all >> /var/log/vanguard/sync_rankings.log 2>&1
```

## Requirements

All scripts require:
1. Backend virtual environment activated
2. `.env` file configured with Rankade API credentials
3. Database connection configured

## Environment Variables

Ensure these are set in `backend/.env`:

```env
RANKADE_API_KEY=your_api_key
RANKADE_API_SECRET=your_api_secret
RANKADE_GROUP_ID=your_group_id
DATABASE_URL=postgresql://...
```
