from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, default=True)

    employee_memberships = relationship(
        "EmployeeDepartment",
        back_populates="department",
        cascade="all, delete-orphan",
    )