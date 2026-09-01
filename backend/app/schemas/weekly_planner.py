from datetime import date, datetime
from enum import Enum

from pydantic import (
    BaseModel,
    ConfigDict,
    model_validator,
)


class WeeklyPlannerStatus(str, Enum):
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    DELAYED = "Delayed"


class WeeklyPlannerCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    task: str
    employee_id: int
    week_start: date
    status: WeeklyPlannerStatus = WeeklyPlannerStatus.NOT_STARTED
    remarks: str | None = None

    @model_validator(mode="after")
    def validate_values(self):
        if not self.task.strip():
            raise ValueError("task cannot be empty")

        if self.employee_id <= 0:
            raise ValueError("employee_id must be valid")

        return self


class WeeklyPlannerUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    task: str | None = None
    employee_id: int | None = None
    week_start: date | None = None
    status: WeeklyPlannerStatus | None = None
    remarks: str | None = None

    @model_validator(mode="after")
    def validate_values(self):
        if (
            "task" in self.model_fields_set
            and self.task is not None
            and not self.task.strip()
        ):
            raise ValueError("task cannot be empty")

        if (
            "employee_id" in self.model_fields_set
            and self.employee_id is not None
            and self.employee_id <= 0
        ):
            raise ValueError("employee_id must be valid")

        return self


class WeeklyPlannerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task: str
    employee_id: int
    employee_name: str | None = None
    week_start: date
    status: str
    remarks: str | None = None
    created_by: int
    created_at: datetime | None = None
    updated_at: datetime | None = None
