
from datetime import datetime

from pydantic import BaseModel, Field

from app.core.enums import TicketPriority, TicketStatus


class DepartmentResponse(BaseModel):
    id: int
    name: str
    is_active: bool

    class Config:
        from_attributes = True


class DepartmentEmployeeResponse(BaseModel):
    id: int
    user_id: int | None = None
    name: str
    email: str

    class Config:
        from_attributes = True


class SupportTicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=1)
    category: str | None = Field(default=None, max_length=100)
    priority: TicketPriority = TicketPriority.MEDIUM
    department_id: int


class SupportTicketAssignment(BaseModel):
    assigned_to: int | None = None


class SupportTicketStatusUpdate(BaseModel):
    status: TicketStatus
    resolution_note: str | None = None


class TicketCommentCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=10000)


class TicketCommentResponse(BaseModel):
    id: int
    ticket_id: int
    employee_id: int
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True


class TicketActivityResponse(BaseModel):
    id: int
    ticket_id: int
    employee_id: int
    action: str
    details: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class SupportTicketResponse(BaseModel):
    id: int
    ticket_number: str
    title: str
    description: str
    category: str | None = None
    priority: TicketPriority
    status: TicketStatus
    created_by: int
    department_id: int
    assigned_to: int | None = None
    resolution_note: str | None = None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    closed_at: datetime | None = None

    class Config:
        from_attributes = True
