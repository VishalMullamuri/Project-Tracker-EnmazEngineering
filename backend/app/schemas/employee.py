from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    phone: str


class EmployeeCreate(EmployeeBase):
    password: str
    role: UserRole = UserRole.TEAM_MEMBER


class EmployeeUpdate(EmployeeBase):
    pass


class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int | None = None

    class Config:
        from_attributes = True