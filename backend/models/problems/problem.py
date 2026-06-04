from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base

# ==============================================================================
# PROBLEM
# A coding problem that can be assigned to classes. Each problem has language-
# specific implementations (skeleton, solution, hidden code) and test cases.
# Soft-deleted by setting is_published to false rather than removing the row.
# Problems are versioned to track changes over time.
#
# id                      BIGINT      Primary Key
# slug                    VARCHAR     Unique, Indexed — URL-friendly identifier e.g. "two-sum"
# title                   VARCHAR     Not Null, Indexed — display name of the problem
# description             TEXT        Not Null — full problem statement and requirements
# difficulty              VARCHAR     Not Null, Indexed — "Easy" | "Medium" | "Hard"
# language                VARCHAR     Not Null
# topic                   VARCHAR     Not Null, Indexed
# category                VARCHAR     Nullable, Indexed — "arrays" | "strings" | "graphs" | etc
# problem_set             VARCHAR     Not Null
# batch_name              VARCHAR     Not Null
# tags                    TEXT[]      Not Null
# acceptance              NUMERIC     Nullable
# estimated_time_minutes  INT         Nullable — time to solve in minutes
# is_published            BOOL        Default True — set to False to soft-delete the problem
# created_by              UUID        Nullable, Foreign Key → users.id — author of the problem
# created_at              TIMESTAMP   Auto-set on creation
# updated_at              TIMESTAMP   Auto-updated on every save
# version                 INT         Default 1 — incremented when problem is modified
# ==============================================================================
class Problem(Base):
    __tablename__ = "problems"
    __table_args__ = (
        CheckConstraint("difficulty in ('Easy', 'Medium', 'Hard')", name="problems_difficulty_check"),
        CheckConstraint("estimated_time_minutes > 0", name="problems_estimated_time_minutes_check"),
        CheckConstraint("version > 0", name="problems_version_check"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(20), index=True)
    language: Mapped[str] = mapped_column(String(50), index=True)
    topic: Mapped[str] = mapped_column(String(100), index=True)
    category: Mapped[str | None] = mapped_column(String(100), index=True)
    problem_set: Mapped[str] = mapped_column(String(120), index=True)
    batch_name: Mapped[str] = mapped_column(String(160), index=True)
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    acceptance: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    estimated_time_minutes: Mapped[int | None] = mapped_column(Integer)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    version: Mapped[int] = mapped_column(Integer, default=1)

    implementations = relationship("ProblemImplementation", back_populates="problem", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="problem", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="problem")
