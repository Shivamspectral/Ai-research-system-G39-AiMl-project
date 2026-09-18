import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from backend.app.db.base import Base

class Source(Base):
    __tablename__ = "sources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    publisher: Mapped[str | None] = mapped_column(String, nullable=True)
    published_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    source_tier: Mapped[str] = mapped_column(String, default="unverified")  # primary|reputable_secondary|unverified
    retrieved_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)