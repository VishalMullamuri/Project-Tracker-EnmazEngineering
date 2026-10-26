from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database.database import Base


class EmployeeDepartment(Base):
    __tablename__ = "employee_departments"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "department_id",
            name="uq_employee_department",
        ),
    )

    employee = relationship(
        "Employee",
        back_populates="department_memberships",
    )

    department = relationship(
        "Department",
        back_populates="employee_memberships",
    )