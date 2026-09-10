from datetime import date

from pydantic import BaseModel, ConfigDict


class DailyWorksheetTaskBase(BaseModel):
    title: str
    description: str | None = None
    status: str = "Not Started"
    remarks: str | None = None


class DailyWorksheetTaskCreate(DailyWorksheetTaskBase):
    pass


class DailyWorksheetTaskUpdate(DailyWorksheetTaskBase):
    id: int | None = None


class DailyWorksheetTaskResponse(DailyWorksheetTaskBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class DailyWorksheetCreate(BaseModel):
    worksheet_date: date
    tasks: list[DailyWorksheetTaskCreate] = []


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