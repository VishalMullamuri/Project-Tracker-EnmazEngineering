from datetime import date
from pydantic import BaseModel
from pydantic import model_validator

class TaskCreate(BaseModel):
    project_id: int
    assigned_to: int
    title: str
    description: str
    priority: str
    start_date: date
    due_date: date


from datetime import date
from pydantic import BaseModel, ConfigDict


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    assigned_to: int | None = None
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
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
        if field in self.model_fields_set and getattr(self, field) is None:
            raise ValueError(f"{field} cannot be null")

    return self


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