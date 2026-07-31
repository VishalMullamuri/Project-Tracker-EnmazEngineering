from typing import Annotated
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


class EmployeeBase(BaseModel):
    phone: str


class EmployeeCreate(EmployeeBase):
    name: str
    email: EmailStr
    password: Annotated[str, Field(min_length=12, max_length=72)]
    role: UserRole = UserRole.TEAM_MEMBER


class EmployeeUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None

class EmployeeResponse(BaseModel):
    id: int
    user_id: int | None = None

    name: str
    email: EmailStr
    phone: str

    class Config:
        from_attributes = True