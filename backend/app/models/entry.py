from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime, String, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Entry(Base):
    __tablename__ = "entries"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    weight_class_id = Column(Integer, ForeignKey("weight_classes.id"), nullable=True)
    checked_in = Column(Boolean, default=False)

    # Snapshot of player stats at this event (captured during check-in)
    belt_rank = Column(String, nullable=True)  # Belt rank at time of event
    weight = Column(Float, nullable=True)  # Weight at time of event (lbs)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="entries")
    player = relationship("Player", back_populates="entries")
    weight_class = relationship("WeightClass", back_populates="entries")
