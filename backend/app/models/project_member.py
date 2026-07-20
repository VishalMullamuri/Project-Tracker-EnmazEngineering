from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    DateTime,
)

from sqlalchemy.sql import func

from app.database.database import Base


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    assigned_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )