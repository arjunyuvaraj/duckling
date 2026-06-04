# ==============================================================================
# USER
# Represents anyone with an account. A single account can both create classes
# (as a teacher) and join classes (as a student) — no separate account types.
# Soft-deleted via deleted_at instead of removing the row.
#
# id            UUID        Primary Key, defaults to gen_random_uuid()
# email         VARCHAR     Unique, Not Null
# username      VARCHAR     Unique, Not Null
# password_hash VARCHAR     Not Null, bcrypt hash, never stored plain
# display_name  VARCHAR     Nullable
# role          VARCHAR     Default "student" — student | teacher | student-teacher
# school_name   VARCHAR     Nullable
# bio           VARCHAR     Nullable
# created_at    TIMESTAMP   Auto-set on creation
# updated_at    TIMESTAMP   Auto-updated on every save
# deleted_at    TIMESTAMP   Null means active; set to soft-delete the account
# ==============================================================================
from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, String, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role in ('student', 'teacher', 'student-teacher')", name="users_role_check"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(80))
    role: Mapped[str] = mapped_column(String(30), default="student")
    school_name: Mapped[str | None] = mapped_column(String(120))
    bio: Mapped[str | None] = mapped_column(String(280))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    classes_taught = relationship("Class", back_populates="teacher")
    enrollments = relationship("Enrollment", back_populates="student")
    submissions = relationship("Submission", back_populates="student")
