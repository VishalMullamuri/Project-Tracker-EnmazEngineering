
from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.core.enums import UserRole
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
    )

    phone = Column(
        String,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=True,
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    user = relationship(
        "User",
        foreign_keys=[user_id],
    )

    department_memberships = relationship(
        "EmployeeDepartment",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    @property
    def role(self) -> UserRole | None:
        return self.user.role if self.user else None

    @property
    def department_names(self) -> list[str]:
        return [
            membership.department.name
            for membership in self.department_memberships
            if membership.department is not None
            and membership.department.is_active
        ]
