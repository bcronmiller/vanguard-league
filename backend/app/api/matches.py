from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.match import Match, MatchResult
from app.models.player import Player
from app.schemas.match import MatchCreate, MatchSubmissionResult
from app.services.rankade import rankade_service

router = APIRouter()


@router.post("/matches/submit-to-rankade", response_model=MatchSubmissionResult)
async def submit_matches_to_rankade(
    matches: List[MatchCreate],
    dryrun: bool = False,
    db: Session = Depends(get_db)
):
    """
    Submit matches to Rankade

    For submission-only matches:
    - Winner: rank = 1
    - Loser: rank = 2
    - Draw: both rank = 1
    """
    if len(matches) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 matches per submission"
        )

    try:
        # Convert matches to Rankade format
        rankade_matches = [match.model_dump(exclude_none=True) for match in matches]

        # Submit to Rankade
        result = await rankade_service.submit_matches(rankade_matches, dryrun=dryrun)

        # Parse results
        success_data = result.get("success", {})

        return MatchSubmissionResult(
            accepted=success_data.get("accepted", 0),
            rejected=success_data.get("rejected", 0),
            total=success_data.get("total", 0),
            details=success_data.get("matches", [])
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit matches: {str(e)}"
        )


@router.get("/matches/status")
async def get_matches_status():
    """Get status of API-submitted matches"""
    try:
        return await rankade_service.get_matches_status()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get match status: {str(e)}"
        )


@router.get("/matches/check/{match_id}")
async def check_match_exists(match_id: str):
    """Check if a match exists in Rankade by external ID"""
    try:
        exists = await rankade_service.check_match_exists(match_id)
        return {"match_id": match_id, "exists": exists}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check match: {str(e)}"
        )


@router.post("/matches/create-submission-only")
async def create_submission_only_match(
    event_id: int,
    winner_rankade_id: str,
    loser_rankade_id: str,
    game_id: int,
    method: str,
    duration_seconds: int = None,
    weight: str = "normal",
    notes: str = None,
    db: Session = Depends(get_db)
):
    """
    Helper endpoint to create a submission-only match
    Automatically formats for Rankade submission
    """
    # Validate players exist
    winner = db.query(Player).filter(Player.rankade_id == winner_rankade_id).first()
    loser = db.query(Player).filter(Player.rankade_id == loser_rankade_id).first()

    if not winner or not loser:
        raise HTTPException(status_code=404, detail="Player not found")

    # Create match for Rankade
    match = MatchCreate(
        game=game_id,
        weight=weight,
        factions=[
            {
                "rank": 1,
                "players": [winner_rankade_id],
                "name": winner.name
            },
            {
                "rank": 2,
                "players": [loser_rankade_id],
                "name": loser.name
            }
        ],
        notes=f"Method: {method}" + (f" | {notes}" if notes else "")
    )

    # Submit to Rankade
    result = await submit_matches_to_rankade([match], dryrun=False, db=db)

    return {
        "message": "Match submitted",
        "result": result
    }


@router.post("/matches/create-draw")
async def create_draw_match(
    event_id: int,
    player_a_rankade_id: str,
    player_b_rankade_id: str,
    game_id: int,
    duration_seconds: int = None,
    weight: str = "normal",
    notes: str = None,
    db: Session = Depends(get_db)
):
    """
    Helper endpoint to create a draw match
    Both players get rank 1
    """
    # Validate players exist
    player_a = db.query(Player).filter(Player.rankade_id == player_a_rankade_id).first()
    player_b = db.query(Player).filter(Player.rankade_id == player_b_rankade_id).first()

    if not player_a or not player_b:
        raise HTTPException(status_code=404, detail="Player not found")

    # Create match for Rankade
    match = MatchCreate(
        game=game_id,
        weight=weight,
        factions=[
            {
                "rank": 1,
                "players": [player_a_rankade_id],
                "name": player_a.name
            },
            {
                "rank": 1,
                "players": [player_b_rankade_id],
                "name": player_b.name
            }
        ],
        notes=f"Draw - No submission" + (f" | {notes}" if notes else "")
    )

    # Submit to Rankade
    result = await submit_matches_to_rankade([match], dryrun=False, db=db)

    return {
        "message": "Draw match submitted",
        "result": result
    }
