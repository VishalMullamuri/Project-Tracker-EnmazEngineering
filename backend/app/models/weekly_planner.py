from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.sql import func

from app.database.database import Base


class WeeklyPlanner(Base):
    __tablename__ = "weekly_planner"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    task = Column(
        String(200),
        nullable=False,
    )

    employee_id = Column(
        Integer,
        ForeignKey(
            "employees.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    week_start = Column(
        Date,
        nullable=False,
        index=True,
    )

    status = Column(
        String(50),
        nullable=False,
        default="Not Started",
    )

    remarks = Column(
        String(500),
        nullable=True,
    )

    created_by = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
