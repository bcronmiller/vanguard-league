from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class TournamentFormat(str, enum.Enum):
    """Supported tournament formats"""
    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    SWISS = "swiss"
    ROUND_ROBIN = "round_robin"
    GUARANTEED_MATCHES = "guaranteed_matches"  # Ladder-style with guaranteed match count


class BracketFormat(Base):
    """
    Configuration for tournament format per event and optionally per weight class.
    Defines how brackets should be generated and managed.
    """
    __tablename__ = "bracket_formats"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    weight_class_id = Column(Integer, ForeignKey("weight_classes.id"), nullable=True, index=True)

    # Format type
    format_type = Column(SQLEnum(TournamentFormat), nullable=False, default=TournamentFormat.SINGLE_ELIMINATION)

    # Format-specific configuration stored as JSON
    # Examples:
    # - guaranteed_matches: {"match_count": 3, "max_rematches": 1}
    # - swiss: {"rounds": 5, "pairing_method": "strength"}
    # - elimination: {"third_place_match": true, "seeding_method": "random"}
    config = Column(JSON, nullable=False, default=dict)

    # Match scheduling constraints
    min_rest_minutes = Column(Integer, nullable=False, default=30)  # Minimum rest between matches for a fighter
    max_matches_per_session = Column(Integer, nullable=True)  # Optional limit on matches per fighter per session

    # Bracket generation flags
    auto_generate = Column(Boolean, default=True)  # Auto-generate next round when previous completes
    is_generated = Column(Boolean, default=False)  # Whether bracket has been initially generated
    is_finalized = Column(Boolean, default=False)  # Whether bracket is locked (no more changes)

    # Relationships
    event = relationship("Event", back_populates="bracket_formats")
    weight_class = relationship("WeightClass")
    rounds = relationship("BracketRound", back_populates="bracket_format", cascade="all, delete-orphan")
