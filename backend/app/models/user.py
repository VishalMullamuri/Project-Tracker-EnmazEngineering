from enum import Enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
)
from sqlalchemy import (
    Enum as SqlEnum,
)
from sqlalchemy.sql import func

from app.database.database import Base


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    TEAM_MEMBER = "TEAM_MEMBER"


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password = Column(
        String(255),
        nullable=False,
    )

    role = Column(
        SqlEnum(
            UserRole,
            name="userrole",
            create_type=False,
        ),
        nullable=False,
        default=UserRole.TEAM_MEMBER,
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    first_login = Column(
        Boolean,
        default=True,
    )

    token_version = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
