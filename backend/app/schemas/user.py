from typing import Annotated
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: Annotated[str, Field(min_length=12, max_length=72)]
    role: UserRole = UserRole.TEAM_MEMBER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: Annotated[str, Field(min_length=12, max_length=72)]

class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    first_login: bool


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    first_login: bool

    class Config:
        from_attributes = True