from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import health, players, matches, rankings, checkin, brackets, events, ladder, rankings_recalc, tournament

app = FastAPI(
    title="Vanguard League API",
    description="Submission-only ladder league platform API",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with centralized prefix from settings
app.include_router(health.router, prefix=settings.API_PREFIX, tags=["health"])
app.include_router(events.router, prefix=settings.API_PREFIX, tags=["events"])
app.include_router(players.router, prefix=settings.API_PREFIX, tags=["players"])
app.include_router(matches.router, prefix=settings.API_PREFIX, tags=["matches"])
app.include_router(rankings.router, prefix=settings.API_PREFIX, tags=["rankings"])
app.include_router(checkin.router, prefix=settings.API_PREFIX, tags=["checkin"])
app.include_router(brackets.router, prefix=settings.API_PREFIX, tags=["brackets"])
app.include_router(ladder.router, prefix=settings.API_PREFIX, tags=["ladder"])
app.include_router(rankings_recalc.router, prefix=settings.API_PREFIX, tags=["rankings"])
app.include_router(tournament.router, prefix=settings.API_PREFIX, tags=["tournaments"])


@app.get("/")
async def root():
    return {
        "message": "Vanguard League API",
        "version": "0.1.0",
        "status": "operational"
    }
