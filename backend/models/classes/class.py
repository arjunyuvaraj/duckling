# ==============================================================================
# CLASS
# A classroom created by a teacher that students join using a unique code.
# A single account can create and join multiple classes. Soft-deleted by setting
# is_active to false rather than removing the row.
#
# id              INT         Primary Key, Auto-increment
# teacher_id      INT         Foreign Key → users.id, Not Null, Indexed
# name            VARCHAR     Not Null — display name of the class
# description     TEXT        Nullable — optional description of the class
# code            VARCHAR     Unique, Indexed — 6-char join code e.g. "xB7kQ2"
# language_focus  VARCHAR     Nullable — "python" | "java" | "javascript" | null for mixed
# is_active       BOOL        Default True — set to False to soft-delete the class
# created_at      TIMESTAMP   Auto-set on creation
# updated_at      TIMESTAMP   Auto-updated on every save
# ==============================================================================

from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.utils.db import Base


class Class(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    language_focus: Mapped[str | None] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    teacher = relationship("User", back_populates="classes_taught")
    enrollments = relationship("Enrollment", back_populates="class_")
    assignments = relationship("Assignment", back_populates="class_")
