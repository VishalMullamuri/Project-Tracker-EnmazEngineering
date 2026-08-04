from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    UniqueConstraint,
)

from app.database.database import Base


class ProjectEmployee(Base):

    __tablename__ = "project_employees"

    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "employee_id",
            name="uq_project_employee",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    project_id = Column(
        Integer,
        ForeignKey(
            "projects.id",
            ondelete="CASCADE",
        ),
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