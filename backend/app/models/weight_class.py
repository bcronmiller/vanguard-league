from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class WeightClass(Base):
    __tablename__ = "weight_classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g., "Lightweight", "Middleweight"
    min_lbs = Column(Float, nullable=True)  # Minimum weight in lbs (nullable for open-ended)
    max_lbs = Column(Float, nullable=True)  # Maximum weight in lbs (nullable for open-ended)

    # Relationships
    players = relationship("Player", back_populates="weight_class")
    entries = relationship("Entry", back_populates="weight_class")
    payouts = relationship("Payout", back_populates="weight_class")
