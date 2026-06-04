from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base

# ==============================================================================
# TEST_CASE
# Input/output pair used to validate submissions against a problem. Multiple test
# cases per problem allow comprehensive testing. Test cases can be hidden (not shown
# to students) or visible (used for examples). Language-specific if applicable.
#
# id                      INT         Primary Key, Auto-increment
# problem_id              INT         Foreign Key → problems.id, Not Null, Indexed
# language                VARCHAR     Nullable — applies to specific language or all if null
# input_json              TEXT        Not Null — serialized input data as JSON
# expected_output_json    TEXT        Not Null — serialized expected output as JSON
# is_hidden               BOOL        Default False, Indexed — set to True for hidden grading tests
# created_at              TIMESTAMP   Auto-set on creation
# ==============================================================================

class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    problem_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("problems.id", ondelete="CASCADE"), index=True)
    language: Mapped[str | None] = mapped_column(String(50))
    input_json: Mapped[str] = mapped_column(Text)
    expected_output_json: Mapped[str] = mapped_column(Text)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    problem = relationship("Problem", back_populates="test_cases")
