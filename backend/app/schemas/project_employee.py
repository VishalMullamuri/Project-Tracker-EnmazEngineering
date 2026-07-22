from pydantic import BaseModel
from pydantic import BaseModel

class ProjectEmployeesUpdate(BaseModel):
    employee_ids: list[int]

class ProjectEmployeeCreate(BaseModel):
    project_id: int
    employee_id: int


class ProjectEmployeeResponse(BaseModel):
    id: int
    project_id: int
    employee_id: int

    class Config:
        from_attributes = True