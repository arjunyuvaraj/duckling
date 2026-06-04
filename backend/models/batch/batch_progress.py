from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.utils.db import Base

# ==============================================================================
# BATCH_PROGRESS
# Tracks a student's progress through a specific milestone in a batch. One row
# per student per milestone per batch. Status indicates if milestone is locked,
# in progress, or completed. Prevents duplicate progress entries for same student/
# batch/milestone combination.
#
# id              INT         Primary Key, Auto-increment
# student_id      INT         Foreign Key → users.id, Not Null, Indexed
# batch_id        INT         Foreign Key → batches.id, Not Null, Indexed
# milestone_id    INT         Foreign Key → batch_milestones.id, Not Null
# status          VARCHAR     Default "locked" — "locked" | "in_progress" | "completed"
# completed_at    TIMESTAMP   Nullable — when the milestone was completed
# created_at      TIMESTAMP   Auto-set on creation
#
# UNIQUE (student_id, milestone_id) — prevents duplicate progress entries
# ==============================================================================

class BatchProgress(Base):
    __tablename__ = "batch_progress"
    __table_args__ = (UniqueConstraint("student_id", "milestone_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    student_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    batch_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("batches.id", ondelete="CASCADE"), index=True)
    milestone_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("batch_milestones.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(50), default="locked")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
