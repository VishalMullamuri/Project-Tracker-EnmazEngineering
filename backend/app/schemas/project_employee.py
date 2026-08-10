from pydantic import BaseModel


class ProjectEmployeeCreate(BaseModel):
    project_id: int
    employee_id: int


class ProjectEmployeeResponse(BaseModel):
    id: int
    project_id: int
    employee_id: int

    class Config:
        from_attributes = True
