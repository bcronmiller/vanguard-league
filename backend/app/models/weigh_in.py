from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class WeighIn(Base):
    __tablename__ = "weigh_ins"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    weight = Column(Float, nullable=False)  # Weight in lbs
    weighed_at = Column(DateTime, default=datetime.utcnow)  # When weigh-in occurred
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    player = relationship("Player", back_populates="weigh_ins")
    event = relationship("Event", back_populates="weigh_ins")
