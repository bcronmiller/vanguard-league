from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PlayerBase(BaseModel):
    name: str
    belt: Optional[str] = None
    team: Optional[str] = None
    photo_url: Optional[str] = None


class PlayerCreate(PlayerBase):
    rankade_id: Optional[str] = None


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    belt: Optional[str] = None
    team: Optional[str] = None
    photo_url: Optional[str] = None
    active: Optional[bool] = None


class PlayerResponse(PlayerBase):
    id: int
    rankade_id: Optional[str]
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
