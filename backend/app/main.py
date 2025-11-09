from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import health, players, matches, rankings

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

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(players.router, prefix="/api", tags=["players"])
app.include_router(matches.router, prefix="/api", tags=["matches"])
app.include_router(rankings.router, prefix="/api", tags=["rankings"])


@app.get("/")
async def root():
    return {
        "message": "Vanguard League API",
        "version": "0.1.0",
        "status": "operational"
    }
