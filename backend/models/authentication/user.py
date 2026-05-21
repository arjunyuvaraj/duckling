# ==============================================================================
# USER
# Represents anyone with an account. A single account can both create classes
# (as a teacher) and join classes (as a student) — no separate account types.
# Soft-deleted via deleted_at instead of removing the row.
#
# id            INT         Primary Key, Auto-increment
# email         VARCHAR     Unique, Not Null
# username      VARCHAR     Unique, Not Null
# password_hash VARCHAR     Not Null, bcrypt hash, never stored plain
# role          VARCHAR     Not Null, "student" | "teacher" | "admin"
# created_at    TIMESTAMP   Auto-set on creation
# updated_at    TIMESTAMP   Auto-updated on every save
# deleted_at    TIMESTAMP   Null means active; set to soft-delete the account
# ==============================================================================

from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), index=True, default="student")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    classes_taught = relationship("Class", back_populates="teacher")
    enrollments = relationship("Enrollment", back_populates="student")
    submissions = relationship("Submission", back_populates="student")