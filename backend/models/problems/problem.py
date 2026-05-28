from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.utils.db import Base

# ==============================================================================
# PROBLEM
# A coding problem that can be assigned to classes. Each problem has language-
# specific implementations (skeleton, solution, hidden code) and test cases.
# Soft-deleted by setting is_published to false rather than removing the row.
# Problems are versioned to track changes over time.
#
# id                      INT         Primary Key, Auto-increment
# slug                    VARCHAR     Unique, Indexed — URL-friendly identifier e.g. "two-sum"
# title                   VARCHAR     Not Null, Indexed — display name of the problem
# description             TEXT        Not Null — full problem statement and requirements
# difficulty              VARCHAR     Not Null, Indexed — "easy" | "medium" | "hard"
# category                VARCHAR     Nullable, Indexed — "arrays" | "strings" | "graphs" | etc
# estimated_time_minutes  INT         Nullable — time to solve in minutes
# is_published            BOOL        Default True — set to False to soft-delete the problem
# created_by              INT         Nullable, Foreign Key → users.id — author of the problem
# created_at              TIMESTAMP   Auto-set on creation
# updated_at              TIMESTAMP   Auto-updated on every save
# version                 INT         Default 1 — incremented when problem is modified
# ==============================================================================
class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(20), index=True)
    category: Mapped[str | None] = mapped_column(String(100), index=True)
    estimated_time_minutes: Mapped[int | None] = mapped_column(Integer)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    version: Mapped[int] = mapped_column(Integer, default=1)

    implementations = relationship("ProblemImplementation", back_populates="problem", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="problem", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="problem")