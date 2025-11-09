from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class EventStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    REGISTRATION_OPEN = "registration_open"
    CHECK_IN = "check_in"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    venue = Column(String, nullable=False, default="VGI Trench")
    status = Column(SQLEnum(EventStatus), default=EventStatus.UPCOMING)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    entries = relationship("Entry", back_populates="event")
    matches = relationship("Match", back_populates="event")
    weigh_ins = relationship("WeighIn", back_populates="event")
