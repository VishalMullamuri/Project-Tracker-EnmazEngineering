from typing import Annotated

from pydantic import BaseModel, EmailStr, Field


class EmployeeBase(BaseModel):
    phone: str


class EmployeeCreate(EmployeeBase):
    name: str
    email: EmailStr
    password: Annotated[str, Field(min_length=12, max_length=72)]


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


class TeamMemberEmployeeResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class AssignableEmployeeResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
