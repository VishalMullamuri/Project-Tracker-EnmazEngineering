from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class DailyWorksheet(Base):
    __tablename__ = "daily_worksheets"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    employee_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    worksheet_date = Column(
        Date,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    employee = relationship(
        "User",
        foreign_keys=[employee_id],
    )

    @property
    def employee_name(self):
        return self.employee.name if self.employee else ""

    tasks = relationship(
        "DailyWorksheetTask",
        back_populates="worksheet",
        cascade="all, delete-orphan",
    )


class DailyWorksheetTask(Base):
    __tablename__ = "daily_worksheet_tasks"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    worksheet_id = Column(
        Integer,
        ForeignKey(
            "daily_worksheets.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String(50),
        nullable=False,
        default="Not Started",
    )

    remarks = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    worksheet = relationship(
        "DailyWorksheet",
        back_populates="tasks",
    )