from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.utils.db import Base

# ==============================================================================
# PROBLEM_IMPLEMENTATION
# Language-specific code templates for a problem. One row per problem per language.
# Contains skeleton code (starter template), solution code (reference), and hidden
# code (helper functions/utilities available during testing). A problem cannot have
# duplicate implementations for the same language.
#
# id              INT         Primary Key, Auto-increment
# problem_id      INT         Foreign Key → problems.id, Not Null, Indexed
# language        VARCHAR     Not Null — "python" | "java" | "javascript" | etc
# skeleton_code   TEXT        Nullable — starter template shown to students
# solution_code   TEXT        Nullable — reference solution for grading/review
# hidden_code     TEXT        Nullable — utility code injected during test execution
# created_at      TIMESTAMP   Auto-set on creation
# updated_at      TIMESTAMP   Auto-updated on every save
#
# UNIQUE (problem_id, language) — prevents duplicate implementations per language
# ==============================================================================

class ProblemImplementation(Base):
    __tablename__ = "problem_implementations"
    __table_args__ = (UniqueConstraint("problem_id", "language"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), index=True)
    language: Mapped[str] = mapped_column(String(50))
    skeleton_code: Mapped[str | None] = mapped_column(Text)
    solution_code: Mapped[str | None] = mapped_column(Text)
    hidden_code: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    problem = relationship("Problem", back_populates="implementations")