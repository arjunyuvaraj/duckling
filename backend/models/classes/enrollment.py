from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.utils.db import Base

# ==============================================================================
# ENROLLMENT
# The link between a student and a class. One row per student per class.
# Created when a student joins using a class code. Deleted when a student
# is removed from a class. A student cannot be enrolled in the same class twice.
#
# id          BIGINT      Primary Key, identity
# class_id    UUID        Foreign Key → classes.id, Not Null
# student_id  UUID        Foreign Key → users.id, Not Null, Indexed
# enrolled_at TIMESTAMP   Auto-set to when the student joined
#
# UNIQUE (class_id, student_id) — prevents duplicate enrollments
# ==============================================================================

class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("class_id", "student_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    class_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"))
    student_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    class_ = relationship("Class", back_populates="enrollments")
    student = relationship("User", back_populates="enrollments")
