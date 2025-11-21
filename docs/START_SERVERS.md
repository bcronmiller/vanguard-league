# Starting the Vanguard League Platform

## Quick Start

### Terminal 1 - Backend API
```bash
cd /home/bc/vanguard-league-platform/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access at:
- **API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

### Terminal 2 - Frontend
```bash
cd /home/bc/vanguard-league-platform/frontend
npm run dev
```

Access at:
- **Frontend**: http://localhost:3000

## Available API Endpoints

### Health & Status
- `GET /api/health` - Health check
- `GET /api/quota` - Rankade API quota status

### Players
- `GET /api/players` - List players
- `POST /api/players` - Create player
- `GET /api/players/{id}` - Get player
- `PUT /api/players/{id}` - Update player
- `POST /api/players/sync-from-rankade` - Sync from Rankade

### Matches
- `POST /api/matches/submit-to-rankade` - Submit matches
- `POST /api/matches/create-submission-only` - Quick submission win
- `POST /api/matches/create-draw` - Quick draw match
- `GET /api/matches/status` - Match processing status

### Rankings
- `GET /api/rankings` - Get rankings
- `GET /api/rankings/by-weight-class/{name}` - Rankings by division
- `GET /api/subsets` - List weight classes

## Configuration

Database: `vanguard_league`
- User: `vanguard`
- Password: `vanguard2025`
- Host: `localhost:5432`

Rankade API: Configured and working
- Group ID: `6WLA1lwyKz2`
- API quota: Available

## Next Steps

1. **Add Players**: Visit your Rankade group and add members
2. **Sync Players**: `POST /api/players/sync-from-rankade`
3. **Submit Matches**: Use the API endpoints or scripts
4. **View Rankings**: Check rankings by weight class

## Useful Commands

### Database
```bash
# View tables
sudo -u postgres psql -d vanguard_league -c "\dt"

# View players
sudo -u postgres psql -d vanguard_league -c "SELECT * FROM players;"
```

### Sync Scripts
```bash
cd /home/bc/vanguard-league-platform
source backend/venv/bin/activate

# Sync players
python scripts/sync_players.py

# Sync rankings
python scripts/sync_rankings.py --all
```
