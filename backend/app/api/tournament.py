"""
Tournament/Bracket API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.bracket_format import BracketFormat, TournamentFormat
from app.models.bracket_round import BracketRound, RoundStatus
from app.models.match import Match, MatchStatus, MatchResult
from app.models.player import Player
from app.services.tournament_engine import TournamentEngine
from app.services.elo_service import preview_elo_changes, get_head_to_head

router = APIRouter()


# === Pydantic Schemas ===

class BracketFormatCreate(BaseModel):
    event_id: int
    weight_class_id: Optional[int] = None
    format_type: TournamentFormat
    config: Optional[dict] = None
    min_rest_minutes: int = 30


class BracketFormatResponse(BaseModel):
    id: int
    event_id: int
    weight_class_id: Optional[int]
    format_type: TournamentFormat
    config: dict
    min_rest_minutes: int
    auto_generate: bool
    is_generated: bool
    is_finalized: bool

    class Config:
        from_attributes = True


class BracketRoundResponse(BaseModel):
    id: int
    bracket_format_id: int
    round_number: int
    round_name: Optional[str]
    bracket_type: Optional[str]
    status: RoundStatus
    round_data: dict

    class Config:
        from_attributes = True


class MatchResponse(BaseModel):
    id: int
    event_id: int
    bracket_round_id: Optional[int]
    a_player_id: Optional[int]
    b_player_id: Optional[int]
    weight_class_id: Optional[int]
    result: Optional[MatchResult]
    method: Optional[str]
    duration_seconds: Optional[int]
    match_status: MatchStatus
    match_number: Optional[int]
    depends_on_match_a: Optional[int]
    depends_on_match_b: Optional[int]
    requires_winner_a: bool
    requires_winner_b: bool
    scheduled_time: Optional[str]

    class Config:
        from_attributes = True


class MatchResultUpdate(BaseModel):
    result: MatchResult
    method: Optional[str] = None
    duration_seconds: Optional[int] = None


class PlayerStats(BaseModel):
    id: int
    name: str
    photo_url: Optional[str]
    bjj_belt_rank: Optional[str]
    weight: Optional[float]
    academy: Optional[str]
    elo_rating: Optional[float]
    wins: int
    losses: int
    draws: int
    win_streak: int

    class Config:
        from_attributes = True


class TaleOfTheTape(BaseModel):
    match_id: int
    match_status: MatchStatus
    round_name: Optional[str]
    player_a: PlayerStats
    player_b: PlayerStats
    head_to_head: dict
    elo_preview: dict

    class Config:
        from_attributes = True


# === API Endpoints ===

@router.post("/tournaments/brackets", response_model=BracketFormatResponse)
async def create_bracket(
    bracket_data: BracketFormatCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new tournament bracket for an event.

    Args:
        bracket_data: Bracket configuration
        db: Database session

    Returns:
        Created BracketFormat
    """
    engine = TournamentEngine(db)

    try:
        bracket_format = engine.create_bracket(
            event_id=bracket_data.event_id,
            weight_class_id=bracket_data.weight_class_id,
            format_type=bracket_data.format_type,
            config=bracket_data.config,
            min_rest_minutes=bracket_data.min_rest_minutes,
        )
        return bracket_format
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tournaments/brackets/{bracket_id}/generate", response_model=List[BracketRoundResponse])
async def generate_bracket(
    bracket_id: int,
    db: Session = Depends(get_db)
):
    """
    Generate the initial rounds/matches for a bracket.

    Args:
        bracket_id: BracketFormat ID
        db: Database session

    Returns:
        List of created BracketRounds
    """
    engine = TournamentEngine(db)

    try:
        rounds = engine.generate_bracket(bracket_id)
        return rounds
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tournaments/brackets/{bracket_id}", response_model=BracketFormatResponse)
async def get_bracket(
    bracket_id: int,
    db: Session = Depends(get_db)
):
    """Get bracket configuration"""
    bracket = db.query(BracketFormat).filter(BracketFormat.id == bracket_id).first()

    if not bracket:
        raise HTTPException(status_code=404, detail="Bracket not found")

    return bracket


@router.get("/tournaments/brackets/{bracket_id}/rounds", response_model=List[BracketRoundResponse])
async def get_bracket_rounds(
    bracket_id: int,
    db: Session = Depends(get_db)
):
    """Get all rounds for a bracket"""
    rounds = db.query(BracketRound).filter(
        BracketRound.bracket_format_id == bracket_id
    ).order_by(BracketRound.round_number).all()

    return rounds


