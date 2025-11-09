from sqlalchemy import Column, Integer, String, Boolean, DateTime
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
    photo_url = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    weigh_ins = relationship("WeighIn", back_populates="player")
    entries = relationship("Entry", back_populates="player")
