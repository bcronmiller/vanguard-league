from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class WeightClass(Base):
    __tablename__ = "weight_classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g., "Lightweight", "Middleweight"
    min_kg = Column(Float, nullable=False)
    max_kg = Column(Float, nullable=False)

    # Relationships
    entries = relationship("Entry", back_populates="weight_class")
    payouts = relationship("Payout", back_populates="weight_class")
