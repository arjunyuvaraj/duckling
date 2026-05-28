from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.utils.db import Base


# ==============================================================================
# ASSIGNMENT
# A problem that a teacher has assigned to a class, with an optional deadline
# and custom instructions. Assignments reference problems from the problem bank
# rather than owning them, so the same problem can be assigned to many classes.
#
# id            INT         Primary Key, Auto-increment
# class_id      INT         Foreign Key → classes.id, Not Null, Indexed
# problem_id    INT         Foreign Key → problems.id, Not Null, Indexed
# title         VARCHAR     Nullable — defaults to the problem title if not set
# instructions  TEXT        Nullable — teacher's custom instructions for this assignment
# assigned_at   TIMESTAMP   Auto-set to when the assignment was created
# due_at        TIMESTAMP   Nullable, Indexed — null means no deadline
# created_by    INT         Foreign Key → users.id, Not Null — the teacher who made it
# created_at    TIMESTAMP   Auto-set on creation
# updated_at    TIMESTAMP   Auto-updated on every save
# ==============================================================================

class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), index=True)
    title: Mapped[str | None] = mapped_column(String(255))
    instructions: Mapped[str | None] = mapped_column(Text)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_ = relationship("Class", back_populates="assignments")