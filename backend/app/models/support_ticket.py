from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.core.enums import TicketPriority, TicketStatus


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)

    ticket_number = Column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)

    priority = Column(
        SQLEnum(TicketPriority, name="ticket_priority"),
        nullable=False,
        default=TicketPriority.MEDIUM,
    )

    status = Column(
        SQLEnum(TicketStatus, name="ticket_status"),
        nullable=False,
        default=TicketStatus.OPEN,
    )

    created_by = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=False,
        index=True,
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False,
        index=True,
    )

    assigned_to = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=True,
        index=True,
    )

    resolution_note = Column(Text, nullable=True)

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

    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    deleted_by = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=True,
    )

    creator = relationship(
        "Employee",
        foreign_keys=[created_by],
    )

    assignee = relationship(
        "Employee",
        foreign_keys=[assigned_to],
    )

    department = relationship("Department")

    comments = relationship(
        "TicketComment",
        back_populates="ticket",
        cascade="all, delete-orphan",
    )

    activities = relationship(
        "TicketActivity",
        back_populates="ticket",
        cascade="all, delete-orphan",
    )