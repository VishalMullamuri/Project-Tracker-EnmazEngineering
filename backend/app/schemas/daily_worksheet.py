from datetime import date
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class DailyWorksheetTaskStatus(str, Enum):
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class DailyWorksheetTaskBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    status: DailyWorksheetTaskStatus = DailyWorksheetTaskStatus.NOT_STARTED
    remarks: str | None = None

    model_config = ConfigDict(extra="forbid")


class DailyWorksheetTaskCreate(DailyWorksheetTaskBase):
    pass


class DailyWorksheetTaskUpdate(DailyWorksheetTaskBase):
    id: int | None = None


class DailyWorksheetTaskResponse(DailyWorksheetTaskBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class DailyWorksheetUpdate(BaseModel):
    tasks: list[DailyWorksheetTaskUpdate] = []


class DailyWorksheetResponse(BaseModel):
    employee_name: str
    id: int
    employee_id: int
    worksheet_date: date
    tasks: list[DailyWorksheetTaskResponse] = []

    model_config = ConfigDict(
        from_attributes=True,
    )