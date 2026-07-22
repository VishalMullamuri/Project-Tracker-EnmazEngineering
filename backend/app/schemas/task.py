from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator


# ----------------------------------
# Base Schema
# ----------------------------------

class TaskBase(BaseModel):
    project_id: int
    assigned_to: int
    title: str
    description: Optional[str] = None
    priority: str
    start_date: date
    due_date: date

    @model_validator(mode="after")
    def validate_dates(self):
        if self.due_date < self.start_date:
            raise ValueError("Due date cannot be earlier than the start date.")
        return self


# ----------------------------------
# Create Task
# ----------------------------------

class TaskCreate(TaskBase):
    pass


# ----------------------------------
# Update Task
# ----------------------------------

class TaskUpdate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: int
    status: str
    priority: str
    remarks: Optional[str] = None
    start_date: date
    due_date: date

    @model_validator(mode="after")
    def validate_dates(self):
        if self.due_date < self.start_date:
            raise ValueError("Due date cannot be earlier than the start date.")
        return self


# ----------------------------------
# Response Schema
# ----------------------------------

class TaskResponse(BaseModel):
    id: int
    project_id: int
    project_name: Optional[str] = None

    assigned_to: int
    assigned_to_name: Optional[str] = None

    title: str
    description: Optional[str] = None

    status: str
    priority: str
    remarks: Optional[str] = None

    start_date: date
    due_date: date

    created_by: int

    model_config = ConfigDict(from_attributes=True)