@router.get("/tournaments/brackets/{bracket_id}/matches", response_model=List[MatchResponse])
async def get_bracket_matches(
    bracket_id: int,
    round_id: Optional[int] = None,
    status: Optional[MatchStatus] = None,
    db: Session = Depends(get_db)
):
    """
    Get matches for a bracket.

    Args:
        bracket_id: BracketFormat ID
        round_id: Optional filter by BracketRound ID
        status: Optional filter by MatchStatus
        db: Database session

    Returns:
        List of matches
    """
    query = db.query(Match).join(BracketRound).filter(
        BracketRound.bracket_format_id == bracket_id
    )

    if round_id:
        query = query.filter(Match.bracket_round_id == round_id)

    if status:
        query = query.filter(Match.match_status == status)

    matches = query.order_by(BracketRound.round_number, Match.match_number).all()

    return matches


@router.get("/tournaments/brackets/{bracket_id}/upcoming", response_model=List[MatchResponse])
async def get_upcoming_matches(
    bracket_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get upcoming matches that are ready to be fought,
    respecting rest intervals.

    Args:
        bracket_id: BracketFormat ID
        limit: Maximum number of matches to return
        db: Database session

    Returns:
        List of ready matches
    """
    engine = TournamentEngine(db)

    try:
        matches = engine.get_upcoming_matches(bracket_id, limit)
        return matches
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/tournaments/matches/{match_id}/result", response_model=MatchResponse)
async def update_match_result(
    match_id: int,
    result_data: MatchResultUpdate,
    db: Session = Depends(get_db)
):
    """
    Update match result and propagate to dependent matches.

    Args:
        match_id: Match ID
        result_data: Match result data
        db: Database session

    Returns:
        Updated match
    """
    engine = TournamentEngine(db)

    try:
        match = engine.update_match_result(
            match_id=match_id,
            result=result_data.result,
            method=result_data.method,
            duration_seconds=result_data.duration_seconds,
        )
        return match
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tournaments/matches/{match_id}/result")
async def undo_match_result(
    match_id: int,
    db: Session = Depends(get_db)
):
    """
    Undo a match result and recalculate ELO ratings.

    This will:
    - Clear the match result, method, and duration
    - Reset match status to READY (or PENDING if players not set)
    - Clear any dependent matches that were populated by this result
    - Trigger ELO recalculation for all players

    Args:
        match_id: Match ID
        db: Database session

    Returns:
        Success message
    """
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if not match.result:
        raise HTTPException(status_code=400, detail="Match has no result to undo")

    # Store the winner/loser before clearing
    if match.result == MatchResult.PLAYER_A_WIN:
        winner_id = match.a_player_id
        loser_id = match.b_player_id
    elif match.result == MatchResult.PLAYER_B_WIN:
        winner_id = match.b_player_id
        loser_id = match.a_player_id
    else:  # Draw
        winner_id = None
        loser_id = None

    # Find dependent matches that were populated by this result
    from sqlalchemy import or_
    dependent_matches = db.query(Match).filter(
        or_(
            Match.depends_on_match_a == match.id,
            Match.depends_on_match_b == match.id
        )
    ).all()

    # Clear players from dependent matches
    for dep_match in dependent_matches:
        if dep_match.depends_on_match_a == match.id:
            if dep_match.a_player_id in [winner_id, loser_id]:
                dep_match.a_player_id = None
                dep_match.match_status = MatchStatus.PENDING

        if dep_match.depends_on_match_b == match.id:
            if dep_match.b_player_id in [winner_id, loser_id]:
                dep_match.b_player_id = None
                dep_match.match_status = MatchStatus.PENDING

    # Clear the match result
    match.result = None
    match.method = None
    match.duration_seconds = None
    match.a_elo_change = None
    match.b_elo_change = None
    match.completed_at = None

    # Reset match status
    if match.a_player_id and match.b_player_id:
        match.match_status = MatchStatus.READY
    else:
        match.match_status = MatchStatus.PENDING

    db.commit()

    # Trigger ELO recalculation
    from app.api.rankings_recalc import recalculate_all_elo
    try:
        recalculate_all_elo(db)
    except Exception as e:
        # Log error but don't fail the undo
        print(f"Warning: ELO recalculation failed: {e}")

    return {
        "message": "Match result undone successfully",
        "match_id": match_id,
        "dependent_matches_cleared": len(dependent_matches)
    }


@router.delete("/tournaments/matches/{match_id}")
async def delete_match(
    match_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a match entirely (removes the pairing).

    This is useful for removing incorrect pairings or accommodating late entries.

    This will:
    - Check if any matches depend on this match
    - Clear references in dependent matches
    - Delete the match
    - Trigger ELO recalculation

    Args:
        match_id: Match ID
        db: Database session

    Returns:
        Success message
    """
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Find dependent matches
    from sqlalchemy import or_
    dependent_matches = db.query(Match).filter(
        or_(
            Match.depends_on_match_a == match.id,
            Match.depends_on_match_b == match.id
        )
    ).all()

    # Clear dependencies
    for dep_match in dependent_matches:
        if dep_match.depends_on_match_a == match.id:
            dep_match.depends_on_match_a = None
            dep_match.a_player_id = None
            dep_match.match_status = MatchStatus.PENDING

        if dep_match.depends_on_match_b == match.id:
            dep_match.depends_on_match_b = None
            dep_match.b_player_id = None
            dep_match.match_status = MatchStatus.PENDING

    # Store info for response
    had_result = match.result is not None
    bracket_round_id = match.bracket_round_id

    # Delete the match
    db.delete(match)
    db.commit()

    # Trigger ELO recalculation if match had a result
    if had_result:
        from app.api.rankings_recalc import recalculate_all_elo
        try:
            recalculate_all_elo(db)
        except Exception as e:
            print(f"Warning: ELO recalculation failed: {e}")

    return {
        "message": "Match deleted successfully",
        "match_id": match_id,
        "dependent_matches_cleared": len(dependent_matches),
        "bracket_round_id": bracket_round_id
    }


@router.get("/tournaments/events/{event_id}/brackets", response_model=List[BracketFormatResponse])
async def get_event_brackets(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get all brackets for an event"""
    brackets = db.query(BracketFormat).filter(
        BracketFormat.event_id == event_id
    ).all()

    return brackets


@router.get("/tournaments/matches/{match_id}/tale-of-the-tape", response_model=TaleOfTheTape)
async def get_tale_of_the_tape(
    match_id: int,
    db: Session = Depends(get_db)
):
    """
    Get complete "tale of the tape" for a match including:
    - Full fighter stats and details
    - Head-to-head history
    - ELO impact preview for all outcomes
    """
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if not match.a_player_id or not match.b_player_id:
        raise HTTPException(status_code=400, detail="Match has TBD players")

    # Get players
    player_a = db.query(Player).filter(Player.id == match.a_player_id).first()
    player_b = db.query(Player).filter(Player.id == match.b_player_id).first()

    if not player_a or not player_b:
        raise HTTPException(status_code=404, detail="One or both players not found")

    # Get player records
    from sqlalchemy import or_

    def get_player_record(player_id: int):
        matches = db.query(Match).filter(
            or_(Match.a_player_id == player_id, Match.b_player_id == player_id),
            Match.result.isnot(None)
        ).all()

        wins = 0
        losses = 0
        draws = 0
        current_streak = 0
        last_result = None

        for m in sorted(matches, key=lambda x: x.created_at or datetime.min):
            if m.a_player_id == player_id:
                if m.result == MatchResult.PLAYER_A_WIN:
                    wins += 1
                    result = "W"
                elif m.result == MatchResult.PLAYER_B_WIN:
                    losses += 1
                    result = "L"
                else:
                    draws += 1
                    result = "D"
            else:
                if m.result == MatchResult.PLAYER_B_WIN:
                    wins += 1
                    result = "W"
                elif m.result == MatchResult.PLAYER_A_WIN:
                    losses += 1
                    result = "L"
                else:
                    draws += 1
                    result = "D"

            # Calculate streak
            if result == "W":
                if last_result == "W":
                    current_streak += 1
                else:
                    current_streak = 1
            else:
                if last_result == "W":
                    current_streak = 0

            last_result = result

        return wins, losses, draws, current_streak

    from datetime import datetime

    a_wins, a_losses, a_draws, a_streak = get_player_record(player_a.id)
    b_wins, b_losses, b_draws, b_streak = get_player_record(player_b.id)

    # Get round name if available
    round_name = None
    if match.bracket_round_id:
        bracket_round = db.query(BracketRound).filter(BracketRound.id == match.bracket_round_id).first()
        if bracket_round:
            round_name = bracket_round.round_name

    # Get head-to-head
    head_to_head = get_head_to_head(db, player_a.id, player_b.id)

    # Get ELO preview
    elo_preview = preview_elo_changes(db, player_a.id, player_b.id)

    return {
        "match_id": match.id,
        "match_status": match.match_status,
        "round_name": round_name,
        "player_a": {
            "id": player_a.id,
            "name": player_a.name,
            "photo_url": player_a.photo_url,
            "bjj_belt_rank": player_a.bjj_belt_rank,
            "weight": player_a.weight,
            "academy": player_a.academy,
            "elo_rating": player_a.elo_rating,
            "wins": a_wins,
            "losses": a_losses,
            "draws": a_draws,
            "win_streak": a_streak,
        },
        "player_b": {
            "id": player_b.id,
            "name": player_b.name,
            "photo_url": player_b.photo_url,
            "bjj_belt_rank": player_b.bjj_belt_rank,
            "weight": player_b.weight,
            "academy": player_b.academy,
            "elo_rating": player_b.elo_rating,
            "wins": b_wins,
            "losses": b_losses,
            "draws": b_draws,
            "win_streak": b_streak,
        },
        "head_to_head": head_to_head,
        "elo_preview": elo_preview,
    }


@router.get("/tournaments/matches/{match_id}/elo-preview")
async def get_elo_preview(
    match_id: int,
    db: Session = Depends(get_db)
):
    """
    Get ELO impact preview for all possible match outcomes.
    Shows what will happen to both fighters' ratings for win/loss/draw.
    """
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if not match.a_player_id or not match.b_player_id:
        raise HTTPException(status_code=400, detail="Match has TBD players")

    try:
        elo_preview = preview_elo_changes(db, match.a_player_id, match.b_player_id)
        return elo_preview
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tournaments/events/{event_id}/format-recommendations")
async def get_format_recommendations(
    event_id: int,
    min_matches: int = 15,
    max_matches: int = 20,
    match_duration_minutes: int = 10,
    time_budget_minutes: int | None = None,
    db: Session = Depends(get_db)
):
    """
    Get tournament format recommendations based on number of checked-in fighters.

    Returns suggestions for which format to use with match counts, time estimates, and reasoning.

    Args:
        event_id: Event ID
        min_matches: Minimum desired matches (default 15) - ignored if time_budget_minutes is set
        max_matches: Maximum desired matches (default 20) - ignored if time_budget_minutes is set
        match_duration_minutes: Expected match duration in minutes (default 10)
        time_budget_minutes: Optional time budget for the event (e.g., 40, 60, 120 minutes)
        db: Database session

    Returns:
        Format recommendations sorted by: fits in time budget, then closest to budget
    """
    from app.models.entry import Entry

    # Count checked-in fighters for this event
    num_fighters = db.query(Entry).filter(
        Entry.event_id == event_id,
        Entry.checked_in == True
    ).count()

    if num_fighters < 2:
        return {
            "num_fighters": num_fighters,
            "min_matches": min_matches,
            "max_matches": max_matches,
            "match_duration_minutes": match_duration_minutes,
            "recommendations": [],
            "error": "Need at least 2 checked-in fighters to create a bracket"
        }

    # Get recommendations
    recommendations = TournamentEngine.recommend_format(
        num_fighters,
        min_matches,
        max_matches,
        match_duration_minutes
    )

    # If time budget is specified, update sorting to prioritize formats that fit in time
    if time_budget_minutes is not None:
        for rec in recommendations:
            rec["time_difference"] = abs(rec["estimated_time_minutes"] - time_budget_minutes)
            rec["fits_in_budget"] = rec["estimated_time_minutes"] <= time_budget_minutes

        # Sort by: fits in budget first, then closest to budget time
        recommendations.sort(key=lambda x: (not x["fits_in_budget"], x["time_difference"]))

    return {
        "num_fighters": num_fighters,
        "min_matches": min_matches,
        "max_matches": max_matches,
        "match_duration_minutes": match_duration_minutes,
        "recommendations": recommendations
    }
