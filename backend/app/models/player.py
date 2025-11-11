from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    rankade_id = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=False)
    belt = Column(String, nullable=True)  # white, blue, purple, brown, black
    team = Column(String, nullable=True)
    academy = Column(String, nullable=True)  # Gym/academy affiliation
    photo_url = Column(String, nullable=True)
    age = Column(Integer, nullable=True)  # Age in years
    bjj_belt_rank = Column(String, nullable=True)  # BJJ belt rank (white, blue, purple, brown, black)
    weight = Column(Float, nullable=True)  # Weight in lbs
    weight_class_id = Column(Integer, ForeignKey("weight_classes.id"), nullable=True)

    # Global ELO (kept for backward compatibility)
    elo_rating = Column(Float, nullable=True)  # Overall ELO rating (legacy)
    rankade_ree_score = Column(Float, nullable=True)  # Rankade REE score (for reference only)

    # Weight class specific ELO ratings
    elo_lightweight = Column(Float, nullable=True)  # Current lightweight ELO
    elo_middleweight = Column(Float, nullable=True)  # Current middleweight ELO
    elo_heavyweight = Column(Float, nullable=True)  # Current heavyweight ELO

    # Initial ELO per weight class (for gain/loss calculation)
    initial_elo_lightweight = Column(Float, nullable=True)  # Starting lightweight ELO
    initial_elo_middleweight = Column(Float, nullable=True)  # Starting middleweight ELO
    initial_elo_heavyweight = Column(Float, nullable=True)  # Starting heavyweight ELO

    # Manual badges (awarded by admin)
    manual_badges = Column(JSON, nullable=True, default=[])

    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    weigh_ins = relationship("WeighIn", back_populates="player")
    entries = relationship("Entry", back_populates="player")
    weight_class = relationship("WeightClass", back_populates="players")
