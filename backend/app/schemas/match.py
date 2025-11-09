from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class MatchWeight(str, Enum):
    ULTRALIGHT = "ultralight"
    LIGHT = "light"
    MIDLIGHT = "midlight"
    NORMAL = "normal"
    HEAVY = "heavy"
    MASSIVE = "massive"


class FactionCreate(BaseModel):
    rank: int = Field(..., ge=1, description="Faction rank (1=winner)")
    players: List[str] = Field(..., min_length=1, max_length=50)
    name: Optional[str] = None
    score: Optional[str] = None


class MatchCreate(BaseModel):
    """Schema for creating a match to submit to Rankade"""
    id: Optional[str] = Field(None, description="External match ID")
    name: Optional[str] = Field(None, description="Match name")
    game: int = Field(..., description="Rankade game ID")
    weight: MatchWeight = MatchWeight.NORMAL
    factions: List[FactionCreate] = Field(..., min_length=2, max_length=100)
    notes: Optional[str] = None
    date: Optional[str] = Field(None, description="ISO 8601 datetime (Custom/Dedicated tier only)")


class MatchSubmissionResult(BaseModel):
    """Result of match submission"""
    accepted: int
    rejected: int
    total: int
    details: List[dict]
