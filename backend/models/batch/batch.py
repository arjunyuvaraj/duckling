from datetime import datetime
from sqlalchemy import BigInteger, DateTime, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY
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
# problem_set     VARCHAR     Not Null
# language        VARCHAR     Nullable, Indexed — "python" | "java" | "javascript" | etc
# skill_level     VARCHAR     Nullable — "beginner" | "intermediate" | "advanced"
# tags            TEXT[]      Not Null
# created_at      TIMESTAMP   Auto-set on creation
# updated_at      TIMESTAMP   Auto-updated on every save
# ==============================================================================

class Batch(Base):
    __tablename__ = "batches"
    __table_args__ = (UniqueConstraint("problem_set", "name"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    problem_set: Mapped[str] = mapped_column(String(120))
    language: Mapped[str | None] = mapped_column(String(50), index=True)
    skill_level: Mapped[str | None] = mapped_column(String(50))
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
