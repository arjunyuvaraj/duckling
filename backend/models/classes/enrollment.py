from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.utils.db import Base

# ==============================================================================
# ENROLLMENT
# The link between a student and a class. One row per student per class.
# Created when a student joins using a class code. Deleted when a student
# is removed from a class. A student cannot be enrolled in the same class twice.
#
# id          INT         Primary Key, Auto-increment
# class_id    INT         Foreign Key → classes.id, Not Null, Indexed
# student_id  INT         Foreign Key → users.id, Not Null, Indexed
# enrolled_at TIMESTAMP   Auto-set to when the student joined
#
# UNIQUE (class_id, student_id) — prevents duplicate enrollments
# ==============================================================================

class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("class_id", "student_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    class_ = relationship("Class", back_populates="enrollments")
    student = relationship("User", back_populates="enrollments")