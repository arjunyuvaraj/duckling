from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.utils.db import Base # pyright: ignore[reportMissingImports]

# ==============================================================================
# SUBMISSION
# A student's attempt at solving a problem. Tracks code, execution results, and
# test case outcomes. Submissions can be practice attempts or assignment-based.
# Status progresses from draft → submitted → completed. Execution metrics and
# test results are populated after grading.
#
# id                  BIGINT      Primary Key, identity
# student_id          UUID        Foreign Key → users.id, Not Null, Indexed
# problem_id          BIGINT      Foreign Key → problems.id, Not Null, Indexed
# assignment_id       BIGINT      Nullable, Foreign Key → assignments.id, Indexed
# language            VARCHAR     Not Null — "python" | "java" | "javascript" | etc
# code                TEXT        Not Null — submitted source code
# submission_type     VARCHAR     Default "practice", Indexed — "practice" | "assignment"
# status              VARCHAR     Default "draft", Indexed — "draft" | "submitted" | "completed"
# result              VARCHAR     Nullable — "accepted" | "rejected" | "timeout" | "error" | etc
# execution_time_ms   INT         Nullable — time to run in milliseconds
# memory_used_mb      INT         Nullable — peak memory usage in megabytes
# passed_tests        INT         Nullable — number of passing test cases
# total_tests         INT         Nullable — total test cases executed
# output_json         TEXT        Nullable — serialized test case outputs as JSON
# error_message       TEXT        Nullable — compilation or runtime error details
# job_id              VARCHAR     Nullable, Indexed — external job ID from execution service
# submitted_at        TIMESTAMP   Auto-set when submitted — may differ from created_at for drafts
# completed_at        TIMESTAMP   Nullable — when grading completed
# created_at          TIMESTAMP   Auto-set on creation
# updated_at          TIMESTAMP   Auto-updated on every save
# ==============================================================================

class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        CheckConstraint("execution_time_ms > 0", name="submissions_execution_time_ms_check"),
        CheckConstraint("memory_used_mb > 0", name="submissions_memory_used_mb_check"),
        CheckConstraint("passed_tests >= 0", name="submissions_passed_tests_check"),
        CheckConstraint("total_tests > 0", name="submissions_total_tests_check"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    student_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    problem_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("problems.id", ondelete="CASCADE"), index=True)
    assignment_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("assignments.id", ondelete="SET NULL"), index=True)
    language: Mapped[str] = mapped_column(String(50))
    code: Mapped[str] = mapped_column(Text)
    submission_type: Mapped[str] = mapped_column(String(50), default="practice", index=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", index=True)
    result: Mapped[str | None] = mapped_column(String(50))
    execution_time_ms: Mapped[int | None] = mapped_column(Integer)
    memory_used_mb: Mapped[int | None] = mapped_column(Integer)
    passed_tests: Mapped[int | None] = mapped_column(Integer)
    total_tests: Mapped[int | None] = mapped_column(Integer)
    output_json: Mapped[str | None] = mapped_column(Text)
    error_message: Mapped[str | None] = mapped_column(Text)
    job_id: Mapped[str | None] = mapped_column(String(255), index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")
