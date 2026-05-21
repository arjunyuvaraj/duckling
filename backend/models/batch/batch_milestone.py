from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.utils.db import Base

# ==============================================================================
# BATCH_MILESTONE
# A problem assigned to a batch at a specific position in the sequence. One row
# per problem per batch. Problems can be marked as prerequisites, requiring
# completion before advancing. A batch cannot contain the same problem twice.
#
# id              INT         Primary Key, Auto-increment
# batch_id        INT         Foreign Key → batches.id, Not Null, Indexed
# problem_id      INT         Foreign Key → problems.id, Not Null
# order_index     INT         Not Null — position in the batch sequence (1, 2, 3...)
# is_prerequisite BOOL        Default False — if True, must be completed before next milestone
# created_at      TIMESTAMP   Auto-set on creation
#
# UNIQUE (batch_id, problem_id) — prevents duplicate problems in same batch
# ==============================================================================

class BatchMilestone(Base):
    __tablename__ = "batch_milestones"
    __table_args__ = (UniqueConstraint("batch_id", "problem_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), index=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"))
    order_index: Mapped[int] = mapped_column(Integer)
    is_prerequisite: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

