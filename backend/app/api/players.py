from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.player import Player
from app.schemas.player import PlayerCreate, PlayerResponse, PlayerUpdate
from app.services.rankade import rankade_service

router = APIRouter()


@router.get("/players", response_model=List[PlayerResponse])
async def get_players(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get list of players"""
    players = db.query(Player).filter(Player.active == True).offset(skip).limit(limit).all()
    return players


@router.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get a specific player"""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.post("/players", response_model=PlayerResponse)
async def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    """Create a new player"""
    # Check if player already exists
    existing = db.query(Player).filter(Player.name == player.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Player already exists")

    db_player = Player(**player.model_dump())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


@router.put("/players/{player_id}", response_model=PlayerResponse)
async def update_player(
    player_id: int,
    player_update: PlayerUpdate,
    db: Session = Depends(get_db)
):
    """Update a player"""
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")

    for field, value in player_update.model_dump(exclude_unset=True).items():
        setattr(db_player, field, value)

    db.commit()
    db.refresh(db_player)
    return db_player


@router.post("/players/sync-from-rankade")
async def sync_players_from_rankade(db: Session = Depends(get_db)):
    """Sync players from Rankade to local database"""
    try:
        # Get players from Rankade
        result = await rankade_service.get_players()

        synced = 0
        for rankade_player in result.get("success", {}).get("players", []):
            # Check if player exists
            player = db.query(Player).filter(
                Player.rankade_id == rankade_player["id"]
            ).first()

            if not player:
                # Create new player
                player = Player(
                    rankade_id=rankade_player["id"],
                    name=rankade_player["name"],
                    photo_url=rankade_player.get("ghost", {}).get("picture")
                )
                db.add(player)
                synced += 1
            else:
                # Update existing player
                player.name = rankade_player["name"]
                player.active = True

        db.commit()

        return {
            "message": f"Synced {synced} new players from Rankade",
            "total_synced": synced
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rankade sync failed: {str(e)}")
