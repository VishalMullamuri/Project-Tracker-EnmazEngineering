from datetime import date
from enum import Enum

from pydantic import (
    BaseModel,
    ConfigDict,
    model_validator,
)


class TaskPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class TaskStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project_id: int
    assigned_to: int
    title: str
    description: str
    priority: TaskPriority
    start_date: date
    due_date: date

    @model_validator(mode="after")
    def validate_nulls(self):
        for field in (
            "project_id",
            "assigned_to",
            "title",
            "description",
            "priority",
            "start_date",
            "due_date",
        ):
            if (
                field in self.model_fields_set
                and getattr(self, field) is None
            ):
                raise ValueError(f"{field} cannot be null")

        return self


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    assigned_to: int | None = None
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    remarks: str | None = None
    start_date: date | None = None
    due_date: date | None = None

    @model_validator(mode="after")
    def validate_nulls(self):
        for field in (
            "assigned_to",
            "title",
            "description",
            "status",
            "priority",
            "start_date",
            "due_date",
        ):
            if (
                field in self.model_fields_set
                and getattr(self, field) is None
            ):
                raise ValueError(f"{field} cannot be null")

        return self


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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