from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class DailyWorksheet(Base):
    __tablename__ = "daily_worksheets"
    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "worksheet_date",
            name="uq_daily_worksheets_employee_date",
        ),
        Index(
            "ix_daily_worksheets_employee_date",
            "employee_id",
            "worksheet_date",
        ),
    )

    id = Column(Integer, primary_key=True)
    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )
    worksheet_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", foreign_keys=[employee_id])

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

    id = Column(Integer, primary_key=True)
    worksheet_id = Column(
        Integer,
        ForeignKey("daily_worksheets.id", ondelete="CASCADE"),
        nullable=False,
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Not Started")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    worksheet = relationship("DailyWorksheet", back_populates="tasks")