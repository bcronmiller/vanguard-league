# Vanguard League Platform - Backend

FastAPI backend for the Vanguard League submission-only ladder competition platform.

## Setup

### 1. Create virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.sample .env
# Edit .env with your database credentials and Rankade API keys
```

### 4. Run database migrations
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

### 5. Run the development server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/          # API route handlers
│   ├── core/         # Configuration and database
│   ├── models/       # SQLAlchemy models
│   ├── schemas/      # Pydantic schemas
│   ├── services/     # Business logic
│   └── main.py       # FastAPI application
├── alembic/          # Database migrations
├── requirements.txt  # Python dependencies
└── .env              # Environment variables (create from .env.sample)
```

## Database Models

- **Player**: Competitor profiles with Rankade integration
- **WeightClass**: Weight divisions for competition
- **Event**: Competition events
- **Entry**: Player registrations for events
- **WeighIn**: Weight records for players
- **Match**: Match results and submissions
- **Payout**: Season prize pool tracking

## Development

### Create a new migration
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations
```bash
alembic upgrade head
```

### Rollback migration
```bash
alembic downgrade -1
```

### Run tests (TODO)
```bash
pytest
```
