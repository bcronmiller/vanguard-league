from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class MatchResult(str, enum.Enum):
    PLAYER_A_WIN = "a_win"
    PLAYER_B_WIN = "b_win"
    DRAW = "draw"
    NO_CONTEST = "no_contest"


class MatchStatus(str, enum.Enum):
    """Status of a match in a bracket"""
    PENDING = "pending"  # Not yet ready to be fought (waiting for dependencies)
    READY = "ready"  # Ready to be fought (dependencies met)
    IN_PROGRESS = "in_progress"  # Currently being fought
    COMPLETED = "completed"  # Result recorded
    CANCELLED = "cancelled"  # Match cancelled


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    a_player_id = Column(Integer, ForeignKey("players.id"), nullable=True)  # Nullable for TBD players
    b_player_id = Column(Integer, ForeignKey("players.id"), nullable=True)  # Nullable for TBD players
    weight_class_id = Column(Integer, ForeignKey("weight_classes.id"), nullable=True)  # Which division this match was fought at
    result = Column(SQLEnum(MatchResult), nullable=True)
    method = Column(String, nullable=True)  # submission type or "draw"
    duration_seconds = Column(Integer, nullable=True)

    # Bracket/tournament fields
    bracket_round_id = Column(Integer, ForeignKey("bracket_rounds.id"), nullable=True, index=True)
    match_status = Column(SQLEnum(MatchStatus), default=MatchStatus.PENDING)
    match_number = Column(Integer, nullable=True)  # Position in bracket (for display/ordering)

    # Bracket dependencies - which matches feed into this one
    depends_on_match_a = Column(Integer, ForeignKey("matches.id"), nullable=True)  # Winner/loser of this match → player A
    depends_on_match_b = Column(Integer, ForeignKey("matches.id"), nullable=True)  # Winner/loser of this match → player B

    # For losers bracket: track if we need winner or loser from dependency
    requires_winner_a = Column(Boolean, default=True)  # True = winner of depends_on_match_a, False = loser
    requires_winner_b = Column(Boolean, default=True)  # True = winner of depends_on_match_b, False = loser

    # Scheduling
    scheduled_time = Column(DateTime, nullable=True)  # When match is scheduled to start
    started_at = Column(DateTime, nullable=True)  # When match actually started
    completed_at = Column(DateTime, nullable=True)  # When match was completed

    # ELO tracking - stores the rating change for each player from this match
    a_elo_change = Column(Integer, nullable=True)  # Player A's ELO change (+/-)
    b_elo_change = Column(Integer, nullable=True)  # Player B's ELO change (+/-)

    # Rankade sync tracking
    rankade_match_id = Column(String, unique=True, nullable=True, index=True)  # Rankade's match ID
    synced_to_rankade = Column(Boolean, default=False)  # Whether this match has been sent to Rankade
    rankade_sync_error = Column(Text, nullable=True)  # Any error from Rankade sync

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="matches")
    player_a = relationship("Player", foreign_keys=[a_player_id])
    player_b = relationship("Player", foreign_keys=[b_player_id])
    weight_class = relationship("WeightClass")
    bracket_round = relationship("BracketRound", back_populates="matches", foreign_keys=[bracket_round_id])

    # Self-referential relationships for bracket dependencies
    dependency_a = relationship("Match", foreign_keys=[depends_on_match_a], remote_side=[id], uselist=False)
    dependency_b = relationship("Match", foreign_keys=[depends_on_match_b], remote_side=[id], uselist=False)
