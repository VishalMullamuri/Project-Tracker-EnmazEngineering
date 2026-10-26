from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class TicketActivity(Base):
    __tablename__ = "ticket_activities"

    id = Column(Integer, primary_key=True, index=True)

    ticket_id = Column(
        Integer,
        ForeignKey("support_tickets.id"),
        nullable=False,
        index=True,
    )

    employee_id = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=False,
    )

    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    ticket = relationship("SupportTicket", back_populates="activities")
    employee = relationship("Employee")