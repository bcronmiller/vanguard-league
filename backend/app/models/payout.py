from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True)
    season = Column(String, nullable=False)  # e.g., "2025-Q1"
    weight_class_id = Column(Integer, ForeignKey("weight_classes.id"), nullable=False)
    winner_player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    amount = Column(Float, nullable=False)
    paid = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    weight_class = relationship("WeightClass", back_populates="payouts")
    winner = relationship("Player")
