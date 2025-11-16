from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PlayerBase(BaseModel):
    name: str
    belt: Optional[str] = None
    team: Optional[str] = None
    academy: Optional[str] = None  # Gym/academy affiliation
    photo_url: Optional[str] = None
    age: Optional[int] = None
    bjj_belt_rank: Optional[str] = None
    weight: Optional[float] = None
    weight_class_id: Optional[int] = None
    elo_rating: Optional[float] = None  # Our custom ELO (used in ladder rankings)
    rankade_ree_score: Optional[float] = None  # Rankade's REE score (reference only)


class PlayerCreate(PlayerBase):
    rankade_id: Optional[str] = None


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    belt: Optional[str] = None
    team: Optional[str] = None
    academy: Optional[str] = None  # Gym/academy affiliation
    photo_url: Optional[str] = None
    age: Optional[int] = None
    bjj_belt_rank: Optional[str] = None
    weight: Optional[float] = None
    weight_class_id: Optional[int] = None
    elo_rating: Optional[float] = None  # Our custom ELO (used in ladder rankings)
    rankade_ree_score: Optional[float] = None  # Rankade's REE score (reference only)
    active: Optional[bool] = None


class PlayerResponse(PlayerBase):
    id: int
    rankade_id: Optional[str]
    active: bool
    created_at: datetime
    updated_at: datetime
    weight_class_name: Optional[str] = None  # Computed from weight_class relationship
    badges: Optional[list] = None  # Computed badges (automatic + manual)
    manual_badges: Optional[list] = None  # Admin-awarded badges

    class Config:
        from_attributes = True
