from datetime import date
from pydantic import BaseModel


class TaskCreate(BaseModel):
    project_id: int
    assigned_to: int
    title: str
    description: str
    priority: str
    start_date: date
    due_date: date


class TaskUpdate(BaseModel):
    assigned_to: int | None = None
    title: str | None = None
    description: str | None = None
    status: str
    priority: str | None = None
    remarks: str | None = None
    start_date: date | None = None
    due_date: date | None = None


class TaskResponse(BaseModel):
    id: int
    project_id: int
    project_name: str
    assigned_to: int
    title: str
    description: str
    status: str
    priority: str
    remarks: str | None = None
    start_date: date
    due_date: date
    created_by: int
    assigned_to_name: str | None = None

    class Config:
        from_attributes = True