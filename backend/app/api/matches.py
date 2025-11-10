from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.match import Match, MatchResult
from app.models.player import Player
from app.schemas.match import MatchCreate, MatchSubmissionResult

router = APIRouter()

# Note: Rankade sync functionality has been removed as the local ELO system
# is now the primary rating system. Rankade service code is kept in
# app/services/rankade.py for reference but is no longer actively used.


@router.put("/matches/{match_id}/result")
def update_match_result(
    match_id: int,
    result: str,  # 'a_win', 'b_win', 'draw'
    method: str | None = None,
    duration_seconds: int | None = None,
    db: Session = Depends(get_db)
):
    """Update match result"""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Update match
    if result == 'a_win':
        match.result = MatchResult.PLAYER_A_WIN
    elif result == 'b_win':
        match.result = MatchResult.PLAYER_B_WIN
    elif result == 'draw':
        match.result = MatchResult.DRAW
    else:
        raise HTTPException(status_code=400, detail="Invalid result")

    match.method = method
    match.duration_seconds = duration_seconds

    db.commit()

    return {"message": "Result updated successfully"}
