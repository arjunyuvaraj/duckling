from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.utils.db import Base


# ==============================================================================
# ASSIGNMENT
# A problem that a teacher has assigned to a class, with an optional deadline
# and custom instructions. Assignments reference problems from the problem bank
# rather than owning them, so the same problem can be assigned to many classes.
#
# id            BIGINT      Primary Key, identity
# class_id      UUID        Foreign Key → classes.id, Not Null, Indexed
# problem_id    BIGINT      Foreign Key → problems.id, Not Null, Indexed
# title         VARCHAR     Nullable — defaults to the problem title if not set
# instructions  TEXT        Nullable — teacher's custom instructions for this assignment
# pack_id       VARCHAR     Nullable — optional source pack/grouping id
# assigned_at   TIMESTAMP   Auto-set to when the assignment was created
# due_at        TIMESTAMP   Nullable, Indexed — null means no deadline
# created_by    UUID        Foreign Key → users.id, Not Null — the teacher who made it
# created_at    TIMESTAMP   Auto-set on creation
# updated_at    TIMESTAMP   Auto-updated on every save
# ==============================================================================

class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    class_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), index=True)
    problem_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("problems.id", ondelete="CASCADE"), index=True)
    title: Mapped[str | None] = mapped_column(String(255))
    instructions: Mapped[str | None] = mapped_column(Text)
    pack_id: Mapped[str | None] = mapped_column(String(180))
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    created_by: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_ = relationship("Class", back_populates="assignments")
