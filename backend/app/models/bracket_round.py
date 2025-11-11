from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class RoundStatus(str, enum.Enum):
    """Status of a tournament round"""
    PENDING = "pending"  # Not yet started
    IN_PROGRESS = "in_progress"  # Some matches completed, some pending
    COMPLETED = "completed"  # All matches in this round completed
    CANCELLED = "cancelled"  # Round cancelled


class BracketRound(Base):
    """
    Represents a single round within a bracket.
    Each round contains multiple matches that should happen at roughly the same time.
    """
    __tablename__ = "bracket_rounds"

    id = Column(Integer, primary_key=True, index=True)
    bracket_format_id = Column(Integer, ForeignKey("bracket_formats.id"), nullable=False, index=True)

    # Round identification
    round_number = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    round_name = Column(String, nullable=True)  # e.g., "Quarterfinals", "Winners Bracket Round 1", "Swiss Round 3"

    # For double elimination: track which bracket this round belongs to
    bracket_type = Column(String, nullable=True)  # "winners", "losers", "finals" (or null for other formats)

    # Round state
    status = Column(SQLEnum(RoundStatus), default=RoundStatus.PENDING)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Match scheduling metadata
    estimated_start_time = Column(DateTime, nullable=True)  # When this round is expected to start
    actual_start_time = Column(DateTime, nullable=True)  # When first match in round actually started

    # Additional round data stored as JSON
    # Could include: seeding info, pairing algorithm used, etc.
    round_data = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    bracket_format = relationship("BracketFormat", back_populates="rounds")
    matches = relationship("Match", back_populates="bracket_round", foreign_keys="Match.bracket_round_id")
