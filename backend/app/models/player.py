from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
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
    elo_rating = Column(Float, nullable=True)  # ELO rating for competitive ranking (used in ladder)
    rankade_ree_score = Column(Float, nullable=True)  # Rankade REE score (for reference only)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    weigh_ins = relationship("WeighIn", back_populates="player")
    entries = relationship("Entry", back_populates="player")
    weight_class = relationship("WeightClass", back_populates="players")
