from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class EmployeeBase(BaseModel):
    phone: str


class EmployeeCreate(EmployeeBase):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.TEAM_MEMBER


class EmployeeUpdate(BaseModel):
    name: str
    email: EmailStr
    phone: str


class EmployeeResponse(BaseModel):
    id: int
    user_id: int | None = None

    name: str
    email: EmailStr
    phone: str

    class Config:
        from_attributes = True