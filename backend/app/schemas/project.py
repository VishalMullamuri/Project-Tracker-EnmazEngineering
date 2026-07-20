from datetime import date
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    project_name: str
    description: str
    status: str
    start_date: date
    end_date: date


class ProjectUpdate(BaseModel):
    project_name: str
    description: str
    status: str
    start_date: date
    end_date: date


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