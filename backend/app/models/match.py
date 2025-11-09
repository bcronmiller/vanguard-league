from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class MatchResult(str, enum.Enum):
    PLAYER_A_WIN = "a_win"
    PLAYER_B_WIN = "b_win"
    DRAW = "draw"
    NO_CONTEST = "no_contest"


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    a_player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    b_player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    result = Column(SQLEnum(MatchResult), nullable=True)
    method = Column(String, nullable=True)  # submission type or "draw"
    duration_seconds = Column(Integer, nullable=True)
    rankade_match_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="matches")
    player_a = relationship("Player", foreign_keys=[a_player_id])
    player_b = relationship("Player", foreign_keys=[b_player_id])
