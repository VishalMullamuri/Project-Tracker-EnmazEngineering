from datetime import date
from typing import Optional

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    project_name: str
    description: str
    start_date: date
    end_date: date


from pydantic import BaseModel, ConfigDict, model_validator


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project_name: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_nulls(self):
        for field in (
            "project_name",
            "description",
            "status",
            "start_date",
            "end_date",
        ):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")

        return self


class ProjectResponse(BaseModel):
    id: int
    project_name: str
    description: str
    status: str
    progress: int
    start_date: date
    end_date: date
    created_by: int

    class Config:
        from_attributes = True