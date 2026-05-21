from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.utils.db import Base

# ==============================================================================
# BATCH
# A curated collection of problems organized in sequence to guide learning
# progression. Groups related problems by language and skill level. Used for
# structured learning paths and curriculum design.
#
# id              INT         Primary Key, Auto-increment
# name            VARCHAR     Not Null — display name of the batch
# description     TEXT        Nullable — optional description of the batch
# language        VARCHAR     Nullable, Indexed — "python" | "java" | "javascript" | etc
# skill_level     VARCHAR     Nullable — "beginner" | "intermediate" | "advanced"
# created_at      TIMESTAMP   Auto-set on creation
# updated_at      TIMESTAMP   Auto-updated on every save
# ==============================================================================

class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(String(50), index=True)
    skill_level: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)