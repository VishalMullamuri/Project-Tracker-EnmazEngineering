from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
)

from app.database.database import Base


class ProjectEmployee(Base):

    __tablename__ = "project_employees"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False,
    )

    employee_id = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=False,
    )