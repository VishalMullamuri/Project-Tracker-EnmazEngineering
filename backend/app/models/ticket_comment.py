from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class TicketComment(Base):
    __tablename__ = "ticket_comments"

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

    comment = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    ticket = relationship("SupportTicket", back_populates="comments")
    employee = relationship("Employee")